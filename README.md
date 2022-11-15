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

**TicketBot** - A Discord bot for allowing members to create tickets or sumbit anonymous tips to get in touch with staff.<br>
This bot uses interactions to either create a private channel between a member and staff in a Discord server or<br>
sends a DM to the member, allowing them to submit an anonymous tip that will be sent to a channel in the Discord server.<br>
Place the inital message to allow members to interact. `!ticket`

**VcBot** - A Discord bot to eliminate too many voice channels and allow for easy creation on the fly.<br>
This bot requires at least one voice channel and when members join, they will be moved to a newly created voice channel<br>
where they can change the name of the channel as well as set the limit for amount of members able to join.<br>
Change the name of the channel. `!vcname <name>`<br>
Change the limit of members. `!vclimit <number>`

In order to recreate these Discord bots, each folder needs a config.json file containing a bot token.<br>
Then while in the folder directories, use NPM to install Discord.js from the command prompt.<br>
`npm install discord.js`

The **EventBot** needs @discordjs/voice installed as well. `npm install @discordjs/voice`<br>
The **RuleBot** and the **TicketBot** both need Sequelize installed as well. `npm install sequelize`

See https://www.npmjs.com/ for more info.

**Don't forget to change the ID's in the code according to your Discord server!**<br>
Now you should be able to start the bots using either a code runner on your IDE or PM2 from the command prompt.<br>
`pm2 start main.js`

See https://pm2.keymetrics.io/ for more info.
