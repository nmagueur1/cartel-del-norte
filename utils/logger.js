const { EmbedBuilder } = require('discord.js');
const config = require('./config');

/**
 * Envoie un log dans le salon 🤖・logs
 * @param {Client} client - Instance du bot
 * @param {Object} opts - { action, user, target, details, color }
 */
async function sendLog(client, { action, user, target = null, details = null, color = null }) {
  try {
    const logsChannel = await client.channels.fetch(config.channels.logs);
    if (!logsChannel) return;

    const embed = new EmbedBuilder()
      .setColor(color || config.colors.info)
      .setTitle(`📋 ${action}`)
      .setImage(config.bannerUrl)
      .setTimestamp()
      .setFooter({ text: config.footerText });

    if (user) {
      embed.addFields({
        name: '👤 Exécuté par',
        value: `<@${user.id}> \`(${user.tag})\``,
        inline: true,
      });
    }
    if (target) {
      embed.addFields({
        name: '🎯 Cible',
        value: `<@${target.id}> \`(${target.tag})\``,
        inline: true,
      });
    }
    if (details) {
      embed.addFields({ name: '📝 Détails', value: details, inline: false });
    }

    await logsChannel.send({ embeds: [embed] });
  } catch (err) {
    console.error('[Logger] Erreur lors de l\'envoi du log :', err.message);
  }
}

module.exports = { sendLog };
