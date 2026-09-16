from __future__ import annotations

import asyncio
import logging
from typing import Any

import discord

from api.client import PacteApiClient

LOGGER = logging.getLogger(__name__)

STATUS_LABELS = {
    "PENDING": "🟡 En attente",
    "IN_PROGRESS": "🔨 En cours",
    "ACCEPTED": "🟠 Acceptée",
    "READY": "📦 Prête",
    "COMPLETED": "📦 Livrée",
    "REFUSED": "❌ Refusée",
    "CANCELLED": "⚫ Annulée",
}


class DiscordOrderService:
    def __init__(self, bot: discord.Client, api: PacteApiClient, guild_id: int, site_url: str, poll_seconds: int = 5) -> None:
        self.bot = bot
        self.api = api
        self.guild_id = guild_id
        self.site_url = site_url.rstrip("/")
        self.poll_seconds = max(5, poll_seconds)
        self._task: asyncio.Task[None] | None = None

    def start(self) -> None:
        if self._task is None or self._task.done():
            self._task = asyncio.create_task(self._loop(), name="pacte-order-scheduler")

    async def stop(self) -> None:
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
            self._task = None

    async def _loop(self) -> None:
        await self.poll_once()
        while True:
            try:
                await asyncio.sleep(self.poll_seconds)
                await self.poll_once()
            except asyncio.CancelledError:
                raise
            except Exception:
                LOGGER.exception("Erreur du planificateur des commandes Discord")

    async def poll_once(self) -> None:
        payload = await self.api.get("/factions/internal/bot/pending-orders")
        data = payload.get("data", {})
        orders = data.get("orders", []) if isinstance(data, dict) else []
        factions_payload = await self.api.get("/factions/internal/bot/factions")
        faction_data = factions_payload.get("data", {})
        factions = faction_data.get("factions", []) if isinstance(faction_data, dict) else []
        by_id = {str(f.get("factionId")): f for f in factions if isinstance(f, dict)}
        for order in orders:
            if isinstance(order, dict):
                await self.create_ticket(order, by_id.get(str(order.get("factionId"))))
        await self.sync_active_statuses()


    async def sync_active_statuses(self) -> None:
        payload = await self.api.get("/factions/internal/bot/active-orders")
        data = payload.get("data", {})
        orders = data.get("orders", []) if isinstance(data, dict) else []
        guild = self.bot.get_guild(self.guild_id)
        if guild is None:
            return
        for order in orders:
            if not isinstance(order, dict):
                continue
            thread_id = str(order.get("discordThreadId") or "")
            message_id = str(order.get("discordMessageId") or "")
            if not thread_id.isdigit() or not message_id.isdigit():
                continue
            channel = guild.get_channel(int(thread_id))

            # Les threads ne sont pas toujours présents dans le cache Discord,
            # notamment après un redémarrage du bot ou lorsqu'ils ont été archivés.
            # Dans ce cas, on les récupère directement via l'API Discord.
            if not isinstance(channel, discord.Thread):
                try:
                    fetched = await self.bot.fetch_channel(int(thread_id))
                except (discord.NotFound, discord.Forbidden, discord.HTTPException):
                    LOGGER.warning(
                        "Thread Discord introuvable ou inaccessible pour la commande %s (thread=%s)",
                        order.get("orderId"),
                        thread_id,
                    )
                    continue
                if not isinstance(fetched, discord.Thread):
                    LOGGER.warning(
                        "Le canal Discord %s n'est pas un thread pour la commande %s",
                        thread_id,
                        order.get("orderId"),
                    )
                    continue
                channel = fetched

            try:
                message = await channel.fetch_message(int(message_id))
                status = str(order.get("status") or "")

                # COMPLETED est l'état final métier (= Livrée).
                # L'état final n'est pas publié dans le ticket : il est communiqué
                # en privé au demandeur, au propriétaire et aux administrateurs.
                # On archive d'abord côté backend pour rendre le traitement idempotent.
                if status == "COMPLETED":
                    try:
                        await self.api.post(
                            f"/factions/internal/bot/orders/{order['orderId']}/archive",
                            {},
                        )
                    except Exception:
                        LOGGER.exception(
                            "Impossible d'archiver la commande %s côté API. "
                            "Le ticket Discord est conservé pour un prochain essai.",
                            order.get("orderId"),
                        )
                        continue

                    await self.notify_delivery(order, guild)

                    try:
                        await channel.delete(
                            reason="Commande livrée — suppression automatique du ticket"
                        )
                    except (discord.Forbidden, discord.HTTPException, discord.NotFound):
                        LOGGER.warning(
                            "Commande %s archivée côté backend mais impossible de supprimer "
                            "le ticket Discord %s.",
                            order.get("orderId"),
                            thread_id,
                        )

                    LOGGER.info(
                        "Commande %s livrée : notification privée envoyée, "
                        "archivée côté backend et ticket Discord supprimé.",
                        order.get("orderId"),
                    )
                    continue

                current = message.embeds[0].copy() if message.embeds else discord.Embed(title="Commande Pacte")
                self._set_embed_field(current, "Statut", STATUS_LABELS.get(status, status or "—"), inline=True)
                await message.edit(embed=current)
                LOGGER.info(
                    "Commande %s synchronisée sur Discord : %s",
                    order.get("orderId"),
                    STATUS_LABELS.get(status, status or "—"),
                )
            except (discord.NotFound, discord.Forbidden, discord.HTTPException):
                LOGGER.warning("Impossible de synchroniser le ticket Discord %s", thread_id)

    async def create_ticket(self, order: dict[str, Any], faction: dict[str, Any] | None) -> None:
        if not faction:
            LOGGER.warning("Faction inconnue pour la commande %s", order.get("orderId"))
            return
        guild = self.bot.get_guild(self.guild_id)
        if guild is None:
            LOGGER.warning("Guild Discord %s introuvable", self.guild_id)
            return
        channel_id = str(faction.get("orderChannelId") or "")
        channel = guild.get_channel(int(channel_id)) if channel_id.isdigit() else None
        if not isinstance(channel, discord.TextChannel):
            LOGGER.warning("Salon de commandes introuvable: %s", channel_id)
            return

        requester = order.get("requester") or {}
        requester_id = str(requester.get("discordId") or "")
        visibility = str(order.get("visibility") or "PUBLIC")
        name = self.safe_name(order, requester)
        title = f"{order.get('orderId', 'CMD')} — {name}"

        try:
            if visibility == "PRIVATE":
                thread = await channel.create_thread(name=title[:100], type=discord.ChannelType.private_thread, auto_archive_duration=10080, reason="Commande Pacte privée")
                await self.add_private_members(thread, requester_id, str(faction.get("leaderRoleId") or ""), guild)
            else:
                thread = await channel.create_thread(name=title[:100], type=discord.ChannelType.public_thread, auto_archive_duration=10080, reason="Commande Pacte")

            embeds = self.build_embeds(order, faction, requester)
            message = await thread.send(embeds=embeds[:10])
            await self.api.post(f"/factions/internal/bot/orders/{order['orderId']}/discord", {"threadId": str(thread.id), "messageId": str(message.id)})
        except discord.Forbidden:
            LOGGER.exception("Permissions Discord insuffisantes pour la commande %s", order.get("orderId"))
        except Exception:
            LOGGER.exception("Impossible de créer le ticket Discord pour %s", order.get("orderId"))

    async def add_private_members(self, thread: discord.Thread, requester_id: str, leader_role_id: str, guild: discord.Guild) -> None:
        ids: set[int] = set()
        if requester_id.isdigit():
            ids.add(int(requester_id))
        role = guild.get_role(int(leader_role_id)) if leader_role_id.isdigit() else None
        if role:
            ids.update(member.id for member in role.members)
        for member_id in ids:
            member = guild.get_member(member_id)
            if member:
                try:
                    await thread.add_user(member)
                except discord.HTTPException:
                    LOGGER.warning("Impossible d'ajouter %s au thread privé %s", member.id, thread.id)

    def safe_name(self, order: dict[str, Any], requester: dict[str, Any]) -> str:
        return str(requester.get("displayName") or requester.get("username") or requester.get("discordUsername") or "Membre")

    async def notify_delivery(self, order: dict[str, Any], guild: discord.Guild) -> None:
        """Informe en privé le demandeur, le propriétaire et les administrateurs."""
        requester = order.get("requester") or {}
        requester_id = str(requester.get("discordId") or "")
        embed = self.build_delivery_embed(order)
        notified: set[int] = set()

        member = await self.resolve_member(guild, requester_id)
        if member:
            notified.add(member.id)
            await self.send_dm(member, embed, order)

        if guild.owner and guild.owner.id not in notified:
            notified.add(guild.owner.id)
            await self.send_dm(guild.owner, embed, order)

        for member in guild.members:
            if member.id not in notified and member.guild_permissions.administrator:
                notified.add(member.id)
                await self.send_dm(member, embed, order)

    async def resolve_member(self, guild: discord.Guild, discord_id: str) -> discord.Member | None:
        if not discord_id.isdigit():
            return None
        member = guild.get_member(int(discord_id))
        if member:
            return member
        try:
            return await guild.fetch_member(int(discord_id))
        except (discord.NotFound, discord.Forbidden, discord.HTTPException):
            return None

    async def send_dm(self, member: discord.Member, embed: discord.Embed, order: dict[str, Any]) -> None:
        try:
            await member.send(embed=embed)
        except discord.Forbidden:
            LOGGER.warning("DM impossible pour %s concernant la commande %s.", member.id, order.get("orderId"))
        except discord.HTTPException:
            LOGGER.warning("Erreur Discord lors du DM à %s pour la commande %s.", member.id, order.get("orderId"))

    def build_delivery_embed(self, order: dict[str, Any]) -> discord.Embed:
        url = f"{self.site_url}/espace-membre/commandes/{order.get('orderId', '')}"
        embed = discord.Embed(
            title="📦 Commande livrée",
            description=f"Votre commande est désormais **livrée**.\n\n[🌐 Voir le détail sur le site]({url})",
            color=discord.Color.green(),
        )
        embed.add_field(name="Commande", value=str(order.get("orderId", "—")), inline=True)
        items = [i for i in (order.get("items") or []) if isinstance(i, dict)]
        lines = [f"• **{i.get('quantity', 1)} ×** {i.get('name', 'Objet')}" for i in items]
        embed.add_field(name="Contenu", value="\n".join(lines)[:1024] or "—", inline=False)
        first = self.first_image(items)
        if first:
            embed.set_thumbnail(url=first)
        embed.set_footer(text="Le Pacte du Chêne · Commandes")
        return embed

    def build_embeds(self, order: dict[str, Any], faction: dict[str, Any], requester: dict[str, Any]) -> list[discord.Embed]:
        url = f"{self.site_url}/espace-membre/commandes/{order.get('orderId', '')}"
        status = str(order.get("status") or "")
        items = [i for i in (order.get("items") or []) if isinstance(i, dict)]
        embed = discord.Embed(
            title=f"{faction.get('icon', '📜')} Nouvelle commande",
            description=f"[🌐 Voir la commande sur le site]({url})",
            color=discord.Color.gold(),
        )
        embed.add_field(name="Commande", value=str(order.get("orderId", "—")), inline=True)
        embed.add_field(name="Demandeur", value=self.safe_name(order, requester), inline=True)
        embed.add_field(name="Statut", value=STATUS_LABELS.get(status, status or "—"), inline=True)
        embed.add_field(name="Visibilité", value="🔒 Privée" if order.get("visibility") == "PRIVATE" else "👥 Publique", inline=True)
        lines = [f"• **{i.get('quantity', 1)} ×** {i.get('name', 'Objet')}" for i in items]
        embed.add_field(name="🧰 Objets demandés", value="\n".join(lines)[:1024] or "—", inline=False)
        ingredients = [i for i in (order.get("recipeIngredients") or []) if isinstance(i, dict)]
        if ingredients:
            ilines = [f"• **{i.get('quantity', 1)} ×** {i.get('name', 'Ingrédient')}" for i in ingredients]
            embed.add_field(name="🧱 Ingrédients nécessaires", value="\n".join(ilines)[:1024], inline=False)
        if order.get("message"):
            embed.add_field(name="📝 Précisions", value=str(order["message"])[:1024], inline=False)
        first = self.first_image(items)
        if first:
            embed.set_image(url=first)
        embed.set_footer(text="Le Pacte du Chêne · Commandes")
        embeds = [embed]
        for index, item in enumerate(items[:9], start=1):
            image = self.clean_url(item.get("imageUrl"))
            if not image:
                continue
            card = discord.Embed(
                title=f"📦 Objet {index} · {item.get('name', 'Objet')}",
                description=f"Quantité : **{item.get('quantity', 1)}**",
                color=discord.Color.dark_gold(),
            )
            card.set_thumbnail(url=image)
            external = self.clean_url(item.get("externalUrl"))
            if external:
                card.add_field(name="Référence", value=f"[Voir l'objet]({external})", inline=False)
            embeds.append(card)
        return embeds

    def safe_name(self, order: dict[str, Any], requester: dict[str, Any]) -> str:
        return str(requester.get("displayName") or requester.get("username") or requester.get("discordUsername") or "Membre")

    @staticmethod
    def first_image(items: list[dict[str, Any]]) -> str | None:
        for item in items:
            image = DiscordOrderService.clean_url(item.get("imageUrl"))
            if image:
                return image
        return None

    @staticmethod
    def clean_url(value: Any) -> str | None:
        if not isinstance(value, str):
            return None
        value = value.strip()
        return value if value.startswith(("https://", "http://")) else None

    @staticmethod
    def _set_embed_field(embed: discord.Embed, name: str, value: str, *, inline: bool) -> None:
        for index, field in enumerate(embed.fields):
            if field.name == name:
                embed.set_field_at(index, name=name, value=value, inline=field.inline)
                return
        embed.add_field(name=name, value=value, inline=inline)
