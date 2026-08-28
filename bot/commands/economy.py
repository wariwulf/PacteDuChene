from __future__ import annotations

import asyncio
import logging
from pathlib import Path

import discord
from discord import app_commands
from discord.ext import commands

from api.client import PacteApiError
from services.economy import EconomyService, PaxDeiLevel


LOGGER = logging.getLogger(__name__)

ECONOMY_ASSETS_DIR = (
    Path(__file__).resolve().parent.parent / "assets" / "economy"
)

CURRENCY_IMAGE_FILES = {
    "bronze": "currency-bronze.png",
    "argent": "currency-argent.png",
    "silver": "currency-argent.png",
    "solidus": "currency-solidus.png",
    "gold": "currency-solidus.png",
}


def get_currency_image(currency_id: str) -> Path | None:
    filename = CURRENCY_IMAGE_FILES.get(currency_id.lower())

    if not filename:
        return None

    image_path = ECONOMY_ASSETS_DIR / filename

    if not image_path.is_file():
        LOGGER.warning(
            "Image de monnaie introuvable : %s",
            image_path,
        )
        return None

    return image_path


class ShopView(discord.ui.View):
    def __init__(self, service: EconomyService, categories: list[dict]):
        super().__init__(timeout=180)
        self.service = service
        self.categories = categories
        self.add_item(ShopCategorySelect(service, categories))


class ShopCategorySelect(discord.ui.Select):
    def __init__(self, service: EconomyService, categories: list[dict]):
        self.service = service
        options = []
        for category in categories[:25]:
            options.append(
                discord.SelectOption(
                    label=str(category.get("name", category.get("nom", "Catégorie")))[:100],
                    value=str(category.get("id")),
                    emoji=category.get("emoji"),
                )
            )
        if not options:
            options = [discord.SelectOption(label="Aucune catégorie", value="none")]
        super().__init__(placeholder="Choisir une catégorie…", options=options)

    async def callback(self, interaction: discord.Interaction) -> None:
        if self.values[0] == "none":
            await interaction.response.send_message("La boutique ne contient aucune catégorie.", ephemeral=True)
            return
        category_id = self.values[0]
        category = next((c for c in self.view.categories if str(c.get("id")) == category_id), None)  # type: ignore[union-attr]
        if not category:
            await interaction.response.send_message("Cette catégorie n'est plus disponible.", ephemeral=True)
            return

        items = category.get("items", category.get("articles", []))
        if not isinstance(items, list):
            items = []
        embed = build_category_embed(category, items)
        view = ShopItemsView(self.service, self.view.categories, category, items)  # type: ignore[union-attr]
        await interaction.response.edit_message(embed=embed, view=view)


class ShopItemsView(discord.ui.View):
    def __init__(self, service: EconomyService, categories: list[dict], category: dict, items: list[dict]):
        super().__init__(timeout=180)
        self.service = service
        self.categories = categories
        self.category = category
        self.items = items
        if items:
            self.add_item(ShopItemSelect(service, items))
        self.add_item(ShopBackButton(service, categories))


