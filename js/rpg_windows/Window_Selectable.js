//-----------------------------------------------------------------------------
// Window_Selectable
//
// The window class with cursor movement and scroll functions.

class Window_Selectable extends Window_Base {
	constructor(...args) {
		super(...args);
		this.initialize(...args);
	}

	initialize(x, y, width, height) {
		super.initialize(x, y, width, height);
		this._index = -1;
		this._cursorFixed = false;
		this._cursorAll = false;
		this._stayCount = 0;
		this._helpWindow = null;
		this._handlers = {};
		this._touching = false;
		this._scrollX = 0;
		this._scrollY = 0;
		this.deactivate();
	}

	index() {
		return this._index;
	}

	cursorFixed() {
		return this._cursorFixed;
	}

	setCursorFixed(cursorFixed) {
		this._cursorFixed = cursorFixed;
	}

	cursorAll() {
		return this._cursorAll;
	}

	setCursorAll(cursorAll) {
		this._cursorAll = cursorAll;
	}

	maxCols() {
		return 1;
	}

	maxItems() {
		return 0;
	}

	spacing() {
		return 12;
	}

	itemWidth() {
		return Math.floor((this.width - this.padding * 2 +
			this.spacing()) / this.maxCols() - this.spacing());
	}

	itemHeight() {
		return this.lineHeight();
	}

	maxRows() {
		return Math.max(Math.ceil(this.maxItems() / this.maxCols()), 1);
	}

	activate() {
		super.activate();
		this.reselect();
	}

	deactivate() {
		super.deactivate();
		this.reselect();
	}

	select(index) {
		this._index = index;
		this._stayCount = 0;
		this.ensureCursorVisible();
		this.updateCursor();
		this.callUpdateHelp();
	}

	deselect() {
		this.select(-1);
	}

	reselect() {
		this.select(this._index);
	}

	row() {
		return Math.floor(this.index() / this.maxCols());
	}

	topRow() {
		return Math.floor(this._scrollY / this.itemHeight());
	}

	maxTopRow() {
		return Math.max(0, this.maxRows() - this.maxPageRows());
	}

	setTopRow(row) {
		const scrollY = row.clamp(0, this.maxTopRow()) * this.itemHeight();
		if (this._scrollY !== scrollY) {
			this._scrollY = scrollY;
			this.refresh();
			this.updateCursor();
		}
	}

	resetScroll() {
		this.setTopRow(0);
	}

	maxPageRows() {
		const pageHeight = this.height - this.padding * 2;
		return Math.floor(pageHeight / this.itemHeight());
	}

	maxPageItems() {
		return this.maxPageRows() * this.maxCols();
	}

	isHorizontal() {
		return this.maxPageRows() === 1;
	}

	bottomRow() {
		return Math.max(0, this.topRow() + this.maxPageRows() - 1);
	}

	setBottomRow(row) {
		this.setTopRow(row - (this.maxPageRows() - 1));
	}

	topIndex() {
		return this.topRow() * this.maxCols();
	}

	itemRect(index) {
		const rect = new Rectangle();
		const maxCols = this.maxCols();
		rect.width = this.itemWidth();
		rect.height = this.itemHeight();
		rect.x = index % maxCols * (rect.width + this.spacing()) - this._scrollX;
		rect.y = Math.floor(index / maxCols) * rect.height - this._scrollY;
		return rect;
	}

	itemRectForText(index) {
		const rect = this.itemRect(index);
		rect.x += this.textPadding();
		rect.width -= this.textPadding() * 2;
		return rect;
	}

	setHelpWindow(helpWindow) {
		this._helpWindow = helpWindow;
		this.callUpdateHelp();
	}

	showHelpWindow() {
		if (this._helpWindow) {
			this._helpWindow.show();
		}
	}

	hideHelpWindow() {
		if (this._helpWindow) {
			this._helpWindow.hide();
		}
	}

	setHandler(symbol, method) {
		this._handlers[symbol] = method;
	}

	isHandled(symbol) {
		return !!this._handlers[symbol];
	}

	callHandler(symbol) {
		if (this.isHandled(symbol)) {
			this._handlers[symbol]();
		}
	}

	isOpenAndActive() {
		return this.isOpen() && this.active;
	}

	isCursorMovable() {
		return (this.isOpenAndActive() && !this._cursorFixed &&
			!this._cursorAll && this.maxItems() > 0);
	}

	cursorDown(wrap) {
		const index = this.index();
		const maxItems = this.maxItems();
		const maxCols = this.maxCols();
		if (index < maxItems - maxCols || (wrap && maxCols === 1)) {
			this.select((index + maxCols) % maxItems);
		}
	}

