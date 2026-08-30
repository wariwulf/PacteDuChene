# Fiche de maintenance --- Le Pacte du Chêne

> Référence rapide pour maintenir le site en local et en production.
>
> **Production :** `https://lepacteduchene.fr`
>
> **Projet VPS :** `/srv/apps/PacteDuChene`
>
> **MongoDB :** Docker, conteneur `pacte-mongodb`
>
> **Services systemd :** - `pacte-backend` - `pacte-frontend` -
> `nginx` - `certbot.timer`

------------------------------------------------------------------------

## 1. Architecture de production

``` text
Internet
   |
   v
Nginx :80 / :443
   |
   +---- / --------------------> Next.js :3000
   |
   +---- /api/ ----------------> Express :5000
                                      |
                                      v
                              MongoDB :27017
                              Docker
                              pacte-mongodb
```

### Emplacements importants

``` text
Projet :
/srv/apps/PacteDuChene

Backend :
/srv/apps/PacteDuChene/backend

Frontend :
/srv/apps/PacteDuChene/frontend

Configuration MongoDB :
/srv/mongodb/docker-compose.yml
/srv/mongodb/.env

Nginx :
/etc/nginx/nginx.conf
/etc/nginx/sites-available/lepacteduchene.fr
/etc/nginx/sites-enabled/lepacteduchene.fr

Services systemd :
/etc/systemd/system/pacte-backend.service
/etc/systemd/system/pacte-frontend.service

Certificats :
/etc/letsencrypt/live/lepacteduchene.fr/
```

------------------------------------------------------------------------

# 2. Démarrage / arrêt rapide

## Vérifier tous les services

``` bash
systemctl is-active pacte-backend pacte-frontend nginx
```

Résultat attendu :

``` text
active
active
active
```

Vérifier également MongoDB :

``` bash
docker ps --filter name=pacte-mongodb
```

Le conteneur doit apparaître avec un statut `Up`.

------------------------------------------------------------------------

## Démarrer tous les services

``` bash
systemctl start pacte-backend
systemctl start pacte-frontend
systemctl start nginx
docker start pacte-mongodb
```

> MongoDB est normalement déjà démarré automatiquement par Docker grâce
> à `restart: unless-stopped`.

------------------------------------------------------------------------

## Arrêter tous les services applicatifs

``` bash
systemctl stop pacte-frontend
systemctl stop pacte-backend
```

Puis, si nécessaire, Nginx :

``` bash
systemctl stop nginx
```

Et MongoDB uniquement si nécessaire :

``` bash
docker stop pacte-mongodb
```

### Attention

Ne pas arrêter MongoDB sans raison : le backend dépend de la base de
données.

------------------------------------------------------------------------

## Redémarrer les services

Backend :

``` bash
systemctl restart pacte-backend
```

Frontend :

``` bash
systemctl restart pacte-frontend
```

Nginx :

``` bash
systemctl reload nginx
```

ou, si un redémarrage complet est nécessaire :

``` bash
systemctl restart nginx
```

MongoDB :

``` bash
docker restart pacte-mongodb
```

------------------------------------------------------------------------

# 3. Vérification express après redémarrage du VPS

À utiliser après un reboot ou une intervention importante :

``` bash
systemctl is-active pacte-backend pacte-frontend nginx
```

``` bash
docker ps --filter name=pacte-mongodb
```

``` bash
ss -ltnp | grep -E ':3000|:5000|:27017'
```

Puis :

``` bash
curl -I https://lepacteduchene.fr
```

``` bash
curl -s https://lepacteduchene.fr/api/health
```

Résultat attendu pour l'API :

``` json
{"success":true,"data":{"status":"ok",...}}
```

------------------------------------------------------------------------

# 4. Développement local

Le développement doit se faire dans VS Code sur le PC.

## Récupérer la dernière version

``` powershell
cd "C:\Users\wariw\Desktop\Le Pacte\PacteDuChene"
git pull origin main
```

## Lancer le backend local

Dans un terminal :

``` powershell
cd backend
npm run dev
```

## Lancer le frontend local

Dans un autre terminal :

``` powershell
cd frontend
npm run dev
```

Le frontend local utilise `frontend/.env.local`.

