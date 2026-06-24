# 🚀 Tuto – Déployer le bot Del Norte sur Railway

---

## ÉTAPE 1 — Créer l'application Discord

1. Va sur **https://discord.com/developers/applications**
2. Clique sur **New Application** → donne lui un nom (ex: `Del Norte Bot`)
3. Dans le menu gauche, va dans **Bot**
   - Clique **Add Bot** → **Yes, do it!**
   - Désactive **Public Bot** si tu veux qu'il soit privé
   - Active les 3 **Privileged Gateway Intents** :
     - ✅ Presence Intent
     - ✅ Server Members Intent
     - ✅ Message Content Intent
4. Toujours dans **Bot**, clique **Reset Token** → copie le token quelque part (tu en auras besoin)
5. Dans le menu gauche, va dans **OAuth2 > General** → copie le **Client ID**

---

## ÉTAPE 2 — Inviter le bot sur ton serveur

1. Dans **OAuth2 > URL Generator**
2. Coche **bot** + **applications.commands**
3. Dans les permissions bot, coche :
   - Administrator (le plus simple)
   - OU à la main : Manage Roles, Kick Members, Ban Members, Moderate Members, Manage Channels, Manage Threads, Send Messages, Embed Links, Read Message History, View Channels
4. Copie l'URL générée en bas → ouvre-la dans ton navigateur
5. Sélectionne ton serveur → **Autoriser**

---

## ÉTAPE 3 — Récupérer les IDs Discord

Pour trouver les IDs, active le **Mode développeur** Discord :
`Paramètres utilisateur` → `Avancé` → `Mode développeur` ✅

Ensuite **clic droit** sur :

| Ce qu'il faut | Comment l'obtenir |
|---|---|
| **GUILD_ID** | Clic droit sur l'icône de ton serveur → *Copier l'identifiant du serveur* |
| **CLIENT_ID** | C'est le même que l'Application ID sur le portail développeur |
| **DISCORD_TOKEN** | Le token copié à l'étape 1 |

---

## ÉTAPE 4 — Mettre à jour les IDs dans `config.js`

Ouvre `utils/config.js` et mets à jour les IDs des salons et rôles **de ton nouveau serveur**.

Tu dois créer ces salons sur ton serveur et copier leurs IDs (clic droit → *Copier l'identifiant*) :

```js
channels: {
  annonces:  'ID_DU_SALON_ANNONCES',
  radio:     'ID_DU_SALON_RADIO',
  logs:      'ID_DU_SALON_LOGS',
  absence:   'ID_DU_SALON_ABSENCES',
},
```

Et ces rôles (créer les rôles sur le serveur, clic droit → *Copier l'identifiant*) :

```js
roles: {
  accesBot: 'ID_DU_ROLE_ACCES_BOT',    // rôle qui peut utiliser les commandes
  carter:   'ID_DU_ROLE_KYEE',          // rôle qui peut faire /absence
  avert1:   'ID_DU_ROLE_AVERTISSEMENT_1',
  avert2:   'ID_DU_ROLE_AVERTISSEMENT_2',
  avert3:   'ID_DU_ROLE_AVERTISSEMENT_3',
},
```

> ⚠️ Le bot doit avoir un rôle **au-dessus** des rôles qu'il doit attribuer (avertissements, etc.) dans la hiérarchie des rôles du serveur.

---

## ÉTAPE 5 — Préparer le code pour Railway

Railway a besoin d'un fichier `railway.json` ou d'une config de démarrage. Le projet fonctionne déjà avec `node index.js`, donc il n'y a **rien à ajouter** — Railway détecte automatiquement Node.js.

Vérifie juste que ton `package.json` a bien un script `start` :

```json
"scripts": {
  "start": "node index.js"
}
```

C'est déjà le cas ✅

---

## ÉTAPE 6 — Pousser le code sur GitHub

Railway déploie depuis GitHub. Si le projet n'est pas encore sur Git :

```bash
# Dans le dossier "Bot Discord"
git init
git add .
git commit -m "Initial commit - Del Norte Bot"
```

Crée un repo sur **https://github.com/new** (mets-le en **privé**), puis :

```bash
git remote add origin https://github.com/TON_PSEUDO/del-norte-bot.git
git branch -M main
git push -u origin main
```

> ⚠️ **Ne push jamais le fichier `.env`** — il est normalement dans `.gitignore`. Vérifie que `.gitignore` contient bien `.env`.

---

## ÉTAPE 7 — Déployer sur Railway

1. Va sur **https://railway.app** → connecte-toi avec GitHub
2. Clique **New Project** → **Deploy from GitHub repo**
3. Sélectionne ton repo `del-norte-bot`
4. Railway détecte automatiquement Node.js et lance `npm install` + `npm start`

---

## ÉTAPE 8 — Ajouter les variables d'environnement sur Railway

1. Dans ton projet Railway, clique sur le service (le bloc de ton bot)
2. Onglet **Variables**
3. Ajoute les 3 variables :

| Clé | Valeur |
|---|---|
| `DISCORD_TOKEN` | Le token copié à l'étape 1 |
| `CLIENT_ID` | L'Application ID du portail développeur |
| `GUILD_ID` | L'ID de ton serveur Discord |

4. Après avoir ajouté les variables, Railway **redémarre automatiquement** le bot

---

## ÉTAPE 9 — Vérifier que ça fonctionne

1. Dans Railway, onglet **Deployments** → vérifie que le build est vert ✅
2. Clique sur **View Logs** et cherche :
   ```
   ✅ X commande(s) déployée(s) avec succès.
   ✅ NomDuBot#XXXX est en ligne et prêt !
   ```
3. Sur ton serveur Discord, tape `/help` → le bot doit répondre

---

## ⚠️ Problèmes fréquents

| Problème | Solution |
|---|---|
| `Missing Access` au deploy des commandes | Vérifie que `GUILD_ID` est correct et que le bot est bien invité sur le serveur |
| Les commandes n'apparaissent pas | Attends 1-2 min (Discord peut être lent), ou réinvite le bot |
| `Missing Permissions` sur kick/ban/mute | Monte le rôle du bot plus haut dans la hiérarchie des rôles |
| Le bot se déconnecte en boucle | Token invalide → régénère-le sur le portail développeur |
| `/absence` refusé | L'utilisateur n'a pas le rôle dont l'ID est dans `config.roles.carter` |

---

## 🔁 Mettre à jour le bot plus tard

À chaque fois que tu modifies le code :

```bash
git add .
git commit -m "Description du changement"
git push
```

Railway redéploie automatiquement à chaque push sur `main`. 🎉
