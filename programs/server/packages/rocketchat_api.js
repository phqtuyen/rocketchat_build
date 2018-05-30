(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var RocketChat = Package['rocketchat:lib'].RocketChat;
var Restivus = Package['nimble:restivus'].Restivus;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var TAPi18next = Package['tap:i18n'].TAPi18next;
var TAPi18n = Package['tap:i18n'].TAPi18n;

/* Package-scope variables */
var result, endpoints, options, routes;

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:api":{"server":{"api.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_api/server/api.js                                                                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
const logger = new Logger('API', {});

class API extends Restivus {
  constructor(properties) {
    super(properties);
    this.logger = new Logger(`API ${properties.version ? properties.version : 'default'} Logger`, {});
    this.authMethods = [];
    this.fieldSeparator = '.';
    this.defaultFieldsToExclude = {
      joinCode: 0,
      $loki: 0,
      meta: 0,
      members: 0,
      usernames: 0,
      // Please use the `channel/dm/group.members` endpoint. This is disabled for performance reasons
      importIds: 0
    };
    this.limitedUserFieldsToExclude = {
      avatarOrigin: 0,
      emails: 0,
      phone: 0,
      statusConnection: 0,
      createdAt: 0,
      lastLogin: 0,
      services: 0,
      requirePasswordChange: 0,
      requirePasswordChangeReason: 0,
      roles: 0,
      statusDefault: 0,
      _updatedAt: 0,
      customFields: 0,
      settings: 0
    };

    this._config.defaultOptionsEndpoint = function _defaultOptionsEndpoint() {
      if (this.request.method === 'OPTIONS' && this.request.headers['access-control-request-method']) {
        if (RocketChat.settings.get('API_Enable_CORS') === true) {
          this.response.writeHead(200, {
            'Access-Control-Allow-Origin': RocketChat.settings.get('API_CORS_Origin'),
            'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, X-User-Id, X-Auth-Token'
          });
        } else {
          this.response.writeHead(405);
          this.response.write('CORS not enabled. Go to "Admin > General > REST Api" to enable it.');
        }
      } else {
        this.response.writeHead(404);
      }

      this.done();
    };
  }

  hasHelperMethods() {
    return RocketChat.API.helperMethods.size !== 0;
  }

  getHelperMethods() {
    return RocketChat.API.helperMethods;
  }

  addAuthMethod(method) {
    this.authMethods.push(method);
  }

  success(result = {}) {
    if (_.isObject(result)) {
      result.success = true;
    }

    result = {
      statusCode: 200,
      body: result
    };
    logger.debug('Success', result);
    return result;
  }

  failure(result, errorType) {
    if (_.isObject(result)) {
      result.success = false;
    } else {
      result = {
        success: false,
        error: result
      };

      if (errorType) {
        result.errorType = errorType;
      }
    }

    result = {
      statusCode: 400,
      body: result
    };
    logger.debug('Failure', result);
    return result;
  }

  notFound(msg) {
    return {
      statusCode: 404,
      body: {
        success: false,
        error: msg ? msg : 'Resource not found'
      }
    };
  }

  unauthorized(msg) {
    return {
      statusCode: 403,
      body: {
        success: false,
        error: msg ? msg : 'unauthorized'
      }
    };
  }

  addRoute(routes, options, endpoints) {
    //Note: required if the developer didn't provide options
    if (typeof endpoints === 'undefined') {
      endpoints = options;
      options = {};
    } //Allow for more than one route using the same option and endpoints


    if (!_.isArray(routes)) {
      routes = [routes];
    }

    routes.forEach(route => {
      //Note: This is required due to Restivus calling `addRoute` in the constructor of itself
      if (this.hasHelperMethods()) {
        Object.keys(endpoints).forEach(method => {
          if (typeof endpoints[method] === 'function') {
            endpoints[method] = {
              action: endpoints[method]
            };
          } //Add a try/catch for each endpoint


          const originalAction = endpoints[method].action;

          endpoints[method].action = function _internalRouteActionHandler() {
            this.logger.debug(`${this.request.method.toUpperCase()}: ${this.request.url}`);
            let result;

            try {
              result = originalAction.apply(this);
            } catch (e) {
              this.logger.debug(`${method} ${route} threw an error:`, e.stack);
              return RocketChat.API.v1.failure(e.message, e.error);
            }

            return result ? result : RocketChat.API.v1.success();
          };

          for (const [name, helperMethod] of this.getHelperMethods()) {
            endpoints[method][name] = helperMethod;
          } //Allow the endpoints to make usage of the logger which respects the user's settings


          endpoints[method].logger = this.logger;
        });
      }

      super.addRoute(route, options, endpoints);
    });
  }

  _initAuth() {
    const loginCompatibility = bodyParams => {
      // Grab the username or email that the user is logging in with
      const {
        user,
        username,
        email,
        password,
        code
      } = bodyParams;

      if (password == null) {
        return bodyParams;
      }

      if (_.without(Object.keys(bodyParams), 'user', 'username', 'email', 'password', 'code').length > 0) {
        return bodyParams;
      }

      const auth = {
        password
      };

      if (typeof user === 'string') {
        auth.user = user.includes('@') ? {
          email: user
        } : {
          username: user
        };
      } else if (username) {
        auth.user = {
          username
        };
      } else if (email) {
        auth.user = {
          email
        };
      }

      if (auth.user == null) {
        return bodyParams;
      }

      if (auth.password.hashed) {
        auth.password = {
          digest: auth.password,
          algorithm: 'sha-256'
        };
      }

      if (code) {
        return {
          totp: {
            code,
            login: auth
          }
        };
      }

      return auth;
    };

    const self = this;
    this.addRoute('login', {
      authRequired: false
    }, {
      post() {
        const args = loginCompatibility(this.bodyParams);
        const invocation = new DDPCommon.MethodInvocation({
          connection: {
            close() {}

          }
        });
        let auth;

        try {
          auth = DDP._CurrentInvocation.withValue(invocation, () => Meteor.call('login', args));
        } catch (error) {
          let e = error;

          if (error.reason === 'User not found') {
            e = {
              error: 'Unauthorized',
              reason: 'Unauthorized'
            };
          }

          return {
            statusCode: 401,
            body: {
              status: 'error',
              error: e.error,
              message: e.reason || e.message
            }
          };
        }

        this.user = Meteor.users.findOne({
          _id: auth.id
        });
        this.userId = this.user._id; // Remove tokenExpires to keep the old behavior

        Meteor.users.update({
          _id: this.user._id,
          'services.resume.loginTokens.hashedToken': Accounts._hashLoginToken(auth.token)
        }, {
          $unset: {
            'services.resume.loginTokens.$.when': 1
          }
        });
        const response = {
          status: 'success',
          data: {
            userId: this.userId,
            authToken: auth.token
          }
        };

        const extraData = self._config.onLoggedIn && self._config.onLoggedIn.call(this);

        if (extraData != null) {
          _.extend(response.data, {
            extra: extraData
          });
        }

        return response;
      }

    });

    const logout = function () {
      // Remove the given auth token from the user's account
      const authToken = this.request.headers['x-auth-token'];

      const hashedToken = Accounts._hashLoginToken(authToken);

      const tokenLocation = self._config.auth.token;
      const index = tokenLocation.lastIndexOf('.');
      const tokenPath = tokenLocation.substring(0, index);
      const tokenFieldName = tokenLocation.substring(index + 1);
      const tokenToRemove = {};
      tokenToRemove[tokenFieldName] = hashedToken;
      const tokenRemovalQuery = {};
      tokenRemovalQuery[tokenPath] = tokenToRemove;
      Meteor.users.update(this.user._id, {
        $pull: tokenRemovalQuery
      });
      const response = {
        status: 'success',
        data: {
          message: 'You\'ve been logged out!'
        }
      }; // Call the logout hook with the authenticated user attached

      const extraData = self._config.onLoggedOut && self._config.onLoggedOut.call(this);

      if (extraData != null) {
        _.extend(response.data, {
          extra: extraData
        });
      }

      return response;
    };
    /*
    	Add a logout endpoint to the API
    	After the user is logged out, the onLoggedOut hook is called (see Restfully.configure() for
    	adding hook).
    */


    return this.addRoute('logout', {
      authRequired: true
    }, {
      get() {
        console.warn('Warning: Default logout via GET will be removed in Restivus v1.0. Use POST instead.');
        console.warn('    See https://github.com/kahmali/meteor-restivus/issues/100');
        return logout.call(this);
      },

      post: logout
    });
  }

}

const getUserAuth = function _getUserAuth() {
  const invalidResults = [undefined, null, false];
  return {
    token: 'services.resume.loginTokens.hashedToken',

    user() {
      if (this.bodyParams && this.bodyParams.payload) {
        this.bodyParams = JSON.parse(this.bodyParams.payload);
      }

      for (let i = 0; i < RocketChat.API.v1.authMethods.length; i++) {
        const method = RocketChat.API.v1.authMethods[i];

        if (typeof method === 'function') {
          const result = method.apply(this, arguments);

          if (!invalidResults.includes(result)) {
            return result;
          }
        }
      }

      let token;

      if (this.request.headers['x-auth-token']) {
        token = Accounts._hashLoginToken(this.request.headers['x-auth-token']);
      }

      return {
        userId: this.request.headers['x-user-id'],
        token
      };
    }

  };
};

RocketChat.API = {
  helperMethods: new Map(),
  getUserAuth,
  ApiClass: API
};

const createApi = function _createApi(enableCors) {
  if (!RocketChat.API.v1 || RocketChat.API.v1._config.enableCors !== enableCors) {
    RocketChat.API.v1 = new API({
      version: 'v1',
      useDefaultAuth: true,
      prettyJson: process.env.NODE_ENV === 'development',
      enableCors,
      auth: getUserAuth()
    });
  }

  if (!RocketChat.API.default || RocketChat.API.default._config.enableCors !== enableCors) {
    RocketChat.API.default = new API({
      useDefaultAuth: true,
      prettyJson: process.env.NODE_ENV === 'development',
      enableCors,
      auth: getUserAuth()
    });
  }
}; // register the API to be re-created once the CORS-setting changes.


RocketChat.settings.get('API_Enable_CORS', (key, value) => {
  createApi(value);
}); // also create the API immediately

createApi(!!RocketChat.settings.get('API_Enable_CORS'));
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"settings.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_api/server/settings.js                                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.settings.addGroup('General', function () {
  this.section('REST API', function () {
    this.add('API_Upper_Count_Limit', 100, {
      type: 'int',
      public: false
    });
    this.add('API_Default_Count', 50, {
      type: 'int',
      public: false
    });
    this.add('API_Allow_Infinite_Count', true, {
      type: 'boolean',
      public: false
    });
    this.add('API_Enable_Direct_Message_History_EndPoint', false, {
      type: 'boolean',
      public: false
    });
    this.add('API_Enable_Shields', true, {
      type: 'boolean',
      public: false
    });
    this.add('API_Shield_Types', '*', {
      type: 'string',
      public: false,
      enableQuery: {
        _id: 'API_Enable_Shields',
        value: true
      }
    });
    this.add('API_Enable_CORS', false, {
      type: 'boolean',
      public: false
    });
    this.add('API_CORS_Origin', '*', {
      type: 'string',
      public: false,
      enableQuery: {
        _id: 'API_Enable_CORS',
        value: true
      }
    });
  });
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"helpers":{"requestParams.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_api/server/helpers/requestParams.js                                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.API.helperMethods.set('requestParams', function _requestParams() {
  return ['POST', 'PUT'].includes(this.request.method) ? this.bodyParams : this.queryParams;
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"getPaginationItems.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_api/server/helpers/getPaginationItems.js                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
// If the count query param is higher than the "API_Upper_Count_Limit" setting, then we limit that
// If the count query param isn't defined, then we set it to the "API_Default_Count" setting
// If the count is zero, then that means unlimited and is only allowed if the setting "API_Allow_Infinite_Count" is true
RocketChat.API.helperMethods.set('getPaginationItems', function _getPaginationItems() {
  const hardUpperLimit = RocketChat.settings.get('API_Upper_Count_Limit') <= 0 ? 100 : RocketChat.settings.get('API_Upper_Count_Limit');
  const defaultCount = RocketChat.settings.get('API_Default_Count') <= 0 ? 50 : RocketChat.settings.get('API_Default_Count');
  const offset = this.queryParams.offset ? parseInt(this.queryParams.offset) : 0;
  let count = defaultCount; // Ensure count is an appropiate amount

  if (typeof this.queryParams.count !== 'undefined') {
    count = parseInt(this.queryParams.count);
  } else {
    count = defaultCount;
  }

  if (count > hardUpperLimit) {
    count = hardUpperLimit;
  }

  if (count === 0 && !RocketChat.settings.get('API_Allow_Infinite_Count')) {
    count = defaultCount;
  }

  return {
    offset,
    count
  };
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"getUserFromParams.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_api/server/helpers/getUserFromParams.js                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
//Convenience method, almost need to turn it into a middleware of sorts
RocketChat.API.helperMethods.set('getUserFromParams', function _getUserFromParams() {
  const doesntExist = {
    _doesntExist: true
  };
  let user;
  const params = this.requestParams();

  if (params.userId && params.userId.trim()) {
    user = RocketChat.models.Users.findOneById(params.userId) || doesntExist;
  } else if (params.username && params.username.trim()) {
    user = RocketChat.models.Users.findOneByUsername(params.username) || doesntExist;
  } else if (params.user && params.user.trim()) {
    user = RocketChat.models.Users.findOneByUsername(params.user) || doesntExist;
  } else {
    throw new Meteor.Error('error-user-param-not-provided', 'The required "userId" or "username" param was not provided');
  }

  if (user._doesntExist) {
    throw new Meteor.Error('error-invalid-user', 'The required "userId" or "username" param provided does not match any users');
  }

  return user;
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"isUserFromParams.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_api/server/helpers/isUserFromParams.js                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.API.helperMethods.set('isUserFromParams', function _isUserFromParams() {
  const params = this.requestParams();
  return !params.userId && !params.username && !params.user || params.userId && this.userId === params.userId || params.username && this.user.username === params.username || params.user && this.user.username === params.user;
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"parseJsonQuery.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_api/server/helpers/parseJsonQuery.js                                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.API.helperMethods.set('parseJsonQuery', function _parseJsonQuery() {
  let sort;

  if (this.queryParams.sort) {
    try {
      sort = JSON.parse(this.queryParams.sort);
    } catch (e) {
      this.logger.warn(`Invalid sort parameter provided "${this.queryParams.sort}":`, e);
      throw new Meteor.Error('error-invalid-sort', `Invalid sort parameter provided: "${this.queryParams.sort}"`, {
        helperMethod: 'parseJsonQuery'
      });
    }
  }

  let fields;

  if (this.queryParams.fields) {
    try {
      fields = JSON.parse(this.queryParams.fields);
    } catch (e) {
      this.logger.warn(`Invalid fields parameter provided "${this.queryParams.fields}":`, e);
      throw new Meteor.Error('error-invalid-fields', `Invalid fields parameter provided: "${this.queryParams.fields}"`, {
        helperMethod: 'parseJsonQuery'
      });
    }
  } // Verify the user's selected fields only contains ones which their role allows


  if (typeof fields === 'object') {
    let nonSelectableFields = Object.keys(RocketChat.API.v1.defaultFieldsToExclude);

    if (!RocketChat.authz.hasPermission(this.userId, 'view-full-other-user-info') && this.request.route.includes('/v1/users.')) {
      nonSelectableFields = nonSelectableFields.concat(Object.keys(RocketChat.API.v1.limitedUserFieldsToExclude));
    }

    Object.keys(fields).forEach(k => {
      if (nonSelectableFields.includes(k) || nonSelectableFields.includes(k.split(RocketChat.API.v1.fieldSeparator)[0])) {
        delete fields[k];
      }
    });
  } // Limit the fields by default


  fields = Object.assign({}, fields, RocketChat.API.v1.defaultFieldsToExclude);

  if (!RocketChat.authz.hasPermission(this.userId, 'view-full-other-user-info') && this.request.route.includes('/v1/users.')) {
    fields = Object.assign(fields, RocketChat.API.v1.limitedUserFieldsToExclude);
  }

  let query;

  if (this.queryParams.query) {
    try {
      query = JSON.parse(this.queryParams.query);
    } catch (e) {
      this.logger.warn(`Invalid query parameter provided "${this.queryParams.query}":`, e);
      throw new Meteor.Error('error-invalid-query', `Invalid query parameter provided: "${this.queryParams.query}"`, {
        helperMethod: 'parseJsonQuery'
      });
    }
  } // Verify the user has permission to query the fields they are


  if (typeof query === 'object') {
    let nonQuerableFields = Object.keys(RocketChat.API.v1.defaultFieldsToExclude);

    if (!RocketChat.authz.hasPermission(this.userId, 'view-full-other-user-info') && this.request.route.includes('/v1/users.')) {
      nonQuerableFields = nonQuerableFields.concat(Object.keys(RocketChat.API.v1.limitedUserFieldsToExclude));
    }

    Object.keys(query).forEach(k => {
      if (nonQuerableFields.includes(k) || nonQuerableFields.includes(k.split(RocketChat.API.v1.fieldSeparator)[0])) {
        delete query[k];
      }
    });
  }

  return {
    sort,
    fields,
    query
  };
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"deprecationWarning.js":function(require){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_api/server/helpers/deprecationWarning.js                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var _interopRequireDefault = require("@babel/runtime/helpers/builtin/interopRequireDefault");

var _objectSpread2 = _interopRequireDefault(require("@babel/runtime/helpers/builtin/objectSpread"));

RocketChat.API.helperMethods.set('deprecationWarning', function _deprecationWarning({
  endpoint,
  versionWillBeRemove,
  response
}) {
  const warningMessage = `The endpoint "${endpoint}" is deprecated and will be removed after version ${versionWillBeRemove}`;
  console.warn(warningMessage);

  if (process.env.NODE_ENV === 'development') {
    return (0, _objectSpread2.default)({
      warning: warningMessage
    }, response);
  }

  return response;
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"getLoggedInUser.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_api/server/helpers/getLoggedInUser.js                                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.API.helperMethods.set('getLoggedInUser', function _getLoggedInUser() {
  let user;

  if (this.request.headers['x-auth-token'] && this.request.headers['x-user-id']) {
    user = RocketChat.models.Users.findOne({
      '_id': this.request.headers['x-user-id'],
      'services.resume.loginTokens.hashedToken': Accounts._hashLoginToken(this.request.headers['x-auth-token'])
    });
  }

  return user;
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"insertUserObject.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_api/server/helpers/insertUserObject.js                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.API.helperMethods.set('insertUserObject', function _addUserToObject({
  object,
  userId
}) {
  const {
    username,
    name
  } = RocketChat.models.Users.findOneById(userId);
  object.user = {
    _id: userId,
    username,
    name
  };
  return object;
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"default":{"info.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_api/server/default/info.js                                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.API.default.addRoute('info', {
  authRequired: false
}, {
  get() {
    const user = this.getLoggedInUser();

    if (user && RocketChat.authz.hasRole(user._id, 'admin')) {
      return RocketChat.API.v1.success({
        info: RocketChat.Info
      });
    }

    return RocketChat.API.v1.success({
      version: RocketChat.Info.version
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"metrics.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_api/server/default/metrics.js                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.API.default.addRoute('metrics', {
  authRequired: false
}, {
  get() {
    return {
      headers: {
        'Content-Type': 'text/plain'
      },
      body: RocketChat.promclient.register.metrics()
    };
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"v1":{"channels.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_api/server/v1/channels.js                                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var _interopRequireDefault = require("@babel/runtime/helpers/builtin/interopRequireDefault");

var _objectSpread2 = _interopRequireDefault(require("@babel/runtime/helpers/builtin/objectSpread"));

let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);

//Returns the channel IF found otherwise it will return the failure of why it didn't. Check the `statusCode` property
function findChannelByIdOrName({
  params,
  checkedArchived = true,
  returnUsernames = false
}) {
  if ((!params.roomId || !params.roomId.trim()) && (!params.roomName || !params.roomName.trim())) {
    throw new Meteor.Error('error-roomid-param-not-provided', 'The parameter "roomId" or "roomName" is required');
  }

  const fields = (0, _objectSpread2.default)({}, RocketChat.API.v1.defaultFieldsToExclude);

  if (returnUsernames) {
    delete fields.usernames;
  }

  let room;

  if (params.roomId) {
    room = RocketChat.models.Rooms.findOneById(params.roomId, {
      fields
    });
  } else if (params.roomName) {
    room = RocketChat.models.Rooms.findOneByName(params.roomName, {
      fields
    });
  }

  if (!room || room.t !== 'c') {
    throw new Meteor.Error('error-room-not-found', 'The required "roomId" or "roomName" param provided does not match any channel');
  }

  if (checkedArchived && room.archived) {
    throw new Meteor.Error('error-room-archived', `The channel, ${room.name}, is archived`);
  }

  return room;
}

RocketChat.API.v1.addRoute('channels.addAll', {
  authRequired: true
}, {
  post() {
    const findResult = findChannelByIdOrName({
      params: this.requestParams()
    });
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('addAllUserToRoom', findResult._id, this.bodyParams.activeUsersOnly);
    });
    return RocketChat.API.v1.success({
      channel: RocketChat.models.Rooms.findOneById(findResult._id, {
        fields: RocketChat.API.v1.defaultFieldsToExclude
      })
    });
  }

});
RocketChat.API.v1.addRoute('channels.addModerator', {
  authRequired: true
}, {
  post() {
    const findResult = findChannelByIdOrName({
      params: this.requestParams()
    });
    const user = this.getUserFromParams();
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('addRoomModerator', findResult._id, user._id);
    });
    return RocketChat.API.v1.success();
  }

});
RocketChat.API.v1.addRoute('channels.addOwner', {
  authRequired: true
}, {
  post() {
    const findResult = findChannelByIdOrName({
      params: this.requestParams()
    });
    const user = this.getUserFromParams();
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('addRoomOwner', findResult._id, user._id);
    });
    return RocketChat.API.v1.success();
  }

});
RocketChat.API.v1.addRoute('channels.archive', {
  authRequired: true
}, {
  post() {
    const findResult = findChannelByIdOrName({
      params: this.requestParams()
    });
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('archiveRoom', findResult._id);
    });
    return RocketChat.API.v1.success();
  }

});
/**
 DEPRECATED
 // TODO: Remove this after three versions have been released. That means at 0.67 this should be gone.
 **/

RocketChat.API.v1.addRoute('channels.cleanHistory', {
  authRequired: true
}, {
  post() {
    const findResult = findChannelByIdOrName({
      params: this.requestParams()
    });

    if (!this.bodyParams.latest) {
      return RocketChat.API.v1.failure('Body parameter "latest" is required.');
    }

    if (!this.bodyParams.oldest) {
      return RocketChat.API.v1.failure('Body parameter "oldest" is required.');
    }

    const latest = new Date(this.bodyParams.latest);
    const oldest = new Date(this.bodyParams.oldest);
    let inclusive = false;

    if (typeof this.bodyParams.inclusive !== 'undefined') {
      inclusive = this.bodyParams.inclusive;
    }

    Meteor.runAsUser(this.userId, () => {
      Meteor.call('cleanChannelHistory', {
        roomId: findResult._id,
        latest,
        oldest,
        inclusive
      });
    });
    return RocketChat.API.v1.success(this.deprecationWarning({
      endpoint: 'channels.cleanHistory',
      versionWillBeRemove: 'v0.67'
    }));
  }

});
RocketChat.API.v1.addRoute('channels.close', {
  authRequired: true
}, {
  post() {
    const findResult = findChannelByIdOrName({
      params: this.requestParams(),
      checkedArchived: false
    });
    const sub = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(findResult._id, this.userId);

    if (!sub) {
      return RocketChat.API.v1.failure(`The user/callee is not in the channel "${findResult.name}.`);
    }

    if (!sub.open) {
      return RocketChat.API.v1.failure(`The channel, ${findResult.name}, is already closed to the sender`);
    }

    Meteor.runAsUser(this.userId, () => {
      Meteor.call('hideRoom', findResult._id);
    });
    return RocketChat.API.v1.success();
  }

}); // Channel -> create

function createChannelValidator(params) {
  if (!RocketChat.authz.hasPermission(params.user.value, 'create-c')) {
    throw new Error('unauthorized');
  }

  if (!params.name || !params.name.value) {
    throw new Error(`Param "${params.name.key}" is required`);
  }

  if (params.members && params.members.value && !_.isArray(params.members.value)) {
    throw new Error(`Param "${params.members.key}" must be an array if provided`);
  }

  if (params.customFields && params.customFields.value && !(typeof params.customFields.value === 'object')) {
    throw new Error(`Param "${params.customFields.key}" must be an object if provided`);
  }
}

function createChannel(userId, params) {
  let readOnly = false;

  if (typeof params.readOnly !== 'undefined') {
    readOnly = params.readOnly;
  }

  let id;
  Meteor.runAsUser(userId, () => {
    id = Meteor.call('createChannel', params.name, params.members ? params.members : [], readOnly, params.customFields);
  });
  return {
    channel: RocketChat.models.Rooms.findOneById(id.rid, {
      fields: RocketChat.API.v1.defaultFieldsToExclude
    })
  };
}

RocketChat.API.channels = {};
RocketChat.API.channels.create = {
  validate: createChannelValidator,
  execute: createChannel
};
RocketChat.API.v1.addRoute('channels.create', {
  authRequired: true
}, {
  post() {
    const userId = this.userId;
    const bodyParams = this.bodyParams;
    let error;

    try {
      RocketChat.API.channels.create.validate({
        user: {
          value: userId
        },
        name: {
          value: bodyParams.name,
          key: 'name'
        },
        members: {
          value: bodyParams.members,
          key: 'members'
        }
      });
    } catch (e) {
      if (e.message === 'unauthorized') {
        error = RocketChat.API.v1.unauthorized();
      } else {
        error = RocketChat.API.v1.failure(e.message);
      }
    }

    if (error) {
      return error;
    }

    return RocketChat.API.v1.success(RocketChat.API.channels.create.execute(userId, bodyParams));
  }

});
RocketChat.API.v1.addRoute('channels.delete', {
  authRequired: true
}, {
  post() {
    const findResult = findChannelByIdOrName({
      params: this.requestParams(),
      checkedArchived: false
    });
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('eraseRoom', findResult._id);
    });
    return RocketChat.API.v1.success({
      channel: findResult
    });
  }

});
RocketChat.API.v1.addRoute('channels.files', {
  authRequired: true
}, {
  get() {
    const findResult = findChannelByIdOrName({
      params: this.requestParams(),
      checkedArchived: false
    });

    const addUserObjectToEveryObject = file => {
      if (file.userId) {
        file = this.insertUserObject({
          object: file,
          userId: file.userId
        });
      }

      return file;
    };

    Meteor.runAsUser(this.userId, () => {
      Meteor.call('canAccessRoom', findResult._id, this.userId);
    });
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
      rid: findResult._id
    });
    const files = RocketChat.models.Uploads.find(ourQuery, {
      sort: sort ? sort : {
        name: 1
      },
      skip: offset,
      limit: count,
      fields
    }).fetch();
    return RocketChat.API.v1.success({
      files: files.map(addUserObjectToEveryObject),
      count: files.length,
      offset,
      total: RocketChat.models.Uploads.find(ourQuery).count()
    });
  }

});
RocketChat.API.v1.addRoute('channels.getIntegrations', {
  authRequired: true
}, {
  get() {
    if (!RocketChat.authz.hasPermission(this.userId, 'manage-integrations')) {
      return RocketChat.API.v1.unauthorized();
    }

    const findResult = findChannelByIdOrName({
      params: this.requestParams(),
      checkedArchived: false
    });
    let includeAllPublicChannels = true;

    if (typeof this.queryParams.includeAllPublicChannels !== 'undefined') {
      includeAllPublicChannels = this.queryParams.includeAllPublicChannels === 'true';
    }

    let ourQuery = {
      channel: `#${findResult.name}`
    };

    if (includeAllPublicChannels) {
      ourQuery.channel = {
        $in: [ourQuery.channel, 'all_public_channels']
      };
    }

    const {
      offset,
      count
    } = this.getPaginationItems();
    const {
      sort,
      fields,
      query
    } = this.parseJsonQuery();
    ourQuery = Object.assign({}, query, ourQuery);
    const integrations = RocketChat.models.Integrations.find(ourQuery, {
      sort: sort ? sort : {
        _createdAt: 1
      },
      skip: offset,
      limit: count,
      fields
    }).fetch();
    return RocketChat.API.v1.success({
      integrations,
      count: integrations.length,
      offset,
      total: RocketChat.models.Integrations.find(ourQuery).count()
    });
  }

});
RocketChat.API.v1.addRoute('channels.history', {
  authRequired: true
}, {
  get() {
    const findResult = findChannelByIdOrName({
      params: this.requestParams(),
      checkedArchived: false
    });
    let latestDate = new Date();

    if (this.queryParams.latest) {
      latestDate = new Date(this.queryParams.latest);
    }

    let oldestDate = undefined;

    if (this.queryParams.oldest) {
      oldestDate = new Date(this.queryParams.oldest);
    }

    let inclusive = false;

    if (this.queryParams.inclusive) {
      inclusive = this.queryParams.inclusive;
    }

    let count = 20;

    if (this.queryParams.count) {
      count = parseInt(this.queryParams.count);
    }

    let unreads = false;

    if (this.queryParams.unreads) {
      unreads = this.queryParams.unreads;
    }

    let result;
    Meteor.runAsUser(this.userId, () => {
      result = Meteor.call('getChannelHistory', {
        rid: findResult._id,
        latest: latestDate,
        oldest: oldestDate,
        inclusive,
        count,
        unreads
      });
    });

    if (!result) {
      return RocketChat.API.v1.unauthorized();
    }

    return RocketChat.API.v1.success(result);
  }

});
RocketChat.API.v1.addRoute('channels.info', {
  authRequired: true
}, {
  get() {
    const findResult = findChannelByIdOrName({
      params: this.requestParams(),
      checkedArchived: false
    });
    return RocketChat.API.v1.success({
      channel: RocketChat.models.Rooms.findOneById(findResult._id, {
        fields: RocketChat.API.v1.defaultFieldsToExclude
      })
    });
  }

});
RocketChat.API.v1.addRoute('channels.invite', {
  authRequired: true
}, {
  post() {
    const findResult = findChannelByIdOrName({
      params: this.requestParams()
    });
    const user = this.getUserFromParams();
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('addUserToRoom', {
        rid: findResult._id,
        username: user.username
      });
    });
    return RocketChat.API.v1.success({
      channel: RocketChat.models.Rooms.findOneById(findResult._id, {
        fields: RocketChat.API.v1.defaultFieldsToExclude
      })
    });
  }

});
RocketChat.API.v1.addRoute('channels.join', {
  authRequired: true
}, {
  post() {
    const findResult = findChannelByIdOrName({
      params: this.requestParams()
    });
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('joinRoom', findResult._id, this.bodyParams.joinCode);
    });
    return RocketChat.API.v1.success({
      channel: RocketChat.models.Rooms.findOneById(findResult._id, {
        fields: RocketChat.API.v1.defaultFieldsToExclude
      })
    });
  }

});
RocketChat.API.v1.addRoute('channels.kick', {
  authRequired: true
}, {
  post() {
    const findResult = findChannelByIdOrName({
      params: this.requestParams()
    });
    const user = this.getUserFromParams();
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('removeUserFromRoom', {
        rid: findResult._id,
        username: user.username
      });
    });
    return RocketChat.API.v1.success({
      channel: RocketChat.models.Rooms.findOneById(findResult._id, {
        fields: RocketChat.API.v1.defaultFieldsToExclude
      })
    });
  }

});
RocketChat.API.v1.addRoute('channels.leave', {
  authRequired: true
}, {
  post() {
    const findResult = findChannelByIdOrName({
      params: this.requestParams()
    });
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('leaveRoom', findResult._id);
    });
    return RocketChat.API.v1.success({
      channel: RocketChat.models.Rooms.findOneById(findResult._id, {
        fields: RocketChat.API.v1.defaultFieldsToExclude
      })
    });
  }

});
RocketChat.API.v1.addRoute('channels.list', {
  authRequired: true
}, {
  get: {
    //This is defined as such only to provide an example of how the routes can be defined :X
    action() {
      const {
        offset,
        count
      } = this.getPaginationItems();
      const {
        sort,
        fields,
        query
      } = this.parseJsonQuery();
      const hasPermissionToSeeAllPublicChannels = RocketChat.authz.hasPermission(this.userId, 'view-c-room');
      const ourQuery = Object.assign({}, query, {
        t: 'c'
      });

      if (RocketChat.authz.hasPermission(this.userId, 'view-joined-room') && !hasPermissionToSeeAllPublicChannels) {
        ourQuery.usernames = {
          $in: [this.user.username]
        };
      } else if (!hasPermissionToSeeAllPublicChannels) {
        return RocketChat.API.v1.unauthorized();
      }

      const rooms = RocketChat.models.Rooms.find(ourQuery, {
        sort: sort ? sort : {
          name: 1
        },
        skip: offset,
        limit: count,
        fields
      }).fetch();
      return RocketChat.API.v1.success({
        channels: rooms,
        count: rooms.length,
        offset,
        total: RocketChat.models.Rooms.find(ourQuery).count()
      });
    }

  }
});
RocketChat.API.v1.addRoute('channels.list.joined', {
  authRequired: true
}, {
  get() {
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
      t: 'c',
      'u._id': this.userId
    });

    let rooms = _.pluck(RocketChat.models.Subscriptions.find(ourQuery).fetch(), '_room');

    const totalCount = rooms.length;
    rooms = RocketChat.models.Rooms.processQueryOptionsOnResult(rooms, {
      sort: sort ? sort : {
        name: 1
      },
      skip: offset,
      limit: count,
      fields
    });
    return RocketChat.API.v1.success({
      channels: rooms,
      offset,
      count: rooms.length,
      total: totalCount
    });
  }

});
RocketChat.API.v1.addRoute('channels.members', {
  authRequired: true
}, {
  get() {
    const findResult = findChannelByIdOrName({
      params: this.requestParams(),
      checkedArchived: false,
      returnUsernames: true
    });
    const {
      offset,
      count
    } = this.getPaginationItems();
    const {
      sort
    } = this.parseJsonQuery();
    const shouldBeOrderedDesc = Match.test(sort, Object) && Match.test(sort.username, Number) && sort.username === -1;
    let members = RocketChat.models.Rooms.processQueryOptionsOnResult(Array.from(findResult.usernames).sort(), {
      skip: offset,
      limit: count
    });

    if (shouldBeOrderedDesc) {
      members = members.reverse();
    }

    const users = RocketChat.models.Users.find({
      username: {
        $in: members
      }
    }, {
      fields: {
        _id: 1,
        username: 1,
        name: 1,
        status: 1,
        utcOffset: 1
      },
      sort: sort ? sort : {
        username: 1
      }
    }).fetch();
    return RocketChat.API.v1.success({
      members: users,
      count: users.length,
      offset,
      total: findResult.usernames.length
    });
  }

});
RocketChat.API.v1.addRoute('channels.messages', {
  authRequired: true
}, {
  get() {
    const findResult = findChannelByIdOrName({
      params: this.requestParams(),
      checkedArchived: false,
      returnUsernames: true
    });
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
      rid: findResult._id
    }); //Special check for the permissions

    if (RocketChat.authz.hasPermission(this.userId, 'view-joined-room') && !findResult.usernames.includes(this.user.username)) {
      return RocketChat.API.v1.unauthorized();
    } else if (!RocketChat.authz.hasPermission(this.userId, 'view-c-room')) {
      return RocketChat.API.v1.unauthorized();
    }

    const messages = RocketChat.models.Messages.find(ourQuery, {
      sort: sort ? sort : {
        ts: -1
      },
      skip: offset,
      limit: count,
      fields
    }).fetch();
    return RocketChat.API.v1.success({
      messages,
      count: messages.length,
      offset,
      total: RocketChat.models.Messages.find(ourQuery).count()
    });
  }

});
RocketChat.API.v1.addRoute('channels.online', {
  authRequired: true
}, {
  get() {
    const {
      query
    } = this.parseJsonQuery();
    const ourQuery = Object.assign({}, query, {
      t: 'c'
    });
    const room = RocketChat.models.Rooms.findOne(ourQuery);

    if (room == null) {
      return RocketChat.API.v1.failure('Channel does not exists');
    }

    const online = RocketChat.models.Users.findUsersNotOffline({
      fields: {
        username: 1
      }
    }).fetch();
    const onlineInRoom = [];
    online.forEach(user => {
      if (room.usernames.indexOf(user.username) !== -1) {
        onlineInRoom.push({
          _id: user._id,
          username: user.username
        });
      }
    });
    return RocketChat.API.v1.success({
      online: onlineInRoom
    });
  }

});
RocketChat.API.v1.addRoute('channels.open', {
  authRequired: true
}, {
  post() {
    const findResult = findChannelByIdOrName({
      params: this.requestParams(),
      checkedArchived: false
    });
    const sub = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(findResult._id, this.userId);

    if (!sub) {
      return RocketChat.API.v1.failure(`The user/callee is not in the channel "${findResult.name}".`);
    }

    if (sub.open) {
      return RocketChat.API.v1.failure(`The channel, ${findResult.name}, is already open to the sender`);
    }

    Meteor.runAsUser(this.userId, () => {
      Meteor.call('openRoom', findResult._id);
    });
    return RocketChat.API.v1.success();
  }

});
RocketChat.API.v1.addRoute('channels.removeModerator', {
  authRequired: true
}, {
  post() {
    const findResult = findChannelByIdOrName({
      params: this.requestParams()
    });
    const user = this.getUserFromParams();
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('removeRoomModerator', findResult._id, user._id);
    });
    return RocketChat.API.v1.success();
  }

});
RocketChat.API.v1.addRoute('channels.removeOwner', {
  authRequired: true
}, {
  post() {
    const findResult = findChannelByIdOrName({
      params: this.requestParams()
    });
    const user = this.getUserFromParams();
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('removeRoomOwner', findResult._id, user._id);
    });
    return RocketChat.API.v1.success();
  }

});
RocketChat.API.v1.addRoute('channels.rename', {
  authRequired: true
}, {
  post() {
    if (!this.bodyParams.name || !this.bodyParams.name.trim()) {
      return RocketChat.API.v1.failure('The bodyParam "name" is required');
    }

    const findResult = findChannelByIdOrName({
      params: {
        roomId: this.bodyParams.roomId
      }
    });

    if (findResult.name === this.bodyParams.name) {
      return RocketChat.API.v1.failure('The channel name is the same as what it would be renamed to.');
    }

    Meteor.runAsUser(this.userId, () => {
      Meteor.call('saveRoomSettings', findResult._id, 'roomName', this.bodyParams.name);
    });
    return RocketChat.API.v1.success({
      channel: RocketChat.models.Rooms.findOneById(findResult._id, {
        fields: RocketChat.API.v1.defaultFieldsToExclude
      })
    });
  }

});
RocketChat.API.v1.addRoute('channels.setDescription', {
  authRequired: true
}, {
  post() {
    if (!this.bodyParams.description || !this.bodyParams.description.trim()) {
      return RocketChat.API.v1.failure('The bodyParam "description" is required');
    }

    const findResult = findChannelByIdOrName({
      params: this.requestParams()
    });

    if (findResult.description === this.bodyParams.description) {
      return RocketChat.API.v1.failure('The channel description is the same as what it would be changed to.');
    }

    Meteor.runAsUser(this.userId, () => {
      Meteor.call('saveRoomSettings', findResult._id, 'roomDescription', this.bodyParams.description);
    });
    return RocketChat.API.v1.success({
      description: this.bodyParams.description
    });
  }

});
RocketChat.API.v1.addRoute('channels.setJoinCode', {
  authRequired: true
}, {
  post() {
    if (!this.bodyParams.joinCode || !this.bodyParams.joinCode.trim()) {
      return RocketChat.API.v1.failure('The bodyParam "joinCode" is required');
    }

    const findResult = findChannelByIdOrName({
      params: this.requestParams()
    });
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('saveRoomSettings', findResult._id, 'joinCode', this.bodyParams.joinCode);
    });
    return RocketChat.API.v1.success({
      channel: RocketChat.models.Rooms.findOneById(findResult._id, {
        fields: RocketChat.API.v1.defaultFieldsToExclude
      })
    });
  }

});
RocketChat.API.v1.addRoute('channels.setPurpose', {
  authRequired: true
}, {
  post() {
    if (!this.bodyParams.purpose || !this.bodyParams.purpose.trim()) {
      return RocketChat.API.v1.failure('The bodyParam "purpose" is required');
    }

    const findResult = findChannelByIdOrName({
      params: this.requestParams()
    });

    if (findResult.description === this.bodyParams.purpose) {
      return RocketChat.API.v1.failure('The channel purpose (description) is the same as what it would be changed to.');
    }

    Meteor.runAsUser(this.userId, () => {
      Meteor.call('saveRoomSettings', findResult._id, 'roomDescription', this.bodyParams.purpose);
    });
    return RocketChat.API.v1.success({
      purpose: this.bodyParams.purpose
    });
  }

});
RocketChat.API.v1.addRoute('channels.setReadOnly', {
  authRequired: true
}, {
  post() {
    if (typeof this.bodyParams.readOnly === 'undefined') {
      return RocketChat.API.v1.failure('The bodyParam "readOnly" is required');
    }

    const findResult = findChannelByIdOrName({
      params: this.requestParams()
    });

    if (findResult.ro === this.bodyParams.readOnly) {
      return RocketChat.API.v1.failure('The channel read only setting is the same as what it would be changed to.');
    }

    Meteor.runAsUser(this.userId, () => {
      Meteor.call('saveRoomSettings', findResult._id, 'readOnly', this.bodyParams.readOnly);
    });
    return RocketChat.API.v1.success({
      channel: RocketChat.models.Rooms.findOneById(findResult._id, {
        fields: RocketChat.API.v1.defaultFieldsToExclude
      })
    });
  }

});
RocketChat.API.v1.addRoute('channels.setTopic', {
  authRequired: true
}, {
  post() {
    if (!this.bodyParams.topic || !this.bodyParams.topic.trim()) {
      return RocketChat.API.v1.failure('The bodyParam "topic" is required');
    }

    const findResult = findChannelByIdOrName({
      params: this.requestParams()
    });

    if (findResult.topic === this.bodyParams.topic) {
      return RocketChat.API.v1.failure('The channel topic is the same as what it would be changed to.');
    }

    Meteor.runAsUser(this.userId, () => {
      Meteor.call('saveRoomSettings', findResult._id, 'roomTopic', this.bodyParams.topic);
    });
    return RocketChat.API.v1.success({
      topic: this.bodyParams.topic
    });
  }

});
RocketChat.API.v1.addRoute('channels.setAnnouncement', {
  authRequired: true
}, {
  post() {
    if (!this.bodyParams.announcement || !this.bodyParams.announcement.trim()) {
      return RocketChat.API.v1.failure('The bodyParam "announcement" is required');
    }

    const findResult = findChannelByIdOrName({
      params: this.requestParams()
    });
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('saveRoomSettings', findResult._id, 'roomAnnouncement', this.bodyParams.announcement);
    });
    return RocketChat.API.v1.success({
      announcement: this.bodyParams.announcement
    });
  }

});
RocketChat.API.v1.addRoute('channels.setType', {
  authRequired: true
}, {
  post() {
    if (!this.bodyParams.type || !this.bodyParams.type.trim()) {
      return RocketChat.API.v1.failure('The bodyParam "type" is required');
    }

    const findResult = findChannelByIdOrName({
      params: this.requestParams()
    });

    if (findResult.t === this.bodyParams.type) {
      return RocketChat.API.v1.failure('The channel type is the same as what it would be changed to.');
    }

    Meteor.runAsUser(this.userId, () => {
      Meteor.call('saveRoomSettings', findResult._id, 'roomType', this.bodyParams.type);
    });
    return RocketChat.API.v1.success({
      channel: RocketChat.models.Rooms.findOneById(findResult._id, {
        fields: RocketChat.API.v1.defaultFieldsToExclude
      })
    });
  }

});
RocketChat.API.v1.addRoute('channels.unarchive', {
  authRequired: true
}, {
  post() {
    const findResult = findChannelByIdOrName({
      params: this.requestParams(),
      checkedArchived: false
    });

    if (!findResult.archived) {
      return RocketChat.API.v1.failure(`The channel, ${findResult.name}, is not archived`);
    }

    Meteor.runAsUser(this.userId, () => {
      Meteor.call('unarchiveRoom', findResult._id);
    });
    return RocketChat.API.v1.success();
  }

});
RocketChat.API.v1.addRoute('channels.getAllUserMentionsByChannel', {
  authRequired: true
}, {
  get() {
    const {
      roomId
    } = this.requestParams();
    const {
      offset,
      count
    } = this.getPaginationItems();
    const {
      sort
    } = this.parseJsonQuery();

    if (!roomId) {
      return RocketChat.API.v1.failure('The request param "roomId" is required');
    }

    const mentions = Meteor.runAsUser(this.userId, () => Meteor.call('getUserMentionsByChannel', {
      roomId,
      options: {
        sort: sort ? sort : {
          ts: 1
        },
        skip: offset,
        limit: count
      }
    }));
    const allMentions = Meteor.runAsUser(this.userId, () => Meteor.call('getUserMentionsByChannel', {
      roomId,
      options: {}
    }));
    return RocketChat.API.v1.success({
      mentions,
      count: mentions.length,
      offset,
      total: allMentions.length
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"rooms.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_api/server/v1/rooms.js                                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var _interopRequireDefault = require("@babel/runtime/helpers/builtin/interopRequireDefault");

var _objectSpread2 = _interopRequireDefault(require("@babel/runtime/helpers/builtin/objectSpread"));

let Busboy;
module.watch(require("busboy"), {
  default(v) {
    Busboy = v;
  }

}, 0);

function findRoomByIdOrName({
  params,
  checkedArchived = true
}) {
  if ((!params.roomId || !params.roomId.trim()) && (!params.roomName || !params.roomName.trim())) {
    throw new Meteor.Error('error-roomid-param-not-provided', 'The parameter "roomId" or "roomName" is required');
  }

  const fields = (0, _objectSpread2.default)({}, RocketChat.API.v1.defaultFieldsToExclude);
  let room;

  if (params.roomId) {
    room = RocketChat.models.Rooms.findOneById(params.roomId, {
      fields
    });
  } else if (params.roomName) {
    room = RocketChat.models.Rooms.findOneByName(params.roomName, {
      fields
    });
  }

  if (!room) {
    throw new Meteor.Error('error-room-not-found', 'The required "roomId" or "roomName" param provided does not match any channel');
  }

  if (checkedArchived && room.archived) {
    throw new Meteor.Error('error-room-archived', `The channel, ${room.name}, is archived`);
  }

  return room;
}

RocketChat.API.v1.addRoute('rooms.get', {
  authRequired: true
}, {
  get() {
    const {
      updatedSince
    } = this.queryParams;
    let updatedSinceDate;

    if (updatedSince) {
      if (isNaN(Date.parse(updatedSince))) {
        throw new Meteor.Error('error-updatedSince-param-invalid', 'The "updatedSince" query parameter must be a valid date.');
      } else {
        updatedSinceDate = new Date(updatedSince);
      }
    }

    let result;
    Meteor.runAsUser(this.userId, () => result = Meteor.call('rooms/get', updatedSinceDate));

    if (Array.isArray(result)) {
      result = {
        update: result,
        remove: []
      };
    }

    return RocketChat.API.v1.success(result);
  }

});
RocketChat.API.v1.addRoute('rooms.upload/:rid', {
  authRequired: true
}, {
  post() {
    const room = Meteor.call('canAccessRoom', this.urlParams.rid, this.userId);

    if (!room) {
      return RocketChat.API.v1.unauthorized();
    }

    const busboy = new Busboy({
      headers: this.request.headers
    });
    const files = [];
    const fields = {};
    Meteor.wrapAsync(callback => {
      busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
        if (fieldname !== 'file') {
          return files.push(new Meteor.Error('invalid-field'));
        }

        const fileDate = [];
        file.on('data', data => fileDate.push(data));
        file.on('end', () => {
          files.push({
            fieldname,
            file,
            filename,
            encoding,
            mimetype,
            fileBuffer: Buffer.concat(fileDate)
          });
        });
      });
      busboy.on('field', (fieldname, value) => fields[fieldname] = value);
      busboy.on('finish', Meteor.bindEnvironment(() => callback()));
      this.request.pipe(busboy);
    })();

    if (files.length === 0) {
      return RocketChat.API.v1.failure('File required');
    }

    if (files.length > 1) {
      return RocketChat.API.v1.failure('Just 1 file is allowed');
    }

    const file = files[0];
    const fileStore = FileUpload.getStore('Uploads');
    const details = {
      name: file.filename,
      size: file.fileBuffer.length,
      type: file.mimetype,
      rid: this.urlParams.rid,
      userId: this.userId
    };
    Meteor.runAsUser(this.userId, () => {
      const uploadedFile = Meteor.wrapAsync(fileStore.insert.bind(fileStore))(details, file.fileBuffer);
      uploadedFile.description = fields.description;
      delete fields.description;
      RocketChat.API.v1.success(Meteor.call('sendFileMessage', this.urlParams.rid, null, uploadedFile, fields));
    });
    return RocketChat.API.v1.success();
  }

});
RocketChat.API.v1.addRoute('rooms.saveNotification', {
  authRequired: true
}, {
  post() {
    const saveNotifications = (notifications, roomId) => {
      Object.keys(notifications).map(notificationKey => {
        Meteor.runAsUser(this.userId, () => Meteor.call('saveNotificationSettings', roomId, notificationKey, notifications[notificationKey]));
      });
    };

    const {
      roomId,
      notifications
    } = this.bodyParams;

    if (!roomId) {
      return RocketChat.API.v1.failure('The \'roomId\' param is required');
    }

    if (!notifications || Object.keys(notifications).length === 0) {
      return RocketChat.API.v1.failure('The \'notifications\' param is required');
    }

    saveNotifications(notifications, roomId);
    return RocketChat.API.v1.success();
  }

});
RocketChat.API.v1.addRoute('rooms.favorite', {
  authRequired: true
}, {
  post() {
    const {
      favorite
    } = this.bodyParams;

    if (!this.bodyParams.hasOwnProperty('favorite')) {
      return RocketChat.API.v1.failure('The \'favorite\' param is required');
    }

    const room = findRoomByIdOrName({
      params: this.bodyParams
    });
    Meteor.runAsUser(this.userId, () => Meteor.call('toggleFavorite', room._id, favorite));
    return RocketChat.API.v1.success();
  }

});
RocketChat.API.v1.addRoute('rooms.cleanHistory', {
  authRequired: true
}, {
  post() {
    const findResult = findRoomByIdOrName({
      params: this.bodyParams
    });

    if (!this.bodyParams.latest) {
      return RocketChat.API.v1.failure('Body parameter "latest" is required.');
    }

    if (!this.bodyParams.oldest) {
      return RocketChat.API.v1.failure('Body parameter "oldest" is required.');
    }

    const latest = new Date(this.bodyParams.latest);
    const oldest = new Date(this.bodyParams.oldest);
    let inclusive = false;

    if (typeof this.bodyParams.inclusive !== 'undefined') {
      inclusive = this.bodyParams.inclusive;
    }

    Meteor.runAsUser(this.userId, () => {
      Meteor.call('cleanRoomHistory', {
        roomId: findResult._id,
        latest,
        oldest,
        inclusive
      });
    });
    return RocketChat.API.v1.success();
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"subscriptions.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_api/server/v1/subscriptions.js                                                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.API.v1.addRoute('subscriptions.get', {
  authRequired: true
}, {
  get() {
    const {
      updatedSince
    } = this.queryParams;
    let updatedSinceDate;

    if (updatedSince) {
      if (isNaN(Date.parse(updatedSince))) {
        throw new Meteor.Error('error-roomId-param-invalid', 'The "lastUpdate" query parameter must be a valid date.');
      } else {
        updatedSinceDate = new Date(updatedSince);
      }
    }

    let result;
    Meteor.runAsUser(this.userId, () => result = Meteor.call('subscriptions/get', updatedSinceDate));

    if (Array.isArray(result)) {
      result = {
        update: result,
        remove: []
      };
    }

    return RocketChat.API.v1.success(result);
  }

});
RocketChat.API.v1.addRoute('subscriptions.getOne', {
  authRequired: true
}, {
  get() {
    const {
      roomId
    } = this.requestParams();

    if (!roomId) {
      return RocketChat.API.v1.failure('The \'roomId\' param is required');
    }

    const subscription = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(roomId, this.userId, {
      fields: {
        _room: 0,
        _user: 0,
        $loki: 0
      }
    });
    return RocketChat.API.v1.success({
      subscription
    });
  }

});
/**
	This API is suppose to mark any room as read.

	Method: POST
	Route: api/v1/subscriptions.read
	Params:
		- rid: The rid of the room to be marked as read.
 */

RocketChat.API.v1.addRoute('subscriptions.read', {
  authRequired: true
}, {
  post() {
    check(this.bodyParams, {
      rid: String
    });
    Meteor.runAsUser(this.userId, () => Meteor.call('readMessages', this.bodyParams.rid));
    return RocketChat.API.v1.success();
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"chat.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_api/server/v1/chat.js                                                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/* global processWebhookMessage */
RocketChat.API.v1.addRoute('chat.delete', {
  authRequired: true
}, {
  post() {
    check(this.bodyParams, Match.ObjectIncluding({
      msgId: String,
      roomId: String,
      asUser: Match.Maybe(Boolean)
    }));
    const msg = RocketChat.models.Messages.findOneById(this.bodyParams.msgId, {
      fields: {
        u: 1,
        rid: 1
      }
    });

    if (!msg) {
      return RocketChat.API.v1.failure(`No message found with the id of "${this.bodyParams.msgId}".`);
    }

    if (this.bodyParams.roomId !== msg.rid) {
      return RocketChat.API.v1.failure('The room id provided does not match where the message is from.');
    }

    if (this.bodyParams.asUser && msg.u._id !== this.userId && !RocketChat.authz.hasPermission(Meteor.userId(), 'force-delete-message', msg.rid)) {
      return RocketChat.API.v1.failure('Unauthorized. You must have the permission "force-delete-message" to delete other\'s message as them.');
    }

    Meteor.runAsUser(this.bodyParams.asUser ? msg.u._id : this.userId, () => {
      Meteor.call('deleteMessage', {
        _id: msg._id
      });
    });
    return RocketChat.API.v1.success({
      _id: msg._id,
      ts: Date.now(),
      message: msg
    });
  }

});
RocketChat.API.v1.addRoute('chat.syncMessages', {
  authRequired: true
}, {
  get() {
    const {
      roomId,
      lastUpdate
    } = this.queryParams;

    if (!roomId) {
      throw new Meteor.Error('error-roomId-param-not-provided', 'The required "roomId" query param is missing.');
    }

    if (!lastUpdate) {
      throw new Meteor.Error('error-lastUpdate-param-not-provided', 'The required "lastUpdate" query param is missing.');
    } else if (isNaN(Date.parse(lastUpdate))) {
      throw new Meteor.Error('error-roomId-param-invalid', 'The "lastUpdate" query parameter must be a valid date.');
    }

    let result;
    Meteor.runAsUser(this.userId, () => {
      result = Meteor.call('messages/get', roomId, {
        lastUpdate: new Date(lastUpdate)
      });
    });

    if (!result) {
      return RocketChat.API.v1.failure();
    }

    return RocketChat.API.v1.success({
      result
    });
  }

});
RocketChat.API.v1.addRoute('chat.getMessage', {
  authRequired: true
}, {
  get() {
    if (!this.queryParams.msgId) {
      return RocketChat.API.v1.failure('The "msgId" query parameter must be provided.');
    }

    let msg;
    Meteor.runAsUser(this.userId, () => {
      msg = Meteor.call('getSingleMessage', this.queryParams.msgId);
    });

    if (!msg) {
      return RocketChat.API.v1.failure();
    }

    return RocketChat.API.v1.success({
      message: msg
    });
  }

});
RocketChat.API.v1.addRoute('chat.pinMessage', {
  authRequired: true
}, {
  post() {
    if (!this.bodyParams.messageId || !this.bodyParams.messageId.trim()) {
      throw new Meteor.Error('error-messageid-param-not-provided', 'The required "messageId" param is missing.');
    }

    const msg = RocketChat.models.Messages.findOneById(this.bodyParams.messageId);

    if (!msg) {
      throw new Meteor.Error('error-message-not-found', 'The provided "messageId" does not match any existing message.');
    }

    let pinnedMessage;
    Meteor.runAsUser(this.userId, () => pinnedMessage = Meteor.call('pinMessage', msg));
    return RocketChat.API.v1.success({
      message: pinnedMessage
    });
  }

});
RocketChat.API.v1.addRoute('chat.postMessage', {
  authRequired: true
}, {
  post() {
    const messageReturn = processWebhookMessage(this.bodyParams, this.user, undefined, true)[0];

    if (!messageReturn) {
      return RocketChat.API.v1.failure('unknown-error');
    }

    return RocketChat.API.v1.success({
      ts: Date.now(),
      channel: messageReturn.channel,
      message: messageReturn.message
    });
  }

});
RocketChat.API.v1.addRoute('chat.search', {
  authRequired: true
}, {
  get() {
    const {
      roomId,
      searchText,
      limit
    } = this.queryParams;

    if (!roomId) {
      throw new Meteor.Error('error-roomId-param-not-provided', 'The required "roomId" query param is missing.');
    }

    if (!searchText) {
      throw new Meteor.Error('error-searchText-param-not-provided', 'The required "searchText" query param is missing.');
    }

    if (limit && (typeof limit !== 'number' || isNaN(limit) || limit <= 0)) {
      throw new Meteor.Error('error-limit-param-invalid', 'The "limit" query parameter must be a valid number and be greater than 0.');
    }

    let result;
    Meteor.runAsUser(this.userId, () => result = Meteor.call('messageSearch', searchText, roomId, limit).message.docs);
    return RocketChat.API.v1.success({
      messages: result
    });
  }

}); // The difference between `chat.postMessage` and `chat.sendMessage` is that `chat.sendMessage` allows
// for passing a value for `_id` and the other one doesn't. Also, `chat.sendMessage` only sends it to
// one channel whereas the other one allows for sending to more than one channel at a time.

RocketChat.API.v1.addRoute('chat.sendMessage', {
  authRequired: true
}, {
  post() {
    if (!this.bodyParams.message) {
      throw new Meteor.Error('error-invalid-params', 'The "message" parameter must be provided.');
    }

    let message;
    Meteor.runAsUser(this.userId, () => message = Meteor.call('sendMessage', this.bodyParams.message));
    return RocketChat.API.v1.success({
      message
    });
  }

});
RocketChat.API.v1.addRoute('chat.starMessage', {
  authRequired: true
}, {
  post() {
    if (!this.bodyParams.messageId || !this.bodyParams.messageId.trim()) {
      throw new Meteor.Error('error-messageid-param-not-provided', 'The required "messageId" param is required.');
    }

    const msg = RocketChat.models.Messages.findOneById(this.bodyParams.messageId);

    if (!msg) {
      throw new Meteor.Error('error-message-not-found', 'The provided "messageId" does not match any existing message.');
    }

    Meteor.runAsUser(this.userId, () => Meteor.call('starMessage', {
      _id: msg._id,
      rid: msg.rid,
      starred: true
    }));
    return RocketChat.API.v1.success();
  }

});
RocketChat.API.v1.addRoute('chat.unPinMessage', {
  authRequired: true
}, {
  post() {
    if (!this.bodyParams.messageId || !this.bodyParams.messageId.trim()) {
      throw new Meteor.Error('error-messageid-param-not-provided', 'The required "messageId" param is required.');
    }

    const msg = RocketChat.models.Messages.findOneById(this.bodyParams.messageId);

    if (!msg) {
      throw new Meteor.Error('error-message-not-found', 'The provided "messageId" does not match any existing message.');
    }

    Meteor.runAsUser(this.userId, () => Meteor.call('unpinMessage', msg));
    return RocketChat.API.v1.success();
  }

});
RocketChat.API.v1.addRoute('chat.unStarMessage', {
  authRequired: true
}, {
  post() {
    if (!this.bodyParams.messageId || !this.bodyParams.messageId.trim()) {
      throw new Meteor.Error('error-messageid-param-not-provided', 'The required "messageId" param is required.');
    }

    const msg = RocketChat.models.Messages.findOneById(this.bodyParams.messageId);

    if (!msg) {
      throw new Meteor.Error('error-message-not-found', 'The provided "messageId" does not match any existing message.');
    }

    Meteor.runAsUser(this.userId, () => Meteor.call('starMessage', {
      _id: msg._id,
      rid: msg.rid,
      starred: false
    }));
    return RocketChat.API.v1.success();
  }

});
RocketChat.API.v1.addRoute('chat.update', {
  authRequired: true
}, {
  post() {
    check(this.bodyParams, Match.ObjectIncluding({
      roomId: String,
      msgId: String,
      text: String //Using text to be consistant with chat.postMessage

    }));
    const msg = RocketChat.models.Messages.findOneById(this.bodyParams.msgId); //Ensure the message exists

    if (!msg) {
      return RocketChat.API.v1.failure(`No message found with the id of "${this.bodyParams.msgId}".`);
    }

    if (this.bodyParams.roomId !== msg.rid) {
      return RocketChat.API.v1.failure('The room id provided does not match where the message is from.');
    } //Permission checks are already done in the updateMessage method, so no need to duplicate them


    Meteor.runAsUser(this.userId, () => {
      Meteor.call('updateMessage', {
        _id: msg._id,
        msg: this.bodyParams.text,
        rid: msg.rid
      });
    });
    return RocketChat.API.v1.success({
      message: RocketChat.models.Messages.findOneById(msg._id)
    });
  }

});
RocketChat.API.v1.addRoute('chat.react', {
  authRequired: true
}, {
  post() {
    if (!this.bodyParams.messageId || !this.bodyParams.messageId.trim()) {
      throw new Meteor.Error('error-messageid-param-not-provided', 'The required "messageId" param is missing.');
    }

    const msg = RocketChat.models.Messages.findOneById(this.bodyParams.messageId);

    if (!msg) {
      throw new Meteor.Error('error-message-not-found', 'The provided "messageId" does not match any existing message.');
    }

    const emoji = this.bodyParams.emoji || this.bodyParams.reaction;

    if (!emoji) {
      throw new Meteor.Error('error-emoji-param-not-provided', 'The required "emoji" param is missing.');
    }

    Meteor.runAsUser(this.userId, () => Meteor.call('setReaction', emoji, msg._id));
    return RocketChat.API.v1.success();
  }

});
RocketChat.API.v1.addRoute('chat.getMessageReadReceipts', {
  authRequired: true
}, {
  get() {
    const {
      messageId
    } = this.queryParams;

    if (!messageId) {
      return RocketChat.API.v1.failure({
        error: 'The required \'messageId\' param is missing.'
      });
    }

    try {
      const messageReadReceipts = Meteor.runAsUser(this.userId, () => Meteor.call('getReadReceipts', {
        messageId
      }));
      return RocketChat.API.v1.success({
        receipts: messageReadReceipts
      });
    } catch (error) {
      return RocketChat.API.v1.failure({
        error: error.message
      });
    }
  }

});
RocketChat.API.v1.addRoute('chat.reportMessage', {
  authRequired: true
}, {
  post() {
    const {
      messageId,
      description
    } = this.bodyParams;

    if (!messageId) {
      return RocketChat.API.v1.failure('The required "messageId" param is missing.');
    }

    if (!description) {
      return RocketChat.API.v1.failure('The required "description" param is missing.');
    }

    Meteor.runAsUser(this.userId, () => Meteor.call('reportMessage', messageId, description));
    return RocketChat.API.v1.success();
  }

});
RocketChat.API.v1.addRoute('chat.ignoreUser', {
  authRequired: true
}, {
  get() {
    const {
      rid,
      userId
    } = this.queryParams;
    let {
      ignore = true
    } = this.queryParams;
    ignore = typeof ignore === 'string' ? /true|1/.test(ignore) : ignore;

    if (!rid || !rid.trim()) {
      throw new Meteor.Error('error-room-id-param-not-provided', 'The required "rid" param is missing.');
    }

    if (!userId || !userId.trim()) {
      throw new Meteor.Error('error-user-id-param-not-provided', 'The required "userId" param is missing.');
    }

    Meteor.runAsUser(this.userId, () => Meteor.call('ignoreUser', {
      rid,
      userId,
      ignore
    }));
    return RocketChat.API.v1.success();
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"commands.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_api/server/v1/commands.js                                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.API.v1.addRoute('commands.get', {
  authRequired: true
}, {
  get() {
    const params = this.queryParams;

    if (typeof params.command !== 'string') {
      return RocketChat.API.v1.failure('The query param "command" must be provided.');
    }

    const cmd = RocketChat.slashCommands.commands[params.command.toLowerCase()];

    if (!cmd) {
      return RocketChat.API.v1.failure(`There is no command in the system by the name of: ${params.command}`);
    }

    return RocketChat.API.v1.success({
      command: cmd
    });
  }

});
RocketChat.API.v1.addRoute('commands.list', {
  authRequired: true
}, {
  get() {
    const {
      offset,
      count
    } = this.getPaginationItems();
    const {
      sort,
      fields,
      query
    } = this.parseJsonQuery();
    let commands = Object.values(RocketChat.slashCommands.commands);

    if (query && query.command) {
      commands = commands.filter(command => command.command === query.command);
    }

    const totalCount = commands.length;
    commands = RocketChat.models.Rooms.processQueryOptionsOnResult(commands, {
      sort: sort ? sort : {
        name: 1
      },
      skip: offset,
      limit: count,
      fields
    });
    return RocketChat.API.v1.success({
      commands,
      offset,
      count: commands.length,
      total: totalCount
    });
  }

}); // Expects a body of: { command: 'gimme', params: 'any string value', roomId: 'value' }

RocketChat.API.v1.addRoute('commands.run', {
  authRequired: true
}, {
  post() {
    const body = this.bodyParams;
    const user = this.getLoggedInUser();

    if (typeof body.command !== 'string') {
      return RocketChat.API.v1.failure('You must provide a command to run.');
    }

    if (body.params && typeof body.params !== 'string') {
      return RocketChat.API.v1.failure('The parameters for the command must be a single string.');
    }

    if (typeof body.roomId !== 'string') {
      return RocketChat.API.v1.failure('The room\'s id where to execute this command must provided and be a string.');
    }

    const cmd = body.command.toLowerCase();

    if (!RocketChat.slashCommands.commands[body.command.toLowerCase()]) {
      return RocketChat.API.v1.failure('The command provided does not exist (or is disabled).');
    } // This will throw an error if they can't or the room is invalid


    Meteor.call('canAccessRoom', body.roomId, user._id);
    const params = body.params ? body.params : '';
    let result;
    Meteor.runAsUser(user._id, () => {
      result = RocketChat.slashCommands.run(cmd, params, {
        _id: Random.id(),
        rid: body.roomId,
        msg: `/${cmd} ${params}`
      });
    });
    return RocketChat.API.v1.success({
      result
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"emoji-custom.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_api/server/v1/emoji-custom.js                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.API.v1.addRoute('emoji-custom', {
  authRequired: true
}, {
  get() {
    const emojis = Meteor.call('listEmojiCustom');
    return RocketChat.API.v1.success({
      emojis
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"groups.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_api/server/v1/groups.js                                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);

//Returns the private group subscription IF found otherwise it will return the failure of why it didn't. Check the `statusCode` property
function findPrivateGroupByIdOrName({
  params,
  userId,
  checkedArchived = true
}) {
  if ((!params.roomId || !params.roomId.trim()) && (!params.roomName || !params.roomName.trim())) {
    throw new Meteor.Error('error-room-param-not-provided', 'The parameter "roomId" or "roomName" is required');
  }

  let roomSub;

  if (params.roomId) {
    roomSub = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(params.roomId, userId);
  } else if (params.roomName) {
    roomSub = RocketChat.models.Subscriptions.findOneByRoomNameAndUserId(params.roomName, userId);
  }

  if (!roomSub || roomSub.t !== 'p') {
    throw new Meteor.Error('error-room-not-found', 'The required "roomId" or "roomName" param provided does not match any group');
  }

  if (checkedArchived && roomSub.archived) {
    throw new Meteor.Error('error-room-archived', `The private group, ${roomSub.name}, is archived`);
  }

  return roomSub;
}

RocketChat.API.v1.addRoute('groups.addAll', {
  authRequired: true
}, {
  post() {
    const findResult = findPrivateGroupByIdOrName({
      params: this.requestParams(),
      userId: this.userId
    });
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('addAllUserToRoom', findResult.rid, this.bodyParams.activeUsersOnly);
    });
    return RocketChat.API.v1.success({
      group: RocketChat.models.Rooms.findOneById(findResult.rid, {
        fields: RocketChat.API.v1.defaultFieldsToExclude
      })
    });
  }

});
RocketChat.API.v1.addRoute('groups.addModerator', {
  authRequired: true
}, {
  post() {
    const findResult = findPrivateGroupByIdOrName({
      params: this.requestParams(),
      userId: this.userId
    });
    const user = this.getUserFromParams();
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('addRoomModerator', findResult.rid, user._id);
    });
    return RocketChat.API.v1.success();
  }

});
RocketChat.API.v1.addRoute('groups.addOwner', {
  authRequired: true
}, {
  post() {
    const findResult = findPrivateGroupByIdOrName({
      params: this.requestParams(),
      userId: this.userId
    });
    const user = this.getUserFromParams();
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('addRoomOwner', findResult.rid, user._id);
    });
    return RocketChat.API.v1.success();
  }

});
RocketChat.API.v1.addRoute('groups.addLeader', {
  authRequired: true
}, {
  post() {
    const findResult = findPrivateGroupByIdOrName({
      params: this.requestParams(),
      userId: this.userId
    });
    const user = this.getUserFromParams();
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('addRoomLeader', findResult.rid, user._id);
    });
    return RocketChat.API.v1.success();
  }

}); //Archives a private group only if it wasn't

RocketChat.API.v1.addRoute('groups.archive', {
  authRequired: true
}, {
  post() {
    const findResult = findPrivateGroupByIdOrName({
      params: this.requestParams(),
      userId: this.userId
    });
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('archiveRoom', findResult.rid);
    });
    return RocketChat.API.v1.success();
  }

});
RocketChat.API.v1.addRoute('groups.close', {
  authRequired: true
}, {
  post() {
    const findResult = findPrivateGroupByIdOrName({
      params: this.requestParams(),
      userId: this.userId,
      checkedArchived: false
    });

    if (!findResult.open) {
      return RocketChat.API.v1.failure(`The private group, ${findResult.name}, is already closed to the sender`);
    }

    Meteor.runAsUser(this.userId, () => {
      Meteor.call('hideRoom', findResult.rid);
    });
    return RocketChat.API.v1.success();
  }

}); //Create Private Group

RocketChat.API.v1.addRoute('groups.create', {
  authRequired: true
}, {
  post() {
    if (!RocketChat.authz.hasPermission(this.userId, 'create-p')) {
      return RocketChat.API.v1.unauthorized();
    }

    if (!this.bodyParams.name) {
      return RocketChat.API.v1.failure('Body param "name" is required');
    }

    if (this.bodyParams.members && !_.isArray(this.bodyParams.members)) {
      return RocketChat.API.v1.failure('Body param "members" must be an array if provided');
    }

    if (this.bodyParams.customFields && !(typeof this.bodyParams.customFields === 'object')) {
      return RocketChat.API.v1.failure('Body param "customFields" must be an object if provided');
    }

    let readOnly = false;

    if (typeof this.bodyParams.readOnly !== 'undefined') {
      readOnly = this.bodyParams.readOnly;
    }

    let id;
    Meteor.runAsUser(this.userId, () => {
      id = Meteor.call('createPrivateGroup', this.bodyParams.name, this.bodyParams.members ? this.bodyParams.members : [], readOnly, this.bodyParams.customFields);
    });
    return RocketChat.API.v1.success({
      group: RocketChat.models.Rooms.findOneById(id.rid, {
        fields: RocketChat.API.v1.defaultFieldsToExclude
      })
    });
  }

});
RocketChat.API.v1.addRoute('groups.delete', {
  authRequired: true
}, {
  post() {
    const findResult = findPrivateGroupByIdOrName({
      params: this.requestParams(),
      userId: this.userId,
      checkedArchived: false
    });
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('eraseRoom', findResult.rid);
    });
    return RocketChat.API.v1.success({
      group: RocketChat.models.Rooms.processQueryOptionsOnResult([findResult._room], {
        fields: RocketChat.API.v1.defaultFieldsToExclude
      })[0]
    });
  }

});
RocketChat.API.v1.addRoute('groups.files', {
  authRequired: true
}, {
  get() {
    const findResult = findPrivateGroupByIdOrName({
      params: this.requestParams(),
      userId: this.userId,
      checkedArchived: false
    });

    const addUserObjectToEveryObject = file => {
      if (file.userId) {
        file = this.insertUserObject({
          object: file,
          userId: file.userId
        });
      }

      return file;
    };

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
      rid: findResult.rid
    });
    const files = RocketChat.models.Uploads.find(ourQuery, {
      sort: sort ? sort : {
        name: 1
      },
      skip: offset,
      limit: count,
      fields
    }).fetch();
    return RocketChat.API.v1.success({
      files: files.map(addUserObjectToEveryObject),
      count: files.length,
      offset,
      total: RocketChat.models.Uploads.find(ourQuery).count()
    });
  }

});
RocketChat.API.v1.addRoute('groups.getIntegrations', {
  authRequired: true
}, {
  get() {
    if (!RocketChat.authz.hasPermission(this.userId, 'manage-integrations')) {
      return RocketChat.API.v1.unauthorized();
    }

    const findResult = findPrivateGroupByIdOrName({
      params: this.requestParams(),
      userId: this.userId,
      checkedArchived: false
    });
    let includeAllPrivateGroups = true;

    if (typeof this.queryParams.includeAllPrivateGroups !== 'undefined') {
      includeAllPrivateGroups = this.queryParams.includeAllPrivateGroups === 'true';
    }

    const channelsToSearch = [`#${findResult.name}`];

    if (includeAllPrivateGroups) {
      channelsToSearch.push('all_private_groups');
    }

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
      channel: {
        $in: channelsToSearch
      }
    });
    const integrations = RocketChat.models.Integrations.find(ourQuery, {
      sort: sort ? sort : {
        _createdAt: 1
      },
      skip: offset,
      limit: count,
      fields
    }).fetch();
    return RocketChat.API.v1.success({
      integrations,
      count: integrations.length,
      offset,
      total: RocketChat.models.Integrations.find(ourQuery).count()
    });
  }

});
RocketChat.API.v1.addRoute('groups.history', {
  authRequired: true
}, {
  get() {
    const findResult = findPrivateGroupByIdOrName({
      params: this.requestParams(),
      userId: this.userId,
      checkedArchived: false
    });
    let latestDate = new Date();

    if (this.queryParams.latest) {
      latestDate = new Date(this.queryParams.latest);
    }

    let oldestDate = undefined;

    if (this.queryParams.oldest) {
      oldestDate = new Date(this.queryParams.oldest);
    }

    let inclusive = false;

    if (this.queryParams.inclusive) {
      inclusive = this.queryParams.inclusive;
    }

    let count = 20;

    if (this.queryParams.count) {
      count = parseInt(this.queryParams.count);
    }

    let unreads = false;

    if (this.queryParams.unreads) {
      unreads = this.queryParams.unreads;
    }

    let result;
    Meteor.runAsUser(this.userId, () => {
      result = Meteor.call('getChannelHistory', {
        rid: findResult.rid,
        latest: latestDate,
        oldest: oldestDate,
        inclusive,
        count,
        unreads
      });
    });

    if (!result) {
      return RocketChat.API.v1.unauthorized();
    }

    return RocketChat.API.v1.success(result);
  }

});
RocketChat.API.v1.addRoute('groups.info', {
  authRequired: true
}, {
  get() {
    const findResult = findPrivateGroupByIdOrName({
      params: this.requestParams(),
      userId: this.userId,
      checkedArchived: false
    });
    return RocketChat.API.v1.success({
      group: RocketChat.models.Rooms.findOneById(findResult.rid, {
        fields: RocketChat.API.v1.defaultFieldsToExclude
      })
    });
  }

});
RocketChat.API.v1.addRoute('groups.invite', {
  authRequired: true
}, {
  post() {
    const findResult = findPrivateGroupByIdOrName({
      params: this.requestParams(),
      userId: this.userId
    });
    const user = this.getUserFromParams();
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('addUserToRoom', {
        rid: findResult.rid,
        username: user.username
      });
    });
    return RocketChat.API.v1.success({
      group: RocketChat.models.Rooms.findOneById(findResult.rid, {
        fields: RocketChat.API.v1.defaultFieldsToExclude
      })
    });
  }

});
RocketChat.API.v1.addRoute('groups.kick', {
  authRequired: true
}, {
  post() {
    const findResult = findPrivateGroupByIdOrName({
      params: this.requestParams(),
      userId: this.userId
    });
    const user = this.getUserFromParams();
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('removeUserFromRoom', {
        rid: findResult.rid,
        username: user.username
      });
    });
    return RocketChat.API.v1.success();
  }

});
RocketChat.API.v1.addRoute('groups.leave', {
  authRequired: true
}, {
  post() {
    const findResult = findPrivateGroupByIdOrName({
      params: this.requestParams(),
      userId: this.userId
    });
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('leaveRoom', findResult.rid);
    });
    return RocketChat.API.v1.success();
  }

}); //List Private Groups a user has access to

RocketChat.API.v1.addRoute('groups.list', {
  authRequired: true
}, {
  get() {
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
      t: 'p',
      'u._id': this.userId
    });

    let rooms = _.pluck(RocketChat.models.Subscriptions.find(ourQuery).fetch(), '_room');

    const totalCount = rooms.length;
    rooms = RocketChat.models.Rooms.processQueryOptionsOnResult(rooms, {
      sort: sort ? sort : {
        name: 1
      },
      skip: offset,
      limit: count,
      fields
    });
    return RocketChat.API.v1.success({
      groups: rooms,
      offset,
      count: rooms.length,
      total: totalCount
    });
  }

});
RocketChat.API.v1.addRoute('groups.listAll', {
  authRequired: true
}, {
  get() {
    if (!RocketChat.authz.hasPermission(this.userId, 'view-room-administration')) {
      return RocketChat.API.v1.unauthorized();
    }

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
      t: 'p'
    });
    let rooms = RocketChat.models.Rooms.find(ourQuery).fetch();
    const totalCount = rooms.length;
    rooms = RocketChat.models.Rooms.processQueryOptionsOnResult(rooms, {
      sort: sort ? sort : {
        name: 1
      },
      skip: offset,
      limit: count,
      fields
    });
    return RocketChat.API.v1.success({
      groups: rooms,
      offset,
      count: rooms.length,
      total: totalCount
    });
  }

});
RocketChat.API.v1.addRoute('groups.members', {
  authRequired: true
}, {
  get() {
    const findResult = findPrivateGroupByIdOrName({
      params: this.requestParams(),
      userId: this.userId
    });
    const {
      offset,
      count
    } = this.getPaginationItems();
    const {
      sort
    } = this.parseJsonQuery();

    let sortFn = (a, b) => a > b;

    if (Match.test(sort, Object) && Match.test(sort.username, Number) && sort.username === -1) {
      sortFn = (a, b) => b < a;
    }

    const members = RocketChat.models.Rooms.processQueryOptionsOnResult(Array.from(findResult._room.usernames).sort(sortFn), {
      skip: offset,
      limit: count
    });
    const users = RocketChat.models.Users.find({
      username: {
        $in: members
      }
    }, {
      fields: {
        _id: 1,
        username: 1,
        name: 1,
        status: 1,
        utcOffset: 1
      },
      sort: sort ? sort : {
        username: 1
      }
    }).fetch();
    return RocketChat.API.v1.success({
      members: users,
      count: members.length,
      offset,
      total: findResult._room.usernames.length
    });
  }

});
RocketChat.API.v1.addRoute('groups.messages', {
  authRequired: true
}, {
  get() {
    const findResult = findPrivateGroupByIdOrName({
      params: this.requestParams(),
      userId: this.userId
    });
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
      rid: findResult.rid
    });
    const messages = RocketChat.models.Messages.find(ourQuery, {
      sort: sort ? sort : {
        ts: -1
      },
      skip: offset,
      limit: count,
      fields
    }).fetch();
    return RocketChat.API.v1.success({
      messages,
      count: messages.length,
      offset,
      total: RocketChat.models.Messages.find(ourQuery).count()
    });
  }

});
RocketChat.API.v1.addRoute('groups.online', {
  authRequired: true
}, {
  get() {
    const {
      query
    } = this.parseJsonQuery();
    const ourQuery = Object.assign({}, query, {
      t: 'p'
    });
    const room = RocketChat.models.Rooms.findOne(ourQuery);

    if (room == null) {
      return RocketChat.API.v1.failure('Group does not exists');
    }

    const online = RocketChat.models.Users.findUsersNotOffline({
      fields: {
        username: 1
      }
    }).fetch();
    const onlineInRoom = [];
    online.forEach(user => {
      if (room.usernames.indexOf(user.username) !== -1) {
        onlineInRoom.push({
          _id: user._id,
          username: user.username
        });
      }
    });
    return RocketChat.API.v1.success({
      online: onlineInRoom
    });
  }

});
RocketChat.API.v1.addRoute('groups.open', {
  authRequired: true
}, {
  post() {
    const findResult = findPrivateGroupByIdOrName({
      params: this.requestParams(),
      userId: this.userId,
      checkedArchived: false
    });

    if (findResult.open) {
      return RocketChat.API.v1.failure(`The private group, ${findResult.name}, is already open for the sender`);
    }

    Meteor.runAsUser(this.userId, () => {
      Meteor.call('openRoom', findResult.rid);
    });
    return RocketChat.API.v1.success();
  }

});
RocketChat.API.v1.addRoute('groups.removeModerator', {
  authRequired: true
}, {
  post() {
    const findResult = findPrivateGroupByIdOrName({
      params: this.requestParams(),
      userId: this.userId
    });
    const user = this.getUserFromParams();
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('removeRoomModerator', findResult.rid, user._id);
    });
    return RocketChat.API.v1.success();
  }

});
RocketChat.API.v1.addRoute('groups.removeOwner', {
  authRequired: true
}, {
  post() {
    const findResult = findPrivateGroupByIdOrName({
      params: this.requestParams(),
      userId: this.userId
    });
    const user = this.getUserFromParams();
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('removeRoomOwner', findResult.rid, user._id);
    });
    return RocketChat.API.v1.success();
  }

});
RocketChat.API.v1.addRoute('groups.removeLeader', {
  authRequired: true
}, {
  post() {
    const findResult = findPrivateGroupByIdOrName({
      params: this.requestParams(),
      userId: this.userId
    });
    const user = this.getUserFromParams();
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('removeRoomLeader', findResult.rid, user._id);
    });
    return RocketChat.API.v1.success();
  }

});
RocketChat.API.v1.addRoute('groups.rename', {
  authRequired: true
}, {
  post() {
    if (!this.bodyParams.name || !this.bodyParams.name.trim()) {
      return RocketChat.API.v1.failure('The bodyParam "name" is required');
    }

    const findResult = findPrivateGroupByIdOrName({
      params: {
        roomId: this.bodyParams.roomId
      },
      userId: this.userId
    });
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('saveRoomSettings', findResult.rid, 'roomName', this.bodyParams.name);
    });
    return RocketChat.API.v1.success({
      group: RocketChat.models.Rooms.findOneById(findResult.rid, {
        fields: RocketChat.API.v1.defaultFieldsToExclude
      })
    });
  }

});
RocketChat.API.v1.addRoute('groups.setDescription', {
  authRequired: true
}, {
  post() {
    if (!this.bodyParams.description || !this.bodyParams.description.trim()) {
      return RocketChat.API.v1.failure('The bodyParam "description" is required');
    }

    const findResult = findPrivateGroupByIdOrName({
      params: this.requestParams(),
      userId: this.userId
    });
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('saveRoomSettings', findResult.rid, 'roomDescription', this.bodyParams.description);
    });
    return RocketChat.API.v1.success({
      description: this.bodyParams.description
    });
  }

});
RocketChat.API.v1.addRoute('groups.setPurpose', {
  authRequired: true
}, {
  post() {
    if (!this.bodyParams.purpose || !this.bodyParams.purpose.trim()) {
      return RocketChat.API.v1.failure('The bodyParam "purpose" is required');
    }

    const findResult = findPrivateGroupByIdOrName({
      params: this.requestParams(),
      userId: this.userId
    });
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('saveRoomSettings', findResult.rid, 'roomDescription', this.bodyParams.purpose);
    });
    return RocketChat.API.v1.success({
      purpose: this.bodyParams.purpose
    });
  }

});
RocketChat.API.v1.addRoute('groups.setReadOnly', {
  authRequired: true
}, {
  post() {
    if (typeof this.bodyParams.readOnly === 'undefined') {
      return RocketChat.API.v1.failure('The bodyParam "readOnly" is required');
    }

    const findResult = findPrivateGroupByIdOrName({
      params: this.requestParams(),
      userId: this.userId
    });

    if (findResult.ro === this.bodyParams.readOnly) {
      return RocketChat.API.v1.failure('The private group read only setting is the same as what it would be changed to.');
    }

    Meteor.runAsUser(this.userId, () => {
      Meteor.call('saveRoomSettings', findResult.rid, 'readOnly', this.bodyParams.readOnly);
    });
    return RocketChat.API.v1.success({
      group: RocketChat.models.Rooms.findOneById(findResult.rid, {
        fields: RocketChat.API.v1.defaultFieldsToExclude
      })
    });
  }

});
RocketChat.API.v1.addRoute('groups.setTopic', {
  authRequired: true
}, {
  post() {
    if (!this.bodyParams.topic || !this.bodyParams.topic.trim()) {
      return RocketChat.API.v1.failure('The bodyParam "topic" is required');
    }

    const findResult = findPrivateGroupByIdOrName({
      params: this.requestParams(),
      userId: this.userId
    });
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('saveRoomSettings', findResult.rid, 'roomTopic', this.bodyParams.topic);
    });
    return RocketChat.API.v1.success({
      topic: this.bodyParams.topic
    });
  }

});
RocketChat.API.v1.addRoute('groups.setType', {
  authRequired: true
}, {
  post() {
    if (!this.bodyParams.type || !this.bodyParams.type.trim()) {
      return RocketChat.API.v1.failure('The bodyParam "type" is required');
    }

    const findResult = findPrivateGroupByIdOrName({
      params: this.requestParams(),
      userId: this.userId
    });

    if (findResult.t === this.bodyParams.type) {
      return RocketChat.API.v1.failure('The private group type is the same as what it would be changed to.');
    }

    Meteor.runAsUser(this.userId, () => {
      Meteor.call('saveRoomSettings', findResult.rid, 'roomType', this.bodyParams.type);
    });
    return RocketChat.API.v1.success({
      group: RocketChat.models.Rooms.findOneById(findResult.rid, {
        fields: RocketChat.API.v1.defaultFieldsToExclude
      })
    });
  }

});
RocketChat.API.v1.addRoute('groups.unarchive', {
  authRequired: true
}, {
  post() {
    const findResult = findPrivateGroupByIdOrName({
      params: this.requestParams(),
      userId: this.userId,
      checkedArchived: false
    });
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('unarchiveRoom', findResult.rid);
    });
    return RocketChat.API.v1.success();
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"im.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_api/server/v1/im.js                                                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);

function findDirectMessageRoom(params, user) {
  if ((!params.roomId || !params.roomId.trim()) && (!params.username || !params.username.trim())) {
    throw new Meteor.Error('error-room-param-not-provided', 'Body param "roomId" or "username" is required');
  }

  const room = RocketChat.getRoomByNameOrIdWithOptionToJoin({
    currentUserId: user._id,
    nameOrId: params.username || params.roomId,
    type: 'd'
  });

  if (!room || room.t !== 'd') {
    throw new Meteor.Error('error-room-not-found', 'The required "roomId" or "username" param provided does not match any dirct message');
  }

  const subscription = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(room._id, user._id);
  return {
    room,
    subscription
  };
}

RocketChat.API.v1.addRoute(['dm.create', 'im.create'], {
  authRequired: true
}, {
  post() {
    const findResult = findDirectMessageRoom(this.requestParams(), this.user);
    return RocketChat.API.v1.success({
      room: findResult.room
    });
  }

});
RocketChat.API.v1.addRoute(['dm.close', 'im.close'], {
  authRequired: true
}, {
  post() {
    const findResult = findDirectMessageRoom(this.requestParams(), this.user);

    if (!findResult.subscription.open) {
      return RocketChat.API.v1.failure(`The direct message room, ${this.bodyParams.name}, is already closed to the sender`);
    }

    Meteor.runAsUser(this.userId, () => {
      Meteor.call('hideRoom', findResult.room._id);
    });
    return RocketChat.API.v1.success();
  }

});
RocketChat.API.v1.addRoute(['dm.files', 'im.files'], {
  authRequired: true
}, {
  get() {
    const findResult = findDirectMessageRoom(this.requestParams(), this.user);

    const addUserObjectToEveryObject = file => {
      if (file.userId) {
        file = this.insertUserObject({
          object: file,
          userId: file.userId
        });
      }

      return file;
    };

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
      rid: findResult.room._id
    });
    const files = RocketChat.models.Uploads.find(ourQuery, {
      sort: sort ? sort : {
        name: 1
      },
      skip: offset,
      limit: count,
      fields
    }).fetch();
    return RocketChat.API.v1.success({
      files: files.map(addUserObjectToEveryObject),
      count: files.length,
      offset,
      total: RocketChat.models.Uploads.find(ourQuery).count()
    });
  }

});
RocketChat.API.v1.addRoute(['dm.history', 'im.history'], {
  authRequired: true
}, {
  get() {
    const findResult = findDirectMessageRoom(this.requestParams(), this.user);
    let latestDate = new Date();

    if (this.queryParams.latest) {
      latestDate = new Date(this.queryParams.latest);
    }

    let oldestDate = undefined;

    if (this.queryParams.oldest) {
      oldestDate = new Date(this.queryParams.oldest);
    }

    let inclusive = false;

    if (this.queryParams.inclusive) {
      inclusive = this.queryParams.inclusive;
    }

    let count = 20;

    if (this.queryParams.count) {
      count = parseInt(this.queryParams.count);
    }

    let unreads = false;

    if (this.queryParams.unreads) {
      unreads = this.queryParams.unreads;
    }

    let result;
    Meteor.runAsUser(this.userId, () => {
      result = Meteor.call('getChannelHistory', {
        rid: findResult.room._id,
        latest: latestDate,
        oldest: oldestDate,
        inclusive,
        count,
        unreads
      });
    });

    if (!result) {
      return RocketChat.API.v1.unauthorized();
    }

    return RocketChat.API.v1.success(result);
  }

});
RocketChat.API.v1.addRoute(['dm.members', 'im.members'], {
  authRequired: true
}, {
  get() {
    const findResult = findDirectMessageRoom(this.requestParams(), this.user);
    const {
      offset,
      count
    } = this.getPaginationItems();
    const {
      sort
    } = this.parseJsonQuery();
    const members = RocketChat.models.Rooms.processQueryOptionsOnResult(Array.from(findResult.room.usernames), {
      sort: sort ? sort : -1,
      skip: offset,
      limit: count
    });
    const users = RocketChat.models.Users.find({
      username: {
        $in: members
      }
    }, {
      fields: {
        _id: 1,
        username: 1,
        name: 1,
        status: 1,
        utcOffset: 1
      }
    }).fetch();
    return RocketChat.API.v1.success({
      members: users,
      count: members.length,
      offset,
      total: findResult.room.usernames.length
    });
  }

});
RocketChat.API.v1.addRoute(['dm.messages', 'im.messages'], {
  authRequired: true
}, {
  get() {
    const findResult = findDirectMessageRoom(this.requestParams(), this.user);
    const {
      offset,
      count
    } = this.getPaginationItems();
    const {
      sort,
      fields,
      query
    } = this.parseJsonQuery();
    console.log(findResult);
    const ourQuery = Object.assign({}, query, {
      rid: findResult.room._id
    });
    const messages = RocketChat.models.Messages.find(ourQuery, {
      sort: sort ? sort : {
        ts: -1
      },
      skip: offset,
      limit: count,
      fields
    }).fetch();
    return RocketChat.API.v1.success({
      messages,
      count: messages.length,
      offset,
      total: RocketChat.models.Messages.find(ourQuery).count()
    });
  }

});
RocketChat.API.v1.addRoute(['dm.messages.others', 'im.messages.others'], {
  authRequired: true
}, {
  get() {
    if (RocketChat.settings.get('API_Enable_Direct_Message_History_EndPoint') !== true) {
      throw new Meteor.Error('error-endpoint-disabled', 'This endpoint is disabled', {
        route: '/api/v1/im.messages.others'
      });
    }

    if (!RocketChat.authz.hasPermission(this.userId, 'view-room-administration')) {
      return RocketChat.API.v1.unauthorized();
    }

    const roomId = this.queryParams.roomId;

    if (!roomId || !roomId.trim()) {
      throw new Meteor.Error('error-roomid-param-not-provided', 'The parameter "roomId" is required');
    }

    const room = RocketChat.models.Rooms.findOneById(roomId);

    if (!room || room.t !== 'd') {
      throw new Meteor.Error('error-room-not-found', `No direct message room found by the id of: ${roomId}`);
    }

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
      rid: room._id
    });
    const msgs = RocketChat.models.Messages.find(ourQuery, {
      sort: sort ? sort : {
        ts: -1
      },
      skip: offset,
      limit: count,
      fields
    }).fetch();
    return RocketChat.API.v1.success({
      messages: msgs,
      offset,
      count: msgs.length,
      total: RocketChat.models.Messages.find(ourQuery).count()
    });
  }

});
RocketChat.API.v1.addRoute(['dm.list', 'im.list'], {
  authRequired: true
}, {
  get() {
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
      t: 'd',
      'u._id': this.userId
    });

    let rooms = _.pluck(RocketChat.models.Subscriptions.find(ourQuery).fetch(), '_room');

    const totalCount = rooms.length;
    rooms = RocketChat.models.Rooms.processQueryOptionsOnResult(rooms, {
      sort: sort ? sort : {
        name: 1
      },
      skip: offset,
      limit: count,
      fields
    });
    return RocketChat.API.v1.success({
      ims: rooms,
      offset,
      count: rooms.length,
      total: totalCount
    });
  }

});
RocketChat.API.v1.addRoute(['dm.list.everyone', 'im.list.everyone'], {
  authRequired: true
}, {
  get() {
    if (!RocketChat.authz.hasPermission(this.userId, 'view-room-administration')) {
      return RocketChat.API.v1.unauthorized();
    }

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
      t: 'd'
    });
    const rooms = RocketChat.models.Rooms.find(ourQuery, {
      sort: sort ? sort : {
        name: 1
      },
      skip: offset,
      limit: count,
      fields
    }).fetch();
    return RocketChat.API.v1.success({
      ims: rooms,
      offset,
      count: rooms.length,
      total: RocketChat.models.Rooms.find(ourQuery).count()
    });
  }

});
RocketChat.API.v1.addRoute(['dm.open', 'im.open'], {
  authRequired: true
}, {
  post() {
    const findResult = findDirectMessageRoom(this.requestParams(), this.user);

    if (!findResult.subscription.open) {
      Meteor.runAsUser(this.userId, () => {
        Meteor.call('openRoom', findResult.room._id);
      });
    }

    return RocketChat.API.v1.success();
  }

});
RocketChat.API.v1.addRoute(['dm.setTopic', 'im.setTopic'], {
  authRequired: true
}, {
  post() {
    if (!this.bodyParams.topic || !this.bodyParams.topic.trim()) {
      return RocketChat.API.v1.failure('The bodyParam "topic" is required');
    }

    const findResult = findDirectMessageRoom(this.requestParams(), this.user);
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('saveRoomSettings', findResult.room._id, 'roomTopic', this.bodyParams.topic);
    });
    return RocketChat.API.v1.success({
      topic: this.bodyParams.topic
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"integrations.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_api/server/v1/integrations.js                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.API.v1.addRoute('integrations.create', {
  authRequired: true
}, {
  post() {
    check(this.bodyParams, Match.ObjectIncluding({
      type: String,
      name: String,
      enabled: Boolean,
      username: String,
      urls: Match.Maybe([String]),
      channel: String,
      event: Match.Maybe(String),
      triggerWords: Match.Maybe([String]),
      alias: Match.Maybe(String),
      avatar: Match.Maybe(String),
      emoji: Match.Maybe(String),
      token: Match.Maybe(String),
      scriptEnabled: Boolean,
      script: Match.Maybe(String),
      targetChannel: Match.Maybe(String)
    }));
    let integration;

    switch (this.bodyParams.type) {
      case 'webhook-outgoing':
        Meteor.runAsUser(this.userId, () => {
          integration = Meteor.call('addOutgoingIntegration', this.bodyParams);
        });
        break;

      case 'webhook-incoming':
        Meteor.runAsUser(this.userId, () => {
          integration = Meteor.call('addIncomingIntegration', this.bodyParams);
        });
        break;

      default:
        return RocketChat.API.v1.failure('Invalid integration type.');
    }

    return RocketChat.API.v1.success({
      integration
    });
  }

});
RocketChat.API.v1.addRoute('integrations.history', {
  authRequired: true
}, {
  get() {
    if (!RocketChat.authz.hasPermission(this.userId, 'manage-integrations')) {
      return RocketChat.API.v1.unauthorized();
    }

    if (!this.queryParams.id || this.queryParams.id.trim() === '') {
      return RocketChat.API.v1.failure('Invalid integration id.');
    }

    const id = this.queryParams.id;
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
      'integration._id': id
    });
    const history = RocketChat.models.IntegrationHistory.find(ourQuery, {
      sort: sort ? sort : {
        _updatedAt: -1
      },
      skip: offset,
      limit: count,
      fields
    }).fetch();
    return RocketChat.API.v1.success({
      history,
      offset,
      items: history.length,
      total: RocketChat.models.IntegrationHistory.find(ourQuery).count()
    });
  }

});
RocketChat.API.v1.addRoute('integrations.list', {
  authRequired: true
}, {
  get() {
    if (!RocketChat.authz.hasPermission(this.userId, 'manage-integrations')) {
      return RocketChat.API.v1.unauthorized();
    }

    const {
      offset,
      count
    } = this.getPaginationItems();
    const {
      sort,
      fields,
      query
    } = this.parseJsonQuery();
    const ourQuery = Object.assign({}, query);
    const integrations = RocketChat.models.Integrations.find(ourQuery, {
      sort: sort ? sort : {
        ts: -1
      },
      skip: offset,
      limit: count,
      fields
    }).fetch();
    return RocketChat.API.v1.success({
      integrations,
      offset,
      items: integrations.length,
      total: RocketChat.models.Integrations.find(ourQuery).count()
    });
  }

});
RocketChat.API.v1.addRoute('integrations.remove', {
  authRequired: true
}, {
  post() {
    check(this.bodyParams, Match.ObjectIncluding({
      type: String,
      target_url: Match.Maybe(String),
      integrationId: Match.Maybe(String)
    }));

    if (!this.bodyParams.target_url && !this.bodyParams.integrationId) {
      return RocketChat.API.v1.failure('An integrationId or target_url needs to be provided.');
    }

    let integration;

    switch (this.bodyParams.type) {
      case 'webhook-outgoing':
        if (this.bodyParams.target_url) {
          integration = RocketChat.models.Integrations.findOne({
            urls: this.bodyParams.target_url
          });
        } else if (this.bodyParams.integrationId) {
          integration = RocketChat.models.Integrations.findOne({
            _id: this.bodyParams.integrationId
          });
        }

        if (!integration) {
          return RocketChat.API.v1.failure('No integration found.');
        }

        Meteor.runAsUser(this.userId, () => {
          Meteor.call('deleteOutgoingIntegration', integration._id);
        });
        return RocketChat.API.v1.success({
          integration
        });

      case 'webhook-incoming':
        integration = RocketChat.models.Integrations.findOne({
          _id: this.bodyParams.integrationId
        });

        if (!integration) {
          return RocketChat.API.v1.failure('No integration found.');
        }

        Meteor.runAsUser(this.userId, () => {
          Meteor.call('deleteIncomingIntegration', integration._id);
        });
        return RocketChat.API.v1.success({
          integration
        });

      default:
        return RocketChat.API.v1.failure('Invalid integration type.');
    }
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"misc.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_api/server/v1/misc.js                                                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
RocketChat.API.v1.addRoute('info', {
  authRequired: false
}, {
  get() {
    const user = this.getLoggedInUser();

    if (user && RocketChat.authz.hasRole(user._id, 'admin')) {
      return RocketChat.API.v1.success({
        info: RocketChat.Info
      });
    }

    return RocketChat.API.v1.success({
      info: {
        'version': RocketChat.Info.version
      }
    });
  }

});
RocketChat.API.v1.addRoute('me', {
  authRequired: true
}, {
  get() {
    const me = _.pick(this.user, ['_id', 'name', 'emails', 'status', 'statusConnection', 'username', 'utcOffset', 'active', 'language', 'roles', 'settings']);

    const verifiedEmail = me.emails.find(email => email.verified);
    const userHasNotSetPreferencesYet = !me.settings || !me.settings.preferences;
    me.email = verifiedEmail ? verifiedEmail.address : undefined;

    if (userHasNotSetPreferencesYet) {
      me.settings = {
        preferences: {}
      };
    }

    return RocketChat.API.v1.success(me);
  }

});
let onlineCache = 0;
let onlineCacheDate = 0;
const cacheInvalid = 60000; // 1 minute

RocketChat.API.v1.addRoute('shield.svg', {
  authRequired: false
}, {
  get() {
    const {
      type,
      channel,
      name,
      icon
    } = this.queryParams;

    if (!RocketChat.settings.get('API_Enable_Shields')) {
      throw new Meteor.Error('error-endpoint-disabled', 'This endpoint is disabled', {
        route: '/api/v1/shield.svg'
      });
    }

    const types = RocketChat.settings.get('API_Shield_Types');

    if (type && types !== '*' && !types.split(',').map(t => t.trim()).includes(type)) {
      throw new Meteor.Error('error-shield-disabled', 'This shield type is disabled', {
        route: '/api/v1/shield.svg'
      });
    }

    const hideIcon = icon === 'false';

    if (hideIcon && (!name || !name.trim())) {
      return RocketChat.API.v1.failure('Name cannot be empty when icon is hidden');
    }

    let text;
    let backgroundColor = '#4c1';

    switch (type) {
      case 'online':
        if (Date.now() - onlineCacheDate > cacheInvalid) {
          onlineCache = RocketChat.models.Users.findUsersNotOffline().count();
          onlineCacheDate = Date.now();
        }

        text = `${onlineCache} ${TAPi18n.__('Online')}`;
        break;

      case 'channel':
        if (!channel) {
          return RocketChat.API.v1.failure('Shield channel is required for type "channel"');
        }

        text = `#${channel}`;
        break;

      case 'user':
        const user = this.getUserFromParams(); // Respect the server's choice for using their real names or not

        if (user.name && RocketChat.settings.get('UI_Use_Real_Name')) {
          text = `${user.name}`;
        } else {
          text = `@${user.username}`;
        }

        switch (user.status) {
          case 'online':
            backgroundColor = '#1fb31f';
            break;

          case 'away':
            backgroundColor = '#dc9b01';
            break;

          case 'busy':
            backgroundColor = '#bc2031';
            break;

          case 'offline':
            backgroundColor = '#a5a1a1';
        }

        break;

      default:
        text = TAPi18n.__('Join_Chat').toUpperCase();
    }

    const iconSize = hideIcon ? 7 : 24;
    const leftSize = name ? name.length * 6 + 7 + iconSize : iconSize;
    const rightSize = text.length * 6 + 20;
    const width = leftSize + rightSize;
    const height = 20;
    return {
      headers: {
        'Content-Type': 'image/svg+xml;charset=utf-8'
      },
      body: `
				<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}">
				  <linearGradient id="b" x2="0" y2="100%">
				    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
				    <stop offset="1" stop-opacity=".1"/>
				  </linearGradient>
				  <mask id="a">
				    <rect width="${width}" height="${height}" rx="3" fill="#fff"/>
				  </mask>
				  <g mask="url(#a)">
				    <path fill="#555" d="M0 0h${leftSize}v${height}H0z"/>
				    <path fill="${backgroundColor}" d="M${leftSize} 0h${rightSize}v${height}H${leftSize}z"/>
				    <path fill="url(#b)" d="M0 0h${width}v${height}H0z"/>
				  </g>
				    ${hideIcon ? '' : '<image x="5" y="3" width="14" height="14" xlink:href="/assets/favicon.svg"/>'}
				  <g fill="#fff" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="11">
						${name ? `<text x="${iconSize}" y="15" fill="#010101" fill-opacity=".3">${name}</text>
				    <text x="${iconSize}" y="14">${name}</text>` : ''}
				    <text x="${leftSize + 7}" y="15" fill="#010101" fill-opacity=".3">${text}</text>
				    <text x="${leftSize + 7}" y="14">${text}</text>
				  </g>
				</svg>
			`.trim().replace(/\>[\s]+\</gm, '><')
    };
  }

});
RocketChat.API.v1.addRoute('spotlight', {
  authRequired: true
}, {
  get() {
    check(this.queryParams, {
      query: String
    });
    const {
      query
    } = this.queryParams;
    const result = Meteor.runAsUser(this.userId, () => Meteor.call('spotlight', query));
    return RocketChat.API.v1.success(result);
  }

});
RocketChat.API.v1.addRoute('directory', {
  authRequired: true
}, {
  get() {
    const {
      offset,
      count
    } = this.getPaginationItems();
    const {
      sort,
      query
    } = this.parseJsonQuery();
    const {
      text,
      type
    } = query;
    const sortDirection = sort && sort === 1 ? 'asc' : 'desc';
    const result = Meteor.runAsUser(this.userId, () => Meteor.call('browseChannels', {
      text,
      type,
      sort: sortDirection,
      page: offset,
      limit: count
    }));

    if (!result) {
      return RocketChat.API.v1.failure('Please verify the parameters');
    }

    return RocketChat.API.v1.success({
      result
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"permissions.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_api/server/v1/permissions.js                                                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/**
	This API returns all permissions that exists
	on the server, with respective roles.

	Method: GET
	Route: api/v1/permissions
 */
RocketChat.API.v1.addRoute('permissions', {
  authRequired: true
}, {
  get() {
    const result = Meteor.runAsUser(this.userId, () => Meteor.call('permissions/get'));
    return RocketChat.API.v1.success(result);
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"push.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_api/server/v1/push.js                                                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/* globals Push */
RocketChat.API.v1.addRoute('push.token', {
  authRequired: true
}, {
  post() {
    const {
      type,
      value,
      appName
    } = this.bodyParams;
    let {
      id
    } = this.bodyParams;

    if (id && typeof id !== 'string') {
      throw new Meteor.Error('error-id-param-not-valid', 'The required "id" body param is invalid.');
    } else {
      id = Random.id();
    }

    if (!type || type !== 'apn' && type !== 'gcm') {
      throw new Meteor.Error('error-type-param-not-valid', 'The required "type" body param is missing or invalid.');
    }

    if (!value || typeof value !== 'string') {
      throw new Meteor.Error('error-token-param-not-valid', 'The required "token" body param is missing or invalid.');
    }

    if (!appName || typeof appName !== 'string') {
      throw new Meteor.Error('error-appName-param-not-valid', 'The required "appName" body param is missing or invalid.');
    }

    let result;
    Meteor.runAsUser(this.userId, () => result = Meteor.call('raix:push-update', {
      id,
      token: {
        [type]: value
      },
      appName,
      userId: this.userId
    }));
    return RocketChat.API.v1.success({
      result
    });
  },

  delete() {
    const {
      token
    } = this.bodyParams;

    if (!token || typeof token !== 'string') {
      throw new Meteor.Error('error-token-param-not-valid', 'The required "token" body param is missing or invalid.');
    }

    const affectedRecords = Push.appCollection.remove({
      $or: [{
        'token.apn': token
      }, {
        'token.gcm': token
      }],
      userId: this.userId
    });

    if (affectedRecords === 0) {
      return RocketChat.API.v1.notFound();
    }

    return RocketChat.API.v1.success();
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"settings.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_api/server/v1/settings.js                                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var _interopRequireDefault = require("@babel/runtime/helpers/builtin/interopRequireDefault");

var _objectSpread2 = _interopRequireDefault(require("@babel/runtime/helpers/builtin/objectSpread"));

let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
// settings endpoints
RocketChat.API.v1.addRoute('settings.public', {
  authRequired: false
}, {
  get() {
    const {
      offset,
      count
    } = this.getPaginationItems();
    const {
      sort,
      fields,
      query
    } = this.parseJsonQuery();
    let ourQuery = {
      hidden: {
        $ne: true
      },
      'public': true
    };
    ourQuery = Object.assign({}, query, ourQuery);
    const settings = RocketChat.models.Settings.find(ourQuery, {
      sort: sort ? sort : {
        _id: 1
      },
      skip: offset,
      limit: count,
      fields: Object.assign({
        _id: 1,
        value: 1
      }, fields)
    }).fetch();
    return RocketChat.API.v1.success({
      settings,
      count: settings.length,
      offset,
      total: RocketChat.models.Settings.find(ourQuery).count()
    });
  }

});
RocketChat.API.v1.addRoute('settings.oauth', {
  authRequired: false
}, {
  get() {
    const mountOAuthServices = () => {
      const oAuthServicesEnabled = ServiceConfiguration.configurations.find({}, {
        fields: {
          secret: 0
        }
      }).fetch();
      return oAuthServicesEnabled.map(service => {
        if (service.custom || ['saml', 'cas'].includes(service.service)) {
          return (0, _objectSpread2.default)({}, service);
        }

        return {
          _id: service._id,
          name: service.service,
          clientId: service.appId || service.clientId || service.consumerKey,
          buttonLabelText: service.buttonLabelText || '',
          buttonColor: service.buttonColor || '',
          buttonLabelColor: service.buttonLabelColor || '',
          custom: false
        };
      });
    };

    return RocketChat.API.v1.success({
      services: mountOAuthServices()
    });
  }

});
RocketChat.API.v1.addRoute('settings', {
  authRequired: true
}, {
  get() {
    const {
      offset,
      count
    } = this.getPaginationItems();
    const {
      sort,
      fields,
      query
    } = this.parseJsonQuery();
    let ourQuery = {
      hidden: {
        $ne: true
      }
    };

    if (!RocketChat.authz.hasPermission(this.userId, 'view-privileged-setting')) {
      ourQuery.public = true;
    }

    ourQuery = Object.assign({}, query, ourQuery);
    const settings = RocketChat.models.Settings.find(ourQuery, {
      sort: sort ? sort : {
        _id: 1
      },
      skip: offset,
      limit: count,
      fields: Object.assign({
        _id: 1,
        value: 1
      }, fields)
    }).fetch();
    return RocketChat.API.v1.success({
      settings,
      count: settings.length,
      offset,
      total: RocketChat.models.Settings.find(ourQuery).count()
    });
  }

});
RocketChat.API.v1.addRoute('settings/:_id', {
  authRequired: true
}, {
  get() {
    if (!RocketChat.authz.hasPermission(this.userId, 'view-privileged-setting')) {
      return RocketChat.API.v1.unauthorized();
    }

    return RocketChat.API.v1.success(_.pick(RocketChat.models.Settings.findOneNotHiddenById(this.urlParams._id), '_id', 'value'));
  },

  post() {
    if (!RocketChat.authz.hasPermission(this.userId, 'edit-privileged-setting')) {
      return RocketChat.API.v1.unauthorized();
    }

    check(this.bodyParams, {
      value: Match.Any
    });

    if (RocketChat.models.Settings.updateValueNotHiddenById(this.urlParams._id, this.bodyParams.value)) {
      return RocketChat.API.v1.success();
    }

    return RocketChat.API.v1.failure();
  }

});
RocketChat.API.v1.addRoute('service.configurations', {
  authRequired: false
}, {
  get() {
    const ServiceConfiguration = Package['service-configuration'].ServiceConfiguration;
    return RocketChat.API.v1.success({
      configurations: ServiceConfiguration.configurations.find({}, {
        fields: {
          secret: 0
        }
      }).fetch()
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"stats.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_api/server/v1/stats.js                                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.API.v1.addRoute('statistics', {
  authRequired: true
}, {
  get() {
    let refresh = false;

    if (typeof this.queryParams.refresh !== 'undefined' && this.queryParams.refresh === 'true') {
      refresh = true;
    }

    let stats;
    Meteor.runAsUser(this.userId, () => {
      stats = Meteor.call('getStatistics', refresh);
    });
    return RocketChat.API.v1.success({
      statistics: stats
    });
  }

});
RocketChat.API.v1.addRoute('statistics.list', {
  authRequired: true
}, {
  get() {
    if (!RocketChat.authz.hasPermission(this.userId, 'view-statistics')) {
      return RocketChat.API.v1.unauthorized();
    }

    const {
      offset,
      count
    } = this.getPaginationItems();
    const {
      sort,
      fields,
      query
    } = this.parseJsonQuery();
    const statistics = RocketChat.models.Statistics.find(query, {
      sort: sort ? sort : {
        name: 1
      },
      skip: offset,
      limit: count,
      fields
    }).fetch();
    return RocketChat.API.v1.success({
      statistics,
      count: statistics.length,
      offset,
      total: RocketChat.models.Statistics.find(query).count()
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"users.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_api/server/v1/users.js                                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
let Busboy;
module.watch(require("busboy"), {
  default(v) {
    Busboy = v;
  }

}, 1);
RocketChat.API.v1.addRoute('users.create', {
  authRequired: true
}, {
  post() {
    check(this.bodyParams, {
      email: String,
      name: String,
      password: String,
      username: String,
      active: Match.Maybe(Boolean),
      roles: Match.Maybe(Array),
      joinDefaultChannels: Match.Maybe(Boolean),
      requirePasswordChange: Match.Maybe(Boolean),
      sendWelcomeEmail: Match.Maybe(Boolean),
      verified: Match.Maybe(Boolean),
      customFields: Match.Maybe(Object)
    }); //New change made by pull request #5152

    if (typeof this.bodyParams.joinDefaultChannels === 'undefined') {
      this.bodyParams.joinDefaultChannels = true;
    }

    if (this.bodyParams.customFields) {
      RocketChat.validateCustomFields(this.bodyParams.customFields);
    }

    const newUserId = RocketChat.saveUser(this.userId, this.bodyParams);

    if (this.bodyParams.customFields) {
      RocketChat.saveCustomFieldsWithoutValidation(newUserId, this.bodyParams.customFields);
    }

    if (typeof this.bodyParams.active !== 'undefined') {
      Meteor.runAsUser(this.userId, () => {
        Meteor.call('setUserActiveStatus', newUserId, this.bodyParams.active);
      });
    }

    return RocketChat.API.v1.success({
      user: RocketChat.models.Users.findOneById(newUserId, {
        fields: RocketChat.API.v1.defaultFieldsToExclude
      })
    });
  }

});
RocketChat.API.v1.addRoute('users.delete', {
  authRequired: true
}, {
  post() {
    if (!RocketChat.authz.hasPermission(this.userId, 'delete-user')) {
      return RocketChat.API.v1.unauthorized();
    }

    const user = this.getUserFromParams();
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('deleteUser', user._id);
    });
    return RocketChat.API.v1.success();
  }

});
RocketChat.API.v1.addRoute('users.getAvatar', {
  authRequired: false
}, {
  get() {
    const user = this.getUserFromParams();
    const url = RocketChat.getURL(`/avatar/${user.username}`, {
      cdn: false,
      full: true
    });
    this.response.setHeader('Location', url);
    return {
      statusCode: 307,
      body: url
    };
  }

});
RocketChat.API.v1.addRoute('users.getPresence', {
  authRequired: true
}, {
  get() {
    if (this.isUserFromParams()) {
      const user = RocketChat.models.Users.findOneById(this.userId);
      return RocketChat.API.v1.success({
        presence: user.status,
        connectionStatus: user.statusConnection,
        lastLogin: user.lastLogin
      });
    }

    const user = this.getUserFromParams();
    return RocketChat.API.v1.success({
      presence: user.status
    });
  }

});
RocketChat.API.v1.addRoute('users.info', {
  authRequired: true
}, {
  get() {
    const user = this.getUserFromParams();
    let result;
    Meteor.runAsUser(this.userId, () => {
      result = Meteor.call('getFullUserData', {
        filter: user.username,
        limit: 1
      });
    });

    if (!result || result.length !== 1) {
      return RocketChat.API.v1.failure(`Failed to get the user data for the userId of "${user._id}".`);
    }

    return RocketChat.API.v1.success({
      user: result[0]
    });
  }

});
RocketChat.API.v1.addRoute('users.list', {
  authRequired: true
}, {
  get() {
    if (!RocketChat.authz.hasPermission(this.userId, 'view-d-room')) {
      return RocketChat.API.v1.unauthorized();
    }

    const {
      offset,
      count
    } = this.getPaginationItems();
    const {
      sort,
      fields,
      query
    } = this.parseJsonQuery();
    const users = RocketChat.models.Users.find(query, {
      sort: sort ? sort : {
        username: 1
      },
      skip: offset,
      limit: count,
      fields
    }).fetch();
    return RocketChat.API.v1.success({
      users,
      count: users.length,
      offset,
      total: RocketChat.models.Users.find(query).count()
    });
  }

});
RocketChat.API.v1.addRoute('users.register', {
  authRequired: false
}, {
  post() {
    if (this.userId) {
      return RocketChat.API.v1.failure('Logged in users can not register again.');
    } //We set their username here, so require it
    //The `registerUser` checks for the other requirements


    check(this.bodyParams, Match.ObjectIncluding({
      username: String
    })); //Register the user

    const userId = Meteor.call('registerUser', this.bodyParams); //Now set their username

    Meteor.runAsUser(userId, () => Meteor.call('setUsername', this.bodyParams.username));
    return RocketChat.API.v1.success({
      user: RocketChat.models.Users.findOneById(userId, {
        fields: RocketChat.API.v1.defaultFieldsToExclude
      })
    });
  }

});
RocketChat.API.v1.addRoute('users.resetAvatar', {
  authRequired: true
}, {
  post() {
    const user = this.getUserFromParams();

    if (user._id === this.userId) {
      Meteor.runAsUser(this.userId, () => Meteor.call('resetAvatar'));
    } else if (RocketChat.authz.hasPermission(this.userId, 'edit-other-user-info')) {
      Meteor.runAsUser(user._id, () => Meteor.call('resetAvatar'));
    } else {
      return RocketChat.API.v1.unauthorized();
    }

    return RocketChat.API.v1.success();
  }

});
RocketChat.API.v1.addRoute('users.setAvatar', {
  authRequired: true
}, {
  post() {
    check(this.bodyParams, Match.ObjectIncluding({
      avatarUrl: Match.Maybe(String),
      userId: Match.Maybe(String),
      username: Match.Maybe(String)
    }));
    let user;

    if (this.isUserFromParams()) {
      user = Meteor.users.findOne(this.userId);
    } else if (RocketChat.authz.hasPermission(this.userId, 'edit-other-user-info')) {
      user = this.getUserFromParams();
    } else {
      return RocketChat.API.v1.unauthorized();
    }

    Meteor.runAsUser(user._id, () => {
      if (this.bodyParams.avatarUrl) {
        RocketChat.setUserAvatar(user, this.bodyParams.avatarUrl, '', 'url');
      } else {
        const busboy = new Busboy({
          headers: this.request.headers
        });
        Meteor.wrapAsync(callback => {
          busboy.on('file', Meteor.bindEnvironment((fieldname, file, filename, encoding, mimetype) => {
            if (fieldname !== 'image') {
              return callback(new Meteor.Error('invalid-field'));
            }

            const imageData = [];
            file.on('data', Meteor.bindEnvironment(data => {
              imageData.push(data);
            }));
            file.on('end', Meteor.bindEnvironment(() => {
              RocketChat.setUserAvatar(user, Buffer.concat(imageData), mimetype, 'rest');
              callback();
            }));
          }));
          this.request.pipe(busboy);
        })();
      }
    });
    return RocketChat.API.v1.success();
  }

});
RocketChat.API.v1.addRoute('users.update', {
  authRequired: true
}, {
  post() {
    check(this.bodyParams, {
      userId: String,
      data: Match.ObjectIncluding({
        email: Match.Maybe(String),
        name: Match.Maybe(String),
        password: Match.Maybe(String),
        username: Match.Maybe(String),
        active: Match.Maybe(Boolean),
        roles: Match.Maybe(Array),
        joinDefaultChannels: Match.Maybe(Boolean),
        requirePasswordChange: Match.Maybe(Boolean),
        sendWelcomeEmail: Match.Maybe(Boolean),
        verified: Match.Maybe(Boolean),
        customFields: Match.Maybe(Object)
      })
    });

    const userData = _.extend({
      _id: this.bodyParams.userId
    }, this.bodyParams.data);

    Meteor.runAsUser(this.userId, () => RocketChat.saveUser(this.userId, userData));

    if (this.bodyParams.data.customFields) {
      RocketChat.saveCustomFields(this.bodyParams.userId, this.bodyParams.data.customFields);
    }

    if (typeof this.bodyParams.data.active !== 'undefined') {
      Meteor.runAsUser(this.userId, () => {
        Meteor.call('setUserActiveStatus', this.bodyParams.userId, this.bodyParams.data.active);
      });
    }

    return RocketChat.API.v1.success({
      user: RocketChat.models.Users.findOneById(this.bodyParams.userId, {
        fields: RocketChat.API.v1.defaultFieldsToExclude
      })
    });
  }

});
RocketChat.API.v1.addRoute('users.updateOwnBasicInfo', {
  authRequired: true
}, {
  post() {
    check(this.bodyParams, {
      data: Match.ObjectIncluding({
        email: Match.Maybe(String),
        name: Match.Maybe(String),
        username: Match.Maybe(String),
        currentPassword: Match.Maybe(String),
        newPassword: Match.Maybe(String)
      }),
      customFields: Match.Maybe(Object)
    });
    const userData = {
      email: this.bodyParams.data.email,
      realname: this.bodyParams.data.name,
      username: this.bodyParams.data.username,
      newPassword: this.bodyParams.data.newPassword,
      typedPassword: this.bodyParams.data.currentPassword
    };
    Meteor.runAsUser(this.userId, () => Meteor.call('saveUserProfile', userData, this.bodyParams.customFields));
    return RocketChat.API.v1.success({
      user: RocketChat.models.Users.findOneById(this.userId, {
        fields: RocketChat.API.v1.defaultFieldsToExclude
      })
    });
  }

});
RocketChat.API.v1.addRoute('users.createToken', {
  authRequired: true
}, {
  post() {
    const user = this.getUserFromParams();
    let data;
    Meteor.runAsUser(this.userId, () => {
      data = Meteor.call('createToken', user._id);
    });
    return data ? RocketChat.API.v1.success({
      data
    }) : RocketChat.API.v1.unauthorized();
  }

});
RocketChat.API.v1.addRoute('users.getPreferences', {
  authRequired: true
}, {
  get() {
    const user = RocketChat.models.Users.findOneById(this.userId);

    if (user.settings) {
      const preferences = user.settings.preferences;
      preferences['language'] = user.language;
      return RocketChat.API.v1.success({
        preferences
      });
    } else {
      return RocketChat.API.v1.failure(TAPi18n.__('Accounts_Default_User_Preferences_not_available').toUpperCase());
    }
  }

});
RocketChat.API.v1.addRoute('users.setPreferences', {
  authRequired: true
}, {
  post() {
    check(this.bodyParams, {
      userId: Match.Maybe(String),
      data: Match.ObjectIncluding({
        newRoomNotification: Match.Maybe(String),
        newMessageNotification: Match.Maybe(String),
        useEmojis: Match.Maybe(Boolean),
        convertAsciiEmoji: Match.Maybe(Boolean),
        saveMobileBandwidth: Match.Maybe(Boolean),
        collapseMediaByDefault: Match.Maybe(Boolean),
        autoImageLoad: Match.Maybe(Boolean),
        emailNotificationMode: Match.Maybe(String),
        roomsListExhibitionMode: Match.Maybe(String),
        unreadAlert: Match.Maybe(Boolean),
        notificationsSoundVolume: Match.Maybe(Number),
        desktopNotifications: Match.Maybe(String),
        mobileNotifications: Match.Maybe(String),
        enableAutoAway: Match.Maybe(Boolean),
        highlights: Match.Maybe(Array),
        desktopNotificationDuration: Match.Maybe(Number),
        messageViewMode: Match.Maybe(Number),
        hideUsernames: Match.Maybe(Boolean),
        hideRoles: Match.Maybe(Boolean),
        hideAvatars: Match.Maybe(Boolean),
        hideFlexTab: Match.Maybe(Boolean),
        sendOnEnter: Match.Maybe(String),
        roomCounterSidebar: Match.Maybe(Boolean),
        language: Match.Maybe(String),
        sidebarShowFavorites: Match.Optional(Boolean),
        sidebarShowUnread: Match.Optional(Boolean),
        sidebarSortby: Match.Optional(String),
        sidebarViewMode: Match.Optional(String),
        sidebarHideAvatar: Match.Optional(Boolean),
        mergeChannels: Match.Optional(Boolean),
        muteFocusedConversations: Match.Optional(Boolean)
      })
    });
    let preferences;
    const userId = this.bodyParams.userId ? this.bodyParams.userId : this.userId;

    if (this.bodyParams.data.language) {
      const language = this.bodyParams.data.language;
      delete this.bodyParams.data.language;
      preferences = _.extend({
        _id: userId,
        settings: {
          preferences: this.bodyParams.data
        },
        language
      });
    } else {
      preferences = _.extend({
        _id: userId,
        settings: {
          preferences: this.bodyParams.data
        }
      });
    }

    Meteor.runAsUser(this.userId, () => RocketChat.saveUser(this.userId, preferences));
    return RocketChat.API.v1.success({
      user: RocketChat.models.Users.findOneById(this.bodyParams.userId, {
        fields: preferences
      })
    });
  }

});
/**
 DEPRECATED
 // TODO: Remove this after three versions have been released. That means at 0.66 this should be gone.
 This API returns the logged user roles.

 Method: GET
 Route: api/v1/user.roles
 */

RocketChat.API.v1.addRoute('user.roles', {
  authRequired: true
}, {
  get() {
    let currentUserRoles = {};
    const result = Meteor.runAsUser(this.userId, () => Meteor.call('getUserRoles'));

    if (Array.isArray(result) && result.length > 0) {
      currentUserRoles = result[0];
    }

    return RocketChat.API.v1.success(this.deprecationWarning({
      endpoint: 'user.roles',
      versionWillBeRemove: 'v0.66',
      response: currentUserRoles
    }));
  }

});
RocketChat.API.v1.addRoute('users.forgotPassword', {
  authRequired: false
}, {
  post() {
    const {
      email
    } = this.bodyParams;

    if (!email) {
      return RocketChat.API.v1.failure('The \'email\' param is required');
    }

    const emailSent = Meteor.call('sendForgotPasswordEmail', email);

    if (emailSent) {
      return RocketChat.API.v1.success();
    }

    return RocketChat.API.v1.failure('User not found');
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:api/server/api.js");
require("/node_modules/meteor/rocketchat:api/server/settings.js");
require("/node_modules/meteor/rocketchat:api/server/helpers/requestParams.js");
require("/node_modules/meteor/rocketchat:api/server/helpers/getPaginationItems.js");
require("/node_modules/meteor/rocketchat:api/server/helpers/getUserFromParams.js");
require("/node_modules/meteor/rocketchat:api/server/helpers/isUserFromParams.js");
require("/node_modules/meteor/rocketchat:api/server/helpers/parseJsonQuery.js");
require("/node_modules/meteor/rocketchat:api/server/helpers/deprecationWarning.js");
require("/node_modules/meteor/rocketchat:api/server/helpers/getLoggedInUser.js");
require("/node_modules/meteor/rocketchat:api/server/helpers/insertUserObject.js");
require("/node_modules/meteor/rocketchat:api/server/default/info.js");
require("/node_modules/meteor/rocketchat:api/server/default/metrics.js");
require("/node_modules/meteor/rocketchat:api/server/v1/channels.js");
require("/node_modules/meteor/rocketchat:api/server/v1/rooms.js");
require("/node_modules/meteor/rocketchat:api/server/v1/subscriptions.js");
require("/node_modules/meteor/rocketchat:api/server/v1/chat.js");
require("/node_modules/meteor/rocketchat:api/server/v1/commands.js");
require("/node_modules/meteor/rocketchat:api/server/v1/emoji-custom.js");
require("/node_modules/meteor/rocketchat:api/server/v1/groups.js");
require("/node_modules/meteor/rocketchat:api/server/v1/im.js");
require("/node_modules/meteor/rocketchat:api/server/v1/integrations.js");
require("/node_modules/meteor/rocketchat:api/server/v1/misc.js");
require("/node_modules/meteor/rocketchat:api/server/v1/permissions.js");
require("/node_modules/meteor/rocketchat:api/server/v1/push.js");
require("/node_modules/meteor/rocketchat:api/server/v1/settings.js");
require("/node_modules/meteor/rocketchat:api/server/v1/stats.js");
require("/node_modules/meteor/rocketchat:api/server/v1/users.js");

/* Exports */
Package._define("rocketchat:api");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_api.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDphcGkvc2VydmVyL2FwaS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDphcGkvc2VydmVyL3NldHRpbmdzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmFwaS9zZXJ2ZXIvaGVscGVycy9yZXF1ZXN0UGFyYW1zLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmFwaS9zZXJ2ZXIvaGVscGVycy9nZXRQYWdpbmF0aW9uSXRlbXMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6YXBpL3NlcnZlci9oZWxwZXJzL2dldFVzZXJGcm9tUGFyYW1zLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmFwaS9zZXJ2ZXIvaGVscGVycy9pc1VzZXJGcm9tUGFyYW1zLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmFwaS9zZXJ2ZXIvaGVscGVycy9wYXJzZUpzb25RdWVyeS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDphcGkvc2VydmVyL2hlbHBlcnMvZGVwcmVjYXRpb25XYXJuaW5nLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmFwaS9zZXJ2ZXIvaGVscGVycy9nZXRMb2dnZWRJblVzZXIuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6YXBpL3NlcnZlci9oZWxwZXJzL2luc2VydFVzZXJPYmplY3QuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6YXBpL3NlcnZlci9kZWZhdWx0L2luZm8uanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6YXBpL3NlcnZlci9kZWZhdWx0L21ldHJpY3MuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6YXBpL3NlcnZlci92MS9jaGFubmVscy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDphcGkvc2VydmVyL3YxL3Jvb21zLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmFwaS9zZXJ2ZXIvdjEvc3Vic2NyaXB0aW9ucy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDphcGkvc2VydmVyL3YxL2NoYXQuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6YXBpL3NlcnZlci92MS9jb21tYW5kcy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDphcGkvc2VydmVyL3YxL2Vtb2ppLWN1c3RvbS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDphcGkvc2VydmVyL3YxL2dyb3Vwcy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDphcGkvc2VydmVyL3YxL2ltLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmFwaS9zZXJ2ZXIvdjEvaW50ZWdyYXRpb25zLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmFwaS9zZXJ2ZXIvdjEvbWlzYy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDphcGkvc2VydmVyL3YxL3Blcm1pc3Npb25zLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmFwaS9zZXJ2ZXIvdjEvcHVzaC5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDphcGkvc2VydmVyL3YxL3NldHRpbmdzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmFwaS9zZXJ2ZXIvdjEvc3RhdHMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6YXBpL3NlcnZlci92MS91c2Vycy5qcyJdLCJuYW1lcyI6WyJfIiwibW9kdWxlIiwid2F0Y2giLCJyZXF1aXJlIiwiZGVmYXVsdCIsInYiLCJsb2dnZXIiLCJMb2dnZXIiLCJBUEkiLCJSZXN0aXZ1cyIsImNvbnN0cnVjdG9yIiwicHJvcGVydGllcyIsInZlcnNpb24iLCJhdXRoTWV0aG9kcyIsImZpZWxkU2VwYXJhdG9yIiwiZGVmYXVsdEZpZWxkc1RvRXhjbHVkZSIsImpvaW5Db2RlIiwiJGxva2kiLCJtZXRhIiwibWVtYmVycyIsInVzZXJuYW1lcyIsImltcG9ydElkcyIsImxpbWl0ZWRVc2VyRmllbGRzVG9FeGNsdWRlIiwiYXZhdGFyT3JpZ2luIiwiZW1haWxzIiwicGhvbmUiLCJzdGF0dXNDb25uZWN0aW9uIiwiY3JlYXRlZEF0IiwibGFzdExvZ2luIiwic2VydmljZXMiLCJyZXF1aXJlUGFzc3dvcmRDaGFuZ2UiLCJyZXF1aXJlUGFzc3dvcmRDaGFuZ2VSZWFzb24iLCJyb2xlcyIsInN0YXR1c0RlZmF1bHQiLCJfdXBkYXRlZEF0IiwiY3VzdG9tRmllbGRzIiwic2V0dGluZ3MiLCJfY29uZmlnIiwiZGVmYXVsdE9wdGlvbnNFbmRwb2ludCIsIl9kZWZhdWx0T3B0aW9uc0VuZHBvaW50IiwicmVxdWVzdCIsIm1ldGhvZCIsImhlYWRlcnMiLCJSb2NrZXRDaGF0IiwiZ2V0IiwicmVzcG9uc2UiLCJ3cml0ZUhlYWQiLCJ3cml0ZSIsImRvbmUiLCJoYXNIZWxwZXJNZXRob2RzIiwiaGVscGVyTWV0aG9kcyIsInNpemUiLCJnZXRIZWxwZXJNZXRob2RzIiwiYWRkQXV0aE1ldGhvZCIsInB1c2giLCJzdWNjZXNzIiwicmVzdWx0IiwiaXNPYmplY3QiLCJzdGF0dXNDb2RlIiwiYm9keSIsImRlYnVnIiwiZmFpbHVyZSIsImVycm9yVHlwZSIsImVycm9yIiwibm90Rm91bmQiLCJtc2ciLCJ1bmF1dGhvcml6ZWQiLCJhZGRSb3V0ZSIsInJvdXRlcyIsIm9wdGlvbnMiLCJlbmRwb2ludHMiLCJpc0FycmF5IiwiZm9yRWFjaCIsInJvdXRlIiwiT2JqZWN0Iiwia2V5cyIsImFjdGlvbiIsIm9yaWdpbmFsQWN0aW9uIiwiX2ludGVybmFsUm91dGVBY3Rpb25IYW5kbGVyIiwidG9VcHBlckNhc2UiLCJ1cmwiLCJhcHBseSIsImUiLCJzdGFjayIsInYxIiwibWVzc2FnZSIsIm5hbWUiLCJoZWxwZXJNZXRob2QiLCJfaW5pdEF1dGgiLCJsb2dpbkNvbXBhdGliaWxpdHkiLCJib2R5UGFyYW1zIiwidXNlciIsInVzZXJuYW1lIiwiZW1haWwiLCJwYXNzd29yZCIsImNvZGUiLCJ3aXRob3V0IiwibGVuZ3RoIiwiYXV0aCIsImluY2x1ZGVzIiwiaGFzaGVkIiwiZGlnZXN0IiwiYWxnb3JpdGhtIiwidG90cCIsImxvZ2luIiwic2VsZiIsImF1dGhSZXF1aXJlZCIsInBvc3QiLCJhcmdzIiwiaW52b2NhdGlvbiIsIkREUENvbW1vbiIsIk1ldGhvZEludm9jYXRpb24iLCJjb25uZWN0aW9uIiwiY2xvc2UiLCJERFAiLCJfQ3VycmVudEludm9jYXRpb24iLCJ3aXRoVmFsdWUiLCJNZXRlb3IiLCJjYWxsIiwicmVhc29uIiwic3RhdHVzIiwidXNlcnMiLCJmaW5kT25lIiwiX2lkIiwiaWQiLCJ1c2VySWQiLCJ1cGRhdGUiLCJBY2NvdW50cyIsIl9oYXNoTG9naW5Ub2tlbiIsInRva2VuIiwiJHVuc2V0IiwiZGF0YSIsImF1dGhUb2tlbiIsImV4dHJhRGF0YSIsIm9uTG9nZ2VkSW4iLCJleHRlbmQiLCJleHRyYSIsImxvZ291dCIsImhhc2hlZFRva2VuIiwidG9rZW5Mb2NhdGlvbiIsImluZGV4IiwibGFzdEluZGV4T2YiLCJ0b2tlblBhdGgiLCJzdWJzdHJpbmciLCJ0b2tlbkZpZWxkTmFtZSIsInRva2VuVG9SZW1vdmUiLCJ0b2tlblJlbW92YWxRdWVyeSIsIiRwdWxsIiwib25Mb2dnZWRPdXQiLCJjb25zb2xlIiwid2FybiIsImdldFVzZXJBdXRoIiwiX2dldFVzZXJBdXRoIiwiaW52YWxpZFJlc3VsdHMiLCJ1bmRlZmluZWQiLCJwYXlsb2FkIiwiSlNPTiIsInBhcnNlIiwiaSIsImFyZ3VtZW50cyIsIk1hcCIsIkFwaUNsYXNzIiwiY3JlYXRlQXBpIiwiX2NyZWF0ZUFwaSIsImVuYWJsZUNvcnMiLCJ1c2VEZWZhdWx0QXV0aCIsInByZXR0eUpzb24iLCJwcm9jZXNzIiwiZW52IiwiTk9ERV9FTlYiLCJrZXkiLCJ2YWx1ZSIsImFkZEdyb3VwIiwic2VjdGlvbiIsImFkZCIsInR5cGUiLCJwdWJsaWMiLCJlbmFibGVRdWVyeSIsInNldCIsIl9yZXF1ZXN0UGFyYW1zIiwicXVlcnlQYXJhbXMiLCJfZ2V0UGFnaW5hdGlvbkl0ZW1zIiwiaGFyZFVwcGVyTGltaXQiLCJkZWZhdWx0Q291bnQiLCJvZmZzZXQiLCJwYXJzZUludCIsImNvdW50IiwiX2dldFVzZXJGcm9tUGFyYW1zIiwiZG9lc250RXhpc3QiLCJfZG9lc250RXhpc3QiLCJwYXJhbXMiLCJyZXF1ZXN0UGFyYW1zIiwidHJpbSIsIm1vZGVscyIsIlVzZXJzIiwiZmluZE9uZUJ5SWQiLCJmaW5kT25lQnlVc2VybmFtZSIsIkVycm9yIiwiX2lzVXNlckZyb21QYXJhbXMiLCJfcGFyc2VKc29uUXVlcnkiLCJzb3J0IiwiZmllbGRzIiwibm9uU2VsZWN0YWJsZUZpZWxkcyIsImF1dGh6IiwiaGFzUGVybWlzc2lvbiIsImNvbmNhdCIsImsiLCJzcGxpdCIsImFzc2lnbiIsInF1ZXJ5Iiwibm9uUXVlcmFibGVGaWVsZHMiLCJfZGVwcmVjYXRpb25XYXJuaW5nIiwiZW5kcG9pbnQiLCJ2ZXJzaW9uV2lsbEJlUmVtb3ZlIiwid2FybmluZ01lc3NhZ2UiLCJ3YXJuaW5nIiwiX2dldExvZ2dlZEluVXNlciIsIl9hZGRVc2VyVG9PYmplY3QiLCJvYmplY3QiLCJnZXRMb2dnZWRJblVzZXIiLCJoYXNSb2xlIiwiaW5mbyIsIkluZm8iLCJwcm9tY2xpZW50IiwicmVnaXN0ZXIiLCJtZXRyaWNzIiwiZmluZENoYW5uZWxCeUlkT3JOYW1lIiwiY2hlY2tlZEFyY2hpdmVkIiwicmV0dXJuVXNlcm5hbWVzIiwicm9vbUlkIiwicm9vbU5hbWUiLCJyb29tIiwiUm9vbXMiLCJmaW5kT25lQnlOYW1lIiwidCIsImFyY2hpdmVkIiwiZmluZFJlc3VsdCIsInJ1bkFzVXNlciIsImFjdGl2ZVVzZXJzT25seSIsImNoYW5uZWwiLCJnZXRVc2VyRnJvbVBhcmFtcyIsImxhdGVzdCIsIm9sZGVzdCIsIkRhdGUiLCJpbmNsdXNpdmUiLCJkZXByZWNhdGlvbldhcm5pbmciLCJzdWIiLCJTdWJzY3JpcHRpb25zIiwiZmluZE9uZUJ5Um9vbUlkQW5kVXNlcklkIiwib3BlbiIsImNyZWF0ZUNoYW5uZWxWYWxpZGF0b3IiLCJjcmVhdGVDaGFubmVsIiwicmVhZE9ubHkiLCJyaWQiLCJjaGFubmVscyIsImNyZWF0ZSIsInZhbGlkYXRlIiwiZXhlY3V0ZSIsImFkZFVzZXJPYmplY3RUb0V2ZXJ5T2JqZWN0IiwiZmlsZSIsImluc2VydFVzZXJPYmplY3QiLCJnZXRQYWdpbmF0aW9uSXRlbXMiLCJwYXJzZUpzb25RdWVyeSIsIm91clF1ZXJ5IiwiZmlsZXMiLCJVcGxvYWRzIiwiZmluZCIsInNraXAiLCJsaW1pdCIsImZldGNoIiwibWFwIiwidG90YWwiLCJpbmNsdWRlQWxsUHVibGljQ2hhbm5lbHMiLCIkaW4iLCJpbnRlZ3JhdGlvbnMiLCJJbnRlZ3JhdGlvbnMiLCJfY3JlYXRlZEF0IiwibGF0ZXN0RGF0ZSIsIm9sZGVzdERhdGUiLCJ1bnJlYWRzIiwiaGFzUGVybWlzc2lvblRvU2VlQWxsUHVibGljQ2hhbm5lbHMiLCJyb29tcyIsInBsdWNrIiwidG90YWxDb3VudCIsInByb2Nlc3NRdWVyeU9wdGlvbnNPblJlc3VsdCIsInNob3VsZEJlT3JkZXJlZERlc2MiLCJNYXRjaCIsInRlc3QiLCJOdW1iZXIiLCJBcnJheSIsImZyb20iLCJyZXZlcnNlIiwidXRjT2Zmc2V0IiwibWVzc2FnZXMiLCJNZXNzYWdlcyIsInRzIiwib25saW5lIiwiZmluZFVzZXJzTm90T2ZmbGluZSIsIm9ubGluZUluUm9vbSIsImluZGV4T2YiLCJkZXNjcmlwdGlvbiIsInB1cnBvc2UiLCJybyIsInRvcGljIiwiYW5ub3VuY2VtZW50IiwibWVudGlvbnMiLCJhbGxNZW50aW9ucyIsIkJ1c2JveSIsImZpbmRSb29tQnlJZE9yTmFtZSIsInVwZGF0ZWRTaW5jZSIsInVwZGF0ZWRTaW5jZURhdGUiLCJpc05hTiIsInJlbW92ZSIsInVybFBhcmFtcyIsImJ1c2JveSIsIndyYXBBc3luYyIsImNhbGxiYWNrIiwib24iLCJmaWVsZG5hbWUiLCJmaWxlbmFtZSIsImVuY29kaW5nIiwibWltZXR5cGUiLCJmaWxlRGF0ZSIsImZpbGVCdWZmZXIiLCJCdWZmZXIiLCJiaW5kRW52aXJvbm1lbnQiLCJwaXBlIiwiZmlsZVN0b3JlIiwiRmlsZVVwbG9hZCIsImdldFN0b3JlIiwiZGV0YWlscyIsInVwbG9hZGVkRmlsZSIsImluc2VydCIsImJpbmQiLCJzYXZlTm90aWZpY2F0aW9ucyIsIm5vdGlmaWNhdGlvbnMiLCJub3RpZmljYXRpb25LZXkiLCJmYXZvcml0ZSIsImhhc093blByb3BlcnR5Iiwic3Vic2NyaXB0aW9uIiwiX3Jvb20iLCJfdXNlciIsImNoZWNrIiwiU3RyaW5nIiwiT2JqZWN0SW5jbHVkaW5nIiwibXNnSWQiLCJhc1VzZXIiLCJNYXliZSIsIkJvb2xlYW4iLCJ1Iiwibm93IiwibGFzdFVwZGF0ZSIsIm1lc3NhZ2VJZCIsInBpbm5lZE1lc3NhZ2UiLCJtZXNzYWdlUmV0dXJuIiwicHJvY2Vzc1dlYmhvb2tNZXNzYWdlIiwic2VhcmNoVGV4dCIsImRvY3MiLCJzdGFycmVkIiwidGV4dCIsImVtb2ppIiwicmVhY3Rpb24iLCJtZXNzYWdlUmVhZFJlY2VpcHRzIiwicmVjZWlwdHMiLCJpZ25vcmUiLCJjb21tYW5kIiwiY21kIiwic2xhc2hDb21tYW5kcyIsImNvbW1hbmRzIiwidG9Mb3dlckNhc2UiLCJ2YWx1ZXMiLCJmaWx0ZXIiLCJydW4iLCJSYW5kb20iLCJlbW9qaXMiLCJmaW5kUHJpdmF0ZUdyb3VwQnlJZE9yTmFtZSIsInJvb21TdWIiLCJmaW5kT25lQnlSb29tTmFtZUFuZFVzZXJJZCIsImdyb3VwIiwiaW5jbHVkZUFsbFByaXZhdGVHcm91cHMiLCJjaGFubmVsc1RvU2VhcmNoIiwiZ3JvdXBzIiwic29ydEZuIiwiYSIsImIiLCJmaW5kRGlyZWN0TWVzc2FnZVJvb20iLCJnZXRSb29tQnlOYW1lT3JJZFdpdGhPcHRpb25Ub0pvaW4iLCJjdXJyZW50VXNlcklkIiwibmFtZU9ySWQiLCJsb2ciLCJtc2dzIiwiaW1zIiwiZW5hYmxlZCIsInVybHMiLCJldmVudCIsInRyaWdnZXJXb3JkcyIsImFsaWFzIiwiYXZhdGFyIiwic2NyaXB0RW5hYmxlZCIsInNjcmlwdCIsInRhcmdldENoYW5uZWwiLCJpbnRlZ3JhdGlvbiIsImhpc3RvcnkiLCJJbnRlZ3JhdGlvbkhpc3RvcnkiLCJpdGVtcyIsInRhcmdldF91cmwiLCJpbnRlZ3JhdGlvbklkIiwibWUiLCJwaWNrIiwidmVyaWZpZWRFbWFpbCIsInZlcmlmaWVkIiwidXNlckhhc05vdFNldFByZWZlcmVuY2VzWWV0IiwicHJlZmVyZW5jZXMiLCJhZGRyZXNzIiwib25saW5lQ2FjaGUiLCJvbmxpbmVDYWNoZURhdGUiLCJjYWNoZUludmFsaWQiLCJpY29uIiwidHlwZXMiLCJoaWRlSWNvbiIsImJhY2tncm91bmRDb2xvciIsIlRBUGkxOG4iLCJfXyIsImljb25TaXplIiwibGVmdFNpemUiLCJyaWdodFNpemUiLCJ3aWR0aCIsImhlaWdodCIsInJlcGxhY2UiLCJzb3J0RGlyZWN0aW9uIiwicGFnZSIsImFwcE5hbWUiLCJkZWxldGUiLCJhZmZlY3RlZFJlY29yZHMiLCJQdXNoIiwiYXBwQ29sbGVjdGlvbiIsIiRvciIsImhpZGRlbiIsIiRuZSIsIlNldHRpbmdzIiwibW91bnRPQXV0aFNlcnZpY2VzIiwib0F1dGhTZXJ2aWNlc0VuYWJsZWQiLCJTZXJ2aWNlQ29uZmlndXJhdGlvbiIsImNvbmZpZ3VyYXRpb25zIiwic2VjcmV0Iiwic2VydmljZSIsImN1c3RvbSIsImNsaWVudElkIiwiYXBwSWQiLCJjb25zdW1lcktleSIsImJ1dHRvbkxhYmVsVGV4dCIsImJ1dHRvbkNvbG9yIiwiYnV0dG9uTGFiZWxDb2xvciIsImZpbmRPbmVOb3RIaWRkZW5CeUlkIiwiQW55IiwidXBkYXRlVmFsdWVOb3RIaWRkZW5CeUlkIiwiUGFja2FnZSIsInJlZnJlc2giLCJzdGF0cyIsInN0YXRpc3RpY3MiLCJTdGF0aXN0aWNzIiwiYWN0aXZlIiwiam9pbkRlZmF1bHRDaGFubmVscyIsInNlbmRXZWxjb21lRW1haWwiLCJ2YWxpZGF0ZUN1c3RvbUZpZWxkcyIsIm5ld1VzZXJJZCIsInNhdmVVc2VyIiwic2F2ZUN1c3RvbUZpZWxkc1dpdGhvdXRWYWxpZGF0aW9uIiwiZ2V0VVJMIiwiY2RuIiwiZnVsbCIsInNldEhlYWRlciIsImlzVXNlckZyb21QYXJhbXMiLCJwcmVzZW5jZSIsImNvbm5lY3Rpb25TdGF0dXMiLCJhdmF0YXJVcmwiLCJzZXRVc2VyQXZhdGFyIiwiaW1hZ2VEYXRhIiwidXNlckRhdGEiLCJzYXZlQ3VzdG9tRmllbGRzIiwiY3VycmVudFBhc3N3b3JkIiwibmV3UGFzc3dvcmQiLCJyZWFsbmFtZSIsInR5cGVkUGFzc3dvcmQiLCJsYW5ndWFnZSIsIm5ld1Jvb21Ob3RpZmljYXRpb24iLCJuZXdNZXNzYWdlTm90aWZpY2F0aW9uIiwidXNlRW1vamlzIiwiY29udmVydEFzY2lpRW1vamkiLCJzYXZlTW9iaWxlQmFuZHdpZHRoIiwiY29sbGFwc2VNZWRpYUJ5RGVmYXVsdCIsImF1dG9JbWFnZUxvYWQiLCJlbWFpbE5vdGlmaWNhdGlvbk1vZGUiLCJyb29tc0xpc3RFeGhpYml0aW9uTW9kZSIsInVucmVhZEFsZXJ0Iiwibm90aWZpY2F0aW9uc1NvdW5kVm9sdW1lIiwiZGVza3RvcE5vdGlmaWNhdGlvbnMiLCJtb2JpbGVOb3RpZmljYXRpb25zIiwiZW5hYmxlQXV0b0F3YXkiLCJoaWdobGlnaHRzIiwiZGVza3RvcE5vdGlmaWNhdGlvbkR1cmF0aW9uIiwibWVzc2FnZVZpZXdNb2RlIiwiaGlkZVVzZXJuYW1lcyIsImhpZGVSb2xlcyIsImhpZGVBdmF0YXJzIiwiaGlkZUZsZXhUYWIiLCJzZW5kT25FbnRlciIsInJvb21Db3VudGVyU2lkZWJhciIsInNpZGViYXJTaG93RmF2b3JpdGVzIiwiT3B0aW9uYWwiLCJzaWRlYmFyU2hvd1VucmVhZCIsInNpZGViYXJTb3J0YnkiLCJzaWRlYmFyVmlld01vZGUiLCJzaWRlYmFySGlkZUF2YXRhciIsIm1lcmdlQ2hhbm5lbHMiLCJtdXRlRm9jdXNlZENvbnZlcnNhdGlvbnMiLCJjdXJyZW50VXNlclJvbGVzIiwiZW1haWxTZW50Il0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLElBQUlBLENBQUo7O0FBQU1DLE9BQU9DLEtBQVAsQ0FBYUMsUUFBUSxZQUFSLENBQWIsRUFBbUM7QUFBQ0MsVUFBUUMsQ0FBUixFQUFVO0FBQUNMLFFBQUVLLENBQUY7QUFBSTs7QUFBaEIsQ0FBbkMsRUFBcUQsQ0FBckQ7QUFFTixNQUFNQyxTQUFTLElBQUlDLE1BQUosQ0FBVyxLQUFYLEVBQWtCLEVBQWxCLENBQWY7O0FBRUEsTUFBTUMsR0FBTixTQUFrQkMsUUFBbEIsQ0FBMkI7QUFDMUJDLGNBQVlDLFVBQVosRUFBd0I7QUFDdkIsVUFBTUEsVUFBTjtBQUNBLFNBQUtMLE1BQUwsR0FBYyxJQUFJQyxNQUFKLENBQVksT0FBT0ksV0FBV0MsT0FBWCxHQUFxQkQsV0FBV0MsT0FBaEMsR0FBMEMsU0FBVyxTQUF4RSxFQUFrRixFQUFsRixDQUFkO0FBQ0EsU0FBS0MsV0FBTCxHQUFtQixFQUFuQjtBQUNBLFNBQUtDLGNBQUwsR0FBc0IsR0FBdEI7QUFDQSxTQUFLQyxzQkFBTCxHQUE4QjtBQUM3QkMsZ0JBQVUsQ0FEbUI7QUFFN0JDLGFBQU8sQ0FGc0I7QUFHN0JDLFlBQU0sQ0FIdUI7QUFJN0JDLGVBQVMsQ0FKb0I7QUFLN0JDLGlCQUFXLENBTGtCO0FBS2Y7QUFDZEMsaUJBQVc7QUFOa0Is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QUFYLENBQWU0RSxFQUFmLENBQWtCdkIsT0FBbEIsQ0FBMEIsaUNBQTFCLENBQVA7QUFDQTs7QUFFRCxVQUFNd2MsWUFBWWhaLE9BQU9DLElBQVAsQ0FBWSx5QkFBWixFQUF1Q3pCLEtBQXZDLENBQWxCOztBQUNBLFFBQUl3YSxTQUFKLEVBQWU7QUFDZCxhQUFPMWQsV0FBV25DLEdBQVgsQ0FBZTRFLEVBQWYsQ0FBa0I3QixPQUFsQixFQUFQO0FBQ0E7O0FBQ0QsV0FBT1osV0FBV25DLEdBQVgsQ0FBZTRFLEVBQWYsQ0FBa0J2QixPQUFsQixDQUEwQixnQkFBMUIsQ0FBUDtBQUNBOztBQVowRSxDQUE1RSxFIiwiZmlsZSI6Ii9wYWNrYWdlcy9yb2NrZXRjaGF0X2FwaS5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qIGdsb2JhbCBSZXN0aXZ1cywgRERQLCBERFBDb21tb24gKi9cbmltcG9ydCBfIGZyb20gJ3VuZGVyc2NvcmUnO1xuY29uc3QgbG9nZ2VyID0gbmV3IExvZ2dlcignQVBJJywge30pO1xuXG5jbGFzcyBBUEkgZXh0ZW5kcyBSZXN0aXZ1cyB7XG5cdGNvbnN0cnVjdG9yKHByb3BlcnRpZXMpIHtcblx0XHRzdXBlcihwcm9wZXJ0aWVzKTtcblx0XHR0aGlzLmxvZ2dlciA9IG5ldyBMb2dnZXIoYEFQSSAkeyBwcm9wZXJ0aWVzLnZlcnNpb24gPyBwcm9wZXJ0aWVzLnZlcnNpb24gOiAnZGVmYXVsdCcgfSBMb2dnZXJgLCB7fSk7XG5cdFx0dGhpcy5hdXRoTWV0aG9kcyA9IFtdO1xuXHRcdHRoaXMuZmllbGRTZXBhcmF0b3IgPSAnLic7XG5cdFx0dGhpcy5kZWZhdWx0RmllbGRzVG9FeGNsdWRlID0ge1xuXHRcdFx0am9pbkNvZGU6IDAsXG5cdFx0XHQkbG9raTogMCxcblx0XHRcdG1ldGE6IDAsXG5cdFx0XHRtZW1iZXJzOiAwLFxuXHRcdFx0dXNlcm5hbWVzOiAwLCAvLyBQbGVhc2UgdXNlIHRoZSBgY2hhbm5lbC9kbS9ncm91cC5tZW1iZXJzYCBlbmRwb2ludC4gVGhpcyBpcyBkaXNhYmxlZCBmb3IgcGVyZm9ybWFuY2UgcmVhc29uc1xuXHRcdFx0aW1wb3J0SWRzOiAwXG5cdFx0fTtcblx0XHR0aGlzLmxpbWl0ZWRVc2VyRmllbGRzVG9FeGNsdWRlID0ge1xuXHRcdFx0YXZhdGFyT3JpZ2luOiAwLFxuXHRcdFx0ZW1haWxzOiAwLFxuXHRcdFx0cGhvbmU6IDAsXG5cdFx0XHRzdGF0dXNDb25uZWN0aW9uOiAwLFxuXHRcdFx0Y3JlYXRlZEF0OiAwLFxuXHRcdFx0bGFzdExvZ2luOiAwLFxuXHRcdFx0c2VydmljZXM6IDAsXG5cdFx0XHRyZXF1aXJlUGFzc3dvcmRDaGFuZ2U6IDAsXG5cdFx0XHRyZXF1aXJlUGFzc3dvcmRDaGFuZ2VSZWFzb246IDAsXG5cdFx0XHRyb2xlczogMCxcblx0XHRcdHN0YXR1c0RlZmF1bHQ6IDAsXG5cdFx0XHRfdXBkYXRlZEF0OiAwLFxuXHRcdFx0Y3VzdG9tRmllbGRzOiAwLFxuXHRcdFx0c2V0dGluZ3M6IDBcblx0XHR9O1xuXG5cdFx0dGhpcy5fY29uZmlnLmRlZmF1bHRPcHRpb25zRW5kcG9pbnQgPSBmdW5jdGlvbiBfZGVmYXVsdE9wdGlvbnNFbmRwb2ludCgpIHtcblx0XHRcdGlmICh0aGlzLnJlcXVlc3QubWV0aG9kID09PSAnT1BUSU9OUycgJiYgdGhpcy5yZXF1ZXN0LmhlYWRlcnNbJ2FjY2Vzcy1jb250cm9sLXJlcXVlc3QtbWV0aG9kJ10pIHtcblx0XHRcdFx0aWYgKFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdBUElfRW5hYmxlX0NPUlMnKSA9PT0gdHJ1ZSkge1xuXHRcdFx0XHRcdHRoaXMucmVzcG9uc2Uud3JpdGVIZWFkKDIwMCwge1xuXHRcdFx0XHRcdFx0J0FjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpbic6IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdBUElfQ09SU19PcmlnaW4nKSxcblx0XHRcdFx0XHRcdCdBY2Nlc3MtQ29udHJvbC1BbGxvdy1IZWFkZXJzJzogJ09yaWdpbiwgWC1SZXF1ZXN0ZWQtV2l0aCwgQ29udGVudC1UeXBlLCBBY2NlcHQsIFgtVXNlci1JZCwgWC1BdXRoLVRva2VuJ1xuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHRoaXMucmVzcG9uc2Uud3JpdGVIZWFkKDQwNSk7XG5cdFx0XHRcdFx0dGhpcy5yZXNwb25zZS53cml0ZSgnQ09SUyBub3QgZW5hYmxlZC4gR28gdG8gXCJBZG1pbiA+IEdlbmVyYWwgPiBSRVNUIEFwaVwiIHRvIGVuYWJsZSBpdC4nKTtcblx0XHRcdFx0fVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dGhpcy5yZXNwb25zZS53cml0ZUhlYWQoNDA0KTtcblx0XHRcdH1cblxuXHRcdFx0dGhpcy5kb25lKCk7XG5cdFx0fTtcblx0fVxuXG5cdGhhc0hlbHBlck1ldGhvZHMoKSB7XG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLmhlbHBlck1ldGhvZHMuc2l6ZSAhPT0gMDtcblx0fVxuXG5cdGdldEhlbHBlck1ldGhvZHMoKSB7XG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLmhlbHBlck1ldGhvZHM7XG5cdH1cblxuXHRhZGRBdXRoTWV0aG9kKG1ldGhvZCkge1xuXHRcdHRoaXMuYXV0aE1ldGhvZHMucHVzaChtZXRob2QpO1xuXHR9XG5cblx0c3VjY2VzcyhyZXN1bHQgPSB7fSkge1xuXHRcdGlmIChfLmlzT2JqZWN0KHJlc3VsdCkpIHtcblx0XHRcdHJlc3VsdC5zdWNjZXNzID0gdHJ1ZTtcblx0XHR9XG5cblx0XHRyZXN1bHQgPSB7XG5cdFx0XHRzdGF0dXNDb2RlOiAyMDAsXG5cdFx0XHRib2R5OiByZXN1bHRcblx0XHR9O1xuXG5cdFx0bG9nZ2VyLmRlYnVnKCdTdWNjZXNzJywgcmVzdWx0KTtcblxuXHRcdHJldHVybiByZXN1bHQ7XG5cdH1cblxuXHRmYWlsdXJlKHJlc3VsdCwgZXJyb3JUeXBlKSB7XG5cdFx0aWYgKF8uaXNPYmplY3QocmVzdWx0KSkge1xuXHRcdFx0cmVzdWx0LnN1Y2Nlc3MgPSBmYWxzZTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmVzdWx0ID0ge1xuXHRcdFx0XHRzdWNjZXNzOiBmYWxzZSxcblx0XHRcdFx0ZXJyb3I6IHJlc3VsdFxuXHRcdFx0fTtcblxuXHRcdFx0aWYgKGVycm9yVHlwZSkge1xuXHRcdFx0XHRyZXN1bHQuZXJyb3JUeXBlID0gZXJyb3JUeXBlO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJlc3VsdCA9IHtcblx0XHRcdHN0YXR1c0NvZGU6IDQwMCxcblx0XHRcdGJvZHk6IHJlc3VsdFxuXHRcdH07XG5cblx0XHRsb2dnZXIuZGVidWcoJ0ZhaWx1cmUnLCByZXN1bHQpO1xuXG5cdFx0cmV0dXJuIHJlc3VsdDtcblx0fVxuXG5cdG5vdEZvdW5kKG1zZykge1xuXHRcdHJldHVybiB7XG5cdFx0XHRzdGF0dXNDb2RlOiA0MDQsXG5cdFx0XHRib2R5OiB7XG5cdFx0XHRcdHN1Y2Nlc3M6IGZhbHNlLFxuXHRcdFx0XHRlcnJvcjogbXNnID8gbXNnIDogJ1Jlc291cmNlIG5vdCBmb3VuZCdcblx0XHRcdH1cblx0XHR9O1xuXHR9XG5cblx0dW5hdXRob3JpemVkKG1zZykge1xuXHRcdHJldHVybiB7XG5cdFx0XHRzdGF0dXNDb2RlOiA0MDMsXG5cdFx0XHRib2R5OiB7XG5cdFx0XHRcdHN1Y2Nlc3M6IGZhbHNlLFxuXHRcdFx0XHRlcnJvcjogbXNnID8gbXNnIDogJ3VuYXV0aG9yaXplZCdcblx0XHRcdH1cblx0XHR9O1xuXHR9XG5cblx0YWRkUm91dGUocm91dGVzLCBvcHRpb25zLCBlbmRwb2ludHMpIHtcblx0XHQvL05vdGU6IHJlcXVpcmVkIGlmIHRoZSBkZXZlbG9wZXIgZGlkbid0IHByb3ZpZGUgb3B0aW9uc1xuXHRcdGlmICh0eXBlb2YgZW5kcG9pbnRzID09PSAndW5kZWZpbmVkJykge1xuXHRcdFx0ZW5kcG9pbnRzID0gb3B0aW9ucztcblx0XHRcdG9wdGlvbnMgPSB7fTtcblx0XHR9XG5cblx0XHQvL0FsbG93IGZvciBtb3JlIHRoYW4gb25lIHJvdXRlIHVzaW5nIHRoZSBzYW1lIG9wdGlvbiBhbmQgZW5kcG9pbnRzXG5cdFx0aWYgKCFfLmlzQXJyYXkocm91dGVzKSkge1xuXHRcdFx0cm91dGVzID0gW3JvdXRlc107XG5cdFx0fVxuXG5cdFx0cm91dGVzLmZvckVhY2goKHJvdXRlKSA9PiB7XG5cdFx0XHQvL05vdGU6IFRoaXMgaXMgcmVxdWlyZWQgZHVlIHRvIFJlc3RpdnVzIGNhbGxpbmcgYGFkZFJvdXRlYCBpbiB0aGUgY29uc3RydWN0b3Igb2YgaXRzZWxmXG5cdFx0XHRpZiAodGhpcy5oYXNIZWxwZXJNZXRob2RzKCkpIHtcblx0XHRcdFx0T2JqZWN0LmtleXMoZW5kcG9pbnRzKS5mb3JFYWNoKChtZXRob2QpID0+IHtcblx0XHRcdFx0XHRpZiAodHlwZW9mIGVuZHBvaW50c1ttZXRob2RdID09PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRcdFx0XHRlbmRwb2ludHNbbWV0aG9kXSA9IHthY3Rpb246IGVuZHBvaW50c1ttZXRob2RdfTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHQvL0FkZCBhIHRyeS9jYXRjaCBmb3IgZWFjaCBlbmRwb2ludFxuXHRcdFx0XHRcdGNvbnN0IG9yaWdpbmFsQWN0aW9uID0gZW5kcG9pbnRzW21ldGhvZF0uYWN0aW9uO1xuXHRcdFx0XHRcdGVuZHBvaW50c1ttZXRob2RdLmFjdGlvbiA9IGZ1bmN0aW9uIF9pbnRlcm5hbFJvdXRlQWN0aW9uSGFuZGxlcigpIHtcblx0XHRcdFx0XHRcdHRoaXMubG9nZ2VyLmRlYnVnKGAkeyB0aGlzLnJlcXVlc3QubWV0aG9kLnRvVXBwZXJDYXNlKCkgfTogJHsgdGhpcy5yZXF1ZXN0LnVybCB9YCk7XG5cdFx0XHRcdFx0XHRsZXQgcmVzdWx0O1xuXHRcdFx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0XHRcdFx0cmVzdWx0ID0gb3JpZ2luYWxBY3Rpb24uYXBwbHkodGhpcyk7XG5cdFx0XHRcdFx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRcdFx0XHRcdHRoaXMubG9nZ2VyLmRlYnVnKGAkeyBtZXRob2QgfSAkeyByb3V0ZSB9IHRocmV3IGFuIGVycm9yOmAsIGUuc3RhY2spO1xuXHRcdFx0XHRcdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZShlLm1lc3NhZ2UsIGUuZXJyb3IpO1xuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRyZXR1cm4gcmVzdWx0ID8gcmVzdWx0IDogUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2VzcygpO1xuXHRcdFx0XHRcdH07XG5cblx0XHRcdFx0XHRmb3IgKGNvbnN0IFtuYW1lLCBoZWxwZXJNZXRob2RdIG9mIHRoaXMuZ2V0SGVscGVyTWV0aG9kcygpKSB7XG5cdFx0XHRcdFx0XHRlbmRwb2ludHNbbWV0aG9kXVtuYW1lXSA9IGhlbHBlck1ldGhvZDtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHQvL0FsbG93IHRoZSBlbmRwb2ludHMgdG8gbWFrZSB1c2FnZSBvZiB0aGUgbG9nZ2VyIHdoaWNoIHJlc3BlY3RzIHRoZSB1c2VyJ3Mgc2V0dGluZ3Ncblx0XHRcdFx0XHRlbmRwb2ludHNbbWV0aG9kXS5sb2dnZXIgPSB0aGlzLmxvZ2dlcjtcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cblx0XHRcdHN1cGVyLmFkZFJvdXRlKHJvdXRlLCBvcHRpb25zLCBlbmRwb2ludHMpO1xuXHRcdH0pO1xuXHR9XG5cblx0X2luaXRBdXRoKCkge1xuXHRcdGNvbnN0IGxvZ2luQ29tcGF0aWJpbGl0eSA9IChib2R5UGFyYW1zKSA9PiB7XG5cdFx0XHQvLyBHcmFiIHRoZSB1c2VybmFtZSBvciBlbWFpbCB0aGF0IHRoZSB1c2VyIGlzIGxvZ2dpbmcgaW4gd2l0aFxuXHRcdFx0Y29uc3Qge3VzZXIsIHVzZXJuYW1lLCBlbWFpbCwgcGFzc3dvcmQsIGNvZGV9ID0gYm9keVBhcmFtcztcblxuXHRcdFx0aWYgKHBhc3N3b3JkID09IG51bGwpIHtcblx0XHRcdFx0cmV0dXJuIGJvZHlQYXJhbXM7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChfLndpdGhvdXQoT2JqZWN0LmtleXMoYm9keVBhcmFtcyksICd1c2VyJywgJ3VzZXJuYW1lJywgJ2VtYWlsJywgJ3Bhc3N3b3JkJywgJ2NvZGUnKS5sZW5ndGggPiAwKSB7XG5cdFx0XHRcdHJldHVybiBib2R5UGFyYW1zO1xuXHRcdFx0fVxuXG5cdFx0XHRjb25zdCBhdXRoID0ge1xuXHRcdFx0XHRwYXNzd29yZFxuXHRcdFx0fTtcblxuXHRcdFx0aWYgKHR5cGVvZiB1c2VyID09PSAnc3RyaW5nJykge1xuXHRcdFx0XHRhdXRoLnVzZXIgPSB1c2VyLmluY2x1ZGVzKCdAJykgPyB7ZW1haWw6IHVzZXJ9IDoge3VzZXJuYW1lOiB1c2VyfTtcblx0XHRcdH0gZWxzZSBpZiAodXNlcm5hbWUpIHtcblx0XHRcdFx0YXV0aC51c2VyID0ge3VzZXJuYW1lfTtcblx0XHRcdH0gZWxzZSBpZiAoZW1haWwpIHtcblx0XHRcdFx0YXV0aC51c2VyID0ge2VtYWlsfTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKGF1dGgudXNlciA9PSBudWxsKSB7XG5cdFx0XHRcdHJldHVybiBib2R5UGFyYW1zO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoYXV0aC5wYXNzd29yZC5oYXNoZWQpIHtcblx0XHRcdFx0YXV0aC5wYXNzd29yZCA9IHtcblx0XHRcdFx0XHRkaWdlc3Q6IGF1dGgucGFzc3dvcmQsXG5cdFx0XHRcdFx0YWxnb3JpdGhtOiAnc2hhLTI1Nidcblx0XHRcdFx0fTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKGNvZGUpIHtcblx0XHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0XHR0b3RwOiB7XG5cdFx0XHRcdFx0XHRjb2RlLFxuXHRcdFx0XHRcdFx0bG9naW46IGF1dGhcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH07XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBhdXRoO1xuXHRcdH07XG5cblx0XHRjb25zdCBzZWxmID0gdGhpcztcblxuXHRcdHRoaXMuYWRkUm91dGUoJ2xvZ2luJywge2F1dGhSZXF1aXJlZDogZmFsc2V9LCB7XG5cdFx0XHRwb3N0KCkge1xuXHRcdFx0XHRjb25zdCBhcmdzID0gbG9naW5Db21wYXRpYmlsaXR5KHRoaXMuYm9keVBhcmFtcyk7XG5cblx0XHRcdFx0Y29uc3QgaW52b2NhdGlvbiA9IG5ldyBERFBDb21tb24uTWV0aG9kSW52b2NhdGlvbih7XG5cdFx0XHRcdFx0Y29ubmVjdGlvbjoge1xuXHRcdFx0XHRcdFx0Y2xvc2UoKSB7fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0bGV0IGF1dGg7XG5cdFx0XHRcdHRyeSB7XG5cdFx0XHRcdFx0YXV0aCA9IEREUC5fQ3VycmVudEludm9jYXRpb24ud2l0aFZhbHVlKGludm9jYXRpb24sICgpID0+IE1ldGVvci5jYWxsKCdsb2dpbicsIGFyZ3MpKTtcblx0XHRcdFx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRcdFx0XHRsZXQgZSA9IGVycm9yO1xuXHRcdFx0XHRcdGlmIChlcnJvci5yZWFzb24gPT09ICdVc2VyIG5vdCBmb3VuZCcpIHtcblx0XHRcdFx0XHRcdGUgPSB7XG5cdFx0XHRcdFx0XHRcdGVycm9yOiAnVW5hdXRob3JpemVkJyxcblx0XHRcdFx0XHRcdFx0cmVhc29uOiAnVW5hdXRob3JpemVkJ1xuXHRcdFx0XHRcdFx0fTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRcdFx0c3RhdHVzQ29kZTogNDAxLFxuXHRcdFx0XHRcdFx0Ym9keToge1xuXHRcdFx0XHRcdFx0XHRzdGF0dXM6ICdlcnJvcicsXG5cdFx0XHRcdFx0XHRcdGVycm9yOiBlLmVycm9yLFxuXHRcdFx0XHRcdFx0XHRtZXNzYWdlOiBlLnJlYXNvbiB8fCBlLm1lc3NhZ2Vcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9O1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0dGhpcy51c2VyID0gTWV0ZW9yLnVzZXJzLmZpbmRPbmUoe1xuXHRcdFx0XHRcdF9pZDogYXV0aC5pZFxuXHRcdFx0XHR9KTtcblxuXHRcdFx0XHR0aGlzLnVzZXJJZCA9IHRoaXMudXNlci5faWQ7XG5cblx0XHRcdFx0Ly8gUmVtb3ZlIHRva2VuRXhwaXJlcyB0byBrZWVwIHRoZSBvbGQgYmVoYXZpb3Jcblx0XHRcdFx0TWV0ZW9yLnVzZXJzLnVwZGF0ZSh7XG5cdFx0XHRcdFx0X2lkOiB0aGlzLnVzZXIuX2lkLFxuXHRcdFx0XHRcdCdzZXJ2aWNlcy5yZXN1bWUubG9naW5Ub2tlbnMuaGFzaGVkVG9rZW4nOiBBY2NvdW50cy5faGFzaExvZ2luVG9rZW4oYXV0aC50b2tlbilcblx0XHRcdFx0fSwge1xuXHRcdFx0XHRcdCR1bnNldDoge1xuXHRcdFx0XHRcdFx0J3NlcnZpY2VzLnJlc3VtZS5sb2dpblRva2Vucy4kLndoZW4nOiAxXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9KTtcblxuXHRcdFx0XHRjb25zdCByZXNwb25zZSA9IHtcblx0XHRcdFx0XHRzdGF0dXM6ICdzdWNjZXNzJyxcblx0XHRcdFx0XHRkYXRhOiB7XG5cdFx0XHRcdFx0XHR1c2VySWQ6IHRoaXMudXNlcklkLFxuXHRcdFx0XHRcdFx0YXV0aFRva2VuOiBhdXRoLnRva2VuXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9O1xuXG5cdFx0XHRcdGNvbnN0IGV4dHJhRGF0YSA9IHNlbGYuX2NvbmZpZy5vbkxvZ2dlZEluICYmIHNlbGYuX2NvbmZpZy5vbkxvZ2dlZEluLmNhbGwodGhpcyk7XG5cblx0XHRcdFx0aWYgKGV4dHJhRGF0YSAhPSBudWxsKSB7XG5cdFx0XHRcdFx0Xy5leHRlbmQocmVzcG9uc2UuZGF0YSwge1xuXHRcdFx0XHRcdFx0ZXh0cmE6IGV4dHJhRGF0YVxuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0cmV0dXJuIHJlc3BvbnNlO1xuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0Y29uc3QgbG9nb3V0ID0gZnVuY3Rpb24oKSB7XG5cdFx0XHQvLyBSZW1vdmUgdGhlIGdpdmVuIGF1dGggdG9rZW4gZnJvbSB0aGUgdXNlcidzIGFjY291bnRcblx0XHRcdGNvbnN0IGF1dGhUb2tlbiA9IHRoaXMucmVxdWVzdC5oZWFkZXJzWyd4LWF1dGgtdG9rZW4nXTtcblx0XHRcdGNvbnN0IGhhc2hlZFRva2VuID0gQWNjb3VudHMuX2hhc2hMb2dpblRva2VuKGF1dGhUb2tlbik7XG5cdFx0XHRjb25zdCB0b2tlbkxvY2F0aW9uID0gc2VsZi5fY29uZmlnLmF1dGgudG9rZW47XG5cdFx0XHRjb25zdCBpbmRleCA9IHRva2VuTG9jYXRpb24ubGFzdEluZGV4T2YoJy4nKTtcblx0XHRcdGNvbnN0IHRva2VuUGF0aCA9IHRva2VuTG9jYXRpb24uc3Vic3RyaW5nKDAsIGluZGV4KTtcblx0XHRcdGNvbnN0IHRva2VuRmllbGROYW1lID0gdG9rZW5Mb2NhdGlvbi5zdWJzdHJpbmcoaW5kZXggKyAxKTtcblx0XHRcdGNvbnN0IHRva2VuVG9SZW1vdmUgPSB7fTtcblx0XHRcdHRva2VuVG9SZW1vdmVbdG9rZW5GaWVsZE5hbWVdID0gaGFzaGVkVG9rZW47XG5cdFx0XHRjb25zdCB0b2tlblJlbW92YWxRdWVyeSA9IHt9O1xuXHRcdFx0dG9rZW5SZW1vdmFsUXVlcnlbdG9rZW5QYXRoXSA9IHRva2VuVG9SZW1vdmU7XG5cblx0XHRcdE1ldGVvci51c2Vycy51cGRhdGUodGhpcy51c2VyLl9pZCwge1xuXHRcdFx0XHQkcHVsbDogdG9rZW5SZW1vdmFsUXVlcnlcblx0XHRcdH0pO1xuXG5cdFx0XHRjb25zdCByZXNwb25zZSA9IHtcblx0XHRcdFx0c3RhdHVzOiAnc3VjY2VzcycsXG5cdFx0XHRcdGRhdGE6IHtcblx0XHRcdFx0XHRtZXNzYWdlOiAnWW91XFwndmUgYmVlbiBsb2dnZWQgb3V0ISdcblx0XHRcdFx0fVxuXHRcdFx0fTtcblxuXHRcdFx0Ly8gQ2FsbCB0aGUgbG9nb3V0IGhvb2sgd2l0aCB0aGUgYXV0aGVudGljYXRlZCB1c2VyIGF0dGFjaGVkXG5cdFx0XHRjb25zdCBleHRyYURhdGEgPSBzZWxmLl9jb25maWcub25Mb2dnZWRPdXQgJiYgc2VsZi5fY29uZmlnLm9uTG9nZ2VkT3V0LmNhbGwodGhpcyk7XG5cdFx0XHRpZiAoZXh0cmFEYXRhICE9IG51bGwpIHtcblx0XHRcdFx0Xy5leHRlbmQocmVzcG9uc2UuZGF0YSwge1xuXHRcdFx0XHRcdGV4dHJhOiBleHRyYURhdGFcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gcmVzcG9uc2U7XG5cdFx0fTtcblxuXHRcdC8qXG5cdFx0XHRBZGQgYSBsb2dvdXQgZW5kcG9pbnQgdG8gdGhlIEFQSVxuXHRcdFx0QWZ0ZXIgdGhlIHVzZXIgaXMgbG9nZ2VkIG91dCwgdGhlIG9uTG9nZ2VkT3V0IGhvb2sgaXMgY2FsbGVkIChzZWUgUmVzdGZ1bGx5LmNvbmZpZ3VyZSgpIGZvclxuXHRcdFx0YWRkaW5nIGhvb2spLlxuXHRcdCovXG5cdFx0cmV0dXJuIHRoaXMuYWRkUm91dGUoJ2xvZ291dCcsIHtcblx0XHRcdGF1dGhSZXF1aXJlZDogdHJ1ZVxuXHRcdH0sIHtcblx0XHRcdGdldCgpIHtcblx0XHRcdFx0Y29uc29sZS53YXJuKCdXYXJuaW5nOiBEZWZhdWx0IGxvZ291dCB2aWEgR0VUIHdpbGwgYmUgcmVtb3ZlZCBpbiBSZXN0aXZ1cyB2MS4wLiBVc2UgUE9TVCBpbnN0ZWFkLicpO1xuXHRcdFx0XHRjb25zb2xlLndhcm4oJyAgICBTZWUgaHR0cHM6Ly9naXRodWIuY29tL2thaG1hbGkvbWV0ZW9yLXJlc3RpdnVzL2lzc3Vlcy8xMDAnKTtcblx0XHRcdFx0cmV0dXJuIGxvZ291dC5jYWxsKHRoaXMpO1xuXHRcdFx0fSxcblx0XHRcdHBvc3Q6IGxvZ291dFxuXHRcdH0pO1xuXHR9XG59XG5cbmNvbnN0IGdldFVzZXJBdXRoID0gZnVuY3Rpb24gX2dldFVzZXJBdXRoKCkge1xuXHRjb25zdCBpbnZhbGlkUmVzdWx0cyA9IFt1bmRlZmluZWQsIG51bGwsIGZhbHNlXTtcblx0cmV0dXJuIHtcblx0XHR0b2tlbjogJ3NlcnZpY2VzLnJlc3VtZS5sb2dpblRva2Vucy5oYXNoZWRUb2tlbicsXG5cdFx0dXNlcigpIHtcblx0XHRcdGlmICh0aGlzLmJvZHlQYXJhbXMgJiYgdGhpcy5ib2R5UGFyYW1zLnBheWxvYWQpIHtcblx0XHRcdFx0dGhpcy5ib2R5UGFyYW1zID0gSlNPTi5wYXJzZSh0aGlzLmJvZHlQYXJhbXMucGF5bG9hZCk7XG5cdFx0XHR9XG5cblx0XHRcdGZvciAobGV0IGkgPSAwOyBpIDwgUm9ja2V0Q2hhdC5BUEkudjEuYXV0aE1ldGhvZHMubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0Y29uc3QgbWV0aG9kID0gUm9ja2V0Q2hhdC5BUEkudjEuYXV0aE1ldGhvZHNbaV07XG5cblx0XHRcdFx0aWYgKHR5cGVvZiBtZXRob2QgPT09ICdmdW5jdGlvbicpIHtcblx0XHRcdFx0XHRjb25zdCByZXN1bHQgPSBtZXRob2QuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcblx0XHRcdFx0XHRpZiAoIWludmFsaWRSZXN1bHRzLmluY2x1ZGVzKHJlc3VsdCkpIHtcblx0XHRcdFx0XHRcdHJldHVybiByZXN1bHQ7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdGxldCB0b2tlbjtcblx0XHRcdGlmICh0aGlzLnJlcXVlc3QuaGVhZGVyc1sneC1hdXRoLXRva2VuJ10pIHtcblx0XHRcdFx0dG9rZW4gPSBBY2NvdW50cy5faGFzaExvZ2luVG9rZW4odGhpcy5yZXF1ZXN0LmhlYWRlcnNbJ3gtYXV0aC10b2tlbiddKTtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0dXNlcklkOiB0aGlzLnJlcXVlc3QuaGVhZGVyc1sneC11c2VyLWlkJ10sXG5cdFx0XHRcdHRva2VuXG5cdFx0XHR9O1xuXHRcdH1cblx0fTtcbn07XG5cblJvY2tldENoYXQuQVBJID0ge1xuXHRoZWxwZXJNZXRob2RzOiBuZXcgTWFwKCksXG5cdGdldFVzZXJBdXRoLFxuXHRBcGlDbGFzczogQVBJXG59O1xuXG5jb25zdCBjcmVhdGVBcGkgPSBmdW5jdGlvbiBfY3JlYXRlQXBpKGVuYWJsZUNvcnMpIHtcblx0aWYgKCFSb2NrZXRDaGF0LkFQSS52MSB8fCBSb2NrZXRDaGF0LkFQSS52MS5fY29uZmlnLmVuYWJsZUNvcnMgIT09IGVuYWJsZUNvcnMpIHtcblx0XHRSb2NrZXRDaGF0LkFQSS52MSA9IG5ldyBBUEkoe1xuXHRcdFx0dmVyc2lvbjogJ3YxJyxcblx0XHRcdHVzZURlZmF1bHRBdXRoOiB0cnVlLFxuXHRcdFx0cHJldHR5SnNvbjogcHJvY2Vzcy5lbnYuTk9ERV9FTlYgPT09ICdkZXZlbG9wbWVudCcsXG5cdFx0XHRlbmFibGVDb3JzLFxuXHRcdFx0YXV0aDogZ2V0VXNlckF1dGgoKVxuXHRcdH0pO1xuXHR9XG5cblx0aWYgKCFSb2NrZXRDaGF0LkFQSS5kZWZhdWx0IHx8IFJvY2tldENoYXQuQVBJLmRlZmF1bHQuX2NvbmZpZy5lbmFibGVDb3JzICE9PSBlbmFibGVDb3JzKSB7XG5cdFx0Um9ja2V0Q2hhdC5BUEkuZGVmYXVsdCA9IG5ldyBBUEkoe1xuXHRcdFx0dXNlRGVmYXVsdEF1dGg6IHRydWUsXG5cdFx0XHRwcmV0dHlKc29uOiBwcm9jZXNzLmVudi5OT0RFX0VOViA9PT0gJ2RldmVsb3BtZW50Jyxcblx0XHRcdGVuYWJsZUNvcnMsXG5cdFx0XHRhdXRoOiBnZXRVc2VyQXV0aCgpXG5cdFx0fSk7XG5cdH1cbn07XG5cbi8vIHJlZ2lzdGVyIHRoZSBBUEkgdG8gYmUgcmUtY3JlYXRlZCBvbmNlIHRoZSBDT1JTLXNldHRpbmcgY2hhbmdlcy5cblJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdBUElfRW5hYmxlX0NPUlMnLCAoa2V5LCB2YWx1ZSkgPT4ge1xuXHRjcmVhdGVBcGkodmFsdWUpO1xufSk7XG5cbi8vIGFsc28gY3JlYXRlIHRoZSBBUEkgaW1tZWRpYXRlbHlcbmNyZWF0ZUFwaSghIVJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdBUElfRW5hYmxlX0NPUlMnKSk7XG4iLCJSb2NrZXRDaGF0LnNldHRpbmdzLmFkZEdyb3VwKCdHZW5lcmFsJywgZnVuY3Rpb24oKSB7XG5cdHRoaXMuc2VjdGlvbignUkVTVCBBUEknLCBmdW5jdGlvbigpIHtcblx0XHR0aGlzLmFkZCgnQVBJX1VwcGVyX0NvdW50X0xpbWl0JywgMTAwLCB7IHR5cGU6ICdpbnQnLCBwdWJsaWM6IGZhbHNlIH0pO1xuXHRcdHRoaXMuYWRkKCdBUElfRGVmYXVsdF9Db3VudCcsIDUwLCB7IHR5cGU6ICdpbnQnLCBwdWJsaWM6IGZhbHNlIH0pO1xuXHRcdHRoaXMuYWRkKCdBUElfQWxsb3dfSW5maW5pdGVfQ291bnQnLCB0cnVlLCB7IHR5cGU6ICdib29sZWFuJywgcHVibGljOiBmYWxzZSB9KTtcblx0XHR0aGlzLmFkZCgnQVBJX0VuYWJsZV9EaXJlY3RfTWVzc2FnZV9IaXN0b3J5X0VuZFBvaW50JywgZmFsc2UsIHsgdHlwZTogJ2Jvb2xlYW4nLCBwdWJsaWM6IGZhbHNlIH0pO1xuXHRcdHRoaXMuYWRkKCdBUElfRW5hYmxlX1NoaWVsZHMnLCB0cnVlLCB7IHR5cGU6ICdib29sZWFuJywgcHVibGljOiBmYWxzZSB9KTtcblx0XHR0aGlzLmFkZCgnQVBJX1NoaWVsZF9UeXBlcycsICcqJywgeyB0eXBlOiAnc3RyaW5nJywgcHVibGljOiBmYWxzZSwgZW5hYmxlUXVlcnk6IHsgX2lkOiAnQVBJX0VuYWJsZV9TaGllbGRzJywgdmFsdWU6IHRydWUgfSB9KTtcblx0XHR0aGlzLmFkZCgnQVBJX0VuYWJsZV9DT1JTJywgZmFsc2UsIHsgdHlwZTogJ2Jvb2xlYW4nLCBwdWJsaWM6IGZhbHNlIH0pO1xuXHRcdHRoaXMuYWRkKCdBUElfQ09SU19PcmlnaW4nLCAnKicsIHsgdHlwZTogJ3N0cmluZycsIHB1YmxpYzogZmFsc2UsIGVuYWJsZVF1ZXJ5OiB7IF9pZDogJ0FQSV9FbmFibGVfQ09SUycsIHZhbHVlOiB0cnVlIH0gfSk7XG5cdH0pO1xufSk7XG4iLCJSb2NrZXRDaGF0LkFQSS5oZWxwZXJNZXRob2RzLnNldCgncmVxdWVzdFBhcmFtcycsIGZ1bmN0aW9uIF9yZXF1ZXN0UGFyYW1zKCkge1xuXHRyZXR1cm4gWydQT1NUJywgJ1BVVCddLmluY2x1ZGVzKHRoaXMucmVxdWVzdC5tZXRob2QpID8gdGhpcy5ib2R5UGFyYW1zIDogdGhpcy5xdWVyeVBhcmFtcztcbn0pO1xuIiwiLy8gSWYgdGhlIGNvdW50IHF1ZXJ5IHBhcmFtIGlzIGhpZ2hlciB0aGFuIHRoZSBcIkFQSV9VcHBlcl9Db3VudF9MaW1pdFwiIHNldHRpbmcsIHRoZW4gd2UgbGltaXQgdGhhdFxuLy8gSWYgdGhlIGNvdW50IHF1ZXJ5IHBhcmFtIGlzbid0IGRlZmluZWQsIHRoZW4gd2Ugc2V0IGl0IHRvIHRoZSBcIkFQSV9EZWZhdWx0X0NvdW50XCIgc2V0dGluZ1xuLy8gSWYgdGhlIGNvdW50IGlzIHplcm8sIHRoZW4gdGhhdCBtZWFucyB1bmxpbWl0ZWQgYW5kIGlzIG9ubHkgYWxsb3dlZCBpZiB0aGUgc2V0dGluZyBcIkFQSV9BbGxvd19JbmZpbml0ZV9Db3VudFwiIGlzIHRydWVcblxuUm9ja2V0Q2hhdC5BUEkuaGVscGVyTWV0aG9kcy5zZXQoJ2dldFBhZ2luYXRpb25JdGVtcycsIGZ1bmN0aW9uIF9nZXRQYWdpbmF0aW9uSXRlbXMoKSB7XG5cdGNvbnN0IGhhcmRVcHBlckxpbWl0ID0gUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0FQSV9VcHBlcl9Db3VudF9MaW1pdCcpIDw9IDAgPyAxMDAgOiBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnQVBJX1VwcGVyX0NvdW50X0xpbWl0Jyk7XG5cdGNvbnN0IGRlZmF1bHRDb3VudCA9IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdBUElfRGVmYXVsdF9Db3VudCcpIDw9IDAgPyA1MCA6IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdBUElfRGVmYXVsdF9Db3VudCcpO1xuXHRjb25zdCBvZmZzZXQgPSB0aGlzLnF1ZXJ5UGFyYW1zLm9mZnNldCA/IHBhcnNlSW50KHRoaXMucXVlcnlQYXJhbXMub2Zmc2V0KSA6IDA7XG5cdGxldCBjb3VudCA9IGRlZmF1bHRDb3VudDtcblxuXHQvLyBFbnN1cmUgY291bnQgaXMgYW4gYXBwcm9waWF0ZSBhbW91bnRcblx0aWYgKHR5cGVvZiB0aGlzLnF1ZXJ5UGFyYW1zLmNvdW50ICE9PSAndW5kZWZpbmVkJykge1xuXHRcdGNvdW50ID0gcGFyc2VJbnQodGhpcy5xdWVyeVBhcmFtcy5jb3VudCk7XG5cdH0gZWxzZSB7XG5cdFx0Y291bnQgPSBkZWZhdWx0Q291bnQ7XG5cdH1cblxuXHRpZiAoY291bnQgPiBoYXJkVXBwZXJMaW1pdCkge1xuXHRcdGNvdW50ID0gaGFyZFVwcGVyTGltaXQ7XG5cdH1cblxuXHRpZiAoY291bnQgPT09IDAgJiYgIVJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdBUElfQWxsb3dfSW5maW5pdGVfQ291bnQnKSkge1xuXHRcdGNvdW50ID0gZGVmYXVsdENvdW50O1xuXHR9XG5cblx0cmV0dXJuIHtcblx0XHRvZmZzZXQsXG5cdFx0Y291bnRcblx0fTtcbn0pO1xuIiwiLy9Db252ZW5pZW5jZSBtZXRob2QsIGFsbW9zdCBuZWVkIHRvIHR1cm4gaXQgaW50byBhIG1pZGRsZXdhcmUgb2Ygc29ydHNcblJvY2tldENoYXQuQVBJLmhlbHBlck1ldGhvZHMuc2V0KCdnZXRVc2VyRnJvbVBhcmFtcycsIGZ1bmN0aW9uIF9nZXRVc2VyRnJvbVBhcmFtcygpIHtcblx0Y29uc3QgZG9lc250RXhpc3QgPSB7IF9kb2VzbnRFeGlzdDogdHJ1ZSB9O1xuXHRsZXQgdXNlcjtcblx0Y29uc3QgcGFyYW1zID0gdGhpcy5yZXF1ZXN0UGFyYW1zKCk7XG5cblx0aWYgKHBhcmFtcy51c2VySWQgJiYgcGFyYW1zLnVzZXJJZC50cmltKCkpIHtcblx0XHR1c2VyID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZE9uZUJ5SWQocGFyYW1zLnVzZXJJZCkgfHwgZG9lc250RXhpc3Q7XG5cdH0gZWxzZSBpZiAocGFyYW1zLnVzZXJuYW1lICYmIHBhcmFtcy51c2VybmFtZS50cmltKCkpIHtcblx0XHR1c2VyID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZE9uZUJ5VXNlcm5hbWUocGFyYW1zLnVzZXJuYW1lKSB8fCBkb2VzbnRFeGlzdDtcblx0fSBlbHNlIGlmIChwYXJhbXMudXNlciAmJiBwYXJhbXMudXNlci50cmltKCkpIHtcblx0XHR1c2VyID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZE9uZUJ5VXNlcm5hbWUocGFyYW1zLnVzZXIpIHx8IGRvZXNudEV4aXN0O1xuXHR9IGVsc2Uge1xuXHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLXVzZXItcGFyYW0tbm90LXByb3ZpZGVkJywgJ1RoZSByZXF1aXJlZCBcInVzZXJJZFwiIG9yIFwidXNlcm5hbWVcIiBwYXJhbSB3YXMgbm90IHByb3ZpZGVkJyk7XG5cdH1cblxuXHRpZiAodXNlci5fZG9lc250RXhpc3QpIHtcblx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLXVzZXInLCAnVGhlIHJlcXVpcmVkIFwidXNlcklkXCIgb3IgXCJ1c2VybmFtZVwiIHBhcmFtIHByb3ZpZGVkIGRvZXMgbm90IG1hdGNoIGFueSB1c2VycycpO1xuXHR9XG5cblx0cmV0dXJuIHVzZXI7XG59KTtcbiIsIlJvY2tldENoYXQuQVBJLmhlbHBlck1ldGhvZHMuc2V0KCdpc1VzZXJGcm9tUGFyYW1zJywgZnVuY3Rpb24gX2lzVXNlckZyb21QYXJhbXMoKSB7XG5cdGNvbnN0IHBhcmFtcyA9IHRoaXMucmVxdWVzdFBhcmFtcygpO1xuXG5cdHJldHVybiAoIXBhcmFtcy51c2VySWQgJiYgIXBhcmFtcy51c2VybmFtZSAmJiAhcGFyYW1zLnVzZXIpIHx8XG5cdFx0KHBhcmFtcy51c2VySWQgJiYgdGhpcy51c2VySWQgPT09IHBhcmFtcy51c2VySWQpIHx8XG5cdFx0KHBhcmFtcy51c2VybmFtZSAmJiB0aGlzLnVzZXIudXNlcm5hbWUgPT09IHBhcmFtcy51c2VybmFtZSkgfHxcblx0XHQocGFyYW1zLnVzZXIgJiYgdGhpcy51c2VyLnVzZXJuYW1lID09PSBwYXJhbXMudXNlcik7XG59KTtcbiIsIlJvY2tldENoYXQuQVBJLmhlbHBlck1ldGhvZHMuc2V0KCdwYXJzZUpzb25RdWVyeScsIGZ1bmN0aW9uIF9wYXJzZUpzb25RdWVyeSgpIHtcblx0bGV0IHNvcnQ7XG5cdGlmICh0aGlzLnF1ZXJ5UGFyYW1zLnNvcnQpIHtcblx0XHR0cnkge1xuXHRcdFx0c29ydCA9IEpTT04ucGFyc2UodGhpcy5xdWVyeVBhcmFtcy5zb3J0KTtcblx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHR0aGlzLmxvZ2dlci53YXJuKGBJbnZhbGlkIHNvcnQgcGFyYW1ldGVyIHByb3ZpZGVkIFwiJHsgdGhpcy5xdWVyeVBhcmFtcy5zb3J0IH1cIjpgLCBlKTtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWludmFsaWQtc29ydCcsIGBJbnZhbGlkIHNvcnQgcGFyYW1ldGVyIHByb3ZpZGVkOiBcIiR7IHRoaXMucXVlcnlQYXJhbXMuc29ydCB9XCJgLCB7IGhlbHBlck1ldGhvZDogJ3BhcnNlSnNvblF1ZXJ5JyB9KTtcblx0XHR9XG5cdH1cblxuXHRsZXQgZmllbGRzO1xuXHRpZiAodGhpcy5xdWVyeVBhcmFtcy5maWVsZHMpIHtcblx0XHR0cnkge1xuXHRcdFx0ZmllbGRzID0gSlNPTi5wYXJzZSh0aGlzLnF1ZXJ5UGFyYW1zLmZpZWxkcyk7XG5cdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0dGhpcy5sb2dnZXIud2FybihgSW52YWxpZCBmaWVsZHMgcGFyYW1ldGVyIHByb3ZpZGVkIFwiJHsgdGhpcy5xdWVyeVBhcmFtcy5maWVsZHMgfVwiOmAsIGUpO1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItaW52YWxpZC1maWVsZHMnLCBgSW52YWxpZCBmaWVsZHMgcGFyYW1ldGVyIHByb3ZpZGVkOiBcIiR7IHRoaXMucXVlcnlQYXJhbXMuZmllbGRzIH1cImAsIHsgaGVscGVyTWV0aG9kOiAncGFyc2VKc29uUXVlcnknIH0pO1xuXHRcdH1cblx0fVxuXG5cdC8vIFZlcmlmeSB0aGUgdXNlcidzIHNlbGVjdGVkIGZpZWxkcyBvbmx5IGNvbnRhaW5zIG9uZXMgd2hpY2ggdGhlaXIgcm9sZSBhbGxvd3Ncblx0aWYgKHR5cGVvZiBmaWVsZHMgPT09ICdvYmplY3QnKSB7XG5cdFx0bGV0IG5vblNlbGVjdGFibGVGaWVsZHMgPSBPYmplY3Qua2V5cyhSb2NrZXRDaGF0LkFQSS52MS5kZWZhdWx0RmllbGRzVG9FeGNsdWRlKTtcblx0XHRpZiAoIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih0aGlzLnVzZXJJZCwgJ3ZpZXctZnVsbC1vdGhlci11c2VyLWluZm8nKSAmJiB0aGlzLnJlcXVlc3Qucm91dGUuaW5jbHVkZXMoJy92MS91c2Vycy4nKSkge1xuXHRcdFx0bm9uU2VsZWN0YWJsZUZpZWxkcyA9IG5vblNlbGVjdGFibGVGaWVsZHMuY29uY2F0KE9iamVjdC5rZXlzKFJvY2tldENoYXQuQVBJLnYxLmxpbWl0ZWRVc2VyRmllbGRzVG9FeGNsdWRlKSk7XG5cdFx0fVxuXG5cdFx0T2JqZWN0LmtleXMoZmllbGRzKS5mb3JFYWNoKChrKSA9PiB7XG5cdFx0XHRpZiAobm9uU2VsZWN0YWJsZUZpZWxkcy5pbmNsdWRlcyhrKSB8fCBub25TZWxlY3RhYmxlRmllbGRzLmluY2x1ZGVzKGsuc3BsaXQoUm9ja2V0Q2hhdC5BUEkudjEuZmllbGRTZXBhcmF0b3IpWzBdKSkge1xuXHRcdFx0XHRkZWxldGUgZmllbGRzW2tdO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHR9XG5cblx0Ly8gTGltaXQgdGhlIGZpZWxkcyBieSBkZWZhdWx0XG5cdGZpZWxkcyA9IE9iamVjdC5hc3NpZ24oe30sIGZpZWxkcywgUm9ja2V0Q2hhdC5BUEkudjEuZGVmYXVsdEZpZWxkc1RvRXhjbHVkZSk7XG5cdGlmICghUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKHRoaXMudXNlcklkLCAndmlldy1mdWxsLW90aGVyLXVzZXItaW5mbycpICYmIHRoaXMucmVxdWVzdC5yb3V0ZS5pbmNsdWRlcygnL3YxL3VzZXJzLicpKSB7XG5cdFx0ZmllbGRzID0gT2JqZWN0LmFzc2lnbihmaWVsZHMsIFJvY2tldENoYXQuQVBJLnYxLmxpbWl0ZWRVc2VyRmllbGRzVG9FeGNsdWRlKTtcblx0fVxuXG5cdGxldCBxdWVyeTtcblx0aWYgKHRoaXMucXVlcnlQYXJhbXMucXVlcnkpIHtcblx0XHR0cnkge1xuXHRcdFx0cXVlcnkgPSBKU09OLnBhcnNlKHRoaXMucXVlcnlQYXJhbXMucXVlcnkpO1xuXHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdHRoaXMubG9nZ2VyLndhcm4oYEludmFsaWQgcXVlcnkgcGFyYW1ldGVyIHByb3ZpZGVkIFwiJHsgdGhpcy5xdWVyeVBhcmFtcy5xdWVyeSB9XCI6YCwgZSk7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLXF1ZXJ5JywgYEludmFsaWQgcXVlcnkgcGFyYW1ldGVyIHByb3ZpZGVkOiBcIiR7IHRoaXMucXVlcnlQYXJhbXMucXVlcnkgfVwiYCwgeyBoZWxwZXJNZXRob2Q6ICdwYXJzZUpzb25RdWVyeScgfSk7XG5cdFx0fVxuXHR9XG5cblx0Ly8gVmVyaWZ5IHRoZSB1c2VyIGhhcyBwZXJtaXNzaW9uIHRvIHF1ZXJ5IHRoZSBmaWVsZHMgdGhleSBhcmVcblx0aWYgKHR5cGVvZiBxdWVyeSA9PT0gJ29iamVjdCcpIHtcblx0XHRsZXQgbm9uUXVlcmFibGVGaWVsZHMgPSBPYmplY3Qua2V5cyhSb2NrZXRDaGF0LkFQSS52MS5kZWZhdWx0RmllbGRzVG9FeGNsdWRlKTtcblx0XHRpZiAoIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih0aGlzLnVzZXJJZCwgJ3ZpZXctZnVsbC1vdGhlci11c2VyLWluZm8nKSAmJiB0aGlzLnJlcXVlc3Qucm91dGUuaW5jbHVkZXMoJy92MS91c2Vycy4nKSkge1xuXHRcdFx0bm9uUXVlcmFibGVGaWVsZHMgPSBub25RdWVyYWJsZUZpZWxkcy5jb25jYXQoT2JqZWN0LmtleXMoUm9ja2V0Q2hhdC5BUEkudjEubGltaXRlZFVzZXJGaWVsZHNUb0V4Y2x1ZGUpKTtcblx0XHR9XG5cblx0XHRPYmplY3Qua2V5cyhxdWVyeSkuZm9yRWFjaCgoaykgPT4ge1xuXHRcdFx0aWYgKG5vblF1ZXJhYmxlRmllbGRzLmluY2x1ZGVzKGspIHx8IG5vblF1ZXJhYmxlRmllbGRzLmluY2x1ZGVzKGsuc3BsaXQoUm9ja2V0Q2hhdC5BUEkudjEuZmllbGRTZXBhcmF0b3IpWzBdKSkge1xuXHRcdFx0XHRkZWxldGUgcXVlcnlba107XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH1cblxuXHRyZXR1cm4ge1xuXHRcdHNvcnQsXG5cdFx0ZmllbGRzLFxuXHRcdHF1ZXJ5XG5cdH07XG59KTtcbiIsIlJvY2tldENoYXQuQVBJLmhlbHBlck1ldGhvZHMuc2V0KCdkZXByZWNhdGlvbldhcm5pbmcnLCBmdW5jdGlvbiBfZGVwcmVjYXRpb25XYXJuaW5nKHsgZW5kcG9pbnQsIHZlcnNpb25XaWxsQmVSZW1vdmUsIHJlc3BvbnNlIH0pIHtcblx0Y29uc3Qgd2FybmluZ01lc3NhZ2UgPSBgVGhlIGVuZHBvaW50IFwiJHsgZW5kcG9pbnQgfVwiIGlzIGRlcHJlY2F0ZWQgYW5kIHdpbGwgYmUgcmVtb3ZlZCBhZnRlciB2ZXJzaW9uICR7IHZlcnNpb25XaWxsQmVSZW1vdmUgfWA7XG5cdGNvbnNvbGUud2Fybih3YXJuaW5nTWVzc2FnZSk7XG5cdGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViA9PT0gJ2RldmVsb3BtZW50Jykge1xuXHRcdHJldHVybiB7XG5cdFx0XHR3YXJuaW5nOiB3YXJuaW5nTWVzc2FnZSxcblx0XHRcdC4uLnJlc3BvbnNlXG5cdFx0fTtcblx0fVxuXG5cdHJldHVybiByZXNwb25zZTtcbn0pO1xuXG4iLCJSb2NrZXRDaGF0LkFQSS5oZWxwZXJNZXRob2RzLnNldCgnZ2V0TG9nZ2VkSW5Vc2VyJywgZnVuY3Rpb24gX2dldExvZ2dlZEluVXNlcigpIHtcblx0bGV0IHVzZXI7XG5cblx0aWYgKHRoaXMucmVxdWVzdC5oZWFkZXJzWyd4LWF1dGgtdG9rZW4nXSAmJiB0aGlzLnJlcXVlc3QuaGVhZGVyc1sneC11c2VyLWlkJ10pIHtcblx0XHR1c2VyID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZE9uZSh7XG5cdFx0XHQnX2lkJzogdGhpcy5yZXF1ZXN0LmhlYWRlcnNbJ3gtdXNlci1pZCddLFxuXHRcdFx0J3NlcnZpY2VzLnJlc3VtZS5sb2dpblRva2Vucy5oYXNoZWRUb2tlbic6IEFjY291bnRzLl9oYXNoTG9naW5Ub2tlbih0aGlzLnJlcXVlc3QuaGVhZGVyc1sneC1hdXRoLXRva2VuJ10pXG5cdFx0fSk7XG5cdH1cblxuXHRyZXR1cm4gdXNlcjtcbn0pO1xuIiwiUm9ja2V0Q2hhdC5BUEkuaGVscGVyTWV0aG9kcy5zZXQoJ2luc2VydFVzZXJPYmplY3QnLCBmdW5jdGlvbiBfYWRkVXNlclRvT2JqZWN0KHsgb2JqZWN0LCB1c2VySWQgfSkge1xuXHRjb25zdCB7IHVzZXJuYW1lLCBuYW1lIH0gPSBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kT25lQnlJZCh1c2VySWQpO1xuXG5cdG9iamVjdC51c2VyID0ge1xuXHRcdF9pZDogdXNlcklkLFxuXHRcdHVzZXJuYW1lLFxuXHRcdG5hbWVcblx0fTtcblxuXHRyZXR1cm4gb2JqZWN0O1xufSk7XG5cbiIsIlJvY2tldENoYXQuQVBJLmRlZmF1bHQuYWRkUm91dGUoJ2luZm8nLCB7IGF1dGhSZXF1aXJlZDogZmFsc2UgfSwge1xuXHRnZXQoKSB7XG5cdFx0Y29uc3QgdXNlciA9IHRoaXMuZ2V0TG9nZ2VkSW5Vc2VyKCk7XG5cblx0XHRpZiAodXNlciAmJiBSb2NrZXRDaGF0LmF1dGh6Lmhhc1JvbGUodXNlci5faWQsICdhZG1pbicpKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7XG5cdFx0XHRcdGluZm86IFJvY2tldENoYXQuSW5mb1xuXHRcdFx0fSk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0dmVyc2lvbjogUm9ja2V0Q2hhdC5JbmZvLnZlcnNpb25cblx0XHR9KTtcblx0fVxufSk7XG4iLCJSb2NrZXRDaGF0LkFQSS5kZWZhdWx0LmFkZFJvdXRlKCdtZXRyaWNzJywgeyBhdXRoUmVxdWlyZWQ6IGZhbHNlIH0sIHtcblx0Z2V0KCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHRoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAndGV4dC9wbGFpbicgfSxcblx0XHRcdGJvZHk6IFJvY2tldENoYXQucHJvbWNsaWVudC5yZWdpc3Rlci5tZXRyaWNzKClcblx0XHR9O1xuXHR9XG59KTtcbiIsImltcG9ydCBfIGZyb20gJ3VuZGVyc2NvcmUnO1xuXG4vL1JldHVybnMgdGhlIGNoYW5uZWwgSUYgZm91bmQgb3RoZXJ3aXNlIGl0IHdpbGwgcmV0dXJuIHRoZSBmYWlsdXJlIG9mIHdoeSBpdCBkaWRuJ3QuIENoZWNrIHRoZSBgc3RhdHVzQ29kZWAgcHJvcGVydHlcbmZ1bmN0aW9uIGZpbmRDaGFubmVsQnlJZE9yTmFtZSh7IHBhcmFtcywgY2hlY2tlZEFyY2hpdmVkID0gdHJ1ZSwgcmV0dXJuVXNlcm5hbWVzID0gZmFsc2UgfSkge1xuXHRpZiAoKCFwYXJhbXMucm9vbUlkIHx8ICFwYXJhbXMucm9vbUlkLnRyaW0oKSkgJiYgKCFwYXJhbXMucm9vbU5hbWUgfHwgIXBhcmFtcy5yb29tTmFtZS50cmltKCkpKSB7XG5cdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3Itcm9vbWlkLXBhcmFtLW5vdC1wcm92aWRlZCcsICdUaGUgcGFyYW1ldGVyIFwicm9vbUlkXCIgb3IgXCJyb29tTmFtZVwiIGlzIHJlcXVpcmVkJyk7XG5cdH1cblxuXHRjb25zdCBmaWVsZHMgPSB7IC4uLlJvY2tldENoYXQuQVBJLnYxLmRlZmF1bHRGaWVsZHNUb0V4Y2x1ZGUgfTtcblx0aWYgKHJldHVyblVzZXJuYW1lcykge1xuXHRcdGRlbGV0ZSBmaWVsZHMudXNlcm5hbWVzO1xuXHR9XG5cblx0bGV0IHJvb207XG5cdGlmIChwYXJhbXMucm9vbUlkKSB7XG5cdFx0cm9vbSA9IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRPbmVCeUlkKHBhcmFtcy5yb29tSWQsIHsgZmllbGRzIH0pO1xuXHR9IGVsc2UgaWYgKHBhcmFtcy5yb29tTmFtZSkge1xuXHRcdHJvb20gPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT25lQnlOYW1lKHBhcmFtcy5yb29tTmFtZSwgeyBmaWVsZHMgfSk7XG5cdH1cblxuXHRpZiAoIXJvb20gfHwgcm9vbS50ICE9PSAnYycpIHtcblx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1yb29tLW5vdC1mb3VuZCcsICdUaGUgcmVxdWlyZWQgXCJyb29tSWRcIiBvciBcInJvb21OYW1lXCIgcGFyYW0gcHJvdmlkZWQgZG9lcyBub3QgbWF0Y2ggYW55IGNoYW5uZWwnKTtcblx0fVxuXG5cdGlmIChjaGVja2VkQXJjaGl2ZWQgJiYgcm9vbS5hcmNoaXZlZCkge1xuXHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLXJvb20tYXJjaGl2ZWQnLCBgVGhlIGNoYW5uZWwsICR7IHJvb20ubmFtZSB9LCBpcyBhcmNoaXZlZGApO1xuXHR9XG5cblx0cmV0dXJuIHJvb207XG59XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdjaGFubmVscy5hZGRBbGwnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdHBvc3QoKSB7XG5cdFx0Y29uc3QgZmluZFJlc3VsdCA9IGZpbmRDaGFubmVsQnlJZE9yTmFtZSh7IHBhcmFtczogdGhpcy5yZXF1ZXN0UGFyYW1zKCkgfSk7XG5cblx0XHRNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PiB7XG5cdFx0XHRNZXRlb3IuY2FsbCgnYWRkQWxsVXNlclRvUm9vbScsIGZpbmRSZXN1bHQuX2lkLCB0aGlzLmJvZHlQYXJhbXMuYWN0aXZlVXNlcnNPbmx5KTtcblx0XHR9KTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdGNoYW5uZWw6IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRPbmVCeUlkKGZpbmRSZXN1bHQuX2lkLCB7IGZpZWxkczogUm9ja2V0Q2hhdC5BUEkudjEuZGVmYXVsdEZpZWxkc1RvRXhjbHVkZSB9KVxuXHRcdH0pO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2NoYW5uZWxzLmFkZE1vZGVyYXRvcicsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdCgpIHtcblx0XHRjb25zdCBmaW5kUmVzdWx0ID0gZmluZENoYW5uZWxCeUlkT3JOYW1lKHsgcGFyYW1zOiB0aGlzLnJlcXVlc3RQYXJhbXMoKSB9KTtcblxuXHRcdGNvbnN0IHVzZXIgPSB0aGlzLmdldFVzZXJGcm9tUGFyYW1zKCk7XG5cblx0XHRNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PiB7XG5cdFx0XHRNZXRlb3IuY2FsbCgnYWRkUm9vbU1vZGVyYXRvcicsIGZpbmRSZXN1bHQuX2lkLCB1c2VyLl9pZCk7XG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2VzcygpO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2NoYW5uZWxzLmFkZE93bmVyJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRwb3N0KCkge1xuXHRcdGNvbnN0IGZpbmRSZXN1bHQgPSBmaW5kQ2hhbm5lbEJ5SWRPck5hbWUoeyBwYXJhbXM6IHRoaXMucmVxdWVzdFBhcmFtcygpIH0pO1xuXG5cdFx0Y29uc3QgdXNlciA9IHRoaXMuZ2V0VXNlckZyb21QYXJhbXMoKTtcblxuXHRcdE1ldGVvci5ydW5Bc1VzZXIodGhpcy51c2VySWQsICgpID0+IHtcblx0XHRcdE1ldGVvci5jYWxsKCdhZGRSb29tT3duZXInLCBmaW5kUmVzdWx0Ll9pZCwgdXNlci5faWQpO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoKTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdjaGFubmVscy5hcmNoaXZlJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRwb3N0KCkge1xuXHRcdGNvbnN0IGZpbmRSZXN1bHQgPSBmaW5kQ2hhbm5lbEJ5SWRPck5hbWUoeyBwYXJhbXM6IHRoaXMucmVxdWVzdFBhcmFtcygpIH0pO1xuXG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4ge1xuXHRcdFx0TWV0ZW9yLmNhbGwoJ2FyY2hpdmVSb29tJywgZmluZFJlc3VsdC5faWQpO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoKTtcblx0fVxufSk7XG5cbi8qKlxuIERFUFJFQ0FURURcbiAvLyBUT0RPOiBSZW1vdmUgdGhpcyBhZnRlciB0aHJlZSB2ZXJzaW9ucyBoYXZlIGJlZW4gcmVsZWFzZWQuIFRoYXQgbWVhbnMgYXQgMC42NyB0aGlzIHNob3VsZCBiZSBnb25lLlxuICoqL1xuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2NoYW5uZWxzLmNsZWFuSGlzdG9yeScsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdCgpIHtcblx0XHRjb25zdCBmaW5kUmVzdWx0ID0gZmluZENoYW5uZWxCeUlkT3JOYW1lKHsgcGFyYW1zOiB0aGlzLnJlcXVlc3RQYXJhbXMoKSB9KTtcblxuXHRcdGlmICghdGhpcy5ib2R5UGFyYW1zLmxhdGVzdCkge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoJ0JvZHkgcGFyYW1ldGVyIFwibGF0ZXN0XCIgaXMgcmVxdWlyZWQuJyk7XG5cdFx0fVxuXG5cdFx0aWYgKCF0aGlzLmJvZHlQYXJhbXMub2xkZXN0KSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgnQm9keSBwYXJhbWV0ZXIgXCJvbGRlc3RcIiBpcyByZXF1aXJlZC4nKTtcblx0XHR9XG5cblx0XHRjb25zdCBsYXRlc3QgPSBuZXcgRGF0ZSh0aGlzLmJvZHlQYXJhbXMubGF0ZXN0KTtcblx0XHRjb25zdCBvbGRlc3QgPSBuZXcgRGF0ZSh0aGlzLmJvZHlQYXJhbXMub2xkZXN0KTtcblxuXHRcdGxldCBpbmNsdXNpdmUgPSBmYWxzZTtcblx0XHRpZiAodHlwZW9mIHRoaXMuYm9keVBhcmFtcy5pbmNsdXNpdmUgIT09ICd1bmRlZmluZWQnKSB7XG5cdFx0XHRpbmNsdXNpdmUgPSB0aGlzLmJvZHlQYXJhbXMuaW5jbHVzaXZlO1xuXHRcdH1cblxuXHRcdE1ldGVvci5ydW5Bc1VzZXIodGhpcy51c2VySWQsICgpID0+IHtcblx0XHRcdE1ldGVvci5jYWxsKCdjbGVhbkNoYW5uZWxIaXN0b3J5JywgeyByb29tSWQ6IGZpbmRSZXN1bHQuX2lkLCBsYXRlc3QsIG9sZGVzdCwgaW5jbHVzaXZlIH0pO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3ModGhpcy5kZXByZWNhdGlvbldhcm5pbmcoe1xuXHRcdFx0ZW5kcG9pbnQ6ICdjaGFubmVscy5jbGVhbkhpc3RvcnknLFxuXHRcdFx0dmVyc2lvbldpbGxCZVJlbW92ZTogJ3YwLjY3J1xuXHRcdH0pKTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdjaGFubmVscy5jbG9zZScsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdCgpIHtcblx0XHRjb25zdCBmaW5kUmVzdWx0ID0gZmluZENoYW5uZWxCeUlkT3JOYW1lKHsgcGFyYW1zOiB0aGlzLnJlcXVlc3RQYXJhbXMoKSwgY2hlY2tlZEFyY2hpdmVkOiBmYWxzZSB9KTtcblxuXHRcdGNvbnN0IHN1YiA9IFJvY2tldENoYXQubW9kZWxzLlN1YnNjcmlwdGlvbnMuZmluZE9uZUJ5Um9vbUlkQW5kVXNlcklkKGZpbmRSZXN1bHQuX2lkLCB0aGlzLnVzZXJJZCk7XG5cblx0XHRpZiAoIXN1Yikge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoYFRoZSB1c2VyL2NhbGxlZSBpcyBub3QgaW4gdGhlIGNoYW5uZWwgXCIkeyBmaW5kUmVzdWx0Lm5hbWUgfS5gKTtcblx0XHR9XG5cblx0XHRpZiAoIXN1Yi5vcGVuKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZShgVGhlIGNoYW5uZWwsICR7IGZpbmRSZXN1bHQubmFtZSB9LCBpcyBhbHJlYWR5IGNsb3NlZCB0byB0aGUgc2VuZGVyYCk7XG5cdFx0fVxuXG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4ge1xuXHRcdFx0TWV0ZW9yLmNhbGwoJ2hpZGVSb29tJywgZmluZFJlc3VsdC5faWQpO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoKTtcblx0fVxufSk7XG5cbi8vIENoYW5uZWwgLT4gY3JlYXRlXG5cbmZ1bmN0aW9uIGNyZWF0ZUNoYW5uZWxWYWxpZGF0b3IocGFyYW1zKSB7XG5cdGlmICghUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKHBhcmFtcy51c2VyLnZhbHVlLCAnY3JlYXRlLWMnKSkge1xuXHRcdHRocm93IG5ldyBFcnJvcigndW5hdXRob3JpemVkJyk7XG5cdH1cblxuXHRpZiAoIXBhcmFtcy5uYW1lIHx8ICFwYXJhbXMubmFtZS52YWx1ZSkge1xuXHRcdHRocm93IG5ldyBFcnJvcihgUGFyYW0gXCIkeyBwYXJhbXMubmFtZS5rZXkgfVwiIGlzIHJlcXVpcmVkYCk7XG5cdH1cblxuXHRpZiAocGFyYW1zLm1lbWJlcnMgJiYgcGFyYW1zLm1lbWJlcnMudmFsdWUgJiYgIV8uaXNBcnJheShwYXJhbXMubWVtYmVycy52YWx1ZSkpIHtcblx0XHR0aHJvdyBuZXcgRXJyb3IoYFBhcmFtIFwiJHsgcGFyYW1zLm1lbWJlcnMua2V5IH1cIiBtdXN0IGJlIGFuIGFycmF5IGlmIHByb3ZpZGVkYCk7XG5cdH1cblxuXHRpZiAocGFyYW1zLmN1c3RvbUZpZWxkcyAmJiBwYXJhbXMuY3VzdG9tRmllbGRzLnZhbHVlICYmICEodHlwZW9mIHBhcmFtcy5jdXN0b21GaWVsZHMudmFsdWUgPT09ICdvYmplY3QnKSkge1xuXHRcdHRocm93IG5ldyBFcnJvcihgUGFyYW0gXCIkeyBwYXJhbXMuY3VzdG9tRmllbGRzLmtleSB9XCIgbXVzdCBiZSBhbiBvYmplY3QgaWYgcHJvdmlkZWRgKTtcblx0fVxufVxuXG5mdW5jdGlvbiBjcmVhdGVDaGFubmVsKHVzZXJJZCwgcGFyYW1zKSB7XG5cdGxldCByZWFkT25seSA9IGZhbHNlO1xuXHRpZiAodHlwZW9mIHBhcmFtcy5yZWFkT25seSAhPT0gJ3VuZGVmaW5lZCcpIHtcblx0XHRyZWFkT25seSA9IHBhcmFtcy5yZWFkT25seTtcblx0fVxuXG5cdGxldCBpZDtcblx0TWV0ZW9yLnJ1bkFzVXNlcih1c2VySWQsICgpID0+IHtcblx0XHRpZCA9IE1ldGVvci5jYWxsKCdjcmVhdGVDaGFubmVsJywgcGFyYW1zLm5hbWUsIHBhcmFtcy5tZW1iZXJzID8gcGFyYW1zLm1lbWJlcnMgOiBbXSwgcmVhZE9ubHksIHBhcmFtcy5jdXN0b21GaWVsZHMpO1xuXHR9KTtcblxuXHRyZXR1cm4ge1xuXHRcdGNoYW5uZWw6IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRPbmVCeUlkKGlkLnJpZCwgeyBmaWVsZHM6IFJvY2tldENoYXQuQVBJLnYxLmRlZmF1bHRGaWVsZHNUb0V4Y2x1ZGUgfSlcblx0fTtcbn1cblxuUm9ja2V0Q2hhdC5BUEkuY2hhbm5lbHMgPSB7fTtcblJvY2tldENoYXQuQVBJLmNoYW5uZWxzLmNyZWF0ZSA9IHtcblx0dmFsaWRhdGU6IGNyZWF0ZUNoYW5uZWxWYWxpZGF0b3IsXG5cdGV4ZWN1dGU6IGNyZWF0ZUNoYW5uZWxcbn07XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdjaGFubmVscy5jcmVhdGUnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdHBvc3QoKSB7XG5cdFx0Y29uc3QgdXNlcklkID0gdGhpcy51c2VySWQ7XG5cdFx0Y29uc3QgYm9keVBhcmFtcyA9IHRoaXMuYm9keVBhcmFtcztcblxuXHRcdGxldCBlcnJvcjtcblxuXHRcdHRyeSB7XG5cdFx0XHRSb2NrZXRDaGF0LkFQSS5jaGFubmVscy5jcmVhdGUudmFsaWRhdGUoe1xuXHRcdFx0XHR1c2VyOiB7XG5cdFx0XHRcdFx0dmFsdWU6IHVzZXJJZFxuXHRcdFx0XHR9LFxuXHRcdFx0XHRuYW1lOiB7XG5cdFx0XHRcdFx0dmFsdWU6IGJvZHlQYXJhbXMubmFtZSxcblx0XHRcdFx0XHRrZXk6ICduYW1lJ1xuXHRcdFx0XHR9LFxuXHRcdFx0XHRtZW1iZXJzOiB7XG5cdFx0XHRcdFx0dmFsdWU6IGJvZHlQYXJhbXMubWVtYmVycyxcblx0XHRcdFx0XHRrZXk6ICdtZW1iZXJzJ1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRpZiAoZS5tZXNzYWdlID09PSAndW5hdXRob3JpemVkJykge1xuXHRcdFx0XHRlcnJvciA9IFJvY2tldENoYXQuQVBJLnYxLnVuYXV0aG9yaXplZCgpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0ZXJyb3IgPSBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKGUubWVzc2FnZSk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0aWYgKGVycm9yKSB7XG5cdFx0XHRyZXR1cm4gZXJyb3I7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoUm9ja2V0Q2hhdC5BUEkuY2hhbm5lbHMuY3JlYXRlLmV4ZWN1dGUodXNlcklkLCBib2R5UGFyYW1zKSk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnY2hhbm5lbHMuZGVsZXRlJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRwb3N0KCkge1xuXHRcdGNvbnN0IGZpbmRSZXN1bHQgPSBmaW5kQ2hhbm5lbEJ5SWRPck5hbWUoeyBwYXJhbXM6IHRoaXMucmVxdWVzdFBhcmFtcygpLCBjaGVja2VkQXJjaGl2ZWQ6IGZhbHNlIH0pO1xuXG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4ge1xuXHRcdFx0TWV0ZW9yLmNhbGwoJ2VyYXNlUm9vbScsIGZpbmRSZXN1bHQuX2lkKTtcblx0XHR9KTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdGNoYW5uZWw6IGZpbmRSZXN1bHRcblx0XHR9KTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdjaGFubmVscy5maWxlcycsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0Z2V0KCkge1xuXHRcdGNvbnN0IGZpbmRSZXN1bHQgPSBmaW5kQ2hhbm5lbEJ5SWRPck5hbWUoeyBwYXJhbXM6IHRoaXMucmVxdWVzdFBhcmFtcygpLCBjaGVja2VkQXJjaGl2ZWQ6IGZhbHNlIH0pO1xuXHRcdGNvbnN0IGFkZFVzZXJPYmplY3RUb0V2ZXJ5T2JqZWN0ID0gKGZpbGUpID0+IHtcblx0XHRcdGlmIChmaWxlLnVzZXJJZCkge1xuXHRcdFx0XHRmaWxlID0gdGhpcy5pbnNlcnRVc2VyT2JqZWN0KHsgb2JqZWN0OiBmaWxlLCB1c2VySWQ6IGZpbGUudXNlcklkIH0pO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIGZpbGU7XG5cdFx0fTtcblxuXHRcdE1ldGVvci5ydW5Bc1VzZXIodGhpcy51c2VySWQsICgpID0+IHtcblx0XHRcdE1ldGVvci5jYWxsKCdjYW5BY2Nlc3NSb29tJywgZmluZFJlc3VsdC5faWQsIHRoaXMudXNlcklkKTtcblx0XHR9KTtcblxuXHRcdGNvbnN0IHsgb2Zmc2V0LCBjb3VudCB9ID0gdGhpcy5nZXRQYWdpbmF0aW9uSXRlbXMoKTtcblx0XHRjb25zdCB7IHNvcnQsIGZpZWxkcywgcXVlcnkgfSA9IHRoaXMucGFyc2VKc29uUXVlcnkoKTtcblxuXHRcdGNvbnN0IG91clF1ZXJ5ID0gT2JqZWN0LmFzc2lnbih7fSwgcXVlcnksIHsgcmlkOiBmaW5kUmVzdWx0Ll9pZCB9KTtcblxuXHRcdGNvbnN0IGZpbGVzID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXBsb2Fkcy5maW5kKG91clF1ZXJ5LCB7XG5cdFx0XHRzb3J0OiBzb3J0ID8gc29ydCA6IHsgbmFtZTogMSB9LFxuXHRcdFx0c2tpcDogb2Zmc2V0LFxuXHRcdFx0bGltaXQ6IGNvdW50LFxuXHRcdFx0ZmllbGRzXG5cdFx0fSkuZmV0Y2goKTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdGZpbGVzOiBmaWxlcy5tYXAoYWRkVXNlck9iamVjdFRvRXZlcnlPYmplY3QpLFxuXHRcdFx0Y291bnQ6XG5cdFx0XHRmaWxlcy5sZW5ndGgsXG5cdFx0XHRvZmZzZXQsXG5cdFx0XHR0b3RhbDogUm9ja2V0Q2hhdC5tb2RlbHMuVXBsb2Fkcy5maW5kKG91clF1ZXJ5KS5jb3VudCgpXG5cdFx0fSk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnY2hhbm5lbHMuZ2V0SW50ZWdyYXRpb25zJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRnZXQoKSB7XG5cdFx0aWYgKCFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odGhpcy51c2VySWQsICdtYW5hZ2UtaW50ZWdyYXRpb25zJykpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS51bmF1dGhvcml6ZWQoKTtcblx0XHR9XG5cblx0XHRjb25zdCBmaW5kUmVzdWx0ID0gZmluZENoYW5uZWxCeUlkT3JOYW1lKHsgcGFyYW1zOiB0aGlzLnJlcXVlc3RQYXJhbXMoKSwgY2hlY2tlZEFyY2hpdmVkOiBmYWxzZSB9KTtcblxuXHRcdGxldCBpbmNsdWRlQWxsUHVibGljQ2hhbm5lbHMgPSB0cnVlO1xuXHRcdGlmICh0eXBlb2YgdGhpcy5xdWVyeVBhcmFtcy5pbmNsdWRlQWxsUHVibGljQ2hhbm5lbHMgIT09ICd1bmRlZmluZWQnKSB7XG5cdFx0XHRpbmNsdWRlQWxsUHVibGljQ2hhbm5lbHMgPSB0aGlzLnF1ZXJ5UGFyYW1zLmluY2x1ZGVBbGxQdWJsaWNDaGFubmVscyA9PT0gJ3RydWUnO1xuXHRcdH1cblxuXHRcdGxldCBvdXJRdWVyeSA9IHtcblx0XHRcdGNoYW5uZWw6IGAjJHsgZmluZFJlc3VsdC5uYW1lIH1gXG5cdFx0fTtcblxuXHRcdGlmIChpbmNsdWRlQWxsUHVibGljQ2hhbm5lbHMpIHtcblx0XHRcdG91clF1ZXJ5LmNoYW5uZWwgPSB7XG5cdFx0XHRcdCRpbjogW291clF1ZXJ5LmNoYW5uZWwsICdhbGxfcHVibGljX2NoYW5uZWxzJ11cblx0XHRcdH07XG5cdFx0fVxuXG5cdFx0Y29uc3QgeyBvZmZzZXQsIGNvdW50IH0gPSB0aGlzLmdldFBhZ2luYXRpb25JdGVtcygpO1xuXHRcdGNvbnN0IHsgc29ydCwgZmllbGRzLCBxdWVyeSB9ID0gdGhpcy5wYXJzZUpzb25RdWVyeSgpO1xuXG5cdFx0b3VyUXVlcnkgPSBPYmplY3QuYXNzaWduKHt9LCBxdWVyeSwgb3VyUXVlcnkpO1xuXG5cdFx0Y29uc3QgaW50ZWdyYXRpb25zID0gUm9ja2V0Q2hhdC5tb2RlbHMuSW50ZWdyYXRpb25zLmZpbmQob3VyUXVlcnksIHtcblx0XHRcdHNvcnQ6IHNvcnQgPyBzb3J0IDogeyBfY3JlYXRlZEF0OiAxIH0sXG5cdFx0XHRza2lwOiBvZmZzZXQsXG5cdFx0XHRsaW1pdDogY291bnQsXG5cdFx0XHRmaWVsZHNcblx0XHR9KS5mZXRjaCgpO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0aW50ZWdyYXRpb25zLFxuXHRcdFx0Y291bnQ6IGludGVncmF0aW9ucy5sZW5ndGgsXG5cdFx0XHRvZmZzZXQsXG5cdFx0XHR0b3RhbDogUm9ja2V0Q2hhdC5tb2RlbHMuSW50ZWdyYXRpb25zLmZpbmQob3VyUXVlcnkpLmNvdW50KClcblx0XHR9KTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdjaGFubmVscy5oaXN0b3J5JywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRnZXQoKSB7XG5cdFx0Y29uc3QgZmluZFJlc3VsdCA9IGZpbmRDaGFubmVsQnlJZE9yTmFtZSh7IHBhcmFtczogdGhpcy5yZXF1ZXN0UGFyYW1zKCksIGNoZWNrZWRBcmNoaXZlZDogZmFsc2UgfSk7XG5cblx0XHRsZXQgbGF0ZXN0RGF0ZSA9IG5ldyBEYXRlKCk7XG5cdFx0aWYgKHRoaXMucXVlcnlQYXJhbXMubGF0ZXN0KSB7XG5cdFx0XHRsYXRlc3REYXRlID0gbmV3IERhdGUodGhpcy5xdWVyeVBhcmFtcy5sYXRlc3QpO1xuXHRcdH1cblxuXHRcdGxldCBvbGRlc3REYXRlID0gdW5kZWZpbmVkO1xuXHRcdGlmICh0aGlzLnF1ZXJ5UGFyYW1zLm9sZGVzdCkge1xuXHRcdFx0b2xkZXN0RGF0ZSA9IG5ldyBEYXRlKHRoaXMucXVlcnlQYXJhbXMub2xkZXN0KTtcblx0XHR9XG5cblx0XHRsZXQgaW5jbHVzaXZlID0gZmFsc2U7XG5cdFx0aWYgKHRoaXMucXVlcnlQYXJhbXMuaW5jbHVzaXZlKSB7XG5cdFx0XHRpbmNsdXNpdmUgPSB0aGlzLnF1ZXJ5UGFyYW1zLmluY2x1c2l2ZTtcblx0XHR9XG5cblx0XHRsZXQgY291bnQgPSAyMDtcblx0XHRpZiAodGhpcy5xdWVyeVBhcmFtcy5jb3VudCkge1xuXHRcdFx0Y291bnQgPSBwYXJzZUludCh0aGlzLnF1ZXJ5UGFyYW1zLmNvdW50KTtcblx0XHR9XG5cblx0XHRsZXQgdW5yZWFkcyA9IGZhbHNlO1xuXHRcdGlmICh0aGlzLnF1ZXJ5UGFyYW1zLnVucmVhZHMpIHtcblx0XHRcdHVucmVhZHMgPSB0aGlzLnF1ZXJ5UGFyYW1zLnVucmVhZHM7XG5cdFx0fVxuXG5cdFx0bGV0IHJlc3VsdDtcblx0XHRNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PiB7XG5cdFx0XHRyZXN1bHQgPSBNZXRlb3IuY2FsbCgnZ2V0Q2hhbm5lbEhpc3RvcnknLCB7XG5cdFx0XHRcdHJpZDogZmluZFJlc3VsdC5faWQsXG5cdFx0XHRcdGxhdGVzdDogbGF0ZXN0RGF0ZSxcblx0XHRcdFx0b2xkZXN0OiBvbGRlc3REYXRlLFxuXHRcdFx0XHRpbmNsdXNpdmUsXG5cdFx0XHRcdGNvdW50LFxuXHRcdFx0XHR1bnJlYWRzXG5cdFx0XHR9KTtcblx0XHR9KTtcblxuXHRcdGlmICghcmVzdWx0KSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEudW5hdXRob3JpemVkKCk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MocmVzdWx0KTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdjaGFubmVscy5pbmZvJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRnZXQoKSB7XG5cdFx0Y29uc3QgZmluZFJlc3VsdCA9IGZpbmRDaGFubmVsQnlJZE9yTmFtZSh7IHBhcmFtczogdGhpcy5yZXF1ZXN0UGFyYW1zKCksIGNoZWNrZWRBcmNoaXZlZDogZmFsc2UgfSk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7XG5cdFx0XHRjaGFubmVsOiBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT25lQnlJZChmaW5kUmVzdWx0Ll9pZCwgeyBmaWVsZHM6IFJvY2tldENoYXQuQVBJLnYxLmRlZmF1bHRGaWVsZHNUb0V4Y2x1ZGUgfSlcblx0XHR9KTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdjaGFubmVscy5pbnZpdGUnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdHBvc3QoKSB7XG5cdFx0Y29uc3QgZmluZFJlc3VsdCA9IGZpbmRDaGFubmVsQnlJZE9yTmFtZSh7IHBhcmFtczogdGhpcy5yZXF1ZXN0UGFyYW1zKCkgfSk7XG5cblx0XHRjb25zdCB1c2VyID0gdGhpcy5nZXRVc2VyRnJvbVBhcmFtcygpO1xuXG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4ge1xuXHRcdFx0TWV0ZW9yLmNhbGwoJ2FkZFVzZXJUb1Jvb20nLCB7IHJpZDogZmluZFJlc3VsdC5faWQsIHVzZXJuYW1lOiB1c2VyLnVzZXJuYW1lIH0pO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0Y2hhbm5lbDogUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9uZUJ5SWQoZmluZFJlc3VsdC5faWQsIHsgZmllbGRzOiBSb2NrZXRDaGF0LkFQSS52MS5kZWZhdWx0RmllbGRzVG9FeGNsdWRlIH0pXG5cdFx0fSk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnY2hhbm5lbHMuam9pbicsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdCgpIHtcblx0XHRjb25zdCBmaW5kUmVzdWx0ID0gZmluZENoYW5uZWxCeUlkT3JOYW1lKHsgcGFyYW1zOiB0aGlzLnJlcXVlc3RQYXJhbXMoKSB9KTtcblxuXHRcdE1ldGVvci5ydW5Bc1VzZXIodGhpcy51c2VySWQsICgpID0+IHtcblx0XHRcdE1ldGVvci5jYWxsKCdqb2luUm9vbScsIGZpbmRSZXN1bHQuX2lkLCB0aGlzLmJvZHlQYXJhbXMuam9pbkNvZGUpO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0Y2hhbm5lbDogUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9uZUJ5SWQoZmluZFJlc3VsdC5faWQsIHsgZmllbGRzOiBSb2NrZXRDaGF0LkFQSS52MS5kZWZhdWx0RmllbGRzVG9FeGNsdWRlIH0pXG5cdFx0fSk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnY2hhbm5lbHMua2ljaycsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdCgpIHtcblx0XHRjb25zdCBmaW5kUmVzdWx0ID0gZmluZENoYW5uZWxCeUlkT3JOYW1lKHsgcGFyYW1zOiB0aGlzLnJlcXVlc3RQYXJhbXMoKSB9KTtcblxuXHRcdGNvbnN0IHVzZXIgPSB0aGlzLmdldFVzZXJGcm9tUGFyYW1zKCk7XG5cblx0XHRNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PiB7XG5cdFx0XHRNZXRlb3IuY2FsbCgncmVtb3ZlVXNlckZyb21Sb29tJywgeyByaWQ6IGZpbmRSZXN1bHQuX2lkLCB1c2VybmFtZTogdXNlci51c2VybmFtZSB9KTtcblx0XHR9KTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdGNoYW5uZWw6IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRPbmVCeUlkKGZpbmRSZXN1bHQuX2lkLCB7IGZpZWxkczogUm9ja2V0Q2hhdC5BUEkudjEuZGVmYXVsdEZpZWxkc1RvRXhjbHVkZSB9KVxuXHRcdH0pO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2NoYW5uZWxzLmxlYXZlJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRwb3N0KCkge1xuXHRcdGNvbnN0IGZpbmRSZXN1bHQgPSBmaW5kQ2hhbm5lbEJ5SWRPck5hbWUoeyBwYXJhbXM6IHRoaXMucmVxdWVzdFBhcmFtcygpIH0pO1xuXG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4ge1xuXHRcdFx0TWV0ZW9yLmNhbGwoJ2xlYXZlUm9vbScsIGZpbmRSZXN1bHQuX2lkKTtcblx0XHR9KTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdGNoYW5uZWw6IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRPbmVCeUlkKGZpbmRSZXN1bHQuX2lkLCB7IGZpZWxkczogUm9ja2V0Q2hhdC5BUEkudjEuZGVmYXVsdEZpZWxkc1RvRXhjbHVkZSB9KVxuXHRcdH0pO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2NoYW5uZWxzLmxpc3QnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdGdldDoge1xuXHRcdC8vVGhpcyBpcyBkZWZpbmVkIGFzIHN1Y2ggb25seSB0byBwcm92aWRlIGFuIGV4YW1wbGUgb2YgaG93IHRoZSByb3V0ZXMgY2FuIGJlIGRlZmluZWQgOlhcblx0XHRhY3Rpb24oKSB7XG5cdFx0XHRjb25zdCB7IG9mZnNldCwgY291bnQgfSA9IHRoaXMuZ2V0UGFnaW5hdGlvbkl0ZW1zKCk7XG5cdFx0XHRjb25zdCB7IHNvcnQsIGZpZWxkcywgcXVlcnkgfSA9IHRoaXMucGFyc2VKc29uUXVlcnkoKTtcblx0XHRcdGNvbnN0IGhhc1Blcm1pc3Npb25Ub1NlZUFsbFB1YmxpY0NoYW5uZWxzID0gUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKHRoaXMudXNlcklkLCAndmlldy1jLXJvb20nKTtcblxuXHRcdFx0Y29uc3Qgb3VyUXVlcnkgPSBPYmplY3QuYXNzaWduKHt9LCBxdWVyeSwgeyB0OiAnYycgfSk7XG5cblx0XHRcdGlmIChSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odGhpcy51c2VySWQsICd2aWV3LWpvaW5lZC1yb29tJykgJiYgIWhhc1Blcm1pc3Npb25Ub1NlZUFsbFB1YmxpY0NoYW5uZWxzKSB7XG5cdFx0XHRcdG91clF1ZXJ5LnVzZXJuYW1lcyA9IHtcblx0XHRcdFx0XHQkaW46IFt0aGlzLnVzZXIudXNlcm5hbWVdXG5cdFx0XHRcdH07XG5cdFx0XHR9IGVsc2UgaWYgKCFoYXNQZXJtaXNzaW9uVG9TZWVBbGxQdWJsaWNDaGFubmVscykge1xuXHRcdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEudW5hdXRob3JpemVkKCk7XG5cdFx0XHR9XG5cblx0XHRcdGNvbnN0IHJvb21zID0gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZChvdXJRdWVyeSwge1xuXHRcdFx0XHRzb3J0OiBzb3J0ID8gc29ydCA6IHsgbmFtZTogMSB9LFxuXHRcdFx0XHRza2lwOiBvZmZzZXQsXG5cdFx0XHRcdGxpbWl0OiBjb3VudCxcblx0XHRcdFx0ZmllbGRzXG5cdFx0XHR9KS5mZXRjaCgpO1xuXG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7XG5cdFx0XHRcdGNoYW5uZWxzOiByb29tcyxcblx0XHRcdFx0Y291bnQ6IHJvb21zLmxlbmd0aCxcblx0XHRcdFx0b2Zmc2V0LFxuXHRcdFx0XHR0b3RhbDogUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZChvdXJRdWVyeSkuY291bnQoKVxuXHRcdFx0fSk7XG5cdFx0fVxuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2NoYW5uZWxzLmxpc3Quam9pbmVkJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRnZXQoKSB7XG5cdFx0Y29uc3QgeyBvZmZzZXQsIGNvdW50IH0gPSB0aGlzLmdldFBhZ2luYXRpb25JdGVtcygpO1xuXHRcdGNvbnN0IHsgc29ydCwgZmllbGRzLCBxdWVyeSB9ID0gdGhpcy5wYXJzZUpzb25RdWVyeSgpO1xuXHRcdGNvbnN0IG91clF1ZXJ5ID0gT2JqZWN0LmFzc2lnbih7fSwgcXVlcnksIHtcblx0XHRcdHQ6ICdjJyxcblx0XHRcdCd1Ll9pZCc6IHRoaXMudXNlcklkXG5cdFx0fSk7XG5cblx0XHRsZXQgcm9vbXMgPSBfLnBsdWNrKFJvY2tldENoYXQubW9kZWxzLlN1YnNjcmlwdGlvbnMuZmluZChvdXJRdWVyeSkuZmV0Y2goKSwgJ19yb29tJyk7XG5cdFx0Y29uc3QgdG90YWxDb3VudCA9IHJvb21zLmxlbmd0aDtcblxuXHRcdHJvb21zID0gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMucHJvY2Vzc1F1ZXJ5T3B0aW9uc09uUmVzdWx0KHJvb21zLCB7XG5cdFx0XHRzb3J0OiBzb3J0ID8gc29ydCA6IHsgbmFtZTogMSB9LFxuXHRcdFx0c2tpcDogb2Zmc2V0LFxuXHRcdFx0bGltaXQ6IGNvdW50LFxuXHRcdFx0ZmllbGRzXG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7XG5cdFx0XHRjaGFubmVsczogcm9vbXMsXG5cdFx0XHRvZmZzZXQsXG5cdFx0XHRjb3VudDogcm9vbXMubGVuZ3RoLFxuXHRcdFx0dG90YWw6IHRvdGFsQ291bnRcblx0XHR9KTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdjaGFubmVscy5tZW1iZXJzJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRnZXQoKSB7XG5cdFx0Y29uc3QgZmluZFJlc3VsdCA9IGZpbmRDaGFubmVsQnlJZE9yTmFtZSh7XG5cdFx0XHRwYXJhbXM6IHRoaXMucmVxdWVzdFBhcmFtcygpLFxuXHRcdFx0Y2hlY2tlZEFyY2hpdmVkOiBmYWxzZSxcblx0XHRcdHJldHVyblVzZXJuYW1lczogdHJ1ZVxuXHRcdH0pO1xuXG5cdFx0Y29uc3QgeyBvZmZzZXQsIGNvdW50IH0gPSB0aGlzLmdldFBhZ2luYXRpb25JdGVtcygpO1xuXHRcdGNvbnN0IHsgc29ydCB9ID0gdGhpcy5wYXJzZUpzb25RdWVyeSgpO1xuXG5cdFx0Y29uc3Qgc2hvdWxkQmVPcmRlcmVkRGVzYyA9IE1hdGNoLnRlc3Qoc29ydCwgT2JqZWN0KSAmJiBNYXRjaC50ZXN0KHNvcnQudXNlcm5hbWUsIE51bWJlcikgJiYgc29ydC51c2VybmFtZSA9PT0gLTE7XG5cblx0XHRsZXQgbWVtYmVycyA9IFJvY2tldENoYXQubW9kZWxzLlJvb21zLnByb2Nlc3NRdWVyeU9wdGlvbnNPblJlc3VsdChBcnJheS5mcm9tKGZpbmRSZXN1bHQudXNlcm5hbWVzKS5zb3J0KCksIHtcblx0XHRcdHNraXA6IG9mZnNldCxcblx0XHRcdGxpbWl0OiBjb3VudFxuXHRcdH0pO1xuXG5cdFx0aWYgKHNob3VsZEJlT3JkZXJlZERlc2MpIHtcblx0XHRcdG1lbWJlcnMgPSBtZW1iZXJzLnJldmVyc2UoKTtcblx0XHR9XG5cblx0XHRjb25zdCB1c2VycyA9IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmQoeyB1c2VybmFtZTogeyAkaW46IG1lbWJlcnMgfSB9LCB7XG5cdFx0XHRmaWVsZHM6IHsgX2lkOiAxLCB1c2VybmFtZTogMSwgbmFtZTogMSwgc3RhdHVzOiAxLCB1dGNPZmZzZXQ6IDEgfSxcblx0XHRcdHNvcnQ6IHNvcnQgPyBzb3J0IDogeyB1c2VybmFtZTogMSB9XG5cdFx0fSkuZmV0Y2goKTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdG1lbWJlcnM6IHVzZXJzLFxuXHRcdFx0Y291bnQ6IHVzZXJzLmxlbmd0aCxcblx0XHRcdG9mZnNldCxcblx0XHRcdHRvdGFsOiBmaW5kUmVzdWx0LnVzZXJuYW1lcy5sZW5ndGhcblx0XHR9KTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdjaGFubmVscy5tZXNzYWdlcycsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0Z2V0KCkge1xuXHRcdGNvbnN0IGZpbmRSZXN1bHQgPSBmaW5kQ2hhbm5lbEJ5SWRPck5hbWUoe1xuXHRcdFx0cGFyYW1zOiB0aGlzLnJlcXVlc3RQYXJhbXMoKSxcblx0XHRcdGNoZWNrZWRBcmNoaXZlZDogZmFsc2UsXG5cdFx0XHRyZXR1cm5Vc2VybmFtZXM6IHRydWVcblx0XHR9KTtcblx0XHRjb25zdCB7IG9mZnNldCwgY291bnQgfSA9IHRoaXMuZ2V0UGFnaW5hdGlvbkl0ZW1zKCk7XG5cdFx0Y29uc3QgeyBzb3J0LCBmaWVsZHMsIHF1ZXJ5IH0gPSB0aGlzLnBhcnNlSnNvblF1ZXJ5KCk7XG5cblx0XHRjb25zdCBvdXJRdWVyeSA9IE9iamVjdC5hc3NpZ24oe30sIHF1ZXJ5LCB7IHJpZDogZmluZFJlc3VsdC5faWQgfSk7XG5cblx0XHQvL1NwZWNpYWwgY2hlY2sgZm9yIHRoZSBwZXJtaXNzaW9uc1xuXHRcdGlmIChSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odGhpcy51c2VySWQsICd2aWV3LWpvaW5lZC1yb29tJykgJiYgIWZpbmRSZXN1bHQudXNlcm5hbWVzLmluY2x1ZGVzKHRoaXMudXNlci51c2VybmFtZSkpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS51bmF1dGhvcml6ZWQoKTtcblx0XHR9IGVsc2UgaWYgKCFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odGhpcy51c2VySWQsICd2aWV3LWMtcm9vbScpKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEudW5hdXRob3JpemVkKCk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgbWVzc2FnZXMgPSBSb2NrZXRDaGF0Lm1vZGVscy5NZXNzYWdlcy5maW5kKG91clF1ZXJ5LCB7XG5cdFx0XHRzb3J0OiBzb3J0ID8gc29ydCA6IHsgdHM6IC0xIH0sXG5cdFx0XHRza2lwOiBvZmZzZXQsXG5cdFx0XHRsaW1pdDogY291bnQsXG5cdFx0XHRmaWVsZHNcblx0XHR9KS5mZXRjaCgpO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0bWVzc2FnZXMsXG5cdFx0XHRjb3VudDogbWVzc2FnZXMubGVuZ3RoLFxuXHRcdFx0b2Zmc2V0LFxuXHRcdFx0dG90YWw6IFJvY2tldENoYXQubW9kZWxzLk1lc3NhZ2VzLmZpbmQob3VyUXVlcnkpLmNvdW50KClcblx0XHR9KTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdjaGFubmVscy5vbmxpbmUnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdGdldCgpIHtcblx0XHRjb25zdCB7IHF1ZXJ5IH0gPSB0aGlzLnBhcnNlSnNvblF1ZXJ5KCk7XG5cdFx0Y29uc3Qgb3VyUXVlcnkgPSBPYmplY3QuYXNzaWduKHt9LCBxdWVyeSwgeyB0OiAnYycgfSk7XG5cblx0XHRjb25zdCByb29tID0gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9uZShvdXJRdWVyeSk7XG5cblx0XHRpZiAocm9vbSA9PSBudWxsKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgnQ2hhbm5lbCBkb2VzIG5vdCBleGlzdHMnKTtcblx0XHR9XG5cblx0XHRjb25zdCBvbmxpbmUgPSBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kVXNlcnNOb3RPZmZsaW5lKHtcblx0XHRcdGZpZWxkczoge1xuXHRcdFx0XHR1c2VybmFtZTogMVxuXHRcdFx0fVxuXHRcdH0pLmZldGNoKCk7XG5cblx0XHRjb25zdCBvbmxpbmVJblJvb20gPSBbXTtcblx0XHRvbmxpbmUuZm9yRWFjaCh1c2VyID0+IHtcblx0XHRcdGlmIChyb29tLnVzZXJuYW1lcy5pbmRleE9mKHVzZXIudXNlcm5hbWUpICE9PSAtMSkge1xuXHRcdFx0XHRvbmxpbmVJblJvb20ucHVzaCh7XG5cdFx0XHRcdFx0X2lkOiB1c2VyLl9pZCxcblx0XHRcdFx0XHR1c2VybmFtZTogdXNlci51c2VybmFtZVxuXHRcdFx0XHR9KTtcblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdG9ubGluZTogb25saW5lSW5Sb29tXG5cdFx0fSk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnY2hhbm5lbHMub3BlbicsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdCgpIHtcblx0XHRjb25zdCBmaW5kUmVzdWx0ID0gZmluZENoYW5uZWxCeUlkT3JOYW1lKHsgcGFyYW1zOiB0aGlzLnJlcXVlc3RQYXJhbXMoKSwgY2hlY2tlZEFyY2hpdmVkOiBmYWxzZSB9KTtcblxuXHRcdGNvbnN0IHN1YiA9IFJvY2tldENoYXQubW9kZWxzLlN1YnNjcmlwdGlvbnMuZmluZE9uZUJ5Um9vbUlkQW5kVXNlcklkKGZpbmRSZXN1bHQuX2lkLCB0aGlzLnVzZXJJZCk7XG5cblx0XHRpZiAoIXN1Yikge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoYFRoZSB1c2VyL2NhbGxlZSBpcyBub3QgaW4gdGhlIGNoYW5uZWwgXCIkeyBmaW5kUmVzdWx0Lm5hbWUgfVwiLmApO1xuXHRcdH1cblxuXHRcdGlmIChzdWIub3Blbikge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoYFRoZSBjaGFubmVsLCAkeyBmaW5kUmVzdWx0Lm5hbWUgfSwgaXMgYWxyZWFkeSBvcGVuIHRvIHRoZSBzZW5kZXJgKTtcblx0XHR9XG5cblx0XHRNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PiB7XG5cdFx0XHRNZXRlb3IuY2FsbCgnb3BlblJvb20nLCBmaW5kUmVzdWx0Ll9pZCk7XG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2VzcygpO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2NoYW5uZWxzLnJlbW92ZU1vZGVyYXRvcicsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdCgpIHtcblx0XHRjb25zdCBmaW5kUmVzdWx0ID0gZmluZENoYW5uZWxCeUlkT3JOYW1lKHsgcGFyYW1zOiB0aGlzLnJlcXVlc3RQYXJhbXMoKSB9KTtcblxuXHRcdGNvbnN0IHVzZXIgPSB0aGlzLmdldFVzZXJGcm9tUGFyYW1zKCk7XG5cblx0XHRNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PiB7XG5cdFx0XHRNZXRlb3IuY2FsbCgncmVtb3ZlUm9vbU1vZGVyYXRvcicsIGZpbmRSZXN1bHQuX2lkLCB1c2VyLl9pZCk7XG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2VzcygpO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2NoYW5uZWxzLnJlbW92ZU93bmVyJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRwb3N0KCkge1xuXHRcdGNvbnN0IGZpbmRSZXN1bHQgPSBmaW5kQ2hhbm5lbEJ5SWRPck5hbWUoeyBwYXJhbXM6IHRoaXMucmVxdWVzdFBhcmFtcygpIH0pO1xuXG5cdFx0Y29uc3QgdXNlciA9IHRoaXMuZ2V0VXNlckZyb21QYXJhbXMoKTtcblxuXHRcdE1ldGVvci5ydW5Bc1VzZXIodGhpcy51c2VySWQsICgpID0+IHtcblx0XHRcdE1ldGVvci5jYWxsKCdyZW1vdmVSb29tT3duZXInLCBmaW5kUmVzdWx0Ll9pZCwgdXNlci5faWQpO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoKTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdjaGFubmVscy5yZW5hbWUnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdHBvc3QoKSB7XG5cdFx0aWYgKCF0aGlzLmJvZHlQYXJhbXMubmFtZSB8fCAhdGhpcy5ib2R5UGFyYW1zLm5hbWUudHJpbSgpKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgnVGhlIGJvZHlQYXJhbSBcIm5hbWVcIiBpcyByZXF1aXJlZCcpO1xuXHRcdH1cblxuXHRcdGNvbnN0IGZpbmRSZXN1bHQgPSBmaW5kQ2hhbm5lbEJ5SWRPck5hbWUoeyBwYXJhbXM6IHsgcm9vbUlkOiB0aGlzLmJvZHlQYXJhbXMucm9vbUlkIH0gfSk7XG5cblx0XHRpZiAoZmluZFJlc3VsdC5uYW1lID09PSB0aGlzLmJvZHlQYXJhbXMubmFtZSkge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoJ1RoZSBjaGFubmVsIG5hbWUgaXMgdGhlIHNhbWUgYXMgd2hhdCBpdCB3b3VsZCBiZSByZW5hbWVkIHRvLicpO1xuXHRcdH1cblxuXHRcdE1ldGVvci5ydW5Bc1VzZXIodGhpcy51c2VySWQsICgpID0+IHtcblx0XHRcdE1ldGVvci5jYWxsKCdzYXZlUm9vbVNldHRpbmdzJywgZmluZFJlc3VsdC5faWQsICdyb29tTmFtZScsIHRoaXMuYm9keVBhcmFtcy5uYW1lKTtcblx0XHR9KTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdGNoYW5uZWw6IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRPbmVCeUlkKGZpbmRSZXN1bHQuX2lkLCB7IGZpZWxkczogUm9ja2V0Q2hhdC5BUEkudjEuZGVmYXVsdEZpZWxkc1RvRXhjbHVkZSB9KVxuXHRcdH0pO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2NoYW5uZWxzLnNldERlc2NyaXB0aW9uJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRwb3N0KCkge1xuXHRcdGlmICghdGhpcy5ib2R5UGFyYW1zLmRlc2NyaXB0aW9uIHx8ICF0aGlzLmJvZHlQYXJhbXMuZGVzY3JpcHRpb24udHJpbSgpKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgnVGhlIGJvZHlQYXJhbSBcImRlc2NyaXB0aW9uXCIgaXMgcmVxdWlyZWQnKTtcblx0XHR9XG5cblx0XHRjb25zdCBmaW5kUmVzdWx0ID0gZmluZENoYW5uZWxCeUlkT3JOYW1lKHsgcGFyYW1zOiB0aGlzLnJlcXVlc3RQYXJhbXMoKSB9KTtcblxuXHRcdGlmIChmaW5kUmVzdWx0LmRlc2NyaXB0aW9uID09PSB0aGlzLmJvZHlQYXJhbXMuZGVzY3JpcHRpb24pIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCdUaGUgY2hhbm5lbCBkZXNjcmlwdGlvbiBpcyB0aGUgc2FtZSBhcyB3aGF0IGl0IHdvdWxkIGJlIGNoYW5nZWQgdG8uJyk7XG5cdFx0fVxuXG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4ge1xuXHRcdFx0TWV0ZW9yLmNhbGwoJ3NhdmVSb29tU2V0dGluZ3MnLCBmaW5kUmVzdWx0Ll9pZCwgJ3Jvb21EZXNjcmlwdGlvbicsIHRoaXMuYm9keVBhcmFtcy5kZXNjcmlwdGlvbik7XG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7XG5cdFx0XHRkZXNjcmlwdGlvbjogdGhpcy5ib2R5UGFyYW1zLmRlc2NyaXB0aW9uXG5cdFx0fSk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnY2hhbm5lbHMuc2V0Sm9pbkNvZGUnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdHBvc3QoKSB7XG5cdFx0aWYgKCF0aGlzLmJvZHlQYXJhbXMuam9pbkNvZGUgfHwgIXRoaXMuYm9keVBhcmFtcy5qb2luQ29kZS50cmltKCkpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCdUaGUgYm9keVBhcmFtIFwiam9pbkNvZGVcIiBpcyByZXF1aXJlZCcpO1xuXHRcdH1cblxuXHRcdGNvbnN0IGZpbmRSZXN1bHQgPSBmaW5kQ2hhbm5lbEJ5SWRPck5hbWUoeyBwYXJhbXM6IHRoaXMucmVxdWVzdFBhcmFtcygpIH0pO1xuXG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4ge1xuXHRcdFx0TWV0ZW9yLmNhbGwoJ3NhdmVSb29tU2V0dGluZ3MnLCBmaW5kUmVzdWx0Ll9pZCwgJ2pvaW5Db2RlJywgdGhpcy5ib2R5UGFyYW1zLmpvaW5Db2RlKTtcblx0XHR9KTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdGNoYW5uZWw6IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRPbmVCeUlkKGZpbmRSZXN1bHQuX2lkLCB7IGZpZWxkczogUm9ja2V0Q2hhdC5BUEkudjEuZGVmYXVsdEZpZWxkc1RvRXhjbHVkZSB9KVxuXHRcdH0pO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2NoYW5uZWxzLnNldFB1cnBvc2UnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdHBvc3QoKSB7XG5cdFx0aWYgKCF0aGlzLmJvZHlQYXJhbXMucHVycG9zZSB8fCAhdGhpcy5ib2R5UGFyYW1zLnB1cnBvc2UudHJpbSgpKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgnVGhlIGJvZHlQYXJhbSBcInB1cnBvc2VcIiBpcyByZXF1aXJlZCcpO1xuXHRcdH1cblxuXHRcdGNvbnN0IGZpbmRSZXN1bHQgPSBmaW5kQ2hhbm5lbEJ5SWRPck5hbWUoeyBwYXJhbXM6IHRoaXMucmVxdWVzdFBhcmFtcygpIH0pO1xuXG5cdFx0aWYgKGZpbmRSZXN1bHQuZGVzY3JpcHRpb24gPT09IHRoaXMuYm9keVBhcmFtcy5wdXJwb3NlKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgnVGhlIGNoYW5uZWwgcHVycG9zZSAoZGVzY3JpcHRpb24pIGlzIHRoZSBzYW1lIGFzIHdoYXQgaXQgd291bGQgYmUgY2hhbmdlZCB0by4nKTtcblx0XHR9XG5cblx0XHRNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PiB7XG5cdFx0XHRNZXRlb3IuY2FsbCgnc2F2ZVJvb21TZXR0aW5ncycsIGZpbmRSZXN1bHQuX2lkLCAncm9vbURlc2NyaXB0aW9uJywgdGhpcy5ib2R5UGFyYW1zLnB1cnBvc2UpO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0cHVycG9zZTogdGhpcy5ib2R5UGFyYW1zLnB1cnBvc2Vcblx0XHR9KTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdjaGFubmVscy5zZXRSZWFkT25seScsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdCgpIHtcblx0XHRpZiAodHlwZW9mIHRoaXMuYm9keVBhcmFtcy5yZWFkT25seSA9PT0gJ3VuZGVmaW5lZCcpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCdUaGUgYm9keVBhcmFtIFwicmVhZE9ubHlcIiBpcyByZXF1aXJlZCcpO1xuXHRcdH1cblxuXHRcdGNvbnN0IGZpbmRSZXN1bHQgPSBmaW5kQ2hhbm5lbEJ5SWRPck5hbWUoeyBwYXJhbXM6IHRoaXMucmVxdWVzdFBhcmFtcygpIH0pO1xuXG5cdFx0aWYgKGZpbmRSZXN1bHQucm8gPT09IHRoaXMuYm9keVBhcmFtcy5yZWFkT25seSkge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoJ1RoZSBjaGFubmVsIHJlYWQgb25seSBzZXR0aW5nIGlzIHRoZSBzYW1lIGFzIHdoYXQgaXQgd291bGQgYmUgY2hhbmdlZCB0by4nKTtcblx0XHR9XG5cblx0XHRNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PiB7XG5cdFx0XHRNZXRlb3IuY2FsbCgnc2F2ZVJvb21TZXR0aW5ncycsIGZpbmRSZXN1bHQuX2lkLCAncmVhZE9ubHknLCB0aGlzLmJvZHlQYXJhbXMucmVhZE9ubHkpO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0Y2hhbm5lbDogUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9uZUJ5SWQoZmluZFJlc3VsdC5faWQsIHsgZmllbGRzOiBSb2NrZXRDaGF0LkFQSS52MS5kZWZhdWx0RmllbGRzVG9FeGNsdWRlIH0pXG5cdFx0fSk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnY2hhbm5lbHMuc2V0VG9waWMnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdHBvc3QoKSB7XG5cdFx0aWYgKCF0aGlzLmJvZHlQYXJhbXMudG9waWMgfHwgIXRoaXMuYm9keVBhcmFtcy50b3BpYy50cmltKCkpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCdUaGUgYm9keVBhcmFtIFwidG9waWNcIiBpcyByZXF1aXJlZCcpO1xuXHRcdH1cblxuXHRcdGNvbnN0IGZpbmRSZXN1bHQgPSBmaW5kQ2hhbm5lbEJ5SWRPck5hbWUoeyBwYXJhbXM6IHRoaXMucmVxdWVzdFBhcmFtcygpIH0pO1xuXG5cdFx0aWYgKGZpbmRSZXN1bHQudG9waWMgPT09IHRoaXMuYm9keVBhcmFtcy50b3BpYykge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoJ1RoZSBjaGFubmVsIHRvcGljIGlzIHRoZSBzYW1lIGFzIHdoYXQgaXQgd291bGQgYmUgY2hhbmdlZCB0by4nKTtcblx0XHR9XG5cblx0XHRNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PiB7XG5cdFx0XHRNZXRlb3IuY2FsbCgnc2F2ZVJvb21TZXR0aW5ncycsIGZpbmRSZXN1bHQuX2lkLCAncm9vbVRvcGljJywgdGhpcy5ib2R5UGFyYW1zLnRvcGljKTtcblx0XHR9KTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdHRvcGljOiB0aGlzLmJvZHlQYXJhbXMudG9waWNcblx0XHR9KTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdjaGFubmVscy5zZXRBbm5vdW5jZW1lbnQnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdHBvc3QoKSB7XG5cdFx0aWYgKCF0aGlzLmJvZHlQYXJhbXMuYW5ub3VuY2VtZW50IHx8ICF0aGlzLmJvZHlQYXJhbXMuYW5ub3VuY2VtZW50LnRyaW0oKSkge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoJ1RoZSBib2R5UGFyYW0gXCJhbm5vdW5jZW1lbnRcIiBpcyByZXF1aXJlZCcpO1xuXHRcdH1cblxuXHRcdGNvbnN0IGZpbmRSZXN1bHQgPSBmaW5kQ2hhbm5lbEJ5SWRPck5hbWUoeyBwYXJhbXM6IHRoaXMucmVxdWVzdFBhcmFtcygpIH0pO1xuXG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4ge1xuXHRcdFx0TWV0ZW9yLmNhbGwoJ3NhdmVSb29tU2V0dGluZ3MnLCBmaW5kUmVzdWx0Ll9pZCwgJ3Jvb21Bbm5vdW5jZW1lbnQnLCB0aGlzLmJvZHlQYXJhbXMuYW5ub3VuY2VtZW50KTtcblx0XHR9KTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdGFubm91bmNlbWVudDogdGhpcy5ib2R5UGFyYW1zLmFubm91bmNlbWVudFxuXHRcdH0pO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2NoYW5uZWxzLnNldFR5cGUnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdHBvc3QoKSB7XG5cdFx0aWYgKCF0aGlzLmJvZHlQYXJhbXMudHlwZSB8fCAhdGhpcy5ib2R5UGFyYW1zLnR5cGUudHJpbSgpKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgnVGhlIGJvZHlQYXJhbSBcInR5cGVcIiBpcyByZXF1aXJlZCcpO1xuXHRcdH1cblxuXHRcdGNvbnN0IGZpbmRSZXN1bHQgPSBmaW5kQ2hhbm5lbEJ5SWRPck5hbWUoeyBwYXJhbXM6IHRoaXMucmVxdWVzdFBhcmFtcygpIH0pO1xuXG5cdFx0aWYgKGZpbmRSZXN1bHQudCA9PT0gdGhpcy5ib2R5UGFyYW1zLnR5cGUpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCdUaGUgY2hhbm5lbCB0eXBlIGlzIHRoZSBzYW1lIGFzIHdoYXQgaXQgd291bGQgYmUgY2hhbmdlZCB0by4nKTtcblx0XHR9XG5cblx0XHRNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PiB7XG5cdFx0XHRNZXRlb3IuY2FsbCgnc2F2ZVJvb21TZXR0aW5ncycsIGZpbmRSZXN1bHQuX2lkLCAncm9vbVR5cGUnLCB0aGlzLmJvZHlQYXJhbXMudHlwZSk7XG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7XG5cdFx0XHRjaGFubmVsOiBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT25lQnlJZChmaW5kUmVzdWx0Ll9pZCwgeyBmaWVsZHM6IFJvY2tldENoYXQuQVBJLnYxLmRlZmF1bHRGaWVsZHNUb0V4Y2x1ZGUgfSlcblx0XHR9KTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdjaGFubmVscy51bmFyY2hpdmUnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdHBvc3QoKSB7XG5cdFx0Y29uc3QgZmluZFJlc3VsdCA9IGZpbmRDaGFubmVsQnlJZE9yTmFtZSh7IHBhcmFtczogdGhpcy5yZXF1ZXN0UGFyYW1zKCksIGNoZWNrZWRBcmNoaXZlZDogZmFsc2UgfSk7XG5cblx0XHRpZiAoIWZpbmRSZXN1bHQuYXJjaGl2ZWQpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKGBUaGUgY2hhbm5lbCwgJHsgZmluZFJlc3VsdC5uYW1lIH0sIGlzIG5vdCBhcmNoaXZlZGApO1xuXHRcdH1cblxuXHRcdE1ldGVvci5ydW5Bc1VzZXIodGhpcy51c2VySWQsICgpID0+IHtcblx0XHRcdE1ldGVvci5jYWxsKCd1bmFyY2hpdmVSb29tJywgZmluZFJlc3VsdC5faWQpO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoKTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdjaGFubmVscy5nZXRBbGxVc2VyTWVudGlvbnNCeUNoYW5uZWwnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdGdldCgpIHtcblx0XHRjb25zdCB7IHJvb21JZCB9ID0gdGhpcy5yZXF1ZXN0UGFyYW1zKCk7XG5cdFx0Y29uc3QgeyBvZmZzZXQsIGNvdW50IH0gPSB0aGlzLmdldFBhZ2luYXRpb25JdGVtcygpO1xuXHRcdGNvbnN0IHsgc29ydCB9ID0gdGhpcy5wYXJzZUpzb25RdWVyeSgpO1xuXG5cdFx0aWYgKCFyb29tSWQpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCdUaGUgcmVxdWVzdCBwYXJhbSBcInJvb21JZFwiIGlzIHJlcXVpcmVkJyk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgbWVudGlvbnMgPSBNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PiBNZXRlb3IuY2FsbCgnZ2V0VXNlck1lbnRpb25zQnlDaGFubmVsJywge1xuXHRcdFx0cm9vbUlkLFxuXHRcdFx0b3B0aW9uczoge1xuXHRcdFx0XHRzb3J0OiBzb3J0ID8gc29ydCA6IHsgdHM6IDEgfSxcblx0XHRcdFx0c2tpcDogb2Zmc2V0LFxuXHRcdFx0XHRsaW1pdDogY291bnRcblx0XHRcdH1cblx0XHR9KSk7XG5cblx0XHRjb25zdCBhbGxNZW50aW9ucyA9IE1ldGVvci5ydW5Bc1VzZXIodGhpcy51c2VySWQsICgpID0+IE1ldGVvci5jYWxsKCdnZXRVc2VyTWVudGlvbnNCeUNoYW5uZWwnLCB7XG5cdFx0XHRyb29tSWQsXG5cdFx0XHRvcHRpb25zOiB7fVxuXHRcdH0pKTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdG1lbnRpb25zLFxuXHRcdFx0Y291bnQ6IG1lbnRpb25zLmxlbmd0aCxcblx0XHRcdG9mZnNldCxcblx0XHRcdHRvdGFsOiBhbGxNZW50aW9ucy5sZW5ndGhcblx0XHR9KTtcblx0fVxufSk7XG5cbiIsImltcG9ydCBCdXNib3kgZnJvbSAnYnVzYm95JztcblxuZnVuY3Rpb24gZmluZFJvb21CeUlkT3JOYW1lKHsgcGFyYW1zLCBjaGVja2VkQXJjaGl2ZWQgPSB0cnVlfSkge1xuXHRpZiAoKCFwYXJhbXMucm9vbUlkIHx8ICFwYXJhbXMucm9vbUlkLnRyaW0oKSkgJiYgKCFwYXJhbXMucm9vbU5hbWUgfHwgIXBhcmFtcy5yb29tTmFtZS50cmltKCkpKSB7XG5cdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3Itcm9vbWlkLXBhcmFtLW5vdC1wcm92aWRlZCcsICdUaGUgcGFyYW1ldGVyIFwicm9vbUlkXCIgb3IgXCJyb29tTmFtZVwiIGlzIHJlcXVpcmVkJyk7XG5cdH1cblxuXHRjb25zdCBmaWVsZHMgPSB7IC4uLlJvY2tldENoYXQuQVBJLnYxLmRlZmF1bHRGaWVsZHNUb0V4Y2x1ZGUgfTtcblxuXHRsZXQgcm9vbTtcblx0aWYgKHBhcmFtcy5yb29tSWQpIHtcblx0XHRyb29tID0gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9uZUJ5SWQocGFyYW1zLnJvb21JZCwgeyBmaWVsZHMgfSk7XG5cdH0gZWxzZSBpZiAocGFyYW1zLnJvb21OYW1lKSB7XG5cdFx0cm9vbSA9IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRPbmVCeU5hbWUocGFyYW1zLnJvb21OYW1lLCB7IGZpZWxkcyB9KTtcblx0fVxuXHRpZiAoIXJvb20pIHtcblx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1yb29tLW5vdC1mb3VuZCcsICdUaGUgcmVxdWlyZWQgXCJyb29tSWRcIiBvciBcInJvb21OYW1lXCIgcGFyYW0gcHJvdmlkZWQgZG9lcyBub3QgbWF0Y2ggYW55IGNoYW5uZWwnKTtcblx0fVxuXHRpZiAoY2hlY2tlZEFyY2hpdmVkICYmIHJvb20uYXJjaGl2ZWQpIHtcblx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1yb29tLWFyY2hpdmVkJywgYFRoZSBjaGFubmVsLCAkeyByb29tLm5hbWUgfSwgaXMgYXJjaGl2ZWRgKTtcblx0fVxuXG5cdHJldHVybiByb29tO1xufVxuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgncm9vbXMuZ2V0JywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRnZXQoKSB7XG5cdFx0Y29uc3QgeyB1cGRhdGVkU2luY2UgfSA9IHRoaXMucXVlcnlQYXJhbXM7XG5cblx0XHRsZXQgdXBkYXRlZFNpbmNlRGF0ZTtcblx0XHRpZiAodXBkYXRlZFNpbmNlKSB7XG5cdFx0XHRpZiAoaXNOYU4oRGF0ZS5wYXJzZSh1cGRhdGVkU2luY2UpKSkge1xuXHRcdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci11cGRhdGVkU2luY2UtcGFyYW0taW52YWxpZCcsICdUaGUgXCJ1cGRhdGVkU2luY2VcIiBxdWVyeSBwYXJhbWV0ZXIgbXVzdCBiZSBhIHZhbGlkIGRhdGUuJyk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR1cGRhdGVkU2luY2VEYXRlID0gbmV3IERhdGUodXBkYXRlZFNpbmNlKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRsZXQgcmVzdWx0O1xuXHRcdE1ldGVvci5ydW5Bc1VzZXIodGhpcy51c2VySWQsICgpID0+IHJlc3VsdCA9IE1ldGVvci5jYWxsKCdyb29tcy9nZXQnLCB1cGRhdGVkU2luY2VEYXRlKSk7XG5cblx0XHRpZiAoQXJyYXkuaXNBcnJheShyZXN1bHQpKSB7XG5cdFx0XHRyZXN1bHQgPSB7XG5cdFx0XHRcdHVwZGF0ZTogcmVzdWx0LFxuXHRcdFx0XHRyZW1vdmU6IFtdXG5cdFx0XHR9O1xuXHRcdH1cblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHJlc3VsdCk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgncm9vbXMudXBsb2FkLzpyaWQnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdHBvc3QoKSB7XG5cdFx0Y29uc3Qgcm9vbSA9IE1ldGVvci5jYWxsKCdjYW5BY2Nlc3NSb29tJywgdGhpcy51cmxQYXJhbXMucmlkLCB0aGlzLnVzZXJJZCk7XG5cblx0XHRpZiAoIXJvb20pIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS51bmF1dGhvcml6ZWQoKTtcblx0XHR9XG5cblx0XHRjb25zdCBidXNib3kgPSBuZXcgQnVzYm95KHsgaGVhZGVyczogdGhpcy5yZXF1ZXN0LmhlYWRlcnMgfSk7XG5cdFx0Y29uc3QgZmlsZXMgPSBbXTtcblx0XHRjb25zdCBmaWVsZHMgPSB7fTtcblxuXHRcdE1ldGVvci53cmFwQXN5bmMoKGNhbGxiYWNrKSA9PiB7XG5cdFx0XHRidXNib3kub24oJ2ZpbGUnLCAoZmllbGRuYW1lLCBmaWxlLCBmaWxlbmFtZSwgZW5jb2RpbmcsIG1pbWV0eXBlKSA9PiB7XG5cdFx0XHRcdGlmIChmaWVsZG5hbWUgIT09ICdmaWxlJykge1xuXHRcdFx0XHRcdHJldHVybiBmaWxlcy5wdXNoKG5ldyBNZXRlb3IuRXJyb3IoJ2ludmFsaWQtZmllbGQnKSk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRjb25zdCBmaWxlRGF0ZSA9IFtdO1xuXHRcdFx0XHRmaWxlLm9uKCdkYXRhJywgZGF0YSA9PiBmaWxlRGF0ZS5wdXNoKGRhdGEpKTtcblxuXHRcdFx0XHRmaWxlLm9uKCdlbmQnLCAoKSA9PiB7XG5cdFx0XHRcdFx0ZmlsZXMucHVzaCh7IGZpZWxkbmFtZSwgZmlsZSwgZmlsZW5hbWUsIGVuY29kaW5nLCBtaW1ldHlwZSwgZmlsZUJ1ZmZlcjogQnVmZmVyLmNvbmNhdChmaWxlRGF0ZSkgfSk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fSk7XG5cblx0XHRcdGJ1c2JveS5vbignZmllbGQnLCAoZmllbGRuYW1lLCB2YWx1ZSkgPT4gZmllbGRzW2ZpZWxkbmFtZV0gPSB2YWx1ZSk7XG5cblx0XHRcdGJ1c2JveS5vbignZmluaXNoJywgTWV0ZW9yLmJpbmRFbnZpcm9ubWVudCgoKSA9PiBjYWxsYmFjaygpKSk7XG5cblx0XHRcdHRoaXMucmVxdWVzdC5waXBlKGJ1c2JveSk7XG5cdFx0fSkoKTtcblxuXHRcdGlmIChmaWxlcy5sZW5ndGggPT09IDApIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCdGaWxlIHJlcXVpcmVkJyk7XG5cdFx0fVxuXG5cdFx0aWYgKGZpbGVzLmxlbmd0aCA+IDEpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCdKdXN0IDEgZmlsZSBpcyBhbGxvd2VkJyk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgZmlsZSA9IGZpbGVzWzBdO1xuXG5cdFx0Y29uc3QgZmlsZVN0b3JlID0gRmlsZVVwbG9hZC5nZXRTdG9yZSgnVXBsb2FkcycpO1xuXG5cdFx0Y29uc3QgZGV0YWlscyA9IHtcblx0XHRcdG5hbWU6IGZpbGUuZmlsZW5hbWUsXG5cdFx0XHRzaXplOiBmaWxlLmZpbGVCdWZmZXIubGVuZ3RoLFxuXHRcdFx0dHlwZTogZmlsZS5taW1ldHlwZSxcblx0XHRcdHJpZDogdGhpcy51cmxQYXJhbXMucmlkLFxuXHRcdFx0dXNlcklkOiB0aGlzLnVzZXJJZFxuXHRcdH07XG5cblx0XHRNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PiB7XG5cdFx0XHRjb25zdCB1cGxvYWRlZEZpbGUgPSBNZXRlb3Iud3JhcEFzeW5jKGZpbGVTdG9yZS5pbnNlcnQuYmluZChmaWxlU3RvcmUpKShkZXRhaWxzLCBmaWxlLmZpbGVCdWZmZXIpO1xuXG5cdFx0XHR1cGxvYWRlZEZpbGUuZGVzY3JpcHRpb24gPSBmaWVsZHMuZGVzY3JpcHRpb247XG5cblx0XHRcdGRlbGV0ZSBmaWVsZHMuZGVzY3JpcHRpb247XG5cblx0XHRcdFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoTWV0ZW9yLmNhbGwoJ3NlbmRGaWxlTWVzc2FnZScsIHRoaXMudXJsUGFyYW1zLnJpZCwgbnVsbCwgdXBsb2FkZWRGaWxlLCBmaWVsZHMpKTtcblx0XHR9KTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKCk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgncm9vbXMuc2F2ZU5vdGlmaWNhdGlvbicsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdCgpIHtcblx0XHRjb25zdCBzYXZlTm90aWZpY2F0aW9ucyA9IChub3RpZmljYXRpb25zLCByb29tSWQpID0+IHtcblx0XHRcdE9iamVjdC5rZXlzKG5vdGlmaWNhdGlvbnMpLm1hcCgobm90aWZpY2F0aW9uS2V5KSA9PiB7XG5cdFx0XHRcdE1ldGVvci5ydW5Bc1VzZXIodGhpcy51c2VySWQsICgpID0+IE1ldGVvci5jYWxsKCdzYXZlTm90aWZpY2F0aW9uU2V0dGluZ3MnLCByb29tSWQsIG5vdGlmaWNhdGlvbktleSwgbm90aWZpY2F0aW9uc1tub3RpZmljYXRpb25LZXldKSk7XG5cdFx0XHR9KTtcblx0XHR9O1xuXHRcdGNvbnN0IHsgcm9vbUlkLCBub3RpZmljYXRpb25zIH0gPSB0aGlzLmJvZHlQYXJhbXM7XG5cblx0XHRpZiAoIXJvb21JZCkge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoJ1RoZSBcXCdyb29tSWRcXCcgcGFyYW0gaXMgcmVxdWlyZWQnKTtcblx0XHR9XG5cblx0XHRpZiAoIW5vdGlmaWNhdGlvbnMgfHwgT2JqZWN0LmtleXMobm90aWZpY2F0aW9ucykubGVuZ3RoID09PSAwKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgnVGhlIFxcJ25vdGlmaWNhdGlvbnNcXCcgcGFyYW0gaXMgcmVxdWlyZWQnKTtcblx0XHR9XG5cblx0XHRzYXZlTm90aWZpY2F0aW9ucyhub3RpZmljYXRpb25zLCByb29tSWQpO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoKTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdyb29tcy5mYXZvcml0ZScsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdCgpIHtcblx0XHRjb25zdCB7IGZhdm9yaXRlIH0gPSB0aGlzLmJvZHlQYXJhbXM7XG5cblx0XHRpZiAoIXRoaXMuYm9keVBhcmFtcy5oYXNPd25Qcm9wZXJ0eSgnZmF2b3JpdGUnKSkge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoJ1RoZSBcXCdmYXZvcml0ZVxcJyBwYXJhbSBpcyByZXF1aXJlZCcpO1xuXHRcdH1cblxuXHRcdGNvbnN0IHJvb20gPSBmaW5kUm9vbUJ5SWRPck5hbWUoeyBwYXJhbXM6IHRoaXMuYm9keVBhcmFtcyB9KTtcblxuXHRcdE1ldGVvci5ydW5Bc1VzZXIodGhpcy51c2VySWQsICgpID0+IE1ldGVvci5jYWxsKCd0b2dnbGVGYXZvcml0ZScsIHJvb20uX2lkLCBmYXZvcml0ZSkpO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoKTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdyb29tcy5jbGVhbkhpc3RvcnknLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdHBvc3QoKSB7XG5cdFx0Y29uc3QgZmluZFJlc3VsdCA9IGZpbmRSb29tQnlJZE9yTmFtZSh7IHBhcmFtczogdGhpcy5ib2R5UGFyYW1zIH0pO1xuXG5cdFx0aWYgKCF0aGlzLmJvZHlQYXJhbXMubGF0ZXN0KSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgnQm9keSBwYXJhbWV0ZXIgXCJsYXRlc3RcIiBpcyByZXF1aXJlZC4nKTtcblx0XHR9XG5cblx0XHRpZiAoIXRoaXMuYm9keVBhcmFtcy5vbGRlc3QpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCdCb2R5IHBhcmFtZXRlciBcIm9sZGVzdFwiIGlzIHJlcXVpcmVkLicpO1xuXHRcdH1cblxuXHRcdGNvbnN0IGxhdGVzdCA9IG5ldyBEYXRlKHRoaXMuYm9keVBhcmFtcy5sYXRlc3QpO1xuXHRcdGNvbnN0IG9sZGVzdCA9IG5ldyBEYXRlKHRoaXMuYm9keVBhcmFtcy5vbGRlc3QpO1xuXG5cdFx0bGV0IGluY2x1c2l2ZSA9IGZhbHNlO1xuXHRcdGlmICh0eXBlb2YgdGhpcy5ib2R5UGFyYW1zLmluY2x1c2l2ZSAhPT0gJ3VuZGVmaW5lZCcpIHtcblx0XHRcdGluY2x1c2l2ZSA9IHRoaXMuYm9keVBhcmFtcy5pbmNsdXNpdmU7XG5cdFx0fVxuXG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4ge1xuXHRcdFx0TWV0ZW9yLmNhbGwoJ2NsZWFuUm9vbUhpc3RvcnknLCB7IHJvb21JZDogZmluZFJlc3VsdC5faWQsIGxhdGVzdCwgb2xkZXN0LCBpbmNsdXNpdmUgfSk7XG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2VzcygpO1xuXHR9XG59KTtcblxuIiwiUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ3N1YnNjcmlwdGlvbnMuZ2V0JywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRnZXQoKSB7XG5cdFx0Y29uc3QgeyB1cGRhdGVkU2luY2UgfSA9IHRoaXMucXVlcnlQYXJhbXM7XG5cblx0XHRsZXQgdXBkYXRlZFNpbmNlRGF0ZTtcblx0XHRpZiAodXBkYXRlZFNpbmNlKSB7XG5cdFx0XHRpZiAoaXNOYU4oRGF0ZS5wYXJzZSh1cGRhdGVkU2luY2UpKSkge1xuXHRcdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1yb29tSWQtcGFyYW0taW52YWxpZCcsICdUaGUgXCJsYXN0VXBkYXRlXCIgcXVlcnkgcGFyYW1ldGVyIG11c3QgYmUgYSB2YWxpZCBkYXRlLicpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dXBkYXRlZFNpbmNlRGF0ZSA9IG5ldyBEYXRlKHVwZGF0ZWRTaW5jZSk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0bGV0IHJlc3VsdDtcblx0XHRNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PiByZXN1bHQgPSBNZXRlb3IuY2FsbCgnc3Vic2NyaXB0aW9ucy9nZXQnLCB1cGRhdGVkU2luY2VEYXRlKSk7XG5cblx0XHRpZiAoQXJyYXkuaXNBcnJheShyZXN1bHQpKSB7XG5cdFx0XHRyZXN1bHQgPSB7XG5cdFx0XHRcdHVwZGF0ZTogcmVzdWx0LFxuXHRcdFx0XHRyZW1vdmU6IFtdXG5cdFx0XHR9O1xuXHRcdH1cblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHJlc3VsdCk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnc3Vic2NyaXB0aW9ucy5nZXRPbmUnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdGdldCgpIHtcblx0XHRjb25zdCB7IHJvb21JZCB9ID0gdGhpcy5yZXF1ZXN0UGFyYW1zKCk7XG5cblx0XHRpZiAoIXJvb21JZCkge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoJ1RoZSBcXCdyb29tSWRcXCcgcGFyYW0gaXMgcmVxdWlyZWQnKTtcblx0XHR9XG5cblx0XHRjb25zdCBzdWJzY3JpcHRpb24gPSBSb2NrZXRDaGF0Lm1vZGVscy5TdWJzY3JpcHRpb25zLmZpbmRPbmVCeVJvb21JZEFuZFVzZXJJZChyb29tSWQsIHRoaXMudXNlcklkLCB7XG5cdFx0XHRmaWVsZHM6IHtcblx0XHRcdFx0X3Jvb206IDAsXG5cdFx0XHRcdF91c2VyOiAwLFxuXHRcdFx0XHQkbG9raTogMFxuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0c3Vic2NyaXB0aW9uXG5cdFx0fSk7XG5cdH1cbn0pO1xuXG4vKipcblx0VGhpcyBBUEkgaXMgc3VwcG9zZSB0byBtYXJrIGFueSByb29tIGFzIHJlYWQuXG5cblx0TWV0aG9kOiBQT1NUXG5cdFJvdXRlOiBhcGkvdjEvc3Vic2NyaXB0aW9ucy5yZWFkXG5cdFBhcmFtczpcblx0XHQtIHJpZDogVGhlIHJpZCBvZiB0aGUgcm9vbSB0byBiZSBtYXJrZWQgYXMgcmVhZC5cbiAqL1xuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ3N1YnNjcmlwdGlvbnMucmVhZCcsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdCgpIHtcblx0XHRjaGVjayh0aGlzLmJvZHlQYXJhbXMsIHtcblx0XHRcdHJpZDogU3RyaW5nXG5cdFx0fSk7XG5cblx0XHRNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PlxuXHRcdFx0TWV0ZW9yLmNhbGwoJ3JlYWRNZXNzYWdlcycsIHRoaXMuYm9keVBhcmFtcy5yaWQpXG5cdFx0KTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKCk7XG5cdH1cbn0pO1xuXG4iLCIvKiBnbG9iYWwgcHJvY2Vzc1dlYmhvb2tNZXNzYWdlICovXG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdjaGF0LmRlbGV0ZScsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdCgpIHtcblx0XHRjaGVjayh0aGlzLmJvZHlQYXJhbXMsIE1hdGNoLk9iamVjdEluY2x1ZGluZyh7XG5cdFx0XHRtc2dJZDogU3RyaW5nLFxuXHRcdFx0cm9vbUlkOiBTdHJpbmcsXG5cdFx0XHRhc1VzZXI6IE1hdGNoLk1heWJlKEJvb2xlYW4pXG5cdFx0fSkpO1xuXG5cdFx0Y29uc3QgbXNnID0gUm9ja2V0Q2hhdC5tb2RlbHMuTWVzc2FnZXMuZmluZE9uZUJ5SWQodGhpcy5ib2R5UGFyYW1zLm1zZ0lkLCB7IGZpZWxkczogeyB1OiAxLCByaWQ6IDEgfSB9KTtcblxuXHRcdGlmICghbXNnKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZShgTm8gbWVzc2FnZSBmb3VuZCB3aXRoIHRoZSBpZCBvZiBcIiR7IHRoaXMuYm9keVBhcmFtcy5tc2dJZCB9XCIuYCk7XG5cdFx0fVxuXG5cdFx0aWYgKHRoaXMuYm9keVBhcmFtcy5yb29tSWQgIT09IG1zZy5yaWQpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCdUaGUgcm9vbSBpZCBwcm92aWRlZCBkb2VzIG5vdCBtYXRjaCB3aGVyZSB0aGUgbWVzc2FnZSBpcyBmcm9tLicpO1xuXHRcdH1cblxuXHRcdGlmICh0aGlzLmJvZHlQYXJhbXMuYXNVc2VyICYmIG1zZy51Ll9pZCAhPT0gdGhpcy51c2VySWQgJiYgIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbihNZXRlb3IudXNlcklkKCksICdmb3JjZS1kZWxldGUtbWVzc2FnZScsIG1zZy5yaWQpKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgnVW5hdXRob3JpemVkLiBZb3UgbXVzdCBoYXZlIHRoZSBwZXJtaXNzaW9uIFwiZm9yY2UtZGVsZXRlLW1lc3NhZ2VcIiB0byBkZWxldGUgb3RoZXJcXCdzIG1lc3NhZ2UgYXMgdGhlbS4nKTtcblx0XHR9XG5cblx0XHRNZXRlb3IucnVuQXNVc2VyKHRoaXMuYm9keVBhcmFtcy5hc1VzZXIgPyBtc2cudS5faWQgOiB0aGlzLnVzZXJJZCwgKCkgPT4ge1xuXHRcdFx0TWV0ZW9yLmNhbGwoJ2RlbGV0ZU1lc3NhZ2UnLCB7IF9pZDogbXNnLl9pZCB9KTtcblx0XHR9KTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdF9pZDogbXNnLl9pZCxcblx0XHRcdHRzOiBEYXRlLm5vdygpLFxuXHRcdFx0bWVzc2FnZTogbXNnXG5cdFx0fSk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnY2hhdC5zeW5jTWVzc2FnZXMnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdGdldCgpIHtcblx0XHRjb25zdCB7IHJvb21JZCwgbGFzdFVwZGF0ZSB9ID0gdGhpcy5xdWVyeVBhcmFtcztcblxuXHRcdGlmICghcm9vbUlkKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1yb29tSWQtcGFyYW0tbm90LXByb3ZpZGVkJywgJ1RoZSByZXF1aXJlZCBcInJvb21JZFwiIHF1ZXJ5IHBhcmFtIGlzIG1pc3NpbmcuJyk7XG5cdFx0fVxuXG5cdFx0aWYgKCFsYXN0VXBkYXRlKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1sYXN0VXBkYXRlLXBhcmFtLW5vdC1wcm92aWRlZCcsICdUaGUgcmVxdWlyZWQgXCJsYXN0VXBkYXRlXCIgcXVlcnkgcGFyYW0gaXMgbWlzc2luZy4nKTtcblx0XHR9IGVsc2UgaWYgKGlzTmFOKERhdGUucGFyc2UobGFzdFVwZGF0ZSkpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1yb29tSWQtcGFyYW0taW52YWxpZCcsICdUaGUgXCJsYXN0VXBkYXRlXCIgcXVlcnkgcGFyYW1ldGVyIG11c3QgYmUgYSB2YWxpZCBkYXRlLicpO1xuXHRcdH1cblxuXHRcdGxldCByZXN1bHQ7XG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4ge1xuXHRcdFx0cmVzdWx0ID0gTWV0ZW9yLmNhbGwoJ21lc3NhZ2VzL2dldCcsIHJvb21JZCwgeyBsYXN0VXBkYXRlOiBuZXcgRGF0ZShsYXN0VXBkYXRlKSB9KTtcblx0XHR9KTtcblxuXHRcdGlmICghcmVzdWx0KSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgpO1xuXHRcdH1cblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdHJlc3VsdFxuXHRcdH0pO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2NoYXQuZ2V0TWVzc2FnZScsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0Z2V0KCkge1xuXHRcdGlmICghdGhpcy5xdWVyeVBhcmFtcy5tc2dJZCkge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoJ1RoZSBcIm1zZ0lkXCIgcXVlcnkgcGFyYW1ldGVyIG11c3QgYmUgcHJvdmlkZWQuJyk7XG5cdFx0fVxuXG5cdFx0bGV0IG1zZztcblx0XHRNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PiB7XG5cdFx0XHRtc2cgPSBNZXRlb3IuY2FsbCgnZ2V0U2luZ2xlTWVzc2FnZScsIHRoaXMucXVlcnlQYXJhbXMubXNnSWQpO1xuXHRcdH0pO1xuXG5cdFx0aWYgKCFtc2cpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0bWVzc2FnZTogbXNnXG5cdFx0fSk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnY2hhdC5waW5NZXNzYWdlJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRwb3N0KCkge1xuXHRcdGlmICghdGhpcy5ib2R5UGFyYW1zLm1lc3NhZ2VJZCB8fCAhdGhpcy5ib2R5UGFyYW1zLm1lc3NhZ2VJZC50cmltKCkpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLW1lc3NhZ2VpZC1wYXJhbS1ub3QtcHJvdmlkZWQnLCAnVGhlIHJlcXVpcmVkIFwibWVzc2FnZUlkXCIgcGFyYW0gaXMgbWlzc2luZy4nKTtcblx0XHR9XG5cblx0XHRjb25zdCBtc2cgPSBSb2NrZXRDaGF0Lm1vZGVscy5NZXNzYWdlcy5maW5kT25lQnlJZCh0aGlzLmJvZHlQYXJhbXMubWVzc2FnZUlkKTtcblxuXHRcdGlmICghbXNnKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1tZXNzYWdlLW5vdC1mb3VuZCcsICdUaGUgcHJvdmlkZWQgXCJtZXNzYWdlSWRcIiBkb2VzIG5vdCBtYXRjaCBhbnkgZXhpc3RpbmcgbWVzc2FnZS4nKTtcblx0XHR9XG5cblx0XHRsZXQgcGlubmVkTWVzc2FnZTtcblx0XHRNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PiBwaW5uZWRNZXNzYWdlID0gTWV0ZW9yLmNhbGwoJ3Bpbk1lc3NhZ2UnLCBtc2cpKTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdG1lc3NhZ2U6IHBpbm5lZE1lc3NhZ2Vcblx0XHR9KTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdjaGF0LnBvc3RNZXNzYWdlJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRwb3N0KCkge1xuXHRcdGNvbnN0IG1lc3NhZ2VSZXR1cm4gPSBwcm9jZXNzV2ViaG9va01lc3NhZ2UodGhpcy5ib2R5UGFyYW1zLCB0aGlzLnVzZXIsIHVuZGVmaW5lZCwgdHJ1ZSlbMF07XG5cblx0XHRpZiAoIW1lc3NhZ2VSZXR1cm4pIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCd1bmtub3duLWVycm9yJyk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0dHM6IERhdGUubm93KCksXG5cdFx0XHRjaGFubmVsOiBtZXNzYWdlUmV0dXJuLmNoYW5uZWwsXG5cdFx0XHRtZXNzYWdlOiBtZXNzYWdlUmV0dXJuLm1lc3NhZ2Vcblx0XHR9KTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdjaGF0LnNlYXJjaCcsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0Z2V0KCkge1xuXHRcdGNvbnN0IHsgcm9vbUlkLCBzZWFyY2hUZXh0LCBsaW1pdCB9ID0gdGhpcy5xdWVyeVBhcmFtcztcblxuXHRcdGlmICghcm9vbUlkKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1yb29tSWQtcGFyYW0tbm90LXByb3ZpZGVkJywgJ1RoZSByZXF1aXJlZCBcInJvb21JZFwiIHF1ZXJ5IHBhcmFtIGlzIG1pc3NpbmcuJyk7XG5cdFx0fVxuXG5cdFx0aWYgKCFzZWFyY2hUZXh0KSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1zZWFyY2hUZXh0LXBhcmFtLW5vdC1wcm92aWRlZCcsICdUaGUgcmVxdWlyZWQgXCJzZWFyY2hUZXh0XCIgcXVlcnkgcGFyYW0gaXMgbWlzc2luZy4nKTtcblx0XHR9XG5cblx0XHRpZiAobGltaXQgJiYgKHR5cGVvZiBsaW1pdCAhPT0gJ251bWJlcicgfHwgaXNOYU4obGltaXQpIHx8IGxpbWl0IDw9IDApKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1saW1pdC1wYXJhbS1pbnZhbGlkJywgJ1RoZSBcImxpbWl0XCIgcXVlcnkgcGFyYW1ldGVyIG11c3QgYmUgYSB2YWxpZCBudW1iZXIgYW5kIGJlIGdyZWF0ZXIgdGhhbiAwLicpO1xuXHRcdH1cblxuXHRcdGxldCByZXN1bHQ7XG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4gcmVzdWx0ID0gTWV0ZW9yLmNhbGwoJ21lc3NhZ2VTZWFyY2gnLCBzZWFyY2hUZXh0LCByb29tSWQsIGxpbWl0KS5tZXNzYWdlLmRvY3MpO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0bWVzc2FnZXM6IHJlc3VsdFxuXHRcdH0pO1xuXHR9XG59KTtcblxuLy8gVGhlIGRpZmZlcmVuY2UgYmV0d2VlbiBgY2hhdC5wb3N0TWVzc2FnZWAgYW5kIGBjaGF0LnNlbmRNZXNzYWdlYCBpcyB0aGF0IGBjaGF0LnNlbmRNZXNzYWdlYCBhbGxvd3Ncbi8vIGZvciBwYXNzaW5nIGEgdmFsdWUgZm9yIGBfaWRgIGFuZCB0aGUgb3RoZXIgb25lIGRvZXNuJ3QuIEFsc28sIGBjaGF0LnNlbmRNZXNzYWdlYCBvbmx5IHNlbmRzIGl0IHRvXG4vLyBvbmUgY2hhbm5lbCB3aGVyZWFzIHRoZSBvdGhlciBvbmUgYWxsb3dzIGZvciBzZW5kaW5nIHRvIG1vcmUgdGhhbiBvbmUgY2hhbm5lbCBhdCBhIHRpbWUuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnY2hhdC5zZW5kTWVzc2FnZScsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdCgpIHtcblx0XHRpZiAoIXRoaXMuYm9keVBhcmFtcy5tZXNzYWdlKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLXBhcmFtcycsICdUaGUgXCJtZXNzYWdlXCIgcGFyYW1ldGVyIG11c3QgYmUgcHJvdmlkZWQuJyk7XG5cdFx0fVxuXG5cdFx0bGV0IG1lc3NhZ2U7XG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4gbWVzc2FnZSA9IE1ldGVvci5jYWxsKCdzZW5kTWVzc2FnZScsIHRoaXMuYm9keVBhcmFtcy5tZXNzYWdlKSk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7XG5cdFx0XHRtZXNzYWdlXG5cdFx0fSk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnY2hhdC5zdGFyTWVzc2FnZScsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdCgpIHtcblx0XHRpZiAoIXRoaXMuYm9keVBhcmFtcy5tZXNzYWdlSWQgfHwgIXRoaXMuYm9keVBhcmFtcy5tZXNzYWdlSWQudHJpbSgpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1tZXNzYWdlaWQtcGFyYW0tbm90LXByb3ZpZGVkJywgJ1RoZSByZXF1aXJlZCBcIm1lc3NhZ2VJZFwiIHBhcmFtIGlzIHJlcXVpcmVkLicpO1xuXHRcdH1cblxuXHRcdGNvbnN0IG1zZyA9IFJvY2tldENoYXQubW9kZWxzLk1lc3NhZ2VzLmZpbmRPbmVCeUlkKHRoaXMuYm9keVBhcmFtcy5tZXNzYWdlSWQpO1xuXG5cdFx0aWYgKCFtc2cpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLW1lc3NhZ2Utbm90LWZvdW5kJywgJ1RoZSBwcm92aWRlZCBcIm1lc3NhZ2VJZFwiIGRvZXMgbm90IG1hdGNoIGFueSBleGlzdGluZyBtZXNzYWdlLicpO1xuXHRcdH1cblxuXHRcdE1ldGVvci5ydW5Bc1VzZXIodGhpcy51c2VySWQsICgpID0+IE1ldGVvci5jYWxsKCdzdGFyTWVzc2FnZScsIHtcblx0XHRcdF9pZDogbXNnLl9pZCxcblx0XHRcdHJpZDogbXNnLnJpZCxcblx0XHRcdHN0YXJyZWQ6IHRydWVcblx0XHR9KSk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2VzcygpO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2NoYXQudW5QaW5NZXNzYWdlJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRwb3N0KCkge1xuXHRcdGlmICghdGhpcy5ib2R5UGFyYW1zLm1lc3NhZ2VJZCB8fCAhdGhpcy5ib2R5UGFyYW1zLm1lc3NhZ2VJZC50cmltKCkpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLW1lc3NhZ2VpZC1wYXJhbS1ub3QtcHJvdmlkZWQnLCAnVGhlIHJlcXVpcmVkIFwibWVzc2FnZUlkXCIgcGFyYW0gaXMgcmVxdWlyZWQuJyk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgbXNnID0gUm9ja2V0Q2hhdC5tb2RlbHMuTWVzc2FnZXMuZmluZE9uZUJ5SWQodGhpcy5ib2R5UGFyYW1zLm1lc3NhZ2VJZCk7XG5cblx0XHRpZiAoIW1zZykge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItbWVzc2FnZS1ub3QtZm91bmQnLCAnVGhlIHByb3ZpZGVkIFwibWVzc2FnZUlkXCIgZG9lcyBub3QgbWF0Y2ggYW55IGV4aXN0aW5nIG1lc3NhZ2UuJyk7XG5cdFx0fVxuXG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4gTWV0ZW9yLmNhbGwoJ3VucGluTWVzc2FnZScsIG1zZykpO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoKTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdjaGF0LnVuU3Rhck1lc3NhZ2UnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdHBvc3QoKSB7XG5cdFx0aWYgKCF0aGlzLmJvZHlQYXJhbXMubWVzc2FnZUlkIHx8ICF0aGlzLmJvZHlQYXJhbXMubWVzc2FnZUlkLnRyaW0oKSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItbWVzc2FnZWlkLXBhcmFtLW5vdC1wcm92aWRlZCcsICdUaGUgcmVxdWlyZWQgXCJtZXNzYWdlSWRcIiBwYXJhbSBpcyByZXF1aXJlZC4nKTtcblx0XHR9XG5cblx0XHRjb25zdCBtc2cgPSBSb2NrZXRDaGF0Lm1vZGVscy5NZXNzYWdlcy5maW5kT25lQnlJZCh0aGlzLmJvZHlQYXJhbXMubWVzc2FnZUlkKTtcblxuXHRcdGlmICghbXNnKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1tZXNzYWdlLW5vdC1mb3VuZCcsICdUaGUgcHJvdmlkZWQgXCJtZXNzYWdlSWRcIiBkb2VzIG5vdCBtYXRjaCBhbnkgZXhpc3RpbmcgbWVzc2FnZS4nKTtcblx0XHR9XG5cblx0XHRNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PiBNZXRlb3IuY2FsbCgnc3Rhck1lc3NhZ2UnLCB7XG5cdFx0XHRfaWQ6IG1zZy5faWQsXG5cdFx0XHRyaWQ6IG1zZy5yaWQsXG5cdFx0XHRzdGFycmVkOiBmYWxzZVxuXHRcdH0pKTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKCk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnY2hhdC51cGRhdGUnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdHBvc3QoKSB7XG5cdFx0Y2hlY2sodGhpcy5ib2R5UGFyYW1zLCBNYXRjaC5PYmplY3RJbmNsdWRpbmcoe1xuXHRcdFx0cm9vbUlkOiBTdHJpbmcsXG5cdFx0XHRtc2dJZDogU3RyaW5nLFxuXHRcdFx0dGV4dDogU3RyaW5nIC8vVXNpbmcgdGV4dCB0byBiZSBjb25zaXN0YW50IHdpdGggY2hhdC5wb3N0TWVzc2FnZVxuXHRcdH0pKTtcblxuXHRcdGNvbnN0IG1zZyA9IFJvY2tldENoYXQubW9kZWxzLk1lc3NhZ2VzLmZpbmRPbmVCeUlkKHRoaXMuYm9keVBhcmFtcy5tc2dJZCk7XG5cblx0XHQvL0Vuc3VyZSB0aGUgbWVzc2FnZSBleGlzdHNcblx0XHRpZiAoIW1zZykge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoYE5vIG1lc3NhZ2UgZm91bmQgd2l0aCB0aGUgaWQgb2YgXCIkeyB0aGlzLmJvZHlQYXJhbXMubXNnSWQgfVwiLmApO1xuXHRcdH1cblxuXHRcdGlmICh0aGlzLmJvZHlQYXJhbXMucm9vbUlkICE9PSBtc2cucmlkKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgnVGhlIHJvb20gaWQgcHJvdmlkZWQgZG9lcyBub3QgbWF0Y2ggd2hlcmUgdGhlIG1lc3NhZ2UgaXMgZnJvbS4nKTtcblx0XHR9XG5cblx0XHQvL1Blcm1pc3Npb24gY2hlY2tzIGFyZSBhbHJlYWR5IGRvbmUgaW4gdGhlIHVwZGF0ZU1lc3NhZ2UgbWV0aG9kLCBzbyBubyBuZWVkIHRvIGR1cGxpY2F0ZSB0aGVtXG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4ge1xuXHRcdFx0TWV0ZW9yLmNhbGwoJ3VwZGF0ZU1lc3NhZ2UnLCB7IF9pZDogbXNnLl9pZCwgbXNnOiB0aGlzLmJvZHlQYXJhbXMudGV4dCwgcmlkOiBtc2cucmlkIH0pO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0bWVzc2FnZTogUm9ja2V0Q2hhdC5tb2RlbHMuTWVzc2FnZXMuZmluZE9uZUJ5SWQobXNnLl9pZClcblx0XHR9KTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdjaGF0LnJlYWN0JywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRwb3N0KCkge1xuXHRcdGlmICghdGhpcy5ib2R5UGFyYW1zLm1lc3NhZ2VJZCB8fCAhdGhpcy5ib2R5UGFyYW1zLm1lc3NhZ2VJZC50cmltKCkpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLW1lc3NhZ2VpZC1wYXJhbS1ub3QtcHJvdmlkZWQnLCAnVGhlIHJlcXVpcmVkIFwibWVzc2FnZUlkXCIgcGFyYW0gaXMgbWlzc2luZy4nKTtcblx0XHR9XG5cblx0XHRjb25zdCBtc2cgPSBSb2NrZXRDaGF0Lm1vZGVscy5NZXNzYWdlcy5maW5kT25lQnlJZCh0aGlzLmJvZHlQYXJhbXMubWVzc2FnZUlkKTtcblxuXHRcdGlmICghbXNnKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1tZXNzYWdlLW5vdC1mb3VuZCcsICdUaGUgcHJvdmlkZWQgXCJtZXNzYWdlSWRcIiBkb2VzIG5vdCBtYXRjaCBhbnkgZXhpc3RpbmcgbWVzc2FnZS4nKTtcblx0XHR9XG5cblx0XHRjb25zdCBlbW9qaSA9IHRoaXMuYm9keVBhcmFtcy5lbW9qaSB8fCB0aGlzLmJvZHlQYXJhbXMucmVhY3Rpb247XG5cblx0XHRpZiAoIWVtb2ppKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1lbW9qaS1wYXJhbS1ub3QtcHJvdmlkZWQnLCAnVGhlIHJlcXVpcmVkIFwiZW1vamlcIiBwYXJhbSBpcyBtaXNzaW5nLicpO1xuXHRcdH1cblxuXHRcdE1ldGVvci5ydW5Bc1VzZXIodGhpcy51c2VySWQsICgpID0+IE1ldGVvci5jYWxsKCdzZXRSZWFjdGlvbicsIGVtb2ppLCBtc2cuX2lkKSk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2VzcygpO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2NoYXQuZ2V0TWVzc2FnZVJlYWRSZWNlaXB0cycsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0Z2V0KCkge1xuXHRcdGNvbnN0IHsgbWVzc2FnZUlkIH0gPSB0aGlzLnF1ZXJ5UGFyYW1zO1xuXHRcdGlmICghbWVzc2FnZUlkKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSh7XG5cdFx0XHRcdGVycm9yOiAnVGhlIHJlcXVpcmVkIFxcJ21lc3NhZ2VJZFxcJyBwYXJhbSBpcyBtaXNzaW5nLidcblx0XHRcdH0pO1xuXHRcdH1cblxuXHRcdHRyeSB7XG5cdFx0XHRjb25zdCBtZXNzYWdlUmVhZFJlY2VpcHRzID0gTWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4gTWV0ZW9yLmNhbGwoJ2dldFJlYWRSZWNlaXB0cycsIHsgbWVzc2FnZUlkIH0pKTtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdFx0cmVjZWlwdHM6IG1lc3NhZ2VSZWFkUmVjZWlwdHNcblx0XHRcdH0pO1xuXHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSh7XG5cdFx0XHRcdGVycm9yOiBlcnJvci5tZXNzYWdlXG5cdFx0XHR9KTtcblx0XHR9XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnY2hhdC5yZXBvcnRNZXNzYWdlJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRwb3N0KCkge1xuXHRcdGNvbnN0IHsgbWVzc2FnZUlkLCBkZXNjcmlwdGlvbiB9ID0gdGhpcy5ib2R5UGFyYW1zO1xuXHRcdGlmICghbWVzc2FnZUlkKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgnVGhlIHJlcXVpcmVkIFwibWVzc2FnZUlkXCIgcGFyYW0gaXMgbWlzc2luZy4nKTtcblx0XHR9XG5cblx0XHRpZiAoIWRlc2NyaXB0aW9uKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgnVGhlIHJlcXVpcmVkIFwiZGVzY3JpcHRpb25cIiBwYXJhbSBpcyBtaXNzaW5nLicpO1xuXHRcdH1cblxuXHRcdE1ldGVvci5ydW5Bc1VzZXIodGhpcy51c2VySWQsICgpID0+IE1ldGVvci5jYWxsKCdyZXBvcnRNZXNzYWdlJywgbWVzc2FnZUlkLCBkZXNjcmlwdGlvbikpO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoKTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdjaGF0Lmlnbm9yZVVzZXInLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdGdldCgpIHtcblx0XHRjb25zdCB7IHJpZCwgdXNlcklkIH0gPSB0aGlzLnF1ZXJ5UGFyYW1zO1xuXHRcdGxldCB7IGlnbm9yZSA9IHRydWUgfSA9IHRoaXMucXVlcnlQYXJhbXM7XG5cblx0XHRpZ25vcmUgPSB0eXBlb2YgaWdub3JlID09PSAnc3RyaW5nJyA/IC90cnVlfDEvLnRlc3QoaWdub3JlKSA6IGlnbm9yZTtcblxuXHRcdGlmICghcmlkIHx8ICFyaWQudHJpbSgpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1yb29tLWlkLXBhcmFtLW5vdC1wcm92aWRlZCcsICdUaGUgcmVxdWlyZWQgXCJyaWRcIiBwYXJhbSBpcyBtaXNzaW5nLicpO1xuXHRcdH1cblxuXHRcdGlmICghdXNlcklkIHx8ICF1c2VySWQudHJpbSgpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci11c2VyLWlkLXBhcmFtLW5vdC1wcm92aWRlZCcsICdUaGUgcmVxdWlyZWQgXCJ1c2VySWRcIiBwYXJhbSBpcyBtaXNzaW5nLicpO1xuXHRcdH1cblxuXHRcdE1ldGVvci5ydW5Bc1VzZXIodGhpcy51c2VySWQsICgpID0+IE1ldGVvci5jYWxsKCdpZ25vcmVVc2VyJywgeyByaWQsIHVzZXJJZCwgaWdub3JlIH0pKTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKCk7XG5cdH1cbn0pO1xuIiwiUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2NvbW1hbmRzLmdldCcsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0Z2V0KCkge1xuXHRcdGNvbnN0IHBhcmFtcyA9IHRoaXMucXVlcnlQYXJhbXM7XG5cblx0XHRpZiAodHlwZW9mIHBhcmFtcy5jb21tYW5kICE9PSAnc3RyaW5nJykge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoJ1RoZSBxdWVyeSBwYXJhbSBcImNvbW1hbmRcIiBtdXN0IGJlIHByb3ZpZGVkLicpO1xuXHRcdH1cblxuXHRcdGNvbnN0IGNtZCA9IFJvY2tldENoYXQuc2xhc2hDb21tYW5kcy5jb21tYW5kc1twYXJhbXMuY29tbWFuZC50b0xvd2VyQ2FzZSgpXTtcblxuXHRcdGlmICghY21kKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZShgVGhlcmUgaXMgbm8gY29tbWFuZCBpbiB0aGUgc3lzdGVtIGJ5IHRoZSBuYW1lIG9mOiAkeyBwYXJhbXMuY29tbWFuZCB9YCk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoeyBjb21tYW5kOiBjbWQgfSk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnY29tbWFuZHMubGlzdCcsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0Z2V0KCkge1xuXHRcdGNvbnN0IHsgb2Zmc2V0LCBjb3VudCB9ID0gdGhpcy5nZXRQYWdpbmF0aW9uSXRlbXMoKTtcblx0XHRjb25zdCB7IHNvcnQsIGZpZWxkcywgcXVlcnkgfSA9IHRoaXMucGFyc2VKc29uUXVlcnkoKTtcblxuXHRcdGxldCBjb21tYW5kcyA9IE9iamVjdC52YWx1ZXMoUm9ja2V0Q2hhdC5zbGFzaENvbW1hbmRzLmNvbW1hbmRzKTtcblxuXHRcdGlmIChxdWVyeSAmJiBxdWVyeS5jb21tYW5kKSB7XG5cdFx0XHRjb21tYW5kcyA9IGNvbW1hbmRzLmZpbHRlcigoY29tbWFuZCkgPT4gY29tbWFuZC5jb21tYW5kID09PSBxdWVyeS5jb21tYW5kKTtcblx0XHR9XG5cblx0XHRjb25zdCB0b3RhbENvdW50ID0gY29tbWFuZHMubGVuZ3RoO1xuXHRcdGNvbW1hbmRzID0gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMucHJvY2Vzc1F1ZXJ5T3B0aW9uc09uUmVzdWx0KGNvbW1hbmRzLCB7XG5cdFx0XHRzb3J0OiBzb3J0ID8gc29ydCA6IHsgbmFtZTogMSB9LFxuXHRcdFx0c2tpcDogb2Zmc2V0LFxuXHRcdFx0bGltaXQ6IGNvdW50LFxuXHRcdFx0ZmllbGRzXG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7XG5cdFx0XHRjb21tYW5kcyxcblx0XHRcdG9mZnNldCxcblx0XHRcdGNvdW50OiBjb21tYW5kcy5sZW5ndGgsXG5cdFx0XHR0b3RhbDogdG90YWxDb3VudFxuXHRcdH0pO1xuXHR9XG59KTtcblxuLy8gRXhwZWN0cyBhIGJvZHkgb2Y6IHsgY29tbWFuZDogJ2dpbW1lJywgcGFyYW1zOiAnYW55IHN0cmluZyB2YWx1ZScsIHJvb21JZDogJ3ZhbHVlJyB9XG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnY29tbWFuZHMucnVuJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRwb3N0KCkge1xuXHRcdGNvbnN0IGJvZHkgPSB0aGlzLmJvZHlQYXJhbXM7XG5cdFx0Y29uc3QgdXNlciA9IHRoaXMuZ2V0TG9nZ2VkSW5Vc2VyKCk7XG5cblx0XHRpZiAodHlwZW9mIGJvZHkuY29tbWFuZCAhPT0gJ3N0cmluZycpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCdZb3UgbXVzdCBwcm92aWRlIGEgY29tbWFuZCB0byBydW4uJyk7XG5cdFx0fVxuXG5cdFx0aWYgKGJvZHkucGFyYW1zICYmIHR5cGVvZiBib2R5LnBhcmFtcyAhPT0gJ3N0cmluZycpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCdUaGUgcGFyYW1ldGVycyBmb3IgdGhlIGNvbW1hbmQgbXVzdCBiZSBhIHNpbmdsZSBzdHJpbmcuJyk7XG5cdFx0fVxuXG5cdFx0aWYgKHR5cGVvZiBib2R5LnJvb21JZCAhPT0gJ3N0cmluZycpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCdUaGUgcm9vbVxcJ3MgaWQgd2hlcmUgdG8gZXhlY3V0ZSB0aGlzIGNvbW1hbmQgbXVzdCBwcm92aWRlZCBhbmQgYmUgYSBzdHJpbmcuJyk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgY21kID0gYm9keS5jb21tYW5kLnRvTG93ZXJDYXNlKCk7XG5cdFx0aWYgKCFSb2NrZXRDaGF0LnNsYXNoQ29tbWFuZHMuY29tbWFuZHNbYm9keS5jb21tYW5kLnRvTG93ZXJDYXNlKCldKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgnVGhlIGNvbW1hbmQgcHJvdmlkZWQgZG9lcyBub3QgZXhpc3QgKG9yIGlzIGRpc2FibGVkKS4nKTtcblx0XHR9XG5cblx0XHQvLyBUaGlzIHdpbGwgdGhyb3cgYW4gZXJyb3IgaWYgdGhleSBjYW4ndCBvciB0aGUgcm9vbSBpcyBpbnZhbGlkXG5cdFx0TWV0ZW9yLmNhbGwoJ2NhbkFjY2Vzc1Jvb20nLCBib2R5LnJvb21JZCwgdXNlci5faWQpO1xuXG5cdFx0Y29uc3QgcGFyYW1zID0gYm9keS5wYXJhbXMgPyBib2R5LnBhcmFtcyA6ICcnO1xuXG5cdFx0bGV0IHJlc3VsdDtcblx0XHRNZXRlb3IucnVuQXNVc2VyKHVzZXIuX2lkLCAoKSA9PiB7XG5cdFx0XHRyZXN1bHQgPSBSb2NrZXRDaGF0LnNsYXNoQ29tbWFuZHMucnVuKGNtZCwgcGFyYW1zLCB7XG5cdFx0XHRcdF9pZDogUmFuZG9tLmlkKCksXG5cdFx0XHRcdHJpZDogYm9keS5yb29tSWQsXG5cdFx0XHRcdG1zZzogYC8keyBjbWQgfSAkeyBwYXJhbXMgfWBcblx0XHRcdH0pO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoeyByZXN1bHQgfSk7XG5cdH1cbn0pO1xuIiwiUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2Vtb2ppLWN1c3RvbScsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0Z2V0KCkge1xuXHRcdGNvbnN0IGVtb2ppcyA9IE1ldGVvci5jYWxsKCdsaXN0RW1vamlDdXN0b20nKTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHsgZW1vamlzIH0pO1xuXHR9XG59KTtcbiIsImltcG9ydCBfIGZyb20gJ3VuZGVyc2NvcmUnO1xuXG4vL1JldHVybnMgdGhlIHByaXZhdGUgZ3JvdXAgc3Vic2NyaXB0aW9uIElGIGZvdW5kIG90aGVyd2lzZSBpdCB3aWxsIHJldHVybiB0aGUgZmFpbHVyZSBvZiB3aHkgaXQgZGlkbid0LiBDaGVjayB0aGUgYHN0YXR1c0NvZGVgIHByb3BlcnR5XG5mdW5jdGlvbiBmaW5kUHJpdmF0ZUdyb3VwQnlJZE9yTmFtZSh7IHBhcmFtcywgdXNlcklkLCBjaGVja2VkQXJjaGl2ZWQgPSB0cnVlIH0pIHtcblx0aWYgKCghcGFyYW1zLnJvb21JZCB8fCAhcGFyYW1zLnJvb21JZC50cmltKCkpICYmICghcGFyYW1zLnJvb21OYW1lIHx8ICFwYXJhbXMucm9vbU5hbWUudHJpbSgpKSkge1xuXHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLXJvb20tcGFyYW0tbm90LXByb3ZpZGVkJywgJ1RoZSBwYXJhbWV0ZXIgXCJyb29tSWRcIiBvciBcInJvb21OYW1lXCIgaXMgcmVxdWlyZWQnKTtcblx0fVxuXG5cdGxldCByb29tU3ViO1xuXHRpZiAocGFyYW1zLnJvb21JZCkge1xuXHRcdHJvb21TdWIgPSBSb2NrZXRDaGF0Lm1vZGVscy5TdWJzY3JpcHRpb25zLmZpbmRPbmVCeVJvb21JZEFuZFVzZXJJZChwYXJhbXMucm9vbUlkLCB1c2VySWQpO1xuXHR9IGVsc2UgaWYgKHBhcmFtcy5yb29tTmFtZSkge1xuXHRcdHJvb21TdWIgPSBSb2NrZXRDaGF0Lm1vZGVscy5TdWJzY3JpcHRpb25zLmZpbmRPbmVCeVJvb21OYW1lQW5kVXNlcklkKHBhcmFtcy5yb29tTmFtZSwgdXNlcklkKTtcblx0fVxuXG5cdGlmICghcm9vbVN1YiB8fCByb29tU3ViLnQgIT09ICdwJykge1xuXHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLXJvb20tbm90LWZvdW5kJywgJ1RoZSByZXF1aXJlZCBcInJvb21JZFwiIG9yIFwicm9vbU5hbWVcIiBwYXJhbSBwcm92aWRlZCBkb2VzIG5vdCBtYXRjaCBhbnkgZ3JvdXAnKTtcblx0fVxuXG5cdGlmIChjaGVja2VkQXJjaGl2ZWQgJiYgcm9vbVN1Yi5hcmNoaXZlZCkge1xuXHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLXJvb20tYXJjaGl2ZWQnLCBgVGhlIHByaXZhdGUgZ3JvdXAsICR7IHJvb21TdWIubmFtZSB9LCBpcyBhcmNoaXZlZGApO1xuXHR9XG5cblx0cmV0dXJuIHJvb21TdWI7XG59XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdncm91cHMuYWRkQWxsJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRwb3N0KCkge1xuXHRcdGNvbnN0IGZpbmRSZXN1bHQgPSBmaW5kUHJpdmF0ZUdyb3VwQnlJZE9yTmFtZSh7IHBhcmFtczogdGhpcy5yZXF1ZXN0UGFyYW1zKCksIHVzZXJJZDogdGhpcy51c2VySWQgfSk7XG5cblx0XHRNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PiB7XG5cdFx0XHRNZXRlb3IuY2FsbCgnYWRkQWxsVXNlclRvUm9vbScsIGZpbmRSZXN1bHQucmlkLCB0aGlzLmJvZHlQYXJhbXMuYWN0aXZlVXNlcnNPbmx5KTtcblx0XHR9KTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdGdyb3VwOiBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT25lQnlJZChmaW5kUmVzdWx0LnJpZCwgeyBmaWVsZHM6IFJvY2tldENoYXQuQVBJLnYxLmRlZmF1bHRGaWVsZHNUb0V4Y2x1ZGUgfSlcblx0XHR9KTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdncm91cHMuYWRkTW9kZXJhdG9yJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRwb3N0KCkge1xuXHRcdGNvbnN0IGZpbmRSZXN1bHQgPSBmaW5kUHJpdmF0ZUdyb3VwQnlJZE9yTmFtZSh7IHBhcmFtczogdGhpcy5yZXF1ZXN0UGFyYW1zKCksIHVzZXJJZDogdGhpcy51c2VySWQgfSk7XG5cblx0XHRjb25zdCB1c2VyID0gdGhpcy5nZXRVc2VyRnJvbVBhcmFtcygpO1xuXG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4ge1xuXHRcdFx0TWV0ZW9yLmNhbGwoJ2FkZFJvb21Nb2RlcmF0b3InLCBmaW5kUmVzdWx0LnJpZCwgdXNlci5faWQpO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoKTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdncm91cHMuYWRkT3duZXInLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdHBvc3QoKSB7XG5cdFx0Y29uc3QgZmluZFJlc3VsdCA9IGZpbmRQcml2YXRlR3JvdXBCeUlkT3JOYW1lKHsgcGFyYW1zOiB0aGlzLnJlcXVlc3RQYXJhbXMoKSwgdXNlcklkOiB0aGlzLnVzZXJJZCB9KTtcblxuXHRcdGNvbnN0IHVzZXIgPSB0aGlzLmdldFVzZXJGcm9tUGFyYW1zKCk7XG5cblx0XHRNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PiB7XG5cdFx0XHRNZXRlb3IuY2FsbCgnYWRkUm9vbU93bmVyJywgZmluZFJlc3VsdC5yaWQsIHVzZXIuX2lkKTtcblx0XHR9KTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKCk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnZ3JvdXBzLmFkZExlYWRlcicsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdCgpIHtcblx0XHRjb25zdCBmaW5kUmVzdWx0ID0gZmluZFByaXZhdGVHcm91cEJ5SWRPck5hbWUoeyBwYXJhbXM6IHRoaXMucmVxdWVzdFBhcmFtcygpLCB1c2VySWQ6IHRoaXMudXNlcklkIH0pO1xuXHRcdGNvbnN0IHVzZXIgPSB0aGlzLmdldFVzZXJGcm9tUGFyYW1zKCk7XG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4ge1xuXHRcdFx0TWV0ZW9yLmNhbGwoJ2FkZFJvb21MZWFkZXInLCBmaW5kUmVzdWx0LnJpZCwgdXNlci5faWQpO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoKTtcblx0fVxufSk7XG5cbi8vQXJjaGl2ZXMgYSBwcml2YXRlIGdyb3VwIG9ubHkgaWYgaXQgd2Fzbid0XG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnZ3JvdXBzLmFyY2hpdmUnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdHBvc3QoKSB7XG5cdFx0Y29uc3QgZmluZFJlc3VsdCA9IGZpbmRQcml2YXRlR3JvdXBCeUlkT3JOYW1lKHsgcGFyYW1zOiB0aGlzLnJlcXVlc3RQYXJhbXMoKSwgdXNlcklkOiB0aGlzLnVzZXJJZCB9KTtcblxuXHRcdE1ldGVvci5ydW5Bc1VzZXIodGhpcy51c2VySWQsICgpID0+IHtcblx0XHRcdE1ldGVvci5jYWxsKCdhcmNoaXZlUm9vbScsIGZpbmRSZXN1bHQucmlkKTtcblx0XHR9KTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKCk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnZ3JvdXBzLmNsb3NlJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRwb3N0KCkge1xuXHRcdGNvbnN0IGZpbmRSZXN1bHQgPSBmaW5kUHJpdmF0ZUdyb3VwQnlJZE9yTmFtZSh7IHBhcmFtczogdGhpcy5yZXF1ZXN0UGFyYW1zKCksIHVzZXJJZDogdGhpcy51c2VySWQsIGNoZWNrZWRBcmNoaXZlZDogZmFsc2UgfSk7XG5cblx0XHRpZiAoIWZpbmRSZXN1bHQub3Blbikge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoYFRoZSBwcml2YXRlIGdyb3VwLCAkeyBmaW5kUmVzdWx0Lm5hbWUgfSwgaXMgYWxyZWFkeSBjbG9zZWQgdG8gdGhlIHNlbmRlcmApO1xuXHRcdH1cblxuXHRcdE1ldGVvci5ydW5Bc1VzZXIodGhpcy51c2VySWQsICgpID0+IHtcblx0XHRcdE1ldGVvci5jYWxsKCdoaWRlUm9vbScsIGZpbmRSZXN1bHQucmlkKTtcblx0XHR9KTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKCk7XG5cdH1cbn0pO1xuXG4vL0NyZWF0ZSBQcml2YXRlIEdyb3VwXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnZ3JvdXBzLmNyZWF0ZScsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdCgpIHtcblx0XHRpZiAoIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih0aGlzLnVzZXJJZCwgJ2NyZWF0ZS1wJykpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS51bmF1dGhvcml6ZWQoKTtcblx0XHR9XG5cblx0XHRpZiAoIXRoaXMuYm9keVBhcmFtcy5uYW1lKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgnQm9keSBwYXJhbSBcIm5hbWVcIiBpcyByZXF1aXJlZCcpO1xuXHRcdH1cblxuXHRcdGlmICh0aGlzLmJvZHlQYXJhbXMubWVtYmVycyAmJiAhXy5pc0FycmF5KHRoaXMuYm9keVBhcmFtcy5tZW1iZXJzKSkge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoJ0JvZHkgcGFyYW0gXCJtZW1iZXJzXCIgbXVzdCBiZSBhbiBhcnJheSBpZiBwcm92aWRlZCcpO1xuXHRcdH1cblxuXHRcdGlmICh0aGlzLmJvZHlQYXJhbXMuY3VzdG9tRmllbGRzICYmICEodHlwZW9mIHRoaXMuYm9keVBhcmFtcy5jdXN0b21GaWVsZHMgPT09ICdvYmplY3QnKSkge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoJ0JvZHkgcGFyYW0gXCJjdXN0b21GaWVsZHNcIiBtdXN0IGJlIGFuIG9iamVjdCBpZiBwcm92aWRlZCcpO1xuXHRcdH1cblxuXHRcdGxldCByZWFkT25seSA9IGZhbHNlO1xuXHRcdGlmICh0eXBlb2YgdGhpcy5ib2R5UGFyYW1zLnJlYWRPbmx5ICE9PSAndW5kZWZpbmVkJykge1xuXHRcdFx0cmVhZE9ubHkgPSB0aGlzLmJvZHlQYXJhbXMucmVhZE9ubHk7XG5cdFx0fVxuXG5cdFx0bGV0IGlkO1xuXHRcdE1ldGVvci5ydW5Bc1VzZXIodGhpcy51c2VySWQsICgpID0+IHtcblx0XHRcdGlkID0gTWV0ZW9yLmNhbGwoJ2NyZWF0ZVByaXZhdGVHcm91cCcsIHRoaXMuYm9keVBhcmFtcy5uYW1lLCB0aGlzLmJvZHlQYXJhbXMubWVtYmVycyA/IHRoaXMuYm9keVBhcmFtcy5tZW1iZXJzIDogW10sIHJlYWRPbmx5LCB0aGlzLmJvZHlQYXJhbXMuY3VzdG9tRmllbGRzKTtcblx0XHR9KTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdGdyb3VwOiBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT25lQnlJZChpZC5yaWQsIHsgZmllbGRzOiBSb2NrZXRDaGF0LkFQSS52MS5kZWZhdWx0RmllbGRzVG9FeGNsdWRlIH0pXG5cdFx0fSk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnZ3JvdXBzLmRlbGV0ZScsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdCgpIHtcblx0XHRjb25zdCBmaW5kUmVzdWx0ID0gZmluZFByaXZhdGVHcm91cEJ5SWRPck5hbWUoeyBwYXJhbXM6IHRoaXMucmVxdWVzdFBhcmFtcygpLCB1c2VySWQ6IHRoaXMudXNlcklkLCBjaGVja2VkQXJjaGl2ZWQ6IGZhbHNlIH0pO1xuXG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4ge1xuXHRcdFx0TWV0ZW9yLmNhbGwoJ2VyYXNlUm9vbScsIGZpbmRSZXN1bHQucmlkKTtcblx0XHR9KTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdGdyb3VwOiBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5wcm9jZXNzUXVlcnlPcHRpb25zT25SZXN1bHQoW2ZpbmRSZXN1bHQuX3Jvb21dLCB7IGZpZWxkczogUm9ja2V0Q2hhdC5BUEkudjEuZGVmYXVsdEZpZWxkc1RvRXhjbHVkZSB9KVswXVxuXHRcdH0pO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2dyb3Vwcy5maWxlcycsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0Z2V0KCkge1xuXHRcdGNvbnN0IGZpbmRSZXN1bHQgPSBmaW5kUHJpdmF0ZUdyb3VwQnlJZE9yTmFtZSh7IHBhcmFtczogdGhpcy5yZXF1ZXN0UGFyYW1zKCksIHVzZXJJZDogdGhpcy51c2VySWQsIGNoZWNrZWRBcmNoaXZlZDogZmFsc2UgfSk7XG5cdFx0Y29uc3QgYWRkVXNlck9iamVjdFRvRXZlcnlPYmplY3QgPSAoZmlsZSkgPT4ge1xuXHRcdFx0aWYgKGZpbGUudXNlcklkKSB7XG5cdFx0XHRcdGZpbGUgPSB0aGlzLmluc2VydFVzZXJPYmplY3QoeyBvYmplY3Q6IGZpbGUsIHVzZXJJZDogZmlsZS51c2VySWQgfSk7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gZmlsZTtcblx0XHR9O1xuXG5cdFx0Y29uc3QgeyBvZmZzZXQsIGNvdW50IH0gPSB0aGlzLmdldFBhZ2luYXRpb25JdGVtcygpO1xuXHRcdGNvbnN0IHsgc29ydCwgZmllbGRzLCBxdWVyeSB9ID0gdGhpcy5wYXJzZUpzb25RdWVyeSgpO1xuXG5cdFx0Y29uc3Qgb3VyUXVlcnkgPSBPYmplY3QuYXNzaWduKHt9LCBxdWVyeSwgeyByaWQ6IGZpbmRSZXN1bHQucmlkIH0pO1xuXG5cdFx0Y29uc3QgZmlsZXMgPSBSb2NrZXRDaGF0Lm1vZGVscy5VcGxvYWRzLmZpbmQob3VyUXVlcnksIHtcblx0XHRcdHNvcnQ6IHNvcnQgPyBzb3J0IDogeyBuYW1lOiAxIH0sXG5cdFx0XHRza2lwOiBvZmZzZXQsXG5cdFx0XHRsaW1pdDogY291bnQsXG5cdFx0XHRmaWVsZHNcblx0XHR9KS5mZXRjaCgpO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0ZmlsZXM6IGZpbGVzLm1hcChhZGRVc2VyT2JqZWN0VG9FdmVyeU9iamVjdCksXG5cdFx0XHRjb3VudDogZmlsZXMubGVuZ3RoLFxuXHRcdFx0b2Zmc2V0LFxuXHRcdFx0dG90YWw6IFJvY2tldENoYXQubW9kZWxzLlVwbG9hZHMuZmluZChvdXJRdWVyeSkuY291bnQoKVxuXHRcdH0pO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2dyb3Vwcy5nZXRJbnRlZ3JhdGlvbnMnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdGdldCgpIHtcblx0XHRpZiAoIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih0aGlzLnVzZXJJZCwgJ21hbmFnZS1pbnRlZ3JhdGlvbnMnKSkge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnVuYXV0aG9yaXplZCgpO1xuXHRcdH1cblxuXHRcdGNvbnN0IGZpbmRSZXN1bHQgPSBmaW5kUHJpdmF0ZUdyb3VwQnlJZE9yTmFtZSh7IHBhcmFtczogdGhpcy5yZXF1ZXN0UGFyYW1zKCksIHVzZXJJZDogdGhpcy51c2VySWQsIGNoZWNrZWRBcmNoaXZlZDogZmFsc2UgfSk7XG5cblx0XHRsZXQgaW5jbHVkZUFsbFByaXZhdGVHcm91cHMgPSB0cnVlO1xuXHRcdGlmICh0eXBlb2YgdGhpcy5xdWVyeVBhcmFtcy5pbmNsdWRlQWxsUHJpdmF0ZUdyb3VwcyAhPT0gJ3VuZGVmaW5lZCcpIHtcblx0XHRcdGluY2x1ZGVBbGxQcml2YXRlR3JvdXBzID0gdGhpcy5xdWVyeVBhcmFtcy5pbmNsdWRlQWxsUHJpdmF0ZUdyb3VwcyA9PT0gJ3RydWUnO1xuXHRcdH1cblxuXHRcdGNvbnN0IGNoYW5uZWxzVG9TZWFyY2ggPSBbYCMkeyBmaW5kUmVzdWx0Lm5hbWUgfWBdO1xuXHRcdGlmIChpbmNsdWRlQWxsUHJpdmF0ZUdyb3Vwcykge1xuXHRcdFx0Y2hhbm5lbHNUb1NlYXJjaC5wdXNoKCdhbGxfcHJpdmF0ZV9ncm91cHMnKTtcblx0XHR9XG5cblx0XHRjb25zdCB7IG9mZnNldCwgY291bnQgfSA9IHRoaXMuZ2V0UGFnaW5hdGlvbkl0ZW1zKCk7XG5cdFx0Y29uc3QgeyBzb3J0LCBmaWVsZHMsIHF1ZXJ5IH0gPSB0aGlzLnBhcnNlSnNvblF1ZXJ5KCk7XG5cblx0XHRjb25zdCBvdXJRdWVyeSA9IE9iamVjdC5hc3NpZ24oe30sIHF1ZXJ5LCB7IGNoYW5uZWw6IHsgJGluOiBjaGFubmVsc1RvU2VhcmNoIH0gfSk7XG5cdFx0Y29uc3QgaW50ZWdyYXRpb25zID0gUm9ja2V0Q2hhdC5tb2RlbHMuSW50ZWdyYXRpb25zLmZpbmQob3VyUXVlcnksIHtcblx0XHRcdHNvcnQ6IHNvcnQgPyBzb3J0IDogeyBfY3JlYXRlZEF0OiAxIH0sXG5cdFx0XHRza2lwOiBvZmZzZXQsXG5cdFx0XHRsaW1pdDogY291bnQsXG5cdFx0XHRmaWVsZHNcblx0XHR9KS5mZXRjaCgpO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0aW50ZWdyYXRpb25zLFxuXHRcdFx0Y291bnQ6IGludGVncmF0aW9ucy5sZW5ndGgsXG5cdFx0XHRvZmZzZXQsXG5cdFx0XHR0b3RhbDogUm9ja2V0Q2hhdC5tb2RlbHMuSW50ZWdyYXRpb25zLmZpbmQob3VyUXVlcnkpLmNvdW50KClcblx0XHR9KTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdncm91cHMuaGlzdG9yeScsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0Z2V0KCkge1xuXHRcdGNvbnN0IGZpbmRSZXN1bHQgPSBmaW5kUHJpdmF0ZUdyb3VwQnlJZE9yTmFtZSh7IHBhcmFtczogdGhpcy5yZXF1ZXN0UGFyYW1zKCksIHVzZXJJZDogdGhpcy51c2VySWQsIGNoZWNrZWRBcmNoaXZlZDogZmFsc2UgfSk7XG5cblx0XHRsZXQgbGF0ZXN0RGF0ZSA9IG5ldyBEYXRlKCk7XG5cdFx0aWYgKHRoaXMucXVlcnlQYXJhbXMubGF0ZXN0KSB7XG5cdFx0XHRsYXRlc3REYXRlID0gbmV3IERhdGUodGhpcy5xdWVyeVBhcmFtcy5sYXRlc3QpO1xuXHRcdH1cblxuXHRcdGxldCBvbGRlc3REYXRlID0gdW5kZWZpbmVkO1xuXHRcdGlmICh0aGlzLnF1ZXJ5UGFyYW1zLm9sZGVzdCkge1xuXHRcdFx0b2xkZXN0RGF0ZSA9IG5ldyBEYXRlKHRoaXMucXVlcnlQYXJhbXMub2xkZXN0KTtcblx0XHR9XG5cblx0XHRsZXQgaW5jbHVzaXZlID0gZmFsc2U7XG5cdFx0aWYgKHRoaXMucXVlcnlQYXJhbXMuaW5jbHVzaXZlKSB7XG5cdFx0XHRpbmNsdXNpdmUgPSB0aGlzLnF1ZXJ5UGFyYW1zLmluY2x1c2l2ZTtcblx0XHR9XG5cblx0XHRsZXQgY291bnQgPSAyMDtcblx0XHRpZiAodGhpcy5xdWVyeVBhcmFtcy5jb3VudCkge1xuXHRcdFx0Y291bnQgPSBwYXJzZUludCh0aGlzLnF1ZXJ5UGFyYW1zLmNvdW50KTtcblx0XHR9XG5cblx0XHRsZXQgdW5yZWFkcyA9IGZhbHNlO1xuXHRcdGlmICh0aGlzLnF1ZXJ5UGFyYW1zLnVucmVhZHMpIHtcblx0XHRcdHVucmVhZHMgPSB0aGlzLnF1ZXJ5UGFyYW1zLnVucmVhZHM7XG5cdFx0fVxuXG5cdFx0bGV0IHJlc3VsdDtcblx0XHRNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PiB7XG5cdFx0XHRyZXN1bHQgPSBNZXRlb3IuY2FsbCgnZ2V0Q2hhbm5lbEhpc3RvcnknLCB7IHJpZDogZmluZFJlc3VsdC5yaWQsIGxhdGVzdDogbGF0ZXN0RGF0ZSwgb2xkZXN0OiBvbGRlc3REYXRlLCBpbmNsdXNpdmUsIGNvdW50LCB1bnJlYWRzIH0pO1xuXHRcdH0pO1xuXG5cdFx0aWYgKCFyZXN1bHQpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS51bmF1dGhvcml6ZWQoKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2VzcyhyZXN1bHQpO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2dyb3Vwcy5pbmZvJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRnZXQoKSB7XG5cdFx0Y29uc3QgZmluZFJlc3VsdCA9IGZpbmRQcml2YXRlR3JvdXBCeUlkT3JOYW1lKHsgcGFyYW1zOiB0aGlzLnJlcXVlc3RQYXJhbXMoKSwgdXNlcklkOiB0aGlzLnVzZXJJZCwgY2hlY2tlZEFyY2hpdmVkOiBmYWxzZSB9KTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdGdyb3VwOiBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT25lQnlJZChmaW5kUmVzdWx0LnJpZCwgeyBmaWVsZHM6IFJvY2tldENoYXQuQVBJLnYxLmRlZmF1bHRGaWVsZHNUb0V4Y2x1ZGUgfSlcblx0XHR9KTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdncm91cHMuaW52aXRlJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRwb3N0KCkge1xuXHRcdGNvbnN0IGZpbmRSZXN1bHQgPSBmaW5kUHJpdmF0ZUdyb3VwQnlJZE9yTmFtZSh7IHBhcmFtczogdGhpcy5yZXF1ZXN0UGFyYW1zKCksIHVzZXJJZDogdGhpcy51c2VySWQgfSk7XG5cblx0XHRjb25zdCB1c2VyID0gdGhpcy5nZXRVc2VyRnJvbVBhcmFtcygpO1xuXG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4ge1xuXHRcdFx0TWV0ZW9yLmNhbGwoJ2FkZFVzZXJUb1Jvb20nLCB7IHJpZDogZmluZFJlc3VsdC5yaWQsIHVzZXJuYW1lOiB1c2VyLnVzZXJuYW1lIH0pO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0Z3JvdXA6IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRPbmVCeUlkKGZpbmRSZXN1bHQucmlkLCB7IGZpZWxkczogUm9ja2V0Q2hhdC5BUEkudjEuZGVmYXVsdEZpZWxkc1RvRXhjbHVkZSB9KVxuXHRcdH0pO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2dyb3Vwcy5raWNrJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRwb3N0KCkge1xuXHRcdGNvbnN0IGZpbmRSZXN1bHQgPSBmaW5kUHJpdmF0ZUdyb3VwQnlJZE9yTmFtZSh7IHBhcmFtczogdGhpcy5yZXF1ZXN0UGFyYW1zKCksIHVzZXJJZDogdGhpcy51c2VySWQgfSk7XG5cblx0XHRjb25zdCB1c2VyID0gdGhpcy5nZXRVc2VyRnJvbVBhcmFtcygpO1xuXG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4ge1xuXHRcdFx0TWV0ZW9yLmNhbGwoJ3JlbW92ZVVzZXJGcm9tUm9vbScsIHsgcmlkOiBmaW5kUmVzdWx0LnJpZCwgdXNlcm5hbWU6IHVzZXIudXNlcm5hbWUgfSk7XG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2VzcygpO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2dyb3Vwcy5sZWF2ZScsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdCgpIHtcblx0XHRjb25zdCBmaW5kUmVzdWx0ID0gZmluZFByaXZhdGVHcm91cEJ5SWRPck5hbWUoeyBwYXJhbXM6IHRoaXMucmVxdWVzdFBhcmFtcygpLCB1c2VySWQ6IHRoaXMudXNlcklkIH0pO1xuXG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4ge1xuXHRcdFx0TWV0ZW9yLmNhbGwoJ2xlYXZlUm9vbScsIGZpbmRSZXN1bHQucmlkKTtcblx0XHR9KTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKCk7XG5cdH1cbn0pO1xuXG4vL0xpc3QgUHJpdmF0ZSBHcm91cHMgYSB1c2VyIGhhcyBhY2Nlc3MgdG9cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdncm91cHMubGlzdCcsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0Z2V0KCkge1xuXHRcdGNvbnN0IHsgb2Zmc2V0LCBjb3VudCB9ID0gdGhpcy5nZXRQYWdpbmF0aW9uSXRlbXMoKTtcblx0XHRjb25zdCB7IHNvcnQsIGZpZWxkcywgcXVlcnkgfSA9IHRoaXMucGFyc2VKc29uUXVlcnkoKTtcblx0XHRjb25zdCBvdXJRdWVyeSA9IE9iamVjdC5hc3NpZ24oe30sIHF1ZXJ5LCB7XG5cdFx0XHR0OiAncCcsXG5cdFx0XHQndS5faWQnOiB0aGlzLnVzZXJJZFxuXHRcdH0pO1xuXG5cdFx0bGV0IHJvb21zID0gXy5wbHVjayhSb2NrZXRDaGF0Lm1vZGVscy5TdWJzY3JpcHRpb25zLmZpbmQob3VyUXVlcnkpLmZldGNoKCksICdfcm9vbScpO1xuXHRcdGNvbnN0IHRvdGFsQ291bnQgPSByb29tcy5sZW5ndGg7XG5cblx0XHRyb29tcyA9IFJvY2tldENoYXQubW9kZWxzLlJvb21zLnByb2Nlc3NRdWVyeU9wdGlvbnNPblJlc3VsdChyb29tcywge1xuXHRcdFx0c29ydDogc29ydCA/IHNvcnQgOiB7IG5hbWU6IDEgfSxcblx0XHRcdHNraXA6IG9mZnNldCxcblx0XHRcdGxpbWl0OiBjb3VudCxcblx0XHRcdGZpZWxkc1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0Z3JvdXBzOiByb29tcyxcblx0XHRcdG9mZnNldCxcblx0XHRcdGNvdW50OiByb29tcy5sZW5ndGgsXG5cdFx0XHR0b3RhbDogdG90YWxDb3VudFxuXHRcdH0pO1xuXHR9XG59KTtcblxuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnZ3JvdXBzLmxpc3RBbGwnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdGdldCgpIHtcblx0XHRpZiAoIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih0aGlzLnVzZXJJZCwgJ3ZpZXctcm9vbS1hZG1pbmlzdHJhdGlvbicpKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEudW5hdXRob3JpemVkKCk7XG5cdFx0fVxuXHRcdGNvbnN0IHsgb2Zmc2V0LCBjb3VudCB9ID0gdGhpcy5nZXRQYWdpbmF0aW9uSXRlbXMoKTtcblx0XHRjb25zdCB7IHNvcnQsIGZpZWxkcywgcXVlcnkgfSA9IHRoaXMucGFyc2VKc29uUXVlcnkoKTtcblx0XHRjb25zdCBvdXJRdWVyeSA9IE9iamVjdC5hc3NpZ24oe30sIHF1ZXJ5LCB7IHQ6ICdwJyB9KTtcblxuXHRcdGxldCByb29tcyA9IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmQob3VyUXVlcnkpLmZldGNoKCk7XG5cdFx0Y29uc3QgdG90YWxDb3VudCA9IHJvb21zLmxlbmd0aDtcblxuXHRcdHJvb21zID0gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMucHJvY2Vzc1F1ZXJ5T3B0aW9uc09uUmVzdWx0KHJvb21zLCB7XG5cdFx0XHRzb3J0OiBzb3J0ID8gc29ydCA6IHsgbmFtZTogMSB9LFxuXHRcdFx0c2tpcDogb2Zmc2V0LFxuXHRcdFx0bGltaXQ6IGNvdW50LFxuXHRcdFx0ZmllbGRzXG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7XG5cdFx0XHRncm91cHM6IHJvb21zLFxuXHRcdFx0b2Zmc2V0LFxuXHRcdFx0Y291bnQ6IHJvb21zLmxlbmd0aCxcblx0XHRcdHRvdGFsOiB0b3RhbENvdW50XG5cdFx0fSk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnZ3JvdXBzLm1lbWJlcnMnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdGdldCgpIHtcblx0XHRjb25zdCBmaW5kUmVzdWx0ID0gZmluZFByaXZhdGVHcm91cEJ5SWRPck5hbWUoeyBwYXJhbXM6IHRoaXMucmVxdWVzdFBhcmFtcygpLCB1c2VySWQ6IHRoaXMudXNlcklkIH0pO1xuXHRcdGNvbnN0IHsgb2Zmc2V0LCBjb3VudCB9ID0gdGhpcy5nZXRQYWdpbmF0aW9uSXRlbXMoKTtcblx0XHRjb25zdCB7IHNvcnQgfSA9IHRoaXMucGFyc2VKc29uUXVlcnkoKTtcblxuXHRcdGxldCBzb3J0Rm4gPSAoYSwgYikgPT4gYSA+IGI7XG5cdFx0aWYgKE1hdGNoLnRlc3Qoc29ydCwgT2JqZWN0KSAmJiBNYXRjaC50ZXN0KHNvcnQudXNlcm5hbWUsIE51bWJlcikgJiYgc29ydC51c2VybmFtZSA9PT0gLTEpIHtcblx0XHRcdHNvcnRGbiA9IChhLCBiKSA9PiBiIDwgYTtcblx0XHR9XG5cblx0XHRjb25zdCBtZW1iZXJzID0gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMucHJvY2Vzc1F1ZXJ5T3B0aW9uc09uUmVzdWx0KEFycmF5LmZyb20oZmluZFJlc3VsdC5fcm9vbS51c2VybmFtZXMpLnNvcnQoc29ydEZuKSwge1xuXHRcdFx0c2tpcDogb2Zmc2V0LFxuXHRcdFx0bGltaXQ6IGNvdW50XG5cdFx0fSk7XG5cblx0XHRjb25zdCB1c2VycyA9IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmQoeyB1c2VybmFtZTogeyAkaW46IG1lbWJlcnMgfSB9LCB7XG5cdFx0XHRmaWVsZHM6IHsgX2lkOiAxLCB1c2VybmFtZTogMSwgbmFtZTogMSwgc3RhdHVzOiAxLCB1dGNPZmZzZXQ6IDEgfSxcblx0XHRcdHNvcnQ6IHNvcnQgPyBzb3J0IDogeyB1c2VybmFtZTogMSB9XG5cdFx0fSkuZmV0Y2goKTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdG1lbWJlcnM6IHVzZXJzLFxuXHRcdFx0Y291bnQ6IG1lbWJlcnMubGVuZ3RoLFxuXHRcdFx0b2Zmc2V0LFxuXHRcdFx0dG90YWw6IGZpbmRSZXN1bHQuX3Jvb20udXNlcm5hbWVzLmxlbmd0aFxuXHRcdH0pO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2dyb3Vwcy5tZXNzYWdlcycsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0Z2V0KCkge1xuXHRcdGNvbnN0IGZpbmRSZXN1bHQgPSBmaW5kUHJpdmF0ZUdyb3VwQnlJZE9yTmFtZSh7IHBhcmFtczogdGhpcy5yZXF1ZXN0UGFyYW1zKCksIHVzZXJJZDogdGhpcy51c2VySWQgfSk7XG5cdFx0Y29uc3QgeyBvZmZzZXQsIGNvdW50IH0gPSB0aGlzLmdldFBhZ2luYXRpb25JdGVtcygpO1xuXHRcdGNvbnN0IHsgc29ydCwgZmllbGRzLCBxdWVyeSB9ID0gdGhpcy5wYXJzZUpzb25RdWVyeSgpO1xuXG5cdFx0Y29uc3Qgb3VyUXVlcnkgPSBPYmplY3QuYXNzaWduKHt9LCBxdWVyeSwgeyByaWQ6IGZpbmRSZXN1bHQucmlkIH0pO1xuXG5cdFx0Y29uc3QgbWVzc2FnZXMgPSBSb2NrZXRDaGF0Lm1vZGVscy5NZXNzYWdlcy5maW5kKG91clF1ZXJ5LCB7XG5cdFx0XHRzb3J0OiBzb3J0ID8gc29ydCA6IHsgdHM6IC0xIH0sXG5cdFx0XHRza2lwOiBvZmZzZXQsXG5cdFx0XHRsaW1pdDogY291bnQsXG5cdFx0XHRmaWVsZHNcblx0XHR9KS5mZXRjaCgpO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0bWVzc2FnZXMsXG5cdFx0XHRjb3VudDogbWVzc2FnZXMubGVuZ3RoLFxuXHRcdFx0b2Zmc2V0LFxuXHRcdFx0dG90YWw6IFJvY2tldENoYXQubW9kZWxzLk1lc3NhZ2VzLmZpbmQob3VyUXVlcnkpLmNvdW50KClcblx0XHR9KTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdncm91cHMub25saW5lJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRnZXQoKSB7XG5cdFx0Y29uc3QgeyBxdWVyeSB9ID0gdGhpcy5wYXJzZUpzb25RdWVyeSgpO1xuXHRcdGNvbnN0IG91clF1ZXJ5ID0gT2JqZWN0LmFzc2lnbih7fSwgcXVlcnksIHsgdDogJ3AnIH0pO1xuXG5cdFx0Y29uc3Qgcm9vbSA9IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRPbmUob3VyUXVlcnkpO1xuXG5cdFx0aWYgKHJvb20gPT0gbnVsbCkge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoJ0dyb3VwIGRvZXMgbm90IGV4aXN0cycpO1xuXHRcdH1cblxuXHRcdGNvbnN0IG9ubGluZSA9IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRVc2Vyc05vdE9mZmxpbmUoe1xuXHRcdFx0ZmllbGRzOiB7XG5cdFx0XHRcdHVzZXJuYW1lOiAxXG5cdFx0XHR9XG5cdFx0fSkuZmV0Y2goKTtcblxuXHRcdGNvbnN0IG9ubGluZUluUm9vbSA9IFtdO1xuXHRcdG9ubGluZS5mb3JFYWNoKHVzZXIgPT4ge1xuXHRcdFx0aWYgKHJvb20udXNlcm5hbWVzLmluZGV4T2YodXNlci51c2VybmFtZSkgIT09IC0xKSB7XG5cdFx0XHRcdG9ubGluZUluUm9vbS5wdXNoKHtcblx0XHRcdFx0XHRfaWQ6IHVzZXIuX2lkLFxuXHRcdFx0XHRcdHVzZXJuYW1lOiB1c2VyLnVzZXJuYW1lXG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0b25saW5lOiBvbmxpbmVJblJvb21cblx0XHR9KTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdncm91cHMub3BlbicsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdCgpIHtcblx0XHRjb25zdCBmaW5kUmVzdWx0ID0gZmluZFByaXZhdGVHcm91cEJ5SWRPck5hbWUoeyBwYXJhbXM6IHRoaXMucmVxdWVzdFBhcmFtcygpLCB1c2VySWQ6IHRoaXMudXNlcklkLCBjaGVja2VkQXJjaGl2ZWQ6IGZhbHNlIH0pO1xuXG5cdFx0aWYgKGZpbmRSZXN1bHQub3Blbikge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoYFRoZSBwcml2YXRlIGdyb3VwLCAkeyBmaW5kUmVzdWx0Lm5hbWUgfSwgaXMgYWxyZWFkeSBvcGVuIGZvciB0aGUgc2VuZGVyYCk7XG5cdFx0fVxuXG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4ge1xuXHRcdFx0TWV0ZW9yLmNhbGwoJ29wZW5Sb29tJywgZmluZFJlc3VsdC5yaWQpO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoKTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdncm91cHMucmVtb3ZlTW9kZXJhdG9yJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRwb3N0KCkge1xuXHRcdGNvbnN0IGZpbmRSZXN1bHQgPSBmaW5kUHJpdmF0ZUdyb3VwQnlJZE9yTmFtZSh7IHBhcmFtczogdGhpcy5yZXF1ZXN0UGFyYW1zKCksIHVzZXJJZDogdGhpcy51c2VySWQgfSk7XG5cblx0XHRjb25zdCB1c2VyID0gdGhpcy5nZXRVc2VyRnJvbVBhcmFtcygpO1xuXG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4ge1xuXHRcdFx0TWV0ZW9yLmNhbGwoJ3JlbW92ZVJvb21Nb2RlcmF0b3InLCBmaW5kUmVzdWx0LnJpZCwgdXNlci5faWQpO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoKTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdncm91cHMucmVtb3ZlT3duZXInLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdHBvc3QoKSB7XG5cdFx0Y29uc3QgZmluZFJlc3VsdCA9IGZpbmRQcml2YXRlR3JvdXBCeUlkT3JOYW1lKHsgcGFyYW1zOiB0aGlzLnJlcXVlc3RQYXJhbXMoKSwgdXNlcklkOiB0aGlzLnVzZXJJZCB9KTtcblxuXHRcdGNvbnN0IHVzZXIgPSB0aGlzLmdldFVzZXJGcm9tUGFyYW1zKCk7XG5cblx0XHRNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PiB7XG5cdFx0XHRNZXRlb3IuY2FsbCgncmVtb3ZlUm9vbU93bmVyJywgZmluZFJlc3VsdC5yaWQsIHVzZXIuX2lkKTtcblx0XHR9KTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKCk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnZ3JvdXBzLnJlbW92ZUxlYWRlcicsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdCgpIHtcblx0XHRjb25zdCBmaW5kUmVzdWx0ID0gZmluZFByaXZhdGVHcm91cEJ5SWRPck5hbWUoeyBwYXJhbXM6IHRoaXMucmVxdWVzdFBhcmFtcygpLCB1c2VySWQ6IHRoaXMudXNlcklkIH0pO1xuXG5cdFx0Y29uc3QgdXNlciA9IHRoaXMuZ2V0VXNlckZyb21QYXJhbXMoKTtcblxuXHRcdE1ldGVvci5ydW5Bc1VzZXIodGhpcy51c2VySWQsICgpID0+IHtcblx0XHRcdE1ldGVvci5jYWxsKCdyZW1vdmVSb29tTGVhZGVyJywgZmluZFJlc3VsdC5yaWQsIHVzZXIuX2lkKTtcblx0XHR9KTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKCk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnZ3JvdXBzLnJlbmFtZScsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdCgpIHtcblx0XHRpZiAoIXRoaXMuYm9keVBhcmFtcy5uYW1lIHx8ICF0aGlzLmJvZHlQYXJhbXMubmFtZS50cmltKCkpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCdUaGUgYm9keVBhcmFtIFwibmFtZVwiIGlzIHJlcXVpcmVkJyk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgZmluZFJlc3VsdCA9IGZpbmRQcml2YXRlR3JvdXBCeUlkT3JOYW1lKHsgcGFyYW1zOiB7IHJvb21JZDogdGhpcy5ib2R5UGFyYW1zLnJvb21JZH0sIHVzZXJJZDogdGhpcy51c2VySWQgfSk7XG5cblx0XHRNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PiB7XG5cdFx0XHRNZXRlb3IuY2FsbCgnc2F2ZVJvb21TZXR0aW5ncycsIGZpbmRSZXN1bHQucmlkLCAncm9vbU5hbWUnLCB0aGlzLmJvZHlQYXJhbXMubmFtZSk7XG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7XG5cdFx0XHRncm91cDogUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9uZUJ5SWQoZmluZFJlc3VsdC5yaWQsIHsgZmllbGRzOiBSb2NrZXRDaGF0LkFQSS52MS5kZWZhdWx0RmllbGRzVG9FeGNsdWRlIH0pXG5cdFx0fSk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnZ3JvdXBzLnNldERlc2NyaXB0aW9uJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRwb3N0KCkge1xuXHRcdGlmICghdGhpcy5ib2R5UGFyYW1zLmRlc2NyaXB0aW9uIHx8ICF0aGlzLmJvZHlQYXJhbXMuZGVzY3JpcHRpb24udHJpbSgpKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgnVGhlIGJvZHlQYXJhbSBcImRlc2NyaXB0aW9uXCIgaXMgcmVxdWlyZWQnKTtcblx0XHR9XG5cblx0XHRjb25zdCBmaW5kUmVzdWx0ID0gZmluZFByaXZhdGVHcm91cEJ5SWRPck5hbWUoeyBwYXJhbXM6IHRoaXMucmVxdWVzdFBhcmFtcygpLCB1c2VySWQ6IHRoaXMudXNlcklkIH0pO1xuXG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4ge1xuXHRcdFx0TWV0ZW9yLmNhbGwoJ3NhdmVSb29tU2V0dGluZ3MnLCBmaW5kUmVzdWx0LnJpZCwgJ3Jvb21EZXNjcmlwdGlvbicsIHRoaXMuYm9keVBhcmFtcy5kZXNjcmlwdGlvbik7XG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7XG5cdFx0XHRkZXNjcmlwdGlvbjogdGhpcy5ib2R5UGFyYW1zLmRlc2NyaXB0aW9uXG5cdFx0fSk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnZ3JvdXBzLnNldFB1cnBvc2UnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdHBvc3QoKSB7XG5cdFx0aWYgKCF0aGlzLmJvZHlQYXJhbXMucHVycG9zZSB8fCAhdGhpcy5ib2R5UGFyYW1zLnB1cnBvc2UudHJpbSgpKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgnVGhlIGJvZHlQYXJhbSBcInB1cnBvc2VcIiBpcyByZXF1aXJlZCcpO1xuXHRcdH1cblxuXHRcdGNvbnN0IGZpbmRSZXN1bHQgPSBmaW5kUHJpdmF0ZUdyb3VwQnlJZE9yTmFtZSh7IHBhcmFtczogdGhpcy5yZXF1ZXN0UGFyYW1zKCksIHVzZXJJZDogdGhpcy51c2VySWQgfSk7XG5cblx0XHRNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PiB7XG5cdFx0XHRNZXRlb3IuY2FsbCgnc2F2ZVJvb21TZXR0aW5ncycsIGZpbmRSZXN1bHQucmlkLCAncm9vbURlc2NyaXB0aW9uJywgdGhpcy5ib2R5UGFyYW1zLnB1cnBvc2UpO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0cHVycG9zZTogdGhpcy5ib2R5UGFyYW1zLnB1cnBvc2Vcblx0XHR9KTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdncm91cHMuc2V0UmVhZE9ubHknLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdHBvc3QoKSB7XG5cdFx0aWYgKHR5cGVvZiB0aGlzLmJvZHlQYXJhbXMucmVhZE9ubHkgPT09ICd1bmRlZmluZWQnKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgnVGhlIGJvZHlQYXJhbSBcInJlYWRPbmx5XCIgaXMgcmVxdWlyZWQnKTtcblx0XHR9XG5cblx0XHRjb25zdCBmaW5kUmVzdWx0ID0gZmluZFByaXZhdGVHcm91cEJ5SWRPck5hbWUoeyBwYXJhbXM6IHRoaXMucmVxdWVzdFBhcmFtcygpLCB1c2VySWQ6IHRoaXMudXNlcklkIH0pO1xuXG5cdFx0aWYgKGZpbmRSZXN1bHQucm8gPT09IHRoaXMuYm9keVBhcmFtcy5yZWFkT25seSkge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoJ1RoZSBwcml2YXRlIGdyb3VwIHJlYWQgb25seSBzZXR0aW5nIGlzIHRoZSBzYW1lIGFzIHdoYXQgaXQgd291bGQgYmUgY2hhbmdlZCB0by4nKTtcblx0XHR9XG5cblx0XHRNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PiB7XG5cdFx0XHRNZXRlb3IuY2FsbCgnc2F2ZVJvb21TZXR0aW5ncycsIGZpbmRSZXN1bHQucmlkLCAncmVhZE9ubHknLCB0aGlzLmJvZHlQYXJhbXMucmVhZE9ubHkpO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0Z3JvdXA6IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRPbmVCeUlkKGZpbmRSZXN1bHQucmlkLCB7IGZpZWxkczogUm9ja2V0Q2hhdC5BUEkudjEuZGVmYXVsdEZpZWxkc1RvRXhjbHVkZSB9KVxuXHRcdH0pO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2dyb3Vwcy5zZXRUb3BpYycsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdCgpIHtcblx0XHRpZiAoIXRoaXMuYm9keVBhcmFtcy50b3BpYyB8fCAhdGhpcy5ib2R5UGFyYW1zLnRvcGljLnRyaW0oKSkge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoJ1RoZSBib2R5UGFyYW0gXCJ0b3BpY1wiIGlzIHJlcXVpcmVkJyk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgZmluZFJlc3VsdCA9IGZpbmRQcml2YXRlR3JvdXBCeUlkT3JOYW1lKHsgcGFyYW1zOiB0aGlzLnJlcXVlc3RQYXJhbXMoKSwgdXNlcklkOiB0aGlzLnVzZXJJZCB9KTtcblxuXHRcdE1ldGVvci5ydW5Bc1VzZXIodGhpcy51c2VySWQsICgpID0+IHtcblx0XHRcdE1ldGVvci5jYWxsKCdzYXZlUm9vbVNldHRpbmdzJywgZmluZFJlc3VsdC5yaWQsICdyb29tVG9waWMnLCB0aGlzLmJvZHlQYXJhbXMudG9waWMpO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0dG9waWM6IHRoaXMuYm9keVBhcmFtcy50b3BpY1xuXHRcdH0pO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2dyb3Vwcy5zZXRUeXBlJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRwb3N0KCkge1xuXHRcdGlmICghdGhpcy5ib2R5UGFyYW1zLnR5cGUgfHwgIXRoaXMuYm9keVBhcmFtcy50eXBlLnRyaW0oKSkge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoJ1RoZSBib2R5UGFyYW0gXCJ0eXBlXCIgaXMgcmVxdWlyZWQnKTtcblx0XHR9XG5cblx0XHRjb25zdCBmaW5kUmVzdWx0ID0gZmluZFByaXZhdGVHcm91cEJ5SWRPck5hbWUoeyBwYXJhbXM6IHRoaXMucmVxdWVzdFBhcmFtcygpLCB1c2VySWQ6IHRoaXMudXNlcklkIH0pO1xuXG5cdFx0aWYgKGZpbmRSZXN1bHQudCA9PT0gdGhpcy5ib2R5UGFyYW1zLnR5cGUpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCdUaGUgcHJpdmF0ZSBncm91cCB0eXBlIGlzIHRoZSBzYW1lIGFzIHdoYXQgaXQgd291bGQgYmUgY2hhbmdlZCB0by4nKTtcblx0XHR9XG5cblx0XHRNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PiB7XG5cdFx0XHRNZXRlb3IuY2FsbCgnc2F2ZVJvb21TZXR0aW5ncycsIGZpbmRSZXN1bHQucmlkLCAncm9vbVR5cGUnLCB0aGlzLmJvZHlQYXJhbXMudHlwZSk7XG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7XG5cdFx0XHRncm91cDogUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9uZUJ5SWQoZmluZFJlc3VsdC5yaWQsIHsgZmllbGRzOiBSb2NrZXRDaGF0LkFQSS52MS5kZWZhdWx0RmllbGRzVG9FeGNsdWRlIH0pXG5cdFx0fSk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnZ3JvdXBzLnVuYXJjaGl2ZScsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdCgpIHtcblx0XHRjb25zdCBmaW5kUmVzdWx0ID0gZmluZFByaXZhdGVHcm91cEJ5SWRPck5hbWUoeyBwYXJhbXM6IHRoaXMucmVxdWVzdFBhcmFtcygpLCB1c2VySWQ6IHRoaXMudXNlcklkLCBjaGVja2VkQXJjaGl2ZWQ6IGZhbHNlIH0pO1xuXG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4ge1xuXHRcdFx0TWV0ZW9yLmNhbGwoJ3VuYXJjaGl2ZVJvb20nLCBmaW5kUmVzdWx0LnJpZCk7XG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2VzcygpO1xuXHR9XG59KTtcbiIsImltcG9ydCBfIGZyb20gJ3VuZGVyc2NvcmUnO1xuXG5mdW5jdGlvbiBmaW5kRGlyZWN0TWVzc2FnZVJvb20ocGFyYW1zLCB1c2VyKSB7XG5cdGlmICgoIXBhcmFtcy5yb29tSWQgfHwgIXBhcmFtcy5yb29tSWQudHJpbSgpKSAmJiAoIXBhcmFtcy51c2VybmFtZSB8fCAhcGFyYW1zLnVzZXJuYW1lLnRyaW0oKSkpIHtcblx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1yb29tLXBhcmFtLW5vdC1wcm92aWRlZCcsICdCb2R5IHBhcmFtIFwicm9vbUlkXCIgb3IgXCJ1c2VybmFtZVwiIGlzIHJlcXVpcmVkJyk7XG5cdH1cblxuXHRjb25zdCByb29tID0gUm9ja2V0Q2hhdC5nZXRSb29tQnlOYW1lT3JJZFdpdGhPcHRpb25Ub0pvaW4oe1xuXHRcdGN1cnJlbnRVc2VySWQ6IHVzZXIuX2lkLFxuXHRcdG5hbWVPcklkOiBwYXJhbXMudXNlcm5hbWUgfHwgcGFyYW1zLnJvb21JZCxcblx0XHR0eXBlOiAnZCdcblx0fSk7XG5cblx0aWYgKCFyb29tIHx8IHJvb20udCAhPT0gJ2QnKSB7XG5cdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3Itcm9vbS1ub3QtZm91bmQnLCAnVGhlIHJlcXVpcmVkIFwicm9vbUlkXCIgb3IgXCJ1c2VybmFtZVwiIHBhcmFtIHByb3ZpZGVkIGRvZXMgbm90IG1hdGNoIGFueSBkaXJjdCBtZXNzYWdlJyk7XG5cdH1cblxuXHRjb25zdCBzdWJzY3JpcHRpb24gPSBSb2NrZXRDaGF0Lm1vZGVscy5TdWJzY3JpcHRpb25zLmZpbmRPbmVCeVJvb21JZEFuZFVzZXJJZChyb29tLl9pZCwgdXNlci5faWQpO1xuXG5cdHJldHVybiB7XG5cdFx0cm9vbSxcblx0XHRzdWJzY3JpcHRpb25cblx0fTtcbn1cblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoWydkbS5jcmVhdGUnLCAnaW0uY3JlYXRlJ10sIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdCgpIHtcblx0XHRjb25zdCBmaW5kUmVzdWx0ID0gZmluZERpcmVjdE1lc3NhZ2VSb29tKHRoaXMucmVxdWVzdFBhcmFtcygpLCB0aGlzLnVzZXIpO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0cm9vbTogZmluZFJlc3VsdC5yb29tXG5cdFx0fSk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZShbJ2RtLmNsb3NlJywgJ2ltLmNsb3NlJ10sIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdCgpIHtcblx0XHRjb25zdCBmaW5kUmVzdWx0ID0gZmluZERpcmVjdE1lc3NhZ2VSb29tKHRoaXMucmVxdWVzdFBhcmFtcygpLCB0aGlzLnVzZXIpO1xuXG5cdFx0aWYgKCFmaW5kUmVzdWx0LnN1YnNjcmlwdGlvbi5vcGVuKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZShgVGhlIGRpcmVjdCBtZXNzYWdlIHJvb20sICR7IHRoaXMuYm9keVBhcmFtcy5uYW1lIH0sIGlzIGFscmVhZHkgY2xvc2VkIHRvIHRoZSBzZW5kZXJgKTtcblx0XHR9XG5cblx0XHRNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PiB7XG5cdFx0XHRNZXRlb3IuY2FsbCgnaGlkZVJvb20nLCBmaW5kUmVzdWx0LnJvb20uX2lkKTtcblx0XHR9KTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKCk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZShbJ2RtLmZpbGVzJywgJ2ltLmZpbGVzJ10sIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0Z2V0KCkge1xuXHRcdGNvbnN0IGZpbmRSZXN1bHQgPSBmaW5kRGlyZWN0TWVzc2FnZVJvb20odGhpcy5yZXF1ZXN0UGFyYW1zKCksIHRoaXMudXNlcik7XG5cdFx0Y29uc3QgYWRkVXNlck9iamVjdFRvRXZlcnlPYmplY3QgPSAoZmlsZSkgPT4ge1xuXHRcdFx0aWYgKGZpbGUudXNlcklkKSB7XG5cdFx0XHRcdGZpbGUgPSB0aGlzLmluc2VydFVzZXJPYmplY3QoeyBvYmplY3Q6IGZpbGUsIHVzZXJJZDogZmlsZS51c2VySWQgfSk7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gZmlsZTtcblx0XHR9O1xuXG5cdFx0Y29uc3QgeyBvZmZzZXQsIGNvdW50IH0gPSB0aGlzLmdldFBhZ2luYXRpb25JdGVtcygpO1xuXHRcdGNvbnN0IHsgc29ydCwgZmllbGRzLCBxdWVyeSB9ID0gdGhpcy5wYXJzZUpzb25RdWVyeSgpO1xuXG5cdFx0Y29uc3Qgb3VyUXVlcnkgPSBPYmplY3QuYXNzaWduKHt9LCBxdWVyeSwgeyByaWQ6IGZpbmRSZXN1bHQucm9vbS5faWQgfSk7XG5cblx0XHRjb25zdCBmaWxlcyA9IFJvY2tldENoYXQubW9kZWxzLlVwbG9hZHMuZmluZChvdXJRdWVyeSwge1xuXHRcdFx0c29ydDogc29ydCA/IHNvcnQgOiB7IG5hbWU6IDEgfSxcblx0XHRcdHNraXA6IG9mZnNldCxcblx0XHRcdGxpbWl0OiBjb3VudCxcblx0XHRcdGZpZWxkc1xuXHRcdH0pLmZldGNoKCk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7XG5cdFx0XHRmaWxlczogZmlsZXMubWFwKGFkZFVzZXJPYmplY3RUb0V2ZXJ5T2JqZWN0KSxcblx0XHRcdGNvdW50OiBmaWxlcy5sZW5ndGgsXG5cdFx0XHRvZmZzZXQsXG5cdFx0XHR0b3RhbDogUm9ja2V0Q2hhdC5tb2RlbHMuVXBsb2Fkcy5maW5kKG91clF1ZXJ5KS5jb3VudCgpXG5cdFx0fSk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZShbJ2RtLmhpc3RvcnknLCAnaW0uaGlzdG9yeSddLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdGdldCgpIHtcblx0XHRjb25zdCBmaW5kUmVzdWx0ID0gZmluZERpcmVjdE1lc3NhZ2VSb29tKHRoaXMucmVxdWVzdFBhcmFtcygpLCB0aGlzLnVzZXIpO1xuXG5cdFx0bGV0IGxhdGVzdERhdGUgPSBuZXcgRGF0ZSgpO1xuXHRcdGlmICh0aGlzLnF1ZXJ5UGFyYW1zLmxhdGVzdCkge1xuXHRcdFx0bGF0ZXN0RGF0ZSA9IG5ldyBEYXRlKHRoaXMucXVlcnlQYXJhbXMubGF0ZXN0KTtcblx0XHR9XG5cblx0XHRsZXQgb2xkZXN0RGF0ZSA9IHVuZGVmaW5lZDtcblx0XHRpZiAodGhpcy5xdWVyeVBhcmFtcy5vbGRlc3QpIHtcblx0XHRcdG9sZGVzdERhdGUgPSBuZXcgRGF0ZSh0aGlzLnF1ZXJ5UGFyYW1zLm9sZGVzdCk7XG5cdFx0fVxuXG5cdFx0bGV0IGluY2x1c2l2ZSA9IGZhbHNlO1xuXHRcdGlmICh0aGlzLnF1ZXJ5UGFyYW1zLmluY2x1c2l2ZSkge1xuXHRcdFx0aW5jbHVzaXZlID0gdGhpcy5xdWVyeVBhcmFtcy5pbmNsdXNpdmU7XG5cdFx0fVxuXG5cdFx0bGV0IGNvdW50ID0gMjA7XG5cdFx0aWYgKHRoaXMucXVlcnlQYXJhbXMuY291bnQpIHtcblx0XHRcdGNvdW50ID0gcGFyc2VJbnQodGhpcy5xdWVyeVBhcmFtcy5jb3VudCk7XG5cdFx0fVxuXG5cdFx0bGV0IHVucmVhZHMgPSBmYWxzZTtcblx0XHRpZiAodGhpcy5xdWVyeVBhcmFtcy51bnJlYWRzKSB7XG5cdFx0XHR1bnJlYWRzID0gdGhpcy5xdWVyeVBhcmFtcy51bnJlYWRzO1xuXHRcdH1cblxuXHRcdGxldCByZXN1bHQ7XG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4ge1xuXHRcdFx0cmVzdWx0ID0gTWV0ZW9yLmNhbGwoJ2dldENoYW5uZWxIaXN0b3J5Jywge1xuXHRcdFx0XHRyaWQ6IGZpbmRSZXN1bHQucm9vbS5faWQsXG5cdFx0XHRcdGxhdGVzdDogbGF0ZXN0RGF0ZSxcblx0XHRcdFx0b2xkZXN0OiBvbGRlc3REYXRlLFxuXHRcdFx0XHRpbmNsdXNpdmUsXG5cdFx0XHRcdGNvdW50LFxuXHRcdFx0XHR1bnJlYWRzXG5cdFx0XHR9KTtcblx0XHR9KTtcblxuXHRcdGlmICghcmVzdWx0KSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEudW5hdXRob3JpemVkKCk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MocmVzdWx0KTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKFsnZG0ubWVtYmVycycsICdpbS5tZW1iZXJzJ10sIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0Z2V0KCkge1xuXHRcdGNvbnN0IGZpbmRSZXN1bHQgPSBmaW5kRGlyZWN0TWVzc2FnZVJvb20odGhpcy5yZXF1ZXN0UGFyYW1zKCksIHRoaXMudXNlcik7XG5cblx0XHRjb25zdCB7IG9mZnNldCwgY291bnQgfSA9IHRoaXMuZ2V0UGFnaW5hdGlvbkl0ZW1zKCk7XG5cdFx0Y29uc3QgeyBzb3J0IH0gPSB0aGlzLnBhcnNlSnNvblF1ZXJ5KCk7XG5cblx0XHRjb25zdCBtZW1iZXJzID0gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMucHJvY2Vzc1F1ZXJ5T3B0aW9uc09uUmVzdWx0KEFycmF5LmZyb20oZmluZFJlc3VsdC5yb29tLnVzZXJuYW1lcyksIHtcblx0XHRcdHNvcnQ6IHNvcnQgPyBzb3J0IDogLTEsXG5cdFx0XHRza2lwOiBvZmZzZXQsXG5cdFx0XHRsaW1pdDogY291bnRcblx0XHR9KTtcblxuXHRcdGNvbnN0IHVzZXJzID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZCh7IHVzZXJuYW1lOiB7ICRpbjogbWVtYmVycyB9IH0sXG5cdFx0XHR7IGZpZWxkczogeyBfaWQ6IDEsIHVzZXJuYW1lOiAxLCBuYW1lOiAxLCBzdGF0dXM6IDEsIHV0Y09mZnNldDogMSB9IH0pLmZldGNoKCk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7XG5cdFx0XHRtZW1iZXJzOiB1c2Vycyxcblx0XHRcdGNvdW50OiBtZW1iZXJzLmxlbmd0aCxcblx0XHRcdG9mZnNldCxcblx0XHRcdHRvdGFsOiBmaW5kUmVzdWx0LnJvb20udXNlcm5hbWVzLmxlbmd0aFxuXHRcdH0pO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoWydkbS5tZXNzYWdlcycsICdpbS5tZXNzYWdlcyddLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdGdldCgpIHtcblx0XHRjb25zdCBmaW5kUmVzdWx0ID0gZmluZERpcmVjdE1lc3NhZ2VSb29tKHRoaXMucmVxdWVzdFBhcmFtcygpLCB0aGlzLnVzZXIpO1xuXG5cdFx0Y29uc3QgeyBvZmZzZXQsIGNvdW50IH0gPSB0aGlzLmdldFBhZ2luYXRpb25JdGVtcygpO1xuXHRcdGNvbnN0IHsgc29ydCwgZmllbGRzLCBxdWVyeSB9ID0gdGhpcy5wYXJzZUpzb25RdWVyeSgpO1xuXG5cdFx0Y29uc29sZS5sb2coZmluZFJlc3VsdCk7XG5cdFx0Y29uc3Qgb3VyUXVlcnkgPSBPYmplY3QuYXNzaWduKHt9LCBxdWVyeSwgeyByaWQ6IGZpbmRSZXN1bHQucm9vbS5faWQgfSk7XG5cblx0XHRjb25zdCBtZXNzYWdlcyA9IFJvY2tldENoYXQubW9kZWxzLk1lc3NhZ2VzLmZpbmQob3VyUXVlcnksIHtcblx0XHRcdHNvcnQ6IHNvcnQgPyBzb3J0IDogeyB0czogLTEgfSxcblx0XHRcdHNraXA6IG9mZnNldCxcblx0XHRcdGxpbWl0OiBjb3VudCxcblx0XHRcdGZpZWxkc1xuXHRcdH0pLmZldGNoKCk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7XG5cdFx0XHRtZXNzYWdlcyxcblx0XHRcdGNvdW50OiBtZXNzYWdlcy5sZW5ndGgsXG5cdFx0XHRvZmZzZXQsXG5cdFx0XHR0b3RhbDogUm9ja2V0Q2hhdC5tb2RlbHMuTWVzc2FnZXMuZmluZChvdXJRdWVyeSkuY291bnQoKVxuXHRcdH0pO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoWydkbS5tZXNzYWdlcy5vdGhlcnMnLCAnaW0ubWVzc2FnZXMub3RoZXJzJ10sIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0Z2V0KCkge1xuXHRcdGlmIChSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnQVBJX0VuYWJsZV9EaXJlY3RfTWVzc2FnZV9IaXN0b3J5X0VuZFBvaW50JykgIT09IHRydWUpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWVuZHBvaW50LWRpc2FibGVkJywgJ1RoaXMgZW5kcG9pbnQgaXMgZGlzYWJsZWQnLCB7IHJvdXRlOiAnL2FwaS92MS9pbS5tZXNzYWdlcy5vdGhlcnMnIH0pO1xuXHRcdH1cblxuXHRcdGlmICghUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKHRoaXMudXNlcklkLCAndmlldy1yb29tLWFkbWluaXN0cmF0aW9uJykpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS51bmF1dGhvcml6ZWQoKTtcblx0XHR9XG5cblx0XHRjb25zdCByb29tSWQgPSB0aGlzLnF1ZXJ5UGFyYW1zLnJvb21JZDtcblx0XHRpZiAoIXJvb21JZCB8fCAhcm9vbUlkLnRyaW0oKSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3Itcm9vbWlkLXBhcmFtLW5vdC1wcm92aWRlZCcsICdUaGUgcGFyYW1ldGVyIFwicm9vbUlkXCIgaXMgcmVxdWlyZWQnKTtcblx0XHR9XG5cblx0XHRjb25zdCByb29tID0gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9uZUJ5SWQocm9vbUlkKTtcblx0XHRpZiAoIXJvb20gfHwgcm9vbS50ICE9PSAnZCcpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLXJvb20tbm90LWZvdW5kJywgYE5vIGRpcmVjdCBtZXNzYWdlIHJvb20gZm91bmQgYnkgdGhlIGlkIG9mOiAkeyByb29tSWQgfWApO1xuXHRcdH1cblxuXHRcdGNvbnN0IHsgb2Zmc2V0LCBjb3VudCB9ID0gdGhpcy5nZXRQYWdpbmF0aW9uSXRlbXMoKTtcblx0XHRjb25zdCB7IHNvcnQsIGZpZWxkcywgcXVlcnkgfSA9IHRoaXMucGFyc2VKc29uUXVlcnkoKTtcblx0XHRjb25zdCBvdXJRdWVyeSA9IE9iamVjdC5hc3NpZ24oe30sIHF1ZXJ5LCB7IHJpZDogcm9vbS5faWQgfSk7XG5cblx0XHRjb25zdCBtc2dzID0gUm9ja2V0Q2hhdC5tb2RlbHMuTWVzc2FnZXMuZmluZChvdXJRdWVyeSwge1xuXHRcdFx0c29ydDogc29ydCA/IHNvcnQgOiB7IHRzOiAtMSB9LFxuXHRcdFx0c2tpcDogb2Zmc2V0LFxuXHRcdFx0bGltaXQ6IGNvdW50LFxuXHRcdFx0ZmllbGRzXG5cdFx0fSkuZmV0Y2goKTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdG1lc3NhZ2VzOiBtc2dzLFxuXHRcdFx0b2Zmc2V0LFxuXHRcdFx0Y291bnQ6IG1zZ3MubGVuZ3RoLFxuXHRcdFx0dG90YWw6IFJvY2tldENoYXQubW9kZWxzLk1lc3NhZ2VzLmZpbmQob3VyUXVlcnkpLmNvdW50KClcblx0XHR9KTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKFsnZG0ubGlzdCcsICdpbS5saXN0J10sIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0Z2V0KCkge1xuXHRcdGNvbnN0IHsgb2Zmc2V0LCBjb3VudCB9ID0gdGhpcy5nZXRQYWdpbmF0aW9uSXRlbXMoKTtcblx0XHRjb25zdCB7IHNvcnQsIGZpZWxkcywgcXVlcnkgfSA9IHRoaXMucGFyc2VKc29uUXVlcnkoKTtcblx0XHRjb25zdCBvdXJRdWVyeSA9IE9iamVjdC5hc3NpZ24oe30sIHF1ZXJ5LCB7XG5cdFx0XHR0OiAnZCcsXG5cdFx0XHQndS5faWQnOiB0aGlzLnVzZXJJZFxuXHRcdH0pO1xuXG5cdFx0bGV0IHJvb21zID0gXy5wbHVjayhSb2NrZXRDaGF0Lm1vZGVscy5TdWJzY3JpcHRpb25zLmZpbmQob3VyUXVlcnkpLmZldGNoKCksICdfcm9vbScpO1xuXHRcdGNvbnN0IHRvdGFsQ291bnQgPSByb29tcy5sZW5ndGg7XG5cblx0XHRyb29tcyA9IFJvY2tldENoYXQubW9kZWxzLlJvb21zLnByb2Nlc3NRdWVyeU9wdGlvbnNPblJlc3VsdChyb29tcywge1xuXHRcdFx0c29ydDogc29ydCA/IHNvcnQgOiB7IG5hbWU6IDEgfSxcblx0XHRcdHNraXA6IG9mZnNldCxcblx0XHRcdGxpbWl0OiBjb3VudCxcblx0XHRcdGZpZWxkc1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0aW1zOiByb29tcyxcblx0XHRcdG9mZnNldCxcblx0XHRcdGNvdW50OiByb29tcy5sZW5ndGgsXG5cdFx0XHR0b3RhbDogdG90YWxDb3VudFxuXHRcdH0pO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoWydkbS5saXN0LmV2ZXJ5b25lJywgJ2ltLmxpc3QuZXZlcnlvbmUnXSwgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRnZXQoKSB7XG5cdFx0aWYgKCFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odGhpcy51c2VySWQsICd2aWV3LXJvb20tYWRtaW5pc3RyYXRpb24nKSkge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnVuYXV0aG9yaXplZCgpO1xuXHRcdH1cblxuXHRcdGNvbnN0IHsgb2Zmc2V0LCBjb3VudCB9ID0gdGhpcy5nZXRQYWdpbmF0aW9uSXRlbXMoKTtcblx0XHRjb25zdCB7IHNvcnQsIGZpZWxkcywgcXVlcnkgfSA9IHRoaXMucGFyc2VKc29uUXVlcnkoKTtcblxuXHRcdGNvbnN0IG91clF1ZXJ5ID0gT2JqZWN0LmFzc2lnbih7fSwgcXVlcnksIHsgdDogJ2QnIH0pO1xuXG5cdFx0Y29uc3Qgcm9vbXMgPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kKG91clF1ZXJ5LCB7XG5cdFx0XHRzb3J0OiBzb3J0ID8gc29ydCA6IHsgbmFtZTogMSB9LFxuXHRcdFx0c2tpcDogb2Zmc2V0LFxuXHRcdFx0bGltaXQ6IGNvdW50LFxuXHRcdFx0ZmllbGRzXG5cdFx0fSkuZmV0Y2goKTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdGltczogcm9vbXMsXG5cdFx0XHRvZmZzZXQsXG5cdFx0XHRjb3VudDogcm9vbXMubGVuZ3RoLFxuXHRcdFx0dG90YWw6IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmQob3VyUXVlcnkpLmNvdW50KClcblx0XHR9KTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKFsnZG0ub3BlbicsICdpbS5vcGVuJ10sIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdCgpIHtcblx0XHRjb25zdCBmaW5kUmVzdWx0ID0gZmluZERpcmVjdE1lc3NhZ2VSb29tKHRoaXMucmVxdWVzdFBhcmFtcygpLCB0aGlzLnVzZXIpO1xuXG5cdFx0aWYgKCFmaW5kUmVzdWx0LnN1YnNjcmlwdGlvbi5vcGVuKSB7XG5cdFx0XHRNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PiB7XG5cdFx0XHRcdE1ldGVvci5jYWxsKCdvcGVuUm9vbScsIGZpbmRSZXN1bHQucm9vbS5faWQpO1xuXHRcdFx0fSk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoKTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKFsnZG0uc2V0VG9waWMnLCAnaW0uc2V0VG9waWMnXSwgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRwb3N0KCkge1xuXHRcdGlmICghdGhpcy5ib2R5UGFyYW1zLnRvcGljIHx8ICF0aGlzLmJvZHlQYXJhbXMudG9waWMudHJpbSgpKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgnVGhlIGJvZHlQYXJhbSBcInRvcGljXCIgaXMgcmVxdWlyZWQnKTtcblx0XHR9XG5cblx0XHRjb25zdCBmaW5kUmVzdWx0ID0gZmluZERpcmVjdE1lc3NhZ2VSb29tKHRoaXMucmVxdWVzdFBhcmFtcygpLCB0aGlzLnVzZXIpO1xuXG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4ge1xuXHRcdFx0TWV0ZW9yLmNhbGwoJ3NhdmVSb29tU2V0dGluZ3MnLCBmaW5kUmVzdWx0LnJvb20uX2lkLCAncm9vbVRvcGljJywgdGhpcy5ib2R5UGFyYW1zLnRvcGljKTtcblx0XHR9KTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdHRvcGljOiB0aGlzLmJvZHlQYXJhbXMudG9waWNcblx0XHR9KTtcblx0fVxufSk7XG4iLCJSb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnaW50ZWdyYXRpb25zLmNyZWF0ZScsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdCgpIHtcblx0XHRjaGVjayh0aGlzLmJvZHlQYXJhbXMsIE1hdGNoLk9iamVjdEluY2x1ZGluZyh7XG5cdFx0XHR0eXBlOiBTdHJpbmcsXG5cdFx0XHRuYW1lOiBTdHJpbmcsXG5cdFx0XHRlbmFibGVkOiBCb29sZWFuLFxuXHRcdFx0dXNlcm5hbWU6IFN0cmluZyxcblx0XHRcdHVybHM6IE1hdGNoLk1heWJlKFtTdHJpbmddKSxcblx0XHRcdGNoYW5uZWw6IFN0cmluZyxcblx0XHRcdGV2ZW50OiBNYXRjaC5NYXliZShTdHJpbmcpLFxuXHRcdFx0dHJpZ2dlcldvcmRzOiBNYXRjaC5NYXliZShbU3RyaW5nXSksXG5cdFx0XHRhbGlhczogTWF0Y2guTWF5YmUoU3RyaW5nKSxcblx0XHRcdGF2YXRhcjogTWF0Y2guTWF5YmUoU3RyaW5nKSxcblx0XHRcdGVtb2ppOiBNYXRjaC5NYXliZShTdHJpbmcpLFxuXHRcdFx0dG9rZW46IE1hdGNoLk1heWJlKFN0cmluZyksXG5cdFx0XHRzY3JpcHRFbmFibGVkOiBCb29sZWFuLFxuXHRcdFx0c2NyaXB0OiBNYXRjaC5NYXliZShTdHJpbmcpLFxuXHRcdFx0dGFyZ2V0Q2hhbm5lbDogTWF0Y2guTWF5YmUoU3RyaW5nKVxuXHRcdH0pKTtcblxuXHRcdGxldCBpbnRlZ3JhdGlvbjtcblxuXHRcdHN3aXRjaCAodGhpcy5ib2R5UGFyYW1zLnR5cGUpIHtcblx0XHRcdGNhc2UgJ3dlYmhvb2stb3V0Z29pbmcnOlxuXHRcdFx0XHRNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PiB7XG5cdFx0XHRcdFx0aW50ZWdyYXRpb24gPSBNZXRlb3IuY2FsbCgnYWRkT3V0Z29pbmdJbnRlZ3JhdGlvbicsIHRoaXMuYm9keVBhcmFtcyk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0XHRicmVhaztcblx0XHRcdGNhc2UgJ3dlYmhvb2staW5jb21pbmcnOlxuXHRcdFx0XHRNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PiB7XG5cdFx0XHRcdFx0aW50ZWdyYXRpb24gPSBNZXRlb3IuY2FsbCgnYWRkSW5jb21pbmdJbnRlZ3JhdGlvbicsIHRoaXMuYm9keVBhcmFtcyk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0XHRicmVhaztcblx0XHRcdGRlZmF1bHQ6XG5cdFx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCdJbnZhbGlkIGludGVncmF0aW9uIHR5cGUuJyk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoeyBpbnRlZ3JhdGlvbiB9KTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdpbnRlZ3JhdGlvbnMuaGlzdG9yeScsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0Z2V0KCkge1xuXHRcdGlmICghUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKHRoaXMudXNlcklkLCAnbWFuYWdlLWludGVncmF0aW9ucycpKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEudW5hdXRob3JpemVkKCk7XG5cdFx0fVxuXG5cdFx0aWYgKCF0aGlzLnF1ZXJ5UGFyYW1zLmlkIHx8IHRoaXMucXVlcnlQYXJhbXMuaWQudHJpbSgpID09PSAnJykge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoJ0ludmFsaWQgaW50ZWdyYXRpb24gaWQuJyk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgaWQgPSB0aGlzLnF1ZXJ5UGFyYW1zLmlkO1xuXHRcdGNvbnN0IHsgb2Zmc2V0LCBjb3VudCB9ID0gdGhpcy5nZXRQYWdpbmF0aW9uSXRlbXMoKTtcblx0XHRjb25zdCB7IHNvcnQsIGZpZWxkcywgcXVlcnkgfSA9IHRoaXMucGFyc2VKc29uUXVlcnkoKTtcblxuXHRcdGNvbnN0IG91clF1ZXJ5ID0gT2JqZWN0LmFzc2lnbih7fSwgcXVlcnksIHsgJ2ludGVncmF0aW9uLl9pZCc6IGlkIH0pO1xuXHRcdGNvbnN0IGhpc3RvcnkgPSBSb2NrZXRDaGF0Lm1vZGVscy5JbnRlZ3JhdGlvbkhpc3RvcnkuZmluZChvdXJRdWVyeSwge1xuXHRcdFx0c29ydDogc29ydCA/IHNvcnQgOiB7IF91cGRhdGVkQXQ6IC0xIH0sXG5cdFx0XHRza2lwOiBvZmZzZXQsXG5cdFx0XHRsaW1pdDogY291bnQsXG5cdFx0XHRmaWVsZHNcblx0XHR9KS5mZXRjaCgpO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0aGlzdG9yeSxcblx0XHRcdG9mZnNldCxcblx0XHRcdGl0ZW1zOiBoaXN0b3J5Lmxlbmd0aCxcblx0XHRcdHRvdGFsOiBSb2NrZXRDaGF0Lm1vZGVscy5JbnRlZ3JhdGlvbkhpc3RvcnkuZmluZChvdXJRdWVyeSkuY291bnQoKVxuXHRcdH0pO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2ludGVncmF0aW9ucy5saXN0JywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRnZXQoKSB7XG5cdFx0aWYgKCFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odGhpcy51c2VySWQsICdtYW5hZ2UtaW50ZWdyYXRpb25zJykpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS51bmF1dGhvcml6ZWQoKTtcblx0XHR9XG5cblx0XHRjb25zdCB7IG9mZnNldCwgY291bnQgfSA9IHRoaXMuZ2V0UGFnaW5hdGlvbkl0ZW1zKCk7XG5cdFx0Y29uc3QgeyBzb3J0LCBmaWVsZHMsIHF1ZXJ5IH0gPSB0aGlzLnBhcnNlSnNvblF1ZXJ5KCk7XG5cblx0XHRjb25zdCBvdXJRdWVyeSA9IE9iamVjdC5hc3NpZ24oe30sIHF1ZXJ5KTtcblx0XHRjb25zdCBpbnRlZ3JhdGlvbnMgPSBSb2NrZXRDaGF0Lm1vZGVscy5JbnRlZ3JhdGlvbnMuZmluZChvdXJRdWVyeSwge1xuXHRcdFx0c29ydDogc29ydCA/IHNvcnQgOiB7IHRzOiAtMSB9LFxuXHRcdFx0c2tpcDogb2Zmc2V0LFxuXHRcdFx0bGltaXQ6IGNvdW50LFxuXHRcdFx0ZmllbGRzXG5cdFx0fSkuZmV0Y2goKTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdGludGVncmF0aW9ucyxcblx0XHRcdG9mZnNldCxcblx0XHRcdGl0ZW1zOiBpbnRlZ3JhdGlvbnMubGVuZ3RoLFxuXHRcdFx0dG90YWw6IFJvY2tldENoYXQubW9kZWxzLkludGVncmF0aW9ucy5maW5kKG91clF1ZXJ5KS5jb3VudCgpXG5cdFx0fSk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnaW50ZWdyYXRpb25zLnJlbW92ZScsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdCgpIHtcblx0XHRjaGVjayh0aGlzLmJvZHlQYXJhbXMsIE1hdGNoLk9iamVjdEluY2x1ZGluZyh7XG5cdFx0XHR0eXBlOiBTdHJpbmcsXG5cdFx0XHR0YXJnZXRfdXJsOiBNYXRjaC5NYXliZShTdHJpbmcpLFxuXHRcdFx0aW50ZWdyYXRpb25JZDogTWF0Y2guTWF5YmUoU3RyaW5nKVxuXHRcdH0pKTtcblxuXHRcdGlmICghdGhpcy5ib2R5UGFyYW1zLnRhcmdldF91cmwgJiYgIXRoaXMuYm9keVBhcmFtcy5pbnRlZ3JhdGlvbklkKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgnQW4gaW50ZWdyYXRpb25JZCBvciB0YXJnZXRfdXJsIG5lZWRzIHRvIGJlIHByb3ZpZGVkLicpO1xuXHRcdH1cblxuXHRcdGxldCBpbnRlZ3JhdGlvbjtcblx0XHRzd2l0Y2ggKHRoaXMuYm9keVBhcmFtcy50eXBlKSB7XG5cdFx0XHRjYXNlICd3ZWJob29rLW91dGdvaW5nJzpcblx0XHRcdFx0aWYgKHRoaXMuYm9keVBhcmFtcy50YXJnZXRfdXJsKSB7XG5cdFx0XHRcdFx0aW50ZWdyYXRpb24gPSBSb2NrZXRDaGF0Lm1vZGVscy5JbnRlZ3JhdGlvbnMuZmluZE9uZSh7IHVybHM6IHRoaXMuYm9keVBhcmFtcy50YXJnZXRfdXJsIH0pO1xuXHRcdFx0XHR9IGVsc2UgaWYgKHRoaXMuYm9keVBhcmFtcy5pbnRlZ3JhdGlvbklkKSB7XG5cdFx0XHRcdFx0aW50ZWdyYXRpb24gPSBSb2NrZXRDaGF0Lm1vZGVscy5JbnRlZ3JhdGlvbnMuZmluZE9uZSh7IF9pZDogdGhpcy5ib2R5UGFyYW1zLmludGVncmF0aW9uSWQgfSk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAoIWludGVncmF0aW9uKSB7XG5cdFx0XHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoJ05vIGludGVncmF0aW9uIGZvdW5kLicpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4ge1xuXHRcdFx0XHRcdE1ldGVvci5jYWxsKCdkZWxldGVPdXRnb2luZ0ludGVncmF0aW9uJywgaW50ZWdyYXRpb24uX2lkKTtcblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0XHRcdGludGVncmF0aW9uXG5cdFx0XHRcdH0pO1xuXHRcdFx0Y2FzZSAnd2ViaG9vay1pbmNvbWluZyc6XG5cdFx0XHRcdGludGVncmF0aW9uID0gUm9ja2V0Q2hhdC5tb2RlbHMuSW50ZWdyYXRpb25zLmZpbmRPbmUoeyBfaWQ6IHRoaXMuYm9keVBhcmFtcy5pbnRlZ3JhdGlvbklkIH0pO1xuXG5cdFx0XHRcdGlmICghaW50ZWdyYXRpb24pIHtcblx0XHRcdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgnTm8gaW50ZWdyYXRpb24gZm91bmQuJyk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PiB7XG5cdFx0XHRcdFx0TWV0ZW9yLmNhbGwoJ2RlbGV0ZUluY29taW5nSW50ZWdyYXRpb24nLCBpbnRlZ3JhdGlvbi5faWQpO1xuXHRcdFx0XHR9KTtcblxuXHRcdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7XG5cdFx0XHRcdFx0aW50ZWdyYXRpb25cblx0XHRcdFx0fSk7XG5cdFx0XHRkZWZhdWx0OlxuXHRcdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgnSW52YWxpZCBpbnRlZ3JhdGlvbiB0eXBlLicpO1xuXHRcdH1cblx0fVxufSk7XG4iLCJpbXBvcnQgXyBmcm9tICd1bmRlcnNjb3JlJztcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2luZm8nLCB7IGF1dGhSZXF1aXJlZDogZmFsc2UgfSwge1xuXHRnZXQoKSB7XG5cdFx0Y29uc3QgdXNlciA9IHRoaXMuZ2V0TG9nZ2VkSW5Vc2VyKCk7XG5cblx0XHRpZiAodXNlciAmJiBSb2NrZXRDaGF0LmF1dGh6Lmhhc1JvbGUodXNlci5faWQsICdhZG1pbicpKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7XG5cdFx0XHRcdGluZm86IFJvY2tldENoYXQuSW5mb1xuXHRcdFx0fSk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0aW5mbzoge1xuXHRcdFx0XHQndmVyc2lvbic6IFJvY2tldENoYXQuSW5mby52ZXJzaW9uXG5cdFx0XHR9XG5cdFx0fSk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnbWUnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdGdldCgpIHtcblx0XHRjb25zdCBtZSA9IF8ucGljayh0aGlzLnVzZXIsIFtcblx0XHRcdCdfaWQnLFxuXHRcdFx0J25hbWUnLFxuXHRcdFx0J2VtYWlscycsXG5cdFx0XHQnc3RhdHVzJyxcblx0XHRcdCdzdGF0dXNDb25uZWN0aW9uJyxcblx0XHRcdCd1c2VybmFtZScsXG5cdFx0XHQndXRjT2Zmc2V0Jyxcblx0XHRcdCdhY3RpdmUnLFxuXHRcdFx0J2xhbmd1YWdlJyxcblx0XHRcdCdyb2xlcycsXG5cdFx0XHQnc2V0dGluZ3MnXG5cdFx0XSk7XG5cblx0XHRjb25zdCB2ZXJpZmllZEVtYWlsID0gbWUuZW1haWxzLmZpbmQoKGVtYWlsKSA9PiBlbWFpbC52ZXJpZmllZCk7XG5cdFx0Y29uc3QgdXNlckhhc05vdFNldFByZWZlcmVuY2VzWWV0ID0gIW1lLnNldHRpbmdzIHx8ICFtZS5zZXR0aW5ncy5wcmVmZXJlbmNlcztcblxuXHRcdG1lLmVtYWlsID0gdmVyaWZpZWRFbWFpbCA/IHZlcmlmaWVkRW1haWwuYWRkcmVzcyA6IHVuZGVmaW5lZDtcblx0XHRpZiAodXNlckhhc05vdFNldFByZWZlcmVuY2VzWWV0KSB7XG5cdFx0XHRtZS5zZXR0aW5ncyA9IHsgcHJlZmVyZW5jZXM6IHt9IH07XG5cdFx0fVxuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MobWUpO1xuXHR9XG59KTtcblxubGV0IG9ubGluZUNhY2hlID0gMDtcbmxldCBvbmxpbmVDYWNoZURhdGUgPSAwO1xuY29uc3QgY2FjaGVJbnZhbGlkID0gNjAwMDA7IC8vIDEgbWludXRlXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnc2hpZWxkLnN2ZycsIHsgYXV0aFJlcXVpcmVkOiBmYWxzZSB9LCB7XG5cdGdldCgpIHtcblx0XHRjb25zdCB7IHR5cGUsIGNoYW5uZWwsIG5hbWUsIGljb24gfSA9IHRoaXMucXVlcnlQYXJhbXM7XG5cdFx0aWYgKCFSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnQVBJX0VuYWJsZV9TaGllbGRzJykpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWVuZHBvaW50LWRpc2FibGVkJywgJ1RoaXMgZW5kcG9pbnQgaXMgZGlzYWJsZWQnLCB7IHJvdXRlOiAnL2FwaS92MS9zaGllbGQuc3ZnJyB9KTtcblx0XHR9XG5cblx0XHRjb25zdCB0eXBlcyA9IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdBUElfU2hpZWxkX1R5cGVzJyk7XG5cdFx0aWYgKHR5cGUgJiYgKHR5cGVzICE9PSAnKicgJiYgIXR5cGVzLnNwbGl0KCcsJykubWFwKCh0KSA9PiB0LnRyaW0oKSkuaW5jbHVkZXModHlwZSkpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1zaGllbGQtZGlzYWJsZWQnLCAnVGhpcyBzaGllbGQgdHlwZSBpcyBkaXNhYmxlZCcsIHsgcm91dGU6ICcvYXBpL3YxL3NoaWVsZC5zdmcnIH0pO1xuXHRcdH1cblxuXHRcdGNvbnN0IGhpZGVJY29uID0gaWNvbiA9PT0gJ2ZhbHNlJztcblx0XHRpZiAoaGlkZUljb24gJiYgKCFuYW1lIHx8ICFuYW1lLnRyaW0oKSkpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCdOYW1lIGNhbm5vdCBiZSBlbXB0eSB3aGVuIGljb24gaXMgaGlkZGVuJyk7XG5cdFx0fVxuXG5cdFx0bGV0IHRleHQ7XG5cdFx0bGV0IGJhY2tncm91bmRDb2xvciA9ICcjNGMxJztcblx0XHRzd2l0Y2ggKHR5cGUpIHtcblx0XHRcdGNhc2UgJ29ubGluZSc6XG5cdFx0XHRcdGlmIChEYXRlLm5vdygpIC0gb25saW5lQ2FjaGVEYXRlID4gY2FjaGVJbnZhbGlkKSB7XG5cdFx0XHRcdFx0b25saW5lQ2FjaGUgPSBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kVXNlcnNOb3RPZmZsaW5lKCkuY291bnQoKTtcblx0XHRcdFx0XHRvbmxpbmVDYWNoZURhdGUgPSBEYXRlLm5vdygpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0dGV4dCA9IGAkeyBvbmxpbmVDYWNoZSB9ICR7IFRBUGkxOG4uX18oJ09ubGluZScpIH1gO1xuXHRcdFx0XHRicmVhaztcblx0XHRcdGNhc2UgJ2NoYW5uZWwnOlxuXHRcdFx0XHRpZiAoIWNoYW5uZWwpIHtcblx0XHRcdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgnU2hpZWxkIGNoYW5uZWwgaXMgcmVxdWlyZWQgZm9yIHR5cGUgXCJjaGFubmVsXCInKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHRleHQgPSBgIyR7IGNoYW5uZWwgfWA7XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0Y2FzZSAndXNlcic6XG5cdFx0XHRcdGNvbnN0IHVzZXIgPSB0aGlzLmdldFVzZXJGcm9tUGFyYW1zKCk7XG5cblx0XHRcdFx0Ly8gUmVzcGVjdCB0aGUgc2VydmVyJ3MgY2hvaWNlIGZvciB1c2luZyB0aGVpciByZWFsIG5hbWVzIG9yIG5vdFxuXHRcdFx0XHRpZiAodXNlci5uYW1lICYmIFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdVSV9Vc2VfUmVhbF9OYW1lJykpIHtcblx0XHRcdFx0XHR0ZXh0ID0gYCR7IHVzZXIubmFtZSB9YDtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHR0ZXh0ID0gYEAkeyB1c2VyLnVzZXJuYW1lIH1gO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0c3dpdGNoICh1c2VyLnN0YXR1cykge1xuXHRcdFx0XHRcdGNhc2UgJ29ubGluZSc6XG5cdFx0XHRcdFx0XHRiYWNrZ3JvdW5kQ29sb3IgPSAnIzFmYjMxZic7XG5cdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHRjYXNlICdhd2F5Jzpcblx0XHRcdFx0XHRcdGJhY2tncm91bmRDb2xvciA9ICcjZGM5YjAxJztcblx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdGNhc2UgJ2J1c3knOlxuXHRcdFx0XHRcdFx0YmFja2dyb3VuZENvbG9yID0gJyNiYzIwMzEnO1xuXHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0Y2FzZSAnb2ZmbGluZSc6XG5cdFx0XHRcdFx0XHRiYWNrZ3JvdW5kQ29sb3IgPSAnI2E1YTFhMSc7XG5cdFx0XHRcdH1cblx0XHRcdFx0YnJlYWs7XG5cdFx0XHRkZWZhdWx0OlxuXHRcdFx0XHR0ZXh0ID0gVEFQaTE4bi5fXygnSm9pbl9DaGF0JykudG9VcHBlckNhc2UoKTtcblx0XHR9XG5cblx0XHRjb25zdCBpY29uU2l6ZSA9IGhpZGVJY29uID8gNyA6IDI0O1xuXHRcdGNvbnN0IGxlZnRTaXplID0gbmFtZSA/IG5hbWUubGVuZ3RoICogNiArIDcgKyBpY29uU2l6ZSA6IGljb25TaXplO1xuXHRcdGNvbnN0IHJpZ2h0U2l6ZSA9IHRleHQubGVuZ3RoICogNiArIDIwO1xuXHRcdGNvbnN0IHdpZHRoID0gbGVmdFNpemUgKyByaWdodFNpemU7XG5cdFx0Y29uc3QgaGVpZ2h0ID0gMjA7XG5cdFx0cmV0dXJuIHtcblx0XHRcdGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdpbWFnZS9zdmcreG1sO2NoYXJzZXQ9dXRmLTgnIH0sXG5cdFx0XHRib2R5OiBgXG5cdFx0XHRcdDxzdmcgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiIHhtbG5zOnhsaW5rPVwiaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGlua1wiIHdpZHRoPVwiJHsgd2lkdGggfVwiIGhlaWdodD1cIiR7IGhlaWdodCB9XCI+XG5cdFx0XHRcdCAgPGxpbmVhckdyYWRpZW50IGlkPVwiYlwiIHgyPVwiMFwiIHkyPVwiMTAwJVwiPlxuXHRcdFx0XHQgICAgPHN0b3Agb2Zmc2V0PVwiMFwiIHN0b3AtY29sb3I9XCIjYmJiXCIgc3RvcC1vcGFjaXR5PVwiLjFcIi8+XG5cdFx0XHRcdCAgICA8c3RvcCBvZmZzZXQ9XCIxXCIgc3RvcC1vcGFjaXR5PVwiLjFcIi8+XG5cdFx0XHRcdCAgPC9saW5lYXJHcmFkaWVudD5cblx0XHRcdFx0ICA8bWFzayBpZD1cImFcIj5cblx0XHRcdFx0ICAgIDxyZWN0IHdpZHRoPVwiJHsgd2lkdGggfVwiIGhlaWdodD1cIiR7IGhlaWdodCB9XCIgcng9XCIzXCIgZmlsbD1cIiNmZmZcIi8+XG5cdFx0XHRcdCAgPC9tYXNrPlxuXHRcdFx0XHQgIDxnIG1hc2s9XCJ1cmwoI2EpXCI+XG5cdFx0XHRcdCAgICA8cGF0aCBmaWxsPVwiIzU1NVwiIGQ9XCJNMCAwaCR7IGxlZnRTaXplIH12JHsgaGVpZ2h0IH1IMHpcIi8+XG5cdFx0XHRcdCAgICA8cGF0aCBmaWxsPVwiJHsgYmFja2dyb3VuZENvbG9yIH1cIiBkPVwiTSR7IGxlZnRTaXplIH0gMGgkeyByaWdodFNpemUgfXYkeyBoZWlnaHQgfUgkeyBsZWZ0U2l6ZSB9elwiLz5cblx0XHRcdFx0ICAgIDxwYXRoIGZpbGw9XCJ1cmwoI2IpXCIgZD1cIk0wIDBoJHsgd2lkdGggfXYkeyBoZWlnaHQgfUgwelwiLz5cblx0XHRcdFx0ICA8L2c+XG5cdFx0XHRcdCAgICAkeyBoaWRlSWNvbiA/ICcnIDogJzxpbWFnZSB4PVwiNVwiIHk9XCIzXCIgd2lkdGg9XCIxNFwiIGhlaWdodD1cIjE0XCIgeGxpbms6aHJlZj1cIi9hc3NldHMvZmF2aWNvbi5zdmdcIi8+JyB9XG5cdFx0XHRcdCAgPGcgZmlsbD1cIiNmZmZcIiBmb250LWZhbWlseT1cIkRlamFWdSBTYW5zLFZlcmRhbmEsR2VuZXZhLHNhbnMtc2VyaWZcIiBmb250LXNpemU9XCIxMVwiPlxuXHRcdFx0XHRcdFx0JHsgbmFtZSA/IGA8dGV4dCB4PVwiJHsgaWNvblNpemUgfVwiIHk9XCIxNVwiIGZpbGw9XCIjMDEwMTAxXCIgZmlsbC1vcGFjaXR5PVwiLjNcIj4keyBuYW1lIH08L3RleHQ+XG5cdFx0XHRcdCAgICA8dGV4dCB4PVwiJHsgaWNvblNpemUgfVwiIHk9XCIxNFwiPiR7IG5hbWUgfTwvdGV4dD5gIDogJycgfVxuXHRcdFx0XHQgICAgPHRleHQgeD1cIiR7IGxlZnRTaXplICsgNyB9XCIgeT1cIjE1XCIgZmlsbD1cIiMwMTAxMDFcIiBmaWxsLW9wYWNpdHk9XCIuM1wiPiR7IHRleHQgfTwvdGV4dD5cblx0XHRcdFx0ICAgIDx0ZXh0IHg9XCIkeyBsZWZ0U2l6ZSArIDcgfVwiIHk9XCIxNFwiPiR7IHRleHQgfTwvdGV4dD5cblx0XHRcdFx0ICA8L2c+XG5cdFx0XHRcdDwvc3ZnPlxuXHRcdFx0YC50cmltKCkucmVwbGFjZSgvXFw+W1xcc10rXFw8L2dtLCAnPjwnKVxuXHRcdH07XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnc3BvdGxpZ2h0JywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRnZXQoKSB7XG5cdFx0Y2hlY2sodGhpcy5xdWVyeVBhcmFtcywge1xuXHRcdFx0cXVlcnk6IFN0cmluZ1xuXHRcdH0pO1xuXG5cdFx0Y29uc3QgeyBxdWVyeSB9ID0gdGhpcy5xdWVyeVBhcmFtcztcblxuXHRcdGNvbnN0IHJlc3VsdCA9IE1ldGVvci5ydW5Bc1VzZXIodGhpcy51c2VySWQsICgpID0+XG5cdFx0XHRNZXRlb3IuY2FsbCgnc3BvdGxpZ2h0JywgcXVlcnkpXG5cdFx0KTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHJlc3VsdCk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnZGlyZWN0b3J5JywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRnZXQoKSB7XG5cdFx0Y29uc3QgeyBvZmZzZXQsIGNvdW50IH0gPSB0aGlzLmdldFBhZ2luYXRpb25JdGVtcygpO1xuXHRcdGNvbnN0IHsgc29ydCwgcXVlcnkgfSA9IHRoaXMucGFyc2VKc29uUXVlcnkoKTtcblxuXHRcdGNvbnN0IHsgdGV4dCwgdHlwZSB9ID0gcXVlcnk7XG5cdFx0Y29uc3Qgc29ydERpcmVjdGlvbiA9IHNvcnQgJiYgc29ydCA9PT0gMSA/ICdhc2MnIDogJ2Rlc2MnO1xuXG5cdFx0Y29uc3QgcmVzdWx0ID0gTWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4gTWV0ZW9yLmNhbGwoJ2Jyb3dzZUNoYW5uZWxzJywge1xuXHRcdFx0dGV4dCxcblx0XHRcdHR5cGUsXG5cdFx0XHRzb3J0OiBzb3J0RGlyZWN0aW9uLFxuXHRcdFx0cGFnZTogb2Zmc2V0LFxuXHRcdFx0bGltaXQ6IGNvdW50XG5cdFx0fSkpO1xuXG5cdFx0aWYgKCFyZXN1bHQpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCdQbGVhc2UgdmVyaWZ5IHRoZSBwYXJhbWV0ZXJzJyk7XG5cdFx0fVxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHsgcmVzdWx0IH0pO1xuXHR9XG59KTtcbiIsIi8qKlxuXHRUaGlzIEFQSSByZXR1cm5zIGFsbCBwZXJtaXNzaW9ucyB0aGF0IGV4aXN0c1xuXHRvbiB0aGUgc2VydmVyLCB3aXRoIHJlc3BlY3RpdmUgcm9sZXMuXG5cblx0TWV0aG9kOiBHRVRcblx0Um91dGU6IGFwaS92MS9wZXJtaXNzaW9uc1xuICovXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgncGVybWlzc2lvbnMnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdGdldCgpIHtcblx0XHRjb25zdCByZXN1bHQgPSBNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PiBNZXRlb3IuY2FsbCgncGVybWlzc2lvbnMvZ2V0JykpO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MocmVzdWx0KTtcblx0fVxufSk7XG4iLCIvKiBnbG9iYWxzIFB1c2ggKi9cblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ3B1c2gudG9rZW4nLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdHBvc3QoKSB7XG5cdFx0Y29uc3QgeyB0eXBlLCB2YWx1ZSwgYXBwTmFtZSB9ID0gdGhpcy5ib2R5UGFyYW1zO1xuXHRcdGxldCB7IGlkIH0gPSB0aGlzLmJvZHlQYXJhbXM7XG5cblx0XHRpZiAoaWQgJiYgdHlwZW9mIGlkICE9PSAnc3RyaW5nJykge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItaWQtcGFyYW0tbm90LXZhbGlkJywgJ1RoZSByZXF1aXJlZCBcImlkXCIgYm9keSBwYXJhbSBpcyBpbnZhbGlkLicpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRpZCA9IFJhbmRvbS5pZCgpO1xuXHRcdH1cblxuXHRcdGlmICghdHlwZSB8fCAodHlwZSAhPT0gJ2FwbicgJiYgdHlwZSAhPT0gJ2djbScpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci10eXBlLXBhcmFtLW5vdC12YWxpZCcsICdUaGUgcmVxdWlyZWQgXCJ0eXBlXCIgYm9keSBwYXJhbSBpcyBtaXNzaW5nIG9yIGludmFsaWQuJyk7XG5cdFx0fVxuXG5cdFx0aWYgKCF2YWx1ZSB8fCB0eXBlb2YgdmFsdWUgIT09ICdzdHJpbmcnKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci10b2tlbi1wYXJhbS1ub3QtdmFsaWQnLCAnVGhlIHJlcXVpcmVkIFwidG9rZW5cIiBib2R5IHBhcmFtIGlzIG1pc3Npbmcgb3IgaW52YWxpZC4nKTtcblx0XHR9XG5cblx0XHRpZiAoIWFwcE5hbWUgfHwgdHlwZW9mIGFwcE5hbWUgIT09ICdzdHJpbmcnKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1hcHBOYW1lLXBhcmFtLW5vdC12YWxpZCcsICdUaGUgcmVxdWlyZWQgXCJhcHBOYW1lXCIgYm9keSBwYXJhbSBpcyBtaXNzaW5nIG9yIGludmFsaWQuJyk7XG5cdFx0fVxuXG5cblx0XHRsZXQgcmVzdWx0O1xuXHRcdE1ldGVvci5ydW5Bc1VzZXIodGhpcy51c2VySWQsICgpID0+IHJlc3VsdCA9IE1ldGVvci5jYWxsKCdyYWl4OnB1c2gtdXBkYXRlJywge1xuXHRcdFx0aWQsXG5cdFx0XHR0b2tlbjogeyBbdHlwZV06IHZhbHVlIH0sXG5cdFx0XHRhcHBOYW1lLFxuXHRcdFx0dXNlcklkOiB0aGlzLnVzZXJJZFxuXHRcdH0pKTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHsgcmVzdWx0IH0pO1xuXHR9LFxuXHRkZWxldGUoKSB7XG5cdFx0Y29uc3QgeyB0b2tlbiB9ID0gdGhpcy5ib2R5UGFyYW1zO1xuXG5cdFx0aWYgKCF0b2tlbiB8fCB0eXBlb2YgdG9rZW4gIT09ICdzdHJpbmcnKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci10b2tlbi1wYXJhbS1ub3QtdmFsaWQnLCAnVGhlIHJlcXVpcmVkIFwidG9rZW5cIiBib2R5IHBhcmFtIGlzIG1pc3Npbmcgb3IgaW52YWxpZC4nKTtcblx0XHR9XG5cblx0XHRjb25zdCBhZmZlY3RlZFJlY29yZHMgPSBQdXNoLmFwcENvbGxlY3Rpb24ucmVtb3ZlKHtcblx0XHRcdCRvcjogW3tcblx0XHRcdFx0J3Rva2VuLmFwbic6IHRva2VuXG5cdFx0XHR9LCB7XG5cdFx0XHRcdCd0b2tlbi5nY20nOiB0b2tlblxuXHRcdFx0fV0sXG5cdFx0XHR1c2VySWQ6IHRoaXMudXNlcklkXG5cdFx0fSk7XG5cblx0XHRpZiAoYWZmZWN0ZWRSZWNvcmRzID09PSAwKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEubm90Rm91bmQoKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2VzcygpO1xuXHR9XG59KTtcbiIsImltcG9ydCBfIGZyb20gJ3VuZGVyc2NvcmUnO1xuXG4vLyBzZXR0aW5ncyBlbmRwb2ludHNcblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdzZXR0aW5ncy5wdWJsaWMnLCB7IGF1dGhSZXF1aXJlZDogZmFsc2UgfSwge1xuXHRnZXQoKSB7XG5cdFx0Y29uc3QgeyBvZmZzZXQsIGNvdW50IH0gPSB0aGlzLmdldFBhZ2luYXRpb25JdGVtcygpO1xuXHRcdGNvbnN0IHsgc29ydCwgZmllbGRzLCBxdWVyeSB9ID0gdGhpcy5wYXJzZUpzb25RdWVyeSgpO1xuXG5cdFx0bGV0IG91clF1ZXJ5ID0ge1xuXHRcdFx0aGlkZGVuOiB7ICRuZTogdHJ1ZSB9LFxuXHRcdFx0J3B1YmxpYyc6IHRydWVcblx0XHR9O1xuXG5cdFx0b3VyUXVlcnkgPSBPYmplY3QuYXNzaWduKHt9LCBxdWVyeSwgb3VyUXVlcnkpO1xuXG5cdFx0Y29uc3Qgc2V0dGluZ3MgPSBSb2NrZXRDaGF0Lm1vZGVscy5TZXR0aW5ncy5maW5kKG91clF1ZXJ5LCB7XG5cdFx0XHRzb3J0OiBzb3J0ID8gc29ydCA6IHsgX2lkOiAxIH0sXG5cdFx0XHRza2lwOiBvZmZzZXQsXG5cdFx0XHRsaW1pdDogY291bnQsXG5cdFx0XHRmaWVsZHM6IE9iamVjdC5hc3NpZ24oeyBfaWQ6IDEsIHZhbHVlOiAxIH0sIGZpZWxkcylcblx0XHR9KS5mZXRjaCgpO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0c2V0dGluZ3MsXG5cdFx0XHRjb3VudDogc2V0dGluZ3MubGVuZ3RoLFxuXHRcdFx0b2Zmc2V0LFxuXHRcdFx0dG90YWw6IFJvY2tldENoYXQubW9kZWxzLlNldHRpbmdzLmZpbmQob3VyUXVlcnkpLmNvdW50KClcblx0XHR9KTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdzZXR0aW5ncy5vYXV0aCcsIHsgYXV0aFJlcXVpcmVkOiBmYWxzZSB9LCB7XG5cdGdldCgpIHtcblx0XHRjb25zdCBtb3VudE9BdXRoU2VydmljZXMgPSAoKSA9PiB7XG5cdFx0XHRjb25zdCBvQXV0aFNlcnZpY2VzRW5hYmxlZCA9IFNlcnZpY2VDb25maWd1cmF0aW9uLmNvbmZpZ3VyYXRpb25zLmZpbmQoe30sIHsgZmllbGRzOiB7IHNlY3JldDogMCB9IH0pLmZldGNoKCk7XG5cblx0XHRcdHJldHVybiBvQXV0aFNlcnZpY2VzRW5hYmxlZC5tYXAoKHNlcnZpY2UpID0+IHtcblx0XHRcdFx0aWYgKHNlcnZpY2UuY3VzdG9tIHx8IFsnc2FtbCcsICdjYXMnXS5pbmNsdWRlcyhzZXJ2aWNlLnNlcnZpY2UpKSB7XG5cdFx0XHRcdFx0cmV0dXJuIHsgLi4uc2VydmljZSB9O1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0XHRfaWQ6IHNlcnZpY2UuX2lkLFxuXHRcdFx0XHRcdG5hbWU6IHNlcnZpY2Uuc2VydmljZSxcblx0XHRcdFx0XHRjbGllbnRJZDogc2VydmljZS5hcHBJZCB8fCBzZXJ2aWNlLmNsaWVudElkIHx8IHNlcnZpY2UuY29uc3VtZXJLZXksXG5cdFx0XHRcdFx0YnV0dG9uTGFiZWxUZXh0OiBzZXJ2aWNlLmJ1dHRvbkxhYmVsVGV4dCB8fCAnJyxcblx0XHRcdFx0XHRidXR0b25Db2xvcjogc2VydmljZS5idXR0b25Db2xvciB8fCAnJyxcblx0XHRcdFx0XHRidXR0b25MYWJlbENvbG9yOiBzZXJ2aWNlLmJ1dHRvbkxhYmVsQ29sb3IgfHwgJycsXG5cdFx0XHRcdFx0Y3VzdG9tOiBmYWxzZVxuXHRcdFx0XHR9O1xuXHRcdFx0fSk7XG5cdFx0fTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdHNlcnZpY2VzOiBtb3VudE9BdXRoU2VydmljZXMoKVxuXHRcdH0pO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ3NldHRpbmdzJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRnZXQoKSB7XG5cdFx0Y29uc3QgeyBvZmZzZXQsIGNvdW50IH0gPSB0aGlzLmdldFBhZ2luYXRpb25JdGVtcygpO1xuXHRcdGNvbnN0IHsgc29ydCwgZmllbGRzLCBxdWVyeSB9ID0gdGhpcy5wYXJzZUpzb25RdWVyeSgpO1xuXG5cdFx0bGV0IG91clF1ZXJ5ID0ge1xuXHRcdFx0aGlkZGVuOiB7ICRuZTogdHJ1ZSB9XG5cdFx0fTtcblxuXHRcdGlmICghUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKHRoaXMudXNlcklkLCAndmlldy1wcml2aWxlZ2VkLXNldHRpbmcnKSkge1xuXHRcdFx0b3VyUXVlcnkucHVibGljID0gdHJ1ZTtcblx0XHR9XG5cblx0XHRvdXJRdWVyeSA9IE9iamVjdC5hc3NpZ24oe30sIHF1ZXJ5LCBvdXJRdWVyeSk7XG5cblx0XHRjb25zdCBzZXR0aW5ncyA9IFJvY2tldENoYXQubW9kZWxzLlNldHRpbmdzLmZpbmQob3VyUXVlcnksIHtcblx0XHRcdHNvcnQ6IHNvcnQgPyBzb3J0IDogeyBfaWQ6IDEgfSxcblx0XHRcdHNraXA6IG9mZnNldCxcblx0XHRcdGxpbWl0OiBjb3VudCxcblx0XHRcdGZpZWxkczogT2JqZWN0LmFzc2lnbih7IF9pZDogMSwgdmFsdWU6IDEgfSwgZmllbGRzKVxuXHRcdH0pLmZldGNoKCk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7XG5cdFx0XHRzZXR0aW5ncyxcblx0XHRcdGNvdW50OiBzZXR0aW5ncy5sZW5ndGgsXG5cdFx0XHRvZmZzZXQsXG5cdFx0XHR0b3RhbDogUm9ja2V0Q2hhdC5tb2RlbHMuU2V0dGluZ3MuZmluZChvdXJRdWVyeSkuY291bnQoKVxuXHRcdH0pO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ3NldHRpbmdzLzpfaWQnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdGdldCgpIHtcblx0XHRpZiAoIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih0aGlzLnVzZXJJZCwgJ3ZpZXctcHJpdmlsZWdlZC1zZXR0aW5nJykpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS51bmF1dGhvcml6ZWQoKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2VzcyhfLnBpY2soUm9ja2V0Q2hhdC5tb2RlbHMuU2V0dGluZ3MuZmluZE9uZU5vdEhpZGRlbkJ5SWQodGhpcy51cmxQYXJhbXMuX2lkKSwgJ19pZCcsICd2YWx1ZScpKTtcblx0fSxcblx0cG9zdCgpIHtcblx0XHRpZiAoIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih0aGlzLnVzZXJJZCwgJ2VkaXQtcHJpdmlsZWdlZC1zZXR0aW5nJykpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS51bmF1dGhvcml6ZWQoKTtcblx0XHR9XG5cblx0XHRjaGVjayh0aGlzLmJvZHlQYXJhbXMsIHtcblx0XHRcdHZhbHVlOiBNYXRjaC5Bbnlcblx0XHR9KTtcblxuXHRcdGlmIChSb2NrZXRDaGF0Lm1vZGVscy5TZXR0aW5ncy51cGRhdGVWYWx1ZU5vdEhpZGRlbkJ5SWQodGhpcy51cmxQYXJhbXMuX2lkLCB0aGlzLmJvZHlQYXJhbXMudmFsdWUpKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2VzcygpO1xuXHRcdH1cblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnc2VydmljZS5jb25maWd1cmF0aW9ucycsIHsgYXV0aFJlcXVpcmVkOiBmYWxzZSB9LCB7XG5cdGdldCgpIHtcblx0XHRjb25zdCBTZXJ2aWNlQ29uZmlndXJhdGlvbiA9IFBhY2thZ2VbJ3NlcnZpY2UtY29uZmlndXJhdGlvbiddLlNlcnZpY2VDb25maWd1cmF0aW9uO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0Y29uZmlndXJhdGlvbnM6IFNlcnZpY2VDb25maWd1cmF0aW9uLmNvbmZpZ3VyYXRpb25zLmZpbmQoe30sIHsgZmllbGRzOiB7IHNlY3JldDogMCB9IH0pLmZldGNoKClcblx0XHR9KTtcblx0fVxufSk7XG4iLCJSb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnc3RhdGlzdGljcycsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0Z2V0KCkge1xuXHRcdGxldCByZWZyZXNoID0gZmFsc2U7XG5cdFx0aWYgKHR5cGVvZiB0aGlzLnF1ZXJ5UGFyYW1zLnJlZnJlc2ggIT09ICd1bmRlZmluZWQnICYmIHRoaXMucXVlcnlQYXJhbXMucmVmcmVzaCA9PT0gJ3RydWUnKSB7XG5cdFx0XHRyZWZyZXNoID0gdHJ1ZTtcblx0XHR9XG5cblx0XHRsZXQgc3RhdHM7XG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4ge1xuXHRcdFx0c3RhdHMgPSBNZXRlb3IuY2FsbCgnZ2V0U3RhdGlzdGljcycsIHJlZnJlc2gpO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0c3RhdGlzdGljczogc3RhdHNcblx0XHR9KTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdzdGF0aXN0aWNzLmxpc3QnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdGdldCgpIHtcblx0XHRpZiAoIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih0aGlzLnVzZXJJZCwgJ3ZpZXctc3RhdGlzdGljcycpKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEudW5hdXRob3JpemVkKCk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgeyBvZmZzZXQsIGNvdW50IH0gPSB0aGlzLmdldFBhZ2luYXRpb25JdGVtcygpO1xuXHRcdGNvbnN0IHsgc29ydCwgZmllbGRzLCBxdWVyeSB9ID0gdGhpcy5wYXJzZUpzb25RdWVyeSgpO1xuXG5cdFx0Y29uc3Qgc3RhdGlzdGljcyA9IFJvY2tldENoYXQubW9kZWxzLlN0YXRpc3RpY3MuZmluZChxdWVyeSwge1xuXHRcdFx0c29ydDogc29ydCA/IHNvcnQgOiB7IG5hbWU6IDEgfSxcblx0XHRcdHNraXA6IG9mZnNldCxcblx0XHRcdGxpbWl0OiBjb3VudCxcblx0XHRcdGZpZWxkc1xuXHRcdH0pLmZldGNoKCk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7XG5cdFx0XHRzdGF0aXN0aWNzLFxuXHRcdFx0Y291bnQ6IHN0YXRpc3RpY3MubGVuZ3RoLFxuXHRcdFx0b2Zmc2V0LFxuXHRcdFx0dG90YWw6IFJvY2tldENoYXQubW9kZWxzLlN0YXRpc3RpY3MuZmluZChxdWVyeSkuY291bnQoKVxuXHRcdH0pO1xuXHR9XG59KTtcbiIsImltcG9ydCBfIGZyb20gJ3VuZGVyc2NvcmUnO1xuaW1wb3J0IEJ1c2JveSBmcm9tICdidXNib3knO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgndXNlcnMuY3JlYXRlJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRwb3N0KCkge1xuXHRcdGNoZWNrKHRoaXMuYm9keVBhcmFtcywge1xuXHRcdFx0ZW1haWw6IFN0cmluZyxcblx0XHRcdG5hbWU6IFN0cmluZyxcblx0XHRcdHBhc3N3b3JkOiBTdHJpbmcsXG5cdFx0XHR1c2VybmFtZTogU3RyaW5nLFxuXHRcdFx0YWN0aXZlOiBNYXRjaC5NYXliZShCb29sZWFuKSxcblx0XHRcdHJvbGVzOiBNYXRjaC5NYXliZShBcnJheSksXG5cdFx0XHRqb2luRGVmYXVsdENoYW5uZWxzOiBNYXRjaC5NYXliZShCb29sZWFuKSxcblx0XHRcdHJlcXVpcmVQYXNzd29yZENoYW5nZTogTWF0Y2guTWF5YmUoQm9vbGVhbiksXG5cdFx0XHRzZW5kV2VsY29tZUVtYWlsOiBNYXRjaC5NYXliZShCb29sZWFuKSxcblx0XHRcdHZlcmlmaWVkOiBNYXRjaC5NYXliZShCb29sZWFuKSxcblx0XHRcdGN1c3RvbUZpZWxkczogTWF0Y2guTWF5YmUoT2JqZWN0KVxuXHRcdH0pO1xuXG5cdFx0Ly9OZXcgY2hhbmdlIG1hZGUgYnkgcHVsbCByZXF1ZXN0ICM1MTUyXG5cdFx0aWYgKHR5cGVvZiB0aGlzLmJvZHlQYXJhbXMuam9pbkRlZmF1bHRDaGFubmVscyA9PT0gJ3VuZGVmaW5lZCcpIHtcblx0XHRcdHRoaXMuYm9keVBhcmFtcy5qb2luRGVmYXVsdENoYW5uZWxzID0gdHJ1ZTtcblx0XHR9XG5cblx0XHRpZiAodGhpcy5ib2R5UGFyYW1zLmN1c3RvbUZpZWxkcykge1xuXHRcdFx0Um9ja2V0Q2hhdC52YWxpZGF0ZUN1c3RvbUZpZWxkcyh0aGlzLmJvZHlQYXJhbXMuY3VzdG9tRmllbGRzKTtcblx0XHR9XG5cblx0XHRjb25zdCBuZXdVc2VySWQgPSBSb2NrZXRDaGF0LnNhdmVVc2VyKHRoaXMudXNlcklkLCB0aGlzLmJvZHlQYXJhbXMpO1xuXG5cdFx0aWYgKHRoaXMuYm9keVBhcmFtcy5jdXN0b21GaWVsZHMpIHtcblx0XHRcdFJvY2tldENoYXQuc2F2ZUN1c3RvbUZpZWxkc1dpdGhvdXRWYWxpZGF0aW9uKG5ld1VzZXJJZCwgdGhpcy5ib2R5UGFyYW1zLmN1c3RvbUZpZWxkcyk7XG5cdFx0fVxuXG5cblx0XHRpZiAodHlwZW9mIHRoaXMuYm9keVBhcmFtcy5hY3RpdmUgIT09ICd1bmRlZmluZWQnKSB7XG5cdFx0XHRNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PiB7XG5cdFx0XHRcdE1ldGVvci5jYWxsKCdzZXRVc2VyQWN0aXZlU3RhdHVzJywgbmV3VXNlcklkLCB0aGlzLmJvZHlQYXJhbXMuYWN0aXZlKTtcblx0XHRcdH0pO1xuXHRcdH1cblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHsgdXNlcjogUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZE9uZUJ5SWQobmV3VXNlcklkLCB7IGZpZWxkczogUm9ja2V0Q2hhdC5BUEkudjEuZGVmYXVsdEZpZWxkc1RvRXhjbHVkZSB9KSB9KTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCd1c2Vycy5kZWxldGUnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdHBvc3QoKSB7XG5cdFx0aWYgKCFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odGhpcy51c2VySWQsICdkZWxldGUtdXNlcicpKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEudW5hdXRob3JpemVkKCk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgdXNlciA9IHRoaXMuZ2V0VXNlckZyb21QYXJhbXMoKTtcblxuXHRcdE1ldGVvci5ydW5Bc1VzZXIodGhpcy51c2VySWQsICgpID0+IHtcblx0XHRcdE1ldGVvci5jYWxsKCdkZWxldGVVc2VyJywgdXNlci5faWQpO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoKTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCd1c2Vycy5nZXRBdmF0YXInLCB7IGF1dGhSZXF1aXJlZDogZmFsc2UgfSwge1xuXHRnZXQoKSB7XG5cdFx0Y29uc3QgdXNlciA9IHRoaXMuZ2V0VXNlckZyb21QYXJhbXMoKTtcblxuXHRcdGNvbnN0IHVybCA9IFJvY2tldENoYXQuZ2V0VVJMKGAvYXZhdGFyLyR7IHVzZXIudXNlcm5hbWUgfWAsIHsgY2RuOiBmYWxzZSwgZnVsbDogdHJ1ZSB9KTtcblx0XHR0aGlzLnJlc3BvbnNlLnNldEhlYWRlcignTG9jYXRpb24nLCB1cmwpO1xuXG5cdFx0cmV0dXJuIHtcblx0XHRcdHN0YXR1c0NvZGU6IDMwNyxcblx0XHRcdGJvZHk6IHVybFxuXHRcdH07XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgndXNlcnMuZ2V0UHJlc2VuY2UnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdGdldCgpIHtcblx0XHRpZiAodGhpcy5pc1VzZXJGcm9tUGFyYW1zKCkpIHtcblx0XHRcdGNvbnN0IHVzZXIgPSBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kT25lQnlJZCh0aGlzLnVzZXJJZCk7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7XG5cdFx0XHRcdHByZXNlbmNlOiB1c2VyLnN0YXR1cyxcblx0XHRcdFx0Y29ubmVjdGlvblN0YXR1czogdXNlci5zdGF0dXNDb25uZWN0aW9uLFxuXHRcdFx0XHRsYXN0TG9naW46IHVzZXIubGFzdExvZ2luXG5cdFx0XHR9KTtcblx0XHR9XG5cblx0XHRjb25zdCB1c2VyID0gdGhpcy5nZXRVc2VyRnJvbVBhcmFtcygpO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0cHJlc2VuY2U6IHVzZXIuc3RhdHVzXG5cdFx0fSk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgndXNlcnMuaW5mbycsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0Z2V0KCkge1xuXHRcdGNvbnN0IHVzZXIgPSB0aGlzLmdldFVzZXJGcm9tUGFyYW1zKCk7XG5cblx0XHRsZXQgcmVzdWx0O1xuXHRcdE1ldGVvci5ydW5Bc1VzZXIodGhpcy51c2VySWQsICgpID0+IHtcblx0XHRcdHJlc3VsdCA9IE1ldGVvci5jYWxsKCdnZXRGdWxsVXNlckRhdGEnLCB7IGZpbHRlcjogdXNlci51c2VybmFtZSwgbGltaXQ6IDEgfSk7XG5cdFx0fSk7XG5cblx0XHRpZiAoIXJlc3VsdCB8fCByZXN1bHQubGVuZ3RoICE9PSAxKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZShgRmFpbGVkIHRvIGdldCB0aGUgdXNlciBkYXRhIGZvciB0aGUgdXNlcklkIG9mIFwiJHsgdXNlci5faWQgfVwiLmApO1xuXHRcdH1cblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdHVzZXI6IHJlc3VsdFswXVxuXHRcdH0pO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ3VzZXJzLmxpc3QnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdGdldCgpIHtcblx0XHRpZiAoIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih0aGlzLnVzZXJJZCwgJ3ZpZXctZC1yb29tJykpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS51bmF1dGhvcml6ZWQoKTtcblx0XHR9XG5cblx0XHRjb25zdCB7IG9mZnNldCwgY291bnQgfSA9IHRoaXMuZ2V0UGFnaW5hdGlvbkl0ZW1zKCk7XG5cdFx0Y29uc3QgeyBzb3J0LCBmaWVsZHMsIHF1ZXJ5IH0gPSB0aGlzLnBhcnNlSnNvblF1ZXJ5KCk7XG5cblx0XHRjb25zdCB1c2VycyA9IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmQocXVlcnksIHtcblx0XHRcdHNvcnQ6IHNvcnQgPyBzb3J0IDogeyB1c2VybmFtZTogMSB9LFxuXHRcdFx0c2tpcDogb2Zmc2V0LFxuXHRcdFx0bGltaXQ6IGNvdW50LFxuXHRcdFx0ZmllbGRzXG5cdFx0fSkuZmV0Y2goKTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdHVzZXJzLFxuXHRcdFx0Y291bnQ6IHVzZXJzLmxlbmd0aCxcblx0XHRcdG9mZnNldCxcblx0XHRcdHRvdGFsOiBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kKHF1ZXJ5KS5jb3VudCgpXG5cdFx0fSk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgndXNlcnMucmVnaXN0ZXInLCB7IGF1dGhSZXF1aXJlZDogZmFsc2UgfSwge1xuXHRwb3N0KCkge1xuXHRcdGlmICh0aGlzLnVzZXJJZCkge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoJ0xvZ2dlZCBpbiB1c2VycyBjYW4gbm90IHJlZ2lzdGVyIGFnYWluLicpO1xuXHRcdH1cblxuXHRcdC8vV2Ugc2V0IHRoZWlyIHVzZXJuYW1lIGhlcmUsIHNvIHJlcXVpcmUgaXRcblx0XHQvL1RoZSBgcmVnaXN0ZXJVc2VyYCBjaGVja3MgZm9yIHRoZSBvdGhlciByZXF1aXJlbWVudHNcblx0XHRjaGVjayh0aGlzLmJvZHlQYXJhbXMsIE1hdGNoLk9iamVjdEluY2x1ZGluZyh7XG5cdFx0XHR1c2VybmFtZTogU3RyaW5nXG5cdFx0fSkpO1xuXG5cdFx0Ly9SZWdpc3RlciB0aGUgdXNlclxuXHRcdGNvbnN0IHVzZXJJZCA9IE1ldGVvci5jYWxsKCdyZWdpc3RlclVzZXInLCB0aGlzLmJvZHlQYXJhbXMpO1xuXG5cdFx0Ly9Ob3cgc2V0IHRoZWlyIHVzZXJuYW1lXG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih1c2VySWQsICgpID0+IE1ldGVvci5jYWxsKCdzZXRVc2VybmFtZScsIHRoaXMuYm9keVBhcmFtcy51c2VybmFtZSkpO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoeyB1c2VyOiBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kT25lQnlJZCh1c2VySWQsIHsgZmllbGRzOiBSb2NrZXRDaGF0LkFQSS52MS5kZWZhdWx0RmllbGRzVG9FeGNsdWRlIH0pIH0pO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ3VzZXJzLnJlc2V0QXZhdGFyJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRwb3N0KCkge1xuXHRcdGNvbnN0IHVzZXIgPSB0aGlzLmdldFVzZXJGcm9tUGFyYW1zKCk7XG5cblx0XHRpZiAodXNlci5faWQgPT09IHRoaXMudXNlcklkKSB7XG5cdFx0XHRNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PiBNZXRlb3IuY2FsbCgncmVzZXRBdmF0YXInKSk7XG5cdFx0fSBlbHNlIGlmIChSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odGhpcy51c2VySWQsICdlZGl0LW90aGVyLXVzZXItaW5mbycpKSB7XG5cdFx0XHRNZXRlb3IucnVuQXNVc2VyKHVzZXIuX2lkLCAoKSA9PiBNZXRlb3IuY2FsbCgncmVzZXRBdmF0YXInKSk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS51bmF1dGhvcml6ZWQoKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2VzcygpO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ3VzZXJzLnNldEF2YXRhcicsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdCgpIHtcblx0XHRjaGVjayh0aGlzLmJvZHlQYXJhbXMsIE1hdGNoLk9iamVjdEluY2x1ZGluZyh7XG5cdFx0XHRhdmF0YXJVcmw6IE1hdGNoLk1heWJlKFN0cmluZyksXG5cdFx0XHR1c2VySWQ6IE1hdGNoLk1heWJlKFN0cmluZyksXG5cdFx0XHR1c2VybmFtZTogTWF0Y2guTWF5YmUoU3RyaW5nKVxuXHRcdH0pKTtcblxuXHRcdGxldCB1c2VyO1xuXHRcdGlmICh0aGlzLmlzVXNlckZyb21QYXJhbXMoKSkge1xuXHRcdFx0dXNlciA9IE1ldGVvci51c2Vycy5maW5kT25lKHRoaXMudXNlcklkKTtcblx0XHR9IGVsc2UgaWYgKFJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih0aGlzLnVzZXJJZCwgJ2VkaXQtb3RoZXItdXNlci1pbmZvJykpIHtcblx0XHRcdHVzZXIgPSB0aGlzLmdldFVzZXJGcm9tUGFyYW1zKCk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS51bmF1dGhvcml6ZWQoKTtcblx0XHR9XG5cblx0XHRNZXRlb3IucnVuQXNVc2VyKHVzZXIuX2lkLCAoKSA9PiB7XG5cdFx0XHRpZiAodGhpcy5ib2R5UGFyYW1zLmF2YXRhclVybCkge1xuXHRcdFx0XHRSb2NrZXRDaGF0LnNldFVzZXJBdmF0YXIodXNlciwgdGhpcy5ib2R5UGFyYW1zLmF2YXRhclVybCwgJycsICd1cmwnKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGNvbnN0IGJ1c2JveSA9IG5ldyBCdXNib3koeyBoZWFkZXJzOiB0aGlzLnJlcXVlc3QuaGVhZGVycyB9KTtcblxuXHRcdFx0XHRNZXRlb3Iud3JhcEFzeW5jKChjYWxsYmFjaykgPT4ge1xuXHRcdFx0XHRcdGJ1c2JveS5vbignZmlsZScsIE1ldGVvci5iaW5kRW52aXJvbm1lbnQoKGZpZWxkbmFtZSwgZmlsZSwgZmlsZW5hbWUsIGVuY29kaW5nLCBtaW1ldHlwZSkgPT4ge1xuXHRcdFx0XHRcdFx0aWYgKGZpZWxkbmFtZSAhPT0gJ2ltYWdlJykge1xuXHRcdFx0XHRcdFx0XHRyZXR1cm4gY2FsbGJhY2sobmV3IE1ldGVvci5FcnJvcignaW52YWxpZC1maWVsZCcpKTtcblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0Y29uc3QgaW1hZ2VEYXRhID0gW107XG5cdFx0XHRcdFx0XHRmaWxlLm9uKCdkYXRhJywgTWV0ZW9yLmJpbmRFbnZpcm9ubWVudCgoZGF0YSkgPT4ge1xuXHRcdFx0XHRcdFx0XHRpbWFnZURhdGEucHVzaChkYXRhKTtcblx0XHRcdFx0XHRcdH0pKTtcblxuXHRcdFx0XHRcdFx0ZmlsZS5vbignZW5kJywgTWV0ZW9yLmJpbmRFbnZpcm9ubWVudCgoKSA9PiB7XG5cdFx0XHRcdFx0XHRcdFJvY2tldENoYXQuc2V0VXNlckF2YXRhcih1c2VyLCBCdWZmZXIuY29uY2F0KGltYWdlRGF0YSksIG1pbWV0eXBlLCAncmVzdCcpO1xuXHRcdFx0XHRcdFx0XHRjYWxsYmFjaygpO1xuXHRcdFx0XHRcdFx0fSkpO1xuXG5cdFx0XHRcdFx0fSkpO1xuXHRcdFx0XHRcdHRoaXMucmVxdWVzdC5waXBlKGJ1c2JveSk7XG5cdFx0XHRcdH0pKCk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2VzcygpO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ3VzZXJzLnVwZGF0ZScsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdCgpIHtcblx0XHRjaGVjayh0aGlzLmJvZHlQYXJhbXMsIHtcblx0XHRcdHVzZXJJZDogU3RyaW5nLFxuXHRcdFx0ZGF0YTogTWF0Y2guT2JqZWN0SW5jbHVkaW5nKHtcblx0XHRcdFx0ZW1haWw6IE1hdGNoLk1heWJlKFN0cmluZyksXG5cdFx0XHRcdG5hbWU6IE1hdGNoLk1heWJlKFN0cmluZyksXG5cdFx0XHRcdHBhc3N3b3JkOiBNYXRjaC5NYXliZShTdHJpbmcpLFxuXHRcdFx0XHR1c2VybmFtZTogTWF0Y2guTWF5YmUoU3RyaW5nKSxcblx0XHRcdFx0YWN0aXZlOiBNYXRjaC5NYXliZShCb29sZWFuKSxcblx0XHRcdFx0cm9sZXM6IE1hdGNoLk1heWJlKEFycmF5KSxcblx0XHRcdFx0am9pbkRlZmF1bHRDaGFubmVsczogTWF0Y2guTWF5YmUoQm9vbGVhbiksXG5cdFx0XHRcdHJlcXVpcmVQYXNzd29yZENoYW5nZTogTWF0Y2guTWF5YmUoQm9vbGVhbiksXG5cdFx0XHRcdHNlbmRXZWxjb21lRW1haWw6IE1hdGNoLk1heWJlKEJvb2xlYW4pLFxuXHRcdFx0XHR2ZXJpZmllZDogTWF0Y2guTWF5YmUoQm9vbGVhbiksXG5cdFx0XHRcdGN1c3RvbUZpZWxkczogTWF0Y2guTWF5YmUoT2JqZWN0KVxuXHRcdFx0fSlcblx0XHR9KTtcblxuXHRcdGNvbnN0IHVzZXJEYXRhID0gXy5leHRlbmQoeyBfaWQ6IHRoaXMuYm9keVBhcmFtcy51c2VySWQgfSwgdGhpcy5ib2R5UGFyYW1zLmRhdGEpO1xuXG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4gUm9ja2V0Q2hhdC5zYXZlVXNlcih0aGlzLnVzZXJJZCwgdXNlckRhdGEpKTtcblxuXHRcdGlmICh0aGlzLmJvZHlQYXJhbXMuZGF0YS5jdXN0b21GaWVsZHMpIHtcblx0XHRcdFJvY2tldENoYXQuc2F2ZUN1c3RvbUZpZWxkcyh0aGlzLmJvZHlQYXJhbXMudXNlcklkLCB0aGlzLmJvZHlQYXJhbXMuZGF0YS5jdXN0b21GaWVsZHMpO1xuXHRcdH1cblxuXHRcdGlmICh0eXBlb2YgdGhpcy5ib2R5UGFyYW1zLmRhdGEuYWN0aXZlICE9PSAndW5kZWZpbmVkJykge1xuXHRcdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4ge1xuXHRcdFx0XHRNZXRlb3IuY2FsbCgnc2V0VXNlckFjdGl2ZVN0YXR1cycsIHRoaXMuYm9keVBhcmFtcy51c2VySWQsIHRoaXMuYm9keVBhcmFtcy5kYXRhLmFjdGl2ZSk7XG5cdFx0XHR9KTtcblx0XHR9XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7IHVzZXI6IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmVCeUlkKHRoaXMuYm9keVBhcmFtcy51c2VySWQsIHsgZmllbGRzOiBSb2NrZXRDaGF0LkFQSS52MS5kZWZhdWx0RmllbGRzVG9FeGNsdWRlIH0pIH0pO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ3VzZXJzLnVwZGF0ZU93bkJhc2ljSW5mbycsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdCgpIHtcblx0XHRjaGVjayh0aGlzLmJvZHlQYXJhbXMsIHtcblx0XHRcdGRhdGE6IE1hdGNoLk9iamVjdEluY2x1ZGluZyh7XG5cdFx0XHRcdGVtYWlsOiBNYXRjaC5NYXliZShTdHJpbmcpLFxuXHRcdFx0XHRuYW1lOiBNYXRjaC5NYXliZShTdHJpbmcpLFxuXHRcdFx0XHR1c2VybmFtZTogTWF0Y2guTWF5YmUoU3RyaW5nKSxcblx0XHRcdFx0Y3VycmVudFBhc3N3b3JkOiBNYXRjaC5NYXliZShTdHJpbmcpLFxuXHRcdFx0XHRuZXdQYXNzd29yZDogTWF0Y2guTWF5YmUoU3RyaW5nKVxuXHRcdFx0fSksXG5cdFx0XHRjdXN0b21GaWVsZHM6IE1hdGNoLk1heWJlKE9iamVjdClcblx0XHR9KTtcblxuXHRcdGNvbnN0IHVzZXJEYXRhID0ge1xuXHRcdFx0ZW1haWw6IHRoaXMuYm9keVBhcmFtcy5kYXRhLmVtYWlsLFxuXHRcdFx0cmVhbG5hbWU6IHRoaXMuYm9keVBhcmFtcy5kYXRhLm5hbWUsXG5cdFx0XHR1c2VybmFtZTogdGhpcy5ib2R5UGFyYW1zLmRhdGEudXNlcm5hbWUsXG5cdFx0XHRuZXdQYXNzd29yZDogdGhpcy5ib2R5UGFyYW1zLmRhdGEubmV3UGFzc3dvcmQsXG5cdFx0XHR0eXBlZFBhc3N3b3JkOiB0aGlzLmJvZHlQYXJhbXMuZGF0YS5jdXJyZW50UGFzc3dvcmRcblx0XHR9O1xuXG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4gTWV0ZW9yLmNhbGwoJ3NhdmVVc2VyUHJvZmlsZScsIHVzZXJEYXRhLCB0aGlzLmJvZHlQYXJhbXMuY3VzdG9tRmllbGRzKSk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7IHVzZXI6IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmVCeUlkKHRoaXMudXNlcklkLCB7IGZpZWxkczogUm9ja2V0Q2hhdC5BUEkudjEuZGVmYXVsdEZpZWxkc1RvRXhjbHVkZSB9KSB9KTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCd1c2Vycy5jcmVhdGVUb2tlbicsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdCgpIHtcblx0XHRjb25zdCB1c2VyID0gdGhpcy5nZXRVc2VyRnJvbVBhcmFtcygpO1xuXHRcdGxldCBkYXRhO1xuXHRcdE1ldGVvci5ydW5Bc1VzZXIodGhpcy51c2VySWQsICgpID0+IHtcblx0XHRcdGRhdGEgPSBNZXRlb3IuY2FsbCgnY3JlYXRlVG9rZW4nLCB1c2VyLl9pZCk7XG5cdFx0fSk7XG5cdFx0cmV0dXJuIGRhdGEgPyBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHsgZGF0YSB9KSA6IFJvY2tldENoYXQuQVBJLnYxLnVuYXV0aG9yaXplZCgpO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ3VzZXJzLmdldFByZWZlcmVuY2VzJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRnZXQoKSB7XG5cdFx0Y29uc3QgdXNlciA9IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmVCeUlkKHRoaXMudXNlcklkKTtcblx0XHRpZiAodXNlci5zZXR0aW5ncykge1xuXHRcdFx0Y29uc3QgcHJlZmVyZW5jZXMgPSB1c2VyLnNldHRpbmdzLnByZWZlcmVuY2VzO1xuXHRcdFx0cHJlZmVyZW5jZXNbJ2xhbmd1YWdlJ10gPSB1c2VyLmxhbmd1YWdlO1xuXG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7XG5cdFx0XHRcdHByZWZlcmVuY2VzXG5cdFx0XHR9KTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoVEFQaTE4bi5fXygnQWNjb3VudHNfRGVmYXVsdF9Vc2VyX1ByZWZlcmVuY2VzX25vdF9hdmFpbGFibGUnKS50b1VwcGVyQ2FzZSgpKTtcblx0XHR9XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgndXNlcnMuc2V0UHJlZmVyZW5jZXMnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdHBvc3QoKSB7XG5cdFx0Y2hlY2sodGhpcy5ib2R5UGFyYW1zLCB7XG5cdFx0XHR1c2VySWQ6IE1hdGNoLk1heWJlKFN0cmluZyksXG5cdFx0XHRkYXRhOiBNYXRjaC5PYmplY3RJbmNsdWRpbmcoe1xuXHRcdFx0XHRuZXdSb29tTm90aWZpY2F0aW9uOiBNYXRjaC5NYXliZShTdHJpbmcpLFxuXHRcdFx0XHRuZXdNZXNzYWdlTm90aWZpY2F0aW9uOiBNYXRjaC5NYXliZShTdHJpbmcpLFxuXHRcdFx0XHR1c2VFbW9qaXM6IE1hdGNoLk1heWJlKEJvb2xlYW4pLFxuXHRcdFx0XHRjb252ZXJ0QXNjaWlFbW9qaTogTWF0Y2guTWF5YmUoQm9vbGVhbiksXG5cdFx0XHRcdHNhdmVNb2JpbGVCYW5kd2lkdGg6IE1hdGNoLk1heWJlKEJvb2xlYW4pLFxuXHRcdFx0XHRjb2xsYXBzZU1lZGlhQnlEZWZhdWx0OiBNYXRjaC5NYXliZShCb29sZWFuKSxcblx0XHRcdFx0YXV0b0ltYWdlTG9hZDogTWF0Y2guTWF5YmUoQm9vbGVhbiksXG5cdFx0XHRcdGVtYWlsTm90aWZpY2F0aW9uTW9kZTogTWF0Y2guTWF5YmUoU3RyaW5nKSxcblx0XHRcdFx0cm9vbXNMaXN0RXhoaWJpdGlvbk1vZGU6IE1hdGNoLk1heWJlKFN0cmluZyksXG5cdFx0XHRcdHVucmVhZEFsZXJ0OiBNYXRjaC5NYXliZShCb29sZWFuKSxcblx0XHRcdFx0bm90aWZpY2F0aW9uc1NvdW5kVm9sdW1lOiBNYXRjaC5NYXliZShOdW1iZXIpLFxuXHRcdFx0XHRkZXNrdG9wTm90aWZpY2F0aW9uczogTWF0Y2guTWF5YmUoU3RyaW5nKSxcblx0XHRcdFx0bW9iaWxlTm90aWZpY2F0aW9uczogTWF0Y2guTWF5YmUoU3RyaW5nKSxcblx0XHRcdFx0ZW5hYmxlQXV0b0F3YXk6IE1hdGNoLk1heWJlKEJvb2xlYW4pLFxuXHRcdFx0XHRoaWdobGlnaHRzOiBNYXRjaC5NYXliZShBcnJheSksXG5cdFx0XHRcdGRlc2t0b3BOb3RpZmljYXRpb25EdXJhdGlvbjogTWF0Y2guTWF5YmUoTnVtYmVyKSxcblx0XHRcdFx0bWVzc2FnZVZpZXdNb2RlOiBNYXRjaC5NYXliZShOdW1iZXIpLFxuXHRcdFx0XHRoaWRlVXNlcm5hbWVzOiBNYXRjaC5NYXliZShCb29sZWFuKSxcblx0XHRcdFx0aGlkZVJvbGVzOiBNYXRjaC5NYXliZShCb29sZWFuKSxcblx0XHRcdFx0aGlkZUF2YXRhcnM6IE1hdGNoLk1heWJlKEJvb2xlYW4pLFxuXHRcdFx0XHRoaWRlRmxleFRhYjogTWF0Y2guTWF5YmUoQm9vbGVhbiksXG5cdFx0XHRcdHNlbmRPbkVudGVyOiBNYXRjaC5NYXliZShTdHJpbmcpLFxuXHRcdFx0XHRyb29tQ291bnRlclNpZGViYXI6IE1hdGNoLk1heWJlKEJvb2xlYW4pLFxuXHRcdFx0XHRsYW5ndWFnZTogTWF0Y2guTWF5YmUoU3RyaW5nKSxcblx0XHRcdFx0c2lkZWJhclNob3dGYXZvcml0ZXM6IE1hdGNoLk9wdGlvbmFsKEJvb2xlYW4pLFxuXHRcdFx0XHRzaWRlYmFyU2hvd1VucmVhZDogTWF0Y2guT3B0aW9uYWwoQm9vbGVhbiksXG5cdFx0XHRcdHNpZGViYXJTb3J0Ynk6IE1hdGNoLk9wdGlvbmFsKFN0cmluZyksXG5cdFx0XHRcdHNpZGViYXJWaWV3TW9kZTogTWF0Y2guT3B0aW9uYWwoU3RyaW5nKSxcblx0XHRcdFx0c2lkZWJhckhpZGVBdmF0YXI6IE1hdGNoLk9wdGlvbmFsKEJvb2xlYW4pLFxuXHRcdFx0XHRtZXJnZUNoYW5uZWxzOiBNYXRjaC5PcHRpb25hbChCb29sZWFuKSxcblx0XHRcdFx0bXV0ZUZvY3VzZWRDb252ZXJzYXRpb25zOiBNYXRjaC5PcHRpb25hbChCb29sZWFuKVxuXHRcdFx0fSlcblx0XHR9KTtcblxuXHRcdGxldCBwcmVmZXJlbmNlcztcblx0XHRjb25zdCB1c2VySWQgPSB0aGlzLmJvZHlQYXJhbXMudXNlcklkID8gdGhpcy5ib2R5UGFyYW1zLnVzZXJJZCA6IHRoaXMudXNlcklkO1xuXHRcdGlmICh0aGlzLmJvZHlQYXJhbXMuZGF0YS5sYW5ndWFnZSkge1xuXHRcdFx0Y29uc3QgbGFuZ3VhZ2UgPSB0aGlzLmJvZHlQYXJhbXMuZGF0YS5sYW5ndWFnZTtcblx0XHRcdGRlbGV0ZSB0aGlzLmJvZHlQYXJhbXMuZGF0YS5sYW5ndWFnZTtcblx0XHRcdHByZWZlcmVuY2VzID0gXy5leHRlbmQoeyBfaWQ6IHVzZXJJZCwgc2V0dGluZ3M6IHsgcHJlZmVyZW5jZXM6IHRoaXMuYm9keVBhcmFtcy5kYXRhIH0sIGxhbmd1YWdlIH0pO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRwcmVmZXJlbmNlcyA9IF8uZXh0ZW5kKHsgX2lkOiB1c2VySWQsIHNldHRpbmdzOiB7IHByZWZlcmVuY2VzOiB0aGlzLmJvZHlQYXJhbXMuZGF0YSB9IH0pO1xuXHRcdH1cblxuXHRcdE1ldGVvci5ydW5Bc1VzZXIodGhpcy51c2VySWQsICgpID0+IFJvY2tldENoYXQuc2F2ZVVzZXIodGhpcy51c2VySWQsIHByZWZlcmVuY2VzKSk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7IHVzZXI6IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmVCeUlkKHRoaXMuYm9keVBhcmFtcy51c2VySWQsIHsgZmllbGRzOiBwcmVmZXJlbmNlcyB9KSB9KTtcblx0fVxufSk7XG5cbi8qKlxuIERFUFJFQ0FURURcbiAvLyBUT0RPOiBSZW1vdmUgdGhpcyBhZnRlciB0aHJlZSB2ZXJzaW9ucyBoYXZlIGJlZW4gcmVsZWFzZWQuIFRoYXQgbWVhbnMgYXQgMC42NiB0aGlzIHNob3VsZCBiZSBnb25lLlxuIFRoaXMgQVBJIHJldHVybnMgdGhlIGxvZ2dlZCB1c2VyIHJvbGVzLlxuXG4gTWV0aG9kOiBHRVRcbiBSb3V0ZTogYXBpL3YxL3VzZXIucm9sZXNcbiAqL1xuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ3VzZXIucm9sZXMnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdGdldCgpIHtcblx0XHRsZXQgY3VycmVudFVzZXJSb2xlcyA9IHt9O1xuXG5cdFx0Y29uc3QgcmVzdWx0ID0gTWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4gTWV0ZW9yLmNhbGwoJ2dldFVzZXJSb2xlcycpKTtcblxuXHRcdGlmIChBcnJheS5pc0FycmF5KHJlc3VsdCkgJiYgcmVzdWx0Lmxlbmd0aCA+IDApIHtcblx0XHRcdGN1cnJlbnRVc2VyUm9sZXMgPSByZXN1bHRbMF07XG5cdFx0fVxuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3ModGhpcy5kZXByZWNhdGlvbldhcm5pbmcoe1xuXHRcdFx0ZW5kcG9pbnQ6ICd1c2VyLnJvbGVzJyxcblx0XHRcdHZlcnNpb25XaWxsQmVSZW1vdmU6ICd2MC42NicsXG5cdFx0XHRyZXNwb25zZTogY3VycmVudFVzZXJSb2xlc1xuXHRcdH0pKTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCd1c2Vycy5mb3Jnb3RQYXNzd29yZCcsIHsgYXV0aFJlcXVpcmVkOiBmYWxzZSB9LCB7XG5cdHBvc3QoKSB7XG5cdFx0Y29uc3QgeyBlbWFpbCB9ID0gdGhpcy5ib2R5UGFyYW1zO1xuXHRcdGlmICghZW1haWwpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCdUaGUgXFwnZW1haWxcXCcgcGFyYW0gaXMgcmVxdWlyZWQnKTtcblx0XHR9XG5cblx0XHRjb25zdCBlbWFpbFNlbnQgPSBNZXRlb3IuY2FsbCgnc2VuZEZvcmdvdFBhc3N3b3JkRW1haWwnLCBlbWFpbCk7XG5cdFx0aWYgKGVtYWlsU2VudCkge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoKTtcblx0XHR9XG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoJ1VzZXIgbm90IGZvdW5kJyk7XG5cdH1cbn0pO1xuIl19
