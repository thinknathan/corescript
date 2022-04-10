//-----------------------------------------------------------------------------
// Scene_Save
//
// The scene class of the save screen.

class Scene_Save extends Scene_File {
	constructor(...args) {
		super(...args);
		this.initialize(...args);
	}

	initialize() {
		super.initialize();
	}

	mode() {
		return 'save';
	}

	helpWindowText() {
		return TextManager.saveMessage;
	}

	firstSavefileIndex() {
		return DataManager.lastAccessedSavefileId() - 1;
	}

	onSavefileOk() {
		if (DataManager.isAutoSaveFileId(this.savefileId())) {
			this.onSaveFailure();
			return;
		}
		super.onSavefileOk();
		$gameSystem.onBeforeSave();
		if (DataManager.saveGame(this.savefileId())) {
			this.onSaveSuccess();
		} else {
			this.onSaveFailure();
		}
	}

	onSaveSuccess() {
		SoundManager.playSave();
		StorageManager.cleanBackup(this.savefileId());
		this.popScene();
	}

	onSaveFailure() {
		SoundManager.playBuzzer();
		this.activateListWindow();
	}
}

self.Scene_Save = Scene_Save;
