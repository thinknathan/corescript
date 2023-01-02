import Scene_MenuBase from './Scene_MenuBase.js';
import { DataManager } from '../rpg_managers/DataManager.js';
import Window_Help from '../rpg_windows/Window_Help.js';
import Window_SavefileList from '../rpg_windows/Window_SavefileList.js';
import Graphics from '../rpg_core/Graphics.js';

//-----------------------------------------------------------------------------
// Scene_File
//
// The superclass of Scene_Save and Scene_Load.

class Scene_File extends Scene_MenuBase {
	constructor(...args) {
		super(...args);
		this.initialize(...args);
	}

	initialize() {
		super.initialize();
		this._hasfirstSavefileIndex = false;
	}

	create() {
		super.create();
		DataManager.loadAllSavefileImages().then(() => {
			this.createHelpWindow();
			this.createListWindow();
		});
	}

	start() {
		super.start();
		this._listWindow.refresh();
	}

	savefileId() {
		return this._listWindow.index() + 1;
	}

	createHelpWindow() {
		this._helpWindow = new Window_Help(1);
		this._helpWindow.setText(this.helpWindowText());
		this.addWindow(this._helpWindow);
	}

	createListWindow() {
		const x = 0;
		const y = this._helpWindow.height;
		const width = Graphics.boxWidth;
		const height = Graphics.boxHeight - y;
		this._listWindow = new Window_SavefileList(x, y, width, height);
		this._listWindow.setHandler('ok', this.onSavefileOk.bind(this));
		this._listWindow.setHandler('cancel', this.popScene.bind(this));
		this._listWindow.setMode(this.mode());
		this._listWindow.refresh();
		this.addWindow(this._listWindow);
		this.firstSavefileIndex().then((firstSavefileIndex) => {
			this._listWindow.select(firstSavefileIndex);
			this._listWindow.setTopRow(firstSavefileIndex - 2);
			this._hasfirstSavefileIndex = true;
		});
	}

	mode() {
		return null;
	}

	activateListWindow() {
		this._listWindow.activate();
	}

	helpWindowText() {
		return '';
	}

	async firstSavefileIndex() {
		return 0;
	}

	isReady() {
		return (
			super.isReady() &&
			this._hasfirstSavefileIndex &&
			this._listWindow &&
			this._listWindow.isReady()
		);
	}

	onSavefileOk() {}
}

export default Scene_File;
