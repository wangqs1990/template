var fs = require("fs");
var code = fs.readFileSync("./test.html", { "encoding": "utf8" });

var Environment = require("./environment");
var env = new Environment();

var context = new function(){
  this.title = "I'm title";
  this.name = "I'm name";
  this._scope_ = {};

  this.get = function(name){
    if (this["_iter_"]) {
      //先搜索scope再搜索本地
      return this._scope_[name]||this[name]||"";
    } else {
      return this[name] || "";
    }
  }
}
var source = env.compileSource(code);
fs.writeFileSync("./out.html", source, {"encoding": "utf8"});
console.log(source);
var fun = new Function("context", source)

console.log(fun(context));
