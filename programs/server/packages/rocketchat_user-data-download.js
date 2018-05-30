(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var RocketChatFile = Package['rocketchat:file'].RocketChatFile;
var RocketChat = Package['rocketchat:lib'].RocketChat;
var WebApp = Package.webapp.WebApp;
var WebAppInternals = Package.webapp.WebAppInternals;
var main = Package.webapp.main;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var TAPi18next = Package['tap:i18n'].TAPi18next;
var TAPi18n = Package['tap:i18n'].TAPi18n;

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:user-data-download":{"server":{"startup":{"settings.js":function(){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                               //
// packages/rocketchat_user-data-download/server/startup/settings.js                                             //
//                                                                                                               //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                 //
RocketChat.settings.addGroup('UserDataDownload', function () {
  this.add('UserData_EnableDownload', true, {
    type: 'boolean',
    public: true,
    i18nLabel: 'UserData_EnableDownload'
  });
  this.add('UserData_FileSystemPath', '', {
    type: 'string',
    public: true,
    i18nLabel: 'UserData_FileSystemPath'
  });
  this.add('UserData_FileSystemZipPath', '', {
    type: 'string',
    public: true,
    i18nLabel: 'UserData_FileSystemZipPath'
  });
  this.add('UserData_ProcessingFrequency', 15, {
    type: 'int',
    public: true,
    i18nLabel: 'UserData_ProcessingFrequency'
  });
  this.add('UserData_MessageLimitPerRequest', 100, {
    type: 'int',
    public: true,
    i18nLabel: 'UserData_MessageLimitPerRequest'
  });
});
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"cronProcessDownloads.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                               //
// packages/rocketchat_user-data-download/server/cronProcessDownloads.js                                         //
//                                                                                                               //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                 //
let fs;
module.watch(require("fs"), {
  default(v) {
    fs = v;
  }

}, 0);
let path;
module.watch(require("path"), {
  default(v) {
    path = v;
  }

}, 1);
let archiver;
module.watch(require("archiver"), {
  default(v) {
    archiver = v;
  }

}, 2);
let zipFolder = '/tmp/zipFiles';

if (RocketChat.settings.get('UserData_FileSystemZipPath') != null) {
  if (RocketChat.settings.get('UserData_FileSystemZipPath').trim() !== '') {
    zipFolder = RocketChat.settings.get('UserData_FileSystemZipPath');
  }
}

let processingFrequency = 15;

if (RocketChat.settings.get('UserData_ProcessingFrequency') > 0) {
  processingFrequency = RocketChat.settings.get('UserData_ProcessingFrequency');
}

const startFile = function (fileName, content) {
  fs.writeFileSync(fileName, content);
};

const writeToFile = function (fileName, content) {
  fs.appendFileSync(fileName, content);
};

const createDir = function (folderName) {
  if (!fs.existsSync(folderName)) {
    fs.mkdirSync(folderName);
  }
};

const loadUserSubscriptions = function (exportOperation) {
  exportOperation.roomList = [];
  const exportUserId = exportOperation.userId;
  const cursor = RocketChat.models.Subscriptions.findByUserId(exportUserId);
  cursor.forEach(subscription => {
    const roomId = subscription.rid;
    const roomData = subscription._room;
    let roomName = roomData.name ? roomData.name : roomId;
    let userId = null;

    if (subscription.t === 'd') {
      userId = roomId.replace(exportUserId, '');
      const userData = RocketChat.models.Users.findOneById(userId);

      if (userData) {
        roomName = userData.name;
      }
    }

    const fileName = exportOperation.fullExport ? roomId : roomName;
    const fileType = exportOperation.fullExport ? 'json' : 'html';
    const targetFile = `${fileName}.${fileType}`;
    exportOperation.roomList.push({
      roomId,
      roomName,
      userId,
      exportedCount: 0,
      status: 'pending',
      targetFile,
      type: subscription.t
    });
  });

  if (exportOperation.fullExport) {
    exportOperation.status = 'exporting-rooms';
  } else {
    exportOperation.status = 'exporting';
  }
};

const getAttachmentData = function (attachment) {
  const attachmentData = {
    type: attachment.type,
    title: attachment.title,
    title_link: attachment.title_link,
    image_url: attachment.image_url,
    audio_url: attachment.audio_url,
    video_url: attachment.video_url,
    message_link: attachment.message_link,
    image_type: attachment.image_type,
    image_size: attachment.image_size,
    video_size: attachment.video_size,
    video_type: attachment.video_type,
    audio_size: attachment.audio_size,
    audio_type: attachment.audio_type,
    url: null,
    remote: false,
    fileId: null,
    fileName: null
  };
  const url = attachment.title_link || attachment.image_url || attachment.audio_url || attachment.video_url || attachment.message_link;

  if (url) {
    attachmentData.url = url;
    const urlMatch = /\:\/\//.exec(url);

    if (urlMatch && urlMatch.length > 0) {
      attachmentData.remote = true;
    } else {
      const match = /^\/([^\/]+)\/([^\/]+)\/(.*)/.exec(url);

      if (match && match[2]) {
        const file = RocketChat.models.Uploads.findOneById(match[2]);

        if (file) {
          attachmentData.fileId = file._id;
          attachmentData.fileName = file.name;
        }
      }
    }
  }

  return attachmentData;
};

const addToFileList = function (exportOperation, attachment) {
  const targetFile = path.join(exportOperation.assetsPath, `${attachment.fileId}-${attachment.fileName}`);
  const attachmentData = {
    url: attachment.url,
    copied: false,
    remote: attachment.remote,
    fileId: attachment.fileId,
    fileName: attachment.fileName,
    targetFile
  };
  exportOperation.fileList.push(attachmentData);
};

const getMessageData = function (msg, exportOperation) {
  const attachments = [];

  if (msg.attachments) {
    msg.attachments.forEach(attachment => {
      const attachmentData = getAttachmentData(attachment);
      attachments.push(attachmentData);
      addToFileList(exportOperation, attachmentData);
    });
  }

  const messageObject = {
    msg: msg.msg,
    username: msg.u.username,
    ts: msg.ts
  };

  if (attachments && attachments.length > 0) {
    messageObject.attachments = attachments;
  }

  if (msg.t) {
    messageObject.type = msg.t;
  }

  if (msg.u.name) {
    messageObject.name = msg.u.name;
  }

  return messageObject;
};

const copyFile = function (exportOperation, attachmentData) {
  if (attachmentData.copied || attachmentData.remote || !attachmentData.fileId) {
    attachmentData.copied = true;
    return;
  }

  const file = RocketChat.models.Uploads.findOneById(attachmentData.fileId);

  if (file) {
    if (FileUpload.copy(file, attachmentData.targetFile)) {
      attachmentData.copied = true;
    }
  }
};

const continueExportingRoom = function (exportOperation, exportOpRoomData) {
  createDir(exportOperation.exportPath);
  createDir(exportOperation.assetsPath);
  const filePath = path.join(exportOperation.exportPath, exportOpRoomData.targetFile);

  if (exportOpRoomData.status === 'pending') {
    exportOpRoomData.status = 'exporting';
    startFile(filePath, '');

    if (!exportOperation.fullExport) {
      writeToFile(filePath, '<meta http-equiv="content-type" content="text/html; charset=utf-8">');
    }
  }

  let limit = 100;

  if (RocketChat.settings.get('UserData_MessageLimitPerRequest') > 0) {
    limit = RocketChat.settings.get('UserData_MessageLimitPerRequest');
  }

  const skip = exportOpRoomData.exportedCount;
  const cursor = RocketChat.models.Messages.findByRoomId(exportOpRoomData.roomId, {
    limit,
    skip
  });
  const count = cursor.count();
  cursor.forEach(msg => {
    const messageObject = getMessageData(msg, exportOperation);

    if (exportOperation.fullExport) {
      const messageString = JSON.stringify(messageObject);
      writeToFile(filePath, `${messageString}\n`);
    } else {
      const messageType = msg.t;
      const userName = msg.u.username || msg.u.name;
      const timestamp = msg.ts ? new Date(msg.ts).toUTCString() : '';
      let message = msg.msg;

      switch (messageType) {
        case 'uj':
          message = TAPi18n.__('User_joined_channel');
          break;

        case 'ul':
          message = TAPi18n.__('User_left');
          break;

        case 'au':
          message = TAPi18n.__('User_added_by', {
            user_added: msg.msg,
            user_by: msg.u.username
          });
          break;

        case 'r':
          message = TAPi18n.__('Room_name_changed', {
            room_name: msg.msg,
            user_by: msg.u.username
          });
          break;

        case 'ru':
          message = TAPi18n.__('User_removed_by', {
            user_removed: msg.msg,
            user_by: msg.u.username
          });
          break;

        case 'wm':
          message = TAPi18n.__('Welcome', {
            user: msg.u.username
          });
          break;

        case 'livechat-close':
          message = TAPi18n.__('Conversation_finished');
          break;
      }

      if (message !== msg.msg) {
        message = `<i>${message}</i>`;
      }

      writeToFile(filePath, `<p><strong>${userName}</strong> (${timestamp}):<br/>`);
      writeToFile(filePath, message);

      if (messageObject.attachments && messageObject.attachments.length > 0) {
        messageObject.attachments.forEach(attachment => {
          if (attachment.type === 'file') {
            const description = attachment.description || attachment.title || TAPi18n.__('Message_Attachments');

            const assetUrl = `./assets/${attachment.fileId}-${attachment.fileName}`;
            const link = `<br/><a href="${assetUrl}">${description}</a>`;
            writeToFile(filePath, link);
          }
        });
      }

      writeToFile(filePath, '</p>');
    }

    exportOpRoomData.exportedCount++;
  });

  if (count <= exportOpRoomData.exportedCount) {
    exportOpRoomData.status = 'completed';
    return true;
  }

  return false;
};

const isExportComplete = function (exportOperation) {
  const incomplete = exportOperation.roomList.some(exportOpRoomData => {
    return exportOpRoomData.status !== 'completed';
  });
  return !incomplete;
};

const isDownloadFinished = function (exportOperation) {
  const anyDownloadPending = exportOperation.fileList.some(fileData => {
    return !fileData.copied && !fileData.remote;
  });
  return !anyDownloadPending;
};

const sendEmail = function (userId) {
  const lastFile = RocketChat.models.UserDataFiles.findLastFileByUser(userId);

  if (lastFile) {
    const userData = RocketChat.models.Users.findOneById(userId);

    if (userData && userData.emails && userData.emails[0] && userData.emails[0].address) {
      const emailAddress = `${userData.name} <${userData.emails[0].address}>`;
      const fromAddress = RocketChat.settings.get('From_Email');

      const subject = TAPi18n.__('UserDataDownload_EmailSubject');

      const download_link = lastFile.url;

      const body = TAPi18n.__('UserDataDownload_EmailBody', {
        download_link
      });

      const rfcMailPatternWithName = /^(?:.*<)?([a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*)(?:>?)$/;

      if (rfcMailPatternWithName.test(emailAddress)) {
        Meteor.defer(function () {
          return Email.send({
            to: emailAddress,
            from: fromAddress,
            subject,
            html: body
          });
        });
        return console.log(`Sending email to ${emailAddress}`);
      }
    }
  }
};

const makeZipFile = function (exportOperation) {
  const targetFile = path.join(zipFolder, `${exportOperation.userId}.zip`);
  const output = fs.createWriteStream(targetFile);
  exportOperation.generatedFile = targetFile;
  const archive = archiver('zip');
  output.on('close', () => {});
  archive.on('error', err => {
    throw err;
  });
  archive.pipe(output);
  archive.directory(exportOperation.exportPath, false);
  archive.finalize();
};

const uploadZipFile = function (exportOperation, callback) {
  const userDataStore = FileUpload.getStore('UserDataFiles');
  const filePath = exportOperation.generatedFile;
  const stat = Meteor.wrapAsync(fs.stat)(filePath);
  const stream = fs.createReadStream(filePath);
  const contentType = 'application/zip';
  const size = stat.size;
  const userId = exportOperation.userId;
  const user = RocketChat.models.Users.findOneById(userId);
  const userDisplayName = user ? user.name : userId;
  const utcDate = new Date().toISOString().split('T')[0];
  const newFileName = encodeURIComponent(`${utcDate}-${userDisplayName}.zip`);
  const details = {
    userId,
    type: contentType,
    size,
    name: newFileName
  };
  userDataStore.insert(details, stream, err => {
    if (err) {
      throw new Meteor.Error('invalid-file', 'Invalid Zip File', {
        method: 'cronProcessDownloads.uploadZipFile'
      });
    } else {
      callback();
    }
  });
};

const generateChannelsFile = function (exportOperation) {
  if (exportOperation.fullExport) {
    const fileName = path.join(exportOperation.exportPath, 'channels.json');
    startFile(fileName, '');
    exportOperation.roomList.forEach(roomData => {
      const newRoomData = {
        roomId: roomData.roomId,
        roomName: roomData.roomName,
        type: roomData.type
      };
      const messageString = JSON.stringify(newRoomData);
      writeToFile(fileName, `${messageString}\n`);
    });
  }

  exportOperation.status = 'exporting';
};

const continueExportOperation = function (exportOperation) {
  if (exportOperation.status === 'completed') {
    return;
  }

  if (!exportOperation.roomList) {
    loadUserSubscriptions(exportOperation);
  }

  try {
    if (exportOperation.status === 'exporting-rooms') {
      generateChannelsFile(exportOperation);
    } //Run every room on every request, to avoid missing new messages on the rooms that finished first.


    if (exportOperation.status === 'exporting') {
      exportOperation.roomList.forEach(exportOpRoomData => {
        continueExportingRoom(exportOperation, exportOpRoomData);
      });

      if (isExportComplete(exportOperation)) {
        exportOperation.status = 'downloading';
        return;
      }
    }

    if (exportOperation.status === 'downloading') {
      exportOperation.fileList.forEach(attachmentData => {
        copyFile(exportOperation, attachmentData);
      });

      if (isDownloadFinished(exportOperation)) {
        exportOperation.status = 'compressing';
        return;
      }
    }

    if (exportOperation.status === 'compressing') {
      makeZipFile(exportOperation);
      exportOperation.status = 'uploading';
      return;
    }

    if (exportOperation.status === 'uploading') {
      uploadZipFile(exportOperation, () => {
        exportOperation.status = 'completed';
        RocketChat.models.ExportOperations.updateOperation(exportOperation);
      });
      return;
    }
  } catch (e) {
    console.error(e);
  }
};

function processDataDownloads() {
  const cursor = RocketChat.models.ExportOperations.findAllPending({
    limit: 1
  });
  cursor.forEach(exportOperation => {
    if (exportOperation.status === 'completed') {
      return;
    }

    continueExportOperation(exportOperation);
    RocketChat.models.ExportOperations.updateOperation(exportOperation);

    if (exportOperation.status === 'completed') {
      sendEmail(exportOperation.userId);
    }
  });
}

Meteor.startup(function () {
  Meteor.defer(function () {
    processDataDownloads();
    SyncedCron.add({
      name: 'Generate download files for user data',
      schedule: parser => parser.cron(`*/${processingFrequency} * * * *`),
      job: processDataDownloads
    });
  });
});
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:user-data-download/server/startup/settings.js");
require("/node_modules/meteor/rocketchat:user-data-download/server/cronProcessDownloads.js");

/* Exports */
Package._define("rocketchat:user-data-download");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_user-data-download.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDp1c2VyLWRhdGEtZG93bmxvYWQvc2VydmVyL3N0YXJ0dXAvc2V0dGluZ3MuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6dXNlci1kYXRhLWRvd25sb2FkL3NlcnZlci9jcm9uUHJvY2Vzc0Rvd25sb2Fkcy5qcyJdLCJuYW1lcyI6WyJSb2NrZXRDaGF0Iiwic2V0dGluZ3MiLCJhZGRHcm91cCIsImFkZCIsInR5cGUiLCJwdWJsaWMiLCJpMThuTGFiZWwiLCJmcyIsIm1vZHVsZSIsIndhdGNoIiwicmVxdWlyZSIsImRlZmF1bHQiLCJ2IiwicGF0aCIsImFyY2hpdmVyIiwiemlwRm9sZGVyIiwiZ2V0IiwidHJpbSIsInByb2Nlc3NpbmdGcmVxdWVuY3kiLCJzdGFydEZpbGUiLCJmaWxlTmFtZSIsImNvbnRlbnQiLCJ3cml0ZUZpbGVTeW5jIiwid3JpdGVUb0ZpbGUiLCJhcHBlbmRGaWxlU3luYyIsImNyZWF0ZURpciIsImZvbGRlck5hbWUiLCJleGlzdHNTeW5jIiwibWtkaXJTeW5jIiwibG9hZFVzZXJTdWJzY3JpcHRpb25zIiwiZXhwb3J0T3BlcmF0aW9uIiwicm9vbUxpc3QiLCJleHBvcnRVc2VySWQiLCJ1c2VySWQiLCJjdXJzb3IiLCJtb2RlbHMiLCJTdWJzY3JpcHRpb25zIiwiZmluZEJ5VXNlcklkIiwiZm9yRWFjaCIsInN1YnNjcmlwdGlvbiIsInJvb21JZCIsInJpZCIsInJvb21EYXRhIiwiX3Jvb20iLCJyb29tTmFtZSIsIm5hbWUiLCJ0IiwicmVwbGFjZSIsInVzZXJEYXRhIiwiVXNlcnMiLCJmaW5kT25lQnlJZCIsImZ1bGxFeHBvcnQiLCJmaWxlVHlwZSIsInRhcmdldEZpbGUiLCJwdXNoIiwiZXhwb3J0ZWRDb3VudCIsInN0YXR1cyIsImdldEF0dGFjaG1lbnREYXRhIiwiYXR0YWNobWVudCIsImF0dGFjaG1lbnREYXRhIiwidGl0bGUiLCJ0aXRsZV9saW5rIiwiaW1hZ2VfdXJsIiwiYXVkaW9fdXJsIiwidmlkZW9fdXJsIiwibWVzc2FnZV9saW5rIiwiaW1hZ2VfdHlwZSIsImltYWdlX3NpemUiLCJ2aWRlb19zaXplIiwidmlkZW9fdHlwZSIsImF1ZGlvX3NpemUiLCJhdWRpb190eXBlIiwidXJsIiwicmVtb3RlIiwiZmlsZUlkIiwidXJsTWF0Y2giLCJleGVjIiwibGVuZ3RoIiwibWF0Y2giLCJmaWxlIiwiVXBsb2FkcyIsIl9pZCIsImFkZFRvRmlsZUxpc3QiLCJqb2luIiwiYXNzZXRzUGF0aCIsImNvcGllZCIsImZpbGVMaXN0IiwiZ2V0TWVzc2FnZURhdGEiLCJtc2ciLCJhdHRhY2htZW50cyIsIm1lc3NhZ2VPYmplY3QiLCJ1c2VybmFtZSIsInUiLCJ0cyIsImNvcHlGaWxlIiwiRmlsZVVwbG9hZCIsImNvcHkiLCJjb250aW51ZUV4cG9ydGluZ1Jvb20iLCJleHBvcnRPcFJvb21EYXRhIiwiZXhwb3J0UGF0aCIsImZpbGVQYXRoIiwibGltaXQiLCJza2lwIiwiTWVzc2FnZXMiLCJmaW5kQnlSb29tSWQiLCJjb3VudCIsIm1lc3NhZ2VTdHJpbmciLCJKU09OIiwic3RyaW5naWZ5IiwibWVzc2FnZVR5cGUiLCJ1c2VyTmFtZSIsInRpbWVzdGFtcCIsIkRhdGUiLCJ0b1VUQ1N0cmluZyIsIm1lc3NhZ2UiLCJUQVBpMThuIiwiX18iLCJ1c2VyX2FkZGVkIiwidXNlcl9ieSIsInJvb21fbmFtZSIsInVzZXJfcmVtb3ZlZCIsInVzZXIiLCJkZXNjcmlwdGlvbiIsImFzc2V0VXJsIiwibGluayIsImlzRXhwb3J0Q29tcGxldGUiLCJpbmNvbXBsZXRlIiwic29tZSIsImlzRG93bmxvYWRGaW5pc2hlZCIsImFueURvd25sb2FkUGVuZGluZyIsImZpbGVEYXRhIiwic2VuZEVtYWlsIiwibGFzdEZpbGUiLCJVc2VyRGF0YUZpbGVzIiwiZmluZExhc3RGaWxlQnlVc2VyIiwiZW1haWxzIiwiYWRkcmVzcyIsImVtYWlsQWRkcmVzcyIsImZyb21BZGRyZXNzIiwic3ViamVjdCIsImRvd25sb2FkX2xpbmsiLCJib2R5IiwicmZjTWFpbFBhdHRlcm5XaXRoTmFtZSIsInRlc3QiLCJNZXRlb3IiLCJkZWZlciIsIkVtYWlsIiwic2VuZCIsInRvIiwiZnJvbSIsImh0bWwiLCJjb25zb2xlIiwibG9nIiwibWFrZVppcEZpbGUiLCJvdXRwdXQiLCJjcmVhdGVXcml0ZVN0cmVhbSIsImdlbmVyYXRlZEZpbGUiLCJhcmNoaXZlIiwib24iLCJlcnIiLCJwaXBlIiwiZGlyZWN0b3J5IiwiZmluYWxpemUiLCJ1cGxvYWRaaXBGaWxlIiwiY2FsbGJhY2siLCJ1c2VyRGF0YVN0b3JlIiwiZ2V0U3RvcmUiLCJzdGF0Iiwid3JhcEFzeW5jIiwic3RyZWFtIiwiY3JlYXRlUmVhZFN0cmVhbSIsImNvbnRlbnRUeXBlIiwic2l6ZSIsInVzZXJEaXNwbGF5TmFtZSIsInV0Y0RhdGUiLCJ0b0lTT1N0cmluZyIsInNwbGl0IiwibmV3RmlsZU5hbWUiLCJlbmNvZGVVUklDb21wb25lbnQiLCJkZXRhaWxzIiwiaW5zZXJ0IiwiRXJyb3IiLCJtZXRob2QiLCJnZW5lcmF0ZUNoYW5uZWxzRmlsZSIsIm5ld1Jvb21EYXRhIiwiY29udGludWVFeHBvcnRPcGVyYXRpb24iLCJFeHBvcnRPcGVyYXRpb25zIiwidXBkYXRlT3BlcmF0aW9uIiwiZSIsImVycm9yIiwicHJvY2Vzc0RhdGFEb3dubG9hZHMiLCJmaW5kQWxsUGVuZGluZyIsInN0YXJ0dXAiLCJTeW5jZWRDcm9uIiwic2NoZWR1bGUiLCJwYXJzZXIiLCJjcm9uIiwiam9iIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBQSxXQUFXQyxRQUFYLENBQW9CQyxRQUFwQixDQUE2QixrQkFBN0IsRUFBaUQsWUFBVztBQUUzRCxPQUFLQyxHQUFMLENBQVMseUJBQVQsRUFBb0MsSUFBcEMsRUFBMEM7QUFDekNDLFVBQU0sU0FEbUM7QUFFekNDLFlBQVEsSUFGaUM7QUFHekNDLGVBQVc7QUFIOEIsR0FBMUM7QUFNQSxPQUFLSCxHQUFMLENBQVMseUJBQVQsRUFBb0MsRUFBcEMsRUFBd0M7QUFDdkNDLFVBQU0sUUFEaUM7QUFFdkNDLFlBQVEsSUFGK0I7QUFHdkNDLGVBQVc7QUFINEIsR0FBeEM7QUFNQSxPQUFLSCxHQUFMLENBQVMsNEJBQVQsRUFBdUMsRUFBdkMsRUFBMkM7QUFDMUNDLFVBQU0sUUFEb0M7QUFFMUNDLFlBQVEsSUFGa0M7QUFHMUNDLGVBQVc7QUFIK0IsR0FBM0M7QUFNQSxPQUFLSCxHQUFMLENBQVMsOEJBQVQsRUFBeUMsRUFBekMsRUFBNkM7QUFDNUNDLFVBQU0sS0FEc0M7QUFFNUNDLFlBQVEsSUFGb0M7QUFHNUNDLGVBQVc7QUFIaUMsR0FBN0M7QUFNQSxPQUFLSCxHQUFMLENBQVMsaUNBQVQsRUFBNEMsR0FBNUMsRUFBaUQ7QUFDaERDLFVBQU0sS0FEMEM7QUFFaERDLFlBQVEsSUFGd0M7QUFHaERDLGVBQVc7QUFIcUMsR0FBakQ7QUFPQSxDQWpDRCxFOzs7Ozs7Ozs7OztBQ0FBLElBQUlDLEVBQUo7QUFBT0MsT0FBT0MsS0FBUCxDQUFhQyxRQUFRLElBQVIsQ0FBYixFQUEyQjtBQUFDQyxVQUFRQyxDQUFSLEVBQVU7QUFBQ0wsU0FBR0ssQ0FBSDtBQUFLOztBQUFqQixDQUEzQixFQUE4QyxDQUE5QztBQUFpRCxJQUFJQyxJQUFKO0FBQVNMLE9BQU9DLEtBQVAsQ0FBYUMsUUFBUSxNQUFSLENBQWIsRUFBNkI7QUFBQ0MsVUFBUUMsQ0FBUixFQUFVO0FBQUNDLFdBQUtELENBQUw7QUFBTzs7QUFBbkIsQ0FBN0IsRUFBa0QsQ0FBbEQ7QUFBcUQsSUFBSUUsUUFBSjtBQUFhTixPQUFPQyxLQUFQLENBQWFDLFFBQVEsVUFBUixDQUFiLEVBQWlDO0FBQUNDLFVBQVFDLENBQVIsRUFBVTtBQUFDRSxlQUFTRixDQUFUO0FBQVc7O0FBQXZCLENBQWpDLEVBQTBELENBQTFEO0FBTW5JLElBQUlHLFlBQVksZUFBaEI7O0FBQ0EsSUFBSWYsV0FBV0MsUUFBWCxDQUFvQmUsR0FBcEIsQ0FBd0IsNEJBQXhCLEtBQXlELElBQTdELEVBQW1FO0FBQ2xFLE1BQUloQixXQUFXQyxRQUFYLENBQW9CZSxHQUFwQixDQUF3Qiw0QkFBeEIsRUFBc0RDLElBQXRELE9BQWlFLEVBQXJFLEVBQXlFO0FBQ3hFRixnQkFBWWYsV0FBV0MsUUFBWCxDQUFvQmUsR0FBcEIsQ0FBd0IsNEJBQXhCLENBQVo7QUFDQTtBQUNEOztBQUVELElBQUlFLHNCQUFzQixFQUExQjs7QUFDQSxJQUFJbEIsV0FBV0MsUUFBWCxDQUFvQmUsR0FBcEIsQ0FBd0IsOEJBQXhCLElBQTBELENBQTlELEVBQWlFO0FBQ2hFRSx3QkFBc0JsQixXQUFXQyxRQUFYLENBQW9CZSxHQUFwQixDQUF3Qiw4QkFBeEIsQ0FBdEI7QUFDQTs7QUFFRCxNQUFNRyxZQUFZLFVBQVNDLFFBQVQsRUFBbUJDLE9BQW5CLEVBQTRCO0FBQzdDZCxLQUFHZSxhQUFILENBQWlCRixRQUFqQixFQUEyQkMsT0FBM0I7QUFDQSxDQUZEOztBQUlBLE1BQU1FLGNBQWMsVUFBU0gsUUFBVCxFQUFtQkMsT0FBbkIsRUFBNEI7QUFDL0NkLEtBQUdpQixjQUFILENBQWtCSixRQUFsQixFQUE0QkMsT0FBNUI7QUFDQSxDQUZEOztBQUlBLE1BQU1JLFlBQVksVUFBU0MsVUFBVCxFQUFxQjtBQUN0QyxNQUFJLENBQUNuQixHQUFHb0IsVUFBSCxDQUFjRCxVQUFkLENBQUwsRUFBZ0M7QUFDL0JuQixPQUFHcUIsU0FBSCxDQUFhRixVQUFiO0FBQ0E7QUFDRCxDQUpEOztBQU1BLE1BQU1HLHdCQUF3QixVQUFTQyxlQUFULEVBQTBCO0FBQ3ZEQSxrQkFBZ0JDLFFBQWhCLEdBQTJCLEVBQTNCO0FBRUEsUUFBTUMsZUFBZUYsZ0JBQWdCRyxNQUFyQztBQUNBLFFBQU1DLFNBQVNsQyxXQUFXbUMsTUFBWCxDQUFrQkMsYUFBbEIsQ0FBZ0NDLFlBQWhDLENBQTZDTCxZQUE3QyxDQUFmO0FBQ0FFLFNBQU9JLE9BQVAsQ0FBZ0JDLFlBQUQsSUFBa0I7QUFDaEMsVUFBTUMsU0FBU0QsYUFBYUUsR0FBNUI7QUFDQSxVQUFNQyxXQUFXSCxhQUFhSSxLQUE5QjtBQUNBLFFBQUlDLFdBQVdGLFNBQVNHLElBQVQsR0FBZ0JILFNBQVNHLElBQXpCLEdBQWdDTCxNQUEvQztBQUNBLFFBQUlQLFNBQVMsSUFBYjs7QUFFQSxRQUFJTSxhQUFhTyxDQUFiLEtBQW1CLEdBQXZCLEVBQTRCO0FBQzNCYixlQUFTTyxPQUFPTyxPQUFQLENBQWVmLFlBQWYsRUFBNkIsRUFBN0IsQ0FBVDtBQUNBLFlBQU1nQixXQUFXaEQsV0FBV21DLE1BQVgsQ0FBa0JjLEtBQWxCLENBQXdCQyxXQUF4QixDQUFvQ2pCLE1BQXBDLENBQWpCOztBQUVBLFVBQUllLFFBQUosRUFBYztBQUNiSixtQkFBV0ksU0FBU0gsSUFBcEI7QUFDQTtBQUNEOztBQUVELFVBQU16QixXQUFXVSxnQkFBZ0JxQixVQUFoQixHQUE2QlgsTUFBN0IsR0FBc0NJLFFBQXZEO0FBQ0EsVUFBTVEsV0FBV3RCLGdCQUFnQnFCLFVBQWhCLEdBQTZCLE1BQTdCLEdBQXNDLE1BQXZEO0FBQ0EsVUFBTUUsYUFBYyxHQUFHakMsUUFBVSxJQUFJZ0MsUUFBVSxFQUEvQztBQUVBdEIsb0JBQWdCQyxRQUFoQixDQUF5QnVCLElBQXpCLENBQThCO0FBQzdCZCxZQUQ2QjtBQUU3QkksY0FGNkI7QUFHN0JYLFlBSDZCO0FBSTdCc0IscUJBQWUsQ0FKYztBQUs3QkMsY0FBUSxTQUxxQjtBQU03QkgsZ0JBTjZCO0FBTzdCakQsWUFBTW1DLGFBQWFPO0FBUFUsS0FBOUI7QUFTQSxHQTVCRDs7QUE4QkEsTUFBSWhCLGdCQUFnQnFCLFVBQXBCLEVBQWdDO0FBQy9CckIsb0JBQWdCMEIsTUFBaEIsR0FBeUIsaUJBQXpCO0FBQ0EsR0FGRCxNQUVPO0FBQ04xQixvQkFBZ0IwQixNQUFoQixHQUF5QixXQUF6QjtBQUNBO0FBQ0QsQ0F4Q0Q7O0FBMENBLE1BQU1DLG9CQUFvQixVQUFTQyxVQUFULEVBQXFCO0FBQzlDLFFBQU1DLGlCQUFpQjtBQUN0QnZELFVBQU9zRCxXQUFXdEQsSUFESTtBQUV0QndELFdBQU9GLFdBQVdFLEtBRkk7QUFHdEJDLGdCQUFZSCxXQUFXRyxVQUhEO0FBSXRCQyxlQUFXSixXQUFXSSxTQUpBO0FBS3RCQyxlQUFXTCxXQUFXSyxTQUxBO0FBTXRCQyxlQUFXTixXQUFXTSxTQU5BO0FBT3RCQyxrQkFBY1AsV0FBV08sWUFQSDtBQVF0QkMsZ0JBQVlSLFdBQVdRLFVBUkQ7QUFTdEJDLGdCQUFZVCxXQUFXUyxVQVREO0FBVXRCQyxnQkFBWVYsV0FBV1UsVUFWRDtBQVd0QkMsZ0JBQVlYLFdBQVdXLFVBWEQ7QUFZdEJDLGdCQUFZWixXQUFXWSxVQVpEO0FBYXRCQyxnQkFBWWIsV0FBV2EsVUFiRDtBQWN0QkMsU0FBSyxJQWRpQjtBQWV0QkMsWUFBUSxLQWZjO0FBZ0J0QkMsWUFBUSxJQWhCYztBQWlCdEJ0RCxjQUFVO0FBakJZLEdBQXZCO0FBb0JBLFFBQU1vRCxNQUFNZCxXQUFXRyxVQUFYLElBQXlCSCxXQUFXSSxTQUFwQyxJQUFpREosV0FBV0ssU0FBNUQsSUFBeUVMLFdBQVdNLFNBQXBGLElBQWlHTixXQUFXTyxZQUF4SDs7QUFDQSxNQUFJTyxHQUFKLEVBQVM7QUFDUmIsbUJBQWVhLEdBQWYsR0FBcUJBLEdBQXJCO0FBRUEsVUFBTUcsV0FBVyxTQUFTQyxJQUFULENBQWNKLEdBQWQsQ0FBakI7O0FBQ0EsUUFBSUcsWUFBWUEsU0FBU0UsTUFBVCxHQUFrQixDQUFsQyxFQUFxQztBQUNwQ2xCLHFCQUFlYyxNQUFmLEdBQXdCLElBQXhCO0FBQ0EsS0FGRCxNQUVPO0FBQ04sWUFBTUssUUFBUSw4QkFBOEJGLElBQTlCLENBQW1DSixHQUFuQyxDQUFkOztBQUVBLFVBQUlNLFNBQVNBLE1BQU0sQ0FBTixDQUFiLEVBQXVCO0FBQ3RCLGNBQU1DLE9BQU8vRSxXQUFXbUMsTUFBWCxDQUFrQjZDLE9BQWxCLENBQTBCOUIsV0FBMUIsQ0FBc0M0QixNQUFNLENBQU4sQ0FBdEMsQ0FBYjs7QUFFQSxZQUFJQyxJQUFKLEVBQVU7QUFDVHBCLHlCQUFlZSxNQUFmLEdBQXdCSyxLQUFLRSxHQUE3QjtBQUNBdEIseUJBQWV2QyxRQUFmLEdBQTBCMkQsS0FBS2xDLElBQS9CO0FBQ0E7QUFDRDtBQUNEO0FBQ0Q7O0FBRUQsU0FBT2MsY0FBUDtBQUNBLENBM0NEOztBQTZDQSxNQUFNdUIsZ0JBQWdCLFVBQVNwRCxlQUFULEVBQTBCNEIsVUFBMUIsRUFBc0M7QUFDM0QsUUFBTUwsYUFBYXhDLEtBQUtzRSxJQUFMLENBQVVyRCxnQkFBZ0JzRCxVQUExQixFQUF1QyxHQUFHMUIsV0FBV2dCLE1BQVEsSUFBSWhCLFdBQVd0QyxRQUFVLEVBQXRGLENBQW5CO0FBRUEsUUFBTXVDLGlCQUFpQjtBQUN0QmEsU0FBS2QsV0FBV2MsR0FETTtBQUV0QmEsWUFBUSxLQUZjO0FBR3RCWixZQUFRZixXQUFXZSxNQUhHO0FBSXRCQyxZQUFRaEIsV0FBV2dCLE1BSkc7QUFLdEJ0RCxjQUFVc0MsV0FBV3RDLFFBTEM7QUFNdEJpQztBQU5zQixHQUF2QjtBQVNBdkIsa0JBQWdCd0QsUUFBaEIsQ0FBeUJoQyxJQUF6QixDQUE4QkssY0FBOUI7QUFDQSxDQWJEOztBQWVBLE1BQU00QixpQkFBaUIsVUFBU0MsR0FBVCxFQUFjMUQsZUFBZCxFQUErQjtBQUNyRCxRQUFNMkQsY0FBYyxFQUFwQjs7QUFFQSxNQUFJRCxJQUFJQyxXQUFSLEVBQXFCO0FBQ3BCRCxRQUFJQyxXQUFKLENBQWdCbkQsT0FBaEIsQ0FBeUJvQixVQUFELElBQWdCO0FBQ3ZDLFlBQU1DLGlCQUFpQkYsa0JBQWtCQyxVQUFsQixDQUF2QjtBQUVBK0Isa0JBQVluQyxJQUFaLENBQWlCSyxjQUFqQjtBQUNBdUIsb0JBQWNwRCxlQUFkLEVBQStCNkIsY0FBL0I7QUFDQSxLQUxEO0FBTUE7O0FBRUQsUUFBTStCLGdCQUFnQjtBQUNyQkYsU0FBS0EsSUFBSUEsR0FEWTtBQUVyQkcsY0FBVUgsSUFBSUksQ0FBSixDQUFNRCxRQUZLO0FBR3JCRSxRQUFJTCxJQUFJSztBQUhhLEdBQXRCOztBQU1BLE1BQUlKLGVBQWVBLFlBQVlaLE1BQVosR0FBcUIsQ0FBeEMsRUFBMkM7QUFDMUNhLGtCQUFjRCxXQUFkLEdBQTRCQSxXQUE1QjtBQUNBOztBQUNELE1BQUlELElBQUkxQyxDQUFSLEVBQVc7QUFDVjRDLGtCQUFjdEYsSUFBZCxHQUFxQm9GLElBQUkxQyxDQUF6QjtBQUNBOztBQUNELE1BQUkwQyxJQUFJSSxDQUFKLENBQU0vQyxJQUFWLEVBQWdCO0FBQ2Y2QyxrQkFBYzdDLElBQWQsR0FBcUIyQyxJQUFJSSxDQUFKLENBQU0vQyxJQUEzQjtBQUNBOztBQUVELFNBQU82QyxhQUFQO0FBQ0EsQ0E3QkQ7O0FBK0JBLE1BQU1JLFdBQVcsVUFBU2hFLGVBQVQsRUFBMEI2QixjQUExQixFQUEwQztBQUMxRCxNQUFJQSxlQUFlMEIsTUFBZixJQUF5QjFCLGVBQWVjLE1BQXhDLElBQWtELENBQUNkLGVBQWVlLE1BQXRFLEVBQThFO0FBQzdFZixtQkFBZTBCLE1BQWYsR0FBd0IsSUFBeEI7QUFDQTtBQUNBOztBQUVELFFBQU1OLE9BQU8vRSxXQUFXbUMsTUFBWCxDQUFrQjZDLE9BQWxCLENBQTBCOUIsV0FBMUIsQ0FBc0NTLGVBQWVlLE1BQXJELENBQWI7O0FBRUEsTUFBSUssSUFBSixFQUFVO0FBQ1QsUUFBSWdCLFdBQVdDLElBQVgsQ0FBZ0JqQixJQUFoQixFQUFzQnBCLGVBQWVOLFVBQXJDLENBQUosRUFBc0Q7QUFDckRNLHFCQUFlMEIsTUFBZixHQUF3QixJQUF4QjtBQUNBO0FBQ0Q7QUFDRCxDQWJEOztBQWVBLE1BQU1ZLHdCQUF3QixVQUFTbkUsZUFBVCxFQUEwQm9FLGdCQUExQixFQUE0QztBQUN6RXpFLFlBQVVLLGdCQUFnQnFFLFVBQTFCO0FBQ0ExRSxZQUFVSyxnQkFBZ0JzRCxVQUExQjtBQUVBLFFBQU1nQixXQUFXdkYsS0FBS3NFLElBQUwsQ0FBVXJELGdCQUFnQnFFLFVBQTFCLEVBQXNDRCxpQkFBaUI3QyxVQUF2RCxDQUFqQjs7QUFFQSxNQUFJNkMsaUJBQWlCMUMsTUFBakIsS0FBNEIsU0FBaEMsRUFBMkM7QUFDMUMwQyxxQkFBaUIxQyxNQUFqQixHQUEwQixXQUExQjtBQUNBckMsY0FBVWlGLFFBQVYsRUFBb0IsRUFBcEI7O0FBQ0EsUUFBSSxDQUFDdEUsZ0JBQWdCcUIsVUFBckIsRUFBaUM7QUFDaEM1QixrQkFBWTZFLFFBQVosRUFBc0IscUVBQXRCO0FBQ0E7QUFDRDs7QUFFRCxNQUFJQyxRQUFRLEdBQVo7O0FBQ0EsTUFBSXJHLFdBQVdDLFFBQVgsQ0FBb0JlLEdBQXBCLENBQXdCLGlDQUF4QixJQUE2RCxDQUFqRSxFQUFvRTtBQUNuRXFGLFlBQVFyRyxXQUFXQyxRQUFYLENBQW9CZSxHQUFwQixDQUF3QixpQ0FBeEIsQ0FBUjtBQUNBOztBQUVELFFBQU1zRixPQUFPSixpQkFBaUIzQyxhQUE5QjtBQUVBLFFBQU1yQixTQUFTbEMsV0FBV21DLE1BQVgsQ0FBa0JvRSxRQUFsQixDQUEyQkMsWUFBM0IsQ0FBd0NOLGlCQUFpQjFELE1BQXpELEVBQWlFO0FBQUU2RCxTQUFGO0FBQVNDO0FBQVQsR0FBakUsQ0FBZjtBQUNBLFFBQU1HLFFBQVF2RSxPQUFPdUUsS0FBUCxFQUFkO0FBRUF2RSxTQUFPSSxPQUFQLENBQWdCa0QsR0FBRCxJQUFTO0FBQ3ZCLFVBQU1FLGdCQUFnQkgsZUFBZUMsR0FBZixFQUFvQjFELGVBQXBCLENBQXRCOztBQUVBLFFBQUlBLGdCQUFnQnFCLFVBQXBCLEVBQWdDO0FBQy9CLFlBQU11RCxnQkFBZ0JDLEtBQUtDLFNBQUwsQ0FBZWxCLGFBQWYsQ0FBdEI7QUFDQW5FLGtCQUFZNkUsUUFBWixFQUF1QixHQUFHTSxhQUFlLElBQXpDO0FBQ0EsS0FIRCxNQUdPO0FBQ04sWUFBTUcsY0FBY3JCLElBQUkxQyxDQUF4QjtBQUNBLFlBQU1nRSxXQUFXdEIsSUFBSUksQ0FBSixDQUFNRCxRQUFOLElBQWtCSCxJQUFJSSxDQUFKLENBQU0vQyxJQUF6QztBQUNBLFlBQU1rRSxZQUFZdkIsSUFBSUssRUFBSixHQUFTLElBQUltQixJQUFKLENBQVN4QixJQUFJSyxFQUFiLEVBQWlCb0IsV0FBakIsRUFBVCxHQUEwQyxFQUE1RDtBQUNBLFVBQUlDLFVBQVUxQixJQUFJQSxHQUFsQjs7QUFFQSxjQUFRcUIsV0FBUjtBQUNDLGFBQUssSUFBTDtBQUNDSyxvQkFBVUMsUUFBUUMsRUFBUixDQUFXLHFCQUFYLENBQVY7QUFDQTs7QUFDRCxhQUFLLElBQUw7QUFDQ0Ysb0JBQVVDLFFBQVFDLEVBQVIsQ0FBVyxXQUFYLENBQVY7QUFDQTs7QUFDRCxhQUFLLElBQUw7QUFDQ0Ysb0JBQVVDLFFBQVFDLEVBQVIsQ0FBVyxlQUFYLEVBQTRCO0FBQUNDLHdCQUFhN0IsSUFBSUEsR0FBbEI7QUFBdUI4QixxQkFBVTlCLElBQUlJLENBQUosQ0FBTUQ7QUFBdkMsV0FBNUIsQ0FBVjtBQUNBOztBQUNELGFBQUssR0FBTDtBQUNDdUIsb0JBQVVDLFFBQVFDLEVBQVIsQ0FBVyxtQkFBWCxFQUFnQztBQUFFRyx1QkFBVy9CLElBQUlBLEdBQWpCO0FBQXNCOEIscUJBQVM5QixJQUFJSSxDQUFKLENBQU1EO0FBQXJDLFdBQWhDLENBQVY7QUFDQTs7QUFDRCxhQUFLLElBQUw7QUFDQ3VCLG9CQUFVQyxRQUFRQyxFQUFSLENBQVcsaUJBQVgsRUFBOEI7QUFBQ0ksMEJBQWVoQyxJQUFJQSxHQUFwQjtBQUF5QjhCLHFCQUFVOUIsSUFBSUksQ0FBSixDQUFNRDtBQUF6QyxXQUE5QixDQUFWO0FBQ0E7O0FBQ0QsYUFBSyxJQUFMO0FBQ0N1QixvQkFBVUMsUUFBUUMsRUFBUixDQUFXLFNBQVgsRUFBc0I7QUFBQ0ssa0JBQU1qQyxJQUFJSSxDQUFKLENBQU1EO0FBQWIsV0FBdEIsQ0FBVjtBQUNBOztBQUNELGFBQUssZ0JBQUw7QUFDQ3VCLG9CQUFVQyxRQUFRQyxFQUFSLENBQVcsdUJBQVgsQ0FBVjtBQUNBO0FBckJGOztBQXdCQSxVQUFJRixZQUFZMUIsSUFBSUEsR0FBcEIsRUFBeUI7QUFDeEIwQixrQkFBVyxNQUFNQSxPQUFTLE1BQTFCO0FBQ0E7O0FBRUQzRixrQkFBWTZFLFFBQVosRUFBdUIsY0FBY1UsUUFBVSxjQUFjQyxTQUFXLFNBQXhFO0FBQ0F4RixrQkFBWTZFLFFBQVosRUFBc0JjLE9BQXRCOztBQUVBLFVBQUl4QixjQUFjRCxXQUFkLElBQTZCQyxjQUFjRCxXQUFkLENBQTBCWixNQUExQixHQUFtQyxDQUFwRSxFQUF1RTtBQUN0RWEsc0JBQWNELFdBQWQsQ0FBMEJuRCxPQUExQixDQUFtQ29CLFVBQUQsSUFBZ0I7QUFDakQsY0FBSUEsV0FBV3RELElBQVgsS0FBb0IsTUFBeEIsRUFBZ0M7QUFDL0Isa0JBQU1zSCxjQUFjaEUsV0FBV2dFLFdBQVgsSUFBMEJoRSxXQUFXRSxLQUFyQyxJQUE4Q3VELFFBQVFDLEVBQVIsQ0FBVyxxQkFBWCxDQUFsRTs7QUFFQSxrQkFBTU8sV0FBWSxZQUFZakUsV0FBV2dCLE1BQVEsSUFBSWhCLFdBQVd0QyxRQUFVLEVBQTFFO0FBQ0Esa0JBQU13RyxPQUFRLGlCQUFpQkQsUUFBVSxLQUFLRCxXQUFhLE1BQTNEO0FBQ0FuRyx3QkFBWTZFLFFBQVosRUFBc0J3QixJQUF0QjtBQUNBO0FBQ0QsU0FSRDtBQVNBOztBQUVEckcsa0JBQVk2RSxRQUFaLEVBQXNCLE1BQXRCO0FBQ0E7O0FBRURGLHFCQUFpQjNDLGFBQWpCO0FBQ0EsR0EzREQ7O0FBNkRBLE1BQUlrRCxTQUFTUCxpQkFBaUIzQyxhQUE5QixFQUE2QztBQUM1QzJDLHFCQUFpQjFDLE1BQWpCLEdBQTBCLFdBQTFCO0FBQ0EsV0FBTyxJQUFQO0FBQ0E7O0FBRUQsU0FBTyxLQUFQO0FBQ0EsQ0EzRkQ7O0FBNkZBLE1BQU1xRSxtQkFBbUIsVUFBUy9GLGVBQVQsRUFBMEI7QUFDbEQsUUFBTWdHLGFBQWFoRyxnQkFBZ0JDLFFBQWhCLENBQXlCZ0csSUFBekIsQ0FBK0I3QixnQkFBRCxJQUFzQjtBQUN0RSxXQUFPQSxpQkFBaUIxQyxNQUFqQixLQUE0QixXQUFuQztBQUNBLEdBRmtCLENBQW5CO0FBSUEsU0FBTyxDQUFDc0UsVUFBUjtBQUNBLENBTkQ7O0FBUUEsTUFBTUUscUJBQXFCLFVBQVNsRyxlQUFULEVBQTBCO0FBQ3BELFFBQU1tRyxxQkFBcUJuRyxnQkFBZ0J3RCxRQUFoQixDQUF5QnlDLElBQXpCLENBQStCRyxRQUFELElBQWM7QUFDdEUsV0FBTyxDQUFDQSxTQUFTN0MsTUFBVixJQUFvQixDQUFDNkMsU0FBU3pELE1BQXJDO0FBQ0EsR0FGMEIsQ0FBM0I7QUFJQSxTQUFPLENBQUN3RCxrQkFBUjtBQUNBLENBTkQ7O0FBUUEsTUFBTUUsWUFBWSxVQUFTbEcsTUFBVCxFQUFpQjtBQUNsQyxRQUFNbUcsV0FBV3BJLFdBQVdtQyxNQUFYLENBQWtCa0csYUFBbEIsQ0FBZ0NDLGtCQUFoQyxDQUFtRHJHLE1BQW5ELENBQWpCOztBQUNBLE1BQUltRyxRQUFKLEVBQWM7QUFDYixVQUFNcEYsV0FBV2hELFdBQVdtQyxNQUFYLENBQWtCYyxLQUFsQixDQUF3QkMsV0FBeEIsQ0FBb0NqQixNQUFwQyxDQUFqQjs7QUFFQSxRQUFJZSxZQUFZQSxTQUFTdUYsTUFBckIsSUFBK0J2RixTQUFTdUYsTUFBVCxDQUFnQixDQUFoQixDQUEvQixJQUFxRHZGLFNBQVN1RixNQUFULENBQWdCLENBQWhCLEVBQW1CQyxPQUE1RSxFQUFxRjtBQUNwRixZQUFNQyxlQUFnQixHQUFHekYsU0FBU0gsSUFBTSxLQUFLRyxTQUFTdUYsTUFBVCxDQUFnQixDQUFoQixFQUFtQkMsT0FBUyxHQUF6RTtBQUNBLFlBQU1FLGNBQWMxSSxXQUFXQyxRQUFYLENBQW9CZSxHQUFwQixDQUF3QixZQUF4QixDQUFwQjs7QUFDQSxZQUFNMkgsVUFBVXhCLFFBQVFDLEVBQVIsQ0FBVywrQkFBWCxDQUFoQjs7QUFFQSxZQUFNd0IsZ0JBQWdCUixTQUFTNUQsR0FBL0I7O0FBQ0EsWUFBTXFFLE9BQU8xQixRQUFRQyxFQUFSLENBQVcsNEJBQVgsRUFBeUM7QUFBRXdCO0FBQUYsT0FBekMsQ0FBYjs7QUFFQSxZQUFNRSx5QkFBeUIsdUpBQS9COztBQUVBLFVBQUlBLHVCQUF1QkMsSUFBdkIsQ0FBNEJOLFlBQTVCLENBQUosRUFBK0M7QUFDOUNPLGVBQU9DLEtBQVAsQ0FBYSxZQUFXO0FBQ3ZCLGlCQUFPQyxNQUFNQyxJQUFOLENBQVc7QUFDakJDLGdCQUFJWCxZQURhO0FBRWpCWSxrQkFBTVgsV0FGVztBQUdqQkMsbUJBSGlCO0FBSWpCVyxrQkFBTVQ7QUFKVyxXQUFYLENBQVA7QUFNQSxTQVBEO0FBU0EsZUFBT1UsUUFBUUMsR0FBUixDQUFhLG9CQUFvQmYsWUFBYyxFQUEvQyxDQUFQO0FBQ0E7QUFDRDtBQUNEO0FBQ0QsQ0E3QkQ7O0FBK0JBLE1BQU1nQixjQUFjLFVBQVMzSCxlQUFULEVBQTBCO0FBQzdDLFFBQU11QixhQUFheEMsS0FBS3NFLElBQUwsQ0FBVXBFLFNBQVYsRUFBc0IsR0FBR2UsZ0JBQWdCRyxNQUFRLE1BQWpELENBQW5CO0FBQ0EsUUFBTXlILFNBQVNuSixHQUFHb0osaUJBQUgsQ0FBcUJ0RyxVQUFyQixDQUFmO0FBRUF2QixrQkFBZ0I4SCxhQUFoQixHQUFnQ3ZHLFVBQWhDO0FBRUEsUUFBTXdHLFVBQVUvSSxTQUFTLEtBQVQsQ0FBaEI7QUFFQTRJLFNBQU9JLEVBQVAsQ0FBVSxPQUFWLEVBQW1CLE1BQU0sQ0FDeEIsQ0FERDtBQUdBRCxVQUFRQyxFQUFSLENBQVcsT0FBWCxFQUFxQkMsR0FBRCxJQUFTO0FBQzVCLFVBQU1BLEdBQU47QUFDQSxHQUZEO0FBSUFGLFVBQVFHLElBQVIsQ0FBYU4sTUFBYjtBQUNBRyxVQUFRSSxTQUFSLENBQWtCbkksZ0JBQWdCcUUsVUFBbEMsRUFBOEMsS0FBOUM7QUFDQTBELFVBQVFLLFFBQVI7QUFDQSxDQWxCRDs7QUFvQkEsTUFBTUMsZ0JBQWdCLFVBQVNySSxlQUFULEVBQTBCc0ksUUFBMUIsRUFBb0M7QUFDekQsUUFBTUMsZ0JBQWdCdEUsV0FBV3VFLFFBQVgsQ0FBb0IsZUFBcEIsQ0FBdEI7QUFDQSxRQUFNbEUsV0FBV3RFLGdCQUFnQjhILGFBQWpDO0FBRUEsUUFBTVcsT0FBT3ZCLE9BQU93QixTQUFQLENBQWlCakssR0FBR2dLLElBQXBCLEVBQTBCbkUsUUFBMUIsQ0FBYjtBQUNBLFFBQU1xRSxTQUFTbEssR0FBR21LLGdCQUFILENBQW9CdEUsUUFBcEIsQ0FBZjtBQUVBLFFBQU11RSxjQUFjLGlCQUFwQjtBQUNBLFFBQU1DLE9BQU9MLEtBQUtLLElBQWxCO0FBRUEsUUFBTTNJLFNBQVNILGdCQUFnQkcsTUFBL0I7QUFDQSxRQUFNd0YsT0FBT3pILFdBQVdtQyxNQUFYLENBQWtCYyxLQUFsQixDQUF3QkMsV0FBeEIsQ0FBb0NqQixNQUFwQyxDQUFiO0FBQ0EsUUFBTTRJLGtCQUFrQnBELE9BQU9BLEtBQUs1RSxJQUFaLEdBQW1CWixNQUEzQztBQUNBLFFBQU02SSxVQUFVLElBQUk5RCxJQUFKLEdBQVcrRCxXQUFYLEdBQXlCQyxLQUF6QixDQUErQixHQUEvQixFQUFvQyxDQUFwQyxDQUFoQjtBQUVBLFFBQU1DLGNBQWNDLG1CQUFvQixHQUFHSixPQUFTLElBQUlELGVBQWlCLE1BQXJELENBQXBCO0FBRUEsUUFBTU0sVUFBVTtBQUNmbEosVUFEZTtBQUVmN0IsVUFBTXVLLFdBRlM7QUFHZkMsUUFIZTtBQUlmL0gsVUFBTW9JO0FBSlMsR0FBaEI7QUFPQVosZ0JBQWNlLE1BQWQsQ0FBcUJELE9BQXJCLEVBQThCVixNQUE5QixFQUF1Q1YsR0FBRCxJQUFTO0FBQzlDLFFBQUlBLEdBQUosRUFBUztBQUNSLFlBQU0sSUFBSWYsT0FBT3FDLEtBQVgsQ0FBaUIsY0FBakIsRUFBaUMsa0JBQWpDLEVBQXFEO0FBQUVDLGdCQUFRO0FBQVYsT0FBckQsQ0FBTjtBQUNBLEtBRkQsTUFFTztBQUNObEI7QUFDQTtBQUNELEdBTkQ7QUFPQSxDQS9CRDs7QUFpQ0EsTUFBTW1CLHVCQUF1QixVQUFTekosZUFBVCxFQUEwQjtBQUN0RCxNQUFJQSxnQkFBZ0JxQixVQUFwQixFQUFnQztBQUMvQixVQUFNL0IsV0FBV1AsS0FBS3NFLElBQUwsQ0FBVXJELGdCQUFnQnFFLFVBQTFCLEVBQXNDLGVBQXRDLENBQWpCO0FBQ0FoRixjQUFVQyxRQUFWLEVBQW9CLEVBQXBCO0FBRUFVLG9CQUFnQkMsUUFBaEIsQ0FBeUJPLE9BQXpCLENBQWtDSSxRQUFELElBQWM7QUFDOUMsWUFBTThJLGNBQWM7QUFDbkJoSixnQkFBUUUsU0FBU0YsTUFERTtBQUVuQkksa0JBQVVGLFNBQVNFLFFBRkE7QUFHbkJ4QyxjQUFNc0MsU0FBU3RDO0FBSEksT0FBcEI7QUFNQSxZQUFNc0csZ0JBQWdCQyxLQUFLQyxTQUFMLENBQWU0RSxXQUFmLENBQXRCO0FBQ0FqSyxrQkFBWUgsUUFBWixFQUF1QixHQUFHc0YsYUFBZSxJQUF6QztBQUNBLEtBVEQ7QUFVQTs7QUFFRDVFLGtCQUFnQjBCLE1BQWhCLEdBQXlCLFdBQXpCO0FBQ0EsQ0FsQkQ7O0FBb0JBLE1BQU1pSSwwQkFBMEIsVUFBUzNKLGVBQVQsRUFBMEI7QUFDekQsTUFBSUEsZ0JBQWdCMEIsTUFBaEIsS0FBMkIsV0FBL0IsRUFBNEM7QUFDM0M7QUFDQTs7QUFFRCxNQUFJLENBQUMxQixnQkFBZ0JDLFFBQXJCLEVBQStCO0FBQzlCRiwwQkFBc0JDLGVBQXRCO0FBQ0E7O0FBRUQsTUFBSTtBQUVILFFBQUlBLGdCQUFnQjBCLE1BQWhCLEtBQTJCLGlCQUEvQixFQUFrRDtBQUNqRCtILDJCQUFxQnpKLGVBQXJCO0FBQ0EsS0FKRSxDQU1IOzs7QUFDQSxRQUFJQSxnQkFBZ0IwQixNQUFoQixLQUEyQixXQUEvQixFQUE0QztBQUMzQzFCLHNCQUFnQkMsUUFBaEIsQ0FBeUJPLE9BQXpCLENBQWtDNEQsZ0JBQUQsSUFBc0I7QUFDdERELDhCQUFzQm5FLGVBQXRCLEVBQXVDb0UsZ0JBQXZDO0FBQ0EsT0FGRDs7QUFJQSxVQUFJMkIsaUJBQWlCL0YsZUFBakIsQ0FBSixFQUF1QztBQUN0Q0Esd0JBQWdCMEIsTUFBaEIsR0FBeUIsYUFBekI7QUFDQTtBQUNBO0FBQ0Q7O0FBRUQsUUFBSTFCLGdCQUFnQjBCLE1BQWhCLEtBQTJCLGFBQS9CLEVBQThDO0FBQzdDMUIsc0JBQWdCd0QsUUFBaEIsQ0FBeUJoRCxPQUF6QixDQUFrQ3FCLGNBQUQsSUFBb0I7QUFDcERtQyxpQkFBU2hFLGVBQVQsRUFBMEI2QixjQUExQjtBQUNBLE9BRkQ7O0FBSUEsVUFBSXFFLG1CQUFtQmxHLGVBQW5CLENBQUosRUFBeUM7QUFDeENBLHdCQUFnQjBCLE1BQWhCLEdBQXlCLGFBQXpCO0FBQ0E7QUFDQTtBQUNEOztBQUVELFFBQUkxQixnQkFBZ0IwQixNQUFoQixLQUEyQixhQUEvQixFQUE4QztBQUM3Q2lHLGtCQUFZM0gsZUFBWjtBQUNBQSxzQkFBZ0IwQixNQUFoQixHQUF5QixXQUF6QjtBQUNBO0FBQ0E7O0FBRUQsUUFBSTFCLGdCQUFnQjBCLE1BQWhCLEtBQTJCLFdBQS9CLEVBQTRDO0FBQzNDMkcsb0JBQWNySSxlQUFkLEVBQStCLE1BQU07QUFDcENBLHdCQUFnQjBCLE1BQWhCLEdBQXlCLFdBQXpCO0FBQ0F4RCxtQkFBV21DLE1BQVgsQ0FBa0J1SixnQkFBbEIsQ0FBbUNDLGVBQW5DLENBQW1EN0osZUFBbkQ7QUFDQSxPQUhEO0FBSUE7QUFDQTtBQUNELEdBMUNELENBMENFLE9BQU84SixDQUFQLEVBQVU7QUFDWHJDLFlBQVFzQyxLQUFSLENBQWNELENBQWQ7QUFDQTtBQUNELENBdEREOztBQXdEQSxTQUFTRSxvQkFBVCxHQUFnQztBQUMvQixRQUFNNUosU0FBU2xDLFdBQVdtQyxNQUFYLENBQWtCdUosZ0JBQWxCLENBQW1DSyxjQUFuQyxDQUFrRDtBQUFDMUYsV0FBTztBQUFSLEdBQWxELENBQWY7QUFDQW5FLFNBQU9JLE9BQVAsQ0FBZ0JSLGVBQUQsSUFBcUI7QUFDbkMsUUFBSUEsZ0JBQWdCMEIsTUFBaEIsS0FBMkIsV0FBL0IsRUFBNEM7QUFDM0M7QUFDQTs7QUFFRGlJLDRCQUF3QjNKLGVBQXhCO0FBQ0E5QixlQUFXbUMsTUFBWCxDQUFrQnVKLGdCQUFsQixDQUFtQ0MsZUFBbkMsQ0FBbUQ3SixlQUFuRDs7QUFFQSxRQUFJQSxnQkFBZ0IwQixNQUFoQixLQUEyQixXQUEvQixFQUE0QztBQUMzQzJFLGdCQUFVckcsZ0JBQWdCRyxNQUExQjtBQUNBO0FBQ0QsR0FYRDtBQVlBOztBQUVEK0csT0FBT2dELE9BQVAsQ0FBZSxZQUFXO0FBQ3pCaEQsU0FBT0MsS0FBUCxDQUFhLFlBQVc7QUFDdkI2QztBQUVBRyxlQUFXOUwsR0FBWCxDQUFlO0FBQ2QwQyxZQUFNLHVDQURRO0FBRWRxSixnQkFBV0MsTUFBRCxJQUFZQSxPQUFPQyxJQUFQLENBQWEsS0FBS2xMLG1CQUFxQixVQUF2QyxDQUZSO0FBR2RtTCxXQUFLUDtBQUhTLEtBQWY7QUFLQSxHQVJEO0FBU0EsQ0FWRCxFIiwiZmlsZSI6Ii9wYWNrYWdlcy9yb2NrZXRjaGF0X3VzZXItZGF0YS1kb3dubG9hZC5qcyIsInNvdXJjZXNDb250ZW50IjpbIlJvY2tldENoYXQuc2V0dGluZ3MuYWRkR3JvdXAoJ1VzZXJEYXRhRG93bmxvYWQnLCBmdW5jdGlvbigpIHtcblxuXHR0aGlzLmFkZCgnVXNlckRhdGFfRW5hYmxlRG93bmxvYWQnLCB0cnVlLCB7XG5cdFx0dHlwZTogJ2Jvb2xlYW4nLFxuXHRcdHB1YmxpYzogdHJ1ZSxcblx0XHRpMThuTGFiZWw6ICdVc2VyRGF0YV9FbmFibGVEb3dubG9hZCdcblx0fSk7XG5cblx0dGhpcy5hZGQoJ1VzZXJEYXRhX0ZpbGVTeXN0ZW1QYXRoJywgJycsIHtcblx0XHR0eXBlOiAnc3RyaW5nJyxcblx0XHRwdWJsaWM6IHRydWUsXG5cdFx0aTE4bkxhYmVsOiAnVXNlckRhdGFfRmlsZVN5c3RlbVBhdGgnXG5cdH0pO1xuXG5cdHRoaXMuYWRkKCdVc2VyRGF0YV9GaWxlU3lzdGVtWmlwUGF0aCcsICcnLCB7XG5cdFx0dHlwZTogJ3N0cmluZycsXG5cdFx0cHVibGljOiB0cnVlLFxuXHRcdGkxOG5MYWJlbDogJ1VzZXJEYXRhX0ZpbGVTeXN0ZW1aaXBQYXRoJ1xuXHR9KTtcblxuXHR0aGlzLmFkZCgnVXNlckRhdGFfUHJvY2Vzc2luZ0ZyZXF1ZW5jeScsIDE1LCB7XG5cdFx0dHlwZTogJ2ludCcsXG5cdFx0cHVibGljOiB0cnVlLFxuXHRcdGkxOG5MYWJlbDogJ1VzZXJEYXRhX1Byb2Nlc3NpbmdGcmVxdWVuY3knXG5cdH0pO1xuXG5cdHRoaXMuYWRkKCdVc2VyRGF0YV9NZXNzYWdlTGltaXRQZXJSZXF1ZXN0JywgMTAwLCB7XG5cdFx0dHlwZTogJ2ludCcsXG5cdFx0cHVibGljOiB0cnVlLFxuXHRcdGkxOG5MYWJlbDogJ1VzZXJEYXRhX01lc3NhZ2VMaW1pdFBlclJlcXVlc3QnXG5cdH0pO1xuXG5cbn0pO1xuIiwiLyogZ2xvYmFscyBTeW5jZWRDcm9uICovXG5cbmltcG9ydCBmcyBmcm9tICdmcyc7XG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCBhcmNoaXZlciBmcm9tICdhcmNoaXZlcic7XG5cbmxldCB6aXBGb2xkZXIgPSAnL3RtcC96aXBGaWxlcyc7XG5pZiAoUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ1VzZXJEYXRhX0ZpbGVTeXN0ZW1aaXBQYXRoJykgIT0gbnVsbCkge1xuXHRpZiAoUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ1VzZXJEYXRhX0ZpbGVTeXN0ZW1aaXBQYXRoJykudHJpbSgpICE9PSAnJykge1xuXHRcdHppcEZvbGRlciA9IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdVc2VyRGF0YV9GaWxlU3lzdGVtWmlwUGF0aCcpO1xuXHR9XG59XG5cbmxldCBwcm9jZXNzaW5nRnJlcXVlbmN5ID0gMTU7XG5pZiAoUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ1VzZXJEYXRhX1Byb2Nlc3NpbmdGcmVxdWVuY3knKSA+IDApIHtcblx0cHJvY2Vzc2luZ0ZyZXF1ZW5jeSA9IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdVc2VyRGF0YV9Qcm9jZXNzaW5nRnJlcXVlbmN5Jyk7XG59XG5cbmNvbnN0IHN0YXJ0RmlsZSA9IGZ1bmN0aW9uKGZpbGVOYW1lLCBjb250ZW50KSB7XG5cdGZzLndyaXRlRmlsZVN5bmMoZmlsZU5hbWUsIGNvbnRlbnQpO1xufTtcblxuY29uc3Qgd3JpdGVUb0ZpbGUgPSBmdW5jdGlvbihmaWxlTmFtZSwgY29udGVudCkge1xuXHRmcy5hcHBlbmRGaWxlU3luYyhmaWxlTmFtZSwgY29udGVudCk7XG59O1xuXG5jb25zdCBjcmVhdGVEaXIgPSBmdW5jdGlvbihmb2xkZXJOYW1lKSB7XG5cdGlmICghZnMuZXhpc3RzU3luYyhmb2xkZXJOYW1lKSkge1xuXHRcdGZzLm1rZGlyU3luYyhmb2xkZXJOYW1lKTtcblx0fVxufTtcblxuY29uc3QgbG9hZFVzZXJTdWJzY3JpcHRpb25zID0gZnVuY3Rpb24oZXhwb3J0T3BlcmF0aW9uKSB7XG5cdGV4cG9ydE9wZXJhdGlvbi5yb29tTGlzdCA9IFtdO1xuXG5cdGNvbnN0IGV4cG9ydFVzZXJJZCA9IGV4cG9ydE9wZXJhdGlvbi51c2VySWQ7XG5cdGNvbnN0IGN1cnNvciA9IFJvY2tldENoYXQubW9kZWxzLlN1YnNjcmlwdGlvbnMuZmluZEJ5VXNlcklkKGV4cG9ydFVzZXJJZCk7XG5cdGN1cnNvci5mb3JFYWNoKChzdWJzY3JpcHRpb24pID0+IHtcblx0XHRjb25zdCByb29tSWQgPSBzdWJzY3JpcHRpb24ucmlkO1xuXHRcdGNvbnN0IHJvb21EYXRhID0gc3Vic2NyaXB0aW9uLl9yb29tO1xuXHRcdGxldCByb29tTmFtZSA9IHJvb21EYXRhLm5hbWUgPyByb29tRGF0YS5uYW1lIDogcm9vbUlkO1xuXHRcdGxldCB1c2VySWQgPSBudWxsO1xuXG5cdFx0aWYgKHN1YnNjcmlwdGlvbi50ID09PSAnZCcpIHtcblx0XHRcdHVzZXJJZCA9IHJvb21JZC5yZXBsYWNlKGV4cG9ydFVzZXJJZCwgJycpO1xuXHRcdFx0Y29uc3QgdXNlckRhdGEgPSBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kT25lQnlJZCh1c2VySWQpO1xuXG5cdFx0XHRpZiAodXNlckRhdGEpIHtcblx0XHRcdFx0cm9vbU5hbWUgPSB1c2VyRGF0YS5uYW1lO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGNvbnN0IGZpbGVOYW1lID0gZXhwb3J0T3BlcmF0aW9uLmZ1bGxFeHBvcnQgPyByb29tSWQgOiByb29tTmFtZTtcblx0XHRjb25zdCBmaWxlVHlwZSA9IGV4cG9ydE9wZXJhdGlvbi5mdWxsRXhwb3J0ID8gJ2pzb24nIDogJ2h0bWwnO1xuXHRcdGNvbnN0IHRhcmdldEZpbGUgPSBgJHsgZmlsZU5hbWUgfS4keyBmaWxlVHlwZSB9YDtcblxuXHRcdGV4cG9ydE9wZXJhdGlvbi5yb29tTGlzdC5wdXNoKHtcblx0XHRcdHJvb21JZCxcblx0XHRcdHJvb21OYW1lLFxuXHRcdFx0dXNlcklkLFxuXHRcdFx0ZXhwb3J0ZWRDb3VudDogMCxcblx0XHRcdHN0YXR1czogJ3BlbmRpbmcnLFxuXHRcdFx0dGFyZ2V0RmlsZSxcblx0XHRcdHR5cGU6IHN1YnNjcmlwdGlvbi50XG5cdFx0fSk7XG5cdH0pO1xuXG5cdGlmIChleHBvcnRPcGVyYXRpb24uZnVsbEV4cG9ydCkge1xuXHRcdGV4cG9ydE9wZXJhdGlvbi5zdGF0dXMgPSAnZXhwb3J0aW5nLXJvb21zJztcblx0fSBlbHNlIHtcblx0XHRleHBvcnRPcGVyYXRpb24uc3RhdHVzID0gJ2V4cG9ydGluZyc7XG5cdH1cbn07XG5cbmNvbnN0IGdldEF0dGFjaG1lbnREYXRhID0gZnVuY3Rpb24oYXR0YWNobWVudCkge1xuXHRjb25zdCBhdHRhY2htZW50RGF0YSA9IHtcblx0XHR0eXBlIDogYXR0YWNobWVudC50eXBlLFxuXHRcdHRpdGxlOiBhdHRhY2htZW50LnRpdGxlLFxuXHRcdHRpdGxlX2xpbms6IGF0dGFjaG1lbnQudGl0bGVfbGluayxcblx0XHRpbWFnZV91cmw6IGF0dGFjaG1lbnQuaW1hZ2VfdXJsLFxuXHRcdGF1ZGlvX3VybDogYXR0YWNobWVudC5hdWRpb191cmwsXG5cdFx0dmlkZW9fdXJsOiBhdHRhY2htZW50LnZpZGVvX3VybCxcblx0XHRtZXNzYWdlX2xpbms6IGF0dGFjaG1lbnQubWVzc2FnZV9saW5rLFxuXHRcdGltYWdlX3R5cGU6IGF0dGFjaG1lbnQuaW1hZ2VfdHlwZSxcblx0XHRpbWFnZV9zaXplOiBhdHRhY2htZW50LmltYWdlX3NpemUsXG5cdFx0dmlkZW9fc2l6ZTogYXR0YWNobWVudC52aWRlb19zaXplLFxuXHRcdHZpZGVvX3R5cGU6IGF0dGFjaG1lbnQudmlkZW9fdHlwZSxcblx0XHRhdWRpb19zaXplOiBhdHRhY2htZW50LmF1ZGlvX3NpemUsXG5cdFx0YXVkaW9fdHlwZTogYXR0YWNobWVudC5hdWRpb190eXBlLFxuXHRcdHVybDogbnVsbCxcblx0XHRyZW1vdGU6IGZhbHNlLFxuXHRcdGZpbGVJZDogbnVsbCxcblx0XHRmaWxlTmFtZTogbnVsbFxuXHR9O1xuXG5cdGNvbnN0IHVybCA9IGF0dGFjaG1lbnQudGl0bGVfbGluayB8fCBhdHRhY2htZW50LmltYWdlX3VybCB8fCBhdHRhY2htZW50LmF1ZGlvX3VybCB8fCBhdHRhY2htZW50LnZpZGVvX3VybCB8fCBhdHRhY2htZW50Lm1lc3NhZ2VfbGluaztcblx0aWYgKHVybCkge1xuXHRcdGF0dGFjaG1lbnREYXRhLnVybCA9IHVybDtcblxuXHRcdGNvbnN0IHVybE1hdGNoID0gL1xcOlxcL1xcLy8uZXhlYyh1cmwpO1xuXHRcdGlmICh1cmxNYXRjaCAmJiB1cmxNYXRjaC5sZW5ndGggPiAwKSB7XG5cdFx0XHRhdHRhY2htZW50RGF0YS5yZW1vdGUgPSB0cnVlO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRjb25zdCBtYXRjaCA9IC9eXFwvKFteXFwvXSspXFwvKFteXFwvXSspXFwvKC4qKS8uZXhlYyh1cmwpO1xuXG5cdFx0XHRpZiAobWF0Y2ggJiYgbWF0Y2hbMl0pIHtcblx0XHRcdFx0Y29uc3QgZmlsZSA9IFJvY2tldENoYXQubW9kZWxzLlVwbG9hZHMuZmluZE9uZUJ5SWQobWF0Y2hbMl0pO1xuXG5cdFx0XHRcdGlmIChmaWxlKSB7XG5cdFx0XHRcdFx0YXR0YWNobWVudERhdGEuZmlsZUlkID0gZmlsZS5faWQ7XG5cdFx0XHRcdFx0YXR0YWNobWVudERhdGEuZmlsZU5hbWUgPSBmaWxlLm5hbWU7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRyZXR1cm4gYXR0YWNobWVudERhdGE7XG59O1xuXG5jb25zdCBhZGRUb0ZpbGVMaXN0ID0gZnVuY3Rpb24oZXhwb3J0T3BlcmF0aW9uLCBhdHRhY2htZW50KSB7XG5cdGNvbnN0IHRhcmdldEZpbGUgPSBwYXRoLmpvaW4oZXhwb3J0T3BlcmF0aW9uLmFzc2V0c1BhdGgsIGAkeyBhdHRhY2htZW50LmZpbGVJZCB9LSR7IGF0dGFjaG1lbnQuZmlsZU5hbWUgfWApO1xuXG5cdGNvbnN0IGF0dGFjaG1lbnREYXRhID0ge1xuXHRcdHVybDogYXR0YWNobWVudC51cmwsXG5cdFx0Y29waWVkOiBmYWxzZSxcblx0XHRyZW1vdGU6IGF0dGFjaG1lbnQucmVtb3RlLFxuXHRcdGZpbGVJZDogYXR0YWNobWVudC5maWxlSWQsXG5cdFx0ZmlsZU5hbWU6IGF0dGFjaG1lbnQuZmlsZU5hbWUsXG5cdFx0dGFyZ2V0RmlsZVxuXHR9O1xuXG5cdGV4cG9ydE9wZXJhdGlvbi5maWxlTGlzdC5wdXNoKGF0dGFjaG1lbnREYXRhKTtcbn07XG5cbmNvbnN0IGdldE1lc3NhZ2VEYXRhID0gZnVuY3Rpb24obXNnLCBleHBvcnRPcGVyYXRpb24pIHtcblx0Y29uc3QgYXR0YWNobWVudHMgPSBbXTtcblxuXHRpZiAobXNnLmF0dGFjaG1lbnRzKSB7XG5cdFx0bXNnLmF0dGFjaG1lbnRzLmZvckVhY2goKGF0dGFjaG1lbnQpID0+IHtcblx0XHRcdGNvbnN0IGF0dGFjaG1lbnREYXRhID0gZ2V0QXR0YWNobWVudERhdGEoYXR0YWNobWVudCk7XG5cblx0XHRcdGF0dGFjaG1lbnRzLnB1c2goYXR0YWNobWVudERhdGEpO1xuXHRcdFx0YWRkVG9GaWxlTGlzdChleHBvcnRPcGVyYXRpb24sIGF0dGFjaG1lbnREYXRhKTtcblx0XHR9KTtcblx0fVxuXG5cdGNvbnN0IG1lc3NhZ2VPYmplY3QgPSB7XG5cdFx0bXNnOiBtc2cubXNnLFxuXHRcdHVzZXJuYW1lOiBtc2cudS51c2VybmFtZSxcblx0XHR0czogbXNnLnRzXG5cdH07XG5cblx0aWYgKGF0dGFjaG1lbnRzICYmIGF0dGFjaG1lbnRzLmxlbmd0aCA+IDApIHtcblx0XHRtZXNzYWdlT2JqZWN0LmF0dGFjaG1lbnRzID0gYXR0YWNobWVudHM7XG5cdH1cblx0aWYgKG1zZy50KSB7XG5cdFx0bWVzc2FnZU9iamVjdC50eXBlID0gbXNnLnQ7XG5cdH1cblx0aWYgKG1zZy51Lm5hbWUpIHtcblx0XHRtZXNzYWdlT2JqZWN0Lm5hbWUgPSBtc2cudS5uYW1lO1xuXHR9XG5cblx0cmV0dXJuIG1lc3NhZ2VPYmplY3Q7XG59O1xuXG5jb25zdCBjb3B5RmlsZSA9IGZ1bmN0aW9uKGV4cG9ydE9wZXJhdGlvbiwgYXR0YWNobWVudERhdGEpIHtcblx0aWYgKGF0dGFjaG1lbnREYXRhLmNvcGllZCB8fCBhdHRhY2htZW50RGF0YS5yZW1vdGUgfHwgIWF0dGFjaG1lbnREYXRhLmZpbGVJZCkge1xuXHRcdGF0dGFjaG1lbnREYXRhLmNvcGllZCA9IHRydWU7XG5cdFx0cmV0dXJuO1xuXHR9XG5cblx0Y29uc3QgZmlsZSA9IFJvY2tldENoYXQubW9kZWxzLlVwbG9hZHMuZmluZE9uZUJ5SWQoYXR0YWNobWVudERhdGEuZmlsZUlkKTtcblxuXHRpZiAoZmlsZSkge1xuXHRcdGlmIChGaWxlVXBsb2FkLmNvcHkoZmlsZSwgYXR0YWNobWVudERhdGEudGFyZ2V0RmlsZSkpIHtcblx0XHRcdGF0dGFjaG1lbnREYXRhLmNvcGllZCA9IHRydWU7XG5cdFx0fVxuXHR9XG59O1xuXG5jb25zdCBjb250aW51ZUV4cG9ydGluZ1Jvb20gPSBmdW5jdGlvbihleHBvcnRPcGVyYXRpb24sIGV4cG9ydE9wUm9vbURhdGEpIHtcblx0Y3JlYXRlRGlyKGV4cG9ydE9wZXJhdGlvbi5leHBvcnRQYXRoKTtcblx0Y3JlYXRlRGlyKGV4cG9ydE9wZXJhdGlvbi5hc3NldHNQYXRoKTtcblxuXHRjb25zdCBmaWxlUGF0aCA9IHBhdGguam9pbihleHBvcnRPcGVyYXRpb24uZXhwb3J0UGF0aCwgZXhwb3J0T3BSb29tRGF0YS50YXJnZXRGaWxlKTtcblxuXHRpZiAoZXhwb3J0T3BSb29tRGF0YS5zdGF0dXMgPT09ICdwZW5kaW5nJykge1xuXHRcdGV4cG9ydE9wUm9vbURhdGEuc3RhdHVzID0gJ2V4cG9ydGluZyc7XG5cdFx0c3RhcnRGaWxlKGZpbGVQYXRoLCAnJyk7XG5cdFx0aWYgKCFleHBvcnRPcGVyYXRpb24uZnVsbEV4cG9ydCkge1xuXHRcdFx0d3JpdGVUb0ZpbGUoZmlsZVBhdGgsICc8bWV0YSBodHRwLWVxdWl2PVwiY29udGVudC10eXBlXCIgY29udGVudD1cInRleHQvaHRtbDsgY2hhcnNldD11dGYtOFwiPicpO1xuXHRcdH1cblx0fVxuXG5cdGxldCBsaW1pdCA9IDEwMDtcblx0aWYgKFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdVc2VyRGF0YV9NZXNzYWdlTGltaXRQZXJSZXF1ZXN0JykgPiAwKSB7XG5cdFx0bGltaXQgPSBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnVXNlckRhdGFfTWVzc2FnZUxpbWl0UGVyUmVxdWVzdCcpO1xuXHR9XG5cblx0Y29uc3Qgc2tpcCA9IGV4cG9ydE9wUm9vbURhdGEuZXhwb3J0ZWRDb3VudDtcblxuXHRjb25zdCBjdXJzb3IgPSBSb2NrZXRDaGF0Lm1vZGVscy5NZXNzYWdlcy5maW5kQnlSb29tSWQoZXhwb3J0T3BSb29tRGF0YS5yb29tSWQsIHsgbGltaXQsIHNraXAgfSk7XG5cdGNvbnN0IGNvdW50ID0gY3Vyc29yLmNvdW50KCk7XG5cblx0Y3Vyc29yLmZvckVhY2goKG1zZykgPT4ge1xuXHRcdGNvbnN0IG1lc3NhZ2VPYmplY3QgPSBnZXRNZXNzYWdlRGF0YShtc2csIGV4cG9ydE9wZXJhdGlvbik7XG5cblx0XHRpZiAoZXhwb3J0T3BlcmF0aW9uLmZ1bGxFeHBvcnQpIHtcblx0XHRcdGNvbnN0IG1lc3NhZ2VTdHJpbmcgPSBKU09OLnN0cmluZ2lmeShtZXNzYWdlT2JqZWN0KTtcblx0XHRcdHdyaXRlVG9GaWxlKGZpbGVQYXRoLCBgJHsgbWVzc2FnZVN0cmluZyB9XFxuYCk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGNvbnN0IG1lc3NhZ2VUeXBlID0gbXNnLnQ7XG5cdFx0XHRjb25zdCB1c2VyTmFtZSA9IG1zZy51LnVzZXJuYW1lIHx8IG1zZy51Lm5hbWU7XG5cdFx0XHRjb25zdCB0aW1lc3RhbXAgPSBtc2cudHMgPyBuZXcgRGF0ZShtc2cudHMpLnRvVVRDU3RyaW5nKCkgOiAnJztcblx0XHRcdGxldCBtZXNzYWdlID0gbXNnLm1zZztcblxuXHRcdFx0c3dpdGNoIChtZXNzYWdlVHlwZSkge1xuXHRcdFx0XHRjYXNlICd1aic6XG5cdFx0XHRcdFx0bWVzc2FnZSA9IFRBUGkxOG4uX18oJ1VzZXJfam9pbmVkX2NoYW5uZWwnKTtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0Y2FzZSAndWwnOlxuXHRcdFx0XHRcdG1lc3NhZ2UgPSBUQVBpMThuLl9fKCdVc2VyX2xlZnQnKTtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0Y2FzZSAnYXUnOlxuXHRcdFx0XHRcdG1lc3NhZ2UgPSBUQVBpMThuLl9fKCdVc2VyX2FkZGVkX2J5Jywge3VzZXJfYWRkZWQgOiBtc2cubXNnLCB1c2VyX2J5IDogbXNnLnUudXNlcm5hbWUgfSk7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdGNhc2UgJ3InOlxuXHRcdFx0XHRcdG1lc3NhZ2UgPSBUQVBpMThuLl9fKCdSb29tX25hbWVfY2hhbmdlZCcsIHsgcm9vbV9uYW1lOiBtc2cubXNnLCB1c2VyX2J5OiBtc2cudS51c2VybmFtZSB9KTtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0Y2FzZSAncnUnOlxuXHRcdFx0XHRcdG1lc3NhZ2UgPSBUQVBpMThuLl9fKCdVc2VyX3JlbW92ZWRfYnknLCB7dXNlcl9yZW1vdmVkIDogbXNnLm1zZywgdXNlcl9ieSA6IG1zZy51LnVzZXJuYW1lIH0pO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRjYXNlICd3bSc6XG5cdFx0XHRcdFx0bWVzc2FnZSA9IFRBUGkxOG4uX18oJ1dlbGNvbWUnLCB7dXNlcjogbXNnLnUudXNlcm5hbWUgfSk7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdGNhc2UgJ2xpdmVjaGF0LWNsb3NlJzpcblx0XHRcdFx0XHRtZXNzYWdlID0gVEFQaTE4bi5fXygnQ29udmVyc2F0aW9uX2ZpbmlzaGVkJyk7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChtZXNzYWdlICE9PSBtc2cubXNnKSB7XG5cdFx0XHRcdG1lc3NhZ2UgPSBgPGk+JHsgbWVzc2FnZSB9PC9pPmA7XG5cdFx0XHR9XG5cblx0XHRcdHdyaXRlVG9GaWxlKGZpbGVQYXRoLCBgPHA+PHN0cm9uZz4keyB1c2VyTmFtZSB9PC9zdHJvbmc+ICgkeyB0aW1lc3RhbXAgfSk6PGJyLz5gKTtcblx0XHRcdHdyaXRlVG9GaWxlKGZpbGVQYXRoLCBtZXNzYWdlKTtcblxuXHRcdFx0aWYgKG1lc3NhZ2VPYmplY3QuYXR0YWNobWVudHMgJiYgbWVzc2FnZU9iamVjdC5hdHRhY2htZW50cy5sZW5ndGggPiAwKSB7XG5cdFx0XHRcdG1lc3NhZ2VPYmplY3QuYXR0YWNobWVudHMuZm9yRWFjaCgoYXR0YWNobWVudCkgPT4ge1xuXHRcdFx0XHRcdGlmIChhdHRhY2htZW50LnR5cGUgPT09ICdmaWxlJykge1xuXHRcdFx0XHRcdFx0Y29uc3QgZGVzY3JpcHRpb24gPSBhdHRhY2htZW50LmRlc2NyaXB0aW9uIHx8IGF0dGFjaG1lbnQudGl0bGUgfHwgVEFQaTE4bi5fXygnTWVzc2FnZV9BdHRhY2htZW50cycpO1xuXG5cdFx0XHRcdFx0XHRjb25zdCBhc3NldFVybCA9IGAuL2Fzc2V0cy8keyBhdHRhY2htZW50LmZpbGVJZCB9LSR7IGF0dGFjaG1lbnQuZmlsZU5hbWUgfWA7XG5cdFx0XHRcdFx0XHRjb25zdCBsaW5rID0gYDxici8+PGEgaHJlZj1cIiR7IGFzc2V0VXJsIH1cIj4keyBkZXNjcmlwdGlvbiB9PC9hPmA7XG5cdFx0XHRcdFx0XHR3cml0ZVRvRmlsZShmaWxlUGF0aCwgbGluayk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9KTtcblx0XHRcdH1cblxuXHRcdFx0d3JpdGVUb0ZpbGUoZmlsZVBhdGgsICc8L3A+Jyk7XG5cdFx0fVxuXG5cdFx0ZXhwb3J0T3BSb29tRGF0YS5leHBvcnRlZENvdW50Kys7XG5cdH0pO1xuXG5cdGlmIChjb3VudCA8PSBleHBvcnRPcFJvb21EYXRhLmV4cG9ydGVkQ291bnQpIHtcblx0XHRleHBvcnRPcFJvb21EYXRhLnN0YXR1cyA9ICdjb21wbGV0ZWQnO1xuXHRcdHJldHVybiB0cnVlO1xuXHR9XG5cblx0cmV0dXJuIGZhbHNlO1xufTtcblxuY29uc3QgaXNFeHBvcnRDb21wbGV0ZSA9IGZ1bmN0aW9uKGV4cG9ydE9wZXJhdGlvbikge1xuXHRjb25zdCBpbmNvbXBsZXRlID0gZXhwb3J0T3BlcmF0aW9uLnJvb21MaXN0LnNvbWUoKGV4cG9ydE9wUm9vbURhdGEpID0+IHtcblx0XHRyZXR1cm4gZXhwb3J0T3BSb29tRGF0YS5zdGF0dXMgIT09ICdjb21wbGV0ZWQnO1xuXHR9KTtcblxuXHRyZXR1cm4gIWluY29tcGxldGU7XG59O1xuXG5jb25zdCBpc0Rvd25sb2FkRmluaXNoZWQgPSBmdW5jdGlvbihleHBvcnRPcGVyYXRpb24pIHtcblx0Y29uc3QgYW55RG93bmxvYWRQZW5kaW5nID0gZXhwb3J0T3BlcmF0aW9uLmZpbGVMaXN0LnNvbWUoKGZpbGVEYXRhKSA9PiB7XG5cdFx0cmV0dXJuICFmaWxlRGF0YS5jb3BpZWQgJiYgIWZpbGVEYXRhLnJlbW90ZTtcblx0fSk7XG5cblx0cmV0dXJuICFhbnlEb3dubG9hZFBlbmRpbmc7XG59O1xuXG5jb25zdCBzZW5kRW1haWwgPSBmdW5jdGlvbih1c2VySWQpIHtcblx0Y29uc3QgbGFzdEZpbGUgPSBSb2NrZXRDaGF0Lm1vZGVscy5Vc2VyRGF0YUZpbGVzLmZpbmRMYXN0RmlsZUJ5VXNlcih1c2VySWQpO1xuXHRpZiAobGFzdEZpbGUpIHtcblx0XHRjb25zdCB1c2VyRGF0YSA9IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmVCeUlkKHVzZXJJZCk7XG5cblx0XHRpZiAodXNlckRhdGEgJiYgdXNlckRhdGEuZW1haWxzICYmIHVzZXJEYXRhLmVtYWlsc1swXSAmJiB1c2VyRGF0YS5lbWFpbHNbMF0uYWRkcmVzcykge1xuXHRcdFx0Y29uc3QgZW1haWxBZGRyZXNzID0gYCR7IHVzZXJEYXRhLm5hbWUgfSA8JHsgdXNlckRhdGEuZW1haWxzWzBdLmFkZHJlc3MgfT5gO1xuXHRcdFx0Y29uc3QgZnJvbUFkZHJlc3MgPSBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnRnJvbV9FbWFpbCcpO1xuXHRcdFx0Y29uc3Qgc3ViamVjdCA9IFRBUGkxOG4uX18oJ1VzZXJEYXRhRG93bmxvYWRfRW1haWxTdWJqZWN0Jyk7XG5cblx0XHRcdGNvbnN0IGRvd25sb2FkX2xpbmsgPSBsYXN0RmlsZS51cmw7XG5cdFx0XHRjb25zdCBib2R5ID0gVEFQaTE4bi5fXygnVXNlckRhdGFEb3dubG9hZF9FbWFpbEJvZHknLCB7IGRvd25sb2FkX2xpbmsgfSk7XG5cblx0XHRcdGNvbnN0IHJmY01haWxQYXR0ZXJuV2l0aE5hbWUgPSAvXig/Oi4qPCk/KFthLXpBLVowLTkuISMkJSYnKitcXC89P15fYHt8fX4tXStAW2EtekEtWjAtOV0oPzpbYS16QS1aMC05LV17MCw2MX1bYS16QS1aMC05XSk/KD86XFwuW2EtekEtWjAtOV0oPzpbYS16QS1aMC05LV17MCw2MX1bYS16QS1aMC05XSk/KSopKD86Pj8pJC87XG5cblx0XHRcdGlmIChyZmNNYWlsUGF0dGVybldpdGhOYW1lLnRlc3QoZW1haWxBZGRyZXNzKSkge1xuXHRcdFx0XHRNZXRlb3IuZGVmZXIoZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0cmV0dXJuIEVtYWlsLnNlbmQoe1xuXHRcdFx0XHRcdFx0dG86IGVtYWlsQWRkcmVzcyxcblx0XHRcdFx0XHRcdGZyb206IGZyb21BZGRyZXNzLFxuXHRcdFx0XHRcdFx0c3ViamVjdCxcblx0XHRcdFx0XHRcdGh0bWw6IGJvZHlcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0cmV0dXJuIGNvbnNvbGUubG9nKGBTZW5kaW5nIGVtYWlsIHRvICR7IGVtYWlsQWRkcmVzcyB9YCk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG59O1xuXG5jb25zdCBtYWtlWmlwRmlsZSA9IGZ1bmN0aW9uKGV4cG9ydE9wZXJhdGlvbikge1xuXHRjb25zdCB0YXJnZXRGaWxlID0gcGF0aC5qb2luKHppcEZvbGRlciwgYCR7IGV4cG9ydE9wZXJhdGlvbi51c2VySWQgfS56aXBgKTtcblx0Y29uc3Qgb3V0cHV0ID0gZnMuY3JlYXRlV3JpdGVTdHJlYW0odGFyZ2V0RmlsZSk7XG5cblx0ZXhwb3J0T3BlcmF0aW9uLmdlbmVyYXRlZEZpbGUgPSB0YXJnZXRGaWxlO1xuXG5cdGNvbnN0IGFyY2hpdmUgPSBhcmNoaXZlcignemlwJyk7XG5cblx0b3V0cHV0Lm9uKCdjbG9zZScsICgpID0+IHtcblx0fSk7XG5cblx0YXJjaGl2ZS5vbignZXJyb3InLCAoZXJyKSA9PiB7XG5cdFx0dGhyb3cgZXJyO1xuXHR9KTtcblxuXHRhcmNoaXZlLnBpcGUob3V0cHV0KTtcblx0YXJjaGl2ZS5kaXJlY3RvcnkoZXhwb3J0T3BlcmF0aW9uLmV4cG9ydFBhdGgsIGZhbHNlKTtcblx0YXJjaGl2ZS5maW5hbGl6ZSgpO1xufTtcblxuY29uc3QgdXBsb2FkWmlwRmlsZSA9IGZ1bmN0aW9uKGV4cG9ydE9wZXJhdGlvbiwgY2FsbGJhY2spIHtcblx0Y29uc3QgdXNlckRhdGFTdG9yZSA9IEZpbGVVcGxvYWQuZ2V0U3RvcmUoJ1VzZXJEYXRhRmlsZXMnKTtcblx0Y29uc3QgZmlsZVBhdGggPSBleHBvcnRPcGVyYXRpb24uZ2VuZXJhdGVkRmlsZTtcblxuXHRjb25zdCBzdGF0ID0gTWV0ZW9yLndyYXBBc3luYyhmcy5zdGF0KShmaWxlUGF0aCk7XG5cdGNvbnN0IHN0cmVhbSA9IGZzLmNyZWF0ZVJlYWRTdHJlYW0oZmlsZVBhdGgpO1xuXG5cdGNvbnN0IGNvbnRlbnRUeXBlID0gJ2FwcGxpY2F0aW9uL3ppcCc7XG5cdGNvbnN0IHNpemUgPSBzdGF0LnNpemU7XG5cblx0Y29uc3QgdXNlcklkID0gZXhwb3J0T3BlcmF0aW9uLnVzZXJJZDtcblx0Y29uc3QgdXNlciA9IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmVCeUlkKHVzZXJJZCk7XG5cdGNvbnN0IHVzZXJEaXNwbGF5TmFtZSA9IHVzZXIgPyB1c2VyLm5hbWUgOiB1c2VySWQ7XG5cdGNvbnN0IHV0Y0RhdGUgPSBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCkuc3BsaXQoJ1QnKVswXTtcblxuXHRjb25zdCBuZXdGaWxlTmFtZSA9IGVuY29kZVVSSUNvbXBvbmVudChgJHsgdXRjRGF0ZSB9LSR7IHVzZXJEaXNwbGF5TmFtZSB9LnppcGApO1xuXG5cdGNvbnN0IGRldGFpbHMgPSB7XG5cdFx0dXNlcklkLFxuXHRcdHR5cGU6IGNvbnRlbnRUeXBlLFxuXHRcdHNpemUsXG5cdFx0bmFtZTogbmV3RmlsZU5hbWVcblx0fTtcblxuXHR1c2VyRGF0YVN0b3JlLmluc2VydChkZXRhaWxzLCBzdHJlYW0sIChlcnIpID0+IHtcblx0XHRpZiAoZXJyKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdpbnZhbGlkLWZpbGUnLCAnSW52YWxpZCBaaXAgRmlsZScsIHsgbWV0aG9kOiAnY3JvblByb2Nlc3NEb3dubG9hZHMudXBsb2FkWmlwRmlsZScgfSk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGNhbGxiYWNrKCk7XG5cdFx0fVxuXHR9KTtcbn07XG5cbmNvbnN0IGdlbmVyYXRlQ2hhbm5lbHNGaWxlID0gZnVuY3Rpb24oZXhwb3J0T3BlcmF0aW9uKSB7XG5cdGlmIChleHBvcnRPcGVyYXRpb24uZnVsbEV4cG9ydCkge1xuXHRcdGNvbnN0IGZpbGVOYW1lID0gcGF0aC5qb2luKGV4cG9ydE9wZXJhdGlvbi5leHBvcnRQYXRoLCAnY2hhbm5lbHMuanNvbicpO1xuXHRcdHN0YXJ0RmlsZShmaWxlTmFtZSwgJycpO1xuXG5cdFx0ZXhwb3J0T3BlcmF0aW9uLnJvb21MaXN0LmZvckVhY2goKHJvb21EYXRhKSA9PiB7XG5cdFx0XHRjb25zdCBuZXdSb29tRGF0YSA9IHtcblx0XHRcdFx0cm9vbUlkOiByb29tRGF0YS5yb29tSWQsXG5cdFx0XHRcdHJvb21OYW1lOiByb29tRGF0YS5yb29tTmFtZSxcblx0XHRcdFx0dHlwZTogcm9vbURhdGEudHlwZVxuXHRcdFx0fTtcblxuXHRcdFx0Y29uc3QgbWVzc2FnZVN0cmluZyA9IEpTT04uc3RyaW5naWZ5KG5ld1Jvb21EYXRhKTtcblx0XHRcdHdyaXRlVG9GaWxlKGZpbGVOYW1lLCBgJHsgbWVzc2FnZVN0cmluZyB9XFxuYCk7XG5cdFx0fSk7XG5cdH1cblxuXHRleHBvcnRPcGVyYXRpb24uc3RhdHVzID0gJ2V4cG9ydGluZyc7XG59O1xuXG5jb25zdCBjb250aW51ZUV4cG9ydE9wZXJhdGlvbiA9IGZ1bmN0aW9uKGV4cG9ydE9wZXJhdGlvbikge1xuXHRpZiAoZXhwb3J0T3BlcmF0aW9uLnN0YXR1cyA9PT0gJ2NvbXBsZXRlZCcpIHtcblx0XHRyZXR1cm47XG5cdH1cblxuXHRpZiAoIWV4cG9ydE9wZXJhdGlvbi5yb29tTGlzdCkge1xuXHRcdGxvYWRVc2VyU3Vic2NyaXB0aW9ucyhleHBvcnRPcGVyYXRpb24pO1xuXHR9XG5cblx0dHJ5IHtcblxuXHRcdGlmIChleHBvcnRPcGVyYXRpb24uc3RhdHVzID09PSAnZXhwb3J0aW5nLXJvb21zJykge1xuXHRcdFx0Z2VuZXJhdGVDaGFubmVsc0ZpbGUoZXhwb3J0T3BlcmF0aW9uKTtcblx0XHR9XG5cblx0XHQvL1J1biBldmVyeSByb29tIG9uIGV2ZXJ5IHJlcXVlc3QsIHRvIGF2b2lkIG1pc3NpbmcgbmV3IG1lc3NhZ2VzIG9uIHRoZSByb29tcyB0aGF0IGZpbmlzaGVkIGZpcnN0LlxuXHRcdGlmIChleHBvcnRPcGVyYXRpb24uc3RhdHVzID09PSAnZXhwb3J0aW5nJykge1xuXHRcdFx0ZXhwb3J0T3BlcmF0aW9uLnJvb21MaXN0LmZvckVhY2goKGV4cG9ydE9wUm9vbURhdGEpID0+IHtcblx0XHRcdFx0Y29udGludWVFeHBvcnRpbmdSb29tKGV4cG9ydE9wZXJhdGlvbiwgZXhwb3J0T3BSb29tRGF0YSk7XG5cdFx0XHR9KTtcblxuXHRcdFx0aWYgKGlzRXhwb3J0Q29tcGxldGUoZXhwb3J0T3BlcmF0aW9uKSkge1xuXHRcdFx0XHRleHBvcnRPcGVyYXRpb24uc3RhdHVzID0gJ2Rvd25sb2FkaW5nJztcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGlmIChleHBvcnRPcGVyYXRpb24uc3RhdHVzID09PSAnZG93bmxvYWRpbmcnKSB7XG5cdFx0XHRleHBvcnRPcGVyYXRpb24uZmlsZUxpc3QuZm9yRWFjaCgoYXR0YWNobWVudERhdGEpID0+IHtcblx0XHRcdFx0Y29weUZpbGUoZXhwb3J0T3BlcmF0aW9uLCBhdHRhY2htZW50RGF0YSk7XG5cdFx0XHR9KTtcblxuXHRcdFx0aWYgKGlzRG93bmxvYWRGaW5pc2hlZChleHBvcnRPcGVyYXRpb24pKSB7XG5cdFx0XHRcdGV4cG9ydE9wZXJhdGlvbi5zdGF0dXMgPSAnY29tcHJlc3NpbmcnO1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0aWYgKGV4cG9ydE9wZXJhdGlvbi5zdGF0dXMgPT09ICdjb21wcmVzc2luZycpIHtcblx0XHRcdG1ha2VaaXBGaWxlKGV4cG9ydE9wZXJhdGlvbik7XG5cdFx0XHRleHBvcnRPcGVyYXRpb24uc3RhdHVzID0gJ3VwbG9hZGluZyc7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0aWYgKGV4cG9ydE9wZXJhdGlvbi5zdGF0dXMgPT09ICd1cGxvYWRpbmcnKSB7XG5cdFx0XHR1cGxvYWRaaXBGaWxlKGV4cG9ydE9wZXJhdGlvbiwgKCkgPT4ge1xuXHRcdFx0XHRleHBvcnRPcGVyYXRpb24uc3RhdHVzID0gJ2NvbXBsZXRlZCc7XG5cdFx0XHRcdFJvY2tldENoYXQubW9kZWxzLkV4cG9ydE9wZXJhdGlvbnMudXBkYXRlT3BlcmF0aW9uKGV4cG9ydE9wZXJhdGlvbik7XG5cdFx0XHR9KTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cdH0gY2F0Y2ggKGUpIHtcblx0XHRjb25zb2xlLmVycm9yKGUpO1xuXHR9XG59O1xuXG5mdW5jdGlvbiBwcm9jZXNzRGF0YURvd25sb2FkcygpIHtcblx0Y29uc3QgY3Vyc29yID0gUm9ja2V0Q2hhdC5tb2RlbHMuRXhwb3J0T3BlcmF0aW9ucy5maW5kQWxsUGVuZGluZyh7bGltaXQ6IDF9KTtcblx0Y3Vyc29yLmZvckVhY2goKGV4cG9ydE9wZXJhdGlvbikgPT4ge1xuXHRcdGlmIChleHBvcnRPcGVyYXRpb24uc3RhdHVzID09PSAnY29tcGxldGVkJykge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGNvbnRpbnVlRXhwb3J0T3BlcmF0aW9uKGV4cG9ydE9wZXJhdGlvbik7XG5cdFx0Um9ja2V0Q2hhdC5tb2RlbHMuRXhwb3J0T3BlcmF0aW9ucy51cGRhdGVPcGVyYXRpb24oZXhwb3J0T3BlcmF0aW9uKTtcblxuXHRcdGlmIChleHBvcnRPcGVyYXRpb24uc3RhdHVzID09PSAnY29tcGxldGVkJykge1xuXHRcdFx0c2VuZEVtYWlsKGV4cG9ydE9wZXJhdGlvbi51c2VySWQpO1xuXHRcdH1cblx0fSk7XG59XG5cbk1ldGVvci5zdGFydHVwKGZ1bmN0aW9uKCkge1xuXHRNZXRlb3IuZGVmZXIoZnVuY3Rpb24oKSB7XG5cdFx0cHJvY2Vzc0RhdGFEb3dubG9hZHMoKTtcblxuXHRcdFN5bmNlZENyb24uYWRkKHtcblx0XHRcdG5hbWU6ICdHZW5lcmF0ZSBkb3dubG9hZCBmaWxlcyBmb3IgdXNlciBkYXRhJyxcblx0XHRcdHNjaGVkdWxlOiAocGFyc2VyKSA9PiBwYXJzZXIuY3JvbihgKi8keyBwcm9jZXNzaW5nRnJlcXVlbmN5IH0gKiAqICogKmApLFxuXHRcdFx0am9iOiBwcm9jZXNzRGF0YURvd25sb2Fkc1xuXHRcdH0pO1xuXHR9KTtcbn0pO1xuIl19
