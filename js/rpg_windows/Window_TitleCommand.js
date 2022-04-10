//-----------------------------------------------------------------------------
// Window_TitleCommand
//
// The window for selecting New Game/Continue on the title screen.

class Window_TitleCommand extends Window_Command {
	constructor(...args) {
		super(...args);
		this.initialize(...args);
	}

	initialize() {
		super.initialize(0, 0);
		this.updatePlacement();
		this.openness = 0;
		this.selectLast();
	}

	static initCommandPosition() {
		this._lastCommandSymbol = null;
	}

	windowWidth() {
		return 240;
	}

	updatePlacement() {
		this.x = (Graphics.boxWidth - this.width) / 2;
		this.y = Graphics.boxHeight - this.height - 96;
	}

	makeCommandList() {
		this.addCommand(TextManager.newGame, 'newGame');
		this.addCommand(TextManager.continue_, 'continue', this.isContinueEnabled());
		this.addCommand(TextManager.options, 'options');
	}

	isContinueEnabled() {
		return DataManager.isAnySavefileExists();
	}

	processOk() {
		Window_TitleCommand._lastCommandSymbol = this.currentSymbol();
		super.processOk();
	}

	selectLast() {
		if (Window_TitleCommand._lastCommandSymbol) {
			this.selectSymbol(Window_TitleCommand._lastCommandSymbol);
		} else if (this.isContinueEnabled()) {
			this.selectSymbol('continue');
		}
	}
}

Window_TitleCommand._lastCommandSymbol = null;

self.Window_TitleCommand = Window_TitleCommand;
