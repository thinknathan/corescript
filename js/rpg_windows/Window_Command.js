//-----------------------------------------------------------------------------
// Window_Command
//
// The superclass of windows for selecting a command.

class Window_Command extends Window_Selectable {
	constructor(...args) {
		super(...args);
		this.initialize(...args);
	}

	initialize(x, y) {
		this.clearCommandList();
		this.makeCommandList();
		const width = this.windowWidth();
		const height = this.windowHeight();
		super.initialize(x, y, width, height);
		this.refresh();
		this.select(0);
		this.activate();
	}

	windowWidth() {
		return 240;
	}

	windowHeight() {
		return this.fittingHeight(this.numVisibleRows());
	}

	numVisibleRows() {
		return Math.ceil(this.maxItems() / this.maxCols());
	}

	maxItems() {
		return this._list.length;
	}

	clearCommandList() {
		this._list = [];
	}

	makeCommandList() {}

	addCommand(name, symbol, enabled, ext) {
		if (enabled === undefined) {
			enabled = true;
		}
		if (ext === undefined) {
			ext = null;
		}
		this._list.push({
			name,
			symbol,
			enabled,
			ext
		});
	}

	commandName(index) {
		return this._list[index].name;
	}

	commandSymbol(index) {
		return this._list[index].symbol;
	}

	isCommandEnabled(index) {
		return this._list[index].enabled;
	}

	currentData() {
		return this.index() >= 0 ? this._list[this.index()] : null;
	}

	isCurrentItemEnabled() {
		return this.currentData() ? this.currentData()
			.enabled : false;
	}

	currentSymbol() {
		return this.currentData() ? this.currentData()
			.symbol : null;
	}

	currentExt() {
		return this.currentData() ? this.currentData()
			.ext : null;
	}

	findSymbol(symbol) {
		for (let i = 0; i < this._list.length; i++) {
			if (this._list[i].symbol === symbol) {
				return i;
			}
		}
		return -1;
	}

	selectSymbol(symbol) {
		const index = this.findSymbol(symbol);
		if (index >= 0) {
			this.select(index);
		} else {
			this.select(0);
		}
	}

	findExt(ext) {
		for (let i = 0; i < this._list.length; i++) {
			if (this._list[i].ext === ext) {
				return i;
			}
		}
		return -1;
	}

	selectExt(ext) {
		const index = this.findExt(ext);
		if (index >= 0) {
			this.select(index);
		} else {
			this.select(0);
		}
	}

	drawItem(index) {
		const rect = this.itemRectForText(index);
		const align = this.itemTextAlign();
		this.resetTextColor();
		this.changePaintOpacity(this.isCommandEnabled(index));
		this.drawText(this.commandName(index), rect.x, rect.y, rect.width, align);
	}

	itemTextAlign() {
		return 'left';
	}

	isOkEnabled() {
		return true;
	}

	callOkHandler() {
		const symbol = this.currentSymbol();
		if (this.isHandled(symbol)) {
			this.callHandler(symbol);
		} else if (this.isHandled('ok')) {
			super.callOkHandler();
		} else {
			this.activate();
		}
	}

	refresh() {
		this.clearCommandList();
		this.makeCommandList();
		this.createContents();
		super.refresh();
	}
}
