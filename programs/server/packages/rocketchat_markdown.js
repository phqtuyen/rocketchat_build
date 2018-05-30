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

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:markdown":{"settings.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_markdown/settings.js                                                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Meteor;
module.watch(require("meteor/meteor"), {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let RocketChat;
module.watch(require("meteor/rocketchat:lib"), {
  RocketChat(v) {
    RocketChat = v;
  }

}, 1);
Meteor.startup(() => {
  RocketChat.settings.add('Markdown_Parser', 'original', {
    type: 'select',
    values: [{
      key: 'disabled',
      i18nLabel: 'Disabled'
    }, {
      key: 'original',
      i18nLabel: 'Original'
    }, {
      key: 'marked',
      i18nLabel: 'Marked'
    }],
    group: 'Message',
    section: 'Markdown',
    public: true
  });
  const enableQueryOriginal = {
    _id: 'Markdown_Parser',
    value: 'original'
  };
  RocketChat.settings.add('Markdown_Headers', false, {
    type: 'boolean',
    group: 'Message',
    section: 'Markdown',
    public: true,
    enableQuery: enableQueryOriginal
  });
  RocketChat.settings.add('Markdown_SupportSchemesForLink', 'http,https', {
    type: 'string',
    group: 'Message',
    section: 'Markdown',
    public: true,
    i18nDescription: 'Markdown_SupportSchemesForLink_Description',
    enableQuery: enableQueryOriginal
  });
  const enableQueryMarked = {
    _id: 'Markdown_Parser',
    value: 'marked'
  };
  RocketChat.settings.add('Markdown_Marked_GFM', true, {
    type: 'boolean',
    group: 'Message',
    section: 'Markdown',
    public: true,
    enableQuery: enableQueryMarked
  });
  RocketChat.settings.add('Markdown_Marked_Tables', true, {
    type: 'boolean',
    group: 'Message',
    section: 'Markdown',
    public: true,
    enableQuery: enableQueryMarked
  });
  RocketChat.settings.add('Markdown_Marked_Breaks', true, {
    type: 'boolean',
    group: 'Message',
    section: 'Markdown',
    public: true,
    enableQuery: enableQueryMarked
  });
  RocketChat.settings.add('Markdown_Marked_Pedantic', false, {
    type: 'boolean',
    group: 'Message',
    section: 'Markdown',
    public: true,
    enableQuery: [{
      _id: 'Markdown_Parser',
      value: 'marked'
    }, {
      _id: 'Markdown_Marked_GFM',
      value: false
    }]
  });
  RocketChat.settings.add('Markdown_Marked_SmartLists', true, {
    type: 'boolean',
    group: 'Message',
    section: 'Markdown',
    public: true,
    enableQuery: enableQueryMarked
  });
  RocketChat.settings.add('Markdown_Marked_Smartypants', true, {
    type: 'boolean',
    group: 'Message',
    section: 'Markdown',
    public: true,
    enableQuery: enableQueryMarked
  });
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"markdown.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_markdown/markdown.js                                                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let s;
module.watch(require("underscore.string"), {
  default(v) {
    s = v;
  }

}, 0);
let Meteor;
module.watch(require("meteor/meteor"), {
  Meteor(v) {
    Meteor = v;
  }

}, 1);
let Blaze;
module.watch(require("meteor/blaze"), {
  Blaze(v) {
    Blaze = v;
  }

}, 2);
let RocketChat;
module.watch(require("meteor/rocketchat:lib"), {
  RocketChat(v) {
    RocketChat = v;
  }

}, 3);
let marked;
module.watch(require("./parser/marked/marked.js"), {
  marked(v) {
    marked = v;
  }

}, 4);
let original;
module.watch(require("./parser/original/original.js"), {
  original(v) {
    original = v;
  }

}, 5);
const parsers = {
  original,
  marked
};

class MarkdownClass {
  parse(text) {
    const message = {
      html: s.escapeHTML(text)
    };
    return this.mountTokensBack(this.parseMessageNotEscaped(message)).html;
  }

  parseNotEscaped(text) {
    const message = {
      html: text
    };
    return this.mountTokensBack(this.parseMessageNotEscaped(message)).html;
  }

  parseMessageNotEscaped(message) {
    const parser = RocketChat.settings.get('Markdown_Parser');

    if (parser === 'disabled') {
      return message;
    }

    if (typeof parsers[parser] === 'function') {
      return parsers[parser](message);
    }

    return parsers['original'](message);
  }

  mountTokensBack(message) {
    if (message.tokens && message.tokens.length > 0) {
      for (const _ref of message.tokens) {
        const {
          token,
          text
        } = _ref;
        message.html = message.html.replace(token, () => text); // Uses lambda so doesn't need to escape $
      }
    }

    return message;
  }

}

const Markdown = new MarkdownClass();
RocketChat.Markdown = Markdown; // renderMessage already did html escape

const MarkdownMessage = message => {
  if (s.trim(message != null ? message.html : undefined)) {
    message = Markdown.parseMessageNotEscaped(message);
  }

  return message;
};

RocketChat.callbacks.add('renderMessage', MarkdownMessage, RocketChat.callbacks.priority.HIGH, 'markdown');

if (Meteor.isClient) {
  Blaze.registerHelper('RocketChatMarkdown', text => Markdown.parse(text));
  Blaze.registerHelper('RocketChatMarkdownUnescape', text => Markdown.parseNotEscaped(text));
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"parser":{"marked":{"marked.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_markdown/parser/marked/marked.js                                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  marked: () => marked
});
let RocketChat;
module.watch(require("meteor/rocketchat:lib"), {
  RocketChat(v) {
    RocketChat = v;
  }

}, 0);
let Random;
module.watch(require("meteor/random"), {
  Random(v) {
    Random = v;
  }

}, 1);

let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 2);
let s;
module.watch(require("underscore.string"), {
  default(v) {
    s = v;
  }

}, 3);
let hljs;
module.watch(require("highlight.js"), {
  default(v) {
    hljs = v;
  }

}, 4);

let _marked;

module.watch(require("marked"), {
  default(v) {
    _marked = v;
  }

}, 5);
const renderer = new _marked.Renderer();
let msg = null;

renderer.code = function (code, lang, escaped) {
  if (this.options.highlight) {
    const out = this.options.highlight(code, lang);

    if (out != null && out !== code) {
      escaped = true;
      code = out;
    }
  }

  let text = null;

  if (!lang) {
    text = `<pre><code class="code-colors hljs">${escaped ? code : s.escapeHTML(code, true)}</code></pre>`;
  } else {
    text = `<pre><code class="code-colors hljs ${escape(lang, true)}">${escaped ? code : s.escapeHTML(code, true)}</code></pre>`;
  }

  if (_.isString(msg)) {
    return text;
  }

  const token = `=!=${Random.id()}=!=`;
  msg.tokens.push({
    highlight: true,
    token,
    text
  });
  return token;
};

renderer.codespan = function (text) {
  text = `<code class="code-colors inline">${text}</code>`;

  if (_.isString(msg)) {
    return text;
  }

  const token = `=!=${Random.id()}=!=`;
  msg.tokens.push({
    token,
    text
  });
  return token;
};

renderer.blockquote = function (quote) {
  return `<blockquote class="background-transparent-darker-before">${quote}</blockquote>`;
};

const highlight = function (code, lang) {
  if (!lang) {
    return code;
  }

  try {
    return hljs.highlight(lang, code).value;
  } catch (e) {
    // Unknown language
    return code;
  }
};

let gfm = null;
let tables = null;
let breaks = null;
let pedantic = null;
let smartLists = null;
let smartypants = null;

const marked = message => {
  msg = message;

  if (!msg.tokens) {
    msg.tokens = [];
  }

  if (gfm == null) {
    gfm = RocketChat.settings.get('Markdown_Marked_GFM');
  }

  if (tables == null) {
    tables = RocketChat.settings.get('Markdown_Marked_Tables');
  }

  if (breaks == null) {
    breaks = RocketChat.settings.get('Markdown_Marked_Breaks');
  }

  if (pedantic == null) {
    pedantic = RocketChat.settings.get('Markdown_Marked_Pedantic');
  }

  if (smartLists == null) {
    smartLists = RocketChat.settings.get('Markdown_Marked_SmartLists');
  }

  if (smartypants == null) {
    smartypants = RocketChat.settings.get('Markdown_Marked_Smartypants');
  }

  msg.html = _marked(s.unescapeHTML(msg.html), {
    gfm,
    tables,
    breaks,
    pedantic,
    smartLists,
    smartypants,
    renderer,
    sanitize: true,
    highlight
  });
  return msg;
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"original":{"code.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_markdown/parser/original/code.js                                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  code: () => code
});
let Random;
module.watch(require("meteor/random"), {
  Random(v) {
    Random = v;
  }

}, 0);
let s;
module.watch(require("underscore.string"), {
  default(v) {
    s = v;
  }

}, 1);
let hljs;
module.watch(require("highlight.js"), {
  default(v) {
    hljs = v;
  }

}, 2);

const inlinecode = message => {
  // Support `text`
  return message.html = message.html.replace(/(^|&gt;|[ >_*~])\`([^`\r\n]+)\`([<_*~]|\B|\b|$)/gm, (match, p1, p2, p3) => {
    const token = ` =!=${Random.id()}=!=`;
    message.tokens.push({
      token,
      text: `${p1}<span class=\"copyonly\">\`</span><span><code class=\"code-colors inline\">${p2}</code></span><span class=\"copyonly\">\`</span>${p3}`,
      noHtml: match
    });
    return token;
  });
};

