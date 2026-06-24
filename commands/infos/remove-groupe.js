const { SlashCommandBuilder } = require('discord.js');
const { hasAccess, denyAccess } = require('../../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('remove-groupe')
    .setDescription('Supprime le salon d\'un groupe et tous ses fils')
    .addChannelOption(option =>
      option
        .setName('salon')
        .setDescription('Le salon du groupe à supprimer')
        .setRequired(true)
    ),

  async execute(interaction) {
    if (!hasAccess(interaction.member)) return denyAccess(interaction);

    const channel = interaction.options.getChannel('salon');

    await interaction.deferReply({ ephemeral: true });

    try {
      // Supprimer les fils actifs et archivés
      const threads = await channel.threads.fetchActive();
      for (const thread of threads.threads.values()) {
        await thread.delete();
      }

      const archived = await channel.threads.fetchArchived();
      for (const thread of archived.threads.values()) {
        await thread.delete();
      }

      const nomSalon = channel.name;
      await channel.delete(`Suppression groupe par ${interaction.user.tag}`);

      await interaction.editReply({ content: `✅ Salon **${nomSalon}** et ses fils ont été supprimés.` });

      const { sendLog } = require('../utils/logger');
      const config = require('../utils/config');
      await sendLog(interaction.client, {
        action: 'Groupe supprimé',
        user: interaction.user,
        details: `Salon : ${nomSalon}`,
        color: config.colors.danger,
      });
    } catch (err) {
      console.error('[remove-groupe]', err);
      await interaction.editReply({ content: `❌ Erreur : ${err.message}` });
    }
  },
};
