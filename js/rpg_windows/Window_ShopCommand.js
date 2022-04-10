import Window_HorzCommand from "./Window_HorzCommand.js";

//-----------------------------------------------------------------------------
// Window_ShopCommand
//
// The window for selecting buy/sell on the shop screen.

class Window_ShopCommand extends Window_HorzCommand {
	constructor(...args) {
		super(...args);
		this.initialize(...args);
	}

	initialize(width, purchaseOnly) {
		this._windowWidth = width;
		this._purchaseOnly = purchaseOnly;
		super.initialize(0, 0);
	}

	windowWidth() {
		return this._windowWidth;
	}

	maxCols() {
		return 3;
	}

	makeCommandList() {
		this.addCommand(TextManager.buy, 'buy');
		this.addCommand(TextManager.sell, 'sell', !this._purchaseOnly);
		this.addCommand(TextManager.cancel, 'cancel');
	}
}

export default Window_ShopCommand;
