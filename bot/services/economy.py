from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from api.client import PacteApiClient, PacteApiError


@dataclass(frozen=True)
class CurrencyBalance:
    code: str
    name: str
    symbol: str
    amount: float


@dataclass(frozen=True)
class DailyResult:
    granted: bool
    amount: float
    currency_id: str
    currency_image: str | None
    new_balance: float | None
    message: str


@dataclass(frozen=True)
class PaxDeiLevel:
    level: int
    xp: int | None = None
    xp_next: int | None = None
    character_name: str | None = None
    updated_at: str | None = None


class EconomyService:
    """Façade Discord -> API interne du Pacte pour l'économie.

    Le bot ne possède aucune donnée économique locale. Le backend reste
    l'unique source de vérité pour les soldes, cooldowns, règles et achats.
    """

    def __init__(self, api_client: PacteApiClient) -> None:
        self._api = api_client

    async def claim_daily(self, discord_id: int) -> DailyResult:
        payload = await self._api.post(
            "/internal/bot/economy/daily/claim",
            {"discordId": str(discord_id)},
        )
        data = self._data(payload)
        return DailyResult(
            granted=bool(data.get("granted", False)),
            amount=float(data.get("amount", 0)),
            currency_id=str(data.get("currencyId", "bronze")),
            currency_image=(
                str(data["currencyImage"])
                if data.get("currencyImage")
                else None
            ),
            new_balance=self._optional_float(data.get("newBalance")),
            message=str(data.get("message", "")),
        )

    async def get_balances(self, discord_id: int) -> list[CurrencyBalance]:
        payload = await self._api.get(f"/internal/bot/economy/balance/{discord_id}")

        # Le backend renvoie actuellement :
        # data = { balances: { solidus: 25, argent: 0, bronze: 100 } }
        data = payload.get("data", payload)

        if isinstance(data, dict) and isinstance(data.get("balances"), dict):
            raw_balances = data["balances"]
        elif isinstance(data, dict):
            raw_balances = data
        elif isinstance(data, list):
            raw_balances = data
        else:
            raise PacteApiError("Réponse des soldes invalide du backend Pacte.")

        balances: list[CurrencyBalance] = []

        if isinstance(raw_balances, dict):
            currency_definitions = {
                "solidus": ("SOLIDUS", "Solidus", "🪙"),
                "argent": ("ARGENT", "Argent", "🪙"),
                "bronze": ("BRONZE", "Bronze", "🪙"),
            }

            for currency_id in ("solidus", "argent", "bronze"):
                if currency_id not in raw_balances:
                    continue

                code, name, symbol = currency_definitions[currency_id]
                balances.append(
                    CurrencyBalance(
                        code=code,
                        name=name,
                        symbol=symbol,
                        amount=float(raw_balances[currency_id] or 0),
                    )
                )
            return balances

        for item in raw_balances:
            if not isinstance(item, dict):
                continue

            balances.append(
                CurrencyBalance(
                    code=str(item.get("code", "?")),
                    name=str(item.get("name", item.get("nom", "Monnaie"))),
                    symbol=str(item.get("symbol", item.get("symbole", "🪙"))),
                    amount=float(item.get("amount", item.get("montant", 0))),
                )
            )

        return balances

    async def get_shop(self) -> list[dict[str, Any]]:
        """Retourne les catégories boutique avec leurs articles.

        Le contrat recommandé est :
        data = [{id, name, emoji, items: [{id, name, description, price,
        currencyCode, currencySymbol, stock, imageUrl}]}]
        """
        payload = await self._api.get("/internal/bot/economy/shop")
        raw = payload.get("data", payload.get("categories", []))
        if not isinstance(raw, list):
            raise PacteApiError("Réponse de la boutique invalide du backend Pacte.")
        return [item for item in raw if isinstance(item, dict)]

    async def buy_item(self, discord_id: int, item_id: int) -> dict[str, Any]:
        payload = await self._api.post(
            "/internal/bot/economy/shop/buy",
            {"discordId": str(discord_id), "itemId": item_id},
        )
        data = payload.get("data")
        if isinstance(data, dict):
            return data
        return payload

    async def set_level(
        self,
        discord_id: int,
        level: int,
        xp: int | None = None,
        character_name: str | None = None,
    ) -> PaxDeiLevel:
        payload = await self._api.put(
            "/internal/bot/paxdei/level",
            {
                "discordId": str(discord_id),
                "level": level,
                "xp": xp,
                "characterName": character_name,
            },
        )
        return self._parse_level(self._data(payload))

    async def get_level(self, discord_id: int) -> PaxDeiLevel | None:
        try:
            payload = await self._api.get(f"/internal/bot/paxdei/level/{discord_id}")
        except PacteApiError as error:
            if error.status == 404:
                return None
            raise
        return self._parse_level(self._data(payload))

    async def reward_message(self, discord_id: int, channel_id: int) -> dict[str, Any]:
        """Demande au backend d'appliquer les règles de revenu texte."""
        payload = await self._api.post(
            "/internal/bot/economy/rewards/message",
            {"discordId": str(discord_id), "channelId": str(channel_id)},
        )
        return self._data(payload)

    async def reward_voice_tick(self, guild_id: int, members: list[dict[str, Any]]) -> dict[str, Any]:
        """Envoie l'état vocal courant au backend.

        Le backend décide quels membres sont éligibles, applique les règles
        et les cooldowns, puis renvoie un résumé.
        """
        payload = await self._api.post(
            "/internal/bot/economy/rewards/voice/tick",
            {"guildId": str(guild_id), "members": members},
        )
        return self._data(payload)

    @staticmethod
    def _data(payload: dict[str, Any]) -> dict[str, Any]:
        data = payload.get("data", payload)
        if not isinstance(data, dict):
            raise PacteApiError("Réponse économie invalide du backend Pacte.")
        return data

    @staticmethod
    def _optional_float(value: Any) -> float | None:
        if value is None:
            return None
        return float(value)

    @staticmethod
    def _parse_level(data: dict[str, Any]) -> PaxDeiLevel:
        return PaxDeiLevel(
            level=int(data.get("level", 0)),
            xp=int(data["xp"]) if data.get("xp") is not None else None,
            xp_next=int(data["xpNext"]) if data.get("xpNext") is not None else None,
            character_name=(str(data["characterName"]) if data.get("characterName") else None),
            updated_at=(str(data["updatedAt"]) if data.get("updatedAt") else None),
        )
