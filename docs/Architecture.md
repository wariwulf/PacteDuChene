# Architecture du projet - Le Pacte du Chêne

## Objectif

Créer une plateforme communautaire complète pour le clan du Pacte du Chêne sur Pax Dei.

Le projet est constitué de plusieurs applications indépendantes qui communiquent entre elles via une API centrale.

---

# Architecture générale

```
                Frontend Next.js
                      │
                      │ HTTPS
                      ▼
               API Express.js
                      │
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
     MongoDB      Bots Discord    Synchronisation Pax Dei
```

---

## Frontend

Technologies :

- Next.js
- React
- Tailwind CSS
- TypeScript
- Heroicons

Responsabilités :

- Interface utilisateur
- Authentification
- Consultation des données
- Administration

Le frontend ne communique jamais directement avec MongoDB.

---

## Backend

Technologies :

- Express.js
- Node.js
- TypeScript

Responsabilités :

- Authentification
- Gestion des utilisateurs
- Gestion des quêtes
- Gestion des récompenses
- Validation des données
- API REST

Le backend est le seul point d'accès à la base de données.

---

## Base de données

MongoDB

Les données sont réparties par domaines fonctionnels afin de faciliter leur évolution.

---

## Bots

Les bots Discord utilisent exclusivement l'API Express.

Ils ne modifient jamais directement MongoDB.

Cela garantit :

- la sécurité
- la cohérence des données
- la maintenabilité