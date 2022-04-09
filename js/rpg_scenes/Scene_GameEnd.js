//-----------------------------------------------------------------------------
// Scene_GameEnd
//
// The scene class of the game end screen.

class Scene_GameEnd extends Scene_MenuBase {
	constructor(...args) {
		super(...args);
		this.initialize(...args);
	}

	initialize() {
		super.initialize();
	}

	create() {
		super.create();
		this.createCommandWindow();
	}

	stop() {
		super.stop();
		this._commandWindow.close();
	}

	createBackground() {
		super.createBackground();
		this.setBackgroundOpacity(128);
	}

	createCommandWindow() {
		this._commandWindow = new Window_GameEnd();
		this._commandWindow.setHandler('toTitle', this.commandToTitle.bind(this));
		this._commandWindow.setHandler('cancel', this.popScene.bind(this));
		this.addWindow(this._commandWindow);
	}

	commandToTitle() {
		this.fadeOutAll();
		SceneManager.goto(Scene_Title);
	}
}
