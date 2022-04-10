import Window_Selectable from "./Window_Selectable.js";

//-----------------------------------------------------------------------------
// Window_BattleStatus
//
// The window for displaying the status of party members on the battle screen.

class Window_BattleStatus extends Window_Selectable {
	constructor(...args) {
		super(...args);
		this.initialize(...args);
	}

	initialize() {
		const width = this.windowWidth();
		const height = this.windowHeight();
		const x = Graphics.boxWidth - width;
		const y = Graphics.boxHeight - height;
		super.initialize(x, y, width, height);
		this.refresh();
		this.openness = 0;
	}

	windowWidth() {
		return Graphics.boxWidth - 192;
	}

	windowHeight() {
		return this.fittingHeight(this.numVisibleRows());
	}

	numVisibleRows() {
		return 4;
	}

	maxItems() {
		return self.$gameParty.battleMembers()
			.length;
	}

	refresh() {
		this.contents.clear();
		this.drawAllItems();
	}

	drawItem(index) {
		const actor = self.$gameParty.battleMembers()[index];
		this.drawBasicArea(this.basicAreaRect(index), actor);
		this.drawGaugeArea(this.gaugeAreaRect(index), actor);
	}

	basicAreaRect(index) {
		const rect = this.itemRectForText(index);
		rect.width -= this.gaugeAreaWidth() + 15;
		return rect;
	}

	gaugeAreaRect(index) {
		const rect = this.itemRectForText(index);
		rect.x += rect.width - this.gaugeAreaWidth();
		rect.width = this.gaugeAreaWidth();
		return rect;
	}

	gaugeAreaWidth() {
		return 330;
	}

	drawBasicArea({
		x,
		y,
		width
	}, actor) {
		this.drawActorName(actor, x + 0, y, 150);
		this.drawActorIcons(actor, x + 156, y, width - 156);
	}

	drawGaugeArea(rect, actor) {
		if (self.$dataSystem.optDisplayTp) {
			this.drawGaugeAreaWithTp(rect, actor);
		} else {
			this.drawGaugeAreaWithoutTp(rect, actor);
		}
	}

	drawGaugeAreaWithTp({
		x,
		y
	}, actor) {
		this.drawActorHp(actor, x + 0, y, 108);
		this.drawActorMp(actor, x + 123, y, 96);
		this.drawActorTp(actor, x + 234, y, 96);
	}

	drawGaugeAreaWithoutTp({
		x,
		y
	}, actor) {
		this.drawActorHp(actor, x + 0, y, 201);
		this.drawActorMp(actor, x + 216, y, 114);
	}
}

export default Window_BattleStatus;
