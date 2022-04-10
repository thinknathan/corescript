import Game_Unit from "./Game_Unit.js";
import TextManager from "../rpg_managers/TextManager.js";
import { DataManager } from "../rpg_managers/DataManager.js";
import Game_Item from "../rpg_objects/Game_Item.js";

//-----------------------------------------------------------------------------
// Game_Party
//
// The game object class for the party. Information such as gold and items is
// included.

class Game_Party extends Game_Unit {
	constructor(...args) {
		super(...args);
		this.initialize(...args);
	}

	initialize() {
		super.initialize();
		this._gold = 0;
		this._steps = 0;
		this._lastItem = new Game_Item();
		this._menuActorId = 0;
		this._targetActorId = 0;
		this._actors = [];
		this.initAllItems();
	}

	initAllItems() {
		this._items = {};
		this._weapons = {};
		this._armors = {};
	}

	exists() {
		return this._actors.length > 0;
	}

	size() {
		return this.members()
			.length;
	}

	isEmpty() {
		return this.size() === 0;
	}

	members() {
		return this.inBattle() ? this.battleMembers() : this.allMembers();
	}

	allMembers() {
		return this._actors.map(id => self.$gameActors.actor(id));
	}

	battleMembers() {
		return this.allMembers()
			.slice(0, this.maxBattleMembers())
			.filter(actor => actor.isAppeared());
	}

	maxBattleMembers() {
		return 4;
	}

	leader() {
		return this.battleMembers()[0];
	}

	reviveBattleMembers() {
		this.battleMembers()
			.forEach(actor => {
				if (actor.isDead()) {
					actor.setHp(1);
				}
			});
	}

	items() {
		const list = [];
		for (let id in this._items) {
			list.push(self.$dataItems[id]);
		}
		return list;
	}

	weapons() {
		const list = [];
		for (let id in this._weapons) {
			list.push(self.$dataWeapons[id]);
		}
		return list;
	}

	armors() {
		const list = [];
		for (let id in this._armors) {
			list.push(self.$dataArmors[id]);
		}
		return list;
	}

	equipItems() {
		return this.weapons()
			.concat(this.armors());
	}

	allItems() {
		return this.items()
			.concat(this.equipItems());
	}

	itemContainer(item) {
		if (!item) {
			return null;
		} else if (DataManager.isItem(item)) {
			return this._items;
		} else if (DataManager.isWeapon(item)) {
			return this._weapons;
		} else if (DataManager.isArmor(item)) {
			return this._armors;
		} else {
			return null;
		}
	}

	setupStartingMembers() {
		this._actors = [];
		self.$dataSystem.partyMembers.forEach(function (actorId) {
			if (self.$gameActors.actor(actorId)) {
				this._actors.push(actorId);
			}
		}, this);
	}

	name() {
		const numBattleMembers = this.battleMembers()
			.length;
		if (numBattleMembers === 0) {
			return '';
		} else if (numBattleMembers === 1) {
			return this.leader()
				.name();
		} else {
			return TextManager.partyName.format(this.leader()
				.name());
		}
	}

	setupBattleTest() {
		this.setupBattleTestMembers();
		this.setupBattleTestItems();
	}

	setupBattleTestMembers() {
		self.$dataSystem.testBattlers.forEach(function ({
			actorId,
			level,
			equips
		}) {
			const actor = self.$gameActors.actor(actorId);
			if (actor) {
				actor.changeLevel(level, false);
				actor.initEquips(equips);
				actor.recoverAll();
				this.addActor(actorId);
			}
		}, this);
	}

	setupBattleTestItems() {
		self.$dataItems.forEach(function (item) {
			if (item && item.name.length > 0) {
				this.gainItem(item, this.maxItems(item));
			}
		}, this);
	}

	highestLevel() {
		return Math.max.apply(null, this.members()
			.map(({
				level
			}) => level));
	}

	addActor(actorId) {
		if (!this._actors.contains(actorId)) {
			this._actors.push(actorId);
			self.$gamePlayer.refresh();
			self.$gameMap.requestRefresh();
		}
	}

	removeActor(actorId) {
		if (this._actors.contains(actorId)) {
			this._actors.splice(this._actors.indexOf(actorId), 1);
			self.$gamePlayer.refresh();
			self.$gameMap.requestRefresh();
		}
	}

	gold() {
		return this._gold;
	}

	gainGold(amount) {
		this._gold = (this._gold + amount)
			.clamp(0, this.maxGold());
	}

	loseGold(amount) {
		this.gainGold(-amount);
	}

	maxGold() {
		return 99999999;
	}

	steps() {
		return this._steps;
	}

	increaseSteps() {
		this._steps++;
	}

	numItems(item) {
		const container = this.itemContainer(item);
		return container ? container[item.id] || 0 : 0;
	}

	maxItems(item) {
		return 99;
	}

	hasMaxItems(item) {
		return this.numItems(item) >= this.maxItems(item);
	}

	hasItem(item, includeEquip) {
		if (includeEquip === undefined) {
			includeEquip = false;
		}
		if (this.numItems(item) > 0) {
			return true;
		} else if (includeEquip && this.isAnyMemberEquipped(item)) {
			return true;
		} else {
			return false;
		}
	}

	isAnyMemberEquipped(item) {
		return this.members()
			.some(actor => actor.equips()
				.contains(item));
	}

