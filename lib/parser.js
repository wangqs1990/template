"use strict";
var Token = require("./token").Token;
var nodes = require("./nodes");

var Parser = module.exports = function(env) {
  this._env = env;
  this._operators = [
    {
      "and": {
        "operator": "&&",
        "precedence": 10,
        "name": "And"
      },
      "or": {
        "operator": "||",
        "precedence": 10,
        "name": "Or"
      },
      "+": {
        "operator": "+",
        "precedence": 20,
        "name": "Add"
      },
      "-": {
        "operator": "-",
        "precedence": 20,
        "name": "Sub"
      },
      "*": {
        "operator": "*",
        "precedence": 25,
        "name": "Mul"
      },
      "/": {
        "operator": "/",
        "precedence": 25,
        "name": "Div"
      },
      "%": {
        "operator": "%",
        "precedence": 25,
        "name": "Mod",
      },
      ">": {
        "operator": ">",
        "precedence": 5,
        "name": "Greater"
      },
      ">=": {
        "operator": ">=",
        "precedence": 5,
        "name": "GreaterEqual"
      },
      "<": {
        "operator": "<",
        "precedence": 5,
        "name": "Less"
      },
      "<=": {
        "operator": "<=",
        "precedence": 5,
        "name": "LessEqual"
      },
      "==": {
        "operator": "===",
        "precedence": 5,
        "name": "Equal"
      },
      "!=": {
        "operator": "!==",
        "precedence": 5,
        "name": "NotEqual"
      }
    },
    {
      "not": {
        "operator": "!",
        "precedence": 100,
        "name": "Not"
      },
      "-": {
        "operator": "-",
        "precedence": 100,
        "name": "Neg"
      }
    }
  ];
};

var CONST = {
  NUMBER: 0,
  STRING: 1,
  BOOLEAN: 2,
  NAME: 3
};

