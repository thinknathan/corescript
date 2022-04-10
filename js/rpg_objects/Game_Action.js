//-----------------------------------------------------------------------------
// Game_Action
//
// The game object class for a battle action.

class Game_Action {
	constructor(...args) {
		this.initialize(...args);
	}

	initialize(subject, forcing) {
		this._subjectActorId = 0;
		this._subjectEnemyIndex = -1;
		this._forcing = forcing || false;
		this.setSubject(subject);
		this.clear();
	}

	clear() {
		this._item = new Game_Item();
		this._targetIndex = -1;
	}

	setSubject(subject) {
		if (subject.isActor()) {
			this._subjectActorId = subject.actorId();
			this._subjectEnemyIndex = -1;
		} else {
			this._subjectEnemyIndex = subject.index();
			this._subjectActorId = 0;
		}
	}

	subject() {
		if (this._subjectActorId > 0) {
			return $gameActors.actor(this._subjectActorId);
		} else {
			return $gameTroop.members()[this._subjectEnemyIndex];
		}
	}

	friendsUnit() {
		return this.subject()
			.friendsUnit();
	}

	opponentsUnit() {
		return this.subject()
			.opponentsUnit();
	}

	setEnemyAction(action) {
		if (action) {
			this.setSkill(action.skillId);
		} else {
			this.clear();
		}
	}

	setAttack() {
		this.setSkill(this.subject()
			.attackSkillId());
	}

	setGuard() {
		this.setSkill(this.subject()
			.guardSkillId());
	}

	setSkill(skillId) {
		this._item.setObject($dataSkills[skillId]);
	}

	setItem(itemId) {
		this._item.setObject($dataItems[itemId]);
	}

	setItemObject(object) {
		this._item.setObject(object);
	}

	setTarget(targetIndex) {
		this._targetIndex = targetIndex;
	}

	item() {
		return this._item.object();
	}

	isSkill() {
		return this._item.isSkill();
	}

	isItem() {
		return this._item.isItem();
	}

	numRepeats() {
		let repeats = this.item()
			.repeats;
		if (this.isAttack()) {
			repeats += this.subject()
				.attackTimesAdd();
		}
		return Math.floor(repeats);
	}

	checkItemScope(list) {
		return list.contains(this.item()
			.scope);
	}

	isForOpponent() {
		return this.checkItemScope([1, 2, 3, 4, 5, 6]);
	}

	isForFriend() {
		return this.checkItemScope([7, 8, 9, 10, 11]);
	}

	isForDeadFriend() {
		return this.checkItemScope([9, 10]);
	}

	isForUser() {
		return this.checkItemScope([11]);
	}

	isForOne() {
		return this.checkItemScope([1, 3, 7, 9, 11]);
	}

	isForRandom() {
		return this.checkItemScope([3, 4, 5, 6]);
	}

	isForAll() {
		return this.checkItemScope([2, 8, 10]);
	}

	needsSelection() {
		return this.checkItemScope([1, 7, 9]);
	}

	numTargets() {
		return this.isForRandom() ? this.item()
			.scope - 2 : 0;
	}

	checkDamageType(list) {
		return list.contains(this.item()
			.damage.type);
	}

	isHpEffect() {
		return this.checkDamageType([1, 3, 5]);
	}

	isMpEffect() {
		return this.checkDamageType([2, 4, 6]);
	}

	isDamage() {
		return this.checkDamageType([1, 2]);
	}

	isRecover() {
		return this.checkDamageType([3, 4]);
	}

	isDrain() {
		return this.checkDamageType([5, 6]);
	}

	isHpRecover() {
		return this.checkDamageType([3]);
	}

	isMpRecover() {
		return this.checkDamageType([4]);
	}

	isCertainHit() {
		return this.item()
			.hitType === Game_Action.HITTYPE_CERTAIN;
	}

	isPhysical() {
		return this.item()
			.hitType === Game_Action.HITTYPE_PHYSICAL;
	}

	isMagical() {
		return this.item()
			.hitType === Game_Action.HITTYPE_MAGICAL;
	}

	isAttack() {
		return this.item() === $dataSkills[this.subject()
			.attackSkillId()];
	}

	isGuard() {
		return this.item() === $dataSkills[this.subject()
			.guardSkillId()];
	}

	isMagicSkill() {
		if (this.isSkill()) {
			return $dataSystem.magicSkills.contains(this.item()
				.stypeId);
		} else {
			return false;
		}
	}

