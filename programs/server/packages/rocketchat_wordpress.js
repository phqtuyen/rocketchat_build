(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var RocketChat = Package['rocketchat:lib'].RocketChat;
var CustomOAuth = Package['rocketchat:custom-oauth'].CustomOAuth;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var TAPi18next = Package['tap:i18n'].TAPi18next;
var TAPi18n = Package['tap:i18n'].TAPi18n;

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:wordpress":{"common.js":function(){

/////////////////////////////////////////////////////////////////////////////////////
//                                                                                 //
// packages/rocketchat_wordpress/common.js                                         //
//                                                                                 //
/////////////////////////////////////////////////////////////////////////////////////
                                                                                   //
/* globals CustomOAuth */
const config = {
  serverURL: '',
  identityPath: '/rest/v1/me',
  identityTokenSentVia: 'header',
  authorizePath: '/oauth2/authorize',
  tokenPath: '/oauth2/token',
  scope: 'auth',
  addAutopublishFields: {
    forLoggedInUser: ['services.wordpress'],
    forOtherUsers: ['services.wordpress.user_login']
  }
};
const WordPress = new CustomOAuth('wordpress', config);

if (Meteor.isServer) {
  Meteor.startup(function () {
    return RocketChat.settings.get('API_Wordpress_URL', function (key, value) {
      config.serverURL = value;
      return WordPress.configure(config);
    });
  });
} else {
  Meteor.startup(function () {
    return Tracker.autorun(function () {
      if (RocketChat.settings.get('API_Wordpress_URL')) {
        config.serverURL = RocketChat.settings.get('API_Wordpress_URL');
        return WordPress.configure(config);
      }
    });
  });
}
/////////////////////////////////////////////////////////////////////////////////////

},"startup.js":function(){

/////////////////////////////////////////////////////////////////////////////////////
//                                                                                 //
// packages/rocketchat_wordpress/startup.js                                        //
//                                                                                 //
/////////////////////////////////////////////////////////////////////////////////////
                                                                                   //
RocketChat.settings.addGroup('OAuth', function () {
  return this.section('WordPress', function () {
    const enableQuery = {
      _id: 'Accounts_OAuth_Wordpress',
      value: true
    };
    this.add('Accounts_OAuth_Wordpress', false, {
      type: 'boolean',
      'public': true
    });
    this.add('API_Wordpress_URL', '', {
      type: 'string',
      enableQuery,
      'public': true
    });
    this.add('Accounts_OAuth_Wordpress_id', '', {
      type: 'string',
      enableQuery
    });
    this.add('Accounts_OAuth_Wordpress_secret', '', {
      type: 'string',
      enableQuery
    });
    return this.add('Accounts_OAuth_Wordpress_callback_url', '_oauth/wordpress', {
      type: 'relativeUrl',
      readonly: true,
      force: true,
      enableQuery
    });
  });
});
/////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:wordpress/common.js");
require("/node_modules/meteor/rocketchat:wordpress/startup.js");

/* Exports */
Package._define("rocketchat:wordpress");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_wordpress.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDp3b3JkcHJlc3MvY29tbW9uLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OndvcmRwcmVzcy9zdGFydHVwLmpzIl0sIm5hbWVzIjpbImNvbmZpZyIsInNlcnZlclVSTCIsImlkZW50aXR5UGF0aCIsImlkZW50aXR5VG9rZW5TZW50VmlhIiwiYXV0aG9yaXplUGF0aCIsInRva2VuUGF0aCIsInNjb3BlIiwiYWRkQXV0b3B1Ymxpc2hGaWVsZHMiLCJmb3JMb2dnZWRJblVzZXIiLCJmb3JPdGhlclVzZXJzIiwiV29yZFByZXNzIiwiQ3VzdG9tT0F1dGgiLCJNZXRlb3IiLCJpc1NlcnZlciIsInN0YXJ0dXAiLCJSb2NrZXRDaGF0Iiwic2V0dGluZ3MiLCJnZXQiLCJrZXkiLCJ2YWx1ZSIsImNvbmZpZ3VyZSIsIlRyYWNrZXIiLCJhdXRvcnVuIiwiYWRkR3JvdXAiLCJzZWN0aW9uIiwiZW5hYmxlUXVlcnkiLCJfaWQiLCJhZGQiLCJ0eXBlIiwicmVhZG9ubHkiLCJmb3JjZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTtBQUVBLE1BQU1BLFNBQVM7QUFDZEMsYUFBVyxFQURHO0FBRWRDLGdCQUFjLGFBRkE7QUFHZEMsd0JBQXNCLFFBSFI7QUFJZEMsaUJBQWUsbUJBSkQ7QUFLZEMsYUFBVyxlQUxHO0FBTWRDLFNBQU8sTUFOTztBQU9kQyx3QkFBc0I7QUFDckJDLHFCQUFpQixDQUFDLG9CQUFELENBREk7QUFFckJDLG1CQUFlLENBQUMsK0JBQUQ7QUFGTTtBQVBSLENBQWY7QUFhQSxNQUFNQyxZQUFZLElBQUlDLFdBQUosQ0FBZ0IsV0FBaEIsRUFBNkJYLE1BQTdCLENBQWxCOztBQUVBLElBQUlZLE9BQU9DLFFBQVgsRUFBcUI7QUFDcEJELFNBQU9FLE9BQVAsQ0FBZSxZQUFXO0FBQ3pCLFdBQU9DLFdBQVdDLFFBQVgsQ0FBb0JDLEdBQXBCLENBQXdCLG1CQUF4QixFQUE2QyxVQUFTQyxHQUFULEVBQWNDLEtBQWQsRUFBcUI7QUFDeEVuQixhQUFPQyxTQUFQLEdBQW1Ca0IsS0FBbkI7QUFDQSxhQUFPVCxVQUFVVSxTQUFWLENBQW9CcEIsTUFBcEIsQ0FBUDtBQUNBLEtBSE0sQ0FBUDtBQUlBLEdBTEQ7QUFNQSxDQVBELE1BT087QUFDTlksU0FBT0UsT0FBUCxDQUFlLFlBQVc7QUFDekIsV0FBT08sUUFBUUMsT0FBUixDQUFnQixZQUFXO0FBQ2pDLFVBQUlQLFdBQVdDLFFBQVgsQ0FBb0JDLEdBQXBCLENBQXdCLG1CQUF4QixDQUFKLEVBQWtEO0FBQ2pEakIsZUFBT0MsU0FBUCxHQUFtQmMsV0FBV0MsUUFBWCxDQUFvQkMsR0FBcEIsQ0FBd0IsbUJBQXhCLENBQW5CO0FBQ0EsZUFBT1AsVUFBVVUsU0FBVixDQUFvQnBCLE1BQXBCLENBQVA7QUFDQTtBQUNELEtBTE0sQ0FBUDtBQU1BLEdBUEQ7QUFRQSxDOzs7Ozs7Ozs7OztBQ2pDRGUsV0FBV0MsUUFBWCxDQUFvQk8sUUFBcEIsQ0FBNkIsT0FBN0IsRUFBc0MsWUFBVztBQUNoRCxTQUFPLEtBQUtDLE9BQUwsQ0FBYSxXQUFiLEVBQTBCLFlBQVc7QUFFM0MsVUFBTUMsY0FBYztBQUNuQkMsV0FBSywwQkFEYztBQUVuQlAsYUFBTztBQUZZLEtBQXBCO0FBSUEsU0FBS1EsR0FBTCxDQUFTLDBCQUFULEVBQXFDLEtBQXJDLEVBQTRDO0FBQzNDQyxZQUFNLFNBRHFDO0FBRTNDLGdCQUFVO0FBRmlDLEtBQTVDO0FBSUEsU0FBS0QsR0FBTCxDQUFTLG1CQUFULEVBQThCLEVBQTlCLEVBQWtDO0FBQ2pDQyxZQUFNLFFBRDJCO0FBRWpDSCxpQkFGaUM7QUFHakMsZ0JBQVU7QUFIdUIsS0FBbEM7QUFLQSxTQUFLRSxHQUFMLENBQVMsNkJBQVQsRUFBd0MsRUFBeEMsRUFBNEM7QUFDM0NDLFlBQU0sUUFEcUM7QUFFM0NIO0FBRjJDLEtBQTVDO0FBSUEsU0FBS0UsR0FBTCxDQUFTLGlDQUFULEVBQTRDLEVBQTVDLEVBQWdEO0FBQy9DQyxZQUFNLFFBRHlDO0FBRS9DSDtBQUYrQyxLQUFoRDtBQUlBLFdBQU8sS0FBS0UsR0FBTCxDQUFTLHVDQUFULEVBQWtELGtCQUFsRCxFQUFzRTtBQUM1RUMsWUFBTSxhQURzRTtBQUU1RUMsZ0JBQVUsSUFGa0U7QUFHNUVDLGFBQU8sSUFIcUU7QUFJNUVMO0FBSjRFLEtBQXRFLENBQVA7QUFNQSxHQTdCTSxDQUFQO0FBOEJBLENBL0JELEUiLCJmaWxlIjoiL3BhY2thZ2VzL3JvY2tldGNoYXRfd29yZHByZXNzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyogZ2xvYmFscyBDdXN0b21PQXV0aCAqL1xuXG5jb25zdCBjb25maWcgPSB7XG5cdHNlcnZlclVSTDogJycsXG5cdGlkZW50aXR5UGF0aDogJy9yZXN0L3YxL21lJyxcblx0aWRlbnRpdHlUb2tlblNlbnRWaWE6ICdoZWFkZXInLFxuXHRhdXRob3JpemVQYXRoOiAnL29hdXRoMi9hdXRob3JpemUnLFxuXHR0b2tlblBhdGg6ICcvb2F1dGgyL3Rva2VuJyxcblx0c2NvcGU6ICdhdXRoJyxcblx0YWRkQXV0b3B1Ymxpc2hGaWVsZHM6IHtcblx0XHRmb3JMb2dnZWRJblVzZXI6IFsnc2VydmljZXMud29yZHByZXNzJ10sXG5cdFx0Zm9yT3RoZXJVc2VyczogWydzZXJ2aWNlcy53b3JkcHJlc3MudXNlcl9sb2dpbiddXG5cdH1cbn07XG5cbmNvbnN0IFdvcmRQcmVzcyA9IG5ldyBDdXN0b21PQXV0aCgnd29yZHByZXNzJywgY29uZmlnKTtcblxuaWYgKE1ldGVvci5pc1NlcnZlcikge1xuXHRNZXRlb3Iuc3RhcnR1cChmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0FQSV9Xb3JkcHJlc3NfVVJMJywgZnVuY3Rpb24oa2V5LCB2YWx1ZSkge1xuXHRcdFx0Y29uZmlnLnNlcnZlclVSTCA9IHZhbHVlO1xuXHRcdFx0cmV0dXJuIFdvcmRQcmVzcy5jb25maWd1cmUoY29uZmlnKTtcblx0XHR9KTtcblx0fSk7XG59IGVsc2Uge1xuXHRNZXRlb3Iuc3RhcnR1cChmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gVHJhY2tlci5hdXRvcnVuKGZ1bmN0aW9uKCkge1xuXHRcdFx0aWYgKFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdBUElfV29yZHByZXNzX1VSTCcpKSB7XG5cdFx0XHRcdGNvbmZpZy5zZXJ2ZXJVUkwgPSBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnQVBJX1dvcmRwcmVzc19VUkwnKTtcblx0XHRcdFx0cmV0dXJuIFdvcmRQcmVzcy5jb25maWd1cmUoY29uZmlnKTtcblx0XHRcdH1cblx0XHR9KTtcblx0fSk7XG59XG4iLCJSb2NrZXRDaGF0LnNldHRpbmdzLmFkZEdyb3VwKCdPQXV0aCcsIGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4gdGhpcy5zZWN0aW9uKCdXb3JkUHJlc3MnLCBmdW5jdGlvbigpIHtcblxuXHRcdGNvbnN0IGVuYWJsZVF1ZXJ5ID0ge1xuXHRcdFx0X2lkOiAnQWNjb3VudHNfT0F1dGhfV29yZHByZXNzJyxcblx0XHRcdHZhbHVlOiB0cnVlXG5cdFx0fTtcblx0XHR0aGlzLmFkZCgnQWNjb3VudHNfT0F1dGhfV29yZHByZXNzJywgZmFsc2UsIHtcblx0XHRcdHR5cGU6ICdib29sZWFuJyxcblx0XHRcdCdwdWJsaWMnOiB0cnVlXG5cdFx0fSk7XG5cdFx0dGhpcy5hZGQoJ0FQSV9Xb3JkcHJlc3NfVVJMJywgJycsIHtcblx0XHRcdHR5cGU6ICdzdHJpbmcnLFxuXHRcdFx0ZW5hYmxlUXVlcnksXG5cdFx0XHQncHVibGljJzogdHJ1ZVxuXHRcdH0pO1xuXHRcdHRoaXMuYWRkKCdBY2NvdW50c19PQXV0aF9Xb3JkcHJlc3NfaWQnLCAnJywge1xuXHRcdFx0dHlwZTogJ3N0cmluZycsXG5cdFx0XHRlbmFibGVRdWVyeVxuXHRcdH0pO1xuXHRcdHRoaXMuYWRkKCdBY2NvdW50c19PQXV0aF9Xb3JkcHJlc3Nfc2VjcmV0JywgJycsIHtcblx0XHRcdHR5cGU6ICdzdHJpbmcnLFxuXHRcdFx0ZW5hYmxlUXVlcnlcblx0XHR9KTtcblx0XHRyZXR1cm4gdGhpcy5hZGQoJ0FjY291bnRzX09BdXRoX1dvcmRwcmVzc19jYWxsYmFja191cmwnLCAnX29hdXRoL3dvcmRwcmVzcycsIHtcblx0XHRcdHR5cGU6ICdyZWxhdGl2ZVVybCcsXG5cdFx0XHRyZWFkb25seTogdHJ1ZSxcblx0XHRcdGZvcmNlOiB0cnVlLFxuXHRcdFx0ZW5hYmxlUXVlcnlcblx0XHR9KTtcblx0fSk7XG59KTtcbiJdfQ==
