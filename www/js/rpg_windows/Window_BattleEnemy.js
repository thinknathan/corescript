import Window_Selectable from './Window_Selectable.js';
import Graphics from '../rpg_core/Graphics.js';

//-----------------------------------------------------------------------------
// Window_BattleEnemy
//
// The window for selecting a target enemy on the battle screen.

class Window_BattleEnemy extends Window_Selectable {
	constructor(...args) {
		super(...args);
		this.initialize(...args);
	}

	initialize(x, y) {
		this._enemies = [];
		const width = this.windowWidth();
		const height = this.windowHeight();
		super.initialize(x, y, width, height);
		this.refresh();
		this.hide();
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

	maxCols() {
		return 2;
	}

	maxItems() {
		return this._enemies.length;
	}

	enemy() {
		return this._enemies[this.index()];
	}

	enemyIndex() {
		const enemy = this.enemy();
		return enemy ? enemy.index() : -1;
	}

	drawItem(index) {
		this.resetTextColor();
		const name = this._enemies[index].name();
		const rect = this.itemRectForText(index);
		this.drawText(name, rect.x, rect.y, rect.width);
	}

	show() {
		this.refresh();
		this.select(0);
		super.show();
	}

	hide() {
		super.hide();
		self.$gameTroop.select(null);
	}

	refresh() {
		this._enemies = self.$gameTroop.aliveMembers();
		super.refresh();
	}

	select(index) {
		super.select(index);
		self.$gameTroop.select(this.enemy());
	}
}

export default Window_BattleEnemy;
