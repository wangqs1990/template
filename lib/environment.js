var Lexer = require("./lexer");
var Parser = require("./parser");
var Compiler = require("./compiler");

function Environment() {
  this.lexer = new Lexer();
  this.parser = new Parser();
  this.compiler = new Compiler();
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
  }
}

module.exports = Environment;