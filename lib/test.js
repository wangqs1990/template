var fs = require("fs");
var code = fs.readFileSync("./test.html", { "encoding": "utf8" });

var Environment = require("./environment");
var env = new Environment();

var context = new function(){
  this.title = "I'm title";
  this.name = "I'm name";
  this._scope_ = [{
    title: "I'm title",
    name: "I'm name"
  }];

  this.get = function(name) {
    var length = this._scope_.length, value;
    if (length) {
        for (var i = length; i ; i--) {
            value = this._scope_[i - 1][name];
            if (value) {
                return typeof value === "function" ? value.call(context, name): value;
            }
        }
    }
    return "";
  }
  this.set = function(name, value, root) {
    var nameSplit = name.split("."), obj, scope, length;
    if (root) {
        scope = this._scope_[0];
    } else {
        scope = this._scope_[this._scope_.length - 1];
    }
    if (nameSplit > 1) {
        for (var i = 0, length = nameSplit.length - 1; i < length; i++) {
            scope = scope[nameSplit[i]];
        };
        name = nameSplit[length];
    }
    scope[name] = value;
  }
  this._pushScope = function (init) {
    var scope = init || {};
    this._scope_.push(scope);
    return scope;
  }
  this._popScope = function (){
    this._scope_.pop();
    return this._scope_[this._scope_.length-1];
  }
  this.getScope = function () {
    return this._scope_[this._scope_.length-1];
  }
}
var source = env.compileSource(code);
fs.writeFileSync("./out.html", source, {"encoding": "utf8"});
console.log(source);
var fun = new Function("context", source)

console.log(fun(context));
