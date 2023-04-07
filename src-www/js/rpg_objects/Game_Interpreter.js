import ImageManager from '../rpg_managers/ImageManager.js';
import AudioManager from '../rpg_managers/AudioManager.js';
import SceneManager from '../rpg_managers/SceneManager.js';
import BattleManager from '../rpg_managers/BattleManager.js';
import Graphics from '../rpg_core/Graphics.js';
import Input from '../rpg_core/Input.js';
import Utils from '../rpg_core/Utils.js';
import JsonEx from '../rpg_core/JsonEx.js';
import Window_MenuCommand from '../rpg_windows/Window_MenuCommand.js';
import Game_Character from '../rpg_objects/Game_Character.js';
import Scene_Title from '../rpg_scenes/Scene_Title.js';
import Scene_Menu from '../rpg_scenes/Scene_Menu.js';
import Scene_Save from '../rpg_scenes/Scene_Save.js';
import Scene_Shop from '../rpg_scenes/Scene_Shop.js';
import Scene_Name from '../rpg_scenes/Scene_Name.js';
import Scene_Battle from '../rpg_scenes/Scene_Battle.js';
import Scene_Gameover from '../rpg_scenes/Scene_Gameover.js';

//-----------------------------------------------------------------------------
// Game_Interpreter
//
// The interpreter for running event commands.

class Game_Interpreter {
	constructor(...args) {
		this.initialize(...args);
	}

	initialize(depth) {
		this._depth = depth || 0;
		this.checkOverflow();
		this.clear();
		this._branch = {};
		this._params = [];
		this._indent = 0;
		this._frameCount = 0;
		this._freezeChecker = 0;
	}

	checkOverflow() {
		if (this._depth >= 100) {
			throw new Error('Common event calls exceeded the limit');
		}
	}

	clear() {
		this._mapId = 0;
		this._eventId = 0;
		this._list = null;
		this._index = 0;
		this._waitCount = 0;
		this._waitMode = '';
		this._comments = '';
		this._eventInfo = null;
		this._character = null;
		this._childInterpreter = null;
	}

	setup(list, eventId) {
		this.clear();
		this._mapId = self.$gameMap.mapId();
		this._eventId = eventId || 0;
		this._list = list;
		Game_Interpreter.requestImages(list);
	}

	eventId() {
		return this._eventId;
	}

	isOnCurrentMap() {
		return this._mapId === self.$gameMap.mapId();
	}

	setEventInfo(eventInfo) {
		this._eventInfo = eventInfo;
	}

	setupReservedCommonEvent() {
		if (self.$gameTemp.isCommonEventReserved()) {
			this.setup(self.$gameTemp.reservedCommonEvent().list);
			this.setEventInfo({
				eventType: 'common_event',
				commonEventId: self.$gameTemp.reservedCommonEventId(),
			});
			self.$gameTemp.clearCommonEvent();
			return true;
		} else {
			return false;
		}
	}

	isRunning() {
		return !!this._list;
	}

	update() {
		while (this.isRunning()) {
			if (this.updateChild() || this.updateWait()) {
				break;
			}
			if (SceneManager.isSceneChanging()) {
				break;
			}
			if (!this.executeCommand()) {
				break;
			}
			if (this.checkFreeze()) {
				break;
			}
		}
	}

	updateChild() {
		if (this._childInterpreter) {
			this._childInterpreter.update();
			if (this._childInterpreter.isRunning()) {
				return true;
			} else {
				this._childInterpreter = null;
			}
		}
		return false;
	}

	updateWait() {
		return this.updateWaitCount() || this.updateWaitMode();
	}

	updateWaitCount() {
		if (this._waitCount > 0) {
			this._waitCount--;
			return true;
		}
		return false;
	}

	updateWaitMode() {
		let waiting = false;
		switch (this._waitMode) {
			case 'message':
				waiting = self.$gameMessage.isBusy();
				break;
			case 'transfer':
				waiting = self.$gamePlayer.isTransferring();
				break;
			case 'scroll':
				waiting = self.$gameMap.isScrolling();
				break;
			case 'route':
				waiting = this._character.isMoveRouteForcing();
				break;
			case 'animation':
				waiting = this._character.isAnimationPlaying();
				break;
			case 'balloon':
				waiting = this._character.isBalloonPlaying();
				break;
			case 'gather':
				waiting = self.$gamePlayer.areFollowersGathering();
				break;
			case 'action':
				waiting = BattleManager.isActionForced();
				break;
			case 'video':
				waiting = Graphics.isVideoPlaying();
				break;
			case 'image':
				waiting = !ImageManager.isReady();
				break;
		}
		if (!waiting) {
			this._waitMode = '';
		}
		return waiting;
	}

	setWaitMode(waitMode) {
		this._waitMode = waitMode;
	}

	wait(duration) {
		this._waitCount = duration;
	}

	fadeSpeed() {
		return 24;
	}

	executeCommand() {
		const command = this.currentCommand();
		if (command) {
			this._params = command.parameters;
			this._indent = command.indent;
			const methodName = `command${command.code}`;
			if (typeof this[methodName] === 'function') {
				try {
					if (!this[methodName]()) {
						return false;
					}
				} catch (error) {
					for (let key in this._eventInfo) {
						error[key] = this._eventInfo[key];
					}
					error.eventCommand = error.eventCommand || 'other';
					error.line = error.line || this._index + 1;
					throw error;
				}
			}
			this._index++;
		} else {
			this.terminate();
		}
		return true;
	}

	checkFreeze() {
		if (this._frameCount !== Graphics.frameCount) {
			this._frameCount = Graphics.frameCount;
			this._freezeChecker = 0;
		}
		if (this._freezeChecker++ >= 100000) {
			return true;
		} else {
			return false;
		}
	}

	terminate() {
		this._list = null;
		this._comments = '';
	}

	skipBranch() {
		while (this._list[this._index + 1].indent > this._indent) {
			this._index++;
		}
	}

	currentCommand() {
		return this._list[this._index];
	}

	nextEventCode() {
		const command = this._list[this._index + 1];
		if (command) {
			return command.code;
		} else {
			return 0;
		}
	}

	iterateActorId(param, callback) {
		if (param === 0) {
			self.$gameParty.members().forEach(callback);
		} else {
			const actor = self.$gameActors.actor(param);
			if (actor) {
				callback(actor);
			}
		}
	}

