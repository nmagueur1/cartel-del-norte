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

// Déduplication : évite de traiter le même message deux fois
const processing = new Set();

module.exports = {
  name: 'messageCreate',
  async execute(message, client) {
    // Ignorer les bots et les mauvais salons
    if (message.author.bot) return;
    if (message.channel.id !== INSTAGRAM_CHANNEL_ID) return;

    // Ignorer si déjà en cours de traitement
    if (processing.has(message.id)) return;
    processing.add(message.id);
    setTimeout(() => processing.delete(message.id), 15_000);

    // Chercher une image dans les pièces jointes
    const imageAttachment = message.attachments.find(
      (a) => a.contentType && IMAGE_TYPES.some((t) => a.contentType.startsWith(t))
    );

    if (!imageAttachment) {
      try { await message.delete(); } catch { /* permissions */ }
      return;
    }

    const caption      = message.content?.trim() || null;
    const displayName  = message.member?.displayName ?? message.author.username;
    const avatarUrl    = message.author.displayAvatarURL({ size: 64 });

    // 1. Télécharger l'image AVANT de supprimer le message original
    const fileName = imageAttachment.name || 'image.png';
    const buffer   = await fetchBuffer(imageAttachment.url);
    const file     = new AttachmentBuilder(buffer, { name: fileName });

    // 2. Supprimer le message original
    // Si erreur 10008 (Unknown Message) → une autre instance du bot l'a déjà traité → on stop
    try {
      await message.delete();
    } catch (err) {
      if (err.code === 10008) return;
      // Autre erreur (permissions) → on continue quand même
    }

    // 3. Uploader l'image dans le salon de stockage privé pour obtenir une URL CDN permanente
    //    Ce message n'est jamais supprimé → l'URL reste valide indéfiniment
    let cdnUrl = null;
    try {
      const storageChannel = await client.channels.fetch(config.channels.mediaStorage);
      const storageMsg     = await storageChannel.send({ files: [file] });
      cdnUrl = storageMsg.attachments.first()?.url ?? null;
    } catch (err) {
      console.error('[Instagram] Erreur upload stockage :', err.message);
      return;
    }

    if (!cdnUrl) return;

    // 4. Construire l'embed propre (pas de fichier joint, juste l'URL CDN)
    const embed = new EmbedBuilder()
      .setColor(0xE1306C)
      .setAuthor({ name: displayName, iconURL: avatarUrl })
      .setImage(cdnUrl)
      .setFooter({ text: '0 personne n\'a aimé' });

    if (caption) embed.setDescription(caption);

    // Bouton like temporaire (désactivé, pas encore l'ID du message)
    const tmpRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('insta_like_tmp')
        .setLabel('❤️  0')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true)
    );

    // 5. Poster l'embed dans le salon Instagram (sans fichier joint → pas de double image)
    const posted = await message.channel.send({ embeds: [embed], components: [tmpRow] });

    // 6. Mettre à jour le bouton avec le vrai message ID
    const realRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`insta_like_${posted.id}`)
        .setLabel('❤️  0')
        .setStyle(ButtonStyle.Secondary)
    );

    await posted.edit({ components: [realRow] });
  },
};
