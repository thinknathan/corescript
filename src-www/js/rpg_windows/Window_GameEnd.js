import Window_Command from './Window_Command.js';
import Graphics from '../rpg_core/Graphics.js';
import TextManager from '../rpg_managers/TextManager.js';

//-----------------------------------------------------------------------------
// Window_GameEnd
//
// The window for selecting "Go to Title" on the game end screen.

class Window_GameEnd extends Window_Command {
	constructor(...args) {
		super(...args);
		this.initialize(...args);
	}

	initialize() {
		super.initialize(0, 0);
		this.updatePlacement();
		this.openness = 0;
		this.open();
	}

	windowWidth() {
		return 240;
	}

	updatePlacement() {
		this.x = (Graphics.boxWidth - this.width) / 2;
		this.y = (Graphics.boxHeight - this.height) / 2;
	}

	makeCommandList() {
		this.addCommand(TextManager.toTitle, 'toTitle');
		this.addCommand(TextManager.cancel, 'cancel');
	}
}

export default Window_GameEnd;
