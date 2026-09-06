# Module Discord — Pacte du Chêne

## 1. Installation

Copier le dossier `discord` dans :

backend/src/modules/discord/

## 2. Enregistrer les routes

Dans `backend/src/app.ts`, ajouter :

```ts
import discordRoutes from "./modules/discord/discord.routes";
```

Puis avec les autres routes :

```ts
app.use("/api/discord", discordRoutes);
```

## 3. Routes disponibles

### Récupérer la liaison d'un membre

GET

```text
/api/discord/member/:memberId
```

Exemple :

```text
/api/discord/member/6a84af62efe2b87173cd3daa
```

### Vérifier le statut Discord

GET

```text
/api/discord/status/:memberId
```

Réponse :

```json
{
  "success": true,
  "data": {
    "linked": true,
    "link": {
      "memberId": "...",
      "discordId": "...",
      "discordUsername": "Pseudo#0001"
    }
  }
}
```

### Lier un compte

POST

```text
/api/discord/link
```

Body :

```json
{
  "memberId": "6a84af62efe2b87173cd3daa",
  "discordId": "123456789012345678",
  "discordUsername": "PseudoDiscord"
}
```

Si le membre possède déjà une liaison, elle est mise à jour.

### Dissocier un compte

DELETE

```text
/api/discord/link/:memberId
```

## Important

Ce module gère actuellement la **liaison des comptes dans la base de données**.

Il ne contacte pas encore l'API Discord et ne modifie pas encore les rôles Discord.

La prochaine étape pourra être :

- OAuth2 Discord ;
- bot Discord ;
- synchronisation des rôles ;
- attribution automatique d'un rôle selon le niveau Pacte ;
- vérification du serveur Discord.
