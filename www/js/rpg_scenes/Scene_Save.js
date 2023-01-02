import Scene_File from './Scene_File.js';
import SoundManager from '../rpg_managers/SoundManager.js';
import TextManager from '../rpg_managers/TextManager.js';
import StorageManager from '../rpg_managers/StorageManager.js';
import { DataManager } from '../rpg_managers/DataManager.js';

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

	async firstSavefileIndex() {
		return (await DataManager.lastAccessedSavefileId()) - 1;
	}

	onSavefileOk() {
		if (DataManager.isAutoSaveFileId(this.savefileId())) {
			this.onSaveFailure();
			return;
		}
		super.onSavefileOk();
		self.$gameSystem.onBeforeSave();
		DataManager.saveGame(this.savefileId()).then((success) => {
			if (success) {
				this.onSaveSuccess();
			} else {
				this.onSaveFailure();
			}
		});
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

export default Scene_Save;
