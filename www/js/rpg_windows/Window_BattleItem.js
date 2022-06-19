import Window_ItemList from "./Window_ItemList.js";

//-----------------------------------------------------------------------------
// Window_BattleItem
//
// The window for selecting an item to use on the battle screen.

class Window_BattleItem extends Window_ItemList {
	constructor(...args) {
		super(...args);
		this.initialize(...args);
	}

	initialize(x, y, width, height) {
		super.initialize(x, y, width, height);
		this.hide();
	}

	includes(item) {
		return self.$gameParty.canUse(item);
	}

	show() {
		this.selectLast();
		this.showHelpWindow();
		super.show();
	}

	hide() {
		this.hideHelpWindow();
		super.hide();
	}
}

export default Window_BattleItem;
