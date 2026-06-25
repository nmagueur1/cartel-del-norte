const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  AttachmentBuilder,
} = require('discord.js');
const https = require('https');
const http  = require('http');
const config = require('../utils/config');

function fetchBuffer(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    lib.get(url, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

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

    // Télécharger l'image AVANT de supprimer le message (l'URL devient invalide après)
    const fileName = imageAttachment.name || 'image.png';
    const buffer   = await fetchBuffer(imageAttachment.url);
    const file     = new AttachmentBuilder(buffer, { name: fileName });

    // Supprimer le message original
    try {
      await message.delete();
    } catch { /* permissions manquantes */ }

    // Construire l'embed style Instagram (référence le fichier ré-uploadé)
    const embed = new EmbedBuilder()
      .setColor(0xE1306C) // Rose Instagram
      .setAuthor({ name: displayName, iconURL: avatarUrl })
      .setImage(`attachment://${fileName}`)
      .setFooter({ text: '0 personne n\'a aimé' });

    if (caption) embed.setDescription(caption);

    // Bouton like temporairement désactivé (on n'a pas encore l'ID du message)
    const tmpRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('insta_like_tmp')
        .setLabel('❤️  0')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true)
    );

    // Envoyer l'embed avec l'image ré-uploadée
    const posted = await message.channel.send({ embeds: [embed], files: [file], components: [tmpRow] });

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
