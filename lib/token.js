"use strict";
var operators = {
    ",": "comma",
    "+": "add",
    "-": "sub",
    "*": "mul",
    "/": "div",
    "&&": "and",
    "||": "or"
};

/**
 * Token
 * @param type
 * @param value
 * @param line
 * @constructor
 */
var Token = function(type, value, line){
  this.type = type;
  this.value = value;
  this.line = line;
};

Token.END_TYPE = 0;                      // 结束
Token.TEXT_TYPE = 1;                     // 直接输出的文本
Token.VAR_START_TYPE = 2;                // 变量开始
Token.VAR_END_TYPE = 3;                  // 变量结束
Token.BLOCK_START_TYPE = 4;              // 代码块开始
Token.BLOCK_END_TYPE = 5;                // 代码块结束
Token.NAME_TYPE = 6;                     // 标识符
Token.STRING_TYPE = 7;                   // 字符串包括\'和\"
Token.NUMBER_TYPE = 8;                   // 数字
Token.OPERATOR_TYPE = 9;                 // 操作符
Token.PUNCTUATOR_TYPE = 10;              // /([{)]}?:./

Token.prototype = {
  constructor: Token,
  /**
   * 判断token的type和value
   * @param type
   * @param value
   * @returns {boolean}
   */
  test: function(type, value) {
    return (type === this.type) && (value ? value === this.value : true);
  },
  /**
   * 判断是否符合其中一个token [[type, value]]
   * @param tokens
   * @returns {boolean}
   */
  testAny: function(tokens) {
    var len = tokens.length;
    for (var i = 0; i < len; i++) {
      if (this.test(tokens[i][0], tokens[i][1])) {
        return true
      }
    }
    return false;
  }
};

var TokenStream = function(tokens) {
  this._tokens = tokens;
  this._current = 0;
}

TokenStream.prototype = {
  constructor: TokenStream,
  /**
   * 获取当前的token
   * @returns {Token}
   */
  getCurrent: function() {
    return this._tokens[this._current];
  },
  /**
   * 获取下一个token
   * @returns {Token}
   */
  next: function() {
    this._current++;
    if (!this._tokens[this._current]) {
      throw Error("TokenStream End");
    }
    return this._tokens[this._current];
  },
  /**
   * 判断当前元素是否符合type和value, 如果符合跳过这个Token并返回, 否则抛出异常
   * @param type
   * @param value
   * @returns {Token} or throw a Error
   */
  except: function(type, value) {
    var token = this._tokens[this._current];
    if (!token.test(type, value)) {
      throw Error("TokenStream Except Error " + JSON.stringify(token));
    } else {
      this._current++;
      return token;
    }
  },
  /**
   * 如果是则跳过, 并返回下一个元素, 否则返回false
   * @param type
   * @param value
   * @returns {*}
   */
  skipIf: function(type, value) {
    if (this._tokens[this._current].test(type, value)) {
      return this.next();
    } else {
      return false;
    }
  },
  /**
   * 判断是否结束
   * @returns {boolean}
   */
  isEnd: function() {
    return this._tokens[this._current].test(Token.END_TYPE);
  },
  /**
   * 错误, 抛出异常
   */
  fail: function() {
    throw Error("TokenStream fail");
  }
}   
exports.Token = Token;
exports.TokenStream = TokenStream;