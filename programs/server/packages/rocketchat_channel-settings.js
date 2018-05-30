(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var ReactiveVar = Package['reactive-var'].ReactiveVar;
var Tracker = Package.tracker.Tracker;
var Deps = Package.tracker.Deps;
var RocketChat = Package['rocketchat:lib'].RocketChat;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var TAPi18next = Package['tap:i18n'].TAPi18next;
var TAPi18n = Package['tap:i18n'].TAPi18n;

/* Package-scope variables */
var settings;

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:channel-settings":{"server":{"functions":{"saveReactWhenReadOnly.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_channel-settings/server/functions/saveReactWhenReadOnly.js                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.saveReactWhenReadOnly = function (rid, allowReact) {
  if (!Match.test(rid, String)) {
    throw new Meteor.Error('invalid-room', 'Invalid room', {
      function: 'RocketChat.saveReactWhenReadOnly'
    });
  }

  return RocketChat.models.Rooms.setAllowReactingWhenReadOnlyById(rid, allowReact);
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"saveRoomType.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_channel-settings/server/functions/saveRoomType.js                                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.saveRoomType = function (rid, roomType, user, sendMessage = true) {
  if (!Match.test(rid, String)) {
    throw new Meteor.Error('invalid-room', 'Invalid room', {
      'function': 'RocketChat.saveRoomType'
    });
  }

  if (roomType !== 'c' && roomType !== 'p') {
    throw new Meteor.Error('error-invalid-room-type', 'error-invalid-room-type', {
      'function': 'RocketChat.saveRoomType',
      type: roomType
    });
  }

  const room = RocketChat.models.Rooms.findOneById(rid);

  if (room == null) {
    throw new Meteor.Error('error-invalid-room', 'error-invalid-room', {
      'function': 'RocketChat.saveRoomType',
      _id: rid
    });
  }

  if (room.t === 'd') {
    throw new Meteor.Error('error-direct-room', 'Can\'t change type of direct rooms', {
      'function': 'RocketChat.saveRoomType'
    });
  }

  const result = RocketChat.models.Rooms.setTypeById(rid, roomType) && RocketChat.models.Subscriptions.updateTypeByRoomId(rid, roomType);

  if (result && sendMessage) {
    let message;

    if (roomType === 'c') {
      message = TAPi18n.__('Channel', {
        lng: user && user.language || RocketChat.settings.get('language') || 'en'
      });
    } else {
      message = TAPi18n.__('Private_Group', {
        lng: user && user.language || RocketChat.settings.get('language') || 'en'
      });
    }

    RocketChat.models.Messages.createRoomSettingsChangedWithTypeRoomIdMessageAndUser('room_changed_privacy', rid, message, user);
  }

  return result;
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"saveRoomTopic.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_channel-settings/server/functions/saveRoomTopic.js                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let s;
module.watch(require("underscore.string"), {
  default(v) {
    s = v;
  }

}, 0);

RocketChat.saveRoomTopic = function (rid, roomTopic, user, sendMessage = true) {
  if (!Match.test(rid, String)) {
    throw new Meteor.Error('invalid-room', 'Invalid room', {
      'function': 'RocketChat.saveRoomTopic'
    });
  }

  roomTopic = s.escapeHTML(roomTopic);
  const update = RocketChat.models.Rooms.setTopicById(rid, roomTopic);

  if (update && sendMessage) {
    RocketChat.models.Messages.createRoomSettingsChangedWithTypeRoomIdMessageAndUser('room_changed_topic', rid, roomTopic, user);
  }

  return update;
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"saveRoomAnnouncement.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_channel-settings/server/functions/saveRoomAnnouncement.js                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var _interopRequireDefault = require("@babel/runtime/helpers/builtin/interopRequireDefault");

var _objectWithoutProperties2 = _interopRequireDefault(require("@babel/runtime/helpers/builtin/objectWithoutProperties"));

let s;
module.watch(require("underscore.string"), {
  default(v) {
    s = v;
  }

}, 0);

RocketChat.saveRoomAnnouncement = function (rid, roomAnnouncement, user, sendMessage = true) {
  if (!Match.test(rid, String)) {
    throw new Meteor.Error('invalid-room', 'Invalid room', {
      function: 'RocketChat.saveRoomAnnouncement'
    });
  }

  let message;
  let announcementDetails;

  if (typeof roomAnnouncement === 'string') {
    message = roomAnnouncement;
  } else {
    var _roomAnnouncement = roomAnnouncement;
    ({
      message
    } = _roomAnnouncement);
    announcementDetails = (0, _objectWithoutProperties2.default)(_roomAnnouncement, ["message"]);
    _roomAnnouncement;
  }

  const escapedMessage = s.escapeHTML(message);
  const updated = RocketChat.models.Rooms.setAnnouncementById(rid, escapedMessage, announcementDetails);

  if (updated && sendMessage) {
    RocketChat.models.Messages.createRoomSettingsChangedWithTypeRoomIdMessageAndUser('room_changed_announcement', rid, escapedMessage, user);
  }

  return updated;
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"saveRoomName.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_channel-settings/server/functions/saveRoomName.js                                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.saveRoomName = function (rid, displayName, user, sendMessage = true) {
  const room = RocketChat.models.Rooms.findOneById(rid);

  if (RocketChat.roomTypes.roomTypes[room.t].preventRenaming()) {
    throw new Meteor.Error('error-not-allowed', 'Not allowed', {
      'function': 'RocketChat.saveRoomdisplayName'
    });
  }

  if (displayName === room.name) {
    return;
  }

  const slugifiedRoomName = RocketChat.getValidRoomName(displayName, rid);
  const update = RocketChat.models.Rooms.setNameById(rid, slugifiedRoomName, displayName) && RocketChat.models.Subscriptions.updateNameAndAlertByRoomId(rid, slugifiedRoomName, displayName);

  if (update && sendMessage) {
    RocketChat.models.Messages.createRoomRenamedWithRoomIdRoomNameAndUser(rid, displayName, user);
  }

  return displayName;
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"saveRoomReadOnly.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_channel-settings/server/functions/saveRoomReadOnly.js                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.saveRoomReadOnly = function (rid, readOnly) {
  if (!Match.test(rid, String)) {
    throw new Meteor.Error('invalid-room', 'Invalid room', {
      'function': 'RocketChat.saveRoomReadOnly'
    });
  }

  return RocketChat.models.Rooms.setReadOnlyById(rid, readOnly);
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"saveRoomDescription.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_channel-settings/server/functions/saveRoomDescription.js                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let s;
module.watch(require("underscore.string"), {
  default(v) {
    s = v;
  }

}, 0);

RocketChat.saveRoomDescription = function (rid, roomDescription, user) {
  if (!Match.test(rid, String)) {
    throw new Meteor.Error('invalid-room', 'Invalid room', {
      'function': 'RocketChat.saveRoomDescription'
    });
  }

  const escapedRoomDescription = s.escapeHTML(roomDescription);
  const update = RocketChat.models.Rooms.setDescriptionById(rid, escapedRoomDescription);
  RocketChat.models.Messages.createRoomSettingsChangedWithTypeRoomIdMessageAndUser('room_changed_description', rid, escapedRoomDescription, user);
  return update;
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"saveRoomSystemMessages.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_channel-settings/server/functions/saveRoomSystemMessages.js                                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.saveRoomSystemMessages = function (rid, systemMessages) {
  if (!Match.test(rid, String)) {
    throw new Meteor.Error('invalid-room', 'Invalid room', {
      'function': 'RocketChat.saveRoomSystemMessages'
    });
  }

  return RocketChat.models.Rooms.setSystemMessagesById(rid, systemMessages);
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"methods":{"saveRoomSettings.js":function(require){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_channel-settings/server/methods/saveRoomSettings.js                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
const fields = ['roomName', 'roomTopic', 'roomAnnouncement', 'roomDescription', 'roomType', 'readOnly', 'reactWhenReadOnly', 'systemMessages', 'default', 'joinCode', 'tokenpass', 'streamingOptions'];
Meteor.methods({
  saveRoomSettings(rid, settings, value) {
    if (!Meteor.userId()) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        'function': 'RocketChat.saveRoomName'
      });
    }

    if (!Match.test(rid, String)) {
      throw new Meteor.Error('error-invalid-room', 'Invalid room', {
        method: 'saveRoomSettings'
      });
    }

    if (typeof settings !== 'object') {
      settings = {
        [settings]: value
      };
    }

    if (!Object.keys(settings).every(key => fields.includes(key))) {
      throw new Meteor.Error('error-invalid-settings', 'Invalid settings provided', {
        method: 'saveRoomSettings'
      });
    }

    if (!RocketChat.authz.hasPermission(Meteor.userId(), 'edit-room', rid)) {
      throw new Meteor.Error('error-action-not-allowed', 'Editing room is not allowed', {
        method: 'saveRoomSettings',
        action: 'Editing_room'
      });
    }

    const room = RocketChat.models.Rooms.findOneById(rid);

    if (room.broadcast && (settings.readOnly || settings.reactWhenReadOnly)) {
      throw new Meteor.Error('error-action-not-allowed', 'Editing readOnly/reactWhenReadOnly are not allowed for broadcast rooms', {
        method: 'saveRoomSettings',
        action: 'Editing_room'
      });
    }

    if (!room) {
      throw new Meteor.Error('error-invalid-room', 'Invalid room', {
        method: 'saveRoomSettings'
      });
    }

    const user = Meteor.user();
    Object.keys(settings).forEach(setting => {
      const value = settings[setting];

      if (settings === 'default' && !RocketChat.authz.hasPermission(this.userId, 'view-room-administration')) {
        throw new Meteor.Error('error-action-not-allowed', 'Viewing room administration is not allowed', {
          method: 'saveRoomSettings',
          action: 'Viewing_room_administration'
        });
      }

      if (setting === 'roomType' && value !== room.t && value === 'c' && !RocketChat.authz.hasPermission(this.userId, 'create-c')) {
        throw new Meteor.Error('error-action-not-allowed', 'Changing a private group to a public channel is not allowed', {
          method: 'saveRoomSettings',
          action: 'Change_Room_Type'
        });
      }

      if (setting === 'roomType' && value !== room.t && value === 'p' && !RocketChat.authz.hasPermission(this.userId, 'create-p')) {
        throw new Meteor.Error('error-action-not-allowed', 'Changing a public channel to a private room is not allowed', {
          method: 'saveRoomSettings',
          action: 'Change_Room_Type'
        });
      }
    });
    Object.keys(settings).forEach(setting => {
      const value = settings[setting];

      switch (setting) {
        case 'roomName':
          RocketChat.saveRoomName(rid, value, user);
          break;

        case 'roomTopic':
          if (value !== room.topic) {
            RocketChat.saveRoomTopic(rid, value, user);
          }

          break;

        case 'roomAnnouncement':
          if (value !== room.announcement) {
            RocketChat.saveRoomAnnouncement(rid, value, user);
          }

          break;

        case 'roomDescription':
          if (value !== room.description) {
            RocketChat.saveRoomDescription(rid, value, user);
          }

          break;

        case 'roomType':
          if (value !== room.t) {
            RocketChat.saveRoomType(rid, value, user);
          }

          break;

        case 'tokenpass':
          check(value, {
            require: String,
            tokens: [{
              token: String,
              balance: String
            }]
          });
          RocketChat.saveRoomTokenpass(rid, value);
          break;

        case 'streamingOptions':
          RocketChat.saveStreamingOptions(rid, value);
          break;

        case 'readOnly':
          if (value !== room.ro) {
            RocketChat.saveRoomReadOnly(rid, value, user);
          }

          break;

        case 'reactWhenReadOnly':
          if (value !== room.reactWhenReadOnly) {
            RocketChat.saveReactWhenReadOnly(rid, value, user);
          }

          break;

        case 'systemMessages':
          if (value !== room.sysMes) {
            RocketChat.saveRoomSystemMessages(rid, value, user);
          }

          break;

        case 'joinCode':
          RocketChat.models.Rooms.setJoinCodeById(rid, String(value));
          break;

        case 'default':
          RocketChat.models.Rooms.saveDefaultById(rid, value);
      }
    });
    return {
      result: true,
      rid: room._id
    };
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"models":{"Messages.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_channel-settings/server/models/Messages.js                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.models.Messages.createRoomSettingsChangedWithTypeRoomIdMessageAndUser = function (type, roomId, message, user, extraData) {
  return this.createWithTypeRoomIdMessageAndUser(type, roomId, message, user, extraData);
};

RocketChat.models.Messages.createRoomRenamedWithRoomIdRoomNameAndUser = function (roomId, roomName, user, extraData) {
  return this.createWithTypeRoomIdMessageAndUser('r', roomId, roomName, user, extraData);
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"Rooms.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_channel-settings/server/models/Rooms.js                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.models.Rooms.setDescriptionById = function (_id, description) {
  const query = {
    _id
  };
  const update = {
    $set: {
      description
    }
  };
  return this.update(query, update);
};

RocketChat.models.Rooms.setReadOnlyById = function (_id, readOnly) {
  const query = {
    _id
  };
  const update = {
    $set: {
      ro: readOnly
    }
  };

  if (readOnly) {
    RocketChat.models.Subscriptions.findByRoomId(_id).forEach(function (subscription) {
      if (subscription._user == null) {
        return;
      }

      const user = subscription._user;

      if (RocketChat.authz.hasPermission(user._id, 'post-readonly') === false) {
        if (!update.$set.muted) {
          update.$set.muted = [];
        }

        return update.$set.muted.push(user.username);
      }
    });
  } else {
    update.$unset = {
      muted: ''
    };
  }

  return this.update(query, update);
};

RocketChat.models.Rooms.setAllowReactingWhenReadOnlyById = function (_id, allowReacting) {
  const query = {
    _id
  };
  const update = {
    $set: {
      reactWhenReadOnly: allowReacting
    }
  };
  return this.update(query, update);
};

RocketChat.models.Rooms.setSystemMessagesById = function (_id, systemMessages) {
  const query = {
    _id
  };
  const update = {
    $set: {
      sysMes: systemMessages
    }
  };
  return this.update(query, update);
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"startup.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_channel-settings/server/startup.js                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.startup(function () {
  RocketChat.models.Permissions.upsert('post-readonly', {
    $setOnInsert: {
      roles: ['admin', 'owner', 'moderator']
    }
  });
  RocketChat.models.Permissions.upsert('set-readonly', {
    $setOnInsert: {
      roles: ['admin', 'owner']
    }
  });
  RocketChat.models.Permissions.upsert('set-react-when-readonly', {
    $setOnInsert: {
      roles: ['admin', 'owner']
    }
  });
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:channel-settings/server/functions/saveReactWhenReadOnly.js");
require("/node_modules/meteor/rocketchat:channel-settings/server/functions/saveRoomType.js");
require("/node_modules/meteor/rocketchat:channel-settings/server/functions/saveRoomTopic.js");
require("/node_modules/meteor/rocketchat:channel-settings/server/functions/saveRoomAnnouncement.js");
require("/node_modules/meteor/rocketchat:channel-settings/server/functions/saveRoomName.js");
require("/node_modules/meteor/rocketchat:channel-settings/server/functions/saveRoomReadOnly.js");
require("/node_modules/meteor/rocketchat:channel-settings/server/functions/saveRoomDescription.js");
require("/node_modules/meteor/rocketchat:channel-settings/server/functions/saveRoomSystemMessages.js");
require("/node_modules/meteor/rocketchat:channel-settings/server/methods/saveRoomSettings.js");
require("/node_modules/meteor/rocketchat:channel-settings/server/models/Messages.js");
require("/node_modules/meteor/rocketchat:channel-settings/server/models/Rooms.js");
require("/node_modules/meteor/rocketchat:channel-settings/server/startup.js");

/* Exports */
Package._define("rocketchat:channel-settings");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_channel-settings.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpjaGFubmVsLXNldHRpbmdzL3NlcnZlci9mdW5jdGlvbnMvc2F2ZVJlYWN0V2hlblJlYWRPbmx5LmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmNoYW5uZWwtc2V0dGluZ3Mvc2VydmVyL2Z1bmN0aW9ucy9zYXZlUm9vbVR5cGUuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6Y2hhbm5lbC1zZXR0aW5ncy9zZXJ2ZXIvZnVuY3Rpb25zL3NhdmVSb29tVG9waWMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6Y2hhbm5lbC1zZXR0aW5ncy9zZXJ2ZXIvZnVuY3Rpb25zL3NhdmVSb29tQW5ub3VuY2VtZW50LmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmNoYW5uZWwtc2V0dGluZ3Mvc2VydmVyL2Z1bmN0aW9ucy9zYXZlUm9vbU5hbWUuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6Y2hhbm5lbC1zZXR0aW5ncy9zZXJ2ZXIvZnVuY3Rpb25zL3NhdmVSb29tUmVhZE9ubHkuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6Y2hhbm5lbC1zZXR0aW5ncy9zZXJ2ZXIvZnVuY3Rpb25zL3NhdmVSb29tRGVzY3JpcHRpb24uanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6Y2hhbm5lbC1zZXR0aW5ncy9zZXJ2ZXIvZnVuY3Rpb25zL3NhdmVSb29tU3lzdGVtTWVzc2FnZXMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6Y2hhbm5lbC1zZXR0aW5ncy9zZXJ2ZXIvbWV0aG9kcy9zYXZlUm9vbVNldHRpbmdzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmNoYW5uZWwtc2V0dGluZ3Mvc2VydmVyL21vZGVscy9NZXNzYWdlcy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpjaGFubmVsLXNldHRpbmdzL3NlcnZlci9tb2RlbHMvUm9vbXMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6Y2hhbm5lbC1zZXR0aW5ncy9zZXJ2ZXIvc3RhcnR1cC5qcyJdLCJuYW1lcyI6WyJSb2NrZXRDaGF0Iiwic2F2ZVJlYWN0V2hlblJlYWRPbmx5IiwicmlkIiwiYWxsb3dSZWFjdCIsIk1hdGNoIiwidGVzdCIsIlN0cmluZyIsIk1ldGVvciIsIkVycm9yIiwiZnVuY3Rpb24iLCJtb2RlbHMiLCJSb29tcyIsInNldEFsbG93UmVhY3RpbmdXaGVuUmVhZE9ubHlCeUlkIiwic2F2ZVJvb21UeXBlIiwicm9vbVR5cGUiLCJ1c2VyIiwic2VuZE1lc3NhZ2UiLCJ0eXBlIiwicm9vbSIsImZpbmRPbmVCeUlkIiwiX2lkIiwidCIsInJlc3VsdCIsInNldFR5cGVCeUlkIiwiU3Vic2NyaXB0aW9ucyIsInVwZGF0ZVR5cGVCeVJvb21JZCIsIm1lc3NhZ2UiLCJUQVBpMThuIiwiX18iLCJsbmciLCJsYW5ndWFnZSIsInNldHRpbmdzIiwiZ2V0IiwiTWVzc2FnZXMiLCJjcmVhdGVSb29tU2V0dGluZ3NDaGFuZ2VkV2l0aFR5cGVSb29tSWRNZXNzYWdlQW5kVXNlciIsInMiLCJtb2R1bGUiLCJ3YXRjaCIsInJlcXVpcmUiLCJkZWZhdWx0IiwidiIsInNhdmVSb29tVG9waWMiLCJyb29tVG9waWMiLCJlc2NhcGVIVE1MIiwidXBkYXRlIiwic2V0VG9waWNCeUlkIiwic2F2ZVJvb21Bbm5vdW5jZW1lbnQiLCJyb29tQW5ub3VuY2VtZW50IiwiYW5ub3VuY2VtZW50RGV0YWlscyIsImVzY2FwZWRNZXNzYWdlIiwidXBkYXRlZCIsInNldEFubm91bmNlbWVudEJ5SWQiLCJzYXZlUm9vbU5hbWUiLCJkaXNwbGF5TmFtZSIsInJvb21UeXBlcyIsInByZXZlbnRSZW5hbWluZyIsIm5hbWUiLCJzbHVnaWZpZWRSb29tTmFtZSIsImdldFZhbGlkUm9vbU5hbWUiLCJzZXROYW1lQnlJZCIsInVwZGF0ZU5hbWVBbmRBbGVydEJ5Um9vbUlkIiwiY3JlYXRlUm9vbVJlbmFtZWRXaXRoUm9vbUlkUm9vbU5hbWVBbmRVc2VyIiwic2F2ZVJvb21SZWFkT25seSIsInJlYWRPbmx5Iiwic2V0UmVhZE9ubHlCeUlkIiwic2F2ZVJvb21EZXNjcmlwdGlvbiIsInJvb21EZXNjcmlwdGlvbiIsImVzY2FwZWRSb29tRGVzY3JpcHRpb24iLCJzZXREZXNjcmlwdGlvbkJ5SWQiLCJzYXZlUm9vbVN5c3RlbU1lc3NhZ2VzIiwic3lzdGVtTWVzc2FnZXMiLCJzZXRTeXN0ZW1NZXNzYWdlc0J5SWQiLCJmaWVsZHMiLCJtZXRob2RzIiwic2F2ZVJvb21TZXR0aW5ncyIsInZhbHVlIiwidXNlcklkIiwibWV0aG9kIiwiT2JqZWN0Iiwia2V5cyIsImV2ZXJ5Iiwia2V5IiwiaW5jbHVkZXMiLCJhdXRoeiIsImhhc1Blcm1pc3Npb24iLCJhY3Rpb24iLCJicm9hZGNhc3QiLCJyZWFjdFdoZW5SZWFkT25seSIsImZvckVhY2giLCJzZXR0aW5nIiwidG9waWMiLCJhbm5vdW5jZW1lbnQiLCJkZXNjcmlwdGlvbiIsImNoZWNrIiwidG9rZW5zIiwidG9rZW4iLCJiYWxhbmNlIiwic2F2ZVJvb21Ub2tlbnBhc3MiLCJzYXZlU3RyZWFtaW5nT3B0aW9ucyIsInJvIiwic3lzTWVzIiwic2V0Sm9pbkNvZGVCeUlkIiwic2F2ZURlZmF1bHRCeUlkIiwicm9vbUlkIiwiZXh0cmFEYXRhIiwiY3JlYXRlV2l0aFR5cGVSb29tSWRNZXNzYWdlQW5kVXNlciIsInJvb21OYW1lIiwicXVlcnkiLCIkc2V0IiwiZmluZEJ5Um9vbUlkIiwic3Vic2NyaXB0aW9uIiwiX3VzZXIiLCJtdXRlZCIsInB1c2giLCJ1c2VybmFtZSIsIiR1bnNldCIsImFsbG93UmVhY3RpbmciLCJzdGFydHVwIiwiUGVybWlzc2lvbnMiLCJ1cHNlcnQiLCIkc2V0T25JbnNlcnQiLCJyb2xlcyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBQSxXQUFXQyxxQkFBWCxHQUFtQyxVQUFTQyxHQUFULEVBQWNDLFVBQWQsRUFBMEI7QUFDNUQsTUFBSSxDQUFDQyxNQUFNQyxJQUFOLENBQVdILEdBQVgsRUFBZ0JJLE1BQWhCLENBQUwsRUFBOEI7QUFDN0IsVUFBTSxJQUFJQyxPQUFPQyxLQUFYLENBQWlCLGNBQWpCLEVBQWlDLGNBQWpDLEVBQWlEO0FBQUVDLGdCQUFVO0FBQVosS0FBakQsQ0FBTjtBQUNBOztBQUVELFNBQU9ULFdBQVdVLE1BQVgsQ0FBa0JDLEtBQWxCLENBQXdCQyxnQ0FBeEIsQ0FBeURWLEdBQXpELEVBQThEQyxVQUE5RCxDQUFQO0FBQ0EsQ0FORCxDOzs7Ozs7Ozs7OztBQ0NBSCxXQUFXYSxZQUFYLEdBQTBCLFVBQVNYLEdBQVQsRUFBY1ksUUFBZCxFQUF3QkMsSUFBeEIsRUFBOEJDLGNBQWMsSUFBNUMsRUFBa0Q7QUFDM0UsTUFBSSxDQUFDWixNQUFNQyxJQUFOLENBQVdILEdBQVgsRUFBZ0JJLE1BQWhCLENBQUwsRUFBOEI7QUFDN0IsVUFBTSxJQUFJQyxPQUFPQyxLQUFYLENBQWlCLGNBQWpCLEVBQWlDLGNBQWpDLEVBQWlEO0FBQ3RELGtCQUFZO0FBRDBDLEtBQWpELENBQU47QUFHQTs7QUFDRCxNQUFJTSxhQUFhLEdBQWIsSUFBb0JBLGFBQWEsR0FBckMsRUFBMEM7QUFDekMsVUFBTSxJQUFJUCxPQUFPQyxLQUFYLENBQWlCLHlCQUFqQixFQUE0Qyx5QkFBNUMsRUFBdUU7QUFDNUUsa0JBQVkseUJBRGdFO0FBRTVFUyxZQUFNSDtBQUZzRSxLQUF2RSxDQUFOO0FBSUE7O0FBQ0QsUUFBTUksT0FBT2xCLFdBQVdVLE1BQVgsQ0FBa0JDLEtBQWxCLENBQXdCUSxXQUF4QixDQUFvQ2pCLEdBQXBDLENBQWI7O0FBQ0EsTUFBSWdCLFFBQVEsSUFBWixFQUFrQjtBQUNqQixVQUFNLElBQUlYLE9BQU9DLEtBQVgsQ0FBaUIsb0JBQWpCLEVBQXVDLG9CQUF2QyxFQUE2RDtBQUNsRSxrQkFBWSx5QkFEc0Q7QUFFbEVZLFdBQUtsQjtBQUY2RCxLQUE3RCxDQUFOO0FBSUE7O0FBQ0QsTUFBSWdCLEtBQUtHLENBQUwsS0FBVyxHQUFmLEVBQW9CO0FBQ25CLFVBQU0sSUFBSWQsT0FBT0MsS0FBWCxDQUFpQixtQkFBakIsRUFBc0Msb0NBQXRDLEVBQTRFO0FBQ2pGLGtCQUFZO0FBRHFFLEtBQTVFLENBQU47QUFHQTs7QUFDRCxRQUFNYyxTQUFTdEIsV0FBV1UsTUFBWCxDQUFrQkMsS0FBbEIsQ0FBd0JZLFdBQXhCLENBQW9DckIsR0FBcEMsRUFBeUNZLFFBQXpDLEtBQXNEZCxXQUFXVSxNQUFYLENBQWtCYyxhQUFsQixDQUFnQ0Msa0JBQWhDLENBQW1EdkIsR0FBbkQsRUFBd0RZLFFBQXhELENBQXJFOztBQUNBLE1BQUlRLFVBQVVOLFdBQWQsRUFBMkI7QUFDMUIsUUFBSVUsT0FBSjs7QUFDQSxRQUFJWixhQUFhLEdBQWpCLEVBQXNCO0FBQ3JCWSxnQkFBVUMsUUFBUUMsRUFBUixDQUFXLFNBQVgsRUFBc0I7QUFDL0JDLGFBQUtkLFFBQVFBLEtBQUtlLFFBQWIsSUFBeUI5QixXQUFXK0IsUUFBWCxDQUFvQkMsR0FBcEIsQ0FBd0IsVUFBeEIsQ0FBekIsSUFBZ0U7QUFEdEMsT0FBdEIsQ0FBVjtBQUdBLEtBSkQsTUFJTztBQUNOTixnQkFBVUMsUUFBUUMsRUFBUixDQUFXLGVBQVgsRUFBNEI7QUFDckNDLGFBQUtkLFFBQVFBLEtBQUtlLFFBQWIsSUFBeUI5QixXQUFXK0IsUUFBWCxDQUFvQkMsR0FBcEIsQ0FBd0IsVUFBeEIsQ0FBekIsSUFBZ0U7QUFEaEMsT0FBNUIsQ0FBVjtBQUdBOztBQUNEaEMsZUFBV1UsTUFBWCxDQUFrQnVCLFFBQWxCLENBQTJCQyxxREFBM0IsQ0FBaUYsc0JBQWpGLEVBQXlHaEMsR0FBekcsRUFBOEd3QixPQUE5RyxFQUF1SFgsSUFBdkg7QUFDQTs7QUFDRCxTQUFPTyxNQUFQO0FBQ0EsQ0F2Q0QsQzs7Ozs7Ozs7Ozs7QUNEQSxJQUFJYSxDQUFKO0FBQU1DLE9BQU9DLEtBQVAsQ0FBYUMsUUFBUSxtQkFBUixDQUFiLEVBQTBDO0FBQUNDLFVBQVFDLENBQVIsRUFBVTtBQUFDTCxRQUFFSyxDQUFGO0FBQUk7O0FBQWhCLENBQTFDLEVBQTRELENBQTVEOztBQUVOeEMsV0FBV3lDLGFBQVgsR0FBMkIsVUFBU3ZDLEdBQVQsRUFBY3dDLFNBQWQsRUFBeUIzQixJQUF6QixFQUErQkMsY0FBYyxJQUE3QyxFQUFtRDtBQUM3RSxNQUFJLENBQUNaLE1BQU1DLElBQU4sQ0FBV0gsR0FBWCxFQUFnQkksTUFBaEIsQ0FBTCxFQUE4QjtBQUM3QixVQUFNLElBQUlDLE9BQU9DLEtBQVgsQ0FBaUIsY0FBakIsRUFBaUMsY0FBakMsRUFBaUQ7QUFDdEQsa0JBQVk7QUFEMEMsS0FBakQsQ0FBTjtBQUdBOztBQUNEa0MsY0FBWVAsRUFBRVEsVUFBRixDQUFhRCxTQUFiLENBQVo7QUFDQSxRQUFNRSxTQUFTNUMsV0FBV1UsTUFBWCxDQUFrQkMsS0FBbEIsQ0FBd0JrQyxZQUF4QixDQUFxQzNDLEdBQXJDLEVBQTBDd0MsU0FBMUMsQ0FBZjs7QUFDQSxNQUFJRSxVQUFVNUIsV0FBZCxFQUEyQjtBQUMxQmhCLGVBQVdVLE1BQVgsQ0FBa0J1QixRQUFsQixDQUEyQkMscURBQTNCLENBQWlGLG9CQUFqRixFQUF1R2hDLEdBQXZHLEVBQTRHd0MsU0FBNUcsRUFBdUgzQixJQUF2SDtBQUNBOztBQUNELFNBQU82QixNQUFQO0FBQ0EsQ0FaRCxDOzs7Ozs7Ozs7Ozs7Ozs7QUNGQSxJQUFJVCxDQUFKO0FBQU1DLE9BQU9DLEtBQVAsQ0FBYUMsUUFBUSxtQkFBUixDQUFiLEVBQTBDO0FBQUNDLFVBQVFDLENBQVIsRUFBVTtBQUFDTCxRQUFFSyxDQUFGO0FBQUk7O0FBQWhCLENBQTFDLEVBQTRELENBQTVEOztBQUVOeEMsV0FBVzhDLG9CQUFYLEdBQWtDLFVBQVM1QyxHQUFULEVBQWM2QyxnQkFBZCxFQUFnQ2hDLElBQWhDLEVBQXNDQyxjQUFZLElBQWxELEVBQXdEO0FBQ3pGLE1BQUksQ0FBQ1osTUFBTUMsSUFBTixDQUFXSCxHQUFYLEVBQWdCSSxNQUFoQixDQUFMLEVBQThCO0FBQzdCLFVBQU0sSUFBSUMsT0FBT0MsS0FBWCxDQUFpQixjQUFqQixFQUFpQyxjQUFqQyxFQUFpRDtBQUFFQyxnQkFBVTtBQUFaLEtBQWpELENBQU47QUFDQTs7QUFFRCxNQUFJaUIsT0FBSjtBQUNBLE1BQUlzQixtQkFBSjs7QUFDQSxNQUFJLE9BQU9ELGdCQUFQLEtBQTRCLFFBQWhDLEVBQTBDO0FBQ3pDckIsY0FBVXFCLGdCQUFWO0FBQ0EsR0FGRCxNQUVPO0FBQUEsNEJBQytCQSxnQkFEL0I7QUFBQSxLQUNMO0FBQUNyQjtBQUFELHlCQURLO0FBQ1FzQix1QkFEUjtBQUFBO0FBRU47O0FBRUQsUUFBTUMsaUJBQWlCZCxFQUFFUSxVQUFGLENBQWFqQixPQUFiLENBQXZCO0FBRUEsUUFBTXdCLFVBQVVsRCxXQUFXVSxNQUFYLENBQWtCQyxLQUFsQixDQUF3QndDLG1CQUF4QixDQUE0Q2pELEdBQTVDLEVBQWlEK0MsY0FBakQsRUFBaUVELG1CQUFqRSxDQUFoQjs7QUFDQSxNQUFJRSxXQUFXbEMsV0FBZixFQUE0QjtBQUMzQmhCLGVBQVdVLE1BQVgsQ0FBa0J1QixRQUFsQixDQUEyQkMscURBQTNCLENBQWlGLDJCQUFqRixFQUE4R2hDLEdBQTlHLEVBQW1IK0MsY0FBbkgsRUFBbUlsQyxJQUFuSTtBQUNBOztBQUVELFNBQU9tQyxPQUFQO0FBQ0EsQ0FyQkQsQzs7Ozs7Ozs7Ozs7QUNEQWxELFdBQVdvRCxZQUFYLEdBQTBCLFVBQVNsRCxHQUFULEVBQWNtRCxXQUFkLEVBQTJCdEMsSUFBM0IsRUFBaUNDLGNBQWMsSUFBL0MsRUFBcUQ7QUFDOUUsUUFBTUUsT0FBT2xCLFdBQVdVLE1BQVgsQ0FBa0JDLEtBQWxCLENBQXdCUSxXQUF4QixDQUFvQ2pCLEdBQXBDLENBQWI7O0FBQ0EsTUFBSUYsV0FBV3NELFNBQVgsQ0FBcUJBLFNBQXJCLENBQStCcEMsS0FBS0csQ0FBcEMsRUFBdUNrQyxlQUF2QyxFQUFKLEVBQThEO0FBQzdELFVBQU0sSUFBSWhELE9BQU9DLEtBQVgsQ0FBaUIsbUJBQWpCLEVBQXNDLGFBQXRDLEVBQXFEO0FBQzFELGtCQUFZO0FBRDhDLEtBQXJELENBQU47QUFHQTs7QUFDRCxNQUFJNkMsZ0JBQWdCbkMsS0FBS3NDLElBQXpCLEVBQStCO0FBQzlCO0FBQ0E7O0FBRUQsUUFBTUMsb0JBQW9CekQsV0FBVzBELGdCQUFYLENBQTRCTCxXQUE1QixFQUF5Q25ELEdBQXpDLENBQTFCO0FBRUEsUUFBTTBDLFNBQVM1QyxXQUFXVSxNQUFYLENBQWtCQyxLQUFsQixDQUF3QmdELFdBQXhCLENBQW9DekQsR0FBcEMsRUFBeUN1RCxpQkFBekMsRUFBNERKLFdBQTVELEtBQTRFckQsV0FBV1UsTUFBWCxDQUFrQmMsYUFBbEIsQ0FBZ0NvQywwQkFBaEMsQ0FBMkQxRCxHQUEzRCxFQUFnRXVELGlCQUFoRSxFQUFtRkosV0FBbkYsQ0FBM0Y7O0FBRUEsTUFBSVQsVUFBVTVCLFdBQWQsRUFBMkI7QUFDMUJoQixlQUFXVSxNQUFYLENBQWtCdUIsUUFBbEIsQ0FBMkI0QiwwQ0FBM0IsQ0FBc0UzRCxHQUF0RSxFQUEyRW1ELFdBQTNFLEVBQXdGdEMsSUFBeEY7QUFDQTs7QUFDRCxTQUFPc0MsV0FBUDtBQUNBLENBbkJELEM7Ozs7Ozs7Ozs7O0FDREFyRCxXQUFXOEQsZ0JBQVgsR0FBOEIsVUFBUzVELEdBQVQsRUFBYzZELFFBQWQsRUFBd0I7QUFDckQsTUFBSSxDQUFDM0QsTUFBTUMsSUFBTixDQUFXSCxHQUFYLEVBQWdCSSxNQUFoQixDQUFMLEVBQThCO0FBQzdCLFVBQU0sSUFBSUMsT0FBT0MsS0FBWCxDQUFpQixjQUFqQixFQUFpQyxjQUFqQyxFQUFpRDtBQUN0RCxrQkFBWTtBQUQwQyxLQUFqRCxDQUFOO0FBR0E7O0FBQ0QsU0FBT1IsV0FBV1UsTUFBWCxDQUFrQkMsS0FBbEIsQ0FBd0JxRCxlQUF4QixDQUF3QzlELEdBQXhDLEVBQTZDNkQsUUFBN0MsQ0FBUDtBQUNBLENBUEQsQzs7Ozs7Ozs7Ozs7QUNBQSxJQUFJNUIsQ0FBSjtBQUFNQyxPQUFPQyxLQUFQLENBQWFDLFFBQVEsbUJBQVIsQ0FBYixFQUEwQztBQUFDQyxVQUFRQyxDQUFSLEVBQVU7QUFBQ0wsUUFBRUssQ0FBRjtBQUFJOztBQUFoQixDQUExQyxFQUE0RCxDQUE1RDs7QUFFTnhDLFdBQVdpRSxtQkFBWCxHQUFpQyxVQUFTL0QsR0FBVCxFQUFjZ0UsZUFBZCxFQUErQm5ELElBQS9CLEVBQXFDO0FBRXJFLE1BQUksQ0FBQ1gsTUFBTUMsSUFBTixDQUFXSCxHQUFYLEVBQWdCSSxNQUFoQixDQUFMLEVBQThCO0FBQzdCLFVBQU0sSUFBSUMsT0FBT0MsS0FBWCxDQUFpQixjQUFqQixFQUFpQyxjQUFqQyxFQUFpRDtBQUN0RCxrQkFBWTtBQUQwQyxLQUFqRCxDQUFOO0FBR0E7O0FBQ0QsUUFBTTJELHlCQUF5QmhDLEVBQUVRLFVBQUYsQ0FBYXVCLGVBQWIsQ0FBL0I7QUFDQSxRQUFNdEIsU0FBUzVDLFdBQVdVLE1BQVgsQ0FBa0JDLEtBQWxCLENBQXdCeUQsa0JBQXhCLENBQTJDbEUsR0FBM0MsRUFBZ0RpRSxzQkFBaEQsQ0FBZjtBQUNBbkUsYUFBV1UsTUFBWCxDQUFrQnVCLFFBQWxCLENBQTJCQyxxREFBM0IsQ0FBaUYsMEJBQWpGLEVBQTZHaEMsR0FBN0csRUFBa0hpRSxzQkFBbEgsRUFBMElwRCxJQUExSTtBQUNBLFNBQU82QixNQUFQO0FBQ0EsQ0FYRCxDOzs7Ozs7Ozs7OztBQ0ZBNUMsV0FBV3FFLHNCQUFYLEdBQW9DLFVBQVNuRSxHQUFULEVBQWNvRSxjQUFkLEVBQThCO0FBQ2pFLE1BQUksQ0FBQ2xFLE1BQU1DLElBQU4sQ0FBV0gsR0FBWCxFQUFnQkksTUFBaEIsQ0FBTCxFQUE4QjtBQUM3QixVQUFNLElBQUlDLE9BQU9DLEtBQVgsQ0FBaUIsY0FBakIsRUFBaUMsY0FBakMsRUFBaUQ7QUFDdEQsa0JBQVk7QUFEMEMsS0FBakQsQ0FBTjtBQUdBOztBQUNELFNBQU9SLFdBQVdVLE1BQVgsQ0FBa0JDLEtBQWxCLENBQXdCNEQscUJBQXhCLENBQThDckUsR0FBOUMsRUFBbURvRSxjQUFuRCxDQUFQO0FBQ0EsQ0FQRCxDOzs7Ozs7Ozs7OztBQ0FBLE1BQU1FLFNBQVMsQ0FBQyxVQUFELEVBQWEsV0FBYixFQUEwQixrQkFBMUIsRUFBOEMsaUJBQTlDLEVBQWlFLFVBQWpFLEVBQTZFLFVBQTdFLEVBQXlGLG1CQUF6RixFQUE4RyxnQkFBOUcsRUFBZ0ksU0FBaEksRUFBMkksVUFBM0ksRUFBdUosV0FBdkosRUFBb0ssa0JBQXBLLENBQWY7QUFDQWpFLE9BQU9rRSxPQUFQLENBQWU7QUFDZEMsbUJBQWlCeEUsR0FBakIsRUFBc0I2QixRQUF0QixFQUFnQzRDLEtBQWhDLEVBQXVDO0FBQ3RDLFFBQUksQ0FBQ3BFLE9BQU9xRSxNQUFQLEVBQUwsRUFBc0I7QUFDckIsWUFBTSxJQUFJckUsT0FBT0MsS0FBWCxDQUFpQixvQkFBakIsRUFBdUMsY0FBdkMsRUFBdUQ7QUFDNUQsb0JBQVk7QUFEZ0QsT0FBdkQsQ0FBTjtBQUdBOztBQUNELFFBQUksQ0FBQ0osTUFBTUMsSUFBTixDQUFXSCxHQUFYLEVBQWdCSSxNQUFoQixDQUFMLEVBQThCO0FBQzdCLFlBQU0sSUFBSUMsT0FBT0MsS0FBWCxDQUFpQixvQkFBakIsRUFBdUMsY0FBdkMsRUFBdUQ7QUFDNURxRSxnQkFBUTtBQURvRCxPQUF2RCxDQUFOO0FBR0E7O0FBRUQsUUFBSSxPQUFPOUMsUUFBUCxLQUFvQixRQUF4QixFQUFrQztBQUNqQ0EsaUJBQVc7QUFDVixTQUFDQSxRQUFELEdBQWE0QztBQURILE9BQVg7QUFHQTs7QUFFRCxRQUFJLENBQUNHLE9BQU9DLElBQVAsQ0FBWWhELFFBQVosRUFBc0JpRCxLQUF0QixDQUE0QkMsT0FBT1QsT0FBT1UsUUFBUCxDQUFnQkQsR0FBaEIsQ0FBbkMsQ0FBTCxFQUErRDtBQUM5RCxZQUFNLElBQUkxRSxPQUFPQyxLQUFYLENBQWlCLHdCQUFqQixFQUEyQywyQkFBM0MsRUFBd0U7QUFDN0VxRSxnQkFBUTtBQURxRSxPQUF4RSxDQUFOO0FBR0E7O0FBRUQsUUFBSSxDQUFDN0UsV0FBV21GLEtBQVgsQ0FBaUJDLGFBQWpCLENBQStCN0UsT0FBT3FFLE1BQVAsRUFBL0IsRUFBZ0QsV0FBaEQsRUFBNkQxRSxHQUE3RCxDQUFMLEVBQXdFO0FBQ3ZFLFlBQU0sSUFBSUssT0FBT0MsS0FBWCxDQUFpQiwwQkFBakIsRUFBNkMsNkJBQTdDLEVBQTRFO0FBQ2pGcUUsZ0JBQVEsa0JBRHlFO0FBRWpGUSxnQkFBUTtBQUZ5RSxPQUE1RSxDQUFOO0FBSUE7O0FBRUQsVUFBTW5FLE9BQU9sQixXQUFXVSxNQUFYLENBQWtCQyxLQUFsQixDQUF3QlEsV0FBeEIsQ0FBb0NqQixHQUFwQyxDQUFiOztBQUVBLFFBQUlnQixLQUFLb0UsU0FBTCxLQUFtQnZELFNBQVNnQyxRQUFULElBQXFCaEMsU0FBU3dELGlCQUFqRCxDQUFKLEVBQXlFO0FBQ3hFLFlBQU0sSUFBSWhGLE9BQU9DLEtBQVgsQ0FBaUIsMEJBQWpCLEVBQTZDLHdFQUE3QyxFQUF1SDtBQUM1SHFFLGdCQUFRLGtCQURvSDtBQUU1SFEsZ0JBQVE7QUFGb0gsT0FBdkgsQ0FBTjtBQUlBOztBQUVELFFBQUksQ0FBQ25FLElBQUwsRUFBVztBQUNWLFlBQU0sSUFBSVgsT0FBT0MsS0FBWCxDQUFpQixvQkFBakIsRUFBdUMsY0FBdkMsRUFBdUQ7QUFDNURxRSxnQkFBUTtBQURvRCxPQUF2RCxDQUFOO0FBR0E7O0FBRUQsVUFBTTlELE9BQU9SLE9BQU9RLElBQVAsRUFBYjtBQUVBK0QsV0FBT0MsSUFBUCxDQUFZaEQsUUFBWixFQUFzQnlELE9BQXRCLENBQThCQyxXQUFXO0FBQ3hDLFlBQU1kLFFBQVE1QyxTQUFTMEQsT0FBVCxDQUFkOztBQUNBLFVBQUkxRCxhQUFhLFNBQWIsSUFBMEIsQ0FBQy9CLFdBQVdtRixLQUFYLENBQWlCQyxhQUFqQixDQUErQixLQUFLUixNQUFwQyxFQUE0QywwQkFBNUMsQ0FBL0IsRUFBd0c7QUFDdkcsY0FBTSxJQUFJckUsT0FBT0MsS0FBWCxDQUFpQiwwQkFBakIsRUFBNkMsNENBQTdDLEVBQTJGO0FBQ2hHcUUsa0JBQVEsa0JBRHdGO0FBRWhHUSxrQkFBUTtBQUZ3RixTQUEzRixDQUFOO0FBSUE7O0FBQ0QsVUFBSUksWUFBWSxVQUFaLElBQTBCZCxVQUFVekQsS0FBS0csQ0FBekMsSUFBOENzRCxVQUFVLEdBQXhELElBQStELENBQUMzRSxXQUFXbUYsS0FBWCxDQUFpQkMsYUFBakIsQ0FBK0IsS0FBS1IsTUFBcEMsRUFBNEMsVUFBNUMsQ0FBcEUsRUFBNkg7QUFDNUgsY0FBTSxJQUFJckUsT0FBT0MsS0FBWCxDQUFpQiwwQkFBakIsRUFBNkMsNkRBQTdDLEVBQTRHO0FBQ2pIcUUsa0JBQVEsa0JBRHlHO0FBRWpIUSxrQkFBUTtBQUZ5RyxTQUE1RyxDQUFOO0FBSUE7O0FBQ0QsVUFBSUksWUFBWSxVQUFaLElBQTBCZCxVQUFVekQsS0FBS0csQ0FBekMsSUFBOENzRCxVQUFVLEdBQXhELElBQStELENBQUMzRSxXQUFXbUYsS0FBWCxDQUFpQkMsYUFBakIsQ0FBK0IsS0FBS1IsTUFBcEMsRUFBNEMsVUFBNUMsQ0FBcEUsRUFBNkg7QUFDNUgsY0FBTSxJQUFJckUsT0FBT0MsS0FBWCxDQUFpQiwwQkFBakIsRUFBNkMsNERBQTdDLEVBQTJHO0FBQ2hIcUUsa0JBQVEsa0JBRHdHO0FBRWhIUSxrQkFBUTtBQUZ3RyxTQUEzRyxDQUFOO0FBSUE7QUFDRCxLQXBCRDtBQXNCQVAsV0FBT0MsSUFBUCxDQUFZaEQsUUFBWixFQUFzQnlELE9BQXRCLENBQThCQyxXQUFXO0FBQ3hDLFlBQU1kLFFBQVE1QyxTQUFTMEQsT0FBVCxDQUFkOztBQUNBLGNBQVFBLE9BQVI7QUFDQyxhQUFLLFVBQUw7QUFDQ3pGLHFCQUFXb0QsWUFBWCxDQUF3QmxELEdBQXhCLEVBQTZCeUUsS0FBN0IsRUFBb0M1RCxJQUFwQztBQUNBOztBQUNELGFBQUssV0FBTDtBQUNDLGNBQUk0RCxVQUFVekQsS0FBS3dFLEtBQW5CLEVBQTBCO0FBQ3pCMUYsdUJBQVd5QyxhQUFYLENBQXlCdkMsR0FBekIsRUFBOEJ5RSxLQUE5QixFQUFxQzVELElBQXJDO0FBQ0E7O0FBQ0Q7O0FBQ0QsYUFBSyxrQkFBTDtBQUNDLGNBQUk0RCxVQUFVekQsS0FBS3lFLFlBQW5CLEVBQWlDO0FBQ2hDM0YsdUJBQVc4QyxvQkFBWCxDQUFnQzVDLEdBQWhDLEVBQXFDeUUsS0FBckMsRUFBNEM1RCxJQUE1QztBQUNBOztBQUNEOztBQUNELGFBQUssaUJBQUw7QUFDQyxjQUFJNEQsVUFBVXpELEtBQUswRSxXQUFuQixFQUFnQztBQUMvQjVGLHVCQUFXaUUsbUJBQVgsQ0FBK0IvRCxHQUEvQixFQUFvQ3lFLEtBQXBDLEVBQTJDNUQsSUFBM0M7QUFDQTs7QUFDRDs7QUFDRCxhQUFLLFVBQUw7QUFDQyxjQUFJNEQsVUFBVXpELEtBQUtHLENBQW5CLEVBQXNCO0FBQ3JCckIsdUJBQVdhLFlBQVgsQ0FBd0JYLEdBQXhCLEVBQTZCeUUsS0FBN0IsRUFBb0M1RCxJQUFwQztBQUNBOztBQUNEOztBQUNELGFBQUssV0FBTDtBQUNDOEUsZ0JBQU1sQixLQUFOLEVBQWE7QUFDWnJDLHFCQUFTaEMsTUFERztBQUVad0Ysb0JBQVEsQ0FBQztBQUNSQyxxQkFBT3pGLE1BREM7QUFFUjBGLHVCQUFTMUY7QUFGRCxhQUFEO0FBRkksV0FBYjtBQU9BTixxQkFBV2lHLGlCQUFYLENBQTZCL0YsR0FBN0IsRUFBa0N5RSxLQUFsQztBQUNBOztBQUNELGFBQUssa0JBQUw7QUFDQzNFLHFCQUFXa0csb0JBQVgsQ0FBZ0NoRyxHQUFoQyxFQUFxQ3lFLEtBQXJDO0FBQ0E7O0FBQ0QsYUFBSyxVQUFMO0FBQ0MsY0FBSUEsVUFBVXpELEtBQUtpRixFQUFuQixFQUF1QjtBQUN0Qm5HLHVCQUFXOEQsZ0JBQVgsQ0FBNEI1RCxHQUE1QixFQUFpQ3lFLEtBQWpDLEVBQXdDNUQsSUFBeEM7QUFDQTs7QUFDRDs7QUFDRCxhQUFLLG1CQUFMO0FBQ0MsY0FBSTRELFVBQVV6RCxLQUFLcUUsaUJBQW5CLEVBQXNDO0FBQ3JDdkYsdUJBQVdDLHFCQUFYLENBQWlDQyxHQUFqQyxFQUFzQ3lFLEtBQXRDLEVBQTZDNUQsSUFBN0M7QUFDQTs7QUFDRDs7QUFDRCxhQUFLLGdCQUFMO0FBQ0MsY0FBSTRELFVBQVV6RCxLQUFLa0YsTUFBbkIsRUFBMkI7QUFDMUJwRyx1QkFBV3FFLHNCQUFYLENBQWtDbkUsR0FBbEMsRUFBdUN5RSxLQUF2QyxFQUE4QzVELElBQTlDO0FBQ0E7O0FBQ0Q7O0FBQ0QsYUFBSyxVQUFMO0FBQ0NmLHFCQUFXVSxNQUFYLENBQWtCQyxLQUFsQixDQUF3QjBGLGVBQXhCLENBQXdDbkcsR0FBeEMsRUFBNkNJLE9BQU9xRSxLQUFQLENBQTdDO0FBQ0E7O0FBQ0QsYUFBSyxTQUFMO0FBQ0MzRSxxQkFBV1UsTUFBWCxDQUFrQkMsS0FBbEIsQ0FBd0IyRixlQUF4QixDQUF3Q3BHLEdBQXhDLEVBQTZDeUUsS0FBN0M7QUF4REY7QUEwREEsS0E1REQ7QUE4REEsV0FBTztBQUNOckQsY0FBUSxJQURGO0FBRU5wQixXQUFLZ0IsS0FBS0U7QUFGSixLQUFQO0FBSUE7O0FBeklhLENBQWYsRTs7Ozs7Ozs7Ozs7QUNEQXBCLFdBQVdVLE1BQVgsQ0FBa0J1QixRQUFsQixDQUEyQkMscURBQTNCLEdBQW1GLFVBQVNqQixJQUFULEVBQWVzRixNQUFmLEVBQXVCN0UsT0FBdkIsRUFBZ0NYLElBQWhDLEVBQXNDeUYsU0FBdEMsRUFBaUQ7QUFDbkksU0FBTyxLQUFLQyxrQ0FBTCxDQUF3Q3hGLElBQXhDLEVBQThDc0YsTUFBOUMsRUFBc0Q3RSxPQUF0RCxFQUErRFgsSUFBL0QsRUFBcUV5RixTQUFyRSxDQUFQO0FBQ0EsQ0FGRDs7QUFJQXhHLFdBQVdVLE1BQVgsQ0FBa0J1QixRQUFsQixDQUEyQjRCLDBDQUEzQixHQUF3RSxVQUFTMEMsTUFBVCxFQUFpQkcsUUFBakIsRUFBMkIzRixJQUEzQixFQUFpQ3lGLFNBQWpDLEVBQTRDO0FBQ25ILFNBQU8sS0FBS0Msa0NBQUwsQ0FBd0MsR0FBeEMsRUFBNkNGLE1BQTdDLEVBQXFERyxRQUFyRCxFQUErRDNGLElBQS9ELEVBQXFFeUYsU0FBckUsQ0FBUDtBQUNBLENBRkQsQzs7Ozs7Ozs7Ozs7QUNKQXhHLFdBQVdVLE1BQVgsQ0FBa0JDLEtBQWxCLENBQXdCeUQsa0JBQXhCLEdBQTZDLFVBQVNoRCxHQUFULEVBQWN3RSxXQUFkLEVBQTJCO0FBQ3ZFLFFBQU1lLFFBQVE7QUFDYnZGO0FBRGEsR0FBZDtBQUdBLFFBQU13QixTQUFTO0FBQ2RnRSxVQUFNO0FBQ0xoQjtBQURLO0FBRFEsR0FBZjtBQUtBLFNBQU8sS0FBS2hELE1BQUwsQ0FBWStELEtBQVosRUFBbUIvRCxNQUFuQixDQUFQO0FBQ0EsQ0FWRDs7QUFZQTVDLFdBQVdVLE1BQVgsQ0FBa0JDLEtBQWxCLENBQXdCcUQsZUFBeEIsR0FBMEMsVUFBUzVDLEdBQVQsRUFBYzJDLFFBQWQsRUFBd0I7QUFDakUsUUFBTTRDLFFBQVE7QUFDYnZGO0FBRGEsR0FBZDtBQUdBLFFBQU13QixTQUFTO0FBQ2RnRSxVQUFNO0FBQ0xULFVBQUlwQztBQURDO0FBRFEsR0FBZjs7QUFLQSxNQUFJQSxRQUFKLEVBQWM7QUFDYi9ELGVBQVdVLE1BQVgsQ0FBa0JjLGFBQWxCLENBQWdDcUYsWUFBaEMsQ0FBNkN6RixHQUE3QyxFQUFrRG9FLE9BQWxELENBQTBELFVBQVNzQixZQUFULEVBQXVCO0FBQ2hGLFVBQUlBLGFBQWFDLEtBQWIsSUFBc0IsSUFBMUIsRUFBZ0M7QUFDL0I7QUFDQTs7QUFDRCxZQUFNaEcsT0FBTytGLGFBQWFDLEtBQTFCOztBQUNBLFVBQUkvRyxXQUFXbUYsS0FBWCxDQUFpQkMsYUFBakIsQ0FBK0JyRSxLQUFLSyxHQUFwQyxFQUF5QyxlQUF6QyxNQUE4RCxLQUFsRSxFQUF5RTtBQUN4RSxZQUFJLENBQUN3QixPQUFPZ0UsSUFBUCxDQUFZSSxLQUFqQixFQUF3QjtBQUN2QnBFLGlCQUFPZ0UsSUFBUCxDQUFZSSxLQUFaLEdBQW9CLEVBQXBCO0FBQ0E7O0FBQ0QsZUFBT3BFLE9BQU9nRSxJQUFQLENBQVlJLEtBQVosQ0FBa0JDLElBQWxCLENBQXVCbEcsS0FBS21HLFFBQTVCLENBQVA7QUFDQTtBQUNELEtBWEQ7QUFZQSxHQWJELE1BYU87QUFDTnRFLFdBQU91RSxNQUFQLEdBQWdCO0FBQ2ZILGFBQU87QUFEUSxLQUFoQjtBQUdBOztBQUNELFNBQU8sS0FBS3BFLE1BQUwsQ0FBWStELEtBQVosRUFBbUIvRCxNQUFuQixDQUFQO0FBQ0EsQ0E1QkQ7O0FBOEJBNUMsV0FBV1UsTUFBWCxDQUFrQkMsS0FBbEIsQ0FBd0JDLGdDQUF4QixHQUEyRCxVQUFTUSxHQUFULEVBQWNnRyxhQUFkLEVBQTZCO0FBQ3ZGLFFBQU1ULFFBQVE7QUFDYnZGO0FBRGEsR0FBZDtBQUdBLFFBQU13QixTQUFTO0FBQ2RnRSxVQUFNO0FBQ0xyQix5QkFBbUI2QjtBQURkO0FBRFEsR0FBZjtBQUtBLFNBQU8sS0FBS3hFLE1BQUwsQ0FBWStELEtBQVosRUFBbUIvRCxNQUFuQixDQUFQO0FBQ0EsQ0FWRDs7QUFZQTVDLFdBQVdVLE1BQVgsQ0FBa0JDLEtBQWxCLENBQXdCNEQscUJBQXhCLEdBQWdELFVBQVNuRCxHQUFULEVBQWNrRCxjQUFkLEVBQThCO0FBQzdFLFFBQU1xQyxRQUFRO0FBQ2J2RjtBQURhLEdBQWQ7QUFHQSxRQUFNd0IsU0FBUztBQUNkZ0UsVUFBTTtBQUNMUixjQUFROUI7QUFESDtBQURRLEdBQWY7QUFLQSxTQUFPLEtBQUsxQixNQUFMLENBQVkrRCxLQUFaLEVBQW1CL0QsTUFBbkIsQ0FBUDtBQUNBLENBVkQsQzs7Ozs7Ozs7Ozs7QUN0REFyQyxPQUFPOEcsT0FBUCxDQUFlLFlBQVc7QUFDekJySCxhQUFXVSxNQUFYLENBQWtCNEcsV0FBbEIsQ0FBOEJDLE1BQTlCLENBQXFDLGVBQXJDLEVBQXNEO0FBQUNDLGtCQUFjO0FBQUVDLGFBQU8sQ0FBQyxPQUFELEVBQVUsT0FBVixFQUFtQixXQUFuQjtBQUFUO0FBQWYsR0FBdEQ7QUFDQXpILGFBQVdVLE1BQVgsQ0FBa0I0RyxXQUFsQixDQUE4QkMsTUFBOUIsQ0FBcUMsY0FBckMsRUFBcUQ7QUFBQ0Msa0JBQWM7QUFBRUMsYUFBTyxDQUFDLE9BQUQsRUFBVSxPQUFWO0FBQVQ7QUFBZixHQUFyRDtBQUNBekgsYUFBV1UsTUFBWCxDQUFrQjRHLFdBQWxCLENBQThCQyxNQUE5QixDQUFxQyx5QkFBckMsRUFBZ0U7QUFBQ0Msa0JBQWM7QUFBRUMsYUFBTyxDQUFDLE9BQUQsRUFBVSxPQUFWO0FBQVQ7QUFBZixHQUFoRTtBQUNBLENBSkQsRSIsImZpbGUiOiIvcGFja2FnZXMvcm9ja2V0Y2hhdF9jaGFubmVsLXNldHRpbmdzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiUm9ja2V0Q2hhdC5zYXZlUmVhY3RXaGVuUmVhZE9ubHkgPSBmdW5jdGlvbihyaWQsIGFsbG93UmVhY3QpIHtcblx0aWYgKCFNYXRjaC50ZXN0KHJpZCwgU3RyaW5nKSkge1xuXHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2ludmFsaWQtcm9vbScsICdJbnZhbGlkIHJvb20nLCB7IGZ1bmN0aW9uOiAnUm9ja2V0Q2hhdC5zYXZlUmVhY3RXaGVuUmVhZE9ubHknIH0pO1xuXHR9XG5cblx0cmV0dXJuIFJvY2tldENoYXQubW9kZWxzLlJvb21zLnNldEFsbG93UmVhY3RpbmdXaGVuUmVhZE9ubHlCeUlkKHJpZCwgYWxsb3dSZWFjdCk7XG59O1xuIiwiXG5Sb2NrZXRDaGF0LnNhdmVSb29tVHlwZSA9IGZ1bmN0aW9uKHJpZCwgcm9vbVR5cGUsIHVzZXIsIHNlbmRNZXNzYWdlID0gdHJ1ZSkge1xuXHRpZiAoIU1hdGNoLnRlc3QocmlkLCBTdHJpbmcpKSB7XG5cdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignaW52YWxpZC1yb29tJywgJ0ludmFsaWQgcm9vbScsIHtcblx0XHRcdCdmdW5jdGlvbic6ICdSb2NrZXRDaGF0LnNhdmVSb29tVHlwZSdcblx0XHR9KTtcblx0fVxuXHRpZiAocm9vbVR5cGUgIT09ICdjJyAmJiByb29tVHlwZSAhPT0gJ3AnKSB7XG5cdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItaW52YWxpZC1yb29tLXR5cGUnLCAnZXJyb3ItaW52YWxpZC1yb29tLXR5cGUnLCB7XG5cdFx0XHQnZnVuY3Rpb24nOiAnUm9ja2V0Q2hhdC5zYXZlUm9vbVR5cGUnLFxuXHRcdFx0dHlwZTogcm9vbVR5cGVcblx0XHR9KTtcblx0fVxuXHRjb25zdCByb29tID0gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9uZUJ5SWQocmlkKTtcblx0aWYgKHJvb20gPT0gbnVsbCkge1xuXHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWludmFsaWQtcm9vbScsICdlcnJvci1pbnZhbGlkLXJvb20nLCB7XG5cdFx0XHQnZnVuY3Rpb24nOiAnUm9ja2V0Q2hhdC5zYXZlUm9vbVR5cGUnLFxuXHRcdFx0X2lkOiByaWRcblx0XHR9KTtcblx0fVxuXHRpZiAocm9vbS50ID09PSAnZCcpIHtcblx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1kaXJlY3Qtcm9vbScsICdDYW5cXCd0IGNoYW5nZSB0eXBlIG9mIGRpcmVjdCByb29tcycsIHtcblx0XHRcdCdmdW5jdGlvbic6ICdSb2NrZXRDaGF0LnNhdmVSb29tVHlwZSdcblx0XHR9KTtcblx0fVxuXHRjb25zdCByZXN1bHQgPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5zZXRUeXBlQnlJZChyaWQsIHJvb21UeXBlKSAmJiBSb2NrZXRDaGF0Lm1vZGVscy5TdWJzY3JpcHRpb25zLnVwZGF0ZVR5cGVCeVJvb21JZChyaWQsIHJvb21UeXBlKTtcblx0aWYgKHJlc3VsdCAmJiBzZW5kTWVzc2FnZSkge1xuXHRcdGxldCBtZXNzYWdlO1xuXHRcdGlmIChyb29tVHlwZSA9PT0gJ2MnKSB7XG5cdFx0XHRtZXNzYWdlID0gVEFQaTE4bi5fXygnQ2hhbm5lbCcsIHtcblx0XHRcdFx0bG5nOiB1c2VyICYmIHVzZXIubGFuZ3VhZ2UgfHwgUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ2xhbmd1YWdlJykgfHwgJ2VuJ1xuXHRcdFx0fSk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdG1lc3NhZ2UgPSBUQVBpMThuLl9fKCdQcml2YXRlX0dyb3VwJywge1xuXHRcdFx0XHRsbmc6IHVzZXIgJiYgdXNlci5sYW5ndWFnZSB8fCBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnbGFuZ3VhZ2UnKSB8fCAnZW4nXG5cdFx0XHR9KTtcblx0XHR9XG5cdFx0Um9ja2V0Q2hhdC5tb2RlbHMuTWVzc2FnZXMuY3JlYXRlUm9vbVNldHRpbmdzQ2hhbmdlZFdpdGhUeXBlUm9vbUlkTWVzc2FnZUFuZFVzZXIoJ3Jvb21fY2hhbmdlZF9wcml2YWN5JywgcmlkLCBtZXNzYWdlLCB1c2VyKTtcblx0fVxuXHRyZXR1cm4gcmVzdWx0O1xufTtcbiIsImltcG9ydCBzIGZyb20gJ3VuZGVyc2NvcmUuc3RyaW5nJztcblxuUm9ja2V0Q2hhdC5zYXZlUm9vbVRvcGljID0gZnVuY3Rpb24ocmlkLCByb29tVG9waWMsIHVzZXIsIHNlbmRNZXNzYWdlID0gdHJ1ZSkge1xuXHRpZiAoIU1hdGNoLnRlc3QocmlkLCBTdHJpbmcpKSB7XG5cdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignaW52YWxpZC1yb29tJywgJ0ludmFsaWQgcm9vbScsIHtcblx0XHRcdCdmdW5jdGlvbic6ICdSb2NrZXRDaGF0LnNhdmVSb29tVG9waWMnXG5cdFx0fSk7XG5cdH1cblx0cm9vbVRvcGljID0gcy5lc2NhcGVIVE1MKHJvb21Ub3BpYyk7XG5cdGNvbnN0IHVwZGF0ZSA9IFJvY2tldENoYXQubW9kZWxzLlJvb21zLnNldFRvcGljQnlJZChyaWQsIHJvb21Ub3BpYyk7XG5cdGlmICh1cGRhdGUgJiYgc2VuZE1lc3NhZ2UpIHtcblx0XHRSb2NrZXRDaGF0Lm1vZGVscy5NZXNzYWdlcy5jcmVhdGVSb29tU2V0dGluZ3NDaGFuZ2VkV2l0aFR5cGVSb29tSWRNZXNzYWdlQW5kVXNlcigncm9vbV9jaGFuZ2VkX3RvcGljJywgcmlkLCByb29tVG9waWMsIHVzZXIpO1xuXHR9XG5cdHJldHVybiB1cGRhdGU7XG59O1xuIiwiaW1wb3J0IHMgZnJvbSAndW5kZXJzY29yZS5zdHJpbmcnO1xuXG5Sb2NrZXRDaGF0LnNhdmVSb29tQW5ub3VuY2VtZW50ID0gZnVuY3Rpb24ocmlkLCByb29tQW5ub3VuY2VtZW50LCB1c2VyLCBzZW5kTWVzc2FnZT10cnVlKSB7XG5cdGlmICghTWF0Y2gudGVzdChyaWQsIFN0cmluZykpIHtcblx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdpbnZhbGlkLXJvb20nLCAnSW52YWxpZCByb29tJywgeyBmdW5jdGlvbjogJ1JvY2tldENoYXQuc2F2ZVJvb21Bbm5vdW5jZW1lbnQnIH0pO1xuXHR9XG5cblx0bGV0IG1lc3NhZ2U7XG5cdGxldCBhbm5vdW5jZW1lbnREZXRhaWxzO1xuXHRpZiAodHlwZW9mIHJvb21Bbm5vdW5jZW1lbnQgPT09ICdzdHJpbmcnKSB7XG5cdFx0bWVzc2FnZSA9IHJvb21Bbm5vdW5jZW1lbnQ7XG5cdH0gZWxzZSB7XG5cdFx0KHttZXNzYWdlLCAuLi5hbm5vdW5jZW1lbnREZXRhaWxzfSA9IHJvb21Bbm5vdW5jZW1lbnQpO1xuXHR9XG5cblx0Y29uc3QgZXNjYXBlZE1lc3NhZ2UgPSBzLmVzY2FwZUhUTUwobWVzc2FnZSk7XG5cblx0Y29uc3QgdXBkYXRlZCA9IFJvY2tldENoYXQubW9kZWxzLlJvb21zLnNldEFubm91bmNlbWVudEJ5SWQocmlkLCBlc2NhcGVkTWVzc2FnZSwgYW5ub3VuY2VtZW50RGV0YWlscyk7XG5cdGlmICh1cGRhdGVkICYmIHNlbmRNZXNzYWdlKSB7XG5cdFx0Um9ja2V0Q2hhdC5tb2RlbHMuTWVzc2FnZXMuY3JlYXRlUm9vbVNldHRpbmdzQ2hhbmdlZFdpdGhUeXBlUm9vbUlkTWVzc2FnZUFuZFVzZXIoJ3Jvb21fY2hhbmdlZF9hbm5vdW5jZW1lbnQnLCByaWQsIGVzY2FwZWRNZXNzYWdlLCB1c2VyKTtcblx0fVxuXG5cdHJldHVybiB1cGRhdGVkO1xufTtcbiIsIlxuUm9ja2V0Q2hhdC5zYXZlUm9vbU5hbWUgPSBmdW5jdGlvbihyaWQsIGRpc3BsYXlOYW1lLCB1c2VyLCBzZW5kTWVzc2FnZSA9IHRydWUpIHtcblx0Y29uc3Qgcm9vbSA9IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRPbmVCeUlkKHJpZCk7XG5cdGlmIChSb2NrZXRDaGF0LnJvb21UeXBlcy5yb29tVHlwZXNbcm9vbS50XS5wcmV2ZW50UmVuYW1pbmcoKSkge1xuXHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLW5vdC1hbGxvd2VkJywgJ05vdCBhbGxvd2VkJywge1xuXHRcdFx0J2Z1bmN0aW9uJzogJ1JvY2tldENoYXQuc2F2ZVJvb21kaXNwbGF5TmFtZSdcblx0XHR9KTtcblx0fVxuXHRpZiAoZGlzcGxheU5hbWUgPT09IHJvb20ubmFtZSkge1xuXHRcdHJldHVybjtcblx0fVxuXG5cdGNvbnN0IHNsdWdpZmllZFJvb21OYW1lID0gUm9ja2V0Q2hhdC5nZXRWYWxpZFJvb21OYW1lKGRpc3BsYXlOYW1lLCByaWQpO1xuXG5cdGNvbnN0IHVwZGF0ZSA9IFJvY2tldENoYXQubW9kZWxzLlJvb21zLnNldE5hbWVCeUlkKHJpZCwgc2x1Z2lmaWVkUm9vbU5hbWUsIGRpc3BsYXlOYW1lKSAmJiBSb2NrZXRDaGF0Lm1vZGVscy5TdWJzY3JpcHRpb25zLnVwZGF0ZU5hbWVBbmRBbGVydEJ5Um9vbUlkKHJpZCwgc2x1Z2lmaWVkUm9vbU5hbWUsIGRpc3BsYXlOYW1lKTtcblxuXHRpZiAodXBkYXRlICYmIHNlbmRNZXNzYWdlKSB7XG5cdFx0Um9ja2V0Q2hhdC5tb2RlbHMuTWVzc2FnZXMuY3JlYXRlUm9vbVJlbmFtZWRXaXRoUm9vbUlkUm9vbU5hbWVBbmRVc2VyKHJpZCwgZGlzcGxheU5hbWUsIHVzZXIpO1xuXHR9XG5cdHJldHVybiBkaXNwbGF5TmFtZTtcbn07XG4iLCJSb2NrZXRDaGF0LnNhdmVSb29tUmVhZE9ubHkgPSBmdW5jdGlvbihyaWQsIHJlYWRPbmx5KSB7XG5cdGlmICghTWF0Y2gudGVzdChyaWQsIFN0cmluZykpIHtcblx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdpbnZhbGlkLXJvb20nLCAnSW52YWxpZCByb29tJywge1xuXHRcdFx0J2Z1bmN0aW9uJzogJ1JvY2tldENoYXQuc2F2ZVJvb21SZWFkT25seSdcblx0XHR9KTtcblx0fVxuXHRyZXR1cm4gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuc2V0UmVhZE9ubHlCeUlkKHJpZCwgcmVhZE9ubHkpO1xufTtcbiIsImltcG9ydCBzIGZyb20gJ3VuZGVyc2NvcmUuc3RyaW5nJztcblxuUm9ja2V0Q2hhdC5zYXZlUm9vbURlc2NyaXB0aW9uID0gZnVuY3Rpb24ocmlkLCByb29tRGVzY3JpcHRpb24sIHVzZXIpIHtcblxuXHRpZiAoIU1hdGNoLnRlc3QocmlkLCBTdHJpbmcpKSB7XG5cdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignaW52YWxpZC1yb29tJywgJ0ludmFsaWQgcm9vbScsIHtcblx0XHRcdCdmdW5jdGlvbic6ICdSb2NrZXRDaGF0LnNhdmVSb29tRGVzY3JpcHRpb24nXG5cdFx0fSk7XG5cdH1cblx0Y29uc3QgZXNjYXBlZFJvb21EZXNjcmlwdGlvbiA9IHMuZXNjYXBlSFRNTChyb29tRGVzY3JpcHRpb24pO1xuXHRjb25zdCB1cGRhdGUgPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5zZXREZXNjcmlwdGlvbkJ5SWQocmlkLCBlc2NhcGVkUm9vbURlc2NyaXB0aW9uKTtcblx0Um9ja2V0Q2hhdC5tb2RlbHMuTWVzc2FnZXMuY3JlYXRlUm9vbVNldHRpbmdzQ2hhbmdlZFdpdGhUeXBlUm9vbUlkTWVzc2FnZUFuZFVzZXIoJ3Jvb21fY2hhbmdlZF9kZXNjcmlwdGlvbicsIHJpZCwgZXNjYXBlZFJvb21EZXNjcmlwdGlvbiwgdXNlcik7XG5cdHJldHVybiB1cGRhdGU7XG59O1xuIiwiUm9ja2V0Q2hhdC5zYXZlUm9vbVN5c3RlbU1lc3NhZ2VzID0gZnVuY3Rpb24ocmlkLCBzeXN0ZW1NZXNzYWdlcykge1xuXHRpZiAoIU1hdGNoLnRlc3QocmlkLCBTdHJpbmcpKSB7XG5cdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignaW52YWxpZC1yb29tJywgJ0ludmFsaWQgcm9vbScsIHtcblx0XHRcdCdmdW5jdGlvbic6ICdSb2NrZXRDaGF0LnNhdmVSb29tU3lzdGVtTWVzc2FnZXMnXG5cdFx0fSk7XG5cdH1cblx0cmV0dXJuIFJvY2tldENoYXQubW9kZWxzLlJvb21zLnNldFN5c3RlbU1lc3NhZ2VzQnlJZChyaWQsIHN5c3RlbU1lc3NhZ2VzKTtcbn07XG4iLCJjb25zdCBmaWVsZHMgPSBbJ3Jvb21OYW1lJywgJ3Jvb21Ub3BpYycsICdyb29tQW5ub3VuY2VtZW50JywgJ3Jvb21EZXNjcmlwdGlvbicsICdyb29tVHlwZScsICdyZWFkT25seScsICdyZWFjdFdoZW5SZWFkT25seScsICdzeXN0ZW1NZXNzYWdlcycsICdkZWZhdWx0JywgJ2pvaW5Db2RlJywgJ3Rva2VucGFzcycsICdzdHJlYW1pbmdPcHRpb25zJ107XG5NZXRlb3IubWV0aG9kcyh7XG5cdHNhdmVSb29tU2V0dGluZ3MocmlkLCBzZXR0aW5ncywgdmFsdWUpIHtcblx0XHRpZiAoIU1ldGVvci51c2VySWQoKSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItaW52YWxpZC11c2VyJywgJ0ludmFsaWQgdXNlcicsIHtcblx0XHRcdFx0J2Z1bmN0aW9uJzogJ1JvY2tldENoYXQuc2F2ZVJvb21OYW1lJ1xuXHRcdFx0fSk7XG5cdFx0fVxuXHRcdGlmICghTWF0Y2gudGVzdChyaWQsIFN0cmluZykpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWludmFsaWQtcm9vbScsICdJbnZhbGlkIHJvb20nLCB7XG5cdFx0XHRcdG1ldGhvZDogJ3NhdmVSb29tU2V0dGluZ3MnXG5cdFx0XHR9KTtcblx0XHR9XG5cblx0XHRpZiAodHlwZW9mIHNldHRpbmdzICE9PSAnb2JqZWN0Jykge1xuXHRcdFx0c2V0dGluZ3MgPSB7XG5cdFx0XHRcdFtzZXR0aW5nc10gOiB2YWx1ZVxuXHRcdFx0fTtcblx0XHR9XG5cblx0XHRpZiAoIU9iamVjdC5rZXlzKHNldHRpbmdzKS5ldmVyeShrZXkgPT4gZmllbGRzLmluY2x1ZGVzKGtleSkpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLXNldHRpbmdzJywgJ0ludmFsaWQgc2V0dGluZ3MgcHJvdmlkZWQnLCB7XG5cdFx0XHRcdG1ldGhvZDogJ3NhdmVSb29tU2V0dGluZ3MnXG5cdFx0XHR9KTtcblx0XHR9XG5cblx0XHRpZiAoIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbihNZXRlb3IudXNlcklkKCksICdlZGl0LXJvb20nLCByaWQpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1hY3Rpb24tbm90LWFsbG93ZWQnLCAnRWRpdGluZyByb29tIGlzIG5vdCBhbGxvd2VkJywge1xuXHRcdFx0XHRtZXRob2Q6ICdzYXZlUm9vbVNldHRpbmdzJyxcblx0XHRcdFx0YWN0aW9uOiAnRWRpdGluZ19yb29tJ1xuXHRcdFx0fSk7XG5cdFx0fVxuXG5cdFx0Y29uc3Qgcm9vbSA9IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRPbmVCeUlkKHJpZCk7XG5cblx0XHRpZiAocm9vbS5icm9hZGNhc3QgJiYgKHNldHRpbmdzLnJlYWRPbmx5IHx8IHNldHRpbmdzLnJlYWN0V2hlblJlYWRPbmx5KSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItYWN0aW9uLW5vdC1hbGxvd2VkJywgJ0VkaXRpbmcgcmVhZE9ubHkvcmVhY3RXaGVuUmVhZE9ubHkgYXJlIG5vdCBhbGxvd2VkIGZvciBicm9hZGNhc3Qgcm9vbXMnLCB7XG5cdFx0XHRcdG1ldGhvZDogJ3NhdmVSb29tU2V0dGluZ3MnLFxuXHRcdFx0XHRhY3Rpb246ICdFZGl0aW5nX3Jvb20nXG5cdFx0XHR9KTtcblx0XHR9XG5cblx0XHRpZiAoIXJvb20pIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWludmFsaWQtcm9vbScsICdJbnZhbGlkIHJvb20nLCB7XG5cdFx0XHRcdG1ldGhvZDogJ3NhdmVSb29tU2V0dGluZ3MnXG5cdFx0XHR9KTtcblx0XHR9XG5cblx0XHRjb25zdCB1c2VyID0gTWV0ZW9yLnVzZXIoKTtcblxuXHRcdE9iamVjdC5rZXlzKHNldHRpbmdzKS5mb3JFYWNoKHNldHRpbmcgPT4ge1xuXHRcdFx0Y29uc3QgdmFsdWUgPSBzZXR0aW5nc1tzZXR0aW5nXTtcblx0XHRcdGlmIChzZXR0aW5ncyA9PT0gJ2RlZmF1bHQnICYmICFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odGhpcy51c2VySWQsICd2aWV3LXJvb20tYWRtaW5pc3RyYXRpb24nKSkge1xuXHRcdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1hY3Rpb24tbm90LWFsbG93ZWQnLCAnVmlld2luZyByb29tIGFkbWluaXN0cmF0aW9uIGlzIG5vdCBhbGxvd2VkJywge1xuXHRcdFx0XHRcdG1ldGhvZDogJ3NhdmVSb29tU2V0dGluZ3MnLFxuXHRcdFx0XHRcdGFjdGlvbjogJ1ZpZXdpbmdfcm9vbV9hZG1pbmlzdHJhdGlvbidcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cdFx0XHRpZiAoc2V0dGluZyA9PT0gJ3Jvb21UeXBlJyAmJiB2YWx1ZSAhPT0gcm9vbS50ICYmIHZhbHVlID09PSAnYycgJiYgIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih0aGlzLnVzZXJJZCwgJ2NyZWF0ZS1jJykpIHtcblx0XHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItYWN0aW9uLW5vdC1hbGxvd2VkJywgJ0NoYW5naW5nIGEgcHJpdmF0ZSBncm91cCB0byBhIHB1YmxpYyBjaGFubmVsIGlzIG5vdCBhbGxvd2VkJywge1xuXHRcdFx0XHRcdG1ldGhvZDogJ3NhdmVSb29tU2V0dGluZ3MnLFxuXHRcdFx0XHRcdGFjdGlvbjogJ0NoYW5nZV9Sb29tX1R5cGUnXG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXHRcdFx0aWYgKHNldHRpbmcgPT09ICdyb29tVHlwZScgJiYgdmFsdWUgIT09IHJvb20udCAmJiB2YWx1ZSA9PT0gJ3AnICYmICFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odGhpcy51c2VySWQsICdjcmVhdGUtcCcpKSB7XG5cdFx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWFjdGlvbi1ub3QtYWxsb3dlZCcsICdDaGFuZ2luZyBhIHB1YmxpYyBjaGFubmVsIHRvIGEgcHJpdmF0ZSByb29tIGlzIG5vdCBhbGxvd2VkJywge1xuXHRcdFx0XHRcdG1ldGhvZDogJ3NhdmVSb29tU2V0dGluZ3MnLFxuXHRcdFx0XHRcdGFjdGlvbjogJ0NoYW5nZV9Sb29tX1R5cGUnXG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0T2JqZWN0LmtleXMoc2V0dGluZ3MpLmZvckVhY2goc2V0dGluZyA9PiB7XG5cdFx0XHRjb25zdCB2YWx1ZSA9IHNldHRpbmdzW3NldHRpbmddO1xuXHRcdFx0c3dpdGNoIChzZXR0aW5nKSB7XG5cdFx0XHRcdGNhc2UgJ3Jvb21OYW1lJzpcblx0XHRcdFx0XHRSb2NrZXRDaGF0LnNhdmVSb29tTmFtZShyaWQsIHZhbHVlLCB1c2VyKTtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0Y2FzZSAncm9vbVRvcGljJzpcblx0XHRcdFx0XHRpZiAodmFsdWUgIT09IHJvb20udG9waWMpIHtcblx0XHRcdFx0XHRcdFJvY2tldENoYXQuc2F2ZVJvb21Ub3BpYyhyaWQsIHZhbHVlLCB1c2VyKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdGNhc2UgJ3Jvb21Bbm5vdW5jZW1lbnQnOlxuXHRcdFx0XHRcdGlmICh2YWx1ZSAhPT0gcm9vbS5hbm5vdW5jZW1lbnQpIHtcblx0XHRcdFx0XHRcdFJvY2tldENoYXQuc2F2ZVJvb21Bbm5vdW5jZW1lbnQocmlkLCB2YWx1ZSwgdXNlcik7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRjYXNlICdyb29tRGVzY3JpcHRpb24nOlxuXHRcdFx0XHRcdGlmICh2YWx1ZSAhPT0gcm9vbS5kZXNjcmlwdGlvbikge1xuXHRcdFx0XHRcdFx0Um9ja2V0Q2hhdC5zYXZlUm9vbURlc2NyaXB0aW9uKHJpZCwgdmFsdWUsIHVzZXIpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0Y2FzZSAncm9vbVR5cGUnOlxuXHRcdFx0XHRcdGlmICh2YWx1ZSAhPT0gcm9vbS50KSB7XG5cdFx0XHRcdFx0XHRSb2NrZXRDaGF0LnNhdmVSb29tVHlwZShyaWQsIHZhbHVlLCB1c2VyKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdGNhc2UgJ3Rva2VucGFzcyc6XG5cdFx0XHRcdFx0Y2hlY2sodmFsdWUsIHtcblx0XHRcdFx0XHRcdHJlcXVpcmU6IFN0cmluZyxcblx0XHRcdFx0XHRcdHRva2VuczogW3tcblx0XHRcdFx0XHRcdFx0dG9rZW46IFN0cmluZyxcblx0XHRcdFx0XHRcdFx0YmFsYW5jZTogU3RyaW5nXG5cdFx0XHRcdFx0XHR9XVxuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdFJvY2tldENoYXQuc2F2ZVJvb21Ub2tlbnBhc3MocmlkLCB2YWx1ZSk7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdGNhc2UgJ3N0cmVhbWluZ09wdGlvbnMnOlxuXHRcdFx0XHRcdFJvY2tldENoYXQuc2F2ZVN0cmVhbWluZ09wdGlvbnMocmlkLCB2YWx1ZSk7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdGNhc2UgJ3JlYWRPbmx5Jzpcblx0XHRcdFx0XHRpZiAodmFsdWUgIT09IHJvb20ucm8pIHtcblx0XHRcdFx0XHRcdFJvY2tldENoYXQuc2F2ZVJvb21SZWFkT25seShyaWQsIHZhbHVlLCB1c2VyKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdGNhc2UgJ3JlYWN0V2hlblJlYWRPbmx5Jzpcblx0XHRcdFx0XHRpZiAodmFsdWUgIT09IHJvb20ucmVhY3RXaGVuUmVhZE9ubHkpIHtcblx0XHRcdFx0XHRcdFJvY2tldENoYXQuc2F2ZVJlYWN0V2hlblJlYWRPbmx5KHJpZCwgdmFsdWUsIHVzZXIpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0Y2FzZSAnc3lzdGVtTWVzc2FnZXMnOlxuXHRcdFx0XHRcdGlmICh2YWx1ZSAhPT0gcm9vbS5zeXNNZXMpIHtcblx0XHRcdFx0XHRcdFJvY2tldENoYXQuc2F2ZVJvb21TeXN0ZW1NZXNzYWdlcyhyaWQsIHZhbHVlLCB1c2VyKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdGNhc2UgJ2pvaW5Db2RlJzpcblx0XHRcdFx0XHRSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5zZXRKb2luQ29kZUJ5SWQocmlkLCBTdHJpbmcodmFsdWUpKTtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0Y2FzZSAnZGVmYXVsdCc6XG5cdFx0XHRcdFx0Um9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuc2F2ZURlZmF1bHRCeUlkKHJpZCwgdmFsdWUpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIHtcblx0XHRcdHJlc3VsdDogdHJ1ZSxcblx0XHRcdHJpZDogcm9vbS5faWRcblx0XHR9O1xuXHR9XG59KTtcbiIsIlJvY2tldENoYXQubW9kZWxzLk1lc3NhZ2VzLmNyZWF0ZVJvb21TZXR0aW5nc0NoYW5nZWRXaXRoVHlwZVJvb21JZE1lc3NhZ2VBbmRVc2VyID0gZnVuY3Rpb24odHlwZSwgcm9vbUlkLCBtZXNzYWdlLCB1c2VyLCBleHRyYURhdGEpIHtcblx0cmV0dXJuIHRoaXMuY3JlYXRlV2l0aFR5cGVSb29tSWRNZXNzYWdlQW5kVXNlcih0eXBlLCByb29tSWQsIG1lc3NhZ2UsIHVzZXIsIGV4dHJhRGF0YSk7XG59O1xuXG5Sb2NrZXRDaGF0Lm1vZGVscy5NZXNzYWdlcy5jcmVhdGVSb29tUmVuYW1lZFdpdGhSb29tSWRSb29tTmFtZUFuZFVzZXIgPSBmdW5jdGlvbihyb29tSWQsIHJvb21OYW1lLCB1c2VyLCBleHRyYURhdGEpIHtcblx0cmV0dXJuIHRoaXMuY3JlYXRlV2l0aFR5cGVSb29tSWRNZXNzYWdlQW5kVXNlcigncicsIHJvb21JZCwgcm9vbU5hbWUsIHVzZXIsIGV4dHJhRGF0YSk7XG59O1xuIiwiUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuc2V0RGVzY3JpcHRpb25CeUlkID0gZnVuY3Rpb24oX2lkLCBkZXNjcmlwdGlvbikge1xuXHRjb25zdCBxdWVyeSA9IHtcblx0XHRfaWRcblx0fTtcblx0Y29uc3QgdXBkYXRlID0ge1xuXHRcdCRzZXQ6IHtcblx0XHRcdGRlc2NyaXB0aW9uXG5cdFx0fVxuXHR9O1xuXHRyZXR1cm4gdGhpcy51cGRhdGUocXVlcnksIHVwZGF0ZSk7XG59O1xuXG5Sb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5zZXRSZWFkT25seUJ5SWQgPSBmdW5jdGlvbihfaWQsIHJlYWRPbmx5KSB7XG5cdGNvbnN0IHF1ZXJ5ID0ge1xuXHRcdF9pZFxuXHR9O1xuXHRjb25zdCB1cGRhdGUgPSB7XG5cdFx0JHNldDoge1xuXHRcdFx0cm86IHJlYWRPbmx5XG5cdFx0fVxuXHR9O1xuXHRpZiAocmVhZE9ubHkpIHtcblx0XHRSb2NrZXRDaGF0Lm1vZGVscy5TdWJzY3JpcHRpb25zLmZpbmRCeVJvb21JZChfaWQpLmZvckVhY2goZnVuY3Rpb24oc3Vic2NyaXB0aW9uKSB7XG5cdFx0XHRpZiAoc3Vic2NyaXB0aW9uLl91c2VyID09IG51bGwpIHtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXHRcdFx0Y29uc3QgdXNlciA9IHN1YnNjcmlwdGlvbi5fdXNlcjtcblx0XHRcdGlmIChSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odXNlci5faWQsICdwb3N0LXJlYWRvbmx5JykgPT09IGZhbHNlKSB7XG5cdFx0XHRcdGlmICghdXBkYXRlLiRzZXQubXV0ZWQpIHtcblx0XHRcdFx0XHR1cGRhdGUuJHNldC5tdXRlZCA9IFtdO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHJldHVybiB1cGRhdGUuJHNldC5tdXRlZC5wdXNoKHVzZXIudXNlcm5hbWUpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHR9IGVsc2Uge1xuXHRcdHVwZGF0ZS4kdW5zZXQgPSB7XG5cdFx0XHRtdXRlZDogJydcblx0XHR9O1xuXHR9XG5cdHJldHVybiB0aGlzLnVwZGF0ZShxdWVyeSwgdXBkYXRlKTtcbn07XG5cblJvY2tldENoYXQubW9kZWxzLlJvb21zLnNldEFsbG93UmVhY3RpbmdXaGVuUmVhZE9ubHlCeUlkID0gZnVuY3Rpb24oX2lkLCBhbGxvd1JlYWN0aW5nKSB7XG5cdGNvbnN0IHF1ZXJ5ID0ge1xuXHRcdF9pZFxuXHR9O1xuXHRjb25zdCB1cGRhdGUgPSB7XG5cdFx0JHNldDoge1xuXHRcdFx0cmVhY3RXaGVuUmVhZE9ubHk6IGFsbG93UmVhY3Rpbmdcblx0XHR9XG5cdH07XG5cdHJldHVybiB0aGlzLnVwZGF0ZShxdWVyeSwgdXBkYXRlKTtcbn07XG5cblJvY2tldENoYXQubW9kZWxzLlJvb21zLnNldFN5c3RlbU1lc3NhZ2VzQnlJZCA9IGZ1bmN0aW9uKF9pZCwgc3lzdGVtTWVzc2FnZXMpIHtcblx0Y29uc3QgcXVlcnkgPSB7XG5cdFx0X2lkXG5cdH07XG5cdGNvbnN0IHVwZGF0ZSA9IHtcblx0XHQkc2V0OiB7XG5cdFx0XHRzeXNNZXM6IHN5c3RlbU1lc3NhZ2VzXG5cdFx0fVxuXHR9O1xuXHRyZXR1cm4gdGhpcy51cGRhdGUocXVlcnksIHVwZGF0ZSk7XG59O1xuIiwiTWV0ZW9yLnN0YXJ0dXAoZnVuY3Rpb24oKSB7XG5cdFJvY2tldENoYXQubW9kZWxzLlBlcm1pc3Npb25zLnVwc2VydCgncG9zdC1yZWFkb25seScsIHskc2V0T25JbnNlcnQ6IHsgcm9sZXM6IFsnYWRtaW4nLCAnb3duZXInLCAnbW9kZXJhdG9yJ10gfSB9KTtcblx0Um9ja2V0Q2hhdC5tb2RlbHMuUGVybWlzc2lvbnMudXBzZXJ0KCdzZXQtcmVhZG9ubHknLCB7JHNldE9uSW5zZXJ0OiB7IHJvbGVzOiBbJ2FkbWluJywgJ293bmVyJ10gfSB9KTtcblx0Um9ja2V0Q2hhdC5tb2RlbHMuUGVybWlzc2lvbnMudXBzZXJ0KCdzZXQtcmVhY3Qtd2hlbi1yZWFkb25seScsIHskc2V0T25JbnNlcnQ6IHsgcm9sZXM6IFsnYWRtaW4nLCAnb3duZXInXSB9fSk7XG59KTtcbiJdfQ==
