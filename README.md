# Infinity
A collection of all the Discord bots for Infinity

**EventBot** - A Discord bot that reads the events created in a Discord server.<br>
This bot will start events automatically and join the chosen voice channel to prevent the event from ending too early.<br>
List current events. `!events` & `!gm wwd`

**RuleBot** - A Discord bot used to create rules & warnings for members in a Discord server.<br>
This bot stores server rules and member warnings, it will also provide notifications when members reach 3 active warnings.<br>
Add a rule. `!addrule <ruleNumber>; <name>; [description]` & `!ar`<br>
Edit a rule. `!editrule <ruleNumber>; <name>; [description]` & `er`<br>
Remove a rule. `!removerule <ruleNumber>` & `!rr`<br>
Warn a member. `!warn @member; <ruleNumber>; [summary]; [time]; [screenshot]` & `!w`<br>
Remove a warning. `!removewarn <warningID>` & `!rw`<br>
Check a member's warnings. `!check @member`<br>
List all warnings. `!check`<br>
Check your own warnings. `!warnings`

**TicketBot** - A Discord bot for allowing members to create tickets or submit anonymous tips to get in touch with staff.<br>
This bot uses interactions to either create a private channel between a member and staff in a Discord server or sends a DM to the member, 
allowing them to submit an anonymous tip that will be sent to a member in the Discord server.<br>
Place the initial message to allow members to interact. `!ticket`

**VcBot** - A Discord bot to eliminate too many voice channels and allow for easy creation on the fly.<br>
This bot requires at least one voice channel and when members join, they will be moved to a newly created voice channel where they can 
change the name of the channel as well as set the limit for amount of members able to join.<br>
Change the name of the channel. `!vcname <name>`<br>
Change the limit of members. `!vclimit <number>`

**WelcomeBot** - A Discord bot that is similar to the TicketBot, used for allowing new members to choose which way they would like to join.<br>
This bot, like the TicketBot, uses interactions to create a private channel between a member and staff in a Discord server depending on which of the two options they choose.<br>
Place the initial message to allow members to interact. `!welcome`

**TwitterBot** - A Discord bot that streams tweets from Twitter using the Twitter API and posts them into Discord.<br>
This bot will automatically send the link to a tweet from a specified Twitter account when it is posted on Twitter right into a chosen Discord channel.

**MerchBot** - A Discord bot for sending a message twice everyday that advertises the message and tags a specified channel.<br>
This bot creates a job in order to send the chosen message into a Discord channel everyday at 12am and 12pm EST.

In order to recreate these Discord bots, each folder needs a config.json file containing a bot token.<br>
Then while in the folder directories, use NPM to install Discord.js from the command prompt.<br>
`npm install discord.js`

The **EventBot** needs @discordjs/voice installed as well. `npm install @discordjs/voice`<br>
The **RuleBot**, **WelcomeBot** and the **TicketBot** all need sequelize installed as well. `npm install sequelize`<br>
The **TwitterBot** needs twitter-v2 installed as well. `npm install twitter-v2`<br>
The **MerchBot** needs cron installed as well. `npm install cron`

See https://www.npmjs.com/ for more info.

**Don't forget to change the ID's in the code according to your Discord server!**<br>
Now you should be able to start the bots using either a code runner on your IDE or PM2 from the command prompt.<br>
`pm2 start main.js`

See https://pm2.keymetrics.io/ for more info.