	gainItem(item, amount, includeEquip) {
		const container = this.itemContainer(item);
		if (container) {
			const lastNumber = this.numItems(item);
			const newNumber = lastNumber + amount;
			container[item.id] = newNumber.clamp(0, this.maxItems(item));
			if (container[item.id] === 0) {
				delete container[item.id];
			}
			if (includeEquip && newNumber < 0) {
				this.discardMembersEquip(item, -newNumber);
			}
			self.$gameMap.requestRefresh();
		}
	}

	discardMembersEquip(item, amount) {
		let n = amount;
		this.members()
			.forEach(actor => {
				while (n > 0 && actor.isEquipped(item)) {
					actor.discardEquip(item);
					n--;
				}
			});
	}

	loseItem(item, amount, includeEquip) {
		this.gainItem(item, -amount, includeEquip);
	}

	consumeItem(item) {
		if (DataManager.isItem(item) && item.consumable) {
			this.loseItem(item, 1);
		}
	}

	canUse(item) {
		return this.members()
			.some(actor => actor.canUse(item));
	}

	canInput() {
		return this.members()
			.some(actor => actor.canInput());
	}

	isAllDead() {
		if (Game_Unit.prototype.isAllDead.call(this)) {
			return this.inBattle() || !this.isEmpty();
		} else {
			return false;
		}
	}

	onPlayerWalk() {
		this.members()
			.forEach(actor => actor.onPlayerWalk());
	}

	menuActor() {
		let actor = self.$gameActors.actor(this._menuActorId);
		if (!this.members()
			.contains(actor)) {
			actor = this.members()[0];
		}
		return actor;
	}

	setMenuActor(actor) {
		this._menuActorId = actor.actorId();
	}

	makeMenuActorNext() {
		let index = this.members()
			.indexOf(this.menuActor());
		if (index >= 0) {
			index = (index + 1) % this.members()
				.length;
			this.setMenuActor(this.members()[index]);
		} else {
			this.setMenuActor(this.members()[0]);
		}
	}

	makeMenuActorPrevious() {
		let index = this.members()
			.indexOf(this.menuActor());
		if (index >= 0) {
			index = (index + this.members()
					.length - 1) % this.members()
				.length;
			this.setMenuActor(this.members()[index]);
		} else {
			this.setMenuActor(this.members()[0]);
		}
	}

	targetActor() {
		let actor = self.$gameActors.actor(this._targetActorId);
		if (!this.members()
			.contains(actor)) {
			actor = this.members()[0];
		}
		return actor;
	}

	setTargetActor(actor) {
		this._targetActorId = actor.actorId();
	}

	lastItem() {
		return this._lastItem.object();
	}

	setLastItem(item) {
		this._lastItem.setObject(item);
	}

	swapOrder(index1, index2) {
		const temp = this._actors[index1];
		this._actors[index1] = this._actors[index2];
		this._actors[index2] = temp;
		self.$gamePlayer.refresh();
	}

	charactersForSavefile() {
		return this.battleMembers()
			.map(actor => [actor.characterName(), actor.characterIndex()]);
	}

	facesForSavefile() {
		return this.battleMembers()
			.map(actor => [actor.faceName(), actor.faceIndex()]);
	}

	partyAbility(abilityId) {
		return this.battleMembers()
			.some(actor => actor.partyAbility(abilityId));
	}

	hasEncounterHalf() {
		return this.partyAbility(Game_Party.ABILITY_ENCOUNTER_HALF);
	}

	hasEncounterNone() {
		return this.partyAbility(Game_Party.ABILITY_ENCOUNTER_NONE);
	}

	hasCancelSurprise() {
		return this.partyAbility(Game_Party.ABILITY_CANCEL_SURPRISE);
	}

	hasRaisePreemptive() {
		return this.partyAbility(Game_Party.ABILITY_RAISE_PREEMPTIVE);
	}

	hasGoldDouble() {
		return this.partyAbility(Game_Party.ABILITY_GOLD_DOUBLE);
	}

	hasDropItemDouble() {
		return this.partyAbility(Game_Party.ABILITY_DROP_ITEM_DOUBLE);
	}

	ratePreemptive(troopAgi) {
		let rate = this.agility() >= troopAgi ? 0.05 : 0.03;
		if (this.hasRaisePreemptive()) {
			rate *= 4;
		}
		return rate;
	}

	rateSurprise(troopAgi) {
		let rate = this.agility() >= troopAgi ? 0.03 : 0.05;
		if (this.hasCancelSurprise()) {
			rate = 0;
		}
		return rate;
	}

	performVictory() {
		this.members()
			.forEach(actor => {
				actor.performVictory();
			});
	}

	performEscape() {
		this.members()
			.forEach(actor => {
				actor.performEscape();
			});
	}

	removeBattleStates() {
		this.members()
			.forEach(actor => {
				actor.removeBattleStates();
			});
	}

	requestMotionRefresh() {
		this.members()
			.forEach(actor => {
				actor.requestMotionRefresh();
			});
	}
}

Game_Party.ABILITY_ENCOUNTER_HALF = 0;
Game_Party.ABILITY_ENCOUNTER_NONE = 1;
Game_Party.ABILITY_CANCEL_SURPRISE = 2;
Game_Party.ABILITY_RAISE_PREEMPTIVE = 3;
Game_Party.ABILITY_GOLD_DOUBLE = 4;
Game_Party.ABILITY_DROP_ITEM_DOUBLE = 5;

export default Game_Party;