Le VPS possède sa propre configuration de production.

### Règle importante

Ne jamais copier les secrets de production dans le dépôt Git.

Ne jamais committer :

``` text
.env
.env.local
```

ou tout autre fichier contenant :

``` text
MONGO_URI
DISCORD_BOT_TOKEN
DISCORD_CLIENT_SECRET
PACTE_BOT_API_KEY
```

------------------------------------------------------------------------

# 5. Workflow de déploiement

Le workflow recommandé est :

``` text
PC / VS Code
    |
    | git commit
    | git push
    v
GitHub
    |
    | git pull
    v
VPS
    |
    +--> build backend
    |
    +--> build frontend
    |
    +--> restart services
    v
Production
```

## Étape 1 --- PC

``` powershell
cd "C:\Users\wariw\Desktop\Le Pacte\PacteDuChene"
git status
```

Voir les modifications :

``` powershell
git diff
```

Ajouter :

``` powershell
git add .
```

Commit :

``` powershell
git commit -m "Description de la modification"
```

Envoyer :

``` powershell
git push origin main
```

------------------------------------------------------------------------

# 6. Déploiement backend

Sur le VPS :

``` bash
cd /srv/apps/PacteDuChene
git pull origin main
```

Puis :

``` bash
cd backend
npm install
npm run build
```

Si le build est correct :

``` bash
systemctl restart pacte-backend
```

Vérifier :

``` bash
systemctl status pacte-backend --no-pager
```

Puis :

``` bash
curl -s http://127.0.0.1:5000/api/health
```

Et enfin :

``` bash
curl -s https://lepacteduchene.fr/api/health
```

------------------------------------------------------------------------

# 7. Déploiement frontend

Sur le VPS :

``` bash
cd /srv/apps/PacteDuChene
git pull origin main
```

Puis :

``` bash
cd frontend
npm install
npm run build
```

Si le build est correct :

``` bash
systemctl restart pacte-frontend
```

Vérifier :

``` bash
systemctl status pacte-frontend --no-pager
```

Puis :

``` bash
curl -I http://127.0.0.1:3000
```

Et :

``` bash
curl -I https://lepacteduchene.fr
```

------------------------------------------------------------------------

# 8. Déploiement backend + frontend

Si les deux parties ont changé :

``` bash
cd /srv/apps/PacteDuChene
git pull origin main
```

``` bash
cd backend
npm install
npm run build
```

``` bash
cd ../frontend
npm install
npm run build
```

Puis :

``` bash
systemctl restart pacte-backend
systemctl restart pacte-frontend
```

Contrôle :

``` bash
systemctl is-active pacte-backend pacte-frontend nginx
```

``` bash
curl -s https://lepacteduchene.fr/api/health
```

``` bash
curl -I https://lepacteduchene.fr
```

------------------------------------------------------------------------

# 9. Problème : site inaccessible

## Test Nginx

``` bash
nginx -t
```

Puis :

``` bash
systemctl status nginx --no-pager
```

## Test frontend

``` bash
systemctl status pacte-frontend --no-pager
```

``` bash
ss -ltnp | grep ':3000'
```

``` bash
curl -I http://127.0.0.1:3000
```

## Test backend

``` bash
systemctl status pacte-backend --no-pager
```

``` bash
ss -ltnp | grep ':5000'
```

``` bash
curl -s http://127.0.0.1:5000/api/health
```

### Diagnostic

``` text
127.0.0.1:3000 fonctionne
127.0.0.1:5000 fonctionne
mais domaine = erreur
```

=\> regarder Nginx.

``` text
127.0.0.1:3000 ne fonctionne pas
```

=\> regarder `pacte-frontend`.

``` text
127.0.0.1:5000 ne fonctionne pas
```

=\> regarder `pacte-backend`.

------------------------------------------------------------------------

# 10. Problème : 502 Bad Gateway

Un `502 Bad Gateway` provenant de Nginx signifie généralement que Nginx
ne peut pas joindre le service derrière lui.

## API

``` bash
curl -i http://127.0.0.1:5000/api/health
```

Si cela échoue :

``` bash
systemctl status pacte-backend --no-pager
```

``` bash
journalctl -u pacte-backend -n 50 --no-pager
```

## Frontend

