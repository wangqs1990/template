var Token = require("./token").Token;
var Parser = module.exports = function(env){

};


var nodes = require("./nodes");

Parser.prototype = {
  constructor: Parser,
  parse: function(stream){
    this.stream = stream;
    return new nodes.Template(this.subparse(), 1);
  },
  subparse: function(){
    var _stream = this.stream,
      _nodes = [],
      token;
    while(!_stream.isEnd()){
      token = _stream.getCurrent();
      _stream.next();
      switch(token.type){
      case(Token.TEXT_TYPE):
        _nodes.push(new nodes.Text(token.value, token.line));
        break;
      case(Token.VAR_START_TYPE):
        _nodes.push(new nodes.Output(this.parseExpression(), token.line));
        _stream.except(Token.VAR_END_TYPE);
        break;
      case(Token.BLOCK_START_TYPE):
        token = this.stream.except(Token.NAME_TYPE);
        _nodes.push(this["parse"+token.value.slice(0,1).toUpperCase()+token.value.slice(1)]());
        _stream.except(Token.BLOCK_END_TYPE);
        break;
      }
    }
    return _nodes;
  },

  //解析表达式
  parseExpression: function(){
    return this.parsePrimary();    
  },

  //解析变量, 数组, 字典
  parsePrimary: function(){
    var token = this.stream.getCurrent(),
        node;
    this.stream.next();
    switch(token.type){
      case(Token.NUMBER_TYPE):
        node = nodes.Const(token.value, 0);
        break;
      case(Token.NAME_TYPE):
        switch(token.value){
          case("True"):
          case("true"):
            node = new nodes.Const(true, 2);
            break;
          case("False"):
          case("false"):
            node = new nodes.Const(false, 2);
            break;
          default:
            node = new nodes.Name(token.value, token.line);
            break;
        }
        break;
      case(Token.STRING_TYPE):
        node = nodes.Const(token.value, 1);
        break;
      default:
        if (token.test(Token.PUNCTUATION_TYPE, "["))
          node = this.parseArray();
        if (token.test(Token.PUNCTUATION_TYPE, "{"))
          node = this.parseDict();
        if (token.test(Token.PUNCTUATION_TYPE, "("))
          node = this.parseTuple();
    }
    return node;
  },

  //解析括号表达式, 不包括prefix
  parseTuple: function(){
    var token,
        items = [];
  },

  //解析数组, 不包括prefix
  parseArray: function(){
    var token,
        items = [];
    while(!(token = this.stream.getCurrent()).test(Token.PUNCTUATION_TYPE,"]")){
      items.push(this.parseExpression());
      if(token.test(Token.PUNCTUATION_TYPE, "]")){
        this.stream.next();
        break;
      }
      this.stream.except(Token.PUNCTUATION_TYPE, ",");
    }
    return new nodes.Array(items, token.line);
  },

  //解析字典, 不包括prefix
  parseDict: function(){
    var token,
        key,
        value,
        items = [];
    while(!(token = this.stream.getCurrent()).test(Token.PUNCTUATION_TYPE,"}")){
      key = this.parseExpression();
      this.stream.except(Token.PUNCTUATION_TYPE, ":");
      value = this.parseExpression();
      items.push([key,value]);
      if(token.test(Token.PUNCTUATION_TYPE, "}")){
        this.stream.next();
        break;
      }
      this.stream.except(Token.PUNCTUATION_TYPE, ",");
    }
    return new nodes.Dict(items, token.line);
  },

  //for语句
  parseFor: function(){

  },
  //if语句
  parseIf: function(){

  }
};