import TextManager from "../rpg_managers/TextManager.js";
import AudioManager from "../rpg_managers/AudioManager.js";
import SceneManager from "../rpg_managers/SceneManager.js";
import SoundManager from "../rpg_managers/SoundManager.js";
import Game_Action from "../rpg_objects/Game_Action.js";
import Scene_Gameover from "../rpg_scenes/Scene_Gameover.js";

//-----------------------------------------------------------------------------
// BattleManager
//
// The static class that manages battle progress.

class BattleManager {
	constructor() {
		throw new Error('This is a static class');
	}

	static setup(troopId, canEscape, canLose) {
		this.initMembers();
		this._canEscape = canEscape;
		this._canLose = canLose;
		self.$gameTroop.setup(troopId);
		self.$gameScreen.onBattleStart();
		this.makeEscapeRatio();
	}

	static initMembers() {
		this._phase = 'init';
		this._canEscape = false;
		this._canLose = false;
		this._battleTest = false;
		this._eventCallback = null;
		this._preemptive = false;
		this._surprise = false;
		this._actorIndex = -1;
		this._actionForcedBattler = null;
		this._mapBgm = null;
		this._mapBgs = null;
		this._actionBattlers = [];
		this._subject = null;
		this._action = null;
		this._targets = [];
		this._logWindow = null;
		this._statusWindow = null;
		this._spriteset = null;
		this._escapeRatio = 0;
		this._escaped = false;
		this._rewards = {};
		this._turnForced = false;
	}

	static isBattleTest() {
		return this._battleTest;
	}

	static setBattleTest(battleTest) {
		this._battleTest = battleTest;
	}

	static setEventCallback(callback) {
		this._eventCallback = callback;
	}

	static setLogWindow(logWindow) {
		this._logWindow = logWindow;
	}

	static setStatusWindow(statusWindow) {
		this._statusWindow = statusWindow;
	}

	static setSpriteset(spriteset) {
		this._spriteset = spriteset;
	}

	static onEncounter() {
		this._preemptive = (Math.random() < this.ratePreemptive());
		this._surprise = (Math.random() < this.rateSurprise() && !this._preemptive);
	}

	static saveBgmAndBgs() {
		this._mapBgm = AudioManager.saveBgm();
		this._mapBgs = AudioManager.saveBgs();
	}

	static replayBgmAndBgs() {
		if (this._mapBgm) {
			AudioManager.replayBgm(this._mapBgm);
		} else {
			AudioManager.stopBgm();
		}
		if (this._mapBgs) {
			AudioManager.replayBgs(this._mapBgs);
		}
	}

	static makeEscapeRatio() {
		this._escapeRatio = 0.5 * self.$gameParty.agility() / self.$gameTroop.agility();
	}

	static update() {
		if (!this.isBusy() && !this.updateEvent()) {
			switch (this._phase) {
			case 'start':
				this.startInput();
				break;
			case 'turn':
				this.updateTurn();
				break;
			case 'action':
				this.updateAction();
				break;
			case 'turnEnd':
				this.updateTurnEnd();
				break;
			case 'battleEnd':
				this.updateBattleEnd();
				break;
			}
		}
	}

	static updateEvent() {
		switch (this._phase) {
		case 'start':
		case 'turn':
		case 'turnEnd':
			if (this.isActionForced()) {
				this.processForcedAction();
				return true;
			} else {
				return this.updateEventMain();
			}
		}
		return this.checkAbort();
	}

	static updateEventMain() {
		self.$gameTroop.updateInterpreter();
		self.$gameParty.requestMotionRefresh();
		if (self.$gameTroop.isEventRunning() || this.checkBattleEnd()) {
			return true;
		}
		self.$gameTroop.setupBattleEvent();
		if (self.$gameTroop.isEventRunning() || SceneManager.isSceneChanging()) {
			return true;
		}
		return false;
	}

	static isBusy() {
		return (self.$gameMessage.isBusy() || this._spriteset.isBusy() ||
			this._logWindow.isBusy());
	}

	static isInputting() {
		return this._phase === 'input';
	}

	static isInTurn() {
		return this._phase === 'turn';
	}

	static isTurnEnd() {
		return this._phase === 'turnEnd';
	}

	static isAborting() {
		return this._phase === 'aborting';
	}

