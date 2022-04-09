//-----------------------------------------------------------------------------
// Window_BattleSkill
//
// The window for selecting a skill to use on the battle screen.

class Window_BattleSkill extends Window_SkillList {
	constructor(...args) {
		super(...args);
		this.initialize(...args);
	}

	initialize(x, y, width, height) {
		super.initialize(x, y, width, height);
		this.hide();
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
