# Contrat API interne — économie Discord

Toutes les routes utilisent l'authentification existante `Authorization: Bearer <PACTE_BOT_API_KEY>`. Le bot ne stocke aucun solde ni cooldown : le backend Pacte est la source de vérité.

## Journalier
`POST /internal/bot/economy/daily/claim`

```json
{"discordId":"123456789012345678"}
```

Réponse :
```json
{"success":true,"data":{"granted":true,"amount":100,"currencyCode":"ARG","currencySymbol":"🪙","newBalance":325,"message":""}}
```

`granted:false` indique que le joueur a déjà réclamé sa récompense du jour. Le montant de 100 Argent doit être configuré côté backend, pas codé dans le bot.

## Soldes
`GET /internal/bot/economy/balance/{discordId}`

```json
{"success":true,"data":[{"code":"SOL","name":"Solidi","symbol":"🪙","amount":225},{"code":"ARG","name":"Argent","symbol":"🥈","amount":100},{"code":"BRO","name":"Bronze","symbol":"🥉","amount":0}]}
```

## Boutique
`GET /internal/bot/economy/shop`

```json
{"success":true,"data":[{"id":1,"name":"Ressources","emoji":"💎","items":[{"id":42,"name":"Seau d'Ergamen","description":"Description","price":1000,"currencyCode":"SOL","currencySymbol":"🪙","stock":null,"imageUrl":null}]}]}
```

`POST /internal/bot/economy/shop/buy`
```json
{"discordId":"123456789012345678","itemId":42}
```

Le backend doit réaliser atomiquement vérification du stock, vérification du solde, débit, stock, journalisation et éventuelle récompense.

## Niveau Pax Dei
`GET /internal/bot/paxdei/level/{discordId}`

```json
{"success":true,"data":{"level":3,"xp":265,"xpNext":295,"characterName":"Warwulf Fra","updatedAt":"2026-08-28T00:00:00.000Z"}}
```

`PUT /internal/bot/paxdei/level`
```json
{"discordId":"123456789012345678","level":3,"xp":265,"characterName":"Warwulf Fra"}
```

## Revenus messages
`POST /internal/bot/economy/rewards/message`
```json
{"discordId":"123456789012345678","channelId":"987654321098765432"}
```

Le backend recherche les règles texte actives, vérifie salon/rôle/priorité/cooldown, calcule le gain, crédite et journalise. Réponse possible :
```json
{"success":true,"data":{"rewarded":true,"amount":10,"currencyCode":"ARG","currencySymbol":"🥈","newBalance":250}}
```

## Revenus vocaux
`POST /internal/bot/economy/rewards/voice/tick`

```json
{"guildId":"123456789012345678","members":[{"discordId":"111111111111111111","channelId":"222222222222222222","selfMute":false,"selfDeaf":false,"serverMute":false,"serverDeaf":false,"alone":false,"afk":false}]}
```

Le backend applique les règles vocales et leurs cooldowns. Le bot transmet seulement l'état courant.

## Sécurité

Le bot ne doit jamais accéder directement à MongoDB. Les mutations économiques doivent être faites côté backend et journalisées.
