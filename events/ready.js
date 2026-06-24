const { ActivityType } = require('discord.js');

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    console.log(`✅ ${client.user.tag} est en ligne et prêt !`);
    client.user.setActivity('Del Norte - Famille Kyee', { type: ActivityType.Watching });
  },
};
