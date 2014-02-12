"use strict";
var util = require('util');
function Node(nodes, attributes, line) {
  this.nodes = nodes;
  this.attributes = attributes;
  this.line = line;
}
//数组
function ArrayNode(items, line) {
  Node.call(this, items, {}, line);
}
ArrayNode.prototype = {
  constructor: ArrayNode,
  name: "array",
  compile: function(compiler) {
    var i, len, first = true, items = this.nodes;
    compiler.raw("[")
    for (i = 0, len = items.length; i < len; i++) {
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
function Attribute(node, expr, line) {
  Node.call(this,{"node": node, "expr": expr}, {}, line);
}
Attribute.prototype = {
  constructor: Attribute,
  name: "attribute",
  compile: function(compiler) {
    compiler
      .subcompile(this.nodes["node"])
      .raw("[")
      .subcompile(this.nodes["expr"])
      .raw("]");
  }
};

//常量: 数字, 布尔, 字符串
function Const(value, type, line) {
  Node.call(this, {}, {"value": value, "type": type}, line);
}

Const.prototype = {
  constructor: Const,
  name: "const",
  compile: function(compiler) {
    if ( this.attributes["type"] !== 1 ) {
      compiler.raw(this.attributes["value"].toString())
    } else {
      compiler.string(this.attributes["value"]);
    }
  }
};

//字典 
function Dict(items, line) {
  Node.call(this, items, {}, line);
}

Dict.prototype = {
  constructor: Dict,
  name: "dict",
  compile: function(compiler) {
    var i, len, first = true, items = this.nodes;
    compiler.raw("{");
    for (i = 0, len = items.length; i < len; i = i + 2) {
      if (!first) {
        compiler.raw(",");
      } else {
        first = false;
      }
      compiler
        .subcompile(items[i])
        .raw(":")
        .subcompile(items[i + 1]);
    }
    compiler.raw("}");
  }
};

//For
function For(key, value, iter, body, line) {
  Node.call(this,{"iter": iter, "body": body}, {"key": key, "value": value }, line);
}

For.prototype = {
  constructor: For,
  name: "For",
  compile: function(compiler) {
    var attrs = this.attributes;
    //for循环
    compiler
      .write("_scope=context._pushScope(null,{_iter:true,_seq:")
      .subcompile(this.nodes["iter"])
      .raw("});");
    if (!attrs.key) {
      compiler
        .write("for(_scope._iter_key=0,_scope._iter_len=_scope._seq.length;")
        .raw("_scope._iter_key<_scope._iter_len;_scope._iter_key++){")
        .indent()
        .write("context.set(\"" + attrs.value + "\",_scope._seq[_scope._iter_key]);");
    } else {
      //for in 循环
      compiler
        .write("for(_scope._iter_key in _scope._seq){")
        .indent()
        .write("context.set(\"" + attrs.key + "\",_scope._iter_key);")
        .write("context.set(\"" + attrs.value + "\",_scope._seq[_scope._iter_key]);");
    }
    compiler
      .subcompile(this.nodes["body"])
      .outdent()
      .write("}")
      .write("_scope=context._popScope();\n");
  }
};

//If
function If(nodes, line) {
  Node.call(this, nodes, {}, line);
}

If.prototype = {
  constructor: If,
  name: "if",
  compile: function(compiler) {
    var nodes = this.nodes,
        len = nodes.length,
        else_ = (len & 0x1) ? nodes[len - 1] : null;
    len--;
    for (var i = 0; i < len; i += 2) {
      compiler
        .raw( i === 0 ? "if(" : "else if(")
        .subcompile(nodes[i])
        .raw("){\n")
        .subcompile(nodes[i + 1], true)
        .raw("}");
    }

    if (else_) {
      compiler
        .raw("else {\n")
        .subcompile(else_, true)
        .raw("}");
    }
  }
};

//变量名
function Name(value, line) {
  Node.call(this, {}, {"value": value}, line);
}

Name.prototype = {
  constructor: Name,
  name: "name",
  compile: function(compiler) {
    compiler.raw("context.get(\"" + this.attributes["value"] + "\")");
  }
};

//输出变量
function Output(expr, line) {
  Node.call(this, {"expr": expr}, {}, line);
}

Output.prototype = {
  constructor: Output,
  name: "output",
  compile: function(compiler) {
    compiler
      .addIndent()
      .outStart()
      .subcompile(this.nodes["expr"])
      .raw(";\n");
  }
};

//输出文本
function Text(value, line) {
  Node.call(this, {}, {"value": value}, line);
}

Text.prototype = {
  constructor: Text,
  name: "text",
  compile: function(compiler) {
    compiler
      .addIndent()
      .outStart()
      .string(this.attributes["value"])
      .raw(";\n");
  }
};

function Tuple(items, line) {
  Node.call(this, items, {}, line);
}

Tuple.prototype = {
  constructor: Tuple,
  name: "tuple",
  compile: function(compiler) {

  }
};

//最后输出的模板
function Template(nodes, line) {
  Node.call(this, nodes, {}, line);
}

Template.prototype = {
  constructor: Template,
  name: "template",
  compile: function(compiler) {
    var nodes = this.nodes;
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

//二元运算符基类
function BinaryExpression(left, right, line) {
  Node.call(this, {"left": left, "right": right}, {}, line);
}

BinaryExpression.prototype = {
  constructor: BinaryExpression,
  compile: function(compiler) {
    this.nodes["left"].compile(compiler);
    compiler.raw(this.attributes["operator"]);
    this.nodes["right"].compile(compiler);
  }
};

//一元运算符基类
function UnaryExpression(node, line) {
  Node.call(this, {"node": node}, {}, line);
}

UnaryExpression.prototype = {
  constructor: UnaryExpression,
  compile: function(compiler) {
    compiler.raw(this.attributes["operator"]);
    this.nodes["node"].compile(compiler);
  }
};

//二元运算符
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
  },
  {
    "operator": ">",
    "name": "Greater"
  },
  {
    "operator": ">=",
    "name": "GreaterEqual"
  },
  {
    "operator": "<",
    "name": "Less"
  },
  {
    "operator": "<=",
    "name": "LessEqual"
  },
  {
    "operator": "===",
    "name": "Equal"
  },
  {
    "operator": "!==",
    "name": "NotEqual"
  }
].forEach(
  function(item) {
    function Node(left, right, line) {
      BinaryExpression.call(this, left, right, line);
      this.attributes["operator"] = item.operator;
    }
    util.inherits(Node, BinaryExpression);
    Node.prototype["name"] = item.name;
    module.exports[item.name] = Node;
  }
);

//一元运算符
[
  {
    "operator": "not",
    "name": "Not"
  },
  {
    "operator": "-",
    "name": "Neg"
  }
].forEach(
  function(item) {
    function Node(node, line) {
      UnaryExpression.call(this, node, line);
      this.attributes["operator"] = item.operator;
    }
    util.inherits(Node, UnaryExpression);
    Node.prototype["name"] = item.name;
    module.exports[item.name] = Node;
  }
);