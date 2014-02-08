var fs = require("fs");
var code = fs.readFileSync("./test.html", { "encoding": "utf8" });

var Template = require("./environment").Template;
var result = new Template().render(
  code,
  {
    title: "I'm title",
    name: "I'm name"
  }
);
console.log(result);