	iterateActorEx(param1, param2, callback) {
		if (param1 === 0) {
			this.iterateActorId(param2, callback);
		} else {
			this.iterateActorId(self.$gameVariables.value(param2), callback);
		}
	}

	iterateActorIndex(param, callback) {
		if (param < 0) {
			self.$gameParty.members().forEach(callback);
		} else {
			const actor = self.$gameParty.members()[param];
			if (actor) {
				callback(actor);
			}
		}
	}

	iterateEnemyIndex(param, callback) {
		if (param < 0) {
			self.$gameTroop.members().forEach(callback);
		} else {
			const enemy = self.$gameTroop.members()[param];
			if (enemy) {
				callback(enemy);
			}
		}
	}

	iterateBattler(param1, param2, callback) {
		if (self.$gameParty.inBattle()) {
			if (param1 === 0) {
				this.iterateEnemyIndex(param2, callback);
			} else {
				this.iterateActorId(param2, callback);
			}
		}
	}

	character(param) {
		if (self.$gameParty.inBattle()) {
			return null;
		} else if (param < 0) {
			return self.$gamePlayer;
		} else if (this.isOnCurrentMap()) {
			return self.$gameMap.event(param > 0 ? param : this._eventId);
		} else {
			return null;
		}
	}

	operateValue(operation, operandType, operand) {
		const value =
			operandType === 0 ? operand : self.$gameVariables.value(operand);
		return operation === 0 ? value : -value;
	}

	changeHp(target, value, allowDeath) {
		if (target.isAlive()) {
			if (!allowDeath && target.hp <= -value) {
				value = 1 - target.hp;
			}
			target.gainHp(value);
			if (target.isDead()) {
				target.performCollapse();
			}
		}
	}

	// Show Text
	command101() {
		if (!self.$gameMessage.isBusy()) {
			self.$gameMessage.setFaceImage(this._params[0], this._params[1]);
			self.$gameMessage.setBackground(this._params[2]);
			self.$gameMessage.setPositionType(this._params[3]);
			while (this.nextEventCode() === 401) {
				// Text data
				this._index++;
				self.$gameMessage.add(this.currentCommand().parameters[0]);
			}
			switch (this.nextEventCode()) {
				case 102: // Show Choices
					this._index++;
					this.setupChoices(this.currentCommand().parameters);
					break;
				case 103: // Input Number
					this._index++;
					this.setupNumInput(this.currentCommand().parameters);
					break;
				case 104: // Select Item
					this._index++;
					this.setupItemChoice(this.currentCommand().parameters);
					break;
			}
			this._index++;
			this.setWaitMode('message');
		}
		return false;
	}

	// Show Choices
	command102() {
		if (!self.$gameMessage.isBusy()) {
			this.setupChoices(this._params);
			this._index++;
			this.setWaitMode('message');
		}
		return false;
	}

	setupChoices(params) {
		const choices = params[0].clone();
		let cancelType = params[1];
		const defaultType = params.length > 2 ? params[2] : 0;
		const positionType = params.length > 3 ? params[3] : 2;
		const background = params.length > 4 ? params[4] : 0;
		if (cancelType >= choices.length) {
			cancelType = -2;
		}
		self.$gameMessage.setChoices(choices, defaultType, cancelType);
		self.$gameMessage.setChoiceBackground(background);
		self.$gameMessage.setChoicePositionType(positionType);
		self.$gameMessage.setChoiceCallback((n) => {
			this._branch[this._indent] = n;
		});
	}

	// When [**]
	command402() {
		if (this._branch[this._indent] !== this._params[0]) {
			this.skipBranch();
		}
		return true;
	}

	// When Cancel
	command403() {
		if (this._branch[this._indent] >= 0) {
			this.skipBranch();
		}
		return true;
	}

	// Input Number
	command103() {
		if (!self.$gameMessage.isBusy()) {
			this.setupNumInput(this._params);
			this._index++;
			this.setWaitMode('message');
		}
		return false;
	}

	setupNumInput(params) {
		self.$gameMessage.setNumberInput(params[0], params[1]);
	}

	// Select Item
	command104() {
		if (!self.$gameMessage.isBusy()) {
			this.setupItemChoice(this._params);
			this._index++;
			this.setWaitMode('message');
		}
		return false;
	}

	setupItemChoice(params) {
		self.$gameMessage.setItemChoice(params[0], params[1] || 2);
	}

	// Show Scrolling Text
	command105() {
		if (!self.$gameMessage.isBusy()) {
			self.$gameMessage.setScroll(this._params[0], this._params[1]);
			while (this.nextEventCode() === 405) {
				this._index++;
				self.$gameMessage.add(this.currentCommand().parameters[0]);
			}
			this._index++;
			this.setWaitMode('message');
		}
		return false;
	}

	// Comment
	command108() {
		this._comments = [this._params[0]];
		while (this.nextEventCode() === 408) {
			this._index++;
			this._comments.push(this.currentCommand().parameters[0]);
		}
		return true;
	}

