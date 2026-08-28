from __future__ import annotations

from typing import Any

import aiohttp


class PacteApiError(Exception):
    """Erreur contrôlée retournée par l'API Pacte."""

    def __init__(self, message: str, status: int | None = None) -> None:
        super().__init__(message)
        self.status = status


class PacteApiClient:
    def __init__(
        self,
        base_url: str,
        api_key: str,
        timeout_seconds: float = 10,
    ) -> None:
        self._base_url = base_url.rstrip("/")
        self._api_key = api_key
        self._timeout = aiohttp.ClientTimeout(total=timeout_seconds)
        self._session: aiohttp.ClientSession | None = None

    async def start(self) -> None:
        if self._session is None or self._session.closed:
            self._session = aiohttp.ClientSession(
                timeout=self._timeout
            )

    async def close(self) -> None:
        if self._session and not self._session.closed:
            await self._session.close()

    async def get(self, path: str) -> dict[str, Any]:
        return await self._request("GET", path)

    async def post(
        self,
        path: str,
        payload: dict[str, Any],
    ) -> dict[str, Any]:
        return await self._request("POST", path, payload)

    async def put(
        self,
        path: str,
        payload: dict[str, Any],
    ) -> dict[str, Any]:
        return await self._request("PUT", path, payload)

    async def _request(
        self,
        method: str,
        path: str,
        payload: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        await self.start()
        assert self._session is not None

        url = f"{self._base_url}{path}"

        try:
            async with self._session.request(
                method,
                url,
                headers={
                    "Authorization": f"Bearer {self._api_key}",
                    "Accept": "application/json",
                },
                json=payload,
            ) as response:

                raw_body = await response.text()

                print(
                    f"\n[Pacte API] {method} {url}"
                    f"\n[Pacte API] Status : {response.status}"
                    f"\n[Pacte API] Content-Type : "
                    f"{response.headers.get('Content-Type')}"
                    f"\n[Pacte API] Réponse : "
                    f"{raw_body[:1000]}\n"
                )

                try:
                    data = await response.json(
                        content_type=None
                    )
                except (
                    aiohttp.ContentTypeError,
                    ValueError,
                ) as error:
                    raise PacteApiError(
                        "Réponse non JSON du backend Pacte "
                        f"(HTTP {response.status}).",
                        response.status,
                    ) from error

                if not isinstance(data, dict):
                    raise PacteApiError(
                        "Réponse invalide du backend Pacte.",
                        response.status,
                    )

                if response.status == 404:
                    raise PacteApiError(
                        data.get(
                            "message",
                            "Compte Pacte non lié.",
                        ),
                        404,
                    )

                if response.status in (401, 403):
                    raise PacteApiError(
                        "Le bot n'est pas autorisé à accéder "
                        "au backend Pacte.",
                        response.status,
                    )

                if response.status >= 500:
                    raise PacteApiError(
                        "Le backend Pacte est temporairement "
                        "indisponible.",
                        response.status,
                    )

                if (
                    not response.ok
                    or data.get("success") is False
                ):
                    raise PacteApiError(
                        data.get(
                            "message",
                            "Erreur de l'API Pacte.",
                        ),
                        response.status,
                    )

                return data

        except aiohttp.ClientError as error:
            raise PacteApiError(
                f"Impossible de joindre le backend Pacte : {error}"
            ) from error