//-----------------------------------------------------------------------------
// Game_BattlerBase
//
// The superclass of Game_Battler. It mainly contains parameters calculation.

class Game_BattlerBase {
	constructor(...args) {
		this.initialize(...args);
	}

	initialize() {
		this.initMembers();
	}

	initMembers() {
		this._hp = 1;
		this._mp = 0;
		this._tp = 0;
		this._hidden = false;
		this.clearParamPlus();
		this.clearStates();
		this.clearBuffs();
	}

	clearParamPlus() {
		this._paramPlus = [0, 0, 0, 0, 0, 0, 0, 0];
	}

	clearStates() {
		this._states = [];
		this._stateTurns = {};
	}

	eraseState(stateId) {
		const index = this._states.indexOf(stateId);
		if (index >= 0) {
			this._states.splice(index, 1);
		}
		delete this._stateTurns[stateId];
	}

	isStateAffected(stateId) {
		return this._states.contains(stateId);
	}

	isDeathStateAffected() {
		return this.isStateAffected(this.deathStateId());
	}

	deathStateId() {
		return 1;
	}

	resetStateCounts(stateId) {
		const state = $dataStates[stateId];
		const variance = 1 + Math.max(state.maxTurns - state.minTurns, 0);
		this._stateTurns[stateId] = state.minTurns + Math.randomInt(variance);
	}

	isStateExpired(stateId) {
		return this._stateTurns[stateId] === 0;
	}

	updateStateTurns() {
		this._states.forEach(function (stateId) {
			if (this._stateTurns[stateId] > 0) {
				this._stateTurns[stateId]--;
			}
		}, this);
	}

	clearBuffs() {
		this._buffs = [0, 0, 0, 0, 0, 0, 0, 0];
		this._buffTurns = [0, 0, 0, 0, 0, 0, 0, 0];
	}

	eraseBuff(paramId) {
		this._buffs[paramId] = 0;
		this._buffTurns[paramId] = 0;
	}

	buffLength() {
		return this._buffs.length;
	}

	buff(paramId) {
		return this._buffs[paramId];
	}

	isBuffAffected(paramId) {
		return this._buffs[paramId] > 0;
	}

	isDebuffAffected(paramId) {
		return this._buffs[paramId] < 0;
	}

	isBuffOrDebuffAffected(paramId) {
		return this._buffs[paramId] !== 0;
	}

	isMaxBuffAffected(paramId) {
		return this._buffs[paramId] === 2;
	}

	isMaxDebuffAffected(paramId) {
		return this._buffs[paramId] === -2;
	}

	increaseBuff(paramId) {
		if (!this.isMaxBuffAffected(paramId)) {
			this._buffs[paramId]++;
		}
	}

	decreaseBuff(paramId) {
		if (!this.isMaxDebuffAffected(paramId)) {
			this._buffs[paramId]--;
		}
	}

	overwriteBuffTurns(paramId, turns) {
		if (this._buffTurns[paramId] < turns) {
			this._buffTurns[paramId] = turns;
		}
	}

	isBuffExpired(paramId) {
		return this._buffTurns[paramId] === 0;
	}

	updateBuffTurns() {
		for (let i = 0; i < this._buffTurns.length; i++) {
			if (this._buffTurns[i] > 0) {
				this._buffTurns[i]--;
			}
		}
	}

	die() {
		this._hp = 0;
		this.clearStates();
		this.clearBuffs();
	}

	revive() {
		if (this._hp === 0) {
			this._hp = 1;
		}
	}

	states() {
		return this._states.map(id => $dataStates[id]);
	}

	stateIcons() {
		return this.states()
			.map(({
				iconIndex
			}) => iconIndex)
			.filter(iconIndex => iconIndex > 0);
	}

	buffIcons() {
		const icons = [];
		for (let i = 0; i < this._buffs.length; i++) {
			if (this._buffs[i] !== 0) {
				icons.push(this.buffIconIndex(this._buffs[i], i));
			}
		}
		return icons;
	}

	buffIconIndex(buffLevel, paramId) {
		if (buffLevel > 0) {
			return Game_BattlerBase.ICON_BUFF_START + (buffLevel - 1) * 8 + paramId;
		} else if (buffLevel < 0) {
			return Game_BattlerBase.ICON_DEBUFF_START + (-buffLevel - 1) * 8 + paramId;
		} else {
			return 0;
		}
	}

	allIcons() {
		return this.stateIcons()
			.concat(this.buffIcons());
	}

	traitObjects() {
		// Returns an array of the all objects having traits. States only here.
		return this.states();
	}