``` bash
curl -I http://127.0.0.1:3000
```

Si cela échoue :

``` bash
systemctl status pacte-frontend --no-pager
```

``` bash
journalctl -u pacte-frontend -n 50 --no-pager
```

------------------------------------------------------------------------

# 11. Problème : backend qui ne démarre pas

Voir les logs :

``` bash
journalctl -u pacte-backend -n 100 --no-pager
```

Suivre les logs en direct :

``` bash
journalctl -u pacte-backend -f
```

Vérifier le build :

``` bash
cd /srv/apps/PacteDuChene/backend
npm run build
```

Vérifier MongoDB :

``` bash
docker ps --filter name=pacte-mongodb
```

Tester MongoDB via l'application :

``` bash
curl -s http://127.0.0.1:5000/api/health
```

------------------------------------------------------------------------

# 12. Problème : frontend qui ne démarre pas

Logs :

``` bash
journalctl -u pacte-frontend -n 100 --no-pager
```

Suivi en direct :

``` bash
journalctl -u pacte-frontend -f
```

Vérifier le build :

``` bash
cd /srv/apps/PacteDuChene/frontend
npm run build
```

Puis :

``` bash
systemctl restart pacte-frontend
```

------------------------------------------------------------------------

# 13. Problème : MongoDB

Voir le conteneur :

``` bash
docker ps -a --filter name=pacte-mongodb
```

Voir les logs :

``` bash
docker logs --tail 100 pacte-mongodb
```

Suivre les logs :

``` bash
docker logs -f pacte-mongodb
```

Redémarrer :

``` bash
docker restart pacte-mongodb
```

Vérifier son état :

``` bash
docker inspect pacte-mongodb --format '{{.State.Status}}'
```

Résultat attendu :

``` text
running
```

------------------------------------------------------------------------

# 14. Tester MongoDB avec mongosh

Connexion avec les identifiants du fichier :

``` bash
/srv/mongodb/.env
```

Exemple :

``` bash
docker exec -it pacte-mongodb mongosh \
  -u "UTILISATEUR" \
  -p "MOT_DE_PASSE" \
  --authenticationDatabase admin \
  pacte_du_chene
```

Pour afficher les utilisateurs de la base :

``` javascript
db.getUsers()
```

Le compte applicatif attendu est `pacte_api` avec des droits `readWrite`
sur `pacte_du_chene`.

------------------------------------------------------------------------

# 15. Problème : API inaccessible

Tester d'abord localement :

``` bash
curl -i http://127.0.0.1:5000/api/health
```

Puis via Nginx :

``` bash
curl -i https://lepacteduchene.fr/api/health
```

### Cas A

``` text
local = 200
public = 502
```

=\> problème Nginx / proxy.

### Cas B

``` text
local = erreur
```

=\> problème backend ou MongoDB.

### Cas C

``` text
local = 200
public = 200
```

=\> infrastructure API fonctionnelle.

------------------------------------------------------------------------

# 16. Nginx

Tester la configuration :

``` bash
nginx -t
```

Recharger après modification :

``` bash
systemctl reload nginx
```

Voir l'état :

``` bash
systemctl status nginx --no-pager
```

Logs d'accès :

``` bash
tail -f /var/log/nginx/access.log
```

Logs d'erreur :

``` bash
tail -f /var/log/nginx/error.log
```

Afficher la configuration réellement chargée :

``` bash
nginx -T
```

> `nginx -T` peut produire beaucoup de sortie. À utiliser surtout pour
> rechercher une configuration ou une erreur.

Configuration du Pacte :

``` bash
cat /etc/nginx/sites-available/lepacteduchene.fr
```

------------------------------------------------------------------------

# 17. HTTPS / Let's Encrypt

Voir le certificat :

``` bash
certbot certificates
```

Tester le renouvellement :

``` bash
certbot renew --dry-run
```

État du renouvellement automatique :

``` bash
systemctl status certbot.timer --no-pager
```

Vérifier HTTPS :

``` bash
curl -I https://lepacteduchene.fr
```

Vérifier `www` :

``` bash
curl -I https://www.lepacteduchene.fr
```

Vérifier la redirection HTTP :

``` bash
curl -I http://lepacteduchene.fr
```

