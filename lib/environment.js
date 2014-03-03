"use strict";
var Lexer = require("./lexer");
var Parser = require("./parser");
var Compiler = require("./compiler");
var BaseLoader = require("./loaders").BaseLoader;
var Context = require("./runtime").Context;

function Environment(opt) {
  opt = opt || {};
  this.lexer = opt.lexer || new Lexer();
  this.parser = opt.parser || new Parser();
  this.compiler = opt.compiler || new Compiler();
  this.loader = opt.loader || new BaseLoader();
  this._extensions = [];
  this.filters = {
    "default": function(value, defaultValue) {
      if (value) {
        return value;
      } else {
        return defaultValue;
      }
    }
  };
  this._inited = false;
}

Environment.prototype = {
  constructor: Environment,
  compileSource: function(source) {
    var stream = this.lexer.tokenize(source);
    var node = this.parser.parse(stream);
    return this.compiler.compile(node).source;
  },
  /**
   * 初始化extension
   */
  initExtensions: function() {
    this._inited = true;
  },
  /**
   * 获取模板
   * @param source
   * @returns {*}
   */
  getTemplate: function(source) {
    var _source,
        _compiled,
    _source = this.loader.load(source);
    if (!source) {
      return "";
    }
    _compiled = this.compileSource(_source);
    return new Template(this, new Function(_compiled));
  },
  getFilter: function(name) {
    return this.filters[name];
  }
};

function Template(env, init) {
  this.env = env;
  init.call(this);
  this.init = init;
}

Template.prototype = {
  constructor: Template,
  render: function(dict) {
    try {
      return this.root((dict instanceof Context ? dict : new Context(dict)));
    } catch (error) {
      console.dir(error);
    }
  },
  renderBlock: function(name, context) {
    var blockFunc = this["block_" + name];
    if (blockFunc) {
      return blockFunc.call(this, context);
    } else {
      return this.parent.renderBlock(name, context);
    }
  }
}
module.exports = {
  Environment: Environment,
  Template: Template
};