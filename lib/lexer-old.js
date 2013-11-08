var REGEX_NAME            = /^([a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*)/g,
  REGEX_NUMBER          = /^([0-9]+(?:\.[0-9]+)?)/g,
  REGEX_STRING          = /^\".*?\"|^\'.*?\'/g,
  PUNCTUATION           = '([{)]}?:.',
  LINE                  = /(?:\r\n)|\n|\r/g;

var Token = require("./token").Token;
var TokenStream = require("./token").TokenStream;
var Lexer = module.exports = function(options){
  this._options = {
    "var":["{{", "}}"],
    "block":["{%", "%}"],
    "whitespace_trim": "-"
  };

  this._regexps = {
    "lex_var": new RegExp("^\\s*" + this._options["var"][1] , "g"),
    "lex_block": new RegExp("^\\s*" + this._options["block"][1], "g"),
    "lex_tokens": new RegExp("(?:(" + this._options["var"][0] + ")(.*?)" + this._options["var"][1] +
      ")|(?:(" + this._options["block"][0] + ")(.*?)" + this._options["block"][1] + ")", "g")
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
  _moveCur: function (length) {
    this._current += length;
    while (this._current > this._linePos[this._lineNo-1]) {
      this._lineNo ++;
    }
  },
  _lexText: function (position) {
    var text = this._code.slice(this._current, position);
    this.pushToken(Token.TEXT_TYPE, text);
    this._moveCur(position - this._current);
  },
  _lexVar: function (variable) {
    this._lexExpr(variable);
    this.pushToken(Token.VAR_END_TYPE, "");
    this._moveCur(this._options["var"][1].length);
  },
  _lexBlock: function (block) {
    this._lexExpr(block);
    this.pushToken(Token.BLOCK_END_TYPE, "");
    this._moveCur(this._options["block"][1].length);
  },
  _lexExpr: function (expr) {
    var match, punIndex, curChar, bracket, brackets=[];
    function getMatch(item, value) {
      match = item;
      return "";
    }
    while (expr) {
      match = null;
      expr = expr.replace(/^(\s+)/g, getMatch);
      if (match) {
        this._moveCur(match.length);
        continue;
      }
      // operators 先解析操作符, 因为操作符有and or not
      expr = expr.replace(/^(\+|\,)/g, getMatch);
      if (match) {
        this.pushToken(Token.OPERATOR_TYPE, match);
        this._moveCur(match.length);
        continue;
      }
      //variables
      expr = expr.replace(REGEX_NAME, getMatch);
      if (match) {
        this.pushToken(Token.NAME_TYPE, match);
        this._moveCur(match.length);
        continue;
      }
      //numbers
      expr = expr.replace(REGEX_NUMBER, getMatch);
      if (match) {
        this.pushToken(Token.NUMBER_TYPE, match);
        this._moveCur(match.length);
        continue;
      }
      //string
      expr = expr.replace(REGEX_STRING, getMatch);
      if (match) {
        this.pushToken(Token.STRING_TYPE, match.slice(1, match.length-1));
        this._moveCur(match.length);
        continue;
      }
      //punctuation
      curChar = this._code[this._current];
      punIndex = PUNCTUATION.indexOf(curChar);
      if (punIndex > -1) {
        if (punIndex < 3) {
          brackets.push([curChar, punIndex]);
        }else if(punIndex < 6){
          bracket = brackets.pop();
          if (!bracket || punIndex-3 !== bracket[1]) {
            throw Error("Unexpected " + curChar);
          }
        }
        this.pushToken(Token.PUNCTUATOR_TYPE, curChar);
        expr = expr.slice(1);
        this._current++;
      }
    }
    //可能出现未匹配的括号
    if (brackets.length) {
      bracket = brackets.pop();
      throw Error("Unclosed " + bracket[0]);
    }
  },
  tokenize: function(code){
    var tokenPositions = [], linePos = [], codeLength = code.length;
    this._code = code = code.replace(LINE, "\\n");

    //获取行数
    code.replace(/\\n/g, function(item, position){
      linePos.push(position);
      return item;
    });
    this._linePos = linePos;

    //获取所有的token开始标记
    code.replace(this._regexps["lex_tokens"], function(item, variable, varExpr, block, blockExpr, position){
      if(variable){
        tokenPositions.push({ "token": [variable, varExpr], "pos": position});
      }else{
        tokenPositions.push({ "token": [block, blockExpr], "pos": position});
      }
      return item;
    });

    var tokenPos, token;
    for (var i = 0, length = tokenPositions.length; i < length; i++) {
      tokenPos = tokenPositions[i];
      if (tokenPos["pos"] > this._current) {
        this._lexText(tokenPos["pos"]);
      }
      token = tokenPos["token"];
      this._moveCur(token[0].length);
      switch (token[0]) {
        case this._options["var"][0]:
        this.pushToken(Token.VAR_START_TYPE, "");
        this._lexVar(token[1]);
        break;
      case this._options["block"][0]:
        this.pushToken(Token.BLOCK_START_TYPE, "");
        this._lexBlock(token[1]);
        break;
      }
    };
    //如果所有token都结束了但游标还<模板长度,则继续处理text
    if (this._current < codeLength) {
      this._lexText(codeLength);
    };
    //添加END_TYPE
    this.pushToken(Token.END_TYPE, "");
    return new TokenStream(this._tokens);
  },
  pushToken: function(type, value){
    var token = new Token(type, value, this._lineNo);
    this._tokens.push(token);
    return this;
  }
}