	allTraits() {
		return this.traitObjects()
			.reduce((r, {
				traits
			}) => r.concat(traits), []);
	}

	traits(code) {
		return this.allTraits()
			.filter(trait => trait.code === code);
	}

	traitsWithId(code, id) {
		return this.allTraits()
			.filter(trait => trait.code === code && trait.dataId === id);
	}

	traitsPi(code, id) {
		return this.traitsWithId(code, id)
			.reduce((r, {
				value
			}) => r * value, 1);
	}

	traitsSum(code, id) {
		return this.traitsWithId(code, id)
			.reduce((r, {
				value
			}) => r + value, 0);
	}

	traitsSumAll(code) {
		return this.traits(code)
			.reduce((r, {
				value
			}) => r + value, 0);
	}

	traitsSet(code) {
		return this.traits(code)
			.reduce((r, {
				dataId
			}) => r.concat(dataId), []);
	}

	paramBase(paramId) {
		return 0;
	}

	paramPlus(paramId) {
		return this._paramPlus[paramId];
	}

	paramMin(paramId) {
		if (paramId === 1) {
			return 0; // MMP
		} else {
			return 1;
		}
	}

	paramMax(paramId) {
		if (paramId === 0) {
			return 999999; // MHP
		} else if (paramId === 1) {
			return 9999; // MMP
		} else {
			return 999;
		}
	}

	paramRate(paramId) {
		return this.traitsPi(Game_BattlerBase.TRAIT_PARAM, paramId);
	}

	paramBuffRate(paramId) {
		return this._buffs[paramId] * 0.25 + 1.0;
	}

	param(paramId) {
		let value = this.paramBase(paramId) + this.paramPlus(paramId);
		value *= this.paramRate(paramId) * this.paramBuffRate(paramId);
		const maxValue = this.paramMax(paramId);
		const minValue = this.paramMin(paramId);
		return Math.round(value.clamp(minValue, maxValue));
	}

	xparam(xparamId) {
		return this.traitsSum(Game_BattlerBase.TRAIT_XPARAM, xparamId);
	}

	sparam(sparamId) {
		return this.traitsPi(Game_BattlerBase.TRAIT_SPARAM, sparamId);
	}

	elementRate(elementId) {
		return this.traitsPi(Game_BattlerBase.TRAIT_ELEMENT_RATE, elementId);
	}

	debuffRate(paramId) {
		return this.traitsPi(Game_BattlerBase.TRAIT_DEBUFF_RATE, paramId);
	}

	stateRate(stateId) {
		return this.traitsPi(Game_BattlerBase.TRAIT_STATE_RATE, stateId);
	}

	stateResistSet() {
		return this.traitsSet(Game_BattlerBase.TRAIT_STATE_RESIST);
	}

	isStateResist(stateId) {
		return this.stateResistSet()
			.contains(stateId);
	}

	attackElements() {
		return this.traitsSet(Game_BattlerBase.TRAIT_ATTACK_ELEMENT);
	}

	attackStates() {
		return this.traitsSet(Game_BattlerBase.TRAIT_ATTACK_STATE);
	}

	attackStatesRate(stateId) {
		return this.traitsSum(Game_BattlerBase.TRAIT_ATTACK_STATE, stateId);
	}

	attackSpeed() {
		return this.traitsSumAll(Game_BattlerBase.TRAIT_ATTACK_SPEED);
	}

	attackTimesAdd() {
		return Math.max(this.traitsSumAll(Game_BattlerBase.TRAIT_ATTACK_TIMES), 0);
	}

	addedSkillTypes() {
		return this.traitsSet(Game_BattlerBase.TRAIT_STYPE_ADD);
	}

	isSkillTypeSealed(stypeId) {
		return this.traitsSet(Game_BattlerBase.TRAIT_STYPE_SEAL)
			.contains(stypeId);
	}

	addedSkills() {
		return this.traitsSet(Game_BattlerBase.TRAIT_SKILL_ADD);
	}

	isSkillSealed(skillId) {
		return this.traitsSet(Game_BattlerBase.TRAIT_SKILL_SEAL)
			.contains(skillId);
	}

	isEquipWtypeOk(wtypeId) {
		return this.traitsSet(Game_BattlerBase.TRAIT_EQUIP_WTYPE)
			.contains(wtypeId);
	}

	isEquipAtypeOk(atypeId) {
		return this.traitsSet(Game_BattlerBase.TRAIT_EQUIP_ATYPE)
			.contains(atypeId);
	}

