import Window_Selectable from "./Window_Selectable.js";
import Input from "../rpg_core/Input.js";
import SoundManager from "../rpg_managers/SoundManager.js";

//-----------------------------------------------------------------------------
// Window_DebugEdit
//
// The window for displaying switches and variables on the debug screen.

class Window_DebugEdit extends Window_Selectable {
	constructor(...args) {
		super(...args);
		this.initialize(...args);
	}

	initialize(x, y, width) {
		const height = this.fittingHeight(10);
		super.initialize(x, y, width, height);
		this._mode = 'switch';
		this._topId = 1;
		this.refresh();
	}

	maxItems() {
		return 10;
	}

	refresh() {
		this.contents.clear();
		this.drawAllItems();
	}

	drawItem(index) {
		const dataId = this._topId + index;
		const idText = `${dataId.padZero(4)}:`;
		const idWidth = this.textWidth(idText);
		const statusWidth = this.textWidth('-00000000');
		const name = this.itemName(dataId);
		const status = this.itemStatus(dataId);
		const rect = this.itemRectForText(index);
		this.resetTextColor();
		this.drawText(idText, rect.x, rect.y, rect.width);
		rect.x += idWidth;
		rect.width -= idWidth + statusWidth;
		this.drawText(name, rect.x, rect.y, rect.width);
		this.drawText(status, rect.x + rect.width, rect.y, statusWidth, 'right');
	}

	itemName(dataId) {
		if (this._mode === 'switch') {
			return self.$dataSystem.switches[dataId];
		} else {
			return self.$dataSystem.variables[dataId];
		}
	}

	itemStatus(dataId) {
		if (this._mode === 'switch') {
			return self.$gameSwitches.value(dataId) ? '[ON]' : '[OFF]';
		} else {
			return String(self.$gameVariables.value(dataId));
		}
	}

	setMode(mode) {
		if (this._mode !== mode) {
			this._mode = mode;
			this.refresh();
		}
	}

	setTopId(id) {
		if (this._topId !== id) {
			this._topId = id;
			this.refresh();
		}
	}

	currentId() {
		return this._topId + this.index();
	}

	update() {
		super.update();
		if (this.active) {
			if (this._mode === 'switch') {
				this.updateSwitch();
			} else {
				this.updateVariable();
			}
		}
	}

	updateSwitch() {
		if (Input.isRepeated('ok')) {
			const switchId = this.currentId();
			SoundManager.playCursor();
			self.$gameSwitches.setValue(switchId, !self.$gameSwitches.value(switchId));
			this.redrawCurrentItem();
		}
	}

	updateVariable() {
		const variableId = this.currentId();
		let value = self.$gameVariables.value(variableId);
		if (typeof value === 'number') {
			if (Input.isRepeated('right')) {
				value++;
			}
			if (Input.isRepeated('left')) {
				value--;
			}
			if (Input.isRepeated('pagedown')) {
				value += 10;
			}
			if (Input.isRepeated('pageup')) {
				value -= 10;
			}
			if (self.$gameVariables.value(variableId) !== value) {
				self.$gameVariables.setValue(variableId, value);
				SoundManager.playCursor();
				this.redrawCurrentItem();
			}
		}
	}
}

export default Window_DebugEdit;
