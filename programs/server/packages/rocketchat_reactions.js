(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var RocketChat = Package['rocketchat:lib'].RocketChat;
var fileUpload = Package['rocketchat:ui'].fileUpload;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var TAPi18next = Package['tap:i18n'].TAPi18next;
var TAPi18n = Package['tap:i18n'].TAPi18n;

/* Package-scope variables */
var reaction;

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:reactions":{"server":{"models":{"Messages.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_reactions/server/models/Messages.js                                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.models.Messages.setReactions = function (messageId, reactions) {
  return this.update({
    _id: messageId
  }, {
    $set: {
      reactions
    }
  });
};

RocketChat.models.Messages.unsetReactions = function (messageId) {
  return this.update({
    _id: messageId
  }, {
    $unset: {
      reactions: 1
    }
  });
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}},"setReaction.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_reactions/setReaction.js                                                                        //
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
  setReaction(reaction, messageId) {
    if (!Meteor.userId()) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'setReaction'
      });
    }

    const message = RocketChat.models.Messages.findOneById(messageId);

    if (!message) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'setReaction'
      });
    }

    const room = Meteor.call('canAccessRoom', message.rid, Meteor.userId());

    if (!room) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'setReaction'
      });
    }

    reaction = `:${reaction.replace(/:/g, '')}:`;

    if (!RocketChat.emoji.list[reaction] && RocketChat.models.EmojiCustom.findByNameOrAlias(reaction).count() === 0) {
      throw new Meteor.Error('error-not-allowed', 'Invalid emoji provided.', {
        method: 'setReaction'
      });
    }

    const user = Meteor.user();

    if (Array.isArray(room.muted) && room.muted.indexOf(user.username) !== -1 && !room.reactWhenReadOnly) {
      RocketChat.Notifications.notifyUser(Meteor.userId(), 'message', {
        _id: Random.id(),
        rid: room._id,
        ts: new Date(),
        msg: TAPi18n.__('You_have_been_muted', {}, user.language)
      });
      return false;
    } else if (!RocketChat.models.Subscriptions.findOne({
      rid: message.rid
    })) {
      return false;
    }

    if (message.reactions && message.reactions[reaction] && message.reactions[reaction].usernames.indexOf(user.username) !== -1) {
      message.reactions[reaction].usernames.splice(message.reactions[reaction].usernames.indexOf(user.username), 1);

      if (message.reactions[reaction].usernames.length === 0) {
        delete message.reactions[reaction];
      }

      if (_.isEmpty(message.reactions)) {
        delete message.reactions;
        RocketChat.models.Messages.unsetReactions(messageId);
        RocketChat.callbacks.run('unsetReaction', messageId, reaction);
      } else {
        RocketChat.models.Messages.setReactions(messageId, message.reactions);
        RocketChat.callbacks.run('setReaction', messageId, reaction);
      }
    } else {
      if (!message.reactions) {
        message.reactions = {};
      }

      if (!message.reactions[reaction]) {
        message.reactions[reaction] = {
          usernames: []
        };
      }

      message.reactions[reaction].usernames.push(user.username);
      RocketChat.models.Messages.setReactions(messageId, message.reactions);
      RocketChat.callbacks.run('setReaction', messageId, reaction);
    }

    msgStream.emit(message.rid, message);
    return;
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:reactions/server/models/Messages.js");
require("/node_modules/meteor/rocketchat:reactions/setReaction.js");