	static isBattleEnd() {
		return this._phase === 'battleEnd';
	}

	static canEscape() {
		return this._canEscape;
	}

	static canLose() {
		return this._canLose;
	}

	static isEscaped() {
		return this._escaped;
	}

	static actor() {
		return this._actorIndex >= 0 ? self.$gameParty.members()[this._actorIndex] : null;
	}

	static clearActor() {
		this.changeActor(-1, '');
	}

	static changeActor(newActorIndex, lastActorActionState) {
		const lastActor = this.actor();
		this._actorIndex = newActorIndex;
		const newActor = this.actor();
		if (lastActor) {
			lastActor.setActionState(lastActorActionState);
		}
		if (newActor) {
			newActor.setActionState('inputting');
		}
	}

	static startBattle() {
		this._phase = 'start';
		self.$gameSystem.onBattleStart();
		self.$gameParty.onBattleStart();
		self.$gameTroop.onBattleStart();
		this.displayStartMessages();
	}

	static displayStartMessages() {
		self.$gameTroop.enemyNames()
			.forEach(name => {
				self.$gameMessage.add(TextManager.emerge.format(name));
			});
		if (this._preemptive) {
			self.$gameMessage.add(TextManager.preemptive.format(self.$gameParty.name()));
		} else if (this._surprise) {
			self.$gameMessage.add(TextManager.surprise.format(self.$gameParty.name()));
		}
	}

	static startInput() {
		this._phase = 'input';
		self.$gameParty.makeActions();
		self.$gameTroop.makeActions();
		this.clearActor();
		if (this._surprise || !self.$gameParty.canInput()) {
			this.startTurn();
		}
	}

	static inputtingAction() {
		const actor = this.actor();
		return actor ? actor.inputtingAction() : null;
	}

	static selectNextCommand() {
		do {
			const actor = this.actor();
			if (!actor || !actor.selectNextCommand()) {
				this.changeActor(this._actorIndex + 1, 'waiting');
				if (this._actorIndex >= self.$gameParty.size()) {
					this.startTurn();
					break;
				}
			}
		} while (!this.actor()
			.canInput());
	}

	static selectPreviousCommand() {
		do {
			const actor = this.actor();
			if (!actor || !actor.selectPreviousCommand()) {
				this.changeActor(this._actorIndex - 1, 'undecided');
				if (this._actorIndex < 0) {
					return;
				}
			}
		} while (!this.actor()
			.canInput());
	}

	static refreshStatus() {
		this._statusWindow.refresh();
	}

	static startTurn() {
		this._phase = 'turn';
		this.clearActor();
		self.$gameTroop.increaseTurn();
		this.makeActionOrders();
		self.$gameParty.requestMotionRefresh();
		this._logWindow.startTurn();
	}

	static updateTurn() {
		self.$gameParty.requestMotionRefresh();
		if (!this._subject) {
			this._subject = this.getNextSubject();
		}
		if (this._subject) {
			this.processTurn();
		} else {
			this.endTurn();
		}
	}

	static processTurn() {
		const subject = this._subject;
		const action = subject.currentAction();
		if (action) {
			action.prepare();
			if (action.isValid()) {
				this.startAction();
			}
			subject.removeCurrentAction();
		} else {
			subject.onAllActionsEnd();
			this.refreshStatus();
			this._logWindow.displayAutoAffectedStatus(subject);
			this._logWindow.displayCurrentState(subject);
			this._logWindow.displayRegeneration(subject);
			this._subject = this.getNextSubject();
		}
	}

	static endTurn() {
		this._phase = 'turnEnd';
		this._preemptive = false;
		this._surprise = false;
		this.allBattleMembers()
			.forEach(function (battler) {
				battler.onTurnEnd();
				this.refreshStatus();
				this._logWindow.displayAutoAffectedStatus(battler);
				this._logWindow.displayRegeneration(battler);
			}, this);
		if (this.isForcedTurn()) {
			this._turnForced = false;
		}
	}

	static isForcedTurn() {
		return this._turnForced;
	}

	static updateTurnEnd() {
		this.startInput();
	}

	static getNextSubject() {
		for (;;) {
			const battler = this._actionBattlers.shift();
			if (!battler) {
				return null;
			}
			if (battler.isBattleMember() && battler.isAlive()) {
				return battler;
			}
		}
	}

