import Window_Command from './Window_Command.js';

//-----------------------------------------------------------------------------
// Window_SkillType
//
// The window for selecting a skill type on the skill screen.

class Window_SkillType extends Window_Command {
	constructor(...args) {
		super(...args);
		this.initialize(...args);
	}

	initialize(x, y) {
		super.initialize(x, y);
		this._actor = null;
	}

	windowWidth() {
		return 240;
	}

	setActor(actor) {
		if (this._actor !== actor) {
			this._actor = actor;
			this.refresh();
			this.selectLast();
		}
	}

	numVisibleRows() {
		return 4;
	}

	makeCommandList() {
		if (this._actor) {
			const skillTypes = this._actor.addedSkillTypes();
			skillTypes.sort((a, b) => a - b);
			skillTypes.forEach(function (stypeId) {
				const name = self.$dataSystem.skillTypes[stypeId];
				this.addCommand(name, 'skill', true, stypeId);
			}, this);
		}
	}

	update() {
		super.update();
		if (this._skillWindow) {
			this._skillWindow.setStypeId(this.currentExt());
		}
	}

	setSkillWindow(skillWindow) {
		this._skillWindow = skillWindow;
	}

	selectLast() {
		const skill = this._actor.lastMenuSkill();
		if (skill) {
			this.selectExt(skill.stypeId);
		} else {
			this.select(0);
		}
	}
}

export default Window_SkillType;
