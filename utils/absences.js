// ────────────────────────────────────────────
// Utilitaires – Gestion des absences
// ────────────────────────────────────────────

const { EmbedBuilder } = require('discord.js');
const config = require('./config');
const fs   = require('fs');
const path = require('path');

const ABSENCES_PATH = path.join(__dirname, '../data/absences.json');

// ── Lecture / écriture ─────────────────────
function getAbsencesData() {
  return JSON.parse(fs.readFileSync(ABSENCES_PATH, 'utf8'));
}

function saveAbsencesData(data) {
  fs.writeFileSync(ABSENCES_PATH, JSON.stringify(data, null, 2));
}

// ── Construction de l'embed panel ──────────
function buildPanelEmbed(absences) {
  const total    = absences ? absences.length : 0;
  const statLine = total === 0
    ? '`0` absence en cours'
    : total === 1
      ? '`1` absence en cours'
      : `\`${total}\` absences en cours`;

  const embed = new EmbedBuilder()
    .setColor(config.colors.warning)
    .setTitle('🗓️  Panel des Absences — Staff Del Norte - Famille Kyee')
    .setDescription(
      '> Ce panel est **mis à jour automatiquement** à chaque nouvelle déclaration.\n' +
      '> Seul le staff peut consulter ce canal.\n\n' +
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
      '**📌 Comment ça marche ?**\n' +
      '▸ Un membre utilise `/absence` pour déclarer son absence\n' +
      '▸ Un embed de notification est posté dans <#' + config.channels.absence + '>\n' +
      '▸ Ce panel se met à jour automatiquement avec les nouvelles infos\n' +
      '▸ Utilisez `/panel-absence` pour rafraîchir ou reposer ce panel\n\n' +
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
    )
    .addFields({ name: '📊 Statut', value: statLine, inline: false })
    .setImage(config.bannerUrl)
    .setFooter({ text: `${config.footerText} • Mis à jour` })
    .setTimestamp();

  if (!absences || absences.length === 0) {
    embed.addFields({
      name: '✅ Aucune absence',
      value: 'Tout le monde est présent pour le moment.',
      inline: false,
    });
  } else {
    const lines = absences.map((a, i) =>
      `**${i + 1}.** 👤 **${a.prenom} ${a.nom}** • <@${a.discordId}>\n` +
      `┣ 🛫 Départ : \`${a.depart}\`\n` +
      `┣ 🛬 Retour : \`${a.retour}\`\n` +
      `┗ 📝 Déclaré le \`${a.declaredAt}\` par <@${a.declaredBy}>`
    );
    embed.addFields({
      name: '📋 Absences déclarées',
      value: lines.join('\n\n'),
      inline: false,
    });
  }

  return embed;
}

// ── Mise à jour automatique du panel ───────
async function updatePanel(client, data) {
  if (!data.panelMessageId || !data.panelChannelId) return;

  try {
    const panelChannel = await client.channels.fetch(data.panelChannelId);
    const panelMsg     = await panelChannel.messages.fetch(data.panelMessageId);
    const embed        = buildPanelEmbed(data.absences);
    await panelMsg.edit({ embeds: [embed] });
  } catch (err) {
    console.error('[Panel absence – update]', err);
    // Le message a peut-être été supprimé → on réinitialise les refs
    data.panelMessageId = null;
    data.panelChannelId = null;
    saveAbsencesData(data);
  }
}

module.exports = {
  ABSENCES_PATH,
  getAbsencesData,
  saveAbsencesData,
  buildPanelEmbed,
  updatePanel,
};
