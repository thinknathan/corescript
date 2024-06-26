import Scene_Base from './Scene_Base.js';
import { DataManager } from '../rpg_managers/DataManager.js';
import ConfigManager from '../rpg_managers/ConfigManager.js';
import ImageManager from '../rpg_managers/ImageManager.js';
import SoundManager from '../rpg_managers/SoundManager.js';
import SceneManager from '../rpg_managers/SceneManager.js';
import Graphics from '../rpg_core/Graphics.js';
import Window_TitleCommand from '../rpg_windows/Window_TitleCommand.js';
import Scene_Title from '../rpg_scenes/Scene_Title.js';
import Scene_Map from '../rpg_scenes/Scene_Map.js';
import Scene_Battle from '../rpg_scenes/Scene_Battle.js';

//-----------------------------------------------------------------------------
// Scene_Boot
//
// The scene class for initializing the entire game.

class Scene_Boot extends Scene_Base {
	constructor(...args) {
		super(...args);
		this.initialize(...args);
	}

	initialize() {
		super.initialize();
		this._startDate = Date.now();
	}

	create() {
		super.create();
		DataManager.loadDatabase();
		DataManager.loadGlobalInfo();
		ConfigManager.load();
		this.loadSystemWindowImage();
	}

	loadSystemWindowImage() {
		ImageManager.reserveSystem('Window');
	}

	isReady() {
		if (Scene_Base.prototype.isReady.call(this)) {
			return (
				ConfigManager.isConfigLoaded() &&
				DataManager.isGlobalInfoLoaded() &&
				DataManager.isDatabaseLoaded() &&
				this.isGameFontLoaded()
			);
		} else {
			return false;
		}
	}

	isGameFontLoaded() {
		if (Graphics.isFontLoaded('GameFont')) {
			return true;
		} else if (!Graphics.canUseCssFontLoading()) {
			const elapsed = Date.now() - this._startDate;
			if (elapsed >= 60000) {
				throw new Error('Failed to load GameFont');
			}
		}
	}

	start() {
		super.start();
		SoundManager.preloadImportantSounds();
		if (DataManager.isBattleTest()) {
			DataManager.setupBattleTest();
			SceneManager.goto(Scene_Battle);
		} else if (DataManager.isEventTest()) {
			DataManager.setupEventTest();
			SceneManager.goto(Scene_Map);
		} else {
			this.checkPlayerLocation();
			DataManager.setupNewGame();
			SceneManager.goto(Scene_Title);
			Window_TitleCommand.initCommandPosition();
		}
		this.updateDocumentTitle();
	}

	updateDocumentTitle() {
		document.title = self.$dataSystem.gameTitle;
	}

	checkPlayerLocation() {
		if (self.$dataSystem.startMapId === 0) {
			throw new Error("Player's starting position is not set");
		}
	}

	static loadSystemImages() {
		ImageManager.reserveSystem('IconSet');
		ImageManager.reserveSystem('Balloon');
		ImageManager.reserveSystem('Shadow1');
		ImageManager.reserveSystem('Shadow2');
		ImageManager.reserveSystem('Damage');
		ImageManager.reserveSystem('States');
		ImageManager.reserveSystem('Weapons1');
		ImageManager.reserveSystem('Weapons2');
		ImageManager.reserveSystem('Weapons3');
		ImageManager.reserveSystem('ButtonSet');
	}
}

export default Scene_Boot;
