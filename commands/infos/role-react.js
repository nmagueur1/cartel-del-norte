const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../../utils/config');
const { sendLog } = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('role-react')
    .setDescription('🎭 Crée un système de role-react avec bouton')
    .addRoleOption((o) =>
      o.setName('role').setDescription('Rôle à attribuer').setRequired(true)
    )
    .addStringOption((o) =>
      o.setName('titre').setDescription('Titre de l\'embed').setRequired(true)
    )
    .addStringOption((o) =>
      o.setName('description').setDescription('Description de l\'embed').setRequired(false)
    )
    .addStringOption((o) =>
      o.setName('emoji').setDescription('Emoji du bouton (ex: 🦅 / ⭐)').setRequired(false)
    )
    .addStringOption((o) =>
      o.setName('message-id').setDescription('ID d\'un message existant sur lequel ajouter le bouton').setRequired(false)
    ),

  async execute(interaction, client) {
    const role        = interaction.options.getRole('role');
    const titre       = interaction.options.getString('titre');
    const description = interaction.options.getString('description') || 'Clique sur le bouton pour obtenir ou retirer le rôle.';
    const emoji       = interaction.options.getString('emoji') || '🎭';
    const messageId   = interaction.options.getString('message-id');

    const button = new ButtonBuilder()
      .setCustomId(`role_react_${role.id}`)
      .setLabel(`${emoji} Obtenir le rôle ${role.name}`)
      .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder().addComponents(button);

    if (messageId) {
      // Ajouter le bouton à un message existant
      try {
        const msg = await interaction.channel.messages.fetch(messageId);
        await msg.edit({ components: [row] });
        await interaction.reply({ content: `✅ Bouton role-react ajouté au message \`${messageId}\` !`, ephemeral: true });
      } catch {
        return interaction.reply({ content: '❌ Message introuvable dans ce salon.', ephemeral: true });
      }
    } else {
      // Créer un nouvel embed avec le bouton
      const embed = new EmbedBuilder()
        .setColor(config.colors.primary)
        .setTitle(titre)
        .setDescription(description)
        .setImage(config.bannerUrl)
        .setFooter({ text: config.footerText })
        .setTimestamp();

      await interaction.reply({ embeds: [embed], components: [row] });
    }

    await sendLog(client, {
      action: 'Role-React créé',
      user: interaction.user,
      details: `Rôle : ${role.name} (\`${role.id}\`)`,
      color: config.colors.info,
    });
  },
};
