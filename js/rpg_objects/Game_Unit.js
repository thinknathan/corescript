//-----------------------------------------------------------------------------
// Game_Unit
//
// The superclass of Game_Party and Game_Troop.

class Game_Unit {
	constructor(...args) {
		this.initialize(...args);
	}

	initialize() {
		this._inBattle = false;
	}

	inBattle() {
		return this._inBattle;
	}

	members() {
		return [];
	}

	aliveMembers() {
		return this.members()
			.filter(member => member.isAlive());
	}

	deadMembers() {
		return this.members()
			.filter(member => member.isDead());
	}

	movableMembers() {
		return this.members()
			.filter(member => member.canMove());
	}

	clearActions() {
		return this.members()
			.forEach(member => member.clearActions());
	}

	agility() {
		const members = this.members();
		if (members.length === 0) {
			return 1;
		}
		const sum = members.reduce((r, {
			agi
		}) => r + agi, 0);
		return sum / members.length;
	}

	tgrSum() {
		return this.aliveMembers()
			.reduce((r, {
				tgr
			}) => r + tgr, 0);
	}

	randomTarget() {
		let tgrRand = Math.random() * this.tgrSum();
		let target = null;
		this.aliveMembers()
			.forEach(member => {
				tgrRand -= member.tgr;
				if (tgrRand <= 0 && !target) {
					target = member;
				}
			});
		return target;
	}

	randomDeadTarget() {
		const members = this.deadMembers();
		if (members.length === 0) {
			return null;
		}
		return members[Math.floor(Math.random() * members.length)];
	}

	smoothTarget(index) {
		if (index < 0) {
			index = 0;
		}
		const member = this.members()[index];
		return (member && member.isAlive()) ? member : this.aliveMembers()[0];
	}

	smoothDeadTarget(index) {
		if (index < 0) {
			index = 0;
		}
		const member = this.members()[index];
		return (member && member.isDead()) ? member : this.deadMembers()[0];
	}

	clearResults() {
		this.members()
			.forEach(member => {
				member.clearResult();
			});
	}

	onBattleStart() {
		this.members()
			.forEach(member => {
				member.onBattleStart();
			});
		this._inBattle = true;
	}

	onBattleEnd() {
		this._inBattle = false;
		this.members()
			.forEach(member => {
				member.onBattleEnd();
			});
	}

	makeActions() {
		this.members()
			.forEach(member => {
				member.makeActions();
			});
	}

	select(activeMember) {
		this.members()
			.forEach(member => {
				if (member === activeMember) {
					member.select();
				} else {
					member.deselect();
				}
			});
	}

	isAllDead() {
		return this.aliveMembers()
			.length === 0;
	}

	substituteBattler() {
		const members = this.members();
		for (let i = 0; i < members.length; i++) {
			if (members[i].isSubstitute()) {
				return members[i];
			}
		}
	}
}

self.Game_Unit = Game_Unit;
