"use strict";
var Context = function(root, scope, parent) {
  this._vars = root ? [root] : [{}];
  this._scope = scope ? [scope] : [];
  this._parent = parent;
};

Context.prototype = {
  constructor: Context,
  /**
   * 获取当前scope的key对应的值
   * @param name
   * @returns {*}
   */
  get: function(name) {
    var length = this._vars.length, value;
    if (length) {
      //搜索scope
      for (var i = length; i ; i--) {
        value = this._vars[i - 1][name];
        if (value) {
          return typeof value === "function" ? value.call(this, name): value;
        }
      }
    }
    return "";
  },
  /**
   * 设置key与value, 第三个参数设置是否是第一层
   * @param name
   * @param value
   * @param root
   */
  set: function(name, value, root) {
    var nameSplit = name.split("."), vars;
    if (root) {
      vars = this._vars[0];
    } else {
      vars = this._vars[this._vars.length - 1];
    }
    if (nameSplit > 1) {
      for (var i = 0, length = nameSplit.length - 1; i < length; i++) {
        vars = vars[nameSplit[i]];
      }
      name = nameSplit[length];
    }
    vars[name] = value;
  },
  /**
   * 使用scope来模拟运行栈
   * @param vars
   * @param scope
   * @returns {*|{}}
   * @private
   */
  _pushScope: function(vars, scope) {
    var scope = scope || {};
    this._scope.push(scope);
    this._vars.push(vars || {});
    return scope;
  },
  _popScope: function() {
    this._scope.pop();
    this._vars.pop();
    return this._scope[this._scope.length - 1];
  },
  getScope: function() {
    return this._scope[this._scope.length - 1];
  }
};

module.exports = {
  Context: Context
};