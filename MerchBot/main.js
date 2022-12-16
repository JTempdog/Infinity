// Written by: Tempdog
const { Client, Events, GatewayIntentBits } = require('discord.js');
const cron = require('cron');
const { token, test } = require('./config.json');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent] });

client.once(Events.ClientReady, c => {
  console.log(`Ready! Logged in as ${c.user.tag}`);
});

// SERVER DETAILS
const genID = '657989577075720198' // LiveID 657989577075720198 TestID 892249711073964092
const merchID = '1051774251507654666' // LiveID 1051774251507654666 TestID 1015323854488485968

function post() {
  client.channels.cache.get(genID).send(`~ New years hoodie is now available! <#${merchID}>`);
}

let job = new cron.CronJob('00 00 0,12 * * *', post);

job.start();

client.login(token);
