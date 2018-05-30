(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var RocketChatFile = Package['rocketchat:file'].RocketChatFile;
var Slingshot = Package['edgee:slingshot'].Slingshot;
var RocketChat = Package['rocketchat:lib'].RocketChat;
var Random = Package.random.Random;
var Accounts = Package['accounts-base'].Accounts;
var Tracker = Package.tracker.Tracker;
var Deps = Package.tracker.Deps;
var WebApp = Package.webapp.WebApp;
var WebAppInternals = Package.webapp.WebAppInternals;
var main = Package.webapp.main;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var TAPi18next = Package['tap:i18n'].TAPi18next;
var TAPi18n = Package['tap:i18n'].TAPi18n;

/* Package-scope variables */
var FileUpload, FileUploadBase, file, options, fileUploadHandler;

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:file-upload":{"globalFileRestrictions.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_file-upload/globalFileRestrictions.js                                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let filesize;
module.watch(require("filesize"), {
  default(v) {
    filesize = v;
  }

}, 0);
const slingShotConfig = {
  authorize(file
  /*, metaContext*/
  ) {
    //Deny uploads if user is not logged in.
    if (!this.userId) {
      throw new Meteor.Error('login-required', 'Please login before posting files');
    }

    if (!RocketChat.fileUploadIsValidContentType(file.type)) {
      throw new Meteor.Error(TAPi18n.__('error-invalid-file-type'));
    }

    const maxFileSize = RocketChat.settings.get('FileUpload_MaxFileSize');

    if (maxFileSize >= -1 && maxFileSize < file.size) {
      throw new Meteor.Error(TAPi18n.__('File_exceeds_allowed_size_of_bytes', {
        size: filesize(maxFileSize)
      }));
    }

    return true;
  },

  maxSize: 0,
  allowedFileTypes: null
};
Slingshot.fileRestrictions('rocketchat-uploads', slingShotConfig);
Slingshot.fileRestrictions('rocketchat-uploads-gs', slingShotConfig);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"lib":{"FileUpload.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_file-upload/lib/FileUpload.js                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let filesize;
module.watch(require("filesize"), {
  default(v) {
    filesize = v;
  }

}, 0);
let maxFileSize = 0;
FileUpload = {
  validateFileUpload(file) {
    if (!Match.test(file.rid, String)) {
      return false;
    }

    const user = Meteor.user();
    const room = RocketChat.models.Rooms.findOneById(file.rid);
    const directMessageAllow = RocketChat.settings.get('FileUpload_Enabled_Direct');
    const fileUploadAllowed = RocketChat.settings.get('FileUpload_Enabled');

    if (RocketChat.authz.canAccessRoom(room, user) !== true) {
      return false;
    }

    if (!fileUploadAllowed) {
      const reason = TAPi18n.__('FileUpload_Disabled', user.language);

      throw new Meteor.Error('error-file-upload-disabled', reason);
    }

    if (!directMessageAllow && room.t === 'd') {
      const reason = TAPi18n.__('File_not_allowed_direct_messages', user.language);

      throw new Meteor.Error('error-direct-message-file-upload-not-allowed', reason);
    } // -1 maxFileSize means there is no limit


    if (maxFileSize >= -1 && file.size > maxFileSize) {
      const reason = TAPi18n.__('File_exceeds_allowed_size_of_bytes', {
        size: filesize(maxFileSize)
      }, user.language);

      throw new Meteor.Error('error-file-too-large', reason);
    }

    if (maxFileSize > 0) {
      if (file.size > maxFileSize) {
        const reason = TAPi18n.__('File_exceeds_allowed_size_of_bytes', {
          size: filesize(maxFileSize)
        }, user.language);

        throw new Meteor.Error('error-file-too-large', reason);
      }
    }

    if (!RocketChat.fileUploadIsValidContentType(file.type)) {
      const reason = TAPi18n.__('File_type_is_not_accepted', user.language);

      throw new Meteor.Error('error-invalid-file-type', reason);
    }

    return true;
  }

};
RocketChat.settings.get('FileUpload_MaxFileSize', function (key, value) {
  try {
    maxFileSize = parseInt(value);
  } catch (e) {
    maxFileSize = RocketChat.models.Settings.findOneById('FileUpload_MaxFileSize').packageValue;
  }
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"FileUploadBase.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_file-upload/lib/FileUploadBase.js                                                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
UploadFS.config.defaultStorePermissions = new UploadFS.StorePermissions({
  insert(userId, doc) {
    if (userId) {
      return true;
    } // allow inserts from slackbridge (message_id = slack-timestamp-milli)


    if (doc && doc.message_id && doc.message_id.indexOf('slack-') === 0) {
      return true;
    } // allow inserts to the UserDataFiles store


    if (doc && doc.store && doc.store.split(':').pop() === 'UserDataFiles') {
      return true;
    }

    return false;
  },

  update(userId, doc) {
    return RocketChat.authz.hasPermission(Meteor.userId(), 'delete-message', doc.rid) || RocketChat.settings.get('Message_AllowDeleting') && userId === doc.userId;
  },

  remove(userId, doc) {
    return RocketChat.authz.hasPermission(Meteor.userId(), 'delete-message', doc.rid) || RocketChat.settings.get('Message_AllowDeleting') && userId === doc.userId;
  }

});
FileUploadBase = class FileUploadBase {
  constructor(store, meta, file) {
    this.id = Random.id();
    this.meta = meta;
    this.file = file;
    this.store = store;
  }

  getProgress() {}

  getFileName() {
    return this.meta.name;
  }

  start(callback) {
    this.handler = new UploadFS.Uploader({
      store: this.store,
      data: this.file,
      file: this.meta,
      onError: err => {
        return callback(err);
      },
      onComplete: fileData => {
        const file = _.pick(fileData, '_id', 'type', 'size', 'name', 'identify', 'description');

        file.url = fileData.url.replace(Meteor.absoluteUrl(), '/');
        return callback(null, file, this.store.options.name);
      }
    });

    this.handler.onProgress = (file, progress) => {
      this.onProgress(progress);
    };

    return this.handler.start();
  }

  onProgress() {}

  stop() {
    return this.handler.stop();
  }

};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"server":{"lib":{"FileUpload.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_file-upload/server/lib/FileUpload.js                                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  FileUploadClass: () => FileUploadClass
});
let fs;
module.watch(require("fs"), {
  default(v) {
    fs = v;
  }

}, 0);
let stream;
module.watch(require("stream"), {
  default(v) {
    stream = v;
  }

}, 1);
let mime;
module.watch(require("mime-type/with-db"), {
  default(v) {
    mime = v;
  }

}, 2);
let Future;
module.watch(require("fibers/future"), {
  default(v) {
    Future = v;
  }

}, 3);
let sharp;
module.watch(require("sharp"), {
  default(v) {
    sharp = v;
  }

}, 4);
let Cookies;
module.watch(require("meteor/ostrio:cookies"), {
  Cookies(v) {
    Cookies = v;
  }

}, 5);
const cookie = new Cookies();
Object.assign(FileUpload, {
  handlers: {},

  configureUploadsStore(store, name, options) {
    const type = name.split(':').pop();
    const stores = UploadFS.getStores();
    delete stores[name];
    return new UploadFS.store[store](Object.assign({
      name
    }, options, FileUpload[`default${type}`]()));
  },

  defaultUploads() {
    return {
      collection: RocketChat.models.Uploads.model,
      filter: new UploadFS.Filter({
        onCheck: FileUpload.validateFileUpload
      }),

      getPath(file) {
        return `${RocketChat.settings.get('uniqueID')}/uploads/${file.rid}/${file.userId}/${file._id}`;
      },

      onValidate: FileUpload.uploadsOnValidate,

      onRead(fileId, file, req, res) {
        if (!FileUpload.requestCanAccessFiles(req)) {
          res.writeHead(403);
          return false;
        }

        res.setHeader('content-disposition', `attachment; filename="${encodeURIComponent(file.name)}"`);
        return true;
      }

    };
  },

  defaultAvatars() {
    return {
      collection: RocketChat.models.Avatars.model,

      // filter: new UploadFS.Filter({
      // 	onCheck: FileUpload.validateFileUpload
      // }),
      getPath(file) {
        return `${RocketChat.settings.get('uniqueID')}/avatars/${file.userId}`;
      },

      onValidate: FileUpload.avatarsOnValidate,
      onFinishUpload: FileUpload.avatarsOnFinishUpload
    };
  },

  defaultUserDataFiles() {
    return {
      collection: RocketChat.models.UserDataFiles.model,

      getPath(file) {
        return `${RocketChat.settings.get('uniqueID')}/uploads/userData/${file.userId}`;
      },

      onValidate: FileUpload.uploadsOnValidate,

      onRead(fileId, file, req, res) {
        if (!FileUpload.requestCanAccessFiles(req)) {
          res.writeHead(403);
          return false;
        }

        res.setHeader('content-disposition', `attachment; filename="${encodeURIComponent(file.name)}"`);
        return true;
      }

    };
  },

  avatarsOnValidate(file) {
    if (RocketChat.settings.get('Accounts_AvatarResize') !== true) {
      return;
    }

    const tempFilePath = UploadFS.getTempFilePath(file._id);
    const height = RocketChat.settings.get('Accounts_AvatarSize');
    const future = new Future();
    const s = sharp(tempFilePath);
    s.rotate(); // Get metadata to resize the image the first time to keep "inside" the dimensions
    // then resize again to create the canvas around

    s.metadata(Meteor.bindEnvironment((err, metadata) => {
      s.toFormat(sharp.format.jpeg).resize(Math.min(height, metadata.width), Math.min(height, metadata.height)).pipe(sharp().resize(height, height).background('#FFFFFF').embed()) // Use buffer to get the result in memory then replace the existing file
      // There is no option to override a file using this library
      .toBuffer().then(Meteor.bindEnvironment(outputBuffer => {
        fs.writeFile(tempFilePath, outputBuffer, Meteor.bindEnvironment(err => {
          if (err != null) {
            console.error(err);
          }

          const size = fs.lstatSync(tempFilePath).size;
          this.getCollection().direct.update({
            _id: file._id
          }, {
            $set: {
              size
            }
          });
          future.return();
        }));
      }));
    }));
    return future.wait();
  },

  resizeImagePreview(file) {
    file = RocketChat.models.Uploads.findOneById(file._id);
    file = FileUpload.addExtensionTo(file);

    const image = FileUpload.getStore('Uploads')._store.getReadStream(file._id, file);

    const transformer = sharp().resize(32, 32).max().jpeg().blur();
    const result = transformer.toBuffer().then(out => out.toString('base64'));
    image.pipe(transformer);
    return result;
  },

  uploadsOnValidate(file) {
    if (!/^image\/((x-windows-)?bmp|p?jpeg|png)$/.test(file.type)) {
      return;
    }

    const tmpFile = UploadFS.getTempFilePath(file._id);
    const fut = new Future();
    const s = sharp(tmpFile);
    s.metadata(Meteor.bindEnvironment((err, metadata) => {
      if (err != null) {
        console.error(err);
        return fut.return();
      }

      const identify = {
        format: metadata.format,
        size: {
          width: metadata.width,
          height: metadata.height
        }
      };

      if (metadata.orientation == null) {
        return fut.return();
      }

      s.rotate().toFile(`${tmpFile}.tmp`).then(Meteor.bindEnvironment(() => {
        fs.unlink(tmpFile, Meteor.bindEnvironment(() => {
          fs.rename(`${tmpFile}.tmp`, tmpFile, Meteor.bindEnvironment(() => {
            const size = fs.lstatSync(tmpFile).size;
            this.getCollection().direct.update({
              _id: file._id
            }, {
              $set: {
                size,
                identify
              }
            });
            fut.return();
          }));
        }));
      })).catch(err => {
        console.error(err);
        fut.return();
      });
    }));
    return fut.wait();
  },

  avatarsOnFinishUpload(file) {
    // update file record to match user's username
    const user = RocketChat.models.Users.findOneById(file.userId);
    const oldAvatar = RocketChat.models.Avatars.findOneByName(user.username);

    if (oldAvatar) {
      RocketChat.models.Avatars.deleteFile(oldAvatar._id);
    }

    RocketChat.models.Avatars.updateFileNameById(file._id, user.username); // console.log('upload finished ->', file);
  },

  requestCanAccessFiles({
    headers = {},
    query = {}
  }) {
    if (!RocketChat.settings.get('FileUpload_ProtectFiles')) {
      return true;
    }

    let {
      rc_uid,
      rc_token
    } = query;

    if (!rc_uid && headers.cookie) {
      rc_uid = cookie.get('rc_uid', headers.cookie);
      rc_token = cookie.get('rc_token', headers.cookie);
    }

    if (!rc_uid || !rc_token || !RocketChat.models.Users.findOneByIdAndLoginToken(rc_uid, rc_token)) {
      return false;
    }

    return true;
  },

  addExtensionTo(file) {
    if (mime.lookup(file.name) === file.type) {
      return file;
    }

    const ext = mime.extension(file.type);

    if (ext && false === new RegExp(`\.${ext}$`, 'i').test(file.name)) {
      file.name = `${file.name}.${ext}`;
    }

    return file;
  },

  getStore(modelName) {
    const storageType = RocketChat.settings.get('FileUpload_Storage_Type');
    const handlerName = `${storageType}:${modelName}`;
    return this.getStoreByName(handlerName);
  },

  getStoreByName(handlerName) {
    if (this.handlers[handlerName] == null) {
      console.error(`Upload handler "${handlerName}" does not exists`);
    }

    return this.handlers[handlerName];
  },

  get(file, req, res, next) {
    const store = this.getStoreByName(file.store);

    if (store && store.get) {
      return store.get(file, req, res, next);
    }

    res.writeHead(404);
    res.end();
  },

  copy(file, targetFile) {
    const store = this.getStoreByName(file.store);
    const out = fs.createWriteStream(targetFile);
    file = FileUpload.addExtensionTo(file);

    if (store.copy) {
      store.copy(file, out);
      return true;
    }

    return false;
  }

});

class FileUploadClass {
  constructor({
    name,
    model,
    store,
    get,
    insert,
    getStore,
    copy
  }) {
    this.name = name;
    this.model = model || this.getModelFromName();
    this._store = store || UploadFS.getStore(name);
    this.get = get;
    this.copy = copy;

    if (insert) {
      this.insert = insert;
    }

    if (getStore) {
      this.getStore = getStore;
    }

    FileUpload.handlers[name] = this;
  }

  getStore() {
    return this._store;
  }

  get store() {
    return this.getStore();
  }

  set store(store) {
    this._store = store;
  }

  getModelFromName() {
    return RocketChat.models[this.name.split(':')[1]];
  }

  delete(fileId) {
    if (this.store && this.store.delete) {
      this.store.delete(fileId);
    }

    return this.model.deleteFile(fileId);
  }

  deleteById(fileId) {
    const file = this.model.findOneById(fileId);

    if (!file) {
      return;
    }

    const store = FileUpload.getStoreByName(file.store);
    return store.delete(file._id);
  }

  deleteByName(fileName) {
    const file = this.model.findOneByName(fileName);

    if (!file) {
      return;
    }

    const store = FileUpload.getStoreByName(file.store);
    return store.delete(file._id);
  }

  insert(fileData, streamOrBuffer, cb) {
    fileData.size = parseInt(fileData.size) || 0; // Check if the fileData matches store filter

    const filter = this.store.getFilter();

    if (filter && filter.check) {
      filter.check(fileData);
    }

    const fileId = this.store.create(fileData);
    const token = this.store.createToken(fileId);
    const tmpFile = UploadFS.getTempFilePath(fileId);

    try {
      if (streamOrBuffer instanceof stream) {
        streamOrBuffer.pipe(fs.createWriteStream(tmpFile));
      } else if (streamOrBuffer instanceof Buffer) {
        fs.writeFileSync(tmpFile, streamOrBuffer);
      } else {
        throw new Error('Invalid file type');
      }

      const file = Meteor.call('ufsComplete', fileId, this.name, token);

      if (cb) {
        cb(null, file);
      }

      return file;
    } catch (e) {
      if (cb) {
        cb(e);
      } else {
        throw e;
      }
    }
  }

}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"proxy.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_file-upload/server/lib/proxy.js                                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let http;
module.watch(require("http"), {
  default(v) {
    http = v;
  }

}, 0);
let URL;
module.watch(require("url"), {
  default(v) {
    URL = v;
  }

}, 1);
const logger = new Logger('UploadProxy');
WebApp.connectHandlers.stack.unshift({
  route: '',
  handle: Meteor.bindEnvironment(function (req, res, next) {
    // Quick check to see if request should be catch
    if (req.url.indexOf(UploadFS.config.storesPath) === -1) {
      return next();
    }

    logger.debug('Upload URL:', req.url);

    if (req.method !== 'POST') {
      return next();
    } // Remove store path


    const parsedUrl = URL.parse(req.url);
    const path = parsedUrl.pathname.substr(UploadFS.config.storesPath.length + 1); // Get store

    const regExp = new RegExp('^\/([^\/\?]+)\/([^\/\?]+)$');
    const match = regExp.exec(path); // Request is not valid

    if (match === null) {
      res.writeHead(400);
      res.end();
      return;
    } // Get store


    const store = UploadFS.getStore(match[1]);

    if (!store) {
      res.writeHead(404);
      res.end();
      return;
    } // Get file


    const fileId = match[2];
    const file = store.getCollection().findOne({
      _id: fileId
    });

    if (file === undefined) {
      res.writeHead(404);
      res.end();
      return;
    }

    if (file.instanceId === InstanceStatus.id()) {
      logger.debug('Correct instance');
      return next();
    } // Proxy to other instance


    const instance = InstanceStatus.getCollection().findOne({
      _id: file.instanceId
    });

    if (instance == null) {
      res.writeHead(404);
      res.end();
      return;
    }

    if (instance.extraInformation.host === process.env.INSTANCE_IP && RocketChat.isDocker() === false) {
      instance.extraInformation.host = 'localhost';
    }

    logger.debug('Wrong instance, proxing to:', `${instance.extraInformation.host}:${instance.extraInformation.port}`);
    const options = {
      hostname: instance.extraInformation.host,
      port: instance.extraInformation.port,
      path: req.originalUrl,
      method: 'POST'
    };
    const proxy = http.request(options, function (proxy_res) {
      proxy_res.pipe(res, {
        end: true
      });
    });
    req.pipe(proxy, {
      end: true
    });
  })
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"requests.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_file-upload/server/lib/requests.js                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/* globals FileUpload, WebApp */
WebApp.connectHandlers.use('/file-upload/', function (req, res, next) {
  const match = /^\/([^\/]+)\/(.*)/.exec(req.url);

  if (match[1]) {
    const file = RocketChat.models.Uploads.findOneById(match[1]);

    if (file) {
      if (!Meteor.settings.public.sandstorm && !FileUpload.requestCanAccessFiles(req)) {
        res.writeHead(403);
        return res.end();
      }

      res.setHeader('Content-Security-Policy', 'default-src \'none\'');
      return FileUpload.get(file, req, res, next);
    }
  }

  res.writeHead(404);
  res.end();
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"config":{"_configUploadStorage.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_file-upload/server/config/_configUploadStorage.js                                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
module.watch(require("./AmazonS3.js"));
module.watch(require("./FileSystem.js"));
module.watch(require("./GoogleStorage.js"));
module.watch(require("./GridFS.js"));
module.watch(require("./Slingshot_DEPRECATED.js"));

const configStore = _.debounce(() => {
  const store = RocketChat.settings.get('FileUpload_Storage_Type');

  if (store) {
    console.log('Setting default file store to', store);
    UploadFS.getStores().Avatars = UploadFS.getStore(`${store}:Avatars`);
    UploadFS.getStores().Uploads = UploadFS.getStore(`${store}:Uploads`);
    UploadFS.getStores().UserDataFiles = UploadFS.getStore(`${store}:UserDataFiles`);
  }
}, 1000);

RocketChat.settings.get(/^FileUpload_/, configStore);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"AmazonS3.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_file-upload/server/config/AmazonS3.js                                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
let FileUploadClass;
module.watch(require("../lib/FileUpload"), {
  FileUploadClass(v) {
    FileUploadClass = v;
  }

}, 1);
module.watch(require("../../ufs/AmazonS3/server.js"));
let http;
module.watch(require("http"), {
  default(v) {
    http = v;
  }

}, 2);
let https;
module.watch(require("https"), {
  default(v) {
    https = v;
  }

}, 3);

const get = function (file, req, res) {
  const fileUrl = this.store.getRedirectURL(file);

  if (fileUrl) {
    const storeType = file.store.split(':').pop();

    if (RocketChat.settings.get(`FileUpload_S3_Proxy_${storeType}`)) {
      const request = /^https:/.test(fileUrl) ? https : http;
      request.get(fileUrl, fileRes => fileRes.pipe(res));
    } else {
      res.removeHeader('Content-Length');
      res.setHeader('Location', fileUrl);
      res.writeHead(302);
      res.end();
    }
  } else {
    res.end();
  }
};

const copy = function (file, out) {
  const fileUrl = this.store.getRedirectURL(file);

  if (fileUrl) {
    const request = /^https:/.test(fileUrl) ? https : http;
    request.get(fileUrl, fileRes => fileRes.pipe(out));
  } else {
    out.end();
  }
};

const AmazonS3Uploads = new FileUploadClass({
  name: 'AmazonS3:Uploads',
  get,
  copy // store setted bellow

});
const AmazonS3Avatars = new FileUploadClass({
  name: 'AmazonS3:Avatars',
  get,
  copy // store setted bellow

});
const AmazonS3UserDataFiles = new FileUploadClass({
  name: 'AmazonS3:UserDataFiles',
  get,
  copy // store setted bellow

});

const configure = _.debounce(function () {
  const Bucket = RocketChat.settings.get('FileUpload_S3_Bucket');
  const Acl = RocketChat.settings.get('FileUpload_S3_Acl');
  const AWSAccessKeyId = RocketChat.settings.get('FileUpload_S3_AWSAccessKeyId');
  const AWSSecretAccessKey = RocketChat.settings.get('FileUpload_S3_AWSSecretAccessKey');
  const URLExpiryTimeSpan = RocketChat.settings.get('FileUpload_S3_URLExpiryTimeSpan');
  const Region = RocketChat.settings.get('FileUpload_S3_Region');
  const SignatureVersion = RocketChat.settings.get('FileUpload_S3_SignatureVersion');
  const ForcePathStyle = RocketChat.settings.get('FileUpload_S3_ForcePathStyle'); // const CDN = RocketChat.settings.get('FileUpload_S3_CDN');

  const BucketURL = RocketChat.settings.get('FileUpload_S3_BucketURL');

  if (!Bucket || !AWSAccessKeyId || !AWSSecretAccessKey) {
    return;
  }

  const config = {
    connection: {
      accessKeyId: AWSAccessKeyId,
      secretAccessKey: AWSSecretAccessKey,
      signatureVersion: SignatureVersion,
      s3ForcePathStyle: ForcePathStyle,
      params: {
        Bucket,
        ACL: Acl
      },
      region: Region
    },
    URLExpiryTimeSpan
  };

  if (BucketURL) {
    config.connection.endpoint = BucketURL;
  }

  AmazonS3Uploads.store = FileUpload.configureUploadsStore('AmazonS3', AmazonS3Uploads.name, config);
  AmazonS3Avatars.store = FileUpload.configureUploadsStore('AmazonS3', AmazonS3Avatars.name, config);
  AmazonS3UserDataFiles.store = FileUpload.configureUploadsStore('AmazonS3', AmazonS3UserDataFiles.name, config);
}, 500);

RocketChat.settings.get(/^FileUpload_S3_/, configure);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"FileSystem.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_file-upload/server/config/FileSystem.js                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
let fs;
module.watch(require("fs"), {
  default(v) {
    fs = v;
  }

}, 1);
let FileUploadClass;
module.watch(require("../lib/FileUpload"), {
  FileUploadClass(v) {
    FileUploadClass = v;
  }

}, 2);
const FileSystemUploads = new FileUploadClass({
  name: 'FileSystem:Uploads',

  // store setted bellow
  get(file, req, res) {
    const filePath = this.store.getFilePath(file._id, file);

    try {
      const stat = Meteor.wrapAsync(fs.stat)(filePath);

      if (stat && stat.isFile()) {
        file = FileUpload.addExtensionTo(file);
        res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(file.name)}`);
        res.setHeader('Last-Modified', file.uploadedAt.toUTCString());
        res.setHeader('Content-Type', file.type);
        res.setHeader('Content-Length', file.size);
        this.store.getReadStream(file._id, file).pipe(res);
      }
    } catch (e) {
      res.writeHead(404);
      res.end();
      return;
    }
  },

  copy(file, out) {
    const filePath = this.store.getFilePath(file._id, file);

    try {
      const stat = Meteor.wrapAsync(fs.stat)(filePath);

      if (stat && stat.isFile()) {
        file = FileUpload.addExtensionTo(file);
        this.store.getReadStream(file._id, file).pipe(out);
      }
    } catch (e) {
      out.end();
      return;
    }
  }

});
const FileSystemAvatars = new FileUploadClass({
  name: 'FileSystem:Avatars',

  // store setted bellow
  get(file, req, res) {
    const filePath = this.store.getFilePath(file._id, file);

    try {
      const stat = Meteor.wrapAsync(fs.stat)(filePath);

      if (stat && stat.isFile()) {
        file = FileUpload.addExtensionTo(file);
        this.store.getReadStream(file._id, file).pipe(res);
      }
    } catch (e) {
      res.writeHead(404);
      res.end();
      return;
    }
  }

});
const FileSystemUserDataFiles = new FileUploadClass({
  name: 'FileSystem:UserDataFiles',

  get(file, req, res) {
    const filePath = this.store.getFilePath(file._id, file);

    try {
      const stat = Meteor.wrapAsync(fs.stat)(filePath);

      if (stat && stat.isFile()) {
        file = FileUpload.addExtensionTo(file);
        res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(file.name)}`);
        res.setHeader('Last-Modified', file.uploadedAt.toUTCString());
        res.setHeader('Content-Type', file.type);
        res.setHeader('Content-Length', file.size);
        this.store.getReadStream(file._id, file).pipe(res);
      }
    } catch (e) {
      res.writeHead(404);
      res.end();
      return;
    }
  }

});

const createFileSystemStore = _.debounce(function () {
  const options = {
    path: RocketChat.settings.get('FileUpload_FileSystemPath') //'/tmp/uploads/photos',

  };
  FileSystemUploads.store = FileUpload.configureUploadsStore('Local', FileSystemUploads.name, options);
  FileSystemAvatars.store = FileUpload.configureUploadsStore('Local', FileSystemAvatars.name, options);
  FileSystemUserDataFiles.store = FileUpload.configureUploadsStore('Local', FileSystemUserDataFiles.name, options); // DEPRECATED backwards compatibililty (remove)

  UploadFS.getStores()['fileSystem'] = UploadFS.getStores()[FileSystemUploads.name];
}, 500);

RocketChat.settings.get('FileUpload_FileSystemPath', createFileSystemStore);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"GoogleStorage.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_file-upload/server/config/GoogleStorage.js                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
let FileUploadClass;
module.watch(require("../lib/FileUpload"), {
  FileUploadClass(v) {
    FileUploadClass = v;
  }

}, 1);
module.watch(require("../../ufs/GoogleStorage/server.js"));
let http;
module.watch(require("http"), {
  default(v) {
    http = v;
  }

}, 2);
let https;
module.watch(require("https"), {
  default(v) {
    https = v;
  }

}, 3);

const get = function (file, req, res) {
  this.store.getRedirectURL(file, (err, fileUrl) => {
    if (err) {
      console.error(err);
    }

    if (fileUrl) {
      const storeType = file.store.split(':').pop();

      if (RocketChat.settings.get(`FileUpload_GoogleStorage_Proxy_${storeType}`)) {
        const request = /^https:/.test(fileUrl) ? https : http;
        request.get(fileUrl, fileRes => fileRes.pipe(res));
      } else {
        res.removeHeader('Content-Length');
        res.setHeader('Location', fileUrl);
        res.writeHead(302);
        res.end();
      }
    } else {
      res.end();
    }
  });
};

const copy = function (file, out) {
  this.store.getRedirectURL(file, (err, fileUrl) => {
    if (err) {
      console.error(err);
    }

    if (fileUrl) {
      const request = /^https:/.test(fileUrl) ? https : http;
      request.get(fileUrl, fileRes => fileRes.pipe(out));
    } else {
      out.end();
    }
  });
};

const GoogleCloudStorageUploads = new FileUploadClass({
  name: 'GoogleCloudStorage:Uploads',
  get,
  copy // store setted bellow

});
const GoogleCloudStorageAvatars = new FileUploadClass({
  name: 'GoogleCloudStorage:Avatars',
  get,
  copy // store setted bellow

});
const GoogleCloudStorageUserDataFiles = new FileUploadClass({
  name: 'GoogleCloudStorage:UserDataFiles',
  get,
  copy // store setted bellow

});

const configure = _.debounce(function () {
  const bucket = RocketChat.settings.get('FileUpload_GoogleStorage_Bucket');
  const accessId = RocketChat.settings.get('FileUpload_GoogleStorage_AccessId');
  const secret = RocketChat.settings.get('FileUpload_GoogleStorage_Secret');
  const URLExpiryTimeSpan = RocketChat.settings.get('FileUpload_S3_URLExpiryTimeSpan');

  if (!bucket || !accessId || !secret) {
    return;
  }

  const config = {
    connection: {
      credentials: {
        client_email: accessId,
        private_key: secret
      }
    },
    bucket,
    URLExpiryTimeSpan
  };
  GoogleCloudStorageUploads.store = FileUpload.configureUploadsStore('GoogleStorage', GoogleCloudStorageUploads.name, config);
  GoogleCloudStorageAvatars.store = FileUpload.configureUploadsStore('GoogleStorage', GoogleCloudStorageAvatars.name, config);
  GoogleCloudStorageUserDataFiles.store = FileUpload.configureUploadsStore('GoogleStorage', GoogleCloudStorageUserDataFiles.name, config);
}, 500);

RocketChat.settings.get(/^FileUpload_GoogleStorage_/, configure);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"GridFS.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_file-upload/server/config/GridFS.js                                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let stream;
module.watch(require("stream"), {
  default(v) {
    stream = v;
  }

}, 0);
let zlib;
module.watch(require("zlib"), {
  default(v) {
    zlib = v;
  }

}, 1);
let util;
module.watch(require("util"), {
  default(v) {
    util = v;
  }

}, 2);
let FileUploadClass;
module.watch(require("../lib/FileUpload"), {
  FileUploadClass(v) {
    FileUploadClass = v;
  }

}, 3);
const logger = new Logger('FileUpload');

function ExtractRange(options) {
  if (!(this instanceof ExtractRange)) {
    return new ExtractRange(options);
  }

  this.start = options.start;
  this.stop = options.stop;
  this.bytes_read = 0;
  stream.Transform.call(this, options);
}

util.inherits(ExtractRange, stream.Transform);

ExtractRange.prototype._transform = function (chunk, enc, cb) {
  if (this.bytes_read > this.stop) {
    // done reading
    this.end();
  } else if (this.bytes_read + chunk.length < this.start) {// this chunk is still before the start byte
  } else {
    let start;
    let stop;

    if (this.start <= this.bytes_read) {
      start = 0;
    } else {
      start = this.start - this.bytes_read;
    }

    if (this.stop - this.bytes_read + 1 < chunk.length) {
      stop = this.stop - this.bytes_read + 1;
    } else {
      stop = chunk.length;
    }

    const newchunk = chunk.slice(start, stop);
    this.push(newchunk);
  }

  this.bytes_read += chunk.length;
  cb();
};

const getByteRange = function (header) {
  if (header) {
    const matches = header.match(/(\d+)-(\d+)/);

    if (matches) {
      return {
        start: parseInt(matches[1], 10),
        stop: parseInt(matches[2], 10)
      };
    }
  }

  return null;
}; // code from: https://github.com/jalik/jalik-ufs/blob/master/ufs-server.js#L310


const readFromGridFS = function (storeName, fileId, file, req, res) {
  const store = UploadFS.getStore(storeName);
  const rs = store.getReadStream(fileId, file);
  const ws = new stream.PassThrough();
  [rs, ws].forEach(stream => stream.on('error', function (err) {
    store.onReadError.call(store, err, fileId, file);
    res.end();
  }));
  ws.on('close', function () {
    // Close output stream at the end
    ws.emit('end');
  });
  const accept = req.headers['accept-encoding'] || ''; // Transform stream

  store.transformRead(rs, ws, fileId, file, req);
  const range = getByteRange(req.headers.range);
  let out_of_range = false;

  if (range) {
    out_of_range = range.start > file.size || range.stop <= range.start || range.stop > file.size;
  } // Compress data using gzip


  if (accept.match(/\bgzip\b/) && range === null) {
    res.setHeader('Content-Encoding', 'gzip');
    res.removeHeader('Content-Length');
    res.writeHead(200);
    ws.pipe(zlib.createGzip()).pipe(res);
  } else if (accept.match(/\bdeflate\b/) && range === null) {
    // Compress data using deflate
    res.setHeader('Content-Encoding', 'deflate');
    res.removeHeader('Content-Length');
    res.writeHead(200);
    ws.pipe(zlib.createDeflate()).pipe(res);
  } else if (range && out_of_range) {
    // out of range request, return 416
    res.removeHeader('Content-Length');
    res.removeHeader('Content-Type');
    res.removeHeader('Content-Disposition');
    res.removeHeader('Last-Modified');
    res.setHeader('Content-Range', `bytes */${file.size}`);
    res.writeHead(416);
    res.end();
  } else if (range) {
    res.setHeader('Content-Range', `bytes ${range.start}-${range.stop}/${file.size}`);
    res.removeHeader('Content-Length');
    res.setHeader('Content-Length', range.stop - range.start + 1);
    res.writeHead(206);
    logger.debug('File upload extracting range');
    ws.pipe(new ExtractRange({
      start: range.start,
      stop: range.stop
    })).pipe(res);
  } else {
    res.writeHead(200);
    ws.pipe(res);
  }
};

const copyFromGridFS = function (storeName, fileId, file, out) {
  const store = UploadFS.getStore(storeName);
  const rs = store.getReadStream(fileId, file);
  [rs, out].forEach(stream => stream.on('error', function (err) {
    store.onReadError.call(store, err, fileId, file);
    out.end();
  }));
  rs.pipe(out);
};

FileUpload.configureUploadsStore('GridFS', 'GridFS:Uploads', {
  collectionName: 'rocketchat_uploads'
});
FileUpload.configureUploadsStore('GridFS', 'GridFS:UserDataFiles', {
  collectionName: 'rocketchat_userDataFiles'
}); // DEPRECATED: backwards compatibility (remove)

UploadFS.getStores()['rocketchat_uploads'] = UploadFS.getStores()['GridFS:Uploads'];
FileUpload.configureUploadsStore('GridFS', 'GridFS:Avatars', {
  collectionName: 'rocketchat_avatars'
});
new FileUploadClass({
  name: 'GridFS:Uploads',

  get(file, req, res) {
    file = FileUpload.addExtensionTo(file);
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(file.name)}`);
    res.setHeader('Last-Modified', file.uploadedAt.toUTCString());
    res.setHeader('Content-Type', file.type);
    res.setHeader('Content-Length', file.size);
    return readFromGridFS(file.store, file._id, file, req, res);
  },

  copy(file, out) {
    copyFromGridFS(file.store, file._id, file, out);
  }

});
new FileUploadClass({
  name: 'GridFS:UserDataFiles',

  get(file, req, res) {
    file = FileUpload.addExtensionTo(file);
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(file.name)}`);
    res.setHeader('Last-Modified', file.uploadedAt.toUTCString());
    res.setHeader('Content-Type', file.type);
    res.setHeader('Content-Length', file.size);
    return readFromGridFS(file.store, file._id, file, req, res);
  },

  copy(file, out) {
    copyFromGridFS(file.store, file._id, file, out);
  }

});
new FileUploadClass({
  name: 'GridFS:Avatars',

  get(file, req, res) {
    file = FileUpload.addExtensionTo(file);
    return readFromGridFS(file.store, file._id, file, req, res);
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"Slingshot_DEPRECATED.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_file-upload/server/config/Slingshot_DEPRECATED.js                                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);

const configureSlingshot = _.debounce(() => {
  const type = RocketChat.settings.get('FileUpload_Storage_Type');
  const bucket = RocketChat.settings.get('FileUpload_S3_Bucket');
  const acl = RocketChat.settings.get('FileUpload_S3_Acl');
  const accessKey = RocketChat.settings.get('FileUpload_S3_AWSAccessKeyId');
  const secretKey = RocketChat.settings.get('FileUpload_S3_AWSSecretAccessKey');
  const cdn = RocketChat.settings.get('FileUpload_S3_CDN');
  const region = RocketChat.settings.get('FileUpload_S3_Region');
  const bucketUrl = RocketChat.settings.get('FileUpload_S3_BucketURL');
  delete Slingshot._directives['rocketchat-uploads'];

  if (type === 'AmazonS3' && !_.isEmpty(bucket) && !_.isEmpty(accessKey) && !_.isEmpty(secretKey)) {
    if (Slingshot._directives['rocketchat-uploads']) {
      delete Slingshot._directives['rocketchat-uploads'];
    }

    const config = {
      bucket,

      key(file, metaContext) {
        const id = Random.id();
        const path = `${RocketChat.settings.get('uniqueID')}/uploads/${metaContext.rid}/${this.userId}/${id}`;
        const upload = {
          _id: id,
          rid: metaContext.rid,
          AmazonS3: {
            path
          }
        };
        RocketChat.models.Uploads.insertFileInit(this.userId, 'AmazonS3:Uploads', file, upload);
        return path;
      },

      AWSAccessKeyId: accessKey,
      AWSSecretAccessKey: secretKey
    };

    if (!_.isEmpty(acl)) {
      config.acl = acl;
    }

    if (!_.isEmpty(cdn)) {
      config.cdn = cdn;
    }

    if (!_.isEmpty(region)) {
      config.region = region;
    }

    if (!_.isEmpty(bucketUrl)) {
      config.bucketUrl = bucketUrl;
    }

    try {
      Slingshot.createDirective('rocketchat-uploads', Slingshot.S3Storage, config);
    } catch (e) {
      console.error('Error configuring S3 ->', e.message);
    }
  }
}, 500);

RocketChat.settings.get('FileUpload_Storage_Type', configureSlingshot);
RocketChat.settings.get(/^FileUpload_S3_/, configureSlingshot);

const createGoogleStorageDirective = _.debounce(() => {
  const type = RocketChat.settings.get('FileUpload_Storage_Type');
  const bucket = RocketChat.settings.get('FileUpload_GoogleStorage_Bucket');
  const accessId = RocketChat.settings.get('FileUpload_GoogleStorage_AccessId');
  const secret = RocketChat.settings.get('FileUpload_GoogleStorage_Secret');
  delete Slingshot._directives['rocketchat-uploads-gs'];

  if (type === 'GoogleCloudStorage' && !_.isEmpty(secret) && !_.isEmpty(accessId) && !_.isEmpty(bucket)) {
    if (Slingshot._directives['rocketchat-uploads-gs']) {
      delete Slingshot._directives['rocketchat-uploads-gs'];
    }

    const config = {
      bucket,
      GoogleAccessId: accessId,
      GoogleSecretKey: secret,

      key(file, metaContext) {
        const id = Random.id();
        const path = `${RocketChat.settings.get('uniqueID')}/uploads/${metaContext.rid}/${this.userId}/${id}`;
        const upload = {
          _id: id,
          rid: metaContext.rid,
          GoogleStorage: {
            path
          }
        };
        RocketChat.models.Uploads.insertFileInit(this.userId, 'GoogleCloudStorage:Uploads', file, upload);
        return path;
      }

    };

    try {
      Slingshot.createDirective('rocketchat-uploads-gs', Slingshot.GoogleCloud, config);
    } catch (e) {
      console.error('Error configuring GoogleCloudStorage ->', e.message);
    }
  }
}, 500);

RocketChat.settings.get('FileUpload_Storage_Type', createGoogleStorageDirective);
RocketChat.settings.get(/^FileUpload_GoogleStorage_/, createGoogleStorageDirective);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"methods":{"sendFileMessage.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_file-upload/server/methods/sendFileMessage.js                                                   //
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
  'sendFileMessage'(roomId, store, file, msgData = {}) {
    return Promise.asyncApply(() => {
      if (!Meteor.userId()) {
        throw new Meteor.Error('error-invalid-user', 'Invalid user', {
          method: 'sendFileMessage'
        });
      }

      const room = Meteor.call('canAccessRoom', roomId, Meteor.userId());

      if (!room) {
        return false;
      }

      check(msgData, {
        avatar: Match.Optional(String),
        emoji: Match.Optional(String),
        alias: Match.Optional(String),
        groupable: Match.Optional(Boolean),
        msg: Match.Optional(String)
      });
      RocketChat.models.Uploads.updateFileComplete(file._id, Meteor.userId(), _.omit(file, '_id'));
      const fileUrl = `/file-upload/${file._id}/${encodeURI(file.name)}`;
      const attachment = {
        title: file.name,
        type: 'file',
        description: file.description,
        title_link: fileUrl,
        title_link_download: true
      };

      if (/^image\/.+/.test(file.type)) {
        attachment.image_url = fileUrl;
        attachment.image_type = file.type;
        attachment.image_size = file.size;

        if (file.identify && file.identify.size) {
          attachment.image_dimensions = file.identify.size;
        }

        attachment.image_preview = Promise.await(FileUpload.resizeImagePreview(file));
      } else if (/^audio\/.+/.test(file.type)) {
        attachment.audio_url = fileUrl;
        attachment.audio_type = file.type;
        attachment.audio_size = file.size;
      } else if (/^video\/.+/.test(file.type)) {
        attachment.video_url = fileUrl;
        attachment.video_type = file.type;
        attachment.video_size = file.size;
      }

      const user = Meteor.user();
      let msg = Object.assign({
        _id: Random.id(),
        rid: roomId,
        ts: new Date(),
        msg: '',
        file: {
          _id: file._id,
          name: file.name,
          type: file.type
        },
        groupable: false,
        attachments: [attachment]
      }, msgData);
      msg = Meteor.call('sendMessage', msg);
      Meteor.defer(() => RocketChat.callbacks.run('afterFileUpload', {
        user,
        room,
        message: msg
      }));
      return msg;
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"getS3FileUrl.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_file-upload/server/methods/getS3FileUrl.js                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/* globals UploadFS */
let protectedFiles;
RocketChat.settings.get('FileUpload_ProtectFiles', function (key, value) {
  protectedFiles = value;
});
Meteor.methods({
  getS3FileUrl(fileId) {
    if (protectedFiles && !Meteor.userId()) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'sendFileMessage'
      });
    }

    const file = RocketChat.models.Uploads.findOneById(fileId);
    return UploadFS.getStore('AmazonS3:Uploads').getRedirectURL(file);
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"startup":{"settings.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_file-upload/server/startup/settings.js                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.settings.addGroup('FileUpload', function () {
  this.add('FileUpload_Enabled', true, {
    type: 'boolean',
    public: true
  });
  this.add('FileUpload_MaxFileSize', 2097152, {
    type: 'int',
    public: true
  });
  this.add('FileUpload_MediaTypeWhiteList', 'image/*,audio/*,video/*,application/zip,application/x-rar-compressed,application/pdf,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document', {
    type: 'string',
    public: true,
    i18nDescription: 'FileUpload_MediaTypeWhiteListDescription'
  });
  this.add('FileUpload_ProtectFiles', true, {
    type: 'boolean',
    public: true,
    i18nDescription: 'FileUpload_ProtectFilesDescription'
  });
  this.add('FileUpload_Storage_Type', 'GridFS', {
    type: 'select',
    values: [{
      key: 'GridFS',
      i18nLabel: 'GridFS'
    }, {
      key: 'AmazonS3',
      i18nLabel: 'AmazonS3'
    }, {
      key: 'GoogleCloudStorage',
      i18nLabel: 'GoogleCloudStorage'
    }, {
      key: 'FileSystem',
      i18nLabel: 'FileSystem'
    }],
    public: true
  });
  this.section('Amazon S3', function () {
    this.add('FileUpload_S3_Bucket', '', {
      type: 'string',
      enableQuery: {
        _id: 'FileUpload_Storage_Type',
        value: 'AmazonS3'
      }
    });
    this.add('FileUpload_S3_Acl', '', {
      type: 'string',
      enableQuery: {
        _id: 'FileUpload_Storage_Type',
        value: 'AmazonS3'
      }
    });
    this.add('FileUpload_S3_AWSAccessKeyId', '', {
      type: 'string',
      enableQuery: {
        _id: 'FileUpload_Storage_Type',
        value: 'AmazonS3'
      }
    });
    this.add('FileUpload_S3_AWSSecretAccessKey', '', {
      type: 'string',
      enableQuery: {
        _id: 'FileUpload_Storage_Type',
        value: 'AmazonS3'
      }
    });
    this.add('FileUpload_S3_CDN', '', {
      type: 'string',
      enableQuery: {
        _id: 'FileUpload_Storage_Type',
        value: 'AmazonS3'
      }
    });
    this.add('FileUpload_S3_Region', '', {
      type: 'string',
      enableQuery: {
        _id: 'FileUpload_Storage_Type',
        value: 'AmazonS3'
      }
    });
    this.add('FileUpload_S3_BucketURL', '', {
      type: 'string',
      enableQuery: {
        _id: 'FileUpload_Storage_Type',
        value: 'AmazonS3'
      },
      i18nDescription: 'Override_URL_to_which_files_are_uploaded_This_url_also_used_for_downloads_unless_a_CDN_is_given.'
    });
    this.add('FileUpload_S3_SignatureVersion', 'v4', {
      type: 'string',
      enableQuery: {
        _id: 'FileUpload_Storage_Type',
        value: 'AmazonS3'
      }
    });
    this.add('FileUpload_S3_ForcePathStyle', false, {
      type: 'boolean',
      enableQuery: {
        _id: 'FileUpload_Storage_Type',
        value: 'AmazonS3'
      }
    });
    this.add('FileUpload_S3_URLExpiryTimeSpan', 120, {
      type: 'int',
      enableQuery: {
        _id: 'FileUpload_Storage_Type',
        value: 'AmazonS3'
      },
      i18nDescription: 'FileUpload_S3_URLExpiryTimeSpan_Description'
    });
    this.add('FileUpload_S3_Proxy_Avatars', false, {
      type: 'boolean',
      enableQuery: {
        _id: 'FileUpload_Storage_Type',
        value: 'AmazonS3'
      }
    });
    this.add('FileUpload_S3_Proxy_Uploads', false, {
      type: 'boolean',
      enableQuery: {
        _id: 'FileUpload_Storage_Type',
        value: 'AmazonS3'
      }
    });
  });
  this.section('Google Cloud Storage', function () {
    this.add('FileUpload_GoogleStorage_Bucket', '', {
      type: 'string',
      private: true,
      enableQuery: {
        _id: 'FileUpload_Storage_Type',
        value: 'GoogleCloudStorage'
      }
    });
    this.add('FileUpload_GoogleStorage_AccessId', '', {
      type: 'string',
      private: true,
      enableQuery: {
        _id: 'FileUpload_Storage_Type',
        value: 'GoogleCloudStorage'
      }
    });
    this.add('FileUpload_GoogleStorage_Secret', '', {
      type: 'string',
      multiline: true,
      private: true,
      enableQuery: {
        _id: 'FileUpload_Storage_Type',
        value: 'GoogleCloudStorage'
      }
    });
    this.add('FileUpload_GoogleStorage_Proxy_Avatars', false, {
      type: 'boolean',
      enableQuery: {
        _id: 'FileUpload_Storage_Type',
        value: 'GoogleCloudStorage'
      }
    });
    this.add('FileUpload_GoogleStorage_Proxy_Uploads', false, {
      type: 'boolean',
      enableQuery: {
        _id: 'FileUpload_Storage_Type',
        value: 'GoogleCloudStorage'
      }
    });
  });
  this.section('File System', function () {
    this.add('FileUpload_FileSystemPath', '', {
      type: 'string',
      enableQuery: {
        _id: 'FileUpload_Storage_Type',
        value: 'FileSystem'
      }
    });
  });
  this.add('FileUpload_Enabled_Direct', true, {
    type: 'boolean',
    public: true
  });
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}},"ufs":{"AmazonS3":{"server.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_file-upload/ufs/AmazonS3/server.js                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  AmazonS3Store: () => AmazonS3Store
});
let UploadFS;
module.watch(require("meteor/jalik:ufs"), {
  UploadFS(v) {
    UploadFS = v;
  }

}, 0);

let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 1);
let S3;
module.watch(require("aws-sdk/clients/s3"), {
  default(v) {
    S3 = v;
  }

}, 2);
let stream;
module.watch(require("stream"), {
  default(v) {
    stream = v;
  }

}, 3);

class AmazonS3Store extends UploadFS.Store {
  constructor(options) {
    // Default options
    // options.secretAccessKey,
    // options.accessKeyId,
    // options.region,
    // options.sslEnabled // optional
    options = _.extend({
      httpOptions: {
        timeout: 6000,
        agent: false
      }
    }, options);
    super(options);
    const classOptions = options;
    const s3 = new S3(options.connection);

    options.getPath = options.getPath || function (file) {
      return file._id;
    };

    this.getPath = function (file) {
      if (file.AmazonS3) {
        return file.AmazonS3.path;
      } // Compatibility
      // TODO: Migration


      if (file.s3) {
        return file.s3.path + file._id;
      }
    };

    this.getRedirectURL = function (file) {
      const params = {
        Key: this.getPath(file),
        Expires: classOptions.URLExpiryTimeSpan
      };
      return s3.getSignedUrl('getObject', params);
    };
    /**
     * Creates the file in the collection
     * @param file
     * @param callback
     * @return {string}
     */


    this.create = function (file, callback) {
      check(file, Object);

      if (file._id == null) {
        file._id = Random.id();
      }

      file.AmazonS3 = {
        path: this.options.getPath(file)
      };
      file.store = this.options.name; // assign store to file

      return this.getCollection().insert(file, callback);
    };
    /**
     * Removes the file
     * @param fileId
     * @param callback
     */


    this.delete = function (fileId, callback) {
      const file = this.getCollection().findOne({
        _id: fileId
      });
      const params = {
        Key: this.getPath(file)
      };
      s3.deleteObject(params, (err, data) => {
        if (err) {
          console.error(err);
        }

        callback && callback(err, data);
      });
    };
    /**
     * Returns the file read stream
     * @param fileId
     * @param file
     * @param options
     * @return {*}
     */


    this.getReadStream = function (fileId, file, options = {}) {
      const params = {
        Key: this.getPath(file)
      };

      if (options.start && options.end) {
        params.Range = `${options.start} - ${options.end}`;
      }

      return s3.getObject(params).createReadStream();
    };
    /**
     * Returns the file write stream
     * @param fileId
     * @param file
     * @param options
     * @return {*}
     */


    this.getWriteStream = function (fileId, file
    /*, options*/
    ) {
      const writeStream = new stream.PassThrough();
      writeStream.length = file.size;
      writeStream.on('newListener', (event, listener) => {
        if (event === 'finish') {
          process.nextTick(() => {
            writeStream.removeListener(event, listener);
            writeStream.on('real_finish', listener);
          });
        }
      });
      s3.putObject({
        Key: this.getPath(file),
        Body: writeStream,
        ContentType: file.type,
        ContentDisposition: `inline; filename="${encodeURI(file.name)}"`
      }, error => {
        if (error) {
          console.error(error);
        }

        writeStream.emit('real_finish');
      });
      return writeStream;
    };
  }

}

// Add store to UFS namespace
UploadFS.store.AmazonS3 = AmazonS3Store;
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"GoogleStorage":{"server.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_file-upload/ufs/GoogleStorage/server.js                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  GoogleStorageStore: () => GoogleStorageStore
});
let UploadFS;
module.watch(require("meteor/jalik:ufs"), {
  UploadFS(v) {
    UploadFS = v;
  }

}, 0);
let gcStorage;
module.watch(require("@google-cloud/storage"), {
  default(v) {
    gcStorage = v;
  }

}, 1);

class GoogleStorageStore extends UploadFS.Store {
  constructor(options) {
    super(options);
    const gcs = gcStorage(options.connection);
    this.bucket = gcs.bucket(options.bucket);

    options.getPath = options.getPath || function (file) {
      return file._id;
    };

    this.getPath = function (file) {
      if (file.GoogleStorage) {
        return file.GoogleStorage.path;
      } // Compatibility
      // TODO: Migration


      if (file.googleCloudStorage) {
        return file.googleCloudStorage.path + file._id;
      }
    };

    this.getRedirectURL = function (file, callback) {
      const params = {
        action: 'read',
        responseDisposition: 'inline',
        expires: Date.now() + this.options.URLExpiryTimeSpan * 1000
      };
      this.bucket.file(this.getPath(file)).getSignedUrl(params, callback);
    };
    /**
     * Creates the file in the collection
     * @param file
     * @param callback
     * @return {string}
     */


    this.create = function (file, callback) {
      check(file, Object);

      if (file._id == null) {
        file._id = Random.id();
      }

      file.GoogleStorage = {
        path: this.options.getPath(file)
      };
      file.store = this.options.name; // assign store to file

      return this.getCollection().insert(file, callback);
    };
    /**
     * Removes the file
     * @param fileId
     * @param callback
     */


    this.delete = function (fileId, callback) {
      const file = this.getCollection().findOne({
        _id: fileId
      });
      this.bucket.file(this.getPath(file)).delete(function (err, data) {
        if (err) {
          console.error(err);
        }

        callback && callback(err, data);
      });
    };
    /**
     * Returns the file read stream
     * @param fileId
     * @param file
     * @param options
     * @return {*}
     */


    this.getReadStream = function (fileId, file, options = {}) {
      const config = {};

      if (options.start != null) {
        config.start = options.start;
      }

      if (options.end != null) {
        config.end = options.end;
      }

      return this.bucket.file(this.getPath(file)).createReadStream(config);
    };
    /**
     * Returns the file write stream
     * @param fileId
     * @param file
     * @param options
     * @return {*}
     */


    this.getWriteStream = function (fileId, file
    /*, options*/
    ) {
      return this.bucket.file(this.getPath(file)).createWriteStream({
        gzip: false,
        metadata: {
          contentType: file.type,
          contentDisposition: `inline; filename=${file.name}` // metadata: {
          // 	custom: 'metadata'
          // }

        }
      });
    };
  }

}

// Add store to UFS namespace
UploadFS.store.GoogleStorage = GoogleStorageStore;
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:file-upload/globalFileRestrictions.js");
require("/node_modules/meteor/rocketchat:file-upload/lib/FileUpload.js");
require("/node_modules/meteor/rocketchat:file-upload/lib/FileUploadBase.js");
require("/node_modules/meteor/rocketchat:file-upload/server/lib/FileUpload.js");
require("/node_modules/meteor/rocketchat:file-upload/server/lib/proxy.js");
require("/node_modules/meteor/rocketchat:file-upload/server/lib/requests.js");
require("/node_modules/meteor/rocketchat:file-upload/server/config/_configUploadStorage.js");
require("/node_modules/meteor/rocketchat:file-upload/server/methods/sendFileMessage.js");
require("/node_modules/meteor/rocketchat:file-upload/server/methods/getS3FileUrl.js");
require("/node_modules/meteor/rocketchat:file-upload/server/startup/settings.js");

/* Exports */
Package._define("rocketchat:file-upload", {
  fileUploadHandler: fileUploadHandler,
  FileUpload: FileUpload
});

})();

//# sourceURL=meteor://💻app/packages/rocketchat_file-upload.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpmaWxlLXVwbG9hZC9nbG9iYWxGaWxlUmVzdHJpY3Rpb25zLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmZpbGUtdXBsb2FkL2xpYi9GaWxlVXBsb2FkLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmZpbGUtdXBsb2FkL2xpYi9GaWxlVXBsb2FkQmFzZS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpmaWxlLXVwbG9hZC9zZXJ2ZXIvbGliL0ZpbGVVcGxvYWQuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6ZmlsZS11cGxvYWQvc2VydmVyL2xpYi9wcm94eS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpmaWxlLXVwbG9hZC9zZXJ2ZXIvbGliL3JlcXVlc3RzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmZpbGUtdXBsb2FkL3NlcnZlci9jb25maWcvX2NvbmZpZ1VwbG9hZFN0b3JhZ2UuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6ZmlsZS11cGxvYWQvc2VydmVyL2NvbmZpZy9BbWF6b25TMy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpmaWxlLXVwbG9hZC9zZXJ2ZXIvY29uZmlnL0ZpbGVTeXN0ZW0uanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6ZmlsZS11cGxvYWQvc2VydmVyL2NvbmZpZy9Hb29nbGVTdG9yYWdlLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmZpbGUtdXBsb2FkL3NlcnZlci9jb25maWcvR3JpZEZTLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmZpbGUtdXBsb2FkL3NlcnZlci9jb25maWcvU2xpbmdzaG90X0RFUFJFQ0FURUQuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6ZmlsZS11cGxvYWQvc2VydmVyL21ldGhvZHMvc2VuZEZpbGVNZXNzYWdlLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmZpbGUtdXBsb2FkL3NlcnZlci9tZXRob2RzL2dldFMzRmlsZVVybC5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpmaWxlLXVwbG9hZC9zZXJ2ZXIvc3RhcnR1cC9zZXR0aW5ncy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpmaWxlLXVwbG9hZC91ZnMvQW1hem9uUzMvc2VydmVyLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmZpbGUtdXBsb2FkL3Vmcy9Hb29nbGVTdG9yYWdlL3NlcnZlci5qcyJdLCJuYW1lcyI6WyJmaWxlc2l6ZSIsIm1vZHVsZSIsIndhdGNoIiwicmVxdWlyZSIsImRlZmF1bHQiLCJ2Iiwic2xpbmdTaG90Q29uZmlnIiwiYXV0aG9yaXplIiwiZmlsZSIsInVzZXJJZCIsIk1ldGVvciIsIkVycm9yIiwiUm9ja2V0Q2hhdCIsImZpbGVVcGxvYWRJc1ZhbGlkQ29udGVudFR5cGUiLCJ0eXBlIiwiVEFQaTE4biIsIl9fIiwibWF4RmlsZVNpemUiLCJzZXR0aW5ncyIsImdldCIsInNpemUiLCJtYXhTaXplIiwiYWxsb3dlZEZpbGVUeXBlcyIsIlNsaW5nc2hvdCIsImZpbGVSZXN0cmljdGlvbnMiLCJGaWxlVXBsb2FkIiwidmFsaWRhdGVGaWxlVXBsb2FkIiwiTWF0Y2giLCJ0ZXN0IiwicmlkIiwiU3RyaW5nIiwidXNlciIsInJvb20iLCJtb2RlbHMiLCJSb29tcyIsImZpbmRPbmVCeUlkIiwiZGlyZWN0TWVzc2FnZUFsbG93IiwiZmlsZVVwbG9hZEFsbG93ZWQiLCJhdXRoeiIsImNhbkFjY2Vzc1Jvb20iLCJyZWFzb24iLCJsYW5ndWFnZSIsInQiLCJrZXkiLCJ2YWx1ZSIsInBhcnNlSW50IiwiZSIsIlNldHRpbmdzIiwicGFja2FnZVZhbHVlIiwiXyIsIlVwbG9hZEZTIiwiY29uZmlnIiwiZGVmYXVsdFN0b3JlUGVybWlzc2lvbnMiLCJTdG9yZVBlcm1pc3Npb25zIiwiaW5zZXJ0IiwiZG9jIiwibWVzc2FnZV9pZCIsImluZGV4T2YiLCJzdG9yZSIsInNwbGl0IiwicG9wIiwidXBkYXRlIiwiaGFzUGVybWlzc2lvbiIsInJlbW92ZSIsIkZpbGVVcGxvYWRCYXNlIiwiY29uc3RydWN0b3IiLCJtZXRhIiwiaWQiLCJSYW5kb20iLCJnZXRQcm9ncmVzcyIsImdldEZpbGVOYW1lIiwibmFtZSIsInN0YXJ0IiwiY2FsbGJhY2siLCJoYW5kbGVyIiwiVXBsb2FkZXIiLCJkYXRhIiwib25FcnJvciIsImVyciIsIm9uQ29tcGxldGUiLCJmaWxlRGF0YSIsInBpY2siLCJ1cmwiLCJyZXBsYWNlIiwiYWJzb2x1dGVVcmwiLCJvcHRpb25zIiwib25Qcm9ncmVzcyIsInByb2dyZXNzIiwic3RvcCIsImV4cG9ydCIsIkZpbGVVcGxvYWRDbGFzcyIsImZzIiwic3RyZWFtIiwibWltZSIsIkZ1dHVyZSIsInNoYXJwIiwiQ29va2llcyIsImNvb2tpZSIsIk9iamVjdCIsImFzc2lnbiIsImhhbmRsZXJzIiwiY29uZmlndXJlVXBsb2Fkc1N0b3JlIiwic3RvcmVzIiwiZ2V0U3RvcmVzIiwiZGVmYXVsdFVwbG9hZHMiLCJjb2xsZWN0aW9uIiwiVXBsb2FkcyIsIm1vZGVsIiwiZmlsdGVyIiwiRmlsdGVyIiwib25DaGVjayIsImdldFBhdGgiLCJfaWQiLCJvblZhbGlkYXRlIiwidXBsb2Fkc09uVmFsaWRhdGUiLCJvblJlYWQiLCJmaWxlSWQiLCJyZXEiLCJyZXMiLCJyZXF1ZXN0Q2FuQWNjZXNzRmlsZXMiLCJ3cml0ZUhlYWQiLCJzZXRIZWFkZXIiLCJlbmNvZGVVUklDb21wb25lbnQiLCJkZWZhdWx0QXZhdGFycyIsIkF2YXRhcnMiLCJhdmF0YXJzT25WYWxpZGF0ZSIsIm9uRmluaXNoVXBsb2FkIiwiYXZhdGFyc09uRmluaXNoVXBsb2FkIiwiZGVmYXVsdFVzZXJEYXRhRmlsZXMiLCJVc2VyRGF0YUZpbGVzIiwidGVtcEZpbGVQYXRoIiwiZ2V0VGVtcEZpbGVQYXRoIiwiaGVpZ2h0IiwiZnV0dXJlIiwicyIsInJvdGF0ZSIsIm1ldGFkYXRhIiwiYmluZEVudmlyb25tZW50IiwidG9Gb3JtYXQiLCJmb3JtYXQiLCJqcGVnIiwicmVzaXplIiwiTWF0aCIsIm1pbiIsIndpZHRoIiwicGlwZSIsImJhY2tncm91bmQiLCJlbWJlZCIsInRvQnVmZmVyIiwidGhlbiIsIm91dHB1dEJ1ZmZlciIsIndyaXRlRmlsZSIsImNvbnNvbGUiLCJlcnJvciIsImxzdGF0U3luYyIsImdldENvbGxlY3Rpb24iLCJkaXJlY3QiLCIkc2V0IiwicmV0dXJuIiwid2FpdCIsInJlc2l6ZUltYWdlUHJldmlldyIsImFkZEV4dGVuc2lvblRvIiwiaW1hZ2UiLCJnZXRTdG9yZSIsIl9zdG9yZSIsImdldFJlYWRTdHJlYW0iLCJ0cmFuc2Zvcm1lciIsIm1heCIsImJsdXIiLCJyZXN1bHQiLCJvdXQiLCJ0b1N0cmluZyIsInRtcEZpbGUiLCJmdXQiLCJpZGVudGlmeSIsIm9yaWVudGF0aW9uIiwidG9GaWxlIiwidW5saW5rIiwicmVuYW1lIiwiY2F0Y2giLCJVc2VycyIsIm9sZEF2YXRhciIsImZpbmRPbmVCeU5hbWUiLCJ1c2VybmFtZSIsImRlbGV0ZUZpbGUiLCJ1cGRhdGVGaWxlTmFtZUJ5SWQiLCJoZWFkZXJzIiwicXVlcnkiLCJyY191aWQiLCJyY190b2tlbiIsImZpbmRPbmVCeUlkQW5kTG9naW5Ub2tlbiIsImxvb2t1cCIsImV4dCIsImV4dGVuc2lvbiIsIlJlZ0V4cCIsIm1vZGVsTmFtZSIsInN0b3JhZ2VUeXBlIiwiaGFuZGxlck5hbWUiLCJnZXRTdG9yZUJ5TmFtZSIsIm5leHQiLCJlbmQiLCJjb3B5IiwidGFyZ2V0RmlsZSIsImNyZWF0ZVdyaXRlU3RyZWFtIiwiZ2V0TW9kZWxGcm9tTmFtZSIsImRlbGV0ZSIsImRlbGV0ZUJ5SWQiLCJkZWxldGVCeU5hbWUiLCJmaWxlTmFtZSIsInN0cmVhbU9yQnVmZmVyIiwiY2IiLCJnZXRGaWx0ZXIiLCJjaGVjayIsImNyZWF0ZSIsInRva2VuIiwiY3JlYXRlVG9rZW4iLCJCdWZmZXIiLCJ3cml0ZUZpbGVTeW5jIiwiY2FsbCIsImh0dHAiLCJVUkwiLCJsb2dnZXIiLCJMb2dnZXIiLCJXZWJBcHAiLCJjb25uZWN0SGFuZGxlcnMiLCJzdGFjayIsInVuc2hpZnQiLCJyb3V0ZSIsImhhbmRsZSIsInN0b3Jlc1BhdGgiLCJkZWJ1ZyIsIm1ldGhvZCIsInBhcnNlZFVybCIsInBhcnNlIiwicGF0aCIsInBhdGhuYW1lIiwic3Vic3RyIiwibGVuZ3RoIiwicmVnRXhwIiwibWF0Y2giLCJleGVjIiwiZmluZE9uZSIsInVuZGVmaW5lZCIsImluc3RhbmNlSWQiLCJJbnN0YW5jZVN0YXR1cyIsImluc3RhbmNlIiwiZXh0cmFJbmZvcm1hdGlvbiIsImhvc3QiLCJwcm9jZXNzIiwiZW52IiwiSU5TVEFOQ0VfSVAiLCJpc0RvY2tlciIsInBvcnQiLCJob3N0bmFtZSIsIm9yaWdpbmFsVXJsIiwicHJveHkiLCJyZXF1ZXN0IiwicHJveHlfcmVzIiwidXNlIiwicHVibGljIiwic2FuZHN0b3JtIiwiY29uZmlnU3RvcmUiLCJkZWJvdW5jZSIsImxvZyIsImh0dHBzIiwiZmlsZVVybCIsImdldFJlZGlyZWN0VVJMIiwic3RvcmVUeXBlIiwiZmlsZVJlcyIsInJlbW92ZUhlYWRlciIsIkFtYXpvblMzVXBsb2FkcyIsIkFtYXpvblMzQXZhdGFycyIsIkFtYXpvblMzVXNlckRhdGFGaWxlcyIsImNvbmZpZ3VyZSIsIkJ1Y2tldCIsIkFjbCIsIkFXU0FjY2Vzc0tleUlkIiwiQVdTU2VjcmV0QWNjZXNzS2V5IiwiVVJMRXhwaXJ5VGltZVNwYW4iLCJSZWdpb24iLCJTaWduYXR1cmVWZXJzaW9uIiwiRm9yY2VQYXRoU3R5bGUiLCJCdWNrZXRVUkwiLCJjb25uZWN0aW9uIiwiYWNjZXNzS2V5SWQiLCJzZWNyZXRBY2Nlc3NLZXkiLCJzaWduYXR1cmVWZXJzaW9uIiwiczNGb3JjZVBhdGhTdHlsZSIsInBhcmFtcyIsIkFDTCIsInJlZ2lvbiIsImVuZHBvaW50IiwiRmlsZVN5c3RlbVVwbG9hZHMiLCJmaWxlUGF0aCIsImdldEZpbGVQYXRoIiwic3RhdCIsIndyYXBBc3luYyIsImlzRmlsZSIsInVwbG9hZGVkQXQiLCJ0b1VUQ1N0cmluZyIsIkZpbGVTeXN0ZW1BdmF0YXJzIiwiRmlsZVN5c3RlbVVzZXJEYXRhRmlsZXMiLCJjcmVhdGVGaWxlU3lzdGVtU3RvcmUiLCJHb29nbGVDbG91ZFN0b3JhZ2VVcGxvYWRzIiwiR29vZ2xlQ2xvdWRTdG9yYWdlQXZhdGFycyIsIkdvb2dsZUNsb3VkU3RvcmFnZVVzZXJEYXRhRmlsZXMiLCJidWNrZXQiLCJhY2Nlc3NJZCIsInNlY3JldCIsImNyZWRlbnRpYWxzIiwiY2xpZW50X2VtYWlsIiwicHJpdmF0ZV9rZXkiLCJ6bGliIiwidXRpbCIsIkV4dHJhY3RSYW5nZSIsImJ5dGVzX3JlYWQiLCJUcmFuc2Zvcm0iLCJpbmhlcml0cyIsInByb3RvdHlwZSIsIl90cmFuc2Zvcm0iLCJjaHVuayIsImVuYyIsIm5ld2NodW5rIiwic2xpY2UiLCJwdXNoIiwiZ2V0Qnl0ZVJhbmdlIiwiaGVhZGVyIiwibWF0Y2hlcyIsInJlYWRGcm9tR3JpZEZTIiwic3RvcmVOYW1lIiwicnMiLCJ3cyIsIlBhc3NUaHJvdWdoIiwiZm9yRWFjaCIsIm9uIiwib25SZWFkRXJyb3IiLCJlbWl0IiwiYWNjZXB0IiwidHJhbnNmb3JtUmVhZCIsInJhbmdlIiwib3V0X29mX3JhbmdlIiwiY3JlYXRlR3ppcCIsImNyZWF0ZURlZmxhdGUiLCJjb3B5RnJvbUdyaWRGUyIsImNvbGxlY3Rpb25OYW1lIiwiY29uZmlndXJlU2xpbmdzaG90IiwiYWNsIiwiYWNjZXNzS2V5Iiwic2VjcmV0S2V5IiwiY2RuIiwiYnVja2V0VXJsIiwiX2RpcmVjdGl2ZXMiLCJpc0VtcHR5IiwibWV0YUNvbnRleHQiLCJ1cGxvYWQiLCJBbWF6b25TMyIsImluc2VydEZpbGVJbml0IiwiY3JlYXRlRGlyZWN0aXZlIiwiUzNTdG9yYWdlIiwibWVzc2FnZSIsImNyZWF0ZUdvb2dsZVN0b3JhZ2VEaXJlY3RpdmUiLCJHb29nbGVBY2Nlc3NJZCIsIkdvb2dsZVNlY3JldEtleSIsIkdvb2dsZVN0b3JhZ2UiLCJHb29nbGVDbG91ZCIsIm1ldGhvZHMiLCJyb29tSWQiLCJtc2dEYXRhIiwiYXZhdGFyIiwiT3B0aW9uYWwiLCJlbW9qaSIsImFsaWFzIiwiZ3JvdXBhYmxlIiwiQm9vbGVhbiIsIm1zZyIsInVwZGF0ZUZpbGVDb21wbGV0ZSIsIm9taXQiLCJlbmNvZGVVUkkiLCJhdHRhY2htZW50IiwidGl0bGUiLCJkZXNjcmlwdGlvbiIsInRpdGxlX2xpbmsiLCJ0aXRsZV9saW5rX2Rvd25sb2FkIiwiaW1hZ2VfdXJsIiwiaW1hZ2VfdHlwZSIsImltYWdlX3NpemUiLCJpbWFnZV9kaW1lbnNpb25zIiwiaW1hZ2VfcHJldmlldyIsImF1ZGlvX3VybCIsImF1ZGlvX3R5cGUiLCJhdWRpb19zaXplIiwidmlkZW9fdXJsIiwidmlkZW9fdHlwZSIsInZpZGVvX3NpemUiLCJ0cyIsIkRhdGUiLCJhdHRhY2htZW50cyIsImRlZmVyIiwiY2FsbGJhY2tzIiwicnVuIiwicHJvdGVjdGVkRmlsZXMiLCJnZXRTM0ZpbGVVcmwiLCJhZGRHcm91cCIsImFkZCIsImkxOG5EZXNjcmlwdGlvbiIsInZhbHVlcyIsImkxOG5MYWJlbCIsInNlY3Rpb24iLCJlbmFibGVRdWVyeSIsInByaXZhdGUiLCJtdWx0aWxpbmUiLCJBbWF6b25TM1N0b3JlIiwiUzMiLCJTdG9yZSIsImV4dGVuZCIsImh0dHBPcHRpb25zIiwidGltZW91dCIsImFnZW50IiwiY2xhc3NPcHRpb25zIiwiczMiLCJLZXkiLCJFeHBpcmVzIiwiZ2V0U2lnbmVkVXJsIiwiZGVsZXRlT2JqZWN0IiwiUmFuZ2UiLCJnZXRPYmplY3QiLCJjcmVhdGVSZWFkU3RyZWFtIiwiZ2V0V3JpdGVTdHJlYW0iLCJ3cml0ZVN0cmVhbSIsImV2ZW50IiwibGlzdGVuZXIiLCJuZXh0VGljayIsInJlbW92ZUxpc3RlbmVyIiwicHV0T2JqZWN0IiwiQm9keSIsIkNvbnRlbnRUeXBlIiwiQ29udGVudERpc3Bvc2l0aW9uIiwiR29vZ2xlU3RvcmFnZVN0b3JlIiwiZ2NTdG9yYWdlIiwiZ2NzIiwiZ29vZ2xlQ2xvdWRTdG9yYWdlIiwiYWN0aW9uIiwicmVzcG9uc2VEaXNwb3NpdGlvbiIsImV4cGlyZXMiLCJub3ciLCJnemlwIiwiY29udGVudFR5cGUiLCJjb250ZW50RGlzcG9zaXRpb24iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxJQUFJQSxRQUFKO0FBQWFDLE9BQU9DLEtBQVAsQ0FBYUMsUUFBUSxVQUFSLENBQWIsRUFBaUM7QUFBQ0MsVUFBUUMsQ0FBUixFQUFVO0FBQUNMLGVBQVNLLENBQVQ7QUFBVzs7QUFBdkIsQ0FBakMsRUFBMEQsQ0FBMUQ7QUFJYixNQUFNQyxrQkFBa0I7QUFDdkJDLFlBQVVDO0FBQUk7QUFBZCxJQUFpQztBQUNoQztBQUNBLFFBQUksQ0FBQyxLQUFLQyxNQUFWLEVBQWtCO0FBQ2pCLFlBQU0sSUFBSUMsT0FBT0MsS0FBWCxDQUFpQixnQkFBakIsRUFBbUMsbUNBQW5DLENBQU47QUFDQTs7QUFFRCxRQUFJLENBQUNDLFdBQVdDLDRCQUFYLENBQXdDTCxLQUFLTSxJQUE3QyxDQUFMLEVBQXlEO0FBQ3hELFlBQU0sSUFBSUosT0FBT0MsS0FBWCxDQUFpQkksUUFBUUMsRUFBUixDQUFXLHlCQUFYLENBQWpCLENBQU47QUFDQTs7QUFFRCxVQUFNQyxjQUFjTCxXQUFXTSxRQUFYLENBQW9CQyxHQUFwQixDQUF3Qix3QkFBeEIsQ0FBcEI7O0FBRUEsUUFBSUYsZUFBZSxDQUFDLENBQWhCLElBQXFCQSxjQUFjVCxLQUFLWSxJQUE1QyxFQUFrRDtBQUNqRCxZQUFNLElBQUlWLE9BQU9DLEtBQVgsQ0FBaUJJLFFBQVFDLEVBQVIsQ0FBVyxvQ0FBWCxFQUFpRDtBQUFFSSxjQUFNcEIsU0FBU2lCLFdBQVQ7QUFBUixPQUFqRCxDQUFqQixDQUFOO0FBQ0E7O0FBRUQsV0FBTyxJQUFQO0FBQ0EsR0FsQnNCOztBQW1CdkJJLFdBQVMsQ0FuQmM7QUFvQnZCQyxvQkFBa0I7QUFwQkssQ0FBeEI7QUF1QkFDLFVBQVVDLGdCQUFWLENBQTJCLG9CQUEzQixFQUFpRGxCLGVBQWpEO0FBQ0FpQixVQUFVQyxnQkFBVixDQUEyQix1QkFBM0IsRUFBb0RsQixlQUFwRCxFOzs7Ozs7Ozs7OztBQzVCQSxJQUFJTixRQUFKO0FBQWFDLE9BQU9DLEtBQVAsQ0FBYUMsUUFBUSxVQUFSLENBQWIsRUFBaUM7QUFBQ0MsVUFBUUMsQ0FBUixFQUFVO0FBQUNMLGVBQVNLLENBQVQ7QUFBVzs7QUFBdkIsQ0FBakMsRUFBMEQsQ0FBMUQ7QUFLYixJQUFJWSxjQUFjLENBQWxCO0FBRUFRLGFBQWE7QUFDWkMscUJBQW1CbEIsSUFBbkIsRUFBeUI7QUFDeEIsUUFBSSxDQUFDbUIsTUFBTUMsSUFBTixDQUFXcEIsS0FBS3FCLEdBQWhCLEVBQXFCQyxNQUFyQixDQUFMLEVBQW1DO0FBQ2xDLGFBQU8sS0FBUDtBQUNBOztBQUVELFVBQU1DLE9BQU9yQixPQUFPcUIsSUFBUCxFQUFiO0FBQ0EsVUFBTUMsT0FBT3BCLFdBQVdxQixNQUFYLENBQWtCQyxLQUFsQixDQUF3QkMsV0FBeEIsQ0FBb0MzQixLQUFLcUIsR0FBekMsQ0FBYjtBQUNBLFVBQU1PLHFCQUFxQnhCLFdBQVdNLFFBQVgsQ0FBb0JDLEdBQXBCLENBQXdCLDJCQUF4QixDQUEzQjtBQUNBLFVBQU1rQixvQkFBb0J6QixXQUFXTSxRQUFYLENBQW9CQyxHQUFwQixDQUF3QixvQkFBeEIsQ0FBMUI7O0FBRUEsUUFBSVAsV0FBVzBCLEtBQVgsQ0FBaUJDLGFBQWpCLENBQStCUCxJQUEvQixFQUFxQ0QsSUFBckMsTUFBK0MsSUFBbkQsRUFBeUQ7QUFDeEQsYUFBTyxLQUFQO0FBQ0E7O0FBRUQsUUFBSSxDQUFDTSxpQkFBTCxFQUF3QjtBQUN2QixZQUFNRyxTQUFTekIsUUFBUUMsRUFBUixDQUFXLHFCQUFYLEVBQWtDZSxLQUFLVSxRQUF2QyxDQUFmOztBQUNBLFlBQU0sSUFBSS9CLE9BQU9DLEtBQVgsQ0FBaUIsNEJBQWpCLEVBQStDNkIsTUFBL0MsQ0FBTjtBQUNBOztBQUVELFFBQUksQ0FBQ0osa0JBQUQsSUFBdUJKLEtBQUtVLENBQUwsS0FBVyxHQUF0QyxFQUEyQztBQUMxQyxZQUFNRixTQUFTekIsUUFBUUMsRUFBUixDQUFXLGtDQUFYLEVBQStDZSxLQUFLVSxRQUFwRCxDQUFmOztBQUNBLFlBQU0sSUFBSS9CLE9BQU9DLEtBQVgsQ0FBaUIsOENBQWpCLEVBQWlFNkIsTUFBakUsQ0FBTjtBQUNBLEtBdEJ1QixDQXdCeEI7OztBQUNBLFFBQUl2QixlQUFlLENBQUMsQ0FBaEIsSUFBcUJULEtBQUtZLElBQUwsR0FBWUgsV0FBckMsRUFBa0Q7QUFDakQsWUFBTXVCLFNBQVN6QixRQUFRQyxFQUFSLENBQVcsb0NBQVgsRUFBaUQ7QUFDL0RJLGNBQU1wQixTQUFTaUIsV0FBVDtBQUR5RCxPQUFqRCxFQUVaYyxLQUFLVSxRQUZPLENBQWY7O0FBR0EsWUFBTSxJQUFJL0IsT0FBT0MsS0FBWCxDQUFpQixzQkFBakIsRUFBeUM2QixNQUF6QyxDQUFOO0FBQ0E7O0FBRUQsUUFBSXZCLGNBQWMsQ0FBbEIsRUFBcUI7QUFDcEIsVUFBSVQsS0FBS1ksSUFBTCxHQUFZSCxXQUFoQixFQUE2QjtBQUM1QixjQUFNdUIsU0FBU3pCLFFBQVFDLEVBQVIsQ0FBVyxvQ0FBWCxFQUFpRDtBQUMvREksZ0JBQU1wQixTQUFTaUIsV0FBVDtBQUR5RCxTQUFqRCxFQUVaYyxLQUFLVSxRQUZPLENBQWY7O0FBR0EsY0FBTSxJQUFJL0IsT0FBT0MsS0FBWCxDQUFpQixzQkFBakIsRUFBeUM2QixNQUF6QyxDQUFOO0FBQ0E7QUFDRDs7QUFFRCxRQUFJLENBQUM1QixXQUFXQyw0QkFBWCxDQUF3Q0wsS0FBS00sSUFBN0MsQ0FBTCxFQUF5RDtBQUN4RCxZQUFNMEIsU0FBU3pCLFFBQVFDLEVBQVIsQ0FBVywyQkFBWCxFQUF3Q2UsS0FBS1UsUUFBN0MsQ0FBZjs7QUFDQSxZQUFNLElBQUkvQixPQUFPQyxLQUFYLENBQWlCLHlCQUFqQixFQUE0QzZCLE1BQTVDLENBQU47QUFDQTs7QUFFRCxXQUFPLElBQVA7QUFDQTs7QUFoRFcsQ0FBYjtBQW1EQTVCLFdBQVdNLFFBQVgsQ0FBb0JDLEdBQXBCLENBQXdCLHdCQUF4QixFQUFrRCxVQUFTd0IsR0FBVCxFQUFjQyxLQUFkLEVBQXFCO0FBQ3RFLE1BQUk7QUFDSDNCLGtCQUFjNEIsU0FBU0QsS0FBVCxDQUFkO0FBQ0EsR0FGRCxDQUVFLE9BQU9FLENBQVAsRUFBVTtBQUNYN0Isa0JBQWNMLFdBQVdxQixNQUFYLENBQWtCYyxRQUFsQixDQUEyQlosV0FBM0IsQ0FBdUMsd0JBQXZDLEVBQWlFYSxZQUEvRTtBQUNBO0FBQ0QsQ0FORCxFOzs7Ozs7Ozs7OztBQzFEQSxJQUFJQyxDQUFKOztBQUFNaEQsT0FBT0MsS0FBUCxDQUFhQyxRQUFRLFlBQVIsQ0FBYixFQUFtQztBQUFDQyxVQUFRQyxDQUFSLEVBQVU7QUFBQzRDLFFBQUU1QyxDQUFGO0FBQUk7O0FBQWhCLENBQW5DLEVBQXFELENBQXJEO0FBSU42QyxTQUFTQyxNQUFULENBQWdCQyx1QkFBaEIsR0FBMEMsSUFBSUYsU0FBU0csZ0JBQWIsQ0FBOEI7QUFDdkVDLFNBQU83QyxNQUFQLEVBQWU4QyxHQUFmLEVBQW9CO0FBQ25CLFFBQUk5QyxNQUFKLEVBQVk7QUFDWCxhQUFPLElBQVA7QUFDQSxLQUhrQixDQUtuQjs7O0FBQ0EsUUFBSThDLE9BQU9BLElBQUlDLFVBQVgsSUFBeUJELElBQUlDLFVBQUosQ0FBZUMsT0FBZixDQUF1QixRQUF2QixNQUFxQyxDQUFsRSxFQUFxRTtBQUNwRSxhQUFPLElBQVA7QUFDQSxLQVJrQixDQVVuQjs7O0FBQ0EsUUFBSUYsT0FBT0EsSUFBSUcsS0FBWCxJQUFvQkgsSUFBSUcsS0FBSixDQUFVQyxLQUFWLENBQWdCLEdBQWhCLEVBQXFCQyxHQUFyQixPQUErQixlQUF2RCxFQUF3RTtBQUN2RSxhQUFPLElBQVA7QUFDQTs7QUFFRCxXQUFPLEtBQVA7QUFDQSxHQWpCc0U7O0FBa0J2RUMsU0FBT3BELE1BQVAsRUFBZThDLEdBQWYsRUFBb0I7QUFDbkIsV0FBTzNDLFdBQVcwQixLQUFYLENBQWlCd0IsYUFBakIsQ0FBK0JwRCxPQUFPRCxNQUFQLEVBQS9CLEVBQWdELGdCQUFoRCxFQUFrRThDLElBQUkxQixHQUF0RSxLQUErRWpCLFdBQVdNLFFBQVgsQ0FBb0JDLEdBQXBCLENBQXdCLHVCQUF4QixLQUFvRFYsV0FBVzhDLElBQUk5QyxNQUF6SjtBQUNBLEdBcEJzRTs7QUFxQnZFc0QsU0FBT3RELE1BQVAsRUFBZThDLEdBQWYsRUFBb0I7QUFDbkIsV0FBTzNDLFdBQVcwQixLQUFYLENBQWlCd0IsYUFBakIsQ0FBK0JwRCxPQUFPRCxNQUFQLEVBQS9CLEVBQWdELGdCQUFoRCxFQUFrRThDLElBQUkxQixHQUF0RSxLQUErRWpCLFdBQVdNLFFBQVgsQ0FBb0JDLEdBQXBCLENBQXdCLHVCQUF4QixLQUFvRFYsV0FBVzhDLElBQUk5QyxNQUF6SjtBQUNBOztBQXZCc0UsQ0FBOUIsQ0FBMUM7QUEyQkF1RCxpQkFBaUIsTUFBTUEsY0FBTixDQUFxQjtBQUNyQ0MsY0FBWVAsS0FBWixFQUFtQlEsSUFBbkIsRUFBeUIxRCxJQUF6QixFQUErQjtBQUM5QixTQUFLMkQsRUFBTCxHQUFVQyxPQUFPRCxFQUFQLEVBQVY7QUFDQSxTQUFLRCxJQUFMLEdBQVlBLElBQVo7QUFDQSxTQUFLMUQsSUFBTCxHQUFZQSxJQUFaO0FBQ0EsU0FBS2tELEtBQUwsR0FBYUEsS0FBYjtBQUNBOztBQUVEVyxnQkFBYyxDQUViOztBQUVEQyxnQkFBYztBQUNiLFdBQU8sS0FBS0osSUFBTCxDQUFVSyxJQUFqQjtBQUNBOztBQUVEQyxRQUFNQyxRQUFOLEVBQWdCO0FBQ2YsU0FBS0MsT0FBTCxHQUFlLElBQUl4QixTQUFTeUIsUUFBYixDQUFzQjtBQUNwQ2pCLGFBQU8sS0FBS0EsS0FEd0I7QUFFcENrQixZQUFNLEtBQUtwRSxJQUZ5QjtBQUdwQ0EsWUFBTSxLQUFLMEQsSUFIeUI7QUFJcENXLGVBQVVDLEdBQUQsSUFBUztBQUNqQixlQUFPTCxTQUFTSyxHQUFULENBQVA7QUFDQSxPQU5tQztBQU9wQ0Msa0JBQWFDLFFBQUQsSUFBYztBQUN6QixjQUFNeEUsT0FBT3lDLEVBQUVnQyxJQUFGLENBQU9ELFFBQVAsRUFBaUIsS0FBakIsRUFBd0IsTUFBeEIsRUFBZ0MsTUFBaEMsRUFBd0MsTUFBeEMsRUFBZ0QsVUFBaEQsRUFBNEQsYUFBNUQsQ0FBYjs7QUFFQXhFLGFBQUswRSxHQUFMLEdBQVdGLFNBQVNFLEdBQVQsQ0FBYUMsT0FBYixDQUFxQnpFLE9BQU8wRSxXQUFQLEVBQXJCLEVBQTJDLEdBQTNDLENBQVg7QUFDQSxlQUFPWCxTQUFTLElBQVQsRUFBZWpFLElBQWYsRUFBcUIsS0FBS2tELEtBQUwsQ0FBVzJCLE9BQVgsQ0FBbUJkLElBQXhDLENBQVA7QUFDQTtBQVptQyxLQUF0QixDQUFmOztBQWVBLFNBQUtHLE9BQUwsQ0FBYVksVUFBYixHQUEwQixDQUFDOUUsSUFBRCxFQUFPK0UsUUFBUCxLQUFvQjtBQUM3QyxXQUFLRCxVQUFMLENBQWdCQyxRQUFoQjtBQUNBLEtBRkQ7O0FBSUEsV0FBTyxLQUFLYixPQUFMLENBQWFGLEtBQWIsRUFBUDtBQUNBOztBQUVEYyxlQUFhLENBQUU7O0FBRWZFLFNBQU87QUFDTixXQUFPLEtBQUtkLE9BQUwsQ0FBYWMsSUFBYixFQUFQO0FBQ0E7O0FBM0NvQyxDQUF0QyxDOzs7Ozs7Ozs7OztBQy9CQXZGLE9BQU93RixNQUFQLENBQWM7QUFBQ0MsbUJBQWdCLE1BQUlBO0FBQXJCLENBQWQ7QUFBcUQsSUFBSUMsRUFBSjtBQUFPMUYsT0FBT0MsS0FBUCxDQUFhQyxRQUFRLElBQVIsQ0FBYixFQUEyQjtBQUFDQyxVQUFRQyxDQUFSLEVBQVU7QUFBQ3NGLFNBQUd0RixDQUFIO0FBQUs7O0FBQWpCLENBQTNCLEVBQThDLENBQTlDO0FBQWlELElBQUl1RixNQUFKO0FBQVczRixPQUFPQyxLQUFQLENBQWFDLFFBQVEsUUFBUixDQUFiLEVBQStCO0FBQUNDLFVBQVFDLENBQVIsRUFBVTtBQUFDdUYsYUFBT3ZGLENBQVA7QUFBUzs7QUFBckIsQ0FBL0IsRUFBc0QsQ0FBdEQ7QUFBeUQsSUFBSXdGLElBQUo7QUFBUzVGLE9BQU9DLEtBQVAsQ0FBYUMsUUFBUSxtQkFBUixDQUFiLEVBQTBDO0FBQUNDLFVBQVFDLENBQVIsRUFBVTtBQUFDd0YsV0FBS3hGLENBQUw7QUFBTzs7QUFBbkIsQ0FBMUMsRUFBK0QsQ0FBL0Q7QUFBa0UsSUFBSXlGLE1BQUo7QUFBVzdGLE9BQU9DLEtBQVAsQ0FBYUMsUUFBUSxlQUFSLENBQWIsRUFBc0M7QUFBQ0MsVUFBUUMsQ0FBUixFQUFVO0FBQUN5RixhQUFPekYsQ0FBUDtBQUFTOztBQUFyQixDQUF0QyxFQUE2RCxDQUE3RDtBQUFnRSxJQUFJMEYsS0FBSjtBQUFVOUYsT0FBT0MsS0FBUCxDQUFhQyxRQUFRLE9BQVIsQ0FBYixFQUE4QjtBQUFDQyxVQUFRQyxDQUFSLEVBQVU7QUFBQzBGLFlBQU0xRixDQUFOO0FBQVE7O0FBQXBCLENBQTlCLEVBQW9ELENBQXBEO0FBQXVELElBQUkyRixPQUFKO0FBQVkvRixPQUFPQyxLQUFQLENBQWFDLFFBQVEsdUJBQVIsQ0FBYixFQUE4QztBQUFDNkYsVUFBUTNGLENBQVIsRUFBVTtBQUFDMkYsY0FBUTNGLENBQVI7QUFBVTs7QUFBdEIsQ0FBOUMsRUFBc0UsQ0FBdEU7QUFTcFosTUFBTTRGLFNBQVMsSUFBSUQsT0FBSixFQUFmO0FBRUFFLE9BQU9DLE1BQVAsQ0FBYzFFLFVBQWQsRUFBMEI7QUFDekIyRSxZQUFVLEVBRGU7O0FBR3pCQyx3QkFBc0IzQyxLQUF0QixFQUE2QmEsSUFBN0IsRUFBbUNjLE9BQW5DLEVBQTRDO0FBQzNDLFVBQU12RSxPQUFPeUQsS0FBS1osS0FBTCxDQUFXLEdBQVgsRUFBZ0JDLEdBQWhCLEVBQWI7QUFDQSxVQUFNMEMsU0FBU3BELFNBQVNxRCxTQUFULEVBQWY7QUFDQSxXQUFPRCxPQUFPL0IsSUFBUCxDQUFQO0FBRUEsV0FBTyxJQUFJckIsU0FBU1EsS0FBVCxDQUFlQSxLQUFmLENBQUosQ0FBMEJ3QyxPQUFPQyxNQUFQLENBQWM7QUFDOUM1QjtBQUQ4QyxLQUFkLEVBRTlCYyxPQUY4QixFQUVyQjVELFdBQVksVUFBVVgsSUFBTSxFQUE1QixHQUZxQixDQUExQixDQUFQO0FBR0EsR0FYd0I7O0FBYXpCMEYsbUJBQWlCO0FBQ2hCLFdBQU87QUFDTkMsa0JBQVk3RixXQUFXcUIsTUFBWCxDQUFrQnlFLE9BQWxCLENBQTBCQyxLQURoQztBQUVOQyxjQUFRLElBQUkxRCxTQUFTMkQsTUFBYixDQUFvQjtBQUMzQkMsaUJBQVNyRixXQUFXQztBQURPLE9BQXBCLENBRkY7O0FBS05xRixjQUFRdkcsSUFBUixFQUFjO0FBQ2IsZUFBUSxHQUFHSSxXQUFXTSxRQUFYLENBQW9CQyxHQUFwQixDQUF3QixVQUF4QixDQUFxQyxZQUFZWCxLQUFLcUIsR0FBSyxJQUFJckIsS0FBS0MsTUFBUSxJQUFJRCxLQUFLd0csR0FBSyxFQUFyRztBQUNBLE9BUEs7O0FBUU5DLGtCQUFZeEYsV0FBV3lGLGlCQVJqQjs7QUFTTkMsYUFBT0MsTUFBUCxFQUFlNUcsSUFBZixFQUFxQjZHLEdBQXJCLEVBQTBCQyxHQUExQixFQUErQjtBQUM5QixZQUFJLENBQUM3RixXQUFXOEYscUJBQVgsQ0FBaUNGLEdBQWpDLENBQUwsRUFBNEM7QUFDM0NDLGNBQUlFLFNBQUosQ0FBYyxHQUFkO0FBQ0EsaUJBQU8sS0FBUDtBQUNBOztBQUVERixZQUFJRyxTQUFKLENBQWMscUJBQWQsRUFBc0MseUJBQXlCQyxtQkFBbUJsSCxLQUFLK0QsSUFBeEIsQ0FBK0IsR0FBOUY7QUFDQSxlQUFPLElBQVA7QUFDQTs7QUFqQkssS0FBUDtBQW1CQSxHQWpDd0I7O0FBbUN6Qm9ELG1CQUFpQjtBQUNoQixXQUFPO0FBQ05sQixrQkFBWTdGLFdBQVdxQixNQUFYLENBQWtCMkYsT0FBbEIsQ0FBMEJqQixLQURoQzs7QUFFTjtBQUNBO0FBQ0E7QUFDQUksY0FBUXZHLElBQVIsRUFBYztBQUNiLGVBQVEsR0FBR0ksV0FBV00sUUFBWCxDQUFvQkMsR0FBcEIsQ0FBd0IsVUFBeEIsQ0FBcUMsWUFBWVgsS0FBS0MsTUFBUSxFQUF6RTtBQUNBLE9BUEs7O0FBUU53RyxrQkFBWXhGLFdBQVdvRyxpQkFSakI7QUFTTkMsc0JBQWdCckcsV0FBV3NHO0FBVHJCLEtBQVA7QUFXQSxHQS9Dd0I7O0FBaUR6QkMseUJBQXVCO0FBQ3RCLFdBQU87QUFDTnZCLGtCQUFZN0YsV0FBV3FCLE1BQVgsQ0FBa0JnRyxhQUFsQixDQUFnQ3RCLEtBRHRDOztBQUVOSSxjQUFRdkcsSUFBUixFQUFjO0FBQ2IsZUFBUSxHQUFHSSxXQUFXTSxRQUFYLENBQW9CQyxHQUFwQixDQUF3QixVQUF4QixDQUFxQyxxQkFBcUJYLEtBQUtDLE1BQVEsRUFBbEY7QUFDQSxPQUpLOztBQUtOd0csa0JBQVl4RixXQUFXeUYsaUJBTGpCOztBQU1OQyxhQUFPQyxNQUFQLEVBQWU1RyxJQUFmLEVBQXFCNkcsR0FBckIsRUFBMEJDLEdBQTFCLEVBQStCO0FBQzlCLFlBQUksQ0FBQzdGLFdBQVc4RixxQkFBWCxDQUFpQ0YsR0FBakMsQ0FBTCxFQUE0QztBQUMzQ0MsY0FBSUUsU0FBSixDQUFjLEdBQWQ7QUFDQSxpQkFBTyxLQUFQO0FBQ0E7O0FBRURGLFlBQUlHLFNBQUosQ0FBYyxxQkFBZCxFQUFzQyx5QkFBeUJDLG1CQUFtQmxILEtBQUsrRCxJQUF4QixDQUErQixHQUE5RjtBQUNBLGVBQU8sSUFBUDtBQUNBOztBQWRLLEtBQVA7QUFnQkEsR0FsRXdCOztBQW9FekJzRCxvQkFBa0JySCxJQUFsQixFQUF3QjtBQUN2QixRQUFJSSxXQUFXTSxRQUFYLENBQW9CQyxHQUFwQixDQUF3Qix1QkFBeEIsTUFBcUQsSUFBekQsRUFBK0Q7QUFDOUQ7QUFDQTs7QUFFRCxVQUFNK0csZUFBZWhGLFNBQVNpRixlQUFULENBQXlCM0gsS0FBS3dHLEdBQTlCLENBQXJCO0FBRUEsVUFBTW9CLFNBQVN4SCxXQUFXTSxRQUFYLENBQW9CQyxHQUFwQixDQUF3QixxQkFBeEIsQ0FBZjtBQUNBLFVBQU1rSCxTQUFTLElBQUl2QyxNQUFKLEVBQWY7QUFFQSxVQUFNd0MsSUFBSXZDLE1BQU1tQyxZQUFOLENBQVY7QUFDQUksTUFBRUMsTUFBRixHQVh1QixDQVl2QjtBQUNBOztBQUNBRCxNQUFFRSxRQUFGLENBQVc5SCxPQUFPK0gsZUFBUCxDQUF1QixDQUFDM0QsR0FBRCxFQUFNMEQsUUFBTixLQUFtQjtBQUNwREYsUUFBRUksUUFBRixDQUFXM0MsTUFBTTRDLE1BQU4sQ0FBYUMsSUFBeEIsRUFDRUMsTUFERixDQUNTQyxLQUFLQyxHQUFMLENBQVNYLE1BQVQsRUFBaUJJLFNBQVNRLEtBQTFCLENBRFQsRUFDMkNGLEtBQUtDLEdBQUwsQ0FBU1gsTUFBVCxFQUFpQkksU0FBU0osTUFBMUIsQ0FEM0MsRUFFRWEsSUFGRixDQUVPbEQsUUFDSjhDLE1BREksQ0FDR1QsTUFESCxFQUNXQSxNQURYLEVBRUpjLFVBRkksQ0FFTyxTQUZQLEVBR0pDLEtBSEksRUFGUCxFQU9DO0FBQ0E7QUFSRCxPQVNFQyxRQVRGLEdBVUVDLElBVkYsQ0FVTzNJLE9BQU8rSCxlQUFQLENBQXVCYSxnQkFBZ0I7QUFDNUMzRCxXQUFHNEQsU0FBSCxDQUFhckIsWUFBYixFQUEyQm9CLFlBQTNCLEVBQXlDNUksT0FBTytILGVBQVAsQ0FBdUIzRCxPQUFPO0FBQ3RFLGNBQUlBLE9BQU8sSUFBWCxFQUFpQjtBQUNoQjBFLG9CQUFRQyxLQUFSLENBQWMzRSxHQUFkO0FBQ0E7O0FBQ0QsZ0JBQU0xRCxPQUFPdUUsR0FBRytELFNBQUgsQ0FBYXhCLFlBQWIsRUFBMkI5RyxJQUF4QztBQUNBLGVBQUt1SSxhQUFMLEdBQXFCQyxNQUFyQixDQUE0Qi9GLE1BQTVCLENBQW1DO0FBQUNtRCxpQkFBS3hHLEtBQUt3RztBQUFYLFdBQW5DLEVBQW9EO0FBQUM2QyxrQkFBTTtBQUFDekk7QUFBRDtBQUFQLFdBQXBEO0FBQ0FpSCxpQkFBT3lCLE1BQVA7QUFDQSxTQVB3QyxDQUF6QztBQVFBLE9BVEssQ0FWUDtBQW9CQSxLQXJCVSxDQUFYO0FBdUJBLFdBQU96QixPQUFPMEIsSUFBUCxFQUFQO0FBQ0EsR0ExR3dCOztBQTRHekJDLHFCQUFtQnhKLElBQW5CLEVBQXlCO0FBQ3hCQSxXQUFPSSxXQUFXcUIsTUFBWCxDQUFrQnlFLE9BQWxCLENBQTBCdkUsV0FBMUIsQ0FBc0MzQixLQUFLd0csR0FBM0MsQ0FBUDtBQUNBeEcsV0FBT2lCLFdBQVd3SSxjQUFYLENBQTBCekosSUFBMUIsQ0FBUDs7QUFDQSxVQUFNMEosUUFBUXpJLFdBQVcwSSxRQUFYLENBQW9CLFNBQXBCLEVBQStCQyxNQUEvQixDQUFzQ0MsYUFBdEMsQ0FBb0Q3SixLQUFLd0csR0FBekQsRUFBOER4RyxJQUE5RCxDQUFkOztBQUVBLFVBQU04SixjQUFjdkUsUUFDbEI4QyxNQURrQixDQUNYLEVBRFcsRUFDUCxFQURPLEVBRWxCMEIsR0FGa0IsR0FHbEIzQixJQUhrQixHQUlsQjRCLElBSmtCLEVBQXBCO0FBS0EsVUFBTUMsU0FBU0gsWUFBWWxCLFFBQVosR0FBdUJDLElBQXZCLENBQTZCcUIsR0FBRCxJQUFTQSxJQUFJQyxRQUFKLENBQWEsUUFBYixDQUFyQyxDQUFmO0FBQ0FULFVBQU1qQixJQUFOLENBQVdxQixXQUFYO0FBQ0EsV0FBT0csTUFBUDtBQUNBLEdBekh3Qjs7QUEySHpCdkQsb0JBQWtCMUcsSUFBbEIsRUFBd0I7QUFDdkIsUUFBSSxDQUFDLHlDQUF5Q29CLElBQXpDLENBQThDcEIsS0FBS00sSUFBbkQsQ0FBTCxFQUErRDtBQUM5RDtBQUNBOztBQUVELFVBQU04SixVQUFVMUgsU0FBU2lGLGVBQVQsQ0FBeUIzSCxLQUFLd0csR0FBOUIsQ0FBaEI7QUFFQSxVQUFNNkQsTUFBTSxJQUFJL0UsTUFBSixFQUFaO0FBRUEsVUFBTXdDLElBQUl2QyxNQUFNNkUsT0FBTixDQUFWO0FBQ0F0QyxNQUFFRSxRQUFGLENBQVc5SCxPQUFPK0gsZUFBUCxDQUF1QixDQUFDM0QsR0FBRCxFQUFNMEQsUUFBTixLQUFtQjtBQUNwRCxVQUFJMUQsT0FBTyxJQUFYLEVBQWlCO0FBQ2hCMEUsZ0JBQVFDLEtBQVIsQ0FBYzNFLEdBQWQ7QUFDQSxlQUFPK0YsSUFBSWYsTUFBSixFQUFQO0FBQ0E7O0FBRUQsWUFBTWdCLFdBQVc7QUFDaEJuQyxnQkFBUUgsU0FBU0csTUFERDtBQUVoQnZILGNBQU07QUFDTDRILGlCQUFPUixTQUFTUSxLQURYO0FBRUxaLGtCQUFRSSxTQUFTSjtBQUZaO0FBRlUsT0FBakI7O0FBUUEsVUFBSUksU0FBU3VDLFdBQVQsSUFBd0IsSUFBNUIsRUFBa0M7QUFDakMsZUFBT0YsSUFBSWYsTUFBSixFQUFQO0FBQ0E7O0FBRUR4QixRQUFFQyxNQUFGLEdBQ0V5QyxNQURGLENBQ1UsR0FBR0osT0FBUyxNQUR0QixFQUVFdkIsSUFGRixDQUVPM0ksT0FBTytILGVBQVAsQ0FBdUIsTUFBTTtBQUNsQzlDLFdBQUdzRixNQUFILENBQVVMLE9BQVYsRUFBbUJsSyxPQUFPK0gsZUFBUCxDQUF1QixNQUFNO0FBQy9DOUMsYUFBR3VGLE1BQUgsQ0FBVyxHQUFHTixPQUFTLE1BQXZCLEVBQThCQSxPQUE5QixFQUF1Q2xLLE9BQU8rSCxlQUFQLENBQXVCLE1BQU07QUFDbkUsa0JBQU1ySCxPQUFPdUUsR0FBRytELFNBQUgsQ0FBYWtCLE9BQWIsRUFBc0J4SixJQUFuQztBQUNBLGlCQUFLdUksYUFBTCxHQUFxQkMsTUFBckIsQ0FBNEIvRixNQUE1QixDQUFtQztBQUFDbUQsbUJBQUt4RyxLQUFLd0c7QUFBWCxhQUFuQyxFQUFvRDtBQUNuRDZDLG9CQUFNO0FBQ0x6SSxvQkFESztBQUVMMEo7QUFGSztBQUQ2QyxhQUFwRDtBQU1BRCxnQkFBSWYsTUFBSjtBQUNBLFdBVHNDLENBQXZDO0FBVUEsU0FYa0IsQ0FBbkI7QUFZQSxPQWJLLENBRlAsRUFlS3FCLEtBZkwsQ0FlWXJHLEdBQUQsSUFBUztBQUNsQjBFLGdCQUFRQyxLQUFSLENBQWMzRSxHQUFkO0FBQ0ErRixZQUFJZixNQUFKO0FBQ0EsT0FsQkY7QUFtQkEsS0FyQ1UsQ0FBWDtBQXVDQSxXQUFPZSxJQUFJZCxJQUFKLEVBQVA7QUFDQSxHQTdLd0I7O0FBK0t6QmhDLHdCQUFzQnZILElBQXRCLEVBQTRCO0FBQzNCO0FBQ0EsVUFBTXVCLE9BQU9uQixXQUFXcUIsTUFBWCxDQUFrQm1KLEtBQWxCLENBQXdCakosV0FBeEIsQ0FBb0MzQixLQUFLQyxNQUF6QyxDQUFiO0FBQ0EsVUFBTTRLLFlBQVl6SyxXQUFXcUIsTUFBWCxDQUFrQjJGLE9BQWxCLENBQTBCMEQsYUFBMUIsQ0FBd0N2SixLQUFLd0osUUFBN0MsQ0FBbEI7O0FBQ0EsUUFBSUYsU0FBSixFQUFlO0FBQ2R6SyxpQkFBV3FCLE1BQVgsQ0FBa0IyRixPQUFsQixDQUEwQjRELFVBQTFCLENBQXFDSCxVQUFVckUsR0FBL0M7QUFDQTs7QUFDRHBHLGVBQVdxQixNQUFYLENBQWtCMkYsT0FBbEIsQ0FBMEI2RCxrQkFBMUIsQ0FBNkNqTCxLQUFLd0csR0FBbEQsRUFBdURqRixLQUFLd0osUUFBNUQsRUFQMkIsQ0FRM0I7QUFDQSxHQXhMd0I7O0FBMEx6QmhFLHdCQUFzQjtBQUFFbUUsY0FBVSxFQUFaO0FBQWdCQyxZQUFRO0FBQXhCLEdBQXRCLEVBQW9EO0FBQ25ELFFBQUksQ0FBQy9LLFdBQVdNLFFBQVgsQ0FBb0JDLEdBQXBCLENBQXdCLHlCQUF4QixDQUFMLEVBQXlEO0FBQ3hELGFBQU8sSUFBUDtBQUNBOztBQUVELFFBQUk7QUFBRXlLLFlBQUY7QUFBVUM7QUFBVixRQUF1QkYsS0FBM0I7O0FBRUEsUUFBSSxDQUFDQyxNQUFELElBQVdGLFFBQVF6RixNQUF2QixFQUErQjtBQUM5QjJGLGVBQVMzRixPQUFPOUUsR0FBUCxDQUFXLFFBQVgsRUFBcUJ1SyxRQUFRekYsTUFBN0IsQ0FBVDtBQUNBNEYsaUJBQVc1RixPQUFPOUUsR0FBUCxDQUFXLFVBQVgsRUFBdUJ1SyxRQUFRekYsTUFBL0IsQ0FBWDtBQUNBOztBQUVELFFBQUksQ0FBQzJGLE1BQUQsSUFBVyxDQUFDQyxRQUFaLElBQXdCLENBQUNqTCxXQUFXcUIsTUFBWCxDQUFrQm1KLEtBQWxCLENBQXdCVSx3QkFBeEIsQ0FBaURGLE1BQWpELEVBQXlEQyxRQUF6RCxDQUE3QixFQUFpRztBQUNoRyxhQUFPLEtBQVA7QUFDQTs7QUFFRCxXQUFPLElBQVA7QUFDQSxHQTNNd0I7O0FBNk16QjVCLGlCQUFlekosSUFBZixFQUFxQjtBQUNwQixRQUFJcUYsS0FBS2tHLE1BQUwsQ0FBWXZMLEtBQUsrRCxJQUFqQixNQUEyQi9ELEtBQUtNLElBQXBDLEVBQTBDO0FBQ3pDLGFBQU9OLElBQVA7QUFDQTs7QUFFRCxVQUFNd0wsTUFBTW5HLEtBQUtvRyxTQUFMLENBQWV6TCxLQUFLTSxJQUFwQixDQUFaOztBQUNBLFFBQUlrTCxPQUFPLFVBQVUsSUFBSUUsTUFBSixDQUFZLEtBQUtGLEdBQUssR0FBdEIsRUFBMEIsR0FBMUIsRUFBK0JwSyxJQUEvQixDQUFvQ3BCLEtBQUsrRCxJQUF6QyxDQUFyQixFQUFxRTtBQUNwRS9ELFdBQUsrRCxJQUFMLEdBQWEsR0FBRy9ELEtBQUsrRCxJQUFNLElBQUl5SCxHQUFLLEVBQXBDO0FBQ0E7O0FBRUQsV0FBT3hMLElBQVA7QUFDQSxHQXhOd0I7O0FBME56QjJKLFdBQVNnQyxTQUFULEVBQW9CO0FBQ25CLFVBQU1DLGNBQWN4TCxXQUFXTSxRQUFYLENBQW9CQyxHQUFwQixDQUF3Qix5QkFBeEIsQ0FBcEI7QUFDQSxVQUFNa0wsY0FBZSxHQUFHRCxXQUFhLElBQUlELFNBQVcsRUFBcEQ7QUFFQSxXQUFPLEtBQUtHLGNBQUwsQ0FBb0JELFdBQXBCLENBQVA7QUFDQSxHQS9Od0I7O0FBaU96QkMsaUJBQWVELFdBQWYsRUFBNEI7QUFDM0IsUUFBSSxLQUFLakcsUUFBTCxDQUFjaUcsV0FBZCxLQUE4QixJQUFsQyxFQUF3QztBQUN2QzdDLGNBQVFDLEtBQVIsQ0FBZSxtQkFBbUI0QyxXQUFhLG1CQUEvQztBQUNBOztBQUNELFdBQU8sS0FBS2pHLFFBQUwsQ0FBY2lHLFdBQWQsQ0FBUDtBQUNBLEdBdE93Qjs7QUF3T3pCbEwsTUFBSVgsSUFBSixFQUFVNkcsR0FBVixFQUFlQyxHQUFmLEVBQW9CaUYsSUFBcEIsRUFBMEI7QUFDekIsVUFBTTdJLFFBQVEsS0FBSzRJLGNBQUwsQ0FBb0I5TCxLQUFLa0QsS0FBekIsQ0FBZDs7QUFDQSxRQUFJQSxTQUFTQSxNQUFNdkMsR0FBbkIsRUFBd0I7QUFDdkIsYUFBT3VDLE1BQU12QyxHQUFOLENBQVVYLElBQVYsRUFBZ0I2RyxHQUFoQixFQUFxQkMsR0FBckIsRUFBMEJpRixJQUExQixDQUFQO0FBQ0E7O0FBQ0RqRixRQUFJRSxTQUFKLENBQWMsR0FBZDtBQUNBRixRQUFJa0YsR0FBSjtBQUNBLEdBL093Qjs7QUFpUHpCQyxPQUFLak0sSUFBTCxFQUFXa00sVUFBWCxFQUF1QjtBQUN0QixVQUFNaEosUUFBUSxLQUFLNEksY0FBTCxDQUFvQjlMLEtBQUtrRCxLQUF6QixDQUFkO0FBQ0EsVUFBTWdILE1BQU0vRSxHQUFHZ0gsaUJBQUgsQ0FBcUJELFVBQXJCLENBQVo7QUFFQWxNLFdBQU9pQixXQUFXd0ksY0FBWCxDQUEwQnpKLElBQTFCLENBQVA7O0FBRUEsUUFBSWtELE1BQU0rSSxJQUFWLEVBQWdCO0FBQ2YvSSxZQUFNK0ksSUFBTixDQUFXak0sSUFBWCxFQUFpQmtLLEdBQWpCO0FBQ0EsYUFBTyxJQUFQO0FBQ0E7O0FBRUQsV0FBTyxLQUFQO0FBQ0E7O0FBN1B3QixDQUExQjs7QUFnUU8sTUFBTWhGLGVBQU4sQ0FBc0I7QUFDNUJ6QixjQUFZO0FBQUVNLFFBQUY7QUFBUW9DLFNBQVI7QUFBZWpELFNBQWY7QUFBc0J2QyxPQUF0QjtBQUEyQm1DLFVBQTNCO0FBQW1DNkcsWUFBbkM7QUFBNkNzQztBQUE3QyxHQUFaLEVBQWlFO0FBQ2hFLFNBQUtsSSxJQUFMLEdBQVlBLElBQVo7QUFDQSxTQUFLb0MsS0FBTCxHQUFhQSxTQUFTLEtBQUtpRyxnQkFBTCxFQUF0QjtBQUNBLFNBQUt4QyxNQUFMLEdBQWMxRyxTQUFTUixTQUFTaUgsUUFBVCxDQUFrQjVGLElBQWxCLENBQXZCO0FBQ0EsU0FBS3BELEdBQUwsR0FBV0EsR0FBWDtBQUNBLFNBQUtzTCxJQUFMLEdBQVlBLElBQVo7O0FBRUEsUUFBSW5KLE1BQUosRUFBWTtBQUNYLFdBQUtBLE1BQUwsR0FBY0EsTUFBZDtBQUNBOztBQUVELFFBQUk2RyxRQUFKLEVBQWM7QUFDYixXQUFLQSxRQUFMLEdBQWdCQSxRQUFoQjtBQUNBOztBQUVEMUksZUFBVzJFLFFBQVgsQ0FBb0I3QixJQUFwQixJQUE0QixJQUE1QjtBQUNBOztBQUVENEYsYUFBVztBQUNWLFdBQU8sS0FBS0MsTUFBWjtBQUNBOztBQUVELE1BQUkxRyxLQUFKLEdBQVk7QUFDWCxXQUFPLEtBQUt5RyxRQUFMLEVBQVA7QUFDQTs7QUFFRCxNQUFJekcsS0FBSixDQUFVQSxLQUFWLEVBQWlCO0FBQ2hCLFNBQUswRyxNQUFMLEdBQWMxRyxLQUFkO0FBQ0E7O0FBRURrSixxQkFBbUI7QUFDbEIsV0FBT2hNLFdBQVdxQixNQUFYLENBQWtCLEtBQUtzQyxJQUFMLENBQVVaLEtBQVYsQ0FBZ0IsR0FBaEIsRUFBcUIsQ0FBckIsQ0FBbEIsQ0FBUDtBQUNBOztBQUVEa0osU0FBT3pGLE1BQVAsRUFBZTtBQUNkLFFBQUksS0FBSzFELEtBQUwsSUFBYyxLQUFLQSxLQUFMLENBQVdtSixNQUE3QixFQUFxQztBQUNwQyxXQUFLbkosS0FBTCxDQUFXbUosTUFBWCxDQUFrQnpGLE1BQWxCO0FBQ0E7O0FBRUQsV0FBTyxLQUFLVCxLQUFMLENBQVc2RSxVQUFYLENBQXNCcEUsTUFBdEIsQ0FBUDtBQUNBOztBQUVEMEYsYUFBVzFGLE1BQVgsRUFBbUI7QUFDbEIsVUFBTTVHLE9BQU8sS0FBS21HLEtBQUwsQ0FBV3hFLFdBQVgsQ0FBdUJpRixNQUF2QixDQUFiOztBQUVBLFFBQUksQ0FBQzVHLElBQUwsRUFBVztBQUNWO0FBQ0E7O0FBRUQsVUFBTWtELFFBQVFqQyxXQUFXNkssY0FBWCxDQUEwQjlMLEtBQUtrRCxLQUEvQixDQUFkO0FBRUEsV0FBT0EsTUFBTW1KLE1BQU4sQ0FBYXJNLEtBQUt3RyxHQUFsQixDQUFQO0FBQ0E7O0FBRUQrRixlQUFhQyxRQUFiLEVBQXVCO0FBQ3RCLFVBQU14TSxPQUFPLEtBQUttRyxLQUFMLENBQVcyRSxhQUFYLENBQXlCMEIsUUFBekIsQ0FBYjs7QUFFQSxRQUFJLENBQUN4TSxJQUFMLEVBQVc7QUFDVjtBQUNBOztBQUVELFVBQU1rRCxRQUFRakMsV0FBVzZLLGNBQVgsQ0FBMEI5TCxLQUFLa0QsS0FBL0IsQ0FBZDtBQUVBLFdBQU9BLE1BQU1tSixNQUFOLENBQWFyTSxLQUFLd0csR0FBbEIsQ0FBUDtBQUNBOztBQUVEMUQsU0FBTzBCLFFBQVAsRUFBaUJpSSxjQUFqQixFQUFpQ0MsRUFBakMsRUFBcUM7QUFDcENsSSxhQUFTNUQsSUFBVCxHQUFnQnlCLFNBQVNtQyxTQUFTNUQsSUFBbEIsS0FBMkIsQ0FBM0MsQ0FEb0MsQ0FHcEM7O0FBQ0EsVUFBTXdGLFNBQVMsS0FBS2xELEtBQUwsQ0FBV3lKLFNBQVgsRUFBZjs7QUFDQSxRQUFJdkcsVUFBVUEsT0FBT3dHLEtBQXJCLEVBQTRCO0FBQzNCeEcsYUFBT3dHLEtBQVAsQ0FBYXBJLFFBQWI7QUFDQTs7QUFFRCxVQUFNb0MsU0FBUyxLQUFLMUQsS0FBTCxDQUFXMkosTUFBWCxDQUFrQnJJLFFBQWxCLENBQWY7QUFDQSxVQUFNc0ksUUFBUSxLQUFLNUosS0FBTCxDQUFXNkosV0FBWCxDQUF1Qm5HLE1BQXZCLENBQWQ7QUFDQSxVQUFNd0QsVUFBVTFILFNBQVNpRixlQUFULENBQXlCZixNQUF6QixDQUFoQjs7QUFFQSxRQUFJO0FBQ0gsVUFBSTZGLDBCQUEwQnJILE1BQTlCLEVBQXNDO0FBQ3JDcUgsdUJBQWVoRSxJQUFmLENBQW9CdEQsR0FBR2dILGlCQUFILENBQXFCL0IsT0FBckIsQ0FBcEI7QUFDQSxPQUZELE1BRU8sSUFBSXFDLDBCQUEwQk8sTUFBOUIsRUFBc0M7QUFDNUM3SCxXQUFHOEgsYUFBSCxDQUFpQjdDLE9BQWpCLEVBQTBCcUMsY0FBMUI7QUFDQSxPQUZNLE1BRUE7QUFDTixjQUFNLElBQUl0TSxLQUFKLENBQVUsbUJBQVYsQ0FBTjtBQUNBOztBQUVELFlBQU1ILE9BQU9FLE9BQU9nTixJQUFQLENBQVksYUFBWixFQUEyQnRHLE1BQTNCLEVBQW1DLEtBQUs3QyxJQUF4QyxFQUE4QytJLEtBQTlDLENBQWI7O0FBRUEsVUFBSUosRUFBSixFQUFRO0FBQ1BBLFdBQUcsSUFBSCxFQUFTMU0sSUFBVDtBQUNBOztBQUVELGFBQU9BLElBQVA7QUFDQSxLQWhCRCxDQWdCRSxPQUFPc0MsQ0FBUCxFQUFVO0FBQ1gsVUFBSW9LLEVBQUosRUFBUTtBQUNQQSxXQUFHcEssQ0FBSDtBQUNBLE9BRkQsTUFFTztBQUNOLGNBQU1BLENBQU47QUFDQTtBQUNEO0FBQ0Q7O0FBdkcyQixDOzs7Ozs7Ozs7OztBQzNRN0IsSUFBSTZLLElBQUo7QUFBUzFOLE9BQU9DLEtBQVAsQ0FBYUMsUUFBUSxNQUFSLENBQWIsRUFBNkI7QUFBQ0MsVUFBUUMsQ0FBUixFQUFVO0FBQUNzTixXQUFLdE4sQ0FBTDtBQUFPOztBQUFuQixDQUE3QixFQUFrRCxDQUFsRDtBQUFxRCxJQUFJdU4sR0FBSjtBQUFRM04sT0FBT0MsS0FBUCxDQUFhQyxRQUFRLEtBQVIsQ0FBYixFQUE0QjtBQUFDQyxVQUFRQyxDQUFSLEVBQVU7QUFBQ3VOLFVBQUl2TixDQUFKO0FBQU07O0FBQWxCLENBQTVCLEVBQWdELENBQWhEO0FBS3RFLE1BQU13TixTQUFTLElBQUlDLE1BQUosQ0FBVyxhQUFYLENBQWY7QUFFQUMsT0FBT0MsZUFBUCxDQUF1QkMsS0FBdkIsQ0FBNkJDLE9BQTdCLENBQXFDO0FBQ3BDQyxTQUFPLEVBRDZCO0FBRXBDQyxVQUFRMU4sT0FBTytILGVBQVAsQ0FBdUIsVUFBU3BCLEdBQVQsRUFBY0MsR0FBZCxFQUFtQmlGLElBQW5CLEVBQXlCO0FBQ3ZEO0FBQ0EsUUFBSWxGLElBQUluQyxHQUFKLENBQVF6QixPQUFSLENBQWdCUCxTQUFTQyxNQUFULENBQWdCa0wsVUFBaEMsTUFBZ0QsQ0FBQyxDQUFyRCxFQUF3RDtBQUN2RCxhQUFPOUIsTUFBUDtBQUNBOztBQUVEc0IsV0FBT1MsS0FBUCxDQUFhLGFBQWIsRUFBNEJqSCxJQUFJbkMsR0FBaEM7O0FBRUEsUUFBSW1DLElBQUlrSCxNQUFKLEtBQWUsTUFBbkIsRUFBMkI7QUFDMUIsYUFBT2hDLE1BQVA7QUFDQSxLQVZzRCxDQVl2RDs7O0FBQ0EsVUFBTWlDLFlBQVlaLElBQUlhLEtBQUosQ0FBVXBILElBQUluQyxHQUFkLENBQWxCO0FBQ0EsVUFBTXdKLE9BQU9GLFVBQVVHLFFBQVYsQ0FBbUJDLE1BQW5CLENBQTBCMUwsU0FBU0MsTUFBVCxDQUFnQmtMLFVBQWhCLENBQTJCUSxNQUEzQixHQUFvQyxDQUE5RCxDQUFiLENBZHVELENBZ0J2RDs7QUFDQSxVQUFNQyxTQUFTLElBQUk1QyxNQUFKLENBQVcsNEJBQVgsQ0FBZjtBQUNBLFVBQU02QyxRQUFRRCxPQUFPRSxJQUFQLENBQVlOLElBQVosQ0FBZCxDQWxCdUQsQ0FvQnZEOztBQUNBLFFBQUlLLFVBQVUsSUFBZCxFQUFvQjtBQUNuQnpILFVBQUlFLFNBQUosQ0FBYyxHQUFkO0FBQ0FGLFVBQUlrRixHQUFKO0FBQ0E7QUFDQSxLQXpCc0QsQ0EyQnZEOzs7QUFDQSxVQUFNOUksUUFBUVIsU0FBU2lILFFBQVQsQ0FBa0I0RSxNQUFNLENBQU4sQ0FBbEIsQ0FBZDs7QUFDQSxRQUFJLENBQUNyTCxLQUFMLEVBQVk7QUFDWDRELFVBQUlFLFNBQUosQ0FBYyxHQUFkO0FBQ0FGLFVBQUlrRixHQUFKO0FBQ0E7QUFDQSxLQWpDc0QsQ0FtQ3ZEOzs7QUFDQSxVQUFNcEYsU0FBUzJILE1BQU0sQ0FBTixDQUFmO0FBQ0EsVUFBTXZPLE9BQU9rRCxNQUFNaUcsYUFBTixHQUFzQnNGLE9BQXRCLENBQThCO0FBQUNqSSxXQUFLSTtBQUFOLEtBQTlCLENBQWI7O0FBQ0EsUUFBSTVHLFNBQVMwTyxTQUFiLEVBQXdCO0FBQ3ZCNUgsVUFBSUUsU0FBSixDQUFjLEdBQWQ7QUFDQUYsVUFBSWtGLEdBQUo7QUFDQTtBQUNBOztBQUVELFFBQUloTSxLQUFLMk8sVUFBTCxLQUFvQkMsZUFBZWpMLEVBQWYsRUFBeEIsRUFBNkM7QUFDNUMwSixhQUFPUyxLQUFQLENBQWEsa0JBQWI7QUFDQSxhQUFPL0IsTUFBUDtBQUNBLEtBL0NzRCxDQWlEdkQ7OztBQUNBLFVBQU04QyxXQUFXRCxlQUFlekYsYUFBZixHQUErQnNGLE9BQS9CLENBQXVDO0FBQUNqSSxXQUFLeEcsS0FBSzJPO0FBQVgsS0FBdkMsQ0FBakI7O0FBRUEsUUFBSUUsWUFBWSxJQUFoQixFQUFzQjtBQUNyQi9ILFVBQUlFLFNBQUosQ0FBYyxHQUFkO0FBQ0FGLFVBQUlrRixHQUFKO0FBQ0E7QUFDQTs7QUFFRCxRQUFJNkMsU0FBU0MsZ0JBQVQsQ0FBMEJDLElBQTFCLEtBQW1DQyxRQUFRQyxHQUFSLENBQVlDLFdBQS9DLElBQThEOU8sV0FBVytPLFFBQVgsT0FBMEIsS0FBNUYsRUFBbUc7QUFDbEdOLGVBQVNDLGdCQUFULENBQTBCQyxJQUExQixHQUFpQyxXQUFqQztBQUNBOztBQUVEMUIsV0FBT1MsS0FBUCxDQUFhLDZCQUFiLEVBQTZDLEdBQUdlLFNBQVNDLGdCQUFULENBQTBCQyxJQUFNLElBQUlGLFNBQVNDLGdCQUFULENBQTBCTSxJQUFNLEVBQXBIO0FBRUEsVUFBTXZLLFVBQVU7QUFDZndLLGdCQUFVUixTQUFTQyxnQkFBVCxDQUEwQkMsSUFEckI7QUFFZkssWUFBTVAsU0FBU0MsZ0JBQVQsQ0FBMEJNLElBRmpCO0FBR2ZsQixZQUFNckgsSUFBSXlJLFdBSEs7QUFJZnZCLGNBQVE7QUFKTyxLQUFoQjtBQU9BLFVBQU13QixRQUFRcEMsS0FBS3FDLE9BQUwsQ0FBYTNLLE9BQWIsRUFBc0IsVUFBUzRLLFNBQVQsRUFBb0I7QUFDdkRBLGdCQUFVaEgsSUFBVixDQUFlM0IsR0FBZixFQUFvQjtBQUNuQmtGLGFBQUs7QUFEYyxPQUFwQjtBQUdBLEtBSmEsQ0FBZDtBQU1BbkYsUUFBSTRCLElBQUosQ0FBUzhHLEtBQVQsRUFBZ0I7QUFDZnZELFdBQUs7QUFEVSxLQUFoQjtBQUdBLEdBaEZPO0FBRjRCLENBQXJDLEU7Ozs7Ozs7Ozs7O0FDUEE7QUFFQXVCLE9BQU9DLGVBQVAsQ0FBdUJrQyxHQUF2QixDQUEyQixlQUEzQixFQUE0QyxVQUFTN0ksR0FBVCxFQUFjQyxHQUFkLEVBQW1CaUYsSUFBbkIsRUFBeUI7QUFFcEUsUUFBTXdDLFFBQVEsb0JBQW9CQyxJQUFwQixDQUF5QjNILElBQUluQyxHQUE3QixDQUFkOztBQUVBLE1BQUk2SixNQUFNLENBQU4sQ0FBSixFQUFjO0FBQ2IsVUFBTXZPLE9BQU9JLFdBQVdxQixNQUFYLENBQWtCeUUsT0FBbEIsQ0FBMEJ2RSxXQUExQixDQUFzQzRNLE1BQU0sQ0FBTixDQUF0QyxDQUFiOztBQUVBLFFBQUl2TyxJQUFKLEVBQVU7QUFDVCxVQUFJLENBQUNFLE9BQU9RLFFBQVAsQ0FBZ0JpUCxNQUFoQixDQUF1QkMsU0FBeEIsSUFBcUMsQ0FBQzNPLFdBQVc4RixxQkFBWCxDQUFpQ0YsR0FBakMsQ0FBMUMsRUFBaUY7QUFDaEZDLFlBQUlFLFNBQUosQ0FBYyxHQUFkO0FBQ0EsZUFBT0YsSUFBSWtGLEdBQUosRUFBUDtBQUNBOztBQUVEbEYsVUFBSUcsU0FBSixDQUFjLHlCQUFkLEVBQXlDLHNCQUF6QztBQUNBLGFBQU9oRyxXQUFXTixHQUFYLENBQWVYLElBQWYsRUFBcUI2RyxHQUFyQixFQUEwQkMsR0FBMUIsRUFBK0JpRixJQUEvQixDQUFQO0FBQ0E7QUFDRDs7QUFFRGpGLE1BQUlFLFNBQUosQ0FBYyxHQUFkO0FBQ0FGLE1BQUlrRixHQUFKO0FBQ0EsQ0FwQkQsRTs7Ozs7Ozs7Ozs7QUNGQSxJQUFJdkosQ0FBSjs7QUFBTWhELE9BQU9DLEtBQVAsQ0FBYUMsUUFBUSxZQUFSLENBQWIsRUFBbUM7QUFBQ0MsVUFBUUMsQ0FBUixFQUFVO0FBQUM0QyxRQUFFNUMsQ0FBRjtBQUFJOztBQUFoQixDQUFuQyxFQUFxRCxDQUFyRDtBQUF3REosT0FBT0MsS0FBUCxDQUFhQyxRQUFRLGVBQVIsQ0FBYjtBQUF1Q0YsT0FBT0MsS0FBUCxDQUFhQyxRQUFRLGlCQUFSLENBQWI7QUFBeUNGLE9BQU9DLEtBQVAsQ0FBYUMsUUFBUSxvQkFBUixDQUFiO0FBQTRDRixPQUFPQyxLQUFQLENBQWFDLFFBQVEsYUFBUixDQUFiO0FBQXFDRixPQUFPQyxLQUFQLENBQWFDLFFBQVEsMkJBQVIsQ0FBYjs7QUFTL04sTUFBTWtRLGNBQWNwTixFQUFFcU4sUUFBRixDQUFXLE1BQU07QUFDcEMsUUFBTTVNLFFBQVE5QyxXQUFXTSxRQUFYLENBQW9CQyxHQUFwQixDQUF3Qix5QkFBeEIsQ0FBZDs7QUFFQSxNQUFJdUMsS0FBSixFQUFXO0FBQ1Y4RixZQUFRK0csR0FBUixDQUFZLCtCQUFaLEVBQTZDN00sS0FBN0M7QUFDQVIsYUFBU3FELFNBQVQsR0FBcUJxQixPQUFyQixHQUErQjFFLFNBQVNpSCxRQUFULENBQW1CLEdBQUd6RyxLQUFPLFVBQTdCLENBQS9CO0FBQ0FSLGFBQVNxRCxTQUFULEdBQXFCRyxPQUFyQixHQUErQnhELFNBQVNpSCxRQUFULENBQW1CLEdBQUd6RyxLQUFPLFVBQTdCLENBQS9CO0FBQ0FSLGFBQVNxRCxTQUFULEdBQXFCMEIsYUFBckIsR0FBcUMvRSxTQUFTaUgsUUFBVCxDQUFtQixHQUFHekcsS0FBTyxnQkFBN0IsQ0FBckM7QUFDQTtBQUNELENBVG1CLEVBU2pCLElBVGlCLENBQXBCOztBQVdBOUMsV0FBV00sUUFBWCxDQUFvQkMsR0FBcEIsQ0FBd0IsY0FBeEIsRUFBd0NrUCxXQUF4QyxFOzs7Ozs7Ozs7OztBQ3BCQSxJQUFJcE4sQ0FBSjs7QUFBTWhELE9BQU9DLEtBQVAsQ0FBYUMsUUFBUSxZQUFSLENBQWIsRUFBbUM7QUFBQ0MsVUFBUUMsQ0FBUixFQUFVO0FBQUM0QyxRQUFFNUMsQ0FBRjtBQUFJOztBQUFoQixDQUFuQyxFQUFxRCxDQUFyRDtBQUF3RCxJQUFJcUYsZUFBSjtBQUFvQnpGLE9BQU9DLEtBQVAsQ0FBYUMsUUFBUSxtQkFBUixDQUFiLEVBQTBDO0FBQUN1RixrQkFBZ0JyRixDQUFoQixFQUFrQjtBQUFDcUYsc0JBQWdCckYsQ0FBaEI7QUFBa0I7O0FBQXRDLENBQTFDLEVBQWtGLENBQWxGO0FBQXFGSixPQUFPQyxLQUFQLENBQWFDLFFBQVEsOEJBQVIsQ0FBYjtBQUFzRCxJQUFJd04sSUFBSjtBQUFTMU4sT0FBT0MsS0FBUCxDQUFhQyxRQUFRLE1BQVIsQ0FBYixFQUE2QjtBQUFDQyxVQUFRQyxDQUFSLEVBQVU7QUFBQ3NOLFdBQUt0TixDQUFMO0FBQU87O0FBQW5CLENBQTdCLEVBQWtELENBQWxEO0FBQXFELElBQUltUSxLQUFKO0FBQVV2USxPQUFPQyxLQUFQLENBQWFDLFFBQVEsT0FBUixDQUFiLEVBQThCO0FBQUNDLFVBQVFDLENBQVIsRUFBVTtBQUFDbVEsWUFBTW5RLENBQU47QUFBUTs7QUFBcEIsQ0FBOUIsRUFBb0QsQ0FBcEQ7O0FBUXJTLE1BQU1jLE1BQU0sVUFBU1gsSUFBVCxFQUFlNkcsR0FBZixFQUFvQkMsR0FBcEIsRUFBeUI7QUFDcEMsUUFBTW1KLFVBQVUsS0FBSy9NLEtBQUwsQ0FBV2dOLGNBQVgsQ0FBMEJsUSxJQUExQixDQUFoQjs7QUFFQSxNQUFJaVEsT0FBSixFQUFhO0FBQ1osVUFBTUUsWUFBWW5RLEtBQUtrRCxLQUFMLENBQVdDLEtBQVgsQ0FBaUIsR0FBakIsRUFBc0JDLEdBQXRCLEVBQWxCOztBQUNBLFFBQUloRCxXQUFXTSxRQUFYLENBQW9CQyxHQUFwQixDQUF5Qix1QkFBdUJ3UCxTQUFXLEVBQTNELENBQUosRUFBbUU7QUFDbEUsWUFBTVgsVUFBVSxVQUFVcE8sSUFBVixDQUFlNk8sT0FBZixJQUEwQkQsS0FBMUIsR0FBa0M3QyxJQUFsRDtBQUNBcUMsY0FBUTdPLEdBQVIsQ0FBWXNQLE9BQVosRUFBcUJHLFdBQVdBLFFBQVEzSCxJQUFSLENBQWEzQixHQUFiLENBQWhDO0FBQ0EsS0FIRCxNQUdPO0FBQ05BLFVBQUl1SixZQUFKLENBQWlCLGdCQUFqQjtBQUNBdkosVUFBSUcsU0FBSixDQUFjLFVBQWQsRUFBMEJnSixPQUExQjtBQUNBbkosVUFBSUUsU0FBSixDQUFjLEdBQWQ7QUFDQUYsVUFBSWtGLEdBQUo7QUFDQTtBQUNELEdBWEQsTUFXTztBQUNObEYsUUFBSWtGLEdBQUo7QUFDQTtBQUNELENBakJEOztBQW1CQSxNQUFNQyxPQUFPLFVBQVNqTSxJQUFULEVBQWVrSyxHQUFmLEVBQW9CO0FBQ2hDLFFBQU0rRixVQUFVLEtBQUsvTSxLQUFMLENBQVdnTixjQUFYLENBQTBCbFEsSUFBMUIsQ0FBaEI7O0FBRUEsTUFBSWlRLE9BQUosRUFBYTtBQUNaLFVBQU1ULFVBQVUsVUFBVXBPLElBQVYsQ0FBZTZPLE9BQWYsSUFBMEJELEtBQTFCLEdBQWtDN0MsSUFBbEQ7QUFDQXFDLFlBQVE3TyxHQUFSLENBQVlzUCxPQUFaLEVBQXFCRyxXQUFXQSxRQUFRM0gsSUFBUixDQUFheUIsR0FBYixDQUFoQztBQUNBLEdBSEQsTUFHTztBQUNOQSxRQUFJOEIsR0FBSjtBQUNBO0FBQ0QsQ0FURDs7QUFXQSxNQUFNc0Usa0JBQWtCLElBQUlwTCxlQUFKLENBQW9CO0FBQzNDbkIsUUFBTSxrQkFEcUM7QUFFM0NwRCxLQUYyQztBQUczQ3NMLE1BSDJDLENBSTNDOztBQUoyQyxDQUFwQixDQUF4QjtBQU9BLE1BQU1zRSxrQkFBa0IsSUFBSXJMLGVBQUosQ0FBb0I7QUFDM0NuQixRQUFNLGtCQURxQztBQUUzQ3BELEtBRjJDO0FBRzNDc0wsTUFIMkMsQ0FJM0M7O0FBSjJDLENBQXBCLENBQXhCO0FBT0EsTUFBTXVFLHdCQUF3QixJQUFJdEwsZUFBSixDQUFvQjtBQUNqRG5CLFFBQU0sd0JBRDJDO0FBRWpEcEQsS0FGaUQ7QUFHakRzTCxNQUhpRCxDQUlqRDs7QUFKaUQsQ0FBcEIsQ0FBOUI7O0FBT0EsTUFBTXdFLFlBQVloTyxFQUFFcU4sUUFBRixDQUFXLFlBQVc7QUFDdkMsUUFBTVksU0FBU3RRLFdBQVdNLFFBQVgsQ0FBb0JDLEdBQXBCLENBQXdCLHNCQUF4QixDQUFmO0FBQ0EsUUFBTWdRLE1BQU12USxXQUFXTSxRQUFYLENBQW9CQyxHQUFwQixDQUF3QixtQkFBeEIsQ0FBWjtBQUNBLFFBQU1pUSxpQkFBaUJ4USxXQUFXTSxRQUFYLENBQW9CQyxHQUFwQixDQUF3Qiw4QkFBeEIsQ0FBdkI7QUFDQSxRQUFNa1EscUJBQXFCelEsV0FBV00sUUFBWCxDQUFvQkMsR0FBcEIsQ0FBd0Isa0NBQXhCLENBQTNCO0FBQ0EsUUFBTW1RLG9CQUFvQjFRLFdBQVdNLFFBQVgsQ0FBb0JDLEdBQXBCLENBQXdCLGlDQUF4QixDQUExQjtBQUNBLFFBQU1vUSxTQUFTM1EsV0FBV00sUUFBWCxDQUFvQkMsR0FBcEIsQ0FBd0Isc0JBQXhCLENBQWY7QUFDQSxRQUFNcVEsbUJBQW1CNVEsV0FBV00sUUFBWCxDQUFvQkMsR0FBcEIsQ0FBd0IsZ0NBQXhCLENBQXpCO0FBQ0EsUUFBTXNRLGlCQUFpQjdRLFdBQVdNLFFBQVgsQ0FBb0JDLEdBQXBCLENBQXdCLDhCQUF4QixDQUF2QixDQVJ1QyxDQVN2Qzs7QUFDQSxRQUFNdVEsWUFBWTlRLFdBQVdNLFFBQVgsQ0FBb0JDLEdBQXBCLENBQXdCLHlCQUF4QixDQUFsQjs7QUFFQSxNQUFJLENBQUMrUCxNQUFELElBQVcsQ0FBQ0UsY0FBWixJQUE4QixDQUFDQyxrQkFBbkMsRUFBdUQ7QUFDdEQ7QUFDQTs7QUFFRCxRQUFNbE8sU0FBUztBQUNkd08sZ0JBQVk7QUFDWEMsbUJBQWFSLGNBREY7QUFFWFMsdUJBQWlCUixrQkFGTjtBQUdYUyx3QkFBa0JOLGdCQUhQO0FBSVhPLHdCQUFrQk4sY0FKUDtBQUtYTyxjQUFRO0FBQ1BkLGNBRE87QUFFUGUsYUFBS2Q7QUFGRSxPQUxHO0FBU1hlLGNBQVFYO0FBVEcsS0FERTtBQVlkRDtBQVpjLEdBQWY7O0FBZUEsTUFBSUksU0FBSixFQUFlO0FBQ2R2TyxXQUFPd08sVUFBUCxDQUFrQlEsUUFBbEIsR0FBNkJULFNBQTdCO0FBQ0E7O0FBRURaLGtCQUFnQnBOLEtBQWhCLEdBQXdCakMsV0FBVzRFLHFCQUFYLENBQWlDLFVBQWpDLEVBQTZDeUssZ0JBQWdCdk0sSUFBN0QsRUFBbUVwQixNQUFuRSxDQUF4QjtBQUNBNE4sa0JBQWdCck4sS0FBaEIsR0FBd0JqQyxXQUFXNEUscUJBQVgsQ0FBaUMsVUFBakMsRUFBNkMwSyxnQkFBZ0J4TSxJQUE3RCxFQUFtRXBCLE1BQW5FLENBQXhCO0FBQ0E2Tix3QkFBc0J0TixLQUF0QixHQUE4QmpDLFdBQVc0RSxxQkFBWCxDQUFpQyxVQUFqQyxFQUE2QzJLLHNCQUFzQnpNLElBQW5FLEVBQXlFcEIsTUFBekUsQ0FBOUI7QUFDQSxDQXRDaUIsRUFzQ2YsR0F0Q2UsQ0FBbEI7O0FBd0NBdkMsV0FBV00sUUFBWCxDQUFvQkMsR0FBcEIsQ0FBd0IsaUJBQXhCLEVBQTJDOFAsU0FBM0MsRTs7Ozs7Ozs7Ozs7QUNuR0EsSUFBSWhPLENBQUo7O0FBQU1oRCxPQUFPQyxLQUFQLENBQWFDLFFBQVEsWUFBUixDQUFiLEVBQW1DO0FBQUNDLFVBQVFDLENBQVIsRUFBVTtBQUFDNEMsUUFBRTVDLENBQUY7QUFBSTs7QUFBaEIsQ0FBbkMsRUFBcUQsQ0FBckQ7QUFBd0QsSUFBSXNGLEVBQUo7QUFBTzFGLE9BQU9DLEtBQVAsQ0FBYUMsUUFBUSxJQUFSLENBQWIsRUFBMkI7QUFBQ0MsVUFBUUMsQ0FBUixFQUFVO0FBQUNzRixTQUFHdEYsQ0FBSDtBQUFLOztBQUFqQixDQUEzQixFQUE4QyxDQUE5QztBQUFpRCxJQUFJcUYsZUFBSjtBQUFvQnpGLE9BQU9DLEtBQVAsQ0FBYUMsUUFBUSxtQkFBUixDQUFiLEVBQTBDO0FBQUN1RixrQkFBZ0JyRixDQUFoQixFQUFrQjtBQUFDcUYsc0JBQWdCckYsQ0FBaEI7QUFBa0I7O0FBQXRDLENBQTFDLEVBQWtGLENBQWxGO0FBTTFJLE1BQU0rUixvQkFBb0IsSUFBSTFNLGVBQUosQ0FBb0I7QUFDN0NuQixRQUFNLG9CQUR1Qzs7QUFFN0M7QUFFQXBELE1BQUlYLElBQUosRUFBVTZHLEdBQVYsRUFBZUMsR0FBZixFQUFvQjtBQUNuQixVQUFNK0ssV0FBVyxLQUFLM08sS0FBTCxDQUFXNE8sV0FBWCxDQUF1QjlSLEtBQUt3RyxHQUE1QixFQUFpQ3hHLElBQWpDLENBQWpCOztBQUVBLFFBQUk7QUFDSCxZQUFNK1IsT0FBTzdSLE9BQU84UixTQUFQLENBQWlCN00sR0FBRzRNLElBQXBCLEVBQTBCRixRQUExQixDQUFiOztBQUVBLFVBQUlFLFFBQVFBLEtBQUtFLE1BQUwsRUFBWixFQUEyQjtBQUMxQmpTLGVBQU9pQixXQUFXd0ksY0FBWCxDQUEwQnpKLElBQTFCLENBQVA7QUFDQThHLFlBQUlHLFNBQUosQ0FBYyxxQkFBZCxFQUFzQyxnQ0FBZ0NDLG1CQUFtQmxILEtBQUsrRCxJQUF4QixDQUErQixFQUFyRztBQUNBK0MsWUFBSUcsU0FBSixDQUFjLGVBQWQsRUFBK0JqSCxLQUFLa1MsVUFBTCxDQUFnQkMsV0FBaEIsRUFBL0I7QUFDQXJMLFlBQUlHLFNBQUosQ0FBYyxjQUFkLEVBQThCakgsS0FBS00sSUFBbkM7QUFDQXdHLFlBQUlHLFNBQUosQ0FBYyxnQkFBZCxFQUFnQ2pILEtBQUtZLElBQXJDO0FBRUEsYUFBS3NDLEtBQUwsQ0FBVzJHLGFBQVgsQ0FBeUI3SixLQUFLd0csR0FBOUIsRUFBbUN4RyxJQUFuQyxFQUF5Q3lJLElBQXpDLENBQThDM0IsR0FBOUM7QUFDQTtBQUNELEtBWkQsQ0FZRSxPQUFPeEUsQ0FBUCxFQUFVO0FBQ1h3RSxVQUFJRSxTQUFKLENBQWMsR0FBZDtBQUNBRixVQUFJa0YsR0FBSjtBQUNBO0FBQ0E7QUFDRCxHQXhCNEM7O0FBMEI3Q0MsT0FBS2pNLElBQUwsRUFBV2tLLEdBQVgsRUFBZ0I7QUFDZixVQUFNMkgsV0FBVyxLQUFLM08sS0FBTCxDQUFXNE8sV0FBWCxDQUF1QjlSLEtBQUt3RyxHQUE1QixFQUFpQ3hHLElBQWpDLENBQWpCOztBQUNBLFFBQUk7QUFDSCxZQUFNK1IsT0FBTzdSLE9BQU84UixTQUFQLENBQWlCN00sR0FBRzRNLElBQXBCLEVBQTBCRixRQUExQixDQUFiOztBQUVBLFVBQUlFLFFBQVFBLEtBQUtFLE1BQUwsRUFBWixFQUEyQjtBQUMxQmpTLGVBQU9pQixXQUFXd0ksY0FBWCxDQUEwQnpKLElBQTFCLENBQVA7QUFFQSxhQUFLa0QsS0FBTCxDQUFXMkcsYUFBWCxDQUF5QjdKLEtBQUt3RyxHQUE5QixFQUFtQ3hHLElBQW5DLEVBQXlDeUksSUFBekMsQ0FBOEN5QixHQUE5QztBQUNBO0FBQ0QsS0FSRCxDQVFFLE9BQU81SCxDQUFQLEVBQVU7QUFDWDRILFVBQUk4QixHQUFKO0FBQ0E7QUFDQTtBQUNEOztBQXhDNEMsQ0FBcEIsQ0FBMUI7QUEyQ0EsTUFBTW9HLG9CQUFvQixJQUFJbE4sZUFBSixDQUFvQjtBQUM3Q25CLFFBQU0sb0JBRHVDOztBQUU3QztBQUVBcEQsTUFBSVgsSUFBSixFQUFVNkcsR0FBVixFQUFlQyxHQUFmLEVBQW9CO0FBQ25CLFVBQU0rSyxXQUFXLEtBQUszTyxLQUFMLENBQVc0TyxXQUFYLENBQXVCOVIsS0FBS3dHLEdBQTVCLEVBQWlDeEcsSUFBakMsQ0FBakI7O0FBRUEsUUFBSTtBQUNILFlBQU0rUixPQUFPN1IsT0FBTzhSLFNBQVAsQ0FBaUI3TSxHQUFHNE0sSUFBcEIsRUFBMEJGLFFBQTFCLENBQWI7O0FBRUEsVUFBSUUsUUFBUUEsS0FBS0UsTUFBTCxFQUFaLEVBQTJCO0FBQzFCalMsZUFBT2lCLFdBQVd3SSxjQUFYLENBQTBCekosSUFBMUIsQ0FBUDtBQUVBLGFBQUtrRCxLQUFMLENBQVcyRyxhQUFYLENBQXlCN0osS0FBS3dHLEdBQTlCLEVBQW1DeEcsSUFBbkMsRUFBeUN5SSxJQUF6QyxDQUE4QzNCLEdBQTlDO0FBQ0E7QUFDRCxLQVJELENBUUUsT0FBT3hFLENBQVAsRUFBVTtBQUNYd0UsVUFBSUUsU0FBSixDQUFjLEdBQWQ7QUFDQUYsVUFBSWtGLEdBQUo7QUFDQTtBQUNBO0FBQ0Q7O0FBcEI0QyxDQUFwQixDQUExQjtBQXVCQSxNQUFNcUcsMEJBQTBCLElBQUluTixlQUFKLENBQW9CO0FBQ25EbkIsUUFBTSwwQkFENkM7O0FBR25EcEQsTUFBSVgsSUFBSixFQUFVNkcsR0FBVixFQUFlQyxHQUFmLEVBQW9CO0FBQ25CLFVBQU0rSyxXQUFXLEtBQUszTyxLQUFMLENBQVc0TyxXQUFYLENBQXVCOVIsS0FBS3dHLEdBQTVCLEVBQWlDeEcsSUFBakMsQ0FBakI7O0FBRUEsUUFBSTtBQUNILFlBQU0rUixPQUFPN1IsT0FBTzhSLFNBQVAsQ0FBaUI3TSxHQUFHNE0sSUFBcEIsRUFBMEJGLFFBQTFCLENBQWI7O0FBRUEsVUFBSUUsUUFBUUEsS0FBS0UsTUFBTCxFQUFaLEVBQTJCO0FBQzFCalMsZUFBT2lCLFdBQVd3SSxjQUFYLENBQTBCekosSUFBMUIsQ0FBUDtBQUNBOEcsWUFBSUcsU0FBSixDQUFjLHFCQUFkLEVBQXNDLGdDQUFnQ0MsbUJBQW1CbEgsS0FBSytELElBQXhCLENBQStCLEVBQXJHO0FBQ0ErQyxZQUFJRyxTQUFKLENBQWMsZUFBZCxFQUErQmpILEtBQUtrUyxVQUFMLENBQWdCQyxXQUFoQixFQUEvQjtBQUNBckwsWUFBSUcsU0FBSixDQUFjLGNBQWQsRUFBOEJqSCxLQUFLTSxJQUFuQztBQUNBd0csWUFBSUcsU0FBSixDQUFjLGdCQUFkLEVBQWdDakgsS0FBS1ksSUFBckM7QUFFQSxhQUFLc0MsS0FBTCxDQUFXMkcsYUFBWCxDQUF5QjdKLEtBQUt3RyxHQUE5QixFQUFtQ3hHLElBQW5DLEVBQXlDeUksSUFBekMsQ0FBOEMzQixHQUE5QztBQUNBO0FBQ0QsS0FaRCxDQVlFLE9BQU94RSxDQUFQLEVBQVU7QUFDWHdFLFVBQUlFLFNBQUosQ0FBYyxHQUFkO0FBQ0FGLFVBQUlrRixHQUFKO0FBQ0E7QUFDQTtBQUNEOztBQXZCa0QsQ0FBcEIsQ0FBaEM7O0FBMEJBLE1BQU1zRyx3QkFBd0I3UCxFQUFFcU4sUUFBRixDQUFXLFlBQVc7QUFDbkQsUUFBTWpMLFVBQVU7QUFDZnFKLFVBQU05TixXQUFXTSxRQUFYLENBQW9CQyxHQUFwQixDQUF3QiwyQkFBeEIsQ0FEUyxDQUM0Qzs7QUFENUMsR0FBaEI7QUFJQWlSLG9CQUFrQjFPLEtBQWxCLEdBQTBCakMsV0FBVzRFLHFCQUFYLENBQWlDLE9BQWpDLEVBQTBDK0wsa0JBQWtCN04sSUFBNUQsRUFBa0VjLE9BQWxFLENBQTFCO0FBQ0F1TixvQkFBa0JsUCxLQUFsQixHQUEwQmpDLFdBQVc0RSxxQkFBWCxDQUFpQyxPQUFqQyxFQUEwQ3VNLGtCQUFrQnJPLElBQTVELEVBQWtFYyxPQUFsRSxDQUExQjtBQUNBd04sMEJBQXdCblAsS0FBeEIsR0FBZ0NqQyxXQUFXNEUscUJBQVgsQ0FBaUMsT0FBakMsRUFBMEN3TSx3QkFBd0J0TyxJQUFsRSxFQUF3RWMsT0FBeEUsQ0FBaEMsQ0FQbUQsQ0FTbkQ7O0FBQ0FuQyxXQUFTcUQsU0FBVCxHQUFxQixZQUFyQixJQUFxQ3JELFNBQVNxRCxTQUFULEdBQXFCNkwsa0JBQWtCN04sSUFBdkMsQ0FBckM7QUFDQSxDQVg2QixFQVczQixHQVgyQixDQUE5Qjs7QUFhQTNELFdBQVdNLFFBQVgsQ0FBb0JDLEdBQXBCLENBQXdCLDJCQUF4QixFQUFxRDJSLHFCQUFyRCxFOzs7Ozs7Ozs7OztBQy9HQSxJQUFJN1AsQ0FBSjs7QUFBTWhELE9BQU9DLEtBQVAsQ0FBYUMsUUFBUSxZQUFSLENBQWIsRUFBbUM7QUFBQ0MsVUFBUUMsQ0FBUixFQUFVO0FBQUM0QyxRQUFFNUMsQ0FBRjtBQUFJOztBQUFoQixDQUFuQyxFQUFxRCxDQUFyRDtBQUF3RCxJQUFJcUYsZUFBSjtBQUFvQnpGLE9BQU9DLEtBQVAsQ0FBYUMsUUFBUSxtQkFBUixDQUFiLEVBQTBDO0FBQUN1RixrQkFBZ0JyRixDQUFoQixFQUFrQjtBQUFDcUYsc0JBQWdCckYsQ0FBaEI7QUFBa0I7O0FBQXRDLENBQTFDLEVBQWtGLENBQWxGO0FBQXFGSixPQUFPQyxLQUFQLENBQWFDLFFBQVEsbUNBQVIsQ0FBYjtBQUEyRCxJQUFJd04sSUFBSjtBQUFTMU4sT0FBT0MsS0FBUCxDQUFhQyxRQUFRLE1BQVIsQ0FBYixFQUE2QjtBQUFDQyxVQUFRQyxDQUFSLEVBQVU7QUFBQ3NOLFdBQUt0TixDQUFMO0FBQU87O0FBQW5CLENBQTdCLEVBQWtELENBQWxEO0FBQXFELElBQUltUSxLQUFKO0FBQVV2USxPQUFPQyxLQUFQLENBQWFDLFFBQVEsT0FBUixDQUFiLEVBQThCO0FBQUNDLFVBQVFDLENBQVIsRUFBVTtBQUFDbVEsWUFBTW5RLENBQU47QUFBUTs7QUFBcEIsQ0FBOUIsRUFBb0QsQ0FBcEQ7O0FBUTFTLE1BQU1jLE1BQU0sVUFBU1gsSUFBVCxFQUFlNkcsR0FBZixFQUFvQkMsR0FBcEIsRUFBeUI7QUFDcEMsT0FBSzVELEtBQUwsQ0FBV2dOLGNBQVgsQ0FBMEJsUSxJQUExQixFQUFnQyxDQUFDc0UsR0FBRCxFQUFNMkwsT0FBTixLQUFrQjtBQUNqRCxRQUFJM0wsR0FBSixFQUFTO0FBQ1IwRSxjQUFRQyxLQUFSLENBQWMzRSxHQUFkO0FBQ0E7O0FBRUQsUUFBSTJMLE9BQUosRUFBYTtBQUNaLFlBQU1FLFlBQVluUSxLQUFLa0QsS0FBTCxDQUFXQyxLQUFYLENBQWlCLEdBQWpCLEVBQXNCQyxHQUF0QixFQUFsQjs7QUFDQSxVQUFJaEQsV0FBV00sUUFBWCxDQUFvQkMsR0FBcEIsQ0FBeUIsa0NBQWtDd1AsU0FBVyxFQUF0RSxDQUFKLEVBQThFO0FBQzdFLGNBQU1YLFVBQVUsVUFBVXBPLElBQVYsQ0FBZTZPLE9BQWYsSUFBMEJELEtBQTFCLEdBQWtDN0MsSUFBbEQ7QUFDQXFDLGdCQUFRN08sR0FBUixDQUFZc1AsT0FBWixFQUFxQkcsV0FBV0EsUUFBUTNILElBQVIsQ0FBYTNCLEdBQWIsQ0FBaEM7QUFDQSxPQUhELE1BR087QUFDTkEsWUFBSXVKLFlBQUosQ0FBaUIsZ0JBQWpCO0FBQ0F2SixZQUFJRyxTQUFKLENBQWMsVUFBZCxFQUEwQmdKLE9BQTFCO0FBQ0FuSixZQUFJRSxTQUFKLENBQWMsR0FBZDtBQUNBRixZQUFJa0YsR0FBSjtBQUNBO0FBQ0QsS0FYRCxNQVdPO0FBQ05sRixVQUFJa0YsR0FBSjtBQUNBO0FBQ0QsR0FuQkQ7QUFvQkEsQ0FyQkQ7O0FBdUJBLE1BQU1DLE9BQU8sVUFBU2pNLElBQVQsRUFBZWtLLEdBQWYsRUFBb0I7QUFDaEMsT0FBS2hILEtBQUwsQ0FBV2dOLGNBQVgsQ0FBMEJsUSxJQUExQixFQUFnQyxDQUFDc0UsR0FBRCxFQUFNMkwsT0FBTixLQUFrQjtBQUNqRCxRQUFJM0wsR0FBSixFQUFTO0FBQ1IwRSxjQUFRQyxLQUFSLENBQWMzRSxHQUFkO0FBQ0E7O0FBRUQsUUFBSTJMLE9BQUosRUFBYTtBQUNaLFlBQU1ULFVBQVUsVUFBVXBPLElBQVYsQ0FBZTZPLE9BQWYsSUFBMEJELEtBQTFCLEdBQWtDN0MsSUFBbEQ7QUFDQXFDLGNBQVE3TyxHQUFSLENBQVlzUCxPQUFaLEVBQXFCRyxXQUFXQSxRQUFRM0gsSUFBUixDQUFheUIsR0FBYixDQUFoQztBQUNBLEtBSEQsTUFHTztBQUNOQSxVQUFJOEIsR0FBSjtBQUNBO0FBQ0QsR0FYRDtBQVlBLENBYkQ7O0FBZUEsTUFBTXVHLDRCQUE0QixJQUFJck4sZUFBSixDQUFvQjtBQUNyRG5CLFFBQU0sNEJBRCtDO0FBRXJEcEQsS0FGcUQ7QUFHckRzTCxNQUhxRCxDQUlyRDs7QUFKcUQsQ0FBcEIsQ0FBbEM7QUFPQSxNQUFNdUcsNEJBQTRCLElBQUl0TixlQUFKLENBQW9CO0FBQ3JEbkIsUUFBTSw0QkFEK0M7QUFFckRwRCxLQUZxRDtBQUdyRHNMLE1BSHFELENBSXJEOztBQUpxRCxDQUFwQixDQUFsQztBQU9BLE1BQU13RyxrQ0FBa0MsSUFBSXZOLGVBQUosQ0FBb0I7QUFDM0RuQixRQUFNLGtDQURxRDtBQUUzRHBELEtBRjJEO0FBRzNEc0wsTUFIMkQsQ0FJM0Q7O0FBSjJELENBQXBCLENBQXhDOztBQU9BLE1BQU13RSxZQUFZaE8sRUFBRXFOLFFBQUYsQ0FBVyxZQUFXO0FBQ3ZDLFFBQU00QyxTQUFTdFMsV0FBV00sUUFBWCxDQUFvQkMsR0FBcEIsQ0FBd0IsaUNBQXhCLENBQWY7QUFDQSxRQUFNZ1MsV0FBV3ZTLFdBQVdNLFFBQVgsQ0FBb0JDLEdBQXBCLENBQXdCLG1DQUF4QixDQUFqQjtBQUNBLFFBQU1pUyxTQUFTeFMsV0FBV00sUUFBWCxDQUFvQkMsR0FBcEIsQ0FBd0IsaUNBQXhCLENBQWY7QUFDQSxRQUFNbVEsb0JBQW9CMVEsV0FBV00sUUFBWCxDQUFvQkMsR0FBcEIsQ0FBd0IsaUNBQXhCLENBQTFCOztBQUVBLE1BQUksQ0FBQytSLE1BQUQsSUFBVyxDQUFDQyxRQUFaLElBQXdCLENBQUNDLE1BQTdCLEVBQXFDO0FBQ3BDO0FBQ0E7O0FBRUQsUUFBTWpRLFNBQVM7QUFDZHdPLGdCQUFZO0FBQ1gwQixtQkFBYTtBQUNaQyxzQkFBY0gsUUFERjtBQUVaSSxxQkFBYUg7QUFGRDtBQURGLEtBREU7QUFPZEYsVUFQYztBQVFkNUI7QUFSYyxHQUFmO0FBV0F5Qiw0QkFBMEJyUCxLQUExQixHQUFrQ2pDLFdBQVc0RSxxQkFBWCxDQUFpQyxlQUFqQyxFQUFrRDBNLDBCQUEwQnhPLElBQTVFLEVBQWtGcEIsTUFBbEYsQ0FBbEM7QUFDQTZQLDRCQUEwQnRQLEtBQTFCLEdBQWtDakMsV0FBVzRFLHFCQUFYLENBQWlDLGVBQWpDLEVBQWtEMk0sMEJBQTBCek8sSUFBNUUsRUFBa0ZwQixNQUFsRixDQUFsQztBQUNBOFAsa0NBQWdDdlAsS0FBaEMsR0FBd0NqQyxXQUFXNEUscUJBQVgsQ0FBaUMsZUFBakMsRUFBa0Q0TSxnQ0FBZ0MxTyxJQUFsRixFQUF3RnBCLE1BQXhGLENBQXhDO0FBQ0EsQ0F4QmlCLEVBd0JmLEdBeEJlLENBQWxCOztBQTBCQXZDLFdBQVdNLFFBQVgsQ0FBb0JDLEdBQXBCLENBQXdCLDRCQUF4QixFQUFzRDhQLFNBQXRELEU7Ozs7Ozs7Ozs7O0FDN0ZBLElBQUlyTCxNQUFKO0FBQVczRixPQUFPQyxLQUFQLENBQWFDLFFBQVEsUUFBUixDQUFiLEVBQStCO0FBQUNDLFVBQVFDLENBQVIsRUFBVTtBQUFDdUYsYUFBT3ZGLENBQVA7QUFBUzs7QUFBckIsQ0FBL0IsRUFBc0QsQ0FBdEQ7QUFBeUQsSUFBSW1ULElBQUo7QUFBU3ZULE9BQU9DLEtBQVAsQ0FBYUMsUUFBUSxNQUFSLENBQWIsRUFBNkI7QUFBQ0MsVUFBUUMsQ0FBUixFQUFVO0FBQUNtVCxXQUFLblQsQ0FBTDtBQUFPOztBQUFuQixDQUE3QixFQUFrRCxDQUFsRDtBQUFxRCxJQUFJb1QsSUFBSjtBQUFTeFQsT0FBT0MsS0FBUCxDQUFhQyxRQUFRLE1BQVIsQ0FBYixFQUE2QjtBQUFDQyxVQUFRQyxDQUFSLEVBQVU7QUFBQ29ULFdBQUtwVCxDQUFMO0FBQU87O0FBQW5CLENBQTdCLEVBQWtELENBQWxEO0FBQXFELElBQUlxRixlQUFKO0FBQW9CekYsT0FBT0MsS0FBUCxDQUFhQyxRQUFRLG1CQUFSLENBQWIsRUFBMEM7QUFBQ3VGLGtCQUFnQnJGLENBQWhCLEVBQWtCO0FBQUNxRixzQkFBZ0JyRixDQUFoQjtBQUFrQjs7QUFBdEMsQ0FBMUMsRUFBa0YsQ0FBbEY7QUFPcE4sTUFBTXdOLFNBQVMsSUFBSUMsTUFBSixDQUFXLFlBQVgsQ0FBZjs7QUFFQSxTQUFTNEYsWUFBVCxDQUFzQnJPLE9BQXRCLEVBQStCO0FBQzlCLE1BQUksRUFBRSxnQkFBZ0JxTyxZQUFsQixDQUFKLEVBQXFDO0FBQ3BDLFdBQU8sSUFBSUEsWUFBSixDQUFpQnJPLE9BQWpCLENBQVA7QUFDQTs7QUFFRCxPQUFLYixLQUFMLEdBQWFhLFFBQVFiLEtBQXJCO0FBQ0EsT0FBS2dCLElBQUwsR0FBWUgsUUFBUUcsSUFBcEI7QUFDQSxPQUFLbU8sVUFBTCxHQUFrQixDQUFsQjtBQUVBL04sU0FBT2dPLFNBQVAsQ0FBaUJsRyxJQUFqQixDQUFzQixJQUF0QixFQUE0QnJJLE9BQTVCO0FBQ0E7O0FBQ0RvTyxLQUFLSSxRQUFMLENBQWNILFlBQWQsRUFBNEI5TixPQUFPZ08sU0FBbkM7O0FBR0FGLGFBQWFJLFNBQWIsQ0FBdUJDLFVBQXZCLEdBQW9DLFVBQVNDLEtBQVQsRUFBZ0JDLEdBQWhCLEVBQXFCL0csRUFBckIsRUFBeUI7QUFDNUQsTUFBSSxLQUFLeUcsVUFBTCxHQUFrQixLQUFLbk8sSUFBM0IsRUFBaUM7QUFDaEM7QUFDQSxTQUFLZ0gsR0FBTDtBQUNBLEdBSEQsTUFHTyxJQUFJLEtBQUttSCxVQUFMLEdBQWtCSyxNQUFNbkYsTUFBeEIsR0FBaUMsS0FBS3JLLEtBQTFDLEVBQWlELENBQ3ZEO0FBQ0EsR0FGTSxNQUVBO0FBQ04sUUFBSUEsS0FBSjtBQUNBLFFBQUlnQixJQUFKOztBQUVBLFFBQUksS0FBS2hCLEtBQUwsSUFBYyxLQUFLbVAsVUFBdkIsRUFBbUM7QUFDbENuUCxjQUFRLENBQVI7QUFDQSxLQUZELE1BRU87QUFDTkEsY0FBUSxLQUFLQSxLQUFMLEdBQWEsS0FBS21QLFVBQTFCO0FBQ0E7O0FBQ0QsUUFBSyxLQUFLbk8sSUFBTCxHQUFZLEtBQUttTyxVQUFqQixHQUE4QixDQUEvQixHQUFvQ0ssTUFBTW5GLE1BQTlDLEVBQXNEO0FBQ3JEckosYUFBTyxLQUFLQSxJQUFMLEdBQVksS0FBS21PLFVBQWpCLEdBQThCLENBQXJDO0FBQ0EsS0FGRCxNQUVPO0FBQ05uTyxhQUFPd08sTUFBTW5GLE1BQWI7QUFDQTs7QUFDRCxVQUFNcUYsV0FBV0YsTUFBTUcsS0FBTixDQUFZM1AsS0FBWixFQUFtQmdCLElBQW5CLENBQWpCO0FBQ0EsU0FBSzRPLElBQUwsQ0FBVUYsUUFBVjtBQUNBOztBQUNELE9BQUtQLFVBQUwsSUFBbUJLLE1BQU1uRixNQUF6QjtBQUNBM0I7QUFDQSxDQXpCRDs7QUE0QkEsTUFBTW1ILGVBQWUsVUFBU0MsTUFBVCxFQUFpQjtBQUNyQyxNQUFJQSxNQUFKLEVBQVk7QUFDWCxVQUFNQyxVQUFVRCxPQUFPdkYsS0FBUCxDQUFhLGFBQWIsQ0FBaEI7O0FBQ0EsUUFBSXdGLE9BQUosRUFBYTtBQUNaLGFBQU87QUFDTi9QLGVBQU8zQixTQUFTMFIsUUFBUSxDQUFSLENBQVQsRUFBcUIsRUFBckIsQ0FERDtBQUVOL08sY0FBTTNDLFNBQVMwUixRQUFRLENBQVIsQ0FBVCxFQUFxQixFQUFyQjtBQUZBLE9BQVA7QUFJQTtBQUNEOztBQUNELFNBQU8sSUFBUDtBQUNBLENBWEQsQyxDQWFBOzs7QUFDQSxNQUFNQyxpQkFBaUIsVUFBU0MsU0FBVCxFQUFvQnJOLE1BQXBCLEVBQTRCNUcsSUFBNUIsRUFBa0M2RyxHQUFsQyxFQUF1Q0MsR0FBdkMsRUFBNEM7QUFDbEUsUUFBTTVELFFBQVFSLFNBQVNpSCxRQUFULENBQWtCc0ssU0FBbEIsQ0FBZDtBQUNBLFFBQU1DLEtBQUtoUixNQUFNMkcsYUFBTixDQUFvQmpELE1BQXBCLEVBQTRCNUcsSUFBNUIsQ0FBWDtBQUNBLFFBQU1tVSxLQUFLLElBQUkvTyxPQUFPZ1AsV0FBWCxFQUFYO0FBRUEsR0FBQ0YsRUFBRCxFQUFLQyxFQUFMLEVBQVNFLE9BQVQsQ0FBaUJqUCxVQUFVQSxPQUFPa1AsRUFBUCxDQUFVLE9BQVYsRUFBbUIsVUFBU2hRLEdBQVQsRUFBYztBQUMzRHBCLFVBQU1xUixXQUFOLENBQWtCckgsSUFBbEIsQ0FBdUJoSyxLQUF2QixFQUE4Qm9CLEdBQTlCLEVBQW1Dc0MsTUFBbkMsRUFBMkM1RyxJQUEzQztBQUNBOEcsUUFBSWtGLEdBQUo7QUFDQSxHQUgwQixDQUEzQjtBQUtBbUksS0FBR0csRUFBSCxDQUFNLE9BQU4sRUFBZSxZQUFXO0FBQ3pCO0FBQ0FILE9BQUdLLElBQUgsQ0FBUSxLQUFSO0FBQ0EsR0FIRDtBQUtBLFFBQU1DLFNBQVM1TixJQUFJcUUsT0FBSixDQUFZLGlCQUFaLEtBQWtDLEVBQWpELENBZmtFLENBaUJsRTs7QUFDQWhJLFFBQU13UixhQUFOLENBQW9CUixFQUFwQixFQUF3QkMsRUFBeEIsRUFBNEJ2TixNQUE1QixFQUFvQzVHLElBQXBDLEVBQTBDNkcsR0FBMUM7QUFDQSxRQUFNOE4sUUFBUWQsYUFBYWhOLElBQUlxRSxPQUFKLENBQVl5SixLQUF6QixDQUFkO0FBQ0EsTUFBSUMsZUFBZSxLQUFuQjs7QUFDQSxNQUFJRCxLQUFKLEVBQVc7QUFDVkMsbUJBQWdCRCxNQUFNM1EsS0FBTixHQUFjaEUsS0FBS1ksSUFBcEIsSUFBOEIrVCxNQUFNM1AsSUFBTixJQUFjMlAsTUFBTTNRLEtBQWxELElBQTZEMlEsTUFBTTNQLElBQU4sR0FBYWhGLEtBQUtZLElBQTlGO0FBQ0EsR0F2QmlFLENBeUJsRTs7O0FBQ0EsTUFBSTZULE9BQU9sRyxLQUFQLENBQWEsVUFBYixLQUE0Qm9HLFVBQVUsSUFBMUMsRUFBZ0Q7QUFDL0M3TixRQUFJRyxTQUFKLENBQWMsa0JBQWQsRUFBa0MsTUFBbEM7QUFDQUgsUUFBSXVKLFlBQUosQ0FBaUIsZ0JBQWpCO0FBQ0F2SixRQUFJRSxTQUFKLENBQWMsR0FBZDtBQUNBbU4sT0FBRzFMLElBQUgsQ0FBUXVLLEtBQUs2QixVQUFMLEVBQVIsRUFBMkJwTSxJQUEzQixDQUFnQzNCLEdBQWhDO0FBQ0EsR0FMRCxNQUtPLElBQUkyTixPQUFPbEcsS0FBUCxDQUFhLGFBQWIsS0FBK0JvRyxVQUFVLElBQTdDLEVBQW1EO0FBQ3pEO0FBQ0E3TixRQUFJRyxTQUFKLENBQWMsa0JBQWQsRUFBa0MsU0FBbEM7QUFDQUgsUUFBSXVKLFlBQUosQ0FBaUIsZ0JBQWpCO0FBQ0F2SixRQUFJRSxTQUFKLENBQWMsR0FBZDtBQUNBbU4sT0FBRzFMLElBQUgsQ0FBUXVLLEtBQUs4QixhQUFMLEVBQVIsRUFBOEJyTSxJQUE5QixDQUFtQzNCLEdBQW5DO0FBQ0EsR0FOTSxNQU1BLElBQUk2TixTQUFTQyxZQUFiLEVBQTJCO0FBQ2pDO0FBQ0E5TixRQUFJdUosWUFBSixDQUFpQixnQkFBakI7QUFDQXZKLFFBQUl1SixZQUFKLENBQWlCLGNBQWpCO0FBQ0F2SixRQUFJdUosWUFBSixDQUFpQixxQkFBakI7QUFDQXZKLFFBQUl1SixZQUFKLENBQWlCLGVBQWpCO0FBQ0F2SixRQUFJRyxTQUFKLENBQWMsZUFBZCxFQUFnQyxXQUFXakgsS0FBS1ksSUFBTSxFQUF0RDtBQUNBa0csUUFBSUUsU0FBSixDQUFjLEdBQWQ7QUFDQUYsUUFBSWtGLEdBQUo7QUFDQSxHQVRNLE1BU0EsSUFBSTJJLEtBQUosRUFBVztBQUNqQjdOLFFBQUlHLFNBQUosQ0FBYyxlQUFkLEVBQWdDLFNBQVMwTixNQUFNM1EsS0FBTyxJQUFJMlEsTUFBTTNQLElBQU0sSUFBSWhGLEtBQUtZLElBQU0sRUFBckY7QUFDQWtHLFFBQUl1SixZQUFKLENBQWlCLGdCQUFqQjtBQUNBdkosUUFBSUcsU0FBSixDQUFjLGdCQUFkLEVBQWdDME4sTUFBTTNQLElBQU4sR0FBYTJQLE1BQU0zUSxLQUFuQixHQUEyQixDQUEzRDtBQUNBOEMsUUFBSUUsU0FBSixDQUFjLEdBQWQ7QUFDQXFHLFdBQU9TLEtBQVAsQ0FBYSw4QkFBYjtBQUNBcUcsT0FBRzFMLElBQUgsQ0FBUSxJQUFJeUssWUFBSixDQUFpQjtBQUFFbFAsYUFBTzJRLE1BQU0zUSxLQUFmO0FBQXNCZ0IsWUFBTTJQLE1BQU0zUDtBQUFsQyxLQUFqQixDQUFSLEVBQW9FeUQsSUFBcEUsQ0FBeUUzQixHQUF6RTtBQUNBLEdBUE0sTUFPQTtBQUNOQSxRQUFJRSxTQUFKLENBQWMsR0FBZDtBQUNBbU4sT0FBRzFMLElBQUgsQ0FBUTNCLEdBQVI7QUFDQTtBQUNELENBekREOztBQTJEQSxNQUFNaU8saUJBQWlCLFVBQVNkLFNBQVQsRUFBb0JyTixNQUFwQixFQUE0QjVHLElBQTVCLEVBQWtDa0ssR0FBbEMsRUFBdUM7QUFDN0QsUUFBTWhILFFBQVFSLFNBQVNpSCxRQUFULENBQWtCc0ssU0FBbEIsQ0FBZDtBQUNBLFFBQU1DLEtBQUtoUixNQUFNMkcsYUFBTixDQUFvQmpELE1BQXBCLEVBQTRCNUcsSUFBNUIsQ0FBWDtBQUVBLEdBQUNrVSxFQUFELEVBQUtoSyxHQUFMLEVBQVVtSyxPQUFWLENBQWtCalAsVUFBVUEsT0FBT2tQLEVBQVAsQ0FBVSxPQUFWLEVBQW1CLFVBQVNoUSxHQUFULEVBQWM7QUFDNURwQixVQUFNcVIsV0FBTixDQUFrQnJILElBQWxCLENBQXVCaEssS0FBdkIsRUFBOEJvQixHQUE5QixFQUFtQ3NDLE1BQW5DLEVBQTJDNUcsSUFBM0M7QUFDQWtLLFFBQUk4QixHQUFKO0FBQ0EsR0FIMkIsQ0FBNUI7QUFLQWtJLEtBQUd6TCxJQUFILENBQVF5QixHQUFSO0FBQ0EsQ0FWRDs7QUFZQWpKLFdBQVc0RSxxQkFBWCxDQUFpQyxRQUFqQyxFQUEyQyxnQkFBM0MsRUFBNkQ7QUFDNURtUCxrQkFBZ0I7QUFENEMsQ0FBN0Q7QUFJQS9ULFdBQVc0RSxxQkFBWCxDQUFpQyxRQUFqQyxFQUEyQyxzQkFBM0MsRUFBbUU7QUFDbEVtUCxrQkFBZ0I7QUFEa0QsQ0FBbkUsRSxDQUlBOztBQUNBdFMsU0FBU3FELFNBQVQsR0FBcUIsb0JBQXJCLElBQTZDckQsU0FBU3FELFNBQVQsR0FBcUIsZ0JBQXJCLENBQTdDO0FBRUE5RSxXQUFXNEUscUJBQVgsQ0FBaUMsUUFBakMsRUFBMkMsZ0JBQTNDLEVBQTZEO0FBQzVEbVAsa0JBQWdCO0FBRDRDLENBQTdEO0FBS0EsSUFBSTlQLGVBQUosQ0FBb0I7QUFDbkJuQixRQUFNLGdCQURhOztBQUduQnBELE1BQUlYLElBQUosRUFBVTZHLEdBQVYsRUFBZUMsR0FBZixFQUFvQjtBQUNuQjlHLFdBQU9pQixXQUFXd0ksY0FBWCxDQUEwQnpKLElBQTFCLENBQVA7QUFFQThHLFFBQUlHLFNBQUosQ0FBYyxxQkFBZCxFQUFzQyxnQ0FBZ0NDLG1CQUFtQmxILEtBQUsrRCxJQUF4QixDQUErQixFQUFyRztBQUNBK0MsUUFBSUcsU0FBSixDQUFjLGVBQWQsRUFBK0JqSCxLQUFLa1MsVUFBTCxDQUFnQkMsV0FBaEIsRUFBL0I7QUFDQXJMLFFBQUlHLFNBQUosQ0FBYyxjQUFkLEVBQThCakgsS0FBS00sSUFBbkM7QUFDQXdHLFFBQUlHLFNBQUosQ0FBYyxnQkFBZCxFQUFnQ2pILEtBQUtZLElBQXJDO0FBRUEsV0FBT29ULGVBQWVoVSxLQUFLa0QsS0FBcEIsRUFBMkJsRCxLQUFLd0csR0FBaEMsRUFBcUN4RyxJQUFyQyxFQUEyQzZHLEdBQTNDLEVBQWdEQyxHQUFoRCxDQUFQO0FBQ0EsR0Faa0I7O0FBY25CbUYsT0FBS2pNLElBQUwsRUFBV2tLLEdBQVgsRUFBZ0I7QUFDZjZLLG1CQUFlL1UsS0FBS2tELEtBQXBCLEVBQTJCbEQsS0FBS3dHLEdBQWhDLEVBQXFDeEcsSUFBckMsRUFBMkNrSyxHQUEzQztBQUNBOztBQWhCa0IsQ0FBcEI7QUFtQkEsSUFBSWhGLGVBQUosQ0FBb0I7QUFDbkJuQixRQUFNLHNCQURhOztBQUduQnBELE1BQUlYLElBQUosRUFBVTZHLEdBQVYsRUFBZUMsR0FBZixFQUFvQjtBQUNuQjlHLFdBQU9pQixXQUFXd0ksY0FBWCxDQUEwQnpKLElBQTFCLENBQVA7QUFFQThHLFFBQUlHLFNBQUosQ0FBYyxxQkFBZCxFQUFzQyxnQ0FBZ0NDLG1CQUFtQmxILEtBQUsrRCxJQUF4QixDQUErQixFQUFyRztBQUNBK0MsUUFBSUcsU0FBSixDQUFjLGVBQWQsRUFBK0JqSCxLQUFLa1MsVUFBTCxDQUFnQkMsV0FBaEIsRUFBL0I7QUFDQXJMLFFBQUlHLFNBQUosQ0FBYyxjQUFkLEVBQThCakgsS0FBS00sSUFBbkM7QUFDQXdHLFFBQUlHLFNBQUosQ0FBYyxnQkFBZCxFQUFnQ2pILEtBQUtZLElBQXJDO0FBRUEsV0FBT29ULGVBQWVoVSxLQUFLa0QsS0FBcEIsRUFBMkJsRCxLQUFLd0csR0FBaEMsRUFBcUN4RyxJQUFyQyxFQUEyQzZHLEdBQTNDLEVBQWdEQyxHQUFoRCxDQUFQO0FBQ0EsR0Faa0I7O0FBY25CbUYsT0FBS2pNLElBQUwsRUFBV2tLLEdBQVgsRUFBZ0I7QUFDZjZLLG1CQUFlL1UsS0FBS2tELEtBQXBCLEVBQTJCbEQsS0FBS3dHLEdBQWhDLEVBQXFDeEcsSUFBckMsRUFBMkNrSyxHQUEzQztBQUNBOztBQWhCa0IsQ0FBcEI7QUFtQkEsSUFBSWhGLGVBQUosQ0FBb0I7QUFDbkJuQixRQUFNLGdCQURhOztBQUduQnBELE1BQUlYLElBQUosRUFBVTZHLEdBQVYsRUFBZUMsR0FBZixFQUFvQjtBQUNuQjlHLFdBQU9pQixXQUFXd0ksY0FBWCxDQUEwQnpKLElBQTFCLENBQVA7QUFFQSxXQUFPZ1UsZUFBZWhVLEtBQUtrRCxLQUFwQixFQUEyQmxELEtBQUt3RyxHQUFoQyxFQUFxQ3hHLElBQXJDLEVBQTJDNkcsR0FBM0MsRUFBZ0RDLEdBQWhELENBQVA7QUFDQTs7QUFQa0IsQ0FBcEIsRTs7Ozs7Ozs7Ozs7QUM5TEEsSUFBSXJFLENBQUo7O0FBQU1oRCxPQUFPQyxLQUFQLENBQWFDLFFBQVEsWUFBUixDQUFiLEVBQW1DO0FBQUNDLFVBQVFDLENBQVIsRUFBVTtBQUFDNEMsUUFBRTVDLENBQUY7QUFBSTs7QUFBaEIsQ0FBbkMsRUFBcUQsQ0FBckQ7O0FBR04sTUFBTW9WLHFCQUFxQnhTLEVBQUVxTixRQUFGLENBQVcsTUFBTTtBQUMzQyxRQUFNeFAsT0FBT0YsV0FBV00sUUFBWCxDQUFvQkMsR0FBcEIsQ0FBd0IseUJBQXhCLENBQWI7QUFDQSxRQUFNK1IsU0FBU3RTLFdBQVdNLFFBQVgsQ0FBb0JDLEdBQXBCLENBQXdCLHNCQUF4QixDQUFmO0FBQ0EsUUFBTXVVLE1BQU05VSxXQUFXTSxRQUFYLENBQW9CQyxHQUFwQixDQUF3QixtQkFBeEIsQ0FBWjtBQUNBLFFBQU13VSxZQUFZL1UsV0FBV00sUUFBWCxDQUFvQkMsR0FBcEIsQ0FBd0IsOEJBQXhCLENBQWxCO0FBQ0EsUUFBTXlVLFlBQVloVixXQUFXTSxRQUFYLENBQW9CQyxHQUFwQixDQUF3QixrQ0FBeEIsQ0FBbEI7QUFDQSxRQUFNMFUsTUFBTWpWLFdBQVdNLFFBQVgsQ0FBb0JDLEdBQXBCLENBQXdCLG1CQUF4QixDQUFaO0FBQ0EsUUFBTStRLFNBQVN0UixXQUFXTSxRQUFYLENBQW9CQyxHQUFwQixDQUF3QixzQkFBeEIsQ0FBZjtBQUNBLFFBQU0yVSxZQUFZbFYsV0FBV00sUUFBWCxDQUFvQkMsR0FBcEIsQ0FBd0IseUJBQXhCLENBQWxCO0FBRUEsU0FBT0ksVUFBVXdVLFdBQVYsQ0FBc0Isb0JBQXRCLENBQVA7O0FBRUEsTUFBSWpWLFNBQVMsVUFBVCxJQUF1QixDQUFDbUMsRUFBRStTLE9BQUYsQ0FBVTlDLE1BQVYsQ0FBeEIsSUFBNkMsQ0FBQ2pRLEVBQUUrUyxPQUFGLENBQVVMLFNBQVYsQ0FBOUMsSUFBc0UsQ0FBQzFTLEVBQUUrUyxPQUFGLENBQVVKLFNBQVYsQ0FBM0UsRUFBaUc7QUFDaEcsUUFBSXJVLFVBQVV3VSxXQUFWLENBQXNCLG9CQUF0QixDQUFKLEVBQWlEO0FBQ2hELGFBQU94VSxVQUFVd1UsV0FBVixDQUFzQixvQkFBdEIsQ0FBUDtBQUNBOztBQUNELFVBQU01UyxTQUFTO0FBQ2QrUCxZQURjOztBQUVkdlEsVUFBSW5DLElBQUosRUFBVXlWLFdBQVYsRUFBdUI7QUFDdEIsY0FBTTlSLEtBQUtDLE9BQU9ELEVBQVAsRUFBWDtBQUNBLGNBQU11SyxPQUFRLEdBQUc5TixXQUFXTSxRQUFYLENBQW9CQyxHQUFwQixDQUF3QixVQUF4QixDQUFxQyxZQUFZOFUsWUFBWXBVLEdBQUssSUFBSSxLQUFLcEIsTUFBUSxJQUFJMEQsRUFBSSxFQUE1RztBQUVBLGNBQU0rUixTQUFTO0FBQ2RsUCxlQUFLN0MsRUFEUztBQUVkdEMsZUFBS29VLFlBQVlwVSxHQUZIO0FBR2RzVSxvQkFBVTtBQUNUekg7QUFEUztBQUhJLFNBQWY7QUFRQTlOLG1CQUFXcUIsTUFBWCxDQUFrQnlFLE9BQWxCLENBQTBCMFAsY0FBMUIsQ0FBeUMsS0FBSzNWLE1BQTlDLEVBQXNELGtCQUF0RCxFQUEwRUQsSUFBMUUsRUFBZ0YwVixNQUFoRjtBQUVBLGVBQU94SCxJQUFQO0FBQ0EsT0FqQmE7O0FBa0JkMEMsc0JBQWdCdUUsU0FsQkY7QUFtQmR0RSwwQkFBb0J1RTtBQW5CTixLQUFmOztBQXNCQSxRQUFJLENBQUMzUyxFQUFFK1MsT0FBRixDQUFVTixHQUFWLENBQUwsRUFBcUI7QUFDcEJ2UyxhQUFPdVMsR0FBUCxHQUFhQSxHQUFiO0FBQ0E7O0FBRUQsUUFBSSxDQUFDelMsRUFBRStTLE9BQUYsQ0FBVUgsR0FBVixDQUFMLEVBQXFCO0FBQ3BCMVMsYUFBTzBTLEdBQVAsR0FBYUEsR0FBYjtBQUNBOztBQUVELFFBQUksQ0FBQzVTLEVBQUUrUyxPQUFGLENBQVU5RCxNQUFWLENBQUwsRUFBd0I7QUFDdkIvTyxhQUFPK08sTUFBUCxHQUFnQkEsTUFBaEI7QUFDQTs7QUFFRCxRQUFJLENBQUNqUCxFQUFFK1MsT0FBRixDQUFVRixTQUFWLENBQUwsRUFBMkI7QUFDMUIzUyxhQUFPMlMsU0FBUCxHQUFtQkEsU0FBbkI7QUFDQTs7QUFFRCxRQUFJO0FBQ0h2VSxnQkFBVThVLGVBQVYsQ0FBMEIsb0JBQTFCLEVBQWdEOVUsVUFBVStVLFNBQTFELEVBQXFFblQsTUFBckU7QUFDQSxLQUZELENBRUUsT0FBT0wsQ0FBUCxFQUFVO0FBQ1gwRyxjQUFRQyxLQUFSLENBQWMseUJBQWQsRUFBeUMzRyxFQUFFeVQsT0FBM0M7QUFDQTtBQUNEO0FBQ0QsQ0E1RDBCLEVBNER4QixHQTVEd0IsQ0FBM0I7O0FBOERBM1YsV0FBV00sUUFBWCxDQUFvQkMsR0FBcEIsQ0FBd0IseUJBQXhCLEVBQW1Ec1Usa0JBQW5EO0FBQ0E3VSxXQUFXTSxRQUFYLENBQW9CQyxHQUFwQixDQUF3QixpQkFBeEIsRUFBMkNzVSxrQkFBM0M7O0FBSUEsTUFBTWUsK0JBQStCdlQsRUFBRXFOLFFBQUYsQ0FBVyxNQUFNO0FBQ3JELFFBQU14UCxPQUFPRixXQUFXTSxRQUFYLENBQW9CQyxHQUFwQixDQUF3Qix5QkFBeEIsQ0FBYjtBQUNBLFFBQU0rUixTQUFTdFMsV0FBV00sUUFBWCxDQUFvQkMsR0FBcEIsQ0FBd0IsaUNBQXhCLENBQWY7QUFDQSxRQUFNZ1MsV0FBV3ZTLFdBQVdNLFFBQVgsQ0FBb0JDLEdBQXBCLENBQXdCLG1DQUF4QixDQUFqQjtBQUNBLFFBQU1pUyxTQUFTeFMsV0FBV00sUUFBWCxDQUFvQkMsR0FBcEIsQ0FBd0IsaUNBQXhCLENBQWY7QUFFQSxTQUFPSSxVQUFVd1UsV0FBVixDQUFzQix1QkFBdEIsQ0FBUDs7QUFFQSxNQUFJalYsU0FBUyxvQkFBVCxJQUFpQyxDQUFDbUMsRUFBRStTLE9BQUYsQ0FBVTVDLE1BQVYsQ0FBbEMsSUFBdUQsQ0FBQ25RLEVBQUUrUyxPQUFGLENBQVU3QyxRQUFWLENBQXhELElBQStFLENBQUNsUSxFQUFFK1MsT0FBRixDQUFVOUMsTUFBVixDQUFwRixFQUF1RztBQUN0RyxRQUFJM1IsVUFBVXdVLFdBQVYsQ0FBc0IsdUJBQXRCLENBQUosRUFBb0Q7QUFDbkQsYUFBT3hVLFVBQVV3VSxXQUFWLENBQXNCLHVCQUF0QixDQUFQO0FBQ0E7O0FBRUQsVUFBTTVTLFNBQVM7QUFDZCtQLFlBRGM7QUFFZHVELHNCQUFnQnRELFFBRkY7QUFHZHVELHVCQUFpQnRELE1BSEg7O0FBSWR6USxVQUFJbkMsSUFBSixFQUFVeVYsV0FBVixFQUF1QjtBQUN0QixjQUFNOVIsS0FBS0MsT0FBT0QsRUFBUCxFQUFYO0FBQ0EsY0FBTXVLLE9BQVEsR0FBRzlOLFdBQVdNLFFBQVgsQ0FBb0JDLEdBQXBCLENBQXdCLFVBQXhCLENBQXFDLFlBQVk4VSxZQUFZcFUsR0FBSyxJQUFJLEtBQUtwQixNQUFRLElBQUkwRCxFQUFJLEVBQTVHO0FBRUEsY0FBTStSLFNBQVM7QUFDZGxQLGVBQUs3QyxFQURTO0FBRWR0QyxlQUFLb1UsWUFBWXBVLEdBRkg7QUFHZDhVLHlCQUFlO0FBQ2RqSTtBQURjO0FBSEQsU0FBZjtBQVFBOU4sbUJBQVdxQixNQUFYLENBQWtCeUUsT0FBbEIsQ0FBMEIwUCxjQUExQixDQUF5QyxLQUFLM1YsTUFBOUMsRUFBc0QsNEJBQXRELEVBQW9GRCxJQUFwRixFQUEwRjBWLE1BQTFGO0FBRUEsZUFBT3hILElBQVA7QUFDQTs7QUFuQmEsS0FBZjs7QUFzQkEsUUFBSTtBQUNIbk4sZ0JBQVU4VSxlQUFWLENBQTBCLHVCQUExQixFQUFtRDlVLFVBQVVxVixXQUE3RCxFQUEwRXpULE1BQTFFO0FBQ0EsS0FGRCxDQUVFLE9BQU9MLENBQVAsRUFBVTtBQUNYMEcsY0FBUUMsS0FBUixDQUFjLHlDQUFkLEVBQXlEM0csRUFBRXlULE9BQTNEO0FBQ0E7QUFDRDtBQUNELENBekNvQyxFQXlDbEMsR0F6Q2tDLENBQXJDOztBQTJDQTNWLFdBQVdNLFFBQVgsQ0FBb0JDLEdBQXBCLENBQXdCLHlCQUF4QixFQUFtRHFWLDRCQUFuRDtBQUNBNVYsV0FBV00sUUFBWCxDQUFvQkMsR0FBcEIsQ0FBd0IsNEJBQXhCLEVBQXNEcVYsNEJBQXRELEU7Ozs7Ozs7Ozs7O0FDbEhBLElBQUl2VCxDQUFKOztBQUFNaEQsT0FBT0MsS0FBUCxDQUFhQyxRQUFRLFlBQVIsQ0FBYixFQUFtQztBQUFDQyxVQUFRQyxDQUFSLEVBQVU7QUFBQzRDLFFBQUU1QyxDQUFGO0FBQUk7O0FBQWhCLENBQW5DLEVBQXFELENBQXJEO0FBRU5LLE9BQU9tVyxPQUFQLENBQWU7QUFDUixtQkFBTixDQUF3QkMsTUFBeEIsRUFBZ0NwVCxLQUFoQyxFQUF1Q2xELElBQXZDLEVBQTZDdVcsVUFBVSxFQUF2RDtBQUFBLG9DQUEyRDtBQUMxRCxVQUFJLENBQUNyVyxPQUFPRCxNQUFQLEVBQUwsRUFBc0I7QUFDckIsY0FBTSxJQUFJQyxPQUFPQyxLQUFYLENBQWlCLG9CQUFqQixFQUF1QyxjQUF2QyxFQUF1RDtBQUFFNE4sa0JBQVE7QUFBVixTQUF2RCxDQUFOO0FBQ0E7O0FBRUQsWUFBTXZNLE9BQU90QixPQUFPZ04sSUFBUCxDQUFZLGVBQVosRUFBNkJvSixNQUE3QixFQUFxQ3BXLE9BQU9ELE1BQVAsRUFBckMsQ0FBYjs7QUFFQSxVQUFJLENBQUN1QixJQUFMLEVBQVc7QUFDVixlQUFPLEtBQVA7QUFDQTs7QUFFRG9MLFlBQU0ySixPQUFOLEVBQWU7QUFDZEMsZ0JBQVFyVixNQUFNc1YsUUFBTixDQUFlblYsTUFBZixDQURNO0FBRWRvVixlQUFPdlYsTUFBTXNWLFFBQU4sQ0FBZW5WLE1BQWYsQ0FGTztBQUdkcVYsZUFBT3hWLE1BQU1zVixRQUFOLENBQWVuVixNQUFmLENBSE87QUFJZHNWLG1CQUFXelYsTUFBTXNWLFFBQU4sQ0FBZUksT0FBZixDQUpHO0FBS2RDLGFBQUszVixNQUFNc1YsUUFBTixDQUFlblYsTUFBZjtBQUxTLE9BQWY7QUFRQWxCLGlCQUFXcUIsTUFBWCxDQUFrQnlFLE9BQWxCLENBQTBCNlEsa0JBQTFCLENBQTZDL1csS0FBS3dHLEdBQWxELEVBQXVEdEcsT0FBT0QsTUFBUCxFQUF2RCxFQUF3RXdDLEVBQUV1VSxJQUFGLENBQU9oWCxJQUFQLEVBQWEsS0FBYixDQUF4RTtBQUVBLFlBQU1pUSxVQUFXLGdCQUFnQmpRLEtBQUt3RyxHQUFLLElBQUl5USxVQUFValgsS0FBSytELElBQWYsQ0FBc0IsRUFBckU7QUFFQSxZQUFNbVQsYUFBYTtBQUNsQkMsZUFBT25YLEtBQUsrRCxJQURNO0FBRWxCekQsY0FBTSxNQUZZO0FBR2xCOFcscUJBQWFwWCxLQUFLb1gsV0FIQTtBQUlsQkMsb0JBQVlwSCxPQUpNO0FBS2xCcUgsNkJBQXFCO0FBTEgsT0FBbkI7O0FBUUEsVUFBSSxhQUFhbFcsSUFBYixDQUFrQnBCLEtBQUtNLElBQXZCLENBQUosRUFBa0M7QUFDakM0VyxtQkFBV0ssU0FBWCxHQUF1QnRILE9BQXZCO0FBQ0FpSCxtQkFBV00sVUFBWCxHQUF3QnhYLEtBQUtNLElBQTdCO0FBQ0E0VyxtQkFBV08sVUFBWCxHQUF3QnpYLEtBQUtZLElBQTdCOztBQUNBLFlBQUlaLEtBQUtzSyxRQUFMLElBQWlCdEssS0FBS3NLLFFBQUwsQ0FBYzFKLElBQW5DLEVBQXlDO0FBQ3hDc1cscUJBQVdRLGdCQUFYLEdBQThCMVgsS0FBS3NLLFFBQUwsQ0FBYzFKLElBQTVDO0FBQ0E7O0FBQ0RzVyxtQkFBV1MsYUFBWCxpQkFBaUMxVyxXQUFXdUksa0JBQVgsQ0FBOEJ4SixJQUE5QixDQUFqQztBQUNBLE9BUkQsTUFRTyxJQUFJLGFBQWFvQixJQUFiLENBQWtCcEIsS0FBS00sSUFBdkIsQ0FBSixFQUFrQztBQUN4QzRXLG1CQUFXVSxTQUFYLEdBQXVCM0gsT0FBdkI7QUFDQWlILG1CQUFXVyxVQUFYLEdBQXdCN1gsS0FBS00sSUFBN0I7QUFDQTRXLG1CQUFXWSxVQUFYLEdBQXdCOVgsS0FBS1ksSUFBN0I7QUFDQSxPQUpNLE1BSUEsSUFBSSxhQUFhUSxJQUFiLENBQWtCcEIsS0FBS00sSUFBdkIsQ0FBSixFQUFrQztBQUN4QzRXLG1CQUFXYSxTQUFYLEdBQXVCOUgsT0FBdkI7QUFDQWlILG1CQUFXYyxVQUFYLEdBQXdCaFksS0FBS00sSUFBN0I7QUFDQTRXLG1CQUFXZSxVQUFYLEdBQXdCalksS0FBS1ksSUFBN0I7QUFDQTs7QUFFRCxZQUFNVyxPQUFPckIsT0FBT3FCLElBQVAsRUFBYjtBQUNBLFVBQUl1VixNQUFNcFIsT0FBT0MsTUFBUCxDQUFjO0FBQ3ZCYSxhQUFLNUMsT0FBT0QsRUFBUCxFQURrQjtBQUV2QnRDLGFBQUtpVixNQUZrQjtBQUd2QjRCLFlBQUksSUFBSUMsSUFBSixFQUhtQjtBQUl2QnJCLGFBQUssRUFKa0I7QUFLdkI5VyxjQUFNO0FBQ0x3RyxlQUFLeEcsS0FBS3dHLEdBREw7QUFFTHpDLGdCQUFNL0QsS0FBSytELElBRk47QUFHTHpELGdCQUFNTixLQUFLTTtBQUhOLFNBTGlCO0FBVXZCc1csbUJBQVcsS0FWWTtBQVd2QndCLHFCQUFhLENBQUNsQixVQUFEO0FBWFUsT0FBZCxFQVlQWCxPQVpPLENBQVY7QUFjQU8sWUFBTTVXLE9BQU9nTixJQUFQLENBQVksYUFBWixFQUEyQjRKLEdBQTNCLENBQU47QUFFQTVXLGFBQU9tWSxLQUFQLENBQWEsTUFBTWpZLFdBQVdrWSxTQUFYLENBQXFCQyxHQUFyQixDQUF5QixpQkFBekIsRUFBNEM7QUFBRWhYLFlBQUY7QUFBUUMsWUFBUjtBQUFjdVUsaUJBQVNlO0FBQXZCLE9BQTVDLENBQW5CO0FBRUEsYUFBT0EsR0FBUDtBQUNBLEtBckVEO0FBQUE7O0FBRGMsQ0FBZixFOzs7Ozs7Ozs7OztBQ0ZBO0FBRUEsSUFBSTBCLGNBQUo7QUFFQXBZLFdBQVdNLFFBQVgsQ0FBb0JDLEdBQXBCLENBQXdCLHlCQUF4QixFQUFtRCxVQUFTd0IsR0FBVCxFQUFjQyxLQUFkLEVBQXFCO0FBQ3ZFb1csbUJBQWlCcFcsS0FBakI7QUFDQSxDQUZEO0FBSUFsQyxPQUFPbVcsT0FBUCxDQUFlO0FBQ2RvQyxlQUFhN1IsTUFBYixFQUFxQjtBQUNwQixRQUFJNFIsa0JBQWtCLENBQUN0WSxPQUFPRCxNQUFQLEVBQXZCLEVBQXdDO0FBQ3ZDLFlBQU0sSUFBSUMsT0FBT0MsS0FBWCxDQUFpQixvQkFBakIsRUFBdUMsY0FBdkMsRUFBdUQ7QUFBRTROLGdCQUFRO0FBQVYsT0FBdkQsQ0FBTjtBQUNBOztBQUNELFVBQU0vTixPQUFPSSxXQUFXcUIsTUFBWCxDQUFrQnlFLE9BQWxCLENBQTBCdkUsV0FBMUIsQ0FBc0NpRixNQUF0QyxDQUFiO0FBRUEsV0FBT2xFLFNBQVNpSCxRQUFULENBQWtCLGtCQUFsQixFQUFzQ3VHLGNBQXRDLENBQXFEbFEsSUFBckQsQ0FBUDtBQUNBOztBQVJhLENBQWYsRTs7Ozs7Ozs7Ozs7QUNSQUksV0FBV00sUUFBWCxDQUFvQmdZLFFBQXBCLENBQTZCLFlBQTdCLEVBQTJDLFlBQVc7QUFDckQsT0FBS0MsR0FBTCxDQUFTLG9CQUFULEVBQStCLElBQS9CLEVBQXFDO0FBQ3BDclksVUFBTSxTQUQ4QjtBQUVwQ3FQLFlBQVE7QUFGNEIsR0FBckM7QUFLQSxPQUFLZ0osR0FBTCxDQUFTLHdCQUFULEVBQW1DLE9BQW5DLEVBQTRDO0FBQzNDclksVUFBTSxLQURxQztBQUUzQ3FQLFlBQVE7QUFGbUMsR0FBNUM7QUFLQSxPQUFLZ0osR0FBTCxDQUFTLCtCQUFULEVBQTBDLDRMQUExQyxFQUF3TztBQUN2T3JZLFVBQU0sUUFEaU87QUFFdk9xUCxZQUFRLElBRitOO0FBR3ZPaUoscUJBQWlCO0FBSHNOLEdBQXhPO0FBTUEsT0FBS0QsR0FBTCxDQUFTLHlCQUFULEVBQW9DLElBQXBDLEVBQTBDO0FBQ3pDclksVUFBTSxTQURtQztBQUV6Q3FQLFlBQVEsSUFGaUM7QUFHekNpSixxQkFBaUI7QUFId0IsR0FBMUM7QUFNQSxPQUFLRCxHQUFMLENBQVMseUJBQVQsRUFBb0MsUUFBcEMsRUFBOEM7QUFDN0NyWSxVQUFNLFFBRHVDO0FBRTdDdVksWUFBUSxDQUFDO0FBQ1IxVyxXQUFLLFFBREc7QUFFUjJXLGlCQUFXO0FBRkgsS0FBRCxFQUdMO0FBQ0YzVyxXQUFLLFVBREg7QUFFRjJXLGlCQUFXO0FBRlQsS0FISyxFQU1MO0FBQ0YzVyxXQUFLLG9CQURIO0FBRUYyVyxpQkFBVztBQUZULEtBTkssRUFTTDtBQUNGM1csV0FBSyxZQURIO0FBRUYyVyxpQkFBVztBQUZULEtBVEssQ0FGcUM7QUFlN0NuSixZQUFRO0FBZnFDLEdBQTlDO0FBa0JBLE9BQUtvSixPQUFMLENBQWEsV0FBYixFQUEwQixZQUFXO0FBQ3BDLFNBQUtKLEdBQUwsQ0FBUyxzQkFBVCxFQUFpQyxFQUFqQyxFQUFxQztBQUNwQ3JZLFlBQU0sUUFEOEI7QUFFcEMwWSxtQkFBYTtBQUNaeFMsYUFBSyx5QkFETztBQUVacEUsZUFBTztBQUZLO0FBRnVCLEtBQXJDO0FBT0EsU0FBS3VXLEdBQUwsQ0FBUyxtQkFBVCxFQUE4QixFQUE5QixFQUFrQztBQUNqQ3JZLFlBQU0sUUFEMkI7QUFFakMwWSxtQkFBYTtBQUNaeFMsYUFBSyx5QkFETztBQUVacEUsZUFBTztBQUZLO0FBRm9CLEtBQWxDO0FBT0EsU0FBS3VXLEdBQUwsQ0FBUyw4QkFBVCxFQUF5QyxFQUF6QyxFQUE2QztBQUM1Q3JZLFlBQU0sUUFEc0M7QUFFNUMwWSxtQkFBYTtBQUNaeFMsYUFBSyx5QkFETztBQUVacEUsZUFBTztBQUZLO0FBRitCLEtBQTdDO0FBT0EsU0FBS3VXLEdBQUwsQ0FBUyxrQ0FBVCxFQUE2QyxFQUE3QyxFQUFpRDtBQUNoRHJZLFlBQU0sUUFEMEM7QUFFaEQwWSxtQkFBYTtBQUNaeFMsYUFBSyx5QkFETztBQUVacEUsZUFBTztBQUZLO0FBRm1DLEtBQWpEO0FBT0EsU0FBS3VXLEdBQUwsQ0FBUyxtQkFBVCxFQUE4QixFQUE5QixFQUFrQztBQUNqQ3JZLFlBQU0sUUFEMkI7QUFFakMwWSxtQkFBYTtBQUNaeFMsYUFBSyx5QkFETztBQUVacEUsZUFBTztBQUZLO0FBRm9CLEtBQWxDO0FBT0EsU0FBS3VXLEdBQUwsQ0FBUyxzQkFBVCxFQUFpQyxFQUFqQyxFQUFxQztBQUNwQ3JZLFlBQU0sUUFEOEI7QUFFcEMwWSxtQkFBYTtBQUNaeFMsYUFBSyx5QkFETztBQUVacEUsZUFBTztBQUZLO0FBRnVCLEtBQXJDO0FBT0EsU0FBS3VXLEdBQUwsQ0FBUyx5QkFBVCxFQUFvQyxFQUFwQyxFQUF3QztBQUN2Q3JZLFlBQU0sUUFEaUM7QUFFdkMwWSxtQkFBYTtBQUNaeFMsYUFBSyx5QkFETztBQUVacEUsZUFBTztBQUZLLE9BRjBCO0FBTXZDd1csdUJBQWlCO0FBTnNCLEtBQXhDO0FBUUEsU0FBS0QsR0FBTCxDQUFTLGdDQUFULEVBQTJDLElBQTNDLEVBQWlEO0FBQ2hEclksWUFBTSxRQUQwQztBQUVoRDBZLG1CQUFhO0FBQ1p4UyxhQUFLLHlCQURPO0FBRVpwRSxlQUFPO0FBRks7QUFGbUMsS0FBakQ7QUFPQSxTQUFLdVcsR0FBTCxDQUFTLDhCQUFULEVBQXlDLEtBQXpDLEVBQWdEO0FBQy9DclksWUFBTSxTQUR5QztBQUUvQzBZLG1CQUFhO0FBQ1p4UyxhQUFLLHlCQURPO0FBRVpwRSxlQUFPO0FBRks7QUFGa0MsS0FBaEQ7QUFPQSxTQUFLdVcsR0FBTCxDQUFTLGlDQUFULEVBQTRDLEdBQTVDLEVBQWlEO0FBQ2hEclksWUFBTSxLQUQwQztBQUVoRDBZLG1CQUFhO0FBQ1p4UyxhQUFLLHlCQURPO0FBRVpwRSxlQUFPO0FBRkssT0FGbUM7QUFNaER3Vyx1QkFBaUI7QUFOK0IsS0FBakQ7QUFRQSxTQUFLRCxHQUFMLENBQVMsNkJBQVQsRUFBd0MsS0FBeEMsRUFBK0M7QUFDOUNyWSxZQUFNLFNBRHdDO0FBRTlDMFksbUJBQWE7QUFDWnhTLGFBQUsseUJBRE87QUFFWnBFLGVBQU87QUFGSztBQUZpQyxLQUEvQztBQU9BLFNBQUt1VyxHQUFMLENBQVMsNkJBQVQsRUFBd0MsS0FBeEMsRUFBK0M7QUFDOUNyWSxZQUFNLFNBRHdDO0FBRTlDMFksbUJBQWE7QUFDWnhTLGFBQUsseUJBRE87QUFFWnBFLGVBQU87QUFGSztBQUZpQyxLQUEvQztBQU9BLEdBdkZEO0FBeUZBLE9BQUsyVyxPQUFMLENBQWEsc0JBQWIsRUFBcUMsWUFBVztBQUMvQyxTQUFLSixHQUFMLENBQVMsaUNBQVQsRUFBNEMsRUFBNUMsRUFBZ0Q7QUFDL0NyWSxZQUFNLFFBRHlDO0FBRS9DMlksZUFBUyxJQUZzQztBQUcvQ0QsbUJBQWE7QUFDWnhTLGFBQUsseUJBRE87QUFFWnBFLGVBQU87QUFGSztBQUhrQyxLQUFoRDtBQVFBLFNBQUt1VyxHQUFMLENBQVMsbUNBQVQsRUFBOEMsRUFBOUMsRUFBa0Q7QUFDakRyWSxZQUFNLFFBRDJDO0FBRWpEMlksZUFBUyxJQUZ3QztBQUdqREQsbUJBQWE7QUFDWnhTLGFBQUsseUJBRE87QUFFWnBFLGVBQU87QUFGSztBQUhvQyxLQUFsRDtBQVFBLFNBQUt1VyxHQUFMLENBQVMsaUNBQVQsRUFBNEMsRUFBNUMsRUFBZ0Q7QUFDL0NyWSxZQUFNLFFBRHlDO0FBRS9DNFksaUJBQVcsSUFGb0M7QUFHL0NELGVBQVMsSUFIc0M7QUFJL0NELG1CQUFhO0FBQ1p4UyxhQUFLLHlCQURPO0FBRVpwRSxlQUFPO0FBRks7QUFKa0MsS0FBaEQ7QUFTQSxTQUFLdVcsR0FBTCxDQUFTLHdDQUFULEVBQW1ELEtBQW5ELEVBQTBEO0FBQ3pEclksWUFBTSxTQURtRDtBQUV6RDBZLG1CQUFhO0FBQ1p4UyxhQUFLLHlCQURPO0FBRVpwRSxlQUFPO0FBRks7QUFGNEMsS0FBMUQ7QUFPQSxTQUFLdVcsR0FBTCxDQUFTLHdDQUFULEVBQW1ELEtBQW5ELEVBQTBEO0FBQ3pEclksWUFBTSxTQURtRDtBQUV6RDBZLG1CQUFhO0FBQ1p4UyxhQUFLLHlCQURPO0FBRVpwRSxlQUFPO0FBRks7QUFGNEMsS0FBMUQ7QUFPQSxHQXhDRDtBQTBDQSxPQUFLMlcsT0FBTCxDQUFhLGFBQWIsRUFBNEIsWUFBVztBQUN0QyxTQUFLSixHQUFMLENBQVMsMkJBQVQsRUFBc0MsRUFBdEMsRUFBMEM7QUFDekNyWSxZQUFNLFFBRG1DO0FBRXpDMFksbUJBQWE7QUFDWnhTLGFBQUsseUJBRE87QUFFWnBFLGVBQU87QUFGSztBQUY0QixLQUExQztBQU9BLEdBUkQ7QUFVQSxPQUFLdVcsR0FBTCxDQUFTLDJCQUFULEVBQXNDLElBQXRDLEVBQTRDO0FBQzNDclksVUFBTSxTQURxQztBQUUzQ3FQLFlBQVE7QUFGbUMsR0FBNUM7QUFJQSxDQTFMRCxFOzs7Ozs7Ozs7OztBQ0FBbFEsT0FBT3dGLE1BQVAsQ0FBYztBQUFDa1UsaUJBQWMsTUFBSUE7QUFBbkIsQ0FBZDtBQUFpRCxJQUFJelcsUUFBSjtBQUFhakQsT0FBT0MsS0FBUCxDQUFhQyxRQUFRLGtCQUFSLENBQWIsRUFBeUM7QUFBQytDLFdBQVM3QyxDQUFULEVBQVc7QUFBQzZDLGVBQVM3QyxDQUFUO0FBQVc7O0FBQXhCLENBQXpDLEVBQW1FLENBQW5FOztBQUFzRSxJQUFJNEMsQ0FBSjs7QUFBTWhELE9BQU9DLEtBQVAsQ0FBYUMsUUFBUSxZQUFSLENBQWIsRUFBbUM7QUFBQ0MsVUFBUUMsQ0FBUixFQUFVO0FBQUM0QyxRQUFFNUMsQ0FBRjtBQUFJOztBQUFoQixDQUFuQyxFQUFxRCxDQUFyRDtBQUF3RCxJQUFJdVosRUFBSjtBQUFPM1osT0FBT0MsS0FBUCxDQUFhQyxRQUFRLG9CQUFSLENBQWIsRUFBMkM7QUFBQ0MsVUFBUUMsQ0FBUixFQUFVO0FBQUN1WixTQUFHdlosQ0FBSDtBQUFLOztBQUFqQixDQUEzQyxFQUE4RCxDQUE5RDtBQUFpRSxJQUFJdUYsTUFBSjtBQUFXM0YsT0FBT0MsS0FBUCxDQUFhQyxRQUFRLFFBQVIsQ0FBYixFQUErQjtBQUFDQyxVQUFRQyxDQUFSLEVBQVU7QUFBQ3VGLGFBQU92RixDQUFQO0FBQVM7O0FBQXJCLENBQS9CLEVBQXNELENBQXREOztBQVU5USxNQUFNc1osYUFBTixTQUE0QnpXLFNBQVMyVyxLQUFyQyxDQUEyQztBQUVqRDVWLGNBQVlvQixPQUFaLEVBQXFCO0FBQ3BCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFFQUEsY0FBVXBDLEVBQUU2VyxNQUFGLENBQVM7QUFDbEJDLG1CQUFhO0FBQ1pDLGlCQUFTLElBREc7QUFFWkMsZUFBTztBQUZLO0FBREssS0FBVCxFQUtQNVUsT0FMTyxDQUFWO0FBT0EsVUFBTUEsT0FBTjtBQUVBLFVBQU02VSxlQUFlN1UsT0FBckI7QUFFQSxVQUFNOFUsS0FBSyxJQUFJUCxFQUFKLENBQU92VSxRQUFRc00sVUFBZixDQUFYOztBQUVBdE0sWUFBUTBCLE9BQVIsR0FBa0IxQixRQUFRMEIsT0FBUixJQUFtQixVQUFTdkcsSUFBVCxFQUFlO0FBQ25ELGFBQU9BLEtBQUt3RyxHQUFaO0FBQ0EsS0FGRDs7QUFJQSxTQUFLRCxPQUFMLEdBQWUsVUFBU3ZHLElBQVQsRUFBZTtBQUM3QixVQUFJQSxLQUFLMlYsUUFBVCxFQUFtQjtBQUNsQixlQUFPM1YsS0FBSzJWLFFBQUwsQ0FBY3pILElBQXJCO0FBQ0EsT0FINEIsQ0FJN0I7QUFDQTs7O0FBQ0EsVUFBSWxPLEtBQUsyWixFQUFULEVBQWE7QUFDWixlQUFPM1osS0FBSzJaLEVBQUwsQ0FBUXpMLElBQVIsR0FBZWxPLEtBQUt3RyxHQUEzQjtBQUNBO0FBQ0QsS0FURDs7QUFXQSxTQUFLMEosY0FBTCxHQUFzQixVQUFTbFEsSUFBVCxFQUFlO0FBQ3BDLFlBQU13UixTQUFTO0FBQ2RvSSxhQUFLLEtBQUtyVCxPQUFMLENBQWF2RyxJQUFiLENBRFM7QUFFZDZaLGlCQUFTSCxhQUFhNUk7QUFGUixPQUFmO0FBS0EsYUFBTzZJLEdBQUdHLFlBQUgsQ0FBZ0IsV0FBaEIsRUFBNkJ0SSxNQUE3QixDQUFQO0FBQ0EsS0FQRDtBQVNBOzs7Ozs7OztBQU1BLFNBQUszRSxNQUFMLEdBQWMsVUFBUzdNLElBQVQsRUFBZWlFLFFBQWYsRUFBeUI7QUFDdEMySSxZQUFNNU0sSUFBTixFQUFZMEYsTUFBWjs7QUFFQSxVQUFJMUYsS0FBS3dHLEdBQUwsSUFBWSxJQUFoQixFQUFzQjtBQUNyQnhHLGFBQUt3RyxHQUFMLEdBQVc1QyxPQUFPRCxFQUFQLEVBQVg7QUFDQTs7QUFFRDNELFdBQUsyVixRQUFMLEdBQWdCO0FBQ2Z6SCxjQUFNLEtBQUtySixPQUFMLENBQWEwQixPQUFiLENBQXFCdkcsSUFBckI7QUFEUyxPQUFoQjtBQUlBQSxXQUFLa0QsS0FBTCxHQUFhLEtBQUsyQixPQUFMLENBQWFkLElBQTFCLENBWHNDLENBV047O0FBQ2hDLGFBQU8sS0FBS29GLGFBQUwsR0FBcUJyRyxNQUFyQixDQUE0QjlDLElBQTVCLEVBQWtDaUUsUUFBbEMsQ0FBUDtBQUNBLEtBYkQ7QUFlQTs7Ozs7OztBQUtBLFNBQUtvSSxNQUFMLEdBQWMsVUFBU3pGLE1BQVQsRUFBaUIzQyxRQUFqQixFQUEyQjtBQUN4QyxZQUFNakUsT0FBTyxLQUFLbUosYUFBTCxHQUFxQnNGLE9BQXJCLENBQTZCO0FBQUNqSSxhQUFLSTtBQUFOLE9BQTdCLENBQWI7QUFDQSxZQUFNNEssU0FBUztBQUNkb0ksYUFBSyxLQUFLclQsT0FBTCxDQUFhdkcsSUFBYjtBQURTLE9BQWY7QUFJQTJaLFNBQUdJLFlBQUgsQ0FBZ0J2SSxNQUFoQixFQUF3QixDQUFDbE4sR0FBRCxFQUFNRixJQUFOLEtBQWU7QUFDdEMsWUFBSUUsR0FBSixFQUFTO0FBQ1IwRSxrQkFBUUMsS0FBUixDQUFjM0UsR0FBZDtBQUNBOztBQUVETCxvQkFBWUEsU0FBU0ssR0FBVCxFQUFjRixJQUFkLENBQVo7QUFDQSxPQU5EO0FBT0EsS0FiRDtBQWVBOzs7Ozs7Ozs7QUFPQSxTQUFLeUYsYUFBTCxHQUFxQixVQUFTakQsTUFBVCxFQUFpQjVHLElBQWpCLEVBQXVCNkUsVUFBVSxFQUFqQyxFQUFxQztBQUN6RCxZQUFNMk0sU0FBUztBQUNkb0ksYUFBSyxLQUFLclQsT0FBTCxDQUFhdkcsSUFBYjtBQURTLE9BQWY7O0FBSUEsVUFBSTZFLFFBQVFiLEtBQVIsSUFBaUJhLFFBQVFtSCxHQUE3QixFQUFrQztBQUNqQ3dGLGVBQU93SSxLQUFQLEdBQWdCLEdBQUduVixRQUFRYixLQUFPLE1BQU1hLFFBQVFtSCxHQUFLLEVBQXJEO0FBQ0E7O0FBRUQsYUFBTzJOLEdBQUdNLFNBQUgsQ0FBYXpJLE1BQWIsRUFBcUIwSSxnQkFBckIsRUFBUDtBQUNBLEtBVkQ7QUFZQTs7Ozs7Ozs7O0FBT0EsU0FBS0MsY0FBTCxHQUFzQixVQUFTdlQsTUFBVCxFQUFpQjVHO0FBQUk7QUFBckIsTUFBb0M7QUFDekQsWUFBTW9hLGNBQWMsSUFBSWhWLE9BQU9nUCxXQUFYLEVBQXBCO0FBQ0FnRyxrQkFBWS9MLE1BQVosR0FBcUJyTyxLQUFLWSxJQUExQjtBQUVBd1osa0JBQVk5RixFQUFaLENBQWUsYUFBZixFQUE4QixDQUFDK0YsS0FBRCxFQUFRQyxRQUFSLEtBQXFCO0FBQ2xELFlBQUlELFVBQVUsUUFBZCxFQUF3QjtBQUN2QnJMLGtCQUFRdUwsUUFBUixDQUFpQixNQUFNO0FBQ3RCSCx3QkFBWUksY0FBWixDQUEyQkgsS0FBM0IsRUFBa0NDLFFBQWxDO0FBQ0FGLHdCQUFZOUYsRUFBWixDQUFlLGFBQWYsRUFBOEJnRyxRQUE5QjtBQUNBLFdBSEQ7QUFJQTtBQUNELE9BUEQ7QUFTQVgsU0FBR2MsU0FBSCxDQUFhO0FBQ1piLGFBQUssS0FBS3JULE9BQUwsQ0FBYXZHLElBQWIsQ0FETztBQUVaMGEsY0FBTU4sV0FGTTtBQUdaTyxxQkFBYTNhLEtBQUtNLElBSE47QUFJWnNhLDRCQUFxQixxQkFBcUIzRCxVQUFValgsS0FBSytELElBQWYsQ0FBc0I7QUFKcEQsT0FBYixFQU1Ja0YsS0FBRCxJQUFXO0FBQ2IsWUFBSUEsS0FBSixFQUFXO0FBQ1ZELGtCQUFRQyxLQUFSLENBQWNBLEtBQWQ7QUFDQTs7QUFFRG1SLG9CQUFZNUYsSUFBWixDQUFpQixhQUFqQjtBQUNBLE9BWkQ7QUFjQSxhQUFPNEYsV0FBUDtBQUNBLEtBNUJEO0FBNkJBOztBQTlJZ0Q7O0FBaUpsRDtBQUNBMVgsU0FBU1EsS0FBVCxDQUFleVMsUUFBZixHQUEwQndELGFBQTFCLEM7Ozs7Ozs7Ozs7O0FDNUpBMVosT0FBT3dGLE1BQVAsQ0FBYztBQUFDNFYsc0JBQW1CLE1BQUlBO0FBQXhCLENBQWQ7QUFBMkQsSUFBSW5ZLFFBQUo7QUFBYWpELE9BQU9DLEtBQVAsQ0FBYUMsUUFBUSxrQkFBUixDQUFiLEVBQXlDO0FBQUMrQyxXQUFTN0MsQ0FBVCxFQUFXO0FBQUM2QyxlQUFTN0MsQ0FBVDtBQUFXOztBQUF4QixDQUF6QyxFQUFtRSxDQUFuRTtBQUFzRSxJQUFJaWIsU0FBSjtBQUFjcmIsT0FBT0MsS0FBUCxDQUFhQyxRQUFRLHVCQUFSLENBQWIsRUFBOEM7QUFBQ0MsVUFBUUMsQ0FBUixFQUFVO0FBQUNpYixnQkFBVWpiLENBQVY7QUFBWTs7QUFBeEIsQ0FBOUMsRUFBd0UsQ0FBeEU7O0FBUXJKLE1BQU1nYixrQkFBTixTQUFpQ25ZLFNBQVMyVyxLQUExQyxDQUFnRDtBQUV0RDVWLGNBQVlvQixPQUFaLEVBQXFCO0FBQ3BCLFVBQU1BLE9BQU47QUFFQSxVQUFNa1csTUFBTUQsVUFBVWpXLFFBQVFzTSxVQUFsQixDQUFaO0FBQ0EsU0FBS3VCLE1BQUwsR0FBY3FJLElBQUlySSxNQUFKLENBQVc3TixRQUFRNk4sTUFBbkIsQ0FBZDs7QUFFQTdOLFlBQVEwQixPQUFSLEdBQWtCMUIsUUFBUTBCLE9BQVIsSUFBbUIsVUFBU3ZHLElBQVQsRUFBZTtBQUNuRCxhQUFPQSxLQUFLd0csR0FBWjtBQUNBLEtBRkQ7O0FBSUEsU0FBS0QsT0FBTCxHQUFlLFVBQVN2RyxJQUFULEVBQWU7QUFDN0IsVUFBSUEsS0FBS21XLGFBQVQsRUFBd0I7QUFDdkIsZUFBT25XLEtBQUttVyxhQUFMLENBQW1CakksSUFBMUI7QUFDQSxPQUg0QixDQUk3QjtBQUNBOzs7QUFDQSxVQUFJbE8sS0FBS2diLGtCQUFULEVBQTZCO0FBQzVCLGVBQU9oYixLQUFLZ2Isa0JBQUwsQ0FBd0I5TSxJQUF4QixHQUErQmxPLEtBQUt3RyxHQUEzQztBQUNBO0FBQ0QsS0FURDs7QUFXQSxTQUFLMEosY0FBTCxHQUFzQixVQUFTbFEsSUFBVCxFQUFlaUUsUUFBZixFQUF5QjtBQUM5QyxZQUFNdU4sU0FBUztBQUNkeUosZ0JBQVEsTUFETTtBQUVkQyw2QkFBcUIsUUFGUDtBQUdkQyxpQkFBU2hELEtBQUtpRCxHQUFMLEtBQVcsS0FBS3ZXLE9BQUwsQ0FBYWlNLGlCQUFiLEdBQStCO0FBSHJDLE9BQWY7QUFNQSxXQUFLNEIsTUFBTCxDQUFZMVMsSUFBWixDQUFpQixLQUFLdUcsT0FBTCxDQUFhdkcsSUFBYixDQUFqQixFQUFxQzhaLFlBQXJDLENBQWtEdEksTUFBbEQsRUFBMER2TixRQUExRDtBQUNBLEtBUkQ7QUFVQTs7Ozs7Ozs7QUFNQSxTQUFLNEksTUFBTCxHQUFjLFVBQVM3TSxJQUFULEVBQWVpRSxRQUFmLEVBQXlCO0FBQ3RDMkksWUFBTTVNLElBQU4sRUFBWTBGLE1BQVo7O0FBRUEsVUFBSTFGLEtBQUt3RyxHQUFMLElBQVksSUFBaEIsRUFBc0I7QUFDckJ4RyxhQUFLd0csR0FBTCxHQUFXNUMsT0FBT0QsRUFBUCxFQUFYO0FBQ0E7O0FBRUQzRCxXQUFLbVcsYUFBTCxHQUFxQjtBQUNwQmpJLGNBQU0sS0FBS3JKLE9BQUwsQ0FBYTBCLE9BQWIsQ0FBcUJ2RyxJQUFyQjtBQURjLE9BQXJCO0FBSUFBLFdBQUtrRCxLQUFMLEdBQWEsS0FBSzJCLE9BQUwsQ0FBYWQsSUFBMUIsQ0FYc0MsQ0FXTjs7QUFDaEMsYUFBTyxLQUFLb0YsYUFBTCxHQUFxQnJHLE1BQXJCLENBQTRCOUMsSUFBNUIsRUFBa0NpRSxRQUFsQyxDQUFQO0FBQ0EsS0FiRDtBQWVBOzs7Ozs7O0FBS0EsU0FBS29JLE1BQUwsR0FBYyxVQUFTekYsTUFBVCxFQUFpQjNDLFFBQWpCLEVBQTJCO0FBQ3hDLFlBQU1qRSxPQUFPLEtBQUttSixhQUFMLEdBQXFCc0YsT0FBckIsQ0FBNkI7QUFBQ2pJLGFBQUtJO0FBQU4sT0FBN0IsQ0FBYjtBQUNBLFdBQUs4TCxNQUFMLENBQVkxUyxJQUFaLENBQWlCLEtBQUt1RyxPQUFMLENBQWF2RyxJQUFiLENBQWpCLEVBQXFDcU0sTUFBckMsQ0FBNEMsVUFBUy9ILEdBQVQsRUFBY0YsSUFBZCxFQUFvQjtBQUMvRCxZQUFJRSxHQUFKLEVBQVM7QUFDUjBFLGtCQUFRQyxLQUFSLENBQWMzRSxHQUFkO0FBQ0E7O0FBRURMLG9CQUFZQSxTQUFTSyxHQUFULEVBQWNGLElBQWQsQ0FBWjtBQUNBLE9BTkQ7QUFPQSxLQVREO0FBV0E7Ozs7Ozs7OztBQU9BLFNBQUt5RixhQUFMLEdBQXFCLFVBQVNqRCxNQUFULEVBQWlCNUcsSUFBakIsRUFBdUI2RSxVQUFVLEVBQWpDLEVBQXFDO0FBQ3pELFlBQU1sQyxTQUFTLEVBQWY7O0FBRUEsVUFBSWtDLFFBQVFiLEtBQVIsSUFBaUIsSUFBckIsRUFBMkI7QUFDMUJyQixlQUFPcUIsS0FBUCxHQUFlYSxRQUFRYixLQUF2QjtBQUNBOztBQUVELFVBQUlhLFFBQVFtSCxHQUFSLElBQWUsSUFBbkIsRUFBeUI7QUFDeEJySixlQUFPcUosR0FBUCxHQUFhbkgsUUFBUW1ILEdBQXJCO0FBQ0E7O0FBRUQsYUFBTyxLQUFLMEcsTUFBTCxDQUFZMVMsSUFBWixDQUFpQixLQUFLdUcsT0FBTCxDQUFhdkcsSUFBYixDQUFqQixFQUFxQ2thLGdCQUFyQyxDQUFzRHZYLE1BQXRELENBQVA7QUFDQSxLQVpEO0FBY0E7Ozs7Ozs7OztBQU9BLFNBQUt3WCxjQUFMLEdBQXNCLFVBQVN2VCxNQUFULEVBQWlCNUc7QUFBSTtBQUFyQixNQUFvQztBQUN6RCxhQUFPLEtBQUswUyxNQUFMLENBQVkxUyxJQUFaLENBQWlCLEtBQUt1RyxPQUFMLENBQWF2RyxJQUFiLENBQWpCLEVBQXFDbU0saUJBQXJDLENBQXVEO0FBQzdEa1AsY0FBTSxLQUR1RDtBQUU3RHJULGtCQUFVO0FBQ1RzVCx1QkFBYXRiLEtBQUtNLElBRFQ7QUFFVGliLDhCQUFxQixvQkFBb0J2YixLQUFLK0QsSUFBTSxFQUYzQyxDQUdUO0FBQ0E7QUFDQTs7QUFMUztBQUZtRCxPQUF2RCxDQUFQO0FBVUEsS0FYRDtBQVlBOztBQTlHcUQ7O0FBaUh2RDtBQUNBckIsU0FBU1EsS0FBVCxDQUFlaVQsYUFBZixHQUErQjBFLGtCQUEvQixDIiwiZmlsZSI6Ii9wYWNrYWdlcy9yb2NrZXRjaGF0X2ZpbGUtdXBsb2FkLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyogZ2xvYmFscyBTbGluZ3Nob3QgKi9cblxuaW1wb3J0IGZpbGVzaXplIGZyb20gJ2ZpbGVzaXplJztcblxuY29uc3Qgc2xpbmdTaG90Q29uZmlnID0ge1xuXHRhdXRob3JpemUoZmlsZS8qLCBtZXRhQ29udGV4dCovKSB7XG5cdFx0Ly9EZW55IHVwbG9hZHMgaWYgdXNlciBpcyBub3QgbG9nZ2VkIGluLlxuXHRcdGlmICghdGhpcy51c2VySWQpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2xvZ2luLXJlcXVpcmVkJywgJ1BsZWFzZSBsb2dpbiBiZWZvcmUgcG9zdGluZyBmaWxlcycpO1xuXHRcdH1cblxuXHRcdGlmICghUm9ja2V0Q2hhdC5maWxlVXBsb2FkSXNWYWxpZENvbnRlbnRUeXBlKGZpbGUudHlwZSkpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoVEFQaTE4bi5fXygnZXJyb3ItaW52YWxpZC1maWxlLXR5cGUnKSk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgbWF4RmlsZVNpemUgPSBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnRmlsZVVwbG9hZF9NYXhGaWxlU2l6ZScpO1xuXG5cdFx0aWYgKG1heEZpbGVTaXplID49IC0xICYmIG1heEZpbGVTaXplIDwgZmlsZS5zaXplKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKFRBUGkxOG4uX18oJ0ZpbGVfZXhjZWVkc19hbGxvd2VkX3NpemVfb2ZfYnl0ZXMnLCB7IHNpemU6IGZpbGVzaXplKG1heEZpbGVTaXplKSB9KSk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRydWU7XG5cdH0sXG5cdG1heFNpemU6IDAsXG5cdGFsbG93ZWRGaWxlVHlwZXM6IG51bGxcbn07XG5cblNsaW5nc2hvdC5maWxlUmVzdHJpY3Rpb25zKCdyb2NrZXRjaGF0LXVwbG9hZHMnLCBzbGluZ1Nob3RDb25maWcpO1xuU2xpbmdzaG90LmZpbGVSZXN0cmljdGlvbnMoJ3JvY2tldGNoYXQtdXBsb2Fkcy1ncycsIHNsaW5nU2hvdENvbmZpZyk7XG4iLCIvKiBnbG9iYWxzIEZpbGVVcGxvYWQ6dHJ1ZSAqL1xuLyogZXhwb3J0ZWQgRmlsZVVwbG9hZCAqL1xuXG5pbXBvcnQgZmlsZXNpemUgZnJvbSAnZmlsZXNpemUnO1xuXG5sZXQgbWF4RmlsZVNpemUgPSAwO1xuXG5GaWxlVXBsb2FkID0ge1xuXHR2YWxpZGF0ZUZpbGVVcGxvYWQoZmlsZSkge1xuXHRcdGlmICghTWF0Y2gudGVzdChmaWxlLnJpZCwgU3RyaW5nKSkge1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblxuXHRcdGNvbnN0IHVzZXIgPSBNZXRlb3IudXNlcigpO1xuXHRcdGNvbnN0IHJvb20gPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT25lQnlJZChmaWxlLnJpZCk7XG5cdFx0Y29uc3QgZGlyZWN0TWVzc2FnZUFsbG93ID0gUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0ZpbGVVcGxvYWRfRW5hYmxlZF9EaXJlY3QnKTtcblx0XHRjb25zdCBmaWxlVXBsb2FkQWxsb3dlZCA9IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdGaWxlVXBsb2FkX0VuYWJsZWQnKTtcblxuXHRcdGlmIChSb2NrZXRDaGF0LmF1dGh6LmNhbkFjY2Vzc1Jvb20ocm9vbSwgdXNlcikgIT09IHRydWUpIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cblx0XHRpZiAoIWZpbGVVcGxvYWRBbGxvd2VkKSB7XG5cdFx0XHRjb25zdCByZWFzb24gPSBUQVBpMThuLl9fKCdGaWxlVXBsb2FkX0Rpc2FibGVkJywgdXNlci5sYW5ndWFnZSk7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1maWxlLXVwbG9hZC1kaXNhYmxlZCcsIHJlYXNvbik7XG5cdFx0fVxuXG5cdFx0aWYgKCFkaXJlY3RNZXNzYWdlQWxsb3cgJiYgcm9vbS50ID09PSAnZCcpIHtcblx0XHRcdGNvbnN0IHJlYXNvbiA9IFRBUGkxOG4uX18oJ0ZpbGVfbm90X2FsbG93ZWRfZGlyZWN0X21lc3NhZ2VzJywgdXNlci5sYW5ndWFnZSk7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1kaXJlY3QtbWVzc2FnZS1maWxlLXVwbG9hZC1ub3QtYWxsb3dlZCcsIHJlYXNvbik7XG5cdFx0fVxuXG5cdFx0Ly8gLTEgbWF4RmlsZVNpemUgbWVhbnMgdGhlcmUgaXMgbm8gbGltaXRcblx0XHRpZiAobWF4RmlsZVNpemUgPj0gLTEgJiYgZmlsZS5zaXplID4gbWF4RmlsZVNpemUpIHtcblx0XHRcdGNvbnN0IHJlYXNvbiA9IFRBUGkxOG4uX18oJ0ZpbGVfZXhjZWVkc19hbGxvd2VkX3NpemVfb2ZfYnl0ZXMnLCB7XG5cdFx0XHRcdHNpemU6IGZpbGVzaXplKG1heEZpbGVTaXplKVxuXHRcdFx0fSwgdXNlci5sYW5ndWFnZSk7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1maWxlLXRvby1sYXJnZScsIHJlYXNvbik7XG5cdFx0fVxuXG5cdFx0aWYgKG1heEZpbGVTaXplID4gMCkge1xuXHRcdFx0aWYgKGZpbGUuc2l6ZSA+IG1heEZpbGVTaXplKSB7XG5cdFx0XHRcdGNvbnN0IHJlYXNvbiA9IFRBUGkxOG4uX18oJ0ZpbGVfZXhjZWVkc19hbGxvd2VkX3NpemVfb2ZfYnl0ZXMnLCB7XG5cdFx0XHRcdFx0c2l6ZTogZmlsZXNpemUobWF4RmlsZVNpemUpXG5cdFx0XHRcdH0sIHVzZXIubGFuZ3VhZ2UpO1xuXHRcdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1maWxlLXRvby1sYXJnZScsIHJlYXNvbik7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0aWYgKCFSb2NrZXRDaGF0LmZpbGVVcGxvYWRJc1ZhbGlkQ29udGVudFR5cGUoZmlsZS50eXBlKSkge1xuXHRcdFx0Y29uc3QgcmVhc29uID0gVEFQaTE4bi5fXygnRmlsZV90eXBlX2lzX25vdF9hY2NlcHRlZCcsIHVzZXIubGFuZ3VhZ2UpO1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItaW52YWxpZC1maWxlLXR5cGUnLCByZWFzb24pO1xuXHRcdH1cblxuXHRcdHJldHVybiB0cnVlO1xuXHR9XG59O1xuXG5Sb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnRmlsZVVwbG9hZF9NYXhGaWxlU2l6ZScsIGZ1bmN0aW9uKGtleSwgdmFsdWUpIHtcblx0dHJ5IHtcblx0XHRtYXhGaWxlU2l6ZSA9IHBhcnNlSW50KHZhbHVlKTtcblx0fSBjYXRjaCAoZSkge1xuXHRcdG1heEZpbGVTaXplID0gUm9ja2V0Q2hhdC5tb2RlbHMuU2V0dGluZ3MuZmluZE9uZUJ5SWQoJ0ZpbGVVcGxvYWRfTWF4RmlsZVNpemUnKS5wYWNrYWdlVmFsdWU7XG5cdH1cbn0pO1xuIiwiLyogZ2xvYmFscyBGaWxlVXBsb2FkQmFzZTp0cnVlLCBVcGxvYWRGUyAqL1xuLyogZXhwb3J0ZWQgRmlsZVVwbG9hZEJhc2UgKi9cbmltcG9ydCBfIGZyb20gJ3VuZGVyc2NvcmUnO1xuXG5VcGxvYWRGUy5jb25maWcuZGVmYXVsdFN0b3JlUGVybWlzc2lvbnMgPSBuZXcgVXBsb2FkRlMuU3RvcmVQZXJtaXNzaW9ucyh7XG5cdGluc2VydCh1c2VySWQsIGRvYykge1xuXHRcdGlmICh1c2VySWQpIHtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblxuXHRcdC8vIGFsbG93IGluc2VydHMgZnJvbSBzbGFja2JyaWRnZSAobWVzc2FnZV9pZCA9IHNsYWNrLXRpbWVzdGFtcC1taWxsaSlcblx0XHRpZiAoZG9jICYmIGRvYy5tZXNzYWdlX2lkICYmIGRvYy5tZXNzYWdlX2lkLmluZGV4T2YoJ3NsYWNrLScpID09PSAwKSB7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cblx0XHQvLyBhbGxvdyBpbnNlcnRzIHRvIHRoZSBVc2VyRGF0YUZpbGVzIHN0b3JlXG5cdFx0aWYgKGRvYyAmJiBkb2Muc3RvcmUgJiYgZG9jLnN0b3JlLnNwbGl0KCc6JykucG9wKCkgPT09ICdVc2VyRGF0YUZpbGVzJykge1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9LFxuXHR1cGRhdGUodXNlcklkLCBkb2MpIHtcblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKE1ldGVvci51c2VySWQoKSwgJ2RlbGV0ZS1tZXNzYWdlJywgZG9jLnJpZCkgfHwgKFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdNZXNzYWdlX0FsbG93RGVsZXRpbmcnKSAmJiB1c2VySWQgPT09IGRvYy51c2VySWQpO1xuXHR9LFxuXHRyZW1vdmUodXNlcklkLCBkb2MpIHtcblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKE1ldGVvci51c2VySWQoKSwgJ2RlbGV0ZS1tZXNzYWdlJywgZG9jLnJpZCkgfHwgKFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdNZXNzYWdlX0FsbG93RGVsZXRpbmcnKSAmJiB1c2VySWQgPT09IGRvYy51c2VySWQpO1xuXHR9XG59KTtcblxuXG5GaWxlVXBsb2FkQmFzZSA9IGNsYXNzIEZpbGVVcGxvYWRCYXNlIHtcblx0Y29uc3RydWN0b3Ioc3RvcmUsIG1ldGEsIGZpbGUpIHtcblx0XHR0aGlzLmlkID0gUmFuZG9tLmlkKCk7XG5cdFx0dGhpcy5tZXRhID0gbWV0YTtcblx0XHR0aGlzLmZpbGUgPSBmaWxlO1xuXHRcdHRoaXMuc3RvcmUgPSBzdG9yZTtcblx0fVxuXG5cdGdldFByb2dyZXNzKCkge1xuXG5cdH1cblxuXHRnZXRGaWxlTmFtZSgpIHtcblx0XHRyZXR1cm4gdGhpcy5tZXRhLm5hbWU7XG5cdH1cblxuXHRzdGFydChjYWxsYmFjaykge1xuXHRcdHRoaXMuaGFuZGxlciA9IG5ldyBVcGxvYWRGUy5VcGxvYWRlcih7XG5cdFx0XHRzdG9yZTogdGhpcy5zdG9yZSxcblx0XHRcdGRhdGE6IHRoaXMuZmlsZSxcblx0XHRcdGZpbGU6IHRoaXMubWV0YSxcblx0XHRcdG9uRXJyb3I6IChlcnIpID0+IHtcblx0XHRcdFx0cmV0dXJuIGNhbGxiYWNrKGVycik7XG5cdFx0XHR9LFxuXHRcdFx0b25Db21wbGV0ZTogKGZpbGVEYXRhKSA9PiB7XG5cdFx0XHRcdGNvbnN0IGZpbGUgPSBfLnBpY2soZmlsZURhdGEsICdfaWQnLCAndHlwZScsICdzaXplJywgJ25hbWUnLCAnaWRlbnRpZnknLCAnZGVzY3JpcHRpb24nKTtcblxuXHRcdFx0XHRmaWxlLnVybCA9IGZpbGVEYXRhLnVybC5yZXBsYWNlKE1ldGVvci5hYnNvbHV0ZVVybCgpLCAnLycpO1xuXHRcdFx0XHRyZXR1cm4gY2FsbGJhY2sobnVsbCwgZmlsZSwgdGhpcy5zdG9yZS5vcHRpb25zLm5hbWUpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0dGhpcy5oYW5kbGVyLm9uUHJvZ3Jlc3MgPSAoZmlsZSwgcHJvZ3Jlc3MpID0+IHtcblx0XHRcdHRoaXMub25Qcm9ncmVzcyhwcm9ncmVzcyk7XG5cdFx0fTtcblxuXHRcdHJldHVybiB0aGlzLmhhbmRsZXIuc3RhcnQoKTtcblx0fVxuXG5cdG9uUHJvZ3Jlc3MoKSB7fVxuXG5cdHN0b3AoKSB7XG5cdFx0cmV0dXJuIHRoaXMuaGFuZGxlci5zdG9wKCk7XG5cdH1cbn07XG4iLCIvKiBnbG9iYWxzIFVwbG9hZEZTICovXG5cbmltcG9ydCBmcyBmcm9tICdmcyc7XG5pbXBvcnQgc3RyZWFtIGZyb20gJ3N0cmVhbSc7XG5pbXBvcnQgbWltZSBmcm9tICdtaW1lLXR5cGUvd2l0aC1kYic7XG5pbXBvcnQgRnV0dXJlIGZyb20gJ2ZpYmVycy9mdXR1cmUnO1xuaW1wb3J0IHNoYXJwIGZyb20gJ3NoYXJwJztcbmltcG9ydCB7IENvb2tpZXMgfSBmcm9tICdtZXRlb3Ivb3N0cmlvOmNvb2tpZXMnO1xuXG5jb25zdCBjb29raWUgPSBuZXcgQ29va2llcygpO1xuXG5PYmplY3QuYXNzaWduKEZpbGVVcGxvYWQsIHtcblx0aGFuZGxlcnM6IHt9LFxuXG5cdGNvbmZpZ3VyZVVwbG9hZHNTdG9yZShzdG9yZSwgbmFtZSwgb3B0aW9ucykge1xuXHRcdGNvbnN0IHR5cGUgPSBuYW1lLnNwbGl0KCc6JykucG9wKCk7XG5cdFx0Y29uc3Qgc3RvcmVzID0gVXBsb2FkRlMuZ2V0U3RvcmVzKCk7XG5cdFx0ZGVsZXRlIHN0b3Jlc1tuYW1lXTtcblxuXHRcdHJldHVybiBuZXcgVXBsb2FkRlMuc3RvcmVbc3RvcmVdKE9iamVjdC5hc3NpZ24oe1xuXHRcdFx0bmFtZVxuXHRcdH0sIG9wdGlvbnMsIEZpbGVVcGxvYWRbYGRlZmF1bHQkeyB0eXBlIH1gXSgpKSk7XG5cdH0sXG5cblx0ZGVmYXVsdFVwbG9hZHMoKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdGNvbGxlY3Rpb246IFJvY2tldENoYXQubW9kZWxzLlVwbG9hZHMubW9kZWwsXG5cdFx0XHRmaWx0ZXI6IG5ldyBVcGxvYWRGUy5GaWx0ZXIoe1xuXHRcdFx0XHRvbkNoZWNrOiBGaWxlVXBsb2FkLnZhbGlkYXRlRmlsZVVwbG9hZFxuXHRcdFx0fSksXG5cdFx0XHRnZXRQYXRoKGZpbGUpIHtcblx0XHRcdFx0cmV0dXJuIGAkeyBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgndW5pcXVlSUQnKSB9L3VwbG9hZHMvJHsgZmlsZS5yaWQgfS8keyBmaWxlLnVzZXJJZCB9LyR7IGZpbGUuX2lkIH1gO1xuXHRcdFx0fSxcblx0XHRcdG9uVmFsaWRhdGU6IEZpbGVVcGxvYWQudXBsb2Fkc09uVmFsaWRhdGUsXG5cdFx0XHRvblJlYWQoZmlsZUlkLCBmaWxlLCByZXEsIHJlcykge1xuXHRcdFx0XHRpZiAoIUZpbGVVcGxvYWQucmVxdWVzdENhbkFjY2Vzc0ZpbGVzKHJlcSkpIHtcblx0XHRcdFx0XHRyZXMud3JpdGVIZWFkKDQwMyk7XG5cdFx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0cmVzLnNldEhlYWRlcignY29udGVudC1kaXNwb3NpdGlvbicsIGBhdHRhY2htZW50OyBmaWxlbmFtZT1cIiR7IGVuY29kZVVSSUNvbXBvbmVudChmaWxlLm5hbWUpIH1cImApO1xuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdH1cblx0XHR9O1xuXHR9LFxuXG5cdGRlZmF1bHRBdmF0YXJzKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHRjb2xsZWN0aW9uOiBSb2NrZXRDaGF0Lm1vZGVscy5BdmF0YXJzLm1vZGVsLFxuXHRcdFx0Ly8gZmlsdGVyOiBuZXcgVXBsb2FkRlMuRmlsdGVyKHtcblx0XHRcdC8vIFx0b25DaGVjazogRmlsZVVwbG9hZC52YWxpZGF0ZUZpbGVVcGxvYWRcblx0XHRcdC8vIH0pLFxuXHRcdFx0Z2V0UGF0aChmaWxlKSB7XG5cdFx0XHRcdHJldHVybiBgJHsgUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ3VuaXF1ZUlEJykgfS9hdmF0YXJzLyR7IGZpbGUudXNlcklkIH1gO1xuXHRcdFx0fSxcblx0XHRcdG9uVmFsaWRhdGU6IEZpbGVVcGxvYWQuYXZhdGFyc09uVmFsaWRhdGUsXG5cdFx0XHRvbkZpbmlzaFVwbG9hZDogRmlsZVVwbG9hZC5hdmF0YXJzT25GaW5pc2hVcGxvYWRcblx0XHR9O1xuXHR9LFxuXG5cdGRlZmF1bHRVc2VyRGF0YUZpbGVzKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHRjb2xsZWN0aW9uOiBSb2NrZXRDaGF0Lm1vZGVscy5Vc2VyRGF0YUZpbGVzLm1vZGVsLFxuXHRcdFx0Z2V0UGF0aChmaWxlKSB7XG5cdFx0XHRcdHJldHVybiBgJHsgUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ3VuaXF1ZUlEJykgfS91cGxvYWRzL3VzZXJEYXRhLyR7IGZpbGUudXNlcklkIH1gO1xuXHRcdFx0fSxcblx0XHRcdG9uVmFsaWRhdGU6IEZpbGVVcGxvYWQudXBsb2Fkc09uVmFsaWRhdGUsXG5cdFx0XHRvblJlYWQoZmlsZUlkLCBmaWxlLCByZXEsIHJlcykge1xuXHRcdFx0XHRpZiAoIUZpbGVVcGxvYWQucmVxdWVzdENhbkFjY2Vzc0ZpbGVzKHJlcSkpIHtcblx0XHRcdFx0XHRyZXMud3JpdGVIZWFkKDQwMyk7XG5cdFx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0cmVzLnNldEhlYWRlcignY29udGVudC1kaXNwb3NpdGlvbicsIGBhdHRhY2htZW50OyBmaWxlbmFtZT1cIiR7IGVuY29kZVVSSUNvbXBvbmVudChmaWxlLm5hbWUpIH1cImApO1xuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdH1cblx0XHR9O1xuXHR9LFxuXG5cdGF2YXRhcnNPblZhbGlkYXRlKGZpbGUpIHtcblx0XHRpZiAoUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0FjY291bnRzX0F2YXRhclJlc2l6ZScpICE9PSB0cnVlKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0Y29uc3QgdGVtcEZpbGVQYXRoID0gVXBsb2FkRlMuZ2V0VGVtcEZpbGVQYXRoKGZpbGUuX2lkKTtcblxuXHRcdGNvbnN0IGhlaWdodCA9IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdBY2NvdW50c19BdmF0YXJTaXplJyk7XG5cdFx0Y29uc3QgZnV0dXJlID0gbmV3IEZ1dHVyZSgpO1xuXG5cdFx0Y29uc3QgcyA9IHNoYXJwKHRlbXBGaWxlUGF0aCk7XG5cdFx0cy5yb3RhdGUoKTtcblx0XHQvLyBHZXQgbWV0YWRhdGEgdG8gcmVzaXplIHRoZSBpbWFnZSB0aGUgZmlyc3QgdGltZSB0byBrZWVwIFwiaW5zaWRlXCIgdGhlIGRpbWVuc2lvbnNcblx0XHQvLyB0aGVuIHJlc2l6ZSBhZ2FpbiB0byBjcmVhdGUgdGhlIGNhbnZhcyBhcm91bmRcblx0XHRzLm1ldGFkYXRhKE1ldGVvci5iaW5kRW52aXJvbm1lbnQoKGVyciwgbWV0YWRhdGEpID0+IHtcblx0XHRcdHMudG9Gb3JtYXQoc2hhcnAuZm9ybWF0LmpwZWcpXG5cdFx0XHRcdC5yZXNpemUoTWF0aC5taW4oaGVpZ2h0LCBtZXRhZGF0YS53aWR0aCksIE1hdGgubWluKGhlaWdodCwgbWV0YWRhdGEuaGVpZ2h0KSlcblx0XHRcdFx0LnBpcGUoc2hhcnAoKVxuXHRcdFx0XHRcdC5yZXNpemUoaGVpZ2h0LCBoZWlnaHQpXG5cdFx0XHRcdFx0LmJhY2tncm91bmQoJyNGRkZGRkYnKVxuXHRcdFx0XHRcdC5lbWJlZCgpXG5cdFx0XHRcdClcblx0XHRcdFx0Ly8gVXNlIGJ1ZmZlciB0byBnZXQgdGhlIHJlc3VsdCBpbiBtZW1vcnkgdGhlbiByZXBsYWNlIHRoZSBleGlzdGluZyBmaWxlXG5cdFx0XHRcdC8vIFRoZXJlIGlzIG5vIG9wdGlvbiB0byBvdmVycmlkZSBhIGZpbGUgdXNpbmcgdGhpcyBsaWJyYXJ5XG5cdFx0XHRcdC50b0J1ZmZlcigpXG5cdFx0XHRcdC50aGVuKE1ldGVvci5iaW5kRW52aXJvbm1lbnQob3V0cHV0QnVmZmVyID0+IHtcblx0XHRcdFx0XHRmcy53cml0ZUZpbGUodGVtcEZpbGVQYXRoLCBvdXRwdXRCdWZmZXIsIE1ldGVvci5iaW5kRW52aXJvbm1lbnQoZXJyID0+IHtcblx0XHRcdFx0XHRcdGlmIChlcnIgIT0gbnVsbCkge1xuXHRcdFx0XHRcdFx0XHRjb25zb2xlLmVycm9yKGVycik7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRjb25zdCBzaXplID0gZnMubHN0YXRTeW5jKHRlbXBGaWxlUGF0aCkuc2l6ZTtcblx0XHRcdFx0XHRcdHRoaXMuZ2V0Q29sbGVjdGlvbigpLmRpcmVjdC51cGRhdGUoe19pZDogZmlsZS5faWR9LCB7JHNldDoge3NpemV9fSk7XG5cdFx0XHRcdFx0XHRmdXR1cmUucmV0dXJuKCk7XG5cdFx0XHRcdFx0fSkpO1xuXHRcdFx0XHR9KSk7XG5cdFx0fSkpO1xuXG5cdFx0cmV0dXJuIGZ1dHVyZS53YWl0KCk7XG5cdH0sXG5cblx0cmVzaXplSW1hZ2VQcmV2aWV3KGZpbGUpIHtcblx0XHRmaWxlID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXBsb2Fkcy5maW5kT25lQnlJZChmaWxlLl9pZCk7XG5cdFx0ZmlsZSA9IEZpbGVVcGxvYWQuYWRkRXh0ZW5zaW9uVG8oZmlsZSk7XG5cdFx0Y29uc3QgaW1hZ2UgPSBGaWxlVXBsb2FkLmdldFN0b3JlKCdVcGxvYWRzJykuX3N0b3JlLmdldFJlYWRTdHJlYW0oZmlsZS5faWQsIGZpbGUpO1xuXG5cdFx0Y29uc3QgdHJhbnNmb3JtZXIgPSBzaGFycCgpXG5cdFx0XHQucmVzaXplKDMyLCAzMilcblx0XHRcdC5tYXgoKVxuXHRcdFx0LmpwZWcoKVxuXHRcdFx0LmJsdXIoKTtcblx0XHRjb25zdCByZXN1bHQgPSB0cmFuc2Zvcm1lci50b0J1ZmZlcigpLnRoZW4oKG91dCkgPT4gb3V0LnRvU3RyaW5nKCdiYXNlNjQnKSk7XG5cdFx0aW1hZ2UucGlwZSh0cmFuc2Zvcm1lcik7XG5cdFx0cmV0dXJuIHJlc3VsdDtcblx0fSxcblxuXHR1cGxvYWRzT25WYWxpZGF0ZShmaWxlKSB7XG5cdFx0aWYgKCEvXmltYWdlXFwvKCh4LXdpbmRvd3MtKT9ibXB8cD9qcGVnfHBuZykkLy50ZXN0KGZpbGUudHlwZSkpIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRjb25zdCB0bXBGaWxlID0gVXBsb2FkRlMuZ2V0VGVtcEZpbGVQYXRoKGZpbGUuX2lkKTtcblxuXHRcdGNvbnN0IGZ1dCA9IG5ldyBGdXR1cmUoKTtcblxuXHRcdGNvbnN0IHMgPSBzaGFycCh0bXBGaWxlKTtcblx0XHRzLm1ldGFkYXRhKE1ldGVvci5iaW5kRW52aXJvbm1lbnQoKGVyciwgbWV0YWRhdGEpID0+IHtcblx0XHRcdGlmIChlcnIgIT0gbnVsbCkge1xuXHRcdFx0XHRjb25zb2xlLmVycm9yKGVycik7XG5cdFx0XHRcdHJldHVybiBmdXQucmV0dXJuKCk7XG5cdFx0XHR9XG5cblx0XHRcdGNvbnN0IGlkZW50aWZ5ID0ge1xuXHRcdFx0XHRmb3JtYXQ6IG1ldGFkYXRhLmZvcm1hdCxcblx0XHRcdFx0c2l6ZToge1xuXHRcdFx0XHRcdHdpZHRoOiBtZXRhZGF0YS53aWR0aCxcblx0XHRcdFx0XHRoZWlnaHQ6IG1ldGFkYXRhLmhlaWdodFxuXHRcdFx0XHR9XG5cdFx0XHR9O1xuXG5cdFx0XHRpZiAobWV0YWRhdGEub3JpZW50YXRpb24gPT0gbnVsbCkge1xuXHRcdFx0XHRyZXR1cm4gZnV0LnJldHVybigpO1xuXHRcdFx0fVxuXG5cdFx0XHRzLnJvdGF0ZSgpXG5cdFx0XHRcdC50b0ZpbGUoYCR7IHRtcEZpbGUgfS50bXBgKVxuXHRcdFx0XHQudGhlbihNZXRlb3IuYmluZEVudmlyb25tZW50KCgpID0+IHtcblx0XHRcdFx0XHRmcy51bmxpbmsodG1wRmlsZSwgTWV0ZW9yLmJpbmRFbnZpcm9ubWVudCgoKSA9PiB7XG5cdFx0XHRcdFx0XHRmcy5yZW5hbWUoYCR7IHRtcEZpbGUgfS50bXBgLCB0bXBGaWxlLCBNZXRlb3IuYmluZEVudmlyb25tZW50KCgpID0+IHtcblx0XHRcdFx0XHRcdFx0Y29uc3Qgc2l6ZSA9IGZzLmxzdGF0U3luYyh0bXBGaWxlKS5zaXplO1xuXHRcdFx0XHRcdFx0XHR0aGlzLmdldENvbGxlY3Rpb24oKS5kaXJlY3QudXBkYXRlKHtfaWQ6IGZpbGUuX2lkfSwge1xuXHRcdFx0XHRcdFx0XHRcdCRzZXQ6IHtcblx0XHRcdFx0XHRcdFx0XHRcdHNpemUsXG5cdFx0XHRcdFx0XHRcdFx0XHRpZGVudGlmeVxuXHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0XHRcdGZ1dC5yZXR1cm4oKTtcblx0XHRcdFx0XHRcdH0pKTtcblx0XHRcdFx0XHR9KSk7XG5cdFx0XHRcdH0pKS5jYXRjaCgoZXJyKSA9PiB7XG5cdFx0XHRcdFx0Y29uc29sZS5lcnJvcihlcnIpO1xuXHRcdFx0XHRcdGZ1dC5yZXR1cm4oKTtcblx0XHRcdFx0fSk7XG5cdFx0fSkpO1xuXG5cdFx0cmV0dXJuIGZ1dC53YWl0KCk7XG5cdH0sXG5cblx0YXZhdGFyc09uRmluaXNoVXBsb2FkKGZpbGUpIHtcblx0XHQvLyB1cGRhdGUgZmlsZSByZWNvcmQgdG8gbWF0Y2ggdXNlcidzIHVzZXJuYW1lXG5cdFx0Y29uc3QgdXNlciA9IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmVCeUlkKGZpbGUudXNlcklkKTtcblx0XHRjb25zdCBvbGRBdmF0YXIgPSBSb2NrZXRDaGF0Lm1vZGVscy5BdmF0YXJzLmZpbmRPbmVCeU5hbWUodXNlci51c2VybmFtZSk7XG5cdFx0aWYgKG9sZEF2YXRhcikge1xuXHRcdFx0Um9ja2V0Q2hhdC5tb2RlbHMuQXZhdGFycy5kZWxldGVGaWxlKG9sZEF2YXRhci5faWQpO1xuXHRcdH1cblx0XHRSb2NrZXRDaGF0Lm1vZGVscy5BdmF0YXJzLnVwZGF0ZUZpbGVOYW1lQnlJZChmaWxlLl9pZCwgdXNlci51c2VybmFtZSk7XG5cdFx0Ly8gY29uc29sZS5sb2coJ3VwbG9hZCBmaW5pc2hlZCAtPicsIGZpbGUpO1xuXHR9LFxuXG5cdHJlcXVlc3RDYW5BY2Nlc3NGaWxlcyh7IGhlYWRlcnMgPSB7fSwgcXVlcnkgPSB7fSB9KSB7XG5cdFx0aWYgKCFSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnRmlsZVVwbG9hZF9Qcm90ZWN0RmlsZXMnKSkge1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXG5cdFx0bGV0IHsgcmNfdWlkLCByY190b2tlbiB9ID0gcXVlcnk7XG5cblx0XHRpZiAoIXJjX3VpZCAmJiBoZWFkZXJzLmNvb2tpZSkge1xuXHRcdFx0cmNfdWlkID0gY29va2llLmdldCgncmNfdWlkJywgaGVhZGVycy5jb29raWUpIDtcblx0XHRcdHJjX3Rva2VuID0gY29va2llLmdldCgncmNfdG9rZW4nLCBoZWFkZXJzLmNvb2tpZSk7XG5cdFx0fVxuXG5cdFx0aWYgKCFyY191aWQgfHwgIXJjX3Rva2VuIHx8ICFSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kT25lQnlJZEFuZExvZ2luVG9rZW4ocmNfdWlkLCByY190b2tlbikpIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cblx0XHRyZXR1cm4gdHJ1ZTtcblx0fSxcblxuXHRhZGRFeHRlbnNpb25UbyhmaWxlKSB7XG5cdFx0aWYgKG1pbWUubG9va3VwKGZpbGUubmFtZSkgPT09IGZpbGUudHlwZSkge1xuXHRcdFx0cmV0dXJuIGZpbGU7XG5cdFx0fVxuXG5cdFx0Y29uc3QgZXh0ID0gbWltZS5leHRlbnNpb24oZmlsZS50eXBlKTtcblx0XHRpZiAoZXh0ICYmIGZhbHNlID09PSBuZXcgUmVnRXhwKGBcXC4keyBleHQgfSRgLCAnaScpLnRlc3QoZmlsZS5uYW1lKSkge1xuXHRcdFx0ZmlsZS5uYW1lID0gYCR7IGZpbGUubmFtZSB9LiR7IGV4dCB9YDtcblx0XHR9XG5cblx0XHRyZXR1cm4gZmlsZTtcblx0fSxcblxuXHRnZXRTdG9yZShtb2RlbE5hbWUpIHtcblx0XHRjb25zdCBzdG9yYWdlVHlwZSA9IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdGaWxlVXBsb2FkX1N0b3JhZ2VfVHlwZScpO1xuXHRcdGNvbnN0IGhhbmRsZXJOYW1lID0gYCR7IHN0b3JhZ2VUeXBlIH06JHsgbW9kZWxOYW1lIH1gO1xuXG5cdFx0cmV0dXJuIHRoaXMuZ2V0U3RvcmVCeU5hbWUoaGFuZGxlck5hbWUpO1xuXHR9LFxuXG5cdGdldFN0b3JlQnlOYW1lKGhhbmRsZXJOYW1lKSB7XG5cdFx0aWYgKHRoaXMuaGFuZGxlcnNbaGFuZGxlck5hbWVdID09IG51bGwpIHtcblx0XHRcdGNvbnNvbGUuZXJyb3IoYFVwbG9hZCBoYW5kbGVyIFwiJHsgaGFuZGxlck5hbWUgfVwiIGRvZXMgbm90IGV4aXN0c2ApO1xuXHRcdH1cblx0XHRyZXR1cm4gdGhpcy5oYW5kbGVyc1toYW5kbGVyTmFtZV07XG5cdH0sXG5cblx0Z2V0KGZpbGUsIHJlcSwgcmVzLCBuZXh0KSB7XG5cdFx0Y29uc3Qgc3RvcmUgPSB0aGlzLmdldFN0b3JlQnlOYW1lKGZpbGUuc3RvcmUpO1xuXHRcdGlmIChzdG9yZSAmJiBzdG9yZS5nZXQpIHtcblx0XHRcdHJldHVybiBzdG9yZS5nZXQoZmlsZSwgcmVxLCByZXMsIG5leHQpO1xuXHRcdH1cblx0XHRyZXMud3JpdGVIZWFkKDQwNCk7XG5cdFx0cmVzLmVuZCgpO1xuXHR9LFxuXG5cdGNvcHkoZmlsZSwgdGFyZ2V0RmlsZSkge1xuXHRcdGNvbnN0IHN0b3JlID0gdGhpcy5nZXRTdG9yZUJ5TmFtZShmaWxlLnN0b3JlKTtcblx0XHRjb25zdCBvdXQgPSBmcy5jcmVhdGVXcml0ZVN0cmVhbSh0YXJnZXRGaWxlKTtcblxuXHRcdGZpbGUgPSBGaWxlVXBsb2FkLmFkZEV4dGVuc2lvblRvKGZpbGUpO1xuXG5cdFx0aWYgKHN0b3JlLmNvcHkpIHtcblx0XHRcdHN0b3JlLmNvcHkoZmlsZSwgb3V0KTtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblxuXHRcdHJldHVybiBmYWxzZTtcblx0fVxufSk7XG5cbmV4cG9ydCBjbGFzcyBGaWxlVXBsb2FkQ2xhc3Mge1xuXHRjb25zdHJ1Y3Rvcih7IG5hbWUsIG1vZGVsLCBzdG9yZSwgZ2V0LCBpbnNlcnQsIGdldFN0b3JlLCBjb3B5IH0pIHtcblx0XHR0aGlzLm5hbWUgPSBuYW1lO1xuXHRcdHRoaXMubW9kZWwgPSBtb2RlbCB8fCB0aGlzLmdldE1vZGVsRnJvbU5hbWUoKTtcblx0XHR0aGlzLl9zdG9yZSA9IHN0b3JlIHx8IFVwbG9hZEZTLmdldFN0b3JlKG5hbWUpO1xuXHRcdHRoaXMuZ2V0ID0gZ2V0O1xuXHRcdHRoaXMuY29weSA9IGNvcHk7XG5cblx0XHRpZiAoaW5zZXJ0KSB7XG5cdFx0XHR0aGlzLmluc2VydCA9IGluc2VydDtcblx0XHR9XG5cblx0XHRpZiAoZ2V0U3RvcmUpIHtcblx0XHRcdHRoaXMuZ2V0U3RvcmUgPSBnZXRTdG9yZTtcblx0XHR9XG5cblx0XHRGaWxlVXBsb2FkLmhhbmRsZXJzW25hbWVdID0gdGhpcztcblx0fVxuXG5cdGdldFN0b3JlKCkge1xuXHRcdHJldHVybiB0aGlzLl9zdG9yZTtcblx0fVxuXG5cdGdldCBzdG9yZSgpIHtcblx0XHRyZXR1cm4gdGhpcy5nZXRTdG9yZSgpO1xuXHR9XG5cblx0c2V0IHN0b3JlKHN0b3JlKSB7XG5cdFx0dGhpcy5fc3RvcmUgPSBzdG9yZTtcblx0fVxuXG5cdGdldE1vZGVsRnJvbU5hbWUoKSB7XG5cdFx0cmV0dXJuIFJvY2tldENoYXQubW9kZWxzW3RoaXMubmFtZS5zcGxpdCgnOicpWzFdXTtcblx0fVxuXG5cdGRlbGV0ZShmaWxlSWQpIHtcblx0XHRpZiAodGhpcy5zdG9yZSAmJiB0aGlzLnN0b3JlLmRlbGV0ZSkge1xuXHRcdFx0dGhpcy5zdG9yZS5kZWxldGUoZmlsZUlkKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gdGhpcy5tb2RlbC5kZWxldGVGaWxlKGZpbGVJZCk7XG5cdH1cblxuXHRkZWxldGVCeUlkKGZpbGVJZCkge1xuXHRcdGNvbnN0IGZpbGUgPSB0aGlzLm1vZGVsLmZpbmRPbmVCeUlkKGZpbGVJZCk7XG5cblx0XHRpZiAoIWZpbGUpIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRjb25zdCBzdG9yZSA9IEZpbGVVcGxvYWQuZ2V0U3RvcmVCeU5hbWUoZmlsZS5zdG9yZSk7XG5cblx0XHRyZXR1cm4gc3RvcmUuZGVsZXRlKGZpbGUuX2lkKTtcblx0fVxuXG5cdGRlbGV0ZUJ5TmFtZShmaWxlTmFtZSkge1xuXHRcdGNvbnN0IGZpbGUgPSB0aGlzLm1vZGVsLmZpbmRPbmVCeU5hbWUoZmlsZU5hbWUpO1xuXG5cdFx0aWYgKCFmaWxlKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0Y29uc3Qgc3RvcmUgPSBGaWxlVXBsb2FkLmdldFN0b3JlQnlOYW1lKGZpbGUuc3RvcmUpO1xuXG5cdFx0cmV0dXJuIHN0b3JlLmRlbGV0ZShmaWxlLl9pZCk7XG5cdH1cblxuXHRpbnNlcnQoZmlsZURhdGEsIHN0cmVhbU9yQnVmZmVyLCBjYikge1xuXHRcdGZpbGVEYXRhLnNpemUgPSBwYXJzZUludChmaWxlRGF0YS5zaXplKSB8fCAwO1xuXG5cdFx0Ly8gQ2hlY2sgaWYgdGhlIGZpbGVEYXRhIG1hdGNoZXMgc3RvcmUgZmlsdGVyXG5cdFx0Y29uc3QgZmlsdGVyID0gdGhpcy5zdG9yZS5nZXRGaWx0ZXIoKTtcblx0XHRpZiAoZmlsdGVyICYmIGZpbHRlci5jaGVjaykge1xuXHRcdFx0ZmlsdGVyLmNoZWNrKGZpbGVEYXRhKTtcblx0XHR9XG5cblx0XHRjb25zdCBmaWxlSWQgPSB0aGlzLnN0b3JlLmNyZWF0ZShmaWxlRGF0YSk7XG5cdFx0Y29uc3QgdG9rZW4gPSB0aGlzLnN0b3JlLmNyZWF0ZVRva2VuKGZpbGVJZCk7XG5cdFx0Y29uc3QgdG1wRmlsZSA9IFVwbG9hZEZTLmdldFRlbXBGaWxlUGF0aChmaWxlSWQpO1xuXG5cdFx0dHJ5IHtcblx0XHRcdGlmIChzdHJlYW1PckJ1ZmZlciBpbnN0YW5jZW9mIHN0cmVhbSkge1xuXHRcdFx0XHRzdHJlYW1PckJ1ZmZlci5waXBlKGZzLmNyZWF0ZVdyaXRlU3RyZWFtKHRtcEZpbGUpKTtcblx0XHRcdH0gZWxzZSBpZiAoc3RyZWFtT3JCdWZmZXIgaW5zdGFuY2VvZiBCdWZmZXIpIHtcblx0XHRcdFx0ZnMud3JpdGVGaWxlU3luYyh0bXBGaWxlLCBzdHJlYW1PckJ1ZmZlcik7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgZmlsZSB0eXBlJyk7XG5cdFx0XHR9XG5cblx0XHRcdGNvbnN0IGZpbGUgPSBNZXRlb3IuY2FsbCgndWZzQ29tcGxldGUnLCBmaWxlSWQsIHRoaXMubmFtZSwgdG9rZW4pO1xuXG5cdFx0XHRpZiAoY2IpIHtcblx0XHRcdFx0Y2IobnVsbCwgZmlsZSk7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBmaWxlO1xuXHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdGlmIChjYikge1xuXHRcdFx0XHRjYihlKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHRocm93IGU7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG59XG4iLCIvKiBnbG9iYWxzIFVwbG9hZEZTLCBJbnN0YW5jZVN0YXR1cyAqL1xuXG5pbXBvcnQgaHR0cCBmcm9tICdodHRwJztcbmltcG9ydCBVUkwgZnJvbSAndXJsJztcblxuY29uc3QgbG9nZ2VyID0gbmV3IExvZ2dlcignVXBsb2FkUHJveHknKTtcblxuV2ViQXBwLmNvbm5lY3RIYW5kbGVycy5zdGFjay51bnNoaWZ0KHtcblx0cm91dGU6ICcnLFxuXHRoYW5kbGU6IE1ldGVvci5iaW5kRW52aXJvbm1lbnQoZnVuY3Rpb24ocmVxLCByZXMsIG5leHQpIHtcblx0XHQvLyBRdWljayBjaGVjayB0byBzZWUgaWYgcmVxdWVzdCBzaG91bGQgYmUgY2F0Y2hcblx0XHRpZiAocmVxLnVybC5pbmRleE9mKFVwbG9hZEZTLmNvbmZpZy5zdG9yZXNQYXRoKSA9PT0gLTEpIHtcblx0XHRcdHJldHVybiBuZXh0KCk7XG5cdFx0fVxuXG5cdFx0bG9nZ2VyLmRlYnVnKCdVcGxvYWQgVVJMOicsIHJlcS51cmwpO1xuXG5cdFx0aWYgKHJlcS5tZXRob2QgIT09ICdQT1NUJykge1xuXHRcdFx0cmV0dXJuIG5leHQoKTtcblx0XHR9XG5cblx0XHQvLyBSZW1vdmUgc3RvcmUgcGF0aFxuXHRcdGNvbnN0IHBhcnNlZFVybCA9IFVSTC5wYXJzZShyZXEudXJsKTtcblx0XHRjb25zdCBwYXRoID0gcGFyc2VkVXJsLnBhdGhuYW1lLnN1YnN0cihVcGxvYWRGUy5jb25maWcuc3RvcmVzUGF0aC5sZW5ndGggKyAxKTtcblxuXHRcdC8vIEdldCBzdG9yZVxuXHRcdGNvbnN0IHJlZ0V4cCA9IG5ldyBSZWdFeHAoJ15cXC8oW15cXC9cXD9dKylcXC8oW15cXC9cXD9dKykkJyk7XG5cdFx0Y29uc3QgbWF0Y2ggPSByZWdFeHAuZXhlYyhwYXRoKTtcblxuXHRcdC8vIFJlcXVlc3QgaXMgbm90IHZhbGlkXG5cdFx0aWYgKG1hdGNoID09PSBudWxsKSB7XG5cdFx0XHRyZXMud3JpdGVIZWFkKDQwMCk7XG5cdFx0XHRyZXMuZW5kKCk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0Ly8gR2V0IHN0b3JlXG5cdFx0Y29uc3Qgc3RvcmUgPSBVcGxvYWRGUy5nZXRTdG9yZShtYXRjaFsxXSk7XG5cdFx0aWYgKCFzdG9yZSkge1xuXHRcdFx0cmVzLndyaXRlSGVhZCg0MDQpO1xuXHRcdFx0cmVzLmVuZCgpO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdC8vIEdldCBmaWxlXG5cdFx0Y29uc3QgZmlsZUlkID0gbWF0Y2hbMl07XG5cdFx0Y29uc3QgZmlsZSA9IHN0b3JlLmdldENvbGxlY3Rpb24oKS5maW5kT25lKHtfaWQ6IGZpbGVJZH0pO1xuXHRcdGlmIChmaWxlID09PSB1bmRlZmluZWQpIHtcblx0XHRcdHJlcy53cml0ZUhlYWQoNDA0KTtcblx0XHRcdHJlcy5lbmQoKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRpZiAoZmlsZS5pbnN0YW5jZUlkID09PSBJbnN0YW5jZVN0YXR1cy5pZCgpKSB7XG5cdFx0XHRsb2dnZXIuZGVidWcoJ0NvcnJlY3QgaW5zdGFuY2UnKTtcblx0XHRcdHJldHVybiBuZXh0KCk7XG5cdFx0fVxuXG5cdFx0Ly8gUHJveHkgdG8gb3RoZXIgaW5zdGFuY2Vcblx0XHRjb25zdCBpbnN0YW5jZSA9IEluc3RhbmNlU3RhdHVzLmdldENvbGxlY3Rpb24oKS5maW5kT25lKHtfaWQ6IGZpbGUuaW5zdGFuY2VJZH0pO1xuXG5cdFx0aWYgKGluc3RhbmNlID09IG51bGwpIHtcblx0XHRcdHJlcy53cml0ZUhlYWQoNDA0KTtcblx0XHRcdHJlcy5lbmQoKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRpZiAoaW5zdGFuY2UuZXh0cmFJbmZvcm1hdGlvbi5ob3N0ID09PSBwcm9jZXNzLmVudi5JTlNUQU5DRV9JUCAmJiBSb2NrZXRDaGF0LmlzRG9ja2VyKCkgPT09IGZhbHNlKSB7XG5cdFx0XHRpbnN0YW5jZS5leHRyYUluZm9ybWF0aW9uLmhvc3QgPSAnbG9jYWxob3N0Jztcblx0XHR9XG5cblx0XHRsb2dnZXIuZGVidWcoJ1dyb25nIGluc3RhbmNlLCBwcm94aW5nIHRvOicsIGAkeyBpbnN0YW5jZS5leHRyYUluZm9ybWF0aW9uLmhvc3QgfTokeyBpbnN0YW5jZS5leHRyYUluZm9ybWF0aW9uLnBvcnQgfWApO1xuXG5cdFx0Y29uc3Qgb3B0aW9ucyA9IHtcblx0XHRcdGhvc3RuYW1lOiBpbnN0YW5jZS5leHRyYUluZm9ybWF0aW9uLmhvc3QsXG5cdFx0XHRwb3J0OiBpbnN0YW5jZS5leHRyYUluZm9ybWF0aW9uLnBvcnQsXG5cdFx0XHRwYXRoOiByZXEub3JpZ2luYWxVcmwsXG5cdFx0XHRtZXRob2Q6ICdQT1NUJ1xuXHRcdH07XG5cblx0XHRjb25zdCBwcm94eSA9IGh0dHAucmVxdWVzdChvcHRpb25zLCBmdW5jdGlvbihwcm94eV9yZXMpIHtcblx0XHRcdHByb3h5X3Jlcy5waXBlKHJlcywge1xuXHRcdFx0XHRlbmQ6IHRydWVcblx0XHRcdH0pO1xuXHRcdH0pO1xuXG5cdFx0cmVxLnBpcGUocHJveHksIHtcblx0XHRcdGVuZDogdHJ1ZVxuXHRcdH0pO1xuXHR9KVxufSk7XG4iLCIvKiBnbG9iYWxzIEZpbGVVcGxvYWQsIFdlYkFwcCAqL1xuXG5XZWJBcHAuY29ubmVjdEhhbmRsZXJzLnVzZSgnL2ZpbGUtdXBsb2FkLycsXHRmdW5jdGlvbihyZXEsIHJlcywgbmV4dCkge1xuXG5cdGNvbnN0IG1hdGNoID0gL15cXC8oW15cXC9dKylcXC8oLiopLy5leGVjKHJlcS51cmwpO1xuXG5cdGlmIChtYXRjaFsxXSkge1xuXHRcdGNvbnN0IGZpbGUgPSBSb2NrZXRDaGF0Lm1vZGVscy5VcGxvYWRzLmZpbmRPbmVCeUlkKG1hdGNoWzFdKTtcblxuXHRcdGlmIChmaWxlKSB7XG5cdFx0XHRpZiAoIU1ldGVvci5zZXR0aW5ncy5wdWJsaWMuc2FuZHN0b3JtICYmICFGaWxlVXBsb2FkLnJlcXVlc3RDYW5BY2Nlc3NGaWxlcyhyZXEpKSB7XG5cdFx0XHRcdHJlcy53cml0ZUhlYWQoNDAzKTtcblx0XHRcdFx0cmV0dXJuIHJlcy5lbmQoKTtcblx0XHRcdH1cblxuXHRcdFx0cmVzLnNldEhlYWRlcignQ29udGVudC1TZWN1cml0eS1Qb2xpY3knLCAnZGVmYXVsdC1zcmMgXFwnbm9uZVxcJycpO1xuXHRcdFx0cmV0dXJuIEZpbGVVcGxvYWQuZ2V0KGZpbGUsIHJlcSwgcmVzLCBuZXh0KTtcblx0XHR9XG5cdH1cblxuXHRyZXMud3JpdGVIZWFkKDQwNCk7XG5cdHJlcy5lbmQoKTtcbn0pO1xuIiwiLyogZ2xvYmFscyBVcGxvYWRGUyAqL1xuXG5pbXBvcnQgXyBmcm9tICd1bmRlcnNjb3JlJztcbmltcG9ydCAnLi9BbWF6b25TMy5qcyc7XG5pbXBvcnQgJy4vRmlsZVN5c3RlbS5qcyc7XG5pbXBvcnQgJy4vR29vZ2xlU3RvcmFnZS5qcyc7XG5pbXBvcnQgJy4vR3JpZEZTLmpzJztcbmltcG9ydCAnLi9TbGluZ3Nob3RfREVQUkVDQVRFRC5qcyc7XG5cbmNvbnN0IGNvbmZpZ1N0b3JlID0gXy5kZWJvdW5jZSgoKSA9PiB7XG5cdGNvbnN0IHN0b3JlID0gUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0ZpbGVVcGxvYWRfU3RvcmFnZV9UeXBlJyk7XG5cblx0aWYgKHN0b3JlKSB7XG5cdFx0Y29uc29sZS5sb2coJ1NldHRpbmcgZGVmYXVsdCBmaWxlIHN0b3JlIHRvJywgc3RvcmUpO1xuXHRcdFVwbG9hZEZTLmdldFN0b3JlcygpLkF2YXRhcnMgPSBVcGxvYWRGUy5nZXRTdG9yZShgJHsgc3RvcmUgfTpBdmF0YXJzYCk7XG5cdFx0VXBsb2FkRlMuZ2V0U3RvcmVzKCkuVXBsb2FkcyA9IFVwbG9hZEZTLmdldFN0b3JlKGAkeyBzdG9yZSB9OlVwbG9hZHNgKTtcblx0XHRVcGxvYWRGUy5nZXRTdG9yZXMoKS5Vc2VyRGF0YUZpbGVzID0gVXBsb2FkRlMuZ2V0U3RvcmUoYCR7IHN0b3JlIH06VXNlckRhdGFGaWxlc2ApO1xuXHR9XG59LCAxMDAwKTtcblxuUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoL15GaWxlVXBsb2FkXy8sIGNvbmZpZ1N0b3JlKTtcbiIsIi8qIGdsb2JhbHMgRmlsZVVwbG9hZCAqL1xuXG5pbXBvcnQgXyBmcm9tICd1bmRlcnNjb3JlJztcbmltcG9ydCB7IEZpbGVVcGxvYWRDbGFzcyB9IGZyb20gJy4uL2xpYi9GaWxlVXBsb2FkJztcbmltcG9ydCAnLi4vLi4vdWZzL0FtYXpvblMzL3NlcnZlci5qcyc7XG5pbXBvcnQgaHR0cCBmcm9tICdodHRwJztcbmltcG9ydCBodHRwcyBmcm9tICdodHRwcyc7XG5cbmNvbnN0IGdldCA9IGZ1bmN0aW9uKGZpbGUsIHJlcSwgcmVzKSB7XG5cdGNvbnN0IGZpbGVVcmwgPSB0aGlzLnN0b3JlLmdldFJlZGlyZWN0VVJMKGZpbGUpO1xuXG5cdGlmIChmaWxlVXJsKSB7XG5cdFx0Y29uc3Qgc3RvcmVUeXBlID0gZmlsZS5zdG9yZS5zcGxpdCgnOicpLnBvcCgpO1xuXHRcdGlmIChSb2NrZXRDaGF0LnNldHRpbmdzLmdldChgRmlsZVVwbG9hZF9TM19Qcm94eV8keyBzdG9yZVR5cGUgfWApKSB7XG5cdFx0XHRjb25zdCByZXF1ZXN0ID0gL15odHRwczovLnRlc3QoZmlsZVVybCkgPyBodHRwcyA6IGh0dHA7XG5cdFx0XHRyZXF1ZXN0LmdldChmaWxlVXJsLCBmaWxlUmVzID0+IGZpbGVSZXMucGlwZShyZXMpKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmVzLnJlbW92ZUhlYWRlcignQ29udGVudC1MZW5ndGgnKTtcblx0XHRcdHJlcy5zZXRIZWFkZXIoJ0xvY2F0aW9uJywgZmlsZVVybCk7XG5cdFx0XHRyZXMud3JpdGVIZWFkKDMwMik7XG5cdFx0XHRyZXMuZW5kKCk7XG5cdFx0fVxuXHR9IGVsc2Uge1xuXHRcdHJlcy5lbmQoKTtcblx0fVxufTtcblxuY29uc3QgY29weSA9IGZ1bmN0aW9uKGZpbGUsIG91dCkge1xuXHRjb25zdCBmaWxlVXJsID0gdGhpcy5zdG9yZS5nZXRSZWRpcmVjdFVSTChmaWxlKTtcblxuXHRpZiAoZmlsZVVybCkge1xuXHRcdGNvbnN0IHJlcXVlc3QgPSAvXmh0dHBzOi8udGVzdChmaWxlVXJsKSA/IGh0dHBzIDogaHR0cDtcblx0XHRyZXF1ZXN0LmdldChmaWxlVXJsLCBmaWxlUmVzID0+IGZpbGVSZXMucGlwZShvdXQpKTtcblx0fSBlbHNlIHtcblx0XHRvdXQuZW5kKCk7XG5cdH1cbn07XG5cbmNvbnN0IEFtYXpvblMzVXBsb2FkcyA9IG5ldyBGaWxlVXBsb2FkQ2xhc3Moe1xuXHRuYW1lOiAnQW1hem9uUzM6VXBsb2FkcycsXG5cdGdldCxcblx0Y29weVxuXHQvLyBzdG9yZSBzZXR0ZWQgYmVsbG93XG59KTtcblxuY29uc3QgQW1hem9uUzNBdmF0YXJzID0gbmV3IEZpbGVVcGxvYWRDbGFzcyh7XG5cdG5hbWU6ICdBbWF6b25TMzpBdmF0YXJzJyxcblx0Z2V0LFxuXHRjb3B5XG5cdC8vIHN0b3JlIHNldHRlZCBiZWxsb3dcbn0pO1xuXG5jb25zdCBBbWF6b25TM1VzZXJEYXRhRmlsZXMgPSBuZXcgRmlsZVVwbG9hZENsYXNzKHtcblx0bmFtZTogJ0FtYXpvblMzOlVzZXJEYXRhRmlsZXMnLFxuXHRnZXQsXG5cdGNvcHlcblx0Ly8gc3RvcmUgc2V0dGVkIGJlbGxvd1xufSk7XG5cbmNvbnN0IGNvbmZpZ3VyZSA9IF8uZGVib3VuY2UoZnVuY3Rpb24oKSB7XG5cdGNvbnN0IEJ1Y2tldCA9IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdGaWxlVXBsb2FkX1MzX0J1Y2tldCcpO1xuXHRjb25zdCBBY2wgPSBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnRmlsZVVwbG9hZF9TM19BY2wnKTtcblx0Y29uc3QgQVdTQWNjZXNzS2V5SWQgPSBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnRmlsZVVwbG9hZF9TM19BV1NBY2Nlc3NLZXlJZCcpO1xuXHRjb25zdCBBV1NTZWNyZXRBY2Nlc3NLZXkgPSBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnRmlsZVVwbG9hZF9TM19BV1NTZWNyZXRBY2Nlc3NLZXknKTtcblx0Y29uc3QgVVJMRXhwaXJ5VGltZVNwYW4gPSBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnRmlsZVVwbG9hZF9TM19VUkxFeHBpcnlUaW1lU3BhbicpO1xuXHRjb25zdCBSZWdpb24gPSBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnRmlsZVVwbG9hZF9TM19SZWdpb24nKTtcblx0Y29uc3QgU2lnbmF0dXJlVmVyc2lvbiA9IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdGaWxlVXBsb2FkX1MzX1NpZ25hdHVyZVZlcnNpb24nKTtcblx0Y29uc3QgRm9yY2VQYXRoU3R5bGUgPSBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnRmlsZVVwbG9hZF9TM19Gb3JjZVBhdGhTdHlsZScpO1xuXHQvLyBjb25zdCBDRE4gPSBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnRmlsZVVwbG9hZF9TM19DRE4nKTtcblx0Y29uc3QgQnVja2V0VVJMID0gUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0ZpbGVVcGxvYWRfUzNfQnVja2V0VVJMJyk7XG5cblx0aWYgKCFCdWNrZXQgfHwgIUFXU0FjY2Vzc0tleUlkIHx8ICFBV1NTZWNyZXRBY2Nlc3NLZXkpIHtcblx0XHRyZXR1cm47XG5cdH1cblxuXHRjb25zdCBjb25maWcgPSB7XG5cdFx0Y29ubmVjdGlvbjoge1xuXHRcdFx0YWNjZXNzS2V5SWQ6IEFXU0FjY2Vzc0tleUlkLFxuXHRcdFx0c2VjcmV0QWNjZXNzS2V5OiBBV1NTZWNyZXRBY2Nlc3NLZXksXG5cdFx0XHRzaWduYXR1cmVWZXJzaW9uOiBTaWduYXR1cmVWZXJzaW9uLFxuXHRcdFx0czNGb3JjZVBhdGhTdHlsZTogRm9yY2VQYXRoU3R5bGUsXG5cdFx0XHRwYXJhbXM6IHtcblx0XHRcdFx0QnVja2V0LFxuXHRcdFx0XHRBQ0w6IEFjbFxuXHRcdFx0fSxcblx0XHRcdHJlZ2lvbjogUmVnaW9uXG5cdFx0fSxcblx0XHRVUkxFeHBpcnlUaW1lU3BhblxuXHR9O1xuXG5cdGlmIChCdWNrZXRVUkwpIHtcblx0XHRjb25maWcuY29ubmVjdGlvbi5lbmRwb2ludCA9IEJ1Y2tldFVSTDtcblx0fVxuXG5cdEFtYXpvblMzVXBsb2Fkcy5zdG9yZSA9IEZpbGVVcGxvYWQuY29uZmlndXJlVXBsb2Fkc1N0b3JlKCdBbWF6b25TMycsIEFtYXpvblMzVXBsb2Fkcy5uYW1lLCBjb25maWcpO1xuXHRBbWF6b25TM0F2YXRhcnMuc3RvcmUgPSBGaWxlVXBsb2FkLmNvbmZpZ3VyZVVwbG9hZHNTdG9yZSgnQW1hem9uUzMnLCBBbWF6b25TM0F2YXRhcnMubmFtZSwgY29uZmlnKTtcblx0QW1hem9uUzNVc2VyRGF0YUZpbGVzLnN0b3JlID0gRmlsZVVwbG9hZC5jb25maWd1cmVVcGxvYWRzU3RvcmUoJ0FtYXpvblMzJywgQW1hem9uUzNVc2VyRGF0YUZpbGVzLm5hbWUsIGNvbmZpZyk7XG59LCA1MDApO1xuXG5Sb2NrZXRDaGF0LnNldHRpbmdzLmdldCgvXkZpbGVVcGxvYWRfUzNfLywgY29uZmlndXJlKTtcbiIsIi8qIGdsb2JhbHMgRmlsZVVwbG9hZCwgVXBsb2FkRlMgKi9cblxuaW1wb3J0IF8gZnJvbSAndW5kZXJzY29yZSc7XG5pbXBvcnQgZnMgZnJvbSAnZnMnO1xuaW1wb3J0IHsgRmlsZVVwbG9hZENsYXNzIH0gZnJvbSAnLi4vbGliL0ZpbGVVcGxvYWQnO1xuXG5jb25zdCBGaWxlU3lzdGVtVXBsb2FkcyA9IG5ldyBGaWxlVXBsb2FkQ2xhc3Moe1xuXHRuYW1lOiAnRmlsZVN5c3RlbTpVcGxvYWRzJyxcblx0Ly8gc3RvcmUgc2V0dGVkIGJlbGxvd1xuXG5cdGdldChmaWxlLCByZXEsIHJlcykge1xuXHRcdGNvbnN0IGZpbGVQYXRoID0gdGhpcy5zdG9yZS5nZXRGaWxlUGF0aChmaWxlLl9pZCwgZmlsZSk7XG5cblx0XHR0cnkge1xuXHRcdFx0Y29uc3Qgc3RhdCA9IE1ldGVvci53cmFwQXN5bmMoZnMuc3RhdCkoZmlsZVBhdGgpO1xuXG5cdFx0XHRpZiAoc3RhdCAmJiBzdGF0LmlzRmlsZSgpKSB7XG5cdFx0XHRcdGZpbGUgPSBGaWxlVXBsb2FkLmFkZEV4dGVuc2lvblRvKGZpbGUpO1xuXHRcdFx0XHRyZXMuc2V0SGVhZGVyKCdDb250ZW50LURpc3Bvc2l0aW9uJywgYGF0dGFjaG1lbnQ7IGZpbGVuYW1lKj1VVEYtOCcnJHsgZW5jb2RlVVJJQ29tcG9uZW50KGZpbGUubmFtZSkgfWApO1xuXHRcdFx0XHRyZXMuc2V0SGVhZGVyKCdMYXN0LU1vZGlmaWVkJywgZmlsZS51cGxvYWRlZEF0LnRvVVRDU3RyaW5nKCkpO1xuXHRcdFx0XHRyZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCBmaWxlLnR5cGUpO1xuXHRcdFx0XHRyZXMuc2V0SGVhZGVyKCdDb250ZW50LUxlbmd0aCcsIGZpbGUuc2l6ZSk7XG5cblx0XHRcdFx0dGhpcy5zdG9yZS5nZXRSZWFkU3RyZWFtKGZpbGUuX2lkLCBmaWxlKS5waXBlKHJlcyk7XG5cdFx0XHR9XG5cdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0cmVzLndyaXRlSGVhZCg0MDQpO1xuXHRcdFx0cmVzLmVuZCgpO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblx0fSxcblxuXHRjb3B5KGZpbGUsIG91dCkge1xuXHRcdGNvbnN0IGZpbGVQYXRoID0gdGhpcy5zdG9yZS5nZXRGaWxlUGF0aChmaWxlLl9pZCwgZmlsZSk7XG5cdFx0dHJ5IHtcblx0XHRcdGNvbnN0IHN0YXQgPSBNZXRlb3Iud3JhcEFzeW5jKGZzLnN0YXQpKGZpbGVQYXRoKTtcblxuXHRcdFx0aWYgKHN0YXQgJiYgc3RhdC5pc0ZpbGUoKSkge1xuXHRcdFx0XHRmaWxlID0gRmlsZVVwbG9hZC5hZGRFeHRlbnNpb25UbyhmaWxlKTtcblxuXHRcdFx0XHR0aGlzLnN0b3JlLmdldFJlYWRTdHJlYW0oZmlsZS5faWQsIGZpbGUpLnBpcGUob3V0KTtcblx0XHRcdH1cblx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRvdXQuZW5kKCk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXHR9XG59KTtcblxuY29uc3QgRmlsZVN5c3RlbUF2YXRhcnMgPSBuZXcgRmlsZVVwbG9hZENsYXNzKHtcblx0bmFtZTogJ0ZpbGVTeXN0ZW06QXZhdGFycycsXG5cdC8vIHN0b3JlIHNldHRlZCBiZWxsb3dcblxuXHRnZXQoZmlsZSwgcmVxLCByZXMpIHtcblx0XHRjb25zdCBmaWxlUGF0aCA9IHRoaXMuc3RvcmUuZ2V0RmlsZVBhdGgoZmlsZS5faWQsIGZpbGUpO1xuXG5cdFx0dHJ5IHtcblx0XHRcdGNvbnN0IHN0YXQgPSBNZXRlb3Iud3JhcEFzeW5jKGZzLnN0YXQpKGZpbGVQYXRoKTtcblxuXHRcdFx0aWYgKHN0YXQgJiYgc3RhdC5pc0ZpbGUoKSkge1xuXHRcdFx0XHRmaWxlID0gRmlsZVVwbG9hZC5hZGRFeHRlbnNpb25UbyhmaWxlKTtcblxuXHRcdFx0XHR0aGlzLnN0b3JlLmdldFJlYWRTdHJlYW0oZmlsZS5faWQsIGZpbGUpLnBpcGUocmVzKTtcblx0XHRcdH1cblx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRyZXMud3JpdGVIZWFkKDQwNCk7XG5cdFx0XHRyZXMuZW5kKCk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXHR9XG59KTtcblxuY29uc3QgRmlsZVN5c3RlbVVzZXJEYXRhRmlsZXMgPSBuZXcgRmlsZVVwbG9hZENsYXNzKHtcblx0bmFtZTogJ0ZpbGVTeXN0ZW06VXNlckRhdGFGaWxlcycsXG5cblx0Z2V0KGZpbGUsIHJlcSwgcmVzKSB7XG5cdFx0Y29uc3QgZmlsZVBhdGggPSB0aGlzLnN0b3JlLmdldEZpbGVQYXRoKGZpbGUuX2lkLCBmaWxlKTtcblxuXHRcdHRyeSB7XG5cdFx0XHRjb25zdCBzdGF0ID0gTWV0ZW9yLndyYXBBc3luYyhmcy5zdGF0KShmaWxlUGF0aCk7XG5cblx0XHRcdGlmIChzdGF0ICYmIHN0YXQuaXNGaWxlKCkpIHtcblx0XHRcdFx0ZmlsZSA9IEZpbGVVcGxvYWQuYWRkRXh0ZW5zaW9uVG8oZmlsZSk7XG5cdFx0XHRcdHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtRGlzcG9zaXRpb24nLCBgYXR0YWNobWVudDsgZmlsZW5hbWUqPVVURi04JyckeyBlbmNvZGVVUklDb21wb25lbnQoZmlsZS5uYW1lKSB9YCk7XG5cdFx0XHRcdHJlcy5zZXRIZWFkZXIoJ0xhc3QtTW9kaWZpZWQnLCBmaWxlLnVwbG9hZGVkQXQudG9VVENTdHJpbmcoKSk7XG5cdFx0XHRcdHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsIGZpbGUudHlwZSk7XG5cdFx0XHRcdHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtTGVuZ3RoJywgZmlsZS5zaXplKTtcblxuXHRcdFx0XHR0aGlzLnN0b3JlLmdldFJlYWRTdHJlYW0oZmlsZS5faWQsIGZpbGUpLnBpcGUocmVzKTtcblx0XHRcdH1cblx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRyZXMud3JpdGVIZWFkKDQwNCk7XG5cdFx0XHRyZXMuZW5kKCk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXHR9XG59KTtcblxuY29uc3QgY3JlYXRlRmlsZVN5c3RlbVN0b3JlID0gXy5kZWJvdW5jZShmdW5jdGlvbigpIHtcblx0Y29uc3Qgb3B0aW9ucyA9IHtcblx0XHRwYXRoOiBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnRmlsZVVwbG9hZF9GaWxlU3lzdGVtUGF0aCcpIC8vJy90bXAvdXBsb2Fkcy9waG90b3MnLFxuXHR9O1xuXG5cdEZpbGVTeXN0ZW1VcGxvYWRzLnN0b3JlID0gRmlsZVVwbG9hZC5jb25maWd1cmVVcGxvYWRzU3RvcmUoJ0xvY2FsJywgRmlsZVN5c3RlbVVwbG9hZHMubmFtZSwgb3B0aW9ucyk7XG5cdEZpbGVTeXN0ZW1BdmF0YXJzLnN0b3JlID0gRmlsZVVwbG9hZC5jb25maWd1cmVVcGxvYWRzU3RvcmUoJ0xvY2FsJywgRmlsZVN5c3RlbUF2YXRhcnMubmFtZSwgb3B0aW9ucyk7XG5cdEZpbGVTeXN0ZW1Vc2VyRGF0YUZpbGVzLnN0b3JlID0gRmlsZVVwbG9hZC5jb25maWd1cmVVcGxvYWRzU3RvcmUoJ0xvY2FsJywgRmlsZVN5c3RlbVVzZXJEYXRhRmlsZXMubmFtZSwgb3B0aW9ucyk7XG5cblx0Ly8gREVQUkVDQVRFRCBiYWNrd2FyZHMgY29tcGF0aWJpbGlsdHkgKHJlbW92ZSlcblx0VXBsb2FkRlMuZ2V0U3RvcmVzKClbJ2ZpbGVTeXN0ZW0nXSA9IFVwbG9hZEZTLmdldFN0b3JlcygpW0ZpbGVTeXN0ZW1VcGxvYWRzLm5hbWVdO1xufSwgNTAwKTtcblxuUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0ZpbGVVcGxvYWRfRmlsZVN5c3RlbVBhdGgnLCBjcmVhdGVGaWxlU3lzdGVtU3RvcmUpO1xuIiwiLyogZ2xvYmFscyBGaWxlVXBsb2FkICovXG5cbmltcG9ydCBfIGZyb20gJ3VuZGVyc2NvcmUnO1xuaW1wb3J0IHsgRmlsZVVwbG9hZENsYXNzIH0gZnJvbSAnLi4vbGliL0ZpbGVVcGxvYWQnO1xuaW1wb3J0ICcuLi8uLi91ZnMvR29vZ2xlU3RvcmFnZS9zZXJ2ZXIuanMnO1xuaW1wb3J0IGh0dHAgZnJvbSAnaHR0cCc7XG5pbXBvcnQgaHR0cHMgZnJvbSAnaHR0cHMnO1xuXG5jb25zdCBnZXQgPSBmdW5jdGlvbihmaWxlLCByZXEsIHJlcykge1xuXHR0aGlzLnN0b3JlLmdldFJlZGlyZWN0VVJMKGZpbGUsIChlcnIsIGZpbGVVcmwpID0+IHtcblx0XHRpZiAoZXJyKSB7XG5cdFx0XHRjb25zb2xlLmVycm9yKGVycik7XG5cdFx0fVxuXG5cdFx0aWYgKGZpbGVVcmwpIHtcblx0XHRcdGNvbnN0IHN0b3JlVHlwZSA9IGZpbGUuc3RvcmUuc3BsaXQoJzonKS5wb3AoKTtcblx0XHRcdGlmIChSb2NrZXRDaGF0LnNldHRpbmdzLmdldChgRmlsZVVwbG9hZF9Hb29nbGVTdG9yYWdlX1Byb3h5XyR7IHN0b3JlVHlwZSB9YCkpIHtcblx0XHRcdFx0Y29uc3QgcmVxdWVzdCA9IC9eaHR0cHM6Ly50ZXN0KGZpbGVVcmwpID8gaHR0cHMgOiBodHRwO1xuXHRcdFx0XHRyZXF1ZXN0LmdldChmaWxlVXJsLCBmaWxlUmVzID0+IGZpbGVSZXMucGlwZShyZXMpKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHJlcy5yZW1vdmVIZWFkZXIoJ0NvbnRlbnQtTGVuZ3RoJyk7XG5cdFx0XHRcdHJlcy5zZXRIZWFkZXIoJ0xvY2F0aW9uJywgZmlsZVVybCk7XG5cdFx0XHRcdHJlcy53cml0ZUhlYWQoMzAyKTtcblx0XHRcdFx0cmVzLmVuZCgpO1xuXHRcdFx0fVxuXHRcdH0gZWxzZSB7XG5cdFx0XHRyZXMuZW5kKCk7XG5cdFx0fVxuXHR9KTtcbn07XG5cbmNvbnN0IGNvcHkgPSBmdW5jdGlvbihmaWxlLCBvdXQpIHtcblx0dGhpcy5zdG9yZS5nZXRSZWRpcmVjdFVSTChmaWxlLCAoZXJyLCBmaWxlVXJsKSA9PiB7XG5cdFx0aWYgKGVycikge1xuXHRcdFx0Y29uc29sZS5lcnJvcihlcnIpO1xuXHRcdH1cblxuXHRcdGlmIChmaWxlVXJsKSB7XG5cdFx0XHRjb25zdCByZXF1ZXN0ID0gL15odHRwczovLnRlc3QoZmlsZVVybCkgPyBodHRwcyA6IGh0dHA7XG5cdFx0XHRyZXF1ZXN0LmdldChmaWxlVXJsLCBmaWxlUmVzID0+IGZpbGVSZXMucGlwZShvdXQpKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0b3V0LmVuZCgpO1xuXHRcdH1cblx0fSk7XG59O1xuXG5jb25zdCBHb29nbGVDbG91ZFN0b3JhZ2VVcGxvYWRzID0gbmV3IEZpbGVVcGxvYWRDbGFzcyh7XG5cdG5hbWU6ICdHb29nbGVDbG91ZFN0b3JhZ2U6VXBsb2FkcycsXG5cdGdldCxcblx0Y29weVxuXHQvLyBzdG9yZSBzZXR0ZWQgYmVsbG93XG59KTtcblxuY29uc3QgR29vZ2xlQ2xvdWRTdG9yYWdlQXZhdGFycyA9IG5ldyBGaWxlVXBsb2FkQ2xhc3Moe1xuXHRuYW1lOiAnR29vZ2xlQ2xvdWRTdG9yYWdlOkF2YXRhcnMnLFxuXHRnZXQsXG5cdGNvcHlcblx0Ly8gc3RvcmUgc2V0dGVkIGJlbGxvd1xufSk7XG5cbmNvbnN0IEdvb2dsZUNsb3VkU3RvcmFnZVVzZXJEYXRhRmlsZXMgPSBuZXcgRmlsZVVwbG9hZENsYXNzKHtcblx0bmFtZTogJ0dvb2dsZUNsb3VkU3RvcmFnZTpVc2VyRGF0YUZpbGVzJyxcblx0Z2V0LFxuXHRjb3B5XG5cdC8vIHN0b3JlIHNldHRlZCBiZWxsb3dcbn0pO1xuXG5jb25zdCBjb25maWd1cmUgPSBfLmRlYm91bmNlKGZ1bmN0aW9uKCkge1xuXHRjb25zdCBidWNrZXQgPSBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnRmlsZVVwbG9hZF9Hb29nbGVTdG9yYWdlX0J1Y2tldCcpO1xuXHRjb25zdCBhY2Nlc3NJZCA9IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdGaWxlVXBsb2FkX0dvb2dsZVN0b3JhZ2VfQWNjZXNzSWQnKTtcblx0Y29uc3Qgc2VjcmV0ID0gUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0ZpbGVVcGxvYWRfR29vZ2xlU3RvcmFnZV9TZWNyZXQnKTtcblx0Y29uc3QgVVJMRXhwaXJ5VGltZVNwYW4gPSBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnRmlsZVVwbG9hZF9TM19VUkxFeHBpcnlUaW1lU3BhbicpO1xuXG5cdGlmICghYnVja2V0IHx8ICFhY2Nlc3NJZCB8fCAhc2VjcmV0KSB7XG5cdFx0cmV0dXJuO1xuXHR9XG5cblx0Y29uc3QgY29uZmlnID0ge1xuXHRcdGNvbm5lY3Rpb246IHtcblx0XHRcdGNyZWRlbnRpYWxzOiB7XG5cdFx0XHRcdGNsaWVudF9lbWFpbDogYWNjZXNzSWQsXG5cdFx0XHRcdHByaXZhdGVfa2V5OiBzZWNyZXRcblx0XHRcdH1cblx0XHR9LFxuXHRcdGJ1Y2tldCxcblx0XHRVUkxFeHBpcnlUaW1lU3BhblxuXHR9O1xuXG5cdEdvb2dsZUNsb3VkU3RvcmFnZVVwbG9hZHMuc3RvcmUgPSBGaWxlVXBsb2FkLmNvbmZpZ3VyZVVwbG9hZHNTdG9yZSgnR29vZ2xlU3RvcmFnZScsIEdvb2dsZUNsb3VkU3RvcmFnZVVwbG9hZHMubmFtZSwgY29uZmlnKTtcblx0R29vZ2xlQ2xvdWRTdG9yYWdlQXZhdGFycy5zdG9yZSA9IEZpbGVVcGxvYWQuY29uZmlndXJlVXBsb2Fkc1N0b3JlKCdHb29nbGVTdG9yYWdlJywgR29vZ2xlQ2xvdWRTdG9yYWdlQXZhdGFycy5uYW1lLCBjb25maWcpO1xuXHRHb29nbGVDbG91ZFN0b3JhZ2VVc2VyRGF0YUZpbGVzLnN0b3JlID0gRmlsZVVwbG9hZC5jb25maWd1cmVVcGxvYWRzU3RvcmUoJ0dvb2dsZVN0b3JhZ2UnLCBHb29nbGVDbG91ZFN0b3JhZ2VVc2VyRGF0YUZpbGVzLm5hbWUsIGNvbmZpZyk7XG59LCA1MDApO1xuXG5Sb2NrZXRDaGF0LnNldHRpbmdzLmdldCgvXkZpbGVVcGxvYWRfR29vZ2xlU3RvcmFnZV8vLCBjb25maWd1cmUpO1xuIiwiLyogZ2xvYmFscyBGaWxlVXBsb2FkLCBVcGxvYWRGUyAqL1xuaW1wb3J0IHN0cmVhbSBmcm9tICdzdHJlYW0nO1xuaW1wb3J0IHpsaWIgZnJvbSAnemxpYic7XG5pbXBvcnQgdXRpbCBmcm9tICd1dGlsJztcblxuaW1wb3J0IHsgRmlsZVVwbG9hZENsYXNzIH0gZnJvbSAnLi4vbGliL0ZpbGVVcGxvYWQnO1xuXG5jb25zdCBsb2dnZXIgPSBuZXcgTG9nZ2VyKCdGaWxlVXBsb2FkJyk7XG5cbmZ1bmN0aW9uIEV4dHJhY3RSYW5nZShvcHRpb25zKSB7XG5cdGlmICghKHRoaXMgaW5zdGFuY2VvZiBFeHRyYWN0UmFuZ2UpKSB7XG5cdFx0cmV0dXJuIG5ldyBFeHRyYWN0UmFuZ2Uob3B0aW9ucyk7XG5cdH1cblxuXHR0aGlzLnN0YXJ0ID0gb3B0aW9ucy5zdGFydDtcblx0dGhpcy5zdG9wID0gb3B0aW9ucy5zdG9wO1xuXHR0aGlzLmJ5dGVzX3JlYWQgPSAwO1xuXG5cdHN0cmVhbS5UcmFuc2Zvcm0uY2FsbCh0aGlzLCBvcHRpb25zKTtcbn1cbnV0aWwuaW5oZXJpdHMoRXh0cmFjdFJhbmdlLCBzdHJlYW0uVHJhbnNmb3JtKTtcblxuXG5FeHRyYWN0UmFuZ2UucHJvdG90eXBlLl90cmFuc2Zvcm0gPSBmdW5jdGlvbihjaHVuaywgZW5jLCBjYikge1xuXHRpZiAodGhpcy5ieXRlc19yZWFkID4gdGhpcy5zdG9wKSB7XG5cdFx0Ly8gZG9uZSByZWFkaW5nXG5cdFx0dGhpcy5lbmQoKTtcblx0fSBlbHNlIGlmICh0aGlzLmJ5dGVzX3JlYWQgKyBjaHVuay5sZW5ndGggPCB0aGlzLnN0YXJ0KSB7XG5cdFx0Ly8gdGhpcyBjaHVuayBpcyBzdGlsbCBiZWZvcmUgdGhlIHN0YXJ0IGJ5dGVcblx0fSBlbHNlIHtcblx0XHRsZXQgc3RhcnQ7XG5cdFx0bGV0IHN0b3A7XG5cblx0XHRpZiAodGhpcy5zdGFydCA8PSB0aGlzLmJ5dGVzX3JlYWQpIHtcblx0XHRcdHN0YXJ0ID0gMDtcblx0XHR9IGVsc2Uge1xuXHRcdFx0c3RhcnQgPSB0aGlzLnN0YXJ0IC0gdGhpcy5ieXRlc19yZWFkO1xuXHRcdH1cblx0XHRpZiAoKHRoaXMuc3RvcCAtIHRoaXMuYnl0ZXNfcmVhZCArIDEpIDwgY2h1bmsubGVuZ3RoKSB7XG5cdFx0XHRzdG9wID0gdGhpcy5zdG9wIC0gdGhpcy5ieXRlc19yZWFkICsgMTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0c3RvcCA9IGNodW5rLmxlbmd0aDtcblx0XHR9XG5cdFx0Y29uc3QgbmV3Y2h1bmsgPSBjaHVuay5zbGljZShzdGFydCwgc3RvcCk7XG5cdFx0dGhpcy5wdXNoKG5ld2NodW5rKTtcblx0fVxuXHR0aGlzLmJ5dGVzX3JlYWQgKz0gY2h1bmsubGVuZ3RoO1xuXHRjYigpO1xufTtcblxuXG5jb25zdCBnZXRCeXRlUmFuZ2UgPSBmdW5jdGlvbihoZWFkZXIpIHtcblx0aWYgKGhlYWRlcikge1xuXHRcdGNvbnN0IG1hdGNoZXMgPSBoZWFkZXIubWF0Y2goLyhcXGQrKS0oXFxkKykvKTtcblx0XHRpZiAobWF0Y2hlcykge1xuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0c3RhcnQ6IHBhcnNlSW50KG1hdGNoZXNbMV0sIDEwKSxcblx0XHRcdFx0c3RvcDogcGFyc2VJbnQobWF0Y2hlc1syXSwgMTApXG5cdFx0XHR9O1xuXHRcdH1cblx0fVxuXHRyZXR1cm4gbnVsbDtcbn07XG5cbi8vIGNvZGUgZnJvbTogaHR0cHM6Ly9naXRodWIuY29tL2phbGlrL2phbGlrLXVmcy9ibG9iL21hc3Rlci91ZnMtc2VydmVyLmpzI0wzMTBcbmNvbnN0IHJlYWRGcm9tR3JpZEZTID0gZnVuY3Rpb24oc3RvcmVOYW1lLCBmaWxlSWQsIGZpbGUsIHJlcSwgcmVzKSB7XG5cdGNvbnN0IHN0b3JlID0gVXBsb2FkRlMuZ2V0U3RvcmUoc3RvcmVOYW1lKTtcblx0Y29uc3QgcnMgPSBzdG9yZS5nZXRSZWFkU3RyZWFtKGZpbGVJZCwgZmlsZSk7XG5cdGNvbnN0IHdzID0gbmV3IHN0cmVhbS5QYXNzVGhyb3VnaCgpO1xuXG5cdFtycywgd3NdLmZvckVhY2goc3RyZWFtID0+IHN0cmVhbS5vbignZXJyb3InLCBmdW5jdGlvbihlcnIpIHtcblx0XHRzdG9yZS5vblJlYWRFcnJvci5jYWxsKHN0b3JlLCBlcnIsIGZpbGVJZCwgZmlsZSk7XG5cdFx0cmVzLmVuZCgpO1xuXHR9KSk7XG5cblx0d3Mub24oJ2Nsb3NlJywgZnVuY3Rpb24oKSB7XG5cdFx0Ly8gQ2xvc2Ugb3V0cHV0IHN0cmVhbSBhdCB0aGUgZW5kXG5cdFx0d3MuZW1pdCgnZW5kJyk7XG5cdH0pO1xuXG5cdGNvbnN0IGFjY2VwdCA9IHJlcS5oZWFkZXJzWydhY2NlcHQtZW5jb2RpbmcnXSB8fCAnJztcblxuXHQvLyBUcmFuc2Zvcm0gc3RyZWFtXG5cdHN0b3JlLnRyYW5zZm9ybVJlYWQocnMsIHdzLCBmaWxlSWQsIGZpbGUsIHJlcSk7XG5cdGNvbnN0IHJhbmdlID0gZ2V0Qnl0ZVJhbmdlKHJlcS5oZWFkZXJzLnJhbmdlKTtcblx0bGV0IG91dF9vZl9yYW5nZSA9IGZhbHNlO1xuXHRpZiAocmFuZ2UpIHtcblx0XHRvdXRfb2ZfcmFuZ2UgPSAocmFuZ2Uuc3RhcnQgPiBmaWxlLnNpemUpIHx8IChyYW5nZS5zdG9wIDw9IHJhbmdlLnN0YXJ0KSB8fCAocmFuZ2Uuc3RvcCA+IGZpbGUuc2l6ZSk7XG5cdH1cblxuXHQvLyBDb21wcmVzcyBkYXRhIHVzaW5nIGd6aXBcblx0aWYgKGFjY2VwdC5tYXRjaCgvXFxiZ3ppcFxcYi8pICYmIHJhbmdlID09PSBudWxsKSB7XG5cdFx0cmVzLnNldEhlYWRlcignQ29udGVudC1FbmNvZGluZycsICdnemlwJyk7XG5cdFx0cmVzLnJlbW92ZUhlYWRlcignQ29udGVudC1MZW5ndGgnKTtcblx0XHRyZXMud3JpdGVIZWFkKDIwMCk7XG5cdFx0d3MucGlwZSh6bGliLmNyZWF0ZUd6aXAoKSkucGlwZShyZXMpO1xuXHR9IGVsc2UgaWYgKGFjY2VwdC5tYXRjaCgvXFxiZGVmbGF0ZVxcYi8pICYmIHJhbmdlID09PSBudWxsKSB7XG5cdFx0Ly8gQ29tcHJlc3MgZGF0YSB1c2luZyBkZWZsYXRlXG5cdFx0cmVzLnNldEhlYWRlcignQ29udGVudC1FbmNvZGluZycsICdkZWZsYXRlJyk7XG5cdFx0cmVzLnJlbW92ZUhlYWRlcignQ29udGVudC1MZW5ndGgnKTtcblx0XHRyZXMud3JpdGVIZWFkKDIwMCk7XG5cdFx0d3MucGlwZSh6bGliLmNyZWF0ZURlZmxhdGUoKSkucGlwZShyZXMpO1xuXHR9IGVsc2UgaWYgKHJhbmdlICYmIG91dF9vZl9yYW5nZSkge1xuXHRcdC8vIG91dCBvZiByYW5nZSByZXF1ZXN0LCByZXR1cm4gNDE2XG5cdFx0cmVzLnJlbW92ZUhlYWRlcignQ29udGVudC1MZW5ndGgnKTtcblx0XHRyZXMucmVtb3ZlSGVhZGVyKCdDb250ZW50LVR5cGUnKTtcblx0XHRyZXMucmVtb3ZlSGVhZGVyKCdDb250ZW50LURpc3Bvc2l0aW9uJyk7XG5cdFx0cmVzLnJlbW92ZUhlYWRlcignTGFzdC1Nb2RpZmllZCcpO1xuXHRcdHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtUmFuZ2UnLCBgYnl0ZXMgKi8keyBmaWxlLnNpemUgfWApO1xuXHRcdHJlcy53cml0ZUhlYWQoNDE2KTtcblx0XHRyZXMuZW5kKCk7XG5cdH0gZWxzZSBpZiAocmFuZ2UpIHtcblx0XHRyZXMuc2V0SGVhZGVyKCdDb250ZW50LVJhbmdlJywgYGJ5dGVzICR7IHJhbmdlLnN0YXJ0IH0tJHsgcmFuZ2Uuc3RvcCB9LyR7IGZpbGUuc2l6ZSB9YCk7XG5cdFx0cmVzLnJlbW92ZUhlYWRlcignQ29udGVudC1MZW5ndGgnKTtcblx0XHRyZXMuc2V0SGVhZGVyKCdDb250ZW50LUxlbmd0aCcsIHJhbmdlLnN0b3AgLSByYW5nZS5zdGFydCArIDEpO1xuXHRcdHJlcy53cml0ZUhlYWQoMjA2KTtcblx0XHRsb2dnZXIuZGVidWcoJ0ZpbGUgdXBsb2FkIGV4dHJhY3RpbmcgcmFuZ2UnKTtcblx0XHR3cy5waXBlKG5ldyBFeHRyYWN0UmFuZ2UoeyBzdGFydDogcmFuZ2Uuc3RhcnQsIHN0b3A6IHJhbmdlLnN0b3AgfSkpLnBpcGUocmVzKTtcblx0fSBlbHNlIHtcblx0XHRyZXMud3JpdGVIZWFkKDIwMCk7XG5cdFx0d3MucGlwZShyZXMpO1xuXHR9XG59O1xuXG5jb25zdCBjb3B5RnJvbUdyaWRGUyA9IGZ1bmN0aW9uKHN0b3JlTmFtZSwgZmlsZUlkLCBmaWxlLCBvdXQpIHtcblx0Y29uc3Qgc3RvcmUgPSBVcGxvYWRGUy5nZXRTdG9yZShzdG9yZU5hbWUpO1xuXHRjb25zdCBycyA9IHN0b3JlLmdldFJlYWRTdHJlYW0oZmlsZUlkLCBmaWxlKTtcblxuXHRbcnMsIG91dF0uZm9yRWFjaChzdHJlYW0gPT4gc3RyZWFtLm9uKCdlcnJvcicsIGZ1bmN0aW9uKGVycikge1xuXHRcdHN0b3JlLm9uUmVhZEVycm9yLmNhbGwoc3RvcmUsIGVyciwgZmlsZUlkLCBmaWxlKTtcblx0XHRvdXQuZW5kKCk7XG5cdH0pKTtcblxuXHRycy5waXBlKG91dCk7XG59O1xuXG5GaWxlVXBsb2FkLmNvbmZpZ3VyZVVwbG9hZHNTdG9yZSgnR3JpZEZTJywgJ0dyaWRGUzpVcGxvYWRzJywge1xuXHRjb2xsZWN0aW9uTmFtZTogJ3JvY2tldGNoYXRfdXBsb2Fkcydcbn0pO1xuXG5GaWxlVXBsb2FkLmNvbmZpZ3VyZVVwbG9hZHNTdG9yZSgnR3JpZEZTJywgJ0dyaWRGUzpVc2VyRGF0YUZpbGVzJywge1xuXHRjb2xsZWN0aW9uTmFtZTogJ3JvY2tldGNoYXRfdXNlckRhdGFGaWxlcydcbn0pO1xuXG4vLyBERVBSRUNBVEVEOiBiYWNrd2FyZHMgY29tcGF0aWJpbGl0eSAocmVtb3ZlKVxuVXBsb2FkRlMuZ2V0U3RvcmVzKClbJ3JvY2tldGNoYXRfdXBsb2FkcyddID0gVXBsb2FkRlMuZ2V0U3RvcmVzKClbJ0dyaWRGUzpVcGxvYWRzJ107XG5cbkZpbGVVcGxvYWQuY29uZmlndXJlVXBsb2Fkc1N0b3JlKCdHcmlkRlMnLCAnR3JpZEZTOkF2YXRhcnMnLCB7XG5cdGNvbGxlY3Rpb25OYW1lOiAncm9ja2V0Y2hhdF9hdmF0YXJzJ1xufSk7XG5cblxubmV3IEZpbGVVcGxvYWRDbGFzcyh7XG5cdG5hbWU6ICdHcmlkRlM6VXBsb2FkcycsXG5cblx0Z2V0KGZpbGUsIHJlcSwgcmVzKSB7XG5cdFx0ZmlsZSA9IEZpbGVVcGxvYWQuYWRkRXh0ZW5zaW9uVG8oZmlsZSk7XG5cblx0XHRyZXMuc2V0SGVhZGVyKCdDb250ZW50LURpc3Bvc2l0aW9uJywgYGF0dGFjaG1lbnQ7IGZpbGVuYW1lKj1VVEYtOCcnJHsgZW5jb2RlVVJJQ29tcG9uZW50KGZpbGUubmFtZSkgfWApO1xuXHRcdHJlcy5zZXRIZWFkZXIoJ0xhc3QtTW9kaWZpZWQnLCBmaWxlLnVwbG9hZGVkQXQudG9VVENTdHJpbmcoKSk7XG5cdFx0cmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgZmlsZS50eXBlKTtcblx0XHRyZXMuc2V0SGVhZGVyKCdDb250ZW50LUxlbmd0aCcsIGZpbGUuc2l6ZSk7XG5cblx0XHRyZXR1cm4gcmVhZEZyb21HcmlkRlMoZmlsZS5zdG9yZSwgZmlsZS5faWQsIGZpbGUsIHJlcSwgcmVzKTtcblx0fSxcblxuXHRjb3B5KGZpbGUsIG91dCkge1xuXHRcdGNvcHlGcm9tR3JpZEZTKGZpbGUuc3RvcmUsIGZpbGUuX2lkLCBmaWxlLCBvdXQpO1xuXHR9XG59KTtcblxubmV3IEZpbGVVcGxvYWRDbGFzcyh7XG5cdG5hbWU6ICdHcmlkRlM6VXNlckRhdGFGaWxlcycsXG5cblx0Z2V0KGZpbGUsIHJlcSwgcmVzKSB7XG5cdFx0ZmlsZSA9IEZpbGVVcGxvYWQuYWRkRXh0ZW5zaW9uVG8oZmlsZSk7XG5cblx0XHRyZXMuc2V0SGVhZGVyKCdDb250ZW50LURpc3Bvc2l0aW9uJywgYGF0dGFjaG1lbnQ7IGZpbGVuYW1lKj1VVEYtOCcnJHsgZW5jb2RlVVJJQ29tcG9uZW50KGZpbGUubmFtZSkgfWApO1xuXHRcdHJlcy5zZXRIZWFkZXIoJ0xhc3QtTW9kaWZpZWQnLCBmaWxlLnVwbG9hZGVkQXQudG9VVENTdHJpbmcoKSk7XG5cdFx0cmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgZmlsZS50eXBlKTtcblx0XHRyZXMuc2V0SGVhZGVyKCdDb250ZW50LUxlbmd0aCcsIGZpbGUuc2l6ZSk7XG5cblx0XHRyZXR1cm4gcmVhZEZyb21HcmlkRlMoZmlsZS5zdG9yZSwgZmlsZS5faWQsIGZpbGUsIHJlcSwgcmVzKTtcblx0fSxcblxuXHRjb3B5KGZpbGUsIG91dCkge1xuXHRcdGNvcHlGcm9tR3JpZEZTKGZpbGUuc3RvcmUsIGZpbGUuX2lkLCBmaWxlLCBvdXQpO1xuXHR9XG59KTtcblxubmV3IEZpbGVVcGxvYWRDbGFzcyh7XG5cdG5hbWU6ICdHcmlkRlM6QXZhdGFycycsXG5cblx0Z2V0KGZpbGUsIHJlcSwgcmVzKSB7XG5cdFx0ZmlsZSA9IEZpbGVVcGxvYWQuYWRkRXh0ZW5zaW9uVG8oZmlsZSk7XG5cblx0XHRyZXR1cm4gcmVhZEZyb21HcmlkRlMoZmlsZS5zdG9yZSwgZmlsZS5faWQsIGZpbGUsIHJlcSwgcmVzKTtcblx0fVxufSk7XG4iLCIvKiBnbG9iYWxzIFNsaW5nc2hvdCwgRmlsZVVwbG9hZCAqL1xuaW1wb3J0IF8gZnJvbSAndW5kZXJzY29yZSc7XG5cbmNvbnN0IGNvbmZpZ3VyZVNsaW5nc2hvdCA9IF8uZGVib3VuY2UoKCkgPT4ge1xuXHRjb25zdCB0eXBlID0gUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0ZpbGVVcGxvYWRfU3RvcmFnZV9UeXBlJyk7XG5cdGNvbnN0IGJ1Y2tldCA9IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdGaWxlVXBsb2FkX1MzX0J1Y2tldCcpO1xuXHRjb25zdCBhY2wgPSBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnRmlsZVVwbG9hZF9TM19BY2wnKTtcblx0Y29uc3QgYWNjZXNzS2V5ID0gUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0ZpbGVVcGxvYWRfUzNfQVdTQWNjZXNzS2V5SWQnKTtcblx0Y29uc3Qgc2VjcmV0S2V5ID0gUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0ZpbGVVcGxvYWRfUzNfQVdTU2VjcmV0QWNjZXNzS2V5Jyk7XG5cdGNvbnN0IGNkbiA9IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdGaWxlVXBsb2FkX1MzX0NETicpO1xuXHRjb25zdCByZWdpb24gPSBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnRmlsZVVwbG9hZF9TM19SZWdpb24nKTtcblx0Y29uc3QgYnVja2V0VXJsID0gUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0ZpbGVVcGxvYWRfUzNfQnVja2V0VVJMJyk7XG5cblx0ZGVsZXRlIFNsaW5nc2hvdC5fZGlyZWN0aXZlc1sncm9ja2V0Y2hhdC11cGxvYWRzJ107XG5cblx0aWYgKHR5cGUgPT09ICdBbWF6b25TMycgJiYgIV8uaXNFbXB0eShidWNrZXQpICYmICFfLmlzRW1wdHkoYWNjZXNzS2V5KSAmJiAhXy5pc0VtcHR5KHNlY3JldEtleSkpIHtcblx0XHRpZiAoU2xpbmdzaG90Ll9kaXJlY3RpdmVzWydyb2NrZXRjaGF0LXVwbG9hZHMnXSkge1xuXHRcdFx0ZGVsZXRlIFNsaW5nc2hvdC5fZGlyZWN0aXZlc1sncm9ja2V0Y2hhdC11cGxvYWRzJ107XG5cdFx0fVxuXHRcdGNvbnN0IGNvbmZpZyA9IHtcblx0XHRcdGJ1Y2tldCxcblx0XHRcdGtleShmaWxlLCBtZXRhQ29udGV4dCkge1xuXHRcdFx0XHRjb25zdCBpZCA9IFJhbmRvbS5pZCgpO1xuXHRcdFx0XHRjb25zdCBwYXRoID0gYCR7IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCd1bmlxdWVJRCcpIH0vdXBsb2Fkcy8keyBtZXRhQ29udGV4dC5yaWQgfS8keyB0aGlzLnVzZXJJZCB9LyR7IGlkIH1gO1xuXG5cdFx0XHRcdGNvbnN0IHVwbG9hZCA9IHtcblx0XHRcdFx0XHRfaWQ6IGlkLFxuXHRcdFx0XHRcdHJpZDogbWV0YUNvbnRleHQucmlkLFxuXHRcdFx0XHRcdEFtYXpvblMzOiB7XG5cdFx0XHRcdFx0XHRwYXRoXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9O1xuXG5cdFx0XHRcdFJvY2tldENoYXQubW9kZWxzLlVwbG9hZHMuaW5zZXJ0RmlsZUluaXQodGhpcy51c2VySWQsICdBbWF6b25TMzpVcGxvYWRzJywgZmlsZSwgdXBsb2FkKTtcblxuXHRcdFx0XHRyZXR1cm4gcGF0aDtcblx0XHRcdH0sXG5cdFx0XHRBV1NBY2Nlc3NLZXlJZDogYWNjZXNzS2V5LFxuXHRcdFx0QVdTU2VjcmV0QWNjZXNzS2V5OiBzZWNyZXRLZXlcblx0XHR9O1xuXG5cdFx0aWYgKCFfLmlzRW1wdHkoYWNsKSkge1xuXHRcdFx0Y29uZmlnLmFjbCA9IGFjbDtcblx0XHR9XG5cblx0XHRpZiAoIV8uaXNFbXB0eShjZG4pKSB7XG5cdFx0XHRjb25maWcuY2RuID0gY2RuO1xuXHRcdH1cblxuXHRcdGlmICghXy5pc0VtcHR5KHJlZ2lvbikpIHtcblx0XHRcdGNvbmZpZy5yZWdpb24gPSByZWdpb247XG5cdFx0fVxuXG5cdFx0aWYgKCFfLmlzRW1wdHkoYnVja2V0VXJsKSkge1xuXHRcdFx0Y29uZmlnLmJ1Y2tldFVybCA9IGJ1Y2tldFVybDtcblx0XHR9XG5cblx0XHR0cnkge1xuXHRcdFx0U2xpbmdzaG90LmNyZWF0ZURpcmVjdGl2ZSgncm9ja2V0Y2hhdC11cGxvYWRzJywgU2xpbmdzaG90LlMzU3RvcmFnZSwgY29uZmlnKTtcblx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRjb25zb2xlLmVycm9yKCdFcnJvciBjb25maWd1cmluZyBTMyAtPicsIGUubWVzc2FnZSk7XG5cdFx0fVxuXHR9XG59LCA1MDApO1xuXG5Sb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnRmlsZVVwbG9hZF9TdG9yYWdlX1R5cGUnLCBjb25maWd1cmVTbGluZ3Nob3QpO1xuUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoL15GaWxlVXBsb2FkX1MzXy8sIGNvbmZpZ3VyZVNsaW5nc2hvdCk7XG5cblxuXG5jb25zdCBjcmVhdGVHb29nbGVTdG9yYWdlRGlyZWN0aXZlID0gXy5kZWJvdW5jZSgoKSA9PiB7XG5cdGNvbnN0IHR5cGUgPSBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnRmlsZVVwbG9hZF9TdG9yYWdlX1R5cGUnKTtcblx0Y29uc3QgYnVja2V0ID0gUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0ZpbGVVcGxvYWRfR29vZ2xlU3RvcmFnZV9CdWNrZXQnKTtcblx0Y29uc3QgYWNjZXNzSWQgPSBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnRmlsZVVwbG9hZF9Hb29nbGVTdG9yYWdlX0FjY2Vzc0lkJyk7XG5cdGNvbnN0IHNlY3JldCA9IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdGaWxlVXBsb2FkX0dvb2dsZVN0b3JhZ2VfU2VjcmV0Jyk7XG5cblx0ZGVsZXRlIFNsaW5nc2hvdC5fZGlyZWN0aXZlc1sncm9ja2V0Y2hhdC11cGxvYWRzLWdzJ107XG5cblx0aWYgKHR5cGUgPT09ICdHb29nbGVDbG91ZFN0b3JhZ2UnICYmICFfLmlzRW1wdHkoc2VjcmV0KSAmJiAhXy5pc0VtcHR5KGFjY2Vzc0lkKSAmJiAhXy5pc0VtcHR5KGJ1Y2tldCkpIHtcblx0XHRpZiAoU2xpbmdzaG90Ll9kaXJlY3RpdmVzWydyb2NrZXRjaGF0LXVwbG9hZHMtZ3MnXSkge1xuXHRcdFx0ZGVsZXRlIFNsaW5nc2hvdC5fZGlyZWN0aXZlc1sncm9ja2V0Y2hhdC11cGxvYWRzLWdzJ107XG5cdFx0fVxuXG5cdFx0Y29uc3QgY29uZmlnID0ge1xuXHRcdFx0YnVja2V0LFxuXHRcdFx0R29vZ2xlQWNjZXNzSWQ6IGFjY2Vzc0lkLFxuXHRcdFx0R29vZ2xlU2VjcmV0S2V5OiBzZWNyZXQsXG5cdFx0XHRrZXkoZmlsZSwgbWV0YUNvbnRleHQpIHtcblx0XHRcdFx0Y29uc3QgaWQgPSBSYW5kb20uaWQoKTtcblx0XHRcdFx0Y29uc3QgcGF0aCA9IGAkeyBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgndW5pcXVlSUQnKSB9L3VwbG9hZHMvJHsgbWV0YUNvbnRleHQucmlkIH0vJHsgdGhpcy51c2VySWQgfS8keyBpZCB9YDtcblxuXHRcdFx0XHRjb25zdCB1cGxvYWQgPSB7XG5cdFx0XHRcdFx0X2lkOiBpZCxcblx0XHRcdFx0XHRyaWQ6IG1ldGFDb250ZXh0LnJpZCxcblx0XHRcdFx0XHRHb29nbGVTdG9yYWdlOiB7XG5cdFx0XHRcdFx0XHRwYXRoXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9O1xuXG5cdFx0XHRcdFJvY2tldENoYXQubW9kZWxzLlVwbG9hZHMuaW5zZXJ0RmlsZUluaXQodGhpcy51c2VySWQsICdHb29nbGVDbG91ZFN0b3JhZ2U6VXBsb2FkcycsIGZpbGUsIHVwbG9hZCk7XG5cblx0XHRcdFx0cmV0dXJuIHBhdGg7XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdHRyeSB7XG5cdFx0XHRTbGluZ3Nob3QuY3JlYXRlRGlyZWN0aXZlKCdyb2NrZXRjaGF0LXVwbG9hZHMtZ3MnLCBTbGluZ3Nob3QuR29vZ2xlQ2xvdWQsIGNvbmZpZyk7XG5cdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0Y29uc29sZS5lcnJvcignRXJyb3IgY29uZmlndXJpbmcgR29vZ2xlQ2xvdWRTdG9yYWdlIC0+JywgZS5tZXNzYWdlKTtcblx0XHR9XG5cdH1cbn0sIDUwMCk7XG5cblJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdGaWxlVXBsb2FkX1N0b3JhZ2VfVHlwZScsIGNyZWF0ZUdvb2dsZVN0b3JhZ2VEaXJlY3RpdmUpO1xuUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoL15GaWxlVXBsb2FkX0dvb2dsZVN0b3JhZ2VfLywgY3JlYXRlR29vZ2xlU3RvcmFnZURpcmVjdGl2ZSk7XG4iLCJpbXBvcnQgXyBmcm9tICd1bmRlcnNjb3JlJztcblxuTWV0ZW9yLm1ldGhvZHMoe1xuXHRhc3luYyAnc2VuZEZpbGVNZXNzYWdlJyhyb29tSWQsIHN0b3JlLCBmaWxlLCBtc2dEYXRhID0ge30pIHtcblx0XHRpZiAoIU1ldGVvci51c2VySWQoKSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItaW52YWxpZC11c2VyJywgJ0ludmFsaWQgdXNlcicsIHsgbWV0aG9kOiAnc2VuZEZpbGVNZXNzYWdlJyB9KTtcblx0XHR9XG5cblx0XHRjb25zdCByb29tID0gTWV0ZW9yLmNhbGwoJ2NhbkFjY2Vzc1Jvb20nLCByb29tSWQsIE1ldGVvci51c2VySWQoKSk7XG5cblx0XHRpZiAoIXJvb20pIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cblx0XHRjaGVjayhtc2dEYXRhLCB7XG5cdFx0XHRhdmF0YXI6IE1hdGNoLk9wdGlvbmFsKFN0cmluZyksXG5cdFx0XHRlbW9qaTogTWF0Y2guT3B0aW9uYWwoU3RyaW5nKSxcblx0XHRcdGFsaWFzOiBNYXRjaC5PcHRpb25hbChTdHJpbmcpLFxuXHRcdFx0Z3JvdXBhYmxlOiBNYXRjaC5PcHRpb25hbChCb29sZWFuKSxcblx0XHRcdG1zZzogTWF0Y2guT3B0aW9uYWwoU3RyaW5nKVxuXHRcdH0pO1xuXG5cdFx0Um9ja2V0Q2hhdC5tb2RlbHMuVXBsb2Fkcy51cGRhdGVGaWxlQ29tcGxldGUoZmlsZS5faWQsIE1ldGVvci51c2VySWQoKSwgXy5vbWl0KGZpbGUsICdfaWQnKSk7XG5cblx0XHRjb25zdCBmaWxlVXJsID0gYC9maWxlLXVwbG9hZC8keyBmaWxlLl9pZCB9LyR7IGVuY29kZVVSSShmaWxlLm5hbWUpIH1gO1xuXG5cdFx0Y29uc3QgYXR0YWNobWVudCA9IHtcblx0XHRcdHRpdGxlOiBmaWxlLm5hbWUsXG5cdFx0XHR0eXBlOiAnZmlsZScsXG5cdFx0XHRkZXNjcmlwdGlvbjogZmlsZS5kZXNjcmlwdGlvbixcblx0XHRcdHRpdGxlX2xpbms6IGZpbGVVcmwsXG5cdFx0XHR0aXRsZV9saW5rX2Rvd25sb2FkOiB0cnVlXG5cdFx0fTtcblxuXHRcdGlmICgvXmltYWdlXFwvLisvLnRlc3QoZmlsZS50eXBlKSkge1xuXHRcdFx0YXR0YWNobWVudC5pbWFnZV91cmwgPSBmaWxlVXJsO1xuXHRcdFx0YXR0YWNobWVudC5pbWFnZV90eXBlID0gZmlsZS50eXBlO1xuXHRcdFx0YXR0YWNobWVudC5pbWFnZV9zaXplID0gZmlsZS5zaXplO1xuXHRcdFx0aWYgKGZpbGUuaWRlbnRpZnkgJiYgZmlsZS5pZGVudGlmeS5zaXplKSB7XG5cdFx0XHRcdGF0dGFjaG1lbnQuaW1hZ2VfZGltZW5zaW9ucyA9IGZpbGUuaWRlbnRpZnkuc2l6ZTtcblx0XHRcdH1cblx0XHRcdGF0dGFjaG1lbnQuaW1hZ2VfcHJldmlldyA9IGF3YWl0IEZpbGVVcGxvYWQucmVzaXplSW1hZ2VQcmV2aWV3KGZpbGUpO1xuXHRcdH0gZWxzZSBpZiAoL15hdWRpb1xcLy4rLy50ZXN0KGZpbGUudHlwZSkpIHtcblx0XHRcdGF0dGFjaG1lbnQuYXVkaW9fdXJsID0gZmlsZVVybDtcblx0XHRcdGF0dGFjaG1lbnQuYXVkaW9fdHlwZSA9IGZpbGUudHlwZTtcblx0XHRcdGF0dGFjaG1lbnQuYXVkaW9fc2l6ZSA9IGZpbGUuc2l6ZTtcblx0XHR9IGVsc2UgaWYgKC9edmlkZW9cXC8uKy8udGVzdChmaWxlLnR5cGUpKSB7XG5cdFx0XHRhdHRhY2htZW50LnZpZGVvX3VybCA9IGZpbGVVcmw7XG5cdFx0XHRhdHRhY2htZW50LnZpZGVvX3R5cGUgPSBmaWxlLnR5cGU7XG5cdFx0XHRhdHRhY2htZW50LnZpZGVvX3NpemUgPSBmaWxlLnNpemU7XG5cdFx0fVxuXG5cdFx0Y29uc3QgdXNlciA9IE1ldGVvci51c2VyKCk7XG5cdFx0bGV0IG1zZyA9IE9iamVjdC5hc3NpZ24oe1xuXHRcdFx0X2lkOiBSYW5kb20uaWQoKSxcblx0XHRcdHJpZDogcm9vbUlkLFxuXHRcdFx0dHM6IG5ldyBEYXRlKCksXG5cdFx0XHRtc2c6ICcnLFxuXHRcdFx0ZmlsZToge1xuXHRcdFx0XHRfaWQ6IGZpbGUuX2lkLFxuXHRcdFx0XHRuYW1lOiBmaWxlLm5hbWUsXG5cdFx0XHRcdHR5cGU6IGZpbGUudHlwZVxuXHRcdFx0fSxcblx0XHRcdGdyb3VwYWJsZTogZmFsc2UsXG5cdFx0XHRhdHRhY2htZW50czogW2F0dGFjaG1lbnRdXG5cdFx0fSwgbXNnRGF0YSk7XG5cblx0XHRtc2cgPSBNZXRlb3IuY2FsbCgnc2VuZE1lc3NhZ2UnLCBtc2cpO1xuXG5cdFx0TWV0ZW9yLmRlZmVyKCgpID0+IFJvY2tldENoYXQuY2FsbGJhY2tzLnJ1bignYWZ0ZXJGaWxlVXBsb2FkJywgeyB1c2VyLCByb29tLCBtZXNzYWdlOiBtc2cgfSkpO1xuXG5cdFx0cmV0dXJuIG1zZztcblx0fVxufSk7XG4iLCIvKiBnbG9iYWxzIFVwbG9hZEZTICovXG5cbmxldCBwcm90ZWN0ZWRGaWxlcztcblxuUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0ZpbGVVcGxvYWRfUHJvdGVjdEZpbGVzJywgZnVuY3Rpb24oa2V5LCB2YWx1ZSkge1xuXHRwcm90ZWN0ZWRGaWxlcyA9IHZhbHVlO1xufSk7XG5cbk1ldGVvci5tZXRob2RzKHtcblx0Z2V0UzNGaWxlVXJsKGZpbGVJZCkge1xuXHRcdGlmIChwcm90ZWN0ZWRGaWxlcyAmJiAhTWV0ZW9yLnVzZXJJZCgpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLXVzZXInLCAnSW52YWxpZCB1c2VyJywgeyBtZXRob2Q6ICdzZW5kRmlsZU1lc3NhZ2UnIH0pO1xuXHRcdH1cblx0XHRjb25zdCBmaWxlID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXBsb2Fkcy5maW5kT25lQnlJZChmaWxlSWQpO1xuXG5cdFx0cmV0dXJuIFVwbG9hZEZTLmdldFN0b3JlKCdBbWF6b25TMzpVcGxvYWRzJykuZ2V0UmVkaXJlY3RVUkwoZmlsZSk7XG5cdH1cbn0pO1xuIiwiUm9ja2V0Q2hhdC5zZXR0aW5ncy5hZGRHcm91cCgnRmlsZVVwbG9hZCcsIGZ1bmN0aW9uKCkge1xuXHR0aGlzLmFkZCgnRmlsZVVwbG9hZF9FbmFibGVkJywgdHJ1ZSwge1xuXHRcdHR5cGU6ICdib29sZWFuJyxcblx0XHRwdWJsaWM6IHRydWVcblx0fSk7XG5cblx0dGhpcy5hZGQoJ0ZpbGVVcGxvYWRfTWF4RmlsZVNpemUnLCAyMDk3MTUyLCB7XG5cdFx0dHlwZTogJ2ludCcsXG5cdFx0cHVibGljOiB0cnVlXG5cdH0pO1xuXG5cdHRoaXMuYWRkKCdGaWxlVXBsb2FkX01lZGlhVHlwZVdoaXRlTGlzdCcsICdpbWFnZS8qLGF1ZGlvLyosdmlkZW8vKixhcHBsaWNhdGlvbi96aXAsYXBwbGljYXRpb24veC1yYXItY29tcHJlc3NlZCxhcHBsaWNhdGlvbi9wZGYsdGV4dC9wbGFpbixhcHBsaWNhdGlvbi9tc3dvcmQsYXBwbGljYXRpb24vdm5kLm9wZW54bWxmb3JtYXRzLW9mZmljZWRvY3VtZW50LndvcmRwcm9jZXNzaW5nbWwuZG9jdW1lbnQnLCB7XG5cdFx0dHlwZTogJ3N0cmluZycsXG5cdFx0cHVibGljOiB0cnVlLFxuXHRcdGkxOG5EZXNjcmlwdGlvbjogJ0ZpbGVVcGxvYWRfTWVkaWFUeXBlV2hpdGVMaXN0RGVzY3JpcHRpb24nXG5cdH0pO1xuXG5cdHRoaXMuYWRkKCdGaWxlVXBsb2FkX1Byb3RlY3RGaWxlcycsIHRydWUsIHtcblx0XHR0eXBlOiAnYm9vbGVhbicsXG5cdFx0cHVibGljOiB0cnVlLFxuXHRcdGkxOG5EZXNjcmlwdGlvbjogJ0ZpbGVVcGxvYWRfUHJvdGVjdEZpbGVzRGVzY3JpcHRpb24nXG5cdH0pO1xuXG5cdHRoaXMuYWRkKCdGaWxlVXBsb2FkX1N0b3JhZ2VfVHlwZScsICdHcmlkRlMnLCB7XG5cdFx0dHlwZTogJ3NlbGVjdCcsXG5cdFx0dmFsdWVzOiBbe1xuXHRcdFx0a2V5OiAnR3JpZEZTJyxcblx0XHRcdGkxOG5MYWJlbDogJ0dyaWRGUydcblx0XHR9LCB7XG5cdFx0XHRrZXk6ICdBbWF6b25TMycsXG5cdFx0XHRpMThuTGFiZWw6ICdBbWF6b25TMydcblx0XHR9LCB7XG5cdFx0XHRrZXk6ICdHb29nbGVDbG91ZFN0b3JhZ2UnLFxuXHRcdFx0aTE4bkxhYmVsOiAnR29vZ2xlQ2xvdWRTdG9yYWdlJ1xuXHRcdH0sIHtcblx0XHRcdGtleTogJ0ZpbGVTeXN0ZW0nLFxuXHRcdFx0aTE4bkxhYmVsOiAnRmlsZVN5c3RlbSdcblx0XHR9XSxcblx0XHRwdWJsaWM6IHRydWVcblx0fSk7XG5cblx0dGhpcy5zZWN0aW9uKCdBbWF6b24gUzMnLCBmdW5jdGlvbigpIHtcblx0XHR0aGlzLmFkZCgnRmlsZVVwbG9hZF9TM19CdWNrZXQnLCAnJywge1xuXHRcdFx0dHlwZTogJ3N0cmluZycsXG5cdFx0XHRlbmFibGVRdWVyeToge1xuXHRcdFx0XHRfaWQ6ICdGaWxlVXBsb2FkX1N0b3JhZ2VfVHlwZScsXG5cdFx0XHRcdHZhbHVlOiAnQW1hem9uUzMnXG5cdFx0XHR9XG5cdFx0fSk7XG5cdFx0dGhpcy5hZGQoJ0ZpbGVVcGxvYWRfUzNfQWNsJywgJycsIHtcblx0XHRcdHR5cGU6ICdzdHJpbmcnLFxuXHRcdFx0ZW5hYmxlUXVlcnk6IHtcblx0XHRcdFx0X2lkOiAnRmlsZVVwbG9hZF9TdG9yYWdlX1R5cGUnLFxuXHRcdFx0XHR2YWx1ZTogJ0FtYXpvblMzJ1xuXHRcdFx0fVxuXHRcdH0pO1xuXHRcdHRoaXMuYWRkKCdGaWxlVXBsb2FkX1MzX0FXU0FjY2Vzc0tleUlkJywgJycsIHtcblx0XHRcdHR5cGU6ICdzdHJpbmcnLFxuXHRcdFx0ZW5hYmxlUXVlcnk6IHtcblx0XHRcdFx0X2lkOiAnRmlsZVVwbG9hZF9TdG9yYWdlX1R5cGUnLFxuXHRcdFx0XHR2YWx1ZTogJ0FtYXpvblMzJ1xuXHRcdFx0fVxuXHRcdH0pO1xuXHRcdHRoaXMuYWRkKCdGaWxlVXBsb2FkX1MzX0FXU1NlY3JldEFjY2Vzc0tleScsICcnLCB7XG5cdFx0XHR0eXBlOiAnc3RyaW5nJyxcblx0XHRcdGVuYWJsZVF1ZXJ5OiB7XG5cdFx0XHRcdF9pZDogJ0ZpbGVVcGxvYWRfU3RvcmFnZV9UeXBlJyxcblx0XHRcdFx0dmFsdWU6ICdBbWF6b25TMydcblx0XHRcdH1cblx0XHR9KTtcblx0XHR0aGlzLmFkZCgnRmlsZVVwbG9hZF9TM19DRE4nLCAnJywge1xuXHRcdFx0dHlwZTogJ3N0cmluZycsXG5cdFx0XHRlbmFibGVRdWVyeToge1xuXHRcdFx0XHRfaWQ6ICdGaWxlVXBsb2FkX1N0b3JhZ2VfVHlwZScsXG5cdFx0XHRcdHZhbHVlOiAnQW1hem9uUzMnXG5cdFx0XHR9XG5cdFx0fSk7XG5cdFx0dGhpcy5hZGQoJ0ZpbGVVcGxvYWRfUzNfUmVnaW9uJywgJycsIHtcblx0XHRcdHR5cGU6ICdzdHJpbmcnLFxuXHRcdFx0ZW5hYmxlUXVlcnk6IHtcblx0XHRcdFx0X2lkOiAnRmlsZVVwbG9hZF9TdG9yYWdlX1R5cGUnLFxuXHRcdFx0XHR2YWx1ZTogJ0FtYXpvblMzJ1xuXHRcdFx0fVxuXHRcdH0pO1xuXHRcdHRoaXMuYWRkKCdGaWxlVXBsb2FkX1MzX0J1Y2tldFVSTCcsICcnLCB7XG5cdFx0XHR0eXBlOiAnc3RyaW5nJyxcblx0XHRcdGVuYWJsZVF1ZXJ5OiB7XG5cdFx0XHRcdF9pZDogJ0ZpbGVVcGxvYWRfU3RvcmFnZV9UeXBlJyxcblx0XHRcdFx0dmFsdWU6ICdBbWF6b25TMydcblx0XHRcdH0sXG5cdFx0XHRpMThuRGVzY3JpcHRpb246ICdPdmVycmlkZV9VUkxfdG9fd2hpY2hfZmlsZXNfYXJlX3VwbG9hZGVkX1RoaXNfdXJsX2Fsc29fdXNlZF9mb3JfZG93bmxvYWRzX3VubGVzc19hX0NETl9pc19naXZlbi4nXG5cdFx0fSk7XG5cdFx0dGhpcy5hZGQoJ0ZpbGVVcGxvYWRfUzNfU2lnbmF0dXJlVmVyc2lvbicsICd2NCcsIHtcblx0XHRcdHR5cGU6ICdzdHJpbmcnLFxuXHRcdFx0ZW5hYmxlUXVlcnk6IHtcblx0XHRcdFx0X2lkOiAnRmlsZVVwbG9hZF9TdG9yYWdlX1R5cGUnLFxuXHRcdFx0XHR2YWx1ZTogJ0FtYXpvblMzJ1xuXHRcdFx0fVxuXHRcdH0pO1xuXHRcdHRoaXMuYWRkKCdGaWxlVXBsb2FkX1MzX0ZvcmNlUGF0aFN0eWxlJywgZmFsc2UsIHtcblx0XHRcdHR5cGU6ICdib29sZWFuJyxcblx0XHRcdGVuYWJsZVF1ZXJ5OiB7XG5cdFx0XHRcdF9pZDogJ0ZpbGVVcGxvYWRfU3RvcmFnZV9UeXBlJyxcblx0XHRcdFx0dmFsdWU6ICdBbWF6b25TMydcblx0XHRcdH1cblx0XHR9KTtcblx0XHR0aGlzLmFkZCgnRmlsZVVwbG9hZF9TM19VUkxFeHBpcnlUaW1lU3BhbicsIDEyMCwge1xuXHRcdFx0dHlwZTogJ2ludCcsXG5cdFx0XHRlbmFibGVRdWVyeToge1xuXHRcdFx0XHRfaWQ6ICdGaWxlVXBsb2FkX1N0b3JhZ2VfVHlwZScsXG5cdFx0XHRcdHZhbHVlOiAnQW1hem9uUzMnXG5cdFx0XHR9LFxuXHRcdFx0aTE4bkRlc2NyaXB0aW9uOiAnRmlsZVVwbG9hZF9TM19VUkxFeHBpcnlUaW1lU3Bhbl9EZXNjcmlwdGlvbidcblx0XHR9KTtcblx0XHR0aGlzLmFkZCgnRmlsZVVwbG9hZF9TM19Qcm94eV9BdmF0YXJzJywgZmFsc2UsIHtcblx0XHRcdHR5cGU6ICdib29sZWFuJyxcblx0XHRcdGVuYWJsZVF1ZXJ5OiB7XG5cdFx0XHRcdF9pZDogJ0ZpbGVVcGxvYWRfU3RvcmFnZV9UeXBlJyxcblx0XHRcdFx0dmFsdWU6ICdBbWF6b25TMydcblx0XHRcdH1cblx0XHR9KTtcblx0XHR0aGlzLmFkZCgnRmlsZVVwbG9hZF9TM19Qcm94eV9VcGxvYWRzJywgZmFsc2UsIHtcblx0XHRcdHR5cGU6ICdib29sZWFuJyxcblx0XHRcdGVuYWJsZVF1ZXJ5OiB7XG5cdFx0XHRcdF9pZDogJ0ZpbGVVcGxvYWRfU3RvcmFnZV9UeXBlJyxcblx0XHRcdFx0dmFsdWU6ICdBbWF6b25TMydcblx0XHRcdH1cblx0XHR9KTtcblx0fSk7XG5cblx0dGhpcy5zZWN0aW9uKCdHb29nbGUgQ2xvdWQgU3RvcmFnZScsIGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuYWRkKCdGaWxlVXBsb2FkX0dvb2dsZVN0b3JhZ2VfQnVja2V0JywgJycsIHtcblx0XHRcdHR5cGU6ICdzdHJpbmcnLFxuXHRcdFx0cHJpdmF0ZTogdHJ1ZSxcblx0XHRcdGVuYWJsZVF1ZXJ5OiB7XG5cdFx0XHRcdF9pZDogJ0ZpbGVVcGxvYWRfU3RvcmFnZV9UeXBlJyxcblx0XHRcdFx0dmFsdWU6ICdHb29nbGVDbG91ZFN0b3JhZ2UnXG5cdFx0XHR9XG5cdFx0fSk7XG5cdFx0dGhpcy5hZGQoJ0ZpbGVVcGxvYWRfR29vZ2xlU3RvcmFnZV9BY2Nlc3NJZCcsICcnLCB7XG5cdFx0XHR0eXBlOiAnc3RyaW5nJyxcblx0XHRcdHByaXZhdGU6IHRydWUsXG5cdFx0XHRlbmFibGVRdWVyeToge1xuXHRcdFx0XHRfaWQ6ICdGaWxlVXBsb2FkX1N0b3JhZ2VfVHlwZScsXG5cdFx0XHRcdHZhbHVlOiAnR29vZ2xlQ2xvdWRTdG9yYWdlJ1xuXHRcdFx0fVxuXHRcdH0pO1xuXHRcdHRoaXMuYWRkKCdGaWxlVXBsb2FkX0dvb2dsZVN0b3JhZ2VfU2VjcmV0JywgJycsIHtcblx0XHRcdHR5cGU6ICdzdHJpbmcnLFxuXHRcdFx0bXVsdGlsaW5lOiB0cnVlLFxuXHRcdFx0cHJpdmF0ZTogdHJ1ZSxcblx0XHRcdGVuYWJsZVF1ZXJ5OiB7XG5cdFx0XHRcdF9pZDogJ0ZpbGVVcGxvYWRfU3RvcmFnZV9UeXBlJyxcblx0XHRcdFx0dmFsdWU6ICdHb29nbGVDbG91ZFN0b3JhZ2UnXG5cdFx0XHR9XG5cdFx0fSk7XG5cdFx0dGhpcy5hZGQoJ0ZpbGVVcGxvYWRfR29vZ2xlU3RvcmFnZV9Qcm94eV9BdmF0YXJzJywgZmFsc2UsIHtcblx0XHRcdHR5cGU6ICdib29sZWFuJyxcblx0XHRcdGVuYWJsZVF1ZXJ5OiB7XG5cdFx0XHRcdF9pZDogJ0ZpbGVVcGxvYWRfU3RvcmFnZV9UeXBlJyxcblx0XHRcdFx0dmFsdWU6ICdHb29nbGVDbG91ZFN0b3JhZ2UnXG5cdFx0XHR9XG5cdFx0fSk7XG5cdFx0dGhpcy5hZGQoJ0ZpbGVVcGxvYWRfR29vZ2xlU3RvcmFnZV9Qcm94eV9VcGxvYWRzJywgZmFsc2UsIHtcblx0XHRcdHR5cGU6ICdib29sZWFuJyxcblx0XHRcdGVuYWJsZVF1ZXJ5OiB7XG5cdFx0XHRcdF9pZDogJ0ZpbGVVcGxvYWRfU3RvcmFnZV9UeXBlJyxcblx0XHRcdFx0dmFsdWU6ICdHb29nbGVDbG91ZFN0b3JhZ2UnXG5cdFx0XHR9XG5cdFx0fSk7XG5cdH0pO1xuXG5cdHRoaXMuc2VjdGlvbignRmlsZSBTeXN0ZW0nLCBmdW5jdGlvbigpIHtcblx0XHR0aGlzLmFkZCgnRmlsZVVwbG9hZF9GaWxlU3lzdGVtUGF0aCcsICcnLCB7XG5cdFx0XHR0eXBlOiAnc3RyaW5nJyxcblx0XHRcdGVuYWJsZVF1ZXJ5OiB7XG5cdFx0XHRcdF9pZDogJ0ZpbGVVcGxvYWRfU3RvcmFnZV9UeXBlJyxcblx0XHRcdFx0dmFsdWU6ICdGaWxlU3lzdGVtJ1xuXHRcdFx0fVxuXHRcdH0pO1xuXHR9KTtcblxuXHR0aGlzLmFkZCgnRmlsZVVwbG9hZF9FbmFibGVkX0RpcmVjdCcsIHRydWUsIHtcblx0XHR0eXBlOiAnYm9vbGVhbicsXG5cdFx0cHVibGljOiB0cnVlXG5cdH0pO1xufSk7XG4iLCJpbXBvcnQge1VwbG9hZEZTfSBmcm9tICdtZXRlb3IvamFsaWs6dWZzJztcbmltcG9ydCBfIGZyb20gJ3VuZGVyc2NvcmUnO1xuaW1wb3J0IFMzIGZyb20gJ2F3cy1zZGsvY2xpZW50cy9zMyc7XG5pbXBvcnQgc3RyZWFtIGZyb20gJ3N0cmVhbSc7XG5cbi8qKlxuICogQW1hem9uUzMgc3RvcmVcbiAqIEBwYXJhbSBvcHRpb25zXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZXhwb3J0IGNsYXNzIEFtYXpvblMzU3RvcmUgZXh0ZW5kcyBVcGxvYWRGUy5TdG9yZSB7XG5cblx0Y29uc3RydWN0b3Iob3B0aW9ucykge1xuXHRcdC8vIERlZmF1bHQgb3B0aW9uc1xuXHRcdC8vIG9wdGlvbnMuc2VjcmV0QWNjZXNzS2V5LFxuXHRcdC8vIG9wdGlvbnMuYWNjZXNzS2V5SWQsXG5cdFx0Ly8gb3B0aW9ucy5yZWdpb24sXG5cdFx0Ly8gb3B0aW9ucy5zc2xFbmFibGVkIC8vIG9wdGlvbmFsXG5cblx0XHRvcHRpb25zID0gXy5leHRlbmQoe1xuXHRcdFx0aHR0cE9wdGlvbnM6IHtcblx0XHRcdFx0dGltZW91dDogNjAwMCxcblx0XHRcdFx0YWdlbnQ6IGZhbHNlXG5cdFx0XHR9XG5cdFx0fSwgb3B0aW9ucyk7XG5cblx0XHRzdXBlcihvcHRpb25zKTtcblxuXHRcdGNvbnN0IGNsYXNzT3B0aW9ucyA9IG9wdGlvbnM7XG5cblx0XHRjb25zdCBzMyA9IG5ldyBTMyhvcHRpb25zLmNvbm5lY3Rpb24pO1xuXG5cdFx0b3B0aW9ucy5nZXRQYXRoID0gb3B0aW9ucy5nZXRQYXRoIHx8IGZ1bmN0aW9uKGZpbGUpIHtcblx0XHRcdHJldHVybiBmaWxlLl9pZDtcblx0XHR9O1xuXG5cdFx0dGhpcy5nZXRQYXRoID0gZnVuY3Rpb24oZmlsZSkge1xuXHRcdFx0aWYgKGZpbGUuQW1hem9uUzMpIHtcblx0XHRcdFx0cmV0dXJuIGZpbGUuQW1hem9uUzMucGF0aDtcblx0XHRcdH1cblx0XHRcdC8vIENvbXBhdGliaWxpdHlcblx0XHRcdC8vIFRPRE86IE1pZ3JhdGlvblxuXHRcdFx0aWYgKGZpbGUuczMpIHtcblx0XHRcdFx0cmV0dXJuIGZpbGUuczMucGF0aCArIGZpbGUuX2lkO1xuXHRcdFx0fVxuXHRcdH07XG5cblx0XHR0aGlzLmdldFJlZGlyZWN0VVJMID0gZnVuY3Rpb24oZmlsZSkge1xuXHRcdFx0Y29uc3QgcGFyYW1zID0ge1xuXHRcdFx0XHRLZXk6IHRoaXMuZ2V0UGF0aChmaWxlKSxcblx0XHRcdFx0RXhwaXJlczogY2xhc3NPcHRpb25zLlVSTEV4cGlyeVRpbWVTcGFuXG5cdFx0XHR9O1xuXG5cdFx0XHRyZXR1cm4gczMuZ2V0U2lnbmVkVXJsKCdnZXRPYmplY3QnLCBwYXJhbXMpO1xuXHRcdH07XG5cblx0XHQvKipcblx0XHQgKiBDcmVhdGVzIHRoZSBmaWxlIGluIHRoZSBjb2xsZWN0aW9uXG5cdFx0ICogQHBhcmFtIGZpbGVcblx0XHQgKiBAcGFyYW0gY2FsbGJhY2tcblx0XHQgKiBAcmV0dXJuIHtzdHJpbmd9XG5cdFx0ICovXG5cdFx0dGhpcy5jcmVhdGUgPSBmdW5jdGlvbihmaWxlLCBjYWxsYmFjaykge1xuXHRcdFx0Y2hlY2soZmlsZSwgT2JqZWN0KTtcblxuXHRcdFx0aWYgKGZpbGUuX2lkID09IG51bGwpIHtcblx0XHRcdFx0ZmlsZS5faWQgPSBSYW5kb20uaWQoKTtcblx0XHRcdH1cblxuXHRcdFx0ZmlsZS5BbWF6b25TMyA9IHtcblx0XHRcdFx0cGF0aDogdGhpcy5vcHRpb25zLmdldFBhdGgoZmlsZSlcblx0XHRcdH07XG5cblx0XHRcdGZpbGUuc3RvcmUgPSB0aGlzLm9wdGlvbnMubmFtZTsgLy8gYXNzaWduIHN0b3JlIHRvIGZpbGVcblx0XHRcdHJldHVybiB0aGlzLmdldENvbGxlY3Rpb24oKS5pbnNlcnQoZmlsZSwgY2FsbGJhY2spO1xuXHRcdH07XG5cblx0XHQvKipcblx0XHQgKiBSZW1vdmVzIHRoZSBmaWxlXG5cdFx0ICogQHBhcmFtIGZpbGVJZFxuXHRcdCAqIEBwYXJhbSBjYWxsYmFja1xuXHRcdCAqL1xuXHRcdHRoaXMuZGVsZXRlID0gZnVuY3Rpb24oZmlsZUlkLCBjYWxsYmFjaykge1xuXHRcdFx0Y29uc3QgZmlsZSA9IHRoaXMuZ2V0Q29sbGVjdGlvbigpLmZpbmRPbmUoe19pZDogZmlsZUlkfSk7XG5cdFx0XHRjb25zdCBwYXJhbXMgPSB7XG5cdFx0XHRcdEtleTogdGhpcy5nZXRQYXRoKGZpbGUpXG5cdFx0XHR9O1xuXG5cdFx0XHRzMy5kZWxldGVPYmplY3QocGFyYW1zLCAoZXJyLCBkYXRhKSA9PiB7XG5cdFx0XHRcdGlmIChlcnIpIHtcblx0XHRcdFx0XHRjb25zb2xlLmVycm9yKGVycik7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRjYWxsYmFjayAmJiBjYWxsYmFjayhlcnIsIGRhdGEpO1xuXHRcdFx0fSk7XG5cdFx0fTtcblxuXHRcdC8qKlxuXHRcdCAqIFJldHVybnMgdGhlIGZpbGUgcmVhZCBzdHJlYW1cblx0XHQgKiBAcGFyYW0gZmlsZUlkXG5cdFx0ICogQHBhcmFtIGZpbGVcblx0XHQgKiBAcGFyYW0gb3B0aW9uc1xuXHRcdCAqIEByZXR1cm4geyp9XG5cdFx0ICovXG5cdFx0dGhpcy5nZXRSZWFkU3RyZWFtID0gZnVuY3Rpb24oZmlsZUlkLCBmaWxlLCBvcHRpb25zID0ge30pIHtcblx0XHRcdGNvbnN0IHBhcmFtcyA9IHtcblx0XHRcdFx0S2V5OiB0aGlzLmdldFBhdGgoZmlsZSlcblx0XHRcdH07XG5cblx0XHRcdGlmIChvcHRpb25zLnN0YXJ0ICYmIG9wdGlvbnMuZW5kKSB7XG5cdFx0XHRcdHBhcmFtcy5SYW5nZSA9IGAkeyBvcHRpb25zLnN0YXJ0IH0gLSAkeyBvcHRpb25zLmVuZCB9YDtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIHMzLmdldE9iamVjdChwYXJhbXMpLmNyZWF0ZVJlYWRTdHJlYW0oKTtcblx0XHR9O1xuXG5cdFx0LyoqXG5cdFx0ICogUmV0dXJucyB0aGUgZmlsZSB3cml0ZSBzdHJlYW1cblx0XHQgKiBAcGFyYW0gZmlsZUlkXG5cdFx0ICogQHBhcmFtIGZpbGVcblx0XHQgKiBAcGFyYW0gb3B0aW9uc1xuXHRcdCAqIEByZXR1cm4geyp9XG5cdFx0ICovXG5cdFx0dGhpcy5nZXRXcml0ZVN0cmVhbSA9IGZ1bmN0aW9uKGZpbGVJZCwgZmlsZS8qLCBvcHRpb25zKi8pIHtcblx0XHRcdGNvbnN0IHdyaXRlU3RyZWFtID0gbmV3IHN0cmVhbS5QYXNzVGhyb3VnaCgpO1xuXHRcdFx0d3JpdGVTdHJlYW0ubGVuZ3RoID0gZmlsZS5zaXplO1xuXG5cdFx0XHR3cml0ZVN0cmVhbS5vbignbmV3TGlzdGVuZXInLCAoZXZlbnQsIGxpc3RlbmVyKSA9PiB7XG5cdFx0XHRcdGlmIChldmVudCA9PT0gJ2ZpbmlzaCcpIHtcblx0XHRcdFx0XHRwcm9jZXNzLm5leHRUaWNrKCgpID0+IHtcblx0XHRcdFx0XHRcdHdyaXRlU3RyZWFtLnJlbW92ZUxpc3RlbmVyKGV2ZW50LCBsaXN0ZW5lcik7XG5cdFx0XHRcdFx0XHR3cml0ZVN0cmVhbS5vbigncmVhbF9maW5pc2gnLCBsaXN0ZW5lcik7XG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXG5cdFx0XHRzMy5wdXRPYmplY3Qoe1xuXHRcdFx0XHRLZXk6IHRoaXMuZ2V0UGF0aChmaWxlKSxcblx0XHRcdFx0Qm9keTogd3JpdGVTdHJlYW0sXG5cdFx0XHRcdENvbnRlbnRUeXBlOiBmaWxlLnR5cGUsXG5cdFx0XHRcdENvbnRlbnREaXNwb3NpdGlvbjogYGlubGluZTsgZmlsZW5hbWU9XCIkeyBlbmNvZGVVUkkoZmlsZS5uYW1lKSB9XCJgXG5cblx0XHRcdH0sIChlcnJvcikgPT4ge1xuXHRcdFx0XHRpZiAoZXJyb3IpIHtcblx0XHRcdFx0XHRjb25zb2xlLmVycm9yKGVycm9yKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHdyaXRlU3RyZWFtLmVtaXQoJ3JlYWxfZmluaXNoJyk7XG5cdFx0XHR9KTtcblxuXHRcdFx0cmV0dXJuIHdyaXRlU3RyZWFtO1xuXHRcdH07XG5cdH1cbn1cblxuLy8gQWRkIHN0b3JlIHRvIFVGUyBuYW1lc3BhY2VcblVwbG9hZEZTLnN0b3JlLkFtYXpvblMzID0gQW1hem9uUzNTdG9yZTtcbiIsImltcG9ydCB7VXBsb2FkRlN9IGZyb20gJ21ldGVvci9qYWxpazp1ZnMnO1xuaW1wb3J0IGdjU3RvcmFnZSBmcm9tICdAZ29vZ2xlLWNsb3VkL3N0b3JhZ2UnO1xuXG4vKipcbiAqIEdvb2dsZVN0b3JhZ2Ugc3RvcmVcbiAqIEBwYXJhbSBvcHRpb25zXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZXhwb3J0IGNsYXNzIEdvb2dsZVN0b3JhZ2VTdG9yZSBleHRlbmRzIFVwbG9hZEZTLlN0b3JlIHtcblxuXHRjb25zdHJ1Y3RvcihvcHRpb25zKSB7XG5cdFx0c3VwZXIob3B0aW9ucyk7XG5cblx0XHRjb25zdCBnY3MgPSBnY1N0b3JhZ2Uob3B0aW9ucy5jb25uZWN0aW9uKTtcblx0XHR0aGlzLmJ1Y2tldCA9IGdjcy5idWNrZXQob3B0aW9ucy5idWNrZXQpO1xuXG5cdFx0b3B0aW9ucy5nZXRQYXRoID0gb3B0aW9ucy5nZXRQYXRoIHx8IGZ1bmN0aW9uKGZpbGUpIHtcblx0XHRcdHJldHVybiBmaWxlLl9pZDtcblx0XHR9O1xuXG5cdFx0dGhpcy5nZXRQYXRoID0gZnVuY3Rpb24oZmlsZSkge1xuXHRcdFx0aWYgKGZpbGUuR29vZ2xlU3RvcmFnZSkge1xuXHRcdFx0XHRyZXR1cm4gZmlsZS5Hb29nbGVTdG9yYWdlLnBhdGg7XG5cdFx0XHR9XG5cdFx0XHQvLyBDb21wYXRpYmlsaXR5XG5cdFx0XHQvLyBUT0RPOiBNaWdyYXRpb25cblx0XHRcdGlmIChmaWxlLmdvb2dsZUNsb3VkU3RvcmFnZSkge1xuXHRcdFx0XHRyZXR1cm4gZmlsZS5nb29nbGVDbG91ZFN0b3JhZ2UucGF0aCArIGZpbGUuX2lkO1xuXHRcdFx0fVxuXHRcdH07XG5cblx0XHR0aGlzLmdldFJlZGlyZWN0VVJMID0gZnVuY3Rpb24oZmlsZSwgY2FsbGJhY2spIHtcblx0XHRcdGNvbnN0IHBhcmFtcyA9IHtcblx0XHRcdFx0YWN0aW9uOiAncmVhZCcsXG5cdFx0XHRcdHJlc3BvbnNlRGlzcG9zaXRpb246ICdpbmxpbmUnLFxuXHRcdFx0XHRleHBpcmVzOiBEYXRlLm5vdygpK3RoaXMub3B0aW9ucy5VUkxFeHBpcnlUaW1lU3BhbioxMDAwXG5cdFx0XHR9O1xuXG5cdFx0XHR0aGlzLmJ1Y2tldC5maWxlKHRoaXMuZ2V0UGF0aChmaWxlKSkuZ2V0U2lnbmVkVXJsKHBhcmFtcywgY2FsbGJhY2spO1xuXHRcdH07XG5cblx0XHQvKipcblx0XHQgKiBDcmVhdGVzIHRoZSBmaWxlIGluIHRoZSBjb2xsZWN0aW9uXG5cdFx0ICogQHBhcmFtIGZpbGVcblx0XHQgKiBAcGFyYW0gY2FsbGJhY2tcblx0XHQgKiBAcmV0dXJuIHtzdHJpbmd9XG5cdFx0ICovXG5cdFx0dGhpcy5jcmVhdGUgPSBmdW5jdGlvbihmaWxlLCBjYWxsYmFjaykge1xuXHRcdFx0Y2hlY2soZmlsZSwgT2JqZWN0KTtcblxuXHRcdFx0aWYgKGZpbGUuX2lkID09IG51bGwpIHtcblx0XHRcdFx0ZmlsZS5faWQgPSBSYW5kb20uaWQoKTtcblx0XHRcdH1cblxuXHRcdFx0ZmlsZS5Hb29nbGVTdG9yYWdlID0ge1xuXHRcdFx0XHRwYXRoOiB0aGlzLm9wdGlvbnMuZ2V0UGF0aChmaWxlKVxuXHRcdFx0fTtcblxuXHRcdFx0ZmlsZS5zdG9yZSA9IHRoaXMub3B0aW9ucy5uYW1lOyAvLyBhc3NpZ24gc3RvcmUgdG8gZmlsZVxuXHRcdFx0cmV0dXJuIHRoaXMuZ2V0Q29sbGVjdGlvbigpLmluc2VydChmaWxlLCBjYWxsYmFjayk7XG5cdFx0fTtcblxuXHRcdC8qKlxuXHRcdCAqIFJlbW92ZXMgdGhlIGZpbGVcblx0XHQgKiBAcGFyYW0gZmlsZUlkXG5cdFx0ICogQHBhcmFtIGNhbGxiYWNrXG5cdFx0ICovXG5cdFx0dGhpcy5kZWxldGUgPSBmdW5jdGlvbihmaWxlSWQsIGNhbGxiYWNrKSB7XG5cdFx0XHRjb25zdCBmaWxlID0gdGhpcy5nZXRDb2xsZWN0aW9uKCkuZmluZE9uZSh7X2lkOiBmaWxlSWR9KTtcblx0XHRcdHRoaXMuYnVja2V0LmZpbGUodGhpcy5nZXRQYXRoKGZpbGUpKS5kZWxldGUoZnVuY3Rpb24oZXJyLCBkYXRhKSB7XG5cdFx0XHRcdGlmIChlcnIpIHtcblx0XHRcdFx0XHRjb25zb2xlLmVycm9yKGVycik7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRjYWxsYmFjayAmJiBjYWxsYmFjayhlcnIsIGRhdGEpO1xuXHRcdFx0fSk7XG5cdFx0fTtcblxuXHRcdC8qKlxuXHRcdCAqIFJldHVybnMgdGhlIGZpbGUgcmVhZCBzdHJlYW1cblx0XHQgKiBAcGFyYW0gZmlsZUlkXG5cdFx0ICogQHBhcmFtIGZpbGVcblx0XHQgKiBAcGFyYW0gb3B0aW9uc1xuXHRcdCAqIEByZXR1cm4geyp9XG5cdFx0ICovXG5cdFx0dGhpcy5nZXRSZWFkU3RyZWFtID0gZnVuY3Rpb24oZmlsZUlkLCBmaWxlLCBvcHRpb25zID0ge30pIHtcblx0XHRcdGNvbnN0IGNvbmZpZyA9IHt9O1xuXG5cdFx0XHRpZiAob3B0aW9ucy5zdGFydCAhPSBudWxsKSB7XG5cdFx0XHRcdGNvbmZpZy5zdGFydCA9IG9wdGlvbnMuc3RhcnQ7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChvcHRpb25zLmVuZCAhPSBudWxsKSB7XG5cdFx0XHRcdGNvbmZpZy5lbmQgPSBvcHRpb25zLmVuZDtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIHRoaXMuYnVja2V0LmZpbGUodGhpcy5nZXRQYXRoKGZpbGUpKS5jcmVhdGVSZWFkU3RyZWFtKGNvbmZpZyk7XG5cdFx0fTtcblxuXHRcdC8qKlxuXHRcdCAqIFJldHVybnMgdGhlIGZpbGUgd3JpdGUgc3RyZWFtXG5cdFx0ICogQHBhcmFtIGZpbGVJZFxuXHRcdCAqIEBwYXJhbSBmaWxlXG5cdFx0ICogQHBhcmFtIG9wdGlvbnNcblx0XHQgKiBAcmV0dXJuIHsqfVxuXHRcdCAqL1xuXHRcdHRoaXMuZ2V0V3JpdGVTdHJlYW0gPSBmdW5jdGlvbihmaWxlSWQsIGZpbGUvKiwgb3B0aW9ucyovKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5idWNrZXQuZmlsZSh0aGlzLmdldFBhdGgoZmlsZSkpLmNyZWF0ZVdyaXRlU3RyZWFtKHtcblx0XHRcdFx0Z3ppcDogZmFsc2UsXG5cdFx0XHRcdG1ldGFkYXRhOiB7XG5cdFx0XHRcdFx0Y29udGVudFR5cGU6IGZpbGUudHlwZSxcblx0XHRcdFx0XHRjb250ZW50RGlzcG9zaXRpb246IGBpbmxpbmU7IGZpbGVuYW1lPSR7IGZpbGUubmFtZSB9YFxuXHRcdFx0XHRcdC8vIG1ldGFkYXRhOiB7XG5cdFx0XHRcdFx0Ly8gXHRjdXN0b206ICdtZXRhZGF0YSdcblx0XHRcdFx0XHQvLyB9XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdH07XG5cdH1cbn1cblxuLy8gQWRkIHN0b3JlIHRvIFVGUyBuYW1lc3BhY2VcblVwbG9hZEZTLnN0b3JlLkdvb2dsZVN0b3JhZ2UgPSBHb29nbGVTdG9yYWdlU3RvcmU7XG4iXX0=
