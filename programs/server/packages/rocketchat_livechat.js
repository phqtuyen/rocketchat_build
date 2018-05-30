(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var WebApp = Package.webapp.WebApp;
var WebAppInternals = Package.webapp.WebAppInternals;
var main = Package.webapp.main;
var Autoupdate = Package.autoupdate.Autoupdate;
var ECMAScript = Package.ecmascript.ECMAScript;
var RocketChat = Package['rocketchat:lib'].RocketChat;
var Logger = Package['rocketchat:logger'].Logger;
var SystemLogger = Package['rocketchat:logger'].SystemLogger;
var LoggerManager = Package['rocketchat:logger'].LoggerManager;
var Streamer = Package['rocketchat:streamer'].Streamer;
var UserPresence = Package['konecty:user-presence'].UserPresence;
var UserPresenceMonitor = Package['konecty:user-presence'].UserPresenceMonitor;
var UserPresenceEvents = Package['konecty:user-presence'].UserPresenceEvents;
var fileUpload = Package['rocketchat:ui'].fileUpload;
var HTTP = Package.http.HTTP;
var HTTPInternals = Package.http.HTTPInternals;
var check = Package.check.check;
var Match = Package.check.Match;
var MongoInternals = Package.mongo.MongoInternals;
var Mongo = Package.mongo.Mongo;
var DDPRateLimiter = Package['ddp-rate-limiter'].DDPRateLimiter;
var Tracker = Package.tracker.Tracker;
var Deps = Package.tracker.Deps;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var TAPi18next = Package['tap:i18n'].TAPi18next;
var TAPi18n = Package['tap:i18n'].TAPi18n;

/* Package-scope variables */
var department, emailSettings, self, _id, agents, username, agent, exports;

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:livechat":{"livechat.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/livechat.js                                                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
let url;
module.watch(require("url"), {
  default(v) {
    url = v;
  }

}, 1);
WebApp = Package.webapp.WebApp;
const Autoupdate = Package.autoupdate.Autoupdate;
WebApp.connectHandlers.use('/livechat', Meteor.bindEnvironment((req, res, next) => {
  const reqUrl = url.parse(req.url);

  if (reqUrl.pathname !== '/') {
    return next();
  }

  res.setHeader('content-type', 'text/html; charset=utf-8');
  let domainWhiteList = RocketChat.settings.get('Livechat_AllowedDomainsList');

  if (req.headers.referer && !_.isEmpty(domainWhiteList.trim())) {
    domainWhiteList = _.map(domainWhiteList.split(','), function (domain) {
      return domain.trim();
    });
    const referer = url.parse(req.headers.referer);

    if (!_.contains(domainWhiteList, referer.host)) {
      res.setHeader('X-FRAME-OPTIONS', 'DENY');
      return next();
    }

    res.setHeader('X-FRAME-OPTIONS', `ALLOW-FROM ${referer.protocol}//${referer.host}`);
  }

  const head = Assets.getText('public/head.html');
  let baseUrl;

  if (__meteor_runtime_config__.ROOT_URL_PATH_PREFIX && __meteor_runtime_config__.ROOT_URL_PATH_PREFIX.trim() !== '') {
    baseUrl = __meteor_runtime_config__.ROOT_URL_PATH_PREFIX;
  } else {
    baseUrl = '/';
  }

  if (/\/$/.test(baseUrl) === false) {
    baseUrl += '/';
  }

  const html = `<html>
		<head>
			<link rel="stylesheet" type="text/css" class="__meteor-css__" href="${baseUrl}livechat/livechat.css?_dc=${Autoupdate.autoupdateVersion}">
			<script type="text/javascript">
				__meteor_runtime_config__ = ${JSON.stringify(__meteor_runtime_config__)};
			</script>

			<base href="${baseUrl}">

			${head}
		</head>
		<body>
			<script type="text/javascript" src="${baseUrl}livechat/livechat.js?_dc=${Autoupdate.autoupdateVersion}"></script>
		</body>
	</html>`;
  res.write(html);
  res.end();
}));
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"server":{"startup.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/startup.js                                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.startup(() => {
  RocketChat.roomTypes.setRoomFind('l', code => {
    return RocketChat.models.Rooms.findLivechatByCode(code);
  });
  RocketChat.authz.addRoomAccessValidator(function (room, user) {
    return room.t === 'l' && user && RocketChat.authz.hasPermission(user._id, 'view-livechat-rooms');
  });
  RocketChat.authz.addRoomAccessValidator(function (room, user, extraData) {
    return room.t === 'l' && extraData && extraData.token && room.v && room.v.token === extraData.token;
  });
  RocketChat.callbacks.add('beforeLeaveRoom', function (user, room) {
    if (room.t !== 'l') {
      return user;
    }

    throw new Meteor.Error(TAPi18n.__('You_cant_leave_a_livechat_room_Please_use_the_close_button', {
      lng: user.language || RocketChat.settings.get('language') || 'en'
    }));
  }, RocketChat.callbacks.priority.LOW, 'cant-leave-room');
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"visitorStatus.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/visitorStatus.js                                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/* globals UserPresenceEvents */
Meteor.startup(() => {
  UserPresenceEvents.on('setStatus', (session, status, metadata) => {
    if (metadata && metadata.visitor) {
      RocketChat.models.LivechatInquiry.updateVisitorStatus(metadata.visitor, status);
      RocketChat.models.Rooms.updateVisitorStatus(metadata.visitor, status);
    }
  });
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"hooks":{"externalMessage.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/hooks/externalMessage.js                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
let knowledgeEnabled = false;
let apiaiKey = '';
let apiaiLanguage = 'en';
RocketChat.settings.get('Livechat_Knowledge_Enabled', function (key, value) {
  knowledgeEnabled = value;
});
RocketChat.settings.get('Livechat_Knowledge_Apiai_Key', function (key, value) {
  apiaiKey = value;
});
RocketChat.settings.get('Livechat_Knowledge_Apiai_Language', function (key, value) {
  apiaiLanguage = value;
});
RocketChat.callbacks.add('afterSaveMessage', function (message, room) {
  // skips this callback if the message was edited
  if (!message || message.editedAt) {
    return message;
  }

  if (!knowledgeEnabled) {
    return message;
  }

  if (!(typeof room.t !== 'undefined' && room.t === 'l' && room.v && room.v.token)) {
    return message;
  } // if the message hasn't a token, it was not sent by the visitor, so ignore it


  if (!message.token) {
    return message;
  }

  Meteor.defer(() => {
    try {
      const response = HTTP.post('https://api.api.ai/api/query?v=20150910', {
        data: {
          query: message.msg,
          lang: apiaiLanguage,
          sessionId: room._id
        },
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Authorization': `Bearer ${apiaiKey}`
        }
      });

      if (response.data && response.data.status.code === 200 && !_.isEmpty(response.data.result.fulfillment.speech)) {
        RocketChat.models.LivechatExternalMessage.insert({
          rid: message.rid,
          msg: response.data.result.fulfillment.speech,
          orig: message._id,
          ts: new Date()
        });
      }
    } catch (e) {
      SystemLogger.error('Error using Api.ai ->', e);
    }
  });
  return message;
}, RocketChat.callbacks.priority.LOW, 'externalWebHook');
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"leadCapture.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/hooks/leadCapture.js                                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let LivechatVisitors;
module.watch(require("../../server/models/LivechatVisitors"), {
  default(v) {
    LivechatVisitors = v;
  }

}, 0);

function validateMessage(message, room) {
  // skips this callback if the message was edited
  if (message.editedAt) {
    return false;
  } // message valid only if it is a livechat room


  if (!(typeof room.t !== 'undefined' && room.t === 'l' && room.v && room.v.token)) {
    return false;
  } // if the message hasn't a token, it was NOT sent from the visitor, so ignore it


  if (!message.token) {
    return false;
  } // if the message has a type means it is a special message (like the closing comment), so skips


  if (message.t) {
    return false;
  }

  return true;
}

RocketChat.callbacks.add('afterSaveMessage', function (message, room) {
  if (!validateMessage(message, room)) {
    return message;
  }

  const phoneRegexp = new RegExp(RocketChat.settings.get('Livechat_lead_phone_regex'), 'g');
  const msgPhones = message.msg.match(phoneRegexp);
  const emailRegexp = new RegExp(RocketChat.settings.get('Livechat_lead_email_regex'), 'gi');
  const msgEmails = message.msg.match(emailRegexp);

  if (msgEmails || msgPhones) {
    LivechatVisitors.saveGuestEmailPhoneById(room.v._id, msgEmails, msgPhones);
    RocketChat.callbacks.run('livechat.leadCapture', room);
  }

  return message;
}, RocketChat.callbacks.priority.LOW, 'leadCapture');
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"markRoomResponded.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/hooks/markRoomResponded.js                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.callbacks.add('afterSaveMessage', function (message, room) {
  // skips this callback if the message was edited
  if (!message || message.editedAt) {
    return message;
  } // check if room is yet awaiting for response


  if (!(typeof room.t !== 'undefined' && room.t === 'l' && room.waitingResponse)) {
    return message;
  } // if the message has a token, it was sent by the visitor, so ignore it


  if (message.token) {
    return message;
  }

  Meteor.defer(() => {
    const now = new Date();
    RocketChat.models.Rooms.setResponseByRoomId(room._id, {
      user: {
        _id: message.u._id,
        username: message.u.username
      },
      responseDate: now,
      responseTime: (now.getTime() - room.ts) / 1000
    });
  });
  return message;
}, RocketChat.callbacks.priority.LOW, 'markRoomResponded');
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"offlineMessage.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/hooks/offlineMessage.js                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.callbacks.add('livechat.offlineMessage', data => {
  if (!RocketChat.settings.get('Livechat_webhook_on_offline_msg')) {
    return data;
  }

  const postData = {
    type: 'LivechatOfflineMessage',
    sentAt: new Date(),
    visitor: {
      name: data.name,
      email: data.email
    },
    message: data.message
  };
  RocketChat.Livechat.sendRequest(postData);
}, RocketChat.callbacks.priority.MEDIUM, 'livechat-send-email-offline-message');
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"RDStation.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/hooks/RDStation.js                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
function sendToRDStation(room) {
  if (!RocketChat.settings.get('Livechat_RDStation_Token')) {
    return room;
  }

  const livechatData = RocketChat.Livechat.getLivechatRoomGuestInfo(room);

  if (!livechatData.visitor.email) {
    return room;
  }

  const options = {
    headers: {
      'Content-Type': 'application/json'
    },
    data: {
      token_rdstation: RocketChat.settings.get('Livechat_RDStation_Token'),
      identificador: 'rocketchat-livechat',
      client_id: livechatData.visitor._id,
      email: livechatData.visitor.email
    }
  };
  options.data.nome = livechatData.visitor.name || livechatData.visitor.username;

  if (livechatData.visitor.phone) {
    options.data.telefone = livechatData.visitor.phone;
  }

  if (livechatData.tags) {
    options.data.tags = livechatData.tags;
  }

  Object.keys(livechatData.customFields || {}).forEach(field => {
    options.data[field] = livechatData.customFields[field];
  });
  Object.keys(livechatData.visitor.customFields || {}).forEach(field => {
    options.data[field] = livechatData.visitor.customFields[field];
  });

  try {
    HTTP.call('POST', 'https://www.rdstation.com.br/api/1.3/conversions', options);
  } catch (e) {
    console.error('Error sending lead to RD Station ->', e);
  }

  return room;
}

RocketChat.callbacks.add('livechat.closeRoom', sendToRDStation, RocketChat.callbacks.priority.MEDIUM, 'livechat-rd-station-close-room');
RocketChat.callbacks.add('livechat.saveInfo', sendToRDStation, RocketChat.callbacks.priority.MEDIUM, 'livechat-rd-station-save-info');
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"sendToCRM.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/hooks/sendToCRM.js                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
function sendToCRM(type, room, includeMessages = true) {
  const postData = RocketChat.Livechat.getLivechatRoomGuestInfo(room);
  postData.type = type;
  postData.messages = [];
  let messages;

  if (typeof includeMessages === 'boolean' && includeMessages) {
    messages = RocketChat.models.Messages.findVisibleByRoomId(room._id, {
      sort: {
        ts: 1
      }
    });
  } else if (includeMessages instanceof Array) {
    messages = includeMessages;
  }

  if (messages) {
    messages.forEach(message => {
      if (message.t) {
        return;
      }

      const msg = {
        _id: message._id,
        username: message.u.username,
        msg: message.msg,
        ts: message.ts,
        editedAt: message.editedAt
      };

      if (message.u.username !== postData.visitor.username) {
        msg.agentId = message.u._id;
      }

      postData.messages.push(msg);
    });
  }

  const response = RocketChat.Livechat.sendRequest(postData);

  if (response && response.data && response.data.data) {
    RocketChat.models.Rooms.saveCRMDataByRoomId(room._id, response.data.data);
  }

  return room;
}

RocketChat.callbacks.add('livechat.closeRoom', room => {
  if (!RocketChat.settings.get('Livechat_webhook_on_close')) {
    return room;
  }

  return sendToCRM('LivechatSession', room);
}, RocketChat.callbacks.priority.MEDIUM, 'livechat-send-crm-close-room');
RocketChat.callbacks.add('livechat.saveInfo', room => {
  // Do not send to CRM if the chat is still open
  if (room.open) {
    return room;
  }

  return sendToCRM('LivechatEdit', room);
}, RocketChat.callbacks.priority.MEDIUM, 'livechat-send-crm-save-info');
RocketChat.callbacks.add('afterSaveMessage', function (message, room) {
  // only call webhook if it is a livechat room
  if (room.t !== 'l' || room.v == null || room.v.token == null) {
    return message;
  } // if the message has a token, it was sent from the visitor
  // if not, it was sent from the agent


  if (message.token) {
    if (!RocketChat.settings.get('Livechat_webhook_on_visitor_message')) {
      return message;
    }
  } else if (!RocketChat.settings.get('Livechat_webhook_on_agent_message')) {
    return message;
  } // if the message has a type means it is a special message (like the closing comment), so skips


  if (message.t) {
    return message;
  }

  sendToCRM('Message', room, [message]);
  return message;
}, RocketChat.callbacks.priority.MEDIUM, 'livechat-send-crm-message');
RocketChat.callbacks.add('livechat.leadCapture', room => {
  if (!RocketChat.settings.get('Livechat_webhook_on_capture')) {
    return room;
  }

  return sendToCRM('LeadCapture', room, false);
}, RocketChat.callbacks.priority.MEDIUM, 'livechat-send-crm-lead-capture');
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"sendToFacebook.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/hooks/sendToFacebook.js                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let OmniChannel;
module.watch(require("../lib/OmniChannel"), {
  default(v) {
    OmniChannel = v;
  }

}, 0);
RocketChat.callbacks.add('afterSaveMessage', function (message, room) {
  // skips this callback if the message was edited
  if (message.editedAt) {
    return message;
  }

  if (!RocketChat.settings.get('Livechat_Facebook_Enabled') || !RocketChat.settings.get('Livechat_Facebook_API_Key')) {
    return message;
  } // only send the sms by SMS if it is a livechat room with SMS set to true


  if (!(typeof room.t !== 'undefined' && room.t === 'l' && room.facebook && room.v && room.v.token)) {
    return message;
  } // if the message has a token, it was sent from the visitor, so ignore it


  if (message.token) {
    return message;
  } // if the message has a type means it is a special message (like the closing comment), so skips


  if (message.t) {
    return message;
  }

  OmniChannel.reply({
    page: room.facebook.page.id,
    token: room.v.token,
    text: message.msg
  });
  return message;
}, RocketChat.callbacks.priority.LOW, 'sendMessageToFacebook');
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"methods":{"addAgent.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/addAgent.js                                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  'livechat:addAgent'(username) {
    if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'view-livechat-manager')) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'livechat:addAgent'
      });
    }

    return RocketChat.Livechat.addAgent(username);
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"addManager.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/addManager.js                                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  'livechat:addManager'(username) {
    if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'view-livechat-manager')) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'livechat:addManager'
      });
    }

    return RocketChat.Livechat.addManager(username);
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"changeLivechatStatus.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/changeLivechatStatus.js                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  'livechat:changeLivechatStatus'() {
    if (!Meteor.userId()) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'livechat:changeLivechatStatus'
      });
    }

    const user = Meteor.user();
    const newStatus = user.statusLivechat === 'available' ? 'not-available' : 'available';
    return RocketChat.models.Users.setLivechatStatus(user._id, newStatus);
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"closeByVisitor.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/closeByVisitor.js                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let LivechatVisitors;
module.watch(require("../models/LivechatVisitors"), {
  default(v) {
    LivechatVisitors = v;
  }

}, 0);
Meteor.methods({
  'livechat:closeByVisitor'({
    roomId,
    token
  }) {
    const room = RocketChat.models.Rooms.findOneOpenByVisitorToken(token, roomId);

    if (!room || !room.open) {
      return false;
    }

    const visitor = LivechatVisitors.getVisitorByToken(token);
    const language = visitor && visitor.language || RocketChat.settings.get('language') || 'en';
    return RocketChat.Livechat.closeRoom({
      visitor,
      room,
      comment: TAPi18n.__('Closed_by_visitor', {
        lng: language
      })
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"closeRoom.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/closeRoom.js                                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  'livechat:closeRoom'(roomId, comment) {
    if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'close-livechat-room')) {
      throw new Meteor.Error('error-not-authorized', 'Not authorized', {
        method: 'livechat:closeRoom'
      });
    }

    const room = RocketChat.models.Rooms.findOneById(roomId);

    if (!room || room.t !== 'l') {
      throw new Meteor.Error('room-not-found', 'Room not found', {
        method: 'livechat:closeRoom'
      });
    }

    const user = Meteor.user();

    if ((!room.usernames || room.usernames.indexOf(user.username) === -1) && !RocketChat.authz.hasPermission(Meteor.userId(), 'close-others-livechat-room')) {
      throw new Meteor.Error('error-not-authorized', 'Not authorized', {
        method: 'livechat:closeRoom'
      });
    }

    return RocketChat.Livechat.closeRoom({
      user,
      room,
      comment
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"facebook.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/facebook.js                                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let OmniChannel;
module.watch(require("../lib/OmniChannel"), {
  default(v) {
    OmniChannel = v;
  }

}, 0);
Meteor.methods({
  'livechat:facebook'(options) {
    if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'view-livechat-manager')) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'livechat:addAgent'
      });
    }

    try {
      switch (options.action) {
        case 'initialState':
          {
            return {
              enabled: RocketChat.settings.get('Livechat_Facebook_Enabled'),
              hasToken: !!RocketChat.settings.get('Livechat_Facebook_API_Key')
            };
          }

        case 'enable':
          {
            const result = OmniChannel.enable();

            if (!result.success) {
              return result;
            }

            return RocketChat.settings.updateById('Livechat_Facebook_Enabled', true);
          }

        case 'disable':
          {
            OmniChannel.disable();
            return RocketChat.settings.updateById('Livechat_Facebook_Enabled', false);
          }

        case 'list-pages':
          {
            return OmniChannel.listPages();
          }

        case 'subscribe':
          {
            return OmniChannel.subscribe(options.page);
          }

        case 'unsubscribe':
          {
            return OmniChannel.unsubscribe(options.page);
          }
      }
    } catch (e) {
      if (e.response && e.response.data && e.response.data.error) {
        if (e.response.data.error.error) {
          throw new Meteor.Error(e.response.data.error.error, e.response.data.error.message);
        }

        if (e.response.data.error.response) {
          throw new Meteor.Error('integration-error', e.response.data.error.response.error.message);
        }

        if (e.response.data.error.message) {
          throw new Meteor.Error('integration-error', e.response.data.error.message);
        }
      }

      console.error('Error contacting omni.rocket.chat:', e);
      throw new Meteor.Error('integration-error', e.error);
    }
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"getCustomFields.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/getCustomFields.js                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  'livechat:getCustomFields'() {
    return RocketChat.models.LivechatCustomField.find().fetch();
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"getAgentData.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/getAgentData.js                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let LivechatVisitors;
module.watch(require("../models/LivechatVisitors"), {
  default(v) {
    LivechatVisitors = v;
  }

}, 0);
Meteor.methods({
  'livechat:getAgentData'({
    roomId,
    token
  }) {
    check(roomId, String);
    check(token, String);
    const room = RocketChat.models.Rooms.findOneById(roomId);
    const visitor = LivechatVisitors.getVisitorByToken(token); // allow to only user to send transcripts from their own chats

    if (!room || room.t !== 'l' || !room.v || room.v.token !== visitor.token) {
      throw new Meteor.Error('error-invalid-room', 'Invalid room');
    }

    if (!room.servedBy) {
      return;
    }

    return RocketChat.models.Users.getAgentInfo(room.servedBy._id);
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"getInitialData.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/getInitialData.js                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
let LivechatVisitors;
module.watch(require("../models/LivechatVisitors"), {
  default(v) {
    LivechatVisitors = v;
  }

}, 1);
Meteor.methods({
  'livechat:getInitialData'(visitorToken) {
    const info = {
      enabled: null,
      title: null,
      color: null,
      registrationForm: null,
      room: null,
      visitor: null,
      triggers: [],
      departments: [],
      allowSwitchingDepartments: null,
      online: true,
      offlineColor: null,
      offlineMessage: null,
      offlineSuccessMessage: null,
      offlineUnavailableMessage: null,
      displayOfflineForm: null,
      videoCall: null,
      conversationFinishedMessage: null
    };
    const room = RocketChat.models.Rooms.findOpenByVisitorToken(visitorToken, {
      fields: {
        name: 1,
        t: 1,
        cl: 1,
        u: 1,
        usernames: 1,
        v: 1,
        servedBy: 1
      }
    }).fetch();

    if (room && room.length > 0) {
      info.room = room[0];
    }

    const visitor = LivechatVisitors.getVisitorByToken(visitorToken, {
      fields: {
        name: 1,
        username: 1,
        visitorEmails: 1
      }
    });

    if (room) {
      info.visitor = visitor;
    }

    const initSettings = RocketChat.Livechat.getInitSettings();
    info.title = initSettings.Livechat_title;
    info.color = initSettings.Livechat_title_color;
    info.enabled = initSettings.Livechat_enabled;
    info.registrationForm = initSettings.Livechat_registration_form;
    info.offlineTitle = initSettings.Livechat_offline_title;
    info.offlineColor = initSettings.Livechat_offline_title_color;
    info.offlineMessage = initSettings.Livechat_offline_message;
    info.offlineSuccessMessage = initSettings.Livechat_offline_success_message;
    info.offlineUnavailableMessage = initSettings.Livechat_offline_form_unavailable;
    info.displayOfflineForm = initSettings.Livechat_display_offline_form;
    info.language = initSettings.Language;
    info.videoCall = initSettings.Livechat_videocall_enabled === true && initSettings.Jitsi_Enabled === true;
    info.transcript = initSettings.Livechat_enable_transcript;
    info.transcriptMessage = initSettings.Livechat_transcript_message;
    info.conversationFinishedMessage = initSettings.Livechat_conversation_finished_message;
    info.agentData = room && room[0] && room[0].servedBy && RocketChat.models.Users.getAgentInfo(room[0].servedBy._id);
    RocketChat.models.LivechatTrigger.findEnabled().forEach(trigger => {
      info.triggers.push(_.pick(trigger, '_id', 'actions', 'conditions'));
    });
    RocketChat.models.LivechatDepartment.findEnabledWithAgents().forEach(department => {
      info.departments.push(department);
    });
    info.allowSwitchingDepartments = initSettings.Livechat_allow_switching_departments;
    info.online = RocketChat.models.Users.findOnlineAgents().count() > 0;
    return info;
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"getNextAgent.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/getNextAgent.js                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  'livechat:getNextAgent'({
    token,
    department
  }) {
    check(token, String);
    const room = RocketChat.models.Rooms.findOpenByVisitorToken(token).fetch();

    if (room && room.length > 0) {
      return;
    }

    if (!department) {
      const requireDeparment = RocketChat.Livechat.getRequiredDepartment();

      if (requireDeparment) {
        department = requireDeparment._id;
      }
    }

    const agent = RocketChat.Livechat.getNextAgent(department);

    if (!agent) {
      return;
    }

    return RocketChat.models.Users.getAgentInfo(agent.agentId);
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"loadHistory.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/loadHistory.js                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let LivechatVisitors;
module.watch(require("../models/LivechatVisitors"), {
  default(v) {
    LivechatVisitors = v;
  }

}, 0);
Meteor.methods({
  'livechat:loadHistory'({
    token,
    rid,
    end,
    limit = 20,
    ls
  }) {
    const visitor = LivechatVisitors.getVisitorByToken(token, {
      fields: {
        _id: 1
      }
    });

    if (!visitor) {
      return;
    }

    return RocketChat.loadMessageHistory({
      userId: visitor._id,
      rid,
      end,
      limit,
      ls
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"loginByToken.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/loginByToken.js                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let LivechatVisitors;
module.watch(require("../models/LivechatVisitors"), {
  default(v) {
    LivechatVisitors = v;
  }

}, 0);
Meteor.methods({
  'livechat:loginByToken'(token) {
    const user = LivechatVisitors.getVisitorByToken(token, {
      fields: {
        _id: 1
      }
    });

    if (!user) {
      return;
    }

    return {
      _id: user._id
    };
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"pageVisited.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/pageVisited.js                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  'livechat:pageVisited'(token, pageInfo) {
    return RocketChat.Livechat.savePageHistory(token, pageInfo);
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"registerGuest.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/registerGuest.js                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  'livechat:registerGuest'({
    token,
    name,
    email,
    department
  } = {}) {
    const userId = RocketChat.Livechat.registerGuest.call(this, {
      token,
      name,
      email,
      department
    }); // update visited page history to not expire

    RocketChat.models.LivechatPageVisited.keepHistoryForToken(token);
    return {
      userId
    };
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"removeAgent.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/removeAgent.js                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  'livechat:removeAgent'(username) {
    if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'view-livechat-manager')) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'livechat:removeAgent'
      });
    }

    return RocketChat.Livechat.removeAgent(username);
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"removeCustomField.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/removeCustomField.js                                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  'livechat:removeCustomField'(_id) {
    if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'view-livechat-manager')) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'livechat:removeCustomField'
      });
    }

    check(_id, String);
    const customField = RocketChat.models.LivechatCustomField.findOneById(_id, {
      fields: {
        _id: 1
      }
    });

    if (!customField) {
      throw new Meteor.Error('error-invalid-custom-field', 'Custom field not found', {
        method: 'livechat:removeCustomField'
      });
    }

    return RocketChat.models.LivechatCustomField.removeById(_id);
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"removeDepartment.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/removeDepartment.js                                                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  'livechat:removeDepartment'(_id) {
    if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'view-livechat-manager')) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'livechat:removeDepartment'
      });
    }

    return RocketChat.Livechat.removeDepartment(_id);
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"removeManager.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/removeManager.js                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  'livechat:removeManager'(username) {
    if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'view-livechat-manager')) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'livechat:removeManager'
      });
    }

    return RocketChat.Livechat.removeManager(username);
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"removeTrigger.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/removeTrigger.js                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  'livechat:removeTrigger'(triggerId) {
    if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'view-livechat-manager')) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'livechat:removeTrigger'
      });
    }

    check(triggerId, String);
    return RocketChat.models.LivechatTrigger.removeById(triggerId);
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"saveAppearance.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/saveAppearance.js                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  'livechat:saveAppearance'(settings) {
    if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'view-livechat-manager')) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'livechat:saveAppearance'
      });
    }

    const validSettings = ['Livechat_title', 'Livechat_title_color', 'Livechat_show_agent_email', 'Livechat_display_offline_form', 'Livechat_offline_form_unavailable', 'Livechat_offline_message', 'Livechat_offline_success_message', 'Livechat_offline_title', 'Livechat_offline_title_color', 'Livechat_offline_email', 'Livechat_conversation_finished_message'];
    const valid = settings.every(setting => {
      return validSettings.indexOf(setting._id) !== -1;
    });

    if (!valid) {
      throw new Meteor.Error('invalid-setting');
    }

    settings.forEach(setting => {
      RocketChat.settings.updateById(setting._id, setting.value);
    });
    return;
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"saveCustomField.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/saveCustomField.js                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/* eslint new-cap: [2, {"capIsNewExceptions": ["Match.ObjectIncluding", "Match.Optional"]}] */
Meteor.methods({
  'livechat:saveCustomField'(_id, customFieldData) {
    if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'view-livechat-manager')) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'livechat:saveCustomField'
      });
    }

    if (_id) {
      check(_id, String);
    }

    check(customFieldData, Match.ObjectIncluding({
      field: String,
      label: String,
      scope: String,
      visibility: String
    }));

    if (!/^[0-9a-zA-Z-_]+$/.test(customFieldData.field)) {
      throw new Meteor.Error('error-invalid-custom-field-nmae', 'Invalid custom field name. Use only letters, numbers, hyphens and underscores.', {
        method: 'livechat:saveCustomField'
      });
    }

    if (_id) {
      const customField = RocketChat.models.LivechatCustomField.findOneById(_id);

      if (!customField) {
        throw new Meteor.Error('error-invalid-custom-field', 'Custom Field Not found', {
          method: 'livechat:saveCustomField'
        });
      }
    }

    return RocketChat.models.LivechatCustomField.createOrUpdateCustomField(_id, customFieldData.field, customFieldData.label, customFieldData.scope, customFieldData.visibility);
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"saveDepartment.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/saveDepartment.js                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  'livechat:saveDepartment'(_id, departmentData, departmentAgents) {
    if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'view-livechat-manager')) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'livechat:saveDepartment'
      });
    }

    return RocketChat.Livechat.saveDepartment(_id, departmentData, departmentAgents);
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"saveInfo.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/saveInfo.js                                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/* eslint new-cap: [2, {"capIsNewExceptions": ["Match.ObjectIncluding", "Match.Optional"]}] */
Meteor.methods({
  'livechat:saveInfo'(guestData, roomData) {
    if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'view-l-room')) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'livechat:saveInfo'
      });
    }

    check(guestData, Match.ObjectIncluding({
      _id: String,
      name: Match.Optional(String),
      email: Match.Optional(String),
      phone: Match.Optional(String)
    }));
    check(roomData, Match.ObjectIncluding({
      _id: String,
      topic: Match.Optional(String),
      tags: Match.Optional(String)
    }));
    const room = RocketChat.models.Rooms.findOneById(roomData._id, {
      fields: {
        t: 1,
        servedBy: 1
      }
    });

    if (room == null || room.t !== 'l') {
      throw new Meteor.Error('error-invalid-room', 'Invalid room', {
        method: 'livechat:saveInfo'
      });
    }

    if ((!room.servedBy || room.servedBy._id !== Meteor.userId()) && !RocketChat.authz.hasPermission(Meteor.userId(), 'save-others-livechat-room-info')) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'livechat:saveInfo'
      });
    }

    const ret = RocketChat.Livechat.saveGuest(guestData) && RocketChat.Livechat.saveRoomInfo(roomData, guestData);
    Meteor.defer(() => {
      RocketChat.callbacks.run('livechat.saveInfo', RocketChat.models.Rooms.findOneById(roomData._id));
    });
    return ret;
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"saveIntegration.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/saveIntegration.js                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let s;
module.watch(require("underscore.string"), {
  default(v) {
    s = v;
  }

}, 0);
Meteor.methods({
  'livechat:saveIntegration'(values) {
    if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'view-livechat-manager')) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'livechat:saveIntegration'
      });
    }

    if (typeof values['Livechat_webhookUrl'] !== 'undefined') {
      RocketChat.settings.updateById('Livechat_webhookUrl', s.trim(values['Livechat_webhookUrl']));
    }

    if (typeof values['Livechat_secret_token'] !== 'undefined') {
      RocketChat.settings.updateById('Livechat_secret_token', s.trim(values['Livechat_secret_token']));
    }

    if (typeof values['Livechat_webhook_on_close'] !== 'undefined') {
      RocketChat.settings.updateById('Livechat_webhook_on_close', !!values['Livechat_webhook_on_close']);
    }

    if (typeof values['Livechat_webhook_on_offline_msg'] !== 'undefined') {
      RocketChat.settings.updateById('Livechat_webhook_on_offline_msg', !!values['Livechat_webhook_on_offline_msg']);
    }

    if (typeof values['Livechat_webhook_on_visitor_message'] !== 'undefined') {
      RocketChat.settings.updateById('Livechat_webhook_on_visitor_message', !!values['Livechat_webhook_on_visitor_message']);
    }

    if (typeof values['Livechat_webhook_on_agent_message'] !== 'undefined') {
      RocketChat.settings.updateById('Livechat_webhook_on_agent_message', !!values['Livechat_webhook_on_agent_message']);
    }

    return;
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"saveSurveyFeedback.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/saveSurveyFeedback.js                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let LivechatVisitors;
module.watch(require("../models/LivechatVisitors"), {
  default(v) {
    LivechatVisitors = v;
  }

}, 0);

let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 1);
Meteor.methods({
  'livechat:saveSurveyFeedback'(visitorToken, visitorRoom, formData) {
    check(visitorToken, String);
    check(visitorRoom, String);
    check(formData, [Match.ObjectIncluding({
      name: String,
      value: String
    })]);
    const visitor = LivechatVisitors.getVisitorByToken(visitorToken);
    const room = RocketChat.models.Rooms.findOneById(visitorRoom);

    if (visitor !== undefined && room !== undefined && room.v !== undefined && room.v.token === visitor.token) {
      const updateData = {};

      for (const item of formData) {
        if (_.contains(['satisfaction', 'agentKnowledge', 'agentResposiveness', 'agentFriendliness'], item.name) && _.contains(['1', '2', '3', '4', '5'], item.value)) {
          updateData[item.name] = item.value;
        } else if (item.name === 'additionalFeedback') {
          updateData[item.name] = item.value;
        }
      }

      if (!_.isEmpty(updateData)) {
        return RocketChat.models.Rooms.updateSurveyFeedbackById(room._id, updateData);
      }
    }
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"saveTrigger.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/saveTrigger.js                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  'livechat:saveTrigger'(trigger) {
    if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'view-livechat-manager')) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'livechat:saveTrigger'
      });
    }

    check(trigger, {
      _id: Match.Maybe(String),
      name: String,
      description: String,
      enabled: Boolean,
      conditions: Array,
      actions: Array
    });

    if (trigger._id) {
      return RocketChat.models.LivechatTrigger.updateById(trigger._id, trigger);
    } else {
      return RocketChat.models.LivechatTrigger.insert(trigger);
    }
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"searchAgent.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/searchAgent.js                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
Meteor.methods({
  'livechat:searchAgent'(username) {
    if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'view-livechat-manager')) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'livechat:searchAgent'
      });
    }

    if (!username || !_.isString(username)) {
      throw new Meteor.Error('error-invalid-arguments', 'Invalid arguments', {
        method: 'livechat:searchAgent'
      });
    }

    const user = RocketChat.models.Users.findOneByUsername(username, {
      fields: {
        _id: 1,
        username: 1
      }
    });

    if (!user) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'livechat:searchAgent'
      });
    }

    return user;
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"sendMessageLivechat.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/sendMessageLivechat.js                                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let LivechatVisitors;
module.watch(require("../models/LivechatVisitors"), {
  default(v) {
    LivechatVisitors = v;
  }

}, 0);
Meteor.methods({
  sendMessageLivechat({
    token,
    _id,
    rid,
    msg
  }, agent) {
    check(token, String);
    check(_id, String);
    check(rid, String);
    check(msg, String);
    check(agent, Match.Maybe({
      agentId: String,
      username: String
    }));
    const guest = LivechatVisitors.getVisitorByToken(token, {
      fields: {
        name: 1,
        username: 1,
        department: 1,
        token: 1
      }
    });

    if (!guest) {
      throw new Meteor.Error('invalid-token');
    }

    return RocketChat.Livechat.sendMessage({
      guest,
      message: {
        _id,
        rid,
        msg,
        token
      },
      agent
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"sendOfflineMessage.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/sendOfflineMessage.js                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let dns;
module.watch(require("dns"), {
  default(v) {
    dns = v;
  }

}, 0);
Meteor.methods({
  'livechat:sendOfflineMessage'(data) {
    check(data, {
      name: String,
      email: String,
      message: String
    });

    if (!RocketChat.settings.get('Livechat_display_offline_form')) {
      return false;
    }

    const header = RocketChat.placeholders.replace(RocketChat.settings.get('Email_Header') || '');
    const footer = RocketChat.placeholders.replace(RocketChat.settings.get('Email_Footer') || '');
    const message = `${data.message}`.replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1' + '<br>' + '$2');
    const html = `
			<h1>New livechat message</h1>
			<p><strong>Visitor name:</strong> ${data.name}</p>
			<p><strong>Visitor email:</strong> ${data.email}</p>
			<p><strong>Message:</strong><br>${message}</p>`;
    let fromEmail = RocketChat.settings.get('From_Email').match(/\b[A-Z0-9._%+-]+@(?:[A-Z0-9-]+\.)+[A-Z]{2,4}\b/i);

    if (fromEmail) {
      fromEmail = fromEmail[0];
    } else {
      fromEmail = RocketChat.settings.get('From_Email');
    }

    if (RocketChat.settings.get('Livechat_validate_offline_email')) {
      const emailDomain = data.email.substr(data.email.lastIndexOf('@') + 1);

      try {
        Meteor.wrapAsync(dns.resolveMx)(emailDomain);
      } catch (e) {
        throw new Meteor.Error('error-invalid-email-address', 'Invalid email address', {
          method: 'livechat:sendOfflineMessage'
        });
      }
    }

    Meteor.defer(() => {
      Email.send({
        to: RocketChat.settings.get('Livechat_offline_email'),
        from: `${data.name} - ${data.email} <${fromEmail}>`,
        replyTo: `${data.name} <${data.email}>`,
        subject: `Livechat offline message from ${data.name}: ${`${data.message}`.substring(0, 20)}`,
        html: header + html + footer
      });
    });
    Meteor.defer(() => {
      RocketChat.callbacks.run('livechat.offlineMessage', data);
    });
    return true;
  }

});
DDPRateLimiter.addRule({
  type: 'method',
  name: 'livechat:sendOfflineMessage',

  connectionId() {
    return true;
  }

}, 1, 5000);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"setCustomField.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/setCustomField.js                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let LivechatVisitors;
module.watch(require("../models/LivechatVisitors"), {
  default(v) {
    LivechatVisitors = v;
  }

}, 0);
Meteor.methods({
  'livechat:setCustomField'(token, key, value, overwrite = true) {
    const customField = RocketChat.models.LivechatCustomField.findOneById(key);

    if (customField) {
      if (customField.scope === 'room') {
        return RocketChat.models.Rooms.updateLivechatDataByToken(token, key, value, overwrite);
      } else {
        // Save in user
        return LivechatVisitors.updateLivechatDataByToken(token, key, value, overwrite);
      }
    }

    return true;
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"setDepartmentForVisitor.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/setDepartmentForVisitor.js                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  'livechat:setDepartmentForVisitor'({
    token,
    department
  } = {}) {
    RocketChat.Livechat.setDepartmentForGuest.call(this, {
      token,
      department
    }); // update visited page history to not expire

    RocketChat.models.LivechatPageVisited.keepHistoryForToken(token);
    return true;
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"startVideoCall.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/startVideoCall.js                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/* eslint new-cap: [2, {"capIsNewExceptions": ["MD5"]}] */
Meteor.methods({
  'livechat:startVideoCall'(roomId) {
    if (!Meteor.userId()) {
      throw new Meteor.Error('error-not-authorized', 'Not authorized', {
        method: 'livechat:closeByVisitor'
      });
    }

    const guest = Meteor.user();
    const message = {
      _id: Random.id(),
      rid: roomId || Random.id(),
      msg: '',
      ts: new Date()
    };
    const {
      room
    } = RocketChat.Livechat.getRoom(guest, message, {
      jitsiTimeout: new Date(Date.now() + 3600 * 1000)
    });
    message.rid = room._id;
    RocketChat.models.Messages.createWithTypeRoomIdMessageAndUser('livechat_video_call', room._id, '', guest, {
      actionLinks: [{
        icon: 'icon-videocam',
        i18nLabel: 'Accept',
        method_id: 'createLivechatCall',
        params: ''
      }, {
        icon: 'icon-cancel',
        i18nLabel: 'Decline',
        method_id: 'denyLivechatCall',
        params: ''
      }]
    });
    return {
      roomId: room._id,
      domain: RocketChat.settings.get('Jitsi_Domain'),
      jitsiRoom: RocketChat.settings.get('Jitsi_URL_Room_Prefix') + RocketChat.settings.get('uniqueID') + roomId
    };
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"transfer.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/transfer.js                                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let LivechatVisitors;
module.watch(require("../models/LivechatVisitors"), {
  default(v) {
    LivechatVisitors = v;
  }

}, 0);
Meteor.methods({
  'livechat:transfer'(transferData) {
    if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'view-l-room')) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'livechat:transfer'
      });
    }

    check(transferData, {
      roomId: String,
      userId: Match.Optional(String),
      departmentId: Match.Optional(String)
    });
    const room = RocketChat.models.Rooms.findOneById(transferData.roomId);
    const guest = LivechatVisitors.findOneById(room.v._id);
    const user = Meteor.user();

    if (room.usernames.indexOf(user.username) === -1 && !RocketChat.authz.hasRole(Meteor.userId(), 'livechat-manager')) {
      throw new Meteor.Error('error-not-authorized', 'Not authorized', {
        method: 'livechat:transfer'
      });
    }

    return RocketChat.Livechat.transfer(room, guest, transferData);
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"webhookTest.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/webhookTest.js                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/* globals HTTP */
const postCatchError = Meteor.wrapAsync(function (url, options, resolve) {
  HTTP.post(url, options, function (err, res) {
    if (err) {
      resolve(null, err.response);
    } else {
      resolve(null, res);
    }
  });
});
Meteor.methods({
  'livechat:webhookTest'() {
    this.unblock();
    const sampleData = {
      type: 'LivechatSession',
      _id: 'fasd6f5a4sd6f8a4sdf',
      label: 'title',
      topic: 'asiodojf',
      code: 123123,
      createdAt: new Date(),
      lastMessageAt: new Date(),
      tags: ['tag1', 'tag2', 'tag3'],
      customFields: {
        productId: '123456'
      },
      visitor: {
        _id: '',
        name: 'visitor name',
        username: 'visitor-username',
        department: 'department',
        email: 'email@address.com',
        phone: '192873192873',
        ip: '123.456.7.89',
        browser: 'Chrome',
        os: 'Linux',
        customFields: {
          customerId: '123456'
        }
      },
      agent: {
        _id: 'asdf89as6df8',
        username: 'agent.username',
        name: 'Agent Name',
        email: 'agent@email.com'
      },
      messages: [{
        username: 'visitor-username',
        msg: 'message content',
        ts: new Date()
      }, {
        username: 'agent.username',
        agentId: 'asdf89as6df8',
        msg: 'message content from agent',
        ts: new Date()
      }]
    };
    const options = {
      headers: {
        'X-RocketChat-Livechat-Token': RocketChat.settings.get('Livechat_secret_token')
      },
      data: sampleData
    };
    const response = postCatchError(RocketChat.settings.get('Livechat_webhookUrl'), options);
    console.log('response ->', response);

    if (response && response.statusCode && response.statusCode === 200) {
      return true;
    } else {
      throw new Meteor.Error('error-invalid-webhook-response');
    }
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"takeInquiry.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/takeInquiry.js                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  'livechat:takeInquiry'(inquiryId) {
    if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'view-l-room')) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'livechat:takeInquiry'
      });
    }

    const inquiry = RocketChat.models.LivechatInquiry.findOneById(inquiryId);

    if (!inquiry || inquiry.status === 'taken') {
      throw new Meteor.Error('error-not-allowed', 'Inquiry already taken', {
        method: 'livechat:takeInquiry'
      });
    }

    const user = RocketChat.models.Users.findOneById(Meteor.userId());
    const agent = {
      agentId: user._id,
      username: user.username
    }; // add subscription

    const subscriptionData = {
      rid: inquiry.rid,
      name: inquiry.name,
      alert: true,
      open: true,
      unread: 1,
      userMentions: 1,
      groupMentions: 0,
      code: inquiry.code,
      u: {
        _id: agent.agentId,
        username: agent.username
      },
      t: 'l',
      desktopNotifications: 'all',
      mobilePushNotifications: 'all',
      emailNotifications: 'all'
    };
    RocketChat.models.Subscriptions.insert(subscriptionData); // update room

    const room = RocketChat.models.Rooms.findOneById(inquiry.rid);
    RocketChat.models.Rooms.changeAgentByRoomId(inquiry.rid, agent);
    room.servedBy = {
      _id: agent.agentId,
      username: agent.username
    }; // mark inquiry as taken

    RocketChat.models.LivechatInquiry.takeInquiry(inquiry._id); // remove sending message from guest widget
    // dont check if setting is true, because if settingwas switched off inbetween  guest entered pool,
    // and inquiry being taken, message would not be switched off.

    RocketChat.models.Messages.createCommandWithRoomIdAndUser('connected', room._id, user);
    RocketChat.Livechat.stream.emit(room._id, {
      type: 'agentData',
      data: RocketChat.models.Users.getAgentInfo(agent.agentId)
    }); // return room corresponding to inquiry (for redirecting agent to the room route)

    return room;
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"returnAsInquiry.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/returnAsInquiry.js                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  'livechat:returnAsInquiry'(rid) {
    if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'view-l-room')) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'livechat:saveDepartment'
      });
    } // //delete agent and room subscription


    RocketChat.models.Subscriptions.removeByRoomId(rid); // remove user from room

    const username = Meteor.user().username;
    RocketChat.models.Rooms.removeUsernameById(rid, username); // find inquiry corresponding to room

    const inquiry = RocketChat.models.LivechatInquiry.findOne({
      rid
    }); // mark inquiry as open

    return RocketChat.models.LivechatInquiry.openInquiry(inquiry._id);
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"saveOfficeHours.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/saveOfficeHours.js                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  'livechat:saveOfficeHours'(day, start, finish, open) {
    RocketChat.models.LivechatOfficeHour.updateHours(day, start, finish, open);
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"sendTranscript.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/sendTranscript.js                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let moment;
module.watch(require("moment"), {
  default(v) {
    moment = v;
  }

}, 0);
let LivechatVisitors;
module.watch(require("../models/LivechatVisitors"), {
  default(v) {
    LivechatVisitors = v;
  }

}, 1);
Meteor.methods({
  'livechat:sendTranscript'(token, rid, email) {
    check(rid, String);
    check(email, String);
    const room = RocketChat.models.Rooms.findOneById(rid);
    const visitor = LivechatVisitors.getVisitorByToken(token);
    const userLanguage = visitor && visitor.language || RocketChat.settings.get('language') || 'en'; // allow to only user to send transcripts from their own chats

    if (!room || room.t !== 'l' || !room.v || room.v.token !== token) {
      throw new Meteor.Error('error-invalid-room', 'Invalid room');
    }

    const messages = RocketChat.models.Messages.findVisibleByRoomId(rid, {
      sort: {
        'ts': 1
      }
    });
    const header = RocketChat.placeholders.replace(RocketChat.settings.get('Email_Header') || '');
    const footer = RocketChat.placeholders.replace(RocketChat.settings.get('Email_Footer') || '');
    let html = '<div> <hr>';
    messages.forEach(message => {
      if (message.t && ['command', 'livechat-close', 'livechat_video_call'].indexOf(message.t) !== -1) {
        return;
      }

      let author;

      if (message.u._id === visitor._id) {
        author = TAPi18n.__('You', {
          lng: userLanguage
        });
      } else {
        author = message.u.username;
      }

      const datetime = moment(message.ts).locale(userLanguage).format('LLL');
      const singleMessage = `
				<p><strong>${author}</strong>  <em>${datetime}</em></p>
				<p>${message.msg}</p>
			`;
      html = html + singleMessage;
    });
    html = `${html}</div>`;
    let fromEmail = RocketChat.settings.get('From_Email').match(/\b[A-Z0-9._%+-]+@(?:[A-Z0-9-]+\.)+[A-Z]{2,4}\b/i);

    if (fromEmail) {
      fromEmail = fromEmail[0];
    } else {
      fromEmail = RocketChat.settings.get('From_Email');
    }

    emailSettings = {
      to: email,
      from: fromEmail,
      replyTo: fromEmail,
      subject: TAPi18n.__('Transcript_of_your_livechat_conversation', {
        lng: userLanguage
      }),
      html: header + html + footer
    };
    Meteor.defer(() => {
      Email.send(emailSettings);
    });
    Meteor.defer(() => {
      RocketChat.callbacks.run('livechat.sendTranscript', messages, email);
    });
    return true;
  }

});
DDPRateLimiter.addRule({
  type: 'method',
  name: 'livechat:sendTranscript',

  connectionId() {
    return true;
  }

}, 1, 5000);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"models":{"Users.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/models/Users.js                                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/**
 * Sets an user as (non)operator
 * @param {string} _id - User's _id
 * @param {boolean} operator - Flag to set as operator or not
 */
RocketChat.models.Users.setOperator = function (_id, operator) {
  const update = {
    $set: {
      operator
    }
  };
  return this.update(_id, update);
};
/**
 * Gets all online agents
 * @return
 */


RocketChat.models.Users.findOnlineAgents = function () {
  const query = {
    status: {
      $exists: true,
      $ne: 'offline'
    },
    statusLivechat: 'available',
    roles: 'livechat-agent'
  };
  return this.find(query);
};
/**
 * Find an online agent by his username
 * @return
 */


RocketChat.models.Users.findOneOnlineAgentByUsername = function (username) {
  const query = {
    username,
    status: {
      $exists: true,
      $ne: 'offline'
    },
    statusLivechat: 'available',
    roles: 'livechat-agent'
  };
  return this.findOne(query);
};
/**
 * Gets all agents
 * @return
 */


RocketChat.models.Users.findAgents = function () {
  const query = {
    roles: 'livechat-agent'
  };
  return this.find(query);
};
/**
 * Find online users from a list
 * @param {array} userList - array of usernames
 * @return
 */


RocketChat.models.Users.findOnlineUserFromList = function (userList) {
  const query = {
    status: {
      $exists: true,
      $ne: 'offline'
    },
    statusLivechat: 'available',
    roles: 'livechat-agent',
    username: {
      $in: [].concat(userList)
    }
  };
  return this.find(query);
};
/**
 * Get next user agent in order
 * @return {object} User from db
 */


RocketChat.models.Users.getNextAgent = function () {
  const query = {
    status: {
      $exists: true,
      $ne: 'offline'
    },
    statusLivechat: 'available',
    roles: 'livechat-agent'
  };
  const collectionObj = this.model.rawCollection();
  const findAndModify = Meteor.wrapAsync(collectionObj.findAndModify, collectionObj);
  const sort = {
    livechatCount: 1,
    username: 1
  };
  const update = {
    $inc: {
      livechatCount: 1
    }
  };
  const user = findAndModify(query, sort, update);

  if (user && user.value) {
    return {
      agentId: user.value._id,
      username: user.value.username
    };
  } else {
    return null;
  }
};
/**
 * Change user's livechat status
 * @param {string} token - Visitor token
 */


RocketChat.models.Users.setLivechatStatus = function (userId, status) {
  const query = {
    '_id': userId
  };
  const update = {
    $set: {
      'statusLivechat': status
    }
  };
  return this.update(query, update);
};
/**
 * change all livechat agents livechat status to "not-available"
 */


RocketChat.models.Users.closeOffice = function () {
  self = this;
  self.findAgents().forEach(function (agent) {
    self.setLivechatStatus(agent._id, 'not-available');
  });
};
/**
 * change all livechat agents livechat status to "available"
 */


RocketChat.models.Users.openOffice = function () {
  self = this;
  self.findAgents().forEach(function (agent) {
    self.setLivechatStatus(agent._id, 'available');
  });
};

RocketChat.models.Users.getAgentInfo = function (agentId) {
  const query = {
    _id: agentId
  };
  const options = {
    fields: {
      name: 1,
      username: 1,
      phone: 1,
      customFields: 1
    }
  };

  if (RocketChat.settings.get('Livechat_show_agent_email')) {
    options.fields.emails = 1;
  }

  return this.findOne(query, options);
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"Rooms.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/models/Rooms.js                                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);

/**
 * Gets visitor by token
 * @param {string} token - Visitor token
 */
RocketChat.models.Rooms.updateSurveyFeedbackById = function (_id, surveyFeedback) {
  const query = {
    _id
  };
  const update = {
    $set: {
      surveyFeedback
    }
  };
  return this.update(query, update);
};

RocketChat.models.Rooms.updateLivechatDataByToken = function (token, key, value, overwrite = true) {
  const query = {
    'v.token': token,
    open: true
  };

  if (!overwrite) {
    const room = this.findOne(query, {
      fields: {
        livechatData: 1
      }
    });

    if (room.livechatData && typeof room.livechatData[key] !== 'undefined') {
      return true;
    }
  }

  const update = {
    $set: {
      [`livechatData.${key}`]: value
    }
  };
  return this.update(query, update);
};

RocketChat.models.Rooms.findLivechat = function (filter = {}, offset = 0, limit = 20) {
  const query = _.extend(filter, {
    t: 'l'
  });

  return this.find(query, {
    sort: {
      ts: -1
    },
    offset,
    limit
  });
};

RocketChat.models.Rooms.findLivechatByCode = function (code, fields) {
  code = parseInt(code);
  const options = {};

  if (fields) {
    options.fields = fields;
  } // if (this.useCache) {
  // 	return this.cache.findByIndex('t,code', ['l', code], options).fetch();
  // }


  const query = {
    t: 'l',
    code
  };
  return this.findOne(query, options);
};
/**
 * Get the next visitor name
 * @return {string} The next visitor name
 */


RocketChat.models.Rooms.getNextLivechatRoomCode = function () {
  const settingsRaw = RocketChat.models.Settings.model.rawCollection();
  const findAndModify = Meteor.wrapAsync(settingsRaw.findAndModify, settingsRaw);
  const query = {
    _id: 'Livechat_Room_Count'
  };
  const update = {
    $inc: {
      value: 1
    }
  };
  const livechatCount = findAndModify(query, null, update);
  return livechatCount.value.value;
};

RocketChat.models.Rooms.findOpenByVisitorToken = function (visitorToken, options) {
  const query = {
    open: true,
    'v.token': visitorToken
  };
  return this.find(query, options);
};

RocketChat.models.Rooms.findByVisitorToken = function (visitorToken) {
  const query = {
    'v.token': visitorToken
  };
  return this.find(query);
};

RocketChat.models.Rooms.findByVisitorId = function (visitorId) {
  const query = {
    'v._id': visitorId
  };
  return this.find(query);
};

RocketChat.models.Rooms.findOneOpenByVisitorToken = function (token, roomId) {
  const query = {
    _id: roomId,
    open: true,
    'v.token': token
  };
  return this.findOne(query);
};

RocketChat.models.Rooms.setResponseByRoomId = function (roomId, response) {
  return this.update({
    _id: roomId
  }, {
    $set: {
      responseBy: {
        _id: response.user._id,
        username: response.user.username
      },
      responseDate: response.responseDate,
      responseTime: response.responseTime
    },
    $unset: {
      waitingResponse: 1
    }
  });
};

RocketChat.models.Rooms.closeByRoomId = function (roomId, closeInfo) {
  return this.update({
    _id: roomId
  }, {
    $set: {
      closer: closeInfo.closer,
      closedBy: closeInfo.closedBy,
      closedAt: closeInfo.closedAt,
      chatDuration: closeInfo.chatDuration,
      'v.status': 'offline'
    },
    $unset: {
      open: 1
    }
  });
};

RocketChat.models.Rooms.setLabelByRoomId = function (roomId, label) {
  return this.update({
    _id: roomId
  }, {
    $set: {
      label
    }
  });
};

RocketChat.models.Rooms.findOpenByAgent = function (userId) {
  const query = {
    open: true,
    'servedBy._id': userId
  };
  return this.find(query);
};

RocketChat.models.Rooms.changeAgentByRoomId = function (roomId, newAgent) {
  const query = {
    _id: roomId
  };
  const update = {
    $set: {
      servedBy: {
        _id: newAgent.agentId,
        username: newAgent.username
      }
    }
  };
  this.update(query, update);
};

RocketChat.models.Rooms.saveCRMDataByRoomId = function (roomId, crmData) {
  const query = {
    _id: roomId
  };
  const update = {
    $set: {
      crmData
    }
  };
  return this.update(query, update);
};

RocketChat.models.Rooms.updateVisitorStatus = function (token, status) {
  const query = {
    'v.token': token,
    open: true
  };
  const update = {
    $set: {
      'v.status': status
    }
  };
  return this.update(query, update);
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"LivechatExternalMessage.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/models/LivechatExternalMessage.js                                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
class LivechatExternalMessage extends RocketChat.models._Base {
  constructor() {
    super('livechat_external_message');

    if (Meteor.isClient) {
      this._initModel('livechat_external_message');
    }
  } // FIND


  findByRoomId(roomId, sort = {
    ts: -1
  }) {
    const query = {
      rid: roomId
    };
    return this.find(query, {
      sort
    });
  }

}

RocketChat.models.LivechatExternalMessage = new LivechatExternalMessage();
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"LivechatCustomField.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/models/LivechatCustomField.js                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);

/**
 * Livechat Custom Fields model
 */
class LivechatCustomField extends RocketChat.models._Base {
  constructor() {
    super('livechat_custom_field');
  } // FIND


  findOneById(_id, options) {
    const query = {
      _id
    };
    return this.findOne(query, options);
  }

  createOrUpdateCustomField(_id, field, label, scope, visibility, extraData) {
    const record = {
      label,
      scope,
      visibility
    };

    _.extend(record, extraData);

    if (_id) {
      this.update({
        _id
      }, {
        $set: record
      });
    } else {
      record._id = field;
      _id = this.insert(record);
    }

    return record;
  } // REMOVE


  removeById(_id) {
    const query = {
      _id
    };
    return this.remove(query);
  }

}

RocketChat.models.LivechatCustomField = new LivechatCustomField();
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"LivechatDepartment.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/models/LivechatDepartment.js                                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);

/**
 * Livechat Department model
 */
class LivechatDepartment extends RocketChat.models._Base {
  constructor() {
    super('livechat_department');
    this.tryEnsureIndex({
      numAgents: 1,
      enabled: 1
    });
  } // FIND


  findOneById(_id, options) {
    const query = {
      _id
    };
    return this.findOne(query, options);
  }

  findByDepartmentId(_id, options) {
    const query = {
      _id
    };
    return this.find(query, options);
  }

  createOrUpdateDepartment(_id, {
    enabled,
    name,
    description,
    showOnRegistration
  }, agents) {
    agents = [].concat(agents);
    const record = {
      enabled,
      name,
      description,
      numAgents: agents.length,
      showOnRegistration
    };

    if (_id) {
      this.update({
        _id
      }, {
        $set: record
      });
    } else {
      _id = this.insert(record);
    }

    const savedAgents = _.pluck(RocketChat.models.LivechatDepartmentAgents.findByDepartmentId(_id).fetch(), 'agentId');

    const agentsToSave = _.pluck(agents, 'agentId'); // remove other agents


    _.difference(savedAgents, agentsToSave).forEach(agentId => {
      RocketChat.models.LivechatDepartmentAgents.removeByDepartmentIdAndAgentId(_id, agentId);
    });

    agents.forEach(agent => {
      RocketChat.models.LivechatDepartmentAgents.saveAgent({
        agentId: agent.agentId,
        departmentId: _id,
        username: agent.username,
        count: agent.count ? parseInt(agent.count) : 0,
        order: agent.order ? parseInt(agent.order) : 0
      });
    });
    return _.extend(record, {
      _id
    });
  } // REMOVE


  removeById(_id) {
    const query = {
      _id
    };
    return this.remove(query);
  }

  findEnabledWithAgents() {
    const query = {
      numAgents: {
        $gt: 0
      },
      enabled: true
    };
    return this.find(query);
  }

}

RocketChat.models.LivechatDepartment = new LivechatDepartment();
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"LivechatDepartmentAgents.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/models/LivechatDepartmentAgents.js                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);

/**
 * Livechat Department model
 */
class LivechatDepartmentAgents extends RocketChat.models._Base {
  constructor() {
    super('livechat_department_agents');
  }

  findByDepartmentId(departmentId) {
    return this.find({
      departmentId
    });
  }

  saveAgent(agent) {
    return this.upsert({
      agentId: agent.agentId,
      departmentId: agent.departmentId
    }, {
      $set: {
        username: agent.username,
        count: parseInt(agent.count),
        order: parseInt(agent.order)
      }
    });
  }

  removeByDepartmentIdAndAgentId(departmentId, agentId) {
    this.remove({
      departmentId,
      agentId
    });
  }

  getNextAgentForDepartment(departmentId) {
    const agents = this.findByDepartmentId(departmentId).fetch();

    if (agents.length === 0) {
      return;
    }

    const onlineUsers = RocketChat.models.Users.findOnlineUserFromList(_.pluck(agents, 'username'));

    const onlineUsernames = _.pluck(onlineUsers.fetch(), 'username');

    const query = {
      departmentId,
      username: {
        $in: onlineUsernames
      }
    };
    const sort = {
      count: 1,
      order: 1,
      username: 1
    };
    const update = {
      $inc: {
        count: 1
      }
    };
    const collectionObj = this.model.rawCollection();
    const findAndModify = Meteor.wrapAsync(collectionObj.findAndModify, collectionObj);
    const agent = findAndModify(query, sort, update);

    if (agent && agent.value) {
      return {
        agentId: agent.value.agentId,
        username: agent.value.username
      };
    } else {
      return null;
    }
  }

  getOnlineForDepartment(departmentId) {
    const agents = this.findByDepartmentId(departmentId).fetch();

    if (agents.length === 0) {
      return [];
    }

    const onlineUsers = RocketChat.models.Users.findOnlineUserFromList(_.pluck(agents, 'username'));

    const onlineUsernames = _.pluck(onlineUsers.fetch(), 'username');

    const query = {
      departmentId,
      username: {
        $in: onlineUsernames
      }
    };
    const depAgents = this.find(query);

    if (depAgents) {
      return depAgents;
    } else {
      return [];
    }
  }

  findUsersInQueue(usersList) {
    const query = {};

    if (!_.isEmpty(usersList)) {
      query.username = {
        $in: usersList
      };
    }

    const options = {
      sort: {
        departmentId: 1,
        count: 1,
        order: 1,
        username: 1
      }
    };
    return this.find(query, options);
  }

  replaceUsernameOfAgentByUserId(userId, username) {
    const query = {
      'agentId': userId
    };
    const update = {
      $set: {
        username
      }
    };
    return this.update(query, update, {
      multi: true
    });
  }

}

RocketChat.models.LivechatDepartmentAgents = new LivechatDepartmentAgents();
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"LivechatPageVisited.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/models/LivechatPageVisited.js                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/**
 * Livechat Page Visited model
 */
class LivechatPageVisited extends RocketChat.models._Base {
  constructor() {
    super('livechat_page_visited');
    this.tryEnsureIndex({
      'token': 1
    });
    this.tryEnsureIndex({
      'ts': 1
    }); // keep history for 1 month if the visitor does not register

    this.tryEnsureIndex({
      'expireAt': 1
    }, {
      sparse: 1,
      expireAfterSeconds: 0
    });
  }

  saveByToken(token, pageInfo) {
    // keep history of unregistered visitors for 1 month
    const keepHistoryMiliseconds = 2592000000;
    return this.insert({
      token,
      page: pageInfo,
      ts: new Date(),
      expireAt: new Date().getTime() + keepHistoryMiliseconds
    });
  }

  findByToken(token) {
    return this.find({
      token
    }, {
      sort: {
        ts: -1
      },
      limit: 20
    });
  }

  keepHistoryForToken(token) {
    return this.update({
      token,
      expireAt: {
        $exists: true
      }
    }, {
      $unset: {
        expireAt: 1
      }
    }, {
      multi: true
    });
  }

}

RocketChat.models.LivechatPageVisited = new LivechatPageVisited();
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"LivechatTrigger.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/models/LivechatTrigger.js                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/**
 * Livechat Trigger model
 */
class LivechatTrigger extends RocketChat.models._Base {
  constructor() {
    super('livechat_trigger');
  }

  updateById(_id, data) {
    return this.update({
      _id
    }, {
      $set: data
    });
  }

  removeAll() {
    return this.remove({});
  }

  findById(_id) {
    return this.find({
      _id
    });
  }

  removeById(_id) {
    return this.remove({
      _id
    });
  }

  findEnabled() {
    return this.find({
      enabled: true
    });
  }

}

RocketChat.models.LivechatTrigger = new LivechatTrigger();
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"indexes.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/models/indexes.js                                                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.startup(function () {
  RocketChat.models.Rooms.tryEnsureIndex({
    code: 1
  });
  RocketChat.models.Rooms.tryEnsureIndex({
    open: 1
  }, {
    sparse: 1
  });
  RocketChat.models.Users.tryEnsureIndex({
    'visitorEmails.address': 1
  });
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"LivechatInquiry.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/models/LivechatInquiry.js                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
class LivechatInquiry extends RocketChat.models._Base {
  constructor() {
    super('livechat_inquiry');
    this.tryEnsureIndex({
      'rid': 1
    }); // room id corresponding to this inquiry

    this.tryEnsureIndex({
      'name': 1
    }); // name of the inquiry (client name for now)

    this.tryEnsureIndex({
      'message': 1
    }); // message sent by the client

    this.tryEnsureIndex({
      'ts': 1
    }); // timestamp

    this.tryEnsureIndex({
      'code': 1
    }); // (for routing)

    this.tryEnsureIndex({
      'agents': 1
    }); // Id's of the agents who can see the inquiry (handle departments)

    this.tryEnsureIndex({
      'status': 1
    }); // 'open', 'taken'
  }

  findOneById(inquiryId) {
    return this.findOne({
      _id: inquiryId
    });
  }
  /*
   * mark the inquiry as taken
   */


  takeInquiry(inquiryId) {
    this.update({
      '_id': inquiryId
    }, {
      $set: {
        status: 'taken'
      }
    });
  }
  /*
   * mark the inquiry as closed
   */


  closeByRoomId(roomId, closeInfo) {
    return this.update({
      rid: roomId
    }, {
      $set: {
        status: 'closed',
        closer: closeInfo.closer,
        closedBy: closeInfo.closedBy,
        closedAt: closeInfo.closedAt,
        chatDuration: closeInfo.chatDuration
      }
    });
  }
  /*
   * mark inquiry as open
   */


  openInquiry(inquiryId) {
    this.update({
      '_id': inquiryId
    }, {
      $set: {
        status: 'open'
      }
    });
  }
  /*
   * return the status of the inquiry (open or taken)
   */


  getStatus(inquiryId) {
    return this.findOne({
      '_id': inquiryId
    }).status;
  }

  updateVisitorStatus(token, status) {
    const query = {
      'v.token': token,
      status: 'open'
    };
    const update = {
      $set: {
        'v.status': status
      }
    };
    return this.update(query, update);
  }

}

RocketChat.models.LivechatInquiry = new LivechatInquiry();
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"LivechatOfficeHour.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/models/LivechatOfficeHour.js                                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let moment;
module.watch(require("moment"), {
  default(v) {
    moment = v;
  }

}, 0);

class LivechatOfficeHour extends RocketChat.models._Base {
  constructor() {
    super('livechat_office_hour');
    this.tryEnsureIndex({
      'day': 1
    }); // the day of the week monday - sunday

    this.tryEnsureIndex({
      'start': 1
    }); // the opening hours of the office

    this.tryEnsureIndex({
      'finish': 1
    }); // the closing hours of the office

    this.tryEnsureIndex({
      'open': 1
    }); // whether or not the offices are open on this day
    // if there is nothing in the collection, add defaults

    if (this.find().count() === 0) {
      this.insert({
        'day': 'Monday',
        'start': '08:00',
        'finish': '20:00',
        'code': 1,
        'open': true
      });
      this.insert({
        'day': 'Tuesday',
        'start': '08:00',
        'finish': '20:00',
        'code': 2,
        'open': true
      });
      this.insert({
        'day': 'Wednesday',
        'start': '08:00',
        'finish': '20:00',
        'code': 3,
        'open': true
      });
      this.insert({
        'day': 'Thursday',
        'start': '08:00',
        'finish': '20:00',
        'code': 4,
        'open': true
      });
      this.insert({
        'day': 'Friday',
        'start': '08:00',
        'finish': '20:00',
        'code': 5,
        'open': true
      });
      this.insert({
        'day': 'Saturday',
        'start': '08:00',
        'finish': '20:00',
        'code': 6,
        'open': false
      });
      this.insert({
        'day': 'Sunday',
        'start': '08:00',
        'finish': '20:00',
        'code': 0,
        'open': false
      });
    }
  }
  /*
   * update the given days start and finish times and whether the office is open on that day
   */


  updateHours(day, newStart, newFinish, newOpen) {
    this.update({
      day
    }, {
      $set: {
        start: newStart,
        finish: newFinish,
        open: newOpen
      }
    });
  }
  /*
   * Check if the current server time (utc) is within the office hours of that day
   * returns true or false
   */


  isNowWithinHours() {
    // get current time on server in utc
    // var ct = moment().utc();
    const currentTime = moment.utc(moment().utc().format('dddd:HH:mm'), 'dddd:HH:mm'); // get todays office hours from db

    const todaysOfficeHours = this.findOne({
      day: currentTime.format('dddd')
    });

    if (!todaysOfficeHours) {
      return false;
    } // check if offices are open today


    if (todaysOfficeHours.open === false) {
      return false;
    }

    const start = moment.utc(`${todaysOfficeHours.day}:${todaysOfficeHours.start}`, 'dddd:HH:mm');
    const finish = moment.utc(`${todaysOfficeHours.day}:${todaysOfficeHours.finish}`, 'dddd:HH:mm'); // console.log(finish.isBefore(start));

    if (finish.isBefore(start)) {
      // finish.day(finish.day()+1);
      finish.add(1, 'days');
    }

    const result = currentTime.isBetween(start, finish); // inBetween  check

    return result;
  }

  isOpeningTime() {
    // get current time on server in utc
    const currentTime = moment.utc(moment().utc().format('dddd:HH:mm'), 'dddd:HH:mm'); // get todays office hours from db

    const todaysOfficeHours = this.findOne({
      day: currentTime.format('dddd')
    });

    if (!todaysOfficeHours) {
      return false;
    } // check if offices are open today


    if (todaysOfficeHours.open === false) {
      return false;
    }

    const start = moment.utc(`${todaysOfficeHours.day}:${todaysOfficeHours.start}`, 'dddd:HH:mm');
    return start.isSame(currentTime, 'minute');
  }

  isClosingTime() {
    // get current time on server in utc
    const currentTime = moment.utc(moment().utc().format('dddd:HH:mm'), 'dddd:HH:mm'); // get todays office hours from db

    const todaysOfficeHours = this.findOne({
      day: currentTime.format('dddd')
    });

    if (!todaysOfficeHours) {
      return false;
    }

    const finish = moment.utc(`${todaysOfficeHours.day}:${todaysOfficeHours.finish}`, 'dddd:HH:mm');
    return finish.isSame(currentTime, 'minute');
  }

}

RocketChat.models.LivechatOfficeHour = new LivechatOfficeHour();
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"LivechatVisitors.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/models/LivechatVisitors.js                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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

class LivechatVisitors extends RocketChat.models._Base {
  constructor() {
    super('livechat_visitor');
  }
  /**
   * Gets visitor by token
   * @param {string} token - Visitor token
   */


  getVisitorByToken(token, options) {
    const query = {
      token
    };
    return this.findOne(query, options);
  }
  /**
   * Find visitors by _id
   * @param {string} token - Visitor token
   */


  findById(_id, options) {
    const query = {
      _id
    };
    return this.find(query, options);
  }
  /**
   * Gets visitor by token
   * @param {string} token - Visitor token
   */


  findVisitorByToken(token) {
    const query = {
      token
    };
    return this.find(query);
  }

  updateLivechatDataByToken(token, key, value, overwrite = true) {
    const query = {
      token
    };

    if (!overwrite) {
      const user = this.findOne(query, {
        fields: {
          livechatData: 1
        }
      });

      if (user.livechatData && typeof user.livechatData[key] !== 'undefined') {
        return true;
      }
    }

    const update = {
      $set: {
        [`livechatData.${key}`]: value
      }
    };
    return this.update(query, update);
  }
  /**
   * Find a visitor by their phone number
   * @return {object} User from db
   */


  findOneVisitorByPhone(phone) {
    const query = {
      'phone.phoneNumber': phone
    };
    return this.findOne(query);
  }
  /**
   * Get the next visitor name
   * @return {string} The next visitor name
   */


  getNextVisitorUsername() {
    const settingsRaw = RocketChat.models.Settings.model.rawCollection();
    const findAndModify = Meteor.wrapAsync(settingsRaw.findAndModify, settingsRaw);
    const query = {
      _id: 'Livechat_guest_count'
    };
    const update = {
      $inc: {
        value: 1
      }
    };
    const livechatCount = findAndModify(query, null, update);
    return `guest-${livechatCount.value.value + 1}`;
  }

  updateById(_id, update) {
    return this.update({
      _id
    }, update);
  }

  saveGuestById(_id, data) {
    const setData = {};
    const unsetData = {};

    if (data.name) {
      if (!_.isEmpty(s.trim(data.name))) {
        setData.name = s.trim(data.name);
      } else {
        unsetData.name = 1;
      }
    }

    if (data.email) {
      if (!_.isEmpty(s.trim(data.email))) {
        setData.visitorEmails = [{
          address: s.trim(data.email)
        }];
      } else {
        unsetData.visitorEmails = 1;
      }
    }

    if (data.phone) {
      if (!_.isEmpty(s.trim(data.phone))) {
        setData.phone = [{
          phoneNumber: s.trim(data.phone)
        }];
      } else {
        unsetData.phone = 1;
      }
    }

    const update = {};

    if (!_.isEmpty(setData)) {
      update.$set = setData;
    }

    if (!_.isEmpty(unsetData)) {
      update.$unset = unsetData;
    }

    if (_.isEmpty(update)) {
      return true;
    }

    return this.update({
      _id
    }, update);
  }

  findOneGuestByEmailAddress(emailAddress) {
    const query = {
      'visitorEmails.address': new RegExp(`^${s.escapeRegExp(emailAddress)}$`, 'i')
    };
    return this.findOne(query);
  }

  saveGuestEmailPhoneById(_id, emails, phones) {
    const update = {
      $addToSet: {}
    };
    const saveEmail = [].concat(emails).filter(email => email && email.trim()).map(email => {
      return {
        address: email
      };
    });

    if (saveEmail.length > 0) {
      update.$addToSet.visitorEmails = {
        $each: saveEmail
      };
    }

    const savePhone = [].concat(phones).filter(phone => phone && phone.trim().replace(/[^\d]/g, '')).map(phone => {
      return {
        phoneNumber: phone
      };
    });

    if (savePhone.length > 0) {
      update.$addToSet.phone = {
        $each: savePhone
      };
    }

    if (!update.$addToSet.visitorEmails && !update.$addToSet.phone) {
      return;
    }

    return this.update({
      _id
    }, update);
  }

}

module.exportDefault(new LivechatVisitors());
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"lib":{"Livechat.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/lib/Livechat.js                                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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
let UAParser;
module.watch(require("ua-parser-js"), {
  default(v) {
    UAParser = v;
  }

}, 2);
let LivechatVisitors;
module.watch(require("../models/LivechatVisitors"), {
  default(v) {
    LivechatVisitors = v;
  }

}, 3);
RocketChat.Livechat = {
  historyMonitorType: 'url',
  logger: new Logger('Livechat', {
    sections: {
      webhook: 'Webhook'
    }
  }),

  getNextAgent(department) {
    if (RocketChat.settings.get('Livechat_Routing_Method') === 'External') {
      for (let i = 0; i < 10; i++) {
        try {
          const queryString = department ? `?departmentId=${department}` : '';
          const result = HTTP.call('GET', `${RocketChat.settings.get('Livechat_External_Queue_URL')}${queryString}`, {
            headers: {
              'User-Agent': 'RocketChat Server',
              'Accept': 'application/json',
              'X-RocketChat-Secret-Token': RocketChat.settings.get('Livechat_External_Queue_Token')
            }
          });

          if (result && result.data && result.data.username) {
            const agent = RocketChat.models.Users.findOneOnlineAgentByUsername(result.data.username);

            if (agent) {
              return {
                agentId: agent._id,
                username: agent.username
              };
            }
          }
        } catch (e) {
          console.error('Error requesting agent from external queue.', e);
          break;
        }
      }

      throw new Meteor.Error('no-agent-online', 'Sorry, no online agents');
    } else if (department) {
      return RocketChat.models.LivechatDepartmentAgents.getNextAgentForDepartment(department);
    }

    return RocketChat.models.Users.getNextAgent();
  },

  getAgents(department) {
    if (department) {
      return RocketChat.models.LivechatDepartmentAgents.findByDepartmentId(department);
    } else {
      return RocketChat.models.Users.findAgents();
    }
  },

  getOnlineAgents(department) {
    if (department) {
      return RocketChat.models.LivechatDepartmentAgents.getOnlineForDepartment(department);
    } else {
      return RocketChat.models.Users.findOnlineAgents();
    }
  },

  getRequiredDepartment(onlineRequired = true) {
    const departments = RocketChat.models.LivechatDepartment.findEnabledWithAgents();
    return departments.fetch().find(dept => {
      if (!dept.showOnRegistration) {
        return false;
      }

      if (!onlineRequired) {
        return true;
      }

      const onlineAgents = RocketChat.models.LivechatDepartmentAgents.getOnlineForDepartment(dept._id);
      return onlineAgents.count() > 0;
    });
  },

  getRoom(guest, message, roomInfo, agent) {
    let room = RocketChat.models.Rooms.findOneById(message.rid);
    let newRoom = false;

    if (room && !room.open) {
      message.rid = Random.id();
      room = null;
    }

    if (room == null) {
      // if no department selected verify if there is at least one active and pick the first
      if (!agent && !guest.department) {
        const department = this.getRequiredDepartment();

        if (department) {
          guest.department = department._id;
        }
      } // delegate room creation to QueueMethods


      const routingMethod = RocketChat.settings.get('Livechat_Routing_Method');
      room = RocketChat.QueueMethods[routingMethod](guest, message, roomInfo, agent);
      newRoom = true;
    }

    if (!room || room.v.token !== guest.token) {
      throw new Meteor.Error('cannot-access-room');
    }

    return {
      room,
      newRoom
    };
  },

  sendMessage({
    guest,
    message,
    roomInfo,
    agent
  }) {
    const {
      room,
      newRoom
    } = this.getRoom(guest, message, roomInfo, agent);

    if (guest.name) {
      message.alias = guest.name;
    } // return messages;


    return _.extend(RocketChat.sendMessage(guest, message, room), {
      newRoom,
      showConnecting: this.showConnecting()
    });
  },

  registerGuest({
    token,
    name,
    email,
    department,
    phone,
    username
  } = {}) {
    check(token, String);
    let userId;
    const updateUser = {
      $set: {
        token
      }
    };
    const user = LivechatVisitors.getVisitorByToken(token, {
      fields: {
        _id: 1
      }
    });

    if (user) {
      userId = user._id;
    } else {
      if (!username) {
        username = LivechatVisitors.getNextVisitorUsername();
      }

      let existingUser = null;

      if (s.trim(email) !== '' && (existingUser = LivechatVisitors.findOneGuestByEmailAddress(email))) {
        userId = existingUser._id;
      } else {
        const userData = {
          username,
          department
        };

        if (this.connection) {
          userData.userAgent = this.connection.httpHeaders['user-agent'];
          userData.ip = this.connection.httpHeaders['x-real-ip'] || this.connection.httpHeaders['x-forwarded-for'] || this.connection.clientAddress;
          userData.host = this.connection.httpHeaders.host;
        }

        userId = LivechatVisitors.insert(userData);
      }
    }

    if (phone) {
      updateUser.$set.phone = [{
        phoneNumber: phone.number
      }];
    }

    if (email && email.trim() !== '') {
      updateUser.$set.visitorEmails = [{
        address: email
      }];
    }

    if (name) {
      updateUser.$set.name = name;
    }

    LivechatVisitors.updateById(userId, updateUser);
    return userId;
  },

  setDepartmentForGuest({
    token,
    department
  } = {}) {
    check(token, String);
    const updateUser = {
      $set: {
        department
      }
    };
    const user = LivechatVisitors.getVisitorByToken(token, {
      fields: {
        _id: 1
      }
    });

    if (user) {
      return Meteor.users.update(user._id, updateUser);
    }

    return false;
  },

  saveGuest({
    _id,
    name,
    email,
    phone
  }) {
    const updateData = {};

    if (name) {
      updateData.name = name;
    }

    if (email) {
      updateData.email = email;
    }

    if (phone) {
      updateData.phone = phone;
    }

    const ret = LivechatVisitors.saveGuestById(_id, updateData);
    Meteor.defer(() => {
      RocketChat.callbacks.run('livechat.saveGuest', updateData);
    });
    return ret;
  },

  closeRoom({
    user,
    visitor,
    room,
    comment
  }) {
    const now = new Date();
    const closeData = {
      closedAt: now,
      chatDuration: (now.getTime() - room.ts) / 1000
    };

    if (user) {
      closeData.closer = 'user';
      closeData.closedBy = {
        _id: user._id,
        username: user.username
      };
    } else if (visitor) {
      closeData.closer = 'visitor';
      closeData.closedBy = {
        _id: visitor._id,
        username: visitor.username
      };
    }

    RocketChat.models.Rooms.closeByRoomId(room._id, closeData);
    RocketChat.models.LivechatInquiry.closeByRoomId(room._id, closeData);
    const message = {
      t: 'livechat-close',
      msg: comment,
      groupable: false
    };
    RocketChat.sendMessage(user, message, room);

    if (room.servedBy) {
      RocketChat.models.Subscriptions.hideByRoomIdAndUserId(room._id, room.servedBy._id);
    }

    RocketChat.models.Messages.createCommandWithRoomIdAndUser('promptTranscript', room._id, closeData.closedBy);
    Meteor.defer(() => {
      RocketChat.callbacks.run('livechat.closeRoom', room);
    });
    return true;
  },

  getInitSettings() {
    const settings = {};
    RocketChat.models.Settings.findNotHiddenPublic(['Livechat_title', 'Livechat_title_color', 'Livechat_enabled', 'Livechat_registration_form', 'Livechat_allow_switching_departments', 'Livechat_offline_title', 'Livechat_offline_title_color', 'Livechat_offline_message', 'Livechat_offline_success_message', 'Livechat_offline_form_unavailable', 'Livechat_display_offline_form', 'Livechat_videocall_enabled', 'Jitsi_Enabled', 'Language', 'Livechat_enable_transcript', 'Livechat_transcript_message', 'Livechat_conversation_finished_message']).forEach(setting => {
      settings[setting._id] = setting.value;
    });
    return settings;
  },

  saveRoomInfo(roomData, guestData) {
    if ((roomData.topic != null || roomData.tags != null) && !RocketChat.models.Rooms.setTopicAndTagsById(roomData._id, roomData.topic, roomData.tags)) {
      return false;
    }

    Meteor.defer(() => {
      RocketChat.callbacks.run('livechat.saveRoom', roomData);
    });

    if (!_.isEmpty(guestData.name)) {
      return RocketChat.models.Rooms.setLabelByRoomId(roomData._id, guestData.name) && RocketChat.models.Subscriptions.updateNameByRoomId(roomData._id, guestData.name);
    }
  },

  closeOpenChats(userId, comment) {
    const user = RocketChat.models.Users.findOneById(userId);
    RocketChat.models.Rooms.findOpenByAgent(userId).forEach(room => {
      this.closeRoom({
        user,
        room,
        comment
      });
    });
  },

  forwardOpenChats(userId) {
    RocketChat.models.Rooms.findOpenByAgent(userId).forEach(room => {
      const guest = RocketChat.models.Users.findOneById(room.v._id);
      this.transfer(room, guest, {
        departmentId: guest.department
      });
    });
  },

  savePageHistory(token, pageInfo) {
    if (pageInfo.change === RocketChat.Livechat.historyMonitorType) {
      return RocketChat.models.LivechatPageVisited.saveByToken(token, pageInfo);
    }

    return;
  },

  transfer(room, guest, transferData) {
    let agent;

    if (transferData.userId) {
      const user = RocketChat.models.Users.findOneById(transferData.userId);
      agent = {
        agentId: user._id,
        username: user.username
      };
    } else {
      agent = RocketChat.Livechat.getNextAgent(transferData.departmentId);
    }

    const servedBy = room.servedBy;

    if (agent && agent.agentId !== servedBy._id) {
      room.usernames = _.without(room.usernames, servedBy.username).concat(agent.username);
      RocketChat.models.Rooms.changeAgentByRoomId(room._id, agent);
      const subscriptionData = {
        rid: room._id,
        name: guest.name || guest.username,
        alert: true,
        open: true,
        unread: 1,
        userMentions: 1,
        groupMentions: 0,
        code: room.code,
        u: {
          _id: agent.agentId,
          username: agent.username
        },
        t: 'l',
        desktopNotifications: 'all',
        mobilePushNotifications: 'all',
        emailNotifications: 'all'
      };
      RocketChat.models.Subscriptions.removeByRoomIdAndUserId(room._id, servedBy._id);
      RocketChat.models.Subscriptions.insert(subscriptionData);
      RocketChat.models.Messages.createUserLeaveWithRoomIdAndUser(room._id, {
        _id: servedBy._id,
        username: servedBy.username
      });
      RocketChat.models.Messages.createUserJoinWithRoomIdAndUser(room._id, {
        _id: agent.agentId,
        username: agent.username
      });
      RocketChat.Livechat.stream.emit(room._id, {
        type: 'agentData',
        data: RocketChat.models.Users.getAgentInfo(agent.agentId)
      });
      return true;
    }

    return false;
  },

  sendRequest(postData, callback, trying = 1) {
    try {
      const options = {
        headers: {
          'X-RocketChat-Livechat-Token': RocketChat.settings.get('Livechat_secret_token')
        },
        data: postData
      };
      return HTTP.post(RocketChat.settings.get('Livechat_webhookUrl'), options);
    } catch (e) {
      RocketChat.Livechat.logger.webhook.error(`Response error on ${trying} try ->`, e); // try 10 times after 10 seconds each

      if (trying < 10) {
        RocketChat.Livechat.logger.webhook.warn('Will try again in 10 seconds ...');
        trying++;
        setTimeout(Meteor.bindEnvironment(() => {
          RocketChat.Livechat.sendRequest(postData, callback, trying);
        }), 10000);
      }
    }
  },

  getLivechatRoomGuestInfo(room) {
    const visitor = LivechatVisitors.findOneById(room.v._id);
    const agent = RocketChat.models.Users.findOneById(room.servedBy && room.servedBy._id);
    const ua = new UAParser();
    ua.setUA(visitor.userAgent);
    const postData = {
      _id: room._id,
      label: room.label,
      topic: room.topic,
      code: room.code,
      createdAt: room.ts,
      lastMessageAt: room.lm,
      tags: room.tags,
      customFields: room.livechatData,
      visitor: {
        _id: visitor._id,
        token: visitor.token,
        name: visitor.name,
        username: visitor.username,
        email: null,
        phone: null,
        department: visitor.department,
        ip: visitor.ip,
        os: ua.getOS().name && `${ua.getOS().name} ${ua.getOS().version}`,
        browser: ua.getBrowser().name && `${ua.getBrowser().name} ${ua.getBrowser().version}`,
        customFields: visitor.livechatData
      }
    };

    if (agent) {
      postData.agent = {
        _id: agent._id,
        username: agent.username,
        name: agent.name,
        email: null
      };

      if (agent.emails && agent.emails.length > 0) {
        postData.agent.email = agent.emails[0].address;
      }
    }

    if (room.crmData) {
      postData.crmData = room.crmData;
    }

    if (visitor.visitorEmails && visitor.visitorEmails.length > 0) {
      postData.visitor.email = visitor.visitorEmails;
    }

    if (visitor.phone && visitor.phone.length > 0) {
      postData.visitor.phone = visitor.phone;
    }

    return postData;
  },

  addAgent(username) {
    check(username, String);
    const user = RocketChat.models.Users.findOneByUsername(username, {
      fields: {
        _id: 1,
        username: 1
      }
    });

    if (!user) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'livechat:addAgent'
      });
    }

    if (RocketChat.authz.addUserRoles(user._id, 'livechat-agent')) {
      RocketChat.models.Users.setOperator(user._id, true);
      RocketChat.models.Users.setLivechatStatus(user._id, 'available');
      return user;
    }

    return false;
  },

  addManager(username) {
    check(username, String);
    const user = RocketChat.models.Users.findOneByUsername(username, {
      fields: {
        _id: 1,
        username: 1
      }
    });

    if (!user) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'livechat:addManager'
      });
    }

    if (RocketChat.authz.addUserRoles(user._id, 'livechat-manager')) {
      return user;
    }

    return false;
  },

  removeAgent(username) {
    check(username, String);
    const user = RocketChat.models.Users.findOneByUsername(username, {
      fields: {
        _id: 1
      }
    });

    if (!user) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'livechat:removeAgent'
      });
    }

    if (RocketChat.authz.removeUserFromRoles(user._id, 'livechat-agent')) {
      RocketChat.models.Users.setOperator(user._id, false);
      RocketChat.models.Users.setLivechatStatus(user._id, 'not-available');
      return true;
    }

    return false;
  },

  removeManager(username) {
    check(username, String);
    const user = RocketChat.models.Users.findOneByUsername(username, {
      fields: {
        _id: 1
      }
    });

    if (!user) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'livechat:removeManager'
      });
    }

    return RocketChat.authz.removeUserFromRoles(user._id, 'livechat-manager');
  },

  saveDepartment(_id, departmentData, departmentAgents) {
    check(_id, Match.Maybe(String));
    check(departmentData, {
      enabled: Boolean,
      name: String,
      description: Match.Optional(String),
      showOnRegistration: Boolean
    });
    check(departmentAgents, [Match.ObjectIncluding({
      agentId: String,
      username: String
    })]);

    if (_id) {
      const department = RocketChat.models.LivechatDepartment.findOneById(_id);

      if (!department) {
        throw new Meteor.Error('error-department-not-found', 'Department not found', {
          method: 'livechat:saveDepartment'
        });
      }
    }

    return RocketChat.models.LivechatDepartment.createOrUpdateDepartment(_id, departmentData, departmentAgents);
  },

  removeDepartment(_id) {
    check(_id, String);
    const department = RocketChat.models.LivechatDepartment.findOneById(_id, {
      fields: {
        _id: 1
      }
    });

    if (!department) {
      throw new Meteor.Error('department-not-found', 'Department not found', {
        method: 'livechat:removeDepartment'
      });
    }

    return RocketChat.models.LivechatDepartment.removeById(_id);
  },

  showConnecting() {
    if (RocketChat.settings.get('Livechat_Routing_Method') === 'Guest_Pool') {
      return RocketChat.settings.get('Livechat_open_inquiery_show_connecting');
    } else {
      return false;
    }
  }

};
RocketChat.Livechat.stream = new Meteor.Streamer('livechat-room');
RocketChat.Livechat.stream.allowRead((roomId, extraData) => {
  const room = RocketChat.models.Rooms.findOneById(roomId);

  if (!room) {
    console.warn(`Invalid eventName: "${roomId}"`);
    return false;
  }

  if (room.t === 'l' && extraData && extraData.token && room.v.token === extraData.token) {
    return true;
  }

  return false;
});
RocketChat.settings.get('Livechat_history_monitor_type', (key, value) => {
  RocketChat.Livechat.historyMonitorType = value;
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"QueueMethods.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/lib/QueueMethods.js                                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
RocketChat.QueueMethods = {
  /* Least Amount Queuing method:
   *
   * default method where the agent with the least number
   * of open chats is paired with the incoming livechat
   */
  'Least_Amount'(guest, message, roomInfo, agent) {
    if (!agent) {
      agent = RocketChat.Livechat.getNextAgent(guest.department);

      if (!agent) {
        throw new Meteor.Error('no-agent-online', 'Sorry, no online agents');
      }
    }

    const roomCode = RocketChat.models.Rooms.getNextLivechatRoomCode();

    const room = _.extend({
      _id: message.rid,
      msgs: 1,
      lm: new Date(),
      code: roomCode,
      label: guest.name || guest.username,
      // usernames: [agent.username, guest.username],
      t: 'l',
      ts: new Date(),
      v: {
        _id: guest._id,
        username: guest.username,
        token: message.token,
        status: guest.status || 'online'
      },
      servedBy: {
        _id: agent.agentId,
        username: agent.username
      },
      cl: false,
      open: true,
      waitingResponse: true
    }, roomInfo);

    const subscriptionData = {
      rid: message.rid,
      name: guest.name || guest.username,
      alert: true,
      open: true,
      unread: 1,
      userMentions: 1,
      groupMentions: 0,
      code: roomCode,
      u: {
        _id: agent.agentId,
        username: agent.username
      },
      t: 'l',
      desktopNotifications: 'all',
      mobilePushNotifications: 'all',
      emailNotifications: 'all'
    };
    RocketChat.models.Rooms.insert(room);
    RocketChat.models.Subscriptions.insert(subscriptionData);
    RocketChat.Livechat.stream.emit(room._id, {
      type: 'agentData',
      data: RocketChat.models.Users.getAgentInfo(agent.agentId)
    });
    return room;
  },

  /* Guest Pool Queuing Method:
   *
   * An incomming livechat is created as an Inquiry
   * which is picked up from an agent.
   * An Inquiry is visible to all agents (TODO: in the correct department)
      *
   * A room is still created with the initial message, but it is occupied by
   * only the client until paired with an agent
   */
  'Guest_Pool'(guest, message, roomInfo) {
    let agents = RocketChat.Livechat.getOnlineAgents(guest.department);

    if (agents.count() === 0 && RocketChat.settings.get('Livechat_guest_pool_with_no_agents')) {
      agents = RocketChat.Livechat.getAgents(guest.department);
    }

    if (agents.count() === 0) {
      throw new Meteor.Error('no-agent-online', 'Sorry, no online agents');
    }

    const roomCode = RocketChat.models.Rooms.getNextLivechatRoomCode();
    const agentIds = [];
    agents.forEach(agent => {
      if (guest.department) {
        agentIds.push(agent.agentId);
      } else {
        agentIds.push(agent._id);
      }
    });
    const inquiry = {
      rid: message.rid,
      message: message.msg,
      name: guest.name || guest.username,
      ts: new Date(),
      code: roomCode,
      department: guest.department,
      agents: agentIds,
      status: 'open',
      v: {
        _id: guest._id,
        username: guest.username,
        token: message.token,
        status: guest.status || 'online'
      },
      t: 'l'
    };

    const room = _.extend({
      _id: message.rid,
      msgs: 1,
      lm: new Date(),
      code: roomCode,
      label: guest.name || guest.username,
      // usernames: [guest.username],
      t: 'l',
      ts: new Date(),
      v: {
        _id: guest._id,
        username: guest.username,
        token: message.token,
        status: guest.status
      },
      cl: false,
      open: true,
      waitingResponse: true
    }, roomInfo);

    RocketChat.models.LivechatInquiry.insert(inquiry);
    RocketChat.models.Rooms.insert(room);
    return room;
  },

  'External'(guest, message, roomInfo, agent) {
    return this['Least_Amount'](guest, message, roomInfo, agent); // eslint-disable-line
  }

};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"OfficeClock.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/lib/OfficeClock.js                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
// Every minute check if office closed
Meteor.setInterval(function () {
  if (RocketChat.settings.get('Livechat_enable_office_hours')) {
    if (RocketChat.models.LivechatOfficeHour.isOpeningTime()) {
      RocketChat.models.Users.openOffice();
    } else if (RocketChat.models.LivechatOfficeHour.isClosingTime()) {
      RocketChat.models.Users.closeOffice();
    }
  }
}, 60000);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"OmniChannel.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/lib/OmniChannel.js                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
const gatewayURL = 'https://omni.rocket.chat';
module.exportDefault({
  enable() {
    const result = HTTP.call('POST', `${gatewayURL}/facebook/enable`, {
      headers: {
        'authorization': `Bearer ${RocketChat.settings.get('Livechat_Facebook_API_Key')}`,
        'content-type': 'application/json'
      },
      data: {
        url: RocketChat.settings.get('Site_Url')
      }
    });
    return result.data;
  },

  disable() {
    const result = HTTP.call('DELETE', `${gatewayURL}/facebook/enable`, {
      headers: {
        'authorization': `Bearer ${RocketChat.settings.get('Livechat_Facebook_API_Key')}`,
        'content-type': 'application/json'
      }
    });
    return result.data;
  },

  listPages() {
    const result = HTTP.call('GET', `${gatewayURL}/facebook/pages`, {
      headers: {
        'authorization': `Bearer ${RocketChat.settings.get('Livechat_Facebook_API_Key')}`
      }
    });
    return result.data;
  },

  subscribe(pageId) {
    const result = HTTP.call('POST', `${gatewayURL}/facebook/page/${pageId}/subscribe`, {
      headers: {
        'authorization': `Bearer ${RocketChat.settings.get('Livechat_Facebook_API_Key')}`
      }
    });
    return result.data;
  },

  unsubscribe(pageId) {
    const result = HTTP.call('DELETE', `${gatewayURL}/facebook/page/${pageId}/subscribe`, {
      headers: {
        'authorization': `Bearer ${RocketChat.settings.get('Livechat_Facebook_API_Key')}`
      }
    });
    return result.data;
  },

  reply({
    page,
    token,
    text
  }) {
    return HTTP.call('POST', `${gatewayURL}/facebook/reply`, {
      headers: {
        'authorization': `Bearer ${RocketChat.settings.get('Livechat_Facebook_API_Key')}`
      },
      data: {
        page,
        token,
        text
      }
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"sendMessageBySMS.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/sendMessageBySMS.js                                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let LivechatVisitors;
module.watch(require("./models/LivechatVisitors"), {
  default(v) {
    LivechatVisitors = v;
  }

}, 0);
RocketChat.callbacks.add('afterSaveMessage', function (message, room) {
  // skips this callback if the message was edited
  if (message.editedAt) {
    return message;
  }

  if (!RocketChat.SMS.enabled) {
    return message;
  } // only send the sms by SMS if it is a livechat room with SMS set to true


  if (!(typeof room.t !== 'undefined' && room.t === 'l' && room.sms && room.v && room.v.token)) {
    return message;
  } // if the message has a token, it was sent from the visitor, so ignore it


  if (message.token) {
    return message;
  } // if the message has a type means it is a special message (like the closing comment), so skips


  if (message.t) {
    return message;
  }

  const SMSService = RocketChat.SMS.getService(RocketChat.settings.get('SMS_Service'));

  if (!SMSService) {
    return message;
  }

  const visitor = LivechatVisitors.getVisitorByToken(room.v.token);

  if (!visitor || !visitor.phone || visitor.phone.length === 0) {
    return message;
  }

  SMSService.send(room.sms.from, visitor.phone[0].phoneNumber, message.msg);
  return message;
}, RocketChat.callbacks.priority.LOW, 'sendMessageBySms');
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"unclosedLivechats.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/unclosedLivechats.js                                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/* globals UserPresenceMonitor */
let agentsHandler;
let monitorAgents = false;
let actionTimeout = 60000;
const onlineAgents = {
  users: {},
  queue: {},

  add(userId) {
    if (this.queue[userId]) {
      clearTimeout(this.queue[userId]);
      delete this.queue[userId];
    }

    this.users[userId] = 1;
  },

  remove(userId, callback) {
    if (this.queue[userId]) {
      clearTimeout(this.queue[userId]);
    }

    this.queue[userId] = setTimeout(Meteor.bindEnvironment(() => {
      callback();
      delete this.users[userId];
      delete this.queue[userId];
    }), actionTimeout);
  },

  exists(userId) {
    return !!this.users[userId];
  }

};

function runAgentLeaveAction(userId) {
  const action = RocketChat.settings.get('Livechat_agent_leave_action');

  if (action === 'close') {
    return RocketChat.Livechat.closeOpenChats(userId, RocketChat.settings.get('Livechat_agent_leave_comment'));
  } else if (action === 'forward') {
    return RocketChat.Livechat.forwardOpenChats(userId);
  }
}

RocketChat.settings.get('Livechat_agent_leave_action_timeout', function (key, value) {
  actionTimeout = value * 1000;
});
RocketChat.settings.get('Livechat_agent_leave_action', function (key, value) {
  monitorAgents = value;

  if (value !== 'none') {
    if (!agentsHandler) {
      agentsHandler = RocketChat.models.Users.findOnlineAgents().observeChanges({
        added(id) {
          onlineAgents.add(id);
        },

        changed(id, fields) {
          if (fields.statusLivechat && fields.statusLivechat === 'not-available') {
            onlineAgents.remove(id, () => {
              runAgentLeaveAction(id);
            });
          } else {
            onlineAgents.add(id);
          }
        },

        removed(id) {
          onlineAgents.remove(id, () => {
            runAgentLeaveAction(id);
          });
        }

      });
    }
  } else if (agentsHandler) {
    agentsHandler.stop();
    agentsHandler = null;
  }
});
UserPresenceMonitor.onSetUserStatus((user, status
/*, statusConnection*/
) => {
  if (!monitorAgents) {
    return;
  }

  if (onlineAgents.exists(user._id)) {
    if (status === 'offline' || user.statusLivechat === 'not-available') {
      onlineAgents.remove(user._id, () => {
        runAgentLeaveAction(user._id);
      });
    }
  }
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"publications":{"customFields.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/publications/customFields.js                                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let s;
module.watch(require("underscore.string"), {
  default(v) {
    s = v;
  }

}, 0);
Meteor.publish('livechat:customFields', function (_id) {
  if (!this.userId) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:customFields'
    }));
  }

  if (!RocketChat.authz.hasPermission(this.userId, 'view-l-room')) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:customFields'
    }));
  }

  if (s.trim(_id)) {
    return RocketChat.models.LivechatCustomField.find({
      _id
    });
  }

  return RocketChat.models.LivechatCustomField.find();
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"departmentAgents.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/publications/departmentAgents.js                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.publish('livechat:departmentAgents', function (departmentId) {
  if (!this.userId) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:departmentAgents'
    }));
  }

  if (!RocketChat.authz.hasPermission(this.userId, 'view-livechat-rooms')) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:departmentAgents'
    }));
  }

  return RocketChat.models.LivechatDepartmentAgents.find({
    departmentId
  });
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"externalMessages.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/publications/externalMessages.js                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.publish('livechat:externalMessages', function (roomId) {
  return RocketChat.models.LivechatExternalMessage.findByRoomId(roomId);
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"livechatAgents.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/publications/livechatAgents.js                                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.publish('livechat:agents', function () {
  if (!this.userId) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:agents'
    }));
  }

  if (!RocketChat.authz.hasPermission(this.userId, 'view-l-room')) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:agents'
    }));
  }

  const self = this;
  const handle = RocketChat.authz.getUsersInRole('livechat-agent').observeChanges({
    added(id, fields) {
      self.added('agentUsers', id, fields);
    },

    changed(id, fields) {
      self.changed('agentUsers', id, fields);
    },

    removed(id) {
      self.removed('agentUsers', id);
    }

  });
  self.ready();
  self.onStop(function () {
    handle.stop();
  });
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"livechatAppearance.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/publications/livechatAppearance.js                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.publish('livechat:appearance', function () {
  if (!this.userId) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:appearance'
    }));
  }

  if (!RocketChat.authz.hasPermission(this.userId, 'view-livechat-manager')) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:appearance'
    }));
  }

  const query = {
    _id: {
      $in: ['Livechat_title', 'Livechat_title_color', 'Livechat_show_agent_email', 'Livechat_display_offline_form', 'Livechat_offline_form_unavailable', 'Livechat_offline_message', 'Livechat_offline_success_message', 'Livechat_offline_title', 'Livechat_offline_title_color', 'Livechat_offline_email', 'Livechat_conversation_finished_message']
    }
  };
  const self = this;
  const handle = RocketChat.models.Settings.find(query).observeChanges({
    added(id, fields) {
      self.added('livechatAppearance', id, fields);
    },

    changed(id, fields) {
      self.changed('livechatAppearance', id, fields);
    },

    removed(id) {
      self.removed('livechatAppearance', id);
    }

  });
  this.ready();
  this.onStop(() => {
    handle.stop();
  });
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"livechatDepartments.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/publications/livechatDepartments.js                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.publish('livechat:departments', function (_id) {
  if (!this.userId) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:agents'
    }));
  }

  if (!RocketChat.authz.hasPermission(this.userId, 'view-l-room')) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:agents'
    }));
  }

  if (_id !== undefined) {
    return RocketChat.models.LivechatDepartment.findByDepartmentId(_id);
  } else {
    return RocketChat.models.LivechatDepartment.find();
  }
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"livechatIntegration.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/publications/livechatIntegration.js                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.publish('livechat:integration', function () {
  if (!this.userId) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:integration'
    }));
  }

  if (!RocketChat.authz.hasPermission(this.userId, 'view-livechat-manager')) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:integration'
    }));
  }

  const self = this;
  const handle = RocketChat.models.Settings.findByIds(['Livechat_webhookUrl', 'Livechat_secret_token', 'Livechat_webhook_on_close', 'Livechat_webhook_on_offline_msg', 'Livechat_webhook_on_visitor_message', 'Livechat_webhook_on_agent_message']).observeChanges({
    added(id, fields) {
      self.added('livechatIntegration', id, fields);
    },

    changed(id, fields) {
      self.changed('livechatIntegration', id, fields);
    },

    removed(id) {
      self.removed('livechatIntegration', id);
    }

  });
  self.ready();
  self.onStop(function () {
    handle.stop();
  });
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"livechatManagers.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/publications/livechatManagers.js                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.publish('livechat:managers', function () {
  if (!this.userId) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:managers'
    }));
  }

  if (!RocketChat.authz.hasPermission(this.userId, 'view-livechat-rooms')) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:managers'
    }));
  }

  const self = this;
  const handle = RocketChat.authz.getUsersInRole('livechat-manager').observeChanges({
    added(id, fields) {
      self.added('managerUsers', id, fields);
    },

    changed(id, fields) {
      self.changed('managerUsers', id, fields);
    },

    removed(id) {
      self.removed('managerUsers', id);
    }

  });
  self.ready();
  self.onStop(function () {
    handle.stop();
  });
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"livechatRooms.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/publications/livechatRooms.js                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.publish('livechat:rooms', function (filter = {}, offset = 0, limit = 20) {
  if (!this.userId) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:rooms'
    }));
  }

  if (!RocketChat.authz.hasPermission(this.userId, 'view-livechat-rooms')) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:rooms'
    }));
  }

  check(filter, {
    name: Match.Maybe(String),
    // room name to filter
    agent: Match.Maybe(String),
    // agent _id who is serving
    status: Match.Maybe(String),
    // either 'opened' or 'closed'
    from: Match.Maybe(Date),
    to: Match.Maybe(Date)
  });
  const query = {};

  if (filter.name) {
    query.label = new RegExp(filter.name, 'i');
  }

  if (filter.agent) {
    query['servedBy._id'] = filter.agent;
  }

  if (filter.status) {
    if (filter.status === 'opened') {
      query.open = true;
    } else {
      query.open = {
        $exists: false
      };
    }
  }

  if (filter.from) {
    query.ts = {
      $gte: filter.from
    };
  }

  if (filter.to) {
    filter.to.setDate(filter.to.getDate() + 1);
    filter.to.setSeconds(filter.to.getSeconds() - 1);

    if (!query.ts) {
      query.ts = {};
    }

    query.ts.$lte = filter.to;
  }

  const self = this;
  const handle = RocketChat.models.Rooms.findLivechat(query, offset, limit).observeChanges({
    added(id, fields) {
      self.added('livechatRoom', id, fields);
    },

    changed(id, fields) {
      self.changed('livechatRoom', id, fields);
    },

    removed(id) {
      self.removed('livechatRoom', id);
    }

  });
  this.ready();
  this.onStop(() => {
    handle.stop();
  });
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"livechatQueue.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/publications/livechatQueue.js                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.publish('livechat:queue', function () {
  if (!this.userId) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:queue'
    }));
  }

  if (!RocketChat.authz.hasPermission(this.userId, 'view-l-room')) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:queue'
    }));
  } // let sort = { count: 1, sort: 1, username: 1 };
  // let onlineUsers = {};
  // let handleUsers = RocketChat.models.Users.findOnlineAgents().observeChanges({
  // 	added(id, fields) {
  // 		onlineUsers[fields.username] = 1;
  // 		// this.added('livechatQueueUser', id, fields);
  // 	},
  // 	changed(id, fields) {
  // 		onlineUsers[fields.username] = 1;
  // 		// this.changed('livechatQueueUser', id, fields);
  // 	},
  // 	removed(id) {
  // 		this.removed('livechatQueueUser', id);
  // 	}
  // });


  const self = this;
  const handleDepts = RocketChat.models.LivechatDepartmentAgents.findUsersInQueue().observeChanges({
    added(id, fields) {
      self.added('livechatQueueUser', id, fields);
    },

    changed(id, fields) {
      self.changed('livechatQueueUser', id, fields);
    },

    removed(id) {
      self.removed('livechatQueueUser', id);
    }

  });
  this.ready();
  this.onStop(() => {
    // handleUsers.stop();
    handleDepts.stop();
  });
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"livechatTriggers.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/publications/livechatTriggers.js                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.publish('livechat:triggers', function (_id) {
  if (!this.userId) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:triggers'
    }));
  }

  if (!RocketChat.authz.hasPermission(this.userId, 'view-livechat-manager')) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:triggers'
    }));
  }

  if (_id !== undefined) {
    return RocketChat.models.LivechatTrigger.findById(_id);
  } else {
    return RocketChat.models.LivechatTrigger.find();
  }
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"visitorHistory.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/publications/visitorHistory.js                                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.publish('livechat:visitorHistory', function ({
  rid: roomId
}) {
  if (!this.userId) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:visitorHistory'
    }));
  }

  if (!RocketChat.authz.hasPermission(this.userId, 'view-l-room')) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:visitorHistory'
    }));
  }

  const room = RocketChat.models.Rooms.findOneById(roomId);
  const user = RocketChat.models.Users.findOneById(this.userId);

  if (room.usernames.indexOf(user.username) === -1) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:visitorHistory'
    }));
  }

  if (room && room.v && room.v._id) {
    // CACHE: can we stop using publications here?
    return RocketChat.models.Rooms.findByVisitorId(room.v._id);
  } else {
    return this.ready();
  }
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"visitorInfo.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/publications/visitorInfo.js                                                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let LivechatVisitors;
module.watch(require("../models/LivechatVisitors"), {
  default(v) {
    LivechatVisitors = v;
  }

}, 0);
Meteor.publish('livechat:visitorInfo', function ({
  rid: roomId
}) {
  if (!this.userId) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:visitorInfo'
    }));
  }

  if (!RocketChat.authz.hasPermission(this.userId, 'view-l-room')) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:visitorInfo'
    }));
  }

  const room = RocketChat.models.Rooms.findOneById(roomId);

  if (room && room.v && room.v._id) {
    return LivechatVisitors.findById(room.v._id);
  } else {
    return this.ready();
  }
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"visitorPageVisited.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/publications/visitorPageVisited.js                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.publish('livechat:visitorPageVisited', function ({
  rid: roomId
}) {
  if (!this.userId) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:visitorPageVisited'
    }));
  }

  if (!RocketChat.authz.hasPermission(this.userId, 'view-l-room')) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:visitorPageVisited'
    }));
  }

  const room = RocketChat.models.Rooms.findOneById(roomId);

  if (room && room.v && room.v.token) {
    return RocketChat.models.LivechatPageVisited.findByToken(room.v.token);
  } else {
    return this.ready();
  }
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"livechatInquiries.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/publications/livechatInquiries.js                                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.publish('livechat:inquiry', function () {
  if (!this.userId) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:inquiry'
    }));
  }

  if (!RocketChat.authz.hasPermission(this.userId, 'view-l-room')) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:inquiry'
    }));
  }

  const query = {
    agents: this.userId,
    status: 'open'
  };
  return RocketChat.models.LivechatInquiry.find(query);
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"livechatOfficeHours.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/publications/livechatOfficeHours.js                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.publish('livechat:officeHour', function () {
  if (!RocketChat.authz.hasPermission(this.userId, 'view-l-room')) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:agents'
    }));
  }

  return RocketChat.models.LivechatOfficeHour.find();
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"api.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/api.js                                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.watch(require("../imports/server/rest/departments.js"));
module.watch(require("../imports/server/rest/facebook.js"));
module.watch(require("../imports/server/rest/sms.js"));
module.watch(require("../imports/server/rest/users.js"));
module.watch(require("../imports/server/rest/messages.js"));
module.watch(require("../imports/server/rest/visitors.js"));
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"permissions.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/permissions.js                                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
Meteor.startup(() => {
  const roles = _.pluck(RocketChat.models.Roles.find().fetch(), 'name');

  if (roles.indexOf('livechat-agent') === -1) {
    RocketChat.models.Roles.createOrUpdate('livechat-agent');
  }

  if (roles.indexOf('livechat-manager') === -1) {
    RocketChat.models.Roles.createOrUpdate('livechat-manager');
  }

  if (roles.indexOf('livechat-guest') === -1) {
    RocketChat.models.Roles.createOrUpdate('livechat-guest');
  }

  if (RocketChat.models && RocketChat.models.Permissions) {
    RocketChat.models.Permissions.createOrUpdate('view-l-room', ['livechat-agent', 'livechat-manager', 'admin']);
    RocketChat.models.Permissions.createOrUpdate('view-livechat-manager', ['livechat-manager', 'admin']);
    RocketChat.models.Permissions.createOrUpdate('view-livechat-rooms', ['livechat-manager', 'admin']);
    RocketChat.models.Permissions.createOrUpdate('close-livechat-room', ['livechat-agent', 'livechat-manager', 'admin']);
    RocketChat.models.Permissions.createOrUpdate('close-others-livechat-room', ['livechat-manager', 'admin']);
    RocketChat.models.Permissions.createOrUpdate('save-others-livechat-room-info', ['livechat-manager']);
  }
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"messageTypes.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/messageTypes.js                                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.MessageTypes.registerType({
  id: 'livechat_video_call',
  system: true,
  message: 'New_videocall_request'
});
RocketChat.actionLinks.register('createLivechatCall', function (message, params, instance) {
  if (Meteor.isClient) {
    instance.tabBar.open('video');
  }
});
RocketChat.actionLinks.register('denyLivechatCall', function (message
/*, params*/
) {
  if (Meteor.isServer) {
    const user = Meteor.user();
    RocketChat.models.Messages.createWithTypeRoomIdMessageAndUser('command', message.rid, 'endCall', user);
    RocketChat.Notifications.notifyRoom(message.rid, 'deleteMessage', {
      _id: message._id
    });
    const language = user.language || RocketChat.settings.get('language') || 'en';
    RocketChat.Livechat.closeRoom({
      user,
      room: RocketChat.models.Rooms.findOneById(message.rid),
      comment: TAPi18n.__('Videocall_declined', {
        lng: language
      })
    });
    Meteor.defer(() => {
      RocketChat.models.Messages.setHiddenById(message._id);
    });
  }
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"roomType.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/roomType.js                                                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let RoomSettingsEnum, RoomTypeConfig, RoomTypeRouteConfig, UiTextContext;
module.watch(require("meteor/rocketchat:lib"), {
  RoomSettingsEnum(v) {
    RoomSettingsEnum = v;
  },

  RoomTypeConfig(v) {
    RoomTypeConfig = v;
  },

  RoomTypeRouteConfig(v) {
    RoomTypeRouteConfig = v;
  },

  UiTextContext(v) {
    UiTextContext = v;
  }

}, 0);

class LivechatRoomRoute extends RoomTypeRouteConfig {
  constructor() {
    super({
      name: 'live',
      path: '/live/:code(\\d+)'
    });
  }

  action(params) {
    openRoom('l', params.code);
  }

  link(sub) {
    return {
      code: sub.code
    };
  }

}

class LivechatRoomType extends RoomTypeConfig {
  constructor() {
    super({
      identifier: 'l',
      order: 5,
      // icon: 'livechat',
      label: 'Livechat',
      route: new LivechatRoomRoute()
    });
    this.notSubscribedTpl = {
      template: 'livechatNotSubscribed'
    };
  }

  findRoom(identifier) {
    return ChatRoom.findOne({
      code: parseInt(identifier)
    });
  }

  roomName(roomData) {
    if (!roomData.name) {
      return roomData.label;
    } else {
      return roomData.name;
    }
  }

  condition() {
    return RocketChat.settings.get('Livechat_enabled') && RocketChat.authz.hasAllPermission('view-l-room');
  }

  canSendMessage(roomId) {
    const room = ChatRoom.findOne({
      _id: roomId
    }, {
      fields: {
        open: 1
      }
    });
    return room && room.open === true;
  }

  getUserStatus(roomId) {
    const room = Session.get(`roomData${roomId}`);

    if (room) {
      return room.v && room.v.status;
    }

    const inquiry = LivechatInquiry.findOne({
      rid: roomId
    });
    return inquiry && inquiry.v && inquiry.v.status;
  }

  allowRoomSettingChange(room, setting) {
    switch (setting) {
      case RoomSettingsEnum.JOIN_CODE:
        return false;

      default:
        return true;
    }
  }

  getUiText(context) {
    switch (context) {
      case UiTextContext.HIDE_WARNING:
        return 'Hide_Livechat_Warning';

      case UiTextContext.LEAVE_WARNING:
        return 'Hide_Livechat_Warning';

      default:
        return '';
    }
  }

}

RocketChat.roomTypes.add(new LivechatRoomType());
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"config.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/config.js                                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.startup(function () {
  RocketChat.settings.addGroup('Livechat');
  RocketChat.settings.add('Livechat_enabled', false, {
    type: 'boolean',
    group: 'Livechat',
    public: true
  });
  RocketChat.settings.add('Livechat_title', 'Rocket.Chat', {
    type: 'string',
    group: 'Livechat',
    public: true
  });
  RocketChat.settings.add('Livechat_title_color', '#C1272D', {
    type: 'color',
    group: 'Livechat',
    public: true
  });
  RocketChat.settings.add('Livechat_display_offline_form', true, {
    type: 'boolean',
    group: 'Livechat',
    public: true,
    section: 'Offline',
    i18nLabel: 'Display_offline_form'
  });
  RocketChat.settings.add('Livechat_validate_offline_email', true, {
    type: 'boolean',
    group: 'Livechat',
    public: true,
    section: 'Offline',
    i18nLabel: 'Validate_email_address'
  });
  RocketChat.settings.add('Livechat_offline_form_unavailable', '', {
    type: 'string',
    group: 'Livechat',
    public: true,
    section: 'Offline',
    i18nLabel: 'Offline_form_unavailable_message'
  });
  RocketChat.settings.add('Livechat_offline_title', 'Leave a message', {
    type: 'string',
    group: 'Livechat',
    public: true,
    section: 'Offline',
    i18nLabel: 'Title'
  });
  RocketChat.settings.add('Livechat_offline_title_color', '#666666', {
    type: 'color',
    group: 'Livechat',
    public: true,
    section: 'Offline',
    i18nLabel: 'Color'
  });
  RocketChat.settings.add('Livechat_offline_message', '', {
    type: 'string',
    group: 'Livechat',
    public: true,
    section: 'Offline',
    i18nLabel: 'Instructions',
    i18nDescription: 'Instructions_to_your_visitor_fill_the_form_to_send_a_message'
  });
  RocketChat.settings.add('Livechat_offline_email', '', {
    type: 'string',
    group: 'Livechat',
    i18nLabel: 'Email_address_to_send_offline_messages',
    section: 'Offline'
  });
  RocketChat.settings.add('Livechat_offline_success_message', '', {
    type: 'string',
    group: 'Livechat',
    public: true,
    section: 'Offline',
    i18nLabel: 'Offline_success_message'
  });
  RocketChat.settings.add('Livechat_registration_form', true, {
    type: 'boolean',
    group: 'Livechat',
    public: true,
    i18nLabel: 'Show_preregistration_form'
  });
  RocketChat.settings.add('Livechat_allow_switching_departments', true, {
    type: 'boolean',
    group: 'Livechat',
    public: true,
    i18nLabel: 'Allow_switching_departments'
  });
  RocketChat.settings.add('Livechat_show_agent_email', true, {
    type: 'boolean',
    group: 'Livechat',
    public: true,
    i18nLabel: 'Show_agent_email'
  });
  RocketChat.settings.add('Livechat_conversation_finished_message', '', {
    type: 'string',
    group: 'Livechat',
    public: true,
    i18nLabel: 'Conversation_finished_message'
  });
  RocketChat.settings.add('Livechat_guest_count', 1, {
    type: 'int',
    group: 'Livechat'
  });
  RocketChat.settings.add('Livechat_Room_Count', 1, {
    type: 'int',
    group: 'Livechat',
    i18nLabel: 'Livechat_room_count'
  });
  RocketChat.settings.add('Livechat_agent_leave_action', 'none', {
    type: 'select',
    group: 'Livechat',
    values: [{
      key: 'none',
      i18nLabel: 'None'
    }, {
      key: 'forward',
      i18nLabel: 'Forward'
    }, {
      key: 'close',
      i18nLabel: 'Close'
    }],
    i18nLabel: 'How_to_handle_open_sessions_when_agent_goes_offline'
  });
  RocketChat.settings.add('Livechat_agent_leave_action_timeout', 60, {
    type: 'int',
    group: 'Livechat',
    enableQuery: {
      _id: 'Livechat_agent_leave_action',
      value: {
        $ne: 'none'
      }
    },
    i18nLabel: 'How_long_to_wait_after_agent_goes_offline',
    i18nDescription: 'Time_in_seconds'
  });
  RocketChat.settings.add('Livechat_agent_leave_comment', '', {
    type: 'string',
    group: 'Livechat',
    enableQuery: {
      _id: 'Livechat_agent_leave_action',
      value: 'close'
    },
    i18nLabel: 'Comment_to_leave_on_closing_session'
  });
  RocketChat.settings.add('Livechat_webhookUrl', false, {
    type: 'string',
    group: 'Livechat',
    section: 'CRM_Integration',
    i18nLabel: 'Webhook_URL'
  });
  RocketChat.settings.add('Livechat_secret_token', false, {
    type: 'string',
    group: 'Livechat',
    section: 'CRM_Integration',
    i18nLabel: 'Secret_token'
  });
  RocketChat.settings.add('Livechat_webhook_on_close', false, {
    type: 'boolean',
    group: 'Livechat',
    section: 'CRM_Integration',
    i18nLabel: 'Send_request_on_chat_close'
  });
  RocketChat.settings.add('Livechat_webhook_on_offline_msg', false, {
    type: 'boolean',
    group: 'Livechat',
    section: 'CRM_Integration',
    i18nLabel: 'Send_request_on_offline_messages'
  });
  RocketChat.settings.add('Livechat_webhook_on_visitor_message', false, {
    type: 'boolean',
    group: 'Livechat',
    section: 'CRM_Integration',
    i18nLabel: 'Send_request_on_visitor_message'
  });
  RocketChat.settings.add('Livechat_webhook_on_agent_message', false, {
    type: 'boolean',
    group: 'Livechat',
    section: 'CRM_Integration',
    i18nLabel: 'Send_request_on_agent_message'
  });
  RocketChat.settings.add('Livechat_webhook_on_capture', false, {
    type: 'boolean',
    group: 'Livechat',
    section: 'CRM_Integration',
    i18nLabel: 'Send_request_on_lead_capture'
  });
  RocketChat.settings.add('Livechat_lead_email_regex', '\\b[A-Z0-9._%+-]+@(?:[A-Z0-9-]+\\.)+[A-Z]{2,4}\\b', {
    type: 'string',
    group: 'Livechat',
    section: 'CRM_Integration',
    i18nLabel: 'Lead_capture_email_regex'
  });
  RocketChat.settings.add('Livechat_lead_phone_regex', '((?:\\([0-9]{1,3}\\)|[0-9]{2})[ \\-]*?[0-9]{4,5}(?:[\\-\\s\\_]{1,2})?[0-9]{4}(?:(?=[^0-9])|$)|[0-9]{4,5}(?:[\\-\\s\\_]{1,2})?[0-9]{4}(?:(?=[^0-9])|$))', {
    type: 'string',
    group: 'Livechat',
    section: 'CRM_Integration',
    i18nLabel: 'Lead_capture_phone_regex'
  });
  RocketChat.settings.add('Livechat_Knowledge_Enabled', false, {
    type: 'boolean',
    group: 'Livechat',
    section: 'Knowledge_Base',
    public: true,
    i18nLabel: 'Enabled'
  });
  RocketChat.settings.add('Livechat_Knowledge_Apiai_Key', '', {
    type: 'string',
    group: 'Livechat',
    section: 'Knowledge_Base',
    public: true,
    i18nLabel: 'Apiai_Key'
  });
  RocketChat.settings.add('Livechat_Knowledge_Apiai_Language', 'en', {
    type: 'string',
    group: 'Livechat',
    section: 'Knowledge_Base',
    public: true,
    i18nLabel: 'Apiai_Language'
  });
  RocketChat.settings.add('Livechat_history_monitor_type', 'url', {
    type: 'select',
    group: 'Livechat',
    i18nLabel: 'Monitor_history_for_changes_on',
    values: [{
      key: 'url',
      i18nLabel: 'Page_URL'
    }, {
      key: 'title',
      i18nLabel: 'Page_title'
    }]
  });
  RocketChat.settings.add('Livechat_enable_office_hours', false, {
    type: 'boolean',
    group: 'Livechat',
    public: true,
    i18nLabel: 'Office_hours_enabled'
  });
  RocketChat.settings.add('Livechat_videocall_enabled', false, {
    type: 'boolean',
    group: 'Livechat',
    public: true,
    i18nLabel: 'Videocall_enabled',
    i18nDescription: 'Beta_feature_Depends_on_Video_Conference_to_be_enabled',
    enableQuery: {
      _id: 'Jitsi_Enabled',
      value: true
    }
  });
  RocketChat.settings.add('Livechat_enable_transcript', false, {
    type: 'boolean',
    group: 'Livechat',
    public: true,
    i18nLabel: 'Transcript_Enabled'
  });
  RocketChat.settings.add('Livechat_transcript_message', '', {
    type: 'string',
    group: 'Livechat',
    public: true,
    i18nLabel: 'Transcript_message',
    enableQuery: {
      _id: 'Livechat_enable_transcript',
      value: true
    }
  });
  RocketChat.settings.add('Livechat_open_inquiery_show_connecting', false, {
    type: 'boolean',
    group: 'Livechat',
    public: true,
    i18nLabel: 'Livechat_open_inquiery_show_connecting',
    enableQuery: {
      _id: 'Livechat_Routing_Method',
      value: 'Guest_Pool'
    }
  });
  RocketChat.settings.add('Livechat_AllowedDomainsList', '', {
    type: 'string',
    group: 'Livechat',
    public: true,
    i18nLabel: 'Livechat_AllowedDomainsList',
    i18nDescription: 'Domains_allowed_to_embed_the_livechat_widget'
  });
  RocketChat.settings.add('Livechat_Facebook_Enabled', false, {
    type: 'boolean',
    group: 'Livechat',
    section: 'Facebook'
  });
  RocketChat.settings.add('Livechat_Facebook_API_Key', '', {
    type: 'string',
    group: 'Livechat',
    section: 'Facebook',
    i18nDescription: 'If_you_dont_have_one_send_an_email_to_omni_rocketchat_to_get_yours'
  });
  RocketChat.settings.add('Livechat_Facebook_API_Secret', '', {
    type: 'string',
    group: 'Livechat',
    section: 'Facebook',
    i18nDescription: 'If_you_dont_have_one_send_an_email_to_omni_rocketchat_to_get_yours'
  });
  RocketChat.settings.add('Livechat_RDStation_Token', '', {
    type: 'string',
    group: 'Livechat',
    public: false,
    section: 'RD Station',
    i18nLabel: 'RDStation_Token'
  });
  RocketChat.settings.add('Livechat_Routing_Method', 'Least_Amount', {
    type: 'select',
    group: 'Livechat',
    public: true,
    section: 'Routing',
    values: [{
      key: 'External',
      i18nLabel: 'External_Service'
    }, {
      key: 'Least_Amount',
      i18nLabel: 'Least_Amount'
    }, {
      key: 'Guest_Pool',
      i18nLabel: 'Guest_Pool'
    }]
  });
  RocketChat.settings.add('Livechat_guest_pool_with_no_agents', false, {
    type: 'boolean',
    group: 'Livechat',
    section: 'Routing',
    i18nLabel: 'Accept_with_no_online_agents',
    i18nDescription: 'Accept_incoming_livechat_requests_even_if_there_are_no_online_agents',
    enableQuery: {
      _id: 'Livechat_Routing_Method',
      value: 'Guest_Pool'
    }
  });
  RocketChat.settings.add('Livechat_show_queue_list_link', false, {
    type: 'boolean',
    group: 'Livechat',
    public: true,
    section: 'Routing',
    i18nLabel: 'Show_queue_list_to_all_agents',
    enableQuery: {
      _id: 'Livechat_Routing_Method',
      value: {
        $ne: 'External'
      }
    }
  });
  RocketChat.settings.add('Livechat_External_Queue_URL', '', {
    type: 'string',
    group: 'Livechat',
    public: false,
    section: 'Routing',
    i18nLabel: 'External_Queue_Service_URL',
    i18nDescription: 'For_more_details_please_check_our_docs',
    enableQuery: {
      _id: 'Livechat_Routing_Method',
      value: 'External'
    }
  });
  RocketChat.settings.add('Livechat_External_Queue_Token', '', {
    type: 'string',
    group: 'Livechat',
    public: false,
    section: 'Routing',
    i18nLabel: 'Secret_token',
    enableQuery: {
      _id: 'Livechat_Routing_Method',
      value: 'External'
    }
  });
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"imports":{"server":{"rest":{"departments.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/imports/server/rest/departments.js                                                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.API.v1.addRoute('livechat/department', {
  authRequired: true
}, {
  get() {
    if (!RocketChat.authz.hasPermission(this.userId, 'view-livechat-manager')) {
      return RocketChat.API.v1.unauthorized();
    }

    return RocketChat.API.v1.success({
      departments: RocketChat.models.LivechatDepartment.find().fetch()
    });
  },

  post() {
    if (!RocketChat.authz.hasPermission(this.userId, 'view-livechat-manager')) {
      return RocketChat.API.v1.unauthorized();
    }

    try {
      check(this.bodyParams, {
        department: Object,
        agents: Array
      });
      const department = RocketChat.Livechat.saveDepartment(null, this.bodyParams.department, this.bodyParams.agents);

      if (department) {
        return RocketChat.API.v1.success({
          department,
          agents: RocketChat.models.LivechatDepartmentAgents.find({
            departmentId: department._id
          }).fetch()
        });
      }

      RocketChat.API.v1.failure();
    } catch (e) {
      return RocketChat.API.v1.failure(e);
    }
  }

});
RocketChat.API.v1.addRoute('livechat/department/:_id', {
  authRequired: true
}, {
  get() {
    if (!RocketChat.authz.hasPermission(this.userId, 'view-livechat-manager')) {
      return RocketChat.API.v1.unauthorized();
    }

    try {
      check(this.urlParams, {
        _id: String
      });
      return RocketChat.API.v1.success({
        department: RocketChat.models.LivechatDepartment.findOneById(this.urlParams._id),
        agents: RocketChat.models.LivechatDepartmentAgents.find({
          departmentId: this.urlParams._id
        }).fetch()
      });
    } catch (e) {
      return RocketChat.API.v1.failure(e.error);
    }
  },

  put() {
    if (!RocketChat.authz.hasPermission(this.userId, 'view-livechat-manager')) {
      return RocketChat.API.v1.unauthorized();
    }

    try {
      check(this.urlParams, {
        _id: String
      });
      check(this.bodyParams, {
        department: Object,
        agents: Array
      });

      if (RocketChat.Livechat.saveDepartment(this.urlParams._id, this.bodyParams.department, this.bodyParams.agents)) {
        return RocketChat.API.v1.success({
          department: RocketChat.models.LivechatDepartment.findOneById(this.urlParams._id),
          agents: RocketChat.models.LivechatDepartmentAgents.find({
            departmentId: this.urlParams._id
          }).fetch()
        });
      }

      return RocketChat.API.v1.failure();
    } catch (e) {
      return RocketChat.API.v1.failure(e.error);
    }
  },

  delete() {
    if (!RocketChat.authz.hasPermission(this.userId, 'view-livechat-manager')) {
      return RocketChat.API.v1.unauthorized();
    }

    try {
      check(this.urlParams, {
        _id: String
      });

      if (RocketChat.Livechat.removeDepartment(this.urlParams._id)) {
        return RocketChat.API.v1.success();
      }

      return RocketChat.API.v1.failure();
    } catch (e) {
      return RocketChat.API.v1.failure(e.error);
    }
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"facebook.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/imports/server/rest/facebook.js                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let crypto;
module.watch(require("crypto"), {
  default(v) {
    crypto = v;
  }

}, 0);
let LivechatVisitors;
module.watch(require("../../../server/models/LivechatVisitors"), {
  default(v) {
    LivechatVisitors = v;
  }

}, 1);

/**
 * @api {post} /livechat/facebook Send Facebook message
 * @apiName Facebook
 * @apiGroup Livechat
 *
 * @apiParam {String} mid Facebook message id
 * @apiParam {String} page Facebook pages id
 * @apiParam {String} token Facebook user's token
 * @apiParam {String} first_name Facebook user's first name
 * @apiParam {String} last_name Facebook user's last name
 * @apiParam {String} [text] Facebook message text
 * @apiParam {String} [attachments] Facebook message attachments
 */
RocketChat.API.v1.addRoute('livechat/facebook', {
  post() {
    if (!this.bodyParams.text && !this.bodyParams.attachments) {
      return {
        success: false
      };
    }

    if (!this.request.headers['x-hub-signature']) {
      return {
        success: false
      };
    }

    if (!RocketChat.settings.get('Livechat_Facebook_Enabled')) {
      return {
        success: false,
        error: 'Integration disabled'
      };
    } // validate if request come from omni


    const signature = crypto.createHmac('sha1', RocketChat.settings.get('Livechat_Facebook_API_Secret')).update(JSON.stringify(this.request.body)).digest('hex');

    if (this.request.headers['x-hub-signature'] !== `sha1=${signature}`) {
      return {
        success: false,
        error: 'Invalid signature'
      };
    }

    const sendMessage = {
      message: {
        _id: this.bodyParams.mid
      },
      roomInfo: {
        facebook: {
          page: this.bodyParams.page
        }
      }
    };
    let visitor = LivechatVisitors.getVisitorByToken(this.bodyParams.token);

    if (visitor) {
      const rooms = RocketChat.models.Rooms.findOpenByVisitorToken(visitor.token).fetch();

      if (rooms && rooms.length > 0) {
        sendMessage.message.rid = rooms[0]._id;
      } else {
        sendMessage.message.rid = Random.id();
      }

      sendMessage.message.token = visitor.token;
    } else {
      sendMessage.message.rid = Random.id();
      sendMessage.message.token = this.bodyParams.token;
      const userId = RocketChat.Livechat.registerGuest({
        token: sendMessage.message.token,
        name: `${this.bodyParams.first_name} ${this.bodyParams.last_name}`
      });
      visitor = RocketChat.models.Users.findOneById(userId);
    }

    sendMessage.message.msg = this.bodyParams.text;
    sendMessage.guest = visitor;

    try {
      return {
        sucess: true,
        message: RocketChat.Livechat.sendMessage(sendMessage)
      };
    } catch (e) {
      console.error('Error using Facebook ->', e);
    }
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"messages.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/imports/server/rest/messages.js                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let LivechatVisitors;
module.watch(require("../../../server/models/LivechatVisitors"), {
  default(v) {
    LivechatVisitors = v;
  }

}, 0);
RocketChat.API.v1.addRoute('livechat/messages', {
  authRequired: true
}, {
  post() {
    if (!RocketChat.authz.hasPermission(this.userId, 'view-livechat-manager')) {
      return RocketChat.API.v1.unauthorized();
    }

    if (!this.bodyParams.visitor) {
      return RocketChat.API.v1.failure('Body param "visitor" is required');
    }

    if (!this.bodyParams.visitor.token) {
      return RocketChat.API.v1.failure('Body param "visitor.token" is required');
    }

    if (!this.bodyParams.messages) {
      return RocketChat.API.v1.failure('Body param "messages" is required');
    }

    if (!(this.bodyParams.messages instanceof Array)) {
      return RocketChat.API.v1.failure('Body param "messages" is not an array');
    }

    if (this.bodyParams.messages.length === 0) {
      return RocketChat.API.v1.failure('Body param "messages" is empty');
    }

    const visitorToken = this.bodyParams.visitor.token;
    let visitor = LivechatVisitors.getVisitorByToken(visitorToken);
    let rid;

    if (visitor) {
      const rooms = RocketChat.models.Rooms.findOpenByVisitorToken(visitorToken).fetch();

      if (rooms && rooms.length > 0) {
        rid = rooms[0]._id;
      } else {
        rid = Random.id();
      }
    } else {
      rid = Random.id();
      const visitorId = RocketChat.Livechat.registerGuest(this.bodyParams.visitor);
      visitor = LivechatVisitors.findOneById(visitorId);
    }

    const sentMessages = this.bodyParams.messages.map(message => {
      const sendMessage = {
        guest: visitor,
        message: {
          _id: Random.id(),
          rid,
          token: visitorToken,
          msg: message.msg
        }
      };
      const sentMessage = RocketChat.Livechat.sendMessage(sendMessage);
      return {
        username: sentMessage.u.username,
        msg: sentMessage.msg,
        ts: sentMessage.ts
      };
    });
    return RocketChat.API.v1.success({
      messages: sentMessages
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"sms.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/imports/server/rest/sms.js                                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let LivechatVisitors;
module.watch(require("../../../server/models/LivechatVisitors"), {
  default(v) {
    LivechatVisitors = v;
  }

}, 0);
RocketChat.API.v1.addRoute('livechat/sms-incoming/:service', {
  post() {
    const SMSService = RocketChat.SMS.getService(this.urlParams.service);
    const sms = SMSService.parse(this.bodyParams);
    let visitor = LivechatVisitors.findOneVisitorByPhone(sms.from);
    const sendMessage = {
      message: {
        _id: Random.id()
      },
      roomInfo: {
        sms: {
          from: sms.to
        }
      }
    };

    if (visitor) {
      const rooms = RocketChat.models.Rooms.findOpenByVisitorToken(visitor.token).fetch();

      if (rooms && rooms.length > 0) {
        sendMessage.message.rid = rooms[0]._id;
      } else {
        sendMessage.message.rid = Random.id();
      }

      sendMessage.message.token = visitor.token;
    } else {
      sendMessage.message.rid = Random.id();
      sendMessage.message.token = Random.id();
      const visitorId = RocketChat.Livechat.registerGuest({
        username: sms.from.replace(/[^0-9]/g, ''),
        token: sendMessage.message.token,
        phone: {
          number: sms.from
        }
      });
      visitor = LivechatVisitors.findOneById(visitorId);
    }

    sendMessage.message.msg = sms.body;
    sendMessage.guest = visitor;
    sendMessage.message.attachments = sms.media.map(curr => {
      const attachment = {
        message_link: curr.url
      };
      const contentType = curr.contentType;

      switch (contentType.substr(0, contentType.indexOf('/'))) {
        case 'image':
          attachment.image_url = curr.url;
          break;

        case 'video':
          attachment.video_url = curr.url;
          break;

        case 'audio':
          attachment.audio_url = curr.url;
          break;
      }

      return attachment;
    });

    try {
      const message = SMSService.response.call(this, RocketChat.Livechat.sendMessage(sendMessage));
      Meteor.defer(() => {
        if (sms.extra) {
          if (sms.extra.fromCountry) {
            Meteor.call('livechat:setCustomField', sendMessage.message.token, 'country', sms.extra.fromCountry);
          }

          if (sms.extra.fromState) {
            Meteor.call('livechat:setCustomField', sendMessage.message.token, 'state', sms.extra.fromState);
          }

          if (sms.extra.fromCity) {
            Meteor.call('livechat:setCustomField', sendMessage.message.token, 'city', sms.extra.fromCity);
          }
        }
      });
      return message;
    } catch (e) {
      return SMSService.error.call(this, e);
    }
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"users.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/imports/server/rest/users.js                                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
RocketChat.API.v1.addRoute('livechat/users/:type', {
  authRequired: true
}, {
  get() {
    if (!RocketChat.authz.hasPermission(this.userId, 'view-livechat-manager')) {
      return RocketChat.API.v1.unauthorized();
    }

    try {
      check(this.urlParams, {
        type: String
      });
      let role;

      if (this.urlParams.type === 'agent') {
        role = 'livechat-agent';
      } else if (this.urlParams.type === 'manager') {
        role = 'livechat-manager';
      } else {
        throw 'Invalid type';
      }

      const users = RocketChat.authz.getUsersInRole(role);
      return RocketChat.API.v1.success({
        users: users.fetch().map(user => _.pick(user, '_id', 'username', 'name', 'status', 'statusLivechat'))
      });
    } catch (e) {
      return RocketChat.API.v1.failure(e.error);
    }
  },

  post() {
    if (!RocketChat.authz.hasPermission(this.userId, 'view-livechat-manager')) {
      return RocketChat.API.v1.unauthorized();
    }

    try {
      check(this.urlParams, {
        type: String
      });
      check(this.bodyParams, {
        username: String
      });

      if (this.urlParams.type === 'agent') {
        const user = RocketChat.Livechat.addAgent(this.bodyParams.username);

        if (user) {
          return RocketChat.API.v1.success({
            user
          });
        }
      } else if (this.urlParams.type === 'manager') {
        const user = RocketChat.Livechat.addManager(this.bodyParams.username);

        if (user) {
          return RocketChat.API.v1.success({
            user
          });
        }
      } else {
        throw 'Invalid type';
      }

      return RocketChat.API.v1.failure();
    } catch (e) {
      return RocketChat.API.v1.failure(e.error);
    }
  }

});
RocketChat.API.v1.addRoute('livechat/users/:type/:_id', {
  authRequired: true
}, {
  get() {
    if (!RocketChat.authz.hasPermission(this.userId, 'view-livechat-manager')) {
      return RocketChat.API.v1.unauthorized();
    }

    try {
      check(this.urlParams, {
        type: String,
        _id: String
      });
      const user = RocketChat.models.Users.findOneById(this.urlParams._id);

      if (!user) {
        return RocketChat.API.v1.failure('User not found');
      }

      let role;

      if (this.urlParams.type === 'agent') {
        role = 'livechat-agent';
      } else if (this.urlParams.type === 'manager') {
        role = 'livechat-manager';
      } else {
        throw 'Invalid type';
      }

      if (user.roles.indexOf(role) !== -1) {
        return RocketChat.API.v1.success({
          user: _.pick(user, '_id', 'username')
        });
      }

      return RocketChat.API.v1.success({
        user: null
      });
    } catch (e) {
      return RocketChat.API.v1.failure(e.error);
    }
  },

  delete() {
    if (!RocketChat.authz.hasPermission(this.userId, 'view-livechat-manager')) {
      return RocketChat.API.v1.unauthorized();
    }

    try {
      check(this.urlParams, {
        type: String,
        _id: String
      });
      const user = RocketChat.models.Users.findOneById(this.urlParams._id);

      if (!user) {
        return RocketChat.API.v1.failure();
      }

      if (this.urlParams.type === 'agent') {
        if (RocketChat.Livechat.removeAgent(user.username)) {
          return RocketChat.API.v1.success();
        }
      } else if (this.urlParams.type === 'manager') {
        if (RocketChat.Livechat.removeManager(user.username)) {
          return RocketChat.API.v1.success();
        }
      } else {
        throw 'Invalid type';
      }

      return RocketChat.API.v1.failure();
    } catch (e) {
      return RocketChat.API.v1.failure(e.error);
    }
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"visitors.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/imports/server/rest/visitors.js                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let LivechatVisitors;
module.watch(require("../../../server/models/LivechatVisitors"), {
  default(v) {
    LivechatVisitors = v;
  }

}, 0);
RocketChat.API.v1.addRoute('livechat/visitor/:visitorToken', {
  authRequired: true
}, {
  get() {
    if (!RocketChat.authz.hasPermission(this.userId, 'view-livechat-manager')) {
      return RocketChat.API.v1.unauthorized();
    }

    const visitor = LivechatVisitors.getVisitorByToken(this.urlParams.visitorToken);
    return RocketChat.API.v1.success(visitor);
  }

});
RocketChat.API.v1.addRoute('livechat/visitor/:visitorToken/room', {
  authRequired: true
}, {
  get() {
    if (!RocketChat.authz.hasPermission(this.userId, 'view-livechat-manager')) {
      return RocketChat.API.v1.unauthorized();
    }

    const rooms = RocketChat.models.Rooms.findOpenByVisitorToken(this.urlParams.visitorToken, {
      fields: {
        name: 1,
        t: 1,
        cl: 1,
        u: 1,
        usernames: 1,
        servedBy: 1
      }
    }).fetch();
    return RocketChat.API.v1.success({
      rooms
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}},"node_modules":{"ua-parser-js":{"package.json":function(require,exports){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/rocketchat_livechat/node_modules/ua-parser-js/package.json                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
exports.name = "ua-parser-js";
exports.version = "0.7.17";
exports.main = "src/ua-parser.js";

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"src":{"ua-parser.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/rocketchat_livechat/node_modules/ua-parser-js/src/ua-parser.js                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/**
 * UAParser.js v0.7.17
 * Lightweight JavaScript-based User-Agent string parser
 * https://github.com/faisalman/ua-parser-js
 *
 * Copyright © 2012-2016 Faisal Salman <fyzlman@gmail.com>
 * Dual licensed under GPLv2 & MIT
 */

(function (window, undefined) {

    'use strict';

    //////////////
    // Constants
    /////////////


    var LIBVERSION  = '0.7.17',
        EMPTY       = '',
        UNKNOWN     = '?',
        FUNC_TYPE   = 'function',
        UNDEF_TYPE  = 'undefined',
        OBJ_TYPE    = 'object',
        STR_TYPE    = 'string',
        MAJOR       = 'major', // deprecated
        MODEL       = 'model',
        NAME        = 'name',
        TYPE        = 'type',
        VENDOR      = 'vendor',
        VERSION     = 'version',
        ARCHITECTURE= 'architecture',
        CONSOLE     = 'console',
        MOBILE      = 'mobile',
        TABLET      = 'tablet',
        SMARTTV     = 'smarttv',
        WEARABLE    = 'wearable',
        EMBEDDED    = 'embedded';


    ///////////
    // Helper
    //////////


    var util = {
        extend : function (regexes, extensions) {
            var margedRegexes = {};
            for (var i in regexes) {
                if (extensions[i] && extensions[i].length % 2 === 0) {
                    margedRegexes[i] = extensions[i].concat(regexes[i]);
                } else {
                    margedRegexes[i] = regexes[i];
                }
            }
            return margedRegexes;
        },
        has : function (str1, str2) {
          if (typeof str1 === "string") {
            return str2.toLowerCase().indexOf(str1.toLowerCase()) !== -1;
          } else {
            return false;
          }
        },
        lowerize : function (str) {
            return str.toLowerCase();
        },
        major : function (version) {
            return typeof(version) === STR_TYPE ? version.replace(/[^\d\.]/g,'').split(".")[0] : undefined;
        },
        trim : function (str) {
          return str.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
        }
    };


    ///////////////
    // Map helper
    //////////////


    var mapper = {

        rgx : function (ua, arrays) {

            //var result = {},
            var i = 0, j, k, p, q, matches, match;//, args = arguments;

            /*// construct object barebones
            for (p = 0; p < args[1].length; p++) {
                q = args[1][p];
                result[typeof q === OBJ_TYPE ? q[0] : q] = undefined;
            }*/

            // loop through all regexes maps
            while (i < arrays.length && !matches) {

                var regex = arrays[i],       // even sequence (0,2,4,..)
                    props = arrays[i + 1];   // odd sequence (1,3,5,..)
                j = k = 0;

                // try matching uastring with regexes
                while (j < regex.length && !matches) {

                    matches = regex[j++].exec(ua);

                    if (!!matches) {
                        for (p = 0; p < props.length; p++) {
                            match = matches[++k];
                            q = props[p];
                            // check if given property is actually array
                            if (typeof q === OBJ_TYPE && q.length > 0) {
                                if (q.length == 2) {
                                    if (typeof q[1] == FUNC_TYPE) {
                                        // assign modified match
                                        this[q[0]] = q[1].call(this, match);
                                    } else {
                                        // assign given value, ignore regex match
                                        this[q[0]] = q[1];
                                    }
                                } else if (q.length == 3) {
                                    // check whether function or regex
                                    if (typeof q[1] === FUNC_TYPE && !(q[1].exec && q[1].test)) {
                                        // call function (usually string mapper)
                                        this[q[0]] = match ? q[1].call(this, match, q[2]) : undefined;
                                    } else {
                                        // sanitize match using given regex
                                        this[q[0]] = match ? match.replace(q[1], q[2]) : undefined;
                                    }
                                } else if (q.length == 4) {
                                        this[q[0]] = match ? q[3].call(this, match.replace(q[1], q[2])) : undefined;
                                }
                            } else {
                                this[q] = match ? match : undefined;
                            }
                        }
                    }
                }
                i += 2;
            }
            // console.log(this);
            //return this;
        },

        str : function (str, map) {

            for (var i in map) {
                // check if array
                if (typeof map[i] === OBJ_TYPE && map[i].length > 0) {
                    for (var j = 0; j < map[i].length; j++) {
                        if (util.has(map[i][j], str)) {
                            return (i === UNKNOWN) ? undefined : i;
                        }
                    }
                } else if (util.has(map[i], str)) {
                    return (i === UNKNOWN) ? undefined : i;
                }
            }
            return str;
        }
    };


    ///////////////
    // String map
    //////////////


    var maps = {

        browser : {
            oldsafari : {
                version : {
                    '1.0'   : '/8',
                    '1.2'   : '/1',
                    '1.3'   : '/3',
                    '2.0'   : '/412',
                    '2.0.2' : '/416',
                    '2.0.3' : '/417',
                    '2.0.4' : '/419',
                    '?'     : '/'
                }
            }
        },

        device : {
            amazon : {
                model : {
                    'Fire Phone' : ['SD', 'KF']
                }
            },
            sprint : {
                model : {
                    'Evo Shift 4G' : '7373KT'
                },
                vendor : {
                    'HTC'       : 'APA',
                    'Sprint'    : 'Sprint'
                }
            }
        },

        os : {
            windows : {
                version : {
                    'ME'        : '4.90',
                    'NT 3.11'   : 'NT3.51',
                    'NT 4.0'    : 'NT4.0',
                    '2000'      : 'NT 5.0',
                    'XP'        : ['NT 5.1', 'NT 5.2'],
                    'Vista'     : 'NT 6.0',
                    '7'         : 'NT 6.1',
                    '8'         : 'NT 6.2',
                    '8.1'       : 'NT 6.3',
                    '10'        : ['NT 6.4', 'NT 10.0'],
                    'RT'        : 'ARM'
                }
            }
        }
    };


    //////////////
    // Regex map
    /////////////


    var regexes = {

        browser : [[

            // Presto based
            /(opera\smini)\/([\w\.-]+)/i,                                       // Opera Mini
            /(opera\s[mobiletab]+).+version\/([\w\.-]+)/i,                      // Opera Mobi/Tablet
            /(opera).+version\/([\w\.]+)/i,                                     // Opera > 9.80
            /(opera)[\/\s]+([\w\.]+)/i                                          // Opera < 9.80
            ], [NAME, VERSION], [

            /(opios)[\/\s]+([\w\.]+)/i                                          // Opera mini on iphone >= 8.0
            ], [[NAME, 'Opera Mini'], VERSION], [

            /\s(opr)\/([\w\.]+)/i                                               // Opera Webkit
            ], [[NAME, 'Opera'], VERSION], [

            // Mixed
            /(kindle)\/([\w\.]+)/i,                                             // Kindle
            /(lunascape|maxthon|netfront|jasmine|blazer)[\/\s]?([\w\.]+)*/i,
                                                                                // Lunascape/Maxthon/Netfront/Jasmine/Blazer

            // Trident based
            /(avant\s|iemobile|slim|baidu)(?:browser)?[\/\s]?([\w\.]*)/i,
                                                                                // Avant/IEMobile/SlimBrowser/Baidu
            /(?:ms|\()(ie)\s([\w\.]+)/i,                                        // Internet Explorer

            // Webkit/KHTML based
            /(rekonq)\/([\w\.]+)*/i,                                            // Rekonq
            /(chromium|flock|rockmelt|midori|epiphany|silk|skyfire|ovibrowser|bolt|iron|vivaldi|iridium|phantomjs|bowser)\/([\w\.-]+)/i
                                                                                // Chromium/Flock/RockMelt/Midori/Epiphany/Silk/Skyfire/Bolt/Iron/Iridium/PhantomJS/Bowser
            ], [NAME, VERSION], [

            /(trident).+rv[:\s]([\w\.]+).+like\sgecko/i                         // IE11
            ], [[NAME, 'IE'], VERSION], [

            /(edge)\/((\d+)?[\w\.]+)/i                                          // Microsoft Edge
            ], [NAME, VERSION], [

            /(yabrowser)\/([\w\.]+)/i                                           // Yandex
            ], [[NAME, 'Yandex'], VERSION], [

            /(puffin)\/([\w\.]+)/i                                              // Puffin
            ], [[NAME, 'Puffin'], VERSION], [

            /((?:[\s\/])uc?\s?browser|(?:juc.+)ucweb)[\/\s]?([\w\.]+)/i
                                                                                // UCBrowser
            ], [[NAME, 'UCBrowser'], VERSION], [

            /(comodo_dragon)\/([\w\.]+)/i                                       // Comodo Dragon
            ], [[NAME, /_/g, ' '], VERSION], [

            /(micromessenger)\/([\w\.]+)/i                                      // WeChat
            ], [[NAME, 'WeChat'], VERSION], [

            /(QQ)\/([\d\.]+)/i                                                  // QQ, aka ShouQ
            ], [NAME, VERSION], [

            /m?(qqbrowser)[\/\s]?([\w\.]+)/i                                    // QQBrowser
            ], [NAME, VERSION], [

            /xiaomi\/miuibrowser\/([\w\.]+)/i                                   // MIUI Browser
            ], [VERSION, [NAME, 'MIUI Browser']], [

            /;fbav\/([\w\.]+);/i                                                // Facebook App for iOS & Android
            ], [VERSION, [NAME, 'Facebook']], [

            /headlesschrome(?:\/([\w\.]+)|\s)/i                                 // Chrome Headless
            ], [VERSION, [NAME, 'Chrome Headless']], [

            /\swv\).+(chrome)\/([\w\.]+)/i                                      // Chrome WebView
            ], [[NAME, /(.+)/, '$1 WebView'], VERSION], [

            /((?:oculus|samsung)browser)\/([\w\.]+)/i
            ], [[NAME, /(.+(?:g|us))(.+)/, '$1 $2'], VERSION], [                // Oculus / Samsung Browser

            /android.+version\/([\w\.]+)\s+(?:mobile\s?safari|safari)*/i        // Android Browser
            ], [VERSION, [NAME, 'Android Browser']], [

            /(chrome|omniweb|arora|[tizenoka]{5}\s?browser)\/v?([\w\.]+)/i
                                                                                // Chrome/OmniWeb/Arora/Tizen/Nokia
            ], [NAME, VERSION], [

            /(dolfin)\/([\w\.]+)/i                                              // Dolphin
            ], [[NAME, 'Dolphin'], VERSION], [

            /((?:android.+)crmo|crios)\/([\w\.]+)/i                             // Chrome for Android/iOS
            ], [[NAME, 'Chrome'], VERSION], [

            /(coast)\/([\w\.]+)/i                                               // Opera Coast
            ], [[NAME, 'Opera Coast'], VERSION], [

            /fxios\/([\w\.-]+)/i                                                // Firefox for iOS
            ], [VERSION, [NAME, 'Firefox']], [

            /version\/([\w\.]+).+?mobile\/\w+\s(safari)/i                       // Mobile Safari
            ], [VERSION, [NAME, 'Mobile Safari']], [

            /version\/([\w\.]+).+?(mobile\s?safari|safari)/i                    // Safari & Safari Mobile
            ], [VERSION, NAME], [

            /webkit.+?(gsa)\/([\w\.]+).+?(mobile\s?safari|safari)(\/[\w\.]+)/i  // Google Search Appliance on iOS
            ], [[NAME, 'GSA'], VERSION], [

            /webkit.+?(mobile\s?safari|safari)(\/[\w\.]+)/i                     // Safari < 3.0
            ], [NAME, [VERSION, mapper.str, maps.browser.oldsafari.version]], [

            /(konqueror)\/([\w\.]+)/i,                                          // Konqueror
            /(webkit|khtml)\/([\w\.]+)/i
            ], [NAME, VERSION], [

            // Gecko based
            /(navigator|netscape)\/([\w\.-]+)/i                                 // Netscape
            ], [[NAME, 'Netscape'], VERSION], [
            /(swiftfox)/i,                                                      // Swiftfox
            /(icedragon|iceweasel|camino|chimera|fennec|maemo\sbrowser|minimo|conkeror)[\/\s]?([\w\.\+]+)/i,
                                                                                // IceDragon/Iceweasel/Camino/Chimera/Fennec/Maemo/Minimo/Conkeror
            /(firefox|seamonkey|k-meleon|icecat|iceape|firebird|phoenix)\/([\w\.-]+)/i,
                                                                                // Firefox/SeaMonkey/K-Meleon/IceCat/IceApe/Firebird/Phoenix
            /(mozilla)\/([\w\.]+).+rv\:.+gecko\/\d+/i,                          // Mozilla

            // Other
            /(polaris|lynx|dillo|icab|doris|amaya|w3m|netsurf|sleipnir)[\/\s]?([\w\.]+)/i,
                                                                                // Polaris/Lynx/Dillo/iCab/Doris/Amaya/w3m/NetSurf/Sleipnir
            /(links)\s\(([\w\.]+)/i,                                            // Links
            /(gobrowser)\/?([\w\.]+)*/i,                                        // GoBrowser
            /(ice\s?browser)\/v?([\w\._]+)/i,                                   // ICE Browser
            /(mosaic)[\/\s]([\w\.]+)/i                                          // Mosaic
            ], [NAME, VERSION]

            /* /////////////////////
            // Media players BEGIN
            ////////////////////////

            , [

            /(apple(?:coremedia|))\/((\d+)[\w\._]+)/i,                          // Generic Apple CoreMedia
            /(coremedia) v((\d+)[\w\._]+)/i
            ], [NAME, VERSION], [

            /(aqualung|lyssna|bsplayer)\/((\d+)?[\w\.-]+)/i                     // Aqualung/Lyssna/BSPlayer
            ], [NAME, VERSION], [

            /(ares|ossproxy)\s((\d+)[\w\.-]+)/i                                 // Ares/OSSProxy
            ], [NAME, VERSION], [

            /(audacious|audimusicstream|amarok|bass|core|dalvik|gnomemplayer|music on console|nsplayer|psp-internetradioplayer|videos)\/((\d+)[\w\.-]+)/i,
                                                                                // Audacious/AudiMusicStream/Amarok/BASS/OpenCORE/Dalvik/GnomeMplayer/MoC
                                                                                // NSPlayer/PSP-InternetRadioPlayer/Videos
            /(clementine|music player daemon)\s((\d+)[\w\.-]+)/i,               // Clementine/MPD
            /(lg player|nexplayer)\s((\d+)[\d\.]+)/i,
            /player\/(nexplayer|lg player)\s((\d+)[\w\.-]+)/i                   // NexPlayer/LG Player
            ], [NAME, VERSION], [
            /(nexplayer)\s((\d+)[\w\.-]+)/i                                     // Nexplayer
            ], [NAME, VERSION], [

            /(flrp)\/((\d+)[\w\.-]+)/i                                          // Flip Player
            ], [[NAME, 'Flip Player'], VERSION], [

            /(fstream|nativehost|queryseekspider|ia-archiver|facebookexternalhit)/i
                                                                                // FStream/NativeHost/QuerySeekSpider/IA Archiver/facebookexternalhit
            ], [NAME], [

            /(gstreamer) souphttpsrc (?:\([^\)]+\)){0,1} libsoup\/((\d+)[\w\.-]+)/i
                                                                                // Gstreamer
            ], [NAME, VERSION], [

            /(htc streaming player)\s[\w_]+\s\/\s((\d+)[\d\.]+)/i,              // HTC Streaming Player
            /(java|python-urllib|python-requests|wget|libcurl)\/((\d+)[\w\.-_]+)/i,
                                                                                // Java/urllib/requests/wget/cURL
            /(lavf)((\d+)[\d\.]+)/i                                             // Lavf (FFMPEG)
            ], [NAME, VERSION], [

            /(htc_one_s)\/((\d+)[\d\.]+)/i                                      // HTC One S
            ], [[NAME, /_/g, ' '], VERSION], [

            /(mplayer)(?:\s|\/)(?:(?:sherpya-){0,1}svn)(?:-|\s)(r\d+(?:-\d+[\w\.-]+){0,1})/i
                                                                                // MPlayer SVN
            ], [NAME, VERSION], [

            /(mplayer)(?:\s|\/|[unkow-]+)((\d+)[\w\.-]+)/i                      // MPlayer
            ], [NAME, VERSION], [

            /(mplayer)/i,                                                       // MPlayer (no other info)
            /(yourmuze)/i,                                                      // YourMuze
            /(media player classic|nero showtime)/i                             // Media Player Classic/Nero ShowTime
            ], [NAME], [

            /(nero (?:home|scout))\/((\d+)[\w\.-]+)/i                           // Nero Home/Nero Scout
            ], [NAME, VERSION], [

            /(nokia\d+)\/((\d+)[\w\.-]+)/i                                      // Nokia
            ], [NAME, VERSION], [

            /\s(songbird)\/((\d+)[\w\.-]+)/i                                    // Songbird/Philips-Songbird
            ], [NAME, VERSION], [

            /(winamp)3 version ((\d+)[\w\.-]+)/i,                               // Winamp
            /(winamp)\s((\d+)[\w\.-]+)/i,
            /(winamp)mpeg\/((\d+)[\w\.-]+)/i
            ], [NAME, VERSION], [

            /(ocms-bot|tapinradio|tunein radio|unknown|winamp|inlight radio)/i  // OCMS-bot/tap in radio/tunein/unknown/winamp (no other info)
                                                                                // inlight radio
            ], [NAME], [

            /(quicktime|rma|radioapp|radioclientapplication|soundtap|totem|stagefright|streamium)\/((\d+)[\w\.-]+)/i
                                                                                // QuickTime/RealMedia/RadioApp/RadioClientApplication/
                                                                                // SoundTap/Totem/Stagefright/Streamium
            ], [NAME, VERSION], [

            /(smp)((\d+)[\d\.]+)/i                                              // SMP
            ], [NAME, VERSION], [

            /(vlc) media player - version ((\d+)[\w\.]+)/i,                     // VLC Videolan
            /(vlc)\/((\d+)[\w\.-]+)/i,
            /(xbmc|gvfs|xine|xmms|irapp)\/((\d+)[\w\.-]+)/i,                    // XBMC/gvfs/Xine/XMMS/irapp
            /(foobar2000)\/((\d+)[\d\.]+)/i,                                    // Foobar2000
            /(itunes)\/((\d+)[\d\.]+)/i                                         // iTunes
            ], [NAME, VERSION], [

            /(wmplayer)\/((\d+)[\w\.-]+)/i,                                     // Windows Media Player
            /(windows-media-player)\/((\d+)[\w\.-]+)/i
            ], [[NAME, /-/g, ' '], VERSION], [

            /windows\/((\d+)[\w\.-]+) upnp\/[\d\.]+ dlnadoc\/[\d\.]+ (home media server)/i
                                                                                // Windows Media Server
            ], [VERSION, [NAME, 'Windows']], [

            /(com\.riseupradioalarm)\/((\d+)[\d\.]*)/i                          // RiseUP Radio Alarm
            ], [NAME, VERSION], [

            /(rad.io)\s((\d+)[\d\.]+)/i,                                        // Rad.io
            /(radio.(?:de|at|fr))\s((\d+)[\d\.]+)/i
            ], [[NAME, 'rad.io'], VERSION]

            //////////////////////
            // Media players END
            ////////////////////*/

        ],

        cpu : [[

            /(?:(amd|x(?:(?:86|64)[_-])?|wow|win)64)[;\)]/i                     // AMD64
            ], [[ARCHITECTURE, 'amd64']], [

            /(ia32(?=;))/i                                                      // IA32 (quicktime)
            ], [[ARCHITECTURE, util.lowerize]], [

            /((?:i[346]|x)86)[;\)]/i                                            // IA32
            ], [[ARCHITECTURE, 'ia32']], [

            // PocketPC mistakenly identified as PowerPC
            /windows\s(ce|mobile);\sppc;/i
            ], [[ARCHITECTURE, 'arm']], [

            /((?:ppc|powerpc)(?:64)?)(?:\smac|;|\))/i                           // PowerPC
            ], [[ARCHITECTURE, /ower/, '', util.lowerize]], [

            /(sun4\w)[;\)]/i                                                    // SPARC
            ], [[ARCHITECTURE, 'sparc']], [

            /((?:avr32|ia64(?=;))|68k(?=\))|arm(?:64|(?=v\d+;))|(?=atmel\s)avr|(?:irix|mips|sparc)(?:64)?(?=;)|pa-risc)/i
                                                                                // IA64, 68K, ARM/64, AVR/32, IRIX/64, MIPS/64, SPARC/64, PA-RISC
            ], [[ARCHITECTURE, util.lowerize]]
        ],

        device : [[

            /\((ipad|playbook);[\w\s\);-]+(rim|apple)/i                         // iPad/PlayBook
            ], [MODEL, VENDOR, [TYPE, TABLET]], [

            /applecoremedia\/[\w\.]+ \((ipad)/                                  // iPad
            ], [MODEL, [VENDOR, 'Apple'], [TYPE, TABLET]], [

            /(apple\s{0,1}tv)/i                                                 // Apple TV
            ], [[MODEL, 'Apple TV'], [VENDOR, 'Apple']], [

            /(archos)\s(gamepad2?)/i,                                           // Archos
            /(hp).+(touchpad)/i,                                                // HP TouchPad
            /(hp).+(tablet)/i,                                                  // HP Tablet
            /(kindle)\/([\w\.]+)/i,                                             // Kindle
            /\s(nook)[\w\s]+build\/(\w+)/i,                                     // Nook
            /(dell)\s(strea[kpr\s\d]*[\dko])/i                                  // Dell Streak
            ], [VENDOR, MODEL, [TYPE, TABLET]], [

            /(kf[A-z]+)\sbuild\/[\w\.]+.*silk\//i                               // Kindle Fire HD
            ], [MODEL, [VENDOR, 'Amazon'], [TYPE, TABLET]], [
            /(sd|kf)[0349hijorstuw]+\sbuild\/[\w\.]+.*silk\//i                  // Fire Phone
            ], [[MODEL, mapper.str, maps.device.amazon.model], [VENDOR, 'Amazon'], [TYPE, MOBILE]], [

            /\((ip[honed|\s\w*]+);.+(apple)/i                                   // iPod/iPhone
            ], [MODEL, VENDOR, [TYPE, MOBILE]], [
            /\((ip[honed|\s\w*]+);/i                                            // iPod/iPhone
            ], [MODEL, [VENDOR, 'Apple'], [TYPE, MOBILE]], [

            /(blackberry)[\s-]?(\w+)/i,                                         // BlackBerry
            /(blackberry|benq|palm(?=\-)|sonyericsson|acer|asus|dell|meizu|motorola|polytron)[\s_-]?([\w-]+)*/i,
                                                                                // BenQ/Palm/Sony-Ericsson/Acer/Asus/Dell/Meizu/Motorola/Polytron
            /(hp)\s([\w\s]+\w)/i,                                               // HP iPAQ
            /(asus)-?(\w+)/i                                                    // Asus
            ], [VENDOR, MODEL, [TYPE, MOBILE]], [
            /\(bb10;\s(\w+)/i                                                   // BlackBerry 10
            ], [MODEL, [VENDOR, 'BlackBerry'], [TYPE, MOBILE]], [
                                                                                // Asus Tablets
            /android.+(transfo[prime\s]{4,10}\s\w+|eeepc|slider\s\w+|nexus 7|padfone)/i
            ], [MODEL, [VENDOR, 'Asus'], [TYPE, TABLET]], [

            /(sony)\s(tablet\s[ps])\sbuild\//i,                                  // Sony
            /(sony)?(?:sgp.+)\sbuild\//i
            ], [[VENDOR, 'Sony'], [MODEL, 'Xperia Tablet'], [TYPE, TABLET]], [
            /android.+\s([c-g]\d{4}|so[-l]\w+)\sbuild\//i
            ], [MODEL, [VENDOR, 'Sony'], [TYPE, MOBILE]], [

            /\s(ouya)\s/i,                                                      // Ouya
            /(nintendo)\s([wids3u]+)/i                                          // Nintendo
            ], [VENDOR, MODEL, [TYPE, CONSOLE]], [

            /android.+;\s(shield)\sbuild/i                                      // Nvidia
            ], [MODEL, [VENDOR, 'Nvidia'], [TYPE, CONSOLE]], [

            /(playstation\s[34portablevi]+)/i                                   // Playstation
            ], [MODEL, [VENDOR, 'Sony'], [TYPE, CONSOLE]], [

            /(sprint\s(\w+))/i                                                  // Sprint Phones
            ], [[VENDOR, mapper.str, maps.device.sprint.vendor], [MODEL, mapper.str, maps.device.sprint.model], [TYPE, MOBILE]], [

            /(lenovo)\s?(S(?:5000|6000)+(?:[-][\w+]))/i                         // Lenovo tablets
            ], [VENDOR, MODEL, [TYPE, TABLET]], [

            /(htc)[;_\s-]+([\w\s]+(?=\))|\w+)*/i,                               // HTC
            /(zte)-(\w+)*/i,                                                    // ZTE
            /(alcatel|geeksphone|lenovo|nexian|panasonic|(?=;\s)sony)[_\s-]?([\w-]+)*/i
                                                                                // Alcatel/GeeksPhone/Lenovo/Nexian/Panasonic/Sony
            ], [VENDOR, [MODEL, /_/g, ' '], [TYPE, MOBILE]], [

            /(nexus\s9)/i                                                       // HTC Nexus 9
            ], [MODEL, [VENDOR, 'HTC'], [TYPE, TABLET]], [

            /d\/huawei([\w\s-]+)[;\)]/i,
            /(nexus\s6p)/i                                                      // Huawei
            ], [MODEL, [VENDOR, 'Huawei'], [TYPE, MOBILE]], [

            /(microsoft);\s(lumia[\s\w]+)/i                                     // Microsoft Lumia
            ], [VENDOR, MODEL, [TYPE, MOBILE]], [

            /[\s\(;](xbox(?:\sone)?)[\s\);]/i                                   // Microsoft Xbox
            ], [MODEL, [VENDOR, 'Microsoft'], [TYPE, CONSOLE]], [
            /(kin\.[onetw]{3})/i                                                // Microsoft Kin
            ], [[MODEL, /\./g, ' '], [VENDOR, 'Microsoft'], [TYPE, MOBILE]], [

                                                                                // Motorola
            /\s(milestone|droid(?:[2-4x]|\s(?:bionic|x2|pro|razr))?(:?\s4g)?)[\w\s]+build\//i,
            /mot[\s-]?(\w+)*/i,
            /(XT\d{3,4}) build\//i,
            /(nexus\s6)/i
            ], [MODEL, [VENDOR, 'Motorola'], [TYPE, MOBILE]], [
            /android.+\s(mz60\d|xoom[\s2]{0,2})\sbuild\//i
            ], [MODEL, [VENDOR, 'Motorola'], [TYPE, TABLET]], [

            /hbbtv\/\d+\.\d+\.\d+\s+\([\w\s]*;\s*(\w[^;]*);([^;]*)/i            // HbbTV devices
            ], [[VENDOR, util.trim], [MODEL, util.trim], [TYPE, SMARTTV]], [

            /hbbtv.+maple;(\d+)/i
            ], [[MODEL, /^/, 'SmartTV'], [VENDOR, 'Samsung'], [TYPE, SMARTTV]], [

            /\(dtv[\);].+(aquos)/i                                              // Sharp
            ], [MODEL, [VENDOR, 'Sharp'], [TYPE, SMARTTV]], [

            /android.+((sch-i[89]0\d|shw-m380s|gt-p\d{4}|gt-n\d+|sgh-t8[56]9|nexus 10))/i,
            /((SM-T\w+))/i
            ], [[VENDOR, 'Samsung'], MODEL, [TYPE, TABLET]], [                  // Samsung
            /smart-tv.+(samsung)/i
            ], [VENDOR, [TYPE, SMARTTV], MODEL], [
            /((s[cgp]h-\w+|gt-\w+|galaxy\snexus|sm-\w[\w\d]+))/i,
            /(sam[sung]*)[\s-]*(\w+-?[\w-]*)*/i,
            /sec-((sgh\w+))/i
            ], [[VENDOR, 'Samsung'], MODEL, [TYPE, MOBILE]], [

            /sie-(\w+)*/i                                                       // Siemens
            ], [MODEL, [VENDOR, 'Siemens'], [TYPE, MOBILE]], [

            /(maemo|nokia).*(n900|lumia\s\d+)/i,                                // Nokia
            /(nokia)[\s_-]?([\w-]+)*/i
            ], [[VENDOR, 'Nokia'], MODEL, [TYPE, MOBILE]], [

            /android\s3\.[\s\w;-]{10}(a\d{3})/i                                 // Acer
            ], [MODEL, [VENDOR, 'Acer'], [TYPE, TABLET]], [

            /android.+([vl]k\-?\d{3})\s+build/i                                 // LG Tablet
            ], [MODEL, [VENDOR, 'LG'], [TYPE, TABLET]], [
            /android\s3\.[\s\w;-]{10}(lg?)-([06cv9]{3,4})/i                     // LG Tablet
            ], [[VENDOR, 'LG'], MODEL, [TYPE, TABLET]], [
            /(lg) netcast\.tv/i                                                 // LG SmartTV
            ], [VENDOR, MODEL, [TYPE, SMARTTV]], [
            /(nexus\s[45])/i,                                                   // LG
            /lg[e;\s\/-]+(\w+)*/i,
            /android.+lg(\-?[\d\w]+)\s+build/i
            ], [MODEL, [VENDOR, 'LG'], [TYPE, MOBILE]], [

            /android.+(ideatab[a-z0-9\-\s]+)/i                                  // Lenovo
            ], [MODEL, [VENDOR, 'Lenovo'], [TYPE, TABLET]], [

            /linux;.+((jolla));/i                                               // Jolla
            ], [VENDOR, MODEL, [TYPE, MOBILE]], [

            /((pebble))app\/[\d\.]+\s/i                                         // Pebble
            ], [VENDOR, MODEL, [TYPE, WEARABLE]], [

            /android.+;\s(oppo)\s?([\w\s]+)\sbuild/i                            // OPPO
            ], [VENDOR, MODEL, [TYPE, MOBILE]], [

            /crkey/i                                                            // Google Chromecast
            ], [[MODEL, 'Chromecast'], [VENDOR, 'Google']], [

            /android.+;\s(glass)\s\d/i                                          // Google Glass
            ], [MODEL, [VENDOR, 'Google'], [TYPE, WEARABLE]], [

            /android.+;\s(pixel c)\s/i                                          // Google Pixel C
            ], [MODEL, [VENDOR, 'Google'], [TYPE, TABLET]], [

            /android.+;\s(pixel xl|pixel)\s/i                                   // Google Pixel
            ], [MODEL, [VENDOR, 'Google'], [TYPE, MOBILE]], [

            /android.+(\w+)\s+build\/hm\1/i,                                    // Xiaomi Hongmi 'numeric' models
            /android.+(hm[\s\-_]*note?[\s_]*(?:\d\w)?)\s+build/i,               // Xiaomi Hongmi
            /android.+(mi[\s\-_]*(?:one|one[\s_]plus|note lte)?[\s_]*(?:\d\w)?)\s+build/i,    // Xiaomi Mi
            /android.+(redmi[\s\-_]*(?:note)?(?:[\s_]*[\w\s]+)?)\s+build/i      // Redmi Phones
            ], [[MODEL, /_/g, ' '], [VENDOR, 'Xiaomi'], [TYPE, MOBILE]], [
            /android.+(mi[\s\-_]*(?:pad)?(?:[\s_]*[\w\s]+)?)\s+build/i          // Mi Pad tablets
            ],[[MODEL, /_/g, ' '], [VENDOR, 'Xiaomi'], [TYPE, TABLET]], [
            /android.+;\s(m[1-5]\snote)\sbuild/i                                // Meizu Tablet
            ], [MODEL, [VENDOR, 'Meizu'], [TYPE, TABLET]], [

            /android.+a000(1)\s+build/i                                         // OnePlus
            ], [MODEL, [VENDOR, 'OnePlus'], [TYPE, MOBILE]], [

            /android.+[;\/]\s*(RCT[\d\w]+)\s+build/i                            // RCA Tablets
            ], [MODEL, [VENDOR, 'RCA'], [TYPE, TABLET]], [

            /android.+[;\/]\s*(Venue[\d\s]*)\s+build/i                          // Dell Venue Tablets
            ], [MODEL, [VENDOR, 'Dell'], [TYPE, TABLET]], [

            /android.+[;\/]\s*(Q[T|M][\d\w]+)\s+build/i                         // Verizon Tablet
            ], [MODEL, [VENDOR, 'Verizon'], [TYPE, TABLET]], [

            /android.+[;\/]\s+(Barnes[&\s]+Noble\s+|BN[RT])(V?.*)\s+build/i     // Barnes & Noble Tablet
            ], [[VENDOR, 'Barnes & Noble'], MODEL, [TYPE, TABLET]], [

            /android.+[;\/]\s+(TM\d{3}.*\b)\s+build/i                           // Barnes & Noble Tablet
            ], [MODEL, [VENDOR, 'NuVision'], [TYPE, TABLET]], [

            /android.+[;\/]\s*(zte)?.+(k\d{2})\s+build/i                        // ZTE K Series Tablet
            ], [[VENDOR, 'ZTE'], MODEL, [TYPE, TABLET]], [

            /android.+[;\/]\s*(gen\d{3})\s+build.*49h/i                         // Swiss GEN Mobile
            ], [MODEL, [VENDOR, 'Swiss'], [TYPE, MOBILE]], [

            /android.+[;\/]\s*(zur\d{3})\s+build/i                              // Swiss ZUR Tablet
            ], [MODEL, [VENDOR, 'Swiss'], [TYPE, TABLET]], [

            /android.+[;\/]\s*((Zeki)?TB.*\b)\s+build/i                         // Zeki Tablets
            ], [MODEL, [VENDOR, 'Zeki'], [TYPE, TABLET]], [

            /(android).+[;\/]\s+([YR]\d{2}x?.*)\s+build/i,
            /android.+[;\/]\s+(Dragon[\-\s]+Touch\s+|DT)(.+)\s+build/i          // Dragon Touch Tablet
            ], [[VENDOR, 'Dragon Touch'], MODEL, [TYPE, TABLET]], [

            /android.+[;\/]\s*(NS-?.+)\s+build/i                                // Insignia Tablets
            ], [MODEL, [VENDOR, 'Insignia'], [TYPE, TABLET]], [

            /android.+[;\/]\s*((NX|Next)-?.+)\s+build/i                         // NextBook Tablets
            ], [MODEL, [VENDOR, 'NextBook'], [TYPE, TABLET]], [

            /android.+[;\/]\s*(Xtreme\_?)?(V(1[045]|2[015]|30|40|60|7[05]|90))\s+build/i
            ], [[VENDOR, 'Voice'], MODEL, [TYPE, MOBILE]], [                    // Voice Xtreme Phones

            /android.+[;\/]\s*(LVTEL\-?)?(V1[12])\s+build/i                     // LvTel Phones
            ], [[VENDOR, 'LvTel'], MODEL, [TYPE, MOBILE]], [

            /android.+[;\/]\s*(V(100MD|700NA|7011|917G).*\b)\s+build/i          // Envizen Tablets
            ], [MODEL, [VENDOR, 'Envizen'], [TYPE, TABLET]], [

            /android.+[;\/]\s*(Le[\s\-]+Pan)[\s\-]+(.*\b)\s+build/i             // Le Pan Tablets
            ], [VENDOR, MODEL, [TYPE, TABLET]], [

            /android.+[;\/]\s*(Trio[\s\-]*.*)\s+build/i                         // MachSpeed Tablets
            ], [MODEL, [VENDOR, 'MachSpeed'], [TYPE, TABLET]], [

            /android.+[;\/]\s*(Trinity)[\-\s]*(T\d{3})\s+build/i                // Trinity Tablets
            ], [VENDOR, MODEL, [TYPE, TABLET]], [

            /android.+[;\/]\s*TU_(1491)\s+build/i                               // Rotor Tablets
            ], [MODEL, [VENDOR, 'Rotor'], [TYPE, TABLET]], [

            /android.+(KS(.+))\s+build/i                                        // Amazon Kindle Tablets
            ], [MODEL, [VENDOR, 'Amazon'], [TYPE, TABLET]], [

            /android.+(Gigaset)[\s\-]+(Q.+)\s+build/i                           // Gigaset Tablets
            ], [VENDOR, MODEL, [TYPE, TABLET]], [

            /\s(tablet|tab)[;\/]/i,                                             // Unidentifiable Tablet
            /\s(mobile)(?:[;\/]|\ssafari)/i                                     // Unidentifiable Mobile
            ], [[TYPE, util.lowerize], VENDOR, MODEL], [

            /(android.+)[;\/].+build/i                                          // Generic Android Device
            ], [MODEL, [VENDOR, 'Generic']]


        /*//////////////////////////
            // TODO: move to string map
            ////////////////////////////

            /(C6603)/i                                                          // Sony Xperia Z C6603
            ], [[MODEL, 'Xperia Z C6603'], [VENDOR, 'Sony'], [TYPE, MOBILE]], [
            /(C6903)/i                                                          // Sony Xperia Z 1
            ], [[MODEL, 'Xperia Z 1'], [VENDOR, 'Sony'], [TYPE, MOBILE]], [

            /(SM-G900[F|H])/i                                                   // Samsung Galaxy S5
            ], [[MODEL, 'Galaxy S5'], [VENDOR, 'Samsung'], [TYPE, MOBILE]], [
            /(SM-G7102)/i                                                       // Samsung Galaxy Grand 2
            ], [[MODEL, 'Galaxy Grand 2'], [VENDOR, 'Samsung'], [TYPE, MOBILE]], [
            /(SM-G530H)/i                                                       // Samsung Galaxy Grand Prime
            ], [[MODEL, 'Galaxy Grand Prime'], [VENDOR, 'Samsung'], [TYPE, MOBILE]], [
            /(SM-G313HZ)/i                                                      // Samsung Galaxy V
            ], [[MODEL, 'Galaxy V'], [VENDOR, 'Samsung'], [TYPE, MOBILE]], [
            /(SM-T805)/i                                                        // Samsung Galaxy Tab S 10.5
            ], [[MODEL, 'Galaxy Tab S 10.5'], [VENDOR, 'Samsung'], [TYPE, TABLET]], [
            /(SM-G800F)/i                                                       // Samsung Galaxy S5 Mini
            ], [[MODEL, 'Galaxy S5 Mini'], [VENDOR, 'Samsung'], [TYPE, MOBILE]], [
            /(SM-T311)/i                                                        // Samsung Galaxy Tab 3 8.0
            ], [[MODEL, 'Galaxy Tab 3 8.0'], [VENDOR, 'Samsung'], [TYPE, TABLET]], [

            /(T3C)/i                                                            // Advan Vandroid T3C
            ], [MODEL, [VENDOR, 'Advan'], [TYPE, TABLET]], [
            /(ADVAN T1J\+)/i                                                    // Advan Vandroid T1J+
            ], [[MODEL, 'Vandroid T1J+'], [VENDOR, 'Advan'], [TYPE, TABLET]], [
            /(ADVAN S4A)/i                                                      // Advan Vandroid S4A
            ], [[MODEL, 'Vandroid S4A'], [VENDOR, 'Advan'], [TYPE, MOBILE]], [

            /(V972M)/i                                                          // ZTE V972M
            ], [MODEL, [VENDOR, 'ZTE'], [TYPE, MOBILE]], [

            /(i-mobile)\s(IQ\s[\d\.]+)/i                                        // i-mobile IQ
            ], [VENDOR, MODEL, [TYPE, MOBILE]], [
            /(IQ6.3)/i                                                          // i-mobile IQ IQ 6.3
            ], [[MODEL, 'IQ 6.3'], [VENDOR, 'i-mobile'], [TYPE, MOBILE]], [
            /(i-mobile)\s(i-style\s[\d\.]+)/i                                   // i-mobile i-STYLE
            ], [VENDOR, MODEL, [TYPE, MOBILE]], [
            /(i-STYLE2.1)/i                                                     // i-mobile i-STYLE 2.1
            ], [[MODEL, 'i-STYLE 2.1'], [VENDOR, 'i-mobile'], [TYPE, MOBILE]], [

            /(mobiistar touch LAI 512)/i                                        // mobiistar touch LAI 512
            ], [[MODEL, 'Touch LAI 512'], [VENDOR, 'mobiistar'], [TYPE, MOBILE]], [

            /////////////
            // END TODO
            ///////////*/

        ],

        engine : [[

            /windows.+\sedge\/([\w\.]+)/i                                       // EdgeHTML
            ], [VERSION, [NAME, 'EdgeHTML']], [

            /(presto)\/([\w\.]+)/i,                                             // Presto
            /(webkit|trident|netfront|netsurf|amaya|lynx|w3m)\/([\w\.]+)/i,     // WebKit/Trident/NetFront/NetSurf/Amaya/Lynx/w3m
            /(khtml|tasman|links)[\/\s]\(?([\w\.]+)/i,                          // KHTML/Tasman/Links
            /(icab)[\/\s]([23]\.[\d\.]+)/i                                      // iCab
            ], [NAME, VERSION], [

            /rv\:([\w\.]+).*(gecko)/i                                           // Gecko
            ], [VERSION, NAME]
        ],

        os : [[

            // Windows based
            /microsoft\s(windows)\s(vista|xp)/i                                 // Windows (iTunes)
            ], [NAME, VERSION], [
            /(windows)\snt\s6\.2;\s(arm)/i,                                     // Windows RT
            /(windows\sphone(?:\sos)*)[\s\/]?([\d\.\s]+\w)*/i,                  // Windows Phone
            /(windows\smobile|windows)[\s\/]?([ntce\d\.\s]+\w)/i
            ], [NAME, [VERSION, mapper.str, maps.os.windows.version]], [
            /(win(?=3|9|n)|win\s9x\s)([nt\d\.]+)/i
            ], [[NAME, 'Windows'], [VERSION, mapper.str, maps.os.windows.version]], [

            // Mobile/Embedded OS
            /\((bb)(10);/i                                                      // BlackBerry 10
            ], [[NAME, 'BlackBerry'], VERSION], [
            /(blackberry)\w*\/?([\w\.]+)*/i,                                    // Blackberry
            /(tizen)[\/\s]([\w\.]+)/i,                                          // Tizen
            /(android|webos|palm\sos|qnx|bada|rim\stablet\sos|meego|contiki)[\/\s-]?([\w\.]+)*/i,
                                                                                // Android/WebOS/Palm/QNX/Bada/RIM/MeeGo/Contiki
            /linux;.+(sailfish);/i                                              // Sailfish OS
            ], [NAME, VERSION], [
            /(symbian\s?os|symbos|s60(?=;))[\/\s-]?([\w\.]+)*/i                 // Symbian
            ], [[NAME, 'Symbian'], VERSION], [
            /\((series40);/i                                                    // Series 40
            ], [NAME], [
            /mozilla.+\(mobile;.+gecko.+firefox/i                               // Firefox OS
            ], [[NAME, 'Firefox OS'], VERSION], [

            // Console
            /(nintendo|playstation)\s([wids34portablevu]+)/i,                   // Nintendo/Playstation

            // GNU/Linux based
            /(mint)[\/\s\(]?(\w+)*/i,                                           // Mint
            /(mageia|vectorlinux)[;\s]/i,                                       // Mageia/VectorLinux
            /(joli|[kxln]?ubuntu|debian|[open]*suse|gentoo|(?=\s)arch|slackware|fedora|mandriva|centos|pclinuxos|redhat|zenwalk|linpus)[\/\s-]?(?!chrom)([\w\.-]+)*/i,
                                                                                // Joli/Ubuntu/Debian/SUSE/Gentoo/Arch/Slackware
                                                                                // Fedora/Mandriva/CentOS/PCLinuxOS/RedHat/Zenwalk/Linpus
            /(hurd|linux)\s?([\w\.]+)*/i,                                       // Hurd/Linux
            /(gnu)\s?([\w\.]+)*/i                                               // GNU
            ], [NAME, VERSION], [

            /(cros)\s[\w]+\s([\w\.]+\w)/i                                       // Chromium OS
            ], [[NAME, 'Chromium OS'], VERSION],[

            // Solaris
            /(sunos)\s?([\w\.]+\d)*/i                                           // Solaris
            ], [[NAME, 'Solaris'], VERSION], [

            // BSD based
            /\s([frentopc-]{0,4}bsd|dragonfly)\s?([\w\.]+)*/i                   // FreeBSD/NetBSD/OpenBSD/PC-BSD/DragonFly
            ], [NAME, VERSION],[

            /(haiku)\s(\w+)/i                                                  // Haiku
            ], [NAME, VERSION],[

            /cfnetwork\/.+darwin/i,
            /ip[honead]+(?:.*os\s([\w]+)\slike\smac|;\sopera)/i                 // iOS
            ], [[VERSION, /_/g, '.'], [NAME, 'iOS']], [

            /(mac\sos\sx)\s?([\w\s\.]+\w)*/i,
            /(macintosh|mac(?=_powerpc)\s)/i                                    // Mac OS
            ], [[NAME, 'Mac OS'], [VERSION, /_/g, '.']], [

            // Other
            /((?:open)?solaris)[\/\s-]?([\w\.]+)*/i,                            // Solaris
            /(aix)\s((\d)(?=\.|\)|\s)[\w\.]*)*/i,                               // AIX
            /(plan\s9|minix|beos|os\/2|amigaos|morphos|risc\sos|openvms)/i,
                                                                                // Plan9/Minix/BeOS/OS2/AmigaOS/MorphOS/RISCOS/OpenVMS
            /(unix)\s?([\w\.]+)*/i                                              // UNIX
            ], [NAME, VERSION]
        ]
    };


    /////////////////
    // Constructor
    ////////////////
    /*
    var Browser = function (name, version) {
        this[NAME] = name;
        this[VERSION] = version;
    };
    var CPU = function (arch) {
        this[ARCHITECTURE] = arch;
    };
    var Device = function (vendor, model, type) {
        this[VENDOR] = vendor;
        this[MODEL] = model;
        this[TYPE] = type;
    };
    var Engine = Browser;
    var OS = Browser;
    */
    var UAParser = function (uastring, extensions) {

        if (typeof uastring === 'object') {
            extensions = uastring;
            uastring = undefined;
        }

        if (!(this instanceof UAParser)) {
            return new UAParser(uastring, extensions).getResult();
        }

        var ua = uastring || ((window && window.navigator && window.navigator.userAgent) ? window.navigator.userAgent : EMPTY);
        var rgxmap = extensions ? util.extend(regexes, extensions) : regexes;
        //var browser = new Browser();
        //var cpu = new CPU();
        //var device = new Device();
        //var engine = new Engine();
        //var os = new OS();

        this.getBrowser = function () {
            var browser = { name: undefined, version: undefined };
            mapper.rgx.call(browser, ua, rgxmap.browser);
            browser.major = util.major(browser.version); // deprecated
            return browser;
        };
        this.getCPU = function () {
            var cpu = { architecture: undefined };
            mapper.rgx.call(cpu, ua, rgxmap.cpu);
            return cpu;
        };
        this.getDevice = function () {
            var device = { vendor: undefined, model: undefined, type: undefined };
            mapper.rgx.call(device, ua, rgxmap.device);
            return device;
        };
        this.getEngine = function () {
            var engine = { name: undefined, version: undefined };
            mapper.rgx.call(engine, ua, rgxmap.engine);
            return engine;
        };
        this.getOS = function () {
            var os = { name: undefined, version: undefined };
            mapper.rgx.call(os, ua, rgxmap.os);
            return os;
        };
        this.getResult = function () {
            return {
                ua      : this.getUA(),
                browser : this.getBrowser(),
                engine  : this.getEngine(),
                os      : this.getOS(),
                device  : this.getDevice(),
                cpu     : this.getCPU()
            };
        };
        this.getUA = function () {
            return ua;
        };
        this.setUA = function (uastring) {
            ua = uastring;
            //browser = new Browser();
            //cpu = new CPU();
            //device = new Device();
            //engine = new Engine();
            //os = new OS();
            return this;
        };
        return this;
    };

    UAParser.VERSION = LIBVERSION;
    UAParser.BROWSER = {
        NAME    : NAME,
        MAJOR   : MAJOR, // deprecated
        VERSION : VERSION
    };
    UAParser.CPU = {
        ARCHITECTURE : ARCHITECTURE
    };
    UAParser.DEVICE = {
        MODEL   : MODEL,
        VENDOR  : VENDOR,
        TYPE    : TYPE,
        CONSOLE : CONSOLE,
        MOBILE  : MOBILE,
        SMARTTV : SMARTTV,
        TABLET  : TABLET,
        WEARABLE: WEARABLE,
        EMBEDDED: EMBEDDED
    };
    UAParser.ENGINE = {
        NAME    : NAME,
        VERSION : VERSION
    };
    UAParser.OS = {
        NAME    : NAME,
        VERSION : VERSION
    };
    //UAParser.Utils = util;

    ///////////
    // Export
    //////////


    // check js environment
    if (typeof(exports) !== UNDEF_TYPE) {
        // nodejs env
        if (typeof module !== UNDEF_TYPE && module.exports) {
            exports = module.exports = UAParser;
        }
        // TODO: test!!!!!!!!
        /*
        if (require && require.main === module && process) {
            // cli
            var jsonize = function (arr) {
                var res = [];
                for (var i in arr) {
                    res.push(new UAParser(arr[i]).getResult());
                }
                process.stdout.write(JSON.stringify(res, null, 2) + '\n');
            };
            if (process.stdin.isTTY) {
                // via args
                jsonize(process.argv.slice(2));
            } else {
                // via pipe
                var str = '';
                process.stdin.on('readable', function() {
                    var read = process.stdin.read();
                    if (read !== null) {
                        str += read;
                    }
                });
                process.stdin.on('end', function () {
                    jsonize(str.replace(/\n$/, '').split('\n'));
                });
            }
        }
        */
        exports.UAParser = UAParser;
    } else {
        // requirejs env (optional)
        if (typeof(define) === FUNC_TYPE && define.amd) {
            define(function () {
                return UAParser;
            });
        } else if (window) {
            // browser env
            window.UAParser = UAParser;
        }
    }

    // jQuery/Zepto specific (optional)
    // Note:
    //   In AMD env the global scope should be kept clean, but jQuery is an exception.
    //   jQuery always exports to global scope, unless jQuery.noConflict(true) is used,
    //   and we should catch that.
    var $ = window && (window.jQuery || window.Zepto);
    if (typeof $ !== UNDEF_TYPE) {
        var parser = new UAParser();
        $.ua = parser.getResult();
        $.ua.get = function () {
            return parser.getUA();
        };
        $.ua.set = function (uastring) {
            parser.setUA(uastring);
            var result = parser.getResult();
            for (var prop in result) {
                $.ua[prop] = result[prop];
            }
        };
    }

})(typeof window === 'object' ? window : this);

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:livechat/livechat.js");
require("/node_modules/meteor/rocketchat:livechat/server/startup.js");
require("/node_modules/meteor/rocketchat:livechat/server/visitorStatus.js");
require("/node_modules/meteor/rocketchat:livechat/permissions.js");
require("/node_modules/meteor/rocketchat:livechat/messageTypes.js");
require("/node_modules/meteor/rocketchat:livechat/roomType.js");
require("/node_modules/meteor/rocketchat:livechat/config.js");
require("/node_modules/meteor/rocketchat:livechat/server/hooks/externalMessage.js");
require("/node_modules/meteor/rocketchat:livechat/server/hooks/leadCapture.js");
require("/node_modules/meteor/rocketchat:livechat/server/hooks/markRoomResponded.js");
require("/node_modules/meteor/rocketchat:livechat/server/hooks/offlineMessage.js");
require("/node_modules/meteor/rocketchat:livechat/server/hooks/RDStation.js");
require("/node_modules/meteor/rocketchat:livechat/server/hooks/sendToCRM.js");
require("/node_modules/meteor/rocketchat:livechat/server/hooks/sendToFacebook.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/addAgent.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/addManager.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/changeLivechatStatus.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/closeByVisitor.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/closeRoom.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/facebook.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/getCustomFields.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/getAgentData.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/getInitialData.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/getNextAgent.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/loadHistory.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/loginByToken.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/pageVisited.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/registerGuest.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/removeAgent.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/removeCustomField.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/removeDepartment.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/removeManager.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/removeTrigger.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/saveAppearance.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/saveCustomField.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/saveDepartment.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/saveInfo.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/saveIntegration.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/saveSurveyFeedback.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/saveTrigger.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/searchAgent.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/sendMessageLivechat.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/sendOfflineMessage.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/setCustomField.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/setDepartmentForVisitor.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/startVideoCall.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/transfer.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/webhookTest.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/takeInquiry.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/returnAsInquiry.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/saveOfficeHours.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/sendTranscript.js");
require("/node_modules/meteor/rocketchat:livechat/server/models/Users.js");
require("/node_modules/meteor/rocketchat:livechat/server/models/Rooms.js");
require("/node_modules/meteor/rocketchat:livechat/server/models/LivechatExternalMessage.js");
require("/node_modules/meteor/rocketchat:livechat/server/models/LivechatCustomField.js");
require("/node_modules/meteor/rocketchat:livechat/server/models/LivechatDepartment.js");
require("/node_modules/meteor/rocketchat:livechat/server/models/LivechatDepartmentAgents.js");
require("/node_modules/meteor/rocketchat:livechat/server/models/LivechatPageVisited.js");
require("/node_modules/meteor/rocketchat:livechat/server/models/LivechatTrigger.js");
require("/node_modules/meteor/rocketchat:livechat/server/models/indexes.js");
require("/node_modules/meteor/rocketchat:livechat/server/models/LivechatInquiry.js");
require("/node_modules/meteor/rocketchat:livechat/server/models/LivechatOfficeHour.js");
require("/node_modules/meteor/rocketchat:livechat/server/lib/Livechat.js");
require("/node_modules/meteor/rocketchat:livechat/server/lib/QueueMethods.js");
require("/node_modules/meteor/rocketchat:livechat/server/lib/OfficeClock.js");
require("/node_modules/meteor/rocketchat:livechat/server/sendMessageBySMS.js");
require("/node_modules/meteor/rocketchat:livechat/server/unclosedLivechats.js");
require("/node_modules/meteor/rocketchat:livechat/server/publications/customFields.js");
require("/node_modules/meteor/rocketchat:livechat/server/publications/departmentAgents.js");
require("/node_modules/meteor/rocketchat:livechat/server/publications/externalMessages.js");
require("/node_modules/meteor/rocketchat:livechat/server/publications/livechatAgents.js");
require("/node_modules/meteor/rocketchat:livechat/server/publications/livechatAppearance.js");
require("/node_modules/meteor/rocketchat:livechat/server/publications/livechatDepartments.js");
require("/node_modules/meteor/rocketchat:livechat/server/publications/livechatIntegration.js");
require("/node_modules/meteor/rocketchat:livechat/server/publications/livechatManagers.js");
require("/node_modules/meteor/rocketchat:livechat/server/publications/livechatRooms.js");
require("/node_modules/meteor/rocketchat:livechat/server/publications/livechatQueue.js");
require("/node_modules/meteor/rocketchat:livechat/server/publications/livechatTriggers.js");
require("/node_modules/meteor/rocketchat:livechat/server/publications/visitorHistory.js");
require("/node_modules/meteor/rocketchat:livechat/server/publications/visitorInfo.js");
require("/node_modules/meteor/rocketchat:livechat/server/publications/visitorPageVisited.js");
require("/node_modules/meteor/rocketchat:livechat/server/publications/livechatInquiries.js");
require("/node_modules/meteor/rocketchat:livechat/server/publications/livechatOfficeHours.js");
require("/node_modules/meteor/rocketchat:livechat/server/api.js");

/* Exports */
Package._define("rocketchat:livechat");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_livechat.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9saXZlY2hhdC5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9zZXJ2ZXIvc3RhcnR1cC5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9zZXJ2ZXIvdmlzaXRvclN0YXR1cy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9zZXJ2ZXIvaG9va3MvZXh0ZXJuYWxNZXNzYWdlLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmxpdmVjaGF0L3NlcnZlci9ob29rcy9sZWFkQ2FwdHVyZS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9zZXJ2ZXIvaG9va3MvbWFya1Jvb21SZXNwb25kZWQuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL2hvb2tzL29mZmxpbmVNZXNzYWdlLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmxpdmVjaGF0L3NlcnZlci9ob29rcy9SRFN0YXRpb24uanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL2hvb2tzL3NlbmRUb0NSTS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9zZXJ2ZXIvaG9va3Mvc2VuZFRvRmFjZWJvb2suanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL21ldGhvZHMvYWRkQWdlbnQuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL21ldGhvZHMvYWRkTWFuYWdlci5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9zZXJ2ZXIvbWV0aG9kcy9jaGFuZ2VMaXZlY2hhdFN0YXR1cy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9zZXJ2ZXIvbWV0aG9kcy9jbG9zZUJ5VmlzaXRvci5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9zZXJ2ZXIvbWV0aG9kcy9jbG9zZVJvb20uanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL21ldGhvZHMvZmFjZWJvb2suanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL21ldGhvZHMvZ2V0Q3VzdG9tRmllbGRzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmxpdmVjaGF0L3NlcnZlci9tZXRob2RzL2dldEFnZW50RGF0YS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9zZXJ2ZXIvbWV0aG9kcy9nZXRJbml0aWFsRGF0YS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9zZXJ2ZXIvbWV0aG9kcy9nZXROZXh0QWdlbnQuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL21ldGhvZHMvbG9hZEhpc3RvcnkuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL21ldGhvZHMvbG9naW5CeVRva2VuLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmxpdmVjaGF0L3NlcnZlci9tZXRob2RzL3BhZ2VWaXNpdGVkLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmxpdmVjaGF0L3NlcnZlci9tZXRob2RzL3JlZ2lzdGVyR3Vlc3QuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL21ldGhvZHMvcmVtb3ZlQWdlbnQuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL21ldGhvZHMvcmVtb3ZlQ3VzdG9tRmllbGQuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL21ldGhvZHMvcmVtb3ZlRGVwYXJ0bWVudC5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9zZXJ2ZXIvbWV0aG9kcy9yZW1vdmVNYW5hZ2VyLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmxpdmVjaGF0L3NlcnZlci9tZXRob2RzL3JlbW92ZVRyaWdnZXIuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL21ldGhvZHMvc2F2ZUFwcGVhcmFuY2UuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL21ldGhvZHMvc2F2ZUN1c3RvbUZpZWxkLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmxpdmVjaGF0L3NlcnZlci9tZXRob2RzL3NhdmVEZXBhcnRtZW50LmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmxpdmVjaGF0L3NlcnZlci9tZXRob2RzL3NhdmVJbmZvLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmxpdmVjaGF0L3NlcnZlci9tZXRob2RzL3NhdmVJbnRlZ3JhdGlvbi5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9zZXJ2ZXIvbWV0aG9kcy9zYXZlU3VydmV5RmVlZGJhY2suanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL21ldGhvZHMvc2F2ZVRyaWdnZXIuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL21ldGhvZHMvc2VhcmNoQWdlbnQuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL21ldGhvZHMvc2VuZE1lc3NhZ2VMaXZlY2hhdC5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9zZXJ2ZXIvbWV0aG9kcy9zZW5kT2ZmbGluZU1lc3NhZ2UuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL21ldGhvZHMvc2V0Q3VzdG9tRmllbGQuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL21ldGhvZHMvc2V0RGVwYXJ0bWVudEZvclZpc2l0b3IuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL21ldGhvZHMvc3RhcnRWaWRlb0NhbGwuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL21ldGhvZHMvdHJhbnNmZXIuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL21ldGhvZHMvd2ViaG9va1Rlc3QuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL21ldGhvZHMvdGFrZUlucXVpcnkuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL21ldGhvZHMvcmV0dXJuQXNJbnF1aXJ5LmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmxpdmVjaGF0L3NlcnZlci9tZXRob2RzL3NhdmVPZmZpY2VIb3Vycy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9zZXJ2ZXIvbWV0aG9kcy9zZW5kVHJhbnNjcmlwdC5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9zZXJ2ZXIvbW9kZWxzL1VzZXJzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmxpdmVjaGF0L3NlcnZlci9tb2RlbHMvUm9vbXMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL21vZGVscy9MaXZlY2hhdEV4dGVybmFsTWVzc2FnZS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9zZXJ2ZXIvbW9kZWxzL0xpdmVjaGF0Q3VzdG9tRmllbGQuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL21vZGVscy9MaXZlY2hhdERlcGFydG1lbnQuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL21vZGVscy9MaXZlY2hhdERlcGFydG1lbnRBZ2VudHMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL21vZGVscy9MaXZlY2hhdFBhZ2VWaXNpdGVkLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmxpdmVjaGF0L3NlcnZlci9tb2RlbHMvTGl2ZWNoYXRUcmlnZ2VyLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmxpdmVjaGF0L3NlcnZlci9tb2RlbHMvaW5kZXhlcy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9zZXJ2ZXIvbW9kZWxzL0xpdmVjaGF0SW5xdWlyeS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9zZXJ2ZXIvbW9kZWxzL0xpdmVjaGF0T2ZmaWNlSG91ci5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9zZXJ2ZXIvbW9kZWxzL0xpdmVjaGF0VmlzaXRvcnMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL2xpYi9MaXZlY2hhdC5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9zZXJ2ZXIvbGliL1F1ZXVlTWV0aG9kcy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9zZXJ2ZXIvbGliL09mZmljZUNsb2NrLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmxpdmVjaGF0L3NlcnZlci9saWIvT21uaUNoYW5uZWwuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL3NlbmRNZXNzYWdlQnlTTVMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL3VuY2xvc2VkTGl2ZWNoYXRzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmxpdmVjaGF0L3NlcnZlci9wdWJsaWNhdGlvbnMvY3VzdG9tRmllbGRzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmxpdmVjaGF0L3NlcnZlci9wdWJsaWNhdGlvbnMvZGVwYXJ0bWVudEFnZW50cy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9zZXJ2ZXIvcHVibGljYXRpb25zL2V4dGVybmFsTWVzc2FnZXMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL3B1YmxpY2F0aW9ucy9saXZlY2hhdEFnZW50cy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9zZXJ2ZXIvcHVibGljYXRpb25zL2xpdmVjaGF0QXBwZWFyYW5jZS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9zZXJ2ZXIvcHVibGljYXRpb25zL2xpdmVjaGF0RGVwYXJ0bWVudHMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL3B1YmxpY2F0aW9ucy9saXZlY2hhdEludGVncmF0aW9uLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmxpdmVjaGF0L3NlcnZlci9wdWJsaWNhdGlvbnMvbGl2ZWNoYXRNYW5hZ2Vycy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9zZXJ2ZXIvcHVibGljYXRpb25zL2xpdmVjaGF0Um9vbXMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL3B1YmxpY2F0aW9ucy9saXZlY2hhdFF1ZXVlLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmxpdmVjaGF0L3NlcnZlci9wdWJsaWNhdGlvbnMvbGl2ZWNoYXRUcmlnZ2Vycy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9zZXJ2ZXIvcHVibGljYXRpb25zL3Zpc2l0b3JIaXN0b3J5LmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmxpdmVjaGF0L3NlcnZlci9wdWJsaWNhdGlvbnMvdmlzaXRvckluZm8uanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL3B1YmxpY2F0aW9ucy92aXNpdG9yUGFnZVZpc2l0ZWQuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL3B1YmxpY2F0aW9ucy9saXZlY2hhdElucXVpcmllcy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9zZXJ2ZXIvcHVibGljYXRpb25zL2xpdmVjaGF0T2ZmaWNlSG91cnMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL2FwaS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9wZXJtaXNzaW9ucy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9tZXNzYWdlVHlwZXMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvcm9vbVR5cGUuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvY29uZmlnLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmxpdmVjaGF0L2ltcG9ydHMvc2VydmVyL3Jlc3QvZGVwYXJ0bWVudHMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvaW1wb3J0cy9zZXJ2ZXIvcmVzdC9mYWNlYm9vay5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9pbXBvcnRzL3NlcnZlci9yZXN0L21lc3NhZ2VzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmxpdmVjaGF0L2ltcG9ydHMvc2VydmVyL3Jlc3Qvc21zLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmxpdmVjaGF0L2ltcG9ydHMvc2VydmVyL3Jlc3QvdXNlcnMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvaW1wb3J0cy9zZXJ2ZXIvcmVzdC92aXNpdG9ycy5qcyJdLCJuYW1lcyI6WyJfIiwibW9kdWxlIiwid2F0Y2giLCJyZXF1aXJlIiwiZGVmYXVsdCIsInYiLCJ1cmwiLCJXZWJBcHAiLCJQYWNrYWdlIiwid2ViYXBwIiwiQXV0b3VwZGF0ZSIsImF1dG91cGRhdGUiLCJjb25uZWN0SGFuZGxlcnMiLCJ1c2UiLCJNZXRlb3IiLCJiaW5kRW52aXJvbm1lbnQiLCJyZXEiLCJyZXMiLCJuZXh0IiwicmVxVXJsIiwicGFyc2UiLCJwYXRobmFtZSIsInNldEhlYWRlciIsImRvbWFpbldoaXRlTGlzdCIsIlJvY2tldENoYXQiLCJzZXR0aW5ncyIsImdldCIsImhlYWRlcnMiLCJyZWZlcmVyIiwiaXNFbXB0eSIsInRyaW0iLCJtYXAiLCJzcGxpdCIsImRvbWFpbiIsImNvbnRhaW5zIiwiaG9zdCIsInByb3RvY29sIiwiaGVhZCIsIkFzc2V0cyIsImdldFRleHQiLCJiYXNlVXJsIiwiX19tZXRlb3JfcnVudGltZV9jb25maWdfXyIsIlJPT1RfVVJMX1BBVEhfUFJFRklYIiwidGVzdCIsImh0bWwiLCJhdXRvdXBkYXRlVmVyc2lvbiIsIkpTT04iLCJzdHJpbmdpZnkiLCJ3cml0ZSIsImVuZCIsInN0YXJ0dXAiLCJyb29tVHlwZXMiLCJzZXRSb29tRmluZCIsImNvZGUiLCJtb2RlbHMiLCJSb29tcyIsImZpbmRMaXZlY2hhdEJ5Q29kZSIsImF1dGh6IiwiYWRkUm9vbUFjY2Vzc1ZhbGlkYXRvciIsInJvb20iLCJ1c2VyIiwidCIsImhhc1Blcm1pc3Npb24iLCJfaWQiLCJleHRyYURhdGEiLCJ0b2tlbiIsImNhbGxiYWNrcyIsImFkZCIsIkVycm9yIiwiVEFQaTE4biIsIl9fIiwibG5nIiwibGFuZ3VhZ2UiLCJwcmlvcml0eSIsIkxPVyIsIlVzZXJQcmVzZW5jZUV2ZW50cyIsIm9uIiwic2Vzc2lvbiIsInN0YXR1cyIsIm1ldGFkYXRhIiwidmlzaXRvciIsIkxpdmVjaGF0SW5xdWlyeSIsInVwZGF0ZVZpc2l0b3JTdGF0dXMiLCJrbm93bGVkZ2VFbmFibGVkIiwiYXBpYWlLZXkiLCJhcGlhaUxhbmd1YWdlIiwia2V5IiwidmFsdWUiLCJtZXNzYWdlIiwiZWRpdGVkQXQiLCJkZWZlciIsInJlc3BvbnNlIiwiSFRUUCIsInBvc3QiLCJkYXRhIiwicXVlcnkiLCJtc2ciLCJsYW5nIiwic2Vzc2lvbklkIiwicmVzdWx0IiwiZnVsZmlsbG1lbnQiLCJzcGVlY2giLCJMaXZlY2hhdEV4dGVybmFsTWVzc2FnZSIsImluc2VydCIsInJpZCIsIm9yaWciLCJ0cyIsIkRhdGUiLCJlIiwiU3lzdGVtTG9nZ2VyIiwiZXJyb3IiLCJMaXZlY2hhdFZpc2l0b3JzIiwidmFsaWRhdGVNZXNzYWdlIiwicGhvbmVSZWdleHAiLCJSZWdFeHAiLCJtc2dQaG9uZXMiLCJtYXRjaCIsImVtYWlsUmVnZXhwIiwibXNnRW1haWxzIiwic2F2ZUd1ZXN0RW1haWxQaG9uZUJ5SWQiLCJydW4iLCJ3YWl0aW5nUmVzcG9uc2UiLCJub3ciLCJzZXRSZXNwb25zZUJ5Um9vbUlkIiwidSIsInVzZXJuYW1lIiwicmVzcG9uc2VEYXRlIiwicmVzcG9uc2VUaW1lIiwiZ2V0VGltZSIsInBvc3REYXRhIiwidHlwZSIsInNlbnRBdCIsIm5hbWUiLCJlbWFpbCIsIkxpdmVjaGF0Iiwic2VuZFJlcXVlc3QiLCJNRURJVU0iLCJzZW5kVG9SRFN0YXRpb24iLCJsaXZlY2hhdERhdGEiLCJnZXRMaXZlY2hhdFJvb21HdWVzdEluZm8iLCJvcHRpb25zIiwidG9rZW5fcmRzdGF0aW9uIiwiaWRlbnRpZmljYWRvciIsImNsaWVudF9pZCIsIm5vbWUiLCJwaG9uZSIsInRlbGVmb25lIiwidGFncyIsIk9iamVjdCIsImtleXMiLCJjdXN0b21GaWVsZHMiLCJmb3JFYWNoIiwiZmllbGQiLCJjYWxsIiwiY29uc29sZSIsInNlbmRUb0NSTSIsImluY2x1ZGVNZXNzYWdlcyIsIm1lc3NhZ2VzIiwiTWVzc2FnZXMiLCJmaW5kVmlzaWJsZUJ5Um9vbUlkIiwic29ydCIsIkFycmF5IiwiYWdlbnRJZCIsInB1c2giLCJzYXZlQ1JNRGF0YUJ5Um9vbUlkIiwib3BlbiIsIk9tbmlDaGFubmVsIiwiZmFjZWJvb2siLCJyZXBseSIsInBhZ2UiLCJpZCIsInRleHQiLCJtZXRob2RzIiwidXNlcklkIiwibWV0aG9kIiwiYWRkQWdlbnQiLCJhZGRNYW5hZ2VyIiwibmV3U3RhdHVzIiwic3RhdHVzTGl2ZWNoYXQiLCJVc2VycyIsInNldExpdmVjaGF0U3RhdHVzIiwicm9vbUlkIiwiZmluZE9uZU9wZW5CeVZpc2l0b3JUb2tlbiIsImdldFZpc2l0b3JCeVRva2VuIiwiY2xvc2VSb29tIiwiY29tbWVudCIsImZpbmRPbmVCeUlkIiwidXNlcm5hbWVzIiwiaW5kZXhPZiIsImFjdGlvbiIsImVuYWJsZWQiLCJoYXNUb2tlbiIsImVuYWJsZSIsInN1Y2Nlc3MiLCJ1cGRhdGVCeUlkIiwiZGlzYWJsZSIsImxpc3RQYWdlcyIsInN1YnNjcmliZSIsInVuc3Vic2NyaWJlIiwiTGl2ZWNoYXRDdXN0b21GaWVsZCIsImZpbmQiLCJmZXRjaCIsImNoZWNrIiwiU3RyaW5nIiwic2VydmVkQnkiLCJnZXRBZ2VudEluZm8iLCJ2aXNpdG9yVG9rZW4iLCJpbmZvIiwidGl0bGUiLCJjb2xvciIsInJlZ2lzdHJhdGlvbkZvcm0iLCJ0cmlnZ2VycyIsImRlcGFydG1lbnRzIiwiYWxsb3dTd2l0Y2hpbmdEZXBhcnRtZW50cyIsIm9ubGluZSIsIm9mZmxpbmVDb2xvciIsIm9mZmxpbmVNZXNzYWdlIiwib2ZmbGluZVN1Y2Nlc3NNZXNzYWdlIiwib2ZmbGluZVVuYXZhaWxhYmxlTWVzc2FnZSIsImRpc3BsYXlPZmZsaW5lRm9ybSIsInZpZGVvQ2FsbCIsImNvbnZlcnNhdGlvbkZpbmlzaGVkTWVzc2FnZSIsImZpbmRPcGVuQnlWaXNpdG9yVG9rZW4iLCJmaWVsZHMiLCJjbCIsImxlbmd0aCIsInZpc2l0b3JFbWFpbHMiLCJpbml0U2V0dGluZ3MiLCJnZXRJbml0U2V0dGluZ3MiLCJMaXZlY2hhdF90aXRsZSIsIkxpdmVjaGF0X3RpdGxlX2NvbG9yIiwiTGl2ZWNoYXRfZW5hYmxlZCIsIkxpdmVjaGF0X3JlZ2lzdHJhdGlvbl9mb3JtIiwib2ZmbGluZVRpdGxlIiwiTGl2ZWNoYXRfb2ZmbGluZV90aXRsZSIsIkxpdmVjaGF0X29mZmxpbmVfdGl0bGVfY29sb3IiLCJMaXZlY2hhdF9vZmZsaW5lX21lc3NhZ2UiLCJMaXZlY2hhdF9vZmZsaW5lX3N1Y2Nlc3NfbWVzc2FnZSIsIkxpdmVjaGF0X29mZmxpbmVfZm9ybV91bmF2YWlsYWJsZSIsIkxpdmVjaGF0X2Rpc3BsYXlfb2ZmbGluZV9mb3JtIiwiTGFuZ3VhZ2UiLCJMaXZlY2hhdF92aWRlb2NhbGxfZW5hYmxlZCIsIkppdHNpX0VuYWJsZWQiLCJ0cmFuc2NyaXB0IiwiTGl2ZWNoYXRfZW5hYmxlX3RyYW5zY3JpcHQiLCJ0cmFuc2NyaXB0TWVzc2FnZSIsIkxpdmVjaGF0X3RyYW5zY3JpcHRfbWVzc2FnZSIsIkxpdmVjaGF0X2NvbnZlcnNhdGlvbl9maW5pc2hlZF9tZXNzYWdlIiwiYWdlbnREYXRhIiwiTGl2ZWNoYXRUcmlnZ2VyIiwiZmluZEVuYWJsZWQiLCJ0cmlnZ2VyIiwicGljayIsIkxpdmVjaGF0RGVwYXJ0bWVudCIsImZpbmRFbmFibGVkV2l0aEFnZW50cyIsImRlcGFydG1lbnQiLCJMaXZlY2hhdF9hbGxvd19zd2l0Y2hpbmdfZGVwYXJ0bWVudHMiLCJmaW5kT25saW5lQWdlbnRzIiwiY291bnQiLCJyZXF1aXJlRGVwYXJtZW50IiwiZ2V0UmVxdWlyZWREZXBhcnRtZW50IiwiYWdlbnQiLCJnZXROZXh0QWdlbnQiLCJsaW1pdCIsImxzIiwibG9hZE1lc3NhZ2VIaXN0b3J5IiwicGFnZUluZm8iLCJzYXZlUGFnZUhpc3RvcnkiLCJyZWdpc3Rlckd1ZXN0IiwiTGl2ZWNoYXRQYWdlVmlzaXRlZCIsImtlZXBIaXN0b3J5Rm9yVG9rZW4iLCJyZW1vdmVBZ2VudCIsImN1c3RvbUZpZWxkIiwicmVtb3ZlQnlJZCIsInJlbW92ZURlcGFydG1lbnQiLCJyZW1vdmVNYW5hZ2VyIiwidHJpZ2dlcklkIiwidmFsaWRTZXR0aW5ncyIsInZhbGlkIiwiZXZlcnkiLCJzZXR0aW5nIiwiY3VzdG9tRmllbGREYXRhIiwiTWF0Y2giLCJPYmplY3RJbmNsdWRpbmciLCJsYWJlbCIsInNjb3BlIiwidmlzaWJpbGl0eSIsImNyZWF0ZU9yVXBkYXRlQ3VzdG9tRmllbGQiLCJkZXBhcnRtZW50RGF0YSIsImRlcGFydG1lbnRBZ2VudHMiLCJzYXZlRGVwYXJ0bWVudCIsImd1ZXN0RGF0YSIsInJvb21EYXRhIiwiT3B0aW9uYWwiLCJ0b3BpYyIsInJldCIsInNhdmVHdWVzdCIsInNhdmVSb29tSW5mbyIsInMiLCJ2YWx1ZXMiLCJ2aXNpdG9yUm9vbSIsImZvcm1EYXRhIiwidW5kZWZpbmVkIiwidXBkYXRlRGF0YSIsIml0ZW0iLCJ1cGRhdGVTdXJ2ZXlGZWVkYmFja0J5SWQiLCJNYXliZSIsImRlc2NyaXB0aW9uIiwiQm9vbGVhbiIsImNvbmRpdGlvbnMiLCJhY3Rpb25zIiwiaXNTdHJpbmciLCJmaW5kT25lQnlVc2VybmFtZSIsInNlbmRNZXNzYWdlTGl2ZWNoYXQiLCJndWVzdCIsInNlbmRNZXNzYWdlIiwiZG5zIiwiaGVhZGVyIiwicGxhY2Vob2xkZXJzIiwicmVwbGFjZSIsImZvb3RlciIsImZyb21FbWFpbCIsImVtYWlsRG9tYWluIiwic3Vic3RyIiwibGFzdEluZGV4T2YiLCJ3cmFwQXN5bmMiLCJyZXNvbHZlTXgiLCJFbWFpbCIsInNlbmQiLCJ0byIsImZyb20iLCJyZXBseVRvIiwic3ViamVjdCIsInN1YnN0cmluZyIsIkREUFJhdGVMaW1pdGVyIiwiYWRkUnVsZSIsImNvbm5lY3Rpb25JZCIsIm92ZXJ3cml0ZSIsInVwZGF0ZUxpdmVjaGF0RGF0YUJ5VG9rZW4iLCJzZXREZXBhcnRtZW50Rm9yR3Vlc3QiLCJSYW5kb20iLCJnZXRSb29tIiwiaml0c2lUaW1lb3V0IiwiY3JlYXRlV2l0aFR5cGVSb29tSWRNZXNzYWdlQW5kVXNlciIsImFjdGlvbkxpbmtzIiwiaWNvbiIsImkxOG5MYWJlbCIsIm1ldGhvZF9pZCIsInBhcmFtcyIsImppdHNpUm9vbSIsInRyYW5zZmVyRGF0YSIsImRlcGFydG1lbnRJZCIsImhhc1JvbGUiLCJ0cmFuc2ZlciIsInBvc3RDYXRjaEVycm9yIiwicmVzb2x2ZSIsImVyciIsInVuYmxvY2siLCJzYW1wbGVEYXRhIiwiY3JlYXRlZEF0IiwibGFzdE1lc3NhZ2VBdCIsInByb2R1Y3RJZCIsImlwIiwiYnJvd3NlciIsIm9zIiwiY3VzdG9tZXJJZCIsImxvZyIsInN0YXR1c0NvZGUiLCJpbnF1aXJ5SWQiLCJpbnF1aXJ5Iiwic3Vic2NyaXB0aW9uRGF0YSIsImFsZXJ0IiwidW5yZWFkIiwidXNlck1lbnRpb25zIiwiZ3JvdXBNZW50aW9ucyIsImRlc2t0b3BOb3RpZmljYXRpb25zIiwibW9iaWxlUHVzaE5vdGlmaWNhdGlvbnMiLCJlbWFpbE5vdGlmaWNhdGlvbnMiLCJTdWJzY3JpcHRpb25zIiwiY2hhbmdlQWdlbnRCeVJvb21JZCIsInRha2VJbnF1aXJ5IiwiY3JlYXRlQ29tbWFuZFdpdGhSb29tSWRBbmRVc2VyIiwic3RyZWFtIiwiZW1pdCIsInJlbW92ZUJ5Um9vbUlkIiwicmVtb3ZlVXNlcm5hbWVCeUlkIiwiZmluZE9uZSIsIm9wZW5JbnF1aXJ5IiwiZGF5Iiwic3RhcnQiLCJmaW5pc2giLCJMaXZlY2hhdE9mZmljZUhvdXIiLCJ1cGRhdGVIb3VycyIsIm1vbWVudCIsInVzZXJMYW5ndWFnZSIsImF1dGhvciIsImRhdGV0aW1lIiwibG9jYWxlIiwiZm9ybWF0Iiwic2luZ2xlTWVzc2FnZSIsImVtYWlsU2V0dGluZ3MiLCJzZXRPcGVyYXRvciIsIm9wZXJhdG9yIiwidXBkYXRlIiwiJHNldCIsIiRleGlzdHMiLCIkbmUiLCJyb2xlcyIsImZpbmRPbmVPbmxpbmVBZ2VudEJ5VXNlcm5hbWUiLCJmaW5kQWdlbnRzIiwiZmluZE9ubGluZVVzZXJGcm9tTGlzdCIsInVzZXJMaXN0IiwiJGluIiwiY29uY2F0IiwiY29sbGVjdGlvbk9iaiIsIm1vZGVsIiwicmF3Q29sbGVjdGlvbiIsImZpbmRBbmRNb2RpZnkiLCJsaXZlY2hhdENvdW50IiwiJGluYyIsImNsb3NlT2ZmaWNlIiwic2VsZiIsIm9wZW5PZmZpY2UiLCJlbWFpbHMiLCJzdXJ2ZXlGZWVkYmFjayIsImZpbmRMaXZlY2hhdCIsImZpbHRlciIsIm9mZnNldCIsImV4dGVuZCIsInBhcnNlSW50IiwiZ2V0TmV4dExpdmVjaGF0Um9vbUNvZGUiLCJzZXR0aW5nc1JhdyIsIlNldHRpbmdzIiwiZmluZEJ5VmlzaXRvclRva2VuIiwiZmluZEJ5VmlzaXRvcklkIiwidmlzaXRvcklkIiwicmVzcG9uc2VCeSIsIiR1bnNldCIsImNsb3NlQnlSb29tSWQiLCJjbG9zZUluZm8iLCJjbG9zZXIiLCJjbG9zZWRCeSIsImNsb3NlZEF0IiwiY2hhdER1cmF0aW9uIiwic2V0TGFiZWxCeVJvb21JZCIsImZpbmRPcGVuQnlBZ2VudCIsIm5ld0FnZW50IiwiY3JtRGF0YSIsIl9CYXNlIiwiY29uc3RydWN0b3IiLCJpc0NsaWVudCIsIl9pbml0TW9kZWwiLCJmaW5kQnlSb29tSWQiLCJyZWNvcmQiLCJyZW1vdmUiLCJ0cnlFbnN1cmVJbmRleCIsIm51bUFnZW50cyIsImZpbmRCeURlcGFydG1lbnRJZCIsImNyZWF0ZU9yVXBkYXRlRGVwYXJ0bWVudCIsInNob3dPblJlZ2lzdHJhdGlvbiIsImFnZW50cyIsInNhdmVkQWdlbnRzIiwicGx1Y2siLCJMaXZlY2hhdERlcGFydG1lbnRBZ2VudHMiLCJhZ2VudHNUb1NhdmUiLCJkaWZmZXJlbmNlIiwicmVtb3ZlQnlEZXBhcnRtZW50SWRBbmRBZ2VudElkIiwic2F2ZUFnZW50Iiwib3JkZXIiLCIkZ3QiLCJ1cHNlcnQiLCJnZXROZXh0QWdlbnRGb3JEZXBhcnRtZW50Iiwib25saW5lVXNlcnMiLCJvbmxpbmVVc2VybmFtZXMiLCJnZXRPbmxpbmVGb3JEZXBhcnRtZW50IiwiZGVwQWdlbnRzIiwiZmluZFVzZXJzSW5RdWV1ZSIsInVzZXJzTGlzdCIsInJlcGxhY2VVc2VybmFtZU9mQWdlbnRCeVVzZXJJZCIsIm11bHRpIiwic3BhcnNlIiwiZXhwaXJlQWZ0ZXJTZWNvbmRzIiwic2F2ZUJ5VG9rZW4iLCJrZWVwSGlzdG9yeU1pbGlzZWNvbmRzIiwiZXhwaXJlQXQiLCJmaW5kQnlUb2tlbiIsInJlbW92ZUFsbCIsImZpbmRCeUlkIiwiZ2V0U3RhdHVzIiwibmV3U3RhcnQiLCJuZXdGaW5pc2giLCJuZXdPcGVuIiwiaXNOb3dXaXRoaW5Ib3VycyIsImN1cnJlbnRUaW1lIiwidXRjIiwidG9kYXlzT2ZmaWNlSG91cnMiLCJpc0JlZm9yZSIsImlzQmV0d2VlbiIsImlzT3BlbmluZ1RpbWUiLCJpc1NhbWUiLCJpc0Nsb3NpbmdUaW1lIiwiZmluZFZpc2l0b3JCeVRva2VuIiwiZmluZE9uZVZpc2l0b3JCeVBob25lIiwiZ2V0TmV4dFZpc2l0b3JVc2VybmFtZSIsInNhdmVHdWVzdEJ5SWQiLCJzZXREYXRhIiwidW5zZXREYXRhIiwiYWRkcmVzcyIsInBob25lTnVtYmVyIiwiZmluZE9uZUd1ZXN0QnlFbWFpbEFkZHJlc3MiLCJlbWFpbEFkZHJlc3MiLCJlc2NhcGVSZWdFeHAiLCJwaG9uZXMiLCIkYWRkVG9TZXQiLCJzYXZlRW1haWwiLCIkZWFjaCIsInNhdmVQaG9uZSIsImV4cG9ydERlZmF1bHQiLCJVQVBhcnNlciIsImhpc3RvcnlNb25pdG9yVHlwZSIsImxvZ2dlciIsIkxvZ2dlciIsInNlY3Rpb25zIiwid2ViaG9vayIsImkiLCJxdWVyeVN0cmluZyIsImdldEFnZW50cyIsImdldE9ubGluZUFnZW50cyIsIm9ubGluZVJlcXVpcmVkIiwiZGVwdCIsIm9ubGluZUFnZW50cyIsInJvb21JbmZvIiwibmV3Um9vbSIsInJvdXRpbmdNZXRob2QiLCJRdWV1ZU1ldGhvZHMiLCJhbGlhcyIsInNob3dDb25uZWN0aW5nIiwidXBkYXRlVXNlciIsImV4aXN0aW5nVXNlciIsInVzZXJEYXRhIiwiY29ubmVjdGlvbiIsInVzZXJBZ2VudCIsImh0dHBIZWFkZXJzIiwiY2xpZW50QWRkcmVzcyIsIm51bWJlciIsInVzZXJzIiwiY2xvc2VEYXRhIiwiZ3JvdXBhYmxlIiwiaGlkZUJ5Um9vbUlkQW5kVXNlcklkIiwiZmluZE5vdEhpZGRlblB1YmxpYyIsInNldFRvcGljQW5kVGFnc0J5SWQiLCJ1cGRhdGVOYW1lQnlSb29tSWQiLCJjbG9zZU9wZW5DaGF0cyIsImZvcndhcmRPcGVuQ2hhdHMiLCJjaGFuZ2UiLCJ3aXRob3V0IiwicmVtb3ZlQnlSb29tSWRBbmRVc2VySWQiLCJjcmVhdGVVc2VyTGVhdmVXaXRoUm9vbUlkQW5kVXNlciIsImNyZWF0ZVVzZXJKb2luV2l0aFJvb21JZEFuZFVzZXIiLCJjYWxsYmFjayIsInRyeWluZyIsIndhcm4iLCJzZXRUaW1lb3V0IiwidWEiLCJzZXRVQSIsImxtIiwiZ2V0T1MiLCJ2ZXJzaW9uIiwiZ2V0QnJvd3NlciIsImFkZFVzZXJSb2xlcyIsInJlbW92ZVVzZXJGcm9tUm9sZXMiLCJTdHJlYW1lciIsImFsbG93UmVhZCIsInJvb21Db2RlIiwibXNncyIsImFnZW50SWRzIiwic2V0SW50ZXJ2YWwiLCJnYXRld2F5VVJMIiwicGFnZUlkIiwiU01TIiwic21zIiwiU01TU2VydmljZSIsImdldFNlcnZpY2UiLCJhZ2VudHNIYW5kbGVyIiwibW9uaXRvckFnZW50cyIsImFjdGlvblRpbWVvdXQiLCJxdWV1ZSIsImNsZWFyVGltZW91dCIsImV4aXN0cyIsInJ1bkFnZW50TGVhdmVBY3Rpb24iLCJvYnNlcnZlQ2hhbmdlcyIsImFkZGVkIiwiY2hhbmdlZCIsInJlbW92ZWQiLCJzdG9wIiwiVXNlclByZXNlbmNlTW9uaXRvciIsIm9uU2V0VXNlclN0YXR1cyIsInB1Ymxpc2giLCJoYW5kbGUiLCJnZXRVc2Vyc0luUm9sZSIsInJlYWR5Iiwib25TdG9wIiwiZmluZEJ5SWRzIiwiJGd0ZSIsInNldERhdGUiLCJnZXREYXRlIiwic2V0U2Vjb25kcyIsImdldFNlY29uZHMiLCIkbHRlIiwiaGFuZGxlRGVwdHMiLCJSb2xlcyIsImNyZWF0ZU9yVXBkYXRlIiwiUGVybWlzc2lvbnMiLCJNZXNzYWdlVHlwZXMiLCJyZWdpc3RlclR5cGUiLCJzeXN0ZW0iLCJyZWdpc3RlciIsImluc3RhbmNlIiwidGFiQmFyIiwiaXNTZXJ2ZXIiLCJOb3RpZmljYXRpb25zIiwibm90aWZ5Um9vbSIsInNldEhpZGRlbkJ5SWQiLCJSb29tU2V0dGluZ3NFbnVtIiwiUm9vbVR5cGVDb25maWciLCJSb29tVHlwZVJvdXRlQ29uZmlnIiwiVWlUZXh0Q29udGV4dCIsIkxpdmVjaGF0Um9vbVJvdXRlIiwicGF0aCIsIm9wZW5Sb29tIiwibGluayIsInN1YiIsIkxpdmVjaGF0Um9vbVR5cGUiLCJpZGVudGlmaWVyIiwicm91dGUiLCJub3RTdWJzY3JpYmVkVHBsIiwidGVtcGxhdGUiLCJmaW5kUm9vbSIsIkNoYXRSb29tIiwicm9vbU5hbWUiLCJjb25kaXRpb24iLCJoYXNBbGxQZXJtaXNzaW9uIiwiY2FuU2VuZE1lc3NhZ2UiLCJnZXRVc2VyU3RhdHVzIiwiU2Vzc2lvbiIsImFsbG93Um9vbVNldHRpbmdDaGFuZ2UiLCJKT0lOX0NPREUiLCJnZXRVaVRleHQiLCJjb250ZXh0IiwiSElERV9XQVJOSU5HIiwiTEVBVkVfV0FSTklORyIsImFkZEdyb3VwIiwiZ3JvdXAiLCJwdWJsaWMiLCJzZWN0aW9uIiwiaTE4bkRlc2NyaXB0aW9uIiwiZW5hYmxlUXVlcnkiLCJBUEkiLCJ2MSIsImFkZFJvdXRlIiwiYXV0aFJlcXVpcmVkIiwidW5hdXRob3JpemVkIiwiYm9keVBhcmFtcyIsImZhaWx1cmUiLCJ1cmxQYXJhbXMiLCJwdXQiLCJkZWxldGUiLCJjcnlwdG8iLCJhdHRhY2htZW50cyIsInJlcXVlc3QiLCJzaWduYXR1cmUiLCJjcmVhdGVIbWFjIiwiYm9keSIsImRpZ2VzdCIsIm1pZCIsInJvb21zIiwiZmlyc3RfbmFtZSIsImxhc3RfbmFtZSIsInN1Y2VzcyIsInNlbnRNZXNzYWdlcyIsInNlbnRNZXNzYWdlIiwic2VydmljZSIsIm1lZGlhIiwiY3VyciIsImF0dGFjaG1lbnQiLCJtZXNzYWdlX2xpbmsiLCJjb250ZW50VHlwZSIsImltYWdlX3VybCIsInZpZGVvX3VybCIsImF1ZGlvX3VybCIsImV4dHJhIiwiZnJvbUNvdW50cnkiLCJmcm9tU3RhdGUiLCJmcm9tQ2l0eSIsInJvbGUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxJQUFJQSxDQUFKOztBQUFNQyxPQUFPQyxLQUFQLENBQWFDLFFBQVEsWUFBUixDQUFiLEVBQW1DO0FBQUNDLFVBQVFDLENBQVIsRUFBVTtBQUFDTCxRQUFFSyxDQUFGO0FBQUk7O0FBQWhCLENBQW5DLEVBQXFELENBQXJEO0FBQXdELElBQUlDLEdBQUo7QUFBUUwsT0FBT0MsS0FBUCxDQUFhQyxRQUFRLEtBQVIsQ0FBYixFQUE0QjtBQUFDQyxVQUFRQyxDQUFSLEVBQVU7QUFBQ0MsVUFBSUQsQ0FBSjtBQUFNOztBQUFsQixDQUE1QixFQUFnRCxDQUFoRDtBQUl0RUUsU0FBU0MsUUFBUUMsTUFBUixDQUFlRixNQUF4QjtBQUNBLE1BQU1HLGFBQWFGLFFBQVFHLFVBQVIsQ0FBbUJELFVBQXRDO0FBRUFILE9BQU9LLGVBQVAsQ0FBdUJDLEdBQXZCLENBQTJCLFdBQTNCLEVBQXdDQyxPQUFPQyxlQUFQLENBQXVCLENBQUNDLEdBQUQsRUFBTUMsR0FBTixFQUFXQyxJQUFYLEtBQW9CO0FBQ2xGLFFBQU1DLFNBQVNiLElBQUljLEtBQUosQ0FBVUosSUFBSVYsR0FBZCxDQUFmOztBQUNBLE1BQUlhLE9BQU9FLFFBQVAsS0FBb0IsR0FBeEIsRUFBNkI7QUFDNUIsV0FBT0gsTUFBUDtBQUNBOztBQUNE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Q0FBZUMsRUFBZixDQUFrQmpkLE9BQWxCLENBQTBCO0FBQUVrZTtBQUFGLEtBQTFCLENBQVA7QUFDQTs7QUFqQndGLENBQTFGLEUiLCJmaWxlIjoiL3BhY2thZ2VzL3JvY2tldGNoYXRfbGl2ZWNoYXQuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBnbG9iYWxzIFdlYkFwcDp0cnVlICovXG5pbXBvcnQgXyBmcm9tICd1bmRlcnNjb3JlJztcbmltcG9ydCB1cmwgZnJvbSAndXJsJztcblxuV2ViQXBwID0gUGFja2FnZS53ZWJhcHAuV2ViQXBwO1xuY29uc3QgQXV0b3VwZGF0ZSA9IFBhY2thZ2UuYXV0b3VwZGF0ZS5BdXRvdXBkYXRlO1xuXG5XZWJBcHAuY29ubmVjdEhhbmRsZXJzLnVzZSgnL2xpdmVjaGF0JywgTWV0ZW9yLmJpbmRFbnZpcm9ubWVudCgocmVxLCByZXMsIG5leHQpID0+IHtcblx0Y29uc3QgcmVxVXJsID0gdXJsLnBhcnNlKHJlcS51cmwpO1xuXHRpZiAocmVxVXJsLnBhdGhuYW1lICE9PSAnLycpIHtcblx0XHRyZXR1cm4gbmV4dCgpO1xuXHR9XG5cdHJlcy5zZXRIZWFkZXIoJ2NvbnRlbnQtdHlwZScsICd0ZXh0L2h0bWw7IGNoYXJzZXQ9dXRmLTgnKTtcblxuXHRsZXQgZG9tYWluV2hpdGVMaXN0ID0gUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0xpdmVjaGF0X0FsbG93ZWREb21haW5zTGlzdCcpO1xuXHRpZiAocmVxLmhlYWRlcnMucmVmZXJlciAmJiAhXy5pc0VtcHR5KGRvbWFpbldoaXRlTGlzdC50cmltKCkpKSB7XG5cdFx0ZG9tYWluV2hpdGVMaXN0ID0gXy5tYXAoZG9tYWluV2hpdGVMaXN0LnNwbGl0KCcsJyksIGZ1bmN0aW9uKGRvbWFpbikge1xuXHRcdFx0cmV0dXJuIGRvbWFpbi50cmltKCk7XG5cdFx0fSk7XG5cblx0XHRjb25zdCByZWZlcmVyID0gdXJsLnBhcnNlKHJlcS5oZWFkZXJzLnJlZmVyZXIpO1xuXHRcdGlmICghXy5jb250YWlucyhkb21haW5XaGl0ZUxpc3QsIHJlZmVyZXIuaG9zdCkpIHtcblx0XHRcdHJlcy5zZXRIZWFkZXIoJ1gtRlJBTUUtT1BUSU9OUycsICdERU5ZJyk7XG5cdFx0XHRyZXR1cm4gbmV4dCgpO1xuXHRcdH1cblxuXHRcdHJlcy5zZXRIZWFkZXIoJ1gtRlJBTUUtT1BUSU9OUycsIGBBTExPVy1GUk9NICR7IHJlZmVyZXIucHJvdG9jb2wgfS8vJHsgcmVmZXJlci5ob3N0IH1gKTtcblx0fVxuXG5cdGNvbnN0IGhlYWQgPSBBc3NldHMuZ2V0VGV4dCgncHVibGljL2hlYWQuaHRtbCcpO1xuXG5cdGxldCBiYXNlVXJsO1xuXHRpZiAoX19tZXRlb3JfcnVudGltZV9jb25maWdfXy5ST09UX1VSTF9QQVRIX1BSRUZJWCAmJiBfX21ldGVvcl9ydW50aW1lX2NvbmZpZ19fLlJPT1RfVVJMX1BBVEhfUFJFRklYLnRyaW0oKSAhPT0gJycpIHtcblx0XHRiYXNlVXJsID0gX19tZXRlb3JfcnVudGltZV9jb25maWdfXy5ST09UX1VSTF9QQVRIX1BSRUZJWDtcblx0fSBlbHNlIHtcblx0XHRiYXNlVXJsID0gJy8nO1xuXHR9XG5cdGlmICgvXFwvJC8udGVzdChiYXNlVXJsKSA9PT0gZmFsc2UpIHtcblx0XHRiYXNlVXJsICs9ICcvJztcblx0fVxuXG5cdGNvbnN0IGh0bWwgPSBgPGh0bWw+XG5cdFx0PGhlYWQ+XG5cdFx0XHQ8bGluayByZWw9XCJzdHlsZXNoZWV0XCIgdHlwZT1cInRleHQvY3NzXCIgY2xhc3M9XCJfX21ldGVvci1jc3NfX1wiIGhyZWY9XCIkeyBiYXNlVXJsIH1saXZlY2hhdC9saXZlY2hhdC5jc3M/X2RjPSR7IEF1dG91cGRhdGUuYXV0b3VwZGF0ZVZlcnNpb24gfVwiPlxuXHRcdFx0PHNjcmlwdCB0eXBlPVwidGV4dC9qYXZhc2NyaXB0XCI+XG5cdFx0XHRcdF9fbWV0ZW9yX3J1bnRpbWVfY29uZmlnX18gPSAkeyBKU09OLnN0cmluZ2lmeShfX21ldGVvcl9ydW50aW1lX2NvbmZpZ19fKSB9O1xuXHRcdFx0PC9zY3JpcHQ+XG5cblx0XHRcdDxiYXNlIGhyZWY9XCIkeyBiYXNlVXJsIH1cIj5cblxuXHRcdFx0JHsgaGVhZCB9XG5cdFx0PC9oZWFkPlxuXHRcdDxib2R5PlxuXHRcdFx0PHNjcmlwdCB0eXBlPVwidGV4dC9qYXZhc2NyaXB0XCIgc3JjPVwiJHsgYmFzZVVybCB9bGl2ZWNoYXQvbGl2ZWNoYXQuanM/X2RjPSR7IEF1dG91cGRhdGUuYXV0b3VwZGF0ZVZlcnNpb24gfVwiPjwvc2NyaXB0PlxuXHRcdDwvYm9keT5cblx0PC9odG1sPmA7XG5cblx0cmVzLndyaXRlKGh0bWwpO1xuXHRyZXMuZW5kKCk7XG59KSk7XG4iLCJNZXRlb3Iuc3RhcnR1cCgoKSA9PiB7XG5cdFJvY2tldENoYXQucm9vbVR5cGVzLnNldFJvb21GaW5kKCdsJywgKGNvZGUpID0+IHtcblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZExpdmVjaGF0QnlDb2RlKGNvZGUpO1xuXHR9KTtcblxuXHRSb2NrZXRDaGF0LmF1dGh6LmFkZFJvb21BY2Nlc3NWYWxpZGF0b3IoZnVuY3Rpb24ocm9vbSwgdXNlcikge1xuXHRcdHJldHVybiByb29tLnQgPT09ICdsJyAmJiB1c2VyICYmIFJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih1c2VyLl9pZCwgJ3ZpZXctbGl2ZWNoYXQtcm9vbXMnKTtcblx0fSk7XG5cblx0Um9ja2V0Q2hhdC5hdXRoei5hZGRSb29tQWNjZXNzVmFsaWRhdG9yKGZ1bmN0aW9uKHJvb20sIHVzZXIsIGV4dHJhRGF0YSkge1xuXHRcdHJldHVybiByb29tLnQgPT09ICdsJyAmJiBleHRyYURhdGEgJiYgZXh0cmFEYXRhLnRva2VuICYmIHJvb20udiAmJiByb29tLnYudG9rZW4gPT09IGV4dHJhRGF0YS50b2tlbjtcblx0fSk7XG5cblx0Um9ja2V0Q2hhdC5jYWxsYmFja3MuYWRkKCdiZWZvcmVMZWF2ZVJvb20nLCBmdW5jdGlvbih1c2VyLCByb29tKSB7XG5cdFx0aWYgKHJvb20udCAhPT0gJ2wnKSB7XG5cdFx0XHRyZXR1cm4gdXNlcjtcblx0XHR9XG5cdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcihUQVBpMThuLl9fKCdZb3VfY2FudF9sZWF2ZV9hX2xpdmVjaGF0X3Jvb21fUGxlYXNlX3VzZV90aGVfY2xvc2VfYnV0dG9uJywge1xuXHRcdFx0bG5nOiB1c2VyLmxhbmd1YWdlIHx8IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdsYW5ndWFnZScpIHx8ICdlbidcblx0XHR9KSk7XG5cdH0sIFJvY2tldENoYXQuY2FsbGJhY2tzLnByaW9yaXR5LkxPVywgJ2NhbnQtbGVhdmUtcm9vbScpO1xufSk7XG4iLCIvKiBnbG9iYWxzIFVzZXJQcmVzZW5jZUV2ZW50cyAqL1xuTWV0ZW9yLnN0YXJ0dXAoKCkgPT4ge1xuXHRVc2VyUHJlc2VuY2VFdmVudHMub24oJ3NldFN0YXR1cycsIChzZXNzaW9uLCBzdGF0dXMsIG1ldGFkYXRhKSA9PiB7XG5cdFx0aWYgKG1ldGFkYXRhICYmIG1ldGFkYXRhLnZpc2l0b3IpIHtcblx0XHRcdFJvY2tldENoYXQubW9kZWxzLkxpdmVjaGF0SW5xdWlyeS51cGRhdGVWaXNpdG9yU3RhdHVzKG1ldGFkYXRhLnZpc2l0b3IsIHN0YXR1cyk7XG5cdFx0XHRSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy51cGRhdGVWaXNpdG9yU3RhdHVzKG1ldGFkYXRhLnZpc2l0b3IsIHN0YXR1cyk7XG5cdFx0fVxuXHR9KTtcbn0pO1xuIiwiLyogZ2xvYmFscyBIVFRQLCBTeXN0ZW1Mb2dnZXIgKi9cbmltcG9ydCBfIGZyb20gJ3VuZGVyc2NvcmUnO1xuXG5sZXQga25vd2xlZGdlRW5hYmxlZCA9IGZhbHNlO1xubGV0IGFwaWFpS2V5ID0gJyc7XG5sZXQgYXBpYWlMYW5ndWFnZSA9ICdlbic7XG5Sb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnTGl2ZWNoYXRfS25vd2xlZGdlX0VuYWJsZWQnLCBmdW5jdGlvbihrZXksIHZhbHVlKSB7XG5cdGtub3dsZWRnZUVuYWJsZWQgPSB2YWx1ZTtcbn0pO1xuUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0xpdmVjaGF0X0tub3dsZWRnZV9BcGlhaV9LZXknLCBmdW5jdGlvbihrZXksIHZhbHVlKSB7XG5cdGFwaWFpS2V5ID0gdmFsdWU7XG59KTtcblJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdMaXZlY2hhdF9Lbm93bGVkZ2VfQXBpYWlfTGFuZ3VhZ2UnLCBmdW5jdGlvbihrZXksIHZhbHVlKSB7XG5cdGFwaWFpTGFuZ3VhZ2UgPSB2YWx1ZTtcbn0pO1xuXG5Sb2NrZXRDaGF0LmNhbGxiYWNrcy5hZGQoJ2FmdGVyU2F2ZU1lc3NhZ2UnLCBmdW5jdGlvbihtZXNzYWdlLCByb29tKSB7XG5cdC8vIHNraXBzIHRoaXMgY2FsbGJhY2sgaWYgdGhlIG1lc3NhZ2Ugd2FzIGVkaXRlZFxuXHRpZiAoIW1lc3NhZ2UgfHwgbWVzc2FnZS5lZGl0ZWRBdCkge1xuXHRcdHJldHVybiBtZXNzYWdlO1xuXHR9XG5cblx0aWYgKCFrbm93bGVkZ2VFbmFibGVkKSB7XG5cdFx0cmV0dXJuIG1lc3NhZ2U7XG5cdH1cblxuXHRpZiAoISh0eXBlb2Ygcm9vbS50ICE9PSAndW5kZWZpbmVkJyAmJiByb29tLnQgPT09ICdsJyAmJiByb29tLnYgJiYgcm9vbS52LnRva2VuKSkge1xuXHRcdHJldHVybiBtZXNzYWdlO1xuXHR9XG5cblx0Ly8gaWYgdGhlIG1lc3NhZ2UgaGFzbid0IGEgdG9rZW4sIGl0IHdhcyBub3Qgc2VudCBieSB0aGUgdmlzaXRvciwgc28gaWdub3JlIGl0XG5cdGlmICghbWVzc2FnZS50b2tlbikge1xuXHRcdHJldHVybiBtZXNzYWdlO1xuXHR9XG5cblx0TWV0ZW9yLmRlZmVyKCgpID0+IHtcblx0XHR0cnkge1xuXHRcdFx0Y29uc3QgcmVzcG9uc2UgPSBIVFRQLnBvc3QoJ2h0dHBzOi8vYXBpLmFwaS5haS9hcGkvcXVlcnk/dj0yMDE1MDkxMCcsIHtcblx0XHRcdFx0ZGF0YToge1xuXHRcdFx0XHRcdHF1ZXJ5OiBtZXNzYWdlLm1zZyxcblx0XHRcdFx0XHRsYW5nOiBhcGlhaUxhbmd1YWdlLFxuXHRcdFx0XHRcdHNlc3Npb25JZDogcm9vbS5faWRcblx0XHRcdFx0fSxcblx0XHRcdFx0aGVhZGVyczoge1xuXHRcdFx0XHRcdCdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbjsgY2hhcnNldD11dGYtOCcsXG5cdFx0XHRcdFx0J0F1dGhvcml6YXRpb24nOiBgQmVhcmVyICR7IGFwaWFpS2V5IH1gXG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXG5cdFx0XHRpZiAocmVzcG9uc2UuZGF0YSAmJiByZXNwb25zZS5kYXRhLnN0YXR1cy5jb2RlID09PSAyMDAgJiYgIV8uaXNFbXB0eShyZXNwb25zZS5kYXRhLnJlc3VsdC5mdWxmaWxsbWVudC5zcGVlY2gpKSB7XG5cdFx0XHRcdFJvY2tldENoYXQubW9kZWxzLkxpdmVjaGF0RXh0ZXJuYWxNZXNzYWdlLmluc2VydCh7XG5cdFx0XHRcdFx0cmlkOiBtZXNzYWdlLnJpZCxcblx0XHRcdFx0XHRtc2c6IHJlc3BvbnNlLmRhdGEucmVzdWx0LmZ1bGZpbGxtZW50LnNwZWVjaCxcblx0XHRcdFx0XHRvcmlnOiBtZXNzYWdlLl9pZCxcblx0XHRcdFx0XHR0czogbmV3IERhdGUoKVxuXHRcdFx0XHR9KTtcblx0XHRcdH1cblx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRTeXN0ZW1Mb2dnZXIuZXJyb3IoJ0Vycm9yIHVzaW5nIEFwaS5haSAtPicsIGUpO1xuXHRcdH1cblx0fSk7XG5cblx0cmV0dXJuIG1lc3NhZ2U7XG59LCBSb2NrZXRDaGF0LmNhbGxiYWNrcy5wcmlvcml0eS5MT1csICdleHRlcm5hbFdlYkhvb2snKTtcbiIsImltcG9ydCBMaXZlY2hhdFZpc2l0b3JzIGZyb20gJy4uLy4uL3NlcnZlci9tb2RlbHMvTGl2ZWNoYXRWaXNpdG9ycyc7XG5cbmZ1bmN0aW9uIHZhbGlkYXRlTWVzc2FnZShtZXNzYWdlLCByb29tKSB7XG5cdC8vIHNraXBzIHRoaXMgY2FsbGJhY2sgaWYgdGhlIG1lc3NhZ2Ugd2FzIGVkaXRlZFxuXHRpZiAobWVzc2FnZS5lZGl0ZWRBdCkge1xuXHRcdHJldHVybiBmYWxzZTtcblx0fVxuXG5cdC8vIG1lc3NhZ2UgdmFsaWQgb25seSBpZiBpdCBpcyBhIGxpdmVjaGF0IHJvb21cblx0aWYgKCEodHlwZW9mIHJvb20udCAhPT0gJ3VuZGVmaW5lZCcgJiYgcm9vbS50ID09PSAnbCcgJiYgcm9vbS52ICYmIHJvb20udi50b2tlbikpIHtcblx0XHRyZXR1cm4gZmFsc2U7XG5cdH1cblxuXHQvLyBpZiB0aGUgbWVzc2FnZSBoYXNuJ3QgYSB0b2tlbiwgaXQgd2FzIE5PVCBzZW50IGZyb20gdGhlIHZpc2l0b3IsIHNvIGlnbm9yZSBpdFxuXHRpZiAoIW1lc3NhZ2UudG9rZW4pIHtcblx0XHRyZXR1cm4gZmFsc2U7XG5cdH1cblxuXHQvLyBpZiB0aGUgbWVzc2FnZSBoYXMgYSB0eXBlIG1lYW5zIGl0IGlzIGEgc3BlY2lhbCBtZXNzYWdlIChsaWtlIHRoZSBjbG9zaW5nIGNvbW1lbnQpLCBzbyBza2lwc1xuXHRpZiAobWVzc2FnZS50KSB7XG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9XG5cblx0cmV0dXJuIHRydWU7XG59XG5cblJvY2tldENoYXQuY2FsbGJhY2tzLmFkZCgnYWZ0ZXJTYXZlTWVzc2FnZScsIGZ1bmN0aW9uKG1lc3NhZ2UsIHJvb20pIHtcblx0aWYgKCF2YWxpZGF0ZU1lc3NhZ2UobWVzc2FnZSwgcm9vbSkpIHtcblx0XHRyZXR1cm4gbWVzc2FnZTtcblx0fVxuXG5cdGNvbnN0IHBob25lUmVnZXhwID0gbmV3IFJlZ0V4cChSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnTGl2ZWNoYXRfbGVhZF9waG9uZV9yZWdleCcpLCAnZycpO1xuXHRjb25zdCBtc2dQaG9uZXMgPSBtZXNzYWdlLm1zZy5tYXRjaChwaG9uZVJlZ2V4cCk7XG5cblx0Y29uc3QgZW1haWxSZWdleHAgPSBuZXcgUmVnRXhwKFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdMaXZlY2hhdF9sZWFkX2VtYWlsX3JlZ2V4JyksICdnaScpO1xuXHRjb25zdCBtc2dFbWFpbHMgPSBtZXNzYWdlLm1zZy5tYXRjaChlbWFpbFJlZ2V4cCk7XG5cblx0aWYgKG1zZ0VtYWlscyB8fCBtc2dQaG9uZXMpIHtcblx0XHRMaXZlY2hhdFZpc2l0b3JzLnNhdmVHdWVzdEVtYWlsUGhvbmVCeUlkKHJvb20udi5faWQsIG1zZ0VtYWlscywgbXNnUGhvbmVzKTtcblxuXHRcdFJvY2tldENoYXQuY2FsbGJhY2tzLnJ1bignbGl2ZWNoYXQubGVhZENhcHR1cmUnLCByb29tKTtcblx0fVxuXG5cdHJldHVybiBtZXNzYWdlO1xufSwgUm9ja2V0Q2hhdC5jYWxsYmFja3MucHJpb3JpdHkuTE9XLCAnbGVhZENhcHR1cmUnKTtcbiIsIlJvY2tldENoYXQuY2FsbGJhY2tzLmFkZCgnYWZ0ZXJTYXZlTWVzc2FnZScsIGZ1bmN0aW9uKG1lc3NhZ2UsIHJvb20pIHtcblx0Ly8gc2tpcHMgdGhpcyBjYWxsYmFjayBpZiB0aGUgbWVzc2FnZSB3YXMgZWRpdGVkXG5cdGlmICghbWVzc2FnZSB8fCBtZXNzYWdlLmVkaXRlZEF0KSB7XG5cdFx0cmV0dXJuIG1lc3NhZ2U7XG5cdH1cblxuXHQvLyBjaGVjayBpZiByb29tIGlzIHlldCBhd2FpdGluZyBmb3IgcmVzcG9uc2Vcblx0aWYgKCEodHlwZW9mIHJvb20udCAhPT0gJ3VuZGVmaW5lZCcgJiYgcm9vbS50ID09PSAnbCcgJiYgcm9vbS53YWl0aW5nUmVzcG9uc2UpKSB7XG5cdFx0cmV0dXJuIG1lc3NhZ2U7XG5cdH1cblxuXHQvLyBpZiB0aGUgbWVzc2FnZSBoYXMgYSB0b2tlbiwgaXQgd2FzIHNlbnQgYnkgdGhlIHZpc2l0b3IsIHNvIGlnbm9yZSBpdFxuXHRpZiAobWVzc2FnZS50b2tlbikge1xuXHRcdHJldHVybiBtZXNzYWdlO1xuXHR9XG5cblx0TWV0ZW9yLmRlZmVyKCgpID0+IHtcblx0XHRjb25zdCBub3cgPSBuZXcgRGF0ZSgpO1xuXHRcdFJvY2tldENoYXQubW9kZWxzLlJvb21zLnNldFJlc3BvbnNlQnlSb29tSWQocm9vbS5faWQsIHtcblx0XHRcdHVzZXI6IHtcblx0XHRcdFx0X2lkOiBtZXNzYWdlLnUuX2lkLFxuXHRcdFx0XHR1c2VybmFtZTogbWVzc2FnZS51LnVzZXJuYW1lXG5cdFx0XHR9LFxuXHRcdFx0cmVzcG9uc2VEYXRlOiBub3csXG5cdFx0XHRyZXNwb25zZVRpbWU6IChub3cuZ2V0VGltZSgpIC0gcm9vbS50cykgLyAxMDAwXG5cdFx0fSk7XG5cdH0pO1xuXG5cdHJldHVybiBtZXNzYWdlO1xufSwgUm9ja2V0Q2hhdC5jYWxsYmFja3MucHJpb3JpdHkuTE9XLCAnbWFya1Jvb21SZXNwb25kZWQnKTtcbiIsIlJvY2tldENoYXQuY2FsbGJhY2tzLmFkZCgnbGl2ZWNoYXQub2ZmbGluZU1lc3NhZ2UnLCAoZGF0YSkgPT4ge1xuXHRpZiAoIVJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdMaXZlY2hhdF93ZWJob29rX29uX29mZmxpbmVfbXNnJykpIHtcblx0XHRyZXR1cm4gZGF0YTtcblx0fVxuXG5cdGNvbnN0IHBvc3REYXRhID0ge1xuXHRcdHR5cGU6ICdMaXZlY2hhdE9mZmxpbmVNZXNzYWdlJyxcblx0XHRzZW50QXQ6IG5ldyBEYXRlKCksXG5cdFx0dmlzaXRvcjoge1xuXHRcdFx0bmFtZTogZGF0YS5uYW1lLFxuXHRcdFx0ZW1haWw6IGRhdGEuZW1haWxcblx0XHR9LFxuXHRcdG1lc3NhZ2U6IGRhdGEubWVzc2FnZVxuXHR9O1xuXG5cdFJvY2tldENoYXQuTGl2ZWNoYXQuc2VuZFJlcXVlc3QocG9zdERhdGEpO1xufSwgUm9ja2V0Q2hhdC5jYWxsYmFja3MucHJpb3JpdHkuTUVESVVNLCAnbGl2ZWNoYXQtc2VuZC1lbWFpbC1vZmZsaW5lLW1lc3NhZ2UnKTtcbiIsImZ1bmN0aW9uIHNlbmRUb1JEU3RhdGlvbihyb29tKSB7XG5cdGlmICghUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0xpdmVjaGF0X1JEU3RhdGlvbl9Ub2tlbicpKSB7XG5cdFx0cmV0dXJuIHJvb207XG5cdH1cblxuXHRjb25zdCBsaXZlY2hhdERhdGEgPSBSb2NrZXRDaGF0LkxpdmVjaGF0LmdldExpdmVjaGF0Um9vbUd1ZXN0SW5mbyhyb29tKTtcblxuXHRpZiAoIWxpdmVjaGF0RGF0YS52aXNpdG9yLmVtYWlsKSB7XG5cdFx0cmV0dXJuIHJvb207XG5cdH1cblxuXHRjb25zdCBvcHRpb25zID0ge1xuXHRcdGhlYWRlcnM6IHtcblx0XHRcdCdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbidcblx0XHR9LFxuXHRcdGRhdGE6IHtcblx0XHRcdHRva2VuX3Jkc3RhdGlvbjogUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0xpdmVjaGF0X1JEU3RhdGlvbl9Ub2tlbicpLFxuXHRcdFx0aWRlbnRpZmljYWRvcjogJ3JvY2tldGNoYXQtbGl2ZWNoYXQnLFxuXHRcdFx0Y2xpZW50X2lkOiBsaXZlY2hhdERhdGEudmlzaXRvci5faWQsXG5cdFx0XHRlbWFpbDogbGl2ZWNoYXREYXRhLnZpc2l0b3IuZW1haWxcblx0XHR9XG5cdH07XG5cblx0b3B0aW9ucy5kYXRhLm5vbWUgPSBsaXZlY2hhdERhdGEudmlzaXRvci5uYW1lIHx8IGxpdmVjaGF0RGF0YS52aXNpdG9yLnVzZXJuYW1lO1xuXG5cdGlmIChsaXZlY2hhdERhdGEudmlzaXRvci5waG9uZSkge1xuXHRcdG9wdGlvbnMuZGF0YS50ZWxlZm9uZSA9IGxpdmVjaGF0RGF0YS52aXNpdG9yLnBob25lO1xuXHR9XG5cblx0aWYgKGxpdmVjaGF0RGF0YS50YWdzKSB7XG5cdFx0b3B0aW9ucy5kYXRhLnRhZ3MgPSBsaXZlY2hhdERhdGEudGFncztcblx0fVxuXG5cdE9iamVjdC5rZXlzKGxpdmVjaGF0RGF0YS5jdXN0b21GaWVsZHMgfHwge30pLmZvckVhY2goZmllbGQgPT4ge1xuXHRcdG9wdGlvbnMuZGF0YVtmaWVsZF0gPSBsaXZlY2hhdERhdGEuY3VzdG9tRmllbGRzW2ZpZWxkXTtcblx0fSk7XG5cblx0T2JqZWN0LmtleXMobGl2ZWNoYXREYXRhLnZpc2l0b3IuY3VzdG9tRmllbGRzIHx8IHt9KS5mb3JFYWNoKGZpZWxkID0+IHtcblx0XHRvcHRpb25zLmRhdGFbZmllbGRdID0gbGl2ZWNoYXREYXRhLnZpc2l0b3IuY3VzdG9tRmllbGRzW2ZpZWxkXTtcblx0fSk7XG5cblx0dHJ5IHtcblx0XHRIVFRQLmNhbGwoJ1BPU1QnLCAnaHR0cHM6Ly93d3cucmRzdGF0aW9uLmNvbS5ici9hcGkvMS4zL2NvbnZlcnNpb25zJywgb3B0aW9ucyk7XG5cdH0gY2F0Y2ggKGUpIHtcblx0XHRjb25zb2xlLmVycm9yKCdFcnJvciBzZW5kaW5nIGxlYWQgdG8gUkQgU3RhdGlvbiAtPicsIGUpO1xuXHR9XG5cblx0cmV0dXJuIHJvb207XG59XG5cblJvY2tldENoYXQuY2FsbGJhY2tzLmFkZCgnbGl2ZWNoYXQuY2xvc2VSb29tJywgc2VuZFRvUkRTdGF0aW9uLCBSb2NrZXRDaGF0LmNhbGxiYWNrcy5wcmlvcml0eS5NRURJVU0sICdsaXZlY2hhdC1yZC1zdGF0aW9uLWNsb3NlLXJvb20nKTtcblxuUm9ja2V0Q2hhdC5jYWxsYmFja3MuYWRkKCdsaXZlY2hhdC5zYXZlSW5mbycsIHNlbmRUb1JEU3RhdGlvbiwgUm9ja2V0Q2hhdC5jYWxsYmFja3MucHJpb3JpdHkuTUVESVVNLCAnbGl2ZWNoYXQtcmQtc3RhdGlvbi1zYXZlLWluZm8nKTtcbiIsImZ1bmN0aW9uIHNlbmRUb0NSTSh0eXBlLCByb29tLCBpbmNsdWRlTWVzc2FnZXMgPSB0cnVlKSB7XG5cdGNvbnN0IHBvc3REYXRhID0gUm9ja2V0Q2hhdC5MaXZlY2hhdC5nZXRMaXZlY2hhdFJvb21HdWVzdEluZm8ocm9vbSk7XG5cblx0cG9zdERhdGEudHlwZSA9IHR5cGU7XG5cblx0cG9zdERhdGEubWVzc2FnZXMgPSBbXTtcblxuXHRsZXQgbWVzc2FnZXM7XG5cdGlmICh0eXBlb2YgaW5jbHVkZU1lc3NhZ2VzID09PSAnYm9vbGVhbicgJiYgaW5jbHVkZU1lc3NhZ2VzKSB7XG5cdFx0bWVzc2FnZXMgPSBSb2NrZXRDaGF0Lm1vZGVscy5NZXNzYWdlcy5maW5kVmlzaWJsZUJ5Um9vbUlkKHJvb20uX2lkLCB7IHNvcnQ6IHsgdHM6IDEgfSB9KTtcblx0fSBlbHNlIGlmIChpbmNsdWRlTWVzc2FnZXMgaW5zdGFuY2VvZiBBcnJheSkge1xuXHRcdG1lc3NhZ2VzID0gaW5jbHVkZU1lc3NhZ2VzO1xuXHR9XG5cblx0aWYgKG1lc3NhZ2VzKSB7XG5cdFx0bWVzc2FnZXMuZm9yRWFjaCgobWVzc2FnZSkgPT4ge1xuXHRcdFx0aWYgKG1lc3NhZ2UudCkge1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cdFx0XHRjb25zdCBtc2cgPSB7XG5cdFx0XHRcdF9pZDogbWVzc2FnZS5faWQsXG5cdFx0XHRcdHVzZXJuYW1lOiBtZXNzYWdlLnUudXNlcm5hbWUsXG5cdFx0XHRcdG1zZzogbWVzc2FnZS5tc2csXG5cdFx0XHRcdHRzOiBtZXNzYWdlLnRzLFxuXHRcdFx0XHRlZGl0ZWRBdDogbWVzc2FnZS5lZGl0ZWRBdFxuXHRcdFx0fTtcblxuXHRcdFx0aWYgKG1lc3NhZ2UudS51c2VybmFtZSAhPT0gcG9zdERhdGEudmlzaXRvci51c2VybmFtZSkge1xuXHRcdFx0XHRtc2cuYWdlbnRJZCA9IG1lc3NhZ2UudS5faWQ7XG5cdFx0XHR9XG5cdFx0XHRwb3N0RGF0YS5tZXNzYWdlcy5wdXNoKG1zZyk7XG5cdFx0fSk7XG5cdH1cblxuXHRjb25zdCByZXNwb25zZSA9IFJvY2tldENoYXQuTGl2ZWNoYXQuc2VuZFJlcXVlc3QocG9zdERhdGEpO1xuXG5cdGlmIChyZXNwb25zZSAmJiByZXNwb25zZS5kYXRhICYmIHJlc3BvbnNlLmRhdGEuZGF0YSkge1xuXHRcdFJvY2tldENoYXQubW9kZWxzLlJvb21zLnNhdmVDUk1EYXRhQnlSb29tSWQocm9vbS5faWQsIHJlc3BvbnNlLmRhdGEuZGF0YSk7XG5cdH1cblxuXHRyZXR1cm4gcm9vbTtcbn1cblxuUm9ja2V0Q2hhdC5jYWxsYmFja3MuYWRkKCdsaXZlY2hhdC5jbG9zZVJvb20nLCAocm9vbSkgPT4ge1xuXHRpZiAoIVJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdMaXZlY2hhdF93ZWJob29rX29uX2Nsb3NlJykpIHtcblx0XHRyZXR1cm4gcm9vbTtcblx0fVxuXG5cdHJldHVybiBzZW5kVG9DUk0oJ0xpdmVjaGF0U2Vzc2lvbicsIHJvb20pO1xufSwgUm9ja2V0Q2hhdC5jYWxsYmFja3MucHJpb3JpdHkuTUVESVVNLCAnbGl2ZWNoYXQtc2VuZC1jcm0tY2xvc2Utcm9vbScpO1xuXG5Sb2NrZXRDaGF0LmNhbGxiYWNrcy5hZGQoJ2xpdmVjaGF0LnNhdmVJbmZvJywgKHJvb20pID0+IHtcblx0Ly8gRG8gbm90IHNlbmQgdG8gQ1JNIGlmIHRoZSBjaGF0IGlzIHN0aWxsIG9wZW5cblx0aWYgKHJvb20ub3Blbikge1xuXHRcdHJldHVybiByb29tO1xuXHR9XG5cblx0cmV0dXJuIHNlbmRUb0NSTSgnTGl2ZWNoYXRFZGl0Jywgcm9vbSk7XG59LCBSb2NrZXRDaGF0LmNhbGxiYWNrcy5wcmlvcml0eS5NRURJVU0sICdsaXZlY2hhdC1zZW5kLWNybS1zYXZlLWluZm8nKTtcblxuUm9ja2V0Q2hhdC5jYWxsYmFja3MuYWRkKCdhZnRlclNhdmVNZXNzYWdlJywgZnVuY3Rpb24obWVzc2FnZSwgcm9vbSkge1xuXHQvLyBvbmx5IGNhbGwgd2ViaG9vayBpZiBpdCBpcyBhIGxpdmVjaGF0IHJvb21cblx0aWYgKHJvb20udCAhPT0gJ2wnIHx8IHJvb20udiA9PSBudWxsIHx8IHJvb20udi50b2tlbiA9PSBudWxsKSB7XG5cdFx0cmV0dXJuIG1lc3NhZ2U7XG5cdH1cblxuXHQvLyBpZiB0aGUgbWVzc2FnZSBoYXMgYSB0b2tlbiwgaXQgd2FzIHNlbnQgZnJvbSB0aGUgdmlzaXRvclxuXHQvLyBpZiBub3QsIGl0IHdhcyBzZW50IGZyb20gdGhlIGFnZW50XG5cdGlmIChtZXNzYWdlLnRva2VuKSB7XG5cdFx0aWYgKCFSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnTGl2ZWNoYXRfd2ViaG9va19vbl92aXNpdG9yX21lc3NhZ2UnKSkge1xuXHRcdFx0cmV0dXJuIG1lc3NhZ2U7XG5cdFx0fVxuXHR9IGVsc2UgaWYgKCFSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnTGl2ZWNoYXRfd2ViaG9va19vbl9hZ2VudF9tZXNzYWdlJykpIHtcblx0XHRyZXR1cm4gbWVzc2FnZTtcblx0fVxuXG5cdC8vIGlmIHRoZSBtZXNzYWdlIGhhcyBhIHR5cGUgbWVhbnMgaXQgaXMgYSBzcGVjaWFsIG1lc3NhZ2UgKGxpa2UgdGhlIGNsb3NpbmcgY29tbWVudCksIHNvIHNraXBzXG5cdGlmIChtZXNzYWdlLnQpIHtcblx0XHRyZXR1cm4gbWVzc2FnZTtcblx0fVxuXG5cdHNlbmRUb0NSTSgnTWVzc2FnZScsIHJvb20sIFttZXNzYWdlXSk7XG5cdHJldHVybiBtZXNzYWdlO1xufSwgUm9ja2V0Q2hhdC5jYWxsYmFja3MucHJpb3JpdHkuTUVESVVNLCAnbGl2ZWNoYXQtc2VuZC1jcm0tbWVzc2FnZScpO1xuXG5Sb2NrZXRDaGF0LmNhbGxiYWNrcy5hZGQoJ2xpdmVjaGF0LmxlYWRDYXB0dXJlJywgKHJvb20pID0+IHtcblx0aWYgKCFSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnTGl2ZWNoYXRfd2ViaG9va19vbl9jYXB0dXJlJykpIHtcblx0XHRyZXR1cm4gcm9vbTtcblx0fVxuXHRyZXR1cm4gc2VuZFRvQ1JNKCdMZWFkQ2FwdHVyZScsIHJvb20sIGZhbHNlKTtcbn0sIFJvY2tldENoYXQuY2FsbGJhY2tzLnByaW9yaXR5Lk1FRElVTSwgJ2xpdmVjaGF0LXNlbmQtY3JtLWxlYWQtY2FwdHVyZScpO1xuIiwiaW1wb3J0IE9tbmlDaGFubmVsIGZyb20gJy4uL2xpYi9PbW5pQ2hhbm5lbCc7XG5cblJvY2tldENoYXQuY2FsbGJhY2tzLmFkZCgnYWZ0ZXJTYXZlTWVzc2FnZScsIGZ1bmN0aW9uKG1lc3NhZ2UsIHJvb20pIHtcblx0Ly8gc2tpcHMgdGhpcyBjYWxsYmFjayBpZiB0aGUgbWVzc2FnZSB3YXMgZWRpdGVkXG5cdGlmIChtZXNzYWdlLmVkaXRlZEF0KSB7XG5cdFx0cmV0dXJuIG1lc3NhZ2U7XG5cdH1cblxuXHRpZiAoIVJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdMaXZlY2hhdF9GYWNlYm9va19FbmFibGVkJykgfHwgIVJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdMaXZlY2hhdF9GYWNlYm9va19BUElfS2V5JykpIHtcblx0XHRyZXR1cm4gbWVzc2FnZTtcblx0fVxuXG5cdC8vIG9ubHkgc2VuZCB0aGUgc21zIGJ5IFNNUyBpZiBpdCBpcyBhIGxpdmVjaGF0IHJvb20gd2l0aCBTTVMgc2V0IHRvIHRydWVcblx0aWYgKCEodHlwZW9mIHJvb20udCAhPT0gJ3VuZGVmaW5lZCcgJiYgcm9vbS50ID09PSAnbCcgJiYgcm9vbS5mYWNlYm9vayAmJiByb29tLnYgJiYgcm9vbS52LnRva2VuKSkge1xuXHRcdHJldHVybiBtZXNzYWdlO1xuXHR9XG5cblx0Ly8gaWYgdGhlIG1lc3NhZ2UgaGFzIGEgdG9rZW4sIGl0IHdhcyBzZW50IGZyb20gdGhlIHZpc2l0b3IsIHNvIGlnbm9yZSBpdFxuXHRpZiAobWVzc2FnZS50b2tlbikge1xuXHRcdHJldHVybiBtZXNzYWdlO1xuXHR9XG5cblx0Ly8gaWYgdGhlIG1lc3NhZ2UgaGFzIGEgdHlwZSBtZWFucyBpdCBpcyBhIHNwZWNpYWwgbWVzc2FnZSAobGlrZSB0aGUgY2xvc2luZyBjb21tZW50KSwgc28gc2tpcHNcblx0aWYgKG1lc3NhZ2UudCkge1xuXHRcdHJldHVybiBtZXNzYWdlO1xuXHR9XG5cblx0T21uaUNoYW5uZWwucmVwbHkoe1xuXHRcdHBhZ2U6IHJvb20uZmFjZWJvb2sucGFnZS5pZCxcblx0XHR0b2tlbjogcm9vbS52LnRva2VuLFxuXHRcdHRleHQ6IG1lc3NhZ2UubXNnXG5cdH0pO1xuXG5cdHJldHVybiBtZXNzYWdlO1xuXG59LCBSb2NrZXRDaGF0LmNhbGxiYWNrcy5wcmlvcml0eS5MT1csICdzZW5kTWVzc2FnZVRvRmFjZWJvb2snKTtcbiIsIk1ldGVvci5tZXRob2RzKHtcblx0J2xpdmVjaGF0OmFkZEFnZW50Jyh1c2VybmFtZSkge1xuXHRcdGlmICghTWV0ZW9yLnVzZXJJZCgpIHx8ICFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24oTWV0ZW9yLnVzZXJJZCgpLCAndmlldy1saXZlY2hhdC1tYW5hZ2VyJykpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLW5vdC1hbGxvd2VkJywgJ05vdCBhbGxvd2VkJywgeyBtZXRob2Q6ICdsaXZlY2hhdDphZGRBZ2VudCcgfSk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuTGl2ZWNoYXQuYWRkQWdlbnQodXNlcm5hbWUpO1xuXHR9XG59KTtcbiIsIk1ldGVvci5tZXRob2RzKHtcblx0J2xpdmVjaGF0OmFkZE1hbmFnZXInKHVzZXJuYW1lKSB7XG5cdFx0aWYgKCFNZXRlb3IudXNlcklkKCkgfHwgIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbihNZXRlb3IudXNlcklkKCksICd2aWV3LWxpdmVjaGF0LW1hbmFnZXInKSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3Itbm90LWFsbG93ZWQnLCAnTm90IGFsbG93ZWQnLCB7IG1ldGhvZDogJ2xpdmVjaGF0OmFkZE1hbmFnZXInIH0pO1xuXHRcdH1cblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkxpdmVjaGF0LmFkZE1hbmFnZXIodXNlcm5hbWUpO1xuXHR9XG59KTtcbiIsIk1ldGVvci5tZXRob2RzKHtcblx0J2xpdmVjaGF0OmNoYW5nZUxpdmVjaGF0U3RhdHVzJygpIHtcblx0XHRpZiAoIU1ldGVvci51c2VySWQoKSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3Itbm90LWFsbG93ZWQnLCAnTm90IGFsbG93ZWQnLCB7IG1ldGhvZDogJ2xpdmVjaGF0OmNoYW5nZUxpdmVjaGF0U3RhdHVzJyB9KTtcblx0XHR9XG5cblx0XHRjb25zdCB1c2VyID0gTWV0ZW9yLnVzZXIoKTtcblxuXHRcdGNvbnN0IG5ld1N0YXR1cyA9IHVzZXIuc3RhdHVzTGl2ZWNoYXQgPT09ICdhdmFpbGFibGUnID8gJ25vdC1hdmFpbGFibGUnIDogJ2F2YWlsYWJsZSc7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuc2V0TGl2ZWNoYXRTdGF0dXModXNlci5faWQsIG5ld1N0YXR1cyk7XG5cdH1cbn0pO1xuIiwiaW1wb3J0IExpdmVjaGF0VmlzaXRvcnMgZnJvbSAnLi4vbW9kZWxzL0xpdmVjaGF0VmlzaXRvcnMnO1xuXG5NZXRlb3IubWV0aG9kcyh7XG5cdCdsaXZlY2hhdDpjbG9zZUJ5VmlzaXRvcicoeyByb29tSWQsIHRva2VuIH0pIHtcblx0XHRjb25zdCByb29tID0gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9uZU9wZW5CeVZpc2l0b3JUb2tlbih0b2tlbiwgcm9vbUlkKTtcblxuXHRcdGlmICghcm9vbSB8fCAhcm9vbS5vcGVuKSB7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXG5cdFx0Y29uc3QgdmlzaXRvciA9IExpdmVjaGF0VmlzaXRvcnMuZ2V0VmlzaXRvckJ5VG9rZW4odG9rZW4pO1xuXG5cdFx0Y29uc3QgbGFuZ3VhZ2UgPSAodmlzaXRvciAmJiB2aXNpdG9yLmxhbmd1YWdlKSB8fCBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnbGFuZ3VhZ2UnKSB8fCAnZW4nO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuTGl2ZWNoYXQuY2xvc2VSb29tKHtcblx0XHRcdHZpc2l0b3IsXG5cdFx0XHRyb29tLFxuXHRcdFx0Y29tbWVudDogVEFQaTE4bi5fXygnQ2xvc2VkX2J5X3Zpc2l0b3InLCB7IGxuZzogbGFuZ3VhZ2UgfSlcblx0XHR9KTtcblx0fVxufSk7XG4iLCJNZXRlb3IubWV0aG9kcyh7XG5cdCdsaXZlY2hhdDpjbG9zZVJvb20nKHJvb21JZCwgY29tbWVudCkge1xuXHRcdGlmICghTWV0ZW9yLnVzZXJJZCgpIHx8ICFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24oTWV0ZW9yLnVzZXJJZCgpLCAnY2xvc2UtbGl2ZWNoYXQtcm9vbScpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1ub3QtYXV0aG9yaXplZCcsICdOb3QgYXV0aG9yaXplZCcsIHsgbWV0aG9kOiAnbGl2ZWNoYXQ6Y2xvc2VSb29tJyB9KTtcblx0XHR9XG5cblx0XHRjb25zdCByb29tID0gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9uZUJ5SWQocm9vbUlkKTtcblxuXHRcdGlmICghcm9vbSB8fCByb29tLnQgIT09ICdsJykge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcigncm9vbS1ub3QtZm91bmQnLCAnUm9vbSBub3QgZm91bmQnLCB7IG1ldGhvZDogJ2xpdmVjaGF0OmNsb3NlUm9vbScgfSk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgdXNlciA9IE1ldGVvci51c2VyKCk7XG5cblx0XHRpZiAoKCFyb29tLnVzZXJuYW1lcyB8fCByb29tLnVzZXJuYW1lcy5pbmRleE9mKHVzZXIudXNlcm5hbWUpID09PSAtMSkgJiYgIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbihNZXRlb3IudXNlcklkKCksICdjbG9zZS1vdGhlcnMtbGl2ZWNoYXQtcm9vbScpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1ub3QtYXV0aG9yaXplZCcsICdOb3QgYXV0aG9yaXplZCcsIHsgbWV0aG9kOiAnbGl2ZWNoYXQ6Y2xvc2VSb29tJyB9KTtcblx0XHR9XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5MaXZlY2hhdC5jbG9zZVJvb20oe1xuXHRcdFx0dXNlcixcblx0XHRcdHJvb20sXG5cdFx0XHRjb21tZW50XG5cdFx0fSk7XG5cdH1cbn0pO1xuIiwiaW1wb3J0IE9tbmlDaGFubmVsIGZyb20gJy4uL2xpYi9PbW5pQ2hhbm5lbCc7XG5cbk1ldGVvci5tZXRob2RzKHtcblx0J2xpdmVjaGF0OmZhY2Vib29rJyhvcHRpb25zKSB7XG5cdFx0aWYgKCFNZXRlb3IudXNlcklkKCkgfHwgIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbihNZXRlb3IudXNlcklkKCksICd2aWV3LWxpdmVjaGF0LW1hbmFnZXInKSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3Itbm90LWFsbG93ZWQnLCAnTm90IGFsbG93ZWQnLCB7IG1ldGhvZDogJ2xpdmVjaGF0OmFkZEFnZW50JyB9KTtcblx0XHR9XG5cblx0XHR0cnkge1xuXHRcdFx0c3dpdGNoIChvcHRpb25zLmFjdGlvbikge1xuXHRcdFx0XHRjYXNlICdpbml0aWFsU3RhdGUnOiB7XG5cdFx0XHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0XHRcdGVuYWJsZWQ6IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdMaXZlY2hhdF9GYWNlYm9va19FbmFibGVkJyksXG5cdFx0XHRcdFx0XHRoYXNUb2tlbjogISFSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnTGl2ZWNoYXRfRmFjZWJvb2tfQVBJX0tleScpXG5cdFx0XHRcdFx0fTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGNhc2UgJ2VuYWJsZSc6IHtcblx0XHRcdFx0XHRjb25zdCByZXN1bHQgPSBPbW5pQ2hhbm5lbC5lbmFibGUoKTtcblxuXHRcdFx0XHRcdGlmICghcmVzdWx0LnN1Y2Nlc3MpIHtcblx0XHRcdFx0XHRcdHJldHVybiByZXN1bHQ7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0cmV0dXJuIFJvY2tldENoYXQuc2V0dGluZ3MudXBkYXRlQnlJZCgnTGl2ZWNoYXRfRmFjZWJvb2tfRW5hYmxlZCcsIHRydWUpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Y2FzZSAnZGlzYWJsZSc6IHtcblx0XHRcdFx0XHRPbW5pQ2hhbm5lbC5kaXNhYmxlKCk7XG5cblx0XHRcdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5zZXR0aW5ncy51cGRhdGVCeUlkKCdMaXZlY2hhdF9GYWNlYm9va19FbmFibGVkJywgZmFsc2UpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Y2FzZSAnbGlzdC1wYWdlcyc6IHtcblx0XHRcdFx0XHRyZXR1cm4gT21uaUNoYW5uZWwubGlzdFBhZ2VzKCk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRjYXNlICdzdWJzY3JpYmUnOiB7XG5cdFx0XHRcdFx0cmV0dXJuIE9tbmlDaGFubmVsLnN1YnNjcmliZShvcHRpb25zLnBhZ2UpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Y2FzZSAndW5zdWJzY3JpYmUnOiB7XG5cdFx0XHRcdFx0cmV0dXJuIE9tbmlDaGFubmVsLnVuc3Vic2NyaWJlKG9wdGlvbnMucGFnZSk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRpZiAoZS5yZXNwb25zZSAmJiBlLnJlc3BvbnNlLmRhdGEgJiYgZS5yZXNwb25zZS5kYXRhLmVycm9yKSB7XG5cdFx0XHRcdGlmIChlLnJlc3BvbnNlLmRhdGEuZXJyb3IuZXJyb3IpIHtcblx0XHRcdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKGUucmVzcG9uc2UuZGF0YS5lcnJvci5lcnJvciwgZS5yZXNwb25zZS5kYXRhLmVycm9yLm1lc3NhZ2UpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlmIChlLnJlc3BvbnNlLmRhdGEuZXJyb3IucmVzcG9uc2UpIHtcblx0XHRcdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdpbnRlZ3JhdGlvbi1lcnJvcicsIGUucmVzcG9uc2UuZGF0YS5lcnJvci5yZXNwb25zZS5lcnJvci5tZXNzYWdlKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRpZiAoZS5yZXNwb25zZS5kYXRhLmVycm9yLm1lc3NhZ2UpIHtcblx0XHRcdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdpbnRlZ3JhdGlvbi1lcnJvcicsIGUucmVzcG9uc2UuZGF0YS5lcnJvci5tZXNzYWdlKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0Y29uc29sZS5lcnJvcignRXJyb3IgY29udGFjdGluZyBvbW5pLnJvY2tldC5jaGF0OicsIGUpO1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignaW50ZWdyYXRpb24tZXJyb3InLCBlLmVycm9yKTtcblx0XHR9XG5cdH1cbn0pO1xuIiwiTWV0ZW9yLm1ldGhvZHMoe1xuXHQnbGl2ZWNoYXQ6Z2V0Q3VzdG9tRmllbGRzJygpIHtcblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5tb2RlbHMuTGl2ZWNoYXRDdXN0b21GaWVsZC5maW5kKCkuZmV0Y2goKTtcblx0fVxufSk7XG4iLCJpbXBvcnQgTGl2ZWNoYXRWaXNpdG9ycyBmcm9tICcuLi9tb2RlbHMvTGl2ZWNoYXRWaXNpdG9ycyc7XG5cbk1ldGVvci5tZXRob2RzKHtcblx0J2xpdmVjaGF0OmdldEFnZW50RGF0YScoeyByb29tSWQsIHRva2VuIH0pIHtcblx0XHRjaGVjayhyb29tSWQsIFN0cmluZyk7XG5cdFx0Y2hlY2sodG9rZW4sIFN0cmluZyk7XG5cblx0XHRjb25zdCByb29tID0gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9uZUJ5SWQocm9vbUlkKTtcblx0XHRjb25zdCB2aXNpdG9yID0gTGl2ZWNoYXRWaXNpdG9ycy5nZXRWaXNpdG9yQnlUb2tlbih0b2tlbik7XG5cblx0XHQvLyBhbGxvdyB0byBvbmx5IHVzZXIgdG8gc2VuZCB0cmFuc2NyaXB0cyBmcm9tIHRoZWlyIG93biBjaGF0c1xuXHRcdGlmICghcm9vbSB8fCByb29tLnQgIT09ICdsJyB8fCAhcm9vbS52IHx8IHJvb20udi50b2tlbiAhPT0gdmlzaXRvci50b2tlbikge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItaW52YWxpZC1yb29tJywgJ0ludmFsaWQgcm9vbScpO1xuXHRcdH1cblxuXHRcdGlmICghcm9vbS5zZXJ2ZWRCeSkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdHJldHVybiBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5nZXRBZ2VudEluZm8ocm9vbS5zZXJ2ZWRCeS5faWQpO1xuXHR9XG59KTtcbiIsImltcG9ydCBfIGZyb20gJ3VuZGVyc2NvcmUnO1xuXG5pbXBvcnQgTGl2ZWNoYXRWaXNpdG9ycyBmcm9tICcuLi9tb2RlbHMvTGl2ZWNoYXRWaXNpdG9ycyc7XG5cbk1ldGVvci5tZXRob2RzKHtcblx0J2xpdmVjaGF0OmdldEluaXRpYWxEYXRhJyh2aXNpdG9yVG9rZW4pIHtcblx0XHRjb25zdCBpbmZvID0ge1xuXHRcdFx0ZW5hYmxlZDogbnVsbCxcblx0XHRcdHRpdGxlOiBudWxsLFxuXHRcdFx0Y29sb3I6IG51bGwsXG5cdFx0XHRyZWdpc3RyYXRpb25Gb3JtOiBudWxsLFxuXHRcdFx0cm9vbTogbnVsbCxcblx0XHRcdHZpc2l0b3I6IG51bGwsXG5cdFx0XHR0cmlnZ2VyczogW10sXG5cdFx0XHRkZXBhcnRtZW50czogW10sXG5cdFx0XHRhbGxvd1N3aXRjaGluZ0RlcGFydG1lbnRzOiBudWxsLFxuXHRcdFx0b25saW5lOiB0cnVlLFxuXHRcdFx0b2ZmbGluZUNvbG9yOiBudWxsLFxuXHRcdFx0b2ZmbGluZU1lc3NhZ2U6IG51bGwsXG5cdFx0XHRvZmZsaW5lU3VjY2Vzc01lc3NhZ2U6IG51bGwsXG5cdFx0XHRvZmZsaW5lVW5hdmFpbGFibGVNZXNzYWdlOiBudWxsLFxuXHRcdFx0ZGlzcGxheU9mZmxpbmVGb3JtOiBudWxsLFxuXHRcdFx0dmlkZW9DYWxsOiBudWxsLFxuXHRcdFx0Y29udmVyc2F0aW9uRmluaXNoZWRNZXNzYWdlOiBudWxsXG5cdFx0fTtcblxuXHRcdGNvbnN0IHJvb20gPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT3BlbkJ5VmlzaXRvclRva2VuKHZpc2l0b3JUb2tlbiwge1xuXHRcdFx0ZmllbGRzOiB7XG5cdFx0XHRcdG5hbWU6IDEsXG5cdFx0XHRcdHQ6IDEsXG5cdFx0XHRcdGNsOiAxLFxuXHRcdFx0XHR1OiAxLFxuXHRcdFx0XHR1c2VybmFtZXM6IDEsXG5cdFx0XHRcdHY6IDEsXG5cdFx0XHRcdHNlcnZlZEJ5OiAxXG5cdFx0XHR9XG5cdFx0fSkuZmV0Y2goKTtcblxuXHRcdGlmIChyb29tICYmIHJvb20ubGVuZ3RoID4gMCkge1xuXHRcdFx0aW5mby5yb29tID0gcm9vbVswXTtcblx0XHR9XG5cblx0XHRjb25zdCB2aXNpdG9yID0gTGl2ZWNoYXRWaXNpdG9ycy5nZXRWaXNpdG9yQnlUb2tlbih2aXNpdG9yVG9rZW4sIHtcblx0XHRcdGZpZWxkczoge1xuXHRcdFx0XHRuYW1lOiAxLFxuXHRcdFx0XHR1c2VybmFtZTogMSxcblx0XHRcdFx0dmlzaXRvckVtYWlsczogMVxuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0aWYgKHJvb20pIHtcblx0XHRcdGluZm8udmlzaXRvciA9IHZpc2l0b3I7XG5cdFx0fVxuXG5cdFx0Y29uc3QgaW5pdFNldHRpbmdzID0gUm9ja2V0Q2hhdC5MaXZlY2hhdC5nZXRJbml0U2V0dGluZ3MoKTtcblxuXHRcdGluZm8udGl0bGUgPSBpbml0U2V0dGluZ3MuTGl2ZWNoYXRfdGl0bGU7XG5cdFx0aW5mby5jb2xvciA9IGluaXRTZXR0aW5ncy5MaXZlY2hhdF90aXRsZV9jb2xvcjtcblx0XHRpbmZvLmVuYWJsZWQgPSBpbml0U2V0dGluZ3MuTGl2ZWNoYXRfZW5hYmxlZDtcblx0XHRpbmZvLnJlZ2lzdHJhdGlvbkZvcm0gPSBpbml0U2V0dGluZ3MuTGl2ZWNoYXRfcmVnaXN0cmF0aW9uX2Zvcm07XG5cdFx0aW5mby5vZmZsaW5lVGl0bGUgPSBpbml0U2V0dGluZ3MuTGl2ZWNoYXRfb2ZmbGluZV90aXRsZTtcblx0XHRpbmZvLm9mZmxpbmVDb2xvciA9IGluaXRTZXR0aW5ncy5MaXZlY2hhdF9vZmZsaW5lX3RpdGxlX2NvbG9yO1xuXHRcdGluZm8ub2ZmbGluZU1lc3NhZ2UgPSBpbml0U2V0dGluZ3MuTGl2ZWNoYXRfb2ZmbGluZV9tZXNzYWdlO1xuXHRcdGluZm8ub2ZmbGluZVN1Y2Nlc3NNZXNzYWdlID0gaW5pdFNldHRpbmdzLkxpdmVjaGF0X29mZmxpbmVfc3VjY2Vzc19tZXNzYWdlO1xuXHRcdGluZm8ub2ZmbGluZVVuYXZhaWxhYmxlTWVzc2FnZSA9IGluaXRTZXR0aW5ncy5MaXZlY2hhdF9vZmZsaW5lX2Zvcm1fdW5hdmFpbGFibGU7XG5cdFx0aW5mby5kaXNwbGF5T2ZmbGluZUZvcm0gPSBpbml0U2V0dGluZ3MuTGl2ZWNoYXRfZGlzcGxheV9vZmZsaW5lX2Zvcm07XG5cdFx0aW5mby5sYW5ndWFnZSA9IGluaXRTZXR0aW5ncy5MYW5ndWFnZTtcblx0XHRpbmZvLnZpZGVvQ2FsbCA9IGluaXRTZXR0aW5ncy5MaXZlY2hhdF92aWRlb2NhbGxfZW5hYmxlZCA9PT0gdHJ1ZSAmJiBpbml0U2V0dGluZ3MuSml0c2lfRW5hYmxlZCA9PT0gdHJ1ZTtcblx0XHRpbmZvLnRyYW5zY3JpcHQgPSBpbml0U2V0dGluZ3MuTGl2ZWNoYXRfZW5hYmxlX3RyYW5zY3JpcHQ7XG5cdFx0aW5mby50cmFuc2NyaXB0TWVzc2FnZSA9IGluaXRTZXR0aW5ncy5MaXZlY2hhdF90cmFuc2NyaXB0X21lc3NhZ2U7XG5cdFx0aW5mby5jb252ZXJzYXRpb25GaW5pc2hlZE1lc3NhZ2UgPSBpbml0U2V0dGluZ3MuTGl2ZWNoYXRfY29udmVyc2F0aW9uX2ZpbmlzaGVkX21lc3NhZ2U7XG5cblx0XHRpbmZvLmFnZW50RGF0YSA9IHJvb20gJiYgcm9vbVswXSAmJiByb29tWzBdLnNlcnZlZEJ5ICYmIFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmdldEFnZW50SW5mbyhyb29tWzBdLnNlcnZlZEJ5Ll9pZCk7XG5cblx0XHRSb2NrZXRDaGF0Lm1vZGVscy5MaXZlY2hhdFRyaWdnZXIuZmluZEVuYWJsZWQoKS5mb3JFYWNoKCh0cmlnZ2VyKSA9PiB7XG5cdFx0XHRpbmZvLnRyaWdnZXJzLnB1c2goXy5waWNrKHRyaWdnZXIsICdfaWQnLCAnYWN0aW9ucycsICdjb25kaXRpb25zJykpO1xuXHRcdH0pO1xuXG5cdFx0Um9ja2V0Q2hhdC5tb2RlbHMuTGl2ZWNoYXREZXBhcnRtZW50LmZpbmRFbmFibGVkV2l0aEFnZW50cygpLmZvckVhY2goKGRlcGFydG1lbnQpID0+IHtcblx0XHRcdGluZm8uZGVwYXJ0bWVudHMucHVzaChkZXBhcnRtZW50KTtcblx0XHR9KTtcblx0XHRpbmZvLmFsbG93U3dpdGNoaW5nRGVwYXJ0bWVudHMgPSBpbml0U2V0dGluZ3MuTGl2ZWNoYXRfYWxsb3dfc3dpdGNoaW5nX2RlcGFydG1lbnRzO1xuXG5cdFx0aW5mby5vbmxpbmUgPSBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kT25saW5lQWdlbnRzKCkuY291bnQoKSA+IDA7XG5cblx0XHRyZXR1cm4gaW5mbztcblx0fVxufSk7XG4iLCJNZXRlb3IubWV0aG9kcyh7XG5cdCdsaXZlY2hhdDpnZXROZXh0QWdlbnQnKHsgdG9rZW4sIGRlcGFydG1lbnQgfSkge1xuXHRcdGNoZWNrKHRva2VuLCBTdHJpbmcpO1xuXG5cdFx0Y29uc3Qgcm9vbSA9IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRPcGVuQnlWaXNpdG9yVG9rZW4odG9rZW4pLmZldGNoKCk7XG5cblx0XHRpZiAocm9vbSAmJiByb29tLmxlbmd0aCA+IDApIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRpZiAoIWRlcGFydG1lbnQpIHtcblx0XHRcdGNvbnN0IHJlcXVpcmVEZXBhcm1lbnQgPSBSb2NrZXRDaGF0LkxpdmVjaGF0LmdldFJlcXVpcmVkRGVwYXJ0bWVudCgpO1xuXHRcdFx0aWYgKHJlcXVpcmVEZXBhcm1lbnQpIHtcblx0XHRcdFx0ZGVwYXJ0bWVudCA9IHJlcXVpcmVEZXBhcm1lbnQuX2lkO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGNvbnN0IGFnZW50ID0gUm9ja2V0Q2hhdC5MaXZlY2hhdC5nZXROZXh0QWdlbnQoZGVwYXJ0bWVudCk7XG5cdFx0aWYgKCFhZ2VudCkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdHJldHVybiBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5nZXRBZ2VudEluZm8oYWdlbnQuYWdlbnRJZCk7XG5cdH1cbn0pO1xuIiwiaW1wb3J0IExpdmVjaGF0VmlzaXRvcnMgZnJvbSAnLi4vbW9kZWxzL0xpdmVjaGF0VmlzaXRvcnMnO1xuXG5NZXRlb3IubWV0aG9kcyh7XG5cdCdsaXZlY2hhdDpsb2FkSGlzdG9yeScoeyB0b2tlbiwgcmlkLCBlbmQsIGxpbWl0ID0gMjAsIGxzfSkge1xuXHRcdGNvbnN0IHZpc2l0b3IgPSBMaXZlY2hhdFZpc2l0b3JzLmdldFZpc2l0b3JCeVRva2VuKHRva2VuLCB7IGZpZWxkczogeyBfaWQ6IDEgfSB9KTtcblxuXHRcdGlmICghdmlzaXRvcikge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LmxvYWRNZXNzYWdlSGlzdG9yeSh7IHVzZXJJZDogdmlzaXRvci5faWQsIHJpZCwgZW5kLCBsaW1pdCwgbHMgfSk7XG5cdH1cbn0pO1xuIiwiaW1wb3J0IExpdmVjaGF0VmlzaXRvcnMgZnJvbSAnLi4vbW9kZWxzL0xpdmVjaGF0VmlzaXRvcnMnO1xuXG5NZXRlb3IubWV0aG9kcyh7XG5cdCdsaXZlY2hhdDpsb2dpbkJ5VG9rZW4nKHRva2VuKSB7XG5cdFx0Y29uc3QgdXNlciA9IExpdmVjaGF0VmlzaXRvcnMuZ2V0VmlzaXRvckJ5VG9rZW4odG9rZW4sIHsgZmllbGRzOiB7IF9pZDogMSB9IH0pO1xuXG5cdFx0aWYgKCF1c2VyKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHtcblx0XHRcdF9pZDogdXNlci5faWRcblx0XHR9O1xuXHR9XG59KTtcbiIsIk1ldGVvci5tZXRob2RzKHtcblx0J2xpdmVjaGF0OnBhZ2VWaXNpdGVkJyh0b2tlbiwgcGFnZUluZm8pIHtcblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5MaXZlY2hhdC5zYXZlUGFnZUhpc3RvcnkodG9rZW4sIHBhZ2VJbmZvKTtcblx0fVxufSk7XG4iLCJNZXRlb3IubWV0aG9kcyh7XG5cdCdsaXZlY2hhdDpyZWdpc3Rlckd1ZXN0Jyh7IHRva2VuLCBuYW1lLCBlbWFpbCwgZGVwYXJ0bWVudCB9ID0ge30pIHtcblx0XHRjb25zdCB1c2VySWQgPSBSb2NrZXRDaGF0LkxpdmVjaGF0LnJlZ2lzdGVyR3Vlc3QuY2FsbCh0aGlzLCB7XG5cdFx0XHR0b2tlbixcblx0XHRcdG5hbWUsXG5cdFx0XHRlbWFpbCxcblx0XHRcdGRlcGFydG1lbnRcblx0XHR9KTtcblxuXHRcdC8vIHVwZGF0ZSB2aXNpdGVkIHBhZ2UgaGlzdG9yeSB0byBub3QgZXhwaXJlXG5cdFx0Um9ja2V0Q2hhdC5tb2RlbHMuTGl2ZWNoYXRQYWdlVmlzaXRlZC5rZWVwSGlzdG9yeUZvclRva2VuKHRva2VuKTtcblxuXHRcdHJldHVybiB7XG5cdFx0XHR1c2VySWRcblx0XHR9O1xuXHR9XG59KTtcbiIsIk1ldGVvci5tZXRob2RzKHtcblx0J2xpdmVjaGF0OnJlbW92ZUFnZW50Jyh1c2VybmFtZSkge1xuXHRcdGlmICghTWV0ZW9yLnVzZXJJZCgpIHx8ICFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24oTWV0ZW9yLnVzZXJJZCgpLCAndmlldy1saXZlY2hhdC1tYW5hZ2VyJykpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLW5vdC1hbGxvd2VkJywgJ05vdCBhbGxvd2VkJywgeyBtZXRob2Q6ICdsaXZlY2hhdDpyZW1vdmVBZ2VudCcgfSk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuTGl2ZWNoYXQucmVtb3ZlQWdlbnQodXNlcm5hbWUpO1xuXHR9XG59KTtcbiIsIk1ldGVvci5tZXRob2RzKHtcblx0J2xpdmVjaGF0OnJlbW92ZUN1c3RvbUZpZWxkJyhfaWQpIHtcblx0XHRpZiAoIU1ldGVvci51c2VySWQoKSB8fCAhUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKE1ldGVvci51c2VySWQoKSwgJ3ZpZXctbGl2ZWNoYXQtbWFuYWdlcicpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1ub3QtYWxsb3dlZCcsICdOb3QgYWxsb3dlZCcsIHsgbWV0aG9kOiAnbGl2ZWNoYXQ6cmVtb3ZlQ3VzdG9tRmllbGQnIH0pO1xuXHRcdH1cblxuXHRcdGNoZWNrKF9pZCwgU3RyaW5nKTtcblxuXHRcdGNvbnN0IGN1c3RvbUZpZWxkID0gUm9ja2V0Q2hhdC5tb2RlbHMuTGl2ZWNoYXRDdXN0b21GaWVsZC5maW5kT25lQnlJZChfaWQsIHsgZmllbGRzOiB7IF9pZDogMSB9IH0pO1xuXG5cdFx0aWYgKCFjdXN0b21GaWVsZCkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItaW52YWxpZC1jdXN0b20tZmllbGQnLCAnQ3VzdG9tIGZpZWxkIG5vdCBmb3VuZCcsIHsgbWV0aG9kOiAnbGl2ZWNoYXQ6cmVtb3ZlQ3VzdG9tRmllbGQnIH0pO1xuXHRcdH1cblxuXHRcdHJldHVybiBSb2NrZXRDaGF0Lm1vZGVscy5MaXZlY2hhdEN1c3RvbUZpZWxkLnJlbW92ZUJ5SWQoX2lkKTtcblx0fVxufSk7XG4iLCJNZXRlb3IubWV0aG9kcyh7XG5cdCdsaXZlY2hhdDpyZW1vdmVEZXBhcnRtZW50JyhfaWQpIHtcblx0XHRpZiAoIU1ldGVvci51c2VySWQoKSB8fCAhUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKE1ldGVvci51c2VySWQoKSwgJ3ZpZXctbGl2ZWNoYXQtbWFuYWdlcicpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1ub3QtYWxsb3dlZCcsICdOb3QgYWxsb3dlZCcsIHsgbWV0aG9kOiAnbGl2ZWNoYXQ6cmVtb3ZlRGVwYXJ0bWVudCcgfSk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuTGl2ZWNoYXQucmVtb3ZlRGVwYXJ0bWVudChfaWQpO1xuXHR9XG59KTtcbiIsIk1ldGVvci5tZXRob2RzKHtcblx0J2xpdmVjaGF0OnJlbW92ZU1hbmFnZXInKHVzZXJuYW1lKSB7XG5cdFx0aWYgKCFNZXRlb3IudXNlcklkKCkgfHwgIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbihNZXRlb3IudXNlcklkKCksICd2aWV3LWxpdmVjaGF0LW1hbmFnZXInKSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3Itbm90LWFsbG93ZWQnLCAnTm90IGFsbG93ZWQnLCB7IG1ldGhvZDogJ2xpdmVjaGF0OnJlbW92ZU1hbmFnZXInIH0pO1xuXHRcdH1cblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkxpdmVjaGF0LnJlbW92ZU1hbmFnZXIodXNlcm5hbWUpO1xuXHR9XG59KTtcbiIsIk1ldGVvci5tZXRob2RzKHtcblx0J2xpdmVjaGF0OnJlbW92ZVRyaWdnZXInKHRyaWdnZXJJZCkge1xuXHRcdGlmICghTWV0ZW9yLnVzZXJJZCgpIHx8ICFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24oTWV0ZW9yLnVzZXJJZCgpLCAndmlldy1saXZlY2hhdC1tYW5hZ2VyJykpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLW5vdC1hbGxvd2VkJywgJ05vdCBhbGxvd2VkJywgeyBtZXRob2Q6ICdsaXZlY2hhdDpyZW1vdmVUcmlnZ2VyJyB9KTtcblx0XHR9XG5cblx0XHRjaGVjayh0cmlnZ2VySWQsIFN0cmluZyk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5tb2RlbHMuTGl2ZWNoYXRUcmlnZ2VyLnJlbW92ZUJ5SWQodHJpZ2dlcklkKTtcblx0fVxufSk7XG4iLCJNZXRlb3IubWV0aG9kcyh7XG5cdCdsaXZlY2hhdDpzYXZlQXBwZWFyYW5jZScoc2V0dGluZ3MpIHtcblx0XHRpZiAoIU1ldGVvci51c2VySWQoKSB8fCAhUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKE1ldGVvci51c2VySWQoKSwgJ3ZpZXctbGl2ZWNoYXQtbWFuYWdlcicpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1ub3QtYWxsb3dlZCcsICdOb3QgYWxsb3dlZCcsIHsgbWV0aG9kOiAnbGl2ZWNoYXQ6c2F2ZUFwcGVhcmFuY2UnIH0pO1xuXHRcdH1cblxuXHRcdGNvbnN0IHZhbGlkU2V0dGluZ3MgPSBbXG5cdFx0XHQnTGl2ZWNoYXRfdGl0bGUnLFxuXHRcdFx0J0xpdmVjaGF0X3RpdGxlX2NvbG9yJyxcblx0XHRcdCdMaXZlY2hhdF9zaG93X2FnZW50X2VtYWlsJyxcblx0XHRcdCdMaXZlY2hhdF9kaXNwbGF5X29mZmxpbmVfZm9ybScsXG5cdFx0XHQnTGl2ZWNoYXRfb2ZmbGluZV9mb3JtX3VuYXZhaWxhYmxlJyxcblx0XHRcdCdMaXZlY2hhdF9vZmZsaW5lX21lc3NhZ2UnLFxuXHRcdFx0J0xpdmVjaGF0X29mZmxpbmVfc3VjY2Vzc19tZXNzYWdlJyxcblx0XHRcdCdMaXZlY2hhdF9vZmZsaW5lX3RpdGxlJyxcblx0XHRcdCdMaXZlY2hhdF9vZmZsaW5lX3RpdGxlX2NvbG9yJyxcblx0XHRcdCdMaXZlY2hhdF9vZmZsaW5lX2VtYWlsJyxcblx0XHRcdCdMaXZlY2hhdF9jb252ZXJzYXRpb25fZmluaXNoZWRfbWVzc2FnZSdcblx0XHRdO1xuXG5cdFx0Y29uc3QgdmFsaWQgPSBzZXR0aW5ncy5ldmVyeSgoc2V0dGluZykgPT4ge1xuXHRcdFx0cmV0dXJuIHZhbGlkU2V0dGluZ3MuaW5kZXhPZihzZXR0aW5nLl9pZCkgIT09IC0xO1xuXHRcdH0pO1xuXG5cdFx0aWYgKCF2YWxpZCkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignaW52YWxpZC1zZXR0aW5nJyk7XG5cdFx0fVxuXG5cdFx0c2V0dGluZ3MuZm9yRWFjaCgoc2V0dGluZykgPT4ge1xuXHRcdFx0Um9ja2V0Q2hhdC5zZXR0aW5ncy51cGRhdGVCeUlkKHNldHRpbmcuX2lkLCBzZXR0aW5nLnZhbHVlKTtcblx0XHR9KTtcblxuXHRcdHJldHVybjtcblx0fVxufSk7XG4iLCIvKiBlc2xpbnQgbmV3LWNhcDogWzIsIHtcImNhcElzTmV3RXhjZXB0aW9uc1wiOiBbXCJNYXRjaC5PYmplY3RJbmNsdWRpbmdcIiwgXCJNYXRjaC5PcHRpb25hbFwiXX1dICovXG5cbk1ldGVvci5tZXRob2RzKHtcblx0J2xpdmVjaGF0OnNhdmVDdXN0b21GaWVsZCcoX2lkLCBjdXN0b21GaWVsZERhdGEpIHtcblx0XHRpZiAoIU1ldGVvci51c2VySWQoKSB8fCAhUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKE1ldGVvci51c2VySWQoKSwgJ3ZpZXctbGl2ZWNoYXQtbWFuYWdlcicpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1ub3QtYWxsb3dlZCcsICdOb3QgYWxsb3dlZCcsIHsgbWV0aG9kOiAnbGl2ZWNoYXQ6c2F2ZUN1c3RvbUZpZWxkJyB9KTtcblx0XHR9XG5cblx0XHRpZiAoX2lkKSB7XG5cdFx0XHRjaGVjayhfaWQsIFN0cmluZyk7XG5cdFx0fVxuXG5cdFx0Y2hlY2soY3VzdG9tRmllbGREYXRhLCBNYXRjaC5PYmplY3RJbmNsdWRpbmcoeyBmaWVsZDogU3RyaW5nLCBsYWJlbDogU3RyaW5nLCBzY29wZTogU3RyaW5nLCB2aXNpYmlsaXR5OiBTdHJpbmcgfSkpO1xuXG5cdFx0aWYgKCEvXlswLTlhLXpBLVotX10rJC8udGVzdChjdXN0b21GaWVsZERhdGEuZmllbGQpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLWN1c3RvbS1maWVsZC1ubWFlJywgJ0ludmFsaWQgY3VzdG9tIGZpZWxkIG5hbWUuIFVzZSBvbmx5IGxldHRlcnMsIG51bWJlcnMsIGh5cGhlbnMgYW5kIHVuZGVyc2NvcmVzLicsIHsgbWV0aG9kOiAnbGl2ZWNoYXQ6c2F2ZUN1c3RvbUZpZWxkJyB9KTtcblx0XHR9XG5cblx0XHRpZiAoX2lkKSB7XG5cdFx0XHRjb25zdCBjdXN0b21GaWVsZCA9IFJvY2tldENoYXQubW9kZWxzLkxpdmVjaGF0Q3VzdG9tRmllbGQuZmluZE9uZUJ5SWQoX2lkKTtcblx0XHRcdGlmICghY3VzdG9tRmllbGQpIHtcblx0XHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItaW52YWxpZC1jdXN0b20tZmllbGQnLCAnQ3VzdG9tIEZpZWxkIE5vdCBmb3VuZCcsIHsgbWV0aG9kOiAnbGl2ZWNoYXQ6c2F2ZUN1c3RvbUZpZWxkJyB9KTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5tb2RlbHMuTGl2ZWNoYXRDdXN0b21GaWVsZC5jcmVhdGVPclVwZGF0ZUN1c3RvbUZpZWxkKF9pZCwgY3VzdG9tRmllbGREYXRhLmZpZWxkLCBjdXN0b21GaWVsZERhdGEubGFiZWwsIGN1c3RvbUZpZWxkRGF0YS5zY29wZSwgY3VzdG9tRmllbGREYXRhLnZpc2liaWxpdHkpO1xuXHR9XG59KTtcbiIsIk1ldGVvci5tZXRob2RzKHtcblx0J2xpdmVjaGF0OnNhdmVEZXBhcnRtZW50JyhfaWQsIGRlcGFydG1lbnREYXRhLCBkZXBhcnRtZW50QWdlbnRzKSB7XG5cdFx0aWYgKCFNZXRlb3IudXNlcklkKCkgfHwgIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbihNZXRlb3IudXNlcklkKCksICd2aWV3LWxpdmVjaGF0LW1hbmFnZXInKSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3Itbm90LWFsbG93ZWQnLCAnTm90IGFsbG93ZWQnLCB7IG1ldGhvZDogJ2xpdmVjaGF0OnNhdmVEZXBhcnRtZW50JyB9KTtcblx0XHR9XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5MaXZlY2hhdC5zYXZlRGVwYXJ0bWVudChfaWQsIGRlcGFydG1lbnREYXRhLCBkZXBhcnRtZW50QWdlbnRzKTtcblx0fVxufSk7XG4iLCIvKiBlc2xpbnQgbmV3LWNhcDogWzIsIHtcImNhcElzTmV3RXhjZXB0aW9uc1wiOiBbXCJNYXRjaC5PYmplY3RJbmNsdWRpbmdcIiwgXCJNYXRjaC5PcHRpb25hbFwiXX1dICovXG5cbk1ldGVvci5tZXRob2RzKHtcblx0J2xpdmVjaGF0OnNhdmVJbmZvJyhndWVzdERhdGEsIHJvb21EYXRhKSB7XG5cdFx0aWYgKCFNZXRlb3IudXNlcklkKCkgfHwgIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbihNZXRlb3IudXNlcklkKCksICd2aWV3LWwtcm9vbScpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1ub3QtYWxsb3dlZCcsICdOb3QgYWxsb3dlZCcsIHsgbWV0aG9kOiAnbGl2ZWNoYXQ6c2F2ZUluZm8nIH0pO1xuXHRcdH1cblxuXHRcdGNoZWNrKGd1ZXN0RGF0YSwgTWF0Y2guT2JqZWN0SW5jbHVkaW5nKHtcblx0XHRcdF9pZDogU3RyaW5nLFxuXHRcdFx0bmFtZTogTWF0Y2guT3B0aW9uYWwoU3RyaW5nKSxcblx0XHRcdGVtYWlsOiBNYXRjaC5PcHRpb25hbChTdHJpbmcpLFxuXHRcdFx0cGhvbmU6IE1hdGNoLk9wdGlvbmFsKFN0cmluZylcblx0XHR9KSk7XG5cblx0XHRjaGVjayhyb29tRGF0YSwgTWF0Y2guT2JqZWN0SW5jbHVkaW5nKHtcblx0XHRcdF9pZDogU3RyaW5nLFxuXHRcdFx0dG9waWM6IE1hdGNoLk9wdGlvbmFsKFN0cmluZyksXG5cdFx0XHR0YWdzOiBNYXRjaC5PcHRpb25hbChTdHJpbmcpXG5cdFx0fSkpO1xuXG5cdFx0Y29uc3Qgcm9vbSA9IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRPbmVCeUlkKHJvb21EYXRhLl9pZCwge2ZpZWxkczoge3Q6IDEsIHNlcnZlZEJ5OiAxfX0pO1xuXG5cdFx0aWYgKHJvb20gPT0gbnVsbCB8fCByb29tLnQgIT09ICdsJykge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItaW52YWxpZC1yb29tJywgJ0ludmFsaWQgcm9vbScsIHsgbWV0aG9kOiAnbGl2ZWNoYXQ6c2F2ZUluZm8nIH0pO1xuXHRcdH1cblxuXHRcdGlmICgoIXJvb20uc2VydmVkQnkgfHwgcm9vbS5zZXJ2ZWRCeS5faWQgIT09IE1ldGVvci51c2VySWQoKSkgJiYgIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbihNZXRlb3IudXNlcklkKCksICdzYXZlLW90aGVycy1saXZlY2hhdC1yb29tLWluZm8nKSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3Itbm90LWFsbG93ZWQnLCAnTm90IGFsbG93ZWQnLCB7IG1ldGhvZDogJ2xpdmVjaGF0OnNhdmVJbmZvJyB9KTtcblx0XHR9XG5cblx0XHRjb25zdCByZXQgPSBSb2NrZXRDaGF0LkxpdmVjaGF0LnNhdmVHdWVzdChndWVzdERhdGEpICYmIFJvY2tldENoYXQuTGl2ZWNoYXQuc2F2ZVJvb21JbmZvKHJvb21EYXRhLCBndWVzdERhdGEpO1xuXG5cdFx0TWV0ZW9yLmRlZmVyKCgpID0+IHtcblx0XHRcdFJvY2tldENoYXQuY2FsbGJhY2tzLnJ1bignbGl2ZWNoYXQuc2F2ZUluZm8nLCBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT25lQnlJZChyb29tRGF0YS5faWQpKTtcblx0XHR9KTtcblxuXHRcdHJldHVybiByZXQ7XG5cdH1cbn0pO1xuIiwiaW1wb3J0IHMgZnJvbSAndW5kZXJzY29yZS5zdHJpbmcnO1xuXG5NZXRlb3IubWV0aG9kcyh7XG5cdCdsaXZlY2hhdDpzYXZlSW50ZWdyYXRpb24nKHZhbHVlcykge1xuXHRcdGlmICghTWV0ZW9yLnVzZXJJZCgpIHx8ICFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24oTWV0ZW9yLnVzZXJJZCgpLCAndmlldy1saXZlY2hhdC1tYW5hZ2VyJykpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLW5vdC1hbGxvd2VkJywgJ05vdCBhbGxvd2VkJywgeyBtZXRob2Q6ICdsaXZlY2hhdDpzYXZlSW50ZWdyYXRpb24nIH0pO1xuXHRcdH1cblxuXHRcdGlmICh0eXBlb2YgdmFsdWVzWydMaXZlY2hhdF93ZWJob29rVXJsJ10gIT09ICd1bmRlZmluZWQnKSB7XG5cdFx0XHRSb2NrZXRDaGF0LnNldHRpbmdzLnVwZGF0ZUJ5SWQoJ0xpdmVjaGF0X3dlYmhvb2tVcmwnLCBzLnRyaW0odmFsdWVzWydMaXZlY2hhdF93ZWJob29rVXJsJ10pKTtcblx0XHR9XG5cblx0XHRpZiAodHlwZW9mIHZhbHVlc1snTGl2ZWNoYXRfc2VjcmV0X3Rva2VuJ10gIT09ICd1bmRlZmluZWQnKSB7XG5cdFx0XHRSb2NrZXRDaGF0LnNldHRpbmdzLnVwZGF0ZUJ5SWQoJ0xpdmVjaGF0X3NlY3JldF90b2tlbicsIHMudHJpbSh2YWx1ZXNbJ0xpdmVjaGF0X3NlY3JldF90b2tlbiddKSk7XG5cdFx0fVxuXG5cdFx0aWYgKHR5cGVvZiB2YWx1ZXNbJ0xpdmVjaGF0X3dlYmhvb2tfb25fY2xvc2UnXSAhPT0gJ3VuZGVmaW5lZCcpIHtcblx0XHRcdFJvY2tldENoYXQuc2V0dGluZ3MudXBkYXRlQnlJZCgnTGl2ZWNoYXRfd2ViaG9va19vbl9jbG9zZScsICEhdmFsdWVzWydMaXZlY2hhdF93ZWJob29rX29uX2Nsb3NlJ10pO1xuXHRcdH1cblxuXHRcdGlmICh0eXBlb2YgdmFsdWVzWydMaXZlY2hhdF93ZWJob29rX29uX29mZmxpbmVfbXNnJ10gIT09ICd1bmRlZmluZWQnKSB7XG5cdFx0XHRSb2NrZXRDaGF0LnNldHRpbmdzLnVwZGF0ZUJ5SWQoJ0xpdmVjaGF0X3dlYmhvb2tfb25fb2ZmbGluZV9tc2cnLCAhIXZhbHVlc1snTGl2ZWNoYXRfd2ViaG9va19vbl9vZmZsaW5lX21zZyddKTtcblx0XHR9XG5cblx0XHRpZiAodHlwZW9mIHZhbHVlc1snTGl2ZWNoYXRfd2ViaG9va19vbl92aXNpdG9yX21lc3NhZ2UnXSAhPT0gJ3VuZGVmaW5lZCcpIHtcblx0XHRcdFJvY2tldENoYXQuc2V0dGluZ3MudXBkYXRlQnlJZCgnTGl2ZWNoYXRfd2ViaG9va19vbl92aXNpdG9yX21lc3NhZ2UnLCAhIXZhbHVlc1snTGl2ZWNoYXRfd2ViaG9va19vbl92aXNpdG9yX21lc3NhZ2UnXSk7XG5cdFx0fVxuXG5cdFx0aWYgKHR5cGVvZiB2YWx1ZXNbJ0xpdmVjaGF0X3dlYmhvb2tfb25fYWdlbnRfbWVzc2FnZSddICE9PSAndW5kZWZpbmVkJykge1xuXHRcdFx0Um9ja2V0Q2hhdC5zZXR0aW5ncy51cGRhdGVCeUlkKCdMaXZlY2hhdF93ZWJob29rX29uX2FnZW50X21lc3NhZ2UnLCAhIXZhbHVlc1snTGl2ZWNoYXRfd2ViaG9va19vbl9hZ2VudF9tZXNzYWdlJ10pO1xuXHRcdH1cblxuXHRcdHJldHVybjtcblx0fVxufSk7XG4iLCIvKiBlc2xpbnQgbmV3LWNhcDogWzIsIHtcImNhcElzTmV3RXhjZXB0aW9uc1wiOiBbXCJNYXRjaC5PYmplY3RJbmNsdWRpbmdcIl19XSAqL1xuaW1wb3J0IExpdmVjaGF0VmlzaXRvcnMgZnJvbSAnLi4vbW9kZWxzL0xpdmVjaGF0VmlzaXRvcnMnO1xuaW1wb3J0IF8gZnJvbSAndW5kZXJzY29yZSc7XG5cbk1ldGVvci5tZXRob2RzKHtcblx0J2xpdmVjaGF0OnNhdmVTdXJ2ZXlGZWVkYmFjaycodmlzaXRvclRva2VuLCB2aXNpdG9yUm9vbSwgZm9ybURhdGEpIHtcblx0XHRjaGVjayh2aXNpdG9yVG9rZW4sIFN0cmluZyk7XG5cdFx0Y2hlY2sodmlzaXRvclJvb20sIFN0cmluZyk7XG5cdFx0Y2hlY2soZm9ybURhdGEsIFtNYXRjaC5PYmplY3RJbmNsdWRpbmcoeyBuYW1lOiBTdHJpbmcsIHZhbHVlOiBTdHJpbmcgfSldKTtcblxuXHRcdGNvbnN0IHZpc2l0b3IgPSBMaXZlY2hhdFZpc2l0b3JzLmdldFZpc2l0b3JCeVRva2VuKHZpc2l0b3JUb2tlbik7XG5cdFx0Y29uc3Qgcm9vbSA9IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRPbmVCeUlkKHZpc2l0b3JSb29tKTtcblxuXHRcdGlmICh2aXNpdG9yICE9PSB1bmRlZmluZWQgJiYgcm9vbSAhPT0gdW5kZWZpbmVkICYmIHJvb20udiAhPT0gdW5kZWZpbmVkICYmIHJvb20udi50b2tlbiA9PT0gdmlzaXRvci50b2tlbikge1xuXHRcdFx0Y29uc3QgdXBkYXRlRGF0YSA9IHt9O1xuXHRcdFx0Zm9yIChjb25zdCBpdGVtIG9mIGZvcm1EYXRhKSB7XG5cdFx0XHRcdGlmIChfLmNvbnRhaW5zKFsnc2F0aXNmYWN0aW9uJywgJ2FnZW50S25vd2xlZGdlJywgJ2FnZW50UmVzcG9zaXZlbmVzcycsICdhZ2VudEZyaWVuZGxpbmVzcyddLCBpdGVtLm5hbWUpICYmIF8uY29udGFpbnMoWycxJywgJzInLCAnMycsICc0JywgJzUnXSwgaXRlbS52YWx1ZSkpIHtcblx0XHRcdFx0XHR1cGRhdGVEYXRhW2l0ZW0ubmFtZV0gPSBpdGVtLnZhbHVlO1xuXHRcdFx0XHR9IGVsc2UgaWYgKGl0ZW0ubmFtZSA9PT0gJ2FkZGl0aW9uYWxGZWVkYmFjaycpIHtcblx0XHRcdFx0XHR1cGRhdGVEYXRhW2l0ZW0ubmFtZV0gPSBpdGVtLnZhbHVlO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRpZiAoIV8uaXNFbXB0eSh1cGRhdGVEYXRhKSkge1xuXHRcdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMudXBkYXRlU3VydmV5RmVlZGJhY2tCeUlkKHJvb20uX2lkLCB1cGRhdGVEYXRhKTtcblx0XHRcdH1cblx0XHR9XG5cdH1cbn0pO1xuIiwiTWV0ZW9yLm1ldGhvZHMoe1xuXHQnbGl2ZWNoYXQ6c2F2ZVRyaWdnZXInKHRyaWdnZXIpIHtcblx0XHRpZiAoIU1ldGVvci51c2VySWQoKSB8fCAhUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKE1ldGVvci51c2VySWQoKSwgJ3ZpZXctbGl2ZWNoYXQtbWFuYWdlcicpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1ub3QtYWxsb3dlZCcsICdOb3QgYWxsb3dlZCcsIHsgbWV0aG9kOiAnbGl2ZWNoYXQ6c2F2ZVRyaWdnZXInIH0pO1xuXHRcdH1cblxuXHRcdGNoZWNrKHRyaWdnZXIsIHtcblx0XHRcdF9pZDogTWF0Y2guTWF5YmUoU3RyaW5nKSxcblx0XHRcdG5hbWU6IFN0cmluZyxcblx0XHRcdGRlc2NyaXB0aW9uOiBTdHJpbmcsXG5cdFx0XHRlbmFibGVkOiBCb29sZWFuLFxuXHRcdFx0Y29uZGl0aW9uczogQXJyYXksXG5cdFx0XHRhY3Rpb25zOiBBcnJheVxuXHRcdH0pO1xuXG5cdFx0aWYgKHRyaWdnZXIuX2lkKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5tb2RlbHMuTGl2ZWNoYXRUcmlnZ2VyLnVwZGF0ZUJ5SWQodHJpZ2dlci5faWQsIHRyaWdnZXIpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5tb2RlbHMuTGl2ZWNoYXRUcmlnZ2VyLmluc2VydCh0cmlnZ2VyKTtcblx0XHR9XG5cdH1cbn0pO1xuIiwiaW1wb3J0IF8gZnJvbSAndW5kZXJzY29yZSc7XG5cbk1ldGVvci5tZXRob2RzKHtcblx0J2xpdmVjaGF0OnNlYXJjaEFnZW50Jyh1c2VybmFtZSkge1xuXHRcdGlmICghTWV0ZW9yLnVzZXJJZCgpIHx8ICFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24oTWV0ZW9yLnVzZXJJZCgpLCAndmlldy1saXZlY2hhdC1tYW5hZ2VyJykpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLW5vdC1hbGxvd2VkJywgJ05vdCBhbGxvd2VkJywgeyBtZXRob2Q6ICdsaXZlY2hhdDpzZWFyY2hBZ2VudCcgfSk7XG5cdFx0fVxuXG5cdFx0aWYgKCF1c2VybmFtZSB8fCAhXy5pc1N0cmluZyh1c2VybmFtZSkpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWludmFsaWQtYXJndW1lbnRzJywgJ0ludmFsaWQgYXJndW1lbnRzJywgeyBtZXRob2Q6ICdsaXZlY2hhdDpzZWFyY2hBZ2VudCcgfSk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgdXNlciA9IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmVCeVVzZXJuYW1lKHVzZXJuYW1lLCB7IGZpZWxkczogeyBfaWQ6IDEsIHVzZXJuYW1lOiAxIH0gfSk7XG5cblx0XHRpZiAoIXVzZXIpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWludmFsaWQtdXNlcicsICdJbnZhbGlkIHVzZXInLCB7IG1ldGhvZDogJ2xpdmVjaGF0OnNlYXJjaEFnZW50JyB9KTtcblx0XHR9XG5cblx0XHRyZXR1cm4gdXNlcjtcblx0fVxufSk7XG4iLCJpbXBvcnQgTGl2ZWNoYXRWaXNpdG9ycyBmcm9tICcuLi9tb2RlbHMvTGl2ZWNoYXRWaXNpdG9ycyc7XG5cbk1ldGVvci5tZXRob2RzKHtcblx0c2VuZE1lc3NhZ2VMaXZlY2hhdCh7IHRva2VuLCBfaWQsIHJpZCwgbXNnIH0sIGFnZW50KSB7XG5cdFx0Y2hlY2sodG9rZW4sIFN0cmluZyk7XG5cdFx0Y2hlY2soX2lkLCBTdHJpbmcpO1xuXHRcdGNoZWNrKHJpZCwgU3RyaW5nKTtcblx0XHRjaGVjayhtc2csIFN0cmluZyk7XG5cblx0XHRjaGVjayhhZ2VudCwgTWF0Y2guTWF5YmUoe1xuXHRcdFx0YWdlbnRJZDogU3RyaW5nLFxuXHRcdFx0dXNlcm5hbWU6IFN0cmluZ1xuXHRcdH0pKTtcblxuXHRcdGNvbnN0IGd1ZXN0ID0gTGl2ZWNoYXRWaXNpdG9ycy5nZXRWaXNpdG9yQnlUb2tlbih0b2tlbiwge1xuXHRcdFx0ZmllbGRzOiB7XG5cdFx0XHRcdG5hbWU6IDEsXG5cdFx0XHRcdHVzZXJuYW1lOiAxLFxuXHRcdFx0XHRkZXBhcnRtZW50OiAxLFxuXHRcdFx0XHR0b2tlbjogMVxuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0aWYgKCFndWVzdCkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignaW52YWxpZC10b2tlbicpO1xuXHRcdH1cblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkxpdmVjaGF0LnNlbmRNZXNzYWdlKHtcblx0XHRcdGd1ZXN0LFxuXHRcdFx0bWVzc2FnZToge1xuXHRcdFx0XHRfaWQsXG5cdFx0XHRcdHJpZCxcblx0XHRcdFx0bXNnLFxuXHRcdFx0XHR0b2tlblxuXHRcdFx0fSxcblx0XHRcdGFnZW50XG5cdFx0fSk7XG5cdH1cbn0pO1xuIiwiLyogZ2xvYmFscyBERFBSYXRlTGltaXRlciAqL1xuaW1wb3J0IGRucyBmcm9tICdkbnMnO1xuXG5NZXRlb3IubWV0aG9kcyh7XG5cdCdsaXZlY2hhdDpzZW5kT2ZmbGluZU1lc3NhZ2UnKGRhdGEpIHtcblx0XHRjaGVjayhkYXRhLCB7XG5cdFx0XHRuYW1lOiBTdHJpbmcsXG5cdFx0XHRlbWFpbDogU3RyaW5nLFxuXHRcdFx0bWVzc2FnZTogU3RyaW5nXG5cdFx0fSk7XG5cblx0XHRpZiAoIVJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdMaXZlY2hhdF9kaXNwbGF5X29mZmxpbmVfZm9ybScpKSB7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXG5cdFx0Y29uc3QgaGVhZGVyID0gUm9ja2V0Q2hhdC5wbGFjZWhvbGRlcnMucmVwbGFjZShSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnRW1haWxfSGVhZGVyJykgfHwgJycpO1xuXHRcdGNvbnN0IGZvb3RlciA9IFJvY2tldENoYXQucGxhY2Vob2xkZXJzLnJlcGxhY2UoUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0VtYWlsX0Zvb3RlcicpIHx8ICcnKTtcblxuXHRcdGNvbnN0IG1lc3NhZ2UgPSAoYCR7IGRhdGEubWVzc2FnZSB9YCkucmVwbGFjZSgvKFtePlxcclxcbl0/KShcXHJcXG58XFxuXFxyfFxccnxcXG4pL2csICckMScgKyAnPGJyPicgKyAnJDInKTtcblxuXHRcdGNvbnN0IGh0bWwgPSBgXG5cdFx0XHQ8aDE+TmV3IGxpdmVjaGF0IG1lc3NhZ2U8L2gxPlxuXHRcdFx0PHA+PHN0cm9uZz5WaXNpdG9yIG5hbWU6PC9zdHJvbmc+ICR7IGRhdGEubmFtZSB9PC9wPlxuXHRcdFx0PHA+PHN0cm9uZz5WaXNpdG9yIGVtYWlsOjwvc3Ryb25nPiAkeyBkYXRhLmVtYWlsIH08L3A+XG5cdFx0XHQ8cD48c3Ryb25nPk1lc3NhZ2U6PC9zdHJvbmc+PGJyPiR7IG1lc3NhZ2UgfTwvcD5gO1xuXG5cdFx0bGV0IGZyb21FbWFpbCA9IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdGcm9tX0VtYWlsJykubWF0Y2goL1xcYltBLVowLTkuXyUrLV0rQCg/OltBLVowLTktXStcXC4pK1tBLVpdezIsNH1cXGIvaSk7XG5cblx0XHRpZiAoZnJvbUVtYWlsKSB7XG5cdFx0XHRmcm9tRW1haWwgPSBmcm9tRW1haWxbMF07XG5cdFx0fSBlbHNlIHtcblx0XHRcdGZyb21FbWFpbCA9IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdGcm9tX0VtYWlsJyk7XG5cdFx0fVxuXG5cdFx0aWYgKFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdMaXZlY2hhdF92YWxpZGF0ZV9vZmZsaW5lX2VtYWlsJykpIHtcblx0XHRcdGNvbnN0IGVtYWlsRG9tYWluID0gZGF0YS5lbWFpbC5zdWJzdHIoZGF0YS5lbWFpbC5sYXN0SW5kZXhPZignQCcpICsgMSk7XG5cblx0XHRcdHRyeSB7XG5cdFx0XHRcdE1ldGVvci53cmFwQXN5bmMoZG5zLnJlc29sdmVNeCkoZW1haWxEb21haW4pO1xuXHRcdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLWVtYWlsLWFkZHJlc3MnLCAnSW52YWxpZCBlbWFpbCBhZGRyZXNzJywgeyBtZXRob2Q6ICdsaXZlY2hhdDpzZW5kT2ZmbGluZU1lc3NhZ2UnIH0pO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdE1ldGVvci5kZWZlcigoKSA9PiB7XG5cdFx0XHRFbWFpbC5zZW5kKHtcblx0XHRcdFx0dG86IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdMaXZlY2hhdF9vZmZsaW5lX2VtYWlsJyksXG5cdFx0XHRcdGZyb206IGAkeyBkYXRhLm5hbWUgfSAtICR7IGRhdGEuZW1haWwgfSA8JHsgZnJvbUVtYWlsIH0+YCxcblx0XHRcdFx0cmVwbHlUbzogYCR7IGRhdGEubmFtZSB9IDwkeyBkYXRhLmVtYWlsIH0+YCxcblx0XHRcdFx0c3ViamVjdDogYExpdmVjaGF0IG9mZmxpbmUgbWVzc2FnZSBmcm9tICR7IGRhdGEubmFtZSB9OiAkeyAoYCR7IGRhdGEubWVzc2FnZSB9YCkuc3Vic3RyaW5nKDAsIDIwKSB9YCxcblx0XHRcdFx0aHRtbDogaGVhZGVyICsgaHRtbCArIGZvb3RlclxuXHRcdFx0fSk7XG5cdFx0fSk7XG5cblx0XHRNZXRlb3IuZGVmZXIoKCkgPT4ge1xuXHRcdFx0Um9ja2V0Q2hhdC5jYWxsYmFja3MucnVuKCdsaXZlY2hhdC5vZmZsaW5lTWVzc2FnZScsIGRhdGEpO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIHRydWU7XG5cdH1cbn0pO1xuXG5ERFBSYXRlTGltaXRlci5hZGRSdWxlKHtcblx0dHlwZTogJ21ldGhvZCcsXG5cdG5hbWU6ICdsaXZlY2hhdDpzZW5kT2ZmbGluZU1lc3NhZ2UnLFxuXHRjb25uZWN0aW9uSWQoKSB7XG5cdFx0cmV0dXJuIHRydWU7XG5cdH1cbn0sIDEsIDUwMDApO1xuIiwiaW1wb3J0IExpdmVjaGF0VmlzaXRvcnMgZnJvbSAnLi4vbW9kZWxzL0xpdmVjaGF0VmlzaXRvcnMnO1xuXG5NZXRlb3IubWV0aG9kcyh7XG5cdCdsaXZlY2hhdDpzZXRDdXN0b21GaWVsZCcodG9rZW4sIGtleSwgdmFsdWUsIG92ZXJ3cml0ZSA9IHRydWUpIHtcblx0XHRjb25zdCBjdXN0b21GaWVsZCA9IFJvY2tldENoYXQubW9kZWxzLkxpdmVjaGF0Q3VzdG9tRmllbGQuZmluZE9uZUJ5SWQoa2V5KTtcblx0XHRpZiAoY3VzdG9tRmllbGQpIHtcblx0XHRcdGlmIChjdXN0b21GaWVsZC5zY29wZSA9PT0gJ3Jvb20nKSB7XG5cdFx0XHRcdHJldHVybiBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy51cGRhdGVMaXZlY2hhdERhdGFCeVRva2VuKHRva2VuLCBrZXksIHZhbHVlLCBvdmVyd3JpdGUpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Ly8gU2F2ZSBpbiB1c2VyXG5cdFx0XHRcdHJldHVybiBMaXZlY2hhdFZpc2l0b3JzLnVwZGF0ZUxpdmVjaGF0RGF0YUJ5VG9rZW4odG9rZW4sIGtleSwgdmFsdWUsIG92ZXJ3cml0ZSk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRydWU7XG5cdH1cbn0pO1xuIiwiTWV0ZW9yLm1ldGhvZHMoe1xuXHQnbGl2ZWNoYXQ6c2V0RGVwYXJ0bWVudEZvclZpc2l0b3InKHsgdG9rZW4sIGRlcGFydG1lbnQgfSA9IHt9KSB7XG5cdFx0Um9ja2V0Q2hhdC5MaXZlY2hhdC5zZXREZXBhcnRtZW50Rm9yR3Vlc3QuY2FsbCh0aGlzLCB7XG5cdFx0XHR0b2tlbixcblx0XHRcdGRlcGFydG1lbnRcblx0XHR9KTtcblxuXHRcdC8vIHVwZGF0ZSB2aXNpdGVkIHBhZ2UgaGlzdG9yeSB0byBub3QgZXhwaXJlXG5cdFx0Um9ja2V0Q2hhdC5tb2RlbHMuTGl2ZWNoYXRQYWdlVmlzaXRlZC5rZWVwSGlzdG9yeUZvclRva2VuKHRva2VuKTtcblxuXHRcdHJldHVybiB0cnVlO1xuXHR9XG59KTtcbiIsIi8qIGVzbGludCBuZXctY2FwOiBbMiwge1wiY2FwSXNOZXdFeGNlcHRpb25zXCI6IFtcIk1ENVwiXX1dICovXG5NZXRlb3IubWV0aG9kcyh7XG5cdCdsaXZlY2hhdDpzdGFydFZpZGVvQ2FsbCcocm9vbUlkKSB7XG5cdFx0aWYgKCFNZXRlb3IudXNlcklkKCkpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLW5vdC1hdXRob3JpemVkJywgJ05vdCBhdXRob3JpemVkJywgeyBtZXRob2Q6ICdsaXZlY2hhdDpjbG9zZUJ5VmlzaXRvcicgfSk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgZ3Vlc3QgPSBNZXRlb3IudXNlcigpO1xuXG5cdFx0Y29uc3QgbWVzc2FnZSA9IHtcblx0XHRcdF9pZDogUmFuZG9tLmlkKCksXG5cdFx0XHRyaWQ6IHJvb21JZCB8fCBSYW5kb20uaWQoKSxcblx0XHRcdG1zZzogJycsXG5cdFx0XHR0czogbmV3IERhdGUoKVxuXHRcdH07XG5cblx0XHRjb25zdCB7IHJvb20gfSA9IFJvY2tldENoYXQuTGl2ZWNoYXQuZ2V0Um9vbShndWVzdCwgbWVzc2FnZSwgeyBqaXRzaVRpbWVvdXQ6IG5ldyBEYXRlKERhdGUubm93KCkgKyAzNjAwICogMTAwMCkgfSk7XG5cdFx0bWVzc2FnZS5yaWQgPSByb29tLl9pZDtcblxuXHRcdFJvY2tldENoYXQubW9kZWxzLk1lc3NhZ2VzLmNyZWF0ZVdpdGhUeXBlUm9vbUlkTWVzc2FnZUFuZFVzZXIoJ2xpdmVjaGF0X3ZpZGVvX2NhbGwnLCByb29tLl9pZCwgJycsIGd1ZXN0LCB7XG5cdFx0XHRhY3Rpb25MaW5rczogW1xuXHRcdFx0XHR7IGljb246ICdpY29uLXZpZGVvY2FtJywgaTE4bkxhYmVsOiAnQWNjZXB0JywgbWV0aG9kX2lkOiAnY3JlYXRlTGl2ZWNoYXRDYWxsJywgcGFyYW1zOiAnJyB9LFxuXHRcdFx0XHR7IGljb246ICdpY29uLWNhbmNlbCcsIGkxOG5MYWJlbDogJ0RlY2xpbmUnLCBtZXRob2RfaWQ6ICdkZW55TGl2ZWNoYXRDYWxsJywgcGFyYW1zOiAnJyB9XG5cdFx0XHRdXG5cdFx0fSk7XG5cblx0XHRyZXR1cm4ge1xuXHRcdFx0cm9vbUlkOiByb29tLl9pZCxcblx0XHRcdGRvbWFpbjogUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0ppdHNpX0RvbWFpbicpLFxuXHRcdFx0aml0c2lSb29tOiBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnSml0c2lfVVJMX1Jvb21fUHJlZml4JykgKyBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgndW5pcXVlSUQnKSArIHJvb21JZFxuXHRcdH07XG5cdH1cbn0pO1xuXG4iLCIvKiBlc2xpbnQgbmV3LWNhcDogWzIsIHtcImNhcElzTmV3RXhjZXB0aW9uc1wiOiBbXCJNYXRjaC5PcHRpb25hbFwiXX1dICovXG5cbmltcG9ydCBMaXZlY2hhdFZpc2l0b3JzIGZyb20gJy4uL21vZGVscy9MaXZlY2hhdFZpc2l0b3JzJztcblxuTWV0ZW9yLm1ldGhvZHMoe1xuXHQnbGl2ZWNoYXQ6dHJhbnNmZXInKHRyYW5zZmVyRGF0YSkge1xuXHRcdGlmICghTWV0ZW9yLnVzZXJJZCgpIHx8ICFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24oTWV0ZW9yLnVzZXJJZCgpLCAndmlldy1sLXJvb20nKSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3Itbm90LWFsbG93ZWQnLCAnTm90IGFsbG93ZWQnLCB7IG1ldGhvZDogJ2xpdmVjaGF0OnRyYW5zZmVyJyB9KTtcblx0XHR9XG5cblx0XHRjaGVjayh0cmFuc2ZlckRhdGEsIHtcblx0XHRcdHJvb21JZDogU3RyaW5nLFxuXHRcdFx0dXNlcklkOiBNYXRjaC5PcHRpb25hbChTdHJpbmcpLFxuXHRcdFx0ZGVwYXJ0bWVudElkOiBNYXRjaC5PcHRpb25hbChTdHJpbmcpXG5cdFx0fSk7XG5cblx0XHRjb25zdCByb29tID0gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9uZUJ5SWQodHJhbnNmZXJEYXRhLnJvb21JZCk7XG5cblx0XHRjb25zdCBndWVzdCA9IExpdmVjaGF0VmlzaXRvcnMuZmluZE9uZUJ5SWQocm9vbS52Ll9pZCk7XG5cblx0XHRjb25zdCB1c2VyID0gTWV0ZW9yLnVzZXIoKTtcblxuXHRcdGlmIChyb29tLnVzZXJuYW1lcy5pbmRleE9mKHVzZXIudXNlcm5hbWUpID09PSAtMSAmJiAhUm9ja2V0Q2hhdC5hdXRoei5oYXNSb2xlKE1ldGVvci51c2VySWQoKSwgJ2xpdmVjaGF0LW1hbmFnZXInKSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3Itbm90LWF1dGhvcml6ZWQnLCAnTm90IGF1dGhvcml6ZWQnLCB7IG1ldGhvZDogJ2xpdmVjaGF0OnRyYW5zZmVyJyB9KTtcblx0XHR9XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5MaXZlY2hhdC50cmFuc2Zlcihyb29tLCBndWVzdCwgdHJhbnNmZXJEYXRhKTtcblx0fVxufSk7XG4iLCIvKiBnbG9iYWxzIEhUVFAgKi9cbmNvbnN0IHBvc3RDYXRjaEVycm9yID0gTWV0ZW9yLndyYXBBc3luYyhmdW5jdGlvbih1cmwsIG9wdGlvbnMsIHJlc29sdmUpIHtcblx0SFRUUC5wb3N0KHVybCwgb3B0aW9ucywgZnVuY3Rpb24oZXJyLCByZXMpIHtcblx0XHRpZiAoZXJyKSB7XG5cdFx0XHRyZXNvbHZlKG51bGwsIGVyci5yZXNwb25zZSk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHJlc29sdmUobnVsbCwgcmVzKTtcblx0XHR9XG5cdH0pO1xufSk7XG5cbk1ldGVvci5tZXRob2RzKHtcblx0J2xpdmVjaGF0OndlYmhvb2tUZXN0JygpIHtcblx0XHR0aGlzLnVuYmxvY2soKTtcblxuXHRcdGNvbnN0IHNhbXBsZURhdGEgPSB7XG5cdFx0XHR0eXBlOiAnTGl2ZWNoYXRTZXNzaW9uJyxcblx0XHRcdF9pZDogJ2Zhc2Q2ZjVhNHNkNmY4YTRzZGYnLFxuXHRcdFx0bGFiZWw6ICd0aXRsZScsXG5cdFx0XHR0b3BpYzogJ2FzaW9kb2pmJyxcblx0XHRcdGNvZGU6IDEyMzEyMyxcblx0XHRcdGNyZWF0ZWRBdDogbmV3IERhdGUoKSxcblx0XHRcdGxhc3RNZXNzYWdlQXQ6IG5ldyBEYXRlKCksXG5cdFx0XHR0YWdzOiBbXG5cdFx0XHRcdCd0YWcxJyxcblx0XHRcdFx0J3RhZzInLFxuXHRcdFx0XHQndGFnMydcblx0XHRcdF0sXG5cdFx0XHRjdXN0b21GaWVsZHM6IHtcblx0XHRcdFx0cHJvZHVjdElkOiAnMTIzNDU2J1xuXHRcdFx0fSxcblx0XHRcdHZpc2l0b3I6IHtcblx0XHRcdFx0X2lkOiAnJyxcblx0XHRcdFx0bmFtZTogJ3Zpc2l0b3IgbmFtZScsXG5cdFx0XHRcdHVzZXJuYW1lOiAndmlzaXRvci11c2VybmFtZScsXG5cdFx0XHRcdGRlcGFydG1lbnQ6ICdkZXBhcnRtZW50Jyxcblx0XHRcdFx0ZW1haWw6ICdlbWFpbEBhZGRyZXNzLmNvbScsXG5cdFx0XHRcdHBob25lOiAnMTkyODczMTkyODczJyxcblx0XHRcdFx0aXA6ICcxMjMuNDU2LjcuODknLFxuXHRcdFx0XHRicm93c2VyOiAnQ2hyb21lJyxcblx0XHRcdFx0b3M6ICdMaW51eCcsXG5cdFx0XHRcdGN1c3RvbUZpZWxkczoge1xuXHRcdFx0XHRcdGN1c3RvbWVySWQ6ICcxMjM0NTYnXG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cdFx0XHRhZ2VudDoge1xuXHRcdFx0XHRfaWQ6ICdhc2RmODlhczZkZjgnLFxuXHRcdFx0XHR1c2VybmFtZTogJ2FnZW50LnVzZXJuYW1lJyxcblx0XHRcdFx0bmFtZTogJ0FnZW50IE5hbWUnLFxuXHRcdFx0XHRlbWFpbDogJ2FnZW50QGVtYWlsLmNvbSdcblx0XHRcdH0sXG5cdFx0XHRtZXNzYWdlczogW3tcblx0XHRcdFx0dXNlcm5hbWU6ICd2aXNpdG9yLXVzZXJuYW1lJyxcblx0XHRcdFx0bXNnOiAnbWVzc2FnZSBjb250ZW50Jyxcblx0XHRcdFx0dHM6IG5ldyBEYXRlKClcblx0XHRcdH0sIHtcblx0XHRcdFx0dXNlcm5hbWU6ICdhZ2VudC51c2VybmFtZScsXG5cdFx0XHRcdGFnZW50SWQ6ICdhc2RmODlhczZkZjgnLFxuXHRcdFx0XHRtc2c6ICdtZXNzYWdlIGNvbnRlbnQgZnJvbSBhZ2VudCcsXG5cdFx0XHRcdHRzOiBuZXcgRGF0ZSgpXG5cdFx0XHR9XVxuXHRcdH07XG5cblx0XHRjb25zdCBvcHRpb25zID0ge1xuXHRcdFx0aGVhZGVyczoge1xuXHRcdFx0XHQnWC1Sb2NrZXRDaGF0LUxpdmVjaGF0LVRva2VuJzogUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0xpdmVjaGF0X3NlY3JldF90b2tlbicpXG5cdFx0XHR9LFxuXHRcdFx0ZGF0YTogc2FtcGxlRGF0YVxuXHRcdH07XG5cblx0XHRjb25zdCByZXNwb25zZSA9IHBvc3RDYXRjaEVycm9yKFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdMaXZlY2hhdF93ZWJob29rVXJsJyksIG9wdGlvbnMpO1xuXG5cdFx0Y29uc29sZS5sb2coJ3Jlc3BvbnNlIC0+JywgcmVzcG9uc2UpO1xuXG5cdFx0aWYgKHJlc3BvbnNlICYmIHJlc3BvbnNlLnN0YXR1c0NvZGUgJiYgcmVzcG9uc2Uuc3RhdHVzQ29kZSA9PT0gMjAwKSB7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItaW52YWxpZC13ZWJob29rLXJlc3BvbnNlJyk7XG5cdFx0fVxuXHR9XG59KTtcblxuIiwiTWV0ZW9yLm1ldGhvZHMoe1xuXHQnbGl2ZWNoYXQ6dGFrZUlucXVpcnknKGlucXVpcnlJZCkge1xuXHRcdGlmICghTWV0ZW9yLnVzZXJJZCgpIHx8ICFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24oTWV0ZW9yLnVzZXJJZCgpLCAndmlldy1sLXJvb20nKSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3Itbm90LWFsbG93ZWQnLCAnTm90IGFsbG93ZWQnLCB7IG1ldGhvZDogJ2xpdmVjaGF0OnRha2VJbnF1aXJ5JyB9KTtcblx0XHR9XG5cblx0XHRjb25zdCBpbnF1aXJ5ID0gUm9ja2V0Q2hhdC5tb2RlbHMuTGl2ZWNoYXRJbnF1aXJ5LmZpbmRPbmVCeUlkKGlucXVpcnlJZCk7XG5cblx0XHRpZiAoIWlucXVpcnkgfHwgaW5xdWlyeS5zdGF0dXMgPT09ICd0YWtlbicpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLW5vdC1hbGxvd2VkJywgJ0lucXVpcnkgYWxyZWFkeSB0YWtlbicsIHsgbWV0aG9kOiAnbGl2ZWNoYXQ6dGFrZUlucXVpcnknIH0pO1xuXHRcdH1cblxuXHRcdGNvbnN0IHVzZXIgPSBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kT25lQnlJZChNZXRlb3IudXNlcklkKCkpO1xuXG5cdFx0Y29uc3QgYWdlbnQgPSB7XG5cdFx0XHRhZ2VudElkOiB1c2VyLl9pZCxcblx0XHRcdHVzZXJuYW1lOiB1c2VyLnVzZXJuYW1lXG5cdFx0fTtcblxuXHRcdC8vIGFkZCBzdWJzY3JpcHRpb25cblx0XHRjb25zdCBzdWJzY3JpcHRpb25EYXRhID0ge1xuXHRcdFx0cmlkOiBpbnF1aXJ5LnJpZCxcblx0XHRcdG5hbWU6IGlucXVpcnkubmFtZSxcblx0XHRcdGFsZXJ0OiB0cnVlLFxuXHRcdFx0b3BlbjogdHJ1ZSxcblx0XHRcdHVucmVhZDogMSxcblx0XHRcdHVzZXJNZW50aW9uczogMSxcblx0XHRcdGdyb3VwTWVudGlvbnM6IDAsXG5cdFx0XHRjb2RlOiBpbnF1aXJ5LmNvZGUsXG5cdFx0XHR1OiB7XG5cdFx0XHRcdF9pZDogYWdlbnQuYWdlbnRJZCxcblx0XHRcdFx0dXNlcm5hbWU6IGFnZW50LnVzZXJuYW1lXG5cdFx0XHR9LFxuXHRcdFx0dDogJ2wnLFxuXHRcdFx0ZGVza3RvcE5vdGlmaWNhdGlvbnM6ICdhbGwnLFxuXHRcdFx0bW9iaWxlUHVzaE5vdGlmaWNhdGlvbnM6ICdhbGwnLFxuXHRcdFx0ZW1haWxOb3RpZmljYXRpb25zOiAnYWxsJ1xuXHRcdH07XG5cdFx0Um9ja2V0Q2hhdC5tb2RlbHMuU3Vic2NyaXB0aW9ucy5pbnNlcnQoc3Vic2NyaXB0aW9uRGF0YSk7XG5cblx0XHQvLyB1cGRhdGUgcm9vbVxuXHRcdGNvbnN0IHJvb20gPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT25lQnlJZChpbnF1aXJ5LnJpZCk7XG5cblx0XHRSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5jaGFuZ2VBZ2VudEJ5Um9vbUlkKGlucXVpcnkucmlkLCBhZ2VudCk7XG5cblx0XHRyb29tLnNlcnZlZEJ5ID0ge1xuXHRcdFx0X2lkOiBhZ2VudC5hZ2VudElkLFxuXHRcdFx0dXNlcm5hbWU6IGFnZW50LnVzZXJuYW1lXG5cdFx0fTtcblxuXHRcdC8vIG1hcmsgaW5xdWlyeSBhcyB0YWtlblxuXHRcdFJvY2tldENoYXQubW9kZWxzLkxpdmVjaGF0SW5xdWlyeS50YWtlSW5xdWlyeShpbnF1aXJ5Ll9pZCk7XG5cblx0XHQvLyByZW1vdmUgc2VuZGluZyBtZXNzYWdlIGZyb20gZ3Vlc3Qgd2lkZ2V0XG5cdFx0Ly8gZG9udCBjaGVjayBpZiBzZXR0aW5nIGlzIHRydWUsIGJlY2F1c2UgaWYgc2V0dGluZ3dhcyBzd2l0Y2hlZCBvZmYgaW5iZXR3ZWVuICBndWVzdCBlbnRlcmVkIHBvb2wsXG5cdFx0Ly8gYW5kIGlucXVpcnkgYmVpbmcgdGFrZW4sIG1lc3NhZ2Ugd291bGQgbm90IGJlIHN3aXRjaGVkIG9mZi5cblx0XHRSb2NrZXRDaGF0Lm1vZGVscy5NZXNzYWdlcy5jcmVhdGVDb21tYW5kV2l0aFJvb21JZEFuZFVzZXIoJ2Nvbm5lY3RlZCcsIHJvb20uX2lkLCB1c2VyKTtcblxuXHRcdFJvY2tldENoYXQuTGl2ZWNoYXQuc3RyZWFtLmVtaXQocm9vbS5faWQsIHtcblx0XHRcdHR5cGU6ICdhZ2VudERhdGEnLFxuXHRcdFx0ZGF0YTogUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZ2V0QWdlbnRJbmZvKGFnZW50LmFnZW50SWQpXG5cdFx0fSk7XG5cblx0XHQvLyByZXR1cm4gcm9vbSBjb3JyZXNwb25kaW5nIHRvIGlucXVpcnkgKGZvciByZWRpcmVjdGluZyBhZ2VudCB0byB0aGUgcm9vbSByb3V0ZSlcblx0XHRyZXR1cm4gcm9vbTtcblx0fVxufSk7XG4iLCJNZXRlb3IubWV0aG9kcyh7XG5cdCdsaXZlY2hhdDpyZXR1cm5Bc0lucXVpcnknKHJpZCkge1xuXHRcdGlmICghTWV0ZW9yLnVzZXJJZCgpIHx8ICFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24oTWV0ZW9yLnVzZXJJZCgpLCAndmlldy1sLXJvb20nKSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3Itbm90LWFsbG93ZWQnLCAnTm90IGFsbG93ZWQnLCB7IG1ldGhvZDogJ2xpdmVjaGF0OnNhdmVEZXBhcnRtZW50JyB9KTtcblx0XHR9XG5cblx0XHQvLyAvL2RlbGV0ZSBhZ2VudCBhbmQgcm9vbSBzdWJzY3JpcHRpb25cblx0XHRSb2NrZXRDaGF0Lm1vZGVscy5TdWJzY3JpcHRpb25zLnJlbW92ZUJ5Um9vbUlkKHJpZCk7XG5cblx0XHQvLyByZW1vdmUgdXNlciBmcm9tIHJvb21cblx0XHRjb25zdCB1c2VybmFtZSA9IE1ldGVvci51c2VyKCkudXNlcm5hbWU7XG5cblx0XHRSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5yZW1vdmVVc2VybmFtZUJ5SWQocmlkLCB1c2VybmFtZSk7XG5cblx0XHQvLyBmaW5kIGlucXVpcnkgY29ycmVzcG9uZGluZyB0byByb29tXG5cdFx0Y29uc3QgaW5xdWlyeSA9IFJvY2tldENoYXQubW9kZWxzLkxpdmVjaGF0SW5xdWlyeS5maW5kT25lKHtyaWR9KTtcblxuXHRcdC8vIG1hcmsgaW5xdWlyeSBhcyBvcGVuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQubW9kZWxzLkxpdmVjaGF0SW5xdWlyeS5vcGVuSW5xdWlyeShpbnF1aXJ5Ll9pZCk7XG5cdH1cbn0pO1xuIiwiTWV0ZW9yLm1ldGhvZHMoe1xuXHQnbGl2ZWNoYXQ6c2F2ZU9mZmljZUhvdXJzJyhkYXksIHN0YXJ0LCBmaW5pc2gsIG9wZW4pIHtcblx0XHRSb2NrZXRDaGF0Lm1vZGVscy5MaXZlY2hhdE9mZmljZUhvdXIudXBkYXRlSG91cnMoZGF5LCBzdGFydCwgZmluaXNoLCBvcGVuKTtcblx0fVxufSk7XG4iLCIvKiBnbG9iYWxzIGVtYWlsU2V0dGluZ3MsIEREUFJhdGVMaW1pdGVyICovXG4vKiBTZW5kIGEgdHJhbnNjcmlwdCBvZiB0aGUgcm9vbSBjb252ZXJzdGF0aW9uIHRvIHRoZSBnaXZlbiBlbWFpbCAqL1xuaW1wb3J0IG1vbWVudCBmcm9tICdtb21lbnQnO1xuXG5pbXBvcnQgTGl2ZWNoYXRWaXNpdG9ycyBmcm9tICcuLi9tb2RlbHMvTGl2ZWNoYXRWaXNpdG9ycyc7XG5cbk1ldGVvci5tZXRob2RzKHtcblx0J2xpdmVjaGF0OnNlbmRUcmFuc2NyaXB0Jyh0b2tlbiwgcmlkLCBlbWFpbCkge1xuXHRcdGNoZWNrKHJpZCwgU3RyaW5nKTtcblx0XHRjaGVjayhlbWFpbCwgU3RyaW5nKTtcblxuXHRcdGNvbnN0IHJvb20gPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT25lQnlJZChyaWQpO1xuXG5cdFx0Y29uc3QgdmlzaXRvciA9IExpdmVjaGF0VmlzaXRvcnMuZ2V0VmlzaXRvckJ5VG9rZW4odG9rZW4pO1xuXHRcdGNvbnN0IHVzZXJMYW5ndWFnZSA9ICh2aXNpdG9yICYmIHZpc2l0b3IubGFuZ3VhZ2UpIHx8IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdsYW5ndWFnZScpIHx8ICdlbic7XG5cblx0XHQvLyBhbGxvdyB0byBvbmx5IHVzZXIgdG8gc2VuZCB0cmFuc2NyaXB0cyBmcm9tIHRoZWlyIG93biBjaGF0c1xuXHRcdGlmICghcm9vbSB8fCByb29tLnQgIT09ICdsJyB8fCAhcm9vbS52IHx8IHJvb20udi50b2tlbiAhPT0gdG9rZW4pIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWludmFsaWQtcm9vbScsICdJbnZhbGlkIHJvb20nKTtcblx0XHR9XG5cblx0XHRjb25zdCBtZXNzYWdlcyA9IFJvY2tldENoYXQubW9kZWxzLk1lc3NhZ2VzLmZpbmRWaXNpYmxlQnlSb29tSWQocmlkLCB7IHNvcnQ6IHsgJ3RzJyA6IDEgfX0pO1xuXHRcdGNvbnN0IGhlYWRlciA9IFJvY2tldENoYXQucGxhY2Vob2xkZXJzLnJlcGxhY2UoUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0VtYWlsX0hlYWRlcicpIHx8ICcnKTtcblx0XHRjb25zdCBmb290ZXIgPSBSb2NrZXRDaGF0LnBsYWNlaG9sZGVycy5yZXBsYWNlKFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdFbWFpbF9Gb290ZXInKSB8fCAnJyk7XG5cblx0XHRsZXQgaHRtbCA9ICc8ZGl2PiA8aHI+Jztcblx0XHRtZXNzYWdlcy5mb3JFYWNoKG1lc3NhZ2UgPT4ge1xuXHRcdFx0aWYgKG1lc3NhZ2UudCAmJiBbJ2NvbW1hbmQnLCAnbGl2ZWNoYXQtY2xvc2UnLCAnbGl2ZWNoYXRfdmlkZW9fY2FsbCddLmluZGV4T2YobWVzc2FnZS50KSAhPT0gLTEpIHtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHRsZXQgYXV0aG9yO1xuXHRcdFx0aWYgKG1lc3NhZ2UudS5faWQgPT09IHZpc2l0b3IuX2lkKSB7XG5cdFx0XHRcdGF1dGhvciA9IFRBUGkxOG4uX18oJ1lvdScsIHsgbG5nOiB1c2VyTGFuZ3VhZ2UgfSk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRhdXRob3IgPSBtZXNzYWdlLnUudXNlcm5hbWU7XG5cdFx0XHR9XG5cblx0XHRcdGNvbnN0IGRhdGV0aW1lID0gbW9tZW50KG1lc3NhZ2UudHMpLmxvY2FsZSh1c2VyTGFuZ3VhZ2UpLmZvcm1hdCgnTExMJyk7XG5cdFx0XHRjb25zdCBzaW5nbGVNZXNzYWdlID0gYFxuXHRcdFx0XHQ8cD48c3Ryb25nPiR7IGF1dGhvciB9PC9zdHJvbmc+ICA8ZW0+JHsgZGF0ZXRpbWUgfTwvZW0+PC9wPlxuXHRcdFx0XHQ8cD4keyBtZXNzYWdlLm1zZyB9PC9wPlxuXHRcdFx0YDtcblx0XHRcdGh0bWwgPSBodG1sICsgc2luZ2xlTWVzc2FnZTtcblx0XHR9KTtcblxuXHRcdGh0bWwgPSBgJHsgaHRtbCB9PC9kaXY+YDtcblxuXHRcdGxldCBmcm9tRW1haWwgPSBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnRnJvbV9FbWFpbCcpLm1hdGNoKC9cXGJbQS1aMC05Ll8lKy1dK0AoPzpbQS1aMC05LV0rXFwuKStbQS1aXXsyLDR9XFxiL2kpO1xuXG5cdFx0aWYgKGZyb21FbWFpbCkge1xuXHRcdFx0ZnJvbUVtYWlsID0gZnJvbUVtYWlsWzBdO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRmcm9tRW1haWwgPSBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnRnJvbV9FbWFpbCcpO1xuXHRcdH1cblxuXHRcdGVtYWlsU2V0dGluZ3MgPSB7XG5cdFx0XHR0bzogZW1haWwsXG5cdFx0XHRmcm9tOiBmcm9tRW1haWwsXG5cdFx0XHRyZXBseVRvOiBmcm9tRW1haWwsXG5cdFx0XHRzdWJqZWN0OiBUQVBpMThuLl9fKCdUcmFuc2NyaXB0X29mX3lvdXJfbGl2ZWNoYXRfY29udmVyc2F0aW9uJywgeyBsbmc6IHVzZXJMYW5ndWFnZSB9KSxcblx0XHRcdGh0bWw6IGhlYWRlciArIGh0bWwgKyBmb290ZXJcblx0XHR9O1xuXG5cdFx0TWV0ZW9yLmRlZmVyKCgpID0+IHtcblx0XHRcdEVtYWlsLnNlbmQoZW1haWxTZXR0aW5ncyk7XG5cdFx0fSk7XG5cblx0XHRNZXRlb3IuZGVmZXIoKCkgPT4ge1xuXHRcdFx0Um9ja2V0Q2hhdC5jYWxsYmFja3MucnVuKCdsaXZlY2hhdC5zZW5kVHJhbnNjcmlwdCcsIG1lc3NhZ2VzLCBlbWFpbCk7XG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gdHJ1ZTtcblx0fVxufSk7XG5cbkREUFJhdGVMaW1pdGVyLmFkZFJ1bGUoe1xuXHR0eXBlOiAnbWV0aG9kJyxcblx0bmFtZTogJ2xpdmVjaGF0OnNlbmRUcmFuc2NyaXB0Jyxcblx0Y29ubmVjdGlvbklkKCkge1xuXHRcdHJldHVybiB0cnVlO1xuXHR9XG59LCAxLCA1MDAwKTtcbiIsIi8qKlxuICogU2V0cyBhbiB1c2VyIGFzIChub24pb3BlcmF0b3JcbiAqIEBwYXJhbSB7c3RyaW5nfSBfaWQgLSBVc2VyJ3MgX2lkXG4gKiBAcGFyYW0ge2Jvb2xlYW59IG9wZXJhdG9yIC0gRmxhZyB0byBzZXQgYXMgb3BlcmF0b3Igb3Igbm90XG4gKi9cblJvY2tldENoYXQubW9kZWxzLlVzZXJzLnNldE9wZXJhdG9yID0gZnVuY3Rpb24oX2lkLCBvcGVyYXRvcikge1xuXHRjb25zdCB1cGRhdGUgPSB7XG5cdFx0JHNldDoge1xuXHRcdFx0b3BlcmF0b3Jcblx0XHR9XG5cdH07XG5cblx0cmV0dXJuIHRoaXMudXBkYXRlKF9pZCwgdXBkYXRlKTtcbn07XG5cbi8qKlxuICogR2V0cyBhbGwgb25saW5lIGFnZW50c1xuICogQHJldHVyblxuICovXG5Sb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kT25saW5lQWdlbnRzID0gZnVuY3Rpb24oKSB7XG5cdGNvbnN0IHF1ZXJ5ID0ge1xuXHRcdHN0YXR1czoge1xuXHRcdFx0JGV4aXN0czogdHJ1ZSxcblx0XHRcdCRuZTogJ29mZmxpbmUnXG5cdFx0fSxcblx0XHRzdGF0dXNMaXZlY2hhdDogJ2F2YWlsYWJsZScsXG5cdFx0cm9sZXM6ICdsaXZlY2hhdC1hZ2VudCdcblx0fTtcblxuXHRyZXR1cm4gdGhpcy5maW5kKHF1ZXJ5KTtcbn07XG5cbi8qKlxuICogRmluZCBhbiBvbmxpbmUgYWdlbnQgYnkgaGlzIHVzZXJuYW1lXG4gKiBAcmV0dXJuXG4gKi9cblJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmVPbmxpbmVBZ2VudEJ5VXNlcm5hbWUgPSBmdW5jdGlvbih1c2VybmFtZSkge1xuXHRjb25zdCBxdWVyeSA9IHtcblx0XHR1c2VybmFtZSxcblx0XHRzdGF0dXM6IHtcblx0XHRcdCRleGlzdHM6IHRydWUsXG5cdFx0XHQkbmU6ICdvZmZsaW5lJ1xuXHRcdH0sXG5cdFx0c3RhdHVzTGl2ZWNoYXQ6ICdhdmFpbGFibGUnLFxuXHRcdHJvbGVzOiAnbGl2ZWNoYXQtYWdlbnQnXG5cdH07XG5cblx0cmV0dXJuIHRoaXMuZmluZE9uZShxdWVyeSk7XG59O1xuXG4vKipcbiAqIEdldHMgYWxsIGFnZW50c1xuICogQHJldHVyblxuICovXG5Sb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kQWdlbnRzID0gZnVuY3Rpb24oKSB7XG5cdGNvbnN0IHF1ZXJ5ID0ge1xuXHRcdHJvbGVzOiAnbGl2ZWNoYXQtYWdlbnQnXG5cdH07XG5cblx0cmV0dXJuIHRoaXMuZmluZChxdWVyeSk7XG59O1xuXG4vKipcbiAqIEZpbmQgb25saW5lIHVzZXJzIGZyb20gYSBsaXN0XG4gKiBAcGFyYW0ge2FycmF5fSB1c2VyTGlzdCAtIGFycmF5IG9mIHVzZXJuYW1lc1xuICogQHJldHVyblxuICovXG5Sb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kT25saW5lVXNlckZyb21MaXN0ID0gZnVuY3Rpb24odXNlckxpc3QpIHtcblx0Y29uc3QgcXVlcnkgPSB7XG5cdFx0c3RhdHVzOiB7XG5cdFx0XHQkZXhpc3RzOiB0cnVlLFxuXHRcdFx0JG5lOiAnb2ZmbGluZSdcblx0XHR9LFxuXHRcdHN0YXR1c0xpdmVjaGF0OiAnYXZhaWxhYmxlJyxcblx0XHRyb2xlczogJ2xpdmVjaGF0LWFnZW50Jyxcblx0XHR1c2VybmFtZToge1xuXHRcdFx0JGluOiBbXS5jb25jYXQodXNlckxpc3QpXG5cdFx0fVxuXHR9O1xuXG5cdHJldHVybiB0aGlzLmZpbmQocXVlcnkpO1xufTtcblxuLyoqXG4gKiBHZXQgbmV4dCB1c2VyIGFnZW50IGluIG9yZGVyXG4gKiBAcmV0dXJuIHtvYmplY3R9IFVzZXIgZnJvbSBkYlxuICovXG5Sb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5nZXROZXh0QWdlbnQgPSBmdW5jdGlvbigpIHtcblx0Y29uc3QgcXVlcnkgPSB7XG5cdFx0c3RhdHVzOiB7XG5cdFx0XHQkZXhpc3RzOiB0cnVlLFxuXHRcdFx0JG5lOiAnb2ZmbGluZSdcblx0XHR9LFxuXHRcdHN0YXR1c0xpdmVjaGF0OiAnYXZhaWxhYmxlJyxcblx0XHRyb2xlczogJ2xpdmVjaGF0LWFnZW50J1xuXHR9O1xuXG5cdGNvbnN0IGNvbGxlY3Rpb25PYmogPSB0aGlzLm1vZGVsLnJhd0NvbGxlY3Rpb24oKTtcblx0Y29uc3QgZmluZEFuZE1vZGlmeSA9IE1ldGVvci53cmFwQXN5bmMoY29sbGVjdGlvbk9iai5maW5kQW5kTW9kaWZ5LCBjb2xsZWN0aW9uT2JqKTtcblxuXHRjb25zdCBzb3J0ID0ge1xuXHRcdGxpdmVjaGF0Q291bnQ6IDEsXG5cdFx0dXNlcm5hbWU6IDFcblx0fTtcblxuXHRjb25zdCB1cGRhdGUgPSB7XG5cdFx0JGluYzoge1xuXHRcdFx0bGl2ZWNoYXRDb3VudDogMVxuXHRcdH1cblx0fTtcblxuXHRjb25zdCB1c2VyID0gZmluZEFuZE1vZGlmeShxdWVyeSwgc29ydCwgdXBkYXRlKTtcblx0aWYgKHVzZXIgJiYgdXNlci52YWx1ZSkge1xuXHRcdHJldHVybiB7XG5cdFx0XHRhZ2VudElkOiB1c2VyLnZhbHVlLl9pZCxcblx0XHRcdHVzZXJuYW1lOiB1c2VyLnZhbHVlLnVzZXJuYW1lXG5cdFx0fTtcblx0fSBlbHNlIHtcblx0XHRyZXR1cm4gbnVsbDtcblx0fVxufTtcblxuLyoqXG4gKiBDaGFuZ2UgdXNlcidzIGxpdmVjaGF0IHN0YXR1c1xuICogQHBhcmFtIHtzdHJpbmd9IHRva2VuIC0gVmlzaXRvciB0b2tlblxuICovXG5Sb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5zZXRMaXZlY2hhdFN0YXR1cyA9IGZ1bmN0aW9uKHVzZXJJZCwgc3RhdHVzKSB7XG5cdGNvbnN0IHF1ZXJ5ID0ge1xuXHRcdCdfaWQnOiB1c2VySWRcblx0fTtcblxuXHRjb25zdCB1cGRhdGUgPSB7XG5cdFx0JHNldDoge1xuXHRcdFx0J3N0YXR1c0xpdmVjaGF0Jzogc3RhdHVzXG5cdFx0fVxuXHR9O1xuXG5cdHJldHVybiB0aGlzLnVwZGF0ZShxdWVyeSwgdXBkYXRlKTtcbn07XG5cbi8qKlxuICogY2hhbmdlIGFsbCBsaXZlY2hhdCBhZ2VudHMgbGl2ZWNoYXQgc3RhdHVzIHRvIFwibm90LWF2YWlsYWJsZVwiXG4gKi9cblJvY2tldENoYXQubW9kZWxzLlVzZXJzLmNsb3NlT2ZmaWNlID0gZnVuY3Rpb24oKSB7XG5cdHNlbGYgPSB0aGlzO1xuXHRzZWxmLmZpbmRBZ2VudHMoKS5mb3JFYWNoKGZ1bmN0aW9uKGFnZW50KSB7XG5cdFx0c2VsZi5zZXRMaXZlY2hhdFN0YXR1cyhhZ2VudC5faWQsICdub3QtYXZhaWxhYmxlJyk7XG5cdH0pO1xufTtcblxuLyoqXG4gKiBjaGFuZ2UgYWxsIGxpdmVjaGF0IGFnZW50cyBsaXZlY2hhdCBzdGF0dXMgdG8gXCJhdmFpbGFibGVcIlxuICovXG5Sb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5vcGVuT2ZmaWNlID0gZnVuY3Rpb24oKSB7XG5cdHNlbGYgPSB0aGlzO1xuXHRzZWxmLmZpbmRBZ2VudHMoKS5mb3JFYWNoKGZ1bmN0aW9uKGFnZW50KSB7XG5cdFx0c2VsZi5zZXRMaXZlY2hhdFN0YXR1cyhhZ2VudC5faWQsICdhdmFpbGFibGUnKTtcblx0fSk7XG59O1xuXG5Sb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5nZXRBZ2VudEluZm8gPSBmdW5jdGlvbihhZ2VudElkKSB7XG5cdGNvbnN0IHF1ZXJ5ID0ge1xuXHRcdF9pZDogYWdlbnRJZFxuXHR9O1xuXG5cdGNvbnN0IG9wdGlvbnMgPSB7XG5cdFx0ZmllbGRzOiB7XG5cdFx0XHRuYW1lOiAxLFxuXHRcdFx0dXNlcm5hbWU6IDEsXG5cdFx0XHRwaG9uZTogMSxcblx0XHRcdGN1c3RvbUZpZWxkczogMVxuXHRcdH1cblx0fTtcblxuXHRpZiAoUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0xpdmVjaGF0X3Nob3dfYWdlbnRfZW1haWwnKSkge1xuXHRcdG9wdGlvbnMuZmllbGRzLmVtYWlscyA9IDE7XG5cdH1cblxuXHRyZXR1cm4gdGhpcy5maW5kT25lKHF1ZXJ5LCBvcHRpb25zKTtcbn07XG4iLCJpbXBvcnQgXyBmcm9tICd1bmRlcnNjb3JlJztcblxuLyoqXG4gKiBHZXRzIHZpc2l0b3IgYnkgdG9rZW5cbiAqIEBwYXJhbSB7c3RyaW5nfSB0b2tlbiAtIFZpc2l0b3IgdG9rZW5cbiAqL1xuUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMudXBkYXRlU3VydmV5RmVlZGJhY2tCeUlkID0gZnVuY3Rpb24oX2lkLCBzdXJ2ZXlGZWVkYmFjaykge1xuXHRjb25zdCBxdWVyeSA9IHtcblx0XHRfaWRcblx0fTtcblxuXHRjb25zdCB1cGRhdGUgPSB7XG5cdFx0JHNldDoge1xuXHRcdFx0c3VydmV5RmVlZGJhY2tcblx0XHR9XG5cdH07XG5cblx0cmV0dXJuIHRoaXMudXBkYXRlKHF1ZXJ5LCB1cGRhdGUpO1xufTtcblxuUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMudXBkYXRlTGl2ZWNoYXREYXRhQnlUb2tlbiA9IGZ1bmN0aW9uKHRva2VuLCBrZXksIHZhbHVlLCBvdmVyd3JpdGUgPSB0cnVlKSB7XG5cdGNvbnN0IHF1ZXJ5ID0ge1xuXHRcdCd2LnRva2VuJzogdG9rZW4sXG5cdFx0b3BlbjogdHJ1ZVxuXHR9O1xuXG5cdGlmICghb3ZlcndyaXRlKSB7XG5cdFx0Y29uc3Qgcm9vbSA9IHRoaXMuZmluZE9uZShxdWVyeSwgeyBmaWVsZHM6IHsgbGl2ZWNoYXREYXRhOiAxIH0gfSk7XG5cdFx0aWYgKHJvb20ubGl2ZWNoYXREYXRhICYmIHR5cGVvZiByb29tLmxpdmVjaGF0RGF0YVtrZXldICE9PSAndW5kZWZpbmVkJykge1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXHR9XG5cblx0Y29uc3QgdXBkYXRlID0ge1xuXHRcdCRzZXQ6IHtcblx0XHRcdFtgbGl2ZWNoYXREYXRhLiR7IGtleSB9YF06IHZhbHVlXG5cdFx0fVxuXHR9O1xuXG5cdHJldHVybiB0aGlzLnVwZGF0ZShxdWVyeSwgdXBkYXRlKTtcbn07XG5cblJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRMaXZlY2hhdCA9IGZ1bmN0aW9uKGZpbHRlciA9IHt9LCBvZmZzZXQgPSAwLCBsaW1pdCA9IDIwKSB7XG5cdGNvbnN0IHF1ZXJ5ID0gXy5leHRlbmQoZmlsdGVyLCB7XG5cdFx0dDogJ2wnXG5cdH0pO1xuXG5cdHJldHVybiB0aGlzLmZpbmQocXVlcnksIHsgc29ydDogeyB0czogLSAxIH0sIG9mZnNldCwgbGltaXQgfSk7XG59O1xuXG5Sb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kTGl2ZWNoYXRCeUNvZGUgPSBmdW5jdGlvbihjb2RlLCBmaWVsZHMpIHtcblx0Y29kZSA9IHBhcnNlSW50KGNvZGUpO1xuXG5cdGNvbnN0IG9wdGlvbnMgPSB7fTtcblxuXHRpZiAoZmllbGRzKSB7XG5cdFx0b3B0aW9ucy5maWVsZHMgPSBmaWVsZHM7XG5cdH1cblxuXHQvLyBpZiAodGhpcy51c2VDYWNoZSkge1xuXHQvLyBcdHJldHVybiB0aGlzLmNhY2hlLmZpbmRCeUluZGV4KCd0LGNvZGUnLCBbJ2wnLCBjb2RlXSwgb3B0aW9ucykuZmV0Y2goKTtcblx0Ly8gfVxuXG5cdGNvbnN0IHF1ZXJ5ID0ge1xuXHRcdHQ6ICdsJyxcblx0XHRjb2RlXG5cdH07XG5cblx0cmV0dXJuIHRoaXMuZmluZE9uZShxdWVyeSwgb3B0aW9ucyk7XG59O1xuXG4vKipcbiAqIEdldCB0aGUgbmV4dCB2aXNpdG9yIG5hbWVcbiAqIEByZXR1cm4ge3N0cmluZ30gVGhlIG5leHQgdmlzaXRvciBuYW1lXG4gKi9cblJvY2tldENoYXQubW9kZWxzLlJvb21zLmdldE5leHRMaXZlY2hhdFJvb21Db2RlID0gZnVuY3Rpb24oKSB7XG5cdGNvbnN0IHNldHRpbmdzUmF3ID0gUm9ja2V0Q2hhdC5tb2RlbHMuU2V0dGluZ3MubW9kZWwucmF3Q29sbGVjdGlvbigpO1xuXHRjb25zdCBmaW5kQW5kTW9kaWZ5ID0gTWV0ZW9yLndyYXBBc3luYyhzZXR0aW5nc1Jhdy5maW5kQW5kTW9kaWZ5LCBzZXR0aW5nc1Jhdyk7XG5cblx0Y29uc3QgcXVlcnkgPSB7XG5cdFx0X2lkOiAnTGl2ZWNoYXRfUm9vbV9Db3VudCdcblx0fTtcblxuXHRjb25zdCB1cGRhdGUgPSB7XG5cdFx0JGluYzoge1xuXHRcdFx0dmFsdWU6IDFcblx0XHR9XG5cdH07XG5cblx0Y29uc3QgbGl2ZWNoYXRDb3VudCA9IGZpbmRBbmRNb2RpZnkocXVlcnksIG51bGwsIHVwZGF0ZSk7XG5cblx0cmV0dXJuIGxpdmVjaGF0Q291bnQudmFsdWUudmFsdWU7XG59O1xuXG5Sb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT3BlbkJ5VmlzaXRvclRva2VuID0gZnVuY3Rpb24odmlzaXRvclRva2VuLCBvcHRpb25zKSB7XG5cdGNvbnN0IHF1ZXJ5ID0ge1xuXHRcdG9wZW46IHRydWUsXG5cdFx0J3YudG9rZW4nOiB2aXNpdG9yVG9rZW5cblx0fTtcblxuXHRyZXR1cm4gdGhpcy5maW5kKHF1ZXJ5LCBvcHRpb25zKTtcbn07XG5cblJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRCeVZpc2l0b3JUb2tlbiA9IGZ1bmN0aW9uKHZpc2l0b3JUb2tlbikge1xuXHRjb25zdCBxdWVyeSA9IHtcblx0XHQndi50b2tlbic6IHZpc2l0b3JUb2tlblxuXHR9O1xuXG5cdHJldHVybiB0aGlzLmZpbmQocXVlcnkpO1xufTtcblxuUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZEJ5VmlzaXRvcklkID0gZnVuY3Rpb24odmlzaXRvcklkKSB7XG5cdGNvbnN0IHF1ZXJ5ID0ge1xuXHRcdCd2Ll9pZCc6IHZpc2l0b3JJZFxuXHR9O1xuXG5cdHJldHVybiB0aGlzLmZpbmQocXVlcnkpO1xufTtcblxuUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9uZU9wZW5CeVZpc2l0b3JUb2tlbiA9IGZ1bmN0aW9uKHRva2VuLCByb29tSWQpIHtcblx0Y29uc3QgcXVlcnkgPSB7XG5cdFx0X2lkOiByb29tSWQsXG5cdFx0b3BlbjogdHJ1ZSxcblx0XHQndi50b2tlbic6IHRva2VuXG5cdH07XG5cblx0cmV0dXJuIHRoaXMuZmluZE9uZShxdWVyeSk7XG59O1xuXG5Sb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5zZXRSZXNwb25zZUJ5Um9vbUlkID0gZnVuY3Rpb24ocm9vbUlkLCByZXNwb25zZSkge1xuXHRyZXR1cm4gdGhpcy51cGRhdGUoe1xuXHRcdF9pZDogcm9vbUlkXG5cdH0sIHtcblx0XHQkc2V0OiB7XG5cdFx0XHRyZXNwb25zZUJ5OiB7XG5cdFx0XHRcdF9pZDogcmVzcG9uc2UudXNlci5faWQsXG5cdFx0XHRcdHVzZXJuYW1lOiByZXNwb25zZS51c2VyLnVzZXJuYW1lXG5cdFx0XHR9LFxuXHRcdFx0cmVzcG9uc2VEYXRlOiByZXNwb25zZS5yZXNwb25zZURhdGUsXG5cdFx0XHRyZXNwb25zZVRpbWU6IHJlc3BvbnNlLnJlc3BvbnNlVGltZVxuXHRcdH0sXG5cdFx0JHVuc2V0OiB7XG5cdFx0XHR3YWl0aW5nUmVzcG9uc2U6IDFcblx0XHR9XG5cdH0pO1xufTtcblxuUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuY2xvc2VCeVJvb21JZCA9IGZ1bmN0aW9uKHJvb21JZCwgY2xvc2VJbmZvKSB7XG5cdHJldHVybiB0aGlzLnVwZGF0ZSh7XG5cdFx0X2lkOiByb29tSWRcblx0fSwge1xuXHRcdCRzZXQ6IHtcblx0XHRcdGNsb3NlcjogY2xvc2VJbmZvLmNsb3Nlcixcblx0XHRcdGNsb3NlZEJ5OiBjbG9zZUluZm8uY2xvc2VkQnksXG5cdFx0XHRjbG9zZWRBdDogY2xvc2VJbmZvLmNsb3NlZEF0LFxuXHRcdFx0Y2hhdER1cmF0aW9uOiBjbG9zZUluZm8uY2hhdER1cmF0aW9uLFxuXHRcdFx0J3Yuc3RhdHVzJzogJ29mZmxpbmUnXG5cdFx0fSxcblx0XHQkdW5zZXQ6IHtcblx0XHRcdG9wZW46IDFcblx0XHR9XG5cdH0pO1xufTtcblxuUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuc2V0TGFiZWxCeVJvb21JZCA9IGZ1bmN0aW9uKHJvb21JZCwgbGFiZWwpIHtcblx0cmV0dXJuIHRoaXMudXBkYXRlKHsgX2lkOiByb29tSWQgfSwgeyAkc2V0OiB7IGxhYmVsIH0gfSk7XG59O1xuXG5Sb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT3BlbkJ5QWdlbnQgPSBmdW5jdGlvbih1c2VySWQpIHtcblx0Y29uc3QgcXVlcnkgPSB7XG5cdFx0b3BlbjogdHJ1ZSxcblx0XHQnc2VydmVkQnkuX2lkJzogdXNlcklkXG5cdH07XG5cblx0cmV0dXJuIHRoaXMuZmluZChxdWVyeSk7XG59O1xuXG5Sb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5jaGFuZ2VBZ2VudEJ5Um9vbUlkID0gZnVuY3Rpb24ocm9vbUlkLCBuZXdBZ2VudCkge1xuXHRjb25zdCBxdWVyeSA9IHtcblx0XHRfaWQ6IHJvb21JZFxuXHR9O1xuXHRjb25zdCB1cGRhdGUgPSB7XG5cdFx0JHNldDoge1xuXHRcdFx0c2VydmVkQnk6IHtcblx0XHRcdFx0X2lkOiBuZXdBZ2VudC5hZ2VudElkLFxuXHRcdFx0XHR1c2VybmFtZTogbmV3QWdlbnQudXNlcm5hbWVcblx0XHRcdH1cblx0XHR9XG5cdH07XG5cblx0dGhpcy51cGRhdGUocXVlcnksIHVwZGF0ZSk7XG59O1xuXG5Sb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5zYXZlQ1JNRGF0YUJ5Um9vbUlkID0gZnVuY3Rpb24ocm9vbUlkLCBjcm1EYXRhKSB7XG5cdGNvbnN0IHF1ZXJ5ID0ge1xuXHRcdF9pZDogcm9vbUlkXG5cdH07XG5cdGNvbnN0IHVwZGF0ZSA9IHtcblx0XHQkc2V0OiB7XG5cdFx0XHRjcm1EYXRhXG5cdFx0fVxuXHR9O1xuXG5cdHJldHVybiB0aGlzLnVwZGF0ZShxdWVyeSwgdXBkYXRlKTtcbn07XG5cblJvY2tldENoYXQubW9kZWxzLlJvb21zLnVwZGF0ZVZpc2l0b3JTdGF0dXMgPSBmdW5jdGlvbih0b2tlbiwgc3RhdHVzKSB7XG5cdGNvbnN0IHF1ZXJ5ID0ge1xuXHRcdCd2LnRva2VuJzogdG9rZW4sXG5cdFx0b3BlbjogdHJ1ZVxuXHR9O1xuXG5cdGNvbnN0IHVwZGF0ZSA9IHtcblx0XHQkc2V0OiB7XG5cdFx0XHQndi5zdGF0dXMnOiBzdGF0dXNcblx0XHR9XG5cdH07XG5cblx0cmV0dXJuIHRoaXMudXBkYXRlKHF1ZXJ5LCB1cGRhdGUpO1xufTtcbiIsImNsYXNzIExpdmVjaGF0RXh0ZXJuYWxNZXNzYWdlIGV4dGVuZHMgUm9ja2V0Q2hhdC5tb2RlbHMuX0Jhc2Uge1xuXHRjb25zdHJ1Y3RvcigpIHtcblx0XHRzdXBlcignbGl2ZWNoYXRfZXh0ZXJuYWxfbWVzc2FnZScpO1xuXG5cdFx0aWYgKE1ldGVvci5pc0NsaWVudCkge1xuXHRcdFx0dGhpcy5faW5pdE1vZGVsKCdsaXZlY2hhdF9leHRlcm5hbF9tZXNzYWdlJyk7XG5cdFx0fVxuXHR9XG5cblx0Ly8gRklORFxuXHRmaW5kQnlSb29tSWQocm9vbUlkLCBzb3J0ID0geyB0czogLTEgfSkge1xuXHRcdGNvbnN0IHF1ZXJ5ID0geyByaWQ6IHJvb21JZCB9O1xuXG5cdFx0cmV0dXJuIHRoaXMuZmluZChxdWVyeSwgeyBzb3J0IH0pO1xuXHR9XG59XG5cblJvY2tldENoYXQubW9kZWxzLkxpdmVjaGF0RXh0ZXJuYWxNZXNzYWdlID0gbmV3IExpdmVjaGF0RXh0ZXJuYWxNZXNzYWdlKCk7XG4iLCJpbXBvcnQgXyBmcm9tICd1bmRlcnNjb3JlJztcblxuLyoqXG4gKiBMaXZlY2hhdCBDdXN0b20gRmllbGRzIG1vZGVsXG4gKi9cbmNsYXNzIExpdmVjaGF0Q3VzdG9tRmllbGQgZXh0ZW5kcyBSb2NrZXRDaGF0Lm1vZGVscy5fQmFzZSB7XG5cdGNvbnN0cnVjdG9yKCkge1xuXHRcdHN1cGVyKCdsaXZlY2hhdF9jdXN0b21fZmllbGQnKTtcblx0fVxuXG5cdC8vIEZJTkRcblx0ZmluZE9uZUJ5SWQoX2lkLCBvcHRpb25zKSB7XG5cdFx0Y29uc3QgcXVlcnkgPSB7IF9pZCB9O1xuXG5cdFx0cmV0dXJuIHRoaXMuZmluZE9uZShxdWVyeSwgb3B0aW9ucyk7XG5cdH1cblxuXHRjcmVhdGVPclVwZGF0ZUN1c3RvbUZpZWxkKF9pZCwgZmllbGQsIGxhYmVsLCBzY29wZSwgdmlzaWJpbGl0eSwgZXh0cmFEYXRhKSB7XG5cdFx0Y29uc3QgcmVjb3JkID0ge1xuXHRcdFx0bGFiZWwsXG5cdFx0XHRzY29wZSxcblx0XHRcdHZpc2liaWxpdHlcblx0XHR9O1xuXG5cdFx0Xy5leHRlbmQocmVjb3JkLCBleHRyYURhdGEpO1xuXG5cdFx0aWYgKF9pZCkge1xuXHRcdFx0dGhpcy51cGRhdGUoeyBfaWQgfSwgeyAkc2V0OiByZWNvcmQgfSk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHJlY29yZC5faWQgPSBmaWVsZDtcblx0XHRcdF9pZCA9IHRoaXMuaW5zZXJ0KHJlY29yZCk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHJlY29yZDtcblx0fVxuXG5cdC8vIFJFTU9WRVxuXHRyZW1vdmVCeUlkKF9pZCkge1xuXHRcdGNvbnN0IHF1ZXJ5ID0geyBfaWQgfTtcblxuXHRcdHJldHVybiB0aGlzLnJlbW92ZShxdWVyeSk7XG5cdH1cbn1cblxuUm9ja2V0Q2hhdC5tb2RlbHMuTGl2ZWNoYXRDdXN0b21GaWVsZCA9IG5ldyBMaXZlY2hhdEN1c3RvbUZpZWxkKCk7XG4iLCJpbXBvcnQgXyBmcm9tICd1bmRlcnNjb3JlJztcblxuLyoqXG4gKiBMaXZlY2hhdCBEZXBhcnRtZW50IG1vZGVsXG4gKi9cbmNsYXNzIExpdmVjaGF0RGVwYXJ0bWVudCBleHRlbmRzIFJvY2tldENoYXQubW9kZWxzLl9CYXNlIHtcblx0Y29uc3RydWN0b3IoKSB7XG5cdFx0c3VwZXIoJ2xpdmVjaGF0X2RlcGFydG1lbnQnKTtcblxuXHRcdHRoaXMudHJ5RW5zdXJlSW5kZXgoe1xuXHRcdFx0bnVtQWdlbnRzOiAxLFxuXHRcdFx0ZW5hYmxlZDogMVxuXHRcdH0pO1xuXHR9XG5cblx0Ly8gRklORFxuXHRmaW5kT25lQnlJZChfaWQsIG9wdGlvbnMpIHtcblx0XHRjb25zdCBxdWVyeSA9IHsgX2lkIH07XG5cblx0XHRyZXR1cm4gdGhpcy5maW5kT25lKHF1ZXJ5LCBvcHRpb25zKTtcblx0fVxuXG5cdGZpbmRCeURlcGFydG1lbnRJZChfaWQsIG9wdGlvbnMpIHtcblx0XHRjb25zdCBxdWVyeSA9IHsgX2lkIH07XG5cblx0XHRyZXR1cm4gdGhpcy5maW5kKHF1ZXJ5LCBvcHRpb25zKTtcblx0fVxuXG5cdGNyZWF0ZU9yVXBkYXRlRGVwYXJ0bWVudChfaWQsIHsgZW5hYmxlZCwgbmFtZSwgZGVzY3JpcHRpb24sIHNob3dPblJlZ2lzdHJhdGlvbiB9LCBhZ2VudHMpIHtcblx0XHRhZ2VudHMgPSBbXS5jb25jYXQoYWdlbnRzKTtcblxuXHRcdGNvbnN0IHJlY29yZCA9IHtcblx0XHRcdGVuYWJsZWQsXG5cdFx0XHRuYW1lLFxuXHRcdFx0ZGVzY3JpcHRpb24sXG5cdFx0XHRudW1BZ2VudHM6IGFnZW50cy5sZW5ndGgsXG5cdFx0XHRzaG93T25SZWdpc3RyYXRpb25cblx0XHR9O1xuXG5cdFx0aWYgKF9pZCkge1xuXHRcdFx0dGhpcy51cGRhdGUoeyBfaWQgfSwgeyAkc2V0OiByZWNvcmQgfSk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdF9pZCA9IHRoaXMuaW5zZXJ0KHJlY29yZCk7XG5cdFx0fVxuXG5cdFx0Y29uc3Qgc2F2ZWRBZ2VudHMgPSBfLnBsdWNrKFJvY2tldENoYXQubW9kZWxzLkxpdmVjaGF0RGVwYXJ0bWVudEFnZW50cy5maW5kQnlEZXBhcnRtZW50SWQoX2lkKS5mZXRjaCgpLCAnYWdlbnRJZCcpO1xuXHRcdGNvbnN0IGFnZW50c1RvU2F2ZSA9IF8ucGx1Y2soYWdlbnRzLCAnYWdlbnRJZCcpO1xuXG5cdFx0Ly8gcmVtb3ZlIG90aGVyIGFnZW50c1xuXHRcdF8uZGlmZmVyZW5jZShzYXZlZEFnZW50cywgYWdlbnRzVG9TYXZlKS5mb3JFYWNoKChhZ2VudElkKSA9PiB7XG5cdFx0XHRSb2NrZXRDaGF0Lm1vZGVscy5MaXZlY2hhdERlcGFydG1lbnRBZ2VudHMucmVtb3ZlQnlEZXBhcnRtZW50SWRBbmRBZ2VudElkKF9pZCwgYWdlbnRJZCk7XG5cdFx0fSk7XG5cblx0XHRhZ2VudHMuZm9yRWFjaCgoYWdlbnQpID0+IHtcblx0XHRcdFJvY2tldENoYXQubW9kZWxzLkxpdmVjaGF0RGVwYXJ0bWVudEFnZW50cy5zYXZlQWdlbnQoe1xuXHRcdFx0XHRhZ2VudElkOiBhZ2VudC5hZ2VudElkLFxuXHRcdFx0XHRkZXBhcnRtZW50SWQ6IF9pZCxcblx0XHRcdFx0dXNlcm5hbWU6IGFnZW50LnVzZXJuYW1lLFxuXHRcdFx0XHRjb3VudDogYWdlbnQuY291bnQgPyBwYXJzZUludChhZ2VudC5jb3VudCkgOiAwLFxuXHRcdFx0XHRvcmRlcjogYWdlbnQub3JkZXIgPyBwYXJzZUludChhZ2VudC5vcmRlcikgOiAwXG5cdFx0XHR9KTtcblx0XHR9KTtcblxuXHRcdHJldHVybiBfLmV4dGVuZChyZWNvcmQsIHsgX2lkIH0pO1xuXHR9XG5cblx0Ly8gUkVNT1ZFXG5cdHJlbW92ZUJ5SWQoX2lkKSB7XG5cdFx0Y29uc3QgcXVlcnkgPSB7IF9pZCB9O1xuXG5cdFx0cmV0dXJuIHRoaXMucmVtb3ZlKHF1ZXJ5KTtcblx0fVxuXG5cdGZpbmRFbmFibGVkV2l0aEFnZW50cygpIHtcblx0XHRjb25zdCBxdWVyeSA9IHtcblx0XHRcdG51bUFnZW50czogeyAkZ3Q6IDAgfSxcblx0XHRcdGVuYWJsZWQ6IHRydWVcblx0XHR9O1xuXHRcdHJldHVybiB0aGlzLmZpbmQocXVlcnkpO1xuXHR9XG59XG5cblJvY2tldENoYXQubW9kZWxzLkxpdmVjaGF0RGVwYXJ0bWVudCA9IG5ldyBMaXZlY2hhdERlcGFydG1lbnQoKTtcbiIsImltcG9ydCBfIGZyb20gJ3VuZGVyc2NvcmUnO1xuLyoqXG4gKiBMaXZlY2hhdCBEZXBhcnRtZW50IG1vZGVsXG4gKi9cbmNsYXNzIExpdmVjaGF0RGVwYXJ0bWVudEFnZW50cyBleHRlbmRzIFJvY2tldENoYXQubW9kZWxzLl9CYXNlIHtcblx0Y29uc3RydWN0b3IoKSB7XG5cdFx0c3VwZXIoJ2xpdmVjaGF0X2RlcGFydG1lbnRfYWdlbnRzJyk7XG5cdH1cblxuXHRmaW5kQnlEZXBhcnRtZW50SWQoZGVwYXJ0bWVudElkKSB7XG5cdFx0cmV0dXJuIHRoaXMuZmluZCh7IGRlcGFydG1lbnRJZCB9KTtcblx0fVxuXG5cdHNhdmVBZ2VudChhZ2VudCkge1xuXHRcdHJldHVybiB0aGlzLnVwc2VydCh7XG5cdFx0XHRhZ2VudElkOiBhZ2VudC5hZ2VudElkLFxuXHRcdFx0ZGVwYXJ0bWVudElkOiBhZ2VudC5kZXBhcnRtZW50SWRcblx0XHR9LCB7XG5cdFx0XHQkc2V0OiB7XG5cdFx0XHRcdHVzZXJuYW1lOiBhZ2VudC51c2VybmFtZSxcblx0XHRcdFx0Y291bnQ6IHBhcnNlSW50KGFnZW50LmNvdW50KSxcblx0XHRcdFx0b3JkZXI6IHBhcnNlSW50KGFnZW50Lm9yZGVyKVxuXHRcdFx0fVxuXHRcdH0pO1xuXHR9XG5cblx0cmVtb3ZlQnlEZXBhcnRtZW50SWRBbmRBZ2VudElkKGRlcGFydG1lbnRJZCwgYWdlbnRJZCkge1xuXHRcdHRoaXMucmVtb3ZlKHsgZGVwYXJ0bWVudElkLCBhZ2VudElkIH0pO1xuXHR9XG5cblx0Z2V0TmV4dEFnZW50Rm9yRGVwYXJ0bWVudChkZXBhcnRtZW50SWQpIHtcblx0XHRjb25zdCBhZ2VudHMgPSB0aGlzLmZpbmRCeURlcGFydG1lbnRJZChkZXBhcnRtZW50SWQpLmZldGNoKCk7XG5cblx0XHRpZiAoYWdlbnRzLmxlbmd0aCA9PT0gMCkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGNvbnN0IG9ubGluZVVzZXJzID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZE9ubGluZVVzZXJGcm9tTGlzdChfLnBsdWNrKGFnZW50cywgJ3VzZXJuYW1lJykpO1xuXG5cdFx0Y29uc3Qgb25saW5lVXNlcm5hbWVzID0gXy5wbHVjayhvbmxpbmVVc2Vycy5mZXRjaCgpLCAndXNlcm5hbWUnKTtcblxuXHRcdGNvbnN0IHF1ZXJ5ID0ge1xuXHRcdFx0ZGVwYXJ0bWVudElkLFxuXHRcdFx0dXNlcm5hbWU6IHtcblx0XHRcdFx0JGluOiBvbmxpbmVVc2VybmFtZXNcblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0Y29uc3Qgc29ydCA9IHtcblx0XHRcdGNvdW50OiAxLFxuXHRcdFx0b3JkZXI6IDEsXG5cdFx0XHR1c2VybmFtZTogMVxuXHRcdH07XG5cdFx0Y29uc3QgdXBkYXRlID0ge1xuXHRcdFx0JGluYzoge1xuXHRcdFx0XHRjb3VudDogMVxuXHRcdFx0fVxuXHRcdH07XG5cblx0XHRjb25zdCBjb2xsZWN0aW9uT2JqID0gdGhpcy5tb2RlbC5yYXdDb2xsZWN0aW9uKCk7XG5cdFx0Y29uc3QgZmluZEFuZE1vZGlmeSA9IE1ldGVvci53cmFwQXN5bmMoY29sbGVjdGlvbk9iai5maW5kQW5kTW9kaWZ5LCBjb2xsZWN0aW9uT2JqKTtcblxuXHRcdGNvbnN0IGFnZW50ID0gZmluZEFuZE1vZGlmeShxdWVyeSwgc29ydCwgdXBkYXRlKTtcblx0XHRpZiAoYWdlbnQgJiYgYWdlbnQudmFsdWUpIHtcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdGFnZW50SWQ6IGFnZW50LnZhbHVlLmFnZW50SWQsXG5cdFx0XHRcdHVzZXJuYW1lOiBhZ2VudC52YWx1ZS51c2VybmFtZVxuXHRcdFx0fTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIG51bGw7XG5cdFx0fVxuXHR9XG5cblx0Z2V0T25saW5lRm9yRGVwYXJ0bWVudChkZXBhcnRtZW50SWQpIHtcblx0XHRjb25zdCBhZ2VudHMgPSB0aGlzLmZpbmRCeURlcGFydG1lbnRJZChkZXBhcnRtZW50SWQpLmZldGNoKCk7XG5cblx0XHRpZiAoYWdlbnRzLmxlbmd0aCA9PT0gMCkge1xuXHRcdFx0cmV0dXJuIFtdO1xuXHRcdH1cblxuXHRcdGNvbnN0IG9ubGluZVVzZXJzID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZE9ubGluZVVzZXJGcm9tTGlzdChfLnBsdWNrKGFnZW50cywgJ3VzZXJuYW1lJykpO1xuXG5cdFx0Y29uc3Qgb25saW5lVXNlcm5hbWVzID0gXy5wbHVjayhvbmxpbmVVc2Vycy5mZXRjaCgpLCAndXNlcm5hbWUnKTtcblxuXHRcdGNvbnN0IHF1ZXJ5ID0ge1xuXHRcdFx0ZGVwYXJ0bWVudElkLFxuXHRcdFx0dXNlcm5hbWU6IHtcblx0XHRcdFx0JGluOiBvbmxpbmVVc2VybmFtZXNcblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0Y29uc3QgZGVwQWdlbnRzID0gdGhpcy5maW5kKHF1ZXJ5KTtcblxuXHRcdGlmIChkZXBBZ2VudHMpIHtcblx0XHRcdHJldHVybiBkZXBBZ2VudHM7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHJldHVybiBbXTtcblx0XHR9XG5cdH1cblxuXHRmaW5kVXNlcnNJblF1ZXVlKHVzZXJzTGlzdCkge1xuXHRcdGNvbnN0IHF1ZXJ5ID0ge307XG5cblx0XHRpZiAoIV8uaXNFbXB0eSh1c2Vyc0xpc3QpKSB7XG5cdFx0XHRxdWVyeS51c2VybmFtZSA9IHtcblx0XHRcdFx0JGluOiB1c2Vyc0xpc3Rcblx0XHRcdH07XG5cdFx0fVxuXG5cdFx0Y29uc3Qgb3B0aW9ucyA9IHtcblx0XHRcdHNvcnQ6IHtcblx0XHRcdFx0ZGVwYXJ0bWVudElkOiAxLFxuXHRcdFx0XHRjb3VudDogMSxcblx0XHRcdFx0b3JkZXI6IDEsXG5cdFx0XHRcdHVzZXJuYW1lOiAxXG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdHJldHVybiB0aGlzLmZpbmQocXVlcnksIG9wdGlvbnMpO1xuXHR9XG5cblx0cmVwbGFjZVVzZXJuYW1lT2ZBZ2VudEJ5VXNlcklkKHVzZXJJZCwgdXNlcm5hbWUpIHtcblx0XHRjb25zdCBxdWVyeSA9IHsnYWdlbnRJZCc6IHVzZXJJZH07XG5cblx0XHRjb25zdCB1cGRhdGUgPSB7XG5cdFx0XHQkc2V0OiB7XG5cdFx0XHRcdHVzZXJuYW1lXG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdHJldHVybiB0aGlzLnVwZGF0ZShxdWVyeSwgdXBkYXRlLCB7IG11bHRpOiB0cnVlIH0pO1xuXHR9XG59XG5cblJvY2tldENoYXQubW9kZWxzLkxpdmVjaGF0RGVwYXJ0bWVudEFnZW50cyA9IG5ldyBMaXZlY2hhdERlcGFydG1lbnRBZ2VudHMoKTtcbiIsIi8qKlxuICogTGl2ZWNoYXQgUGFnZSBWaXNpdGVkIG1vZGVsXG4gKi9cbmNsYXNzIExpdmVjaGF0UGFnZVZpc2l0ZWQgZXh0ZW5kcyBSb2NrZXRDaGF0Lm1vZGVscy5fQmFzZSB7XG5cdGNvbnN0cnVjdG9yKCkge1xuXHRcdHN1cGVyKCdsaXZlY2hhdF9wYWdlX3Zpc2l0ZWQnKTtcblxuXHRcdHRoaXMudHJ5RW5zdXJlSW5kZXgoeyAndG9rZW4nOiAxIH0pO1xuXHRcdHRoaXMudHJ5RW5zdXJlSW5kZXgoeyAndHMnOiAxIH0pO1xuXG5cdFx0Ly8ga2VlcCBoaXN0b3J5IGZvciAxIG1vbnRoIGlmIHRoZSB2aXNpdG9yIGRvZXMgbm90IHJlZ2lzdGVyXG5cdFx0dGhpcy50cnlFbnN1cmVJbmRleCh7ICdleHBpcmVBdCc6IDEgfSwgeyBzcGFyc2U6IDEsIGV4cGlyZUFmdGVyU2Vjb25kczogMCB9KTtcblx0fVxuXG5cdHNhdmVCeVRva2VuKHRva2VuLCBwYWdlSW5mbykge1xuXHRcdC8vIGtlZXAgaGlzdG9yeSBvZiB1bnJlZ2lzdGVyZWQgdmlzaXRvcnMgZm9yIDEgbW9udGhcblx0XHRjb25zdCBrZWVwSGlzdG9yeU1pbGlzZWNvbmRzID0gMjU5MjAwMDAwMDtcblxuXHRcdHJldHVybiB0aGlzLmluc2VydCh7XG5cdFx0XHR0b2tlbixcblx0XHRcdHBhZ2U6IHBhZ2VJbmZvLFxuXHRcdFx0dHM6IG5ldyBEYXRlKCksXG5cdFx0XHRleHBpcmVBdDogbmV3IERhdGUoKS5nZXRUaW1lKCkgKyBrZWVwSGlzdG9yeU1pbGlzZWNvbmRzXG5cdFx0fSk7XG5cdH1cblxuXHRmaW5kQnlUb2tlbih0b2tlbikge1xuXHRcdHJldHVybiB0aGlzLmZpbmQoeyB0b2tlbiB9LCB7IHNvcnQgOiB7IHRzOiAtMSB9LCBsaW1pdDogMjAgfSk7XG5cdH1cblxuXHRrZWVwSGlzdG9yeUZvclRva2VuKHRva2VuKSB7XG5cdFx0cmV0dXJuIHRoaXMudXBkYXRlKHtcblx0XHRcdHRva2VuLFxuXHRcdFx0ZXhwaXJlQXQ6IHtcblx0XHRcdFx0JGV4aXN0czogdHJ1ZVxuXHRcdFx0fVxuXHRcdH0sIHtcblx0XHRcdCR1bnNldDoge1xuXHRcdFx0XHRleHBpcmVBdDogMVxuXHRcdFx0fVxuXHRcdH0sIHtcblx0XHRcdG11bHRpOiB0cnVlXG5cdFx0fSk7XG5cdH1cbn1cblxuUm9ja2V0Q2hhdC5tb2RlbHMuTGl2ZWNoYXRQYWdlVmlzaXRlZCA9IG5ldyBMaXZlY2hhdFBhZ2VWaXNpdGVkKCk7XG4iLCIvKipcbiAqIExpdmVjaGF0IFRyaWdnZXIgbW9kZWxcbiAqL1xuY2xhc3MgTGl2ZWNoYXRUcmlnZ2VyIGV4dGVuZHMgUm9ja2V0Q2hhdC5tb2RlbHMuX0Jhc2Uge1xuXHRjb25zdHJ1Y3RvcigpIHtcblx0XHRzdXBlcignbGl2ZWNoYXRfdHJpZ2dlcicpO1xuXHR9XG5cblx0dXBkYXRlQnlJZChfaWQsIGRhdGEpIHtcblx0XHRyZXR1cm4gdGhpcy51cGRhdGUoeyBfaWQgfSwgeyAkc2V0OiBkYXRhIH0pO1xuXHR9XG5cblx0cmVtb3ZlQWxsKCkge1xuXHRcdHJldHVybiB0aGlzLnJlbW92ZSh7fSk7XG5cdH1cblxuXHRmaW5kQnlJZChfaWQpIHtcblx0XHRyZXR1cm4gdGhpcy5maW5kKHsgX2lkIH0pO1xuXHR9XG5cblx0cmVtb3ZlQnlJZChfaWQpIHtcblx0XHRyZXR1cm4gdGhpcy5yZW1vdmUoeyBfaWQgfSk7XG5cdH1cblxuXHRmaW5kRW5hYmxlZCgpIHtcblx0XHRyZXR1cm4gdGhpcy5maW5kKHsgZW5hYmxlZDogdHJ1ZSB9KTtcblx0fVxufVxuXG5Sb2NrZXRDaGF0Lm1vZGVscy5MaXZlY2hhdFRyaWdnZXIgPSBuZXcgTGl2ZWNoYXRUcmlnZ2VyKCk7XG4iLCJNZXRlb3Iuc3RhcnR1cChmdW5jdGlvbigpIHtcblx0Um9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMudHJ5RW5zdXJlSW5kZXgoeyBjb2RlOiAxIH0pO1xuXHRSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy50cnlFbnN1cmVJbmRleCh7IG9wZW46IDEgfSwgeyBzcGFyc2U6IDEgfSk7XG5cdFJvY2tldENoYXQubW9kZWxzLlVzZXJzLnRyeUVuc3VyZUluZGV4KHsgJ3Zpc2l0b3JFbWFpbHMuYWRkcmVzcyc6IDEgfSk7XG59KTtcbiIsImNsYXNzIExpdmVjaGF0SW5xdWlyeSBleHRlbmRzIFJvY2tldENoYXQubW9kZWxzLl9CYXNlIHtcblx0Y29uc3RydWN0b3IoKSB7XG5cdFx0c3VwZXIoJ2xpdmVjaGF0X2lucXVpcnknKTtcblxuXHRcdHRoaXMudHJ5RW5zdXJlSW5kZXgoeyAncmlkJzogMSB9KTsgLy8gcm9vbSBpZCBjb3JyZXNwb25kaW5nIHRvIHRoaXMgaW5xdWlyeVxuXHRcdHRoaXMudHJ5RW5zdXJlSW5kZXgoeyAnbmFtZSc6IDEgfSk7IC8vIG5hbWUgb2YgdGhlIGlucXVpcnkgKGNsaWVudCBuYW1lIGZvciBub3cpXG5cdFx0dGhpcy50cnlFbnN1cmVJbmRleCh7ICdtZXNzYWdlJzogMSB9KTsgLy8gbWVzc2FnZSBzZW50IGJ5IHRoZSBjbGllbnRcblx0XHR0aGlzLnRyeUVuc3VyZUluZGV4KHsgJ3RzJzogMSB9KTsgLy8gdGltZXN0YW1wXG5cdFx0dGhpcy50cnlFbnN1cmVJbmRleCh7ICdjb2RlJzogMSB9KTsgLy8gKGZvciByb3V0aW5nKVxuXHRcdHRoaXMudHJ5RW5zdXJlSW5kZXgoeyAnYWdlbnRzJzogMX0pOyAvLyBJZCdzIG9mIHRoZSBhZ2VudHMgd2hvIGNhbiBzZWUgdGhlIGlucXVpcnkgKGhhbmRsZSBkZXBhcnRtZW50cylcblx0XHR0aGlzLnRyeUVuc3VyZUluZGV4KHsgJ3N0YXR1cyc6IDF9KTsgLy8gJ29wZW4nLCAndGFrZW4nXG5cdH1cblxuXHRmaW5kT25lQnlJZChpbnF1aXJ5SWQpIHtcblx0XHRyZXR1cm4gdGhpcy5maW5kT25lKHsgX2lkOiBpbnF1aXJ5SWQgfSk7XG5cdH1cblxuXHQvKlxuXHQgKiBtYXJrIHRoZSBpbnF1aXJ5IGFzIHRha2VuXG5cdCAqL1xuXHR0YWtlSW5xdWlyeShpbnF1aXJ5SWQpIHtcblx0XHR0aGlzLnVwZGF0ZSh7XG5cdFx0XHQnX2lkJzogaW5xdWlyeUlkXG5cdFx0fSwge1xuXHRcdFx0JHNldDogeyBzdGF0dXM6ICd0YWtlbicgfVxuXHRcdH0pO1xuXHR9XG5cblx0Lypcblx0ICogbWFyayB0aGUgaW5xdWlyeSBhcyBjbG9zZWRcblx0ICovXG5cdGNsb3NlQnlSb29tSWQocm9vbUlkLCBjbG9zZUluZm8pIHtcblx0XHRyZXR1cm4gdGhpcy51cGRhdGUoe1xuXHRcdFx0cmlkOiByb29tSWRcblx0XHR9LCB7XG5cdFx0XHQkc2V0OiB7XG5cdFx0XHRcdHN0YXR1czogJ2Nsb3NlZCcsXG5cdFx0XHRcdGNsb3NlcjogY2xvc2VJbmZvLmNsb3Nlcixcblx0XHRcdFx0Y2xvc2VkQnk6IGNsb3NlSW5mby5jbG9zZWRCeSxcblx0XHRcdFx0Y2xvc2VkQXQ6IGNsb3NlSW5mby5jbG9zZWRBdCxcblx0XHRcdFx0Y2hhdER1cmF0aW9uOiBjbG9zZUluZm8uY2hhdER1cmF0aW9uXG5cdFx0XHR9XG5cdFx0fSk7XG5cdH1cblxuXHQvKlxuXHQgKiBtYXJrIGlucXVpcnkgYXMgb3BlblxuXHQgKi9cblx0b3BlbklucXVpcnkoaW5xdWlyeUlkKSB7XG5cdFx0dGhpcy51cGRhdGUoe1xuXHRcdFx0J19pZCc6IGlucXVpcnlJZFxuXHRcdH0sIHtcblx0XHRcdCRzZXQ6IHsgc3RhdHVzOiAnb3BlbicgfVxuXHRcdH0pO1xuXHR9XG5cblx0Lypcblx0ICogcmV0dXJuIHRoZSBzdGF0dXMgb2YgdGhlIGlucXVpcnkgKG9wZW4gb3IgdGFrZW4pXG5cdCAqL1xuXHRnZXRTdGF0dXMoaW5xdWlyeUlkKSB7XG5cdFx0cmV0dXJuIHRoaXMuZmluZE9uZSh7J19pZCc6IGlucXVpcnlJZH0pLnN0YXR1cztcblx0fVxuXG5cdHVwZGF0ZVZpc2l0b3JTdGF0dXModG9rZW4sIHN0YXR1cykge1xuXHRcdGNvbnN0IHF1ZXJ5ID0ge1xuXHRcdFx0J3YudG9rZW4nOiB0b2tlbixcblx0XHRcdHN0YXR1czogJ29wZW4nXG5cdFx0fTtcblxuXHRcdGNvbnN0IHVwZGF0ZSA9IHtcblx0XHRcdCRzZXQ6IHtcblx0XHRcdFx0J3Yuc3RhdHVzJzogc3RhdHVzXG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdHJldHVybiB0aGlzLnVwZGF0ZShxdWVyeSwgdXBkYXRlKTtcblx0fVxufVxuXG5Sb2NrZXRDaGF0Lm1vZGVscy5MaXZlY2hhdElucXVpcnkgPSBuZXcgTGl2ZWNoYXRJbnF1aXJ5KCk7XG4iLCJpbXBvcnQgbW9tZW50IGZyb20gJ21vbWVudCc7XG5cbmNsYXNzIExpdmVjaGF0T2ZmaWNlSG91ciBleHRlbmRzIFJvY2tldENoYXQubW9kZWxzLl9CYXNlIHtcblx0Y29uc3RydWN0b3IoKSB7XG5cdFx0c3VwZXIoJ2xpdmVjaGF0X29mZmljZV9ob3VyJyk7XG5cblx0XHR0aGlzLnRyeUVuc3VyZUluZGV4KHsgJ2RheSc6IDEgfSk7IC8vIHRoZSBkYXkgb2YgdGhlIHdlZWsgbW9uZGF5IC0gc3VuZGF5XG5cdFx0dGhpcy50cnlFbnN1cmVJbmRleCh7ICdzdGFydCc6IDEgfSk7IC8vIHRoZSBvcGVuaW5nIGhvdXJzIG9mIHRoZSBvZmZpY2Vcblx0XHR0aGlzLnRyeUVuc3VyZUluZGV4KHsgJ2ZpbmlzaCc6IDEgfSk7IC8vIHRoZSBjbG9zaW5nIGhvdXJzIG9mIHRoZSBvZmZpY2Vcblx0XHR0aGlzLnRyeUVuc3VyZUluZGV4KHsgJ29wZW4nOiAxIH0pOyAvLyB3aGV0aGVyIG9yIG5vdCB0aGUgb2ZmaWNlcyBhcmUgb3BlbiBvbiB0aGlzIGRheVxuXG5cdFx0Ly8gaWYgdGhlcmUgaXMgbm90aGluZyBpbiB0aGUgY29sbGVjdGlvbiwgYWRkIGRlZmF1bHRzXG5cdFx0aWYgKHRoaXMuZmluZCgpLmNvdW50KCkgPT09IDApIHtcblx0XHRcdHRoaXMuaW5zZXJ0KHsnZGF5JyA6ICdNb25kYXknLCAnc3RhcnQnIDogJzA4OjAwJywgJ2ZpbmlzaCcgOiAnMjA6MDAnLCAnY29kZScgOiAxLCAnb3BlbicgOiB0cnVlIH0pO1xuXHRcdFx0dGhpcy5pbnNlcnQoeydkYXknIDogJ1R1ZXNkYXknLCAnc3RhcnQnIDogJzA4OjAwJywgJ2ZpbmlzaCcgOiAnMjA6MDAnLCAnY29kZScgOiAyLCAnb3BlbicgOiB0cnVlIH0pO1xuXHRcdFx0dGhpcy5pbnNlcnQoeydkYXknIDogJ1dlZG5lc2RheScsICdzdGFydCcgOiAnMDg6MDAnLCAnZmluaXNoJyA6ICcyMDowMCcsICdjb2RlJyA6IDMsICdvcGVuJyA6IHRydWUgfSk7XG5cdFx0XHR0aGlzLmluc2VydCh7J2RheScgOiAnVGh1cnNkYXknLCAnc3RhcnQnIDogJzA4OjAwJywgJ2ZpbmlzaCcgOiAnMjA6MDAnLCAnY29kZScgOiA0LCAnb3BlbicgOiB0cnVlIH0pO1xuXHRcdFx0dGhpcy5pbnNlcnQoeydkYXknIDogJ0ZyaWRheScsICdzdGFydCcgOiAnMDg6MDAnLCAnZmluaXNoJyA6ICcyMDowMCcsICdjb2RlJyA6IDUsICdvcGVuJyA6IHRydWUgfSk7XG5cdFx0XHR0aGlzLmluc2VydCh7J2RheScgOiAnU2F0dXJkYXknLCAnc3RhcnQnIDogJzA4OjAwJywgJ2ZpbmlzaCcgOiAnMjA6MDAnLCAnY29kZScgOiA2LCAnb3BlbicgOiBmYWxzZSB9KTtcblx0XHRcdHRoaXMuaW5zZXJ0KHsnZGF5JyA6ICdTdW5kYXknLCAnc3RhcnQnIDogJzA4OjAwJywgJ2ZpbmlzaCcgOiAnMjA6MDAnLCAnY29kZScgOiAwLCAnb3BlbicgOiBmYWxzZSB9KTtcblx0XHR9XG5cdH1cblxuXHQvKlxuXHQgKiB1cGRhdGUgdGhlIGdpdmVuIGRheXMgc3RhcnQgYW5kIGZpbmlzaCB0aW1lcyBhbmQgd2hldGhlciB0aGUgb2ZmaWNlIGlzIG9wZW4gb24gdGhhdCBkYXlcblx0ICovXG5cdHVwZGF0ZUhvdXJzKGRheSwgbmV3U3RhcnQsIG5ld0ZpbmlzaCwgbmV3T3Blbikge1xuXHRcdHRoaXMudXBkYXRlKHtcblx0XHRcdGRheVxuXHRcdH0sIHtcblx0XHRcdCRzZXQ6IHtcblx0XHRcdFx0c3RhcnQ6IG5ld1N0YXJ0LFxuXHRcdFx0XHRmaW5pc2g6IG5ld0ZpbmlzaCxcblx0XHRcdFx0b3BlbjogbmV3T3BlblxuXHRcdFx0fVxuXHRcdH0pO1xuXHR9XG5cblx0Lypcblx0ICogQ2hlY2sgaWYgdGhlIGN1cnJlbnQgc2VydmVyIHRpbWUgKHV0YykgaXMgd2l0aGluIHRoZSBvZmZpY2UgaG91cnMgb2YgdGhhdCBkYXlcblx0ICogcmV0dXJucyB0cnVlIG9yIGZhbHNlXG5cdCAqL1xuXHRpc05vd1dpdGhpbkhvdXJzKCkge1xuXHRcdC8vIGdldCBjdXJyZW50IHRpbWUgb24gc2VydmVyIGluIHV0Y1xuXHRcdC8vIHZhciBjdCA9IG1vbWVudCgpLnV0YygpO1xuXHRcdGNvbnN0IGN1cnJlbnRUaW1lID0gbW9tZW50LnV0Yyhtb21lbnQoKS51dGMoKS5mb3JtYXQoJ2RkZGQ6SEg6bW0nKSwgJ2RkZGQ6SEg6bW0nKTtcblxuXHRcdC8vIGdldCB0b2RheXMgb2ZmaWNlIGhvdXJzIGZyb20gZGJcblx0XHRjb25zdCB0b2RheXNPZmZpY2VIb3VycyA9IHRoaXMuZmluZE9uZSh7ZGF5OiBjdXJyZW50VGltZS5mb3JtYXQoJ2RkZGQnKX0pO1xuXHRcdGlmICghdG9kYXlzT2ZmaWNlSG91cnMpIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cblx0XHQvLyBjaGVjayBpZiBvZmZpY2VzIGFyZSBvcGVuIHRvZGF5XG5cdFx0aWYgKHRvZGF5c09mZmljZUhvdXJzLm9wZW4gPT09IGZhbHNlKSB7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXG5cdFx0Y29uc3Qgc3RhcnQgPSBtb21lbnQudXRjKGAkeyB0b2RheXNPZmZpY2VIb3Vycy5kYXkgfTokeyB0b2RheXNPZmZpY2VIb3Vycy5zdGFydCB9YCwgJ2RkZGQ6SEg6bW0nKTtcblx0XHRjb25zdCBmaW5pc2ggPSBtb21lbnQudXRjKGAkeyB0b2RheXNPZmZpY2VIb3Vycy5kYXkgfTokeyB0b2RheXNPZmZpY2VIb3Vycy5maW5pc2ggfWAsICdkZGRkOkhIOm1tJyk7XG5cblx0XHQvLyBjb25zb2xlLmxvZyhmaW5pc2guaXNCZWZvcmUoc3RhcnQpKTtcblx0XHRpZiAoZmluaXNoLmlzQmVmb3JlKHN0YXJ0KSkge1xuXHRcdFx0Ly8gZmluaXNoLmRheShmaW5pc2guZGF5KCkrMSk7XG5cdFx0XHRmaW5pc2guYWRkKDEsICdkYXlzJyk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgcmVzdWx0ID0gY3VycmVudFRpbWUuaXNCZXR3ZWVuKHN0YXJ0LCBmaW5pc2gpO1xuXG5cdFx0Ly8gaW5CZXR3ZWVuICBjaGVja1xuXHRcdHJldHVybiByZXN1bHQ7XG5cdH1cblxuXHRpc09wZW5pbmdUaW1lKCkge1xuXHRcdC8vIGdldCBjdXJyZW50IHRpbWUgb24gc2VydmVyIGluIHV0Y1xuXHRcdGNvbnN0IGN1cnJlbnRUaW1lID0gbW9tZW50LnV0Yyhtb21lbnQoKS51dGMoKS5mb3JtYXQoJ2RkZGQ6SEg6bW0nKSwgJ2RkZGQ6SEg6bW0nKTtcblxuXHRcdC8vIGdldCB0b2RheXMgb2ZmaWNlIGhvdXJzIGZyb20gZGJcblx0XHRjb25zdCB0b2RheXNPZmZpY2VIb3VycyA9IHRoaXMuZmluZE9uZSh7ZGF5OiBjdXJyZW50VGltZS5mb3JtYXQoJ2RkZGQnKX0pO1xuXHRcdGlmICghdG9kYXlzT2ZmaWNlSG91cnMpIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cblx0XHQvLyBjaGVjayBpZiBvZmZpY2VzIGFyZSBvcGVuIHRvZGF5XG5cdFx0aWYgKHRvZGF5c09mZmljZUhvdXJzLm9wZW4gPT09IGZhbHNlKSB7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXG5cdFx0Y29uc3Qgc3RhcnQgPSBtb21lbnQudXRjKGAkeyB0b2RheXNPZmZpY2VIb3Vycy5kYXkgfTokeyB0b2RheXNPZmZpY2VIb3Vycy5zdGFydCB9YCwgJ2RkZGQ6SEg6bW0nKTtcblxuXHRcdHJldHVybiBzdGFydC5pc1NhbWUoY3VycmVudFRpbWUsICdtaW51dGUnKTtcblx0fVxuXG5cdGlzQ2xvc2luZ1RpbWUoKSB7XG5cdFx0Ly8gZ2V0IGN1cnJlbnQgdGltZSBvbiBzZXJ2ZXIgaW4gdXRjXG5cdFx0Y29uc3QgY3VycmVudFRpbWUgPSBtb21lbnQudXRjKG1vbWVudCgpLnV0YygpLmZvcm1hdCgnZGRkZDpISDptbScpLCAnZGRkZDpISDptbScpO1xuXG5cdFx0Ly8gZ2V0IHRvZGF5cyBvZmZpY2UgaG91cnMgZnJvbSBkYlxuXHRcdGNvbnN0IHRvZGF5c09mZmljZUhvdXJzID0gdGhpcy5maW5kT25lKHtkYXk6IGN1cnJlbnRUaW1lLmZvcm1hdCgnZGRkZCcpfSk7XG5cdFx0aWYgKCF0b2RheXNPZmZpY2VIb3Vycykge1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblxuXHRcdGNvbnN0IGZpbmlzaCA9IG1vbWVudC51dGMoYCR7IHRvZGF5c09mZmljZUhvdXJzLmRheSB9OiR7IHRvZGF5c09mZmljZUhvdXJzLmZpbmlzaCB9YCwgJ2RkZGQ6SEg6bW0nKTtcblxuXHRcdHJldHVybiBmaW5pc2guaXNTYW1lKGN1cnJlbnRUaW1lLCAnbWludXRlJyk7XG5cdH1cbn1cblxuUm9ja2V0Q2hhdC5tb2RlbHMuTGl2ZWNoYXRPZmZpY2VIb3VyID0gbmV3IExpdmVjaGF0T2ZmaWNlSG91cigpO1xuIiwiaW1wb3J0IF8gZnJvbSAndW5kZXJzY29yZSc7XG5pbXBvcnQgcyBmcm9tICd1bmRlcnNjb3JlLnN0cmluZyc7XG5cbmNsYXNzIExpdmVjaGF0VmlzaXRvcnMgZXh0ZW5kcyBSb2NrZXRDaGF0Lm1vZGVscy5fQmFzZSB7XG5cdGNvbnN0cnVjdG9yKCkge1xuXHRcdHN1cGVyKCdsaXZlY2hhdF92aXNpdG9yJyk7XG5cdH1cblxuXHQvKipcblx0ICogR2V0cyB2aXNpdG9yIGJ5IHRva2VuXG5cdCAqIEBwYXJhbSB7c3RyaW5nfSB0b2tlbiAtIFZpc2l0b3IgdG9rZW5cblx0ICovXG5cdGdldFZpc2l0b3JCeVRva2VuKHRva2VuLCBvcHRpb25zKSB7XG5cdFx0Y29uc3QgcXVlcnkgPSB7XG5cdFx0XHR0b2tlblxuXHRcdH07XG5cblx0XHRyZXR1cm4gdGhpcy5maW5kT25lKHF1ZXJ5LCBvcHRpb25zKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBGaW5kIHZpc2l0b3JzIGJ5IF9pZFxuXHQgKiBAcGFyYW0ge3N0cmluZ30gdG9rZW4gLSBWaXNpdG9yIHRva2VuXG5cdCAqL1xuXHRmaW5kQnlJZChfaWQsIG9wdGlvbnMpIHtcblx0XHRjb25zdCBxdWVyeSA9IHtcblx0XHRcdF9pZFxuXHRcdH07XG5cblx0XHRyZXR1cm4gdGhpcy5maW5kKHF1ZXJ5LCBvcHRpb25zKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBHZXRzIHZpc2l0b3IgYnkgdG9rZW5cblx0ICogQHBhcmFtIHtzdHJpbmd9IHRva2VuIC0gVmlzaXRvciB0b2tlblxuXHQgKi9cblx0ZmluZFZpc2l0b3JCeVRva2VuKHRva2VuKSB7XG5cdFx0Y29uc3QgcXVlcnkgPSB7XG5cdFx0XHR0b2tlblxuXHRcdH07XG5cblx0XHRyZXR1cm4gdGhpcy5maW5kKHF1ZXJ5KTtcblx0fVxuXG5cdHVwZGF0ZUxpdmVjaGF0RGF0YUJ5VG9rZW4odG9rZW4sIGtleSwgdmFsdWUsIG92ZXJ3cml0ZSA9IHRydWUpIHtcblx0XHRjb25zdCBxdWVyeSA9IHtcblx0XHRcdHRva2VuXG5cdFx0fTtcblxuXHRcdGlmICghb3ZlcndyaXRlKSB7XG5cdFx0XHRjb25zdCB1c2VyID0gdGhpcy5maW5kT25lKHF1ZXJ5LCB7IGZpZWxkczogeyBsaXZlY2hhdERhdGE6IDEgfSB9KTtcblx0XHRcdGlmICh1c2VyLmxpdmVjaGF0RGF0YSAmJiB0eXBlb2YgdXNlci5saXZlY2hhdERhdGFba2V5XSAhPT0gJ3VuZGVmaW5lZCcpIHtcblx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0Y29uc3QgdXBkYXRlID0ge1xuXHRcdFx0JHNldDoge1xuXHRcdFx0XHRbYGxpdmVjaGF0RGF0YS4keyBrZXkgfWBdOiB2YWx1ZVxuXHRcdFx0fVxuXHRcdH07XG5cblx0XHRyZXR1cm4gdGhpcy51cGRhdGUocXVlcnksIHVwZGF0ZSk7XG5cdH1cblxuXHQvKipcblx0ICogRmluZCBhIHZpc2l0b3IgYnkgdGhlaXIgcGhvbmUgbnVtYmVyXG5cdCAqIEByZXR1cm4ge29iamVjdH0gVXNlciBmcm9tIGRiXG5cdCAqL1xuXHRmaW5kT25lVmlzaXRvckJ5UGhvbmUocGhvbmUpIHtcblx0XHRjb25zdCBxdWVyeSA9IHtcblx0XHRcdCdwaG9uZS5waG9uZU51bWJlcic6IHBob25lXG5cdFx0fTtcblxuXHRcdHJldHVybiB0aGlzLmZpbmRPbmUocXVlcnkpO1xuXHR9XG5cblx0LyoqXG5cdCAqIEdldCB0aGUgbmV4dCB2aXNpdG9yIG5hbWVcblx0ICogQHJldHVybiB7c3RyaW5nfSBUaGUgbmV4dCB2aXNpdG9yIG5hbWVcblx0ICovXG5cdGdldE5leHRWaXNpdG9yVXNlcm5hbWUoKSB7XG5cdFx0Y29uc3Qgc2V0dGluZ3NSYXcgPSBSb2NrZXRDaGF0Lm1vZGVscy5TZXR0aW5ncy5tb2RlbC5yYXdDb2xsZWN0aW9uKCk7XG5cdFx0Y29uc3QgZmluZEFuZE1vZGlmeSA9IE1ldGVvci53cmFwQXN5bmMoc2V0dGluZ3NSYXcuZmluZEFuZE1vZGlmeSwgc2V0dGluZ3NSYXcpO1xuXG5cdFx0Y29uc3QgcXVlcnkgPSB7XG5cdFx0XHRfaWQ6ICdMaXZlY2hhdF9ndWVzdF9jb3VudCdcblx0XHR9O1xuXG5cdFx0Y29uc3QgdXBkYXRlID0ge1xuXHRcdFx0JGluYzoge1xuXHRcdFx0XHR2YWx1ZTogMVxuXHRcdFx0fVxuXHRcdH07XG5cblx0XHRjb25zdCBsaXZlY2hhdENvdW50ID0gZmluZEFuZE1vZGlmeShxdWVyeSwgbnVsbCwgdXBkYXRlKTtcblxuXHRcdHJldHVybiBgZ3Vlc3QtJHsgbGl2ZWNoYXRDb3VudC52YWx1ZS52YWx1ZSArIDEgfWA7XG5cdH1cblxuXHR1cGRhdGVCeUlkKF9pZCwgdXBkYXRlKSB7XG5cdFx0cmV0dXJuIHRoaXMudXBkYXRlKHsgX2lkIH0sIHVwZGF0ZSk7XG5cdH1cblxuXHRzYXZlR3Vlc3RCeUlkKF9pZCwgZGF0YSkge1xuXHRcdGNvbnN0IHNldERhdGEgPSB7fTtcblx0XHRjb25zdCB1bnNldERhdGEgPSB7fTtcblxuXHRcdGlmIChkYXRhLm5hbWUpIHtcblx0XHRcdGlmICghXy5pc0VtcHR5KHMudHJpbShkYXRhLm5hbWUpKSkge1xuXHRcdFx0XHRzZXREYXRhLm5hbWUgPSBzLnRyaW0oZGF0YS5uYW1lKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHVuc2V0RGF0YS5uYW1lID0gMTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRpZiAoZGF0YS5lbWFpbCkge1xuXHRcdFx0aWYgKCFfLmlzRW1wdHkocy50cmltKGRhdGEuZW1haWwpKSkge1xuXHRcdFx0XHRzZXREYXRhLnZpc2l0b3JFbWFpbHMgPSBbXG5cdFx0XHRcdFx0eyBhZGRyZXNzOiBzLnRyaW0oZGF0YS5lbWFpbCkgfVxuXHRcdFx0XHRdO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dW5zZXREYXRhLnZpc2l0b3JFbWFpbHMgPSAxO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGlmIChkYXRhLnBob25lKSB7XG5cdFx0XHRpZiAoIV8uaXNFbXB0eShzLnRyaW0oZGF0YS5waG9uZSkpKSB7XG5cdFx0XHRcdHNldERhdGEucGhvbmUgPSBbXG5cdFx0XHRcdFx0eyBwaG9uZU51bWJlcjogcy50cmltKGRhdGEucGhvbmUpIH1cblx0XHRcdFx0XTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHVuc2V0RGF0YS5waG9uZSA9IDE7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0Y29uc3QgdXBkYXRlID0ge307XG5cblx0XHRpZiAoIV8uaXNFbXB0eShzZXREYXRhKSkge1xuXHRcdFx0dXBkYXRlLiRzZXQgPSBzZXREYXRhO1xuXHRcdH1cblxuXHRcdGlmICghXy5pc0VtcHR5KHVuc2V0RGF0YSkpIHtcblx0XHRcdHVwZGF0ZS4kdW5zZXQgPSB1bnNldERhdGE7XG5cdFx0fVxuXG5cdFx0aWYgKF8uaXNFbXB0eSh1cGRhdGUpKSB7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cblx0XHRyZXR1cm4gdGhpcy51cGRhdGUoeyBfaWQgfSwgdXBkYXRlKTtcblx0fVxuXG5cdGZpbmRPbmVHdWVzdEJ5RW1haWxBZGRyZXNzKGVtYWlsQWRkcmVzcykge1xuXHRcdGNvbnN0IHF1ZXJ5ID0ge1xuXHRcdFx0J3Zpc2l0b3JFbWFpbHMuYWRkcmVzcyc6IG5ldyBSZWdFeHAoYF4keyBzLmVzY2FwZVJlZ0V4cChlbWFpbEFkZHJlc3MpIH0kYCwgJ2knKVxuXHRcdH07XG5cblx0XHRyZXR1cm4gdGhpcy5maW5kT25lKHF1ZXJ5KTtcblx0fVxuXG5cdHNhdmVHdWVzdEVtYWlsUGhvbmVCeUlkKF9pZCwgZW1haWxzLCBwaG9uZXMpIHtcblx0XHRjb25zdCB1cGRhdGUgPSB7XG5cdFx0XHQkYWRkVG9TZXQ6IHt9XG5cdFx0fTtcblxuXHRcdGNvbnN0IHNhdmVFbWFpbCA9IFtdLmNvbmNhdChlbWFpbHMpXG5cdFx0XHQuZmlsdGVyKGVtYWlsID0+IGVtYWlsICYmIGVtYWlsLnRyaW0oKSlcblx0XHRcdC5tYXAoZW1haWwgPT4ge1xuXHRcdFx0XHRyZXR1cm4geyBhZGRyZXNzOiBlbWFpbCB9O1xuXHRcdFx0fSk7XG5cblx0XHRpZiAoc2F2ZUVtYWlsLmxlbmd0aCA+IDApIHtcblx0XHRcdHVwZGF0ZS4kYWRkVG9TZXQudmlzaXRvckVtYWlscyA9IHsgJGVhY2g6IHNhdmVFbWFpbCB9O1xuXHRcdH1cblxuXHRcdGNvbnN0IHNhdmVQaG9uZSA9IFtdLmNvbmNhdChwaG9uZXMpXG5cdFx0XHQuZmlsdGVyKHBob25lID0+IHBob25lICYmIHBob25lLnRyaW0oKS5yZXBsYWNlKC9bXlxcZF0vZywgJycpKVxuXHRcdFx0Lm1hcChwaG9uZSA9PiB7XG5cdFx0XHRcdHJldHVybiB7IHBob25lTnVtYmVyOiBwaG9uZSB9O1xuXHRcdFx0fSk7XG5cblx0XHRpZiAoc2F2ZVBob25lLmxlbmd0aCA+IDApIHtcblx0XHRcdHVwZGF0ZS4kYWRkVG9TZXQucGhvbmUgPSB7ICRlYWNoOiBzYXZlUGhvbmUgfTtcblx0XHR9XG5cblx0XHRpZiAoIXVwZGF0ZS4kYWRkVG9TZXQudmlzaXRvckVtYWlscyAmJiAhdXBkYXRlLiRhZGRUb1NldC5waG9uZSkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdHJldHVybiB0aGlzLnVwZGF0ZSh7IF9pZCB9LCB1cGRhdGUpO1xuXHR9XG59XG5cbmV4cG9ydCBkZWZhdWx0IG5ldyBMaXZlY2hhdFZpc2l0b3JzKCk7XG4iLCIvKiBnbG9iYWxzIEhUVFAgKi9cbmltcG9ydCBfIGZyb20gJ3VuZGVyc2NvcmUnO1xuaW1wb3J0IHMgZnJvbSAndW5kZXJzY29yZS5zdHJpbmcnO1xuaW1wb3J0IFVBUGFyc2VyIGZyb20gJ3VhLXBhcnNlci1qcyc7XG5pbXBvcnQgTGl2ZWNoYXRWaXNpdG9ycyBmcm9tICcuLi9tb2RlbHMvTGl2ZWNoYXRWaXNpdG9ycyc7XG5cblJvY2tldENoYXQuTGl2ZWNoYXQgPSB7XG5cdGhpc3RvcnlNb25pdG9yVHlwZTogJ3VybCcsXG5cblx0bG9nZ2VyOiBuZXcgTG9nZ2VyKCdMaXZlY2hhdCcsIHtcblx0XHRzZWN0aW9uczoge1xuXHRcdFx0d2ViaG9vazogJ1dlYmhvb2snXG5cdFx0fVxuXHR9KSxcblxuXHRnZXROZXh0QWdlbnQoZGVwYXJ0bWVudCkge1xuXHRcdGlmIChSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnTGl2ZWNoYXRfUm91dGluZ19NZXRob2QnKSA9PT0gJ0V4dGVybmFsJykge1xuXHRcdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCAxMDsgaSsrKSB7XG5cdFx0XHRcdHRyeSB7XG5cdFx0XHRcdFx0Y29uc3QgcXVlcnlTdHJpbmcgPSBkZXBhcnRtZW50ID8gYD9kZXBhcnRtZW50SWQ9JHsgZGVwYXJ0bWVudCB9YCA6ICcnO1xuXHRcdFx0XHRcdGNvbnN0IHJlc3VsdCA9IEhUVFAuY2FsbCgnR0VUJywgYCR7IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdMaXZlY2hhdF9FeHRlcm5hbF9RdWV1ZV9VUkwnKSB9JHsgcXVlcnlTdHJpbmcgfWAsIHtcblx0XHRcdFx0XHRcdGhlYWRlcnM6IHtcblx0XHRcdFx0XHRcdFx0J1VzZXItQWdlbnQnOiAnUm9ja2V0Q2hhdCBTZXJ2ZXInLFxuXHRcdFx0XHRcdFx0XHQnQWNjZXB0JzogJ2FwcGxpY2F0aW9uL2pzb24nLFxuXHRcdFx0XHRcdFx0XHQnWC1Sb2NrZXRDaGF0LVNlY3JldC1Ub2tlbic6IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdMaXZlY2hhdF9FeHRlcm5hbF9RdWV1ZV9Ub2tlbicpXG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fSk7XG5cblx0XHRcdFx0XHRpZiAocmVzdWx0ICYmIHJlc3VsdC5kYXRhICYmIHJlc3VsdC5kYXRhLnVzZXJuYW1lKSB7XG5cdFx0XHRcdFx0XHRjb25zdCBhZ2VudCA9IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmVPbmxpbmVBZ2VudEJ5VXNlcm5hbWUocmVzdWx0LmRhdGEudXNlcm5hbWUpO1xuXG5cdFx0XHRcdFx0XHRpZiAoYWdlbnQpIHtcblx0XHRcdFx0XHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0XHRcdFx0XHRhZ2VudElkOiBhZ2VudC5faWQsXG5cdFx0XHRcdFx0XHRcdFx0dXNlcm5hbWU6IGFnZW50LnVzZXJuYW1lXG5cdFx0XHRcdFx0XHRcdH07XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRcdFx0Y29uc29sZS5lcnJvcignRXJyb3IgcmVxdWVzdGluZyBhZ2VudCBmcm9tIGV4dGVybmFsIHF1ZXVlLicsIGUpO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCduby1hZ2VudC1vbmxpbmUnLCAnU29ycnksIG5vIG9ubGluZSBhZ2VudHMnKTtcblx0XHR9IGVsc2UgaWYgKGRlcGFydG1lbnQpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0Lm1vZGVscy5MaXZlY2hhdERlcGFydG1lbnRBZ2VudHMuZ2V0TmV4dEFnZW50Rm9yRGVwYXJ0bWVudChkZXBhcnRtZW50KTtcblx0XHR9XG5cdFx0cmV0dXJuIFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmdldE5leHRBZ2VudCgpO1xuXHR9LFxuXHRnZXRBZ2VudHMoZGVwYXJ0bWVudCkge1xuXHRcdGlmIChkZXBhcnRtZW50KSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5tb2RlbHMuTGl2ZWNoYXREZXBhcnRtZW50QWdlbnRzLmZpbmRCeURlcGFydG1lbnRJZChkZXBhcnRtZW50KTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRBZ2VudHMoKTtcblx0XHR9XG5cdH0sXG5cdGdldE9ubGluZUFnZW50cyhkZXBhcnRtZW50KSB7XG5cdFx0aWYgKGRlcGFydG1lbnQpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0Lm1vZGVscy5MaXZlY2hhdERlcGFydG1lbnRBZ2VudHMuZ2V0T25saW5lRm9yRGVwYXJ0bWVudChkZXBhcnRtZW50KTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmxpbmVBZ2VudHMoKTtcblx0XHR9XG5cdH0sXG5cdGdldFJlcXVpcmVkRGVwYXJ0bWVudChvbmxpbmVSZXF1aXJlZCA9IHRydWUpIHtcblx0XHRjb25zdCBkZXBhcnRtZW50cyA9IFJvY2tldENoYXQubW9kZWxzLkxpdmVjaGF0RGVwYXJ0bWVudC5maW5kRW5hYmxlZFdpdGhBZ2VudHMoKTtcblxuXHRcdHJldHVybiBkZXBhcnRtZW50cy5mZXRjaCgpLmZpbmQoKGRlcHQpID0+IHtcblx0XHRcdGlmICghZGVwdC5zaG93T25SZWdpc3RyYXRpb24pIHtcblx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0fVxuXHRcdFx0aWYgKCFvbmxpbmVSZXF1aXJlZCkge1xuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdH1cblx0XHRcdGNvbnN0IG9ubGluZUFnZW50cyA9IFJvY2tldENoYXQubW9kZWxzLkxpdmVjaGF0RGVwYXJ0bWVudEFnZW50cy5nZXRPbmxpbmVGb3JEZXBhcnRtZW50KGRlcHQuX2lkKTtcblx0XHRcdHJldHVybiBvbmxpbmVBZ2VudHMuY291bnQoKSA+IDA7XG5cdFx0fSk7XG5cdH0sXG5cdGdldFJvb20oZ3Vlc3QsIG1lc3NhZ2UsIHJvb21JbmZvLCBhZ2VudCkge1xuXHRcdGxldCByb29tID0gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9uZUJ5SWQobWVzc2FnZS5yaWQpO1xuXHRcdGxldCBuZXdSb29tID0gZmFsc2U7XG5cblx0XHRpZiAocm9vbSAmJiAhcm9vbS5vcGVuKSB7XG5cdFx0XHRtZXNzYWdlLnJpZCA9IFJhbmRvbS5pZCgpO1xuXHRcdFx0cm9vbSA9IG51bGw7XG5cdFx0fVxuXG5cdFx0aWYgKHJvb20gPT0gbnVsbCkge1xuXHRcdFx0Ly8gaWYgbm8gZGVwYXJ0bWVudCBzZWxlY3RlZCB2ZXJpZnkgaWYgdGhlcmUgaXMgYXQgbGVhc3Qgb25lIGFjdGl2ZSBhbmQgcGljayB0aGUgZmlyc3Rcblx0XHRcdGlmICghYWdlbnQgJiYgIWd1ZXN0LmRlcGFydG1lbnQpIHtcblx0XHRcdFx0Y29uc3QgZGVwYXJ0bWVudCA9IHRoaXMuZ2V0UmVxdWlyZWREZXBhcnRtZW50KCk7XG5cblx0XHRcdFx0aWYgKGRlcGFydG1lbnQpIHtcblx0XHRcdFx0XHRndWVzdC5kZXBhcnRtZW50ID0gZGVwYXJ0bWVudC5faWQ7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0Ly8gZGVsZWdhdGUgcm9vbSBjcmVhdGlvbiB0byBRdWV1ZU1ldGhvZHNcblx0XHRcdGNvbnN0IHJvdXRpbmdNZXRob2QgPSBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnTGl2ZWNoYXRfUm91dGluZ19NZXRob2QnKTtcblx0XHRcdHJvb20gPSBSb2NrZXRDaGF0LlF1ZXVlTWV0aG9kc1tyb3V0aW5nTWV0aG9kXShndWVzdCwgbWVzc2FnZSwgcm9vbUluZm8sIGFnZW50KTtcblxuXHRcdFx0bmV3Um9vbSA9IHRydWU7XG5cdFx0fVxuXG5cdFx0aWYgKCFyb29tIHx8IHJvb20udi50b2tlbiAhPT0gZ3Vlc3QudG9rZW4pIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Nhbm5vdC1hY2Nlc3Mtcm9vbScpO1xuXHRcdH1cblxuXHRcdHJldHVybiB7IHJvb20sIG5ld1Jvb20gfTtcblx0fSxcblx0c2VuZE1lc3NhZ2UoeyBndWVzdCwgbWVzc2FnZSwgcm9vbUluZm8sIGFnZW50IH0pIHtcblx0XHRjb25zdCB7IHJvb20sIG5ld1Jvb20gfSA9IHRoaXMuZ2V0Um9vbShndWVzdCwgbWVzc2FnZSwgcm9vbUluZm8sIGFnZW50KTtcblx0XHRpZiAoZ3Vlc3QubmFtZSkge1xuXHRcdFx0bWVzc2FnZS5hbGlhcyA9IGd1ZXN0Lm5hbWU7XG5cdFx0fVxuXG5cdFx0Ly8gcmV0dXJuIG1lc3NhZ2VzO1xuXHRcdHJldHVybiBfLmV4dGVuZChSb2NrZXRDaGF0LnNlbmRNZXNzYWdlKGd1ZXN0LCBtZXNzYWdlLCByb29tKSwgeyBuZXdSb29tLCBzaG93Q29ubmVjdGluZzogdGhpcy5zaG93Q29ubmVjdGluZygpIH0pO1xuXHR9LFxuXHRyZWdpc3Rlckd1ZXN0KHsgdG9rZW4sIG5hbWUsIGVtYWlsLCBkZXBhcnRtZW50LCBwaG9uZSwgdXNlcm5hbWUgfSA9IHt9KSB7XG5cdFx0Y2hlY2sodG9rZW4sIFN0cmluZyk7XG5cblx0XHRsZXQgdXNlcklkO1xuXHRcdGNvbnN0IHVwZGF0ZVVzZXIgPSB7XG5cdFx0XHQkc2V0OiB7XG5cdFx0XHRcdHRva2VuXG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdGNvbnN0IHVzZXIgPSBMaXZlY2hhdFZpc2l0b3JzLmdldFZpc2l0b3JCeVRva2VuKHRva2VuLCB7IGZpZWxkczogeyBfaWQ6IDEgfSB9KTtcblxuXHRcdGlmICh1c2VyKSB7XG5cdFx0XHR1c2VySWQgPSB1c2VyLl9pZDtcblx0XHR9IGVsc2Uge1xuXHRcdFx0aWYgKCF1c2VybmFtZSkge1xuXHRcdFx0XHR1c2VybmFtZSA9IExpdmVjaGF0VmlzaXRvcnMuZ2V0TmV4dFZpc2l0b3JVc2VybmFtZSgpO1xuXHRcdFx0fVxuXG5cdFx0XHRsZXQgZXhpc3RpbmdVc2VyID0gbnVsbDtcblxuXHRcdFx0aWYgKHMudHJpbShlbWFpbCkgIT09ICcnICYmIChleGlzdGluZ1VzZXIgPSBMaXZlY2hhdFZpc2l0b3JzLmZpbmRPbmVHdWVzdEJ5RW1haWxBZGRyZXNzKGVtYWlsKSkpIHtcblx0XHRcdFx0dXNlcklkID0gZXhpc3RpbmdVc2VyLl9pZDtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGNvbnN0IHVzZXJEYXRhID0ge1xuXHRcdFx0XHRcdHVzZXJuYW1lLFxuXHRcdFx0XHRcdGRlcGFydG1lbnRcblx0XHRcdFx0fTtcblxuXHRcdFx0XHRpZiAodGhpcy5jb25uZWN0aW9uKSB7XG5cdFx0XHRcdFx0dXNlckRhdGEudXNlckFnZW50ID0gdGhpcy5jb25uZWN0aW9uLmh0dHBIZWFkZXJzWyd1c2VyLWFnZW50J107XG5cdFx0XHRcdFx0dXNlckRhdGEuaXAgPSB0aGlzLmNvbm5lY3Rpb24uaHR0cEhlYWRlcnNbJ3gtcmVhbC1pcCddIHx8IHRoaXMuY29ubmVjdGlvbi5odHRwSGVhZGVyc1sneC1mb3J3YXJkZWQtZm9yJ10gfHwgdGhpcy5jb25uZWN0aW9uLmNsaWVudEFkZHJlc3M7XG5cdFx0XHRcdFx0dXNlckRhdGEuaG9zdCA9IHRoaXMuY29ubmVjdGlvbi5odHRwSGVhZGVycy5ob3N0O1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0dXNlcklkID0gTGl2ZWNoYXRWaXNpdG9ycy5pbnNlcnQodXNlckRhdGEpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGlmIChwaG9uZSkge1xuXHRcdFx0dXBkYXRlVXNlci4kc2V0LnBob25lID0gW1xuXHRcdFx0XHR7IHBob25lTnVtYmVyOiBwaG9uZS5udW1iZXIgfVxuXHRcdFx0XTtcblx0XHR9XG5cblx0XHRpZiAoZW1haWwgJiYgZW1haWwudHJpbSgpICE9PSAnJykge1xuXHRcdFx0dXBkYXRlVXNlci4kc2V0LnZpc2l0b3JFbWFpbHMgPSBbXG5cdFx0XHRcdHsgYWRkcmVzczogZW1haWwgfVxuXHRcdFx0XTtcblx0XHR9XG5cblx0XHRpZiAobmFtZSkge1xuXHRcdFx0dXBkYXRlVXNlci4kc2V0Lm5hbWUgPSBuYW1lO1xuXHRcdH1cblxuXHRcdExpdmVjaGF0VmlzaXRvcnMudXBkYXRlQnlJZCh1c2VySWQsIHVwZGF0ZVVzZXIpO1xuXG5cdFx0cmV0dXJuIHVzZXJJZDtcblx0fSxcblx0c2V0RGVwYXJ0bWVudEZvckd1ZXN0KHsgdG9rZW4sIGRlcGFydG1lbnQgfSA9IHt9KSB7XG5cdFx0Y2hlY2sodG9rZW4sIFN0cmluZyk7XG5cblx0XHRjb25zdCB1cGRhdGVVc2VyID0ge1xuXHRcdFx0JHNldDoge1xuXHRcdFx0XHRkZXBhcnRtZW50XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdGNvbnN0IHVzZXIgPSBMaXZlY2hhdFZpc2l0b3JzLmdldFZpc2l0b3JCeVRva2VuKHRva2VuLCB7IGZpZWxkczogeyBfaWQ6IDEgfSB9KTtcblx0XHRpZiAodXNlcikge1xuXHRcdFx0cmV0dXJuIE1ldGVvci51c2Vycy51cGRhdGUodXNlci5faWQsIHVwZGF0ZVVzZXIpO1xuXHRcdH1cblx0XHRyZXR1cm4gZmFsc2U7XG5cdH0sXG5cdHNhdmVHdWVzdCh7IF9pZCwgbmFtZSwgZW1haWwsIHBob25lIH0pIHtcblx0XHRjb25zdCB1cGRhdGVEYXRhID0ge307XG5cblx0XHRpZiAobmFtZSkge1xuXHRcdFx0dXBkYXRlRGF0YS5uYW1lID0gbmFtZTtcblx0XHR9XG5cdFx0aWYgKGVtYWlsKSB7XG5cdFx0XHR1cGRhdGVEYXRhLmVtYWlsID0gZW1haWw7XG5cdFx0fVxuXHRcdGlmIChwaG9uZSkge1xuXHRcdFx0dXBkYXRlRGF0YS5waG9uZSA9IHBob25lO1xuXHRcdH1cblx0XHRjb25zdCByZXQgPSBMaXZlY2hhdFZpc2l0b3JzLnNhdmVHdWVzdEJ5SWQoX2lkLCB1cGRhdGVEYXRhKTtcblxuXHRcdE1ldGVvci5kZWZlcigoKSA9PiB7XG5cdFx0XHRSb2NrZXRDaGF0LmNhbGxiYWNrcy5ydW4oJ2xpdmVjaGF0LnNhdmVHdWVzdCcsIHVwZGF0ZURhdGEpO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIHJldDtcblx0fSxcblxuXHRjbG9zZVJvb20oeyB1c2VyLCB2aXNpdG9yLCByb29tLCBjb21tZW50IH0pIHtcblx0XHRjb25zdCBub3cgPSBuZXcgRGF0ZSgpO1xuXG5cdFx0Y29uc3QgY2xvc2VEYXRhID0ge1xuXHRcdFx0Y2xvc2VkQXQ6IG5vdyxcblx0XHRcdGNoYXREdXJhdGlvbjogKG5vdy5nZXRUaW1lKCkgLSByb29tLnRzKSAvIDEwMDBcblx0XHR9O1xuXG5cdFx0aWYgKHVzZXIpIHtcblx0XHRcdGNsb3NlRGF0YS5jbG9zZXIgPSAndXNlcic7XG5cdFx0XHRjbG9zZURhdGEuY2xvc2VkQnkgPSB7XG5cdFx0XHRcdF9pZDogdXNlci5faWQsXG5cdFx0XHRcdHVzZXJuYW1lOiB1c2VyLnVzZXJuYW1lXG5cdFx0XHR9O1xuXHRcdH0gZWxzZSBpZiAodmlzaXRvcikge1xuXHRcdFx0Y2xvc2VEYXRhLmNsb3NlciA9ICd2aXNpdG9yJztcblx0XHRcdGNsb3NlRGF0YS5jbG9zZWRCeSA9IHtcblx0XHRcdFx0X2lkOiB2aXNpdG9yLl9pZCxcblx0XHRcdFx0dXNlcm5hbWU6IHZpc2l0b3IudXNlcm5hbWVcblx0XHRcdH07XG5cdFx0fVxuXG5cdFx0Um9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuY2xvc2VCeVJvb21JZChyb29tLl9pZCwgY2xvc2VEYXRhKTtcblx0XHRSb2NrZXRDaGF0Lm1vZGVscy5MaXZlY2hhdElucXVpcnkuY2xvc2VCeVJvb21JZChyb29tLl9pZCwgY2xvc2VEYXRhKTtcblxuXHRcdGNvbnN0IG1lc3NhZ2UgPSB7XG5cdFx0XHR0OiAnbGl2ZWNoYXQtY2xvc2UnLFxuXHRcdFx0bXNnOiBjb21tZW50LFxuXHRcdFx0Z3JvdXBhYmxlOiBmYWxzZVxuXHRcdH07XG5cblx0XHRSb2NrZXRDaGF0LnNlbmRNZXNzYWdlKHVzZXIsIG1lc3NhZ2UsIHJvb20pO1xuXG5cdFx0aWYgKHJvb20uc2VydmVkQnkpIHtcblx0XHRcdFJvY2tldENoYXQubW9kZWxzLlN1YnNjcmlwdGlvbnMuaGlkZUJ5Um9vbUlkQW5kVXNlcklkKHJvb20uX2lkLCByb29tLnNlcnZlZEJ5Ll9pZCk7XG5cdFx0fVxuXHRcdFJvY2tldENoYXQubW9kZWxzLk1lc3NhZ2VzLmNyZWF0ZUNvbW1hbmRXaXRoUm9vbUlkQW5kVXNlcigncHJvbXB0VHJhbnNjcmlwdCcsIHJvb20uX2lkLCBjbG9zZURhdGEuY2xvc2VkQnkpO1xuXG5cdFx0TWV0ZW9yLmRlZmVyKCgpID0+IHtcblx0XHRcdFJvY2tldENoYXQuY2FsbGJhY2tzLnJ1bignbGl2ZWNoYXQuY2xvc2VSb29tJywgcm9vbSk7XG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gdHJ1ZTtcblx0fSxcblxuXHRnZXRJbml0U2V0dGluZ3MoKSB7XG5cdFx0Y29uc3Qgc2V0dGluZ3MgPSB7fTtcblxuXHRcdFJvY2tldENoYXQubW9kZWxzLlNldHRpbmdzLmZpbmROb3RIaWRkZW5QdWJsaWMoW1xuXHRcdFx0J0xpdmVjaGF0X3RpdGxlJyxcblx0XHRcdCdMaXZlY2hhdF90aXRsZV9jb2xvcicsXG5cdFx0XHQnTGl2ZWNoYXRfZW5hYmxlZCcsXG5cdFx0XHQnTGl2ZWNoYXRfcmVnaXN0cmF0aW9uX2Zvcm0nLFxuXHRcdFx0J0xpdmVjaGF0X2FsbG93X3N3aXRjaGluZ19kZXBhcnRtZW50cycsXG5cdFx0XHQnTGl2ZWNoYXRfb2ZmbGluZV90aXRsZScsXG5cdFx0XHQnTGl2ZWNoYXRfb2ZmbGluZV90aXRsZV9jb2xvcicsXG5cdFx0XHQnTGl2ZWNoYXRfb2ZmbGluZV9tZXNzYWdlJyxcblx0XHRcdCdMaXZlY2hhdF9vZmZsaW5lX3N1Y2Nlc3NfbWVzc2FnZScsXG5cdFx0XHQnTGl2ZWNoYXRfb2ZmbGluZV9mb3JtX3VuYXZhaWxhYmxlJyxcblx0XHRcdCdMaXZlY2hhdF9kaXNwbGF5X29mZmxpbmVfZm9ybScsXG5cdFx0XHQnTGl2ZWNoYXRfdmlkZW9jYWxsX2VuYWJsZWQnLFxuXHRcdFx0J0ppdHNpX0VuYWJsZWQnLFxuXHRcdFx0J0xhbmd1YWdlJyxcblx0XHRcdCdMaXZlY2hhdF9lbmFibGVfdHJhbnNjcmlwdCcsXG5cdFx0XHQnTGl2ZWNoYXRfdHJhbnNjcmlwdF9tZXNzYWdlJyxcblx0XHRcdCdMaXZlY2hhdF9jb252ZXJzYXRpb25fZmluaXNoZWRfbWVzc2FnZSdcblx0XHRdKS5mb3JFYWNoKChzZXR0aW5nKSA9PiB7XG5cdFx0XHRzZXR0aW5nc1tzZXR0aW5nLl9pZF0gPSBzZXR0aW5nLnZhbHVlO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIHNldHRpbmdzO1xuXHR9LFxuXG5cdHNhdmVSb29tSW5mbyhyb29tRGF0YSwgZ3Vlc3REYXRhKSB7XG5cdFx0aWYgKChyb29tRGF0YS50b3BpYyAhPSBudWxsIHx8IHJvb21EYXRhLnRhZ3MgIT0gbnVsbCkgJiYgIVJvY2tldENoYXQubW9kZWxzLlJvb21zLnNldFRvcGljQW5kVGFnc0J5SWQocm9vbURhdGEuX2lkLCByb29tRGF0YS50b3BpYywgcm9vbURhdGEudGFncykpIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cblx0XHRNZXRlb3IuZGVmZXIoKCkgPT4ge1xuXHRcdFx0Um9ja2V0Q2hhdC5jYWxsYmFja3MucnVuKCdsaXZlY2hhdC5zYXZlUm9vbScsIHJvb21EYXRhKTtcblx0XHR9KTtcblxuXHRcdGlmICghXy5pc0VtcHR5KGd1ZXN0RGF0YS5uYW1lKSkge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQubW9kZWxzLlJvb21zLnNldExhYmVsQnlSb29tSWQocm9vbURhdGEuX2lkLCBndWVzdERhdGEubmFtZSkgJiYgUm9ja2V0Q2hhdC5tb2RlbHMuU3Vic2NyaXB0aW9ucy51cGRhdGVOYW1lQnlSb29tSWQocm9vbURhdGEuX2lkLCBndWVzdERhdGEubmFtZSk7XG5cdFx0fVxuXHR9LFxuXG5cdGNsb3NlT3BlbkNoYXRzKHVzZXJJZCwgY29tbWVudCkge1xuXHRcdGNvbnN0IHVzZXIgPSBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kT25lQnlJZCh1c2VySWQpO1xuXHRcdFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRPcGVuQnlBZ2VudCh1c2VySWQpLmZvckVhY2goKHJvb20pID0+IHtcblx0XHRcdHRoaXMuY2xvc2VSb29tKHsgdXNlciwgcm9vbSwgY29tbWVudH0pO1xuXHRcdH0pO1xuXHR9LFxuXG5cdGZvcndhcmRPcGVuQ2hhdHModXNlcklkKSB7XG5cdFx0Um9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9wZW5CeUFnZW50KHVzZXJJZCkuZm9yRWFjaCgocm9vbSkgPT4ge1xuXHRcdFx0Y29uc3QgZ3Vlc3QgPSBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kT25lQnlJZChyb29tLnYuX2lkKTtcblx0XHRcdHRoaXMudHJhbnNmZXIocm9vbSwgZ3Vlc3QsIHsgZGVwYXJ0bWVudElkOiBndWVzdC5kZXBhcnRtZW50IH0pO1xuXHRcdH0pO1xuXHR9LFxuXG5cdHNhdmVQYWdlSGlzdG9yeSh0b2tlbiwgcGFnZUluZm8pIHtcblx0XHRpZiAocGFnZUluZm8uY2hhbmdlID09PSBSb2NrZXRDaGF0LkxpdmVjaGF0Lmhpc3RvcnlNb25pdG9yVHlwZSkge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQubW9kZWxzLkxpdmVjaGF0UGFnZVZpc2l0ZWQuc2F2ZUJ5VG9rZW4odG9rZW4sIHBhZ2VJbmZvKTtcblx0XHR9XG5cblx0XHRyZXR1cm47XG5cdH0sXG5cblx0dHJhbnNmZXIocm9vbSwgZ3Vlc3QsIHRyYW5zZmVyRGF0YSkge1xuXHRcdGxldCBhZ2VudDtcblxuXHRcdGlmICh0cmFuc2ZlckRhdGEudXNlcklkKSB7XG5cdFx0XHRjb25zdCB1c2VyID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZE9uZUJ5SWQodHJhbnNmZXJEYXRhLnVzZXJJZCk7XG5cdFx0XHRhZ2VudCA9IHtcblx0XHRcdFx0YWdlbnRJZDogdXNlci5faWQsXG5cdFx0XHRcdHVzZXJuYW1lOiB1c2VyLnVzZXJuYW1lXG5cdFx0XHR9O1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRhZ2VudCA9IFJvY2tldENoYXQuTGl2ZWNoYXQuZ2V0TmV4dEFnZW50KHRyYW5zZmVyRGF0YS5kZXBhcnRtZW50SWQpO1xuXHRcdH1cblxuXHRcdGNvbnN0IHNlcnZlZEJ5ID0gcm9vbS5zZXJ2ZWRCeTtcblxuXHRcdGlmIChhZ2VudCAmJiBhZ2VudC5hZ2VudElkICE9PSBzZXJ2ZWRCeS5faWQpIHtcblx0XHRcdHJvb20udXNlcm5hbWVzID0gXy53aXRob3V0KHJvb20udXNlcm5hbWVzLCBzZXJ2ZWRCeS51c2VybmFtZSkuY29uY2F0KGFnZW50LnVzZXJuYW1lKTtcblxuXHRcdFx0Um9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuY2hhbmdlQWdlbnRCeVJvb21JZChyb29tLl9pZCwgYWdlbnQpO1xuXG5cdFx0XHRjb25zdCBzdWJzY3JpcHRpb25EYXRhID0ge1xuXHRcdFx0XHRyaWQ6IHJvb20uX2lkLFxuXHRcdFx0XHRuYW1lOiBndWVzdC5uYW1lIHx8IGd1ZXN0LnVzZXJuYW1lLFxuXHRcdFx0XHRhbGVydDogdHJ1ZSxcblx0XHRcdFx0b3BlbjogdHJ1ZSxcblx0XHRcdFx0dW5yZWFkOiAxLFxuXHRcdFx0XHR1c2VyTWVudGlvbnM6IDEsXG5cdFx0XHRcdGdyb3VwTWVudGlvbnM6IDAsXG5cdFx0XHRcdGNvZGU6IHJvb20uY29kZSxcblx0XHRcdFx0dToge1xuXHRcdFx0XHRcdF9pZDogYWdlbnQuYWdlbnRJZCxcblx0XHRcdFx0XHR1c2VybmFtZTogYWdlbnQudXNlcm5hbWVcblx0XHRcdFx0fSxcblx0XHRcdFx0dDogJ2wnLFxuXHRcdFx0XHRkZXNrdG9wTm90aWZpY2F0aW9uczogJ2FsbCcsXG5cdFx0XHRcdG1vYmlsZVB1c2hOb3RpZmljYXRpb25zOiAnYWxsJyxcblx0XHRcdFx0ZW1haWxOb3RpZmljYXRpb25zOiAnYWxsJ1xuXHRcdFx0fTtcblx0XHRcdFJvY2tldENoYXQubW9kZWxzLlN1YnNjcmlwdGlvbnMucmVtb3ZlQnlSb29tSWRBbmRVc2VySWQocm9vbS5faWQsIHNlcnZlZEJ5Ll9pZCk7XG5cblx0XHRcdFJvY2tldENoYXQubW9kZWxzLlN1YnNjcmlwdGlvbnMuaW5zZXJ0KHN1YnNjcmlwdGlvbkRhdGEpO1xuXG5cdFx0XHRSb2NrZXRDaGF0Lm1vZGVscy5NZXNzYWdlcy5jcmVhdGVVc2VyTGVhdmVXaXRoUm9vbUlkQW5kVXNlcihyb29tLl9pZCwgeyBfaWQ6IHNlcnZlZEJ5Ll9pZCwgdXNlcm5hbWU6IHNlcnZlZEJ5LnVzZXJuYW1lIH0pO1xuXHRcdFx0Um9ja2V0Q2hhdC5tb2RlbHMuTWVzc2FnZXMuY3JlYXRlVXNlckpvaW5XaXRoUm9vbUlkQW5kVXNlcihyb29tLl9pZCwgeyBfaWQ6IGFnZW50LmFnZW50SWQsIHVzZXJuYW1lOiBhZ2VudC51c2VybmFtZSB9KTtcblxuXHRcdFx0Um9ja2V0Q2hhdC5MaXZlY2hhdC5zdHJlYW0uZW1pdChyb29tLl9pZCwge1xuXHRcdFx0XHR0eXBlOiAnYWdlbnREYXRhJyxcblx0XHRcdFx0ZGF0YTogUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZ2V0QWdlbnRJbmZvKGFnZW50LmFnZW50SWQpXG5cdFx0XHR9KTtcblxuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9LFxuXG5cdHNlbmRSZXF1ZXN0KHBvc3REYXRhLCBjYWxsYmFjaywgdHJ5aW5nID0gMSkge1xuXHRcdHRyeSB7XG5cdFx0XHRjb25zdCBvcHRpb25zID0ge1xuXHRcdFx0XHRoZWFkZXJzOiB7XG5cdFx0XHRcdFx0J1gtUm9ja2V0Q2hhdC1MaXZlY2hhdC1Ub2tlbic6IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdMaXZlY2hhdF9zZWNyZXRfdG9rZW4nKVxuXHRcdFx0XHR9LFxuXHRcdFx0XHRkYXRhOiBwb3N0RGF0YVxuXHRcdFx0fTtcblx0XHRcdHJldHVybiBIVFRQLnBvc3QoUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0xpdmVjaGF0X3dlYmhvb2tVcmwnKSwgb3B0aW9ucyk7XG5cdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0Um9ja2V0Q2hhdC5MaXZlY2hhdC5sb2dnZXIud2ViaG9vay5lcnJvcihgUmVzcG9uc2UgZXJyb3Igb24gJHsgdHJ5aW5nIH0gdHJ5IC0+YCwgZSk7XG5cdFx0XHQvLyB0cnkgMTAgdGltZXMgYWZ0ZXIgMTAgc2Vjb25kcyBlYWNoXG5cdFx0XHRpZiAodHJ5aW5nIDwgMTApIHtcblx0XHRcdFx0Um9ja2V0Q2hhdC5MaXZlY2hhdC5sb2dnZXIud2ViaG9vay53YXJuKCdXaWxsIHRyeSBhZ2FpbiBpbiAxMCBzZWNvbmRzIC4uLicpO1xuXHRcdFx0XHR0cnlpbmcrKztcblx0XHRcdFx0c2V0VGltZW91dChNZXRlb3IuYmluZEVudmlyb25tZW50KCgpID0+IHtcblx0XHRcdFx0XHRSb2NrZXRDaGF0LkxpdmVjaGF0LnNlbmRSZXF1ZXN0KHBvc3REYXRhLCBjYWxsYmFjaywgdHJ5aW5nKTtcblx0XHRcdFx0fSksIDEwMDAwKTtcblx0XHRcdH1cblx0XHR9XG5cdH0sXG5cblx0Z2V0TGl2ZWNoYXRSb29tR3Vlc3RJbmZvKHJvb20pIHtcblx0XHRjb25zdCB2aXNpdG9yID0gTGl2ZWNoYXRWaXNpdG9ycy5maW5kT25lQnlJZChyb29tLnYuX2lkKTtcblx0XHRjb25zdCBhZ2VudCA9IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmVCeUlkKHJvb20uc2VydmVkQnkgJiYgcm9vbS5zZXJ2ZWRCeS5faWQpO1xuXG5cdFx0Y29uc3QgdWEgPSBuZXcgVUFQYXJzZXIoKTtcblx0XHR1YS5zZXRVQSh2aXNpdG9yLnVzZXJBZ2VudCk7XG5cblx0XHRjb25zdCBwb3N0RGF0YSA9IHtcblx0XHRcdF9pZDogcm9vbS5faWQsXG5cdFx0XHRsYWJlbDogcm9vbS5sYWJlbCxcblx0XHRcdHRvcGljOiByb29tLnRvcGljLFxuXHRcdFx0Y29kZTogcm9vbS5jb2RlLFxuXHRcdFx0Y3JlYXRlZEF0OiByb29tLnRzLFxuXHRcdFx0bGFzdE1lc3NhZ2VBdDogcm9vbS5sbSxcblx0XHRcdHRhZ3M6IHJvb20udGFncyxcblx0XHRcdGN1c3RvbUZpZWxkczogcm9vbS5saXZlY2hhdERhdGEsXG5cdFx0XHR2aXNpdG9yOiB7XG5cdFx0XHRcdF9pZDogdmlzaXRvci5faWQsXG5cdFx0XHRcdHRva2VuOiB2aXNpdG9yLnRva2VuLFxuXHRcdFx0XHRuYW1lOiB2aXNpdG9yLm5hbWUsXG5cdFx0XHRcdHVzZXJuYW1lOiB2aXNpdG9yLnVzZXJuYW1lLFxuXHRcdFx0XHRlbWFpbDogbnVsbCxcblx0XHRcdFx0cGhvbmU6IG51bGwsXG5cdFx0XHRcdGRlcGFydG1lbnQ6IHZpc2l0b3IuZGVwYXJ0bWVudCxcblx0XHRcdFx0aXA6IHZpc2l0b3IuaXAsXG5cdFx0XHRcdG9zOiB1YS5nZXRPUygpLm5hbWUgJiYgKGAkeyB1YS5nZXRPUygpLm5hbWUgfSAkeyB1YS5nZXRPUygpLnZlcnNpb24gfWApLFxuXHRcdFx0XHRicm93c2VyOiB1YS5nZXRCcm93c2VyKCkubmFtZSAmJiAoYCR7IHVhLmdldEJyb3dzZXIoKS5uYW1lIH0gJHsgdWEuZ2V0QnJvd3NlcigpLnZlcnNpb24gfWApLFxuXHRcdFx0XHRjdXN0b21GaWVsZHM6IHZpc2l0b3IubGl2ZWNoYXREYXRhXG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdGlmIChhZ2VudCkge1xuXHRcdFx0cG9zdERhdGEuYWdlbnQgPSB7XG5cdFx0XHRcdF9pZDogYWdlbnQuX2lkLFxuXHRcdFx0XHR1c2VybmFtZTogYWdlbnQudXNlcm5hbWUsXG5cdFx0XHRcdG5hbWU6IGFnZW50Lm5hbWUsXG5cdFx0XHRcdGVtYWlsOiBudWxsXG5cdFx0XHR9O1xuXG5cdFx0XHRpZiAoYWdlbnQuZW1haWxzICYmIGFnZW50LmVtYWlscy5sZW5ndGggPiAwKSB7XG5cdFx0XHRcdHBvc3REYXRhLmFnZW50LmVtYWlsID0gYWdlbnQuZW1haWxzWzBdLmFkZHJlc3M7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0aWYgKHJvb20uY3JtRGF0YSkge1xuXHRcdFx0cG9zdERhdGEuY3JtRGF0YSA9IHJvb20uY3JtRGF0YTtcblx0XHR9XG5cblx0XHRpZiAodmlzaXRvci52aXNpdG9yRW1haWxzICYmIHZpc2l0b3IudmlzaXRvckVtYWlscy5sZW5ndGggPiAwKSB7XG5cdFx0XHRwb3N0RGF0YS52aXNpdG9yLmVtYWlsID0gdmlzaXRvci52aXNpdG9yRW1haWxzO1xuXHRcdH1cblx0XHRpZiAodmlzaXRvci5waG9uZSAmJiB2aXNpdG9yLnBob25lLmxlbmd0aCA+IDApIHtcblx0XHRcdHBvc3REYXRhLnZpc2l0b3IucGhvbmUgPSB2aXNpdG9yLnBob25lO1xuXHRcdH1cblxuXHRcdHJldHVybiBwb3N0RGF0YTtcblx0fSxcblxuXHRhZGRBZ2VudCh1c2VybmFtZSkge1xuXHRcdGNoZWNrKHVzZXJuYW1lLCBTdHJpbmcpO1xuXG5cdFx0Y29uc3QgdXNlciA9IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmVCeVVzZXJuYW1lKHVzZXJuYW1lLCB7IGZpZWxkczogeyBfaWQ6IDEsIHVzZXJuYW1lOiAxIH0gfSk7XG5cblx0XHRpZiAoIXVzZXIpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWludmFsaWQtdXNlcicsICdJbnZhbGlkIHVzZXInLCB7IG1ldGhvZDogJ2xpdmVjaGF0OmFkZEFnZW50JyB9KTtcblx0XHR9XG5cblx0XHRpZiAoUm9ja2V0Q2hhdC5hdXRoei5hZGRVc2VyUm9sZXModXNlci5faWQsICdsaXZlY2hhdC1hZ2VudCcpKSB7XG5cdFx0XHRSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5zZXRPcGVyYXRvcih1c2VyLl9pZCwgdHJ1ZSk7XG5cdFx0XHRSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5zZXRMaXZlY2hhdFN0YXR1cyh1c2VyLl9pZCwgJ2F2YWlsYWJsZScpO1xuXHRcdFx0cmV0dXJuIHVzZXI7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9LFxuXG5cdGFkZE1hbmFnZXIodXNlcm5hbWUpIHtcblx0XHRjaGVjayh1c2VybmFtZSwgU3RyaW5nKTtcblxuXHRcdGNvbnN0IHVzZXIgPSBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kT25lQnlVc2VybmFtZSh1c2VybmFtZSwgeyBmaWVsZHM6IHsgX2lkOiAxLCB1c2VybmFtZTogMSB9IH0pO1xuXG5cdFx0aWYgKCF1c2VyKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLXVzZXInLCAnSW52YWxpZCB1c2VyJywgeyBtZXRob2Q6ICdsaXZlY2hhdDphZGRNYW5hZ2VyJyB9KTtcblx0XHR9XG5cblx0XHRpZiAoUm9ja2V0Q2hhdC5hdXRoei5hZGRVc2VyUm9sZXModXNlci5faWQsICdsaXZlY2hhdC1tYW5hZ2VyJykpIHtcblx0XHRcdHJldHVybiB1c2VyO1xuXHRcdH1cblxuXHRcdHJldHVybiBmYWxzZTtcblx0fSxcblxuXHRyZW1vdmVBZ2VudCh1c2VybmFtZSkge1xuXHRcdGNoZWNrKHVzZXJuYW1lLCBTdHJpbmcpO1xuXG5cdFx0Y29uc3QgdXNlciA9IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmVCeVVzZXJuYW1lKHVzZXJuYW1lLCB7IGZpZWxkczogeyBfaWQ6IDEgfSB9KTtcblxuXHRcdGlmICghdXNlcikge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItaW52YWxpZC11c2VyJywgJ0ludmFsaWQgdXNlcicsIHsgbWV0aG9kOiAnbGl2ZWNoYXQ6cmVtb3ZlQWdlbnQnIH0pO1xuXHRcdH1cblxuXHRcdGlmIChSb2NrZXRDaGF0LmF1dGh6LnJlbW92ZVVzZXJGcm9tUm9sZXModXNlci5faWQsICdsaXZlY2hhdC1hZ2VudCcpKSB7XG5cdFx0XHRSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5zZXRPcGVyYXRvcih1c2VyLl9pZCwgZmFsc2UpO1xuXHRcdFx0Um9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuc2V0TGl2ZWNoYXRTdGF0dXModXNlci5faWQsICdub3QtYXZhaWxhYmxlJyk7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cblx0XHRyZXR1cm4gZmFsc2U7XG5cdH0sXG5cblx0cmVtb3ZlTWFuYWdlcih1c2VybmFtZSkge1xuXHRcdGNoZWNrKHVzZXJuYW1lLCBTdHJpbmcpO1xuXG5cdFx0Y29uc3QgdXNlciA9IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmVCeVVzZXJuYW1lKHVzZXJuYW1lLCB7IGZpZWxkczogeyBfaWQ6IDEgfSB9KTtcblxuXHRcdGlmICghdXNlcikge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItaW52YWxpZC11c2VyJywgJ0ludmFsaWQgdXNlcicsIHsgbWV0aG9kOiAnbGl2ZWNoYXQ6cmVtb3ZlTWFuYWdlcicgfSk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuYXV0aHoucmVtb3ZlVXNlckZyb21Sb2xlcyh1c2VyLl9pZCwgJ2xpdmVjaGF0LW1hbmFnZXInKTtcblx0fSxcblxuXHRzYXZlRGVwYXJ0bWVudChfaWQsIGRlcGFydG1lbnREYXRhLCBkZXBhcnRtZW50QWdlbnRzKSB7XG5cdFx0Y2hlY2soX2lkLCBNYXRjaC5NYXliZShTdHJpbmcpKTtcblxuXHRcdGNoZWNrKGRlcGFydG1lbnREYXRhLCB7XG5cdFx0XHRlbmFibGVkOiBCb29sZWFuLFxuXHRcdFx0bmFtZTogU3RyaW5nLFxuXHRcdFx0ZGVzY3JpcHRpb246IE1hdGNoLk9wdGlvbmFsKFN0cmluZyksXG5cdFx0XHRzaG93T25SZWdpc3RyYXRpb246IEJvb2xlYW5cblx0XHR9KTtcblxuXHRcdGNoZWNrKGRlcGFydG1lbnRBZ2VudHMsIFtcblx0XHRcdE1hdGNoLk9iamVjdEluY2x1ZGluZyh7XG5cdFx0XHRcdGFnZW50SWQ6IFN0cmluZyxcblx0XHRcdFx0dXNlcm5hbWU6IFN0cmluZ1xuXHRcdFx0fSlcblx0XHRdKTtcblxuXHRcdGlmIChfaWQpIHtcblx0XHRcdGNvbnN0IGRlcGFydG1lbnQgPSBSb2NrZXRDaGF0Lm1vZGVscy5MaXZlY2hhdERlcGFydG1lbnQuZmluZE9uZUJ5SWQoX2lkKTtcblx0XHRcdGlmICghZGVwYXJ0bWVudCkge1xuXHRcdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1kZXBhcnRtZW50LW5vdC1mb3VuZCcsICdEZXBhcnRtZW50IG5vdCBmb3VuZCcsIHsgbWV0aG9kOiAnbGl2ZWNoYXQ6c2F2ZURlcGFydG1lbnQnIH0pO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJldHVybiBSb2NrZXRDaGF0Lm1vZGVscy5MaXZlY2hhdERlcGFydG1lbnQuY3JlYXRlT3JVcGRhdGVEZXBhcnRtZW50KF9pZCwgZGVwYXJ0bWVudERhdGEsIGRlcGFydG1lbnRBZ2VudHMpO1xuXHR9LFxuXG5cdHJlbW92ZURlcGFydG1lbnQoX2lkKSB7XG5cdFx0Y2hlY2soX2lkLCBTdHJpbmcpO1xuXG5cdFx0Y29uc3QgZGVwYXJ0bWVudCA9IFJvY2tldENoYXQubW9kZWxzLkxpdmVjaGF0RGVwYXJ0bWVudC5maW5kT25lQnlJZChfaWQsIHsgZmllbGRzOiB7IF9pZDogMSB9IH0pO1xuXG5cdFx0aWYgKCFkZXBhcnRtZW50KSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdkZXBhcnRtZW50LW5vdC1mb3VuZCcsICdEZXBhcnRtZW50IG5vdCBmb3VuZCcsIHsgbWV0aG9kOiAnbGl2ZWNoYXQ6cmVtb3ZlRGVwYXJ0bWVudCcgfSk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQubW9kZWxzLkxpdmVjaGF0RGVwYXJ0bWVudC5yZW1vdmVCeUlkKF9pZCk7XG5cdH0sXG5cblx0c2hvd0Nvbm5lY3RpbmcoKSB7XG5cdFx0aWYgKFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdMaXZlY2hhdF9Sb3V0aW5nX01ldGhvZCcpID09PSAnR3Vlc3RfUG9vbCcpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnTGl2ZWNoYXRfb3Blbl9pbnF1aWVyeV9zaG93X2Nvbm5lY3RpbmcnKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblx0fVxufTtcblxuUm9ja2V0Q2hhdC5MaXZlY2hhdC5zdHJlYW0gPSBuZXcgTWV0ZW9yLlN0cmVhbWVyKCdsaXZlY2hhdC1yb29tJyk7XG5cblJvY2tldENoYXQuTGl2ZWNoYXQuc3RyZWFtLmFsbG93UmVhZCgocm9vbUlkLCBleHRyYURhdGEpID0+IHtcblx0Y29uc3Qgcm9vbSA9IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRPbmVCeUlkKHJvb21JZCk7XG5cdGlmICghcm9vbSkge1xuXHRcdGNvbnNvbGUud2FybihgSW52YWxpZCBldmVudE5hbWU6IFwiJHsgcm9vbUlkIH1cImApO1xuXHRcdHJldHVybiBmYWxzZTtcblx0fVxuXHRpZiAocm9vbS50ID09PSAnbCcgJiYgZXh0cmFEYXRhICYmIGV4dHJhRGF0YS50b2tlbiAmJiByb29tLnYudG9rZW4gPT09IGV4dHJhRGF0YS50b2tlbikge1xuXHRcdHJldHVybiB0cnVlO1xuXHR9XG5cdHJldHVybiBmYWxzZTtcbn0pO1xuXG5Sb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnTGl2ZWNoYXRfaGlzdG9yeV9tb25pdG9yX3R5cGUnLCAoa2V5LCB2YWx1ZSkgPT4ge1xuXHRSb2NrZXRDaGF0LkxpdmVjaGF0Lmhpc3RvcnlNb25pdG9yVHlwZSA9IHZhbHVlO1xufSk7XG4iLCJpbXBvcnQgXyBmcm9tICd1bmRlcnNjb3JlJztcblxuUm9ja2V0Q2hhdC5RdWV1ZU1ldGhvZHMgPSB7XG5cdC8qIExlYXN0IEFtb3VudCBRdWV1aW5nIG1ldGhvZDpcblx0ICpcblx0ICogZGVmYXVsdCBtZXRob2Qgd2hlcmUgdGhlIGFnZW50IHdpdGggdGhlIGxlYXN0IG51bWJlclxuXHQgKiBvZiBvcGVuIGNoYXRzIGlzIHBhaXJlZCB3aXRoIHRoZSBpbmNvbWluZyBsaXZlY2hhdFxuXHQgKi9cblx0J0xlYXN0X0Ftb3VudCcoZ3Vlc3QsIG1lc3NhZ2UsIHJvb21JbmZvLCBhZ2VudCkge1xuXHRcdGlmICghYWdlbnQpIHtcblx0XHRcdGFnZW50ID0gUm9ja2V0Q2hhdC5MaXZlY2hhdC5nZXROZXh0QWdlbnQoZ3Vlc3QuZGVwYXJ0bWVudCk7XG5cdFx0XHRpZiAoIWFnZW50KSB7XG5cdFx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ25vLWFnZW50LW9ubGluZScsICdTb3JyeSwgbm8gb25saW5lIGFnZW50cycpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGNvbnN0IHJvb21Db2RlID0gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZ2V0TmV4dExpdmVjaGF0Um9vbUNvZGUoKTtcblxuXHRcdGNvbnN0IHJvb20gPSBfLmV4dGVuZCh7XG5cdFx0XHRfaWQ6IG1lc3NhZ2UucmlkLFxuXHRcdFx0bXNnczogMSxcblx0XHRcdGxtOiBuZXcgRGF0ZSgpLFxuXHRcdFx0Y29kZTogcm9vbUNvZGUsXG5cdFx0XHRsYWJlbDogZ3Vlc3QubmFtZSB8fCBndWVzdC51c2VybmFtZSxcblx0XHRcdC8vIHVzZXJuYW1lczogW2FnZW50LnVzZXJuYW1lLCBndWVzdC51c2VybmFtZV0sXG5cdFx0XHR0OiAnbCcsXG5cdFx0XHR0czogbmV3IERhdGUoKSxcblx0XHRcdHY6IHtcblx0XHRcdFx0X2lkOiBndWVzdC5faWQsXG5cdFx0XHRcdHVzZXJuYW1lOiBndWVzdC51c2VybmFtZSxcblx0XHRcdFx0dG9rZW46IG1lc3NhZ2UudG9rZW4sXG5cdFx0XHRcdHN0YXR1czogZ3Vlc3Quc3RhdHVzIHx8ICdvbmxpbmUnXG5cdFx0XHR9LFxuXHRcdFx0c2VydmVkQnk6IHtcblx0XHRcdFx0X2lkOiBhZ2VudC5hZ2VudElkLFxuXHRcdFx0XHR1c2VybmFtZTogYWdlbnQudXNlcm5hbWVcblx0XHRcdH0sXG5cdFx0XHRjbDogZmFsc2UsXG5cdFx0XHRvcGVuOiB0cnVlLFxuXHRcdFx0d2FpdGluZ1Jlc3BvbnNlOiB0cnVlXG5cdFx0fSwgcm9vbUluZm8pO1xuXHRcdGNvbnN0IHN1YnNjcmlwdGlvbkRhdGEgPSB7XG5cdFx0XHRyaWQ6IG1lc3NhZ2UucmlkLFxuXHRcdFx0bmFtZTogZ3Vlc3QubmFtZSB8fCBndWVzdC51c2VybmFtZSxcblx0XHRcdGFsZXJ0OiB0cnVlLFxuXHRcdFx0b3BlbjogdHJ1ZSxcblx0XHRcdHVucmVhZDogMSxcblx0XHRcdHVzZXJNZW50aW9uczogMSxcblx0XHRcdGdyb3VwTWVudGlvbnM6IDAsXG5cdFx0XHRjb2RlOiByb29tQ29kZSxcblx0XHRcdHU6IHtcblx0XHRcdFx0X2lkOiBhZ2VudC5hZ2VudElkLFxuXHRcdFx0XHR1c2VybmFtZTogYWdlbnQudXNlcm5hbWVcblx0XHRcdH0sXG5cdFx0XHR0OiAnbCcsXG5cdFx0XHRkZXNrdG9wTm90aWZpY2F0aW9uczogJ2FsbCcsXG5cdFx0XHRtb2JpbGVQdXNoTm90aWZpY2F0aW9uczogJ2FsbCcsXG5cdFx0XHRlbWFpbE5vdGlmaWNhdGlvbnM6ICdhbGwnXG5cdFx0fTtcblxuXHRcdFJvY2tldENoYXQubW9kZWxzLlJvb21zLmluc2VydChyb29tKTtcblx0XHRSb2NrZXRDaGF0Lm1vZGVscy5TdWJzY3JpcHRpb25zLmluc2VydChzdWJzY3JpcHRpb25EYXRhKTtcblxuXHRcdFJvY2tldENoYXQuTGl2ZWNoYXQuc3RyZWFtLmVtaXQocm9vbS5faWQsIHtcblx0XHRcdHR5cGU6ICdhZ2VudERhdGEnLFxuXHRcdFx0ZGF0YTogUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZ2V0QWdlbnRJbmZvKGFnZW50LmFnZW50SWQpXG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gcm9vbTtcblx0fSxcblx0LyogR3Vlc3QgUG9vbCBRdWV1aW5nIE1ldGhvZDpcblx0ICpcblx0ICogQW4gaW5jb21taW5nIGxpdmVjaGF0IGlzIGNyZWF0ZWQgYXMgYW4gSW5xdWlyeVxuXHQgKiB3aGljaCBpcyBwaWNrZWQgdXAgZnJvbSBhbiBhZ2VudC5cblx0ICogQW4gSW5xdWlyeSBpcyB2aXNpYmxlIHRvIGFsbCBhZ2VudHMgKFRPRE86IGluIHRoZSBjb3JyZWN0IGRlcGFydG1lbnQpXG4gICAgICpcblx0ICogQSByb29tIGlzIHN0aWxsIGNyZWF0ZWQgd2l0aCB0aGUgaW5pdGlhbCBtZXNzYWdlLCBidXQgaXQgaXMgb2NjdXBpZWQgYnlcblx0ICogb25seSB0aGUgY2xpZW50IHVudGlsIHBhaXJlZCB3aXRoIGFuIGFnZW50XG5cdCAqL1xuXHQnR3Vlc3RfUG9vbCcoZ3Vlc3QsIG1lc3NhZ2UsIHJvb21JbmZvKSB7XG5cdFx0bGV0IGFnZW50cyA9IFJvY2tldENoYXQuTGl2ZWNoYXQuZ2V0T25saW5lQWdlbnRzKGd1ZXN0LmRlcGFydG1lbnQpO1xuXG5cdFx0aWYgKGFnZW50cy5jb3VudCgpID09PSAwICYmIFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdMaXZlY2hhdF9ndWVzdF9wb29sX3dpdGhfbm9fYWdlbnRzJykpIHtcblx0XHRcdGFnZW50cyA9IFJvY2tldENoYXQuTGl2ZWNoYXQuZ2V0QWdlbnRzKGd1ZXN0LmRlcGFydG1lbnQpO1xuXHRcdH1cblxuXHRcdGlmIChhZ2VudHMuY291bnQoKSA9PT0gMCkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignbm8tYWdlbnQtb25saW5lJywgJ1NvcnJ5LCBubyBvbmxpbmUgYWdlbnRzJyk7XG5cdFx0fVxuXG5cdFx0Y29uc3Qgcm9vbUNvZGUgPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5nZXROZXh0TGl2ZWNoYXRSb29tQ29kZSgpO1xuXG5cdFx0Y29uc3QgYWdlbnRJZHMgPSBbXTtcblxuXHRcdGFnZW50cy5mb3JFYWNoKChhZ2VudCkgPT4ge1xuXHRcdFx0aWYgKGd1ZXN0LmRlcGFydG1lbnQpIHtcblx0XHRcdFx0YWdlbnRJZHMucHVzaChhZ2VudC5hZ2VudElkKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGFnZW50SWRzLnB1c2goYWdlbnQuX2lkKTtcblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdGNvbnN0IGlucXVpcnkgPSB7XG5cdFx0XHRyaWQ6IG1lc3NhZ2UucmlkLFxuXHRcdFx0bWVzc2FnZTogbWVzc2FnZS5tc2csXG5cdFx0XHRuYW1lOiBndWVzdC5uYW1lIHx8IGd1ZXN0LnVzZXJuYW1lLFxuXHRcdFx0dHM6IG5ldyBEYXRlKCksXG5cdFx0XHRjb2RlOiByb29tQ29kZSxcblx0XHRcdGRlcGFydG1lbnQ6IGd1ZXN0LmRlcGFydG1lbnQsXG5cdFx0XHRhZ2VudHM6IGFnZW50SWRzLFxuXHRcdFx0c3RhdHVzOiAnb3BlbicsXG5cdFx0XHR2OiB7XG5cdFx0XHRcdF9pZDogZ3Vlc3QuX2lkLFxuXHRcdFx0XHR1c2VybmFtZTogZ3Vlc3QudXNlcm5hbWUsXG5cdFx0XHRcdHRva2VuOiBtZXNzYWdlLnRva2VuLFxuXHRcdFx0XHRzdGF0dXM6IGd1ZXN0LnN0YXR1cyB8fCAnb25saW5lJ1xuXHRcdFx0fSxcblx0XHRcdHQ6ICdsJ1xuXHRcdH07XG5cdFx0Y29uc3Qgcm9vbSA9IF8uZXh0ZW5kKHtcblx0XHRcdF9pZDogbWVzc2FnZS5yaWQsXG5cdFx0XHRtc2dzOiAxLFxuXHRcdFx0bG06IG5ldyBEYXRlKCksXG5cdFx0XHRjb2RlOiByb29tQ29kZSxcblx0XHRcdGxhYmVsOiBndWVzdC5uYW1lIHx8IGd1ZXN0LnVzZXJuYW1lLFxuXHRcdFx0Ly8gdXNlcm5hbWVzOiBbZ3Vlc3QudXNlcm5hbWVdLFxuXHRcdFx0dDogJ2wnLFxuXHRcdFx0dHM6IG5ldyBEYXRlKCksXG5cdFx0XHR2OiB7XG5cdFx0XHRcdF9pZDogZ3Vlc3QuX2lkLFxuXHRcdFx0XHR1c2VybmFtZTogZ3Vlc3QudXNlcm5hbWUsXG5cdFx0XHRcdHRva2VuOiBtZXNzYWdlLnRva2VuLFxuXHRcdFx0XHRzdGF0dXM6IGd1ZXN0LnN0YXR1c1xuXHRcdFx0fSxcblx0XHRcdGNsOiBmYWxzZSxcblx0XHRcdG9wZW46IHRydWUsXG5cdFx0XHR3YWl0aW5nUmVzcG9uc2U6IHRydWVcblx0XHR9LCByb29tSW5mbyk7XG5cdFx0Um9ja2V0Q2hhdC5tb2RlbHMuTGl2ZWNoYXRJbnF1aXJ5Lmluc2VydChpbnF1aXJ5KTtcblx0XHRSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5pbnNlcnQocm9vbSk7XG5cblx0XHRyZXR1cm4gcm9vbTtcblx0fSxcblx0J0V4dGVybmFsJyhndWVzdCwgbWVzc2FnZSwgcm9vbUluZm8sIGFnZW50KSB7XG5cdFx0cmV0dXJuIHRoaXNbJ0xlYXN0X0Ftb3VudCddKGd1ZXN0LCBtZXNzYWdlLCByb29tSW5mbywgYWdlbnQpOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lXG5cdH1cbn07XG4iLCIvLyBFdmVyeSBtaW51dGUgY2hlY2sgaWYgb2ZmaWNlIGNsb3NlZFxuTWV0ZW9yLnNldEludGVydmFsKGZ1bmN0aW9uKCkge1xuXHRpZiAoUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0xpdmVjaGF0X2VuYWJsZV9vZmZpY2VfaG91cnMnKSkge1xuXHRcdGlmIChSb2NrZXRDaGF0Lm1vZGVscy5MaXZlY2hhdE9mZmljZUhvdXIuaXNPcGVuaW5nVGltZSgpKSB7XG5cdFx0XHRSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5vcGVuT2ZmaWNlKCk7XG5cdFx0fSBlbHNlIGlmIChSb2NrZXRDaGF0Lm1vZGVscy5MaXZlY2hhdE9mZmljZUhvdXIuaXNDbG9zaW5nVGltZSgpKSB7XG5cdFx0XHRSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5jbG9zZU9mZmljZSgpO1xuXHRcdH1cblx0fVxufSwgNjAwMDApO1xuIiwiY29uc3QgZ2F0ZXdheVVSTCA9ICdodHRwczovL29tbmkucm9ja2V0LmNoYXQnO1xuXG5leHBvcnQgZGVmYXVsdCB7XG5cdGVuYWJsZSgpIHtcblx0XHRjb25zdCByZXN1bHQgPSBIVFRQLmNhbGwoJ1BPU1QnLCBgJHsgZ2F0ZXdheVVSTCB9L2ZhY2Vib29rL2VuYWJsZWAsIHtcblx0XHRcdGhlYWRlcnM6IHtcblx0XHRcdFx0J2F1dGhvcml6YXRpb24nOiBgQmVhcmVyICR7IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdMaXZlY2hhdF9GYWNlYm9va19BUElfS2V5JykgfWAsXG5cdFx0XHRcdCdjb250ZW50LXR5cGUnOiAnYXBwbGljYXRpb24vanNvbidcblx0XHRcdH0sXG5cdFx0XHRkYXRhOiB7XG5cdFx0XHRcdHVybDogUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ1NpdGVfVXJsJylcblx0XHRcdH1cblx0XHR9KTtcblx0XHRyZXR1cm4gcmVzdWx0LmRhdGE7XG5cdH0sXG5cblx0ZGlzYWJsZSgpIHtcblx0XHRjb25zdCByZXN1bHQgPSBIVFRQLmNhbGwoJ0RFTEVURScsIGAkeyBnYXRld2F5VVJMIH0vZmFjZWJvb2svZW5hYmxlYCwge1xuXHRcdFx0aGVhZGVyczoge1xuXHRcdFx0XHQnYXV0aG9yaXphdGlvbic6IGBCZWFyZXIgJHsgUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0xpdmVjaGF0X0ZhY2Vib29rX0FQSV9LZXknKSB9YCxcblx0XHRcdFx0J2NvbnRlbnQtdHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJ1xuXHRcdFx0fVxuXHRcdH0pO1xuXHRcdHJldHVybiByZXN1bHQuZGF0YTtcblx0fSxcblxuXHRsaXN0UGFnZXMoKSB7XG5cdFx0Y29uc3QgcmVzdWx0ID0gSFRUUC5jYWxsKCdHRVQnLCBgJHsgZ2F0ZXdheVVSTCB9L2ZhY2Vib29rL3BhZ2VzYCwge1xuXHRcdFx0aGVhZGVyczoge1xuXHRcdFx0XHQnYXV0aG9yaXphdGlvbic6IGBCZWFyZXIgJHsgUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0xpdmVjaGF0X0ZhY2Vib29rX0FQSV9LZXknKSB9YFxuXHRcdFx0fVxuXHRcdH0pO1xuXHRcdHJldHVybiByZXN1bHQuZGF0YTtcblx0fSxcblxuXHRzdWJzY3JpYmUocGFnZUlkKSB7XG5cdFx0Y29uc3QgcmVzdWx0ID0gSFRUUC5jYWxsKCdQT1NUJywgYCR7IGdhdGV3YXlVUkwgfS9mYWNlYm9vay9wYWdlLyR7IHBhZ2VJZCB9L3N1YnNjcmliZWAsIHtcblx0XHRcdGhlYWRlcnM6IHtcblx0XHRcdFx0J2F1dGhvcml6YXRpb24nOiBgQmVhcmVyICR7IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdMaXZlY2hhdF9GYWNlYm9va19BUElfS2V5JykgfWBcblx0XHRcdH1cblx0XHR9KTtcblx0XHRyZXR1cm4gcmVzdWx0LmRhdGE7XG5cdH0sXG5cblx0dW5zdWJzY3JpYmUocGFnZUlkKSB7XG5cdFx0Y29uc3QgcmVzdWx0ID0gSFRUUC5jYWxsKCdERUxFVEUnLCBgJHsgZ2F0ZXdheVVSTCB9L2ZhY2Vib29rL3BhZ2UvJHsgcGFnZUlkIH0vc3Vic2NyaWJlYCwge1xuXHRcdFx0aGVhZGVyczoge1xuXHRcdFx0XHQnYXV0aG9yaXphdGlvbic6IGBCZWFyZXIgJHsgUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0xpdmVjaGF0X0ZhY2Vib29rX0FQSV9LZXknKSB9YFxuXHRcdFx0fVxuXHRcdH0pO1xuXHRcdHJldHVybiByZXN1bHQuZGF0YTtcblx0fSxcblxuXHRyZXBseSh7IHBhZ2UsIHRva2VuLCB0ZXh0IH0pIHtcblx0XHRyZXR1cm4gSFRUUC5jYWxsKCdQT1NUJywgYCR7IGdhdGV3YXlVUkwgfS9mYWNlYm9vay9yZXBseWAsIHtcblx0XHRcdGhlYWRlcnM6IHtcblx0XHRcdFx0J2F1dGhvcml6YXRpb24nOiBgQmVhcmVyICR7IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdMaXZlY2hhdF9GYWNlYm9va19BUElfS2V5JykgfWBcblx0XHRcdH0sXG5cdFx0XHRkYXRhOiB7XG5cdFx0XHRcdHBhZ2UsXG5cdFx0XHRcdHRva2VuLFxuXHRcdFx0XHR0ZXh0XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH1cbn07XG4iLCJpbXBvcnQgTGl2ZWNoYXRWaXNpdG9ycyBmcm9tICcuL21vZGVscy9MaXZlY2hhdFZpc2l0b3JzJztcblxuUm9ja2V0Q2hhdC5jYWxsYmFja3MuYWRkKCdhZnRlclNhdmVNZXNzYWdlJywgZnVuY3Rpb24obWVzc2FnZSwgcm9vbSkge1xuXHQvLyBza2lwcyB0aGlzIGNhbGxiYWNrIGlmIHRoZSBtZXNzYWdlIHdhcyBlZGl0ZWRcblx0aWYgKG1lc3NhZ2UuZWRpdGVkQXQpIHtcblx0XHRyZXR1cm4gbWVzc2FnZTtcblx0fVxuXG5cdGlmICghUm9ja2V0Q2hhdC5TTVMuZW5hYmxlZCkge1xuXHRcdHJldHVybiBtZXNzYWdlO1xuXHR9XG5cblx0Ly8gb25seSBzZW5kIHRoZSBzbXMgYnkgU01TIGlmIGl0IGlzIGEgbGl2ZWNoYXQgcm9vbSB3aXRoIFNNUyBzZXQgdG8gdHJ1ZVxuXHRpZiAoISh0eXBlb2Ygcm9vbS50ICE9PSAndW5kZWZpbmVkJyAmJiByb29tLnQgPT09ICdsJyAmJiByb29tLnNtcyAmJiByb29tLnYgJiYgcm9vbS52LnRva2VuKSkge1xuXHRcdHJldHVybiBtZXNzYWdlO1xuXHR9XG5cblx0Ly8gaWYgdGhlIG1lc3NhZ2UgaGFzIGEgdG9rZW4sIGl0IHdhcyBzZW50IGZyb20gdGhlIHZpc2l0b3IsIHNvIGlnbm9yZSBpdFxuXHRpZiAobWVzc2FnZS50b2tlbikge1xuXHRcdHJldHVybiBtZXNzYWdlO1xuXHR9XG5cblx0Ly8gaWYgdGhlIG1lc3NhZ2UgaGFzIGEgdHlwZSBtZWFucyBpdCBpcyBhIHNwZWNpYWwgbWVzc2FnZSAobGlrZSB0aGUgY2xvc2luZyBjb21tZW50KSwgc28gc2tpcHNcblx0aWYgKG1lc3NhZ2UudCkge1xuXHRcdHJldHVybiBtZXNzYWdlO1xuXHR9XG5cblx0Y29uc3QgU01TU2VydmljZSA9IFJvY2tldENoYXQuU01TLmdldFNlcnZpY2UoUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ1NNU19TZXJ2aWNlJykpO1xuXG5cdGlmICghU01TU2VydmljZSkge1xuXHRcdHJldHVybiBtZXNzYWdlO1xuXHR9XG5cblx0Y29uc3QgdmlzaXRvciA9IExpdmVjaGF0VmlzaXRvcnMuZ2V0VmlzaXRvckJ5VG9rZW4ocm9vbS52LnRva2VuKTtcblxuXHRpZiAoIXZpc2l0b3IgfHwgIXZpc2l0b3IucGhvbmUgfHwgdmlzaXRvci5waG9uZS5sZW5ndGggPT09IDApIHtcblx0XHRyZXR1cm4gbWVzc2FnZTtcblx0fVxuXG5cdFNNU1NlcnZpY2Uuc2VuZChyb29tLnNtcy5mcm9tLCB2aXNpdG9yLnBob25lWzBdLnBob25lTnVtYmVyLCBtZXNzYWdlLm1zZyk7XG5cblx0cmV0dXJuIG1lc3NhZ2U7XG5cbn0sIFJvY2tldENoYXQuY2FsbGJhY2tzLnByaW9yaXR5LkxPVywgJ3NlbmRNZXNzYWdlQnlTbXMnKTtcbiIsIi8qIGdsb2JhbHMgVXNlclByZXNlbmNlTW9uaXRvciAqL1xuXG5sZXQgYWdlbnRzSGFuZGxlcjtcbmxldCBtb25pdG9yQWdlbnRzID0gZmFsc2U7XG5sZXQgYWN0aW9uVGltZW91dCA9IDYwMDAwO1xuXG5jb25zdCBvbmxpbmVBZ2VudHMgPSB7XG5cdHVzZXJzOiB7fSxcblx0cXVldWU6IHt9LFxuXG5cdGFkZCh1c2VySWQpIHtcblx0XHRpZiAodGhpcy5xdWV1ZVt1c2VySWRdKSB7XG5cdFx0XHRjbGVhclRpbWVvdXQodGhpcy5xdWV1ZVt1c2VySWRdKTtcblx0XHRcdGRlbGV0ZSB0aGlzLnF1ZXVlW3VzZXJJZF07XG5cdFx0fVxuXHRcdHRoaXMudXNlcnNbdXNlcklkXSA9IDE7XG5cdH0sXG5cblx0cmVtb3ZlKHVzZXJJZCwgY2FsbGJhY2spIHtcblx0XHRpZiAodGhpcy5xdWV1ZVt1c2VySWRdKSB7XG5cdFx0XHRjbGVhclRpbWVvdXQodGhpcy5xdWV1ZVt1c2VySWRdKTtcblx0XHR9XG5cdFx0dGhpcy5xdWV1ZVt1c2VySWRdID0gc2V0VGltZW91dChNZXRlb3IuYmluZEVudmlyb25tZW50KCgpID0+IHtcblx0XHRcdGNhbGxiYWNrKCk7XG5cblx0XHRcdGRlbGV0ZSB0aGlzLnVzZXJzW3VzZXJJZF07XG5cdFx0XHRkZWxldGUgdGhpcy5xdWV1ZVt1c2VySWRdO1xuXHRcdH0pLCBhY3Rpb25UaW1lb3V0KTtcblx0fSxcblxuXHRleGlzdHModXNlcklkKSB7XG5cdFx0cmV0dXJuICEhdGhpcy51c2Vyc1t1c2VySWRdO1xuXHR9XG59O1xuXG5mdW5jdGlvbiBydW5BZ2VudExlYXZlQWN0aW9uKHVzZXJJZCkge1xuXHRjb25zdCBhY3Rpb24gPSBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnTGl2ZWNoYXRfYWdlbnRfbGVhdmVfYWN0aW9uJyk7XG5cdGlmIChhY3Rpb24gPT09ICdjbG9zZScpIHtcblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5MaXZlY2hhdC5jbG9zZU9wZW5DaGF0cyh1c2VySWQsIFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdMaXZlY2hhdF9hZ2VudF9sZWF2ZV9jb21tZW50JykpO1xuXHR9IGVsc2UgaWYgKGFjdGlvbiA9PT0gJ2ZvcndhcmQnKSB7XG5cdFx0cmV0dXJuIFJvY2tldENoYXQuTGl2ZWNoYXQuZm9yd2FyZE9wZW5DaGF0cyh1c2VySWQpO1xuXHR9XG59XG5cblJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdMaXZlY2hhdF9hZ2VudF9sZWF2ZV9hY3Rpb25fdGltZW91dCcsIGZ1bmN0aW9uKGtleSwgdmFsdWUpIHtcblx0YWN0aW9uVGltZW91dCA9IHZhbHVlICogMTAwMDtcbn0pO1xuXG5Sb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnTGl2ZWNoYXRfYWdlbnRfbGVhdmVfYWN0aW9uJywgZnVuY3Rpb24oa2V5LCB2YWx1ZSkge1xuXHRtb25pdG9yQWdlbnRzID0gdmFsdWU7XG5cdGlmICh2YWx1ZSAhPT0gJ25vbmUnKSB7XG5cdFx0aWYgKCFhZ2VudHNIYW5kbGVyKSB7XG5cdFx0XHRhZ2VudHNIYW5kbGVyID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZE9ubGluZUFnZW50cygpLm9ic2VydmVDaGFuZ2VzKHtcblx0XHRcdFx0YWRkZWQoaWQpIHtcblx0XHRcdFx0XHRvbmxpbmVBZ2VudHMuYWRkKGlkKTtcblx0XHRcdFx0fSxcblx0XHRcdFx0Y2hhbmdlZChpZCwgZmllbGRzKSB7XG5cdFx0XHRcdFx0aWYgKGZpZWxkcy5zdGF0dXNMaXZlY2hhdCAmJiBmaWVsZHMuc3RhdHVzTGl2ZWNoYXQgPT09ICdub3QtYXZhaWxhYmxlJykge1xuXHRcdFx0XHRcdFx0b25saW5lQWdlbnRzLnJlbW92ZShpZCwgKCkgPT4ge1xuXHRcdFx0XHRcdFx0XHRydW5BZ2VudExlYXZlQWN0aW9uKGlkKTtcblx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRvbmxpbmVBZ2VudHMuYWRkKGlkKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0sXG5cdFx0XHRcdHJlbW92ZWQoaWQpIHtcblx0XHRcdFx0XHRvbmxpbmVBZ2VudHMucmVtb3ZlKGlkLCAoKSA9PiB7XG5cdFx0XHRcdFx0XHRydW5BZ2VudExlYXZlQWN0aW9uKGlkKTtcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0fVxuXHR9IGVsc2UgaWYgKGFnZW50c0hhbmRsZXIpIHtcblx0XHRhZ2VudHNIYW5kbGVyLnN0b3AoKTtcblx0XHRhZ2VudHNIYW5kbGVyID0gbnVsbDtcblx0fVxufSk7XG5cblVzZXJQcmVzZW5jZU1vbml0b3Iub25TZXRVc2VyU3RhdHVzKCh1c2VyLCBzdGF0dXMvKiwgc3RhdHVzQ29ubmVjdGlvbiovKSA9PiB7XG5cdGlmICghbW9uaXRvckFnZW50cykge1xuXHRcdHJldHVybjtcblx0fVxuXHRpZiAob25saW5lQWdlbnRzLmV4aXN0cyh1c2VyLl9pZCkpIHtcblx0XHRpZiAoc3RhdHVzID09PSAnb2ZmbGluZScgfHwgdXNlci5zdGF0dXNMaXZlY2hhdCA9PT0gJ25vdC1hdmFpbGFibGUnKSB7XG5cdFx0XHRvbmxpbmVBZ2VudHMucmVtb3ZlKHVzZXIuX2lkLCAoKSA9PiB7XG5cdFx0XHRcdHJ1bkFnZW50TGVhdmVBY3Rpb24odXNlci5faWQpO1xuXHRcdFx0fSk7XG5cdFx0fVxuXHR9XG59KTtcbiIsImltcG9ydCBzIGZyb20gJ3VuZGVyc2NvcmUuc3RyaW5nJztcblxuTWV0ZW9yLnB1Ymxpc2goJ2xpdmVjaGF0OmN1c3RvbUZpZWxkcycsIGZ1bmN0aW9uKF9pZCkge1xuXHRpZiAoIXRoaXMudXNlcklkKSB7XG5cdFx0cmV0dXJuIHRoaXMuZXJyb3IobmV3IE1ldGVvci5FcnJvcignZXJyb3Itbm90LWF1dGhvcml6ZWQnLCAnTm90IGF1dGhvcml6ZWQnLCB7IHB1Ymxpc2g6ICdsaXZlY2hhdDpjdXN0b21GaWVsZHMnIH0pKTtcblx0fVxuXG5cdGlmICghUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKHRoaXMudXNlcklkLCAndmlldy1sLXJvb20nKSkge1xuXHRcdHJldHVybiB0aGlzLmVycm9yKG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLW5vdC1hdXRob3JpemVkJywgJ05vdCBhdXRob3JpemVkJywgeyBwdWJsaXNoOiAnbGl2ZWNoYXQ6Y3VzdG9tRmllbGRzJyB9KSk7XG5cdH1cblxuXHRpZiAocy50cmltKF9pZCkpIHtcblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5tb2RlbHMuTGl2ZWNoYXRDdXN0b21GaWVsZC5maW5kKHsgX2lkIH0pO1xuXHR9XG5cblx0cmV0dXJuIFJvY2tldENoYXQubW9kZWxzLkxpdmVjaGF0Q3VzdG9tRmllbGQuZmluZCgpO1xuXG59KTtcbiIsIk1ldGVvci5wdWJsaXNoKCdsaXZlY2hhdDpkZXBhcnRtZW50QWdlbnRzJywgZnVuY3Rpb24oZGVwYXJ0bWVudElkKSB7XG5cdGlmICghdGhpcy51c2VySWQpIHtcblx0XHRyZXR1cm4gdGhpcy5lcnJvcihuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1ub3QtYXV0aG9yaXplZCcsICdOb3QgYXV0aG9yaXplZCcsIHsgcHVibGlzaDogJ2xpdmVjaGF0OmRlcGFydG1lbnRBZ2VudHMnIH0pKTtcblx0fVxuXG5cdGlmICghUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKHRoaXMudXNlcklkLCAndmlldy1saXZlY2hhdC1yb29tcycpKSB7XG5cdFx0cmV0dXJuIHRoaXMuZXJyb3IobmV3IE1ldGVvci5FcnJvcignZXJyb3Itbm90LWF1dGhvcml6ZWQnLCAnTm90IGF1dGhvcml6ZWQnLCB7IHB1Ymxpc2g6ICdsaXZlY2hhdDpkZXBhcnRtZW50QWdlbnRzJyB9KSk7XG5cdH1cblxuXHRyZXR1cm4gUm9ja2V0Q2hhdC5tb2RlbHMuTGl2ZWNoYXREZXBhcnRtZW50QWdlbnRzLmZpbmQoeyBkZXBhcnRtZW50SWQgfSk7XG59KTtcbiIsIk1ldGVvci5wdWJsaXNoKCdsaXZlY2hhdDpleHRlcm5hbE1lc3NhZ2VzJywgZnVuY3Rpb24ocm9vbUlkKSB7XG5cdHJldHVybiBSb2NrZXRDaGF0Lm1vZGVscy5MaXZlY2hhdEV4dGVybmFsTWVzc2FnZS5maW5kQnlSb29tSWQocm9vbUlkKTtcbn0pO1xuIiwiTWV0ZW9yLnB1Ymxpc2goJ2xpdmVjaGF0OmFnZW50cycsIGZ1bmN0aW9uKCkge1xuXHRpZiAoIXRoaXMudXNlcklkKSB7XG5cdFx0cmV0dXJuIHRoaXMuZXJyb3IobmV3IE1ldGVvci5FcnJvcignZXJyb3Itbm90LWF1dGhvcml6ZWQnLCAnTm90IGF1dGhvcml6ZWQnLCB7IHB1Ymxpc2g6ICdsaXZlY2hhdDphZ2VudHMnIH0pKTtcblx0fVxuXG5cdGlmICghUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKHRoaXMudXNlcklkLCAndmlldy1sLXJvb20nKSkge1xuXHRcdHJldHVybiB0aGlzLmVycm9yKG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLW5vdC1hdXRob3JpemVkJywgJ05vdCBhdXRob3JpemVkJywgeyBwdWJsaXNoOiAnbGl2ZWNoYXQ6YWdlbnRzJyB9KSk7XG5cdH1cblxuXHRjb25zdCBzZWxmID0gdGhpcztcblxuXHRjb25zdCBoYW5kbGUgPSBSb2NrZXRDaGF0LmF1dGh6LmdldFVzZXJzSW5Sb2xlKCdsaXZlY2hhdC1hZ2VudCcpLm9ic2VydmVDaGFuZ2VzKHtcblx0XHRhZGRlZChpZCwgZmllbGRzKSB7XG5cdFx0XHRzZWxmLmFkZGVkKCdhZ2VudFVzZXJzJywgaWQsIGZpZWxkcyk7XG5cdFx0fSxcblx0XHRjaGFuZ2VkKGlkLCBmaWVsZHMpIHtcblx0XHRcdHNlbGYuY2hhbmdlZCgnYWdlbnRVc2VycycsIGlkLCBmaWVsZHMpO1xuXHRcdH0sXG5cdFx0cmVtb3ZlZChpZCkge1xuXHRcdFx0c2VsZi5yZW1vdmVkKCdhZ2VudFVzZXJzJywgaWQpO1xuXHRcdH1cblx0fSk7XG5cblx0c2VsZi5yZWFkeSgpO1xuXG5cdHNlbGYub25TdG9wKGZ1bmN0aW9uKCkge1xuXHRcdGhhbmRsZS5zdG9wKCk7XG5cdH0pO1xufSk7XG4iLCJNZXRlb3IucHVibGlzaCgnbGl2ZWNoYXQ6YXBwZWFyYW5jZScsIGZ1bmN0aW9uKCkge1xuXHRpZiAoIXRoaXMudXNlcklkKSB7XG5cdFx0cmV0dXJuIHRoaXMuZXJyb3IobmV3IE1ldGVvci5FcnJvcignZXJyb3Itbm90LWF1dGhvcml6ZWQnLCAnTm90IGF1dGhvcml6ZWQnLCB7IHB1Ymxpc2g6ICdsaXZlY2hhdDphcHBlYXJhbmNlJyB9KSk7XG5cdH1cblxuXHRpZiAoIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih0aGlzLnVzZXJJZCwgJ3ZpZXctbGl2ZWNoYXQtbWFuYWdlcicpKSB7XG5cdFx0cmV0dXJuIHRoaXMuZXJyb3IobmV3IE1ldGVvci5FcnJvcignZXJyb3Itbm90LWF1dGhvcml6ZWQnLCAnTm90IGF1dGhvcml6ZWQnLCB7IHB1Ymxpc2g6ICdsaXZlY2hhdDphcHBlYXJhbmNlJyB9KSk7XG5cdH1cblxuXHRjb25zdCBxdWVyeSA9IHtcblx0XHRfaWQ6IHtcblx0XHRcdCRpbjogW1xuXHRcdFx0XHQnTGl2ZWNoYXRfdGl0bGUnLFxuXHRcdFx0XHQnTGl2ZWNoYXRfdGl0bGVfY29sb3InLFxuXHRcdFx0XHQnTGl2ZWNoYXRfc2hvd19hZ2VudF9lbWFpbCcsXG5cdFx0XHRcdCdMaXZlY2hhdF9kaXNwbGF5X29mZmxpbmVfZm9ybScsXG5cdFx0XHRcdCdMaXZlY2hhdF9vZmZsaW5lX2Zvcm1fdW5hdmFpbGFibGUnLFxuXHRcdFx0XHQnTGl2ZWNoYXRfb2ZmbGluZV9tZXNzYWdlJyxcblx0XHRcdFx0J0xpdmVjaGF0X29mZmxpbmVfc3VjY2Vzc19tZXNzYWdlJyxcblx0XHRcdFx0J0xpdmVjaGF0X29mZmxpbmVfdGl0bGUnLFxuXHRcdFx0XHQnTGl2ZWNoYXRfb2ZmbGluZV90aXRsZV9jb2xvcicsXG5cdFx0XHRcdCdMaXZlY2hhdF9vZmZsaW5lX2VtYWlsJyxcblx0XHRcdFx0J0xpdmVjaGF0X2NvbnZlcnNhdGlvbl9maW5pc2hlZF9tZXNzYWdlJ1xuXHRcdFx0XVxuXHRcdH1cblx0fTtcblxuXHRjb25zdCBzZWxmID0gdGhpcztcblxuXHRjb25zdCBoYW5kbGUgPSBSb2NrZXRDaGF0Lm1vZGVscy5TZXR0aW5ncy5maW5kKHF1ZXJ5KS5vYnNlcnZlQ2hhbmdlcyh7XG5cdFx0YWRkZWQoaWQsIGZpZWxkcykge1xuXHRcdFx0c2VsZi5hZGRlZCgnbGl2ZWNoYXRBcHBlYXJhbmNlJywgaWQsIGZpZWxkcyk7XG5cdFx0fSxcblx0XHRjaGFuZ2VkKGlkLCBmaWVsZHMpIHtcblx0XHRcdHNlbGYuY2hhbmdlZCgnbGl2ZWNoYXRBcHBlYXJhbmNlJywgaWQsIGZpZWxkcyk7XG5cdFx0fSxcblx0XHRyZW1vdmVkKGlkKSB7XG5cdFx0XHRzZWxmLnJlbW92ZWQoJ2xpdmVjaGF0QXBwZWFyYW5jZScsIGlkKTtcblx0XHR9XG5cdH0pO1xuXG5cdHRoaXMucmVhZHkoKTtcblxuXHR0aGlzLm9uU3RvcCgoKSA9PiB7XG5cdFx0aGFuZGxlLnN0b3AoKTtcblx0fSk7XG59KTtcbiIsIk1ldGVvci5wdWJsaXNoKCdsaXZlY2hhdDpkZXBhcnRtZW50cycsIGZ1bmN0aW9uKF9pZCkge1xuXHRpZiAoIXRoaXMudXNlcklkKSB7XG5cdFx0cmV0dXJuIHRoaXMuZXJyb3IobmV3IE1ldGVvci5FcnJvcignZXJyb3Itbm90LWF1dGhvcml6ZWQnLCAnTm90IGF1dGhvcml6ZWQnLCB7IHB1Ymxpc2g6ICdsaXZlY2hhdDphZ2VudHMnIH0pKTtcblx0fVxuXG5cdGlmICghUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKHRoaXMudXNlcklkLCAndmlldy1sLXJvb20nKSkge1xuXHRcdHJldHVybiB0aGlzLmVycm9yKG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLW5vdC1hdXRob3JpemVkJywgJ05vdCBhdXRob3JpemVkJywgeyBwdWJsaXNoOiAnbGl2ZWNoYXQ6YWdlbnRzJyB9KSk7XG5cdH1cblxuXHRpZiAoX2lkICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5tb2RlbHMuTGl2ZWNoYXREZXBhcnRtZW50LmZpbmRCeURlcGFydG1lbnRJZChfaWQpO1xuXHR9IGVsc2Uge1xuXHRcdHJldHVybiBSb2NrZXRDaGF0Lm1vZGVscy5MaXZlY2hhdERlcGFydG1lbnQuZmluZCgpO1xuXHR9XG5cbn0pO1xuIiwiTWV0ZW9yLnB1Ymxpc2goJ2xpdmVjaGF0OmludGVncmF0aW9uJywgZnVuY3Rpb24oKSB7XG5cdGlmICghdGhpcy51c2VySWQpIHtcblx0XHRyZXR1cm4gdGhpcy5lcnJvcihuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1ub3QtYXV0aG9yaXplZCcsICdOb3QgYXV0aG9yaXplZCcsIHsgcHVibGlzaDogJ2xpdmVjaGF0OmludGVncmF0aW9uJyB9KSk7XG5cdH1cblxuXHRpZiAoIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih0aGlzLnVzZXJJZCwgJ3ZpZXctbGl2ZWNoYXQtbWFuYWdlcicpKSB7XG5cdFx0cmV0dXJuIHRoaXMuZXJyb3IobmV3IE1ldGVvci5FcnJvcignZXJyb3Itbm90LWF1dGhvcml6ZWQnLCAnTm90IGF1dGhvcml6ZWQnLCB7IHB1Ymxpc2g6ICdsaXZlY2hhdDppbnRlZ3JhdGlvbicgfSkpO1xuXHR9XG5cblx0Y29uc3Qgc2VsZiA9IHRoaXM7XG5cblx0Y29uc3QgaGFuZGxlID0gUm9ja2V0Q2hhdC5tb2RlbHMuU2V0dGluZ3MuZmluZEJ5SWRzKFsnTGl2ZWNoYXRfd2ViaG9va1VybCcsICdMaXZlY2hhdF9zZWNyZXRfdG9rZW4nLCAnTGl2ZWNoYXRfd2ViaG9va19vbl9jbG9zZScsICdMaXZlY2hhdF93ZWJob29rX29uX29mZmxpbmVfbXNnJywgJ0xpdmVjaGF0X3dlYmhvb2tfb25fdmlzaXRvcl9tZXNzYWdlJywgJ0xpdmVjaGF0X3dlYmhvb2tfb25fYWdlbnRfbWVzc2FnZSddKS5vYnNlcnZlQ2hhbmdlcyh7XG5cdFx0YWRkZWQoaWQsIGZpZWxkcykge1xuXHRcdFx0c2VsZi5hZGRlZCgnbGl2ZWNoYXRJbnRlZ3JhdGlvbicsIGlkLCBmaWVsZHMpO1xuXHRcdH0sXG5cdFx0Y2hhbmdlZChpZCwgZmllbGRzKSB7XG5cdFx0XHRzZWxmLmNoYW5nZWQoJ2xpdmVjaGF0SW50ZWdyYXRpb24nLCBpZCwgZmllbGRzKTtcblx0XHR9LFxuXHRcdHJlbW92ZWQoaWQpIHtcblx0XHRcdHNlbGYucmVtb3ZlZCgnbGl2ZWNoYXRJbnRlZ3JhdGlvbicsIGlkKTtcblx0XHR9XG5cdH0pO1xuXG5cdHNlbGYucmVhZHkoKTtcblxuXHRzZWxmLm9uU3RvcChmdW5jdGlvbigpIHtcblx0XHRoYW5kbGUuc3RvcCgpO1xuXHR9KTtcbn0pO1xuIiwiTWV0ZW9yLnB1Ymxpc2goJ2xpdmVjaGF0Om1hbmFnZXJzJywgZnVuY3Rpb24oKSB7XG5cdGlmICghdGhpcy51c2VySWQpIHtcblx0XHRyZXR1cm4gdGhpcy5lcnJvcihuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1ub3QtYXV0aG9yaXplZCcsICdOb3QgYXV0aG9yaXplZCcsIHsgcHVibGlzaDogJ2xpdmVjaGF0Om1hbmFnZXJzJyB9KSk7XG5cdH1cblxuXHRpZiAoIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih0aGlzLnVzZXJJZCwgJ3ZpZXctbGl2ZWNoYXQtcm9vbXMnKSkge1xuXHRcdHJldHVybiB0aGlzLmVycm9yKG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLW5vdC1hdXRob3JpemVkJywgJ05vdCBhdXRob3JpemVkJywgeyBwdWJsaXNoOiAnbGl2ZWNoYXQ6bWFuYWdlcnMnIH0pKTtcblx0fVxuXG5cdGNvbnN0IHNlbGYgPSB0aGlzO1xuXG5cdGNvbnN0IGhhbmRsZSA9IFJvY2tldENoYXQuYXV0aHouZ2V0VXNlcnNJblJvbGUoJ2xpdmVjaGF0LW1hbmFnZXInKS5vYnNlcnZlQ2hhbmdlcyh7XG5cdFx0YWRkZWQoaWQsIGZpZWxkcykge1xuXHRcdFx0c2VsZi5hZGRlZCgnbWFuYWdlclVzZXJzJywgaWQsIGZpZWxkcyk7XG5cdFx0fSxcblx0XHRjaGFuZ2VkKGlkLCBmaWVsZHMpIHtcblx0XHRcdHNlbGYuY2hhbmdlZCgnbWFuYWdlclVzZXJzJywgaWQsIGZpZWxkcyk7XG5cdFx0fSxcblx0XHRyZW1vdmVkKGlkKSB7XG5cdFx0XHRzZWxmLnJlbW92ZWQoJ21hbmFnZXJVc2VycycsIGlkKTtcblx0XHR9XG5cdH0pO1xuXG5cdHNlbGYucmVhZHkoKTtcblxuXHRzZWxmLm9uU3RvcChmdW5jdGlvbigpIHtcblx0XHRoYW5kbGUuc3RvcCgpO1xuXHR9KTtcbn0pO1xuIiwiTWV0ZW9yLnB1Ymxpc2goJ2xpdmVjaGF0OnJvb21zJywgZnVuY3Rpb24oZmlsdGVyID0ge30sIG9mZnNldCA9IDAsIGxpbWl0ID0gMjApIHtcblx0aWYgKCF0aGlzLnVzZXJJZCkge1xuXHRcdHJldHVybiB0aGlzLmVycm9yKG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLW5vdC1hdXRob3JpemVkJywgJ05vdCBhdXRob3JpemVkJywgeyBwdWJsaXNoOiAnbGl2ZWNoYXQ6cm9vbXMnIH0pKTtcblx0fVxuXG5cdGlmICghUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKHRoaXMudXNlcklkLCAndmlldy1saXZlY2hhdC1yb29tcycpKSB7XG5cdFx0cmV0dXJuIHRoaXMuZXJyb3IobmV3IE1ldGVvci5FcnJvcignZXJyb3Itbm90LWF1dGhvcml6ZWQnLCAnTm90IGF1dGhvcml6ZWQnLCB7IHB1Ymxpc2g6ICdsaXZlY2hhdDpyb29tcycgfSkpO1xuXHR9XG5cblx0Y2hlY2soZmlsdGVyLCB7XG5cdFx0bmFtZTogTWF0Y2guTWF5YmUoU3RyaW5nKSwgLy8gcm9vbSBuYW1lIHRvIGZpbHRlclxuXHRcdGFnZW50OiBNYXRjaC5NYXliZShTdHJpbmcpLCAvLyBhZ2VudCBfaWQgd2hvIGlzIHNlcnZpbmdcblx0XHRzdGF0dXM6IE1hdGNoLk1heWJlKFN0cmluZyksIC8vIGVpdGhlciAnb3BlbmVkJyBvciAnY2xvc2VkJ1xuXHRcdGZyb206IE1hdGNoLk1heWJlKERhdGUpLFxuXHRcdHRvOiBNYXRjaC5NYXliZShEYXRlKVxuXHR9KTtcblxuXHRjb25zdCBxdWVyeSA9IHt9O1xuXHRpZiAoZmlsdGVyLm5hbWUpIHtcblx0XHRxdWVyeS5sYWJlbCA9IG5ldyBSZWdFeHAoZmlsdGVyLm5hbWUsICdpJyk7XG5cdH1cblx0aWYgKGZpbHRlci5hZ2VudCkge1xuXHRcdHF1ZXJ5WydzZXJ2ZWRCeS5faWQnXSA9IGZpbHRlci5hZ2VudDtcblx0fVxuXHRpZiAoZmlsdGVyLnN0YXR1cykge1xuXHRcdGlmIChmaWx0ZXIuc3RhdHVzID09PSAnb3BlbmVkJykge1xuXHRcdFx0cXVlcnkub3BlbiA9IHRydWU7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHF1ZXJ5Lm9wZW4gPSB7ICRleGlzdHM6IGZhbHNlIH07XG5cdFx0fVxuXHR9XG5cdGlmIChmaWx0ZXIuZnJvbSkge1xuXHRcdHF1ZXJ5LnRzID0ge1xuXHRcdFx0JGd0ZTogZmlsdGVyLmZyb21cblx0XHR9O1xuXHR9XG5cdGlmIChmaWx0ZXIudG8pIHtcblx0XHRmaWx0ZXIudG8uc2V0RGF0ZShmaWx0ZXIudG8uZ2V0RGF0ZSgpICsgMSk7XG5cdFx0ZmlsdGVyLnRvLnNldFNlY29uZHMoZmlsdGVyLnRvLmdldFNlY29uZHMoKSAtIDEpO1xuXG5cdFx0aWYgKCFxdWVyeS50cykge1xuXHRcdFx0cXVlcnkudHMgPSB7fTtcblx0XHR9XG5cdFx0cXVlcnkudHMuJGx0ZSA9IGZpbHRlci50bztcblx0fVxuXG5cdGNvbnN0IHNlbGYgPSB0aGlzO1xuXG5cdGNvbnN0IGhhbmRsZSA9IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRMaXZlY2hhdChxdWVyeSwgb2Zmc2V0LCBsaW1pdCkub2JzZXJ2ZUNoYW5nZXMoe1xuXHRcdGFkZGVkKGlkLCBmaWVsZHMpIHtcblx0XHRcdHNlbGYuYWRkZWQoJ2xpdmVjaGF0Um9vbScsIGlkLCBmaWVsZHMpO1xuXHRcdH0sXG5cdFx0Y2hhbmdlZChpZCwgZmllbGRzKSB7XG5cdFx0XHRzZWxmLmNoYW5nZWQoJ2xpdmVjaGF0Um9vbScsIGlkLCBmaWVsZHMpO1xuXHRcdH0sXG5cdFx0cmVtb3ZlZChpZCkge1xuXHRcdFx0c2VsZi5yZW1vdmVkKCdsaXZlY2hhdFJvb20nLCBpZCk7XG5cdFx0fVxuXHR9KTtcblxuXHR0aGlzLnJlYWR5KCk7XG5cblx0dGhpcy5vblN0b3AoKCkgPT4ge1xuXHRcdGhhbmRsZS5zdG9wKCk7XG5cdH0pO1xufSk7XG4iLCJNZXRlb3IucHVibGlzaCgnbGl2ZWNoYXQ6cXVldWUnLCBmdW5jdGlvbigpIHtcblx0aWYgKCF0aGlzLnVzZXJJZCkge1xuXHRcdHJldHVybiB0aGlzLmVycm9yKG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLW5vdC1hdXRob3JpemVkJywgJ05vdCBhdXRob3JpemVkJywgeyBwdWJsaXNoOiAnbGl2ZWNoYXQ6cXVldWUnIH0pKTtcblx0fVxuXG5cdGlmICghUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKHRoaXMudXNlcklkLCAndmlldy1sLXJvb20nKSkge1xuXHRcdHJldHVybiB0aGlzLmVycm9yKG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLW5vdC1hdXRob3JpemVkJywgJ05vdCBhdXRob3JpemVkJywgeyBwdWJsaXNoOiAnbGl2ZWNoYXQ6cXVldWUnIH0pKTtcblx0fVxuXG5cdC8vIGxldCBzb3J0ID0geyBjb3VudDogMSwgc29ydDogMSwgdXNlcm5hbWU6IDEgfTtcblx0Ly8gbGV0IG9ubGluZVVzZXJzID0ge307XG5cblx0Ly8gbGV0IGhhbmRsZVVzZXJzID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZE9ubGluZUFnZW50cygpLm9ic2VydmVDaGFuZ2VzKHtcblx0Ly8gXHRhZGRlZChpZCwgZmllbGRzKSB7XG5cdC8vIFx0XHRvbmxpbmVVc2Vyc1tmaWVsZHMudXNlcm5hbWVdID0gMTtcblx0Ly8gXHRcdC8vIHRoaXMuYWRkZWQoJ2xpdmVjaGF0UXVldWVVc2VyJywgaWQsIGZpZWxkcyk7XG5cdC8vIFx0fSxcblx0Ly8gXHRjaGFuZ2VkKGlkLCBmaWVsZHMpIHtcblx0Ly8gXHRcdG9ubGluZVVzZXJzW2ZpZWxkcy51c2VybmFtZV0gPSAxO1xuXHQvLyBcdFx0Ly8gdGhpcy5jaGFuZ2VkKCdsaXZlY2hhdFF1ZXVlVXNlcicsIGlkLCBmaWVsZHMpO1xuXHQvLyBcdH0sXG5cdC8vIFx0cmVtb3ZlZChpZCkge1xuXHQvLyBcdFx0dGhpcy5yZW1vdmVkKCdsaXZlY2hhdFF1ZXVlVXNlcicsIGlkKTtcblx0Ly8gXHR9XG5cdC8vIH0pO1xuXG5cdGNvbnN0IHNlbGYgPSB0aGlzO1xuXG5cdGNvbnN0IGhhbmRsZURlcHRzID0gUm9ja2V0Q2hhdC5tb2RlbHMuTGl2ZWNoYXREZXBhcnRtZW50QWdlbnRzLmZpbmRVc2Vyc0luUXVldWUoKS5vYnNlcnZlQ2hhbmdlcyh7XG5cdFx0YWRkZWQoaWQsIGZpZWxkcykge1xuXHRcdFx0c2VsZi5hZGRlZCgnbGl2ZWNoYXRRdWV1ZVVzZXInLCBpZCwgZmllbGRzKTtcblx0XHR9LFxuXHRcdGNoYW5nZWQoaWQsIGZpZWxkcykge1xuXHRcdFx0c2VsZi5jaGFuZ2VkKCdsaXZlY2hhdFF1ZXVlVXNlcicsIGlkLCBmaWVsZHMpO1xuXHRcdH0sXG5cdFx0cmVtb3ZlZChpZCkge1xuXHRcdFx0c2VsZi5yZW1vdmVkKCdsaXZlY2hhdFF1ZXVlVXNlcicsIGlkKTtcblx0XHR9XG5cdH0pO1xuXG5cdHRoaXMucmVhZHkoKTtcblxuXHR0aGlzLm9uU3RvcCgoKSA9PiB7XG5cdFx0Ly8gaGFuZGxlVXNlcnMuc3RvcCgpO1xuXHRcdGhhbmRsZURlcHRzLnN0b3AoKTtcblx0fSk7XG59KTtcbiIsIk1ldGVvci5wdWJsaXNoKCdsaXZlY2hhdDp0cmlnZ2VycycsIGZ1bmN0aW9uKF9pZCkge1xuXHRpZiAoIXRoaXMudXNlcklkKSB7XG5cdFx0cmV0dXJuIHRoaXMuZXJyb3IobmV3IE1ldGVvci5FcnJvcignZXJyb3Itbm90LWF1dGhvcml6ZWQnLCAnTm90IGF1dGhvcml6ZWQnLCB7IHB1Ymxpc2g6ICdsaXZlY2hhdDp0cmlnZ2VycycgfSkpO1xuXHR9XG5cblx0aWYgKCFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odGhpcy51c2VySWQsICd2aWV3LWxpdmVjaGF0LW1hbmFnZXInKSkge1xuXHRcdHJldHVybiB0aGlzLmVycm9yKG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLW5vdC1hdXRob3JpemVkJywgJ05vdCBhdXRob3JpemVkJywgeyBwdWJsaXNoOiAnbGl2ZWNoYXQ6dHJpZ2dlcnMnIH0pKTtcblx0fVxuXG5cdGlmIChfaWQgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJldHVybiBSb2NrZXRDaGF0Lm1vZGVscy5MaXZlY2hhdFRyaWdnZXIuZmluZEJ5SWQoX2lkKTtcblx0fSBlbHNlIHtcblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5tb2RlbHMuTGl2ZWNoYXRUcmlnZ2VyLmZpbmQoKTtcblx0fVxufSk7XG4iLCJNZXRlb3IucHVibGlzaCgnbGl2ZWNoYXQ6dmlzaXRvckhpc3RvcnknLCBmdW5jdGlvbih7IHJpZDogcm9vbUlkIH0pIHtcblx0aWYgKCF0aGlzLnVzZXJJZCkge1xuXHRcdHJldHVybiB0aGlzLmVycm9yKG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLW5vdC1hdXRob3JpemVkJywgJ05vdCBhdXRob3JpemVkJywgeyBwdWJsaXNoOiAnbGl2ZWNoYXQ6dmlzaXRvckhpc3RvcnknIH0pKTtcblx0fVxuXG5cdGlmICghUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKHRoaXMudXNlcklkLCAndmlldy1sLXJvb20nKSkge1xuXHRcdHJldHVybiB0aGlzLmVycm9yKG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLW5vdC1hdXRob3JpemVkJywgJ05vdCBhdXRob3JpemVkJywgeyBwdWJsaXNoOiAnbGl2ZWNoYXQ6dmlzaXRvckhpc3RvcnknIH0pKTtcblx0fVxuXG5cdGNvbnN0IHJvb20gPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT25lQnlJZChyb29tSWQpO1xuXG5cdGNvbnN0IHVzZXIgPSBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kT25lQnlJZCh0aGlzLnVzZXJJZCk7XG5cblx0aWYgKHJvb20udXNlcm5hbWVzLmluZGV4T2YodXNlci51c2VybmFtZSkgPT09IC0xKSB7XG5cdFx0cmV0dXJuIHRoaXMuZXJyb3IobmV3IE1ldGVvci5FcnJvcignZXJyb3Itbm90LWF1dGhvcml6ZWQnLCAnTm90IGF1dGhvcml6ZWQnLCB7IHB1Ymxpc2g6ICdsaXZlY2hhdDp2aXNpdG9ySGlzdG9yeScgfSkpO1xuXHR9XG5cblx0aWYgKHJvb20gJiYgcm9vbS52ICYmIHJvb20udi5faWQpIHtcblx0XHQvLyBDQUNIRTogY2FuIHdlIHN0b3AgdXNpbmcgcHVibGljYXRpb25zIGhlcmU/XG5cdFx0cmV0dXJuIFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRCeVZpc2l0b3JJZChyb29tLnYuX2lkKTtcblx0fSBlbHNlIHtcblx0XHRyZXR1cm4gdGhpcy5yZWFkeSgpO1xuXHR9XG59KTtcbiIsImltcG9ydCBMaXZlY2hhdFZpc2l0b3JzIGZyb20gJy4uL21vZGVscy9MaXZlY2hhdFZpc2l0b3JzJztcblxuTWV0ZW9yLnB1Ymxpc2goJ2xpdmVjaGF0OnZpc2l0b3JJbmZvJywgZnVuY3Rpb24oeyByaWQ6IHJvb21JZCB9KSB7XG5cdGlmICghdGhpcy51c2VySWQpIHtcblx0XHRyZXR1cm4gdGhpcy5lcnJvcihuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1ub3QtYXV0aG9yaXplZCcsICdOb3QgYXV0aG9yaXplZCcsIHsgcHVibGlzaDogJ2xpdmVjaGF0OnZpc2l0b3JJbmZvJyB9KSk7XG5cdH1cblxuXHRpZiAoIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih0aGlzLnVzZXJJZCwgJ3ZpZXctbC1yb29tJykpIHtcblx0XHRyZXR1cm4gdGhpcy5lcnJvcihuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1ub3QtYXV0aG9yaXplZCcsICdOb3QgYXV0aG9yaXplZCcsIHsgcHVibGlzaDogJ2xpdmVjaGF0OnZpc2l0b3JJbmZvJyB9KSk7XG5cdH1cblxuXHRjb25zdCByb29tID0gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9uZUJ5SWQocm9vbUlkKTtcblxuXHRpZiAocm9vbSAmJiByb29tLnYgJiYgcm9vbS52Ll9pZCkge1xuXHRcdHJldHVybiBMaXZlY2hhdFZpc2l0b3JzLmZpbmRCeUlkKHJvb20udi5faWQpO1xuXHR9IGVsc2Uge1xuXHRcdHJldHVybiB0aGlzLnJlYWR5KCk7XG5cdH1cbn0pO1xuIiwiTWV0ZW9yLnB1Ymxpc2goJ2xpdmVjaGF0OnZpc2l0b3JQYWdlVmlzaXRlZCcsIGZ1bmN0aW9uKHsgcmlkOiByb29tSWQgfSkge1xuXHRpZiAoIXRoaXMudXNlcklkKSB7XG5cdFx0cmV0dXJuIHRoaXMuZXJyb3IobmV3IE1ldGVvci5FcnJvcignZXJyb3Itbm90LWF1dGhvcml6ZWQnLCAnTm90IGF1dGhvcml6ZWQnLCB7IHB1Ymxpc2g6ICdsaXZlY2hhdDp2aXNpdG9yUGFnZVZpc2l0ZWQnIH0pKTtcblx0fVxuXG5cdGlmICghUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKHRoaXMudXNlcklkLCAndmlldy1sLXJvb20nKSkge1xuXHRcdHJldHVybiB0aGlzLmVycm9yKG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLW5vdC1hdXRob3JpemVkJywgJ05vdCBhdXRob3JpemVkJywgeyBwdWJsaXNoOiAnbGl2ZWNoYXQ6dmlzaXRvclBhZ2VWaXNpdGVkJyB9KSk7XG5cdH1cblxuXHRjb25zdCByb29tID0gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9uZUJ5SWQocm9vbUlkKTtcblxuXHRpZiAocm9vbSAmJiByb29tLnYgJiYgcm9vbS52LnRva2VuKSB7XG5cdFx0cmV0dXJuIFJvY2tldENoYXQubW9kZWxzLkxpdmVjaGF0UGFnZVZpc2l0ZWQuZmluZEJ5VG9rZW4ocm9vbS52LnRva2VuKTtcblx0fSBlbHNlIHtcblx0XHRyZXR1cm4gdGhpcy5yZWFkeSgpO1xuXHR9XG59KTtcbiIsIk1ldGVvci5wdWJsaXNoKCdsaXZlY2hhdDppbnF1aXJ5JywgZnVuY3Rpb24oKSB7XG5cdGlmICghdGhpcy51c2VySWQpIHtcblx0XHRyZXR1cm4gdGhpcy5lcnJvcihuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1ub3QtYXV0aG9yaXplZCcsICdOb3QgYXV0aG9yaXplZCcsIHsgcHVibGlzaDogJ2xpdmVjaGF0OmlucXVpcnknIH0pKTtcblx0fVxuXG5cdGlmICghUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKHRoaXMudXNlcklkLCAndmlldy1sLXJvb20nKSkge1xuXHRcdHJldHVybiB0aGlzLmVycm9yKG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLW5vdC1hdXRob3JpemVkJywgJ05vdCBhdXRob3JpemVkJywgeyBwdWJsaXNoOiAnbGl2ZWNoYXQ6aW5xdWlyeScgfSkpO1xuXHR9XG5cblx0Y29uc3QgcXVlcnkgPSB7XG5cdFx0YWdlbnRzOiB0aGlzLnVzZXJJZCxcblx0XHRzdGF0dXM6ICdvcGVuJ1xuXHR9O1xuXG5cdHJldHVybiBSb2NrZXRDaGF0Lm1vZGVscy5MaXZlY2hhdElucXVpcnkuZmluZChxdWVyeSk7XG59KTtcbiIsIk1ldGVvci5wdWJsaXNoKCdsaXZlY2hhdDpvZmZpY2VIb3VyJywgZnVuY3Rpb24oKSB7XG5cdGlmICghUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKHRoaXMudXNlcklkLCAndmlldy1sLXJvb20nKSkge1xuXHRcdHJldHVybiB0aGlzLmVycm9yKG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLW5vdC1hdXRob3JpemVkJywgJ05vdCBhdXRob3JpemVkJywgeyBwdWJsaXNoOiAnbGl2ZWNoYXQ6YWdlbnRzJyB9KSk7XG5cdH1cblxuXHRyZXR1cm4gUm9ja2V0Q2hhdC5tb2RlbHMuTGl2ZWNoYXRPZmZpY2VIb3VyLmZpbmQoKTtcbn0pO1xuIiwiaW1wb3J0ICcuLi9pbXBvcnRzL3NlcnZlci9yZXN0L2RlcGFydG1lbnRzLmpzJztcbmltcG9ydCAnLi4vaW1wb3J0cy9zZXJ2ZXIvcmVzdC9mYWNlYm9vay5qcyc7XG5pbXBvcnQgJy4uL2ltcG9ydHMvc2VydmVyL3Jlc3Qvc21zLmpzJztcbmltcG9ydCAnLi4vaW1wb3J0cy9zZXJ2ZXIvcmVzdC91c2Vycy5qcyc7XG5pbXBvcnQgJy4uL2ltcG9ydHMvc2VydmVyL3Jlc3QvbWVzc2FnZXMuanMnO1xuaW1wb3J0ICcuLi9pbXBvcnRzL3NlcnZlci9yZXN0L3Zpc2l0b3JzLmpzJztcbiIsImltcG9ydCBfIGZyb20gJ3VuZGVyc2NvcmUnO1xuXG5NZXRlb3Iuc3RhcnR1cCgoKSA9PiB7XG5cdGNvbnN0IHJvbGVzID0gXy5wbHVjayhSb2NrZXRDaGF0Lm1vZGVscy5Sb2xlcy5maW5kKCkuZmV0Y2goKSwgJ25hbWUnKTtcblx0aWYgKHJvbGVzLmluZGV4T2YoJ2xpdmVjaGF0LWFnZW50JykgPT09IC0xKSB7XG5cdFx0Um9ja2V0Q2hhdC5tb2RlbHMuUm9sZXMuY3JlYXRlT3JVcGRhdGUoJ2xpdmVjaGF0LWFnZW50Jyk7XG5cdH1cblx0aWYgKHJvbGVzLmluZGV4T2YoJ2xpdmVjaGF0LW1hbmFnZXInKSA9PT0gLTEpIHtcblx0XHRSb2NrZXRDaGF0Lm1vZGVscy5Sb2xlcy5jcmVhdGVPclVwZGF0ZSgnbGl2ZWNoYXQtbWFuYWdlcicpO1xuXHR9XG5cdGlmIChyb2xlcy5pbmRleE9mKCdsaXZlY2hhdC1ndWVzdCcpID09PSAtMSkge1xuXHRcdFJvY2tldENoYXQubW9kZWxzLlJvbGVzLmNyZWF0ZU9yVXBkYXRlKCdsaXZlY2hhdC1ndWVzdCcpO1xuXHR9XG5cdGlmIChSb2NrZXRDaGF0Lm1vZGVscyAmJiBSb2NrZXRDaGF0Lm1vZGVscy5QZXJtaXNzaW9ucykge1xuXHRcdFJvY2tldENoYXQubW9kZWxzLlBlcm1pc3Npb25zLmNyZWF0ZU9yVXBkYXRlKCd2aWV3LWwtcm9vbScsIFsnbGl2ZWNoYXQtYWdlbnQnLCAnbGl2ZWNoYXQtbWFuYWdlcicsICdhZG1pbiddKTtcblx0XHRSb2NrZXRDaGF0Lm1vZGVscy5QZXJtaXNzaW9ucy5jcmVhdGVPclVwZGF0ZSgndmlldy1saXZlY2hhdC1tYW5hZ2VyJywgWydsaXZlY2hhdC1tYW5hZ2VyJywgJ2FkbWluJ10pO1xuXHRcdFJvY2tldENoYXQubW9kZWxzLlBlcm1pc3Npb25zLmNyZWF0ZU9yVXBkYXRlKCd2aWV3LWxpdmVjaGF0LXJvb21zJywgWydsaXZlY2hhdC1tYW5hZ2VyJywgJ2FkbWluJ10pO1xuXHRcdFJvY2tldENoYXQubW9kZWxzLlBlcm1pc3Npb25zLmNyZWF0ZU9yVXBkYXRlKCdjbG9zZS1saXZlY2hhdC1yb29tJywgWydsaXZlY2hhdC1hZ2VudCcsICdsaXZlY2hhdC1tYW5hZ2VyJywgJ2FkbWluJ10pO1xuXHRcdFJvY2tldENoYXQubW9kZWxzLlBlcm1pc3Npb25zLmNyZWF0ZU9yVXBkYXRlKCdjbG9zZS1vdGhlcnMtbGl2ZWNoYXQtcm9vbScsIFsnbGl2ZWNoYXQtbWFuYWdlcicsICdhZG1pbiddKTtcblx0XHRSb2NrZXRDaGF0Lm1vZGVscy5QZXJtaXNzaW9ucy5jcmVhdGVPclVwZGF0ZSgnc2F2ZS1vdGhlcnMtbGl2ZWNoYXQtcm9vbS1pbmZvJywgWydsaXZlY2hhdC1tYW5hZ2VyJ10pO1xuXHR9XG59KTtcbiIsIlJvY2tldENoYXQuTWVzc2FnZVR5cGVzLnJlZ2lzdGVyVHlwZSh7XG5cdGlkOiAnbGl2ZWNoYXRfdmlkZW9fY2FsbCcsXG5cdHN5c3RlbTogdHJ1ZSxcblx0bWVzc2FnZTogJ05ld192aWRlb2NhbGxfcmVxdWVzdCdcbn0pO1xuXG5Sb2NrZXRDaGF0LmFjdGlvbkxpbmtzLnJlZ2lzdGVyKCdjcmVhdGVMaXZlY2hhdENhbGwnLCBmdW5jdGlvbihtZXNzYWdlLCBwYXJhbXMsIGluc3RhbmNlKSB7XG5cdGlmIChNZXRlb3IuaXNDbGllbnQpIHtcblx0XHRpbnN0YW5jZS50YWJCYXIub3BlbigndmlkZW8nKTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuYWN0aW9uTGlua3MucmVnaXN0ZXIoJ2RlbnlMaXZlY2hhdENhbGwnLCBmdW5jdGlvbihtZXNzYWdlLyosIHBhcmFtcyovKSB7XG5cdGlmIChNZXRlb3IuaXNTZXJ2ZXIpIHtcblx0XHRjb25zdCB1c2VyID0gTWV0ZW9yLnVzZXIoKTtcblxuXHRcdFJvY2tldENoYXQubW9kZWxzLk1lc3NhZ2VzLmNyZWF0ZVdpdGhUeXBlUm9vbUlkTWVzc2FnZUFuZFVzZXIoJ2NvbW1hbmQnLCBtZXNzYWdlLnJpZCwgJ2VuZENhbGwnLCB1c2VyKTtcblx0XHRSb2NrZXRDaGF0Lk5vdGlmaWNhdGlvbnMubm90aWZ5Um9vbShtZXNzYWdlLnJpZCwgJ2RlbGV0ZU1lc3NhZ2UnLCB7IF9pZDogbWVzc2FnZS5faWQgfSk7XG5cblx0XHRjb25zdCBsYW5ndWFnZSA9IHVzZXIubGFuZ3VhZ2UgfHwgUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ2xhbmd1YWdlJykgfHwgJ2VuJztcblxuXHRcdFJvY2tldENoYXQuTGl2ZWNoYXQuY2xvc2VSb29tKHtcblx0XHRcdHVzZXIsXG5cdFx0XHRyb29tOiBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT25lQnlJZChtZXNzYWdlLnJpZCksXG5cdFx0XHRjb21tZW50OiBUQVBpMThuLl9fKCdWaWRlb2NhbGxfZGVjbGluZWQnLCB7IGxuZzogbGFuZ3VhZ2UgfSlcblx0XHR9KTtcblx0XHRNZXRlb3IuZGVmZXIoKCkgPT4ge1xuXHRcdFx0Um9ja2V0Q2hhdC5tb2RlbHMuTWVzc2FnZXMuc2V0SGlkZGVuQnlJZChtZXNzYWdlLl9pZCk7XG5cdFx0fSk7XG5cdH1cbn0pO1xuIiwiLyogZ2xvYmFscyBvcGVuUm9vbSwgTGl2ZWNoYXRJbnF1aXJ5ICovXG5pbXBvcnQge1Jvb21TZXR0aW5nc0VudW0sIFJvb21UeXBlQ29uZmlnLCBSb29tVHlwZVJvdXRlQ29uZmlnLCBVaVRleHRDb250ZXh0fSBmcm9tICdtZXRlb3Ivcm9ja2V0Y2hhdDpsaWInO1xuXG5jbGFzcyBMaXZlY2hhdFJvb21Sb3V0ZSBleHRlbmRzIFJvb21UeXBlUm91dGVDb25maWcge1xuXHRjb25zdHJ1Y3RvcigpIHtcblx0XHRzdXBlcih7XG5cdFx0XHRuYW1lOiAnbGl2ZScsXG5cdFx0XHRwYXRoOiAnL2xpdmUvOmNvZGUoXFxcXGQrKSdcblx0XHR9KTtcblx0fVxuXG5cdGFjdGlvbihwYXJhbXMpIHtcblx0XHRvcGVuUm9vbSgnbCcsIHBhcmFtcy5jb2RlKTtcblx0fVxuXG5cdGxpbmsoc3ViKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdGNvZGU6IHN1Yi5jb2RlXG5cdFx0fTtcblx0fVxufVxuXG5jbGFzcyBMaXZlY2hhdFJvb21UeXBlIGV4dGVuZHMgUm9vbVR5cGVDb25maWcge1xuXHRjb25zdHJ1Y3RvcigpIHtcblx0XHRzdXBlcih7XG5cdFx0XHRpZGVudGlmaWVyOiAnbCcsXG5cdFx0XHRvcmRlcjogNSxcblx0XHRcdC8vIGljb246ICdsaXZlY2hhdCcsXG5cdFx0XHRsYWJlbDogJ0xpdmVjaGF0Jyxcblx0XHRcdHJvdXRlOiBuZXcgTGl2ZWNoYXRSb29tUm91dGUoKVxuXHRcdH0pO1xuXG5cdFx0dGhpcy5ub3RTdWJzY3JpYmVkVHBsID0ge1xuXHRcdFx0dGVtcGxhdGU6ICdsaXZlY2hhdE5vdFN1YnNjcmliZWQnXG5cdFx0fTtcblx0fVxuXG5cdGZpbmRSb29tKGlkZW50aWZpZXIpIHtcblx0XHRyZXR1cm4gQ2hhdFJvb20uZmluZE9uZSh7Y29kZTogcGFyc2VJbnQoaWRlbnRpZmllcil9KTtcblx0fVxuXG5cdHJvb21OYW1lKHJvb21EYXRhKSB7XG5cdFx0aWYgKCFyb29tRGF0YS5uYW1lKSB7XG5cdFx0XHRyZXR1cm4gcm9vbURhdGEubGFiZWw7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHJldHVybiByb29tRGF0YS5uYW1lO1xuXHRcdH1cblx0fVxuXG5cdGNvbmRpdGlvbigpIHtcblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0xpdmVjaGF0X2VuYWJsZWQnKSAmJiBSb2NrZXRDaGF0LmF1dGh6Lmhhc0FsbFBlcm1pc3Npb24oJ3ZpZXctbC1yb29tJyk7XG5cdH1cblxuXHRjYW5TZW5kTWVzc2FnZShyb29tSWQpIHtcblx0XHRjb25zdCByb29tID0gQ2hhdFJvb20uZmluZE9uZSh7X2lkOiByb29tSWR9LCB7ZmllbGRzOiB7b3BlbjogMX19KTtcblx0XHRyZXR1cm4gcm9vbSAmJiByb29tLm9wZW4gPT09IHRydWU7XG5cdH1cblxuXHRnZXRVc2VyU3RhdHVzKHJvb21JZCkge1xuXHRcdGNvbnN0IHJvb20gPSBTZXNzaW9uLmdldChgcm9vbURhdGEkeyByb29tSWQgfWApO1xuXHRcdGlmIChyb29tKSB7XG5cdFx0XHRyZXR1cm4gcm9vbS52ICYmIHJvb20udi5zdGF0dXM7XG5cdFx0fVxuXG5cdFx0Y29uc3QgaW5xdWlyeSA9IExpdmVjaGF0SW5xdWlyeS5maW5kT25lKHsgcmlkOiByb29tSWQgfSk7XG5cdFx0cmV0dXJuIGlucXVpcnkgJiYgaW5xdWlyeS52ICYmIGlucXVpcnkudi5zdGF0dXM7XG5cdH1cblxuXHRhbGxvd1Jvb21TZXR0aW5nQ2hhbmdlKHJvb20sIHNldHRpbmcpIHtcblx0XHRzd2l0Y2ggKHNldHRpbmcpIHtcblx0XHRcdGNhc2UgUm9vbVNldHRpbmdzRW51bS5KT0lOX0NPREU6XG5cdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdGRlZmF1bHQ6XG5cdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblx0fVxuXG5cdGdldFVpVGV4dChjb250ZXh0KSB7XG5cdFx0c3dpdGNoIChjb250ZXh0KSB7XG5cdFx0XHRjYXNlIFVpVGV4dENvbnRleHQuSElERV9XQVJOSU5HOlxuXHRcdFx0XHRyZXR1cm4gJ0hpZGVfTGl2ZWNoYXRfV2FybmluZyc7XG5cdFx0XHRjYXNlIFVpVGV4dENvbnRleHQuTEVBVkVfV0FSTklORzpcblx0XHRcdFx0cmV0dXJuICdIaWRlX0xpdmVjaGF0X1dhcm5pbmcnO1xuXHRcdFx0ZGVmYXVsdDpcblx0XHRcdFx0cmV0dXJuICcnO1xuXHRcdH1cblx0fVxufVxuXG5Sb2NrZXRDaGF0LnJvb21UeXBlcy5hZGQobmV3IExpdmVjaGF0Um9vbVR5cGUoKSk7XG4iLCJNZXRlb3Iuc3RhcnR1cChmdW5jdGlvbigpIHtcblx0Um9ja2V0Q2hhdC5zZXR0aW5ncy5hZGRHcm91cCgnTGl2ZWNoYXQnKTtcblxuXHRSb2NrZXRDaGF0LnNldHRpbmdzLmFkZCgnTGl2ZWNoYXRfZW5hYmxlZCcsIGZhbHNlLCB7IHR5cGU6ICdib29sZWFuJywgZ3JvdXA6ICdMaXZlY2hhdCcsIHB1YmxpYzogdHJ1ZSB9KTtcblxuXHRSb2NrZXRDaGF0LnNldHRpbmdzLmFkZCgnTGl2ZWNoYXRfdGl0bGUnLCAnUm9ja2V0LkNoYXQnLCB7IHR5cGU6ICdzdHJpbmcnLCBncm91cDogJ0xpdmVjaGF0JywgcHVibGljOiB0cnVlIH0pO1xuXHRSb2NrZXRDaGF0LnNldHRpbmdzLmFkZCgnTGl2ZWNoYXRfdGl0bGVfY29sb3InLCAnI0MxMjcyRCcsIHsgdHlwZTogJ2NvbG9yJywgZ3JvdXA6ICdMaXZlY2hhdCcsIHB1YmxpYzogdHJ1ZSB9KTtcblxuXHRSb2NrZXRDaGF0LnNldHRpbmdzLmFkZCgnTGl2ZWNoYXRfZGlzcGxheV9vZmZsaW5lX2Zvcm0nLCB0cnVlLCB7XG5cdFx0dHlwZTogJ2Jvb2xlYW4nLFxuXHRcdGdyb3VwOiAnTGl2ZWNoYXQnLFxuXHRcdHB1YmxpYzogdHJ1ZSxcblx0XHRzZWN0aW9uOiAnT2ZmbGluZScsXG5cdFx0aTE4bkxhYmVsOiAnRGlzcGxheV9vZmZsaW5lX2Zvcm0nXG5cdH0pO1xuXG5cdFJvY2tldENoYXQuc2V0dGluZ3MuYWRkKCdMaXZlY2hhdF92YWxpZGF0ZV9vZmZsaW5lX2VtYWlsJywgdHJ1ZSwge1xuXHRcdHR5cGU6ICdib29sZWFuJyxcblx0XHRncm91cDogJ0xpdmVjaGF0Jyxcblx0XHRwdWJsaWM6IHRydWUsXG5cdFx0c2VjdGlvbjogJ09mZmxpbmUnLFxuXHRcdGkxOG5MYWJlbDogJ1ZhbGlkYXRlX2VtYWlsX2FkZHJlc3MnXG5cdH0pO1xuXG5cdFJvY2tldENoYXQuc2V0dGluZ3MuYWRkKCdMaXZlY2hhdF9vZmZsaW5lX2Zvcm1fdW5hdmFpbGFibGUnLCAnJywge1xuXHRcdHR5cGU6ICdzdHJpbmcnLFxuXHRcdGdyb3VwOiAnTGl2ZWNoYXQnLFxuXHRcdHB1YmxpYzogdHJ1ZSxcblx0XHRzZWN0aW9uOiAnT2ZmbGluZScsXG5cdFx0aTE4bkxhYmVsOiAnT2ZmbGluZV9mb3JtX3VuYXZhaWxhYmxlX21lc3NhZ2UnXG5cdH0pO1xuXG5cdFJvY2tldENoYXQuc2V0dGluZ3MuYWRkKCdMaXZlY2hhdF9vZmZsaW5lX3RpdGxlJywgJ0xlYXZlIGEgbWVzc2FnZScsIHtcblx0XHR0eXBlOiAnc3RyaW5nJyxcblx0XHRncm91cDogJ0xpdmVjaGF0Jyxcblx0XHRwdWJsaWM6IHRydWUsXG5cdFx0c2VjdGlvbjogJ09mZmxpbmUnLFxuXHRcdGkxOG5MYWJlbDogJ1RpdGxlJ1xuXHR9KTtcblx0Um9ja2V0Q2hhdC5zZXR0aW5ncy5hZGQoJ0xpdmVjaGF0X29mZmxpbmVfdGl0bGVfY29sb3InLCAnIzY2NjY2NicsIHtcblx0XHR0eXBlOiAnY29sb3InLFxuXHRcdGdyb3VwOiAnTGl2ZWNoYXQnLFxuXHRcdHB1YmxpYzogdHJ1ZSxcblx0XHRzZWN0aW9uOiAnT2ZmbGluZScsXG5cdFx0aTE4bkxhYmVsOiAnQ29sb3InXG5cdH0pO1xuXHRSb2NrZXRDaGF0LnNldHRpbmdzLmFkZCgnTGl2ZWNoYXRfb2ZmbGluZV9tZXNzYWdlJywgJycsIHtcblx0XHR0eXBlOiAnc3RyaW5nJyxcblx0XHRncm91cDogJ0xpdmVjaGF0Jyxcblx0XHRwdWJsaWM6IHRydWUsXG5cdFx0c2VjdGlvbjogJ09mZmxpbmUnLFxuXHRcdGkxOG5MYWJlbDogJ0luc3RydWN0aW9ucycsXG5cdFx0aTE4bkRlc2NyaXB0aW9uOiAnSW5zdHJ1Y3Rpb25zX3RvX3lvdXJfdmlzaXRvcl9maWxsX3RoZV9mb3JtX3RvX3NlbmRfYV9tZXNzYWdlJ1xuXHR9KTtcblx0Um9ja2V0Q2hhdC5zZXR0aW5ncy5hZGQoJ0xpdmVjaGF0X29mZmxpbmVfZW1haWwnLCAnJywge1xuXHRcdHR5cGU6ICdzdHJpbmcnLFxuXHRcdGdyb3VwOiAnTGl2ZWNoYXQnLFxuXHRcdGkxOG5MYWJlbDogJ0VtYWlsX2FkZHJlc3NfdG9fc2VuZF9vZmZsaW5lX21lc3NhZ2VzJyxcblx0XHRzZWN0aW9uOiAnT2ZmbGluZSdcblx0fSk7XG5cdFJvY2tldENoYXQuc2V0dGluZ3MuYWRkKCdMaXZlY2hhdF9vZmZsaW5lX3N1Y2Nlc3NfbWVzc2FnZScsICcnLCB7XG5cdFx0dHlwZTogJ3N0cmluZycsXG5cdFx0Z3JvdXA6ICdMaXZlY2hhdCcsXG5cdFx0cHVibGljOiB0cnVlLFxuXHRcdHNlY3Rpb246ICdPZmZsaW5lJyxcblx0XHRpMThuTGFiZWw6ICdPZmZsaW5lX3N1Y2Nlc3NfbWVzc2FnZSdcblx0fSk7XG5cblx0Um9ja2V0Q2hhdC5zZXR0aW5ncy5hZGQoJ0xpdmVjaGF0X3JlZ2lzdHJhdGlvbl9mb3JtJywgdHJ1ZSwgeyB0eXBlOiAnYm9vbGVhbicsIGdyb3VwOiAnTGl2ZWNoYXQnLCBwdWJsaWM6IHRydWUsIGkxOG5MYWJlbDogJ1Nob3dfcHJlcmVnaXN0cmF0aW9uX2Zvcm0nIH0pO1xuXHRSb2NrZXRDaGF0LnNldHRpbmdzLmFkZCgnTGl2ZWNoYXRfYWxsb3dfc3dpdGNoaW5nX2RlcGFydG1lbnRzJywgdHJ1ZSwgeyB0eXBlOiAnYm9vbGVhbicsIGdyb3VwOiAnTGl2ZWNoYXQnLCBwdWJsaWM6IHRydWUsIGkxOG5MYWJlbDogJ0FsbG93X3N3aXRjaGluZ19kZXBhcnRtZW50cycgfSk7XG5cdFJvY2tldENoYXQuc2V0dGluZ3MuYWRkKCdMaXZlY2hhdF9zaG93X2FnZW50X2VtYWlsJywgdHJ1ZSwgeyB0eXBlOiAnYm9vbGVhbicsIGdyb3VwOiAnTGl2ZWNoYXQnLCBwdWJsaWM6IHRydWUsIGkxOG5MYWJlbDogJ1Nob3dfYWdlbnRfZW1haWwnIH0pO1xuXG5cdFJvY2tldENoYXQuc2V0dGluZ3MuYWRkKCdMaXZlY2hhdF9jb252ZXJzYXRpb25fZmluaXNoZWRfbWVzc2FnZScsICcnLCB7XG5cdFx0dHlwZTogJ3N0cmluZycsXG5cdFx0Z3JvdXA6ICdMaXZlY2hhdCcsXG5cdFx0cHVibGljOiB0cnVlLFxuXHRcdGkxOG5MYWJlbDogJ0NvbnZlcnNhdGlvbl9maW5pc2hlZF9tZXNzYWdlJ1xuXHR9KTtcblxuXHRSb2NrZXRDaGF0LnNldHRpbmdzLmFkZCgnTGl2ZWNoYXRfZ3Vlc3RfY291bnQnLCAxLCB7IHR5cGU6ICdpbnQnLCBncm91cDogJ0xpdmVjaGF0JyB9KTtcblxuXHRSb2NrZXRDaGF0LnNldHRpbmdzLmFkZCgnTGl2ZWNoYXRfUm9vbV9Db3VudCcsIDEsIHtcblx0XHR0eXBlOiAnaW50Jyxcblx0XHRncm91cDogJ0xpdmVjaGF0Jyxcblx0XHRpMThuTGFiZWw6ICdMaXZlY2hhdF9yb29tX2NvdW50J1xuXHR9KTtcblxuXHRSb2NrZXRDaGF0LnNldHRpbmdzLmFkZCgnTGl2ZWNoYXRfYWdlbnRfbGVhdmVfYWN0aW9uJywgJ25vbmUnLCB7XG5cdFx0dHlwZTogJ3NlbGVjdCcsXG5cdFx0Z3JvdXA6ICdMaXZlY2hhdCcsXG5cdFx0dmFsdWVzOiBbXG5cdFx0XHR7IGtleTogJ25vbmUnLCBpMThuTGFiZWw6ICdOb25lJyB9LFxuXHRcdFx0eyBrZXk6ICdmb3J3YXJkJywgaTE4bkxhYmVsOiAnRm9yd2FyZCcgfSxcblx0XHRcdHsga2V5OiAnY2xvc2UnLCBpMThuTGFiZWw6ICdDbG9zZScgfVxuXHRcdF0sXG5cdFx0aTE4bkxhYmVsOiAnSG93X3RvX2hhbmRsZV9vcGVuX3Nlc3Npb25zX3doZW5fYWdlbnRfZ29lc19vZmZsaW5lJ1xuXHR9KTtcblxuXHRSb2NrZXRDaGF0LnNldHRpbmdzLmFkZCgnTGl2ZWNoYXRfYWdlbnRfbGVhdmVfYWN0aW9uX3RpbWVvdXQnLCA2MCwge1xuXHRcdHR5cGU6ICdpbnQnLFxuXHRcdGdyb3VwOiAnTGl2ZWNoYXQnLFxuXHRcdGVuYWJsZVF1ZXJ5OiB7IF9pZDogJ0xpdmVjaGF0X2FnZW50X2xlYXZlX2FjdGlvbicsIHZhbHVlOiB7ICRuZTogJ25vbmUnIH0gfSxcblx0XHRpMThuTGFiZWw6ICdIb3dfbG9uZ190b193YWl0X2FmdGVyX2FnZW50X2dvZXNfb2ZmbGluZScsXG5cdFx0aTE4bkRlc2NyaXB0aW9uOiAnVGltZV9pbl9zZWNvbmRzJ1xuXHR9KTtcblxuXHRSb2NrZXRDaGF0LnNldHRpbmdzLmFkZCgnTGl2ZWNoYXRfYWdlbnRfbGVhdmVfY29tbWVudCcsICcnLCB7XG5cdFx0dHlwZTogJ3N0cmluZycsXG5cdFx0Z3JvdXA6ICdMaXZlY2hhdCcsXG5cdFx0ZW5hYmxlUXVlcnk6IHsgX2lkOiAnTGl2ZWNoYXRfYWdlbnRfbGVhdmVfYWN0aW9uJywgdmFsdWU6ICdjbG9zZScgfSxcblx0XHRpMThuTGFiZWw6ICdDb21tZW50X3RvX2xlYXZlX29uX2Nsb3Npbmdfc2Vzc2lvbidcblx0fSk7XG5cblx0Um9ja2V0Q2hhdC5zZXR0aW5ncy5hZGQoJ0xpdmVjaGF0X3dlYmhvb2tVcmwnLCBmYWxzZSwge1xuXHRcdHR5cGU6ICdzdHJpbmcnLFxuXHRcdGdyb3VwOiAnTGl2ZWNoYXQnLFxuXHRcdHNlY3Rpb246ICdDUk1fSW50ZWdyYXRpb24nLFxuXHRcdGkxOG5MYWJlbDogJ1dlYmhvb2tfVVJMJ1xuXHR9KTtcblxuXHRSb2NrZXRDaGF0LnNldHRpbmdzLmFkZCgnTGl2ZWNoYXRfc2VjcmV0X3Rva2VuJywgZmFsc2UsIHtcblx0XHR0eXBlOiAnc3RyaW5nJyxcblx0XHRncm91cDogJ0xpdmVjaGF0Jyxcblx0XHRzZWN0aW9uOiAnQ1JNX0ludGVncmF0aW9uJyxcblx0XHRpMThuTGFiZWw6ICdTZWNyZXRfdG9rZW4nXG5cdH0pO1xuXG5cdFJvY2tldENoYXQuc2V0dGluZ3MuYWRkKCdMaXZlY2hhdF93ZWJob29rX29uX2Nsb3NlJywgZmFsc2UsIHtcblx0XHR0eXBlOiAnYm9vbGVhbicsXG5cdFx0Z3JvdXA6ICdMaXZlY2hhdCcsXG5cdFx0c2VjdGlvbjogJ0NSTV9JbnRlZ3JhdGlvbicsXG5cdFx0aTE4bkxhYmVsOiAnU2VuZF9yZXF1ZXN0X29uX2NoYXRfY2xvc2UnXG5cdH0pO1xuXG5cdFJvY2tldENoYXQuc2V0dGluZ3MuYWRkKCdMaXZlY2hhdF93ZWJob29rX29uX29mZmxpbmVfbXNnJywgZmFsc2UsIHtcblx0XHR0eXBlOiAnYm9vbGVhbicsXG5cdFx0Z3JvdXA6ICdMaXZlY2hhdCcsXG5cdFx0c2VjdGlvbjogJ0NSTV9JbnRlZ3JhdGlvbicsXG5cdFx0aTE4bkxhYmVsOiAnU2VuZF9yZXF1ZXN0X29uX29mZmxpbmVfbWVzc2FnZXMnXG5cdH0pO1xuXG5cdFJvY2tldENoYXQuc2V0dGluZ3MuYWRkKCdMaXZlY2hhdF93ZWJob29rX29uX3Zpc2l0b3JfbWVzc2FnZScsIGZhbHNlLCB7XG5cdFx0dHlwZTogJ2Jvb2xlYW4nLFxuXHRcdGdyb3VwOiAnTGl2ZWNoYXQnLFxuXHRcdHNlY3Rpb246ICdDUk1fSW50ZWdyYXRpb24nLFxuXHRcdGkxOG5MYWJlbDogJ1NlbmRfcmVxdWVzdF9vbl92aXNpdG9yX21lc3NhZ2UnXG5cdH0pO1xuXG5cdFJvY2tldENoYXQuc2V0dGluZ3MuYWRkKCdMaXZlY2hhdF93ZWJob29rX29uX2FnZW50X21lc3NhZ2UnLCBmYWxzZSwge1xuXHRcdHR5cGU6ICdib29sZWFuJyxcblx0XHRncm91cDogJ0xpdmVjaGF0Jyxcblx0XHRzZWN0aW9uOiAnQ1JNX0ludGVncmF0aW9uJyxcblx0XHRpMThuTGFiZWw6ICdTZW5kX3JlcXVlc3Rfb25fYWdlbnRfbWVzc2FnZSdcblx0fSk7XG5cblx0Um9ja2V0Q2hhdC5zZXR0aW5ncy5hZGQoJ0xpdmVjaGF0X3dlYmhvb2tfb25fY2FwdHVyZScsIGZhbHNlLCB7XG5cdFx0dHlwZTogJ2Jvb2xlYW4nLFxuXHRcdGdyb3VwOiAnTGl2ZWNoYXQnLFxuXHRcdHNlY3Rpb246ICdDUk1fSW50ZWdyYXRpb24nLFxuXHRcdGkxOG5MYWJlbDogJ1NlbmRfcmVxdWVzdF9vbl9sZWFkX2NhcHR1cmUnXG5cdH0pO1xuXG5cdFJvY2tldENoYXQuc2V0dGluZ3MuYWRkKCdMaXZlY2hhdF9sZWFkX2VtYWlsX3JlZ2V4JywgJ1xcXFxiW0EtWjAtOS5fJSstXStAKD86W0EtWjAtOS1dK1xcXFwuKStbQS1aXXsyLDR9XFxcXGInLCB7XG5cdFx0dHlwZTogJ3N0cmluZycsXG5cdFx0Z3JvdXA6ICdMaXZlY2hhdCcsXG5cdFx0c2VjdGlvbjogJ0NSTV9JbnRlZ3JhdGlvbicsXG5cdFx0aTE4bkxhYmVsOiAnTGVhZF9jYXB0dXJlX2VtYWlsX3JlZ2V4J1xuXHR9KTtcblxuXHRSb2NrZXRDaGF0LnNldHRpbmdzLmFkZCgnTGl2ZWNoYXRfbGVhZF9waG9uZV9yZWdleCcsICcoKD86XFxcXChbMC05XXsxLDN9XFxcXCl8WzAtOV17Mn0pWyBcXFxcLV0qP1swLTldezQsNX0oPzpbXFxcXC1cXFxcc1xcXFxfXXsxLDJ9KT9bMC05XXs0fSg/Oig/PVteMC05XSl8JCl8WzAtOV17NCw1fSg/OltcXFxcLVxcXFxzXFxcXF9dezEsMn0pP1swLTldezR9KD86KD89W14wLTldKXwkKSknLCB7XG5cdFx0dHlwZTogJ3N0cmluZycsXG5cdFx0Z3JvdXA6ICdMaXZlY2hhdCcsXG5cdFx0c2VjdGlvbjogJ0NSTV9JbnRlZ3JhdGlvbicsXG5cdFx0aTE4bkxhYmVsOiAnTGVhZF9jYXB0dXJlX3Bob25lX3JlZ2V4J1xuXHR9KTtcblxuXHRSb2NrZXRDaGF0LnNldHRpbmdzLmFkZCgnTGl2ZWNoYXRfS25vd2xlZGdlX0VuYWJsZWQnLCBmYWxzZSwge1xuXHRcdHR5cGU6ICdib29sZWFuJyxcblx0XHRncm91cDogJ0xpdmVjaGF0Jyxcblx0XHRzZWN0aW9uOiAnS25vd2xlZGdlX0Jhc2UnLFxuXHRcdHB1YmxpYzogdHJ1ZSxcblx0XHRpMThuTGFiZWw6ICdFbmFibGVkJ1xuXHR9KTtcblxuXHRSb2NrZXRDaGF0LnNldHRpbmdzLmFkZCgnTGl2ZWNoYXRfS25vd2xlZGdlX0FwaWFpX0tleScsICcnLCB7XG5cdFx0dHlwZTogJ3N0cmluZycsXG5cdFx0Z3JvdXA6ICdMaXZlY2hhdCcsXG5cdFx0c2VjdGlvbjogJ0tub3dsZWRnZV9CYXNlJyxcblx0XHRwdWJsaWM6IHRydWUsXG5cdFx0aTE4bkxhYmVsOiAnQXBpYWlfS2V5J1xuXHR9KTtcblxuXHRSb2NrZXRDaGF0LnNldHRpbmdzLmFkZCgnTGl2ZWNoYXRfS25vd2xlZGdlX0FwaWFpX0xhbmd1YWdlJywgJ2VuJywge1xuXHRcdHR5cGU6ICdzdHJpbmcnLFxuXHRcdGdyb3VwOiAnTGl2ZWNoYXQnLFxuXHRcdHNlY3Rpb246ICdLbm93bGVkZ2VfQmFzZScsXG5cdFx0cHVibGljOiB0cnVlLFxuXHRcdGkxOG5MYWJlbDogJ0FwaWFpX0xhbmd1YWdlJ1xuXHR9KTtcblxuXHRSb2NrZXRDaGF0LnNldHRpbmdzLmFkZCgnTGl2ZWNoYXRfaGlzdG9yeV9tb25pdG9yX3R5cGUnLCAndXJsJywge1xuXHRcdHR5cGU6ICdzZWxlY3QnLFxuXHRcdGdyb3VwOiAnTGl2ZWNoYXQnLFxuXHRcdGkxOG5MYWJlbDogJ01vbml0b3JfaGlzdG9yeV9mb3JfY2hhbmdlc19vbicsXG5cdFx0dmFsdWVzOiBbXG5cdFx0XHR7IGtleTogJ3VybCcsIGkxOG5MYWJlbDogJ1BhZ2VfVVJMJyB9LFxuXHRcdFx0eyBrZXk6ICd0aXRsZScsIGkxOG5MYWJlbDogJ1BhZ2VfdGl0bGUnIH1cblx0XHRdXG5cdH0pO1xuXG5cdFJvY2tldENoYXQuc2V0dGluZ3MuYWRkKCdMaXZlY2hhdF9lbmFibGVfb2ZmaWNlX2hvdXJzJywgZmFsc2UsIHtcblx0XHR0eXBlOiAnYm9vbGVhbicsXG5cdFx0Z3JvdXA6ICdMaXZlY2hhdCcsXG5cdFx0cHVibGljOiB0cnVlLFxuXHRcdGkxOG5MYWJlbDogJ09mZmljZV9ob3Vyc19lbmFibGVkJ1xuXHR9KTtcblxuXHRSb2NrZXRDaGF0LnNldHRpbmdzLmFkZCgnTGl2ZWNoYXRfdmlkZW9jYWxsX2VuYWJsZWQnLCBmYWxzZSwge1xuXHRcdHR5cGU6ICdib29sZWFuJyxcblx0XHRncm91cDogJ0xpdmVjaGF0Jyxcblx0XHRwdWJsaWM6IHRydWUsXG5cdFx0aTE4bkxhYmVsOiAnVmlkZW9jYWxsX2VuYWJsZWQnLFxuXHRcdGkxOG5EZXNjcmlwdGlvbjogJ0JldGFfZmVhdHVyZV9EZXBlbmRzX29uX1ZpZGVvX0NvbmZlcmVuY2VfdG9fYmVfZW5hYmxlZCcsXG5cdFx0ZW5hYmxlUXVlcnk6IHsgX2lkOiAnSml0c2lfRW5hYmxlZCcsIHZhbHVlOiB0cnVlIH1cblx0fSk7XG5cblx0Um9ja2V0Q2hhdC5zZXR0aW5ncy5hZGQoJ0xpdmVjaGF0X2VuYWJsZV90cmFuc2NyaXB0JywgZmFsc2UsIHtcblx0XHR0eXBlOiAnYm9vbGVhbicsXG5cdFx0Z3JvdXA6ICdMaXZlY2hhdCcsXG5cdFx0cHVibGljOiB0cnVlLFxuXHRcdGkxOG5MYWJlbDogJ1RyYW5zY3JpcHRfRW5hYmxlZCdcblx0fSk7XG5cblx0Um9ja2V0Q2hhdC5zZXR0aW5ncy5hZGQoJ0xpdmVjaGF0X3RyYW5zY3JpcHRfbWVzc2FnZScsICcnLCB7XG5cdFx0dHlwZTogJ3N0cmluZycsXG5cdFx0Z3JvdXA6ICdMaXZlY2hhdCcsXG5cdFx0cHVibGljOiB0cnVlLFxuXHRcdGkxOG5MYWJlbDogJ1RyYW5zY3JpcHRfbWVzc2FnZScsXG5cdFx0ZW5hYmxlUXVlcnk6IHsgX2lkOiAnTGl2ZWNoYXRfZW5hYmxlX3RyYW5zY3JpcHQnLCB2YWx1ZTogdHJ1ZSB9XG5cdH0pO1xuXG5cdFJvY2tldENoYXQuc2V0dGluZ3MuYWRkKCdMaXZlY2hhdF9vcGVuX2lucXVpZXJ5X3Nob3dfY29ubmVjdGluZycsIGZhbHNlLCB7XG5cdFx0dHlwZTogJ2Jvb2xlYW4nLFxuXHRcdGdyb3VwOiAnTGl2ZWNoYXQnLFxuXHRcdHB1YmxpYzogdHJ1ZSxcblx0XHRpMThuTGFiZWw6ICdMaXZlY2hhdF9vcGVuX2lucXVpZXJ5X3Nob3dfY29ubmVjdGluZycsXG5cdFx0ZW5hYmxlUXVlcnk6IHsgX2lkOiAnTGl2ZWNoYXRfUm91dGluZ19NZXRob2QnLCB2YWx1ZTogJ0d1ZXN0X1Bvb2wnIH1cblx0fSk7XG5cblx0Um9ja2V0Q2hhdC5zZXR0aW5ncy5hZGQoJ0xpdmVjaGF0X0FsbG93ZWREb21haW5zTGlzdCcsICcnLCB7XG5cdFx0dHlwZTogJ3N0cmluZycsXG5cdFx0Z3JvdXA6ICdMaXZlY2hhdCcsXG5cdFx0cHVibGljOiB0cnVlLFxuXHRcdGkxOG5MYWJlbDogJ0xpdmVjaGF0X0FsbG93ZWREb21haW5zTGlzdCcsXG5cdFx0aTE4bkRlc2NyaXB0aW9uOiAnRG9tYWluc19hbGxvd2VkX3RvX2VtYmVkX3RoZV9saXZlY2hhdF93aWRnZXQnXG5cdH0pO1xuXG5cdFJvY2tldENoYXQuc2V0dGluZ3MuYWRkKCdMaXZlY2hhdF9GYWNlYm9va19FbmFibGVkJywgZmFsc2UsIHtcblx0XHR0eXBlOiAnYm9vbGVhbicsXG5cdFx0Z3JvdXA6ICdMaXZlY2hhdCcsXG5cdFx0c2VjdGlvbjogJ0ZhY2Vib29rJ1xuXHR9KTtcblxuXHRSb2NrZXRDaGF0LnNldHRpbmdzLmFkZCgnTGl2ZWNoYXRfRmFjZWJvb2tfQVBJX0tleScsICcnLCB7XG5cdFx0dHlwZTogJ3N0cmluZycsXG5cdFx0Z3JvdXA6ICdMaXZlY2hhdCcsXG5cdFx0c2VjdGlvbjogJ0ZhY2Vib29rJyxcblx0XHRpMThuRGVzY3JpcHRpb246ICdJZl95b3VfZG9udF9oYXZlX29uZV9zZW5kX2FuX2VtYWlsX3RvX29tbmlfcm9ja2V0Y2hhdF90b19nZXRfeW91cnMnXG5cdH0pO1xuXG5cdFJvY2tldENoYXQuc2V0dGluZ3MuYWRkKCdMaXZlY2hhdF9GYWNlYm9va19BUElfU2VjcmV0JywgJycsIHtcblx0XHR0eXBlOiAnc3RyaW5nJyxcblx0XHRncm91cDogJ0xpdmVjaGF0Jyxcblx0XHRzZWN0aW9uOiAnRmFjZWJvb2snLFxuXHRcdGkxOG5EZXNjcmlwdGlvbjogJ0lmX3lvdV9kb250X2hhdmVfb25lX3NlbmRfYW5fZW1haWxfdG9fb21uaV9yb2NrZXRjaGF0X3RvX2dldF95b3Vycydcblx0fSk7XG5cblx0Um9ja2V0Q2hhdC5zZXR0aW5ncy5hZGQoJ0xpdmVjaGF0X1JEU3RhdGlvbl9Ub2tlbicsICcnLCB7XG5cdFx0dHlwZTogJ3N0cmluZycsXG5cdFx0Z3JvdXA6ICdMaXZlY2hhdCcsXG5cdFx0cHVibGljOiBmYWxzZSxcblx0XHRzZWN0aW9uOiAnUkQgU3RhdGlvbicsXG5cdFx0aTE4bkxhYmVsOiAnUkRTdGF0aW9uX1Rva2VuJ1xuXHR9KTtcblxuXHRSb2NrZXRDaGF0LnNldHRpbmdzLmFkZCgnTGl2ZWNoYXRfUm91dGluZ19NZXRob2QnLCAnTGVhc3RfQW1vdW50Jywge1xuXHRcdHR5cGU6ICdzZWxlY3QnLFxuXHRcdGdyb3VwOiAnTGl2ZWNoYXQnLFxuXHRcdHB1YmxpYzogdHJ1ZSxcblx0XHRzZWN0aW9uOiAnUm91dGluZycsXG5cdFx0dmFsdWVzOiBbXG5cdFx0XHR7a2V5OiAnRXh0ZXJuYWwnLCBpMThuTGFiZWw6ICdFeHRlcm5hbF9TZXJ2aWNlJ30sXG5cdFx0XHR7a2V5OiAnTGVhc3RfQW1vdW50JywgaTE4bkxhYmVsOiAnTGVhc3RfQW1vdW50J30sXG5cdFx0XHR7a2V5OiAnR3Vlc3RfUG9vbCcsIGkxOG5MYWJlbDogJ0d1ZXN0X1Bvb2wnfVxuXHRcdF1cblx0fSk7XG5cblx0Um9ja2V0Q2hhdC5zZXR0aW5ncy5hZGQoJ0xpdmVjaGF0X2d1ZXN0X3Bvb2xfd2l0aF9ub19hZ2VudHMnLCBmYWxzZSwge1xuXHRcdHR5cGU6ICdib29sZWFuJyxcblx0XHRncm91cDogJ0xpdmVjaGF0Jyxcblx0XHRzZWN0aW9uOiAnUm91dGluZycsXG5cdFx0aTE4bkxhYmVsOiAnQWNjZXB0X3dpdGhfbm9fb25saW5lX2FnZW50cycsXG5cdFx0aTE4bkRlc2NyaXB0aW9uOiAnQWNjZXB0X2luY29taW5nX2xpdmVjaGF0X3JlcXVlc3RzX2V2ZW5faWZfdGhlcmVfYXJlX25vX29ubGluZV9hZ2VudHMnLFxuXHRcdGVuYWJsZVF1ZXJ5OiB7IF9pZDogJ0xpdmVjaGF0X1JvdXRpbmdfTWV0aG9kJywgdmFsdWU6ICdHdWVzdF9Qb29sJyB9XG5cdH0pO1xuXG5cdFJvY2tldENoYXQuc2V0dGluZ3MuYWRkKCdMaXZlY2hhdF9zaG93X3F1ZXVlX2xpc3RfbGluaycsIGZhbHNlLCB7XG5cdFx0dHlwZTogJ2Jvb2xlYW4nLFxuXHRcdGdyb3VwOiAnTGl2ZWNoYXQnLFxuXHRcdHB1YmxpYzogdHJ1ZSxcblx0XHRzZWN0aW9uOiAnUm91dGluZycsXG5cdFx0aTE4bkxhYmVsOiAnU2hvd19xdWV1ZV9saXN0X3RvX2FsbF9hZ2VudHMnLFxuXHRcdGVuYWJsZVF1ZXJ5OiB7IF9pZDogJ0xpdmVjaGF0X1JvdXRpbmdfTWV0aG9kJywgdmFsdWU6IHsgJG5lOiAnRXh0ZXJuYWwnIH0gfVxuXHR9KTtcblxuXHRSb2NrZXRDaGF0LnNldHRpbmdzLmFkZCgnTGl2ZWNoYXRfRXh0ZXJuYWxfUXVldWVfVVJMJywgJycsIHtcblx0XHR0eXBlOiAnc3RyaW5nJyxcblx0XHRncm91cDogJ0xpdmVjaGF0Jyxcblx0XHRwdWJsaWM6IGZhbHNlLFxuXHRcdHNlY3Rpb246ICdSb3V0aW5nJyxcblx0XHRpMThuTGFiZWw6ICdFeHRlcm5hbF9RdWV1ZV9TZXJ2aWNlX1VSTCcsXG5cdFx0aTE4bkRlc2NyaXB0aW9uOiAnRm9yX21vcmVfZGV0YWlsc19wbGVhc2VfY2hlY2tfb3VyX2RvY3MnLFxuXHRcdGVuYWJsZVF1ZXJ5OiB7IF9pZDogJ0xpdmVjaGF0X1JvdXRpbmdfTWV0aG9kJywgdmFsdWU6ICdFeHRlcm5hbCcgfVxuXHR9KTtcblxuXHRSb2NrZXRDaGF0LnNldHRpbmdzLmFkZCgnTGl2ZWNoYXRfRXh0ZXJuYWxfUXVldWVfVG9rZW4nLCAnJywge1xuXHRcdHR5cGU6ICdzdHJpbmcnLFxuXHRcdGdyb3VwOiAnTGl2ZWNoYXQnLFxuXHRcdHB1YmxpYzogZmFsc2UsXG5cdFx0c2VjdGlvbjogJ1JvdXRpbmcnLFxuXHRcdGkxOG5MYWJlbDogJ1NlY3JldF90b2tlbicsXG5cdFx0ZW5hYmxlUXVlcnk6IHsgX2lkOiAnTGl2ZWNoYXRfUm91dGluZ19NZXRob2QnLCB2YWx1ZTogJ0V4dGVybmFsJyB9XG5cdH0pO1xufSk7XG4iLCJSb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnbGl2ZWNoYXQvZGVwYXJ0bWVudCcsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0Z2V0KCkge1xuXHRcdGlmICghUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKHRoaXMudXNlcklkLCAndmlldy1saXZlY2hhdC1tYW5hZ2VyJykpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS51bmF1dGhvcml6ZWQoKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7XG5cdFx0XHRkZXBhcnRtZW50czogUm9ja2V0Q2hhdC5tb2RlbHMuTGl2ZWNoYXREZXBhcnRtZW50LmZpbmQoKS5mZXRjaCgpXG5cdFx0fSk7XG5cdH0sXG5cdHBvc3QoKSB7XG5cdFx0aWYgKCFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odGhpcy51c2VySWQsICd2aWV3LWxpdmVjaGF0LW1hbmFnZXInKSkge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnVuYXV0aG9yaXplZCgpO1xuXHRcdH1cblxuXHRcdHRyeSB7XG5cdFx0XHRjaGVjayh0aGlzLmJvZHlQYXJhbXMsIHtcblx0XHRcdFx0ZGVwYXJ0bWVudDogT2JqZWN0LFxuXHRcdFx0XHRhZ2VudHM6IEFycmF5XG5cdFx0XHR9KTtcblxuXHRcdFx0Y29uc3QgZGVwYXJ0bWVudCA9IFJvY2tldENoYXQuTGl2ZWNoYXQuc2F2ZURlcGFydG1lbnQobnVsbCwgdGhpcy5ib2R5UGFyYW1zLmRlcGFydG1lbnQsIHRoaXMuYm9keVBhcmFtcy5hZ2VudHMpO1xuXG5cdFx0XHRpZiAoZGVwYXJ0bWVudCkge1xuXHRcdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7XG5cdFx0XHRcdFx0ZGVwYXJ0bWVudCxcblx0XHRcdFx0XHRhZ2VudHM6IFJvY2tldENoYXQubW9kZWxzLkxpdmVjaGF0RGVwYXJ0bWVudEFnZW50cy5maW5kKHsgZGVwYXJ0bWVudElkOiBkZXBhcnRtZW50Ll9pZCB9KS5mZXRjaCgpXG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXG5cdFx0XHRSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCk7XG5cdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoZSk7XG5cdFx0fVxuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2xpdmVjaGF0L2RlcGFydG1lbnQvOl9pZCcsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0Z2V0KCkge1xuXHRcdGlmICghUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKHRoaXMudXNlcklkLCAndmlldy1saXZlY2hhdC1tYW5hZ2VyJykpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS51bmF1dGhvcml6ZWQoKTtcblx0XHR9XG5cblx0XHR0cnkge1xuXHRcdFx0Y2hlY2sodGhpcy51cmxQYXJhbXMsIHtcblx0XHRcdFx0X2lkOiBTdHJpbmdcblx0XHRcdH0pO1xuXG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7XG5cdFx0XHRcdGRlcGFydG1lbnQ6IFJvY2tldENoYXQubW9kZWxzLkxpdmVjaGF0RGVwYXJ0bWVudC5maW5kT25lQnlJZCh0aGlzLnVybFBhcmFtcy5faWQpLFxuXHRcdFx0XHRhZ2VudHM6IFJvY2tldENoYXQubW9kZWxzLkxpdmVjaGF0RGVwYXJ0bWVudEFnZW50cy5maW5kKHsgZGVwYXJ0bWVudElkOiB0aGlzLnVybFBhcmFtcy5faWQgfSkuZmV0Y2goKVxuXHRcdFx0fSk7XG5cdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoZS5lcnJvcik7XG5cdFx0fVxuXHR9LFxuXHRwdXQoKSB7XG5cdFx0aWYgKCFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odGhpcy51c2VySWQsICd2aWV3LWxpdmVjaGF0LW1hbmFnZXInKSkge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnVuYXV0aG9yaXplZCgpO1xuXHRcdH1cblxuXHRcdHRyeSB7XG5cdFx0XHRjaGVjayh0aGlzLnVybFBhcmFtcywge1xuXHRcdFx0XHRfaWQ6IFN0cmluZ1xuXHRcdFx0fSk7XG5cblx0XHRcdGNoZWNrKHRoaXMuYm9keVBhcmFtcywge1xuXHRcdFx0XHRkZXBhcnRtZW50OiBPYmplY3QsXG5cdFx0XHRcdGFnZW50czogQXJyYXlcblx0XHRcdH0pO1xuXG5cdFx0XHRpZiAoUm9ja2V0Q2hhdC5MaXZlY2hhdC5zYXZlRGVwYXJ0bWVudCh0aGlzLnVybFBhcmFtcy5faWQsIHRoaXMuYm9keVBhcmFtcy5kZXBhcnRtZW50LCB0aGlzLmJvZHlQYXJhbXMuYWdlbnRzKSkge1xuXHRcdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7XG5cdFx0XHRcdFx0ZGVwYXJ0bWVudDogUm9ja2V0Q2hhdC5tb2RlbHMuTGl2ZWNoYXREZXBhcnRtZW50LmZpbmRPbmVCeUlkKHRoaXMudXJsUGFyYW1zLl9pZCksXG5cdFx0XHRcdFx0YWdlbnRzOiBSb2NrZXRDaGF0Lm1vZGVscy5MaXZlY2hhdERlcGFydG1lbnRBZ2VudHMuZmluZCh7IGRlcGFydG1lbnRJZDogdGhpcy51cmxQYXJhbXMuX2lkIH0pLmZldGNoKClcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCk7XG5cdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoZS5lcnJvcik7XG5cdFx0fVxuXHR9LFxuXHRkZWxldGUoKSB7XG5cdFx0aWYgKCFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odGhpcy51c2VySWQsICd2aWV3LWxpdmVjaGF0LW1hbmFnZXInKSkge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnVuYXV0aG9yaXplZCgpO1xuXHRcdH1cblxuXHRcdHRyeSB7XG5cdFx0XHRjaGVjayh0aGlzLnVybFBhcmFtcywge1xuXHRcdFx0XHRfaWQ6IFN0cmluZ1xuXHRcdFx0fSk7XG5cblx0XHRcdGlmIChSb2NrZXRDaGF0LkxpdmVjaGF0LnJlbW92ZURlcGFydG1lbnQodGhpcy51cmxQYXJhbXMuX2lkKSkge1xuXHRcdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2VzcygpO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgpO1xuXHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKGUuZXJyb3IpO1xuXHRcdH1cblx0fVxufSk7XG4iLCJpbXBvcnQgY3J5cHRvIGZyb20gJ2NyeXB0byc7XG5cbmltcG9ydCBMaXZlY2hhdFZpc2l0b3JzIGZyb20gJy4uLy4uLy4uL3NlcnZlci9tb2RlbHMvTGl2ZWNoYXRWaXNpdG9ycyc7XG5cbi8qKlxuICogQGFwaSB7cG9zdH0gL2xpdmVjaGF0L2ZhY2Vib29rIFNlbmQgRmFjZWJvb2sgbWVzc2FnZVxuICogQGFwaU5hbWUgRmFjZWJvb2tcbiAqIEBhcGlHcm91cCBMaXZlY2hhdFxuICpcbiAqIEBhcGlQYXJhbSB7U3RyaW5nfSBtaWQgRmFjZWJvb2sgbWVzc2FnZSBpZFxuICogQGFwaVBhcmFtIHtTdHJpbmd9IHBhZ2UgRmFjZWJvb2sgcGFnZXMgaWRcbiAqIEBhcGlQYXJhbSB7U3RyaW5nfSB0b2tlbiBGYWNlYm9vayB1c2VyJ3MgdG9rZW5cbiAqIEBhcGlQYXJhbSB7U3RyaW5nfSBmaXJzdF9uYW1lIEZhY2Vib29rIHVzZXIncyBmaXJzdCBuYW1lXG4gKiBAYXBpUGFyYW0ge1N0cmluZ30gbGFzdF9uYW1lIEZhY2Vib29rIHVzZXIncyBsYXN0IG5hbWVcbiAqIEBhcGlQYXJhbSB7U3RyaW5nfSBbdGV4dF0gRmFjZWJvb2sgbWVzc2FnZSB0ZXh0XG4gKiBAYXBpUGFyYW0ge1N0cmluZ30gW2F0dGFjaG1lbnRzXSBGYWNlYm9vayBtZXNzYWdlIGF0dGFjaG1lbnRzXG4gKi9cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdsaXZlY2hhdC9mYWNlYm9vaycsIHtcblx0cG9zdCgpIHtcblx0XHRpZiAoIXRoaXMuYm9keVBhcmFtcy50ZXh0ICYmICF0aGlzLmJvZHlQYXJhbXMuYXR0YWNobWVudHMpIHtcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdHN1Y2Nlc3M6IGZhbHNlXG5cdFx0XHR9O1xuXHRcdH1cblxuXHRcdGlmICghdGhpcy5yZXF1ZXN0LmhlYWRlcnNbJ3gtaHViLXNpZ25hdHVyZSddKSB7XG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRzdWNjZXNzOiBmYWxzZVxuXHRcdFx0fTtcblx0XHR9XG5cblx0XHRpZiAoIVJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdMaXZlY2hhdF9GYWNlYm9va19FbmFibGVkJykpIHtcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdHN1Y2Nlc3M6IGZhbHNlLFxuXHRcdFx0XHRlcnJvcjogJ0ludGVncmF0aW9uIGRpc2FibGVkJ1xuXHRcdFx0fTtcblx0XHR9XG5cblx0XHQvLyB2YWxpZGF0ZSBpZiByZXF1ZXN0IGNvbWUgZnJvbSBvbW5pXG5cdFx0Y29uc3Qgc2lnbmF0dXJlID0gY3J5cHRvLmNyZWF0ZUhtYWMoJ3NoYTEnLCBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnTGl2ZWNoYXRfRmFjZWJvb2tfQVBJX1NlY3JldCcpKS51cGRhdGUoSlNPTi5zdHJpbmdpZnkodGhpcy5yZXF1ZXN0LmJvZHkpKS5kaWdlc3QoJ2hleCcpO1xuXHRcdGlmICh0aGlzLnJlcXVlc3QuaGVhZGVyc1sneC1odWItc2lnbmF0dXJlJ10gIT09IGBzaGExPSR7IHNpZ25hdHVyZSB9YCkge1xuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0c3VjY2VzczogZmFsc2UsXG5cdFx0XHRcdGVycm9yOiAnSW52YWxpZCBzaWduYXR1cmUnXG5cdFx0XHR9O1xuXHRcdH1cblxuXHRcdGNvbnN0IHNlbmRNZXNzYWdlID0ge1xuXHRcdFx0bWVzc2FnZToge1xuXHRcdFx0XHRfaWQ6IHRoaXMuYm9keVBhcmFtcy5taWRcblx0XHRcdH0sXG5cdFx0XHRyb29tSW5mbzoge1xuXHRcdFx0XHRmYWNlYm9vazoge1xuXHRcdFx0XHRcdHBhZ2U6IHRoaXMuYm9keVBhcmFtcy5wYWdlXG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9O1xuXHRcdGxldCB2aXNpdG9yID0gTGl2ZWNoYXRWaXNpdG9ycy5nZXRWaXNpdG9yQnlUb2tlbih0aGlzLmJvZHlQYXJhbXMudG9rZW4pO1xuXHRcdGlmICh2aXNpdG9yKSB7XG5cdFx0XHRjb25zdCByb29tcyA9IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRPcGVuQnlWaXNpdG9yVG9rZW4odmlzaXRvci50b2tlbikuZmV0Y2goKTtcblx0XHRcdGlmIChyb29tcyAmJiByb29tcy5sZW5ndGggPiAwKSB7XG5cdFx0XHRcdHNlbmRNZXNzYWdlLm1lc3NhZ2UucmlkID0gcm9vbXNbMF0uX2lkO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0c2VuZE1lc3NhZ2UubWVzc2FnZS5yaWQgPSBSYW5kb20uaWQoKTtcblx0XHRcdH1cblx0XHRcdHNlbmRNZXNzYWdlLm1lc3NhZ2UudG9rZW4gPSB2aXNpdG9yLnRva2VuO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRzZW5kTWVzc2FnZS5tZXNzYWdlLnJpZCA9IFJhbmRvbS5pZCgpO1xuXHRcdFx0c2VuZE1lc3NhZ2UubWVzc2FnZS50b2tlbiA9IHRoaXMuYm9keVBhcmFtcy50b2tlbjtcblxuXHRcdFx0Y29uc3QgdXNlcklkID0gUm9ja2V0Q2hhdC5MaXZlY2hhdC5yZWdpc3Rlckd1ZXN0KHtcblx0XHRcdFx0dG9rZW46IHNlbmRNZXNzYWdlLm1lc3NhZ2UudG9rZW4sXG5cdFx0XHRcdG5hbWU6IGAkeyB0aGlzLmJvZHlQYXJhbXMuZmlyc3RfbmFtZSB9ICR7IHRoaXMuYm9keVBhcmFtcy5sYXN0X25hbWUgfWBcblx0XHRcdH0pO1xuXG5cdFx0XHR2aXNpdG9yID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZE9uZUJ5SWQodXNlcklkKTtcblx0XHR9XG5cblx0XHRzZW5kTWVzc2FnZS5tZXNzYWdlLm1zZyA9IHRoaXMuYm9keVBhcmFtcy50ZXh0O1xuXHRcdHNlbmRNZXNzYWdlLmd1ZXN0ID0gdmlzaXRvcjtcblxuXHRcdHRyeSB7XG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRzdWNlc3M6IHRydWUsXG5cdFx0XHRcdG1lc3NhZ2U6IFJvY2tldENoYXQuTGl2ZWNoYXQuc2VuZE1lc3NhZ2Uoc2VuZE1lc3NhZ2UpXG5cdFx0XHR9O1xuXHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdGNvbnNvbGUuZXJyb3IoJ0Vycm9yIHVzaW5nIEZhY2Vib29rIC0+JywgZSk7XG5cdFx0fVxuXHR9XG59KTtcbiIsImltcG9ydCBMaXZlY2hhdFZpc2l0b3JzIGZyb20gJy4uLy4uLy4uL3NlcnZlci9tb2RlbHMvTGl2ZWNoYXRWaXNpdG9ycyc7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdsaXZlY2hhdC9tZXNzYWdlcycsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdCgpIHtcblx0XHRpZiAoIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih0aGlzLnVzZXJJZCwgJ3ZpZXctbGl2ZWNoYXQtbWFuYWdlcicpKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEudW5hdXRob3JpemVkKCk7XG5cdFx0fVxuXG5cdFx0aWYgKCF0aGlzLmJvZHlQYXJhbXMudmlzaXRvcikge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoJ0JvZHkgcGFyYW0gXCJ2aXNpdG9yXCIgaXMgcmVxdWlyZWQnKTtcblx0XHR9XG5cdFx0aWYgKCF0aGlzLmJvZHlQYXJhbXMudmlzaXRvci50b2tlbikge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoJ0JvZHkgcGFyYW0gXCJ2aXNpdG9yLnRva2VuXCIgaXMgcmVxdWlyZWQnKTtcblx0XHR9XG5cdFx0aWYgKCF0aGlzLmJvZHlQYXJhbXMubWVzc2FnZXMpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCdCb2R5IHBhcmFtIFwibWVzc2FnZXNcIiBpcyByZXF1aXJlZCcpO1xuXHRcdH1cblx0XHRpZiAoISh0aGlzLmJvZHlQYXJhbXMubWVzc2FnZXMgaW5zdGFuY2VvZiBBcnJheSkpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCdCb2R5IHBhcmFtIFwibWVzc2FnZXNcIiBpcyBub3QgYW4gYXJyYXknKTtcblx0XHR9XG5cdFx0aWYgKHRoaXMuYm9keVBhcmFtcy5tZXNzYWdlcy5sZW5ndGggPT09IDApIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCdCb2R5IHBhcmFtIFwibWVzc2FnZXNcIiBpcyBlbXB0eScpO1xuXHRcdH1cblxuXHRcdGNvbnN0IHZpc2l0b3JUb2tlbiA9IHRoaXMuYm9keVBhcmFtcy52aXNpdG9yLnRva2VuO1xuXG5cdFx0bGV0IHZpc2l0b3IgPSBMaXZlY2hhdFZpc2l0b3JzLmdldFZpc2l0b3JCeVRva2VuKHZpc2l0b3JUb2tlbik7XG5cdFx0bGV0IHJpZDtcblx0XHRpZiAodmlzaXRvcikge1xuXHRcdFx0Y29uc3Qgcm9vbXMgPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT3BlbkJ5VmlzaXRvclRva2VuKHZpc2l0b3JUb2tlbikuZmV0Y2goKTtcblx0XHRcdGlmIChyb29tcyAmJiByb29tcy5sZW5ndGggPiAwKSB7XG5cdFx0XHRcdHJpZCA9IHJvb21zWzBdLl9pZDtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHJpZCA9IFJhbmRvbS5pZCgpO1xuXHRcdFx0fVxuXHRcdH0gZWxzZSB7XG5cdFx0XHRyaWQgPSBSYW5kb20uaWQoKTtcblx0XHRcdGNvbnN0IHZpc2l0b3JJZCA9IFJvY2tldENoYXQuTGl2ZWNoYXQucmVnaXN0ZXJHdWVzdCh0aGlzLmJvZHlQYXJhbXMudmlzaXRvcik7XG5cdFx0XHR2aXNpdG9yID0gTGl2ZWNoYXRWaXNpdG9ycy5maW5kT25lQnlJZCh2aXNpdG9ySWQpO1xuXHRcdH1cblxuXHRcdGNvbnN0IHNlbnRNZXNzYWdlcyA9IHRoaXMuYm9keVBhcmFtcy5tZXNzYWdlcy5tYXAoKG1lc3NhZ2UpID0+IHtcblx0XHRcdGNvbnN0IHNlbmRNZXNzYWdlID0ge1xuXHRcdFx0XHRndWVzdDogdmlzaXRvcixcblx0XHRcdFx0bWVzc2FnZToge1xuXHRcdFx0XHRcdF9pZDogUmFuZG9tLmlkKCksXG5cdFx0XHRcdFx0cmlkLFxuXHRcdFx0XHRcdHRva2VuOiB2aXNpdG9yVG9rZW4sXG5cdFx0XHRcdFx0bXNnOiBtZXNzYWdlLm1zZ1xuXHRcdFx0XHR9XG5cdFx0XHR9O1xuXHRcdFx0Y29uc3Qgc2VudE1lc3NhZ2UgPSBSb2NrZXRDaGF0LkxpdmVjaGF0LnNlbmRNZXNzYWdlKHNlbmRNZXNzYWdlKTtcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdHVzZXJuYW1lOiBzZW50TWVzc2FnZS51LnVzZXJuYW1lLFxuXHRcdFx0XHRtc2c6IHNlbnRNZXNzYWdlLm1zZyxcblx0XHRcdFx0dHM6IHNlbnRNZXNzYWdlLnRzXG5cdFx0XHR9O1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0bWVzc2FnZXM6IHNlbnRNZXNzYWdlc1xuXHRcdH0pO1xuXHR9XG59KTtcbiIsImltcG9ydCBMaXZlY2hhdFZpc2l0b3JzIGZyb20gJy4uLy4uLy4uL3NlcnZlci9tb2RlbHMvTGl2ZWNoYXRWaXNpdG9ycyc7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdsaXZlY2hhdC9zbXMtaW5jb21pbmcvOnNlcnZpY2UnLCB7XG5cdHBvc3QoKSB7XG5cdFx0Y29uc3QgU01TU2VydmljZSA9IFJvY2tldENoYXQuU01TLmdldFNlcnZpY2UodGhpcy51cmxQYXJhbXMuc2VydmljZSk7XG5cblx0XHRjb25zdCBzbXMgPSBTTVNTZXJ2aWNlLnBhcnNlKHRoaXMuYm9keVBhcmFtcyk7XG5cblx0XHRsZXQgdmlzaXRvciA9IExpdmVjaGF0VmlzaXRvcnMuZmluZE9uZVZpc2l0b3JCeVBob25lKHNtcy5mcm9tKTtcblxuXHRcdGNvbnN0IHNlbmRNZXNzYWdlID0ge1xuXHRcdFx0bWVzc2FnZToge1xuXHRcdFx0XHRfaWQ6IFJhbmRvbS5pZCgpXG5cdFx0XHR9LFxuXHRcdFx0cm9vbUluZm86IHtcblx0XHRcdFx0c21zOiB7XG5cdFx0XHRcdFx0ZnJvbTogc21zLnRvXG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0aWYgKHZpc2l0b3IpIHtcblx0XHRcdGNvbnN0IHJvb21zID0gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9wZW5CeVZpc2l0b3JUb2tlbih2aXNpdG9yLnRva2VuKS5mZXRjaCgpO1xuXG5cdFx0XHRpZiAocm9vbXMgJiYgcm9vbXMubGVuZ3RoID4gMCkge1xuXHRcdFx0XHRzZW5kTWVzc2FnZS5tZXNzYWdlLnJpZCA9IHJvb21zWzBdLl9pZDtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHNlbmRNZXNzYWdlLm1lc3NhZ2UucmlkID0gUmFuZG9tLmlkKCk7XG5cdFx0XHR9XG5cdFx0XHRzZW5kTWVzc2FnZS5tZXNzYWdlLnRva2VuID0gdmlzaXRvci50b2tlbjtcblx0XHR9IGVsc2Uge1xuXHRcdFx0c2VuZE1lc3NhZ2UubWVzc2FnZS5yaWQgPSBSYW5kb20uaWQoKTtcblx0XHRcdHNlbmRNZXNzYWdlLm1lc3NhZ2UudG9rZW4gPSBSYW5kb20uaWQoKTtcblxuXHRcdFx0Y29uc3QgdmlzaXRvcklkID0gUm9ja2V0Q2hhdC5MaXZlY2hhdC5yZWdpc3Rlckd1ZXN0KHtcblx0XHRcdFx0dXNlcm5hbWU6IHNtcy5mcm9tLnJlcGxhY2UoL1teMC05XS9nLCAnJyksXG5cdFx0XHRcdHRva2VuOiBzZW5kTWVzc2FnZS5tZXNzYWdlLnRva2VuLFxuXHRcdFx0XHRwaG9uZToge1xuXHRcdFx0XHRcdG51bWJlcjogc21zLmZyb21cblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cblx0XHRcdHZpc2l0b3IgPSBMaXZlY2hhdFZpc2l0b3JzLmZpbmRPbmVCeUlkKHZpc2l0b3JJZCk7XG5cdFx0fVxuXG5cdFx0c2VuZE1lc3NhZ2UubWVzc2FnZS5tc2cgPSBzbXMuYm9keTtcblx0XHRzZW5kTWVzc2FnZS5ndWVzdCA9IHZpc2l0b3I7XG5cblx0XHRzZW5kTWVzc2FnZS5tZXNzYWdlLmF0dGFjaG1lbnRzID0gc21zLm1lZGlhLm1hcChjdXJyID0+IHtcblx0XHRcdGNvbnN0IGF0dGFjaG1lbnQgPSB7XG5cdFx0XHRcdG1lc3NhZ2VfbGluazogY3Vyci51cmxcblx0XHRcdH07XG5cblx0XHRcdGNvbnN0IGNvbnRlbnRUeXBlID0gY3Vyci5jb250ZW50VHlwZTtcblx0XHRcdHN3aXRjaCAoY29udGVudFR5cGUuc3Vic3RyKDAsIGNvbnRlbnRUeXBlLmluZGV4T2YoJy8nKSkpIHtcblx0XHRcdFx0Y2FzZSAnaW1hZ2UnOlxuXHRcdFx0XHRcdGF0dGFjaG1lbnQuaW1hZ2VfdXJsID0gY3Vyci51cmw7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdGNhc2UgJ3ZpZGVvJzpcblx0XHRcdFx0XHRhdHRhY2htZW50LnZpZGVvX3VybCA9IGN1cnIudXJsO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRjYXNlICdhdWRpbyc6XG5cdFx0XHRcdFx0YXR0YWNobWVudC5hdWRpb191cmwgPSBjdXJyLnVybDtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIGF0dGFjaG1lbnQ7XG5cdFx0fSk7XG5cblx0XHR0cnkge1xuXHRcdFx0Y29uc3QgbWVzc2FnZSA9IFNNU1NlcnZpY2UucmVzcG9uc2UuY2FsbCh0aGlzLCBSb2NrZXRDaGF0LkxpdmVjaGF0LnNlbmRNZXNzYWdlKHNlbmRNZXNzYWdlKSk7XG5cblx0XHRcdE1ldGVvci5kZWZlcigoKSA9PiB7XG5cdFx0XHRcdGlmIChzbXMuZXh0cmEpIHtcblx0XHRcdFx0XHRpZiAoc21zLmV4dHJhLmZyb21Db3VudHJ5KSB7XG5cdFx0XHRcdFx0XHRNZXRlb3IuY2FsbCgnbGl2ZWNoYXQ6c2V0Q3VzdG9tRmllbGQnLCBzZW5kTWVzc2FnZS5tZXNzYWdlLnRva2VuLCAnY291bnRyeScsIHNtcy5leHRyYS5mcm9tQ291bnRyeSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGlmIChzbXMuZXh0cmEuZnJvbVN0YXRlKSB7XG5cdFx0XHRcdFx0XHRNZXRlb3IuY2FsbCgnbGl2ZWNoYXQ6c2V0Q3VzdG9tRmllbGQnLCBzZW5kTWVzc2FnZS5tZXNzYWdlLnRva2VuLCAnc3RhdGUnLCBzbXMuZXh0cmEuZnJvbVN0YXRlKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0aWYgKHNtcy5leHRyYS5mcm9tQ2l0eSkge1xuXHRcdFx0XHRcdFx0TWV0ZW9yLmNhbGwoJ2xpdmVjaGF0OnNldEN1c3RvbUZpZWxkJywgc2VuZE1lc3NhZ2UubWVzc2FnZS50b2tlbiwgJ2NpdHknLCBzbXMuZXh0cmEuZnJvbUNpdHkpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cblx0XHRcdHJldHVybiBtZXNzYWdlO1xuXHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdHJldHVybiBTTVNTZXJ2aWNlLmVycm9yLmNhbGwodGhpcywgZSk7XG5cdFx0fVxuXHR9XG59KTtcbiIsImltcG9ydCBfIGZyb20gJ3VuZGVyc2NvcmUnO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnbGl2ZWNoYXQvdXNlcnMvOnR5cGUnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdGdldCgpIHtcblx0XHRpZiAoIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih0aGlzLnVzZXJJZCwgJ3ZpZXctbGl2ZWNoYXQtbWFuYWdlcicpKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEudW5hdXRob3JpemVkKCk7XG5cdFx0fVxuXG5cdFx0dHJ5IHtcblx0XHRcdGNoZWNrKHRoaXMudXJsUGFyYW1zLCB7XG5cdFx0XHRcdHR5cGU6IFN0cmluZ1xuXHRcdFx0fSk7XG5cblx0XHRcdGxldCByb2xlO1xuXHRcdFx0aWYgKHRoaXMudXJsUGFyYW1zLnR5cGUgPT09ICdhZ2VudCcpIHtcblx0XHRcdFx0cm9sZSA9ICdsaXZlY2hhdC1hZ2VudCc7XG5cdFx0XHR9IGVsc2UgaWYgKHRoaXMudXJsUGFyYW1zLnR5cGUgPT09ICdtYW5hZ2VyJykge1xuXHRcdFx0XHRyb2xlID0gJ2xpdmVjaGF0LW1hbmFnZXInO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dGhyb3cgJ0ludmFsaWQgdHlwZSc7XG5cdFx0XHR9XG5cblx0XHRcdGNvbnN0IHVzZXJzID0gUm9ja2V0Q2hhdC5hdXRoei5nZXRVc2Vyc0luUm9sZShyb2xlKTtcblxuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0XHR1c2VyczogdXNlcnMuZmV0Y2goKS5tYXAodXNlciA9PiBfLnBpY2sodXNlciwgJ19pZCcsICd1c2VybmFtZScsICduYW1lJywgJ3N0YXR1cycsICdzdGF0dXNMaXZlY2hhdCcpKVxuXHRcdFx0fSk7XG5cdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoZS5lcnJvcik7XG5cdFx0fVxuXHR9LFxuXHRwb3N0KCkge1xuXHRcdGlmICghUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKHRoaXMudXNlcklkLCAndmlldy1saXZlY2hhdC1tYW5hZ2VyJykpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS51bmF1dGhvcml6ZWQoKTtcblx0XHR9XG5cdFx0dHJ5IHtcblx0XHRcdGNoZWNrKHRoaXMudXJsUGFyYW1zLCB7XG5cdFx0XHRcdHR5cGU6IFN0cmluZ1xuXHRcdFx0fSk7XG5cblx0XHRcdGNoZWNrKHRoaXMuYm9keVBhcmFtcywge1xuXHRcdFx0XHR1c2VybmFtZTogU3RyaW5nXG5cdFx0XHR9KTtcblxuXHRcdFx0aWYgKHRoaXMudXJsUGFyYW1zLnR5cGUgPT09ICdhZ2VudCcpIHtcblx0XHRcdFx0Y29uc3QgdXNlciA9IFJvY2tldENoYXQuTGl2ZWNoYXQuYWRkQWdlbnQodGhpcy5ib2R5UGFyYW1zLnVzZXJuYW1lKTtcblx0XHRcdFx0aWYgKHVzZXIpIHtcblx0XHRcdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7IHVzZXIgfSk7XG5cdFx0XHRcdH1cblx0XHRcdH0gZWxzZSBpZiAodGhpcy51cmxQYXJhbXMudHlwZSA9PT0gJ21hbmFnZXInKSB7XG5cdFx0XHRcdGNvbnN0IHVzZXIgPSBSb2NrZXRDaGF0LkxpdmVjaGF0LmFkZE1hbmFnZXIodGhpcy5ib2R5UGFyYW1zLnVzZXJuYW1lKTtcblx0XHRcdFx0aWYgKHVzZXIpIHtcblx0XHRcdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7IHVzZXIgfSk7XG5cdFx0XHRcdH1cblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHRocm93ICdJbnZhbGlkIHR5cGUnO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgpO1xuXHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKGUuZXJyb3IpO1xuXHRcdH1cblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdsaXZlY2hhdC91c2Vycy86dHlwZS86X2lkJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRnZXQoKSB7XG5cdFx0aWYgKCFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odGhpcy51c2VySWQsICd2aWV3LWxpdmVjaGF0LW1hbmFnZXInKSkge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnVuYXV0aG9yaXplZCgpO1xuXHRcdH1cblxuXHRcdHRyeSB7XG5cdFx0XHRjaGVjayh0aGlzLnVybFBhcmFtcywge1xuXHRcdFx0XHR0eXBlOiBTdHJpbmcsXG5cdFx0XHRcdF9pZDogU3RyaW5nXG5cdFx0XHR9KTtcblxuXHRcdFx0Y29uc3QgdXNlciA9IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmVCeUlkKHRoaXMudXJsUGFyYW1zLl9pZCk7XG5cblx0XHRcdGlmICghdXNlcikge1xuXHRcdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgnVXNlciBub3QgZm91bmQnKTtcblx0XHRcdH1cblxuXHRcdFx0bGV0IHJvbGU7XG5cblx0XHRcdGlmICh0aGlzLnVybFBhcmFtcy50eXBlID09PSAnYWdlbnQnKSB7XG5cdFx0XHRcdHJvbGUgPSAnbGl2ZWNoYXQtYWdlbnQnO1xuXHRcdFx0fSBlbHNlIGlmICh0aGlzLnVybFBhcmFtcy50eXBlID09PSAnbWFuYWdlcicpIHtcblx0XHRcdFx0cm9sZSA9ICdsaXZlY2hhdC1tYW5hZ2VyJztcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHRocm93ICdJbnZhbGlkIHR5cGUnO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAodXNlci5yb2xlcy5pbmRleE9mKHJvbGUpICE9PSAtMSkge1xuXHRcdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7XG5cdFx0XHRcdFx0dXNlcjogXy5waWNrKHVzZXIsICdfaWQnLCAndXNlcm5hbWUnKVxuXHRcdFx0XHR9KTtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0XHR1c2VyOiBudWxsXG5cdFx0XHR9KTtcblx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZShlLmVycm9yKTtcblx0XHR9XG5cdH0sXG5cdGRlbGV0ZSgpIHtcblx0XHRpZiAoIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih0aGlzLnVzZXJJZCwgJ3ZpZXctbGl2ZWNoYXQtbWFuYWdlcicpKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEudW5hdXRob3JpemVkKCk7XG5cdFx0fVxuXG5cdFx0dHJ5IHtcblx0XHRcdGNoZWNrKHRoaXMudXJsUGFyYW1zLCB7XG5cdFx0XHRcdHR5cGU6IFN0cmluZyxcblx0XHRcdFx0X2lkOiBTdHJpbmdcblx0XHRcdH0pO1xuXG5cdFx0XHRjb25zdCB1c2VyID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZE9uZUJ5SWQodGhpcy51cmxQYXJhbXMuX2lkKTtcblxuXHRcdFx0aWYgKCF1c2VyKSB7XG5cdFx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCk7XG5cdFx0XHR9XG5cblx0XHRcdGlmICh0aGlzLnVybFBhcmFtcy50eXBlID09PSAnYWdlbnQnKSB7XG5cdFx0XHRcdGlmIChSb2NrZXRDaGF0LkxpdmVjaGF0LnJlbW92ZUFnZW50KHVzZXIudXNlcm5hbWUpKSB7XG5cdFx0XHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoKTtcblx0XHRcdFx0fVxuXHRcdFx0fSBlbHNlIGlmICh0aGlzLnVybFBhcmFtcy50eXBlID09PSAnbWFuYWdlcicpIHtcblx0XHRcdFx0aWYgKFJvY2tldENoYXQuTGl2ZWNoYXQucmVtb3ZlTWFuYWdlcih1c2VyLnVzZXJuYW1lKSkge1xuXHRcdFx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKCk7XG5cdFx0XHRcdH1cblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHRocm93ICdJbnZhbGlkIHR5cGUnO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgpO1xuXHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKGUuZXJyb3IpO1xuXHRcdH1cblx0fVxufSk7XG4iLCJpbXBvcnQgTGl2ZWNoYXRWaXNpdG9ycyBmcm9tICcuLi8uLi8uLi9zZXJ2ZXIvbW9kZWxzL0xpdmVjaGF0VmlzaXRvcnMnO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnbGl2ZWNoYXQvdmlzaXRvci86dmlzaXRvclRva2VuJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRnZXQoKSB7XG5cdFx0aWYgKCFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odGhpcy51c2VySWQsICd2aWV3LWxpdmVjaGF0LW1hbmFnZXInKSkge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnVuYXV0aG9yaXplZCgpO1xuXHRcdH1cblxuXHRcdGNvbnN0IHZpc2l0b3IgPSBMaXZlY2hhdFZpc2l0b3JzLmdldFZpc2l0b3JCeVRva2VuKHRoaXMudXJsUGFyYW1zLnZpc2l0b3JUb2tlbik7XG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3ModmlzaXRvcik7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnbGl2ZWNoYXQvdmlzaXRvci86dmlzaXRvclRva2VuL3Jvb20nLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdGdldCgpIHtcblx0XHRpZiAoIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih0aGlzLnVzZXJJZCwgJ3ZpZXctbGl2ZWNoYXQtbWFuYWdlcicpKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEudW5hdXRob3JpemVkKCk7XG5cdFx0fVxuXG5cdFx0Y29uc3Qgcm9vbXMgPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT3BlbkJ5VmlzaXRvclRva2VuKHRoaXMudXJsUGFyYW1zLnZpc2l0b3JUb2tlbiwge1xuXHRcdFx0ZmllbGRzOiB7XG5cdFx0XHRcdG5hbWU6IDEsXG5cdFx0XHRcdHQ6IDEsXG5cdFx0XHRcdGNsOiAxLFxuXHRcdFx0XHR1OiAxLFxuXHRcdFx0XHR1c2VybmFtZXM6IDEsXG5cdFx0XHRcdHNlcnZlZEJ5OiAxXG5cdFx0XHR9XG5cdFx0fSkuZmV0Y2goKTtcblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7IHJvb21zIH0pO1xuXHR9XG59KTtcbiJdfQ==
