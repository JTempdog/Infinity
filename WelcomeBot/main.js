// Written by: Tempdog
// Access required libraries and configuration file
const { Client, Intents, MessageActionRow, MessageButton, MessageEmbed } = require('discord.js');
const Sequelize = require('sequelize');
const { token, test } = require('./config.json');

// Initialize the client
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.DIRECT_MESSAGES] });

// Initialize the database
const sequelize = new Sequelize('database', 'user', 'password', {
  host: 'localhost',
  dialect: 'sqlite',
  storage: 'database.sqlite',
});

// Define tables for joins and guests
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

// Function for padding the ticket numbers
function pad(num, size) {
  let s = "0000" + num;
  return s.substring(s.length - size);
}

// SERVER DETAILS
const recruitsCategory = 'RECRUITS';
const staffRoleTag = '<@&846886887074562059>';
const staffRoleId = '846886887074562059'; // LiveID 846886887074562059 TestID 815813424721690664

// Start the client
client.on('ready', () => {
  // Add tables to client
  Joins.sync();
  Guests.sync();

  console.log(`Logged in as ${client.user.tag}!`);
});

// Listener for text commands
client.on('messageCreate', message => {
  // Command to produce the welcome buttons making sure the author is staff
  if (message.content == '!welcome' && message.member.roles.cache.has(staffRoleId)) {
    // Create a button for joins and guests
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

    // Delete the command sent and send buttons
    message.delete();
    message.channel.send({ components: [row] });
  }
});

// Listener for button clicks only
client.on('interactionCreate', async interaction => {
  if (!interaction.isButton()) return;

  // Check for ticket roles
  const hasGuestRole = interaction.member.roles.cache.find(role => role.name.toLowerCase().startsWith('guest-'));
  const hasInfRole = interaction.member.roles.cache.find(role => role.name.toLowerCase().startsWith('inf-'));

  // When the guest button is clicked
  if (interaction.customId == 'guestTicket') {
    // If there is a ticket role direct user to their open ticket
    if (hasGuestRole || hasInfRole) {
      return await interaction.reply({ content: `${interaction.member} you have a join ticket open. Please finish that one first.`, ephemeral: true });
    }

    // Update the ticket number for guests in the database
    let newNumber;
    let ticket = await Guests.findOne({ where: { id: 0 } });
    if (!ticket) {
      const newTicket = await Guests.create({
        id: 0,
        number: 0,
      });
      newNumber = newTicket.number + 1;
    } else {
      newNumber = ticket.number + 1;
    }
    const updateNumber = await Guests.update({ number: newNumber }, { where: { id: 0 } });

    // Find the recruits channel category and create a new channel under it
    const category = interaction.guild.channels.cache.find(c => c.name.toLowerCase() == recruitsCategory.toLowerCase() && c.type == 'GUILD_CATEGORY');
    category.createChannel(`guest-${pad(newNumber, 4)}`, { type: 'GUILD_TEXT' }).then(async (channel) => {

      // Create a role for the ticket
      const newRole = await interaction.guild.roles.create({
        name: `guest-${pad(newNumber, 4)}`,
        color: 'WHITE',
      });

      // Add new role to user and allow role to see ticket
      await interaction.member.roles.add(newRole.id);
      await channel.permissionOverwrites.edit(newRole.id, { VIEW_CHANNEL: true });

      // Create a button to close the ticket
      const row = new MessageActionRow()
        .addComponents(
          new MessageButton()
            .setCustomId('close')
            .setLabel('Close Ticket')
            .setStyle('DANGER'),
        );

      // Create and send welcome message with close button
      const embed = new MessageEmbed()
        .setColor('WHITE')
        .setTitle('INF Welcome System')
        .setDescription("Welcome! A staff member will be with you as soon as they can.\nTo get started, please __provide us with your RSN & how you found us__.");
      channel.send({ content: `${staffRoleTag} ${interaction.member}`, embeds: [embed], components: [row] });

      // Reply to the button click and direct user to new ticket
      return await interaction.reply({ content: `Success! Please head over to ${channel}.`, ephemeral: true });
    });
  }

  // When the join button is clicked
  if (interaction.customId == 'joinTicket') {
    // If there is a ticket role direct user to their open ticket
    if (hasGuestRole || hasInfRole) {
      return await interaction.reply({ content: `${interaction.member} you have a join ticket open. Please finish that one first.`, ephemeral: true });
    }

    // Update the ticket number for joins in the database
    let newNumber;
    let ticket = await Joins.findOne({ where: { id: 0 } });
    if (!ticket) {
      const newTicket = await Joins.create({
        id: 0,
        number: 0,
      });
      newNumber = newTicket.number + 1;
    } else {
      newNumber = ticket.number + 1;
    }
    const updateNumber = await Joins.update({ number: newNumber }, { where: { id: 0 } });

    // Find the recruits channel category and create a new channel under it
    const category = interaction.guild.channels.cache.find(c => c.name.toLowerCase() == recruitsCategory.toLowerCase() && c.type == 'GUILD_CATEGORY');
    category.createChannel(`Inf-${pad(newNumber, 4)}`, { type: 'GUILD_TEXT' }).then(async (channel) => {
      // Create a role for the ticket
      const newRole = await interaction.guild.roles.create({
        name: `Inf-${pad(newNumber, 4)}`,
        color: 'WHITE',
      });

      // Add new role to user and allow role to see ticket
      await interaction.member.roles.add(newRole.id);
      await channel.permissionOverwrites.edit(newRole.id, { VIEW_CHANNEL: true });

      // Create a button to close the ticket
      const row = new MessageActionRow()
        .addComponents(
          new MessageButton()
            .setCustomId('close')
            .setLabel('Close Ticket')
            .setStyle('DANGER'),
        );

      // Create and send welcome message with close button
      const embed = new MessageEmbed()
        .setColor('WHITE')
        .setTitle('INF Welcome System')
        .setDescription("Welcome! A staff member will be with you as soon as they can.\nTo get started, please __provide us with your RSN & how you found us__.");
      channel.send({ content: `${staffRoleTag} ${interaction.member}`, embeds: [embed], components: [row] });

      // Reply to the button click and direct user to new ticket
      return await interaction.reply({ content: `Success! Please head over to ${channel}.`, ephemeral: true });
    });
  }

  // When the close button is clicked
  if (interaction.customId == 'close') {
    // Make sure the user is staff before closing
    if (!interaction.member.roles.cache.has(staffRoleId)) {
      return await interaction.reply({ content: `${interaction.member} you cannot close this ticket. Please let staff know that this ticket is no longer needed.`, ephemeral: true });
    }

    // Turn off button after clicking
    const row = new MessageActionRow()
      .addComponents(
        new MessageButton()
          .setCustomId('close')
          .setLabel('Close Ticket')
          .setStyle('DANGER')
          .setDisabled(true),
      );

    // Create and send a notification for closing the ticket while updating the close button
    const embed = new MessageEmbed()
      .setColor('RED')
      .setTitle('INF Welcome System')
      .setDescription(`This ticket has been successfully closed by ${interaction.member} and will be deleted in 15 seconds.`);
    interaction.update({ components: [row] });
    interaction.channel.send({ embeds: [embed] });

    // Wait for an amount of time before closing the ticket and removing the ticket role
    setTimeout(async () => {
      const role = interaction.guild.roles.cache.find(role => role.name.toLowerCase() == interaction.channel.name.toLowerCase());
      if (role) {
        await role.delete();
      }
      await interaction.channel.delete();
    }, 15000);
  }
});

// Login to Discord using the bot's credentials
client.login(token);