Résultat attendu :

``` text
HTTP/1.1 301 Moved Permanently
Location: https://lepacteduchene.fr/
```

------------------------------------------------------------------------

# 18. Discord OAuth

URL de callback de production :

``` text
https://lepacteduchene.fr/api/auth/discord/callback
```

La Redirect URI doit être exactement la même dans le portail développeur
Discord.

Configuration backend à vérifier sans afficher les secrets :

``` bash
cd /srv/apps/PacteDuChene

grep -E '^(DISCORD_GUILD_ID|DISCORD_CLIENT_ID|DISCORD_REDIRECT_URI)=' backend/.env
```

Tester la route :

``` bash
curl -I https://lepacteduchene.fr/api/auth/discord
```

Une redirection vers Discord est normalement attendue.

En cas de problème, consulter :

``` bash
journalctl -u pacte-backend -n 100 --no-pager
```

------------------------------------------------------------------------

# 19. Logs utiles

## Backend

Dernières lignes :

``` bash
journalctl -u pacte-backend -n 50 --no-pager
```

En direct :

``` bash
journalctl -u pacte-backend -f
```

Depuis une date :

``` bash
journalctl -u pacte-backend --since "1 hour ago"
```

## Frontend

``` bash
journalctl -u pacte-frontend -n 50 --no-pager
```

``` bash
journalctl -u pacte-frontend -f
```

## Nginx

``` bash
tail -n 100 /var/log/nginx/error.log
```

``` bash
tail -f /var/log/nginx/error.log
```

## MongoDB

``` bash
docker logs --tail 100 pacte-mongodb
```

------------------------------------------------------------------------

# 20. Vérification des ports

``` bash
ss -ltnp | grep -E ':3000|:5000|:27017'
```

Architecture attendue :

``` text
3000 → Next.js
5000 → Express
27017 → MongoDB
```

MongoDB est configuré pour écouter localement sur le VPS.

------------------------------------------------------------------------

# 21. Vérifier les processus

``` bash
ps aux | grep -E 'next-server|node' | grep -v grep
```

Services :

``` bash
systemctl --type=service --state=running | grep -E 'pacte|nginx'
```

------------------------------------------------------------------------

# 22. Après une panne : diagnostic express

Copier-coller ce bloc :

``` bash
echo "===== SERVICES ====="
systemctl is-active pacte-backend pacte-frontend nginx

echo "===== MONGODB ====="
docker inspect pacte-mongodb --format '{{.State.Status}}'

echo "===== PORTS ====="
ss -ltnp | grep -E ':3000|:5000|:27017' || true

echo "===== FRONTEND ====="
curl -I --max-time 5 http://127.0.0.1:3000 || true

echo "===== BACKEND ====="
curl -s --max-time 5 http://127.0.0.1:5000/api/health || true

echo
echo "===== PUBLIC SITE ====="
curl -I --max-time 10 https://lepacteduchene.fr || true

echo
echo "===== PUBLIC API ====="
curl -s --max-time 10 https://lepacteduchene.fr/api/health || true
```

Puis les logs :

``` bash
echo "===== BACKEND LOGS ====="
journalctl -u pacte-backend -n 30 --no-pager

echo "===== FRONTEND LOGS ====="
journalctl -u pacte-frontend -n 30 --no-pager

echo "===== NGINX ERRORS ====="
tail -n 30 /var/log/nginx/error.log

echo "===== MONGODB LOGS ====="
docker logs --tail 30 pacte-mongodb
```

------------------------------------------------------------------------

# 23. Si une mise à jour casse la production

Ne pas paniquer et ne pas modifier plusieurs choses à la fois.

## 1. Voir l'état Git

``` bash
cd /srv/apps/PacteDuChene
git status
git log --oneline -5
```

## 2. Vérifier les logs

``` bash
journalctl -u pacte-backend -n 100 --no-pager
journalctl -u pacte-frontend -n 100 --no-pager
```

## 3. Si nécessaire, revenir au commit précédent

À faire uniquement après avoir identifié le commit problématique :

``` bash
git log --oneline -10
```

Puis, si un retour arrière est nécessaire :

``` bash
git checkout <COMMIT>
```

