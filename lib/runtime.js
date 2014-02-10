"use strict";
var Context = function (root, parent, env) {
  this._socpe = root ? [root]: [];
  this._parent = parent;
  this._env = env;
};

Context.prototype = {
  constructor: Context,
  /**
   * 获取当前scope的key对应的值
   * @param name
   * @returns {*}
   */
  get: function(name) {
    var length = this._socpe.length, value;
    if (length) {
      //搜索scope
      for (var i = length; i ; i--) {
        value = this._socpe[i - 1][name];
        if (value) {
          return typeof value === "function" ? value.call(context, name): value;
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
    var nameSplit = name.split("."), scope;
    if (root) {
      scope = this._socpe[0];
    } else {
      scope = this._socpe[this._socpe.length - 1];
    }
    if (nameSplit > 1) {
      for (var i = 0, length = nameSplit.length - 1; i < length; i++) {
        scope = scope[nameSplit[i]];
      }
      name = nameSplit[length];
    }
    scope[name] = value;
  },
  _pushScope: function (init) {
    var scope = init || {};
    this._socpe.push(scope);
    return scope;
  },
  _popScope: function (){
    this._socpe.pop();
    return this._socpe[this._socpe.length - 1];
  },
  getScope: function () {
    return this._socpe[this._socpe.length - 1];
  }
};

module.exports = {
  Context: Context
};