const codeblocks = message => {
  // Count occurencies of ```
  const count = (message.html.match(/```/g) || []).length;

  if (count) {
    // Check if we need to add a final ```
    if (count % 2 > 0) {
      message.html = `${message.html}\n\`\`\``;
      message.msg = `${message.msg}\n\`\`\``;
    } // Separate text in code blocks and non code blocks


    const msgParts = message.html.split(/(^.*)(```(?:[a-zA-Z]+)?(?:(?:.|\r|\n)*?)```)(.*\n?)$/gm);

    for (let index = 0; index < msgParts.length; index++) {
      // Verify if this part is code
      const part = msgParts[index];
      const codeMatch = part.match(/^```(.*[\r\n\ ]?)([\s\S]*?)```+?$/);

      if (codeMatch != null) {
        // Process highlight if this part is code
        const singleLine = codeMatch[0].indexOf('\n') === -1;
        const lang = !singleLine && Array.from(hljs.listLanguages()).includes(s.trim(codeMatch[1])) ? s.trim(codeMatch[1]) : '';
        const code = singleLine ? s.unescapeHTML(codeMatch[1]) : lang === '' ? s.unescapeHTML(codeMatch[1] + codeMatch[2]) : s.unescapeHTML(codeMatch[2]);
        const result = lang === '' ? hljs.highlightAuto(lang + code) : hljs.highlight(lang, code);
        const token = `=!=${Random.id()}=!=`;
        message.tokens.push({
          highlight: true,
          token,
          text: `<pre><code class='code-colors hljs ${result.language}'><span class='copyonly'>\`\`\`<br></span>${result.value}<span class='copyonly'><br>\`\`\`</span></code></pre>`,
          noHtml: `\`\`\`\n${s.stripTags(result.value)}\n\`\`\``
        });
        msgParts[index] = token;
      } else {
        msgParts[index] = part;
      }
    } // Re-mount message


    return message.html = msgParts.join('');
  }
};

const code = message => {
  if (s.trim(message.html)) {
    if (message.tokens == null) {
      message.tokens = [];
    }

    codeblocks(message);
    inlinecode(message);
  }

  return message;
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"markdown.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_markdown/parser/original/markdown.js                                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  markdown: () => markdown
});
let Meteor;
module.watch(require("meteor/meteor"), {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let Random;
module.watch(require("meteor/random"), {
  Random(v) {
    Random = v;
  }

}, 1);
let RocketChat;
module.watch(require("meteor/rocketchat:lib"), {
  RocketChat(v) {
    RocketChat = v;
  }

}, 2);
let s;
module.watch(require("underscore.string"), {
  default(v) {
    s = v;
  }

}, 3);

const parseNotEscaped = function (msg, message) {
  if (message && message.tokens == null) {
    message.tokens = [];
  }

  const addAsToken = function (html) {
    const token = `=!=${Random.id()}=!=`;
    message.tokens.push({
      token,
      text: html
    });
    return token;
  };

  const schemes = RocketChat.settings.get('Markdown_SupportSchemesForLink').split(',').join('|');

  if (RocketChat.settings.get('Markdown_Headers')) {
    // Support # Text for h1
    msg = msg.replace(/^# (([\S\w\d-_\/\*\.,\\][ \u00a0\u1680\u180e\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]?)+)/gm, '<h1>$1</h1>'); // Support # Text for h2

    msg = msg.replace(/^## (([\S\w\d-_\/\*\.,\\][ \u00a0\u1680\u180e\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]?)+)/gm, '<h2>$1</h2>'); // Support # Text for h3

    msg = msg.replace(/^### (([\S\w\d-_\/\*\.,\\][ \u00a0\u1680\u180e\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]?)+)/gm, '<h3>$1</h3>'); // Support # Text for h4

    msg = msg.replace(/^#### (([\S\w\d-_\/\*\.,\\][ \u00a0\u1680\u180e\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]?)+)/gm, '<h4>$1</h4>');
  } // Support *text* to make bold


  msg = msg.replace(/(^|&gt;|[ >_~`])\*{1,2}([^\*\r\n]+)\*{1,2}([<_~`]|\B|\b|$)/gm, '$1<span class="copyonly">*</span><strong>$2</strong><span class="copyonly">*</span>$3'); // Support _text_ to make italics

  msg = msg.replace(/(^|&gt;|[ >*~`])\_{1,2}([^\_\r\n]+)\_{1,2}([<*~`]|\B|\b|$)/gm, '$1<span class="copyonly">_</span><em>$2</em><span class="copyonly">_</span>$3'); // Support ~text~ to strike through text

  msg = msg.replace(/(^|&gt;|[ >_*`])\~{1,2}([^~\r\n]+)\~{1,2}([<_*`]|\B|\b|$)/gm, '$1<span class="copyonly">~</span><strike>$2</strike><span class="copyonly">~</span>$3'); // Support for block quote
  // >>>
  // Text
  // <<<

  msg = msg.replace(/(?:&gt;){3}\n+([\s\S]*?)\n+(?:&lt;){3}/g, '<blockquote class="background-transparent-darker-before"><span class="copyonly">&gt;&gt;&gt;</span>$1<span class="copyonly">&lt;&lt;&lt;</span></blockquote>'); // Support >Text for quote

  msg = msg.replace(/^&gt;(.*)$/gm, '<blockquote class="background-transparent-darker-before"><span class="copyonly">&gt;</span>$1</blockquote>'); // Remove white-space around blockquote (prevent <br>). Because blockquote is block element.

  msg = msg.replace(/\s*<blockquote class="background-transparent-darker-before">/gm, '<blockquote class="background-transparent-darker-before">');
  msg = msg.replace(/<\/blockquote>\s*/gm, '</blockquote>'); // Remove new-line between blockquotes.

  msg = msg.replace(/<\/blockquote>\n<blockquote/gm, '</blockquote><blockquote'); // Support ![alt text](http://image url)

  msg = msg.replace(new RegExp(`!\\[([^\\]]+)\\]\\(((?:${schemes}):\\/\\/[^\\)]+)\\)`, 'gm'), (match, title, url) => {
    const target = url.indexOf(Meteor.absoluteUrl()) === 0 ? '' : '_blank';
    return addAsToken(`<a href="${s.escapeHTML(url)}" title="${s.escapeHTML(title)}" target="${s.escapeHTML(target)}" rel="noopener noreferrer"><div class="inline-image" style="background-image: url(${s.escapeHTML(url)});"></div></a>`);
  }); // Support [Text](http://link)

  msg = msg.replace(new RegExp(`\\[([^\\]]+)\\]\\(((?:${schemes}):\\/\\/[^\\)]+)\\)`, 'gm'), (match, title, url) => {
    const target = url.indexOf(Meteor.absoluteUrl()) === 0 ? '' : '_blank';
    return addAsToken(`<a href="${s.escapeHTML(url)}" target="${s.escapeHTML(target)}" rel="noopener noreferrer">${s.escapeHTML(title)}</a>`);
  }); // Support <http://link|Text>

  msg = msg.replace(new RegExp(`(?:<|&lt;)((?:${schemes}):\\/\\/[^\\|]+)\\|(.+?)(?=>|&gt;)(?:>|&gt;)`, 'gm'), (match, url, title) => {
    const target = url.indexOf(Meteor.absoluteUrl()) === 0 ? '' : '_blank';
    return addAsToken(`<a href="${s.escapeHTML(url)}" target="${s.escapeHTML(target)}" rel="noopener noreferrer">${s.escapeHTML(title)}</a>`);
  });
  return msg;
};

const markdown = function (message) {
  message.html = parseNotEscaped(message.html, message);
  return message;
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"original.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_markdown/parser/original/original.js                                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  original: () => original
});
let markdown;
module.watch(require("./markdown.js"), {
  markdown(v) {
    markdown = v;
  }

}, 0);
let code;
module.watch(require("./code.js"), {
  code(v) {
    code = v;
  }

}, 1);

const original = message => {
  // Parse markdown code
  message = code(message); // Parse markdown

  message = markdown(message); // Replace linebreak to br

  message.html = message.html.replace(/\n/gm, '<br>');
  return message;
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:markdown/settings.js");
var exports = require("/node_modules/meteor/rocketchat:markdown/markdown.js");

/* Exports */
Package._define("rocketchat:markdown", exports);

})();

//# sourceURL=meteor://💻app/packages/rocketchat_markdown.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDptYXJrZG93bi9zZXR0aW5ncy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDptYXJrZG93bi9tYXJrZG93bi5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDptYXJrZG93bi9wYXJzZXIvbWFya2VkL21hcmtlZC5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDptYXJrZG93bi9wYXJzZXIvb3JpZ2luYWwvY29kZS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDptYXJrZG93bi9wYXJzZXIvb3JpZ2luYWwvbWFya2Rvd24uanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bWFya2Rvd24vcGFyc2VyL29yaWdpbmFsL29yaWdpbmFsLmpzIl0sIm5hbWVzIjpbIk1ldGVvciIsIm1vZHVsZSIsIndhdGNoIiwicmVxdWlyZSIsInYiLCJSb2NrZXRDaGF0Iiwic3RhcnR1cCIsInNldHRpbmdzIiwiYWRkIiwidHlwZSIsInZhbHVlcyIsImtleSIsImkxOG5MYWJlbCIsImdyb3VwIiwic2VjdGlvbiIsInB1YmxpYyIsImVuYWJsZVF1ZXJ5T3JpZ2luYWwiLCJfaWQiLCJ2YWx1ZSIsImVuYWJsZVF1ZXJ5IiwiaTE4bkRlc2NyaXB0aW9uIiwiZW5hYmxlUXVlcnlNYXJrZWQiLCJzIiwiZGVmYXVsdCIsIkJsYXplIiwibWFya2VkIiwib3JpZ2luYWwiLCJwYXJzZXJzIiwiTWFya2Rvd25DbGFzcyIsInBhcnNlIiwidGV4dCIsIm1lc3NhZ2UiLCJodG1sIiwiZXNjYXBlSFRNTCIsIm1vdW50VG9rZW5zQmFjayIsInBhcnNlTWVzc2FnZU5vdEVzY2FwZWQiLCJwYXJzZU5vdEVzY2FwZWQiLCJwYXJzZXIiLCJnZXQiLCJ0b2tlbnMiLCJsZW5ndGgiLCJ0b2tlbiIsInJlcGxhY2UiLCJNYXJrZG93biIsIk1hcmtkb3duTWVzc2FnZSIsInRyaW0iLCJ1bmRlZmluZWQiLCJjYWxsYmFja3MiLCJwcmlvcml0eSIsIkhJR0giLCJpc0NsaWVudCIsInJlZ2lzdGVySGVscGVyIiwiZXhwb3J0IiwiUmFuZG9tIiwiXyIsImhsanMiLCJfbWFya2VkIiwicmVuZGVyZXIiLCJSZW5kZXJlciIsIm1zZyIsImNvZGUiLCJsYW5nIiwiZXNjYXBlZCIsIm9wdGlvbnMiLCJoaWdobGlnaHQiLCJvdXQiLCJlc2NhcGUiLCJpc1N0cmluZyIsImlkIiwicHVzaCIsImNvZGVzcGFuIiwiYmxvY2txdW90ZSIsInF1b3RlIiwiZSIsImdmbSIsInRhYmxlcyIsImJyZWFrcyIsInBlZGFudGljIiwic21hcnRMaXN0cyIsInNtYXJ0eXBhbnRzIiwidW5lc2NhcGVIVE1MIiwic2FuaXRpemUiLCJpbmxpbmVjb2RlIiwibWF0Y2giLCJwMSIsInAyIiwicDMiLCJub0h0bWwiLCJjb2RlYmxvY2tzIiwiY291bnQiLCJtc2dQYXJ0cyIsInNwbGl0IiwiaW5kZXgiLCJwYXJ0IiwiY29kZU1hdGNoIiwic2luZ2xlTGluZSIsImluZGV4T2YiLCJBcnJheSIsImZyb20iLCJsaXN0TGFuZ3VhZ2VzIiwiaW5jbHVkZXMiLCJyZXN1bHQiLCJoaWdobGlnaHRBdXRvIiwibGFuZ3VhZ2UiLCJzdHJpcFRhZ3MiLCJqb2luIiwibWFya2Rvd24iLCJhZGRBc1Rva2VuIiwic2NoZW1lcyIsIlJlZ0V4cCIsInRpdGxlIiwidXJsIiwidGFyZ2V0IiwiYWJzb2x1dGVVcmwiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxJQUFJQSxNQUFKO0FBQVdDLE9BQU9DLEtBQVAsQ0FBYUMsUUFBUSxlQUFSLENBQWIsRUFBc0M7QUFBQ0gsU0FBT0ksQ0FBUCxFQUFTO0FBQUNKLGFBQU9JLENBQVA7QUFBUzs7QUFBcEIsQ0FBdEMsRUFBNEQsQ0FBNUQ7QUFBK0QsSUFBSUMsVUFBSjtBQUFlSixPQUFPQyxLQUFQLENBQWFD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Ozs7Ozs7O0FDdEZQOUIsT0FBT21ELE1BQVAsQ0FBYztBQUFDMUIsWUFBUyxNQUFJQTtBQUFkLENBQWQ7QUFBdUMsSUFBSWdGLFFBQUo7QUFBYXpHLE9BQU9DLEtBQVAsQ0FBYUMsUUFBUSxlQUFSLENBQWIsRUFBc0M7QUFBQ3VHLFdBQVN0RyxDQUFULEVBQVc7QUFBQ3NHLGVBQVN0RyxDQUFUO0FBQVc7O0FBQXhCLENBQXRDLEVBQWdFLENBQWhFO0FBQW1FLElBQUl3RCxJQUFKO0FBQVMzRCxPQUFPQyxLQUFQLENBQWFDLFFBQVEsV0FBUixDQUFiLEVBQWtDO0FBQUN5RCxPQUFLeEQsQ0FBTCxFQUFPO0FBQUN3RCxXQUFLeEQsQ0FBTDtBQUFPOztBQUFoQixDQUFsQyxFQUFvRCxDQUFwRDs7QUFPekgsTUFBTXNCLFdBQVlLLE9BQUQsSUFBYTtBQUNwQztBQUNBQSxZQUFVNkIsS0FBSzdCLE9BQUwsQ0FBVixDQUZvQyxDQUlwQzs7QUFDQUEsWUFBVTJFLFNBQVMzRSxPQUFULENBQVYsQ0FMb0MsQ0FPcEM7O0FBQ0FBLFVBQVFDLElBQVIsR0FBZUQsUUFBUUMsSUFBUixDQUFhVSxPQUFiLENBQXFCLE1BQXJCLEVBQTZCLE1BQTdCLENBQWY7QUFFQSxTQUFPWCxPQUFQO0FBQ0EsQ0FYTSxDIiwiZmlsZSI6Ii9wYWNrYWdlcy9yb2NrZXRjaGF0X21hcmtkb3duLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgTWV0ZW9yIH0gZnJvbSAnbWV0ZW9yL21ldGVvcic7XG5pbXBvcnQgeyBSb2NrZXRDaGF0IH0gZnJvbSAnbWV0ZW9yL3JvY2tldGNoYXQ6bGliJztcblxuTWV0ZW9yLnN0YXJ0dXAoKCkgPT4ge1xuXHRSb2NrZXRDaGF0LnNldHRpbmdzLmFkZCgnTWFya2Rvd25fUGFyc2VyJywgJ29yaWdpbmFsJywge1xuXHRcdHR5cGU6ICdzZWxlY3QnLFxuXHRcdHZhbHVlczogW3tcblx0XHRcdGtleTogJ2Rpc2FibGVkJyxcblx0XHRcdGkxOG5MYWJlbDogJ0Rpc2FibGVkJ1xuXHRcdH0sIHtcblx0XHRcdGtleTogJ29yaWdpbmFsJyxcblx0XHRcdGkxOG5MYWJlbDogJ09yaWdpbmFsJ1xuXHRcdH0sIHtcblx0XHRcdGtleTogJ21hcmtlZCcsXG5cdFx0XHRpMThuTGFiZWw6ICdNYXJrZWQnXG5cdFx0fV0sXG5cdFx0Z3JvdXA6ICdNZXNzYWdlJyxcblx0XHRzZWN0aW9uOiAnTWFya2Rvd24nLFxuXHRcdHB1YmxpYzogdHJ1ZVxuXHR9KTtcblxuXHRjb25zdCBlbmFibGVRdWVyeU9yaWdpbmFsID0ge19pZDogJ01hcmtkb3duX1BhcnNlcicsIHZhbHVlOiAnb3JpZ2luYWwnfTtcblx0Um9ja2V0Q2hhdC5zZXR0aW5ncy5hZGQoJ01hcmtkb3duX0hlYWRlcnMnLCBmYWxzZSwge1xuXHRcdHR5cGU6ICdib29sZWFuJyxcblx0XHRncm91cDogJ01lc3NhZ2UnLFxuXHRcdHNlY3Rpb246ICdNYXJrZG93bicsXG5cdFx0cHVibGljOiB0cnVlLFxuXHRcdGVuYWJsZVF1ZXJ5OiBlbmFibGVRdWVyeU9yaWdpbmFsXG5cdH0pO1xuXHRSb2NrZXRDaGF0LnNldHRpbmdzLmFkZCgnTWFya2Rvd25fU3VwcG9ydFNjaGVtZXNGb3JMaW5rJywgJ2h0dHAsaHR0cHMnLCB7XG5cdFx0dHlwZTogJ3N0cmluZycsXG5cdFx0Z3JvdXA6ICdNZXNzYWdlJyxcblx0XHRzZWN0aW9uOiAnTWFya2Rvd24nLFxuXHRcdHB1YmxpYzogdHJ1ZSxcblx0XHRpMThuRGVzY3JpcHRpb246ICdNYXJrZG93bl9TdXBwb3J0U2NoZW1lc0ZvckxpbmtfRGVzY3JpcHRpb24nLFxuXHRcdGVuYWJsZVF1ZXJ5OiBlbmFibGVRdWVyeU9yaWdpbmFsXG5cdH0pO1xuXG5cdGNvbnN0IGVuYWJsZVF1ZXJ5TWFya2VkID0ge19pZDogJ01hcmtkb3duX1BhcnNlcicsIHZhbHVlOiAnbWFya2VkJ307XG5cdFJvY2tldENoYXQuc2V0dGluZ3MuYWRkKCdNYXJrZG93bl9NYXJrZWRfR0ZNJywgdHJ1ZSwge1xuXHRcdHR5cGU6ICdib29sZWFuJyxcblx0XHRncm91cDogJ01lc3NhZ2UnLFxuXHRcdHNlY3Rpb246ICdNYXJrZG93bicsXG5cdFx0cHVibGljOiB0cnVlLFxuXHRcdGVuYWJsZVF1ZXJ5OiBlbmFibGVRdWVyeU1hcmtlZFxuXHR9KTtcblx0Um9ja2V0Q2hhdC5zZXR0aW5ncy5hZGQoJ01hcmtkb3duX01hcmtlZF9UYWJsZXMnLCB0cnVlLCB7XG5cdFx0dHlwZTogJ2Jvb2xlYW4nLFxuXHRcdGdyb3VwOiAnTWVzc2FnZScsXG5cdFx0c2VjdGlvbjogJ01hcmtkb3duJyxcblx0XHRwdWJsaWM6IHRydWUsXG5cdFx0ZW5hYmxlUXVlcnk6IGVuYWJsZVF1ZXJ5TWFya2VkXG5cdH0pO1xuXHRSb2NrZXRDaGF0LnNldHRpbmdzLmFkZCgnTWFya2Rvd25fTWFya2VkX0JyZWFrcycsIHRydWUsIHtcblx0XHR0eXBlOiAnYm9vbGVhbicsXG5cdFx0Z3JvdXA6ICdNZXNzYWdlJyxcblx0XHRzZWN0aW9uOiAnTWFya2Rvd24nLFxuXHRcdHB1YmxpYzogdHJ1ZSxcblx0XHRlbmFibGVRdWVyeTogZW5hYmxlUXVlcnlNYXJrZWRcblx0fSk7XG5cdFJvY2tldENoYXQuc2V0dGluZ3MuYWRkKCdNYXJrZG93bl9NYXJrZWRfUGVkYW50aWMnLCBmYWxzZSwge1xuXHRcdHR5cGU6ICdib29sZWFuJyxcblx0XHRncm91cDogJ01lc3NhZ2UnLFxuXHRcdHNlY3Rpb246ICdNYXJrZG93bicsXG5cdFx0cHVibGljOiB0cnVlLFxuXHRcdGVuYWJsZVF1ZXJ5OiBbe1xuXHRcdFx0X2lkOiAnTWFya2Rvd25fUGFyc2VyJyxcblx0XHRcdHZhbHVlOiAnbWFya2VkJ1xuXHRcdH0sIHtcblx0XHRcdF9pZDogJ01hcmtkb3duX01hcmtlZF9HRk0nLFxuXHRcdFx0dmFsdWU6IGZhbHNlXG5cdFx0fV1cblx0fSk7XG5cdFJvY2tldENoYXQuc2V0dGluZ3MuYWRkKCdNYXJrZG93bl9NYXJrZWRfU21hcnRMaXN0cycsIHRydWUsIHtcblx0XHR0eXBlOiAnYm9vbGVhbicsXG5cdFx0Z3JvdXA6ICdNZXNzYWdlJyxcblx0XHRzZWN0aW9uOiAnTWFya2Rvd24nLFxuXHRcdHB1YmxpYzogdHJ1ZSxcblx0XHRlbmFibGVRdWVyeTogZW5hYmxlUXVlcnlNYXJrZWRcblx0fSk7XG5cdFJvY2tldENoYXQuc2V0dGluZ3MuYWRkKCdNYXJrZG93bl9NYXJrZWRfU21hcnR5cGFudHMnLCB0cnVlLCB7XG5cdFx0dHlwZTogJ2Jvb2xlYW4nLFxuXHRcdGdyb3VwOiAnTWVzc2FnZScsXG5cdFx0c2VjdGlvbjogJ01hcmtkb3duJyxcblx0XHRwdWJsaWM6IHRydWUsXG5cdFx0ZW5hYmxlUXVlcnk6IGVuYWJsZVF1ZXJ5TWFya2VkXG5cdH0pO1xufSk7XG4iLCIvKlxuICogTWFya2Rvd24gaXMgYSBuYW1lZCBmdW5jdGlvbiB0aGF0IHdpbGwgcGFyc2UgbWFya2Rvd24gc3ludGF4XG4gKiBAcGFyYW0ge09iamVjdH0gbWVzc2FnZSAtIFRoZSBtZXNzYWdlIG9iamVjdFxuICovXG5pbXBvcnQgcyBmcm9tICd1bmRlcnNjb3JlLnN0cmluZyc7XG5pbXBvcnQgeyBNZXRlb3IgfSBmcm9tICdtZXRlb3IvbWV0ZW9yJztcbmltcG9ydCB7IEJsYXplIH0gZnJvbSAnbWV0ZW9yL2JsYXplJztcbmltcG9ydCB7IFJvY2tldENoYXQgfSBmcm9tICdtZXRlb3Ivcm9ja2V0Y2hhdDpsaWInO1xuXG5pbXBvcnQgeyBtYXJrZWQgfSBmcm9tICcuL3BhcnNlci9tYXJrZWQvbWFya2VkLmpzJztcbmltcG9ydCB7IG9yaWdpbmFsIH0gZnJvbSAnLi9wYXJzZXIvb3JpZ2luYWwvb3JpZ2luYWwuanMnO1xuXG5jb25zdCBwYXJzZXJzID0ge1xuXHRvcmlnaW5hbCxcblx0bWFya2VkXG59O1xuXG5jbGFzcyBNYXJrZG93bkNsYXNzIHtcblx0cGFyc2UodGV4dCkge1xuXHRcdGNvbnN0IG1lc3NhZ2UgPSB7XG5cdFx0XHRodG1sOiBzLmVzY2FwZUhUTUwodGV4dClcblx0XHR9O1xuXHRcdHJldHVybiB0aGlzLm1vdW50VG9rZW5zQmFjayh0aGlzLnBhcnNlTWVzc2FnZU5vdEVzY2FwZWQobWVzc2FnZSkpLmh0bWw7XG5cdH1cblxuXHRwYXJzZU5vdEVzY2FwZWQodGV4dCkge1xuXHRcdGNvbnN0IG1lc3NhZ2UgPSB7XG5cdFx0XHRodG1sOiB0ZXh0XG5cdFx0fTtcblx0XHRyZXR1cm4gdGhpcy5tb3VudFRva2Vuc0JhY2sodGhpcy5wYXJzZU1lc3NhZ2VOb3RFc2NhcGVkKG1lc3NhZ2UpKS5odG1sO1xuXHR9XG5cblx0cGFyc2VNZXNzYWdlTm90RXNjYXBlZChtZXNzYWdlKSB7XG5cdFx0Y29uc3QgcGFyc2VyID0gUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ01hcmtkb3duX1BhcnNlcicpO1xuXG5cdFx0aWYgKHBhcnNlciA9PT0gJ2Rpc2FibGVkJykge1xuXHRcdFx0cmV0dXJuIG1lc3NhZ2U7XG5cdFx0fVxuXG5cdFx0aWYgKHR5cGVvZiBwYXJzZXJzW3BhcnNlcl0gPT09ICdmdW5jdGlvbicpIHtcblx0XHRcdHJldHVybiBwYXJzZXJzW3BhcnNlcl0obWVzc2FnZSk7XG5cdFx0fVxuXHRcdHJldHVybiBwYXJzZXJzWydvcmlnaW5hbCddKG1lc3NhZ2UpO1xuXHR9XG5cblx0bW91bnRUb2tlbnNCYWNrKG1lc3NhZ2UpIHtcblx0XHRpZiAobWVzc2FnZS50b2tlbnMgJiYgbWVzc2FnZS50b2tlbnMubGVuZ3RoID4gMCkge1xuXHRcdFx0Zm9yIChjb25zdCB7dG9rZW4sIHRleHR9IG9mIG1lc3NhZ2UudG9rZW5zKSB7XG5cdFx0XHRcdG1lc3NhZ2UuaHRtbCA9IG1lc3NhZ2UuaHRtbC5yZXBsYWNlKHRva2VuLCAoKSA9PiB0ZXh0KTsgLy8gVXNlcyBsYW1iZGEgc28gZG9lc24ndCBuZWVkIHRvIGVzY2FwZSAkXG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIG1lc3NhZ2U7XG5cdH1cbn1cblxuY29uc3QgTWFya2Rvd24gPSBuZXcgTWFya2Rvd25DbGFzcztcblJvY2tldENoYXQuTWFya2Rvd24gPSBNYXJrZG93bjtcblxuLy8gcmVuZGVyTWVzc2FnZSBhbHJlYWR5IGRpZCBodG1sIGVzY2FwZVxuY29uc3QgTWFya2Rvd25NZXNzYWdlID0gKG1lc3NhZ2UpID0+IHtcblx0aWYgKHMudHJpbShtZXNzYWdlICE9IG51bGwgPyBtZXNzYWdlLmh0bWwgOiB1bmRlZmluZWQpKSB7XG5cdFx0bWVzc2FnZSA9IE1hcmtkb3duLnBhcnNlTWVzc2FnZU5vdEVzY2FwZWQobWVzc2FnZSk7XG5cdH1cblxuXHRyZXR1cm4gbWVzc2FnZTtcbn07XG5cblJvY2tldENoYXQuY2FsbGJhY2tzLmFkZCgncmVuZGVyTWVzc2FnZScsIE1hcmtkb3duTWVzc2FnZSwgUm9ja2V0Q2hhdC5jYWxsYmFja3MucHJpb3JpdHkuSElHSCwgJ21hcmtkb3duJyk7XG5cbmlmIChNZXRlb3IuaXNDbGllbnQpIHtcblx0QmxhemUucmVnaXN0ZXJIZWxwZXIoJ1JvY2tldENoYXRNYXJrZG93bicsIHRleHQgPT4gTWFya2Rvd24ucGFyc2UodGV4dCkpO1xuXHRCbGF6ZS5yZWdpc3RlckhlbHBlcignUm9ja2V0Q2hhdE1hcmtkb3duVW5lc2NhcGUnLCB0ZXh0ID0+IE1hcmtkb3duLnBhcnNlTm90RXNjYXBlZCh0ZXh0KSk7XG59XG4iLCJpbXBvcnQgeyBSb2NrZXRDaGF0IH0gZnJvbSAnbWV0ZW9yL3JvY2tldGNoYXQ6bGliJztcbmltcG9ydCB7IFJhbmRvbSB9IGZyb20gJ21ldGVvci9yYW5kb20nO1xuaW1wb3J0IF8gZnJvbSAndW5kZXJzY29yZSc7XG5pbXBvcnQgcyBmcm9tICd1bmRlcnNjb3JlLnN0cmluZyc7XG5pbXBvcnQgaGxqcyBmcm9tICdoaWdobGlnaHQuanMnO1xuaW1wb3J0IF9tYXJrZWQgZnJvbSAnbWFya2VkJztcblxuY29uc3QgcmVuZGVyZXIgPSBuZXcgX21hcmtlZC5SZW5kZXJlcigpO1xuXG5sZXQgbXNnID0gbnVsbDtcblxucmVuZGVyZXIuY29kZSA9IGZ1bmN0aW9uKGNvZGUsIGxhbmcsIGVzY2FwZWQpIHtcblx0aWYgKHRoaXMub3B0aW9ucy5oaWdobGlnaHQpIHtcblx0XHRjb25zdCBvdXQgPSB0aGlzLm9wdGlvbnMuaGlnaGxpZ2h0KGNvZGUsIGxhbmcpO1xuXHRcdGlmIChvdXQgIT0gbnVsbCAmJiBvdXQgIT09IGNvZGUpIHtcblx0XHRcdGVzY2FwZWQgPSB0cnVlO1xuXHRcdFx0Y29kZSA9IG91dDtcblx0XHR9XG5cdH1cblxuXHRsZXQgdGV4dCA9IG51bGw7XG5cblx0aWYgKCFsYW5nKSB7XG5cdFx0dGV4dCA9IGA8cHJlPjxjb2RlIGNsYXNzPVwiY29kZS1jb2xvcnMgaGxqc1wiPiR7IChlc2NhcGVkID8gY29kZSA6IHMuZXNjYXBlSFRNTChjb2RlLCB0cnVlKSkgfTwvY29kZT48L3ByZT5gO1xuXHR9IGVsc2Uge1xuXHRcdHRleHQgPSBgPHByZT48Y29kZSBjbGFzcz1cImNvZGUtY29sb3JzIGhsanMgJHsgZXNjYXBlKGxhbmcsIHRydWUpIH1cIj4keyAoZXNjYXBlZCA/IGNvZGUgOiBzLmVzY2FwZUhUTUwoY29kZSwgdHJ1ZSkpIH08L2NvZGU+PC9wcmU+YDtcblx0fVxuXG5cdGlmIChfLmlzU3RyaW5nKG1zZykpIHtcblx0XHRyZXR1cm4gdGV4dDtcblx0fVxuXG5cdGNvbnN0IHRva2VuID0gYD0hPSR7IFJhbmRvbS5pZCgpIH09IT1gO1xuXHRtc2cudG9rZW5zLnB1c2goe1xuXHRcdGhpZ2hsaWdodDogdHJ1ZSxcblx0XHR0b2tlbixcblx0XHR0ZXh0XG5cdH0pO1xuXG5cdHJldHVybiB0b2tlbjtcbn07XG5cbnJlbmRlcmVyLmNvZGVzcGFuID0gZnVuY3Rpb24odGV4dCkge1xuXHR0ZXh0ID0gYDxjb2RlIGNsYXNzPVwiY29kZS1jb2xvcnMgaW5saW5lXCI+JHsgdGV4dCB9PC9jb2RlPmA7XG5cdGlmIChfLmlzU3RyaW5nKG1zZykpIHtcblx0XHRyZXR1cm4gdGV4dDtcblx0fVxuXG5cdGNvbnN0IHRva2VuID0gYD0hPSR7IFJhbmRvbS5pZCgpIH09IT1gO1xuXHRtc2cudG9rZW5zLnB1c2goe1xuXHRcdHRva2VuLFxuXHRcdHRleHRcblx0fSk7XG5cblx0cmV0dXJuIHRva2VuO1xufTtcblxucmVuZGVyZXIuYmxvY2txdW90ZSA9IGZ1bmN0aW9uKHF1b3RlKSB7XG5cdHJldHVybiBgPGJsb2NrcXVvdGUgY2xhc3M9XCJiYWNrZ3JvdW5kLXRyYW5zcGFyZW50LWRhcmtlci1iZWZvcmVcIj4keyBxdW90ZSB9PC9ibG9ja3F1b3RlPmA7XG59O1xuXG5jb25zdCBoaWdobGlnaHQgPSBmdW5jdGlvbihjb2RlLCBsYW5nKSB7XG5cdGlmICghbGFuZykge1xuXHRcdHJldHVybiBjb2RlO1xuXHR9XG5cdHRyeSB7XG5cdFx0cmV0dXJuIGhsanMuaGlnaGxpZ2h0KGxhbmcsIGNvZGUpLnZhbHVlO1xuXHR9IGNhdGNoIChlKSB7XG5cdFx0Ly8gVW5rbm93biBsYW5ndWFnZVxuXHRcdHJldHVybiBjb2RlO1xuXHR9XG59O1xuXG5sZXQgZ2ZtID0gbnVsbDtcbmxldCB0YWJsZXMgPSBudWxsO1xubGV0IGJyZWFrcyA9IG51bGw7XG5sZXQgcGVkYW50aWMgPSBudWxsO1xubGV0IHNtYXJ0TGlzdHMgPSBudWxsO1xubGV0IHNtYXJ0eXBhbnRzID0gbnVsbDtcblxuZXhwb3J0IGNvbnN0IG1hcmtlZCA9IChtZXNzYWdlKSA9PiB7XG5cdG1zZyA9IG1lc3NhZ2U7XG5cblx0aWYgKCFtc2cudG9rZW5zKSB7XG5cdFx0bXNnLnRva2VucyA9IFtdO1xuXHR9XG5cblx0aWYgKGdmbSA9PSBudWxsKSB7IGdmbSA9IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdNYXJrZG93bl9NYXJrZWRfR0ZNJyk7IH1cblx0aWYgKHRhYmxlcyA9PSBudWxsKSB7IHRhYmxlcyA9IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdNYXJrZG93bl9NYXJrZWRfVGFibGVzJyk7IH1cblx0aWYgKGJyZWFrcyA9PSBudWxsKSB7IGJyZWFrcyA9IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdNYXJrZG93bl9NYXJrZWRfQnJlYWtzJyk7IH1cblx0aWYgKHBlZGFudGljID09IG51bGwpIHsgcGVkYW50aWMgPSBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnTWFya2Rvd25fTWFya2VkX1BlZGFudGljJyk7IH1cblx0aWYgKHNtYXJ0TGlzdHMgPT0gbnVsbCkgeyBzbWFydExpc3RzID0gUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ01hcmtkb3duX01hcmtlZF9TbWFydExpc3RzJyk7IH1cblx0aWYgKHNtYXJ0eXBhbnRzID09IG51bGwpIHsgc21hcnR5cGFudHMgPSBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnTWFya2Rvd25fTWFya2VkX1NtYXJ0eXBhbnRzJyk7IH1cblxuXHRtc2cuaHRtbCA9IF9tYXJrZWQocy51bmVzY2FwZUhUTUwobXNnLmh0bWwpLCB7XG5cdFx0Z2ZtLFxuXHRcdHRhYmxlcyxcblx0XHRicmVha3MsXG5cdFx0cGVkYW50aWMsXG5cdFx0c21hcnRMaXN0cyxcblx0XHRzbWFydHlwYW50cyxcblx0XHRyZW5kZXJlcixcblx0XHRzYW5pdGl6ZTogdHJ1ZSxcblx0XHRoaWdobGlnaHRcblx0fSk7XG5cblx0cmV0dXJuIG1zZztcbn07XG4iLCIvKlxuICogY29kZSgpIGlzIGEgbmFtZWQgZnVuY3Rpb24gdGhhdCB3aWxsIHBhcnNlIGBpbmxpbmUgY29kZWAgYW5kIGBgYGNvZGVibG9ja2BgYCBzeW50YXhlc1xuICogQHBhcmFtIHtPYmplY3R9IG1lc3NhZ2UgLSBUaGUgbWVzc2FnZSBvYmplY3RcbiAqL1xuaW1wb3J0IHsgUmFuZG9tIH0gZnJvbSAnbWV0ZW9yL3JhbmRvbSc7XG5pbXBvcnQgcyBmcm9tICd1bmRlcnNjb3JlLnN0cmluZyc7XG5pbXBvcnQgaGxqcyBmcm9tICdoaWdobGlnaHQuanMnO1xuXG5jb25zdCBpbmxpbmVjb2RlID0gKG1lc3NhZ2UpID0+IHtcblx0Ly8gU3VwcG9ydCBgdGV4dGBcblx0cmV0dXJuIG1lc3NhZ2UuaHRtbCA9IG1lc3NhZ2UuaHRtbC5yZXBsYWNlKC8oXnwmZ3Q7fFsgPl8qfl0pXFxgKFteYFxcclxcbl0rKVxcYChbPF8qfl18XFxCfFxcYnwkKS9nbSwgKG1hdGNoLCBwMSwgcDIsIHAzKSA9PiB7XG5cdFx0Y29uc3QgdG9rZW4gPSBgID0hPSR7IFJhbmRvbS5pZCgpIH09IT1gO1xuXG5cdFx0bWVzc2FnZS50b2tlbnMucHVzaCh7XG5cdFx0XHR0b2tlbixcblx0XHRcdHRleHQ6IGAkeyBwMSB9PHNwYW4gY2xhc3M9XFxcImNvcHlvbmx5XFxcIj5cXGA8L3NwYW4+PHNwYW4+PGNvZGUgY2xhc3M9XFxcImNvZGUtY29sb3JzIGlubGluZVxcXCI+JHsgcDIgfTwvY29kZT48L3NwYW4+PHNwYW4gY2xhc3M9XFxcImNvcHlvbmx5XFxcIj5cXGA8L3NwYW4+JHsgcDMgfWAsXG5cdFx0XHRub0h0bWw6IG1hdGNoXG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gdG9rZW47XG5cdH0pO1xufTtcblxuY29uc3QgY29kZWJsb2NrcyA9IChtZXNzYWdlKSA9PiB7XG5cdC8vIENvdW50IG9jY3VyZW5jaWVzIG9mIGBgYFxuXHRjb25zdCBjb3VudCA9IChtZXNzYWdlLmh0bWwubWF0Y2goL2BgYC9nKSB8fCBbXSkubGVuZ3RoO1xuXG5cdGlmIChjb3VudCkge1xuXG5cdFx0Ly8gQ2hlY2sgaWYgd2UgbmVlZCB0byBhZGQgYSBmaW5hbCBgYGBcblx0XHRpZiAoKGNvdW50ICUgMikgPiAwKSB7XG5cdFx0XHRtZXNzYWdlLmh0bWwgPSBgJHsgbWVzc2FnZS5odG1sIH1cXG5cXGBcXGBcXGBgO1xuXHRcdFx0bWVzc2FnZS5tc2cgPSBgJHsgbWVzc2FnZS5tc2cgfVxcblxcYFxcYFxcYGA7XG5cdFx0fVxuXG5cdFx0Ly8gU2VwYXJhdGUgdGV4dCBpbiBjb2RlIGJsb2NrcyBhbmQgbm9uIGNvZGUgYmxvY2tzXG5cdFx0Y29uc3QgbXNnUGFydHMgPSBtZXNzYWdlLmh0bWwuc3BsaXQoLyheLiopKGBgYCg/OlthLXpBLVpdKyk/KD86KD86LnxcXHJ8XFxuKSo/KWBgYCkoLipcXG4/KSQvZ20pO1xuXG5cdFx0Zm9yIChsZXQgaW5kZXggPSAwOyBpbmRleCA8IG1zZ1BhcnRzLmxlbmd0aDsgaW5kZXgrKykge1xuXHRcdFx0Ly8gVmVyaWZ5IGlmIHRoaXMgcGFydCBpcyBjb2RlXG5cdFx0XHRjb25zdCBwYXJ0ID0gbXNnUGFydHNbaW5kZXhdO1xuXHRcdFx0Y29uc3QgY29kZU1hdGNoID0gcGFydC5tYXRjaCgvXmBgYCguKltcXHJcXG5cXCBdPykoW1xcc1xcU10qPylgYGArPyQvKTtcblxuXHRcdFx0aWYgKGNvZGVNYXRjaCAhPSBudWxsKSB7XG5cdFx0XHRcdC8vIFByb2Nlc3MgaGlnaGxpZ2h0IGlmIHRoaXMgcGFydCBpcyBjb2RlXG5cdFx0XHRcdGNvbnN0IHNpbmdsZUxpbmUgPSBjb2RlTWF0Y2hbMF0uaW5kZXhPZignXFxuJykgPT09IC0xO1xuXHRcdFx0XHRjb25zdCBsYW5nID0gIXNpbmdsZUxpbmUgJiYgQXJyYXkuZnJvbShobGpzLmxpc3RMYW5ndWFnZXMoKSkuaW5jbHVkZXMocy50cmltKGNvZGVNYXRjaFsxXSkpID8gcy50cmltKGNvZGVNYXRjaFsxXSkgOiAnJztcblx0XHRcdFx0Y29uc3QgY29kZSA9XG5cdFx0XHRcdFx0c2luZ2xlTGluZSA/XG5cdFx0XHRcdFx0XHRzLnVuZXNjYXBlSFRNTChjb2RlTWF0Y2hbMV0pIDpcblx0XHRcdFx0XHRcdGxhbmcgPT09ICcnID9cblx0XHRcdFx0XHRcdFx0cy51bmVzY2FwZUhUTUwoY29kZU1hdGNoWzFdICsgY29kZU1hdGNoWzJdKSA6XG5cdFx0XHRcdFx0XHRcdHMudW5lc2NhcGVIVE1MKGNvZGVNYXRjaFsyXSk7XG5cblx0XHRcdFx0Y29uc3QgcmVzdWx0ID0gbGFuZyA9PT0gJycgPyBobGpzLmhpZ2hsaWdodEF1dG8oKGxhbmcgKyBjb2RlKSkgOiBobGpzLmhpZ2hsaWdodChsYW5nLCBjb2RlKTtcblx0XHRcdFx0Y29uc3QgdG9rZW4gPSBgPSE9JHsgUmFuZG9tLmlkKCkgfT0hPWA7XG5cblx0XHRcdFx0bWVzc2FnZS50b2tlbnMucHVzaCh7XG5cdFx0XHRcdFx0aGlnaGxpZ2h0OiB0cnVlLFxuXHRcdFx0XHRcdHRva2VuLFxuXHRcdFx0XHRcdHRleHQ6IGA8cHJlPjxjb2RlIGNsYXNzPSdjb2RlLWNvbG9ycyBobGpzICR7IHJlc3VsdC5sYW5ndWFnZSB9Jz48c3BhbiBjbGFzcz0nY29weW9ubHknPlxcYFxcYFxcYDxicj48L3NwYW4+JHsgcmVzdWx0LnZhbHVlIH08c3BhbiBjbGFzcz0nY29weW9ubHknPjxicj5cXGBcXGBcXGA8L3NwYW4+PC9jb2RlPjwvcHJlPmAsXG5cdFx0XHRcdFx0bm9IdG1sOiBgXFxgXFxgXFxgXFxuJHsgcy5zdHJpcFRhZ3MocmVzdWx0LnZhbHVlKSB9XFxuXFxgXFxgXFxgYFxuXHRcdFx0XHR9KTtcblxuXHRcdFx0XHRtc2dQYXJ0c1tpbmRleF0gPSB0b2tlbjtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdG1zZ1BhcnRzW2luZGV4XSA9IHBhcnQ7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0Ly8gUmUtbW91bnQgbWVzc2FnZVxuXHRcdHJldHVybiBtZXNzYWdlLmh0bWwgPSBtc2dQYXJ0cy5qb2luKCcnKTtcblx0fVxufTtcblxuZXhwb3J0IGNvbnN0IGNvZGUgPSAobWVzc2FnZSkgPT4ge1xuXHRpZiAocy50cmltKG1lc3NhZ2UuaHRtbCkpIHtcblx0XHRpZiAobWVzc2FnZS50b2tlbnMgPT0gbnVsbCkge1xuXHRcdFx0bWVzc2FnZS50b2tlbnMgPSBbXTtcblx0XHR9XG5cblx0XHRjb2RlYmxvY2tzKG1lc3NhZ2UpO1xuXHRcdGlubGluZWNvZGUobWVzc2FnZSk7XG5cdH1cblxuXHRyZXR1cm4gbWVzc2FnZTtcbn07XG4iLCIvKlxuICogTWFya2Rvd24gaXMgYSBuYW1lZCBmdW5jdGlvbiB0aGF0IHdpbGwgcGFyc2UgbWFya2Rvd24gc3ludGF4XG4gKiBAcGFyYW0ge1N0cmluZ30gbXNnIC0gVGhlIG1lc3NhZ2UgaHRtbFxuICovXG5pbXBvcnQgeyBNZXRlb3IgfSBmcm9tICdtZXRlb3IvbWV0ZW9yJztcbmltcG9ydCB7IFJhbmRvbSB9IGZyb20gJ21ldGVvci9yYW5kb20nO1xuaW1wb3J0IHsgUm9ja2V0Q2hhdCB9IGZyb20gJ21ldGVvci9yb2NrZXRjaGF0OmxpYic7XG5pbXBvcnQgcyBmcm9tICd1bmRlcnNjb3JlLnN0cmluZyc7XG5cbmNvbnN0IHBhcnNlTm90RXNjYXBlZCA9IGZ1bmN0aW9uKG1zZywgbWVzc2FnZSkge1xuXHRpZiAobWVzc2FnZSAmJiBtZXNzYWdlLnRva2VucyA9PSBudWxsKSB7XG5cdFx0bWVzc2FnZS50b2tlbnMgPSBbXTtcblx0fVxuXG5cdGNvbnN0IGFkZEFzVG9rZW4gPSBmdW5jdGlvbihodG1sKSB7XG5cdFx0Y29uc3QgdG9rZW4gPSBgPSE9JHsgUmFuZG9tLmlkKCkgfT0hPWA7XG5cdFx0bWVzc2FnZS50b2tlbnMucHVzaCh7XG5cdFx0XHR0b2tlbixcblx0XHRcdHRleHQ6IGh0bWxcblx0XHR9KTtcblxuXHRcdHJldHVybiB0b2tlbjtcblx0fTtcblxuXHRjb25zdCBzY2hlbWVzID0gUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ01hcmtkb3duX1N1cHBvcnRTY2hlbWVzRm9yTGluaycpLnNwbGl0KCcsJykuam9pbignfCcpO1xuXG5cdGlmIChSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnTWFya2Rvd25fSGVhZGVycycpKSB7XG5cdFx0Ly8gU3VwcG9ydCAjIFRleHQgZm9yIGgxXG5cdFx0bXNnID0gbXNnLnJlcGxhY2UoL14jICgoW1xcU1xcd1xcZC1fXFwvXFwqXFwuLFxcXFxdWyBcXHUwMGEwXFx1MTY4MFxcdTE4MGVcXHUyMDAwLVxcdTIwMGFcXHUyMDI4XFx1MjAyOVxcdTIwMmZcXHUyMDVmXFx1MzAwMFxcdWZlZmZdPykrKS9nbSwgJzxoMT4kMTwvaDE+Jyk7XG5cblx0XHQvLyBTdXBwb3J0ICMgVGV4dCBmb3IgaDJcblx0XHRtc2cgPSBtc2cucmVwbGFjZSgvXiMjICgoW1xcU1xcd1xcZC1fXFwvXFwqXFwuLFxcXFxdWyBcXHUwMGEwXFx1MTY4MFxcdTE4MGVcXHUyMDAwLVxcdTIwMGFcXHUyMDI4XFx1MjAyOVxcdTIwMmZcXHUyMDVmXFx1MzAwMFxcdWZlZmZdPykrKS9nbSwgJzxoMj4kMTwvaDI+Jyk7XG5cblx0XHQvLyBTdXBwb3J0ICMgVGV4dCBmb3IgaDNcblx0XHRtc2cgPSBtc2cucmVwbGFjZSgvXiMjIyAoKFtcXFNcXHdcXGQtX1xcL1xcKlxcLixcXFxcXVsgXFx1MDBhMFxcdTE2ODBcXHUxODBlXFx1MjAwMC1cXHUyMDBhXFx1MjAyOFxcdTIwMjlcXHUyMDJmXFx1MjA1ZlxcdTMwMDBcXHVmZWZmXT8pKykvZ20sICc8aDM+JDE8L2gzPicpO1xuXG5cdFx0Ly8gU3VwcG9ydCAjIFRleHQgZm9yIGg0XG5cdFx0bXNnID0gbXNnLnJlcGxhY2UoL14jIyMjICgoW1xcU1xcd1xcZC1fXFwvXFwqXFwuLFxcXFxdWyBcXHUwMGEwXFx1MTY4MFxcdTE4MGVcXHUyMDAwLVxcdTIwMGFcXHUyMDI4XFx1MjAyOVxcdTIwMmZcXHUyMDVmXFx1MzAwMFxcdWZlZmZdPykrKS9nbSwgJzxoND4kMTwvaDQ+Jyk7XG5cdH1cblxuXHQvLyBTdXBwb3J0ICp0ZXh0KiB0byBtYWtlIGJvbGRcblx0bXNnID0gbXNnLnJlcGxhY2UoLyhefCZndDt8WyA+X35gXSlcXCp7MSwyfShbXlxcKlxcclxcbl0rKVxcKnsxLDJ9KFs8X35gXXxcXEJ8XFxifCQpL2dtLCAnJDE8c3BhbiBjbGFzcz1cImNvcHlvbmx5XCI+Kjwvc3Bhbj48c3Ryb25nPiQyPC9zdHJvbmc+PHNwYW4gY2xhc3M9XCJjb3B5b25seVwiPio8L3NwYW4+JDMnKTtcblxuXHQvLyBTdXBwb3J0IF90ZXh0XyB0byBtYWtlIGl0YWxpY3Ncblx0bXNnID0gbXNnLnJlcGxhY2UoLyhefCZndDt8WyA+Kn5gXSlcXF97MSwyfShbXlxcX1xcclxcbl0rKVxcX3sxLDJ9KFs8Kn5gXXxcXEJ8XFxifCQpL2dtLCAnJDE8c3BhbiBjbGFzcz1cImNvcHlvbmx5XCI+Xzwvc3Bhbj48ZW0+JDI8L2VtPjxzcGFuIGNsYXNzPVwiY29weW9ubHlcIj5fPC9zcGFuPiQzJyk7XG5cblx0Ly8gU3VwcG9ydCB+dGV4dH4gdG8gc3RyaWtlIHRocm91Z2ggdGV4dFxuXHRtc2cgPSBtc2cucmVwbGFjZSgvKF58Jmd0O3xbID5fKmBdKVxcfnsxLDJ9KFteflxcclxcbl0rKVxcfnsxLDJ9KFs8XypgXXxcXEJ8XFxifCQpL2dtLCAnJDE8c3BhbiBjbGFzcz1cImNvcHlvbmx5XCI+fjwvc3Bhbj48c3RyaWtlPiQyPC9zdHJpa2U+PHNwYW4gY2xhc3M9XCJjb3B5b25seVwiPn48L3NwYW4+JDMnKTtcblxuXHQvLyBTdXBwb3J0IGZvciBibG9jayBxdW90ZVxuXHQvLyA+Pj5cblx0Ly8gVGV4dFxuXHQvLyA8PDxcblx0bXNnID0gbXNnLnJlcGxhY2UoLyg/OiZndDspezN9XFxuKyhbXFxzXFxTXSo/KVxcbisoPzombHQ7KXszfS9nLCAnPGJsb2NrcXVvdGUgY2xhc3M9XCJiYWNrZ3JvdW5kLXRyYW5zcGFyZW50LWRhcmtlci1iZWZvcmVcIj48c3BhbiBjbGFzcz1cImNvcHlvbmx5XCI+Jmd0OyZndDsmZ3Q7PC9zcGFuPiQxPHNwYW4gY2xhc3M9XCJjb3B5b25seVwiPiZsdDsmbHQ7Jmx0Ozwvc3Bhbj48L2Jsb2NrcXVvdGU+Jyk7XG5cblx0Ly8gU3VwcG9ydCA+VGV4dCBmb3IgcXVvdGVcblx0bXNnID0gbXNnLnJlcGxhY2UoL14mZ3Q7KC4qKSQvZ20sICc8YmxvY2txdW90ZSBjbGFzcz1cImJhY2tncm91bmQtdHJhbnNwYXJlbnQtZGFya2VyLWJlZm9yZVwiPjxzcGFuIGNsYXNzPVwiY29weW9ubHlcIj4mZ3Q7PC9zcGFuPiQxPC9ibG9ja3F1b3RlPicpO1xuXG5cdC8vIFJlbW92ZSB3aGl0ZS1zcGFjZSBhcm91bmQgYmxvY2txdW90ZSAocHJldmVudCA8YnI+KS4gQmVjYXVzZSBibG9ja3F1b3RlIGlzIGJsb2NrIGVsZW1lbnQuXG5cdG1zZyA9IG1zZy5yZXBsYWNlKC9cXHMqPGJsb2NrcXVvdGUgY2xhc3M9XCJiYWNrZ3JvdW5kLXRyYW5zcGFyZW50LWRhcmtlci1iZWZvcmVcIj4vZ20sICc8YmxvY2txdW90ZSBjbGFzcz1cImJhY2tncm91bmQtdHJhbnNwYXJlbnQtZGFya2VyLWJlZm9yZVwiPicpO1xuXHRtc2cgPSBtc2cucmVwbGFjZSgvPFxcL2Jsb2NrcXVvdGU+XFxzKi9nbSwgJzwvYmxvY2txdW90ZT4nKTtcblxuXHQvLyBSZW1vdmUgbmV3LWxpbmUgYmV0d2VlbiBibG9ja3F1b3Rlcy5cblx0bXNnID0gbXNnLnJlcGxhY2UoLzxcXC9ibG9ja3F1b3RlPlxcbjxibG9ja3F1b3RlL2dtLCAnPC9ibG9ja3F1b3RlPjxibG9ja3F1b3RlJyk7XG5cblx0Ly8gU3VwcG9ydCAhW2FsdCB0ZXh0XShodHRwOi8vaW1hZ2UgdXJsKVxuXHRtc2cgPSBtc2cucmVwbGFjZShuZXcgUmVnRXhwKGAhXFxcXFsoW15cXFxcXV0rKVxcXFxdXFxcXCgoKD86JHsgc2NoZW1lcyB9KTpcXFxcL1xcXFwvW15cXFxcKV0rKVxcXFwpYCwgJ2dtJyksIChtYXRjaCwgdGl0bGUsIHVybCkgPT4ge1xuXHRcdGNvbnN0IHRhcmdldCA9IHVybC5pbmRleE9mKE1ldGVvci5hYnNvbHV0ZVVybCgpKSA9PT0gMCA/ICcnIDogJ19ibGFuayc7XG5cdFx0cmV0dXJuIGFkZEFzVG9rZW4oYDxhIGhyZWY9XCIkeyBzLmVzY2FwZUhUTUwodXJsKSB9XCIgdGl0bGU9XCIkeyBzLmVzY2FwZUhUTUwodGl0bGUpIH1cIiB0YXJnZXQ9XCIkeyBzLmVzY2FwZUhUTUwodGFyZ2V0KSB9XCIgcmVsPVwibm9vcGVuZXIgbm9yZWZlcnJlclwiPjxkaXYgY2xhc3M9XCJpbmxpbmUtaW1hZ2VcIiBzdHlsZT1cImJhY2tncm91bmQtaW1hZ2U6IHVybCgkeyBzLmVzY2FwZUhUTUwodXJsKSB9KTtcIj48L2Rpdj48L2E+YCk7XG5cdH0pO1xuXG5cdC8vIFN1cHBvcnQgW1RleHRdKGh0dHA6Ly9saW5rKVxuXHRtc2cgPSBtc2cucmVwbGFjZShuZXcgUmVnRXhwKGBcXFxcWyhbXlxcXFxdXSspXFxcXF1cXFxcKCgoPzokeyBzY2hlbWVzIH0pOlxcXFwvXFxcXC9bXlxcXFwpXSspXFxcXClgLCAnZ20nKSwgKG1hdGNoLCB0aXRsZSwgdXJsKSA9PiB7XG5cdFx0Y29uc3QgdGFyZ2V0ID0gdXJsLmluZGV4T2YoTWV0ZW9yLmFic29sdXRlVXJsKCkpID09PSAwID8gJycgOiAnX2JsYW5rJztcblx0XHRyZXR1cm4gYWRkQXNUb2tlbihgPGEgaHJlZj1cIiR7IHMuZXNjYXBlSFRNTCh1cmwpIH1cIiB0YXJnZXQ9XCIkeyBzLmVzY2FwZUhUTUwodGFyZ2V0KSB9XCIgcmVsPVwibm9vcGVuZXIgbm9yZWZlcnJlclwiPiR7IHMuZXNjYXBlSFRNTCh0aXRsZSkgfTwvYT5gKTtcblx0fSk7XG5cblx0Ly8gU3VwcG9ydCA8aHR0cDovL2xpbmt8VGV4dD5cblx0bXNnID0gbXNnLnJlcGxhY2UobmV3IFJlZ0V4cChgKD86PHwmbHQ7KSgoPzokeyBzY2hlbWVzIH0pOlxcXFwvXFxcXC9bXlxcXFx8XSspXFxcXHwoLis/KSg/PT58Jmd0OykoPzo+fCZndDspYCwgJ2dtJyksIChtYXRjaCwgdXJsLCB0aXRsZSkgPT4ge1xuXHRcdGNvbnN0IHRhcmdldCA9IHVybC5pbmRleE9mKE1ldGVvci5hYnNvbHV0ZVVybCgpKSA9PT0gMCA/ICcnIDogJ19ibGFuayc7XG5cdFx0cmV0dXJuIGFkZEFzVG9rZW4oYDxhIGhyZWY9XCIkeyBzLmVzY2FwZUhUTUwodXJsKSB9XCIgdGFyZ2V0PVwiJHsgcy5lc2NhcGVIVE1MKHRhcmdldCkgfVwiIHJlbD1cIm5vb3BlbmVyIG5vcmVmZXJyZXJcIj4keyBzLmVzY2FwZUhUTUwodGl0bGUpIH08L2E+YCk7XG5cdH0pO1xuXG5cdHJldHVybiBtc2c7XG59O1xuXG5leHBvcnQgY29uc3QgbWFya2Rvd24gPSBmdW5jdGlvbihtZXNzYWdlKSB7XG5cdG1lc3NhZ2UuaHRtbCA9IHBhcnNlTm90RXNjYXBlZChtZXNzYWdlLmh0bWwsIG1lc3NhZ2UpO1xuXHRyZXR1cm4gbWVzc2FnZTtcbn07XG4iLCIvKlxuICogTWFya2Rvd24gaXMgYSBuYW1lZCBmdW5jdGlvbiB0aGF0IHdpbGwgcGFyc2UgbWFya2Rvd24gc3ludGF4XG4gKiBAcGFyYW0ge09iamVjdH0gbWVzc2FnZSAtIFRoZSBtZXNzYWdlIG9iamVjdFxuICovXG5pbXBvcnQgeyBtYXJrZG93biB9IGZyb20gJy4vbWFya2Rvd24uanMnO1xuaW1wb3J0IHsgY29kZSB9IGZyb20gJy4vY29kZS5qcyc7XG5cbmV4cG9ydCBjb25zdCBvcmlnaW5hbCA9IChtZXNzYWdlKSA9PiB7XG5cdC8vIFBhcnNlIG1hcmtkb3duIGNvZGVcblx0bWVzc2FnZSA9IGNvZGUobWVzc2FnZSk7XG5cblx0Ly8gUGFyc2UgbWFya2Rvd25cblx0bWVzc2FnZSA9IG1hcmtkb3duKG1lc3NhZ2UpO1xuXG5cdC8vIFJlcGxhY2UgbGluZWJyZWFrIHRvIGJyXG5cdG1lc3NhZ2UuaHRtbCA9IG1lc3NhZ2UuaHRtbC5yZXBsYWNlKC9cXG4vZ20sICc8YnI+Jyk7XG5cblx0cmV0dXJuIG1lc3NhZ2U7XG59O1xuIl19
