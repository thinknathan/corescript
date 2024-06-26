import Window_Command from './Window_Command.js';
import TextManager from '../rpg_managers/TextManager.js';
import { DataManager } from '../rpg_managers/DataManager.js';

//-----------------------------------------------------------------------------
// Window_MenuCommand
//
// The window for selecting a command on the menu screen.

class Window_MenuCommand extends Window_Command {
	constructor(...args) {
		super(...args);
		this.initialize(...args);
	}

	initialize(x, y) {
		super.initialize(x, y);
		this.selectLast();
	}

	static initCommandPosition() {
		this._lastCommandSymbol = null;
	}

	windowWidth() {
		return 240;
	}

	numVisibleRows() {
		return this.maxItems();
	}

	makeCommandList() {
		this.addMainCommands();
		this.addFormationCommand();
		this.addOriginalCommands();
		this.addOptionsCommand();
		this.addSaveCommand();
		this.addGameEndCommand();
	}

	addMainCommands() {
		const enabled = this.areMainCommandsEnabled();
		if (this.needsCommand('item')) {
			this.addCommand(TextManager.item, 'item', enabled);
		}
		if (this.needsCommand('skill')) {
			this.addCommand(TextManager.skill, 'skill', enabled);
		}
		if (this.needsCommand('equip')) {
			this.addCommand(TextManager.equip, 'equip', enabled);
		}
		if (this.needsCommand('status')) {
			this.addCommand(TextManager.status, 'status', enabled);
		}
	}

	addFormationCommand() {
		if (this.needsCommand('formation')) {
			const enabled = this.isFormationEnabled();
			this.addCommand(TextManager.formation, 'formation', enabled);
		}
	}

	addOriginalCommands() {}

	addOptionsCommand() {
		if (this.needsCommand('options')) {
			const enabled = this.isOptionsEnabled();
			this.addCommand(TextManager.options, 'options', enabled);
		}
	}

	addSaveCommand() {
		if (this.needsCommand('save')) {
			const enabled = this.isSaveEnabled();
			this.addCommand(TextManager.save, 'save', enabled);
		}
	}

	addGameEndCommand() {
		const enabled = this.isGameEndEnabled();
		this.addCommand(TextManager.gameEnd, 'gameEnd', enabled);
	}

	needsCommand(name) {
		const flags = self.$dataSystem.menuCommands;
		if (flags) {
			switch (name) {
				case 'item':
					return flags[0];
				case 'skill':
					return flags[1];
				case 'equip':
					return flags[2];
				case 'status':
					return flags[3];
				case 'formation':
					return flags[4];
				case 'save':
					return flags[5];
			}
		}
		return true;
	}

	areMainCommandsEnabled() {
		return self.$gameParty.exists();
	}

	isFormationEnabled() {
		return self.$gameParty.size() >= 2 && self.$gameSystem.isFormationEnabled();
	}

	isOptionsEnabled() {
		return true;
	}

	isSaveEnabled() {
		return !DataManager.isEventTest() && self.$gameSystem.isSaveEnabled();
	}

	isGameEndEnabled() {
		return true;
	}

	processOk() {
		Window_MenuCommand._lastCommandSymbol = this.currentSymbol();
		super.processOk();
	}

	selectLast() {
		this.selectSymbol(Window_MenuCommand._lastCommandSymbol);
	}
}

Window_MenuCommand._lastCommandSymbol = null;

export default Window_MenuCommand;
