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

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:mentions":{"server":{"server.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                 //
// packages/rocketchat_mentions/server/server.js                                                                   //
//                                                                                                                 //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                   //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
let MentionsServer;
module.watch(require("./Mentions"), {
  default(v) {
    MentionsServer = v;
  }

}, 1);
const mention = new MentionsServer({
  pattern: () => RocketChat.settings.get('UTF8_Names_Validation'),
  messageMaxAll: () => RocketChat.settings.get('Message_MaxAll'),
  getUsers: usernames => Meteor.users.find({
    username: {
      $in: _.unique(usernames)
    }
  }, {
    fields: {
      _id: true,
      username: true
    }
  }).fetch(),
  getChannel: rid => RocketChat.models.Rooms.findOneById(rid),
  getChannels: channels => RocketChat.models.Rooms.find({
    name: {
      $in: _.unique(channels)
    },
    t: 'c'
  }, {
    fields: {
      _id: 1,
      name: 1
    }
  }).fetch()
});
RocketChat.callbacks.add('beforeSaveMessage', message => mention.execute(message), RocketChat.callbacks.priority.HIGH, 'mentions');
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"methods":{"getUserMentionsByChannel.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                 //
// packages/rocketchat_mentions/server/methods/getUserMentionsByChannel.js                                         //
//                                                                                                                 //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                   //
Meteor.methods({
  getUserMentionsByChannel({
    roomId,
    options
  }) {
    check(roomId, String);

    if (!Meteor.userId()) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'getUserMentionsByChannel'
      });
    }

    const room = RocketChat.models.Rooms.findOneById(roomId);

    if (!room) {
      throw new Meteor.Error('error-invalid-room', 'Invalid room', {
        method: 'getUserMentionsByChannel'
      });
    }

    const user = RocketChat.models.Users.findOneById(Meteor.userId());
    return RocketChat.models.Messages.findVisibleByMentionAndRoomId(user.username, roomId, options).fetch();
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"Mentions.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                 //
// packages/rocketchat_mentions/server/Mentions.js                                                                 //
//                                                                                                                 //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                   //
module.export({
  default: () => MentionsServer
});
let Mentions;
module.watch(require("../Mentions"), {
  default(v) {
    Mentions = v;
  }

}, 0);

class MentionsServer extends Mentions {
  constructor(args) {
    super(args);
    this.messageMaxAll = args.messageMaxAll;
    this.getChannel = args.getChannel;
    this.getChannels = args.getChannels;
    this.getUsers = args.getUsers;
  }

  set getUsers(m) {
    this._getUsers = m;
  }

  get getUsers() {
    return typeof this._getUsers === 'function' ? this._getUsers : () => this._getUsers;
  }

  set getChannels(m) {
    this._getChannels = m;
  }

  get getChannels() {
    return typeof this._getChannels === 'function' ? this._getChannels : () => this._getChannels;
  }

  set getChannel(m) {
    this._getChannel = m;
  }

  get getChannel() {
    return typeof this._getChannel === 'function' ? this._getChannel : () => this._getChannel;
  }

  set messageMaxAll(m) {
    this._messageMaxAll = m;
  }

  get messageMaxAll() {
    return typeof this._messageMaxAll === 'function' ? this._messageMaxAll() : this._messageMaxAll;
  }

  getUsersByMentions({
    msg,
    rid
  }) {
    let mentions = this.getUserMentions(msg);
    const mentionsAll = [];
    const userMentions = [];
    mentions.forEach(m => {
      const mention = m.trim().substr(1);

      if (mention !== 'all' && mention !== 'here') {
        return userMentions.push(mention);
      }

      if (mention === 'all') {
        const messageMaxAll = this.messageMaxAll;
        const allChannel = this.getChannel(rid);

        if (messageMaxAll !== 0 && allChannel.usernames.length >= messageMaxAll) {
          return;
        }
      }

      mentionsAll.push({
        _id: mention,
        username: mention
      });
    });
    mentions = userMentions.length ? this.getUsers(userMentions) : [];
    return [...mentionsAll, ...mentions];
  }

  getChannelbyMentions({
    msg
  }) {
    const channels = this.getChannelMentions(msg);
    return this.getChannels(channels.map(c => c.trim().substr(1)));
  }

  execute(message) {
    const mentionsAll = this.getUsersByMentions(message);
    const channels = this.getChannelbyMentions(message);
    message.mentions = mentionsAll;
    message.channels = channels;
    return message;
  }

}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"Mentions.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                 //
// packages/rocketchat_mentions/Mentions.js                                                                        //
//                                                                                                                 //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                   //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
module.exportDefault(class {
  constructor({
    pattern,
    useRealName,
    me
  }) {
    this.pattern = pattern;
    this.useRealName = useRealName;
    this.me = me;
  }

  set me(m) {
    this._me = m;
  }

  get me() {
    return typeof this._me === 'function' ? this._me() : this._me;
  }

  set pattern(p) {
    this._pattern = p;
  }

  get pattern() {
    return typeof this._pattern === 'function' ? this._pattern() : this._pattern;
  }

  set useRealName(s) {
    this._useRealName = s;
  }

  get useRealName() {
    return typeof this._useRealName === 'function' ? this._useRealName() : this._useRealName;
  }

  get userMentionRegex() {
    return new RegExp(`@(${this.pattern})`, 'gm');
  }

  get channelMentionRegex() {
    return new RegExp(`^#(${this.pattern})| #(${this.pattern})`, 'gm');
  }

  replaceUsers(str, message, me) {
    return str.replace(this.userMentionRegex, (match, username) => {
      if (['all', 'here'].includes(username)) {
        return `<a class="mention-link mention-link-me mention-link-all background-attention-color">${match}</a>`;
      }

      const mentionObj = _.findWhere(message.mentions, {
        username
      });

      if (message.temp == null && mentionObj == null) {
        return match;
      }

      const name = this.useRealName && mentionObj && mentionObj.name;
      return `<a class="mention-link ${username === me ? 'mention-link-me background-primary-action-color' : ''}" data-username="${username}" title="${name ? username : ''}">${name || match}</a>`;
    });
  }

  replaceChannels(str, message) {
    //since apostrophe escaped contains # we need to unescape it
    return str.replace(/&#39;/g, '\'').replace(this.channelMentionRegex, (match, n1, n2) => {
      const name = n1 || n2;

      if (message.temp == null && _.findWhere(message.channels, {
        name
      }) == null) {
        return match;
      } // remove the link from inside the link and put before


      if (/^\s/.test(match)) {
        return ` <a class="mention-link" data-channel="${name}">${match.trim()}</a>`;
      }

      return `<a class="mention-link" data-channel="${name}">${match}</a>`;
    });
  }

  getUserMentions(str) {
    return str.match(this.userMentionRegex) || [];
  }

  getChannelMentions(str) {
    return (str.match(this.channelMentionRegex) || []).map(match => match.trim());
  }

  parse(message) {
    let msg = message && message.html || '';

    if (!msg.trim()) {
      return message;
    }

    msg = this.replaceUsers(msg, message, this.me);
    msg = this.replaceChannels(msg, message, this.me);
    message.html = msg;
    return message;
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:mentions/server/server.js");
require("/node_modules/meteor/rocketchat:mentions/server/methods/getUserMentionsByChannel.js");

/* Exports */
Package._define("rocketchat:mentions");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_mentions.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDptZW50aW9ucy9zZXJ2ZXIvc2VydmVyLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0Om1lbnRpb25zL3NlcnZlci9tZXRob2RzL2dldFVzZXJNZW50aW9uc0J5Q2hhbm5lbC5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDptZW50aW9ucy9zZXJ2ZXIvTWVudGlvbnMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bWVudGlvbnMvTWVudGlvbnMuanMiXSwibmFtZXMiOlsiXyIsIm1vZHVsZSIsIndhdGNoIiwicmVxdWlyZSIsImRlZmF1bHQiLCJ2IiwiTWVudGlvbnNTZXJ2ZXIiLCJtZW50aW9uIiwicGF0dGVybiIsIlJvY2tldENoYXQiLCJzZXR0aW5ncyIsImdldCIsIm1lc3NhZ2VNYXhBbGwiLCJnZXRVc2VycyIsInVzZXJuYW1lcyIsIk1ldGVvciIsInVzZXJzIiwiZmluZCIsInVzZXJuYW1lIiwiJGluIiwidW5pcXVlIiwiZmllbGRzIiwiX2lkIiwiZmV0Y2giLCJnZXRDaGFubmVsIiwicmlkIiwibW9kZWxzIiwiUm9vbXMiLCJmaW5kT25lQnlJZCIsImdldENoYW5uZWxzIiwiY2hhbm5lbHMiLCJuYW1lIiwidCIsImNhbGxiYWNrcyIsImFkZCIsIm1lc3NhZ2UiLCJleGVjdXRlIiwicHJpb3JpdHkiLCJISUdIIiwibWV0aG9kcyIsImdldFVzZXJNZW50aW9uc0J5Q2hhbm5lbCIsInJvb21JZCIsIm9wdGlvbnMiLCJjaGVjayIsIlN0cmluZyIsInVzZXJJZCIsIkVycm9yIiwibWV0aG9kIiwicm9vbSIsInVzZXIiLCJVc2VycyIsIk1lc3NhZ2VzIiwiZmluZFZpc2libGVCeU1lbnRpb25BbmRSb29tSWQiLCJleHBvcnQiLCJNZW50aW9ucyIsImNvbnN0cnVjdG9yIiwiYXJncyIsIm0iLCJfZ2V0VXNlcnMiLCJfZ2V0Q2hhbm5lbHMiLCJfZ2V0Q2hhbm5lbCIsIl9tZXNzYWdlTWF4QWxsIiwiZ2V0VXNlcnNCeU1lbnRpb25zIiwibXNnIiwibWVudGlvbnMiLCJnZXRVc2VyTWVudGlvbnMiLCJtZW50aW9uc0FsbCIsInVzZXJNZW50aW9ucyIsImZvckVhY2giLCJ0cmltIiwic3Vic3RyIiwicHVzaCIsImFsbENoYW5uZWwiLCJsZW5ndGgiLCJnZXRDaGFubmVsYnlNZW50aW9ucyIsImdldENoYW5uZWxNZW50aW9ucyIsIm1hcCIsImMiLCJleHBvcnREZWZhdWx0IiwidXNlUmVhbE5hbWUiLCJtZSIsIl9tZSIsInAiLCJfcGF0dGVybiIsInMiLCJfdXNlUmVhbE5hbWUiLCJ1c2VyTWVudGlvblJlZ2V4IiwiUmVnRXhwIiwiY2hhbm5lbE1lbnRpb25SZWdleCIsInJlcGxhY2VVc2VycyIsInN0ciIsInJlcGxhY2UiLCJtYXRjaCIsImluY2x1ZGVzIiwibWVudGlvbk9iaiIsImZpbmRXaGVyZSIsInRlbXAiLCJyZXBsYWNlQ2hhbm5lbHMiLCJuMSIsIm4yIiwidGVzdCIsInBhcnNlIiwiaHRtbCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLElBQUlBLENBQUo7O0FBQU1DLE9BQU9DLEtBQVAsQ0FBYUMsUUFBUSxZQUFSLENBQWIsRUFBbUM7QUFBQ0MsVUFBUUMsQ0FBUixFQUFVO0FBQUNMLFFBQUVLLENBQUY7QUFBSTs7QUFBaEIsQ0FBbkMsRUFBcUQsQ0FBckQ7QUFBd0QsSUFBSUMsY0FBSjtBQUFtQkwsT0FBT0MsS0FBUCxDQUFhQyxRQUFRLFlBQVIsQ0FBYixFQUFtQztBQUFDQyxVQUFRQyxDQUFSLEVBQVU7QUFBQ0MscUJBQWVELENBQWY7QUFBaUI7O0FBQTdCLENBQW5DLEVBQWtFLENBQWxFO0FBR2pGLE1BQU1FLFVBQVUsSUFBSUQsY0FBSixDQUFtQjtBQUNsQ0UsV0FBUyxNQUFNQyxXQUFXQyxRQUFYLENBQW9CQyxHQUFwQixDQUF3Qix1QkFBeEIsQ0FEbUI7QUFFbEND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QUFnQyxLQUFLNkMsRUFBckMsQ0FBTjtBQUNBakIsVUFBTSxLQUFLa0MsZUFBTCxDQUFxQmxDLEdBQXJCLEVBQTBCNUIsT0FBMUIsRUFBbUMsS0FBSzZDLEVBQXhDLENBQU47QUFDQTdDLFlBQVFtRSxJQUFSLEdBQWV2QyxHQUFmO0FBQ0EsV0FBTzVCLE9BQVA7QUFDQTs7QUE1RW1CLENBTHJCLEUiLCJmaWxlIjoiL3BhY2thZ2VzL3JvY2tldGNoYXRfbWVudGlvbnMuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgXyBmcm9tICd1bmRlcnNjb3JlJztcbmltcG9ydCBNZW50aW9uc1NlcnZlciBmcm9tICcuL01lbnRpb25zJztcblxuY29uc3QgbWVudGlvbiA9IG5ldyBNZW50aW9uc1NlcnZlcih7XG5cdHBhdHRlcm46ICgpID0+IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdVVEY4X05hbWVzX1ZhbGlkYXRpb24nKSxcblx0bWVzc2FnZU1heEFsbDogKCkgPT4gUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ01lc3NhZ2VfTWF4QWxsJyksXG5cdGdldFVzZXJzOiAodXNlcm5hbWVzKSA9PiBNZXRlb3IudXNlcnMuZmluZCh7IHVzZXJuYW1lOiB7JGluOiBfLnVuaXF1ZSh1c2VybmFtZXMpfX0sIHsgZmllbGRzOiB7X2lkOiB0cnVlLCB1c2VybmFtZTogdHJ1ZSB9fSkuZmV0Y2goKSxcblx0Z2V0Q2hhbm5lbDogKHJpZCkgPT4gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9uZUJ5SWQocmlkKSxcblx0Z2V0Q2hhbm5lbHM6IChjaGFubmVscykgPT4gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZCh7IG5hbWU6IHskaW46IF8udW5pcXVlKGNoYW5uZWxzKX0sIHQ6ICdjJ1x0fSwgeyBmaWVsZHM6IHtfaWQ6IDEsIG5hbWU6IDEgfX0pLmZldGNoKClcbn0pO1xuUm9ja2V0Q2hhdC5jYWxsYmFja3MuYWRkKCdiZWZvcmVTYXZlTWVzc2FnZScsIChtZXNzYWdlKSA9PiBtZW50aW9uLmV4ZWN1dGUobWVzc2FnZSksIFJvY2tldENoYXQuY2FsbGJhY2tzLnByaW9yaXR5LkhJR0gsICdtZW50aW9ucycpO1xuIiwiTWV0ZW9yLm1ldGhvZHMoe1xuXHRnZXRVc2VyTWVudGlvbnNCeUNoYW5uZWwoeyByb29tSWQsIG9wdGlvbnMgfSkge1xuXHRcdGNoZWNrKHJvb21JZCwgU3RyaW5nKTtcblxuXHRcdGlmICghTWV0ZW9yLnVzZXJJZCgpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLXVzZXInLCAnSW52YWxpZCB1c2VyJywgeyBtZXRob2Q6ICdnZXRVc2VyTWVudGlvbnNCeUNoYW5uZWwnIH0pO1xuXHRcdH1cblxuXHRcdGNvbnN0IHJvb20gPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT25lQnlJZChyb29tSWQpO1xuXG5cdFx0aWYgKCFyb29tKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLXJvb20nLCAnSW52YWxpZCByb29tJywgeyBtZXRob2Q6ICdnZXRVc2VyTWVudGlvbnNCeUNoYW5uZWwnIH0pO1xuXHRcdH1cblxuXHRcdGNvbnN0IHVzZXIgPSBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kT25lQnlJZChNZXRlb3IudXNlcklkKCkpO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQubW9kZWxzLk1lc3NhZ2VzLmZpbmRWaXNpYmxlQnlNZW50aW9uQW5kUm9vbUlkKHVzZXIudXNlcm5hbWUsIHJvb21JZCwgb3B0aW9ucykuZmV0Y2goKTtcblx0fVxufSk7XG4iLCIvKlxuKiBNZW50aW9ucyBpcyBhIG5hbWVkIGZ1bmN0aW9uIHRoYXQgd2lsbCBwcm9jZXNzIE1lbnRpb25zXG4qIEBwYXJhbSB7T2JqZWN0fSBtZXNzYWdlIC0gVGhlIG1lc3NhZ2Ugb2JqZWN0XG4qL1xuaW1wb3J0IE1lbnRpb25zIGZyb20gJy4uL01lbnRpb25zJztcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIE1lbnRpb25zU2VydmVyIGV4dGVuZHMgTWVudGlvbnMge1xuXHRjb25zdHJ1Y3RvcihhcmdzKSB7XG5cdFx0c3VwZXIoYXJncyk7XG5cdFx0dGhpcy5tZXNzYWdlTWF4QWxsID0gYXJncy5tZXNzYWdlTWF4QWxsO1xuXHRcdHRoaXMuZ2V0Q2hhbm5lbCA9IGFyZ3MuZ2V0Q2hhbm5lbDtcblx0XHR0aGlzLmdldENoYW5uZWxzID0gYXJncy5nZXRDaGFubmVscztcblx0XHR0aGlzLmdldFVzZXJzID0gYXJncy5nZXRVc2Vycztcblx0fVxuXHRzZXQgZ2V0VXNlcnMobSkge1xuXHRcdHRoaXMuX2dldFVzZXJzID0gbTtcblx0fVxuXHRnZXQgZ2V0VXNlcnMoKSB7XG5cdFx0cmV0dXJuIHR5cGVvZiB0aGlzLl9nZXRVc2VycyA9PT0gJ2Z1bmN0aW9uJyA/IHRoaXMuX2dldFVzZXJzIDogKCkgPT4gdGhpcy5fZ2V0VXNlcnM7XG5cdH1cblx0c2V0IGdldENoYW5uZWxzKG0pIHtcblx0XHR0aGlzLl9nZXRDaGFubmVscyA9IG07XG5cdH1cblx0Z2V0IGdldENoYW5uZWxzKCkge1xuXHRcdHJldHVybiB0eXBlb2YgdGhpcy5fZ2V0Q2hhbm5lbHMgPT09ICdmdW5jdGlvbicgPyB0aGlzLl9nZXRDaGFubmVscyA6ICgpID0+IHRoaXMuX2dldENoYW5uZWxzO1xuXHR9XG5cdHNldCBnZXRDaGFubmVsKG0pIHtcblx0XHR0aGlzLl9nZXRDaGFubmVsID0gbTtcblx0fVxuXHRnZXQgZ2V0Q2hhbm5lbCgpIHtcblx0XHRyZXR1cm4gdHlwZW9mIHRoaXMuX2dldENoYW5uZWwgPT09ICdmdW5jdGlvbicgPyB0aGlzLl9nZXRDaGFubmVsIDogKCkgPT4gdGhpcy5fZ2V0Q2hhbm5lbDtcblx0fVxuXHRzZXQgbWVzc2FnZU1heEFsbChtKSB7XG5cdFx0dGhpcy5fbWVzc2FnZU1heEFsbCA9IG07XG5cdH1cblx0Z2V0IG1lc3NhZ2VNYXhBbGwoKSB7XG5cdFx0cmV0dXJuIHR5cGVvZiB0aGlzLl9tZXNzYWdlTWF4QWxsID09PSAnZnVuY3Rpb24nID8gdGhpcy5fbWVzc2FnZU1heEFsbCgpIDogdGhpcy5fbWVzc2FnZU1heEFsbDtcblx0fVxuXHRnZXRVc2Vyc0J5TWVudGlvbnMoe21zZywgcmlkfSkge1xuXHRcdGxldCBtZW50aW9ucyA9IHRoaXMuZ2V0VXNlck1lbnRpb25zKG1zZyk7XG5cdFx0Y29uc3QgbWVudGlvbnNBbGwgPSBbXTtcblx0XHRjb25zdCB1c2VyTWVudGlvbnMgPSBbXTtcblxuXHRcdG1lbnRpb25zLmZvckVhY2goKG0pID0+IHtcblx0XHRcdGNvbnN0IG1lbnRpb24gPSBtLnRyaW0oKS5zdWJzdHIoMSk7XG5cdFx0XHRpZiAobWVudGlvbiAhPT0gJ2FsbCcgJiYgbWVudGlvbiAhPT0gJ2hlcmUnKSB7XG5cdFx0XHRcdHJldHVybiB1c2VyTWVudGlvbnMucHVzaChtZW50aW9uKTtcblx0XHRcdH1cblx0XHRcdGlmIChtZW50aW9uID09PSAnYWxsJykge1xuXHRcdFx0XHRjb25zdCBtZXNzYWdlTWF4QWxsID0gdGhpcy5tZXNzYWdlTWF4QWxsO1xuXHRcdFx0XHRjb25zdCBhbGxDaGFubmVsID0gdGhpcy5nZXRDaGFubmVsKHJpZCk7XG5cdFx0XHRcdGlmIChtZXNzYWdlTWF4QWxsICE9PSAwICYmIGFsbENoYW5uZWwudXNlcm5hbWVzLmxlbmd0aCA+PSBtZXNzYWdlTWF4QWxsKSB7XG5cdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRtZW50aW9uc0FsbC5wdXNoKHtcblx0XHRcdFx0X2lkOiBtZW50aW9uLFxuXHRcdFx0XHR1c2VybmFtZTogbWVudGlvblxuXHRcdFx0fSk7XG5cdFx0fSk7XG5cdFx0bWVudGlvbnMgPSB1c2VyTWVudGlvbnMubGVuZ3RoID8gdGhpcy5nZXRVc2Vycyh1c2VyTWVudGlvbnMpIDogW107XG5cdFx0cmV0dXJuIFsuLi5tZW50aW9uc0FsbCwgLi4ubWVudGlvbnNdO1xuXHR9XG5cdGdldENoYW5uZWxieU1lbnRpb25zKHttc2d9KSB7XG5cdFx0Y29uc3QgY2hhbm5lbHMgPSB0aGlzLmdldENoYW5uZWxNZW50aW9ucyhtc2cpO1xuXHRcdHJldHVybiB0aGlzLmdldENoYW5uZWxzKGNoYW5uZWxzLm1hcChjID0+IGMudHJpbSgpLnN1YnN0cigxKSkpO1xuXHR9XG5cdGV4ZWN1dGUobWVzc2FnZSkge1xuXHRcdGNvbnN0IG1lbnRpb25zQWxsID0gdGhpcy5nZXRVc2Vyc0J5TWVudGlvbnMobWVzc2FnZSk7XG5cdFx0Y29uc3QgY2hhbm5lbHMgPSB0aGlzLmdldENoYW5uZWxieU1lbnRpb25zKG1lc3NhZ2UpO1xuXG5cdFx0bWVzc2FnZS5tZW50aW9ucyA9IG1lbnRpb25zQWxsO1xuXG5cdFx0bWVzc2FnZS5jaGFubmVscyA9IGNoYW5uZWxzO1xuXHRcdHJldHVybiBtZXNzYWdlO1xuXHR9XG59XG4iLCIvKlxuKiBNZW50aW9ucyBpcyBhIG5hbWVkIGZ1bmN0aW9uIHRoYXQgd2lsbCBwcm9jZXNzIE1lbnRpb25zXG4qIEBwYXJhbSB7T2JqZWN0fSBtZXNzYWdlIC0gVGhlIG1lc3NhZ2Ugb2JqZWN0XG4qL1xuaW1wb3J0IF8gZnJvbSAndW5kZXJzY29yZSc7XG5leHBvcnQgZGVmYXVsdCBjbGFzcyB7XG5cdGNvbnN0cnVjdG9yKHtwYXR0ZXJuLCB1c2VSZWFsTmFtZSwgbWV9KSB7XG5cdFx0dGhpcy5wYXR0ZXJuID0gcGF0dGVybjtcblx0XHR0aGlzLnVzZVJlYWxOYW1lID0gdXNlUmVhbE5hbWU7XG5cdFx0dGhpcy5tZSA9IG1lO1xuXHR9XG5cdHNldCBtZShtKSB7XG5cdFx0dGhpcy5fbWUgPSBtO1xuXHR9XG5cdGdldCBtZSgpIHtcblx0XHRyZXR1cm4gdHlwZW9mIHRoaXMuX21lID09PSAnZnVuY3Rpb24nID8gdGhpcy5fbWUoKSA6IHRoaXMuX21lO1xuXHR9XG5cdHNldCBwYXR0ZXJuKHApIHtcblx0XHR0aGlzLl9wYXR0ZXJuID0gcDtcblx0fVxuXHRnZXQgcGF0dGVybigpIHtcblx0XHRyZXR1cm4gdHlwZW9mIHRoaXMuX3BhdHRlcm4gPT09ICdmdW5jdGlvbicgPyB0aGlzLl9wYXR0ZXJuKCkgOiB0aGlzLl9wYXR0ZXJuO1xuXHR9XG5cdHNldCB1c2VSZWFsTmFtZShzKSB7XG5cdFx0dGhpcy5fdXNlUmVhbE5hbWUgPSBzO1xuXHR9XG5cdGdldCB1c2VSZWFsTmFtZSgpIHtcblx0XHRyZXR1cm4gdHlwZW9mIHRoaXMuX3VzZVJlYWxOYW1lID09PSAnZnVuY3Rpb24nID8gdGhpcy5fdXNlUmVhbE5hbWUoKSA6IHRoaXMuX3VzZVJlYWxOYW1lO1xuXHR9XG5cdGdldCB1c2VyTWVudGlvblJlZ2V4KCkge1xuXHRcdHJldHVybiBuZXcgUmVnRXhwKGBAKCR7IHRoaXMucGF0dGVybiB9KWAsICdnbScpO1xuXHR9XG5cdGdldCBjaGFubmVsTWVudGlvblJlZ2V4KCkge1xuXHRcdHJldHVybiBuZXcgUmVnRXhwKGBeIygkeyB0aGlzLnBhdHRlcm4gfSl8ICMoJHsgdGhpcy5wYXR0ZXJuIH0pYCwgJ2dtJyk7XG5cdH1cblx0cmVwbGFjZVVzZXJzKHN0ciwgbWVzc2FnZSwgbWUpIHtcblx0XHRyZXR1cm4gc3RyLnJlcGxhY2UodGhpcy51c2VyTWVudGlvblJlZ2V4LCAobWF0Y2gsIHVzZXJuYW1lKSA9PiB7XG5cdFx0XHRpZiAoWydhbGwnLCAnaGVyZSddLmluY2x1ZGVzKHVzZXJuYW1lKSkge1xuXHRcdFx0XHRyZXR1cm4gYDxhIGNsYXNzPVwibWVudGlvbi1saW5rIG1lbnRpb24tbGluay1tZSBtZW50aW9uLWxpbmstYWxsIGJhY2tncm91bmQtYXR0ZW50aW9uLWNvbG9yXCI+JHsgbWF0Y2ggfTwvYT5gO1xuXHRcdFx0fVxuXG5cdFx0XHRjb25zdCBtZW50aW9uT2JqID0gXy5maW5kV2hlcmUobWVzc2FnZS5tZW50aW9ucywge3VzZXJuYW1lfSk7XG5cdFx0XHRpZiAobWVzc2FnZS50ZW1wID09IG51bGwgJiYgbWVudGlvbk9iaiA9PSBudWxsKSB7XG5cdFx0XHRcdHJldHVybiBtYXRjaDtcblx0XHRcdH1cblx0XHRcdGNvbnN0IG5hbWUgPSB0aGlzLnVzZVJlYWxOYW1lICYmIG1lbnRpb25PYmogJiYgbWVudGlvbk9iai5uYW1lO1xuXG5cdFx0XHRyZXR1cm4gYDxhIGNsYXNzPVwibWVudGlvbi1saW5rICR7IHVzZXJuYW1lID09PSBtZSA/ICdtZW50aW9uLWxpbmstbWUgYmFja2dyb3VuZC1wcmltYXJ5LWFjdGlvbi1jb2xvcic6JycgfVwiIGRhdGEtdXNlcm5hbWU9XCIkeyB1c2VybmFtZSB9XCIgdGl0bGU9XCIkeyBuYW1lID8gdXNlcm5hbWUgOiAnJyB9XCI+JHsgbmFtZSB8fCBtYXRjaCB9PC9hPmA7XG5cdFx0fSk7XG5cdH1cblx0cmVwbGFjZUNoYW5uZWxzKHN0ciwgbWVzc2FnZSkge1xuXHRcdC8vc2luY2UgYXBvc3Ryb3BoZSBlc2NhcGVkIGNvbnRhaW5zICMgd2UgbmVlZCB0byB1bmVzY2FwZSBpdFxuXHRcdHJldHVybiBzdHIucmVwbGFjZSgvJiMzOTsvZywgJ1xcJycpLnJlcGxhY2UodGhpcy5jaGFubmVsTWVudGlvblJlZ2V4LCAobWF0Y2gsIG4xLCBuMikgPT4ge1xuXHRcdFx0Y29uc3QgbmFtZSA9IG4xIHx8IG4yO1xuXHRcdFx0aWYgKG1lc3NhZ2UudGVtcCA9PSBudWxsICYmIF8uZmluZFdoZXJlKG1lc3NhZ2UuY2hhbm5lbHMsIHtuYW1lfSkgPT0gbnVsbCkge1xuXHRcdFx0XHRyZXR1cm4gbWF0Y2g7XG5cdFx0XHR9XG5cblx0XHRcdC8vIHJlbW92ZSB0aGUgbGluayBmcm9tIGluc2lkZSB0aGUgbGluayBhbmQgcHV0IGJlZm9yZVxuXHRcdFx0aWYgKC9eXFxzLy50ZXN0KG1hdGNoKSkge1xuXHRcdFx0XHRyZXR1cm4gYCA8YSBjbGFzcz1cIm1lbnRpb24tbGlua1wiIGRhdGEtY2hhbm5lbD1cIiR7IG5hbWUgfVwiPiR7IG1hdGNoLnRyaW0oKSB9PC9hPmA7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBgPGEgY2xhc3M9XCJtZW50aW9uLWxpbmtcIiBkYXRhLWNoYW5uZWw9XCIkeyBuYW1lIH1cIj4keyBtYXRjaCB9PC9hPmA7XG5cdFx0fSk7XG5cdH1cblx0Z2V0VXNlck1lbnRpb25zKHN0cikge1xuXHRcdHJldHVybiBzdHIubWF0Y2godGhpcy51c2VyTWVudGlvblJlZ2V4KSB8fCBbXTtcblx0fVxuXHRnZXRDaGFubmVsTWVudGlvbnMoc3RyKSB7XG5cdFx0cmV0dXJuIChzdHIubWF0Y2godGhpcy5jaGFubmVsTWVudGlvblJlZ2V4KSB8fCBbXSkubWFwKG1hdGNoID0+IG1hdGNoLnRyaW0oKSk7XG5cdH1cblx0cGFyc2UobWVzc2FnZSkge1xuXHRcdGxldCBtc2cgPSAobWVzc2FnZSAmJiBtZXNzYWdlLmh0bWwpIHx8ICcnO1xuXHRcdGlmICghbXNnLnRyaW0oKSkge1xuXHRcdFx0cmV0dXJuIG1lc3NhZ2U7XG5cdFx0fVxuXHRcdG1zZyA9IHRoaXMucmVwbGFjZVVzZXJzKG1zZywgbWVzc2FnZSwgdGhpcy5tZSk7XG5cdFx0bXNnID0gdGhpcy5yZXBsYWNlQ2hhbm5lbHMobXNnLCBtZXNzYWdlLCB0aGlzLm1lKTtcblx0XHRtZXNzYWdlLmh0bWwgPSBtc2c7XG5cdFx0cmV0dXJuIG1lc3NhZ2U7XG5cdH1cbn1cbiJdfQ==
