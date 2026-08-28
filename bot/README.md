# Bot Discord — Pacte du Chêne

Le bot Discord du Pacte du Chêne reste un client du backend : **il ne se connecte jamais directement à MongoDB**.

Il gère actuellement :

- synchronisation des membres et rôles du clan ;
- `/profil` ;
- `/sync-membres` ;
- `/journalier` ;
- `/solde` ;
- `/boutique` avec navigation interactive et achat ;
- `/niveau` et `/mon-niveau` pour le niveau Pax Dei ;
- transmission des messages Discord au backend pour les revenus configurés ;
- transmission périodique de la présence vocale au backend.

## Architecture économique

Le bot ne conserve **aucun solde, cooldown, règle de revenu ou inventaire local**.
Le backend Pacte est la source de vérité :

```text
Discord
  │
  ▼
Bot Pacte
  │  API interne authentifiée par PACTE_BOT_API_KEY
  ▼
Backend Pacte
  │
  ▼
Base de données du Pacte
```

Cela permet au site et à Discord d'afficher exactement les mêmes soldes et historiques.

## Intents Discord

Les intents suivants sont nécessaires :

- `Guilds`
- `Server Members`
- `Message Content`
- `Voice States`

Les intents privilégiés `Server Members` et `Message Content` doivent être activés dans le portail développeur Discord.

## Configuration

Copier `.env.example` en `.env`, puis renseigner les valeurs réelles.

`ECONOMY_VOICE_POLL_SECONDS` définit uniquement la fréquence à laquelle le bot transmet l'état vocal au backend. **Le montant et les cooldowns économiques doivent rester configurés côté backend.**

## Lancement

```powershell
py -m pip install -r requirements.txt
py main.py
```

## Important — phase d'intégration

Les commandes économiques sont déjà préparées côté bot, mais elles nécessitent les routes internes correspondantes côté backend. Le contrat proposé se trouve dans `docs/economy-api.md`.