	static makeActionOrders() {
		let battlers = [];
		if (!this._surprise) {
			battlers = battlers.concat(self.$gameParty.members());
		}
		if (!this._preemptive) {
			battlers = battlers.concat(self.$gameTroop.members());
		}
		battlers.forEach(battler => {
			battler.makeSpeed();
		});
		battlers.sort((a, b) => b.speed() - a.speed());
		this._actionBattlers = battlers;
	}

	static startAction() {
		const subject = this._subject;
		const action = subject.currentAction();
		const targets = action.makeTargets();
		this._phase = 'action';
		this._action = action;
		this._targets = targets;
		subject.useItem(action.item());
		this._action.applyGlobal();
		this.refreshStatus();
		this._logWindow.startAction(subject, action, targets);
	}

	static updateAction() {
		const target = this._targets.shift();
		if (target) {
			this.invokeAction(this._subject, target);
		} else {
			this.endAction();
		}
	}

	static endAction() {
		this._logWindow.endAction(this._subject);
		this._phase = 'turn';
	}

	static invokeAction(subject, target) {
		this._logWindow.push('pushBaseLine');
		if (Math.random() < this._action.itemCnt(target)) {
			this.invokeCounterAttack(subject, target);
		} else if (Math.random() < this._action.itemMrf(target)) {
			this.invokeMagicReflection(subject, target);
		} else {
			this.invokeNormalAction(subject, target);
		}
		subject.setLastTarget(target);
		this._logWindow.push('popBaseLine');
		this.refreshStatus();
	}

	static invokeNormalAction(subject, target) {
		const realTarget = this.applySubstitute(target);
		this._action.apply(realTarget);
		this._logWindow.displayActionResults(subject, realTarget);
	}

	static invokeCounterAttack(subject, target) {
		const action = new Game_Action(target);
		action.setAttack();
		action.apply(subject);
		this._logWindow.displayCounter(target);
		this._logWindow.displayActionResults(target, subject);
	}

	static invokeMagicReflection(subject, target) {
		this._action._reflectionTarget = target;
		this._logWindow.displayReflection(target);
		this._action.apply(subject);
		this._logWindow.displayActionResults(target, subject);
	}

	static applySubstitute(target) {
		if (this.checkSubstitute(target)) {
			const substitute = target.friendsUnit()
				.substituteBattler();
			if (substitute && target !== substitute) {
				this._logWindow.displaySubstitute(substitute, target);
				return substitute;
			}
		}
		return target;
	}

	static checkSubstitute(target) {
		return target.isDying() && !this._action.isCertainHit();
	}

	static isActionForced() {
		return !!this._actionForcedBattler;
	}

	static forceAction(battler) {
		this._actionForcedBattler = battler;
		const index = this._actionBattlers.indexOf(battler);
		if (index >= 0) {
			this._actionBattlers.splice(index, 1);
		}
	}

	static processForcedAction() {
		if (this._actionForcedBattler) {
			this._turnForced = true;
			this._subject = this._actionForcedBattler;
			this._actionForcedBattler = null;
			this.startAction();
			this._subject.removeCurrentAction();
		}
	}

	static abort() {
		this._phase = 'aborting';
	}

	static checkBattleEnd() {
		if (this._phase) {
			if (this.checkAbort()) {
				return true;
			} else if (self.$gameParty.isAllDead()) {
				this.processDefeat();
				return true;
			} else if (self.$gameTroop.isAllDead()) {
				this.processVictory();
				return true;
			}
		}
		return false;
	}

	static checkAbort() {
		if (self.$gameParty.isEmpty() || this.isAborting()) {
			SoundManager.playEscape();
			this._escaped = true;
			this.processAbort();
		}
		return false;
	}

	static processVictory() {
		self.$gameParty.removeBattleStates();
		self.$gameParty.performVictory();
		this.playVictoryMe();
		this.replayBgmAndBgs();
		this.makeRewards();
		this.displayVictoryMessage();
		this.displayRewards();
		this.gainRewards();
		this.endBattle(0);
	}

	static processEscape() {
		self.$gameParty.performEscape();
		SoundManager.playEscape();
		const success = this.processEscapeFormula();
		if (success) {
			this.displayEscapeSuccessMessage();
			this._escaped = true;
			this.processAbort();
		} else {
			this.displayEscapeFailureMessage();
			this._escapeRatio += 0.1;
			self.$gameParty.clearActions();
			this.startTurn();
		}
		return success;
	}