	// Conditional Branch
	command111() {
		let result = false;
		switch (this._params[0]) {
			case 0: // Switch
				result =
					self.$gameSwitches.value(this._params[1]) === (this._params[2] === 0);
				break;
			case 1: // Variable
				const value1 = self.$gameVariables.value(this._params[1]);
				let value2;
				if (this._params[2] === 0) {
					value2 = this._params[3];
				} else {
					value2 = self.$gameVariables.value(this._params[3]);
				}
				switch (this._params[4]) {
					case 0: // Equal to
						result = value1 === value2;
						break;
					case 1: // Greater than or Equal to
						result = value1 >= value2;
						break;
					case 2: // Less than or Equal to
						result = value1 <= value2;
						break;
					case 3: // Greater than
						result = value1 > value2;
						break;
					case 4: // Less than
						result = value1 < value2;
						break;
					case 5: // Not Equal to
						result = value1 !== value2;
						break;
				}
				break;
			case 2: // Self Switch
				if (this._eventId > 0) {
					const key = [this._mapId, this._eventId, this._params[1]];
					result =
						self.$gameSelfSwitches.value(key) === (this._params[2] === 0);
				}
				break;
			case 3: // Timer
				if (self.$gameTimer.isWorking()) {
					if (this._params[2] === 0) {
						result = self.$gameTimer.seconds() >= this._params[1];
					} else {
						result = self.$gameTimer.seconds() <= this._params[1];
					}
				}
				break;
			case 4: // Actor
				const actor = self.$gameActors.actor(this._params[1]);
				if (actor) {
					const n = this._params[3];
					switch (this._params[2]) {
						case 0: // In the Party
							result = self.$gameParty.members().contains(actor);
							break;
						case 1: // Name
							result = actor.name() === n;
							break;
						case 2: // Class
							result = actor.isClass(self.$dataClasses[n]);
							break;
						case 3: // Skill
							result = actor.hasSkill(n);
							break;
						case 4: // Weapon
							result = actor.hasWeapon(self.$dataWeapons[n]);
							break;
						case 5: // Armor
							result = actor.hasArmor(self.$dataArmors[n]);
							break;
						case 6: // State
							result = actor.isStateAffected(n);
							break;
					}
				}
				break;
			case 5: // Enemy
				const enemy = self.$gameTroop.members()[this._params[1]];
				if (enemy) {
					switch (this._params[2]) {
						case 0: // Appeared
							result = enemy.isAlive();
							break;
						case 1: // State
							result = enemy.isStateAffected(this._params[3]);
							break;
					}
				}
				break;
			case 6: // Character
				const character = this.character(this._params[1]);
				if (character) {
					result = character.direction() === this._params[2];
				}
				break;
			case 7: // Gold
				switch (this._params[2]) {
					case 0: // Greater than or equal to
						result = self.$gameParty.gold() >= this._params[1];
						break;
					case 1: // Less than or equal to
						result = self.$gameParty.gold() <= this._params[1];
						break;
					case 2: // Less than
						result = self.$gameParty.gold() < this._params[1];
						break;
				}
				break;
			case 8: // Item
				result = self.$gameParty.hasItem(self.$dataItems[this._params[1]]);
				break;
			case 9: // Weapon
				result = self.$gameParty.hasItem(
					self.$dataWeapons[this._params[1]],
					this._params[2]
				);
				break;
			case 10: // Armor
				result = self.$gameParty.hasItem(
					self.$dataArmors[this._params[1]],
					this._params[2]
				);
				break;
			case 11: // Button
				result = Input.isPressed(this._params[1]);
				break;
			case 12: // Script
				try {
					result = !!eval(this._params[1]);
				} catch (error) {
					error.eventCommand = 'conditional_branch_script';
					error.content = this._params[1];
					throw error;
				}
				break;
			case 13: // Vehicle
				result =
					self.$gamePlayer.vehicle() === self.$gameMap.vehicle(this._params[1]);
				break;
		}
		this._branch[this._indent] = result;
		if (this._branch[this._indent] === false) {
			this.skipBranch();
		}
		return true;
	}

	// Else
	command411() {
		if (this._branch[this._indent] !== false) {
			this.skipBranch();
		}
		return true;
	}

	// Loop
	command112() {
		return true;
	}

	// Repeat Above
	command413() {
		do {
			this._index--;
		} while (this.currentCommand().indent !== this._indent);
		return true;
	}

	// Break Loop
	command113() {
		let depth = 0;
		while (this._index < this._list.length - 1) {
			this._index++;
			const command = this.currentCommand();

			if (command.code === 112) depth++;

			if (command.code === 413) {
				if (depth > 0) depth--;
				else break;
			}
		}
		return true;
	}

	// Exit Event Processing
	command115() {
		this._index = this._list.length;
		return true;
	}

	// Common Event
	command117() {
		const commonEvent = self.$dataCommonEvents[this._params[0]];
		if (commonEvent) {
			const eventId = this.isOnCurrentMap() ? this._eventId : 0;
			this.setupChild(commonEvent.list, eventId);
		}
		return true;
	}

	setupChild(list, eventId) {
		this._childInterpreter = new Game_Interpreter(this._depth + 1);
		this._childInterpreter.setup(list, eventId);
		this._childInterpreter.setEventInfo({
			eventType: 'common_event',
			commonEventId: this._params[0],
		});
	}

	// Label
	command118() {
		return true;
	}

	// Jump to Label
	command119() {
		const labelName = this._params[0];
		for (let i = 0; i < this._list.length; i++) {
			const command = this._list[i];
			if (command.code === 118 && command.parameters[0] === labelName) {
				this.jumpTo(i);
				return;
			}
		}
		return true;
	}

	jumpTo(index) {
		const lastIndex = this._index;
		const startIndex = Math.min(index, lastIndex);
		const endIndex = Math.max(index, lastIndex);
		let indent = this._indent;
		for (let i = startIndex; i <= endIndex; i++) {
			const newIndent = this._list[i].indent;
			if (newIndent !== indent) {
				this._branch[indent] = null;
				indent = newIndent;
			}
		}
		this._index = index;
	}

	// Control Switches
	command121() {
		for (let i = this._params[0]; i <= this._params[1]; i++) {
			self.$gameSwitches.setValue(i, this._params[2] === 0);
		}
		return true;
	}

	// Control Variables
	command122() {
		let value = 0;
		switch (
			this._params[3] // Operand
		) {
			case 0: // Constant
				value = this._params[4];
				break;
			case 1: // Variable
				value = self.$gameVariables.value(this._params[4]);
				break;
			case 2: // Random
				value = this._params[5] - this._params[4] + 1;
				for (let i = this._params[0]; i <= this._params[1]; i++) {
					this.operateVariable(
						i,
						this._params[2],
						this._params[4] + Math.randomInt(value)
					);
				}
				return true;
				break;
			case 3: // Game Data
				value = this.gameDataOperand(
					this._params[4],
					this._params[5],
					this._params[6]
				);
				break;
			case 4: // Script
				try {
					value = eval(this._params[4]);
				} catch (error) {
					error.eventCommand = 'control_variables';
					error.content = this._params[4];
					throw error;
				}
				break;
		}
		for (let i = this._params[0]; i <= this._params[1]; i++) {
			this.operateVariable(i, this._params[2], value);
		}
		return true;
	}

