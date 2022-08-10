import Window_Selectable from './Window_Selectable.js';
import Window_Base from './Window_Base.js';
import Graphics from '../rpg_core/Graphics.js';
import ImageManager from '../rpg_managers/ImageManager.js';

//-----------------------------------------------------------------------------
// Window_MenuStatus
//
// The window for displaying party member status on the menu screen.

class Window_MenuStatus extends Window_Selectable {
	constructor(...args) {
		super(...args);
		this.initialize(...args);
	}

	initialize(x, y) {
		const width = this.windowWidth();
		const height = this.windowHeight();
		super.initialize(x, y, width, height);
		this._formationMode = false;
		this._pendingIndex = -1;
		this.refresh();
	}

	windowWidth() {
		return Graphics.boxWidth - 240;
	}

	windowHeight() {
		return Graphics.boxHeight;
	}

	maxItems() {
		return self.$gameParty.size();
	}

	itemHeight() {
		const clientHeight = this.height - this.padding * 2;
		return Math.floor(clientHeight / this.numVisibleRows());
	}

	numVisibleRows() {
		return 4;
	}

	loadImages() {
		self.$gameParty.members().forEach((actor) => {
			ImageManager.reserveFace(actor.faceName());
		}, this);
	}

	drawItem(index) {
		this.drawItemBackground(index);
		this.drawItemImage(index);
		this.drawItemStatus(index);
	}

	drawItemBackground(index) {
		if (index === this._pendingIndex) {
			const rect = this.itemRect(index);
			const color = this.pendingColor();
			this.changePaintOpacity(false);
			this.contents.fillRect(rect.x, rect.y, rect.width, rect.height, color);
			this.changePaintOpacity(true);
		}
	}

	drawItemImage(index) {
		const actor = self.$gameParty.members()[index];
		const rect = this.itemRect(index);
		this.changePaintOpacity(actor.isBattleMember());
		this.drawActorFace(
			actor,
			rect.x + 1,
			rect.y + 1,
			Window_Base._faceWidth,
			Window_Base._faceHeight
		);
		this.changePaintOpacity(true);
	}

	drawItemStatus(index) {
		const actor = self.$gameParty.members()[index];
		const rect = this.itemRect(index);
		const x = rect.x + 162;
		const y = rect.y + rect.height / 2 - this.lineHeight() * 1.5;
		const width = rect.width - x - this.textPadding();
		this.drawActorSimpleStatus(actor, x, y, width);
	}

	processOk() {
		super.processOk();
		self.$gameParty.setMenuActor(self.$gameParty.members()[this.index()]);
	}

	isCurrentItemEnabled() {
		if (this._formationMode) {
			const actor = self.$gameParty.members()[this.index()];
			return actor && actor.isFormationChangeOk();
		} else {
			return true;
		}
	}

	selectLast() {
		this.select(self.$gameParty.menuActor().index() || 0);
	}

	formationMode() {
		return this._formationMode;
	}

	setFormationMode(formationMode) {
		this._formationMode = formationMode;
	}

	pendingIndex() {
		return this._pendingIndex;
	}

	setPendingIndex(index) {
		const lastPendingIndex = this._pendingIndex;
		this._pendingIndex = index;
		this.redrawItem(this._pendingIndex);
		this.redrawItem(lastPendingIndex);
	}
}

export default Window_MenuStatus;
