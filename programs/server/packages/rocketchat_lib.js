(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var RateLimiter = Package['rate-limit'].RateLimiter;
var WebApp = Package.webapp.WebApp;
var WebAppInternals = Package.webapp.WebAppInternals;
var main = Package.webapp.main;
var ReactiveVar = Package['reactive-var'].ReactiveVar;
var ReactiveDict = Package['reactive-dict'].ReactiveDict;
var Accounts = Package['accounts-base'].Accounts;
var ECMAScript = Package.ecmascript.ECMAScript;
var Random = Package.random.Random;
var check = Package.check.check;
var Match = Package.check.Match;
var Tracker = Package.tracker.Tracker;
var Deps = Package.tracker.Deps;
var DDPRateLimiter = Package['ddp-rate-limiter'].DDPRateLimiter;
var MongoInternals = Package.mongo.MongoInternals;
var Mongo = Package.mongo.Mongo;
var OAuth = Package.oauth.OAuth;
var Oauth = Package.oauth.Oauth;
var CollectionHooks = Package['matb33:collection-hooks'].CollectionHooks;
var ServiceConfiguration = Package['service-configuration'].ServiceConfiguration;
var meteorInstall = Package.modules.meteorInstall;
var Streamer = Package['rocketchat:streamer'].Streamer;
var Logger = Package['rocketchat:logger'].Logger;
var SystemLogger = Package['rocketchat:logger'].SystemLogger;
var LoggerManager = Package['rocketchat:logger'].LoggerManager;
var CustomOAuth = Package['rocketchat:custom-oauth'].CustomOAuth;
var FlowRouter = Package['kadira:flow-router'].FlowRouter;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;

/* Package-scope variables */
var RocketChat, name, language, message, options, hidden, pinned, pinnedAt, snippeted, snippetedAt, importIds, inc, _id, roles, favorite, file, username, exceptions, active, latest, fields, result, query;

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:lib":{"lib":{"core.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/lib/core.js                                                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let EventEmitter;
module.watch(require("wolfy87-eventemitter"), {
  default(v) {
    EventEmitter = v;
  }

}, 0);
RocketChat = new EventEmitter();
/*
* Kick off the global namespace for RocketChat.
* @namespace RocketChat
*/

RocketChat.models = {};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"RoomTypeConfig.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/lib/RoomTypeConfig.js                                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  RoomSettingsEnum: () => RoomSettingsEnum,
  UiTextContext: () => UiTextContext,
  RoomTypeRouteConfig: () => RoomTypeRouteConfig,
  RoomTypeConfig: () => RoomTypeConfig
});
const RoomSettingsEnum = {
  NAME: 'roomName',
  TOPIC: 'roomTopic',
  ANNOUNCEMENT: 'roomAnnouncement',
  DESCRIPTION: 'roomDescription',
  READ_ONLY: 'readOnly',
  REACT_WHEN_READ_ONLY: 'reactWhenReadOnly',
  ARCHIVE_OR_UNARCHIVE: 'archiveOrUnarchive',
  JOIN_CODE: 'joinCode',
  BROADCAST: 'broadcast'
};
const UiTextContext = {
  CLOSE_WARNING: 'closeWarning',
  HIDE_WARNING: 'hideWarning',
  LEAVE_WARNING: 'leaveWarning',
  NO_ROOMS_SUBSCRIBED: 'noRoomsSubscribed'
};

class RoomTypeRouteConfig {
  constructor({
    name,
    path
  }) {
    if (typeof name !== 'undefined' && (typeof name !== 'string' || name.length === 0)) {
      throw new Error('The name must be a string.');
    }

    if (typeof path !== 'undefined' && (typeof path !== 'string' || path.length === 0)) {
      throw new Error('The path must be a string.');
    }

    this._name = name;
    this._path = path;
  }

  get name() {
    return this._name;
  }

  get path() {
    return this._path;
  }

}

class RoomTypeConfig {
  constructor({
    identifier = Random.id(),
    order,
    icon,
    header,
    label,
    route
  }) {
    if (typeof identifier !== 'string' || identifier.length === 0) {
      throw new Error('The identifier must be a string.');
    }

    if (typeof order !== 'number') {
      throw new Error('The order must be a number.');
    }

    if (typeof icon !== 'undefined' && (typeof icon !== 'string' || icon.length === 0)) {
      throw new Error('The icon must be a string.');
    }

    if (typeof header !== 'undefined' && (typeof header !== 'string' || header.length === 0)) {
      throw new Error('The header must be a string.');
    }

    if (typeof label !== 'undefined' && (typeof label !== 'string' || label.length === 0)) {
      throw new Error('The label must be a string.');
    }

    if (typeof route !== 'undefined' && !(route instanceof RoomTypeRouteConfig)) {
      throw new Error('Room\'s route is not a valid route configuration. Must be an instance of "RoomTypeRouteConfig".');
    }

    this._identifier = identifier;
    this._order = order;
    this._icon = icon;
    this._header = header;
    this._label = label;
    this._route = route;
  }
  /**
   * The room type's internal identifier.
   */


  get identifier() {
    return this._identifier;
  }
  /**
   * The order of this room type for the display.
   */


  get order() {
    return this._order;
  }
  /**
   * Sets the order of this room type for the display.
   *
   * @param {number} order the number value for the order
   */


  set order(order) {
    if (typeof order !== 'number') {
      throw new Error('The order must be a number.');
    }

    this._order = order;
  }
  /**
   * The icon class, css, to use as the visual aid.
   */


  get icon() {
    return this._icon;
  }
  /**
   * The header name of this type.
   */


  get header() {
    return this._header;
  }
  /**
   * The i18n label for this room type.
   */


  get label() {
    return this._label;
  }
  /**
   * The route config for this room type.
   */


  get route() {
    return this._route;
  }
  /**
   * Gets the room's name to display in the UI.
   *
   * @param {object} room
   */


  getDisplayName(room) {
    return room.name;
  }

  allowRoomSettingChange()
  /* room, setting */
  {
    return true;
  }

  canBeCreated() {
    return Meteor.isServer ? RocketChat.authz.hasAtLeastOnePermission(Meteor.userId(), [`create-${this._identifier}`]) : RocketChat.authz.hasAtLeastOnePermission([`create-${this._identifier}`]);
  }

  canBeDeleted(room) {
    return Meteor.isServer ? RocketChat.authz.hasAtLeastOnePermission(Meteor.userId(), [`delete-${room.t}`], room._id) : RocketChat.authz.hasAtLeastOnePermission([`delete-${room.t}`], room._id);
  }

  supportMembersList()
  /* room */
  {
    return true;
  }

  isGroupChat() {
    return false;
  }

  canAddUser()
  /* userId, room */
  {
    return false;
  }

  userDetailShowAll()
  /* room */
  {
    return true;
  }

  userDetailShowAdmin()
  /* room */
  {
    return true;
  }

  preventRenaming()
  /* room */
  {
    return false;
  }

  includeInRoomSearch() {
    return false;
  }

  enableMembersListProfile() {
    return false;
  }
  /**
   * Returns a text which can be used in generic UIs.
   * @param context The role of the text in the UI-Element
   * @return {string} A text or a translation key - the consumers of this method will pass the
   * returned value to an internationalization library
   */


  getUiText()
  /* context */
  {
    return '';
  }

}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"roomTypes":{"conversation.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/lib/roomTypes/conversation.js                                                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  ConversationRoomType: () => ConversationRoomType
});
let RoomTypeConfig;
module.watch(require("../RoomTypeConfig"), {
  RoomTypeConfig(v) {
    RoomTypeConfig = v;
  }

}, 0);

class ConversationRoomType extends RoomTypeConfig {
  constructor() {
    super({
      identifier: 'merged',
      order: 30,
      label: 'Conversations'
    });
  }

  condition() {
    const user = Meteor.user();
    return RocketChat.getUserPreference(user, 'mergeChannels');
  }

}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"direct.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/lib/roomTypes/direct.js                                                                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  DirectMessageRoomRoute: () => DirectMessageRoomRoute,
  DirectMessageRoomType: () => DirectMessageRoomType
});
let RoomTypeConfig, RoomTypeRouteConfig, RoomSettingsEnum, UiTextContext;
module.watch(require("../RoomTypeConfig"), {
  RoomTypeConfig(v) {
    RoomTypeConfig = v;
  },

  RoomTypeRouteConfig(v) {
    RoomTypeRouteConfig = v;
  },

  RoomSettingsEnum(v) {
    RoomSettingsEnum = v;
  },

  UiTextContext(v) {
    UiTextContext = v;
  }

}, 0);

class DirectMessageRoomRoute extends RoomTypeRouteConfig {
  constructor() {
    super({
      name: 'direct',
      path: '/direct/:username'
    });
  }

  action(params) {
    return openRoom('d', params.username);
  }

  link(sub) {
    return {
      username: sub.name
    };
  }

}

class DirectMessageRoomType extends RoomTypeConfig {
  constructor() {
    super({
      identifier: 'd',
      order: 50,
      label: 'Direct_Messages',
      route: new DirectMessageRoomRoute()
    });
  }

  findRoom(identifier) {
    const query = {
      t: 'd',
      name: identifier
    };
    const subscription = ChatSubscription.findOne(query);

    if (subscription && subscription.rid) {
      return ChatRoom.findOne(subscription.rid);
    }
  }

  roomName(roomData) {
    const subscription = ChatSubscription.findOne({
      rid: roomData._id
    }, {
      fields: {
        name: 1,
        fname: 1
      }
    });

    if (!subscription) {
      return '';
    }

    if (RocketChat.settings.get('UI_Use_Real_Name') && subscription.fname) {
      return subscription.fname;
    }

    return subscription.name;
  }

  secondaryRoomName(roomData) {
    if (RocketChat.settings.get('UI_Use_Real_Name')) {
      const subscription = ChatSubscription.findOne({
        rid: roomData._id
      }, {
        fields: {
          name: 1
        }
      });
      return subscription && subscription.name;
    }
  }

  condition() {
    const user = Meteor.user();
    const mergeChannels = RocketChat.getUserPreference(user, 'mergeChannels');
    return !mergeChannels && RocketChat.authz.hasAtLeastOnePermission(['view-d-room', 'view-joined-room']);
  }

  getUserStatus(roomId) {
    const subscription = RocketChat.models.Subscriptions.findOne({
      rid: roomId
    });

    if (subscription == null) {
      return;
    }

    return Session.get(`user_${subscription.name}_status`);
  }

  getDisplayName(room) {
    return room.usernames.join(' x ');
  }

  allowRoomSettingChange(room, setting) {
    switch (setting) {
      case RoomSettingsEnum.NAME:
      case RoomSettingsEnum.DESCRIPTION:
      case RoomSettingsEnum.READ_ONLY:
      case RoomSettingsEnum.REACT_WHEN_READ_ONLY:
      case RoomSettingsEnum.ARCHIVE_OR_UNARCHIVE:
      case RoomSettingsEnum.JOIN_CODE:
        return false;

      default:
        return true;
    }
  }

  enableMembersListProfile() {
    return true;
  }

  userDetailShowAll()
  /* room */
  {
    return false;
  }

  getUiText(context) {
    switch (context) {
      case UiTextContext.HIDE_WARNING:
        return 'Hide_Private_Warning';

      case UiTextContext.LEAVE_WARNING:
        return 'Leave_Private_Warning';

      default:
        return '';
    }
  }

}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"favorite.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/lib/roomTypes/favorite.js                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  FavoriteRoomType: () => FavoriteRoomType
});
let RoomTypeConfig;
module.watch(require("../RoomTypeConfig"), {
  RoomTypeConfig(v) {
    RoomTypeConfig = v;
  }

}, 0);

class FavoriteRoomType extends RoomTypeConfig {
  constructor() {
    super({
      identifier: 'f',
      order: 20,
      header: 'favorite',
      icon: 'star',
      label: 'Favorites'
    });
  }

  condition() {
    const user = Meteor.user();
    return RocketChat.settings.get('Favorite_Rooms') && RocketChat.getUserPreference(user, 'sidebarShowFavorites');
  }

}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/lib/roomTypes/index.js                                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  ConversationRoomType: () => ConversationRoomType,
  DirectMessageRoomType: () => DirectMessageRoomType,
  FavoriteRoomType: () => FavoriteRoomType,
  PrivateRoomType: () => PrivateRoomType,
  PublicRoomType: () => PublicRoomType,
  UnreadRoomType: () => UnreadRoomType
});
let ConversationRoomType;
module.watch(require("./conversation"), {
  ConversationRoomType(v) {
    ConversationRoomType = v;
  }

}, 0);
let DirectMessageRoomType;
module.watch(require("./direct"), {
  DirectMessageRoomType(v) {
    DirectMessageRoomType = v;
  }

}, 1);
let FavoriteRoomType;
module.watch(require("./favorite"), {
  FavoriteRoomType(v) {
    FavoriteRoomType = v;
  }

}, 2);
let PrivateRoomType;
module.watch(require("./private"), {
  PrivateRoomType(v) {
    PrivateRoomType = v;
  }

}, 3);
let PublicRoomType;
module.watch(require("./public"), {
  PublicRoomType(v) {
    PublicRoomType = v;
  }

}, 4);
let UnreadRoomType;
module.watch(require("./unread"), {
  UnreadRoomType(v) {
    UnreadRoomType = v;
  }

}, 5);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"private.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/lib/roomTypes/private.js                                                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  PrivateRoomRoute: () => PrivateRoomRoute,
  PrivateRoomType: () => PrivateRoomType
});
let RoomSettingsEnum, RoomTypeConfig, RoomTypeRouteConfig, UiTextContext;
module.watch(require("../RoomTypeConfig"), {
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

class PrivateRoomRoute extends RoomTypeRouteConfig {
  constructor() {
    super({
      name: 'group',
      path: '/group/:name'
    });
  }

  action(params) {
    return openRoom('p', params.name);
  }

}

class PrivateRoomType extends RoomTypeConfig {
  constructor() {
    super({
      identifier: 'p',
      order: 40,
      icon: 'lock',
      label: 'Private_Groups',
      route: new PrivateRoomRoute()
    });
  }

  findRoom(identifier) {
    const query = {
      t: 'p',
      name: identifier
    };
    return ChatRoom.findOne(query);
  }

  roomName(roomData) {
    if (RocketChat.settings.get('UI_Allow_room_names_with_special_chars')) {
      return roomData.fname || roomData.name;
    }

    return roomData.name;
  }

  condition() {
    const user = Meteor.user();
    const mergeChannels = RocketChat.getUserPreference(user, 'mergeChannels');
    return !mergeChannels && RocketChat.authz.hasAllPermission('view-p-room');
  }

  isGroupChat() {
    return true;
  }

  canAddUser(room) {
    return RocketChat.authz.hasAtLeastOnePermission(['add-user-to-any-p-room', 'add-user-to-joined-room'], room._id);
  }

  allowRoomSettingChange(room, setting) {
    switch (setting) {
      case RoomSettingsEnum.JOIN_CODE:
        return false;

      case RoomSettingsEnum.BROADCAST:
        return room.broadcast;

      case RoomSettingsEnum.READ_ONLY:
        return !room.broadcast;

      case RoomSettingsEnum.REACT_WHEN_READ_ONLY:
        return !room.broadcast && room.ro;

      default:
        return true;
    }
  }

  enableMembersListProfile() {
    return true;
  }

  getUiText(context) {
    switch (context) {
      case UiTextContext.HIDE_WARNING:
        return 'Hide_Group_Warning';

      case UiTextContext.LEAVE_WARNING:
        return 'Leave_Group_Warning';

      default:
        return '';
    }
  }

}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"public.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/lib/roomTypes/public.js                                                                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  PublicRoomRoute: () => PublicRoomRoute,
  PublicRoomType: () => PublicRoomType
});
let RoomTypeConfig, RoomTypeRouteConfig, RoomSettingsEnum, UiTextContext;
module.watch(require("../RoomTypeConfig"), {
  RoomTypeConfig(v) {
    RoomTypeConfig = v;
  },

  RoomTypeRouteConfig(v) {
    RoomTypeRouteConfig = v;
  },

  RoomSettingsEnum(v) {
    RoomSettingsEnum = v;
  },

  UiTextContext(v) {
    UiTextContext = v;
  }

}, 0);

class PublicRoomRoute extends RoomTypeRouteConfig {
  constructor() {
    super({
      name: 'channel',
      path: '/channel/:name'
    });
  }

  action(params) {
    return openRoom('c', params.name);
  }

}

class PublicRoomType extends RoomTypeConfig {
  constructor() {
    super({
      identifier: 'c',
      order: 30,
      icon: 'hashtag',
      label: 'Channels',
      route: new PublicRoomRoute()
    });
  }

  findRoom(identifier) {
    const query = {
      t: 'c',
      name: identifier
    };
    return ChatRoom.findOne(query);
  }

  roomName(roomData) {
    if (RocketChat.settings.get('UI_Allow_room_names_with_special_chars')) {
      return roomData.fname || roomData.name;
    }

    return roomData.name;
  }

  condition() {
    const user = Meteor.user(); // const roomsListExhibitionMode = RocketChat.getUserPreference(user, 'roomsListExhibitionMode');

    const mergeChannels = RocketChat.getUserPreference(user, 'mergeChannels');
    return !mergeChannels && (RocketChat.authz.hasAtLeastOnePermission(['view-c-room', 'view-joined-room']) || RocketChat.settings.get('Accounts_AllowAnonymousRead') === true);
  }

  showJoinLink(roomId) {
    return !!ChatRoom.findOne({
      _id: roomId,
      t: 'c'
    });
  }

  includeInRoomSearch() {
    return true;
  }

  isGroupChat() {
    return true;
  }

  canAddUser(room) {
    return RocketChat.authz.hasAtLeastOnePermission(['add-user-to-any-c-room', 'add-user-to-joined-room'], room._id);
  }

  enableMembersListProfile() {
    return true;
  }

  allowRoomSettingChange(room, setting) {
    switch (setting) {
      case RoomSettingsEnum.BROADCAST:
        return room.broadcast;

      case RoomSettingsEnum.READ_ONLY:
        return !room.broadcast;

      case RoomSettingsEnum.REACT_WHEN_READ_ONLY:
        return !room.broadcast && room.ro;

      default:
        return true;
    }
  }

  getUiText(context) {
    switch (context) {
      case UiTextContext.HIDE_WARNING:
        return 'Hide_Room_Warning';

      case UiTextContext.LEAVE_WARNING:
        return 'Leave_Room_Warning';

      default:
        return '';
    }
  }

}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"unread.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/lib/roomTypes/unread.js                                                                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  UnreadRoomType: () => UnreadRoomType
});
let RoomTypeConfig;
module.watch(require("../RoomTypeConfig"), {
  RoomTypeConfig(v) {
    RoomTypeConfig = v;
  }

}, 0);

class UnreadRoomType extends RoomTypeConfig {
  constructor() {
    super({
      identifier: 'unread',
      order: 10,
      label: 'Unread'
    });
    this.unread = true;
  }

  condition() {
    const user = Meteor.user();
    return RocketChat.getUserPreference(user, 'sidebarShowUnread');
  }

}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"getURL.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/lib/getURL.js                                                                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let s;
module.watch(require("underscore.string"), {
  default(v) {
    s = v;
  }

}, 0);

RocketChat.getURL = (path, {
  cdn = true,
  full = false
} = {}) => {
  const cdnPrefix = s.rtrim(s.trim(RocketChat.settings.get('CDN_PREFIX') || ''), '/');
  const pathPrefix = s.rtrim(s.trim(__meteor_runtime_config__.ROOT_URL_PATH_PREFIX || ''), '/');
  let basePath;
  const finalPath = s.ltrim(s.trim(path), '/');

  if (cdn && cdnPrefix !== '') {
    basePath = cdnPrefix + pathPrefix;
  } else if (full || Meteor.isCordova) {
    return Meteor.absoluteUrl(finalPath);
  } else {
    basePath = pathPrefix;
  }

  return `${basePath}/${finalPath}`;
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"settings.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/lib/settings.js                                                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);

/*
* RocketChat.settings holds all packages settings
* @namespace RocketChat.settings
*/
RocketChat.settings = {
  callbacks: {},
  regexCallbacks: {},
  ts: new Date(),

  get(_id, callback) {
    if (callback != null) {
      RocketChat.settings.onload(_id, callback);

      if (!Meteor.settings) {
        return;
      }

      if (_id === '*') {
        return Object.keys(Meteor.settings).forEach(key => {
          const value = Meteor.settings[key];
          callback(key, value);
        });
      }

      if (_.isRegExp(_id) && Meteor.settings) {
        return Object.keys(Meteor.settings).forEach(key => {
          if (!_id.test(key)) {
            return;
          }

          const value = Meteor.settings[key];
          callback(key, value);
        });
      }

      return Meteor.settings[_id] != null && callback(_id, Meteor.settings[_id]);
    } else {
      if (!Meteor.settings) {
        return;
      }

      if (_.isRegExp(_id)) {
        return Object.keys(Meteor.settings).reduce((items, key) => {
          const value = Meteor.settings[key];

          if (_id.test(key)) {
            items.push({
              key,
              value
            });
          }

          return items;
        }, []);
      }

      return Meteor.settings && Meteor.settings[_id];
    }
  },

  set(_id, value, callback) {
    return Meteor.call('saveSetting', _id, value, callback);
  },

  batchSet(settings, callback) {
    // async -> sync
    // http://daemon.co.za/2012/04/simple-async-with-only-underscore/
    const save = function (setting) {
      return function (callback) {
        return Meteor.call('saveSetting', setting._id, setting.value, setting.editor, callback);
      };
    };

    const actions = _.map(settings, setting => save(setting));

    return _(actions).reduceRight(_.wrap, (err, success) => callback(err, success))();
  },

  load(key, value, initialLoad) {
    ['*', key].forEach(item => {
      if (RocketChat.settings.callbacks[item]) {
        RocketChat.settings.callbacks[item].forEach(callback => callback(key, value, initialLoad));
      }
    });
    Object.keys(RocketChat.settings.regexCallbacks).forEach(cbKey => {
      const cbValue = RocketChat.settings.regexCallbacks[cbKey];

      if (!cbValue.regex.test(key)) {
        return;
      }

      cbValue.callbacks.forEach(callback => callback(key, value, initialLoad));
    });
  },

  onload(key, callback) {
    // if key is '*'
    // 	for key, value in Meteor.settings
    // 		callback key, value, false
    // else if Meteor.settings?[_id]?
    // 	callback key, Meteor.settings[_id], false
    const keys = [].concat(key);
    keys.forEach(k => {
      if (_.isRegExp(k)) {
        RocketChat.settings.regexCallbacks[name = k.source] = RocketChat.settings.regexCallbacks[name = k.source] || {
          regex: k,
          callbacks: []
        };
        RocketChat.settings.regexCallbacks[k.source].callbacks.push(callback);
      } else {
        RocketChat.settings.callbacks[k] = RocketChat.settings.callbacks[k] || [];
        RocketChat.settings.callbacks[k].push(callback);
      }
    });
  }

};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"callbacks.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/lib/callbacks.js                                                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);

/*
* Callback hooks provide an easy way to add extra steps to common operations.
* @namespace RocketChat.callbacks
*/
RocketChat.callbacks = {};

if (Meteor.isServer) {
  RocketChat.callbacks.showTime = true;
  RocketChat.callbacks.showTotalTime = true;
} else {
  RocketChat.callbacks.showTime = false;
  RocketChat.callbacks.showTotalTime = false;
}
/*
* Callback priorities
*/


RocketChat.callbacks.priority = {
  HIGH: -1000,
  MEDIUM: 0,
  LOW: 1000
};
/*
* Add a callback function to a hook
* @param {String} hook - The name of the hook
* @param {Function} callback - The callback function
*/

RocketChat.callbacks.add = function (hook, callback, priority, id) {
  if (priority == null) {
    priority = RocketChat.callbacks.priority.MEDIUM;
  }

  if (!_.isNumber(priority)) {
    priority = RocketChat.callbacks.priority.MEDIUM;
  }

  callback.priority = priority;
  callback.id = id || Random.id();
  RocketChat.callbacks[hook] = RocketChat.callbacks[hook] || [];

  if (RocketChat.callbacks.showTime === true) {
    const err = new Error();
    callback.stack = err.stack;
  }

  if (RocketChat.callbacks[hook].find(cb => cb.id === callback.id)) {
    return;
  }

  RocketChat.callbacks[hook].push(callback);
};
/*
* Remove a callback from a hook
* @param {string} hook - The name of the hook
* @param {string} id - The callback's id
*/


RocketChat.callbacks.remove = function (hookName, id) {
  RocketChat.callbacks[hookName] = _.reject(RocketChat.callbacks[hookName], callback => callback.id === id);
};
/*
* Successively run all of a hook's callbacks on an item
* @param {String} hook - The name of the hook
* @param {Object} item - The post, comment, modifier, etc. on which to run the callbacks
* @param {Object} [constant] - An optional constant that will be passed along to each callback
* @returns {Object} Returns the item after it's been through all the callbacks for this hook
*/


RocketChat.callbacks.run = function (hook, item, constant) {
  const callbacks = RocketChat.callbacks[hook];

  if (callbacks && callbacks.length) {
    let totalTime = 0;

    const result = _.sortBy(callbacks, function (callback) {
      return callback.priority || RocketChat.callbacks.priority.MEDIUM;
    }).reduce(function (result, callback) {
      let time = 0;

      if (RocketChat.callbacks.showTime === true || RocketChat.callbacks.showTotalTime === true) {
        time = Date.now();
      }

      const callbackResult = callback(result, constant);

      if (RocketChat.callbacks.showTime === true || RocketChat.callbacks.showTotalTime === true) {
        const currentTime = Date.now() - time;
        totalTime += currentTime;

        if (RocketChat.callbacks.showTime === true) {
          if (Meteor.isServer) {
            RocketChat.statsTracker.timing('callbacks.time', currentTime, [`hook:${hook}`, `callback:${callback.id}`]);
          } else {
            let stack = callback.stack && typeof callback.stack.split === 'function' && callback.stack.split('\n');
            stack = stack && stack[2] && (stack[2].match(/\(.+\)/) || [])[0];
            console.log(String(currentTime), hook, callback.id, stack);
          }
        }
      }

      return typeof callbackResult === 'undefined' ? result : callbackResult;
    }, item);

    if (RocketChat.callbacks.showTotalTime === true) {
      if (Meteor.isServer) {
        RocketChat.statsTracker.timing('callbacks.totalTime', totalTime, [`hook:${hook}`]);
      } else {
        console.log(`${hook}:`, totalTime);
      }
    }

    return result;
  } else {
    return item;
  }
};
/*
* Successively run all of a hook's callbacks on an item, in async mode (only works on server)
* @param {String} hook - The name of the hook
* @param {Object} item - The post, comment, modifier, etc. on which to run the callbacks
* @param {Object} [constant] - An optional constant that will be passed along to each callback
*/


RocketChat.callbacks.runAsync = function (hook, item, constant) {
  const callbacks = RocketChat.callbacks[hook];

  if (Meteor.isServer && callbacks && callbacks.length) {
    Meteor.defer(function () {
      _.sortBy(callbacks, callback => callback.priority || RocketChat.callbacks.priority.MEDIUM).forEach(callback => callback(item, constant));
    });
  } else {
    return item;
  }
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"fileUploadRestrictions.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/lib/fileUploadRestrictions.js                                                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);

RocketChat.fileUploadMediaWhiteList = function () {
  const mediaTypeWhiteList = RocketChat.settings.get('FileUpload_MediaTypeWhiteList');

  if (!mediaTypeWhiteList || mediaTypeWhiteList === '*') {
    return;
  }

  return _.map(mediaTypeWhiteList.split(','), function (item) {
    return item.trim();
  });
};

RocketChat.fileUploadIsValidContentType = function (type) {
  const list = RocketChat.fileUploadMediaWhiteList();

  if (!list) {
    return true;
  }

  if (!type) {
    return false;
  }

  if (_.contains(list, type)) {
    return true;
  } else {
    const wildCardGlob = '/*';

    const wildcards = _.filter(list, function (item) {
      return item.indexOf(wildCardGlob) > 0;
    });

    if (_.contains(wildcards, type.replace(/(\/.*)$/, wildCardGlob))) {
      return true;
    }
  }

  return false;
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"getAvatarColor.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/lib/getAvatarColor.js                                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
const colors = ['#F44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5', '#2196F3', '#03A9F4', '#00BCD4', '#009688', '#4CAF50', '#8BC34A', '#CDDC39', '#FFC107', '#FF9800', '#FF5722', '#795548', '#9E9E9E', '#607D8B'];

RocketChat.getAvatarColor = function (name) {
  return colors[name.length % colors.length];
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"getValidRoomName.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/lib/getValidRoomName.js                                                                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let s;
module.watch(require("underscore.string"), {
  default(v) {
    s = v;
  }

}, 0);

RocketChat.getValidRoomName = function getValidRoomName(displayName, rid = '') {
  let slugifiedName = displayName;

  if (RocketChat.settings.get('UI_Allow_room_names_with_special_chars')) {
    const room = RocketChat.models.Rooms.findOneByDisplayName(displayName);

    if (room && room._id !== rid) {
      if (room.archived) {
        throw new Meteor.Error('error-archived-duplicate-name', `There's an archived channel with name ${displayName}`, {
          function: 'RocketChat.getValidRoomName',
          channel_name: displayName
        });
      } else {
        throw new Meteor.Error('error-duplicate-channel-name', `A channel with name '${displayName}' exists`, {
          function: 'RocketChat.getValidRoomName',
          channel_name: displayName
        });
      }
    }

    slugifiedName = s.slugify(displayName);
  }

  let nameValidation;

  try {
    nameValidation = new RegExp(`^${RocketChat.settings.get('UTF8_Names_Validation')}$`);
  } catch (error) {
    nameValidation = new RegExp('^[0-9a-zA-Z-_.]+$');
  }

  if (!nameValidation.test(slugifiedName)) {
    throw new Meteor.Error('error-invalid-room-name', `${slugifiedName} is not a valid room name.`, {
      'function': 'RocketChat.getValidRoomName',
      channel_name: slugifiedName
    });
  }

  const room = RocketChat.models.Rooms.findOneByName(slugifiedName);

  if (room && room._id !== rid) {
    if (RocketChat.settings.get('UI_Allow_room_names_with_special_chars')) {
      let tmpName = slugifiedName;
      let next = 0;

      while (RocketChat.models.Rooms.findOneByNameAndNotId(tmpName, rid)) {
        tmpName = `${slugifiedName}-${++next}`;
      }

      slugifiedName = tmpName;
    } else if (room.archived) {
      throw new Meteor.Error('error-archived-duplicate-name', `There's an archived channel with name ${slugifiedName}`, {
        function: 'RocketChat.getValidRoomName',
        channel_name: slugifiedName
      });
    } else {
      throw new Meteor.Error('error-duplicate-channel-name', `A channel with name '${slugifiedName}' exists`, {
        function: 'RocketChat.getValidRoomName',
        channel_name: slugifiedName
      });
    }
  }

  return slugifiedName;
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"placeholders.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/lib/placeholders.js                                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let s;
module.watch(require("underscore.string"), {
  default(v) {
    s = v;
  }

}, 0);
RocketChat.placeholders = {};

RocketChat.placeholders.replace = function (str, data) {
  if (!str) {
    return '';
  }

  str = str.replace(/\[Site_Name\]/g, RocketChat.settings.get('Site_Name') || '');
  str = str.replace(/\[Site_URL\]/g, RocketChat.settings.get('Site_Url') || '');

  if (data) {
    str = str.replace(/\[name\]/g, data.name || '');
    str = str.replace(/\[fname\]/g, s.strLeft(data.name, ' ') || '');
    str = str.replace(/\[lname\]/g, s.strRightBack(data.name, ' ') || '');
    str = str.replace(/\[email\]/g, data.email || '');
    str = str.replace(/\[password\]/g, data.password || '');
    str = str.replace(/\[reason\]/g, data.reason || '');
    str = str.replace(/\[User\]/g, data.user || '');
    str = str.replace(/\[Room\]/g, data.room || '');

    if (data.unsubscribe) {
      str = str.replace(/\[unsubscribe\]/g, data.unsubscribe);
    }
  }

  str = str.replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1' + '<br>' + '$2');
  return str;
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"promises.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/lib/promises.js                                                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);

/*
* Callback hooks provide an easy way to add extra steps to common operations.
* @namespace RocketChat.promises
*/
RocketChat.promises = {};
/*
* Callback priorities
*/

RocketChat.promises.priority = {
  HIGH: -1000,
  MEDIUM: 0,
  LOW: 1000
};
/*
* Add a callback function to a hook
* @param {String} hook - The name of the hook
* @param {Function} callback - The callback function
*/

RocketChat.promises.add = function (hook, callback, p = RocketChat.promises.priority.MEDIUM, id) {
  const priority = !_.isNumber(p) ? RocketChat.promises.priority.MEDIUM : p;
  callback.priority = priority;
  callback.id = id || Random.id();
  RocketChat.promises[hook] = RocketChat.promises[hook] || [];

  if (RocketChat.promises[hook].find(cb => cb.id === callback.id)) {
    return;
  }

  RocketChat.promises[hook].push(callback);
};
/*
* Remove a callback from a hook
* @param {string} hook - The name of the hook
* @param {string} id - The callback's id
*/


RocketChat.promises.remove = function (hookName, id) {
  RocketChat.promises[hookName] = _.reject(RocketChat.promises[hookName], callback => callback.id === id);
};
/*
* Successively run all of a hook's callbacks on an item
* @param {String} hook - The name of the hook
* @param {Object} item - The post, comment, modifier, etc. on which to run the callbacks
* @param {Object} [constant] - An optional constant that will be passed along to each callback
* @returns {Object} Returns the item after it's been through all the callbacks for this hook
*/


RocketChat.promises.run = function (hook, item, constant) {
  let callbacks = RocketChat.promises[hook];

  if (callbacks == null || callbacks.length === 0) {
    return Promise.resolve(item);
  }

  callbacks = _.sortBy(callbacks, callback => callback.priority || RocketChat.promises.priority.MEDIUM);
  return callbacks.reduce(function (previousPromise, callback) {
    return new Promise(function (resolve, reject) {
      return previousPromise.then(result => callback(result, constant).then(resolve, reject));
    });
  }, Promise.resolve(item));
};
/*
* Successively run all of a hook's callbacks on an item, in async mode (only works on server)
* @param {String} hook - The name of the hook
* @param {Object} item - The post, comment, modifier, etc. on which to run the callbacks
* @param {Object} [constant] - An optional constant that will be passed along to each callback
*/


RocketChat.promises.runAsync = function (hook, item, constant) {
  const callbacks = RocketChat.promises[hook];

  if (!Meteor.isServer || callbacks == null || callbacks.length === 0) {
    return item;
  }

  Meteor.defer(() => {
    _.sortBy(callbacks, callback => callback.priority || RocketChat.promises.priority.MEDIUM).forEach(function (callback) {
      callback(item, constant);
    });
  });
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"RoomTypesCommon.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/lib/RoomTypesCommon.js                                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  RoomTypesCommon: () => RoomTypesCommon
});
let RoomTypeConfig;
module.watch(require("./RoomTypeConfig"), {
  RoomTypeConfig(v) {
    RoomTypeConfig = v;
  }

}, 0);

class RoomTypesCommon {
  constructor() {
    this.roomTypes = {};
    this.roomTypesOrder = [];
    this.mainOrder = 1;
  }
  /**
   * Adds a room type to the application.
   *
   * @param {RoomTypeConfig} roomConfig
   * @returns {void}
   */


  add(roomConfig) {
    if (!(roomConfig instanceof RoomTypeConfig)) {
      throw new Error('Invalid Room Configuration object, it must extend "RoomTypeConfig"');
    }

    if (this.roomTypes[roomConfig.identifier]) {
      return false;
    }

    if (!roomConfig.order) {
      roomConfig.order = this.mainOrder + 10;
      this.mainOrder += 10;
    }

    this.roomTypesOrder.push({
      identifier: roomConfig.identifier,
      order: roomConfig.order
    });
    this.roomTypes[roomConfig.identifier] = roomConfig;

    if (roomConfig.route && roomConfig.route.path && roomConfig.route.name && roomConfig.route.action) {
      const routeConfig = {
        name: roomConfig.route.name,
        action: roomConfig.route.action
      };

      if (Meteor.isClient) {
        routeConfig.triggersExit = [roomExit];
      }

      return FlowRouter.route(roomConfig.route.path, routeConfig);
    }
  }

  hasCustomLink(roomType) {
    return this.roomTypes[roomType] && this.roomTypes[roomType].route && this.roomTypes[roomType].route.link != null;
  }
  /**
   * @param {string} roomType room type (e.g.: c (for channels), d (for direct channels))
   * @param {object} subData the user's subscription data
   */


  getRouteLink(roomType, subData) {
    if (!this.roomTypes[roomType]) {
      return false;
    }

    let routeData = {};

    if (this.roomTypes[roomType] && this.roomTypes[roomType].route && this.roomTypes[roomType].route.link) {
      routeData = this.roomTypes[roomType].route.link(subData);
    } else if (subData && subData.name) {
      routeData = {
        name: subData.name
      };
    }

    return FlowRouter.path(this.roomTypes[roomType].route.name, routeData);
  }

  openRouteLink(roomType, subData, queryParams) {
    if (!this.roomTypes[roomType]) {
      return false;
    }

    let routeData = {};

    if (this.roomTypes[roomType] && this.roomTypes[roomType].route && this.roomTypes[roomType].route.link) {
      routeData = this.roomTypes[roomType].route.link(subData);
    } else if (subData && subData.name) {
      routeData = {
        name: subData.name
      };
    }

    return FlowRouter.go(this.roomTypes[roomType].route.name, routeData, queryParams);
  }

}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"slashCommand.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/lib/slashCommand.js                                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.slashCommands = {
  commands: {}
};

RocketChat.slashCommands.add = function (command, callback, options = {}, result) {
  RocketChat.slashCommands.commands[command] = {
    command,
    callback,
    params: options.params,
    description: options.description,
    permission: options.permission,
    clientOnly: options.clientOnly || false,
    result
  };
};

RocketChat.slashCommands.run = function (command, params, item) {
  if (RocketChat.slashCommands.commands[command] && RocketChat.slashCommands.commands[command].callback) {
    return RocketChat.slashCommands.commands[command].callback(command, params, item);
  }
};

Meteor.methods({
  slashCommand(command) {
    if (!Meteor.userId()) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'slashCommand'
      });
    }

    return RocketChat.slashCommands.run(command.cmd, command.params, command.msg);
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"Message.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/lib/Message.js                                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let s;
module.watch(require("underscore.string"), {
  default(v) {
    s = v;
  }

}, 0);
RocketChat.Message = {
  parse(msg, language) {
    const messageType = RocketChat.MessageTypes.getType(msg);

    if (messageType) {
      if (messageType.render) {
        return messageType.render(msg);
      } else if (messageType.template) {
        // Render message
        return;
      } else if (messageType.message) {
        if (!language && typeof localStorage !== 'undefined') {
          language = localStorage.getItem('userLanguage');
        }

        const data = typeof messageType.data === 'function' && messageType.data(msg) || {};
        return TAPi18n.__(messageType.message, data, language);
      }
    }

    if (msg.u && msg.u.username === RocketChat.settings.get('Chatops_Username')) {
      msg.html = msg.msg;
      return msg.html;
    }

    msg.html = msg.msg;

    if (s.trim(msg.html) !== '') {
      msg.html = s.escapeHTML(msg.html);
    }

    msg.html = msg.html.replace(/\n/gm, '<br/>');
    return msg.html;
  }

};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"messageBox.js":function(require){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/lib/messageBox.js                                                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var _interopRequireDefault = require("@babel/runtime/helpers/builtin/interopRequireDefault");

var _objectSpread2 = _interopRequireDefault(require("@babel/runtime/helpers/builtin/objectSpread"));

RocketChat.messageBox = {};
RocketChat.messageBox.actions = new class {
  constructor() {
    this.actions = {};
  }
  /* Add a action to messagebox
  @param group
  @param label
  @param config
  icon: icon class
  action: action function
  condition: condition to display the action
  */


  add(group, label, config) {
    if (!group && !label && !config) {
      return;
    }

    if (!this.actions[group]) {
      this.actions[group] = [];
    }

    const actionExists = this.actions[group].find(action => {
      return action.label === label;
    });

    if (actionExists) {
      return;
    }

    this.actions[group].push((0, _objectSpread2.default)({}, config, {
      label
    }));
  }

  get(group) {
    if (!group) {
      return Object.keys(this.actions).reduce((ret, key) => {
        const actions = this.actions[key].filter(action => !action.condition || action.condition());

        if (actions.length) {
          ret[key] = actions;
        }

        return ret;
      }, {});
    }

    return this.actions[group].filter(action => !action.condition || action.condition());
  }

  getById(id) {
    const messageActions = this.actions;
    let actions = [];
    Object.keys(messageActions).forEach(function (action) {
      actions = actions.concat(messageActions[action]);
    });
    return actions.filter(action => action.id === id);
  }

}();
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"MessageTypes.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/lib/MessageTypes.js                                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.MessageTypes = new class {
  constructor() {
    this.types = {};
  }

  registerType(options) {
    return this.types[options.id] = options;
  }

  getType(message) {
    return this.types[message && message.t];
  }

  isSystemMessage(message) {
    const type = this.types[message && message.t];
    return type && type.system;
  }

}();
Meteor.startup(function () {
  RocketChat.MessageTypes.registerType({
    id: 'r',
    system: true,
    message: 'Room_name_changed',

    data(message) {
      return {
        room_name: message.msg,
        user_by: message.u.username
      };
    }

  });
  RocketChat.MessageTypes.registerType({
    id: 'au',
    system: true,
    message: 'User_added_by',

    data(message) {
      return {
        user_added: message.msg,
        user_by: message.u.username
      };
    }

  });
  RocketChat.MessageTypes.registerType({
    id: 'ru',
    system: true,
    message: 'User_removed_by',

    data(message) {
      return {
        user_removed: message.msg,
        user_by: message.u.username
      };
    }

  });
  RocketChat.MessageTypes.registerType({
    id: 'ul',
    system: true,
    message: 'User_left',

    data(message) {
      return {
        user_left: message.u.username
      };
    }

  });
  RocketChat.MessageTypes.registerType({
    id: 'uj',
    system: true,
    message: 'User_joined_channel',

    data(message) {
      return {
        user: message.u.username
      };
    }

  });
  RocketChat.MessageTypes.registerType({
    id: 'wm',
    system: true,
    message: 'Welcome',

    data(message) {
      return {
        user: message.u.username
      };
    }

  });
  RocketChat.MessageTypes.registerType({
    id: 'rm',
    system: true,
    message: 'Message_removed',

    data(message) {
      return {
        user: message.u.username
      };
    }

  });
  RocketChat.MessageTypes.registerType({
    id: 'rtc',

    render(message) {
      return RocketChat.callbacks.run('renderRtcMessage', message);
    }

  });
  RocketChat.MessageTypes.registerType({
    id: 'user-muted',
    system: true,
    message: 'User_muted_by',

    data(message) {
      return {
        user_muted: message.msg,
        user_by: message.u.username
      };
    }

  });
  RocketChat.MessageTypes.registerType({
    id: 'user-unmuted',
    system: true,
    message: 'User_unmuted_by',

    data(message) {
      return {
        user_unmuted: message.msg,
        user_by: message.u.username
      };
    }

  });
  RocketChat.MessageTypes.registerType({
    id: 'subscription-role-added',
    system: true,
    message: '__username__was_set__role__by__user_by_',

    data(message) {
      return {
        username: message.msg,
        role: message.role,
        user_by: message.u.username
      };
    }

  });
  RocketChat.MessageTypes.registerType({
    id: 'subscription-role-removed',
    system: true,
    message: '__username__is_no_longer__role__defined_by__user_by_',

    data(message) {
      return {
        username: message.msg,
        role: message.role,
        user_by: message.u.username
      };
    }

  });
  RocketChat.MessageTypes.registerType({
    id: 'room-archived',
    system: true,
    message: 'This_room_has_been_archived_by__username_',

    data(message) {
      return {
        username: message.u.username
      };
    }

  });
  RocketChat.MessageTypes.registerType({
    id: 'room-unarchived',
    system: true,
    message: 'This_room_has_been_unarchived_by__username_',

    data(message) {
      return {
        username: message.u.username
      };
    }

  });
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"templateVarHandler.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/lib/templateVarHandler.js                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let logger;

if (Meteor.isServer) {
  logger = new Logger('TemplateVarHandler', {});
}

RocketChat.templateVarHandler = function (variable, object) {
  const templateRegex = /#{([\w\-]+)}/gi;
  let match = templateRegex.exec(variable);
  let tmpVariable = variable;

  if (match == null) {
    if (!object.hasOwnProperty(variable)) {
      logger && logger.debug(`user does not have attribute: ${variable}`);
      return;
    }

    return object[variable];
  } else {
    logger && logger.debug('template found. replacing values');

    while (match != null) {
      const tmplVar = match[0];
      const tmplAttrName = match[1];

      if (!object.hasOwnProperty(tmplAttrName)) {
        logger && logger.debug(`user does not have attribute: ${tmplAttrName}`);
        return;
      }

      const attrVal = object[tmplAttrName];
      logger && logger.debug(`replacing template var: ${tmplVar} with value: ${attrVal}`);
      tmpVariable = tmpVariable.replace(tmplVar, attrVal);
      match = templateRegex.exec(variable);
    }

    return tmpVariable;
  }
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"getUserPreference.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/lib/getUserPreference.js                                                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/**
 * Tries to retrieve the user preference falling back to a default system
 * value or to a default value if it is passed as argument
*/
RocketChat.getUserPreference = function (user, key, defaultValue = undefined) {
  let preference;

  if (user && user.settings && user.settings.preferences && user.settings.preferences.hasOwnProperty(key)) {
    preference = user.settings.preferences[key];
  } else if (defaultValue === undefined) {
    preference = RocketChat.settings.get(`Accounts_Default_User_Preferences_${key}`);
  }

  return preference !== undefined ? preference : defaultValue;
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"startup":{"settingsOnLoadSiteUrl.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/lib/startup/settingsOnLoadSiteUrl.js                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/* globals WebAppInternals */
RocketChat.settings.get('Site_Url', function (key, value) {
  if (value == null || value.trim() === '') {
    return;
  }

  let host = value.replace(/\/$/, ''); // let prefix = '';

  const match = value.match(/([^\/]+\/{2}[^\/]+)(\/.+)/);

  if (match != null) {
    host = match[1]; // prefix = match[2].replace(/\/$/, '');
  }

  __meteor_runtime_config__.ROOT_URL = value;

  if (Meteor.absoluteUrl.defaultOptions && Meteor.absoluteUrl.defaultOptions.rootUrl) {
    Meteor.absoluteUrl.defaultOptions.rootUrl = value;
  }

  if (Meteor.isServer) {
    RocketChat.hostname = host.replace(/^https?:\/\//, '');
    process.env.MOBILE_ROOT_URL = host;
    process.env.MOBILE_DDP_URL = host;

    if (typeof WebAppInternals !== 'undefined' && WebAppInternals.generateBoilerplate) {
      return WebAppInternals.generateBoilerplate();
    }
  }
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}},"server":{"lib":{"debug.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/server/lib/debug.js                                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
const logger = new Logger('Meteor', {
  methods: {
    method: {
      type: 'debug'
    },
    publish: {
      type: 'debug'
    }
  }
});

const wrapMethods = function (name, originalHandler, methodsMap) {
  methodsMap[name] = function () {
    const args = name === 'ufsWrite' ? Array.prototype.slice.call(arguments, 1) : arguments;
    logger.method(name, '-> userId:', Meteor.userId(), ', arguments: ', args);
    return originalHandler.apply(this, arguments);
  };
};

const originalMeteorMethods = Meteor.methods;

Meteor.methods = function (methodMap) {
  _.each(methodMap, function (handler, name) {
    wrapMethods(name, handler, methodMap);
  });

  originalMeteorMethods(methodMap);
};

const originalMeteorPublish = Meteor.publish;

Meteor.publish = function (name, func) {
  return originalMeteorPublish(name, function () {
    logger.publish(name, '-> userId:', this.userId, ', arguments: ', arguments);
    return func.apply(this, arguments);
  });
};

WebApp.rawConnectHandlers.use(function (req, res, next) {
  res.setHeader('X-Instance-ID', InstanceStatus.id());
  return next();
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"bugsnag.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/server/lib/bugsnag.js                                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let bugsnag;
module.watch(require("bugsnag"), {
  default(v) {
    bugsnag = v;
  }

}, 0);
RocketChat.bugsnag = bugsnag;
RocketChat.settings.get('Bugsnag_api_key', (key, value) => {
  if (value) {
    bugsnag.register(value);
  }
});

const notify = function (message, stack) {
  if (typeof stack === 'string') {
    message += ` ${stack}`;
  }

  let options = {};

  if (RocketChat.Info) {
    options = {
      app: {
        version: RocketChat.Info.version,
        info: RocketChat.Info
      }
    };
  }

  const error = new Error(message);
  error.stack = stack;
  RocketChat.bugsnag.notify(error, options);
};

process.on('uncaughtException', Meteor.bindEnvironment(error => {
  notify(error.message, error.stack);
  throw error;
}));
const originalMeteorDebug = Meteor._debug;

Meteor._debug = function () {
  notify(...arguments);
  return originalMeteorDebug(...arguments);
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"metrics.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/server/lib/metrics.js                                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let client;
module.watch(require("prom-client"), {
  default(v) {
    client = v;
  }

}, 0);
RocketChat.promclient = client;
RocketChat.metrics = {}; // one sample metrics only - a counter

RocketChat.metrics.messagesSent = new client.Counter({
  'name': 'message_sent',
  'help': 'cumulated number of messages sent'
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"RateLimiter.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/server/lib/RateLimiter.js                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
RocketChat.RateLimiter = new class {
  limitFunction(fn, numRequests, timeInterval, matchers) {
    if (process.env.TEST_MODE === 'true') {
      return fn;
    }

    const rateLimiter = new RateLimiter();
    rateLimiter.addRule(matchers, numRequests, timeInterval);
    return function (...args) {
      const match = {};

      _.each(matchers, function (matcher, key) {
        return match[key] = args[key];
      });

      rateLimiter.increment(match);
      const rateLimitResult = rateLimiter.check(match);

      if (rateLimitResult.allowed) {
        return fn.apply(null, arguments);
      } else {
        throw new Meteor.Error('error-too-many-requests', `Error, too many requests. Please slow down. You must wait ${Math.ceil(rateLimitResult.timeToReset / 1000)} seconds before trying again.`, {
          timeToReset: rateLimitResult.timeToReset,
          seconds: Math.ceil(rateLimitResult.timeToReset / 1000)
        });
      }
    };
  }

  limitMethod(methodName, numRequests, timeInterval, matchers) {
    if (process.env.TEST_MODE === 'true') {
      return;
    }

    const match = {
      type: 'method',
      name: methodName
    };

    _.each(matchers, function (matcher, key) {
      return match[key] = matchers[key];
    });

    return DDPRateLimiter.addRule(match, numRequests, timeInterval);
  }

}();
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"configLogger.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/server/lib/configLogger.js                                                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/* globals LoggerManager */
RocketChat.settings.get('Log_Package', function (key, value) {
  return LoggerManager.showPackage = value;
});
RocketChat.settings.get('Log_File', function (key, value) {
  return LoggerManager.showFileAndLine = value;
});
RocketChat.settings.get('Log_Level', function (key, value) {
  if (value != null) {
    LoggerManager.logLevel = parseInt(value);
    Meteor.setTimeout(() => {
      return LoggerManager.enable(true);
    }, 200);
  }
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"PushNotification.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/server/lib/PushNotification.js                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/* globals Push */
class PushNotification {
  getNotificationId(roomId) {
    const serverId = RocketChat.settings.get('uniqueID');
    return this.hash(`${serverId}|${roomId}`); // hash
  }

  hash(str) {
    let hash = 0;
    let i = str.length;

    while (i) {
      hash = (hash << 5) - hash + str.charCodeAt(--i);
      hash = hash & hash; // Convert to 32bit integer
    }

    return hash;
  }

  send({
    roomName,
    roomId,
    username,
    message,
    usersTo,
    payload,
    badge = 1,
    category
  }) {
    let title;

    if (roomName && roomName !== '') {
      title = `${roomName}`;
      message = `${username}: ${message}`;
    } else {
      title = `${username}`;
    }

    const icon = RocketChat.settings.get('Assets_favicon_192').url || RocketChat.settings.get('Assets_favicon_192').defaultUrl;
    const config = {
      from: 'push',
      badge,
      sound: 'default',
      title,
      text: message,
      payload,
      query: usersTo,
      notId: this.getNotificationId(roomId),
      gcm: {
        style: 'inbox',
        summaryText: '%n% new messages',
        image: RocketChat.getURL(icon, {
          full: true
        })
      }
    };

    if (category !== '') {
      config.apn = {
        category
      };
    }

    return Push.send(config);
  }

}

RocketChat.PushNotification = new PushNotification();
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"defaultBlockedDomainsList.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/server/lib/defaultBlockedDomainsList.js                                                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.emailDomainDefaultBlackList = ['0-mail.com', '0815.ru', '0815.su', '0clickemail.com', '0wnd.net', '0wnd.org', '10mail.org', '10minut.com.pl', '10minutemail.co.za', '10minutemail.com', '10minutemail.de', '123-m.com', '1chuan.com', '1fsdfdsfsdf.tk', '1pad.de', '1zhuan.com', '20email.eu', '20mail.eu', '20mail.it', '20minutemail.com', '21cn.com', '2fdgdfgdfgdf.tk', '2prong.com', '30minutemail.com', '33mail.com', '3d-painting.com', '3trtretgfrfe.tk', '4gfdsgfdgfd.tk', '4warding.com', '4warding.net', '4warding.org', '5ghgfhfghfgh.tk', '60minutemail.com', '675hosting.com', '675hosting.net', '675hosting.org', '6hjgjhgkilkj.tk', '6ip.us', '6paq.com', '6url.com', '75hosting.com', '75hosting.net', '75hosting.org', '7days-printing.com', '7tags.com', '99experts.com', '9ox.net', 'a-bc.net', 'a45.in', 'abcmail.email', 'abyssmail.com', 'acentri.com', 'advantimo.com', 'afrobacon.com', 'ag.us.to', 'agedmail.com', 'ahk.jp', 'ajaxapp.net', 'alivance.com', 'ama-trade.de', 'amail.com', 'amilegit.com', 'amiri.net', 'amiriindustries.com', 'anappthat.com', 'ano-mail.net', 'anonbox.net', 'anonmails.de', 'anonymail.dk', 'anonymbox.com', 'antichef.com', 'antichef.net', 'antireg.ru', 'antispam.de', 'antispammail.de', 'appixie.com', 'armyspy.com', 'artman-conception.com', 'aver.com', 'azmeil.tk', 'baxomale.ht.cx', 'beddly.com', 'beefmilk.com', 'bigprofessor.so', 'bigstring.com', 'binkmail.com', 'bio-muesli.net', 'blogmyway.org', 'bobmail.info', 'bofthew.com', 'bootybay.de', 'boun.cr', 'bouncr.com', 'boxformail.in', 'breakthru.com', 'brefmail.com', 'brennendesreich.de', 'broadbandninja.com', 'bsnow.net', 'bspamfree.org', 'bu.mintemail.com', 'buffemail.com', 'bugmenot.com', 'bumpymail.com', 'bund.us', 'bundes-li.ga', 'burnthespam.info', 'burstmail.info', 'buymoreplays.com', 'buyusedlibrarybooks.org', 'byom.de', 'c2.hu', 'cachedot.net', 'card.zp.ua', 'casualdx.com', 'cbair.com', 'cek.pm', 'cellurl.com', 'centermail.com', 'centermail.net', 'chammy.info', 'cheatmail.de', 'childsavetrust.org', 'chogmail.com', 'choicemail1.com', 'chong-mail.com', 'chong-mail.net', 'chong-mail.org', 'clixser.com', 'cmail.com', 'cmail.net', 'cmail.org', 'coldemail.info', 'consumerriot.com', 'cool.fr.nf', 'correo.blogos.net', 'cosmorph.com', 'courriel.fr.nf', 'courrieltemporaire.com', 'crapmail.org', 'crazymailing.com', 'cubiclink.com', 'curryworld.de', 'cust.in', 'cuvox.de', 'd3p.dk', 'dacoolest.com', 'daintly.com', 'dandikmail.com', 'dayrep.com', 'dbunker.com', 'dcemail.com', 'deadaddress.com', 'deadspam.com', 'deagot.com', 'dealja.com', 'delikkt.de', 'despam.it', 'despammed.com', 'devnullmail.com', 'dfgh.net', 'digitalsanctuary.com', 'dingbone.com', 'discard.email', 'discardmail.com', 'discardmail.de', 'disposableaddress.com', 'disposableemailaddresses.com', 'disposableemailaddresses.emailmiser.com', 'disposableinbox.com', 'dispose.it', 'disposeamail.com', 'disposemail.com', 'dispostable.com', 'dlemail.ru', 'dm.w3internet.co.uk', 'dm.w3internet.co.ukexample.com', 'dodgeit.com', 'dodgit.com', 'dodgit.org', 'doiea.com', 'domozmail.com', 'donemail.ru', 'dontreg.com', 'dontsendmespam.de', 'dotmsg.com', 'drdrb.com', 'drdrb.net', 'droplar.com', 'dropmail.me', 'dt.com', 'duam.net', 'dudmail.com', 'dump-email.info', 'dumpandjunk.com', 'dumpmail.de', 'dumpyemail.com', 'duskmail.com', 'e-mail.com', 'e-mail.org', 'e4ward.com', 'easytrashmail.com', 'einmalmail.de', 'einrot.com', 'einrot.de', 'eintagsmail.de', 'email60.com', 'emaildienst.de', 'emailgo.de', 'emailias.com', 'emailigo.de', 'emailinfive.com', 'emaillime.com', 'emailmiser.com', 'emailproxsy.com', 'emailsensei.com', 'emailtemporanea.com', 'emailtemporanea.net', 'emailtemporar.ro', 'emailtemporario.com.br', 'emailthe.net', 'emailtmp.com', 'emailto.de', 'emailwarden.com', 'emailx.at.hm', 'emailxfer.com', 'emeil.in', 'emeil.ir', 'emil.com', 'emz.net', 'enterto.com', 'ephemail.net', 'ero-tube.org', 'etranquil.com', 'etranquil.net', 'etranquil.org', 'evopo.com', 'explodemail.com', 'express.net.ua', 'eyepaste.com', 'fakeinbox.com', 'fakeinformation.com', 'fakemail.fr', 'fakemailz.com', 'fammix.com', 'fansworldwide.de', 'fantasymail.de', 'fastacura.com', 'fastchevy.com', 'fastchrysler.com', 'fastkawasaki.com', 'fastmazda.com', 'fastmitsubishi.com', 'fastnissan.com', 'fastsubaru.com', 'fastsuzuki.com', 'fasttoyota.com', 'fastyamaha.com', 'fatflap.com', 'fdfdsfds.com', 'fightallspam.com', 'figjs.com', 'fiifke.de', 'filzmail.com', 'fivemail.de', 'fixmail.tk', 'fizmail.com', 'fleckens.hu', 'flemail.ru', 'flyspam.com', 'footard.com', 'forgetmail.com', 'fr33mail.info', 'frapmail.com', 'freundin.ru', 'friendlymail.co.uk', 'front14.org', 'fuckingduh.com', 'fudgerub.com', 'fux0ringduh.com', 'fyii.de', 'garliclife.com', 'gehensiemirnichtaufdensack.de', 'gelitik.in', 'get1mail.com', 'get2mail.fr', 'getairmail.com', 'getmails.eu', 'getonemail.com', 'getonemail.net', 'ghosttexter.de', 'giantmail.de', 'girlsundertheinfluence.com', 'gishpuppy.com', 'gmial.com', 'goemailgo.com', 'gorillaswithdirtyarmpits.com', 'gotmail.com', 'gotmail.net', 'gotmail.org', 'gotti.otherinbox.com', 'gowikibooks.com', 'gowikicampus.com', 'gowikicars.com', 'gowikifilms.com', 'gowikigames.com', 'gowikimusic.com', 'gowikimusic.great-host.in', 'gowikinetwork.com', 'gowikitravel.com', 'gowikitv.com', 'grandmamail.com', 'grandmasmail.com', 'great-host.in', 'greensloth.com', 'grr.la', 'gsrv.co.uk', 'guerillamail.biz', 'guerillamail.com', 'guerillamail.net', 'guerillamail.org', 'guerrillamail.biz', 'guerrillamail.com', 'guerrillamail.de', 'guerrillamail.info', 'guerrillamail.net', 'guerrillamail.org', 'guerrillamailblock.com', 'gustr.com', 'h.mintemail.com', 'h8s.org', 'hacccc.com', 'haltospam.com', 'harakirimail.com', 'hartbot.de', 'hat-geld.de', 'hatespam.org', 'hellodream.mobi', 'herp.in', 'hidemail.de', 'hidzz.com', 'hmamail.com', 'hochsitze.com', 'hopemail.biz', 'hotpop.com', 'hulapla.de', 'iaoss.com', 'ieatspam.eu', 'ieatspam.info', 'ieh-mail.de', 'ihateyoualot.info', 'iheartspam.org', 'ikbenspamvrij.nl', 'imails.info', 'imgof.com', 'imstations.com', 'inbax.tk', 'inbox.si', 'inboxalias.com', 'inboxclean.com', 'inboxclean.org', 'inboxproxy.com', 'incognitomail.com', 'incognitomail.net', 'incognitomail.org', 'infocom.zp.ua', 'inoutmail.de', 'inoutmail.eu', 'inoutmail.info', 'inoutmail.net', 'insorg-mail.info', 'instant-mail.de', 'ip6.li', 'ipoo.org', 'irish2me.com', 'iwi.net', 'jamit.com.au', 'jetable.com', 'jetable.fr.nf', 'jetable.net', 'jetable.org', 'jnxjn.com', 'jourrapide.com', 'jsrsolutions.com', 'junk1e.com', 'kasmail.com', 'kaspop.com', 'keepmymail.com', 'killmail.com', 'killmail.net', 'kimsdisk.com', 'kingsq.ga', 'kir.ch.tc', 'klassmaster.com', 'klassmaster.net', 'klzlk.com', 'kook.ml', 'koszmail.pl', 'kulturbetrieb.info', 'kurzepost.de', 'l33r.eu', 'lackmail.net', 'lags.us', 'lawlita.com', 'lazyinbox.com', 'letthemeatspam.com', 'lhsdv.com', 'lifebyfood.com', 'link2mail.net', 'litedrop.com', 'loadby.us', 'login-email.ml', 'lol.ovpn.to', 'lolfreak.net', 'lookugly.com', 'lopl.co.cc', 'lortemail.dk', 'lovemeleaveme.com', 'lr78.com', 'lroid.com', 'lukop.dk', 'm21.cc', 'm4ilweb.info', 'maboard.com', 'mail-filter.com', 'mail-temporaire.fr', 'mail.by', 'mail.mezimages.net', 'mail.zp.ua', 'mail114.net', 'mail1a.de', 'mail21.cc', 'mail2rss.org', 'mail333.com', 'mail4trash.com', 'mailbidon.com', 'mailbiz.biz', 'mailblocks.com', 'mailbucket.org', 'mailcat.biz', 'mailcatch.com', 'mailde.de', 'mailde.info', 'maildrop.cc', 'maildx.com', 'maileater.com', 'mailed.ro', 'maileimer.de', 'mailexpire.com', 'mailfa.tk', 'mailforspam.com', 'mailfreeonline.com', 'mailfs.com', 'mailguard.me', 'mailimate.com', 'mailin8r.com', 'mailinater.com', 'mailinator.com', 'mailinator.net', 'mailinator.org', 'mailinator.us', 'mailinator2.com', 'mailincubator.com', 'mailismagic.com', 'mailmate.com', 'mailme.ir', 'mailme.lv', 'mailme24.com', 'mailmetrash.com', 'mailmetrash.comilzilla.org', 'mailmoat.com', 'mailms.com', 'mailnator.com', 'mailnesia.com', 'mailnull.com', 'mailorg.org', 'mailpick.biz', 'mailproxsy.com', 'mailquack.com', 'mailrock.biz', 'mailscrap.com', 'mailshell.com', 'mailsiphon.com', 'mailslapping.com', 'mailslite.com', 'mailtemp.info', 'mailtome.de', 'mailtothis.com', 'mailtrash.net', 'mailtv.net', 'mailtv.tv', 'mailzilla.com', 'mailzilla.org', 'mailzilla.orgmbx.cc', 'makemetheking.com', 'manifestgenerator.com', 'manybrain.com', 'mbx.cc', 'mega.zik.dj', 'meinspamschutz.de', 'meltmail.com', 'messagebeamer.de', 'mezimages.net', 'mierdamail.com', 'migumail.com', 'ministry-of-silly-walks.de', 'mintemail.com', 'misterpinball.de', 'mjukglass.nu', 'mmailinater.com', 'moakt.com', 'mobi.web.id', 'mobileninja.co.uk', 'moburl.com', 'mohmal.com', 'moncourrier.fr.nf', 'monemail.fr.nf', 'monmail.fr.nf', 'monumentmail.com', 'msa.minsmail.com', 'mt2009.com', 'mt2014.com', 'mx0.wwwnew.eu', 'my10minutemail.com', 'mycard.net.ua', 'mycleaninbox.net', 'myemailboxy.com', 'mymail-in.net', 'mymailoasis.com', 'mynetstore.de', 'mypacks.net', 'mypartyclip.de', 'myphantomemail.com', 'mysamp.de', 'myspaceinc.com', 'myspaceinc.net', 'myspaceinc.org', 'myspacepimpedup.com', 'myspamless.com', 'mytemp.email', 'mytempemail.com', 'mytempmail.com', 'mytrashmail.com', 'nabuma.com', 'neomailbox.com', 'nepwk.com', 'nervmich.net', 'nervtmich.net', 'netmails.com', 'netmails.net', 'netzidiot.de', 'neverbox.com', 'nice-4u.com', 'nincsmail.com', 'nincsmail.hu', 'nnh.com', 'no-spam.ws', 'noblepioneer.com', 'nobulk.com', 'noclickemail.com', 'nogmailspam.info', 'nomail.pw', 'nomail.xl.cx', 'nomail2me.com', 'nomorespamemails.com', 'nonspam.eu', 'nonspammer.de', 'noref.in', 'nospam.ze.tc', 'nospam4.us', 'nospamfor.us', 'nospammail.net', 'nospamthanks.info', 'notmailinator.com', 'notsharingmy.info', 'nowhere.org', 'nowmymail.com', 'nurfuerspam.de', 'nus.edu.sg', 'nwldx.com', 'objectmail.com', 'obobbo.com', 'odaymail.com', 'odnorazovoe.ru', 'one-time.email', 'oneoffemail.com', 'oneoffmail.com', 'one2mail.info', 'onewaymail.com', 'onlatedotcom.info', 'online.ms', 'oopi.org', 'opayq.com', 'ordinaryamerican.net', 'otherinbox.codupmyspace.com', 'otherinbox.com', 'ourklips.com', 'outlawspam.com', 'ovpn.to', 'owlpic.com', 'pancakemail.com', 'paplease.com', 'pcusers.otherinbox.com', 'pepbot.com', 'pfui.ru', 'pimpedupmyspace.com', 'pjjkp.com', 'plexolan.de', 'poczta.onet.pl', 'politikerclub.de', 'pooae.com', 'poofy.org', 'pookmail.com', 'privacy.net', 'privatdemail.net', 'privy-mail.com', 'privymail.de', 'proxymail.eu', 'prtnx.com', 'prtz.eu', 'punkass.com', 'putthisinyourspamdatabase.com', 'pwrby.com', 'quickinbox.com', 'quickmail.nl', 'rcpt.at', 'reallymymail.com', 'realtyalerts.ca', 'recode.me', 'recursor.net', 'recyclemail.dk', 'regbypass.com', 'regbypass.comsafe-mail.net', 'rejectmail.com', 'reliable-mail.com', 'rhyta.com', 'rklips.com', 'rmqkr.net', 'royal.net', 'rppkn.com', 'rtrtr.com', 's0ny.net', 'safe-mail.net', 'safersignup.de', 'safetymail.info', 'safetypost.de', 'sandelf.de', 'saynotospams.com', 'schafmail.de', 'schrott-email.de', 'secretemail.de', 'secure-mail.biz', 'selfdestructingmail.com', 'selfdestructingmail.org', 'sendspamhere.com', 'sendspamhere.com', 'senseless-entertainment.com', 'services391.com', 'sharedmailbox.org', 'sharklasers.com', 'shieldedmail.com', 'shieldemail.com', 'shiftmail.com', 'shitmail.me', 'shitmail.org', 'shitware.nl', 'shmeriously.com', 'shortmail.net', 'shotmail.ru', 'showslow.de', 'sibmail.com', 'sinnlos-mail.de', 'siteposter.net', 'skeefmail.com', 'slapsfromlastnight.com', 'slaskpost.se', 'slipry.net', 'slopsbox.com', 'slushmail.com', 'smashmail.de', 'smellfear.com', 'smellrear.com', 'snakemail.com', 'sneakemail.com', 'sneakmail.de', 'snkmail.com', 'sofimail.com', 'sofort-mail.de', 'softpls.asia', 'sogetthis.com', 'sohu.com', 'solvemail.info', 'soodonims.com', 'spa.com', 'spaereplease.com', 'spam.la', 'spam.su', 'spam4.me', 'spamail.de', 'spamarrest.com', 'spamavert.com', 'spambob.com', 'spambob.net', 'spambob.org', 'spambog.com', 'spambog.de', 'spambog.net', 'spambog.ru', 'spambox.info', 'spambox.irishspringrealty.com', 'spambox.us', 'spamcannon.com', 'spamcannon.net', 'spamcero.com', 'spamcon.org', 'spamcorptastic.com', 'spamcowboy.com', 'spamcowboy.net', 'spamcowboy.org', 'spamday.com', 'spamex.com', 'spamfree.eu', 'spamfree24.com', 'spamfree24.de', 'spamfree24.eu', 'spamfree24.info', 'spamfree24.net', 'spamfree24.org', 'spamgoes.in', 'spamgourmet.com', 'spamgourmet.net', 'spamgourmet.org', 'spamherelots.com', 'spamhereplease.com', 'spamhole.com', 'spamify.com', 'spaminator.de', 'spamkill.info', 'spaml.com', 'spaml.de', 'spammotel.com', 'spamobox.com', 'spamoff.de', 'spamsalad.in', 'spamslicer.com', 'spamspot.com', 'spamstack.net', 'spamthis.co.uk', 'spamthisplease.com', 'spamtrail.com', 'spamtroll.net', 'speed.1s.fr', 'spikio.com', 'spoofmail.de', 'squizzy.de', 'ssoia.com', 'startkeys.com', 'stinkefinger.net', 'stop-my-spam.com', 'stuffmail.de', 'super-auswahl.de', 'supergreatmail.com', 'supermailer.jp', 'superrito.com', 'superstachel.de', 'suremail.info', 'svk.jp', 'sweetxxx.de', 'tagyourself.com', 'talkinator.com', 'tapchicuoihoi.com', 'teewars.org', 'teleosaurs.xyz', 'teleworm.com', 'teleworm.us', 'temp-mail.org', 'temp-mail.ru', 'temp.emeraldwebmail.com', 'temp.headstrong.de', 'tempalias.com', 'tempe-mail.com', 'tempemail.biz', 'tempemail.co.za', 'tempemail.com', 'tempemail.net', 'tempemail.net', 'tempinbox.co.uk', 'tempinbox.com', 'tempmail.eu', 'tempmail.it', 'tempmail2.com', 'tempmaildemo.com', 'tempmailer.com', 'tempmailer.de', 'tempomail.fr', 'temporarily.de', 'temporarioemail.com.br', 'temporaryemail.net', 'temporaryemail.us', 'temporaryforwarding.com', 'temporaryinbox.com', 'temporarymailaddress.com', 'tempsky.com', 'tempthe.net', 'tempymail.com', 'thanksnospam.info', 'thankyou2010.com', 'thc.st', 'thecloudindex.com', 'thelimestones.com', 'thisisnotmyrealemail.com', 'thismail.net', 'thrma.com', 'throwawayemailaddress.com', 'tilien.com', 'tittbit.in', 'tizi.com', 'tmail.ws', 'tmailinator.com', 'toiea.com', 'toomail.biz', 'topranklist.de', 'tradermail.info', 'trash-amil.com', 'trash-mail.at', 'trash-mail.com', 'trash-mail.de', 'trash2009.com', 'trash2010.com', 'trash2011.com', 'trashdevil.com', 'trashdevil.de', 'trashemail.de', 'trashmail.at', 'trashmail.com', 'trashmail.de', 'trashmail.me', 'trashmail.net', 'trashmail.org', 'trashmail.ws', 'trashmailer.com', 'trashymail.com', 'trashymail.net', 'trbvm.com', 'trbvn.com', 'trialmail.de', 'trillianpro.com', 'tryalert.com', 'turual.com', 'twinmail.de', 'twoweirdtricks.com', 'tyldd.com', 'uggsrock.com', 'umail.net', 'upliftnow.com', 'uplipht.com', 'uroid.com', 'us.af', 'username.e4ward.com', 'venompen.com', 'veryrealemail.com', 'vidchart.com', 'viditag.com', 'viewcastmedia.com', 'viewcastmedia.net', 'viewcastmedia.org', 'viewcastmediae', 'viralplays.com', 'vkcode.ru', 'vomoto.com', 'vpn.st', 'vsimcard.com', 'vubby.com', 'walala.org', 'walkmail.net', 'walkmail.ru', 'wasteland.rfc822.org', 'webemail.me', 'webm4il.info', 'webuser.in', 'wee.my', 'weg-werf-email.de', 'wegwerf-email-addressen.de', 'wegwerf-emails.de', 'wegwerfadresse.de', 'wegwerfemail.com', 'wegwerfemail.de', 'wegwerfmail.de', 'wegwerfmail.info', 'wegwerfmail.net', 'wegwerfmail.org', 'wetrainbayarea.com', 'wetrainbayarea.org', 'wh4f.org', 'whatiaas.com', 'whatpaas.com', 'whatsaas.com', 'whopy.com', 'whtjddn.33mail.com', 'whyspam.me', 'wilemail.com', 'willhackforfood.biz', 'willselfdestruct.com', 'winemaven.info', 'wronghead.com', 'wuzup.net', 'wuzupmail.net', 'www.e4ward.com', 'www.gishpuppy.com', 'www.mailinator.com', 'wwwnew.eu', 'x.ip6.li', 'xagloo.com', 'xemaps.com', 'xents.com', 'xmaily.com', 'xoxy.net', 'xyzfree.net', 'yapped.net', 'yeah.net', 'yep.it', 'yogamaven.com', 'yomail.info', 'yopmail.com', 'yopmail.fr', 'yopmail.net', 'yourdomain.com', 'ypmail.webarnak.fr.eu.org', 'yuurok.com', 'z1p.biz', 'za.com', 'zehnminuten.de', 'zehnminutenmail.de', 'zetmail.com', 'zippymail.info', 'zoaxe.com', 'zoemail.com', 'zoemail.net', 'zoemail.org', 'zomg.info', 'zxcv.com', 'zxcvbnm.com', 'zzz.com'];
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"interceptDirectReplyEmails.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/server/lib/interceptDirectReplyEmails.js                                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  IMAPIntercepter: () => IMAPIntercepter,
  POP3Intercepter: () => POP3Intercepter,
  POP3Helper: () => POP3Helper
});
let IMAP;
module.watch(require("imap"), {
  default(v) {
    IMAP = v;
  }

}, 0);
let POP3;
module.watch(require("poplib"), {
  default(v) {
    POP3 = v;
  }

}, 1);
let simpleParser;
module.watch(require("mailparser"), {
  simpleParser(v) {
    simpleParser = v;
  }

}, 2);

class IMAPIntercepter {
  constructor() {
    this.imap = new IMAP({
      user: RocketChat.settings.get('Direct_Reply_Username'),
      password: RocketChat.settings.get('Direct_Reply_Password'),
      host: RocketChat.settings.get('Direct_Reply_Host'),
      port: RocketChat.settings.get('Direct_Reply_Port'),
      debug: RocketChat.settings.get('Direct_Reply_Debug') ? console.log : false,
      tls: !RocketChat.settings.get('Direct_Reply_IgnoreTLS'),
      connTimeout: 30000,
      keepalive: true
    });
    this.delete = RocketChat.settings.get('Direct_Reply_Delete') ? RocketChat.settings.get('Direct_Reply_Delete') : true; // On successfully connected.

    this.imap.on('ready', Meteor.bindEnvironment(() => {
      if (this.imap.state !== 'disconnected') {
        this.openInbox(Meteor.bindEnvironment(err => {
          if (err) {
            throw err;
          } // fetch new emails & wait [IDLE]


          this.getEmails(); // If new message arrived, fetch them

          this.imap.on('mail', Meteor.bindEnvironment(() => {
            this.getEmails();
          }));
        }));
      } else {
        console.log('IMAP didnot connected.');
        this.imap.end();
      }
    }));
    this.imap.on('error', err => {
      console.log('Error occurred ...');
      throw err;
    });
  }

  openInbox(cb) {
    this.imap.openBox('INBOX', false, cb);
  }

  start() {
    this.imap.connect();
  }

  isActive() {
    if (this.imap && this.imap.state && this.imap.state === 'disconnected') {
      return false;
    }

    return true;
  }

  stop(callback = new Function()) {
    this.imap.end();
    this.imap.once('end', callback);
  }

  restart() {
    this.stop(() => {
      console.log('Restarting IMAP ....');
      this.start();
    });
  } // Fetch all UNSEEN messages and pass them for further processing


  getEmails() {
    this.imap.search(['UNSEEN'], Meteor.bindEnvironment((err, newEmails) => {
      if (err) {
        console.log(err);
        throw err;
      } // newEmails => array containing serials of unseen messages


      if (newEmails.length > 0) {
        const f = this.imap.fetch(newEmails, {
          // fetch headers & first body part.
          bodies: ['HEADER.FIELDS (FROM TO DATE MESSAGE-ID)', '1'],
          struct: true,
          markSeen: true
        });
        f.on('message', Meteor.bindEnvironment((msg, seqno) => {
          const email = {};
          msg.on('body', (stream, info) => {
            let headerBuffer = '';
            let bodyBuffer = '';
            stream.on('data', chunk => {
              if (info.which === '1') {
                bodyBuffer += chunk.toString('utf8');
              } else {
                headerBuffer += chunk.toString('utf8');
              }
            });
            stream.once('end', () => {
              if (info.which === '1') {
                email.body = bodyBuffer;
              } else {
                // parse headers
                email.headers = IMAP.parseHeader(headerBuffer);
                email.headers.to = email.headers.to[0];
                email.headers.date = email.headers.date[0];
                email.headers.from = email.headers.from[0];
              }
            });
          }); // On fetched each message, pass it further

          msg.once('end', Meteor.bindEnvironment(() => {
            // delete message from inbox
            if (this.delete) {
              this.imap.seq.addFlags(seqno, 'Deleted', err => {
                if (err) {
                  console.log(`Mark deleted error: ${err}`);
                }
              });
            }

            RocketChat.processDirectEmail(email);
          }));
        }));
        f.once('error', err => {
          console.log(`Fetch error: ${err}`);
        });
      }
    }));
  }

}

class POP3Intercepter {
  constructor() {
    this.pop3 = new POP3(RocketChat.settings.get('Direct_Reply_Port'), RocketChat.settings.get('Direct_Reply_Host'), {
      enabletls: !RocketChat.settings.get('Direct_Reply_IgnoreTLS'),
      debug: RocketChat.settings.get('Direct_Reply_Debug') ? console.log : false
    });
    this.totalMsgCount = 0;
    this.currentMsgCount = 0;
    this.pop3.on('connect', Meteor.bindEnvironment(() => {
      this.pop3.login(RocketChat.settings.get('Direct_Reply_Username'), RocketChat.settings.get('Direct_Reply_Password'));
    }));
    this.pop3.on('login', Meteor.bindEnvironment(status => {
      if (status) {
        // run on start
        this.pop3.list();
      } else {
        console.log('Unable to Log-in ....');
      }
    })); // on getting list of all emails

    this.pop3.on('list', Meteor.bindEnvironment((status, msgcount) => {
      if (status) {
        if (msgcount > 0) {
          this.totalMsgCount = msgcount;
          this.currentMsgCount = 1; // Retrieve email

          this.pop3.retr(this.currentMsgCount);
        } else {
          this.pop3.quit();
        }
      } else {
        console.log('Cannot Get Emails ....');
      }
    })); // on retrieved email

    this.pop3.on('retr', Meteor.bindEnvironment((status, msgnumber, data) => {
      if (status) {
        // parse raw email data to  JSON object
        simpleParser(data, Meteor.bindEnvironment((err, mail) => {
          this.initialProcess(mail);
        }));
        this.currentMsgCount += 1; // delete email

        this.pop3.dele(msgnumber);
      } else {
        console.log('Cannot Retrieve Message ....');
      }
    })); // on email deleted

    this.pop3.on('dele', Meteor.bindEnvironment(status => {
      if (status) {
        // get next email
        if (this.currentMsgCount <= this.totalMsgCount) {
          this.pop3.retr(this.currentMsgCount);
        } else {
          // parsed all messages.. so quitting
          this.pop3.quit();
        }
      } else {
        console.log('Cannot Delete Message....');
      }
    })); // invalid server state

    this.pop3.on('invalid-state', function (cmd) {
      console.log(`Invalid state. You tried calling ${cmd}`);
    }); // locked => command already running, not finished yet

    this.pop3.on('locked', function (cmd) {
      console.log(`Current command has not finished yet. You tried calling ${cmd}`);
    });
  }

  initialProcess(mail) {
    const email = {
      headers: {
        from: mail.from.text,
        to: mail.to.text,
        date: mail.date,
        'message-id': mail.messageId
      },
      body: mail.text
    };
    RocketChat.processDirectEmail(email);
  }

}

class POP3Helper {
  constructor() {
    this.running = false;
  }

  start() {
    // run every x-minutes
    if (RocketChat.settings.get('Direct_Reply_Frequency')) {
      RocketChat.POP3 = new POP3Intercepter();
      this.running = Meteor.setInterval(() => {
        // get new emails and process
        RocketChat.POP3 = new POP3Intercepter();
      }, Math.max(RocketChat.settings.get('Direct_Reply_Frequency') * 60 * 1000, 2 * 60 * 1000));
    }
  }

  isActive() {
    return this.running;
  }

  stop(callback = new Function()) {
    if (this.isActive()) {
      Meteor.clearInterval(this.running);
    }

    callback();
  }

}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"loginErrorMessageOverride.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/server/lib/loginErrorMessageOverride.js                                                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
// Do not disclose if user exists when password is invalid
const _runLoginHandlers = Accounts._runLoginHandlers;

Accounts._runLoginHandlers = function (methodInvocation, options) {
  const result = _runLoginHandlers.call(Accounts, methodInvocation, options);

  if (result.error && result.error.reason === 'Incorrect password') {
    result.error = new Meteor.Error(403, 'User not found');
  }

  return result;
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"notifyUsersOnMessage.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/server/lib/notifyUsersOnMessage.js                                                          //
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
let moment;
module.watch(require("moment"), {
  default(v) {
    moment = v;
  }

}, 2);
RocketChat.callbacks.add('afterSaveMessage', function (message, room) {
  // skips this callback if the message was edited and increments it if the edit was way in the past (aka imported)
  if (message.editedAt && Math.abs(moment(message.editedAt).diff()) > 60000) {
    //TODO: Review as I am not sure how else to get around this as the incrementing of the msgs count shouldn't be in this callback
    RocketChat.models.Rooms.incMsgCountById(message.rid, 1);
    return message;
  } else if (message.editedAt) {
    // only updates last message if it was edited (skip rest of callback)
    if (RocketChat.settings.get('Store_Last_Message') && (!room.lastMessage || room.lastMessage._id === message._id)) {
      RocketChat.models.Rooms.setLastMessageById(message.rid, message);
    }

    return message;
  }

  if (message.ts && Math.abs(moment(message.ts).diff()) > 60000) {
    RocketChat.models.Rooms.incMsgCountById(message.rid, 1);
    return message;
  }
  /**
   * Chechs if a messages contains a user highlight
   *
   * @param {string} message
   * @param {array|undefined} highlights
   *
   * @returns {boolean}
      */


  function messageContainsHighlight(message, highlights) {
    if (!highlights || highlights.length === 0) {
      return false;
    }

    let has = false;
    highlights.some(function (highlight) {
      const regexp = new RegExp(s.escapeRegExp(highlight), 'i');

      if (regexp.test(message.msg)) {
        has = true;
        return true;
      }
    });
    return has;
  }

  if (room != null) {
    let toAll = false;
    let toHere = false;
    const mentionIds = [];
    const highlightsIds = [];
    const highlights = RocketChat.models.Users.findUsersByUsernamesWithHighlights(room.usernames, {
      fields: {
        '_id': 1,
        'settings.preferences.highlights': 1
      }
    }).fetch();

    if (message.mentions != null) {
      message.mentions.forEach(function (mention) {
        if (!toAll && mention._id === 'all') {
          toAll = true;
        }

        if (!toHere && mention._id === 'here') {
          toHere = true;
        }

        if (mention._id !== message.u._id) {
          mentionIds.push(mention._id);
        }
      });
    }

    highlights.forEach(function (user) {
      const userHighlights = RocketChat.getUserPreference(user, 'highlights');

      if (userHighlights && messageContainsHighlight(message, userHighlights)) {
        if (user._id !== message.u._id) {
          highlightsIds.push(user._id);
        }
      }
    });

    if (room.t === 'd') {
      const unreadCountDM = RocketChat.settings.get('Unread_Count_DM');

      if (unreadCountDM === 'all_messages') {
        RocketChat.models.Subscriptions.incUnreadForRoomIdExcludingUserId(room._id, message.u._id);
      } else if (toAll || toHere) {
        RocketChat.models.Subscriptions.incGroupMentionsAndUnreadForRoomIdExcludingUserId(room._id, message.u._id, 1, 1);
      } else if (mentionIds && mentionIds.length > 0 || highlightsIds && highlightsIds.length > 0) {
        RocketChat.models.Subscriptions.incUserMentionsAndUnreadForRoomIdAndUserIds(room._id, _.compact(_.unique(mentionIds.concat(highlightsIds))), 1, 1);
      }
    } else {
      const unreadCount = RocketChat.settings.get('Unread_Count');

      if (toAll || toHere) {
        let incUnread = 0;

        if (['all_messages', 'group_mentions_only', 'user_and_group_mentions_only'].includes(unreadCount)) {
          incUnread = 1;
        }

        RocketChat.models.Subscriptions.incGroupMentionsAndUnreadForRoomIdExcludingUserId(room._id, message.u._id, 1, incUnread);
      } else if (mentionIds && mentionIds.length > 0 || highlightsIds && highlightsIds.length > 0) {
        let incUnread = 0;

        if (['all_messages', 'user_mentions_only', 'user_and_group_mentions_only'].includes(unreadCount)) {
          incUnread = 1;
        }

        RocketChat.models.Subscriptions.incUserMentionsAndUnreadForRoomIdAndUserIds(room._id, _.compact(_.unique(mentionIds.concat(highlightsIds))), 1, incUnread);
      } else if (unreadCount === 'all_messages') {
        RocketChat.models.Subscriptions.incUnreadForRoomIdExcludingUserId(room._id, message.u._id);
      }
    }
  } // Update all the room activity tracker fields


  RocketChat.models.Rooms.incMsgCountAndSetLastMessageById(message.rid, 1, message.ts, RocketChat.settings.get('Store_Last_Message') && message); // Update all other subscriptions to alert their owners but witout incrementing
  // the unread counter, as it is only for mentions and direct messages

  RocketChat.models.Subscriptions.setAlertForRoomIdExcludingUserId(message.rid, message.u._id);
  return message;
}, RocketChat.callbacks.priority.LOW, 'notifyUsersOnMessage');
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"processDirectEmail.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/server/lib/processDirectEmail.js                                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let reply;
module.watch(require("emailreplyparser"), {
  EmailReplyParser(v) {
    reply = v;
  }

}, 0);
let moment;
module.watch(require("moment"), {
  default(v) {
    moment = v;
  }

}, 1);

RocketChat.processDirectEmail = function (email) {
  function sendMessage(email) {
    const message = {
      ts: new Date(email.headers.date),
      msg: email.body,
      sentByEmail: true,
      groupable: false
    };

    if (message.ts) {
      const tsDiff = Math.abs(moment(message.ts).diff());

      if (tsDiff > 10000) {
        message.ts = new Date();
      }
    } else {
      message.ts = new Date();
    }

    if (message.msg && message.msg.length > RocketChat.settings.get('Message_MaxAllowedSize')) {
      return false;
    } // reduce new lines in multiline message


    message.msg = message.msg.split('\n\n').join('\n');
    const user = RocketChat.models.Users.findOneByEmailAddress(email.headers.from, {
      fields: {
        username: 1,
        name: 1
      }
    });

    if (!user) {
      // user not found
      return false;
    }

    const prevMessage = RocketChat.models.Messages.findOneById(email.headers.mid, {
      rid: 1,
      u: 1
    });

    if (!prevMessage) {
      // message doesn't exist anymore
      return false;
    }

    message.rid = prevMessage.rid;
    const room = Meteor.call('canAccessRoom', message.rid, user._id);

    if (!room) {
      return false;
    }

    const roomInfo = RocketChat.models.Rooms.findOneById(message.rid, {
      t: 1,
      name: 1
    }); // check mention

    if (message.msg.indexOf(`@${prevMessage.u.username}`) === -1 && roomInfo.t !== 'd') {
      message.msg = `@${prevMessage.u.username} ${message.msg}`;
    } // reply message link


    let prevMessageLink = `[ ](${Meteor.absoluteUrl().replace(/\/$/, '')}`;

    if (roomInfo.t === 'c') {
      prevMessageLink += `/channel/${roomInfo.name}?msg=${email.headers.mid}) `;
    } else if (roomInfo.t === 'd') {
      prevMessageLink += `/direct/${prevMessage.u.username}?msg=${email.headers.mid}) `;
    } else if (roomInfo.t === 'p') {
      prevMessageLink += `/group/${roomInfo.name}?msg=${email.headers.mid}) `;
    } // add reply message link


    message.msg = prevMessageLink + message.msg;
    const subscription = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(message.rid, user._id);

    if (subscription && subscription.blocked || subscription.blocker) {
      // room is blocked
      return false;
    }

    if ((room.muted || []).includes(user.username)) {
      // room is muted
      return false;
    }

    if (message.alias == null && RocketChat.settings.get('Message_SetNameToAliasEnabled')) {
      message.alias = user.name;
    }

    RocketChat.metrics.messagesSent.inc(); // TODO This line needs to be moved to it's proper place. See the comments on: https://github.com/RocketChat/Rocket.Chat/pull/5736

    return RocketChat.sendMessage(user, message, room);
  } // Extract/parse reply from email body


  email.body = reply.parse_reply(email.body); // if 'To' email format is "Name <username@domain>"

  if (email.headers.to.indexOf('<') >= 0 && email.headers.to.indexOf('>') >= 0) {
    email.headers.to = email.headers.to.split('<')[1].split('>')[0];
  } // if 'From' email format is "Name <username@domain>"


  if (email.headers.from.indexOf('<') >= 0 && email.headers.from.indexOf('>') >= 0) {
    email.headers.from = email.headers.from.split('<')[1].split('>')[0];
  } // 'To' email format "username+messageId@domain"


  if (email.headers.to.indexOf('+') >= 0) {
    // Valid 'To' format
    email.headers.mid = email.headers.to.split('@')[0].split('+')[1];
    sendMessage(email);
  } else {
    console.log('Invalid Email....If not. Please report it.');
  }
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"roomTypes.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/server/lib/roomTypes.js                                                                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let RoomTypesCommon;
module.watch(require("../../lib/RoomTypesCommon"), {
  RoomTypesCommon(v) {
    RoomTypesCommon = v;
  }

}, 0);
RocketChat.roomTypes = new class roomTypesServer extends RoomTypesCommon {
  /**
   * Add a publish for a room type
   *
   * @param {string} roomType room type (e.g.: c (for channels), d (for direct channels))
   * @param {function} callback function that will return the publish's data
  */
  setPublish(roomType, callback) {
    if (this.roomTypes[roomType] && this.roomTypes[roomType].publish != null) {
      throw new Meteor.Error('route-publish-exists', 'Publish for the given type already exists');
    }

    if (this.roomTypes[roomType] == null) {
      this.roomTypes[roomType] = {};
    }

    return this.roomTypes[roomType].publish = callback;
  }

  setRoomFind(roomType, callback) {
    if (this.roomTypes[roomType] && this.roomTypes[roomType].roomFind != null) {
      throw new Meteor.Error('room-find-exists', 'Room find for the given type already exists');
    }

    if (this.roomTypes[roomType] == null) {
      this.roomTypes[roomType] = {};
    }

    return this.roomTypes[roomType].roomFind = callback;
  }

  getRoomFind(roomType) {
    return this.roomTypes[roomType] && this.roomTypes[roomType].roomFind;
  }
  /**
   * Run the publish for a room type
   *
   * @param scope Meteor publish scope
   * @param {string} roomType room type (e.g.: c (for channels), d (for direct channels))
   * @param identifier identifier of the room
  */


  runPublish(scope, roomType, identifier) {
    return this.roomTypes[roomType] && this.roomTypes[roomType].publish && this.roomTypes[roomType].publish.call(scope, identifier);
  }

}();
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"sendEmailOnMessage.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/server/lib/sendEmailOnMessage.js                                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let moment;
module.watch(require("moment"), {
  default(v) {
    moment = v;
  }

}, 0);
let s;
module.watch(require("underscore.string"), {
  default(v) {
    s = v;
  }

}, 1);

function getEmailContent({
  messageContent,
  message,
  user,
  room
}) {
  const lng = user && user.language || RocketChat.settings.get('language') || 'en';
  const roomName = `#${RocketChat.settings.get('UI_Allow_room_names_with_special_chars') ? room.fname || room.name : room.name}`;
  const userName = RocketChat.settings.get('UI_Use_Real_Name') ? message.u.name || message.u.username : message.u.username;

  const header = TAPi18n.__(room.t === 'd' ? 'User_sent_a_message_to_you' : 'User_sent_a_message_on_channel', {
    username: userName,
    channel: roomName,
    lng
  });

  if (messageContent) {
    return `${header}<br/><br/>${messageContent}`;
  }

  if (message.file) {
    const fileHeader = TAPi18n.__(room.t === 'd' ? 'User_uploaded_a_file_to_you' : 'User_uploaded_a_file_on_channel', {
      username: userName,
      channel: roomName,
      lng
    });

    let content = `${TAPi18n.__('Attachment_File_Uploaded')}: ${message.file.name}`;

    if (message.attachments && message.attachments.length === 1 && message.attachments[0].description !== '') {
      content += `<br/><br/>${message.attachments[0].description}`;
    }

    return `${fileHeader}<br/><br/>${content}`;
  }

  if (message.attachments.length > 0) {
    const [attachment] = message.attachments;
    let content = '';

    if (attachment.title) {
      content += `${attachment.title}<br/>`;
    }

    if (attachment.text) {
      content += `${attachment.text}<br/>`;
    }

    return `${header}<br/><br/>${content}`;
  }

  return header;
}

RocketChat.callbacks.add('afterSaveMessage', function (message, room) {
  // skips this callback if the message was edited
  if (message.editedAt) {
    return message;
  }

  if (message.ts && Math.abs(moment(message.ts).diff()) > 60000) {
    return message;
  }

  const getMessageLink = (room, sub) => {
    const roomPath = RocketChat.roomTypes.getRouteLink(room.t, sub);
    const path = Meteor.absoluteUrl(roomPath ? roomPath.replace(/^\//, '') : '');
    const style = ['color: #fff;', 'padding: 9px 12px;', 'border-radius: 4px;', 'background-color: #04436a;', 'text-decoration: none;'].join(' ');

    const message = TAPi18n.__('Offline_Link_Message');

    return `<p style="text-align:center;margin-bottom:8px;"><a style="${style}" href="${path}">${message}</a>`;
  };

  const divisorMessage = '<hr style="margin: 20px auto; border: none; border-bottom: 1px solid #dddddd;">';
  let messageHTML;

  if (message.msg !== '') {
    messageHTML = s.escapeHTML(message.msg);
    message = RocketChat.callbacks.run('renderMessage', message);

    if (message.tokens && message.tokens.length > 0) {
      message.tokens.forEach(token => {
        token.text = token.text.replace(/([^\$])(\$[^\$])/gm, '$1$$$2');
        messageHTML = messageHTML.replace(token.token, token.text);
      });
    }

    messageHTML = messageHTML.replace(/\n/gm, '<br/>');
  }

  const header = RocketChat.placeholders.replace(RocketChat.settings.get('Email_Header') || '');
  let footer = RocketChat.placeholders.replace(RocketChat.settings.get('Email_Footer') || '');
  const usersToSendEmail = {};

  if (room.t === 'd') {
    usersToSendEmail[message.rid.replace(message.u._id, '')] = 'direct';
  } else {
    let isMentionAll = message.mentions.find(mention => mention._id === 'all');

    if (isMentionAll) {
      const maxMembersForNotification = RocketChat.settings.get('Notifications_Max_Room_Members');

      if (maxMembersForNotification !== 0 && room.usernames.length > maxMembersForNotification) {
        isMentionAll = undefined;
      }
    }

    let query;

    if (isMentionAll) {
      // Query all users in room limited by the max room members setting
      query = RocketChat.models.Subscriptions.findByRoomId(room._id);
    } else {
      // Query only mentioned users, will be always a few users
      const userIds = message.mentions.map(mention => mention._id);
      query = RocketChat.models.Subscriptions.findByRoomIdAndUserIdsOrAllMessages(room._id, userIds);
    }

    query.forEach(sub => {
      if (sub.disableNotifications) {
        return delete usersToSendEmail[sub.u._id];
      }

      const {
        emailNotifications,
        muteGroupMentions
      } = sub;

      if (emailNotifications === 'nothing') {
        return delete usersToSendEmail[sub.u._id];
      }

      if (isMentionAll && muteGroupMentions) {
        return delete usersToSendEmail[sub.u._id];
      }

      const mentionedUser = isMentionAll || message.mentions.find(mention => mention._id === sub.u._id);

      if (emailNotifications === 'default' || emailNotifications == null) {
        if (mentionedUser) {
          return usersToSendEmail[sub.u._id] = 'default';
        }

        return delete usersToSendEmail[sub.u._id];
      }

      if (emailNotifications === 'mentions' && mentionedUser) {
        return usersToSendEmail[sub.u._id] = 'mention';
      }

      if (emailNotifications === 'all') {
        return usersToSendEmail[sub.u._id] = 'all';
      }
    });
  }

  const userIdsToSendEmail = Object.keys(usersToSendEmail);
  let defaultLink;
  const linkByUser = {};

  if (RocketChat.roomTypes.hasCustomLink(room.t)) {
    RocketChat.models.Subscriptions.findByRoomIdAndUserIds(room._id, userIdsToSendEmail).forEach(sub => {
      linkByUser[sub.u._id] = getMessageLink(room, sub);
    });
  } else {
    defaultLink = getMessageLink(room, {
      name: room.name
    });
  }

  if (userIdsToSendEmail.length > 0) {
    const usersOfMention = RocketChat.models.Users.getUsersToSendOfflineEmail(userIdsToSendEmail).fetch();

    if (usersOfMention && usersOfMention.length > 0) {
      usersOfMention.forEach(user => {
        const emailNotificationMode = RocketChat.getUserPreference(user, 'emailNotificationMode');

        if (usersToSendEmail[user._id] === 'default') {
          if (emailNotificationMode === 'all') {
            //Mention/DM
            usersToSendEmail[user._id] = 'mention';
          } else {
            return;
          }
        }

        if (usersToSendEmail[user._id] === 'direct') {
          const userEmailPreferenceIsDisabled = emailNotificationMode === 'disabled';
          const directMessageEmailPreference = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(message.rid, message.rid.replace(message.u._id, '')).emailNotifications;

          if (directMessageEmailPreference === 'nothing') {
            return;
          }

          if ((directMessageEmailPreference === 'default' || directMessageEmailPreference == null) && userEmailPreferenceIsDisabled) {
            return;
          }
        } // Checks if user is in the room he/she is mentioned (unless it's public channel)


        if (room.t !== 'c' && room.usernames.indexOf(user.username) === -1) {
          return;
        } // Footer in case direct reply is enabled.


        if (RocketChat.settings.get('Direct_Reply_Enable')) {
          footer = RocketChat.placeholders.replace(RocketChat.settings.get('Email_Footer_Direct_Reply') || '');
        }

        let emailSubject;
        const username = RocketChat.settings.get('UI_Use_Real_Name') ? message.u.name : message.u.username;
        const roomName = RocketChat.settings.get('UI_Allow_room_names_with_special_chars') ? room.fname : room.name;

        switch (usersToSendEmail[user._id]) {
          case 'all':
            emailSubject = RocketChat.placeholders.replace(RocketChat.settings.get('Offline_Mention_All_Email'), {
              user: username,
              room: roomName || room.label
            });
            break;

          case 'direct':
            emailSubject = RocketChat.placeholders.replace(RocketChat.settings.get('Offline_DM_Email'), {
              user: username,
              room: roomName
            });
            break;

          case 'mention':
            emailSubject = RocketChat.placeholders.replace(RocketChat.settings.get('Offline_Mention_Email'), {
              user: username,
              room: roomName
            });
            break;
        }

        user.emails.some(email => {
          if (email.verified) {
            const content = getEmailContent({
              messageContent: messageHTML,
              message,
              user,
              room
            });
            email = {
              to: email.address,
              subject: emailSubject,
              html: header + content + divisorMessage + (linkByUser[user._id] || defaultLink) + footer
            }; // using user full-name/channel name in from address

            if (room.t === 'd') {
              email.from = `${message.u.name} <${RocketChat.settings.get('From_Email')}>`;
            } else {
              email.from = `${room.name} <${RocketChat.settings.get('From_Email')}>`;
            } // If direct reply enabled, email content with headers


            if (RocketChat.settings.get('Direct_Reply_Enable')) {
              email.headers = {
                // Reply-To header with format "username+messageId@domain"
                'Reply-To': `${RocketChat.settings.get('Direct_Reply_Username').split('@')[0].split(RocketChat.settings.get('Direct_Reply_Separator'))[0]}${RocketChat.settings.get('Direct_Reply_Separator')}${message._id}@${RocketChat.settings.get('Direct_Reply_Username').split('@')[1]}`
              };
            }

            Meteor.defer(() => {
              Email.send(email);
            });
            return true;
          }
        });
      });
    }
  }

  return message;
}, RocketChat.callbacks.priority.LOW, 'sendEmailOnMessage');
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"sendNotificationsOnMessage.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/server/lib/sendNotificationsOnMessage.js                                                    //
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
let moment;
module.watch(require("moment"), {
  default(v) {
    moment = v;
  }

}, 2);
const CATEGORY_MESSAGE = 'MESSAGE';
const CATEGORY_MESSAGE_NOREPLY = 'MESSAGE_NOREPLY';
/**
 * Replaces @username with full name
 *
 * @param {string} message The message to replace
 * @param {object[]} mentions Array of mentions used to make replacements
 *
 * @returns {string}
 */

function replaceMentionedUsernamesWithFullNames(message, mentions) {
  if (!mentions || !mentions.length) {
    return message;
  }

  mentions.forEach(mention => {
    const user = RocketChat.models.Users.findOneById(mention._id);

    if (user && user.name) {
      message = message.replace(`@${mention.username}`, user.name);
    }
  });
  return message;
}

function canSendMessageToRoom(room, username) {
  return !(room.muted || []).includes(username);
}
/**
 * This function returns a string ready to be shown in the notification
 *
 * @param {object} message the message to be parsed
 */


function parseMessageText(message, userId) {
  const user = RocketChat.models.Users.findOneById(userId);
  const lng = user && user.language || RocketChat.settings.get('language') || 'en';

  if (!message.msg && message.attachments && message.attachments[0]) {
    message.msg = message.attachments[0].image_type ? TAPi18n.__('User_uploaded_image', {
      lng
    }) : TAPi18n.__('User_uploaded_file', {
      lng
    });
  }

  message.msg = RocketChat.callbacks.run('beforeNotifyUser', message.msg);
  return message.msg;
}
/**
 * Send notification to user
 *
 * @param {string} userId The user to notify
 * @param {object} user The sender
 * @param {object} room The room send from
 * @param {number} duration Duration of notification
 */


function notifyDesktopUser(userId, user, message, room, duration) {
  const UI_Use_Real_Name = RocketChat.settings.get('UI_Use_Real_Name') === true;
  message.msg = parseMessageText(message, userId);

  if (UI_Use_Real_Name) {
    message.msg = replaceMentionedUsernamesWithFullNames(message.msg, message.mentions);
  }

  let title = UI_Use_Real_Name ? user.name : `@${user.username}`;

  if (room.t !== 'd' && room.name) {
    title += ` @ #${room.name}`;
  }

  RocketChat.Notifications.notifyUser(userId, 'notification', {
    title,
    text: message.msg,
    duration,
    payload: {
      _id: message._id,
      rid: message.rid,
      sender: message.u,
      type: room.t,
      name: room.name
    }
  });
}

function notifyAudioUser(userId, message, room) {
  RocketChat.Notifications.notifyUser(userId, 'audioNotification', {
    payload: {
      _id: message._id,
      rid: message.rid,
      sender: message.u,
      type: room.t,
      name: room.name
    }
  });
}
/**
 * Checks if a message contains a user highlight
 *
 * @param {string} message
 * @param {array|undefined} highlights
 *
 * @returns {boolean}
 */


function messageContainsHighlight(message, highlights) {
  if (!highlights || highlights.length === 0) {
    return false;
  }

  let has = false;
  highlights.some(function (highlight) {
    const regexp = new RegExp(s.escapeRegExp(highlight), 'i');

    if (regexp.test(message.msg)) {
      has = true;
      return true;
    }
  });
  return has;
}

function getBadgeCount(userId) {
  const subscriptions = RocketChat.models.Subscriptions.findUnreadByUserId(userId).fetch();
  return subscriptions.reduce((unread, sub) => {
    return sub.unread + unread;
  }, 0);
}

const sendPushNotifications = (userIdsToPushNotify = [], message, room, push_room, push_username, push_message, pushUsernames) => {
  if (userIdsToPushNotify.length > 0 && Push.enabled === true) {
    // send a push notification for each user individually (to get his/her badge count)
    userIdsToPushNotify.forEach(userIdToNotify => {
      RocketChat.PushNotification.send({
        roomId: message.rid,
        roomName: push_room,
        username: push_username,
        message: push_message,
        badge: getBadgeCount(userIdToNotify),
        payload: {
          host: Meteor.absoluteUrl(),
          rid: message.rid,
          sender: message.u,
          type: room.t,
          name: room.name
        },
        usersTo: {
          userId: userIdToNotify
        },
        category: canSendMessageToRoom(room, pushUsernames[userIdToNotify]) ? CATEGORY_MESSAGE : CATEGORY_MESSAGE_NOREPLY
      });
    });
  }
};

const callJoin = (user, rid) => user.active && Meteor.runAsUser(user._id, () => Meteor.call('joinRoom', rid));

RocketChat.callbacks.add('afterSaveMessage', function (message, room, userId) {
  // skips this callback if the message was edited
  if (message.editedAt) {
    return message;
  }

  if (message.ts && Math.abs(moment(message.ts).diff()) > 60000) {
    return message;
  }

  const pushUsernames = {};
  const user = room.t !== 'l' ? RocketChat.models.Users.findOneById(message.u._id) : room.v;

  if (!user) {
    return message;
  }
  /*
  Increment unread couter if direct messages
   */


  const settings = {
    alwaysNotifyDesktopUsers: [],
    dontNotifyDesktopUsers: [],
    alwaysNotifyMobileUsers: [],
    dontNotifyMobileUsers: [],
    desktopNotificationDurations: {},
    alwaysNotifyAudioUsers: [],
    dontNotifyAudioUsers: [],
    audioNotificationValues: {},
    dontNotifyUsersOnGroupMentions: []
  };
  /**
   * Checks if a given user can be notified
   *
   * @param {string} id
   * @param {string} type - mobile|desktop
   *
   * @returns {boolean}
      */

  function canBeNotified(id, type) {
    const types = {
      desktop: ['dontNotifyDesktopUsers', 'alwaysNotifyDesktopUsers'],
      mobile: ['dontNotifyMobileUsers', 'alwaysNotifyMobileUsers'],
      audio: ['dontNotifyAudioUsers', 'alwaysNotifyAudioUsers']
    };
    return settings[types[type][0]].indexOf(id) === -1 || settings[types[type][1]].indexOf(id) !== -1;
  } // Don't fetch all users if room exceeds max members


  const maxMembersForNotification = RocketChat.settings.get('Notifications_Max_Room_Members');
  const disableAllMessageNotifications = room.usernames.length > maxMembersForNotification && maxMembersForNotification !== 0;
  const subscriptions = RocketChat.models.Subscriptions.findNotificationPreferencesByRoom(room._id, disableAllMessageNotifications) || [];
  const userIds = [];
  subscriptions.forEach(s => userIds.push(s.u._id));
  const users = {};
  RocketChat.models.Users.findUsersByIds(userIds, {
    fields: {
      'settings.preferences': 1
    }
  }).forEach(user => {
    users[user._id] = user;
  });
  subscriptions.forEach(subscription => {
    if (subscription.disableNotifications) {
      settings.dontNotifyDesktopUsers.push(subscription.u._id);
      settings.dontNotifyMobileUsers.push(subscription.u._id);
      settings.dontNotifyAudioUsers.push(subscription.u._id);
      return;
    }

    if (Array.isArray(subscription.ignored) && subscription.ignored.find(message.u._id)) {
      return;
    }

    const {
      audioNotifications = RocketChat.getUserPreference(users[subscription.u._id], 'audioNotifications'),
      desktopNotifications = RocketChat.getUserPreference(users[subscription.u._id], 'desktopNotifications'),
      mobilePushNotifications = RocketChat.getUserPreference(users[subscription.u._id], 'mobileNotifications')
    } = subscription;

    if (audioNotifications === 'all' && !disableAllMessageNotifications) {
      settings.alwaysNotifyAudioUsers.push(subscription.u._id);
    }

    if (desktopNotifications === 'all' && !disableAllMessageNotifications) {
      settings.alwaysNotifyDesktopUsers.push(subscription.u._id);
    } else if (desktopNotifications === 'nothing') {
      settings.dontNotifyDesktopUsers.push(subscription.u._id);
    }

    if (mobilePushNotifications === 'all' && !disableAllMessageNotifications) {
      settings.alwaysNotifyMobileUsers.push(subscription.u._id);
    } else if (mobilePushNotifications === 'nothing') {
      settings.dontNotifyMobileUsers.push(subscription.u._id);
    }

    settings.audioNotificationValues[subscription.u._id] = subscription.audioNotificationValue;
    settings.desktopNotificationDurations[subscription.u._id] = subscription.desktopNotificationDuration;

    if (subscription.muteGroupMentions) {
      settings.dontNotifyUsersOnGroupMentions.push(subscription.u._id);
    }
  });
  let userIdsForAudio = [];
  let userIdsToNotify = [];
  let userIdsToPushNotify = [];
  const mentions = [];
  const alwaysNotifyMobileBoolean = RocketChat.settings.get('Notifications_Always_Notify_Mobile');
  const usersWithHighlights = RocketChat.models.Users.findUsersByUsernamesWithHighlights(room.usernames, {
    fields: {
      '_id': 1,
      'settings.preferences.highlights': 1
    }
  }).fetch().filter(user => messageContainsHighlight(message, user.settings.preferences.highlights));
  let push_message = ' '; //Set variables depending on Push Notification settings

  if (RocketChat.settings.get('Push_show_message')) {
    push_message = parseMessageText(message, userId);
  }

  let push_username = '';
  let push_room = '';

  if (RocketChat.settings.get('Push_show_username_room')) {
    push_username = user.username;
    push_room = `#${room.name}`;
  }

  if (room.t == null || room.t === 'd') {
    const userOfMentionId = message.rid.replace(message.u._id, '');
    const userOfMention = RocketChat.models.Users.findOne({
      _id: userOfMentionId
    }, {
      fields: {
        username: 1,
        statusConnection: 1
      }
    }); // Always notify Sandstorm

    if (userOfMention != null) {
      RocketChat.Sandstorm.notify(message, [userOfMention._id], `@${user.username}: ${message.msg}`, 'privateMessage');

      if (canBeNotified(userOfMentionId, 'desktop')) {
        const duration = settings.desktopNotificationDurations[userOfMention._id];
        notifyDesktopUser(userOfMention._id, user, message, room, duration);
      }

      if (canBeNotified(userOfMentionId, 'mobile')) {
        if (Push.enabled === true && (userOfMention.statusConnection !== 'online' || alwaysNotifyMobileBoolean === true)) {
          RocketChat.PushNotification.send({
            roomId: message.rid,
            username: push_username,
            message: push_message,
            badge: getBadgeCount(userOfMention._id),
            payload: {
              host: Meteor.absoluteUrl(),
              rid: message.rid,
              sender: message.u,
              type: room.t,
              name: room.name
            },
            usersTo: {
              userId: userOfMention._id
            },
            category: canSendMessageToRoom(room, userOfMention.username) ? CATEGORY_MESSAGE : CATEGORY_MESSAGE_NOREPLY
          });
          return message;
        }
      }
    }
  } else {
    const mentionIds = (message.mentions || []).map(({
      _id
    }) => _id);
    const toAll = mentionIds.includes('all');
    const toHere = mentionIds.includes('here');

    if (mentionIds.length + settings.alwaysNotifyDesktopUsers.length > 0) {
      let desktopMentionIds = _.union(mentionIds, settings.alwaysNotifyDesktopUsers);

      desktopMentionIds = _.difference(desktopMentionIds, settings.dontNotifyDesktopUsers);
      let usersOfDesktopMentions = RocketChat.models.Users.find({
        _id: {
          $in: desktopMentionIds
        }
      }, {
        fields: {
          _id: 1,
          username: 1,
          active: 1
        }
      }).fetch();
      mentions.push(...usersOfDesktopMentions);

      if (room.t !== 'c') {
        usersOfDesktopMentions = _.reject(usersOfDesktopMentions, usersOfMentionItem => {
          return room.usernames.indexOf(usersOfMentionItem.username) === -1;
        });
      }

      userIdsToNotify = _.pluck(usersOfDesktopMentions, '_id');
    }

    if (mentionIds.length + settings.alwaysNotifyMobileUsers.length > 0) {
      let mobileMentionIds = _.union(mentionIds, settings.alwaysNotifyMobileUsers);

      mobileMentionIds = _.difference(mobileMentionIds, settings.dontNotifyMobileUsers);
      const usersOfMobileMentionsQuery = {
        _id: {
          $in: mobileMentionIds
        }
      };

      if (alwaysNotifyMobileBoolean !== true) {
        usersOfMobileMentionsQuery.statusConnection = {
          $ne: 'online'
        };
      }

      let usersOfMobileMentions = RocketChat.models.Users.find(usersOfMobileMentionsQuery, {
        fields: {
          _id: 1,
          username: 1,
          statusConnection: 1,
          active: 1
        }
      }).fetch();
      mentions.push(...usersOfMobileMentions);

      if (room.t !== 'c') {
        usersOfMobileMentions = _.reject(usersOfMobileMentions, usersOfMentionItem => !room.usernames.includes(usersOfMentionItem.username));
      }

      userIdsToPushNotify = usersOfMobileMentions.map(userMobile => {
        pushUsernames[userMobile._id] = userMobile.username;
        return userMobile._id;
      });
    }

    if (mentionIds.length + settings.alwaysNotifyAudioUsers.length > 0) {
      let audioMentionIds = _.union(mentionIds, settings.alwaysNotifyAudioUsers);

      audioMentionIds = _.difference(audioMentionIds, userIdsToNotify);
      let usersOfAudioMentions = RocketChat.models.Users.find({
        _id: {
          $in: audioMentionIds
        },
        statusConnection: {
          $ne: 'offline'
        }
      }, {
        fields: {
          _id: 1,
          username: 1,
          active: 1
        }
      }).fetch();
      mentions.push(...usersOfAudioMentions);

      if (room.t !== 'c') {
        usersOfAudioMentions = _.reject(usersOfAudioMentions, usersOfMentionItem => {
          return room.usernames.indexOf(usersOfMentionItem.username) === -1;
        });
      }

      userIdsForAudio = _.pluck(usersOfAudioMentions, '_id');
    }

    if (room.t === 'c') {
      mentions.filter(user => !room.usernames.includes(user.username)).forEach(user => callJoin(user, room._id));
    }

    if ([toAll, toHere].some(e => e) && room.usernames && room.usernames.length > 0) {
      RocketChat.models.Users.find({
        username: {
          $in: room.usernames
        },
        _id: {
          $ne: user._id
        }
      }, {
        fields: {
          _id: 1,
          username: 1,
          status: 1,
          statusConnection: 1
        }
      }).forEach(function ({
        status,
        _id,
        username,
        statusConnection
      }) {
        // user
        if (Array.isArray(settings.dontNotifyUsersOnGroupMentions) && settings.dontNotifyUsersOnGroupMentions.includes(_id)) {
          return;
        }

        if (['online', 'away', 'busy'].includes(status) && !(settings.dontNotifyDesktopUsers || []).includes(_id)) {
          userIdsToNotify.push(_id);
          userIdsForAudio.push(_id);
        }

        if (toAll && statusConnection !== 'online' && !(settings.dontNotifyMobileUsers || []).includes(_id)) {
          pushUsernames[_id] = username;
          return userIdsToPushNotify.push(_id);
        }

        if (toAll && statusConnection !== 'online') {
          userIdsForAudio.push(_id);
        }
      });
    }

    if (usersWithHighlights.length > 0) {
      const highlightsIds = _.pluck(usersWithHighlights, '_id');

      userIdsForAudio = userIdsForAudio.concat(highlightsIds);
      userIdsToNotify = userIdsToNotify.concat(highlightsIds);
      userIdsToPushNotify = userIdsToPushNotify.concat(highlightsIds);
    }

    userIdsToNotify = _.without(_.compact(_.unique(userIdsToNotify)), message.u._id);
    userIdsToPushNotify = _.without(_.compact(_.unique(userIdsToPushNotify)), message.u._id);
    userIdsForAudio = _.without(_.compact(_.unique(userIdsForAudio)), message.u._id);

    for (const usersOfMentionId of userIdsToNotify) {
      const duration = settings.desktopNotificationDurations[usersOfMentionId];
      notifyDesktopUser(usersOfMentionId, user, message, room, duration);
    }

    for (const usersOfMentionId of userIdsForAudio) {
      notifyAudioUser(usersOfMentionId, message, room);
    }

    sendPushNotifications(userIdsToPushNotify, message, room, push_room, push_username, push_message, pushUsernames);

    const allUserIdsToNotify = _.unique(userIdsToNotify.concat(userIdsToPushNotify));

    RocketChat.Sandstorm.notify(message, allUserIdsToNotify, `@${user.username}: ${message.msg}`, room.t === 'p' ? 'privateMessage' : 'message');
  }

  return message;
}, RocketChat.callbacks.priority.LOW, 'sendNotificationOnMessage');
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"validateEmailDomain.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/server/lib/validateEmailDomain.js                                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
let dns;
module.watch(require("dns"), {
  default(v) {
    dns = v;
  }

}, 1);
let emailDomainBlackList = [];
let emailDomainWhiteList = [];
let useDefaultBlackList = false;
let useDNSDomainCheck = false;
RocketChat.settings.get('Accounts_BlockedDomainsList', function (key, value) {
  emailDomainBlackList = _.map(value.split(','), domain => domain.trim());
});
RocketChat.settings.get('Accounts_AllowedDomainsList', function (key, value) {
  emailDomainWhiteList = _.map(value.split(','), domain => domain.trim());
});
RocketChat.settings.get('Accounts_UseDefaultBlockedDomainsList', function (key, value) {
  useDefaultBlackList = value;
});
RocketChat.settings.get('Accounts_UseDNSDomainCheck', function (key, value) {
  useDNSDomainCheck = value;
});

RocketChat.validateEmailDomain = function (email) {
  const emailValidation = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  if (!emailValidation.test(email)) {
    throw new Meteor.Error('error-invalid-email', `Invalid email ${email}`, {
      function: 'RocketChat.validateEmailDomain',
      email
    });
  }

  const emailDomain = email.substr(email.lastIndexOf('@') + 1); // if not in whitelist

  if (emailDomainWhiteList.indexOf(emailDomain) === -1) {
    if (emailDomainBlackList.indexOf(emailDomain) !== -1 || useDefaultBlackList && RocketChat.emailDomainDefaultBlackList.indexOf(emailDomain) !== -1) {
      throw new Meteor.Error('error-email-domain-blacklisted', 'The email domain is blacklisted', {
        function: 'RocketChat.validateEmailDomain'
      });
    }
  }

  if (useDNSDomainCheck) {
    try {
      Meteor.wrapAsync(dns.resolveMx)(emailDomain);
    } catch (e) {
      throw new Meteor.Error('error-invalid-domain', 'Invalid domain', {
        function: 'RocketChat.validateEmailDomain'
      });
    }
  }
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/server/lib/index.js                                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  RoomSettingsEnum: () => RoomSettingsEnum,
  RoomTypeConfig: () => RoomTypeConfig,
  RoomTypeRouteConfig: () => RoomTypeRouteConfig
});
let RoomSettingsEnum, RoomTypeConfig, RoomTypeRouteConfig;
module.watch(require("../../lib/RoomTypeConfig"), {
  RoomSettingsEnum(v) {
    RoomSettingsEnum = v;
  },

  RoomTypeConfig(v) {
    RoomTypeConfig = v;
  },

  RoomTypeRouteConfig(v) {
    RoomTypeRouteConfig = v;
  }

}, 0);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"functions":{"isDocker.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/server/functions/isDocker.js                                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let fs;
module.watch(require("fs"), {
  default(v) {
    fs = v;
  }

}, 0);

function hasDockerEnv() {
  try {
    fs.statSync('/.dockerenv');
    return true;
  } catch (err) {
    return false;
  }
}

function hasDockerCGroup() {
  try {
    return fs.readFileSync('/proc/self/cgroup', 'utf8').indexOf('docker') !== -1;
  } catch (err) {
    return false;
  }
}

function check() {
  return hasDockerEnv() || hasDockerCGroup();
}

let isDocker;

RocketChat.isDocker = function () {
  if (isDocker === undefined) {
    isDocker = check();
  }

  return isDocker;
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"addUserToDefaultChannels.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/server/functions/addUserToDefaultChannels.js                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.addUserToDefaultChannels = function (user, silenced) {
  RocketChat.callbacks.run('beforeJoinDefaultChannels', user);
  const defaultRooms = RocketChat.models.Rooms.findByDefaultAndTypes(true, ['c', 'p'], {
    fields: {
      usernames: 0
    }
  }).fetch();
  defaultRooms.forEach(room => {
    // put user in default rooms
    const muted = room.ro && !RocketChat.authz.hasPermission(user._id, 'post-readonly');
    RocketChat.models.Rooms.addUsernameById(room._id, user.username, muted);

    if (!RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(room._id, user._id)) {
      // Add a subscription to this user
      RocketChat.models.Subscriptions.createWithRoomAndUser(room, user, {
        ts: new Date(),
        open: true,
        alert: true,
        unread: 1,
        userMentions: 1,
        groupMentions: 0
      }); // Insert user joined message

      if (!silenced) {
        RocketChat.models.Messages.createUserJoinWithRoomIdAndUser(room._id, user);
      }
    }
  });
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"addUserToRoom.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/server/functions/addUserToRoom.js                                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.addUserToRoom = function (rid, user, inviter, silenced) {
  const now = new Date();
  const room = RocketChat.models.Rooms.findOneById(rid); // Check if user is already in room

  const subscription = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(rid, user._id);

  if (subscription) {
    return;
  }

  if (room.t === 'c' || room.t === 'p') {
    RocketChat.callbacks.run('beforeJoinRoom', user, room);
  }

  const muted = room.ro && !RocketChat.authz.hasPermission(user._id, 'post-readonly');
  RocketChat.models.Rooms.addUsernameById(rid, user.username, muted);
  RocketChat.models.Subscriptions.createWithRoomAndUser(room, user, {
    ts: now,
    open: true,
    alert: true,
    unread: 1,
    userMentions: 1,
    groupMentions: 0
  });

  if (!silenced) {
    if (inviter) {
      RocketChat.models.Messages.createUserAddedWithRoomIdAndUser(rid, user, {
        ts: now,
        u: {
          _id: inviter._id,
          username: inviter.username
        }
      });
    } else {
      RocketChat.models.Messages.createUserJoinWithRoomIdAndUser(rid, user, {
        ts: now
      });
    }
  }

  if (room.t === 'c' || room.t === 'p') {
    Meteor.defer(function () {
      RocketChat.callbacks.run('afterJoinRoom', user, room);
    });
  }

  return true;
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"archiveRoom.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/server/functions/archiveRoom.js                                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.archiveRoom = function (rid) {
  RocketChat.models.Rooms.archiveById(rid);
  RocketChat.models.Subscriptions.archiveByRoomId(rid);
  RocketChat.callbacks.run('afterRoomArchived', RocketChat.models.Rooms.findOneById(rid), Meteor.user());
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"checkUsernameAvailability.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/server/functions/checkUsernameAvailability.js                                               //
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

RocketChat.checkUsernameAvailability = function (username) {
  return RocketChat.settings.get('Accounts_BlockedUsernameList', function (key, value) {
    const usernameBlackList = _.map(value.split(','), function (username) {
      return username.trim();
    });

    if (usernameBlackList.length !== 0) {
      if (usernameBlackList.every(restrictedUsername => {
        const regex = new RegExp(`^${s.escapeRegExp(restrictedUsername)}$`, 'i');
        return !regex.test(s.trim(s.escapeRegExp(username)));
      })) {
        return !Meteor.users.findOne({
          username: {
            $regex: new RegExp(`^${s.trim(s.escapeRegExp(username))}$`, 'i')
          }
        });
      }

      return false;
    }
  });
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"checkEmailAvailability.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/server/functions/checkEmailAvailability.js                                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let s;
module.watch(require("underscore.string"), {
  default(v) {
    s = v;
  }

}, 0);

RocketChat.checkEmailAvailability = function (email) {
  return !Meteor.users.findOne({
    'emails.address': {
      $regex: new RegExp(`^${s.trim(s.escapeRegExp(email))}$`, 'i')
    }
  });
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"createRoom.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/server/functions/createRoom.js                                                              //
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

RocketChat.createRoom = function (type, name, owner, members, readOnly, extraData = {}) {
  name = s.trim(name);
  owner = s.trim(owner);
  members = [].concat(members);

  if (!name) {
    throw new Meteor.Error('error-invalid-name', 'Invalid name', {
      function: 'RocketChat.createRoom'
    });
  }

  owner = RocketChat.models.Users.findOneByUsername(owner, {
    fields: {
      username: 1
    }
  });

  if (!owner) {
    throw new Meteor.Error('error-invalid-user', 'Invalid user', {
      function: 'RocketChat.createRoom'
    });
  }

  if (!_.contains(members, owner.username)) {
    members.push(owner.username);
  }

  if (extraData.broadcast) {
    readOnly = true;
    delete extraData.reactWhenReadOnly;
  }

  const now = new Date();
  let room = Object.assign({
    name: RocketChat.getValidRoomName(name),
    fname: name,
    t: type,
    msgs: 0,
    usernames: members,
    u: {
      _id: owner._id,
      username: owner.username
    }
  }, extraData, {
    ts: now,
    ro: readOnly === true,
    sysMes: readOnly !== true
  });

  if (Apps && Apps.isLoaded()) {
    const prevent = Promise.await(Apps.getBridges().getListenerBridge().roomEvent('IPreRoomCreatePrevent', room));

    if (prevent) {
      throw new Meteor.Error('error-app-prevented-creation', 'A Rocket.Chat App prevented the room creation.');
    }

    let result;
    result = Promise.await(Apps.getBridges().getListenerBridge().roomEvent('IPreRoomCreateExtend', room));
    result = Promise.await(Apps.getBridges().getListenerBridge().roomEvent('IPreRoomCreateModify', result));

    if (typeof result === 'object') {
      room = Object.assign(room, result);
    }
  }

  if (type === 'c') {
    RocketChat.callbacks.run('beforeCreateChannel', owner, room);
  }

  room = RocketChat.models.Rooms.createWithFullRoomData(room);

  for (const username of members) {
    const member = RocketChat.models.Users.findOneByUsername(username, {
      fields: {
        username: 1
      }
    });

    if (!member) {
      continue;
    } // make all room members muted by default, unless they have the post-readonly permission


    if (readOnly === true && !RocketChat.authz.hasPermission(member._id, 'post-readonly')) {
      RocketChat.models.Rooms.muteUsernameByRoomId(room._id, username);
    }

    const extra = {
      open: true
    };

    if (username === owner.username) {
      extra.ls = now;
    }

    RocketChat.models.Subscriptions.createWithRoomAndUser(room, member, extra);
  }

  RocketChat.authz.addUserRoles(owner._id, ['owner'], room._id);

  if (type === 'c') {
    Meteor.defer(() => {
      RocketChat.callbacks.run('afterCreateChannel', owner, room);
    });
  } else if (type === 'p') {
    Meteor.defer(() => {
      RocketChat.callbacks.run('afterCreatePrivateGroup', owner, room);
    });
  }

  if (Apps && Apps.isLoaded()) {
    // This returns a promise, but it won't mutate anything about the message
    // so, we don't really care if it is successful or fails
    Apps.getBridges().getListenerBridge().roomEvent('IPostRoomCreate', room);
  }

  return {
    rid: room._id,
    name: room.name
  };
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"deleteMessage.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/server/functions/deleteMessage.js                                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/* globals FileUpload */
RocketChat.deleteMessage = function (message, user) {
  const keepHistory = RocketChat.settings.get('Message_KeepHistory');
  const showDeletedStatus = RocketChat.settings.get('Message_ShowDeletedStatus');
  let deletedMsg;

  if (keepHistory) {
    if (showDeletedStatus) {
      RocketChat.models.Messages.cloneAndSaveAsHistoryById(message._id);
    } else {
      RocketChat.models.Messages.setHiddenById(message._id, true);
    }

    if (message.file && message.file._id) {
      RocketChat.models.Uploads.update(message.file._id, {
        $set: {
          _hidden: true
        }
      });
    }
  } else {
    if (!showDeletedStatus) {
      deletedMsg = RocketChat.models.Messages.findOneById(message._id);
      RocketChat.models.Messages.removeById(message._id);
    }

    if (message.file && message.file._id) {
      FileUpload.getStore('Uploads').deleteById(message.file._id);
    }
  }

  Meteor.defer(function () {
    RocketChat.callbacks.run('afterDeleteMessage', deletedMsg || {
      _id: message._id
    });
  }); // update last message

  if (RocketChat.settings.get('Store_Last_Message')) {
    const room = RocketChat.models.Rooms.findOneById(message.rid, {
      fields: {
        lastMessage: 1
      }
    });

    if (!room.lastMessage || room.lastMessage._id === message._id) {
      const lastMessage = RocketChat.models.Messages.getLastVisibleMessageSentWithNoTypeByRoomId(message.rid, message._id);
      RocketChat.models.Rooms.setLastMessageById(message.rid, lastMessage);
    }
  }

  if (showDeletedStatus) {
    RocketChat.models.Messages.setAsDeletedByIdAndUser(message._id, user);
  } else {
    RocketChat.Notifications.notifyRoom(message.rid, 'deleteMessage', {
      _id: message._id
    });
  }
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"deleteUser.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/server/functions/deleteUser.js                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.deleteUser = function (userId) {
  const user = RocketChat.models.Users.findOneById(userId); // Users without username can't do anything, so there is nothing to remove

  if (user.username != null) {
    const messageErasureType = RocketChat.settings.get('Message_ErasureType');

    switch (messageErasureType) {
      case 'Delete':
        RocketChat.models.Messages.removeByUserId(userId);
        break;

      case 'Unlink':
        const rocketCat = RocketChat.models.Users.findById('rocket.cat').fetch()[0];

        const nameAlias = TAPi18n.__('Removed_User');

        RocketChat.models.Messages.unlinkUserId(userId, rocketCat._id, rocketCat.username, nameAlias);
        break;
    }

    RocketChat.models.Subscriptions.db.findByUserId(userId).forEach(subscription => {
      const room = RocketChat.models.Rooms.findOneById(subscription.rid);

      if (room) {
        if (room.t !== 'c' && room.usernames.length === 1) {
          RocketChat.models.Rooms.removeById(subscription.rid); // Remove non-channel rooms with only 1 user (the one being deleted)
        }

        if (room.t === 'd') {
          RocketChat.models.Subscriptions.removeByRoomId(subscription.rid);
          RocketChat.models.Messages.removeByRoomId(subscription.rid);
        }
      }
    });
    RocketChat.models.Subscriptions.removeByUserId(userId); // Remove user subscriptions

    RocketChat.models.Rooms.removeByTypeContainingUsername('d', user.username); // Remove direct rooms with the user

    RocketChat.models.Rooms.removeUsernameFromAll(user.username); // Remove user from all other rooms
    // removes user's avatar

    if (user.avatarOrigin === 'upload' || user.avatarOrigin === 'url') {
      FileUpload.getStore('Avatars').deleteByName(user.username);
    }

    RocketChat.models.Integrations.disableByUserId(userId); // Disables all the integrations which rely on the user being deleted.
  }

  RocketChat.models.Users.removeById(userId); // Remove user from users database
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"getFullUserData.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/server/functions/getFullUserData.js                                                         //
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

RocketChat.getFullUserData = function ({
  userId,
  filter,
  limit
}) {
  let fields = {
    name: 1,
    username: 1,
    status: 1,
    utcOffset: 1,
    type: 1,
    active: 1,
    reason: 1
  };

  if (RocketChat.authz.hasPermission(userId, 'view-full-other-user-info')) {
    fields = _.extend(fields, {
      emails: 1,
      phone: 1,
      statusConnection: 1,
      createdAt: 1,
      lastLogin: 1,
      services: 1,
      requirePasswordChange: 1,
      requirePasswordChangeReason: 1,
      roles: 1,
      customFields: 1
    });
  } else if (limit !== 0) {
    limit = 1;
  }

  filter = s.trim(filter);

  if (!filter && limit === 1) {
    return undefined;
  }

  const options = {
    fields,
    limit,
    sort: {
      username: 1
    }
  };

  if (filter) {
    if (limit === 1) {
      return RocketChat.models.Users.findByUsername(filter, options);
    } else {
      const filterReg = new RegExp(s.escapeRegExp(filter), 'i');
      return RocketChat.models.Users.findByUsernameNameOrEmailAddress(filterReg, options);
    }
  }

  return RocketChat.models.Users.find({}, options);
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"getRoomByNameOrIdWithOptionToJoin.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/server/functions/getRoomByNameOrIdWithOptionToJoin.js                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);

RocketChat.getRoomByNameOrIdWithOptionToJoin = function _getRoomByNameOrIdWithOptionToJoin({
  currentUserId,
  nameOrId,
  type = '',
  tryDirectByUserIdOnly = false,
  joinChannel = true,
  errorOnEmpty = true
}) {
  let room; //If the nameOrId starts with #, then let's try to find a channel or group

  if (nameOrId.startsWith('#')) {
    nameOrId = nameOrId.substring(1);
    room = RocketChat.models.Rooms.findOneByIdOrName(nameOrId);
  } else if (nameOrId.startsWith('@') || type === 'd') {
    //If the nameOrId starts with @ OR type is 'd', then let's try just a direct message
    nameOrId = nameOrId.replace('@', '');
    let roomUser;

    if (tryDirectByUserIdOnly) {
      roomUser = RocketChat.models.Users.findOneById(nameOrId);
    } else {
      roomUser = RocketChat.models.Users.findOne({
        $or: [{
          _id: nameOrId
        }, {
          username: nameOrId
        }]
      });
    }

    const rid = _.isObject(roomUser) ? [currentUserId, roomUser._id].sort().join('') : nameOrId;
    room = RocketChat.models.Rooms.findOneById(rid); //If the room hasn't been found yet, let's try some more

    if (!_.isObject(room)) {
      //If the roomUser wasn't found, then there's no destination to point towards
      //so return out based upon errorOnEmpty
      if (!_.isObject(roomUser)) {
        if (errorOnEmpty) {
          throw new Meteor.Error('invalid-channel');
        } else {
          return;
        }
      }

      room = Meteor.runAsUser(currentUserId, function () {
        const {
          rid
        } = Meteor.call('createDirectMessage', roomUser.username);
        return RocketChat.models.Rooms.findOneById(rid);
      });
    }
  } else {
    //Otherwise, we'll treat this as a channel or group.
    room = RocketChat.models.Rooms.findOneByIdOrName(nameOrId);
  } //If no room was found, handle the room return based upon errorOnEmpty


  if (!room && errorOnEmpty) {
    throw new Meteor.Error('invalid-channel');
  } else if (!room) {
    return;
  } //If a room was found and they provided a type to search, then check
  //and if the type found isn't what we're looking for then handle
  //the return based upon errorOnEmpty


  if (type && room.t !== type) {
    if (errorOnEmpty) {
      throw new Meteor.Error('invalid-channel');
    } else {
      return;
    }
  } //If the room type is channel and joinChannel has been passed, try to join them
  //if they can't join the room, this will error out!


  if (room.t === 'c' && joinChannel) {
    const sub = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(room._id, currentUserId);

    if (!sub) {
      Meteor.runAsUser(currentUserId, function () {
        return Meteor.call('joinRoom', room._id);
      });
    }
  }

  return room;
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"loadMessageHistory.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/server/functions/loadMessageHistory.js                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
const hideMessagesOfType = [];
RocketChat.settings.get(/Message_HideType_.+/, function (key, value) {
  const type = key.replace('Message_HideType_', '');
  const types = type === 'mute_unmute' ? ['user-muted', 'user-unmuted'] : [type];
  return types.forEach(type => {
    const index = hideMessagesOfType.indexOf(type);

    if (value === true && index === -1) {
      return hideMessagesOfType.push(type);
    }

    if (index > -1) {
      return hideMessagesOfType.splice(index, 1);
    }
  });
});

RocketChat.loadMessageHistory = function loadMessageHistory({
  userId,
  rid,
  end,
  limit = 20,
  ls
}) {
  const options = {
    sort: {
      ts: -1
    },
    limit
  };

  if (!RocketChat.settings.get('Message_ShowEditedStatus')) {
    options.fields = {
      editedAt: 0
    };
  }

  let records;

  if (end != null) {
    records = RocketChat.models.Messages.findVisibleByRoomIdBeforeTimestampNotContainingTypes(rid, end, hideMessagesOfType, options).fetch();
  } else {
    records = RocketChat.models.Messages.findVisibleByRoomIdNotContainingTypes(rid, hideMessagesOfType, options).fetch();
  }

  const UI_Use_Real_Name = RocketChat.settings.get('UI_Use_Real_Name') === true;
  const messages = records.map(message => {
    message.starred = _.findWhere(message.starred, {
      _id: userId
    });

    if (message.u && message.u._id && UI_Use_Real_Name) {
      const user = RocketChat.models.Users.findOneById(message.u._id);
      message.u.name = user && user.name;
    }

    if (message.mentions && message.mentions.length && UI_Use_Real_Name) {
      message.mentions.forEach(mention => {
        const user = RocketChat.models.Users.findOneById(mention._id);
        mention.name = user && user.name;
      });
    }

    return message;
  });
  let unreadNotLoaded = 0;
  let firstUnread;

  if (ls != null) {
    const firstMessage = messages[messages.length - 1];

    if ((firstMessage != null ? firstMessage.ts : undefined) > ls) {
      delete options.limit;
      const unreadMessages = RocketChat.models.Messages.findVisibleByRoomIdBetweenTimestampsNotContainingTypes(rid, ls, firstMessage.ts, hideMessagesOfType, {
        limit: 1,
        sort: {
          ts: 1
        }
      });
      firstUnread = unreadMessages.fetch()[0];
      unreadNotLoaded = unreadMessages.count();
    }
  }

  return {
    messages,
    firstUnread,
    unreadNotLoaded
  };
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"removeUserFromRoom.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/server/functions/removeUserFromRoom.js                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.removeUserFromRoom = function (rid, user) {
  const room = RocketChat.models.Rooms.findOneById(rid);

  if (room) {
    RocketChat.callbacks.run('beforeLeaveRoom', user, room);
    RocketChat.models.Rooms.removeUsernameById(rid, user.username);

    if (room.usernames.indexOf(user.username) !== -1) {
      const removedUser = user;
      RocketChat.models.Messages.createUserLeaveWithRoomIdAndUser(rid, removedUser);
    }

    if (room.t === 'l') {
      RocketChat.models.Messages.createCommandWithRoomIdAndUser('survey', rid, user);
    }

    RocketChat.models.Subscriptions.removeByRoomIdAndUserId(rid, user._id);
    Meteor.defer(function () {
      RocketChat.callbacks.run('afterLeaveRoom', user, room);
    });
  }
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"saveUser.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/server/functions/saveUser.js                                                                //
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

RocketChat.saveUser = function (userId, userData) {
  const user = RocketChat.models.Users.findOneById(userId);

  const existingRoles = _.pluck(RocketChat.authz.getRoles(), '_id');

  if (userData._id && userId !== userData._id && !RocketChat.authz.hasPermission(userId, 'edit-other-user-info')) {
    throw new Meteor.Error('error-action-not-allowed', 'Editing user is not allowed', {
      method: 'insertOrUpdateUser',
      action: 'Editing_user'
    });
  }

  if (!userData._id && !RocketChat.authz.hasPermission(userId, 'create-user')) {
    throw new Meteor.Error('error-action-not-allowed', 'Adding user is not allowed', {
      method: 'insertOrUpdateUser',
      action: 'Adding_user'
    });
  }

  if (userData.roles && _.difference(userData.roles, existingRoles).length > 0) {
    throw new Meteor.Error('error-action-not-allowed', 'The field Roles consist invalid role name', {
      method: 'insertOrUpdateUser',
      action: 'Assign_role'
    });
  }

  if (userData.roles && _.indexOf(userData.roles, 'admin') >= 0 && !RocketChat.authz.hasPermission(userId, 'assign-admin-role')) {
    throw new Meteor.Error('error-action-not-allowed', 'Assigning admin is not allowed', {
      method: 'insertOrUpdateUser',
      action: 'Assign_admin'
    });
  }

  if (!userData._id && !s.trim(userData.name)) {
    throw new Meteor.Error('error-the-field-is-required', 'The field Name is required', {
      method: 'insertOrUpdateUser',
      field: 'Name'
    });
  }

  if (!userData._id && !s.trim(userData.username)) {
    throw new Meteor.Error('error-the-field-is-required', 'The field Username is required', {
      method: 'insertOrUpdateUser',
      field: 'Username'
    });
  }

  let nameValidation;

  try {
    nameValidation = new RegExp(`^${RocketChat.settings.get('UTF8_Names_Validation')}$`);
  } catch (e) {
    nameValidation = new RegExp('^[0-9a-zA-Z-_.]+$');
  }

  if (userData.username && !nameValidation.test(userData.username)) {
    throw new Meteor.Error('error-input-is-not-a-valid-field', `${_.escape(userData.username)} is not a valid username`, {
      method: 'insertOrUpdateUser',
      input: userData.username,
      field: 'Username'
    });
  }

  if (!userData._id && !userData.password) {
    throw new Meteor.Error('error-the-field-is-required', 'The field Password is required', {
      method: 'insertOrUpdateUser',
      field: 'Password'
    });
  }

  if (!userData._id) {
    if (!RocketChat.checkUsernameAvailability(userData.username)) {
      throw new Meteor.Error('error-field-unavailable', `${_.escape(userData.username)} is already in use :(`, {
        method: 'insertOrUpdateUser',
        field: userData.username
      });
    }

    if (userData.email && !RocketChat.checkEmailAvailability(userData.email)) {
      throw new Meteor.Error('error-field-unavailable', `${_.escape(userData.email)} is already in use :(`, {
        method: 'insertOrUpdateUser',
        field: userData.email
      });
    }

    RocketChat.validateEmailDomain(userData.email); // insert user

    const createUser = {
      username: userData.username,
      password: userData.password,
      joinDefaultChannels: userData.joinDefaultChannels
    };

    if (userData.email) {
      createUser.email = userData.email;
    }

    const _id = Accounts.createUser(createUser);

    const updateUser = {
      $set: {
        name: userData.name,
        roles: userData.roles || ['user'],
        settings: userData.settings || {}
      }
    };

    if (typeof userData.requirePasswordChange !== 'undefined') {
      updateUser.$set.requirePasswordChange = userData.requirePasswordChange;
    }

    if (typeof userData.verified === 'boolean') {
      updateUser.$set['emails.0.verified'] = userData.verified;
    }

    Meteor.users.update({
      _id
    }, updateUser);

    if (userData.sendWelcomeEmail) {
      const header = RocketChat.placeholders.replace(RocketChat.settings.get('Email_Header') || '');
      const footer = RocketChat.placeholders.replace(RocketChat.settings.get('Email_Footer') || '');
      let subject;
      let html;

      if (RocketChat.settings.get('Accounts_UserAddedEmail_Customized')) {
        subject = RocketChat.settings.get('Accounts_UserAddedEmailSubject');
        html = RocketChat.settings.get('Accounts_UserAddedEmail');
      } else {
        subject = TAPi18n.__('Accounts_UserAddedEmailSubject_Default', {
          lng: user.language || RocketChat.settings.get('language') || 'en'
        });
        html = TAPi18n.__('Accounts_UserAddedEmail_Default', {
          lng: user.language || RocketChat.settings.get('language') || 'en'
        });
      }

      subject = RocketChat.placeholders.replace(subject);
      html = RocketChat.placeholders.replace(html, {
        name: userData.name,
        email: userData.email,
        password: userData.password
      });
      const email = {
        to: userData.email,
        from: RocketChat.settings.get('From_Email'),
        subject,
        html: header + html + footer
      };
      Meteor.defer(function () {
        try {
          Email.send(email);
        } catch (error) {
          throw new Meteor.Error('error-email-send-failed', `Error trying to send email: ${error.message}`, {
            function: 'RocketChat.saveUser',
            message: error.message
          });
        }
      });
    }

    userData._id = _id;

    if (RocketChat.settings.get('Accounts_SetDefaultAvatar') === true && userData.email) {
      const gravatarUrl = Gravatar.imageUrl(userData.email, {
        default: '404',
        size: 200,
        secure: true
      });

      try {
        RocketChat.setUserAvatar(userData, gravatarUrl, '', 'url');
      } catch (e) {//Ignore this error for now, as it not being successful isn't bad
      }
    }

    return _id;
  } else {
    // update user
    if (userData.username) {
      RocketChat.setUsername(userData._id, userData.username);
    }

    if (userData.name) {
      RocketChat.setRealName(userData._id, userData.name);
    }

    if (userData.email) {
      const shouldSendVerificationEmailToUser = userData.verified !== true;
      RocketChat.setEmail(userData._id, userData.email, shouldSendVerificationEmailToUser);
    }

    if (userData.password && userData.password.trim() && RocketChat.authz.hasPermission(userId, 'edit-other-user-password')) {
      Accounts.setPassword(userData._id, userData.password.trim());
    }

    const updateUser = {
      $set: {}
    };

    if (userData.roles) {
      updateUser.$set.roles = userData.roles;
    }

    if (userData.settings) {
      updateUser.$set.settings = {
        preferences: userData.settings.preferences
      };
    }

    if (typeof userData.requirePasswordChange !== 'undefined') {
      updateUser.$set.requirePasswordChange = userData.requirePasswordChange;
    }

    if (typeof userData.verified === 'boolean') {
      updateUser.$set['emails.0.verified'] = userData.verified;
    }

    Meteor.users.update({
      _id: userData._id
    }, updateUser);
    return true;
  }
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"saveCustomFields.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/server/functions/saveCustomFields.js                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let s;
module.watch(require("underscore.string"), {
  default(v) {
    s = v;
  }

}, 0);

RocketChat.saveCustomFields = function (userId, formData) {
  if (s.trim(RocketChat.settings.get('Accounts_CustomFields')) !== '') {
    RocketChat.validateCustomFields(formData);
    return RocketChat.saveCustomFieldsWithoutValidation(userId, formData);
  }
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"saveCustomFieldsWithoutValidation.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/server/functions/saveCustomFieldsWithoutValidation.js                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let s;
module.watch(require("underscore.string"), {
  default(v) {
    s = v;
  }

}, 0);

RocketChat.saveCustomFieldsWithoutValidation = function (userId, formData) {
  if (s.trim(RocketChat.settings.get('Accounts_CustomFields')) !== '') {
    let customFieldsMeta;

    try {
      customFieldsMeta = JSON.parse(RocketChat.settings.get('Accounts_CustomFields'));
    } catch (e) {
      throw new Meteor.Error('error-invalid-customfield-json', 'Invalid JSON for Custom Fields');
    }

    const customFields = {};
    Object.keys(customFieldsMeta).forEach(key => customFields[key] = formData[key]);
    RocketChat.models.Users.setCustomFields(userId, customFields); // Update customFields of all Direct Messages' Rooms for userId

    RocketChat.models.Subscriptions.setCustomFieldsDirectMessagesByUserId(userId, customFields);
    Object.keys(customFields).forEach(fieldName => {
      if (!customFieldsMeta[fieldName].modifyRecordField) {
        return;
      }

      const modifyRecordField = customFieldsMeta[fieldName].modifyRecordField;
      const update = {};

      if (modifyRecordField.array) {
        update.$addToSet = {};
        update.$addToSet[modifyRecordField.field] = customFields[fieldName];
      } else {
        update.$set = {};
        update.$set[modifyRecordField.field] = customFields[fieldName];
      }

      RocketChat.models.Users.update(userId, update);
    });
  }
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"sendMessage.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/server/functions/sendMessage.js                                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
const objectMaybeIncluding = types => {
  return Match.Where(value => {
    Object.keys(types).forEach(field => {
      if (value[field] != null) {
        try {
          check(value[field], types[field]);
        } catch (error) {
          error.path = field;
          throw error;
        }
      }
    });
    return true;
  });
};

const validateAttachmentsFields = attachmentFields => {
  check(attachmentFields, objectMaybeIncluding({
    short: Boolean
  }));
  check(attachmentFields, Match.ObjectIncluding({
    title: String,
    value: String
  }));
};

const validateAttachment = attachment => {
  check(attachment, objectMaybeIncluding({
    color: String,
    text: String,
    ts: String,
    thumb_url: String,
    message_link: String,
    collapsed: Boolean,
    author_name: String,
    author_link: String,
    author_icon: String,
    title: String,
    title_link: String,
    title_link_download: Boolean,
    image_url: String,
    audio_url: String,
    video_url: String,
    fields: [Match.Any]
  }));

  if (attachment.fields && attachment.fields.length) {
    attachment.fields.map(validateAttachmentsFields);
  }
};

const validateBodyAttachments = attachments => attachments.map(validateAttachment);

RocketChat.sendMessage = function (user, message, room, upsert = false) {
  if (!user || !message || !room._id) {
    return false;
  }

  check(message, objectMaybeIncluding({
    _id: String,
    msg: String,
    text: String,
    alias: String,
    emoji: String,
    avatar: String,
    attachments: [Match.Any]
  }));

  if (Array.isArray(message.attachments) && message.attachments.length) {
    validateBodyAttachments(message.attachments);
  }

  if (!message.ts) {
    message.ts = new Date();
  }

  const {
    _id,
    username,
    name
  } = user;
  message.u = {
    _id,
    username,
    name
  };
  message.rid = room._id;

  if (!Match.test(message.msg, String)) {
    message.msg = '';
  }

  if (message.ts == null) {
    message.ts = new Date();
  }

  if (!room.usernames || room.usernames.length === 0) {
    const updated_room = RocketChat.models.Rooms.findOneById(room._id);

    if (updated_room) {
      room = updated_room;
    } else {
      room.usernames = [];
    }
  }

  if (RocketChat.settings.get('Message_Read_Receipt_Enabled')) {
    message.unread = true;
  } // For the Rocket.Chat Apps :)


  if (message && Apps && Apps.isLoaded()) {
    const prevent = Promise.await(Apps.getBridges().getListenerBridge().messageEvent('IPreMessageSentPrevent', message));

    if (prevent) {
      throw new Meteor.Error('error-app-prevented-sending', 'A Rocket.Chat App prevented the messaging sending.');
    }

    let result;
    result = Promise.await(Apps.getBridges().getListenerBridge().messageEvent('IPreMessageSentExtend', message));
    result = Promise.await(Apps.getBridges().getListenerBridge().messageEvent('IPreMessageSentModify', result));

    if (typeof result === 'object') {
      message = Object.assign(message, result);
    }
  }

  if (message.parseUrls !== false) {
    const urlRegex = /([A-Za-z]{3,9}):\/\/([-;:&=\+\$,\w]+@{1})?([-A-Za-z0-9\.]+)+:?(\d+)?((\/[-\+=!:~%\/\.@\,\(\)\w]*)?\??([-\+=&!:;%@\/\.\,\w]+)?(?:#([^\s\)]+))?)?/g;
    const urls = message.msg.match(urlRegex);

    if (urls) {
      // ignoredUrls contain blocks of quotes with urls inside
      const ignoredUrls = message.msg.match(/(?:(?:\`{1,3})(?:[\n\r]*?.*?)*?)(([A-Za-z]{3,9}):\/\/([-;:&=\+\$,\w]+@{1})?([-A-Za-z0-9\.]+)+:?(\d+)?((\/[-\+=!:~%\/\.@\,\(\)\w]*)?\??([-\+=&!:;%@\/\.\,\w]+)?(?:#([^\s\)]+))?)?)(?:(?:[\n\r]*.*?)*?(?:\`{1,3}))/gm);

      if (ignoredUrls) {
        ignoredUrls.forEach(url => {
          const shouldBeIgnored = url.match(urlRegex);

          if (shouldBeIgnored) {
            shouldBeIgnored.forEach(match => {
              const matchIndex = urls.indexOf(match);
              urls.splice(matchIndex, 1);
            });
          }
        });
      }

      if (urls) {
        // use the Set to remove duplicity, so it doesn't embed the same link twice
        message.urls = [...new Set(urls)].map(function (url) {
          return {
            url
          };
        });
      }
    }
  }

  message = RocketChat.callbacks.run('beforeSaveMessage', message);

  if (message) {
    // Avoid saving sandstormSessionId to the database
    let sandstormSessionId = null;

    if (message.sandstormSessionId) {
      sandstormSessionId = message.sandstormSessionId;
      delete message.sandstormSessionId;
    }

    if (message._id && upsert) {
      const _id = message._id;
      delete message._id;
      RocketChat.models.Messages.upsert({
        _id,
        'u._id': message.u._id
      }, message);
      message._id = _id;
    } else {
      message._id = RocketChat.models.Messages.insert(message);
    }

    if (Apps && Apps.isLoaded()) {
      // This returns a promise, but it won't mutate anything about the message
      // so, we don't really care if it is successful or fails
      Apps.getBridges().getListenerBridge().messageEvent('IPostMessageSent', message);
    }
    /*
    Defer other updates as their return is not interesting to the user
    */


    Meteor.defer(() => {
      // Execute all callbacks
      message.sandstormSessionId = sandstormSessionId;
      return RocketChat.callbacks.run('afterSaveMessage', message, room, user._id);
    });
    return message;
  }
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"settings.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/server/functions/settings.js                                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
const blockedSettings = {};

if (process.env.SETTINGS_BLOCKED) {
  process.env.SETTINGS_BLOCKED.split(',').forEach(settingId => blockedSettings[settingId] = 1);
}

const hiddenSettings = {};

if (process.env.SETTINGS_HIDDEN) {
  process.env.SETTINGS_HIDDEN.split(',').forEach(settingId => hiddenSettings[settingId] = 1);
}

RocketChat.settings._sorter = {};
/*
* Add a setting
* @param {String} _id
* @param {Mixed} value
* @param {Object} setting
*/

RocketChat.settings.add = function (_id, value, options = {}) {
  if (options == null) {
    options = {};
  }

  if (!_id || value == null) {
    return false;
  }

  if (RocketChat.settings._sorter[options.group] == null) {
    RocketChat.settings._sorter[options.group] = 0;
  }

  options.packageValue = value;
  options.valueSource = 'packageValue';
  options.hidden = options.hidden || false;
  options.blocked = options.blocked || false;

  if (options.sorter == null) {
    options.sorter = RocketChat.settings._sorter[options.group]++;
  }

  if (options.enableQuery != null) {
    options.enableQuery = JSON.stringify(options.enableQuery);
  }

  if (options.i18nDefaultQuery != null) {
    options.i18nDefaultQuery = JSON.stringify(options.i18nDefaultQuery);
  }

  if (typeof process !== 'undefined' && process.env && process.env[_id]) {
    value = process.env[_id];

    if (value.toLowerCase() === 'true') {
      value = true;
    } else if (value.toLowerCase() === 'false') {
      value = false;
    }

    options.processEnvValue = value;
    options.valueSource = 'processEnvValue';
  } else if (Meteor.settings && typeof Meteor.settings[_id] !== 'undefined') {
    if (Meteor.settings[_id] == null) {
      return false;
    }

    value = Meteor.settings[_id];
    options.meteorSettingsValue = value;
    options.valueSource = 'meteorSettingsValue';
  }

  if (options.i18nLabel == null) {
    options.i18nLabel = _id;
  }

  if (options.i18nDescription == null) {
    options.i18nDescription = `${_id}_Description`;
  }

  if (blockedSettings[_id] != null) {
    options.blocked = true;
  }

  if (hiddenSettings[_id] != null) {
    options.hidden = true;
  }

  if (options.autocomplete == null) {
    options.autocomplete = true;
  }

  if (typeof process !== 'undefined' && process.env && process.env[`OVERWRITE_SETTING_${_id}`]) {
    let value = process.env[`OVERWRITE_SETTING_${_id}`];

    if (value.toLowerCase() === 'true') {
      value = true;
    } else if (value.toLowerCase() === 'false') {
      value = false;
    }

    options.value = value;
    options.processEnvValue = value;
    options.valueSource = 'processEnvValue';
  }

  const updateOperations = {
    $set: options,
    $setOnInsert: {
      createdAt: new Date()
    }
  };

  if (options.editor != null) {
    updateOperations.$setOnInsert.editor = options.editor;
    delete options.editor;
  }

  if (options.value == null) {
    if (options.force === true) {
      updateOperations.$set.value = options.packageValue;
    } else {
      updateOperations.$setOnInsert.value = value;
    }
  }

  const query = _.extend({
    _id
  }, updateOperations.$set);

  if (options.section == null) {
    updateOperations.$unset = {
      section: 1
    };
    query.section = {
      $exists: false
    };
  }

  const existantSetting = RocketChat.models.Settings.db.findOne(query);

  if (existantSetting != null) {
    if (existantSetting.editor == null && updateOperations.$setOnInsert.editor != null) {
      updateOperations.$set.editor = updateOperations.$setOnInsert.editor;
      delete updateOperations.$setOnInsert.editor;
    }
  } else {
    updateOperations.$set.ts = new Date();
  }

  return RocketChat.models.Settings.upsert({
    _id
  }, updateOperations);
};
/*
* Add a setting group
* @param {String} _id
*/


RocketChat.settings.addGroup = function (_id, options = {}, cb) {
  if (!_id) {
    return false;
  }

  if (_.isFunction(options)) {
    cb = options;
    options = {};
  }

  if (options.i18nLabel == null) {
    options.i18nLabel = _id;
  }

  if (options.i18nDescription == null) {
    options.i18nDescription = `${_id}_Description`;
  }

  options.ts = new Date();
  options.blocked = false;
  options.hidden = false;

  if (blockedSettings[_id] != null) {
    options.blocked = true;
  }

  if (hiddenSettings[_id] != null) {
    options.hidden = true;
  }

  RocketChat.models.Settings.upsert({
    _id
  }, {
    $set: options,
    $setOnInsert: {
      type: 'group',
      createdAt: new Date()
    }
  });

  if (cb != null) {
    cb.call({
      add(id, value, options) {
        if (options == null) {
          options = {};
        }

        options.group = _id;
        return RocketChat.settings.add(id, value, options);
      },

      section(section, cb) {
        return cb.call({
          add(id, value, options) {
            if (options == null) {
              options = {};
            }

            options.group = _id;
            options.section = section;
            return RocketChat.settings.add(id, value, options);
          }

        });
      }

    });
  }
};
/*
* Remove a setting by id
* @param {String} _id
*/


RocketChat.settings.removeById = function (_id) {
  if (!_id) {
    return false;
  }

  return RocketChat.models.Settings.removeById(_id);
};
/*
* Update a setting by id
* @param {String} _id
*/


RocketChat.settings.updateById = function (_id, value, editor) {
  if (!_id || value == null) {
    return false;
  }

  if (editor != null) {
    return RocketChat.models.Settings.updateValueAndEditorById(_id, value, editor);
  }

  return RocketChat.models.Settings.updateValueById(_id, value);
};
/*
* Update options of a setting by id
* @param {String} _id
*/


RocketChat.settings.updateOptionsById = function (_id, options) {
  if (!_id || options == null) {
    return false;
  }

  return RocketChat.models.Settings.updateOptionsById(_id, options);
};
/*
* Update a setting by id
* @param {String} _id
*/


RocketChat.settings.clearById = function (_id) {
  if (_id == null) {
    return false;
  }

  return RocketChat.models.Settings.updateValueById(_id, undefined);
};
/*
* Update a setting by id
*/


RocketChat.settings.init = function () {
  RocketChat.settings.initialLoad = true;
  RocketChat.models.Settings.find().observe({
    added(record) {
      Meteor.settings[record._id] = record.value;

      if (record.env === true) {
        process.env[record._id] = record.value;
      }

      return RocketChat.settings.load(record._id, record.value, RocketChat.settings.initialLoad);
    },

    changed(record) {
      Meteor.settings[record._id] = record.value;

      if (record.env === true) {
        process.env[record._id] = record.value;
      }

      return RocketChat.settings.load(record._id, record.value, RocketChat.settings.initialLoad);
    },

    removed(record) {
      delete Meteor.settings[record._id];

      if (record.env === true) {
        delete process.env[record._id];
      }

      return RocketChat.settings.load(record._id, undefined, RocketChat.settings.initialLoad);
    }

  });
  RocketChat.settings.initialLoad = false;
  RocketChat.settings.afterInitialLoad.forEach(fn => fn(Meteor.settings));
};

RocketChat.settings.afterInitialLoad = [];

RocketChat.settings.onAfterInitialLoad = function (fn) {
  RocketChat.settings.afterInitialLoad.push(fn);

  if (RocketChat.settings.initialLoad === false) {
    return fn(Meteor.settings);
  }
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"setUserAvatar.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/server/functions/setUserAvatar.js                                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.setUserAvatar = function (user, dataURI, contentType, service) {
  let encoding;
  let image;

  if (service === 'initials') {
    return RocketChat.models.Users.setAvatarOrigin(user._id, service);
  } else if (service === 'url') {
    let result = null;

    try {
      result = HTTP.get(dataURI, {
        npmRequestOptions: {
          encoding: 'binary'
        }
      });
    } catch (error) {
      if (!error.response || error.response.statusCode !== 404) {
        console.log(`Error while handling the setting of the avatar from a url (${dataURI}) for ${user.username}:`, error);
        throw new Meteor.Error('error-avatar-url-handling', `Error while handling avatar setting from a URL (${dataURI}) for ${user.username}`, {
          function: 'RocketChat.setUserAvatar',
          url: dataURI,
          username: user.username
        });
      }
    }

    if (result.statusCode !== 200) {
      console.log(`Not a valid response, ${result.statusCode}, from the avatar url: ${dataURI}`);
      throw new Meteor.Error('error-avatar-invalid-url', `Invalid avatar URL: ${dataURI}`, {
        function: 'RocketChat.setUserAvatar',
        url: dataURI
      });
    }

    if (!/image\/.+/.test(result.headers['content-type'])) {
      console.log(`Not a valid content-type from the provided url, ${result.headers['content-type']}, from the avatar url: ${dataURI}`);
      throw new Meteor.Error('error-avatar-invalid-url', `Invalid avatar URL: ${dataURI}`, {
        function: 'RocketChat.setUserAvatar',
        url: dataURI
      });
    }

    encoding = 'binary';
    image = result.content;
    contentType = result.headers['content-type'];
  } else if (service === 'rest') {
    encoding = 'binary';
    image = dataURI;
  } else {
    const fileData = RocketChatFile.dataURIParse(dataURI);
    encoding = 'base64';
    image = fileData.image;
    contentType = fileData.contentType;
  }

  const buffer = new Buffer(image, encoding);
  const fileStore = FileUpload.getStore('Avatars');
  fileStore.deleteByName(user.username);
  const file = {
    userId: user._id,
    type: contentType,
    size: buffer.length
  };
  fileStore.insert(file, buffer, () => {
    Meteor.setTimeout(function () {
      RocketChat.models.Users.setAvatarOrigin(user._id, service);
      RocketChat.Notifications.notifyLogged('updateAvatar', {
        username: user.username
      });
    }, 500);
  });
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"setUsername.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/server/functions/setUsername.js                                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let s;
module.watch(require("underscore.string"), {
  default(v) {
    s = v;
  }

}, 0);

RocketChat._setUsername = function (userId, u) {
  const username = s.trim(u);

  if (!userId || !username) {
    return false;
  }

  let nameValidation;

  try {
    nameValidation = new RegExp(`^${RocketChat.settings.get('UTF8_Names_Validation')}$`);
  } catch (error) {
    nameValidation = new RegExp('^[0-9a-zA-Z-_.]+$');
  }

  if (!nameValidation.test(username)) {
    return false;
  }

  const user = RocketChat.models.Users.findOneById(userId); // User already has desired username, return

  if (user.username === username) {
    return user;
  }

  const previousUsername = user.username; // Check username availability or if the user already owns a different casing of the name

  if (!previousUsername || !(username.toLowerCase() === previousUsername.toLowerCase())) {
    if (!RocketChat.checkUsernameAvailability(username)) {
      return false;
    }
  } //If first time setting username, send Enrollment Email


  try {
    if (!previousUsername && user.emails && user.emails.length > 0 && RocketChat.settings.get('Accounts_Enrollment_Email')) {
      Accounts.sendEnrollmentEmail(user._id);
    }
  } catch (e) {
    console.error(e);
  }
  /* globals getAvatarSuggestionForUser */


  user.username = username;

  if (!previousUsername && RocketChat.settings.get('Accounts_SetDefaultAvatar') === true) {
    const avatarSuggestions = getAvatarSuggestionForUser(user);
    let gravatar;
    Object.keys(avatarSuggestions).some(service => {
      const avatarData = avatarSuggestions[service];

      if (service !== 'gravatar') {
        RocketChat.setUserAvatar(user, avatarData.blob, avatarData.contentType, service);
        gravatar = null;
        return true;
      } else {
        gravatar = avatarData;
      }
    });

    if (gravatar != null) {
      RocketChat.setUserAvatar(user, gravatar.blob, gravatar.contentType, 'gravatar');
    }
  } // Username is available; if coming from old username, update all references


  if (previousUsername) {
    RocketChat.models.Messages.updateAllUsernamesByUserId(user._id, username);
    RocketChat.models.Messages.updateUsernameOfEditByUserId(user._id, username);
    RocketChat.models.Messages.findByMention(previousUsername).forEach(function (msg) {
      const updatedMsg = msg.msg.replace(new RegExp(`@${previousUsername}`, 'ig'), `@${username}`);
      return RocketChat.models.Messages.updateUsernameAndMessageOfMentionByIdAndOldUsername(msg._id, previousUsername, username, updatedMsg);
    });
    RocketChat.models.Rooms.replaceUsername(previousUsername, username);
    RocketChat.models.Rooms.replaceMutedUsername(previousUsername, username);
    RocketChat.models.Rooms.replaceUsernameOfUserByUserId(user._id, username);
    RocketChat.models.Subscriptions.setUserUsernameByUserId(user._id, username);
    RocketChat.models.Subscriptions.setNameForDirectRoomsWithOldName(previousUsername, username);
    RocketChat.models.LivechatDepartmentAgents.replaceUsernameOfAgentByUserId(user._id, username);
    const fileStore = FileUpload.getStore('Avatars');
    const file = fileStore.model.findOneByName(previousUsername);

    if (file) {
      fileStore.model.updateFileNameById(file._id, username);
    }
  } // Set new username*


  RocketChat.models.Users.setUsername(user._id, username);
  return user;
};

RocketChat.setUsername = RocketChat.RateLimiter.limitFunction(RocketChat._setUsername, 1, 60000, {
  [0](userId) {
    return !userId || !RocketChat.authz.hasPermission(userId, 'edit-other-user-info');
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"setRealName.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/server/functions/setRealName.js                                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let s;
module.watch(require("underscore.string"), {
  default(v) {
    s = v;
  }

}, 0);

RocketChat._setRealName = function (userId, name) {
  name = s.trim(name);

  if (!userId || !name) {
    return false;
  }

  const user = RocketChat.models.Users.findOneById(userId); // User already has desired name, return

  if (user.name === name) {
    return user;
  } // Set new name


  RocketChat.models.Users.setName(user._id, name);
  user.name = name;

  if (RocketChat.settings.get('UI_Use_Real_Name') === true) {
    RocketChat.Notifications.notifyLogged('Users:NameChanged', {
      _id: user._id,
      name: user.name,
      username: user.username
    });
  }

  return user;
};

RocketChat.setRealName = RocketChat.RateLimiter.limitFunction(RocketChat._setRealName, 1, 60000, {
  0() {
    return !Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'edit-other-user-info');
  } // Administrators have permission to change others names, so don't limit those


});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"setEmail.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/server/functions/setEmail.js                                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let s;
module.watch(require("underscore.string"), {
  default(v) {
    s = v;
  }

}, 0);

RocketChat._setEmail = function (userId, email, shouldSendVerificationEmail = true) {
  email = s.trim(email);

  if (!userId) {
    throw new Meteor.Error('error-invalid-user', 'Invalid user', {
      function: '_setEmail'
    });
  }

  if (!email) {
    throw new Meteor.Error('error-invalid-email', 'Invalid email', {
      function: '_setEmail'
    });
  }

  RocketChat.validateEmailDomain(email);
  const user = RocketChat.models.Users.findOneById(userId); // User already has desired username, return

  if (user.emails && user.emails[0] && user.emails[0].address === email) {
    return user;
  } // Check email availability


  if (!RocketChat.checkEmailAvailability(email)) {
    throw new Meteor.Error('error-field-unavailable', `${email} is already in use :(`, {
      function: '_setEmail',
      field: email
    });
  } // Set new email


  RocketChat.models.Users.setEmail(user._id, email);
  user.email = email;

  if (shouldSendVerificationEmail === true) {
    Meteor.call('sendConfirmationEmail', user.email);
  }

  return user;
};

RocketChat.setEmail = RocketChat.RateLimiter.limitFunction(RocketChat._setEmail, 1, 60000, {
  0() {
    return !Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'edit-other-user-info');
  } // Administrators have permission to change others emails, so don't limit those


});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"unarchiveRoom.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/server/functions/unarchiveRoom.js                                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.unarchiveRoom = function (rid) {
  RocketChat.models.Rooms.unarchiveById(rid);
  RocketChat.models.Subscriptions.unarchiveByRoomId(rid);
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"updateMessage.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/server/functions/updateMessage.js                                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.updateMessage = function (message, user) {
  // If we keep history of edits, insert a new message to store history information
  if (RocketChat.settings.get('Message_KeepHistory')) {
    RocketChat.models.Messages.cloneAndSaveAsHistoryById(message._id);
  }

  message.editedAt = new Date();
  message.editedBy = {
    _id: user._id,
    username: user.username
  };
  const urls = message.msg.match(/([A-Za-z]{3,9}):\/\/([-;:&=\+\$,\w]+@{1})?([-A-Za-z0-9\.]+)+:?(\d+)?((\/[-\+=!:~%\/\.@\,\w]*)?\??([-\+=&!:;%@\/\.\,\w]+)?(?:#([^\s\)]+))?)?/g);

  if (urls) {
    message.urls = urls.map(url => {
      return {
        url
      };
    });
  }

  message = RocketChat.callbacks.run('beforeSaveMessage', message);
  const tempid = message._id;
  delete message._id;
  RocketChat.models.Messages.update({
    _id: tempid
  }, {
    $set: message
  });
  const room = RocketChat.models.Rooms.findOneById(message.rid);
  Meteor.defer(function () {
    RocketChat.callbacks.run('afterSaveMessage', RocketChat.models.Messages.findOneById(tempid), room, user._id);
  });
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"validateCustomFields.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/server/functions/validateCustomFields.js                                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let s;
module.watch(require("underscore.string"), {
  default(v) {
    s = v;
  }

}, 0);

RocketChat.validateCustomFields = function (fields) {
  // Special Case:
  // If an admin didn't set any custom fields there's nothing to validate against so consider any customFields valid
  if (s.trim(RocketChat.settings.get('Accounts_CustomFields')) === '') {
    return;
  }

  let customFieldsMeta;

  try {
    customFieldsMeta = JSON.parse(RocketChat.settings.get('Accounts_CustomFields'));
  } catch (e) {
    throw new Meteor.Error('error-invalid-customfield-json', 'Invalid JSON for Custom Fields');
  }

  const customFields = {};
  Object.keys(customFieldsMeta).forEach(fieldName => {
    const field = customFieldsMeta[fieldName];
    customFields[fieldName] = fields[fieldName];
    const fieldValue = s.trim(fields[fieldName]);

    if (field.required && fieldValue === '') {
      throw new Meteor.Error('error-user-registration-custom-field', `Field ${fieldName} is required`, {
        method: 'registerUser'
      });
    }

    if (field.type === 'select' && field.options.indexOf(fields[fieldName]) === -1) {
      throw new Meteor.Error('error-user-registration-custom-field', `Value for field ${fieldName} is invalid`, {
        method: 'registerUser'
      });
    }

    if (field.maxLength && fieldValue.length > field.maxLength) {
      throw new Meteor.Error('error-user-registration-custom-field', `Max length of field ${fieldName} ${field.maxLength}`, {
        method: 'registerUser'
      });
    }

    if (field.minLength && fieldValue.length < field.minLength) {
      throw new Meteor.Error('error-user-registration-custom-field', `Min length of field ${fieldName} ${field.minLength}`, {
        method: 'registerUser'
      });
    }
  });
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"Notifications.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/server/functions/Notifications.js                                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.Notifications = new class {
  constructor() {
    this.debug = false;
    this.streamAll = new Meteor.Streamer('notify-all');
    this.streamLogged = new Meteor.Streamer('notify-logged');
    this.streamRoom = new Meteor.Streamer('notify-room');
    this.streamRoomUsers = new Meteor.Streamer('notify-room-users');
    this.streamUser = new Meteor.Streamer('notify-user');
    this.streamAll.allowWrite('none');
    this.streamLogged.allowWrite('none');
    this.streamRoom.allowWrite('none');
    this.streamRoomUsers.allowWrite(function (eventName, ...args) {
      const [roomId, e] = eventName.split('/'); // const user = Meteor.users.findOne(this.userId, {
      // 	fields: {
      // 		username: 1
      // 	}
      // });

      if (RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(roomId, this.userId) != null) {
        const subscriptions = RocketChat.models.Subscriptions.findByRoomIdAndNotUserId(roomId, this.userId).fetch();
        subscriptions.forEach(subscription => RocketChat.Notifications.notifyUser(subscription.u._id, e, ...args));
      }

      return false;
    });
    this.streamUser.allowWrite('logged');
    this.streamAll.allowRead('all');
    this.streamLogged.allowRead('logged');
    this.streamRoom.allowRead(function (eventName, extraData) {
      const [roomId] = eventName.split('/');
      const user = Meteor.users.findOne(this.userId, {
        fields: {
          username: 1
        }
      });
      const room = RocketChat.models.Rooms.findOneById(roomId);

      if (!room) {
        console.warn(`Invalid streamRoom eventName: "${eventName}"`);
        return false;
      }

      if (room.t === 'l' && extraData && extraData.token && room.v.token === extraData.token) {
        return true;
      }

      if (this.userId == null) {
        return false;
      }

      return room.usernames.indexOf(user.username) > -1;
    });
    this.streamRoomUsers.allowRead('none');
    this.streamUser.allowRead(function (eventName) {
      const [userId] = eventName.split('/');
      return this.userId != null && this.userId === userId;
    });
  }

  notifyAll(eventName, ...args) {
    if (this.debug === true) {
      console.log('notifyAll', arguments);
    }

    args.unshift(eventName);
    return this.streamAll.emit.apply(this.streamAll, args);
  }

  notifyLogged(eventName, ...args) {
    if (this.debug === true) {
      console.log('notifyLogged', arguments);
    }

    args.unshift(eventName);
    return this.streamLogged.emit.apply(this.streamLogged, args);
  }

  notifyRoom(room, eventName, ...args) {
    if (this.debug === true) {
      console.log('notifyRoom', arguments);
    }

    args.unshift(`${room}/${eventName}`);
    return this.streamRoom.emit.apply(this.streamRoom, args);
  }

  notifyUser(userId, eventName, ...args) {
    if (this.debug === true) {
      console.log('notifyUser', arguments);
    }

    args.unshift(`${userId}/${eventName}`);
    return this.streamUser.emit.apply(this.streamUser, args);
  }

  notifyAllInThisInstance(eventName, ...args) {
    if (this.debug === true) {
      console.log('notifyAll', arguments);
    }

    args.unshift(eventName);
    return this.streamAll.emitWithoutBroadcast.apply(this.streamAll, args);
  }

  notifyLoggedInThisInstance(eventName, ...args) {
    if (this.debug === true) {
      console.log('notifyLogged', arguments);
    }

    args.unshift(eventName);
    return this.streamLogged.emitWithoutBroadcast.apply(this.streamLogged, args);
  }

  notifyRoomInThisInstance(room, eventName, ...args) {
    if (this.debug === true) {
      console.log('notifyRoomAndBroadcast', arguments);
    }

    args.unshift(`${room}/${eventName}`);
    return this.streamRoom.emitWithoutBroadcast.apply(this.streamRoom, args);
  }

  notifyUserInThisInstance(userId, eventName, ...args) {
    if (this.debug === true) {
      console.log('notifyUserAndBroadcast', arguments);
    }

    args.unshift(`${userId}/${eventName}`);
    return this.streamUser.emitWithoutBroadcast.apply(this.streamUser, args);
  }

}();
RocketChat.Notifications.streamRoom.allowWrite(function (eventName, username, typing, extraData) {
  const [roomId, e] = eventName.split('/');

  if (e === 'webrtc') {
    return true;
  }

  if (e === 'typing') {
    // typing from livechat widget
    if (extraData && extraData.token) {
      const room = RocketChat.models.Rooms.findOneById(roomId);

      if (room && room.t === 'l' && room.v.token === extraData.token) {
        return true;
      }
    }

    const user = Meteor.users.findOne(this.userId, {
      fields: {
        username: 1
      }
    });

    if (user != null && user.username === username) {
      return true;
    }
  }

  return false;
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"models":{"_Base.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/server/models/_Base.js                                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let ModelsBaseDb;
module.watch(require("./_BaseDb"), {
  default(v) {
    ModelsBaseDb = v;
  }

}, 0);
let ModelsBaseCache;
module.watch(require("./_BaseCache"), {
  default(v) {
    ModelsBaseCache = v;
  }

}, 1);
RocketChat.models._CacheControl = new Meteor.EnvironmentVariable();

class ModelsBase {
  constructor(nameOrModel, useCache) {
    this._db = new ModelsBaseDb(nameOrModel, this);
    this.model = this._db.model;
    this.collectionName = this._db.collectionName;
    this.name = this._db.name;
    this._useCache = useCache === true;
    this.cache = new ModelsBaseCache(this); // TODO_CACHE: remove

    this.on = this.cache.on.bind(this.cache);
    this.emit = this.cache.emit.bind(this.cache);
    this.getDynamicView = this.cache.getDynamicView.bind(this.cache);
    this.processQueryOptionsOnResult = this.cache.processQueryOptionsOnResult.bind(this.cache); // END_TODO_CACHE

    this.db = this;

    if (this._useCache) {
      this.db = new this.constructor(this.model, false);
    }
  }

  get useCache() {
    if (RocketChat.models._CacheControl.get() === false) {
      return false;
    }

    return this._useCache;
  }

  get origin() {
    return this.useCache === true ? 'cache' : '_db';
  }

  arrayToCursor(data) {
    return {
      fetch() {
        return data;
      },

      count() {
        return data.length;
      },

      forEach(fn) {
        return data.forEach(fn);
      }

    };
  }

  setUpdatedAt()
  /*record, checkQuery, query*/
  {
    return this._db.setUpdatedAt(...arguments);
  }

  find() {
    try {
      return this[this.origin].find(...arguments);
    } catch (e) {
      console.error('Exception on find', e, ...arguments);
    }
  }

  findOne() {
    try {
      return this[this.origin].findOne(...arguments);
    } catch (e) {
      console.error('Exception on find', e, ...arguments);
    }
  }

  findOneById() {
    try {
      return this[this.origin].findOneById(...arguments);
    } catch (e) {
      console.error('Exception on find', e, ...arguments);
    }
  }

  findOneByIds(ids, options) {
    check(ids, [String]);

    try {
      return this[this.origin].findOneByIds(ids, options);
    } catch (e) {
      console.error('Exception on find', e, ...arguments);
    }
  }

  insert()
  /*record*/
  {
    return this._db.insert(...arguments);
  }

  update()
  /*query, update, options*/
  {
    return this._db.update(...arguments);
  }

  upsert()
  /*query, update*/
  {
    return this._db.upsert(...arguments);
  }

  remove()
  /*query*/
  {
    return this._db.remove(...arguments);
  }

  insertOrUpsert() {
    return this._db.insertOrUpsert(...arguments);
  }

  allow() {
    return this._db.allow(...arguments);
  }

  deny() {
    return this._db.deny(...arguments);
  }

  ensureIndex() {
    return this._db.ensureIndex(...arguments);
  }

  dropIndex() {
    return this._db.dropIndex(...arguments);
  }

  tryEnsureIndex() {
    return this._db.tryEnsureIndex(...arguments);
  }

  tryDropIndex() {
    return this._db.tryDropIndex(...arguments);
  }

  trashFind()
  /*query, options*/
  {
    return this._db.trashFind(...arguments);
  }

  trashFindDeletedAfter()
  /*deletedAt, query, options*/
  {
    return this._db.trashFindDeletedAfter(...arguments);
  } // dinamicTrashFindAfter(method, deletedAt, ...args) {
  // 	const scope = {
  // 		find: (query={}) => {
  // 			return this.trashFindDeletedAfter(deletedAt, query, { fields: {_id: 1, _deletedAt: 1} });
  // 		}
  // 	};
  // 	scope.model = {
  // 		find: scope.find
  // 	};
  // 	return this[method].apply(scope, args);
  // }
  // dinamicFindAfter(method, updatedAt, ...args) {
  // 	const scope = {
  // 		find: (query={}, options) => {
  // 			query._updatedAt = {
  // 				$gt: updatedAt
  // 			};
  // 			return this.find(query, options);
  // 		}
  // 	};
  // 	scope.model = {
  // 		find: scope.find
  // 	};
  // 	return this[method].apply(scope, args);
  // }
  // dinamicFindChangesAfter(method, updatedAt, ...args) {
  // 	return {
  // 		update: this.dinamicFindAfter(method, updatedAt, ...args).fetch(),
  // 		remove: this.dinamicTrashFindAfter(method, updatedAt, ...args).fetch()
  // 	};
  // }


}

RocketChat.models._Base = ModelsBase;
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"Avatars.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/server/models/Avatars.js                                                                    //
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
RocketChat.models.Avatars = new class extends RocketChat.models._Base {
  constructor() {
    super('avatars');
    this.model.before.insert((userId, doc) => {
      doc.instanceId = InstanceStatus.id();
    });
    this.tryEnsureIndex({
      name: 1
    });
  }

  insertAvatarFileInit(name, userId, store, file, extra) {
    const fileData = {
      _id: name,
      name,
      userId,
      store,
      complete: false,
      uploading: true,
      progress: 0,
      extension: s.strRightBack(file.name, '.'),
      uploadedAt: new Date()
    };

    _.extend(fileData, file, extra);

    return this.insertOrUpsert(fileData);
  }

  updateFileComplete(fileId, userId, file) {
    if (!fileId) {
      return;
    }

    const filter = {
      _id: fileId,
      userId
    };
    const update = {
      $set: {
        complete: true,
        uploading: false,
        progress: 1
      }
    };
    update.$set = _.extend(file, update.$set);

    if (this.model.direct && this.model.direct.update) {
      return this.model.direct.update(filter, update);
    } else {
      return this.update(filter, update);
    }
  }

  findOneByName(name) {
    return this.findOne({
      name
    });
  }

  updateFileNameById(fileId, name) {
    const filter = {
      _id: fileId
    };
    const update = {
      $set: {
        name
      }
    };

    if (this.model.direct && this.model.direct.update) {
      return this.model.direct.update(filter, update);
    } else {
      return this.update(filter, update);
    }
  } // @TODO deprecated


  updateFileCompleteByNameAndUserId(name, userId, url) {
    if (!name) {
      return;
    }

    const filter = {
      name,
      userId
    };
    const update = {
      $set: {
        complete: true,
        uploading: false,
        progress: 1,
        url
      }
    };

    if (this.model.direct && this.model.direct.update) {
      return this.model.direct.update(filter, update);
    } else {
      return this.update(filter, update);
    }
  }

  deleteFile(fileId) {
    if (this.model.direct && this.model.direct.remove) {
      return this.model.direct.remove({
        _id: fileId
      });
    } else {
      return this.remove({
        _id: fileId
      });
    }
  }

}();
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"Messages.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/server/models/Messages.js                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
RocketChat.models.Messages = new class extends RocketChat.models._Base {
  constructor() {
    super('message');
    this.tryEnsureIndex({
      'rid': 1,
      'ts': 1
    });
    this.tryEnsureIndex({
      'ts': 1
    });
    this.tryEnsureIndex({
      'u._id': 1
    });
    this.tryEnsureIndex({
      'editedAt': 1
    }, {
      sparse: 1
    });
    this.tryEnsureIndex({
      'editedBy._id': 1
    }, {
      sparse: 1
    });
    this.tryEnsureIndex({
      'rid': 1,
      't': 1,
      'u._id': 1
    });
    this.tryEnsureIndex({
      'expireAt': 1
    }, {
      expireAfterSeconds: 0
    });
    this.tryEnsureIndex({
      'msg': 'text'
    });
    this.tryEnsureIndex({
      'file._id': 1
    }, {
      sparse: 1
    });
    this.tryEnsureIndex({
      'mentions.username': 1
    }, {
      sparse: 1
    });
    this.tryEnsureIndex({
      'pinned': 1
    }, {
      sparse: 1
    });
    this.tryEnsureIndex({
      'snippeted': 1
    }, {
      sparse: 1
    });
    this.tryEnsureIndex({
      'location': '2dsphere'
    });
    this.tryEnsureIndex({
      'slackBotId': 1,
      'slackTs': 1
    }, {
      sparse: 1
    });
  } // FIND


  findByMention(username, options) {
    const query = {
      'mentions.username': username
    };
    return this.find(query, options);
  }

  findVisibleByMentionAndRoomId(username, rid, options) {
    const query = {
      _hidden: {
        $ne: true
      },
      'mentions.username': username,
      rid
    };
    return this.find(query, options);
  }

  findVisibleByRoomId(roomId, options) {
    const query = {
      _hidden: {
        $ne: true
      },
      rid: roomId
    };
    return this.find(query, options);
  }

  findVisibleByRoomIdNotContainingTypes(roomId, types, options) {
    const query = {
      _hidden: {
        $ne: true
      },
      rid: roomId
    };

    if (Match.test(types, [String]) && types.length > 0) {
      query.t = {
        $nin: types
      };
    }

    return this.find(query, options);
  }

  findInvisibleByRoomId(roomId, options) {
    const query = {
      _hidden: true,
      rid: roomId
    };
    return this.find(query, options);
  }

  findVisibleByRoomIdAfterTimestamp(roomId, timestamp, options) {
    const query = {
      _hidden: {
        $ne: true
      },
      rid: roomId,
      ts: {
        $gt: timestamp
      }
    };
    return this.find(query, options);
  }

  findForUpdates(roomId, timestamp, options) {
    const query = {
      _hidden: {
        $ne: true
      },
      rid: roomId,
      _updatedAt: {
        $gt: timestamp
      }
    };
    return this.find(query, options);
  }

  findVisibleByRoomIdBeforeTimestamp(roomId, timestamp, options) {
    const query = {
      _hidden: {
        $ne: true
      },
      rid: roomId,
      ts: {
        $lt: timestamp
      }
    };
    return this.find(query, options);
  }

  findVisibleByRoomIdBeforeTimestampInclusive(roomId, timestamp, options) {
    const query = {
      _hidden: {
        $ne: true
      },
      rid: roomId,
      ts: {
        $lte: timestamp
      }
    };
    return this.find(query, options);
  }

  findVisibleByRoomIdBetweenTimestamps(roomId, afterTimestamp, beforeTimestamp, options) {
    const query = {
      _hidden: {
        $ne: true
      },
      rid: roomId,
      ts: {
        $gt: afterTimestamp,
        $lt: beforeTimestamp
      }
    };
    return this.find(query, options);
  }

  findVisibleByRoomIdBetweenTimestampsInclusive(roomId, afterTimestamp, beforeTimestamp, options) {
    const query = {
      _hidden: {
        $ne: true
      },
      rid: roomId,
      ts: {
        $gte: afterTimestamp,
        $lte: beforeTimestamp
      }
    };
    return this.find(query, options);
  }

  findVisibleByRoomIdBeforeTimestampNotContainingTypes(roomId, timestamp, types, options) {
    const query = {
      _hidden: {
        $ne: true
      },
      rid: roomId,
      ts: {
        $lt: timestamp
      }
    };

    if (Match.test(types, [String]) && types.length > 0) {
      query.t = {
        $nin: types
      };
    }

    return this.find(query, options);
  }

  findVisibleByRoomIdBetweenTimestampsNotContainingTypes(roomId, afterTimestamp, beforeTimestamp, types, options) {
    const query = {
      _hidden: {
        $ne: true
      },
      rid: roomId,
      ts: {
        $gt: afterTimestamp,
        $lt: beforeTimestamp
      }
    };

    if (Match.test(types, [String]) && types.length > 0) {
      query.t = {
        $nin: types
      };
    }

    return this.find(query, options);
  }

  findVisibleCreatedOrEditedAfterTimestamp(timestamp, options) {
    const query = {
      _hidden: {
        $ne: true
      },
      $or: [{
        ts: {
          $gt: timestamp
        }
      }, {
        'editedAt': {
          $gt: timestamp
        }
      }]
    };
    return this.find(query, options);
  }

  findStarredByUserAtRoom(userId, roomId, options) {
    const query = {
      _hidden: {
        $ne: true
      },
      'starred._id': userId,
      rid: roomId
    };
    return this.find(query, options);
  }

  findPinnedByRoom(roomId, options) {
    const query = {
      t: {
        $ne: 'rm'
      },
      _hidden: {
        $ne: true
      },
      pinned: true,
      rid: roomId
    };
    return this.find(query, options);
  }

  findSnippetedByRoom(roomId, options) {
    const query = {
      _hidden: {
        $ne: true
      },
      snippeted: true,
      rid: roomId
    };
    return this.find(query, options);
  }

  getLastTimestamp(options) {
    if (options == null) {
      options = {};
    }

    const query = {
      ts: {
        $exists: 1
      }
    };
    options.sort = {
      ts: -1
    };
    options.limit = 1;
    const [message] = this.find(query, options).fetch();
    return message && message.ts;
  }

  findByRoomIdAndMessageIds(rid, messageIds, options) {
    const query = {
      rid,
      _id: {
        $in: messageIds
      }
    };
    return this.find(query, options);
  }

  findOneBySlackBotIdAndSlackTs(slackBotId, slackTs) {
    const query = {
      slackBotId,
      slackTs
    };
    return this.findOne(query);
  }

  findOneBySlackTs(slackTs) {
    const query = {
      slackTs
    };
    return this.findOne(query);
  }

  findByRoomId(roomId, options) {
    const query = {
      rid: roomId
    };
    return this.find(query, options);
  }

  getLastVisibleMessageSentWithNoTypeByRoomId(rid, messageId) {
    const query = {
      rid,
      _hidden: {
        $ne: true
      },
      t: {
        $exists: false
      }
    };

    if (messageId) {
      query._id = {
        $ne: messageId
      };
    }

    const options = {
      sort: {
        ts: -1
      }
    };
    return this.findOne(query, options);
  }

  cloneAndSaveAsHistoryById(_id) {
    const me = RocketChat.models.Users.findOneById(Meteor.userId());
    const record = this.findOneById(_id);
    record._hidden = true;
    record.parent = record._id;
    record.editedAt = new Date();
    record.editedBy = {
      _id: Meteor.userId(),
      username: me.username
    };
    delete record._id;
    return this.insert(record);
  } // UPDATE


  setHiddenById(_id, hidden) {
    if (hidden == null) {
      hidden = true;
    }

    const query = {
      _id
    };
    const update = {
      $set: {
        _hidden: hidden
      }
    };
    return this.update(query, update);
  }

  setAsDeletedByIdAndUser(_id, user) {
    const query = {
      _id
    };
    const update = {
      $set: {
        msg: '',
        t: 'rm',
        urls: [],
        mentions: [],
        attachments: [],
        reactions: [],
        editedAt: new Date(),
        editedBy: {
          _id: user._id,
          username: user.username
        }
      }
    };
    return this.update(query, update);
  }

  setPinnedByIdAndUserId(_id, pinnedBy, pinned, pinnedAt) {
    if (pinned == null) {
      pinned = true;
    }

    if (pinnedAt == null) {
      pinnedAt = 0;
    }

    const query = {
      _id
    };
    const update = {
      $set: {
        pinned,
        pinnedAt: pinnedAt || new Date(),
        pinnedBy
      }
    };
    return this.update(query, update);
  }

  setSnippetedByIdAndUserId(message, snippetName, snippetedBy, snippeted, snippetedAt) {
    if (snippeted == null) {
      snippeted = true;
    }

    if (snippetedAt == null) {
      snippetedAt = 0;
    }

    const query = {
      _id: message._id
    };
    const msg = `\`\`\`${message.msg}\`\`\``;
    const update = {
      $set: {
        msg,
        snippeted,
        snippetedAt: snippetedAt || new Date(),
        snippetedBy,
        snippetName
      }
    };
    return this.update(query, update);
  }

  setUrlsById(_id, urls) {
    const query = {
      _id
    };
    const update = {
      $set: {
        urls
      }
    };
    return this.update(query, update);
  }

  updateAllUsernamesByUserId(userId, username) {
    const query = {
      'u._id': userId
    };
    const update = {
      $set: {
        'u.username': username
      }
    };
    return this.update(query, update, {
      multi: true
    });
  }

  updateUsernameOfEditByUserId(userId, username) {
    const query = {
      'editedBy._id': userId
    };
    const update = {
      $set: {
        'editedBy.username': username
      }
    };
    return this.update(query, update, {
      multi: true
    });
  }

  updateUsernameAndMessageOfMentionByIdAndOldUsername(_id, oldUsername, newUsername, newMessage) {
    const query = {
      _id,
      'mentions.username': oldUsername
    };
    const update = {
      $set: {
        'mentions.$.username': newUsername,
        'msg': newMessage
      }
    };
    return this.update(query, update);
  }

  updateUserStarById(_id, userId, starred) {
    let update;
    const query = {
      _id
    };

    if (starred) {
      update = {
        $addToSet: {
          starred: {
            _id: userId
          }
        }
      };
    } else {
      update = {
        $pull: {
          starred: {
            _id: Meteor.userId()
          }
        }
      };
    }

    return this.update(query, update);
  }

  upgradeEtsToEditAt() {
    const query = {
      ets: {
        $exists: 1
      }
    };
    const update = {
      $rename: {
        'ets': 'editedAt'
      }
    };
    return this.update(query, update, {
      multi: true
    });
  }

  setMessageAttachments(_id, attachments) {
    const query = {
      _id
    };
    const update = {
      $set: {
        attachments
      }
    };
    return this.update(query, update);
  }

  setSlackBotIdAndSlackTs(_id, slackBotId, slackTs) {
    const query = {
      _id
    };
    const update = {
      $set: {
        slackBotId,
        slackTs
      }
    };
    return this.update(query, update);
  }

  unlinkUserId(userId, newUserId, newUsername, newNameAlias) {
    const query = {
      'u._id': userId
    };
    const update = {
      $set: {
        'alias': newNameAlias,
        'u._id': newUserId,
        'u.username': newUsername,
        'u.name': undefined
      }
    };
    return this.update(query, update, {
      multi: true
    });
  } // INSERT


  createWithTypeRoomIdMessageAndUser(type, roomId, message, user, extraData) {
    const room = RocketChat.models.Rooms.findOneById(roomId, {
      fields: {
        sysMes: 1
      }
    });

    if ((room != null ? room.sysMes : undefined) === false) {
      return;
    }

    const record = {
      t: type,
      rid: roomId,
      ts: new Date(),
      msg: message,
      u: {
        _id: user._id,
        username: user.username
      },
      groupable: false
    };

    if (RocketChat.settings.get('Message_Read_Receipt_Enabled')) {
      record.unread = true;
    }

    _.extend(record, extraData);

    record._id = this.insertOrUpsert(record);
    RocketChat.models.Rooms.incMsgCountById(room._id, 1);
    return record;
  }

  createUserJoinWithRoomIdAndUser(roomId, user, extraData) {
    const message = user.username;
    return this.createWithTypeRoomIdMessageAndUser('uj', roomId, message, user, extraData);
  }

  createUserLeaveWithRoomIdAndUser(roomId, user, extraData) {
    const message = user.username;
    return this.createWithTypeRoomIdMessageAndUser('ul', roomId, message, user, extraData);
  }

  createUserRemovedWithRoomIdAndUser(roomId, user, extraData) {
    const message = user.username;
    return this.createWithTypeRoomIdMessageAndUser('ru', roomId, message, user, extraData);
  }

  createUserAddedWithRoomIdAndUser(roomId, user, extraData) {
    const message = user.username;
    return this.createWithTypeRoomIdMessageAndUser('au', roomId, message, user, extraData);
  }

  createCommandWithRoomIdAndUser(command, roomId, user, extraData) {
    return this.createWithTypeRoomIdMessageAndUser('command', roomId, command, user, extraData);
  }

  createUserMutedWithRoomIdAndUser(roomId, user, extraData) {
    const message = user.username;
    return this.createWithTypeRoomIdMessageAndUser('user-muted', roomId, message, user, extraData);
  }

  createUserUnmutedWithRoomIdAndUser(roomId, user, extraData) {
    const message = user.username;
    return this.createWithTypeRoomIdMessageAndUser('user-unmuted', roomId, message, user, extraData);
  }

  createNewModeratorWithRoomIdAndUser(roomId, user, extraData) {
    const message = user.username;
    return this.createWithTypeRoomIdMessageAndUser('new-moderator', roomId, message, user, extraData);
  }

  createModeratorRemovedWithRoomIdAndUser(roomId, user, extraData) {
    const message = user.username;
    return this.createWithTypeRoomIdMessageAndUser('moderator-removed', roomId, message, user, extraData);
  }

  createNewOwnerWithRoomIdAndUser(roomId, user, extraData) {
    const message = user.username;
    return this.createWithTypeRoomIdMessageAndUser('new-owner', roomId, message, user, extraData);
  }

  createOwnerRemovedWithRoomIdAndUser(roomId, user, extraData) {
    const message = user.username;
    return this.createWithTypeRoomIdMessageAndUser('owner-removed', roomId, message, user, extraData);
  }

  createNewLeaderWithRoomIdAndUser(roomId, user, extraData) {
    const message = user.username;
    return this.createWithTypeRoomIdMessageAndUser('new-leader', roomId, message, user, extraData);
  }

  createLeaderRemovedWithRoomIdAndUser(roomId, user, extraData) {
    const message = user.username;
    return this.createWithTypeRoomIdMessageAndUser('leader-removed', roomId, message, user, extraData);
  }

  createSubscriptionRoleAddedWithRoomIdAndUser(roomId, user, extraData) {
    const message = user.username;
    return this.createWithTypeRoomIdMessageAndUser('subscription-role-added', roomId, message, user, extraData);
  }

  createSubscriptionRoleRemovedWithRoomIdAndUser(roomId, user, extraData) {
    const message = user.username;
    return this.createWithTypeRoomIdMessageAndUser('subscription-role-removed', roomId, message, user, extraData);
  } // REMOVE


  removeById(_id) {
    const query = {
      _id
    };
    return this.remove(query);
  }

  removeByRoomId(roomId) {
    const query = {
      rid: roomId
    };
    return this.remove(query);
  }

  removeByUserId(userId) {
    const query = {
      'u._id': userId
    };
    return this.remove(query);
  }

  getMessageByFileId(fileID) {
    return this.findOne({
      'file._id': fileID
    });
  }

  setAsRead(rid, until) {
    return this.update({
      rid,
      unread: true,
      ts: {
        $lt: until
      }
    }, {
      $unset: {
        unread: 1
      }
    }, {
      multi: true
    });
  }

  setAsReadById(_id) {
    return this.update({
      _id
    }, {
      $unset: {
        unread: 1
      }
    });
  }

  findUnreadMessagesByRoomAndDate(rid, after) {
    const query = {
      unread: true,
      rid
    };

    if (after) {
      query.ts = {
        $gt: after
      };
    }

    return this.find(query, {
      fields: {
        _id: 1
      }
    });
  }

}();
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"Reports.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/server/models/Reports.js                                                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
RocketChat.models.Reports = new class extends RocketChat.models._Base {
  constructor() {
    super('reports');
  }

  createWithMessageDescriptionAndUserId(message, description, userId, extraData) {
    const record = {
      message,
      description,
      ts: new Date(),
      userId
    };

    _.extend(record, extraData);

    record._id = this.insert(record);
    return record;
  }

}();
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"Rooms.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/server/models/Rooms.js                                                                      //
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

class ModelRooms extends RocketChat.models._Base {
  constructor() {
    super(...arguments);
    this.tryEnsureIndex({
      'name': 1
    }, {
      unique: 1,
      sparse: 1
    });
    this.tryEnsureIndex({
      'default': 1
    });
    this.tryEnsureIndex({
      'usernames': 1
    });
    this.tryEnsureIndex({
      't': 1
    });
    this.tryEnsureIndex({
      'u._id': 1
    });
    this.cache.ignoreUpdatedFields = ['msgs', 'lm'];
    this.cache.ensureIndex(['t', 'name'], 'unique');
    this.cache.options = {
      fields: {
        usernames: 0
      }
    };
  }

  findOneByIdOrName(_idOrName, options) {
    const query = {
      $or: [{
        _id: _idOrName
      }, {
        name: _idOrName
      }]
    };
    return this.findOne(query, options);
  }

  findOneByImportId(_id, options) {
    const query = {
      importIds: _id
    };
    return this.findOne(query, options);
  }

  findOneByName(name, options) {
    const query = {
      name
    };
    return this.findOne(query, options);
  }

  findOneByNameAndNotId(name, rid) {
    const query = {
      _id: {
        $ne: rid
      },
      name
    };
    return this.findOne(query);
  }

  findOneByDisplayName(fname, options) {
    const query = {
      fname
    };
    return this.findOne(query, options);
  }

  findOneByNameAndType(name, type, options) {
    const query = {
      name,
      t: type
    };
    return this.findOne(query, options);
  }

  findOneByIdContainingUsername(_id, username, options) {
    const query = {
      _id,
      usernames: username
    };
    return this.findOne(query, options);
  }

  findOneByNameAndTypeNotContainingUsername(name, type, username, options) {
    const query = {
      name,
      t: type,
      usernames: {
        $ne: username
      }
    };
    return this.findOne(query, options);
  } // FIND


  findById(roomId, options) {
    return this.find({
      _id: roomId
    }, options);
  }

  findByIds(roomIds, options) {
    return this.find({
      _id: {
        $in: [].concat(roomIds)
      }
    }, options);
  }

  findByType(type, options) {
    const query = {
      t: type
    };
    return this.find(query, options);
  }

  findByTypes(types, options) {
    const query = {
      t: {
        $in: types
      }
    };
    return this.find(query, options);
  }

  findByUserId(userId, options) {
    const query = {
      'u._id': userId
    };
    return this.find(query, options);
  }

  findBySubscriptionUserId(userId, options) {
    let data;

    if (this.useCache) {
      data = RocketChat.models.Subscriptions.findByUserId(userId).fetch();
      data = data.map(function (item) {
        if (item._room) {
          return item._room;
        }

        console.log('Empty Room for Subscription', item);
      });
      data = data.filter(item => item);
      return this.arrayToCursor(this.processQueryOptionsOnResult(data, options));
    }

    data = RocketChat.models.Subscriptions.findByUserId(userId, {
      fields: {
        rid: 1
      }
    }).fetch();
    data = data.map(item => item.rid);
    const query = {
      _id: {
        $in: data
      }
    };
    return this.find(query, options);
  }

  findBySubscriptionUserIdUpdatedAfter(userId, _updatedAt, options) {
    if (this.useCache) {
      let data = RocketChat.models.Subscriptions.findByUserId(userId).fetch();
      data = data.map(function (item) {
        if (item._room) {
          return item._room;
        }

        console.log('Empty Room for Subscription', item);
      });
      data = data.filter(item => item && item._updatedAt > _updatedAt);
      return this.arrayToCursor(this.processQueryOptionsOnResult(data, options));
    }

    let ids = RocketChat.models.Subscriptions.findByUserId(userId, {
      fields: {
        rid: 1
      }
    }).fetch();
    ids = ids.map(item => item.rid);
    const query = {
      _id: {
        $in: ids
      },
      _updatedAt: {
        $gt: _updatedAt
      }
    };
    return this.find(query, options);
  }

  findByNameContaining(name, options) {
    const nameRegex = new RegExp(s.trim(s.escapeRegExp(name)), 'i');
    const query = {
      $or: [{
        name: nameRegex
      }, {
        t: 'd',
        usernames: nameRegex
      }]
    };
    return this.find(query, options);
  }

  findByNameContainingTypesWithUsername(name, types, options) {
    const nameRegex = new RegExp(s.trim(s.escapeRegExp(name)), 'i');
    const $or = [];

    for (const type of Array.from(types)) {
      const obj = {
        name: nameRegex,
        t: type.type
      };

      if (type.username != null) {
        obj.usernames = type.username;
      }

      if (type.ids != null) {
        obj._id = {
          $in: type.ids
        };
      }

      $or.push(obj);
    }

    const query = {
      $or
    };
    return this.find(query, options);
  }

  findContainingTypesWithUsername(types, options) {
    const $or = [];

    for (const type of Array.from(types)) {
      const obj = {
        t: type.type
      };

      if (type.username != null) {
        obj.usernames = type.username;
      }

      if (type.ids != null) {
        obj._id = {
          $in: type.ids
        };
      }

      $or.push(obj);
    }

    const query = {
      $or
    };
    return this.find(query, options);
  }

  findByNameContainingAndTypes(name, types, options) {
    const nameRegex = new RegExp(s.trim(s.escapeRegExp(name)), 'i');
    const query = {
      t: {
        $in: types
      },
      $or: [{
        name: nameRegex
      }, {
        t: 'd',
        usernames: nameRegex
      }]
    };
    return this.find(query, options);
  }

  findByNameAndType(name, type, options) {
    const query = {
      t: type,
      name
    }; // do not use cache

    return this._db.find(query, options);
  }

  findByNameAndTypeNotDefault(name, type, options) {
    const query = {
      t: type,
      name,
      default: {
        $ne: true
      }
    }; // do not use cache

    return this._db.find(query, options);
  }

  findByNameAndTypesNotContainingUsername(name, types, username, options) {
    const query = {
      t: {
        $in: types
      },
      name,
      usernames: {
        $ne: username
      }
    }; // do not use cache

    return this._db.find(query, options);
  }

  findByNameStartingAndTypes(name, types, options) {
    const nameRegex = new RegExp(`^${s.trim(s.escapeRegExp(name))}`, 'i');
    const query = {
      t: {
        $in: types
      },
      $or: [{
        name: nameRegex
      }, {
        t: 'd',
        usernames: nameRegex
      }]
    };
    return this.find(query, options);
  }

  findByDefaultAndTypes(defaultValue, types, options) {
    const query = {
      default: defaultValue,
      t: {
        $in: types
      }
    };
    return this.find(query, options);
  }

  findByTypeContainingUsername(type, username, options) {
    const query = {
      t: type,
      usernames: username
    };
    return this.find(query, options);
  }

  findByTypeContainingUsernames(type, username, options) {
    const query = {
      t: type,
      usernames: {
        $all: [].concat(username)
      }
    };
    return this.find(query, options);
  }

  findByTypesAndNotUserIdContainingUsername(types, userId, username, options) {
    const query = {
      t: {
        $in: types
      },
      uid: {
        $ne: userId
      },
      usernames: username
    };
    return this.find(query, options);
  }

  findByContainingUsername(username, options) {
    const query = {
      usernames: username
    };
    return this.find(query, options);
  }

  findByTypeAndName(type, name, options) {
    if (this.useCache) {
      return this.cache.findByIndex('t,name', [type, name], options);
    }

    const query = {
      name,
      t: type
    };
    return this.find(query, options);
  }

  findByTypeAndNameContainingUsername(type, name, username, options) {
    const query = {
      name,
      t: type,
      usernames: username
    };
    return this.find(query, options);
  }

  findByTypeAndArchivationState(type, archivationstate, options) {
    const query = {
      t: type
    };

    if (archivationstate) {
      query.archived = true;
    } else {
      query.archived = {
        $ne: true
      };
    }

    return this.find(query, options);
  } // UPDATE


  addImportIds(_id, importIds) {
    importIds = [].concat(importIds);
    const query = {
      _id
    };
    const update = {
      $addToSet: {
        importIds: {
          $each: importIds
        }
      }
    };
    return this.update(query, update);
  }

  archiveById(_id) {
    const query = {
      _id
    };
    const update = {
      $set: {
        archived: true
      }
    };
    return this.update(query, update);
  }

  unarchiveById(_id) {
    const query = {
      _id
    };
    const update = {
      $set: {
        archived: false
      }
    };
    return this.update(query, update);
  }

  addUsernameById(_id, username, muted) {
    const query = {
      _id
    };
    const update = {
      $addToSet: {
        usernames: username
      }
    };

    if (muted) {
      update.$addToSet.muted = username;
    }

    return this.update(query, update);
  }

  addUsernamesById(_id, usernames) {
    const query = {
      _id
    };
    const update = {
      $addToSet: {
        usernames: {
          $each: usernames
        }
      }
    };
    return this.update(query, update);
  }

  addUsernameByName(name, username) {
    const query = {
      name
    };
    const update = {
      $addToSet: {
        usernames: username
      }
    };
    return this.update(query, update);
  }

  removeUsernameById(_id, username) {
    const query = {
      _id
    };
    const update = {
      $pull: {
        usernames: username
      }
    };
    return this.update(query, update);
  }

  removeUsernamesById(_id, usernames) {
    const query = {
      _id
    };
    const update = {
      $pull: {
        usernames: {
          $in: usernames
        }
      }
    };
    return this.update(query, update);
  }

  removeUsernameFromAll(username) {
    const query = {
      usernames: username
    };
    const update = {
      $pull: {
        usernames: username
      }
    };
    return this.update(query, update, {
      multi: true
    });
  }

  removeUsernameByName(name, username) {
    const query = {
      name
    };
    const update = {
      $pull: {
        usernames: username
      }
    };
    return this.update(query, update);
  }

  setNameById(_id, name, fname) {
    const query = {
      _id
    };
    const update = {
      $set: {
        name,
        fname
      }
    };
    return this.update(query, update);
  }

  incMsgCountById(_id, inc) {
    if (inc == null) {
      inc = 1;
    }

    const query = {
      _id
    };
    const update = {
      $inc: {
        msgs: inc
      }
    };
    return this.update(query, update);
  }

  incMsgCountAndSetLastMessageById(_id, inc, lastMessageTimestamp, lastMessage) {
    if (inc == null) {
      inc = 1;
    }

    const query = {
      _id
    };
    const update = {
      $set: {
        lm: lastMessageTimestamp
      },
      $inc: {
        msgs: inc
      }
    };

    if (lastMessage) {
      update.$set.lastMessage = lastMessage;
    }

    return this.update(query, update);
  }

  setLastMessageById(_id, lastMessage) {
    const query = {
      _id
    };
    const update = {
      $set: {
        lastMessage
      }
    };
    return this.update(query, update);
  }

  replaceUsername(previousUsername, username) {
    const query = {
      usernames: previousUsername
    };
    const update = {
      $set: {
        'usernames.$': username
      }
    };
    return this.update(query, update, {
      multi: true
    });
  }

  replaceMutedUsername(previousUsername, username) {
    const query = {
      muted: previousUsername
    };
    const update = {
      $set: {
        'muted.$': username
      }
    };
    return this.update(query, update, {
      multi: true
    });
  }

  replaceUsernameOfUserByUserId(userId, username) {
    const query = {
      'u._id': userId
    };
    const update = {
      $set: {
        'u.username': username
      }
    };
    return this.update(query, update, {
      multi: true
    });
  }

  setJoinCodeById(_id, joinCode) {
    let update;
    const query = {
      _id
    };

    if ((joinCode != null ? joinCode.trim() : undefined) !== '') {
      update = {
        $set: {
          joinCodeRequired: true,
          joinCode
        }
      };
    } else {
      update = {
        $set: {
          joinCodeRequired: false
        },
        $unset: {
          joinCode: 1
        }
      };
    }

    return this.update(query, update);
  }

  setUserById(_id, user) {
    const query = {
      _id
    };
    const update = {
      $set: {
        u: {
          _id: user._id,
          username: user.username
        }
      }
    };
    return this.update(query, update);
  }

  setTypeById(_id, type) {
    const query = {
      _id
    };
    const update = {
      $set: {
        t: type
      }
    };

    if (type === 'p') {
      update.$unset = {
        default: ''
      };
    }

    return this.update(query, update);
  }

  setTopicById(_id, topic) {
    const query = {
      _id
    };
    const update = {
      $set: {
        topic
      }
    };
    return this.update(query, update);
  }

  setAnnouncementById(_id, announcement, announcementDetails) {
    const query = {
      _id
    };
    const update = {
      $set: {
        announcement,
        announcementDetails
      }
    };
    return this.update(query, update);
  }

  muteUsernameByRoomId(_id, username) {
    const query = {
      _id
    };
    const update = {
      $addToSet: {
        muted: username
      }
    };
    return this.update(query, update);
  }

  unmuteUsernameByRoomId(_id, username) {
    const query = {
      _id
    };
    const update = {
      $pull: {
        muted: username
      }
    };
    return this.update(query, update);
  }

  saveDefaultById(_id, defaultValue) {
    const query = {
      _id
    };
    const update = {
      $set: {
        default: defaultValue === 'true'
      }
    };
    return this.update(query, update);
  }

  setTopicAndTagsById(_id, topic, tags) {
    const setData = {};
    const unsetData = {};

    if (topic != null) {
      if (!_.isEmpty(s.trim(topic))) {
        setData.topic = s.trim(topic);
      } else {
        unsetData.topic = 1;
      }
    }

    if (tags != null) {
      if (!_.isEmpty(s.trim(tags))) {
        setData.tags = s.trim(tags).split(',').map(tag => s.trim(tag));
      } else {
        unsetData.tags = 1;
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
      return;
    }

    return this.update({
      _id
    }, update);
  } // INSERT


  createWithTypeNameUserAndUsernames(type, name, fname, user, usernames, extraData) {
    const room = {
      name,
      fname,
      t: type,
      usernames,
      msgs: 0,
      u: {
        _id: user._id,
        username: user.username
      }
    };

    _.extend(room, extraData);

    room._id = this.insert(room);
    return room;
  }

  createWithIdTypeAndName(_id, type, name, extraData) {
    const room = {
      _id,
      ts: new Date(),
      t: type,
      name,
      usernames: [],
      msgs: 0
    };

    _.extend(room, extraData);

    this.insert(room);
    return room;
  }

  createWithFullRoomData(room) {
    delete room._id;
    room._id = this.insert(room);
    return room;
  } // REMOVE


  removeById(_id) {
    const query = {
      _id
    };
    return this.remove(query);
  }

  removeByTypeContainingUsername(type, username) {
    const query = {
      t: type,
      usernames: username
    };
    return this.remove(query);
  }

}

RocketChat.models.Rooms = new ModelRooms('room', true);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"Settings.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/server/models/Settings.js                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
class ModelSettings extends RocketChat.models._Base {
  constructor() {
    super(...arguments);
    this.tryEnsureIndex({
      'blocked': 1
    }, {
      sparse: 1
    });
    this.tryEnsureIndex({
      'hidden': 1
    }, {
      sparse: 1
    });
  } // FIND


  findById(_id) {
    const query = {
      _id
    };
    return this.find(query);
  }

  findOneNotHiddenById(_id) {
    const query = {
      _id,
      hidden: {
        $ne: true
      }
    };
    return this.findOne(query);
  }

  findByIds(_id = []) {
    _id = [].concat(_id);
    const query = {
      _id: {
        $in: _id
      }
    };
    return this.find(query);
  }

  findByRole(role, options) {
    const query = {
      role
    };
    return this.find(query, options);
  }

  findPublic(options) {
    const query = {
      public: true
    };
    return this.find(query, options);
  }

  findNotHiddenPublic(ids = []) {
    const filter = {
      hidden: {
        $ne: true
      },
      public: true
    };

    if (ids.length > 0) {
      filter._id = {
        $in: ids
      };
    }

    return this.find(filter, {
      fields: {
        _id: 1,
        value: 1
      }
    });
  }

  findNotHiddenPublicUpdatedAfter(updatedAt) {
    const filter = {
      hidden: {
        $ne: true
      },
      public: true,
      _updatedAt: {
        $gt: updatedAt
      }
    };
    return this.find(filter, {
      fields: {
        _id: 1,
        value: 1
      }
    });
  }

  findNotHiddenPrivate() {
    return this.find({
      hidden: {
        $ne: true
      },
      public: {
        $ne: true
      }
    });
  }

  findNotHidden(options) {
    return this.find({
      hidden: {
        $ne: true
      }
    }, options);
  }

  findNotHiddenUpdatedAfter(updatedAt) {
    return this.find({
      hidden: {
        $ne: true
      },
      _updatedAt: {
        $gt: updatedAt
      }
    });
  } // UPDATE


  updateValueById(_id, value) {
    const query = {
      blocked: {
        $ne: true
      },
      value: {
        $ne: value
      },
      _id
    };
    const update = {
      $set: {
        value
      }
    };
    return this.update(query, update);
  }

  updateValueAndEditorById(_id, value, editor) {
    const query = {
      blocked: {
        $ne: true
      },
      value: {
        $ne: value
      },
      _id
    };
    const update = {
      $set: {
        value,
        editor
      }
    };
    return this.update(query, update);
  }

  updateValueNotHiddenById(_id, value) {
    const query = {
      _id,
      hidden: {
        $ne: true
      },
      blocked: {
        $ne: true
      }
    };
    const update = {
      $set: {
        value
      }
    };
    return this.update(query, update);
  }

  updateOptionsById(_id, options) {
    const query = {
      blocked: {
        $ne: true
      },
      _id
    };
    const update = {
      $set: options
    };
    return this.update(query, update);
  } // INSERT


  createWithIdAndValue(_id, value) {
    const record = {
      _id,
      value,
      _createdAt: new Date()
    };
    return this.insert(record);
  } // REMOVE


  removeById(_id) {
    const query = {
      blocked: {
        $ne: true
      },
      _id
    };
    return this.remove(query);
  }

}

RocketChat.models.Settings = new ModelSettings('settings', true);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"Subscriptions.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/server/models/Subscriptions.js                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);

class ModelSubscriptions extends RocketChat.models._Base {
  constructor() {
    super(...arguments);
    this.tryEnsureIndex({
      'rid': 1,
      'u._id': 1
    }, {
      unique: 1
    });
    this.tryEnsureIndex({
      'rid': 1,
      'alert': 1,
      'u._id': 1
    });
    this.tryEnsureIndex({
      'rid': 1,
      'roles': 1
    });
    this.tryEnsureIndex({
      'u._id': 1,
      'name': 1,
      't': 1
    });
    this.tryEnsureIndex({
      'u._id': 1,
      'name': 1,
      't': 1,
      'code': 1
    }, {
      unique: 1
    });
    this.tryEnsureIndex({
      'open': 1
    });
    this.tryEnsureIndex({
      'alert': 1
    });
    this.tryEnsureIndex({
      'unread': 1
    });
    this.tryEnsureIndex({
      'ts': 1
    });
    this.tryEnsureIndex({
      'ls': 1
    });
    this.tryEnsureIndex({
      'audioNotifications': 1
    }, {
      sparse: 1
    });
    this.tryEnsureIndex({
      'desktopNotifications': 1
    }, {
      sparse: 1
    });
    this.tryEnsureIndex({
      'mobilePushNotifications': 1
    }, {
      sparse: 1
    });
    this.tryEnsureIndex({
      'emailNotifications': 1
    }, {
      sparse: 1
    });
    this.tryEnsureIndex({
      'autoTranslate': 1
    }, {
      sparse: 1
    });
    this.tryEnsureIndex({
      'autoTranslateLanguage': 1
    }, {
      sparse: 1
    });
    this.cache.ensureIndex('rid', 'array');
    this.cache.ensureIndex('u._id', 'array');
    this.cache.ensureIndex('name', 'array');
    this.cache.ensureIndex(['rid', 'u._id'], 'unique');
    this.cache.ensureIndex(['name', 'u._id'], 'unique');
  } // FIND ONE


  findOneByRoomIdAndUserId(roomId, userId, options) {
    if (this.useCache) {
      return this.cache.findByIndex('rid,u._id', [roomId, userId], options).fetch();
    }

    const query = {
      rid: roomId,
      'u._id': userId
    };
    return this.findOne(query, options);
  }

  findOneByRoomNameAndUserId(roomName, userId) {
    if (this.useCache) {
      return this.cache.findByIndex('name,u._id', [roomName, userId]).fetch();
    }

    const query = {
      name: roomName,
      'u._id': userId
    };
    return this.findOne(query);
  } // FIND


  findByUserId(userId, options) {
    if (this.useCache) {
      return this.cache.findByIndex('u._id', userId, options);
    }

    const query = {
      'u._id': userId
    };
    return this.find(query, options);
  }

  findByUserIdUpdatedAfter(userId, updatedAt, options) {
    const query = {
      'u._id': userId,
      _updatedAt: {
        $gt: updatedAt
      }
    };
    return this.find(query, options);
  } // FIND


  findByRoomIdAndRoles(roomId, roles, options) {
    roles = [].concat(roles);
    const query = {
      'rid': roomId,
      'roles': {
        $in: roles
      }
    };
    return this.find(query, options);
  }

  findByType(types, options) {
    const query = {
      t: {
        $in: types
      }
    };
    return this.find(query, options);
  }

  findByTypeAndUserId(type, userId, options) {
    const query = {
      t: type,
      'u._id': userId
    };
    return this.find(query, options);
  }

  findByTypeNameAndUserId(type, name, userId, options) {
    const query = {
      t: type,
      name,
      'u._id': userId
    };
    return this.find(query, options);
  }

  findByRoomId(roomId, options) {
    if (this.useCache) {
      return this.cache.findByIndex('rid', roomId, options);
    }

    const query = {
      rid: roomId
    };
    return this.find(query, options);
  }

  findByRoomIdAndNotUserId(roomId, userId, options) {
    const query = {
      rid: roomId,
      'u._id': {
        $ne: userId
      }
    };
    return this.find(query, options);
  }

  getLastSeen(options) {
    if (options == null) {
      options = {};
    }

    const query = {
      ls: {
        $exists: 1
      }
    };
    options.sort = {
      ls: -1
    };
    options.limit = 1;
    const [subscription] = this.find(query, options).fetch();
    return subscription && subscription.ls;
  }

  findByRoomIdAndUserIds(roomId, userIds) {
    const query = {
      rid: roomId,
      'u._id': {
        $in: userIds
      }
    };
    return this.find(query);
  }

  findByRoomIdAndUserIdsOrAllMessages(roomId, userIds) {
    const query = {
      rid: roomId,
      $or: [{
        'u._id': {
          $in: userIds
        }
      }, {
        emailNotifications: 'all'
      }]
    };
    return this.find(query);
  }

  findUnreadByUserId(userId) {
    const query = {
      'u._id': userId,
      unread: {
        $gt: 0
      }
    };
    return this.find(query, {
      fields: {
        unread: 1
      }
    });
  }

  getMinimumLastSeenByRoomId(rid) {
    return this.db.findOne({
      rid
    }, {
      sort: {
        ls: 1
      },
      fields: {
        ls: 1
      }
    });
  } // UPDATE


  archiveByRoomId(roomId) {
    const query = {
      rid: roomId
    };
    const update = {
      $set: {
        alert: false,
        open: false,
        archived: true
      }
    };
    return this.update(query, update, {
      multi: true
    });
  }

  unarchiveByRoomId(roomId) {
    const query = {
      rid: roomId
    };
    const update = {
      $set: {
        alert: false,
        open: true,
        archived: false
      }
    };
    return this.update(query, update, {
      multi: true
    });
  }

  hideByRoomIdAndUserId(roomId, userId) {
    const query = {
      rid: roomId,
      'u._id': userId
    };
    const update = {
      $set: {
        alert: false,
        open: false
      }
    };
    return this.update(query, update);
  }

  openByRoomIdAndUserId(roomId, userId) {
    const query = {
      rid: roomId,
      'u._id': userId
    };
    const update = {
      $set: {
        open: true
      }
    };
    return this.update(query, update);
  }

  setAsReadByRoomIdAndUserId(roomId, userId) {
    const query = {
      rid: roomId,
      'u._id': userId
    };
    const update = {
      $set: {
        open: true,
        alert: false,
        unread: 0,
        userMentions: 0,
        groupMentions: 0,
        ls: new Date()
      }
    };
    return this.update(query, update);
  }

  setAsUnreadByRoomIdAndUserId(roomId, userId, firstMessageUnreadTimestamp) {
    const query = {
      rid: roomId,
      'u._id': userId
    };
    const update = {
      $set: {
        open: true,
        alert: true,
        ls: firstMessageUnreadTimestamp
      }
    };
    return this.update(query, update);
  }

  setCustomFieldsDirectMessagesByUserId(userId, fields) {
    const values = {};
    Object.keys(fields).forEach(key => {
      values[`customFields.${key}`] = fields[key];
    });
    const query = {
      'u._id': userId,
      't': 'd'
    };
    const update = {
      $set: values
    };
    const options = {
      'multi': true
    };
    return this.update(query, update, options);
  }

  setFavoriteByRoomIdAndUserId(roomId, userId, favorite) {
    if (favorite == null) {
      favorite = true;
    }

    const query = {
      rid: roomId,
      'u._id': userId
    };
    const update = {
      $set: {
        f: favorite
      }
    };
    return this.update(query, update);
  }

  updateNameAndAlertByRoomId(roomId, name, fname) {
    const query = {
      rid: roomId
    };
    const update = {
      $set: {
        name,
        fname,
        alert: true
      }
    };
    return this.update(query, update, {
      multi: true
    });
  }

  updateNameByRoomId(roomId, name) {
    const query = {
      rid: roomId
    };
    const update = {
      $set: {
        name
      }
    };
    return this.update(query, update, {
      multi: true
    });
  }

  setUserUsernameByUserId(userId, username) {
    const query = {
      'u._id': userId
    };
    const update = {
      $set: {
        'u.username': username
      }
    };
    return this.update(query, update, {
      multi: true
    });
  }

  setNameForDirectRoomsWithOldName(oldName, name) {
    const query = {
      name: oldName,
      t: 'd'
    };
    const update = {
      $set: {
        name
      }
    };
    return this.update(query, update, {
      multi: true
    });
  }

  incUnreadForRoomIdExcludingUserId(roomId, userId, inc) {
    if (inc == null) {
      inc = 1;
    }

    const query = {
      rid: roomId,
      'u._id': {
        $ne: userId
      }
    };
    const update = {
      $set: {
        alert: true,
        open: true
      },
      $inc: {
        unread: inc
      }
    };
    return this.update(query, update, {
      multi: true
    });
  }

  incGroupMentionsAndUnreadForRoomIdExcludingUserId(roomId, userId, incGroup = 1, incUnread = 1) {
    const query = {
      rid: roomId,
      'u._id': {
        $ne: userId
      }
    };
    const update = {
      $set: {
        alert: true,
        open: true
      },
      $inc: {
        unread: incUnread,
        groupMentions: incGroup
      }
    };
    return this.update(query, update, {
      multi: true
    });
  }

  incUserMentionsAndUnreadForRoomIdAndUserIds(roomId, userIds, incUser = 1, incUnread = 1) {
    const query = {
      rid: roomId,
      'u._id': {
        $in: userIds
      }
    };
    const update = {
      $set: {
        alert: true,
        open: true
      },
      $inc: {
        unread: incUnread,
        userMentions: incUser
      }
    };
    return this.update(query, update, {
      multi: true
    });
  }

  ignoreUser({
    _id,
    ignoredUser: ignored,
    ignore = true
  }) {
    const query = {
      _id
    };
    const update = {};

    if (ignore) {
      update.$addToSet = {
        ignored
      };
    } else {
      update.$pull = {
        ignored
      };
    }

    return this.update(query, update);
  }

  setAlertForRoomIdExcludingUserId(roomId, userId) {
    const query = {
      rid: roomId,
      'u._id': {
        $ne: userId
      },
      $or: [{
        alert: {
          $ne: true
        }
      }, {
        open: {
          $ne: true
        }
      }]
    };
    const update = {
      $set: {
        alert: true,
        open: true
      }
    };
    return this.update(query, update, {
      multi: true
    });
  }

  setBlockedByRoomId(rid, blocked, blocker) {
    const query = {
      rid,
      'u._id': blocked
    };
    const update = {
      $set: {
        blocked: true
      }
    };
    const query2 = {
      rid,
      'u._id': blocker
    };
    const update2 = {
      $set: {
        blocker: true
      }
    };
    return this.update(query, update) && this.update(query2, update2);
  }

  unsetBlockedByRoomId(rid, blocked, blocker) {
    const query = {
      rid,
      'u._id': blocked
    };
    const update = {
      $unset: {
        blocked: 1
      }
    };
    const query2 = {
      rid,
      'u._id': blocker
    };
    const update2 = {
      $unset: {
        blocker: 1
      }
    };
    return this.update(query, update) && this.update(query2, update2);
  }

  updateTypeByRoomId(roomId, type) {
    const query = {
      rid: roomId
    };
    const update = {
      $set: {
        t: type
      }
    };
    return this.update(query, update, {
      multi: true
    });
  }

  addRoleById(_id, role) {
    const query = {
      _id
    };
    const update = {
      $addToSet: {
        roles: role
      }
    };
    return this.update(query, update);
  }

  removeRoleById(_id, role) {
    const query = {
      _id
    };
    const update = {
      $pull: {
        roles: role
      }
    };
    return this.update(query, update);
  }

  setArchivedByUsername(username, archived) {
    const query = {
      t: 'd',
      name: username
    };
    const update = {
      $set: {
        archived
      }
    };
    return this.update(query, update, {
      multi: true
    });
  } // INSERT


  createWithRoomAndUser(room, user, extraData) {
    const subscription = {
      open: false,
      alert: false,
      unread: 0,
      userMentions: 0,
      groupMentions: 0,
      ts: room.ts,
      rid: room._id,
      name: room.name,
      fname: room.fname,
      customFields: room.customFields,
      t: room.t,
      u: {
        _id: user._id,
        username: user.username,
        name: user.name
      }
    };

    _.extend(subscription, extraData);

    return this.insert(subscription);
  } // REMOVE


  removeByUserId(userId) {
    const query = {
      'u._id': userId
    };
    return this.remove(query);
  }

  removeByRoomId(roomId) {
    const query = {
      rid: roomId
    };
    return this.remove(query);
  }

  removeByRoomIdAndUserId(roomId, userId) {
    const query = {
      rid: roomId,
      'u._id': userId
    };
    return this.remove(query);
  }

}

RocketChat.models.Subscriptions = new ModelSubscriptions('subscription', true);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"Uploads.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/server/models/Uploads.js                                                                    //
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
RocketChat.models.Uploads = new class extends RocketChat.models._Base {
  constructor() {
    super('uploads');
    this.model.before.insert((userId, doc) => {
      doc.instanceId = InstanceStatus.id();
    });
    this.tryEnsureIndex({
      'rid': 1
    });
    this.tryEnsureIndex({
      'uploadedAt': 1
    });
  }

  findNotHiddenFilesOfRoom(roomId, limit) {
    const fileQuery = {
      rid: roomId,
      complete: true,
      uploading: false,
      _hidden: {
        $ne: true
      }
    };
    const fileOptions = {
      limit,
      sort: {
        uploadedAt: -1
      },
      fields: {
        _id: 1,
        userId: 1,
        rid: 1,
        name: 1,
        description: 1,
        type: 1,
        url: 1,
        uploadedAt: 1
      }
    };
    return this.find(fileQuery, fileOptions);
  }

  insertFileInit(userId, store, file, extra) {
    const fileData = {
      userId,
      store,
      complete: false,
      uploading: true,
      progress: 0,
      extension: s.strRightBack(file.name, '.'),
      uploadedAt: new Date()
    };

    _.extend(fileData, file, extra);

    if (this.model.direct && this.model.direct.insert != null) {
      file = this.model.direct.insert(fileData);
    } else {
      file = this.insert(fileData);
    }

    return file;
  }

  updateFileComplete(fileId, userId, file) {
    let result;

    if (!fileId) {
      return;
    }

    const filter = {
      _id: fileId,
      userId
    };
    const update = {
      $set: {
        complete: true,
        uploading: false,
        progress: 1
      }
    };
    update.$set = _.extend(file, update.$set);

    if (this.model.direct && this.model.direct.update != null) {
      result = this.model.direct.update(filter, update);
    } else {
      result = this.update(filter, update);
    }

    return result;
  }

  deleteFile(fileId) {
    if (this.model.direct && this.model.direct.remove != null) {
      return this.model.direct.remove({
        _id: fileId
      });
    } else {
      return this.remove({
        _id: fileId
      });
    }
  }

}();
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"Users.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/server/models/Users.js                                                                      //
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

class ModelUsers extends RocketChat.models._Base {
  constructor() {
    super(...arguments);
    this.tryEnsureIndex({
      'roles': 1
    }, {
      sparse: 1
    });
    this.tryEnsureIndex({
      'name': 1
    });
    this.tryEnsureIndex({
      'lastLogin': 1
    });
    this.tryEnsureIndex({
      'status': 1
    });
    this.tryEnsureIndex({
      'active': 1
    }, {
      sparse: 1
    });
    this.tryEnsureIndex({
      'statusConnection': 1
    }, {
      sparse: 1
    });
    this.tryEnsureIndex({
      'type': 1
    });
    this.cache.ensureIndex('username', 'unique');
  }

  findOneByImportId(_id, options) {
    return this.findOne({
      importIds: _id
    }, options);
  }

  findOneByUsername(username, options) {
    if (typeof username === 'string') {
      username = new RegExp(`^${username}$`, 'i');
    }

    const query = {
      username
    };
    return this.findOne(query, options);
  }

  findOneByEmailAddress(emailAddress, options) {
    const query = {
      'emails.address': new RegExp(`^${s.escapeRegExp(emailAddress)}$`, 'i')
    };
    return this.findOne(query, options);
  }

  findOneAdmin(admin, options) {
    const query = {
      admin
    };
    return this.findOne(query, options);
  }

  findOneByIdAndLoginToken(_id, token, options) {
    const query = {
      _id,
      'services.resume.loginTokens.hashedToken': Accounts._hashLoginToken(token)
    };
    return this.findOne(query, options);
  }

  findOneById(userId) {
    const query = {
      _id: userId
    };
    return this.findOne(query);
  } // FIND


  findById(userId) {
    const query = {
      _id: userId
    };
    return this.find(query);
  }

  findUsersNotOffline(options) {
    const query = {
      username: {
        $exists: 1
      },
      status: {
        $in: ['online', 'away', 'busy']
      }
    };
    return this.find(query, options);
  }

  findByUsername(username, options) {
    const query = {
      username
    };
    return this.find(query, options);
  }

  findUsersByUsernamesWithHighlights(usernames, options) {
    if (this.useCache) {
      const result = {
        fetch() {
          return RocketChat.models.Users.getDynamicView('highlights').data().filter(record => usernames.indexOf(record.username) > -1);
        },

        count() {
          return result.fetch().length;
        },

        forEach(fn) {
          return result.fetch().forEach(fn);
        }

      };
      return result;
    }

    const query = {
      username: {
        $in: usernames
      },
      'settings.preferences.highlights.0': {
        $exists: true
      }
    };
    return this.find(query, options);
  }

  findActiveByUsernameOrNameRegexWithExceptions(searchTerm, exceptions, options) {
    if (exceptions == null) {
      exceptions = [];
    }

    if (options == null) {
      options = {};
    }

    if (!_.isArray(exceptions)) {
      exceptions = [exceptions];
    }

    const termRegex = new RegExp(s.escapeRegExp(searchTerm), 'i');
    const query = {
      $or: [{
        username: termRegex
      }, {
        name: termRegex
      }],
      active: true,
      type: {
        $in: ['user', 'bot']
      },
      $and: [{
        username: {
          $exists: true
        }
      }, {
        username: {
          $nin: exceptions
        }
      }]
    };
    return this.find(query, options);
  }

  findByActiveUsersExcept(searchTerm, exceptions, options) {
    if (exceptions == null) {
      exceptions = [];
    }

    if (options == null) {
      options = {};
    }

    if (!_.isArray(exceptions)) {
      exceptions = [exceptions];
    }

    const termRegex = new RegExp(s.escapeRegExp(searchTerm), 'i');

    const orStmt = _.reduce(RocketChat.settings.get('Accounts_SearchFields').trim().split(','), function (acc, el) {
      acc.push({
        [el.trim()]: termRegex
      });
      return acc;
    }, []);

    const query = {
      $and: [{
        active: true,
        $or: orStmt
      }, {
        username: {
          $exists: true,
          $nin: exceptions
        }
      }]
    }; // do not use cache

    return this._db.find(query, options);
  }

  findUsersByNameOrUsername(nameOrUsername, options) {
    const query = {
      username: {
        $exists: 1
      },
      $or: [{
        name: nameOrUsername
      }, {
        username: nameOrUsername
      }],
      type: {
        $in: ['user']
      }
    };
    return this.find(query, options);
  }

  findByUsernameNameOrEmailAddress(usernameNameOrEmailAddress, options) {
    const query = {
      $or: [{
        name: usernameNameOrEmailAddress
      }, {
        username: usernameNameOrEmailAddress
      }, {
        'emails.address': usernameNameOrEmailAddress
      }],
      type: {
        $in: ['user', 'bot']
      }
    };
    return this.find(query, options);
  }

  findLDAPUsers(options) {
    const query = {
      ldap: true
    };
    return this.find(query, options);
  }

  findCrowdUsers(options) {
    const query = {
      crowd: true
    };
    return this.find(query, options);
  }

  getLastLogin(options) {
    if (options == null) {
      options = {};
    }

    const query = {
      lastLogin: {
        $exists: 1
      }
    };
    options.sort = {
      lastLogin: -1
    };
    options.limit = 1;
    const [user] = this.find(query, options).fetch();
    return user && user.lastLogin;
  }

  findUsersByUsernames(usernames, options) {
    const query = {
      username: {
        $in: usernames
      }
    };
    return this.find(query, options);
  }

  findUsersByIds(ids, options) {
    const query = {
      _id: {
        $in: ids
      }
    };
    return this.find(query, options);
  } // UPDATE


  addImportIds(_id, importIds) {
    importIds = [].concat(importIds);
    const query = {
      _id
    };
    const update = {
      $addToSet: {
        importIds: {
          $each: importIds
        }
      }
    };
    return this.update(query, update);
  }

  updateLastLoginById(_id) {
    const update = {
      $set: {
        lastLogin: new Date()
      }
    };
    return this.update(_id, update);
  }

  setServiceId(_id, serviceName, serviceId) {
    const update = {
      $set: {}
    };
    const serviceIdKey = `services.${serviceName}.id`;
    update.$set[serviceIdKey] = serviceId;
    return this.update(_id, update);
  }

  setUsername(_id, username) {
    const update = {
      $set: {
        username
      }
    };
    return this.update(_id, update);
  }

  setEmail(_id, email) {
    const update = {
      $set: {
        emails: [{
          address: email,
          verified: false
        }]
      }
    };
    return this.update(_id, update);
  }

  setEmailVerified(_id, email) {
    const query = {
      _id,
      emails: {
        $elemMatch: {
          address: email,
          verified: false
        }
      }
    };
    const update = {
      $set: {
        'emails.$.verified': true
      }
    };
    return this.update(query, update);
  }

  setName(_id, name) {
    const update = {
      $set: {
        name
      }
    };
    return this.update(_id, update);
  }

  setCustomFields(_id, fields) {
    const values = {};
    Object.keys(fields).forEach(key => {
      values[`customFields.${key}`] = fields[key];
    });
    const update = {
      $set: values
    };
    return this.update(_id, update);
  }

  setAvatarOrigin(_id, origin) {
    const update = {
      $set: {
        avatarOrigin: origin
      }
    };
    return this.update(_id, update);
  }

  unsetAvatarOrigin(_id) {
    const update = {
      $unset: {
        avatarOrigin: 1
      }
    };
    return this.update(_id, update);
  }

  setUserActive(_id, active) {
    if (active == null) {
      active = true;
    }

    const update = {
      $set: {
        active
      }
    };
    return this.update(_id, update);
  }

  setAllUsersActive(active) {
    const update = {
      $set: {
        active
      }
    };
    return this.update({}, update, {
      multi: true
    });
  }

  unsetLoginTokens(_id) {
    const update = {
      $set: {
        'services.resume.loginTokens': []
      }
    };
    return this.update(_id, update);
  }

  unsetRequirePasswordChange(_id) {
    const update = {
      $unset: {
        'requirePasswordChange': true,
        'requirePasswordChangeReason': true
      }
    };
    return this.update(_id, update);
  }

  resetPasswordAndSetRequirePasswordChange(_id, requirePasswordChange, requirePasswordChangeReason) {
    const update = {
      $unset: {
        'services.password': 1
      },
      $set: {
        requirePasswordChange,
        requirePasswordChangeReason
      }
    };
    return this.update(_id, update);
  }

  setLanguage(_id, language) {
    const update = {
      $set: {
        language
      }
    };
    return this.update(_id, update);
  }

  setProfile(_id, profile) {
    const update = {
      $set: {
        'settings.profile': profile
      }
    };
    return this.update(_id, update);
  }

  clearSettings(_id) {
    const update = {
      $set: {
        settings: {}
      }
    };
    return this.update(_id, update);
  }

  setPreferences(_id, preferences) {
    const settings = Object.assign({}, ...Object.keys(preferences).map(key => {
      return {
        [`settings.preferences.${key}`]: preferences[key]
      };
    }));
    const update = {
      $set: settings
    };
    return this.update(_id, update);
  }

  setUtcOffset(_id, utcOffset) {
    const query = {
      _id,
      utcOffset: {
        $ne: utcOffset
      }
    };
    const update = {
      $set: {
        utcOffset
      }
    };
    return this.update(query, update);
  }

  saveUserById(_id, data) {
    const setData = {};
    const unsetData = {};

    if (data.name != null) {
      if (!_.isEmpty(s.trim(data.name))) {
        setData.name = s.trim(data.name);
      } else {
        unsetData.name = 1;
      }
    }

    if (data.email != null) {
      if (!_.isEmpty(s.trim(data.email))) {
        setData.emails = [{
          address: s.trim(data.email)
        }];
      } else {
        unsetData.emails = 1;
      }
    }

    if (data.phone != null) {
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

  setReason(_id, reason) {
    const update = {
      $set: {
        reason
      }
    };
    return this.update(_id, update);
  }

  unsetReason(_id) {
    const update = {
      $unset: {
        reason: true
      }
    };
    return this.update(_id, update);
  }

  addBannerById(_id, banner) {
    const update = {
      $set: {
        [`banners.${banner.id}`]: banner
      }
    };
    return this.update({
      _id
    }, update);
  }

  removeBannerById(_id, banner) {
    const update = {
      $unset: {
        [`banners.${banner.id}`]: true
      }
    };
    return this.update({
      _id
    }, update);
  } // INSERT


  create(data) {
    const user = {
      createdAt: new Date(),
      avatarOrigin: 'none'
    };

    _.extend(user, data);

    return this.insert(user);
  } // REMOVE


  removeById(_id) {
    return this.remove(_id);
  }
  /*
  Find users to send a message by email if:
  - he is not online
  - has a verified email
  - has not disabled email notifications
  - `active` is equal to true (false means they were deactivated and can't login)
  */


  getUsersToSendOfflineEmail(usersIds) {
    const query = {
      _id: {
        $in: usersIds
      },
      active: true,
      status: 'offline',
      statusConnection: {
        $ne: 'online'
      },
      'emails.verified': true
    };
    const options = {
      fields: {
        name: 1,
        username: 1,
        emails: 1,
        'settings.preferences.emailNotificationMode': 1,
        language: 1
      }
    };
    return this.find(query, options);
  }

}

RocketChat.models.Users = new ModelUsers(Meteor.users, true);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"ExportOperations.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/server/models/ExportOperations.js                                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
RocketChat.models.ExportOperations = new class ModelExportOperations extends RocketChat.models._Base {
  constructor() {
    super('export_operations');
    this.tryEnsureIndex({
      'userId': 1
    });
    this.tryEnsureIndex({
      'status': 1
    });
  } // FIND


  findById(id) {
    const query = {
      _id: id
    };
    return this.find(query);
  }

  findLastOperationByUser(userId, fullExport = false, options = {}) {
    const query = {
      userId,
      fullExport
    };
    options.sort = {
      'createdAt': -1
    };
    return this.findOne(query, options);
  }

  findPendingByUser(userId, options) {
    const query = {
      userId,
      status: {
        $nin: ['completed']
      }
    };
    return this.find(query, options);
  }

  findAllPending(options) {
    const query = {
      status: {
        $nin: ['completed']
      }
    };
    return this.find(query, options);
  } // UPDATE


  updateOperation(data) {
    const update = {
      $set: {
        roomList: data.roomList,
        status: data.status,
        fileList: data.fileList,
        generatedFile: data.generatedFile
      }
    };
    return this.update(data._id, update);
  } // INSERT


  create(data) {
    const exportOperation = {
      createdAt: new Date()
    };

    _.extend(exportOperation, data);

    return this.insert(exportOperation);
  } // REMOVE


  removeById(_id) {
    return this.remove(_id);
  }

}();
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"UserDataFiles.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/server/models/UserDataFiles.js                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
RocketChat.models.UserDataFiles = new class ModelUserDataFiles extends RocketChat.models._Base {
  constructor() {
    super('user_data_files');
    this.tryEnsureIndex({
      'userId': 1
    });
  } // FIND


  findById(id) {
    const query = {
      _id: id
    };
    return this.find(query);
  }

  findLastFileByUser(userId, options = {}) {
    const query = {
      userId
    };
    options.sort = {
      '_updatedAt': -1
    };
    return this.findOne(query, options);
  } // INSERT


  create(data) {
    const userDataFile = {
      createdAt: new Date()
    };

    _.extend(userDataFile, data);

    return this.insert(userDataFile);
  } // REMOVE


  removeById(_id) {
    return this.remove(_id);
  }

}();
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"_BaseCache.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/server/models/_BaseCache.js                                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
let loki;
module.watch(require("lokijs"), {
  default(v) {
    loki = v;
  }

}, 1);
let EventEmitter;
module.watch(require("events"), {
  EventEmitter(v) {
    EventEmitter = v;
  }

}, 2);
let objectPath;
module.watch(require("object-path"), {
  default(v) {
    objectPath = v;
  }

}, 3);
const logger = new Logger('BaseCache');
const lokiEq = loki.LokiOps.$eq;
const lokiNe = loki.LokiOps.$ne;

loki.LokiOps.$eq = function (a, b) {
  if (Array.isArray(a)) {
    return a.indexOf(b) !== -1;
  }

  return lokiEq(a, b);
};

loki.LokiOps.$ne = function (a, b) {
  if (Array.isArray(a)) {
    return a.indexOf(b) === -1;
  }

  return lokiNe(a, b);
};

const lokiIn = loki.LokiOps.$in;

loki.LokiOps.$in = function (a, b) {
  if (Array.isArray(a)) {
    return a.some(subA => lokiIn(subA, b));
  }

  return lokiIn(a, b);
};

loki.LokiOps.$nin = function (a, b) {
  return !loki.LokiOps.$in(a, b);
};

loki.LokiOps.$all = function (a, b) {
  return b.every(subB => a.includes(subB));
};

loki.LokiOps.$exists = function (a, b) {
  if (b) {
    return loki.LokiOps.$ne(a, undefined);
  }

  return loki.LokiOps.$eq(a, undefined);
};

loki.LokiOps.$elemMatch = function (a, b) {
  return _.findWhere(a, b);
};

const ignore = ['emit', 'load', 'on', 'addToAllIndexes'];

function traceMethodCalls(target) {
  target._stats = {};

  for (const property in target) {
    if (typeof target[property] === 'function' && ignore.indexOf(property) === -1) {
      target._stats[property] = {
        calls: 0,
        time: 0,
        avg: 0
      };
      const origMethod = target[property];

      target[property] = function (...args) {
        if (target.loaded !== true) {
          return origMethod.apply(target, args);
        }

        const startTime = RocketChat.statsTracker.now();
        const result = origMethod.apply(target, args);
        const time = Math.round(RocketChat.statsTracker.now() - startTime) / 1000;
        target._stats[property].time += time;
        target._stats[property].calls++;
        target._stats[property].avg = target._stats[property].time / target._stats[property].calls;
        return result;
      };
    }
  }

  setInterval(function () {
    for (const property in target._stats) {
      if (target._stats.hasOwnProperty(property) && target._stats[property].time > 0) {
        const tags = [`property:${property}`, `collection:${target.collectionName}`];
        RocketChat.statsTracker.timing('cache.methods.time', target._stats[property].avg, tags);
        RocketChat.statsTracker.increment('cache.methods.totalTime', target._stats[property].time, tags);
        RocketChat.statsTracker.increment('cache.methods.count', target._stats[property].calls, tags);
        target._stats[property].avg = 0;
        target._stats[property].time = 0;
        target._stats[property].calls = 0;
      }
    }
  }, 10000);

  target._getStatsAvg = function () {
    const stats = [];

    for (const property in target._stats) {
      if (target._stats.hasOwnProperty(property)) {
        stats.push([Math.round(target._stats[property].avg * 100) / 100, property]);
      }
    }

    return _.sortBy(stats, function (record) {
      return record[0];
    });
  };
}

class Adapter {
  loadDatabase()
  /*dbname, callback*/
  {}

  saveDatabase()
  /*dbname, dbstring, callback*/
  {}

  deleteDatabase()
  /*dbname, callback*/
  {}

}

const db = new loki('rocket.chat.json', {
  adapter: Adapter
});

class ModelsBaseCache extends EventEmitter {
  constructor(model) {
    super();
    traceMethodCalls(this);
    this.indexes = {};
    this.ignoreUpdatedFields = ['_updatedAt'];
    this.query = {};
    this.options = {};
    this.ensureIndex('_id', 'unique');
    this.joins = {};
    this.on('inserted', (...args) => {
      this.emit('changed', 'inserted', ...args);
    });
    this.on('removed', (...args) => {
      this.emit('changed', 'removed', ...args);
    });
    this.on('updated', (...args) => {
      this.emit('changed', 'updated', ...args);
    });
    this.on('beforeinsert', (...args) => {
      this.emit('beforechange', 'inserted', ...args);
    });
    this.on('beforeremove', (...args) => {
      this.emit('beforechange', 'removed', ...args);
    });
    this.on('beforeupdate', (...args) => {
      this.emit('beforechange', 'updated', ...args);
    });
    this.on('inserted', (...args) => {
      this.emit('sync', 'inserted', ...args);
    });
    this.on('updated', (...args) => {
      this.emit('sync', 'updated', ...args);
    });
    this.on('beforeremove', (...args) => {
      this.emit('sync', 'removed', ...args);
    });
    this.db = db;
    this.model = model;
    this.collectionName = this.model._db.collectionName;
    this.collection = this.db.addCollection(this.collectionName);
  }

  hasOne(join, {
    field,
    link
  }) {
    this.join({
      join,
      field,
      link,
      multi: false
    });
  }

  hasMany(join, {
    field,
    link
  }) {
    this.join({
      join,
      field,
      link,
      multi: true
    });
  }

  join({
    join,
    field,
    link,
    multi
  }) {
    if (!RocketChat.models[join]) {
      console.log(`Invalid cache model ${join}`);
      return;
    }

    RocketChat.models[join].cache.on('inserted', record => {
      this.processRemoteJoinInserted({
        join,
        field,
        link,
        multi,
        record
      });
    });
    RocketChat.models[join].cache.on('beforeupdate', (record, diff) => {
      if (diff[link.remote]) {
        this.processRemoteJoinRemoved({
          join,
          field,
          link,
          multi,
          record
        });
      }
    });
    RocketChat.models[join].cache.on('updated', (record, diff) => {
      if (diff[link.remote]) {
        this.processRemoteJoinInserted({
          join,
          field,
          link,
          multi,
          record
        });
      }
    });
    RocketChat.models[join].cache.on('removed', record => {
      this.processRemoteJoinRemoved({
        join,
        field,
        link,
        multi,
        record
      });
    });
    this.on('inserted', localRecord => {
      this.processLocalJoinInserted({
        join,
        field,
        link,
        multi,
        localRecord
      });
    });
    this.on('beforeupdate', (localRecord, diff) => {
      if (diff[link.local]) {
        if (multi === true) {
          localRecord[field] = [];
        } else {
          localRecord[field] = undefined;
        }
      }
    });
    this.on('updated', (localRecord, diff) => {
      if (diff[link.local]) {
        this.processLocalJoinInserted({
          join,
          field,
          link,
          multi,
          localRecord
        });
      }
    });
  }

  processRemoteJoinInserted({
    field,
    link,
    multi,
    record
  }) {
    let localRecords = this._findByIndex(link.local, objectPath.get(record, link.remote));

    if (!localRecords) {
      return;
    }

    if (!Array.isArray(localRecords)) {
      localRecords = [localRecords];
    }

    for (let i = 0; i < localRecords.length; i++) {
      const localRecord = localRecords[i];

      if (multi === true && !localRecord[field]) {
        localRecord[field] = [];
      }

      if (typeof link.where === 'function' && link.where(localRecord, record) === false) {
        continue;
      }

      let mutableRecord = record;

      if (typeof link.transform === 'function') {
        mutableRecord = link.transform(localRecord, mutableRecord);
      }

      if (multi === true) {
        localRecord[field].push(mutableRecord);
      } else {
        localRecord[field] = mutableRecord;
      }

      this.emit(`join:${field}:inserted`, localRecord, mutableRecord);
      this.emit(`join:${field}:changed`, 'inserted', localRecord, mutableRecord);
    }
  }

  processLocalJoinInserted({
    join,
    field,
    link,
    multi,
    localRecord
  }) {
    let records = RocketChat.models[join].cache._findByIndex(link.remote, objectPath.get(localRecord, link.local));

    if (!Array.isArray(records)) {
      records = [records];
    }

    for (let i = 0; i < records.length; i++) {
      let record = records[i];

      if (typeof link.where === 'function' && link.where(localRecord, record) === false) {
        continue;
      }

      if (typeof link.transform === 'function') {
        record = link.transform(localRecord, record);
      }

      if (multi === true) {
        localRecord[field].push(record);
      } else {
        localRecord[field] = record;
      }

      this.emit(`join:${field}:inserted`, localRecord, record);
      this.emit(`join:${field}:changed`, 'inserted', localRecord, record);
    }
  }

  processRemoteJoinRemoved({
    field,
    link,
    multi,
    record
  }) {
    let localRecords = this._findByIndex(link.local, objectPath.get(record, link.remote));

    if (!localRecords) {
      return;
    }

    if (!Array.isArray(localRecords)) {
      localRecords = [localRecords];
    }

    for (let i = 0; i < localRecords.length; i++) {
      const localRecord = localRecords[i];

      if (multi === true) {
        if (Array.isArray(localRecord[field])) {
          if (typeof link.remove === 'function') {
            link.remove(localRecord[field], record);
          } else if (localRecord[field].indexOf(record) > -1) {
            localRecord[field].splice(localRecord[field].indexOf(record), 1);
          }
        }
      } else {
        localRecord[field] = undefined;
      }

      this.emit(`join:${field}:removed`, localRecord, record);
      this.emit(`join:${field}:changed`, 'removed', localRecord, record);
    }
  }

  ensureIndex(fields, type = 'array') {
    if (!Array.isArray(fields)) {
      fields = [fields];
    }

    this.indexes[fields.join(',')] = {
      type,
      fields,
      data: {}
    };
  }

  addToAllIndexes(record) {
    for (const indexName in this.indexes) {
      if (this.indexes.hasOwnProperty(indexName)) {
        this.addToIndex(indexName, record);
      }
    }
  }

  addToIndex(indexName, record) {
    const index = this.indexes[indexName];

    if (!index) {
      console.error(`Index not defined ${indexName}`);
      return;
    }

    const keys = [];

    for (const field of index.fields) {
      keys.push(objectPath.get(record, field));
    }

    const key = keys.join('|');

    if (index.type === 'unique') {
      index.data[key] = record;
      return;
    }

    if (index.type === 'array') {
      if (!index.data[key]) {
        index.data[key] = [];
      }

      index.data[key].push(record);
      return;
    }
  }

  removeFromAllIndexes(record) {
    for (const indexName in this.indexes) {
      if (this.indexes.hasOwnProperty(indexName)) {
        this.removeFromIndex(indexName, record);
      }
    }
  }

  removeFromIndex(indexName, record) {
    const index = this.indexes[indexName];

    if (!this.indexes[indexName]) {
      console.error(`Index not defined ${indexName}`);
      return;
    }

    if (!index.data) {
      return;
    }

    let key = [];

    for (const field of index.fields) {
      key.push(objectPath.get(record, field));
    }

    key = key.join('|');

    if (index.type === 'unique') {
      index.data[key] = undefined;
      return;
    }

    if (index.type === 'array') {
      if (!index.data[key]) {
        return;
      }

      const i = index.data[key].indexOf(record);

      if (i > -1) {
        index.data[key].splice(i, 1);
      }

      return;
    }
  }

  _findByIndex(index, keys) {
    const key = [].concat(keys).join('|');

    if (!this.indexes[index]) {
      return;
    }

    if (this.indexes[index].data) {
      const result = this.indexes[index].data[key];

      if (result) {
        return result;
      }
    }

    if (this.indexes[index].type === 'array') {
      return [];
    }
  }

  findByIndex(index, keys, options = {}) {
    return {
      fetch: () => {
        return this.processQueryOptionsOnResult(this._findByIndex(index, keys), options);
      },
      count: () => {
        const records = this.findByIndex(index, keys, options).fetch();

        if (Array.isArray(records)) {
          return records.length;
        }

        return !records ? 0 : 1;
      },
      forEach: fn => {
        const records = this.findByIndex(index, keys, options).fetch();

        if (Array.isArray(records)) {
          return records.forEach(fn);
        }

        if (records) {
          return fn(records);
        }
      }
    };
  }

  load() {
    if (this.model._useCache === false) {
      return;
    }

    console.log('Will load cache for', this.collectionName);
    this.emit('beforeload');
    this.loaded = false;
    const time = RocketChat.statsTracker.now();
    const data = this.model.db.find(this.query, this.options).fetch();

    for (let i = 0; i < data.length; i++) {
      this.insert(data[i]);
    }

    console.log(String(data.length), 'records load from', this.collectionName);
    RocketChat.statsTracker.timing('cache.load', RocketChat.statsTracker.now() - time, [`collection:${this.collectionName}`]);
    this.startSync();
    this.loaded = true;
    this.emit('afterload');
  }

  startSync() {
    if (this.model._useCache === false) {
      return;
    }

    this.model._db.on('change', ({
      action,
      id,
      data
      /*, oplog*/

    }) => {
      switch (action) {
        case 'insert':
          data._id = id;
          this.insert(data);
          break;

        case 'remove':
          this.removeById(id);
          break;

        case 'update:record':
          this.updateDiffById(id, data);
          break;

        case 'update:diff':
          this.updateDiffById(id, data);
          break;

        case 'update:query':
          this.update(data.query, data.update, data.options);
          break;
      }
    });
  }

  processQueryOptionsOnResult(result, options = {}) {
    if (result === undefined || result === null) {
      return undefined;
    }

    if (Array.isArray(result)) {
      if (options.sort) {
        result = result.sort((a, b) => {
          let r = 0;

          for (const field in options.sort) {
            if (options.sort.hasOwnProperty(field)) {
              const direction = options.sort[field];
              let valueA;
              let valueB;

              if (field.indexOf('.') > -1) {
                valueA = objectPath.get(a, field);
                valueB = objectPath.get(b, field);
              } else {
                valueA = a[field];
                valueB = b[field];
              }

              if (valueA > valueB) {
                r = direction;
                break;
              }

              if (valueA < valueB) {
                r = -direction;
                break;
              }
            }
          }

          return r;
        });
      }

      if (typeof options.skip === 'number') {
        result.splice(0, options.skip);
      }

      if (typeof options.limit === 'number' && options.limit !== 0) {
        result.splice(options.limit);
      }
    }

    if (!options.fields) {
      options.fields = {};
    }

    const fieldsToRemove = [];
    const fieldsToGet = [];

    for (const field in options.fields) {
      if (options.fields.hasOwnProperty(field)) {
        if (options.fields[field] === 0) {
          fieldsToRemove.push(field);
        } else if (options.fields[field] === 1) {
          fieldsToGet.push(field);
        }
      }
    }

    if (fieldsToRemove.length > 0 && fieldsToGet.length > 0) {
      console.warn('Can\'t mix remove and get fields');
      fieldsToRemove.splice(0, fieldsToRemove.length);
    }

    if (fieldsToGet.length > 0 && fieldsToGet.indexOf('_id') === -1) {
      fieldsToGet.push('_id');
    }

    const pickFields = (obj, fields) => {
      const picked = {};
      fields.forEach(field => {
        if (field.indexOf('.') !== -1) {
          objectPath.set(picked, field, objectPath.get(obj, field));
        } else {
          picked[field] = obj[field];
        }
      });
      return picked;
    };

    if (fieldsToRemove.length > 0 || fieldsToGet.length > 0) {
      if (Array.isArray(result)) {
        result = result.map(record => {
          if (fieldsToRemove.length > 0) {
            return _.omit(record, ...fieldsToRemove);
          }

          if (fieldsToGet.length > 0) {
            return pickFields(record, fieldsToGet);
          }
        });
      } else {
        if (fieldsToRemove.length > 0) {
          return _.omit(result, ...fieldsToRemove);
        }

        if (fieldsToGet.length > 0) {
          return pickFields(result, fieldsToGet);
        }
      }
    }

    return result;
  }

  processQuery(query, parentField) {
    if (!query) {
      return query;
    }

    if (Match.test(query, String)) {
      return {
        _id: query
      };
    }

    if (Object.keys(query).length > 1 && parentField !== '$elemMatch') {
      const and = [];

      for (const field in query) {
        if (query.hasOwnProperty(field)) {
          and.push({
            [field]: query[field]
          });
        }
      }

      query = {
        $and: and
      };
    }

    for (const field in query) {
      if (query.hasOwnProperty(field)) {
        const value = query[field];

        if (value instanceof RegExp && field !== '$regex') {
          query[field] = {
            $regex: value
          };
        }

        if (field === '$and' || field === '$or') {
          query[field] = value.map(subValue => {
            return this.processQuery(subValue, field);
          });
        }

        if (Match.test(value, Object) && Object.keys(value).length > 0) {
          query[field] = this.processQuery(value, field);
        }
      }
    }

    return query;
  }

  find(query, options = {}) {
    return {
      fetch: () => {
        try {
          query = this.processQuery(query);
          return this.processQueryOptionsOnResult(this.collection.find(query), options);
        } catch (e) {
          console.error('Exception on cache find for', this.collectionName);
          console.error('Query:', JSON.stringify(query, null, 2));
          console.error('Options:', JSON.stringify(options, null, 2));
          console.error(e.stack);
          throw e;
        }
      },
      count: () => {
        try {
          query = this.processQuery(query);
          const {
            limit,
            skip
          } = options;
          return this.processQueryOptionsOnResult(this.collection.find(query), {
            limit,
            skip
          }).length;
        } catch (e) {
          console.error('Exception on cache find for', this.collectionName);
          console.error('Query:', JSON.stringify(query, null, 2));
          console.error('Options:', JSON.stringify(options, null, 2));
          console.error(e.stack);
          throw e;
        }
      },
      forEach: fn => {
        return this.find(query, options).fetch().forEach(fn);
      },
      observe: obj => {
        logger.debug(this.collectionName, 'Falling back observe to model with query:', query);
        return this.model.db.find(...arguments).observe(obj);
      },
      observeChanges: obj => {
        logger.debug(this.collectionName, 'Falling back observeChanges to model with query:', query);
        return this.model.db.find(...arguments).observeChanges(obj);
      },
      _publishCursor: (cursor, sub, collection) => {
        logger.debug(this.collectionName, 'Falling back _publishCursor to model with query:', query);
        return this.model.db.find(...arguments)._publishCursor(cursor, sub, collection);
      }
    };
  }

  findOne(query, options) {
    try {
      query = this.processQuery(query);
      return this.processQueryOptionsOnResult(this.collection.findOne(query), options);
    } catch (e) {
      console.error('Exception on cache findOne for', this.collectionName);
      console.error('Query:', JSON.stringify(query, null, 2));
      console.error('Options:', JSON.stringify(options, null, 2));
      console.error(e.stack);
      throw e;
    }
  }

  findOneById(_id, options) {
    return this.findByIndex('_id', _id, options).fetch();
  }

  findOneByIds(ids, options) {
    const query = this.processQuery({
      _id: {
        $in: ids
      }
    });
    return this.processQueryOptionsOnResult(this.collection.findOne(query), options);
  }

  findWhere(query, options) {
    query = this.processQuery(query);
    return this.processQueryOptionsOnResult(this.collection.findWhere(query), options);
  }

  addDynamicView() {
    return this.collection.addDynamicView(...arguments);
  }

  getDynamicView() {
    return this.collection.getDynamicView(...arguments);
  }

  insert(record) {
    if (Array.isArray(record)) {
      for (const item of record) {
        this.insert(item);
      }
    } else {
      // TODO remove - ignore updates in room.usernames
      if (this.collectionName === 'rocketchat_room' && record.usernames) {
        delete record.usernames;
      }

      this.emit('beforeinsert', record);
      this.addToAllIndexes(record);
      this.collection.insert(record);
      this.emit('inserted', record);
    }
  }

  updateDiffById(id, diff) {
    // TODO remove - ignore updates in room.usernames
    if (this.collectionName === 'rocketchat_room' && diff.usernames) {
      delete diff.usernames;
    }

    const record = this._findByIndex('_id', id);

    if (!record) {
      console.error('Cache.updateDiffById: No record', this.collectionName, id, diff);
      return;
    }

    this.removeFromAllIndexes(record);

    const updatedFields = _.without(Object.keys(diff), ...this.ignoreUpdatedFields);

    if (updatedFields.length > 0) {
      this.emit('beforeupdate', record, diff);
    }

    for (const key in diff) {
      if (diff.hasOwnProperty(key)) {
        objectPath.set(record, key, diff[key]);
      }
    }

    this.collection.update(record);
    this.addToAllIndexes(record);

    if (updatedFields.length > 0) {
      this.emit('updated', record, diff);
    }
  }

  updateRecord(record, update) {
    // TODO remove - ignore updates in room.usernames
    if (this.collectionName === 'rocketchat_room' && (record.usernames || record.$set && record.$set.usernames)) {
      delete record.usernames;

      if (record.$set && record.$set.usernames) {
        delete record.$set.usernames;
      }
    }

    this.removeFromAllIndexes(record);
    const topLevelFields = Object.keys(update).map(field => field.split('.')[0]);

    const updatedFields = _.without(topLevelFields, ...this.ignoreUpdatedFields);

    if (updatedFields.length > 0) {
      this.emit('beforeupdate', record, record);
    }

    if (update.$set) {
      _.each(update.$set, (value, field) => {
        objectPath.set(record, field, value);
      });
    }

    if (update.$unset) {
      _.each(update.$unset, (value, field) => {
        objectPath.del(record, field);
      });
    }

    if (update.$min) {
      _.each(update.$min, (value, field) => {
        const curValue = objectPath.get(record, field);

        if (curValue === undefined || value < curValue) {
          objectPath.set(record, field, value);
        }
      });
    }

    if (update.$max) {
      _.each(update.$max, (value, field) => {
        const curValue = objectPath.get(record, field);

        if (curValue === undefined || value > curValue) {
          objectPath.set(record, field, value);
        }
      });
    }

    if (update.$inc) {
      _.each(update.$inc, (value, field) => {
        let curValue = objectPath.get(record, field);

        if (curValue === undefined) {
          curValue = value;
        } else {
          curValue += value;
        }

        objectPath.set(record, field, curValue);
      });
    }

    if (update.$mul) {
      _.each(update.$mul, (value, field) => {
        let curValue = objectPath.get(record, field);

        if (curValue === undefined) {
          curValue = 0;
        } else {
          curValue *= value;
        }

        objectPath.set(record, field, curValue);
      });
    }

    if (update.$rename) {
      _.each(update.$rename, (value, field) => {
        const curValue = objectPath.get(record, field);

        if (curValue !== undefined) {
          objectPath.set(record, value, curValue);
          objectPath.del(record, field);
        }
      });
    }

    if (update.$pullAll) {
      _.each(update.$pullAll, (value, field) => {
        let curValue = objectPath.get(record, field);

        if (Array.isArray(curValue)) {
          curValue = _.difference(curValue, value);
          objectPath.set(record, field, curValue);
        }
      });
    }

    if (update.$pop) {
      _.each(update.$pop, (value, field) => {
        const curValue = objectPath.get(record, field);

        if (Array.isArray(curValue)) {
          if (value === -1) {
            curValue.shift();
          } else {
            curValue.pop();
          }

          objectPath.set(record, field, curValue);
        }
      });
    }

    if (update.$addToSet) {
      _.each(update.$addToSet, (value, field) => {
        let curValue = objectPath.get(record, field);

        if (curValue === undefined) {
          curValue = [];
        }

        if (Array.isArray(curValue)) {
          const length = curValue.length;

          if (value && value.$each && Array.isArray(value.$each)) {
            for (const valueItem of value.$each) {
              if (curValue.indexOf(valueItem) === -1) {
                curValue.push(valueItem);
              }
            }
          } else if (curValue.indexOf(value) === -1) {
            curValue.push(value);
          }

          if (curValue.length > length) {
            objectPath.set(record, field, curValue);
          }
        }
      });
    }

    this.collection.update(record);
    this.addToAllIndexes(record);

    if (updatedFields.length > 0) {
      this.emit('updated', record, record);
    }
  }

  update(query, update, options = {}) {
    let records = options.multi ? this.find(query).fetch() : this.findOne(query) || [];

    if (!Array.isArray(records)) {
      records = [records];
    }

    for (const record of records) {
      this.updateRecord(record, update);
    }
  }

  removeById(id) {
    const record = this._findByIndex('_id', id);

    if (record) {
      this.emit('beforeremove', record);
      this.collection.removeWhere({
        _id: id
      });
      this.removeFromAllIndexes(record);
      this.emit('removed', record);
    }
  }

}

module.exportDefault(ModelsBaseCache);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"_BaseDb.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/server/models/_BaseDb.js                                                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
let EventEmitter;
module.watch(require("events"), {
  EventEmitter(v) {
    EventEmitter = v;
  }

}, 1);
const baseName = 'rocketchat_';
const trash = new Mongo.Collection(`${baseName}_trash`);

try {
  trash._ensureIndex({
    collection: 1
  });

  trash._ensureIndex({
    _deletedAt: 1
  }, {
    expireAfterSeconds: 60 * 60 * 24 * 30
  });
} catch (e) {
  console.log(e);
}

const isOplogAvailable = MongoInternals.defaultRemoteCollectionDriver().mongo._oplogHandle && !!MongoInternals.defaultRemoteCollectionDriver().mongo._oplogHandle.onOplogEntry;
let isOplogEnabled = isOplogAvailable;
RocketChat.settings.get('Force_Disable_OpLog_For_Cache', (key, value) => {
  isOplogEnabled = isOplogAvailable && value === false;
});

class ModelsBaseDb extends EventEmitter {
  constructor(model, baseModel) {
    super();

    if (Match.test(model, String)) {
      this.name = model;
      this.collectionName = this.baseName + this.name;
      this.model = new Mongo.Collection(this.collectionName);
    } else {
      this.name = model._name;
      this.collectionName = this.name;
      this.model = model;
    }

    this.baseModel = baseModel;
    this.wrapModel(); // When someone start listening for changes we start oplog if available

    this.once('newListener', (event
    /*, listener*/
    ) => {
      if (event === 'change') {
        if (isOplogEnabled) {
          const query = {
            collection: this.collectionName
          };

          MongoInternals.defaultRemoteCollectionDriver().mongo._oplogHandle.onOplogEntry(query, this.processOplogRecord.bind(this));

          MongoInternals.defaultRemoteCollectionDriver().mongo._oplogHandle._defineTooFarBehind(Number.MAX_SAFE_INTEGER);
        }
      }
    });
    this.tryEnsureIndex({
      '_updatedAt': 1
    });
  }

  get baseName() {
    return baseName;
  }

  setUpdatedAt(record = {}) {
    // TODO: Check if this can be deleted, Rodrigo does not rememebr WHY he added it. So he removed it to fix issue #5541
    // setUpdatedAt(record = {}, checkQuery = false, query) {
    // if (checkQuery === true) {
    // 	if (!query || Object.keys(query).length === 0) {
    // 		throw new Meteor.Error('Models._Base: Empty query');
    // 	}
    // }
    if (/(^|,)\$/.test(Object.keys(record).join(','))) {
      record.$set = record.$set || {};
      record.$set._updatedAt = new Date();
    } else {
      record._updatedAt = new Date();
    }

    return record;
  }

  wrapModel() {
    this.originals = {
      insert: this.model.insert.bind(this.model),
      update: this.model.update.bind(this.model),
      remove: this.model.remove.bind(this.model)
    };
    const self = this;

    this.model.insert = function () {
      return self.insert(...arguments);
    };

    this.model.update = function () {
      return self.update(...arguments);
    };

    this.model.remove = function () {
      return self.remove(...arguments);
    };
  }

  find() {
    return this.model.find(...arguments);
  }

  findOne() {
    return this.model.findOne(...arguments);
  }

  findOneById(_id, options) {
    return this.model.findOne({
      _id
    }, options);
  }

  findOneByIds(ids, options) {
    return this.model.findOne({
      _id: {
        $in: ids
      }
    }, options);
  }

  defineSyncStrategy(query, modifier, options) {
    if (this.baseModel.useCache === false) {
      return 'db';
    }

    if (options.upsert === true) {
      return 'db';
    } // const dbModifiers = [
    // 	'$currentDate',
    // 	'$bit',
    // 	'$pull',
    // 	'$pushAll',
    // 	'$push',
    // 	'$setOnInsert'
    // ];


    const cacheAllowedModifiers = ['$set', '$unset', '$min', '$max', '$inc', '$mul', '$rename', '$pullAll', '$pop', '$addToSet'];
    const notAllowedModifiers = Object.keys(modifier).filter(i => i.startsWith('$') && cacheAllowedModifiers.includes(i) === false);

    if (notAllowedModifiers.length > 0) {
      return 'db';
    }

    const placeholderFields = Object.keys(query).filter(item => item.indexOf('$') > -1);

    if (placeholderFields.length > 0) {
      return 'db';
    }

    return 'cache';
  }

  updateHasPositionalOperator(update) {
    return Object.keys(update).some(key => key.includes('.$') || !Match.test(update[key], Object) && this.updateHasPositionalOperator(update[key]));
  }

  processOplogRecord(action) {
    if (isOplogEnabled === false) {
      return;
    }

    if (action.op.op === 'i') {
      this.emit('change', {
        action: 'insert',
        id: action.op.o._id,
        data: action.op.o,
        oplog: true
      });
      return;
    }

    if (action.op.op === 'u') {
      if (!action.op.o.$set && !action.op.o.$unset) {
        this.emit('change', {
          action: 'update:record',
          id: action.id,
          data: action.op.o,
          oplog: true
        });
        return;
      }

      const diff = {};

      if (action.op.o.$set) {
        for (const key in action.op.o.$set) {
          if (action.op.o.$set.hasOwnProperty(key)) {
            diff[key] = action.op.o.$set[key];
          }
        }
      }

      if (action.op.o.$unset) {
        for (const key in action.op.o.$unset) {
          if (action.op.o.$unset.hasOwnProperty(key)) {
            diff[key] = undefined;
          }
        }
      }

      this.emit('change', {
        action: 'update:diff',
        id: action.id,
        data: diff,
        oplog: true
      });
      return;
    }

    if (action.op.op === 'd') {
      this.emit('change', {
        action: 'remove',
        id: action.id,
        oplog: true
      });
      return;
    }
  }

  insert(record) {
    this.setUpdatedAt(record);
    const result = this.originals.insert(...arguments);

    if (!isOplogEnabled && this.listenerCount('change') > 0) {
      this.emit('change', {
        action: 'insert',
        id: result,
        data: _.extend({}, record),
        oplog: false
      });
    }

    record._id = result;
    return result;
  }

  update(query, update, options = {}) {
    this.setUpdatedAt(update, true, query);
    const strategy = this.defineSyncStrategy(query, update, options);
    let ids = [];

    if (!isOplogEnabled && this.listenerCount('change') > 0 && strategy === 'db') {
      const findOptions = {
        fields: {
          _id: 1
        }
      };
      let records = options.multi ? this.find(query, findOptions).fetch() : this.findOne(query, findOptions) || [];

      if (!Array.isArray(records)) {
        records = [records];
      }

      ids = records.map(item => item._id);

      if (options.upsert !== true && this.updateHasPositionalOperator(update) === false) {
        query = {
          _id: {
            $in: ids
          }
        };
      }
    }

    const result = this.originals.update(query, update, options);

    if (!isOplogEnabled && this.listenerCount('change') > 0) {
      if (strategy === 'db') {
        if (options.upsert === true) {
          if (result.insertedId) {
            this.emit('change', {
              action: 'insert',
              id: result.insertedId,
              data: this.findOne({
                _id: result.insertedId
              }),
              oplog: false
            });
            return;
          }

          query = {
            _id: {
              $in: ids
            }
          };
        }

        let records = options.multi ? this.find(query).fetch() : this.findOne(query) || [];

        if (!Array.isArray(records)) {
          records = [records];
        }

        for (const record of records) {
          this.emit('change', {
            action: 'update:record',
            id: record._id,
            data: record,
            oplog: false
          });
        }
      } else {
        this.emit('change', {
          action: 'update:query',
          id: undefined,
          data: {
            query,
            update,
            options
          },
          oplog: false
        });
      }
    }

    return result;
  }

  upsert(query, update, options = {}) {
    options.upsert = true;
    options._returnObject = true;
    return this.update(query, update, options);
  }

  remove(query) {
    const records = this.model.find(query).fetch();
    const ids = [];

    for (const record of records) {
      ids.push(record._id);
      record._deletedAt = new Date();
      record.__collection__ = this.name;
      trash.upsert({
        _id: record._id
      }, _.omit(record, '_id'));
    }

    query = {
      _id: {
        $in: ids
      }
    };
    const result = this.originals.remove(query);

    if (!isOplogEnabled && this.listenerCount('change') > 0) {
      for (const record of records) {
        this.emit('change', {
          action: 'remove',
          id: record._id,
          data: _.extend({}, record),
          oplog: false
        });
      }
    }

    return result;
  }

  insertOrUpsert(...args) {
    if (args[0] && args[0]._id) {
      const _id = args[0]._id;
      delete args[0]._id;
      args.unshift({
        _id
      });
      this.upsert(...args);
      return _id;
    } else {
      return this.insert(...args);
    }
  }

  allow() {
    return this.model.allow(...arguments);
  }

  deny() {
    return this.model.deny(...arguments);
  }

  ensureIndex() {
    return this.model._ensureIndex(...arguments);
  }

  dropIndex() {
    return this.model._dropIndex(...arguments);
  }

  tryEnsureIndex() {
    try {
      return this.ensureIndex(...arguments);
    } catch (e) {
      console.error('Error creating index:', this.name, '->', ...arguments, e);
    }
  }

  tryDropIndex() {
    try {
      return this.dropIndex(...arguments);
    } catch (e) {
      console.error('Error dropping index:', this.name, '->', ...arguments, e);
    }
  }

  trashFind(query, options) {
    query.__collection__ = this.name;
    return trash.find(query, options);
  }

  trashFindDeletedAfter(deletedAt, query = {}, options) {
    query.__collection__ = this.name;
    query._deletedAt = {
      $gt: deletedAt
    };
    return trash.find(query, options);
  }

}

module.exportDefault(ModelsBaseDb);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"oauth":{"oauth.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/server/oauth/oauth.js                                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
const AccessTokenServices = {};

RocketChat.registerAccessTokenService = function (serviceName, handleAccessTokenRequest) {
  AccessTokenServices[serviceName] = {
    serviceName,
    handleAccessTokenRequest
  };
}; // Listen to calls to `login` with an oauth option set. This is where
// users actually get logged in to meteor via oauth.


Accounts.registerLoginHandler(function (options) {
  if (!options.accessToken) {
    return undefined; // don't handle
  }

  check(options, Match.ObjectIncluding({
    serviceName: String
  }));
  const service = AccessTokenServices[options.serviceName]; // Skip everything if there's no service set by the oauth middleware

  if (!service) {
    throw new Error(`Unexpected AccessToken service ${options.serviceName}`);
  } // Make sure we're configured


  if (!ServiceConfiguration.configurations.findOne({
    service: service.serviceName
  })) {
    throw new ServiceConfiguration.ConfigError();
  }

  if (!_.contains(Accounts.oauth.serviceNames(), service.serviceName)) {
    // serviceName was not found in the registered services list.
    // This could happen because the service never registered itself or
    // unregisterService was called on it.
    return {
      type: 'oauth',
      error: new Meteor.Error(Accounts.LoginCancelledError.numericError, `No registered oauth service found for: ${service.serviceName}`)
    };
  }

  const oauthResult = service.handleAccessTokenRequest(options);
  return Accounts.updateOrCreateUserFromExternalService(service.serviceName, oauthResult.serviceData, oauthResult.options);
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"facebook.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/server/oauth/facebook.js                                                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
let OAuth;
module.watch(require("meteor/oauth"), {
  OAuth(v) {
    OAuth = v;
  }

}, 1);

const crypto = Npm.require('crypto');

const whitelisted = ['id', 'email', 'name', 'first_name', 'last_name', 'link', 'gender', 'locale', 'age_range'];
const FB_API_VERSION = 'v2.9';
const FB_URL = 'https://graph.facebook.com';

const getIdentity = function (accessToken, fields, secret) {
  const hmac = crypto.createHmac('sha256', OAuth.openSecret(secret));
  hmac.update(accessToken);

  try {
    return HTTP.get(`${FB_URL}/${FB_API_VERSION}/me`, {
      params: {
        access_token: accessToken,
        appsecret_proof: hmac.digest('hex'),
        fields: fields.join(',')
      }
    }).data;
  } catch (err) {
    throw _.extend(new Error(`Failed to fetch identity from Facebook. ${err.message}`), {
      response: err.response
    });
  }
};

RocketChat.registerAccessTokenService('facebook', function (options) {
  check(options, Match.ObjectIncluding({
    accessToken: String,
    secret: String,
    expiresIn: Match.Integer,
    identity: Match.Maybe(Object)
  }));
  const identity = options.identity || getIdentity(options.accessToken, whitelisted, options.secret);
  const serviceData = {
    accessToken: options.accessToken,
    expiresAt: +new Date() + 1000 * parseInt(options.expiresIn, 10)
  };

  const fields = _.pick(identity, whitelisted);

  _.extend(serviceData, fields);

  return {
    serviceData,
    options: {
      profile: {
        name: identity.name
      }
    }
  };
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"twitter.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/server/oauth/twitter.js                                                                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Twit;
module.watch(require("twit"), {
  default(v) {
    Twit = v;
  }

}, 0);

let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 1);
const whitelistedFields = ['id', 'name', 'description', 'profile_image_url', 'profile_image_url_https', 'lang', 'email'];

const getIdentity = function (accessToken, appId, appSecret, accessTokenSecret) {
  const Twitter = new Twit({
    consumer_key: appId,
    consumer_secret: appSecret,
    access_token: accessToken,
    access_token_secret: accessTokenSecret
  });
  const syncTwitter = Meteor.wrapAsync(Twitter.get, Twitter);

  try {
    return syncTwitter('account/verify_credentials.json?include_email=true');
  } catch (err) {
    throw _.extend(new Error(`Failed to fetch identity from Twwiter. ${err.message}`), {
      response: err.response
    });
  }
};

RocketChat.registerAccessTokenService('twitter', function (options) {
  check(options, Match.ObjectIncluding({
    accessToken: String,
    appSecret: String,
    appId: String,
    accessTokenSecret: String,
    expiresIn: Match.Integer,
    identity: Match.Maybe(Object)
  }));
  const identity = options.identity || getIdentity(options.accessToken, options.appId, options.appSecret, options.accessTokenSecret);
  const serviceData = {
    accessToken: options.accessToken,
    expiresAt: +new Date() + 1000 * parseInt(options.expiresIn, 10)
  };

  const fields = _.pick(identity, whitelistedFields);

  _.extend(serviceData, fields);

  return {
    serviceData,
    options: {
      profile: {
        name: identity.name
      }
    }
  };
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"google.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/server/oauth/google.js                                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);

function getIdentity(accessToken) {
  try {
    return HTTP.get('https://www.googleapis.com/oauth2/v1/userinfo', {
      params: {
        access_token: accessToken
      }
    }).data;
  } catch (err) {
    throw _.extend(new Error(`Failed to fetch identity from Google. ${err.message}`), {
      response: err.response
    });
  }
}

function getScopes(accessToken) {
  try {
    return HTTP.get('https://www.googleapis.com/oauth2/v1/tokeninfo', {
      params: {
        access_token: accessToken
      }
    }).data.scope.split(' ');
  } catch (err) {
    throw _.extend(new Error(`Failed to fetch tokeninfo from Google. ${err.message}`), {
      response: err.response
    });
  }
}

RocketChat.registerAccessTokenService('google', function (options) {
  check(options, Match.ObjectIncluding({
    accessToken: String,
    idToken: String,
    expiresIn: Match.Integer,
    scope: Match.Maybe(String),
    identity: Match.Maybe(Object)
  }));
  const identity = options.identity || getIdentity(options.accessToken);
  const serviceData = {
    accessToken: options.accessToken,
    idToken: options.idToken,
    expiresAt: +new Date() + 1000 * parseInt(options.expiresIn, 10),
    scope: options.scopes || getScopes(options.accessToken)
  };

  const fields = _.pick(identity, Google.whitelistedFields);

  _.extend(serviceData, fields); // only set the token in serviceData if it's there. this ensures
  // that we don't lose old ones (since we only get this on the first
  // log in attempt)


  if (options.refreshToken) {
    serviceData.refreshToken = options.refreshToken;
  }

  return {
    serviceData,
    options: {
      profile: {
        name: identity.name
      }
    }
  };
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"proxy.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/server/oauth/proxy.js                                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
OAuth._redirectUri = _.wrap(OAuth._redirectUri, function (func, serviceName, ...args) {
  const proxy = RocketChat.settings.get('Accounts_OAuth_Proxy_services').replace(/\s/g, '').split(',');

  if (proxy.includes(serviceName)) {
    return `${RocketChat.settings.get('Accounts_OAuth_Proxy_host')}/oauth_redirect`;
  } else {
    return func(serviceName, ...args);
  }
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"startup":{"statsTracker.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/server/startup/statsTracker.js                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let StatsD;
module.watch(require("node-dogstatsd"), {
  StatsD(v) {
    StatsD = v;
  }

}, 0);
RocketChat.statsTracker = new class StatsTracker {
  constructor() {
    this.StatsD = StatsD;
    this.dogstatsd = new this.StatsD();
  }

  track(type, stats, ...args) {
    this.dogstatsd[type](`RocketChat.${stats}`, ...args);
  }

  now() {
    const hrtime = process.hrtime();
    return hrtime[0] * 1000000 + hrtime[1] / 1000;
  }

  timing(stats, time, tags) {
    this.track('timing', stats, time, tags);
  }

  increment(stats, time, tags) {
    this.track('increment', stats, time, tags);
  }

  decrement(stats, time, tags) {
    this.track('decrement', stats, time, tags);
  }

  histogram(stats, time, tags) {
    this.track('histogram', stats, time, tags);
  }

  gauge(stats, time, tags) {
    this.track('gauge', stats, time, tags);
  }

  unique(stats, time, tags) {
    this.track('unique', stats, time, tags);
  }

  set(stats, time, tags) {
    this.track('set', stats, time, tags);
  }

}();
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"cache":{"CacheLoad.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/server/startup/cache/CacheLoad.js                                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.models.Rooms.cache.hasMany('Subscriptions', {
  field: 'usernames',
  link: {
    local: '_id',
    remote: 'rid',

    transform(room, subscription) {
      return subscription.u.username;
    },

    remove(arr, subscription) {
      if (arr.indexOf(subscription.u.username) > -1) {
        arr.splice(arr.indexOf(subscription.u.username), 1);
      }
    }

  }
});
RocketChat.models.Subscriptions.cache.hasOne('Rooms', {
  field: '_room',
  link: {
    local: 'rid',
    remote: '_id'
  }
});
RocketChat.models.Subscriptions.cache.hasOne('Users', {
  field: '_user',
  link: {
    local: 'u._id',
    remote: '_id'
  }
});
RocketChat.models.Subscriptions.cache.hasOne('Users', {
  field: 'fname',
  link: {
    local: 'name',
    remote: 'username',

    where(subscription
    /*, user*/
    ) {
      return subscription.t === 'd';
    },

    transform(subscription, user) {
      if (user == null || subscription == null) {
        return undefined;
      } // Prevent client cache for old subscriptions with new names
      // Cuz when a user change his name, the subscription's _updateAt
      // will not change


      if (subscription._updatedAt < user._updatedAt) {
        subscription._updatedAt = user._updatedAt;
      }

      return user.name;
    }

  }
});
RocketChat.models.Users.cache.load();
RocketChat.models.Rooms.cache.load();
RocketChat.models.Subscriptions.cache.load();
RocketChat.models.Settings.cache.load();
RocketChat.models.Users.cache.addDynamicView('highlights').applyFind({
  'settings.preferences.highlights': {
    $size: {
      $gt: 0
    }
  }
});
RocketChat.models.Subscriptions.cache.addDynamicView('notifications').applyFind({
  $or: [{
    desktopNotifications: {
      $in: ['all', 'nothing']
    }
  }, {
    mobilePushNotifications: {
      $in: ['all', 'nothing']
    }
  }]
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"settingsOnLoadCdnPrefix.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/server/startup/settingsOnLoadCdnPrefix.js                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);

function testWebAppInternals(fn) {
  typeof WebAppInternals !== 'undefined' && fn(WebAppInternals);
}

RocketChat.settings.onload('CDN_PREFIX', function (key, value) {
  if (_.isString(value) && value.trim()) {
    return testWebAppInternals(WebAppInternals => WebAppInternals.setBundledJsCssPrefix(value));
  }
});
Meteor.startup(function () {
  const value = RocketChat.settings.get('CDN_PREFIX');

  if (_.isString(value) && value.trim()) {
    return testWebAppInternals(WebAppInternals => WebAppInternals.setBundledJsCssPrefix(value));
  }
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"settingsOnLoadDirectReply.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/server/startup/settingsOnLoadDirectReply.js                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
let IMAPIntercepter;
module.watch(require("../lib/interceptDirectReplyEmails.js"), {
  IMAPIntercepter(v) {
    IMAPIntercepter = v;
  }

}, 1);
let POP3Helper;
module.watch(require("../lib/interceptDirectReplyEmails.js"), {
  POP3Helper(v) {
    POP3Helper = v;
  }

}, 2);

const startEmailIntercepter = _.debounce(Meteor.bindEnvironment(function () {
  console.log('Starting Email Intercepter...');

  if (RocketChat.settings.get('Direct_Reply_Enable') && RocketChat.settings.get('Direct_Reply_Protocol') && RocketChat.settings.get('Direct_Reply_Host') && RocketChat.settings.get('Direct_Reply_Port') && RocketChat.settings.get('Direct_Reply_Username') && RocketChat.settings.get('Direct_Reply_Password')) {
    if (RocketChat.settings.get('Direct_Reply_Protocol') === 'IMAP') {
      // stop already running IMAP instance
      if (RocketChat.IMAP && RocketChat.IMAP.isActive()) {
        console.log('Disconnecting already running IMAP instance...');
        RocketChat.IMAP.stop(Meteor.bindEnvironment(function () {
          console.log('Starting new IMAP instance......');
          RocketChat.IMAP = new IMAPIntercepter();
          RocketChat.IMAP.start();
          return true;
        }));
      } else if (RocketChat.POP3 && RocketChat.POP3Helper && RocketChat.POP3Helper.isActive()) {
        console.log('Disconnecting already running POP instance...');
        RocketChat.POP3Helper.stop(Meteor.bindEnvironment(function () {
          console.log('Starting new IMAP instance......');
          RocketChat.IMAP = new IMAPIntercepter();
          RocketChat.IMAP.start();
          return true;
        }));
      } else {
        console.log('Starting new IMAP instance......');
        RocketChat.IMAP = new IMAPIntercepter();
        RocketChat.IMAP.start();
        return true;
      }
    } else if (RocketChat.settings.get('Direct_Reply_Protocol') === 'POP') {
      // stop already running POP instance
      if (RocketChat.POP3 && RocketChat.POP3Helper && RocketChat.POP3Helper.isActive()) {
        console.log('Disconnecting already running POP instance...');
        RocketChat.POP3Helper.stop(Meteor.bindEnvironment(function () {
          console.log('Starting new POP instance......');
          RocketChat.POP3Helper = new POP3Helper();
          RocketChat.POP3Helper.start();
          return true;
        }));
      } else if (RocketChat.IMAP && RocketChat.IMAP.isActive()) {
        console.log('Disconnecting already running IMAP instance...');
        RocketChat.IMAP.stop(Meteor.bindEnvironment(function () {
          console.log('Starting new POP instance......');
          RocketChat.POP3Helper = new POP3Helper();
          RocketChat.POP3Helper.start();
          return true;
        }));
      } else {
        console.log('Starting new POP instance......');
        RocketChat.POP3Helper = new POP3Helper();
        RocketChat.POP3Helper.start();
        return true;
      }
    }
  } else if (RocketChat.IMAP && RocketChat.IMAP.isActive()) {
    // stop IMAP instance
    RocketChat.IMAP.stop();
  } else if (RocketChat.POP3 && RocketChat.POP3Helper.isActive()) {
    // stop POP3 instance
    RocketChat.POP3Helper.stop();
  }
}), 1000);

RocketChat.settings.onload(/^Direct_Reply_.+/, startEmailIntercepter);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"settingsOnLoadSMTP.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/server/startup/settingsOnLoadSMTP.js                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);

const buildMailURL = _.debounce(function () {
  console.log('Updating process.env.MAIL_URL');

  if (RocketChat.settings.get('SMTP_Host')) {
    process.env.MAIL_URL = `${RocketChat.settings.get('SMTP_Protocol')}://`;

    if (RocketChat.settings.get('SMTP_Username') && RocketChat.settings.get('SMTP_Password')) {
      process.env.MAIL_URL += `${encodeURIComponent(RocketChat.settings.get('SMTP_Username'))}:${encodeURIComponent(RocketChat.settings.get('SMTP_Password'))}@`;
    }

    process.env.MAIL_URL += encodeURIComponent(RocketChat.settings.get('SMTP_Host'));

    if (RocketChat.settings.get('SMTP_Port')) {
      process.env.MAIL_URL += `:${parseInt(RocketChat.settings.get('SMTP_Port'))}`;
    }

    process.env.MAIL_URL += `?pool=${RocketChat.settings.get('SMTP_Pool')}`;

    if (RocketChat.settings.get('SMTP_Protocol') === 'smtp' && RocketChat.settings.get('SMTP_IgnoreTLS')) {
      process.env.MAIL_URL += '&secure=false&ignoreTLS=true';
    }

    return process.env.MAIL_URL;
  }
}, 500);

RocketChat.settings.onload('SMTP_Host', function (key, value) {
  if (_.isString(value)) {
    return buildMailURL();
  }
});
RocketChat.settings.onload('SMTP_Port', function () {
  return buildMailURL();
});
RocketChat.settings.onload('SMTP_Username', function (key, value) {
  if (_.isString(value)) {
    return buildMailURL();
  }
});
RocketChat.settings.onload('SMTP_Password', function (key, value) {
  if (_.isString(value)) {
    return buildMailURL();
  }
});
RocketChat.settings.onload('SMTP_Protocol', function () {
  return buildMailURL();
});
RocketChat.settings.onload('SMTP_Pool', function () {
  return buildMailURL();
});
RocketChat.settings.onload('SMTP_IgnoreTLS', function () {
  return buildMailURL();
});
Meteor.startup(function () {
  return buildMailURL();
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"oAuthServicesUpdate.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/server/startup/oAuthServicesUpdate.js                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
const logger = new Logger('rocketchat:lib', {
  methods: {
    oauth_updated: {
      type: 'info'
    }
  }
});

function _OAuthServicesUpdate() {
  const services = RocketChat.settings.get(/^(Accounts_OAuth_|Accounts_OAuth_Custom-)[a-z0-9_]+$/i);
  services.forEach(service => {
    logger.oauth_updated(service.key);
    let serviceName = service.key.replace('Accounts_OAuth_', '');

    if (serviceName === 'Meteor') {
      serviceName = 'meteor-developer';
    }

    if (/Accounts_OAuth_Custom-/.test(service.key)) {
      serviceName = service.key.replace('Accounts_OAuth_Custom-', '');
    }

    if (service.value === true) {
      const data = {
        clientId: RocketChat.settings.get(`${service.key}_id`),
        secret: RocketChat.settings.get(`${service.key}_secret`)
      };

      if (/Accounts_OAuth_Custom-/.test(service.key)) {
        data.custom = true;
        data.clientId = RocketChat.settings.get(`${service.key}-id`);
        data.secret = RocketChat.settings.get(`${service.key}-secret`);
        data.serverURL = RocketChat.settings.get(`${service.key}-url`);
        data.tokenPath = RocketChat.settings.get(`${service.key}-token_path`);
        data.identityPath = RocketChat.settings.get(`${service.key}-identity_path`);
        data.authorizePath = RocketChat.settings.get(`${service.key}-authorize_path`);
        data.scope = RocketChat.settings.get(`${service.key}-scope`);
        data.buttonLabelText = RocketChat.settings.get(`${service.key}-button_label_text`);
        data.buttonLabelColor = RocketChat.settings.get(`${service.key}-button_label_color`);
        data.loginStyle = RocketChat.settings.get(`${service.key}-login_style`);
        data.buttonColor = RocketChat.settings.get(`${service.key}-button_color`);
        data.tokenSentVia = RocketChat.settings.get(`${service.key}-token_sent_via`);
        data.identityTokenSentVia = RocketChat.settings.get(`${service.key}-identity_token_sent_via`);
        data.usernameField = RocketChat.settings.get(`${service.key}-username_field`);
        data.mergeUsers = RocketChat.settings.get(`${service.key}-merge_users`);
        new CustomOAuth(serviceName.toLowerCase(), {
          serverURL: data.serverURL,
          tokenPath: data.tokenPath,
          identityPath: data.identityPath,
          authorizePath: data.authorizePath,
          scope: data.scope,
          loginStyle: data.loginStyle,
          tokenSentVia: data.tokenSentVia,
          identityTokenSentVia: data.identityTokenSentVia,
          usernameField: data.usernameField,
          mergeUsers: data.mergeUsers
        });
      }

      if (serviceName === 'Facebook') {
        data.appId = data.clientId;
        delete data.clientId;
      }

      if (serviceName === 'Twitter') {
        data.consumerKey = data.clientId;
        delete data.clientId;
      }

      ServiceConfiguration.configurations.upsert({
        service: serviceName.toLowerCase()
      }, {
        $set: data
      });
    } else {
      ServiceConfiguration.configurations.remove({
        service: serviceName.toLowerCase()
      });
    }
  });
}

const OAuthServicesUpdate = _.debounce(Meteor.bindEnvironment(_OAuthServicesUpdate), 2000);

function OAuthServicesRemove(_id) {
  const serviceName = _id.replace('Accounts_OAuth_Custom-', '');

  return ServiceConfiguration.configurations.remove({
    service: serviceName.toLowerCase()
  });
}

RocketChat.settings.get(/^Accounts_OAuth_.+/, function () {
  return OAuthServicesUpdate(); // eslint-disable-line new-cap
});
RocketChat.settings.get(/^Accounts_OAuth_Custom-[a-z0-9_]+/, function (key, value) {
  if (!value) {
    return OAuthServicesRemove(key); // eslint-disable-line new-cap
  }
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"settings.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/server/startup/settings.js                                                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
// Insert server unique id if it doesn't exist
RocketChat.settings.add('uniqueID', process.env.DEPLOYMENT_ID || Random.id(), {
  'public': true,
  hidden: true
}); // When you define a setting and want to add a description, you don't need to automatically define the i18nDescription
// if you add a node to the i18n.json with the same setting name but with `_Description` it will automatically work.

RocketChat.settings.addGroup('Accounts', function () {
  this.add('Accounts_AllowAnonymousRead', false, {
    type: 'boolean',
    public: true
  });
  this.add('Accounts_AllowAnonymousWrite', false, {
    type: 'boolean',
    public: true,
    enableQuery: {
      _id: 'Accounts_AllowAnonymousRead',
      value: true
    }
  });
  this.add('Accounts_AllowDeleteOwnAccount', false, {
    type: 'boolean',
    'public': true,
    enableQuery: {
      _id: 'Accounts_AllowUserProfileChange',
      value: true
    }
  });
  this.add('Accounts_AllowUserProfileChange', true, {
    type: 'boolean',
    'public': true
  });
  this.add('Accounts_AllowUserAvatarChange', true, {
    type: 'boolean',
    'public': true
  });
  this.add('Accounts_AllowRealNameChange', true, {
    type: 'boolean',
    'public': true
  });
  this.add('Accounts_AllowUsernameChange', true, {
    type: 'boolean',
    'public': true
  });
  this.add('Accounts_AllowEmailChange', true, {
    type: 'boolean',
    'public': true
  });
  this.add('Accounts_AllowPasswordChange', true, {
    type: 'boolean',
    'public': true
  });
  this.add('Accounts_CustomFieldsToShowInUserInfo', '', {
    type: 'string',
    public: true
  });
  this.add('Accounts_LoginExpiration', 90, {
    type: 'int',
    'public': true
  });
  this.add('Accounts_ShowFormLogin', true, {
    type: 'boolean',
    'public': true
  });
  this.add('Accounts_EmailOrUsernamePlaceholder', '', {
    type: 'string',
    'public': true,
    i18nLabel: 'Placeholder_for_email_or_username_login_field'
  });
  this.add('Accounts_PasswordPlaceholder', '', {
    type: 'string',
    'public': true,
    i18nLabel: 'Placeholder_for_password_login_field'
  });
  this.add('Accounts_ForgetUserSessionOnWindowClose', false, {
    type: 'boolean',
    'public': true
  });
  this.add('Accounts_SearchFields', 'username, name, emails.address', {
    type: 'string',
    public: true
  });
  this.section('Two Factor Authentication', function () {
    this.add('Accounts_TwoFactorAuthentication_MaxDelta', 1, {
      type: 'int',
      public: true,
      i18nLabel: 'Accounts_TwoFactorAuthentication_MaxDelta'
    });
  });
  this.section('Registration', function () {
    this.add('Accounts_DefaultUsernamePrefixSuggestion', 'user', {
      type: 'string'
    });
    this.add('Accounts_RequireNameForSignUp', true, {
      type: 'boolean',
      'public': true
    });
    this.add('Accounts_RequirePasswordConfirmation', true, {
      type: 'boolean',
      'public': true
    });
    this.add('Accounts_EmailVerification', false, {
      type: 'boolean',
      'public': true,
      enableQuery: {
        _id: 'SMTP_Host',
        value: {
          $exists: 1,
          $ne: ''
        }
      }
    });
    this.add('Accounts_ManuallyApproveNewUsers', false, {
      'public': true,
      type: 'boolean'
    });
    this.add('Accounts_AllowedDomainsList', '', {
      type: 'string',
      'public': true
    });
    this.add('Accounts_BlockedDomainsList', '', {
      type: 'string'
    });
    this.add('Accounts_BlockedUsernameList', '', {
      type: 'string'
    });
    this.add('Accounts_UseDefaultBlockedDomainsList', true, {
      type: 'boolean'
    });
    this.add('Accounts_UseDNSDomainCheck', false, {
      type: 'boolean'
    });
    this.add('Accounts_RegistrationForm', 'Public', {
      type: 'select',
      'public': true,
      values: [{
        key: 'Public',
        i18nLabel: 'Accounts_RegistrationForm_Public'
      }, {
        key: 'Disabled',
        i18nLabel: 'Accounts_RegistrationForm_Disabled'
      }, {
        key: 'Secret URL',
        i18nLabel: 'Accounts_RegistrationForm_Secret_URL'
      }]
    });
    this.add('Accounts_RegistrationForm_SecretURL', Random.id(), {
      type: 'string'
    });
    this.add('Accounts_RegistrationForm_LinkReplacementText', 'New user registration is currently disabled', {
      type: 'string',
      'public': true
    });
    this.add('Accounts_Registration_AuthenticationServices_Enabled', true, {
      type: 'boolean',
      'public': true
    });
    this.add('Accounts_Registration_AuthenticationServices_Default_Roles', 'user', {
      type: 'string',
      enableQuery: {
        _id: 'Accounts_Registration_AuthenticationServices_Enabled',
        value: true
      }
    });
    this.add('Accounts_PasswordReset', true, {
      type: 'boolean',
      'public': true
    });
    this.add('Accounts_CustomFields', '', {
      type: 'code',
      'public': true,
      i18nLabel: 'Custom_Fields'
    });
  });
  this.section('Accounts_Default_User_Preferences', function () {
    this.add('Accounts_Default_User_Preferences_enableAutoAway', false, {
      type: 'boolean',
      'public': true,
      i18nLabel: 'Enable_Auto_Away'
    });
    this.add('Accounts_Default_User_Preferences_idleTimeoutLimit', 300, {
      type: 'int',
      'public': true,
      i18nLabel: 'Idle_Time_Limit'
    });
    this.add('Accounts_Default_User_Preferences_desktopNotificationDuration', 0, {
      type: 'int',
      'public': true,
      i18nLabel: 'Notification_Duration'
    });
    this.add('Accounts_Default_User_Preferences_audioNotifications', 'mentions', {
      type: 'select',
      values: [{
        key: 'all',
        i18nLabel: 'All_messages'
      }, {
        key: 'mentions',
        i18nLabel: 'Mentions'
      }, {
        key: 'nothing',
        i18nLabel: 'Nothing'
      }],
      public: true
    });
    this.add('Accounts_Default_User_Preferences_desktopNotifications', 'mentions', {
      type: 'select',
      values: [{
        key: 'all',
        i18nLabel: 'All_messages'
      }, {
        key: 'mentions',
        i18nLabel: 'Mentions'
      }, {
        key: 'nothing',
        i18nLabel: 'Nothing'
      }],
      'public': true
    });
    this.add('Accounts_Default_User_Preferences_mobileNotifications', 'mentions', {
      type: 'select',
      values: [{
        key: 'all',
        i18nLabel: 'All_messages'
      }, {
        key: 'mentions',
        i18nLabel: 'Mentions'
      }, {
        key: 'nothing',
        i18nLabel: 'Nothing'
      }],
      'public': true
    });
    this.add('Accounts_Default_User_Preferences_unreadAlert', true, {
      type: 'boolean',
      'public': true,
      i18nLabel: 'Unread_Tray_Icon_Alert'
    });
    this.add('Accounts_Default_User_Preferences_useEmojis', true, {
      type: 'boolean',
      'public': true,
      i18nLabel: 'Use_Emojis'
    });
    this.add('Accounts_Default_User_Preferences_convertAsciiEmoji', true, {
      type: 'boolean',
      'public': true,
      i18nLabel: 'Convert_Ascii_Emojis'
    });
    this.add('Accounts_Default_User_Preferences_autoImageLoad', true, {
      type: 'boolean',
      'public': true,
      i18nLabel: 'Auto_Load_Images'
    });
    this.add('Accounts_Default_User_Preferences_saveMobileBandwidth', true, {
      type: 'boolean',
      'public': true,
      i18nLabel: 'Save_Mobile_Bandwidth'
    });
    this.add('Accounts_Default_User_Preferences_collapseMediaByDefault', false, {
      type: 'boolean',
      'public': true,
      i18nLabel: 'Collapse_Embedded_Media_By_Default'
    });
    this.add('Accounts_Default_User_Preferences_hideUsernames', false, {
      type: 'boolean',
      'public': true,
      i18nLabel: 'Hide_usernames'
    });
    this.add('Accounts_Default_User_Preferences_hideRoles', false, {
      type: 'boolean',
      'public': true,
      i18nLabel: 'Hide_roles'
    });
    this.add('Accounts_Default_User_Preferences_hideFlexTab', false, {
      type: 'boolean',
      'public': true,
      i18nLabel: 'Hide_flextab'
    });
    this.add('Accounts_Default_User_Preferences_hideAvatars', false, {
      type: 'boolean',
      'public': true,
      i18nLabel: 'Hide_Avatars'
    });
    this.add('Accounts_Default_User_Preferences_roomsListExhibitionMode', 'category', {
      type: 'select',
      values: [{
        key: 'unread',
        i18nLabel: 'Unread_Rooms_Mode'
      }, {
        key: 'activity',
        i18nLabel: 'Sort_by_activity'
      }, {
        key: 'category',
        i18nLabel: 'Split_by_categories'
      }],
      'public': true,
      i18nLabel: 'Sidebar_list_mode'
    });
    this.add('Accounts_Default_User_Preferences_sidebarViewMode', 'medium', {
      type: 'select',
      values: [{
        key: 'extended',
        i18nLabel: 'Extended'
      }, {
        key: 'medium',
        i18nLabel: 'Medium'
      }, {
        key: 'condensed',
        i18nLabel: 'Condensed'
      }],
      'public': true,
      i18nLabel: 'Sidebar_list_mode'
    });
    this.add('Accounts_Default_User_Preferences_sidebarHideAvatar', false, {
      type: 'boolean',
      'public': true,
      i18nLabel: 'Hide_Avatars'
    });
    this.add('Accounts_Default_User_Preferences_sidebarShowUnread', false, {
      type: 'boolean',
      'public': true,
      i18nLabel: 'Unread_on_top'
    });
    this.add('Accounts_Default_User_Preferences_sidebarShowFavorites', true, {
      type: 'boolean',
      'public': true,
      i18nLabel: 'Group_favorites'
    });
    this.add('Accounts_Default_User_Preferences_sendOnEnter', 'normal', {
      type: 'select',
      values: [{
        key: 'normal',
        i18nLabel: 'Enter_Normal'
      }, {
        key: 'alternative',
        i18nLabel: 'Enter_Alternative'
      }, {
        key: 'desktop',
        i18nLabel: 'Only_On_Desktop'
      }],
      'public': true,
      i18nLabel: 'Enter_Behaviour'
    });
    this.add('Accounts_Default_User_Preferences_messageViewMode', 0, {
      type: 'select',
      values: [{
        key: 0,
        i18nLabel: 'Normal'
      }, {
        key: 1,
        i18nLabel: 'Cozy'
      }, {
        key: 2,
        i18nLabel: 'Compact'
      }],
      'public': true,
      i18nLabel: 'MessageBox_view_mode'
    });
    this.add('Accounts_Default_User_Preferences_emailNotificationMode', 'all', {
      type: 'select',
      values: [{
        key: 'disabled',
        i18nLabel: 'Email_Notification_Mode_Disabled'
      }, {
        key: 'all',
        i18nLabel: 'Email_Notification_Mode_All'
      }],
      'public': true,
      i18nLabel: 'Email_Notification_Mode'
    });
    this.add('Accounts_Default_User_Preferences_roomCounterSidebar', false, {
      type: 'boolean',
      'public': true,
      i18nLabel: 'Show_room_counter_on_sidebar'
    });
    this.add('Accounts_Default_User_Preferences_newRoomNotification', 'door', {
      type: 'select',
      values: [{
        key: 'none',
        i18nLabel: 'None'
      }, {
        key: 'door',
        i18nLabel: 'Default'
      }],
      'public': true,
      i18nLabel: 'New_Room_Notification'
    });
    this.add('Accounts_Default_User_Preferences_newMessageNotification', 'chime', {
      type: 'select',
      values: [{
        key: 'none',
        i18nLabel: 'None'
      }, {
        key: 'chime',
        i18nLabel: 'Default'
      }],
      'public': true,
      i18nLabel: 'New_Message_Notification'
    });
    this.add('Accounts_Default_User_Preferences_muteFocusedConversations', true, {
      type: 'boolean',
      'public': true,
      i18nLabel: 'Mute_Focused_Conversations'
    });
    this.add('Accounts_Default_User_Preferences_notificationsSoundVolume', 100, {
      type: 'int',
      'public': true,
      i18nLabel: 'Notifications_Sound_Volume'
    });
  });
  this.section('Avatar', function () {
    this.add('Accounts_AvatarResize', true, {
      type: 'boolean'
    });
    this.add('Accounts_AvatarSize', 200, {
      type: 'int',
      enableQuery: {
        _id: 'Accounts_AvatarResize',
        value: true
      }
    });
    return this.add('Accounts_SetDefaultAvatar', true, {
      type: 'boolean'
    });
  });
});
RocketChat.settings.addGroup('OAuth', function () {
  this.section('Facebook', function () {
    const enableQuery = {
      _id: 'Accounts_OAuth_Facebook',
      value: true
    };
    this.add('Accounts_OAuth_Facebook', false, {
      type: 'boolean',
      'public': true
    });
    this.add('Accounts_OAuth_Facebook_id', '', {
      type: 'string',
      enableQuery
    });
    this.add('Accounts_OAuth_Facebook_secret', '', {
      type: 'string',
      enableQuery
    });
    return this.add('Accounts_OAuth_Facebook_callback_url', '_oauth/facebook', {
      type: 'relativeUrl',
      readonly: true,
      force: true,
      enableQuery
    });
  });
  this.section('Google', function () {
    const enableQuery = {
      _id: 'Accounts_OAuth_Google',
      value: true
    };
    this.add('Accounts_OAuth_Google', false, {
      type: 'boolean',
      'public': true
    });
    this.add('Accounts_OAuth_Google_id', '', {
      type: 'string',
      enableQuery
    });
    this.add('Accounts_OAuth_Google_secret', '', {
      type: 'string',
      enableQuery
    });
    return this.add('Accounts_OAuth_Google_callback_url', '_oauth/google', {
      type: 'relativeUrl',
      readonly: true,
      force: true,
      enableQuery
    });
  });
  this.section('GitHub', function () {
    const enableQuery = {
      _id: 'Accounts_OAuth_Github',
      value: true
    };
    this.add('Accounts_OAuth_Github', false, {
      type: 'boolean',
      'public': true
    });
    this.add('Accounts_OAuth_Github_id', '', {
      type: 'string',
      enableQuery
    });
    this.add('Accounts_OAuth_Github_secret', '', {
      type: 'string',
      enableQuery
    });
    return this.add('Accounts_OAuth_Github_callback_url', '_oauth/github', {
      type: 'relativeUrl',
      readonly: true,
      force: true,
      enableQuery
    });
  });
  this.section('Linkedin', function () {
    const enableQuery = {
      _id: 'Accounts_OAuth_Linkedin',
      value: true
    };
    this.add('Accounts_OAuth_Linkedin', false, {
      type: 'boolean',
      'public': true
    });
    this.add('Accounts_OAuth_Linkedin_id', '', {
      type: 'string',
      enableQuery
    });
    this.add('Accounts_OAuth_Linkedin_secret', '', {
      type: 'string',
      enableQuery
    });
    return this.add('Accounts_OAuth_Linkedin_callback_url', '_oauth/linkedin', {
      type: 'relativeUrl',
      readonly: true,
      force: true,
      enableQuery
    });
  });
  this.section('Meteor', function () {
    const enableQuery = {
      _id: 'Accounts_OAuth_Meteor',
      value: true
    };
    this.add('Accounts_OAuth_Meteor', false, {
      type: 'boolean',
      'public': true
    });
    this.add('Accounts_OAuth_Meteor_id', '', {
      type: 'string',
      enableQuery
    });
    this.add('Accounts_OAuth_Meteor_secret', '', {
      type: 'string',
      enableQuery
    });
    return this.add('Accounts_OAuth_Meteor_callback_url', '_oauth/meteor', {
      type: 'relativeUrl',
      readonly: true,
      force: true,
      enableQuery
    });
  });
  this.section('Twitter', function () {
    const enableQuery = {
      _id: 'Accounts_OAuth_Twitter',
      value: true
    };
    this.add('Accounts_OAuth_Twitter', false, {
      type: 'boolean',
      'public': true
    });
    this.add('Accounts_OAuth_Twitter_id', '', {
      type: 'string',
      enableQuery
    });
    this.add('Accounts_OAuth_Twitter_secret', '', {
      type: 'string',
      enableQuery
    });
    return this.add('Accounts_OAuth_Twitter_callback_url', '_oauth/twitter', {
      type: 'relativeUrl',
      readonly: true,
      force: true,
      enableQuery
    });
  });
  return this.section('Proxy', function () {
    this.add('Accounts_OAuth_Proxy_host', 'https://oauth-proxy.rocket.chat', {
      type: 'string',
      'public': true
    });
    return this.add('Accounts_OAuth_Proxy_services', '', {
      type: 'string',
      'public': true
    });
  });
});
RocketChat.settings.addGroup('General', function () {
  this.add('Site_Url', typeof __meteor_runtime_config__ !== 'undefined' && __meteor_runtime_config__ !== null ? __meteor_runtime_config__.ROOT_URL : null, {
    type: 'string',
    i18nDescription: 'Site_Url_Description',
    'public': true
  });
  this.add('Site_Name', 'Rocket.Chat', {
    type: 'string',
    'public': true
  });
  this.add('Language', '', {
    type: 'language',
    'public': true
  });
  this.add('Allow_Invalid_SelfSigned_Certs', false, {
    type: 'boolean'
  });
  this.add('Favorite_Rooms', true, {
    type: 'boolean',
    'public': true
  });
  this.add('First_Channel_After_Login', '', {
    type: 'string',
    'public': true
  });
  this.add('Unread_Count', 'user_and_group_mentions_only', {
    type: 'select',
    values: [{
      key: 'all_messages',
      i18nLabel: 'All_messages'
    }, {
      key: 'user_mentions_only',
      i18nLabel: 'User_mentions_only'
    }, {
      key: 'group_mentions_only',
      i18nLabel: 'Group_mentions_only'
    }, {
      key: 'user_and_group_mentions_only',
      i18nLabel: 'User_and_group_mentions_only'
    }],
    'public': true
  });
  this.add('Unread_Count_DM', 'all_messages', {
    type: 'select',
    values: [{
      key: 'all_messages',
      i18nLabel: 'All_messages'
    }, {
      key: 'mentions_only',
      i18nLabel: 'Mentions_only'
    }],
    'public': true
  });
  this.add('CDN_PREFIX', '', {
    type: 'string',
    'public': true
  });
  this.add('Force_SSL', false, {
    type: 'boolean',
    'public': true
  });
  this.add('GoogleTagManager_id', '', {
    type: 'string',
    'public': true
  });
  this.add('Bugsnag_api_key', '', {
    type: 'string',
    'public': false
  });
  this.add('Force_Disable_OpLog_For_Cache', false, {
    type: 'boolean',
    'public': false
  });
  this.add('Restart', 'restart_server', {
    type: 'action',
    actionText: 'Restart_the_server'
  });
  this.add('Store_Last_Message', false, {
    type: 'boolean',
    public: true,
    i18nDescription: 'Store_Last_Message_Sent_per_Room'
  });
  this.section('UTF8', function () {
    this.add('UTF8_Names_Validation', '[0-9a-zA-Z-_.]+', {
      type: 'string',
      'public': true,
      i18nDescription: 'UTF8_Names_Validation_Description'
    });
    return this.add('UTF8_Names_Slugify', true, {
      type: 'boolean',
      'public': true
    });
  });
  this.section('Reporting', function () {
    return this.add('Statistics_reporting', true, {
      type: 'boolean'
    });
  });
  this.section('Notifications', function () {
    this.add('Notifications_Max_Room_Members', 100, {
      type: 'int',
      public: true,
      i18nDescription: 'Notifications_Max_Room_Members_Description'
    });
    this.add('Notifications_Always_Notify_Mobile', false, {
      type: 'boolean',
      public: true,
      i18nDescription: 'Notifications_Always_Notify_Mobile_Description'
    });
  });
  this.section('REST API', function () {
    return this.add('API_User_Limit', 500, {
      type: 'int',
      'public': true,
      i18nDescription: 'API_User_Limit'
    });
  });
  this.section('Iframe_Integration', function () {
    this.add('Iframe_Integration_send_enable', false, {
      type: 'boolean',
      'public': true
    });
    this.add('Iframe_Integration_send_target_origin', '*', {
      type: 'string',
      'public': true,
      enableQuery: {
        _id: 'Iframe_Integration_send_enable',
        value: true
      }
    });
    this.add('Iframe_Integration_receive_enable', false, {
      type: 'boolean',
      'public': true
    });
    return this.add('Iframe_Integration_receive_origin', '*', {
      type: 'string',
      'public': true,
      enableQuery: {
        _id: 'Iframe_Integration_receive_enable',
        value: true
      }
    });
  });
  this.section('Translations', function () {
    return this.add('Custom_Translations', '', {
      type: 'code',
      'public': true
    });
  });
  return this.section('Stream_Cast', function () {
    return this.add('Stream_Cast_Address', '', {
      type: 'string'
    });
  });
});
RocketChat.settings.addGroup('Email', function () {
  this.section('Subject', function () {
    this.add('Offline_DM_Email', '[[Site_Name]] You have been direct messaged by [User]', {
      type: 'code',
      code: 'text',
      multiline: true,
      i18nLabel: 'Offline_DM_Email',
      i18nDescription: 'Offline_Email_Subject_Description'
    });
    this.add('Offline_Mention_Email', '[[Site_Name]] You have been mentioned by [User] in #[Room]', {
      type: 'code',
      code: 'text',
      multiline: true,
      i18nLabel: 'Offline_Mention_Email',
      i18nDescription: 'Offline_Email_Subject_Description'
    });
    return this.add('Offline_Mention_All_Email', '[User] has posted a message in #[Room]', {
      type: 'code',
      code: 'text',
      multiline: true,
      i18nLabel: 'Offline_Mention_All_Email',
      i18nDescription: 'Offline_Email_Subject_Description'
    });
  });
  this.section('Header_and_Footer', function () {
    this.add('Email_Header', '<html><table border="0" cellspacing="0" cellpadding="0" width="100%" bgcolor="#f3f3f3" style="color:#4a4a4a;font-family: Helvetica,Arial,sans-serif;font-size:14px;line-height:20px;border-collapse:collapse;border-spacing:0;margin:0 auto"><tr><td style="padding:1em"><table border="0" cellspacing="0" cellpadding="0" align="center" width="100%" style="width:100%;margin:0 auto;max-width:800px"><tr><td bgcolor="#ffffff" style="background-color:#ffffff; border: 1px solid #DDD; font-size: 10pt; font-family: Helvetica,Arial,sans-serif;"><table width="100%" border="0" cellspacing="0" cellpadding="0"><tr><td style="background-color: #04436a;"><h1 style="font-family: Helvetica,Arial,sans-serif; padding: 0 1em; margin: 0; line-height: 70px; color: #FFF;">[Site_Name]</h1></td></tr><tr><td style="padding: 1em; font-size: 10pt; font-family: Helvetica,Arial,sans-serif;">', {
      type: 'code',
      code: 'text/html',
      multiline: true,
      i18nLabel: 'Header'
    });
    this.add('Email_Footer', '</td></tr></table></td></tr><tr><td border="0" cellspacing="0" cellpadding="0" width="100%" style="font-family: Helvetica,Arial,sans-serif; max-width: 800px; margin: 0 auto; padding: 1.5em; text-align: center; font-size: 8pt; color: #999;">Powered by <a href="https://rocket.chat" target="_blank">Rocket.Chat</a></td></tr></table></td></tr></table></html>', {
      type: 'code',
      code: 'text/html',
      multiline: true,
      i18nLabel: 'Footer'
    });
    return this.add('Email_Footer_Direct_Reply', '</td></tr></table></td></tr><tr><td border="0" cellspacing="0" cellpadding="0" width="100%" style="font-family: Helvetica,Arial,sans-serif; max-width: 800px; margin: 0 auto; padding: 1.5em; text-align: center; font-size: 8pt; color: #999;">You can directly reply to this email.<br>Do not modify previous emails in the thread.<br>Powered by <a href="https://rocket.chat" target="_blank">Rocket.Chat</a></td></tr></table></td></tr></table></html>', {
      type: 'code',
      code: 'text/html',
      multiline: true,
      i18nLabel: 'Footer_Direct_Reply'
    });
  });
  this.section('Direct_Reply', function () {
    this.add('Direct_Reply_Enable', false, {
      type: 'boolean',
      env: true,
      i18nLabel: 'Direct_Reply_Enable'
    });
    this.add('Direct_Reply_Debug', false, {
      type: 'boolean',
      env: true,
      i18nLabel: 'Direct_Reply_Debug',
      i18nDescription: 'Direct_Reply_Debug_Description'
    });
    this.add('Direct_Reply_Protocol', 'IMAP', {
      type: 'select',
      values: [{
        key: 'IMAP',
        i18nLabel: 'IMAP'
      }, {
        key: 'POP',
        i18nLabel: 'POP'
      }],
      env: true,
      i18nLabel: 'Protocol'
    });
    this.add('Direct_Reply_Host', '', {
      type: 'string',
      env: true,
      i18nLabel: 'Host'
    });
    this.add('Direct_Reply_Port', '143', {
      type: 'select',
      values: [{
        key: '143',
        i18nLabel: '143'
      }, {
        key: '993',
        i18nLabel: '993'
      }, {
        key: '110',
        i18nLabel: '110'
      }, {
        key: '995',
        i18nLabel: '995'
      }],
      env: true,
      i18nLabel: 'Port'
    });
    this.add('Direct_Reply_IgnoreTLS', false, {
      type: 'boolean',
      env: true,
      i18nLabel: 'IgnoreTLS'
    });
    this.add('Direct_Reply_Frequency', 5, {
      type: 'int',
      env: true,
      i18nLabel: 'Direct_Reply_Frequency',
      enableQuery: {
        _id: 'Direct_Reply_Protocol',
        value: 'POP'
      }
    });
    this.add('Direct_Reply_Delete', true, {
      type: 'boolean',
      env: true,
      i18nLabel: 'Direct_Reply_Delete',
      enableQuery: {
        _id: 'Direct_Reply_Protocol',
        value: 'IMAP'
      }
    });
    this.add('Direct_Reply_Separator', '+', {
      type: 'select',
      values: [{
        key: '!',
        i18nLabel: '!'
      }, {
        key: '#',
        i18nLabel: '#'
      }, {
        key: '$',
        i18nLabel: '$'
      }, {
        key: '%',
        i18nLabel: '%'
      }, {
        key: '&',
        i18nLabel: '&'
      }, {
        key: '\'',
        i18nLabel: '\''
      }, {
        key: '*',
        i18nLabel: '*'
      }, {
        key: '+',
        i18nLabel: '+'
      }, {
        key: '-',
        i18nLabel: '-'
      }, {
        key: '/',
        i18nLabel: '/'
      }, {
        key: '=',
        i18nLabel: '='
      }, {
        key: '?',
        i18nLabel: '?'
      }, {
        key: '^',
        i18nLabel: '^'
      }, {
        key: '_',
        i18nLabel: '_'
      }, {
        key: '`',
        i18nLabel: '`'
      }, {
        key: '{',
        i18nLabel: '{'
      }, {
        key: '|',
        i18nLabel: '|'
      }, {
        key: '}',
        i18nLabel: '}'
      }, {
        key: '~',
        i18nLabel: '~'
      }],
      env: true,
      i18nLabel: 'Direct_Reply_Separator'
    });
    this.add('Direct_Reply_Username', '', {
      type: 'string',
      env: true,
      i18nLabel: 'Username',
      placeholder: 'email@domain'
    });
    return this.add('Direct_Reply_Password', '', {
      type: 'password',
      env: true,
      i18nLabel: 'Password'
    });
  });
  this.section('SMTP', function () {
    this.add('SMTP_Protocol', 'smtp', {
      type: 'select',
      values: [{
        key: 'smtp',
        i18nLabel: 'smtp'
      }, {
        key: 'smtps',
        i18nLabel: 'smtps'
      }],
      env: true,
      i18nLabel: 'Protocol'
    });
    this.add('SMTP_Host', '', {
      type: 'string',
      env: true,
      i18nLabel: 'Host'
    });
    this.add('SMTP_Port', '', {
      type: 'string',
      env: true,
      i18nLabel: 'Port'
    });
    this.add('SMTP_IgnoreTLS', false, {
      type: 'boolean',
      env: true,
      i18nLabel: 'IgnoreTLS',
      enableQuery: {
        _id: 'SMTP_Protocol',
        value: 'smtp'
      }
    });
    this.add('SMTP_Pool', true, {
      type: 'boolean',
      env: true,
      i18nLabel: 'Pool'
    });
    this.add('SMTP_Username', '', {
      type: 'string',
      env: true,
      i18nLabel: 'Username',
      autocomplete: false
    });
    this.add('SMTP_Password', '', {
      type: 'password',
      env: true,
      i18nLabel: 'Password',
      autocomplete: false
    });
    this.add('From_Email', '', {
      type: 'string',
      placeholder: 'email@domain'
    });
    return this.add('SMTP_Test_Button', 'sendSMTPTestEmail', {
      type: 'action',
      actionText: 'Send_a_test_mail_to_my_user'
    });
  });
  this.section('Invitation', function () {
    this.add('Invitation_Customized', false, {
      type: 'boolean',
      i18nLabel: 'Custom'
    });
    this.add('Invitation_Subject', '', {
      type: 'string',
      i18nLabel: 'Subject',
      enableQuery: {
        _id: 'Invitation_Customized',
        value: true
      },
      i18nDefaultQuery: {
        _id: 'Invitation_Customized',
        value: false
      }
    });
    return this.add('Invitation_HTML', '', {
      type: 'code',
      code: 'text/html',
      multiline: true,
      i18nLabel: 'Body',
      i18nDescription: 'Invitation_HTML_Description',
      enableQuery: {
        _id: 'Invitation_Customized',
        value: true
      },
      i18nDefaultQuery: {
        _id: 'Invitation_Customized',
        value: false
      }
    });
  });
  this.section('Registration', function () {
    this.add('Accounts_Enrollment_Customized', false, {
      type: 'boolean',
      i18nLabel: 'Custom'
    });
    this.add('Accounts_Enrollment_Email_Subject', '', {
      type: 'string',
      i18nLabel: 'Subject',
      enableQuery: {
        _id: 'Accounts_Enrollment_Customized',
        value: true
      },
      i18nDefaultQuery: {
        _id: 'Accounts_Enrollment_Customized',
        value: false
      }
    });
    return this.add('Accounts_Enrollment_Email', '', {
      type: 'code',
      code: 'text/html',
      multiline: true,
      i18nLabel: 'Body',
      enableQuery: {
        _id: 'Accounts_Enrollment_Customized',
        value: true
      },
      i18nDefaultQuery: {
        _id: 'Accounts_Enrollment_Customized',
        value: false
      }
    });
  });
  this.section('Registration_via_Admin', function () {
    this.add('Accounts_UserAddedEmail_Customized', false, {
      type: 'boolean',
      i18nLabel: 'Custom'
    });
    this.add('Accounts_UserAddedEmailSubject', '', {
      type: 'string',
      i18nLabel: 'Subject',
      enableQuery: {
        _id: 'Accounts_UserAddedEmail_Customized',
        value: true
      },
      i18nDefaultQuery: {
        _id: 'Accounts_UserAddedEmail_Customized',
        value: false
      }
    });
    return this.add('Accounts_UserAddedEmail', '', {
      type: 'code',
      code: 'text/html',
      multiline: true,
      i18nLabel: 'Body',
      i18nDescription: 'Accounts_UserAddedEmail_Description',
      enableQuery: {
        _id: 'Accounts_UserAddedEmail_Customized',
        value: true
      },
      i18nDefaultQuery: {
        _id: 'Accounts_UserAddedEmail_Customized',
        value: false
      }
    });
  });
  this.section('Forgot_password_section', function () {
    this.add('Forgot_Password_Customized', false, {
      type: 'boolean',
      i18nLabel: 'Custom'
    });
    this.add('Forgot_Password_Email_Subject', '', {
      type: 'string',
      i18nLabel: 'Subject',
      enableQuery: {
        _id: 'Forgot_Password_Customized',
        value: true
      },
      i18nDefaultQuery: {
        _id: 'Forgot_Password_Customized',
        value: false
      }
    });
    return this.add('Forgot_Password_Email', '', {
      type: 'code',
      code: 'text/html',
      multiline: true,
      i18nLabel: 'Body',
      i18nDescription: 'Forgot_Password_Description',
      enableQuery: {
        _id: 'Forgot_Password_Customized',
        value: true
      },
      i18nDefaultQuery: {
        _id: 'Forgot_Password_Customized',
        value: false
      }
    });
  });
  return this.section('Verification', function () {
    this.add('Verification_Customized', false, {
      type: 'boolean',
      i18nLabel: 'Custom'
    });
    this.add('Verification_Email_Subject', '', {
      type: 'string',
      i18nLabel: 'Subject',
      enableQuery: {
        _id: 'Verification_Customized',
        value: true
      },
      i18nDefaultQuery: {
        _id: 'Verification_Customized',
        value: false
      }
    });
    return this.add('Verification_Email', '', {
      type: 'code',
      code: 'text/html',
      multiline: true,
      i18nLabel: 'Body',
      i18nDescription: 'Verification_Description',
      enableQuery: {
        _id: 'Verification_Customized',
        value: true
      },
      i18nDefaultQuery: {
        _id: 'Verification_Customized',
        value: false
      }
    });
  });
});
RocketChat.settings.addGroup('Message', function () {
  this.section('Message_Attachments', function () {
    this.add('Message_Attachments_GroupAttach', false, {
      type: 'boolean',
      'public': true,
      i18nDescription: 'Message_Attachments_GroupAttachDescription'
    });
  });
  this.section('Message_Audio', function () {
    this.add('Message_AudioRecorderEnabled', true, {
      type: 'boolean',
      'public': true,
      i18nDescription: 'Message_AudioRecorderEnabledDescription'
    });
    this.add('Message_Audio_bitRate', 32, {
      type: 'int',
      'public': true
    });
  });
  this.add('Message_AllowEditing', true, {
    type: 'boolean',
    'public': true
  });
  this.add('Message_AllowEditing_BlockEditInMinutes', 0, {
    type: 'int',
    'public': true,
    i18nDescription: 'Message_AllowEditing_BlockEditInMinutesDescription'
  });
  this.add('Message_AllowDeleting', true, {
    type: 'boolean',
    'public': true
  });
  this.add('Message_AllowDeleting_BlockDeleteInMinutes', 0, {
    type: 'int',
    'public': true,
    i18nDescription: 'Message_AllowDeleting_BlockDeleteInMinutes'
  });
  this.add('Message_AllowUnrecognizedSlashCommand', false, {
    type: 'boolean',
    'public': true
  });
  this.add('Message_AllowDirectMessagesToYourself', true, {
    type: 'boolean',
    'public': true
  });
  this.add('Message_AlwaysSearchRegExp', false, {
    type: 'boolean'
  });
  this.add('Message_ShowEditedStatus', true, {
    type: 'boolean',
    'public': true
  });
  this.add('Message_ShowDeletedStatus', false, {
    type: 'boolean',
    'public': true
  });
  this.add('Message_AllowBadWordsFilter', false, {
    type: 'boolean',
    'public': true
  });
  this.add('Message_BadWordsFilterList', '', {
    type: 'string',
    'public': true
  });
  this.add('Message_KeepHistory', false, {
    type: 'boolean',
    'public': true
  });
  this.add('Message_MaxAll', 0, {
    type: 'int',
    'public': true
  });
  this.add('Message_MaxAllowedSize', 5000, {
    type: 'int',
    'public': true
  });
  this.add('Message_ShowFormattingTips', true, {
    type: 'boolean',
    'public': true
  });
  this.add('Message_SetNameToAliasEnabled', false, {
    type: 'boolean',
    'public': false,
    i18nDescription: 'Message_SetNameToAliasEnabled_Description'
  });
  this.add('Message_GroupingPeriod', 300, {
    type: 'int',
    'public': true,
    i18nDescription: 'Message_GroupingPeriodDescription'
  });
  this.add('API_Embed', true, {
    type: 'boolean',
    'public': true
  });
  this.add('API_Embed_UserAgent', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2227.0 Safari/537.36', {
    type: 'string',
    'public': true
  });
  this.add('API_EmbedCacheExpirationDays', 30, {
    type: 'int',
    'public': false
  });
  this.add('API_Embed_clear_cache_now', 'OEmbedCacheCleanup', {
    type: 'action',
    actionText: 'clear',
    i18nLabel: 'clear_cache_now'
  });
  this.add('API_EmbedDisabledFor', '', {
    type: 'string',
    'public': true,
    i18nDescription: 'API_EmbedDisabledFor_Description'
  });
  this.add('API_EmbedIgnoredHosts', 'localhost, 127.0.0.1, 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16', {
    type: 'string',
    i18nDescription: 'API_EmbedIgnoredHosts_Description'
  });
  this.add('API_EmbedSafePorts', '80, 443', {
    type: 'string'
  });
  this.add('Message_TimeFormat', 'LT', {
    type: 'string',
    'public': true,
    i18nDescription: 'Message_TimeFormat_Description'
  });
  this.add('Message_DateFormat', 'LL', {
    type: 'string',
    'public': true,
    i18nDescription: 'Message_DateFormat_Description'
  });
  this.add('Message_TimeAndDateFormat', 'LLL', {
    type: 'string',
    'public': true,
    i18nDescription: 'Message_TimeAndDateFormat_Description'
  });
  this.add('Message_QuoteChainLimit', 2, {
    type: 'int',
    'public': true
  });
  this.add('Message_HideType_uj', false, {
    type: 'boolean',
    'public': true
  });
  this.add('Message_HideType_ul', false, {
    type: 'boolean',
    'public': true
  });
  this.add('Message_HideType_ru', false, {
    type: 'boolean',
    'public': true
  });
  this.add('Message_HideType_au', false, {
    type: 'boolean',
    'public': true
  });
  this.add('Message_HideType_mute_unmute', false, {
    type: 'boolean',
    'public': true
  });
  this.add('Message_ErasureType', 'Delete', {
    type: 'select',
    'public': true,
    values: [{
      key: 'Keep',
      i18nLabel: 'Message_ErasureType_Keep'
    }, {
      key: 'Delete',
      i18nLabel: 'Message_ErasureType_Delete'
    }, {
      key: 'Unlink',
      i18nLabel: 'Message_ErasureType_Unlink'
    }]
  });
});
RocketChat.settings.addGroup('Meta', function () {
  this.add('Meta_language', '', {
    type: 'string'
  });
  this.add('Meta_fb_app_id', '', {
    type: 'string'
  });
  this.add('Meta_robots', 'INDEX,FOLLOW', {
    type: 'string'
  });
  this.add('Meta_google-site-verification', '', {
    type: 'string'
  });
  this.add('Meta_msvalidate01', '', {
    type: 'string'
  });
  return this.add('Meta_custom', '', {
    type: 'code',
    code: 'text/html',
    multiline: true
  });
});
RocketChat.settings.addGroup('Push', function () {
  this.add('Push_enable', true, {
    type: 'boolean',
    'public': true
  });
  this.add('Push_debug', false, {
    type: 'boolean',
    'public': true,
    enableQuery: {
      _id: 'Push_enable',
      value: true
    }
  });
  this.add('Push_enable_gateway', true, {
    type: 'boolean',
    enableQuery: {
      _id: 'Push_enable',
      value: true
    }
  });
  this.add('Push_gateway', 'https://gateway.rocket.chat', {
    type: 'string',
    enableQuery: [{
      _id: 'Push_enable',
      value: true
    }, {
      _id: 'Push_enable_gateway',
      value: true
    }]
  });
  this.add('Push_production', true, {
    type: 'boolean',
    'public': true,
    enableQuery: [{
      _id: 'Push_enable',
      value: true
    }, {
      _id: 'Push_enable_gateway',
      value: false
    }]
  });
  this.add('Push_test_push', 'push_test', {
    type: 'action',
    actionText: 'Send_a_test_push_to_my_user',
    enableQuery: {
      _id: 'Push_enable',
      value: true
    }
  });
  this.section('Certificates_and_Keys', function () {
    this.add('Push_apn_passphrase', '', {
      type: 'string'
    });
    this.add('Push_apn_key', '', {
      type: 'string',
      multiline: true
    });
    this.add('Push_apn_cert', '', {
      type: 'string',
      multiline: true
    });
    this.add('Push_apn_dev_passphrase', '', {
      type: 'string'
    });
    this.add('Push_apn_dev_key', '', {
      type: 'string',
      multiline: true
    });
    this.add('Push_apn_dev_cert', '', {
      type: 'string',
      multiline: true
    });
    this.add('Push_gcm_api_key', '', {
      type: 'string'
    });
    return this.add('Push_gcm_project_number', '', {
      type: 'string',
      'public': true
    });
  });
  return this.section('Privacy', function () {
    this.add('Push_show_username_room', true, {
      type: 'boolean',
      'public': true
    });
    return this.add('Push_show_message', true, {
      type: 'boolean',
      'public': true
    });
  });
});
RocketChat.settings.addGroup('Layout', function () {
  this.section('Content', function () {
    this.add('Layout_Home_Title', 'Home', {
      type: 'string',
      'public': true
    });
    this.add('Layout_Home_Body', '<p>Welcome to Rocket.Chat!</p>\n<p>The Rocket.Chat desktops apps for Windows, macOS and Linux are available to download <a title="Rocket.Chat desktop apps" href="https://rocket.chat/download" target="_blank" rel="noopener">here</a>.</p><p>The native mobile app, Rocket.Chat+,\n  for Android and iOS is available from <a title="Rocket.Chat+ on Google Play" href="https://play.google.com/store/apps/details?id=chat.rocket.android" target="_blank" rel="noopener">Google Play</a> and the <a title="Rocket.Chat+ on the App Store" href="https://itunes.apple.com/app/rocket-chat/id1148741252" target="_blank" rel="noopener">App Store</a>.</p>\n<p>For further help, please consult the <a title="Rocket.Chat Documentation" href="https://rocket.chat/docs/" target="_blank" rel="noopener">documentation</a>.</p>\n<p>If you\'re an admin, feel free to change this content via <strong>Administration</strong> -> <strong>Layout</strong> -> <strong>Home Body</strong>. Or clicking <a title="Home Body Layout" href="/admin/Layout">here</a>.</p>', {
      type: 'code',
      code: 'text/html',
      multiline: true,
      'public': true
    });
    this.add('Layout_Terms_of_Service', 'Terms of Service <br> Go to APP SETTINGS -> Layout to customize this page.', {
      type: 'code',
      code: 'text/html',
      multiline: true,
      'public': true
    });
    this.add('Layout_Login_Terms', 'By proceeding you are agreeing to our <a href="terms-of-service">Terms of Service</a> and <a href="privacy-policy">Privacy Policy</a>.', {
      type: 'string',
      multiline: true,
      'public': true
    });
    this.add('Layout_Privacy_Policy', 'Privacy Policy <br> Go to APP SETTINGS -> Layout to customize this page.', {
      type: 'code',
      code: 'text/html',
      multiline: true,
      'public': true
    });
    return this.add('Layout_Sidenav_Footer', '<a href="/home"><img src="assets/logo"/></a>', {
      type: 'code',
      code: 'text/html',
      'public': true,
      i18nDescription: 'Layout_Sidenav_Footer_description'
    });
  });
  this.section('Custom_Scripts', function () {
    this.add('Custom_Script_Logged_Out', '//Add your script', {
      type: 'code',
      multiline: true,
      'public': true
    });
    return this.add('Custom_Script_Logged_In', '//Add your script', {
      type: 'code',
      multiline: true,
      'public': true
    });
  });
  return this.section('User_Interface', function () {
    this.add('UI_DisplayRoles', true, {
      type: 'boolean',
      'public': true
    });
    this.add('UI_Merge_Channels_Groups', true, {
      type: 'boolean',
      'public': true
    });
    this.add('UI_Use_Name_Avatar', false, {
      type: 'boolean',
      'public': true
    });
    this.add('UI_Use_Real_Name', false, {
      type: 'boolean',
      'public': true
    });
    this.add('UI_Click_Direct_Message', false, {
      type: 'boolean',
      'public': true
    });
    this.add('UI_Unread_Counter_Style', 'Different_Style_For_User_Mentions', {
      type: 'select',
      values: [{
        key: 'Same_Style_For_Mentions',
        i18nLabel: 'Same_Style_For_Mentions'
      }, {
        key: 'Different_Style_For_User_Mentions',
        i18nLabel: 'Different_Style_For_User_Mentions'
      }],
      'public': true
    });
    this.add('UI_Allow_room_names_with_special_chars', false, {
      type: 'boolean',
      public: true
    });
  });
});
RocketChat.settings.addGroup('Logs', function () {
  this.add('Log_Level', '0', {
    type: 'select',
    values: [{
      key: '0',
      i18nLabel: '0_Errors_Only'
    }, {
      key: '1',
      i18nLabel: '1_Errors_and_Information'
    }, {
      key: '2',
      i18nLabel: '2_Erros_Information_and_Debug'
    }],
    'public': true
  });
  this.add('Log_Package', false, {
    type: 'boolean',
    'public': true
  });
  this.add('Log_File', false, {
    type: 'boolean',
    'public': true
  });
  return this.add('Log_View_Limit', 1000, {
    type: 'int'
  });
});
RocketChat.settings.init();
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"publications":{"settings.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/server/publications/settings.js                                                             //
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
  'public-settings/get'(updatedAt) {
    this.unblock();
    const records = RocketChat.models.Settings.find().fetch().filter(function (record) {
      return record.hidden !== true && record['public'] === true;
    });

    if (updatedAt instanceof Date) {
      return {
        update: records.filter(function (record) {
          return record._updatedAt > updatedAt;
        }),
        remove: RocketChat.models.Settings.trashFindDeletedAfter(updatedAt, {
          hidden: {
            $ne: true
          },
          'public': true
        }, {
          fields: {
            _id: 1,
            _deletedAt: 1
          }
        }).fetch()
      };
    }

    return records;
  },

  'private-settings/get'(updatedAt) {
    if (!Meteor.userId()) {
      return [];
    }

    this.unblock();

    if (!RocketChat.authz.hasPermission(Meteor.userId(), 'view-privileged-setting')) {
      return [];
    }

    const records = RocketChat.models.Settings.find().fetch().filter(function (record) {
      return record.hidden !== true;
    });

    if (updatedAt instanceof Date) {
      return {
        update: records.filter(function (record) {
          return record._updatedAt > updatedAt;
        }),
        remove: RocketChat.models.Settings.trashFindDeletedAfter(updatedAt, {
          hidden: {
            $ne: true
          }
        }, {
          fields: {
            _id: 1,
            _deletedAt: 1
          }
        }).fetch()
      };
    }

    return records;
  }

});
RocketChat.models.Settings.cache.on('changed', function (type, setting) {
  if (setting['public'] === true) {
    RocketChat.Notifications.notifyAllInThisInstance('public-settings-changed', type, _.pick(setting, '_id', 'value', 'editor', 'properties'));
  }

  return RocketChat.Notifications.notifyLoggedInThisInstance('private-settings-changed', type, setting);
});
RocketChat.Notifications.streamAll.allowRead('private-settings-changed', function () {
  if (this.userId == null) {
    return false;
  }

  return RocketChat.authz.hasPermission(this.userId, 'view-privileged-setting');
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"methods":{"addOAuthService.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/server/methods/addOAuthService.js                                                           //
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
  addOAuthService(name) {
    check(name, String);

    if (!Meteor.userId()) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'addOAuthService'
      });
    }

    if (RocketChat.authz.hasPermission(Meteor.userId(), 'add-oauth-service') !== true) {
      throw new Meteor.Error('error-action-not-allowed', 'Adding OAuth Services is not allowed', {
        method: 'addOAuthService',
        action: 'Adding_OAuth_Services'
      });
    }

    name = name.toLowerCase().replace(/[^a-z0-9_]/g, '');
    name = s.capitalize(name);
    RocketChat.settings.add(`Accounts_OAuth_Custom-${name}`, false, {
      type: 'boolean',
      group: 'OAuth',
      section: `Custom OAuth: ${name}`,
      i18nLabel: 'Accounts_OAuth_Custom_Enable',
      persistent: true
    });
    RocketChat.settings.add(`Accounts_OAuth_Custom-${name}-url`, '', {
      type: 'string',
      group: 'OAuth',
      section: `Custom OAuth: ${name}`,
      i18nLabel: 'URL',
      persistent: true
    });
    RocketChat.settings.add(`Accounts_OAuth_Custom-${name}-token_path`, '/oauth/token', {
      type: 'string',
      group: 'OAuth',
      section: `Custom OAuth: ${name}`,
      i18nLabel: 'Accounts_OAuth_Custom_Token_Path',
      persistent: true
    });
    RocketChat.settings.add(`Accounts_OAuth_Custom-${name}-token_sent_via`, 'payload', {
      type: 'select',
      group: 'OAuth',
      section: `Custom OAuth: ${name}`,
      i18nLabel: 'Accounts_OAuth_Custom_Token_Sent_Via',
      persistent: true,
      values: [{
        key: 'header',
        i18nLabel: 'Header'
      }, {
        key: 'payload',
        i18nLabel: 'Payload'
      }]
    });
    RocketChat.settings.add(`Accounts_OAuth_Custom-${name}-identity_token_sent_via`, 'default', {
      type: 'select',
      group: 'OAuth',
      section: `Custom OAuth: ${name}`,
      i18nLabel: 'Accounts_OAuth_Custom_Identity_Token_Sent_Via',
      persistent: true,
      values: [{
        key: 'default',
        i18nLabel: 'Same_As_Token_Sent_Via'
      }, {
        key: 'header',
        i18nLabel: 'Header'
      }, {
        key: 'payload',
        i18nLabel: 'Payload'
      }]
    });
    RocketChat.settings.add(`Accounts_OAuth_Custom-${name}-identity_path`, '/me', {
      type: 'string',
      group: 'OAuth',
      section: `Custom OAuth: ${name}`,
      i18nLabel: 'Accounts_OAuth_Custom_Identity_Path',
      persistent: true
    });
    RocketChat.settings.add(`Accounts_OAuth_Custom-${name}-authorize_path`, '/oauth/authorize', {
      type: 'string',
      group: 'OAuth',
      section: `Custom OAuth: ${name}`,
      i18nLabel: 'Accounts_OAuth_Custom_Authorize_Path',
      persistent: true
    });
    RocketChat.settings.add(`Accounts_OAuth_Custom-${name}-scope`, 'openid', {
      type: 'string',
      group: 'OAuth',
      section: `Custom OAuth: ${name}`,
      i18nLabel: 'Accounts_OAuth_Custom_Scope',
      persistent: true
    });
    RocketChat.settings.add(`Accounts_OAuth_Custom-${name}-id`, '', {
      type: 'string',
      group: 'OAuth',
      section: `Custom OAuth: ${name}`,
      i18nLabel: 'Accounts_OAuth_Custom_id',
      persistent: true
    });
    RocketChat.settings.add(`Accounts_OAuth_Custom-${name}-secret`, '', {
      type: 'string',
      group: 'OAuth',
      section: `Custom OAuth: ${name}`,
      i18nLabel: 'Accounts_OAuth_Custom_Secret',
      persistent: true
    });
    RocketChat.settings.add(`Accounts_OAuth_Custom-${name}-login_style`, 'popup', {
      type: 'select',
      group: 'OAuth',
      section: `Custom OAuth: ${name}`,
      i18nLabel: 'Accounts_OAuth_Custom_Login_Style',
      persistent: true,
      values: [{
        key: 'redirect',
        i18nLabel: 'Redirect'
      }, {
        key: 'popup',
        i18nLabel: 'Popup'
      }, {
        key: '',
        i18nLabel: 'Default'
      }]
    });
    RocketChat.settings.add(`Accounts_OAuth_Custom-${name}-button_label_text`, '', {
      type: 'string',
      group: 'OAuth',
      section: `Custom OAuth: ${name}`,
      i18nLabel: 'Accounts_OAuth_Custom_Button_Label_Text',
      persistent: true
    });
    RocketChat.settings.add(`Accounts_OAuth_Custom-${name}-button_label_color`, '#FFFFFF', {
      type: 'string',
      group: 'OAuth',
      section: `Custom OAuth: ${name}`,
      i18nLabel: 'Accounts_OAuth_Custom_Button_Label_Color',
      persistent: true
    });
    RocketChat.settings.add(`Accounts_OAuth_Custom-${name}-button_color`, '#13679A', {
      type: 'string',
      group: 'OAuth',
      section: `Custom OAuth: ${name}`,
      i18nLabel: 'Accounts_OAuth_Custom_Button_Color',
      persistent: true
    });
    RocketChat.settings.add(`Accounts_OAuth_Custom-${name}-username_field`, '', {
      type: 'string',
      group: 'OAuth',
      section: `Custom OAuth: ${name}`,
      i18nLabel: 'Accounts_OAuth_Custom_Username_Field',
      persistent: true
    });
    RocketChat.settings.add(`Accounts_OAuth_Custom-${name}-merge_users`, false, {
      type: 'boolean',
      group: 'OAuth',
      section: `Custom OAuth: ${name}`,
      i18nLabel: 'Accounts_OAuth_Custom_Merge_Users',
      persistent: true
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"refreshOAuthService.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/server/methods/refreshOAuthService.js                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  refreshOAuthService() {
    if (!Meteor.userId()) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'refreshOAuthService'
      });
    }

    if (RocketChat.authz.hasPermission(Meteor.userId(), 'add-oauth-service') !== true) {
      throw new Meteor.Error('error-action-not-allowed', 'Refresh OAuth Services is not allowed', {
        method: 'refreshOAuthService',
        action: 'Refreshing_OAuth_Services'
      });
    }

    ServiceConfiguration.configurations.remove({});
    RocketChat.models.Settings.update({
      _id: /^Accounts_OAuth_.+/
    }, {
      $set: {
        _updatedAt: new Date()
      }
    }, {
      multi: true
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"addUserToRoom.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/server/methods/addUserToRoom.js                                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  addUserToRoom(data) {
    return Meteor.call('addUsersToRoom', {
      rid: data.rid,
      users: [data.username]
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"addUsersToRoom.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/server/methods/addUsersToRoom.js                                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  addUsersToRoom(data = {}) {
    // Validate user and room
    if (!Meteor.userId()) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'addUsersToRoom'
      });
    }

    if (!Match.test(data.rid, String)) {
      throw new Meteor.Error('error-invalid-room', 'Invalid room', {
        method: 'addUsersToRoom'
      });
    } // Get user and room details


    const room = RocketChat.models.Rooms.findOneById(data.rid);
    const userId = Meteor.userId();
    const user = Meteor.user();
    const userInRoom = Array.isArray(room.usernames) && room.usernames.includes(user.username); // Can't add to direct room ever

    if (room.t === 'd') {
      throw new Meteor.Error('error-cant-invite-for-direct-room', 'Can\'t invite user to direct rooms', {
        method: 'addUsersToRoom'
      });
    } // Can add to any room you're in, with permission, otherwise need specific room type permission


    let canAddUser = false;

    if (userInRoom && RocketChat.authz.hasPermission(userId, 'add-user-to-joined-room', room._id)) {
      canAddUser = true;
    } else if (room.t === 'c' && RocketChat.authz.hasPermission(userId, 'add-user-to-any-c-room')) {
      canAddUser = true;
    } else if (room.t === 'p' && RocketChat.authz.hasPermission(userId, 'add-user-to-any-p-room')) {
      canAddUser = true;
    } // Adding wasn't allowed


    if (!canAddUser) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'addUsersToRoom'
      });
    } // Missing the users to be added


    if (!Array.isArray(data.users)) {
      throw new Meteor.Error('error-invalid-arguments', 'Invalid arguments', {
        method: 'addUsersToRoom'
      });
    } // Validate each user, then add to room


    data.users.forEach(username => {
      const newUser = RocketChat.models.Users.findOneByUsername(username);

      if (!newUser) {
        throw new Meteor.Error('error-invalid-username', 'Invalid username', {
          method: 'addUsersToRoom'
        });
      }

      RocketChat.addUserToRoom(data.rid, newUser, user);
    });
    return true;
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"archiveRoom.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/server/methods/archiveRoom.js                                                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  archiveRoom(rid) {
    check(rid, String);

    if (!Meteor.userId()) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'archiveRoom'
      });
    }

    const room = RocketChat.models.Rooms.findOneById(rid);

    if (!room) {
      throw new Meteor.Error('error-invalid-room', 'Invalid room', {
        method: 'archiveRoom'
      });
    }

    if (!RocketChat.authz.hasPermission(Meteor.userId(), 'archive-room', room._id)) {
      throw new Meteor.Error('error-not-authorized', 'Not authorized', {
        method: 'archiveRoom'
      });
    }

    if (room.t === 'd') {
      throw new Meteor.Error('error-direct-message-room', 'Direct Messages can not be archived', {
        method: 'archiveRoom'
      });
    }

    return RocketChat.archiveRoom(rid);
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"blockUser.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/server/methods/blockUser.js                                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  blockUser({
    rid,
    blocked
  }) {
    check(rid, String);
    check(blocked, String);

    if (!Meteor.userId()) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'blockUser'
      });
    }

    const subscription = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(rid, Meteor.userId());
    const subscription2 = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(rid, blocked);

    if (!subscription || !subscription2) {
      throw new Meteor.Error('error-invalid-room', 'Invalid room', {
        method: 'blockUser'
      });
    }

    RocketChat.models.Subscriptions.setBlockedByRoomId(rid, blocked, Meteor.userId());
    return true;
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"checkRegistrationSecretURL.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/server/methods/checkRegistrationSecretURL.js                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  checkRegistrationSecretURL(hash) {
    check(hash, String);
    return hash === RocketChat.settings.get('Accounts_RegistrationForm_SecretURL');
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"checkUsernameAvailability.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/server/methods/checkUsernameAvailability.js                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  checkUsernameAvailability(username) {
    check(username, String);

    if (!Meteor.userId()) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'setUsername'
      });
    }

    const user = Meteor.user();

    if (user.username && !RocketChat.settings.get('Accounts_AllowUsernameChange')) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'setUsername'
      });
    }

    if (user.username === username) {
      return true;
    }

    return RocketChat.checkUsernameAvailability(username);
  }

});
RocketChat.RateLimiter.limitMethod('checkUsernameAvailability', 1, 1000, {
  userId() {
    return true;
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"cleanChannelHistory.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/server/methods/cleanChannelHistory.js                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  /**
   DEPRECATED
   // TODO: Remove this after three versions have been released. That means at 0.67 this should be gone.
   */
  cleanChannelHistory({
    roomId,
    latest,
    oldest,
    inclusive
  }) {
    console.warn('The method "cleanChannelHistory" is deprecated and will be removed after version 0.67, please use "cleanRoomHistory" instead');
    Meteor.call('cleanRoomHistory', {
      roomId,
      latest,
      oldest,
      inclusive
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"cleanRoomHistory.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/server/methods/cleanRoomHistory.js                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  cleanRoomHistory({
    roomId,
    latest,
    oldest,
    inclusive
  }) {
    check(roomId, String);
    check(latest, Date);
    check(oldest, Date);
    check(inclusive, Boolean);

    if (!Meteor.userId()) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'cleanRoomHistory'
      });
    }

    if (!RocketChat.authz.hasPermission(Meteor.userId(), 'clean-channel-history')) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'cleanRoomHistory'
      });
    }

    if (inclusive) {
      RocketChat.models.Messages.remove({
        rid: roomId,
        ts: {
          $gte: oldest,
          $lte: latest
        }
      });
    } else {
      RocketChat.models.Messages.remove({
        rid: roomId,
        ts: {
          $gt: oldest,
          $lt: latest
        }
      });
    }
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"createChannel.js":function(require){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/server/methods/createChannel.js                                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var _interopRequireDefault = require("@babel/runtime/helpers/builtin/interopRequireDefault");

var _objectSpread2 = _interopRequireDefault(require("@babel/runtime/helpers/builtin/objectSpread"));

Meteor.methods({
  createChannel(name, members, readOnly = false, customFields = {}, extraData = {}) {
    check(name, String);
    check(members, Match.Optional([String]));

    if (!Meteor.userId()) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'createChannel'
      });
    }

    if (!RocketChat.authz.hasPermission(Meteor.userId(), 'create-c')) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'createChannel'
      });
    }

    return RocketChat.createRoom('c', name, Meteor.user() && Meteor.user().username, members, readOnly, (0, _objectSpread2.default)({
      customFields
    }, extraData));
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"createToken.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/server/methods/createToken.js                                                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  createToken(userId) {
    if (Meteor.userId() !== userId && !RocketChat.authz.hasPermission(Meteor.userId(), 'user-generate-access-token')) {
      throw new Meteor.Error('error-not-authorized', 'Not authorized', {
        method: 'createToken'
      });
    }

    const token = Accounts._generateStampedLoginToken();

    Accounts._insertLoginToken(userId, token);

    return {
      userId,
      authToken: token.token
    };
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"createPrivateGroup.js":function(require){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/server/methods/createPrivateGroup.js                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var _interopRequireDefault = require("@babel/runtime/helpers/builtin/interopRequireDefault");

var _objectSpread2 = _interopRequireDefault(require("@babel/runtime/helpers/builtin/objectSpread"));

Meteor.methods({
  createPrivateGroup(name, members, readOnly = false, customFields = {}, extraData = {}) {
    check(name, String);
    check(members, Match.Optional([String]));

    if (!Meteor.userId()) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'createPrivateGroup'
      });
    }

    if (!RocketChat.authz.hasPermission(Meteor.userId(), 'create-p')) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'createPrivateGroup'
      });
    } // validate extra data schema


    check(extraData, Match.ObjectIncluding({
      tokenpass: Match.Maybe({
        require: String,
        tokens: [{
          token: String,
          balance: String
        }]
      })
    }));
    return RocketChat.createRoom('p', name, Meteor.user() && Meteor.user().username, members, readOnly, (0, _objectSpread2.default)({
      customFields
    }, extraData));
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"deleteMessage.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/server/methods/deleteMessage.js                                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let moment;
module.watch(require("moment"), {
  default(v) {
    moment = v;
  }

}, 0);
Meteor.methods({
  deleteMessage(message) {
    check(message, Match.ObjectIncluding({
      _id: String
    }));

    if (!Meteor.userId()) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'deleteMessage'
      });
    }

    const originalMessage = RocketChat.models.Messages.findOneById(message._id, {
      fields: {
        u: 1,
        rid: 1,
        file: 1,
        ts: 1
      }
    });

    if (originalMessage == null) {
      throw new Meteor.Error('error-action-not-allowed', 'Not allowed', {
        method: 'deleteMessage',
        action: 'Delete_message'
      });
    }

    const forceDelete = RocketChat.authz.hasPermission(Meteor.userId(), 'force-delete-message', originalMessage.rid);
    const hasPermission = RocketChat.authz.hasPermission(Meteor.userId(), 'delete-message', originalMessage.rid);
    const deleteAllowed = RocketChat.settings.get('Message_AllowDeleting');
    const deleteOwn = originalMessage && originalMessage.u && originalMessage.u._id === Meteor.userId();

    if (!(hasPermission || deleteAllowed && deleteOwn) && !forceDelete) {
      throw new Meteor.Error('error-action-not-allowed', 'Not allowed', {
        method: 'deleteMessage',
        action: 'Delete_message'
      });
    }

    const blockDeleteInMinutes = RocketChat.settings.get('Message_AllowDeleting_BlockDeleteInMinutes');

    if (blockDeleteInMinutes != null && blockDeleteInMinutes !== 0 && !forceDelete) {
      if (originalMessage.ts == null) {
        return;
      }

      const msgTs = moment(originalMessage.ts);

      if (msgTs == null) {
        return;
      }

      const currentTsDiff = moment().diff(msgTs, 'minutes');

      if (currentTsDiff > blockDeleteInMinutes) {
        throw new Meteor.Error('error-message-deleting-blocked', 'Message deleting is blocked', {
          method: 'deleteMessage'
        });
      }
    }

    return RocketChat.deleteMessage(originalMessage, Meteor.user());
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"deleteUserOwnAccount.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/server/methods/deleteUserOwnAccount.js                                                      //
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
  deleteUserOwnAccount(password) {
    check(password, String);

    if (!Meteor.userId()) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'deleteUserOwnAccount'
      });
    }

    if (!RocketChat.settings.get('Accounts_AllowDeleteOwnAccount')) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'deleteUserOwnAccount'
      });
    }

    const userId = Meteor.userId();
    const user = RocketChat.models.Users.findOneById(userId);

    if (!user) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'deleteUserOwnAccount'
      });
    }

    if (user.services && user.services.password && s.trim(user.services.password.bcrypt)) {
      const result = Accounts._checkPassword(user, {
        digest: password,
        algorithm: 'sha-256'
      });

      if (result.error) {
        throw new Meteor.Error('error-invalid-password', 'Invalid password', {
          method: 'deleteUserOwnAccount'
        });
      }
    } else if (user.username !== s.trim(password)) {
      throw new Meteor.Error('error-invalid-username', 'Invalid username', {
        method: 'deleteUserOwnAccount'
      });
    }

    Meteor.defer(function () {
      RocketChat.deleteUser(userId);
    });
    return true;
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"filterBadWords.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/server/methods/filterBadWords.js                                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Filter;
module.watch(require("bad-words"), {
  default(v) {
    Filter = v;
  }

}, 0);
RocketChat.callbacks.add('beforeSaveMessage', function (message) {
  if (RocketChat.settings.get('Message_AllowBadWordsFilter')) {
    const badWordsList = RocketChat.settings.get('Message_BadWordsFilterList');
    let options; // Add words to the blacklist

    if (!!badWordsList && badWordsList.length) {
      options = {
        list: badWordsList.split(',')
      };
    }

    const filter = new Filter(options);
    message.msg = filter.clean(message.msg);
  }

  return message;
}, 1, 'filterBadWords');
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"filterATAllTag.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/server/methods/filterATAllTag.js                                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
RocketChat.callbacks.add('beforeSaveMessage', function (message) {
  // Test if the message mentions include @all.
  if (message.mentions != null && _.pluck(message.mentions, '_id').some(item => item === 'all')) {
    // Check if the user has permissions to use @all in both global and room scopes.
    if (!RocketChat.authz.hasPermission(message.u._id, 'mention-all') && !RocketChat.authz.hasPermission(message.u._id, 'mention-all', message.rid)) {
      // Get the language of the user for the error notification.
      const language = RocketChat.models.Users.findOneById(message.u._id).language;

      const action = TAPi18n.__('Notify_all_in_this_room', {}, language); // Add a notification to the chat, informing the user that this
      // action is not allowed.


      RocketChat.Notifications.notifyUser(message.u._id, 'message', {
        _id: Random.id(),
        rid: message.rid,
        ts: new Date(),
        msg: TAPi18n.__('error-action-not-allowed', {
          action
        }, language)
      }); // Also throw to stop propagation of 'sendMessage'.

      throw new Meteor.Error('error-action-not-allowed', 'Notify all in this room not allowed', {
        method: 'filterATAllTag',
        action: 'Notify_all_in_this_room'
      });
    }
  }

  return message;
}, 1, 'filterATAllTag');
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"filterATHereTag.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/server/methods/filterATHereTag.js                                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
RocketChat.callbacks.add('beforeSaveMessage', function (message) {
  // Test if the message mentions include @here.
  if (message.mentions != null && _.pluck(message.mentions, '_id').some(item => item === 'here')) {
    // Check if the user has permissions to use @here in both global and room scopes.
    if (!RocketChat.authz.hasPermission(message.u._id, 'mention-here') && !RocketChat.authz.hasPermission(message.u._id, 'mention-here', message.rid)) {
      // Get the language of the user for the error notification.
      const language = RocketChat.models.Users.findOneById(message.u._id).language;

      const action = TAPi18n.__('Notify_active_in_this_room', {}, language); // Add a notification to the chat, informing the user that this
      // action is not allowed.


      RocketChat.Notifications.notifyUser(message.u._id, 'message', {
        _id: Random.id(),
        rid: message.rid,
        ts: new Date(),
        msg: TAPi18n.__('error-action-not-allowed', {
          action
        }, language)
      }); // Also throw to stop propagation of 'sendMessage'.

      throw new Meteor.Error('error-action-not-allowed', 'Notify here in this room not allowed', {
        method: 'filterATHereTag',
        action: 'Notify_active_in_this_room'
      });
    }
  }

  return message;
}, 1, 'filterATHereTag');
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"getChannelHistory.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/server/methods/getChannelHistory.js                                                         //
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
  getChannelHistory({
    rid,
    latest,
    oldest,
    inclusive,
    count = 20,
    unreads
  }) {
    check(rid, String);

    if (!Meteor.userId()) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'getChannelHistory'
      });
    }

    const fromUserId = Meteor.userId();
    const room = Meteor.call('canAccessRoom', rid, fromUserId);

    if (!room) {
      return false;
    } //Make sure they can access the room


    if (room.t === 'c' && !RocketChat.authz.hasPermission(fromUserId, 'preview-c-room') && room.usernames.indexOf(room.username) === -1) {
      return false;
    } //Ensure latest is always defined.


    if (_.isUndefined(latest)) {
      latest = new Date();
    } //Verify oldest is a date if it exists


    if (!_.isUndefined(oldest) && !_.isDate(oldest)) {
      throw new Meteor.Error('error-invalid-date', 'Invalid date', {
        method: 'getChannelHistory'
      });
    }

    const options = {
      sort: {
        ts: -1
      },
      limit: count
    };

    if (!RocketChat.settings.get('Message_ShowEditedStatus')) {
      options.fields = {
        'editedAt': 0
      };
    }

    let records = [];

    if (_.isUndefined(oldest) && inclusive) {
      records = RocketChat.models.Messages.findVisibleByRoomIdBeforeTimestampInclusive(rid, latest, options).fetch();
    } else if (_.isUndefined(oldest) && !inclusive) {
      records = RocketChat.models.Messages.findVisibleByRoomIdBeforeTimestamp(rid, latest, options).fetch();
    } else if (!_.isUndefined(oldest) && inclusive) {
      records = RocketChat.models.Messages.findVisibleByRoomIdBetweenTimestampsInclusive(rid, oldest, latest, options).fetch();
    } else {
      records = RocketChat.models.Messages.findVisibleByRoomIdBetweenTimestamps(rid, oldest, latest, options).fetch();
    }

    const UI_Use_Real_Name = RocketChat.settings.get('UI_Use_Real_Name') === true;

    const messages = _.map(records, message => {
      message.starred = _.findWhere(message.starred, {
        _id: fromUserId
      });

      if (message.u && message.u._id && UI_Use_Real_Name) {
        const user = RocketChat.models.Users.findOneById(message.u._id);
        message.u.name = user && user.name;
      }

      if (message.mentions && message.mentions.length && UI_Use_Real_Name) {
        message.mentions.forEach(mention => {
          const user = RocketChat.models.Users.findOneById(mention._id);
          mention.name = user && user.name;
        });
      }

      return message;
    });

    if (unreads) {
      let unreadNotLoaded = 0;
      let firstUnread = undefined;

      if (!_.isUndefined(oldest)) {
        const firstMsg = messages[messages.length - 1];

        if (!_.isUndefined(firstMsg) && firstMsg.ts > oldest) {
          const unreadMessages = RocketChat.models.Messages.findVisibleByRoomIdBetweenTimestamps(rid, oldest, firstMsg.ts, {
            limit: 1,
            sort: {
              ts: 1
            }
          });
          firstUnread = unreadMessages.fetch()[0];
          unreadNotLoaded = unreadMessages.count();
        }
      }

      return {
        messages: messages || [],
        firstUnread,
        unreadNotLoaded
      };
    }

    return {
      messages: messages || []
    };
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"getFullUserData.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/server/methods/getFullUserData.js                                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  getFullUserData({
    filter = '',
    limit
  }) {
    const result = RocketChat.getFullUserData({
      userId: Meteor.userId(),
      filter,
      limit
    });

    if (!result) {
      return result;
    }

    return result.fetch();
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"getRoomJoinCode.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/server/methods/getRoomJoinCode.js                                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  getRoomJoinCode(rid) {
    check(rid, String);

    if (!Meteor.userId()) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'getJoinCode'
      });
    }

    if (!RocketChat.authz.hasPermission(Meteor.userId(), 'view-join-code')) {
      throw new Meteor.Error('error-not-authorized', 'Not authorized', {
        method: 'getJoinCode'
      });
    }

    const [room] = RocketChat.models.Rooms.findById(rid).fetch();
    return room && room.joinCode;
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"getRoomRoles.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/server/methods/getRoomRoles.js                                                              //
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
  getRoomRoles(rid) {
    check(rid, String);

    if (!Meteor.userId() && RocketChat.settings.get('Accounts_AllowAnonymousRead') === false) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'getRoomRoles'
      });
    }

    check(rid, String);
    const options = {
      sort: {
        'u.username': 1
      },
      fields: {
        rid: 1,
        u: 1,
        roles: 1
      }
    };
    const UI_Use_Real_Name = RocketChat.settings.get('UI_Use_Real_Name') === true;
    const roles = RocketChat.models.Roles.find({
      scope: 'Subscriptions',
      description: {
        $exists: 1,
        $ne: ''
      }
    }).fetch();
    const subscriptions = RocketChat.models.Subscriptions.findByRoomIdAndRoles(rid, _.pluck(roles, '_id'), options).fetch();

    if (!UI_Use_Real_Name) {
      return subscriptions;
    } else {
      return subscriptions.map(subscription => {
        const user = RocketChat.models.Users.findOneById(subscription.u._id);
        subscription.u.name = user && user.name;
        return subscription;
      });
    }
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"getServerInfo.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/server/methods/getServerInfo.js                                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  getServerInfo() {
    return RocketChat.Info;
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"getSingleMessage.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/server/methods/getSingleMessage.js                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  getSingleMessage(msgId) {
    check(msgId, String);

    if (!Meteor.userId()) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'getSingleMessage'
      });
    }

    const msg = RocketChat.models.Messages.findOneById(msgId);

    if (!msg && !msg.rid) {
      return undefined;
    }

    Meteor.call('canAccessRoom', msg.rid, Meteor.userId());
    return msg;
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"getUserRoles.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/server/methods/getUserRoles.js                                                              //
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
  getUserRoles() {
    if (!Meteor.userId()) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'getUserRoles'
      });
    }

    const options = {
      sort: {
        'username': 1
      },
      fields: {
        username: 1,
        roles: 1
      }
    };
    const roles = RocketChat.models.Roles.find({
      scope: 'Users',
      description: {
        $exists: 1,
        $ne: ''
      }
    }).fetch();

    const roleIds = _.pluck(roles, '_id'); // Security issue: we should not send all user's roles to all clients, only the 'public' roles
    // We must remove all roles that are not part of the query from the returned users


    const users = RocketChat.models.Users.findUsersInRoles(roleIds, null, options).fetch();

    for (const user of users) {
      user.roles = _.intersection(user.roles, roleIds);
    }

    return users;
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"insertOrUpdateUser.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/server/methods/insertOrUpdateUser.js                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  insertOrUpdateUser(userData) {
    check(userData, Object);

    if (!Meteor.userId()) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'insertOrUpdateUser'
      });
    }

    return RocketChat.saveUser(Meteor.userId(), userData);
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"joinDefaultChannels.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/server/methods/joinDefaultChannels.js                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  joinDefaultChannels(silenced) {
    check(silenced, Match.Optional(Boolean));

    if (!Meteor.userId()) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'joinDefaultChannels'
      });
    }

    this.unblock();
    return RocketChat.addUserToDefaultChannels(Meteor.user(), silenced);
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"joinRoom.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/server/methods/joinRoom.js                                                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  joinRoom(rid, code) {
    check(rid, String);

    if (!Meteor.userId()) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'joinRoom'
      });
    }

    const room = RocketChat.models.Rooms.findOneById(rid);

    if (!room) {
      throw new Meteor.Error('error-invalid-room', 'Invalid room', {
        method: 'joinRoom'
      });
    } // TODO we should have a 'beforeJoinRoom' call back so external services can do their own validations


    const user = Meteor.user();

    if (room.tokenpass && user && user.services && user.services.tokenpass) {
      const balances = RocketChat.updateUserTokenpassBalances(user);

      if (!RocketChat.Tokenpass.validateAccess(room.tokenpass, balances)) {
        throw new Meteor.Error('error-not-allowed', 'Token required', {
          method: 'joinRoom'
        });
      }
    } else {
      if (room.t !== 'c' || RocketChat.authz.hasPermission(Meteor.userId(), 'view-c-room') !== true) {
        throw new Meteor.Error('error-not-allowed', 'Not allowed', {
          method: 'joinRoom'
        });
      }

      if (room.joinCodeRequired === true && code !== room.joinCode && !RocketChat.authz.hasPermission(Meteor.userId(), 'join-without-join-code')) {
        throw new Meteor.Error('error-code-invalid', 'Invalid Room Password', {
          method: 'joinRoom'
        });
      }
    }

    return RocketChat.addUserToRoom(rid, user);
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"leaveRoom.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/server/methods/leaveRoom.js                                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  leaveRoom(rid) {
    check(rid, String);

    if (!Meteor.userId()) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'leaveRoom'
      });
    }

    this.unblock();
    const room = RocketChat.models.Rooms.findOneById(rid);
    const user = Meteor.user();

    if (room.t === 'd' || room.t === 'c' && !RocketChat.authz.hasPermission(user._id, 'leave-c') || room.t === 'p' && !RocketChat.authz.hasPermission(user._id, 'leave-p')) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'leaveRoom'
      });
    }

    if (!Array.from(room.usernames || []).includes(user.username)) {
      throw new Meteor.Error('error-user-not-in-room', 'You are not in this room', {
        method: 'leaveRoom'
      });
    } // If user is room owner, check if there are other owners. If there isn't anyone else, warn user to set a new owner.


    if (RocketChat.authz.hasRole(user._id, 'owner', room._id)) {
      const numOwners = RocketChat.authz.getUsersInRole('owner', room._id).fetch().length;

      if (numOwners === 1) {
        throw new Meteor.Error('error-you-are-last-owner', 'You are the last owner. Please set new owner before leaving the room.', {
          method: 'leaveRoom'
        });
      }
    }

    return RocketChat.removeUserFromRoom(rid, Meteor.user());
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"removeOAuthService.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/server/methods/removeOAuthService.js                                                        //
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
  removeOAuthService(name) {
    check(name, String);

    if (!Meteor.userId()) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'removeOAuthService'
      });
    }

    if (RocketChat.authz.hasPermission(Meteor.userId(), 'add-oauth-service') !== true) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'removeOAuthService'
      });
    }

    name = name.toLowerCase().replace(/[^a-z0-9_]/g, '');
    name = s.capitalize(name);
    RocketChat.settings.removeById(`Accounts_OAuth_Custom-${name}`);
    RocketChat.settings.removeById(`Accounts_OAuth_Custom-${name}-url`);
    RocketChat.settings.removeById(`Accounts_OAuth_Custom-${name}-token_path`);
    RocketChat.settings.removeById(`Accounts_OAuth_Custom-${name}-identity_path`);
    RocketChat.settings.removeById(`Accounts_OAuth_Custom-${name}-authorize_path`);
    RocketChat.settings.removeById(`Accounts_OAuth_Custom-${name}-scope`);
    RocketChat.settings.removeById(`Accounts_OAuth_Custom-${name}-token_sent_via`);
    RocketChat.settings.removeById(`Accounts_OAuth_Custom-${name}-identity_token_sent_via`);
    RocketChat.settings.removeById(`Accounts_OAuth_Custom-${name}-id`);
    RocketChat.settings.removeById(`Accounts_OAuth_Custom-${name}-secret`);
    RocketChat.settings.removeById(`Accounts_OAuth_Custom-${name}-button_label_text`);
    RocketChat.settings.removeById(`Accounts_OAuth_Custom-${name}-button_label_color`);
    RocketChat.settings.removeById(`Accounts_OAuth_Custom-${name}-button_color`);
    RocketChat.settings.removeById(`Accounts_OAuth_Custom-${name}-login_style`);
    RocketChat.settings.removeById(`Accounts_OAuth_Custom-${name}-username_field`);
    RocketChat.settings.removeById(`Accounts_OAuth_Custom-${name}-merge_users`);
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"restartServer.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/server/methods/restartServer.js                                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  restart_server() {
    if (!Meteor.userId()) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'restart_server'
      });
    }

    if (RocketChat.authz.hasRole(Meteor.userId(), 'admin') !== true) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'restart_server'
      });
    }

    Meteor.setTimeout(() => {
      Meteor.setTimeout(() => {
        console.warn('Call to process.exit() timed out, aborting.');
        process.abort();
      }, 1000);
      process.exit(1);
    }, 1000);
    return {
      message: 'The_server_will_restart_in_s_seconds',
      params: [2]
    };
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"robotMethods.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/server/methods/robotMethods.js                                                              //
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
  'robot.modelCall'(model, method, args) {
    check(model, String);
    check(method, String);

    if (!Meteor.userId()) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'robot.modelCall'
      });
    }

    if (!RocketChat.authz.hasRole(Meteor.userId(), 'robot')) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'robot.modelCall'
      });
    }

    const m = RocketChat.models[model];

    if (!m || !_.isFunction(m[method])) {
      throw new Meteor.Error('error-invalid-method', 'Invalid method', {
        method: 'robot.modelCall'
      });
    }

    const cursor = RocketChat.models[model][method].apply(RocketChat.models[model], args);
    return cursor && cursor.fetch ? cursor.fetch() : cursor;
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"saveSetting.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/server/methods/saveSetting.js                                                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/* eslint new-cap: 0 */
Meteor.methods({
  saveSetting(_id, value, editor) {
    if (Meteor.userId() === null) {
      throw new Meteor.Error('error-action-not-allowed', 'Editing settings is not allowed', {
        method: 'saveSetting'
      });
    }

    if (!RocketChat.authz.hasPermission(Meteor.userId(), 'edit-privileged-setting')) {
      throw new Meteor.Error('error-action-not-allowed', 'Editing settings is not allowed', {
        method: 'saveSetting'
      });
    } //Verify the _id passed in is a string.


    check(_id, String);
    const setting = RocketChat.models.Settings.db.findOneById(_id); //Verify the value is what it should be

    switch (setting.type) {
      case 'roomPick':
        check(value, Match.OneOf([Object], ''));
        break;

      case 'boolean':
        check(value, Boolean);
        break;

      case 'int':
        check(value, Number);
        break;

      default:
        check(value, String);
        break;
    }

    RocketChat.settings.updateById(_id, value, editor);
    return true;
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"sendInvitationEmail.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/server/methods/sendInvitationEmail.js                                                       //
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
  sendInvitationEmail(emails) {
    check(emails, [String]);

    if (!Meteor.userId()) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'sendInvitationEmail'
      });
    }

    if (!RocketChat.authz.hasRole(Meteor.userId(), 'admin')) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'sendInvitationEmail'
      });
    }

    const rfcMailPattern = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

    const validEmails = _.compact(_.map(emails, function (email) {
      if (rfcMailPattern.test(email)) {
        return email;
      }
    }));

    const header = RocketChat.placeholders.replace(RocketChat.settings.get('Email_Header') || '');
    const footer = RocketChat.placeholders.replace(RocketChat.settings.get('Email_Footer') || '');
    let html;
    let subject;
    const user = Meteor.user();
    const lng = user.language || RocketChat.settings.get('language') || 'en';

    if (RocketChat.settings.get('Invitation_Customized')) {
      subject = RocketChat.settings.get('Invitation_Subject');
      html = RocketChat.settings.get('Invitation_HTML');
    } else {
      subject = TAPi18n.__('Invitation_Subject_Default', {
        lng
      });
      html = TAPi18n.__('Invitation_HTML_Default', {
        lng
      });
    }

    subject = RocketChat.placeholders.replace(subject);
    validEmails.forEach(email => {
      this.unblock();
      html = RocketChat.placeholders.replace(html, {
        email
      });

      try {
        Email.send({
          to: email,
          from: RocketChat.settings.get('From_Email'),
          subject,
          html: header + html + footer
        });
      } catch ({
        message
      }) {
        throw new Meteor.Error('error-email-send-failed', `Error trying to send email: ${message}`, {
          method: 'sendInvitationEmail',
          message
        });
      }
    });
    return validEmails;
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"sendMessage.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/server/methods/sendMessage.js                                                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let moment;
module.watch(require("moment"), {
  default(v) {
    moment = v;
  }

}, 0);
Meteor.methods({
  sendMessage(message) {
    check(message, Object);

    if (!Meteor.userId()) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'sendMessage'
      });
    }

    if (!message.rid) {
      throw new Error('The \'rid\' property on the message object is missing.');
    }

    if (message.ts) {
      const tsDiff = Math.abs(moment(message.ts).diff());

      if (tsDiff > 60000) {
        throw new Meteor.Error('error-message-ts-out-of-sync', 'Message timestamp is out of sync', {
          method: 'sendMessage',
          message_ts: message.ts,
          server_ts: new Date().getTime()
        });
      } else if (tsDiff > 10000) {
        message.ts = new Date();
      }
    } else {
      message.ts = new Date();
    }

    if (message.msg && message.msg.length > RocketChat.settings.get('Message_MaxAllowedSize')) {
      throw new Meteor.Error('error-message-size-exceeded', 'Message size exceeds Message_MaxAllowedSize', {
        method: 'sendMessage'
      });
    }

    const user = RocketChat.models.Users.findOneById(Meteor.userId(), {
      fields: {
        username: 1,
        name: 1
      }
    });
    const room = Meteor.call('canAccessRoom', message.rid, user._id);

    if (!room) {
      return false;
    }

    const subscription = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(message.rid, Meteor.userId());

    if (subscription && (subscription.blocked || subscription.blocker)) {
      RocketChat.Notifications.notifyUser(Meteor.userId(), 'message', {
        _id: Random.id(),
        rid: room._id,
        ts: new Date(),
        msg: TAPi18n.__('room_is_blocked', {}, user.language)
      });
      return false;
    }

    if ((room.muted || []).includes(user.username)) {
      RocketChat.Notifications.notifyUser(Meteor.userId(), 'message', {
        _id: Random.id(),
        rid: room._id,
        ts: new Date(),
        msg: TAPi18n.__('You_have_been_muted', {}, user.language)
      });
      return false;
    }

    if (message.alias == null && RocketChat.settings.get('Message_SetNameToAliasEnabled')) {
      message.alias = user.name;
    }

    if (Meteor.settings['public'].sandstorm) {
      message.sandstormSessionId = this.connection.sandstormSessionId();
    }

    RocketChat.metrics.messagesSent.inc(); // TODO This line needs to be moved to it's proper place. See the comments on: https://github.com/RocketChat/Rocket.Chat/pull/5736

    return RocketChat.sendMessage(user, message, room);
  }

}); // Limit a user, who does not have the "bot" role, to sending 5 msgs/second

RocketChat.RateLimiter.limitMethod('sendMessage', 5, 1000, {
  userId(userId) {
    return !RocketChat.authz.hasPermission(userId, 'send-many-messages');
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"sendSMTPTestEmail.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/server/methods/sendSMTPTestEmail.js                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  sendSMTPTestEmail() {
    if (!Meteor.userId()) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'sendSMTPTestEmail'
      });
    }

    const user = Meteor.user();

    if (!user.emails && !user.emails[0] && user.emails[0].address) {
      throw new Meteor.Error('error-invalid-email', 'Invalid email', {
        method: 'sendSMTPTestEmail'
      });
    }

    this.unblock();
    const header = RocketChat.placeholders.replace(RocketChat.settings.get('Email_Header') || '');
    const footer = RocketChat.placeholders.replace(RocketChat.settings.get('Email_Footer') || '');
    console.log(`Sending test email to ${user.emails[0].address}`);

    try {
      Email.send({
        to: user.emails[0].address,
        from: RocketChat.settings.get('From_Email'),
        subject: 'SMTP Test Email',
        html: `${header}<p>You have successfully sent an email</p>${footer}`
      });
    } catch ({
      message
    }) {
      throw new Meteor.Error('error-email-send-failed', `Error trying to send email: ${message}`, {
        method: 'sendSMTPTestEmail',
        message
      });
    }

    return {
      message: 'Your_mail_was_sent_to_s',
      params: [user.emails[0].address]
    };
  }

});
DDPRateLimiter.addRule({
  type: 'method',
  name: 'sendSMTPTestEmail',

  userId() {
    return true;
  }

}, 1, 1000);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"setAdminStatus.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/server/methods/setAdminStatus.js                                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  setAdminStatus(userId, admin) {
    check(userId, String);
    check(admin, Match.Optional(Boolean));

    if (!Meteor.userId()) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'setAdminStatus'
      });
    }

    if (RocketChat.authz.hasPermission(Meteor.userId(), 'assign-admin-role') !== true) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'setAdminStatus'
      });
    }

    const user = Meteor.users.findOne({
      _id: userId
    }, {
      fields: {
        username: 1
      }
    });

    if (admin) {
      return Meteor.call('authorization:addUserToRole', 'admin', user.username);
    } else {
      return Meteor.call('authorization:removeUserFromRole', 'admin', user.username);
    }
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"setRealName.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/server/methods/setRealName.js                                                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  setRealName(name) {
    check(name, String);

    if (!Meteor.userId()) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'setRealName'
      });
    }

    if (!RocketChat.settings.get('Accounts_AllowRealNameChange')) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'setRealName'
      });
    }

    if (!RocketChat.setRealName(Meteor.userId(), name)) {
      throw new Meteor.Error('error-could-not-change-name', 'Could not change name', {
        method: 'setRealName'
      });
    }

    return name;
  }

});
RocketChat.RateLimiter.limitMethod('setRealName', 1, 1000, {
  userId: () => true
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"setUsername.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/server/methods/setUsername.js                                                               //
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
  setUsername(username, param = {}) {
    const {
      joinDefaultChannelsSilenced
    } = param;
    check(username, String);

    if (!Meteor.userId()) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'setUsername'
      });
    }

    const user = Meteor.user();

    if (user.username && !RocketChat.settings.get('Accounts_AllowUsernameChange')) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'setUsername'
      });
    }

    if (user.username === username || user.username && user.username.toLowerCase() === username.toLowerCase()) {
      return username;
    }

    let nameValidation;

    try {
      nameValidation = new RegExp(`^${RocketChat.settings.get('UTF8_Names_Validation')}$`);
    } catch (error) {
      nameValidation = new RegExp('^[0-9a-zA-Z-_.]+$');
    }

    if (!nameValidation.test(username)) {
      throw new Meteor.Error('username-invalid', `${_.escape(username)} is not a valid username, use only letters, numbers, dots, hyphens and underscores`);
    }

    if (!RocketChat.checkUsernameAvailability(username)) {
      throw new Meteor.Error('error-field-unavailable', `<strong>${_.escape(username)}</strong> is already in use :(`, {
        method: 'setUsername',
        field: username
      });
    }

    if (!RocketChat.setUsername(user._id, username)) {
      throw new Meteor.Error('error-could-not-change-username', 'Could not change username', {
        method: 'setUsername'
      });
    }

    if (!user.username) {
      Meteor.runAsUser(user._id, () => Meteor.call('joinDefaultChannels', joinDefaultChannelsSilenced));
      Meteor.defer(function () {
        return RocketChat.callbacks.run('afterCreateUser', RocketChat.models.Users.findOneById(user._id));
      });
    }

    return username;
  }

});
RocketChat.RateLimiter.limitMethod('setUsername', 1, 1000, {
  userId() {
    return true;
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"setEmail.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/server/methods/setEmail.js                                                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  setEmail(email) {
    check(email, String);

    if (!Meteor.userId()) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'setEmail'
      });
    }

    const user = Meteor.user();

    if (!RocketChat.settings.get('Accounts_AllowEmailChange')) {
      throw new Meteor.Error('error-action-not-allowed', 'Changing email is not allowed', {
        method: 'setEmail',
        action: 'Changing_email'
      });
    }

    if (user.emails && user.emails[0] && user.emails[0].address === email) {
      return email;
    }

    if (!RocketChat.setEmail(user._id, email)) {
      throw new Meteor.Error('error-could-not-change-email', 'Could not change email', {
        method: 'setEmail'
      });
    }

    return email;
  }

});
RocketChat.RateLimiter.limitMethod('setEmail', 1, 1000, {
  userId()
  /*userId*/
  {
    return true;
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"unarchiveRoom.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/server/methods/unarchiveRoom.js                                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  unarchiveRoom(rid) {
    check(rid, String);

    if (!Meteor.userId()) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'unarchiveRoom'
      });
    }

    const room = RocketChat.models.Rooms.findOneById(rid);

    if (!room) {
      throw new Meteor.Error('error-invalid-room', 'Invalid room', {
        method: 'unarchiveRoom'
      });
    }

    if (!RocketChat.authz.hasPermission(Meteor.userId(), 'unarchive-room', room._id)) {
      throw new Meteor.Error('error-not-authorized', 'Not authorized', {
        method: 'unarchiveRoom'
      });
    }

    return RocketChat.unarchiveRoom(rid);
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"unblockUser.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/server/methods/unblockUser.js                                                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  unblockUser({
    rid,
    blocked
  }) {
    check(rid, String);
    check(blocked, String);

    if (!Meteor.userId()) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'blockUser'
      });
    }

    const subscription = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(rid, Meteor.userId());
    const subscription2 = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(rid, blocked);

    if (!subscription || !subscription2) {
      throw new Meteor.Error('error-invalid-room', 'Invalid room', {
        method: 'blockUser'
      });
    }

    RocketChat.models.Subscriptions.unsetBlockedByRoomId(rid, blocked, Meteor.userId());
    return true;
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"updateMessage.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/server/methods/updateMessage.js                                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let moment;
module.watch(require("moment"), {
  default(v) {
    moment = v;
  }

}, 0);
Meteor.methods({
  updateMessage(message) {
    check(message, Match.ObjectIncluding({
      _id: String
    }));

    if (!Meteor.userId()) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'updateMessage'
      });
    }

    const originalMessage = RocketChat.models.Messages.findOneById(message._id);

    if (!originalMessage || !originalMessage._id) {
      return;
    }

    const hasPermission = RocketChat.authz.hasPermission(Meteor.userId(), 'edit-message', message.rid);
    const editAllowed = RocketChat.settings.get('Message_AllowEditing');
    const editOwn = originalMessage.u && originalMessage.u._id === Meteor.userId();

    if (!hasPermission && (!editAllowed || !editOwn)) {
      throw new Meteor.Error('error-action-not-allowed', 'Message editing not allowed', {
        method: 'updateMessage',
        action: 'Message_editing'
      });
    }

    const blockEditInMinutes = RocketChat.settings.get('Message_AllowEditing_BlockEditInMinutes');

    if (Match.test(blockEditInMinutes, Number) && blockEditInMinutes !== 0) {
      let currentTsDiff;
      let msgTs;

      if (Match.test(originalMessage.ts, Number)) {
        msgTs = moment(originalMessage.ts);
      }

      if (msgTs) {
        currentTsDiff = moment().diff(msgTs, 'minutes');
      }

      if (currentTsDiff > blockEditInMinutes) {
        throw new Meteor.Error('error-message-editing-blocked', 'Message editing is blocked', {
          method: 'updateMessage'
        });
      }
    } // It is possible to have an empty array as the attachments property, so ensure both things exist


    if (originalMessage.attachments && originalMessage.attachments.length > 0 && originalMessage.attachments[0].description !== undefined) {
      message.attachments = originalMessage.attachments;
      message.attachments[0].description = message.msg;
      message.msg = originalMessage.msg;
    }

    message.u = originalMessage.u;
    return RocketChat.updateMessage(message, Meteor.user());
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}},"startup":{"defaultRoomTypes.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/startup/defaultRoomTypes.js                                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let ConversationRoomType, DirectMessageRoomType, FavoriteRoomType, PrivateRoomType, PublicRoomType, UnreadRoomType;
module.watch(require("../lib/roomTypes"), {
  ConversationRoomType(v) {
    ConversationRoomType = v;
  },

  DirectMessageRoomType(v) {
    DirectMessageRoomType = v;
  },

  FavoriteRoomType(v) {
    FavoriteRoomType = v;
  },

  PrivateRoomType(v) {
    PrivateRoomType = v;
  },

  PublicRoomType(v) {
    PublicRoomType = v;
  },

  UnreadRoomType(v) {
    UnreadRoomType = v;
  }

}, 0);
RocketChat.roomTypes.add(new UnreadRoomType());
RocketChat.roomTypes.add(new FavoriteRoomType());
RocketChat.roomTypes.add(new ConversationRoomType());
RocketChat.roomTypes.add(new PublicRoomType());
RocketChat.roomTypes.add(new PrivateRoomType());
RocketChat.roomTypes.add(new DirectMessageRoomType());
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"rocketchat.info.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_lib/rocketchat.info.js                                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.Info = {
    "version": "0.64.0",
    "build": {
        "date": "2018-05-17T06:40:02.261Z",
        "nodeVersion": "v8.11.1",
        "arch": "x64",
        "platform": "linux",
        "osRelease": "4.13.0-41-generic",
        "totalMemory": 3584499712,
        "freeMemory": 355979264,
        "cpus": 2
    },
    "commit": {
        "hash": "2fae79ab107664cd66dbf1e1f67e36353fcf7d21",
        "date": "Sat Apr 28 01:41:40 2018 -0300",
        "author": "Rodrigo Nascimento",
        "subject": "Merge pull request #10613 from RocketChat/release-0.64.0",
        "tag": "0.64.0",
        "branch": "master"
    }
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json",
    ".info"
  ]
});
require("/node_modules/meteor/rocketchat:lib/lib/core.js");
require("/node_modules/meteor/rocketchat:lib/server/lib/debug.js");
require("/node_modules/meteor/rocketchat:lib/lib/RoomTypeConfig.js");
require("/node_modules/meteor/rocketchat:lib/lib/roomTypes/conversation.js");
require("/node_modules/meteor/rocketchat:lib/lib/roomTypes/direct.js");
require("/node_modules/meteor/rocketchat:lib/lib/roomTypes/favorite.js");
require("/node_modules/meteor/rocketchat:lib/lib/roomTypes/index.js");
require("/node_modules/meteor/rocketchat:lib/lib/roomTypes/private.js");
require("/node_modules/meteor/rocketchat:lib/lib/roomTypes/public.js");
require("/node_modules/meteor/rocketchat:lib/lib/roomTypes/unread.js");
require("/node_modules/meteor/rocketchat:lib/lib/getURL.js");
require("/node_modules/meteor/rocketchat:lib/lib/settings.js");
require("/node_modules/meteor/rocketchat:lib/lib/callbacks.js");
require("/node_modules/meteor/rocketchat:lib/lib/fileUploadRestrictions.js");
require("/node_modules/meteor/rocketchat:lib/lib/getAvatarColor.js");
require("/node_modules/meteor/rocketchat:lib/lib/getValidRoomName.js");
require("/node_modules/meteor/rocketchat:lib/lib/placeholders.js");
require("/node_modules/meteor/rocketchat:lib/lib/promises.js");
require("/node_modules/meteor/rocketchat:lib/lib/RoomTypesCommon.js");
require("/node_modules/meteor/rocketchat:lib/lib/slashCommand.js");
require("/node_modules/meteor/rocketchat:lib/lib/Message.js");
require("/node_modules/meteor/rocketchat:lib/lib/messageBox.js");
require("/node_modules/meteor/rocketchat:lib/lib/MessageTypes.js");
require("/node_modules/meteor/rocketchat:lib/lib/templateVarHandler.js");
require("/node_modules/meteor/rocketchat:lib/lib/getUserPreference.js");
require("/node_modules/meteor/rocketchat:lib/server/lib/bugsnag.js");
require("/node_modules/meteor/rocketchat:lib/server/lib/metrics.js");
require("/node_modules/meteor/rocketchat:lib/server/lib/RateLimiter.js");
require("/node_modules/meteor/rocketchat:lib/server/functions/isDocker.js");
require("/node_modules/meteor/rocketchat:lib/server/functions/addUserToDefaultChannels.js");
require("/node_modules/meteor/rocketchat:lib/server/functions/addUserToRoom.js");
require("/node_modules/meteor/rocketchat:lib/server/functions/archiveRoom.js");
require("/node_modules/meteor/rocketchat:lib/server/functions/checkUsernameAvailability.js");
require("/node_modules/meteor/rocketchat:lib/server/functions/checkEmailAvailability.js");
require("/node_modules/meteor/rocketchat:lib/server/functions/createRoom.js");
require("/node_modules/meteor/rocketchat:lib/server/functions/deleteMessage.js");
require("/node_modules/meteor/rocketchat:lib/server/functions/deleteUser.js");
require("/node_modules/meteor/rocketchat:lib/server/functions/getFullUserData.js");
require("/node_modules/meteor/rocketchat:lib/server/functions/getRoomByNameOrIdWithOptionToJoin.js");
require("/node_modules/meteor/rocketchat:lib/server/functions/loadMessageHistory.js");
require("/node_modules/meteor/rocketchat:lib/server/functions/removeUserFromRoom.js");
require("/node_modules/meteor/rocketchat:lib/server/functions/saveUser.js");
require("/node_modules/meteor/rocketchat:lib/server/functions/saveCustomFields.js");
require("/node_modules/meteor/rocketchat:lib/server/functions/saveCustomFieldsWithoutValidation.js");
require("/node_modules/meteor/rocketchat:lib/server/functions/sendMessage.js");
require("/node_modules/meteor/rocketchat:lib/server/functions/settings.js");
require("/node_modules/meteor/rocketchat:lib/server/functions/setUserAvatar.js");
require("/node_modules/meteor/rocketchat:lib/server/functions/setUsername.js");
require("/node_modules/meteor/rocketchat:lib/server/functions/setRealName.js");
require("/node_modules/meteor/rocketchat:lib/server/functions/setEmail.js");
require("/node_modules/meteor/rocketchat:lib/server/functions/unarchiveRoom.js");
require("/node_modules/meteor/rocketchat:lib/server/functions/updateMessage.js");
require("/node_modules/meteor/rocketchat:lib/server/functions/validateCustomFields.js");
require("/node_modules/meteor/rocketchat:lib/server/functions/Notifications.js");
require("/node_modules/meteor/rocketchat:lib/server/lib/configLogger.js");
require("/node_modules/meteor/rocketchat:lib/server/lib/PushNotification.js");
require("/node_modules/meteor/rocketchat:lib/server/lib/defaultBlockedDomainsList.js");
require("/node_modules/meteor/rocketchat:lib/server/lib/interceptDirectReplyEmails.js");
require("/node_modules/meteor/rocketchat:lib/server/lib/loginErrorMessageOverride.js");
require("/node_modules/meteor/rocketchat:lib/server/lib/notifyUsersOnMessage.js");
require("/node_modules/meteor/rocketchat:lib/server/lib/processDirectEmail.js");
require("/node_modules/meteor/rocketchat:lib/server/lib/roomTypes.js");
require("/node_modules/meteor/rocketchat:lib/server/lib/sendEmailOnMessage.js");
require("/node_modules/meteor/rocketchat:lib/server/lib/sendNotificationsOnMessage.js");
require("/node_modules/meteor/rocketchat:lib/server/lib/validateEmailDomain.js");
require("/node_modules/meteor/rocketchat:lib/server/models/_Base.js");
require("/node_modules/meteor/rocketchat:lib/server/models/Avatars.js");
require("/node_modules/meteor/rocketchat:lib/server/models/Messages.js");
require("/node_modules/meteor/rocketchat:lib/server/models/Reports.js");
require("/node_modules/meteor/rocketchat:lib/server/models/Rooms.js");
require("/node_modules/meteor/rocketchat:lib/server/models/Settings.js");
require("/node_modules/meteor/rocketchat:lib/server/models/Subscriptions.js");
require("/node_modules/meteor/rocketchat:lib/server/models/Uploads.js");
require("/node_modules/meteor/rocketchat:lib/server/models/Users.js");
require("/node_modules/meteor/rocketchat:lib/server/models/ExportOperations.js");
require("/node_modules/meteor/rocketchat:lib/server/models/UserDataFiles.js");
require("/node_modules/meteor/rocketchat:lib/server/oauth/oauth.js");
require("/node_modules/meteor/rocketchat:lib/server/oauth/facebook.js");
require("/node_modules/meteor/rocketchat:lib/server/oauth/twitter.js");
require("/node_modules/meteor/rocketchat:lib/server/oauth/google.js");
require("/node_modules/meteor/rocketchat:lib/server/oauth/proxy.js");
require("/node_modules/meteor/rocketchat:lib/server/startup/statsTracker.js");
require("/node_modules/meteor/rocketchat:lib/server/startup/cache/CacheLoad.js");
require("/node_modules/meteor/rocketchat:lib/server/publications/settings.js");
require("/node_modules/meteor/rocketchat:lib/server/methods/addOAuthService.js");
require("/node_modules/meteor/rocketchat:lib/server/methods/refreshOAuthService.js");
require("/node_modules/meteor/rocketchat:lib/server/methods/addUserToRoom.js");
require("/node_modules/meteor/rocketchat:lib/server/methods/addUsersToRoom.js");
require("/node_modules/meteor/rocketchat:lib/server/methods/archiveRoom.js");
require("/node_modules/meteor/rocketchat:lib/server/methods/blockUser.js");
require("/node_modules/meteor/rocketchat:lib/server/methods/checkRegistrationSecretURL.js");
require("/node_modules/meteor/rocketchat:lib/server/methods/checkUsernameAvailability.js");
require("/node_modules/meteor/rocketchat:lib/server/methods/cleanChannelHistory.js");
require("/node_modules/meteor/rocketchat:lib/server/methods/cleanRoomHistory.js");
require("/node_modules/meteor/rocketchat:lib/server/methods/createChannel.js");
require("/node_modules/meteor/rocketchat:lib/server/methods/createToken.js");
require("/node_modules/meteor/rocketchat:lib/server/methods/createPrivateGroup.js");
require("/node_modules/meteor/rocketchat:lib/server/methods/deleteMessage.js");
require("/node_modules/meteor/rocketchat:lib/server/methods/deleteUserOwnAccount.js");
require("/node_modules/meteor/rocketchat:lib/server/methods/filterBadWords.js");
require("/node_modules/meteor/rocketchat:lib/server/methods/filterATAllTag.js");
require("/node_modules/meteor/rocketchat:lib/server/methods/filterATHereTag.js");
require("/node_modules/meteor/rocketchat:lib/server/methods/getChannelHistory.js");
require("/node_modules/meteor/rocketchat:lib/server/methods/getFullUserData.js");
require("/node_modules/meteor/rocketchat:lib/server/methods/getRoomJoinCode.js");
require("/node_modules/meteor/rocketchat:lib/server/methods/getRoomRoles.js");
require("/node_modules/meteor/rocketchat:lib/server/methods/getServerInfo.js");
require("/node_modules/meteor/rocketchat:lib/server/methods/getSingleMessage.js");
require("/node_modules/meteor/rocketchat:lib/server/methods/getUserRoles.js");
require("/node_modules/meteor/rocketchat:lib/server/methods/insertOrUpdateUser.js");
require("/node_modules/meteor/rocketchat:lib/server/methods/joinDefaultChannels.js");
require("/node_modules/meteor/rocketchat:lib/server/methods/joinRoom.js");
require("/node_modules/meteor/rocketchat:lib/server/methods/leaveRoom.js");
require("/node_modules/meteor/rocketchat:lib/server/methods/removeOAuthService.js");
require("/node_modules/meteor/rocketchat:lib/server/methods/restartServer.js");
require("/node_modules/meteor/rocketchat:lib/server/methods/robotMethods.js");
require("/node_modules/meteor/rocketchat:lib/server/methods/saveSetting.js");
require("/node_modules/meteor/rocketchat:lib/server/methods/sendInvitationEmail.js");
require("/node_modules/meteor/rocketchat:lib/server/methods/sendMessage.js");
require("/node_modules/meteor/rocketchat:lib/server/methods/sendSMTPTestEmail.js");
require("/node_modules/meteor/rocketchat:lib/server/methods/setAdminStatus.js");
require("/node_modules/meteor/rocketchat:lib/server/methods/setRealName.js");
require("/node_modules/meteor/rocketchat:lib/server/methods/setUsername.js");
require("/node_modules/meteor/rocketchat:lib/server/methods/setEmail.js");
require("/node_modules/meteor/rocketchat:lib/server/methods/unarchiveRoom.js");
require("/node_modules/meteor/rocketchat:lib/server/methods/unblockUser.js");
require("/node_modules/meteor/rocketchat:lib/server/methods/updateMessage.js");
require("/node_modules/meteor/rocketchat:lib/server/startup/settingsOnLoadCdnPrefix.js");
require("/node_modules/meteor/rocketchat:lib/server/startup/settingsOnLoadDirectReply.js");
require("/node_modules/meteor/rocketchat:lib/server/startup/settingsOnLoadSMTP.js");
require("/node_modules/meteor/rocketchat:lib/server/startup/oAuthServicesUpdate.js");
require("/node_modules/meteor/rocketchat:lib/server/startup/settings.js");
require("/node_modules/meteor/rocketchat:lib/lib/startup/settingsOnLoadSiteUrl.js");
require("/node_modules/meteor/rocketchat:lib/startup/defaultRoomTypes.js");
require("/node_modules/meteor/rocketchat:lib/rocketchat.info.js");
var exports = require("/node_modules/meteor/rocketchat:lib/server/lib/index.js");

/* Exports */
Package._define("rocketchat:lib", exports, {
  RocketChat: RocketChat
});

})();

//# sourceURL=meteor://💻app/packages/rocketchat_lib.js