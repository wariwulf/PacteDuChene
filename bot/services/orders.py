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
    "COMPLETED": "✅ Terminée",
    "DELIVERED": "📦 Livrée",
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

            order_id = str(order.get("orderId") or "")
            thread_id = str(order.get("discordThreadId") or "")
            message_id = str(order.get("discordMessageId") or "")
            status = str(order.get("status") or "")

            if not thread_id.isdigit():
                continue

            channel = guild.get_channel(int(thread_id))

            # Les threads peuvent ne plus être présents dans le cache après un
            # redémarrage du bot ou après archivage. On tente donc une récupération.
            if not isinstance(channel, discord.Thread):
                try:
                    fetched = await self.bot.fetch_channel(int(thread_id))
                except discord.NotFound:
                    # Le ticket a déjà été supprimé manuellement : on peut
                    # considérer le nettoyage Discord comme terminé et archiver
                    # la commande côté API.
                    if status == "COMPLETED":
                        try:
                            await self.api.post(
                                f"/factions/internal/bot/orders/{order_id}/archive",
                                {},
                            )
                            LOGGER.info("Commande %s archivée côté API après suppression Discord", order_id)
                        except Exception:
                            LOGGER.exception("Impossible d'archiver la commande %s côté API", order_id)
                    continue
                except (discord.Forbidden, discord.HTTPException):
                    LOGGER.warning(
                        "Thread Discord introuvable ou inaccessible pour la commande %s (thread=%s)",
                        order_id,
                        thread_id,
                    )
                    continue

                if not isinstance(fetched, discord.Thread):
                    LOGGER.warning(
                        "Le canal Discord %s n'est pas un thread pour la commande %s",
                        thread_id,
                        order_id,
                    )
                    continue
                channel = fetched

            # Une commande terminée doit disparaître de Discord.
            # COMPLETED est le statut final actuel du backend. DELIVERED est
            # conservé ici uniquement pour compatibilité avec d'anciennes données.
            if status in {"COMPLETED", "DELIVERED"}:
                me = guild.me
                if me is not None:
                    permissions = channel.permissions_for(me)
                    if not permissions.manage_threads:
                        LOGGER.error(
                            "Impossible de supprimer le ticket %s pour %s : le bot n'a pas la permission Manage Threads.",
                            thread_id,
                            order_id,
                        )
                        continue

                try:
                    await channel.delete(
                        reason="Commande terminée — suppression automatique du ticket"
                    )
                    LOGGER.info(
                        "Ticket Discord %s supprimé pour la commande %s",
                        thread_id,
                        order_id,
                    )
                except discord.NotFound:
                    LOGGER.info(
                        "Ticket Discord %s déjà supprimé pour la commande %s",
                        thread_id,
                        order_id,
                    )
                except discord.Forbidden:
                    LOGGER.error(
                        "Impossible de supprimer le ticket Discord %s pour la commande %s : 403 Missing Permissions. Vérifier Manage Threads sur le salon parent.",
                        thread_id,
                        order_id,
                    )
                    continue
                except discord.HTTPException:
                    LOGGER.exception(
                        "Erreur Discord pendant la suppression du ticket %s pour la commande %s",
                        thread_id,
                        order_id,
                    )
                    continue

                # Important : l'archivage côté API ne doit avoir lieu qu'après
                # une suppression Discord réussie (ou si le ticket n'existe déjà plus).
                try:
                    await self.api.post(
                        f"/factions/internal/bot/orders/{order_id}/archive",
                        {},
                    )
                    LOGGER.info("Commande %s archivée côté API", order_id)
                except Exception:
                    LOGGER.exception("Ticket supprimé mais impossible d'archiver la commande %s côté API", order_id)
                continue

            if not message_id.isdigit():
                continue

            try:
                message = await channel.fetch_message(int(message_id))
                current = message.embeds[0].copy() if message.embeds else discord.Embed(title="Commande Pacte")
                for field in current.fields:
                    if field.name == "Statut":
                        current.set_field_at(
                            current.fields.index(field),
                            name="Statut",
                            value=STATUS_LABELS.get(status, status or "—"),
                            inline=field.inline,
                        )
                        break
                else:
                    current.add_field(
                        name="Statut",
                        value=STATUS_LABELS.get(status, status or "—"),
                        inline=True,
                    )
                await message.edit(embed=current)
                LOGGER.info(
                    "Commande %s synchronisée sur Discord : %s",
                    order_id,
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

            embed = self.build_embed(order, faction, requester)
            message = await thread.send(embed=embed)
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

    def build_embed(self, order: dict[str, Any], faction: dict[str, Any], requester: dict[str, Any]) -> discord.Embed:
        url = f"{self.site_url}/espace-membre/commandes/{order.get('orderId', '')}"
        embed = discord.Embed(title=f"{faction.get('icon', '📜')} Nouvelle commande", description=f"[🌐 Voir la commande sur le site]({url})", color=discord.Color.gold())
        embed.add_field(name="Commande", value=str(order.get("orderId", "—")), inline=True)
        embed.add_field(name="Demandeur", value=self.safe_name(order, requester), inline=True)
        embed.add_field(name="Statut", value=STATUS_LABELS.get(str(order.get("status")), str(order.get("status", "—"))), inline=True)
        embed.add_field(name="Visibilité", value="🔒 Privée" if order.get("visibility") == "PRIVATE" else "👥 Publique", inline=True)
        items = order.get("items") or []
        lines = [f"• **{item.get('quantity', 1)} ×** {item.get('name', 'Objet')}" for item in items if isinstance(item, dict)]
        embed.add_field(name="Demande", value="\n".join(lines)[:1024] or "—", inline=False)
        if order.get("recipeIngredients"):
            ingredients = [f"• {i.get('quantity', 1)} × {i.get('name', 'Ingrédient')}" for i in order["recipeIngredients"] if isinstance(i, dict)]
            embed.add_field(name="Ingrédients de la recette", value="\n".join(ingredients)[:1024], inline=False)
        if order.get("message"):
            embed.add_field(name="Précisions", value=str(order["message"])[:1024], inline=False)
        embed.set_footer(text="Le Pacte du Chêne · Commandes")
        return embed