	cursorUp(wrap) {
		const index = this.index();
		const maxItems = this.maxItems();
		const maxCols = this.maxCols();
		if (index >= maxCols || (wrap && maxCols === 1)) {
			this.select((index - maxCols + maxItems) % maxItems);
		}
	}

	cursorRight(wrap) {
		const index = this.index();
		const maxItems = this.maxItems();
		const maxCols = this.maxCols();
		if (maxCols >= 2 && (index < maxItems - 1 || (wrap && this.isHorizontal()))) {
			this.select((index + 1) % maxItems);
		}
	}

	cursorLeft(wrap) {
		const index = this.index();
		const maxItems = this.maxItems();
		const maxCols = this.maxCols();
		if (maxCols >= 2 && (index > 0 || (wrap && this.isHorizontal()))) {
			this.select((index - 1 + maxItems) % maxItems);
		}
	}

	cursorPagedown() {
		const index = this.index();
		const maxItems = this.maxItems();
		if (this.topRow() + this.maxPageRows() < this.maxRows()) {
			this.setTopRow(this.topRow() + this.maxPageRows());
			this.select(Math.min(index + this.maxPageItems(), maxItems - 1));
		}
	}

	cursorPageup() {
		const index = this.index();
		if (this.topRow() > 0) {
			this.setTopRow(this.topRow() - this.maxPageRows());
			this.select(Math.max(index - this.maxPageItems(), 0));
		}
	}

	scrollDown() {
		if (this.topRow() + 1 < this.maxRows()) {
			this.setTopRow(this.topRow() + 1);
		}
	}

	scrollUp() {
		if (this.topRow() > 0) {
			this.setTopRow(this.topRow() - 1);
		}
	}

	update() {
		super.update();
		this.updateArrows();
		this.processCursorMove();
		this.processHandling();
		this.processWheel();
		this.processTouch();
		this._stayCount++;
	}

	updateArrows() {
		const topRow = this.topRow();
		const maxTopRow = this.maxTopRow();
		this.downArrowVisible = maxTopRow > 0 && topRow < maxTopRow;
		this.upArrowVisible = topRow > 0;
	}

	processCursorMove() {
		if (this.isCursorMovable()) {
			const lastIndex = this.index();
			if (Input.isRepeated('down')) {
				this.cursorDown(Input.isTriggered('down'));
			}
			if (Input.isRepeated('up')) {
				this.cursorUp(Input.isTriggered('up'));
			}
			if (Input.isRepeated('right')) {
				this.cursorRight(Input.isTriggered('right'));
			}
			if (Input.isRepeated('left')) {
				this.cursorLeft(Input.isTriggered('left'));
			}
			if (!this.isHandled('pagedown') && Input.isTriggered('pagedown')) {
				this.cursorPagedown();
			}
			if (!this.isHandled('pageup') && Input.isTriggered('pageup')) {
				this.cursorPageup();
			}
			if (this.index() !== lastIndex) {
				SoundManager.playCursor();
			}
		}
	}

	processHandling() {
		if (this.isOpenAndActive()) {
			if (this.isOkEnabled() && this.isOkTriggered()) {
				this.processOk();
			} else if (this.isCancelEnabled() && this.isCancelTriggered()) {
				this.processCancel();
			} else if (this.isHandled('pagedown') && Input.isTriggered('pagedown')) {
				this.processPagedown();
			} else if (this.isHandled('pageup') && Input.isTriggered('pageup')) {
				this.processPageup();
			}
		}
	}

	processWheel() {
		if (this.isOpenAndActive()) {
			const threshold = 20;
			if (TouchInput.wheelY >= threshold) {
				this.scrollDown();
			}
			if (TouchInput.wheelY <= -threshold) {
				this.scrollUp();
			}
		}
	}

	processTouch() {
		if (this.isOpenAndActive()) {
			if (TouchInput.isTriggered() && this.isTouchedInsideFrame()) {
				this._touching = true;
				this.onTouch(true);
			} else if (TouchInput.isCancelled()) {
				if (this.isCancelEnabled()) {
					this.processCancel();
				}
			}
			if (this._touching) {
				if (TouchInput.isPressed()) {
					this.onTouch(false);
				} else {
					this._touching = false;
				}
			}
		} else {
			this._touching = false;
		}
	}

	isTouchedInsideFrame() {
		const x = this.canvasToLocalX(TouchInput.x);
		const y = this.canvasToLocalY(TouchInput.y);
		return x >= 0 && y >= 0 && x < this.width && y < this.height;
	}