	gameDataOperand(type, param1, param2) {
		switch (type) {
			case 0: // Item
				return self.$gameParty.numItems(self.$dataItems[param1]);
			case 1: // Weapon
				return self.$gameParty.numItems(self.$dataWeapons[param1]);
			case 2: // Armor
				return self.$gameParty.numItems(self.$dataArmors[param1]);
			case 3: // Actor
				const actor = self.$gameActors.actor(param1);
				if (actor) {
					switch (param2) {
						case 0: // Level
							return actor.level;
						case 1: // EXP
							return actor.currentExp();
						case 2: // HP
							return actor.hp;
						case 3: // MP
							return actor.mp;
						default: // Parameter
							if (param2 >= 4 && param2 <= 11) {
								return actor.param(param2 - 4);
							}
					}
				}
				break;
			case 4: // Enemy
				const enemy = self.$gameTroop.members()[param1];
				if (enemy) {
					switch (param2) {
						case 0: // HP
							return enemy.hp;
						case 1: // MP
							return enemy.mp;
						default: // Parameter
							if (param2 >= 2 && param2 <= 9) {
								return enemy.param(param2 - 2);
							}
					}
				}
				break;
			case 5: // Character
				const character = this.character(param1);
				if (character) {
					switch (param2) {
						case 0: // Map X
							return character.x;
						case 1: // Map Y
							return character.y;
						case 2: // Direction
							return character.direction();
						case 3: // Screen X
							return character.screenX();
						case 4: // Screen Y
							return character.screenY();
					}
				}
				break;
			case 6: // Party
				const actor_party = self.$gameParty.members()[param1];
				return actor_party ? actor_party.actorId() : 0;
			case 7: // Other
				switch (param1) {
					case 0: // Map ID
						return self.$gameMap.mapId();
					case 1: // Party Members
						return self.$gameParty.size();
					case 2: // Gold
						return self.$gameParty.gold();
					case 3: // Steps
						return self.$gameParty.steps();
					case 4: // Play Time
						return self.$gameSystem.playtime();
					case 5: // Timer
						return self.$gameTimer.seconds();
					case 6: // Save Count
						return self.$gameSystem.saveCount();
					case 7: // Battle Count
						return self.$gameSystem.battleCount();
					case 8: // Win Count
						return self.$gameSystem.winCount();
					case 9: // Escape Count
						return self.$gameSystem.escapeCount();
				}
				break;
		}
		return 0;
	}

	operateVariable(variableId, operationType, value) {
		try {
			let oldValue = self.$gameVariables.value(variableId);
			switch (operationType) {
				case 0: // Set
					self.$gameVariables.setValue(variableId, (oldValue = value));
					break;
				case 1: // Add
					self.$gameVariables.setValue(variableId, oldValue + value);
					break;
				case 2: // Sub
					self.$gameVariables.setValue(variableId, oldValue - value);
					break;
				case 3: // Mul
					self.$gameVariables.setValue(variableId, oldValue * value);
					break;
				case 4: // Div
					self.$gameVariables.setValue(variableId, oldValue / value);
					break;
				case 5: // Mod
					self.$gameVariables.setValue(variableId, oldValue % value);
					break;
			}
		} catch (e) {
			self.$gameVariables.setValue(variableId, 0);
		}
	}

	// Control Self Switch
	command123() {
		if (this._eventId > 0) {
			const key = [this._mapId, this._eventId, this._params[0]];
			self.$gameSelfSwitches.setValue(key, this._params[1] === 0);
		}
		return true;
	}

	// Control Timer
	command124() {
		if (this._params[0] === 0) {
			// Start
			self.$gameTimer.start(this._params[1] * 60);
		} else {
			// Stop
			self.$gameTimer.stop();
		}
		return true;
	}

	// Change Gold
	command125() {
		const value = this.operateValue(
			this._params[0],
			this._params[1],
			this._params[2]
		);
		self.$gameParty.gainGold(value);
		return true;
	}

	// Change Items
	command126() {
		const value = this.operateValue(
			this._params[1],
			this._params[2],
			this._params[3]
		);
		self.$gameParty.gainItem(self.$dataItems[this._params[0]], value);
		return true;
	}

	// Change Weapons
	command127() {
		const value = this.operateValue(
			this._params[1],
			this._params[2],
			this._params[3]
		);
		self.$gameParty.gainItem(
			self.$dataWeapons[this._params[0]],
			value,
			this._params[4]
		);
		return true;
	}

	// Change Armors
	command128() {
		const value = this.operateValue(
			this._params[1],
			this._params[2],
			this._params[3]
		);
		self.$gameParty.gainItem(
			self.$dataArmors[this._params[0]],
			value,
			this._params[4]
		);
		return true;
	}

	// Change Party Member
	command129() {
		const actor = self.$gameActors.actor(this._params[0]);
		if (actor) {
			if (this._params[1] === 0) {
				// Add
				if (this._params[2]) {
					// Initialize
					self.$gameActors.actor(this._params[0]).setup(this._params[0]);
				}
				self.$gameParty.addActor(this._params[0]);
			} else {
				// Remove
				self.$gameParty.removeActor(this._params[0]);
			}
		}
		return true;
	}

	// Change Battle BGM
	command132() {
		self.$gameSystem.setBattleBgm(this._params[0]);
		return true;
	}

	// Change Victory ME
	command133() {
		self.$gameSystem.setVictoryMe(this._params[0]);
		return true;
	}

	// Change Save Access
	command134() {
		if (this._params[0] === 0) {
			self.$gameSystem.disableSave();
		} else {
			self.$gameSystem.enableSave();
		}
		return true;
	}

	// Change Menu Access
	command135() {
		if (this._params[0] === 0) {
			self.$gameSystem.disableMenu();
		} else {
			self.$gameSystem.enableMenu();
		}
		return true;
	}

	// Change Encounter Disable
	command136() {
		if (this._params[0] === 0) {
			self.$gameSystem.disableEncounter();
		} else {
			self.$gameSystem.enableEncounter();
		}
		self.$gamePlayer.makeEncounterCount();
		return true;
	}

	// Change Formation Access
	command137() {
		if (this._params[0] === 0) {
			self.$gameSystem.disableFormation();
		} else {
			self.$gameSystem.enableFormation();
		}
		return true;
	}

	// Change Window Color
	command138() {
		self.$gameSystem.setWindowTone(this._params[0]);
		return true;
	}

	// Change Defeat ME
	command139() {
		self.$gameSystem.setDefeatMe(this._params[0]);
		return true;
	}

	// Change Vehicle BGM
	command140() {
		const vehicle = self.$gameMap.vehicle(this._params[0]);
		if (vehicle) {
			vehicle.setBgm(this._params[1]);
		}
		return true;
	}