class ShopItemSelect(discord.ui.Select):
    def __init__(self, service: EconomyService, items: list[dict]):
        self.service = service
        options = []
        for item in items[:25]:
            name = str(item.get("name", item.get("nom", "Article")))
            price = item.get("price", item.get("prix", "?"))
            symbol = item.get("currencySymbol", item.get("symbole", "🪙"))
            options.append(discord.SelectOption(label=name[:100], description=f"{price} {symbol}"[:100], value=str(item.get("id"))))
        super().__init__(placeholder="Choisir un article…", options=options)

    async def callback(self, interaction: discord.Interaction) -> None:
        item = next((i for i in self.view.items if str(i.get("id")) == self.values[0]), None)  # type: ignore[union-attr]
        if not item:
            await interaction.response.send_message("Cet article n'est plus disponible.", ephemeral=True)
            return

        name = str(item.get("name", item.get("nom", "Article")))
        description = str(item.get("description", item.get("description", "Aucune description.")))
        price = item.get("price", item.get("prix", "?"))
        symbol = item.get("currencySymbol", item.get("symbole", "🪙"))
        code = item.get("currencyCode", item.get("code", ""))
        stock = item.get("stock")

        embed = discord.Embed(title=f"🛒 {name}", description=description or "Aucune description.", color=discord.Color.gold())
        embed.add_field(name="Prix", value=f"{price} {symbol} {code}".strip(), inline=True)
        if stock is not None:
            embed.add_field(name="Stock", value=str(stock), inline=True)
        image_url = item.get("imageUrl", item.get("image_url"))
        if image_url:
            embed.set_thumbnail(url=str(image_url))

        view = ShopItemDetailView(self.service, self.view.categories, self.view.category, self.view.items, int(item["id"]))  # type: ignore[union-attr]
        await interaction.response.edit_message(embed=embed, view=view)


class ShopItemDetailView(discord.ui.View):
    def __init__(self, service: EconomyService, categories: list[dict], category: dict, items: list[dict], item_id: int):
        super().__init__(timeout=180)
        self.service = service
        self.categories = categories
        self.category = category
        self.items = items
        self.item_id = item_id

    @discord.ui.button(label="Acheter", style=discord.ButtonStyle.success, emoji="🛍️")
    async def buy(self, interaction: discord.Interaction, _button: discord.ui.Button) -> None:
        await interaction.response.defer(ephemeral=True)
        try:
            result = await self.service.buy_item(interaction.user.id, self.item_id)
        except PacteApiError as error:
            await interaction.followup.send(f"❌ {error}", ephemeral=True)
            return
        message = str(result.get("message", "Achat traité."))
        await interaction.followup.send(message, ephemeral=True)

    @discord.ui.button(label="Retour", style=discord.ButtonStyle.secondary)
    async def back(self, interaction: discord.Interaction, _button: discord.ui.Button) -> None:
        embed = build_category_embed(self.category, self.items)
        view = ShopItemsView(self.service, self.categories, self.category, self.items)
        await interaction.response.edit_message(embed=embed, view=view)


class ShopBackButton(discord.ui.Button):
    def __init__(self, service: EconomyService, categories: list[dict]):
        super().__init__(label="Catégories", style=discord.ButtonStyle.secondary)
        self.service = service
        self.categories = categories

    async def callback(self, interaction: discord.Interaction) -> None:
        embed = discord.Embed(title="🛒 Boutique du Pacte", description="Choisis une catégorie.", color=discord.Color.gold())
        await interaction.response.edit_message(embed=embed, view=ShopView(self.service, self.categories))


def build_category_embed(category: dict, items: list[dict]) -> discord.Embed:
    name = str(category.get("name", category.get("nom", "Catégorie")))
    emoji = str(category.get("emoji", ""))
    embed = discord.Embed(title=f"{emoji} {name}".strip(), color=discord.Color.gold())
    if not items:
        embed.description = "Aucun article disponible dans cette catégorie."
        return embed
    for item in items[:25]:
        item_name = str(item.get("name", item.get("nom", "Article")))
        price = item.get("price", item.get("prix", "?"))
        symbol = item.get("currencySymbol", item.get("symbole", "🪙"))
        code = item.get("currencyCode", item.get("code", ""))
        stock = item.get("stock")
        stock_text = f" • Stock : {stock}" if stock is not None else ""
        embed.add_field(name=item_name, value=f"{price} {symbol} {code}{stock_text}".strip(), inline=False)
    return embed


def build_level_embed(level: PaxDeiLevel) -> discord.Embed:
    title = "🎮 Niveau Pax Dei"
    embed = discord.Embed(title=title, color=discord.Color.green())
    if level.character_name:
        embed.add_field(name="Personnage", value=level.character_name, inline=False)
    embed.add_field(name="Niveau", value=str(level.level), inline=True)
    if level.xp is not None:
        xp_text = str(level.xp)
        if level.xp_next is not None:
            xp_text += f" / {level.xp_next} XP"
        embed.add_field(name="Progression", value=xp_text, inline=True)
    return embed