	onTouch(triggered) {
		const lastIndex = this.index();
		const x = this.canvasToLocalX(TouchInput.x);
		const y = this.canvasToLocalY(TouchInput.y);
		const hitIndex = this.hitTest(x, y);
		if (hitIndex >= 0) {
			if (hitIndex === this.index()) {
				if (triggered && this.isTouchOkEnabled()) {
					this.processOk();
				}
			} else if (this.isCursorMovable()) {
				this.select(hitIndex);
			}
		} else if (this._stayCount >= 10) {
			if (y < this.padding) {
				this.cursorUp();
			} else if (y >= this.height - this.padding) {
				this.cursorDown();
			}
		}
		if (this.index() !== lastIndex) {
			SoundManager.playCursor();
		}
	}

	hitTest(x, y) {
		if (this.isContentsArea(x, y)) {
			const cx = x - this.padding;
			const cy = y - this.padding;
			const topIndex = this.topIndex();
			for (let i = 0; i < this.maxPageItems(); i++) {
				const index = topIndex + i;
				if (index < this.maxItems()) {
					const rect = this.itemRect(index);
					const right = rect.x + rect.width;
					const bottom = rect.y + rect.height;
					if (cx >= rect.x && cy >= rect.y && cx < right && cy < bottom) {
						return index;
					}
				}
			}
		}
		return -1;
	}

	isContentsArea(x, y) {
		const left = this.padding;
		const top = this.padding;
		const right = this.width - this.padding;
		const bottom = this.height - this.padding;
		return (x >= left && y >= top && x < right && y < bottom);
	}

	isTouchOkEnabled() {
		return this.isOkEnabled();
	}

	isOkEnabled() {
		return this.isHandled('ok');
	}

	isCancelEnabled() {
		return this.isHandled('cancel');
	}

	isOkTriggered() {
		return Input.isRepeated('ok');
	}

	isCancelTriggered() {
		return Input.isRepeated('cancel');
	}

	processOk() {
		if (this.isCurrentItemEnabled()) {
			this.playOkSound();
			this.updateInputData();
			this.deactivate();
			this.callOkHandler();
		} else {
			this.playBuzzerSound();
		}
	}

	playOkSound() {
		SoundManager.playOk();
	}

	playBuzzerSound() {
		SoundManager.playBuzzer();
	}

	callOkHandler() {
		this.callHandler('ok');
	}

	processCancel() {
		SoundManager.playCancel();
		this.updateInputData();
		this.deactivate();
		this.callCancelHandler();
	}

	callCancelHandler() {
		this.callHandler('cancel');
	}

	processPageup() {
		SoundManager.playCursor();
		this.updateInputData();
		this.deactivate();
		this.callHandler('pageup');
	}

	processPagedown() {
		SoundManager.playCursor();
		this.updateInputData();
		this.deactivate();
		this.callHandler('pagedown');
	}

	updateInputData() {
		Input.update();
		TouchInput.update();
	}

	updateCursor() {
		if (this._cursorAll) {
			const allRowsHeight = this.maxRows() * this.itemHeight();
			this.setCursorRect(0, 0, this.contents.width, allRowsHeight);
			this.setTopRow(0);
		} else if (this.isCursorVisible()) {
			const rect = this.itemRect(this.index());
			this.setCursorRect(rect.x, rect.y, rect.width, rect.height);
		} else {
			this.setCursorRect(0, 0, 0, 0);
		}
	}

	isCursorVisible() {
		const row = this.row();
		return row >= this.topRow() && row <= this.bottomRow();
	}

	ensureCursorVisible() {
		const row = this.row();
		if (row < this.topRow()) {
			this.setTopRow(row);
		} else if (row > this.bottomRow()) {
			this.setBottomRow(row);
		}
	}

	callUpdateHelp() {
		if (this.active && this._helpWindow) {
			this.updateHelp();
		}
	}

	updateHelp() {
		this._helpWindow.clear();
	}

	setHelpWindowItem(item) {
		if (this._helpWindow) {
			this._helpWindow.setItem(item);
		}
	}

	isCurrentItemEnabled() {
		return true;
	}

	drawAllItems() {
		const topIndex = this.topIndex();
		for (let i = 0; i < this.maxPageItems(); i++) {
			const index = topIndex + i;
			if (index < this.maxItems()) {
				this.drawItem(index);
			}
		}
	}

	drawItem(index) {}

	clearItem(index) {
		const rect = this.itemRect(index);
		this.contents.clearRect(rect.x, rect.y, rect.width, rect.height);
	}

	redrawItem(index) {
		if (index >= 0) {
			this.clearItem(index);
			this.drawItem(index);
		}
	}

	redrawCurrentItem() {
		this.redrawItem(this.index());
	}

	refresh() {
		if (this.contents) {
			this.contents.clear();
			this.drawAllItems();
		}
	}
}

self.Window_Selectable = Window_Selectable;
