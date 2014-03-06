
var runtime = require("../lib/runtime");
describe("context suite", function() {
  var testContext = new runtime.Context({"a":1});

  it("should be get 1", function() {
    expect(testContext.get("a")).toBe(1);
  });
  it("after push a scope with {\"a\": 2} context should be 2", function() {
    testContext._pushScope({"a":2},null);
    expect(testContext.get("a")).toBe(2);
  });
  it("after pop the scope context should be 1", function() {
    testContext._popScope();
    expect(testContext.get("a")).toBe(1);
  });
});