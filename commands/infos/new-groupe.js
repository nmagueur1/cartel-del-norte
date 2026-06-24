const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const { hasAccess, denyAccess } = require('../../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('new-groupe')
    .setDescription('Crée un salon d\'information pour un nouveau groupe'),

  async execute(interaction) {
    if (!hasAccess(interaction.member)) return denyAccess(interaction);

    const modal = new ModalBuilder()
      .setCustomId('modal_new_groupe')
      .setTitle('Nouveau groupe');

    const nomInput = new TextInputBuilder()
      .setCustomId('nom_groupe')
      .setLabel('Nom du groupe')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Ex: Famille Moretti')
      .setRequired(true);

    const categorieInput = new TextInputBuilder()
      .setCustomId('categorie_groupe')
      .setLabel('Catégorie')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Orga / Gang / PF / Inde / SASP / FIB')
      .setRequired(true);

    const emojiInput = new TextInputBuilder()
      .setCustomId('emoji_groupe')
      .setLabel('Emoji du salon')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Ex: 🔫')
      .setMaxLength(8)
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(nomInput),
      new ActionRowBuilder().addComponents(categorieInput),
      new ActionRowBuilder().addComponents(emojiInput),
    );

    await interaction.showModal(modal);
  },
};
