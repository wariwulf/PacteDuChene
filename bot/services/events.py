from __future__ import annotations

import asyncio
import io
import logging
from pathlib import PurePosixPath
from typing import Any

import discord

from api.client import PacteApiClient, PacteApiError

LOGGER = logging.getLogger(__name__)


def event_data(payload: dict[str, Any]) -> dict[str, Any]:
    data = payload.get("data", payload)
    return data if isinstance(data, dict) else {}


def format_dt(value: str | None) -> str:
    if not value:
        return "Date inconnue"
    return f"<t:{int(__import__('datetime').datetime.fromisoformat(value.replace('Z','+00:00')).timestamp())}:F>"


class EventParticipationView(discord.ui.View):
    def __init__(self, service: "DiscordEventService", event_id: str, options: dict[str, Any]):
        super().__init__(timeout=None)
        self.service = service
        self.event_id = event_id
        if options.get("accepted", True):
            self.add_item(EventButton(service, event_id, "ACCEPTED", "Je participe", discord.ButtonStyle.success))
        if options.get("maybe", True):
            self.add_item(EventButton(service, event_id, "MAYBE", "Peut-être", discord.ButtonStyle.secondary))
        if options.get("declined", True):
            self.add_item(EventButton(service, event_id, "DECLINED", "Je ne participe pas", discord.ButtonStyle.danger))


class EventButton(discord.ui.Button):
    def __init__(self, service: "DiscordEventService", event_id: str, status: str, label: str, style: discord.ButtonStyle):
        super().__init__(label=label, style=style, custom_id=f"pacte:event:{event_id}:{status}")
        self.service = service
        self.event_id = event_id
        self.status = status

    async def callback(self, interaction: discord.Interaction) -> None:
        await interaction.response.defer(ephemeral=True)
        try:
            result = await self.service.participate(self.event_id, interaction.user.id, self.status)
            counts = result.get("counts", {}) if isinstance(result, dict) else {}
            await interaction.followup.send(
                f"Réponse enregistrée : **{self.label}**.\n"
                f"Participants : {counts.get('ACCEPTED', '?')} · Peut-être : {counts.get('MAYBE', '?')} · Absents : {counts.get('DECLINED', '?')}",
                ephemeral=True,
            )
            await self.service.refresh_message(self.event_id)
        except PacteApiError as error:
            await interaction.followup.send(f"❌ {error}", ephemeral=True)


