// ============================================
// Gestion des armes en OP + Panel persistant
// ============================================

const { EmbedBuilder } = require('discord.js');
const config = require('./config');
const fs   = require('fs');
const path = require('path');

const ARMES_OP_PATH = path.join(__dirname, '../data/armes-op.json');

// ── Catégories d'armes ────────────────────────
// limite = nombre max d'armes de la catégorie autorisées par OP
//          ⇒ mettre à null si pas de limite (le panel affichera juste le compteur)
const CATEGORIES = [
  {
    id:     'assaut',
    nom:    "Fusils d'assaut / lourds",
    emoji:  '🪖',
    limite: null,
    armes: {
      '1504642925701763112': 'ADP',
      '1504643031805198476': 'AKU',
      '1504643230883647621': 'Gusenberg',
      '1504643303281262723': 'AK47',
      '1504643361062260746': 'SG 552',
      '1504643431551471616': 'Fusil Compact',
      '1504643489143455866': 'UMP 45',
    },
  },
  {
    id:     'pompe',
    nom:    'Fusils à pompe',
    emoji:  '💥',
    limite: null,
    armes: {
      '1504643548207648860': 'Canon Scié',
      '1504643596664443011': 'Pompe Bullpup',
      '1504643656706162700': 'DB-SG',
      '1504643105834532885': 'Pompe MK2',
    },
  },
  {
    id:     'smg',
    nom:    'SMG / Mitraillettes',
    emoji:  '⚡',
    limite: null,
    armes: {
      '1504643708618801223': 'Skorpion',
      '1504643740118159602': 'Tec 9',
      '1504643773852811264': 'Uzi',
      '1504643797554827304': 'Uzi Tactique',
      '1504643842891055214': 'Tec Pistol',
    },
  },
  {
    id:     'pistolet',
    nom:    'Pistolets',
    emoji:  '🔫',
    limite: null,
    armes: {
      '1504643914429370368': 'Glock 17',
      '1504643944603062473': 'P88 Compact',
      '1504643991461691482': 'Beretta',
      '1504644019425120387': 'Colt 1911',
      '1504644045232799895': 'Cal.50',
      '1504644069807226880': 'Revolver Lourd',
    },
  },
];

// Map plat id -> nom (pour les commandes start/stop-op)
const ARMES = {};
for (const cat of CATEGORIES) {
  for (const [id, nom] of Object.entries(cat.armes)) {
    ARMES[id] = nom;
  }
}

// ── Helpers ───────────────────────────────────
function isArme(roleId)         { return Object.prototype.hasOwnProperty.call(ARMES, roleId); }
function getNomArme(roleId)     { return ARMES[roleId] || null; }
function listeArmesIds()        { return Object.keys(ARMES); }
function getCategorieDArme(roleId) {
  return CATEGORIES.find((c) => Object.prototype.hasOwnProperty.call(c.armes, roleId)) || null;
}

// ── Lecture / écriture du fichier de persistance ──
function getArmesOpData() {
  if (!fs.existsSync(ARMES_OP_PATH)) {
    return { panelMessageId: null, panelChannelId: null };
  }
  return JSON.parse(fs.readFileSync(ARMES_OP_PATH, 'utf8'));
}

function saveArmesOpData(data) {
  fs.writeFileSync(ARMES_OP_PATH, JSON.stringify(data, null, 2));
}

// ── Construction de l'embed panel ─────────────
async function buildPanelEmbed(guild) {
  // S'assurer que le cache des membres est complet
  await guild.members.fetch();

  let totalDistribues = 0;
  const stats = [];

  for (const cat of CATEGORIES) {
    let count = 0; // nb d'armes distribuées = nb de porteurs dans la catégorie
    const lignes = [];

    for (const [armeId, nom] of Object.entries(cat.armes)) {
      const role = guild.roles.cache.get(armeId);
      if (!role) {
        lignes.push(`▸ **${nom}** : ⚠️ rôle introuvable`);
        continue;
      }

      const holders = role.members;
      if (holders.size === 0) {
        lignes.push(`▸ **${nom}** : *libre*`);
      } else {
        const mentions = holders.map((m) => `<@${m.id}>`).join(', ');
        lignes.push(`▸ **${nom}** : ${mentions}`);
        count += holders.size;
      }
    }

    totalDistribues += count;
    stats.push({ cat, count, lignes });
  }

  // Lignes de stats globales par catégorie
  const statsLines = stats.map((s) => {
    const limTxt = s.cat.limite ? `\`${s.count}/${s.cat.limite}\`` : `\`${s.count}\``;
    return `${s.cat.emoji} **${s.cat.nom}** : ${limTxt} arme(s) distribuée(s)`;
  }).join('\n');

  const embed = new EmbedBuilder()
    .setColor(config.colors.primary)
    .setTitle('🔫  Panel des Armes — OP en cours')
    .setDescription(
      '> Ce panel est **mis à jour automatiquement** à chaque `/start-op` et `/stop-op`.\n\n' +
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
      '**📊 Répartition par catégorie**\n' +
      statsLines + '\n\n' +
      `**Total :** \`${totalDistribues}\` arme(s) distribuée(s)\n\n` +
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
    )
    .setImage(config.bannerUrl)
    .setFooter({ text: `${config.footerText} • Mis à jour` })
    .setTimestamp();

  // Détail par catégorie (un field par catégorie)
  for (const s of stats) {
    const limTag = s.cat.limite ? ` ${s.count}/${s.cat.limite}` : ` ${s.count}`;
    const name   = `${s.cat.emoji}  ${s.cat.nom} (${limTag.trim()})`;

    // Découpage si > 1024 caractères
    const value = s.lignes.join('\n');
    if (value.length <= 1024) {
      embed.addFields({ name, value });
    } else {
      const chunks = [];
      let current = '';
      for (const ligne of s.lignes) {
        if ((current + '\n' + ligne).length > 1024) {
          chunks.push(current);
          current = ligne;
        } else {
          current = current ? `${current}\n${ligne}` : ligne;
        }
      }
      if (current) chunks.push(current);
      chunks.forEach((chunk, i) => {
        embed.addFields({ name: i === 0 ? name : `${name} (suite)`, value: chunk });
      });
    }
  }

  if (totalDistribues === 0) {
    embed.addFields({
      name: '✅ Aucune arme distribuée',
      value: 'Toutes les armes sont actuellement en armurerie.',
    });
  }

  return embed;
}

// ── Mise à jour automatique du panel ──────────
async function updatePanel(client, guild) {
  const data = getArmesOpData();
  if (!data.panelMessageId || !data.panelChannelId) return;

  try {
    const panelChannel = await client.channels.fetch(data.panelChannelId);
    const panelMsg     = await panelChannel.messages.fetch(data.panelMessageId);
    const embed        = await buildPanelEmbed(guild);
    await panelMsg.edit({ embeds: [embed] });
  } catch (err) {
    console.error('[Panel OP – update]', err);
    // Le message a probablement été supprimé → on réinitialise les refs
    data.panelMessageId = null;
    data.panelChannelId = null;
    saveArmesOpData(data);
  }
}

module.exports = {
  ARMES,
  CATEGORIES,
  isArme,
  getNomArme,
  listeArmesIds,
  getCategorieDArme,
  getArmesOpData,
  saveArmesOpData,
  buildPanelEmbed,
  updatePanel,
};
