const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const config = require('../utils/config');

const INSTAGRAM_CHANNEL_ID = '1519407405157322923';

// Types MIME image acceptés
const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];

module.exports = {
  name: 'messageCreate',
  async execute(message, client) {
    // Ignorer les bots et les mauvais salons
    if (message.author.bot) return;
    if (message.channel.id !== INSTAGRAM_CHANNEL_ID) return;

    // Chercher une image dans les pièces jointes
    const imageAttachment = message.attachments.find(
      (a) => a.contentType && IMAGE_TYPES.some((t) => a.contentType.startsWith(t))
    );

    if (!imageAttachment) return; // Pas d'image → on ne touche à rien

    const caption = message.content?.trim() || null;
    const author  = message.member ?? message.author;
    const displayName = message.member?.displayName ?? message.author.username;
    const avatarUrl   = message.author.displayAvatarURL({ size: 64 });

    // Supprimer le message original
    try {
      await message.delete();
    } catch { /* permissions manquantes */ }

    // Construire l'embed style Instagram
    const embed = new EmbedBuilder()
      .setColor(0xE1306C) // Rose Instagram
      .setAuthor({ name: displayName, iconURL: avatarUrl })
      .setImage(imageAttachment.url)
      .setFooter({ text: config.footerText })
      .setTimestamp();

    if (caption) embed.setDescription(caption);

    // Bouton like
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`insta_like_placeholder`) // sera remplacé après envoi
        .setLabel('❤️  0')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true) // désactivé jusqu'à qu'on ait le vrai message ID
    );

    // Envoyer l'embed
    const posted = await message.channel.send({ embeds: [embed], components: [row] });

    // Mettre à jour le bouton avec le vrai message ID
    const realRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`insta_like_${posted.id}`)
        .setLabel('❤️  0')
        .setStyle(ButtonStyle.Secondary)
    );

    await posted.edit({ components: [realRow] });
  },
};
