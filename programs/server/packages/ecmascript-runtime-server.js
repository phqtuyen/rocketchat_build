(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var meteorInstall = Package.modules.meteorInstall;

var require = meteorInstall({"node_modules":{"meteor":{"ecmascript-runtime-server":{"runtime.js":function(require){

////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                        //
// packages/ecmascript-runtime-server/runtime.js                                          //
//                                                                                        //
////////////////////////////////////////////////////////////////////////////////////////////
                                                                                          //
// The ecmascript-runtime-server package depends on its own copy of
// core-js using Npm.depends, so we don't have to check that core-js is
// available (as we do in ecmascript-runtime-client/runtime.js).

// List of polyfills generated by babel-preset-env with the following
// .babelrc configuration:
//
// {
//   "presets": [
//     ["env", {
//       "targets": {
//         "node": 8
//       },
//       "modules": false,
//       "polyfill": true,
//       "useBuiltIns": true
//     }]
//   ]
// }
//
// Note that the es6.reflect.* and es6.typed.* modules have been commented
// out for bundle size reasons.

require("core-js/modules/es7.string.pad-start");
require("core-js/modules/es7.string.pad-end");

////////////////////////////////////////////////////////////////////////////////////////////

},"node_modules":{"core-js":{"modules":{"es7.string.pad-start.js":function(require){

////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                        //
// node_modules/meteor/ecmascript-runtime-server/node_modules/core-js/modules/es7.string. //
//                                                                                        //
////////////////////////////////////////////////////////////////////////////////////////////
                                                                                          //
'use strict';
// https://github.com/tc39/proposal-string-pad-start-end
var $export = require('./_export')
  , $pad    = require('./_string-pad');

$export($export.P, 'String', {
  padStart: function padStart(maxLength /*, fillString = ' ' */){
    return $pad(this, maxLength, arguments.length > 1 ? arguments[1] : undefined, true);
  }
});
////////////////////////////////////////////////////////////////////////////////////////////

},"es7.string.pad-end.js":function(require){

////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                        //
// node_modules/meteor/ecmascript-runtime-server/node_modules/core-js/modules/es7.string. //
//                                                                                        //
////////////////////////////////////////////////////////////////////////////////////////////
                                                                                          //
'use strict';
// https://github.com/tc39/proposal-string-pad-start-end
var $export = require('./_export')
  , $pad    = require('./_string-pad');

$export($export.P, 'String', {
  padEnd: function padEnd(maxLength /*, fillString = ' ' */){
    return $pad(this, maxLength, arguments.length > 1 ? arguments[1] : undefined, false);
  }
});
////////////////////////////////////////////////////////////////////////////////////////////

}}}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
var exports = require("/node_modules/meteor/ecmascript-runtime-server/runtime.js");

/* Exports */
Package._define("ecmascript-runtime-server", exports);

})();