def build_economy_commands(service: EconomyService) -> list[app_commands.Command]:
    @app_commands.command(name="journalier", description="Récupère ta récompense économique quotidienne.")
    async def journalier(interaction: discord.Interaction) -> None:
        await interaction.response.defer(ephemeral=False, thinking=True)
        try:
            result = await service.claim_daily(interaction.user.id)
        except PacteApiError as error:
            if error.status == 404:
                await interaction.followup.send(
                    "❌ Aucun compte Pacte n'est lié à ton compte Discord. "
                    "Demande ton intégration au Pacte avant d'utiliser `/journalier`.",
                    ephemeral=True,
                )
            else:
                await interaction.followup.send(
                    "Le service économique est momentanément indisponible. Réessaie plus tard.",
                    ephemeral=True,
                )
            return

        if not result.granted:
            await interaction.followup.send(result.message or "⏳ Tu as déjà récupéré ta récompense journalière aujourd'hui.", ephemeral=False)
            return

        currency_image = get_currency_image(result.currency_id)

        balance = ""
        if result.new_balance is not None:
            balance = f"\nSolde : **{result.new_balance:g}**"

        message = (
            f"⏰ **Récompense journalière**\n\n"
            f"Vous recevez **{result.amount:g}** !"
            f"{balance}"
        )

        if currency_image:
            file = discord.File(
                currency_image,
                filename=currency_image.name,
            )

            await interaction.followup.send(
                message,
                file=file,
                ephemeral=False,
            )
        else:
            await interaction.followup.send(
                message,
                ephemeral=False,
            )

    @app_commands.command(name="solde", description="Affiche ton portefeuille économique du Pacte.")
    async def solde(interaction: discord.Interaction) -> None:
        await interaction.response.defer(ephemeral=False, thinking=True)
        try:
            balances = await service.get_balances(interaction.user.id)
        except PacteApiError:
            await interaction.followup.send("Le service économique est momentanément indisponible.", ephemeral=True)
            return
        if not balances:
            await interaction.followup.send("Aucun solde économique n'est encore enregistré.", ephemeral=True)
            return
        embed = discord.Embed(title="💰 Portefeuille du Pacte", color=discord.Color.gold())
        for balance in balances:
            embed.add_field(name=f"{balance.symbol} {balance.name}", value=f"**{balance.amount:g}** {balance.code}", inline=True)
        await interaction.followup.send(embed=embed, ephemeral=False)

    @app_commands.command(name="boutique", description="Affiche la boutique du Pacte.")
    async def boutique(interaction: discord.Interaction) -> None:
        await interaction.response.defer(ephemeral=True, thinking=True)
        try:
            categories = await service.get_shop()
        except PacteApiError:
            await interaction.followup.send("La boutique est momentanément indisponible.", ephemeral=True)
            return
        if not categories:
            await interaction.followup.send("La boutique ne contient actuellement aucun article.", ephemeral=True)
            return
        embed = discord.Embed(title="🛒 Boutique du Pacte", description="Choisis une catégorie.", color=discord.Color.gold())
        await interaction.followup.send(embed=embed, view=ShopView(service, categories), ephemeral=True)

    @app_commands.command(name="niveau", description="Enregistre ton niveau Pax Dei dans le Pacte.")
    @app_commands.describe(
        niveau="Ton niveau Pax Dei",
        xp="Ton XP actuelle (optionnel)",
        personnage="Nom de ton personnage Pax Dei (optionnel)",
    )
    async def niveau(
        interaction: discord.Interaction,
        niveau: app_commands.Range[int, 1, 100],
        xp: app_commands.Range[int, 0, 10_000_000] | None = None,
        personnage: str | None = None,
    ) -> None:
        await interaction.response.defer(ephemeral=True, thinking=True)
        try:
            result = await service.set_level(interaction.user.id, int(niveau), int(xp) if xp is not None else None, personnage)
        except PacteApiError:
            await interaction.followup.send("Impossible d'enregistrer ton niveau pour le moment.", ephemeral=True)
            return
        await interaction.followup.send("✅ Niveau Pax Dei enregistré.", embed=build_level_embed(result), ephemeral=True)

    @app_commands.command(name="mon-niveau", description="Affiche ton niveau Pax Dei enregistré dans le Pacte.")
    async def mon_niveau(interaction: discord.Interaction) -> None:
        await interaction.response.defer(ephemeral=True, thinking=True)
        try:
            result = await service.get_level(interaction.user.id)
        except PacteApiError:
            await interaction.followup.send("Le service Pax Dei est momentanément indisponible.", ephemeral=True)
            return
        if result is None:
            await interaction.followup.send("Aucun niveau Pax Dei n'est encore enregistré. Utilise `/niveau`.", ephemeral=True)
            return
        await interaction.followup.send(embed=build_level_embed(result), ephemeral=True)

    return [journalier, solde, boutique, niveau, mon_niveau]


