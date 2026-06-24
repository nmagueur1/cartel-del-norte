const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../utils/config');
const { sendLog } = require('../../utils/logger');
const { isAdmin, denyAccess } = require('../../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('🔨 Bannit un membre du serveur')
    .addUserOption((o) =>
      o.setName('membre').setDescription('Membre à bannir').setRequired(true)
    )
    .addStringOption((o) =>
      o.setName('raison').setDescription('Raison du ban').setRequired(false)
    )
    .addIntegerOption((o) =>
      o.setName('jours').setDescription('Jours de messages à supprimer (0-7)').setMinValue(0).setMaxValue(7).setRequired(false)
    ),

  async execute(interaction, client) {
    if (!isAdmin(interaction.member)) return denyAccess(interaction);

    const target = interaction.options.getMember('membre');
    const raison = interaction.options.getString('raison') || 'Aucune raison précisée';
    const jours  = interaction.options.getInteger('jours') ?? 0;

    if (!target) return interaction.reply({ content: '❌ Membre introuvable.', ephemeral: true });
    if (!target.bannable) return interaction.reply({ content: '❌ Ce membre ne peut pas être banni.', ephemeral: true });

    try {
      await target.user.send({
        embeds: [
          new EmbedBuilder()
            .setColor(config.colors.danger)
            .setTitle('🔨 Tu as été banni')
            .setDescription(`Tu as été **banni définitivement** du serveur **Del Norte - Famille Kyee**.\n\n**Raison :** ${raison}`)
            .setImage(config.bannerUrl)
            .setFooter({ text: config.footerText }),
        ],
      }).catch(() => {});

      await target.ban({ deleteMessageDays: jours, reason: raison });

      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(config.colors.danger)
            .setTitle('🔨 Membre banni')
            .addFields(
              { name: 'Membre', value: `${target.user.tag}`, inline: true },
              { name: 'Raison', value: raison, inline: true },
              { name: 'Messages supprimés', value: `${jours} jour(s)`, inline: true },
            )
            .setImage(config.bannerUrl)
            .setFooter({ text: config.footerText })
            .setTimestamp(),
        ],
        ephemeral: true,
      });

      await sendLog(client, {
        action: 'Ban',
        user: interaction.user,
        target: target.user,
        details: `Raison : ${raison} | Messages supprimés : ${jours}j`,
        color: config.colors.danger,
      });
    } catch (err) {
      await interaction.reply({ content: `❌ Erreur : ${err.message}`, ephemeral: true });
    }
  },
};
