(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var RocketChat = Package['rocketchat:lib'].RocketChat;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var TAPi18next = Package['tap:i18n'].TAPi18next;
var TAPi18n = Package['tap:i18n'].TAPi18n;

/* Package-scope variables */
var Apps;

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:apps":{"lib":{"Apps.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_apps/lib/Apps.js                                                                               //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
// Please see both server and client's repsective "orchestrator" file for the contents
Apps = {};
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"server":{"storage":{"apps-logs-model.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_apps/server/storage/apps-logs-model.js                                                         //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  AppsLogsModel: () => AppsLogsModel
});

class AppsLogsModel extends RocketChat.models._Base {
  constructor() {
    super('apps_logs');
  }

}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"apps-model.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_apps/server/storage/apps-model.js                                                              //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  AppsModel: () => AppsModel
});

class AppsModel extends RocketChat.models._Base {
  constructor() {
    super('apps');
  }

}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"apps-persistence-model.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_apps/server/storage/apps-persistence-model.js                                                  //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  AppsPersistenceModel: () => AppsPersistenceModel
});

class AppsPersistenceModel extends RocketChat.models._Base {
  constructor() {
    super('apps_persistence');
  }

}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"storage.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_apps/server/storage/storage.js                                                                 //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  AppRealStorage: () => AppRealStorage
});
let AppStorage;
module.watch(require("@rocket.chat/apps-engine/server/storage"), {
  AppStorage(v) {
    AppStorage = v;
  }

}, 0);

class AppRealStorage extends AppStorage {
  constructor(data) {
    super('mongodb');
    this.db = data;
  }

  create(item) {
    return new Promise((resolve, reject) => {
      item.createdAt = new Date();
      item.updatedAt = new Date();
      let doc;

      try {
        doc = this.db.findOne({
          $or: [{
            id: item.id
          }, {
            'info.nameSlug': item.info.nameSlug
          }]
        });
      } catch (e) {
        return reject(e);
      }

      if (doc) {
        return reject(new Error('App already exists.'));
      }

      try {
        const id = this.db.insert(item);
        item._id = id;
        resolve(item);
      } catch (e) {
        reject(e);
      }
    });
  }

  retrieveOne(id) {
    return new Promise((resolve, reject) => {
      let doc;

      try {
        doc = this.db.findOne({
          $or: [{
            _id: id
          }, {
            id
          }]
        });
      } catch (e) {
        return reject(e);
      }

      if (doc) {
        resolve(doc);
      } else {
        reject(new Error(`No App found by the id: ${id}`));
      }
    });
  }

  retrieveAll() {
    return new Promise((resolve, reject) => {
      let docs;

      try {
        docs = this.db.find({}).fetch();
      } catch (e) {
        return reject(e);
      }

      const items = new Map();
      docs.forEach(i => items.set(i.id, i));
      resolve(items);
    });
  }

  update(item) {
    return new Promise((resolve, reject) => {
      try {
        this.db.update({
          id: item.id
        }, item);
      } catch (e) {
        return reject(e);
      }

      this.retrieveOne(item.id).then(updated => resolve(updated)).catch(err => reject(err));
    });
  }

  remove(id) {
    return new Promise((resolve, reject) => {
      try {
        this.db.remove({
          id
        });
      } catch (e) {
        return reject(e);
      }

      resolve({
        success: true
      });
    });
  }

}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_apps/server/storage/index.js                                                                   //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  AppsLogsModel: () => AppsLogsModel,
  AppsModel: () => AppsModel,
  AppsPersistenceModel: () => AppsPersistenceModel,
  AppRealLogsStorage: () => AppRealLogsStorage,
  AppRealStorage: () => AppRealStorage
});
let AppsLogsModel;
module.watch(require("./apps-logs-model"), {
  AppsLogsModel(v) {
    AppsLogsModel = v;
  }

}, 0);
let AppsModel;
module.watch(require("./apps-model"), {
  AppsModel(v) {
    AppsModel = v;
  }

}, 1);
let AppsPersistenceModel;
module.watch(require("./apps-persistence-model"), {
  AppsPersistenceModel(v) {
    AppsPersistenceModel = v;
  }

}, 2);
let AppRealLogsStorage;
module.watch(require("./logs-storage"), {
  AppRealLogsStorage(v) {
    AppRealLogsStorage = v;
  }

}, 3);
let AppRealStorage;
module.watch(require("./storage"), {
  AppRealStorage(v) {
    AppRealStorage = v;
  }

}, 4);
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"logs-storage.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_apps/server/storage/logs-storage.js                                                            //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  AppRealLogsStorage: () => AppRealLogsStorage
});
let AppConsole;
module.watch(require("@rocket.chat/apps-engine/server/logging"), {
  AppConsole(v) {
    AppConsole = v;
  }

}, 0);
let AppLogStorage;
module.watch(require("@rocket.chat/apps-engine/server/storage"), {
  AppLogStorage(v) {
    AppLogStorage = v;
  }

}, 1);

class AppRealLogsStorage extends AppLogStorage {
  constructor(model) {
    super('mongodb');
    this.db = model;
  }

  find() {
    return new Promise((resolve, reject) => {
      let docs;

      try {
        docs = this.db.find(...arguments).fetch();
      } catch (e) {
        return reject(e);
      }

      resolve(docs);
    });
  }

  storeEntries(appId, logger) {
    return new Promise((resolve, reject) => {
      const item = AppConsole.toStorageEntry(appId, logger);

      try {
        const id = this.db.insert(item);
        resolve(this.db.findOneById(id));
      } catch (e) {
        reject(e);
      }
    });
  }

  getEntriesFor(appId) {
    return new Promise((resolve, reject) => {
      let docs;

      try {
        docs = this.db.find({
          appId
        }).fetch();
      } catch (e) {
        return reject(e);
      }

      resolve(docs);
    });
  }

}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"bridges":{"activation.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_apps/server/bridges/activation.js                                                              //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  AppActivationBridge: () => AppActivationBridge
});

class AppActivationBridge {
  constructor(orch) {
    this.orch = orch;
  }

  appAdded(app) {
    return Promise.asyncApply(() => {
      Promise.await(this.orch.getNotifier().appAdded(app.getID()));
    });
  }

  appUpdated(app) {
    return Promise.asyncApply(() => {
      Promise.await(this.orch.getNotifier().appUpdated(app.getID()));
    });
  }

  appRemoved(app) {
    return Promise.asyncApply(() => {
      Promise.await(this.orch.getNotifier().appRemoved(app.getID()));
    });
  }

  appStatusChanged(app, status) {
    return Promise.asyncApply(() => {
      Promise.await(this.orch.getNotifier().appStatusUpdated(app.getID(), status));
    });
  }

}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"bridges.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_apps/server/bridges/bridges.js                                                                 //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  RealAppBridges: () => RealAppBridges
});
let AppBridges;
module.watch(require("@rocket.chat/apps-engine/server/bridges"), {
  AppBridges(v) {
    AppBridges = v;
  }

}, 0);
let AppActivationBridge;
module.watch(require("./activation"), {
  AppActivationBridge(v) {
    AppActivationBridge = v;
  }

}, 1);
let AppDetailChangesBridge;
module.watch(require("./details"), {
  AppDetailChangesBridge(v) {
    AppDetailChangesBridge = v;
  }

}, 2);
let AppCommandsBridge;
module.watch(require("./commands"), {
  AppCommandsBridge(v) {
    AppCommandsBridge = v;
  }

}, 3);
let AppEnvironmentalVariableBridge;
module.watch(require("./environmental"), {
  AppEnvironmentalVariableBridge(v) {
    AppEnvironmentalVariableBridge = v;
  }

}, 4);
let AppHttpBridge;
module.watch(require("./http"), {
  AppHttpBridge(v) {
    AppHttpBridge = v;
  }

}, 5);
let AppListenerBridge;
module.watch(require("./listeners"), {
  AppListenerBridge(v) {
    AppListenerBridge = v;
  }

}, 6);
let AppMessageBridge;
module.watch(require("./messages"), {
  AppMessageBridge(v) {
    AppMessageBridge = v;
  }

}, 7);
let AppPersistenceBridge;
module.watch(require("./persistence"), {
  AppPersistenceBridge(v) {
    AppPersistenceBridge = v;
  }

}, 8);
let AppRoomBridge;
module.watch(require("./rooms"), {
  AppRoomBridge(v) {
    AppRoomBridge = v;
  }

}, 9);
let AppSettingBridge;
module.watch(require("./settings"), {
  AppSettingBridge(v) {
    AppSettingBridge = v;
  }

}, 10);
let AppUserBridge;
module.watch(require("./users"), {
  AppUserBridge(v) {
    AppUserBridge = v;
  }

}, 11);

class RealAppBridges extends AppBridges {
  constructor(orch) {
    super();
    this._actBridge = new AppActivationBridge(orch);
    this._cmdBridge = new AppCommandsBridge(orch);
    this._detBridge = new AppDetailChangesBridge(orch);
    this._envBridge = new AppEnvironmentalVariableBridge(orch);
    this._httpBridge = new AppHttpBridge();
    this._lisnBridge = new AppListenerBridge(orch);
    this._msgBridge = new AppMessageBridge(orch);
    this._persistBridge = new AppPersistenceBridge(orch);
    this._roomBridge = new AppRoomBridge(orch);
    this._setsBridge = new AppSettingBridge(orch);
    this._userBridge = new AppUserBridge(orch);
  }

  getCommandBridge() {
    return this._cmdBridge;
  }

  getEnvironmentalVariableBridge() {
    return this._envBridge;
  }

  getHttpBridge() {
    return this._httpBridge;
  }

  getListenerBridge() {
    return this._lisnBridge;
  }

  getMessageBridge() {
    return this._msgBridge;
  }

  getPersistenceBridge() {
    return this._persistBridge;
  }

  getAppActivationBridge() {
    return this._actBridge;
  }

  getAppDetailChangesBridge() {
    return this._detBridge;
  }

  getRoomBridge() {
    return this._roomBridge;
  }

  getServerSettingBridge() {
    return this._setsBridge;
  }

  getUserBridge() {
    return this._userBridge;
  }

}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"commands.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_apps/server/bridges/commands.js                                                                //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  AppCommandsBridge: () => AppCommandsBridge
});
let SlashCommandContext;
module.watch(require("@rocket.chat/apps-ts-definition/slashcommands"), {
  SlashCommandContext(v) {
    SlashCommandContext = v;
  }

}, 0);

class AppCommandsBridge {
  constructor(orch) {
    this.orch = orch;
    this.disabledCommands = new Map();
  }

  doesCommandExist(command, appId) {
    console.log(`The App ${appId} is checking if "${command}" command exists.`);

    if (typeof command !== 'string' || command.length === 0) {
      return false;
    }

    const cmd = command.toLowerCase();
    return typeof RocketChat.slashCommands.commands[cmd] === 'object' || this.disabledCommands.has(cmd);
  }

  enableCommand(command, appId) {
    console.log(`The App ${appId} is attempting to enable the command: "${command}"`);

    if (typeof command !== 'string' || command.trim().length === 0) {
      throw new Error('Invalid command parameter provided, must be a string.');
    }

    const cmd = command.toLowerCase();

    if (!this.disabledCommands.has(cmd)) {
      throw new Error(`The command is not currently disabled: "${cmd}"`);
    }

    RocketChat.slashCommands.commands[cmd] = this.disabledCommands.get(cmd);
    this.disabledCommands.delete(cmd);
    this.orch.getNotifier().commandUpdated(cmd);
  }

  disableCommand(command, appId) {
    console.log(`The App ${appId} is attempting to disable the command: "${command}"`);

    if (typeof command !== 'string' || command.trim().length === 0) {
      throw new Error('Invalid command parameter provided, must be a string.');
    }

    const cmd = command.toLowerCase();

    if (this.disabledCommands.has(cmd)) {
      // The command is already disabled, no need to disable it yet again
      return;
    }

    if (typeof RocketChat.slashCommands.commands[cmd] === 'undefined') {
      throw new Error(`Command does not exist in the system currently: "${cmd}"`);
    }

    this.disabledCommands.set(cmd, RocketChat.slashCommands.commands[cmd]);
    delete RocketChat.slashCommands.commands[cmd];
    this.orch.getNotifier().commandDisabled(cmd);
  } // command: { command, paramsExample, i18nDescription, executor: function }


  modifyCommand(command, appId) {
    console.log(`The App ${appId} is attempting to modify the command: "${command}"`);

    this._verifyCommand(command);

    const cmd = command.toLowerCase();

    if (typeof RocketChat.slashCommands.commands[cmd] === 'undefined') {
      throw new Error(`Command does not exist in the system currently (or it is disabled): "${cmd}"`);
    }

    const item = RocketChat.slashCommands.commands[cmd];
    item.params = command.paramsExample ? command.paramsExample : item.params;
    item.description = command.i18nDescription ? command.i18nDescription : item.params;
    item.callback = this._appCommandExecutor.bind(this);
    RocketChat.slashCommands.commands[cmd] = item;
    this.orch.getNotifier().commandUpdated(cmd);
  }

  registerCommand(command, appId) {
    console.log(`The App ${appId} is registering the command: "${command.command}"`);

    this._verifyCommand(command);

    const item = {
      command: command.command.toLowerCase(),
      params: command.paramsExample,
      description: command.i18nDescription,
      callback: this._appCommandExecutor.bind(this)
    };
    RocketChat.slashCommands.commands[command.command.toLowerCase()] = item;
    this.orch.getNotifier().commandAdded(command.command.toLowerCase());
  }

  unregisterCommand(command, appId) {
    console.log(`The App ${appId} is unregistering the command: "${command}"`);

    if (typeof command !== 'string' || command.trim().length === 0) {
      throw new Error('Invalid command parameter provided, must be a string.');
    }

    const cmd = command.toLowerCase();
    this.disabledCommands.delete(cmd);
    delete RocketChat.slashCommands.commands[cmd];
    this.orch.getNotifier().commandRemoved(cmd);
  }

  _verifyCommand(command) {
    if (typeof command !== 'object') {
      throw new Error('Invalid Slash Command parameter provided, it must be a valid ISlashCommand object.');
    }

    if (typeof command.command !== 'string') {
      throw new Error('Invalid Slash Command parameter provided, it must be a valid ISlashCommand object.');
    }

    if (command.paramsExample && typeof command.paramsExample !== 'string') {
      throw new Error('Invalid Slash Command parameter provided, it must be a valid ISlashCommand object.');
    }

    if (command.i18nDescription && typeof command.i18nDescription !== 'string') {
      throw new Error('Invalid Slash Command parameter provided, it must be a valid ISlashCommand object.');
    }

    if (typeof command.executor !== 'function') {
      throw new Error('Invalid Slash Command parameter provided, it must be a valid ISlashCommand object.');
    }
  }

  _appCommandExecutor(command, parameters, message) {
    const user = this.orch.getConverters().get('users').convertById(Meteor.userId());
    const room = this.orch.getConverters().get('rooms').convertById(message.rid);
    const params = parameters.length === 0 || parameters === ' ' ? [] : parameters.split(' ');
    const context = new SlashCommandContext(Object.freeze(user), Object.freeze(room), Object.freeze(params));
    this.orch.getManager().getCommandManager().executeCommand(command, context);
  }

}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"environmental.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_apps/server/bridges/environmental.js                                                           //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  AppEnvironmentalVariableBridge: () => AppEnvironmentalVariableBridge
});

class AppEnvironmentalVariableBridge {
  constructor(orch) {
    this.orch = orch;
    this.allowed = ['NODE_ENV', 'ROOT_URL', 'INSTANCE_IP'];
  }

  getValueByName(envVarName, appId) {
    return Promise.asyncApply(() => {
      console.log(`The App ${appId} is getting the environmental variable value ${envVarName}.`);

      if (this.isReadable(envVarName, appId)) {
        return process.env[envVarName];
      }

      throw new Error(`The environmental variable "${envVarName}" is not readable.`);
    });
  }

  isReadable(envVarName, appId) {
    return Promise.asyncApply(() => {
      console.log(`The App ${appId} is checking if the environmental variable is readable ${envVarName}.`);
      return this.allowed.includes(envVarName.toUpperCase());
    });
  }

  isSet(envVarName, appId) {
    return Promise.asyncApply(() => {
      console.log(`The App ${appId} is checking if the environmental variable is set ${envVarName}.`);

      if (this.isReadable(envVarName, appId)) {
        return typeof process.env[envVarName] !== 'undefined';
      }

      throw new Error(`The environmental variable "${envVarName}" is not readable.`);
    });
  }

}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"messages.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_apps/server/bridges/messages.js                                                                //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  AppMessageBridge: () => AppMessageBridge
});

class AppMessageBridge {
  constructor(orch) {
    this.orch = orch;
  }

  create(message, appId) {
    return Promise.asyncApply(() => {
      console.log(`The App ${appId} is creating a new message.`);
      let msg = this.orch.getConverters().get('messages').convertAppMessage(message);
      Meteor.runAsUser(msg.u._id, () => {
        msg = Meteor.call('sendMessage', msg);
      });
      return msg._id;
    });
  }

  getById(messageId, appId) {
    return Promise.asyncApply(() => {
      console.log(`The App ${appId} is getting the message: "${messageId}"`);
      return this.orch.getConverters().get('messages').convertById(messageId);
    });
  }

  update(message, appId) {
    return Promise.asyncApply(() => {
      console.log(`The App ${appId} is updating a message.`);

      if (!message.editor) {
        throw new Error('Invalid editor assigned to the message for the update.');
      }

      if (!message.id || !RocketChat.models.Messages.findOneById(message.id)) {
        throw new Error('A message must exist to update.');
      }

      const msg = this.orch.getConverters().get('messages').convertAppMessage(message);
      const editor = RocketChat.models.Users.findOneById(message.editor.id);
      RocketChat.updateMessage(msg, editor);
    });
  }

  notifyUser(user, message, appId) {
    return Promise.asyncApply(() => {
      console.log(`The App ${appId} is notifying a user.`);
      const msg = this.orch.getConverters().get('messages').convertAppMessage(message);
      RocketChat.Notifications.notifyUser(user.id, 'message', Object.assign(msg, {
        _id: Random.id(),
        ts: new Date(),
        u: undefined,
        editor: undefined
      }));
    });
  }

  notifyRoom(room, message, appId) {
    return Promise.asyncApply(() => {
      console.log(`The App ${appId} is notifying a room's users.`);

      if (room && room.usernames && Array.isArray(room.usernames)) {
        const msg = this.orch.getConverters().get('messages').convertAppMessage(message);
        const rmsg = Object.assign(msg, {
          _id: Random.id(),
          rid: room.id,
          ts: new Date(),
          u: undefined,
          editor: undefined
        });
        room.usernames.forEach(u => {
          const user = RocketChat.models.Users.findOneByUsername(u);

          if (user) {
            RocketChat.Notifications.notifyUser(user._id, 'message', rmsg);
          }
        });
      }
    });
  }

}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"persistence.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_apps/server/bridges/persistence.js                                                             //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  AppPersistenceBridge: () => AppPersistenceBridge
});

class AppPersistenceBridge {
  constructor(orch) {
    this.orch = orch;
  }

  purge(appId) {
    return Promise.asyncApply(() => {
      console.log(`The App's persistent storage is being purged: ${appId}`);
      this.orch.getPersistenceModel().remove({
        appId
      });
    });
  }

  create(data, appId) {
    return Promise.asyncApply(() => {
      console.log(`The App ${appId} is storing a new object in their persistence.`, data);

      if (typeof data !== 'object') {
        throw new Error('Attempted to store an invalid data type, it must be an object.');
      }

      return this.orch.getPersistenceModel().insert({
        appId,
        data
      });
    });
  }

  createWithAssociations(data, associations, appId) {
    return Promise.asyncApply(() => {
      console.log(`The App ${appId} is storing a new object in their persistence that is associated with some models.`, data, associations);

      if (typeof data !== 'object') {
        throw new Error('Attempted to store an invalid data type, it must be an object.');
      }

      return this.orch.getPersistenceModel().insert({
        appId,
        associations,
        data
      });
    });
  }

  readById(id, appId) {
    return Promise.asyncApply(() => {
      console.log(`The App ${appId} is reading their data in their persistence with the id: "${id}"`);
      const record = this.orch.getPersistenceModel().findOneById(id);
      return record.data;
    });
  }

  readByAssociations(associations, appId) {
    return Promise.asyncApply(() => {
      console.log(`The App ${appId} is searching for records that are associated with the following:`, associations);
      const records = this.orch.getPersistenceModel().find({
        appId,
        associations: {
          $all: associations
        }
      }).fetch();
      return Array.isArray(records) ? records.map(r => r.data) : [];
    });
  }

  remove(id, appId) {
    return Promise.asyncApply(() => {
      console.log(`The App ${appId} is removing one of their records by the id: "${id}"`);
      const record = this.orch.getPersistenceModel().findOne({
        _id: id,
        appId
      });

      if (!record) {
        return undefined;
      }

      this.orch.getPersistenceModel().remove({
        _id: id,
        appId
      });
      return record.data;
    });
  }

  removeByAssociations(associations, appId) {
    return Promise.asyncApply(() => {
      console.log(`The App ${appId} is removing records with the following associations:`, associations);
      const query = {
        appId,
        associations: {
          $all: associations
        }
      };
      const records = this.orch.getPersistenceModel().find(query).fetch();

      if (!records) {
        return undefined;
      }

      this.orch.getPersistenceModel().remove(query);
      return Array.isArray(records) ? records.map(r => r.data) : [];
    });
  }

  update(id, data, upsert, appId) {
    return Promise.asyncApply(() => {
      console.log(`The App ${appId} is updating the record "${id}" to:`, data);

      if (typeof data !== 'object') {
        throw new Error('Attempted to store an invalid data type, it must be an object.');
      }

      throw new Error('Not implemented.');
    });
  }

}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"rooms.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_apps/server/bridges/rooms.js                                                                   //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  AppRoomBridge: () => AppRoomBridge
});
let RoomType;
module.watch(require("@rocket.chat/apps-ts-definition/rooms"), {
  RoomType(v) {
    RoomType = v;
  }

}, 0);

class AppRoomBridge {
  constructor(orch) {
    this.orch = orch;
  }

  create(room, appId) {
    return Promise.asyncApply(() => {
      console.log(`The App ${appId} is creating a new room.`, room);
      const rcRoom = this.orch.getConverters().get('rooms').convertAppRoom(room);
      let method;

      switch (room.type) {
        case RoomType.CHANNEL:
          method = 'createChannel';
          break;

        case RoomType.PRIVATE_GROUP:
          method = 'createPrivateGroup';
          break;

        default:
          throw new Error('Only channels and private groups can be created.');
      }

      let rid;
      Meteor.runAsUser(room.creator.id, () => {
        const info = Meteor.call(method, rcRoom.usernames);
        rid = info.rid;
      });
      return rid;
    });
  }

  getById(roomId, appId) {
    return Promise.asyncApply(() => {
      console.log(`The App ${appId} is getting the roomById: "${roomId}"`);
      return this.orch.getConverters().get('rooms').convertById(roomId);
    });
  }

  getByName(roomName, appId) {
    return Promise.asyncApply(() => {
      console.log(`The App ${appId} is getting the roomByName: "${roomName}"`);
      return this.orch.getConverters().get('rooms').convertByName(roomName);
    });
  }

  update(room, appId) {
    return Promise.asyncApply(() => {
      console.log(`The App ${appId} is updating a room.`);

      if (!room.id || RocketChat.models.Rooms.findOneById(room.id)) {
        throw new Error('A room must exist to update.');
      }

      const rm = this.orch.getConverters().get('rooms').convertAppRoom(room);
      RocketChat.models.Rooms.update(rm._id, rm);
    });
  }

}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"settings.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_apps/server/bridges/settings.js                                                                //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  AppSettingBridge: () => AppSettingBridge
});

class AppSettingBridge {
  constructor(orch) {
    this.orch = orch;
    this.allowedGroups = [];
    this.disallowedSettings = ['Accounts_RegistrationForm_SecretURL', 'CROWD_APP_USERNAME', 'CROWD_APP_PASSWORD', 'Direct_Reply_Username', 'Direct_Reply_Password', 'SMTP_Username', 'SMTP_Password', 'FileUpload_S3_AWSAccessKeyId', 'FileUpload_S3_AWSSecretAccessKey', 'FileUpload_S3_BucketURL', 'FileUpload_GoogleStorage_Bucket', 'FileUpload_GoogleStorage_AccessId', 'FileUpload_GoogleStorage_Secret', 'GoogleVision_ServiceAccount', 'Allow_Invalid_SelfSigned_Certs', 'GoogleTagManager_id', 'Bugsnag_api_key', 'LDAP_CA_Cert', 'LDAP_Reject_Unauthorized', 'LDAP_Domain_Search_User', 'LDAP_Domain_Search_Password', 'Livechat_secret_token', 'Livechat_Knowledge_Apiai_Key', 'AutoTranslate_GoogleAPIKey', 'MapView_GMapsAPIKey', 'Meta_fb_app_id', 'Meta_google-site-verification', 'Meta_msvalidate01', 'Accounts_OAuth_Dolphin_secret', 'Accounts_OAuth_Drupal_secret', 'Accounts_OAuth_Facebook_secret', 'Accounts_OAuth_Github_secret', 'API_GitHub_Enterprise_URL', 'Accounts_OAuth_GitHub_Enterprise_secret', 'API_Gitlab_URL', 'Accounts_OAuth_Gitlab_secret', 'Accounts_OAuth_Google_secret', 'Accounts_OAuth_Linkedin_secret', 'Accounts_OAuth_Meteor_secret', 'Accounts_OAuth_Twitter_secret', 'API_Wordpress_URL', 'Accounts_OAuth_Wordpress_secret', 'Push_apn_passphrase', 'Push_apn_key', 'Push_apn_cert', 'Push_apn_dev_passphrase', 'Push_apn_dev_key', 'Push_apn_dev_cert', 'Push_gcm_api_key', 'Push_gcm_project_number', 'SAML_Custom_Default_cert', 'SAML_Custom_Default_private_key', 'SlackBridge_APIToken', 'Smarsh_Email', 'SMS_Twilio_Account_SID', 'SMS_Twilio_authToken'];
  }

  getAll(appId) {
    return Promise.asyncApply(() => {
      console.log(`The App ${appId} is getting all the settings.`);
      return RocketChat.models.Settings.find({
        _id: {
          $nin: this.disallowedSettings
        }
      }).fetch().map(s => {
        this.orch.getConverters().get('settings').convertToApp(s);
      });
    });
  }

  getOneById(id, appId) {
    return Promise.asyncApply(() => {
      console.log(`The App ${appId} is getting the setting by id ${id}.`);

      if (!this.isReadableById(id, appId)) {
        throw new Error(`The setting "${id}" is not readable.`);
      }

      return this.orch.getConverters().get('settings').convertById(id);
    });
  }

  hideGroup(name, appId) {
    return Promise.asyncApply(() => {
      console.log(`The App ${appId} is hidding the group ${name}.`);
      throw new Error('Method not implemented.');
    });
  }

  hideSetting(id, appId) {
    return Promise.asyncApply(() => {
      console.log(`The App ${appId} is hidding the setting ${id}.`);

      if (!this.isReadableById(id, appId)) {
        throw new Error(`The setting "${id}" is not readable.`);
      }

      throw new Error('Method not implemented.');
    });
  }

  isReadableById(id, appId) {
    return Promise.asyncApply(() => {
      console.log(`The App ${appId} is checking if they can read the setting ${id}.`);
      return !this.disallowedSettings.includes(id);
    });
  }

  updateOne(setting, appId) {
    return Promise.asyncApply(() => {
      console.log(`The App ${appId} is updating the setting ${setting.id} .`);

      if (!this.isReadableById(setting.id, appId)) {
        throw new Error(`The setting "${setting.id}" is not readable.`);
      }

      throw new Error('Method not implemented.');
    });
  }

}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"users.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_apps/server/bridges/users.js                                                                   //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  AppUserBridge: () => AppUserBridge
});

class AppUserBridge {
  constructor(orch) {
    this.orch = orch;
  }

  getById(userId, appId) {
    return Promise.asyncApply(() => {
      console.log(`The App ${appId} is getting the userId: "${userId}"`);
      return this.orch.getConverters().get('users').convertById(userId);
    });
  }

  getByUsername(username, appId) {
    return Promise.asyncApply(() => {
      console.log(`The App ${appId} is getting the username: "${username}"`);
      return this.orch.getConverters().get('users').convertByUsername(username);
    });
  }

}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_apps/server/bridges/index.js                                                                   //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  RealAppBridges: () => RealAppBridges,
  AppActivationBridge: () => AppActivationBridge,
  AppCommandsBridge: () => AppCommandsBridge,
  AppEnvironmentalVariableBridge: () => AppEnvironmentalVariableBridge,
  AppHttpBridge: () => AppHttpBridge,
  AppListenerBridge: () => AppListenerBridge,
  AppMessageBridge: () => AppMessageBridge,
  AppPersistenceBridge: () => AppPersistenceBridge,
  AppRoomBridge: () => AppRoomBridge,
  AppSettingBridge: () => AppSettingBridge,
  AppUserBridge: () => AppUserBridge
});
let RealAppBridges;
module.watch(require("./bridges"), {
  RealAppBridges(v) {
    RealAppBridges = v;
  }

}, 0);
let AppActivationBridge;
module.watch(require("./activation"), {
  AppActivationBridge(v) {
    AppActivationBridge = v;
  }

}, 1);
let AppCommandsBridge;
module.watch(require("./commands"), {
  AppCommandsBridge(v) {
    AppCommandsBridge = v;
  }

}, 2);
let AppEnvironmentalVariableBridge;
module.watch(require("./environmental"), {
  AppEnvironmentalVariableBridge(v) {
    AppEnvironmentalVariableBridge = v;
  }

}, 3);
let AppHttpBridge;
module.watch(require("./http"), {
  AppHttpBridge(v) {
    AppHttpBridge = v;
  }

}, 4);
let AppListenerBridge;
module.watch(require("./listeners"), {
  AppListenerBridge(v) {
    AppListenerBridge = v;
  }

}, 5);
let AppMessageBridge;
module.watch(require("./messages"), {
  AppMessageBridge(v) {
    AppMessageBridge = v;
  }

}, 6);
let AppPersistenceBridge;
module.watch(require("./persistence"), {
  AppPersistenceBridge(v) {
    AppPersistenceBridge = v;
  }

}, 7);
let AppRoomBridge;
module.watch(require("./rooms"), {
  AppRoomBridge(v) {
    AppRoomBridge = v;
  }

}, 8);
let AppSettingBridge;
module.watch(require("./settings"), {
  AppSettingBridge(v) {
    AppSettingBridge = v;
  }

}, 9);
let AppUserBridge;
module.watch(require("./users"), {
  AppUserBridge(v) {
    AppUserBridge = v;
  }

}, 10);
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"details.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_apps/server/bridges/details.js                                                                 //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  AppDetailChangesBridge: () => AppDetailChangesBridge
});

class AppDetailChangesBridge {
  constructor(orch) {
    this.orch = orch;
  }

  onAppSettingsChange(appId, setting) {
    try {
      this.orch.getNotifier().appSettingsChange(appId, setting);
    } catch (e) {
      console.warn('failed to notify about the setting change.', appId);
    }
  }

}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"http.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_apps/server/bridges/http.js                                                                    //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  AppHttpBridge: () => AppHttpBridge
});

class AppHttpBridge {
  call(info) {
    if (!info.request.content && typeof info.request.data === 'object') {
      info.request.content = JSON.stringify(info.request.data);
    }

    console.log(`The App ${info.appId} is requesting from the outter webs:`, info);
    return new Promise((resolve, reject) => {
      HTTP.call(info.method, info.url, info.request, (e, result) => {
        return e ? reject(e.response) : resolve(result);
      });
    });
  }

}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"listeners.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_apps/server/bridges/listeners.js                                                               //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  AppListenerBridge: () => AppListenerBridge
});

class AppListenerBridge {
  constructor(orch) {
    this.orch = orch;
  }

  messageEvent(inte, message) {
    return Promise.asyncApply(() => {
      const msg = this.orch.getConverters().get('messages').convertMessage(message);
      const result = Promise.await(this.orch.getManager().getListenerManager().executeListener(inte, msg));

      if (typeof result === 'boolean') {
        return result;
      } else {
        return this.orch.getConverters().get('messages').convertAppMessage(result);
      } // try {
      // } catch (e) {
      // 	console.log(`${ e.name }: ${ e.message }`);
      // 	console.log(e.stack);
      // }

    });
  }

  roomEvent(inte, room) {
    return Promise.asyncApply(() => {
      const rm = this.orch.getConverters().get('rooms').convertRoom(room);
      const result = Promise.await(this.orch.getManager().getListenerManager().executeListener(inte, rm));

      if (typeof result === 'boolean') {
        return result;
      } else {
        return this.orch.getConverters().get('rooms').convertAppRoom(result);
      } // try {
      // } catch (e) {
      // 	console.log(`${ e.name }: ${ e.message }`);
      // 	console.log(e.stack);
      // }

    });
  }

}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"communication":{"methods.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_apps/server/communication/methods.js                                                           //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  AppMethods: () => AppMethods
});

class AppMethods {
  constructor(manager) {
    this._manager = manager;

    this._addMethods();
  }

  isEnabled() {
    return typeof this._manager !== 'undefined';
  }

  isLoaded() {
    return typeof this._manager !== 'undefined' && this.manager.areAppsLoaded();
  }

  _addMethods() {
    const instance = this;
    Meteor.methods({
      'apps/is-enabled'() {
        return instance.isEnabled();
      },

      'apps/is-loaded'() {
        return instance.isLoaded();
      }

    });
  }

}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"rest.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_apps/server/communication/rest.js                                                              //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  AppsRestApi: () => AppsRestApi
});

class AppsRestApi {
  constructor(orch, manager) {
    this._orch = orch;
    this._manager = manager;
    this.api = new RocketChat.API.ApiClass({
      version: 'apps',
      useDefaultAuth: true,
      prettyJson: false,
      enableCors: false,
      auth: RocketChat.API.getUserAuth()
    });
    this.addManagementRoutes();
  }

  _handleFile(request, fileField) {
    const Busboy = Npm.require('busboy');

    const busboy = new Busboy({
      headers: request.headers
    });
    return Meteor.wrapAsync(callback => {
      busboy.on('file', Meteor.bindEnvironment((fieldname, file) => {
        if (fieldname !== fileField) {
          return callback(new Meteor.Error('invalid-field', `Expected the field "${fileField}" but got "${fieldname}" instead.`));
        }

        const fileData = [];
        file.on('data', Meteor.bindEnvironment(data => {
          fileData.push(data);
        }));
        file.on('end', Meteor.bindEnvironment(() => callback(undefined, Buffer.concat(fileData))));
      }));
      request.pipe(busboy);
    })();
  }

