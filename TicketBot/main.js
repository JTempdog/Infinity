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

// Define tables for tickets
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

// Function for padding the ticket numbers
function pad(num, size) {
  let s = "0000" + num;
  return s.substring(s.length - size);
}

// SERVER DETAILS
const ticketCategory = 'TICKETS';
const archiveCategory = 'ARCHIVES';
const staffRoleTag = '<@&846886887074562059>';
const staffRoleId = '846886887074562059'; // LiveID 846886887074562059 TestID 815813424721690664

const guildId = '657989577075720195'; // LiveID 657989577075720195 TestID 815648620719112192
const dmId = '230152815207514114'; // LiveID 230152815207514114 TestID 488872809414656000

// Start the client
client.on('ready', () => {
  // Add ticket table to client
  Tickets.sync();

  console.log(`Logged in as ${client.user.tag}!`);
});

// Listener for text commands
client.on('messageCreate', message => {
  // Command to produce the ticket message and buttons making sure the author is staff
  if (message.content == '!ticket' && message.member.roles.cache.has(staffRoleId)) {
    // Create a button for tickets and tips
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

    // Create embed for the initial ticket message
    const embed = new MessageEmbed()
      .setColor('WHITE')
      .setTitle('Having a problem? Want to leave a tip?')
      .setDescription('Let us know what\'s going on! Get connected.\n\n__Create a ticket__ to speak with the staff team\nOR __forward an anonymous tip__ to the team!');

    // Delete the command sent and send embed with buttons
    message.delete();
    message.channel.send({ embeds: [embed], components: [row] });
  }

  // Capture anonymous tips thru the bots direct messages
  // (Currently collecting everything sent, need to find a way to capture only tips)
  if (message.guild == null && message.author != client.user) {

    // Choose server and then staff member(s) to recieve the tips to their direct messages
    const guildToSend = client.guilds.cache.find(g => g.id == guildId);
    const dmChannel = guildToSend.members.cache.find(c => c.id == dmId);

    // Create and send new tip notifications with the tip to staff
    const embed = new MessageEmbed()
      .setColor('WHITE')
      .setTitle('New Anonymous Tip');
    dmChannel.send({ embeds: [embed] }).then(dmChannel.send(message.content));

    // Create and send success message notifying user of delivery
    const embed2 = new MessageEmbed()
      .setColor('GREEN')
      .setDescription('Thank you! Your tip has been anonymously forwarded to Ms Seren!');
    message.channel.send({ embeds: [embed2] });
  }
});

// Listener for button clicks only
client.on('interactionCreate', async interaction => {
  if (!interaction.isButton()) return;

  // Check for ticket role
  const hasTicketRole = interaction.member.roles.cache.find(role => role.name.toLowerCase().startsWith('ticket-'));

  // When the tip button is clicked
  // (Need to find a way to capture only tips at this point)
  if (interaction.customId == 'tipOff') {

    // Create and send a direct message with tip instructions
    const embed = new MessageEmbed()
      .setColor('WHITE')
      .setTitle('INF Anonymous Tip System')
      .setDescription('Send anonymous tips by typing your tip here and it will be forwarded to Ms Seren!\n**If you do not provide enough information your tip may not properly be resolved.**');
    interaction.update({});
    interaction.member.send({ embeds: [embed] });
  }

  // When the ticket button is clicked
  if (interaction.customId == 'openTicket') {
    // If there is a ticket role direct user to their open ticket
    if (hasTicketRole) {
      return await interaction.reply({ content: `${interaction.member} you already have a ticket open. Please finish that one first.`, ephemeral: true });
    }

    // Update the ticket number in the database
    let newNumber;
    let ticket = await Tickets.findOne({ where: { id: 0 } });
    if (!ticket) {
      const newTicket = await Tickets.create({
        id: 0,
        number: 0,
      });
      newNumber = newTicket.number + 1;
    } else {
      newNumber = ticket.number + 1;
    }
    const updateNumber = await Tickets.update({ number: newNumber }, { where: { id: 0 } });

    // Find the tickets channel category and create a new channel under it
    const category = interaction.guild.channels.cache.find(c => c.name.toLowerCase() == ticketCategory.toLowerCase() && c.type == 'GUILD_CATEGORY');
    category.createChannel(`ticket-${pad(newNumber, 4)}`, { type: 'GUILD_TEXT' }).then(async (channel) => {

      // Create a role for the ticket
      const newRole = await interaction.guild.roles.create({
        name: `ticket-${pad(newNumber, 4)}`,
        color: 'WHITE',
      });

      // Add new role to user and allow role to see ticket
      await interaction.member.roles.add(newRole.id);
      await channel.permissionOverwrites.edit(newRole.id, { VIEW_CHANNEL: true });

      // Create a button for archiving and closing the ticket
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

      // Create and send ticket insructions with buttons
      const embed = new MessageEmbed()
        .setColor('WHITE')
        .setTitle('INF Ticket System')
        .setDescription("Please elaborate on why you've opened a ticket with us today.\nThe staff team will get with you as soon as we can.");
      channel.send({ content: `${staffRoleTag} ${interaction.member}`, embeds: [embed], components: [row] });

      // Reply to the button click and direct user to the new ticket
      return await interaction.reply({ content: `Success! Please head over to ${channel}.`, ephemeral: true });
    });
  }

  // When the close button is clicked
  if (interaction.customId == 'closeTicket') {
    // Make sure the user is staff before closing
    if (!interaction.member.roles.cache.has(staffRoleId)) {
      return await interaction.reply({ content: `${interaction.member} you cannot close this ticket. Please let staff know that this ticket is no longer needed.`, ephemeral: true });
    }

    // Turn off buttons after clicking
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

    // Create and send a notification for closing the ticket while updating the buttons
    const embed = new MessageEmbed()
      .setColor('RED')
      .setTitle('INF Ticket System')
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

  // When the archive button is clicked
  if (interaction.customId == 'archiveTicket') {
    // Make sure the user is staff before archiving
    if (!interaction.member.roles.cache.has(staffRoleId)) {
      return await interaction.reply({ content: `${interaction.member} you cannot archive this ticket. Please let staff know that this ticket is no longer needed.`, ephemeral: true });
    }

    // Turn off both buttons initially
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

    // Turn on close button only
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

    // Create two notifications for archive success and confirming the archive
    const embed1 = new MessageEmbed()
      .setColor('BLURPLE')
      .setTitle('INF Ticket System')
      .setDescription(`This ticket has been successfully archived by ${interaction.member} and will be moved in 15 seconds.`);
    const embed2 = new MessageEmbed()
      .setColor('GREEN')
      .setTitle("ARCHIVED");

    // Send archive success and update buttons
    interaction.update({ components: [row1] });
    interaction.channel.send({ embeds: [embed1] });

    // Wait for an amount of time before archiving the ticket and removing the ticket role and turn close button on
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

// Login to Discord using the bot's credentials
client.login(token);