	// Transfer Player
	command201() {
		if (!self.$gameParty.inBattle() && !self.$gameMessage.isBusy()) {
			let mapId;
			let x;
			let y;
			if (this._params[0] === 0) {
				// Direct designation
				mapId = this._params[1];
				x = this._params[2];
				y = this._params[3];
			} else {
				// Designation with variables
				mapId = self.$gameVariables.value(this._params[1]);
				x = self.$gameVariables.value(this._params[2]);
				y = self.$gameVariables.value(this._params[3]);
			}
			self.$gamePlayer.reserveTransfer(
				mapId,
				x,
				y,
				this._params[4],
				this._params[5]
			);
			this.setWaitMode('transfer');
			this._index++;
		}
		return false;
	}

	// Set Vehicle Location
	command202() {
		let mapId;
		let x;
		let y;
		if (this._params[1] === 0) {
			// Direct designation
			mapId = this._params[2];
			x = this._params[3];
			y = this._params[4];
		} else {
			// Designation with variables
			mapId = self.$gameVariables.value(this._params[2]);
			x = self.$gameVariables.value(this._params[3]);
			y = self.$gameVariables.value(this._params[4]);
		}
		const vehicle = self.$gameMap.vehicle(this._params[0]);
		if (vehicle) {
			vehicle.setLocation(mapId, x, y);
		}
		return true;
	}

	// Set Event Location
	command203() {
		const character = this.character(this._params[0]);
		if (character) {
			if (this._params[1] === 0) {
				// Direct designation
				character.locate(this._params[2], this._params[3]);
			} else if (this._params[1] === 1) {
				// Designation with variables
				const x = self.$gameVariables.value(this._params[2]);
				const y = self.$gameVariables.value(this._params[3]);
				character.locate(x, y);
			} else {
				// Exchange with another event
				const character2 = this.character(this._params[2]);
				if (character2) {
					character.swap(character2);
				}
			}
			if (this._params[4] > 0) {
				character.setDirection(this._params[4]);
			}
		}
		return true;
	}

	// Scroll Map
	command204() {
		if (!self.$gameParty.inBattle()) {
			if (self.$gameMap.isScrolling()) {
				this.setWaitMode('scroll');
				return false;
			}
			self.$gameMap.startScroll(
				this._params[0],
				this._params[1],
				this._params[2]
			);
		}
		return true;
	}

	// Set Movement Route
	command205() {
		self.$gameMap.refreshIfNeeded();
		this._character = this.character(this._params[0]);
		if (this._character) {
			this._character.forceMoveRoute(this._params[1]);
			const eventInfo = JsonEx.makeDeepCopy(this._eventInfo);
			eventInfo.line = this._index + 1;
			this._character.setCallerEventInfo(eventInfo);
			if (this._params[1].wait) {
				this.setWaitMode('route');
			}
		}
		return true;
	}

	// Getting On and Off Vehicles
	command206() {
		self.$gamePlayer.getOnOffVehicle();
		return true;
	}

	// Change Transparency
	command211() {
		self.$gamePlayer.setTransparent(this._params[0] === 0);
		return true;
	}

	// Show Animation
	command212() {
		this._character = this.character(this._params[0]);
		if (this._character) {
			this._character.requestAnimation(this._params[1]);
			if (this._params[2]) {
				this.setWaitMode('animation');
			}
		}
		return true;
	}

	// Show Balloon Icon
	command213() {
		this._character = this.character(this._params[0]);
		if (this._character) {
			this._character.requestBalloon(this._params[1]);
			if (this._params[2]) {
				this.setWaitMode('balloon');
			}
		}
		return true;
	}

	// Erase Event
	command214() {
		if (this.isOnCurrentMap() && this._eventId > 0) {
			self.$gameMap.eraseEvent(this._eventId);
		}
		return true;
	}

	// Change Player Followers
	command216() {
		if (this._params[0] === 0) {
			self.$gamePlayer.showFollowers();
		} else {
			self.$gamePlayer.hideFollowers();
		}
		self.$gamePlayer.refresh();
		return true;
	}

	// Gather Followers
	command217() {
		if (!self.$gameParty.inBattle()) {
			self.$gamePlayer.gatherFollowers();
			this.setWaitMode('gather');
		}
		return true;
	}

	// Fadeout Screen
	command221() {
		if (!self.$gameMessage.isBusy()) {
			self.$gameScreen.startFadeOut(this.fadeSpeed());
			this.wait(this.fadeSpeed());
			this._index++;
		}
		return false;
	}

	// Fadein Screen
	command222() {
		if (!self.$gameMessage.isBusy()) {
			self.$gameScreen.startFadeIn(this.fadeSpeed());
			this.wait(this.fadeSpeed());
			this._index++;
		}
		return false;
	}

	// Tint Screen
	command223() {
		self.$gameScreen.startTint(this._params[0], this._params[1]);
		if (this._params[2]) {
			this.wait(this._params[1]);
		}
		return true;
	}

	// Flash Screen
	command224() {
		self.$gameScreen.startFlash(this._params[0], this._params[1]);
		if (this._params[2]) {
			this.wait(this._params[1]);
		}
		return true;
	}

	// Shake Screen
	command225() {
		self.$gameScreen.startShake(
			this._params[0],
			this._params[1],
			this._params[2]
		);
		if (this._params[3]) {
			this.wait(this._params[2]);
		}
		return true;
	}

	// Wait
	command230() {
		this.wait(this._params[0]);
		return true;
	}

	// Show Picture
	command231() {
		let x;
		let y;
		if (this._params[3] === 0) {
			// Direct designation
			x = this._params[4];
			y = this._params[5];
		} else {
			// Designation with variables
			x = self.$gameVariables.value(this._params[4]);
			y = self.$gameVariables.value(this._params[5]);
		}
		self.$gameScreen.showPicture(
			this._params[0],
			this._params[1],
			this._params[2],
			x,
			y,
			this._params[6],
			this._params[7],
			this._params[8],
			this._params[9]
		);
		return true;
	}

