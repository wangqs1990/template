var BaseLoader = function () {

};

BaseLoader.prototype = {
  constructor: BaseLoader,
  load: function (templateName) {
    return this.getSource(templateName);
  },
  getSource: function (name) {
    return name;
  }
};

module.exports = {
  BaseLoader: BaseLoader
}