class EconomyEvents(commands.Cog):
    """Événements Discord transmis au backend économique."""

    def __init__(self, bot: commands.Bot, service: EconomyService, voice_poll_seconds: int = 60):
        self.bot = bot
        self.service = service
        self.voice_poll_seconds = max(15, voice_poll_seconds)
        self._voice_task: asyncio.Task[None] | None = None

    async def cog_load(self) -> None:
        self._voice_task = asyncio.create_task(self._voice_loop())

    def cog_unload(self) -> None:
        if self._voice_task:
            self._voice_task.cancel()
            self._voice_task = None

    @commands.Cog.listener()
    async def on_message(self, message: discord.Message) -> None:
        if message.guild is None or message.author.bot or not isinstance(message.author, discord.Member):
            return
        asyncio.create_task(self._process_message_reward(message))

    async def _process_message_reward(self, message: discord.Message) -> None:
        try:
            await self.service.reward_message(message.author.id, message.channel.id)
        except PacteApiError as error:
            if error.status not in (400, 404):
                LOGGER.warning("Revenu message impossible pour %s : %s", message.author.id, error)
        except Exception:
            LOGGER.exception("Erreur inattendue lors du traitement du revenu message")

    async def _voice_loop(self) -> None:
        await self.bot.wait_until_ready()
        while not self.bot.is_closed():
            try:
                for guild in self.bot.guilds:
                    members: list[dict] = []
                    for channel in guild.voice_channels:
                        for member in channel.members:
                            if member.bot or member.voice is None:
                                continue
                            if guild.afk_channel and channel.id == guild.afk_channel.id:
                                continue
                            members.append({
                                "discordId": str(member.id),
                                "channelId": str(channel.id),
                                "selfMute": bool(member.voice.self_mute),
                                "selfDeaf": bool(member.voice.self_deaf),
                                "serverMute": bool(member.voice.mute),
                                "serverDeaf": bool(member.voice.deaf),
                                "alone": len([m for m in channel.members if not m.bot]) < 2,
                                "afk": bool(guild.afk_channel and channel.id == guild.afk_channel.id),
                            })
                    await self.service.reward_voice_tick(guild.id, members)
            except asyncio.CancelledError:
                raise
            except Exception:
                LOGGER.exception("Erreur pendant le contrôle des revenus vocaux")
            await asyncio.sleep(self.voice_poll_seconds)



async def register_economy(bot: commands.Bot, service: EconomyService, voice_poll_seconds: int) -> None:
    for command in build_economy_commands(service):
        bot.tree.add_command(command)
    await bot.add_cog(EconomyEvents(bot, service, voice_poll_seconds))
