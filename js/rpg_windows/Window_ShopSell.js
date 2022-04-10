import Window_ItemList from "./Window_ItemList.js";

//-----------------------------------------------------------------------------
// Window_ShopSell
//
// The window for selecting an item to sell on the shop screen.

class Window_ShopSell extends Window_ItemList {
	constructor(...args) {
		super(...args);
		this.initialize(...args);
	}

	initialize(x, y, width, height) {
		super.initialize(x, y, width, height);
	}

	isEnabled(item) {
		return item && item.price > 0;
	}
}

export default Window_ShopSell;
