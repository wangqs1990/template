"use strict";
var Lexer = require("./lexer");
var Parser = require("./parser");
var Compiler = require("./compiler");
var BaseLoader = require("./loaders").BaseLoader;
var Context = require('./runtime').Context;

function Environment() {
  this.lexer = new Lexer();
  this.parser = new Parser();
  this.compiler = new Compiler();
  this.loader = new BaseLoader();
  this._extensions = [];
  this._inited = false;
}

Environment.prototype = {
  constructor: Environment,
  compileSource: function(source) {
    var a = new Date();
    var stream = this.lexer.tokenize(source);
    console.log(stream);
    var node = this.parser.parse(stream);
    console.log(node, new Date-a);
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
    require('fs').writeFileSync('./out.html', _compiled, {encoding: "utf8"});
    return new Template(this, new Function('context', _compiled));
  }
};

function Template(env, code) {
  this.env = new Environment();
  this.templateFunc = code;
}

Template.prototype = {
  constructor: Template,
  render: function(dict) {
    var context = new Context(dict),
        result;
    try {
      result = this.templateFunc(context);
    } catch (error) {

    }
    return result;
  }
}
module.exports = {
  Environment: Environment,
  Template: Template
};