  addManagementRoutes() {
    const orchestrator = this._orch;
    const manager = this._manager;
    const fileHandler = this._handleFile;
    this.api.addRoute('', {
      authRequired: true
    }, {
      get() {
        const apps = manager.get().map(prl => {
          const info = prl.getInfo();
          info.languages = prl.getStorageItem().languageContent;
          info.status = prl.getStatus();
          return info;
        });
        return RocketChat.API.v1.success({
          apps
        });
      },

      post() {
        let buff;

        if (this.bodyParams.url) {
          const result = HTTP.call('GET', this.bodyParams.url, {
            npmRequestOptions: {
              encoding: 'base64'
            }
          });

          if (result.statusCode !== 200 || !result.headers['content-type'] || result.headers['content-type'] !== 'application/zip') {
            return RocketChat.API.v1.failure({
              error: 'Invalid url. It doesn\'t exist or is not "application/zip".'
            });
          }

          buff = Buffer.from(result.content, 'base64');
        } else {
          buff = fileHandler(this.request, 'app');
        }

        if (!buff) {
          return RocketChat.API.v1.failure({
            error: 'Failed to get a file to install for the App. '
          });
        }

        const aff = Promise.await(manager.add(buff.toString('base64'), false));
        const info = aff.getAppInfo();
        info.status = aff.getApp().getStatus();
        return RocketChat.API.v1.success({
          app: info,
          implemented: aff.getImplementedInferfaces(),
          compilerErrors: aff.getCompilerErrors()
        });
      }

    });
    this.api.addRoute('languages', {
      authRequired: false
    }, {
      get() {
        const apps = manager.get().map(prl => {
          return {
            id: prl.getID(),
            languages: prl.getStorageItem().languageContent
          };
        });
        return RocketChat.API.v1.success({
          apps
        });
      }

    });
    this.api.addRoute(':id', {
      authRequired: true
    }, {
      get() {
        console.log('Getting:', this.urlParams.id);
        const prl = manager.getOneById(this.urlParams.id);

        if (prl) {
          const info = prl.getInfo();
          info.status = prl.getStatus();
          return RocketChat.API.v1.success({
            app: info
          });
        } else {
          return RocketChat.API.v1.notFound(`No App found by the id of: ${this.urlParams.id}`);
        }
      },

      post() {
        console.log('Updating:', this.urlParams.id); // TODO: Verify permissions

        let buff;

        if (this.bodyParams.url) {
          const result = HTTP.call('GET', this.bodyParams.url, {
            npmRequestOptions: {
              encoding: 'base64'
            }
          });

          if (result.statusCode !== 200 || !result.headers['content-type'] || result.headers['content-type'] !== 'application/zip') {
            return RocketChat.API.v1.failure({
              error: 'Invalid url. It doesn\'t exist or is not "application/zip".'
            });
          }

          buff = Buffer.from(result.content, 'base64');
        } else {
          buff = fileHandler(this.request, 'app');
        }

        if (!buff) {
          return RocketChat.API.v1.failure({
            error: 'Failed to get a file to install for the App. '
          });
        }

        const aff = Promise.await(manager.update(buff.toString('base64')));
        const info = aff.getAppInfo();
        info.status = aff.getApp().getStatus();
        return RocketChat.API.v1.success({
          app: info,
          implemented: aff.getImplementedInferfaces(),
          compilerErrors: aff.getCompilerErrors()
        });
      },

      delete() {
        console.log('Uninstalling:', this.urlParams.id);
        const prl = manager.getOneById(this.urlParams.id);

        if (prl) {
          Promise.await(manager.remove(prl.getID()));
          const info = prl.getInfo();
          info.status = prl.getStatus();
          return RocketChat.API.v1.success({
            app: info
          });
        } else {
          return RocketChat.API.v1.notFound(`No App found by the id of: ${this.urlParams.id}`);
        }
      }

    });
    this.api.addRoute(':id/icon', {
      authRequired: true
    }, {
      get() {
        console.log('Getting the App\'s Icon:', this.urlParams.id);
        const prl = manager.getOneById(this.urlParams.id);

        if (prl) {
          const info = prl.getInfo();
          return RocketChat.API.v1.success({
            iconFileContent: info.iconFileContent
          });
        } else {
          return RocketChat.API.v1.notFound(`No App found by the id of: ${this.urlParams.id}`);
        }
      }

    });
    this.api.addRoute(':id/languages', {
      authRequired: false
    }, {
      get() {
        console.log(`Getting ${this.urlParams.id}'s languages..`);
        const prl = manager.getOneById(this.urlParams.id);

        if (prl) {
          const languages = prl.getStorageItem().languageContent || {};
          return RocketChat.API.v1.success({
            languages
          });
        } else {
          return RocketChat.API.v1.notFound(`No App found by the id of: ${this.urlParams.id}`);
        }
      }

    });
    this.api.addRoute(':id/logs', {
      authRequired: true
    }, {
      get() {
        console.log(`Getting ${this.urlParams.id}'s logs..`);
        const prl = manager.getOneById(this.urlParams.id);

        if (prl) {
          const {
            offset,
            count
          } = this.getPaginationItems();
          const {
            sort,
            fields,
            query
          } = this.parseJsonQuery();
          const ourQuery = Object.assign({}, query, {
            appId: prl.getID()
          });
          const options = {
            sort: sort ? sort : {
              _updatedAt: -1
            },
            skip: offset,
            limit: count,
            fields
          };
          const logs = Promise.await(orchestrator.getLogStorage().find(ourQuery, options));
          return RocketChat.API.v1.success({
            logs
          });
        } else {
          return RocketChat.API.v1.notFound(`No App found by the id of: ${this.urlParams.id}`);
        }
      }

    });
    this.api.addRoute(':id/settings', {
      authRequired: true
    }, {
      get() {
        console.log(`Getting ${this.urlParams.id}'s settings..`);
        const prl = manager.getOneById(this.urlParams.id);

        if (prl) {
          const settings = Object.assign({}, prl.getStorageItem().settings);
          Object.keys(settings).forEach(k => {
            if (settings[k].hidden) {
              delete settings[k];
            }
          });
          return RocketChat.API.v1.success({
            settings
          });
        } else {
          return RocketChat.API.v1.notFound(`No App found by the id of: ${this.urlParams.id}`);
        }
      },

      post() {
        console.log(`Updating ${this.urlParams.id}'s settings..`);

        if (!this.bodyParams || !this.bodyParams.settings) {
          return RocketChat.API.v1.failure('The settings to update must be present.');
        }

        const prl = manager.getOneById(this.urlParams.id);

        if (!prl) {
          return RocketChat.API.v1.notFound(`No App found by the id of: ${this.urlParams.id}`);
        }

        const settings = prl.getStorageItem().settings;
        const updated = [];
        this.bodyParams.settings.forEach(s => {
          if (settings[s.id]) {
            Promise.await(manager.getSettingsManager().updateAppSetting(this.urlParams.id, s)); // Updating?

            updated.push(s);
          }
        });
        return RocketChat.API.v1.success({
          updated
        });
      }

    });
    this.api.addRoute(':id/settings/:settingId', {
      authRequired: true
    }, {
      get() {
        console.log(`Getting the App ${this.urlParams.id}'s setting ${this.urlParams.settingId}`);

        try {
          const setting = manager.getSettingsManager().getAppSetting(this.urlParams.id, this.urlParams.settingId);
          RocketChat.API.v1.success({
            setting
          });
        } catch (e) {
          if (e.message.includes('No setting found')) {
            return RocketChat.API.v1.notFound(`No Setting found on the App by the id of: "${this.urlParams.settingId}"`);
          } else if (e.message.includes('No App found')) {
            return RocketChat.API.v1.notFound(`No App found by the id of: ${this.urlParams.id}`);
          } else {
            return RocketChat.API.v1.failure(e.message);
          }
        }
      },

      post() {
        console.log(`Updating the App ${this.urlParams.id}'s setting ${this.urlParams.settingId}`);

        if (!this.bodyParams.setting) {
          return RocketChat.API.v1.failure('Setting to update to must be present on the posted body.');
        }

        try {
          Promise.await(manager.getSettingsManager().updateAppSetting(this.urlParams.id, this.bodyParams.setting));
          return RocketChat.API.v1.success();
        } catch (e) {
          if (e.message.includes('No setting found')) {
            return RocketChat.API.v1.notFound(`No Setting found on the App by the id of: "${this.urlParams.settingId}"`);
          } else if (e.message.includes('No App found')) {
            return RocketChat.API.v1.notFound(`No App found by the id of: ${this.urlParams.id}`);
          } else {
            return RocketChat.API.v1.failure(e.message);
          }
        }
      }

    });
    this.api.addRoute(':id/status', {
      authRequired: true
    }, {
      get() {
        console.log(`Getting ${this.urlParams.id}'s status..`);
        const prl = manager.getOneById(this.urlParams.id);

        if (prl) {
          return RocketChat.API.v1.success({
            status: prl.getStatus()
          });
        } else {
          return RocketChat.API.v1.notFound(`No App found by the id of: ${this.urlParams.id}`);
        }
      },

      post() {
        if (!this.bodyParams.status || typeof this.bodyParams.status !== 'string') {
          return RocketChat.API.v1.failure('Invalid status provided, it must be "status" field and a string.');
        }

        console.log(`Updating ${this.urlParams.id}'s status...`, this.bodyParams.status);
        const prl = manager.getOneById(this.urlParams.id);

        if (prl) {
          const result = Promise.await(manager.changeStatus(prl.getID(), this.bodyParams.status));
          return RocketChat.API.v1.success({
            status: result.getStatus()
          });
        } else {
          return RocketChat.API.v1.notFound(`No App found by the id of: ${this.urlParams.id}`);
        }
      }

    });
  }

}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"websockets.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_apps/server/communication/websockets.js                                                        //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  AppEvents: () => AppEvents,
  AppServerListener: () => AppServerListener,
  AppServerNotifier: () => AppServerNotifier
});
let AppStatus, AppStatusUtils;
module.watch(require("@rocket.chat/apps-ts-definition/AppStatus"), {
  AppStatus(v) {
    AppStatus = v;
  },

  AppStatusUtils(v) {
    AppStatusUtils = v;
  }

}, 0);
const AppEvents = Object.freeze({
  APP_ADDED: 'app/added',
  APP_REMOVED: 'app/removed',
  APP_UPDATED: 'app/updated',
  APP_STATUS_CHANGE: 'app/statusUpdate',
  APP_SETTING_UPDATED: 'app/settingUpdated',
  COMMAND_ADDED: 'command/added',
  COMMAND_DISABLED: 'command/disabled',
  COMMAND_UPDATED: 'command/updated',
  COMMAND_REMOVED: 'command/removed'
});

class AppServerListener {
  constructor(orch, engineStreamer, clientStreamer, recieved) {
    this.orch = orch;
    this.engineStreamer = engineStreamer;
    this.clientStreamer = clientStreamer;
    this.recieved = recieved;
    this.engineStreamer.on(AppEvents.APP_ADDED, this.onAppAdded.bind(this));
    this.engineStreamer.on(AppEvents.APP_STATUS_CHANGE, this.onAppStatusUpdated.bind(this));
    this.engineStreamer.on(AppEvents.APP_SETTING_UPDATED, this.onAppSettingUpdated.bind(this));
    this.engineStreamer.on(AppEvents.APP_REMOVED, this.onAppRemoved.bind(this));
    this.engineStreamer.on(AppEvents.COMMAND_ADDED, this.onCommandAdded.bind(this));
    this.engineStreamer.on(AppEvents.COMMAND_DISABLED, this.onCommandDisabled.bind(this));
    this.engineStreamer.on(AppEvents.COMMAND_UPDATED, this.onCommandUpdated.bind(this));
    this.engineStreamer.on(AppEvents.COMMAND_REMOVED, this.onCommandRemoved.bind(this));
  }

  onAppAdded(appId) {
    return Promise.asyncApply(() => {
      Promise.await(this.orch.getManager().loadOne(appId));
      this.clientStreamer.emit(AppEvents.APP_ADDED, appId);
    });
  }

  onAppStatusUpdated({
    appId,
    status
  }) {
    return Promise.asyncApply(() => {
      this.recieved.set(`${AppEvents.APP_STATUS_CHANGE}_${appId}`, {
        appId,
        status,
        when: new Date()
      });

      if (AppStatusUtils.isEnabled(status)) {
        Promise.await(this.orch.getManager().enable(appId));
        this.clientStreamer.emit(AppEvents.APP_STATUS_CHANGE, {
          appId,
          status
        });
      } else if (AppStatusUtils.isDisabled(status)) {
        Promise.await(this.orch.getManager().disable(appId, AppStatus.MANUALLY_DISABLED === status));
        this.clientStreamer.emit(AppEvents.APP_STATUS_CHANGE, {
          appId,
          status
        });
      }
    });
  }

  onAppSettingUpdated({
    appId,
    setting
  }) {
    return Promise.asyncApply(() => {
      this.recieved.set(`${AppEvents.APP_SETTING_UPDATED}_${appId}_${setting.id}`, {
        appId,
        setting,
        when: new Date()
      });
      Promise.await(this.orch.getManager().getSettingsManager().updateAppSetting(appId, setting));
      this.clientStreamer.emit(AppEvents.APP_SETTING_UPDATED, {
        appId
      });
    });
  }

  onAppRemoved(appId) {
    return Promise.asyncApply(() => {
      Promise.await(this.orch.getManager().remove(appId));
      this.clientStreamer.emit(AppEvents.APP_REMOVED, appId);
    });
  }

  onCommandAdded(command) {
    return Promise.asyncApply(() => {
      this.clientStreamer.emit(AppEvents.COMMAND_ADDED, command);
    });
  }

  onCommandDisabled(command) {
    return Promise.asyncApply(() => {
      this.clientStreamer.emit(AppEvents.COMMAND_DISABLED, command);
    });
  }

  onCommandUpdated(command) {
    return Promise.asyncApply(() => {
      this.clientStreamer.emit(AppEvents.COMMAND_UPDATED, command);
    });
  }

  onCommandRemoved(command) {
    return Promise.asyncApply(() => {
      this.clientStreamer.emit(AppEvents.COMMAND_REMOVED, command);
    });
  }

}

class AppServerNotifier {
  constructor(orch) {
    this.engineStreamer = new Meteor.Streamer('apps-engine', {
      retransmit: false
    });
    this.engineStreamer.serverOnly = true;
    this.engineStreamer.allowRead('none');
    this.engineStreamer.allowEmit('all');
    this.engineStreamer.allowWrite('none'); // This is used to broadcast to the web clients

    this.clientStreamer = new Meteor.Streamer('apps', {
      retransmit: false
    });
    this.clientStreamer.serverOnly = true;
    this.clientStreamer.allowRead('all');
    this.clientStreamer.allowEmit('all');
    this.clientStreamer.allowWrite('none');
    this.recieved = new Map();
    this.listener = new AppServerListener(orch, this.engineStreamer, this.clientStreamer, this.recieved);
  }

  appAdded(appId) {
    return Promise.asyncApply(() => {
      this.engineStreamer.emit(AppEvents.APP_ADDED, appId);
      this.clientStreamer.emit(AppEvents.APP_ADDED, appId);
    });
  }

  appRemoved(appId) {
    return Promise.asyncApply(() => {
      this.engineStreamer.emit(AppEvents.APP_REMOVED, appId);
      this.clientStreamer.emit(AppEvents.APP_REMOVED, appId);
    });
  }

  appUpdated(appId) {
    return Promise.asyncApply(() => {
      this.engineStreamer.emit(AppEvents.APP_UPDATED, appId);
      this.clientStreamer.emit(AppEvents.APP_UPDATED, appId);
    });
  }

  appStatusUpdated(appId, status) {
    return Promise.asyncApply(() => {
      if (this.recieved.has(`${AppEvents.APP_STATUS_CHANGE}_${appId}`)) {
        const details = this.recieved.get(`${AppEvents.APP_STATUS_CHANGE}_${appId}`);

        if (details.status === status) {
          this.recieved.delete(`${AppEvents.APP_STATUS_CHANGE}_${appId}`);
          return;
        }
      }

      this.engineStreamer.emit(AppEvents.APP_STATUS_CHANGE, {
        appId,
        status
      });
      this.clientStreamer.emit(AppEvents.APP_STATUS_CHANGE, {
        appId,
        status
      });
    });
  }

  appSettingsChange(appId, setting) {
    return Promise.asyncApply(() => {
      if (this.recieved.has(`${AppEvents.APP_SETTING_UPDATED}_${appId}_${setting.id}`)) {
        this.recieved.delete(`${AppEvents.APP_SETTING_UPDATED}_${appId}_${setting.id}`);
        return;
      }

      this.engineStreamer.emit(AppEvents.APP_SETTING_UPDATED, {
        appId,
        setting
      });
      this.clientStreamer.emit(AppEvents.APP_SETTING_UPDATED, {
        appId
      });
    });
  }

  commandAdded(command) {
    return Promise.asyncApply(() => {
      this.engineStreamer.emit(AppEvents.COMMAND_ADDED, command);
      this.clientStreamer.emit(AppEvents.COMMAND_ADDED, command);
    });
  }

  commandDisabled(command) {
    return Promise.asyncApply(() => {
      this.engineStreamer.emit(AppEvents.COMMAND_DISABLED, command);
      this.clientStreamer.emit(AppEvents.COMMAND_DISABLED, command);
    });
  }

  commandUpdated(command) {
    return Promise.asyncApply(() => {
      this.engineStreamer.emit(AppEvents.COMMAND_UPDATED, command);
      this.clientStreamer.emit(AppEvents.COMMAND_UPDATED, command);
    });
  }

  commandRemoved(command) {
    return Promise.asyncApply(() => {
      this.engineStreamer.emit(AppEvents.COMMAND_REMOVED, command);
      this.clientStreamer.emit(AppEvents.COMMAND_REMOVED, command);
    });
  }

}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_apps/server/communication/index.js                                                             //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  AppMethods: () => AppMethods,
  AppsRestApi: () => AppsRestApi,
  AppEvents: () => AppEvents,
  AppServerNotifier: () => AppServerNotifier,
  AppServerListener: () => AppServerListener
});
let AppMethods;
module.watch(require("./methods"), {
  AppMethods(v) {
    AppMethods = v;
  }

}, 0);
let AppsRestApi;
module.watch(require("./rest"), {
  AppsRestApi(v) {
    AppsRestApi = v;
  }

}, 1);
let AppEvents, AppServerNotifier, AppServerListener;
module.watch(require("./websockets"), {
  AppEvents(v) {
    AppEvents = v;
  },

  AppServerNotifier(v) {
    AppServerNotifier = v;
  },

  AppServerListener(v) {
    AppServerListener = v;
  }

}, 2);
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"converters":{"messages.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_apps/server/converters/messages.js                                                             //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  AppMessagesConverter: () => AppMessagesConverter
});

class AppMessagesConverter {
  constructor(orch) {
    this.orch = orch;
  }

  convertById(msgId) {
    const msg = RocketChat.models.Messages.getOneById(msgId);
    return this.convertMessage(msg);
  }

  convertMessage(msgObj) {
    if (!msgObj) {
      return undefined;
    }

    const room = this.orch.getConverters().get('rooms').convertById(msgObj.rid);
    let sender;

    if (msgObj.u && msgObj.u._id) {
      sender = this.orch.getConverters().get('users').convertById(msgObj.u._id);

      if (!sender) {
        sender = this.orch.getConverters().get('users').convertToApp(msgObj.u);
      }
    }

    let editor;

    if (msgObj.editedBy) {
      editor = this.orch.getConverters().get('users').convertById(msgObj.editedBy._id);
    }

    const attachments = this._convertAttachmentsToApp(msgObj.attachments);

    return {
      id: msgObj._id,
      room,
      sender,
      text: msgObj.msg,
      createdAt: msgObj.ts,
      updatedAt: msgObj._updatedAt,
      editor,
      editedAt: msgObj.editedAt,
      emoji: msgObj.emoji,
      avatarUrl: msgObj.avatar,
      alias: msgObj.alias,
      customFields: msgObj.customFields,
      attachments
    };
  }

  convertAppMessage(message) {
    if (!message) {
      return undefined;
    }

    const room = RocketChat.models.Rooms.findOneById(message.room.id);

    if (!room) {
      throw new Error('Invalid room provided on the message.');
    }

    let u;

    if (message.sender && message.sender.id) {
      const user = RocketChat.models.Users.findOneById(message.sender.id);

      if (user) {
        u = {
          _id: user._id,
          username: user.username,
          name: user.name
        };
      } else {
        u = {
          _id: message.sender.id,
          username: message.sender.username,
          name: message.sender.name
        };
      }
    }

    let editedBy;

    if (message.editor) {
      const editor = RocketChat.models.Users.findOneById(message.editor.id);
      editedBy = {
        _id: editor._id,
        username: editor.username
      };
    }

    const attachments = this._convertAppAttachments(message.attachments);

    return {
      _id: message.id || Random.id(),
      rid: room._id,
      u,
      msg: message.text,
      ts: message.createdAt || new Date(),
      _updatedAt: message.updatedAt || new Date(),
      editedBy,
      editedAt: message.editedAt,
      emoji: message.emoji,
      avatar: message.avatarUrl,
      alias: message.alias,
      customFields: message.customFields,
      attachments
    };
  }

  _convertAppAttachments(attachments) {
    if (typeof attachments === 'undefined' || !Array.isArray(attachments)) {
      return undefined;
    }

    return attachments.map(attachment => {
      return {
        collapsed: attachment.collapsed,
        color: attachment.color,
        text: attachment.text,
        ts: attachment.timestamp,
        message_link: attachment.timestampLink,
        thumb_url: attachment.thumbnailUrl,
        author_name: attachment.author ? attachment.author.name : undefined,
        author_link: attachment.author ? attachment.author.link : undefined,
        author_icon: attachment.author ? attachment.author.icon : undefined,
        title: attachment.title ? attachment.title.value : undefined,
        title_link: attachment.title ? attachment.title.link : undefined,
        title_link_download: attachment.title ? attachment.title.displayDownloadLink : undefined,
        image_url: attachment.imageUrl,
        audio_url: attachment.audioUrl,
        video_url: attachment.videoUrl,
        fields: attachment.fields
      };
    }).map(a => {
      Object.keys(a).forEach(k => {
        if (typeof a[k] === 'undefined') {
          delete a[k];
        }
      });
      return a;
    });
  }

  _convertAttachmentsToApp(attachments) {
    if (typeof attachments === 'undefined' || !Array.isArray(attachments)) {
      return undefined;
    }

    return attachments.map(attachment => {
      let author;

      if (attachment.author_name || attachment.author_link || attachment.author_icon) {
        author = {
          name: attachment.author_name,
          link: attachment.author_link,
          icon: attachment.author_icon
        };
      }

      let title;

      if (attachment.title || attachment.title_link || attachment.title_link_download) {
        title = {
          value: attachment.title,
          link: attachment.title_link,
          displayDownloadLink: attachment.title_link_download
        };
      }

      return {
        collapsed: attachment.collapsed,
        color: attachment.color,
        text: attachment.text,
        timestamp: attachment.ts,
        timestampLink: attachment.message_link,
        thumbnailUrl: attachment.thumb_url,
        author,
        title,
        imageUrl: attachment.image_url,
        audioUrl: attachment.audio_url,
        videoUrl: attachment.video_url,
        fields: attachment.fields
      };
    });
  }

}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"rooms.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_apps/server/converters/rooms.js                                                                //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  AppRoomsConverter: () => AppRoomsConverter
});
let RoomType;
module.watch(require("@rocket.chat/apps-ts-definition/rooms"), {
  RoomType(v) {
    RoomType = v;
  }

}, 0);

class AppRoomsConverter {
  constructor(orch) {
    this.orch = orch;
  }

  convertById(roomId) {
    const room = RocketChat.models.Rooms.findOneById(roomId);
    return this.convertRoom(room);
  }

  convertByName(roomName) {
    const room = RocketChat.models.Rooms.findOneByName(roomName);
    return this.convertRoom(room);
  }

  convertAppRoom(room) {
    if (!room) {
      return undefined;
    }

    let u;

    if (room.creator) {
      const creator = RocketChat.models.Users.findOneById(room.creator.id);
      u = {
        _id: creator._id,
        username: creator.username
      };
    }

    return {
      _id: room.id,
      fname: room.displayName,
      name: room.slugifiedName,
      t: room.type,
      u,
      usernames: room.usernames,
      default: typeof room.isDefault === 'undefined' ? false : room.isDefault,
      ro: typeof room.isReadOnly === 'undefined' ? false : room.isReadOnly,
      sysMes: typeof room.displaySystemMessages === 'undefined' ? true : room.displaySystemMessages,
      msgs: room.messageCount || 0,
      ts: room.createdAt,
      _updatedAt: room.updatedAt,
      lm: room.lastModifiedAt
    };
  }

  convertRoom(room) {
    if (!room) {
      return undefined;
    }

    let creator;

    if (room.u) {
      creator = this.orch.getConverters().get('users').convertById(room.u._id);
    }

    return {
      id: room._id,
      displayName: room.fname,
      slugifiedName: room.name,
      type: this._convertTypeToApp(room.t),
      creator,
      usernames: room.usernames,
      isDefault: typeof room.default === 'undefined' ? false : room.default,
      isReadOnly: typeof room.ro === 'undefined' ? false : room.ro,
      displaySystemMessages: typeof room.sysMes === 'undefined' ? true : room.sysMes,
      messageCount: room.msgs,
      createdAt: room.ts,
      updatedAt: room._updatedAt,
      lastModifiedAt: room.lm,
      customFields: {}
    };
  }

  _convertTypeToApp(typeChar) {
    switch (typeChar) {
      case 'c':
        return RoomType.CHANNEL;

      case 'p':
        return RoomType.PRIVATE_GROUP;

      case 'd':
        return RoomType.DIRECT_MESSAGE;

      case 'lc':
        return RoomType.LIVE_CHAT;

      default:
        return typeChar;
    }
  }

}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"settings.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_apps/server/converters/settings.js                                                             //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  AppSettingsConverter: () => AppSettingsConverter
});
let SettingType;
module.watch(require("@rocket.chat/apps-ts-definition/settings"), {
  SettingType(v) {
    SettingType = v;
  }

}, 0);

class AppSettingsConverter {
  constructor(orch) {
    this.orch = orch;
  }

  convertById(settingId) {
    const setting = RocketChat.models.Settings.findOneById(settingId);
    return this.convertToApp(setting);
  }

  convertToApp(setting) {
    return {
      id: setting._id,
      type: this._convertTypeToApp(setting.type),
      packageValue: setting.packageValue,
      values: setting.values,
      value: setting.value,
      public: setting.public,
      hidden: setting.hidden,
      group: setting.group,
      i18nLabel: setting.i18nLabel,
      i18nDescription: setting.i18nDescription,
      createdAt: setting.ts,
      updatedAt: setting._updatedAt
    };
  }

  _convertTypeToApp(type) {
    switch (type) {
      case 'boolean':
        return SettingType.BOOLEAN;

      case 'code':
        return SettingType.CODE;

      case 'color':
        return SettingType.COLOR;

      case 'font':
        return SettingType.FONT;

      case 'int':
        return SettingType.NUMBER;

      case 'select':
        return SettingType.SELECT;

      case 'string':
        return SettingType.STRING;

      default:
        return type;
    }
  }

}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"users.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_apps/server/converters/users.js                                                                //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  AppUsersConverter: () => AppUsersConverter
});
let UserStatusConnection, UserType;
module.watch(require("@rocket.chat/apps-ts-definition/users"), {
  UserStatusConnection(v) {
    UserStatusConnection = v;
  },

  UserType(v) {
    UserType = v;
  }

}, 0);

class AppUsersConverter {
  constructor(orch) {
    this.orch = orch;
  }

  convertById(userId) {
    const user = RocketChat.models.Users.findOneById(userId);
    return this.convertToApp(user);
  }

  convertByUsername(username) {
    const user = RocketChat.models.Users.findOneByUsername(username);
    return this.convertToApp(user);
  }

  convertToApp(user) {
    if (!user) {
      return undefined;
    }

    const type = this._convertUserTypeToEnum(user.type);

    const statusConnection = this._convertStatusConnectionToEnum(user.username, user._id, user.statusConnection);

    return {
      id: user._id,
      username: user.username,
      emails: user.emails,
      type,
      isEnabled: user.active,
      name: user.name,
      roles: user.roles,
      status: user.status,
      statusConnection,
      utcOffset: user.utcOffset,
      createdAt: user.createdAt,
      updatedAt: user._updatedAt,
      lastLoginAt: user.lastLogin
    };
  }

  _convertUserTypeToEnum(type) {
    switch (type) {
      case 'user':
        return UserType.USER;

      case 'bot':
        return UserType.BOT;

      case '':
      case undefined:
        return UserType.UNKNOWN;

      default:
        console.warn(`A new user type has been added that the Apps don't know about? "${type}"`);
        return type.toUpperCase();
    }
  }

  _convertStatusConnectionToEnum(username, userId, status) {
    switch (status) {
      case 'offline':
        return UserStatusConnection.OFFLINE;

      case 'online':
        return UserStatusConnection.ONLINE;

      case 'away':
        return UserStatusConnection.AWAY;

      case 'busy':
        return UserStatusConnection.BUSY;

      case undefined:
        // This is needed for Livechat guests and Rocket.Cat user.
        return UserStatusConnection.UNDEFINED;

      default:
        console.warn(`The user ${username} (${userId}) does not have a valid status (offline, online, away, or busy). It is currently: "${status}"`);
        return !status ? UserStatusConnection.OFFLINE : status.toUpperCase();
    }
  }

}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_apps/server/converters/index.js                                                                //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  AppMessagesConverter: () => AppMessagesConverter,
  AppRoomsConverter: () => AppRoomsConverter,
  AppSettingsConverter: () => AppSettingsConverter,
  AppUsersConverter: () => AppUsersConverter
});
let AppMessagesConverter;
module.watch(require("./messages"), {
  AppMessagesConverter(v) {
    AppMessagesConverter = v;
  }

}, 0);
let AppRoomsConverter;
module.watch(require("./rooms"), {
  AppRoomsConverter(v) {
    AppRoomsConverter = v;
  }

}, 1);
let AppSettingsConverter;
module.watch(require("./settings"), {
  AppSettingsConverter(v) {
    AppSettingsConverter = v;
  }

}, 2);
let AppUsersConverter;
module.watch(require("./users"), {
  AppUsersConverter(v) {
    AppUsersConverter = v;
  }

}, 3);
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"orchestrator.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_apps/server/orchestrator.js                                                                    //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
let RealAppBridges;
module.watch(require("./bridges"), {
  RealAppBridges(v) {
    RealAppBridges = v;
  }

}, 0);
let AppMethods, AppsRestApi, AppServerNotifier;
module.watch(require("./communication"), {
  AppMethods(v) {
    AppMethods = v;
  },

  AppsRestApi(v) {
    AppsRestApi = v;
  },

  AppServerNotifier(v) {
    AppServerNotifier = v;
  }

}, 1);
let AppMessagesConverter, AppRoomsConverter, AppSettingsConverter, AppUsersConverter;
module.watch(require("./converters"), {
  AppMessagesConverter(v) {
    AppMessagesConverter = v;
  },

  AppRoomsConverter(v) {
    AppRoomsConverter = v;
  },

  AppSettingsConverter(v) {
    AppSettingsConverter = v;
  },

  AppUsersConverter(v) {
    AppUsersConverter = v;
  }

}, 2);
let AppsLogsModel, AppsModel, AppsPersistenceModel, AppRealStorage, AppRealLogsStorage;
module.watch(require("./storage"), {
  AppsLogsModel(v) {
    AppsLogsModel = v;
  },

  AppsModel(v) {
    AppsModel = v;
  },

  AppsPersistenceModel(v) {
    AppsPersistenceModel = v;
  },

  AppRealStorage(v) {
    AppRealStorage = v;
  },

  AppRealLogsStorage(v) {
    AppRealLogsStorage = v;
  }

}, 3);
let AppManager;
module.watch(require("@rocket.chat/apps-engine/server/AppManager"), {
  AppManager(v) {
    AppManager = v;
  }

}, 4);

class AppServerOrchestrator {
  constructor() {
    if (RocketChat.models && RocketChat.models.Permissions) {
      RocketChat.models.Permissions.createOrUpdate('manage-apps', ['admin']);
    }

    this._model = new AppsModel();
    this._logModel = new AppsLogsModel();
    this._persistModel = new AppsPersistenceModel();
    this._storage = new AppRealStorage(this._model);
    this._logStorage = new AppRealLogsStorage(this._logModel);
    this._converters = new Map();

    this._converters.set('messages', new AppMessagesConverter(this));

    this._converters.set('rooms', new AppRoomsConverter(this));

    this._converters.set('settings', new AppSettingsConverter(this));

    this._converters.set('users', new AppUsersConverter(this));

    this._bridges = new RealAppBridges(this);
    this._manager = new AppManager(this._storage, this._logStorage, this._bridges);
    this._communicators = new Map();

    this._communicators.set('methods', new AppMethods(this._manager));

    this._communicators.set('notifier', new AppServerNotifier(this));

    this._communicators.set('restapi', new AppsRestApi(this, this._manager));
  }

  getModel() {
    return this._model;
  }

  getPersistenceModel() {
    return this._persistModel;
  }

  getStorage() {
    return this._storage;
  }

  getLogStorage() {
    return this._logStorage;
  }

  getConverters() {
    return this._converters;
  }

  getBridges() {
    return this._bridges;
  }

  getNotifier() {
    return this._communicators.get('notifier');
  }

  getManager() {
    return this._manager;
  }

  isEnabled() {
    return true;
  }

  isLoaded() {
    return this.getManager().areAppsLoaded();
  }

}

