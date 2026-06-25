const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const config = require('../../utils/config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('role')
    .setDescription('🎖️ Affiche le panel de demande de rôle pour les nouveaux membres'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor(config.colors.primary)
      .setTitle('🎖️ Demande de Rôle')
      .setDescription(
        'Tu viens d\'arriver sur le serveur ?\n\n' +
        'Clique sur le bouton ci-dessous pour soumettre une demande de rôle.\n' +
        'Un membre du staff traitera ta demande dans les plus brefs délais.'
      )
      .setImage(config.bannerUrl)
      .setFooter({ text: config.footerText })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('demande_role_panel_btn')
        .setLabel('Faire une demande de rôle')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('🎖️')
    );

    await interaction.channel.send({ embeds: [embed], components: [row] });
    await interaction.reply({ content: '✅ Panel de demande de rôle posté !', ephemeral: true });
  },
};
