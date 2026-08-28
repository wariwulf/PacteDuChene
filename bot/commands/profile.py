import discord
from discord import app_commands

from api.client import PacteApiError
from services.members import MemberService


def build_profile_command(member_service: MemberService) -> app_commands.Command:
    @app_commands.command(name="profil", description="Affiche votre profil Pacte lié à Discord.")
    async def profile(interaction: discord.Interaction) -> None:
        await interaction.response.defer(ephemeral=True, thinking=True)
        try:
            member = await member_service.find_by_discord_id(interaction.user.id)
        except PacteApiError:
            await interaction.followup.send("Le service du Pacte est momentanément indisponible. Réessaie plus tard.", ephemeral=True)
            return

        if member is None:
            await interaction.followup.send("Ton compte Discord n'est pas encore lié à un compte du Pacte du Chêne.", ephemeral=True)
            return
        if member.status == "SUSPENDED":
            await interaction.followup.send("Ton compte Pacte est suspendu. Contacte un administrateur si tu penses qu'il s'agit d'une erreur.", ephemeral=True)
            return

        embed = discord.Embed(title="Profil du Pacte du Chêne", color=discord.Color.green())
        embed.add_field(name="Membre", value=member.display_name, inline=False)
        embed.add_field(name="Identifiant", value=member.username, inline=True)
        embed.add_field(name="Rôle", value=member.role, inline=True)
        embed.add_field(name="Statut", value=member.status, inline=True)
        embed.add_field(name="Discord", value="Lié", inline=True)
        await interaction.followup.send(embed=embed, ephemeral=True)

    return profile
