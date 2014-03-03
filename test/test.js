var Environment = require("../lib/environment").Environment;
var FileSystemLoader = require("../lib/loaders").FileSystemLoader;
var env = new Environment({
    loader: new FileSystemLoader("./")
});
var template = env.getTemplate("test.html");
require('fs').writeFileSync('./out.html', template.init.toString());
var result = template.render(
  {
    title: "I'm title",
    name: "I'm name"
  }
);
console.log(result);