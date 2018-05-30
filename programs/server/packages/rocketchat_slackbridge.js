(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var RocketChat = Package['rocketchat:lib'].RocketChat;
var Logger = Package['rocketchat:logger'].Logger;
var SystemLogger = Package['rocketchat:logger'].SystemLogger;
var LoggerManager = Package['rocketchat:logger'].LoggerManager;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var TAPi18next = Package['tap:i18n'].TAPi18next;
var TAPi18n = Package['tap:i18n'].TAPi18n;

/* Package-scope variables */
var logger, slackMsgTxt, rocketUser;

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:slackbridge":{"server":{"logger.js":function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// packages/rocketchat_slackbridge/server/logger.js                                                             //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
/* globals logger:true */

/* exported logger */
logger = new Logger('SlackBridge', {
  sections: {
    connection: 'Connection',
    events: 'Events',
    class: 'Class'
  }
});
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"settings.js":function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// packages/rocketchat_slackbridge/server/settings.js                                                           //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
Meteor.startup(function () {
  RocketChat.settings.addGroup('SlackBridge', function () {
    this.add('SlackBridge_Enabled', false, {
      type: 'boolean',
      i18nLabel: 'Enabled',
      public: true
    });
    this.add('SlackBridge_APIToken', '', {
      type: 'string',
      enableQuery: {
        _id: 'SlackBridge_Enabled',
        value: true
      },
      i18nLabel: 'API_Token'
    });
    this.add('SlackBridge_AliasFormat', '', {
      type: 'string',
      enableQuery: {
        _id: 'SlackBridge_Enabled',
        value: true
      },
      i18nLabel: 'Alias_Format',
      i18nDescription: 'Alias_Format_Description'
    });
    this.add('SlackBridge_ExcludeBotnames', '', {
      type: 'string',
      enableQuery: {
        _id: 'SlackBridge_Enabled',
        value: true
      },
      i18nLabel: 'Exclude_Botnames',
      i18nDescription: 'Exclude_Botnames_Description'
    });
    this.add('SlackBridge_Out_Enabled', false, {
      type: 'boolean',
      enableQuery: {
        _id: 'SlackBridge_Enabled',
        value: true
      }
    });
    this.add('SlackBridge_Out_All', false, {
      type: 'boolean',
      enableQuery: [{
        _id: 'SlackBridge_Enabled',
        value: true
      }, {
        _id: 'SlackBridge_Out_Enabled',
        value: true
      }]
    });
    this.add('SlackBridge_Out_Channels', '', {
      type: 'roomPick',
      enableQuery: [{
        _id: 'SlackBridge_Enabled',
        value: true
      }, {
        _id: 'SlackBridge_Out_Enabled',
        value: true
      }, {
        _id: 'SlackBridge_Out_All',
        value: false
      }]
    });
  });
});
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"slackbridge.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// packages/rocketchat_slackbridge/server/slackbridge.js                                                        //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
let util;
module.watch(require("util"), {
  default(v) {
    util = v;
  }

}, 1);
let url;
module.watch(require("url"), {
  default(v) {
    url = v;
  }

}, 2);
let http;
module.watch(require("http"), {
  default(v) {
    http = v;
  }

}, 3);
let https;
module.watch(require("https"), {
  default(v) {
    https = v;
  }

}, 4);

class SlackBridge {
  constructor() {
    this.util = util;
    this.slackClient = require('@slack/client');
    this.apiToken = RocketChat.settings.get('SlackBridge_APIToken');
    this.aliasFormat = RocketChat.settings.get('SlackBridge_AliasFormat');
    this.excludeBotnames = RocketChat.settings.get('SlackBridge_Botnames');
    this.rtm = {};
    this.connected = false;
    this.userTags = {};
    this.slackChannelMap = {};
    this.reactionsMap = new Map();
    RocketChat.settings.get('SlackBridge_APIToken', (key, value) => {
      if (value !== this.apiToken) {
        this.apiToken = value;

        if (this.connected) {
          this.disconnect();
          this.connect();
        }
      }
    });
    RocketChat.settings.get('SlackBridge_AliasFormat', (key, value) => {
      this.aliasFormat = value;
    });
    RocketChat.settings.get('SlackBridge_ExcludeBotnames', (key, value) => {
      this.excludeBotnames = value;
    });
    RocketChat.settings.get('SlackBridge_Enabled', (key, value) => {
      if (value && this.apiToken) {
        this.connect();
      } else {
        this.disconnect();
      }
    });
  }

  connect() {
    if (this.connected === false) {
      this.connected = true;
      logger.connection.info('Connecting via token: ', this.apiToken);
      const RtmClient = this.slackClient.RtmClient;
      this.rtm = new RtmClient(this.apiToken);
      this.rtm.start();
      this.registerForSlackEvents();
      RocketChat.settings.get('SlackBridge_Out_Enabled', (key, value) => {
        if (value) {
          this.registerForRocketEvents();
        } else {
          this.unregisterForRocketEvents();
        }
      });
      Meteor.startup(() => {
        try {
          this.populateSlackChannelMap(); // If run outside of Meteor.startup, HTTP is not defined
        } catch (err) {
          logger.class.error('Error attempting to connect to Slack', err);
          this.disconnect();
        }
      });
    }
  }

  disconnect() {
    if (this.connected === true) {
      this.connected = false;
      this.rtm.disconnect && this.rtm.disconnect();
      logger.connection.info('Disconnected');
      this.unregisterForRocketEvents();
    }
  }

  convertSlackMsgTxtToRocketTxtFormat(slackMsgTxt) {
    if (!_.isEmpty(slackMsgTxt)) {
      slackMsgTxt = slackMsgTxt.replace(/<!everyone>/g, '@all');
      slackMsgTxt = slackMsgTxt.replace(/<!channel>/g, '@all');
      slackMsgTxt = slackMsgTxt.replace(/<!here>/g, '@here');
      slackMsgTxt = slackMsgTxt.replace(/&gt;/g, '>');
      slackMsgTxt = slackMsgTxt.replace(/&lt;/g, '<');
      slackMsgTxt = slackMsgTxt.replace(/&amp;/g, '&');
      slackMsgTxt = slackMsgTxt.replace(/:simple_smile:/g, ':smile:');
      slackMsgTxt = slackMsgTxt.replace(/:memo:/g, ':pencil:');
      slackMsgTxt = slackMsgTxt.replace(/:piggy:/g, ':pig:');
      slackMsgTxt = slackMsgTxt.replace(/:uk:/g, ':gb:');
      slackMsgTxt = slackMsgTxt.replace(/<(http[s]?:[^>]*)>/g, '$1');
      slackMsgTxt.replace(/(?:<@)([a-zA-Z0-9]+)(?:\|.+)?(?:>)/g, (match, userId) => {
        if (!this.userTags[userId]) {
          this.findRocketUser(userId) || this.addRocketUser(userId); // This adds userTags for the userId
        }

        const userTags = this.userTags[userId];

        if (userTags) {
          slackMsgTxt = slackMsgTxt.replace(userTags.slack, userTags.rocket);
        }
      });
    } else {
      slackMsgTxt = '';
    }

    return slackMsgTxt;
  }

  findRocketChannel(slackChannelId) {
    return RocketChat.models.Rooms.findOneByImportId(slackChannelId);
  }

  addRocketChannel(slackChannelID, hasRetried = false) {
    logger.class.debug('Adding Rocket.Chat channel from Slack', slackChannelID);
    let slackResults = null;
    let isGroup = false;

    if (slackChannelID.charAt(0) === 'C') {
      slackResults = HTTP.get('https://slack.com/api/channels.info', {
        params: {
          token: this.apiToken,
          channel: slackChannelID
        }
      });
    } else if (slackChannelID.charAt(0) === 'G') {
      slackResults = HTTP.get('https://slack.com/api/groups.info', {
        params: {
          token: this.apiToken,
          channel: slackChannelID
        }
      });
      isGroup = true;
    }

    if (slackResults && slackResults.data && slackResults.data.ok === true) {
      const rocketChannelData = isGroup ? slackResults.data.group : slackResults.data.channel;
      const existingRocketRoom = RocketChat.models.Rooms.findOneByName(rocketChannelData.name); // If the room exists, make sure we have its id in importIds

      if (existingRocketRoom || rocketChannelData.is_general) {
        rocketChannelData.rocketId = rocketChannelData.is_general ? 'GENERAL' : existingRocketRoom._id;
        RocketChat.models.Rooms.addImportIds(rocketChannelData.rocketId, rocketChannelData.id);
      } else {
        const rocketUsers = [];

        for (const member of rocketChannelData.members) {
          if (member !== rocketChannelData.creator) {
            const rocketUser = this.findRocketUser(member) || this.addRocketUser(member);

            if (rocketUser && rocketUser.username) {
              rocketUsers.push(rocketUser.username);
            }
          }
        }

        const rocketUserCreator = rocketChannelData.creator ? this.findRocketUser(rocketChannelData.creator) || this.addRocketUser(rocketChannelData.creator) : null;

        if (!rocketUserCreator) {
          logger.class.error('Could not fetch room creator information', rocketChannelData.creator);
          return;
        }

        try {
          const rocketChannel = RocketChat.createRoom(isGroup ? 'p' : 'c', rocketChannelData.name, rocketUserCreator.username, rocketUsers);
          rocketChannelData.rocketId = rocketChannel.rid;
        } catch (e) {
          if (!hasRetried) {
            logger.class.debug('Error adding channel from Slack. Will retry in 1s.', e.message); // If first time trying to create channel fails, could be because of multiple messages received at the same time. Try again once after 1s.

            Meteor._sleepForMs(1000);

            return this.findRocketChannel(slackChannelID) || this.addRocketChannel(slackChannelID, true);
          } else {
            console.log(e.message);
          }
        }

        const roomUpdate = {
          ts: new Date(rocketChannelData.created * 1000)
        };
        let lastSetTopic = 0;

        if (!_.isEmpty(rocketChannelData.topic && rocketChannelData.topic.value)) {
          roomUpdate.topic = rocketChannelData.topic.value;
          lastSetTopic = rocketChannelData.topic.last_set;
        }

        if (!_.isEmpty(rocketChannelData.purpose && rocketChannelData.purpose.value) && rocketChannelData.purpose.last_set > lastSetTopic) {
          roomUpdate.topic = rocketChannelData.purpose.value;
        }

        RocketChat.models.Rooms.addImportIds(rocketChannelData.rocketId, rocketChannelData.id);
        this.slackChannelMap[rocketChannelData.rocketId] = {
          id: slackChannelID,
          family: slackChannelID.charAt(0) === 'C' ? 'channels' : 'groups'
        };
      }

      return RocketChat.models.Rooms.findOneById(rocketChannelData.rocketId);
    }

    logger.class.debug('Channel not added');
    return;
  }

  findRocketUser(slackUserID) {
    const rocketUser = RocketChat.models.Users.findOneByImportId(slackUserID);

    if (rocketUser && !this.userTags[slackUserID]) {
      this.userTags[slackUserID] = {
        slack: `<@${slackUserID}>`,
        rocket: `@${rocketUser.username}`
      };
    }

    return rocketUser;
  }

  addRocketUser(slackUserID) {
    logger.class.debug('Adding Rocket.Chat user from Slack', slackUserID);
    const slackResults = HTTP.get('https://slack.com/api/users.info', {
      params: {
        token: this.apiToken,
        user: slackUserID
      }
    });

    if (slackResults && slackResults.data && slackResults.data.ok === true && slackResults.data.user) {
      const rocketUserData = slackResults.data.user;
      const isBot = rocketUserData.is_bot === true;
      const email = rocketUserData.profile && rocketUserData.profile.email || '';
      let existingRocketUser;

      if (!isBot) {
        existingRocketUser = RocketChat.models.Users.findOneByEmailAddress(email) || RocketChat.models.Users.findOneByUsername(rocketUserData.name);
      } else {
        existingRocketUser = RocketChat.models.Users.findOneByUsername(rocketUserData.name);
      }

      if (existingRocketUser) {
        rocketUserData.rocketId = existingRocketUser._id;
        rocketUserData.name = existingRocketUser.username;
      } else {
        const newUser = {
          password: Random.id(),
          username: rocketUserData.name
        };

        if (!isBot && email) {
          newUser.email = email;
        }

        if (isBot) {
          newUser.joinDefaultChannels = false;
        }

        rocketUserData.rocketId = Accounts.createUser(newUser);
        const userUpdate = {
          utcOffset: rocketUserData.tz_offset / 3600,
          // Slack's is -18000 which translates to Rocket.Chat's after dividing by 3600,
          roles: isBot ? ['bot'] : ['user']
        };

        if (rocketUserData.profile && rocketUserData.profile.real_name) {
          userUpdate['name'] = rocketUserData.profile.real_name;
        }

        if (rocketUserData.deleted) {
          userUpdate['active'] = false;
          userUpdate['services.resume.loginTokens'] = [];
        }

        RocketChat.models.Users.update({
          _id: rocketUserData.rocketId
        }, {
          $set: userUpdate
        });
        const user = RocketChat.models.Users.findOneById(rocketUserData.rocketId);
        let url = null;

        if (rocketUserData.profile) {
          if (rocketUserData.profile.image_original) {
            url = rocketUserData.profile.image_original;
          } else if (rocketUserData.profile.image_512) {
            url = rocketUserData.profile.image_512;
          }
        }

        if (url) {
          try {
            RocketChat.setUserAvatar(user, url, null, 'url');
          } catch (error) {
            logger.class.debug('Error setting user avatar', error.message);
          }
        }
      }

      const importIds = [rocketUserData.id];

      if (isBot && rocketUserData.profile && rocketUserData.profile.bot_id) {
        importIds.push(rocketUserData.profile.bot_id);
      }

      RocketChat.models.Users.addImportIds(rocketUserData.rocketId, importIds);

      if (!this.userTags[slackUserID]) {
        this.userTags[slackUserID] = {
          slack: `<@${slackUserID}>`,
          rocket: `@${rocketUserData.name}`
        };
      }

      return RocketChat.models.Users.findOneById(rocketUserData.rocketId);
    }

    logger.class.debug('User not added');
    return;
  }

  addAliasToRocketMsg(rocketUserName, rocketMsgObj) {
    if (this.aliasFormat) {
      const alias = this.util.format(this.aliasFormat, rocketUserName);

      if (alias !== rocketUserName) {
        rocketMsgObj.alias = alias;
      }
    }

    return rocketMsgObj;
  }

  createAndSaveRocketMessage(rocketChannel, rocketUser, slackMessage, rocketMsgDataDefaults, isImporting) {
    if (slackMessage.type === 'message') {
      let rocketMsgObj = {};

      if (!_.isEmpty(slackMessage.subtype)) {
        rocketMsgObj = this.processSlackSubtypedMessage(rocketChannel, rocketUser, slackMessage, isImporting);

        if (!rocketMsgObj) {
          return;
        }
      } else {
        rocketMsgObj = {
          msg: this.convertSlackMsgTxtToRocketTxtFormat(slackMessage.text),
          rid: rocketChannel._id,
          u: {
            _id: rocketUser._id,
            username: rocketUser.username
          }
        };
        this.addAliasToRocketMsg(rocketUser.username, rocketMsgObj);
      }

      _.extend(rocketMsgObj, rocketMsgDataDefaults);

      if (slackMessage.edited) {
        rocketMsgObj.editedAt = new Date(parseInt(slackMessage.edited.ts.split('.')[0]) * 1000);
      }

      if (slackMessage.subtype === 'bot_message') {
        rocketUser = RocketChat.models.Users.findOneById('rocket.cat', {
          fields: {
            username: 1
          }
        });
      }

      if (slackMessage.pinned_to && slackMessage.pinned_to.indexOf(slackMessage.channel) !== -1) {
        rocketMsgObj.pinned = true;
        rocketMsgObj.pinnedAt = Date.now;
        rocketMsgObj.pinnedBy = _.pick(rocketUser, '_id', 'username');
      }

      if (slackMessage.subtype === 'bot_message') {
        Meteor.setTimeout(() => {
          if (slackMessage.bot_id && slackMessage.ts && !RocketChat.models.Messages.findOneBySlackBotIdAndSlackTs(slackMessage.bot_id, slackMessage.ts)) {
            RocketChat.sendMessage(rocketUser, rocketMsgObj, rocketChannel, true);
          }
        }, 500);
      } else {
        logger.class.debug('Send message to Rocket.Chat');
        RocketChat.sendMessage(rocketUser, rocketMsgObj, rocketChannel, true);
      }
    }
  }
  /*
   https://api.slack.com/events/reaction_removed
   */


  onSlackReactionRemoved(slackReactionMsg) {
    if (slackReactionMsg) {
      const rocketUser = this.getRocketUser(slackReactionMsg.user); //Lets find our Rocket originated message

      let rocketMsg = RocketChat.models.Messages.findOneBySlackTs(slackReactionMsg.item.ts);

      if (!rocketMsg) {
        //Must have originated from Slack
        const rocketID = this.createRocketID(slackReactionMsg.item.channel, slackReactionMsg.item.ts);
        rocketMsg = RocketChat.models.Messages.findOneById(rocketID);
      }

      if (rocketMsg && rocketUser) {
        const rocketReaction = `:${slackReactionMsg.reaction}:`; //If the Rocket user has already been removed, then this is an echo back from slack

        if (rocketMsg.reactions) {
          const theReaction = rocketMsg.reactions[rocketReaction];

          if (theReaction) {
            if (theReaction.usernames.indexOf(rocketUser.username) === -1) {
              return; //Reaction already removed
            }
          }
        } else {
          //Reaction already removed
          return;
        } //Stash this away to key off it later so we don't send it back to Slack


        this.reactionsMap.set(`unset${rocketMsg._id}${rocketReaction}`, rocketUser);
        logger.class.debug('Removing reaction from Slack');
        Meteor.runAsUser(rocketUser._id, () => {
          Meteor.call('setReaction', rocketReaction, rocketMsg._id);
        });
      }
    }
  }
  /*
   https://api.slack.com/events/reaction_added
   */


  onSlackReactionAdded(slackReactionMsg) {
    if (slackReactionMsg) {
      const rocketUser = this.getRocketUser(slackReactionMsg.user);

      if (rocketUser.roles.includes('bot')) {
        return;
      } //Lets find our Rocket originated message


      let rocketMsg = RocketChat.models.Messages.findOneBySlackTs(slackReactionMsg.item.ts);

      if (!rocketMsg) {
        //Must have originated from Slack
        const rocketID = this.createRocketID(slackReactionMsg.item.channel, slackReactionMsg.item.ts);
        rocketMsg = RocketChat.models.Messages.findOneById(rocketID);
      }

      if (rocketMsg && rocketUser) {
        const rocketReaction = `:${slackReactionMsg.reaction}:`; //If the Rocket user has already reacted, then this is Slack echoing back to us

        if (rocketMsg.reactions) {
          const theReaction = rocketMsg.reactions[rocketReaction];

          if (theReaction) {
            if (theReaction.usernames.indexOf(rocketUser.username) !== -1) {
              return; //Already reacted
            }
          }
        } //Stash this away to key off it later so we don't send it back to Slack


        this.reactionsMap.set(`set${rocketMsg._id}${rocketReaction}`, rocketUser);
        logger.class.debug('Adding reaction from Slack');
        Meteor.runAsUser(rocketUser._id, () => {
          Meteor.call('setReaction', rocketReaction, rocketMsg._id);
        });
      }
    }
  }
  /**
   * We have received a message from slack and we need to save/delete/update it into rocket
   * https://api.slack.com/events/message
   */


  onSlackMessage(slackMessage, isImporting) {
    if (slackMessage.subtype) {
      switch (slackMessage.subtype) {
        case 'message_deleted':
          this.processSlackMessageDeleted(slackMessage);
          break;

        case 'message_changed':
          this.processSlackMessageChanged(slackMessage);
          break;

        default:
          //Keeping backwards compatability for now, refactor later
          this.processSlackNewMessage(slackMessage, isImporting);
      }
    } else {
      //Simple message
      this.processSlackNewMessage(slackMessage, isImporting);
    }
  }

  processSlackSubtypedMessage(rocketChannel, rocketUser, slackMessage, isImporting) {
    let rocketMsgObj = null;

    switch (slackMessage.subtype) {
      case 'bot_message':
        if (slackMessage.username !== undefined && this.excludeBotnames && slackMessage.username.match(this.excludeBotnames)) {
          return;
        }

        rocketMsgObj = {
          msg: this.convertSlackMsgTxtToRocketTxtFormat(slackMessage.text),
          rid: rocketChannel._id,
          bot: true,
          attachments: slackMessage.attachments,
          username: slackMessage.username || slackMessage.bot_id
        };
        this.addAliasToRocketMsg(slackMessage.username || slackMessage.bot_id, rocketMsgObj);

        if (slackMessage.icons) {
          rocketMsgObj.emoji = slackMessage.icons.emoji;
        }

        return rocketMsgObj;

      case 'me_message':
        return this.addAliasToRocketMsg(rocketUser.username, {
          msg: `_${this.convertSlackMsgTxtToRocketTxtFormat(slackMessage.text)}_`
        });

      case 'channel_join':
        if (isImporting) {
          RocketChat.models.Messages.createUserJoinWithRoomIdAndUser(rocketChannel._id, rocketUser, {
            ts: new Date(parseInt(slackMessage.ts.split('.')[0]) * 1000),
            imported: 'slackbridge'
          });
        } else {
          RocketChat.addUserToRoom(rocketChannel._id, rocketUser);
        }

        return;

      case 'group_join':
        if (slackMessage.inviter) {
          const inviter = slackMessage.inviter ? this.findRocketUser(slackMessage.inviter) || this.addRocketUser(slackMessage.inviter) : null;

          if (isImporting) {
            RocketChat.models.Messages.createUserAddedWithRoomIdAndUser(rocketChannel._id, rocketUser, {
              ts: new Date(parseInt(slackMessage.ts.split('.')[0]) * 1000),
              u: {
                _id: inviter._id,
                username: inviter.username
              },
              imported: 'slackbridge'
            });
          } else {
            RocketChat.addUserToRoom(rocketChannel._id, rocketUser, inviter);
          }
        }

        return;

      case 'channel_leave':
      case 'group_leave':
        if (isImporting) {
          RocketChat.models.Messages.createUserLeaveWithRoomIdAndUser(rocketChannel._id, rocketUser, {
            ts: new Date(parseInt(slackMessage.ts.split('.')[0]) * 1000),
            imported: 'slackbridge'
          });
        } else {
          RocketChat.removeUserFromRoom(rocketChannel._id, rocketUser);
        }

        return;

      case 'channel_topic':
      case 'group_topic':
        if (isImporting) {
          RocketChat.models.Messages.createRoomSettingsChangedWithTypeRoomIdMessageAndUser('room_changed_topic', rocketChannel._id, slackMessage.topic, rocketUser, {
            ts: new Date(parseInt(slackMessage.ts.split('.')[0]) * 1000),
            imported: 'slackbridge'
          });
        } else {
          RocketChat.saveRoomTopic(rocketChannel._id, slackMessage.topic, rocketUser, false);
        }

        return;

      case 'channel_purpose':
      case 'group_purpose':
        if (isImporting) {
          RocketChat.models.Messages.createRoomSettingsChangedWithTypeRoomIdMessageAndUser('room_changed_topic', rocketChannel._id, slackMessage.purpose, rocketUser, {
            ts: new Date(parseInt(slackMessage.ts.split('.')[0]) * 1000),
            imported: 'slackbridge'
          });
        } else {
          RocketChat.saveRoomTopic(rocketChannel._id, slackMessage.purpose, rocketUser, false);
        }

        return;

      case 'channel_name':
      case 'group_name':
        if (isImporting) {
          RocketChat.models.Messages.createRoomRenamedWithRoomIdRoomNameAndUser(rocketChannel._id, slackMessage.name, rocketUser, {
            ts: new Date(parseInt(slackMessage.ts.split('.')[0]) * 1000),
            imported: 'slackbridge'
          });
        } else {
          RocketChat.saveRoomName(rocketChannel._id, slackMessage.name, rocketUser, false);
        }

        return;

      case 'channel_archive':
      case 'group_archive':
        if (!isImporting) {
          RocketChat.archiveRoom(rocketChannel);
        }

        return;

      case 'channel_unarchive':
      case 'group_unarchive':
        if (!isImporting) {
          RocketChat.unarchiveRoom(rocketChannel);
        }

        return;

      case 'file_share':
        if (slackMessage.file && slackMessage.file.url_private_download !== undefined) {
          const details = {
            message_id: `slack-${slackMessage.ts.replace(/\./g, '-')}`,
            name: slackMessage.file.name,
            size: slackMessage.file.size,
            type: slackMessage.file.mimetype,
            rid: rocketChannel._id
          };
          return this.uploadFileFromSlack(details, slackMessage.file.url_private_download, rocketUser, rocketChannel, new Date(parseInt(slackMessage.ts.split('.')[0]) * 1000), isImporting);
        }

        break;

      case 'file_comment':
        logger.class.error('File comment not implemented');
        return;

      case 'file_mention':
        logger.class.error('File mentioned not implemented');
        return;

      case 'pinned_item':
        if (slackMessage.attachments && slackMessage.attachments[0] && slackMessage.attachments[0].text) {
          rocketMsgObj = {
            rid: rocketChannel._id,
            t: 'message_pinned',
            msg: '',
            u: {
              _id: rocketUser._id,
              username: rocketUser.username
            },
            attachments: [{
              'text': this.convertSlackMsgTxtToRocketTxtFormat(slackMessage.attachments[0].text),
              'author_name': slackMessage.attachments[0].author_subname,
              'author_icon': getAvatarUrlFromUsername(slackMessage.attachments[0].author_subname),
              'ts': new Date(parseInt(slackMessage.attachments[0].ts.split('.')[0]) * 1000)
            }]
          };

          if (!isImporting) {
            RocketChat.models.Messages.setPinnedByIdAndUserId(`slack-${slackMessage.attachments[0].channel_id}-${slackMessage.attachments[0].ts.replace(/\./g, '-')}`, rocketMsgObj.u, true, new Date(parseInt(slackMessage.ts.split('.')[0]) * 1000));
          }

          return rocketMsgObj;
        } else {
          logger.class.error('Pinned item with no attachment');
        }

        return;

      case 'unpinned_item':
        logger.class.error('Unpinned item not implemented');
        return;
    }
  }
  /**
  Uploads the file to the storage.
  @param [Object] details an object with details about the upload. name, size, type, and rid
  @param [String] fileUrl url of the file to download/import
  @param [Object] user the Rocket.Chat user
  @param [Object] room the Rocket.Chat room
  @param [Date] timeStamp the timestamp the file was uploaded
  **/
  //details, slackMessage.file.url_private_download, rocketUser, rocketChannel, new Date(parseInt(slackMessage.ts.split('.')[0]) * 1000), isImporting);


  uploadFileFromSlack(details, slackFileURL, rocketUser, rocketChannel, timeStamp, isImporting) {
    const requestModule = /https/i.test(slackFileURL) ? https : http;
    const parsedUrl = url.parse(slackFileURL, true);
    parsedUrl.headers = {
      'Authorization': `Bearer ${this.apiToken}`
    };
    requestModule.get(parsedUrl, Meteor.bindEnvironment(stream => {
      const fileStore = FileUpload.getStore('Uploads');
      fileStore.insert(details, stream, (err, file) => {
        if (err) {
          throw new Error(err);
        } else {
          const url = file.url.replace(Meteor.absoluteUrl(), '/');
          const attachment = {
            title: file.name,
            title_link: url
          };

          if (/^image\/.+/.test(file.type)) {
            attachment.image_url = url;
            attachment.image_type = file.type;
            attachment.image_size = file.size;
            attachment.image_dimensions = file.identify && file.identify.size;
          }

          if (/^audio\/.+/.test(file.type)) {
            attachment.audio_url = url;
            attachment.audio_type = file.type;
            attachment.audio_size = file.size;
          }

          if (/^video\/.+/.test(file.type)) {
            attachment.video_url = url;
            attachment.video_type = file.type;
            attachment.video_size = file.size;
          }

          const msg = {
            rid: details.rid,
            ts: timeStamp,
            msg: '',
            file: {
              _id: file._id
            },
            groupable: false,
            attachments: [attachment]
          };

          if (isImporting) {
            msg.imported = 'slackbridge';
          }

          if (details.message_id && typeof details.message_id === 'string') {
            msg['_id'] = details.message_id;
          }

          return RocketChat.sendMessage(rocketUser, msg, rocketChannel, true);
        }
      });
    }));
  }

  registerForRocketEvents() {
    RocketChat.callbacks.add('afterSaveMessage', this.onRocketMessage.bind(this), RocketChat.callbacks.priority.LOW, 'SlackBridge_Out');
    RocketChat.callbacks.add('afterDeleteMessage', this.onRocketMessageDelete.bind(this), RocketChat.callbacks.priority.LOW, 'SlackBridge_Delete');
    RocketChat.callbacks.add('setReaction', this.onRocketSetReaction.bind(this), RocketChat.callbacks.priority.LOW, 'SlackBridge_SetReaction');
    RocketChat.callbacks.add('unsetReaction', this.onRocketUnSetReaction.bind(this), RocketChat.callbacks.priority.LOW, 'SlackBridge_UnSetReaction');
  }

  unregisterForRocketEvents() {
    RocketChat.callbacks.remove('afterSaveMessage', 'SlackBridge_Out');
    RocketChat.callbacks.remove('afterDeleteMessage', 'SlackBridge_Delete');
    RocketChat.callbacks.remove('setReaction', 'SlackBridge_SetReaction');
    RocketChat.callbacks.remove('unsetReaction', 'SlackBridge_UnSetReaction');
  }

  registerForSlackEvents() {
    const CLIENT_EVENTS = this.slackClient.CLIENT_EVENTS;
    this.rtm.on(CLIENT_EVENTS.RTM.AUTHENTICATED, () => {
      logger.connection.info('Connected to Slack');
    });
    this.rtm.on(CLIENT_EVENTS.RTM.UNABLE_TO_RTM_START, () => {
      this.disconnect();
    });
    this.rtm.on(CLIENT_EVENTS.RTM.DISCONNECT, () => {
      this.disconnect();
    });
    const RTM_EVENTS = this.slackClient.RTM_EVENTS;
    /**
    * Event fired when someone messages a channel the bot is in
    * {
    *	type: 'message',
    * 	channel: [channel_id],
    * 	user: [user_id],
    * 	text: [message],
    * 	ts: [ts.milli],
    * 	team: [team_id],
    * 	subtype: [message_subtype],
    * 	inviter: [message_subtype = 'group_join|channel_join' -> user_id]
    * }
    **/

    this.rtm.on(RTM_EVENTS.MESSAGE, Meteor.bindEnvironment(slackMessage => {
      logger.events.debug('OnSlackEvent-MESSAGE: ', slackMessage);

      if (slackMessage) {
        this.onSlackMessage(slackMessage);
      }
    }));
    this.rtm.on(RTM_EVENTS.REACTION_ADDED, Meteor.bindEnvironment(reactionMsg => {
      logger.events.debug('OnSlackEvent-REACTION_ADDED: ', reactionMsg);

      if (reactionMsg) {
        this.onSlackReactionAdded(reactionMsg);
      }
    }));
    this.rtm.on(RTM_EVENTS.REACTION_REMOVED, Meteor.bindEnvironment(reactionMsg => {
      logger.events.debug('OnSlackEvent-REACTION_REMOVED: ', reactionMsg);

      if (reactionMsg) {
        this.onSlackReactionRemoved(reactionMsg);
      }
    }));
    /**
    * Event fired when someone creates a public channel
    * {
    *	type: 'channel_created',
    *	channel: {
    *		id: [channel_id],
    *		is_channel: true,
    *		name: [channel_name],
    *		created: [ts],
    *		creator: [user_id],
    *		is_shared: false,
    *		is_org_shared: false
    *	},
    *	event_ts: [ts.milli]
    * }
    **/

    this.rtm.on(RTM_EVENTS.CHANNEL_CREATED, Meteor.bindEnvironment(() => {}));
    /**
    * Event fired when the bot joins a public channel
    * {
    * 	type: 'channel_joined',
    * 	channel: {
    * 		id: [channel_id],
    * 		name: [channel_name],
    * 		is_channel: true,
    * 		created: [ts],
    * 		creator: [user_id],
    * 		is_archived: false,
    * 		is_general: false,
    * 		is_member: true,
    * 		last_read: [ts.milli],
    * 		latest: [message_obj],
    * 		unread_count: 0,
    * 		unread_count_display: 0,
    * 		members: [ user_ids ],
    * 		topic: {
    * 			value: [channel_topic],
    * 			creator: [user_id],
    * 			last_set: 0
    * 		},
    * 		purpose: {
    * 			value: [channel_purpose],
    * 			creator: [user_id],
    * 			last_set: 0
    * 		}
    * 	}
    * }
    **/

    this.rtm.on(RTM_EVENTS.CHANNEL_JOINED, Meteor.bindEnvironment(() => {}));
    /**
    * Event fired when the bot leaves (or is removed from) a public channel
    * {
    * 	type: 'channel_left',
    * 	channel: [channel_id]
    * }
    **/

    this.rtm.on(RTM_EVENTS.CHANNEL_LEFT, Meteor.bindEnvironment(() => {}));
    /**
    * Event fired when an archived channel is deleted by an admin
    * {
    * 	type: 'channel_deleted',
    * 	channel: [channel_id],
    *	event_ts: [ts.milli]
    * }
    **/

    this.rtm.on(RTM_EVENTS.CHANNEL_DELETED, Meteor.bindEnvironment(() => {}));
    /**
    * Event fired when the channel has its name changed
    * {
    * 	type: 'channel_rename',
    * 	channel: {
    * 		id: [channel_id],
    * 		name: [channel_name],
    * 		is_channel: true,
    * 		created: [ts]
    * 	},
    *	event_ts: [ts.milli]
    * }
    **/

    this.rtm.on(RTM_EVENTS.CHANNEL_RENAME, Meteor.bindEnvironment(() => {}));
    /**
    * Event fired when the bot joins a private channel
    * {
    * 	type: 'group_joined',
    * 	channel: {
    * 		id: [channel_id],
    * 		name: [channel_name],
    * 		is_group: true,
    * 		created: [ts],
    * 		creator: [user_id],
    * 		is_archived: false,
    * 		is_mpim: false,
    * 		is_open: true,
    * 		last_read: [ts.milli],
    * 		latest: [message_obj],
    * 		unread_count: 0,
    * 		unread_count_display: 0,
    * 		members: [ user_ids ],
    * 		topic: {
    * 			value: [channel_topic],
    * 			creator: [user_id],
    * 			last_set: 0
    * 		},
    * 		purpose: {
    * 			value: [channel_purpose],
    * 			creator: [user_id],
    * 			last_set: 0
    * 		}
    * 	}
    * }
    **/

    this.rtm.on(RTM_EVENTS.GROUP_JOINED, Meteor.bindEnvironment(() => {}));
    /**
    * Event fired when the bot leaves (or is removed from) a private channel
    * {
    * 	type: 'group_left',
    * 	channel: [channel_id]
    * }
    **/

    this.rtm.on(RTM_EVENTS.GROUP_LEFT, Meteor.bindEnvironment(() => {}));
    /**
    * Event fired when the private channel has its name changed
    * {
    * 	type: 'group_rename',
    * 	channel: {
    * 		id: [channel_id],
    * 		name: [channel_name],
    * 		is_group: true,
    * 		created: [ts]
    * 	},
    *	event_ts: [ts.milli]
    * }
    **/

    this.rtm.on(RTM_EVENTS.GROUP_RENAME, Meteor.bindEnvironment(() => {}));
    /**
    * Event fired when a new user joins the team
    * {
    * 	type: 'team_join',
    * 	user:
    * 	{
    * 		id: [user_id],
    * 		team_id: [team_id],
    * 		name: [user_name],
    * 		deleted: false,
    * 		status: null,
    * 		color: [color_code],
    * 		real_name: '',
    * 		tz: [timezone],
    * 		tz_label: [timezone_label],
    * 		tz_offset: [timezone_offset],
    * 		profile:
    * 		{
    * 			avatar_hash: '',
    * 			real_name: '',
    * 			real_name_normalized: '',
    * 			email: '',
    * 			image_24: '',
    * 			image_32: '',
    * 			image_48: '',
    * 			image_72: '',
    * 			image_192: '',
    * 			image_512: '',
    * 			fields: null
    * 		},
    * 		is_admin: false,
    * 		is_owner: false,
    * 		is_primary_owner: false,
    * 		is_restricted: false,
    * 		is_ultra_restricted: false,
    * 		is_bot: false,
    * 		presence: [user_presence]
    * 	},
    * 	cache_ts: [ts]
    * }
    **/

    this.rtm.on(RTM_EVENTS.TEAM_JOIN, Meteor.bindEnvironment(() => {}));
  }

  findSlackChannel(rocketChannelName) {
    logger.class.debug('Searching for Slack channel or group', rocketChannelName);
    let response = HTTP.get('https://slack.com/api/channels.list', {
      params: {
        token: this.apiToken
      }
    });

    if (response && response.data && _.isArray(response.data.channels) && response.data.channels.length > 0) {
      for (const channel of response.data.channels) {
        if (channel.name === rocketChannelName && channel.is_member === true) {
          return channel;
        }
      }
    }

    response = HTTP.get('https://slack.com/api/groups.list', {
      params: {
        token: this.apiToken
      }
    });

    if (response && response.data && _.isArray(response.data.groups) && response.data.groups.length > 0) {
      for (const group of response.data.groups) {
        if (group.name === rocketChannelName) {
          return group;
        }
      }
    }
  }

  importFromHistory(family, options) {
    logger.class.debug('Importing messages history');
    const response = HTTP.get(`https://slack.com/api/${family}.history`, {
      params: _.extend({
        token: this.apiToken
      }, options)
    });

    if (response && response.data && _.isArray(response.data.messages) && response.data.messages.length > 0) {
      let latest = 0;

      for (const message of response.data.messages.reverse()) {
        logger.class.debug('MESSAGE: ', message);

        if (!latest || message.ts > latest) {
          latest = message.ts;
        }

        message.channel = options.channel;
        this.onSlackMessage(message, true);
      }

      return {
        has_more: response.data.has_more,
        ts: latest
      };
    }
  }

  copySlackChannelInfo(rid, channelMap) {
    logger.class.debug('Copying users from Slack channel to Rocket.Chat', channelMap.id, rid);
    const response = HTTP.get(`https://slack.com/api/${channelMap.family}.info`, {
      params: {
        token: this.apiToken,
        channel: channelMap.id
      }
    });

    if (response && response.data) {
      const data = channelMap.family === 'channels' ? response.data.channel : response.data.group;

      if (data && _.isArray(data.members) && data.members.length > 0) {
        for (const member of data.members) {
          const user = this.findRocketUser(member) || this.addRocketUser(member);

          if (user) {
            logger.class.debug('Adding user to room', user.username, rid);
            RocketChat.addUserToRoom(rid, user, null, true);
          }
        }
      }

      let topic = '';
      let topic_last_set = 0;
      let topic_creator = null;

      if (data && data.topic && data.topic.value) {
        topic = data.topic.value;
        topic_last_set = data.topic.last_set;
        topic_creator = data.topic.creator;
      }

      if (data && data.purpose && data.purpose.value) {
        if (topic_last_set) {
          if (topic_last_set < data.purpose.last_set) {
            topic = data.purpose.topic;
            topic_creator = data.purpose.creator;
          }
        } else {
          topic = data.purpose.topic;
          topic_creator = data.purpose.creator;
        }
      }

      if (topic) {
        const creator = this.findRocketUser(topic_creator) || this.addRocketUser(topic_creator);
        logger.class.debug('Setting room topic', rid, topic, creator.username);
        RocketChat.saveRoomTopic(rid, topic, creator, false);
      }
    }
  }

  copyPins(rid, channelMap) {
    const response = HTTP.get('https://slack.com/api/pins.list', {
      params: {
        token: this.apiToken,
        channel: channelMap.id
      }
    });

    if (response && response.data && _.isArray(response.data.items) && response.data.items.length > 0) {
      for (const pin of response.data.items) {
        if (pin.message) {
          const user = this.findRocketUser(pin.message.user);
          const msgObj = {
            rid,
            t: 'message_pinned',
            msg: '',
            u: {
              _id: user._id,
              username: user.username
            },
            attachments: [{
              'text': this.convertSlackMsgTxtToRocketTxtFormat(pin.message.text),
              'author_name': user.username,
              'author_icon': getAvatarUrlFromUsername(user.username),
              'ts': new Date(parseInt(pin.message.ts.split('.')[0]) * 1000)
            }]
          };
          RocketChat.models.Messages.setPinnedByIdAndUserId(`slack-${pin.channel}-${pin.message.ts.replace(/\./g, '-')}`, msgObj.u, true, new Date(parseInt(pin.message.ts.split('.')[0]) * 1000));
        }
      }
    }
  }

  importMessages(rid, callback) {
    logger.class.info('importMessages: ', rid);
    const rocketchat_room = RocketChat.models.Rooms.findOneById(rid);

    if (rocketchat_room) {
      if (this.slackChannelMap[rid]) {
        this.copySlackChannelInfo(rid, this.slackChannelMap[rid]);
        logger.class.debug('Importing messages from Slack to Rocket.Chat', this.slackChannelMap[rid], rid);
        let results = this.importFromHistory(this.slackChannelMap[rid].family, {
          channel: this.slackChannelMap[rid].id,
          oldest: 1
        });

        while (results && results.has_more) {
          results = this.importFromHistory(this.slackChannelMap[rid].family, {
            channel: this.slackChannelMap[rid].id,
            oldest: results.ts
          });
        }

        logger.class.debug('Pinning Slack channel messages to Rocket.Chat', this.slackChannelMap[rid], rid);
        this.copyPins(rid, this.slackChannelMap[rid]);
        return callback();
      } else {
        const slack_room = this.findSlackChannel(rocketchat_room.name);

        if (slack_room) {
          this.slackChannelMap[rid] = {
            id: slack_room.id,
            family: slack_room.id.charAt(0) === 'C' ? 'channels' : 'groups'
          };
          return this.importMessages(rid, callback);
        } else {
          logger.class.error('Could not find Slack room with specified name', rocketchat_room.name);
          return callback(new Meteor.Error('error-slack-room-not-found', 'Could not find Slack room with specified name'));
        }
      }
    } else {
      logger.class.error('Could not find Rocket.Chat room with specified id', rid);
      return callback(new Meteor.Error('error-invalid-room', 'Invalid room'));
    }
  }

  populateSlackChannelMap() {
    logger.class.debug('Populating channel map');
    let response = HTTP.get('https://slack.com/api/channels.list', {
      params: {
        token: this.apiToken
      }
    });

    if (response && response.data && _.isArray(response.data.channels) && response.data.channels.length > 0) {
      for (const slackChannel of response.data.channels) {
        const rocketchat_room = RocketChat.models.Rooms.findOneByName(slackChannel.name, {
          fields: {
            _id: 1
          }
        });

        if (rocketchat_room) {
          this.slackChannelMap[rocketchat_room._id] = {
            id: slackChannel.id,
            family: slackChannel.id.charAt(0) === 'C' ? 'channels' : 'groups'
          };
        }
      }
    }

    response = HTTP.get('https://slack.com/api/groups.list', {
      params: {
        token: this.apiToken
      }
    });

    if (response && response.data && _.isArray(response.data.groups) && response.data.groups.length > 0) {
      for (const slackGroup of response.data.groups) {
        const rocketchat_room = RocketChat.models.Rooms.findOneByName(slackGroup.name, {
          fields: {
            _id: 1
          }
        });

        if (rocketchat_room) {
          this.slackChannelMap[rocketchat_room._id] = {
            id: slackGroup.id,
            family: slackGroup.id.charAt(0) === 'C' ? 'channels' : 'groups'
          };
        }
      }
    }
  }

  onRocketMessageDelete(rocketMessageDeleted) {
    logger.class.debug('onRocketMessageDelete', rocketMessageDeleted);
    this.postDeleteMessageToSlack(rocketMessageDeleted);
  }

  onRocketSetReaction(rocketMsgID, reaction) {
    logger.class.debug('onRocketSetReaction');

    if (rocketMsgID && reaction) {
      if (this.reactionsMap.delete(`set${rocketMsgID}${reaction}`)) {
        //This was a Slack reaction, we don't need to tell Slack about it
        return;
      }

      const rocketMsg = RocketChat.models.Messages.findOneById(rocketMsgID);

      if (rocketMsg) {
        const slackChannel = this.slackChannelMap[rocketMsg.rid].id;
        const slackTS = this.getSlackTS(rocketMsg);
        this.postReactionAddedToSlack(reaction.replace(/:/g, ''), slackChannel, slackTS);
      }
    }
  }

  onRocketUnSetReaction(rocketMsgID, reaction) {
    logger.class.debug('onRocketUnSetReaction');

    if (rocketMsgID && reaction) {
      if (this.reactionsMap.delete(`unset${rocketMsgID}${reaction}`)) {
        //This was a Slack unset reaction, we don't need to tell Slack about it
        return;
      }

      const rocketMsg = RocketChat.models.Messages.findOneById(rocketMsgID);

      if (rocketMsg) {
        const slackChannel = this.slackChannelMap[rocketMsg.rid].id;
        const slackTS = this.getSlackTS(rocketMsg);
        this.postReactionRemoveToSlack(reaction.replace(/:/g, ''), slackChannel, slackTS);
      }
    }
  }

  onRocketMessage(rocketMessage) {
    logger.class.debug('onRocketMessage', rocketMessage);

    if (rocketMessage.editedAt) {
      //This is an Edit Event
      this.processRocketMessageChanged(rocketMessage);
      return rocketMessage;
    } // Ignore messages originating from Slack


    if (rocketMessage._id.indexOf('slack-') === 0) {
      return rocketMessage;
    } //Probably a new message from Rocket.Chat


    const outSlackChannels = RocketChat.settings.get('SlackBridge_Out_All') ? _.keys(this.slackChannelMap) : _.pluck(RocketChat.settings.get('SlackBridge_Out_Channels'), '_id') || []; //logger.class.debug('Out SlackChannels: ', outSlackChannels);

    if (outSlackChannels.indexOf(rocketMessage.rid) !== -1) {
      this.postMessageToSlack(this.slackChannelMap[rocketMessage.rid], rocketMessage);
    }

    return rocketMessage;
  }
  /*
   https://api.slack.com/methods/reactions.add
   */


  postReactionAddedToSlack(reaction, slackChannel, slackTS) {
    if (reaction && slackChannel && slackTS) {
      const data = {
        token: this.apiToken,
        name: reaction,
        channel: slackChannel,
        timestamp: slackTS
      };
      logger.class.debug('Posting Add Reaction to Slack');
      const postResult = HTTP.post('https://slack.com/api/reactions.add', {
        params: data
      });

      if (postResult.statusCode === 200 && postResult.data && postResult.data.ok === true) {
        logger.class.debug('Reaction added to Slack');
      }
    }
  }
  /*
   https://api.slack.com/methods/reactions.remove
   */


  postReactionRemoveToSlack(reaction, slackChannel, slackTS) {
    if (reaction && slackChannel && slackTS) {
      const data = {
        token: this.apiToken,
        name: reaction,
        channel: slackChannel,
        timestamp: slackTS
      };
      logger.class.debug('Posting Remove Reaction to Slack');
      const postResult = HTTP.post('https://slack.com/api/reactions.remove', {
        params: data
      });

      if (postResult.statusCode === 200 && postResult.data && postResult.data.ok === true) {
        logger.class.debug('Reaction removed from Slack');
      }
    }
  }

  postDeleteMessageToSlack(rocketMessage) {
    if (rocketMessage) {
      const data = {
        token: this.apiToken,
        ts: this.getSlackTS(rocketMessage),
        channel: this.slackChannelMap[rocketMessage.rid].id,
        as_user: true
      };
      logger.class.debug('Post Delete Message to Slack', data);
      const postResult = HTTP.post('https://slack.com/api/chat.delete', {
        params: data
      });

      if (postResult.statusCode === 200 && postResult.data && postResult.data.ok === true) {
        logger.class.debug('Message deleted on Slack');
      }
    }
  }

  postMessageToSlack(slackChannel, rocketMessage) {
    if (slackChannel && slackChannel.id) {
      let iconUrl = getAvatarUrlFromUsername(rocketMessage.u && rocketMessage.u.username);

      if (iconUrl) {
        iconUrl = Meteor.absoluteUrl().replace(/\/$/, '') + iconUrl;
      }

      const data = {
        token: this.apiToken,
        text: rocketMessage.msg,
        channel: slackChannel.id,
        username: rocketMessage.u && rocketMessage.u.username,
        icon_url: iconUrl,
        link_names: 1
      };
      logger.class.debug('Post Message To Slack', data);
      const postResult = HTTP.post('https://slack.com/api/chat.postMessage', {
        params: data
      });

      if (postResult.statusCode === 200 && postResult.data && postResult.data.message && postResult.data.message.bot_id && postResult.data.message.ts) {
        RocketChat.models.Messages.setSlackBotIdAndSlackTs(rocketMessage._id, postResult.data.message.bot_id, postResult.data.message.ts);
        logger.class.debug(`RocketMsgID=${rocketMessage._id} SlackMsgID=${postResult.data.message.ts} SlackBotID=${postResult.data.message.bot_id}`);
      }
    }
  }
  /*
   https://api.slack.com/methods/chat.update
   */


  postMessageUpdateToSlack(slackChannel, rocketMessage) {
    if (slackChannel && slackChannel.id) {
      const data = {
        token: this.apiToken,
        ts: this.getSlackTS(rocketMessage),
        channel: slackChannel.id,
        text: rocketMessage.msg,
        as_user: true
      };
      logger.class.debug('Post UpdateMessage To Slack', data);
      const postResult = HTTP.post('https://slack.com/api/chat.update', {
        params: data
      });

      if (postResult.statusCode === 200 && postResult.data && postResult.data.ok === true) {
        logger.class.debug('Message updated on Slack');
      }
    }
  }

  processRocketMessageChanged(rocketMessage) {
    if (rocketMessage) {
      if (rocketMessage.updatedBySlack) {
        //We have already processed this
        delete rocketMessage.updatedBySlack;
        return;
      } //This was a change from Rocket.Chat


      const slackChannel = this.slackChannelMap[rocketMessage.rid];
      this.postMessageUpdateToSlack(slackChannel, rocketMessage);
    }
  }
  /*
   https://api.slack.com/events/message/message_deleted
   */


  processSlackMessageDeleted(slackMessage) {
    if (slackMessage.previous_message) {
      const rocketChannel = this.getRocketChannel(slackMessage);
      const rocketUser = RocketChat.models.Users.findOneById('rocket.cat', {
        fields: {
          username: 1
        }
      });

      if (rocketChannel && rocketUser) {
        //Find the Rocket message to delete
        let rocketMsgObj = RocketChat.models.Messages.findOneBySlackBotIdAndSlackTs(slackMessage.previous_message.bot_id, slackMessage.previous_message.ts);

        if (!rocketMsgObj) {
          //Must have been a Slack originated msg
          const _id = this.createRocketID(slackMessage.channel, slackMessage.previous_message.ts);

          rocketMsgObj = RocketChat.models.Messages.findOneById(_id);
        }

        if (rocketMsgObj) {
          RocketChat.deleteMessage(rocketMsgObj, rocketUser);
          logger.class.debug('Rocket message deleted by Slack');
        }
      }
    }
  }
  /*
   https://api.slack.com/events/message/message_changed
   */


  processSlackMessageChanged(slackMessage) {
    if (slackMessage.previous_message) {
      const currentMsg = RocketChat.models.Messages.findOneById(this.createRocketID(slackMessage.channel, slackMessage.message.ts)); //Only process this change, if its an actual update (not just Slack repeating back our Rocket original change)

      if (currentMsg && slackMessage.message.text !== currentMsg.msg) {
        const rocketChannel = this.getRocketChannel(slackMessage);
        const rocketUser = slackMessage.previous_message.user ? this.findRocketUser(slackMessage.previous_message.user) || this.addRocketUser(slackMessage.previous_message.user) : null;
        const rocketMsgObj = {
          //@TODO _id
          _id: this.createRocketID(slackMessage.channel, slackMessage.previous_message.ts),
          rid: rocketChannel._id,
          msg: this.convertSlackMsgTxtToRocketTxtFormat(slackMessage.message.text),
          updatedBySlack: true //We don't want to notify slack about this change since Slack initiated it

        };
        RocketChat.updateMessage(rocketMsgObj, rocketUser);
        logger.class.debug('Rocket message updated by Slack');
      }
    }
  }
  /*
   This method will get refactored and broken down into single responsibilities
   */


  processSlackNewMessage(slackMessage, isImporting) {
    const rocketChannel = this.getRocketChannel(slackMessage);
    let rocketUser = null;

    if (slackMessage.subtype === 'bot_message') {
      rocketUser = RocketChat.models.Users.findOneById('rocket.cat', {
        fields: {
          username: 1
        }
      });
    } else {
      rocketUser = slackMessage.user ? this.findRocketUser(slackMessage.user) || this.addRocketUser(slackMessage.user) : null;
    }

    if (rocketChannel && rocketUser) {
      const msgDataDefaults = {
        _id: this.createRocketID(slackMessage.channel, slackMessage.ts),
        ts: new Date(parseInt(slackMessage.ts.split('.')[0]) * 1000)
      };

      if (isImporting) {
        msgDataDefaults['imported'] = 'slackbridge';
      }

      try {
        this.createAndSaveRocketMessage(rocketChannel, rocketUser, slackMessage, msgDataDefaults, isImporting);
      } catch (e) {
        // http://www.mongodb.org/about/contributors/error-codes/
        // 11000 == duplicate key error
        if (e.name === 'MongoError' && e.code === 11000) {
          return;
        }

        throw e;
      }
    }
  }
  /**
   * Retrieves the Slack TS from a Rocket msg that originated from Slack
   * @param rocketMsg
   * @returns Slack TS or undefined if not a message that originated from slack
   * @private
   */


  getSlackTS(rocketMsg) {
    //slack-G3KJGGE15-1483081061-000169
    let slackTS;

    let index = rocketMsg._id.indexOf('slack-');

    if (index === 0) {
      //This is a msg that originated from Slack
      slackTS = rocketMsg._id.substr(6, rocketMsg._id.length);
      index = slackTS.indexOf('-');
      slackTS = slackTS.substr(index + 1, slackTS.length);
      slackTS = slackTS.replace('-', '.');
    } else {
      //This probably originated as a Rocket msg, but has been sent to Slack
      slackTS = rocketMsg.slackTs;
    }

    return slackTS;
  }

  getRocketChannel(slackMessage) {
    return slackMessage.channel ? this.findRocketChannel(slackMessage.channel) || this.addRocketChannel(slackMessage.channel) : null;
  }

  getRocketUser(slackUser) {
    return slackUser ? this.findRocketUser(slackUser) || this.addRocketUser(slackUser) : null;
  }

  createRocketID(slackChannel, ts) {
    return `slack-${slackChannel}-${ts.replace(/\./g, '-')}`;
  }

}

RocketChat.SlackBridge = new SlackBridge();
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"slackbridge_import.server.js":function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// packages/rocketchat_slackbridge/server/slackbridge_import.server.js                                          //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
/* globals msgStream */
function SlackBridgeImport(command, params, item) {
  if (command !== 'slackbridge-import' || !Match.test(params, String)) {
    return;
  }

  const room = RocketChat.models.Rooms.findOneById(item.rid);
  const channel = room.name;
  const user = Meteor.users.findOne(Meteor.userId());
  msgStream.emit(item.rid, {
    _id: Random.id(),
    rid: item.rid,
    u: {
      username: 'rocket.cat'
    },
    ts: new Date(),
    msg: TAPi18n.__('SlackBridge_start', {
      postProcess: 'sprintf',
      sprintf: [user.username, channel]
    }, user.language)
  });

  try {
    RocketChat.SlackBridge.importMessages(item.rid, error => {
      if (error) {
        msgStream.emit(item.rid, {
          _id: Random.id(),
          rid: item.rid,
          u: {
            username: 'rocket.cat'
          },
          ts: new Date(),
          msg: TAPi18n.__('SlackBridge_error', {
            postProcess: 'sprintf',
            sprintf: [channel, error.message]
          }, user.language)
        });
      } else {
        msgStream.emit(item.rid, {
          _id: Random.id(),
          rid: item.rid,
          u: {
            username: 'rocket.cat'
          },
          ts: new Date(),
          msg: TAPi18n.__('SlackBridge_finish', {
            postProcess: 'sprintf',
            sprintf: [channel]
          }, user.language)
        });
      }
    });
  } catch (error) {
    msgStream.emit(item.rid, {
      _id: Random.id(),
      rid: item.rid,
      u: {
        username: 'rocket.cat'
      },
      ts: new Date(),
      msg: TAPi18n.__('SlackBridge_error', {
        postProcess: 'sprintf',
        sprintf: [channel, error.message]
      }, user.language)
    });
    throw error;
  }

  return SlackBridgeImport;
}

RocketChat.slashCommands.add('slackbridge-import', SlackBridgeImport);
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:slackbridge/server/logger.js");
require("/node_modules/meteor/rocketchat:slackbridge/server/settings.js");
require("/node_modules/meteor/rocketchat:slackbridge/server/slackbridge.js");
require("/node_modules/meteor/rocketchat:slackbridge/server/slackbridge_import.server.js");

/* Exports */
Package._define("rocketchat:slackbridge");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_slackbridge.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpzbGFja2JyaWRnZS9zZXJ2ZXIvbG9nZ2VyLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OnNsYWNrYnJpZGdlL3NlcnZlci9zZXR0aW5ncy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpzbGFja2JyaWRnZS9zZXJ2ZXIvc2xhY2ticmlkZ2UuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6c2xhY2ticmlkZ2Uvc2VydmVyL3NsYWNrYnJpZGdlX2ltcG9ydC5zZXJ2ZXIuanMiXSwibmFtZXMiOlsibG9nZ2VyIiwiTG9nZ2VyIiwic2VjdGlvbnMiLCJjb25uZWN0aW9uIiwiZXZlbnRzIiwiY2xhc3MiLCJNZXRlb3IiLCJzdGFydHVwIiwiUm9ja2V0Q2hhdCIsInNldHRpbmdzIiwiYWRkR3JvdXAiLCJhZGQiLCJ0eXBlIiwiaTE4bkxhYmVsIiwicHVibGljIiwiZW5hYmxlUXVlcnkiLCJfaWQiLCJ2YWx1ZSIsImkxOG5EZXNjcmlwdGlvbiIsIl8iLCJtb2R1bGUiLCJ3YXRjaCIsInJlcXVpcmUiLCJkZWZhdWx0IiwidiIsInV0aWwiLCJ1cmwiLCJodHRwIiwiaHR0cHMiLCJTbGFja0JyaWRnZSIsImNvbnN0cnVjdG9yIiwic2xhY2tDbGllbnQiLCJhcGlUb2tlbiIsImdldCIsImFsaWFzRm9ybWF0IiwiZXhjbHVkZUJvdG5hbWVzIiwicnRtIiwiY29ubmVjdGVkIiwidXNlclRhZ3MiLCJzbGFja0NoYW5uZWxNYXAiLCJyZWFjdGlvbnNNYXAiLCJNYXAiLCJrZXkiLCJkaXNjb25uZWN0IiwiY29ubmVjdCIsImluZm8iLCJSdG1DbGllbnQiLCJzdGFydCIsInJlZ2lzdGVyRm9yU2xhY2tFdmVudHMiLCJyZWdpc3RlckZvclJvY2tldEV2ZW50cyIsInVucmVnaXN0ZXJGb3JSb2NrZXRFdmVudHMiLCJwb3B1bGF0ZVNsYWNrQ2hhbm5lbE1hcCIsImVyciIsImVycm9yIiwiY29udmVydFNsYWNrTXNnVHh0VG9Sb2NrZXRUeHRGb3JtYXQiLCJzbGFja01zZ1R4dCIsImlzRW1wdHkiLCJyZXBsYWNlIiwibWF0Y2giLCJ1c2VySWQiLCJmaW5kUm9ja2V0VXNlciIsImFkZFJvY2tldFVzZXIiLCJzbGFjayIsInJvY2tldCIsImZpbmRSb2NrZXRDaGFubmVsIiwic2xhY2tDaGFubmVsSWQiLCJtb2RlbHMiLCJSb29tcyIsImZpbmRPbmVCeUltcG9ydElkIiwiYWRkUm9ja2V0Q2hhbm5lbCIsInNsYWNrQ2hhbm5lbElEIiwiaGFzUmV0cmllZCIsImRlYnVnIiwic2xhY2tSZXN1bHRzIiwiaXNHcm91cCIsImNoYXJBdCIsIkhUVFAiLCJwYXJhbXMiLCJ0b2tlbiIsImNoYW5uZWwiLCJkYXRhIiwib2siLCJyb2NrZXRDaGFubmVsRGF0YSIsImdyb3VwIiwiZXhpc3RpbmdSb2NrZXRSb29tIiwiZmluZE9uZUJ5TmFtZSIsIm5hbWUiLCJpc19nZW5lcmFsIiwicm9ja2V0SWQiLCJhZGRJbXBvcnRJZHMiLCJpZCIsInJvY2tldFVzZXJzIiwibWVtYmVyIiwibWVtYmVycyIsImNyZWF0b3IiLCJyb2NrZXRVc2VyIiwidXNlcm5hbWUiLCJwdXNoIiwicm9ja2V0VXNlckNyZWF0b3IiLCJyb2NrZXRDaGFubmVsIiwiY3JlYXRlUm9vbSIsInJpZCIsImUiLCJtZXNzYWdlIiwiX3NsZWVwRm9yTXMiLCJjb25zb2xlIiwibG9nIiwicm9vbVVwZGF0ZSIsInRzIiwiRGF0ZSIsImNyZWF0ZWQiLCJsYXN0U2V0VG9waWMiLCJ0b3BpYyIsImxhc3Rfc2V0IiwicHVycG9zZSIsImZhbWlseSIsImZpbmRPbmVCeUlkIiwic2xhY2tVc2VySUQiLCJVc2VycyIsInVzZXIiLCJyb2NrZXRVc2VyRGF0YSIsImlzQm90IiwiaXNfYm90IiwiZW1haWwiLCJwcm9maWxlIiwiZXhpc3RpbmdSb2NrZXRVc2VyIiwiZmluZE9uZUJ5RW1haWxBZGRyZXNzIiwiZmluZE9uZUJ5VXNlcm5hbWUiLCJuZXdVc2VyIiwicGFzc3dvcmQiLCJSYW5kb20iLCJqb2luRGVmYXVsdENoYW5uZWxzIiwiQWNjb3VudHMiLCJjcmVhdGVVc2VyIiwidXNlclVwZGF0ZSIsInV0Y09mZnNldCIsInR6X29mZnNldCIsInJvbGVzIiwicmVhbF9uYW1lIiwiZGVsZXRlZCIsInVwZGF0ZSIsIiRzZXQiLCJpbWFnZV9vcmlnaW5hbCIsImltYWdlXzUxMiIsInNldFVzZXJBdmF0YXIiLCJpbXBvcnRJZHMiLCJib3RfaWQiLCJhZGRBbGlhc1RvUm9ja2V0TXNnIiwicm9ja2V0VXNlck5hbWUiLCJyb2NrZXRNc2dPYmoiLCJhbGlhcyIsImZvcm1hdCIsImNyZWF0ZUFuZFNhdmVSb2NrZXRNZXNzYWdlIiwic2xhY2tNZXNzYWdlIiwicm9ja2V0TXNnRGF0YURlZmF1bHRzIiwiaXNJbXBvcnRpbmciLCJzdWJ0eXBlIiwicHJvY2Vzc1NsYWNrU3VidHlwZWRNZXNzYWdlIiwibXNnIiwidGV4dCIsInUiLCJleHRlbmQiLCJlZGl0ZWQiLCJlZGl0ZWRBdCIsInBhcnNlSW50Iiwic3BsaXQiLCJmaWVsZHMiLCJwaW5uZWRfdG8iLCJpbmRleE9mIiwicGlubmVkIiwicGlubmVkQXQiLCJub3ciLCJwaW5uZWRCeSIsInBpY2siLCJzZXRUaW1lb3V0IiwiTWVzc2FnZXMiLCJmaW5kT25lQnlTbGFja0JvdElkQW5kU2xhY2tUcyIsInNlbmRNZXNzYWdlIiwib25TbGFja1JlYWN0aW9uUmVtb3ZlZCIsInNsYWNrUmVhY3Rpb25Nc2ciLCJnZXRSb2NrZXRVc2VyIiwicm9ja2V0TXNnIiwiZmluZE9uZUJ5U2xhY2tUcyIsIml0ZW0iLCJyb2NrZXRJRCIsImNyZWF0ZVJvY2tldElEIiwicm9ja2V0UmVhY3Rpb24iLCJyZWFjdGlvbiIsInJlYWN0aW9ucyIsInRoZVJlYWN0aW9uIiwidXNlcm5hbWVzIiwic2V0IiwicnVuQXNVc2VyIiwiY2FsbCIsIm9uU2xhY2tSZWFjdGlvbkFkZGVkIiwiaW5jbHVkZXMiLCJvblNsYWNrTWVzc2FnZSIsInByb2Nlc3NTbGFja01lc3NhZ2VEZWxldGVkIiwicHJvY2Vzc1NsYWNrTWVzc2FnZUNoYW5nZWQiLCJwcm9jZXNzU2xhY2tOZXdNZXNzYWdlIiwidW5kZWZpbmVkIiwiYm90IiwiYXR0YWNobWVudHMiLCJpY29ucyIsImVtb2ppIiwiY3JlYXRlVXNlckpvaW5XaXRoUm9vbUlkQW5kVXNlciIsImltcG9ydGVkIiwiYWRkVXNlclRvUm9vbSIsImludml0ZXIiLCJjcmVhdGVVc2VyQWRkZWRXaXRoUm9vbUlkQW5kVXNlciIsImNyZWF0ZVVzZXJMZWF2ZVdpdGhSb29tSWRBbmRVc2VyIiwicmVtb3ZlVXNlckZyb21Sb29tIiwiY3JlYXRlUm9vbVNldHRpbmdzQ2hhbmdlZFdpdGhUeXBlUm9vbUlkTWVzc2FnZUFuZFVzZXIiLCJzYXZlUm9vbVRvcGljIiwiY3JlYXRlUm9vbVJlbmFtZWRXaXRoUm9vbUlkUm9vbU5hbWVBbmRVc2VyIiwic2F2ZVJvb21OYW1lIiwiYXJjaGl2ZVJvb20iLCJ1bmFyY2hpdmVSb29tIiwiZmlsZSIsInVybF9wcml2YXRlX2Rvd25sb2FkIiwiZGV0YWlscyIsIm1lc3NhZ2VfaWQiLCJzaXplIiwibWltZXR5cGUiLCJ1cGxvYWRGaWxlRnJvbVNsYWNrIiwidCIsImF1dGhvcl9zdWJuYW1lIiwiZ2V0QXZhdGFyVXJsRnJvbVVzZXJuYW1lIiwic2V0UGlubmVkQnlJZEFuZFVzZXJJZCIsImNoYW5uZWxfaWQiLCJzbGFja0ZpbGVVUkwiLCJ0aW1lU3RhbXAiLCJyZXF1ZXN0TW9kdWxlIiwidGVzdCIsInBhcnNlZFVybCIsInBhcnNlIiwiaGVhZGVycyIsImJpbmRFbnZpcm9ubWVudCIsInN0cmVhbSIsImZpbGVTdG9yZSIsIkZpbGVVcGxvYWQiLCJnZXRTdG9yZSIsImluc2VydCIsIkVycm9yIiwiYWJzb2x1dGVVcmwiLCJhdHRhY2htZW50IiwidGl0bGUiLCJ0aXRsZV9saW5rIiwiaW1hZ2VfdXJsIiwiaW1hZ2VfdHlwZSIsImltYWdlX3NpemUiLCJpbWFnZV9kaW1lbnNpb25zIiwiaWRlbnRpZnkiLCJhdWRpb191cmwiLCJhdWRpb190eXBlIiwiYXVkaW9fc2l6ZSIsInZpZGVvX3VybCIsInZpZGVvX3R5cGUiLCJ2aWRlb19zaXplIiwiZ3JvdXBhYmxlIiwiY2FsbGJhY2tzIiwib25Sb2NrZXRNZXNzYWdlIiwiYmluZCIsInByaW9yaXR5IiwiTE9XIiwib25Sb2NrZXRNZXNzYWdlRGVsZXRlIiwib25Sb2NrZXRTZXRSZWFjdGlvbiIsIm9uUm9ja2V0VW5TZXRSZWFjdGlvbiIsInJlbW92ZSIsIkNMSUVOVF9FVkVOVFMiLCJvbiIsIlJUTSIsIkFVVEhFTlRJQ0FURUQiLCJVTkFCTEVfVE9fUlRNX1NUQVJUIiwiRElTQ09OTkVDVCIsIlJUTV9FVkVOVFMiLCJNRVNTQUdFIiwiUkVBQ1RJT05fQURERUQiLCJyZWFjdGlvbk1zZyIsIlJFQUNUSU9OX1JFTU9WRUQiLCJDSEFOTkVMX0NSRUFURUQiLCJDSEFOTkVMX0pPSU5FRCIsIkNIQU5ORUxfTEVGVCIsIkNIQU5ORUxfREVMRVRFRCIsIkNIQU5ORUxfUkVOQU1FIiwiR1JPVVBfSk9JTkVEIiwiR1JPVVBfTEVGVCIsIkdST1VQX1JFTkFNRSIsIlRFQU1fSk9JTiIsImZpbmRTbGFja0NoYW5uZWwiLCJyb2NrZXRDaGFubmVsTmFtZSIsInJlc3BvbnNlIiwiaXNBcnJheSIsImNoYW5uZWxzIiwibGVuZ3RoIiwiaXNfbWVtYmVyIiwiZ3JvdXBzIiwiaW1wb3J0RnJvbUhpc3RvcnkiLCJvcHRpb25zIiwibWVzc2FnZXMiLCJsYXRlc3QiLCJyZXZlcnNlIiwiaGFzX21vcmUiLCJjb3B5U2xhY2tDaGFubmVsSW5mbyIsImNoYW5uZWxNYXAiLCJ0b3BpY19sYXN0X3NldCIsInRvcGljX2NyZWF0b3IiLCJjb3B5UGlucyIsIml0ZW1zIiwicGluIiwibXNnT2JqIiwiaW1wb3J0TWVzc2FnZXMiLCJjYWxsYmFjayIsInJvY2tldGNoYXRfcm9vbSIsInJlc3VsdHMiLCJvbGRlc3QiLCJzbGFja19yb29tIiwic2xhY2tDaGFubmVsIiwic2xhY2tHcm91cCIsInJvY2tldE1lc3NhZ2VEZWxldGVkIiwicG9zdERlbGV0ZU1lc3NhZ2VUb1NsYWNrIiwicm9ja2V0TXNnSUQiLCJkZWxldGUiLCJzbGFja1RTIiwiZ2V0U2xhY2tUUyIsInBvc3RSZWFjdGlvbkFkZGVkVG9TbGFjayIsInBvc3RSZWFjdGlvblJlbW92ZVRvU2xhY2siLCJyb2NrZXRNZXNzYWdlIiwicHJvY2Vzc1JvY2tldE1lc3NhZ2VDaGFuZ2VkIiwib3V0U2xhY2tDaGFubmVscyIsImtleXMiLCJwbHVjayIsInBvc3RNZXNzYWdlVG9TbGFjayIsInRpbWVzdGFtcCIsInBvc3RSZXN1bHQiLCJwb3N0Iiwic3RhdHVzQ29kZSIsImFzX3VzZXIiLCJpY29uVXJsIiwiaWNvbl91cmwiLCJsaW5rX25hbWVzIiwic2V0U2xhY2tCb3RJZEFuZFNsYWNrVHMiLCJwb3N0TWVzc2FnZVVwZGF0ZVRvU2xhY2siLCJ1cGRhdGVkQnlTbGFjayIsInByZXZpb3VzX21lc3NhZ2UiLCJnZXRSb2NrZXRDaGFubmVsIiwiZGVsZXRlTWVzc2FnZSIsImN1cnJlbnRNc2ciLCJ1cGRhdGVNZXNzYWdlIiwibXNnRGF0YURlZmF1bHRzIiwiY29kZSIsImluZGV4Iiwic3Vic3RyIiwic2xhY2tUcyIsInNsYWNrVXNlciIsIlNsYWNrQnJpZGdlSW1wb3J0IiwiY29tbWFuZCIsIk1hdGNoIiwiU3RyaW5nIiwicm9vbSIsInVzZXJzIiwiZmluZE9uZSIsIm1zZ1N0cmVhbSIsImVtaXQiLCJUQVBpMThuIiwiX18iLCJwb3N0UHJvY2VzcyIsInNwcmludGYiLCJsYW5ndWFnZSIsInNsYXNoQ29tbWFuZHMiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTs7QUFDQTtBQUVBQSxTQUFTLElBQUlDLE1BQUosQ0FBVyxhQUFYLEVBQTBCO0FBQ2xDQyxZQUFVO0FBQ1RDLGdCQUFZLFlBREg7QUFFVEMsWUFBUSxRQUZDO0FBR1RDLFdBQU87QUFIRTtBQUR3QixDQUExQixDQUFU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dGVudCI6WyIvKiBnbG9iYWxzIGxvZ2dlcjp0cnVlICovXG4vKiBleHBvcnRlZCBsb2dnZXIgKi9cblxubG9nZ2VyID0gbmV3IExvZ2dlcignU2xhY2tCcmlkZ2UnLCB7XG5cdHNlY3Rpb25zOiB7XG5cdFx0Y29ubmVjdGlvbjogJ0Nvbm5lY3Rpb24nLFxuXHRcdGV2ZW50czogJ0V2ZW50cycsXG5cdFx0Y2xhc3M6ICdDbGFzcydcblx0fVxufSk7XG4iLCJNZXRlb3Iuc3RhcnR1cChmdW5jdGlvbigpIHtcblx0Um9ja2V0Q2hhdC5zZXR0aW5ncy5hZGRHcm91cCgnU2xhY2tCcmlkZ2UnLCBmdW5jdGlvbigpIHtcblx0XHR0aGlzLmFkZCgnU2xhY2tCcmlkZ2VfRW5hYmxlZCcsIGZhbHNlLCB7XG5cdFx0XHR0eXBlOiAnYm9vbGVhbicsXG5cdFx0XHRpMThuTGFiZWw6ICdFbmFibGVkJyxcblx0XHRcdHB1YmxpYzogdHJ1ZVxuXHRcdH0pO1xuXG5cdFx0dGhpcy5hZGQoJ1NsYWNrQnJpZGdlX0FQSVRva2VuJywgJycsIHtcblx0XHRcdHR5cGU6ICdzdHJpbmcnLFxuXHRcdFx0ZW5hYmxlUXVlcnk6IHtcblx0XHRcdFx0X2lkOiAnU2xhY2tCcmlkZ2VfRW5hYmxlZCcsXG5cdFx0XHRcdHZhbHVlOiB0cnVlXG5cdFx0XHR9LFxuXHRcdFx0aTE4bkxhYmVsOiAnQVBJX1Rva2VuJ1xuXHRcdH0pO1xuXG5cdFx0dGhpcy5hZGQoJ1NsYWNrQnJpZGdlX0FsaWFzRm9ybWF0JywgJycsIHtcblx0XHRcdHR5cGU6ICdzdHJpbmcnLFxuXHRcdFx0ZW5hYmxlUXVlcnk6IHtcblx0XHRcdFx0X2lkOiAnU2xhY2tCcmlkZ2VfRW5hYmxlZCcsXG5cdFx0XHRcdHZhbHVlOiB0cnVlXG5cdFx0XHR9LFxuXHRcdFx0aTE4bkxhYmVsOiAnQWxpYXNfRm9ybWF0Jyxcblx0XHRcdGkxOG5EZXNjcmlwdGlvbjogJ0FsaWFzX0Zvcm1hdF9EZXNjcmlwdGlvbidcblx0XHR9KTtcblxuXHRcdHRoaXMuYWRkKCdTbGFja0JyaWRnZV9FeGNsdWRlQm90bmFtZXMnLCAnJywge1xuXHRcdFx0dHlwZTogJ3N0cmluZycsXG5cdFx0XHRlbmFibGVRdWVyeToge1xuXHRcdFx0XHRfaWQ6ICdTbGFja0JyaWRnZV9FbmFibGVkJyxcblx0XHRcdFx0dmFsdWU6IHRydWVcblx0XHRcdH0sXG5cdFx0XHRpMThuTGFiZWw6ICdFeGNsdWRlX0JvdG5hbWVzJyxcblx0XHRcdGkxOG5EZXNjcmlwdGlvbjogJ0V4Y2x1ZGVfQm90bmFtZXNfRGVzY3JpcHRpb24nXG5cdFx0fSk7XG5cblx0XHR0aGlzLmFkZCgnU2xhY2tCcmlkZ2VfT3V0X0VuYWJsZWQnLCBmYWxzZSwge1xuXHRcdFx0dHlwZTogJ2Jvb2xlYW4nLFxuXHRcdFx0ZW5hYmxlUXVlcnk6IHtcblx0XHRcdFx0X2lkOiAnU2xhY2tCcmlkZ2VfRW5hYmxlZCcsXG5cdFx0XHRcdHZhbHVlOiB0cnVlXG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHR0aGlzLmFkZCgnU2xhY2tCcmlkZ2VfT3V0X0FsbCcsIGZhbHNlLCB7XG5cdFx0XHR0eXBlOiAnYm9vbGVhbicsXG5cdFx0XHRlbmFibGVRdWVyeTogW3tcblx0XHRcdFx0X2lkOiAnU2xhY2tCcmlkZ2VfRW5hYmxlZCcsXG5cdFx0XHRcdHZhbHVlOiB0cnVlXG5cdFx0XHR9LCB7XG5cdFx0XHRcdF9pZDogJ1NsYWNrQnJpZGdlX091dF9FbmFibGVkJyxcblx0XHRcdFx0dmFsdWU6IHRydWVcblx0XHRcdH1dXG5cdFx0fSk7XG5cblx0XHR0aGlzLmFkZCgnU2xhY2tCcmlkZ2VfT3V0X0NoYW5uZWxzJywgJycsIHtcblx0XHRcdHR5cGU6ICdyb29tUGljaycsXG5cdFx0XHRlbmFibGVRdWVyeTogW3tcblx0XHRcdFx0X2lkOiAnU2xhY2tCcmlkZ2VfRW5hYmxlZCcsXG5cdFx0XHRcdHZhbHVlOiB0cnVlXG5cdFx0XHR9LCB7XG5cdFx0XHRcdF9pZDogJ1NsYWNrQnJpZGdlX091dF9FbmFibGVkJyxcblx0XHRcdFx0dmFsdWU6IHRydWVcblx0XHRcdH0sIHtcblx0XHRcdFx0X2lkOiAnU2xhY2tCcmlkZ2VfT3V0X0FsbCcsXG5cdFx0XHRcdHZhbHVlOiBmYWxzZVxuXHRcdFx0fV1cblx0XHR9KTtcblx0fSk7XG59KTtcbiIsIi8qIGdsb2JhbHMgbG9nZ2VyICovXG5pbXBvcnQgXyBmcm9tICd1bmRlcnNjb3JlJztcbmltcG9ydCB1dGlsIGZyb20gJ3V0aWwnO1xuaW1wb3J0IHVybCBmcm9tICd1cmwnO1xuaW1wb3J0IGh0dHAgZnJvbSAnaHR0cCc7XG5pbXBvcnQgaHR0cHMgZnJvbSAnaHR0cHMnO1xuXG5jbGFzcyBTbGFja0JyaWRnZSB7XG5cblx0Y29uc3RydWN0b3IoKSB7XG5cdFx0dGhpcy51dGlsID0gdXRpbDtcblx0XHR0aGlzLnNsYWNrQ2xpZW50ID0gcmVxdWlyZSgnQHNsYWNrL2NsaWVudCcpO1xuXHRcdHRoaXMuYXBpVG9rZW4gPSBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnU2xhY2tCcmlkZ2VfQVBJVG9rZW4nKTtcblx0XHR0aGlzLmFsaWFzRm9ybWF0ID0gUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ1NsYWNrQnJpZGdlX0FsaWFzRm9ybWF0Jyk7XG5cdFx0dGhpcy5leGNsdWRlQm90bmFtZXMgPSBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnU2xhY2tCcmlkZ2VfQm90bmFtZXMnKTtcblx0XHR0aGlzLnJ0bSA9IHt9O1xuXHRcdHRoaXMuY29ubmVjdGVkID0gZmFsc2U7XG5cdFx0dGhpcy51c2VyVGFncyA9IHt9O1xuXHRcdHRoaXMuc2xhY2tDaGFubmVsTWFwID0ge307XG5cdFx0dGhpcy5yZWFjdGlvbnNNYXAgPSBuZXcgTWFwKCk7XG5cblx0XHRSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnU2xhY2tCcmlkZ2VfQVBJVG9rZW4nLCAoa2V5LCB2YWx1ZSkgPT4ge1xuXHRcdFx0aWYgKHZhbHVlICE9PSB0aGlzLmFwaVRva2VuKSB7XG5cdFx0XHRcdHRoaXMuYXBpVG9rZW4gPSB2YWx1ZTtcblx0XHRcdFx0aWYgKHRoaXMuY29ubmVjdGVkKSB7XG5cdFx0XHRcdFx0dGhpcy5kaXNjb25uZWN0KCk7XG5cdFx0XHRcdFx0dGhpcy5jb25uZWN0KCk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdTbGFja0JyaWRnZV9BbGlhc0Zvcm1hdCcsIChrZXksIHZhbHVlKSA9PiB7XG5cdFx0XHR0aGlzLmFsaWFzRm9ybWF0ID0gdmFsdWU7XG5cdFx0fSk7XG5cblx0XHRSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnU2xhY2tCcmlkZ2VfRXhjbHVkZUJvdG5hbWVzJywgKGtleSwgdmFsdWUpID0+IHtcblx0XHRcdHRoaXMuZXhjbHVkZUJvdG5hbWVzID0gdmFsdWU7XG5cdFx0fSk7XG5cblx0XHRSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnU2xhY2tCcmlkZ2VfRW5hYmxlZCcsIChrZXksIHZhbHVlKSA9PiB7XG5cdFx0XHRpZiAodmFsdWUgJiYgdGhpcy5hcGlUb2tlbikge1xuXHRcdFx0XHR0aGlzLmNvbm5lY3QoKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHRoaXMuZGlzY29ubmVjdCgpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHR9XG5cblx0Y29ubmVjdCgpIHtcblx0XHRpZiAodGhpcy5jb25uZWN0ZWQgPT09IGZhbHNlKSB7XG5cdFx0XHR0aGlzLmNvbm5lY3RlZCA9IHRydWU7XG5cdFx0XHRsb2dnZXIuY29ubmVjdGlvbi5pbmZvKCdDb25uZWN0aW5nIHZpYSB0b2tlbjogJywgdGhpcy5hcGlUb2tlbik7XG5cdFx0XHRjb25zdCBSdG1DbGllbnQgPSB0aGlzLnNsYWNrQ2xpZW50LlJ0bUNsaWVudDtcblx0XHRcdHRoaXMucnRtID0gbmV3IFJ0bUNsaWVudCh0aGlzLmFwaVRva2VuKTtcblx0XHRcdHRoaXMucnRtLnN0YXJ0KCk7XG5cdFx0XHR0aGlzLnJlZ2lzdGVyRm9yU2xhY2tFdmVudHMoKTtcblx0XHRcdFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdTbGFja0JyaWRnZV9PdXRfRW5hYmxlZCcsIChrZXksIHZhbHVlKSA9PiB7XG5cdFx0XHRcdGlmICh2YWx1ZSkge1xuXHRcdFx0XHRcdHRoaXMucmVnaXN0ZXJGb3JSb2NrZXRFdmVudHMoKTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHR0aGlzLnVucmVnaXN0ZXJGb3JSb2NrZXRFdmVudHMoKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0XHRNZXRlb3Iuc3RhcnR1cCgoKSA9PiB7XG5cdFx0XHRcdHRyeSB7XG5cdFx0XHRcdFx0dGhpcy5wb3B1bGF0ZVNsYWNrQ2hhbm5lbE1hcCgpOyAvLyBJZiBydW4gb3V0c2lkZSBvZiBNZXRlb3Iuc3RhcnR1cCwgSFRUUCBpcyBub3QgZGVmaW5lZFxuXHRcdFx0XHR9IGNhdGNoIChlcnIpIHtcblx0XHRcdFx0XHRsb2dnZXIuY2xhc3MuZXJyb3IoJ0Vycm9yIGF0dGVtcHRpbmcgdG8gY29ubmVjdCB0byBTbGFjaycsIGVycik7XG5cdFx0XHRcdFx0dGhpcy5kaXNjb25uZWN0KCk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdH1cblx0fVxuXG5cdGRpc2Nvbm5lY3QoKSB7XG5cdFx0aWYgKHRoaXMuY29ubmVjdGVkID09PSB0cnVlKSB7XG5cdFx0XHR0aGlzLmNvbm5lY3RlZCA9IGZhbHNlO1xuXHRcdFx0dGhpcy5ydG0uZGlzY29ubmVjdCAmJiB0aGlzLnJ0bS5kaXNjb25uZWN0KCk7XG5cdFx0XHRsb2dnZXIuY29ubmVjdGlvbi5pbmZvKCdEaXNjb25uZWN0ZWQnKTtcblx0XHRcdHRoaXMudW5yZWdpc3RlckZvclJvY2tldEV2ZW50cygpO1xuXHRcdH1cblx0fVxuXG5cdGNvbnZlcnRTbGFja01zZ1R4dFRvUm9ja2V0VHh0Rm9ybWF0KHNsYWNrTXNnVHh0KSB7XG5cdFx0aWYgKCFfLmlzRW1wdHkoc2xhY2tNc2dUeHQpKSB7XG5cdFx0XHRzbGFja01zZ1R4dCA9IHNsYWNrTXNnVHh0LnJlcGxhY2UoLzwhZXZlcnlvbmU+L2csICdAYWxsJyk7XG5cdFx0XHRzbGFja01zZ1R4dCA9IHNsYWNrTXNnVHh0LnJlcGxhY2UoLzwhY2hhbm5lbD4vZywgJ0BhbGwnKTtcblx0XHRcdHNsYWNrTXNnVHh0ID0gc2xhY2tNc2dUeHQucmVwbGFjZSgvPCFoZXJlPi9nLCAnQGhlcmUnKTtcblx0XHRcdHNsYWNrTXNnVHh0ID0gc2xhY2tNc2dUeHQucmVwbGFjZSgvJmd0Oy9nLCAnPicpO1xuXHRcdFx0c2xhY2tNc2dUeHQgPSBzbGFja01zZ1R4dC5yZXBsYWNlKC8mbHQ7L2csICc8Jyk7XG5cdFx0XHRzbGFja01zZ1R4dCA9IHNsYWNrTXNnVHh0LnJlcGxhY2UoLyZhbXA7L2csICcmJyk7XG5cdFx0XHRzbGFja01zZ1R4dCA9IHNsYWNrTXNnVHh0LnJlcGxhY2UoLzpzaW1wbGVfc21pbGU6L2csICc6c21pbGU6Jyk7XG5cdFx0XHRzbGFja01zZ1R4dCA9IHNsYWNrTXNnVHh0LnJlcGxhY2UoLzptZW1vOi9nLCAnOnBlbmNpbDonKTtcblx0XHRcdHNsYWNrTXNnVHh0ID0gc2xhY2tNc2dUeHQucmVwbGFjZSgvOnBpZ2d5Oi9nLCAnOnBpZzonKTtcblx0XHRcdHNsYWNrTXNnVHh0ID0gc2xhY2tNc2dUeHQucmVwbGFjZSgvOnVrOi9nLCAnOmdiOicpO1xuXHRcdFx0c2xhY2tNc2dUeHQgPSBzbGFja01zZ1R4dC5yZXBsYWNlKC88KGh0dHBbc10/OltePl0qKT4vZywgJyQxJyk7XG5cblx0XHRcdHNsYWNrTXNnVHh0LnJlcGxhY2UoLyg/OjxAKShbYS16QS1aMC05XSspKD86XFx8LispPyg/Oj4pL2csIChtYXRjaCwgdXNlcklkKSA9PiB7XG5cdFx0XHRcdGlmICghdGhpcy51c2VyVGFnc1t1c2VySWRdKSB7XG5cdFx0XHRcdFx0dGhpcy5maW5kUm9ja2V0VXNlcih1c2VySWQpIHx8IHRoaXMuYWRkUm9ja2V0VXNlcih1c2VySWQpOyAvLyBUaGlzIGFkZHMgdXNlclRhZ3MgZm9yIHRoZSB1c2VySWRcblx0XHRcdFx0fVxuXHRcdFx0XHRjb25zdCB1c2VyVGFncyA9IHRoaXMudXNlclRhZ3NbdXNlcklkXTtcblx0XHRcdFx0aWYgKHVzZXJUYWdzKSB7XG5cdFx0XHRcdFx0c2xhY2tNc2dUeHQgPSBzbGFja01zZ1R4dC5yZXBsYWNlKHVzZXJUYWdzLnNsYWNrLCB1c2VyVGFncy5yb2NrZXQpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0c2xhY2tNc2dUeHQgPSAnJztcblx0XHR9XG5cdFx0cmV0dXJuIHNsYWNrTXNnVHh0O1xuXHR9XG5cblx0ZmluZFJvY2tldENoYW5uZWwoc2xhY2tDaGFubmVsSWQpIHtcblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9uZUJ5SW1wb3J0SWQoc2xhY2tDaGFubmVsSWQpO1xuXHR9XG5cblx0YWRkUm9ja2V0Q2hhbm5lbChzbGFja0NoYW5uZWxJRCwgaGFzUmV0cmllZCA9IGZhbHNlKSB7XG5cdFx0bG9nZ2VyLmNsYXNzLmRlYnVnKCdBZGRpbmcgUm9ja2V0LkNoYXQgY2hhbm5lbCBmcm9tIFNsYWNrJywgc2xhY2tDaGFubmVsSUQpO1xuXHRcdGxldCBzbGFja1Jlc3VsdHMgPSBudWxsO1xuXHRcdGxldCBpc0dyb3VwID0gZmFsc2U7XG5cdFx0aWYgKHNsYWNrQ2hhbm5lbElELmNoYXJBdCgwKSA9PT0gJ0MnKSB7XG5cdFx0XHRzbGFja1Jlc3VsdHMgPSBIVFRQLmdldCgnaHR0cHM6Ly9zbGFjay5jb20vYXBpL2NoYW5uZWxzLmluZm8nLCB7IHBhcmFtczogeyB0b2tlbjogdGhpcy5hcGlUb2tlbiwgY2hhbm5lbDogc2xhY2tDaGFubmVsSUQgfSB9KTtcblx0XHR9IGVsc2UgaWYgKHNsYWNrQ2hhbm5lbElELmNoYXJBdCgwKSA9PT0gJ0cnKSB7XG5cdFx0XHRzbGFja1Jlc3VsdHMgPSBIVFRQLmdldCgnaHR0cHM6Ly9zbGFjay5jb20vYXBpL2dyb3Vwcy5pbmZvJywgeyBwYXJhbXM6IHsgdG9rZW46IHRoaXMuYXBpVG9rZW4sIGNoYW5uZWw6IHNsYWNrQ2hhbm5lbElEIH0gfSk7XG5cdFx0XHRpc0dyb3VwID0gdHJ1ZTtcblx0XHR9XG5cdFx0aWYgKHNsYWNrUmVzdWx0cyAmJiBzbGFja1Jlc3VsdHMuZGF0YSAmJiBzbGFja1Jlc3VsdHMuZGF0YS5vayA9PT0gdHJ1ZSkge1xuXHRcdFx0Y29uc3Qgcm9ja2V0Q2hhbm5lbERhdGEgPSBpc0dyb3VwID8gc2xhY2tSZXN1bHRzLmRhdGEuZ3JvdXAgOiBzbGFja1Jlc3VsdHMuZGF0YS5jaGFubmVsO1xuXHRcdFx0Y29uc3QgZXhpc3RpbmdSb2NrZXRSb29tID0gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9uZUJ5TmFtZShyb2NrZXRDaGFubmVsRGF0YS5uYW1lKTtcblxuXHRcdFx0Ly8gSWYgdGhlIHJvb20gZXhpc3RzLCBtYWtlIHN1cmUgd2UgaGF2ZSBpdHMgaWQgaW4gaW1wb3J0SWRzXG5cdFx0XHRpZiAoZXhpc3RpbmdSb2NrZXRSb29tIHx8IHJvY2tldENoYW5uZWxEYXRhLmlzX2dlbmVyYWwpIHtcblx0XHRcdFx0cm9ja2V0Q2hhbm5lbERhdGEucm9ja2V0SWQgPSByb2NrZXRDaGFubmVsRGF0YS5pc19nZW5lcmFsID8gJ0dFTkVSQUwnIDogZXhpc3RpbmdSb2NrZXRSb29tLl9pZDtcblx0XHRcdFx0Um9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuYWRkSW1wb3J0SWRzKHJvY2tldENoYW5uZWxEYXRhLnJvY2tldElkLCByb2NrZXRDaGFubmVsRGF0YS5pZCk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRjb25zdCByb2NrZXRVc2VycyA9IFtdO1xuXHRcdFx0XHRmb3IgKGNvbnN0IG1lbWJlciBvZiByb2NrZXRDaGFubmVsRGF0YS5tZW1iZXJzKSB7XG5cdFx0XHRcdFx0aWYgKG1lbWJlciAhPT0gcm9ja2V0Q2hhbm5lbERhdGEuY3JlYXRvcikge1xuXHRcdFx0XHRcdFx0Y29uc3Qgcm9ja2V0VXNlciA9IHRoaXMuZmluZFJvY2tldFVzZXIobWVtYmVyKSB8fCB0aGlzLmFkZFJvY2tldFVzZXIobWVtYmVyKTtcblx0XHRcdFx0XHRcdGlmIChyb2NrZXRVc2VyICYmIHJvY2tldFVzZXIudXNlcm5hbWUpIHtcblx0XHRcdFx0XHRcdFx0cm9ja2V0VXNlcnMucHVzaChyb2NrZXRVc2VyLnVzZXJuYW1lKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdFx0Y29uc3Qgcm9ja2V0VXNlckNyZWF0b3IgPSByb2NrZXRDaGFubmVsRGF0YS5jcmVhdG9yID8gdGhpcy5maW5kUm9ja2V0VXNlcihyb2NrZXRDaGFubmVsRGF0YS5jcmVhdG9yKSB8fCB0aGlzLmFkZFJvY2tldFVzZXIocm9ja2V0Q2hhbm5lbERhdGEuY3JlYXRvcikgOiBudWxsO1xuXHRcdFx0XHRpZiAoIXJvY2tldFVzZXJDcmVhdG9yKSB7XG5cdFx0XHRcdFx0bG9nZ2VyLmNsYXNzLmVycm9yKCdDb3VsZCBub3QgZmV0Y2ggcm9vbSBjcmVhdG9yIGluZm9ybWF0aW9uJywgcm9ja2V0Q2hhbm5lbERhdGEuY3JlYXRvcik7XG5cdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0XHRjb25zdCByb2NrZXRDaGFubmVsID0gUm9ja2V0Q2hhdC5jcmVhdGVSb29tKGlzR3JvdXAgPyAncCcgOiAnYycsIHJvY2tldENoYW5uZWxEYXRhLm5hbWUsIHJvY2tldFVzZXJDcmVhdG9yLnVzZXJuYW1lLCByb2NrZXRVc2Vycyk7XG5cdFx0XHRcdFx0cm9ja2V0Q2hhbm5lbERhdGEucm9ja2V0SWQgPSByb2NrZXRDaGFubmVsLnJpZDtcblx0XHRcdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0XHRcdGlmICghaGFzUmV0cmllZCkge1xuXHRcdFx0XHRcdFx0bG9nZ2VyLmNsYXNzLmRlYnVnKCdFcnJvciBhZGRpbmcgY2hhbm5lbCBmcm9tIFNsYWNrLiBXaWxsIHJldHJ5IGluIDFzLicsIGUubWVzc2FnZSk7XG5cdFx0XHRcdFx0XHQvLyBJZiBmaXJzdCB0aW1lIHRyeWluZyB0byBjcmVhdGUgY2hhbm5lbCBmYWlscywgY291bGQgYmUgYmVjYXVzZSBvZiBtdWx0aXBsZSBtZXNzYWdlcyByZWNlaXZlZCBhdCB0aGUgc2FtZSB0aW1lLiBUcnkgYWdhaW4gb25jZSBhZnRlciAxcy5cblx0XHRcdFx0XHRcdE1ldGVvci5fc2xlZXBGb3JNcygxMDAwKTtcblx0XHRcdFx0XHRcdHJldHVybiB0aGlzLmZpbmRSb2NrZXRDaGFubmVsKHNsYWNrQ2hhbm5lbElEKSB8fCB0aGlzLmFkZFJvY2tldENoYW5uZWwoc2xhY2tDaGFubmVsSUQsIHRydWUpO1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRjb25zb2xlLmxvZyhlLm1lc3NhZ2UpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXG5cdFx0XHRcdGNvbnN0IHJvb21VcGRhdGUgPSB7XG5cdFx0XHRcdFx0dHM6IG5ldyBEYXRlKHJvY2tldENoYW5uZWxEYXRhLmNyZWF0ZWQgKiAxMDAwKVxuXHRcdFx0XHR9O1xuXHRcdFx0XHRsZXQgbGFzdFNldFRvcGljID0gMDtcblx0XHRcdFx0aWYgKCFfLmlzRW1wdHkocm9ja2V0Q2hhbm5lbERhdGEudG9waWMgJiYgcm9ja2V0Q2hhbm5lbERhdGEudG9waWMudmFsdWUpKSB7XG5cdFx0XHRcdFx0cm9vbVVwZGF0ZS50b3BpYyA9IHJvY2tldENoYW5uZWxEYXRhLnRvcGljLnZhbHVlO1xuXHRcdFx0XHRcdGxhc3RTZXRUb3BpYyA9IHJvY2tldENoYW5uZWxEYXRhLnRvcGljLmxhc3Rfc2V0O1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlmICghXy5pc0VtcHR5KHJvY2tldENoYW5uZWxEYXRhLnB1cnBvc2UgJiYgcm9ja2V0Q2hhbm5lbERhdGEucHVycG9zZS52YWx1ZSkgJiYgcm9ja2V0Q2hhbm5lbERhdGEucHVycG9zZS5sYXN0X3NldCA+IGxhc3RTZXRUb3BpYykge1xuXHRcdFx0XHRcdHJvb21VcGRhdGUudG9waWMgPSByb2NrZXRDaGFubmVsRGF0YS5wdXJwb3NlLnZhbHVlO1xuXHRcdFx0XHR9XG5cdFx0XHRcdFJvY2tldENoYXQubW9kZWxzLlJvb21zLmFkZEltcG9ydElkcyhyb2NrZXRDaGFubmVsRGF0YS5yb2NrZXRJZCwgcm9ja2V0Q2hhbm5lbERhdGEuaWQpO1xuXHRcdFx0XHR0aGlzLnNsYWNrQ2hhbm5lbE1hcFtyb2NrZXRDaGFubmVsRGF0YS5yb2NrZXRJZF0gPSB7IGlkOiBzbGFja0NoYW5uZWxJRCwgZmFtaWx5OiBzbGFja0NoYW5uZWxJRC5jaGFyQXQoMCkgPT09ICdDJyA/ICdjaGFubmVscycgOiAnZ3JvdXBzJyB9O1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRPbmVCeUlkKHJvY2tldENoYW5uZWxEYXRhLnJvY2tldElkKTtcblx0XHR9XG5cdFx0bG9nZ2VyLmNsYXNzLmRlYnVnKCdDaGFubmVsIG5vdCBhZGRlZCcpO1xuXHRcdHJldHVybjtcblx0fVxuXG5cdGZpbmRSb2NrZXRVc2VyKHNsYWNrVXNlcklEKSB7XG5cdFx0Y29uc3Qgcm9ja2V0VXNlciA9IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmVCeUltcG9ydElkKHNsYWNrVXNlcklEKTtcblx0XHRpZiAocm9ja2V0VXNlciAmJiAhdGhpcy51c2VyVGFnc1tzbGFja1VzZXJJRF0pIHtcblx0XHRcdHRoaXMudXNlclRhZ3Nbc2xhY2tVc2VySURdID0geyBzbGFjazogYDxAJHsgc2xhY2tVc2VySUQgfT5gLCByb2NrZXQ6IGBAJHsgcm9ja2V0VXNlci51c2VybmFtZSB9YCB9O1xuXHRcdH1cblx0XHRyZXR1cm4gcm9ja2V0VXNlcjtcblx0fVxuXG5cdGFkZFJvY2tldFVzZXIoc2xhY2tVc2VySUQpIHtcblx0XHRsb2dnZXIuY2xhc3MuZGVidWcoJ0FkZGluZyBSb2NrZXQuQ2hhdCB1c2VyIGZyb20gU2xhY2snLCBzbGFja1VzZXJJRCk7XG5cdFx0Y29uc3Qgc2xhY2tSZXN1bHRzID0gSFRUUC5nZXQoJ2h0dHBzOi8vc2xhY2suY29tL2FwaS91c2Vycy5pbmZvJywgeyBwYXJhbXM6IHsgdG9rZW46IHRoaXMuYXBpVG9rZW4sIHVzZXI6IHNsYWNrVXNlcklEIH0gfSk7XG5cdFx0aWYgKHNsYWNrUmVzdWx0cyAmJiBzbGFja1Jlc3VsdHMuZGF0YSAmJiBzbGFja1Jlc3VsdHMuZGF0YS5vayA9PT0gdHJ1ZSAmJiBzbGFja1Jlc3VsdHMuZGF0YS51c2VyKSB7XG5cdFx0XHRjb25zdCByb2NrZXRVc2VyRGF0YSA9IHNsYWNrUmVzdWx0cy5kYXRhLnVzZXI7XG5cdFx0XHRjb25zdCBpc0JvdCA9IHJvY2tldFVzZXJEYXRhLmlzX2JvdCA9PT0gdHJ1ZTtcblx0XHRcdGNvbnN0IGVtYWlsID0gcm9ja2V0VXNlckRhdGEucHJvZmlsZSAmJiByb2NrZXRVc2VyRGF0YS5wcm9maWxlLmVtYWlsIHx8ICcnO1xuXHRcdFx0bGV0IGV4aXN0aW5nUm9ja2V0VXNlcjtcblx0XHRcdGlmICghaXNCb3QpIHtcblx0XHRcdFx0ZXhpc3RpbmdSb2NrZXRVc2VyID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZE9uZUJ5RW1haWxBZGRyZXNzKGVtYWlsKSB8fCBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kT25lQnlVc2VybmFtZShyb2NrZXRVc2VyRGF0YS5uYW1lKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGV4aXN0aW5nUm9ja2V0VXNlciA9IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmVCeVVzZXJuYW1lKHJvY2tldFVzZXJEYXRhLm5hbWUpO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoZXhpc3RpbmdSb2NrZXRVc2VyKSB7XG5cdFx0XHRcdHJvY2tldFVzZXJEYXRhLnJvY2tldElkID0gZXhpc3RpbmdSb2NrZXRVc2VyLl9pZDtcblx0XHRcdFx0cm9ja2V0VXNlckRhdGEubmFtZSA9IGV4aXN0aW5nUm9ja2V0VXNlci51c2VybmFtZTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGNvbnN0IG5ld1VzZXIgPSB7XG5cdFx0XHRcdFx0cGFzc3dvcmQ6IFJhbmRvbS5pZCgpLFxuXHRcdFx0XHRcdHVzZXJuYW1lOiByb2NrZXRVc2VyRGF0YS5uYW1lXG5cdFx0XHRcdH07XG5cblx0XHRcdFx0aWYgKCFpc0JvdCAmJiBlbWFpbCkge1xuXHRcdFx0XHRcdG5ld1VzZXIuZW1haWwgPSBlbWFpbDtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmIChpc0JvdCkge1xuXHRcdFx0XHRcdG5ld1VzZXIuam9pbkRlZmF1bHRDaGFubmVscyA9IGZhbHNlO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0cm9ja2V0VXNlckRhdGEucm9ja2V0SWQgPSBBY2NvdW50cy5jcmVhdGVVc2VyKG5ld1VzZXIpO1xuXHRcdFx0XHRjb25zdCB1c2VyVXBkYXRlID0ge1xuXHRcdFx0XHRcdHV0Y09mZnNldDogcm9ja2V0VXNlckRhdGEudHpfb2Zmc2V0IC8gMzYwMCwgLy8gU2xhY2sncyBpcyAtMTgwMDAgd2hpY2ggdHJhbnNsYXRlcyB0byBSb2NrZXQuQ2hhdCdzIGFmdGVyIGRpdmlkaW5nIGJ5IDM2MDAsXG5cdFx0XHRcdFx0cm9sZXM6IGlzQm90ID8gWyAnYm90JyBdIDogWyAndXNlcicgXVxuXHRcdFx0XHR9O1xuXG5cdFx0XHRcdGlmIChyb2NrZXRVc2VyRGF0YS5wcm9maWxlICYmIHJvY2tldFVzZXJEYXRhLnByb2ZpbGUucmVhbF9uYW1lKSB7XG5cdFx0XHRcdFx0dXNlclVwZGF0ZVsnbmFtZSddID0gcm9ja2V0VXNlckRhdGEucHJvZmlsZS5yZWFsX25hbWU7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAocm9ja2V0VXNlckRhdGEuZGVsZXRlZCkge1xuXHRcdFx0XHRcdHVzZXJVcGRhdGVbJ2FjdGl2ZSddID0gZmFsc2U7XG5cdFx0XHRcdFx0dXNlclVwZGF0ZVsnc2VydmljZXMucmVzdW1lLmxvZ2luVG9rZW5zJ10gPSBbXTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdFJvY2tldENoYXQubW9kZWxzLlVzZXJzLnVwZGF0ZSh7IF9pZDogcm9ja2V0VXNlckRhdGEucm9ja2V0SWQgfSwgeyAkc2V0OiB1c2VyVXBkYXRlIH0pO1xuXG5cdFx0XHRcdGNvbnN0IHVzZXIgPSBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kT25lQnlJZChyb2NrZXRVc2VyRGF0YS5yb2NrZXRJZCk7XG5cblx0XHRcdFx0bGV0IHVybCA9IG51bGw7XG5cdFx0XHRcdGlmIChyb2NrZXRVc2VyRGF0YS5wcm9maWxlKSB7XG5cdFx0XHRcdFx0aWYgKHJvY2tldFVzZXJEYXRhLnByb2ZpbGUuaW1hZ2Vfb3JpZ2luYWwpIHtcblx0XHRcdFx0XHRcdHVybCA9IHJvY2tldFVzZXJEYXRhLnByb2ZpbGUuaW1hZ2Vfb3JpZ2luYWw7XG5cdFx0XHRcdFx0fSBlbHNlIGlmIChyb2NrZXRVc2VyRGF0YS5wcm9maWxlLmltYWdlXzUxMikge1xuXHRcdFx0XHRcdFx0dXJsID0gcm9ja2V0VXNlckRhdGEucHJvZmlsZS5pbWFnZV81MTI7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHRcdGlmICh1cmwpIHtcblx0XHRcdFx0XHR0cnkge1xuXHRcdFx0XHRcdFx0Um9ja2V0Q2hhdC5zZXRVc2VyQXZhdGFyKHVzZXIsIHVybCwgbnVsbCwgJ3VybCcpO1xuXHRcdFx0XHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHRcdFx0XHRsb2dnZXIuY2xhc3MuZGVidWcoJ0Vycm9yIHNldHRpbmcgdXNlciBhdmF0YXInLCBlcnJvci5tZXNzYWdlKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0Y29uc3QgaW1wb3J0SWRzID0gWyByb2NrZXRVc2VyRGF0YS5pZCBdO1xuXHRcdFx0aWYgKGlzQm90ICYmIHJvY2tldFVzZXJEYXRhLnByb2ZpbGUgJiYgcm9ja2V0VXNlckRhdGEucHJvZmlsZS5ib3RfaWQpIHtcblx0XHRcdFx0aW1wb3J0SWRzLnB1c2gocm9ja2V0VXNlckRhdGEucHJvZmlsZS5ib3RfaWQpO1xuXHRcdFx0fVxuXHRcdFx0Um9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuYWRkSW1wb3J0SWRzKHJvY2tldFVzZXJEYXRhLnJvY2tldElkLCBpbXBvcnRJZHMpO1xuXHRcdFx0aWYgKCF0aGlzLnVzZXJUYWdzW3NsYWNrVXNlcklEXSkge1xuXHRcdFx0XHR0aGlzLnVzZXJUYWdzW3NsYWNrVXNlcklEXSA9IHsgc2xhY2s6IGA8QCR7IHNsYWNrVXNlcklEIH0+YCwgcm9ja2V0OiBgQCR7IHJvY2tldFVzZXJEYXRhLm5hbWUgfWAgfTtcblx0XHRcdH1cblx0XHRcdHJldHVybiBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kT25lQnlJZChyb2NrZXRVc2VyRGF0YS5yb2NrZXRJZCk7XG5cdFx0fVxuXHRcdGxvZ2dlci5jbGFzcy5kZWJ1ZygnVXNlciBub3QgYWRkZWQnKTtcblx0XHRyZXR1cm47XG5cdH1cblxuXHRhZGRBbGlhc1RvUm9ja2V0TXNnKHJvY2tldFVzZXJOYW1lLCByb2NrZXRNc2dPYmopIHtcblx0XHRpZiAodGhpcy5hbGlhc0Zvcm1hdCkge1xuXHRcdFx0Y29uc3QgYWxpYXMgPSB0aGlzLnV0aWwuZm9ybWF0KHRoaXMuYWxpYXNGb3JtYXQsIHJvY2tldFVzZXJOYW1lKTtcblxuXHRcdFx0aWYgKGFsaWFzICE9PSByb2NrZXRVc2VyTmFtZSkge1xuXHRcdFx0XHRyb2NrZXRNc2dPYmouYWxpYXMgPSBhbGlhcztcblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gcm9ja2V0TXNnT2JqO1xuXHR9XG5cblx0Y3JlYXRlQW5kU2F2ZVJvY2tldE1lc3NhZ2Uocm9ja2V0Q2hhbm5lbCwgcm9ja2V0VXNlciwgc2xhY2tNZXNzYWdlLCByb2NrZXRNc2dEYXRhRGVmYXVsdHMsIGlzSW1wb3J0aW5nKSB7XG5cdFx0aWYgKHNsYWNrTWVzc2FnZS50eXBlID09PSAnbWVzc2FnZScpIHtcblx0XHRcdGxldCByb2NrZXRNc2dPYmogPSB7fTtcblx0XHRcdGlmICghXy5pc0VtcHR5KHNsYWNrTWVzc2FnZS5zdWJ0eXBlKSkge1xuXHRcdFx0XHRyb2NrZXRNc2dPYmogPSB0aGlzLnByb2Nlc3NTbGFja1N1YnR5cGVkTWVzc2FnZShyb2NrZXRDaGFubmVsLCByb2NrZXRVc2VyLCBzbGFja01lc3NhZ2UsIGlzSW1wb3J0aW5nKTtcblx0XHRcdFx0aWYgKCFyb2NrZXRNc2dPYmopIHtcblx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdH1cblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHJvY2tldE1zZ09iaiA9IHtcblx0XHRcdFx0XHRtc2c6IHRoaXMuY29udmVydFNsYWNrTXNnVHh0VG9Sb2NrZXRUeHRGb3JtYXQoc2xhY2tNZXNzYWdlLnRleHQpLFxuXHRcdFx0XHRcdHJpZDogcm9ja2V0Q2hhbm5lbC5faWQsXG5cdFx0XHRcdFx0dToge1xuXHRcdFx0XHRcdFx0X2lkOiByb2NrZXRVc2VyLl9pZCxcblx0XHRcdFx0XHRcdHVzZXJuYW1lOiByb2NrZXRVc2VyLnVzZXJuYW1lXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9O1xuXG5cdFx0XHRcdHRoaXMuYWRkQWxpYXNUb1JvY2tldE1zZyhyb2NrZXRVc2VyLnVzZXJuYW1lLCByb2NrZXRNc2dPYmopO1xuXHRcdFx0fVxuXHRcdFx0Xy5leHRlbmQocm9ja2V0TXNnT2JqLCByb2NrZXRNc2dEYXRhRGVmYXVsdHMpO1xuXHRcdFx0aWYgKHNsYWNrTWVzc2FnZS5lZGl0ZWQpIHtcblx0XHRcdFx0cm9ja2V0TXNnT2JqLmVkaXRlZEF0ID0gbmV3IERhdGUocGFyc2VJbnQoc2xhY2tNZXNzYWdlLmVkaXRlZC50cy5zcGxpdCgnLicpWzBdKSAqIDEwMDApO1xuXHRcdFx0fVxuXHRcdFx0aWYgKHNsYWNrTWVzc2FnZS5zdWJ0eXBlID09PSAnYm90X21lc3NhZ2UnKSB7XG5cdFx0XHRcdHJvY2tldFVzZXIgPSBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kT25lQnlJZCgncm9ja2V0LmNhdCcsIHsgZmllbGRzOiB7IHVzZXJuYW1lOiAxIH0gfSk7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChzbGFja01lc3NhZ2UucGlubmVkX3RvICYmIHNsYWNrTWVzc2FnZS5waW5uZWRfdG8uaW5kZXhPZihzbGFja01lc3NhZ2UuY2hhbm5lbCkgIT09IC0xKSB7XG5cdFx0XHRcdHJvY2tldE1zZ09iai5waW5uZWQgPSB0cnVlO1xuXHRcdFx0XHRyb2NrZXRNc2dPYmoucGlubmVkQXQgPSBEYXRlLm5vdztcblx0XHRcdFx0cm9ja2V0TXNnT2JqLnBpbm5lZEJ5ID0gXy5waWNrKHJvY2tldFVzZXIsICdfaWQnLCAndXNlcm5hbWUnKTtcblx0XHRcdH1cblx0XHRcdGlmIChzbGFja01lc3NhZ2Uuc3VidHlwZSA9PT0gJ2JvdF9tZXNzYWdlJykge1xuXHRcdFx0XHRNZXRlb3Iuc2V0VGltZW91dCgoKSA9PiB7XG5cdFx0XHRcdFx0aWYgKHNsYWNrTWVzc2FnZS5ib3RfaWQgJiYgc2xhY2tNZXNzYWdlLnRzICYmICFSb2NrZXRDaGF0Lm1vZGVscy5NZXNzYWdlcy5maW5kT25lQnlTbGFja0JvdElkQW5kU2xhY2tUcyhzbGFja01lc3NhZ2UuYm90X2lkLCBzbGFja01lc3NhZ2UudHMpKSB7XG5cdFx0XHRcdFx0XHRSb2NrZXRDaGF0LnNlbmRNZXNzYWdlKHJvY2tldFVzZXIsIHJvY2tldE1zZ09iaiwgcm9ja2V0Q2hhbm5lbCwgdHJ1ZSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9LCA1MDApO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0bG9nZ2VyLmNsYXNzLmRlYnVnKCdTZW5kIG1lc3NhZ2UgdG8gUm9ja2V0LkNoYXQnKTtcblx0XHRcdFx0Um9ja2V0Q2hhdC5zZW5kTWVzc2FnZShyb2NrZXRVc2VyLCByb2NrZXRNc2dPYmosIHJvY2tldENoYW5uZWwsIHRydWUpO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdC8qXG5cdCBodHRwczovL2FwaS5zbGFjay5jb20vZXZlbnRzL3JlYWN0aW9uX3JlbW92ZWRcblx0ICovXG5cdG9uU2xhY2tSZWFjdGlvblJlbW92ZWQoc2xhY2tSZWFjdGlvbk1zZykge1xuXHRcdGlmIChzbGFja1JlYWN0aW9uTXNnKSB7XG5cdFx0XHRjb25zdCByb2NrZXRVc2VyID0gdGhpcy5nZXRSb2NrZXRVc2VyKHNsYWNrUmVhY3Rpb25Nc2cudXNlcik7XG5cdFx0XHQvL0xldHMgZmluZCBvdXIgUm9ja2V0IG9yaWdpbmF0ZWQgbWVzc2FnZVxuXHRcdFx0bGV0IHJvY2tldE1zZyA9IFJvY2tldENoYXQubW9kZWxzLk1lc3NhZ2VzLmZpbmRPbmVCeVNsYWNrVHMoc2xhY2tSZWFjdGlvbk1zZy5pdGVtLnRzKTtcblxuXHRcdFx0aWYgKCFyb2NrZXRNc2cpIHtcblx0XHRcdFx0Ly9NdXN0IGhhdmUgb3JpZ2luYXRlZCBmcm9tIFNsYWNrXG5cdFx0XHRcdGNvbnN0IHJvY2tldElEID0gdGhpcy5jcmVhdGVSb2NrZXRJRChzbGFja1JlYWN0aW9uTXNnLml0ZW0uY2hhbm5lbCwgc2xhY2tSZWFjdGlvbk1zZy5pdGVtLnRzKTtcblx0XHRcdFx0cm9ja2V0TXNnID0gUm9ja2V0Q2hhdC5tb2RlbHMuTWVzc2FnZXMuZmluZE9uZUJ5SWQocm9ja2V0SUQpO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAocm9ja2V0TXNnICYmIHJvY2tldFVzZXIpIHtcblx0XHRcdFx0Y29uc3Qgcm9ja2V0UmVhY3Rpb24gPSBgOiR7IHNsYWNrUmVhY3Rpb25Nc2cucmVhY3Rpb24gfTpgO1xuXG5cdFx0XHRcdC8vSWYgdGhlIFJvY2tldCB1c2VyIGhhcyBhbHJlYWR5IGJlZW4gcmVtb3ZlZCwgdGhlbiB0aGlzIGlzIGFuIGVjaG8gYmFjayBmcm9tIHNsYWNrXG5cdFx0XHRcdGlmIChyb2NrZXRNc2cucmVhY3Rpb25zKSB7XG5cdFx0XHRcdFx0Y29uc3QgdGhlUmVhY3Rpb24gPSByb2NrZXRNc2cucmVhY3Rpb25zW3JvY2tldFJlYWN0aW9uXTtcblx0XHRcdFx0XHRpZiAodGhlUmVhY3Rpb24pIHtcblx0XHRcdFx0XHRcdGlmICh0aGVSZWFjdGlvbi51c2VybmFtZXMuaW5kZXhPZihyb2NrZXRVc2VyLnVzZXJuYW1lKSA9PT0gLTEpIHtcblx0XHRcdFx0XHRcdFx0cmV0dXJuOyAvL1JlYWN0aW9uIGFscmVhZHkgcmVtb3ZlZFxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHQvL1JlYWN0aW9uIGFscmVhZHkgcmVtb3ZlZFxuXHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdC8vU3Rhc2ggdGhpcyBhd2F5IHRvIGtleSBvZmYgaXQgbGF0ZXIgc28gd2UgZG9uJ3Qgc2VuZCBpdCBiYWNrIHRvIFNsYWNrXG5cdFx0XHRcdHRoaXMucmVhY3Rpb25zTWFwLnNldChgdW5zZXQkeyByb2NrZXRNc2cuX2lkIH0keyByb2NrZXRSZWFjdGlvbiB9YCwgcm9ja2V0VXNlcik7XG5cdFx0XHRcdGxvZ2dlci5jbGFzcy5kZWJ1ZygnUmVtb3ZpbmcgcmVhY3Rpb24gZnJvbSBTbGFjaycpO1xuXHRcdFx0XHRNZXRlb3IucnVuQXNVc2VyKHJvY2tldFVzZXIuX2lkLCAoKSA9PiB7XG5cdFx0XHRcdFx0TWV0ZW9yLmNhbGwoJ3NldFJlYWN0aW9uJywgcm9ja2V0UmVhY3Rpb24sIHJvY2tldE1zZy5faWQpO1xuXHRcdFx0XHR9KTtcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHQvKlxuXHQgaHR0cHM6Ly9hcGkuc2xhY2suY29tL2V2ZW50cy9yZWFjdGlvbl9hZGRlZFxuXHQgKi9cblx0b25TbGFja1JlYWN0aW9uQWRkZWQoc2xhY2tSZWFjdGlvbk1zZykge1xuXHRcdGlmIChzbGFja1JlYWN0aW9uTXNnKSB7XG5cdFx0XHRjb25zdCByb2NrZXRVc2VyID0gdGhpcy5nZXRSb2NrZXRVc2VyKHNsYWNrUmVhY3Rpb25Nc2cudXNlcik7XG5cblx0XHRcdGlmIChyb2NrZXRVc2VyLnJvbGVzLmluY2x1ZGVzKCdib3QnKSkge1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdC8vTGV0cyBmaW5kIG91ciBSb2NrZXQgb3JpZ2luYXRlZCBtZXNzYWdlXG5cdFx0XHRsZXQgcm9ja2V0TXNnID0gUm9ja2V0Q2hhdC5tb2RlbHMuTWVzc2FnZXMuZmluZE9uZUJ5U2xhY2tUcyhzbGFja1JlYWN0aW9uTXNnLml0ZW0udHMpO1xuXG5cdFx0XHRpZiAoIXJvY2tldE1zZykge1xuXHRcdFx0XHQvL011c3QgaGF2ZSBvcmlnaW5hdGVkIGZyb20gU2xhY2tcblx0XHRcdFx0Y29uc3Qgcm9ja2V0SUQgPSB0aGlzLmNyZWF0ZVJvY2tldElEKHNsYWNrUmVhY3Rpb25Nc2cuaXRlbS5jaGFubmVsLCBzbGFja1JlYWN0aW9uTXNnLml0ZW0udHMpO1xuXHRcdFx0XHRyb2NrZXRNc2cgPSBSb2NrZXRDaGF0Lm1vZGVscy5NZXNzYWdlcy5maW5kT25lQnlJZChyb2NrZXRJRCk7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChyb2NrZXRNc2cgJiYgcm9ja2V0VXNlcikge1xuXHRcdFx0XHRjb25zdCByb2NrZXRSZWFjdGlvbiA9IGA6JHsgc2xhY2tSZWFjdGlvbk1zZy5yZWFjdGlvbiB9OmA7XG5cblx0XHRcdFx0Ly9JZiB0aGUgUm9ja2V0IHVzZXIgaGFzIGFscmVhZHkgcmVhY3RlZCwgdGhlbiB0aGlzIGlzIFNsYWNrIGVjaG9pbmcgYmFjayB0byB1c1xuXHRcdFx0XHRpZiAocm9ja2V0TXNnLnJlYWN0aW9ucykge1xuXHRcdFx0XHRcdGNvbnN0IHRoZVJlYWN0aW9uID0gcm9ja2V0TXNnLnJlYWN0aW9uc1tyb2NrZXRSZWFjdGlvbl07XG5cdFx0XHRcdFx0aWYgKHRoZVJlYWN0aW9uKSB7XG5cdFx0XHRcdFx0XHRpZiAodGhlUmVhY3Rpb24udXNlcm5hbWVzLmluZGV4T2Yocm9ja2V0VXNlci51c2VybmFtZSkgIT09IC0xKSB7XG5cdFx0XHRcdFx0XHRcdHJldHVybjsgLy9BbHJlYWR5IHJlYWN0ZWRcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvL1N0YXNoIHRoaXMgYXdheSB0byBrZXkgb2ZmIGl0IGxhdGVyIHNvIHdlIGRvbid0IHNlbmQgaXQgYmFjayB0byBTbGFja1xuXHRcdFx0XHR0aGlzLnJlYWN0aW9uc01hcC5zZXQoYHNldCR7IHJvY2tldE1zZy5faWQgfSR7IHJvY2tldFJlYWN0aW9uIH1gLCByb2NrZXRVc2VyKTtcblx0XHRcdFx0bG9nZ2VyLmNsYXNzLmRlYnVnKCdBZGRpbmcgcmVhY3Rpb24gZnJvbSBTbGFjaycpO1xuXHRcdFx0XHRNZXRlb3IucnVuQXNVc2VyKHJvY2tldFVzZXIuX2lkLCAoKSA9PiB7XG5cdFx0XHRcdFx0TWV0ZW9yLmNhbGwoJ3NldFJlYWN0aW9uJywgcm9ja2V0UmVhY3Rpb24sIHJvY2tldE1zZy5faWQpO1xuXHRcdFx0XHR9KTtcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICogV2UgaGF2ZSByZWNlaXZlZCBhIG1lc3NhZ2UgZnJvbSBzbGFjayBhbmQgd2UgbmVlZCB0byBzYXZlL2RlbGV0ZS91cGRhdGUgaXQgaW50byByb2NrZXRcblx0ICogaHR0cHM6Ly9hcGkuc2xhY2suY29tL2V2ZW50cy9tZXNzYWdlXG5cdCAqL1xuXHRvblNsYWNrTWVzc2FnZShzbGFja01lc3NhZ2UsIGlzSW1wb3J0aW5nKSB7XG5cdFx0aWYgKHNsYWNrTWVzc2FnZS5zdWJ0eXBlKSB7XG5cdFx0XHRzd2l0Y2ggKHNsYWNrTWVzc2FnZS5zdWJ0eXBlKSB7XG5cdFx0XHRcdGNhc2UgJ21lc3NhZ2VfZGVsZXRlZCc6XG5cdFx0XHRcdFx0dGhpcy5wcm9jZXNzU2xhY2tNZXNzYWdlRGVsZXRlZChzbGFja01lc3NhZ2UpO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRjYXNlICdtZXNzYWdlX2NoYW5nZWQnOlxuXHRcdFx0XHRcdHRoaXMucHJvY2Vzc1NsYWNrTWVzc2FnZUNoYW5nZWQoc2xhY2tNZXNzYWdlKTtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0ZGVmYXVsdDpcblx0XHRcdFx0XHQvL0tlZXBpbmcgYmFja3dhcmRzIGNvbXBhdGFiaWxpdHkgZm9yIG5vdywgcmVmYWN0b3IgbGF0ZXJcblx0XHRcdFx0XHR0aGlzLnByb2Nlc3NTbGFja05ld01lc3NhZ2Uoc2xhY2tNZXNzYWdlLCBpc0ltcG9ydGluZyk7XG5cdFx0XHR9XG5cdFx0fSBlbHNlIHtcblx0XHRcdC8vU2ltcGxlIG1lc3NhZ2Vcblx0XHRcdHRoaXMucHJvY2Vzc1NsYWNrTmV3TWVzc2FnZShzbGFja01lc3NhZ2UsIGlzSW1wb3J0aW5nKTtcblx0XHR9XG5cdH1cblxuXHRwcm9jZXNzU2xhY2tTdWJ0eXBlZE1lc3NhZ2Uocm9ja2V0Q2hhbm5lbCwgcm9ja2V0VXNlciwgc2xhY2tNZXNzYWdlLCBpc0ltcG9ydGluZykge1xuXHRcdGxldCByb2NrZXRNc2dPYmogPSBudWxsO1xuXHRcdHN3aXRjaCAoc2xhY2tNZXNzYWdlLnN1YnR5cGUpIHtcblx0XHRcdGNhc2UgJ2JvdF9tZXNzYWdlJzpcblx0XHRcdFx0aWYgKHNsYWNrTWVzc2FnZS51c2VybmFtZSAhPT0gdW5kZWZpbmVkICYmIHRoaXMuZXhjbHVkZUJvdG5hbWVzICYmIHNsYWNrTWVzc2FnZS51c2VybmFtZS5tYXRjaCh0aGlzLmV4Y2x1ZGVCb3RuYW1lcykpIHtcblx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRyb2NrZXRNc2dPYmogPSB7XG5cdFx0XHRcdFx0bXNnOiB0aGlzLmNvbnZlcnRTbGFja01zZ1R4dFRvUm9ja2V0VHh0Rm9ybWF0KHNsYWNrTWVzc2FnZS50ZXh0KSxcblx0XHRcdFx0XHRyaWQ6IHJvY2tldENoYW5uZWwuX2lkLFxuXHRcdFx0XHRcdGJvdDogdHJ1ZSxcblx0XHRcdFx0XHRhdHRhY2htZW50czogc2xhY2tNZXNzYWdlLmF0dGFjaG1lbnRzLFxuXHRcdFx0XHRcdHVzZXJuYW1lOiBzbGFja01lc3NhZ2UudXNlcm5hbWUgfHwgc2xhY2tNZXNzYWdlLmJvdF9pZFxuXHRcdFx0XHR9O1xuXHRcdFx0XHR0aGlzLmFkZEFsaWFzVG9Sb2NrZXRNc2coc2xhY2tNZXNzYWdlLnVzZXJuYW1lIHx8IHNsYWNrTWVzc2FnZS5ib3RfaWQsIHJvY2tldE1zZ09iaik7XG5cdFx0XHRcdGlmIChzbGFja01lc3NhZ2UuaWNvbnMpIHtcblx0XHRcdFx0XHRyb2NrZXRNc2dPYmouZW1vamkgPSBzbGFja01lc3NhZ2UuaWNvbnMuZW1vamk7XG5cdFx0XHRcdH1cblx0XHRcdFx0cmV0dXJuIHJvY2tldE1zZ09iajtcblx0XHRcdGNhc2UgJ21lX21lc3NhZ2UnOlxuXHRcdFx0XHRyZXR1cm4gdGhpcy5hZGRBbGlhc1RvUm9ja2V0TXNnKHJvY2tldFVzZXIudXNlcm5hbWUsIHtcblx0XHRcdFx0XHRtc2c6IGBfJHsgdGhpcy5jb252ZXJ0U2xhY2tNc2dUeHRUb1JvY2tldFR4dEZvcm1hdChzbGFja01lc3NhZ2UudGV4dCkgfV9gXG5cdFx0XHRcdH0pO1xuXHRcdFx0Y2FzZSAnY2hhbm5lbF9qb2luJzpcblx0XHRcdFx0aWYgKGlzSW1wb3J0aW5nKSB7XG5cdFx0XHRcdFx0Um9ja2V0Q2hhdC5tb2RlbHMuTWVzc2FnZXMuY3JlYXRlVXNlckpvaW5XaXRoUm9vbUlkQW5kVXNlcihyb2NrZXRDaGFubmVsLl9pZCwgcm9ja2V0VXNlciwgeyB0czogbmV3IERhdGUocGFyc2VJbnQoc2xhY2tNZXNzYWdlLnRzLnNwbGl0KCcuJylbMF0pICogMTAwMCksIGltcG9ydGVkOiAnc2xhY2ticmlkZ2UnIH0pO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFJvY2tldENoYXQuYWRkVXNlclRvUm9vbShyb2NrZXRDaGFubmVsLl9pZCwgcm9ja2V0VXNlcik7XG5cdFx0XHRcdH1cblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0Y2FzZSAnZ3JvdXBfam9pbic6XG5cdFx0XHRcdGlmIChzbGFja01lc3NhZ2UuaW52aXRlcikge1xuXHRcdFx0XHRcdGNvbnN0IGludml0ZXIgPSBzbGFja01lc3NhZ2UuaW52aXRlciA/IHRoaXMuZmluZFJvY2tldFVzZXIoc2xhY2tNZXNzYWdlLmludml0ZXIpIHx8IHRoaXMuYWRkUm9ja2V0VXNlcihzbGFja01lc3NhZ2UuaW52aXRlcikgOiBudWxsO1xuXHRcdFx0XHRcdGlmIChpc0ltcG9ydGluZykge1xuXHRcdFx0XHRcdFx0Um9ja2V0Q2hhdC5tb2RlbHMuTWVzc2FnZXMuY3JlYXRlVXNlckFkZGVkV2l0aFJvb21JZEFuZFVzZXIocm9ja2V0Q2hhbm5lbC5faWQsIHJvY2tldFVzZXIsIHtcblx0XHRcdFx0XHRcdFx0dHM6IG5ldyBEYXRlKHBhcnNlSW50KHNsYWNrTWVzc2FnZS50cy5zcGxpdCgnLicpWzBdKSAqIDEwMDApLFxuXHRcdFx0XHRcdFx0XHR1OiB7XG5cdFx0XHRcdFx0XHRcdFx0X2lkOiBpbnZpdGVyLl9pZCxcblx0XHRcdFx0XHRcdFx0XHR1c2VybmFtZTogaW52aXRlci51c2VybmFtZVxuXHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XHRpbXBvcnRlZDogJ3NsYWNrYnJpZGdlJ1xuXHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdFJvY2tldENoYXQuYWRkVXNlclRvUm9vbShyb2NrZXRDaGFubmVsLl9pZCwgcm9ja2V0VXNlciwgaW52aXRlcik7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdGNhc2UgJ2NoYW5uZWxfbGVhdmUnOlxuXHRcdFx0Y2FzZSAnZ3JvdXBfbGVhdmUnOlxuXHRcdFx0XHRpZiAoaXNJbXBvcnRpbmcpIHtcblx0XHRcdFx0XHRSb2NrZXRDaGF0Lm1vZGVscy5NZXNzYWdlcy5jcmVhdGVVc2VyTGVhdmVXaXRoUm9vbUlkQW5kVXNlcihyb2NrZXRDaGFubmVsLl9pZCwgcm9ja2V0VXNlciwge1xuXHRcdFx0XHRcdFx0dHM6IG5ldyBEYXRlKHBhcnNlSW50KHNsYWNrTWVzc2FnZS50cy5zcGxpdCgnLicpWzBdKSAqIDEwMDApLFxuXHRcdFx0XHRcdFx0aW1wb3J0ZWQ6ICdzbGFja2JyaWRnZSdcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRSb2NrZXRDaGF0LnJlbW92ZVVzZXJGcm9tUm9vbShyb2NrZXRDaGFubmVsLl9pZCwgcm9ja2V0VXNlcik7XG5cdFx0XHRcdH1cblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0Y2FzZSAnY2hhbm5lbF90b3BpYyc6XG5cdFx0XHRjYXNlICdncm91cF90b3BpYyc6XG5cdFx0XHRcdGlmIChpc0ltcG9ydGluZykge1xuXHRcdFx0XHRcdFJvY2tldENoYXQubW9kZWxzLk1lc3NhZ2VzLmNyZWF0ZVJvb21TZXR0aW5nc0NoYW5nZWRXaXRoVHlwZVJvb21JZE1lc3NhZ2VBbmRVc2VyKCdyb29tX2NoYW5nZWRfdG9waWMnLCByb2NrZXRDaGFubmVsLl9pZCwgc2xhY2tNZXNzYWdlLnRvcGljLCByb2NrZXRVc2VyLCB7IHRzOiBuZXcgRGF0ZShwYXJzZUludChzbGFja01lc3NhZ2UudHMuc3BsaXQoJy4nKVswXSkgKiAxMDAwKSwgaW1wb3J0ZWQ6ICdzbGFja2JyaWRnZScgfSk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0Um9ja2V0Q2hhdC5zYXZlUm9vbVRvcGljKHJvY2tldENoYW5uZWwuX2lkLCBzbGFja01lc3NhZ2UudG9waWMsIHJvY2tldFVzZXIsIGZhbHNlKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHRjYXNlICdjaGFubmVsX3B1cnBvc2UnOlxuXHRcdFx0Y2FzZSAnZ3JvdXBfcHVycG9zZSc6XG5cdFx0XHRcdGlmIChpc0ltcG9ydGluZykge1xuXHRcdFx0XHRcdFJvY2tldENoYXQubW9kZWxzLk1lc3NhZ2VzLmNyZWF0ZVJvb21TZXR0aW5nc0NoYW5nZWRXaXRoVHlwZVJvb21JZE1lc3NhZ2VBbmRVc2VyKCdyb29tX2NoYW5nZWRfdG9waWMnLCByb2NrZXRDaGFubmVsLl9pZCwgc2xhY2tNZXNzYWdlLnB1cnBvc2UsIHJvY2tldFVzZXIsIHsgdHM6IG5ldyBEYXRlKHBhcnNlSW50KHNsYWNrTWVzc2FnZS50cy5zcGxpdCgnLicpWzBdKSAqIDEwMDApLCBpbXBvcnRlZDogJ3NsYWNrYnJpZGdlJyB9KTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRSb2NrZXRDaGF0LnNhdmVSb29tVG9waWMocm9ja2V0Q2hhbm5lbC5faWQsIHNsYWNrTWVzc2FnZS5wdXJwb3NlLCByb2NrZXRVc2VyLCBmYWxzZSk7XG5cdFx0XHRcdH1cblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0Y2FzZSAnY2hhbm5lbF9uYW1lJzpcblx0XHRcdGNhc2UgJ2dyb3VwX25hbWUnOlxuXHRcdFx0XHRpZiAoaXNJbXBvcnRpbmcpIHtcblx0XHRcdFx0XHRSb2NrZXRDaGF0Lm1vZGVscy5NZXNzYWdlcy5jcmVhdGVSb29tUmVuYW1lZFdpdGhSb29tSWRSb29tTmFtZUFuZFVzZXIocm9ja2V0Q2hhbm5lbC5faWQsIHNsYWNrTWVzc2FnZS5uYW1lLCByb2NrZXRVc2VyLCB7IHRzOiBuZXcgRGF0ZShwYXJzZUludChzbGFja01lc3NhZ2UudHMuc3BsaXQoJy4nKVswXSkgKiAxMDAwKSwgaW1wb3J0ZWQ6ICdzbGFja2JyaWRnZScgfSk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0Um9ja2V0Q2hhdC5zYXZlUm9vbU5hbWUocm9ja2V0Q2hhbm5lbC5faWQsIHNsYWNrTWVzc2FnZS5uYW1lLCByb2NrZXRVc2VyLCBmYWxzZSk7XG5cdFx0XHRcdH1cblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0Y2FzZSAnY2hhbm5lbF9hcmNoaXZlJzpcblx0XHRcdGNhc2UgJ2dyb3VwX2FyY2hpdmUnOlxuXHRcdFx0XHRpZiAoIWlzSW1wb3J0aW5nKSB7XG5cdFx0XHRcdFx0Um9ja2V0Q2hhdC5hcmNoaXZlUm9vbShyb2NrZXRDaGFubmVsKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHRjYXNlICdjaGFubmVsX3VuYXJjaGl2ZSc6XG5cdFx0XHRjYXNlICdncm91cF91bmFyY2hpdmUnOlxuXHRcdFx0XHRpZiAoIWlzSW1wb3J0aW5nKSB7XG5cdFx0XHRcdFx0Um9ja2V0Q2hhdC51bmFyY2hpdmVSb29tKHJvY2tldENoYW5uZWwpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdGNhc2UgJ2ZpbGVfc2hhcmUnOlxuXHRcdFx0XHRpZiAoc2xhY2tNZXNzYWdlLmZpbGUgJiYgc2xhY2tNZXNzYWdlLmZpbGUudXJsX3ByaXZhdGVfZG93bmxvYWQgIT09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRcdGNvbnN0IGRldGFpbHMgPSB7XG5cdFx0XHRcdFx0XHRtZXNzYWdlX2lkOiBgc2xhY2stJHsgc2xhY2tNZXNzYWdlLnRzLnJlcGxhY2UoL1xcLi9nLCAnLScpIH1gLFxuXHRcdFx0XHRcdFx0bmFtZTogc2xhY2tNZXNzYWdlLmZpbGUubmFtZSxcblx0XHRcdFx0XHRcdHNpemU6IHNsYWNrTWVzc2FnZS5maWxlLnNpemUsXG5cdFx0XHRcdFx0XHR0eXBlOiBzbGFja01lc3NhZ2UuZmlsZS5taW1ldHlwZSxcblx0XHRcdFx0XHRcdHJpZDogcm9ja2V0Q2hhbm5lbC5faWRcblx0XHRcdFx0XHR9O1xuXHRcdFx0XHRcdHJldHVybiB0aGlzLnVwbG9hZEZpbGVGcm9tU2xhY2soZGV0YWlscywgc2xhY2tNZXNzYWdlLmZpbGUudXJsX3ByaXZhdGVfZG93bmxvYWQsIHJvY2tldFVzZXIsIHJvY2tldENoYW5uZWwsIG5ldyBEYXRlKHBhcnNlSW50KHNsYWNrTWVzc2FnZS50cy5zcGxpdCgnLicpWzBdKSAqIDEwMDApLCBpc0ltcG9ydGluZyk7XG5cdFx0XHRcdH1cblx0XHRcdFx0YnJlYWs7XG5cdFx0XHRjYXNlICdmaWxlX2NvbW1lbnQnOlxuXHRcdFx0XHRsb2dnZXIuY2xhc3MuZXJyb3IoJ0ZpbGUgY29tbWVudCBub3QgaW1wbGVtZW50ZWQnKTtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0Y2FzZSAnZmlsZV9tZW50aW9uJzpcblx0XHRcdFx0bG9nZ2VyLmNsYXNzLmVycm9yKCdGaWxlIG1lbnRpb25lZCBub3QgaW1wbGVtZW50ZWQnKTtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0Y2FzZSAncGlubmVkX2l0ZW0nOlxuXHRcdFx0XHRpZiAoc2xhY2tNZXNzYWdlLmF0dGFjaG1lbnRzICYmIHNsYWNrTWVzc2FnZS5hdHRhY2htZW50c1swXSAmJiBzbGFja01lc3NhZ2UuYXR0YWNobWVudHNbMF0udGV4dCkge1xuXHRcdFx0XHRcdHJvY2tldE1zZ09iaiA9IHtcblx0XHRcdFx0XHRcdHJpZDogcm9ja2V0Q2hhbm5lbC5faWQsXG5cdFx0XHRcdFx0XHR0OiAnbWVzc2FnZV9waW5uZWQnLFxuXHRcdFx0XHRcdFx0bXNnOiAnJyxcblx0XHRcdFx0XHRcdHU6IHtcblx0XHRcdFx0XHRcdFx0X2lkOiByb2NrZXRVc2VyLl9pZCxcblx0XHRcdFx0XHRcdFx0dXNlcm5hbWU6IHJvY2tldFVzZXIudXNlcm5hbWVcblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRhdHRhY2htZW50czogW3tcblx0XHRcdFx0XHRcdFx0J3RleHQnIDogdGhpcy5jb252ZXJ0U2xhY2tNc2dUeHRUb1JvY2tldFR4dEZvcm1hdChzbGFja01lc3NhZ2UuYXR0YWNobWVudHNbMF0udGV4dCksXG5cdFx0XHRcdFx0XHRcdCdhdXRob3JfbmFtZScgOiBzbGFja01lc3NhZ2UuYXR0YWNobWVudHNbMF0uYXV0aG9yX3N1Ym5hbWUsXG5cdFx0XHRcdFx0XHRcdCdhdXRob3JfaWNvbicgOiBnZXRBdmF0YXJVcmxGcm9tVXNlcm5hbWUoc2xhY2tNZXNzYWdlLmF0dGFjaG1lbnRzWzBdLmF1dGhvcl9zdWJuYW1lKSxcblx0XHRcdFx0XHRcdFx0J3RzJyA6IG5ldyBEYXRlKHBhcnNlSW50KHNsYWNrTWVzc2FnZS5hdHRhY2htZW50c1swXS50cy5zcGxpdCgnLicpWzBdKSAqIDEwMDApXG5cdFx0XHRcdFx0XHR9XVxuXHRcdFx0XHRcdH07XG5cblx0XHRcdFx0XHRpZiAoIWlzSW1wb3J0aW5nKSB7XG5cdFx0XHRcdFx0XHRSb2NrZXRDaGF0Lm1vZGVscy5NZXNzYWdlcy5zZXRQaW5uZWRCeUlkQW5kVXNlcklkKGBzbGFjay0keyBzbGFja01lc3NhZ2UuYXR0YWNobWVudHNbMF0uY2hhbm5lbF9pZCB9LSR7IHNsYWNrTWVzc2FnZS5hdHRhY2htZW50c1swXS50cy5yZXBsYWNlKC9cXC4vZywgJy0nKSB9YCwgcm9ja2V0TXNnT2JqLnUsIHRydWUsIG5ldyBEYXRlKHBhcnNlSW50KHNsYWNrTWVzc2FnZS50cy5zcGxpdCgnLicpWzBdKSAqIDEwMDApKTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRyZXR1cm4gcm9ja2V0TXNnT2JqO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdGxvZ2dlci5jbGFzcy5lcnJvcignUGlubmVkIGl0ZW0gd2l0aCBubyBhdHRhY2htZW50Jyk7XG5cdFx0XHRcdH1cblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0Y2FzZSAndW5waW5uZWRfaXRlbSc6XG5cdFx0XHRcdGxvZ2dlci5jbGFzcy5lcnJvcignVW5waW5uZWQgaXRlbSBub3QgaW1wbGVtZW50ZWQnKTtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHRVcGxvYWRzIHRoZSBmaWxlIHRvIHRoZSBzdG9yYWdlLlxuXHRAcGFyYW0gW09iamVjdF0gZGV0YWlscyBhbiBvYmplY3Qgd2l0aCBkZXRhaWxzIGFib3V0IHRoZSB1cGxvYWQuIG5hbWUsIHNpemUsIHR5cGUsIGFuZCByaWRcblx0QHBhcmFtIFtTdHJpbmddIGZpbGVVcmwgdXJsIG9mIHRoZSBmaWxlIHRvIGRvd25sb2FkL2ltcG9ydFxuXHRAcGFyYW0gW09iamVjdF0gdXNlciB0aGUgUm9ja2V0LkNoYXQgdXNlclxuXHRAcGFyYW0gW09iamVjdF0gcm9vbSB0aGUgUm9ja2V0LkNoYXQgcm9vbVxuXHRAcGFyYW0gW0RhdGVdIHRpbWVTdGFtcCB0aGUgdGltZXN0YW1wIHRoZSBmaWxlIHdhcyB1cGxvYWRlZFxuXHQqKi9cblx0Ly9kZXRhaWxzLCBzbGFja01lc3NhZ2UuZmlsZS51cmxfcHJpdmF0ZV9kb3dubG9hZCwgcm9ja2V0VXNlciwgcm9ja2V0Q2hhbm5lbCwgbmV3IERhdGUocGFyc2VJbnQoc2xhY2tNZXNzYWdlLnRzLnNwbGl0KCcuJylbMF0pICogMTAwMCksIGlzSW1wb3J0aW5nKTtcblx0dXBsb2FkRmlsZUZyb21TbGFjayhkZXRhaWxzLCBzbGFja0ZpbGVVUkwsIHJvY2tldFVzZXIsIHJvY2tldENoYW5uZWwsIHRpbWVTdGFtcCwgaXNJbXBvcnRpbmcpIHtcblx0XHRjb25zdCByZXF1ZXN0TW9kdWxlID0gL2h0dHBzL2kudGVzdChzbGFja0ZpbGVVUkwpID8gaHR0cHMgOiBodHRwO1xuXHRcdGNvbnN0IHBhcnNlZFVybCA9IHVybC5wYXJzZShzbGFja0ZpbGVVUkwsIHRydWUpO1xuXHRcdHBhcnNlZFVybC5oZWFkZXJzID0geyAnQXV0aG9yaXphdGlvbic6IGBCZWFyZXIgJHsgdGhpcy5hcGlUb2tlbiB9YCB9O1xuXHRcdHJlcXVlc3RNb2R1bGUuZ2V0KHBhcnNlZFVybCwgTWV0ZW9yLmJpbmRFbnZpcm9ubWVudCgoc3RyZWFtKSA9PiB7XG5cdFx0XHRjb25zdCBmaWxlU3RvcmUgPSBGaWxlVXBsb2FkLmdldFN0b3JlKCdVcGxvYWRzJyk7XG5cblx0XHRcdGZpbGVTdG9yZS5pbnNlcnQoZGV0YWlscywgc3RyZWFtLCAoZXJyLCBmaWxlKSA9PiB7XG5cdFx0XHRcdGlmIChlcnIpIHtcblx0XHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoZXJyKTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRjb25zdCB1cmwgPSBmaWxlLnVybC5yZXBsYWNlKE1ldGVvci5hYnNvbHV0ZVVybCgpLCAnLycpO1xuXHRcdFx0XHRcdGNvbnN0IGF0dGFjaG1lbnQgPSB7XG5cdFx0XHRcdFx0XHR0aXRsZTogZmlsZS5uYW1lLFxuXHRcdFx0XHRcdFx0dGl0bGVfbGluazogdXJsXG5cdFx0XHRcdFx0fTtcblxuXHRcdFx0XHRcdGlmICgvXmltYWdlXFwvLisvLnRlc3QoZmlsZS50eXBlKSkge1xuXHRcdFx0XHRcdFx0YXR0YWNobWVudC5pbWFnZV91cmwgPSB1cmw7XG5cdFx0XHRcdFx0XHRhdHRhY2htZW50LmltYWdlX3R5cGUgPSBmaWxlLnR5cGU7XG5cdFx0XHRcdFx0XHRhdHRhY2htZW50LmltYWdlX3NpemUgPSBmaWxlLnNpemU7XG5cdFx0XHRcdFx0XHRhdHRhY2htZW50LmltYWdlX2RpbWVuc2lvbnMgPSBmaWxlLmlkZW50aWZ5ICYmIGZpbGUuaWRlbnRpZnkuc2l6ZTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0aWYgKC9eYXVkaW9cXC8uKy8udGVzdChmaWxlLnR5cGUpKSB7XG5cdFx0XHRcdFx0XHRhdHRhY2htZW50LmF1ZGlvX3VybCA9IHVybDtcblx0XHRcdFx0XHRcdGF0dGFjaG1lbnQuYXVkaW9fdHlwZSA9IGZpbGUudHlwZTtcblx0XHRcdFx0XHRcdGF0dGFjaG1lbnQuYXVkaW9fc2l6ZSA9IGZpbGUuc2l6ZTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0aWYgKC9edmlkZW9cXC8uKy8udGVzdChmaWxlLnR5cGUpKSB7XG5cdFx0XHRcdFx0XHRhdHRhY2htZW50LnZpZGVvX3VybCA9IHVybDtcblx0XHRcdFx0XHRcdGF0dGFjaG1lbnQudmlkZW9fdHlwZSA9IGZpbGUudHlwZTtcblx0XHRcdFx0XHRcdGF0dGFjaG1lbnQudmlkZW9fc2l6ZSA9IGZpbGUuc2l6ZTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRjb25zdCBtc2cgPSB7XG5cdFx0XHRcdFx0XHRyaWQ6IGRldGFpbHMucmlkLFxuXHRcdFx0XHRcdFx0dHM6IHRpbWVTdGFtcCxcblx0XHRcdFx0XHRcdG1zZzogJycsXG5cdFx0XHRcdFx0XHRmaWxlOiB7XG5cdFx0XHRcdFx0XHRcdF9pZDogZmlsZS5faWRcblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRncm91cGFibGU6IGZhbHNlLFxuXHRcdFx0XHRcdFx0YXR0YWNobWVudHM6IFthdHRhY2htZW50XVxuXHRcdFx0XHRcdH07XG5cblx0XHRcdFx0XHRpZiAoaXNJbXBvcnRpbmcpIHtcblx0XHRcdFx0XHRcdG1zZy5pbXBvcnRlZCA9ICdzbGFja2JyaWRnZSc7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0aWYgKGRldGFpbHMubWVzc2FnZV9pZCAmJiAodHlwZW9mIGRldGFpbHMubWVzc2FnZV9pZCA9PT0gJ3N0cmluZycpKSB7XG5cdFx0XHRcdFx0XHRtc2dbJ19pZCddID0gZGV0YWlscy5tZXNzYWdlX2lkO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdHJldHVybiBSb2NrZXRDaGF0LnNlbmRNZXNzYWdlKHJvY2tldFVzZXIsIG1zZywgcm9ja2V0Q2hhbm5lbCwgdHJ1ZSk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdH0pKTtcblx0fVxuXG5cdHJlZ2lzdGVyRm9yUm9ja2V0RXZlbnRzKCkge1xuXHRcdFJvY2tldENoYXQuY2FsbGJhY2tzLmFkZCgnYWZ0ZXJTYXZlTWVzc2FnZScsIHRoaXMub25Sb2NrZXRNZXNzYWdlLmJpbmQodGhpcyksIFJvY2tldENoYXQuY2FsbGJhY2tzLnByaW9yaXR5LkxPVywgJ1NsYWNrQnJpZGdlX091dCcpO1xuXHRcdFJvY2tldENoYXQuY2FsbGJhY2tzLmFkZCgnYWZ0ZXJEZWxldGVNZXNzYWdlJywgdGhpcy5vblJvY2tldE1lc3NhZ2VEZWxldGUuYmluZCh0aGlzKSwgUm9ja2V0Q2hhdC5jYWxsYmFja3MucHJpb3JpdHkuTE9XLCAnU2xhY2tCcmlkZ2VfRGVsZXRlJyk7XG5cdFx0Um9ja2V0Q2hhdC5jYWxsYmFja3MuYWRkKCdzZXRSZWFjdGlvbicsIHRoaXMub25Sb2NrZXRTZXRSZWFjdGlvbi5iaW5kKHRoaXMpLCBSb2NrZXRDaGF0LmNhbGxiYWNrcy5wcmlvcml0eS5MT1csICdTbGFja0JyaWRnZV9TZXRSZWFjdGlvbicpO1xuXHRcdFJvY2tldENoYXQuY2FsbGJhY2tzLmFkZCgndW5zZXRSZWFjdGlvbicsIHRoaXMub25Sb2NrZXRVblNldFJlYWN0aW9uLmJpbmQodGhpcyksIFJvY2tldENoYXQuY2FsbGJhY2tzLnByaW9yaXR5LkxPVywgJ1NsYWNrQnJpZGdlX1VuU2V0UmVhY3Rpb24nKTtcblx0fVxuXG5cdHVucmVnaXN0ZXJGb3JSb2NrZXRFdmVudHMoKSB7XG5cdFx0Um9ja2V0Q2hhdC5jYWxsYmFja3MucmVtb3ZlKCdhZnRlclNhdmVNZXNzYWdlJywgJ1NsYWNrQnJpZGdlX091dCcpO1xuXHRcdFJvY2tldENoYXQuY2FsbGJhY2tzLnJlbW92ZSgnYWZ0ZXJEZWxldGVNZXNzYWdlJywgJ1NsYWNrQnJpZGdlX0RlbGV0ZScpO1xuXHRcdFJvY2tldENoYXQuY2FsbGJhY2tzLnJlbW92ZSgnc2V0UmVhY3Rpb24nLCAnU2xhY2tCcmlkZ2VfU2V0UmVhY3Rpb24nKTtcblx0XHRSb2NrZXRDaGF0LmNhbGxiYWNrcy5yZW1vdmUoJ3Vuc2V0UmVhY3Rpb24nLCAnU2xhY2tCcmlkZ2VfVW5TZXRSZWFjdGlvbicpO1xuXHR9XG5cblx0cmVnaXN0ZXJGb3JTbGFja0V2ZW50cygpIHtcblx0XHRjb25zdCBDTElFTlRfRVZFTlRTID0gdGhpcy5zbGFja0NsaWVudC5DTElFTlRfRVZFTlRTO1xuXHRcdHRoaXMucnRtLm9uKENMSUVOVF9FVkVOVFMuUlRNLkFVVEhFTlRJQ0FURUQsICgpID0+IHtcblx0XHRcdGxvZ2dlci5jb25uZWN0aW9uLmluZm8oJ0Nvbm5lY3RlZCB0byBTbGFjaycpO1xuXHRcdH0pO1xuXG5cdFx0dGhpcy5ydG0ub24oQ0xJRU5UX0VWRU5UUy5SVE0uVU5BQkxFX1RPX1JUTV9TVEFSVCwgKCkgPT4ge1xuXHRcdFx0dGhpcy5kaXNjb25uZWN0KCk7XG5cdFx0fSk7XG5cblx0XHR0aGlzLnJ0bS5vbihDTElFTlRfRVZFTlRTLlJUTS5ESVNDT05ORUNULCAoKSA9PiB7XG5cdFx0XHR0aGlzLmRpc2Nvbm5lY3QoKTtcblx0XHR9KTtcblxuXHRcdGNvbnN0IFJUTV9FVkVOVFMgPSB0aGlzLnNsYWNrQ2xpZW50LlJUTV9FVkVOVFM7XG5cblx0XHQvKipcblx0XHQqIEV2ZW50IGZpcmVkIHdoZW4gc29tZW9uZSBtZXNzYWdlcyBhIGNoYW5uZWwgdGhlIGJvdCBpcyBpblxuXHRcdCoge1xuXHRcdCpcdHR5cGU6ICdtZXNzYWdlJyxcblx0XHQqIFx0Y2hhbm5lbDogW2NoYW5uZWxfaWRdLFxuXHRcdCogXHR1c2VyOiBbdXNlcl9pZF0sXG5cdFx0KiBcdHRleHQ6IFttZXNzYWdlXSxcblx0XHQqIFx0dHM6IFt0cy5taWxsaV0sXG5cdFx0KiBcdHRlYW06IFt0ZWFtX2lkXSxcblx0XHQqIFx0c3VidHlwZTogW21lc3NhZ2Vfc3VidHlwZV0sXG5cdFx0KiBcdGludml0ZXI6IFttZXNzYWdlX3N1YnR5cGUgPSAnZ3JvdXBfam9pbnxjaGFubmVsX2pvaW4nIC0+IHVzZXJfaWRdXG5cdFx0KiB9XG5cdFx0KiovXG5cdFx0dGhpcy5ydG0ub24oUlRNX0VWRU5UUy5NRVNTQUdFLCBNZXRlb3IuYmluZEVudmlyb25tZW50KChzbGFja01lc3NhZ2UpID0+IHtcblx0XHRcdGxvZ2dlci5ldmVudHMuZGVidWcoJ09uU2xhY2tFdmVudC1NRVNTQUdFOiAnLCBzbGFja01lc3NhZ2UpO1xuXHRcdFx0aWYgKHNsYWNrTWVzc2FnZSkge1xuXHRcdFx0XHR0aGlzLm9uU2xhY2tNZXNzYWdlKHNsYWNrTWVzc2FnZSk7XG5cdFx0XHR9XG5cdFx0fSkpO1xuXG5cdFx0dGhpcy5ydG0ub24oUlRNX0VWRU5UUy5SRUFDVElPTl9BRERFRCwgTWV0ZW9yLmJpbmRFbnZpcm9ubWVudCgocmVhY3Rpb25Nc2cpID0+IHtcblx0XHRcdGxvZ2dlci5ldmVudHMuZGVidWcoJ09uU2xhY2tFdmVudC1SRUFDVElPTl9BRERFRDogJywgcmVhY3Rpb25Nc2cpO1xuXHRcdFx0aWYgKHJlYWN0aW9uTXNnKSB7XG5cdFx0XHRcdHRoaXMub25TbGFja1JlYWN0aW9uQWRkZWQocmVhY3Rpb25Nc2cpO1xuXHRcdFx0fVxuXHRcdH0pKTtcblxuXHRcdHRoaXMucnRtLm9uKFJUTV9FVkVOVFMuUkVBQ1RJT05fUkVNT1ZFRCwgTWV0ZW9yLmJpbmRFbnZpcm9ubWVudCgocmVhY3Rpb25Nc2cpID0+IHtcblx0XHRcdGxvZ2dlci5ldmVudHMuZGVidWcoJ09uU2xhY2tFdmVudC1SRUFDVElPTl9SRU1PVkVEOiAnLCByZWFjdGlvbk1zZyk7XG5cdFx0XHRpZiAocmVhY3Rpb25Nc2cpIHtcblx0XHRcdFx0dGhpcy5vblNsYWNrUmVhY3Rpb25SZW1vdmVkKHJlYWN0aW9uTXNnKTtcblx0XHRcdH1cblx0XHR9KSk7XG5cblx0XHQvKipcblx0XHQqIEV2ZW50IGZpcmVkIHdoZW4gc29tZW9uZSBjcmVhdGVzIGEgcHVibGljIGNoYW5uZWxcblx0XHQqIHtcblx0XHQqXHR0eXBlOiAnY2hhbm5lbF9jcmVhdGVkJyxcblx0XHQqXHRjaGFubmVsOiB7XG5cdFx0Klx0XHRpZDogW2NoYW5uZWxfaWRdLFxuXHRcdCpcdFx0aXNfY2hhbm5lbDogdHJ1ZSxcblx0XHQqXHRcdG5hbWU6IFtjaGFubmVsX25hbWVdLFxuXHRcdCpcdFx0Y3JlYXRlZDogW3RzXSxcblx0XHQqXHRcdGNyZWF0b3I6IFt1c2VyX2lkXSxcblx0XHQqXHRcdGlzX3NoYXJlZDogZmFsc2UsXG5cdFx0Klx0XHRpc19vcmdfc2hhcmVkOiBmYWxzZVxuXHRcdCpcdH0sXG5cdFx0Klx0ZXZlbnRfdHM6IFt0cy5taWxsaV1cblx0XHQqIH1cblx0XHQqKi9cblx0XHR0aGlzLnJ0bS5vbihSVE1fRVZFTlRTLkNIQU5ORUxfQ1JFQVRFRCwgTWV0ZW9yLmJpbmRFbnZpcm9ubWVudCgoKSA9PiB7fSkpO1xuXG5cdFx0LyoqXG5cdFx0KiBFdmVudCBmaXJlZCB3aGVuIHRoZSBib3Qgam9pbnMgYSBwdWJsaWMgY2hhbm5lbFxuXHRcdCoge1xuXHRcdCogXHR0eXBlOiAnY2hhbm5lbF9qb2luZWQnLFxuXHRcdCogXHRjaGFubmVsOiB7XG5cdFx0KiBcdFx0aWQ6IFtjaGFubmVsX2lkXSxcblx0XHQqIFx0XHRuYW1lOiBbY2hhbm5lbF9uYW1lXSxcblx0XHQqIFx0XHRpc19jaGFubmVsOiB0cnVlLFxuXHRcdCogXHRcdGNyZWF0ZWQ6IFt0c10sXG5cdFx0KiBcdFx0Y3JlYXRvcjogW3VzZXJfaWRdLFxuXHRcdCogXHRcdGlzX2FyY2hpdmVkOiBmYWxzZSxcblx0XHQqIFx0XHRpc19nZW5lcmFsOiBmYWxzZSxcblx0XHQqIFx0XHRpc19tZW1iZXI6IHRydWUsXG5cdFx0KiBcdFx0bGFzdF9yZWFkOiBbdHMubWlsbGldLFxuXHRcdCogXHRcdGxhdGVzdDogW21lc3NhZ2Vfb2JqXSxcblx0XHQqIFx0XHR1bnJlYWRfY291bnQ6IDAsXG5cdFx0KiBcdFx0dW5yZWFkX2NvdW50X2Rpc3BsYXk6IDAsXG5cdFx0KiBcdFx0bWVtYmVyczogWyB1c2VyX2lkcyBdLFxuXHRcdCogXHRcdHRvcGljOiB7XG5cdFx0KiBcdFx0XHR2YWx1ZTogW2NoYW5uZWxfdG9waWNdLFxuXHRcdCogXHRcdFx0Y3JlYXRvcjogW3VzZXJfaWRdLFxuXHRcdCogXHRcdFx0bGFzdF9zZXQ6IDBcblx0XHQqIFx0XHR9LFxuXHRcdCogXHRcdHB1cnBvc2U6IHtcblx0XHQqIFx0XHRcdHZhbHVlOiBbY2hhbm5lbF9wdXJwb3NlXSxcblx0XHQqIFx0XHRcdGNyZWF0b3I6IFt1c2VyX2lkXSxcblx0XHQqIFx0XHRcdGxhc3Rfc2V0OiAwXG5cdFx0KiBcdFx0fVxuXHRcdCogXHR9XG5cdFx0KiB9XG5cdFx0KiovXG5cdFx0dGhpcy5ydG0ub24oUlRNX0VWRU5UUy5DSEFOTkVMX0pPSU5FRCwgTWV0ZW9yLmJpbmRFbnZpcm9ubWVudCgoKSA9PiB7fSkpO1xuXG5cdFx0LyoqXG5cdFx0KiBFdmVudCBmaXJlZCB3aGVuIHRoZSBib3QgbGVhdmVzIChvciBpcyByZW1vdmVkIGZyb20pIGEgcHVibGljIGNoYW5uZWxcblx0XHQqIHtcblx0XHQqIFx0dHlwZTogJ2NoYW5uZWxfbGVmdCcsXG5cdFx0KiBcdGNoYW5uZWw6IFtjaGFubmVsX2lkXVxuXHRcdCogfVxuXHRcdCoqL1xuXHRcdHRoaXMucnRtLm9uKFJUTV9FVkVOVFMuQ0hBTk5FTF9MRUZULCBNZXRlb3IuYmluZEVudmlyb25tZW50KCgpID0+IHt9KSk7XG5cblx0XHQvKipcblx0XHQqIEV2ZW50IGZpcmVkIHdoZW4gYW4gYXJjaGl2ZWQgY2hhbm5lbCBpcyBkZWxldGVkIGJ5IGFuIGFkbWluXG5cdFx0KiB7XG5cdFx0KiBcdHR5cGU6ICdjaGFubmVsX2RlbGV0ZWQnLFxuXHRcdCogXHRjaGFubmVsOiBbY2hhbm5lbF9pZF0sXG5cdFx0Klx0ZXZlbnRfdHM6IFt0cy5taWxsaV1cblx0XHQqIH1cblx0XHQqKi9cblx0XHR0aGlzLnJ0bS5vbihSVE1fRVZFTlRTLkNIQU5ORUxfREVMRVRFRCwgTWV0ZW9yLmJpbmRFbnZpcm9ubWVudCgoKSA9PiB7fSkpO1xuXG5cdFx0LyoqXG5cdFx0KiBFdmVudCBmaXJlZCB3aGVuIHRoZSBjaGFubmVsIGhhcyBpdHMgbmFtZSBjaGFuZ2VkXG5cdFx0KiB7XG5cdFx0KiBcdHR5cGU6ICdjaGFubmVsX3JlbmFtZScsXG5cdFx0KiBcdGNoYW5uZWw6IHtcblx0XHQqIFx0XHRpZDogW2NoYW5uZWxfaWRdLFxuXHRcdCogXHRcdG5hbWU6IFtjaGFubmVsX25hbWVdLFxuXHRcdCogXHRcdGlzX2NoYW5uZWw6IHRydWUsXG5cdFx0KiBcdFx0Y3JlYXRlZDogW3RzXVxuXHRcdCogXHR9LFxuXHRcdCpcdGV2ZW50X3RzOiBbdHMubWlsbGldXG5cdFx0KiB9XG5cdFx0KiovXG5cdFx0dGhpcy5ydG0ub24oUlRNX0VWRU5UUy5DSEFOTkVMX1JFTkFNRSwgTWV0ZW9yLmJpbmRFbnZpcm9ubWVudCgoKSA9PiB7fSkpO1xuXG5cdFx0LyoqXG5cdFx0KiBFdmVudCBmaXJlZCB3aGVuIHRoZSBib3Qgam9pbnMgYSBwcml2YXRlIGNoYW5uZWxcblx0XHQqIHtcblx0XHQqIFx0dHlwZTogJ2dyb3VwX2pvaW5lZCcsXG5cdFx0KiBcdGNoYW5uZWw6IHtcblx0XHQqIFx0XHRpZDogW2NoYW5uZWxfaWRdLFxuXHRcdCogXHRcdG5hbWU6IFtjaGFubmVsX25hbWVdLFxuXHRcdCogXHRcdGlzX2dyb3VwOiB0cnVlLFxuXHRcdCogXHRcdGNyZWF0ZWQ6IFt0c10sXG5cdFx0KiBcdFx0Y3JlYXRvcjogW3VzZXJfaWRdLFxuXHRcdCogXHRcdGlzX2FyY2hpdmVkOiBmYWxzZSxcblx0XHQqIFx0XHRpc19tcGltOiBmYWxzZSxcblx0XHQqIFx0XHRpc19vcGVuOiB0cnVlLFxuXHRcdCogXHRcdGxhc3RfcmVhZDogW3RzLm1pbGxpXSxcblx0XHQqIFx0XHRsYXRlc3Q6IFttZXNzYWdlX29ial0sXG5cdFx0KiBcdFx0dW5yZWFkX2NvdW50OiAwLFxuXHRcdCogXHRcdHVucmVhZF9jb3VudF9kaXNwbGF5OiAwLFxuXHRcdCogXHRcdG1lbWJlcnM6IFsgdXNlcl9pZHMgXSxcblx0XHQqIFx0XHR0b3BpYzoge1xuXHRcdCogXHRcdFx0dmFsdWU6IFtjaGFubmVsX3RvcGljXSxcblx0XHQqIFx0XHRcdGNyZWF0b3I6IFt1c2VyX2lkXSxcblx0XHQqIFx0XHRcdGxhc3Rfc2V0OiAwXG5cdFx0KiBcdFx0fSxcblx0XHQqIFx0XHRwdXJwb3NlOiB7XG5cdFx0KiBcdFx0XHR2YWx1ZTogW2NoYW5uZWxfcHVycG9zZV0sXG5cdFx0KiBcdFx0XHRjcmVhdG9yOiBbdXNlcl9pZF0sXG5cdFx0KiBcdFx0XHRsYXN0X3NldDogMFxuXHRcdCogXHRcdH1cblx0XHQqIFx0fVxuXHRcdCogfVxuXHRcdCoqL1xuXHRcdHRoaXMucnRtLm9uKFJUTV9FVkVOVFMuR1JPVVBfSk9JTkVELCBNZXRlb3IuYmluZEVudmlyb25tZW50KCgpID0+IHt9KSk7XG5cblx0XHQvKipcblx0XHQqIEV2ZW50IGZpcmVkIHdoZW4gdGhlIGJvdCBsZWF2ZXMgKG9yIGlzIHJlbW92ZWQgZnJvbSkgYSBwcml2YXRlIGNoYW5uZWxcblx0XHQqIHtcblx0XHQqIFx0dHlwZTogJ2dyb3VwX2xlZnQnLFxuXHRcdCogXHRjaGFubmVsOiBbY2hhbm5lbF9pZF1cblx0XHQqIH1cblx0XHQqKi9cblx0XHR0aGlzLnJ0bS5vbihSVE1fRVZFTlRTLkdST1VQX0xFRlQsIE1ldGVvci5iaW5kRW52aXJvbm1lbnQoKCkgPT4ge30pKTtcblxuXHRcdC8qKlxuXHRcdCogRXZlbnQgZmlyZWQgd2hlbiB0aGUgcHJpdmF0ZSBjaGFubmVsIGhhcyBpdHMgbmFtZSBjaGFuZ2VkXG5cdFx0KiB7XG5cdFx0KiBcdHR5cGU6ICdncm91cF9yZW5hbWUnLFxuXHRcdCogXHRjaGFubmVsOiB7XG5cdFx0KiBcdFx0aWQ6IFtjaGFubmVsX2lkXSxcblx0XHQqIFx0XHRuYW1lOiBbY2hhbm5lbF9uYW1lXSxcblx0XHQqIFx0XHRpc19ncm91cDogdHJ1ZSxcblx0XHQqIFx0XHRjcmVhdGVkOiBbdHNdXG5cdFx0KiBcdH0sXG5cdFx0Klx0ZXZlbnRfdHM6IFt0cy5taWxsaV1cblx0XHQqIH1cblx0XHQqKi9cblx0XHR0aGlzLnJ0bS5vbihSVE1fRVZFTlRTLkdST1VQX1JFTkFNRSwgTWV0ZW9yLmJpbmRFbnZpcm9ubWVudCgoKSA9PiB7fSkpO1xuXG5cdFx0LyoqXG5cdFx0KiBFdmVudCBmaXJlZCB3aGVuIGEgbmV3IHVzZXIgam9pbnMgdGhlIHRlYW1cblx0XHQqIHtcblx0XHQqIFx0dHlwZTogJ3RlYW1fam9pbicsXG5cdFx0KiBcdHVzZXI6XG5cdFx0KiBcdHtcblx0XHQqIFx0XHRpZDogW3VzZXJfaWRdLFxuXHRcdCogXHRcdHRlYW1faWQ6IFt0ZWFtX2lkXSxcblx0XHQqIFx0XHRuYW1lOiBbdXNlcl9uYW1lXSxcblx0XHQqIFx0XHRkZWxldGVkOiBmYWxzZSxcblx0XHQqIFx0XHRzdGF0dXM6IG51bGwsXG5cdFx0KiBcdFx0Y29sb3I6IFtjb2xvcl9jb2RlXSxcblx0XHQqIFx0XHRyZWFsX25hbWU6ICcnLFxuXHRcdCogXHRcdHR6OiBbdGltZXpvbmVdLFxuXHRcdCogXHRcdHR6X2xhYmVsOiBbdGltZXpvbmVfbGFiZWxdLFxuXHRcdCogXHRcdHR6X29mZnNldDogW3RpbWV6b25lX29mZnNldF0sXG5cdFx0KiBcdFx0cHJvZmlsZTpcblx0XHQqIFx0XHR7XG5cdFx0KiBcdFx0XHRhdmF0YXJfaGFzaDogJycsXG5cdFx0KiBcdFx0XHRyZWFsX25hbWU6ICcnLFxuXHRcdCogXHRcdFx0cmVhbF9uYW1lX25vcm1hbGl6ZWQ6ICcnLFxuXHRcdCogXHRcdFx0ZW1haWw6ICcnLFxuXHRcdCogXHRcdFx0aW1hZ2VfMjQ6ICcnLFxuXHRcdCogXHRcdFx0aW1hZ2VfMzI6ICcnLFxuXHRcdCogXHRcdFx0aW1hZ2VfNDg6ICcnLFxuXHRcdCogXHRcdFx0aW1hZ2VfNzI6ICcnLFxuXHRcdCogXHRcdFx0aW1hZ2VfMTkyOiAnJyxcblx0XHQqIFx0XHRcdGltYWdlXzUxMjogJycsXG5cdFx0KiBcdFx0XHRmaWVsZHM6IG51bGxcblx0XHQqIFx0XHR9LFxuXHRcdCogXHRcdGlzX2FkbWluOiBmYWxzZSxcblx0XHQqIFx0XHRpc19vd25lcjogZmFsc2UsXG5cdFx0KiBcdFx0aXNfcHJpbWFyeV9vd25lcjogZmFsc2UsXG5cdFx0KiBcdFx0aXNfcmVzdHJpY3RlZDogZmFsc2UsXG5cdFx0KiBcdFx0aXNfdWx0cmFfcmVzdHJpY3RlZDogZmFsc2UsXG5cdFx0KiBcdFx0aXNfYm90OiBmYWxzZSxcblx0XHQqIFx0XHRwcmVzZW5jZTogW3VzZXJfcHJlc2VuY2VdXG5cdFx0KiBcdH0sXG5cdFx0KiBcdGNhY2hlX3RzOiBbdHNdXG5cdFx0KiB9XG5cdFx0KiovXG5cdFx0dGhpcy5ydG0ub24oUlRNX0VWRU5UUy5URUFNX0pPSU4sIE1ldGVvci5iaW5kRW52aXJvbm1lbnQoKCkgPT4ge30pKTtcblx0fVxuXG5cdGZpbmRTbGFja0NoYW5uZWwocm9ja2V0Q2hhbm5lbE5hbWUpIHtcblx0XHRsb2dnZXIuY2xhc3MuZGVidWcoJ1NlYXJjaGluZyBmb3IgU2xhY2sgY2hhbm5lbCBvciBncm91cCcsIHJvY2tldENoYW5uZWxOYW1lKTtcblx0XHRsZXQgcmVzcG9uc2UgPSBIVFRQLmdldCgnaHR0cHM6Ly9zbGFjay5jb20vYXBpL2NoYW5uZWxzLmxpc3QnLCB7IHBhcmFtczogeyB0b2tlbjogdGhpcy5hcGlUb2tlbiB9IH0pO1xuXHRcdGlmIChyZXNwb25zZSAmJiByZXNwb25zZS5kYXRhICYmIF8uaXNBcnJheShyZXNwb25zZS5kYXRhLmNoYW5uZWxzKSAmJiByZXNwb25zZS5kYXRhLmNoYW5uZWxzLmxlbmd0aCA+IDApIHtcblx0XHRcdGZvciAoY29uc3QgY2hhbm5lbCBvZiByZXNwb25zZS5kYXRhLmNoYW5uZWxzKSB7XG5cdFx0XHRcdGlmIChjaGFubmVsLm5hbWUgPT09IHJvY2tldENoYW5uZWxOYW1lICYmIGNoYW5uZWwuaXNfbWVtYmVyID09PSB0cnVlKSB7XG5cdFx0XHRcdFx0cmV0dXJuIGNoYW5uZWw7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdFx0cmVzcG9uc2UgPSBIVFRQLmdldCgnaHR0cHM6Ly9zbGFjay5jb20vYXBpL2dyb3Vwcy5saXN0JywgeyBwYXJhbXM6IHsgdG9rZW46IHRoaXMuYXBpVG9rZW4gfSB9KTtcblx0XHRpZiAocmVzcG9uc2UgJiYgcmVzcG9uc2UuZGF0YSAmJiBfLmlzQXJyYXkocmVzcG9uc2UuZGF0YS5ncm91cHMpICYmIHJlc3BvbnNlLmRhdGEuZ3JvdXBzLmxlbmd0aCA+IDApIHtcblx0XHRcdGZvciAoY29uc3QgZ3JvdXAgb2YgcmVzcG9uc2UuZGF0YS5ncm91cHMpIHtcblx0XHRcdFx0aWYgKGdyb3VwLm5hbWUgPT09IHJvY2tldENoYW5uZWxOYW1lKSB7XG5cdFx0XHRcdFx0cmV0dXJuIGdyb3VwO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0aW1wb3J0RnJvbUhpc3RvcnkoZmFtaWx5LCBvcHRpb25zKSB7XG5cdFx0bG9nZ2VyLmNsYXNzLmRlYnVnKCdJbXBvcnRpbmcgbWVzc2FnZXMgaGlzdG9yeScpO1xuXHRcdGNvbnN0IHJlc3BvbnNlID0gSFRUUC5nZXQoYGh0dHBzOi8vc2xhY2suY29tL2FwaS8keyBmYW1pbHkgfS5oaXN0b3J5YCwgeyBwYXJhbXM6IF8uZXh0ZW5kKHsgdG9rZW46IHRoaXMuYXBpVG9rZW4gfSwgb3B0aW9ucykgfSk7XG5cdFx0aWYgKHJlc3BvbnNlICYmIHJlc3BvbnNlLmRhdGEgJiYgXy5pc0FycmF5KHJlc3BvbnNlLmRhdGEubWVzc2FnZXMpICYmIHJlc3BvbnNlLmRhdGEubWVzc2FnZXMubGVuZ3RoID4gMCkge1xuXHRcdFx0bGV0IGxhdGVzdCA9IDA7XG5cdFx0XHRmb3IgKGNvbnN0IG1lc3NhZ2Ugb2YgcmVzcG9uc2UuZGF0YS5tZXNzYWdlcy5yZXZlcnNlKCkpIHtcblx0XHRcdFx0bG9nZ2VyLmNsYXNzLmRlYnVnKCdNRVNTQUdFOiAnLCBtZXNzYWdlKTtcblx0XHRcdFx0aWYgKCFsYXRlc3QgfHwgbWVzc2FnZS50cyA+IGxhdGVzdCkge1xuXHRcdFx0XHRcdGxhdGVzdCA9IG1lc3NhZ2UudHM7XG5cdFx0XHRcdH1cblx0XHRcdFx0bWVzc2FnZS5jaGFubmVsID0gb3B0aW9ucy5jaGFubmVsO1xuXHRcdFx0XHR0aGlzLm9uU2xhY2tNZXNzYWdlKG1lc3NhZ2UsIHRydWUpO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIHsgaGFzX21vcmU6IHJlc3BvbnNlLmRhdGEuaGFzX21vcmUsIHRzOiBsYXRlc3QgfTtcblx0XHR9XG5cdH1cblxuXHRjb3B5U2xhY2tDaGFubmVsSW5mbyhyaWQsIGNoYW5uZWxNYXApIHtcblx0XHRsb2dnZXIuY2xhc3MuZGVidWcoJ0NvcHlpbmcgdXNlcnMgZnJvbSBTbGFjayBjaGFubmVsIHRvIFJvY2tldC5DaGF0JywgY2hhbm5lbE1hcC5pZCwgcmlkKTtcblx0XHRjb25zdCByZXNwb25zZSA9IEhUVFAuZ2V0KGBodHRwczovL3NsYWNrLmNvbS9hcGkvJHsgY2hhbm5lbE1hcC5mYW1pbHkgfS5pbmZvYCwgeyBwYXJhbXM6IHsgdG9rZW46IHRoaXMuYXBpVG9rZW4sIGNoYW5uZWw6IGNoYW5uZWxNYXAuaWQgfSB9KTtcblx0XHRpZiAocmVzcG9uc2UgJiYgcmVzcG9uc2UuZGF0YSkge1xuXHRcdFx0Y29uc3QgZGF0YSA9IGNoYW5uZWxNYXAuZmFtaWx5ID09PSAnY2hhbm5lbHMnID8gcmVzcG9uc2UuZGF0YS5jaGFubmVsIDogcmVzcG9uc2UuZGF0YS5ncm91cDtcblx0XHRcdGlmIChkYXRhICYmIF8uaXNBcnJheShkYXRhLm1lbWJlcnMpICYmIGRhdGEubWVtYmVycy5sZW5ndGggPiAwKSB7XG5cdFx0XHRcdGZvciAoY29uc3QgbWVtYmVyIG9mIGRhdGEubWVtYmVycykge1xuXHRcdFx0XHRcdGNvbnN0IHVzZXIgPSB0aGlzLmZpbmRSb2NrZXRVc2VyKG1lbWJlcikgfHwgdGhpcy5hZGRSb2NrZXRVc2VyKG1lbWJlcik7XG5cdFx0XHRcdFx0aWYgKHVzZXIpIHtcblx0XHRcdFx0XHRcdGxvZ2dlci5jbGFzcy5kZWJ1ZygnQWRkaW5nIHVzZXIgdG8gcm9vbScsIHVzZXIudXNlcm5hbWUsIHJpZCk7XG5cdFx0XHRcdFx0XHRSb2NrZXRDaGF0LmFkZFVzZXJUb1Jvb20ocmlkLCB1c2VyLCBudWxsLCB0cnVlKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0bGV0IHRvcGljID0gJyc7XG5cdFx0XHRsZXQgdG9waWNfbGFzdF9zZXQgPSAwO1xuXHRcdFx0bGV0IHRvcGljX2NyZWF0b3IgPSBudWxsO1xuXHRcdFx0aWYgKGRhdGEgJiYgZGF0YS50b3BpYyAmJiBkYXRhLnRvcGljLnZhbHVlKSB7XG5cdFx0XHRcdHRvcGljID0gZGF0YS50b3BpYy52YWx1ZTtcblx0XHRcdFx0dG9waWNfbGFzdF9zZXQgPSBkYXRhLnRvcGljLmxhc3Rfc2V0O1xuXHRcdFx0XHR0b3BpY19jcmVhdG9yID0gZGF0YS50b3BpYy5jcmVhdG9yO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoZGF0YSAmJiBkYXRhLnB1cnBvc2UgJiYgZGF0YS5wdXJwb3NlLnZhbHVlKSB7XG5cdFx0XHRcdGlmICh0b3BpY19sYXN0X3NldCkge1xuXHRcdFx0XHRcdGlmICh0b3BpY19sYXN0X3NldCA8IGRhdGEucHVycG9zZS5sYXN0X3NldCkge1xuXHRcdFx0XHRcdFx0dG9waWMgPSBkYXRhLnB1cnBvc2UudG9waWM7XG5cdFx0XHRcdFx0XHR0b3BpY19jcmVhdG9yID0gZGF0YS5wdXJwb3NlLmNyZWF0b3I7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHRvcGljID0gZGF0YS5wdXJwb3NlLnRvcGljO1xuXHRcdFx0XHRcdHRvcGljX2NyZWF0b3IgPSBkYXRhLnB1cnBvc2UuY3JlYXRvcjtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHRpZiAodG9waWMpIHtcblx0XHRcdFx0Y29uc3QgY3JlYXRvciA9IHRoaXMuZmluZFJvY2tldFVzZXIodG9waWNfY3JlYXRvcikgfHwgdGhpcy5hZGRSb2NrZXRVc2VyKHRvcGljX2NyZWF0b3IpO1xuXHRcdFx0XHRsb2dnZXIuY2xhc3MuZGVidWcoJ1NldHRpbmcgcm9vbSB0b3BpYycsIHJpZCwgdG9waWMsIGNyZWF0b3IudXNlcm5hbWUpO1xuXHRcdFx0XHRSb2NrZXRDaGF0LnNhdmVSb29tVG9waWMocmlkLCB0b3BpYywgY3JlYXRvciwgZmFsc2UpO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdGNvcHlQaW5zKHJpZCwgY2hhbm5lbE1hcCkge1xuXHRcdGNvbnN0IHJlc3BvbnNlID0gSFRUUC5nZXQoJ2h0dHBzOi8vc2xhY2suY29tL2FwaS9waW5zLmxpc3QnLCB7IHBhcmFtczogeyB0b2tlbjogdGhpcy5hcGlUb2tlbiwgY2hhbm5lbDogY2hhbm5lbE1hcC5pZCB9IH0pO1xuXHRcdGlmIChyZXNwb25zZSAmJiByZXNwb25zZS5kYXRhICYmIF8uaXNBcnJheShyZXNwb25zZS5kYXRhLml0ZW1zKSAmJiByZXNwb25zZS5kYXRhLml0ZW1zLmxlbmd0aCA+IDApIHtcblx0XHRcdGZvciAoY29uc3QgcGluIG9mIHJlc3BvbnNlLmRhdGEuaXRlbXMpIHtcblx0XHRcdFx0aWYgKHBpbi5tZXNzYWdlKSB7XG5cdFx0XHRcdFx0Y29uc3QgdXNlciA9IHRoaXMuZmluZFJvY2tldFVzZXIocGluLm1lc3NhZ2UudXNlcik7XG5cdFx0XHRcdFx0Y29uc3QgbXNnT2JqID0ge1xuXHRcdFx0XHRcdFx0cmlkLFxuXHRcdFx0XHRcdFx0dDogJ21lc3NhZ2VfcGlubmVkJyxcblx0XHRcdFx0XHRcdG1zZzogJycsXG5cdFx0XHRcdFx0XHR1OiB7XG5cdFx0XHRcdFx0XHRcdF9pZDogdXNlci5faWQsXG5cdFx0XHRcdFx0XHRcdHVzZXJuYW1lOiB1c2VyLnVzZXJuYW1lXG5cdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0YXR0YWNobWVudHM6IFt7XG5cdFx0XHRcdFx0XHRcdCd0ZXh0JyA6IHRoaXMuY29udmVydFNsYWNrTXNnVHh0VG9Sb2NrZXRUeHRGb3JtYXQocGluLm1lc3NhZ2UudGV4dCksXG5cdFx0XHRcdFx0XHRcdCdhdXRob3JfbmFtZScgOiB1c2VyLnVzZXJuYW1lLFxuXHRcdFx0XHRcdFx0XHQnYXV0aG9yX2ljb24nIDogZ2V0QXZhdGFyVXJsRnJvbVVzZXJuYW1lKHVzZXIudXNlcm5hbWUpLFxuXHRcdFx0XHRcdFx0XHQndHMnIDogbmV3IERhdGUocGFyc2VJbnQocGluLm1lc3NhZ2UudHMuc3BsaXQoJy4nKVswXSkgKiAxMDAwKVxuXHRcdFx0XHRcdFx0fV1cblx0XHRcdFx0XHR9O1xuXG5cdFx0XHRcdFx0Um9ja2V0Q2hhdC5tb2RlbHMuTWVzc2FnZXMuc2V0UGlubmVkQnlJZEFuZFVzZXJJZChgc2xhY2stJHsgcGluLmNoYW5uZWwgfS0keyBwaW4ubWVzc2FnZS50cy5yZXBsYWNlKC9cXC4vZywgJy0nKSB9YCwgbXNnT2JqLnUsIHRydWUsIG5ldyBEYXRlKHBhcnNlSW50KHBpbi5tZXNzYWdlLnRzLnNwbGl0KCcuJylbMF0pICogMTAwMCkpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0aW1wb3J0TWVzc2FnZXMocmlkLCBjYWxsYmFjaykge1xuXHRcdGxvZ2dlci5jbGFzcy5pbmZvKCdpbXBvcnRNZXNzYWdlczogJywgcmlkKTtcblx0XHRjb25zdCByb2NrZXRjaGF0X3Jvb20gPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT25lQnlJZChyaWQpO1xuXHRcdGlmIChyb2NrZXRjaGF0X3Jvb20pIHtcblx0XHRcdGlmICh0aGlzLnNsYWNrQ2hhbm5lbE1hcFtyaWRdKSB7XG5cdFx0XHRcdHRoaXMuY29weVNsYWNrQ2hhbm5lbEluZm8ocmlkLCB0aGlzLnNsYWNrQ2hhbm5lbE1hcFtyaWRdKTtcblxuXHRcdFx0XHRsb2dnZXIuY2xhc3MuZGVidWcoJ0ltcG9ydGluZyBtZXNzYWdlcyBmcm9tIFNsYWNrIHRvIFJvY2tldC5DaGF0JywgdGhpcy5zbGFja0NoYW5uZWxNYXBbcmlkXSwgcmlkKTtcblx0XHRcdFx0bGV0IHJlc3VsdHMgPSB0aGlzLmltcG9ydEZyb21IaXN0b3J5KHRoaXMuc2xhY2tDaGFubmVsTWFwW3JpZF0uZmFtaWx5LCB7IGNoYW5uZWw6IHRoaXMuc2xhY2tDaGFubmVsTWFwW3JpZF0uaWQsIG9sZGVzdDogMSB9KTtcblx0XHRcdFx0d2hpbGUgKHJlc3VsdHMgJiYgcmVzdWx0cy5oYXNfbW9yZSkge1xuXHRcdFx0XHRcdHJlc3VsdHMgPSB0aGlzLmltcG9ydEZyb21IaXN0b3J5KHRoaXMuc2xhY2tDaGFubmVsTWFwW3JpZF0uZmFtaWx5LCB7IGNoYW5uZWw6IHRoaXMuc2xhY2tDaGFubmVsTWFwW3JpZF0uaWQsIG9sZGVzdDogcmVzdWx0cy50cyB9KTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGxvZ2dlci5jbGFzcy5kZWJ1ZygnUGlubmluZyBTbGFjayBjaGFubmVsIG1lc3NhZ2VzIHRvIFJvY2tldC5DaGF0JywgdGhpcy5zbGFja0NoYW5uZWxNYXBbcmlkXSwgcmlkKTtcblx0XHRcdFx0dGhpcy5jb3B5UGlucyhyaWQsIHRoaXMuc2xhY2tDaGFubmVsTWFwW3JpZF0pO1xuXG5cdFx0XHRcdHJldHVybiBjYWxsYmFjaygpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Y29uc3Qgc2xhY2tfcm9vbSA9IHRoaXMuZmluZFNsYWNrQ2hhbm5lbChyb2NrZXRjaGF0X3Jvb20ubmFtZSk7XG5cdFx0XHRcdGlmIChzbGFja19yb29tKSB7XG5cdFx0XHRcdFx0dGhpcy5zbGFja0NoYW5uZWxNYXBbcmlkXSA9IHsgaWQ6IHNsYWNrX3Jvb20uaWQsIGZhbWlseTogc2xhY2tfcm9vbS5pZC5jaGFyQXQoMCkgPT09ICdDJyA/ICdjaGFubmVscycgOiAnZ3JvdXBzJyB9O1xuXHRcdFx0XHRcdHJldHVybiB0aGlzLmltcG9ydE1lc3NhZ2VzKHJpZCwgY2FsbGJhY2spO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdGxvZ2dlci5jbGFzcy5lcnJvcignQ291bGQgbm90IGZpbmQgU2xhY2sgcm9vbSB3aXRoIHNwZWNpZmllZCBuYW1lJywgcm9ja2V0Y2hhdF9yb29tLm5hbWUpO1xuXHRcdFx0XHRcdHJldHVybiBjYWxsYmFjayhuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1zbGFjay1yb29tLW5vdC1mb3VuZCcsICdDb3VsZCBub3QgZmluZCBTbGFjayByb29tIHdpdGggc3BlY2lmaWVkIG5hbWUnKSk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9IGVsc2Uge1xuXHRcdFx0bG9nZ2VyLmNsYXNzLmVycm9yKCdDb3VsZCBub3QgZmluZCBSb2NrZXQuQ2hhdCByb29tIHdpdGggc3BlY2lmaWVkIGlkJywgcmlkKTtcblx0XHRcdHJldHVybiBjYWxsYmFjayhuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLXJvb20nLCAnSW52YWxpZCByb29tJykpO1xuXHRcdH1cblx0fVxuXG5cdHBvcHVsYXRlU2xhY2tDaGFubmVsTWFwKCkge1xuXHRcdGxvZ2dlci5jbGFzcy5kZWJ1ZygnUG9wdWxhdGluZyBjaGFubmVsIG1hcCcpO1xuXHRcdGxldCByZXNwb25zZSA9IEhUVFAuZ2V0KCdodHRwczovL3NsYWNrLmNvbS9hcGkvY2hhbm5lbHMubGlzdCcsIHsgcGFyYW1zOiB7IHRva2VuOiB0aGlzLmFwaVRva2VuIH0gfSk7XG5cdFx0aWYgKHJlc3BvbnNlICYmIHJlc3BvbnNlLmRhdGEgJiYgXy5pc0FycmF5KHJlc3BvbnNlLmRhdGEuY2hhbm5lbHMpICYmIHJlc3BvbnNlLmRhdGEuY2hhbm5lbHMubGVuZ3RoID4gMCkge1xuXHRcdFx0Zm9yIChjb25zdCBzbGFja0NoYW5uZWwgb2YgcmVzcG9uc2UuZGF0YS5jaGFubmVscykge1xuXHRcdFx0XHRjb25zdCByb2NrZXRjaGF0X3Jvb20gPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT25lQnlOYW1lKHNsYWNrQ2hhbm5lbC5uYW1lLCB7IGZpZWxkczogeyBfaWQ6IDEgfSB9KTtcblx0XHRcdFx0aWYgKHJvY2tldGNoYXRfcm9vbSkge1xuXHRcdFx0XHRcdHRoaXMuc2xhY2tDaGFubmVsTWFwW3JvY2tldGNoYXRfcm9vbS5faWRdID0geyBpZDogc2xhY2tDaGFubmVsLmlkLCBmYW1pbHk6IHNsYWNrQ2hhbm5lbC5pZC5jaGFyQXQoMCkgPT09ICdDJyA/ICdjaGFubmVscycgOiAnZ3JvdXBzJyB9O1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHJlc3BvbnNlID0gSFRUUC5nZXQoJ2h0dHBzOi8vc2xhY2suY29tL2FwaS9ncm91cHMubGlzdCcsIHsgcGFyYW1zOiB7IHRva2VuOiB0aGlzLmFwaVRva2VuIH0gfSk7XG5cdFx0aWYgKHJlc3BvbnNlICYmIHJlc3BvbnNlLmRhdGEgJiYgXy5pc0FycmF5KHJlc3BvbnNlLmRhdGEuZ3JvdXBzKSAmJiByZXNwb25zZS5kYXRhLmdyb3Vwcy5sZW5ndGggPiAwKSB7XG5cdFx0XHRmb3IgKGNvbnN0IHNsYWNrR3JvdXAgb2YgcmVzcG9uc2UuZGF0YS5ncm91cHMpIHtcblx0XHRcdFx0Y29uc3Qgcm9ja2V0Y2hhdF9yb29tID0gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9uZUJ5TmFtZShzbGFja0dyb3VwLm5hbWUsIHsgZmllbGRzOiB7IF9pZDogMSB9IH0pO1xuXHRcdFx0XHRpZiAocm9ja2V0Y2hhdF9yb29tKSB7XG5cdFx0XHRcdFx0dGhpcy5zbGFja0NoYW5uZWxNYXBbcm9ja2V0Y2hhdF9yb29tLl9pZF0gPSB7IGlkOiBzbGFja0dyb3VwLmlkLCBmYW1pbHk6IHNsYWNrR3JvdXAuaWQuY2hhckF0KDApID09PSAnQycgPyAnY2hhbm5lbHMnIDogJ2dyb3VwcycgfTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdG9uUm9ja2V0TWVzc2FnZURlbGV0ZShyb2NrZXRNZXNzYWdlRGVsZXRlZCkge1xuXHRcdGxvZ2dlci5jbGFzcy5kZWJ1Zygnb25Sb2NrZXRNZXNzYWdlRGVsZXRlJywgcm9ja2V0TWVzc2FnZURlbGV0ZWQpO1xuXG5cdFx0dGhpcy5wb3N0RGVsZXRlTWVzc2FnZVRvU2xhY2socm9ja2V0TWVzc2FnZURlbGV0ZWQpO1xuXHR9XG5cblx0b25Sb2NrZXRTZXRSZWFjdGlvbihyb2NrZXRNc2dJRCwgcmVhY3Rpb24pIHtcblx0XHRsb2dnZXIuY2xhc3MuZGVidWcoJ29uUm9ja2V0U2V0UmVhY3Rpb24nKTtcblxuXHRcdGlmIChyb2NrZXRNc2dJRCAmJiByZWFjdGlvbikge1xuXHRcdFx0aWYgKHRoaXMucmVhY3Rpb25zTWFwLmRlbGV0ZShgc2V0JHsgcm9ja2V0TXNnSUQgfSR7IHJlYWN0aW9uIH1gKSkge1xuXHRcdFx0XHQvL1RoaXMgd2FzIGEgU2xhY2sgcmVhY3Rpb24sIHdlIGRvbid0IG5lZWQgdG8gdGVsbCBTbGFjayBhYm91dCBpdFxuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cdFx0XHRjb25zdCByb2NrZXRNc2cgPSBSb2NrZXRDaGF0Lm1vZGVscy5NZXNzYWdlcy5maW5kT25lQnlJZChyb2NrZXRNc2dJRCk7XG5cdFx0XHRpZiAocm9ja2V0TXNnKSB7XG5cdFx0XHRcdGNvbnN0IHNsYWNrQ2hhbm5lbCA9IHRoaXMuc2xhY2tDaGFubmVsTWFwW3JvY2tldE1zZy5yaWRdLmlkO1xuXHRcdFx0XHRjb25zdCBzbGFja1RTID0gdGhpcy5nZXRTbGFja1RTKHJvY2tldE1zZyk7XG5cdFx0XHRcdHRoaXMucG9zdFJlYWN0aW9uQWRkZWRUb1NsYWNrKHJlYWN0aW9uLnJlcGxhY2UoLzovZywgJycpLCBzbGFja0NoYW5uZWwsIHNsYWNrVFMpO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdG9uUm9ja2V0VW5TZXRSZWFjdGlvbihyb2NrZXRNc2dJRCwgcmVhY3Rpb24pIHtcblx0XHRsb2dnZXIuY2xhc3MuZGVidWcoJ29uUm9ja2V0VW5TZXRSZWFjdGlvbicpO1xuXG5cdFx0aWYgKHJvY2tldE1zZ0lEICYmIHJlYWN0aW9uKSB7XG5cdFx0XHRpZiAodGhpcy5yZWFjdGlvbnNNYXAuZGVsZXRlKGB1bnNldCR7IHJvY2tldE1zZ0lEIH0keyByZWFjdGlvbiB9YCkpIHtcblx0XHRcdFx0Ly9UaGlzIHdhcyBhIFNsYWNrIHVuc2V0IHJlYWN0aW9uLCB3ZSBkb24ndCBuZWVkIHRvIHRlbGwgU2xhY2sgYWJvdXQgaXRcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHRjb25zdCByb2NrZXRNc2cgPSBSb2NrZXRDaGF0Lm1vZGVscy5NZXNzYWdlcy5maW5kT25lQnlJZChyb2NrZXRNc2dJRCk7XG5cdFx0XHRpZiAocm9ja2V0TXNnKSB7XG5cdFx0XHRcdGNvbnN0IHNsYWNrQ2hhbm5lbCA9IHRoaXMuc2xhY2tDaGFubmVsTWFwW3JvY2tldE1zZy5yaWRdLmlkO1xuXHRcdFx0XHRjb25zdCBzbGFja1RTID0gdGhpcy5nZXRTbGFja1RTKHJvY2tldE1zZyk7XG5cdFx0XHRcdHRoaXMucG9zdFJlYWN0aW9uUmVtb3ZlVG9TbGFjayhyZWFjdGlvbi5yZXBsYWNlKC86L2csICcnKSwgc2xhY2tDaGFubmVsLCBzbGFja1RTKTtcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRvblJvY2tldE1lc3NhZ2Uocm9ja2V0TWVzc2FnZSkge1xuXHRcdGxvZ2dlci5jbGFzcy5kZWJ1Zygnb25Sb2NrZXRNZXNzYWdlJywgcm9ja2V0TWVzc2FnZSk7XG5cblx0XHRpZiAocm9ja2V0TWVzc2FnZS5lZGl0ZWRBdCkge1xuXHRcdFx0Ly9UaGlzIGlzIGFuIEVkaXQgRXZlbnRcblx0XHRcdHRoaXMucHJvY2Vzc1JvY2tldE1lc3NhZ2VDaGFuZ2VkKHJvY2tldE1lc3NhZ2UpO1xuXHRcdFx0cmV0dXJuIHJvY2tldE1lc3NhZ2U7XG5cdFx0fVxuXHRcdC8vIElnbm9yZSBtZXNzYWdlcyBvcmlnaW5hdGluZyBmcm9tIFNsYWNrXG5cdFx0aWYgKHJvY2tldE1lc3NhZ2UuX2lkLmluZGV4T2YoJ3NsYWNrLScpID09PSAwKSB7XG5cdFx0XHRyZXR1cm4gcm9ja2V0TWVzc2FnZTtcblx0XHR9XG5cblx0XHQvL1Byb2JhYmx5IGEgbmV3IG1lc3NhZ2UgZnJvbSBSb2NrZXQuQ2hhdFxuXHRcdGNvbnN0IG91dFNsYWNrQ2hhbm5lbHMgPSBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnU2xhY2tCcmlkZ2VfT3V0X0FsbCcpID8gXy5rZXlzKHRoaXMuc2xhY2tDaGFubmVsTWFwKSA6IF8ucGx1Y2soUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ1NsYWNrQnJpZGdlX091dF9DaGFubmVscycpLCAnX2lkJykgfHwgW107XG5cdFx0Ly9sb2dnZXIuY2xhc3MuZGVidWcoJ091dCBTbGFja0NoYW5uZWxzOiAnLCBvdXRTbGFja0NoYW5uZWxzKTtcblx0XHRpZiAob3V0U2xhY2tDaGFubmVscy5pbmRleE9mKHJvY2tldE1lc3NhZ2UucmlkKSAhPT0gLTEpIHtcblx0XHRcdHRoaXMucG9zdE1lc3NhZ2VUb1NsYWNrKHRoaXMuc2xhY2tDaGFubmVsTWFwW3JvY2tldE1lc3NhZ2UucmlkXSwgcm9ja2V0TWVzc2FnZSk7XG5cdFx0fVxuXHRcdHJldHVybiByb2NrZXRNZXNzYWdlO1xuXHR9XG5cblx0Lypcblx0IGh0dHBzOi8vYXBpLnNsYWNrLmNvbS9tZXRob2RzL3JlYWN0aW9ucy5hZGRcblx0ICovXG5cdHBvc3RSZWFjdGlvbkFkZGVkVG9TbGFjayhyZWFjdGlvbiwgc2xhY2tDaGFubmVsLCBzbGFja1RTKSB7XG5cdFx0aWYgKHJlYWN0aW9uICYmIHNsYWNrQ2hhbm5lbCAmJiBzbGFja1RTKSB7XG5cdFx0XHRjb25zdCBkYXRhID0ge1xuXHRcdFx0XHR0b2tlbjogdGhpcy5hcGlUb2tlbixcblx0XHRcdFx0bmFtZTogcmVhY3Rpb24sXG5cdFx0XHRcdGNoYW5uZWw6IHNsYWNrQ2hhbm5lbCxcblx0XHRcdFx0dGltZXN0YW1wOiBzbGFja1RTXG5cdFx0XHR9O1xuXG5cdFx0XHRsb2dnZXIuY2xhc3MuZGVidWcoJ1Bvc3RpbmcgQWRkIFJlYWN0aW9uIHRvIFNsYWNrJyk7XG5cdFx0XHRjb25zdCBwb3N0UmVzdWx0ID0gSFRUUC5wb3N0KCdodHRwczovL3NsYWNrLmNvbS9hcGkvcmVhY3Rpb25zLmFkZCcsIHsgcGFyYW1zOiBkYXRhIH0pO1xuXHRcdFx0aWYgKHBvc3RSZXN1bHQuc3RhdHVzQ29kZSA9PT0gMjAwICYmIHBvc3RSZXN1bHQuZGF0YSAmJiBwb3N0UmVzdWx0LmRhdGEub2sgPT09IHRydWUpIHtcblx0XHRcdFx0bG9nZ2VyLmNsYXNzLmRlYnVnKCdSZWFjdGlvbiBhZGRlZCB0byBTbGFjaycpO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdC8qXG5cdCBodHRwczovL2FwaS5zbGFjay5jb20vbWV0aG9kcy9yZWFjdGlvbnMucmVtb3ZlXG5cdCAqL1xuXHRwb3N0UmVhY3Rpb25SZW1vdmVUb1NsYWNrKHJlYWN0aW9uLCBzbGFja0NoYW5uZWwsIHNsYWNrVFMpIHtcblx0XHRpZiAocmVhY3Rpb24gJiYgc2xhY2tDaGFubmVsICYmIHNsYWNrVFMpIHtcblx0XHRcdGNvbnN0IGRhdGEgPSB7XG5cdFx0XHRcdHRva2VuOiB0aGlzLmFwaVRva2VuLFxuXHRcdFx0XHRuYW1lOiByZWFjdGlvbixcblx0XHRcdFx0Y2hhbm5lbDogc2xhY2tDaGFubmVsLFxuXHRcdFx0XHR0aW1lc3RhbXA6IHNsYWNrVFNcblx0XHRcdH07XG5cblx0XHRcdGxvZ2dlci5jbGFzcy5kZWJ1ZygnUG9zdGluZyBSZW1vdmUgUmVhY3Rpb24gdG8gU2xhY2snKTtcblx0XHRcdGNvbnN0IHBvc3RSZXN1bHQgPSBIVFRQLnBvc3QoJ2h0dHBzOi8vc2xhY2suY29tL2FwaS9yZWFjdGlvbnMucmVtb3ZlJywgeyBwYXJhbXM6IGRhdGEgfSk7XG5cdFx0XHRpZiAocG9zdFJlc3VsdC5zdGF0dXNDb2RlID09PSAyMDAgJiYgcG9zdFJlc3VsdC5kYXRhICYmIHBvc3RSZXN1bHQuZGF0YS5vayA9PT0gdHJ1ZSkge1xuXHRcdFx0XHRsb2dnZXIuY2xhc3MuZGVidWcoJ1JlYWN0aW9uIHJlbW92ZWQgZnJvbSBTbGFjaycpO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdHBvc3REZWxldGVNZXNzYWdlVG9TbGFjayhyb2NrZXRNZXNzYWdlKSB7XG5cdFx0aWYgKHJvY2tldE1lc3NhZ2UpIHtcblx0XHRcdGNvbnN0IGRhdGEgPSB7XG5cdFx0XHRcdHRva2VuOiB0aGlzLmFwaVRva2VuLFxuXHRcdFx0XHR0czogdGhpcy5nZXRTbGFja1RTKHJvY2tldE1lc3NhZ2UpLFxuXHRcdFx0XHRjaGFubmVsOiB0aGlzLnNsYWNrQ2hhbm5lbE1hcFtyb2NrZXRNZXNzYWdlLnJpZF0uaWQsXG5cdFx0XHRcdGFzX3VzZXI6IHRydWVcblx0XHRcdH07XG5cblx0XHRcdGxvZ2dlci5jbGFzcy5kZWJ1ZygnUG9zdCBEZWxldGUgTWVzc2FnZSB0byBTbGFjaycsIGRhdGEpO1xuXHRcdFx0Y29uc3QgcG9zdFJlc3VsdCA9IEhUVFAucG9zdCgnaHR0cHM6Ly9zbGFjay5jb20vYXBpL2NoYXQuZGVsZXRlJywgeyBwYXJhbXM6IGRhdGEgfSk7XG5cdFx0XHRpZiAocG9zdFJlc3VsdC5zdGF0dXNDb2RlID09PSAyMDAgJiYgcG9zdFJlc3VsdC5kYXRhICYmIHBvc3RSZXN1bHQuZGF0YS5vayA9PT0gdHJ1ZSkge1xuXHRcdFx0XHRsb2dnZXIuY2xhc3MuZGVidWcoJ01lc3NhZ2UgZGVsZXRlZCBvbiBTbGFjaycpO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdHBvc3RNZXNzYWdlVG9TbGFjayhzbGFja0NoYW5uZWwsIHJvY2tldE1lc3NhZ2UpIHtcblx0XHRpZiAoc2xhY2tDaGFubmVsICYmIHNsYWNrQ2hhbm5lbC5pZCkge1xuXHRcdFx0bGV0IGljb25VcmwgPSBnZXRBdmF0YXJVcmxGcm9tVXNlcm5hbWUocm9ja2V0TWVzc2FnZS51ICYmIHJvY2tldE1lc3NhZ2UudS51c2VybmFtZSk7XG5cdFx0XHRpZiAoaWNvblVybCkge1xuXHRcdFx0XHRpY29uVXJsID0gTWV0ZW9yLmFic29sdXRlVXJsKCkucmVwbGFjZSgvXFwvJC8sICcnKSArIGljb25Vcmw7XG5cdFx0XHR9XG5cdFx0XHRjb25zdCBkYXRhID0ge1xuXHRcdFx0XHR0b2tlbjogdGhpcy5hcGlUb2tlbixcblx0XHRcdFx0dGV4dDogcm9ja2V0TWVzc2FnZS5tc2csXG5cdFx0XHRcdGNoYW5uZWw6IHNsYWNrQ2hhbm5lbC5pZCxcblx0XHRcdFx0dXNlcm5hbWU6IHJvY2tldE1lc3NhZ2UudSAmJiByb2NrZXRNZXNzYWdlLnUudXNlcm5hbWUsXG5cdFx0XHRcdGljb25fdXJsOiBpY29uVXJsLFxuXHRcdFx0XHRsaW5rX25hbWVzOiAxXG5cdFx0XHR9O1xuXHRcdFx0bG9nZ2VyLmNsYXNzLmRlYnVnKCdQb3N0IE1lc3NhZ2UgVG8gU2xhY2snLCBkYXRhKTtcblx0XHRcdGNvbnN0IHBvc3RSZXN1bHQgPSBIVFRQLnBvc3QoJ2h0dHBzOi8vc2xhY2suY29tL2FwaS9jaGF0LnBvc3RNZXNzYWdlJywgeyBwYXJhbXM6IGRhdGEgfSk7XG5cdFx0XHRpZiAocG9zdFJlc3VsdC5zdGF0dXNDb2RlID09PSAyMDAgJiYgcG9zdFJlc3VsdC5kYXRhICYmIHBvc3RSZXN1bHQuZGF0YS5tZXNzYWdlICYmIHBvc3RSZXN1bHQuZGF0YS5tZXNzYWdlLmJvdF9pZCAmJiBwb3N0UmVzdWx0LmRhdGEubWVzc2FnZS50cykge1xuXHRcdFx0XHRSb2NrZXRDaGF0Lm1vZGVscy5NZXNzYWdlcy5zZXRTbGFja0JvdElkQW5kU2xhY2tUcyhyb2NrZXRNZXNzYWdlLl9pZCwgcG9zdFJlc3VsdC5kYXRhLm1lc3NhZ2UuYm90X2lkLCBwb3N0UmVzdWx0LmRhdGEubWVzc2FnZS50cyk7XG5cdFx0XHRcdGxvZ2dlci5jbGFzcy5kZWJ1ZyhgUm9ja2V0TXNnSUQ9JHsgcm9ja2V0TWVzc2FnZS5faWQgfSBTbGFja01zZ0lEPSR7IHBvc3RSZXN1bHQuZGF0YS5tZXNzYWdlLnRzIH0gU2xhY2tCb3RJRD0keyBwb3N0UmVzdWx0LmRhdGEubWVzc2FnZS5ib3RfaWQgfWApO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdC8qXG5cdCBodHRwczovL2FwaS5zbGFjay5jb20vbWV0aG9kcy9jaGF0LnVwZGF0ZVxuXHQgKi9cblx0cG9zdE1lc3NhZ2VVcGRhdGVUb1NsYWNrKHNsYWNrQ2hhbm5lbCwgcm9ja2V0TWVzc2FnZSkge1xuXHRcdGlmIChzbGFja0NoYW5uZWwgJiYgc2xhY2tDaGFubmVsLmlkKSB7XG5cdFx0XHRjb25zdCBkYXRhID0ge1xuXHRcdFx0XHR0b2tlbjogdGhpcy5hcGlUb2tlbixcblx0XHRcdFx0dHM6IHRoaXMuZ2V0U2xhY2tUUyhyb2NrZXRNZXNzYWdlKSxcblx0XHRcdFx0Y2hhbm5lbDogc2xhY2tDaGFubmVsLmlkLFxuXHRcdFx0XHR0ZXh0OiByb2NrZXRNZXNzYWdlLm1zZyxcblx0XHRcdFx0YXNfdXNlcjogdHJ1ZVxuXHRcdFx0fTtcblx0XHRcdGxvZ2dlci5jbGFzcy5kZWJ1ZygnUG9zdCBVcGRhdGVNZXNzYWdlIFRvIFNsYWNrJywgZGF0YSk7XG5cdFx0XHRjb25zdCBwb3N0UmVzdWx0ID0gSFRUUC5wb3N0KCdodHRwczovL3NsYWNrLmNvbS9hcGkvY2hhdC51cGRhdGUnLCB7IHBhcmFtczogZGF0YSB9KTtcblx0XHRcdGlmIChwb3N0UmVzdWx0LnN0YXR1c0NvZGUgPT09IDIwMCAmJiBwb3N0UmVzdWx0LmRhdGEgJiYgcG9zdFJlc3VsdC5kYXRhLm9rID09PSB0cnVlKSB7XG5cdFx0XHRcdGxvZ2dlci5jbGFzcy5kZWJ1ZygnTWVzc2FnZSB1cGRhdGVkIG9uIFNsYWNrJyk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0cHJvY2Vzc1JvY2tldE1lc3NhZ2VDaGFuZ2VkKHJvY2tldE1lc3NhZ2UpIHtcblx0XHRpZiAocm9ja2V0TWVzc2FnZSkge1xuXHRcdFx0aWYgKHJvY2tldE1lc3NhZ2UudXBkYXRlZEJ5U2xhY2spIHtcblx0XHRcdFx0Ly9XZSBoYXZlIGFscmVhZHkgcHJvY2Vzc2VkIHRoaXNcblx0XHRcdFx0ZGVsZXRlIHJvY2tldE1lc3NhZ2UudXBkYXRlZEJ5U2xhY2s7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0Ly9UaGlzIHdhcyBhIGNoYW5nZSBmcm9tIFJvY2tldC5DaGF0XG5cdFx0XHRjb25zdCBzbGFja0NoYW5uZWwgPSB0aGlzLnNsYWNrQ2hhbm5lbE1hcFtyb2NrZXRNZXNzYWdlLnJpZF07XG5cdFx0XHR0aGlzLnBvc3RNZXNzYWdlVXBkYXRlVG9TbGFjayhzbGFja0NoYW5uZWwsIHJvY2tldE1lc3NhZ2UpO1xuXHRcdH1cblx0fVxuXG5cdC8qXG5cdCBodHRwczovL2FwaS5zbGFjay5jb20vZXZlbnRzL21lc3NhZ2UvbWVzc2FnZV9kZWxldGVkXG5cdCAqL1xuXHRwcm9jZXNzU2xhY2tNZXNzYWdlRGVsZXRlZChzbGFja01lc3NhZ2UpIHtcblx0XHRpZiAoc2xhY2tNZXNzYWdlLnByZXZpb3VzX21lc3NhZ2UpIHtcblx0XHRcdGNvbnN0IHJvY2tldENoYW5uZWwgPSB0aGlzLmdldFJvY2tldENoYW5uZWwoc2xhY2tNZXNzYWdlKTtcblx0XHRcdGNvbnN0IHJvY2tldFVzZXIgPSBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kT25lQnlJZCgncm9ja2V0LmNhdCcsIHsgZmllbGRzOiB7IHVzZXJuYW1lOiAxIH0gfSk7XG5cblx0XHRcdGlmIChyb2NrZXRDaGFubmVsICYmIHJvY2tldFVzZXIpIHtcblx0XHRcdFx0Ly9GaW5kIHRoZSBSb2NrZXQgbWVzc2FnZSB0byBkZWxldGVcblx0XHRcdFx0bGV0IHJvY2tldE1zZ09iaiA9IFJvY2tldENoYXQubW9kZWxzLk1lc3NhZ2VzXG5cdFx0XHRcdFx0LmZpbmRPbmVCeVNsYWNrQm90SWRBbmRTbGFja1RzKHNsYWNrTWVzc2FnZS5wcmV2aW91c19tZXNzYWdlLmJvdF9pZCwgc2xhY2tNZXNzYWdlLnByZXZpb3VzX21lc3NhZ2UudHMpO1xuXG5cdFx0XHRcdGlmICghcm9ja2V0TXNnT2JqKSB7XG5cdFx0XHRcdFx0Ly9NdXN0IGhhdmUgYmVlbiBhIFNsYWNrIG9yaWdpbmF0ZWQgbXNnXG5cdFx0XHRcdFx0Y29uc3QgX2lkID0gdGhpcy5jcmVhdGVSb2NrZXRJRChzbGFja01lc3NhZ2UuY2hhbm5lbCwgc2xhY2tNZXNzYWdlLnByZXZpb3VzX21lc3NhZ2UudHMpO1xuXHRcdFx0XHRcdHJvY2tldE1zZ09iaiA9IFJvY2tldENoYXQubW9kZWxzLk1lc3NhZ2VzLmZpbmRPbmVCeUlkKF9pZCk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAocm9ja2V0TXNnT2JqKSB7XG5cdFx0XHRcdFx0Um9ja2V0Q2hhdC5kZWxldGVNZXNzYWdlKHJvY2tldE1zZ09iaiwgcm9ja2V0VXNlcik7XG5cdFx0XHRcdFx0bG9nZ2VyLmNsYXNzLmRlYnVnKCdSb2NrZXQgbWVzc2FnZSBkZWxldGVkIGJ5IFNsYWNrJyk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHQvKlxuXHQgaHR0cHM6Ly9hcGkuc2xhY2suY29tL2V2ZW50cy9tZXNzYWdlL21lc3NhZ2VfY2hhbmdlZFxuXHQgKi9cblx0cHJvY2Vzc1NsYWNrTWVzc2FnZUNoYW5nZWQoc2xhY2tNZXNzYWdlKSB7XG5cdFx0aWYgKHNsYWNrTWVzc2FnZS5wcmV2aW91c19tZXNzYWdlKSB7XG5cdFx0XHRjb25zdCBjdXJyZW50TXNnID0gUm9ja2V0Q2hhdC5tb2RlbHMuTWVzc2FnZXMuZmluZE9uZUJ5SWQodGhpcy5jcmVhdGVSb2NrZXRJRChzbGFja01lc3NhZ2UuY2hhbm5lbCwgc2xhY2tNZXNzYWdlLm1lc3NhZ2UudHMpKTtcblxuXHRcdFx0Ly9Pbmx5IHByb2Nlc3MgdGhpcyBjaGFuZ2UsIGlmIGl0cyBhbiBhY3R1YWwgdXBkYXRlIChub3QganVzdCBTbGFjayByZXBlYXRpbmcgYmFjayBvdXIgUm9ja2V0IG9yaWdpbmFsIGNoYW5nZSlcblx0XHRcdGlmIChjdXJyZW50TXNnICYmIChzbGFja01lc3NhZ2UubWVzc2FnZS50ZXh0ICE9PSBjdXJyZW50TXNnLm1zZykpIHtcblx0XHRcdFx0Y29uc3Qgcm9ja2V0Q2hhbm5lbCA9IHRoaXMuZ2V0Um9ja2V0Q2hhbm5lbChzbGFja01lc3NhZ2UpO1xuXHRcdFx0XHRjb25zdCByb2NrZXRVc2VyID0gc2xhY2tNZXNzYWdlLnByZXZpb3VzX21lc3NhZ2UudXNlciA/IHRoaXMuZmluZFJvY2tldFVzZXIoc2xhY2tNZXNzYWdlLnByZXZpb3VzX21lc3NhZ2UudXNlcikgfHwgdGhpcy5hZGRSb2NrZXRVc2VyKHNsYWNrTWVzc2FnZS5wcmV2aW91c19tZXNzYWdlLnVzZXIpIDogbnVsbDtcblxuXHRcdFx0XHRjb25zdCByb2NrZXRNc2dPYmogPSB7XG5cdFx0XHRcdFx0Ly9AVE9ETyBfaWRcblx0XHRcdFx0XHRfaWQ6IHRoaXMuY3JlYXRlUm9ja2V0SUQoc2xhY2tNZXNzYWdlLmNoYW5uZWwsIHNsYWNrTWVzc2FnZS5wcmV2aW91c19tZXNzYWdlLnRzKSxcblx0XHRcdFx0XHRyaWQ6IHJvY2tldENoYW5uZWwuX2lkLFxuXHRcdFx0XHRcdG1zZzogdGhpcy5jb252ZXJ0U2xhY2tNc2dUeHRUb1JvY2tldFR4dEZvcm1hdChzbGFja01lc3NhZ2UubWVzc2FnZS50ZXh0KSxcblx0XHRcdFx0XHR1cGRhdGVkQnlTbGFjazogdHJ1ZVx0Ly9XZSBkb24ndCB3YW50IHRvIG5vdGlmeSBzbGFjayBhYm91dCB0aGlzIGNoYW5nZSBzaW5jZSBTbGFjayBpbml0aWF0ZWQgaXRcblx0XHRcdFx0fTtcblxuXHRcdFx0XHRSb2NrZXRDaGF0LnVwZGF0ZU1lc3NhZ2Uocm9ja2V0TXNnT2JqLCByb2NrZXRVc2VyKTtcblx0XHRcdFx0bG9nZ2VyLmNsYXNzLmRlYnVnKCdSb2NrZXQgbWVzc2FnZSB1cGRhdGVkIGJ5IFNsYWNrJyk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0Lypcblx0IFRoaXMgbWV0aG9kIHdpbGwgZ2V0IHJlZmFjdG9yZWQgYW5kIGJyb2tlbiBkb3duIGludG8gc2luZ2xlIHJlc3BvbnNpYmlsaXRpZXNcblx0ICovXG5cdHByb2Nlc3NTbGFja05ld01lc3NhZ2Uoc2xhY2tNZXNzYWdlLCBpc0ltcG9ydGluZykge1xuXHRcdGNvbnN0IHJvY2tldENoYW5uZWwgPSB0aGlzLmdldFJvY2tldENoYW5uZWwoc2xhY2tNZXNzYWdlKTtcblx0XHRsZXQgcm9ja2V0VXNlciA9IG51bGw7XG5cdFx0aWYgKHNsYWNrTWVzc2FnZS5zdWJ0eXBlID09PSAnYm90X21lc3NhZ2UnKSB7XG5cdFx0XHRyb2NrZXRVc2VyID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZE9uZUJ5SWQoJ3JvY2tldC5jYXQnLCB7IGZpZWxkczogeyB1c2VybmFtZTogMSB9IH0pO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRyb2NrZXRVc2VyID0gc2xhY2tNZXNzYWdlLnVzZXIgPyB0aGlzLmZpbmRSb2NrZXRVc2VyKHNsYWNrTWVzc2FnZS51c2VyKSB8fCB0aGlzLmFkZFJvY2tldFVzZXIoc2xhY2tNZXNzYWdlLnVzZXIpIDogbnVsbDtcblx0XHR9XG5cdFx0aWYgKHJvY2tldENoYW5uZWwgJiYgcm9ja2V0VXNlcikge1xuXHRcdFx0Y29uc3QgbXNnRGF0YURlZmF1bHRzID0ge1xuXHRcdFx0XHRfaWQ6IHRoaXMuY3JlYXRlUm9ja2V0SUQoc2xhY2tNZXNzYWdlLmNoYW5uZWwsIHNsYWNrTWVzc2FnZS50cyksXG5cdFx0XHRcdHRzOiBuZXcgRGF0ZShwYXJzZUludChzbGFja01lc3NhZ2UudHMuc3BsaXQoJy4nKVswXSkgKiAxMDAwKVxuXHRcdFx0fTtcblx0XHRcdGlmIChpc0ltcG9ydGluZykge1xuXHRcdFx0XHRtc2dEYXRhRGVmYXVsdHNbJ2ltcG9ydGVkJ10gPSAnc2xhY2ticmlkZ2UnO1xuXHRcdFx0fVxuXHRcdFx0dHJ5IHtcblx0XHRcdFx0dGhpcy5jcmVhdGVBbmRTYXZlUm9ja2V0TWVzc2FnZShyb2NrZXRDaGFubmVsLCByb2NrZXRVc2VyLCBzbGFja01lc3NhZ2UsIG1zZ0RhdGFEZWZhdWx0cywgaXNJbXBvcnRpbmcpO1xuXHRcdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0XHQvLyBodHRwOi8vd3d3Lm1vbmdvZGIub3JnL2Fib3V0L2NvbnRyaWJ1dG9ycy9lcnJvci1jb2Rlcy9cblx0XHRcdFx0Ly8gMTEwMDAgPT0gZHVwbGljYXRlIGtleSBlcnJvclxuXHRcdFx0XHRpZiAoZS5uYW1lID09PSAnTW9uZ29FcnJvcicgJiYgZS5jb2RlID09PSAxMTAwMCkge1xuXHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHRocm93IGU7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0LyoqXG5cdCAqIFJldHJpZXZlcyB0aGUgU2xhY2sgVFMgZnJvbSBhIFJvY2tldCBtc2cgdGhhdCBvcmlnaW5hdGVkIGZyb20gU2xhY2tcblx0ICogQHBhcmFtIHJvY2tldE1zZ1xuXHQgKiBAcmV0dXJucyBTbGFjayBUUyBvciB1bmRlZmluZWQgaWYgbm90IGEgbWVzc2FnZSB0aGF0IG9yaWdpbmF0ZWQgZnJvbSBzbGFja1xuXHQgKiBAcHJpdmF0ZVxuXHQgKi9cblx0Z2V0U2xhY2tUUyhyb2NrZXRNc2cpIHtcblx0XHQvL3NsYWNrLUczS0pHR0UxNS0xNDgzMDgxMDYxLTAwMDE2OVxuXHRcdGxldCBzbGFja1RTO1xuXHRcdGxldCBpbmRleCA9IHJvY2tldE1zZy5faWQuaW5kZXhPZignc2xhY2stJyk7XG5cdFx0aWYgKGluZGV4ID09PSAwKSB7XG5cdFx0XHQvL1RoaXMgaXMgYSBtc2cgdGhhdCBvcmlnaW5hdGVkIGZyb20gU2xhY2tcblx0XHRcdHNsYWNrVFMgPSByb2NrZXRNc2cuX2lkLnN1YnN0cig2LCByb2NrZXRNc2cuX2lkLmxlbmd0aCk7XG5cdFx0XHRpbmRleCA9IHNsYWNrVFMuaW5kZXhPZignLScpO1xuXHRcdFx0c2xhY2tUUyA9IHNsYWNrVFMuc3Vic3RyKGluZGV4KzEsIHNsYWNrVFMubGVuZ3RoKTtcblx0XHRcdHNsYWNrVFMgPSBzbGFja1RTLnJlcGxhY2UoJy0nLCAnLicpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHQvL1RoaXMgcHJvYmFibHkgb3JpZ2luYXRlZCBhcyBhIFJvY2tldCBtc2csIGJ1dCBoYXMgYmVlbiBzZW50IHRvIFNsYWNrXG5cdFx0XHRzbGFja1RTID0gcm9ja2V0TXNnLnNsYWNrVHM7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHNsYWNrVFM7XG5cdH1cblxuXHRnZXRSb2NrZXRDaGFubmVsKHNsYWNrTWVzc2FnZSkge1xuXHRcdHJldHVybiBzbGFja01lc3NhZ2UuY2hhbm5lbCA/IHRoaXMuZmluZFJvY2tldENoYW5uZWwoc2xhY2tNZXNzYWdlLmNoYW5uZWwpIHx8IHRoaXMuYWRkUm9ja2V0Q2hhbm5lbChzbGFja01lc3NhZ2UuY2hhbm5lbCkgOiBudWxsO1xuXHR9XG5cblx0Z2V0Um9ja2V0VXNlcihzbGFja1VzZXIpIHtcblx0XHRyZXR1cm4gc2xhY2tVc2VyID8gdGhpcy5maW5kUm9ja2V0VXNlcihzbGFja1VzZXIpIHx8IHRoaXMuYWRkUm9ja2V0VXNlcihzbGFja1VzZXIpIDogbnVsbDtcblx0fVxuXG5cdGNyZWF0ZVJvY2tldElEKHNsYWNrQ2hhbm5lbCwgdHMpIHtcblx0XHRyZXR1cm4gYHNsYWNrLSR7IHNsYWNrQ2hhbm5lbCB9LSR7IHRzLnJlcGxhY2UoL1xcLi9nLCAnLScpIH1gO1xuXHR9XG5cbn1cblxuUm9ja2V0Q2hhdC5TbGFja0JyaWRnZSA9IG5ldyBTbGFja0JyaWRnZTtcbiIsIi8qIGdsb2JhbHMgbXNnU3RyZWFtICovXG5mdW5jdGlvbiBTbGFja0JyaWRnZUltcG9ydChjb21tYW5kLCBwYXJhbXMsIGl0ZW0pIHtcblx0aWYgKGNvbW1hbmQgIT09ICdzbGFja2JyaWRnZS1pbXBvcnQnIHx8ICFNYXRjaC50ZXN0KHBhcmFtcywgU3RyaW5nKSkge1xuXHRcdHJldHVybjtcblx0fVxuXG5cdGNvbnN0IHJvb20gPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT25lQnlJZChpdGVtLnJpZCk7XG5cdGNvbnN0IGNoYW5uZWwgPSByb29tLm5hbWU7XG5cdGNvbnN0IHVzZXIgPSBNZXRlb3IudXNlcnMuZmluZE9uZShNZXRlb3IudXNlcklkKCkpO1xuXG5cdG1zZ1N0cmVhbS5lbWl0KGl0ZW0ucmlkLCB7XG5cdFx0X2lkOiBSYW5kb20uaWQoKSxcblx0XHRyaWQ6IGl0ZW0ucmlkLFxuXHRcdHU6IHsgdXNlcm5hbWU6ICdyb2NrZXQuY2F0JyB9LFxuXHRcdHRzOiBuZXcgRGF0ZSgpLFxuXHRcdG1zZzogVEFQaTE4bi5fXygnU2xhY2tCcmlkZ2Vfc3RhcnQnLCB7XG5cdFx0XHRwb3N0UHJvY2VzczogJ3NwcmludGYnLFxuXHRcdFx0c3ByaW50ZjogW3VzZXIudXNlcm5hbWUsIGNoYW5uZWxdXG5cdFx0fSwgdXNlci5sYW5ndWFnZSlcblx0fSk7XG5cblx0dHJ5IHtcblx0XHRSb2NrZXRDaGF0LlNsYWNrQnJpZGdlLmltcG9ydE1lc3NhZ2VzKGl0ZW0ucmlkLCBlcnJvciA9PiB7XG5cdFx0XHRpZiAoZXJyb3IpIHtcblx0XHRcdFx0bXNnU3RyZWFtLmVtaXQoaXRlbS5yaWQsIHtcblx0XHRcdFx0XHRfaWQ6IFJhbmRvbS5pZCgpLFxuXHRcdFx0XHRcdHJpZDogaXRlbS5yaWQsXG5cdFx0XHRcdFx0dTogeyB1c2VybmFtZTogJ3JvY2tldC5jYXQnIH0sXG5cdFx0XHRcdFx0dHM6IG5ldyBEYXRlKCksXG5cdFx0XHRcdFx0bXNnOiBUQVBpMThuLl9fKCdTbGFja0JyaWRnZV9lcnJvcicsIHtcblx0XHRcdFx0XHRcdHBvc3RQcm9jZXNzOiAnc3ByaW50ZicsXG5cdFx0XHRcdFx0XHRzcHJpbnRmOiBbY2hhbm5lbCwgZXJyb3IubWVzc2FnZV1cblx0XHRcdFx0XHR9LCB1c2VyLmxhbmd1YWdlKVxuXHRcdFx0XHR9KTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdG1zZ1N0cmVhbS5lbWl0KGl0ZW0ucmlkLCB7XG5cdFx0XHRcdFx0X2lkOiBSYW5kb20uaWQoKSxcblx0XHRcdFx0XHRyaWQ6IGl0ZW0ucmlkLFxuXHRcdFx0XHRcdHU6IHsgdXNlcm5hbWU6ICdyb2NrZXQuY2F0JyB9LFxuXHRcdFx0XHRcdHRzOiBuZXcgRGF0ZSgpLFxuXHRcdFx0XHRcdG1zZzogVEFQaTE4bi5fXygnU2xhY2tCcmlkZ2VfZmluaXNoJywge1xuXHRcdFx0XHRcdFx0cG9zdFByb2Nlc3M6ICdzcHJpbnRmJyxcblx0XHRcdFx0XHRcdHNwcmludGY6IFtjaGFubmVsXVxuXHRcdFx0XHRcdH0sIHVzZXIubGFuZ3VhZ2UpXG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHR9IGNhdGNoIChlcnJvcikge1xuXHRcdG1zZ1N0cmVhbS5lbWl0KGl0ZW0ucmlkLCB7XG5cdFx0XHRfaWQ6IFJhbmRvbS5pZCgpLFxuXHRcdFx0cmlkOiBpdGVtLnJpZCxcblx0XHRcdHU6IHsgdXNlcm5hbWU6ICdyb2NrZXQuY2F0JyB9LFxuXHRcdFx0dHM6IG5ldyBEYXRlKCksXG5cdFx0XHRtc2c6IFRBUGkxOG4uX18oJ1NsYWNrQnJpZGdlX2Vycm9yJywge1xuXHRcdFx0XHRwb3N0UHJvY2VzczogJ3NwcmludGYnLFxuXHRcdFx0XHRzcHJpbnRmOiBbY2hhbm5lbCwgZXJyb3IubWVzc2FnZV1cblx0XHRcdH0sIHVzZXIubGFuZ3VhZ2UpXG5cdFx0fSk7XG5cdFx0dGhyb3cgZXJyb3I7XG5cdH1cblx0cmV0dXJuIFNsYWNrQnJpZGdlSW1wb3J0O1xufVxuXG5Sb2NrZXRDaGF0LnNsYXNoQ29tbWFuZHMuYWRkKCdzbGFja2JyaWRnZS1pbXBvcnQnLCBTbGFja0JyaWRnZUltcG9ydCk7XG4iXX0=
