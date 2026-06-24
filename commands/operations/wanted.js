const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const { hasAccess, denyAccess } = require('../../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('wanted')
    .setDescription('🔴 Publie une fiche WANTED sur un personnage'),

  async execute(interaction) {
    if (!hasAccess(interaction.member)) return denyAccess(interaction);

    const modal = new ModalBuilder()
      .setCustomId('modal_wanted')
      .setTitle('🔴 Fiche WANTED');

    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('wanted_nom')
          .setLabel('Nom du personnage')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMaxLength(100)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('wanted_crimes')
          .setLabel('Crimes / Motifs')
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true)
          .setMaxLength(500)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('wanted_prime')
          .setLabel('Prime (montant)')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('Ex: $50,000')
          .setRequired(true)
          .setMaxLength(30)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('wanted_description')
          .setLabel('Description / Dernière position (optionnel)')
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(false)
          .setMaxLength(300)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('wanted_ping')
          .setLabel('Mention à pinguer (optionnel)')
          .setStyle(TextInputStyle.Short)
          .setRequired(false)
          .setPlaceholder('@everyone ou laisse vide')
          .setMaxLength(100)
      ),
    );

    await interaction.showModal(modal);
  },
};