	isEquipTypeLocked(etypeId) {
		return this.traitsSet(Game_BattlerBase.TRAIT_EQUIP_LOCK)
			.contains(etypeId);
	}

	isEquipTypeSealed(etypeId) {
		return this.traitsSet(Game_BattlerBase.TRAIT_EQUIP_SEAL)
			.contains(etypeId);
	}

	slotType() {
		const set = this.traitsSet(Game_BattlerBase.TRAIT_SLOT_TYPE);
		return set.length > 0 ? Math.max.apply(null, set) : 0;
	}

	isDualWield() {
		return this.slotType() === 1;
	}

	actionPlusSet() {
		return this.traits(Game_BattlerBase.TRAIT_ACTION_PLUS)
			.map(({
				value
			}) => value);
	}

	specialFlag(flagId) {
		return this.traits(Game_BattlerBase.TRAIT_SPECIAL_FLAG)
			.some(({
				dataId
			}) => dataId === flagId);
	}

	collapseType() {
		const set = this.traitsSet(Game_BattlerBase.TRAIT_COLLAPSE_TYPE);
		return set.length > 0 ? Math.max.apply(null, set) : 0;
	}

	partyAbility(abilityId) {
		return this.traits(Game_BattlerBase.TRAIT_PARTY_ABILITY)
			.some(({
				dataId
			}) => dataId === abilityId);
	}

	isAutoBattle() {
		return this.specialFlag(Game_BattlerBase.FLAG_ID_AUTO_BATTLE);
	}

	isGuard() {
		return this.specialFlag(Game_BattlerBase.FLAG_ID_GUARD) && this.canMove();
	}

	isSubstitute() {
		return this.specialFlag(Game_BattlerBase.FLAG_ID_SUBSTITUTE) && this.canMove();
	}

	isPreserveTp() {
		return this.specialFlag(Game_BattlerBase.FLAG_ID_PRESERVE_TP);
	}

	addParam(paramId, value) {
		this._paramPlus[paramId] += value;
		this.refresh();
	}

	setHp(hp) {
		this._hp = hp;
		this.refresh();
	}

	setMp(mp) {
		this._mp = mp;
		this.refresh();
	}

	setTp(tp) {
		this._tp = tp;
		this.refresh();
	}

	maxTp() {
		return 100;
	}

	refresh() {
		this.stateResistSet()
			.forEach(function (stateId) {
				this.eraseState(stateId);
			}, this);
		this._hp = this._hp.clamp(0, this.mhp);
		this._mp = this._mp.clamp(0, this.mmp);
		this._tp = this._tp.clamp(0, this.maxTp());
	}

	recoverAll() {
		this.clearStates();
		this._hp = this.mhp;
		this._mp = this.mmp;
	}

	hpRate() {
		return this.hp / this.mhp;
	}

	mpRate() {
		return this.mmp > 0 ? this.mp / this.mmp : 0;
	}

	tpRate() {
		return this.tp / this.maxTp();
	}

	hide() {
		this._hidden = true;
	}

	appear() {
		this._hidden = false;
	}

	isHidden() {
		return this._hidden;
	}

	isAppeared() {
		return !this.isHidden();
	}

	isDead() {
		return this.isAppeared() && this.isDeathStateAffected();
	}

	isAlive() {
		return this.isAppeared() && !this.isDeathStateAffected();
	}

	isDying() {
		return this.isAlive() && this._hp < this.mhp / 4;
	}

	isRestricted() {
		return this.isAppeared() && this.restriction() > 0;
	}

	canInput() {
		return this.isAppeared() && !this.isRestricted() && !this.isAutoBattle();
	}

	canMove() {
		return this.isAppeared() && this.restriction() < 4;
	}

	isConfused() {
		return this.isAppeared() && this.restriction() >= 1 && this.restriction() <= 3;
	}

	confusionLevel() {
		return this.isConfused() ? this.restriction() : 0;
	}

	isActor() {
		return false;
	}

	isEnemy() {
		return false;
	}

	sortStates() {
		this._states.sort((a, b) => {
			const p1 = $dataStates[a].priority;
			const p2 = $dataStates[b].priority;
			if (p1 !== p2) {
				return p2 - p1;
			}
			return a - b;
		});
	}

	restriction() {
		return Math.max.apply(null, this.states()
			.map(({
				restriction
			}) => restriction)
			.concat(0));
	}

	addNewState(stateId) {
		if (stateId === this.deathStateId()) {
			this.die();
		}
		const restricted = this.isRestricted();
		this._states.push(stateId);
		this.sortStates();
		if (!restricted && this.isRestricted()) {
			this.onRestrict();
		}
	}