	// Move Picture
	command232() {
		let x;
		let y;
		if (this._params[3] === 0) {
			// Direct designation
			x = this._params[4];
			y = this._params[5];
		} else {
			// Designation with variables
			x = self.$gameVariables.value(this._params[4]);
			y = self.$gameVariables.value(this._params[5]);
		}
		self.$gameScreen.movePicture(
			this._params[0],
			this._params[2],
			x,
			y,
			this._params[6],
			this._params[7],
			this._params[8],
			this._params[9],
			this._params[10]
		);
		if (this._params[11]) {
			this.wait(this._params[10]);
		}
		return true;
	}

	// Rotate Picture
	command233() {
		self.$gameScreen.rotatePicture(this._params[0], this._params[1]);
		return true;
	}

	// Tint Picture
	command234() {
		self.$gameScreen.tintPicture(
			this._params[0],
			this._params[1],
			this._params[2]
		);
		if (this._params[3]) {
			this.wait(this._params[2]);
		}
		return true;
	}

	// Erase Picture
	command235() {
		self.$gameScreen.erasePicture(this._params[0]);
		return true;
	}

	// Set Weather Effect
	command236() {
		if (!self.$gameParty.inBattle()) {
			self.$gameScreen.changeWeather(
				this._params[0],
				this._params[1],
				this._params[2]
			);
			if (this._params[3]) {
				this.wait(this._params[2]);
			}
		}
		return true;
	}

	// Play BGM
	command241() {
		AudioManager.playBgm(this._params[0]);
		return true;
	}

	// Fadeout BGM
	command242() {
		AudioManager.fadeOutBgm(this._params[0]);
		return true;
	}

	// Save BGM
	command243() {
		self.$gameSystem.saveBgm();
		return true;
	}

	// Resume BGM
	command244() {
		self.$gameSystem.replayBgm();
		return true;
	}

	// Play BGS
	command245() {
		AudioManager.playBgs(this._params[0]);
		return true;
	}

	// Fadeout BGS
	command246() {
		AudioManager.fadeOutBgs(this._params[0]);
		return true;
	}

	// Play ME
	command249() {
		AudioManager.playMe(this._params[0]);
		return true;
	}

	// Play SE
	command250() {
		AudioManager.playSe(this._params[0]);
		return true;
	}

	// Stop SE
	command251() {
		AudioManager.stopSe();
		return true;
	}

	// Play Movie
	command261() {
		if (!self.$gameMessage.isBusy()) {
			const name = this._params[0];
			if (name.length > 0) {
				const ext = this.videoFileExt();
				Graphics.playVideo(`movies/${name}${ext}`);
				this.setWaitMode('video');
			}
			this._index++;
		}
		return false;
	}

	videoFileExt() {
		if (Graphics.canPlayVideoType('video/webm') && !Utils.isMobileDevice()) {
			return '.webm';
		} else {
			return '.mp4';
		}
	}

	// Change Map Name Display
	command281() {
		if (this._params[0] === 0) {
			self.$gameMap.enableNameDisplay();
		} else {
			self.$gameMap.disableNameDisplay();
		}
		return true;
	}

	// Change Tileset
	command282() {
		const tileset = self.$dataTilesets[this._params[0]];
		if (!this._imageReservationId) {
			this._imageReservationId = Utils.generateRuntimeId();
		}

		const allReady = tileset.tilesetNames
			.map(function (tilesetName) {
				return ImageManager.reserveTileset(
					tilesetName,
					0,
					this._imageReservationId
				);
			}, this)
			.every((bitmap) => bitmap.isReady());

		if (allReady) {
			self.$gameMap.changeTileset(this._params[0]);
			ImageManager.releaseReservation(this._imageReservationId);
			this._imageReservationId = null;

			return true;
		} else {
			return false;
		}
	}

	// Change Battle Back
	command283() {
		self.$gameMap.changeBattleback(this._params[0], this._params[1]);
		return true;
	}

	// Change Parallax
	command284() {
		self.$gameMap.changeParallax(
			this._params[0],
			this._params[1],
			this._params[2],
			this._params[3],
			this._params[4]
		);
		return true;
	}

	// Get Location Info
	command285() {
		let x;
		let y;
		let value;
		if (this._params[2] === 0) {
			// Direct designation
			x = this._params[3];
			y = this._params[4];
		} else {
			// Designation with variables
			x = self.$gameVariables.value(this._params[3]);
			y = self.$gameVariables.value(this._params[4]);
		}
		switch (this._params[1]) {
			case 0: // Terrain Tag
				value = self.$gameMap.terrainTag(x, y);
				break;
			case 1: // Event ID
				value = self.$gameMap.eventIdXy(x, y);
				break;
			case 2: // Tile ID (Layer 1)
			case 3: // Tile ID (Layer 2)
			case 4: // Tile ID (Layer 3)
			case 5: // Tile ID (Layer 4)
				value = self.$gameMap.tileId(x, y, this._params[1] - 2);
				break;
			default: // Region ID
				value = self.$gameMap.regionId(x, y);
				break;
		}
		self.$gameVariables.setValue(this._params[0], value);
		return true;
	}

	// Battle Processing
	command301() {
		if (!self.$gameParty.inBattle()) {
			let troopId;
			if (this._params[0] === 0) {
				// Direct designation
				troopId = this._params[1];
			} else if (this._params[0] === 1) {
				// Designation with a variable
				troopId = self.$gameVariables.value(this._params[1]);
			} else {
				// Same as Random Encounter
				troopId = self.$gamePlayer.makeEncounterTroopId();
			}
			if (self.$dataTroops[troopId]) {
				BattleManager.setup(troopId, this._params[2], this._params[3]);
				BattleManager.setEventCallback((n) => {
					this._branch[this._indent] = n;
				});
				self.$gamePlayer.makeEncounterCount();
				SceneManager.push(Scene_Battle);
			}
		}
		return true;
	}

	// If Win
	command601() {
		if (this._branch[this._indent] !== 0) {
			this.skipBranch();
		}
		return true;
	}

	// If Escape
	command602() {
		if (this._branch[this._indent] !== 1) {
			this.skipBranch();
		}
		return true;
	}

	// If Lose
	command603() {
		if (this._branch[this._indent] !== 2) {
			this.skipBranch();
		}
		return true;
	}

	// Shop Processing
	command302() {
		if (!self.$gameParty.inBattle()) {
			const goods = [this._params];
			while (this.nextEventCode() === 605) {
				this._index++;
				goods.push(this.currentCommand().parameters);
			}
			SceneManager.push(Scene_Shop);
			SceneManager.prepareNextScene(goods, this._params[4]);
		}
		return true;
	}

