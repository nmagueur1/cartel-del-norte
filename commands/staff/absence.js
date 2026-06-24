const {
  SlashCommandBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('absence')
    .setDescription('📅 Déclarer une absence'),

  async execute(interaction) {
    const modal = new ModalBuilder()
      .setCustomId('modal_absence')
      .setTitle('📅 Déclaration d\'Absence');

    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('absence_nom')
          .setLabel('Nom')
          .setStyle(TextInputStyle.Short)
          .setMaxLength(50)
          .setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('absence_prenom')
          .setLabel('Prénom')
          .setStyle(TextInputStyle.Short)
          .setMaxLength(50)
          .setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('absence_discord_id')
          .setLabel('ID Discord')
          .setPlaceholder('Ex : 123456789012345678')
          .setStyle(TextInputStyle.Short)
          .setMaxLength(20)
          .setValue(interaction.user.id)
          .setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('absence_depart')
          .setLabel('Date de départ')
          .setPlaceholder('Ex : 08/04/2026')
          .setStyle(TextInputStyle.Short)
          .setMaxLength(20)
          .setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('absence_retour')
          .setLabel('Date de retour')
          .setPlaceholder('Ex : 15/04/2026')
          .setStyle(TextInputStyle.Short)
          .setMaxLength(20)
          .setRequired(true)
      ),
    );

    return interaction.showModal(modal);
  },
};
