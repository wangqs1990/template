"use strict";
function Compiler(env) {
  this.source = "";
  this.outVar = "$_out_";
  this._step = 0;
}

Compiler.prototype = {
  constructor: Compiler,
  /**
   * 编译模板, node是一个Template的节点
   * @param node
   * @returns {*}
   */
  compile: function(node) {
    this.raw("var "+ this.outVar + "=\"\";");
    node.compile(this);
    this.raw("return " + this.outVar + ";");
    return this;
  },
  subcompile: function(node, indent) {
    if (indent) {
      this.addIndent();
    }
    node.compile(this);
    return this;
  },
  /**
   * 换行输出
   * @param str
   * @returns {*}
   */
  write: function(str) {
    this.source += "\n";
    this.addIndent();
    this.source += str;
    return this;
  },
  /**
   * 直接输出
   * @param str
   * @returns {*}
   */
  raw: function(str) {
    this.source += str;
    return this;
  },
  /**
   * 添加到最后返回的变量, 别忘了";"
   * @returns {*}
   */
  outStart: function() {
    this.source += this.outVar + "+=";
    return this;
  },
  /**
   * 输出string
   * @param str
   * @returns {*}
   */
  string: function(str) {
    this.source += "\"" + str.replace(/([\"\'])/g, "\\$1") + "\"";
    return this;
  },
  addIndent: function() {
    var indention = "";
    for(var i = 0; i < this._step; i++){
      indention += "  ";
    }
    this.source += indention;
    return this;
  },
  indent: function() {
    this._step += 1;
    return this;
  },
  outdent: function() {
    this._step -= 1;
    return this;
  },
  //添加匿名函数
  anonymousFuncStart: function() {
    this.source += "(function(context){\n";
    return this;
  },
  anonymousFuncEnd: function() {
    this.source += + "})(context);\n";
    return this;
  }
}

module.exports = Compiler;