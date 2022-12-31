import Scene_Base from "./Scene_Base.js";
import ImageManager from "../rpg_managers/ImageManager.js";
import AudioManager from "../rpg_managers/AudioManager.js";
import SceneManager from "../rpg_managers/SceneManager.js";
import Input from "../rpg_core/Input.js";
import TouchInput from "../rpg_core/TouchInput.js";
import Sprite from "../rpg_core/Sprite.js";
import Scene_Title from "../rpg_scenes/Scene_Title.js";

//-----------------------------------------------------------------------------
// Scene_Gameover
//
// The scene class of the game over screen.

class Scene_Gameover extends Scene_Base {
  constructor(...args) {
    super(...args);
    this.initialize(...args);
  }

  initialize() {
    super.initialize();
  }

  create() {
    super.create();
    this.playGameoverMusic();
    this.createBackground();
  }

  start() {
    super.start();
    this.startFadeIn(this.slowFadeSpeed(), false);
  }

  update() {
    if (this.isActive() && !this.isBusy() && this.isTriggered()) {
      this.gotoTitle();
    }
    super.update();
  }

  stop() {
    super.stop();
    this.fadeOutAll();
  }

  terminate() {
    super.terminate();
    AudioManager.stopAll();
  }

  playGameoverMusic() {
    AudioManager.stopBgm();
    AudioManager.stopBgs();
    AudioManager.playMe(self.$dataSystem.gameoverMe);
  }

  createBackground() {
    this._backSprite = new Sprite();
    this._backSprite.bitmap = ImageManager.loadSystem("GameOver");
    this.addChild(this._backSprite);
  }

  isTriggered() {
    return Input.isTriggered("ok") || TouchInput.isTriggered();
  }

  gotoTitle() {
    SceneManager.goto(Scene_Title);
  }
}

export default Scene_Gameover;
