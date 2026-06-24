# 🦅 Carter Bot – Bot Discord The Carter Family

> Bot officiel de la **Carter Family**. Annonces, modération, gestion des absences, infos serveur.

---

## 📋 Prérequis

- [Node.js](https://nodejs.org/) v18 ou supérieur
- Un compte [Discord Developer](https://discord.com/developers/applications)
- Un compte [GitHub](https://github.com)
- Un compte [Railway](https://railway.app)

---

## 🚀 Installation locale

### 1. Clone le repository

```bash
git clone https://github.com/nmagueur1/carter-bot.git
cd carter-bot
```

### 2. Installe les dépendances

```bash
npm install
```

### 3. Configure les variables d'environnement

Copie `.env.example` en `.env` et renseigne :

```env
DISCORD_TOKEN=ton_token
CLIENT_ID=ton_client_id
GUILD_ID=id_de_ton_serveur
```

### 4. Vérifie les IDs Discord

Tous les IDs de salons et rôles sont déjà renseignés dans `utils/config.js`. Adapte-les si tu changes de serveur.

### 5. Déploie les slash commands

```bash
npm run deploy
```

### 6. Lance le bot

```bash
npm start
```

---

## ☁️ Hébergement sur Railway

1. Push ton repo sur GitHub
2. Sur [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**
3. Onglet **Variables** → ajoute `DISCORD_TOKEN`, `CLIENT_ID`, `GUILD_ID`
4. Railway redéploie automatiquement à chaque push

---

## 📁 Structure

```
carter-bot/
├── index.js               # Point d'entrée
├── deploy-commands.js     # Déploiement des slash commands
├── package.json
├── railway.json
├── .env                   # Variables d'environnement (à ne pas committer)
├── .env.example
├── .gitignore
│
├── commands/
│   ├── infos/             # /reglement /organisation /embed /role-react /help
│   ├── carter/            # /annonce
│   ├── operations/        # /radio
│   └── staff/             # /kick /ban /mute /absence /panel-absence /remove-absence
│
├── events/
│   ├── ready.js
│   └── interactionCreate.js
│
├── utils/
│   ├── config.js          # IDs salons, rôles, couleurs
│   ├── logger.js
│   ├── permissions.js
│   └── absences.js
│
└── data/
    └── absences.json
```

---

## 🎮 Liste des commandes

### 📖 INFOS
| Commande | Description | Accès |
|---|---|---|
| `/reglement` | Poste le règlement | Bot Access |
| `/organisation` | Poste la hiérarchie | Bot Access |
| `/embed` | Crée un embed personnalisé | Bot Access |
| `/role-react` | Crée un bouton de role-react | Bot Access |
| `/help` | Affiche la liste des commandes | Tous |

### 📢 CARTER
| Commande | Description | Accès |
|---|---|---|
| `/annonce` | Poste une annonce dans le salon annonces | Bot Access |

### ⚙️ OPÉRATIONS
| Commande | Description | Accès |
|---|---|---|
| `/radio <numero>` | Publie la fréquence radio du soir | Bot Access |

### 🛡️ STAFF
| Commande | Description | Accès |
|---|---|---|
| `/kick <membre> [raison]` | Expulse un membre | Admin |
| `/ban <membre> [raison] [jours]` | Bannit un membre | Admin |
| `/mute <membre> <durée> [raison]` | Mute un membre | Admin |
| `/absence` | Déclarer une absence | Rôle Carter |
| `/panel-absence` | Affiche / actualise le panel des absences | Admin |
| `/remove-absence` | Supprime une absence | Admin |

---

## 🔐 Permissions requises

Dans le portail développeur Discord, active les **Privileged Gateway Intents** :
- ✅ Server Members Intent
- ✅ Message Content Intent

Permissions du bot sur le serveur :
- `Send Messages`, `Embed Links`, `Manage Roles`
- `Kick Members`, `Ban Members`, `Moderate Members` (Timeout)
- `Read Message History`, `View Channels`

---

## 🦅 The Carter Family • Blood & Honor
