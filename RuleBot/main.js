// Written by: Tempdog
const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, EmbedBuilder } = require('discord.js');
const Sequelize = require('sequelize');
const { token, test } = require('./config.json');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.DirectMessages, GatewayIntentBits.GuildMessageReactions] });

const sequelize = new Sequelize('database', 'user', 'password', {
  host: 'localhost',
  dialect: 'sqlite',
  storage: 'database.sqlite',
});

const Rules = sequelize.define('rules', {
  number: {
    type: Sequelize.INTEGER,
    defaultValue: 0,
    allowNull: false,
    unique: true,
  },
  name: {
    type: Sequelize.STRING,
    defaultValue: "",
    allowNull: false,
  },
  description: {
    type: Sequelize.STRING,
  },
});

const Warnings = sequelize.define('warnings', {
  summary: {
    type: Sequelize.STRING,
  },
  time: {
    type: Sequelize.INTEGER
  },
  screenshot: {
    type: Sequelize.STRING,
  },
  isactive: {
    type: Sequelize.BOOLEAN,
    defaultValue: true,
    allowNull: false,
  },
  playerid: {
    type: Sequelize.INTEGER,
    defaultValue: 0,
    allowNull: false,
  },
  rulenumber: {
    type: Sequelize.INTEGER,
    defaultValue: 0,
    allowNull: false,
  },
});

Rules.hasMany(Warnings, {
  onDelete: 'RESTRICT'
});
Warnings.belongsTo(Rules);

async function checkActives() {
  const warningList = await Warnings.findAll({});

  if (!warningList) {
    return;
  }

  await warningList.forEach(async w => {
    if ((w.time - Date.now()) < 0 && w.time != 0) {
      await Warnings.update({
        time: 0,
        isactive: false,
      }, {
        where: {
          id: w.id,
        }
      });
    }
  });

  setTimeout(() => {
    checkActives();
  }, 60000);
}

function parseDate(time) {
  if (time.endsWith('d')) {
    time = time.replace('d', '');
    const date = Date.now() + (Number(time) * 86400000);
    return date;
  } else if (time.endsWith('h')) {
    time = time.replace('h', '');
    const date = Date.now() + (Number(time) * 3600000);
    return date;
  } else if (time.endsWith('m')) {
    time = time.replace('m', '');
    const date = Date.now() + (Number(time) * 60000);
    return date;
  } else if (time.endsWith('s')) {
    time = time.replace('s', '');
    const date = Date.now() + (Number(time) * 1000);
    return date;
  } else {
    return console.log('Cannot parse date.');
  }
}

