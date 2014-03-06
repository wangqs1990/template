var Environment = require("../lib/environment").Environment;

describe("render suite", function() {
  var env = new Environment();
  /**
  * there is 2 ways for javascript object,
  * one is descript data like a hash table
  * in this condition should use string as the key,
  * it aslo descript a json object, when use this object
  * should use [] operator.
  * the other way is descript a javascript object.
  * in this condition should use the . operator,
  * it means that the object have this properity or method,
  * when you use reflection you can use [] operator
  */
  [
    {
      "tpl": "only text",
      "expect": "only text"
    },
    {
      "tpl": "{{1+1}}",
      "expect": "2"
    },
    {
      "tpl": "{{a+b-c}}",
      "expect": "0",
      "context": {
        "a": 1,
        "b": 2,
        "c": 3
      }
    },
    {
      "tpl": "{{a+b*c}}",
      "expect": "7",
      "context": {
        "a": 1,
        "b": 2,
        "c": 3
      }
    },
    {
      "tpl": "{%for i in a%}{{i}}{%endfor%}",
      "expect": "12345",
      "context": {
        "a": [1,2,3,4,5]
      }
    },
    {
      "tpl": "{%if false%}{{1}}{%elif false%}2{%else%}3{%endif%}",
      "expect": "3"
    },
    {
      "tpl": "{%for key,value in {\"a\":1, \"b\":2}%}{{key}}{{value}}{%endfor%}",
      "expect": "a1b2"
    }
  ].forEach(function(item) {
    it("render " + item["tpl"] + " should be " + item["expect"], function() {
      var t = env.getTemplate(item["tpl"]);
      expect(t.render(item["context"])).toBe(item["expect"]);
    });
  });
});