const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('embed')
    .setDescription('✏️ Crée un embed personnalisé dans ce salon'),

  async execute(interaction) {
    const modal = new ModalBuilder()
      .setCustomId('modal_embed')
      .setTitle('✏️ Créer un Embed');

    const titre = new TextInputBuilder()
      .setCustomId('embed_titre')
      .setLabel('Titre de l\'embed')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(256);

    const description = new TextInputBuilder()
      .setCustomId('embed_description')
      .setLabel('Description (contenu principal)')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true)
      .setMaxLength(2000);

    const couleur = new TextInputBuilder()
      .setCustomId('embed_couleur')
      .setLabel('Couleur HEX (ex: #D4AF37) – optionnel')
      .setStyle(TextInputStyle.Short)
      .setRequired(false)
      .setPlaceholder('#D4AF37');

    const footer = new TextInputBuilder()
      .setCustomId('embed_footer')
      .setLabel('Footer – optionnel')
      .setStyle(TextInputStyle.Short)
      .setRequired(false)
      .setPlaceholder('Del Norte - Famille Kyee');

    const image = new TextInputBuilder()
      .setCustomId('embed_image')
      .setLabel('URL image (optionnel)')
      .setStyle(TextInputStyle.Short)
      .setRequired(false);

    modal.addComponents(
      new ActionRowBuilder().addComponents(titre),
      new ActionRowBuilder().addComponents(description),
      new ActionRowBuilder().addComponents(couleur),
      new ActionRowBuilder().addComponents(footer),
      new ActionRowBuilder().addComponents(image),
    );

    await interaction.showModal(modal);
  },
};
