import Window_Command from './Window_Command.js';
import Graphics from '../rpg_core/Graphics.js';
import TextManager from '../rpg_managers/TextManager.js';
import BattleManager from '../rpg_managers/BattleManager.js';

//-----------------------------------------------------------------------------
// Window_PartyCommand
//
// The window for selecting whether to fight or escape on the battle screen.

class Window_PartyCommand extends Window_Command {
	constructor(...args) {
		super(...args);
		this.initialize(...args);
	}

	initialize() {
		const y = Graphics.boxHeight - this.windowHeight();
		super.initialize(0, y);
		this.openness = 0;
		this.deactivate();
	}

	windowWidth() {
		return 192;
	}

	numVisibleRows() {
		return 4;
	}

	makeCommandList() {
		this.addCommand(TextManager.fight, 'fight');
		this.addCommand(TextManager.escape, 'escape', BattleManager.canEscape());
	}

	setup() {
		this.clearCommandList();
		this.makeCommandList();
		this.refresh();
		this.select(0);
		this.activate();
		this.open();
	}
}

export default Window_PartyCommand;