Meteor.startup(function _appServerOrchestrator() {
  // Ensure that everything is setup
  if (process.env[AppManager.ENV_VAR_NAME_FOR_ENABLING] !== 'true' && process.env[AppManager.SUPER_FUN_ENV_ENABLEMENT_NAME] !== 'true') {
    global.Apps = new AppMethods();
    return;
  }

  console.log('Orchestrating the app piece...');
  global.Apps = new AppServerOrchestrator();
  global.Apps.getManager().load().then(affs => console.log(`...done loading ${affs.length}! ;)`)).catch(err => console.warn('...failed!', err));
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"node_modules":{"@rocket.chat":{"apps-engine":{"server":{"storage":{"index.js":function(require,exports){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// node_modules/meteor/rocketchat_apps/node_modules/@rocket.chat/apps-engine/server/storage/index.js                  //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AppLogStorage_1 = require("./AppLogStorage");
exports.AppLogStorage = AppLogStorage_1.AppLogStorage;
const AppStorage_1 = require("./AppStorage");
exports.AppStorage = AppStorage_1.AppStorage;



////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"logging":{"index.js":function(require,exports){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// node_modules/meteor/rocketchat_apps/node_modules/@rocket.chat/apps-engine/server/logging/index.js                  //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AppConsole_1 = require("./AppConsole");
exports.AppConsole = AppConsole_1.AppConsole;



////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"bridges":{"index.js":function(require,exports){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// node_modules/meteor/rocketchat_apps/node_modules/@rocket.chat/apps-engine/server/bridges/index.js                  //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AppBridges_1 = require("./AppBridges");
exports.AppBridges = AppBridges_1.AppBridges;



////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"AppManager.js":function(require,exports){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// node_modules/meteor/rocketchat_apps/node_modules/@rocket.chat/apps-engine/server/AppManager.js                     //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const bridges_1 = require("./bridges");
const compiler_1 = require("./compiler");
const managers_1 = require("./managers");
const DisabledApp_1 = require("./misc/DisabledApp");
const ProxiedApp_1 = require("./ProxiedApp");
const storage_1 = require("./storage");
const AppStatus_1 = require("@rocket.chat/apps-ts-definition/AppStatus");
const metadata_1 = require("@rocket.chat/apps-ts-definition/metadata");
class AppManager {
    constructor(rlStorage, logStorage, rlBridges) {
        console.log('Constructed the AppManager.');
        if (rlStorage instanceof storage_1.AppStorage) {
            this.storage = rlStorage;
        }
        else {
            throw new Error('Invalid instance of the AppStorage.');
        }
        if (logStorage instanceof storage_1.AppLogStorage) {
            this.logStorage = logStorage;
        }
        else {
            throw new Error('Invalid instance of the AppLogStorage.');
        }
        if (rlBridges instanceof bridges_1.AppBridges) {
            this.bridges = rlBridges;
        }
        else {
            throw new Error('Invalid instance of the AppBridges');
        }
        this.apps = new Map();
        this.parser = new compiler_1.AppPackageParser(this);
        this.compiler = new compiler_1.AppCompiler(this);
        this.accessorManager = new managers_1.AppAccessorManager(this);
        this.listenerManager = new managers_1.AppListenerManger(this);
        this.commandManager = new managers_1.AppSlashCommandManager(this);
        this.settingsManager = new managers_1.AppSettingsManager(this);
        this.isLoaded = false;
    }
    /** Gets the instance of the storage connector. */
    getStorage() {
        return this.storage;
    }
    /** Gets the instance of the log storage connector. */
    getLogStorage() {
        return this.logStorage;
    }
    /** Gets the instance of the App package parser. */
    getParser() {
        return this.parser;
    }
    /** Gets the compiler instance. */
    getCompiler() {
        return this.compiler;
    }
    /** Gets the accessor manager instance. */
    getAccessorManager() {
        return this.accessorManager;
    }
    /** Gets the instance of the Bridge manager. */
    getBridges() {
        return this.bridges;
    }
    /** Gets the instance of the listener manager. */
    getListenerManager() {
        return this.listenerManager;
    }
    /** Gets the command manager's instance. */
    getCommandManager() {
        return this.commandManager;
    }
    /** Gets the manager of the settings, updates and getting. */
    getSettingsManager() {
        return this.settingsManager;
    }
    /** Gets whether the Apps have been loaded or not. */
    areAppsLoaded() {
        return this.isLoaded;
    }
    /**
     * Goes through the entire loading up process.
     * Expect this to take some time, as it goes through a very
     * long process of loading all the Apps up.
     */
    load() {
        return __awaiter(this, void 0, void 0, function* () {
            const items = yield this.storage.retrieveAll();
            const affs = new Array();
            for (const item of items.values()) {
                const aff = new compiler_1.AppFabricationFulfillment();
                try {
                    const result = yield this.getParser().parseZip(item.zip);
                    aff.setAppInfo(result.info);
                    aff.setImplementedInterfaces(result.implemented.getValues());
                    aff.setCompilerErrors(result.compilerErrors);
                    if (result.compilerErrors.length > 0) {
                        throw new Error(`Failed to compile due to ${result.compilerErrors.length} errors.`);
                    }
                    item.compiled = result.compiledFiles;
                    const app = this.getCompiler().toSandBox(item);
                    this.apps.set(item.id, app);
                    aff.setApp(app);
                }
                catch (e) {
                    console.warn(`Error while compiling the App "${item.info.name} (${item.id})":`);
                    console.error(e);
                    const app = DisabledApp_1.DisabledApp.createNew(item.info, AppStatus_1.AppStatus.COMPILER_ERROR_DISABLED);
                    app.getLogger().error(e);
                    this.logStorage.storeEntries(app.getID(), app.getLogger());
                    const prl = new ProxiedApp_1.ProxiedApp(this, item, app, () => '');
                    this.apps.set(item.id, prl);
                    aff.setApp(prl);
                }
                affs.push(aff);
            }
            // Let's initialize them
            for (const rl of this.apps.values()) {
                if (AppStatus_1.AppStatusUtils.isDisabled(rl.getStatus())) {
                    // Usually if an App is disabled before it's initialized,
                    // then something (such as an error) occured while
                    // it was compiled or something similar.
                    continue;
                }
                yield this.initializeApp(items.get(rl.getID()), rl, true);
            }
            // Now let's enable the apps which were once enabled
            // but are not currently disabled.
            for (const rl of this.apps.values()) {
                if (!AppStatus_1.AppStatusUtils.isDisabled(rl.getStatus()) && AppStatus_1.AppStatusUtils.isEnabled(rl.getPreviousStatus())) {
                    yield this.enableApp(items.get(rl.getID()), rl, true, rl.getPreviousStatus() === AppStatus_1.AppStatus.MANUALLY_ENABLED);
                }
            }
            this.isLoaded = true;
            return affs;
        });
    }
    /** Gets the Apps which match the filter passed in. */
    get(filter) {
        let rls = new Array();
        if (typeof filter === 'undefined') {
            this.apps.forEach((rl) => rls.push(rl));
            return rls;
        }
        let nothing = true;
        if (typeof filter.enabled === 'boolean' && filter.enabled) {
            this.apps.forEach((rl) => {
                if (AppStatus_1.AppStatusUtils.isEnabled(rl.getStatus())) {
                    rls.push(rl);
                }
            });
            nothing = false;
        }
        if (typeof filter.disabled === 'boolean' && filter.disabled) {
            this.apps.forEach((rl) => {
                if (AppStatus_1.AppStatusUtils.isDisabled(rl.getStatus())) {
                    rls.push(rl);
                }
            });
            nothing = false;
        }
        if (nothing) {
            this.apps.forEach((rl) => rls.push(rl));
        }
        if (typeof filter.ids !== 'undefined') {
            rls = rls.filter((rl) => filter.ids.includes(rl.getID()));
        }
        if (typeof filter.name === 'string') {
            rls = rls.filter((rl) => rl.getName() === filter.name);
        }
        else if (filter.name instanceof RegExp) {
            rls = rls.filter((rl) => filter.name.test(rl.getName()));
        }
        return rls;
    }
    /** Gets a single App by the id passed in. */
    getOneById(appId) {
        return this.apps.get(appId);
    }
    enable(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const rl = this.apps.get(id);
            if (!rl) {
                throw new Error(`No App by the id "${id}" exists.`);
            }
            if (AppStatus_1.AppStatusUtils.isEnabled(rl.getStatus())) {
                throw new Error('The App is already enabled.');
            }
            if (rl.getStatus() === AppStatus_1.AppStatus.COMPILER_ERROR_DISABLED) {
                throw new Error('The App had compiler errors, can not enable it.');
            }
            const storageItem = yield this.storage.retrieveOne(id);
            if (!storageItem) {
                throw new Error(`Could not enable an App with the id of "${id}" as it doesn't exist.`);
            }
            const isSetup = yield this.runStartUpProcess(storageItem, rl, true);
            if (isSetup) {
                storageItem.status = rl.getStatus();
                // This is async, but we don't care since it only updates in the database
                // and it should not mutate any properties we care about
                this.storage.update(storageItem);
            }
            return isSetup;
        });
    }
    disable(id, isManual = false) {
        return __awaiter(this, void 0, void 0, function* () {
            const rl = this.apps.get(id);
            if (!rl) {
                throw new Error(`No App by the id "${id}" exists.`);
            }
            if (!AppStatus_1.AppStatusUtils.isEnabled(rl.getStatus())) {
                throw new Error(`No App by the id of "${id}" is enabled."`);
            }
            const storageItem = yield this.storage.retrieveOne(id);
            if (!storageItem) {
                throw new Error(`Could not disable an App with the id of "${id}" as it doesn't exist.`);
            }
            try {
                yield rl.call(metadata_1.AppMethod.ONDISABLE, this.accessorManager.getConfigurationModify(storageItem.id));
            }
            catch (e) {
                console.warn('Error while disabling:', e);
            }
            this.listenerManager.unregisterListeners(rl);
            this.commandManager.unregisterCommands(storageItem.id);
            this.accessorManager.purifyApp(storageItem.id);
            if (isManual) {
                yield rl.setStatus(AppStatus_1.AppStatus.MANUALLY_DISABLED);
            }
            // This is async, but we don't care since it only updates in the database
            // and it should not mutate any properties we care about
            storageItem.status = rl.getStatus();
            this.storage.update(storageItem);
            return true;
        });
    }
    add(zipContentsBase64d, enable = true) {
        return __awaiter(this, void 0, void 0, function* () {
            const aff = new compiler_1.AppFabricationFulfillment();
            const result = yield this.getParser().parseZip(zipContentsBase64d);
            aff.setAppInfo(result.info);
            aff.setImplementedInterfaces(result.implemented.getValues());
            aff.setCompilerErrors(result.compilerErrors);
            if (result.compilerErrors.length > 0) {
                return aff;
            }
            const created = yield this.storage.create({
                id: result.info.id,
                info: result.info,
                status: AppStatus_1.AppStatus.UNKNOWN,
                zip: zipContentsBase64d,
                compiled: result.compiledFiles,
                languageContent: result.languageContent,
                settings: {},
                implemented: result.implemented.getValues(),
            });
            if (!created) {
                throw new Error('Failed to create the App, the storage did not return it.');
            }
            // Now that is has all been compiled, let's get the
            // the App instance from the source.
            const app = this.getCompiler().toSandBox(created);
            this.apps.set(app.getID(), app);
            aff.setApp(app);
            // Let everyone know that the App has been added
            try {
                yield this.bridges.getAppActivationBridge().appAdded(app);
            }
            catch (e) {
                // If an error occurs during this, oh well.
            }
            // Should enable === true, then we go through the entire start up process
            // Otherwise, we only initialize it.
            if (enable) {
                // Start up the app
                yield this.runStartUpProcess(created, app, false);
            }
            else {
                yield this.initializeApp(created, app, true);
            }
            return aff;
        });
    }
    remove(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const app = this.apps.get(id);
            if (AppStatus_1.AppStatusUtils.isEnabled(app.getStatus())) {
                yield this.disable(id);
            }
            yield this.bridges.getPersistenceBridge().purge(app.getID());
            yield this.storage.remove(app.getID());
            // Let everyone know that the App has been removed
            try {
                yield this.bridges.getAppActivationBridge().appRemoved(app);
            }
            catch (e) {
                // If an error occurs during this, oh well.
            }
            this.apps.delete(app.getID());
            return app;
        });
    }
    update(zipContentsBase64d) {
        return __awaiter(this, void 0, void 0, function* () {
            const aff = new compiler_1.AppFabricationFulfillment();
            const result = yield this.getParser().parseZip(zipContentsBase64d);
            aff.setAppInfo(result.info);
            aff.setImplementedInterfaces(result.implemented.getValues());
            aff.setCompilerErrors(result.compilerErrors);
            if (result.compilerErrors.length > 0) {
                return aff;
            }
            const old = yield this.storage.retrieveOne(result.info.id);
            if (!old) {
                throw new Error('Can not update an App that does not currently exist.');
            }
            // Attempt to disable it, if it wasn't enabled then it will error and we don't care
            try {
                yield this.disable(old.id);
            }
            catch (e) {
                // We don't care
            }
            // TODO: We could show what new interfaces have been added
            const stored = yield this.storage.update({
                createdAt: old.createdAt,
                id: result.info.id,
                info: result.info,
                status: this.apps.get(old.id).getStatus(),
                zip: zipContentsBase64d,
                compiled: result.compiledFiles,
                languageContent: result.languageContent,
                settings: old.settings,
                implemented: result.implemented.getValues(),
            });
            // Now that is has all been compiled, let's get the
            // the App instance from the source.
            const app = this.getCompiler().toSandBox(stored);
            // Store it temporarily so we can access it else where
            this.apps.set(app.getID(), app);
            aff.setApp(app);
            // Start up the app
            yield this.runStartUpProcess(stored, app, false);
            // Let everyone know that the App has been updated
            try {
                yield this.bridges.getAppActivationBridge().appUpdated(app);
            }
            catch (e) {
                // If an error occurs during this, oh well.
            }
            return aff;
        });
    }
    getLanguageContent() {
        const langs = {};
        this.apps.forEach((rl) => {
            const content = rl.getStorageItem().languageContent;
            Object.keys(content).forEach((key) => {
                langs[key] = Object.assign(langs[key] || {}, content[key]);
            });
        });
        return langs;
    }
    changeStatus(appId, status) {
        return __awaiter(this, void 0, void 0, function* () {
            switch (status) {
                case AppStatus_1.AppStatus.MANUALLY_DISABLED:
                case AppStatus_1.AppStatus.MANUALLY_ENABLED:
                    break;
                default:
                    throw new Error('Invalid status to change an App to, must be manually disabled or enabled.');
            }
            const rl = this.apps.get(appId);
            if (!rl) {
                throw new Error('Can not change the status of an App which does not currently exist.');
            }
            if (AppStatus_1.AppStatusUtils.isEnabled(status)) {
                // Then enable it
                if (AppStatus_1.AppStatusUtils.isEnabled(rl.getStatus())) {
                    throw new Error('Can not enable an App which is already enabled.');
                }
                yield this.enable(rl.getID());
            }
            else {
                if (!AppStatus_1.AppStatusUtils.isEnabled(rl.getStatus())) {
                    throw new Error('Can not disable an App which is not enabled.');
                }
                yield this.disable(rl.getID(), true);
            }
            return rl;
        });
    }
    /**
     * Goes through the entire loading up process. WARNING: Do not use. ;)
     *
     * @param appId the id of the application to load
     */
    loadOne(appId) {
        return __awaiter(this, void 0, void 0, function* () {
            const item = yield this.storage.retrieveOne(appId);
            if (!item) {
                throw new Error(`No App found by the id of: "${appId}"`);
            }
            this.apps.set(item.id, this.getCompiler().toSandBox(item));
            const rl = this.apps.get(item.id);
            yield this.initializeApp(item, rl, false);
            if (AppStatus_1.AppStatusUtils.isEnabled(rl.getPreviousStatus())) {
                yield this.enableApp(item, rl, false, rl.getPreviousStatus() === AppStatus_1.AppStatus.MANUALLY_ENABLED);
            }
            return this.apps.get(item.id);
        });
    }
    runStartUpProcess(storageItem, app, isManual) {
        return __awaiter(this, void 0, void 0, function* () {
            if (app.getStatus() !== AppStatus_1.AppStatus.INITIALIZED) {
                const isInitialized = yield this.initializeApp(storageItem, app, true);
                if (!isInitialized) {
                    return false;
                }
            }
            const isEnabled = yield this.enableApp(storageItem, app, true, isManual);
            if (!isEnabled) {
                return false;
            }
            return true;
        });
    }
    initializeApp(storageItem, app, saveToDb = true) {
        return __awaiter(this, void 0, void 0, function* () {
            let result;
            const configExtend = this.getAccessorManager().getConfigurationExtend(storageItem.id);
            const envRead = this.getAccessorManager().getEnvironmentRead(storageItem.id);
            try {
                yield app.call(metadata_1.AppMethod.INITIALIZE, configExtend, envRead);
                result = true;
                yield app.setStatus(AppStatus_1.AppStatus.INITIALIZED);
            }
            catch (e) {
                if (e.name === 'NotEnoughMethodArgumentsError') {
                    console.warn('Please report the following error:');
                }
                console.error(e);
                this.commandManager.unregisterCommands(storageItem.id);
                result = false;
                yield app.setStatus(AppStatus_1.AppStatus.ERROR_DISABLED);
            }
            if (saveToDb) {
                // This is async, but we don't care since it only updates in the database
                // and it should not mutate any properties we care about
                storageItem.status = app.getStatus();
                this.storage.update(storageItem);
            }
            return result;
        });
    }
    enableApp(storageItem, app, saveToDb = true, isManual) {
        return __awaiter(this, void 0, void 0, function* () {
            let enable;
            try {
                enable = (yield app.call(metadata_1.AppMethod.ONENABLE, this.getAccessorManager().getEnvironmentRead(storageItem.id), this.getAccessorManager().getConfigurationModify(storageItem.id)));
                yield app.setStatus(isManual ? AppStatus_1.AppStatus.MANUALLY_ENABLED : AppStatus_1.AppStatus.AUTO_ENABLED);
            }
            catch (e) {
                enable = false;
                if (e.name === 'NotEnoughMethodArgumentsError') {
                    console.warn('Please report the following error:');
                }
                console.error(e);
                yield app.setStatus(AppStatus_1.AppStatus.ERROR_DISABLED);
            }
            if (enable) {
                this.commandManager.registerCommands(app.getID());
                this.listenerManager.registerListeners(app);
            }
            else {
                this.commandManager.unregisterCommands(app.getID());
            }
            if (saveToDb) {
                storageItem.status = app.getStatus();
                // This is async, but we don't care since it only updates in the database
                // and it should not mutate any properties we care about
                this.storage.update(storageItem);
            }
            return enable;
        });
    }
}
AppManager.ENV_VAR_NAME_FOR_ENABLING = 'USE_UNRELEASED_ROCKETAPPS_FRAMEWORK';
AppManager.SUPER_FUN_ENV_ENABLEMENT_NAME = 'LET_ME_HAVE_FUN_WITH_ROCKETS_NOW';
exports.AppManager = AppManager;



////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}},"apps-ts-definition":{"slashcommands":{"index.js":function(require,exports){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// node_modules/meteor/rocketchat_apps/node_modules/@rocket.chat/apps-ts-definition/slashcommands/index.js            //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SlashCommandContext_1 = require("./SlashCommandContext");
exports.SlashCommandContext = SlashCommandContext_1.SlashCommandContext;



////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"rooms":{"index.js":function(require,exports){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// node_modules/meteor/rocketchat_apps/node_modules/@rocket.chat/apps-ts-definition/rooms/index.js                    //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const RoomType_1 = require("./RoomType");
exports.RoomType = RoomType_1.RoomType;



////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"AppStatus.js":function(require,exports){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// node_modules/meteor/rocketchat_apps/node_modules/@rocket.chat/apps-ts-definition/AppStatus.js                      //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var AppStatus;
(function (AppStatus) {
    /** The status is known, aka not been constructed the proper way. */
    AppStatus["UNKNOWN"] = "unknown";
    /** The App has been constructed but that's it. */
    AppStatus["CONSTRUCTED"] = "constructed";
    /** The App's `initialize()` was called and returned true. */
    AppStatus["INITIALIZED"] = "initialized";
    /** The App's `onEnable()` was called, returned true, and this was done automatically (system start up). */
    AppStatus["AUTO_ENABLED"] = "auto_enabled";
    /** The App's `onEnable()` was called, returned true, and this was done by the user such as installing a new one. */
    AppStatus["MANUALLY_ENABLED"] = "manually_enabled";
    /**
     * The App was disabled due to an error while attempting to compile it.
     * An attempt to enable it again will fail, as it needs to be updated.
     */
    AppStatus["COMPILER_ERROR_DISABLED"] = "compiler_error_disabled";
    /** The App was disabled due to an unrecoverable error being thrown. */
    AppStatus["ERROR_DISABLED"] = "error_disabled";
    /** The App was manually disabled by a user. */
    AppStatus["MANUALLY_DISABLED"] = "manually_disabled";
    /** The App was disabled due to other circumstances. */
    AppStatus["DISABLED"] = "disabled";
})(AppStatus = exports.AppStatus || (exports.AppStatus = {}));
class AppStatusUtilsDef {
    isEnabled(status) {
        switch (status) {
            case AppStatus.AUTO_ENABLED:
            case AppStatus.MANUALLY_ENABLED:
                return true;
            default:
                return false;
        }
    }
    isDisabled(status) {
        switch (status) {
            case AppStatus.COMPILER_ERROR_DISABLED:
            case AppStatus.ERROR_DISABLED:
            case AppStatus.MANUALLY_DISABLED:
            case AppStatus.DISABLED:
                return true;
            default:
                return false;
        }
    }
}
exports.AppStatusUtilsDef = AppStatusUtilsDef;
exports.AppStatusUtils = new AppStatusUtilsDef();



////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"settings":{"index.js":function(require,exports){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// node_modules/meteor/rocketchat_apps/node_modules/@rocket.chat/apps-ts-definition/settings/index.js                 //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SettingType_1 = require("./SettingType");
exports.SettingType = SettingType_1.SettingType;



////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"users":{"index.js":function(require,exports){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// node_modules/meteor/rocketchat_apps/node_modules/@rocket.chat/apps-ts-definition/users/index.js                    //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const UserStatusConnection_1 = require("./UserStatusConnection");
exports.UserStatusConnection = UserStatusConnection_1.UserStatusConnection;
const UserType_1 = require("./UserType");
exports.UserType = UserType_1.UserType;



////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:apps/lib/Apps.js");
require("/node_modules/meteor/rocketchat:apps/server/storage/apps-logs-model.js");
require("/node_modules/meteor/rocketchat:apps/server/storage/apps-model.js");
require("/node_modules/meteor/rocketchat:apps/server/storage/apps-persistence-model.js");
require("/node_modules/meteor/rocketchat:apps/server/storage/storage.js");
require("/node_modules/meteor/rocketchat:apps/server/storage/index.js");
require("/node_modules/meteor/rocketchat:apps/server/bridges/activation.js");
require("/node_modules/meteor/rocketchat:apps/server/bridges/bridges.js");
require("/node_modules/meteor/rocketchat:apps/server/bridges/commands.js");
require("/node_modules/meteor/rocketchat:apps/server/bridges/environmental.js");
require("/node_modules/meteor/rocketchat:apps/server/bridges/messages.js");
require("/node_modules/meteor/rocketchat:apps/server/bridges/persistence.js");
require("/node_modules/meteor/rocketchat:apps/server/bridges/rooms.js");
require("/node_modules/meteor/rocketchat:apps/server/bridges/settings.js");
require("/node_modules/meteor/rocketchat:apps/server/bridges/users.js");
require("/node_modules/meteor/rocketchat:apps/server/bridges/index.js");
require("/node_modules/meteor/rocketchat:apps/server/communication/methods.js");
require("/node_modules/meteor/rocketchat:apps/server/communication/rest.js");
require("/node_modules/meteor/rocketchat:apps/server/communication/websockets.js");
require("/node_modules/meteor/rocketchat:apps/server/communication/index.js");
require("/node_modules/meteor/rocketchat:apps/server/converters/messages.js");
require("/node_modules/meteor/rocketchat:apps/server/converters/rooms.js");
require("/node_modules/meteor/rocketchat:apps/server/converters/settings.js");
require("/node_modules/meteor/rocketchat:apps/server/converters/users.js");
require("/node_modules/meteor/rocketchat:apps/server/converters/index.js");
require("/node_modules/meteor/rocketchat:apps/server/orchestrator.js");

/* Exports */
Package._define("rocketchat:apps", {
  Apps: Apps
});

})();

//# sourceURL=meteor://💻app/packages/rocketchat_apps.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDphcHBzL2xpYi9BcHBzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmFwcHMvc2VydmVyL3N0b3JhZ2UvYXBwcy1sb2dzLW1vZGVsLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmFwcHMvc2VydmVyL3N0b3JhZ2UvYXBwcy1tb2RlbC5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDphcHBzL3NlcnZlci9zdG9yYWdlL2FwcHMtcGVyc2lzdGVuY2UtbW9kZWwuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6YXBwcy9zZXJ2ZXIvc3RvcmFnZS9zdG9yYWdlLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmFwcHMvc2VydmVyL3N0b3JhZ2UvaW5kZXguanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6YXBwcy9zZXJ2ZXIvc3RvcmFnZS9sb2dzLXN0b3JhZ2UuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6YXBwcy9zZXJ2ZXIvYnJpZGdlcy9hY3RpdmF0aW9uLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmFwcHMvc2VydmVyL2JyaWRnZXMvYnJpZGdlcy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDphcHBzL3NlcnZlci9icmlkZ2VzL2NvbW1hbmRzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmFwcHMvc2VydmVyL2JyaWRnZXMvZW52aXJvbm1lbnRhbC5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDphcHBzL3NlcnZlci9icmlkZ2VzL21lc3NhZ2VzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmFwcHMvc2VydmVyL2JyaWRnZXMvcGVyc2lzdGVuY2UuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6YXBwcy9zZXJ2ZXIvYnJpZGdlcy9yb29tcy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDphcHBzL3NlcnZlci9icmlkZ2VzL3NldHRpbmdzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmFwcHMvc2VydmVyL2JyaWRnZXMvdXNlcnMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6YXBwcy9zZXJ2ZXIvYnJpZGdlcy9pbmRleC5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDphcHBzL3NlcnZlci9icmlkZ2VzL2RldGFpbHMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6YXBwcy9zZXJ2ZXIvYnJpZGdlcy9odHRwLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmFwcHMvc2VydmVyL2JyaWRnZXMvbGlzdGVuZXJzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmFwcHMvc2VydmVyL2NvbW11bmljYXRpb24vbWV0aG9kcy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDphcHBzL3NlcnZlci9jb21tdW5pY2F0aW9uL3Jlc3QuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6YXBwcy9zZXJ2ZXIvY29tbXVuaWNhdGlvbi93ZWJzb2NrZXRzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmFwcHMvc2VydmVyL2NvbW11bmljYXRpb24vaW5kZXguanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6YXBwcy9zZXJ2ZXIvY29udmVydGVycy9tZXNzYWdlcy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDphcHBzL3NlcnZlci9jb252ZXJ0ZXJzL3Jvb21zLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmFwcHMvc2VydmVyL2NvbnZlcnRlcnMvc2V0dGluZ3MuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6YXBwcy9zZXJ2ZXIvY29udmVydGVycy91c2Vycy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDphcHBzL3NlcnZlci9jb252ZXJ0ZXJzL2luZGV4LmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmFwcHMvc2VydmVyL29yY2hlc3RyYXRvci5qcyJdLCJuYW1lcyI6WyJBcHBzIiwibW9kdWxlIiwiZXhwb3J0IiwiQXBwc0xvZ3NNb2RlbCIsIlJvY2tldENoYXQiLCJtb2RlbHMiLCJfQmFzZSIsImNvbnN0cnVjdG9yIiwiQXBwc01vZGVsIiwiQXBwc1BlcnNpc3RlbmNlTW9kZWwiLCJBcHBSZWFsU3RvcmFnZSIsIkFwcFN0b3JhZ2UiLCJ3YXRjaCIsInJlcXVpcmUiLCJ2IiwiZGF0YSIsImRiIiwiY3JlYXRlIiwiaXRlbSIsIlByb21pc2UiLCJyZXNvbHZlIiwicmVqZWN0IiwiY3JlYXRlZEF0IiwiRGF0ZSIsInVwZGF0ZWRBdCIsImRvYyIsImZpbmRPbmUiLCIkb3IiLCJpZCIsImluZm8iLCJuYW1lU2x1ZyIsImUiLCJFcnJvciIsImluc2VydCIsIl9pZCIsInJldHJpZXZlT25lIiwicmV0cmlldmVBbGwiLCJkb2NzIiwiZmluZCIsImZldGNoIiwiaXRlbXMiLCJNYXAiLCJmb3JFYWNoIiwiaSIsInNldCIsInVwZGF0ZSIsInRoZW4iLCJ1cGRhdGVkIiwiY2F0Y2giLCJlcnIiLCJyZW1vdmUiLCJzdWNjZXNzIiwiQXBwUmVhbExvZ3NTdG9yYWdlIiwiQXBwQ29uc29sZSIsIkFwcExvZ1N0b3JhZ2UiLCJtb2RlbCIsImFyZ3VtZW50cyIsInN0b3JlRW50cmllcyIsImFwcElkIiwibG9nZ2VyIiwidG9TdG9yYWdlRW50cnkiLCJmaW5kT25lQnlJZCIsImdldEVudHJpZXNGb3IiLCJBcHBBY3RpdmF0aW9uQnJpZGdlIiwib3JjaCIsImFwcEFkZGVkIiwiYXBwIiwiZ2V0Tm90aWZpZXIiLCJnZXRJRCIsImFwcFVwZGF0ZWQiLCJhcHBSZW1vdmVkIiwiYXBwU3RhdHVzQ2hhbmdlZCIsInN0YXR1cyIsImFwcFN0YXR1c1VwZGF0ZWQiLCJSZWFsQXBwQnJpZGdlcyIsIkFwcEJyaWRnZXMiLCJBcHBEZXRhaWxDaGFuZ2VzQnJpZGdlIiwiQXBwQ29tbWFuZHNCcmlkZ2UiLCJBcHBFbnZpcm9ubWVudGFsVmFyaWFibGVCcmlkZ2UiLCJBcHBIdHRwQnJpZGdlIiwiQXBwTGlzdGVuZXJCcmlkZ2UiLCJBcHBNZXNzYWdlQnJpZGdlIiwiQXBwUGVyc2lzdGVuY2VCcmlkZ2UiLCJBcHBSb29tQnJpZGdlIiwiQXBwU2V0dGluZ0JyaWRnZSIsIkFwcFVzZXJCcmlkZ2UiLCJfYWN0QnJpZGdlIiwiX2NtZEJyaWRnZSIsIl9kZXRCcmlkZ2UiLCJfZW52QnJpZGdlIiwiX2h0dHBCcmlkZ2UiLCJfbGlzbkJyaWRnZSIsIl9tc2dCcmlkZ2UiLCJfcGVyc2lzdEJyaWRnZSIsIl9yb29tQnJpZGdlIiwiX3NldHNCcmlkZ2UiLCJfdXNlckJyaWRnZSIsImdldENvbW1hbmRCcmlkZ2UiLCJnZXRFbnZpcm9ubWVudGFsVmFyaWFibGVCcmlkZ2UiLCJnZXRIdHRwQnJpZGdlIiwiZ2V0TGlzdGVuZXJCcmlkZ2UiLCJnZXRNZXNzYWdlQnJpZGdlIiwiZ2V0UGVyc2lzdGVuY2VCcmlkZ2UiLCJnZXRBcHBBY3RpdmF0aW9uQnJpZGdlIiwiZ2V0QXBwRGV0YWlsQ2hhbmdlc0JyaWRnZSIsImdldFJvb21CcmlkZ2UiLCJnZXRTZXJ2ZXJTZXR0aW5nQnJpZGdlIiwiZ2V0VXNlckJyaWRnZSIsIlNsYXNoQ29tbWFuZENvbnRleHQiLCJkaXNhYmxlZENvbW1hbmRzIiwiZG9lc0NvbW1hbmRFeGlzdCIsImNvbW1hbmQiLCJjb25zb2xlIiwibG9nIiwibGVuZ3RoIiwiY21kIiwidG9Mb3dlckNhc2UiLCJzbGFzaENvbW1hbmRzIiwiY29tbWFuZHMiLCJoYXMiLCJlbmFibGVDb21tYW5kIiwidHJpbSIsImdldCIsImRlbGV0ZSIsImNvbW1hbmRVcGRhdGVkIiwiZGlzYWJsZUNvbW1hbmQiLCJjb21tYW5kRGlzYWJsZWQiLCJtb2RpZnlDb21tYW5kIiwiX3ZlcmlmeUNvbW1hbmQiLCJwYXJhbXMiLCJwYXJhbXNFeGFtcGxlIiwiZGVzY3JpcHRpb24iLCJpMThuRGVzY3JpcHRpb24iLCJjYWxsYmFjayIsIl9hcHBDb21tYW5kRXhlY3V0b3IiLCJiaW5kIiwicmVnaXN0ZXJDb21tYW5kIiwiY29tbWFuZEFkZGVkIiwidW5yZWdpc3RlckNvbW1hbmQiLCJjb21tYW5kUmVtb3ZlZCIsImV4ZWN1dG9yIiwicGFyYW1ldGVycyIsIm1lc3NhZ2UiLCJ1c2VyIiwiZ2V0Q29udmVydGVycyIsImNvbnZlcnRCeUlkIiwiTWV0ZW9yIiwidXNlcklkIiwicm9vbSIsInJpZCIsInNwbGl0IiwiY29udGV4dCIsIk9iamVjdCIsImZyZWV6ZSIsImdldE1hbmFnZXIiLCJnZXRDb21tYW5kTWFuYWdlciIsImV4ZWN1dGVDb21tYW5kIiwiYWxsb3dlZCIsImdldFZhbHVlQnlOYW1lIiwiZW52VmFyTmFtZSIsImlzUmVhZGFibGUiLCJwcm9jZXNzIiwiZW52IiwiaW5jbHVkZXMiLCJ0b1VwcGVyQ2FzZSIsImlzU2V0IiwibXNnIiwiY29udmVydEFwcE1lc3NhZ2UiLCJydW5Bc1VzZXIiLCJ1IiwiY2FsbCIsImdldEJ5SWQiLCJtZXNzYWdlSWQiLCJlZGl0b3IiLCJNZXNzYWdlcyIsIlVzZXJzIiwidXBkYXRlTWVzc2FnZSIsIm5vdGlmeVVzZXIiLCJOb3RpZmljYXRpb25zIiwiYXNzaWduIiwiUmFuZG9tIiwidHMiLCJ1bmRlZmluZWQiLCJub3RpZnlSb29tIiwidXNlcm5hbWVzIiwiQXJyYXkiLCJpc0FycmF5Iiwicm1zZyIsImZpbmRPbmVCeVVzZXJuYW1lIiwicHVyZ2UiLCJnZXRQZXJzaXN0ZW5jZU1vZGVsIiwiY3JlYXRlV2l0aEFzc29jaWF0aW9ucyIsImFzc29jaWF0aW9ucyIsInJlYWRCeUlkIiwicmVjb3JkIiwicmVhZEJ5QXNzb2NpYXRpb25zIiwicmVjb3JkcyIsIiRhbGwiLCJtYXAiLCJyIiwicmVtb3ZlQnlBc3NvY2lhdGlvbnMiLCJxdWVyeSIsInVwc2VydCIsIlJvb21UeXBlIiwicmNSb29tIiwiY29udmVydEFwcFJvb20iLCJtZXRob2QiLCJ0eXBlIiwiQ0hBTk5FTCIsIlBSSVZBVEVfR1JPVVAiLCJjcmVhdG9yIiwicm9vbUlkIiwiZ2V0QnlOYW1lIiwicm9vbU5hbWUiLCJjb252ZXJ0QnlOYW1lIiwiUm9vbXMiLCJybSIsImFsbG93ZWRHcm91cHMiLCJkaXNhbGxvd2VkU2V0dGluZ3MiLCJnZXRBbGwiLCJTZXR0aW5ncyIsIiRuaW4iLCJzIiwiY29udmVydFRvQXBwIiwiZ2V0T25lQnlJZCIsImlzUmVhZGFibGVCeUlkIiwiaGlkZUdyb3VwIiwibmFtZSIsImhpZGVTZXR0aW5nIiwidXBkYXRlT25lIiwic2V0dGluZyIsImdldEJ5VXNlcm5hbWUiLCJ1c2VybmFtZSIsImNvbnZlcnRCeVVzZXJuYW1lIiwib25BcHBTZXR0aW5nc0NoYW5nZSIsImFwcFNldHRpbmdzQ2hhbmdlIiwid2FybiIsInJlcXVlc3QiLCJjb250ZW50IiwiSlNPTiIsInN0cmluZ2lmeSIsIkhUVFAiLCJ1cmwiLCJyZXN1bHQiLCJyZXNwb25zZSIsIm1lc3NhZ2VFdmVudCIsImludGUiLCJjb252ZXJ0TWVzc2FnZSIsImdldExpc3RlbmVyTWFuYWdlciIsImV4ZWN1dGVMaXN0ZW5lciIsInJvb21FdmVudCIsImNvbnZlcnRSb29tIiwiQXBwTWV0aG9kcyIsIm1hbmFnZXIiLCJfbWFuYWdlciIsIl9hZGRNZXRob2RzIiwiaXNFbmFibGVkIiwiaXNMb2FkZWQiLCJhcmVBcHBzTG9hZGVkIiwiaW5zdGFuY2UiLCJtZXRob2RzIiwiQXBwc1Jlc3RBcGkiLCJfb3JjaCIsImFwaSIsIkFQSSIsIkFwaUNsYXNzIiwidmVyc2lvbiIsInVzZURlZmF1bHRBdXRoIiwicHJldHR5SnNvbiIsImVuYWJsZUNvcnMiLCJhdXRoIiwiZ2V0VXNlckF1dGgiLCJhZGRNYW5hZ2VtZW50Um91dGVzIiwiX2hhbmRsZUZpbGUiLCJmaWxlRmllbGQiLCJCdXNib3kiLCJOcG0iLCJidXNib3kiLCJoZWFkZXJzIiwid3JhcEFzeW5jIiwib24iLCJiaW5kRW52aXJvbm1lbnQiLCJmaWVsZG5hbWUiLCJmaWxlIiwiZmlsZURhdGEiLCJwdXNoIiwiQnVmZmVyIiwiY29uY2F0IiwicGlwZSIsIm9yY2hlc3RyYXRvciIsImZpbGVIYW5kbGVyIiwiYWRkUm91dGUiLCJhdXRoUmVxdWlyZWQiLCJhcHBzIiwicHJsIiwiZ2V0SW5mbyIsImxhbmd1YWdlcyIsImdldFN0b3JhZ2VJdGVtIiwibGFuZ3VhZ2VDb250ZW50IiwiZ2V0U3RhdHVzIiwidjEiLCJwb3N0IiwiYnVmZiIsImJvZHlQYXJhbXMiLCJucG1SZXF1ZXN0T3B0aW9ucyIsImVuY29kaW5nIiwic3RhdHVzQ29kZSIsImZhaWx1cmUiLCJlcnJvciIsImZyb20iLCJhZmYiLCJhd2FpdCIsImFkZCIsInRvU3RyaW5nIiwiZ2V0QXBwSW5mbyIsImdldEFwcCIsImltcGxlbWVudGVkIiwiZ2V0SW1wbGVtZW50ZWRJbmZlcmZhY2VzIiwiY29tcGlsZXJFcnJvcnMiLCJnZXRDb21waWxlckVycm9ycyIsInVybFBhcmFtcyIsIm5vdEZvdW5kIiwiaWNvbkZpbGVDb250ZW50Iiwib2Zmc2V0IiwiY291bnQiLCJnZXRQYWdpbmF0aW9uSXRlbXMiLCJzb3J0IiwiZmllbGRzIiwicGFyc2VKc29uUXVlcnkiLCJvdXJRdWVyeSIsIm9wdGlvbnMiLCJfdXBkYXRlZEF0Iiwic2tpcCIsImxpbWl0IiwibG9ncyIsImdldExvZ1N0b3JhZ2UiLCJzZXR0aW5ncyIsImtleXMiLCJrIiwiaGlkZGVuIiwiZ2V0U2V0dGluZ3NNYW5hZ2VyIiwidXBkYXRlQXBwU2V0dGluZyIsInNldHRpbmdJZCIsImdldEFwcFNldHRpbmciLCJjaGFuZ2VTdGF0dXMiLCJBcHBFdmVudHMiLCJBcHBTZXJ2ZXJMaXN0ZW5lciIsIkFwcFNlcnZlck5vdGlmaWVyIiwiQXBwU3RhdHVzIiwiQXBwU3RhdHVzVXRpbHMiLCJBUFBfQURERUQiLCJBUFBfUkVNT1ZFRCIsIkFQUF9VUERBVEVEIiwiQVBQX1NUQVRVU19DSEFOR0UiLCJBUFBfU0VUVElOR19VUERBVEVEIiwiQ09NTUFORF9BRERFRCIsIkNPTU1BTkRfRElTQUJMRUQiLCJDT01NQU5EX1VQREFURUQiLCJDT01NQU5EX1JFTU9WRUQiLCJlbmdpbmVTdHJlYW1lciIsImNsaWVudFN0cmVhbWVyIiwicmVjaWV2ZWQiLCJvbkFwcEFkZGVkIiwib25BcHBTdGF0dXNVcGRhdGVkIiwib25BcHBTZXR0aW5nVXBkYXRlZCIsIm9uQXBwUmVtb3ZlZCIsIm9uQ29tbWFuZEFkZGVkIiwib25Db21tYW5kRGlzYWJsZWQiLCJvbkNvbW1hbmRVcGRhdGVkIiwib25Db21tYW5kUmVtb3ZlZCIsImxvYWRPbmUiLCJlbWl0Iiwid2hlbiIsImVuYWJsZSIsImlzRGlzYWJsZWQiLCJkaXNhYmxlIiwiTUFOVUFMTFlfRElTQUJMRUQiLCJTdHJlYW1lciIsInJldHJhbnNtaXQiLCJzZXJ2ZXJPbmx5IiwiYWxsb3dSZWFkIiwiYWxsb3dFbWl0IiwiYWxsb3dXcml0ZSIsImxpc3RlbmVyIiwiZGV0YWlscyIsIkFwcE1lc3NhZ2VzQ29udmVydGVyIiwibXNnSWQiLCJtc2dPYmoiLCJzZW5kZXIiLCJlZGl0ZWRCeSIsImF0dGFjaG1lbnRzIiwiX2NvbnZlcnRBdHRhY2htZW50c1RvQXBwIiwidGV4dCIsImVkaXRlZEF0IiwiZW1vamkiLCJhdmF0YXJVcmwiLCJhdmF0YXIiLCJhbGlhcyIsImN1c3RvbUZpZWxkcyIsIl9jb252ZXJ0QXBwQXR0YWNobWVudHMiLCJhdHRhY2htZW50IiwiY29sbGFwc2VkIiwiY29sb3IiLCJ0aW1lc3RhbXAiLCJtZXNzYWdlX2xpbmsiLCJ0aW1lc3RhbXBMaW5rIiwidGh1bWJfdXJsIiwidGh1bWJuYWlsVXJsIiwiYXV0aG9yX25hbWUiLCJhdXRob3IiLCJhdXRob3JfbGluayIsImxpbmsiLCJhdXRob3JfaWNvbiIsImljb24iLCJ0aXRsZSIsInZhbHVlIiwidGl0bGVfbGluayIsInRpdGxlX2xpbmtfZG93bmxvYWQiLCJkaXNwbGF5RG93bmxvYWRMaW5rIiwiaW1hZ2VfdXJsIiwiaW1hZ2VVcmwiLCJhdWRpb191cmwiLCJhdWRpb1VybCIsInZpZGVvX3VybCIsInZpZGVvVXJsIiwiYSIsIkFwcFJvb21zQ29udmVydGVyIiwiZmluZE9uZUJ5TmFtZSIsImZuYW1lIiwiZGlzcGxheU5hbWUiLCJzbHVnaWZpZWROYW1lIiwidCIsImRlZmF1bHQiLCJpc0RlZmF1bHQiLCJybyIsImlzUmVhZE9ubHkiLCJzeXNNZXMiLCJkaXNwbGF5U3lzdGVtTWVzc2FnZXMiLCJtc2dzIiwibWVzc2FnZUNvdW50IiwibG0iLCJsYXN0TW9kaWZpZWRBdCIsIl9jb252ZXJ0VHlwZVRvQXBwIiwidHlwZUNoYXIiLCJESVJFQ1RfTUVTU0FHRSIsIkxJVkVfQ0hBVCIsIkFwcFNldHRpbmdzQ29udmVydGVyIiwiU2V0dGluZ1R5cGUiLCJwYWNrYWdlVmFsdWUiLCJ2YWx1ZXMiLCJwdWJsaWMiLCJncm91cCIsImkxOG5MYWJlbCIsIkJPT0xFQU4iLCJDT0RFIiwiQ09MT1IiLCJGT05UIiwiTlVNQkVSIiwiU0VMRUNUIiwiU1RSSU5HIiwiQXBwVXNlcnNDb252ZXJ0ZXIiLCJVc2VyU3RhdHVzQ29ubmVjdGlvbiIsIlVzZXJUeXBlIiwiX2NvbnZlcnRVc2VyVHlwZVRvRW51bSIsInN0YXR1c0Nvbm5lY3Rpb24iLCJfY29udmVydFN0YXR1c0Nvbm5lY3Rpb25Ub0VudW0iLCJlbWFpbHMiLCJhY3RpdmUiLCJyb2xlcyIsInV0Y09mZnNldCIsImxhc3RMb2dpbkF0IiwibGFzdExvZ2luIiwiVVNFUiIsIkJPVCIsIlVOS05PV04iLCJPRkZMSU5FIiwiT05MSU5FIiwiQVdBWSIsIkJVU1kiLCJVTkRFRklORUQiLCJBcHBNYW5hZ2VyIiwiQXBwU2VydmVyT3JjaGVzdHJhdG9yIiwiUGVybWlzc2lvbnMiLCJjcmVhdGVPclVwZGF0ZSIsIl9tb2RlbCIsIl9sb2dNb2RlbCIsIl9wZXJzaXN0TW9kZWwiLCJfc3RvcmFnZSIsIl9sb2dTdG9yYWdlIiwiX2NvbnZlcnRlcnMiLCJfYnJpZGdlcyIsIl9jb21tdW5pY2F0b3JzIiwiZ2V0TW9kZWwiLCJnZXRTdG9yYWdlIiwiZ2V0QnJpZGdlcyIsInN0YXJ0dXAiLCJfYXBwU2VydmVyT3JjaGVzdHJhdG9yIiwiRU5WX1ZBUl9OQU1FX0ZPUl9FTkFCTElORyIsIlNVUEVSX0ZVTl9FTlZfRU5BQkxFTUVOVF9OQU1FIiwiZ2xvYmFsIiwibG9hZCIsImFmZnMiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTtBQUNBQSxPQUFPLEVBQVAsQzs7Ozs7Ozs7Ozs7QUNEQUMsT0FBT0MsTUFBUCxDQUFjO0FBQUNDLGlCQUFjLE1BQUlBO0FBQW5CLENBQWQ7O0FBQU8sTUFBTUEsYUFBTixTQUE0QkMsV0FBV0MsTUFBWCxDQUFrQkMsS0FBOUMsQ0FBb0Q7QUFDMURDLGdCQUFjO0FBQ2IsVUFBTSxXQUFOO0FBQ0E7O0FBSHlELEM7Ozs7Ozs7Ozs7O0FDQTNETixPQUFPQyxNQUFQLENBQWM7QUFBQ00sYUFBVSxNQUFJQTtBQUFmLENBQWQ7O0FBQU8sTUFBTUEsU0FBTixTQUF3QkosV0FBV0MsTUFBWCxDQUFrQkMsS0FBMUMsQ0FBZ0Q7QUFDdERDLGdCQUFjO0FBQ2IsVUFBTSxNQUFOO0FBQ0E7O0FBSHFELEM7Ozs7Ozs7Ozs7O0FDQXZETixPQUFPQyxNQUFQLENBQWM7QUFBQ08sd0JBQXFCLE1BQUlBO0FBQTFCLENBQWQ7O0FBQU8sTUFBTUEsb0JBQU4sU0FBbUNMLFdBQVdDLE1BQVgsQ0FBa0JDLEtBQXJELENBQTJEO0FBQ2pFQyxn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a0JBQWdCO0FBQ2YsV0FBTyxLQUFLeUosV0FBWjtBQUNBOztBQUVEeFYsa0JBQWdCO0FBQ2YsV0FBTyxLQUFLeVYsV0FBWjtBQUNBOztBQUVESyxlQUFhO0FBQ1osV0FBTyxLQUFLSixRQUFaO0FBQ0E7O0FBRUR2YSxnQkFBYztBQUNiLFdBQU8sS0FBS3dhLGNBQUwsQ0FBb0JqWCxHQUFwQixDQUF3QixVQUF4QixDQUFQO0FBQ0E7O0FBRURnQyxlQUFhO0FBQ1osV0FBTyxLQUFLb0csUUFBWjtBQUNBOztBQUVERSxjQUFZO0FBQ1gsV0FBTyxJQUFQO0FBQ0E7O0FBRURDLGFBQVc7QUFDVixXQUFPLEtBQUt2RyxVQUFMLEdBQWtCd0csYUFBbEIsRUFBUDtBQUNBOztBQWxFMEI7O0FBcUU1QmhILE9BQU82VixPQUFQLENBQWUsU0FBU0Msc0JBQVQsR0FBa0M7QUFDaEQ7QUFDQSxNQUFJL1UsUUFBUUMsR0FBUixDQUFZOFQsV0FBV2lCLHlCQUF2QixNQUFzRCxNQUF0RCxJQUFnRWhWLFFBQVFDLEdBQVIsQ0FBWThULFdBQVdrQiw2QkFBdkIsTUFBMEQsTUFBOUgsRUFBc0k7QUFDcklDLFdBQU9uZixJQUFQLEdBQWMsSUFBSTRQLFVBQUosRUFBZDtBQUNBO0FBQ0E7O0FBRUQ1SSxVQUFRQyxHQUFSLENBQVksZ0NBQVo7QUFDQWtZLFNBQU9uZixJQUFQLEdBQWMsSUFBSWllLHFCQUFKLEVBQWQ7QUFFQWtCLFNBQU9uZixJQUFQLENBQVkwSixVQUFaLEdBQXlCMFYsSUFBekIsR0FDRXRjLElBREYsQ0FDUXVjLElBQUQsSUFBVXJZLFFBQVFDLEdBQVIsQ0FBYSxtQkFBbUJvWSxLQUFLblksTUFBUSxNQUE3QyxDQURqQixFQUVFbEUsS0FGRixDQUVTQyxHQUFELElBQVMrRCxRQUFRNEgsSUFBUixDQUFhLFlBQWIsRUFBMkIzTCxHQUEzQixDQUZqQjtBQUdBLENBYkQsRSIsImZpbGUiOiIvcGFja2FnZXMvcm9ja2V0Y2hhdF9hcHBzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gUGxlYXNlIHNlZSBib3RoIHNlcnZlciBhbmQgY2xpZW50J3MgcmVwc2VjdGl2ZSBcIm9yY2hlc3RyYXRvclwiIGZpbGUgZm9yIHRoZSBjb250ZW50c1xuQXBwcyA9IHt9O1xuIiwiZXhwb3J0IGNsYXNzIEFwcHNMb2dzTW9kZWwgZXh0ZW5kcyBSb2NrZXRDaGF0Lm1vZGVscy5fQmFzZSB7XG5cdGNvbnN0cnVjdG9yKCkge1xuXHRcdHN1cGVyKCdhcHBzX2xvZ3MnKTtcblx0fVxufVxuIiwiZXhwb3J0IGNsYXNzIEFwcHNNb2RlbCBleHRlbmRzIFJvY2tldENoYXQubW9kZWxzLl9CYXNlIHtcblx0Y29uc3RydWN0b3IoKSB7XG5cdFx0c3VwZXIoJ2FwcHMnKTtcblx0fVxufVxuIiwiZXhwb3J0IGNsYXNzIEFwcHNQZXJzaXN0ZW5jZU1vZGVsIGV4dGVuZHMgUm9ja2V0Q2hhdC5tb2RlbHMuX0Jhc2Uge1xuXHRjb25zdHJ1Y3RvcigpIHtcblx0XHRzdXBlcignYXBwc19wZXJzaXN0ZW5jZScpO1xuXHR9XG59XG4iLCJpbXBvcnQgeyBBcHBTdG9yYWdlIH0gZnJvbSAnQHJvY2tldC5jaGF0L2FwcHMtZW5naW5lL3NlcnZlci9zdG9yYWdlJztcblxuZXhwb3J0IGNsYXNzIEFwcFJlYWxTdG9yYWdlIGV4dGVuZHMgQXBwU3RvcmFnZSB7XG5cdGNvbnN0cnVjdG9yKGRhdGEpIHtcblx0XHRzdXBlcignbW9uZ29kYicpO1xuXHRcdHRoaXMuZGIgPSBkYXRhO1xuXHR9XG5cblx0Y3JlYXRlKGl0ZW0pIHtcblx0XHRyZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuXHRcdFx0aXRlbS5jcmVhdGVkQXQgPSBuZXcgRGF0ZSgpO1xuXHRcdFx0aXRlbS51cGRhdGVkQXQgPSBuZXcgRGF0ZSgpO1xuXG5cdFx0XHRsZXQgZG9jO1xuXG5cdFx0XHR0cnkge1xuXHRcdFx0XHRkb2MgPSB0aGlzLmRiLmZpbmRPbmUoeyAkb3I6IFt7IGlkOiBpdGVtLmlkIH0sIHsgJ2luZm8ubmFtZVNsdWcnOiBpdGVtLmluZm8ubmFtZVNsdWcgfV0gfSk7XG5cdFx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRcdHJldHVybiByZWplY3QoZSk7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChkb2MpIHtcblx0XHRcdFx0cmV0dXJuIHJlamVjdChuZXcgRXJyb3IoJ0FwcCBhbHJlYWR5IGV4aXN0cy4nKSk7XG5cdFx0XHR9XG5cblx0XHRcdHRyeSB7XG5cdFx0XHRcdGNvbnN0IGlkID0gdGhpcy5kYi5pbnNlcnQoaXRlbSk7XG5cdFx0XHRcdGl0ZW0uX2lkID0gaWQ7XG5cblx0XHRcdFx0cmVzb2x2ZShpdGVtKTtcblx0XHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdFx0cmVqZWN0KGUpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHR9XG5cblx0cmV0cmlldmVPbmUoaWQpIHtcblx0XHRyZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuXHRcdFx0bGV0IGRvYztcblxuXHRcdFx0dHJ5IHtcblx0XHRcdFx0ZG9jID0gdGhpcy5kYi5maW5kT25lKHsgJG9yOiBbIHtfaWQ6IGlkIH0sIHsgaWQgfSBdfSk7XG5cdFx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRcdHJldHVybiByZWplY3QoZSk7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChkb2MpIHtcblx0XHRcdFx0cmVzb2x2ZShkb2MpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0cmVqZWN0KG5ldyBFcnJvcihgTm8gQXBwIGZvdW5kIGJ5IHRoZSBpZDogJHsgaWQgfWApKTtcblx0XHRcdH1cblx0XHR9KTtcblx0fVxuXG5cdHJldHJpZXZlQWxsKCkge1xuXHRcdHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cdFx0XHRsZXQgZG9jcztcblxuXHRcdFx0dHJ5IHtcblx0XHRcdFx0ZG9jcyA9IHRoaXMuZGIuZmluZCh7fSkuZmV0Y2goKTtcblx0XHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdFx0cmV0dXJuIHJlamVjdChlKTtcblx0XHRcdH1cblxuXHRcdFx0Y29uc3QgaXRlbXMgPSBuZXcgTWFwKCk7XG5cblx0XHRcdGRvY3MuZm9yRWFjaCgoaSkgPT4gaXRlbXMuc2V0KGkuaWQsIGkpKTtcblxuXHRcdFx0cmVzb2x2ZShpdGVtcyk7XG5cdFx0fSk7XG5cdH1cblxuXHR1cGRhdGUoaXRlbSkge1xuXHRcdHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cdFx0XHR0cnkge1xuXHRcdFx0XHR0aGlzLmRiLnVwZGF0ZSh7IGlkOiBpdGVtLmlkIH0sIGl0ZW0pO1xuXHRcdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0XHRyZXR1cm4gcmVqZWN0KGUpO1xuXHRcdFx0fVxuXG5cdFx0XHR0aGlzLnJldHJpZXZlT25lKGl0ZW0uaWQpLnRoZW4oKHVwZGF0ZWQpID0+IHJlc29sdmUodXBkYXRlZCkpLmNhdGNoKChlcnIpID0+IHJlamVjdChlcnIpKTtcblx0XHR9KTtcblx0fVxuXG5cdHJlbW92ZShpZCkge1xuXHRcdHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cdFx0XHR0cnkge1xuXHRcdFx0XHR0aGlzLmRiLnJlbW92ZSh7IGlkIH0pO1xuXHRcdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0XHRyZXR1cm4gcmVqZWN0KGUpO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXNvbHZlKHsgc3VjY2VzczogdHJ1ZSB9KTtcblx0XHR9KTtcblx0fVxufVxuIiwiaW1wb3J0IHsgQXBwc0xvZ3NNb2RlbCB9IGZyb20gJy4vYXBwcy1sb2dzLW1vZGVsJztcbmltcG9ydCB7IEFwcHNNb2RlbCB9IGZyb20gJy4vYXBwcy1tb2RlbCc7XG5pbXBvcnQgeyBBcHBzUGVyc2lzdGVuY2VNb2RlbCB9IGZyb20gJy4vYXBwcy1wZXJzaXN0ZW5jZS1tb2RlbCc7XG5pbXBvcnQgeyBBcHBSZWFsTG9nc1N0b3JhZ2UgfSBmcm9tICcuL2xvZ3Mtc3RvcmFnZSc7XG5pbXBvcnQgeyBBcHBSZWFsU3RvcmFnZSB9IGZyb20gJy4vc3RvcmFnZSc7XG5cbmV4cG9ydCB7IEFwcHNMb2dzTW9kZWwsIEFwcHNNb2RlbCwgQXBwc1BlcnNpc3RlbmNlTW9kZWwsIEFwcFJlYWxMb2dzU3RvcmFnZSwgQXBwUmVhbFN0b3JhZ2UgfTtcbiIsImltcG9ydCB7IEFwcENvbnNvbGUgfSBmcm9tICdAcm9ja2V0LmNoYXQvYXBwcy1lbmdpbmUvc2VydmVyL2xvZ2dpbmcnO1xuaW1wb3J0IHsgQXBwTG9nU3RvcmFnZSB9IGZyb20gJ0Byb2NrZXQuY2hhdC9hcHBzLWVuZ2luZS9zZXJ2ZXIvc3RvcmFnZSc7XG5cbmV4cG9ydCBjbGFzcyBBcHBSZWFsTG9nc1N0b3JhZ2UgZXh0ZW5kcyBBcHBMb2dTdG9yYWdlIHtcblx0Y29uc3RydWN0b3IobW9kZWwpIHtcblx0XHRzdXBlcignbW9uZ29kYicpO1xuXHRcdHRoaXMuZGIgPSBtb2RlbDtcblx0fVxuXG5cdGZpbmQoKSB7XG5cdFx0cmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcblx0XHRcdGxldCBkb2NzO1xuXG5cdFx0XHR0cnkge1xuXHRcdFx0XHRkb2NzID0gdGhpcy5kYi5maW5kKC4uLmFyZ3VtZW50cykuZmV0Y2goKTtcblx0XHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdFx0cmV0dXJuIHJlamVjdChlKTtcblx0XHRcdH1cblxuXHRcdFx0cmVzb2x2ZShkb2NzKTtcblx0XHR9KTtcblx0fVxuXG5cdHN0b3JlRW50cmllcyhhcHBJZCwgbG9nZ2VyKSB7XG5cdFx0cmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcblx0XHRcdGNvbnN0IGl0ZW0gPSBBcHBDb25zb2xlLnRvU3RvcmFnZUVudHJ5KGFwcElkLCBsb2dnZXIpO1xuXG5cdFx0XHR0cnkge1xuXHRcdFx0XHRjb25zdCBpZCA9IHRoaXMuZGIuaW5zZXJ0KGl0ZW0pO1xuXG5cdFx0XHRcdHJlc29sdmUodGhpcy5kYi5maW5kT25lQnlJZChpZCkpO1xuXHRcdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0XHRyZWplY3QoZSk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH1cblxuXHRnZXRFbnRyaWVzRm9yKGFwcElkKSB7XG5cdFx0cmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcblx0XHRcdGxldCBkb2NzO1xuXG5cdFx0XHR0cnkge1xuXHRcdFx0XHRkb2NzID0gdGhpcy5kYi5maW5kKHsgYXBwSWQgfSkuZmV0Y2goKTtcblx0XHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdFx0cmV0dXJuIHJlamVjdChlKTtcblx0XHRcdH1cblxuXHRcdFx0cmVzb2x2ZShkb2NzKTtcblx0XHR9KTtcblx0fVxufVxuIiwiZXhwb3J0IGNsYXNzIEFwcEFjdGl2YXRpb25CcmlkZ2Uge1xuXHRjb25zdHJ1Y3RvcihvcmNoKSB7XG5cdFx0dGhpcy5vcmNoID0gb3JjaDtcblx0fVxuXG5cdGFzeW5jIGFwcEFkZGVkKGFwcCkge1xuXHRcdGF3YWl0IHRoaXMub3JjaC5nZXROb3RpZmllcigpLmFwcEFkZGVkKGFwcC5nZXRJRCgpKTtcblx0fVxuXG5cdGFzeW5jIGFwcFVwZGF0ZWQoYXBwKSB7XG5cdFx0YXdhaXQgdGhpcy5vcmNoLmdldE5vdGlmaWVyKCkuYXBwVXBkYXRlZChhcHAuZ2V0SUQoKSk7XG5cdH1cblxuXHRhc3luYyBhcHBSZW1vdmVkKGFwcCkge1xuXHRcdGF3YWl0IHRoaXMub3JjaC5nZXROb3RpZmllcigpLmFwcFJlbW92ZWQoYXBwLmdldElEKCkpO1xuXHR9XG5cblx0YXN5bmMgYXBwU3RhdHVzQ2hhbmdlZChhcHAsIHN0YXR1cykge1xuXHRcdGF3YWl0IHRoaXMub3JjaC5nZXROb3RpZmllcigpLmFwcFN0YXR1c1VwZGF0ZWQoYXBwLmdldElEKCksIHN0YXR1cyk7XG5cdH1cbn1cbiIsImltcG9ydCB7IEFwcEJyaWRnZXMgfSBmcm9tICdAcm9ja2V0LmNoYXQvYXBwcy1lbmdpbmUvc2VydmVyL2JyaWRnZXMnO1xuXG5pbXBvcnQgeyBBcHBBY3RpdmF0aW9uQnJpZGdlIH0gZnJvbSAnLi9hY3RpdmF0aW9uJztcbmltcG9ydCB7IEFwcERldGFpbENoYW5nZXNCcmlkZ2UgfSBmcm9tICcuL2RldGFpbHMnO1xuaW1wb3J0IHsgQXBwQ29tbWFuZHNCcmlkZ2UgfSBmcm9tICcuL2NvbW1hbmRzJztcbmltcG9ydCB7IEFwcEVudmlyb25tZW50YWxWYXJpYWJsZUJyaWRnZSB9IGZyb20gJy4vZW52aXJvbm1lbnRhbCc7XG5pbXBvcnQgeyBBcHBIdHRwQnJpZGdlIH0gZnJvbSAnLi9odHRwJztcbmltcG9ydCB7IEFwcExpc3RlbmVyQnJpZGdlIH0gZnJvbSAnLi9saXN0ZW5lcnMnO1xuaW1wb3J0IHsgQXBwTWVzc2FnZUJyaWRnZSB9IGZyb20gJy4vbWVzc2FnZXMnO1xuaW1wb3J0IHsgQXBwUGVyc2lzdGVuY2VCcmlkZ2UgfSBmcm9tICcuL3BlcnNpc3RlbmNlJztcbmltcG9ydCB7IEFwcFJvb21CcmlkZ2UgfSBmcm9tICcuL3Jvb21zJztcbmltcG9ydCB7IEFwcFNldHRpbmdCcmlkZ2UgfSBmcm9tICcuL3NldHRpbmdzJztcbmltcG9ydCB7IEFwcFVzZXJCcmlkZ2UgfSBmcm9tICcuL3VzZXJzJztcblxuZXhwb3J0IGNsYXNzIFJlYWxBcHBCcmlkZ2VzIGV4dGVuZHMgQXBwQnJpZGdlcyB7XG5cdGNvbnN0cnVjdG9yKG9yY2gpIHtcblx0XHRzdXBlcigpO1xuXG5cdFx0dGhpcy5fYWN0QnJpZGdlID0gbmV3IEFwcEFjdGl2YXRpb25CcmlkZ2Uob3JjaCk7XG5cdFx0dGhpcy5fY21kQnJpZGdlID0gbmV3IEFwcENvbW1hbmRzQnJpZGdlKG9yY2gpO1xuXHRcdHRoaXMuX2RldEJyaWRnZSA9IG5ldyBBcHBEZXRhaWxDaGFuZ2VzQnJpZGdlKG9yY2gpO1xuXHRcdHRoaXMuX2VudkJyaWRnZSA9IG5ldyBBcHBFbnZpcm9ubWVudGFsVmFyaWFibGVCcmlkZ2Uob3JjaCk7XG5cdFx0dGhpcy5faHR0cEJyaWRnZSA9IG5ldyBBcHBIdHRwQnJpZGdlKCk7XG5cdFx0dGhpcy5fbGlzbkJyaWRnZSA9IG5ldyBBcHBMaXN0ZW5lckJyaWRnZShvcmNoKTtcblx0XHR0aGlzLl9tc2dCcmlkZ2UgPSBuZXcgQXBwTWVzc2FnZUJyaWRnZShvcmNoKTtcblx0XHR0aGlzLl9wZXJzaXN0QnJpZGdlID0gbmV3IEFwcFBlcnNpc3RlbmNlQnJpZGdlKG9yY2gpO1xuXHRcdHRoaXMuX3Jvb21CcmlkZ2UgPSBuZXcgQXBwUm9vbUJyaWRnZShvcmNoKTtcblx0XHR0aGlzLl9zZXRzQnJpZGdlID0gbmV3IEFwcFNldHRpbmdCcmlkZ2Uob3JjaCk7XG5cdFx0dGhpcy5fdXNlckJyaWRnZSA9IG5ldyBBcHBVc2VyQnJpZGdlKG9yY2gpO1xuXHR9XG5cblx0Z2V0Q29tbWFuZEJyaWRnZSgpIHtcblx0XHRyZXR1cm4gdGhpcy5fY21kQnJpZGdlO1xuXHR9XG5cblx0Z2V0RW52aXJvbm1lbnRhbFZhcmlhYmxlQnJpZGdlKCkge1xuXHRcdHJldHVybiB0aGlzLl9lbnZCcmlkZ2U7XG5cdH1cblxuXHRnZXRIdHRwQnJpZGdlKCkge1xuXHRcdHJldHVybiB0aGlzLl9odHRwQnJpZGdlO1xuXHR9XG5cblx0Z2V0TGlzdGVuZXJCcmlkZ2UoKSB7XG5cdFx0cmV0dXJuIHRoaXMuX2xpc25CcmlkZ2U7XG5cdH1cblxuXHRnZXRNZXNzYWdlQnJpZGdlKCkge1xuXHRcdHJldHVybiB0aGlzLl9tc2dCcmlkZ2U7XG5cdH1cblxuXHRnZXRQZXJzaXN0ZW5jZUJyaWRnZSgpIHtcblx0XHRyZXR1cm4gdGhpcy5fcGVyc2lzdEJyaWRnZTtcblx0fVxuXG5cdGdldEFwcEFjdGl2YXRpb25CcmlkZ2UoKSB7XG5cdFx0cmV0dXJuIHRoaXMuX2FjdEJyaWRnZTtcblx0fVxuXG5cdGdldEFwcERldGFpbENoYW5nZXNCcmlkZ2UoKSB7XG5cdFx0cmV0dXJuIHRoaXMuX2RldEJyaWRnZTtcblx0fVxuXG5cdGdldFJvb21CcmlkZ2UoKSB7XG5cdFx0cmV0dXJuIHRoaXMuX3Jvb21CcmlkZ2U7XG5cdH1cblxuXHRnZXRTZXJ2ZXJTZXR0aW5nQnJpZGdlKCkge1xuXHRcdHJldHVybiB0aGlzLl9zZXRzQnJpZGdlO1xuXHR9XG5cblx0Z2V0VXNlckJyaWRnZSgpIHtcblx0XHRyZXR1cm4gdGhpcy5fdXNlckJyaWRnZTtcblx0fVxufVxuIiwiaW1wb3J0IHsgU2xhc2hDb21tYW5kQ29udGV4dCB9IGZyb20gJ0Byb2NrZXQuY2hhdC9hcHBzLXRzLWRlZmluaXRpb24vc2xhc2hjb21tYW5kcyc7XG5cbmV4cG9ydCBjbGFzcyBBcHBDb21tYW5kc0JyaWRnZSB7XG5cdGNvbnN0cnVjdG9yKG9yY2gpIHtcblx0XHR0aGlzLm9yY2ggPSBvcmNoO1xuXHRcdHRoaXMuZGlzYWJsZWRDb21tYW5kcyA9IG5ldyBNYXAoKTtcblx0fVxuXG5cdGRvZXNDb21tYW5kRXhpc3QoY29tbWFuZCwgYXBwSWQpIHtcblx0XHRjb25zb2xlLmxvZyhgVGhlIEFwcCAkeyBhcHBJZCB9IGlzIGNoZWNraW5nIGlmIFwiJHsgY29tbWFuZCB9XCIgY29tbWFuZCBleGlzdHMuYCk7XG5cblx0XHRpZiAodHlwZW9mIGNvbW1hbmQgIT09ICdzdHJpbmcnIHx8IGNvbW1hbmQubGVuZ3RoID09PSAwKSB7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXG5cdFx0Y29uc3QgY21kID0gY29tbWFuZC50b0xvd2VyQ2FzZSgpO1xuXHRcdHJldHVybiB0eXBlb2YgUm9ja2V0Q2hhdC5zbGFzaENvbW1hbmRzLmNvbW1hbmRzW2NtZF0gPT09ICdvYmplY3QnIHx8IHRoaXMuZGlzYWJsZWRDb21tYW5kcy5oYXMoY21kKTtcblx0fVxuXG5cdGVuYWJsZUNvbW1hbmQoY29tbWFuZCwgYXBwSWQpIHtcblx0XHRjb25zb2xlLmxvZyhgVGhlIEFwcCAkeyBhcHBJZCB9IGlzIGF0dGVtcHRpbmcgdG8gZW5hYmxlIHRoZSBjb21tYW5kOiBcIiR7IGNvbW1hbmQgfVwiYCk7XG5cblx0XHRpZiAodHlwZW9mIGNvbW1hbmQgIT09ICdzdHJpbmcnIHx8IGNvbW1hbmQudHJpbSgpLmxlbmd0aCA9PT0gMCkge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGNvbW1hbmQgcGFyYW1ldGVyIHByb3ZpZGVkLCBtdXN0IGJlIGEgc3RyaW5nLicpO1xuXHRcdH1cblxuXHRcdGNvbnN0IGNtZCA9IGNvbW1hbmQudG9Mb3dlckNhc2UoKTtcblx0XHRpZiAoIXRoaXMuZGlzYWJsZWRDb21tYW5kcy5oYXMoY21kKSkge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKGBUaGUgY29tbWFuZCBpcyBub3QgY3VycmVudGx5IGRpc2FibGVkOiBcIiR7IGNtZCB9XCJgKTtcblx0XHR9XG5cblx0XHRSb2NrZXRDaGF0LnNsYXNoQ29tbWFuZHMuY29tbWFuZHNbY21kXSA9IHRoaXMuZGlzYWJsZWRDb21tYW5kcy5nZXQoY21kKTtcblx0XHR0aGlzLmRpc2FibGVkQ29tbWFuZHMuZGVsZXRlKGNtZCk7XG5cblx0XHR0aGlzLm9yY2guZ2V0Tm90aWZpZXIoKS5jb21tYW5kVXBkYXRlZChjbWQpO1xuXHR9XG5cblx0ZGlzYWJsZUNvbW1hbmQoY29tbWFuZCwgYXBwSWQpIHtcblx0XHRjb25zb2xlLmxvZyhgVGhlIEFwcCAkeyBhcHBJZCB9IGlzIGF0dGVtcHRpbmcgdG8gZGlzYWJsZSB0aGUgY29tbWFuZDogXCIkeyBjb21tYW5kIH1cImApO1xuXG5cdFx0aWYgKHR5cGVvZiBjb21tYW5kICE9PSAnc3RyaW5nJyB8fCBjb21tYW5kLnRyaW0oKS5sZW5ndGggPT09IDApIHtcblx0XHRcdHRocm93IG5ldyBFcnJvcignSW52YWxpZCBjb21tYW5kIHBhcmFtZXRlciBwcm92aWRlZCwgbXVzdCBiZSBhIHN0cmluZy4nKTtcblx0XHR9XG5cblx0XHRjb25zdCBjbWQgPSBjb21tYW5kLnRvTG93ZXJDYXNlKCk7XG5cdFx0aWYgKHRoaXMuZGlzYWJsZWRDb21tYW5kcy5oYXMoY21kKSkge1xuXHRcdFx0Ly8gVGhlIGNvbW1hbmQgaXMgYWxyZWFkeSBkaXNhYmxlZCwgbm8gbmVlZCB0byBkaXNhYmxlIGl0IHlldCBhZ2FpblxuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGlmICh0eXBlb2YgUm9ja2V0Q2hhdC5zbGFzaENvbW1hbmRzLmNvbW1hbmRzW2NtZF0gPT09ICd1bmRlZmluZWQnKSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoYENvbW1hbmQgZG9lcyBub3QgZXhpc3QgaW4gdGhlIHN5c3RlbSBjdXJyZW50bHk6IFwiJHsgY21kIH1cImApO1xuXHRcdH1cblxuXHRcdHRoaXMuZGlzYWJsZWRDb21tYW5kcy5zZXQoY21kLCBSb2NrZXRDaGF0LnNsYXNoQ29tbWFuZHMuY29tbWFuZHNbY21kXSk7XG5cdFx0ZGVsZXRlIFJvY2tldENoYXQuc2xhc2hDb21tYW5kcy5jb21tYW5kc1tjbWRdO1xuXG5cdFx0dGhpcy5vcmNoLmdldE5vdGlmaWVyKCkuY29tbWFuZERpc2FibGVkKGNtZCk7XG5cdH1cblxuXHQvLyBjb21tYW5kOiB7IGNvbW1hbmQsIHBhcmFtc0V4YW1wbGUsIGkxOG5EZXNjcmlwdGlvbiwgZXhlY3V0b3I6IGZ1bmN0aW9uIH1cblx0bW9kaWZ5Q29tbWFuZChjb21tYW5kLCBhcHBJZCkge1xuXHRcdGNvbnNvbGUubG9nKGBUaGUgQXBwICR7IGFwcElkIH0gaXMgYXR0ZW1wdGluZyB0byBtb2RpZnkgdGhlIGNvbW1hbmQ6IFwiJHsgY29tbWFuZCB9XCJgKTtcblxuXHRcdHRoaXMuX3ZlcmlmeUNvbW1hbmQoY29tbWFuZCk7XG5cblx0XHRjb25zdCBjbWQgPSBjb21tYW5kLnRvTG93ZXJDYXNlKCk7XG5cdFx0aWYgKHR5cGVvZiBSb2NrZXRDaGF0LnNsYXNoQ29tbWFuZHMuY29tbWFuZHNbY21kXSA9PT0gJ3VuZGVmaW5lZCcpIHtcblx0XHRcdHRocm93IG5ldyBFcnJvcihgQ29tbWFuZCBkb2VzIG5vdCBleGlzdCBpbiB0aGUgc3lzdGVtIGN1cnJlbnRseSAob3IgaXQgaXMgZGlzYWJsZWQpOiBcIiR7IGNtZCB9XCJgKTtcblx0XHR9XG5cblx0XHRjb25zdCBpdGVtID0gUm9ja2V0Q2hhdC5zbGFzaENvbW1hbmRzLmNvbW1hbmRzW2NtZF07XG5cdFx0aXRlbS5wYXJhbXMgPSBjb21tYW5kLnBhcmFtc0V4YW1wbGUgPyBjb21tYW5kLnBhcmFtc0V4YW1wbGUgOiBpdGVtLnBhcmFtcztcblx0XHRpdGVtLmRlc2NyaXB0aW9uID0gY29tbWFuZC5pMThuRGVzY3JpcHRpb24gPyBjb21tYW5kLmkxOG5EZXNjcmlwdGlvbiA6IGl0ZW0ucGFyYW1zO1xuXHRcdGl0ZW0uY2FsbGJhY2sgPSB0aGlzLl9hcHBDb21tYW5kRXhlY3V0b3IuYmluZCh0aGlzKTtcblxuXHRcdFJvY2tldENoYXQuc2xhc2hDb21tYW5kcy5jb21tYW5kc1tjbWRdID0gaXRlbTtcblx0XHR0aGlzLm9yY2guZ2V0Tm90aWZpZXIoKS5jb21tYW5kVXBkYXRlZChjbWQpO1xuXHR9XG5cblx0cmVnaXN0ZXJDb21tYW5kKGNvbW1hbmQsIGFwcElkKSB7XG5cdFx0Y29uc29sZS5sb2coYFRoZSBBcHAgJHsgYXBwSWQgfSBpcyByZWdpc3RlcmluZyB0aGUgY29tbWFuZDogXCIkeyBjb21tYW5kLmNvbW1hbmQgfVwiYCk7XG5cblx0XHR0aGlzLl92ZXJpZnlDb21tYW5kKGNvbW1hbmQpO1xuXG5cdFx0Y29uc3QgaXRlbSA9IHtcblx0XHRcdGNvbW1hbmQ6IGNvbW1hbmQuY29tbWFuZC50b0xvd2VyQ2FzZSgpLFxuXHRcdFx0cGFyYW1zOiBjb21tYW5kLnBhcmFtc0V4YW1wbGUsXG5cdFx0XHRkZXNjcmlwdGlvbjogY29tbWFuZC5pMThuRGVzY3JpcHRpb24sXG5cdFx0XHRjYWxsYmFjazogdGhpcy5fYXBwQ29tbWFuZEV4ZWN1dG9yLmJpbmQodGhpcylcblx0XHR9O1xuXG5cdFx0Um9ja2V0Q2hhdC5zbGFzaENvbW1hbmRzLmNvbW1hbmRzW2NvbW1hbmQuY29tbWFuZC50b0xvd2VyQ2FzZSgpXSA9IGl0ZW07XG5cdFx0dGhpcy5vcmNoLmdldE5vdGlmaWVyKCkuY29tbWFuZEFkZGVkKGNvbW1hbmQuY29tbWFuZC50b0xvd2VyQ2FzZSgpKTtcblx0fVxuXG5cdHVucmVnaXN0ZXJDb21tYW5kKGNvbW1hbmQsIGFwcElkKSB7XG5cdFx0Y29uc29sZS5sb2coYFRoZSBBcHAgJHsgYXBwSWQgfSBpcyB1bnJlZ2lzdGVyaW5nIHRoZSBjb21tYW5kOiBcIiR7IGNvbW1hbmQgfVwiYCk7XG5cblx0XHRpZiAodHlwZW9mIGNvbW1hbmQgIT09ICdzdHJpbmcnIHx8IGNvbW1hbmQudHJpbSgpLmxlbmd0aCA9PT0gMCkge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGNvbW1hbmQgcGFyYW1ldGVyIHByb3ZpZGVkLCBtdXN0IGJlIGEgc3RyaW5nLicpO1xuXHRcdH1cblxuXHRcdGNvbnN0IGNtZCA9IGNvbW1hbmQudG9Mb3dlckNhc2UoKTtcblx0XHR0aGlzLmRpc2FibGVkQ29tbWFuZHMuZGVsZXRlKGNtZCk7XG5cdFx0ZGVsZXRlIFJvY2tldENoYXQuc2xhc2hDb21tYW5kcy5jb21tYW5kc1tjbWRdO1xuXG5cdFx0dGhpcy5vcmNoLmdldE5vdGlmaWVyKCkuY29tbWFuZFJlbW92ZWQoY21kKTtcblx0fVxuXG5cdF92ZXJpZnlDb21tYW5kKGNvbW1hbmQpIHtcblx0XHRpZiAodHlwZW9mIGNvbW1hbmQgIT09ICdvYmplY3QnKSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgU2xhc2ggQ29tbWFuZCBwYXJhbWV0ZXIgcHJvdmlkZWQsIGl0IG11c3QgYmUgYSB2YWxpZCBJU2xhc2hDb21tYW5kIG9iamVjdC4nKTtcblx0XHR9XG5cblx0XHRpZiAodHlwZW9mIGNvbW1hbmQuY29tbWFuZCAhPT0gJ3N0cmluZycpIHtcblx0XHRcdHRocm93IG5ldyBFcnJvcignSW52YWxpZCBTbGFzaCBDb21tYW5kIHBhcmFtZXRlciBwcm92aWRlZCwgaXQgbXVzdCBiZSBhIHZhbGlkIElTbGFzaENvbW1hbmQgb2JqZWN0LicpO1xuXHRcdH1cblxuXHRcdGlmIChjb21tYW5kLnBhcmFtc0V4YW1wbGUgJiYgdHlwZW9mIGNvbW1hbmQucGFyYW1zRXhhbXBsZSAhPT0gJ3N0cmluZycpIHtcblx0XHRcdHRocm93IG5ldyBFcnJvcignSW52YWxpZCBTbGFzaCBDb21tYW5kIHBhcmFtZXRlciBwcm92aWRlZCwgaXQgbXVzdCBiZSBhIHZhbGlkIElTbGFzaENvbW1hbmQgb2JqZWN0LicpO1xuXHRcdH1cblxuXHRcdGlmIChjb21tYW5kLmkxOG5EZXNjcmlwdGlvbiAmJiB0eXBlb2YgY29tbWFuZC5pMThuRGVzY3JpcHRpb24gIT09ICdzdHJpbmcnKSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgU2xhc2ggQ29tbWFuZCBwYXJhbWV0ZXIgcHJvdmlkZWQsIGl0IG11c3QgYmUgYSB2YWxpZCBJU2xhc2hDb21tYW5kIG9iamVjdC4nKTtcblx0XHR9XG5cblx0XHRpZiAodHlwZW9mIGNvbW1hbmQuZXhlY3V0b3IgIT09ICdmdW5jdGlvbicpIHtcblx0XHRcdHRocm93IG5ldyBFcnJvcignSW52YWxpZCBTbGFzaCBDb21tYW5kIHBhcmFtZXRlciBwcm92aWRlZCwgaXQgbXVzdCBiZSBhIHZhbGlkIElTbGFzaENvbW1hbmQgb2JqZWN0LicpO1xuXHRcdH1cblx0fVxuXG5cdF9hcHBDb21tYW5kRXhlY3V0b3IoY29tbWFuZCwgcGFyYW1ldGVycywgbWVzc2FnZSkge1xuXHRcdGNvbnN0IHVzZXIgPSB0aGlzLm9yY2guZ2V0Q29udmVydGVycygpLmdldCgndXNlcnMnKS5jb252ZXJ0QnlJZChNZXRlb3IudXNlcklkKCkpO1xuXHRcdGNvbnN0IHJvb20gPSB0aGlzLm9yY2guZ2V0Q29udmVydGVycygpLmdldCgncm9vbXMnKS5jb252ZXJ0QnlJZChtZXNzYWdlLnJpZCk7XG5cdFx0Y29uc3QgcGFyYW1zID0gcGFyYW1ldGVycy5sZW5ndGggPT09IDAgfHwgcGFyYW1ldGVycyA9PT0gJyAnID8gW10gOiBwYXJhbWV0ZXJzLnNwbGl0KCcgJyk7XG5cblx0XHRjb25zdCBjb250ZXh0ID0gbmV3IFNsYXNoQ29tbWFuZENvbnRleHQoT2JqZWN0LmZyZWV6ZSh1c2VyKSwgT2JqZWN0LmZyZWV6ZShyb29tKSwgT2JqZWN0LmZyZWV6ZShwYXJhbXMpKTtcblx0XHR0aGlzLm9yY2guZ2V0TWFuYWdlcigpLmdldENvbW1hbmRNYW5hZ2VyKCkuZXhlY3V0ZUNvbW1hbmQoY29tbWFuZCwgY29udGV4dCk7XG5cdH1cbn1cbiIsImV4cG9ydCBjbGFzcyBBcHBFbnZpcm9ubWVudGFsVmFyaWFibGVCcmlkZ2Uge1xuXHRjb25zdHJ1Y3RvcihvcmNoKSB7XG5cdFx0dGhpcy5vcmNoID0gb3JjaDtcblx0XHR0aGlzLmFsbG93ZWQgPSBbJ05PREVfRU5WJywgJ1JPT1RfVVJMJywgJ0lOU1RBTkNFX0lQJ107XG5cdH1cblxuXHRhc3luYyBnZXRWYWx1ZUJ5TmFtZShlbnZWYXJOYW1lLCBhcHBJZCkge1xuXHRcdGNvbnNvbGUubG9nKGBUaGUgQXBwICR7IGFwcElkIH0gaXMgZ2V0dGluZyB0aGUgZW52aXJvbm1lbnRhbCB2YXJpYWJsZSB2YWx1ZSAkeyBlbnZWYXJOYW1lIH0uYCk7XG5cblx0XHRpZiAodGhpcy5pc1JlYWRhYmxlKGVudlZhck5hbWUsIGFwcElkKSkge1xuXHRcdFx0cmV0dXJuIHByb2Nlc3MuZW52W2VudlZhck5hbWVdO1xuXHRcdH1cblxuXHRcdHRocm93IG5ldyBFcnJvcihgVGhlIGVudmlyb25tZW50YWwgdmFyaWFibGUgXCIkeyBlbnZWYXJOYW1lIH1cIiBpcyBub3QgcmVhZGFibGUuYCk7XG5cdH1cblxuXHRhc3luYyBpc1JlYWRhYmxlKGVudlZhck5hbWUsIGFwcElkKSB7XG5cdFx0Y29uc29sZS5sb2coYFRoZSBBcHAgJHsgYXBwSWQgfSBpcyBjaGVja2luZyBpZiB0aGUgZW52aXJvbm1lbnRhbCB2YXJpYWJsZSBpcyByZWFkYWJsZSAkeyBlbnZWYXJOYW1lIH0uYCk7XG5cblx0XHRyZXR1cm4gdGhpcy5hbGxvd2VkLmluY2x1ZGVzKGVudlZhck5hbWUudG9VcHBlckNhc2UoKSk7XG5cdH1cblxuXHRhc3luYyBpc1NldChlbnZWYXJOYW1lLCBhcHBJZCkge1xuXHRcdGNvbnNvbGUubG9nKGBUaGUgQXBwICR7IGFwcElkIH0gaXMgY2hlY2tpbmcgaWYgdGhlIGVudmlyb25tZW50YWwgdmFyaWFibGUgaXMgc2V0ICR7IGVudlZhck5hbWUgfS5gKTtcblxuXHRcdGlmICh0aGlzLmlzUmVhZGFibGUoZW52VmFyTmFtZSwgYXBwSWQpKSB7XG5cdFx0XHRyZXR1cm4gdHlwZW9mIHByb2Nlc3MuZW52W2VudlZhck5hbWVdICE9PSAndW5kZWZpbmVkJztcblx0XHR9XG5cblx0XHR0aHJvdyBuZXcgRXJyb3IoYFRoZSBlbnZpcm9ubWVudGFsIHZhcmlhYmxlIFwiJHsgZW52VmFyTmFtZSB9XCIgaXMgbm90IHJlYWRhYmxlLmApO1xuXHR9XG59XG4iLCJleHBvcnQgY2xhc3MgQXBwTWVzc2FnZUJyaWRnZSB7XG5cdGNvbnN0cnVjdG9yKG9yY2gpIHtcblx0XHR0aGlzLm9yY2ggPSBvcmNoO1xuXHR9XG5cblx0YXN5bmMgY3JlYXRlKG1lc3NhZ2UsIGFwcElkKSB7XG5cdFx0Y29uc29sZS5sb2coYFRoZSBBcHAgJHsgYXBwSWQgfSBpcyBjcmVhdGluZyBhIG5ldyBtZXNzYWdlLmApO1xuXG5cdFx0bGV0IG1zZyA9IHRoaXMub3JjaC5nZXRDb252ZXJ0ZXJzKCkuZ2V0KCdtZXNzYWdlcycpLmNvbnZlcnRBcHBNZXNzYWdlKG1lc3NhZ2UpO1xuXG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcihtc2cudS5faWQsICgpID0+IHtcblx0XHRcdG1zZyA9IE1ldGVvci5jYWxsKCdzZW5kTWVzc2FnZScsIG1zZyk7XG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gbXNnLl9pZDtcblx0fVxuXG5cdGFzeW5jIGdldEJ5SWQobWVzc2FnZUlkLCBhcHBJZCkge1xuXHRcdGNvbnNvbGUubG9nKGBUaGUgQXBwICR7IGFwcElkIH0gaXMgZ2V0dGluZyB0aGUgbWVzc2FnZTogXCIkeyBtZXNzYWdlSWQgfVwiYCk7XG5cblx0XHRyZXR1cm4gdGhpcy5vcmNoLmdldENvbnZlcnRlcnMoKS5nZXQoJ21lc3NhZ2VzJykuY29udmVydEJ5SWQobWVzc2FnZUlkKTtcblx0fVxuXG5cdGFzeW5jIHVwZGF0ZShtZXNzYWdlLCBhcHBJZCkge1xuXHRcdGNvbnNvbGUubG9nKGBUaGUgQXBwICR7IGFwcElkIH0gaXMgdXBkYXRpbmcgYSBtZXNzYWdlLmApO1xuXG5cdFx0aWYgKCFtZXNzYWdlLmVkaXRvcikge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGVkaXRvciBhc3NpZ25lZCB0byB0aGUgbWVzc2FnZSBmb3IgdGhlIHVwZGF0ZS4nKTtcblx0XHR9XG5cblx0XHRpZiAoIW1lc3NhZ2UuaWQgfHwgIVJvY2tldENoYXQubW9kZWxzLk1lc3NhZ2VzLmZpbmRPbmVCeUlkKG1lc3NhZ2UuaWQpKSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ0EgbWVzc2FnZSBtdXN0IGV4aXN0IHRvIHVwZGF0ZS4nKTtcblx0XHR9XG5cblx0XHRjb25zdCBtc2cgPSB0aGlzLm9yY2guZ2V0Q29udmVydGVycygpLmdldCgnbWVzc2FnZXMnKS5jb252ZXJ0QXBwTWVzc2FnZShtZXNzYWdlKTtcblx0XHRjb25zdCBlZGl0b3IgPSBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kT25lQnlJZChtZXNzYWdlLmVkaXRvci5pZCk7XG5cblx0XHRSb2NrZXRDaGF0LnVwZGF0ZU1lc3NhZ2UobXNnLCBlZGl0b3IpO1xuXHR9XG5cblx0YXN5bmMgbm90aWZ5VXNlcih1c2VyLCBtZXNzYWdlLCBhcHBJZCkge1xuXHRcdGNvbnNvbGUubG9nKGBUaGUgQXBwICR7IGFwcElkIH0gaXMgbm90aWZ5aW5nIGEgdXNlci5gKTtcblxuXHRcdGNvbnN0IG1zZyA9IHRoaXMub3JjaC5nZXRDb252ZXJ0ZXJzKCkuZ2V0KCdtZXNzYWdlcycpLmNvbnZlcnRBcHBNZXNzYWdlKG1lc3NhZ2UpO1xuXG5cdFx0Um9ja2V0Q2hhdC5Ob3RpZmljYXRpb25zLm5vdGlmeVVzZXIodXNlci5pZCwgJ21lc3NhZ2UnLCBPYmplY3QuYXNzaWduKG1zZywge1xuXHRcdFx0X2lkOiBSYW5kb20uaWQoKSxcblx0XHRcdHRzOiBuZXcgRGF0ZSgpLFxuXHRcdFx0dTogdW5kZWZpbmVkLFxuXHRcdFx0ZWRpdG9yOiB1bmRlZmluZWRcblx0XHR9KSk7XG5cdH1cblxuXHRhc3luYyBub3RpZnlSb29tKHJvb20sIG1lc3NhZ2UsIGFwcElkKSB7XG5cdFx0Y29uc29sZS5sb2coYFRoZSBBcHAgJHsgYXBwSWQgfSBpcyBub3RpZnlpbmcgYSByb29tJ3MgdXNlcnMuYCk7XG5cblx0XHRpZiAocm9vbSAmJiByb29tLnVzZXJuYW1lcyAmJiBBcnJheS5pc0FycmF5KHJvb20udXNlcm5hbWVzKSkge1xuXHRcdFx0Y29uc3QgbXNnID0gdGhpcy5vcmNoLmdldENvbnZlcnRlcnMoKS5nZXQoJ21lc3NhZ2VzJykuY29udmVydEFwcE1lc3NhZ2UobWVzc2FnZSk7XG5cdFx0XHRjb25zdCBybXNnID0gT2JqZWN0LmFzc2lnbihtc2csIHtcblx0XHRcdFx0X2lkOiBSYW5kb20uaWQoKSxcblx0XHRcdFx0cmlkOiByb29tLmlkLFxuXHRcdFx0XHR0czogbmV3IERhdGUoKSxcblx0XHRcdFx0dTogdW5kZWZpbmVkLFxuXHRcdFx0XHRlZGl0b3I6IHVuZGVmaW5lZFxuXHRcdFx0fSk7XG5cblx0XHRcdHJvb20udXNlcm5hbWVzLmZvckVhY2goKHUpID0+IHtcblx0XHRcdFx0Y29uc3QgdXNlciA9IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmVCeVVzZXJuYW1lKHUpO1xuXHRcdFx0XHRpZiAodXNlcikge1xuXHRcdFx0XHRcdFJvY2tldENoYXQuTm90aWZpY2F0aW9ucy5ub3RpZnlVc2VyKHVzZXIuX2lkLCAnbWVzc2FnZScsIHJtc2cpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9XG5cdH1cbn1cbiIsImV4cG9ydCBjbGFzcyBBcHBQZXJzaXN0ZW5jZUJyaWRnZSB7XG5cdGNvbnN0cnVjdG9yKG9yY2gpIHtcblx0XHR0aGlzLm9yY2ggPSBvcmNoO1xuXHR9XG5cblx0YXN5bmMgcHVyZ2UoYXBwSWQpIHtcblx0XHRjb25zb2xlLmxvZyhgVGhlIEFwcCdzIHBlcnNpc3RlbnQgc3RvcmFnZSBpcyBiZWluZyBwdXJnZWQ6ICR7IGFwcElkIH1gKTtcblxuXHRcdHRoaXMub3JjaC5nZXRQZXJzaXN0ZW5jZU1vZGVsKCkucmVtb3ZlKHsgYXBwSWQgfSk7XG5cdH1cblxuXHRhc3luYyBjcmVhdGUoZGF0YSwgYXBwSWQpIHtcblx0XHRjb25zb2xlLmxvZyhgVGhlIEFwcCAkeyBhcHBJZCB9IGlzIHN0b3JpbmcgYSBuZXcgb2JqZWN0IGluIHRoZWlyIHBlcnNpc3RlbmNlLmAsIGRhdGEpO1xuXG5cdFx0aWYgKHR5cGVvZiBkYXRhICE9PSAnb2JqZWN0Jykge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKCdBdHRlbXB0ZWQgdG8gc3RvcmUgYW4gaW52YWxpZCBkYXRhIHR5cGUsIGl0IG11c3QgYmUgYW4gb2JqZWN0LicpO1xuXHRcdH1cblxuXHRcdHJldHVybiB0aGlzLm9yY2guZ2V0UGVyc2lzdGVuY2VNb2RlbCgpLmluc2VydCh7IGFwcElkLCBkYXRhIH0pO1xuXHR9XG5cblx0YXN5bmMgY3JlYXRlV2l0aEFzc29jaWF0aW9ucyhkYXRhLCBhc3NvY2lhdGlvbnMsIGFwcElkKSB7XG5cdFx0Y29uc29sZS5sb2coYFRoZSBBcHAgJHsgYXBwSWQgfSBpcyBzdG9yaW5nIGEgbmV3IG9iamVjdCBpbiB0aGVpciBwZXJzaXN0ZW5jZSB0aGF0IGlzIGFzc29jaWF0ZWQgd2l0aCBzb21lIG1vZGVscy5gLCBkYXRhLCBhc3NvY2lhdGlvbnMpO1xuXG5cdFx0aWYgKHR5cGVvZiBkYXRhICE9PSAnb2JqZWN0Jykge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKCdBdHRlbXB0ZWQgdG8gc3RvcmUgYW4gaW52YWxpZCBkYXRhIHR5cGUsIGl0IG11c3QgYmUgYW4gb2JqZWN0LicpO1xuXHRcdH1cblxuXHRcdHJldHVybiB0aGlzLm9yY2guZ2V0UGVyc2lzdGVuY2VNb2RlbCgpLmluc2VydCh7IGFwcElkLCBhc3NvY2lhdGlvbnMsIGRhdGEgfSk7XG5cdH1cblxuXHRhc3luYyByZWFkQnlJZChpZCwgYXBwSWQpIHtcblx0XHRjb25zb2xlLmxvZyhgVGhlIEFwcCAkeyBhcHBJZCB9IGlzIHJlYWRpbmcgdGhlaXIgZGF0YSBpbiB0aGVpciBwZXJzaXN0ZW5jZSB3aXRoIHRoZSBpZDogXCIkeyBpZCB9XCJgKTtcblxuXHRcdGNvbnN0IHJlY29yZCA9IHRoaXMub3JjaC5nZXRQZXJzaXN0ZW5jZU1vZGVsKCkuZmluZE9uZUJ5SWQoaWQpO1xuXG5cdFx0cmV0dXJuIHJlY29yZC5kYXRhO1xuXHR9XG5cblx0YXN5bmMgcmVhZEJ5QXNzb2NpYXRpb25zKGFzc29jaWF0aW9ucywgYXBwSWQpIHtcblx0XHRjb25zb2xlLmxvZyhgVGhlIEFwcCAkeyBhcHBJZCB9IGlzIHNlYXJjaGluZyBmb3IgcmVjb3JkcyB0aGF0IGFyZSBhc3NvY2lhdGVkIHdpdGggdGhlIGZvbGxvd2luZzpgLCBhc3NvY2lhdGlvbnMpO1xuXG5cdFx0Y29uc3QgcmVjb3JkcyA9IHRoaXMub3JjaC5nZXRQZXJzaXN0ZW5jZU1vZGVsKCkuZmluZCh7XG5cdFx0XHRhcHBJZCxcblx0XHRcdGFzc29jaWF0aW9uczogeyAkYWxsOiBhc3NvY2lhdGlvbnMgfVxuXHRcdH0pLmZldGNoKCk7XG5cblx0XHRyZXR1cm4gQXJyYXkuaXNBcnJheShyZWNvcmRzKSA/IHJlY29yZHMubWFwKChyKSA9PiByLmRhdGEpIDogW107XG5cdH1cblxuXHRhc3luYyByZW1vdmUoaWQsIGFwcElkKSB7XG5cdFx0Y29uc29sZS5sb2coYFRoZSBBcHAgJHsgYXBwSWQgfSBpcyByZW1vdmluZyBvbmUgb2YgdGhlaXIgcmVjb3JkcyBieSB0aGUgaWQ6IFwiJHsgaWQgfVwiYCk7XG5cblx0XHRjb25zdCByZWNvcmQgPSB0aGlzLm9yY2guZ2V0UGVyc2lzdGVuY2VNb2RlbCgpLmZpbmRPbmUoeyBfaWQ6IGlkLCBhcHBJZCB9KTtcblxuXHRcdGlmICghcmVjb3JkKSB7XG5cdFx0XHRyZXR1cm4gdW5kZWZpbmVkO1xuXHRcdH1cblxuXHRcdHRoaXMub3JjaC5nZXRQZXJzaXN0ZW5jZU1vZGVsKCkucmVtb3ZlKHsgX2lkOiBpZCwgYXBwSWQgfSk7XG5cblx0XHRyZXR1cm4gcmVjb3JkLmRhdGE7XG5cdH1cblxuXHRhc3luYyByZW1vdmVCeUFzc29jaWF0aW9ucyhhc3NvY2lhdGlvbnMsIGFwcElkKSB7XG5cdFx0Y29uc29sZS5sb2coYFRoZSBBcHAgJHsgYXBwSWQgfSBpcyByZW1vdmluZyByZWNvcmRzIHdpdGggdGhlIGZvbGxvd2luZyBhc3NvY2lhdGlvbnM6YCwgYXNzb2NpYXRpb25zKTtcblxuXHRcdGNvbnN0IHF1ZXJ5ID0ge1xuXHRcdFx0YXBwSWQsXG5cdFx0XHRhc3NvY2lhdGlvbnM6IHtcblx0XHRcdFx0JGFsbDogYXNzb2NpYXRpb25zXG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdGNvbnN0IHJlY29yZHMgPSB0aGlzLm9yY2guZ2V0UGVyc2lzdGVuY2VNb2RlbCgpLmZpbmQocXVlcnkpLmZldGNoKCk7XG5cblx0XHRpZiAoIXJlY29yZHMpIHtcblx0XHRcdHJldHVybiB1bmRlZmluZWQ7XG5cdFx0fVxuXG5cdFx0dGhpcy5vcmNoLmdldFBlcnNpc3RlbmNlTW9kZWwoKS5yZW1vdmUocXVlcnkpO1xuXG5cdFx0cmV0dXJuIEFycmF5LmlzQXJyYXkocmVjb3JkcykgPyByZWNvcmRzLm1hcCgocikgPT4gci5kYXRhKSA6IFtdO1xuXHR9XG5cblx0YXN5bmMgdXBkYXRlKGlkLCBkYXRhLCB1cHNlcnQsIGFwcElkKSB7XG5cdFx0Y29uc29sZS5sb2coYFRoZSBBcHAgJHsgYXBwSWQgfSBpcyB1cGRhdGluZyB0aGUgcmVjb3JkIFwiJHsgaWQgfVwiIHRvOmAsIGRhdGEpO1xuXG5cdFx0aWYgKHR5cGVvZiBkYXRhICE9PSAnb2JqZWN0Jykge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKCdBdHRlbXB0ZWQgdG8gc3RvcmUgYW4gaW52YWxpZCBkYXRhIHR5cGUsIGl0IG11c3QgYmUgYW4gb2JqZWN0LicpO1xuXHRcdH1cblxuXHRcdHRocm93IG5ldyBFcnJvcignTm90IGltcGxlbWVudGVkLicpO1xuXHR9XG59XG4iLCJpbXBvcnQgeyBSb29tVHlwZSB9IGZyb20gJ0Byb2NrZXQuY2hhdC9hcHBzLXRzLWRlZmluaXRpb24vcm9vbXMnO1xuXG5leHBvcnQgY2xhc3MgQXBwUm9vbUJyaWRnZSB7XG5cdGNvbnN0cnVjdG9yKG9yY2gpIHtcblx0XHR0aGlzLm9yY2ggPSBvcmNoO1xuXHR9XG5cblx0YXN5bmMgY3JlYXRlKHJvb20sIGFwcElkKSB7XG5cdFx0Y29uc29sZS5sb2coYFRoZSBBcHAgJHsgYXBwSWQgfSBpcyBjcmVhdGluZyBhIG5ldyByb29tLmAsIHJvb20pO1xuXG5cdFx0Y29uc3QgcmNSb29tID0gdGhpcy5vcmNoLmdldENvbnZlcnRlcnMoKS5nZXQoJ3Jvb21zJykuY29udmVydEFwcFJvb20ocm9vbSk7XG5cdFx0bGV0IG1ldGhvZDtcblxuXHRcdHN3aXRjaCAocm9vbS50eXBlKSB7XG5cdFx0XHRjYXNlIFJvb21UeXBlLkNIQU5ORUw6XG5cdFx0XHRcdG1ldGhvZCA9ICdjcmVhdGVDaGFubmVsJztcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHRjYXNlIFJvb21UeXBlLlBSSVZBVEVfR1JPVVA6XG5cdFx0XHRcdG1ldGhvZCA9ICdjcmVhdGVQcml2YXRlR3JvdXAnO1xuXHRcdFx0XHRicmVhaztcblx0XHRcdGRlZmF1bHQ6XG5cdFx0XHRcdHRocm93IG5ldyBFcnJvcignT25seSBjaGFubmVscyBhbmQgcHJpdmF0ZSBncm91cHMgY2FuIGJlIGNyZWF0ZWQuJyk7XG5cdFx0fVxuXG5cdFx0bGV0IHJpZDtcblx0XHRNZXRlb3IucnVuQXNVc2VyKHJvb20uY3JlYXRvci5pZCwgKCkgPT4ge1xuXHRcdFx0Y29uc3QgaW5mbyA9IE1ldGVvci5jYWxsKG1ldGhvZCwgcmNSb29tLnVzZXJuYW1lcyk7XG5cdFx0XHRyaWQgPSBpbmZvLnJpZDtcblx0XHR9KTtcblxuXHRcdHJldHVybiByaWQ7XG5cdH1cblxuXHRhc3luYyBnZXRCeUlkKHJvb21JZCwgYXBwSWQpIHtcblx0XHRjb25zb2xlLmxvZyhgVGhlIEFwcCAkeyBhcHBJZCB9IGlzIGdldHRpbmcgdGhlIHJvb21CeUlkOiBcIiR7IHJvb21JZCB9XCJgKTtcblxuXHRcdHJldHVybiB0aGlzLm9yY2guZ2V0Q29udmVydGVycygpLmdldCgncm9vbXMnKS5jb252ZXJ0QnlJZChyb29tSWQpO1xuXHR9XG5cblx0YXN5bmMgZ2V0QnlOYW1lKHJvb21OYW1lLCBhcHBJZCkge1xuXHRcdGNvbnNvbGUubG9nKGBUaGUgQXBwICR7IGFwcElkIH0gaXMgZ2V0dGluZyB0aGUgcm9vbUJ5TmFtZTogXCIkeyByb29tTmFtZSB9XCJgKTtcblxuXHRcdHJldHVybiB0aGlzLm9yY2guZ2V0Q29udmVydGVycygpLmdldCgncm9vbXMnKS5jb252ZXJ0QnlOYW1lKHJvb21OYW1lKTtcblx0fVxuXG5cdGFzeW5jIHVwZGF0ZShyb29tLCBhcHBJZCkge1xuXHRcdGNvbnNvbGUubG9nKGBUaGUgQXBwICR7IGFwcElkIH0gaXMgdXBkYXRpbmcgYSByb29tLmApO1xuXG5cdFx0aWYgKCFyb29tLmlkIHx8IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRPbmVCeUlkKHJvb20uaWQpKSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ0Egcm9vbSBtdXN0IGV4aXN0IHRvIHVwZGF0ZS4nKTtcblx0XHR9XG5cblx0XHRjb25zdCBybSA9IHRoaXMub3JjaC5nZXRDb252ZXJ0ZXJzKCkuZ2V0KCdyb29tcycpLmNvbnZlcnRBcHBSb29tKHJvb20pO1xuXG5cdFx0Um9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMudXBkYXRlKHJtLl9pZCwgcm0pO1xuXHR9XG59XG4iLCJleHBvcnQgY2xhc3MgQXBwU2V0dGluZ0JyaWRnZSB7XG5cdGNvbnN0cnVjdG9yKG9yY2gpIHtcblx0XHR0aGlzLm9yY2ggPSBvcmNoO1xuXHRcdHRoaXMuYWxsb3dlZEdyb3VwcyA9IFtdO1xuXHRcdHRoaXMuZGlzYWxsb3dlZFNldHRpbmdzID0gW1xuXHRcdFx0J0FjY291bnRzX1JlZ2lzdHJhdGlvbkZvcm1fU2VjcmV0VVJMJywgJ0NST1dEX0FQUF9VU0VSTkFNRScsICdDUk9XRF9BUFBfUEFTU1dPUkQnLCAnRGlyZWN0X1JlcGx5X1VzZXJuYW1lJyxcblx0XHRcdCdEaXJlY3RfUmVwbHlfUGFzc3dvcmQnLCAnU01UUF9Vc2VybmFtZScsICdTTVRQX1Bhc3N3b3JkJywgJ0ZpbGVVcGxvYWRfUzNfQVdTQWNjZXNzS2V5SWQnLCAnRmlsZVVwbG9hZF9TM19BV1NTZWNyZXRBY2Nlc3NLZXknLFxuXHRcdFx0J0ZpbGVVcGxvYWRfUzNfQnVja2V0VVJMJywgJ0ZpbGVVcGxvYWRfR29vZ2xlU3RvcmFnZV9CdWNrZXQnLCAnRmlsZVVwbG9hZF9Hb29nbGVTdG9yYWdlX0FjY2Vzc0lkJyxcblx0XHRcdCdGaWxlVXBsb2FkX0dvb2dsZVN0b3JhZ2VfU2VjcmV0JywgJ0dvb2dsZVZpc2lvbl9TZXJ2aWNlQWNjb3VudCcsICdBbGxvd19JbnZhbGlkX1NlbGZTaWduZWRfQ2VydHMnLCAnR29vZ2xlVGFnTWFuYWdlcl9pZCcsXG5cdFx0XHQnQnVnc25hZ19hcGlfa2V5JywgJ0xEQVBfQ0FfQ2VydCcsICdMREFQX1JlamVjdF9VbmF1dGhvcml6ZWQnLCAnTERBUF9Eb21haW5fU2VhcmNoX1VzZXInLCAnTERBUF9Eb21haW5fU2VhcmNoX1Bhc3N3b3JkJyxcblx0XHRcdCdMaXZlY2hhdF9zZWNyZXRfdG9rZW4nLCAnTGl2ZWNoYXRfS25vd2xlZGdlX0FwaWFpX0tleScsICdBdXRvVHJhbnNsYXRlX0dvb2dsZUFQSUtleScsICdNYXBWaWV3X0dNYXBzQVBJS2V5Jyxcblx0XHRcdCdNZXRhX2ZiX2FwcF9pZCcsICdNZXRhX2dvb2dsZS1zaXRlLXZlcmlmaWNhdGlvbicsICdNZXRhX21zdmFsaWRhdGUwMScsICdBY2NvdW50c19PQXV0aF9Eb2xwaGluX3NlY3JldCcsXG5cdFx0XHQnQWNjb3VudHNfT0F1dGhfRHJ1cGFsX3NlY3JldCcsICdBY2NvdW50c19PQXV0aF9GYWNlYm9va19zZWNyZXQnLCAnQWNjb3VudHNfT0F1dGhfR2l0aHViX3NlY3JldCcsICdBUElfR2l0SHViX0VudGVycHJpc2VfVVJMJyxcblx0XHRcdCdBY2NvdW50c19PQXV0aF9HaXRIdWJfRW50ZXJwcmlzZV9zZWNyZXQnLCAnQVBJX0dpdGxhYl9VUkwnLCAnQWNjb3VudHNfT0F1dGhfR2l0bGFiX3NlY3JldCcsICdBY2NvdW50c19PQXV0aF9Hb29nbGVfc2VjcmV0Jyxcblx0XHRcdCdBY2NvdW50c19PQXV0aF9MaW5rZWRpbl9zZWNyZXQnLCAnQWNjb3VudHNfT0F1dGhfTWV0ZW9yX3NlY3JldCcsICdBY2NvdW50c19PQXV0aF9Ud2l0dGVyX3NlY3JldCcsICdBUElfV29yZHByZXNzX1VSTCcsXG5cdFx0XHQnQWNjb3VudHNfT0F1dGhfV29yZHByZXNzX3NlY3JldCcsICdQdXNoX2Fwbl9wYXNzcGhyYXNlJywgJ1B1c2hfYXBuX2tleScsICdQdXNoX2Fwbl9jZXJ0JywgJ1B1c2hfYXBuX2Rldl9wYXNzcGhyYXNlJyxcblx0XHRcdCdQdXNoX2Fwbl9kZXZfa2V5JywgJ1B1c2hfYXBuX2Rldl9jZXJ0JywgJ1B1c2hfZ2NtX2FwaV9rZXknLCAnUHVzaF9nY21fcHJvamVjdF9udW1iZXInLCAnU0FNTF9DdXN0b21fRGVmYXVsdF9jZXJ0Jyxcblx0XHRcdCdTQU1MX0N1c3RvbV9EZWZhdWx0X3ByaXZhdGVfa2V5JywgJ1NsYWNrQnJpZGdlX0FQSVRva2VuJywgJ1NtYXJzaF9FbWFpbCcsICdTTVNfVHdpbGlvX0FjY291bnRfU0lEJywgJ1NNU19Ud2lsaW9fYXV0aFRva2VuJ1xuXHRcdF07XG5cdH1cblxuXHRhc3luYyBnZXRBbGwoYXBwSWQpIHtcblx0XHRjb25zb2xlLmxvZyhgVGhlIEFwcCAkeyBhcHBJZCB9IGlzIGdldHRpbmcgYWxsIHRoZSBzZXR0aW5ncy5gKTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0Lm1vZGVscy5TZXR0aW5ncy5maW5kKHsgX2lkOiB7ICRuaW46IHRoaXMuZGlzYWxsb3dlZFNldHRpbmdzIH0gfSkuZmV0Y2goKS5tYXAoKHMpID0+IHtcblx0XHRcdHRoaXMub3JjaC5nZXRDb252ZXJ0ZXJzKCkuZ2V0KCdzZXR0aW5ncycpLmNvbnZlcnRUb0FwcChzKTtcblx0XHR9KTtcblx0fVxuXG5cdGFzeW5jIGdldE9uZUJ5SWQoaWQsIGFwcElkKSB7XG5cdFx0Y29uc29sZS5sb2coYFRoZSBBcHAgJHsgYXBwSWQgfSBpcyBnZXR0aW5nIHRoZSBzZXR0aW5nIGJ5IGlkICR7IGlkIH0uYCk7XG5cblx0XHRpZiAoIXRoaXMuaXNSZWFkYWJsZUJ5SWQoaWQsIGFwcElkKSkge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKGBUaGUgc2V0dGluZyBcIiR7IGlkIH1cIiBpcyBub3QgcmVhZGFibGUuYCk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRoaXMub3JjaC5nZXRDb252ZXJ0ZXJzKCkuZ2V0KCdzZXR0aW5ncycpLmNvbnZlcnRCeUlkKGlkKTtcblx0fVxuXG5cdGFzeW5jIGhpZGVHcm91cChuYW1lLCBhcHBJZCkge1xuXHRcdGNvbnNvbGUubG9nKGBUaGUgQXBwICR7IGFwcElkIH0gaXMgaGlkZGluZyB0aGUgZ3JvdXAgJHsgbmFtZSB9LmApO1xuXG5cdFx0dGhyb3cgbmV3IEVycm9yKCdNZXRob2Qgbm90IGltcGxlbWVudGVkLicpO1xuXHR9XG5cblx0YXN5bmMgaGlkZVNldHRpbmcoaWQsIGFwcElkKSB7XG5cdFx0Y29uc29sZS5sb2coYFRoZSBBcHAgJHsgYXBwSWQgfSBpcyBoaWRkaW5nIHRoZSBzZXR0aW5nICR7IGlkIH0uYCk7XG5cblx0XHRpZiAoIXRoaXMuaXNSZWFkYWJsZUJ5SWQoaWQsIGFwcElkKSkge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKGBUaGUgc2V0dGluZyBcIiR7IGlkIH1cIiBpcyBub3QgcmVhZGFibGUuYCk7XG5cdFx0fVxuXG5cdFx0dGhyb3cgbmV3IEVycm9yKCdNZXRob2Qgbm90IGltcGxlbWVudGVkLicpO1xuXHR9XG5cblx0YXN5bmMgaXNSZWFkYWJsZUJ5SWQoaWQsIGFwcElkKSB7XG5cdFx0Y29uc29sZS5sb2coYFRoZSBBcHAgJHsgYXBwSWQgfSBpcyBjaGVja2luZyBpZiB0aGV5IGNhbiByZWFkIHRoZSBzZXR0aW5nICR7IGlkIH0uYCk7XG5cblx0XHRyZXR1cm4gIXRoaXMuZGlzYWxsb3dlZFNldHRpbmdzLmluY2x1ZGVzKGlkKTtcblx0fVxuXG5cdGFzeW5jIHVwZGF0ZU9uZShzZXR0aW5nLCBhcHBJZCkge1xuXHRcdGNvbnNvbGUubG9nKGBUaGUgQXBwICR7IGFwcElkIH0gaXMgdXBkYXRpbmcgdGhlIHNldHRpbmcgJHsgc2V0dGluZy5pZCB9IC5gKTtcblxuXHRcdGlmICghdGhpcy5pc1JlYWRhYmxlQnlJZChzZXR0aW5nLmlkLCBhcHBJZCkpIHtcblx0XHRcdHRocm93IG5ldyBFcnJvcihgVGhlIHNldHRpbmcgXCIkeyBzZXR0aW5nLmlkIH1cIiBpcyBub3QgcmVhZGFibGUuYCk7XG5cdFx0fVxuXG5cdFx0dGhyb3cgbmV3IEVycm9yKCdNZXRob2Qgbm90IGltcGxlbWVudGVkLicpO1xuXHR9XG59XG4iLCJleHBvcnQgY2xhc3MgQXBwVXNlckJyaWRnZSB7XG5cdGNvbnN0cnVjdG9yKG9yY2gpIHtcblx0XHR0aGlzLm9yY2ggPSBvcmNoO1xuXHR9XG5cblx0YXN5bmMgZ2V0QnlJZCh1c2VySWQsIGFwcElkKSB7XG5cdFx0Y29uc29sZS5sb2coYFRoZSBBcHAgJHsgYXBwSWQgfSBpcyBnZXR0aW5nIHRoZSB1c2VySWQ6IFwiJHsgdXNlcklkIH1cImApO1xuXG5cdFx0cmV0dXJuIHRoaXMub3JjaC5nZXRDb252ZXJ0ZXJzKCkuZ2V0KCd1c2VycycpLmNvbnZlcnRCeUlkKHVzZXJJZCk7XG5cdH1cblxuXHRhc3luYyBnZXRCeVVzZXJuYW1lKHVzZXJuYW1lLCBhcHBJZCkge1xuXHRcdGNvbnNvbGUubG9nKGBUaGUgQXBwICR7IGFwcElkIH0gaXMgZ2V0dGluZyB0aGUgdXNlcm5hbWU6IFwiJHsgdXNlcm5hbWUgfVwiYCk7XG5cblx0XHRyZXR1cm4gdGhpcy5vcmNoLmdldENvbnZlcnRlcnMoKS5nZXQoJ3VzZXJzJykuY29udmVydEJ5VXNlcm5hbWUodXNlcm5hbWUpO1xuXHR9XG59XG4iLCJpbXBvcnQgeyBSZWFsQXBwQnJpZGdlcyB9IGZyb20gJy4vYnJpZGdlcyc7XG5pbXBvcnQgeyBBcHBBY3RpdmF0aW9uQnJpZGdlIH0gZnJvbSAnLi9hY3RpdmF0aW9uJztcbmltcG9ydCB7IEFwcENvbW1hbmRzQnJpZGdlIH0gZnJvbSAnLi9jb21tYW5kcyc7XG5pbXBvcnQgeyBBcHBFbnZpcm9ubWVudGFsVmFyaWFibGVCcmlkZ2UgfSBmcm9tICcuL2Vudmlyb25tZW50YWwnO1xuaW1wb3J0IHsgQXBwSHR0cEJyaWRnZSB9IGZyb20gJy4vaHR0cCc7XG5pbXBvcnQgeyBBcHBMaXN0ZW5lckJyaWRnZSB9IGZyb20gJy4vbGlzdGVuZXJzJztcbmltcG9ydCB7IEFwcE1lc3NhZ2VCcmlkZ2UgfSBmcm9tICcuL21lc3NhZ2VzJztcbmltcG9ydCB7IEFwcFBlcnNpc3RlbmNlQnJpZGdlIH0gZnJvbSAnLi9wZXJzaXN0ZW5jZSc7XG5pbXBvcnQgeyBBcHBSb29tQnJpZGdlIH0gZnJvbSAnLi9yb29tcyc7XG5pbXBvcnQgeyBBcHBTZXR0aW5nQnJpZGdlIH0gZnJvbSAnLi9zZXR0aW5ncyc7XG5pbXBvcnQgeyBBcHBVc2VyQnJpZGdlIH0gZnJvbSAnLi91c2Vycyc7XG5cbmV4cG9ydCB7XG5cdFJlYWxBcHBCcmlkZ2VzLFxuXHRBcHBBY3RpdmF0aW9uQnJpZGdlLFxuXHRBcHBDb21tYW5kc0JyaWRnZSxcblx0QXBwRW52aXJvbm1lbnRhbFZhcmlhYmxlQnJpZGdlLFxuXHRBcHBIdHRwQnJpZGdlLFxuXHRBcHBMaXN0ZW5lckJyaWRnZSxcblx0QXBwTWVzc2FnZUJyaWRnZSxcblx0QXBwUGVyc2lzdGVuY2VCcmlkZ2UsXG5cdEFwcFJvb21CcmlkZ2UsXG5cdEFwcFNldHRpbmdCcmlkZ2UsXG5cdEFwcFVzZXJCcmlkZ2Vcbn07XG4iLCJleHBvcnQgY2xhc3MgQXBwRGV0YWlsQ2hhbmdlc0JyaWRnZSB7XG5cdGNvbnN0cnVjdG9yKG9yY2gpIHtcblx0XHR0aGlzLm9yY2ggPSBvcmNoO1xuXHR9XG5cblx0b25BcHBTZXR0aW5nc0NoYW5nZShhcHBJZCwgc2V0dGluZykge1xuXHRcdHRyeSB7XG5cdFx0XHR0aGlzLm9yY2guZ2V0Tm90aWZpZXIoKS5hcHBTZXR0aW5nc0NoYW5nZShhcHBJZCwgc2V0dGluZyk7XG5cdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0Y29uc29sZS53YXJuKCdmYWlsZWQgdG8gbm90aWZ5IGFib3V0IHRoZSBzZXR0aW5nIGNoYW5nZS4nLCBhcHBJZCk7XG5cdFx0fVxuXHR9XG59XG4iLCJleHBvcnQgY2xhc3MgQXBwSHR0cEJyaWRnZSB7XG5cdGNhbGwoaW5mbykge1xuXHRcdGlmICghaW5mby5yZXF1ZXN0LmNvbnRlbnQgJiYgdHlwZW9mIGluZm8ucmVxdWVzdC5kYXRhID09PSAnb2JqZWN0Jykge1xuXHRcdFx0aW5mby5yZXF1ZXN0LmNvbnRlbnQgPSBKU09OLnN0cmluZ2lmeShpbmZvLnJlcXVlc3QuZGF0YSk7XG5cdFx0fVxuXG5cdFx0Y29uc29sZS5sb2coYFRoZSBBcHAgJHsgaW5mby5hcHBJZCB9IGlzIHJlcXVlc3RpbmcgZnJvbSB0aGUgb3V0dGVyIHdlYnM6YCwgaW5mbyk7XG5cblx0XHRyZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuXHRcdFx0SFRUUC5jYWxsKGluZm8ubWV0aG9kLCBpbmZvLnVybCwgaW5mby5yZXF1ZXN0LCAoZSwgcmVzdWx0KSA9PiB7XG5cdFx0XHRcdHJldHVybiBlID8gcmVqZWN0KGUucmVzcG9uc2UpIDogcmVzb2x2ZShyZXN1bHQpO1xuXHRcdFx0fSk7XG5cdFx0fSk7XG5cdH1cbn1cbiIsImV4cG9ydCBjbGFzcyBBcHBMaXN0ZW5lckJyaWRnZSB7XG5cdGNvbnN0cnVjdG9yKG9yY2gpIHtcblx0XHR0aGlzLm9yY2ggPSBvcmNoO1xuXHR9XG5cblx0YXN5bmMgbWVzc2FnZUV2ZW50KGludGUsIG1lc3NhZ2UpIHtcblx0XHRjb25zdCBtc2cgPSB0aGlzLm9yY2guZ2V0Q29udmVydGVycygpLmdldCgnbWVzc2FnZXMnKS5jb252ZXJ0TWVzc2FnZShtZXNzYWdlKTtcblx0XHRjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLm9yY2guZ2V0TWFuYWdlcigpLmdldExpc3RlbmVyTWFuYWdlcigpLmV4ZWN1dGVMaXN0ZW5lcihpbnRlLCBtc2cpO1xuXG5cdFx0aWYgKHR5cGVvZiByZXN1bHQgPT09ICdib29sZWFuJykge1xuXHRcdFx0cmV0dXJuIHJlc3VsdDtcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIHRoaXMub3JjaC5nZXRDb252ZXJ0ZXJzKCkuZ2V0KCdtZXNzYWdlcycpLmNvbnZlcnRBcHBNZXNzYWdlKHJlc3VsdCk7XG5cdFx0fVxuXHRcdC8vIHRyeSB7XG5cblx0XHQvLyB9IGNhdGNoIChlKSB7XG5cdFx0Ly8gXHRjb25zb2xlLmxvZyhgJHsgZS5uYW1lIH06ICR7IGUubWVzc2FnZSB9YCk7XG5cdFx0Ly8gXHRjb25zb2xlLmxvZyhlLnN0YWNrKTtcblx0XHQvLyB9XG5cdH1cblxuXHRhc3luYyByb29tRXZlbnQoaW50ZSwgcm9vbSkge1xuXHRcdGNvbnN0IHJtID0gdGhpcy5vcmNoLmdldENvbnZlcnRlcnMoKS5nZXQoJ3Jvb21zJykuY29udmVydFJvb20ocm9vbSk7XG5cdFx0Y29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5vcmNoLmdldE1hbmFnZXIoKS5nZXRMaXN0ZW5lck1hbmFnZXIoKS5leGVjdXRlTGlzdGVuZXIoaW50ZSwgcm0pO1xuXG5cdFx0aWYgKHR5cGVvZiByZXN1bHQgPT09ICdib29sZWFuJykge1xuXHRcdFx0cmV0dXJuIHJlc3VsdDtcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIHRoaXMub3JjaC5nZXRDb252ZXJ0ZXJzKCkuZ2V0KCdyb29tcycpLmNvbnZlcnRBcHBSb29tKHJlc3VsdCk7XG5cdFx0fVxuXHRcdC8vIHRyeSB7XG5cblx0XHQvLyB9IGNhdGNoIChlKSB7XG5cdFx0Ly8gXHRjb25zb2xlLmxvZyhgJHsgZS5uYW1lIH06ICR7IGUubWVzc2FnZSB9YCk7XG5cdFx0Ly8gXHRjb25zb2xlLmxvZyhlLnN0YWNrKTtcblx0XHQvLyB9XG5cdH1cbn1cbiIsImV4cG9ydCBjbGFzcyBBcHBNZXRob2RzIHtcblx0Y29uc3RydWN0b3IobWFuYWdlcikge1xuXHRcdHRoaXMuX21hbmFnZXIgPSBtYW5hZ2VyO1xuXG5cdFx0dGhpcy5fYWRkTWV0aG9kcygpO1xuXHR9XG5cblx0aXNFbmFibGVkKCkge1xuXHRcdHJldHVybiB0eXBlb2YgdGhpcy5fbWFuYWdlciAhPT0gJ3VuZGVmaW5lZCc7XG5cdH1cblxuXHRpc0xvYWRlZCgpIHtcblx0XHRyZXR1cm4gdHlwZW9mIHRoaXMuX21hbmFnZXIgIT09ICd1bmRlZmluZWQnICYmIHRoaXMubWFuYWdlci5hcmVBcHBzTG9hZGVkKCk7XG5cdH1cblxuXHRfYWRkTWV0aG9kcygpIHtcblx0XHRjb25zdCBpbnN0YW5jZSA9IHRoaXM7XG5cblx0XHRNZXRlb3IubWV0aG9kcyh7XG5cdFx0XHQnYXBwcy9pcy1lbmFibGVkJygpIHtcblx0XHRcdFx0cmV0dXJuIGluc3RhbmNlLmlzRW5hYmxlZCgpO1xuXHRcdFx0fSxcblxuXHRcdFx0J2FwcHMvaXMtbG9hZGVkJygpIHtcblx0XHRcdFx0cmV0dXJuIGluc3RhbmNlLmlzTG9hZGVkKCk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH1cbn1cbiIsImV4cG9ydCBjbGFzcyBBcHBzUmVzdEFwaSB7XG5cdGNvbnN0cnVjdG9yKG9yY2gsIG1hbmFnZXIpIHtcblx0XHR0aGlzLl9vcmNoID0gb3JjaDtcblx0XHR0aGlzLl9tYW5hZ2VyID0gbWFuYWdlcjtcblx0XHR0aGlzLmFwaSA9IG5ldyBSb2NrZXRDaGF0LkFQSS5BcGlDbGFzcyh7XG5cdFx0XHR2ZXJzaW9uOiAnYXBwcycsXG5cdFx0XHR1c2VEZWZhdWx0QXV0aDogdHJ1ZSxcblx0XHRcdHByZXR0eUpzb246IGZhbHNlLFxuXHRcdFx0ZW5hYmxlQ29yczogZmFsc2UsXG5cdFx0XHRhdXRoOiBSb2NrZXRDaGF0LkFQSS5nZXRVc2VyQXV0aCgpXG5cdFx0fSk7XG5cblx0XHR0aGlzLmFkZE1hbmFnZW1lbnRSb3V0ZXMoKTtcblx0fVxuXG5cdF9oYW5kbGVGaWxlKHJlcXVlc3QsIGZpbGVGaWVsZCkge1xuXHRcdGNvbnN0IEJ1c2JveSA9IE5wbS5yZXF1aXJlKCdidXNib3knKTtcblx0XHRjb25zdCBidXNib3kgPSBuZXcgQnVzYm95KHsgaGVhZGVyczogcmVxdWVzdC5oZWFkZXJzIH0pO1xuXG5cdFx0cmV0dXJuIE1ldGVvci53cmFwQXN5bmMoKGNhbGxiYWNrKSA9PiB7XG5cdFx0XHRidXNib3kub24oJ2ZpbGUnLCBNZXRlb3IuYmluZEVudmlyb25tZW50KChmaWVsZG5hbWUsIGZpbGUpID0+IHtcblx0XHRcdFx0aWYgKGZpZWxkbmFtZSAhPT0gZmlsZUZpZWxkKSB7XG5cdFx0XHRcdFx0cmV0dXJuIGNhbGxiYWNrKG5ldyBNZXRlb3IuRXJyb3IoJ2ludmFsaWQtZmllbGQnLCBgRXhwZWN0ZWQgdGhlIGZpZWxkIFwiJHsgZmlsZUZpZWxkIH1cIiBidXQgZ290IFwiJHsgZmllbGRuYW1lIH1cIiBpbnN0ZWFkLmApKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGNvbnN0IGZpbGVEYXRhID0gW107XG5cdFx0XHRcdGZpbGUub24oJ2RhdGEnLCBNZXRlb3IuYmluZEVudmlyb25tZW50KChkYXRhKSA9PiB7XG5cdFx0XHRcdFx0ZmlsZURhdGEucHVzaChkYXRhKTtcblx0XHRcdFx0fSkpO1xuXG5cdFx0XHRcdGZpbGUub24oJ2VuZCcsIE1ldGVvci5iaW5kRW52aXJvbm1lbnQoKCkgPT4gY2FsbGJhY2sodW5kZWZpbmVkLCBCdWZmZXIuY29uY2F0KGZpbGVEYXRhKSkpKTtcblx0XHRcdH0pKTtcblxuXHRcdFx0cmVxdWVzdC5waXBlKGJ1c2JveSk7XG5cdFx0fSkoKTtcblx0fVxuXG5cdGFkZE1hbmFnZW1lbnRSb3V0ZXMoKSB7XG5cdFx0Y29uc3Qgb3JjaGVzdHJhdG9yID0gdGhpcy5fb3JjaDtcblx0XHRjb25zdCBtYW5hZ2VyID0gdGhpcy5fbWFuYWdlcjtcblx0XHRjb25zdCBmaWxlSGFuZGxlciA9IHRoaXMuX2hhbmRsZUZpbGU7XG5cblx0XHR0aGlzLmFwaS5hZGRSb3V0ZSgnJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRcdFx0Z2V0KCkge1xuXHRcdFx0XHRjb25zdCBhcHBzID0gbWFuYWdlci5nZXQoKS5tYXAocHJsID0+IHtcblx0XHRcdFx0XHRjb25zdCBpbmZvID0gcHJsLmdldEluZm8oKTtcblx0XHRcdFx0XHRpbmZvLmxhbmd1YWdlcyA9IHBybC5nZXRTdG9yYWdlSXRlbSgpLmxhbmd1YWdlQ29udGVudDtcblx0XHRcdFx0XHRpbmZvLnN0YXR1cyA9IHBybC5nZXRTdGF0dXMoKTtcblxuXHRcdFx0XHRcdHJldHVybiBpbmZvO1xuXHRcdFx0XHR9KTtcblxuXHRcdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7IGFwcHMgfSk7XG5cdFx0XHR9LFxuXHRcdFx0cG9zdCgpIHtcblx0XHRcdFx0bGV0IGJ1ZmY7XG5cblx0XHRcdFx0aWYgKHRoaXMuYm9keVBhcmFtcy51cmwpIHtcblx0XHRcdFx0XHRjb25zdCByZXN1bHQgPSBIVFRQLmNhbGwoJ0dFVCcsIHRoaXMuYm9keVBhcmFtcy51cmwsIHsgbnBtUmVxdWVzdE9wdGlvbnM6IHsgZW5jb2Rpbmc6ICdiYXNlNjQnIH19KTtcblxuXHRcdFx0XHRcdGlmIChyZXN1bHQuc3RhdHVzQ29kZSAhPT0gMjAwIHx8ICFyZXN1bHQuaGVhZGVyc1snY29udGVudC10eXBlJ10gfHwgcmVzdWx0LmhlYWRlcnNbJ2NvbnRlbnQtdHlwZSddICE9PSAnYXBwbGljYXRpb24vemlwJykge1xuXHRcdFx0XHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoeyBlcnJvcjogJ0ludmFsaWQgdXJsLiBJdCBkb2VzblxcJ3QgZXhpc3Qgb3IgaXMgbm90IFwiYXBwbGljYXRpb24vemlwXCIuJyB9KTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRidWZmID0gQnVmZmVyLmZyb20ocmVzdWx0LmNvbnRlbnQsICdiYXNlNjQnKTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRidWZmID0gZmlsZUhhbmRsZXIodGhpcy5yZXF1ZXN0LCAnYXBwJyk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAoIWJ1ZmYpIHtcblx0XHRcdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSh7IGVycm9yOiAnRmFpbGVkIHRvIGdldCBhIGZpbGUgdG8gaW5zdGFsbCBmb3IgdGhlIEFwcC4gJ30pO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Y29uc3QgYWZmID0gUHJvbWlzZS5hd2FpdChtYW5hZ2VyLmFkZChidWZmLnRvU3RyaW5nKCdiYXNlNjQnKSwgZmFsc2UpKTtcblx0XHRcdFx0Y29uc3QgaW5mbyA9IGFmZi5nZXRBcHBJbmZvKCk7XG5cdFx0XHRcdGluZm8uc3RhdHVzID0gYWZmLmdldEFwcCgpLmdldFN0YXR1cygpO1xuXG5cdFx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdFx0XHRhcHA6IGluZm8sXG5cdFx0XHRcdFx0aW1wbGVtZW50ZWQ6IGFmZi5nZXRJbXBsZW1lbnRlZEluZmVyZmFjZXMoKSxcblx0XHRcdFx0XHRjb21waWxlckVycm9yczogYWZmLmdldENvbXBpbGVyRXJyb3JzKClcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHR0aGlzLmFwaS5hZGRSb3V0ZSgnbGFuZ3VhZ2VzJywgeyBhdXRoUmVxdWlyZWQ6IGZhbHNlIH0sIHtcblx0XHRcdGdldCgpIHtcblx0XHRcdFx0Y29uc3QgYXBwcyA9IG1hbmFnZXIuZ2V0KCkubWFwKHBybCA9PiB7XG5cdFx0XHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0XHRcdGlkOiBwcmwuZ2V0SUQoKSxcblx0XHRcdFx0XHRcdGxhbmd1YWdlczogcHJsLmdldFN0b3JhZ2VJdGVtKCkubGFuZ3VhZ2VDb250ZW50XG5cdFx0XHRcdFx0fTtcblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoeyBhcHBzIH0pO1xuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0dGhpcy5hcGkuYWRkUm91dGUoJzppZCcsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0XHRcdGdldCgpIHtcblx0XHRcdFx0Y29uc29sZS5sb2coJ0dldHRpbmc6JywgdGhpcy51cmxQYXJhbXMuaWQpO1xuXHRcdFx0XHRjb25zdCBwcmwgPSBtYW5hZ2VyLmdldE9uZUJ5SWQodGhpcy51cmxQYXJhbXMuaWQpO1xuXG5cdFx0XHRcdGlmIChwcmwpIHtcblx0XHRcdFx0XHRjb25zdCBpbmZvID0gcHJsLmdldEluZm8oKTtcblx0XHRcdFx0XHRpbmZvLnN0YXR1cyA9IHBybC5nZXRTdGF0dXMoKTtcblxuXHRcdFx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHsgYXBwOiBpbmZvIH0pO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5ub3RGb3VuZChgTm8gQXBwIGZvdW5kIGJ5IHRoZSBpZCBvZjogJHsgdGhpcy51cmxQYXJhbXMuaWQgfWApO1xuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXHRcdFx0cG9zdCgpIHtcblx0XHRcdFx0Y29uc29sZS5sb2coJ1VwZGF0aW5nOicsIHRoaXMudXJsUGFyYW1zLmlkKTtcblx0XHRcdFx0Ly8gVE9ETzogVmVyaWZ5IHBlcm1pc3Npb25zXG5cblx0XHRcdFx0bGV0IGJ1ZmY7XG5cblx0XHRcdFx0aWYgKHRoaXMuYm9keVBhcmFtcy51cmwpIHtcblx0XHRcdFx0XHRjb25zdCByZXN1bHQgPSBIVFRQLmNhbGwoJ0dFVCcsIHRoaXMuYm9keVBhcmFtcy51cmwsIHsgbnBtUmVxdWVzdE9wdGlvbnM6IHsgZW5jb2Rpbmc6ICdiYXNlNjQnIH19KTtcblxuXHRcdFx0XHRcdGlmIChyZXN1bHQuc3RhdHVzQ29kZSAhPT0gMjAwIHx8ICFyZXN1bHQuaGVhZGVyc1snY29udGVudC10eXBlJ10gfHwgcmVzdWx0LmhlYWRlcnNbJ2NvbnRlbnQtdHlwZSddICE9PSAnYXBwbGljYXRpb24vemlwJykge1xuXHRcdFx0XHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoeyBlcnJvcjogJ0ludmFsaWQgdXJsLiBJdCBkb2VzblxcJ3QgZXhpc3Qgb3IgaXMgbm90IFwiYXBwbGljYXRpb24vemlwXCIuJyB9KTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRidWZmID0gQnVmZmVyLmZyb20ocmVzdWx0LmNvbnRlbnQsICdiYXNlNjQnKTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRidWZmID0gZmlsZUhhbmRsZXIodGhpcy5yZXF1ZXN0LCAnYXBwJyk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAoIWJ1ZmYpIHtcblx0XHRcdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSh7IGVycm9yOiAnRmFpbGVkIHRvIGdldCBhIGZpbGUgdG8gaW5zdGFsbCBmb3IgdGhlIEFwcC4gJ30pO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Y29uc3QgYWZmID0gUHJvbWlzZS5hd2FpdChtYW5hZ2VyLnVwZGF0ZShidWZmLnRvU3RyaW5nKCdiYXNlNjQnKSkpO1xuXHRcdFx0XHRjb25zdCBpbmZvID0gYWZmLmdldEFwcEluZm8oKTtcblx0XHRcdFx0aW5mby5zdGF0dXMgPSBhZmYuZ2V0QXBwKCkuZ2V0U3RhdHVzKCk7XG5cblx0XHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0XHRcdGFwcDogaW5mbyxcblx0XHRcdFx0XHRpbXBsZW1lbnRlZDogYWZmLmdldEltcGxlbWVudGVkSW5mZXJmYWNlcygpLFxuXHRcdFx0XHRcdGNvbXBpbGVyRXJyb3JzOiBhZmYuZ2V0Q29tcGlsZXJFcnJvcnMoKVxuXHRcdFx0XHR9KTtcblx0XHRcdH0sXG5cdFx0XHRkZWxldGUoKSB7XG5cdFx0XHRcdGNvbnNvbGUubG9nKCdVbmluc3RhbGxpbmc6JywgdGhpcy51cmxQYXJhbXMuaWQpO1xuXHRcdFx0XHRjb25zdCBwcmwgPSBtYW5hZ2VyLmdldE9uZUJ5SWQodGhpcy51cmxQYXJhbXMuaWQpO1xuXG5cdFx0XHRcdGlmIChwcmwpIHtcblx0XHRcdFx0XHRQcm9taXNlLmF3YWl0KG1hbmFnZXIucmVtb3ZlKHBybC5nZXRJRCgpKSk7XG5cblx0XHRcdFx0XHRjb25zdCBpbmZvID0gcHJsLmdldEluZm8oKTtcblx0XHRcdFx0XHRpbmZvLnN0YXR1cyA9IHBybC5nZXRTdGF0dXMoKTtcblxuXHRcdFx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHsgYXBwOiBpbmZvIH0pO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5ub3RGb3VuZChgTm8gQXBwIGZvdW5kIGJ5IHRoZSBpZCBvZjogJHsgdGhpcy51cmxQYXJhbXMuaWQgfWApO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHR0aGlzLmFwaS5hZGRSb3V0ZSgnOmlkL2ljb24nLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdFx0XHRnZXQoKSB7XG5cdFx0XHRcdGNvbnNvbGUubG9nKCdHZXR0aW5nIHRoZSBBcHBcXCdzIEljb246JywgdGhpcy51cmxQYXJhbXMuaWQpO1xuXHRcdFx0XHRjb25zdCBwcmwgPSBtYW5hZ2VyLmdldE9uZUJ5SWQodGhpcy51cmxQYXJhbXMuaWQpO1xuXG5cdFx0XHRcdGlmIChwcmwpIHtcblx0XHRcdFx0XHRjb25zdCBpbmZvID0gcHJsLmdldEluZm8oKTtcblxuXHRcdFx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHsgaWNvbkZpbGVDb250ZW50OiBpbmZvLmljb25GaWxlQ29udGVudCB9KTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEubm90Rm91bmQoYE5vIEFwcCBmb3VuZCBieSB0aGUgaWQgb2Y6ICR7IHRoaXMudXJsUGFyYW1zLmlkIH1gKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0dGhpcy5hcGkuYWRkUm91dGUoJzppZC9sYW5ndWFnZXMnLCB7IGF1dGhSZXF1aXJlZDogZmFsc2UgfSwge1xuXHRcdFx0Z2V0KCkge1xuXHRcdFx0XHRjb25zb2xlLmxvZyhgR2V0dGluZyAkeyB0aGlzLnVybFBhcmFtcy5pZCB9J3MgbGFuZ3VhZ2VzLi5gKTtcblx0XHRcdFx0Y29uc3QgcHJsID0gbWFuYWdlci5nZXRPbmVCeUlkKHRoaXMudXJsUGFyYW1zLmlkKTtcblxuXHRcdFx0XHRpZiAocHJsKSB7XG5cdFx0XHRcdFx0Y29uc3QgbGFuZ3VhZ2VzID0gcHJsLmdldFN0b3JhZ2VJdGVtKCkubGFuZ3VhZ2VDb250ZW50IHx8IHt9O1xuXG5cdFx0XHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoeyBsYW5ndWFnZXMgfSk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLm5vdEZvdW5kKGBObyBBcHAgZm91bmQgYnkgdGhlIGlkIG9mOiAkeyB0aGlzLnVybFBhcmFtcy5pZCB9YCk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdHRoaXMuYXBpLmFkZFJvdXRlKCc6aWQvbG9ncycsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0XHRcdGdldCgpIHtcblx0XHRcdFx0Y29uc29sZS5sb2coYEdldHRpbmcgJHsgdGhpcy51cmxQYXJhbXMuaWQgfSdzIGxvZ3MuLmApO1xuXHRcdFx0XHRjb25zdCBwcmwgPSBtYW5hZ2VyLmdldE9uZUJ5SWQodGhpcy51cmxQYXJhbXMuaWQpO1xuXG5cdFx0XHRcdGlmIChwcmwpIHtcblx0XHRcdFx0XHRjb25zdCB7IG9mZnNldCwgY291bnQgfSA9IHRoaXMuZ2V0UGFnaW5hdGlvbkl0ZW1zKCk7XG5cdFx0XHRcdFx0Y29uc3QgeyBzb3J0LCBmaWVsZHMsIHF1ZXJ5IH0gPSB0aGlzLnBhcnNlSnNvblF1ZXJ5KCk7XG5cblx0XHRcdFx0XHRjb25zdCBvdXJRdWVyeSA9IE9iamVjdC5hc3NpZ24oe30sIHF1ZXJ5LCB7IGFwcElkOiBwcmwuZ2V0SUQoKSB9KTtcblx0XHRcdFx0XHRjb25zdCBvcHRpb25zID0ge1xuXHRcdFx0XHRcdFx0c29ydDogc29ydCA/IHNvcnQgOiB7IF91cGRhdGVkQXQ6IC0xIH0sXG5cdFx0XHRcdFx0XHRza2lwOiBvZmZzZXQsXG5cdFx0XHRcdFx0XHRsaW1pdDogY291bnQsXG5cdFx0XHRcdFx0XHRmaWVsZHNcblx0XHRcdFx0XHR9O1xuXG5cdFx0XHRcdFx0Y29uc3QgbG9ncyA9IFByb21pc2UuYXdhaXQob3JjaGVzdHJhdG9yLmdldExvZ1N0b3JhZ2UoKS5maW5kKG91clF1ZXJ5LCBvcHRpb25zKSk7XG5cblx0XHRcdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7IGxvZ3MgfSk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLm5vdEZvdW5kKGBObyBBcHAgZm91bmQgYnkgdGhlIGlkIG9mOiAkeyB0aGlzLnVybFBhcmFtcy5pZCB9YCk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdHRoaXMuYXBpLmFkZFJvdXRlKCc6aWQvc2V0dGluZ3MnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdFx0XHRnZXQoKSB7XG5cdFx0XHRcdGNvbnNvbGUubG9nKGBHZXR0aW5nICR7IHRoaXMudXJsUGFyYW1zLmlkIH0ncyBzZXR0aW5ncy4uYCk7XG5cdFx0XHRcdGNvbnN0IHBybCA9IG1hbmFnZXIuZ2V0T25lQnlJZCh0aGlzLnVybFBhcmFtcy5pZCk7XG5cblx0XHRcdFx0aWYgKHBybCkge1xuXHRcdFx0XHRcdGNvbnN0IHNldHRpbmdzID0gT2JqZWN0LmFzc2lnbih7fSwgcHJsLmdldFN0b3JhZ2VJdGVtKCkuc2V0dGluZ3MpO1xuXG5cdFx0XHRcdFx0T2JqZWN0LmtleXMoc2V0dGluZ3MpLmZvckVhY2goKGspID0+IHtcblx0XHRcdFx0XHRcdGlmIChzZXR0aW5nc1trXS5oaWRkZW4pIHtcblx0XHRcdFx0XHRcdFx0ZGVsZXRlIHNldHRpbmdzW2tdO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH0pO1xuXG5cdFx0XHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoeyBzZXR0aW5ncyB9KTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEubm90Rm91bmQoYE5vIEFwcCBmb3VuZCBieSB0aGUgaWQgb2Y6ICR7IHRoaXMudXJsUGFyYW1zLmlkIH1gKTtcblx0XHRcdFx0fVxuXHRcdFx0fSxcblx0XHRcdHBvc3QoKSB7XG5cdFx0XHRcdGNvbnNvbGUubG9nKGBVcGRhdGluZyAkeyB0aGlzLnVybFBhcmFtcy5pZCB9J3Mgc2V0dGluZ3MuLmApO1xuXHRcdFx0XHRpZiAoIXRoaXMuYm9keVBhcmFtcyB8fCAhdGhpcy5ib2R5UGFyYW1zLnNldHRpbmdzKSB7XG5cdFx0XHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoJ1RoZSBzZXR0aW5ncyB0byB1cGRhdGUgbXVzdCBiZSBwcmVzZW50LicpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Y29uc3QgcHJsID0gbWFuYWdlci5nZXRPbmVCeUlkKHRoaXMudXJsUGFyYW1zLmlkKTtcblxuXHRcdFx0XHRpZiAoIXBybCkge1xuXHRcdFx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5ub3RGb3VuZChgTm8gQXBwIGZvdW5kIGJ5IHRoZSBpZCBvZjogJHsgdGhpcy51cmxQYXJhbXMuaWQgfWApO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Y29uc3Qgc2V0dGluZ3MgPSBwcmwuZ2V0U3RvcmFnZUl0ZW0oKS5zZXR0aW5ncztcblxuXHRcdFx0XHRjb25zdCB1cGRhdGVkID0gW107XG5cdFx0XHRcdHRoaXMuYm9keVBhcmFtcy5zZXR0aW5ncy5mb3JFYWNoKChzKSA9PiB7XG5cdFx0XHRcdFx0aWYgKHNldHRpbmdzW3MuaWRdKSB7XG5cdFx0XHRcdFx0XHRQcm9taXNlLmF3YWl0KG1hbmFnZXIuZ2V0U2V0dGluZ3NNYW5hZ2VyKCkudXBkYXRlQXBwU2V0dGluZyh0aGlzLnVybFBhcmFtcy5pZCwgcykpO1xuXHRcdFx0XHRcdFx0Ly8gVXBkYXRpbmc/XG5cdFx0XHRcdFx0XHR1cGRhdGVkLnB1c2gocyk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9KTtcblxuXHRcdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7IHVwZGF0ZWQgfSk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHR0aGlzLmFwaS5hZGRSb3V0ZSgnOmlkL3NldHRpbmdzLzpzZXR0aW5nSWQnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdFx0XHRnZXQoKSB7XG5cdFx0XHRcdGNvbnNvbGUubG9nKGBHZXR0aW5nIHRoZSBBcHAgJHsgdGhpcy51cmxQYXJhbXMuaWQgfSdzIHNldHRpbmcgJHsgdGhpcy51cmxQYXJhbXMuc2V0dGluZ0lkIH1gKTtcblxuXHRcdFx0XHR0cnkge1xuXHRcdFx0XHRcdGNvbnN0IHNldHRpbmcgPSBtYW5hZ2VyLmdldFNldHRpbmdzTWFuYWdlcigpLmdldEFwcFNldHRpbmcodGhpcy51cmxQYXJhbXMuaWQsIHRoaXMudXJsUGFyYW1zLnNldHRpbmdJZCk7XG5cblx0XHRcdFx0XHRSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHsgc2V0dGluZyB9KTtcblx0XHRcdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0XHRcdGlmIChlLm1lc3NhZ2UuaW5jbHVkZXMoJ05vIHNldHRpbmcgZm91bmQnKSkge1xuXHRcdFx0XHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLm5vdEZvdW5kKGBObyBTZXR0aW5nIGZvdW5kIG9uIHRoZSBBcHAgYnkgdGhlIGlkIG9mOiBcIiR7IHRoaXMudXJsUGFyYW1zLnNldHRpbmdJZCB9XCJgKTtcblx0XHRcdFx0XHR9IGVsc2UgaWYgKGUubWVzc2FnZS5pbmNsdWRlcygnTm8gQXBwIGZvdW5kJykpIHtcblx0XHRcdFx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5ub3RGb3VuZChgTm8gQXBwIGZvdW5kIGJ5IHRoZSBpZCBvZjogJHsgdGhpcy51cmxQYXJhbXMuaWQgfWApO1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZShlLm1lc3NhZ2UpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fSxcblx0XHRcdHBvc3QoKSB7XG5cdFx0XHRcdGNvbnNvbGUubG9nKGBVcGRhdGluZyB0aGUgQXBwICR7IHRoaXMudXJsUGFyYW1zLmlkIH0ncyBzZXR0aW5nICR7IHRoaXMudXJsUGFyYW1zLnNldHRpbmdJZCB9YCk7XG5cblx0XHRcdFx0aWYgKCF0aGlzLmJvZHlQYXJhbXMuc2V0dGluZykge1xuXHRcdFx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCdTZXR0aW5nIHRvIHVwZGF0ZSB0byBtdXN0IGJlIHByZXNlbnQgb24gdGhlIHBvc3RlZCBib2R5LicpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0XHRQcm9taXNlLmF3YWl0KG1hbmFnZXIuZ2V0U2V0dGluZ3NNYW5hZ2VyKCkudXBkYXRlQXBwU2V0dGluZyh0aGlzLnVybFBhcmFtcy5pZCwgdGhpcy5ib2R5UGFyYW1zLnNldHRpbmcpKTtcblxuXHRcdFx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKCk7XG5cdFx0XHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdFx0XHRpZiAoZS5tZXNzYWdlLmluY2x1ZGVzKCdObyBzZXR0aW5nIGZvdW5kJykpIHtcblx0XHRcdFx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5ub3RGb3VuZChgTm8gU2V0dGluZyBmb3VuZCBvbiB0aGUgQXBwIGJ5IHRoZSBpZCBvZjogXCIkeyB0aGlzLnVybFBhcmFtcy5zZXR0aW5nSWQgfVwiYCk7XG5cdFx0XHRcdFx0fSBlbHNlIGlmIChlLm1lc3NhZ2UuaW5jbHVkZXMoJ05vIEFwcCBmb3VuZCcpKSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEubm90Rm91bmQoYE5vIEFwcCBmb3VuZCBieSB0aGUgaWQgb2Y6ICR7IHRoaXMudXJsUGFyYW1zLmlkIH1gKTtcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoZS5tZXNzYWdlKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdHRoaXMuYXBpLmFkZFJvdXRlKCc6aWQvc3RhdHVzJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRcdFx0Z2V0KCkge1xuXHRcdFx0XHRjb25zb2xlLmxvZyhgR2V0dGluZyAkeyB0aGlzLnVybFBhcmFtcy5pZCB9J3Mgc3RhdHVzLi5gKTtcblx0XHRcdFx0Y29uc3QgcHJsID0gbWFuYWdlci5nZXRPbmVCeUlkKHRoaXMudXJsUGFyYW1zLmlkKTtcblxuXHRcdFx0XHRpZiAocHJsKSB7XG5cdFx0XHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoeyBzdGF0dXM6IHBybC5nZXRTdGF0dXMoKSB9KTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEubm90Rm91bmQoYE5vIEFwcCBmb3VuZCBieSB0aGUgaWQgb2Y6ICR7IHRoaXMudXJsUGFyYW1zLmlkIH1gKTtcblx0XHRcdFx0fVxuXHRcdFx0fSxcblx0XHRcdHBvc3QoKSB7XG5cdFx0XHRcdGlmICghdGhpcy5ib2R5UGFyYW1zLnN0YXR1cyB8fCB0eXBlb2YgdGhpcy5ib2R5UGFyYW1zLnN0YXR1cyAhPT0gJ3N0cmluZycpIHtcblx0XHRcdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgnSW52YWxpZCBzdGF0dXMgcHJvdmlkZWQsIGl0IG11c3QgYmUgXCJzdGF0dXNcIiBmaWVsZCBhbmQgYSBzdHJpbmcuJyk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRjb25zb2xlLmxvZyhgVXBkYXRpbmcgJHsgdGhpcy51cmxQYXJhbXMuaWQgfSdzIHN0YXR1cy4uLmAsIHRoaXMuYm9keVBhcmFtcy5zdGF0dXMpO1xuXHRcdFx0XHRjb25zdCBwcmwgPSBtYW5hZ2VyLmdldE9uZUJ5SWQodGhpcy51cmxQYXJhbXMuaWQpO1xuXG5cdFx0XHRcdGlmIChwcmwpIHtcblx0XHRcdFx0XHRjb25zdCByZXN1bHQgPSBQcm9taXNlLmF3YWl0KG1hbmFnZXIuY2hhbmdlU3RhdHVzKHBybC5nZXRJRCgpLCB0aGlzLmJvZHlQYXJhbXMuc3RhdHVzKSk7XG5cblx0XHRcdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7IHN0YXR1czogcmVzdWx0LmdldFN0YXR1cygpIH0pO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5ub3RGb3VuZChgTm8gQXBwIGZvdW5kIGJ5IHRoZSBpZCBvZjogJHsgdGhpcy51cmxQYXJhbXMuaWQgfWApO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH1cbn1cbiIsImltcG9ydCB7IEFwcFN0YXR1cywgQXBwU3RhdHVzVXRpbHMgfSBmcm9tICdAcm9ja2V0LmNoYXQvYXBwcy10cy1kZWZpbml0aW9uL0FwcFN0YXR1cyc7XG5cbmV4cG9ydCBjb25zdCBBcHBFdmVudHMgPSBPYmplY3QuZnJlZXplKHtcblx0QVBQX0FEREVEOiAnYXBwL2FkZGVkJyxcblx0QVBQX1JFTU9WRUQ6ICdhcHAvcmVtb3ZlZCcsXG5cdEFQUF9VUERBVEVEOiAnYXBwL3VwZGF0ZWQnLFxuXHRBUFBfU1RBVFVTX0NIQU5HRTogJ2FwcC9zdGF0dXNVcGRhdGUnLFxuXHRBUFBfU0VUVElOR19VUERBVEVEOiAnYXBwL3NldHRpbmdVcGRhdGVkJyxcblx0Q09NTUFORF9BRERFRDogJ2NvbW1hbmQvYWRkZWQnLFxuXHRDT01NQU5EX0RJU0FCTEVEOiAnY29tbWFuZC9kaXNhYmxlZCcsXG5cdENPTU1BTkRfVVBEQVRFRDogJ2NvbW1hbmQvdXBkYXRlZCcsXG5cdENPTU1BTkRfUkVNT1ZFRDogJ2NvbW1hbmQvcmVtb3ZlZCdcbn0pO1xuXG5leHBvcnQgY2xhc3MgQXBwU2VydmVyTGlzdGVuZXIge1xuXHRjb25zdHJ1Y3RvcihvcmNoLCBlbmdpbmVTdHJlYW1lciwgY2xpZW50U3RyZWFtZXIsIHJlY2lldmVkKSB7XG5cdFx0dGhpcy5vcmNoID0gb3JjaDtcblx0XHR0aGlzLmVuZ2luZVN0cmVhbWVyID0gZW5naW5lU3RyZWFtZXI7XG5cdFx0dGhpcy5jbGllbnRTdHJlYW1lciA9IGNsaWVudFN0cmVhbWVyO1xuXHRcdHRoaXMucmVjaWV2ZWQgPSByZWNpZXZlZDtcblxuXHRcdHRoaXMuZW5naW5lU3RyZWFtZXIub24oQXBwRXZlbnRzLkFQUF9BRERFRCwgdGhpcy5vbkFwcEFkZGVkLmJpbmQodGhpcykpO1xuXHRcdHRoaXMuZW5naW5lU3RyZWFtZXIub24oQXBwRXZlbnRzLkFQUF9TVEFUVVNfQ0hBTkdFLCB0aGlzLm9uQXBwU3RhdHVzVXBkYXRlZC5iaW5kKHRoaXMpKTtcblx0XHR0aGlzLmVuZ2luZVN0cmVhbWVyLm9uKEFwcEV2ZW50cy5BUFBfU0VUVElOR19VUERBVEVELCB0aGlzLm9uQXBwU2V0dGluZ1VwZGF0ZWQuYmluZCh0aGlzKSk7XG5cdFx0dGhpcy5lbmdpbmVTdHJlYW1lci5vbihBcHBFdmVudHMuQVBQX1JFTU9WRUQsIHRoaXMub25BcHBSZW1vdmVkLmJpbmQodGhpcykpO1xuXHRcdHRoaXMuZW5naW5lU3RyZWFtZXIub24oQXBwRXZlbnRzLkNPTU1BTkRfQURERUQsIHRoaXMub25Db21tYW5kQWRkZWQuYmluZCh0aGlzKSk7XG5cdFx0dGhpcy5lbmdpbmVTdHJlYW1lci5vbihBcHBFdmVudHMuQ09NTUFORF9ESVNBQkxFRCwgdGhpcy5vbkNvbW1hbmREaXNhYmxlZC5iaW5kKHRoaXMpKTtcblx0XHR0aGlzLmVuZ2luZVN0cmVhbWVyLm9uKEFwcEV2ZW50cy5DT01NQU5EX1VQREFURUQsIHRoaXMub25Db21tYW5kVXBkYXRlZC5iaW5kKHRoaXMpKTtcblx0XHR0aGlzLmVuZ2luZVN0cmVhbWVyLm9uKEFwcEV2ZW50cy5DT01NQU5EX1JFTU9WRUQsIHRoaXMub25Db21tYW5kUmVtb3ZlZC5iaW5kKHRoaXMpKTtcblx0fVxuXG5cdGFzeW5jIG9uQXBwQWRkZWQoYXBwSWQpIHtcblx0XHRhd2FpdCB0aGlzLm9yY2guZ2V0TWFuYWdlcigpLmxvYWRPbmUoYXBwSWQpO1xuXHRcdHRoaXMuY2xpZW50U3RyZWFtZXIuZW1pdChBcHBFdmVudHMuQVBQX0FEREVELCBhcHBJZCk7XG5cdH1cblxuXHRhc3luYyBvbkFwcFN0YXR1c1VwZGF0ZWQoeyBhcHBJZCwgc3RhdHVzIH0pIHtcblx0XHR0aGlzLnJlY2lldmVkLnNldChgJHsgQXBwRXZlbnRzLkFQUF9TVEFUVVNfQ0hBTkdFIH1fJHsgYXBwSWQgfWAsIHsgYXBwSWQsIHN0YXR1cywgd2hlbjogbmV3IERhdGUoKSB9KTtcblxuXHRcdGlmIChBcHBTdGF0dXNVdGlscy5pc0VuYWJsZWQoc3RhdHVzKSkge1xuXHRcdFx0YXdhaXQgdGhpcy5vcmNoLmdldE1hbmFnZXIoKS5lbmFibGUoYXBwSWQpO1xuXHRcdFx0dGhpcy5jbGllbnRTdHJlYW1lci5lbWl0KEFwcEV2ZW50cy5BUFBfU1RBVFVTX0NIQU5HRSwgeyBhcHBJZCwgc3RhdHVzIH0pO1xuXHRcdH0gZWxzZSBpZiAoQXBwU3RhdHVzVXRpbHMuaXNEaXNhYmxlZChzdGF0dXMpKSB7XG5cdFx0XHRhd2FpdCB0aGlzLm9yY2guZ2V0TWFuYWdlcigpLmRpc2FibGUoYXBwSWQsIEFwcFN0YXR1cy5NQU5VQUxMWV9ESVNBQkxFRCA9PT0gc3RhdHVzKTtcblx0XHRcdHRoaXMuY2xpZW50U3RyZWFtZXIuZW1pdChBcHBFdmVudHMuQVBQX1NUQVRVU19DSEFOR0UsIHsgYXBwSWQsIHN0YXR1cyB9KTtcblx0XHR9XG5cdH1cblxuXHRhc3luYyBvbkFwcFNldHRpbmdVcGRhdGVkKHsgYXBwSWQsIHNldHRpbmcgfSkge1xuXHRcdHRoaXMucmVjaWV2ZWQuc2V0KGAkeyBBcHBFdmVudHMuQVBQX1NFVFRJTkdfVVBEQVRFRCB9XyR7IGFwcElkIH1fJHsgc2V0dGluZy5pZCB9YCwgeyBhcHBJZCwgc2V0dGluZywgd2hlbjogbmV3IERhdGUoKSB9KTtcblxuXHRcdGF3YWl0IHRoaXMub3JjaC5nZXRNYW5hZ2VyKCkuZ2V0U2V0dGluZ3NNYW5hZ2VyKCkudXBkYXRlQXBwU2V0dGluZyhhcHBJZCwgc2V0dGluZyk7XG5cdFx0dGhpcy5jbGllbnRTdHJlYW1lci5lbWl0KEFwcEV2ZW50cy5BUFBfU0VUVElOR19VUERBVEVELCB7IGFwcElkIH0pO1xuXHR9XG5cblx0YXN5bmMgb25BcHBSZW1vdmVkKGFwcElkKSB7XG5cdFx0YXdhaXQgdGhpcy5vcmNoLmdldE1hbmFnZXIoKS5yZW1vdmUoYXBwSWQpO1xuXHRcdHRoaXMuY2xpZW50U3RyZWFtZXIuZW1pdChBcHBFdmVudHMuQVBQX1JFTU9WRUQsIGFwcElkKTtcblx0fVxuXG5cdGFzeW5jIG9uQ29tbWFuZEFkZGVkKGNvbW1hbmQpIHtcblx0XHR0aGlzLmNsaWVudFN0cmVhbWVyLmVtaXQoQXBwRXZlbnRzLkNPTU1BTkRfQURERUQsIGNvbW1hbmQpO1xuXHR9XG5cblx0YXN5bmMgb25Db21tYW5kRGlzYWJsZWQoY29tbWFuZCkge1xuXHRcdHRoaXMuY2xpZW50U3RyZWFtZXIuZW1pdChBcHBFdmVudHMuQ09NTUFORF9ESVNBQkxFRCwgY29tbWFuZCk7XG5cdH1cblxuXHRhc3luYyBvbkNvbW1hbmRVcGRhdGVkKGNvbW1hbmQpIHtcblx0XHR0aGlzLmNsaWVudFN0cmVhbWVyLmVtaXQoQXBwRXZlbnRzLkNPTU1BTkRfVVBEQVRFRCwgY29tbWFuZCk7XG5cdH1cblxuXHRhc3luYyBvbkNvbW1hbmRSZW1vdmVkKGNvbW1hbmQpIHtcblx0XHR0aGlzLmNsaWVudFN0cmVhbWVyLmVtaXQoQXBwRXZlbnRzLkNPTU1BTkRfUkVNT1ZFRCwgY29tbWFuZCk7XG5cdH1cbn1cblxuZXhwb3J0IGNsYXNzIEFwcFNlcnZlck5vdGlmaWVyIHtcblx0Y29uc3RydWN0b3Iob3JjaCkge1xuXHRcdHRoaXMuZW5naW5lU3RyZWFtZXIgPSBuZXcgTWV0ZW9yLlN0cmVhbWVyKCdhcHBzLWVuZ2luZScsIHsgcmV0cmFuc21pdDogZmFsc2UgfSk7XG5cdFx0dGhpcy5lbmdpbmVTdHJlYW1lci5zZXJ2ZXJPbmx5ID0gdHJ1ZTtcblx0XHR0aGlzLmVuZ2luZVN0cmVhbWVyLmFsbG93UmVhZCgnbm9uZScpO1xuXHRcdHRoaXMuZW5naW5lU3RyZWFtZXIuYWxsb3dFbWl0KCdhbGwnKTtcblx0XHR0aGlzLmVuZ2luZVN0cmVhbWVyLmFsbG93V3JpdGUoJ25vbmUnKTtcblxuXHRcdC8vIFRoaXMgaXMgdXNlZCB0byBicm9hZGNhc3QgdG8gdGhlIHdlYiBjbGllbnRzXG5cdFx0dGhpcy5jbGllbnRTdHJlYW1lciA9IG5ldyBNZXRlb3IuU3RyZWFtZXIoJ2FwcHMnLCB7IHJldHJhbnNtaXQ6IGZhbHNlIH0pO1xuXHRcdHRoaXMuY2xpZW50U3RyZWFtZXIuc2VydmVyT25seSA9IHRydWU7XG5cdFx0dGhpcy5jbGllbnRTdHJlYW1lci5hbGxvd1JlYWQoJ2FsbCcpO1xuXHRcdHRoaXMuY2xpZW50U3RyZWFtZXIuYWxsb3dFbWl0KCdhbGwnKTtcblx0XHR0aGlzLmNsaWVudFN0cmVhbWVyLmFsbG93V3JpdGUoJ25vbmUnKTtcblxuXHRcdHRoaXMucmVjaWV2ZWQgPSBuZXcgTWFwKCk7XG5cdFx0dGhpcy5saXN0ZW5lciA9IG5ldyBBcHBTZXJ2ZXJMaXN0ZW5lcihvcmNoLCB0aGlzLmVuZ2luZVN0cmVhbWVyLCB0aGlzLmNsaWVudFN0cmVhbWVyLCB0aGlzLnJlY2lldmVkKTtcblx0fVxuXG5cdGFzeW5jIGFwcEFkZGVkKGFwcElkKSB7XG5cdFx0dGhpcy5lbmdpbmVTdHJlYW1lci5lbWl0KEFwcEV2ZW50cy5BUFBfQURERUQsIGFwcElkKTtcblx0XHR0aGlzLmNsaWVudFN0cmVhbWVyLmVtaXQoQXBwRXZlbnRzLkFQUF9BRERFRCwgYXBwSWQpO1xuXHR9XG5cblx0YXN5bmMgYXBwUmVtb3ZlZChhcHBJZCkge1xuXHRcdHRoaXMuZW5naW5lU3RyZWFtZXIuZW1pdChBcHBFdmVudHMuQVBQX1JFTU9WRUQsIGFwcElkKTtcblx0XHR0aGlzLmNsaWVudFN0cmVhbWVyLmVtaXQoQXBwRXZlbnRzLkFQUF9SRU1PVkVELCBhcHBJZCk7XG5cdH1cblxuXHRhc3luYyBhcHBVcGRhdGVkKGFwcElkKSB7XG5cdFx0dGhpcy5lbmdpbmVTdHJlYW1lci5lbWl0KEFwcEV2ZW50cy5BUFBfVVBEQVRFRCwgYXBwSWQpO1xuXHRcdHRoaXMuY2xpZW50U3RyZWFtZXIuZW1pdChBcHBFdmVudHMuQVBQX1VQREFURUQsIGFwcElkKTtcblx0fVxuXG5cdGFzeW5jIGFwcFN0YXR1c1VwZGF0ZWQoYXBwSWQsIHN0YXR1cykge1xuXHRcdGlmICh0aGlzLnJlY2lldmVkLmhhcyhgJHsgQXBwRXZlbnRzLkFQUF9TVEFUVVNfQ0hBTkdFIH1fJHsgYXBwSWQgfWApKSB7XG5cdFx0XHRjb25zdCBkZXRhaWxzID0gdGhpcy5yZWNpZXZlZC5nZXQoYCR7IEFwcEV2ZW50cy5BUFBfU1RBVFVTX0NIQU5HRSB9XyR7IGFwcElkIH1gKTtcblx0XHRcdGlmIChkZXRhaWxzLnN0YXR1cyA9PT0gc3RhdHVzKSB7XG5cdFx0XHRcdHRoaXMucmVjaWV2ZWQuZGVsZXRlKGAkeyBBcHBFdmVudHMuQVBQX1NUQVRVU19DSEFOR0UgfV8keyBhcHBJZCB9YCk7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblx0XHR9XG5cblx0XHR0aGlzLmVuZ2luZVN0cmVhbWVyLmVtaXQoQXBwRXZlbnRzLkFQUF9TVEFUVVNfQ0hBTkdFLCB7IGFwcElkLCBzdGF0dXMgfSk7XG5cdFx0dGhpcy5jbGllbnRTdHJlYW1lci5lbWl0KEFwcEV2ZW50cy5BUFBfU1RBVFVTX0NIQU5HRSwgeyBhcHBJZCwgc3RhdHVzIH0pO1xuXHR9XG5cblx0YXN5bmMgYXBwU2V0dGluZ3NDaGFuZ2UoYXBwSWQsIHNldHRpbmcpIHtcblx0XHRpZiAodGhpcy5yZWNpZXZlZC5oYXMoYCR7IEFwcEV2ZW50cy5BUFBfU0VUVElOR19VUERBVEVEIH1fJHsgYXBwSWQgfV8keyBzZXR0aW5nLmlkIH1gKSkge1xuXHRcdFx0dGhpcy5yZWNpZXZlZC5kZWxldGUoYCR7IEFwcEV2ZW50cy5BUFBfU0VUVElOR19VUERBVEVEIH1fJHsgYXBwSWQgfV8keyBzZXR0aW5nLmlkIH1gKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHR0aGlzLmVuZ2luZVN0cmVhbWVyLmVtaXQoQXBwRXZlbnRzLkFQUF9TRVRUSU5HX1VQREFURUQsIHsgYXBwSWQsIHNldHRpbmcgfSk7XG5cdFx0dGhpcy5jbGllbnRTdHJlYW1lci5lbWl0KEFwcEV2ZW50cy5BUFBfU0VUVElOR19VUERBVEVELCB7IGFwcElkIH0pO1xuXHR9XG5cblx0YXN5bmMgY29tbWFuZEFkZGVkKGNvbW1hbmQpIHtcblx0XHR0aGlzLmVuZ2luZVN0cmVhbWVyLmVtaXQoQXBwRXZlbnRzLkNPTU1BTkRfQURERUQsIGNvbW1hbmQpO1xuXHRcdHRoaXMuY2xpZW50U3RyZWFtZXIuZW1pdChBcHBFdmVudHMuQ09NTUFORF9BRERFRCwgY29tbWFuZCk7XG5cdH1cblxuXHRhc3luYyBjb21tYW5kRGlzYWJsZWQoY29tbWFuZCkge1xuXHRcdHRoaXMuZW5naW5lU3RyZWFtZXIuZW1pdChBcHBFdmVudHMuQ09NTUFORF9ESVNBQkxFRCwgY29tbWFuZCk7XG5cdFx0dGhpcy5jbGllbnRTdHJlYW1lci5lbWl0KEFwcEV2ZW50cy5DT01NQU5EX0RJU0FCTEVELCBjb21tYW5kKTtcblx0fVxuXG5cdGFzeW5jIGNvbW1hbmRVcGRhdGVkKGNvbW1hbmQpIHtcblx0XHR0aGlzLmVuZ2luZVN0cmVhbWVyLmVtaXQoQXBwRXZlbnRzLkNPTU1BTkRfVVBEQVRFRCwgY29tbWFuZCk7XG5cdFx0dGhpcy5jbGllbnRTdHJlYW1lci5lbWl0KEFwcEV2ZW50cy5DT01NQU5EX1VQREFURUQsIGNvbW1hbmQpO1xuXHR9XG5cblx0YXN5bmMgY29tbWFuZFJlbW92ZWQoY29tbWFuZCkge1xuXHRcdHRoaXMuZW5naW5lU3RyZWFtZXIuZW1pdChBcHBFdmVudHMuQ09NTUFORF9SRU1PVkVELCBjb21tYW5kKTtcblx0XHR0aGlzLmNsaWVudFN0cmVhbWVyLmVtaXQoQXBwRXZlbnRzLkNPTU1BTkRfUkVNT1ZFRCwgY29tbWFuZCk7XG5cdH1cbn1cbiIsImltcG9ydCB7IEFwcE1ldGhvZHN9IGZyb20gJy4vbWV0aG9kcyc7XG5pbXBvcnQgeyBBcHBzUmVzdEFwaSB9IGZyb20gJy4vcmVzdCc7XG5pbXBvcnQgeyBBcHBFdmVudHMsIEFwcFNlcnZlck5vdGlmaWVyLCBBcHBTZXJ2ZXJMaXN0ZW5lciB9IGZyb20gJy4vd2Vic29ja2V0cyc7XG5cbmV4cG9ydCB7XG5cdEFwcE1ldGhvZHMsXG5cdEFwcHNSZXN0QXBpLFxuXHRBcHBFdmVudHMsXG5cdEFwcFNlcnZlck5vdGlmaWVyLFxuXHRBcHBTZXJ2ZXJMaXN0ZW5lclxufTtcbiIsImV4cG9ydCBjbGFzcyBBcHBNZXNzYWdlc0NvbnZlcnRlciB7XG5cdGNvbnN0cnVjdG9yKG9yY2gpIHtcblx0XHR0aGlzLm9yY2ggPSBvcmNoO1xuXHR9XG5cblx0Y29udmVydEJ5SWQobXNnSWQpIHtcblx0XHRjb25zdCBtc2cgPSBSb2NrZXRDaGF0Lm1vZGVscy5NZXNzYWdlcy5nZXRPbmVCeUlkKG1zZ0lkKTtcblxuXHRcdHJldHVybiB0aGlzLmNvbnZlcnRNZXNzYWdlKG1zZyk7XG5cdH1cblxuXHRjb252ZXJ0TWVzc2FnZShtc2dPYmopIHtcblx0XHRpZiAoIW1zZ09iaikge1xuXHRcdFx0cmV0dXJuIHVuZGVmaW5lZDtcblx0XHR9XG5cblx0XHRjb25zdCByb29tID0gdGhpcy5vcmNoLmdldENvbnZlcnRlcnMoKS5nZXQoJ3Jvb21zJykuY29udmVydEJ5SWQobXNnT2JqLnJpZCk7XG5cblx0XHRsZXQgc2VuZGVyO1xuXHRcdGlmIChtc2dPYmoudSAmJiBtc2dPYmoudS5faWQpIHtcblx0XHRcdHNlbmRlciA9IHRoaXMub3JjaC5nZXRDb252ZXJ0ZXJzKCkuZ2V0KCd1c2VycycpLmNvbnZlcnRCeUlkKG1zZ09iai51Ll9pZCk7XG5cblx0XHRcdGlmICghc2VuZGVyKSB7XG5cdFx0XHRcdHNlbmRlciA9IHRoaXMub3JjaC5nZXRDb252ZXJ0ZXJzKCkuZ2V0KCd1c2VycycpLmNvbnZlcnRUb0FwcChtc2dPYmoudSk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0bGV0IGVkaXRvcjtcblx0XHRpZiAobXNnT2JqLmVkaXRlZEJ5KSB7XG5cdFx0XHRlZGl0b3IgPSB0aGlzLm9yY2guZ2V0Q29udmVydGVycygpLmdldCgndXNlcnMnKS5jb252ZXJ0QnlJZChtc2dPYmouZWRpdGVkQnkuX2lkKTtcblx0XHR9XG5cblx0XHRjb25zdCBhdHRhY2htZW50cyA9IHRoaXMuX2NvbnZlcnRBdHRhY2htZW50c1RvQXBwKG1zZ09iai5hdHRhY2htZW50cyk7XG5cblx0XHRyZXR1cm4ge1xuXHRcdFx0aWQ6IG1zZ09iai5faWQsXG5cdFx0XHRyb29tLFxuXHRcdFx0c2VuZGVyLFxuXHRcdFx0dGV4dDogbXNnT2JqLm1zZyxcblx0XHRcdGNyZWF0ZWRBdDogbXNnT2JqLnRzLFxuXHRcdFx0dXBkYXRlZEF0OiBtc2dPYmouX3VwZGF0ZWRBdCxcblx0XHRcdGVkaXRvcixcblx0XHRcdGVkaXRlZEF0OiBtc2dPYmouZWRpdGVkQXQsXG5cdFx0XHRlbW9qaTogbXNnT2JqLmVtb2ppLFxuXHRcdFx0YXZhdGFyVXJsOiBtc2dPYmouYXZhdGFyLFxuXHRcdFx0YWxpYXM6IG1zZ09iai5hbGlhcyxcblx0XHRcdGN1c3RvbUZpZWxkczogbXNnT2JqLmN1c3RvbUZpZWxkcyxcblx0XHRcdGF0dGFjaG1lbnRzXG5cdFx0fTtcblx0fVxuXG5cdGNvbnZlcnRBcHBNZXNzYWdlKG1lc3NhZ2UpIHtcblx0XHRpZiAoIW1lc3NhZ2UpIHtcblx0XHRcdHJldHVybiB1bmRlZmluZWQ7XG5cdFx0fVxuXG5cdFx0Y29uc3Qgcm9vbSA9IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRPbmVCeUlkKG1lc3NhZ2Uucm9vbS5pZCk7XG5cblx0XHRpZiAoIXJvb20pIHtcblx0XHRcdHRocm93IG5ldyBFcnJvcignSW52YWxpZCByb29tIHByb3ZpZGVkIG9uIHRoZSBtZXNzYWdlLicpO1xuXHRcdH1cblxuXHRcdGxldCB1O1xuXHRcdGlmIChtZXNzYWdlLnNlbmRlciAmJiBtZXNzYWdlLnNlbmRlci5pZCkge1xuXHRcdFx0Y29uc3QgdXNlciA9IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmVCeUlkKG1lc3NhZ2Uuc2VuZGVyLmlkKTtcblxuXHRcdFx0aWYgKHVzZXIpIHtcblx0XHRcdFx0dSA9IHtcblx0XHRcdFx0XHRfaWQ6IHVzZXIuX2lkLFxuXHRcdFx0XHRcdHVzZXJuYW1lOiB1c2VyLnVzZXJuYW1lLFxuXHRcdFx0XHRcdG5hbWU6IHVzZXIubmFtZVxuXHRcdFx0XHR9O1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dSA9IHtcblx0XHRcdFx0XHRfaWQ6IG1lc3NhZ2Uuc2VuZGVyLmlkLFxuXHRcdFx0XHRcdHVzZXJuYW1lOiBtZXNzYWdlLnNlbmRlci51c2VybmFtZSxcblx0XHRcdFx0XHRuYW1lOiBtZXNzYWdlLnNlbmRlci5uYW1lXG5cdFx0XHRcdH07XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0bGV0IGVkaXRlZEJ5O1xuXHRcdGlmIChtZXNzYWdlLmVkaXRvcikge1xuXHRcdFx0Y29uc3QgZWRpdG9yID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZE9uZUJ5SWQobWVzc2FnZS5lZGl0b3IuaWQpO1xuXHRcdFx0ZWRpdGVkQnkgPSB7XG5cdFx0XHRcdF9pZDogZWRpdG9yLl9pZCxcblx0XHRcdFx0dXNlcm5hbWU6IGVkaXRvci51c2VybmFtZVxuXHRcdFx0fTtcblx0XHR9XG5cblx0XHRjb25zdCBhdHRhY2htZW50cyA9IHRoaXMuX2NvbnZlcnRBcHBBdHRhY2htZW50cyhtZXNzYWdlLmF0dGFjaG1lbnRzKTtcblxuXHRcdHJldHVybiB7XG5cdFx0XHRfaWQ6IG1lc3NhZ2UuaWQgfHwgUmFuZG9tLmlkKCksXG5cdFx0XHRyaWQ6IHJvb20uX2lkLFxuXHRcdFx0dSxcblx0XHRcdG1zZzogbWVzc2FnZS50ZXh0LFxuXHRcdFx0dHM6IG1lc3NhZ2UuY3JlYXRlZEF0IHx8IG5ldyBEYXRlKCksXG5cdFx0XHRfdXBkYXRlZEF0OiBtZXNzYWdlLnVwZGF0ZWRBdCB8fCBuZXcgRGF0ZSgpLFxuXHRcdFx0ZWRpdGVkQnksXG5cdFx0XHRlZGl0ZWRBdDogbWVzc2FnZS5lZGl0ZWRBdCxcblx0XHRcdGVtb2ppOiBtZXNzYWdlLmVtb2ppLFxuXHRcdFx0YXZhdGFyOiBtZXNzYWdlLmF2YXRhclVybCxcblx0XHRcdGFsaWFzOiBtZXNzYWdlLmFsaWFzLFxuXHRcdFx0Y3VzdG9tRmllbGRzOiBtZXNzYWdlLmN1c3RvbUZpZWxkcyxcblx0XHRcdGF0dGFjaG1lbnRzXG5cdFx0fTtcblx0fVxuXG5cdF9jb252ZXJ0QXBwQXR0YWNobWVudHMoYXR0YWNobWVudHMpIHtcblx0XHRpZiAodHlwZW9mIGF0dGFjaG1lbnRzID09PSAndW5kZWZpbmVkJyB8fCAhQXJyYXkuaXNBcnJheShhdHRhY2htZW50cykpIHtcblx0XHRcdHJldHVybiB1bmRlZmluZWQ7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGF0dGFjaG1lbnRzLm1hcCgoYXR0YWNobWVudCkgPT4ge1xuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0Y29sbGFwc2VkOiBhdHRhY2htZW50LmNvbGxhcHNlZCxcblx0XHRcdFx0Y29sb3I6IGF0dGFjaG1lbnQuY29sb3IsXG5cdFx0XHRcdHRleHQ6IGF0dGFjaG1lbnQudGV4dCxcblx0XHRcdFx0dHM6IGF0dGFjaG1lbnQudGltZXN0YW1wLFxuXHRcdFx0XHRtZXNzYWdlX2xpbms6IGF0dGFjaG1lbnQudGltZXN0YW1wTGluayxcblx0XHRcdFx0dGh1bWJfdXJsOiBhdHRhY2htZW50LnRodW1ibmFpbFVybCxcblx0XHRcdFx0YXV0aG9yX25hbWU6IGF0dGFjaG1lbnQuYXV0aG9yID8gYXR0YWNobWVudC5hdXRob3IubmFtZSA6IHVuZGVmaW5lZCxcblx0XHRcdFx0YXV0aG9yX2xpbms6IGF0dGFjaG1lbnQuYXV0aG9yID8gYXR0YWNobWVudC5hdXRob3IubGluayA6IHVuZGVmaW5lZCxcblx0XHRcdFx0YXV0aG9yX2ljb246IGF0dGFjaG1lbnQuYXV0aG9yID8gYXR0YWNobWVudC5hdXRob3IuaWNvbiA6IHVuZGVmaW5lZCxcblx0XHRcdFx0dGl0bGU6IGF0dGFjaG1lbnQudGl0bGUgPyBhdHRhY2htZW50LnRpdGxlLnZhbHVlIDogdW5kZWZpbmVkLFxuXHRcdFx0XHR0aXRsZV9saW5rOiBhdHRhY2htZW50LnRpdGxlID8gYXR0YWNobWVudC50aXRsZS5saW5rIDogdW5kZWZpbmVkLFxuXHRcdFx0XHR0aXRsZV9saW5rX2Rvd25sb2FkOiBhdHRhY2htZW50LnRpdGxlID8gYXR0YWNobWVudC50aXRsZS5kaXNwbGF5RG93bmxvYWRMaW5rIDogdW5kZWZpbmVkLFxuXHRcdFx0XHRpbWFnZV91cmw6IGF0dGFjaG1lbnQuaW1hZ2VVcmwsXG5cdFx0XHRcdGF1ZGlvX3VybDogYXR0YWNobWVudC5hdWRpb1VybCxcblx0XHRcdFx0dmlkZW9fdXJsOiBhdHRhY2htZW50LnZpZGVvVXJsLFxuXHRcdFx0XHRmaWVsZHM6IGF0dGFjaG1lbnQuZmllbGRzXG5cdFx0XHR9O1xuXHRcdH0pLm1hcCgoYSkgPT4ge1xuXHRcdFx0T2JqZWN0LmtleXMoYSkuZm9yRWFjaCgoaykgPT4ge1xuXHRcdFx0XHRpZiAodHlwZW9mIGFba10gPT09ICd1bmRlZmluZWQnKSB7XG5cdFx0XHRcdFx0ZGVsZXRlIGFba107XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXG5cdFx0XHRyZXR1cm4gYTtcblx0XHR9KTtcblx0fVxuXG5cdF9jb252ZXJ0QXR0YWNobWVudHNUb0FwcChhdHRhY2htZW50cykge1xuXHRcdGlmICh0eXBlb2YgYXR0YWNobWVudHMgPT09ICd1bmRlZmluZWQnIHx8ICFBcnJheS5pc0FycmF5KGF0dGFjaG1lbnRzKSkge1xuXHRcdFx0cmV0dXJuIHVuZGVmaW5lZDtcblx0XHR9XG5cblx0XHRyZXR1cm4gYXR0YWNobWVudHMubWFwKChhdHRhY2htZW50KSA9PiB7XG5cdFx0XHRsZXQgYXV0aG9yO1xuXHRcdFx0aWYgKGF0dGFjaG1lbnQuYXV0aG9yX25hbWUgfHwgYXR0YWNobWVudC5hdXRob3JfbGluayB8fCBhdHRhY2htZW50LmF1dGhvcl9pY29uKSB7XG5cdFx0XHRcdGF1dGhvciA9IHtcblx0XHRcdFx0XHRuYW1lOiBhdHRhY2htZW50LmF1dGhvcl9uYW1lLFxuXHRcdFx0XHRcdGxpbms6IGF0dGFjaG1lbnQuYXV0aG9yX2xpbmssXG5cdFx0XHRcdFx0aWNvbjogYXR0YWNobWVudC5hdXRob3JfaWNvblxuXHRcdFx0XHR9O1xuXHRcdFx0fVxuXG5cdFx0XHRsZXQgdGl0bGU7XG5cdFx0XHRpZiAoYXR0YWNobWVudC50aXRsZSB8fCBhdHRhY2htZW50LnRpdGxlX2xpbmsgfHwgYXR0YWNobWVudC50aXRsZV9saW5rX2Rvd25sb2FkKSB7XG5cdFx0XHRcdHRpdGxlID0ge1xuXHRcdFx0XHRcdHZhbHVlOiBhdHRhY2htZW50LnRpdGxlLFxuXHRcdFx0XHRcdGxpbms6IGF0dGFjaG1lbnQudGl0bGVfbGluayxcblx0XHRcdFx0XHRkaXNwbGF5RG93bmxvYWRMaW5rOiBhdHRhY2htZW50LnRpdGxlX2xpbmtfZG93bmxvYWRcblx0XHRcdFx0fTtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0Y29sbGFwc2VkOiBhdHRhY2htZW50LmNvbGxhcHNlZCxcblx0XHRcdFx0Y29sb3I6IGF0dGFjaG1lbnQuY29sb3IsXG5cdFx0XHRcdHRleHQ6IGF0dGFjaG1lbnQudGV4dCxcblx0XHRcdFx0dGltZXN0YW1wOiBhdHRhY2htZW50LnRzLFxuXHRcdFx0XHR0aW1lc3RhbXBMaW5rOiBhdHRhY2htZW50Lm1lc3NhZ2VfbGluayxcblx0XHRcdFx0dGh1bWJuYWlsVXJsOiBhdHRhY2htZW50LnRodW1iX3VybCxcblx0XHRcdFx0YXV0aG9yLFxuXHRcdFx0XHR0aXRsZSxcblx0XHRcdFx0aW1hZ2VVcmw6IGF0dGFjaG1lbnQuaW1hZ2VfdXJsLFxuXHRcdFx0XHRhdWRpb1VybDogYXR0YWNobWVudC5hdWRpb191cmwsXG5cdFx0XHRcdHZpZGVvVXJsOiBhdHRhY2htZW50LnZpZGVvX3VybCxcblx0XHRcdFx0ZmllbGRzOiBhdHRhY2htZW50LmZpZWxkc1xuXHRcdFx0fTtcblx0XHR9KTtcblx0fVxufVxuIiwiaW1wb3J0IHsgUm9vbVR5cGUgfSBmcm9tICdAcm9ja2V0LmNoYXQvYXBwcy10cy1kZWZpbml0aW9uL3Jvb21zJztcblxuZXhwb3J0IGNsYXNzIEFwcFJvb21zQ29udmVydGVyIHtcblx0Y29uc3RydWN0b3Iob3JjaCkge1xuXHRcdHRoaXMub3JjaCA9IG9yY2g7XG5cdH1cblxuXHRjb252ZXJ0QnlJZChyb29tSWQpIHtcblx0XHRjb25zdCByb29tID0gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9uZUJ5SWQocm9vbUlkKTtcblxuXHRcdHJldHVybiB0aGlzLmNvbnZlcnRSb29tKHJvb20pO1xuXHR9XG5cblx0Y29udmVydEJ5TmFtZShyb29tTmFtZSkge1xuXHRcdGNvbnN0IHJvb20gPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT25lQnlOYW1lKHJvb21OYW1lKTtcblxuXHRcdHJldHVybiB0aGlzLmNvbnZlcnRSb29tKHJvb20pO1xuXHR9XG5cblx0Y29udmVydEFwcFJvb20ocm9vbSkge1xuXHRcdGlmICghcm9vbSkge1xuXHRcdFx0cmV0dXJuIHVuZGVmaW5lZDtcblx0XHR9XG5cblx0XHRsZXQgdTtcblx0XHRpZiAocm9vbS5jcmVhdG9yKSB7XG5cdFx0XHRjb25zdCBjcmVhdG9yID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZE9uZUJ5SWQocm9vbS5jcmVhdG9yLmlkKTtcblx0XHRcdHUgPSB7XG5cdFx0XHRcdF9pZDogY3JlYXRvci5faWQsXG5cdFx0XHRcdHVzZXJuYW1lOiBjcmVhdG9yLnVzZXJuYW1lXG5cdFx0XHR9O1xuXHRcdH1cblxuXHRcdHJldHVybiB7XG5cdFx0XHRfaWQ6IHJvb20uaWQsXG5cdFx0XHRmbmFtZTogcm9vbS5kaXNwbGF5TmFtZSxcblx0XHRcdG5hbWU6IHJvb20uc2x1Z2lmaWVkTmFtZSxcblx0XHRcdHQ6IHJvb20udHlwZSxcblx0XHRcdHUsXG5cdFx0XHR1c2VybmFtZXM6IHJvb20udXNlcm5hbWVzLFxuXHRcdFx0ZGVmYXVsdDogdHlwZW9mIHJvb20uaXNEZWZhdWx0ID09PSAndW5kZWZpbmVkJyA/IGZhbHNlIDogcm9vbS5pc0RlZmF1bHQsXG5cdFx0XHRybzogdHlwZW9mIHJvb20uaXNSZWFkT25seSA9PT0gJ3VuZGVmaW5lZCcgPyBmYWxzZSA6IHJvb20uaXNSZWFkT25seSxcblx0XHRcdHN5c01lczogdHlwZW9mIHJvb20uZGlzcGxheVN5c3RlbU1lc3NhZ2VzID09PSAndW5kZWZpbmVkJyA/IHRydWUgOiByb29tLmRpc3BsYXlTeXN0ZW1NZXNzYWdlcyxcblx0XHRcdG1zZ3M6IHJvb20ubWVzc2FnZUNvdW50IHx8IDAsXG5cdFx0XHR0czogcm9vbS5jcmVhdGVkQXQsXG5cdFx0XHRfdXBkYXRlZEF0OiByb29tLnVwZGF0ZWRBdCxcblx0XHRcdGxtOiByb29tLmxhc3RNb2RpZmllZEF0XG5cdFx0fTtcblx0fVxuXG5cdGNvbnZlcnRSb29tKHJvb20pIHtcblx0XHRpZiAoIXJvb20pIHtcblx0XHRcdHJldHVybiB1bmRlZmluZWQ7XG5cdFx0fVxuXG5cdFx0bGV0IGNyZWF0b3I7XG5cdFx0aWYgKHJvb20udSkge1xuXHRcdFx0Y3JlYXRvciA9IHRoaXMub3JjaC5nZXRDb252ZXJ0ZXJzKCkuZ2V0KCd1c2VycycpLmNvbnZlcnRCeUlkKHJvb20udS5faWQpO1xuXHRcdH1cblxuXHRcdHJldHVybiB7XG5cdFx0XHRpZDogcm9vbS5faWQsXG5cdFx0XHRkaXNwbGF5TmFtZTogcm9vbS5mbmFtZSxcblx0XHRcdHNsdWdpZmllZE5hbWU6IHJvb20ubmFtZSxcblx0XHRcdHR5cGU6IHRoaXMuX2NvbnZlcnRUeXBlVG9BcHAocm9vbS50KSxcblx0XHRcdGNyZWF0b3IsXG5cdFx0XHR1c2VybmFtZXM6IHJvb20udXNlcm5hbWVzLFxuXHRcdFx0aXNEZWZhdWx0OiB0eXBlb2Ygcm9vbS5kZWZhdWx0ID09PSAndW5kZWZpbmVkJyA/IGZhbHNlIDogcm9vbS5kZWZhdWx0LFxuXHRcdFx0aXNSZWFkT25seTogdHlwZW9mIHJvb20ucm8gPT09ICd1bmRlZmluZWQnID8gZmFsc2UgOiByb29tLnJvLFxuXHRcdFx0ZGlzcGxheVN5c3RlbU1lc3NhZ2VzOiB0eXBlb2Ygcm9vbS5zeXNNZXMgPT09ICd1bmRlZmluZWQnID8gdHJ1ZSA6IHJvb20uc3lzTWVzLFxuXHRcdFx0bWVzc2FnZUNvdW50OiByb29tLm1zZ3MsXG5cdFx0XHRjcmVhdGVkQXQ6IHJvb20udHMsXG5cdFx0XHR1cGRhdGVkQXQ6IHJvb20uX3VwZGF0ZWRBdCxcblx0XHRcdGxhc3RNb2RpZmllZEF0OiByb29tLmxtLFxuXHRcdFx0Y3VzdG9tRmllbGRzOiB7fVxuXHRcdH07XG5cdH1cblxuXHRfY29udmVydFR5cGVUb0FwcCh0eXBlQ2hhcikge1xuXHRcdHN3aXRjaCAodHlwZUNoYXIpIHtcblx0XHRcdGNhc2UgJ2MnOlxuXHRcdFx0XHRyZXR1cm4gUm9vbVR5cGUuQ0hBTk5FTDtcblx0XHRcdGNhc2UgJ3AnOlxuXHRcdFx0XHRyZXR1cm4gUm9vbVR5cGUuUFJJVkFURV9HUk9VUDtcblx0XHRcdGNhc2UgJ2QnOlxuXHRcdFx0XHRyZXR1cm4gUm9vbVR5cGUuRElSRUNUX01FU1NBR0U7XG5cdFx0XHRjYXNlICdsYyc6XG5cdFx0XHRcdHJldHVybiBSb29tVHlwZS5MSVZFX0NIQVQ7XG5cdFx0XHRkZWZhdWx0OlxuXHRcdFx0XHRyZXR1cm4gdHlwZUNoYXI7XG5cdFx0fVxuXHR9XG59XG4iLCJpbXBvcnQgeyBTZXR0aW5nVHlwZSB9IGZyb20gJ0Byb2NrZXQuY2hhdC9hcHBzLXRzLWRlZmluaXRpb24vc2V0dGluZ3MnO1xuXG5leHBvcnQgY2xhc3MgQXBwU2V0dGluZ3NDb252ZXJ0ZXIge1xuXHRjb25zdHJ1Y3RvcihvcmNoKSB7XG5cdFx0dGhpcy5vcmNoID0gb3JjaDtcblx0fVxuXG5cdGNvbnZlcnRCeUlkKHNldHRpbmdJZCkge1xuXHRcdGNvbnN0IHNldHRpbmcgPSBSb2NrZXRDaGF0Lm1vZGVscy5TZXR0aW5ncy5maW5kT25lQnlJZChzZXR0aW5nSWQpO1xuXG5cdFx0cmV0dXJuIHRoaXMuY29udmVydFRvQXBwKHNldHRpbmcpO1xuXHR9XG5cblx0Y29udmVydFRvQXBwKHNldHRpbmcpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0aWQ6IHNldHRpbmcuX2lkLFxuXHRcdFx0dHlwZTogdGhpcy5fY29udmVydFR5cGVUb0FwcChzZXR0aW5nLnR5cGUpLFxuXHRcdFx0cGFja2FnZVZhbHVlOiBzZXR0aW5nLnBhY2thZ2VWYWx1ZSxcblx0XHRcdHZhbHVlczogc2V0dGluZy52YWx1ZXMsXG5cdFx0XHR2YWx1ZTogc2V0dGluZy52YWx1ZSxcblx0XHRcdHB1YmxpYzogc2V0dGluZy5wdWJsaWMsXG5cdFx0XHRoaWRkZW46IHNldHRpbmcuaGlkZGVuLFxuXHRcdFx0Z3JvdXA6IHNldHRpbmcuZ3JvdXAsXG5cdFx0XHRpMThuTGFiZWw6IHNldHRpbmcuaTE4bkxhYmVsLFxuXHRcdFx0aTE4bkRlc2NyaXB0aW9uOiBzZXR0aW5nLmkxOG5EZXNjcmlwdGlvbixcblx0XHRcdGNyZWF0ZWRBdDogc2V0dGluZy50cyxcblx0XHRcdHVwZGF0ZWRBdDogc2V0dGluZy5fdXBkYXRlZEF0XG5cdFx0fTtcblx0fVxuXG5cdF9jb252ZXJ0VHlwZVRvQXBwKHR5cGUpIHtcblx0XHRzd2l0Y2ggKHR5cGUpIHtcblx0XHRcdGNhc2UgJ2Jvb2xlYW4nOlxuXHRcdFx0XHRyZXR1cm4gU2V0dGluZ1R5cGUuQk9PTEVBTjtcblx0XHRcdGNhc2UgJ2NvZGUnOlxuXHRcdFx0XHRyZXR1cm4gU2V0dGluZ1R5cGUuQ09ERTtcblx0XHRcdGNhc2UgJ2NvbG9yJzpcblx0XHRcdFx0cmV0dXJuIFNldHRpbmdUeXBlLkNPTE9SO1xuXHRcdFx0Y2FzZSAnZm9udCc6XG5cdFx0XHRcdHJldHVybiBTZXR0aW5nVHlwZS5GT05UO1xuXHRcdFx0Y2FzZSAnaW50Jzpcblx0XHRcdFx0cmV0dXJuIFNldHRpbmdUeXBlLk5VTUJFUjtcblx0XHRcdGNhc2UgJ3NlbGVjdCc6XG5cdFx0XHRcdHJldHVybiBTZXR0aW5nVHlwZS5TRUxFQ1Q7XG5cdFx0XHRjYXNlICdzdHJpbmcnOlxuXHRcdFx0XHRyZXR1cm4gU2V0dGluZ1R5cGUuU1RSSU5HO1xuXHRcdFx0ZGVmYXVsdDpcblx0XHRcdFx0cmV0dXJuIHR5cGU7XG5cdFx0fVxuXHR9XG59XG4iLCJpbXBvcnQgeyBVc2VyU3RhdHVzQ29ubmVjdGlvbiwgVXNlclR5cGUgfSBmcm9tICdAcm9ja2V0LmNoYXQvYXBwcy10cy1kZWZpbml0aW9uL3VzZXJzJztcblxuZXhwb3J0IGNsYXNzIEFwcFVzZXJzQ29udmVydGVyIHtcblx0Y29uc3RydWN0b3Iob3JjaCkge1xuXHRcdHRoaXMub3JjaCA9IG9yY2g7XG5cdH1cblxuXHRjb252ZXJ0QnlJZCh1c2VySWQpIHtcblx0XHRjb25zdCB1c2VyID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZE9uZUJ5SWQodXNlcklkKTtcblxuXHRcdHJldHVybiB0aGlzLmNvbnZlcnRUb0FwcCh1c2VyKTtcblx0fVxuXG5cdGNvbnZlcnRCeVVzZXJuYW1lKHVzZXJuYW1lKSB7XG5cdFx0Y29uc3QgdXNlciA9IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmVCeVVzZXJuYW1lKHVzZXJuYW1lKTtcblxuXHRcdHJldHVybiB0aGlzLmNvbnZlcnRUb0FwcCh1c2VyKTtcblx0fVxuXG5cdGNvbnZlcnRUb0FwcCh1c2VyKSB7XG5cdFx0aWYgKCF1c2VyKSB7XG5cdFx0XHRyZXR1cm4gdW5kZWZpbmVkO1xuXHRcdH1cblxuXHRcdGNvbnN0IHR5cGUgPSB0aGlzLl9jb252ZXJ0VXNlclR5cGVUb0VudW0odXNlci50eXBlKTtcblx0XHRjb25zdCBzdGF0dXNDb25uZWN0aW9uID0gdGhpcy5fY29udmVydFN0YXR1c0Nvbm5lY3Rpb25Ub0VudW0odXNlci51c2VybmFtZSwgdXNlci5faWQsIHVzZXIuc3RhdHVzQ29ubmVjdGlvbik7XG5cblx0XHRyZXR1cm4ge1xuXHRcdFx0aWQ6IHVzZXIuX2lkLFxuXHRcdFx0dXNlcm5hbWU6IHVzZXIudXNlcm5hbWUsXG5cdFx0XHRlbWFpbHM6IHVzZXIuZW1haWxzLFxuXHRcdFx0dHlwZSxcblx0XHRcdGlzRW5hYmxlZDogdXNlci5hY3RpdmUsXG5cdFx0XHRuYW1lOiB1c2VyLm5hbWUsXG5cdFx0XHRyb2xlczogdXNlci5yb2xlcyxcblx0XHRcdHN0YXR1czogdXNlci5zdGF0dXMsXG5cdFx0XHRzdGF0dXNDb25uZWN0aW9uLFxuXHRcdFx0dXRjT2Zmc2V0OiB1c2VyLnV0Y09mZnNldCxcblx0XHRcdGNyZWF0ZWRBdDogdXNlci5jcmVhdGVkQXQsXG5cdFx0XHR1cGRhdGVkQXQ6IHVzZXIuX3VwZGF0ZWRBdCxcblx0XHRcdGxhc3RMb2dpbkF0OiB1c2VyLmxhc3RMb2dpblxuXHRcdH07XG5cdH1cblxuXHRfY29udmVydFVzZXJUeXBlVG9FbnVtKHR5cGUpIHtcblx0XHRzd2l0Y2ggKHR5cGUpIHtcblx0XHRcdGNhc2UgJ3VzZXInOlxuXHRcdFx0XHRyZXR1cm4gVXNlclR5cGUuVVNFUjtcblx0XHRcdGNhc2UgJ2JvdCc6XG5cdFx0XHRcdHJldHVybiBVc2VyVHlwZS5CT1Q7XG5cdFx0XHRjYXNlICcnOlxuXHRcdFx0Y2FzZSB1bmRlZmluZWQ6XG5cdFx0XHRcdHJldHVybiBVc2VyVHlwZS5VTktOT1dOO1xuXHRcdFx0ZGVmYXVsdDpcblx0XHRcdFx0Y29uc29sZS53YXJuKGBBIG5ldyB1c2VyIHR5cGUgaGFzIGJlZW4gYWRkZWQgdGhhdCB0aGUgQXBwcyBkb24ndCBrbm93IGFib3V0PyBcIiR7IHR5cGUgfVwiYCk7XG5cdFx0XHRcdHJldHVybiB0eXBlLnRvVXBwZXJDYXNlKCk7XG5cdFx0fVxuXHR9XG5cblx0X2NvbnZlcnRTdGF0dXNDb25uZWN0aW9uVG9FbnVtKHVzZXJuYW1lLCB1c2VySWQsIHN0YXR1cykge1xuXHRcdHN3aXRjaCAoc3RhdHVzKSB7XG5cdFx0XHRjYXNlICdvZmZsaW5lJzpcblx0XHRcdFx0cmV0dXJuIFVzZXJTdGF0dXNDb25uZWN0aW9uLk9GRkxJTkU7XG5cdFx0XHRjYXNlICdvbmxpbmUnOlxuXHRcdFx0XHRyZXR1cm4gVXNlclN0YXR1c0Nvbm5lY3Rpb24uT05MSU5FO1xuXHRcdFx0Y2FzZSAnYXdheSc6XG5cdFx0XHRcdHJldHVybiBVc2VyU3RhdHVzQ29ubmVjdGlvbi5BV0FZO1xuXHRcdFx0Y2FzZSAnYnVzeSc6XG5cdFx0XHRcdHJldHVybiBVc2VyU3RhdHVzQ29ubmVjdGlvbi5CVVNZO1xuXHRcdFx0Y2FzZSB1bmRlZmluZWQ6XG5cdFx0XHRcdC8vIFRoaXMgaXMgbmVlZGVkIGZvciBMaXZlY2hhdCBndWVzdHMgYW5kIFJvY2tldC5DYXQgdXNlci5cblx0XHRcdFx0cmV0dXJuIFVzZXJTdGF0dXNDb25uZWN0aW9uLlVOREVGSU5FRDtcblx0XHRcdGRlZmF1bHQ6XG5cdFx0XHRcdGNvbnNvbGUud2FybihgVGhlIHVzZXIgJHsgdXNlcm5hbWUgfSAoJHsgdXNlcklkIH0pIGRvZXMgbm90IGhhdmUgYSB2YWxpZCBzdGF0dXMgKG9mZmxpbmUsIG9ubGluZSwgYXdheSwgb3IgYnVzeSkuIEl0IGlzIGN1cnJlbnRseTogXCIkeyBzdGF0dXMgfVwiYCk7XG5cdFx0XHRcdHJldHVybiAhc3RhdHVzID8gVXNlclN0YXR1c0Nvbm5lY3Rpb24uT0ZGTElORSA6IHN0YXR1cy50b1VwcGVyQ2FzZSgpO1xuXHRcdH1cblx0fVxufVxuIiwiaW1wb3J0IHsgQXBwTWVzc2FnZXNDb252ZXJ0ZXIgfSBmcm9tICcuL21lc3NhZ2VzJztcbmltcG9ydCB7IEFwcFJvb21zQ29udmVydGVyIH0gZnJvbSAnLi9yb29tcyc7XG5pbXBvcnQgeyBBcHBTZXR0aW5nc0NvbnZlcnRlciB9IGZyb20gJy4vc2V0dGluZ3MnO1xuaW1wb3J0IHsgQXBwVXNlcnNDb252ZXJ0ZXIgfSBmcm9tICcuL3VzZXJzJztcblxuZXhwb3J0IHtcblx0QXBwTWVzc2FnZXNDb252ZXJ0ZXIsXG5cdEFwcFJvb21zQ29udmVydGVyLFxuXHRBcHBTZXR0aW5nc0NvbnZlcnRlcixcblx0QXBwVXNlcnNDb252ZXJ0ZXJcbn07XG4iLCJpbXBvcnQgeyBSZWFsQXBwQnJpZGdlcyB9IGZyb20gJy4vYnJpZGdlcyc7XG5pbXBvcnQgeyBBcHBNZXRob2RzLCBBcHBzUmVzdEFwaSwgQXBwU2VydmVyTm90aWZpZXIgfSBmcm9tICcuL2NvbW11bmljYXRpb24nO1xuaW1wb3J0IHsgQXBwTWVzc2FnZXNDb252ZXJ0ZXIsIEFwcFJvb21zQ29udmVydGVyLCBBcHBTZXR0aW5nc0NvbnZlcnRlciwgQXBwVXNlcnNDb252ZXJ0ZXIgfSBmcm9tICcuL2NvbnZlcnRlcnMnO1xuaW1wb3J0IHsgQXBwc0xvZ3NNb2RlbCwgQXBwc01vZGVsLCBBcHBzUGVyc2lzdGVuY2VNb2RlbCwgQXBwUmVhbFN0b3JhZ2UsIEFwcFJlYWxMb2dzU3RvcmFnZSB9IGZyb20gJy4vc3RvcmFnZSc7XG5cbmltcG9ydCB7IEFwcE1hbmFnZXIgfSBmcm9tICdAcm9ja2V0LmNoYXQvYXBwcy1lbmdpbmUvc2VydmVyL0FwcE1hbmFnZXInO1xuXG5jbGFzcyBBcHBTZXJ2ZXJPcmNoZXN0cmF0b3Ige1xuXHRjb25zdHJ1Y3RvcigpIHtcblx0XHRpZiAoUm9ja2V0Q2hhdC5tb2RlbHMgJiYgUm9ja2V0Q2hhdC5tb2RlbHMuUGVybWlzc2lvbnMpIHtcblx0XHRcdFJvY2tldENoYXQubW9kZWxzLlBlcm1pc3Npb25zLmNyZWF0ZU9yVXBkYXRlKCdtYW5hZ2UtYXBwcycsIFsnYWRtaW4nXSk7XG5cdFx0fVxuXG5cdFx0dGhpcy5fbW9kZWwgPSBuZXcgQXBwc01vZGVsKCk7XG5cdFx0dGhpcy5fbG9nTW9kZWwgPSBuZXcgQXBwc0xvZ3NNb2RlbCgpO1xuXHRcdHRoaXMuX3BlcnNpc3RNb2RlbCA9IG5ldyBBcHBzUGVyc2lzdGVuY2VNb2RlbCgpO1xuXHRcdHRoaXMuX3N0b3JhZ2UgPSBuZXcgQXBwUmVhbFN0b3JhZ2UodGhpcy5fbW9kZWwpO1xuXHRcdHRoaXMuX2xvZ1N0b3JhZ2UgPSBuZXcgQXBwUmVhbExvZ3NTdG9yYWdlKHRoaXMuX2xvZ01vZGVsKTtcblxuXHRcdHRoaXMuX2NvbnZlcnRlcnMgPSBuZXcgTWFwKCk7XG5cdFx0dGhpcy5fY29udmVydGVycy5zZXQoJ21lc3NhZ2VzJywgbmV3IEFwcE1lc3NhZ2VzQ29udmVydGVyKHRoaXMpKTtcblx0XHR0aGlzLl9jb252ZXJ0ZXJzLnNldCgncm9vbXMnLCBuZXcgQXBwUm9vbXNDb252ZXJ0ZXIodGhpcykpO1xuXHRcdHRoaXMuX2NvbnZlcnRlcnMuc2V0KCdzZXR0aW5ncycsIG5ldyBBcHBTZXR0aW5nc0NvbnZlcnRlcih0aGlzKSk7XG5cdFx0dGhpcy5fY29udmVydGVycy5zZXQoJ3VzZXJzJywgbmV3IEFwcFVzZXJzQ29udmVydGVyKHRoaXMpKTtcblxuXHRcdHRoaXMuX2JyaWRnZXMgPSBuZXcgUmVhbEFwcEJyaWRnZXModGhpcyk7XG5cblx0XHR0aGlzLl9tYW5hZ2VyID0gbmV3IEFwcE1hbmFnZXIodGhpcy5fc3RvcmFnZSwgdGhpcy5fbG9nU3RvcmFnZSwgdGhpcy5fYnJpZGdlcyk7XG5cblx0XHR0aGlzLl9jb21tdW5pY2F0b3JzID0gbmV3IE1hcCgpO1xuXHRcdHRoaXMuX2NvbW11bmljYXRvcnMuc2V0KCdtZXRob2RzJywgbmV3IEFwcE1ldGhvZHModGhpcy5fbWFuYWdlcikpO1xuXHRcdHRoaXMuX2NvbW11bmljYXRvcnMuc2V0KCdub3RpZmllcicsIG5ldyBBcHBTZXJ2ZXJOb3RpZmllcih0aGlzKSk7XG5cdFx0dGhpcy5fY29tbXVuaWNhdG9ycy5zZXQoJ3Jlc3RhcGknLCBuZXcgQXBwc1Jlc3RBcGkodGhpcywgdGhpcy5fbWFuYWdlcikpO1xuXHR9XG5cblx0Z2V0TW9kZWwoKSB7XG5cdFx0cmV0dXJuIHRoaXMuX21vZGVsO1xuXHR9XG5cblx0Z2V0UGVyc2lzdGVuY2VNb2RlbCgpIHtcblx0XHRyZXR1cm4gdGhpcy5fcGVyc2lzdE1vZGVsO1xuXHR9XG5cblx0Z2V0U3RvcmFnZSgpIHtcblx0XHRyZXR1cm4gdGhpcy5fc3RvcmFnZTtcblx0fVxuXG5cdGdldExvZ1N0b3JhZ2UoKSB7XG5cdFx0cmV0dXJuIHRoaXMuX2xvZ1N0b3JhZ2U7XG5cdH1cblxuXHRnZXRDb252ZXJ0ZXJzKCkge1xuXHRcdHJldHVybiB0aGlzLl9jb252ZXJ0ZXJzO1xuXHR9XG5cblx0Z2V0QnJpZGdlcygpIHtcblx0XHRyZXR1cm4gdGhpcy5fYnJpZGdlcztcblx0fVxuXG5cdGdldE5vdGlmaWVyKCkge1xuXHRcdHJldHVybiB0aGlzLl9jb21tdW5pY2F0b3JzLmdldCgnbm90aWZpZXInKTtcblx0fVxuXG5cdGdldE1hbmFnZXIoKSB7XG5cdFx0cmV0dXJuIHRoaXMuX21hbmFnZXI7XG5cdH1cblxuXHRpc0VuYWJsZWQoKSB7XG5cdFx0cmV0dXJuIHRydWU7XG5cdH1cblxuXHRpc0xvYWRlZCgpIHtcblx0XHRyZXR1cm4gdGhpcy5nZXRNYW5hZ2VyKCkuYXJlQXBwc0xvYWRlZCgpO1xuXHR9XG59XG5cbk1ldGVvci5zdGFydHVwKGZ1bmN0aW9uIF9hcHBTZXJ2ZXJPcmNoZXN0cmF0b3IoKSB7XG5cdC8vIEVuc3VyZSB0aGF0IGV2ZXJ5dGhpbmcgaXMgc2V0dXBcblx0aWYgKHByb2Nlc3MuZW52W0FwcE1hbmFnZXIuRU5WX1ZBUl9OQU1FX0ZPUl9FTkFCTElOR10gIT09ICd0cnVlJyAmJiBwcm9jZXNzLmVudltBcHBNYW5hZ2VyLlNVUEVSX0ZVTl9FTlZfRU5BQkxFTUVOVF9OQU1FXSAhPT0gJ3RydWUnKSB7XG5cdFx0Z2xvYmFsLkFwcHMgPSBuZXcgQXBwTWV0aG9kcygpO1xuXHRcdHJldHVybjtcblx0fVxuXG5cdGNvbnNvbGUubG9nKCdPcmNoZXN0cmF0aW5nIHRoZSBhcHAgcGllY2UuLi4nKTtcblx0Z2xvYmFsLkFwcHMgPSBuZXcgQXBwU2VydmVyT3JjaGVzdHJhdG9yKCk7XG5cblx0Z2xvYmFsLkFwcHMuZ2V0TWFuYWdlcigpLmxvYWQoKVxuXHRcdC50aGVuKChhZmZzKSA9PiBjb25zb2xlLmxvZyhgLi4uZG9uZSBsb2FkaW5nICR7IGFmZnMubGVuZ3RoIH0hIDspYCkpXG5cdFx0LmNhdGNoKChlcnIpID0+IGNvbnNvbGUud2FybignLi4uZmFpbGVkIScsIGVycikpO1xufSk7XG4iXX0=
