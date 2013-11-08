//数组
function Array(item, lineNum){
    this.item = item;
    this.lineNum = lineNum;
}

Array.prototype = {
    constructor: Array,
    name: "array",
    compile: function(compiler){

    }
};

//常量: 数字, 布尔, 字符串
function Const(value, lineNum){
    this.value = value;
    this.lineNum = lineNum;
}

Const.prototype = {
    constructor: Const,
    name: "text",
    compile: function(compiler){

    }
};

//字典
function Dict(item, lineNum){
    this.item = item;    //[[key, value],...]
    this.lineNum = lineNum;
}

Dict.prototype = {
    constructor: Dict,
    name: "dict",
    compile: function(compiler){

    }
};

//变量名
function Name(value, lineNum){
    this.value = value;
    this.lineNum = lineNum;
}

Name.prototype = {
    constructor: Name,
    name: "name",
    compile: function(compiler){

    }
};

//输出变量
function Output(value, lineNum){
    this.value = value;
    this.lineNum = lineNum;
}

Output.prototype = {
    constructor: Output,
    name: "print",
    compile: function(compiler){

    }
};

//输出文本
function Text(value, lineNum){
    this.value = value;
    this.lineNum = lineNum;
}

Text.prototype = {
    constructor: Text,
    name: "text",
    compile: function(compiler){

    }
};

//最后输出的模板
function Template(value, lineNum){
    this.value = value;
    this.lineNum = lineNum;
}

Template.prototype = {
    constructor: Template,
    name: "template",
    compile: function(compiler){

    }
};

module.exports = {
    "Array": Array,
    "Const": Const,
    "Dict": Dict,
    "Name": Name,
    "Output": Output,
    "Text": Text,
    "Template": Template
};