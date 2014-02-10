var fs = require("fs");
var code = fs.readFileSync("./test.html", { "encoding": "utf8" });
var env = new (require("./environment").Environment)();
var template = env.getTemplate(code);
var result = template.render(
  {
    title: "I'm title",
    name: "I'm name"
  }
);
console.log(result);