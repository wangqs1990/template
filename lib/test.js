var Lexer = require("./Lexer");
var Parser = require("./Parser");
var TokenStream = require("./Token").TokenStream;
var fs = require("fs");
fs.readFile("./test.html", { "encoding": "utf8" }, function(err, code){
    var lexer = new Lexer();
    var parser = new Parser();
    var stream = lexer.tokenize(code);
    console.log(stream);
    console.log(parser.parse(stream));
})
