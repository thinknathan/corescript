import Window_ItemList from "./Window_ItemList.js";
import Graphics from "../rpg_core/Graphics.js";
import { DataManager } from "../rpg_managers/DataManager.js";

//-----------------------------------------------------------------------------
// Window_EventItem
//
// The window used for the event command [Select Item].

class Window_EventItem extends Window_ItemList {
	constructor(...args) {
		super(...args);
		this.initialize(...args);
	}

	initialize(messageWindow) {
		this._messageWindow = messageWindow;
		const width = Graphics.boxWidth;
		const height = this.windowHeight();
		super.initialize(0, 0, width, height);
		this.openness = 0;
		this.deactivate();
		this.setHandler('ok', this.onOk.bind(this));
		this.setHandler('cancel', this.onCancel.bind(this));
	}

	windowHeight() {
		return this.fittingHeight(this.numVisibleRows());
	}

	numVisibleRows() {
		return 4;
	}

	start() {
		this.refresh();
		this.updatePlacement();
		this.select(0);
		this.open();
		this.activate();
	}

	updatePlacement() {
		if (this._messageWindow.y >= Graphics.boxHeight / 2) {
			this.y = 0;
		} else {
			this.y = Graphics.boxHeight - this.height;
		}
	}

	includes(item) {
		const itypeId = self.$gameMessage.itemChoiceItypeId();
		return DataManager.isItem(item) && item.itypeId === itypeId;
	}

	isEnabled(item) {
		return true;
	}

	onOk() {
		const item = this.item();
		const itemId = item ? item.id : 0;
		self.$gameVariables.setValue(self.$gameMessage.itemChoiceVariableId(), itemId);
		this._messageWindow.terminateMessage();
		this.close();
	}

	onCancel() {
		self.$gameVariables.setValue(self.$gameMessage.itemChoiceVariableId(), 0);
		this._messageWindow.terminateMessage();
		this.close();
	}
}

export default Window_EventItem;
