import discord
from discord import app_commands

from api.client import PacteApiError
from services.member_sync import MemberSyncService


def build_sync_members_command(sync_service: MemberSyncService) -> app_commands.Command:
    @app_commands.command(name="sync-membres", description="Synchronise les membres Discord avec le Pacte.")
    async def sync_members(interaction: discord.Interaction) -> None:
        if interaction.guild is None or not isinstance(interaction.user, discord.Member):
            await interaction.response.send_message("Cette commande doit être utilisée sur le serveur Discord.", ephemeral=True)
            return
        if not interaction.user.guild_permissions.administrator:
            await interaction.response.send_message("Cette commande est réservée aux administrateurs du serveur.", ephemeral=True)
            return

        await interaction.response.defer(ephemeral=True, thinking=True)
        try:
            summary = await sync_service.sync_guild(interaction.guild)
        except PacteApiError:
            await interaction.followup.send("La synchronisation a échoué : le backend Pacte est indisponible ou refuse le bot.", ephemeral=True)
            return

        embed = discord.Embed(title="Synchronisation des membres", color=discord.Color.green())
        embed.add_field(name="Membres analysés", value=str(summary.analyzed), inline=True)
        embed.add_field(name="Comptes créés", value=str(summary.created), inline=True)
        embed.add_field(name="Comptes mis à jour", value=str(summary.updated), inline=True)
        embed.add_field(name="Rôles modifiés", value=str(summary.roles_changed), inline=True)
        embed.add_field(name="Comptes désactivés", value=str(summary.deactivated), inline=True)
        embed.add_field(name="Erreurs", value=str(summary.errors), inline=True)
        await interaction.followup.send(embed=embed, ephemeral=True)

    return sync_members
