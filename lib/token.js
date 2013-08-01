var Token = function(type, value, line){
  this.type = type;
  this.value = value;
  this.line = line;
};

Token.END_TYPE = 0;
Token.TEXT_TYPE = 1;
Token.VAR_START_TYPE = 2;
Token.VAR_END_TYPE = 3;
Token.BLOCK_START_TYPE = 4;
Token.BLOCK_END_TYPE = 5;
Token.NAME_TYPE = 6;
Token.STRING_TYPE = 7;
Token.NUMBER_TYPE = 8;
Token.OPERATOR_TYPE = 9;
Token.PUNCTUATION_TYPE = 10;

Token.prototype = {
  constructor: Token,
  test: function(type, value){
    return (type === this.type) && (value ? value === this.value : true);
  }
};

var TokenStream = function(tokens){
  this._tokens = tokens;
  this._current = 0;
}

TokenStream.prototype = {
  constructor: TokenStream,
  getCurrent: function(){
    return this._tokens[this._current];
  },
  next: function(){
    this._current++;
    if(!this._tokens[this._current]){
      throw Error("TokenStream End");
    }
    return this._tokens[this._current];
  },
  except: function(type, value){
    var token = this._tokens[this._current];
    if(!token.test(type, value)){
      throw Error("TokenStream Except Error");
    }else{
      this.next();
      return token;
    }
  },
  next_if: function(type, value){
    if(this._tokens[this._current].test(type, value)){
      return this.next();
    }
  },
  isEnd: function(){
    return this._tokens[this._current].test(Token.END_TYPE);
  }
}   
exports.Token = Token;
exports.TokenStream = TokenStream;