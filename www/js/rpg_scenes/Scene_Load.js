import Scene_File from "./Scene_File.js";
import Scene_Map from "./Scene_Map.js";
import { DataManager } from "../rpg_managers/DataManager.js";
import SoundManager from "../rpg_managers/SoundManager.js";
import TextManager from "../rpg_managers/TextManager.js";
import SceneManager from "../rpg_managers/SceneManager.js";

//-----------------------------------------------------------------------------
// Scene_Load
//
// The scene class of the load screen.

class Scene_Load extends Scene_File {
  constructor(...args) {
    super(...args);
    this.initialize(...args);
  }

  initialize() {
    super.initialize();
    this._loadSuccess = false;
  }

  terminate() {
    super.terminate();
    if (this._loadSuccess) {
      self.$gameSystem.onAfterLoad();
    }
  }

  mode() {
    return "load";
  }

  helpWindowText() {
    return TextManager.loadMessage;
  }

  firstSavefileIndex() {
    return DataManager.latestSavefileId() - 1;
  }

  onSavefileOk() {
    super.onSavefileOk();
    if (DataManager.loadGame(this.savefileId())) {
      this.onLoadSuccess();
    } else {
      this.onLoadFailure();
    }
  }

  onLoadSuccess() {
    SoundManager.playLoad();
    this.fadeOutAll();
    this.reloadMapIfUpdated();
    SceneManager.goto(Scene_Map);
    this._loadSuccess = true;
  }

  onLoadFailure() {
    SoundManager.playBuzzer();
    this.activateListWindow();
  }

  reloadMapIfUpdated() {
    if (self.$gameSystem.versionId() !== self.$dataSystem.versionId) {
      self.$gamePlayer.reserveTransfer(
        self.$gameMap.mapId(),
        self.$gamePlayer.x,
        self.$gamePlayer.y
      );
      self.$gamePlayer.requestMapReload();
    }
  }
}

export default Scene_Load;