function getTime(ms) {
  if (ms == 0) {
    return 0;
  }

  ms = ms - Date.now();

  if (ms < 60000) {
    return `Less than a minute`;
  }

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

// SERVER DETAILS
const leaderRoleId = '1004468530760134656'; // TestID 815813424721690664 // LiveID 1004468530760134656
const modRoleId = '657989638807486468'; // TestID 815813586525224970 // LiveID 657989638807486468
const adminRoleId = '1004251716901937172'; // TestID  // LiveID 1004251716901937172
const channelId = '730155393367408852'; // TestID 892249369049464862 // LiveID 730155393367408852

client.on('ready', async () => {
  Rules.sync();
  Warnings.sync();
  console.log(`Logged in as ${client.user.tag}!`);
  setTimeout(() => {
    checkActives();
  }, 10000);
});

let embeds = [];
let page;

client.on('messageCreate', async message => {
  const args = message.content.split(' ');
  const params = args.slice(1).join(' ').split(';');

  // !addrule <number>; <name>; [description]
  if ((args[0] == '!addrule' || args[0] == '!ar') && message.member.roles.cache.has(leaderRoleId)) {
    if (!params[0] || !params[1]) {
      const embed = new EmbedBuilder()
        .setColor('Red')
        .setTitle('Missing Argument(s)')
        .setDescription('Please use format `!addrule number*; name*; description`')
        .setFooter({ text: '* Indicates required field' });

      return message.channel.send({ embeds: [embed] });
    }

    const ruleNumber = params[0];
    const ruleName = params[1];

    try {
      if (params[2]) {
        const ruleDescription = params[2];
        const rule = await Rules.create({
          number: ruleNumber,
          name: ruleName,
          description: ruleDescription,
        });

        const embed = new EmbedBuilder()
          .setColor('Green')
          .setTitle('New Rule Added')
          .setDescription(`**ID:** ${rule.id} **Number:** ${rule.number} **Name:** ${rule.name} **Description:** ${rule.description}`);

        return message.channel.send({ embeds: [embed] });
      }

      const rule = await Rules.create({
        number: ruleNumber,
        name: ruleName,
      });

      const embed = new EmbedBuilder()
        .setColor('Green')
        .setTitle('New Rule Added')
        .setDescription(`**ID:** ${rule.id} **Number:** ${rule.number} **Name:** ${rule.name}`);

      return message.channel.send({ embeds: [embed] });
    } catch (error) {
      if (error.name == 'SequelizeUniqueConstraintError') {
        const embed = new EmbedBuilder()
          .setColor('Red')
          .setDescription('That rule already exists.\nPlease use `!editrule` instead.');

        return message.channel.send({ embeds: [embed] });
      }

      const embed = new EmbedBuilder()
        .setColor('Red')
        .setDescription('Something went wrong creating a rule.');

      return message.channel.send({ embeds: [embed] });
    }
  }

  // !editrule <number>; <name>; [description]
  if ((args[0] == '!editrule' || args[0] == '!er') && message.member.roles.cache.has(leaderRoleId)) {
    if (!params[0] || !params[1]) {
      const embed = new EmbedBuilder()
        .setColor('Red')
        .setTitle('Missing Argument(s)')
        .setDescription('Please use format `!editrule number*; name*; description`')
        .setFooter({ text: '* Indicates required field' });

      return message.channel.send({ embeds: [embed] });
    }

    const ruleNumber = params[0];
    const ruleName = params[1];

    if (params[2]) {
      const ruleDescription = params[2];
      const affectedRule = await Rules.update({
        name: ruleName,
        description: ruleDescription,
      }, {
        where: {
          number: ruleNumber,
        }
      });

      if (affectedRule > 0) {
        const updatedRule = await Rules.findOne({
          where: {
            number: ruleNumber,
          }
        });

        const embed = new EmbedBuilder()
          .setColor('Green')
          .setTitle('Rule Updated')
          .setDescription(`**ID:** ${updatedRule.id} **Number:** ${updatedRule.number} **Name:** ${updatedRule.name} **Description:** ${updatedRule.description}`);

        return message.channel.send({ embeds: [embed] });
      }

      const embed = new EmbedBuilder()
        .setColor('Red')
        .setDescription(`Could not find rule number ${ruleNumber}.`);

      return message.channel.send({ embeds: [embed] });
    }

    const affectedRule = await Rules.update({
      name: ruleName,
      description: null,
    }, {
      where: {
        number: ruleNumber,
      }
    });

    if (affectedRule > 0) {
      const updatedRule = await Rules.findOne({
        where: {
          number: ruleNumber,
        }
      });

      const embed = new EmbedBuilder()
        .setColor('Green')
        .setTitle('Rule Updated')
        .setDescription(`**ID:** ${updatedRule.id} **Number:** ${updatedRule.number} **Name:** ${updatedRule.name}`);

      return message.channel.send({ embeds: [embed] });
    }

    const embed = new EmbedBuilder()
      .setColor('Red')
      .setDescription(`Could not find rule number ${ruleNumber}.`);

    return message.channel.send({ embeds: [embed] });
  }

  // !removerule <number>
  if ((args[0] == '!removerule' || args[0] == '!rr') && message.member.roles.cache.has(leaderRoleId)) {
    if (!args[1]) {
      const embed = new EmbedBuilder()
        .setColor('Red')
        .setTitle('Missing Argument')
        .setDescription('Please use format `!removerule number*`')
        .setFooter({ text: '* Indicates required field' });

      return message.channel.send({ embeds: [embed] });
    }

    const ruleNumber = args[1];

    try {
      const deletedRule = await Rules.destroy({
        where: {
          number: ruleNumber,
        }
      });

      if (!deletedRule) {
        const embed = new EmbedBuilder()
          .setColor('Red')
          .setDescription(`Could not find rule number ${ruleNumber}.`);
  
        return message.channel.send({ embeds: [embed] });
      }
    } catch (error) {
      if (error.name == 'SequelizeForeignKeyConstraintError') {
        const embed = new EmbedBuilder()
          .setColor('Red')
          .setDescription(`Could not remove rule number ${ruleNumber}, there are warnings tied to this rule.\nPlease use !editrule instead or remove warnings from this rule first.`);

        return message.channel.send({ embeds: [embed] });
      }

      const embed = new EmbedBuilder()
        .setColor('Red')
        .setDescription(`Something went wrong removing a rule.`);

      return message.channel.send({ embeds: [embed] });
    }

    const embed = new EmbedBuilder()
      .setColor('Green')
      .setTitle('Rule Removed')
      .setDescription(`Rule number ${ruleNumber} has been removed.`);

    return message.channel.send({ embeds: [embed] });
  }

  // !rules
  if (args[0] == '!rules' && message.member.roles.cache.has(leaderRoleId)) {
    const ruleList = await Rules.findAll({});
    const ruleString = ruleList.map(r => r.description ? `**#${r.number}:** ${r.name} - ${r.description}` : `**#${r.number}:** ${r.name}`).join('\n') || 'No rules.';
    const embed = new EmbedBuilder()
      .setColor('Blue')
      .setTitle('Rules')
      .setDescription(ruleString);

    return message.channel.send({ embeds: [embed] });
  }

  // !warn @member; <rule>; [summary]; [time]; [screenshot]
  if ((args[0] == '!warn' || args[0] == '!w') && message.member.roles.cache.has(leaderRoleId)) {
    if (!params[0] || !params[1]) {
      const embed = new EmbedBuilder()
        .setColor('Red')
        .setTitle('Missing Argument(s)')
        .setDescription('Please use format `!warn @member*; rule*; summary; time; screenshot`')
        .setFooter({ text: '* Indicates required field' });

      return message.channel.send({ embeds: [embed] });
    }

    let member;
    if (message.mentions.members.first()) {
      member = message.mentions.members.first();
    } else {
      member = message.guild.members.cache.find(member => member.id == params[0]);
    }

    const ruleNumber = params[1];
    const rule = await Rules.findOne({
      where: {
        number: ruleNumber,
      }
    });

    if (!member) {
      const embed = new EmbedBuilder()
        .setColor('Red')
        .setTitle('Not a Valid Member')
        .setDescription('Please either tag member or use their ID.');

      return message.channel.send({ embeds: [embed] });
    } else if (!rule) {
      const embed = new EmbedBuilder()
        .setColor('Red')
        .setTitle('Not a Valid Rule')
        .setDescription(`Rule number ${ruleNumber} does not exist, please either use another rule number or create one.`);

      return message.channel.send({ embeds: [embed] });
    }
    else {
      try {
        const actives = await Warnings.count({
          where: {
            isactive: true,
            playerid: member.id,
          }
        });
        const channelToSend = message.guild.channels.cache.find(c => c.id == channelId);

        if (params[2] && params[3] && params[4]) {
          if (params[3].endsWith('d') || params[3].endsWith('h') || params[3].endsWith('m') || params[3].endsWith('s')) {
            const warnSummary = params[2];
            const warnTime = parseDate(params[3]);
            const warnScreen = params[4];
            const warning = await Warnings.create({
              summary: warnSummary,
              time: warnTime,
              screenshot: warnScreen,
              isactive: true,
              playerid: member.id,
              rulenumber: ruleNumber,
              ruleId: rule.id,
            });

            if (actives+1 == 3) {
              const embed = new EmbedBuilder()
                .setColor('Red')
                .setTitle('3 Warnings Reached')
                .setDescription(`<@${warning.playerid}> has reached 3 warnings.`);

              if (channelToSend) {
                channelToSend.send({ embeds: [embed] });
              }
            }

            const embed = new EmbedBuilder()
              .setColor('Green')
              .setTitle('New Warning Added')
              .setDescription(`**ID:** ${warning.id} **Member:** <@${warning.playerid}> **Rule:** ${warning.rulenumber} **Summary:** ${warning.summary} **Time:** ${getTime(warning.time)} **Screenshot:** ${warning.screenshot}`);

            return message.channel.send({ embeds: [embed] });
          } else {
            const embed = new EmbedBuilder()
              .setColor('Red')
              .setTitle('Not a Vaild Time')
              .setDescription('Please either use **d** for days, **h** for hours, **m** for minutes or **s** for seconds.');

            return message.channel.send({ embeds: [embed] });
          }
        } else if (params[2] && params[3]) {
          let warnSummary;
          let warnTime;
          let warnScreen;

          if (/^\d/.test(params[2])) {
            warnTime = params[2];
          } else if (params[2].startsWith('http')) {
            warnScreen = params[2];
          } else {
            warnSummary = params[2];
          }
          if (/^\d/.test(params[3])) {
            warnTime = params[3];
          } else if (params[3].startsWith('http')) {
            warnScreen = params[3];
          } else {
            warnSummary = params[3];
          }

          if (warnSummary && warnTime) {
            if (warnTime.endsWith('d') || warnTime.endsWith('h') || warnTime.endsWith('m') || warnTime.endsWith('s')) {
              const warning = await Warnings.create({
                summary: warnSummary,
                time: parseDate(warnTime),
                isactive: true,
                playerid: member.id,
                rulenumber: ruleNumber,
                ruleId: rule.id,
              });
    
              if (actives+1 == 3) {
                const embed = new EmbedBuilder()
                  .setColor('Red')
                  .setTitle('3 Warnings Reached')
                  .setDescription(`<@${warning.playerid}> has reached 3 warnings.`);
  
                channelToSend.send({ embeds: [embed] });
              }

              const embed = new EmbedBuilder()
                .setColor('Green')
                .setTitle('New Warning Added')
                .setDescription(`**ID:** ${warning.id} **Member:** <@${warning.playerid}> **Rule:** ${warning.rulenumber} **Summary:** ${warning.summary} **Time:** ${getTime(warning.time)}`);
    
              return message.channel.send({ embeds: [embed] });
            } else {
              const embed = new EmbedBuilder()
                .setColor('Red')
                .setTitle('Not a Vaild Time')
                .setDescription('Please either use **d** for days, **h** for hours, **m** for minutes or **s** for seconds.');
  
              return message.channel.send({ embeds: [embed] });
            }
          } else if (warnScreen && warnTime) {
            if (warnTime.endsWith('d') || warnTime.endsWith('h') || warnTime.endsWith('m') || warnTime.endsWith('s')) {
              const warning = await Warnings.create({
                time: parseDate(warnTime),
                screenshot: warnScreen,
                isactive: true,
                playerid: member.id,
                rulenumber: ruleNumber,
                ruleId: rule.id,
              });
    
              if (actives+1 == 3) {
                const embed = new EmbedBuilder()
                  .setColor('Red')
                  .setTitle('3 Warnings Reached')
                  .setDescription(`<@${warning.playerid}> has reached 3 warnings.`);
  
                channelToSend.send({ embeds: [embed] });
              }

              const embed = new EmbedBuilder()
                .setColor('Green')
                .setTitle('New Warning Added')
                .setDescription(`**ID:** ${warning.id} **Member:** <@${warning.playerid}> **Rule:** ${warning.rulenumber} **Time:** ${getTime(warning.time)} **Screenshot:** ${warning.screenshot}`);
    
              return message.channel.send({ embeds: [embed] });
            } else {
              const embed = new EmbedBuilder()
                .setColor('Red')
                .setTitle('Not a Vaild Time')
                .setDescription('Please either use **d** for days, **h** for hours, **m** for minutes or **s** for seconds.');
  
              return message.channel.send({ embeds: [embed] });
            }
          } else {
            const warning = await Warnings.create({
              summary: warnSummary,
              time: 0,
              screenshot: warnScreen,
              isactive: true,
              playerid: member.id,
              rulenumber: ruleNumber,
              ruleId: rule.id,
            });

            if (actives+1 == 3) {
              const embed = new EmbedBuilder()
                .setColor('Red')
                .setTitle('3 Warnings Reached')
                .setDescription(`<@${warning.playerid}> has reached 3 active warnings.`);

              channelToSend.send({ embeds: [embed] });
            }
  
            const embed = new EmbedBuilder()
              .setColor('Green')
              .setTitle('New Warning Added')
              .setDescription(`**ID:** ${warning.id} **Member:** <@${warning.playerid}> **Rule:** ${warning.rulenumber} **Summary:** ${warning.summary} **Screenshot:** ${warning.screenshot}`);
  
            return message.channel.send({ embeds: [embed] });
          }
        } else if (params[2]) {
          let warnSummary;
          let warnTime;
          let warnScreen;

          if (/^\d/.test(params[2])) {
            warnTime = params[2];
          } else if (params[2].startsWith('http')) {
            warnScreen = params[2];
          } else {
            warnSummary = params[2];
          }

          if (warnTime) {
            if (warnTime.endsWith('d') || warnTime.endsWith('h') || warnTime.endsWith('m') || warnTime.endsWith('s')) {
              const warning = await Warnings.create({
                time: parseDate(warnTime),
                isactive: true,
                playerid: member.id,
                rulenumber: ruleNumber,
                ruleId: rule.id,
              });

              if (actives+1 == 3) {
                const embed = new EmbedBuilder()
                  .setColor('Red')
                  .setTitle('3 Warnings Reached')
                  .setDescription(`<@${warning.playerid}> has reached 3 warnings.`);
  
                channelToSend.send({ embeds: [embed] });
              }
    
              const embed = new EmbedBuilder()
                .setColor('Green')
                .setTitle('New Warning Added')
                .setDescription(`**ID:** ${warning.id} **Member:** <@${warning.playerid}> **Rule:** ${warning.rulenumber} **Time:** ${getTime(warning.time)}`);
    
              return message.channel.send({ embeds: [embed] });
            } else {
              const embed = new EmbedBuilder()
                .setColor('Red')
                .setTitle('Not a Vaild Time')
                .setDescription('Please either use **d** for days, **h** for hours, **m** for minutes or **s** for seconds.');
  
              return message.channel.send({ embeds: [embed] });
            }
          } else if (warnScreen) {
            const warning = await Warnings.create({
              time: 0,
              screenshot: warnScreen,
              isactive: true,
              playerid: member.id,
              rulenumber: ruleNumber,
              ruleId: rule.id,
            });

            if (actives+1 == 3) {
              const embed = new EmbedBuilder()
                .setColor('Red')
                .setTitle('3 Warnings Reached')
                .setDescription(`<@${warning.playerid}> has reached 3 warnings.`);

              channelToSend.send({ embeds: [embed] });
            }
  
            const embed = new EmbedBuilder()
              .setColor('Green')
              .setTitle('New Warning Added')
              .setDescription(`**ID:** ${warning.id} **Member:** <@${warning.playerid}> **Rule:** ${warning.rulenumber} **Screenshot:** ${warning.screenshot}`);
  
            return message.channel.send({ embeds: [embed] });
          } else {
            const warning = await Warnings.create({
              summary: warnSummary,
              time: 0,
              isactive: true,
              playerid: member.id,
              rulenumber: ruleNumber,
              ruleId: rule.id,
            });

            if (actives+1 == 3) {
              const embed = new EmbedBuilder()
                .setColor('Red')
                .setTitle('3 Warnings Reached')
                .setDescription(`<@${warning.playerid}> has reached 3 warnings.`);

              channelToSend.send({ embeds: [embed] });
            }
  
            const embed = new EmbedBuilder()
              .setColor('Green')
              .setTitle('New Warning Added')
              .setDescription(`**ID:** ${warning.id} **Member:** <@${warning.playerid}> **Rule:** ${warning.rulenumber} **Summary:** ${warning.summary}`);
  
            return message.channel.send({ embeds: [embed] });
          }
        } else {
          const warning = await Warnings.create({
            time: 0,
            isactive: true,
            playerid: member.id,
            rulenumber: ruleNumber,
            ruleId: rule.id,
          });

          if (actives+1 == 3) {
            const embed = new EmbedBuilder()
              .setColor('Red')
              .setTitle('3 Warnings Reached')
              .setDescription(`<@${warning.playerid}> has reached 3 warnings.`);

            channelToSend.send({ embeds: [embed] });
          }

          const embed = new EmbedBuilder()
            .setColor('Green')
            .setTitle('New Warning Added')
            .setDescription(`**ID:** ${warning.id} **Member:** <@${warning.playerid}> **Rule:** ${warning.rulenumber}`);

          return message.channel.send({ embeds: [embed] });
        }
      } catch (error) {
        const embed = new EmbedBuilder()
          .setColor('Red')
          .setDescription('Something went wrong creating a rule.');

        return message.channel.send({ embeds: [embed] });
      }
    }
  }

  // !removewarn <id>
  if ((args[0] == '!removewarn' || args[0] == '!rw') && message.member.roles.cache.has(leaderRoleId)) {
    if (!args[1]) {
      const embed = new EmbedBuilder()
        .setColor('Red')
        .setTitle('Missing Argument')
        .setDescription('Please use format `!removewarn id*`')
        .setFooter({ text: '* Indicates required field' });

      return message.channel.send({ embeds: [embed] });
    }

    const warnID = args[1];

    const deletedWarning = await Warnings.destroy({
      where: {
        id: warnID,
      }
    });

    if (!deletedWarning) {
      const embed = new EmbedBuilder()
        .setColor('Red')
        .setDescription(`Could not find warning ID **${warnID}**.`);

      return message.channel.send({ embeds: [embed] });
    }

    const embed = new EmbedBuilder()
      .setColor('Green')
      .setTitle('Warning Removed')
      .setDescription(`Warning ID **${warnID}** has been removed.`);

    return message.channel.send({ embeds: [embed] });
  }

  // !check
  if (args[0] == '!check') {
    if (message.member.roles.cache.has(leaderRoleId) || message.member.roles.cache.has(modRoleId) || message.member.roles.cache.has(adminRoleId)) {
      let member;
      if (message.mentions.members.first()) {
        member = message.mentions.members.first();
      } else {
        member = message.guild.members.cache.find(member => member.id == args[1]);
      }
  
      if (!member && args[1]) {
        const embed = new EmbedBuilder()
          .setColor('Red')
          .setTitle('Not a Valid Member')
          .setDescription('Please either tag member or use their ID.');
  
        return message.channel.send({ embeds: [embed] });
      }
  
      if (member) {
        const warningList = await Warnings.findAll({
          where: {
            playerid: member.id,
          },
          include: [{
            model: Rules,
          }]
        });
        const actives = await Warnings.count({
          where: {
            isactive: true,
            playerid: member.id,
          }
        });
        const warningString = warningList.map(w => {
          const player = message.guild.members.cache.find(member => member.id == w.playerid);
          let memberName;
          if (player) {
            if (player.nickname) {
              memberName = player.nickname;
            } else {
              memberName = player.user.username;
            }
          }
  
          if (w.summary && w.time > 0 && w.screenshot) {
            return w.rule.description ? `**ID**: ${w.id} **Member:** \`${memberName} - ${player.id}\`\n **Active:** ${w.isactive}\n**Rule:** ${w.rule.number} - ${w.rule.name} - ${w.rule.description}\n**Summary:** ${w.summary} **Time:** ${getTime(w.time)}\n**Screenshot:** ${w.screenshot}` : `**ID**: ${w.id} **Member:** \`${memberName} - ${player.id}\`\n **Active:** ${w.isactive}\n**Rule:** ${w.rule.number} - ${w.rule.name}\n**Summary:** ${w.summary} **Time:** ${getTime(w.time)}\n**Screenshot:** ${w.screenshot}`;
          } else if (w.summary && w.time > 0) {
            return w.rule.description ? `**ID**: ${w.id} **Member:** \`${memberName} - ${player.id}\`\n **Active:** ${w.isactive}\n**Rule:** ${w.rule.number} - ${w.rule.name} - ${w.rule.description}\n**Summary:** ${w.summary} **Time:** ${getTime(w.time)}` : `**ID**: ${w.id} **Member:** \`${memberName} - ${player.id}\`\n **Active:** ${w.isactive}\n**Rule:** ${w.rule.number} - ${w.rule.name}\n**Summary:** ${w.summary} **Time:** ${getTime(w.time)}`;
          } else if (w.summary && w.screenshot) {
            return w.rule.description ? `**ID**: ${w.id} **Member:** \`${memberName} - ${player.id}\`\n **Active:** ${w.isactive}\n**Rule:** ${w.rule.number} - ${w.rule.name} - ${w.rule.description}\n**Summary:** ${w.summary}\n**Screenshot:** ${w.screenshot}` : `**ID**: ${w.id} **Member:** \`${memberName} - ${player.id}\`\n **Active:** ${w.isactive}\n**Rule:** ${w.rule.number} - ${w.rule.name}\n**Summary:** ${w.summary}\n**Screenshot:** ${w.screenshot}`;
          } else if (w.time > 0 && w.screenshot) {
            return w.rule.description ? `**ID**: ${w.id} **Member:** \`${memberName} - ${player.id}\`\n**Active:** ${w.isactive}\n**Rule:** ${w.rule.number} - ${w.rule.name} - ${w.rule.description}\n**Time:** ${getTime(w.time)}\n**Screenshot:** ${w.screenshot}` : `**ID**: ${w.id} **Member:** \`${memberName} - ${player.id}\`\n **Active:** ${w.isactive}\n**Rule:** ${w.rule.number} - ${w.rule.name}\n**Time:** ${getTime(w.time)}\n**Screenshot:** ${w.screenshot}`;
          } else if (w.summary) {
            return w.rule.description ? `**ID**: ${w.id} **Member:** \`${memberName} - ${player.id}\`\n **Active:** ${w.isactive}\n**Rule:** ${w.rule.number} - ${w.rule.name} - ${w.rule.description}\n**Summary:** ${w.summary}` : `**ID**: ${w.id} **Member:** \`${memberName} - ${player.id}\`\n **Active:** ${w.isactive}\n**Rule:** ${w.rule.number} - ${w.rule.name}\n**Summary:** ${w.summary}`;
          } else if (w.time > 0) {
            return w.rule.description ? `**ID**: ${w.id} **Member:** \`${memberName} - ${player.id}\`\n **Active:** ${w.isactive}\n**Rule:** ${w.rule.number} - ${w.rule.name} - ${w.rule.description}\n**Time:** ${getTime(w.time)}` : `**ID**: ${w.id} **Member:** \`${memberName} - ${player.id}\`\n **Active:** ${w.isactive}\n**Rule:** ${w.rule.number} - ${w.rule.name}\n**Time:** ${getTime(w.time)}`;
          } else if (w.screenshot) {
            return w.rule.description ? `**ID**: ${w.id} **Member:** \`${memberName} - ${player.id}\`\n **Active:** ${w.isactive}\n**Rule:** ${w.rule.number} - ${w.rule.name} - ${w.rule.description}\n**Screenshot:** ${w.screenshot}` : `**ID**: ${w.id} **Member:** \`${memberName} - ${player.id}\`\n **Active:** ${w.isactive}\n**Rule:** ${w.rule.number} - ${w.rule.name}\n**Screenshot:** ${w.screenshot}`;
          } else {
            return w.rule.description ? `**ID**: ${w.id} **Member:** \`${memberName} - ${player.id}\`\n **Active:** ${w.isactive}\n**Rule:** ${w.rule.number} - ${w.rule.name} - ${w.rule.description}` : `**ID**: ${w.id} **Member:** \`${memberName} - ${player.id}\`\n **Active:** ${w.isactive}\n**Rule:** ${w.rule.number} - ${w.rule.name}`;
          }
        }).join('\n\n') || 'No warnings.';
    
        const embed = new EmbedBuilder()
          .setColor('Blue')
          .setTitle('Warnings')
          .setDescription(warningString);
    
        if (actives >= 3) {
          embed.setImage('attachment://images/3.png');
          return message.channel.send({ embeds: [embed], files: ['./images/3.png'] });
        } else if (actives == 2) {
          embed.setImage('attachment://images/2.png');
          return message.channel.send({ embeds: [embed], files: ['./images/2.png'] });
        } else if (actives == 1) {
          embed.setImage('attachment://images/1.png');
          return message.channel.send({ embeds: [embed], files: ['./images/1.png'] });
        } else {
          embed.setImage('attachment://images/0.png');
          return message.channel.send({ embeds: [embed], files: ['./images/0.png'] });
        }
      } else {
        const warningList = await Warnings.findAll({
          include: [{
            model: Rules,
          }]
        });
  
        let index = 1;
        for (let i = 0; i < warningList.length; i += 10) {
          const warningString = warningList.sort((a, b) => a.playerid - b.playerid).slice(i, i + 10).map(w => {
            const player = message.guild.members.cache.find(member => member.id == w.playerid);
            let memberId;
            let memberName;
            if (player) {
              memberId = player.id;
              if (player.nickname) {
                memberName = player.nickname;
              } else {
                memberName = player.user.username;
              }
            }
  
            if (w.summary && w.time > 0 && w.screenshot) {
              return w.rule.description ? `**ID**: ${w.id} **Member:** \`${memberName} - ${memberId}\`\n **Active:** ${w.isactive}\n**Rule:** ${w.rule.number} - ${w.rule.name} - ${w.rule.description}\n**Summary:** ${w.summary} **Time:** ${getTime(w.time)}\n**Screenshot:** ${w.screenshot}` : `**ID**: ${w.id} **Member:** \`${memberName} - ${memberId}\`\n **Active:** ${w.isactive}\n**Rule:** ${w.rule.number} - ${w.rule.name}\n**Summary:** ${w.summary} **Time:** ${getTime(w.time)}\n**Screenshot:** ${w.screenshot}`;
            } else if (w.summary && w.time > 0) {
              return w.rule.description ? `**ID**: ${w.id} **Member:** \`${memberName} - ${memberId}\`\n **Active:** ${w.isactive}\n**Rule:** ${w.rule.number} - ${w.rule.name} - ${w.rule.description}\n**Summary:** ${w.summary} **Time:** ${getTime(w.time)}` : `**ID**: ${w.id} **Member:** \`${memberName} - ${memberId}\`\n **Active:** ${w.isactive}\n**Rule:** ${w.rule.number} - ${w.rule.name}\n**Summary:** ${w.summary} **Time:** ${getTime(w.time)}`;
            } else if (w.summary && w.screenshot) {
              return w.rule.description ? `**ID**: ${w.id} **Member:** \`${memberName} - ${memberId}\`\n **Active:** ${w.isactive}\n**Rule:** ${w.rule.number} - ${w.rule.name} - ${w.rule.description}\n**Summary:** ${w.summary}\n**Screenshot:** ${w.screenshot}` : `**ID**: ${w.id} **Member:** \`${memberName} - ${memberId}\`\n **Active:** ${w.isactive}\n**Rule:** ${w.rule.number} - ${w.rule.name}\n**Summary:** ${w.summary}\n**Screenshot:** ${w.screenshot}`;
            } else if (w.time > 0 && w.screenshot) {
              return w.rule.description ? `**ID**: ${w.id} **Member:** \`${memberName} - ${memberId}\`\n **Active:** ${w.isactive}\n**Rule:** ${w.rule.number} - ${w.rule.name} - ${w.rule.description}\n**Time:** ${getTime(w.time)}\n**Screenshot:** ${w.screenshot}` : `**ID**: ${w.id} **Member:** \`${memberName} - ${memberId}\`\n **Active:** ${w.isactive}\n**Rule:** ${w.rule.number} - ${w.rule.name}\n**Time:** ${getTime(w.time)}\n**Screenshot:** ${w.screenshot}`;
            } else if (w.summary) {
              return w.rule.description ? `**ID**: ${w.id} **Member:** \`${memberName} - ${memberId}\`\n **Active:** ${w.isactive}\n**Rule:** ${w.rule.number} - ${w.rule.name} - ${w.rule.description}\n**Summary:** ${w.summary}` : `**ID**: ${w.id} **Member:** \`${memberName} - ${memberId}\`\n **Active:** ${w.isactive}\n**Rule:** ${w.rule.number} - ${w.rule.name}\n**Summary:** ${w.summary}`;
            } else if (w.time > 0) {
              return w.rule.description ? `**ID**: ${w.id} **Member:** \`${memberName} - ${memberId}\`\n **Active:** ${w.isactive}\n**Rule:** ${w.rule.number} - ${w.rule.name} - ${w.rule.description}\n**Time:** ${getTime(w.time)}` : `**ID**: ${w.id} **Member:** \`${memberName} - ${memberId}\`\n **Active:** ${w.isactive}\n**Rule:** ${w.rule.number} - ${w.rule.name}\n**Time:** ${getTime(w.time)}`;
            } else if (w.screenshot) {
              return w.rule.description ? `**ID**: ${w.id} **Member:** \`${memberName} - ${memberId}\`\n **Active:** ${w.isactive}\n**Rule:** ${w.rule.number} - ${w.rule.name} - ${w.rule.description}\n**Screenshot:** ${w.screenshot}` : `**ID**: ${w.id} **Member:** \`${memberName} - ${memberId}\`\n **Active:** ${w.isactive}\n**Rule:** ${w.rule.number} - ${w.rule.name}\n**Screenshot:** ${w.screenshot}`;
            } else {
              return w.rule.description ? `**ID**: ${w.id} **Member:** \`${memberName} - ${memberId}\`\n **Active:** ${w.isactive}\n**Rule:** ${w.rule.number} - ${w.rule.name} - ${w.rule.description}` : `**ID**: ${w.id} **Member:** \`${memberName} - ${memberId}\`\n **Active:** ${w.isactive}\n**Rule:** ${w.rule.number} - ${w.rule.name}`;
            }
          }).join('\n\n') || 'No warnings.';
  
          let footerText;
          if (warningList.length <= 10) {
            footerText = 1;
          } else {
            footerText = Math.ceil(warningList.length / 10);
          }
  
          const embed = new EmbedBuilder()
            .setColor('Blue')
            .setTitle('Warnings')
            .setDescription(warningString)
            .setFooter({ text: `Page ${index} of ${footerText}` });
          
          console.log(embeds.length);
          embeds.push(embed);
          index += 1;
        }
    
        const row = new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('previous')
              .setLabel('Previous')
              .setStyle('Primary')
              .setDisabled(true),
            new ButtonBuilder()
              .setCustomId('next')
              .setLabel('Next')
              .setStyle('Primary')
              .setDisabled(embeds.length == 1),
          );
        const row2 = new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('previous')
              .setLabel('Previous')
              .setStyle('Primary')
              .setDisabled(true),
            new ButtonBuilder()
              .setCustomId('next')
              .setLabel('Next')
              .setStyle('Primary')
              .setDisabled(true),
          );
    
        page = 0;
        const initMsg = await message.channel.send({ embeds: [embeds[0]], components: [row] });
        setTimeout(async () => {
          return await initMsg.edit({ components: [row2] });
        }, 60000);
      }
    }
  }

  // !warnings
  if (args[0] == '!warnings') {
    const warningList = await Warnings.findAll({
      include: [{
        model: Rules,
      }],
      where: {
        isactive: true,
        playerid: message.author.id,
      }
    });
    const actives = await Warnings.count({
      where: {
        isactive: true,
        playerid: message.author.id,
      }
    });
    const inactives = await Warnings.count({
      where: {
        isactive: false,
        playerid: message.author.id,
      }
    });
    const warningString = `You have **${actives}** active and **${inactives}** inactive warnings.\n\n` + warningList.map(w => {
      if (w.summary && w.time > 0 && w.screenshot) {
        return w.rule.description ? `**Rule:** ${w.rule.number} - ${w.rule.name} - ${w.rule.description}\n**Summary:** ${w.summary} **Time:** ${getTime(w.time)}\n**Screenshot:** ${w.screenshot}` : `**Rule:** ${w.rule.number} - ${w.rule.name}\n**Summary:** ${w.summary} **Time:** ${getTime(w.time)}\n**Screenshot:** ${w.screenshot}`;
      } else if (w.summary && w.time > 0) {
        return w.rule.description ? `**Rule:** ${w.rule.number} - ${w.rule.name} - ${w.rule.description}\n**Summary:** ${w.summary} **Time:** ${getTime(w.time)}` : `**Rule:** ${w.rule.number} - ${w.rule.name}\n**Summary:** ${w.summary} **Time:** ${getTime(w.time)}`;
      } else if (w.summary && w.screenshot) {
        return w.rule.description ? `**Rule:** ${w.rule.number} - ${w.rule.name} - ${w.rule.description}\n**Summary:** ${w.summary}\n**Screenshot:** ${w.screenshot}` : `**Rule:** ${w.rule.number} - ${w.rule.name}\n**Summary:** ${w.summary}\n**Screenshot:** ${w.screenshot}`;
      } else if (w.time > 0 && w.screenshot) {
        return w.rule.description ? `**Rule:** ${w.rule.number} - ${w.rule.name} - ${w.rule.description}\n**Time:** ${getTime(w.time)}\n**Screenshot:** ${w.screenshot}` : `**Rule:** ${w.rule.number} - ${w.rule.name}\n**Time:** ${getTime(w.time)}\n**Screenshot:** ${w.screenshot}`;
      } else if (w.summary) {
        return w.rule.description ? `**Rule:** ${w.rule.number} - ${w.rule.name} - ${w.rule.description}\n**Summary:** ${w.summary}` : `**Rule:** ${w.rule.number} - ${w.rule.name}\n**Summary:** ${w.summary}`;
      } else if (w.time > 0) {
        return w.rule.description ? `**Rule:** ${w.rule.number} - ${w.rule.name} - ${w.rule.description}\n**Time:** ${getTime(w.time)}` : `**Rule:** ${w.rule.number} - ${w.rule.name}\n**Time:** ${getTime(w.time)}`;
      } else if (w.screenshot) {
        return w.rule.description ? `**Rule:** ${w.rule.number} - ${w.rule.name} - ${w.rule.description}\n**Screenshot:** ${w.screenshot}` : `**Rule:** ${w.rule.number} - ${w.rule.name}\n**Screenshot:** ${w.screenshot}`;
      } else {
        return w.rule.description ? `**Rule:** ${w.rule.number} - ${w.rule.name} - ${w.rule.description}` : `**Rule:** ${w.rule.number} - ${w.rule.name}`;
      }
    }).join('\n\n');

    const embed = new EmbedBuilder()
      .setColor('Blue')
      .setTitle('Warnings')
      .setDescription(warningString);

    message.react('📩');
    if (actives >= 3) {
      embed.setImage('attachment://images/3.png');
      return message.author.send({ embeds: [embed], files: ['./images/3.png'] });
    } else if (actives == 2) {
      embed.setImage('attachment://images/2.png');
      return message.author.send({ embeds: [embed], files: ['./images/2.png'] });
    } else if (actives == 1) {
      embed.setImage('attachment://images/1.png');
      return message.author.send({ embeds: [embed], files: ['./images/1.png'] });
    } else {
      embed.setImage('attachment://images/0.png');
      return message.author.send({ embeds: [embed], files: ['./images/0.png'] });
    }
  }

  if ((args[0] == '!commands' || args[0] == '!cmds') && message.member.roles.cache.has(leaderRoleId)) {
    const embed = new EmbedBuilder()
      .setColor('Blue')
      .setTitle('Commands')
      .setDescription('`!addrule`\nAdds a new rule with a rule number, name and description\n**Example:** !addrule 1; Spamming; Sending the same text in chat over and over\n\n`!editrule`\nEdits a existing rule using the rule number\n**Example:** !editrule 1; Spamming Text; Sending the same content in chat repeatedly\n\n`!removerule`\nRemoves a existing rule using a rule number\n**Example:** !removerule 1\n\n`!rules`\nLists all the rules stored in the bot\n\n`!warn`\nAdds a new warning with a member\'s tag or ID, rule number, summary, time and screenshot\n**Example:** !warn @member; 1; Would not stop typing "Why?"; 1d; https://imgur.com/a/Nb8Oqdk \n\n`!removewarn`\nRemoves a existing warning using a warning ID\n**Example:** !removewarn 1\n\n`!check`\nLists all warnings stored in the bot or list ones for a certain member using a member\'s tag or ID\n**Example:** !check @member\n\n`!warnings`\nDM\'s the member that uses this command with a summary of their warnings');

    return message.channel.send({ embeds: [embed] });
  }
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isButton()) return;

  if (interaction.customId == 'next') {
    page += 1;
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('previous')
          .setLabel('Previous')
          .setStyle('Primary'),
        new ButtonBuilder()
          .setCustomId('next')
          .setLabel('Next')
          .setStyle('Primary')
          .setDisabled(embeds.length == page + 1),
      );
    const row2 = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('previous')
          .setLabel('Previous')
          .setStyle('Primary')
          .setDisabled(true),
        new ButtonBuilder()
          .setCustomId('next')
          .setLabel('Next')
          .setStyle('Primary')
          .setDisabled(true),
      );

    interaction.update({ embeds: [embeds[page]], components: [row] });
    setTimeout(() => {
      return interaction.editReply({ components: [row2] });
    }, 60000);
  }

  if (interaction.customId == 'previous') {
    page -= 1;
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('previous')
          .setLabel('Previous')
          .setStyle('Primary')
          .setDisabled(page == 0),
        new ButtonBuilder()
          .setCustomId('next')
          .setLabel('Next')
          .setStyle('Primary'),
      );
    const row2 = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('previous')
          .setLabel('Previous')
          .setStyle('Primary')
          .setDisabled(true),
        new ButtonBuilder()
          .setCustomId('next')
          .setLabel('Next')
          .setStyle('Primary')
          .setDisabled(true),
      );

    interaction.update({ embeds: [embeds[page]], components: [row] });
    setTimeout(() => {
      return interaction.editReply({ components: [row2] });
    }, 60000);
  }
});

client.login(token);