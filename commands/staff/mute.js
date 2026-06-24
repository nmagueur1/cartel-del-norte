const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../utils/config');
const { sendLog } = require('../../utils/logger');
const { isAdmin, denyAccess } = require('../../utils/permissions');

const DURATIONS = {
  '60': 60 * 1000,
  '300': 5 * 60 * 1000,
  '600': 10 * 60 * 1000,
  '3600': 60 * 60 * 1000,
  '86400': 24 * 60 * 60 * 1000,
  '604800': 7 * 24 * 60 * 60 * 1000,
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mute')
    .setDescription('🔇 Mute un membre (timeout Discord)')
    .addUserOption((o) =>
      o.setName('membre').setDescription('Membre à mute').setRequired(true)
    )
    .addStringOption((o) =>
      o.setName('duree')
        .setDescription('Durée du mute')
        .setRequired(true)
        .addChoices(
          { name: '1 minute', value: '60' },
          { name: '5 minutes', value: '300' },
          { name: '10 minutes', value: '600' },
          { name: '1 heure', value: '3600' },
          { name: '1 jour', value: '86400' },
          { name: '1 semaine', value: '604800' },
        )
    )
    .addStringOption((o) =>
      o.setName('raison').setDescription('Raison du mute').setRequired(false)
    ),

  async execute(interaction, client) {
    if (!isAdmin(interaction.member)) return denyAccess(interaction);

    const target = interaction.options.getMember('membre');
    const dureeKey = interaction.options.getString('duree');
    const raison = interaction.options.getString('raison') || 'Aucune raison précisée';
    const durationMs = DURATIONS[dureeKey];

    if (!target) return interaction.reply({ content: '❌ Membre introuvable.', ephemeral: true });
    if (!target.moderatable) return interaction.reply({ content: '❌ Je ne peux pas muter ce membre.', ephemeral: true });

    const dureeLabel = Object.entries({
      '60': '1 minute', '300': '5 minutes', '600': '10 minutes',
      '3600': '1 heure', '86400': '1 jour', '604800': '1 semaine',
    }).find(([k]) => k === dureeKey)?.[1] || dureeKey + 's';

    try {
      await target.timeout(durationMs, raison);

      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(config.colors.warning)
            .setTitle('🔇 Membre muté')
            .addFields(
              { name: 'Membre', value: `${target.user.tag}`, inline: true },
              { name: 'Durée', value: dureeLabel, inline: true },
              { name: 'Raison', value: raison, inline: false },
            )
            .setImage(config.bannerUrl)
            .setFooter({ text: config.footerText })
            .setTimestamp(),
        ],
        ephemeral: true,
      });

      await sendLog(client, {
        action: 'Mute (Timeout)',
        user: interaction.user,
        target: target.user,
        details: `Durée : ${dureeLabel} | Raison : ${raison}`,
        color: config.colors.warning,
      });
    } catch (err) {
      await interaction.reply({ content: `❌ Erreur : ${err.message}`, ephemeral: true });
    }
  },
};
