// Written by: Tempdog
const { Client, Events, GatewayIntentBits } = require('discord.js');
const { token, test } = require('./config.json');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMessages] });

client.once(Events.ClientReady, c => {
	console.log(`Ready! Logged in as ${c.user.tag}`);
});

// SERVER DETAILS
const vcID = '1038647491375136839'; // LiveID  TestID 1038647491375136839
const categoryID = '815648620719112194'; // LiveID  TestID 815648620719112194

let vcChannel;
client.on(Events.VoiceStateUpdate, async (oldVS, newVS) => {
  let memberName;
  if (newVS.member.nickname) {
    memberName = newVS.member.nickname;
  } else {
    memberName = newVS.member.displayName;
  }

  if (newVS.channel && newVS.channelId == vcID) {
    vcChannel = await newVS.guild.channels.create({ name: memberName + "'s Channel", type: 2, parent: categoryID });
    await newVS.member.voice.setChannel(vcChannel);
  }

  if (oldVS.channel && oldVS.channelId != vcID) {
    if (oldVS.channel.members.size < 1) {
      await oldVS.channel.delete();
    }
  }
});

client.on(Events.MessageCreate, async message => {
  const args = message.content.split(' ');
  const params = args.slice(1).join(' ');

  if (message.content.startsWith('!vcname')) {
    if (!params) {
      return;
    }
    message.member.voice.channel.edit({ name: params });
  }

  if (message.content.startsWith('!vclimit')) {
    if (!params) {
      return;
    }
    message.member.voice.channel.setUserLimit(params);
  }
});

client.login(token);