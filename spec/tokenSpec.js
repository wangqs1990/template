var Lexer = require("../lib/lexer");
var token = require("../lib/token");

describe("lexer suite with default tokenize", function() {
  var defaultLexer = new Lexer();
  var Token = token.Token;
  //测试只有text
  it("only text", function() {
    var text = "only text";
    var stream = defaultLexer.tokenize(text);
    var token;
    expect(stream._tokens.length).toBe(2, "length should be 2");
    token = stream.getCurrent();
    expect(token.type).toBe(Token.TEXT_TYPE, "first should be text");    
    expect(token.value).toBe("only text");

    token = stream.next();
    expect(token.type).toBe(Token.END_TYPE);
  });
  //测试只有var
  it("ony var", function() {
    var varText = "{{name}}";
    var stream = defaultLexer.tokenize(varText);
    expect(stream._tokens.length).toBe(4, "length should be 4");
    [
      [Token.VAR_START_TYPE],
      [Token.NAME_TYPE, "name"],
      [Token.VAR_END_TYPE],
      [Token.END_TYPE]
    ].forEach(function(item) {
      stream.except(item[0], item[1]);
    });
  });

  //测试表达式
  it("var expression", function() {
    var varText = "{{name + \"a\"}}";
    var stream = defaultLexer.tokenize(varText);
    expect(stream._tokens.length).toBe(6, "length should be 6");
    [
      [Token.VAR_START_TYPE],
      [Token.NAME_TYPE, "name"],
      [Token.OPERATOR_TYPE, "+"],
      [Token.STRING_TYPE, "a"],
      [Token.VAR_END_TYPE],
      [Token.END_TYPE]
    ].forEach(function(item) {
      stream.except(item[0], item[1]);
    });
  });

  //测试block
  it("block", function() {
    var blockText = "{%if true == true%}{%endblock%}";
    var stream = defaultLexer.tokenize(blockText);
    expect(stream._tokens.length).toBe(10, "length should be 10");
    [
      [Token.BLOCK_START_TYPE],
      [Token.NAME_TYPE, "if"],
      [Token.NAME_TYPE, "true"],
      [Token.OPERATOR_TYPE, "=="],
      [Token.NAME_TYPE, "true"],
      [Token.BLOCK_END_TYPE],
      [Token.BLOCK_START_TYPE],
      [Token.NAME_TYPE, "endblock"],
      [Token.BLOCK_END_TYPE],
      [Token.END_TYPE]
    ].forEach(function(item) {
      stream.except(item[0], item[1]);
    });
  });
});