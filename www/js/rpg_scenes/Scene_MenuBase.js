import * as PIXI from '../libs/pixi-webworker.mjs';
import Scene_Base from './Scene_Base.js';
import Window_Help from '../rpg_windows/Window_Help.js';
import SceneManager from '../rpg_managers/SceneManager.js';
import Graphics from '../rpg_core/Graphics.js';

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
		// this._backgroundSprite = new Sprite();
		// this._backgroundSprite.bitmap = SceneManager.backgroundBitmap();
		this._backgroundSprite = new PIXI.Sprite(
			new PIXI.Texture(SceneManager.backgroundBitmap().baseTexture)
		);
		if (Graphics.isWebGL()) {
			const filter = new PIXI.filters.PixelateFilter(12, 12);
			this._backgroundSprite.filters = [filter];
			this._backgroundSprite.cacheAsBitmap = true;
		}
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