/* Exports */
Package._define("rocketchat:reactions");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_reactions.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpyZWFjdGlvbnMvc2VydmVyL21vZGVscy9NZXNzYWdlcy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpyZWFjdGlvbnMvc2V0UmVhY3Rpb24uanMiXSwibmFtZXMiOlsiUm9ja2V0Q2hhdCIsIm1vZGVscyIsIk1lc3NhZ2VzIiwic2V0UmVhY3Rpb25zIiwibWVzc2FnZUlkIiwicmVhY3Rpb25zIiwidXBkYXRlIiwiX2lkIiwiJHNldCIsInVuc2V0UmVhY3Rpb25zIiwiJHVuc2V0IiwiXyIsIm1vZHVsZSIsIndhdGNoIiwicmVxdWlyZSIsImRlZmF1bHQiLCJ2IiwiTWV0ZW9yIiwibWV0aG9kcyIsInNldFJlYWN0aW9uIiwicmVhY3Rpb24iLCJ1c2VySWQiLCJFcnJvciIsIm1ldGhvZCIsIm1lc3NhZ2UiLCJmaW5kT25lQnlJZCIsInJvb20iLCJjYWxsIiwicmlkIiwicmVwbGFjZSIsImVtb2ppIiwibGlzdCIsIkVtb2ppQ3VzdG9tIiwiZmluZEJ5TmFtZU9yQWxpYXMiLCJjb3VudCIsInVzZXIiLCJBcnJheSIsImlzQXJyYXkiLCJtdXRlZCIsImluZGV4T2YiLCJ1c2VybmFtZSIsInJlYWN0V2hlblJlYWRPbmx5IiwiTm90aWZpY2F0aW9ucyIsIm5vdGlmeVVzZXIiLCJSYW5kb20iLCJpZCIsInRzIiwiRGF0ZSIsIm1zZyIsIlRBUGkxOG4iLCJfXyIsImxhbmd1YWdlIiwiU3Vic2NyaXB0aW9ucyIsImZpbmRPbmUiLCJ1c2VybmFtZXMiLCJzcGxpY2UiLCJsZW5ndGgiLCJpc0VtcHR5IiwiY2FsbGJhY2tzIiwicnVuIiwicHVzaCIsIm1zZ1N0cmVhbSIsImVtaXQiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUFBLFdBQVdDLE1BQVgsQ0FBa0JDLFFBQWxCLENBQTJCQyxZQUEzQixHQUEwQyxVQUFTQyxTQUFULEVBQW9CQyxTQUFw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dkQsU0FBeEMsRUFBbURnQixRQUFuRDtBQUNBO0FBQ0QsS0FmRCxNQWVPO0FBQ04sVUFBSSxDQUFDSSxRQUFRbkIsU0FBYixFQUF3QjtBQUN2Qm1CLGdCQUFRbkIsU0FBUixHQUFvQixFQUFwQjtBQUNBOztBQUNELFVBQUksQ0FBQ21CLFFBQVFuQixTQUFSLENBQWtCZSxRQUFsQixDQUFMLEVBQWtDO0FBQ2pDSSxnQkFBUW5CLFNBQVIsQ0FBa0JlLFFBQWxCLElBQThCO0FBQzdCa0MscUJBQVc7QUFEa0IsU0FBOUI7QUFHQTs7QUFDRDlCLGNBQVFuQixTQUFSLENBQWtCZSxRQUFsQixFQUE0QmtDLFNBQTVCLENBQXNDTSxJQUF0QyxDQUEyQ3pCLEtBQUtLLFFBQWhEO0FBRUF4QyxpQkFBV0MsTUFBWCxDQUFrQkMsUUFBbEIsQ0FBMkJDLFlBQTNCLENBQXdDQyxTQUF4QyxFQUFtRG9CLFFBQVFuQixTQUEzRDtBQUNBTCxpQkFBVzBELFNBQVgsQ0FBcUJDLEdBQXJCLENBQXlCLGFBQXpCLEVBQXdDdkQsU0FBeEMsRUFBbURnQixRQUFuRDtBQUNBOztBQUVEeUMsY0FBVUMsSUFBVixDQUFldEMsUUFBUUksR0FBdkIsRUFBNEJKLE9BQTVCO0FBRUE7QUFDQTs7QUF2RWEsQ0FBZixFIiwiZmlsZSI6Ii9wYWNrYWdlcy9yb2NrZXRjaGF0X3JlYWN0aW9ucy5qcyIsInNvdXJjZXNDb250ZW50IjpbIlJvY2tldENoYXQubW9kZWxzLk1lc3NhZ2VzLnNldFJlYWN0aW9ucyA9IGZ1bmN0aW9uKG1lc3NhZ2VJZCwgcmVhY3Rpb25zKSB7XG5cdHJldHVybiB0aGlzLnVwZGF0ZSh7IF9pZDogbWVzc2FnZUlkIH0sIHsgJHNldDogeyByZWFjdGlvbnMgfX0pO1xufTtcblxuUm9ja2V0Q2hhdC5tb2RlbHMuTWVzc2FnZXMudW5zZXRSZWFjdGlvbnMgPSBmdW5jdGlvbihtZXNzYWdlSWQpIHtcblx0cmV0dXJuIHRoaXMudXBkYXRlKHsgX2lkOiBtZXNzYWdlSWQgfSwgeyAkdW5zZXQ6IHsgcmVhY3Rpb25zOiAxIH19KTtcbn07XG4iLCIvKiBnbG9iYWxzIG1zZ1N0cmVhbSAqL1xuaW1wb3J0IF8gZnJvbSAndW5kZXJzY29yZSc7XG5cbk1ldGVvci5tZXRob2RzKHtcblx0c2V0UmVhY3Rpb24ocmVhY3Rpb24sIG1lc3NhZ2VJZCkge1xuXHRcdGlmICghTWV0ZW9yLnVzZXJJZCgpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLXVzZXInLCAnSW52YWxpZCB1c2VyJywgeyBtZXRob2Q6ICdzZXRSZWFjdGlvbicgfSk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgbWVzc2FnZSA9IFJvY2tldENoYXQubW9kZWxzLk1lc3NhZ2VzLmZpbmRPbmVCeUlkKG1lc3NhZ2VJZCk7XG5cblx0XHRpZiAoIW1lc3NhZ2UpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLW5vdC1hbGxvd2VkJywgJ05vdCBhbGxvd2VkJywgeyBtZXRob2Q6ICdzZXRSZWFjdGlvbicgfSk7XG5cdFx0fVxuXG5cdFx0Y29uc3Qgcm9vbSA9IE1ldGVvci5jYWxsKCdjYW5BY2Nlc3NSb29tJywgbWVzc2FnZS5yaWQsIE1ldGVvci51c2VySWQoKSk7XG5cblx0XHRpZiAoIXJvb20pIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLW5vdC1hbGxvd2VkJywgJ05vdCBhbGxvd2VkJywgeyBtZXRob2Q6ICdzZXRSZWFjdGlvbicgfSk7XG5cdFx0fVxuXG5cdFx0cmVhY3Rpb24gPSBgOiR7IHJlYWN0aW9uLnJlcGxhY2UoLzovZywgJycpIH06YDtcblxuXHRcdGlmICghUm9ja2V0Q2hhdC5lbW9qaS5saXN0W3JlYWN0aW9uXSAmJiBSb2NrZXRDaGF0Lm1vZGVscy5FbW9qaUN1c3RvbS5maW5kQnlOYW1lT3JBbGlhcyhyZWFjdGlvbikuY291bnQoKSA9PT0gMCkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3Itbm90LWFsbG93ZWQnLCAnSW52YWxpZCBlbW9qaSBwcm92aWRlZC4nLCB7IG1ldGhvZDogJ3NldFJlYWN0aW9uJyB9KTtcblx0XHR9XG5cblx0XHRjb25zdCB1c2VyID0gTWV0ZW9yLnVzZXIoKTtcblxuXHRcdGlmIChBcnJheS5pc0FycmF5KHJvb20ubXV0ZWQpICYmIHJvb20ubXV0ZWQuaW5kZXhPZih1c2VyLnVzZXJuYW1lKSAhPT0gLTEgJiYgIXJvb20ucmVhY3RXaGVuUmVhZE9ubHkpIHtcblx0XHRcdFJvY2tldENoYXQuTm90aWZpY2F0aW9ucy5ub3RpZnlVc2VyKE1ldGVvci51c2VySWQoKSwgJ21lc3NhZ2UnLCB7XG5cdFx0XHRcdF9pZDogUmFuZG9tLmlkKCksXG5cdFx0XHRcdHJpZDogcm9vbS5faWQsXG5cdFx0XHRcdHRzOiBuZXcgRGF0ZSgpLFxuXHRcdFx0XHRtc2c6IFRBUGkxOG4uX18oJ1lvdV9oYXZlX2JlZW5fbXV0ZWQnLCB7fSwgdXNlci5sYW5ndWFnZSlcblx0XHRcdH0pO1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH0gZWxzZSBpZiAoIVJvY2tldENoYXQubW9kZWxzLlN1YnNjcmlwdGlvbnMuZmluZE9uZSh7IHJpZDogbWVzc2FnZS5yaWQgfSkpIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cblx0XHRpZiAobWVzc2FnZS5yZWFjdGlvbnMgJiYgbWVzc2FnZS5yZWFjdGlvbnNbcmVhY3Rpb25dICYmIG1lc3NhZ2UucmVhY3Rpb25zW3JlYWN0aW9uXS51c2VybmFtZXMuaW5kZXhPZih1c2VyLnVzZXJuYW1lKSAhPT0gLTEpIHtcblx0XHRcdG1lc3NhZ2UucmVhY3Rpb25zW3JlYWN0aW9uXS51c2VybmFtZXMuc3BsaWNlKG1lc3NhZ2UucmVhY3Rpb25zW3JlYWN0aW9uXS51c2VybmFtZXMuaW5kZXhPZih1c2VyLnVzZXJuYW1lKSwgMSk7XG5cblx0XHRcdGlmIChtZXNzYWdlLnJlYWN0aW9uc1tyZWFjdGlvbl0udXNlcm5hbWVzLmxlbmd0aCA9PT0gMCkge1xuXHRcdFx0XHRkZWxldGUgbWVzc2FnZS5yZWFjdGlvbnNbcmVhY3Rpb25dO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoXy5pc0VtcHR5KG1lc3NhZ2UucmVhY3Rpb25zKSkge1xuXHRcdFx0XHRkZWxldGUgbWVzc2FnZS5yZWFjdGlvbnM7XG5cdFx0XHRcdFJvY2tldENoYXQubW9kZWxzLk1lc3NhZ2VzLnVuc2V0UmVhY3Rpb25zKG1lc3NhZ2VJZCk7XG5cdFx0XHRcdFJvY2tldENoYXQuY2FsbGJhY2tzLnJ1bigndW5zZXRSZWFjdGlvbicsIG1lc3NhZ2VJZCwgcmVhY3Rpb24pO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Um9ja2V0Q2hhdC5tb2RlbHMuTWVzc2FnZXMuc2V0UmVhY3Rpb25zKG1lc3NhZ2VJZCwgbWVzc2FnZS5yZWFjdGlvbnMpO1xuXHRcdFx0XHRSb2NrZXRDaGF0LmNhbGxiYWNrcy5ydW4oJ3NldFJlYWN0aW9uJywgbWVzc2FnZUlkLCByZWFjdGlvbik7XG5cdFx0XHR9XG5cdFx0fSBlbHNlIHtcblx0XHRcdGlmICghbWVzc2FnZS5yZWFjdGlvbnMpIHtcblx0XHRcdFx0bWVzc2FnZS5yZWFjdGlvbnMgPSB7fTtcblx0XHRcdH1cblx0XHRcdGlmICghbWVzc2FnZS5yZWFjdGlvbnNbcmVhY3Rpb25dKSB7XG5cdFx0XHRcdG1lc3NhZ2UucmVhY3Rpb25zW3JlYWN0aW9uXSA9IHtcblx0XHRcdFx0XHR1c2VybmFtZXM6IFtdXG5cdFx0XHRcdH07XG5cdFx0XHR9XG5cdFx0XHRtZXNzYWdlLnJlYWN0aW9uc1tyZWFjdGlvbl0udXNlcm5hbWVzLnB1c2godXNlci51c2VybmFtZSk7XG5cblx0XHRcdFJvY2tldENoYXQubW9kZWxzLk1lc3NhZ2VzLnNldFJlYWN0aW9ucyhtZXNzYWdlSWQsIG1lc3NhZ2UucmVhY3Rpb25zKTtcblx0XHRcdFJvY2tldENoYXQuY2FsbGJhY2tzLnJ1bignc2V0UmVhY3Rpb24nLCBtZXNzYWdlSWQsIHJlYWN0aW9uKTtcblx0XHR9XG5cblx0XHRtc2dTdHJlYW0uZW1pdChtZXNzYWdlLnJpZCwgbWVzc2FnZSk7XG5cblx0XHRyZXR1cm47XG5cdH1cbn0pO1xuIl19
