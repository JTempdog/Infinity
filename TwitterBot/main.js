// Written by: Tempdog
const { Client, Events, GatewayIntentBits } = require('discord.js');
const Twitter = require('twitter-v2');
const { token, test, consumer_key, consumer_secret, bearer_token, access_token, access_secret } = require('./config.json');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent] });
const t = new Twitter({
  // consumer_key: consumer_key,
  // consumer_secret: consumer_secret,
  // access_token: access_token,
  // access_token_secret: access_secret,
  bearer_token: bearer_token,
});

client.once(Events.ClientReady, c => {
	console.log(`Ready! Logged in as ${c.user.tag}`);
  setup();
});

// SERVER DETAILS
const channelID = '1050518755794489375'; // LiveID 1050518755794489375 TestID 1015323854488485968
const accountID = '1600741521925541888'; // LiveID 1600741521925541888 TestID 1191543790483451909

async function sendMessage (tweet, client) {
  const url = 'https://twitter.com/user/status/' + tweet.id;
  try {
    
    client.channels.cache.get(channelID).send(url);
  } catch (error) {
    console.log(error);
  }
}

async function listenForever (streamFactory, dataConsumer) {
  try {
    for await (const { data } of streamFactory()) {
      dataConsumer(data);
    }
    console.log('Stream disconnected successfully. Reconnecting...');
    listenForever(streamFactory, dataConsumer);
  } catch (error) {
    console.log('Stream disconnected with error. Retrying...', error);
    listenForever(streamFactory, dataConsumer);
  }
}

async function setup () {
  const endpointParams = {
    'tweet.fields': [ 'author_id', 'conversation_id' ],
    'expansions': [ 'author_id', 'referenced_tweets.id' ],
    'media.fields': [ 'url' ]
  }
  try {
    console.log('Setting up Twitter...');
    const body = {
      'add': [
        {'value': 'from:' + accountID, 'tag': 'from me!'}
      ]
    }
    const r = await t.post('tweets/search/stream/rules', body);
    console.log(r);
  } catch (error) {
    console.log(error);
  }

  listenForever(
    () => t.stream('tweets/search/stream', endpointParams),
    (data) => sendMessage(data, client)
  );
}

client.login(token);
