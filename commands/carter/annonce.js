const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('annonce')
    .setDescription('📢 Poste une annonce officielle dans le salon annonces'),

  async execute(interaction) {
    const modal = new ModalBuilder()
      .setCustomId('modal_annonce')
      .setTitle('📢 Nouvelle Annonce');

    const titre = new TextInputBuilder()
      .setCustomId('ann_titre')
      .setLabel('Titre de l\'annonce')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(200);

    const description = new TextInputBuilder()
      .setCustomId('ann_description')
      .setLabel('Contenu de l\'annonce')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true)
      .setMaxLength(2000);

    const ping = new TextInputBuilder()
      .setCustomId('ann_ping')
      .setLabel('Mention à pinguer (ex: @everyone) – optionnel')
      .setStyle(TextInputStyle.Short)
      .setRequired(false)
      .setPlaceholder('@everyone ou laisse vide');

    modal.addComponents(
      new ActionRowBuilder().addComponents(titre),
      new ActionRowBuilder().addComponents(description),
      new ActionRowBuilder().addComponents(ping),
    );

    await interaction.showModal(modal);
  },
};
