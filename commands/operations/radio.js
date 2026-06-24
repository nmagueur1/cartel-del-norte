const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../utils/config');
const { sendLog } = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('radio')
    .setDescription('📻 Communique le numéro de radio du soir')
    .addStringOption((o) =>
      o.setName('numero').setDescription('Numéro de fréquence radio').setRequired(true)
    ),

  async execute(interaction, client) {
    const numero = interaction.options.getString('numero');

    const embed = new EmbedBuilder()
      .setColor(config.colors.primary)
      .setTitle('📻 Fréquence Radio du Soir')
      .setDescription(
        '> *Information confidentielle. Ne pas partager hors de la famille.*\n\n' +
        `**Fréquence ce soir :**\n\n` +
        `\`\`\`fix\n${numero}\n\`\`\``
      )
      .addFields({
        name: '⚠️ Rappel',
        value: 'Cette fréquence est **valable ce soir uniquement**. Ne la communiquez pas à l\'extérieur.',
      })
      .setImage(config.bannerUrl)
      .setFooter({ text: config.footerText })
      .setTimestamp();

    const radioChannel = await client.channels.fetch(config.channels.radio);
    await radioChannel.send({ embeds: [embed] });

    await interaction.reply({ content: `✅ Fréquence radio publiée dans <#${config.channels.radio}> !`, ephemeral: true });
    await sendLog(client, { action: 'Radio du soir publiée', user: interaction.user, details: `Fréquence : ${numero}`, color: config.colors.info });
  },
};
