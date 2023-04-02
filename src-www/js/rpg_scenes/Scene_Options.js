import Scene_MenuBase from './Scene_MenuBase.js';
import Window_Options from '../rpg_windows/Window_Options.js';
import ConfigManager from '../rpg_managers/ConfigManager.js';

//-----------------------------------------------------------------------------
// Scene_Options
//
// The scene class of the options screen.

class Scene_Options extends Scene_MenuBase {
	constructor(...args) {
		super(...args);
		this.initialize(...args);
	}

	initialize() {
		super.initialize();
	}

	create() {
		super.create();
		this.createOptionsWindow();
	}

	terminate() {
		super.terminate();
		ConfigManager.save();
	}

	createOptionsWindow() {
		this._optionsWindow = new Window_Options();
		this._optionsWindow.setHandler('cancel', this.popScene.bind(this));
		this.addWindow(this._optionsWindow);
	}
}

export default Scene_Options;
