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
  initExtensions: function() {
    this._inited = true;
  }
};

function Template () {
  this.env = new Environment();
}

Template.prototype = {
  constructor: Template,
  render: function (source, dict) {
    var _source,
        _compiled,
        templateFunc;
    _source = this.env.loader.load(source);
    if (!source) {
      return "";
    }
    _compiled = this.env.compileSource(_source);
    require('fs').writeFileSync('./out.html', _compiled, {encoding: "utf8"});
    templateFunc = new Function('context', _compiled);
    return templateFunc(new Context(dict));
  }
}
module.exports = {
  Environment: Environment,
  Template: Template
};