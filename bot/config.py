import os
from dataclasses import dataclass

from dotenv import load_dotenv


@dataclass(frozen=True)
class Settings:
    discord_bot_token: str
    discord_guild_id: int
    pacte_api_url: str
    pacte_bot_api_key: str
    role_initie: int
    role_frere_jure: int
    role_soeur_juree: int
    role_dux_foederis: int
    role_rex_foederis: int
    economy_voice_poll_seconds: int


def load_settings() -> Settings:
    load_dotenv()
    token = os.getenv("DISCORD_BOT_TOKEN", "").strip()
    guild_id_raw = os.getenv("DISCORD_GUILD_ID", "").strip()
    api_url = os.getenv("PACTE_API_URL", "").strip().rstrip("/")
    api_key = os.getenv("PACTE_BOT_API_KEY", "").strip()
    voice_poll_raw = os.getenv("ECONOMY_VOICE_POLL_SECONDS", "60").strip()

    role_values = {
        "DISCORD_ROLE_INITIE": os.getenv("DISCORD_ROLE_INITIE", "").strip(),
        "DISCORD_ROLE_FRERE_JURE": os.getenv("DISCORD_ROLE_FRERE_JURE", "").strip(),
        "DISCORD_ROLE_SOEUR_JUREE": os.getenv("DISCORD_ROLE_SOEUR_JUREE", "").strip(),
        "DISCORD_ROLE_DUX_FOEDERIS": os.getenv("DISCORD_ROLE_DUX_FOEDERIS", "").strip(),
        "DISCORD_ROLE_REX_FOEDERIS": os.getenv("DISCORD_ROLE_REX_FOEDERIS", "").strip(),
    }

    missing = [name for name, value in {
        "DISCORD_BOT_TOKEN": token,
        "DISCORD_GUILD_ID": guild_id_raw,
        "PACTE_API_URL": api_url,
        "PACTE_BOT_API_KEY": api_key,
        **role_values,
    }.items() if not value]
    if missing:
        raise RuntimeError("Variables d'environnement manquantes : " + ", ".join(missing))

    try:
        guild_id = int(guild_id_raw)
        role_ids = {name: int(value) for name, value in role_values.items()}
        economy_voice_poll_seconds = int(voice_poll_raw)
    except ValueError as error:
        raise RuntimeError("Les IDs Discord et ECONOMY_VOICE_POLL_SECONDS doivent être numériques.") from error

    if economy_voice_poll_seconds < 15:
        raise RuntimeError("ECONOMY_VOICE_POLL_SECONDS doit être supérieur ou égal à 15 secondes.")
    if len(set(role_ids.values())) != len(role_ids):
        raise RuntimeError("Les IDs des rôles de clan Discord doivent être distincts.")

    return Settings(
        token,
        guild_id,
        api_url,
        api_key,
        role_ids["DISCORD_ROLE_INITIE"],
        role_ids["DISCORD_ROLE_FRERE_JURE"],
        role_ids["DISCORD_ROLE_SOEUR_JUREE"],
        role_ids["DISCORD_ROLE_DUX_FOEDERIS"],
        role_ids["DISCORD_ROLE_REX_FOEDERIS"],
        economy_voice_poll_seconds,
    )