Parser.prototype = {
  constructor: Parser,
  /**
   * 编译一个tokenStream
   * @param tokenStream
   * @returns {*}
   */
  parse: function(stream) {
    this.stream = stream;
    this.blocks = [];
    this.parent = null;
    this.blockStack = [];
    var body = new nodes.Body(this.subparse(), 1);
    return new nodes.Module(body, new nodes.Body(this.blocks), this.parent, 1);
  },
  /**
   * 编译直到指定的endTokens
   * @param endTokens
   * @returns {Array}
   */
  subparse: function(endTokens) {
    var _stream = this.stream,
      _nodes = [],
      token,
      node;
    while (!_stream.isEnd()) {
      token = _stream.getCurrent();
      _stream.next();
      switch (token.type) {
      case (Token.TEXT_TYPE) :
        _nodes.push(new nodes.Text(token.value, token.line));
        break;
      case (Token.VAR_START_TYPE) : 
        _nodes.push(new nodes.Output(this.parseExpression(), token.line));
        _stream.except(Token.VAR_END_TYPE, null);
        break;
      case (Token.BLOCK_START_TYPE) :
        token = _stream.getCurrent();
        if (endTokens && token.isAny(endTokens))
          return _nodes;
        if ((node = this.parseStatement(token.value)))
          _nodes.push(node);
        _stream.except(Token.BLOCK_END_TYPE, null);
        break;
      }
    }
    return _nodes;
  },

  /**
   * 解析表达式, 返回一个表达式的Node
   * @param precedence
   * @returns {*}
   */
  parseExpression: function(precedence) {
    precedence = precedence || 0;
    var binaryOperator = this._operators[0],
        unaryOperator = this._operators[1],
        node,
        value,
        operator,
        klass;
    node = this.parsePrimary();
    value = this.stream.getCurrent().value;
    operator = binaryOperator[value] || unaryOperator[value];
    while (operator && precedence < operator["precedence"]) {
      this.stream.next();
      klass = operator["class"] || nodes.Binary;
      node = new klass(node,
                       this.parseExpression(operator["precedence"]),
                       operator["operator"],
                       node.line);
      value = this.stream.getCurrent().value;
      operator = binaryOperator[value] || unaryOperator[value];
    }
    if (!precedence) {
      // value1 if expr else value2
      return this.parseCondExpression(node);
    }
    return node;
  },

  /**
   * 解析条件运算符 value1 if expr else value2
   * @param node
   * @returns {*}
   */
  parseCondExpression: function(node) {
    var expr;
    if (this.stream.skipIf(Token.NAME_TYPE, "if")) {
      expr = this.parseExpression(0);
      this.stream.except(Token.NAME_TYPE, "else");
      node = new nodes.Cond(node,
                            expr,
                            this.parseExpression(0),
                            node.line);
    }
    return node;
  },

  /**
   * 解析{% %}中的语句
   * @todo: {% for item in [1,2,3,4]%}
   * @return {*}
   */
  parseStatement: function(value) {

    //以后需要添加扩展
    var func = this["parse" + value.slice(0,1).toUpperCase() + value.slice(1)];
    if (func) {
      return func.call(this, this.stream.next());
    } else if ((func = this._parsers[value])) {
      return func.call(this, this.stream.next());
    }
    throw Error("can't parse block " + value);
  },
  /**
   * 解析单个变量, 包括string, number, boolean, array, dict
   * @return {*}
   */
  parsePrimary: function() {
    var token = this.stream.getCurrent(),
        node,
        operator,
        klass;
    this.stream.next();
    switch (token.type){
      case (Token.NUMBER_TYPE):
        node = new nodes.Const(token.value, CONST.NUMBER, token.line);
        break;
      case (Token.NAME_TYPE):
        switch (token.value) {
          case ("True"):
          case ("true"):
            node = new nodes.Const(true, CONST.BOOLEAN, token.line);
            break;
          case ("False"):
          case ("false"):
            node = new nodes.Const(false, CONST.BOOLEAN, token.line);
            break;
          default:
            node = this.parseSuffix(new nodes.Name(token.value, token.line));
            break;
        }
        break;
      case (Token.STRING_TYPE):
        node = new nodes.Const(token.value, CONST.STRING, token.line);
        break;
      case (Token.PUNCTUATOR_TYPE):
        switch (token.value) {
          case ("["):
            node = this.parseArray();
            break;
          case ("{"):
            node = this.parseDict();
            break;
          case ("("):
            node = this.parseTuple();
            break;
        }
        break;
      case (Token.OPERATOR_TYPE):
        operator = this._operators[1][token.value];
        if (operator) {
          klass = operator["class"] || nodes.Unary;
          node = new klass(this.parseExpression(operator["precedence"]), operator["operator"], token.line);
        } else {
          this.stream.fail();
        }
        break;
      default:
        this.stream.fail();
        break;
    }
    return node;
  },
  /**
   * 解析变量的后缀 包括'[]', '.', filter, call
   * @param nameNode
   * @returns {*}
   */
  parseSuffix: function(nameNode) {
    var token,
        attr;
    if ((token = this.stream.skipIf(Token.PUNCTUATOR_TYPE, "["))) {
      attr = this.parseExpression(0);
      this.stream.except(Token.PUNCTUATOR_TYPE, "]");
      return new nodes.Attribute(nameNode, attr, token.line);
    } else if ((token = this.stream.skipIf(Token.PUNCTUATOR_TYPE, "."))) {
      token = this.stream.except(Token.NAME_TYPE);
      attr = new nodes.Const(token.value, CONST.STRING, token.line);
      return new nodes.Attribute(nameNode, attr, token.line);
    } else if ((token = this.stream.skipIf(Token.PUNCTUATOR_TYPE, "|"))) {
      token = this.stream.except(Token.NAME_TYPE);
      if (this.stream.skipIf(Token.PUNCTUATOR_TYPE, "(")) {
        return new nodes.Filter(nameNode,
                                token.value,
                                this.parseTuple(),
                                token.line);
      } else {
        return new nodes.Filter(nameNode, token, null, token.line);
      }
    } else {
      return nameNode;
    }
  },

  /**
   * 解析括号表达式
   * @todo:
   *  (1,2,3,4)
   * @returns {*}
   */
  parseTuple: function() {
    var token,
        items = [];
    while (!(token = this.stream.getCurrent()).is(Token.PUNCTUATOR_TYPE, ")")) {
      items.push(this.parseExpression());
      token = this.stream.getCurrent();
      if (token.is(Token.PUNCTUATOR_TYPE, ")")){
        this.stream.next();
        break;
      }
      this.stream.except(Token.OPERATOR_TYPE, ",");
    }
    return new nodes.Tuple(items, token.line);
  },

  /**
   * 解析数组
   * @returns {*}
   */
  parseArray: function() {
    var token,
        items = [];
    while (!(token = this.stream.getCurrent()).is(Token.PUNCTUATOR_TYPE,"]")){
      items.push(this.parseExpression());
      token = this.stream.getCurrent();
      if (token.is(Token.PUNCTUATOR_TYPE, "]")){
        this.stream.next();
        break;
      }
      this.stream.except(Token.OPERATOR_TYPE, ",");
    }
    return new nodes.Array(items, token.line);
  },

  /**
   * 解析字典
   * @returns {*}
   */
  parseDict: function() {
    var token,
        value,
        items = [];
    while (!(token = this.stream.getCurrent()).is(Token.PUNCTUATOR_TYPE,"}")) {
      token = this.stream.except(Token.STRING_TYPE);
      items.push(new nodes.Const(token.value, CONST.STRING, token.line));
      this.stream.except(Token.PUNCTUATOR_TYPE, ":");
      value = this.parseExpression();
      items.push(value);
      token = this.stream.getCurrent();
      if (token.is(Token.PUNCTUATOR_TYPE, "}")) {
        this.stream.next();
        break;
      }
      this.stream.except(Token.OPERATOR_TYPE, ",");
    }
    return new nodes.Dict(items, token.line);
  },

  /**
   * 解析for语句, 如果key为空的话使用for循环, 否则使用for...in循环,
   * 这里需要自己去控制使用for或者for...in循环
   * @return {*}
   */
  parseFor: function(){
    var token, key, value,
        body, line, iter;
    token = this.stream.except(Token.NAME_TYPE);
    line = token.line;
    key = token.value;
    if ((token = this.stream.skipIf(Token.OPERATOR_TYPE, ","))) {
      value = token.value;
      this.stream.next();
    } else {
      value = key;
      key = null;
    }
    this.stream.except(Token.NAME_TYPE, "in");
    token = this.stream.getCurrent();
    this.stream.next();
    if (token.is(Token.PUNCTUATOR_TYPE, "[")){
      iter = this.parseArray();
    } else if (token.is(Token.PUNCTUATOR_TYPE, "{")){
      iter = this.parseDict();
    } else if (token.is(Token.NAME_TYPE)) {
      iter = new nodes.Name(token.value, token.length);
    } else {
      throw Error(token.value + " not a iterator");
    }
    this.stream.next();
    body = new nodes.Body(
      this.subparse([
        [Token.NAME_TYPE, "endfor"]
      ]),
      token.line
    );
    this.stream.except(Token.NAME_TYPE, "endfor");
    return new nodes.For(key, value, iter, body, line);
  },
  /**
   * 解析If语句
   * @returns {*}
   */
  parseIf: function() {
    var tests = [], line, body,
        token = this.stream.getCurrent();
    line = token.line;
    while (1) {
      tests.push(this.parseExpression());
      body = new nodes.Body(
        this.subparse([
          [Token.NAME_TYPE, "endif"],
          [Token.NAME_TYPE, "else"],
          [Token.NAME_TYPE, "elif"]
        ]),
        token.line
      );
      tests.push(body);
      token = this.stream.getCurrent();
      this.stream.next();
      if (token.value === "elif") {
        continue;
      } else if (token.value === "else") {
        body = new nodes.Body(
          this.subparse([
            [Token.NAME_TYPE, "endif"]
          ]),
          token.line
        );
        tests.push(body);
        this.stream.next();
        break;
      } else {
        break;
      }
    }
    return new nodes.If(tests, line);
  },
  parseBlock: function() {
    var token = this.stream.except(Token.NAME_TYPE),
        name = token.value,
        body, node;
    this.blockStack.push(name);
    body = new nodes.Body(
      this.subparse([
        [Token.NAME_TYPE, "endblock"]
      ]),
      token.line
    );
    this.stream.next();
    node = new nodes.Block(body, name, token.line);
    this.blocks.push([name, node]);
    this.blockStack.pop();
    return node;
  },
  parseExtends: function() {
    //暂时先只能继承string 
    if (this.parent) {
      throw Error("doesn't support multi extend");
    } else {
      this.parent = this.parseExpression();
    }
  }
};