	decideRandomTarget() {
		let target;
		if (this.isForDeadFriend()) {
			target = this.friendsUnit()
				.randomDeadTarget();
		} else if (this.isForFriend()) {
			target = this.friendsUnit()
				.randomTarget();
		} else {
			target = this.opponentsUnit()
				.randomTarget();
		}
		if (target) {
			this._targetIndex = target.index();
		} else {
			this.clear();
		}
	}

	setConfusion() {
		this.setAttack();
	}

	prepare() {
		if (this.subject()
			.isConfused() && !this._forcing) {
			this.setConfusion();
		}
	}

	isValid() {
		return (this._forcing && this.item()) || this.subject()
			.canUse(this.item());
	}

	speed() {
		const agi = this.subject()
			.agi;
		let speed = agi + Math.randomInt(Math.floor(5 + agi / 4));
		if (this.item()) {
			speed += this.item()
				.speed;
		}
		if (this.isAttack()) {
			speed += this.subject()
				.attackSpeed();
		}
		return speed;
	}

	makeTargets() {
		let targets = [];
		if (!this._forcing && this.subject()
			.isConfused()) {
			targets = [this.confusionTarget()];
		} else if (this.isForOpponent()) {
			targets = this.targetsForOpponents();
		} else if (this.isForFriend()) {
			targets = this.targetsForFriends();
		}
		return this.repeatTargets(targets);
	}

	repeatTargets(targets) {
		const repeatedTargets = [];
		const repeats = this.numRepeats();

		for (const target of targets) {
			if (target) {
				for (let j = 0; j < repeats; j++) {
					repeatedTargets.push(target);
				}
			}
		}

		return repeatedTargets;
	}

	confusionTarget() {
		switch (this.subject()
			.confusionLevel()) {
		case 1:
			return this.opponentsUnit()
				.randomTarget();
		case 2:
			if (Math.randomInt(2) === 0) {
				return this.opponentsUnit()
					.randomTarget();
			}
			return this.friendsUnit()
				.randomTarget();
		default:
			return this.friendsUnit()
				.randomTarget();
		}
	}

	targetsForOpponents() {
		let targets = [];
		const unit = this.opponentsUnit();
		if (this.isForRandom()) {
			for (let i = 0; i < this.numTargets(); i++) {
				targets.push(unit.randomTarget());
			}
		} else if (this.isForOne()) {
			if (this._targetIndex < 0) {
				targets.push(unit.randomTarget());
			} else {
				targets.push(unit.smoothTarget(this._targetIndex));
			}
		} else {
			targets = unit.aliveMembers();
		}
		return targets;
	}

	targetsForFriends() {
		let targets = [];
		const unit = this.friendsUnit();
		if (this.isForUser()) {
			return [this.subject()];
		} else if (this.isForDeadFriend()) {
			if (this.isForOne()) {
				targets.push(unit.smoothDeadTarget(this._targetIndex));
			} else {
				targets = unit.deadMembers();
			}
		} else if (this.isForOne()) {
			if (this._targetIndex < 0) {
				targets.push(unit.randomTarget());
			} else {
				targets.push(unit.smoothTarget(this._targetIndex));
			}
		} else {
			targets = unit.aliveMembers();
		}
		return targets;
	}

	evaluate() {
		let value = 0;
		this.itemTargetCandidates()
			.forEach(function (target) {
				const targetValue = this.evaluateWithTarget(target);
				if (this.isForAll()) {
					value += targetValue;
				} else if (targetValue > value) {
					value = targetValue;
					this._targetIndex = target.index();
				}
			}, this);
		value *= this.numRepeats();
		if (value > 0) {
			value += Math.random();
		}
		return value;
	}

	itemTargetCandidates() {
		if (!this.isValid()) {
			return [];
		} else if (this.isForOpponent()) {
			return this.opponentsUnit()
				.aliveMembers();
		} else if (this.isForUser()) {
			return [this.subject()];
		} else if (this.isForDeadFriend()) {
			return this.friendsUnit()
				.deadMembers();
		} else {
			return this.friendsUnit()
				.aliveMembers();
		}
	}

	evaluateWithTarget(target) {
		if (this.isHpEffect()) {
			const value = this.makeDamageValue(target, false);
			if (this.isForOpponent()) {
				return value / Math.max(target.hp, 1);
			} else {
				const recovery = Math.min(-value, target.mhp - target.hp);
				return recovery / target.mhp;
			}
		}
	}

