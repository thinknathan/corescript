import Scene_ItemBase from "./Scene_ItemBase.js";

//-----------------------------------------------------------------------------
// Scene_Item
//
// The scene class of the item screen.

class Scene_Item extends Scene_ItemBase {
	constructor(...args) {
		super(...args);
		this.initialize(...args);
	}

	initialize() {
		super.initialize();
	}

	create() {
		super.create();
		this.createHelpWindow();
		this.createCategoryWindow();
		this.createItemWindow();
		this.createActorWindow();
	}

	createCategoryWindow() {
		this._categoryWindow = new Window_ItemCategory();
		this._categoryWindow.setHelpWindow(this._helpWindow);
		this._categoryWindow.y = this._helpWindow.height;
		this._categoryWindow.setHandler('ok', this.onCategoryOk.bind(this));
		this._categoryWindow.setHandler('cancel', this.popScene.bind(this));
		this.addWindow(this._categoryWindow);
	}

	createItemWindow() {
		const wy = this._categoryWindow.y + this._categoryWindow.height;
		const wh = Graphics.boxHeight - wy;
		this._itemWindow = new Window_ItemList(0, wy, Graphics.boxWidth, wh);
		this._itemWindow.setHelpWindow(this._helpWindow);
		this._itemWindow.setHandler('ok', this.onItemOk.bind(this));
		this._itemWindow.setHandler('cancel', this.onItemCancel.bind(this));
		this.addWindow(this._itemWindow);
		this._categoryWindow.setItemWindow(this._itemWindow);
	}

	user() {
		const members = self.$gameParty.movableMembers();
		let bestActor = members[0];
		let bestPha = 0;
		for (let i = 0; i < members.length; i++) {
			if (members[i].pha > bestPha) {
				bestPha = members[i].pha;
				bestActor = members[i];
			}
		}
		return bestActor;
	}

	onCategoryOk() {
		this._itemWindow.activate();
		this._itemWindow.selectLast();
	}

	onItemOk() {
		self.$gameParty.setLastItem(this.item());
		this.determineItem();
	}

	onItemCancel() {
		this._itemWindow.deselect();
		this._categoryWindow.activate();
	}

	playSeForItem() {
		SoundManager.playUseItem();
	}

	useItem() {
		super.useItem();
		this._itemWindow.redrawCurrentItem();
	}
}

export default Scene_Item;
