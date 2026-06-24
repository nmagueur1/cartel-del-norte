const { SlashCommandBuilder } = require('discord.js');
const { isAdmin, denyAccess }  = require('../../utils/permissions');
const { sendLog }              = require('../../utils/logger');
const config                   = require('../../utils/config');
const {
  getAbsencesData,
  saveAbsencesData,
  buildPanelEmbed,
} = require('../../utils/absences');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('panel-absence')
    .setDescription('📋 Affiche / actualise le panel des absences (Staff uniquement)'),

  async execute(interaction, client) {
    if (!isAdmin(interaction.member)) return denyAccess(interaction);

    const data  = getAbsencesData();
    const embed = buildPanelEmbed(data.absences);

    // ── Si un panel existe déjà, on le met à jour ──
    if (data.panelMessageId && data.panelChannelId) {
      try {
        const panelChannel = await client.channels.fetch(data.panelChannelId);
        const panelMsg     = await panelChannel.messages.fetch(data.panelMessageId);
        await panelMsg.edit({ embeds: [embed] });

        return interaction.reply({
          content: '🔄 Panel des absences mis à jour !',
          ephemeral: true,
        });
      } catch {
        // Message introuvable → on en crée un nouveau
      }
    }

    // ── Nouveau panel ──────────────────────────────
    const msg = await interaction.channel.send({ embeds: [embed] });

    data.panelMessageId = msg.id;
    data.panelChannelId = interaction.channel.id;
    saveAbsencesData(data);

    await interaction.reply({
      content: '✅ Panel des absences posté ! Il se mettra à jour automatiquement à chaque nouvelle déclaration.',
      ephemeral: true,
    });

    await sendLog(client, {
      action: 'Panel absence posté',
      user: interaction.user,
      color: config.colors.info,
    });
  },
};
