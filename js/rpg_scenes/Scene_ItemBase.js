import Scene_MenuBase from "./Scene_MenuBase.js";
import Graphics from "../rpg_core/Graphics.js";
import SoundManager from "../rpg_managers/SoundManager.js";
import SceneManager from "../rpg_managers/SceneManager.js";
import Window_MenuActor from "../rpg_windows/Window_MenuActor.js";
import Game_Action from "../rpg_objects/Game_Action.js";
import Scene_Map from "../rpg_scenes/Scene_Map.js";

//-----------------------------------------------------------------------------
// Scene_ItemBase
//
// The superclass of Scene_Item and Scene_Skill.

class Scene_ItemBase extends Scene_MenuBase {
  constructor(...args) {
    super(...args);
    this.initialize(...args);
  }

  initialize() {
    super.initialize();
  }

  create() {
    super.create();
  }

  createActorWindow() {
    this._actorWindow = new Window_MenuActor();
    this._actorWindow.setHandler("ok", this.onActorOk.bind(this));
    this._actorWindow.setHandler("cancel", this.onActorCancel.bind(this));
    this.addWindow(this._actorWindow);
  }

  item() {
    return this._itemWindow.item();
  }

  user() {
    return null;
  }

  isCursorLeft() {
    return this._itemWindow.index() % 2 === 0;
  }

  showSubWindow(window) {
    window.x = this.isCursorLeft() ? Graphics.boxWidth - window.width : 0;
    window.show();
    window.activate();
  }

  hideSubWindow(window) {
    window.hide();
    window.deactivate();
    this.activateItemWindow();
  }

  onActorOk() {
    if (this.canUse()) {
      this.useItem();
    } else {
      SoundManager.playBuzzer();
    }
  }

  onActorCancel() {
    this.hideSubWindow(this._actorWindow);
  }

  action() {
    const action = new Game_Action(this.user());
    action.setItemObject(this.item());
    return action;
  }

  determineItem() {
    const action = this.action();
    if (action.isForFriend()) {
      this.showSubWindow(this._actorWindow);
      this._actorWindow.selectForItem(this.item());
    } else {
      this.useItem();
      this.activateItemWindow();
    }
  }

  useItem() {
    this.playSeForItem();
    this.user().useItem(this.item());
    this.applyItem();
    this.checkCommonEvent();
    this.checkGameover();
    this._actorWindow.refresh();
  }

  activateItemWindow() {
    this._itemWindow.refresh();
    this._itemWindow.activate();
  }

  itemTargetActors() {
    const action = this.action();
    if (!action.isForFriend()) {
      return [];
    } else if (action.isForAll()) {
      return self.$gameParty.members();
    } else {
      return [self.$gameParty.members()[this._actorWindow.index()]];
    }
  }

  canUse() {
    const user = this.user();
    if (user) {
      return user.canUse(this.item()) && this.isItemEffectsValid();
    }
    return false;
  }

  isItemEffectsValid() {
    const action = this.action();
    return this.itemTargetActors().some(
      (target) => action.testApply(target),
      this
    );
  }

  applyItem() {
    const action = this.action();
    const targets = this.itemTargetActors();
    targets.forEach((battler) => {
      const repeats = action.numRepeats();
      for (let i = 0; i < repeats; i++) {
        action.apply(battler);
      }
    });
    action.applyGlobal();
  }

  checkCommonEvent() {
    if (self.$gameTemp.isCommonEventReserved()) {
      SceneManager.goto(Scene_Map);
    }
  }
}

export default Scene_ItemBase;
