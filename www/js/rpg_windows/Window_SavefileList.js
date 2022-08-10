import Window_Selectable from './Window_Selectable.js';
import { DataManager } from '../rpg_managers/DataManager.js';
import TextManager from '../rpg_managers/TextManager.js';

//-----------------------------------------------------------------------------
// Window_SavefileList
//
// The window for selecting a save file on the save and load screens.

class Window_SavefileList extends Window_Selectable {
	constructor(...args) {
		super(...args);
		this.initialize(...args);
	}

	initialize(x, y, width, height) {
		super.initialize(x, y, width, height);
		this.activate();
		this._mode = null;
	}

	setMode(mode) {
		this._mode = mode;
	}

	maxItems() {
		return DataManager.maxSavefiles();
	}

	maxVisibleItems() {
		return 5;
	}

	itemHeight() {
		const innerHeight = this.height - this.padding * 2;
		return Math.floor(innerHeight / this.maxVisibleItems());
	}

	drawItem(index) {
		const id = index + 1;
		const valid = DataManager.isThisGameFile(id);
		const info = DataManager.loadSavefileInfo(id);
		const rect = this.itemRectForText(index);
		this.resetTextColor();
		if (this._mode === 'load') {
			this.changePaintOpacity(valid);
		}
		this.drawFileId(id, rect.x, rect.y);
		if (info) {
			this.changePaintOpacity(valid);
			this.drawContents(info, rect, valid);
			this.changePaintOpacity(true);
		}
	}

	drawFileId(id, x, y) {
		if (DataManager.isAutoSaveFileId(id)) {
			if (this._mode === 'save') {
				this.changePaintOpacity(false);
			}
			this.drawText(`${TextManager.file} ${id}(Auto)`, x, y, 180);
		} else {
			this.drawText(`${TextManager.file} ${id}`, x, y, 180);
		}
	}

	drawContents(info, { y, height, width, x }, valid) {
		const bottom = y + height;
		if (width >= 420) {
			this.drawGameTitle(info, x + 192, y, width - 192);
			if (valid) {
				this.drawPartyCharacters(info, x + 220, bottom - 4);
			}
		}
		const lineHeight = this.lineHeight();
		const y2 = bottom - lineHeight;
		if (y2 >= lineHeight) {
			this.drawPlaytime(info, x, y2, width);
		}
	}

	drawGameTitle({ title }, x, y, width) {
		if (title) {
			this.drawText(title, x, y, width);
		}
	}

	drawPartyCharacters({ characters }, x, y) {
		if (characters) {
			characters.forEach((data, i) => {
				this.drawCharacter(data[0], data[1], x + i * 48, y);
			});
		}
	}

	drawPlaytime({ playtime }, x, y, width) {
		if (playtime) {
			this.drawText(playtime, x, y, width, 'right');
		}
	}

	playOkSound() {}
}

export default Window_SavefileList;
