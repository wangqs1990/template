"use strict";
var util = require('util');
//数组
function ArrayNode(items, line) {
  this.items = items;
  this.line = line;
}
ArrayNode.prototype = {
  constructor: ArrayNode,
  name: "array",
  compile: function(compiler) {
    var i, len, first = true, items = this.items;
    compiler.raw("[")
    for (i = 0, len = items.length; i < len; i++){
      if (!first) {
        compiler.raw(",");
      } else {
        first = false;
      }
      items[i].compile(compiler);
    }
    compiler.raw("]");
  }
};

//对象属性
function Attribute(node, attr, line) {
  this.node = node;
  this.attr = attr;
  this.line = line;
}
Attribute.prototype = {
  constructor: Attribute,
  name: "attribute",
  compile: function(compiler) {
    compiler
      .subcompile(this.node)
      .raw("[")
      .subcompile(this.attr)
      .raw("]");
  }
};

//常量: 数字, 布尔, 字符串
function Const(value, type, line) {
  this.value = value;
  this.type = type;
  this.line = line;
}

Const.prototype = {
  constructor: Const,
  name: "const",
  compile: function(compiler) {
    if ( this.type !== 1 ) {
      compiler.raw(this.value.toString())
    } else {
      compiler.string(this.value);
    }
  }
};

//字典 
function Dict(items, line) {
  this.items = items;    //[[key, value],...]
  this.line = line;
}

Dict.prototype = {
  constructor: Dict,
  name: "dict",
  compile: function(compiler) {
    var i, len, first = true, items = this.items;
    compiler.raw("{");
    for (i = 0, len = items.length; i < len; i++){
      if (!first) {
        compiler.raw(",");
      } else {
        first = false;
      }
      compiler.subcompile(items[i][0])
        .raw(":")
        .subcompile(items[i][1]);
    }
    compiler.raw("}");
  }
};

//For
function For(key, value, iter, body, line) {
  this.key = key;
  this.value = value;
  this.iter = iter;
  this.body = body;
  this.line = line;
}

For.prototype = {
  constructor: For,
  name: "For",
  compile: function(compiler) {
    //for循环
    compiler
      .write("var _socpe_=context._pushScope({loop:{index:0},_iter_:true,_seq_:")
      .subcompile(this.iter)
      .raw("});");
    if (!this.key) {
      compiler
        .write("for(_socpe_._iter_key_=0,_socpe_.loop.length=_socpe_._seq_.length;")
        .raw("_socpe_._iter_key_<_socpe_.loop.length;")
        .raw("_socpe_._iter_key_++){")
        .indent()
        .write("_socpe_." + this.value)
        .raw("=_socpe_._seq_[_socpe_._iter_key_];\n")
    } else {
      //for in 循环
      compiler
        .write("for(_socpe_._iter_key_ in _socpe_._seq_){")
        .indent()
        .write("_socpe_.loop.index++;context.set(\"" + this.key + "\",_socpe_._iter_key_);")
        .write("context.set(\"" + this.value + "\",_socpe_._seq_[_socpe_._iter_key_]);\n");
    }
    compiler
      .subcompile(this.body)
      .outdent()
      .write("}")
      .write("_socpe_=context._popScope();\n");
  }
};

//If
function If(expr, body, else_, line) {
  this.expr = expr;
  this.body = body;
  this.else_ = else_;
  this.line = line;
}

If.prototype = {
  constructor: If,
  name: "if",
  compile: function(compiler) {
    compiler
      .raw("if(")
      .subcompile(this.expr)
      .raw("){\n")
      .indent()
      .subcompile(this.body)
      .outdent()
      .raw("}");
    if (!this.else_) {
      return;
    }
    if (this.else_.name === "if") {
      compiler
        .raw("else ")
        .subcompile(this.else_);
    } else {
      compiler
        .raw("else{\n")
        .indent()
        .subcompile(this.else_)
        .outdent()
        .raw("}\n");
    }
  }
};

//变量名
function Name(value, line) {
  this.value = value;
  this.line = line;
}

Name.prototype = {
  constructor: Name,
  name: "name",
  compile: function(compiler) {
    compiler.raw("context.get(\"" + this.value + "\")");
  }
};

//输出变量
function Output(expr, line) {
  this.expr = expr;
  this.line = line;
}

Output.prototype = {
  constructor: Output,
  name: "output",
  compile: function(compiler) {
    compiler
      .addIndent()
      .outStart()
      .subcompile(this.expr)
      .raw(";");
  }
};

//输出文本
function Text(value, line) {
  this.value = value;
  this.line = line;
}

Text.prototype = {
  constructor: Text,
  name: "text",
  compile: function(compiler) {
    compiler
      .addIndent()
      .outStart()
      .string(this.value)
      .raw(";\n");
  }
};

function Tuple(items, line) {
  this.items = items;
  this.line = line;
}

Tuple.prototype = {
  constructor: Tuple,
  name: "tuple",
  compile: function(compiler) {

  }
};

//最后输出的模板
function Template(nodes, line) {
  this.value = nodes;
  this.line = line;
}

Template.prototype = {
  constructor: Template,
  name: "template",
  compile: function(compiler) {
    var nodes = this.value;
    for (var i = 0, len = nodes.length; i < len ; i++ ) {
      nodes[i].compile(compiler);
    }
  }
};

module.exports = {
  "Array": ArrayNode,
  "Attribute": Attribute,
  "Const": Const,
  "Dict": Dict,
  "If": If,
  "For": For,
  "Name": Name,
  "Output": Output,
  "Text": Text,
  "Tuple": Tuple,
  "Template": Template
};

function BinaryExpression(left, right, line) {
  this._left = left;
  this._right = right;
  this.line = line;
  this._operator = undefined;
}

BinaryExpression.prototype = {
  constructor: BinaryExpression,
  compile: function(compiler) {
    this._left.compile(compiler);
    compiler.raw(this._operator);
    this._right.compile(compiler);
  }
};

[
  {
    "operator": "&&",
    "name": "And"
  },
  {
    "operator": "||",
    "name": "Or"
  },
  {
    "operator": "+",
    "name": "Add"
  },
  {
    "operator": "-",
    "name": "Sub"
  },
  {
    "operator": "*",
    "name": "Mul"
  },
  {
    "operator": "/",
    "name": "Div"
  },
  {
    "operator": "%",
    "name": "Mod"
  }
].forEach(
  function(item){
    function Node(left, right, line) {
      BinaryExpression.call(this, left, right, line);
      this._operator = item.operator;
    }
    util.inherits(Node, BinaryExpression);
    module.exports[item.name] = Node;
  }
);