	testApply(target) {
		return (this.isForDeadFriend() === target.isDead() &&
			($gameParty.inBattle() || this.isForOpponent() ||
				(this.isHpRecover() && target.hp < target.mhp) ||
				(this.isMpRecover() && target.mp < target.mmp) ||
				(this.hasItemAnyValidEffects(target))));
	}

	hasItemAnyValidEffects(target) {
		return this.item()
			.effects.some(function (effect) {
				return this.testItemEffect(target, effect);
			}, this);
	}

	testItemEffect(target, {
		code,
		value1,
		value2,
		dataId
	}) {
		switch (code) {
		case Game_Action.EFFECT_RECOVER_HP:
			return target.hp < target.mhp || value1 < 0 || value2 < 0;
		case Game_Action.EFFECT_RECOVER_MP:
			return target.mp < target.mmp || value1 < 0 || value2 < 0;
		case Game_Action.EFFECT_ADD_STATE:
			return !target.isStateAffected(dataId);
		case Game_Action.EFFECT_REMOVE_STATE:
			return target.isStateAffected(dataId);
		case Game_Action.EFFECT_ADD_BUFF:
			return !target.isMaxBuffAffected(dataId);
		case Game_Action.EFFECT_ADD_DEBUFF:
			return !target.isMaxDebuffAffected(dataId);
		case Game_Action.EFFECT_REMOVE_BUFF:
			return target.isBuffAffected(dataId);
		case Game_Action.EFFECT_REMOVE_DEBUFF:
			return target.isDebuffAffected(dataId);
		case Game_Action.EFFECT_LEARN_SKILL:
			return target.isActor() && !target.isLearnedSkill(dataId);
		default:
			return true;
		}
	}

	itemCnt(target) {
		if (this.isPhysical() && target.canMove()) {
			return target.cnt;
		} else {
			return 0;
		}
	}

	itemMrf({
		mrf
	}) {
		if (this.isMagical()) {
			return mrf;
		} else {
			return 0;
		}
	}

	itemHit(target) {
		if (this.isPhysical()) {
			return this.item()
				.successRate * 0.01 * this.subject()
				.hit;
		} else {
			return this.item()
				.successRate * 0.01;
		}
	}

	itemEva({
		eva,
		mev
	}) {
		if (this.isPhysical()) {
			return eva;
		} else if (this.isMagical()) {
			return mev;
		} else {
			return 0;
		}
	}

	itemCri({
		cev
	}) {
		return this.item()
			.damage.critical ? this.subject()
			.cri * (1 - cev) : 0;
	}

	apply(target) {
		const result = target.result();
		this.subject()
			.clearResult();
		result.clear();
		result.used = this.testApply(target);
		result.missed = (result.used && Math.random() >= this.itemHit(target));
		result.evaded = (!result.missed && Math.random() < this.itemEva(target));
		result.physical = this.isPhysical();
		result.drain = this.isDrain();
		if (result.isHit()) {
			if (this.item()
				.damage.type > 0) {
				result.critical = (Math.random() < this.itemCri(target));
				const value = this.makeDamageValue(target, result.critical);
				this.executeDamage(target, value);
			}
			this.item()
				.effects.forEach(function (effect) {
					this.applyItemEffect(target, effect);
				}, this);
			this.applyItemUserEffect(target);
		}
	}

	makeDamageValue(target, critical) {
		const item = this.item();
		const baseValue = this.evalDamageFormula(target);
		let value = baseValue * this.calcElementRate(target);
		if (this.isPhysical()) {
			value *= target.pdr;
		}
		if (this.isMagical()) {
			value *= target.mdr;
		}
		if (baseValue < 0) {
			value *= target.rec;
		}
		if (critical) {
			value = this.applyCritical(value);
		}
		value = this.applyVariance(value, item.damage.variance);
		value = this.applyGuard(value, target);
		value = Math.round(value);
		return value;
	}

	evalDamageFormula(target) {
		try {
			/* jshint ignore:start */
			const item = this.item();
			const a = this.subject();
			const b = target;
			const v = $gameVariables._data;
			const sign = ([3, 4].contains(item.damage.type) ? -1 : 1);
			const value = Math.max(eval(item.damage.formula), 0) * sign;
			if (isNaN(value)) value = 0;
			return value;
			/* jshint ignore:end */
		} catch (e) {
			return 0;
		}
	}

	calcElementRate(target) {
		if (this.item()
			.damage.elementId < 0) {
			return this.elementsMaxRate(target, this.subject()
				.attackElements());
		} else {
			return target.elementRate(this.item()
				.damage.elementId);
		}
	}

