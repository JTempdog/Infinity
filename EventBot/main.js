// Written by: Tempdog
const { Client, Intents, MessageEmbed } = require('discord.js');
const { joinVoiceChannel } = require('@discordjs/voice');
const { token, test } = require('./config.json');
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_VOICE_STATES] });

let guildEvents;

async function checkForEvents() {
  const guild = client.guilds.cache.first();
  const genChannel = guild.channels.cache.find(c => c.name.toLowerCase() == 'general-chat' && c.type == 'GUILD_TEXT');
  guildEvents = await guild.scheduledEvents.fetch();

  if (!guildEvents) {
    return;
  }
  
  guildEvents.forEach(event => {
    const msUntil = event.scheduledStartAt.getTime() - Date.now();

    // 1 HOUR
    if (msUntil >= 3570000 && msUntil <= 3630000) {
      genChannel.send(`**__${event.name} - begins in 1 hour__**\n${event.description}`); 
    }
    // 30 MINUTES
    if (msUntil >= 1770000 && msUntil <= 1830000) {
      genChannel.send(`**__${event.name} - begins in 30 minutes__**\n${event.description}`);
    }
    // NOW
    if (msUntil >= -30000 && msUntil <= 30000) {
      genChannel.send(`**__${event.name} - begins now__**\n${event.description}`);
      event.setStatus('ACTIVE');

      try {
        const vChannel = event.channel;
        const connection = joinVoiceChannel({
          channelId: vChannel.id,
          guildId: vChannel.guild.id,
          adapterCreator: vChannel.guild.voiceAdapterCreator,
        });
        setTimeout(() => {
          connection.destroy();
        }, 3600000)
      } catch {
        console.log('Failed voice connection for the hour.');
        return;
      }
    }
  });

  setTimeout(() => {
    checkForEvents();
  }, 60000);
}

function getTime(ms) {
  let cd = 24 * 60 * 60 * 1000;
  let ch = 60 * 60 * 1000;
  let days = Math.floor(ms / cd);
  let hours = Math.floor((ms - days * cd) / ch);
  let minutes = Math.floor((ms - days * cd - hours * ch) / 60000);

  if (minutes == 60) {
    hours++;
    minutes = 0;
  }
  if (hours == 24) {
    days++;
    hours = 0;
  }

  if (days != 0 && hours != 0 && minutes != 0) {
    return `${days} ${days == 1 ? 'day' : 'days'} ${hours} ${hours == 1 ? 'hour' : 'hours'} and ${minutes} ${minutes == 1 ? 'minute' : 'minutes'}`;
  } else if (days != 0 && hours != 0) {
    return `${days} ${days == 1 ? 'day' : 'days'} and ${hours} ${hours == 1 ? 'hour' : 'hours'}`;
  } else if (days != 0 && minutes != 0) {
    return `${days} ${days == 1 ? 'day' : 'days'} and ${minutes} ${minutes == 1 ? 'minute' : 'minutes'}`;
  } else if (hours != 0 && minutes != 0) {
    return `${hours} ${hours == 1 ? 'hour' : 'hours'} and ${minutes} ${minutes == 1 ? 'minute' : 'minutes'}`;
  } else if (hours != 0) {
    return `${hours} ${hours == 1 ? 'hour' : 'hours'}`;
  } else {
    return `${minutes} ${minutes == 1 ? 'minute' : 'minutes'}`;
  }
}

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  checkForEvents();
});

client.on('messageCreate', message => {
  if (message.content == '!events' || message.content == '!gm wwd') {
    let events = '';
    let size = 0;
    
    guildEvents.sort((a, b) => {
      if ((a.scheduledStartAt.getTime() - Date.now()) < (b.scheduledStartAt.getTime() - Date.now())) {
        return -1;
      }
      if ((a.scheduledStartAt.getTime() - Date.now()) > (b.scheduledStartAt.getTime() - Date.now())) {
        return 1;
      }
      return 0;
    }).forEach(event => {
      const msUntil = event.scheduledStartAt.getTime() - Date.now();
      if (msUntil > 0) {
        if (msUntil < 600000) {
          events += `**${event.name}** begins *soon*\n`;
        } else {
          events += `**${event.name}** begins in *${getTime(msUntil)}*\n`;
        }
        size++;
      }
    });

    const embed = new MessageEmbed()
      .setColor('WHITE')
      .setTitle('Upcoming Inf Events')
      .setDescription(events == 0 ? 'Check back soon' : events)
      .setFooter( {text: `${size} ${size == 1 ? 'event' : 'events'}`} );

    message.channel.send({ embeds: [embed] });
  }
});

client.login(token);