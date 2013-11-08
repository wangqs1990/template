var Token = require("./token").Token;
var Parser = module.exports = function(env){

};

var nodes = require("./nodes");

var CONST = {
  NUMBER: 0,
  STRING: 1,
  BOOLEAN: 2
};

Parser.prototype = {
  constructor: Parser,
  parse: function(stream) {
    this.stream = stream;
    return new nodes.Template(this.subparse(), 1);
  },
  subparse: function(endTokens) {
    var _stream = this.stream,
      _nodes = [],
      token;
    while (!_stream.isEnd()) {
      token = _stream.getCurrent();
      _stream.next();
      switch (token.type) {
      case (Token.TEXT_TYPE) :
        _nodes.push(new nodes.Text(token.value, token.line));
        break;
      case (Token.VAR_START_TYPE) : 
        _nodes.push(new nodes.Output(this.parseExpression(), token.line));
        _stream.except(Token.VAR_END_TYPE);
        break;
      case (Token.BLOCK_START_TYPE) :
        token = _stream.getCurrent();
        if (endTokens && token.test_any(endTokens))
          return _nodes;
        _nodes.push(this.parseStatement(token.value));
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

  //解析{% %}中的语句
  parseStatement: function(value){

    //以后需要添加扩展
    return this["parse" +
                value.slice(0,1).toUpperCase() +
                value.slice(1)
              ](this.stream.next());
  },
  //解析变量, 数组, 字典
  parsePrimary: function(){
    var token = this.stream.getCurrent(),
        node;
    this.stream.next();
    switch (token.type){
      case (Token.NUMBER_TYPE):
        node = new nodes.Const(token.value, CONST.NUMBER, token.line);
        break;
      case (Token.NAME_TYPE):
        switch (token.value){
          case ("True"):
          case ("true"):
            node = new nodes.Const(true, CONST.BOOLEAN, token.line);
            break;
          case ("False"):
          case ("false"):
            node = new nodes.Const(false, CONST.BOOLEAN, token.line);
            break;
          default:
            node =
              this.parseAttribute(new nodes.Name(token.value, token.line));
            break;
        }
        break;
      case (Token.STRING_TYPE):
        node = new nodes.Const(token.value, CONST.STRING, token.line);
        break;
      default:
        if (token.test(Token.PUNCTUATOR_TYPE, "[")) {
          node = this.parseArray();
        }
        else if (token.test(Token.PUNCTUATOR_TYPE, "{")) {
          node = this.parseDict();
        } else if (token.test(Token.PUNCTUATOR_TYPE, "(")) {
          node = this.parseTuple();
        }
    }
    return node;
  },

  parseAttribute: function(nameNode) {
    var token,
        attr;
    if (token = this.stream.next_if(Token.PUNCTUATOR_TYPE, "[")) {
      attr = this.parseExpression();
      this.stream.except(Token.PUNCTUATOR_TYPE, "]");
      return new nodes.Attribute(nameNode, attr, token.line);
    } else if (token = this.stream.next_if(Token.PUNCTUATOR_TYPE, ".")) {
      token = this.stream.except(Token.NAME_TYPE);
      attr = new nodes.Const(token.value, CONST.STRING, token.line);
      return new nodes.Attribute(nameNode, attr, token.line);
    } else {
      return nameNode;
    }
  },

  //解析括号表达式, 不包括prefix
  parseTuple: function() {
    var token,
      items = [];
    while ((token = this.stream.getCurrent()).test(Token.PUNCTUATOR_TYPE, ")")){
      items.push(this.parseExpression());
      token = this.stream.getCurrent();
      if (token.test(Token.PUNCTUATOR_TYPE, ")")){
        this.stream.next();
        break;
      }
      this.stream.except(Token.OPERATOR_TYPE, ",");
    }
    if (items.length == 1){
      return items[0];
    } else {
      return nodes.Tuple(items, token.line);
    }
  },

  //解析数组, 不包括prefix
  parseArray: function(){
    var token,
        items = [];
    while (!(token = this.stream.getCurrent()).test(Token.PUNCTUATOR_TYPE,"]")){
      items.push(this.parseExpression());
      token = this.stream.getCurrent();
      if (token.test(Token.PUNCTUATOR_TYPE, "]")){
        this.stream.next();
        break;
      }
      this.stream.except(Token.OPERATOR_TYPE, ",");
    }
    return new nodes.Array(items, token.line);
  },

  //解析字典, 不包括prefix
  parseDict: function(){
    var token,
        key,
        value,
        items = [];
    while (!(token = this.stream.getCurrent()).test(Token.PUNCTUATOR_TYPE,"}")){
      key = this.parseExpression();
      this.stream.except(Token.PUNCTUATOR_TYPE, ":");
      value = this.parseExpression();
      items.push([key,value]);
      token = this.stream.getCurrent();
      if (token.test(Token.PUNCTUATOR_TYPE, "}")) {
        this.stream.next();
        break;
      }
      this.stream.except(Token.OPERATOR_TYPE, ",");
    }
    return new nodes.Dict(items, token.line);
  },

  //for语句, 如果key为空的话使用for循环, 否则使用for...in循环
  parseFor: function(){
    var node = new nodes.For(),
        token,
        key;
    token = this.stream.except(Token.NAME_TYPE);
    node.line = token.line;
    key = token.value;
    if ((token = this.stream.next_if(Token.OPERATOR_TYPE, ","))) {
      node.key = key;
      node.value = token.value;
      this.stream.next();
    } else {
      node.value = key;
    }
    this.stream.except(Token.NAME_TYPE, "in");
    token = this.stream.getCurrent();
    this.stream.next();
    if (token.test(Token.PUNCTUATOR_TYPE, "[")){
      node.iter = this.parseArray();
    }
    else if (token.test(Token.PUNCTUATOR_TYPE, "{")){
      node.iter = this.parseDict();
    } else {
      token = this.stream.except(Token.NAME_TYPE);
      node.iter = new nodes.Name(token, token.length);
    }
    this.stream.next();
    node.body = new nodes.Template(
      this.subparse([
        [Token.NAME_TYPE, "endfor"]
      ]),
      token.line
    );
    this.stream.except(Token.NAME_TYPE, "endfor");
    return node;
  },
  //if语句
  parseIf: function(){
    var rv = new nodes.If(),
        node = rv,
        newNode,
        token = this.stream.getCurrent();
    rv.line = token.line;
    while (1) {
      node.expr = this.parseExpression();
      node.body = new nodes.Template(
        this.subparse([
          [Token.NAME_TYPE, "endif"],
          [Token.NAME_TYPE, "else"],
          [Token.NAME_TYPE, "elif"]
        ]),
        token.line
      );
      token = this.stream.getCurrent();
      this.stream.next();
      if (token.value === "elif") {
        newNode = new nodes.If();
        newNode.lineNo = token.line;
        node.else_ = newNode;
        node = newNode;
        continue;
      } else if(token.value === "else") {
        node.else_ = new nodes.Template(
          this.subparse([
            [Token.NAME_TYPE, "endif"]
          ]),
          token.line
        );
        this.stream.next();
        break;
      } else {
        node.else_ = null;
        break;
      }
    }
    return rv;
  }
};