class DiscordEventService:
    def __init__(self, bot: discord.Client, api: PacteApiClient, guild_id: int, poll_seconds: int = 20, site_url: str = "http://localhost:3000") -> None:
        self.bot = bot
        self.api = api
        self.guild_id = guild_id
        self.poll_seconds = max(15, poll_seconds)
        self.site_url = site_url.rstrip("/")
        self._task: asyncio.Task[None] | None = None
        self._registered: set[str] = set()
        self._last_updated: dict[str, str] = {}
        self._last_image_source: dict[str, str] = {}
        self._discord_image_url: dict[str, str] = {}

    def start(self) -> None:
        if self._task is None or self._task.done():
            self._task = asyncio.create_task(self._loop(), name="pacte-event-scheduler")

    async def stop(self) -> None:
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
            self._task = None

    async def _loop(self) -> None:
        await self._sync_active_views()
        while True:
            try:
                await self.poll_once()
            except Exception:
                LOGGER.exception("Erreur du planificateur des événements Discord")
            await asyncio.sleep(self.poll_seconds)

    async def poll_once(self) -> None:
        payload = await self.api.get("/clan-events/internal/bot/actions")
        data = event_data(payload)
        for item in data.get("publish", []):
            event = item.get("event")
            if isinstance(event, dict):
                await self.publish(event)
        for item in data.get("reminders", []):
            event = item.get("event")
            if isinstance(event, dict):
                await self.remind(event)
        for item in data.get("cleanup", []):
            if isinstance(item, dict):
                await self.cleanup(item)
        await self._sync_active_views()

    async def _sync_active_views(self) -> None:
        try:
            payload = await self.api.get("/clan-events/internal/bot/active")
            raw_events = payload.get("data", [])
            events = raw_events if isinstance(raw_events, list) else []
            for event in events:
                if not isinstance(event, dict):
                    continue
                event_id = str(event.get("eventId", ""))
                message_id = str(event.get("discordMessageId", ""))
                if not event_id or not message_id:
                    continue

                if event_id not in self._registered:
                    self.bot.add_view(
                        EventParticipationView(self, event_id, event.get("participationOptions") or {}),
                        message_id=int(message_id),
                    )
                    self._registered.add(event_id)
                    # Une première synchronisation permet notamment de réparer
                    # les anciens messages qui ont été publiés sans image.
                    await self.refresh_message(event_id)
                    continue

                # Ne pas dépendre uniquement de updatedAt : certaines modifications
                # peuvent ne pas être reflétées immédiatement par le champ de timestamp.
                fingerprint = self.event_fingerprint(event)
                previous = self._last_updated.get(event_id)
                if fingerprint != previous:
                    await self.refresh_message(event_id)
                    self._last_updated[event_id] = fingerprint
        except Exception:
            LOGGER.exception("Impossible de synchroniser les événements actifs")

    async def resolve_channel(self, event: dict[str, Any]) -> discord.TextChannel | discord.Thread | None:
        guild = self.bot.get_guild(self.guild_id)
        if guild is None:
            return None
        raw = str(event.get("discordChannelId") or event.get("discordChannel") or "").strip()
        if not raw:
            return None
        if raw.isdigit():
            channel = guild.get_channel(int(raw))
            if isinstance(channel, (discord.TextChannel, discord.Thread)):
                return channel
        name = raw.removeprefix("#").lower()
        for channel in guild.text_channels:
            if channel.name.lower() == name:
                return channel
        return None

    def absolute_media_url(self, value: str) -> str:
        if value.startswith("http://") or value.startswith("https://"):
            return value
        return self.site_url + (value if value.startswith("/") else "/" + value)

    def maybe_emoji(self) -> str:
        guild = self.bot.get_guild(self.guild_id)
        if guild:
            emoji = discord.utils.get(guild.emojis, name="quoi")
            if emoji:
                return str(emoji)
        return "❔"

    def participant_name(self, entry: Any) -> str:
        if isinstance(entry, dict):
            discord_id = str(entry.get("discordId") or "").strip()
            if discord_id.isdigit():
                member = self.bot.get_guild(self.guild_id).get_member(int(discord_id)) if self.bot.get_guild(self.guild_id) else None
                if member:
                    return member.display_name
            return str(entry.get("name") or "Membre")
        return str(entry)

    def event_fingerprint(self, event: dict[str, Any], payload: dict[str, Any] | None = None) -> str:
        import json
        relevant = {
            "title": event.get("title"),
            "description": event.get("description"),
            "type": event.get("type"),
            "mode": event.get("mode"),
            "startsAt": event.get("startsAt"),
            "endsAt": event.get("endsAt"),
            "durationMinutes": event.get("durationMinutes"),
            "location": event.get("location"),
            "imageUrl": event.get("imageUrl"),
            "objectives": event.get("objectives") or [],
            "rewards": event.get("rewards") or [],
            "participationOptions": event.get("participationOptions") or {},
            "reminderMinutes": event.get("reminderMinutes"),
            "status": event.get("status"),
        }
        if payload:
            relevant["counts"] = payload.get("counts") or {}
            relevant["participants"] = payload.get("participants") or {}
        return json.dumps(relevant, sort_keys=True, ensure_ascii=False, default=str)

    def build_embed(
        self,
        event: dict[str, Any],
        counts: dict[str, Any] | None = None,
        participants: dict[str, list[str]] | None = None,
        reminder: bool = False,
        image_url: str | None = None,
    ) -> discord.Embed:
        mode = "Mission longue" if event.get("mode") == "LONG" else "Action"
        title = ("⏰ Rappel — " if reminder else "") + str(event.get("title", "Événement du Pacte"))
        site_event_url = f"{self.site_url}/espace-membre/evenements#event-{event.get('eventId', '')}"
        description = str(event.get("description") or "Aucune description.")
        description += f"\n\n[🌐 Voir l’événement dans l’espace membre]({site_event_url})"
        embed = discord.Embed(title=title, description=description, color=discord.Color.gold())
        embed.add_field(name="Début", value=format_dt(event.get("startsAt")), inline=True)
        duration = event.get("durationMinutes")
        embed.add_field(name="Durée", value=f"{duration} min" if duration else "—", inline=True)
        embed.add_field(name="Nature", value=mode, inline=True)
        if event.get("location"):
            embed.add_field(name="Lieu", value=str(event["location"]), inline=True)

        objectives = event.get("objectives") or []
        if objectives:
            lines = []
            for objective in objectives[:10]:
                marker = "◆" if objective.get("required", True) else "◇"
                objective_title = str(objective.get("title") or "Objectif")
                objective_description = str(objective.get("description") or "").strip()
                lines.append(f"{marker} **{objective_title}**" + (f"\n{objective_description}" if objective_description else ""))
            embed.add_field(name="Objectifs", value="\n\n".join(lines)[:1024], inline=False)

        rewards = event.get("rewards") or []
        if rewards:
            text = "\n".join(
                f"{r.get('amount', 0)} {r.get('currencyId', '')}" + (f" — {r.get('label')}" if r.get('label') else "")
                for r in rewards[:10]
            )
            embed.add_field(name="Récompenses", value=text[:1024], inline=False)

        maybe = self.maybe_emoji()

        if participants is not None:
            labels = [
                ("ACCEPTED", "✅ Participants"),
                ("MAYBE", f"{maybe} Peut-être"),
                ("DECLINED", "❌ Ne participent pas"),
            ]
            for status, label in labels:
                entries = participants.get(status, []) or []
                names = [self.participant_name(entry) for entry in entries]
                if len(names) > 20:
                    names = names[:20] + [f"… et {len(names) - 20} autre(s)"]
                value = "\n".join(f"• {name}" for name in names) if names else "Personne pour le moment"
                embed.add_field(name=f"{label} — {len(entries)}", value=value[:1024], inline=True)

        if image_url:
            embed.set_image(url=image_url)
        embed.set_footer(text="Le Pacte du Chêne · Répondez ici ou depuis l’espace membre")
        return embed

    def image_filename(self, source: str) -> str:
        suffix = PurePosixPath(source.split("?", 1)[0]).suffix.lower()
        if suffix not in {".png", ".jpg", ".jpeg", ".webp", ".gif"}:
            suffix = ".png"
        return f"pacte-event-{abs(hash(source)) % 100000000}{suffix}"

    async def download_image_file(self, source: str) -> tuple[discord.File | None, str | None]:
        if not source:
            return None, None
        try:
            data = await self.api.get_bytes(source)
            filename = self.image_filename(source)
            return discord.File(io.BytesIO(data), filename=filename), f"attachment://{filename}"
        except Exception:
            LOGGER.exception("Impossible de télécharger l'image de l'événement (%s)", source)
            return None, None

    async def publish(self, event: dict[str, Any]) -> None:
        channel = await self.resolve_channel(event)
        if channel is None:
            LOGGER.error("Salon Discord introuvable pour l'événement %s", event.get("eventId"))
            return
        try:
            detail_payload = event_data(await self.api.get(f"/clan-events/internal/bot/{event['eventId']}"))
            detail = detail_payload.get("event", event)
            counts = detail_payload.get("counts", {})
            participants = detail_payload.get("participants", {})

            image_url = None
            if detail.get("imageUrl"):
                image_url = self.absolute_media_url(str(detail["imageUrl"]))

            embed = self.build_embed(detail, counts, participants, image_url=image_url)
            kwargs: dict[str, Any] = {
                "embed": embed,
                "view": EventParticipationView(self, str(detail["eventId"]), detail.get("participationOptions") or {}),
            }
            message = await channel.send(**kwargs)

            self._last_image_source[str(detail["eventId"])] = str(detail.get("imageUrl") or "")
            if message.embeds and message.embeds[0].image.url:
                self._discord_image_url[str(detail["eventId"])] = message.embeds[0].image.url

            await self.api.post(
                f"/clan-events/internal/bot/{detail['eventId']}/published",
                {"guildId": str(self.guild_id), "channelId": str(channel.id), "messageId": str(message.id)},
            )
            event_key = str(detail["eventId"])
            self._registered.add(event_key)
            self._last_updated[event_key] = str(detail.get("updatedAt", ""))
        except Exception:
            LOGGER.exception("Impossible de publier l'événement %s", event.get("eventId"))

    async def remind(self, event: dict[str, Any]) -> None:
        channel = await self.resolve_channel(event)
        if channel is None:
            return

        try:
            detail_payload = event_data(await self.api.get(f"/clan-events/internal/bot/{event['eventId']}"))
            detail = detail_payload.get("event", event)
            participants = detail_payload.get("participants", {}) or {}

            main_message_id = detail.get("discordMessageId")
            if not main_message_id:
                LOGGER.warning("Impossible de créer le fil de rappel : message principal absent pour %s", event.get("eventId"))
                return

            main_channel = channel
            if isinstance(channel, discord.Thread):
                main_channel = channel.parent or channel
            if not isinstance(main_channel, discord.TextChannel):
                LOGGER.error("Le canal de l'événement %s n'est pas un salon textuel.", event.get("eventId"))
                return

            main_message = await main_channel.fetch_message(int(main_message_id))
            thread = await main_message.create_thread(name=f"⏰ Rappel — {str(detail.get('title', 'Événement'))}"[:100])

            image_file = None
            image_url = None
            if detail.get("imageUrl"):
                image_file, image_url = await self.download_image_file(str(detail["imageUrl"]))

            mention_entries = []
            for status in ("ACCEPTED", "MAYBE"):
                for participant in participants.get(status, []) or []:
                    if isinstance(participant, dict) and participant.get("discordId"):
                        mention_entries.append(f"<@{participant['discordId']}>")
            # Un joueur ne doit être pingé qu'une seule fois, même si les données sont dupliquées.
            mentions = list(dict.fromkeys(mention_entries))
            content = " ".join(mentions) if mentions else None

            kwargs: dict[str, Any] = {
                "content": content,
                "embed": self.build_embed(detail, detail_payload.get("counts", {}), participants, reminder=True, image_url=image_url),
                "allowed_mentions": discord.AllowedMentions(users=True, roles=False, everyone=False, replied_user=False),
            }
            if image_file is not None:
                kwargs["file"] = image_file
            message = await thread.send(**kwargs)
            await self.api.post(
                f"/clan-events/internal/bot/{event['eventId']}/reminder-sent",
                {"messageId": str(message.id), "threadId": str(thread.id)},
            )
        except Exception:
            LOGGER.exception("Impossible d'envoyer le rappel de l'événement %s", event.get("eventId"))

    async def cleanup(self, item: dict[str, Any]) -> None:
        channel_id = item.get("discordChannelId")
        all_ok = True
        if channel_id:
            channel = self.bot.get_channel(int(channel_id))
            thread_id = item.get("discordReminderThreadId")
            if thread_id:
                thread = self.bot.get_channel(int(thread_id))
                if isinstance(thread, discord.Thread):
                    try:
                        await thread.delete()
                    except discord.NotFound:
                        pass
                    except discord.HTTPException:
                        all_ok = False
                        LOGGER.exception("Impossible de supprimer le fil Discord %s", thread_id)
            for key in ("discordMessageId",):
                value = item.get(key)
                if not value or not isinstance(channel, (discord.TextChannel, discord.Thread)):
                    continue
                try:
                    message = await channel.fetch_message(int(value))
                    await message.delete()
                except discord.NotFound:
                    pass
                except discord.HTTPException:
                    all_ok = False
                    LOGGER.exception("Impossible de supprimer le message Discord %s", value)
        if all_ok:
            try:
                await self.api.post(f"/clan-events/internal/bot/{item['eventId']}/cleanup-complete", {})
                self._registered.discard(str(item["eventId"]))
                self._last_updated.pop(str(item["eventId"]), None)
            except PacteApiError:
                LOGGER.exception("Impossible de confirmer l'archivage de l'événement %s", item.get("eventId"))

    async def participate(self, event_id: str, discord_id: int, status: str) -> dict[str, Any]:
        payload = await self.api.post(f"/clan-events/internal/bot/{event_id}/participation", {"discordId": str(discord_id), "status": status})
        data = event_data(payload)
        detail = await self.api.get(f"/clan-events/internal/bot/{event_id}")
        detail_data = event_data(detail)
        data["counts"] = detail_data.get("counts", {})
        return data

    async def refresh_message(self, event_id: str) -> None:
        try:
            payload = event_data(await self.api.get(f"/clan-events/internal/bot/{event_id}"))
            event = payload.get("event")
            if not isinstance(event, dict):
                return
            message_id = event.get("discordMessageId")
            channel_id = event.get("discordChannelId")
            if not message_id or not channel_id:
                return
            channel = self.bot.get_channel(int(channel_id))
            if not isinstance(channel, (discord.TextChannel, discord.Thread)):
                return
            message = await channel.fetch_message(int(message_id))

            source = str(event.get("imageUrl") or "")
            image_url = self.absolute_media_url(source) if source else None

            embed = self.build_embed(
                event,
                payload.get("counts", {}),
                payload.get("participants", {}),
                image_url=image_url,
            )
            kwargs: dict[str, Any] = {
                "embed": embed,
                "view": EventParticipationView(self, event_id, event.get("participationOptions") or {}),
            }

            # L'image principale est désormais uniquement celle de l'embed.
            # Supprime une éventuelle ancienne pièce jointe du message.
            if message.attachments:
                kwargs["attachments"] = []

            await message.edit(**kwargs)
            self._last_image_source[event_id] = source
            if message.embeds and message.embeds[0].image.url:
                self._discord_image_url[event_id] = str(message.embeds[0].image.url)
            self._last_updated[event_id] = self.event_fingerprint(event, payload)
        except Exception:
            LOGGER.exception("Impossible de mettre à jour le message Discord de l’événement %s", event_id)
