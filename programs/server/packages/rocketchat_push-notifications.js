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

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:push-notifications":{"server":{"methods":{"saveNotificationSettings.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                            //
// packages/rocketchat_push-notifications/server/methods/saveNotificationSettings.js                          //
//                                                                                                            //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                              //
Meteor.methods({
  saveNotificationSettings(roomId, field, value) {
    if (!Meteor.userId()) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'saveNotificationSettings'
      });
    }

    check(roomId, String);
    check(field, String);
    check(value, String);
    const notifications = {
      'audioNotifications': {
        updateMethod: (subscription, value) => RocketChat.models.Subscriptions.updateAudioNotificationsById(subscription._id, value)
      },
      'desktopNotifications': {
        updateMethod: (subscription, value) => RocketChat.models.Subscriptions.updateDesktopNotificationsById(subscription._id, value)
      },
      'mobilePushNotifications': {
        updateMethod: (subscription, value) => RocketChat.models.Subscriptions.updateMobilePushNotificationsById(subscription._id, value)
      },
      'emailNotifications': {
        updateMethod: (subscription, value) => RocketChat.models.Subscriptions.updateEmailNotificationsById(subscription._id, value)
      },
      'unreadAlert': {
        updateMethod: (subscription, value) => RocketChat.models.Subscriptions.updateUnreadAlertById(subscription._id, value)
      },
      'disableNotifications': {
        updateMethod: (subscription, value) => RocketChat.models.Subscriptions.updateDisableNotificationsById(subscription._id, value === '1')
      },
      'hideUnreadStatus': {
        updateMethod: (subscription, value) => RocketChat.models.Subscriptions.updateHideUnreadStatusById(subscription._id, value === '1')
      },
      'muteGroupMentions': {
        updateMethod: (subscription, value) => RocketChat.models.Subscriptions.updateMuteGroupMentions(subscription._id, value === '1')
      },
      'desktopNotificationDuration': {
        updateMethod: (subscription, value) => RocketChat.models.Subscriptions.updateDesktopNotificationDurationById(subscription._id, value)
      },
      'audioNotificationValue': {
        updateMethod: (subscription, value) => RocketChat.models.Subscriptions.updateAudioNotificationValueById(subscription._id, value)
      }
    };
    const isInvalidNotification = !Object.keys(notifications).includes(field);
    const basicValuesForNotifications = ['all', 'mentions', 'nothing', 'default'];
    const fieldsMustHaveBasicValues = ['emailNotifications', 'audioNotifications', 'mobilePushNotifications', 'desktopNotifications'];

    if (isInvalidNotification) {
      throw new Meteor.Error('error-invalid-settings', 'Invalid settings field', {
        method: 'saveNotificationSettings'
      });
    }

    if (fieldsMustHaveBasicValues.includes(field) && !basicValuesForNotifications.includes(value)) {
      throw new Meteor.Error('error-invalid-settings', 'Invalid settings value', {
        method: 'saveNotificationSettings'
      });
    }

    const subscription = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(roomId, Meteor.userId());

    if (!subscription) {
      throw new Meteor.Error('error-invalid-subscription', 'Invalid subscription', {
        method: 'saveNotificationSettings'
      });
    }

    notifications[field].updateMethod(subscription, value);
    return true;
  },

  saveAudioNotificationValue(rid, value) {
    const subscription = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(rid, Meteor.userId());

    if (!subscription) {
      throw new Meteor.Error('error-invalid-subscription', 'Invalid subscription', {
        method: 'saveAudioNotificationValue'
      });
    }

    RocketChat.models.Subscriptions.updateAudioNotificationValueById(subscription._id, value);
    return true;
  },

  saveDesktopNotificationDuration(rid, value) {
    const subscription = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(rid, Meteor.userId());

    if (!subscription) {
      throw new Meteor.Error('error-invalid-subscription', 'Invalid subscription', {
        method: 'saveDesktopNotificationDuration'
      });
    }

    RocketChat.models.Subscriptions.updateDesktopNotificationDurationById(subscription._id, value);
    return true;
  }

});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"models":{"Subscriptions.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                            //
// packages/rocketchat_push-notifications/server/models/Subscriptions.js                                      //
//                                                                                                            //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                              //
RocketChat.models.Subscriptions.updateAudioNotificationsById = function (_id, audioNotifications) {
  const query = {
    _id
  };
  const update = {};

  if (audioNotifications === 'default') {
    update.$unset = {
      audioNotifications: 1
    };
  } else {
    update.$set = {
      audioNotifications
    };
  }

  return this.update(query, update);
};

RocketChat.models.Subscriptions.updateAudioNotificationValueById = function (_id, audioNotificationValue) {
  const query = {
    _id
  };
  const update = {
    $set: {
      audioNotificationValue
    }
  };
  return this.update(query, update);
};

RocketChat.models.Subscriptions.updateDesktopNotificationsById = function (_id, desktopNotifications) {
  const query = {
    _id
  };
  const update = {};

  if (desktopNotifications === 'default') {
    update.$unset = {
      desktopNotifications: 1
    };
  } else {
    update.$set = {
      desktopNotifications
    };
  }

  return this.update(query, update);
};

RocketChat.models.Subscriptions.updateDesktopNotificationDurationById = function (_id, value) {
  const query = {
    _id
  };
  const update = {
    $set: {
      desktopNotificationDuration: parseInt(value)
    }
  };
  return this.update(query, update);
};

RocketChat.models.Subscriptions.updateMobilePushNotificationsById = function (_id, mobilePushNotifications) {
  const query = {
    _id
  };
  const update = {};

  if (mobilePushNotifications === 'default') {
    update.$unset = {
      mobilePushNotifications: 1
    };
  } else {
    update.$set = {
      mobilePushNotifications
    };
  }

  return this.update(query, update);
};

RocketChat.models.Subscriptions.updateEmailNotificationsById = function (_id, emailNotifications) {
  const query = {
    _id
  };
  const update = {
    $set: {
      emailNotifications
    }
  };
  return this.update(query, update);
};

RocketChat.models.Subscriptions.updateUnreadAlertById = function (_id, unreadAlert) {
  const query = {
    _id
  };
  const update = {
    $set: {
      unreadAlert
    }
  };
  return this.update(query, update);
};

RocketChat.models.Subscriptions.updateDisableNotificationsById = function (_id, disableNotifications) {
  const query = {
    _id
  };
  const update = {
    $set: {
      disableNotifications
    }
  };
  return this.update(query, update);
};

RocketChat.models.Subscriptions.updateHideUnreadStatusById = function (_id, hideUnreadStatus) {
  const query = {
    _id
  };
  const update = {
    $set: {
      hideUnreadStatus
    }
  };
  return this.update(query, update);
};

RocketChat.models.Subscriptions.updateMuteGroupMentions = function (_id, muteGroupMentions) {
  const query = {
    _id
  };
  const update = {
    $set: {
      muteGroupMentions
    }
  };
  return this.update(query, update);
};

RocketChat.models.Subscriptions.findAlwaysNotifyAudioUsersByRoomId = function (roomId) {
  const query = {
    rid: roomId,
    audioNotifications: 'all'
  };
  return this.find(query);
};

RocketChat.models.Subscriptions.findAlwaysNotifyDesktopUsersByRoomId = function (roomId) {
  const query = {
    rid: roomId,
    desktopNotifications: 'all'
  };
  return this.find(query);
};

RocketChat.models.Subscriptions.findDontNotifyDesktopUsersByRoomId = function (roomId) {
  const query = {
    rid: roomId,
    desktopNotifications: 'nothing'
  };
  return this.find(query);
};

RocketChat.models.Subscriptions.findAlwaysNotifyMobileUsersByRoomId = function (roomId) {
  const query = {
    rid: roomId,
    mobilePushNotifications: 'all'
  };
  return this.find(query);
};

RocketChat.models.Subscriptions.findDontNotifyMobileUsersByRoomId = function (roomId) {
  const query = {
    rid: roomId,
    mobilePushNotifications: 'nothing'
  };
  return this.find(query);
};

RocketChat.models.Subscriptions.findNotificationPreferencesByRoom = function (roomId, explicit) {
  const query = {
    rid: roomId,
    'u._id': {
      $exists: true
    }
  };

  if (explicit) {
    query.$or = [{
      audioNotifications: {
        $exists: true
      }
    }, {
      audioNotificationValue: {
        $exists: true
      }
    }, {
      desktopNotifications: {
        $exists: true
      }
    }, {
      desktopNotificationDuration: {
        $exists: true
      }
    }, {
      mobilePushNotifications: {
        $exists: true
      }
    }, {
      disableNotifications: {
        $exists: true
      }
    }, {
      muteGroupMentions: {
        $exists: true
      }
    }];
  }

  return this.find(query, {
    fields: {
      'u._id': 1,
      audioNotifications: 1,
      audioNotificationValue: 1,
      desktopNotificationDuration: 1,
      desktopNotifications: 1,
      mobilePushNotifications: 1,
      disableNotifications: 1,
      muteGroupMentions: 1
    }
  });
};

RocketChat.models.Subscriptions.findWithSendEmailByRoomId = function (roomId) {
  const query = {
    rid: roomId,
    emailNotifications: {
      $exists: true
    }
  };
  return this.find(query, {
    fields: {
      emailNotifications: 1,
      u: 1
    }
  });
};
////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:push-notifications/server/methods/saveNotificationSettings.js");
require("/node_modules/meteor/rocketchat:push-notifications/server/models/Subscriptions.js");

/* Exports */
Package._define("rocketchat:push-notifications");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_push-notifications.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpwdXNoLW5vdGlmaWNhdGlvbnMvc2VydmVyL21ldGhvZHMvc2F2ZU5vdGlmaWNhdGlvblNldHRpbmdzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OnB1c2gtbm90aWZpY2F0aW9ucy9zZXJ2ZXIvbW9kZWxzL1N1YnNjcmlwdGlvbnMuanMiXSwibmFtZXMiOlsiTWV0ZW9yIiwibWV0aG9kcyIsInNhdmVOb3RpZmljYXRpb25TZXR0aW5ncyIsInJvb21JZCIsImZpZWxkIiwidmFsdWUiLCJ1c2VySWQiLCJFcnJvciIsIm1ldGhvZCIsImNoZWNrIiwiU3RyaW5nIiwibm90aWZpY2F0aW9ucyIsInVwZGF0ZU1ldGhvZCIsInN1YnNjcmlwdGlvbiIsIlJvY2tldENoYXQiLCJtb2RlbHMiLCJTdWJzY3JpcHRpb25zIiwidXBkYXRlQXVkaW9Ob3RpZmljYXRpb25zQnlJZCIsIl9pZCIsInVwZGF0ZURlc2t0b3BOb3RpZmljYXRpb25zQnlJZCIsInVwZGF0ZU1vYmlsZVB1c2hOb3RpZmljYXRpb25zQnlJZCIsInVwZGF0ZUVtYWlsTm90aWZpY2F0aW9uc0J5SWQiLCJ1cGRhdGVVbnJlYWRBbGVydEJ5SWQiLCJ1cGRhdGVEaXNhYmxlTm90aWZpY2F0aW9uc0J5SWQiLCJ1cGRhdGVIaWRlVW5yZWFkU3RhdHVzQnlJZCIsInVwZGF0ZU11dGVHcm91cE1lbnRpb25zIiwidXBkYXRlRGVza3RvcE5vdGlmaWNhdGlvbkR1cmF0aW9uQnlJZCIsInVwZGF0ZUF1ZGlvTm90aWZpY2F0aW9uVmFsdWVCeUlkIiwiaXNJbnZhbGlkTm90aWZpY2F0aW9uIiwiT2JqZWN0Iiwia2V5cyIsImluY2x1ZGVzIiwiYmFzaWNWYWx1ZXNGb3JOb3RpZmljYXRpb25zIiwiZmllbGRzTXVzdEhhdmVCYXNpY1ZhbHVlcyIsImZpbmRPbmVCeVJvb21JZEFuZFVzZXJJZCIsInNhdmVBdWRpb05vdGlmaWNhdGlvblZhbHVlIiwicmlkIiwic2F2ZURlc2t0b3BOb3RpZmljYXRpb25EdXJhdGlvbiIsImF1ZGlvTm90aWZpY2F0aW9ucyIsInF1ZXJ5IiwidXBkYXRlIiwiJHVuc2V0IiwiJHNldCIsImF1ZGlvTm90aWZpY2F0aW9uVmFsdWUiLCJkZXNrdG9wTm90aWZpY2F0aW9ucyIsImRlc2t0b3BOb3RpZmljYXRpb25EdXJhdGlvbiIsInBhcnNlSW50IiwibW9iaWxlUHVzaE5vdGlmaWNhdGlvbnMiLCJlbWFpbE5vdGlmaWNhdGlvbnMiLCJ1bnJlYWRBbGVydCIsImRpc2FibGVOb3RpZmljYXRpb25zIiwiaGlkZVVucmVhZFN0YXR1cyIsIm11dGVHcm91cE1lbnRpb25zIiwiZmluZEFsd2F5c05vdGlmeUF1ZGlvVXNlcnNCeVJvb21JZCIsImZpbmQiLCJmaW5kQWx3YXlzTm90aWZ5RGVza3RvcFVzZXJzQnlSb29tSWQiLCJmaW5kRG9udE5vdGlmeURlc2t0b3BVc2Vyc0J5Um9vbUlkIiwiZmluZEFsd2F5c05vdGlmeU1vYmlsZVVzZXJzQnlSb29tSWQiLCJmaW5kRG9udE5vdGlmeU1vYmlsZVVzZXJzQnlSb29tSWQiLCJmaW5kTm90aWZpY2F0aW9uUHJlZmVyZW5jZXNCeVJvb20iLCJleHBsaWNpdCIsIiRleGlzdHMiLCIkb3IiLCJmaWVsZHMiLCJmaW5kV2l0aFNlbmRFbWFpbEJ5Um9vbUlkIiwidSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBQSxPQUFPQyxPQUFQLENBQWU7QUFDZEMsMkJBQXlCQyxNQUF6QixFQUFpQ0MsS0FBakMsRUFBd0NDLEtBQXhDLEVBQStDO0FBQzlDLFFBQUksQ0FBQ0wsT0FBT00sTUFBUCxFQUFMLEVBQXNCO0FBQ3JCLFlBQU0sSUFBSU4sT0FBT08sS0FBWCxDQUFpQixvQkFBakIsRUFBdUMsY0FBdkMsRUFBdUQ7QUFBRUMsZ0JBQVE7QUFBVixPQUF2RCxDQUFOO0FBQ0E7O0FBQ0RDLFVBQU1OLE1BQU4sRUFBY08sTUFBZDtBQUNBRCxVQUFNTCxLQUFO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N0Y7QUFBZ0dELDRCQUFzQixDQUF0SDtBQUF5SEcsK0JBQXlCLENBQWxKO0FBQXFKRyw0QkFBc0IsQ0FBM0s7QUFBOEtFLHlCQUFtQjtBQUFqTTtBQUFWLEdBQWpCLENBQVA7QUFDQSxDQW5CRDs7QUFxQkF0QyxXQUFXQyxNQUFYLENBQWtCQyxhQUFsQixDQUFnQ2dELHlCQUFoQyxHQUE0RCxVQUFTN0QsTUFBVCxFQUFpQjtBQUM1RSxRQUFNb0MsUUFBUTtBQUNiSCxTQUFLakMsTUFEUTtBQUViNkMsd0JBQW9CO0FBQ25CYSxlQUFTO0FBRFU7QUFGUCxHQUFkO0FBT0EsU0FBTyxLQUFLUCxJQUFMLENBQVVmLEtBQVYsRUFBaUI7QUFBRXdCLFlBQVE7QUFBRWYsMEJBQW9CLENBQXRCO0FBQXlCaUIsU0FBRztBQUE1QjtBQUFWLEdBQWpCLENBQVA7QUFDQSxDQVRELEMiLCJmaWxlIjoiL3BhY2thZ2VzL3JvY2tldGNoYXRfcHVzaC1ub3RpZmljYXRpb25zLmpzIiwic291cmNlc0NvbnRlbnQiOlsiTWV0ZW9yLm1ldGhvZHMoe1xuXHRzYXZlTm90aWZpY2F0aW9uU2V0dGluZ3Mocm9vbUlkLCBmaWVsZCwgdmFsdWUpIHtcblx0XHRpZiAoIU1ldGVvci51c2VySWQoKSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItaW52YWxpZC11c2VyJywgJ0ludmFsaWQgdXNlcicsIHsgbWV0aG9kOiAnc2F2ZU5vdGlmaWNhdGlvblNldHRpbmdzJyB9KTtcblx0XHR9XG5cdFx0Y2hlY2socm9vbUlkLCBTdHJpbmcpO1xuXHRcdGNoZWNrKGZpZWxkLCBTdHJpbmcpO1xuXHRcdGNoZWNrKHZhbHVlLCBTdHJpbmcpO1xuXG5cdFx0Y29uc3Qgbm90aWZpY2F0aW9ucyA9IHtcblx0XHRcdCdhdWRpb05vdGlmaWNhdGlvbnMnOiB7XG5cdFx0XHRcdHVwZGF0ZU1ldGhvZDogKHN1YnNjcmlwdGlvbiwgdmFsdWUpID0+IFJvY2tldENoYXQubW9kZWxzLlN1YnNjcmlwdGlvbnMudXBkYXRlQXVkaW9Ob3RpZmljYXRpb25zQnlJZChzdWJzY3JpcHRpb24uX2lkLCB2YWx1ZSlcblx0XHRcdH0sXG5cdFx0XHQnZGVza3RvcE5vdGlmaWNhdGlvbnMnOiB7XG5cdFx0XHRcdHVwZGF0ZU1ldGhvZDogKHN1YnNjcmlwdGlvbiwgdmFsdWUpID0+IFJvY2tldENoYXQubW9kZWxzLlN1YnNjcmlwdGlvbnMudXBkYXRlRGVza3RvcE5vdGlmaWNhdGlvbnNCeUlkKHN1YnNjcmlwdGlvbi5faWQsIHZhbHVlKVxuXHRcdFx0fSxcblx0XHRcdCdtb2JpbGVQdXNoTm90aWZpY2F0aW9ucyc6IHtcblx0XHRcdFx0dXBkYXRlTWV0aG9kOiAoc3Vic2NyaXB0aW9uLCB2YWx1ZSkgPT4gUm9ja2V0Q2hhdC5tb2RlbHMuU3Vic2NyaXB0aW9ucy51cGRhdGVNb2JpbGVQdXNoTm90aWZpY2F0aW9uc0J5SWQoc3Vic2NyaXB0aW9uLl9pZCwgdmFsdWUpXG5cdFx0XHR9LFxuXHRcdFx0J2VtYWlsTm90aWZpY2F0aW9ucyc6IHtcblx0XHRcdFx0dXBkYXRlTWV0aG9kOiAoc3Vic2NyaXB0aW9uLCB2YWx1ZSkgPT4gUm9ja2V0Q2hhdC5tb2RlbHMuU3Vic2NyaXB0aW9ucy51cGRhdGVFbWFpbE5vdGlmaWNhdGlvbnNCeUlkKHN1YnNjcmlwdGlvbi5faWQsIHZhbHVlKVxuXHRcdFx0fSxcblx0XHRcdCd1bnJlYWRBbGVydCc6IHtcblx0XHRcdFx0dXBkYXRlTWV0aG9kOiAoc3Vic2NyaXB0aW9uLCB2YWx1ZSkgPT4gUm9ja2V0Q2hhdC5tb2RlbHMuU3Vic2NyaXB0aW9ucy51cGRhdGVVbnJlYWRBbGVydEJ5SWQoc3Vic2NyaXB0aW9uLl9pZCwgdmFsdWUpXG5cdFx0XHR9LFxuXHRcdFx0J2Rpc2FibGVOb3RpZmljYXRpb25zJzoge1xuXHRcdFx0XHR1cGRhdGVNZXRob2Q6IChzdWJzY3JpcHRpb24sIHZhbHVlKSA9PiBSb2NrZXRDaGF0Lm1vZGVscy5TdWJzY3JpcHRpb25zLnVwZGF0ZURpc2FibGVOb3RpZmljYXRpb25zQnlJZChzdWJzY3JpcHRpb24uX2lkLCB2YWx1ZSA9PT0gJzEnKVxuXHRcdFx0fSxcblx0XHRcdCdoaWRlVW5yZWFkU3RhdHVzJzoge1xuXHRcdFx0XHR1cGRhdGVNZXRob2Q6IChzdWJzY3JpcHRpb24sIHZhbHVlKSA9PiBSb2NrZXRDaGF0Lm1vZGVscy5TdWJzY3JpcHRpb25zLnVwZGF0ZUhpZGVVbnJlYWRTdGF0dXNCeUlkKHN1YnNjcmlwdGlvbi5faWQsIHZhbHVlID09PSAnMScpXG5cdFx0XHR9LFxuXHRcdFx0J211dGVHcm91cE1lbnRpb25zJzoge1xuXHRcdFx0XHR1cGRhdGVNZXRob2Q6IChzdWJzY3JpcHRpb24sIHZhbHVlKSA9PiBSb2NrZXRDaGF0Lm1vZGVscy5TdWJzY3JpcHRpb25zLnVwZGF0ZU11dGVHcm91cE1lbnRpb25zKHN1YnNjcmlwdGlvbi5faWQsIHZhbHVlID09PSAnMScpXG5cdFx0XHR9LFxuXHRcdFx0J2Rlc2t0b3BOb3RpZmljYXRpb25EdXJhdGlvbic6IHtcblx0XHRcdFx0dXBkYXRlTWV0aG9kOiAoc3Vic2NyaXB0aW9uLCB2YWx1ZSkgPT4gUm9ja2V0Q2hhdC5tb2RlbHMuU3Vic2NyaXB0aW9ucy51cGRhdGVEZXNrdG9wTm90aWZpY2F0aW9uRHVyYXRpb25CeUlkKHN1YnNjcmlwdGlvbi5faWQsIHZhbHVlKVxuXHRcdFx0fSxcblx0XHRcdCdhdWRpb05vdGlmaWNhdGlvblZhbHVlJzoge1xuXHRcdFx0XHR1cGRhdGVNZXRob2Q6IChzdWJzY3JpcHRpb24sIHZhbHVlKSA9PiBSb2NrZXRDaGF0Lm1vZGVscy5TdWJzY3JpcHRpb25zLnVwZGF0ZUF1ZGlvTm90aWZpY2F0aW9uVmFsdWVCeUlkKHN1YnNjcmlwdGlvbi5faWQsIHZhbHVlKVxuXHRcdFx0fVxuXHRcdH07XG5cdFx0Y29uc3QgaXNJbnZhbGlkTm90aWZpY2F0aW9uID0gIU9iamVjdC5rZXlzKG5vdGlmaWNhdGlvbnMpLmluY2x1ZGVzKGZpZWxkKTtcblx0XHRjb25zdCBiYXNpY1ZhbHVlc0Zvck5vdGlmaWNhdGlvbnMgPSBbJ2FsbCcsICdtZW50aW9ucycsICdub3RoaW5nJywgJ2RlZmF1bHQnXTtcblx0XHRjb25zdCBmaWVsZHNNdXN0SGF2ZUJhc2ljVmFsdWVzID0gWydlbWFpbE5vdGlmaWNhdGlvbnMnLCAnYXVkaW9Ob3RpZmljYXRpb25zJywgJ21vYmlsZVB1c2hOb3RpZmljYXRpb25zJywgJ2Rlc2t0b3BOb3RpZmljYXRpb25zJ107XG5cblx0XHRpZiAoaXNJbnZhbGlkTm90aWZpY2F0aW9uKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLXNldHRpbmdzJywgJ0ludmFsaWQgc2V0dGluZ3MgZmllbGQnLCB7IG1ldGhvZDogJ3NhdmVOb3RpZmljYXRpb25TZXR0aW5ncycgfSk7XG5cdFx0fVxuXG5cdFx0aWYgKGZpZWxkc011c3RIYXZlQmFzaWNWYWx1ZXMuaW5jbHVkZXMoZmllbGQpICYmICFiYXNpY1ZhbHVlc0Zvck5vdGlmaWNhdGlvbnMuaW5jbHVkZXModmFsdWUpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLXNldHRpbmdzJywgJ0ludmFsaWQgc2V0dGluZ3MgdmFsdWUnLCB7IG1ldGhvZDogJ3NhdmVOb3RpZmljYXRpb25TZXR0aW5ncycgfSk7XG5cdFx0fVxuXG5cdFx0Y29uc3Qgc3Vic2NyaXB0aW9uID0gUm9ja2V0Q2hhdC5tb2RlbHMuU3Vic2NyaXB0aW9ucy5maW5kT25lQnlSb29tSWRBbmRVc2VySWQocm9vbUlkLCBNZXRlb3IudXNlcklkKCkpO1xuXHRcdGlmICghc3Vic2NyaXB0aW9uKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLXN1YnNjcmlwdGlvbicsICdJbnZhbGlkIHN1YnNjcmlwdGlvbicsIHsgbWV0aG9kOiAnc2F2ZU5vdGlmaWNhdGlvblNldHRpbmdzJyB9KTtcblx0XHR9XG5cblx0XHRub3RpZmljYXRpb25zW2ZpZWxkXS51cGRhdGVNZXRob2Qoc3Vic2NyaXB0aW9uLCB2YWx1ZSk7XG5cblx0XHRyZXR1cm4gdHJ1ZTtcblx0fSxcblxuXHRzYXZlQXVkaW9Ob3RpZmljYXRpb25WYWx1ZShyaWQsIHZhbHVlKSB7XG5cdFx0Y29uc3Qgc3Vic2NyaXB0aW9uID0gUm9ja2V0Q2hhdC5tb2RlbHMuU3Vic2NyaXB0aW9ucy5maW5kT25lQnlSb29tSWRBbmRVc2VySWQocmlkLCBNZXRlb3IudXNlcklkKCkpO1xuXHRcdGlmICghc3Vic2NyaXB0aW9uKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLXN1YnNjcmlwdGlvbicsICdJbnZhbGlkIHN1YnNjcmlwdGlvbicsIHsgbWV0aG9kOiAnc2F2ZUF1ZGlvTm90aWZpY2F0aW9uVmFsdWUnIH0pO1xuXHRcdH1cblx0XHRSb2NrZXRDaGF0Lm1vZGVscy5TdWJzY3JpcHRpb25zLnVwZGF0ZUF1ZGlvTm90aWZpY2F0aW9uVmFsdWVCeUlkKHN1YnNjcmlwdGlvbi5faWQsIHZhbHVlKTtcblx0XHRyZXR1cm4gdHJ1ZTtcblx0fSxcblxuXHRzYXZlRGVza3RvcE5vdGlmaWNhdGlvbkR1cmF0aW9uKHJpZCwgdmFsdWUpIHtcblx0XHRjb25zdCBzdWJzY3JpcHRpb24gPSBSb2NrZXRDaGF0Lm1vZGVscy5TdWJzY3JpcHRpb25zLmZpbmRPbmVCeVJvb21JZEFuZFVzZXJJZChyaWQsIE1ldGVvci51c2VySWQoKSk7XG5cdFx0aWYgKCFzdWJzY3JpcHRpb24pIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWludmFsaWQtc3Vic2NyaXB0aW9uJywgJ0ludmFsaWQgc3Vic2NyaXB0aW9uJywgeyBtZXRob2Q6ICdzYXZlRGVza3RvcE5vdGlmaWNhdGlvbkR1cmF0aW9uJyB9KTtcblx0XHR9XG5cdFx0Um9ja2V0Q2hhdC5tb2RlbHMuU3Vic2NyaXB0aW9ucy51cGRhdGVEZXNrdG9wTm90aWZpY2F0aW9uRHVyYXRpb25CeUlkKHN1YnNjcmlwdGlvbi5faWQsIHZhbHVlKTtcblx0XHRyZXR1cm4gdHJ1ZTtcblx0fVxufSk7XG4iLCJSb2NrZXRDaGF0Lm1vZGVscy5TdWJzY3JpcHRpb25zLnVwZGF0ZUF1ZGlvTm90aWZpY2F0aW9uc0J5SWQgPSBmdW5jdGlvbihfaWQsIGF1ZGlvTm90aWZpY2F0aW9ucykge1xuXHRjb25zdCBxdWVyeSA9IHtcblx0XHRfaWRcblx0fTtcblxuXHRjb25zdCB1cGRhdGUgPSB7fTtcblxuXHRpZiAoYXVkaW9Ob3RpZmljYXRpb25zID09PSAnZGVmYXVsdCcpIHtcblx0XHR1cGRhdGUuJHVuc2V0ID0geyBhdWRpb05vdGlmaWNhdGlvbnM6IDEgfTtcblx0fSBlbHNlIHtcblx0XHR1cGRhdGUuJHNldCA9IHsgYXVkaW9Ob3RpZmljYXRpb25zIH07XG5cdH1cblxuXHRyZXR1cm4gdGhpcy51cGRhdGUocXVlcnksIHVwZGF0ZSk7XG59O1xuXG5Sb2NrZXRDaGF0Lm1vZGVscy5TdWJzY3JpcHRpb25zLnVwZGF0ZUF1ZGlvTm90aWZpY2F0aW9uVmFsdWVCeUlkID0gZnVuY3Rpb24oX2lkLCBhdWRpb05vdGlmaWNhdGlvblZhbHVlKSB7XG5cdGNvbnN0IHF1ZXJ5ID0ge1xuXHRcdF9pZFxuXHR9O1xuXG5cdGNvbnN0IHVwZGF0ZSA9IHtcblx0XHQkc2V0OiB7XG5cdFx0XHRhdWRpb05vdGlmaWNhdGlvblZhbHVlXG5cdFx0fVxuXHR9O1xuXG5cdHJldHVybiB0aGlzLnVwZGF0ZShxdWVyeSwgdXBkYXRlKTtcbn07XG5cblJvY2tldENoYXQubW9kZWxzLlN1YnNjcmlwdGlvbnMudXBkYXRlRGVza3RvcE5vdGlmaWNhdGlvbnNCeUlkID0gZnVuY3Rpb24oX2lkLCBkZXNrdG9wTm90aWZpY2F0aW9ucykge1xuXHRjb25zdCBxdWVyeSA9IHtcblx0XHRfaWRcblx0fTtcblxuXHRjb25zdCB1cGRhdGUgPSB7fTtcblxuXHRpZiAoZGVza3RvcE5vdGlmaWNhdGlvbnMgPT09ICdkZWZhdWx0Jykge1xuXHRcdHVwZGF0ZS4kdW5zZXQgPSB7IGRlc2t0b3BOb3RpZmljYXRpb25zOiAxIH07XG5cdH0gZWxzZSB7XG5cdFx0dXBkYXRlLiRzZXQgPSB7IGRlc2t0b3BOb3RpZmljYXRpb25zIH07XG5cdH1cblxuXHRyZXR1cm4gdGhpcy51cGRhdGUocXVlcnksIHVwZGF0ZSk7XG59O1xuXG5Sb2NrZXRDaGF0Lm1vZGVscy5TdWJzY3JpcHRpb25zLnVwZGF0ZURlc2t0b3BOb3RpZmljYXRpb25EdXJhdGlvbkJ5SWQgPSBmdW5jdGlvbihfaWQsIHZhbHVlKSB7XG5cdGNvbnN0IHF1ZXJ5ID0ge1xuXHRcdF9pZFxuXHR9O1xuXG5cdGNvbnN0IHVwZGF0ZSA9IHtcblx0XHQkc2V0OiB7XG5cdFx0XHRkZXNrdG9wTm90aWZpY2F0aW9uRHVyYXRpb246IHBhcnNlSW50KHZhbHVlKVxuXHRcdH1cblx0fTtcblxuXHRyZXR1cm4gdGhpcy51cGRhdGUocXVlcnksIHVwZGF0ZSk7XG59O1xuXG5Sb2NrZXRDaGF0Lm1vZGVscy5TdWJzY3JpcHRpb25zLnVwZGF0ZU1vYmlsZVB1c2hOb3RpZmljYXRpb25zQnlJZCA9IGZ1bmN0aW9uKF9pZCwgbW9iaWxlUHVzaE5vdGlmaWNhdGlvbnMpIHtcblx0Y29uc3QgcXVlcnkgPSB7XG5cdFx0X2lkXG5cdH07XG5cblx0Y29uc3QgdXBkYXRlID0ge307XG5cblx0aWYgKG1vYmlsZVB1c2hOb3RpZmljYXRpb25zID09PSAnZGVmYXVsdCcpIHtcblx0XHR1cGRhdGUuJHVuc2V0ID0geyBtb2JpbGVQdXNoTm90aWZpY2F0aW9uczogMSB9O1xuXHR9IGVsc2Uge1xuXHRcdHVwZGF0ZS4kc2V0ID0geyBtb2JpbGVQdXNoTm90aWZpY2F0aW9ucyB9O1xuXHR9XG5cblx0cmV0dXJuIHRoaXMudXBkYXRlKHF1ZXJ5LCB1cGRhdGUpO1xufTtcblxuUm9ja2V0Q2hhdC5tb2RlbHMuU3Vic2NyaXB0aW9ucy51cGRhdGVFbWFpbE5vdGlmaWNhdGlvbnNCeUlkID0gZnVuY3Rpb24oX2lkLCBlbWFpbE5vdGlmaWNhdGlvbnMpIHtcblx0Y29uc3QgcXVlcnkgPSB7XG5cdFx0X2lkXG5cdH07XG5cblx0Y29uc3QgdXBkYXRlID0ge1xuXHRcdCRzZXQ6IHtcblx0XHRcdGVtYWlsTm90aWZpY2F0aW9uc1xuXHRcdH1cblx0fTtcblxuXHRyZXR1cm4gdGhpcy51cGRhdGUocXVlcnksIHVwZGF0ZSk7XG59O1xuXG5Sb2NrZXRDaGF0Lm1vZGVscy5TdWJzY3JpcHRpb25zLnVwZGF0ZVVucmVhZEFsZXJ0QnlJZCA9IGZ1bmN0aW9uKF9pZCwgdW5yZWFkQWxlcnQpIHtcblx0Y29uc3QgcXVlcnkgPSB7XG5cdFx0X2lkXG5cdH07XG5cblx0Y29uc3QgdXBkYXRlID0ge1xuXHRcdCRzZXQ6IHtcblx0XHRcdHVucmVhZEFsZXJ0XG5cdFx0fVxuXHR9O1xuXG5cdHJldHVybiB0aGlzLnVwZGF0ZShxdWVyeSwgdXBkYXRlKTtcbn07XG5cblJvY2tldENoYXQubW9kZWxzLlN1YnNjcmlwdGlvbnMudXBkYXRlRGlzYWJsZU5vdGlmaWNhdGlvbnNCeUlkID0gZnVuY3Rpb24oX2lkLCBkaXNhYmxlTm90aWZpY2F0aW9ucykge1xuXHRjb25zdCBxdWVyeSA9IHtcblx0XHRfaWRcblx0fTtcblxuXHRjb25zdCB1cGRhdGUgPSB7XG5cdFx0JHNldDoge1xuXHRcdFx0ZGlzYWJsZU5vdGlmaWNhdGlvbnNcblx0XHR9XG5cdH07XG5cblx0cmV0dXJuIHRoaXMudXBkYXRlKHF1ZXJ5LCB1cGRhdGUpO1xufTtcblxuUm9ja2V0Q2hhdC5tb2RlbHMuU3Vic2NyaXB0aW9ucy51cGRhdGVIaWRlVW5yZWFkU3RhdHVzQnlJZCA9IGZ1bmN0aW9uKF9pZCwgaGlkZVVucmVhZFN0YXR1cykge1xuXHRjb25zdCBxdWVyeSA9IHtcblx0XHRfaWRcblx0fTtcblxuXHRjb25zdCB1cGRhdGUgPSB7XG5cdFx0JHNldDoge1xuXHRcdFx0aGlkZVVucmVhZFN0YXR1c1xuXHRcdH1cblx0fTtcblxuXHRyZXR1cm4gdGhpcy51cGRhdGUocXVlcnksIHVwZGF0ZSk7XG59O1xuXG5Sb2NrZXRDaGF0Lm1vZGVscy5TdWJzY3JpcHRpb25zLnVwZGF0ZU11dGVHcm91cE1lbnRpb25zID0gZnVuY3Rpb24oX2lkLCBtdXRlR3JvdXBNZW50aW9ucykge1xuXHRjb25zdCBxdWVyeSA9IHtcblx0XHRfaWRcblx0fTtcblxuXHRjb25zdCB1cGRhdGUgPSB7XG5cdFx0JHNldDoge1xuXHRcdFx0bXV0ZUdyb3VwTWVudGlvbnNcblx0XHR9XG5cdH07XG5cblx0cmV0dXJuIHRoaXMudXBkYXRlKHF1ZXJ5LCB1cGRhdGUpO1xufTtcblxuUm9ja2V0Q2hhdC5tb2RlbHMuU3Vic2NyaXB0aW9ucy5maW5kQWx3YXlzTm90aWZ5QXVkaW9Vc2Vyc0J5Um9vbUlkID0gZnVuY3Rpb24ocm9vbUlkKSB7XG5cdGNvbnN0IHF1ZXJ5ID0ge1xuXHRcdHJpZDogcm9vbUlkLFxuXHRcdGF1ZGlvTm90aWZpY2F0aW9uczogJ2FsbCdcblx0fTtcblxuXHRyZXR1cm4gdGhpcy5maW5kKHF1ZXJ5KTtcbn07XG5cblJvY2tldENoYXQubW9kZWxzLlN1YnNjcmlwdGlvbnMuZmluZEFsd2F5c05vdGlmeURlc2t0b3BVc2Vyc0J5Um9vbUlkID0gZnVuY3Rpb24ocm9vbUlkKSB7XG5cdGNvbnN0IHF1ZXJ5ID0ge1xuXHRcdHJpZDogcm9vbUlkLFxuXHRcdGRlc2t0b3BOb3RpZmljYXRpb25zOiAnYWxsJ1xuXHR9O1xuXG5cdHJldHVybiB0aGlzLmZpbmQocXVlcnkpO1xufTtcblxuUm9ja2V0Q2hhdC5tb2RlbHMuU3Vic2NyaXB0aW9ucy5maW5kRG9udE5vdGlmeURlc2t0b3BVc2Vyc0J5Um9vbUlkID0gZnVuY3Rpb24ocm9vbUlkKSB7XG5cdGNvbnN0IHF1ZXJ5ID0ge1xuXHRcdHJpZDogcm9vbUlkLFxuXHRcdGRlc2t0b3BOb3RpZmljYXRpb25zOiAnbm90aGluZydcblx0fTtcblxuXHRyZXR1cm4gdGhpcy5maW5kKHF1ZXJ5KTtcbn07XG5cblJvY2tldENoYXQubW9kZWxzLlN1YnNjcmlwdGlvbnMuZmluZEFsd2F5c05vdGlmeU1vYmlsZVVzZXJzQnlSb29tSWQgPSBmdW5jdGlvbihyb29tSWQpIHtcblx0Y29uc3QgcXVlcnkgPSB7XG5cdFx0cmlkOiByb29tSWQsXG5cdFx0bW9iaWxlUHVzaE5vdGlmaWNhdGlvbnM6ICdhbGwnXG5cdH07XG5cblx0cmV0dXJuIHRoaXMuZmluZChxdWVyeSk7XG59O1xuXG5Sb2NrZXRDaGF0Lm1vZGVscy5TdWJzY3JpcHRpb25zLmZpbmREb250Tm90aWZ5TW9iaWxlVXNlcnNCeVJvb21JZCA9IGZ1bmN0aW9uKHJvb21JZCkge1xuXHRjb25zdCBxdWVyeSA9IHtcblx0XHRyaWQ6IHJvb21JZCxcblx0XHRtb2JpbGVQdXNoTm90aWZpY2F0aW9uczogJ25vdGhpbmcnXG5cdH07XG5cblx0cmV0dXJuIHRoaXMuZmluZChxdWVyeSk7XG59O1xuXG5Sb2NrZXRDaGF0Lm1vZGVscy5TdWJzY3JpcHRpb25zLmZpbmROb3RpZmljYXRpb25QcmVmZXJlbmNlc0J5Um9vbSA9IGZ1bmN0aW9uKHJvb21JZCwgZXhwbGljaXQpIHtcblx0Y29uc3QgcXVlcnkgPSB7XG5cdFx0cmlkOiByb29tSWQsXG5cdFx0J3UuX2lkJzogeyRleGlzdHM6IHRydWV9XG5cdH07XG5cblx0aWYgKGV4cGxpY2l0KSB7XG5cdFx0cXVlcnkuJG9yID0gW1xuXHRcdFx0e2F1ZGlvTm90aWZpY2F0aW9uczogeyRleGlzdHM6IHRydWV9fSxcblx0XHRcdHthdWRpb05vdGlmaWNhdGlvblZhbHVlOiB7JGV4aXN0czogdHJ1ZX19LFxuXHRcdFx0e2Rlc2t0b3BOb3RpZmljYXRpb25zOiB7JGV4aXN0czogdHJ1ZX19LFxuXHRcdFx0e2Rlc2t0b3BOb3RpZmljYXRpb25EdXJhdGlvbjogeyRleGlzdHM6IHRydWV9fSxcblx0XHRcdHttb2JpbGVQdXNoTm90aWZpY2F0aW9uczogeyRleGlzdHM6IHRydWV9fSxcblx0XHRcdHtkaXNhYmxlTm90aWZpY2F0aW9uczogeyRleGlzdHM6IHRydWV9fSxcblx0XHRcdHttdXRlR3JvdXBNZW50aW9uczogeyRleGlzdHM6IHRydWV9fVxuXHRcdF07XG5cdH1cblxuXHRyZXR1cm4gdGhpcy5maW5kKHF1ZXJ5LCB7IGZpZWxkczogeyAndS5faWQnOiAxLCBhdWRpb05vdGlmaWNhdGlvbnM6IDEsIGF1ZGlvTm90aWZpY2F0aW9uVmFsdWU6IDEsIGRlc2t0b3BOb3RpZmljYXRpb25EdXJhdGlvbjogMSwgZGVza3RvcE5vdGlmaWNhdGlvbnM6IDEsIG1vYmlsZVB1c2hOb3RpZmljYXRpb25zOiAxLCBkaXNhYmxlTm90aWZpY2F0aW9uczogMSwgbXV0ZUdyb3VwTWVudGlvbnM6IDEgfSB9KTtcbn07XG5cblJvY2tldENoYXQubW9kZWxzLlN1YnNjcmlwdGlvbnMuZmluZFdpdGhTZW5kRW1haWxCeVJvb21JZCA9IGZ1bmN0aW9uKHJvb21JZCkge1xuXHRjb25zdCBxdWVyeSA9IHtcblx0XHRyaWQ6IHJvb21JZCxcblx0XHRlbWFpbE5vdGlmaWNhdGlvbnM6IHtcblx0XHRcdCRleGlzdHM6IHRydWVcblx0XHR9XG5cdH07XG5cblx0cmV0dXJuIHRoaXMuZmluZChxdWVyeSwgeyBmaWVsZHM6IHsgZW1haWxOb3RpZmljYXRpb25zOiAxLCB1OiAxIH0gfSk7XG59O1xuIl19
