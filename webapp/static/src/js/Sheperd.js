const introJs = require("intro.js");

export default class Sheperd {
  static init() {
    this.intro = introJs();

    var promise = new Promise(function(resolve, reject) {
      var xmlhttp = new XMLHttpRequest();
      xmlhttp.onloadend = function() {
        if (this.readyState == 4 && this.status == 200) {
          var responseJSON = JSON.parse(this.responseText);
          Sheperd.intro.setOptions(responseJSON);
          resolve();
        } else {
          reject();
        }
      };
      xmlhttp.open("GET", "/resources/sheperd.json", true);
      xmlhttp.setRequestHeader("Content-Type", "application/json");
      xmlhttp.send();
    });

    return promise;
  }

  static start() {
    this.intro.start();
  }
}
