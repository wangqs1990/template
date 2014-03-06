"use strict";
var Parser = require("../lib/parser");
var Lexer = require("../lib/lexer");
var nodes = require("../lib/nodes");
var defaultParser = new Parser();
var lexer = new Lexer();

describe("parser suite with default parser", function() {
  //parse text
  it("only text", function() {
    var text = "only text";
    var node = defaultParser.parse(lexer.tokenize(text));
    expect(node instanceof nodes.Module).toBe(true);
    node = node.nodes["body"]
    expect(node instanceof nodes.Body).toBe(true);
    node = node.nodes[0];
    expect(node instanceof nodes.Text).toBe(true);
    expect(node.attributes["value"]).toBe("only text");
  });
});

describe("parse Expression", function() {
  //parse expression
  it("parse {{a+b}}", function() {
    var text = "{{a+b}}";
    var node = defaultParser.parse(lexer.tokenize(text));
    node = node.nodes["body"].nodes[0];
    expect(node instanceof nodes.Output).toBe(true);
    node = node.nodes["expr"];
    expect(node instanceof nodes.Binary).toBe(true);
    expect(node.attributes["operator"]).toBe("+");
    expect(node.nodes["left"] instanceof nodes.Name).toBe(true);
    expect(node.nodes["right"] instanceof nodes.Name).toBe(true);
  });
});

describe("parse Array", function() {
  it("{{[1,2,3,4,5]}}", function() {
    var text = "{{[1,2,3,4,5]}}";
    var node = defaultParser.parse(lexer.tokenize(text));
    node = node.nodes["body"].nodes[0].nodes["expr"];
    expect(node instanceof nodes.Array).toBe(true);
    expect(node.nodes.length).toBe(5, "array item should be 5");
    node.nodes.forEach(function(item) {
      expect(item instanceof nodes.Const).toBe(true);
    });
  });

  it("{{[a,b,\"c\"]}}", function() {
    var text = "{{[a,b,\"c\"]}}";
    var node = defaultParser.parse(lexer.tokenize(text));
    node = node.nodes["body"].nodes[0].nodes["expr"];
    expect(node instanceof nodes.Array).toBe(true);
    expect(node.nodes.length).toBe(3, "array item should be 3");
    expect(node.nodes[0] instanceof nodes.Name).toBe(true);
    expect(node.nodes[1] instanceof nodes.Name).toBe(true);
    expect(node.nodes[2] instanceof nodes.Const).toBe(true);
  })
});