	// Name Input Processing
	command303() {
		if (!self.$gameParty.inBattle()) {
			if (self.$dataActors[this._params[0]]) {
				SceneManager.push(Scene_Name);
				SceneManager.prepareNextScene(this._params[0], this._params[1]);
			}
		}
		return true;
	}

	// Change HP
	command311() {
		const value = this.operateValue(
			this._params[2],
			this._params[3],
			this._params[4]
		);
		this.iterateActorEx(this._params[0], this._params[1], (actor) => {
			this.changeHp(actor, value, this._params[5]);
		});
		return true;
	}

	// Change MP
	command312() {
		const value = this.operateValue(
			this._params[2],
			this._params[3],
			this._params[4]
		);
		this.iterateActorEx(this._params[0], this._params[1], (actor) => {
			actor.gainMp(value);
		});
		return true;
	}

	// Change TP
	command326() {
		const value = this.operateValue(
			this._params[2],
			this._params[3],
			this._params[4]
		);
		this.iterateActorEx(this._params[0], this._params[1], (actor) => {
			actor.gainTp(value);
		});
		return true;
	}

	// Change State
	command313() {
		this.iterateActorEx(this._params[0], this._params[1], (actor) => {
			const alreadyDead = actor.isDead();
			if (this._params[2] === 0) {
				actor.addState(this._params[3]);
			} else {
				actor.removeState(this._params[3]);
			}
			if (actor.isDead() && !alreadyDead) {
				actor.performCollapse();
			}
			actor.clearResult();
		});
		return true;
	}

	// Recover All
	command314() {
		this.iterateActorEx(this._params[0], this._params[1], (actor) => {
			actor.recoverAll();
		});
		return true;
	}

	// Change EXP
	command315() {
		const value = this.operateValue(
			this._params[2],
			this._params[3],
			this._params[4]
		);
		this.iterateActorEx(this._params[0], this._params[1], (actor) => {
			actor.changeExp(actor.currentExp() + value, this._params[5]);
		});
		return true;
	}

	// Change Level
	command316() {
		const value = this.operateValue(
			this._params[2],
			this._params[3],
			this._params[4]
		);
		this.iterateActorEx(this._params[0], this._params[1], (actor) => {
			actor.changeLevel(actor.level + value, this._params[5]);
		});
		return true;
	}

	// Change Parameter
	command317() {
		const value = this.operateValue(
			this._params[3],
			this._params[4],
			this._params[5]
		);
		this.iterateActorEx(this._params[0], this._params[1], (actor) => {
			actor.addParam(this._params[2], value);
		});
		return true;
	}

	// Change Skill
	command318() {
		this.iterateActorEx(this._params[0], this._params[1], (actor) => {
			if (this._params[2] === 0) {
				actor.learnSkill(this._params[3]);
			} else {
				actor.forgetSkill(this._params[3]);
			}
		});
		return true;
	}

	// Change Equipment
	command319() {
		const actor = self.$gameActors.actor(this._params[0]);
		if (actor) {
			actor.changeEquipById(this._params[1], this._params[2]);
		}
		return true;
	}

	// Change Name
	command320() {
		const actor = self.$gameActors.actor(this._params[0]);
		if (actor) {
			actor.setName(this._params[1]);
		}
		return true;
	}

	// Change Class
	command321() {
		const actor = self.$gameActors.actor(this._params[0]);
		if (actor && self.$dataClasses[this._params[1]]) {
			actor.changeClass(this._params[1], this._params[2]);
		}
		return true;
	}

	// Change Actor Images
	command322() {
		const actor = self.$gameActors.actor(this._params[0]);
		if (actor) {
			actor.setCharacterImage(this._params[1], this._params[2]);
			actor.setFaceImage(this._params[3], this._params[4]);
			actor.setBattlerImage(this._params[5]);
		}
		self.$gamePlayer.refresh();
		return true;
	}

	// Change Vehicle Image
	command323() {
		const vehicle = self.$gameMap.vehicle(this._params[0]);
		if (vehicle) {
			vehicle.setImage(this._params[1], this._params[2]);
		}
		return true;
	}

	// Change Nickname
	command324() {
		const actor = self.$gameActors.actor(this._params[0]);
		if (actor) {
			actor.setNickname(this._params[1]);
		}
		return true;
	}

	// Change Profile
	command325() {
		const actor = self.$gameActors.actor(this._params[0]);
		if (actor) {
			actor.setProfile(this._params[1]);
		}
		return true;
	}

	// Change Enemy HP
	command331() {
		const value = this.operateValue(
			this._params[1],
			this._params[2],
			this._params[3]
		);
		this.iterateEnemyIndex(this._params[0], (enemy) => {
			this.changeHp(enemy, value, this._params[4]);
		});
		return true;
	}

	// Change Enemy MP
	command332() {
		const value = this.operateValue(
			this._params[1],
			this._params[2],
			this._params[3]
		);
		this.iterateEnemyIndex(this._params[0], (enemy) => {
			enemy.gainMp(value);
		});
		return true;
	}

	// Change Enemy TP
	command342() {
		const value = this.operateValue(
			this._params[1],
			this._params[2],
			this._params[3]
		);
		this.iterateEnemyIndex(this._params[0], (enemy) => {
			enemy.gainTp(value);
		});
		return true;
	}

	// Change Enemy State
	command333() {
		this.iterateEnemyIndex(this._params[0], (enemy) => {
			const alreadyDead = enemy.isDead();
			if (this._params[1] === 0) {
				enemy.addState(this._params[2]);
			} else {
				enemy.removeState(this._params[2]);
			}
			if (enemy.isDead() && !alreadyDead) {
				enemy.performCollapse();
			}
			enemy.clearResult();
		});
		return true;
	}

	// Enemy Recover All
	command334() {
		this.iterateEnemyIndex(this._params[0], (enemy) => {
			enemy.recoverAll();
		});
		return true;
	}

	// Enemy Appear
	command335() {
		this.iterateEnemyIndex(this._params[0], (enemy) => {
			enemy.appear();
			self.$gameTroop.makeUniqueNames();
		});
		return true;
	}

