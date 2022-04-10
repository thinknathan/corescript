//-----------------------------------------------------------------------------
// Window_HorzCommand
//
// The command window for the horizontal selection format.

class Window_HorzCommand extends Window_Command {
	constructor(...args) {
		super(...args);
		this.initialize(...args);
	}

	initialize(x, y) {
		super.initialize(x, y);
	}

	numVisibleRows() {
		return 1;
	}

	maxCols() {
		return 4;
	}

	itemTextAlign() {
		return 'center';
	}
}

self.Window_HorzCommand = Window_HorzCommand;
