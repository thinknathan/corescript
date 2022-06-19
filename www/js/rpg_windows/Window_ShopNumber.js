import Window_Selectable from "./Window_Selectable.js";
import TextManager from "../rpg_managers/TextManager.js";
import SoundManager from "../rpg_managers/SoundManager.js";
import TouchInput from "../rpg_core/TouchInput.js";
import Input from "../rpg_core/Input.js";
import ImageManager from "../rpg_managers/ImageManager.js";
import Sprite_Button from "../rpg_sprites/Sprite_Button.js";

//-----------------------------------------------------------------------------
// Window_ShopNumber
//
// The window for inputting quantity of items to buy or sell on the shop
// screen.

class Window_ShopNumber extends Window_Selectable {
	constructor(...args) {
		super(...args);
		this.initialize(...args);
	}

	initialize(x, y, height) {
		const width = this.windowWidth();
		super.initialize(x, y, width, height);
		this._item = null;
		this._max = 1;
		this._price = 0;
		this._number = 1;
		this._currencyUnit = TextManager.currencyUnit;
		this.createButtons();
	}

	windowWidth() {
		return 456;
	}

	number() {
		return this._number;
	}

	setup(item, max, price) {
		this._item = item;
		this._max = Math.floor(max);
		this._price = price;
		this._number = 1;
		this.placeButtons();
		this.updateButtonsVisiblity();
		this.refresh();
	}

	setCurrencyUnit(currencyUnit) {
		this._currencyUnit = currencyUnit;
		this.refresh();
	}

	createButtons() {
		const bitmap = ImageManager.loadSystem('ButtonSet');
		const buttonWidth = 48;
		const buttonHeight = 48;
		this._buttons = [];
		for (let i = 0; i < 5; i++) {
			const button = new Sprite_Button();
			const x = buttonWidth * i;
			const w = buttonWidth * (i === 4 ? 2 : 1);
			button.bitmap = bitmap;
			button.setColdFrame(x, 0, w, buttonHeight);
			button.setHotFrame(x, buttonHeight, w, buttonHeight);
			button.visible = false;
			this._buttons.push(button);
			this.addChild(button);
		}
		this._buttons[0].setClickHandler(this.onButtonDown2.bind(this));
		this._buttons[1].setClickHandler(this.onButtonDown.bind(this));
		this._buttons[2].setClickHandler(this.onButtonUp.bind(this));
		this._buttons[3].setClickHandler(this.onButtonUp2.bind(this));
		this._buttons[4].setClickHandler(this.onButtonOk.bind(this));
	}

	placeButtons() {
		const numButtons = this._buttons.length;
		const spacing = 16;
		let totalWidth = -spacing;
		for (let i = 0; i < numButtons; i++) {
			totalWidth += this._buttons[i].width + spacing;
		}
		let x = (this.width - totalWidth) / 2;
		for (let j = 0; j < numButtons; j++) {
			const button = this._buttons[j];
			button.x = x;
			button.y = this.buttonY();
			x += button.width + spacing;
		}
	}

	updateButtonsVisiblity() {
		if (TouchInput.date > Input.date) {
			this.showButtons();
		} else {
			this.hideButtons();
		}
	}

	showButtons() {
		for (let i = 0; i < this._buttons.length; i++) {
			this._buttons[i].visible = true;
		}
	}

	hideButtons() {
		for (let i = 0; i < this._buttons.length; i++) {
			this._buttons[i].visible = false;
		}
	}

	refresh() {
		this.contents.clear();
		this.drawItemName(this._item, 0, this.itemY());
		this.drawMultiplicationSign();
		this.drawNumber();
		this.drawTotalPrice();
	}

	drawMultiplicationSign() {
		const sign = '\u00d7';
		const width = this.textWidth(sign);
		const x = this.cursorX() - width * 2;
		const y = this.itemY();
		this.resetTextColor();
		this.drawText(sign, x, y, width);
	}

	drawNumber() {
		const x = this.cursorX();
		const y = this.itemY();
		const width = this.cursorWidth() - this.textPadding();
		this.resetTextColor();
		this.drawText(this._number, x, y, width, 'right');
	}

	drawTotalPrice() {
		const total = this._price * this._number;
		const width = this.contentsWidth() - this.textPadding();
		this.drawCurrencyValue(total, this._currencyUnit, 0, this.priceY(), width);
	}

	itemY() {
		return Math.round(this.contentsHeight() / 2 - this.lineHeight() * 1.5);
	}

	priceY() {
		return Math.round(this.contentsHeight() / 2 + this.lineHeight() / 2);
	}

	buttonY() {
		return Math.round(this.priceY() + this.lineHeight() * 2.5);
	}

	cursorWidth() {
		const digitWidth = this.textWidth('0');
		return this.maxDigits() * digitWidth + this.textPadding() * 2;
	}

	cursorX() {
		return this.contentsWidth() - this.cursorWidth() - this.textPadding();
	}

	maxDigits() {
		return 2;
	}

	update() {
		super.update();
		this.processNumberChange();
	}

	isOkTriggered() {
		return Input.isTriggered('ok');
	}

	playOkSound() {}

	processNumberChange() {
		if (this.isOpenAndActive()) {
			if (Input.isRepeated('right')) {
				this.changeNumber(1);
			}
			if (Input.isRepeated('left')) {
				this.changeNumber(-1);
			}
			if (Input.isRepeated('up')) {
				this.changeNumber(10);
			}
			if (Input.isRepeated('down')) {
				this.changeNumber(-10);
			}
		}
	}

	changeNumber(amount) {
		const lastNumber = this._number;
		this._number = (this._number + amount)
			.clamp(1, this._max);
		if (this._number !== lastNumber) {
			SoundManager.playCursor();
			this.refresh();
		}
	}

	updateCursor() {
		this.setCursorRect(this.cursorX(), this.itemY(),
			this.cursorWidth(), this.lineHeight());
	}

	onButtonUp() {
		this.changeNumber(1);
	}

	onButtonUp2() {
		this.changeNumber(10);
	}

	onButtonDown() {
		this.changeNumber(-1);
	}

	onButtonDown2() {
		this.changeNumber(-10);
	}

	onButtonOk() {
		this.processOk();
	}
}

export default Window_ShopNumber;
