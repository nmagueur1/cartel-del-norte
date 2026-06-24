const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const { hasAccess, denyAccess } = require('../../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('briefing')
    .setDescription('📋 Poste un briefing d\'opération'),

  async execute(interaction) {
    if (!hasAccess(interaction.member)) return denyAccess(interaction);

    const modal = new ModalBuilder()
      .setCustomId('modal_briefing')
      .setTitle('📋 Briefing d\'Opération');

    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('briefing_nom')
          .setLabel('Nom de l\'opération')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('Ex: Opération Serpent Noir')
          .setRequired(true)
          .setMaxLength(100)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('briefing_objectif')
          .setLabel('Objectif')
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true)
          .setMaxLength(500)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('briefing_lieu')
          .setLabel('Lieu / Zone d\'opération')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMaxLength(100)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('briefing_heure')
          .setLabel('Heure de début — Point de RDV')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('Ex: 21h00 — Parking du casino')
          .setRequired(true)
          .setMaxLength(100)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('briefing_notes')
          .setLabel('Consignes supplémentaires (optionnel)')
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(false)
          .setMaxLength(500)
      ),
    );

    await interaction.showModal(modal);
  },
};
