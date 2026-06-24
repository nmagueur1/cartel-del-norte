const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../utils/config');
const { sendLog } = require('../../utils/logger');
const { isAdmin, denyAccess } = require('../../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('👢 Expulse un membre du serveur')
    .addUserOption((o) =>
      o.setName('membre').setDescription('Membre à expulser').setRequired(true)
    )
    .addStringOption((o) =>
      o.setName('raison').setDescription('Raison du kick').setRequired(false)
    ),

  async execute(interaction, client) {
    if (!isAdmin(interaction.member)) return denyAccess(interaction);

    const target = interaction.options.getMember('membre');
    const raison = interaction.options.getString('raison') || 'Aucune raison précisée';

    if (!target) return interaction.reply({ content: '❌ Membre introuvable.', ephemeral: true });
    if (!target.kickable) return interaction.reply({ content: '❌ Ce membre ne peut pas être expulsé.', ephemeral: true });

    try {
      // DM avant le kick
      await target.user.send({
        embeds: [
          new EmbedBuilder()
            .setColor(config.colors.danger)
            .setTitle('👢 Tu as été expulsé')
            .setDescription(`Tu as été **expulsé** du serveur **Del Norte - Famille Kyee**.\n\n**Raison :** ${raison}`)
            .setImage(config.bannerUrl)
            .setFooter({ text: config.footerText }),
        ],
      }).catch(() => {}); // Ignorer si DM fermés

      await target.kick(raison);

      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(config.colors.warning)
            .setTitle('👢 Membre expulsé')
            .addFields(
              { name: 'Membre', value: `${target.user.tag}`, inline: true },
              { name: 'Raison', value: raison, inline: true },
            )
            .setImage(config.bannerUrl)
            .setFooter({ text: config.footerText })
            .setTimestamp(),
        ],
        ephemeral: true,
      });

      await sendLog(client, {
        action: 'Kick',
        user: interaction.user,
        target: target.user,
        details: `Raison : ${raison}`,
        color: config.colors.warning,
      });
    } catch (err) {
      await interaction.reply({ content: `❌ Erreur : ${err.message}`, ephemeral: true });
    }
  },
};
