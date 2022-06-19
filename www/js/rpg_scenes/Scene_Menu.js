import Scene_MenuBase from "./Scene_MenuBase.js";
import Window_Gold from "../rpg_windows/Window_Gold.js";
import Window_MenuCommand from "../rpg_windows/Window_MenuCommand.js";
import Window_MenuStatus from "../rpg_windows/Window_MenuStatus.js";
import SceneManager from "../rpg_managers/SceneManager.js";
import Graphics from "../rpg_core/Graphics.js";
import Scene_Item from "../rpg_scenes/Scene_Item.js";
import Scene_Skill from "../rpg_scenes/Scene_Skill.js";
import Scene_Equip from "../rpg_scenes/Scene_Equip.js";
import Scene_Status from "../rpg_scenes/Scene_Status.js";
import Scene_Options from "../rpg_scenes/Scene_Options.js";
import Scene_Save from "../rpg_scenes/Scene_Save.js";
import Scene_GameEnd from "../rpg_scenes/Scene_GameEnd.js";

//-----------------------------------------------------------------------------
// Scene_Menu
//
// The scene class of the menu screen.

class Scene_Menu extends Scene_MenuBase {
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
		this.createGoldWindow();
		this.createStatusWindow();
	}

	start() {
		super.start();
		this._statusWindow.refresh();
	}

	createCommandWindow() {
		this._commandWindow = new Window_MenuCommand(0, 0);
		this._commandWindow.setHandler('item', this.commandItem.bind(this));
		this._commandWindow.setHandler('skill', this.commandPersonal.bind(this));
		this._commandWindow.setHandler('equip', this.commandPersonal.bind(this));
		this._commandWindow.setHandler('status', this.commandPersonal.bind(this));
		this._commandWindow.setHandler('formation', this.commandFormation.bind(this));
		this._commandWindow.setHandler('options', this.commandOptions.bind(this));
		this._commandWindow.setHandler('save', this.commandSave.bind(this));
		this._commandWindow.setHandler('gameEnd', this.commandGameEnd.bind(this));
		this._commandWindow.setHandler('cancel', this.popScene.bind(this));
		this.addWindow(this._commandWindow);
	}

	createGoldWindow() {
		this._goldWindow = new Window_Gold(0, 0);
		this._goldWindow.y = Graphics.boxHeight - this._goldWindow.height;
		this.addWindow(this._goldWindow);
	}

	createStatusWindow() {
		this._statusWindow = new Window_MenuStatus(this._commandWindow.width, 0);
		this._statusWindow.reserveFaceImages();
		this.addWindow(this._statusWindow);
	}

	commandItem() {
		SceneManager.push(Scene_Item);
	}

	commandPersonal() {
		this._statusWindow.setFormationMode(false);
		this._statusWindow.selectLast();
		this._statusWindow.activate();
		this._statusWindow.setHandler('ok', this.onPersonalOk.bind(this));
		this._statusWindow.setHandler('cancel', this.onPersonalCancel.bind(this));
	}

	commandFormation() {
		this._statusWindow.setFormationMode(true);
		this._statusWindow.selectLast();
		this._statusWindow.activate();
		this._statusWindow.setHandler('ok', this.onFormationOk.bind(this));
		this._statusWindow.setHandler('cancel', this.onFormationCancel.bind(this));
	}

	commandOptions() {
		SceneManager.push(Scene_Options);
	}

	commandSave() {
		SceneManager.push(Scene_Save);
	}

	commandGameEnd() {
		SceneManager.push(Scene_GameEnd);
	}

	onPersonalOk() {
		switch (this._commandWindow.currentSymbol()) {
		case 'skill':
			SceneManager.push(Scene_Skill);
			break;
		case 'equip':
			SceneManager.push(Scene_Equip);
			break;
		case 'status':
			SceneManager.push(Scene_Status);
			break;
		}
	}

	onPersonalCancel() {
		this._statusWindow.deselect();
		this._commandWindow.activate();
	}

	onFormationOk() {
		const index = this._statusWindow.index();
		const pendingIndex = this._statusWindow.pendingIndex();
		if (pendingIndex >= 0) {
			self.$gameParty.swapOrder(index, pendingIndex);
			this._statusWindow.setPendingIndex(-1);
			this._statusWindow.redrawItem(index);
		} else {
			this._statusWindow.setPendingIndex(index);
		}
		this._statusWindow.activate();
	}

	onFormationCancel() {
		if (this._statusWindow.pendingIndex() >= 0) {
			this._statusWindow.setPendingIndex(-1);
			this._statusWindow.activate();
		} else {
			this._statusWindow.deselect();
			this._commandWindow.activate();
		}
	}
}

export default Scene_Menu;
