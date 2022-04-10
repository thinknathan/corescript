import Window_HorzCommand from "./Window_HorzCommand.js";

//-----------------------------------------------------------------------------
// Window_EquipCommand
//
// The window for selecting a command on the equipment screen.

class Window_EquipCommand extends Window_HorzCommand {
	constructor(...args) {
		super(...args);
		this.initialize(...args);
	}

	initialize(x, y, width) {
		this._windowWidth = width;
		super.initialize(x, y);
	}

	windowWidth() {
		return this._windowWidth;
	}

	maxCols() {
		return 3;
	}

	makeCommandList() {
		this.addCommand(TextManager.equip2, 'equip');
		this.addCommand(TextManager.optimize, 'optimize');
		this.addCommand(TextManager.clear, 'clear');
	}
}

export default Window_EquipCommand;
