const intro = require("intro.js").introJs;
import introSteps from "./introSteps.js";

export default class Intro {
  static init() {
    this.intro = intro();
    this.intro.setOptions(introSteps);
    this.introButton = document.getElementById("introButton");
    this.introButton.onclick = this.startIntro.bind(this);
  }

  static startIntro() {
    this.intro.start();
  }
}
