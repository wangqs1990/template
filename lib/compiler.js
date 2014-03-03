"use strict";
function Compiler(env) {
  this.source = "";
  this.outVar = "_out";
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
    this.source = "";
    this._step = 0;
    node.compile(this);
    return this;
  },
  subcompile: function(node, indent) {
    if (indent) {
      this.indent();
      node.compile(this);
      this.outdent();
      return this;
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
  outFuncStart: function(name) {
    return this
              .write("this." + name + "=function(context){\n")
              .write("var " + this.outVar + "=\"\",_scope=context.getScope();\n");
  },
  outFuncEnd: function() {
    return this
              .write("return " + this.outVar + ";\n")
              .write("}\n");
  },
  //添加匿名函数
  anonymousFuncStart: function() {
    this.source += "(function(context){\n";
    return this.indent();
  },
  anonymousFuncEnd: function() {
    this.source += "}).call(this, context);\n";
    return this.outdent();
  }
}

module.exports = Compiler;