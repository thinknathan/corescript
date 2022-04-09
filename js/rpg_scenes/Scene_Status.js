//-----------------------------------------------------------------------------
// Scene_Status
//
// The scene class of the status screen.

class Scene_Status extends Scene_MenuBase {
	constructor(...args) {
		super(...args);
		this.initialize(...args);
	}

	initialize() {
		super.initialize();
	}

	create() {
		super.create();
		this._statusWindow = new Window_Status();
		this._statusWindow.setHandler('cancel', this.popScene.bind(this));
		this._statusWindow.setHandler('pagedown', this.nextActor.bind(this));
		this._statusWindow.setHandler('pageup', this.previousActor.bind(this));
		this._statusWindow.reserveFaceImages();
		this.addWindow(this._statusWindow);
	}

	start() {
		super.start();
		this.refreshActor();
	}

	refreshActor() {
		const actor = this.actor();
		this._statusWindow.setActor(actor);
	}

	onActorChange() {
		this.refreshActor();
		this._statusWindow.activate();
	}
}
