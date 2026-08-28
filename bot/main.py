import logging

import discord
from discord import app_commands
from discord.ext import commands

from api.client import PacteApiClient
from commands.profile import build_profile_command
from commands.economy import register_economy
from commands.sync_members import build_sync_members_command
from config import Settings, load_settings
from services.members import MemberService
from services.economy import EconomyService
from services.member_sync import MemberSyncService


class PacteBot(commands.Bot):
    def __init__(self, settings: Settings) -> None:
        intents = discord.Intents.none()
        intents.guilds = True
        intents.members = True
        intents.message_content = True
        intents.voice_states = True
        super().__init__(
            command_prefix="!",
            intents=intents,
            help_command=None,
        )
        self.settings = settings
        self.api_client = PacteApiClient(settings.pacte_api_url, settings.pacte_bot_api_key)
        self.member_sync_service = MemberSyncService(self.api_client, settings)
        self.economy_service = EconomyService(self.api_client)

    async def setup_hook(self) -> None:
        self.tree.add_command(build_profile_command(MemberService(self.api_client)))
        self.tree.add_command(build_sync_members_command(self.member_sync_service))
        await register_economy(self, self.economy_service, self.settings.economy_voice_poll_seconds)
        guild = discord.Object(id=self.settings.discord_guild_id)
        self.tree.copy_global_to(guild=guild)
        await self.tree.sync(guild=guild)

    async def close(self) -> None:
        await self.api_client.close()
        await super().close()

    async def on_member_join(self, member: discord.Member) -> None:
        if member.guild.id == self.settings.discord_guild_id:
            await self.member_sync_service.sync_member(member)

    async def on_member_update(self, _before: discord.Member, after: discord.Member) -> None:
        if after.guild.id == self.settings.discord_guild_id:
            await self.member_sync_service.sync_member(after)

    async def on_member_remove(self, member: discord.Member) -> None:
        if member.guild.id == self.settings.discord_guild_id:
            await self.member_sync_service.sync_removed_member(member.id)


def main() -> None:
    settings = load_settings()
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
    PacteBot(settings).run(settings.discord_bot_token, log_handler=None)


if __name__ == "__main__":
    main()
