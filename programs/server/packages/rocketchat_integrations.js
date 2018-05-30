(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var MongoInternals = Package.mongo.MongoInternals;
var Mongo = Package.mongo.Mongo;
var ECMAScript = Package.ecmascript.ECMAScript;
var Babel = Package['babel-compiler'].Babel;
var BabelCompiler = Package['babel-compiler'].BabelCompiler;
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
var logger, integration, message;

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:integrations":{"lib":{"rocketchat.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_integrations/lib/rocketchat.js                                                                 //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
RocketChat.integrations = {
  outgoingEvents: {
    sendMessage: {
      label: 'Integrations_Outgoing_Type_SendMessage',
      value: 'sendMessage',
      use: {
        channel: true,
        triggerWords: true,
        targetRoom: false
      }
    },
    fileUploaded: {
      label: 'Integrations_Outgoing_Type_FileUploaded',
      value: 'fileUploaded',
      use: {
        channel: true,
        triggerWords: false,
        targetRoom: false
      }
    },
    roomArchived: {
      label: 'Integrations_Outgoing_Type_RoomArchived',
      value: 'roomArchived',
      use: {
        channel: false,
        triggerWords: false,
        targetRoom: false
      }
    },
    roomCreated: {
      label: 'Integrations_Outgoing_Type_RoomCreated',
      value: 'roomCreated',
      use: {
        channel: false,
        triggerWords: false,
        targetRoom: false
      }
    },
    roomJoined: {
      label: 'Integrations_Outgoing_Type_RoomJoined',
      value: 'roomJoined',
      use: {
        channel: true,
        triggerWords: false,
        targetRoom: false
      }
    },
    roomLeft: {
      label: 'Integrations_Outgoing_Type_RoomLeft',
      value: 'roomLeft',
      use: {
        channel: true,
        triggerWords: false,
        targetRoom: false
      }
    },
    userCreated: {
      label: 'Integrations_Outgoing_Type_UserCreated',
      value: 'userCreated',
      use: {
        channel: false,
        triggerWords: false,
        targetRoom: true
      }
    }
  }
};
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"server":{"logger.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_integrations/server/logger.js                                                                  //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
/* globals logger:true */

/* exported logger */
logger = new Logger('Integrations', {
  sections: {
    incoming: 'Incoming WebHook',
    outgoing: 'Outgoing WebHook'
  }
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"lib":{"validation.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_integrations/server/lib/validation.js                                                          //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
let s;
module.watch(require("underscore.string"), {
  default(v) {
    s = v;
  }

}, 1);
const scopedChannels = ['all_public_channels', 'all_private_groups', 'all_direct_messages'];
const validChannelChars = ['@', '#'];

function _verifyRequiredFields(integration) {
  if (!integration.event || !Match.test(integration.event, String) || integration.event.trim() === '' || !RocketChat.integrations.outgoingEvents[integration.event]) {
    throw new Meteor.Error('error-invalid-event-type', 'Invalid event type', {
      function: 'validateOutgoing._verifyRequiredFields'
    });
  }

  if (!integration.username || !Match.test(integration.username, String) || integration.username.trim() === '') {
    throw new Meteor.Error('error-invalid-username', 'Invalid username', {
      function: 'validateOutgoing._verifyRequiredFields'
    });
  }

  if (RocketChat.integrations.outgoingEvents[integration.event].use.targetRoom && !integration.targetRoom) {
    throw new Meteor.Error('error-invalid-targetRoom', 'Invalid Target Room', {
      function: 'validateOutgoing._verifyRequiredFields'
    });
  }

  if (!Match.test(integration.urls, [String])) {
    throw new Meteor.Error('error-invalid-urls', 'Invalid URLs', {
      function: 'validateOutgoing._verifyRequiredFields'
    });
  }

  for (const [index, url] of integration.urls.entries()) {
    if (url.trim() === '') {
      delete integration.urls[index];
    }
  }

  integration.urls = _.without(integration.urls, [undefined]);

  if (integration.urls.length === 0) {
    throw new Meteor.Error('error-invalid-urls', 'Invalid URLs', {
      function: 'validateOutgoing._verifyRequiredFields'
    });
  }
}

function _verifyUserHasPermissionForChannels(integration, userId, channels) {
  for (let channel of channels) {
    if (scopedChannels.includes(channel)) {
      if (channel === 'all_public_channels') {// No special permissions needed to add integration to public channels
      } else if (!RocketChat.authz.hasPermission(userId, 'manage-integrations')) {
        throw new Meteor.Error('error-invalid-channel', 'Invalid Channel', {
          function: 'validateOutgoing._verifyUserHasPermissionForChannels'
        });
      }
    } else {
      let record;
      const channelType = channel[0];
      channel = channel.substr(1);

      switch (channelType) {
        case '#':
          record = RocketChat.models.Rooms.findOne({
            $or: [{
              _id: channel
            }, {
              name: channel
            }]
          });
          break;

        case '@':
          record = RocketChat.models.Users.findOne({
            $or: [{
              _id: channel
            }, {
              username: channel
            }]
          });
          break;
      }

      if (!record) {
        throw new Meteor.Error('error-invalid-room', 'Invalid room', {
          function: 'validateOutgoing._verifyUserHasPermissionForChannels'
        });
      }

      if (record.usernames && !RocketChat.authz.hasPermission(userId, 'manage-integrations') && RocketChat.authz.hasPermission(userId, 'manage-own-integrations') && !record.usernames.includes(Meteor.user().username)) {
        throw new Meteor.Error('error-invalid-channel', 'Invalid Channel', {
          function: 'validateOutgoing._verifyUserHasPermissionForChannels'
        });
      }
    }
  }
}

function _verifyRetryInformation(integration) {
  if (!integration.retryFailedCalls) {
    return;
  } // Don't allow negative retry counts


  integration.retryCount = integration.retryCount && parseInt(integration.retryCount) > 0 ? parseInt(integration.retryCount) : 4;
  integration.retryDelay = !integration.retryDelay || !integration.retryDelay.trim() ? 'powers-of-ten' : integration.retryDelay.toLowerCase();
}

RocketChat.integrations.validateOutgoing = function _validateOutgoing(integration, userId) {
  if (integration.channel && Match.test(integration.channel, String) && integration.channel.trim() === '') {
    delete integration.channel;
  } //Moved to it's own function to statisfy the complexity rule


  _verifyRequiredFields(integration);

  let channels = [];

  if (RocketChat.integrations.outgoingEvents[integration.event].use.channel) {
    if (!Match.test(integration.channel, String)) {
      throw new Meteor.Error('error-invalid-channel', 'Invalid Channel', {
        function: 'validateOutgoing'
      });
    } else {
      channels = _.map(integration.channel.split(','), channel => s.trim(channel));

      for (const channel of channels) {
        if (!validChannelChars.includes(channel[0]) && !scopedChannels.includes(channel.toLowerCase())) {
          throw new Meteor.Error('error-invalid-channel-start-with-chars', 'Invalid channel. Start with @ or #', {
            function: 'validateOutgoing'
          });
        }
      }
    }
  } else if (!RocketChat.authz.hasPermission(userId, 'manage-integrations')) {
    throw new Meteor.Error('error-invalid-permissions', 'Invalid permission for required Integration creation.', {
      function: 'validateOutgoing'
    });
  }

  if (RocketChat.integrations.outgoingEvents[integration.event].use.triggerWords && integration.triggerWords) {
    if (!Match.test(integration.triggerWords, [String])) {
      throw new Meteor.Error('error-invalid-triggerWords', 'Invalid triggerWords', {
        function: 'validateOutgoing'
      });
    }

    integration.triggerWords.forEach((word, index) => {
      if (!word || word.trim() === '') {
        delete integration.triggerWords[index];
      }
    });
    integration.triggerWords = _.without(integration.triggerWords, [undefined]);
  } else {
    delete integration.triggerWords;
  }

  if (integration.scriptEnabled === true && integration.script && integration.script.trim() !== '') {
    try {
      const babelOptions = Object.assign(Babel.getDefaultOptions({
        runtime: false
      }), {
        compact: true,
        minified: true,
        comments: false
      });
      integration.scriptCompiled = Babel.compile(integration.script, babelOptions).code;
      integration.scriptError = undefined;
    } catch (e) {
      integration.scriptCompiled = undefined;
      integration.scriptError = _.pick(e, 'name', 'message', 'stack');
    }
  }

  if (typeof integration.runOnEdits !== 'undefined') {
    // Verify this value is only true/false
    integration.runOnEdits = integration.runOnEdits === true;
  }

  _verifyUserHasPermissionForChannels(integration, userId, channels);

  _verifyRetryInformation(integration);

  const user = RocketChat.models.Users.findOne({
    username: integration.username
  });

  if (!user) {
    throw new Meteor.Error('error-invalid-user', 'Invalid user (did you delete the `rocket.cat` user?)', {
      function: 'validateOutgoing'
    });
  }

  integration.type = 'webhook-outgoing';
  integration.userId = user._id;
  integration.channel = channels;
  return integration;
};
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"triggerHandler.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_integrations/server/lib/triggerHandler.js                                                      //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
var _interopRequireDefault = require("@babel/runtime/helpers/builtin/interopRequireDefault");

var _objectSpread2 = _interopRequireDefault(require("@babel/runtime/helpers/builtin/objectSpread"));

let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
let s;
module.watch(require("underscore.string"), {
  default(v) {
    s = v;
  }

}, 1);
let moment;
module.watch(require("moment"), {
  default(v) {
    moment = v;
  }

}, 2);
let vm;
module.watch(require("vm"), {
  default(v) {
    vm = v;
  }

}, 3);
RocketChat.integrations.triggerHandler = new class RocketChatIntegrationHandler {
  constructor() {
    this.vm = vm;
    this.successResults = [200, 201, 202];
    this.compiledScripts = {};
    this.triggers = {};
    RocketChat.models.Integrations.find({
      type: 'webhook-outgoing'
    }).observe({
      added: record => {
        this.addIntegration(record);
      },
      changed: record => {
        this.removeIntegration(record);
        this.addIntegration(record);
      },
      removed: record => {
        this.removeIntegration(record);
      }
    });
  }

  addIntegration(record) {
    logger.outgoing.debug(`Adding the integration ${record.name} of the event ${record.event}!`);
    let channels;

    if (record.event && !RocketChat.integrations.outgoingEvents[record.event].use.channel) {
      logger.outgoing.debug('The integration doesnt rely on channels.'); //We don't use any channels, so it's special ;)

      channels = ['__any'];
    } else if (_.isEmpty(record.channel)) {
      logger.outgoing.debug('The integration had an empty channel property, so it is going on all the public channels.');
      channels = ['all_public_channels'];
    } else {
      logger.outgoing.debug('The integration is going on these channels:', record.channel);
      channels = [].concat(record.channel);
    }

    for (const channel of channels) {
      if (!this.triggers[channel]) {
        this.triggers[channel] = {};
      }

      this.triggers[channel][record._id] = record;
    }
  }

  removeIntegration(record) {
    for (const trigger of Object.values(this.triggers)) {
      delete trigger[record._id];
    }
  }

  isTriggerEnabled(trigger) {
    for (const trig of Object.values(this.triggers)) {
      if (trig[trigger._id]) {
        return trig[trigger._id].enabled;
      }
    }

    return false;
  }

  updateHistory({
    historyId,
    step,
    integration,
    event,
    data,
    triggerWord,
    ranPrepareScript,
    prepareSentMessage,
    processSentMessage,
    resultMessage,
    finished,
    url,
    httpCallData,
    httpError,
    httpResult,
    error,
    errorStack
  }) {
    const history = {
      type: 'outgoing-webhook',
      step
    }; // Usually is only added on initial insert

    if (integration) {
      history.integration = integration;
    } // Usually is only added on initial insert


    if (event) {
      history.event = event;
    }

    if (data) {
      history.data = (0, _objectSpread2.default)({}, data);

      if (data.user) {
        history.data.user = _.omit(data.user, ['meta', '$loki', 'services']);
      }

      if (data.room) {
        history.data.room = _.omit(data.room, ['meta', '$loki', 'usernames']);
        history.data.room.usernames = ['this_will_be_filled_in_with_usernames_when_replayed'];
      }
    }

    if (triggerWord) {
      history.triggerWord = triggerWord;
    }

    if (typeof ranPrepareScript !== 'undefined') {
      history.ranPrepareScript = ranPrepareScript;
    }

    if (prepareSentMessage) {
      history.prepareSentMessage = prepareSentMessage;
    }

    if (processSentMessage) {
      history.processSentMessage = processSentMessage;
    }

    if (resultMessage) {
      history.resultMessage = resultMessage;
    }

    if (typeof finished !== 'undefined') {
      history.finished = finished;
    }

    if (url) {
      history.url = url;
    }

    if (typeof httpCallData !== 'undefined') {
      history.httpCallData = httpCallData;
    }

    if (httpError) {
      history.httpError = httpError;
    }

    if (typeof httpResult !== 'undefined') {
      history.httpResult = JSON.stringify(httpResult, null, 2);
    }

    if (typeof error !== 'undefined') {
      history.error = error;
    }

    if (typeof errorStack !== 'undefined') {
      history.errorStack = errorStack;
    }

    if (historyId) {
      RocketChat.models.IntegrationHistory.update({
        _id: historyId
      }, {
        $set: history
      });
      return historyId;
    } else {
      history._createdAt = new Date();
      return RocketChat.models.IntegrationHistory.insert(Object.assign({
        _id: Random.id()
      }, history));
    }
  } //Trigger is the trigger, nameOrId is a string which is used to try and find a room, room is a room, message is a message, and data contains "user_name" if trigger.impersonateUser is truthful.


  sendMessage({
    trigger,
    nameOrId = '',
    room,
    message,
    data
  }) {
    let user; //Try to find the user who we are impersonating

    if (trigger.impersonateUser) {
      user = RocketChat.models.Users.findOneByUsername(data.user_name);
    } //If they don't exist (aka the trigger didn't contain a user) then we set the user based upon the
    //configured username for the integration since this is required at all times.


    if (!user) {
      user = RocketChat.models.Users.findOneByUsername(trigger.username);
    }

    let tmpRoom;

    if (nameOrId || trigger.targetRoom || message.channel) {
      tmpRoom = RocketChat.getRoomByNameOrIdWithOptionToJoin({
        currentUserId: user._id,
        nameOrId: nameOrId || message.channel || trigger.targetRoom,
        errorOnEmpty: false
      }) || room;
    } else {
      tmpRoom = room;
    } //If no room could be found, we won't be sending any messages but we'll warn in the logs


    if (!tmpRoom) {
      logger.outgoing.warn(`The Integration "${trigger.name}" doesn't have a room configured nor did it provide a room to send the message to.`);
      return;
    }

    logger.outgoing.debug(`Found a room for ${trigger.name} which is: ${tmpRoom.name} with a type of ${tmpRoom.t}`);
    message.bot = {
      i: trigger._id
    };
    const defaultValues = {
      alias: trigger.alias,
      avatar: trigger.avatar,
      emoji: trigger.emoji
    };

    if (tmpRoom.t === 'd') {
      message.channel = `@${tmpRoom._id}`;
    } else {
      message.channel = `#${tmpRoom._id}`;
    }

    message = processWebhookMessage(message, user, defaultValues);
    return message;
  }

  buildSandbox(store = {}) {
    const sandbox = {
      _,
      s,
      console,
      moment,
      Store: {
        set: (key, val) => store[key] = val,
        get: key => store[key]
      },
      HTTP: (method, url, options) => {
        try {
          return {
            result: HTTP.call(method, url, options)
          };
        } catch (error) {
          return {
            error
          };
        }
      }
    };
    Object.keys(RocketChat.models).filter(k => !k.startsWith('_')).forEach(k => {
      sandbox[k] = RocketChat.models[k];
    });
    return {
      store,
      sandbox
    };
  }

  getIntegrationScript(integration) {
    const compiledScript = this.compiledScripts[integration._id];

    if (compiledScript && +compiledScript._updatedAt === +integration._updatedAt) {
      return compiledScript.script;
    }

    const script = integration.scriptCompiled;
    const {
      store,
      sandbox
    } = this.buildSandbox();
    let vmScript;

    try {
      logger.outgoing.info('Will evaluate script of Trigger', integration.name);
      logger.outgoing.debug(script);
      vmScript = this.vm.createScript(script, 'script.js');
      vmScript.runInNewContext(sandbox);

      if (sandbox.Script) {
        this.compiledScripts[integration._id] = {
          script: new sandbox.Script(),
          store,
          _updatedAt: integration._updatedAt
        };
        return this.compiledScripts[integration._id].script;
      }
    } catch (e) {
      logger.outgoing.error(`Error evaluating Script in Trigger ${integration.name}:`);
      logger.outgoing.error(script.replace(/^/gm, '  '));
      logger.outgoing.error('Stack Trace:');
      logger.outgoing.error(e.stack.replace(/^/gm, '  '));
      throw new Meteor.Error('error-evaluating-script');
    }

    if (!sandbox.Script) {
      logger.outgoing.error(`Class "Script" not in Trigger ${integration.name}:`);
      throw new Meteor.Error('class-script-not-found');
    }
  }

  hasScriptAndMethod(integration, method) {
    if (integration.scriptEnabled !== true || !integration.scriptCompiled || integration.scriptCompiled.trim() === '') {
      return false;
    }

    let script;

    try {
      script = this.getIntegrationScript(integration);
    } catch (e) {
      return false;
    }

    return typeof script[method] !== 'undefined';
  }

  executeScript(integration, method, params, historyId) {
    let script;

    try {
      script = this.getIntegrationScript(integration);
    } catch (e) {
      this.updateHistory({
        historyId,
        step: 'execute-script-getting-script',
        error: true,
        errorStack: e
      });
      return;
    }

    if (!script[method]) {
      logger.outgoing.error(`Method "${method}" no found in the Integration "${integration.name}"`);
      this.updateHistory({
        historyId,
        step: `execute-script-no-method-${method}`
      });
      return;
    }

    try {
      const {
        sandbox
      } = this.buildSandbox(this.compiledScripts[integration._id].store);
      sandbox.script = script;
      sandbox.method = method;
      sandbox.params = params;
      this.updateHistory({
        historyId,
        step: `execute-script-before-running-${method}`
      });
      const result = this.vm.runInNewContext('script[method](params)', sandbox, {
        timeout: 3000
      });
      logger.outgoing.debug(`Script method "${method}" result of the Integration "${integration.name}" is:`);
      logger.outgoing.debug(result);
      return result;
    } catch (e) {
      this.updateHistory({
        historyId,
        step: `execute-script-error-running-${method}`,
        error: true,
        errorStack: e.stack.replace(/^/gm, '  ')
      });
      logger.outgoing.error(`Error running Script in the Integration ${integration.name}:`);
      logger.outgoing.debug(integration.scriptCompiled.replace(/^/gm, '  ')); // Only output the compiled script if debugging is enabled, so the logs don't get spammed.

      logger.outgoing.error('Stack:');
      logger.outgoing.error(e.stack.replace(/^/gm, '  '));
      return;
    }
  }

  eventNameArgumentsToObject() {
    const argObject = {
      event: arguments[0]
    };

    switch (argObject.event) {
      case 'sendMessage':
        if (arguments.length >= 3) {
          argObject.message = arguments[1];
          argObject.room = arguments[2];
        }

        break;

      case 'fileUploaded':
        if (arguments.length >= 2) {
          const arghhh = arguments[1];
          argObject.user = arghhh.user;
          argObject.room = arghhh.room;
          argObject.message = arghhh.message;
        }

        break;

      case 'roomArchived':
        if (arguments.length >= 3) {
          argObject.room = arguments[1];
          argObject.user = arguments[2];
        }

        break;

      case 'roomCreated':
        if (arguments.length >= 3) {
          argObject.owner = arguments[1];
          argObject.room = arguments[2];
        }

        break;

      case 'roomJoined':
      case 'roomLeft':
        if (arguments.length >= 3) {
          argObject.user = arguments[1];
          argObject.room = arguments[2];
        }

        break;

      case 'userCreated':
        if (arguments.length >= 2) {
          argObject.user = arguments[1];
        }

        break;

      default:
        logger.outgoing.warn(`An Unhandled Trigger Event was called: ${argObject.event}`);
        argObject.event = undefined;
        break;
    }

    logger.outgoing.debug(`Got the event arguments for the event: ${argObject.event}`, argObject);
    return argObject;
  }

  mapEventArgsToData(data, {
    event,
    message,
    room,
    owner,
    user
  }) {
    switch (event) {
      case 'sendMessage':
        data.channel_id = room._id;
        data.channel_name = room.name;
        data.message_id = message._id;
        data.timestamp = message.ts;
        data.user_id = message.u._id;
        data.user_name = message.u.username;
        data.text = message.msg;

        if (message.alias) {
          data.alias = message.alias;
        }

        if (message.bot) {
          data.bot = message.bot;
        }

        if (message.editedAt) {
          data.isEdited = true;
        }

        break;

      case 'fileUploaded':
        data.channel_id = room._id;
        data.channel_name = room.name;
        data.message_id = message._id;
        data.timestamp = message.ts;
        data.user_id = message.u._id;
        data.user_name = message.u.username;
        data.text = message.msg;
        data.user = user;
        data.room = room;
        data.message = message;

        if (message.alias) {
          data.alias = message.alias;
        }

        if (message.bot) {
          data.bot = message.bot;
        }

        break;

      case 'roomCreated':
        data.channel_id = room._id;
        data.channel_name = room.name;
        data.timestamp = room.ts;
        data.user_id = owner._id;
        data.user_name = owner.username;
        data.owner = owner;
        data.room = room;
        break;

      case 'roomArchived':
      case 'roomJoined':
      case 'roomLeft':
        data.timestamp = new Date();
        data.channel_id = room._id;
        data.channel_name = room.name;
        data.user_id = user._id;
        data.user_name = user.username;
        data.user = user;
        data.room = room;

        if (user.type === 'bot') {
          data.bot = true;
        }

        break;

      case 'userCreated':
        data.timestamp = user.createdAt;
        data.user_id = user._id;
        data.user_name = user.username;
        data.user = user;

        if (user.type === 'bot') {
          data.bot = true;
        }

        break;

      default:
        break;
    }
  }

  executeTriggers() {
    logger.outgoing.debug('Execute Trigger:', arguments[0]);
    const argObject = this.eventNameArgumentsToObject(...arguments);
    const {
      event,
      message,
      room
    } = argObject; //Each type of event should have an event and a room attached, otherwise we
    //wouldn't know how to handle the trigger nor would we have anywhere to send the
    //result of the integration

    if (!event) {
      return;
    }

    const triggersToExecute = [];
    logger.outgoing.debug('Starting search for triggers for the room:', room ? room._id : '__any');

    if (room) {
      switch (room.t) {
        case 'd':
          const id = room._id.replace(message.u._id, '');

          const username = _.without(room.usernames, message.u.username)[0];

          if (this.triggers[`@${id}`]) {
            for (const trigger of Object.values(this.triggers[`@${id}`])) {
              triggersToExecute.push(trigger);
            }
          }

          if (this.triggers.all_direct_messages) {
            for (const trigger of Object.values(this.triggers.all_direct_messages)) {
              triggersToExecute.push(trigger);
            }
          }

          if (id !== username && this.triggers[`@${username}`]) {
            for (const trigger of Object.values(this.triggers[`@${username}`])) {
              triggersToExecute.push(trigger);
            }
          }

          break;

        case 'c':
          if (this.triggers.all_public_channels) {
            for (const trigger of Object.values(this.triggers.all_public_channels)) {
              triggersToExecute.push(trigger);
            }
          }

          if (this.triggers[`#${room._id}`]) {
            for (const trigger of Object.values(this.triggers[`#${room._id}`])) {
              triggersToExecute.push(trigger);
            }
          }

          if (room._id !== room.name && this.triggers[`#${room.name}`]) {
            for (const trigger of Object.values(this.triggers[`#${room.name}`])) {
              triggersToExecute.push(trigger);
            }
          }

          break;

        default:
          if (this.triggers.all_private_groups) {
            for (const trigger of Object.values(this.triggers.all_private_groups)) {
              triggersToExecute.push(trigger);
            }
          }

          if (this.triggers[`#${room._id}`]) {
            for (const trigger of Object.values(this.triggers[`#${room._id}`])) {
              triggersToExecute.push(trigger);
            }
          }

          if (room._id !== room.name && this.triggers[`#${room.name}`]) {
            for (const trigger of Object.values(this.triggers[`#${room.name}`])) {
              triggersToExecute.push(trigger);
            }
          }

          break;
      }
    }

    if (this.triggers.__any) {
      //For outgoing integration which don't rely on rooms.
      for (const trigger of Object.values(this.triggers.__any)) {
        triggersToExecute.push(trigger);
      }
    }

    logger.outgoing.debug(`Found ${triggersToExecute.length} to iterate over and see if the match the event.`);

    for (const triggerToExecute of triggersToExecute) {
      logger.outgoing.debug(`Is "${triggerToExecute.name}" enabled, ${triggerToExecute.enabled}, and what is the event? ${triggerToExecute.event}`);

      if (triggerToExecute.enabled === true && triggerToExecute.event === event) {
        this.executeTrigger(triggerToExecute, argObject);
      }
    }
  }

  executeTrigger(trigger, argObject) {
    for (const url of trigger.urls) {
      this.executeTriggerUrl(url, trigger, argObject, 0);
    }
  }

  executeTriggerUrl(url, trigger, {
    event,
    message,
    room,
    owner,
    user
  }, theHistoryId, tries = 0) {
    if (!this.isTriggerEnabled(trigger)) {
      logger.outgoing.warn(`The trigger "${trigger.name}" is no longer enabled, stopping execution of it at try: ${tries}`);
      return;
    }

    logger.outgoing.debug(`Starting to execute trigger: ${trigger.name} (${trigger._id})`);
    let word; //Not all triggers/events support triggerWords

    if (RocketChat.integrations.outgoingEvents[event].use.triggerWords) {
      if (trigger.triggerWords && trigger.triggerWords.length > 0) {
        for (const triggerWord of trigger.triggerWords) {
          if (!trigger.triggerWordAnywhere && message.msg.indexOf(triggerWord) === 0) {
            word = triggerWord;
            break;
          } else if (trigger.triggerWordAnywhere && message.msg.includes(triggerWord)) {
            word = triggerWord;
            break;
          }
        } // Stop if there are triggerWords but none match


        if (!word) {
          logger.outgoing.debug(`The trigger word which "${trigger.name}" was expecting could not be found, not executing.`);
          return;
        }
      }
    }

    if (message && message.editedAt && !trigger.runOnEdits) {
      logger.outgoing.debug(`The trigger "${trigger.name}"'s run on edits is disabled and the message was edited.`);
      return;
    }

    const historyId = this.updateHistory({
      step: 'start-execute-trigger-url',
      integration: trigger,
      event
    });
    const data = {
      token: trigger.token,
      bot: false
    };

    if (word) {
      data.trigger_word = word;
    }

    this.mapEventArgsToData(data, {
      trigger,
      event,
      message,
      room,
      owner,
      user
    });
    this.updateHistory({
      historyId,
      step: 'mapped-args-to-data',
      data,
      triggerWord: word
    });
    logger.outgoing.info(`Will be executing the Integration "${trigger.name}" to the url: ${url}`);
    logger.outgoing.debug(data);
    let opts = {
      params: {},
      method: 'POST',
      url,
      data,
      auth: undefined,
      npmRequestOptions: {
        rejectUnauthorized: !RocketChat.settings.get('Allow_Invalid_SelfSigned_Certs'),
        strictSSL: !RocketChat.settings.get('Allow_Invalid_SelfSigned_Certs')
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2227.0 Safari/537.36'
      }
    };

    if (this.hasScriptAndMethod(trigger, 'prepare_outgoing_request')) {
      opts = this.executeScript(trigger, 'prepare_outgoing_request', {
        request: opts
      }, historyId);
    }

    this.updateHistory({
      historyId,
      step: 'after-maybe-ran-prepare',
      ranPrepareScript: true
    });

    if (!opts) {
      this.updateHistory({
        historyId,
        step: 'after-prepare-no-opts',
        finished: true
      });
      return;
    }

    if (opts.message) {
      const prepareMessage = this.sendMessage({
        trigger,
        room,
        message: opts.message,
        data
      });
      this.updateHistory({
        historyId,
        step: 'after-prepare-send-message',
        prepareSentMessage: prepareMessage
      });
    }

    if (!opts.url || !opts.method) {
      this.updateHistory({
        historyId,
        step: 'after-prepare-no-url_or_method',
        finished: true
      });
      return;
    }

    this.updateHistory({
      historyId,
      step: 'pre-http-call',
      url: opts.url,
      httpCallData: opts.data
    });
    HTTP.call(opts.method, opts.url, opts, (error, result) => {
      if (!result) {
        logger.outgoing.warn(`Result for the Integration ${trigger.name} to ${url} is empty`);
      } else {
        logger.outgoing.info(`Status code for the Integration ${trigger.name} to ${url} is ${result.statusCode}`);
      }

      this.updateHistory({
        historyId,
        step: 'after-http-call',
        httpError: error,
        httpResult: result
      });

      if (this.hasScriptAndMethod(trigger, 'process_outgoing_response')) {
        const sandbox = {
          request: opts,
          response: {
            error,
            status_code: result ? result.statusCode : undefined,
            //These values will be undefined to close issues #4175, #5762, and #5896
            content: result ? result.data : undefined,
            content_raw: result ? result.content : undefined,
            headers: result ? result.headers : {}
          }
        };
        const scriptResult = this.executeScript(trigger, 'process_outgoing_response', sandbox, historyId);

        if (scriptResult && scriptResult.content) {
          const resultMessage = this.sendMessage({
            trigger,
            room,
            message: scriptResult.content,
            data
          });
          this.updateHistory({
            historyId,
            step: 'after-process-send-message',
            processSentMessage: resultMessage,
            finished: true
          });
          return;
        }

        if (scriptResult === false) {
          this.updateHistory({
            historyId,
            step: 'after-process-false-result',
            finished: true
          });
          return;
        }
      } // if the result contained nothing or wasn't a successful statusCode


      if (!result || !this.successResults.includes(result.statusCode)) {
        if (error) {
          logger.outgoing.error(`Error for the Integration "${trigger.name}" to ${url} is:`);
          logger.outgoing.error(error);
        }

        if (result) {
          logger.outgoing.error(`Error for the Integration "${trigger.name}" to ${url} is:`);
          logger.outgoing.error(result);

          if (result.statusCode === 410) {
            this.updateHistory({
              historyId,
              step: 'after-process-http-status-410',
              error: true
            });
            logger.outgoing.error(`Disabling the Integration "${trigger.name}" because the status code was 401 (Gone).`);
            RocketChat.models.Integrations.update({
              _id: trigger._id
            }, {
              $set: {
                enabled: false
              }
            });
            return;
          }

          if (result.statusCode === 500) {
            this.updateHistory({
              historyId,
              step: 'after-process-http-status-500',
              error: true
            });
            logger.outgoing.error(`Error "500" for the Integration "${trigger.name}" to ${url}.`);
            logger.outgoing.error(result.content);
            return;
          }
        }

        if (trigger.retryFailedCalls) {
          if (tries < trigger.retryCount && trigger.retryDelay) {
            this.updateHistory({
              historyId,
              error: true,
              step: `going-to-retry-${tries + 1}`
            });
            let waitTime;

            switch (trigger.retryDelay) {
              case 'powers-of-ten':
                // Try again in 0.1s, 1s, 10s, 1m40s, 16m40s, 2h46m40s, 27h46m40s, etc
                waitTime = Math.pow(10, tries + 2);
                break;

              case 'powers-of-two':
                // 2 seconds, 4 seconds, 8 seconds
                waitTime = Math.pow(2, tries + 1) * 1000;
                break;

              case 'increments-of-two':
                // 2 second, 4 seconds, 6 seconds, etc
                waitTime = (tries + 1) * 2 * 1000;
                break;

              default:
                const er = new Error('The integration\'s retryDelay setting is invalid.');
                this.updateHistory({
                  historyId,
                  step: 'failed-and-retry-delay-is-invalid',
                  error: true,
                  errorStack: er.stack
                });
                return;
            }

            logger.outgoing.info(`Trying the Integration ${trigger.name} to ${url} again in ${waitTime} milliseconds.`);
            Meteor.setTimeout(() => {
              this.executeTriggerUrl(url, trigger, {
                event,
                message,
                room,
                owner,
                user
              }, historyId, tries + 1);
            }, waitTime);
          } else {
            this.updateHistory({
              historyId,
              step: 'too-many-retries',
              error: true
            });
          }
        } else {
          this.updateHistory({
            historyId,
            step: 'failed-and-not-configured-to-retry',
            error: true
          });
        }

        return;
      } //process outgoing webhook response as a new message


      if (result && this.successResults.includes(result.statusCode)) {
        if (result && result.data && (result.data.text || result.data.attachments)) {
          const resultMsg = this.sendMessage({
            trigger,
            room,
            message: result.data,
            data
          });
          this.updateHistory({
            historyId,
            step: 'url-response-sent-message',
            resultMessage: resultMsg,
            finished: true
          });
        }
      }
    });
  }

  replay(integration, history) {
    if (!integration || integration.type !== 'webhook-outgoing') {
      throw new Meteor.Error('integration-type-must-be-outgoing', 'The integration type to replay must be an outgoing webhook.');
    }

    if (!history || !history.data) {
      throw new Meteor.Error('history-data-must-be-defined', 'The history data must be defined to replay an integration.');
    }

    const event = history.event;
    const message = RocketChat.models.Messages.findOneById(history.data.message_id);
    const room = RocketChat.models.Rooms.findOneById(history.data.channel_id);
    const user = RocketChat.models.Users.findOneById(history.data.user_id);
    let owner;

    if (history.data.owner && history.data.owner._id) {
      owner = RocketChat.models.Users.findOneById(history.data.owner._id);
    }

    this.executeTriggerUrl(history.url, integration, {
      event,
      message,
      room,
      owner,
      user
    });
  }

}();
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"models":{"Integrations.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_integrations/server/models/Integrations.js                                                     //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
RocketChat.models.Integrations = new class Integrations extends RocketChat.models._Base {
  constructor() {
    super('integrations');
  }

  findByType(type, options) {
    if (type !== 'webhook-incoming' && type !== 'webhook-outgoing') {
      throw new Meteor.Error('invalid-type-to-find');
    }

    return this.find({
      type
    }, options);
  }

  disableByUserId(userId) {
    return this.update({
      userId
    }, {
      $set: {
        enabled: false
      }
    }, {
      multi: true
    });
  }

}();
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"IntegrationHistory.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_integrations/server/models/IntegrationHistory.js                                               //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
RocketChat.models.IntegrationHistory = new class IntegrationHistory extends RocketChat.models._Base {
  constructor() {
    super('integration_history');
  }

  findByType(type, options) {
    if (type !== 'outgoing-webhook' || type !== 'incoming-webhook') {
      throw new Meteor.Error('invalid-integration-type');
    }

    return this.find({
      type
    }, options);
  }

  findByIntegrationId(id, options) {
    return this.find({
      'integration._id': id
    }, options);
  }

  findByIntegrationIdAndCreatedBy(id, creatorId, options) {
    return this.find({
      'integration._id': id,
      'integration._createdBy._id': creatorId
    }, options);
  }

  findOneByIntegrationIdAndHistoryId(integrationId, historyId) {
    return this.findOne({
      'integration._id': integrationId,
      _id: historyId
    });
  }

  findByEventName(event, options) {
    return this.find({
      event
    }, options);
  }

  findFailed(options) {
    return this.find({
      error: true
    }, options);
  }

  removeByIntegrationId(integrationId) {
    return this.remove({
      'integration._id': integrationId
    });
  }

}();
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"publications":{"integrations.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_integrations/server/publications/integrations.js                                               //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
Meteor.publish('integrations', function _integrationPublication() {
  if (!this.userId) {
    return this.ready();
  }

  if (RocketChat.authz.hasPermission(this.userId, 'manage-integrations')) {
    return RocketChat.models.Integrations.find();
  } else if (RocketChat.authz.hasPermission(this.userId, 'manage-own-integrations')) {
    return RocketChat.models.Integrations.find({
      '_createdBy._id': this.userId
    });
  } else {
    throw new Meteor.Error('not-authorized');
  }
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"integrationHistory.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_integrations/server/publications/integrationHistory.js                                         //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
Meteor.publish('integrationHistory', function _integrationHistoryPublication(integrationId, limit = 25) {
  if (!this.userId) {
    return this.ready();
  }

  if (RocketChat.authz.hasPermission(this.userId, 'manage-integrations')) {
    return RocketChat.models.IntegrationHistory.findByIntegrationId(integrationId, {
      sort: {
        _updatedAt: -1
      },
      limit
    });
  } else if (RocketChat.authz.hasPermission(this.userId, 'manage-own-integrations')) {
    return RocketChat.models.IntegrationHistory.findByIntegrationIdAndCreatedBy(integrationId, this.userId, {
      sort: {
        _updatedAt: -1
      },
      limit
    });
  } else {
    throw new Meteor.Error('not-authorized');
  }
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"methods":{"incoming":{"addIncomingIntegration.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_integrations/server/methods/incoming/addIncomingIntegration.js                                 //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
let s;
module.watch(require("underscore.string"), {
  default(v) {
    s = v;
  }

}, 1);
const validChannelChars = ['@', '#'];
Meteor.methods({
  addIncomingIntegration(integration) {
    if (!RocketChat.authz.hasPermission(this.userId, 'manage-integrations') && !RocketChat.authz.hasPermission(this.userId, 'manage-own-integrations')) {
      throw new Meteor.Error('not_authorized', 'Unauthorized', {
        method: 'addIncomingIntegration'
      });
    }

    if (!_.isString(integration.channel)) {
      throw new Meteor.Error('error-invalid-channel', 'Invalid channel', {
        method: 'addIncomingIntegration'
      });
    }

    if (integration.channel.trim() === '') {
      throw new Meteor.Error('error-invalid-channel', 'Invalid channel', {
        method: 'addIncomingIntegration'
      });
    }

    const channels = _.map(integration.channel.split(','), channel => s.trim(channel));

    for (const channel of channels) {
      if (!validChannelChars.includes(channel[0])) {
        throw new Meteor.Error('error-invalid-channel-start-with-chars', 'Invalid channel. Start with @ or #', {
          method: 'updateIncomingIntegration'
        });
      }
    }

    if (!_.isString(integration.username) || integration.username.trim() === '') {
      throw new Meteor.Error('error-invalid-username', 'Invalid username', {
        method: 'addIncomingIntegration'
      });
    }

    if (integration.scriptEnabled === true && integration.script && integration.script.trim() !== '') {
      try {
        let babelOptions = Babel.getDefaultOptions({
          runtime: false
        });
        babelOptions = _.extend(babelOptions, {
          compact: true,
          minified: true,
          comments: false
        });
        integration.scriptCompiled = Babel.compile(integration.script, babelOptions).code;
        integration.scriptError = undefined;
      } catch (e) {
        integration.scriptCompiled = undefined;
        integration.scriptError = _.pick(e, 'name', 'message', 'stack');
      }
    }

    for (let channel of channels) {
      let record;
      const channelType = channel[0];
      channel = channel.substr(1);

      switch (channelType) {
        case '#':
          record = RocketChat.models.Rooms.findOne({
            $or: [{
              _id: channel
            }, {
              name: channel
            }]
          });
          break;

        case '@':
          record = RocketChat.models.Users.findOne({
            $or: [{
              _id: channel
            }, {
              username: channel
            }]
          });
          break;
      }

      if (!record) {
        throw new Meteor.Error('error-invalid-room', 'Invalid room', {
          method: 'addIncomingIntegration'
        });
      }

      if (record.usernames && !RocketChat.authz.hasPermission(this.userId, 'manage-integrations') && RocketChat.authz.hasPermission(this.userId, 'manage-own-integrations') && !record.usernames.includes(Meteor.user().username)) {
        throw new Meteor.Error('error-invalid-channel', 'Invalid Channel', {
          method: 'addIncomingIntegration'
        });
      }
    }

    const user = RocketChat.models.Users.findOne({
      username: integration.username
    });

    if (!user) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'addIncomingIntegration'
      });
    }

    const token = Random.id(48);
    integration.type = 'webhook-incoming';
    integration.token = token;
    integration.channel = channels;
    integration.userId = user._id;
    integration._createdAt = new Date();
    integration._createdBy = RocketChat.models.Users.findOne(this.userId, {
      fields: {
        username: 1
      }
    });
    RocketChat.models.Roles.addUserRoles(user._id, 'bot');
    integration._id = RocketChat.models.Integrations.insert(integration);
    return integration;
  }

});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"updateIncomingIntegration.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_integrations/server/methods/incoming/updateIncomingIntegration.js                              //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
let s;
module.watch(require("underscore.string"), {
  default(v) {
    s = v;
  }

}, 1);
const validChannelChars = ['@', '#'];
Meteor.methods({
  updateIncomingIntegration(integrationId, integration) {
    if (!_.isString(integration.channel) || integration.channel.trim() === '') {
      throw new Meteor.Error('error-invalid-channel', 'Invalid channel', {
        method: 'updateIncomingIntegration'
      });
    }

    const channels = _.map(integration.channel.split(','), channel => s.trim(channel));

    for (const channel of channels) {
      if (!validChannelChars.includes(channel[0])) {
        throw new Meteor.Error('error-invalid-channel-start-with-chars', 'Invalid channel. Start with @ or #', {
          method: 'updateIncomingIntegration'
        });
      }
    }

    let currentIntegration;

    if (RocketChat.authz.hasPermission(this.userId, 'manage-integrations')) {
      currentIntegration = RocketChat.models.Integrations.findOne(integrationId);
    } else if (RocketChat.authz.hasPermission(this.userId, 'manage-own-integrations')) {
      currentIntegration = RocketChat.models.Integrations.findOne({
        _id: integrationId,
        '_createdBy._id': this.userId
      });
    } else {
      throw new Meteor.Error('not_authorized', 'Unauthorized', {
        method: 'updateIncomingIntegration'
      });
    }

    if (!currentIntegration) {
      throw new Meteor.Error('error-invalid-integration', 'Invalid integration', {
        method: 'updateIncomingIntegration'
      });
    }

    if (integration.scriptEnabled === true && integration.script && integration.script.trim() !== '') {
      try {
        let babelOptions = Babel.getDefaultOptions({
          runtime: false
        });
        babelOptions = _.extend(babelOptions, {
          compact: true,
          minified: true,
          comments: false
        });
        integration.scriptCompiled = Babel.compile(integration.script, babelOptions).code;
        integration.scriptError = undefined;
      } catch (e) {
        integration.scriptCompiled = undefined;
        integration.scriptError = _.pick(e, 'name', 'message', 'stack');
      }
    }

    for (let channel of channels) {
      const channelType = channel[0];
      channel = channel.substr(1);
      let record;

      switch (channelType) {
        case '#':
          record = RocketChat.models.Rooms.findOne({
            $or: [{
              _id: channel
            }, {
              name: channel
            }]
          });
          break;

        case '@':
          record = RocketChat.models.Users.findOne({
            $or: [{
              _id: channel
            }, {
              username: channel
            }]
          });
          break;
      }

      if (!record) {
        throw new Meteor.Error('error-invalid-room', 'Invalid room', {
          method: 'updateIncomingIntegration'
        });
      }

      if (record.usernames && !RocketChat.authz.hasPermission(this.userId, 'manage-integrations') && RocketChat.authz.hasPermission(this.userId, 'manage-own-integrations') && !record.usernames.includes(Meteor.user().username)) {
        throw new Meteor.Error('error-invalid-channel', 'Invalid Channel', {
          method: 'updateIncomingIntegration'
        });
      }
    }

    const user = RocketChat.models.Users.findOne({
      username: currentIntegration.username
    });

    if (!user || !user._id) {
      throw new Meteor.Error('error-invalid-post-as-user', 'Invalid Post As User', {
        method: 'updateIncomingIntegration'
      });
    }

    RocketChat.models.Roles.addUserRoles(user._id, 'bot');
    RocketChat.models.Integrations.update(integrationId, {
      $set: {
        enabled: integration.enabled,
        name: integration.name,
        avatar: integration.avatar,
        emoji: integration.emoji,
        alias: integration.alias,
        channel: channels,
        script: integration.script,
        scriptEnabled: integration.scriptEnabled,
        scriptCompiled: integration.scriptCompiled,
        scriptError: integration.scriptError,
        _updatedAt: new Date(),
        _updatedBy: RocketChat.models.Users.findOne(this.userId, {
          fields: {
            username: 1
          }
        })
      }
    });
    return RocketChat.models.Integrations.findOne(integrationId);
  }

});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"deleteIncomingIntegration.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_integrations/server/methods/incoming/deleteIncomingIntegration.js                              //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
Meteor.methods({
  deleteIncomingIntegration(integrationId) {
    let integration;

    if (RocketChat.authz.hasPermission(this.userId, 'manage-integrations')) {
      integration = RocketChat.models.Integrations.findOne(integrationId);
    } else if (RocketChat.authz.hasPermission(this.userId, 'manage-own-integrations')) {
      integration = RocketChat.models.Integrations.findOne(integrationId, {
        fields: {
          '_createdBy._id': this.userId
        }
      });
    } else {
      throw new Meteor.Error('not_authorized', 'Unauthorized', {
        method: 'deleteIncomingIntegration'
      });
    }

    if (!integration) {
      throw new Meteor.Error('error-invalid-integration', 'Invalid integration', {
        method: 'deleteIncomingIntegration'
      });
    }

    RocketChat.models.Integrations.remove({
      _id: integrationId
    });
    return true;
  }

});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"outgoing":{"addOutgoingIntegration.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_integrations/server/methods/outgoing/addOutgoingIntegration.js                                 //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
Meteor.methods({
  addOutgoingIntegration(integration) {
    if (!RocketChat.authz.hasPermission(this.userId, 'manage-integrations') && !RocketChat.authz.hasPermission(this.userId, 'manage-own-integrations') && !RocketChat.authz.hasPermission(this.userId, 'manage-integrations', 'bot') && !RocketChat.authz.hasPermission(this.userId, 'manage-own-integrations', 'bot')) {
      throw new Meteor.Error('not_authorized');
    }

    integration = RocketChat.integrations.validateOutgoing(integration, this.userId);
    integration._createdAt = new Date();
    integration._createdBy = RocketChat.models.Users.findOne(this.userId, {
      fields: {
        username: 1
      }
    });
    integration._id = RocketChat.models.Integrations.insert(integration);
    return integration;
  }

});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"updateOutgoingIntegration.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_integrations/server/methods/outgoing/updateOutgoingIntegration.js                              //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
Meteor.methods({
  updateOutgoingIntegration(integrationId, integration) {
    integration = RocketChat.integrations.validateOutgoing(integration, this.userId);

    if (!integration.token || integration.token.trim() === '') {
      throw new Meteor.Error('error-invalid-token', 'Invalid token', {
        method: 'updateOutgoingIntegration'
      });
    }

    let currentIntegration;

    if (RocketChat.authz.hasPermission(this.userId, 'manage-integrations')) {
      currentIntegration = RocketChat.models.Integrations.findOne(integrationId);
    } else if (RocketChat.authz.hasPermission(this.userId, 'manage-own-integrations')) {
      currentIntegration = RocketChat.models.Integrations.findOne({
        _id: integrationId,
        '_createdBy._id': this.userId
      });
    } else {
      throw new Meteor.Error('not_authorized', 'Unauthorized', {
        method: 'updateOutgoingIntegration'
      });
    }

    if (!currentIntegration) {
      throw new Meteor.Error('invalid_integration', '[methods] updateOutgoingIntegration -> integration not found');
    }

    RocketChat.models.Integrations.update(integrationId, {
      $set: {
        event: integration.event,
        enabled: integration.enabled,
        name: integration.name,
        avatar: integration.avatar,
        emoji: integration.emoji,
        alias: integration.alias,
        channel: integration.channel,
        targetRoom: integration.targetRoom,
        impersonateUser: integration.impersonateUser,
        username: integration.username,
        userId: integration.userId,
        urls: integration.urls,
        token: integration.token,
        script: integration.script,
        scriptEnabled: integration.scriptEnabled,
        scriptCompiled: integration.scriptCompiled,
        scriptError: integration.scriptError,
        triggerWords: integration.triggerWords,
        retryFailedCalls: integration.retryFailedCalls,
        retryCount: integration.retryCount,
        retryDelay: integration.retryDelay,
        triggerWordAnywhere: integration.triggerWordAnywhere,
        runOnEdits: integration.runOnEdits,
        _updatedAt: new Date(),
        _updatedBy: RocketChat.models.Users.findOne(this.userId, {
          fields: {
            username: 1
          }
        })
      }
    });
    return RocketChat.models.Integrations.findOne(integrationId);
  }

});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"replayOutgoingIntegration.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_integrations/server/methods/outgoing/replayOutgoingIntegration.js                              //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
Meteor.methods({
  replayOutgoingIntegration({
    integrationId,
    historyId
  }) {
    let integration;

    if (RocketChat.authz.hasPermission(this.userId, 'manage-integrations') || RocketChat.authz.hasPermission(this.userId, 'manage-integrations', 'bot')) {
      integration = RocketChat.models.Integrations.findOne(integrationId);
    } else if (RocketChat.authz.hasPermission(this.userId, 'manage-own-integrations') || RocketChat.authz.hasPermission(this.userId, 'manage-own-integrations', 'bot')) {
      integration = RocketChat.models.Integrations.findOne(integrationId, {
        fields: {
          '_createdBy._id': this.userId
        }
      });
    } else {
      throw new Meteor.Error('not_authorized', 'Unauthorized', {
        method: 'replayOutgoingIntegration'
      });
    }

    if (!integration) {
      throw new Meteor.Error('error-invalid-integration', 'Invalid integration', {
        method: 'replayOutgoingIntegration'
      });
    }

    const history = RocketChat.models.IntegrationHistory.findOneByIntegrationIdAndHistoryId(integration._id, historyId);

    if (!history) {
      throw new Meteor.Error('error-invalid-integration-history', 'Invalid Integration History', {
        method: 'replayOutgoingIntegration'
      });
    }

    RocketChat.integrations.triggerHandler.replay(integration, history);
    return true;
  }

});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"deleteOutgoingIntegration.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_integrations/server/methods/outgoing/deleteOutgoingIntegration.js                              //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
Meteor.methods({
  deleteOutgoingIntegration(integrationId) {
    let integration;

    if (RocketChat.authz.hasPermission(this.userId, 'manage-integrations') || RocketChat.authz.hasPermission(this.userId, 'manage-integrations', 'bot')) {
      integration = RocketChat.models.Integrations.findOne(integrationId);
    } else if (RocketChat.authz.hasPermission(this.userId, 'manage-own-integrations') || RocketChat.authz.hasPermission(this.userId, 'manage-own-integrations', 'bot')) {
      integration = RocketChat.models.Integrations.findOne(integrationId, {
        fields: {
          '_createdBy._id': this.userId
        }
      });
    } else {
      throw new Meteor.Error('not_authorized', 'Unauthorized', {
        method: 'deleteOutgoingIntegration'
      });
    }

    if (!integration) {
      throw new Meteor.Error('error-invalid-integration', 'Invalid integration', {
        method: 'deleteOutgoingIntegration'
      });
    }

    RocketChat.models.Integrations.remove({
      _id: integrationId
    });
    RocketChat.models.IntegrationHistory.removeByIntegrationId(integrationId);
    return true;
  }

});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"clearIntegrationHistory.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_integrations/server/methods/clearIntegrationHistory.js                                         //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
Meteor.methods({
  clearIntegrationHistory(integrationId) {
    let integration;

    if (RocketChat.authz.hasPermission(this.userId, 'manage-integrations') || RocketChat.authz.hasPermission(this.userId, 'manage-integrations', 'bot')) {
      integration = RocketChat.models.Integrations.findOne(integrationId);
    } else if (RocketChat.authz.hasPermission(this.userId, 'manage-own-integrations') || RocketChat.authz.hasPermission(this.userId, 'manage-own-integrations', 'bot')) {
      integration = RocketChat.models.Integrations.findOne(integrationId, {
        fields: {
          '_createdBy._id': this.userId
        }
      });
    } else {
      throw new Meteor.Error('not_authorized', 'Unauthorized', {
        method: 'clearIntegrationHistory'
      });
    }

    if (!integration) {
      throw new Meteor.Error('error-invalid-integration', 'Invalid integration', {
        method: 'clearIntegrationHistory'
      });
    }

    RocketChat.models.IntegrationHistory.removeByIntegrationId(integrationId);
    return true;
  }

});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"api":{"api.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_integrations/server/api/api.js                                                                 //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
let s;
module.watch(require("underscore.string"), {
  default(v) {
    s = v;
  }

}, 1);
let vm;
module.watch(require("vm"), {
  default(v) {
    vm = v;
  }

}, 2);
let moment;
module.watch(require("moment"), {
  default(v) {
    moment = v;
  }

}, 3);
const Api = new Restivus({
  enableCors: true,
  apiPath: 'hooks/',
  auth: {
    user() {
      const payloadKeys = Object.keys(this.bodyParams);
      const payloadIsWrapped = this.bodyParams && this.bodyParams.payload && payloadKeys.length === 1;

      if (payloadIsWrapped && this.request.headers['content-type'] === 'application/x-www-form-urlencoded') {
        try {
          this.bodyParams = JSON.parse(this.bodyParams.payload);
        } catch ({
          message
        }) {
          return {
            error: {
              statusCode: 400,
              body: {
                success: false,
                error: message
              }
            }
          };
        }
      }

      this.integration = RocketChat.models.Integrations.findOne({
        _id: this.request.params.integrationId,
        token: decodeURIComponent(this.request.params.token)
      });

      if (!this.integration) {
        logger.incoming.info('Invalid integration id', this.request.params.integrationId, 'or token', this.request.params.token);
        return {
          error: {
            statusCode: 404,
            body: {
              success: false,
              error: 'Invalid integration id or token provided.'
            }
          }
        };
      }

      const user = RocketChat.models.Users.findOne({
        _id: this.integration.userId
      });
      return {
        user
      };
    }

  }
});
const compiledScripts = {};

function buildSandbox(store = {}) {
  const sandbox = {
    _,
    s,
    console,
    moment,
    Livechat: RocketChat.Livechat,
    Store: {
      set(key, val) {
        return store[key] = val;
      },

      get(key) {
        return store[key];
      }

    },

    HTTP(method, url, options) {
      try {
        return {
          result: HTTP.call(method, url, options)
        };
      } catch (error) {
        return {
          error
        };
      }
    }

  };
  Object.keys(RocketChat.models).filter(k => !k.startsWith('_')).forEach(k => sandbox[k] = RocketChat.models[k]);
  return {
    store,
    sandbox
  };
}

function getIntegrationScript(integration) {
  const compiledScript = compiledScripts[integration._id];

  if (compiledScript && +compiledScript._updatedAt === +integration._updatedAt) {
    return compiledScript.script;
  }

  const script = integration.scriptCompiled;
  const {
    sandbox,
    store
  } = buildSandbox();

  try {
    logger.incoming.info('Will evaluate script of Trigger', integration.name);
    logger.incoming.debug(script);
    const vmScript = vm.createScript(script, 'script.js');
    vmScript.runInNewContext(sandbox);

    if (sandbox.Script) {
      compiledScripts[integration._id] = {
        script: new sandbox.Script(),
        store,
        _updatedAt: integration._updatedAt
      };
      return compiledScripts[integration._id].script;
    }
  } catch ({
    stack
  }) {
    logger.incoming.error('[Error evaluating Script in Trigger', integration.name, ':]');
    logger.incoming.error(script.replace(/^/gm, '  '));
    logger.incoming.error('[Stack:]');
    logger.incoming.error(stack.replace(/^/gm, '  '));
    throw RocketChat.API.v1.failure('error-evaluating-script');
  }

  if (!sandbox.Script) {
    logger.incoming.error('[Class "Script" not in Trigger', integration.name, ']');
    throw RocketChat.API.v1.failure('class-script-not-found');
  }
}

function createIntegration(options, user) {
  logger.incoming.info('Add integration', options.name);
  logger.incoming.debug(options);
  Meteor.runAsUser(user._id, function () {
    switch (options['event']) {
      case 'newMessageOnChannel':
        if (options.data == null) {
          options.data = {};
        }

        if (options.data.channel_name != null && options.data.channel_name.indexOf('#') === -1) {
          options.data.channel_name = `#${options.data.channel_name}`;
        }

        return Meteor.call('addOutgoingIntegration', {
          username: 'rocket.cat',
          urls: [options.target_url],
          name: options.name,
          channel: options.data.channel_name,
          triggerWords: options.data.trigger_words
        });

      case 'newMessageToUser':
        if (options.data.username.indexOf('@') === -1) {
          options.data.username = `@${options.data.username}`;
        }

        return Meteor.call('addOutgoingIntegration', {
          username: 'rocket.cat',
          urls: [options.target_url],
          name: options.name,
          channel: options.data.username,
          triggerWords: options.data.trigger_words
        });
    }
  });
  return RocketChat.API.v1.success();
}

function removeIntegration(options, user) {
  logger.incoming.info('Remove integration');
  logger.incoming.debug(options);
  const integrationToRemove = RocketChat.models.Integrations.findOne({
    urls: options.target_url
  });
  Meteor.runAsUser(user._id, () => {
    return Meteor.call('deleteOutgoingIntegration', integrationToRemove._id);
  });
  return RocketChat.API.v1.success();
}

function executeIntegrationRest() {
  logger.incoming.info('Post integration:', this.integration.name);
  logger.incoming.debug('@urlParams:', this.urlParams);
  logger.incoming.debug('@bodyParams:', this.bodyParams);

  if (this.integration.enabled !== true) {
    return {
      statusCode: 503,
      body: 'Service Unavailable'
    };
  }

  const defaultValues = {
    channel: this.integration.channel,
    alias: this.integration.alias,
    avatar: this.integration.avatar,
    emoji: this.integration.emoji
  };

  if (this.integration.scriptEnabled && this.integration.scriptCompiled && this.integration.scriptCompiled.trim() !== '') {
    let script;

    try {
      script = getIntegrationScript(this.integration);
    } catch (e) {
      logger.incoming.warn(e);
      return RocketChat.API.v1.failure(e.message);
    }

    this.request.setEncoding('utf8');
    const content_raw = this.request.read();
    const request = {
      url: {
        hash: this.request._parsedUrl.hash,
        search: this.request._parsedUrl.search,
        query: this.queryParams,
        pathname: this.request._parsedUrl.pathname,
        path: this.request._parsedUrl.path
      },
      url_raw: this.request.url,
      url_params: this.urlParams,
      content: this.bodyParams,
      content_raw,
      headers: this.request.headers,
      body: this.request.body,
      user: {
        _id: this.user._id,
        name: this.user.name,
        username: this.user.username
      }
    };

    try {
      const {
        sandbox
      } = buildSandbox(compiledScripts[this.integration._id].store);
      sandbox.script = script;
      sandbox.request = request;
      const result = vm.runInNewContext('script.process_incoming_request({ request: request })', sandbox, {
        timeout: 3000
      });

      if (!result) {
        logger.incoming.debug('[Process Incoming Request result of Trigger', this.integration.name, ':] No data');
        return RocketChat.API.v1.success();
      } else if (result && result.error) {
        return RocketChat.API.v1.failure(result.error);
      }

      this.bodyParams = result && result.content;
      this.scriptResponse = result.response;

      if (result.user) {
        this.user = result.user;
      }

      logger.incoming.debug('[Process Incoming Request result of Trigger', this.integration.name, ':]');
      logger.incoming.debug('result', this.bodyParams);
    } catch ({
      stack
    }) {
      logger.incoming.error('[Error running Script in Trigger', this.integration.name, ':]');
      logger.incoming.error(this.integration.scriptCompiled.replace(/^/gm, '  '));
      logger.incoming.error('[Stack:]');
      logger.incoming.error(stack.replace(/^/gm, '  '));
      return RocketChat.API.v1.failure('error-running-script');
    }
  } // TODO: Turn this into an option on the integrations - no body means a success
  // TODO: Temporary fix for https://github.com/RocketChat/Rocket.Chat/issues/7770 until the above is implemented


  if (!this.bodyParams || _.isEmpty(this.bodyParams) && !this.integration.scriptEnabled) {
    // return RocketChat.API.v1.failure('body-empty');
    return RocketChat.API.v1.success();
  }

  this.bodyParams.bot = {
    i: this.integration._id
  };

  try {
    const message = processWebhookMessage(this.bodyParams, this.user, defaultValues);

    if (_.isEmpty(message)) {
      return RocketChat.API.v1.failure('unknown-error');
    }

    if (this.scriptResponse) {
      logger.incoming.debug('response', this.scriptResponse);
    }

    return RocketChat.API.v1.success(this.scriptResponse);
  } catch ({
    error,
    message
  }) {
    return RocketChat.API.v1.failure(error || message);
  }
}

function addIntegrationRest() {
  return createIntegration(this.bodyParams, this.user);
}

function removeIntegrationRest() {
  return removeIntegration(this.bodyParams, this.user);
}

function integrationSampleRest() {
  logger.incoming.info('Sample Integration');
  return {
    statusCode: 200,
    body: [{
      token: Random.id(24),
      channel_id: Random.id(),
      channel_name: 'general',
      timestamp: new Date(),
      user_id: Random.id(),
      user_name: 'rocket.cat',
      text: 'Sample text 1',
      trigger_word: 'Sample'
    }, {
      token: Random.id(24),
      channel_id: Random.id(),
      channel_name: 'general',
      timestamp: new Date(),
      user_id: Random.id(),
      user_name: 'rocket.cat',
      text: 'Sample text 2',
      trigger_word: 'Sample'
    }, {
      token: Random.id(24),
      channel_id: Random.id(),
      channel_name: 'general',
      timestamp: new Date(),
      user_id: Random.id(),
      user_name: 'rocket.cat',
      text: 'Sample text 3',
      trigger_word: 'Sample'
    }]
  };
}

function integrationInfoRest() {
  logger.incoming.info('Info integration');
  return {
    statusCode: 200,
    body: {
      success: true
    }
  };
}

Api.addRoute(':integrationId/:userId/:token', {
  authRequired: true
}, {
  post: executeIntegrationRest,
  get: executeIntegrationRest
});
Api.addRoute(':integrationId/:token', {
  authRequired: true
}, {
  post: executeIntegrationRest,
  get: executeIntegrationRest
});
Api.addRoute('sample/:integrationId/:userId/:token', {
  authRequired: true
}, {
  get: integrationSampleRest
});
Api.addRoute('sample/:integrationId/:token', {
  authRequired: true
}, {
  get: integrationSampleRest
});
Api.addRoute('info/:integrationId/:userId/:token', {
  authRequired: true
}, {
  get: integrationInfoRest
});
Api.addRoute('info/:integrationId/:token', {
  authRequired: true
}, {
  get: integrationInfoRest
});
Api.addRoute('add/:integrationId/:userId/:token', {
  authRequired: true
}, {
  post: addIntegrationRest
});
Api.addRoute('add/:integrationId/:token', {
  authRequired: true
}, {
  post: addIntegrationRest
});
Api.addRoute('remove/:integrationId/:userId/:token', {
  authRequired: true
}, {
  post: removeIntegrationRest
});
Api.addRoute('remove/:integrationId/:token', {
  authRequired: true
}, {
  post: removeIntegrationRest
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"triggers.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_integrations/server/triggers.js                                                                //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
const callbackHandler = function _callbackHandler(eventType) {
  return function _wrapperFunction() {
    return RocketChat.integrations.triggerHandler.executeTriggers(eventType, ...arguments);
  };
};

RocketChat.callbacks.add('afterSaveMessage', callbackHandler('sendMessage'), RocketChat.callbacks.priority.LOW);
RocketChat.callbacks.add('afterCreateChannel', callbackHandler('roomCreated'), RocketChat.callbacks.priority.LOW);
RocketChat.callbacks.add('afterCreatePrivateGroup', callbackHandler('roomCreated'), RocketChat.callbacks.priority.LOW);
RocketChat.callbacks.add('afterCreateUser', callbackHandler('userCreated'), RocketChat.callbacks.priority.LOW);
RocketChat.callbacks.add('afterJoinRoom', callbackHandler('roomJoined'), RocketChat.callbacks.priority.LOW);
RocketChat.callbacks.add('afterLeaveRoom', callbackHandler('roomLeft'), RocketChat.callbacks.priority.LOW);
RocketChat.callbacks.add('afterRoomArchived', callbackHandler('roomArchived'), RocketChat.callbacks.priority.LOW);
RocketChat.callbacks.add('afterFileUpload', callbackHandler('fileUploaded'), RocketChat.callbacks.priority.LOW);
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"processWebhookMessage.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_integrations/server/processWebhookMessage.js                                                   //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
let s;
module.watch(require("underscore.string"), {
  default(v) {
    s = v;
  }

}, 1);

this.processWebhookMessage = function (messageObj, user, defaultValues = {
  channel: '',
  alias: '',
  avatar: '',
  emoji: ''
}, mustBeJoined = false) {
  const sentData = [];
  const channels = [].concat(messageObj.channel || messageObj.roomId || defaultValues.channel);

  for (const channel of channels) {
    const channelType = channel[0];
    let channelValue = channel.substr(1);
    let room;

    switch (channelType) {
      case '#':
        room = RocketChat.getRoomByNameOrIdWithOptionToJoin({
          currentUserId: user._id,
          nameOrId: channelValue,
          joinChannel: true
        });
        break;

      case '@':
        room = RocketChat.getRoomByNameOrIdWithOptionToJoin({
          currentUserId: user._id,
          nameOrId: channelValue,
          type: 'd'
        });
        break;

      default:
        channelValue = channelType + channelValue; //Try to find the room by id or name if they didn't include the prefix.

        room = RocketChat.getRoomByNameOrIdWithOptionToJoin({
          currentUserId: user._id,
          nameOrId: channelValue,
          joinChannel: true,
          errorOnEmpty: false
        });

        if (room) {
          break;
        } //We didn't get a room, let's try finding direct messages


        room = RocketChat.getRoomByNameOrIdWithOptionToJoin({
          currentUserId: user._id,
          nameOrId: channelValue,
          type: 'd',
          tryDirectByUserIdOnly: true
        });

        if (room) {
          break;
        } //No room, so throw an error


        throw new Meteor.Error('invalid-channel');
    }

    if (mustBeJoined && !room.usernames.includes(user.username)) {
      // throw new Meteor.Error('invalid-room', 'Invalid room provided to send a message to, must be joined.');
      throw new Meteor.Error('invalid-channel'); // Throwing the generic one so people can't "brute force" find rooms
    }

    if (messageObj.attachments && !_.isArray(messageObj.attachments)) {
      console.log('Attachments should be Array, ignoring value'.red, messageObj.attachments);
      messageObj.attachments = undefined;
    }

    const message = {
      alias: messageObj.username || messageObj.alias || defaultValues.alias,
      msg: s.trim(messageObj.text || messageObj.msg || ''),
      attachments: messageObj.attachments || [],
      parseUrls: messageObj.parseUrls !== undefined ? messageObj.parseUrls : !messageObj.attachments,
      bot: messageObj.bot,
      groupable: messageObj.groupable !== undefined ? messageObj.groupable : false
    };

    if (!_.isEmpty(messageObj.icon_url) || !_.isEmpty(messageObj.avatar)) {
      message.avatar = messageObj.icon_url || messageObj.avatar;
    } else if (!_.isEmpty(messageObj.icon_emoji) || !_.isEmpty(messageObj.emoji)) {
      message.emoji = messageObj.icon_emoji || messageObj.emoji;
    } else if (!_.isEmpty(defaultValues.avatar)) {
      message.avatar = defaultValues.avatar;
    } else if (!_.isEmpty(defaultValues.emoji)) {
      message.emoji = defaultValues.emoji;
    }

    if (_.isArray(message.attachments)) {
      for (let i = 0; i < message.attachments.length; i++) {
        const attachment = message.attachments[i];

        if (attachment.msg) {
          attachment.text = s.trim(attachment.msg);
          delete attachment.msg;
        }
      }
    }

    const messageReturn = RocketChat.sendMessage(user, message, room);
    sentData.push({
      channel,
      message: messageReturn
    });
  }

  return sentData;
};
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:integrations/lib/rocketchat.js");
require("/node_modules/meteor/rocketchat:integrations/server/logger.js");
require("/node_modules/meteor/rocketchat:integrations/server/lib/validation.js");
require("/node_modules/meteor/rocketchat:integrations/server/models/Integrations.js");
require("/node_modules/meteor/rocketchat:integrations/server/models/IntegrationHistory.js");
require("/node_modules/meteor/rocketchat:integrations/server/publications/integrations.js");
require("/node_modules/meteor/rocketchat:integrations/server/publications/integrationHistory.js");
require("/node_modules/meteor/rocketchat:integrations/server/methods/incoming/addIncomingIntegration.js");
require("/node_modules/meteor/rocketchat:integrations/server/methods/incoming/updateIncomingIntegration.js");
require("/node_modules/meteor/rocketchat:integrations/server/methods/incoming/deleteIncomingIntegration.js");
require("/node_modules/meteor/rocketchat:integrations/server/methods/outgoing/addOutgoingIntegration.js");
require("/node_modules/meteor/rocketchat:integrations/server/methods/outgoing/updateOutgoingIntegration.js");
require("/node_modules/meteor/rocketchat:integrations/server/methods/outgoing/replayOutgoingIntegration.js");
require("/node_modules/meteor/rocketchat:integrations/server/methods/outgoing/deleteOutgoingIntegration.js");
require("/node_modules/meteor/rocketchat:integrations/server/methods/clearIntegrationHistory.js");
require("/node_modules/meteor/rocketchat:integrations/server/api/api.js");
require("/node_modules/meteor/rocketchat:integrations/server/lib/triggerHandler.js");
require("/node_modules/meteor/rocketchat:integrations/server/triggers.js");
require("/node_modules/meteor/rocketchat:integrations/server/processWebhookMessage.js");

/* Exports */
Package._define("rocketchat:integrations");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_integrations.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDppbnRlZ3JhdGlvbnMvbGliL3JvY2tldGNoYXQuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6aW50ZWdyYXRpb25zL3NlcnZlci9sb2dnZXIuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6aW50ZWdyYXRpb25zL3NlcnZlci9saWIvdmFsaWRhdGlvbi5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDppbnRlZ3JhdGlvbnMvc2VydmVyL2xpYi90cmlnZ2VySGFuZGxlci5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDppbnRlZ3JhdGlvbnMvc2VydmVyL21vZGVscy9JbnRlZ3JhdGlvbnMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6aW50ZWdyYXRpb25zL3NlcnZlci9tb2RlbHMvSW50ZWdyYXRpb25IaXN0b3J5LmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmludGVncmF0aW9ucy9zZXJ2ZXIvcHVibGljYXRpb25zL2ludGVncmF0aW9ucy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDppbnRlZ3JhdGlvbnMvc2VydmVyL3B1YmxpY2F0aW9ucy9pbnRlZ3JhdGlvbkhpc3RvcnkuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6aW50ZWdyYXRpb25zL3NlcnZlci9tZXRob2RzL2luY29taW5nL2FkZEluY29taW5nSW50ZWdyYXRpb24uanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6aW50ZWdyYXRpb25zL3NlcnZlci9tZXRob2RzL2luY29taW5nL3VwZGF0ZUluY29taW5nSW50ZWdyYXRpb24uanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6aW50ZWdyYXRpb25zL3NlcnZlci9tZXRob2RzL2luY29taW5nL2RlbGV0ZUluY29taW5nSW50ZWdyYXRpb24uanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6aW50ZWdyYXRpb25zL3NlcnZlci9tZXRob2RzL291dGdvaW5nL2FkZE91dGdvaW5nSW50ZWdyYXRpb24uanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6aW50ZWdyYXRpb25zL3NlcnZlci9tZXRob2RzL291dGdvaW5nL3VwZGF0ZU91dGdvaW5nSW50ZWdyYXRpb24uanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6aW50ZWdyYXRpb25zL3NlcnZlci9tZXRob2RzL291dGdvaW5nL3JlcGxheU91dGdvaW5nSW50ZWdyYXRpb24uanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6aW50ZWdyYXRpb25zL3NlcnZlci9tZXRob2RzL291dGdvaW5nL2RlbGV0ZU91dGdvaW5nSW50ZWdyYXRpb24uanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6aW50ZWdyYXRpb25zL3NlcnZlci9tZXRob2RzL2NsZWFySW50ZWdyYXRpb25IaXN0b3J5LmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmludGVncmF0aW9ucy9zZXJ2ZXIvYXBpL2FwaS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDppbnRlZ3JhdGlvbnMvc2VydmVyL3RyaWdnZXJzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmludGVncmF0aW9ucy9zZXJ2ZXIvcHJvY2Vzc1dlYmhvb2tNZXNzYWdlLmpzIl0sIm5hbWVzIjpbIlJvY2tldENoYXQiLCJpbnRlZ3JhdGlvbnMiLCJvdXRnb2luZ0V2ZW50cyIsInNlbmRNZXNzYWdlIiwibGFiZWwiLCJ2YWx1ZSIsInVzZSIsImNoYW5uZWwiLCJ0cmlnZ2VyV29yZHMiLCJ0YXJnZXRSb29tIiwiZmlsZVVwbG9hZGVkIiwicm9vbUFyY2hpdmVkIiwicm9vbUNyZWF0ZWQiLCJyb29tSm9pbmVkIiwicm9vbUxlZnQiLCJ1c2VyQ3JlYXRlZCIsImxvZ2dlciIsIkxvZ2dlciIsInNlY3Rpb25zIiwiaW5jb21pbmciLCJvdXRnb2luZyIsIl8iLCJtb2R1bGUiLCJ3YXRjaCIsInJlcXVpcmUiLCJkZWZhdWx0IiwidiIsInMiLCJzY29wZWRDaGFubmVscyIsInZhbGlkQ2hhbm5lbENoYXJzIiwiX3ZlcmlmeVJlcXVpcmVkRmllbGRzIiwiaW50ZWdyYXRpb24iLCJldmVudCIsIk1hdGNoIiwidGVzdCIsIlN0cmluZyIsInRyaW0iLCJNZXRlb3IiLCJFcnJvciIsImZ1bmN0aW9uIiwidXNlcm5hbWUiLCJ1cmxzIiwiaW5kZXgiLCJ1cmwiLCJlbnRyaWVzIiwid2l0aG91dCIsInVuZGVmaW5lZCIsImxlbmd0aCIsIl92ZXJpZnlVc2VySGFzUGVybWlzc2lvbkZvckNoYW5uZWxzIiwidXNlcklkIiwiY2hhbm5lbHMiLCJpbmNsdWRlcyIsImF1dGh6IiwiaGFzUGVybWlzc2lvbiIsInJlY29yZCIsImNoYW5uZWxUeXBlIiwic3Vic3RyIiwibW9kZWxzIiwiUm9vbXMiLCJmaW5kT25lIiwiJG9yIiwiX2lkIiwibmFtZSIsIlVzZXJzIiwidXNlcm5hbWVzIiwidXNlciIsIl92ZXJpZnlSZXRyeUluZm9ybWF0aW9uIiwicmV0cnlGYWlsZWRDYWxscyIsInJldHJ5Q291bnQiLCJwYXJzZUludCIsInJldHJ5RGVsYXkiLCJ0b0xvd2VyQ2FzZSIsInZhbGlkYXRlT3V0Z29pbmciLCJfdmFsaWRhdGVPdXRnb2luZyIsIm1hcCIsInNwbGl0IiwiZm9yRWFjaCIsIndvcmQiLCJzY3JpcHRFbmFibGVkIiwic2NyaXB0IiwiYmFiZWxPcHRpb25zIiwiT2JqZWN0IiwiYXNzaWduIiwiQmFiZWwiLCJnZXREZWZhdWx0T3B0aW9ucyIsInJ1bnRpbWUiLCJjb21wYWN0IiwibWluaWZpZWQiLCJjb21tZW50cyIsInNjcmlwdENvbXBpbGVkIiwiY29tcGlsZSIsImNvZGUiLCJzY3JpcHRFcnJvciIsImUiLCJwaWNrIiwicnVuT25FZGl0cyIsInR5cGUiLCJtb21lbnQiLCJ2bSIsInRyaWdnZXJIYW5kbGVyIiwiUm9ja2V0Q2hhdEludGVncmF0aW9uSGFuZGxlciIsImNvbnN0cnVjdG9yIiwic3VjY2Vzc1Jlc3VsdHMiLCJjb21waWxlZFNjcmlwdHMiLCJ0cmlnZ2VycyIsIkludGVncmF0aW9ucyIsImZpbmQiLCJvYnNlcnZlIiwiYWRkZWQiLCJhZGRJbnRlZ3JhdGlvbiIsImNoYW5nZWQiLCJyZW1vdmVJbnRlZ3JhdGlvbiIsInJlbW92ZWQiLCJkZWJ1ZyIsImlzRW1wdHkiLCJjb25jYXQiLCJ0cmlnZ2VyIiwidmFsdWVzIiwiaXNUcmlnZ2VyRW5hYmxlZCIsInRyaWciLCJlbmFibGVkIiwidXBkYXRlSGlzdG9yeSIsImhpc3RvcnlJZCIsInN0ZXAiLCJkYXRhIiwidHJpZ2dlcldvcmQiLCJyYW5QcmVwYXJlU2NyaXB0IiwicHJlcGFyZVNlbnRNZXNzYWdlIiwicHJvY2Vzc1NlbnRNZXNzYWdlIiwicmVzdWx0TWVzc2FnZSIsImZpbmlzaGVkIiwiaHR0cENhbGxEYXRhIiwiaHR0cEVycm9yIiwiaHR0cFJlc3VsdCIsImVycm9yIiwiZXJyb3JTdGFjayIsImhpc3RvcnkiLCJvbWl0Iiwicm9vbSIsIkpTT04iLCJzdHJpbmdpZnkiLCJJbnRlZ3JhdGlvbkhpc3RvcnkiLCJ1cGRhdGUiLCIkc2V0IiwiX2NyZWF0ZWRBdCIsIkRhdGUiLCJpbnNlcnQiLCJSYW5kb20iLCJpZCIsIm5hbWVPcklkIiwibWVzc2FnZSIsImltcGVyc29uYXRlVXNlciIsImZpbmRPbmVCeVVzZXJuYW1lIiwidXNlcl9uYW1lIiwidG1wUm9vbSIsImdldFJvb21CeU5hbWVPcklkV2l0aE9wdGlvblRvSm9pbiIsImN1cnJlbnRVc2VySWQiLCJlcnJvck9uRW1wdHkiLCJ3YXJuIiwidCIsImJvdCIsImkiLCJkZWZhdWx0VmFsdWVzIiwiYWxpYXMiLCJhdmF0YXIiLCJlbW9qaSIsInByb2Nlc3NXZWJob29rTWVzc2FnZSIsImJ1aWxkU2FuZGJveCIsInN0b3JlIiwic2FuZGJveCIsImNvbnNvbGUiLCJTdG9yZSIsInNldCIsImtleSIsInZhbCIsImdldCIsIkhUVFAiLCJtZXRob2QiLCJvcHRpb25zIiwicmVzdWx0IiwiY2FsbCIsImtleXMiLCJmaWx0ZXIiLCJrIiwic3RhcnRzV2l0aCIsImdldEludGVncmF0aW9uU2NyaXB0IiwiY29tcGlsZWRTY3JpcHQiLCJfdXBkYXRlZEF0Iiwidm1TY3JpcHQiLCJpbmZvIiwiY3JlYXRlU2NyaXB0IiwicnVuSW5OZXdDb250ZXh0IiwiU2NyaXB0IiwicmVwbGFjZSIsInN0YWNrIiwiaGFzU2NyaXB0QW5kTWV0aG9kIiwiZXhlY3V0ZVNjcmlwdCIsInBhcmFtcyIsInRpbWVvdXQiLCJldmVudE5hbWVBcmd1bWVudHNUb09iamVjdCIsImFyZ09iamVjdCIsImFyZ3VtZW50cyIsImFyZ2hoaCIsIm93bmVyIiwibWFwRXZlbnRBcmdzVG9EYXRhIiwiY2hhbm5lbF9pZCIsImNoYW5uZWxfbmFtZSIsIm1lc3NhZ2VfaWQiLCJ0aW1lc3RhbXAiLCJ0cyIsInVzZXJfaWQiLCJ1IiwidGV4dCIsIm1zZyIsImVkaXRlZEF0IiwiaXNFZGl0ZWQiLCJjcmVhdGVkQXQiLCJleGVjdXRlVHJpZ2dlcnMiLCJ0cmlnZ2Vyc1RvRXhlY3V0ZSIsInB1c2giLCJhbGxfZGlyZWN0X21lc3NhZ2VzIiwiYWxsX3B1YmxpY19jaGFubmVscyIsImFsbF9wcml2YXRlX2dyb3VwcyIsIl9fYW55IiwidHJpZ2dlclRvRXhlY3V0ZSIsImV4ZWN1dGVUcmlnZ2VyIiwiZXhlY3V0ZVRyaWdnZXJVcmwiLCJ0aGVIaXN0b3J5SWQiLCJ0cmllcyIsInRyaWdnZXJXb3JkQW55d2hlcmUiLCJpbmRleE9mIiwidG9rZW4iLCJ0cmlnZ2VyX3dvcmQiLCJvcHRzIiwiYXV0aCIsIm5wbVJlcXVlc3RPcHRpb25zIiwicmVqZWN0VW5hdXRob3JpemVkIiwic2V0dGluZ3MiLCJzdHJpY3RTU0wiLCJoZWFkZXJzIiwicmVxdWVzdCIsInByZXBhcmVNZXNzYWdlIiwic3RhdHVzQ29kZSIsInJlc3BvbnNlIiwic3RhdHVzX2NvZGUiLCJjb250ZW50IiwiY29udGVudF9yYXciLCJzY3JpcHRSZXN1bHQiLCJ3YWl0VGltZSIsIk1hdGgiLCJwb3ciLCJlciIsInNldFRpbWVvdXQiLCJhdHRhY2htZW50cyIsInJlc3VsdE1zZyIsInJlcGxheSIsIk1lc3NhZ2VzIiwiZmluZE9uZUJ5SWQiLCJfQmFzZSIsImZpbmRCeVR5cGUiLCJkaXNhYmxlQnlVc2VySWQiLCJtdWx0aSIsImZpbmRCeUludGVncmF0aW9uSWQiLCJmaW5kQnlJbnRlZ3JhdGlvbklkQW5kQ3JlYXRlZEJ5IiwiY3JlYXRvcklkIiwiZmluZE9uZUJ5SW50ZWdyYXRpb25JZEFuZEhpc3RvcnlJZCIsImludGVncmF0aW9uSWQiLCJmaW5kQnlFdmVudE5hbWUiLCJmaW5kRmFpbGVkIiwicmVtb3ZlQnlJbnRlZ3JhdGlvbklkIiwicmVtb3ZlIiwicHVibGlzaCIsIl9pbnRlZ3JhdGlvblB1YmxpY2F0aW9uIiwicmVhZHkiLCJfaW50ZWdyYXRpb25IaXN0b3J5UHVibGljYXRpb24iLCJsaW1pdCIsInNvcnQiLCJtZXRob2RzIiwiYWRkSW5jb21pbmdJbnRlZ3JhdGlvbiIsImlzU3RyaW5nIiwiZXh0ZW5kIiwiX2NyZWF0ZWRCeSIsImZpZWxkcyIsIlJvbGVzIiwiYWRkVXNlclJvbGVzIiwidXBkYXRlSW5jb21pbmdJbnRlZ3JhdGlvbiIsImN1cnJlbnRJbnRlZ3JhdGlvbiIsIl91cGRhdGVkQnkiLCJkZWxldGVJbmNvbWluZ0ludGVncmF0aW9uIiwiYWRkT3V0Z29pbmdJbnRlZ3JhdGlvbiIsInVwZGF0ZU91dGdvaW5nSW50ZWdyYXRpb24iLCJyZXBsYXlPdXRnb2luZ0ludGVncmF0aW9uIiwiZGVsZXRlT3V0Z29pbmdJbnRlZ3JhdGlvbiIsImNsZWFySW50ZWdyYXRpb25IaXN0b3J5IiwiQXBpIiwiUmVzdGl2dXMiLCJlbmFibGVDb3JzIiwiYXBpUGF0aCIsInBheWxvYWRLZXlzIiwiYm9keVBhcmFtcyIsInBheWxvYWRJc1dyYXBwZWQiLCJwYXlsb2FkIiwicGFyc2UiLCJib2R5Iiwic3VjY2VzcyIsImRlY29kZVVSSUNvbXBvbmVudCIsIkxpdmVjaGF0IiwiQVBJIiwidjEiLCJmYWlsdXJlIiwiY3JlYXRlSW50ZWdyYXRpb24iLCJydW5Bc1VzZXIiLCJ0YXJnZXRfdXJsIiwidHJpZ2dlcl93b3JkcyIsImludGVncmF0aW9uVG9SZW1vdmUiLCJleGVjdXRlSW50ZWdyYXRpb25SZXN0IiwidXJsUGFyYW1zIiwic2V0RW5jb2RpbmciLCJyZWFkIiwiaGFzaCIsIl9wYXJzZWRVcmwiLCJzZWFyY2giLCJxdWVyeSIsInF1ZXJ5UGFyYW1zIiwicGF0aG5hbWUiLCJwYXRoIiwidXJsX3JhdyIsInVybF9wYXJhbXMiLCJzY3JpcHRSZXNwb25zZSIsImFkZEludGVncmF0aW9uUmVzdCIsInJlbW92ZUludGVncmF0aW9uUmVzdCIsImludGVncmF0aW9uU2FtcGxlUmVzdCIsImludGVncmF0aW9uSW5mb1Jlc3QiLCJhZGRSb3V0ZSIsImF1dGhSZXF1aXJlZCIsInBvc3QiLCJjYWxsYmFja0hhbmRsZXIiLCJfY2FsbGJhY2tIYW5kbGVyIiwiZXZlbnRUeXBlIiwiX3dyYXBwZXJGdW5jdGlvbiIsImNhbGxiYWNrcyIsImFkZCIsInByaW9yaXR5IiwiTE9XIiwibWVzc2FnZU9iaiIsIm11c3RCZUpvaW5lZCIsInNlbnREYXRhIiwicm9vbUlkIiwiY2hhbm5lbFZhbHVlIiwiam9pbkNoYW5uZWwiLCJ0cnlEaXJlY3RCeVVzZXJJZE9ubHkiLCJpc0FycmF5IiwibG9nIiwicmVkIiwicGFyc2VVcmxzIiwiZ3JvdXBhYmxlIiwiaWNvbl91cmwiLCJpY29uX2Vtb2ppIiwiYXR0YWNobWVudCIsIm1lc3NhZ2VSZXR1cm4iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7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QUFPYixRQUFQO0FBQ0EsQ0FoRkQsQyIsImZpbGUiOiIvcGFja2FnZXMvcm9ja2V0Y2hhdF9pbnRlZ3JhdGlvbnMuanMiLCJzb3VyY2VzQ29udGVudCI6WyJSb2NrZXRDaGF0LmludGVncmF0aW9ucyA9IHtcblx0b3V0Z29pbmdFdmVudHM6IHtcblx0XHRzZW5kTWVzc2FnZToge1xuXHRcdFx0bGFiZWw6ICdJbnRlZ3JhdGlvbnNfT3V0Z29pbmdfVHlwZV9TZW5kTWVzc2FnZScsXG5cdFx0XHR2YWx1ZTogJ3NlbmRNZXNzYWdlJyxcblx0XHRcdHVzZToge1xuXHRcdFx0XHRjaGFubmVsOiB0cnVlLFxuXHRcdFx0XHR0cmlnZ2VyV29yZHM6IHRydWUsXG5cdFx0XHRcdHRhcmdldFJvb206IGZhbHNlXG5cdFx0XHR9XG5cdFx0fSxcblx0XHRmaWxlVXBsb2FkZWQ6IHtcblx0XHRcdGxhYmVsOiAnSW50ZWdyYXRpb25zX091dGdvaW5nX1R5cGVfRmlsZVVwbG9hZGVkJyxcblx0XHRcdHZhbHVlOiAnZmlsZVVwbG9hZGVkJyxcblx0XHRcdHVzZToge1xuXHRcdFx0XHRjaGFubmVsOiB0cnVlLFxuXHRcdFx0XHR0cmlnZ2VyV29yZHM6IGZhbHNlLFxuXHRcdFx0XHR0YXJnZXRSb29tOiBmYWxzZVxuXHRcdFx0fVxuXHRcdH0sXG5cdFx0cm9vbUFyY2hpdmVkOiB7XG5cdFx0XHRsYWJlbDogJ0ludGVncmF0aW9uc19PdXRnb2luZ19UeXBlX1Jvb21BcmNoaXZlZCcsXG5cdFx0XHR2YWx1ZTogJ3Jvb21BcmNoaXZlZCcsXG5cdFx0XHR1c2U6IHtcblx0XHRcdFx0Y2hhbm5lbDogZmFsc2UsXG5cdFx0XHRcdHRyaWdnZXJXb3JkczogZmFsc2UsXG5cdFx0XHRcdHRhcmdldFJvb206IGZhbHNlXG5cdFx0XHR9XG5cdFx0fSxcblx0XHRyb29tQ3JlYXRlZDoge1xuXHRcdFx0bGFiZWw6ICdJbnRlZ3JhdGlvbnNfT3V0Z29pbmdfVHlwZV9Sb29tQ3JlYXRlZCcsXG5cdFx0XHR2YWx1ZTogJ3Jvb21DcmVhdGVkJyxcblx0XHRcdHVzZToge1xuXHRcdFx0XHRjaGFubmVsOiBmYWxzZSxcblx0XHRcdFx0dHJpZ2dlcldvcmRzOiBmYWxzZSxcblx0XHRcdFx0dGFyZ2V0Um9vbTogZmFsc2Vcblx0XHRcdH1cblx0XHR9LFxuXHRcdHJvb21Kb2luZWQ6IHtcblx0XHRcdGxhYmVsOiAnSW50ZWdyYXRpb25zX091dGdvaW5nX1R5cGVfUm9vbUpvaW5lZCcsXG5cdFx0XHR2YWx1ZTogJ3Jvb21Kb2luZWQnLFxuXHRcdFx0dXNlOiB7XG5cdFx0XHRcdGNoYW5uZWw6IHRydWUsXG5cdFx0XHRcdHRyaWdnZXJXb3JkczogZmFsc2UsXG5cdFx0XHRcdHRhcmdldFJvb206IGZhbHNlXG5cdFx0XHR9XG5cdFx0fSxcblx0XHRyb29tTGVmdDoge1xuXHRcdFx0bGFiZWw6ICdJbnRlZ3JhdGlvbnNfT3V0Z29pbmdfVHlwZV9Sb29tTGVmdCcsXG5cdFx0XHR2YWx1ZTogJ3Jvb21MZWZ0Jyxcblx0XHRcdHVzZToge1xuXHRcdFx0XHRjaGFubmVsOiB0cnVlLFxuXHRcdFx0XHR0cmlnZ2VyV29yZHM6IGZhbHNlLFxuXHRcdFx0XHR0YXJnZXRSb29tOiBmYWxzZVxuXHRcdFx0fVxuXHRcdH0sXG5cdFx0dXNlckNyZWF0ZWQ6IHtcblx0XHRcdGxhYmVsOiAnSW50ZWdyYXRpb25zX091dGdvaW5nX1R5cGVfVXNlckNyZWF0ZWQnLFxuXHRcdFx0dmFsdWU6ICd1c2VyQ3JlYXRlZCcsXG5cdFx0XHR1c2U6IHtcblx0XHRcdFx0Y2hhbm5lbDogZmFsc2UsXG5cdFx0XHRcdHRyaWdnZXJXb3JkczogZmFsc2UsXG5cdFx0XHRcdHRhcmdldFJvb206IHRydWVcblx0XHRcdH1cblx0XHR9XG5cdH1cbn07XG4iLCIvKiBnbG9iYWxzIGxvZ2dlcjp0cnVlICovXG4vKiBleHBvcnRlZCBsb2dnZXIgKi9cblxubG9nZ2VyID0gbmV3IExvZ2dlcignSW50ZWdyYXRpb25zJywge1xuXHRzZWN0aW9uczoge1xuXHRcdGluY29taW5nOiAnSW5jb21pbmcgV2ViSG9vaycsXG5cdFx0b3V0Z29pbmc6ICdPdXRnb2luZyBXZWJIb29rJ1xuXHR9XG59KTtcbiIsIi8qIGdsb2JhbCBCYWJlbCAqL1xuaW1wb3J0IF8gZnJvbSAndW5kZXJzY29yZSc7XG5pbXBvcnQgcyBmcm9tICd1bmRlcnNjb3JlLnN0cmluZyc7XG5jb25zdCBzY29wZWRDaGFubmVscyA9IFsnYWxsX3B1YmxpY19jaGFubmVscycsICdhbGxfcHJpdmF0ZV9ncm91cHMnLCAnYWxsX2RpcmVjdF9tZXNzYWdlcyddO1xuY29uc3QgdmFsaWRDaGFubmVsQ2hhcnMgPSBbJ0AnLCAnIyddO1xuXG5mdW5jdGlvbiBfdmVyaWZ5UmVxdWlyZWRGaWVsZHMoaW50ZWdyYXRpb24pIHtcblx0aWYgKCFpbnRlZ3JhdGlvbi5ldmVudCB8fCAhTWF0Y2gudGVzdChpbnRlZ3JhdGlvbi5ldmVudCwgU3RyaW5nKSB8fCBpbnRlZ3JhdGlvbi5ldmVudC50cmltKCkgPT09ICcnIHx8ICFSb2NrZXRDaGF0LmludGVncmF0aW9ucy5vdXRnb2luZ0V2ZW50c1tpbnRlZ3JhdGlvbi5ldmVudF0pIHtcblx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLWV2ZW50LXR5cGUnLCAnSW52YWxpZCBldmVudCB0eXBlJywgeyBmdW5jdGlvbjogJ3ZhbGlkYXRlT3V0Z29pbmcuX3ZlcmlmeVJlcXVpcmVkRmllbGRzJyB9KTtcblx0fVxuXG5cdGlmICghaW50ZWdyYXRpb24udXNlcm5hbWUgfHwgIU1hdGNoLnRlc3QoaW50ZWdyYXRpb24udXNlcm5hbWUsIFN0cmluZykgfHwgaW50ZWdyYXRpb24udXNlcm5hbWUudHJpbSgpID09PSAnJykge1xuXHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWludmFsaWQtdXNlcm5hbWUnLCAnSW52YWxpZCB1c2VybmFtZScsIHsgZnVuY3Rpb246ICd2YWxpZGF0ZU91dGdvaW5nLl92ZXJpZnlSZXF1aXJlZEZpZWxkcycgfSk7XG5cdH1cblxuXHRpZiAoUm9ja2V0Q2hhdC5pbnRlZ3JhdGlvbnMub3V0Z29pbmdFdmVudHNbaW50ZWdyYXRpb24uZXZlbnRdLnVzZS50YXJnZXRSb29tICYmICFpbnRlZ3JhdGlvbi50YXJnZXRSb29tKSB7XG5cdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItaW52YWxpZC10YXJnZXRSb29tJywgJ0ludmFsaWQgVGFyZ2V0IFJvb20nLCB7IGZ1bmN0aW9uOiAndmFsaWRhdGVPdXRnb2luZy5fdmVyaWZ5UmVxdWlyZWRGaWVsZHMnIH0pO1xuXHR9XG5cblx0aWYgKCFNYXRjaC50ZXN0KGludGVncmF0aW9uLnVybHMsIFtTdHJpbmddKSkge1xuXHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWludmFsaWQtdXJscycsICdJbnZhbGlkIFVSTHMnLCB7IGZ1bmN0aW9uOiAndmFsaWRhdGVPdXRnb2luZy5fdmVyaWZ5UmVxdWlyZWRGaWVsZHMnIH0pO1xuXHR9XG5cblx0Zm9yIChjb25zdCBbaW5kZXgsIHVybF0gb2YgaW50ZWdyYXRpb24udXJscy5lbnRyaWVzKCkpIHtcblx0XHRpZiAodXJsLnRyaW0oKSA9PT0gJycpIHtcblx0XHRcdGRlbGV0ZSBpbnRlZ3JhdGlvbi51cmxzW2luZGV4XTtcblx0XHR9XG5cdH1cblxuXHRpbnRlZ3JhdGlvbi51cmxzID0gXy53aXRob3V0KGludGVncmF0aW9uLnVybHMsIFt1bmRlZmluZWRdKTtcblxuXHRpZiAoaW50ZWdyYXRpb24udXJscy5sZW5ndGggPT09IDApIHtcblx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLXVybHMnLCAnSW52YWxpZCBVUkxzJywgeyBmdW5jdGlvbjogJ3ZhbGlkYXRlT3V0Z29pbmcuX3ZlcmlmeVJlcXVpcmVkRmllbGRzJyB9KTtcblx0fVxufVxuXG5mdW5jdGlvbiBfdmVyaWZ5VXNlckhhc1Blcm1pc3Npb25Gb3JDaGFubmVscyhpbnRlZ3JhdGlvbiwgdXNlcklkLCBjaGFubmVscykge1xuXHRmb3IgKGxldCBjaGFubmVsIG9mIGNoYW5uZWxzKSB7XG5cdFx0aWYgKHNjb3BlZENoYW5uZWxzLmluY2x1ZGVzKGNoYW5uZWwpKSB7XG5cdFx0XHRpZiAoY2hhbm5lbCA9PT0gJ2FsbF9wdWJsaWNfY2hhbm5lbHMnKSB7XG5cdFx0XHRcdC8vIE5vIHNwZWNpYWwgcGVybWlzc2lvbnMgbmVlZGVkIHRvIGFkZCBpbnRlZ3JhdGlvbiB0byBwdWJsaWMgY2hhbm5lbHNcblx0XHRcdH0gZWxzZSBpZiAoIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih1c2VySWQsICdtYW5hZ2UtaW50ZWdyYXRpb25zJykpIHtcblx0XHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItaW52YWxpZC1jaGFubmVsJywgJ0ludmFsaWQgQ2hhbm5lbCcsIHsgZnVuY3Rpb246ICd2YWxpZGF0ZU91dGdvaW5nLl92ZXJpZnlVc2VySGFzUGVybWlzc2lvbkZvckNoYW5uZWxzJyB9KTtcblx0XHRcdH1cblx0XHR9IGVsc2Uge1xuXHRcdFx0bGV0IHJlY29yZDtcblx0XHRcdGNvbnN0IGNoYW5uZWxUeXBlID0gY2hhbm5lbFswXTtcblx0XHRcdGNoYW5uZWwgPSBjaGFubmVsLnN1YnN0cigxKTtcblxuXHRcdFx0c3dpdGNoIChjaGFubmVsVHlwZSkge1xuXHRcdFx0XHRjYXNlICcjJzpcblx0XHRcdFx0XHRyZWNvcmQgPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT25lKHtcblx0XHRcdFx0XHRcdCRvcjogW1xuXHRcdFx0XHRcdFx0XHR7X2lkOiBjaGFubmVsfSxcblx0XHRcdFx0XHRcdFx0e25hbWU6IGNoYW5uZWx9XG5cdFx0XHRcdFx0XHRdXG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdGNhc2UgJ0AnOlxuXHRcdFx0XHRcdHJlY29yZCA9IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmUoe1xuXHRcdFx0XHRcdFx0JG9yOiBbXG5cdFx0XHRcdFx0XHRcdHtfaWQ6IGNoYW5uZWx9LFxuXHRcdFx0XHRcdFx0XHR7dXNlcm5hbWU6IGNoYW5uZWx9XG5cdFx0XHRcdFx0XHRdXG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHR9XG5cblx0XHRcdGlmICghcmVjb3JkKSB7XG5cdFx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWludmFsaWQtcm9vbScsICdJbnZhbGlkIHJvb20nLCB7IGZ1bmN0aW9uOiAndmFsaWRhdGVPdXRnb2luZy5fdmVyaWZ5VXNlckhhc1Blcm1pc3Npb25Gb3JDaGFubmVscycgfSk7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChyZWNvcmQudXNlcm5hbWVzICYmICFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odXNlcklkLCAnbWFuYWdlLWludGVncmF0aW9ucycpICYmIFJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih1c2VySWQsICdtYW5hZ2Utb3duLWludGVncmF0aW9ucycpICYmICFyZWNvcmQudXNlcm5hbWVzLmluY2x1ZGVzKE1ldGVvci51c2VyKCkudXNlcm5hbWUpKSB7XG5cdFx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWludmFsaWQtY2hhbm5lbCcsICdJbnZhbGlkIENoYW5uZWwnLCB7IGZ1bmN0aW9uOiAndmFsaWRhdGVPdXRnb2luZy5fdmVyaWZ5VXNlckhhc1Blcm1pc3Npb25Gb3JDaGFubmVscycgfSk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG59XG5cbmZ1bmN0aW9uIF92ZXJpZnlSZXRyeUluZm9ybWF0aW9uKGludGVncmF0aW9uKSB7XG5cdGlmICghaW50ZWdyYXRpb24ucmV0cnlGYWlsZWRDYWxscykge1xuXHRcdHJldHVybjtcblx0fVxuXG5cdC8vIERvbid0IGFsbG93IG5lZ2F0aXZlIHJldHJ5IGNvdW50c1xuXHRpbnRlZ3JhdGlvbi5yZXRyeUNvdW50ID0gaW50ZWdyYXRpb24ucmV0cnlDb3VudCAmJiBwYXJzZUludChpbnRlZ3JhdGlvbi5yZXRyeUNvdW50KSA+IDAgPyBwYXJzZUludChpbnRlZ3JhdGlvbi5yZXRyeUNvdW50KSA6IDQ7XG5cdGludGVncmF0aW9uLnJldHJ5RGVsYXkgPSAhaW50ZWdyYXRpb24ucmV0cnlEZWxheSB8fCAhaW50ZWdyYXRpb24ucmV0cnlEZWxheS50cmltKCkgPyAncG93ZXJzLW9mLXRlbicgOiBpbnRlZ3JhdGlvbi5yZXRyeURlbGF5LnRvTG93ZXJDYXNlKCk7XG59XG5cblJvY2tldENoYXQuaW50ZWdyYXRpb25zLnZhbGlkYXRlT3V0Z29pbmcgPSBmdW5jdGlvbiBfdmFsaWRhdGVPdXRnb2luZyhpbnRlZ3JhdGlvbiwgdXNlcklkKSB7XG5cdGlmIChpbnRlZ3JhdGlvbi5jaGFubmVsICYmIE1hdGNoLnRlc3QoaW50ZWdyYXRpb24uY2hhbm5lbCwgU3RyaW5nKSAmJiBpbnRlZ3JhdGlvbi5jaGFubmVsLnRyaW0oKSA9PT0gJycpIHtcblx0XHRkZWxldGUgaW50ZWdyYXRpb24uY2hhbm5lbDtcblx0fVxuXG5cdC8vTW92ZWQgdG8gaXQncyBvd24gZnVuY3Rpb24gdG8gc3RhdGlzZnkgdGhlIGNvbXBsZXhpdHkgcnVsZVxuXHRfdmVyaWZ5UmVxdWlyZWRGaWVsZHMoaW50ZWdyYXRpb24pO1xuXG5cdGxldCBjaGFubmVscyA9IFtdO1xuXHRpZiAoUm9ja2V0Q2hhdC5pbnRlZ3JhdGlvbnMub3V0Z29pbmdFdmVudHNbaW50ZWdyYXRpb24uZXZlbnRdLnVzZS5jaGFubmVsKSB7XG5cdFx0aWYgKCFNYXRjaC50ZXN0KGludGVncmF0aW9uLmNoYW5uZWwsIFN0cmluZykpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWludmFsaWQtY2hhbm5lbCcsICdJbnZhbGlkIENoYW5uZWwnLCB7IGZ1bmN0aW9uOiAndmFsaWRhdGVPdXRnb2luZycgfSk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGNoYW5uZWxzID0gXy5tYXAoaW50ZWdyYXRpb24uY2hhbm5lbC5zcGxpdCgnLCcpLCAoY2hhbm5lbCkgPT4gcy50cmltKGNoYW5uZWwpKTtcblxuXHRcdFx0Zm9yIChjb25zdCBjaGFubmVsIG9mIGNoYW5uZWxzKSB7XG5cdFx0XHRcdGlmICghdmFsaWRDaGFubmVsQ2hhcnMuaW5jbHVkZXMoY2hhbm5lbFswXSkgJiYgIXNjb3BlZENoYW5uZWxzLmluY2x1ZGVzKGNoYW5uZWwudG9Mb3dlckNhc2UoKSkpIHtcblx0XHRcdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLWNoYW5uZWwtc3RhcnQtd2l0aC1jaGFycycsICdJbnZhbGlkIGNoYW5uZWwuIFN0YXJ0IHdpdGggQCBvciAjJywgeyBmdW5jdGlvbjogJ3ZhbGlkYXRlT3V0Z29pbmcnIH0pO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHR9IGVsc2UgaWYgKCFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odXNlcklkLCAnbWFuYWdlLWludGVncmF0aW9ucycpKSB7XG5cdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItaW52YWxpZC1wZXJtaXNzaW9ucycsICdJbnZhbGlkIHBlcm1pc3Npb24gZm9yIHJlcXVpcmVkIEludGVncmF0aW9uIGNyZWF0aW9uLicsIHsgZnVuY3Rpb246ICd2YWxpZGF0ZU91dGdvaW5nJyB9KTtcblx0fVxuXG5cdGlmIChSb2NrZXRDaGF0LmludGVncmF0aW9ucy5vdXRnb2luZ0V2ZW50c1tpbnRlZ3JhdGlvbi5ldmVudF0udXNlLnRyaWdnZXJXb3JkcyAmJiBpbnRlZ3JhdGlvbi50cmlnZ2VyV29yZHMpIHtcblx0XHRpZiAoIU1hdGNoLnRlc3QoaW50ZWdyYXRpb24udHJpZ2dlcldvcmRzLCBbU3RyaW5nXSkpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWludmFsaWQtdHJpZ2dlcldvcmRzJywgJ0ludmFsaWQgdHJpZ2dlcldvcmRzJywgeyBmdW5jdGlvbjogJ3ZhbGlkYXRlT3V0Z29pbmcnIH0pO1xuXHRcdH1cblxuXHRcdGludGVncmF0aW9uLnRyaWdnZXJXb3Jkcy5mb3JFYWNoKCh3b3JkLCBpbmRleCkgPT4ge1xuXHRcdFx0aWYgKCF3b3JkIHx8IHdvcmQudHJpbSgpID09PSAnJykge1xuXHRcdFx0XHRkZWxldGUgaW50ZWdyYXRpb24udHJpZ2dlcldvcmRzW2luZGV4XTtcblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdGludGVncmF0aW9uLnRyaWdnZXJXb3JkcyA9IF8ud2l0aG91dChpbnRlZ3JhdGlvbi50cmlnZ2VyV29yZHMsIFt1bmRlZmluZWRdKTtcblx0fSBlbHNlIHtcblx0XHRkZWxldGUgaW50ZWdyYXRpb24udHJpZ2dlcldvcmRzO1xuXHR9XG5cblx0aWYgKGludGVncmF0aW9uLnNjcmlwdEVuYWJsZWQgPT09IHRydWUgJiYgaW50ZWdyYXRpb24uc2NyaXB0ICYmIGludGVncmF0aW9uLnNjcmlwdC50cmltKCkgIT09ICcnKSB7XG5cdFx0dHJ5IHtcblx0XHRcdGNvbnN0IGJhYmVsT3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oQmFiZWwuZ2V0RGVmYXVsdE9wdGlvbnMoeyBydW50aW1lOiBmYWxzZSB9KSwgeyBjb21wYWN0OiB0cnVlLCBtaW5pZmllZDogdHJ1ZSwgY29tbWVudHM6IGZhbHNlIH0pO1xuXG5cdFx0XHRpbnRlZ3JhdGlvbi5zY3JpcHRDb21waWxlZCA9IEJhYmVsLmNvbXBpbGUoaW50ZWdyYXRpb24uc2NyaXB0LCBiYWJlbE9wdGlvbnMpLmNvZGU7XG5cdFx0XHRpbnRlZ3JhdGlvbi5zY3JpcHRFcnJvciA9IHVuZGVmaW5lZDtcblx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRpbnRlZ3JhdGlvbi5zY3JpcHRDb21waWxlZCA9IHVuZGVmaW5lZDtcblx0XHRcdGludGVncmF0aW9uLnNjcmlwdEVycm9yID0gXy5waWNrKGUsICduYW1lJywgJ21lc3NhZ2UnLCAnc3RhY2snKTtcblx0XHR9XG5cdH1cblxuXHRpZiAodHlwZW9mIGludGVncmF0aW9uLnJ1bk9uRWRpdHMgIT09ICd1bmRlZmluZWQnKSB7XG5cdFx0Ly8gVmVyaWZ5IHRoaXMgdmFsdWUgaXMgb25seSB0cnVlL2ZhbHNlXG5cdFx0aW50ZWdyYXRpb24ucnVuT25FZGl0cyA9IGludGVncmF0aW9uLnJ1bk9uRWRpdHMgPT09IHRydWU7XG5cdH1cblxuXHRfdmVyaWZ5VXNlckhhc1Blcm1pc3Npb25Gb3JDaGFubmVscyhpbnRlZ3JhdGlvbiwgdXNlcklkLCBjaGFubmVscyk7XG5cdF92ZXJpZnlSZXRyeUluZm9ybWF0aW9uKGludGVncmF0aW9uKTtcblxuXHRjb25zdCB1c2VyID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZE9uZSh7IHVzZXJuYW1lOiBpbnRlZ3JhdGlvbi51c2VybmFtZSB9KTtcblxuXHRpZiAoIXVzZXIpIHtcblx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLXVzZXInLCAnSW52YWxpZCB1c2VyIChkaWQgeW91IGRlbGV0ZSB0aGUgYHJvY2tldC5jYXRgIHVzZXI/KScsIHsgZnVuY3Rpb246ICd2YWxpZGF0ZU91dGdvaW5nJyB9KTtcblx0fVxuXG5cdGludGVncmF0aW9uLnR5cGUgPSAnd2ViaG9vay1vdXRnb2luZyc7XG5cdGludGVncmF0aW9uLnVzZXJJZCA9IHVzZXIuX2lkO1xuXHRpbnRlZ3JhdGlvbi5jaGFubmVsID0gY2hhbm5lbHM7XG5cblx0cmV0dXJuIGludGVncmF0aW9uO1xufTtcbiIsIi8qIGdsb2JhbCBsb2dnZXIsIHByb2Nlc3NXZWJob29rTWVzc2FnZSAqL1xuaW1wb3J0IF8gZnJvbSAndW5kZXJzY29yZSc7XG5pbXBvcnQgcyBmcm9tICd1bmRlcnNjb3JlLnN0cmluZyc7XG5pbXBvcnQgbW9tZW50IGZyb20gJ21vbWVudCc7XG5pbXBvcnQgdm0gZnJvbSAndm0nO1xuXG5Sb2NrZXRDaGF0LmludGVncmF0aW9ucy50cmlnZ2VySGFuZGxlciA9IG5ldyBjbGFzcyBSb2NrZXRDaGF0SW50ZWdyYXRpb25IYW5kbGVyIHtcblx0Y29uc3RydWN0b3IoKSB7XG5cdFx0dGhpcy52bSA9IHZtO1xuXHRcdHRoaXMuc3VjY2Vzc1Jlc3VsdHMgPSBbMjAwLCAyMDEsIDIwMl07XG5cdFx0dGhpcy5jb21waWxlZFNjcmlwdHMgPSB7fTtcblx0XHR0aGlzLnRyaWdnZXJzID0ge307XG5cblx0XHRSb2NrZXRDaGF0Lm1vZGVscy5JbnRlZ3JhdGlvbnMuZmluZCh7dHlwZTogJ3dlYmhvb2stb3V0Z29pbmcnfSkub2JzZXJ2ZSh7XG5cdFx0XHRhZGRlZDogKHJlY29yZCkgPT4ge1xuXHRcdFx0XHR0aGlzLmFkZEludGVncmF0aW9uKHJlY29yZCk7XG5cdFx0XHR9LFxuXG5cdFx0XHRjaGFuZ2VkOiAocmVjb3JkKSA9PiB7XG5cdFx0XHRcdHRoaXMucmVtb3ZlSW50ZWdyYXRpb24ocmVjb3JkKTtcblx0XHRcdFx0dGhpcy5hZGRJbnRlZ3JhdGlvbihyZWNvcmQpO1xuXHRcdFx0fSxcblxuXHRcdFx0cmVtb3ZlZDogKHJlY29yZCkgPT4ge1xuXHRcdFx0XHR0aGlzLnJlbW92ZUludGVncmF0aW9uKHJlY29yZCk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH1cblxuXHRhZGRJbnRlZ3JhdGlvbihyZWNvcmQpIHtcblx0XHRsb2dnZXIub3V0Z29pbmcuZGVidWcoYEFkZGluZyB0aGUgaW50ZWdyYXRpb24gJHsgcmVjb3JkLm5hbWUgfSBvZiB0aGUgZXZlbnQgJHsgcmVjb3JkLmV2ZW50IH0hYCk7XG5cdFx0bGV0IGNoYW5uZWxzO1xuXHRcdGlmIChyZWNvcmQuZXZlbnQgJiYgIVJvY2tldENoYXQuaW50ZWdyYXRpb25zLm91dGdvaW5nRXZlbnRzW3JlY29yZC5ldmVudF0udXNlLmNoYW5uZWwpIHtcblx0XHRcdGxvZ2dlci5vdXRnb2luZy5kZWJ1ZygnVGhlIGludGVncmF0aW9uIGRvZXNudCByZWx5IG9uIGNoYW5uZWxzLicpO1xuXHRcdFx0Ly9XZSBkb24ndCB1c2UgYW55IGNoYW5uZWxzLCBzbyBpdCdzIHNwZWNpYWwgOylcblx0XHRcdGNoYW5uZWxzID0gWydfX2FueSddO1xuXHRcdH0gZWxzZSBpZiAoXy5pc0VtcHR5KHJlY29yZC5jaGFubmVsKSkge1xuXHRcdFx0bG9nZ2VyLm91dGdvaW5nLmRlYnVnKCdUaGUgaW50ZWdyYXRpb24gaGFkIGFuIGVtcHR5IGNoYW5uZWwgcHJvcGVydHksIHNvIGl0IGlzIGdvaW5nIG9uIGFsbCB0aGUgcHVibGljIGNoYW5uZWxzLicpO1xuXHRcdFx0Y2hhbm5lbHMgPSBbJ2FsbF9wdWJsaWNfY2hhbm5lbHMnXTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0bG9nZ2VyLm91dGdvaW5nLmRlYnVnKCdUaGUgaW50ZWdyYXRpb24gaXMgZ29pbmcgb24gdGhlc2UgY2hhbm5lbHM6JywgcmVjb3JkLmNoYW5uZWwpO1xuXHRcdFx0Y2hhbm5lbHMgPSBbXS5jb25jYXQocmVjb3JkLmNoYW5uZWwpO1xuXHRcdH1cblxuXHRcdGZvciAoY29uc3QgY2hhbm5lbCBvZiBjaGFubmVscykge1xuXHRcdFx0aWYgKCF0aGlzLnRyaWdnZXJzW2NoYW5uZWxdKSB7XG5cdFx0XHRcdHRoaXMudHJpZ2dlcnNbY2hhbm5lbF0gPSB7fTtcblx0XHRcdH1cblxuXHRcdFx0dGhpcy50cmlnZ2Vyc1tjaGFubmVsXVtyZWNvcmQuX2lkXSA9IHJlY29yZDtcblx0XHR9XG5cdH1cblxuXHRyZW1vdmVJbnRlZ3JhdGlvbihyZWNvcmQpIHtcblx0XHRmb3IgKGNvbnN0IHRyaWdnZXIgb2YgT2JqZWN0LnZhbHVlcyh0aGlzLnRyaWdnZXJzKSkge1xuXHRcdFx0ZGVsZXRlIHRyaWdnZXJbcmVjb3JkLl9pZF07XG5cdFx0fVxuXHR9XG5cblx0aXNUcmlnZ2VyRW5hYmxlZCh0cmlnZ2VyKSB7XG5cdFx0Zm9yIChjb25zdCB0cmlnIG9mIE9iamVjdC52YWx1ZXModGhpcy50cmlnZ2VycykpIHtcblx0XHRcdGlmICh0cmlnW3RyaWdnZXIuX2lkXSkge1xuXHRcdFx0XHRyZXR1cm4gdHJpZ1t0cmlnZ2VyLl9pZF0uZW5hYmxlZDtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gZmFsc2U7XG5cdH1cblxuXHR1cGRhdGVIaXN0b3J5KHsgaGlzdG9yeUlkLCBzdGVwLCBpbnRlZ3JhdGlvbiwgZXZlbnQsIGRhdGEsIHRyaWdnZXJXb3JkLCByYW5QcmVwYXJlU2NyaXB0LCBwcmVwYXJlU2VudE1lc3NhZ2UsIHByb2Nlc3NTZW50TWVzc2FnZSwgcmVzdWx0TWVzc2FnZSwgZmluaXNoZWQsIHVybCwgaHR0cENhbGxEYXRhLCBodHRwRXJyb3IsIGh0dHBSZXN1bHQsIGVycm9yLCBlcnJvclN0YWNrIH0pIHtcblx0XHRjb25zdCBoaXN0b3J5ID0ge1xuXHRcdFx0dHlwZTogJ291dGdvaW5nLXdlYmhvb2snLFxuXHRcdFx0c3RlcFxuXHRcdH07XG5cblx0XHQvLyBVc3VhbGx5IGlzIG9ubHkgYWRkZWQgb24gaW5pdGlhbCBpbnNlcnRcblx0XHRpZiAoaW50ZWdyYXRpb24pIHtcblx0XHRcdGhpc3RvcnkuaW50ZWdyYXRpb24gPSBpbnRlZ3JhdGlvbjtcblx0XHR9XG5cblx0XHQvLyBVc3VhbGx5IGlzIG9ubHkgYWRkZWQgb24gaW5pdGlhbCBpbnNlcnRcblx0XHRpZiAoZXZlbnQpIHtcblx0XHRcdGhpc3RvcnkuZXZlbnQgPSBldmVudDtcblx0XHR9XG5cblx0XHRpZiAoZGF0YSkge1xuXHRcdFx0aGlzdG9yeS5kYXRhID0geyAuLi5kYXRhIH07XG5cblx0XHRcdGlmIChkYXRhLnVzZXIpIHtcblx0XHRcdFx0aGlzdG9yeS5kYXRhLnVzZXIgPSBfLm9taXQoZGF0YS51c2VyLCBbJ21ldGEnLCAnJGxva2knLCAnc2VydmljZXMnXSk7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChkYXRhLnJvb20pIHtcblx0XHRcdFx0aGlzdG9yeS5kYXRhLnJvb20gPSBfLm9taXQoZGF0YS5yb29tLCBbJ21ldGEnLCAnJGxva2knLCAndXNlcm5hbWVzJ10pO1xuXHRcdFx0XHRoaXN0b3J5LmRhdGEucm9vbS51c2VybmFtZXMgPSBbJ3RoaXNfd2lsbF9iZV9maWxsZWRfaW5fd2l0aF91c2VybmFtZXNfd2hlbl9yZXBsYXllZCddO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGlmICh0cmlnZ2VyV29yZCkge1xuXHRcdFx0aGlzdG9yeS50cmlnZ2VyV29yZCA9IHRyaWdnZXJXb3JkO1xuXHRcdH1cblxuXHRcdGlmICh0eXBlb2YgcmFuUHJlcGFyZVNjcmlwdCAhPT0gJ3VuZGVmaW5lZCcpIHtcblx0XHRcdGhpc3RvcnkucmFuUHJlcGFyZVNjcmlwdCA9IHJhblByZXBhcmVTY3JpcHQ7XG5cdFx0fVxuXG5cdFx0aWYgKHByZXBhcmVTZW50TWVzc2FnZSkge1xuXHRcdFx0aGlzdG9yeS5wcmVwYXJlU2VudE1lc3NhZ2UgPSBwcmVwYXJlU2VudE1lc3NhZ2U7XG5cdFx0fVxuXG5cdFx0aWYgKHByb2Nlc3NTZW50TWVzc2FnZSkge1xuXHRcdFx0aGlzdG9yeS5wcm9jZXNzU2VudE1lc3NhZ2UgPSBwcm9jZXNzU2VudE1lc3NhZ2U7XG5cdFx0fVxuXG5cdFx0aWYgKHJlc3VsdE1lc3NhZ2UpIHtcblx0XHRcdGhpc3RvcnkucmVzdWx0TWVzc2FnZSA9IHJlc3VsdE1lc3NhZ2U7XG5cdFx0fVxuXG5cdFx0aWYgKHR5cGVvZiBmaW5pc2hlZCAhPT0gJ3VuZGVmaW5lZCcpIHtcblx0XHRcdGhpc3RvcnkuZmluaXNoZWQgPSBmaW5pc2hlZDtcblx0XHR9XG5cblx0XHRpZiAodXJsKSB7XG5cdFx0XHRoaXN0b3J5LnVybCA9IHVybDtcblx0XHR9XG5cblx0XHRpZiAodHlwZW9mIGh0dHBDYWxsRGF0YSAhPT0gJ3VuZGVmaW5lZCcpIHtcblx0XHRcdGhpc3RvcnkuaHR0cENhbGxEYXRhID0gaHR0cENhbGxEYXRhO1xuXHRcdH1cblxuXHRcdGlmIChodHRwRXJyb3IpIHtcblx0XHRcdGhpc3RvcnkuaHR0cEVycm9yID0gaHR0cEVycm9yO1xuXHRcdH1cblxuXHRcdGlmICh0eXBlb2YgaHR0cFJlc3VsdCAhPT0gJ3VuZGVmaW5lZCcpIHtcblx0XHRcdGhpc3RvcnkuaHR0cFJlc3VsdCA9IEpTT04uc3RyaW5naWZ5KGh0dHBSZXN1bHQsIG51bGwsIDIpO1xuXHRcdH1cblxuXHRcdGlmICh0eXBlb2YgZXJyb3IgIT09ICd1bmRlZmluZWQnKSB7XG5cdFx0XHRoaXN0b3J5LmVycm9yID0gZXJyb3I7XG5cdFx0fVxuXG5cdFx0aWYgKHR5cGVvZiBlcnJvclN0YWNrICE9PSAndW5kZWZpbmVkJykge1xuXHRcdFx0aGlzdG9yeS5lcnJvclN0YWNrID0gZXJyb3JTdGFjaztcblx0XHR9XG5cblx0XHRpZiAoaGlzdG9yeUlkKSB7XG5cdFx0XHRSb2NrZXRDaGF0Lm1vZGVscy5JbnRlZ3JhdGlvbkhpc3RvcnkudXBkYXRlKHsgX2lkOiBoaXN0b3J5SWQgfSwgeyAkc2V0OiBoaXN0b3J5IH0pO1xuXHRcdFx0cmV0dXJuIGhpc3RvcnlJZDtcblx0XHR9IGVsc2Uge1xuXHRcdFx0aGlzdG9yeS5fY3JlYXRlZEF0ID0gbmV3IERhdGUoKTtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0Lm1vZGVscy5JbnRlZ3JhdGlvbkhpc3RvcnkuaW5zZXJ0KE9iamVjdC5hc3NpZ24oeyBfaWQ6IFJhbmRvbS5pZCgpIH0sIGhpc3RvcnkpKTtcblx0XHR9XG5cdH1cblxuXHQvL1RyaWdnZXIgaXMgdGhlIHRyaWdnZXIsIG5hbWVPcklkIGlzIGEgc3RyaW5nIHdoaWNoIGlzIHVzZWQgdG8gdHJ5IGFuZCBmaW5kIGEgcm9vbSwgcm9vbSBpcyBhIHJvb20sIG1lc3NhZ2UgaXMgYSBtZXNzYWdlLCBhbmQgZGF0YSBjb250YWlucyBcInVzZXJfbmFtZVwiIGlmIHRyaWdnZXIuaW1wZXJzb25hdGVVc2VyIGlzIHRydXRoZnVsLlxuXHRzZW5kTWVzc2FnZSh7IHRyaWdnZXIsIG5hbWVPcklkID0gJycsIHJvb20sIG1lc3NhZ2UsIGRhdGEgfSkge1xuXHRcdGxldCB1c2VyO1xuXHRcdC8vVHJ5IHRvIGZpbmQgdGhlIHVzZXIgd2hvIHdlIGFyZSBpbXBlcnNvbmF0aW5nXG5cdFx0aWYgKHRyaWdnZXIuaW1wZXJzb25hdGVVc2VyKSB7XG5cdFx0XHR1c2VyID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZE9uZUJ5VXNlcm5hbWUoZGF0YS51c2VyX25hbWUpO1xuXHRcdH1cblxuXHRcdC8vSWYgdGhleSBkb24ndCBleGlzdCAoYWthIHRoZSB0cmlnZ2VyIGRpZG4ndCBjb250YWluIGEgdXNlcikgdGhlbiB3ZSBzZXQgdGhlIHVzZXIgYmFzZWQgdXBvbiB0aGVcblx0XHQvL2NvbmZpZ3VyZWQgdXNlcm5hbWUgZm9yIHRoZSBpbnRlZ3JhdGlvbiBzaW5jZSB0aGlzIGlzIHJlcXVpcmVkIGF0IGFsbCB0aW1lcy5cblx0XHRpZiAoIXVzZXIpIHtcblx0XHRcdHVzZXIgPSBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kT25lQnlVc2VybmFtZSh0cmlnZ2VyLnVzZXJuYW1lKTtcblx0XHR9XG5cblx0XHRsZXQgdG1wUm9vbTtcblx0XHRpZiAobmFtZU9ySWQgfHwgdHJpZ2dlci50YXJnZXRSb29tIHx8IG1lc3NhZ2UuY2hhbm5lbCkge1xuXHRcdFx0dG1wUm9vbSA9IFJvY2tldENoYXQuZ2V0Um9vbUJ5TmFtZU9ySWRXaXRoT3B0aW9uVG9Kb2luKHsgY3VycmVudFVzZXJJZDogdXNlci5faWQsIG5hbWVPcklkOiBuYW1lT3JJZCB8fCBtZXNzYWdlLmNoYW5uZWwgfHwgdHJpZ2dlci50YXJnZXRSb29tLCBlcnJvck9uRW1wdHk6IGZhbHNlIH0pIHx8IHJvb207XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRtcFJvb20gPSByb29tO1xuXHRcdH1cblxuXHRcdC8vSWYgbm8gcm9vbSBjb3VsZCBiZSBmb3VuZCwgd2Ugd29uJ3QgYmUgc2VuZGluZyBhbnkgbWVzc2FnZXMgYnV0IHdlJ2xsIHdhcm4gaW4gdGhlIGxvZ3Ncblx0XHRpZiAoIXRtcFJvb20pIHtcblx0XHRcdGxvZ2dlci5vdXRnb2luZy53YXJuKGBUaGUgSW50ZWdyYXRpb24gXCIkeyB0cmlnZ2VyLm5hbWUgfVwiIGRvZXNuJ3QgaGF2ZSBhIHJvb20gY29uZmlndXJlZCBub3IgZGlkIGl0IHByb3ZpZGUgYSByb29tIHRvIHNlbmQgdGhlIG1lc3NhZ2UgdG8uYCk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0bG9nZ2VyLm91dGdvaW5nLmRlYnVnKGBGb3VuZCBhIHJvb20gZm9yICR7IHRyaWdnZXIubmFtZSB9IHdoaWNoIGlzOiAkeyB0bXBSb29tLm5hbWUgfSB3aXRoIGEgdHlwZSBvZiAkeyB0bXBSb29tLnQgfWApO1xuXG5cdFx0bWVzc2FnZS5ib3QgPSB7IGk6IHRyaWdnZXIuX2lkIH07XG5cblx0XHRjb25zdCBkZWZhdWx0VmFsdWVzID0ge1xuXHRcdFx0YWxpYXM6IHRyaWdnZXIuYWxpYXMsXG5cdFx0XHRhdmF0YXI6IHRyaWdnZXIuYXZhdGFyLFxuXHRcdFx0ZW1vamk6IHRyaWdnZXIuZW1vamlcblx0XHR9O1xuXG5cdFx0aWYgKHRtcFJvb20udCA9PT0gJ2QnKSB7XG5cdFx0XHRtZXNzYWdlLmNoYW5uZWwgPSBgQCR7IHRtcFJvb20uX2lkIH1gO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRtZXNzYWdlLmNoYW5uZWwgPSBgIyR7IHRtcFJvb20uX2lkIH1gO1xuXHRcdH1cblxuXHRcdG1lc3NhZ2UgPSBwcm9jZXNzV2ViaG9va01lc3NhZ2UobWVzc2FnZSwgdXNlciwgZGVmYXVsdFZhbHVlcyk7XG5cdFx0cmV0dXJuIG1lc3NhZ2U7XG5cdH1cblxuXHRidWlsZFNhbmRib3goc3RvcmUgPSB7fSkge1xuXHRcdGNvbnN0IHNhbmRib3ggPSB7XG5cdFx0XHRfLCBzLCBjb25zb2xlLCBtb21lbnQsXG5cdFx0XHRTdG9yZToge1xuXHRcdFx0XHRzZXQ6IChrZXksIHZhbCkgPT4gc3RvcmVba2V5XSA9IHZhbCxcblx0XHRcdFx0Z2V0OiAoa2V5KSA9PiBzdG9yZVtrZXldXG5cdFx0XHR9LFxuXHRcdFx0SFRUUDogKG1ldGhvZCwgdXJsLCBvcHRpb25zKSA9PiB7XG5cdFx0XHRcdHRyeSB7XG5cdFx0XHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0XHRcdHJlc3VsdDogSFRUUC5jYWxsKG1ldGhvZCwgdXJsLCBvcHRpb25zKVxuXHRcdFx0XHRcdH07XG5cdFx0XHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHRcdFx0cmV0dXJuIHsgZXJyb3IgfTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH07XG5cblx0XHRPYmplY3Qua2V5cyhSb2NrZXRDaGF0Lm1vZGVscykuZmlsdGVyKGsgPT4gIWsuc3RhcnRzV2l0aCgnXycpKS5mb3JFYWNoKGsgPT4ge1xuXHRcdFx0c2FuZGJveFtrXSA9IFJvY2tldENoYXQubW9kZWxzW2tdO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIHsgc3RvcmUsIHNhbmRib3ggfTtcblx0fVxuXG5cdGdldEludGVncmF0aW9uU2NyaXB0KGludGVncmF0aW9uKSB7XG5cdFx0Y29uc3QgY29tcGlsZWRTY3JpcHQgPSB0aGlzLmNvbXBpbGVkU2NyaXB0c1tpbnRlZ3JhdGlvbi5faWRdO1xuXHRcdGlmIChjb21waWxlZFNjcmlwdCAmJiArY29tcGlsZWRTY3JpcHQuX3VwZGF0ZWRBdCA9PT0gK2ludGVncmF0aW9uLl91cGRhdGVkQXQpIHtcblx0XHRcdHJldHVybiBjb21waWxlZFNjcmlwdC5zY3JpcHQ7XG5cdFx0fVxuXG5cdFx0Y29uc3Qgc2NyaXB0ID0gaW50ZWdyYXRpb24uc2NyaXB0Q29tcGlsZWQ7XG5cdFx0Y29uc3QgeyBzdG9yZSwgc2FuZGJveCB9ID0gdGhpcy5idWlsZFNhbmRib3goKTtcblxuXHRcdGxldCB2bVNjcmlwdDtcblx0XHR0cnkge1xuXHRcdFx0bG9nZ2VyLm91dGdvaW5nLmluZm8oJ1dpbGwgZXZhbHVhdGUgc2NyaXB0IG9mIFRyaWdnZXInLCBpbnRlZ3JhdGlvbi5uYW1lKTtcblx0XHRcdGxvZ2dlci5vdXRnb2luZy5kZWJ1ZyhzY3JpcHQpO1xuXG5cdFx0XHR2bVNjcmlwdCA9IHRoaXMudm0uY3JlYXRlU2NyaXB0KHNjcmlwdCwgJ3NjcmlwdC5qcycpO1xuXG5cdFx0XHR2bVNjcmlwdC5ydW5Jbk5ld0NvbnRleHQoc2FuZGJveCk7XG5cblx0XHRcdGlmIChzYW5kYm94LlNjcmlwdCkge1xuXHRcdFx0XHR0aGlzLmNvbXBpbGVkU2NyaXB0c1tpbnRlZ3JhdGlvbi5faWRdID0ge1xuXHRcdFx0XHRcdHNjcmlwdDogbmV3IHNhbmRib3guU2NyaXB0KCksXG5cdFx0XHRcdFx0c3RvcmUsXG5cdFx0XHRcdFx0X3VwZGF0ZWRBdDogaW50ZWdyYXRpb24uX3VwZGF0ZWRBdFxuXHRcdFx0XHR9O1xuXG5cdFx0XHRcdHJldHVybiB0aGlzLmNvbXBpbGVkU2NyaXB0c1tpbnRlZ3JhdGlvbi5faWRdLnNjcmlwdDtcblx0XHRcdH1cblx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRsb2dnZXIub3V0Z29pbmcuZXJyb3IoYEVycm9yIGV2YWx1YXRpbmcgU2NyaXB0IGluIFRyaWdnZXIgJHsgaW50ZWdyYXRpb24ubmFtZSB9OmApO1xuXHRcdFx0bG9nZ2VyLm91dGdvaW5nLmVycm9yKHNjcmlwdC5yZXBsYWNlKC9eL2dtLCAnICAnKSk7XG5cdFx0XHRsb2dnZXIub3V0Z29pbmcuZXJyb3IoJ1N0YWNrIFRyYWNlOicpO1xuXHRcdFx0bG9nZ2VyLm91dGdvaW5nLmVycm9yKGUuc3RhY2sucmVwbGFjZSgvXi9nbSwgJyAgJykpO1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItZXZhbHVhdGluZy1zY3JpcHQnKTtcblx0XHR9XG5cblx0XHRpZiAoIXNhbmRib3guU2NyaXB0KSB7XG5cdFx0XHRsb2dnZXIub3V0Z29pbmcuZXJyb3IoYENsYXNzIFwiU2NyaXB0XCIgbm90IGluIFRyaWdnZXIgJHsgaW50ZWdyYXRpb24ubmFtZSB9OmApO1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignY2xhc3Mtc2NyaXB0LW5vdC1mb3VuZCcpO1xuXHRcdH1cblx0fVxuXG5cdGhhc1NjcmlwdEFuZE1ldGhvZChpbnRlZ3JhdGlvbiwgbWV0aG9kKSB7XG5cdFx0aWYgKGludGVncmF0aW9uLnNjcmlwdEVuYWJsZWQgIT09IHRydWUgfHwgIWludGVncmF0aW9uLnNjcmlwdENvbXBpbGVkIHx8IGludGVncmF0aW9uLnNjcmlwdENvbXBpbGVkLnRyaW0oKSA9PT0gJycpIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cblx0XHRsZXQgc2NyaXB0O1xuXHRcdHRyeSB7XG5cdFx0XHRzY3JpcHQgPSB0aGlzLmdldEludGVncmF0aW9uU2NyaXB0KGludGVncmF0aW9uKTtcblx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHR5cGVvZiBzY3JpcHRbbWV0aG9kXSAhPT0gJ3VuZGVmaW5lZCc7XG5cdH1cblxuXHRleGVjdXRlU2NyaXB0KGludGVncmF0aW9uLCBtZXRob2QsIHBhcmFtcywgaGlzdG9yeUlkKSB7XG5cdFx0bGV0IHNjcmlwdDtcblx0XHR0cnkge1xuXHRcdFx0c2NyaXB0ID0gdGhpcy5nZXRJbnRlZ3JhdGlvblNjcmlwdChpbnRlZ3JhdGlvbik7XG5cdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0dGhpcy51cGRhdGVIaXN0b3J5KHsgaGlzdG9yeUlkLCBzdGVwOiAnZXhlY3V0ZS1zY3JpcHQtZ2V0dGluZy1zY3JpcHQnLCBlcnJvcjogdHJ1ZSwgZXJyb3JTdGFjazogZSB9KTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRpZiAoIXNjcmlwdFttZXRob2RdKSB7XG5cdFx0XHRsb2dnZXIub3V0Z29pbmcuZXJyb3IoYE1ldGhvZCBcIiR7IG1ldGhvZCB9XCIgbm8gZm91bmQgaW4gdGhlIEludGVncmF0aW9uIFwiJHsgaW50ZWdyYXRpb24ubmFtZSB9XCJgKTtcblx0XHRcdHRoaXMudXBkYXRlSGlzdG9yeSh7IGhpc3RvcnlJZCwgc3RlcDogYGV4ZWN1dGUtc2NyaXB0LW5vLW1ldGhvZC0keyBtZXRob2QgfWAgfSk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0dHJ5IHtcblx0XHRcdGNvbnN0IHsgc2FuZGJveCB9ID0gdGhpcy5idWlsZFNhbmRib3godGhpcy5jb21waWxlZFNjcmlwdHNbaW50ZWdyYXRpb24uX2lkXS5zdG9yZSk7XG5cdFx0XHRzYW5kYm94LnNjcmlwdCA9IHNjcmlwdDtcblx0XHRcdHNhbmRib3gubWV0aG9kID0gbWV0aG9kO1xuXHRcdFx0c2FuZGJveC5wYXJhbXMgPSBwYXJhbXM7XG5cblx0XHRcdHRoaXMudXBkYXRlSGlzdG9yeSh7IGhpc3RvcnlJZCwgc3RlcDogYGV4ZWN1dGUtc2NyaXB0LWJlZm9yZS1ydW5uaW5nLSR7IG1ldGhvZCB9YCB9KTtcblx0XHRcdGNvbnN0IHJlc3VsdCA9IHRoaXMudm0ucnVuSW5OZXdDb250ZXh0KCdzY3JpcHRbbWV0aG9kXShwYXJhbXMpJywgc2FuZGJveCwgeyB0aW1lb3V0OiAzMDAwIH0pO1xuXG5cdFx0XHRsb2dnZXIub3V0Z29pbmcuZGVidWcoYFNjcmlwdCBtZXRob2QgXCIkeyBtZXRob2QgfVwiIHJlc3VsdCBvZiB0aGUgSW50ZWdyYXRpb24gXCIkeyBpbnRlZ3JhdGlvbi5uYW1lIH1cIiBpczpgKTtcblx0XHRcdGxvZ2dlci5vdXRnb2luZy5kZWJ1ZyhyZXN1bHQpO1xuXG5cdFx0XHRyZXR1cm4gcmVzdWx0O1xuXHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdHRoaXMudXBkYXRlSGlzdG9yeSh7IGhpc3RvcnlJZCwgc3RlcDogYGV4ZWN1dGUtc2NyaXB0LWVycm9yLXJ1bm5pbmctJHsgbWV0aG9kIH1gLCBlcnJvcjogdHJ1ZSwgZXJyb3JTdGFjazogZS5zdGFjay5yZXBsYWNlKC9eL2dtLCAnICAnKSB9KTtcblx0XHRcdGxvZ2dlci5vdXRnb2luZy5lcnJvcihgRXJyb3IgcnVubmluZyBTY3JpcHQgaW4gdGhlIEludGVncmF0aW9uICR7IGludGVncmF0aW9uLm5hbWUgfTpgKTtcblx0XHRcdGxvZ2dlci5vdXRnb2luZy5kZWJ1ZyhpbnRlZ3JhdGlvbi5zY3JpcHRDb21waWxlZC5yZXBsYWNlKC9eL2dtLCAnICAnKSk7IC8vIE9ubHkgb3V0cHV0IHRoZSBjb21waWxlZCBzY3JpcHQgaWYgZGVidWdnaW5nIGlzIGVuYWJsZWQsIHNvIHRoZSBsb2dzIGRvbid0IGdldCBzcGFtbWVkLlxuXHRcdFx0bG9nZ2VyLm91dGdvaW5nLmVycm9yKCdTdGFjazonKTtcblx0XHRcdGxvZ2dlci5vdXRnb2luZy5lcnJvcihlLnN0YWNrLnJlcGxhY2UoL14vZ20sICcgICcpKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cdH1cblxuXHRldmVudE5hbWVBcmd1bWVudHNUb09iamVjdCgpIHtcblx0XHRjb25zdCBhcmdPYmplY3QgPSB7XG5cdFx0XHRldmVudDogYXJndW1lbnRzWzBdXG5cdFx0fTtcblxuXHRcdHN3aXRjaCAoYXJnT2JqZWN0LmV2ZW50KSB7XG5cdFx0XHRjYXNlICdzZW5kTWVzc2FnZSc6XG5cdFx0XHRcdGlmIChhcmd1bWVudHMubGVuZ3RoID49IDMpIHtcblx0XHRcdFx0XHRhcmdPYmplY3QubWVzc2FnZSA9IGFyZ3VtZW50c1sxXTtcblx0XHRcdFx0XHRhcmdPYmplY3Qucm9vbSA9IGFyZ3VtZW50c1syXTtcblx0XHRcdFx0fVxuXHRcdFx0XHRicmVhaztcblx0XHRcdGNhc2UgJ2ZpbGVVcGxvYWRlZCc6XG5cdFx0XHRcdGlmIChhcmd1bWVudHMubGVuZ3RoID49IDIpIHtcblx0XHRcdFx0XHRjb25zdCBhcmdoaGggPSBhcmd1bWVudHNbMV07XG5cdFx0XHRcdFx0YXJnT2JqZWN0LnVzZXIgPSBhcmdoaGgudXNlcjtcblx0XHRcdFx0XHRhcmdPYmplY3Qucm9vbSA9IGFyZ2hoaC5yb29tO1xuXHRcdFx0XHRcdGFyZ09iamVjdC5tZXNzYWdlID0gYXJnaGhoLm1lc3NhZ2U7XG5cdFx0XHRcdH1cblx0XHRcdFx0YnJlYWs7XG5cdFx0XHRjYXNlICdyb29tQXJjaGl2ZWQnOlxuXHRcdFx0XHRpZiAoYXJndW1lbnRzLmxlbmd0aCA+PSAzKSB7XG5cdFx0XHRcdFx0YXJnT2JqZWN0LnJvb20gPSBhcmd1bWVudHNbMV07XG5cdFx0XHRcdFx0YXJnT2JqZWN0LnVzZXIgPSBhcmd1bWVudHNbMl07XG5cdFx0XHRcdH1cblx0XHRcdFx0YnJlYWs7XG5cdFx0XHRjYXNlICdyb29tQ3JlYXRlZCc6XG5cdFx0XHRcdGlmIChhcmd1bWVudHMubGVuZ3RoID49IDMpIHtcblx0XHRcdFx0XHRhcmdPYmplY3Qub3duZXIgPSBhcmd1bWVudHNbMV07XG5cdFx0XHRcdFx0YXJnT2JqZWN0LnJvb20gPSBhcmd1bWVudHNbMl07XG5cdFx0XHRcdH1cblx0XHRcdFx0YnJlYWs7XG5cdFx0XHRjYXNlICdyb29tSm9pbmVkJzpcblx0XHRcdGNhc2UgJ3Jvb21MZWZ0Jzpcblx0XHRcdFx0aWYgKGFyZ3VtZW50cy5sZW5ndGggPj0gMykge1xuXHRcdFx0XHRcdGFyZ09iamVjdC51c2VyID0gYXJndW1lbnRzWzFdO1xuXHRcdFx0XHRcdGFyZ09iamVjdC5yb29tID0gYXJndW1lbnRzWzJdO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0Y2FzZSAndXNlckNyZWF0ZWQnOlxuXHRcdFx0XHRpZiAoYXJndW1lbnRzLmxlbmd0aCA+PSAyKSB7XG5cdFx0XHRcdFx0YXJnT2JqZWN0LnVzZXIgPSBhcmd1bWVudHNbMV07XG5cdFx0XHRcdH1cblx0XHRcdFx0YnJlYWs7XG5cdFx0XHRkZWZhdWx0OlxuXHRcdFx0XHRsb2dnZXIub3V0Z29pbmcud2FybihgQW4gVW5oYW5kbGVkIFRyaWdnZXIgRXZlbnQgd2FzIGNhbGxlZDogJHsgYXJnT2JqZWN0LmV2ZW50IH1gKTtcblx0XHRcdFx0YXJnT2JqZWN0LmV2ZW50ID0gdW5kZWZpbmVkO1xuXHRcdFx0XHRicmVhaztcblx0XHR9XG5cblx0XHRsb2dnZXIub3V0Z29pbmcuZGVidWcoYEdvdCB0aGUgZXZlbnQgYXJndW1lbnRzIGZvciB0aGUgZXZlbnQ6ICR7IGFyZ09iamVjdC5ldmVudCB9YCwgYXJnT2JqZWN0KTtcblxuXHRcdHJldHVybiBhcmdPYmplY3Q7XG5cdH1cblxuXHRtYXBFdmVudEFyZ3NUb0RhdGEoZGF0YSwgeyBldmVudCwgbWVzc2FnZSwgcm9vbSwgb3duZXIsIHVzZXIgfSkge1xuXHRcdHN3aXRjaCAoZXZlbnQpIHtcblx0XHRcdGNhc2UgJ3NlbmRNZXNzYWdlJzpcblx0XHRcdFx0ZGF0YS5jaGFubmVsX2lkID0gcm9vbS5faWQ7XG5cdFx0XHRcdGRhdGEuY2hhbm5lbF9uYW1lID0gcm9vbS5uYW1lO1xuXHRcdFx0XHRkYXRhLm1lc3NhZ2VfaWQgPSBtZXNzYWdlLl9pZDtcblx0XHRcdFx0ZGF0YS50aW1lc3RhbXAgPSBtZXNzYWdlLnRzO1xuXHRcdFx0XHRkYXRhLnVzZXJfaWQgPSBtZXNzYWdlLnUuX2lkO1xuXHRcdFx0XHRkYXRhLnVzZXJfbmFtZSA9IG1lc3NhZ2UudS51c2VybmFtZTtcblx0XHRcdFx0ZGF0YS50ZXh0ID0gbWVzc2FnZS5tc2c7XG5cblx0XHRcdFx0aWYgKG1lc3NhZ2UuYWxpYXMpIHtcblx0XHRcdFx0XHRkYXRhLmFsaWFzID0gbWVzc2FnZS5hbGlhcztcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmIChtZXNzYWdlLmJvdCkge1xuXHRcdFx0XHRcdGRhdGEuYm90ID0gbWVzc2FnZS5ib3Q7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAobWVzc2FnZS5lZGl0ZWRBdCkge1xuXHRcdFx0XHRcdGRhdGEuaXNFZGl0ZWQgPSB0cnVlO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0Y2FzZSAnZmlsZVVwbG9hZGVkJzpcblx0XHRcdFx0ZGF0YS5jaGFubmVsX2lkID0gcm9vbS5faWQ7XG5cdFx0XHRcdGRhdGEuY2hhbm5lbF9uYW1lID0gcm9vbS5uYW1lO1xuXHRcdFx0XHRkYXRhLm1lc3NhZ2VfaWQgPSBtZXNzYWdlLl9pZDtcblx0XHRcdFx0ZGF0YS50aW1lc3RhbXAgPSBtZXNzYWdlLnRzO1xuXHRcdFx0XHRkYXRhLnVzZXJfaWQgPSBtZXNzYWdlLnUuX2lkO1xuXHRcdFx0XHRkYXRhLnVzZXJfbmFtZSA9IG1lc3NhZ2UudS51c2VybmFtZTtcblx0XHRcdFx0ZGF0YS50ZXh0ID0gbWVzc2FnZS5tc2c7XG5cdFx0XHRcdGRhdGEudXNlciA9IHVzZXI7XG5cdFx0XHRcdGRhdGEucm9vbSA9IHJvb207XG5cdFx0XHRcdGRhdGEubWVzc2FnZSA9IG1lc3NhZ2U7XG5cblx0XHRcdFx0aWYgKG1lc3NhZ2UuYWxpYXMpIHtcblx0XHRcdFx0XHRkYXRhLmFsaWFzID0gbWVzc2FnZS5hbGlhcztcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmIChtZXNzYWdlLmJvdCkge1xuXHRcdFx0XHRcdGRhdGEuYm90ID0gbWVzc2FnZS5ib3Q7XG5cdFx0XHRcdH1cblx0XHRcdFx0YnJlYWs7XG5cdFx0XHRjYXNlICdyb29tQ3JlYXRlZCc6XG5cdFx0XHRcdGRhdGEuY2hhbm5lbF9pZCA9IHJvb20uX2lkO1xuXHRcdFx0XHRkYXRhLmNoYW5uZWxfbmFtZSA9IHJvb20ubmFtZTtcblx0XHRcdFx0ZGF0YS50aW1lc3RhbXAgPSByb29tLnRzO1xuXHRcdFx0XHRkYXRhLnVzZXJfaWQgPSBvd25lci5faWQ7XG5cdFx0XHRcdGRhdGEudXNlcl9uYW1lID0gb3duZXIudXNlcm5hbWU7XG5cdFx0XHRcdGRhdGEub3duZXIgPSBvd25lcjtcblx0XHRcdFx0ZGF0YS5yb29tID0gcm9vbTtcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHRjYXNlICdyb29tQXJjaGl2ZWQnOlxuXHRcdFx0Y2FzZSAncm9vbUpvaW5lZCc6XG5cdFx0XHRjYXNlICdyb29tTGVmdCc6XG5cdFx0XHRcdGRhdGEudGltZXN0YW1wID0gbmV3IERhdGUoKTtcblx0XHRcdFx0ZGF0YS5jaGFubmVsX2lkID0gcm9vbS5faWQ7XG5cdFx0XHRcdGRhdGEuY2hhbm5lbF9uYW1lID0gcm9vbS5uYW1lO1xuXHRcdFx0XHRkYXRhLnVzZXJfaWQgPSB1c2VyLl9pZDtcblx0XHRcdFx0ZGF0YS51c2VyX25hbWUgPSB1c2VyLnVzZXJuYW1lO1xuXHRcdFx0XHRkYXRhLnVzZXIgPSB1c2VyO1xuXHRcdFx0XHRkYXRhLnJvb20gPSByb29tO1xuXG5cdFx0XHRcdGlmICh1c2VyLnR5cGUgPT09ICdib3QnKSB7XG5cdFx0XHRcdFx0ZGF0YS5ib3QgPSB0cnVlO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0Y2FzZSAndXNlckNyZWF0ZWQnOlxuXHRcdFx0XHRkYXRhLnRpbWVzdGFtcCA9IHVzZXIuY3JlYXRlZEF0O1xuXHRcdFx0XHRkYXRhLnVzZXJfaWQgPSB1c2VyLl9pZDtcblx0XHRcdFx0ZGF0YS51c2VyX25hbWUgPSB1c2VyLnVzZXJuYW1lO1xuXHRcdFx0XHRkYXRhLnVzZXIgPSB1c2VyO1xuXG5cdFx0XHRcdGlmICh1c2VyLnR5cGUgPT09ICdib3QnKSB7XG5cdFx0XHRcdFx0ZGF0YS5ib3QgPSB0cnVlO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0ZGVmYXVsdDpcblx0XHRcdFx0YnJlYWs7XG5cdFx0fVxuXHR9XG5cblx0ZXhlY3V0ZVRyaWdnZXJzKCkge1xuXHRcdGxvZ2dlci5vdXRnb2luZy5kZWJ1ZygnRXhlY3V0ZSBUcmlnZ2VyOicsIGFyZ3VtZW50c1swXSk7XG5cblx0XHRjb25zdCBhcmdPYmplY3QgPSB0aGlzLmV2ZW50TmFtZUFyZ3VtZW50c1RvT2JqZWN0KC4uLmFyZ3VtZW50cyk7XG5cdFx0Y29uc3QgeyBldmVudCwgbWVzc2FnZSwgcm9vbSB9ID0gYXJnT2JqZWN0O1xuXG5cdFx0Ly9FYWNoIHR5cGUgb2YgZXZlbnQgc2hvdWxkIGhhdmUgYW4gZXZlbnQgYW5kIGEgcm9vbSBhdHRhY2hlZCwgb3RoZXJ3aXNlIHdlXG5cdFx0Ly93b3VsZG4ndCBrbm93IGhvdyB0byBoYW5kbGUgdGhlIHRyaWdnZXIgbm9yIHdvdWxkIHdlIGhhdmUgYW55d2hlcmUgdG8gc2VuZCB0aGVcblx0XHQvL3Jlc3VsdCBvZiB0aGUgaW50ZWdyYXRpb25cblx0XHRpZiAoIWV2ZW50KSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0Y29uc3QgdHJpZ2dlcnNUb0V4ZWN1dGUgPSBbXTtcblxuXHRcdGxvZ2dlci5vdXRnb2luZy5kZWJ1ZygnU3RhcnRpbmcgc2VhcmNoIGZvciB0cmlnZ2VycyBmb3IgdGhlIHJvb206Jywgcm9vbSA/IHJvb20uX2lkIDogJ19fYW55Jyk7XG5cdFx0aWYgKHJvb20pIHtcblx0XHRcdHN3aXRjaCAocm9vbS50KSB7XG5cdFx0XHRcdGNhc2UgJ2QnOlxuXHRcdFx0XHRcdGNvbnN0IGlkID0gcm9vbS5faWQucmVwbGFjZShtZXNzYWdlLnUuX2lkLCAnJyk7XG5cdFx0XHRcdFx0Y29uc3QgdXNlcm5hbWUgPSBfLndpdGhvdXQocm9vbS51c2VybmFtZXMsIG1lc3NhZ2UudS51c2VybmFtZSlbMF07XG5cblx0XHRcdFx0XHRpZiAodGhpcy50cmlnZ2Vyc1tgQCR7IGlkIH1gXSkge1xuXHRcdFx0XHRcdFx0Zm9yIChjb25zdCB0cmlnZ2VyIG9mIE9iamVjdC52YWx1ZXModGhpcy50cmlnZ2Vyc1tgQCR7IGlkIH1gXSkpIHtcblx0XHRcdFx0XHRcdFx0dHJpZ2dlcnNUb0V4ZWN1dGUucHVzaCh0cmlnZ2VyKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRpZiAodGhpcy50cmlnZ2Vycy5hbGxfZGlyZWN0X21lc3NhZ2VzKSB7XG5cdFx0XHRcdFx0XHRmb3IgKGNvbnN0IHRyaWdnZXIgb2YgT2JqZWN0LnZhbHVlcyh0aGlzLnRyaWdnZXJzLmFsbF9kaXJlY3RfbWVzc2FnZXMpKSB7XG5cdFx0XHRcdFx0XHRcdHRyaWdnZXJzVG9FeGVjdXRlLnB1c2godHJpZ2dlcik7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0aWYgKGlkICE9PSB1c2VybmFtZSAmJiB0aGlzLnRyaWdnZXJzW2BAJHsgdXNlcm5hbWUgfWBdKSB7XG5cdFx0XHRcdFx0XHRmb3IgKGNvbnN0IHRyaWdnZXIgb2YgT2JqZWN0LnZhbHVlcyh0aGlzLnRyaWdnZXJzW2BAJHsgdXNlcm5hbWUgfWBdKSkge1xuXHRcdFx0XHRcdFx0XHR0cmlnZ2Vyc1RvRXhlY3V0ZS5wdXNoKHRyaWdnZXIpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRicmVhaztcblxuXHRcdFx0XHRjYXNlICdjJzpcblx0XHRcdFx0XHRpZiAodGhpcy50cmlnZ2Vycy5hbGxfcHVibGljX2NoYW5uZWxzKSB7XG5cdFx0XHRcdFx0XHRmb3IgKGNvbnN0IHRyaWdnZXIgb2YgT2JqZWN0LnZhbHVlcyh0aGlzLnRyaWdnZXJzLmFsbF9wdWJsaWNfY2hhbm5lbHMpKSB7XG5cdFx0XHRcdFx0XHRcdHRyaWdnZXJzVG9FeGVjdXRlLnB1c2godHJpZ2dlcik7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0aWYgKHRoaXMudHJpZ2dlcnNbYCMkeyByb29tLl9pZCB9YF0pIHtcblx0XHRcdFx0XHRcdGZvciAoY29uc3QgdHJpZ2dlciBvZiBPYmplY3QudmFsdWVzKHRoaXMudHJpZ2dlcnNbYCMkeyByb29tLl9pZCB9YF0pKSB7XG5cdFx0XHRcdFx0XHRcdHRyaWdnZXJzVG9FeGVjdXRlLnB1c2godHJpZ2dlcik7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0aWYgKHJvb20uX2lkICE9PSByb29tLm5hbWUgJiYgdGhpcy50cmlnZ2Vyc1tgIyR7IHJvb20ubmFtZSB9YF0pIHtcblx0XHRcdFx0XHRcdGZvciAoY29uc3QgdHJpZ2dlciBvZiBPYmplY3QudmFsdWVzKHRoaXMudHJpZ2dlcnNbYCMkeyByb29tLm5hbWUgfWBdKSkge1xuXHRcdFx0XHRcdFx0XHR0cmlnZ2Vyc1RvRXhlY3V0ZS5wdXNoKHRyaWdnZXIpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRicmVhaztcblxuXHRcdFx0XHRkZWZhdWx0OlxuXHRcdFx0XHRcdGlmICh0aGlzLnRyaWdnZXJzLmFsbF9wcml2YXRlX2dyb3Vwcykge1xuXHRcdFx0XHRcdFx0Zm9yIChjb25zdCB0cmlnZ2VyIG9mIE9iamVjdC52YWx1ZXModGhpcy50cmlnZ2Vycy5hbGxfcHJpdmF0ZV9ncm91cHMpKSB7XG5cdFx0XHRcdFx0XHRcdHRyaWdnZXJzVG9FeGVjdXRlLnB1c2godHJpZ2dlcik7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0aWYgKHRoaXMudHJpZ2dlcnNbYCMkeyByb29tLl9pZCB9YF0pIHtcblx0XHRcdFx0XHRcdGZvciAoY29uc3QgdHJpZ2dlciBvZiBPYmplY3QudmFsdWVzKHRoaXMudHJpZ2dlcnNbYCMkeyByb29tLl9pZCB9YF0pKSB7XG5cdFx0XHRcdFx0XHRcdHRyaWdnZXJzVG9FeGVjdXRlLnB1c2godHJpZ2dlcik7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0aWYgKHJvb20uX2lkICE9PSByb29tLm5hbWUgJiYgdGhpcy50cmlnZ2Vyc1tgIyR7IHJvb20ubmFtZSB9YF0pIHtcblx0XHRcdFx0XHRcdGZvciAoY29uc3QgdHJpZ2dlciBvZiBPYmplY3QudmFsdWVzKHRoaXMudHJpZ2dlcnNbYCMkeyByb29tLm5hbWUgfWBdKSkge1xuXHRcdFx0XHRcdFx0XHR0cmlnZ2Vyc1RvRXhlY3V0ZS5wdXNoKHRyaWdnZXIpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRicmVhaztcblx0XHRcdH1cblx0XHR9XG5cblx0XHRpZiAodGhpcy50cmlnZ2Vycy5fX2FueSkge1xuXHRcdFx0Ly9Gb3Igb3V0Z29pbmcgaW50ZWdyYXRpb24gd2hpY2ggZG9uJ3QgcmVseSBvbiByb29tcy5cblx0XHRcdGZvciAoY29uc3QgdHJpZ2dlciBvZiBPYmplY3QudmFsdWVzKHRoaXMudHJpZ2dlcnMuX19hbnkpKSB7XG5cdFx0XHRcdHRyaWdnZXJzVG9FeGVjdXRlLnB1c2godHJpZ2dlcik7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0bG9nZ2VyLm91dGdvaW5nLmRlYnVnKGBGb3VuZCAkeyB0cmlnZ2Vyc1RvRXhlY3V0ZS5sZW5ndGggfSB0byBpdGVyYXRlIG92ZXIgYW5kIHNlZSBpZiB0aGUgbWF0Y2ggdGhlIGV2ZW50LmApO1xuXG5cdFx0Zm9yIChjb25zdCB0cmlnZ2VyVG9FeGVjdXRlIG9mIHRyaWdnZXJzVG9FeGVjdXRlKSB7XG5cdFx0XHRsb2dnZXIub3V0Z29pbmcuZGVidWcoYElzIFwiJHsgdHJpZ2dlclRvRXhlY3V0ZS5uYW1lIH1cIiBlbmFibGVkLCAkeyB0cmlnZ2VyVG9FeGVjdXRlLmVuYWJsZWQgfSwgYW5kIHdoYXQgaXMgdGhlIGV2ZW50PyAkeyB0cmlnZ2VyVG9FeGVjdXRlLmV2ZW50IH1gKTtcblx0XHRcdGlmICh0cmlnZ2VyVG9FeGVjdXRlLmVuYWJsZWQgPT09IHRydWUgJiYgdHJpZ2dlclRvRXhlY3V0ZS5ldmVudCA9PT0gZXZlbnQpIHtcblx0XHRcdFx0dGhpcy5leGVjdXRlVHJpZ2dlcih0cmlnZ2VyVG9FeGVjdXRlLCBhcmdPYmplY3QpO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdGV4ZWN1dGVUcmlnZ2VyKHRyaWdnZXIsIGFyZ09iamVjdCkge1xuXHRcdGZvciAoY29uc3QgdXJsIG9mIHRyaWdnZXIudXJscykge1xuXHRcdFx0dGhpcy5leGVjdXRlVHJpZ2dlclVybCh1cmwsIHRyaWdnZXIsIGFyZ09iamVjdCwgMCk7XG5cdFx0fVxuXHR9XG5cblx0ZXhlY3V0ZVRyaWdnZXJVcmwodXJsLCB0cmlnZ2VyLCB7IGV2ZW50LCBtZXNzYWdlLCByb29tLCBvd25lciwgdXNlciB9LCB0aGVIaXN0b3J5SWQsIHRyaWVzID0gMCkge1xuXHRcdGlmICghdGhpcy5pc1RyaWdnZXJFbmFibGVkKHRyaWdnZXIpKSB7XG5cdFx0XHRsb2dnZXIub3V0Z29pbmcud2FybihgVGhlIHRyaWdnZXIgXCIkeyB0cmlnZ2VyLm5hbWUgfVwiIGlzIG5vIGxvbmdlciBlbmFibGVkLCBzdG9wcGluZyBleGVjdXRpb24gb2YgaXQgYXQgdHJ5OiAkeyB0cmllcyB9YCk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0bG9nZ2VyLm91dGdvaW5nLmRlYnVnKGBTdGFydGluZyB0byBleGVjdXRlIHRyaWdnZXI6ICR7IHRyaWdnZXIubmFtZSB9ICgkeyB0cmlnZ2VyLl9pZCB9KWApO1xuXG5cdFx0bGV0IHdvcmQ7XG5cdFx0Ly9Ob3QgYWxsIHRyaWdnZXJzL2V2ZW50cyBzdXBwb3J0IHRyaWdnZXJXb3Jkc1xuXHRcdGlmIChSb2NrZXRDaGF0LmludGVncmF0aW9ucy5vdXRnb2luZ0V2ZW50c1tldmVudF0udXNlLnRyaWdnZXJXb3Jkcykge1xuXHRcdFx0aWYgKHRyaWdnZXIudHJpZ2dlcldvcmRzICYmIHRyaWdnZXIudHJpZ2dlcldvcmRzLmxlbmd0aCA+IDApIHtcblx0XHRcdFx0Zm9yIChjb25zdCB0cmlnZ2VyV29yZCBvZiB0cmlnZ2VyLnRyaWdnZXJXb3Jkcykge1xuXHRcdFx0XHRcdGlmICghdHJpZ2dlci50cmlnZ2VyV29yZEFueXdoZXJlICYmIG1lc3NhZ2UubXNnLmluZGV4T2YodHJpZ2dlcldvcmQpID09PSAwKSB7XG5cdFx0XHRcdFx0XHR3b3JkID0gdHJpZ2dlcldvcmQ7XG5cdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHR9IGVsc2UgaWYgKHRyaWdnZXIudHJpZ2dlcldvcmRBbnl3aGVyZSAmJiBtZXNzYWdlLm1zZy5pbmNsdWRlcyh0cmlnZ2VyV29yZCkpIHtcblx0XHRcdFx0XHRcdHdvcmQgPSB0cmlnZ2VyV29yZDtcblx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXG5cdFx0XHRcdC8vIFN0b3AgaWYgdGhlcmUgYXJlIHRyaWdnZXJXb3JkcyBidXQgbm9uZSBtYXRjaFxuXHRcdFx0XHRpZiAoIXdvcmQpIHtcblx0XHRcdFx0XHRsb2dnZXIub3V0Z29pbmcuZGVidWcoYFRoZSB0cmlnZ2VyIHdvcmQgd2hpY2ggXCIkeyB0cmlnZ2VyLm5hbWUgfVwiIHdhcyBleHBlY3RpbmcgY291bGQgbm90IGJlIGZvdW5kLCBub3QgZXhlY3V0aW5nLmApO1xuXHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGlmIChtZXNzYWdlICYmIG1lc3NhZ2UuZWRpdGVkQXQgJiYgIXRyaWdnZXIucnVuT25FZGl0cykge1xuXHRcdFx0bG9nZ2VyLm91dGdvaW5nLmRlYnVnKGBUaGUgdHJpZ2dlciBcIiR7IHRyaWdnZXIubmFtZSB9XCIncyBydW4gb24gZWRpdHMgaXMgZGlzYWJsZWQgYW5kIHRoZSBtZXNzYWdlIHdhcyBlZGl0ZWQuYCk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0Y29uc3QgaGlzdG9yeUlkID0gdGhpcy51cGRhdGVIaXN0b3J5KHsgc3RlcDogJ3N0YXJ0LWV4ZWN1dGUtdHJpZ2dlci11cmwnLCBpbnRlZ3JhdGlvbjogdHJpZ2dlciwgZXZlbnQgfSk7XG5cblx0XHRjb25zdCBkYXRhID0ge1xuXHRcdFx0dG9rZW46IHRyaWdnZXIudG9rZW4sXG5cdFx0XHRib3Q6IGZhbHNlXG5cdFx0fTtcblxuXHRcdGlmICh3b3JkKSB7XG5cdFx0XHRkYXRhLnRyaWdnZXJfd29yZCA9IHdvcmQ7XG5cdFx0fVxuXG5cdFx0dGhpcy5tYXBFdmVudEFyZ3NUb0RhdGEoZGF0YSwgeyB0cmlnZ2VyLCBldmVudCwgbWVzc2FnZSwgcm9vbSwgb3duZXIsIHVzZXIgfSk7XG5cdFx0dGhpcy51cGRhdGVIaXN0b3J5KHsgaGlzdG9yeUlkLCBzdGVwOiAnbWFwcGVkLWFyZ3MtdG8tZGF0YScsIGRhdGEsIHRyaWdnZXJXb3JkOiB3b3JkIH0pO1xuXG5cdFx0bG9nZ2VyLm91dGdvaW5nLmluZm8oYFdpbGwgYmUgZXhlY3V0aW5nIHRoZSBJbnRlZ3JhdGlvbiBcIiR7IHRyaWdnZXIubmFtZSB9XCIgdG8gdGhlIHVybDogJHsgdXJsIH1gKTtcblx0XHRsb2dnZXIub3V0Z29pbmcuZGVidWcoZGF0YSk7XG5cblx0XHRsZXQgb3B0cyA9IHtcblx0XHRcdHBhcmFtczoge30sXG5cdFx0XHRtZXRob2Q6ICdQT1NUJyxcblx0XHRcdHVybCxcblx0XHRcdGRhdGEsXG5cdFx0XHRhdXRoOiB1bmRlZmluZWQsXG5cdFx0XHRucG1SZXF1ZXN0T3B0aW9uczoge1xuXHRcdFx0XHRyZWplY3RVbmF1dGhvcml6ZWQ6ICFSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnQWxsb3dfSW52YWxpZF9TZWxmU2lnbmVkX0NlcnRzJyksXG5cdFx0XHRcdHN0cmljdFNTTDogIVJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdBbGxvd19JbnZhbGlkX1NlbGZTaWduZWRfQ2VydHMnKVxuXHRcdFx0fSxcblx0XHRcdGhlYWRlcnM6IHtcblx0XHRcdFx0J1VzZXItQWdlbnQnOiAnTW96aWxsYS81LjAgKFgxMTsgTGludXggeDg2XzY0KSBBcHBsZVdlYktpdC81MzcuMzYgKEtIVE1MLCBsaWtlIEdlY2tvKSBDaHJvbWUvNDEuMC4yMjI3LjAgU2FmYXJpLzUzNy4zNidcblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0aWYgKHRoaXMuaGFzU2NyaXB0QW5kTWV0aG9kKHRyaWdnZXIsICdwcmVwYXJlX291dGdvaW5nX3JlcXVlc3QnKSkge1xuXHRcdFx0b3B0cyA9IHRoaXMuZXhlY3V0ZVNjcmlwdCh0cmlnZ2VyLCAncHJlcGFyZV9vdXRnb2luZ19yZXF1ZXN0JywgeyByZXF1ZXN0OiBvcHRzIH0sIGhpc3RvcnlJZCk7XG5cdFx0fVxuXG5cdFx0dGhpcy51cGRhdGVIaXN0b3J5KHsgaGlzdG9yeUlkLCBzdGVwOiAnYWZ0ZXItbWF5YmUtcmFuLXByZXBhcmUnLCByYW5QcmVwYXJlU2NyaXB0OiB0cnVlIH0pO1xuXG5cdFx0aWYgKCFvcHRzKSB7XG5cdFx0XHR0aGlzLnVwZGF0ZUhpc3RvcnkoeyBoaXN0b3J5SWQsIHN0ZXA6ICdhZnRlci1wcmVwYXJlLW5vLW9wdHMnLCBmaW5pc2hlZDogdHJ1ZSB9KTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRpZiAob3B0cy5tZXNzYWdlKSB7XG5cdFx0XHRjb25zdCBwcmVwYXJlTWVzc2FnZSA9IHRoaXMuc2VuZE1lc3NhZ2UoeyB0cmlnZ2VyLCByb29tLCBtZXNzYWdlOiBvcHRzLm1lc3NhZ2UsIGRhdGEgfSk7XG5cdFx0XHR0aGlzLnVwZGF0ZUhpc3RvcnkoeyBoaXN0b3J5SWQsIHN0ZXA6ICdhZnRlci1wcmVwYXJlLXNlbmQtbWVzc2FnZScsIHByZXBhcmVTZW50TWVzc2FnZTogcHJlcGFyZU1lc3NhZ2UgfSk7XG5cdFx0fVxuXG5cdFx0aWYgKCFvcHRzLnVybCB8fCAhb3B0cy5tZXRob2QpIHtcblx0XHRcdHRoaXMudXBkYXRlSGlzdG9yeSh7IGhpc3RvcnlJZCwgc3RlcDogJ2FmdGVyLXByZXBhcmUtbm8tdXJsX29yX21ldGhvZCcsIGZpbmlzaGVkOiB0cnVlIH0pO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdHRoaXMudXBkYXRlSGlzdG9yeSh7IGhpc3RvcnlJZCwgc3RlcDogJ3ByZS1odHRwLWNhbGwnLCB1cmw6IG9wdHMudXJsLCBodHRwQ2FsbERhdGE6IG9wdHMuZGF0YSB9KTtcblx0XHRIVFRQLmNhbGwob3B0cy5tZXRob2QsIG9wdHMudXJsLCBvcHRzLCAoZXJyb3IsIHJlc3VsdCkgPT4ge1xuXHRcdFx0aWYgKCFyZXN1bHQpIHtcblx0XHRcdFx0bG9nZ2VyLm91dGdvaW5nLndhcm4oYFJlc3VsdCBmb3IgdGhlIEludGVncmF0aW9uICR7IHRyaWdnZXIubmFtZSB9IHRvICR7IHVybCB9IGlzIGVtcHR5YCk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRsb2dnZXIub3V0Z29pbmcuaW5mbyhgU3RhdHVzIGNvZGUgZm9yIHRoZSBJbnRlZ3JhdGlvbiAkeyB0cmlnZ2VyLm5hbWUgfSB0byAkeyB1cmwgfSBpcyAkeyByZXN1bHQuc3RhdHVzQ29kZSB9YCk7XG5cdFx0XHR9XG5cblx0XHRcdHRoaXMudXBkYXRlSGlzdG9yeSh7IGhpc3RvcnlJZCwgc3RlcDogJ2FmdGVyLWh0dHAtY2FsbCcsIGh0dHBFcnJvcjogZXJyb3IsIGh0dHBSZXN1bHQ6IHJlc3VsdCB9KTtcblxuXHRcdFx0aWYgKHRoaXMuaGFzU2NyaXB0QW5kTWV0aG9kKHRyaWdnZXIsICdwcm9jZXNzX291dGdvaW5nX3Jlc3BvbnNlJykpIHtcblx0XHRcdFx0Y29uc3Qgc2FuZGJveCA9IHtcblx0XHRcdFx0XHRyZXF1ZXN0OiBvcHRzLFxuXHRcdFx0XHRcdHJlc3BvbnNlOiB7XG5cdFx0XHRcdFx0XHRlcnJvcixcblx0XHRcdFx0XHRcdHN0YXR1c19jb2RlOiByZXN1bHQgPyByZXN1bHQuc3RhdHVzQ29kZSA6IHVuZGVmaW5lZCwgLy9UaGVzZSB2YWx1ZXMgd2lsbCBiZSB1bmRlZmluZWQgdG8gY2xvc2UgaXNzdWVzICM0MTc1LCAjNTc2MiwgYW5kICM1ODk2XG5cdFx0XHRcdFx0XHRjb250ZW50OiByZXN1bHQgPyByZXN1bHQuZGF0YSA6IHVuZGVmaW5lZCxcblx0XHRcdFx0XHRcdGNvbnRlbnRfcmF3OiByZXN1bHQgPyByZXN1bHQuY29udGVudCA6IHVuZGVmaW5lZCxcblx0XHRcdFx0XHRcdGhlYWRlcnM6IHJlc3VsdCA/IHJlc3VsdC5oZWFkZXJzIDoge31cblx0XHRcdFx0XHR9XG5cdFx0XHRcdH07XG5cblx0XHRcdFx0Y29uc3Qgc2NyaXB0UmVzdWx0ID0gdGhpcy5leGVjdXRlU2NyaXB0KHRyaWdnZXIsICdwcm9jZXNzX291dGdvaW5nX3Jlc3BvbnNlJywgc2FuZGJveCwgaGlzdG9yeUlkKTtcblxuXHRcdFx0XHRpZiAoc2NyaXB0UmVzdWx0ICYmIHNjcmlwdFJlc3VsdC5jb250ZW50KSB7XG5cdFx0XHRcdFx0Y29uc3QgcmVzdWx0TWVzc2FnZSA9IHRoaXMuc2VuZE1lc3NhZ2UoeyB0cmlnZ2VyLCByb29tLCBtZXNzYWdlOiBzY3JpcHRSZXN1bHQuY29udGVudCwgZGF0YSB9KTtcblx0XHRcdFx0XHR0aGlzLnVwZGF0ZUhpc3RvcnkoeyBoaXN0b3J5SWQsIHN0ZXA6ICdhZnRlci1wcm9jZXNzLXNlbmQtbWVzc2FnZScsIHByb2Nlc3NTZW50TWVzc2FnZTogcmVzdWx0TWVzc2FnZSwgZmluaXNoZWQ6IHRydWUgfSk7XG5cdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKHNjcmlwdFJlc3VsdCA9PT0gZmFsc2UpIHtcblx0XHRcdFx0XHR0aGlzLnVwZGF0ZUhpc3RvcnkoeyBoaXN0b3J5SWQsIHN0ZXA6ICdhZnRlci1wcm9jZXNzLWZhbHNlLXJlc3VsdCcsIGZpbmlzaGVkOiB0cnVlIH0pO1xuXHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHQvLyBpZiB0aGUgcmVzdWx0IGNvbnRhaW5lZCBub3RoaW5nIG9yIHdhc24ndCBhIHN1Y2Nlc3NmdWwgc3RhdHVzQ29kZVxuXHRcdFx0aWYgKCFyZXN1bHQgfHwgIXRoaXMuc3VjY2Vzc1Jlc3VsdHMuaW5jbHVkZXMocmVzdWx0LnN0YXR1c0NvZGUpKSB7XG5cdFx0XHRcdGlmIChlcnJvcikge1xuXHRcdFx0XHRcdGxvZ2dlci5vdXRnb2luZy5lcnJvcihgRXJyb3IgZm9yIHRoZSBJbnRlZ3JhdGlvbiBcIiR7IHRyaWdnZXIubmFtZSB9XCIgdG8gJHsgdXJsIH0gaXM6YCk7XG5cdFx0XHRcdFx0bG9nZ2VyLm91dGdvaW5nLmVycm9yKGVycm9yKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmIChyZXN1bHQpIHtcblx0XHRcdFx0XHRsb2dnZXIub3V0Z29pbmcuZXJyb3IoYEVycm9yIGZvciB0aGUgSW50ZWdyYXRpb24gXCIkeyB0cmlnZ2VyLm5hbWUgfVwiIHRvICR7IHVybCB9IGlzOmApO1xuXHRcdFx0XHRcdGxvZ2dlci5vdXRnb2luZy5lcnJvcihyZXN1bHQpO1xuXG5cdFx0XHRcdFx0aWYgKHJlc3VsdC5zdGF0dXNDb2RlID09PSA0MTApIHtcblx0XHRcdFx0XHRcdHRoaXMudXBkYXRlSGlzdG9yeSh7IGhpc3RvcnlJZCwgc3RlcDogJ2FmdGVyLXByb2Nlc3MtaHR0cC1zdGF0dXMtNDEwJywgZXJyb3I6IHRydWUgfSk7XG5cdFx0XHRcdFx0XHRsb2dnZXIub3V0Z29pbmcuZXJyb3IoYERpc2FibGluZyB0aGUgSW50ZWdyYXRpb24gXCIkeyB0cmlnZ2VyLm5hbWUgfVwiIGJlY2F1c2UgdGhlIHN0YXR1cyBjb2RlIHdhcyA0MDEgKEdvbmUpLmApO1xuXHRcdFx0XHRcdFx0Um9ja2V0Q2hhdC5tb2RlbHMuSW50ZWdyYXRpb25zLnVwZGF0ZSh7IF9pZDogdHJpZ2dlci5faWQgfSwgeyAkc2V0OiB7IGVuYWJsZWQ6IGZhbHNlIH19KTtcblx0XHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRpZiAocmVzdWx0LnN0YXR1c0NvZGUgPT09IDUwMCkge1xuXHRcdFx0XHRcdFx0dGhpcy51cGRhdGVIaXN0b3J5KHsgaGlzdG9yeUlkLCBzdGVwOiAnYWZ0ZXItcHJvY2Vzcy1odHRwLXN0YXR1cy01MDAnLCBlcnJvcjogdHJ1ZSB9KTtcblx0XHRcdFx0XHRcdGxvZ2dlci5vdXRnb2luZy5lcnJvcihgRXJyb3IgXCI1MDBcIiBmb3IgdGhlIEludGVncmF0aW9uIFwiJHsgdHJpZ2dlci5uYW1lIH1cIiB0byAkeyB1cmwgfS5gKTtcblx0XHRcdFx0XHRcdGxvZ2dlci5vdXRnb2luZy5lcnJvcihyZXN1bHQuY29udGVudCk7XG5cdFx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKHRyaWdnZXIucmV0cnlGYWlsZWRDYWxscykge1xuXHRcdFx0XHRcdGlmICh0cmllcyA8IHRyaWdnZXIucmV0cnlDb3VudCAmJiB0cmlnZ2VyLnJldHJ5RGVsYXkpIHtcblx0XHRcdFx0XHRcdHRoaXMudXBkYXRlSGlzdG9yeSh7IGhpc3RvcnlJZCwgZXJyb3I6IHRydWUsIHN0ZXA6IGBnb2luZy10by1yZXRyeS0keyB0cmllcyArIDEgfWAgfSk7XG5cblx0XHRcdFx0XHRcdGxldCB3YWl0VGltZTtcblxuXHRcdFx0XHRcdFx0c3dpdGNoICh0cmlnZ2VyLnJldHJ5RGVsYXkpIHtcblx0XHRcdFx0XHRcdFx0Y2FzZSAncG93ZXJzLW9mLXRlbic6XG5cdFx0XHRcdFx0XHRcdFx0Ly8gVHJ5IGFnYWluIGluIDAuMXMsIDFzLCAxMHMsIDFtNDBzLCAxNm00MHMsIDJoNDZtNDBzLCAyN2g0Nm00MHMsIGV0Y1xuXHRcdFx0XHRcdFx0XHRcdHdhaXRUaW1lID0gTWF0aC5wb3coMTAsIHRyaWVzICsgMik7XG5cdFx0XHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0XHRcdGNhc2UgJ3Bvd2Vycy1vZi10d28nOlxuXHRcdFx0XHRcdFx0XHRcdC8vIDIgc2Vjb25kcywgNCBzZWNvbmRzLCA4IHNlY29uZHNcblx0XHRcdFx0XHRcdFx0XHR3YWl0VGltZSA9IE1hdGgucG93KDIsIHRyaWVzICsgMSkgKiAxMDAwO1xuXHRcdFx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdFx0XHRjYXNlICdpbmNyZW1lbnRzLW9mLXR3byc6XG5cdFx0XHRcdFx0XHRcdFx0Ly8gMiBzZWNvbmQsIDQgc2Vjb25kcywgNiBzZWNvbmRzLCBldGNcblx0XHRcdFx0XHRcdFx0XHR3YWl0VGltZSA9ICh0cmllcyArIDEpICogMiAqIDEwMDA7XG5cdFx0XHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0XHRcdGRlZmF1bHQ6XG5cdFx0XHRcdFx0XHRcdFx0Y29uc3QgZXIgPSBuZXcgRXJyb3IoJ1RoZSBpbnRlZ3JhdGlvblxcJ3MgcmV0cnlEZWxheSBzZXR0aW5nIGlzIGludmFsaWQuJyk7XG5cdFx0XHRcdFx0XHRcdFx0dGhpcy51cGRhdGVIaXN0b3J5KHsgaGlzdG9yeUlkLCBzdGVwOiAnZmFpbGVkLWFuZC1yZXRyeS1kZWxheS1pcy1pbnZhbGlkJywgZXJyb3I6IHRydWUsIGVycm9yU3RhY2s6IGVyLnN0YWNrIH0pO1xuXHRcdFx0XHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0bG9nZ2VyLm91dGdvaW5nLmluZm8oYFRyeWluZyB0aGUgSW50ZWdyYXRpb24gJHsgdHJpZ2dlci5uYW1lIH0gdG8gJHsgdXJsIH0gYWdhaW4gaW4gJHsgd2FpdFRpbWUgfSBtaWxsaXNlY29uZHMuYCk7XG5cdFx0XHRcdFx0XHRNZXRlb3Iuc2V0VGltZW91dCgoKSA9PiB7XG5cdFx0XHRcdFx0XHRcdHRoaXMuZXhlY3V0ZVRyaWdnZXJVcmwodXJsLCB0cmlnZ2VyLCB7IGV2ZW50LCBtZXNzYWdlLCByb29tLCBvd25lciwgdXNlciB9LCBoaXN0b3J5SWQsIHRyaWVzICsgMSk7XG5cdFx0XHRcdFx0XHR9LCB3YWl0VGltZSk7XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdHRoaXMudXBkYXRlSGlzdG9yeSh7IGhpc3RvcnlJZCwgc3RlcDogJ3Rvby1tYW55LXJldHJpZXMnLCBlcnJvcjogdHJ1ZSB9KTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0dGhpcy51cGRhdGVIaXN0b3J5KHsgaGlzdG9yeUlkLCBzdGVwOiAnZmFpbGVkLWFuZC1ub3QtY29uZmlndXJlZC10by1yZXRyeScsIGVycm9yOiB0cnVlIH0pO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHQvL3Byb2Nlc3Mgb3V0Z29pbmcgd2ViaG9vayByZXNwb25zZSBhcyBhIG5ldyBtZXNzYWdlXG5cdFx0XHRpZiAocmVzdWx0ICYmIHRoaXMuc3VjY2Vzc1Jlc3VsdHMuaW5jbHVkZXMocmVzdWx0LnN0YXR1c0NvZGUpKSB7XG5cdFx0XHRcdGlmIChyZXN1bHQgJiYgcmVzdWx0LmRhdGEgJiYgKHJlc3VsdC5kYXRhLnRleHQgfHwgcmVzdWx0LmRhdGEuYXR0YWNobWVudHMpKSB7XG5cdFx0XHRcdFx0Y29uc3QgcmVzdWx0TXNnID0gdGhpcy5zZW5kTWVzc2FnZSh7IHRyaWdnZXIsIHJvb20sIG1lc3NhZ2U6IHJlc3VsdC5kYXRhLCBkYXRhIH0pO1xuXHRcdFx0XHRcdHRoaXMudXBkYXRlSGlzdG9yeSh7IGhpc3RvcnlJZCwgc3RlcDogJ3VybC1yZXNwb25zZS1zZW50LW1lc3NhZ2UnLCByZXN1bHRNZXNzYWdlOiByZXN1bHRNc2csIGZpbmlzaGVkOiB0cnVlIH0pO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH1cblxuXHRyZXBsYXkoaW50ZWdyYXRpb24sIGhpc3RvcnkpIHtcblx0XHRpZiAoIWludGVncmF0aW9uIHx8IGludGVncmF0aW9uLnR5cGUgIT09ICd3ZWJob29rLW91dGdvaW5nJykge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignaW50ZWdyYXRpb24tdHlwZS1tdXN0LWJlLW91dGdvaW5nJywgJ1RoZSBpbnRlZ3JhdGlvbiB0eXBlIHRvIHJlcGxheSBtdXN0IGJlIGFuIG91dGdvaW5nIHdlYmhvb2suJyk7XG5cdFx0fVxuXG5cdFx0aWYgKCFoaXN0b3J5IHx8ICFoaXN0b3J5LmRhdGEpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2hpc3RvcnktZGF0YS1tdXN0LWJlLWRlZmluZWQnLCAnVGhlIGhpc3RvcnkgZGF0YSBtdXN0IGJlIGRlZmluZWQgdG8gcmVwbGF5IGFuIGludGVncmF0aW9uLicpO1xuXHRcdH1cblxuXHRcdGNvbnN0IGV2ZW50ID0gaGlzdG9yeS5ldmVudDtcblx0XHRjb25zdCBtZXNzYWdlID0gUm9ja2V0Q2hhdC5tb2RlbHMuTWVzc2FnZXMuZmluZE9uZUJ5SWQoaGlzdG9yeS5kYXRhLm1lc3NhZ2VfaWQpO1xuXHRcdGNvbnN0IHJvb20gPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT25lQnlJZChoaXN0b3J5LmRhdGEuY2hhbm5lbF9pZCk7XG5cdFx0Y29uc3QgdXNlciA9IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmVCeUlkKGhpc3RvcnkuZGF0YS51c2VyX2lkKTtcblx0XHRsZXQgb3duZXI7XG5cblx0XHRpZiAoaGlzdG9yeS5kYXRhLm93bmVyICYmIGhpc3RvcnkuZGF0YS5vd25lci5faWQpIHtcblx0XHRcdG93bmVyID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZE9uZUJ5SWQoaGlzdG9yeS5kYXRhLm93bmVyLl9pZCk7XG5cdFx0fVxuXG5cdFx0dGhpcy5leGVjdXRlVHJpZ2dlclVybChoaXN0b3J5LnVybCwgaW50ZWdyYXRpb24sIHsgZXZlbnQsIG1lc3NhZ2UsIHJvb20sIG93bmVyLCB1c2VyIH0pO1xuXHR9XG59O1xuIiwiUm9ja2V0Q2hhdC5tb2RlbHMuSW50ZWdyYXRpb25zID0gbmV3IGNsYXNzIEludGVncmF0aW9ucyBleHRlbmRzIFJvY2tldENoYXQubW9kZWxzLl9CYXNlIHtcblx0Y29uc3RydWN0b3IoKSB7XG5cdFx0c3VwZXIoJ2ludGVncmF0aW9ucycpO1xuXHR9XG5cblx0ZmluZEJ5VHlwZSh0eXBlLCBvcHRpb25zKSB7XG5cdFx0aWYgKHR5cGUgIT09ICd3ZWJob29rLWluY29taW5nJyAmJiB0eXBlICE9PSAnd2ViaG9vay1vdXRnb2luZycpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2ludmFsaWQtdHlwZS10by1maW5kJyk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRoaXMuZmluZCh7IHR5cGUgfSwgb3B0aW9ucyk7XG5cdH1cblxuXHRkaXNhYmxlQnlVc2VySWQodXNlcklkKSB7XG5cdFx0cmV0dXJuIHRoaXMudXBkYXRlKHsgdXNlcklkIH0sIHsgJHNldDogeyBlbmFibGVkOiBmYWxzZSB9fSwgeyBtdWx0aTogdHJ1ZSB9KTtcblx0fVxufTtcbiIsIlJvY2tldENoYXQubW9kZWxzLkludGVncmF0aW9uSGlzdG9yeSA9IG5ldyBjbGFzcyBJbnRlZ3JhdGlvbkhpc3RvcnkgZXh0ZW5kcyBSb2NrZXRDaGF0Lm1vZGVscy5fQmFzZSB7XG5cdGNvbnN0cnVjdG9yKCkge1xuXHRcdHN1cGVyKCdpbnRlZ3JhdGlvbl9oaXN0b3J5Jyk7XG5cdH1cblxuXHRmaW5kQnlUeXBlKHR5cGUsIG9wdGlvbnMpIHtcblx0XHRpZiAodHlwZSAhPT0gJ291dGdvaW5nLXdlYmhvb2snIHx8IHR5cGUgIT09ICdpbmNvbWluZy13ZWJob29rJykge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignaW52YWxpZC1pbnRlZ3JhdGlvbi10eXBlJyk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRoaXMuZmluZCh7IHR5cGUgfSwgb3B0aW9ucyk7XG5cdH1cblxuXHRmaW5kQnlJbnRlZ3JhdGlvbklkKGlkLCBvcHRpb25zKSB7XG5cdFx0cmV0dXJuIHRoaXMuZmluZCh7ICdpbnRlZ3JhdGlvbi5faWQnOiBpZCB9LCBvcHRpb25zKTtcblx0fVxuXG5cdGZpbmRCeUludGVncmF0aW9uSWRBbmRDcmVhdGVkQnkoaWQsIGNyZWF0b3JJZCwgb3B0aW9ucykge1xuXHRcdHJldHVybiB0aGlzLmZpbmQoeyAnaW50ZWdyYXRpb24uX2lkJzogaWQsICdpbnRlZ3JhdGlvbi5fY3JlYXRlZEJ5Ll9pZCc6IGNyZWF0b3JJZCB9LCBvcHRpb25zKTtcblx0fVxuXG5cdGZpbmRPbmVCeUludGVncmF0aW9uSWRBbmRIaXN0b3J5SWQoaW50ZWdyYXRpb25JZCwgaGlzdG9yeUlkKSB7XG5cdFx0cmV0dXJuIHRoaXMuZmluZE9uZSh7ICdpbnRlZ3JhdGlvbi5faWQnOiBpbnRlZ3JhdGlvbklkLCBfaWQ6IGhpc3RvcnlJZCB9KTtcblx0fVxuXG5cdGZpbmRCeUV2ZW50TmFtZShldmVudCwgb3B0aW9ucykge1xuXHRcdHJldHVybiB0aGlzLmZpbmQoeyBldmVudCB9LCBvcHRpb25zKTtcblx0fVxuXG5cdGZpbmRGYWlsZWQob3B0aW9ucykge1xuXHRcdHJldHVybiB0aGlzLmZpbmQoeyBlcnJvcjogdHJ1ZSB9LCBvcHRpb25zKTtcblx0fVxuXG5cdHJlbW92ZUJ5SW50ZWdyYXRpb25JZChpbnRlZ3JhdGlvbklkKSB7XG5cdFx0cmV0dXJuIHRoaXMucmVtb3ZlKHsgJ2ludGVncmF0aW9uLl9pZCc6IGludGVncmF0aW9uSWQgfSk7XG5cdH1cbn07XG4iLCJNZXRlb3IucHVibGlzaCgnaW50ZWdyYXRpb25zJywgZnVuY3Rpb24gX2ludGVncmF0aW9uUHVibGljYXRpb24oKSB7XG5cdGlmICghdGhpcy51c2VySWQpIHtcblx0XHRyZXR1cm4gdGhpcy5yZWFkeSgpO1xuXHR9XG5cblx0aWYgKFJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih0aGlzLnVzZXJJZCwgJ21hbmFnZS1pbnRlZ3JhdGlvbnMnKSkge1xuXHRcdHJldHVybiBSb2NrZXRDaGF0Lm1vZGVscy5JbnRlZ3JhdGlvbnMuZmluZCgpO1xuXHR9IGVsc2UgaWYgKFJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih0aGlzLnVzZXJJZCwgJ21hbmFnZS1vd24taW50ZWdyYXRpb25zJykpIHtcblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5tb2RlbHMuSW50ZWdyYXRpb25zLmZpbmQoeyAnX2NyZWF0ZWRCeS5faWQnOiB0aGlzLnVzZXJJZCB9KTtcblx0fSBlbHNlIHtcblx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdub3QtYXV0aG9yaXplZCcpO1xuXHR9XG59KTtcbiIsIk1ldGVvci5wdWJsaXNoKCdpbnRlZ3JhdGlvbkhpc3RvcnknLCBmdW5jdGlvbiBfaW50ZWdyYXRpb25IaXN0b3J5UHVibGljYXRpb24oaW50ZWdyYXRpb25JZCwgbGltaXQgPSAyNSkge1xuXHRpZiAoIXRoaXMudXNlcklkKSB7XG5cdFx0cmV0dXJuIHRoaXMucmVhZHkoKTtcblx0fVxuXG5cdGlmIChSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odGhpcy51c2VySWQsICdtYW5hZ2UtaW50ZWdyYXRpb25zJykpIHtcblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5tb2RlbHMuSW50ZWdyYXRpb25IaXN0b3J5LmZpbmRCeUludGVncmF0aW9uSWQoaW50ZWdyYXRpb25JZCwgeyBzb3J0OiB7IF91cGRhdGVkQXQ6IC0xIH0sIGxpbWl0IH0pO1xuXHR9IGVsc2UgaWYgKFJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih0aGlzLnVzZXJJZCwgJ21hbmFnZS1vd24taW50ZWdyYXRpb25zJykpIHtcblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5tb2RlbHMuSW50ZWdyYXRpb25IaXN0b3J5LmZpbmRCeUludGVncmF0aW9uSWRBbmRDcmVhdGVkQnkoaW50ZWdyYXRpb25JZCwgdGhpcy51c2VySWQsIHsgc29ydDogeyBfdXBkYXRlZEF0OiAtMSB9LCBsaW1pdCB9KTtcblx0fSBlbHNlIHtcblx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdub3QtYXV0aG9yaXplZCcpO1xuXHR9XG59KTtcbiIsIi8qIGdsb2JhbCBCYWJlbCAqL1xuaW1wb3J0IF8gZnJvbSAndW5kZXJzY29yZSc7XG5pbXBvcnQgcyBmcm9tICd1bmRlcnNjb3JlLnN0cmluZyc7XG5jb25zdCB2YWxpZENoYW5uZWxDaGFycyA9IFsnQCcsICcjJ107XG5cbk1ldGVvci5tZXRob2RzKHtcblx0YWRkSW5jb21pbmdJbnRlZ3JhdGlvbihpbnRlZ3JhdGlvbikge1xuXHRcdGlmICghUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKHRoaXMudXNlcklkLCAnbWFuYWdlLWludGVncmF0aW9ucycpICYmICFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odGhpcy51c2VySWQsICdtYW5hZ2Utb3duLWludGVncmF0aW9ucycpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdub3RfYXV0aG9yaXplZCcsICdVbmF1dGhvcml6ZWQnLCB7IG1ldGhvZDogJ2FkZEluY29taW5nSW50ZWdyYXRpb24nIH0pO1xuXHRcdH1cblxuXHRcdGlmICghXy5pc1N0cmluZyhpbnRlZ3JhdGlvbi5jaGFubmVsKSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItaW52YWxpZC1jaGFubmVsJywgJ0ludmFsaWQgY2hhbm5lbCcsIHsgbWV0aG9kOiAnYWRkSW5jb21pbmdJbnRlZ3JhdGlvbicgfSk7XG5cdFx0fVxuXG5cdFx0aWYgKGludGVncmF0aW9uLmNoYW5uZWwudHJpbSgpID09PSAnJykge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItaW52YWxpZC1jaGFubmVsJywgJ0ludmFsaWQgY2hhbm5lbCcsIHsgbWV0aG9kOiAnYWRkSW5jb21pbmdJbnRlZ3JhdGlvbicgfSk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgY2hhbm5lbHMgPSBfLm1hcChpbnRlZ3JhdGlvbi5jaGFubmVsLnNwbGl0KCcsJyksIChjaGFubmVsKSA9PiBzLnRyaW0oY2hhbm5lbCkpO1xuXG5cdFx0Zm9yIChjb25zdCBjaGFubmVsIG9mIGNoYW5uZWxzKSB7XG5cdFx0XHRpZiAoIXZhbGlkQ2hhbm5lbENoYXJzLmluY2x1ZGVzKGNoYW5uZWxbMF0pKSB7XG5cdFx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWludmFsaWQtY2hhbm5lbC1zdGFydC13aXRoLWNoYXJzJywgJ0ludmFsaWQgY2hhbm5lbC4gU3RhcnQgd2l0aCBAIG9yICMnLCB7IG1ldGhvZDogJ3VwZGF0ZUluY29taW5nSW50ZWdyYXRpb24nIH0pO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGlmICghXy5pc1N0cmluZyhpbnRlZ3JhdGlvbi51c2VybmFtZSkgfHwgaW50ZWdyYXRpb24udXNlcm5hbWUudHJpbSgpID09PSAnJykge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItaW52YWxpZC11c2VybmFtZScsICdJbnZhbGlkIHVzZXJuYW1lJywgeyBtZXRob2Q6ICdhZGRJbmNvbWluZ0ludGVncmF0aW9uJyB9KTtcblx0XHR9XG5cblx0XHRpZiAoaW50ZWdyYXRpb24uc2NyaXB0RW5hYmxlZCA9PT0gdHJ1ZSAmJiBpbnRlZ3JhdGlvbi5zY3JpcHQgJiYgaW50ZWdyYXRpb24uc2NyaXB0LnRyaW0oKSAhPT0gJycpIHtcblx0XHRcdHRyeSB7XG5cdFx0XHRcdGxldCBiYWJlbE9wdGlvbnMgPSBCYWJlbC5nZXREZWZhdWx0T3B0aW9ucyh7IHJ1bnRpbWU6IGZhbHNlIH0pO1xuXHRcdFx0XHRiYWJlbE9wdGlvbnMgPSBfLmV4dGVuZChiYWJlbE9wdGlvbnMsIHsgY29tcGFjdDogdHJ1ZSwgbWluaWZpZWQ6IHRydWUsIGNvbW1lbnRzOiBmYWxzZSB9KTtcblxuXHRcdFx0XHRpbnRlZ3JhdGlvbi5zY3JpcHRDb21waWxlZCA9IEJhYmVsLmNvbXBpbGUoaW50ZWdyYXRpb24uc2NyaXB0LCBiYWJlbE9wdGlvbnMpLmNvZGU7XG5cdFx0XHRcdGludGVncmF0aW9uLnNjcmlwdEVycm9yID0gdW5kZWZpbmVkO1xuXHRcdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0XHRpbnRlZ3JhdGlvbi5zY3JpcHRDb21waWxlZCA9IHVuZGVmaW5lZDtcblx0XHRcdFx0aW50ZWdyYXRpb24uc2NyaXB0RXJyb3IgPSBfLnBpY2soZSwgJ25hbWUnLCAnbWVzc2FnZScsICdzdGFjaycpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGZvciAobGV0IGNoYW5uZWwgb2YgY2hhbm5lbHMpIHtcblx0XHRcdGxldCByZWNvcmQ7XG5cdFx0XHRjb25zdCBjaGFubmVsVHlwZSA9IGNoYW5uZWxbMF07XG5cdFx0XHRjaGFubmVsID0gY2hhbm5lbC5zdWJzdHIoMSk7XG5cblx0XHRcdHN3aXRjaCAoY2hhbm5lbFR5cGUpIHtcblx0XHRcdFx0Y2FzZSAnIyc6XG5cdFx0XHRcdFx0cmVjb3JkID0gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9uZSh7XG5cdFx0XHRcdFx0XHQkb3I6IFtcblx0XHRcdFx0XHRcdFx0e19pZDogY2hhbm5lbH0sXG5cdFx0XHRcdFx0XHRcdHtuYW1lOiBjaGFubmVsfVxuXHRcdFx0XHRcdFx0XVxuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRjYXNlICdAJzpcblx0XHRcdFx0XHRyZWNvcmQgPSBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kT25lKHtcblx0XHRcdFx0XHRcdCRvcjogW1xuXHRcdFx0XHRcdFx0XHR7X2lkOiBjaGFubmVsfSxcblx0XHRcdFx0XHRcdFx0e3VzZXJuYW1lOiBjaGFubmVsfVxuXHRcdFx0XHRcdFx0XVxuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoIXJlY29yZCkge1xuXHRcdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLXJvb20nLCAnSW52YWxpZCByb29tJywgeyBtZXRob2Q6ICdhZGRJbmNvbWluZ0ludGVncmF0aW9uJyB9KTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKHJlY29yZC51c2VybmFtZXMgJiYgIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih0aGlzLnVzZXJJZCwgJ21hbmFnZS1pbnRlZ3JhdGlvbnMnKSAmJiBSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odGhpcy51c2VySWQsICdtYW5hZ2Utb3duLWludGVncmF0aW9ucycpICYmICFyZWNvcmQudXNlcm5hbWVzLmluY2x1ZGVzKE1ldGVvci51c2VyKCkudXNlcm5hbWUpKSB7XG5cdFx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWludmFsaWQtY2hhbm5lbCcsICdJbnZhbGlkIENoYW5uZWwnLCB7IG1ldGhvZDogJ2FkZEluY29taW5nSW50ZWdyYXRpb24nIH0pO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGNvbnN0IHVzZXIgPSBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kT25lKHt1c2VybmFtZTogaW50ZWdyYXRpb24udXNlcm5hbWV9KTtcblxuXHRcdGlmICghdXNlcikge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItaW52YWxpZC11c2VyJywgJ0ludmFsaWQgdXNlcicsIHsgbWV0aG9kOiAnYWRkSW5jb21pbmdJbnRlZ3JhdGlvbicgfSk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgdG9rZW4gPSBSYW5kb20uaWQoNDgpO1xuXG5cdFx0aW50ZWdyYXRpb24udHlwZSA9ICd3ZWJob29rLWluY29taW5nJztcblx0XHRpbnRlZ3JhdGlvbi50b2tlbiA9IHRva2VuO1xuXHRcdGludGVncmF0aW9uLmNoYW5uZWwgPSBjaGFubmVscztcblx0XHRpbnRlZ3JhdGlvbi51c2VySWQgPSB1c2VyLl9pZDtcblx0XHRpbnRlZ3JhdGlvbi5fY3JlYXRlZEF0ID0gbmV3IERhdGUoKTtcblx0XHRpbnRlZ3JhdGlvbi5fY3JlYXRlZEJ5ID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZE9uZSh0aGlzLnVzZXJJZCwge2ZpZWxkczoge3VzZXJuYW1lOiAxfX0pO1xuXG5cdFx0Um9ja2V0Q2hhdC5tb2RlbHMuUm9sZXMuYWRkVXNlclJvbGVzKHVzZXIuX2lkLCAnYm90Jyk7XG5cblx0XHRpbnRlZ3JhdGlvbi5faWQgPSBSb2NrZXRDaGF0Lm1vZGVscy5JbnRlZ3JhdGlvbnMuaW5zZXJ0KGludGVncmF0aW9uKTtcblxuXHRcdHJldHVybiBpbnRlZ3JhdGlvbjtcblx0fVxufSk7XG4iLCIvKiBnbG9iYWwgQmFiZWwgKi9cbmltcG9ydCBfIGZyb20gJ3VuZGVyc2NvcmUnO1xuaW1wb3J0IHMgZnJvbSAndW5kZXJzY29yZS5zdHJpbmcnO1xuY29uc3QgdmFsaWRDaGFubmVsQ2hhcnMgPSBbJ0AnLCAnIyddO1xuXG5NZXRlb3IubWV0aG9kcyh7XG5cdHVwZGF0ZUluY29taW5nSW50ZWdyYXRpb24oaW50ZWdyYXRpb25JZCwgaW50ZWdyYXRpb24pIHtcblx0XHRpZiAoIV8uaXNTdHJpbmcoaW50ZWdyYXRpb24uY2hhbm5lbCkgfHwgaW50ZWdyYXRpb24uY2hhbm5lbC50cmltKCkgPT09ICcnKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLWNoYW5uZWwnLCAnSW52YWxpZCBjaGFubmVsJywgeyBtZXRob2Q6ICd1cGRhdGVJbmNvbWluZ0ludGVncmF0aW9uJyB9KTtcblx0XHR9XG5cblx0XHRjb25zdCBjaGFubmVscyA9IF8ubWFwKGludGVncmF0aW9uLmNoYW5uZWwuc3BsaXQoJywnKSwgKGNoYW5uZWwpID0+IHMudHJpbShjaGFubmVsKSk7XG5cblx0XHRmb3IgKGNvbnN0IGNoYW5uZWwgb2YgY2hhbm5lbHMpIHtcblx0XHRcdGlmICghdmFsaWRDaGFubmVsQ2hhcnMuaW5jbHVkZXMoY2hhbm5lbFswXSkpIHtcblx0XHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItaW52YWxpZC1jaGFubmVsLXN0YXJ0LXdpdGgtY2hhcnMnLCAnSW52YWxpZCBjaGFubmVsLiBTdGFydCB3aXRoIEAgb3IgIycsIHsgbWV0aG9kOiAndXBkYXRlSW5jb21pbmdJbnRlZ3JhdGlvbicgfSk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0bGV0IGN1cnJlbnRJbnRlZ3JhdGlvbjtcblxuXHRcdGlmIChSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odGhpcy51c2VySWQsICdtYW5hZ2UtaW50ZWdyYXRpb25zJykpIHtcblx0XHRcdGN1cnJlbnRJbnRlZ3JhdGlvbiA9IFJvY2tldENoYXQubW9kZWxzLkludGVncmF0aW9ucy5maW5kT25lKGludGVncmF0aW9uSWQpO1xuXHRcdH0gZWxzZSBpZiAoUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKHRoaXMudXNlcklkLCAnbWFuYWdlLW93bi1pbnRlZ3JhdGlvbnMnKSkge1xuXHRcdFx0Y3VycmVudEludGVncmF0aW9uID0gUm9ja2V0Q2hhdC5tb2RlbHMuSW50ZWdyYXRpb25zLmZpbmRPbmUoeyBfaWQ6IGludGVncmF0aW9uSWQsICdfY3JlYXRlZEJ5Ll9pZCc6IHRoaXMudXNlcklkIH0pO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdub3RfYXV0aG9yaXplZCcsICdVbmF1dGhvcml6ZWQnLCB7IG1ldGhvZDogJ3VwZGF0ZUluY29taW5nSW50ZWdyYXRpb24nIH0pO1xuXHRcdH1cblxuXHRcdGlmICghY3VycmVudEludGVncmF0aW9uKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLWludGVncmF0aW9uJywgJ0ludmFsaWQgaW50ZWdyYXRpb24nLCB7IG1ldGhvZDogJ3VwZGF0ZUluY29taW5nSW50ZWdyYXRpb24nIH0pO1xuXHRcdH1cblxuXHRcdGlmIChpbnRlZ3JhdGlvbi5zY3JpcHRFbmFibGVkID09PSB0cnVlICYmIGludGVncmF0aW9uLnNjcmlwdCAmJiBpbnRlZ3JhdGlvbi5zY3JpcHQudHJpbSgpICE9PSAnJykge1xuXHRcdFx0dHJ5IHtcblx0XHRcdFx0bGV0IGJhYmVsT3B0aW9ucyA9IEJhYmVsLmdldERlZmF1bHRPcHRpb25zKHsgcnVudGltZTogZmFsc2UgfSk7XG5cdFx0XHRcdGJhYmVsT3B0aW9ucyA9IF8uZXh0ZW5kKGJhYmVsT3B0aW9ucywgeyBjb21wYWN0OiB0cnVlLCBtaW5pZmllZDogdHJ1ZSwgY29tbWVudHM6IGZhbHNlIH0pO1xuXG5cdFx0XHRcdGludGVncmF0aW9uLnNjcmlwdENvbXBpbGVkID0gQmFiZWwuY29tcGlsZShpbnRlZ3JhdGlvbi5zY3JpcHQsIGJhYmVsT3B0aW9ucykuY29kZTtcblx0XHRcdFx0aW50ZWdyYXRpb24uc2NyaXB0RXJyb3IgPSB1bmRlZmluZWQ7XG5cdFx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRcdGludGVncmF0aW9uLnNjcmlwdENvbXBpbGVkID0gdW5kZWZpbmVkO1xuXHRcdFx0XHRpbnRlZ3JhdGlvbi5zY3JpcHRFcnJvciA9IF8ucGljayhlLCAnbmFtZScsICdtZXNzYWdlJywgJ3N0YWNrJyk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0Zm9yIChsZXQgY2hhbm5lbCBvZiBjaGFubmVscykge1xuXHRcdFx0Y29uc3QgY2hhbm5lbFR5cGUgPSBjaGFubmVsWzBdO1xuXHRcdFx0Y2hhbm5lbCA9IGNoYW5uZWwuc3Vic3RyKDEpO1xuXHRcdFx0bGV0IHJlY29yZDtcblxuXHRcdFx0c3dpdGNoIChjaGFubmVsVHlwZSkge1xuXHRcdFx0XHRjYXNlICcjJzpcblx0XHRcdFx0XHRyZWNvcmQgPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT25lKHtcblx0XHRcdFx0XHRcdCRvcjogW1xuXHRcdFx0XHRcdFx0XHR7X2lkOiBjaGFubmVsfSxcblx0XHRcdFx0XHRcdFx0e25hbWU6IGNoYW5uZWx9XG5cdFx0XHRcdFx0XHRdXG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdGNhc2UgJ0AnOlxuXHRcdFx0XHRcdHJlY29yZCA9IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmUoe1xuXHRcdFx0XHRcdFx0JG9yOiBbXG5cdFx0XHRcdFx0XHRcdHtfaWQ6IGNoYW5uZWx9LFxuXHRcdFx0XHRcdFx0XHR7dXNlcm5hbWU6IGNoYW5uZWx9XG5cdFx0XHRcdFx0XHRdXG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHR9XG5cblx0XHRcdGlmICghcmVjb3JkKSB7XG5cdFx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWludmFsaWQtcm9vbScsICdJbnZhbGlkIHJvb20nLCB7IG1ldGhvZDogJ3VwZGF0ZUluY29taW5nSW50ZWdyYXRpb24nIH0pO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAocmVjb3JkLnVzZXJuYW1lcyAmJiAhUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKHRoaXMudXNlcklkLCAnbWFuYWdlLWludGVncmF0aW9ucycpICYmIFJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih0aGlzLnVzZXJJZCwgJ21hbmFnZS1vd24taW50ZWdyYXRpb25zJykgJiYgIXJlY29yZC51c2VybmFtZXMuaW5jbHVkZXMoTWV0ZW9yLnVzZXIoKS51c2VybmFtZSkpIHtcblx0XHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItaW52YWxpZC1jaGFubmVsJywgJ0ludmFsaWQgQ2hhbm5lbCcsIHsgbWV0aG9kOiAndXBkYXRlSW5jb21pbmdJbnRlZ3JhdGlvbicgfSk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0Y29uc3QgdXNlciA9IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmUoeyB1c2VybmFtZTogY3VycmVudEludGVncmF0aW9uLnVzZXJuYW1lIH0pO1xuXG5cdFx0aWYgKCF1c2VyIHx8ICF1c2VyLl9pZCkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItaW52YWxpZC1wb3N0LWFzLXVzZXInLCAnSW52YWxpZCBQb3N0IEFzIFVzZXInLCB7IG1ldGhvZDogJ3VwZGF0ZUluY29taW5nSW50ZWdyYXRpb24nIH0pO1xuXHRcdH1cblxuXHRcdFJvY2tldENoYXQubW9kZWxzLlJvbGVzLmFkZFVzZXJSb2xlcyh1c2VyLl9pZCwgJ2JvdCcpO1xuXG5cdFx0Um9ja2V0Q2hhdC5tb2RlbHMuSW50ZWdyYXRpb25zLnVwZGF0ZShpbnRlZ3JhdGlvbklkLCB7XG5cdFx0XHQkc2V0OiB7XG5cdFx0XHRcdGVuYWJsZWQ6IGludGVncmF0aW9uLmVuYWJsZWQsXG5cdFx0XHRcdG5hbWU6IGludGVncmF0aW9uLm5hbWUsXG5cdFx0XHRcdGF2YXRhcjogaW50ZWdyYXRpb24uYXZhdGFyLFxuXHRcdFx0XHRlbW9qaTogaW50ZWdyYXRpb24uZW1vamksXG5cdFx0XHRcdGFsaWFzOiBpbnRlZ3JhdGlvbi5hbGlhcyxcblx0XHRcdFx0Y2hhbm5lbDogY2hhbm5lbHMsXG5cdFx0XHRcdHNjcmlwdDogaW50ZWdyYXRpb24uc2NyaXB0LFxuXHRcdFx0XHRzY3JpcHRFbmFibGVkOiBpbnRlZ3JhdGlvbi5zY3JpcHRFbmFibGVkLFxuXHRcdFx0XHRzY3JpcHRDb21waWxlZDogaW50ZWdyYXRpb24uc2NyaXB0Q29tcGlsZWQsXG5cdFx0XHRcdHNjcmlwdEVycm9yOiBpbnRlZ3JhdGlvbi5zY3JpcHRFcnJvcixcblx0XHRcdFx0X3VwZGF0ZWRBdDogbmV3IERhdGUoKSxcblx0XHRcdFx0X3VwZGF0ZWRCeTogUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZE9uZSh0aGlzLnVzZXJJZCwge2ZpZWxkczoge3VzZXJuYW1lOiAxfX0pXG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5tb2RlbHMuSW50ZWdyYXRpb25zLmZpbmRPbmUoaW50ZWdyYXRpb25JZCk7XG5cdH1cbn0pO1xuIiwiTWV0ZW9yLm1ldGhvZHMoe1xuXHRkZWxldGVJbmNvbWluZ0ludGVncmF0aW9uKGludGVncmF0aW9uSWQpIHtcblx0XHRsZXQgaW50ZWdyYXRpb247XG5cblx0XHRpZiAoUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKHRoaXMudXNlcklkLCAnbWFuYWdlLWludGVncmF0aW9ucycpKSB7XG5cdFx0XHRpbnRlZ3JhdGlvbiA9IFJvY2tldENoYXQubW9kZWxzLkludGVncmF0aW9ucy5maW5kT25lKGludGVncmF0aW9uSWQpO1xuXHRcdH0gZWxzZSBpZiAoUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKHRoaXMudXNlcklkLCAnbWFuYWdlLW93bi1pbnRlZ3JhdGlvbnMnKSkge1xuXHRcdFx0aW50ZWdyYXRpb24gPSBSb2NrZXRDaGF0Lm1vZGVscy5JbnRlZ3JhdGlvbnMuZmluZE9uZShpbnRlZ3JhdGlvbklkLCB7IGZpZWxkcyA6IHsgJ19jcmVhdGVkQnkuX2lkJzogdGhpcy51c2VySWQgfX0pO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdub3RfYXV0aG9yaXplZCcsICdVbmF1dGhvcml6ZWQnLCB7IG1ldGhvZDogJ2RlbGV0ZUluY29taW5nSW50ZWdyYXRpb24nIH0pO1xuXHRcdH1cblxuXHRcdGlmICghaW50ZWdyYXRpb24pIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWludmFsaWQtaW50ZWdyYXRpb24nLCAnSW52YWxpZCBpbnRlZ3JhdGlvbicsIHsgbWV0aG9kOiAnZGVsZXRlSW5jb21pbmdJbnRlZ3JhdGlvbicgfSk7XG5cdFx0fVxuXG5cdFx0Um9ja2V0Q2hhdC5tb2RlbHMuSW50ZWdyYXRpb25zLnJlbW92ZSh7IF9pZDogaW50ZWdyYXRpb25JZCB9KTtcblxuXHRcdHJldHVybiB0cnVlO1xuXHR9XG59KTtcbiIsIk1ldGVvci5tZXRob2RzKHtcblx0YWRkT3V0Z29pbmdJbnRlZ3JhdGlvbihpbnRlZ3JhdGlvbikge1xuXHRcdGlmICghUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKHRoaXMudXNlcklkLCAnbWFuYWdlLWludGVncmF0aW9ucycpXG5cdFx0XHQmJiAhUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKHRoaXMudXNlcklkLCAnbWFuYWdlLW93bi1pbnRlZ3JhdGlvbnMnKVxuXHRcdFx0JiYgIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih0aGlzLnVzZXJJZCwgJ21hbmFnZS1pbnRlZ3JhdGlvbnMnLCAnYm90Jylcblx0XHRcdCYmICFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odGhpcy51c2VySWQsICdtYW5hZ2Utb3duLWludGVncmF0aW9ucycsICdib3QnKSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignbm90X2F1dGhvcml6ZWQnKTtcblx0XHR9XG5cblx0XHRpbnRlZ3JhdGlvbiA9IFJvY2tldENoYXQuaW50ZWdyYXRpb25zLnZhbGlkYXRlT3V0Z29pbmcoaW50ZWdyYXRpb24sIHRoaXMudXNlcklkKTtcblxuXHRcdGludGVncmF0aW9uLl9jcmVhdGVkQXQgPSBuZXcgRGF0ZSgpO1xuXHRcdGludGVncmF0aW9uLl9jcmVhdGVkQnkgPSBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kT25lKHRoaXMudXNlcklkLCB7ZmllbGRzOiB7dXNlcm5hbWU6IDF9fSk7XG5cdFx0aW50ZWdyYXRpb24uX2lkID0gUm9ja2V0Q2hhdC5tb2RlbHMuSW50ZWdyYXRpb25zLmluc2VydChpbnRlZ3JhdGlvbik7XG5cblx0XHRyZXR1cm4gaW50ZWdyYXRpb247XG5cdH1cbn0pO1xuIiwiTWV0ZW9yLm1ldGhvZHMoe1xuXHR1cGRhdGVPdXRnb2luZ0ludGVncmF0aW9uKGludGVncmF0aW9uSWQsIGludGVncmF0aW9uKSB7XG5cdFx0aW50ZWdyYXRpb24gPSBSb2NrZXRDaGF0LmludGVncmF0aW9ucy52YWxpZGF0ZU91dGdvaW5nKGludGVncmF0aW9uLCB0aGlzLnVzZXJJZCk7XG5cblx0XHRpZiAoIWludGVncmF0aW9uLnRva2VuIHx8IGludGVncmF0aW9uLnRva2VuLnRyaW0oKSA9PT0gJycpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWludmFsaWQtdG9rZW4nLCAnSW52YWxpZCB0b2tlbicsIHsgbWV0aG9kOiAndXBkYXRlT3V0Z29pbmdJbnRlZ3JhdGlvbicgfSk7XG5cdFx0fVxuXG5cdFx0bGV0IGN1cnJlbnRJbnRlZ3JhdGlvbjtcblxuXHRcdGlmIChSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odGhpcy51c2VySWQsICdtYW5hZ2UtaW50ZWdyYXRpb25zJykpIHtcblx0XHRcdGN1cnJlbnRJbnRlZ3JhdGlvbiA9IFJvY2tldENoYXQubW9kZWxzLkludGVncmF0aW9ucy5maW5kT25lKGludGVncmF0aW9uSWQpO1xuXHRcdH0gZWxzZSBpZiAoUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKHRoaXMudXNlcklkLCAnbWFuYWdlLW93bi1pbnRlZ3JhdGlvbnMnKSkge1xuXHRcdFx0Y3VycmVudEludGVncmF0aW9uID0gUm9ja2V0Q2hhdC5tb2RlbHMuSW50ZWdyYXRpb25zLmZpbmRPbmUoeyBfaWQ6IGludGVncmF0aW9uSWQsICdfY3JlYXRlZEJ5Ll9pZCc6IHRoaXMudXNlcklkIH0pO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdub3RfYXV0aG9yaXplZCcsICdVbmF1dGhvcml6ZWQnLCB7IG1ldGhvZDogJ3VwZGF0ZU91dGdvaW5nSW50ZWdyYXRpb24nIH0pO1xuXHRcdH1cblxuXHRcdGlmICghY3VycmVudEludGVncmF0aW9uKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdpbnZhbGlkX2ludGVncmF0aW9uJywgJ1ttZXRob2RzXSB1cGRhdGVPdXRnb2luZ0ludGVncmF0aW9uIC0+IGludGVncmF0aW9uIG5vdCBmb3VuZCcpO1xuXHRcdH1cblxuXHRcdFJvY2tldENoYXQubW9kZWxzLkludGVncmF0aW9ucy51cGRhdGUoaW50ZWdyYXRpb25JZCwge1xuXHRcdFx0JHNldDoge1xuXHRcdFx0XHRldmVudDogaW50ZWdyYXRpb24uZXZlbnQsXG5cdFx0XHRcdGVuYWJsZWQ6IGludGVncmF0aW9uLmVuYWJsZWQsXG5cdFx0XHRcdG5hbWU6IGludGVncmF0aW9uLm5hbWUsXG5cdFx0XHRcdGF2YXRhcjogaW50ZWdyYXRpb24uYXZhdGFyLFxuXHRcdFx0XHRlbW9qaTogaW50ZWdyYXRpb24uZW1vamksXG5cdFx0XHRcdGFsaWFzOiBpbnRlZ3JhdGlvbi5hbGlhcyxcblx0XHRcdFx0Y2hhbm5lbDogaW50ZWdyYXRpb24uY2hhbm5lbCxcblx0XHRcdFx0dGFyZ2V0Um9vbTogaW50ZWdyYXRpb24udGFyZ2V0Um9vbSxcblx0XHRcdFx0aW1wZXJzb25hdGVVc2VyOiBpbnRlZ3JhdGlvbi5pbXBlcnNvbmF0ZVVzZXIsXG5cdFx0XHRcdHVzZXJuYW1lOiBpbnRlZ3JhdGlvbi51c2VybmFtZSxcblx0XHRcdFx0dXNlcklkOiBpbnRlZ3JhdGlvbi51c2VySWQsXG5cdFx0XHRcdHVybHM6IGludGVncmF0aW9uLnVybHMsXG5cdFx0XHRcdHRva2VuOiBpbnRlZ3JhdGlvbi50b2tlbixcblx0XHRcdFx0c2NyaXB0OiBpbnRlZ3JhdGlvbi5zY3JpcHQsXG5cdFx0XHRcdHNjcmlwdEVuYWJsZWQ6IGludGVncmF0aW9uLnNjcmlwdEVuYWJsZWQsXG5cdFx0XHRcdHNjcmlwdENvbXBpbGVkOiBpbnRlZ3JhdGlvbi5zY3JpcHRDb21waWxlZCxcblx0XHRcdFx0c2NyaXB0RXJyb3I6IGludGVncmF0aW9uLnNjcmlwdEVycm9yLFxuXHRcdFx0XHR0cmlnZ2VyV29yZHM6IGludGVncmF0aW9uLnRyaWdnZXJXb3Jkcyxcblx0XHRcdFx0cmV0cnlGYWlsZWRDYWxsczogaW50ZWdyYXRpb24ucmV0cnlGYWlsZWRDYWxscyxcblx0XHRcdFx0cmV0cnlDb3VudDogaW50ZWdyYXRpb24ucmV0cnlDb3VudCxcblx0XHRcdFx0cmV0cnlEZWxheTogaW50ZWdyYXRpb24ucmV0cnlEZWxheSxcblx0XHRcdFx0dHJpZ2dlcldvcmRBbnl3aGVyZTogaW50ZWdyYXRpb24udHJpZ2dlcldvcmRBbnl3aGVyZSxcblx0XHRcdFx0cnVuT25FZGl0czogaW50ZWdyYXRpb24ucnVuT25FZGl0cyxcblx0XHRcdFx0X3VwZGF0ZWRBdDogbmV3IERhdGUoKSxcblx0XHRcdFx0X3VwZGF0ZWRCeTogUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZE9uZSh0aGlzLnVzZXJJZCwge2ZpZWxkczoge3VzZXJuYW1lOiAxfX0pXG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5tb2RlbHMuSW50ZWdyYXRpb25zLmZpbmRPbmUoaW50ZWdyYXRpb25JZCk7XG5cdH1cbn0pO1xuIiwiTWV0ZW9yLm1ldGhvZHMoe1xuXHRyZXBsYXlPdXRnb2luZ0ludGVncmF0aW9uKHsgaW50ZWdyYXRpb25JZCwgaGlzdG9yeUlkIH0pIHtcblx0XHRsZXQgaW50ZWdyYXRpb247XG5cblx0XHRpZiAoUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKHRoaXMudXNlcklkLCAnbWFuYWdlLWludGVncmF0aW9ucycpIHx8IFJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih0aGlzLnVzZXJJZCwgJ21hbmFnZS1pbnRlZ3JhdGlvbnMnLCAnYm90JykpIHtcblx0XHRcdGludGVncmF0aW9uID0gUm9ja2V0Q2hhdC5tb2RlbHMuSW50ZWdyYXRpb25zLmZpbmRPbmUoaW50ZWdyYXRpb25JZCk7XG5cdFx0fSBlbHNlIGlmIChSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odGhpcy51c2VySWQsICdtYW5hZ2Utb3duLWludGVncmF0aW9ucycpIHx8IFJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih0aGlzLnVzZXJJZCwgJ21hbmFnZS1vd24taW50ZWdyYXRpb25zJywgJ2JvdCcpKSB7XG5cdFx0XHRpbnRlZ3JhdGlvbiA9IFJvY2tldENoYXQubW9kZWxzLkludGVncmF0aW9ucy5maW5kT25lKGludGVncmF0aW9uSWQsIHsgZmllbGRzOiB7ICdfY3JlYXRlZEJ5Ll9pZCc6IHRoaXMudXNlcklkIH19KTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignbm90X2F1dGhvcml6ZWQnLCAnVW5hdXRob3JpemVkJywgeyBtZXRob2Q6ICdyZXBsYXlPdXRnb2luZ0ludGVncmF0aW9uJyB9KTtcblx0XHR9XG5cblx0XHRpZiAoIWludGVncmF0aW9uKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLWludGVncmF0aW9uJywgJ0ludmFsaWQgaW50ZWdyYXRpb24nLCB7IG1ldGhvZDogJ3JlcGxheU91dGdvaW5nSW50ZWdyYXRpb24nIH0pO1xuXHRcdH1cblxuXHRcdGNvbnN0IGhpc3RvcnkgPSBSb2NrZXRDaGF0Lm1vZGVscy5JbnRlZ3JhdGlvbkhpc3RvcnkuZmluZE9uZUJ5SW50ZWdyYXRpb25JZEFuZEhpc3RvcnlJZChpbnRlZ3JhdGlvbi5faWQsIGhpc3RvcnlJZCk7XG5cblx0XHRpZiAoIWhpc3RvcnkpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWludmFsaWQtaW50ZWdyYXRpb24taGlzdG9yeScsICdJbnZhbGlkIEludGVncmF0aW9uIEhpc3RvcnknLCB7IG1ldGhvZDogJ3JlcGxheU91dGdvaW5nSW50ZWdyYXRpb24nIH0pO1xuXHRcdH1cblxuXHRcdFJvY2tldENoYXQuaW50ZWdyYXRpb25zLnRyaWdnZXJIYW5kbGVyLnJlcGxheShpbnRlZ3JhdGlvbiwgaGlzdG9yeSk7XG5cblx0XHRyZXR1cm4gdHJ1ZTtcblx0fVxufSk7XG4iLCJNZXRlb3IubWV0aG9kcyh7XG5cdGRlbGV0ZU91dGdvaW5nSW50ZWdyYXRpb24oaW50ZWdyYXRpb25JZCkge1xuXHRcdGxldCBpbnRlZ3JhdGlvbjtcblxuXHRcdGlmIChSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odGhpcy51c2VySWQsICdtYW5hZ2UtaW50ZWdyYXRpb25zJykgfHwgUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKHRoaXMudXNlcklkLCAnbWFuYWdlLWludGVncmF0aW9ucycsICdib3QnKSkge1xuXHRcdFx0aW50ZWdyYXRpb24gPSBSb2NrZXRDaGF0Lm1vZGVscy5JbnRlZ3JhdGlvbnMuZmluZE9uZShpbnRlZ3JhdGlvbklkKTtcblx0XHR9IGVsc2UgaWYgKFJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih0aGlzLnVzZXJJZCwgJ21hbmFnZS1vd24taW50ZWdyYXRpb25zJykgfHwgUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKHRoaXMudXNlcklkLCAnbWFuYWdlLW93bi1pbnRlZ3JhdGlvbnMnLCAnYm90JykpIHtcblx0XHRcdGludGVncmF0aW9uID0gUm9ja2V0Q2hhdC5tb2RlbHMuSW50ZWdyYXRpb25zLmZpbmRPbmUoaW50ZWdyYXRpb25JZCwgeyBmaWVsZHM6IHsgJ19jcmVhdGVkQnkuX2lkJzogdGhpcy51c2VySWQgfX0pO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdub3RfYXV0aG9yaXplZCcsICdVbmF1dGhvcml6ZWQnLCB7IG1ldGhvZDogJ2RlbGV0ZU91dGdvaW5nSW50ZWdyYXRpb24nIH0pO1xuXHRcdH1cblxuXHRcdGlmICghaW50ZWdyYXRpb24pIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWludmFsaWQtaW50ZWdyYXRpb24nLCAnSW52YWxpZCBpbnRlZ3JhdGlvbicsIHsgbWV0aG9kOiAnZGVsZXRlT3V0Z29pbmdJbnRlZ3JhdGlvbicgfSk7XG5cdFx0fVxuXG5cdFx0Um9ja2V0Q2hhdC5tb2RlbHMuSW50ZWdyYXRpb25zLnJlbW92ZSh7IF9pZDogaW50ZWdyYXRpb25JZCB9KTtcblx0XHRSb2NrZXRDaGF0Lm1vZGVscy5JbnRlZ3JhdGlvbkhpc3RvcnkucmVtb3ZlQnlJbnRlZ3JhdGlvbklkKGludGVncmF0aW9uSWQpO1xuXG5cdFx0cmV0dXJuIHRydWU7XG5cdH1cbn0pO1xuIiwiTWV0ZW9yLm1ldGhvZHMoe1xuXHRjbGVhckludGVncmF0aW9uSGlzdG9yeShpbnRlZ3JhdGlvbklkKSB7XG5cdFx0bGV0IGludGVncmF0aW9uO1xuXG5cdFx0aWYgKFJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih0aGlzLnVzZXJJZCwgJ21hbmFnZS1pbnRlZ3JhdGlvbnMnKSB8fCBSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odGhpcy51c2VySWQsICdtYW5hZ2UtaW50ZWdyYXRpb25zJywgJ2JvdCcpKSB7XG5cdFx0XHRpbnRlZ3JhdGlvbiA9IFJvY2tldENoYXQubW9kZWxzLkludGVncmF0aW9ucy5maW5kT25lKGludGVncmF0aW9uSWQpO1xuXHRcdH0gZWxzZSBpZiAoUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKHRoaXMudXNlcklkLCAnbWFuYWdlLW93bi1pbnRlZ3JhdGlvbnMnKSB8fCBSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odGhpcy51c2VySWQsICdtYW5hZ2Utb3duLWludGVncmF0aW9ucycsICdib3QnKSkge1xuXHRcdFx0aW50ZWdyYXRpb24gPSBSb2NrZXRDaGF0Lm1vZGVscy5JbnRlZ3JhdGlvbnMuZmluZE9uZShpbnRlZ3JhdGlvbklkLCB7IGZpZWxkczogeyAnX2NyZWF0ZWRCeS5faWQnOiB0aGlzLnVzZXJJZCB9fSk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ25vdF9hdXRob3JpemVkJywgJ1VuYXV0aG9yaXplZCcsIHsgbWV0aG9kOiAnY2xlYXJJbnRlZ3JhdGlvbkhpc3RvcnknIH0pO1xuXHRcdH1cblxuXHRcdGlmICghaW50ZWdyYXRpb24pIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWludmFsaWQtaW50ZWdyYXRpb24nLCAnSW52YWxpZCBpbnRlZ3JhdGlvbicsIHsgbWV0aG9kOiAnY2xlYXJJbnRlZ3JhdGlvbkhpc3RvcnknIH0pO1xuXHRcdH1cblxuXHRcdFJvY2tldENoYXQubW9kZWxzLkludGVncmF0aW9uSGlzdG9yeS5yZW1vdmVCeUludGVncmF0aW9uSWQoaW50ZWdyYXRpb25JZCk7XG5cblx0XHRyZXR1cm4gdHJ1ZTtcblx0fVxufSk7XG4iLCIvKiBnbG9iYWxzIE1ldGVvciBSZXN0aXZ1cyBsb2dnZXIgcHJvY2Vzc1dlYmhvb2tNZXNzYWdlKi9cbi8vIFRPRE86IHJlbW92ZSBnbG9iYWxzXG5cbmltcG9ydCBfIGZyb20gJ3VuZGVyc2NvcmUnO1xuaW1wb3J0IHMgZnJvbSAndW5kZXJzY29yZS5zdHJpbmcnO1xuaW1wb3J0IHZtIGZyb20gJ3ZtJztcbmltcG9ydCBtb21lbnQgZnJvbSAnbW9tZW50JztcblxuY29uc3QgQXBpID0gbmV3IFJlc3RpdnVzKHtcblx0ZW5hYmxlQ29yczogdHJ1ZSxcblx0YXBpUGF0aDogJ2hvb2tzLycsXG5cdGF1dGg6IHtcblx0XHR1c2VyKCkge1xuXHRcdFx0Y29uc3QgcGF5bG9hZEtleXMgPSBPYmplY3Qua2V5cyh0aGlzLmJvZHlQYXJhbXMpO1xuXHRcdFx0Y29uc3QgcGF5bG9hZElzV3JhcHBlZCA9ICh0aGlzLmJvZHlQYXJhbXMgJiYgdGhpcy5ib2R5UGFyYW1zLnBheWxvYWQpICYmIHBheWxvYWRLZXlzLmxlbmd0aCA9PT0gMTtcblx0XHRcdGlmIChwYXlsb2FkSXNXcmFwcGVkICYmIHRoaXMucmVxdWVzdC5oZWFkZXJzWydjb250ZW50LXR5cGUnXSA9PT0gJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCcpIHtcblx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0XHR0aGlzLmJvZHlQYXJhbXMgPSBKU09OLnBhcnNlKHRoaXMuYm9keVBhcmFtcy5wYXlsb2FkKTtcblx0XHRcdFx0fSBjYXRjaCAoe21lc3NhZ2V9KSB7XG5cdFx0XHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0XHRcdGVycm9yOiB7XG5cdFx0XHRcdFx0XHRcdHN0YXR1c0NvZGU6IDQwMCxcblx0XHRcdFx0XHRcdFx0Ym9keToge1xuXHRcdFx0XHRcdFx0XHRcdHN1Y2Nlc3M6IGZhbHNlLFxuXHRcdFx0XHRcdFx0XHRcdGVycm9yOiBtZXNzYWdlXG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9O1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdHRoaXMuaW50ZWdyYXRpb24gPSBSb2NrZXRDaGF0Lm1vZGVscy5JbnRlZ3JhdGlvbnMuZmluZE9uZSh7XG5cdFx0XHRcdF9pZDogdGhpcy5yZXF1ZXN0LnBhcmFtcy5pbnRlZ3JhdGlvbklkLFxuXHRcdFx0XHR0b2tlbjogZGVjb2RlVVJJQ29tcG9uZW50KHRoaXMucmVxdWVzdC5wYXJhbXMudG9rZW4pXG5cdFx0XHR9KTtcblxuXHRcdFx0aWYgKCF0aGlzLmludGVncmF0aW9uKSB7XG5cdFx0XHRcdGxvZ2dlci5pbmNvbWluZy5pbmZvKCdJbnZhbGlkIGludGVncmF0aW9uIGlkJywgdGhpcy5yZXF1ZXN0LnBhcmFtcy5pbnRlZ3JhdGlvbklkLCAnb3IgdG9rZW4nLCB0aGlzLnJlcXVlc3QucGFyYW1zLnRva2VuKTtcblxuXHRcdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRcdGVycm9yOiB7XG5cdFx0XHRcdFx0XHRzdGF0dXNDb2RlOiA0MDQsXG5cdFx0XHRcdFx0XHRib2R5OiB7XG5cdFx0XHRcdFx0XHRcdHN1Y2Nlc3M6IGZhbHNlLFxuXHRcdFx0XHRcdFx0XHRlcnJvcjogJ0ludmFsaWQgaW50ZWdyYXRpb24gaWQgb3IgdG9rZW4gcHJvdmlkZWQuJ1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fTtcblx0XHRcdH1cblxuXHRcdFx0Y29uc3QgdXNlciA9IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmUoe1xuXHRcdFx0XHRfaWQ6IHRoaXMuaW50ZWdyYXRpb24udXNlcklkXG5cdFx0XHR9KTtcblxuXHRcdFx0cmV0dXJuIHsgdXNlciB9O1xuXHRcdH1cblx0fVxufSk7XG5cbmNvbnN0IGNvbXBpbGVkU2NyaXB0cyA9IHt9O1xuZnVuY3Rpb24gYnVpbGRTYW5kYm94KHN0b3JlID0ge30pIHtcblx0Y29uc3Qgc2FuZGJveCA9IHtcblx0XHRfLFxuXHRcdHMsXG5cdFx0Y29uc29sZSxcblx0XHRtb21lbnQsXG5cdFx0TGl2ZWNoYXQ6IFJvY2tldENoYXQuTGl2ZWNoYXQsXG5cdFx0U3RvcmU6IHtcblx0XHRcdHNldChrZXksIHZhbCkge1xuXHRcdFx0XHRyZXR1cm4gc3RvcmVba2V5XSA9IHZhbDtcblx0XHRcdH0sXG5cdFx0XHRnZXQoa2V5KSB7XG5cdFx0XHRcdHJldHVybiBzdG9yZVtrZXldO1xuXHRcdFx0fVxuXHRcdH0sXG5cdFx0SFRUUChtZXRob2QsIHVybCwgb3B0aW9ucykge1xuXHRcdFx0dHJ5IHtcblx0XHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0XHRyZXN1bHQ6IEhUVFAuY2FsbChtZXRob2QsIHVybCwgb3B0aW9ucylcblx0XHRcdFx0fTtcblx0XHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHRcdHJldHVybiB7XG5cdFx0XHRcdFx0ZXJyb3Jcblx0XHRcdFx0fTtcblx0XHRcdH1cblx0XHR9XG5cdH07XG5cblx0T2JqZWN0LmtleXMoUm9ja2V0Q2hhdC5tb2RlbHMpLmZpbHRlcigoaykgPT4gIWsuc3RhcnRzV2l0aCgnXycpKS5mb3JFYWNoKChrKSA9PiBzYW5kYm94W2tdID0gUm9ja2V0Q2hhdC5tb2RlbHNba10pO1xuXHRyZXR1cm4geyBzdG9yZSwgc2FuZGJveFx0fTtcbn1cblxuZnVuY3Rpb24gZ2V0SW50ZWdyYXRpb25TY3JpcHQoaW50ZWdyYXRpb24pIHtcblx0Y29uc3QgY29tcGlsZWRTY3JpcHQgPSBjb21waWxlZFNjcmlwdHNbaW50ZWdyYXRpb24uX2lkXTtcblx0aWYgKGNvbXBpbGVkU2NyaXB0ICYmICtjb21waWxlZFNjcmlwdC5fdXBkYXRlZEF0ID09PSAraW50ZWdyYXRpb24uX3VwZGF0ZWRBdCkge1xuXHRcdHJldHVybiBjb21waWxlZFNjcmlwdC5zY3JpcHQ7XG5cdH1cblxuXHRjb25zdCBzY3JpcHQgPSBpbnRlZ3JhdGlvbi5zY3JpcHRDb21waWxlZDtcblx0Y29uc3QgeyBzYW5kYm94LCBzdG9yZSB9ID0gYnVpbGRTYW5kYm94KCk7XG5cdHRyeSB7XG5cdFx0bG9nZ2VyLmluY29taW5nLmluZm8oJ1dpbGwgZXZhbHVhdGUgc2NyaXB0IG9mIFRyaWdnZXInLCBpbnRlZ3JhdGlvbi5uYW1lKTtcblx0XHRsb2dnZXIuaW5jb21pbmcuZGVidWcoc2NyaXB0KTtcblxuXHRcdGNvbnN0IHZtU2NyaXB0ID0gdm0uY3JlYXRlU2NyaXB0KHNjcmlwdCwgJ3NjcmlwdC5qcycpO1xuXHRcdHZtU2NyaXB0LnJ1bkluTmV3Q29udGV4dChzYW5kYm94KTtcblx0XHRpZiAoc2FuZGJveC5TY3JpcHQpIHtcblx0XHRcdGNvbXBpbGVkU2NyaXB0c1tpbnRlZ3JhdGlvbi5faWRdID0ge1xuXHRcdFx0XHRzY3JpcHQ6IG5ldyBzYW5kYm94LlNjcmlwdCgpLFxuXHRcdFx0XHRzdG9yZSxcblx0XHRcdFx0X3VwZGF0ZWRBdDogaW50ZWdyYXRpb24uX3VwZGF0ZWRBdFxuXHRcdFx0fTtcblxuXHRcdFx0cmV0dXJuIGNvbXBpbGVkU2NyaXB0c1tpbnRlZ3JhdGlvbi5faWRdLnNjcmlwdDtcblx0XHR9XG5cdH0gY2F0Y2ggKHsgc3RhY2sgfSkge1xuXHRcdGxvZ2dlci5pbmNvbWluZy5lcnJvcignW0Vycm9yIGV2YWx1YXRpbmcgU2NyaXB0IGluIFRyaWdnZXInLCBpbnRlZ3JhdGlvbi5uYW1lLCAnOl0nKTtcblx0XHRsb2dnZXIuaW5jb21pbmcuZXJyb3Ioc2NyaXB0LnJlcGxhY2UoL14vZ20sICcgICcpKTtcblx0XHRsb2dnZXIuaW5jb21pbmcuZXJyb3IoJ1tTdGFjazpdJyk7XG5cdFx0bG9nZ2VyLmluY29taW5nLmVycm9yKHN0YWNrLnJlcGxhY2UoL14vZ20sICcgICcpKTtcblx0XHR0aHJvdyBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCdlcnJvci1ldmFsdWF0aW5nLXNjcmlwdCcpO1xuXHR9XG5cblx0aWYgKCFzYW5kYm94LlNjcmlwdCkge1xuXHRcdGxvZ2dlci5pbmNvbWluZy5lcnJvcignW0NsYXNzIFwiU2NyaXB0XCIgbm90IGluIFRyaWdnZXInLCBpbnRlZ3JhdGlvbi5uYW1lLCAnXScpO1xuXHRcdHRocm93IFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoJ2NsYXNzLXNjcmlwdC1ub3QtZm91bmQnKTtcblx0fVxufVxuXG5mdW5jdGlvbiBjcmVhdGVJbnRlZ3JhdGlvbihvcHRpb25zLCB1c2VyKSB7XG5cdGxvZ2dlci5pbmNvbWluZy5pbmZvKCdBZGQgaW50ZWdyYXRpb24nLCBvcHRpb25zLm5hbWUpO1xuXHRsb2dnZXIuaW5jb21pbmcuZGVidWcob3B0aW9ucyk7XG5cblx0TWV0ZW9yLnJ1bkFzVXNlcih1c2VyLl9pZCwgZnVuY3Rpb24oKSB7XG5cdFx0c3dpdGNoIChvcHRpb25zWydldmVudCddKSB7XG5cdFx0XHRjYXNlICduZXdNZXNzYWdlT25DaGFubmVsJzpcblx0XHRcdFx0aWYgKG9wdGlvbnMuZGF0YSA9PSBudWxsKSB7XG5cdFx0XHRcdFx0b3B0aW9ucy5kYXRhID0ge307XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKChvcHRpb25zLmRhdGEuY2hhbm5lbF9uYW1lICE9IG51bGwpICYmIG9wdGlvbnMuZGF0YS5jaGFubmVsX25hbWUuaW5kZXhPZignIycpID09PSAtMSkge1xuXHRcdFx0XHRcdG9wdGlvbnMuZGF0YS5jaGFubmVsX25hbWUgPSBgIyR7IG9wdGlvbnMuZGF0YS5jaGFubmVsX25hbWUgfWA7XG5cdFx0XHRcdH1cblx0XHRcdFx0cmV0dXJuIE1ldGVvci5jYWxsKCdhZGRPdXRnb2luZ0ludGVncmF0aW9uJywge1xuXHRcdFx0XHRcdHVzZXJuYW1lOiAncm9ja2V0LmNhdCcsXG5cdFx0XHRcdFx0dXJsczogW29wdGlvbnMudGFyZ2V0X3VybF0sXG5cdFx0XHRcdFx0bmFtZTogb3B0aW9ucy5uYW1lLFxuXHRcdFx0XHRcdGNoYW5uZWw6IG9wdGlvbnMuZGF0YS5jaGFubmVsX25hbWUsXG5cdFx0XHRcdFx0dHJpZ2dlcldvcmRzOiBvcHRpb25zLmRhdGEudHJpZ2dlcl93b3Jkc1xuXHRcdFx0XHR9KTtcblx0XHRcdGNhc2UgJ25ld01lc3NhZ2VUb1VzZXInOlxuXHRcdFx0XHRpZiAob3B0aW9ucy5kYXRhLnVzZXJuYW1lLmluZGV4T2YoJ0AnKSA9PT0gLTEpIHtcblx0XHRcdFx0XHRvcHRpb25zLmRhdGEudXNlcm5hbWUgPSBgQCR7IG9wdGlvbnMuZGF0YS51c2VybmFtZSB9YDtcblx0XHRcdFx0fVxuXHRcdFx0XHRyZXR1cm4gTWV0ZW9yLmNhbGwoJ2FkZE91dGdvaW5nSW50ZWdyYXRpb24nLCB7XG5cdFx0XHRcdFx0dXNlcm5hbWU6ICdyb2NrZXQuY2F0Jyxcblx0XHRcdFx0XHR1cmxzOiBbb3B0aW9ucy50YXJnZXRfdXJsXSxcblx0XHRcdFx0XHRuYW1lOiBvcHRpb25zLm5hbWUsXG5cdFx0XHRcdFx0Y2hhbm5lbDogb3B0aW9ucy5kYXRhLnVzZXJuYW1lLFxuXHRcdFx0XHRcdHRyaWdnZXJXb3Jkczogb3B0aW9ucy5kYXRhLnRyaWdnZXJfd29yZHNcblx0XHRcdFx0fSk7XG5cdFx0fVxuXHR9KTtcblxuXHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2VzcygpO1xufVxuXG5mdW5jdGlvbiByZW1vdmVJbnRlZ3JhdGlvbihvcHRpb25zLCB1c2VyKSB7XG5cdGxvZ2dlci5pbmNvbWluZy5pbmZvKCdSZW1vdmUgaW50ZWdyYXRpb24nKTtcblx0bG9nZ2VyLmluY29taW5nLmRlYnVnKG9wdGlvbnMpO1xuXG5cdGNvbnN0IGludGVncmF0aW9uVG9SZW1vdmUgPSBSb2NrZXRDaGF0Lm1vZGVscy5JbnRlZ3JhdGlvbnMuZmluZE9uZSh7XG5cdFx0dXJsczogb3B0aW9ucy50YXJnZXRfdXJsXG5cdH0pO1xuXG5cdE1ldGVvci5ydW5Bc1VzZXIodXNlci5faWQsICgpID0+IHtcblx0XHRyZXR1cm4gTWV0ZW9yLmNhbGwoJ2RlbGV0ZU91dGdvaW5nSW50ZWdyYXRpb24nLCBpbnRlZ3JhdGlvblRvUmVtb3ZlLl9pZCk7XG5cdH0pO1xuXG5cdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKCk7XG59XG5cbmZ1bmN0aW9uIGV4ZWN1dGVJbnRlZ3JhdGlvblJlc3QoKSB7XG5cdGxvZ2dlci5pbmNvbWluZy5pbmZvKCdQb3N0IGludGVncmF0aW9uOicsIHRoaXMuaW50ZWdyYXRpb24ubmFtZSk7XG5cdGxvZ2dlci5pbmNvbWluZy5kZWJ1ZygnQHVybFBhcmFtczonLCB0aGlzLnVybFBhcmFtcyk7XG5cdGxvZ2dlci5pbmNvbWluZy5kZWJ1ZygnQGJvZHlQYXJhbXM6JywgdGhpcy5ib2R5UGFyYW1zKTtcblxuXHRpZiAodGhpcy5pbnRlZ3JhdGlvbi5lbmFibGVkICE9PSB0cnVlKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdHN0YXR1c0NvZGU6IDUwMyxcblx0XHRcdGJvZHk6ICdTZXJ2aWNlIFVuYXZhaWxhYmxlJ1xuXHRcdH07XG5cdH1cblxuXHRjb25zdCBkZWZhdWx0VmFsdWVzID0ge1xuXHRcdGNoYW5uZWw6IHRoaXMuaW50ZWdyYXRpb24uY2hhbm5lbCxcblx0XHRhbGlhczogdGhpcy5pbnRlZ3JhdGlvbi5hbGlhcyxcblx0XHRhdmF0YXI6IHRoaXMuaW50ZWdyYXRpb24uYXZhdGFyLFxuXHRcdGVtb2ppOiB0aGlzLmludGVncmF0aW9uLmVtb2ppXG5cdH07XG5cblx0aWYgKHRoaXMuaW50ZWdyYXRpb24uc2NyaXB0RW5hYmxlZCAmJiB0aGlzLmludGVncmF0aW9uLnNjcmlwdENvbXBpbGVkICYmIHRoaXMuaW50ZWdyYXRpb24uc2NyaXB0Q29tcGlsZWQudHJpbSgpICE9PSAnJykge1xuXHRcdGxldCBzY3JpcHQ7XG5cdFx0dHJ5IHtcblx0XHRcdHNjcmlwdCA9IGdldEludGVncmF0aW9uU2NyaXB0KHRoaXMuaW50ZWdyYXRpb24pO1xuXHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdGxvZ2dlci5pbmNvbWluZy53YXJuKGUpO1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoZS5tZXNzYWdlKTtcblx0XHR9XG5cblx0XHR0aGlzLnJlcXVlc3Quc2V0RW5jb2RpbmcoJ3V0ZjgnKTtcblx0XHRjb25zdCBjb250ZW50X3JhdyA9IHRoaXMucmVxdWVzdC5yZWFkKCk7XG5cblx0XHRjb25zdCByZXF1ZXN0ID0ge1xuXHRcdFx0dXJsOiB7XG5cdFx0XHRcdGhhc2g6IHRoaXMucmVxdWVzdC5fcGFyc2VkVXJsLmhhc2gsXG5cdFx0XHRcdHNlYXJjaDogdGhpcy5yZXF1ZXN0Ll9wYXJzZWRVcmwuc2VhcmNoLFxuXHRcdFx0XHRxdWVyeTogdGhpcy5xdWVyeVBhcmFtcyxcblx0XHRcdFx0cGF0aG5hbWU6IHRoaXMucmVxdWVzdC5fcGFyc2VkVXJsLnBhdGhuYW1lLFxuXHRcdFx0XHRwYXRoOiB0aGlzLnJlcXVlc3QuX3BhcnNlZFVybC5wYXRoXG5cdFx0XHR9LFxuXHRcdFx0dXJsX3JhdzogdGhpcy5yZXF1ZXN0LnVybCxcblx0XHRcdHVybF9wYXJhbXM6IHRoaXMudXJsUGFyYW1zLFxuXHRcdFx0Y29udGVudDogdGhpcy5ib2R5UGFyYW1zLFxuXHRcdFx0Y29udGVudF9yYXcsXG5cdFx0XHRoZWFkZXJzOiB0aGlzLnJlcXVlc3QuaGVhZGVycyxcblx0XHRcdGJvZHk6IHRoaXMucmVxdWVzdC5ib2R5LFxuXHRcdFx0dXNlcjoge1xuXHRcdFx0XHRfaWQ6IHRoaXMudXNlci5faWQsXG5cdFx0XHRcdG5hbWU6IHRoaXMudXNlci5uYW1lLFxuXHRcdFx0XHR1c2VybmFtZTogdGhpcy51c2VyLnVzZXJuYW1lXG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdHRyeSB7XG5cdFx0XHRjb25zdCB7IHNhbmRib3ggfSA9IGJ1aWxkU2FuZGJveChjb21waWxlZFNjcmlwdHNbdGhpcy5pbnRlZ3JhdGlvbi5faWRdLnN0b3JlKTtcblx0XHRcdHNhbmRib3guc2NyaXB0ID0gc2NyaXB0O1xuXHRcdFx0c2FuZGJveC5yZXF1ZXN0ID0gcmVxdWVzdDtcblxuXHRcdFx0Y29uc3QgcmVzdWx0ID0gdm0ucnVuSW5OZXdDb250ZXh0KCdzY3JpcHQucHJvY2Vzc19pbmNvbWluZ19yZXF1ZXN0KHsgcmVxdWVzdDogcmVxdWVzdCB9KScsIHNhbmRib3gsIHtcblx0XHRcdFx0dGltZW91dDogMzAwMFxuXHRcdFx0fSk7XG5cblx0XHRcdGlmICghcmVzdWx0KSB7XG5cdFx0XHRcdGxvZ2dlci5pbmNvbWluZy5kZWJ1ZygnW1Byb2Nlc3MgSW5jb21pbmcgUmVxdWVzdCByZXN1bHQgb2YgVHJpZ2dlcicsIHRoaXMuaW50ZWdyYXRpb24ubmFtZSwgJzpdIE5vIGRhdGEnKTtcblx0XHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoKTtcblx0XHRcdH0gZWxzZSBpZiAocmVzdWx0ICYmIHJlc3VsdC5lcnJvcikge1xuXHRcdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZShyZXN1bHQuZXJyb3IpO1xuXHRcdFx0fVxuXG5cdFx0XHR0aGlzLmJvZHlQYXJhbXMgPSByZXN1bHQgJiYgcmVzdWx0LmNvbnRlbnQ7XG5cdFx0XHR0aGlzLnNjcmlwdFJlc3BvbnNlID0gcmVzdWx0LnJlc3BvbnNlO1xuXHRcdFx0aWYgKHJlc3VsdC51c2VyKSB7XG5cdFx0XHRcdHRoaXMudXNlciA9IHJlc3VsdC51c2VyO1xuXHRcdFx0fVxuXG5cdFx0XHRsb2dnZXIuaW5jb21pbmcuZGVidWcoJ1tQcm9jZXNzIEluY29taW5nIFJlcXVlc3QgcmVzdWx0IG9mIFRyaWdnZXInLCB0aGlzLmludGVncmF0aW9uLm5hbWUsICc6XScpO1xuXHRcdFx0bG9nZ2VyLmluY29taW5nLmRlYnVnKCdyZXN1bHQnLCB0aGlzLmJvZHlQYXJhbXMpO1xuXHRcdH0gY2F0Y2ggKHtzdGFja30pIHtcblx0XHRcdGxvZ2dlci5pbmNvbWluZy5lcnJvcignW0Vycm9yIHJ1bm5pbmcgU2NyaXB0IGluIFRyaWdnZXInLCB0aGlzLmludGVncmF0aW9uLm5hbWUsICc6XScpO1xuXHRcdFx0bG9nZ2VyLmluY29taW5nLmVycm9yKHRoaXMuaW50ZWdyYXRpb24uc2NyaXB0Q29tcGlsZWQucmVwbGFjZSgvXi9nbSwgJyAgJykpO1xuXHRcdFx0bG9nZ2VyLmluY29taW5nLmVycm9yKCdbU3RhY2s6XScpO1xuXHRcdFx0bG9nZ2VyLmluY29taW5nLmVycm9yKHN0YWNrLnJlcGxhY2UoL14vZ20sICcgICcpKTtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCdlcnJvci1ydW5uaW5nLXNjcmlwdCcpO1xuXHRcdH1cblx0fVxuXG5cdC8vIFRPRE86IFR1cm4gdGhpcyBpbnRvIGFuIG9wdGlvbiBvbiB0aGUgaW50ZWdyYXRpb25zIC0gbm8gYm9keSBtZWFucyBhIHN1Y2Nlc3Ncblx0Ly8gVE9ETzogVGVtcG9yYXJ5IGZpeCBmb3IgaHR0cHM6Ly9naXRodWIuY29tL1JvY2tldENoYXQvUm9ja2V0LkNoYXQvaXNzdWVzLzc3NzAgdW50aWwgdGhlIGFib3ZlIGlzIGltcGxlbWVudGVkXG5cdGlmICghdGhpcy5ib2R5UGFyYW1zIHx8IChfLmlzRW1wdHkodGhpcy5ib2R5UGFyYW1zKSAmJiAhdGhpcy5pbnRlZ3JhdGlvbi5zY3JpcHRFbmFibGVkKSkge1xuXHRcdC8vIHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCdib2R5LWVtcHR5Jyk7XG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoKTtcblx0fVxuXG5cdHRoaXMuYm9keVBhcmFtcy5ib3QgPSB7IGk6IHRoaXMuaW50ZWdyYXRpb24uX2lkIH07XG5cblx0dHJ5IHtcblx0XHRjb25zdCBtZXNzYWdlID0gcHJvY2Vzc1dlYmhvb2tNZXNzYWdlKHRoaXMuYm9keVBhcmFtcywgdGhpcy51c2VyLCBkZWZhdWx0VmFsdWVzKTtcblx0XHRpZiAoXy5pc0VtcHR5KG1lc3NhZ2UpKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgndW5rbm93bi1lcnJvcicpO1xuXHRcdH1cblxuXHRcdGlmICh0aGlzLnNjcmlwdFJlc3BvbnNlKSB7XG5cdFx0XHRsb2dnZXIuaW5jb21pbmcuZGVidWcoJ3Jlc3BvbnNlJywgdGhpcy5zY3JpcHRSZXNwb25zZSk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3ModGhpcy5zY3JpcHRSZXNwb25zZSk7XG5cdH0gY2F0Y2ggKHsgZXJyb3IsIG1lc3NhZ2UgfSkge1xuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKGVycm9yIHx8IG1lc3NhZ2UpO1xuXHR9XG59XG5cbmZ1bmN0aW9uIGFkZEludGVncmF0aW9uUmVzdCgpIHtcblx0cmV0dXJuIGNyZWF0ZUludGVncmF0aW9uKHRoaXMuYm9keVBhcmFtcywgdGhpcy51c2VyKTtcbn1cblxuZnVuY3Rpb24gcmVtb3ZlSW50ZWdyYXRpb25SZXN0KCkge1xuXHRyZXR1cm4gcmVtb3ZlSW50ZWdyYXRpb24odGhpcy5ib2R5UGFyYW1zLCB0aGlzLnVzZXIpO1xufVxuXG5mdW5jdGlvbiBpbnRlZ3JhdGlvblNhbXBsZVJlc3QoKSB7XG5cdGxvZ2dlci5pbmNvbWluZy5pbmZvKCdTYW1wbGUgSW50ZWdyYXRpb24nKTtcblx0cmV0dXJuIHtcblx0XHRzdGF0dXNDb2RlOiAyMDAsXG5cdFx0Ym9keTogW1xuXHRcdFx0e1xuXHRcdFx0XHR0b2tlbjogUmFuZG9tLmlkKDI0KSxcblx0XHRcdFx0Y2hhbm5lbF9pZDogUmFuZG9tLmlkKCksXG5cdFx0XHRcdGNoYW5uZWxfbmFtZTogJ2dlbmVyYWwnLFxuXHRcdFx0XHR0aW1lc3RhbXA6IG5ldyBEYXRlLFxuXHRcdFx0XHR1c2VyX2lkOiBSYW5kb20uaWQoKSxcblx0XHRcdFx0dXNlcl9uYW1lOiAncm9ja2V0LmNhdCcsXG5cdFx0XHRcdHRleHQ6ICdTYW1wbGUgdGV4dCAxJyxcblx0XHRcdFx0dHJpZ2dlcl93b3JkOiAnU2FtcGxlJ1xuXHRcdFx0fSwge1xuXHRcdFx0XHR0b2tlbjogUmFuZG9tLmlkKDI0KSxcblx0XHRcdFx0Y2hhbm5lbF9pZDogUmFuZG9tLmlkKCksXG5cdFx0XHRcdGNoYW5uZWxfbmFtZTogJ2dlbmVyYWwnLFxuXHRcdFx0XHR0aW1lc3RhbXA6IG5ldyBEYXRlLFxuXHRcdFx0XHR1c2VyX2lkOiBSYW5kb20uaWQoKSxcblx0XHRcdFx0dXNlcl9uYW1lOiAncm9ja2V0LmNhdCcsXG5cdFx0XHRcdHRleHQ6ICdTYW1wbGUgdGV4dCAyJyxcblx0XHRcdFx0dHJpZ2dlcl93b3JkOiAnU2FtcGxlJ1xuXHRcdFx0fSwge1xuXHRcdFx0XHR0b2tlbjogUmFuZG9tLmlkKDI0KSxcblx0XHRcdFx0Y2hhbm5lbF9pZDogUmFuZG9tLmlkKCksXG5cdFx0XHRcdGNoYW5uZWxfbmFtZTogJ2dlbmVyYWwnLFxuXHRcdFx0XHR0aW1lc3RhbXA6IG5ldyBEYXRlLFxuXHRcdFx0XHR1c2VyX2lkOiBSYW5kb20uaWQoKSxcblx0XHRcdFx0dXNlcl9uYW1lOiAncm9ja2V0LmNhdCcsXG5cdFx0XHRcdHRleHQ6ICdTYW1wbGUgdGV4dCAzJyxcblx0XHRcdFx0dHJpZ2dlcl93b3JkOiAnU2FtcGxlJ1xuXHRcdFx0fVxuXHRcdF1cblx0fTtcbn1cblxuZnVuY3Rpb24gaW50ZWdyYXRpb25JbmZvUmVzdCgpIHtcblx0bG9nZ2VyLmluY29taW5nLmluZm8oJ0luZm8gaW50ZWdyYXRpb24nKTtcblx0cmV0dXJuIHtcblx0XHRzdGF0dXNDb2RlOiAyMDAsXG5cdFx0Ym9keToge1xuXHRcdFx0c3VjY2VzczogdHJ1ZVxuXHRcdH1cblx0fTtcbn1cblxuQXBpLmFkZFJvdXRlKCc6aW50ZWdyYXRpb25JZC86dXNlcklkLzp0b2tlbicsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdDogZXhlY3V0ZUludGVncmF0aW9uUmVzdCxcblx0Z2V0OiBleGVjdXRlSW50ZWdyYXRpb25SZXN0XG59KTtcblxuQXBpLmFkZFJvdXRlKCc6aW50ZWdyYXRpb25JZC86dG9rZW4nLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdHBvc3Q6IGV4ZWN1dGVJbnRlZ3JhdGlvblJlc3QsXG5cdGdldDogZXhlY3V0ZUludGVncmF0aW9uUmVzdFxufSk7XG5cbkFwaS5hZGRSb3V0ZSgnc2FtcGxlLzppbnRlZ3JhdGlvbklkLzp1c2VySWQvOnRva2VuJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRnZXQ6IGludGVncmF0aW9uU2FtcGxlUmVzdFxufSk7XG5cbkFwaS5hZGRSb3V0ZSgnc2FtcGxlLzppbnRlZ3JhdGlvbklkLzp0b2tlbicsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0Z2V0OiBpbnRlZ3JhdGlvblNhbXBsZVJlc3Rcbn0pO1xuXG5BcGkuYWRkUm91dGUoJ2luZm8vOmludGVncmF0aW9uSWQvOnVzZXJJZC86dG9rZW4nLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdGdldDogaW50ZWdyYXRpb25JbmZvUmVzdFxufSk7XG5cbkFwaS5hZGRSb3V0ZSgnaW5mby86aW50ZWdyYXRpb25JZC86dG9rZW4nLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdGdldDogaW50ZWdyYXRpb25JbmZvUmVzdFxufSk7XG5cbkFwaS5hZGRSb3V0ZSgnYWRkLzppbnRlZ3JhdGlvbklkLzp1c2VySWQvOnRva2VuJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRwb3N0OiBhZGRJbnRlZ3JhdGlvblJlc3Rcbn0pO1xuXG5BcGkuYWRkUm91dGUoJ2FkZC86aW50ZWdyYXRpb25JZC86dG9rZW4nLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdHBvc3Q6IGFkZEludGVncmF0aW9uUmVzdFxufSk7XG5cbkFwaS5hZGRSb3V0ZSgncmVtb3ZlLzppbnRlZ3JhdGlvbklkLzp1c2VySWQvOnRva2VuJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRwb3N0OiByZW1vdmVJbnRlZ3JhdGlvblJlc3Rcbn0pO1xuXG5BcGkuYWRkUm91dGUoJ3JlbW92ZS86aW50ZWdyYXRpb25JZC86dG9rZW4nLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdHBvc3Q6IHJlbW92ZUludGVncmF0aW9uUmVzdFxufSk7XG4iLCJjb25zdCBjYWxsYmFja0hhbmRsZXIgPSBmdW5jdGlvbiBfY2FsbGJhY2tIYW5kbGVyKGV2ZW50VHlwZSkge1xuXHRyZXR1cm4gZnVuY3Rpb24gX3dyYXBwZXJGdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5pbnRlZ3JhdGlvbnMudHJpZ2dlckhhbmRsZXIuZXhlY3V0ZVRyaWdnZXJzKGV2ZW50VHlwZSwgLi4uYXJndW1lbnRzKTtcblx0fTtcbn07XG5cblJvY2tldENoYXQuY2FsbGJhY2tzLmFkZCgnYWZ0ZXJTYXZlTWVzc2FnZScsIGNhbGxiYWNrSGFuZGxlcignc2VuZE1lc3NhZ2UnKSwgUm9ja2V0Q2hhdC5jYWxsYmFja3MucHJpb3JpdHkuTE9XKTtcblJvY2tldENoYXQuY2FsbGJhY2tzLmFkZCgnYWZ0ZXJDcmVhdGVDaGFubmVsJywgY2FsbGJhY2tIYW5kbGVyKCdyb29tQ3JlYXRlZCcpLCBSb2NrZXRDaGF0LmNhbGxiYWNrcy5wcmlvcml0eS5MT1cpO1xuUm9ja2V0Q2hhdC5jYWxsYmFja3MuYWRkKCdhZnRlckNyZWF0ZVByaXZhdGVHcm91cCcsIGNhbGxiYWNrSGFuZGxlcigncm9vbUNyZWF0ZWQnKSwgUm9ja2V0Q2hhdC5jYWxsYmFja3MucHJpb3JpdHkuTE9XKTtcblJvY2tldENoYXQuY2FsbGJhY2tzLmFkZCgnYWZ0ZXJDcmVhdGVVc2VyJywgY2FsbGJhY2tIYW5kbGVyKCd1c2VyQ3JlYXRlZCcpLCBSb2NrZXRDaGF0LmNhbGxiYWNrcy5wcmlvcml0eS5MT1cpO1xuUm9ja2V0Q2hhdC5jYWxsYmFja3MuYWRkKCdhZnRlckpvaW5Sb29tJywgY2FsbGJhY2tIYW5kbGVyKCdyb29tSm9pbmVkJyksIFJvY2tldENoYXQuY2FsbGJhY2tzLnByaW9yaXR5LkxPVyk7XG5Sb2NrZXRDaGF0LmNhbGxiYWNrcy5hZGQoJ2FmdGVyTGVhdmVSb29tJywgY2FsbGJhY2tIYW5kbGVyKCdyb29tTGVmdCcpLCBSb2NrZXRDaGF0LmNhbGxiYWNrcy5wcmlvcml0eS5MT1cpO1xuUm9ja2V0Q2hhdC5jYWxsYmFja3MuYWRkKCdhZnRlclJvb21BcmNoaXZlZCcsIGNhbGxiYWNrSGFuZGxlcigncm9vbUFyY2hpdmVkJyksIFJvY2tldENoYXQuY2FsbGJhY2tzLnByaW9yaXR5LkxPVyk7XG5Sb2NrZXRDaGF0LmNhbGxiYWNrcy5hZGQoJ2FmdGVyRmlsZVVwbG9hZCcsIGNhbGxiYWNrSGFuZGxlcignZmlsZVVwbG9hZGVkJyksIFJvY2tldENoYXQuY2FsbGJhY2tzLnByaW9yaXR5LkxPVyk7XG4iLCJpbXBvcnQgXyBmcm9tICd1bmRlcnNjb3JlJztcbmltcG9ydCBzIGZyb20gJ3VuZGVyc2NvcmUuc3RyaW5nJztcblxudGhpcy5wcm9jZXNzV2ViaG9va01lc3NhZ2UgPSBmdW5jdGlvbihtZXNzYWdlT2JqLCB1c2VyLCBkZWZhdWx0VmFsdWVzID0geyBjaGFubmVsOiAnJywgYWxpYXM6ICcnLCBhdmF0YXI6ICcnLCBlbW9qaTogJycgfSwgbXVzdEJlSm9pbmVkID0gZmFsc2UpIHtcblx0Y29uc3Qgc2VudERhdGEgPSBbXTtcblx0Y29uc3QgY2hhbm5lbHMgPSBbXS5jb25jYXQobWVzc2FnZU9iai5jaGFubmVsIHx8IG1lc3NhZ2VPYmoucm9vbUlkIHx8IGRlZmF1bHRWYWx1ZXMuY2hhbm5lbCk7XG5cblx0Zm9yIChjb25zdCBjaGFubmVsIG9mIGNoYW5uZWxzKSB7XG5cdFx0Y29uc3QgY2hhbm5lbFR5cGUgPSBjaGFubmVsWzBdO1xuXG5cdFx0bGV0IGNoYW5uZWxWYWx1ZSA9IGNoYW5uZWwuc3Vic3RyKDEpO1xuXHRcdGxldCByb29tO1xuXG5cdFx0c3dpdGNoIChjaGFubmVsVHlwZSkge1xuXHRcdFx0Y2FzZSAnIyc6XG5cdFx0XHRcdHJvb20gPSBSb2NrZXRDaGF0LmdldFJvb21CeU5hbWVPcklkV2l0aE9wdGlvblRvSm9pbih7IGN1cnJlbnRVc2VySWQ6IHVzZXIuX2lkLCBuYW1lT3JJZDogY2hhbm5lbFZhbHVlLCBqb2luQ2hhbm5lbDogdHJ1ZSB9KTtcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHRjYXNlICdAJzpcblx0XHRcdFx0cm9vbSA9IFJvY2tldENoYXQuZ2V0Um9vbUJ5TmFtZU9ySWRXaXRoT3B0aW9uVG9Kb2luKHsgY3VycmVudFVzZXJJZDogdXNlci5faWQsIG5hbWVPcklkOiBjaGFubmVsVmFsdWUsIHR5cGU6ICdkJyB9KTtcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHRkZWZhdWx0OlxuXHRcdFx0XHRjaGFubmVsVmFsdWUgPSBjaGFubmVsVHlwZSArIGNoYW5uZWxWYWx1ZTtcblxuXHRcdFx0XHQvL1RyeSB0byBmaW5kIHRoZSByb29tIGJ5IGlkIG9yIG5hbWUgaWYgdGhleSBkaWRuJ3QgaW5jbHVkZSB0aGUgcHJlZml4LlxuXHRcdFx0XHRyb29tID0gUm9ja2V0Q2hhdC5nZXRSb29tQnlOYW1lT3JJZFdpdGhPcHRpb25Ub0pvaW4oeyBjdXJyZW50VXNlcklkOiB1c2VyLl9pZCwgbmFtZU9ySWQ6IGNoYW5uZWxWYWx1ZSwgam9pbkNoYW5uZWw6IHRydWUsIGVycm9yT25FbXB0eTogZmFsc2UgfSk7XG5cdFx0XHRcdGlmIChyb29tKSB7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvL1dlIGRpZG4ndCBnZXQgYSByb29tLCBsZXQncyB0cnkgZmluZGluZyBkaXJlY3QgbWVzc2FnZXNcblx0XHRcdFx0cm9vbSA9IFJvY2tldENoYXQuZ2V0Um9vbUJ5TmFtZU9ySWRXaXRoT3B0aW9uVG9Kb2luKHsgY3VycmVudFVzZXJJZDogdXNlci5faWQsIG5hbWVPcklkOiBjaGFubmVsVmFsdWUsIHR5cGU6ICdkJywgdHJ5RGlyZWN0QnlVc2VySWRPbmx5OiB0cnVlIH0pO1xuXHRcdFx0XHRpZiAocm9vbSkge1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly9ObyByb29tLCBzbyB0aHJvdyBhbiBlcnJvclxuXHRcdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdpbnZhbGlkLWNoYW5uZWwnKTtcblx0XHR9XG5cblx0XHRpZiAobXVzdEJlSm9pbmVkICYmICFyb29tLnVzZXJuYW1lcy5pbmNsdWRlcyh1c2VyLnVzZXJuYW1lKSkge1xuXHRcdFx0Ly8gdGhyb3cgbmV3IE1ldGVvci5FcnJvcignaW52YWxpZC1yb29tJywgJ0ludmFsaWQgcm9vbSBwcm92aWRlZCB0byBzZW5kIGEgbWVzc2FnZSB0bywgbXVzdCBiZSBqb2luZWQuJyk7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdpbnZhbGlkLWNoYW5uZWwnKTsgLy8gVGhyb3dpbmcgdGhlIGdlbmVyaWMgb25lIHNvIHBlb3BsZSBjYW4ndCBcImJydXRlIGZvcmNlXCIgZmluZCByb29tc1xuXHRcdH1cblxuXHRcdGlmIChtZXNzYWdlT2JqLmF0dGFjaG1lbnRzICYmICFfLmlzQXJyYXkobWVzc2FnZU9iai5hdHRhY2htZW50cykpIHtcblx0XHRcdGNvbnNvbGUubG9nKCdBdHRhY2htZW50cyBzaG91bGQgYmUgQXJyYXksIGlnbm9yaW5nIHZhbHVlJy5yZWQsIG1lc3NhZ2VPYmouYXR0YWNobWVudHMpO1xuXHRcdFx0bWVzc2FnZU9iai5hdHRhY2htZW50cyA9IHVuZGVmaW5lZDtcblx0XHR9XG5cblx0XHRjb25zdCBtZXNzYWdlID0ge1xuXHRcdFx0YWxpYXM6IG1lc3NhZ2VPYmoudXNlcm5hbWUgfHwgbWVzc2FnZU9iai5hbGlhcyB8fCBkZWZhdWx0VmFsdWVzLmFsaWFzLFxuXHRcdFx0bXNnOiBzLnRyaW0obWVzc2FnZU9iai50ZXh0IHx8IG1lc3NhZ2VPYmoubXNnIHx8ICcnKSxcblx0XHRcdGF0dGFjaG1lbnRzOiBtZXNzYWdlT2JqLmF0dGFjaG1lbnRzIHx8IFtdLFxuXHRcdFx0cGFyc2VVcmxzOiBtZXNzYWdlT2JqLnBhcnNlVXJscyAhPT0gdW5kZWZpbmVkID8gbWVzc2FnZU9iai5wYXJzZVVybHMgOiAhbWVzc2FnZU9iai5hdHRhY2htZW50cyxcblx0XHRcdGJvdDogbWVzc2FnZU9iai5ib3QsXG5cdFx0XHRncm91cGFibGU6IChtZXNzYWdlT2JqLmdyb3VwYWJsZSAhPT0gdW5kZWZpbmVkKSA/IG1lc3NhZ2VPYmouZ3JvdXBhYmxlIDogZmFsc2Vcblx0XHR9O1xuXG5cdFx0aWYgKCFfLmlzRW1wdHkobWVzc2FnZU9iai5pY29uX3VybCkgfHwgIV8uaXNFbXB0eShtZXNzYWdlT2JqLmF2YXRhcikpIHtcblx0XHRcdG1lc3NhZ2UuYXZhdGFyID0gbWVzc2FnZU9iai5pY29uX3VybCB8fCBtZXNzYWdlT2JqLmF2YXRhcjtcblx0XHR9IGVsc2UgaWYgKCFfLmlzRW1wdHkobWVzc2FnZU9iai5pY29uX2Vtb2ppKSB8fCAhXy5pc0VtcHR5KG1lc3NhZ2VPYmouZW1vamkpKSB7XG5cdFx0XHRtZXNzYWdlLmVtb2ppID0gbWVzc2FnZU9iai5pY29uX2Vtb2ppIHx8IG1lc3NhZ2VPYmouZW1vamk7XG5cdFx0fSBlbHNlIGlmICghXy5pc0VtcHR5KGRlZmF1bHRWYWx1ZXMuYXZhdGFyKSkge1xuXHRcdFx0bWVzc2FnZS5hdmF0YXIgPSBkZWZhdWx0VmFsdWVzLmF2YXRhcjtcblx0XHR9IGVsc2UgaWYgKCFfLmlzRW1wdHkoZGVmYXVsdFZhbHVlcy5lbW9qaSkpIHtcblx0XHRcdG1lc3NhZ2UuZW1vamkgPSBkZWZhdWx0VmFsdWVzLmVtb2ppO1xuXHRcdH1cblxuXHRcdGlmIChfLmlzQXJyYXkobWVzc2FnZS5hdHRhY2htZW50cykpIHtcblx0XHRcdGZvciAobGV0IGkgPSAwOyBpIDwgbWVzc2FnZS5hdHRhY2htZW50cy5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRjb25zdCBhdHRhY2htZW50ID0gbWVzc2FnZS5hdHRhY2htZW50c1tpXTtcblx0XHRcdFx0aWYgKGF0dGFjaG1lbnQubXNnKSB7XG5cdFx0XHRcdFx0YXR0YWNobWVudC50ZXh0ID0gcy50cmltKGF0dGFjaG1lbnQubXNnKTtcblx0XHRcdFx0XHRkZWxldGUgYXR0YWNobWVudC5tc2c7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cblx0XHRjb25zdCBtZXNzYWdlUmV0dXJuID0gUm9ja2V0Q2hhdC5zZW5kTWVzc2FnZSh1c2VyLCBtZXNzYWdlLCByb29tKTtcblx0XHRzZW50RGF0YS5wdXNoKHsgY2hhbm5lbCwgbWVzc2FnZTogbWVzc2FnZVJldHVybiB9KTtcblx0fVxuXG5cdHJldHVybiBzZW50RGF0YTtcbn07XG4iXX0=
