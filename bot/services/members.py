from __future__ import annotations

from dataclasses import dataclass

from api.client import PacteApiClient, PacteApiError


@dataclass(frozen=True)
class PacteMember:
    member_id: str
    display_name: str
    username: str
    role: str
    status: str
    discord_id: str


class MemberService:
    def __init__(self, api_client: PacteApiClient) -> None:
        self._api_client = api_client

    async def find_by_discord_id(self, discord_id: int) -> PacteMember | None:
        try:
            payload = await self._api_client.get(f"/internal/bot/members/by-discord/{discord_id}")
        except PacteApiError as error:
            if error.status == 404:
                return None
            raise

        data = payload.get("data")
        if not isinstance(data, dict):
            raise PacteApiError("Réponse membre invalide du backend Pacte.")
        try:
            return PacteMember(
                member_id=str(data["memberId"]),
                display_name=str(data["displayName"]),
                username=str(data["username"]),
                role=str(data["role"]),
                status=str(data["status"]),
                discord_id=str(data["discordId"]),
            )
        except KeyError as error:
            raise PacteApiError("Réponse membre incomplète du backend Pacte.") from error
