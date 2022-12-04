// Written by: Tempdog
const { Client, Intents, MessageActionRow, MessageButton, MessageEmbed } = require('discord.js');
const Sequelize = require('sequelize');
const { token, test } = require('./config.json');
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.DIRECT_MESSAGES] });

const sequelize = new Sequelize('database', 'user', 'password', {
  host: 'localhost',
  dialect: 'sqlite',
  storage: 'database.sqlite',
});

const Joins = sequelize.define('joins', {
  id: {
    type: Sequelize.INTEGER,
    defaultValue: 0,
    allowNull: false,
    unique: true,
    'primaryKey': true,
  },
  number: {
    type: Sequelize.INTEGER,
    defaultValue: 0,
    allowNull: false,
  },
});

const Guests = sequelize.define('guests', {
  id: {
    type: Sequelize.INTEGER,
    defaultValue: 0,
    allowNull: false,
    unique: true,
    'primaryKey': true,
  },
  number: {
    type: Sequelize.INTEGER,
    defaultValue: 0,
    allowNull: false,
  },
});

function pad(num, size) {
  let s = "0000" + num;
  return s.substring(s.length-size);
}

// SERVER DETAILS
const recruitsCategory = 'RECRUITS';
const staffRoleTag = '<@&846886887074562059>';
const staffRoleId = '846886887074562059'; // LiveID 846886887074562059 TestID 815813424721690664

client.on('ready', () => {
  Joins.sync();
  Guests.sync();
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', message => {
  if (message.content == '!welcome' && message.member.roles.cache.has(staffRoleId)) {
    const row = new MessageActionRow()
      .addComponents(
        new MessageButton()
          .setCustomId('joinTicket')
          .setLabel('Join Infinity')
          .setStyle('PRIMARY'),
        new MessageButton()
          .setCustomId('guestTicket')
          .setLabel('Join As Guest')
          .setStyle('SECONDARY'),
      );
    
    message.delete();
    message.channel.send({ components: [row] });
  }
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isButton()) return;

  if (interaction.customId == 'guestTicket') {
    let newNumber;
    let ticket = await Guests.findOne({ where: { id: 0 } });
    if (!ticket) {
      const newTicket = await Guests.create({
        id: 0,
        number: 0,
      });
      newNumber = newTicket.number+1;
    } else {
      newNumber = ticket.number+1;
    }
    const updateNumber = await Guests.update({ number: newNumber }, { where: { id: 0 } });

    const category = interaction.guild.channels.cache.find(c => c.name.toLowerCase() == recruitsCategory.toLowerCase() && c.type == 'GUILD_CATEGORY');
    category.createChannel(`guest-${pad(newNumber, 4)}`, { type: 'GUILD_TEXT' }).then(async (channel) => {
      const newRole = await interaction.guild.roles.create({
        name: `guest-${pad(newNumber, 4)}`,
        color: 'WHITE',
      });
      await interaction.member.roles.add(newRole.id);
      await channel.permissionOverwrites.edit(newRole.id, { VIEW_CHANNEL: true });

      const message = await interaction.channel.send(`Success! Please head over to ${channel}.`);
      setTimeout(() => {
        message.delete();
      }, 5000);

      const row = new MessageActionRow()
      .addComponents(
        new MessageButton()
          .setCustomId('close')
          .setLabel('Close Ticket')
          .setStyle('DANGER'),
      );

      const embed = new MessageEmbed()
        .setColor('WHITE')
        .setTitle('INF Welcome System')
        .setDescription("Welcome! A staff member will be with you as soon as they can.\nTo get started, please __provide us with your RSN & how you found us__.");

      interaction.update({});
      channel.send({ content: `${staffRoleTag} ${interaction.member}`, embeds: [embed], components: [row] });
    });
  }

  if (interaction.customId == 'joinTicket') {
    let newNumber;
    let ticket = await Joins.findOne({ where: { id: 0 } });
    if (!ticket) {
      const newTicket = await Joins.create({
        id: 0,
        number: 0,
      });
      newNumber = newTicket.number+1;
    } else {
      newNumber = ticket.number+1;
    }
    const updateNumber = await Joins.update({ number: newNumber }, { where: { id: 0 } });

    const category = interaction.guild.channels.cache.find(c => c.name.toLowerCase() == recruitsCategory.toLowerCase() && c.type == 'GUILD_CATEGORY');
    category.createChannel(`Inf-${pad(newNumber, 4)}`, { type: 'GUILD_TEXT' }).then(async (channel) => {
      const newRole = await interaction.guild.roles.create({
        name: `Inf-${pad(newNumber, 4)}`,
        color: 'WHITE',
      });
      await interaction.member.roles.add(newRole.id);
      await channel.permissionOverwrites.edit(newRole.id, { VIEW_CHANNEL: true });

      const message = await interaction.channel.send(`Success! Please head over to ${channel}.`);
      setTimeout(() => {
        message.delete();
      }, 5000);

      const row = new MessageActionRow()
      .addComponents(
        new MessageButton()
          .setCustomId('close')
          .setLabel('Close Ticket')
          .setStyle('DANGER'),
      );

      const embed = new MessageEmbed()
        .setColor('WHITE')
        .setTitle('INF Welcome System')
        .setDescription("Welcome! A staff member will be with you as soon as they can.\nTo get started, please __provide us with your RSN & how you found us__.");
      
      interaction.update({});
      channel.send({ content: `${staffRoleTag} ${interaction.member}`, embeds: [embed], components: [row] });
    });
  }

  if (interaction.customId == 'close' && interaction.member.roles.cache.has(staffRoleId)) {
    const row = new MessageActionRow()
      .addComponents(
        new MessageButton()
          .setCustomId('close')
          .setLabel('Close Ticket')
          .setStyle('DANGER')
          .setDisabled(true),
      );

    const embed = new MessageEmbed()
      .setColor('RED')
      .setTitle('INF Welcome System')
      .setDescription(`This ticket has been successfully closed by ${interaction.member} and will be deleted in 15 seconds.`);

    interaction.update({ components: [row] });
    interaction.channel.send({ embeds: [embed] });
    setTimeout(async () => {
      const role = interaction.guild.roles.cache.find(role => role.name.toLowerCase() == interaction.channel.name.toLowerCase());
      if (role) {
        await role.delete();
      }
      await interaction.channel.delete();
    }, 15000);
  }
});

client.login(token);