	elementsMaxRate(target, elements) {
		if (elements.length > 0) {
			return Math.max.apply(null, elements.map(elementId => target.elementRate(elementId), this));
		} else {
			return 1;
		}
	}

	applyCritical(damage) {
		return damage * 3;
	}

	applyVariance(damage, variance) {
		const amp = Math.floor(Math.max(Math.abs(damage) * variance / 100, 0));
		const v = Math.randomInt(amp + 1) + Math.randomInt(amp + 1) - amp;
		return damage >= 0 ? damage + v : damage - v;
	}

	applyGuard(damage, target) {
		return damage / (damage > 0 && target.isGuard() ? 2 * target.grd : 1);
	}

	executeDamage(target, value) {
		const result = target.result();
		if (value === 0) {
			result.critical = false;
		}
		if (this.isHpEffect()) {
			this.executeHpDamage(target, value);
		}
		if (this.isMpEffect()) {
			this.executeMpDamage(target, value);
		}
	}

	executeHpDamage(target, value) {
		if (this.isDrain()) {
			value = Math.min(target.hp, value);
		}
		this.makeSuccess(target);
		target.gainHp(-value);
		if (value > 0) {
			target.onDamage(value);
		}
		this.gainDrainedHp(value);
	}

	executeMpDamage(target, value) {
		if (!this.isMpRecover()) {
			value = Math.min(target.mp, value);
		}
		if (value !== 0) {
			this.makeSuccess(target);
		}
		target.gainMp(-value);
		this.gainDrainedMp(value);
	}

	gainDrainedHp(value) {
		if (this.isDrain()) {
			let gainTarget = this.subject();
			if (this._reflectionTarget !== undefined) {
				gainTarget = this._reflectionTarget;
			}
			gainTarget.gainHp(value);
		}
	}

	gainDrainedMp(value) {
		if (this.isDrain()) {
			let gainTarget = this.subject();
			if (this._reflectionTarget !== undefined) {
				gainTarget = this._reflectionTarget;
			}
			gainTarget.gainMp(value);
		}
	}

	applyItemEffect(target, effect) {
		switch (effect.code) {
		case Game_Action.EFFECT_RECOVER_HP:
			this.itemEffectRecoverHp(target, effect);
			break;
		case Game_Action.EFFECT_RECOVER_MP:
			this.itemEffectRecoverMp(target, effect);
			break;
		case Game_Action.EFFECT_GAIN_TP:
			this.itemEffectGainTp(target, effect);
			break;
		case Game_Action.EFFECT_ADD_STATE:
			this.itemEffectAddState(target, effect);
			break;
		case Game_Action.EFFECT_REMOVE_STATE:
			this.itemEffectRemoveState(target, effect);
			break;
		case Game_Action.EFFECT_ADD_BUFF:
			this.itemEffectAddBuff(target, effect);
			break;
		case Game_Action.EFFECT_ADD_DEBUFF:
			this.itemEffectAddDebuff(target, effect);
			break;
		case Game_Action.EFFECT_REMOVE_BUFF:
			this.itemEffectRemoveBuff(target, effect);
			break;
		case Game_Action.EFFECT_REMOVE_DEBUFF:
			this.itemEffectRemoveDebuff(target, effect);
			break;
		case Game_Action.EFFECT_SPECIAL:
			this.itemEffectSpecial(target, effect);
			break;
		case Game_Action.EFFECT_GROW:
			this.itemEffectGrow(target, effect);
			break;
		case Game_Action.EFFECT_LEARN_SKILL:
			this.itemEffectLearnSkill(target, effect);
			break;
		case Game_Action.EFFECT_COMMON_EVENT:
			this.itemEffectCommonEvent(target, effect);
			break;
		}
	}

	itemEffectRecoverHp(target, {
		value1,
		value2
	}) {
		let value = (target.mhp * value1 + value2) * target.rec;
		if (this.isItem()) {
			value *= this.subject()
				.pha;
		}
		value = Math.floor(value);
		if (value !== 0) {
			target.gainHp(value);
			this.makeSuccess(target);
		}
	}

	itemEffectRecoverMp(target, {
		value1,
		value2
	}) {
		let value = (target.mmp * value1 + value2) * target.rec;
		if (this.isItem()) {
			value *= this.subject()
				.pha;
		}
		value = Math.floor(value);
		if (value !== 0) {
			target.gainMp(value);
			this.makeSuccess(target);
		}
	}

	itemEffectGainTp(target, {
		value1
	}) {
		const value = Math.floor(value1);
		if (value !== 0) {
			target.gainTp(value);
			this.makeSuccess(target);
		}
	}

