"use strict";
var fs = require("fs");

var BaseLoader = function() {

};

BaseLoader.prototype = {
  constructor: BaseLoader,
  load: function(templateName) {
    return templateName;
  }
};

function FileSystemLoader(path) {
  this.path = path;
}

FileSystemLoader.prototype = {
  load: function(templateName) {
    return fs.readFileSync(this.path + templateName, { "encoding": "utf8" });
  }
}

function ArrayLoader(sources) {
  this._sources = sources || {};
}

ArrayLoader.prototype = {
  constructor: ArrayLoader,
  load: function(templateName) {
    var source;
    if ((source = this._sources)) {
      return source;
    }
    return "";
  }
};
module.exports = {
  BaseLoader: BaseLoader,
  ArrayLoader: ArrayLoader,
  FileSystemLoader: FileSystemLoader,
}