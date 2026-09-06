# Correctif Mongoose v2

Le premier script avait un petit problème de chemin : il remontait de deux
niveaux depuis `mongoose-warning-correctif`, alors qu'il fallait remonter
d'un seul niveau.

Cette version est corrigée.

## Emplacement attendu

```text
PacteDuChene/
├── backend/
├── bot/
├── docs/
├── frontend/
├── mongoose-warning-correctif/
└── ...
```

Le script doit donc être ici :

```text
PacteDuChene/mongoose-warning-correctif/appliquer-correctif.bat
```

## Utilisation

Double-clique simplement sur :

`appliquer-correctif.bat`

Le script :

1. se place automatiquement à la racine de `PacteDuChene` ;
2. vérifie que `backend\src` existe ;
3. crée une sauvegarde complète de `backend\src` ;
4. remplace les options Mongoose `new: true` par
   `returnDocument: "after"` ;
5. affiche les fichiers effectivement modifiés.

Il ne modifie pas MongoDB, les fichiers `.env` ou le frontend.

## Après le correctif

Dans CMD :

```cmd
cd "C:\Users\wariw\Desktop\Le Pacte\PacteDuChene\backend"
npm run dev
```

Si le backend démarre sans erreur, on pourra ensuite vérifier ensemble les
avertissements restants.