	itemEffectAddState(target, effect) {
		if (effect.dataId === 0) {
			this.itemEffectAddAttackState(target, effect);
		} else {
			this.itemEffectAddNormalState(target, effect);
		}
	}

	itemEffectAddAttackState(target, {
		value1
	}) {
		this.subject()
			.attackStates()
			.forEach(stateId => {
				let chance = value1;
				chance *= target.stateRate(stateId);
				chance *= this.subject()
					.attackStatesRate(stateId);
				chance *= this.lukEffectRate(target);
				if (Math.random() < chance) {
					target.addState(stateId);
					this.makeSuccess(target);
				}
			}, target);
	}

	itemEffectAddNormalState(target, {
		value1,
		dataId
	}) {
		let chance = value1;
		if (!this.isCertainHit()) {
			chance *= target.stateRate(dataId);
			chance *= this.lukEffectRate(target);
		}
		if (Math.random() < chance) {
			target.addState(dataId);
			this.makeSuccess(target);
		}
	}

	itemEffectRemoveState(target, {
		value1,
		dataId
	}) {
		const chance = value1;
		if (Math.random() < chance) {
			target.removeState(dataId);
			this.makeSuccess(target);
		}
	}

	itemEffectAddBuff(target, {
		dataId,
		value1
	}) {
		target.addBuff(dataId, value1);
		this.makeSuccess(target);
	}

	itemEffectAddDebuff(target, {
		dataId,
		value1
	}) {
		const chance = target.debuffRate(dataId) * this.lukEffectRate(target);
		if (Math.random() < chance) {
			target.addDebuff(dataId, value1);
			this.makeSuccess(target);
		}
	}

	itemEffectRemoveBuff(target, {
		dataId
	}) {
		if (target.isBuffAffected(dataId)) {
			target.removeBuff(dataId);
			this.makeSuccess(target);
		}
	}

	itemEffectRemoveDebuff(target, {
		dataId
	}) {
		if (target.isDebuffAffected(dataId)) {
			target.removeBuff(dataId);
			this.makeSuccess(target);
		}
	}

	itemEffectSpecial(target, {
		dataId
	}) {
		if (dataId === Game_Action.SPECIAL_EFFECT_ESCAPE) {
			target.escape();
			this.makeSuccess(target);
		}
	}

	itemEffectGrow(target, {
		dataId,
		value1
	}) {
		target.addParam(dataId, Math.floor(value1));
		this.makeSuccess(target);
	}

	itemEffectLearnSkill(target, {
		dataId
	}) {
		if (target.isActor()) {
			target.learnSkill(dataId);
			this.makeSuccess(target);
		}
	}

	itemEffectCommonEvent(target, effect) {}

	makeSuccess(target) {
		target.result()
			.success = true;
	}

	applyItemUserEffect(target) {
		const value = Math.floor(this.item()
			.tpGain * this.subject()
			.tcr);
		this.subject()
			.gainSilentTp(value);
	}

	lukEffectRate({
		luk
	}) {
		return Math.max(1.0 + (this.subject()
			.luk - luk) * 0.001, 0.0);
	}

	applyGlobal() {
		this.item()
			.effects.forEach(({
				code,
				dataId
			}) => {
				if (code === Game_Action.EFFECT_COMMON_EVENT) {
					$gameTemp.reserveCommonEvent(dataId);
				}
			}, this);
	}
}

Game_Action.EFFECT_RECOVER_HP = 11;
Game_Action.EFFECT_RECOVER_MP = 12;
Game_Action.EFFECT_GAIN_TP = 13;
Game_Action.EFFECT_ADD_STATE = 21;
Game_Action.EFFECT_REMOVE_STATE = 22;
Game_Action.EFFECT_ADD_BUFF = 31;
Game_Action.EFFECT_ADD_DEBUFF = 32;
Game_Action.EFFECT_REMOVE_BUFF = 33;
Game_Action.EFFECT_REMOVE_DEBUFF = 34;
Game_Action.EFFECT_SPECIAL = 41;
Game_Action.EFFECT_GROW = 42;
Game_Action.EFFECT_LEARN_SKILL = 43;
Game_Action.EFFECT_COMMON_EVENT = 44;
Game_Action.SPECIAL_EFFECT_ESCAPE = 0;
Game_Action.HITTYPE_CERTAIN = 0;
Game_Action.HITTYPE_PHYSICAL = 1;
Game_Action.HITTYPE_MAGICAL = 2;

export default Game_Action;
