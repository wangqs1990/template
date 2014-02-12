var runtime = require("../lib/runtime");

var testContext = new runtime.Context({"a":1});

console.assert(testContext.get("a") === 1);

console.assert(testContext._pushScope({"a":2},null));

console.assert(testContext.get("a") === 2);

console.assert(testContext.get("a") === 1);