	static processEscapeFormula() {
		return this._preemptive ? true : (Math.random() < this._escapeRatio);
	}

	static processAbort() {
		self.$gameParty.removeBattleStates();
		this.replayBgmAndBgs();
		this.endBattle(1);
	}

	static processDefeat() {
		this.displayDefeatMessage();
		this.playDefeatMe();
		if (this._canLose) {
			this.replayBgmAndBgs();
		} else {
			AudioManager.stopBgm();
		}
		this.endBattle(2);
	}

	static endBattle(result) {
		this._phase = 'battleEnd';
		if (this._eventCallback) {
			this._eventCallback(result);
		}
		if (result === 0) {
			self.$gameSystem.onBattleWin();
		} else if (this._escaped) {
			self.$gameSystem.onBattleEscape();
		}
	}

	static updateBattleEnd() {
		if (this.isBattleTest()) {
			AudioManager.stopBgm();
			SceneManager.exit();
		} else if (!this._escaped && self.$gameParty.isAllDead()) {
			if (this._canLose) {
				self.$gameParty.reviveBattleMembers();
				SceneManager.pop();
			} else {
				SceneManager.goto(Scene_Gameover);
			}
		} else {
			SceneManager.pop();
		}
		this._phase = null;
	}

	static makeRewards() {
		this._rewards = {};
		this._rewards.gold = self.$gameTroop.goldTotal();
		this._rewards.exp = self.$gameTroop.expTotal();
		this._rewards.items = self.$gameTroop.makeDropItems();
	}

	static displayRewards() {
		this.displayExp();
		this.displayGold();
		this.displayDropItems();
	}

	static displayExp() {
		const exp = this._rewards.exp;
		if (exp > 0) {
			const text = TextManager.obtainExp.format(exp, TextManager.exp);
			self.$gameMessage.add(`\\.${text}`);
		}
	}

	static displayGold() {
		const gold = this._rewards.gold;
		if (gold > 0) {
			self.$gameMessage.add(`\\.${TextManager.obtainGold.format(gold)}`);
		}
	}

	static displayDropItems() {
		const items = this._rewards.items;
		if (items.length > 0) {
			self.$gameMessage.newPage();
			items.forEach(({
				name
			}) => {
				self.$gameMessage.add(TextManager.obtainItem.format(name));
			});
		}
	}

	static gainRewards() {
		this.gainExp();
		this.gainGold();
		this.gainDropItems();
	}

	static gainExp() {
		const exp = this._rewards.exp;
		self.$gameParty.allMembers()
			.forEach(actor => {
				actor.gainExp(exp);
			});
	}

	static gainGold() {
		self.$gameParty.gainGold(this._rewards.gold);
	}

	static gainDropItems() {
		const items = this._rewards.items;
		items.forEach(item => {
			self.$gameParty.gainItem(item, 1);
		});
	}

	static ratePreemptive() {
		return self.$gameParty.ratePreemptive(self.$gameTroop.agility());
	}

	static rateSurprise() {
		return self.$gameParty.rateSurprise(self.$gameTroop.agility());
	}

	static playBattleBgm() {
		AudioManager.playBgm(self.$gameSystem.battleBgm());
		AudioManager.stopBgs();
	}

	static playVictoryMe() {
		AudioManager.playMe(self.$gameSystem.victoryMe());
	}

	static playDefeatMe() {
		AudioManager.playMe(self.$gameSystem.defeatMe());
	}

	static allBattleMembers() {
		return self.$gameParty.members()
			.concat(self.$gameTroop.members());
	}

	static displayVictoryMessage() {
		self.$gameMessage.add(TextManager.victory.format(self.$gameParty.name()));
	}

	static displayDefeatMessage() {
		self.$gameMessage.add(TextManager.defeat.format(self.$gameParty.name()));
	}

	static displayEscapeSuccessMessage() {
		self.$gameMessage.add(TextManager.escapeStart.format(self.$gameParty.name()));
	}

	static displayEscapeFailureMessage() {
		self.$gameMessage.add(TextManager.escapeStart.format(self.$gameParty.name()));
		self.$gameMessage.add(`\\.${TextManager.escapeFailure}`);
	}
}

export default BattleManager;
