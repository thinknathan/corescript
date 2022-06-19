import Window_BattleStatus from "./Window_BattleStatus.js";

//-----------------------------------------------------------------------------
// Window_BattleActor
//
// The window for selecting a target actor on the battle screen.

class Window_BattleActor extends Window_BattleStatus {
	constructor(...args) {
		super(...args);
		this.initialize(...args);
	}

	initialize(x, y) {
		super.initialize();
		this.x = x;
		this.y = y;
		this.openness = 255;
		this.hide();
	}

	show() {
		this.select(0);
		super.show();
	}

	hide() {
		super.hide();
		self.$gameParty.select(null);
	}

	select(index) {
		super.select(index);
		self.$gameParty.select(this.actor());
	}

	actor() {
		return self.$gameParty.members()[this.index()];
	}
}

export default Window_BattleActor;