	onRestrict() {}

	mostImportantStateText() {
		const states = this.states();
		for (let i = 0; i < states.length; i++) {
			if (states[i].message3) {
				return states[i].message3;
			}
		}
		return '';
	}

	stateMotionIndex() {
		const states = this.states();
		if (states.length > 0) {
			return states[0].motion;
		} else {
			return 0;
		}
	}

	stateOverlayIndex() {
		const states = this.states();
		if (states.length > 0) {
			return states[0].overlay;
		} else {
			return 0;
		}
	}

	isSkillWtypeOk(skill) {
		return true;
	}

	skillMpCost({
		mpCost
	}) {
		return Math.floor(mpCost * this.mcr);
	}

	skillTpCost({
		tpCost
	}) {
		return tpCost;
	}

	canPaySkillCost(skill) {
		return this._tp >= this.skillTpCost(skill) && this._mp >= this.skillMpCost(skill);
	}

	paySkillCost(skill) {
		this._mp -= this.skillMpCost(skill);
		this._tp -= this.skillTpCost(skill);
	}

	isOccasionOk({
		occasion
	}) {
		if ($gameParty.inBattle()) {
			return occasion === 0 || occasion === 1;
		} else {
			return occasion === 0 || occasion === 2;
		}
	}

	meetsUsableItemConditions(item) {
		return this.canMove() && this.isOccasionOk(item);
	}

	meetsSkillConditions(skill) {
		return (this.meetsUsableItemConditions(skill) &&
			this.isSkillWtypeOk(skill) && this.canPaySkillCost(skill) &&
			!this.isSkillSealed(skill.id) && !this.isSkillTypeSealed(skill.stypeId));
	}

	meetsItemConditions(item) {
		return this.meetsUsableItemConditions(item) && $gameParty.hasItem(item);
	}

	canUse(item) {
		if (!item) {
			return false;
		} else if (DataManager.isSkill(item)) {
			return this.meetsSkillConditions(item);
		} else if (DataManager.isItem(item)) {
			return this.meetsItemConditions(item);
		} else {
			return false;
		}
	}

	canEquip(item) {
		if (!item) {
			return false;
		} else if (DataManager.isWeapon(item)) {
			return this.canEquipWeapon(item);
		} else if (DataManager.isArmor(item)) {
			return this.canEquipArmor(item);
		} else {
			return false;
		}
	}

	canEquipWeapon({
		wtypeId,
		etypeId
	}) {
		return this.isEquipWtypeOk(wtypeId) && !this.isEquipTypeSealed(etypeId);
	}

	canEquipArmor({
		atypeId,
		etypeId
	}) {
		return this.isEquipAtypeOk(atypeId) && !this.isEquipTypeSealed(etypeId);
	}

	attackSkillId() {
		return 1;
	}

	guardSkillId() {
		return 2;
	}

	canAttack() {
		return this.canUse($dataSkills[this.attackSkillId()]);
	}

	canGuard() {
		return this.canUse($dataSkills[this.guardSkillId()]);
	}
}

Game_BattlerBase.TRAIT_ELEMENT_RATE = 11;
Game_BattlerBase.TRAIT_DEBUFF_RATE = 12;
Game_BattlerBase.TRAIT_STATE_RATE = 13;
Game_BattlerBase.TRAIT_STATE_RESIST = 14;
Game_BattlerBase.TRAIT_PARAM = 21;
Game_BattlerBase.TRAIT_XPARAM = 22;
Game_BattlerBase.TRAIT_SPARAM = 23;
Game_BattlerBase.TRAIT_ATTACK_ELEMENT = 31;
Game_BattlerBase.TRAIT_ATTACK_STATE = 32;
Game_BattlerBase.TRAIT_ATTACK_SPEED = 33;
Game_BattlerBase.TRAIT_ATTACK_TIMES = 34;
Game_BattlerBase.TRAIT_STYPE_ADD = 41;
Game_BattlerBase.TRAIT_STYPE_SEAL = 42;
Game_BattlerBase.TRAIT_SKILL_ADD = 43;
Game_BattlerBase.TRAIT_SKILL_SEAL = 44;
Game_BattlerBase.TRAIT_EQUIP_WTYPE = 51;
Game_BattlerBase.TRAIT_EQUIP_ATYPE = 52;
Game_BattlerBase.TRAIT_EQUIP_LOCK = 53;
Game_BattlerBase.TRAIT_EQUIP_SEAL = 54;
Game_BattlerBase.TRAIT_SLOT_TYPE = 55;
Game_BattlerBase.TRAIT_ACTION_PLUS = 61;
Game_BattlerBase.TRAIT_SPECIAL_FLAG = 62;
Game_BattlerBase.TRAIT_COLLAPSE_TYPE = 63;
Game_BattlerBase.TRAIT_PARTY_ABILITY = 64;
Game_BattlerBase.FLAG_ID_AUTO_BATTLE = 0;
Game_BattlerBase.FLAG_ID_GUARD = 1;
Game_BattlerBase.FLAG_ID_SUBSTITUTE = 2;
Game_BattlerBase.FLAG_ID_PRESERVE_TP = 3;
Game_BattlerBase.ICON_BUFF_START = 32;
Game_BattlerBase.ICON_DEBUFF_START = 48;

