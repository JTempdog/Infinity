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

const Tickets = sequelize.define('tickets', {
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
const ticketCategory = 'TICKETS';
const archiveCategory = 'ARCHIVES';
const staffRoleTag = '<@&846886887074562059>';
const staffRoleId = '846886887074562059'; // LiveID 846886887074562059 TestID 815813424721690664

const guildId = '657989577075720195'; // LiveID 657989577075720195 TestID 815648620719112192
const dmId = '230152815207514114'; // LiveID 230152815207514114 TestID 488872809414656000

client.on('ready', () => {
  Tickets.sync();
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', message => {
  if (message.content == '!ticket' && message.member.roles.cache.has(staffRoleId)) {
    const row = new MessageActionRow()
      .addComponents(
        new MessageButton()
          .setCustomId('openTicket')
          .setLabel('Open Ticket')
          .setStyle('PRIMARY'),
        new MessageButton()
          .setCustomId('tipOff')
          .setLabel('Anonymous Tip')
          .setStyle('SECONDARY'),
      );

    const embed = new MessageEmbed()
      .setColor('WHITE')
      .setTitle('Having a problem? Want to leave a tip?')
      .setDescription('Let us know what\'s going on! Get connected.\n\n__Create a ticket__ to speak with the staff team\nOR __forward an anonymous tip__ to the team!');
    
    message.delete();
    message.channel.send({ embeds: [embed], components: [row] });
  }

  if (message.guild == null && message.author != client.user) {
    const guildToSend = client.guilds.cache.find(g => g.id == guildId);
    const dmChannel = guildToSend.members.cache.find(c => c.id == dmId);
    const embed = new MessageEmbed()
      .setColor('WHITE')
      .setTitle('New Anonymous Tip');
    
    dmChannel.send({ embeds: [embed] }).then(dmChannel.send(message.content));

    const embed2 = new MessageEmbed()
      .setColor('GREEN')
      .setDescription('Thank you! Your tip has been anonymously forwarded to Ms Seren!');
    message.channel.send({ embeds: [embed2] });
  }
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isButton()) return;

  if (interaction.customId == 'tipOff') {
    const embed = new MessageEmbed()
      .setColor('WHITE')
      .setTitle('INF Anonymous Tip System')
      .setDescription('Send anonymous tips by typing your tip here and it will be forwarded to Ms Seren!\n**If you do not provide enough information your tip may not properly be resolved.**');

    interaction.update({});
    interaction.member.send({ embeds: [embed] });
  }

  if (interaction.customId == 'openTicket') {
    let newNumber;
    let ticket = await Tickets.findOne({ where: { id: 0 } });
    if (!ticket) {
      const newTicket = await Tickets.create({
        id: 0,
        number: 0,
      });
      newNumber = newTicket.number+1;
    } else {
      newNumber = ticket.number+1;
    }
    const updateNumber = await Tickets.update({ number: newNumber }, { where: { id: 0 } });

    const category = interaction.guild.channels.cache.find(c => c.name.toLowerCase() == ticketCategory.toLowerCase() && c.type == 'GUILD_CATEGORY');
    category.createChannel(`ticket-${pad(newNumber, 4)}`, { type: 'GUILD_TEXT' }).then(async (channel) => {
      const newRole = await interaction.guild.roles.create({
        name: `ticket-${pad(newNumber, 4)}`,
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
          .setCustomId('archiveTicket')
          .setLabel('Archive Ticket')
          .setStyle('SECONDARY'),
        new MessageButton()
          .setCustomId('closeTicket')
          .setLabel('Close Ticket')
          .setStyle('DANGER'),
      );

      const embed = new MessageEmbed()
        .setColor('WHITE')
        .setTitle('INF Ticket System')
        .setDescription("Please elaborate on why you've opened a ticket with us today.\nThe staff team will get with you as soon as we can.");
      
      interaction.update({});
      channel.send({ content: `${staffRoleTag} ${interaction.member}`, embeds: [embed], components: [row] });
    });
  }

  if (interaction.customId == 'closeTicket' && interaction.member.roles.cache.has(staffRoleId)) {
    const row = new MessageActionRow()
      .addComponents(
        new MessageButton()
          .setCustomId('archiveTicket')
          .setLabel('Archive Ticket')
          .setStyle('SECONDARY')
          .setDisabled(true),
        new MessageButton()
          .setCustomId('closeTicket')
          .setLabel('Close Ticket')
          .setStyle('DANGER')
          .setDisabled(true),
      );

    const embed = new MessageEmbed()
      .setColor('RED')
      .setTitle('INF Ticket System')
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

  if (interaction.customId == 'archiveTicket' && interaction.member.roles.cache.has(staffRoleId)) {
    const row1 = new MessageActionRow()
      .addComponents(
        new MessageButton()
          .setCustomId('archiveTicket')
          .setLabel('Archive Ticket')
          .setStyle('SECONDARY')
          .setDisabled(true),
        new MessageButton()
          .setCustomId('closeTicket')
          .setLabel('Close Ticket')
          .setStyle('DANGER')
          .setDisabled(true),
      );

      const row2 = new MessageActionRow()
      .addComponents(
        new MessageButton()
          .setCustomId('archiveTicket')
          .setLabel('Archive Ticket')
          .setStyle('SECONDARY')
          .setDisabled(true),
        new MessageButton()
          .setCustomId('closeTicket')
          .setLabel('Close Ticket')
          .setStyle('DANGER'),
      );

    const embed1 = new MessageEmbed()
      .setColor('BLURPLE')
      .setTitle('INF Ticket System')
      .setDescription(`This ticket has been successfully archived by ${interaction.member} and will be moved in 15 seconds.`);

      const embed2 = new MessageEmbed()
      .setColor('GREEN')
      .setTitle("ARCHIVED");

    interaction.update({ components: [row1] });
    interaction.channel.send({ embeds: [embed1] });
    setTimeout(async () => {
      interaction.editReply({ components: [row2] });
      interaction.channel.send({ embeds: [embed2] });
      const category = interaction.guild.channels.cache.find(c => c.name.toLowerCase() == archiveCategory.toLowerCase() && c.type == 'GUILD_CATEGORY');
      await interaction.channel.setParent(category.id);
      await interaction.guild.roles.cache.find(role => role.name.toLowerCase() == interaction.channel.name.toLowerCase()).delete();
      await interaction.channel.lockPermissions();
    }, 15000);
  }
});

client.login(token);