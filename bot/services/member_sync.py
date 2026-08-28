from __future__ import annotations

import logging
from dataclasses import dataclass

import discord

from api.client import PacteApiClient, PacteApiError
from config import Settings

LOGGER = logging.getLogger(__name__)


@dataclass(frozen=True)
class SyncResult:
    action: str
    role_changed: bool


@dataclass
class SyncSummary:
    analyzed: int = 0
    created: int = 0
    updated: int = 0
    roles_changed: int = 0
    deactivated: int = 0
    errors: int = 0


class MemberSyncService:
    def __init__(self, api_client: PacteApiClient, settings: Settings) -> None:
        self._api_client = api_client
        self._role_ids = {
            "INITIE": settings.role_initie,
            "FRERE_JURE": settings.role_frere_jure,
            "SOEUR_JUREE": settings.role_soeur_juree,
            "DUX_FOEDERIS": settings.role_dux_foederis,
            "REX": settings.role_rex_foederis,
        }

    def get_clan_role(self, member: discord.Member) -> str | None:
        member_role_ids = {role.id for role in member.roles}
        has_frere = self._role_ids["FRERE_JURE"] in member_role_ids
        has_soeur = self._role_ids["SOEUR_JUREE"] in member_role_ids

        if has_frere and has_soeur:
            LOGGER.warning(
                "Membre Discord %s possède simultanément les rôles Frère Juré et Sœur Jurée ; Frère Juré est conservé.",
                member.id,
            )

        for clan_role in ("REX", "DUX_FOEDERIS", "FRERE_JURE", "SOEUR_JUREE", "INITIE"):
            if self._role_ids[clan_role] in member_role_ids:
                return clan_role
        return None

    async def sync_member(self, member: discord.Member) -> SyncResult:
        clan_role = self.get_clan_role(member)
        payload: dict[str, object] = {
            "discordId": str(member.id),
            "clanRole": clan_role,
        }
        if clan_role is not None:
            payload.update({
                "username": member.name,
                "displayName": member.display_name,
                "avatarUrl": str(member.display_avatar.url),
            })

        response = await self._api_client.post("/internal/bot/members/sync", payload)
        data = response.get("data")
        if not isinstance(data, dict):
            raise PacteApiError("Réponse de synchronisation invalide du backend Pacte.")
        return SyncResult(
            action=str(data.get("action", "updated")),
            role_changed=bool(data.get("roleChanged", False)),
        )

    async def sync_removed_member(self, discord_id: int) -> SyncResult:
        response = await self._api_client.post(
            "/internal/bot/members/sync",
            {"discordId": str(discord_id), "clanRole": None},
        )
        data = response.get("data")
        if not isinstance(data, dict):
            raise PacteApiError("Réponse de synchronisation invalide du backend Pacte.")
        return SyncResult(
            action=str(data.get("action", "updated")),
            role_changed=bool(data.get("roleChanged", False)),
        )

    async def sync_guild(self, guild: discord.Guild) -> SyncSummary:
        summary = SyncSummary()
        seen_discord_ids: list[str] = []
        async for member in guild.fetch_members(limit=None):
            if member.bot:
                continue
            summary.analyzed += 1
            seen_discord_ids.append(str(member.id))
            try:
                result = await self.sync_member(member)
                if result.action == "created":
                    summary.created += 1
                elif result.action == "updated":
                    summary.updated += 1
                elif result.action == "deactivated":
                    summary.deactivated += 1
                if result.role_changed:
                    summary.roles_changed += 1
            except PacteApiError:
                LOGGER.exception("Échec de synchronisation du membre Discord %s", member.id)
                summary.errors += 1

        try:
            response = await self._api_client.post(
                "/internal/bot/members/sync/complete",
                {"seenDiscordIds": seen_discord_ids},
            )
            data = response.get("data")
            if not isinstance(data, dict):
                raise PacteApiError("Réponse de finalisation invalide du backend Pacte.")
            summary.deactivated += int(data.get("deactivated", 0))
        except PacteApiError:
            LOGGER.exception("Échec de finalisation de la synchronisation du serveur Discord")
            summary.errors += 1
        return summary
