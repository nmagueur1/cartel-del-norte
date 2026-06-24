require('dotenv').config();
const { Client, GatewayIntentBits, Collection, Partials, REST, Routes } = require('discord.js');
const fs   = require('fs');
const path = require('path');

// ────────────────────────────────────────────
// Démarrage principal (async pour deploy avant login)
// ────────────────────────────────────────────
(async () => {

  // ── 1. Deploy des commandes slash ─────────
  try {
    const commands    = [];
    const foldersPath = path.join(__dirname, 'commands');

    for (const folder of fs.readdirSync(foldersPath)) {
      for (const file of fs.readdirSync(path.join(foldersPath, folder)).filter(f => f.endsWith('.js'))) {
        const cmd = require(path.join(foldersPath, folder, file));
        if ('data' in cmd) commands.push(cmd.data.toJSON());
      }
    }

    const rest = new REST().setToken(process.env.DISCORD_TOKEN);
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands }
    );
    console.log(`✅ ${commands.length} commande(s) déployée(s) avec succès.`);
  } catch (err) {
    console.error('⚠️  Échec du deploy des commandes :', err.message);
  }

  // ── 2. Création du client Discord ─────────
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildVoiceStates,
      GatewayIntentBits.DirectMessages,
    ],
    partials: [Partials.Channel, Partials.Message],
  });

  client.commands = new Collection();

  // ── 3. Chargement des commandes ───────────
  const commandFolders = fs.readdirSync(path.join(__dirname, 'commands'));
  for (const folder of commandFolders) {
    const commandFiles = fs
      .readdirSync(path.join(__dirname, 'commands', folder))
      .filter((f) => f.endsWith('.js'));
    for (const file of commandFiles) {
      const command = require(path.join(__dirname, 'commands', folder, file));
      if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
      }
    }
  }

  // ── 4. Chargement des événements ──────────
  const eventFiles = fs
    .readdirSync(path.join(__dirname, 'events'))
    .filter((f) => f.endsWith('.js'));
  for (const file of eventFiles) {
    const event = require(path.join(__dirname, 'events', file));
    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args, client));
    } else {
      client.on(event.name, (...args) => event.execute(...args, client));
    }
  }

  // ── 5. Connexion ──────────────────────────
  client.login(process.env.DISCORD_TOKEN);

})();
