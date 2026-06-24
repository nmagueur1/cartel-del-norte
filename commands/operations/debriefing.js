const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const { hasAccess, denyAccess } = require('../../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('debriefing')
    .setDescription('📊 Poste un debriefing d\'opération'),

  async execute(interaction) {
    if (!hasAccess(interaction.member)) return denyAccess(interaction);

    const modal = new ModalBuilder()
      .setCustomId('modal_debriefing')
      .setTitle('📊 Debriefing d\'Opération');

    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('debrief_nom')
          .setLabel('Nom de l\'opération')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMaxLength(100)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('debrief_resultat')
          .setLabel('Résultat')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('Succès / Échec / Partiel')
          .setRequired(true)
          .setMaxLength(50)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('debrief_bilan')
          .setLabel('Bilan')
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true)
          .setMaxLength(500)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('debrief_pertes')
          .setLabel('Pertes / Dommages (optionnel)')
          .setStyle(TextInputStyle.Short)
          .setRequired(false)
          .setMaxLength(200)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('debrief_notes')
          .setLabel('Notes supplémentaires (optionnel)')
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(false)
          .setMaxLength(500)
      ),
    );

    await interaction.showModal(modal);
  },
};