> Cette procédure met le dépôt dans un état détaché. Pour une
> restauration de production durable, préférer ensuite une stratégie Git
> propre (`revert` ou branche/commit de restauration) plutôt que
> travailler durablement en detached HEAD.

Après restauration, reconstruire les parties concernées et redémarrer
les services.

------------------------------------------------------------------------

# 24. Git --- commandes utiles

Voir l'état :

``` bash
git status
```

Historique :

``` bash
git log --oneline -10
```

Branche actuelle :

``` bash
git branch --show-current
```

Dernier commit :

``` bash
git log -1 --oneline
```

Récupérer :

``` bash
git pull origin main
```

Voir les différences avant déploiement :

``` bash
git diff
```

------------------------------------------------------------------------

# 25. Important : ne pas utiliser `git pull` n'importe comment

Avant un déploiement :

``` bash
cd /srv/apps/PacteDuChene
git status
```

Le dépôt de production doit normalement être propre.

Si Git indique des modifications locales inattendues :

``` text
modified:
```

**Ne pas faire immédiatement `git reset --hard` ou
`git checkout -- .`.**

Ces commandes peuvent supprimer des modifications locales.

Examiner d'abord :

``` bash
git diff
```

------------------------------------------------------------------------

# 26. Modification de la configuration `.env`

Les secrets de production sont stockés hors du dépôt Git.

Backend :

``` bash
nano /srv/apps/PacteDuChene/backend/.env
```

Frontend :

``` bash
nano /srv/apps/PacteDuChene/frontend/.env.local
```

Après modification du backend `.env` :

``` bash
systemctl restart pacte-backend
```

Après modification de `frontend/.env.local`, un **nouveau build
frontend** est normalement nécessaire :

``` bash
cd /srv/apps/PacteDuChene/frontend
npm run build
systemctl restart pacte-frontend
```

> Les variables `NEXT_PUBLIC_*` sont intégrées au build Next.js.
> Modifier `.env.local` sans reconstruire le frontend peut donc laisser
> l'ancienne valeur dans le build.

------------------------------------------------------------------------

# 27. Reboot du VPS

Avant :

``` bash
systemctl is-active pacte-backend pacte-frontend nginx
docker inspect pacte-mongodb --format '{{.State.Status}}'
```

Redémarrer :

``` bash
reboot
```

Après reconnexion :

``` bash
systemctl is-active pacte-backend pacte-frontend nginx
```

``` bash
docker inspect pacte-mongodb --format '{{.State.Status}}'
```

``` bash
curl -s https://lepacteduchene.fr/api/health
```

``` bash
curl -I https://lepacteduchene.fr
```

Les services doivent être revenus automatiquement grâce à `systemd` et
Docker.

------------------------------------------------------------------------

# 28. Commandes de secours à retenir

Si tu ne sais plus quoi faire, commencer par :

``` bash
systemctl is-active pacte-backend pacte-frontend nginx
```

``` bash
docker inspect pacte-mongodb --format '{{.State.Status}}'
```

``` bash
curl -s http://127.0.0.1:5000/api/health
```

``` bash
curl -I http://127.0.0.1:3000
```

``` bash
curl -s https://lepacteduchene.fr/api/health
```

Puis regarder les logs :

``` bash
journalctl -u pacte-backend -n 50 --no-pager
```

``` bash
journalctl -u pacte-frontend -n 50 --no-pager
```

``` bash
tail -n 50 /var/log/nginx/error.log
```

``` bash
docker logs --tail 50 pacte-mongodb
```

------------------------------------------------------------------------

# 29. Règle générale de maintenance

Toujours diagnostiquer dans cet ordre :

``` text
1. MongoDB
      ↓
2. Backend
      ↓
3. Frontend
      ↓
4. Nginx
      ↓
5. HTTPS / DNS
      ↓
6. Fonctionnalité concernée
```

Pour une erreur publique :

``` text
https://lepacteduchene.fr
```

tester d'abord :

``` text
127.0.0.1:3000
```

puis Nginx.

Pour une erreur API :

``` text
https://lepacteduchene.fr/api/health
```

tester d'abord :

``` text
127.0.0.1:5000/api/health
```

puis Nginx.

**Ne modifier qu'une chose à la fois et retester après chaque
modification.**
