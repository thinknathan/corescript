import Scene_Base from "./Scene_Base.js";
import Window_Help from "../rpg_windows/Window_Help.js";
import Sprite from "../rpg_core/Sprite.js";
import SceneManager from "../rpg_managers/SceneManager.js";

//-----------------------------------------------------------------------------
// Scene_MenuBase
//
// The superclass of all the menu-type scenes.

class Scene_MenuBase extends Scene_Base {
	constructor(...args) {
		super(...args);
		this.initialize(...args);
	}

	initialize() {
		super.initialize();
	}

	create() {
		super.create();
		this.createBackground();
		this.updateActor();
		this.createWindowLayer();
	}

	actor() {
		return this._actor;
	}

	updateActor() {
		this._actor = self.$gameParty.menuActor();
	}

	createBackground() {
		this._backgroundSprite = new Sprite();
		this._backgroundSprite.bitmap = SceneManager.backgroundBitmap();
		this.addChild(this._backgroundSprite);
	}

	setBackgroundOpacity(opacity) {
		this._backgroundSprite.opacity = opacity;
	}

	createHelpWindow() {
		this._helpWindow = new Window_Help();
		this.addWindow(this._helpWindow);
	}

	nextActor() {
		self.$gameParty.makeMenuActorNext();
		this.updateActor();
		this.onActorChange();
	}

	previousActor() {
		self.$gameParty.makeMenuActorPrevious();
		this.updateActor();
		this.onActorChange();
	}

	onActorChange() {}
}

export default Scene_MenuBase;