Object.defineProperties(Game_BattlerBase.prototype, {
	// Hit Points
	hp: {
		get() {
			return this._hp;
		},
		configurable: true
	},
	// Magic Points
	mp: {
		get() {
			return this._mp;
		},
		configurable: true
	},
	// Tactical Points
	tp: {
		get() {
			return this._tp;
		},
		configurable: true
	},
	// Maximum Hit Points
	mhp: {
		get() {
			return this.param(0);
		},
		configurable: true
	},
	// Maximum Magic Points
	mmp: {
		get() {
			return this.param(1);
		},
		configurable: true
	},
	// ATtacK power
	atk: {
		get() {
			return this.param(2);
		},
		configurable: true
	},
	// DEFense power
	def: {
		get() {
			return this.param(3);
		},
		configurable: true
	},
	// Magic ATtack power
	mat: {
		get() {
			return this.param(4);
		},
		configurable: true
	},
	// Magic DeFense power
	mdf: {
		get() {
			return this.param(5);
		},
		configurable: true
	},
	// AGIlity
	agi: {
		get() {
			return this.param(6);
		},
		configurable: true
	},
	// LUcK
	luk: {
		get() {
			return this.param(7);
		},
		configurable: true
	},
	// HIT rate
	hit: {
		get() {
			return this.xparam(0);
		},
		configurable: true
	},
	// EVAsion rate
	eva: {
		get() {
			return this.xparam(1);
		},
		configurable: true
	},
	// CRItical rate
	cri: {
		get() {
			return this.xparam(2);
		},
		configurable: true
	},
	// Critical EVasion rate
	cev: {
		get() {
			return this.xparam(3);
		},
		configurable: true
	},
	// Magic EVasion rate
	mev: {
		get() {
			return this.xparam(4);
		},
		configurable: true
	},
	// Magic ReFlection rate
	mrf: {
		get() {
			return this.xparam(5);
		},
		configurable: true
	},
	// CouNTer attack rate
	cnt: {
		get() {
			return this.xparam(6);
		},
		configurable: true
	},
	// Hp ReGeneration rate
	hrg: {
		get() {
			return this.xparam(7);
		},
		configurable: true
	},
	// Mp ReGeneration rate
	mrg: {
		get() {
			return this.xparam(8);
		},
		configurable: true
	},
	// Tp ReGeneration rate
	trg: {
		get() {
			return this.xparam(9);
		},
		configurable: true
	},
	// TarGet Rate
	tgr: {
		get() {
			return this.sparam(0);
		},
		configurable: true
	},
	// GuaRD effect rate
	grd: {
		get() {
			return this.sparam(1);
		},
		configurable: true
	},
	// RECovery effect rate
	rec: {
		get() {
			return this.sparam(2);
		},
		configurable: true
	},
	// PHArmacology
	pha: {
		get() {
			return this.sparam(3);
		},
		configurable: true
	},
	// Mp Cost Rate
	mcr: {
		get() {
			return this.sparam(4);
		},
		configurable: true
	},
	// Tp Charge Rate
	tcr: {
		get() {
			return this.sparam(5);
		},
		configurable: true
	},
	// Physical Damage Rate
	pdr: {
		get() {
			return this.sparam(6);
		},
		configurable: true
	},
	// Magical Damage Rate
	mdr: {
		get() {
			return this.sparam(7);
		},
		configurable: true
	},
	// Floor Damage Rate
	fdr: {
		get() {
			return this.sparam(8);
		},
		configurable: true
	},
	// EXperience Rate
	exr: {
		get() {
			return this.sparam(9);
		},
		configurable: true
	}
});

export default Game_BattlerBase;