	// Enemy Transform
	command336() {
		this.iterateEnemyIndex(this._params[0], (enemy) => {
			enemy.transform(this._params[1]);
			self.$gameTroop.makeUniqueNames();
		});
		return true;
	}

	// Show Battle Animation
	command337() {
		if (this._params[2] == true) {
			this.iterateEnemyIndex(-1, (enemy) => {
				if (enemy.isAlive()) {
					enemy.startAnimation(this._params[1], false, 0);
				}
			});
		} else {
			this.iterateEnemyIndex(this._params[0], (enemy) => {
				if (enemy.isAlive()) {
					enemy.startAnimation(this._params[1], false, 0);
				}
			});
		}
		return true;
	}

	// Force Action
	command339() {
		this.iterateBattler(this._params[0], this._params[1], (battler) => {
			if (!battler.isDeathStateAffected()) {
				battler.forceAction(this._params[2], this._params[3]);
				BattleManager.forceAction(battler);
				this.setWaitMode('action');
			}
		});
		return true;
	}

	// Abort Battle
	command340() {
		BattleManager.abort();
		return true;
	}

	// Open Menu Screen
	command351() {
		if (!self.$gameParty.inBattle()) {
			SceneManager.push(Scene_Menu);
			Window_MenuCommand.initCommandPosition();
		}
		return true;
	}

	// Open Save Screen
	command352() {
		if (!self.$gameParty.inBattle()) {
			SceneManager.push(Scene_Save);
		}
		return true;
	}

	// Game Over
	command353() {
		SceneManager.goto(Scene_Gameover);
		return true;
	}

	// Return to Title Screen
	command354() {
		SceneManager.goto(Scene_Title);
		return true;
	}

	// Script
	command355() {
		const startLine = this._index + 1;
		let script = `${this.currentCommand().parameters[0]}\n`;
		while (this.nextEventCode() === 655) {
			this._index++;
			script += `${this.currentCommand().parameters[0]}\n`;
		}
		const endLine = this._index + 1;
		try {
			eval(script);
		} catch (error) {
			error.line = `${startLine}-${endLine}`;
			error.eventCommand = 'script';
			error.content = script;
			throw error;
		}
		return true;
	}

	// Plugin Command
	command356() {
		const args = this._params[0].split(' ');
		const command = args.shift();
		try {
			this.pluginCommand(command, args);
		} catch (error) {
			error.eventCommand = 'plugin_command';
			error.content = this._params[0];
			throw error;
		}
		return true;
	}

	pluginCommand(command, args) {
		// to be overridden by plugins
	}

	static requestImagesByPluginCommand(command, args) {}

	static requestImagesForCommand({ parameters, code }) {
		const params = parameters;
		switch (code) {
			// Show Text
			case 101:
				ImageManager.requestFace(params[0]);
				break;

			// Change Party Member
			case 129:
				const actor = self.$gameActors.actor(params[0]);
				if (actor && params[1] === 0) {
					const name = actor.characterName();
					ImageManager.requestCharacter(name);
				}
				break;

			// Set Movement Route
			case 205:
				if (params[1]) {
					params[1].list.forEach(({ parameters, code }) => {
						const params = parameters;
						if (code === Game_Character.ROUTE_CHANGE_IMAGE) {
							ImageManager.requestCharacter(params[0]);
						}
					});
				}
				break;

			// Show Animation, Show Battle Animation
			case 212:
			case 337:
				if (params[1]) {
					const animation = self.$dataAnimations[params[1]];
					const name1 = animation.animation1Name;
					const name2 = animation.animation2Name;
					const hue1 = animation.animation1Hue;
					const hue2 = animation.animation2Hue;
					ImageManager.requestAnimation(name1, hue1);
					ImageManager.requestAnimation(name2, hue2);
				}
				break;

			// Change Player Followers
			case 216:
				if (params[0] === 0) {
					self.$gamePlayer.followers().forEach((follower) => {
						const name = follower.characterName();
						ImageManager.requestCharacter(name);
					});
				}
				break;

			// Show Picture
			case 231:
				ImageManager.requestPicture(params[1]);
				break;

			// Change Tileset
			case 282:
				const tileset = self.$dataTilesets[params[0]];
				tileset.tilesetNames.forEach((tilesetName) => {
					ImageManager.requestTileset(tilesetName);
				});
				break;

			// Change Battle Back
			case 283:
				if (self.$gameParty.inBattle()) {
					ImageManager.requestBattleback1(params[0]);
					ImageManager.requestBattleback2(params[1]);
				}
				break;

			// Change Parallax
			case 284:
				if (!self.$gameParty.inBattle()) {
					ImageManager.requestParallax(params[0]);
				}
				break;

			// Change Actor Images
			case 322:
				ImageManager.requestCharacter(params[1]);
				ImageManager.requestFace(params[3]);
				ImageManager.requestSvActor(params[5]);
				break;

			// Change Vehicle Image
			case 323:
				const vehicle = self.$gameMap.vehicle(params[0]);
				if (vehicle) {
					ImageManager.requestCharacter(params[1]);
				}
				break;

			// Enemy Transform
			case 336:
				const enemy = self.$dataEnemies[params[1]];
				const name = enemy.battlerName;
				const hue = enemy.battlerHue;
				if (self.$gameSystem.isSideView()) {
					ImageManager.requestSvEnemy(name, hue);
				} else {
					ImageManager.requestEnemy(name, hue);
				}
				break;
			// Plugin Command
			case 356:
				const args = params[0].split(' ');
				const commandName = args.shift();
				Game_Interpreter.requestImagesByPluginCommand(commandName, args);
				break;
		}
	}

	static requestImagesByChildEvent({ parameters }, commonList) {
		const params = parameters;
		const commonEvent = self.$dataCommonEvents[params[0]];
		if (commonEvent) {
			if (!commonList) {
				commonList = [];
			}
			if (!commonList.contains(params[0])) {
				commonList.push(params[0]);
				Game_Interpreter.requestImages(commonEvent.list, commonList);
			}
		}
	}

	static requestImages(list, commonList) {
		if (!list) {
			return;
		}
		const len = list.length;
		for (let i = 0; i < len; i += 1) {
			const command = list[i];
			// Common Event
			if (command.code === 117) {
				Game_Interpreter.requestImagesByChildEvent(command, commonList);
			} else {
				Game_Interpreter.requestImagesForCommand(command);
			}
		}
	}
}

export { Game_Interpreter };
