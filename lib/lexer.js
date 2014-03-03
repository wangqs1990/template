"use strict";
var REGEX_NAME          = /^([a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*)/g,
    REGEX_NUMBER        = /^([0-9]+(?:\.[0-9]+)?)/g,
    REGEX_STRING        = /^\".*?\"|^\'.*?\'/g,
    PUNCTUATION         = '([{)]}?:.|',
    LINE                = /(?:\r\n)|\n|\r/g,
    BINARY              = /^(?:,|\+|\-|\*|\/|%|and(?=\s)|or(?=\s)|not(?=\s))/;
var token = require("./token"),
    Token = token.Token,
    TokenStream = token.TokenStream;
var Lexer = module.exports = function(options) {
  this._options = {
    "var"              : ["{{", "}}"],
    "block"            : ["{%", "%}"],
    "whitespace_trim"  : "-"
  };

  this._regexps = {
    "lex_var"       : new RegExp("\\s*" + this._options["var"][1] + "|\\s*-" + this._options["var"][1] + "\\s*", "g"),
    "lex_block"     : new RegExp("\\s*" + this._options["block"][1] + "(\\\\n)?|\\s*-" + this._options["block"][1] + "(\\\\n)?\\s*", "g"),
    "lex_tokens"    : new RegExp("(" + this._options["var"][0] + "|\\s*" + this._options["block"][0] + ")(-)?\\s*", "g")
  };

  this._current = 0;
  this._lineNo = 1;
  this._code = "";
  this._tokens = [];
}

Lexer.STATE_DATA = 0;
Lexer.STATE_VAR = 1;
Lexer.STATE_BLOCK = 2;

Lexer.prototype = {
  constructor: Lexer,
  _moveCur: function(length) {
    this._current = length;
    while (this._current > this._linePos[this._lineNo - 1]) {
      this._lineNo++;
    }
  },
  /**
   * 匹配文本token
   * @param position
   * @param rtrim
   * @private
   */
  _lexText: function(position, rtrim) {
    var text = this._code.slice(this._current, position);
    //如果需要rtrim 则删掉换行和空格, 如果场地为空则说明是block后的空行
    text = rtrim ? text.replace(/(?:\\n)?\s*$/, "") : text;
    if (text.length) {
      this.pushToken(Token.TEXT_TYPE, text);
    }
    this._moveCur(position);
  },
  /**
   * 匹配变量token
   * @private
   */
  _lexVar: function() {
    var match, varRegx = this._regexps["lex_var"];
    this.pushToken(Token.VAR_START_TYPE, "");
    match = this._match(varRegx);
    this._lexExpr(this._code.slice(this._current, match.index));
    this._moveCur(varRegx.lastIndex);
    this.pushToken(Token.VAR_END_TYPE, "");
  },
  /**
   * 匹配流程语句token
   * @private
   */
  _lexBlock: function() {
    var match, blockRegx = this._regexps["lex_block"];
    this.pushToken(Token.BLOCK_START_TYPE, "");
    match = this._match(blockRegx);
    this._lexExpr(this._code.slice(this._current, match.index));
    this._moveCur(blockRegx.lastIndex);
    this.pushToken(Token.BLOCK_END_TYPE, "");
  },
  /**
   * 匹配表达式的token 可能是变量中, 也可能是流程语句中
   * @param expr
   * @private
   */
  _lexExpr: function(expr) {
    var match, punIndex, curChar, bracket, brackets=[];
    function getMatch(item, value) {
      match = item;
      return "";
    }
    while (expr) {
      match = null;
      expr = expr.replace(/^(\s+)/g, getMatch);
      if (match) {
        continue;
      }
      // operators 先解析操作符, 因为操作符有and or not
      expr = expr.replace(BINARY, getMatch);
      if (match) {
        this.pushToken(Token.OPERATOR_TYPE, match);
        continue;
      }
      //variables
      expr = expr.replace(REGEX_NAME, getMatch);
      if (match) {
        this.pushToken(Token.NAME_TYPE, match);
        continue;
      }
      //numbers
      expr = expr.replace(REGEX_NUMBER, getMatch);
      if (match) {
        this.pushToken(Token.NUMBER_TYPE, match);
        continue;
      }
      //string
      expr = expr.replace(REGEX_STRING, getMatch);
      if (match) {
        this.pushToken(Token.STRING_TYPE, match.slice(1, match.length - 1));
        continue;
      }
      //punctuation
      curChar = expr[0];
      punIndex = PUNCTUATION.indexOf(curChar);
      if (punIndex > -1) {
        if (punIndex < 3) {
          brackets.push([curChar, punIndex]);
        } else if (punIndex < 6 ){
          bracket = brackets.pop();
          if (!bracket || punIndex-3 !== bracket[1]) {
            throw Error("Unexpected " + curChar);
          }
        }
        this.pushToken(Token.PUNCTUATOR_TYPE, curChar);
        expr = expr.slice(1);
        continue;
      }
      throw Error("unknow" + expr);
    }
    //可能出现未匹配的括号
    if (brackets.length) {
      bracket = brackets.pop();
      throw Error("Unclosed " + bracket[0]);
    }
  },
  /**
   * 正则表达式匹配, 从自定义的锚点开始
   * @param pattern
   * @returns {*}
   * @private
   */
  _match: function(pattern) {
    pattern.lastIndex = this._current;
    var match = pattern.exec(this._code);
    return match;
  },
  /**
   * 词法分析 传入字符串
   * @param code
   * @returns {TokenStream}
   */
  tokenize: function(code) {
    var linePos = [], codeLength,
        tokenStart = this._regexps["lex_tokens"];
    this._code = code = code.replace(LINE, "\\n");
    this._current = 0;
    this._tokens = [];
    codeLength = code.length;

    //获取行数
    code.replace(/\\n/g, function(item, position) {
      linePos.push(position);
      return item;
    });
    this._linePos = linePos;

    var match;
    //循环匹配标记开始
    while ((match = this._match(tokenStart))) {
      //第二个参数是是否trim空字符串
      this._lexText(match.index, match[2]);
      this._moveCur(tokenStart.lastIndex);
      switch (match[1].trim()) {
        case this._options["var"][0]:
          this._lexVar();
          break; 
        case this._options["block"][0]:
          this._lexBlock();
          break;
      }
    }
    //如果所有token都结束了但游标还<模板长度,则继续处理text
    if (this._current < codeLength) {
      this._lexText(codeLength);
    };
    //添加END_TYPE
    this.pushToken(Token.END_TYPE, "");
    return new TokenStream(this._tokens);
  },
  /**
   * 增加一个token
   * @param type
   * @param value
   * @returns {*}
   */
  pushToken: function(type, value) {
    var token = new Token(type, value, this._lineNo);
    this._tokens.push(token);
    return this;
  }
}