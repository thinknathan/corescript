import Game_Unit from './Game_Unit.js';
import BattleManager from '../rpg_managers/BattleManager.js';
import Game_Enemy from '../rpg_objects/Game_Enemy.js';
import Game_Interpreter from '../rpg_objects/Game_Interpreter.js';

//-----------------------------------------------------------------------------
// Game_Troop
//
// The game object class for a troop and the battle-related data.

class Game_Troop extends Game_Unit {
	constructor(...args) {
		super(...args);
		this.initialize(...args);
	}

	initialize() {
		super.initialize();
		this._interpreter = new Game_Interpreter();
		this.clear();
	}

	isEventRunning() {
		return this._interpreter.isRunning();
	}

	updateInterpreter() {
		this._interpreter.update();
	}

	turnCount() {
		return this._turnCount;
	}

	members() {
		return this._enemies;
	}

	clear() {
		this._interpreter.clear();
		this._troopId = 0;
		this._eventFlags = {};
		this._enemies = [];
		this._turnCount = 0;
		this._namesCount = {};
	}

	troop() {
		return self.$dataTroops[this._troopId];
	}

	setup(troopId) {
		this.clear();
		this._troopId = troopId;
		this._enemies = [];
		this.troop().members.forEach(function (member) {
			if (self.$dataEnemies[member.enemyId]) {
				const enemyId = member.enemyId;
				const x = member.x;
				const y = member.y;
				const enemy = new Game_Enemy(enemyId, x, y);
				if (member.hidden) {
					enemy.hide();
				}
				this._enemies.push(enemy);
			}
		}, this);
		this.makeUniqueNames();
	}

	makeUniqueNames() {
		const table = this.letterTable();
		this.members().forEach(function (enemy) {
			if (enemy.isAlive() && enemy.isLetterEmpty()) {
				const name = enemy.originalName();
				const n = this._namesCount[name] || 0;
				enemy.setLetter(table[n % table.length]);
				this._namesCount[name] = n + 1;
			}
		}, this);
		this.members().forEach(function (enemy) {
			const name = enemy.originalName();
			if (this._namesCount[name] >= 2) {
				enemy.setPlural(true);
			}
		}, this);
	}

	letterTable() {
		return self.$gameSystem.isCJK()
			? Game_Troop.LETTER_TABLE_FULL
			: Game_Troop.LETTER_TABLE_HALF;
	}

	enemyNames() {
		const names = [];
		this.members().forEach((enemy) => {
			const name = enemy.originalName();
			if (enemy.isAlive() && !names.contains(name)) {
				names.push(name);
			}
		});
		return names;
	}

	meetsConditions({ conditions }) {
		const c = conditions;
		if (
			!c.turnEnding &&
			!c.turnValid &&
			!c.enemyValid &&
			!c.actorValid &&
			!c.switchValid
		) {
			return false; // Conditions not set
		}
		if (c.turnEnding) {
			if (!BattleManager.isTurnEnd()) {
				return false;
			}
		}
		if (c.turnValid) {
			const n = this._turnCount;
			const a = c.turnA;
			const b = c.turnB;
			if (b === 0 && n !== a) {
				return false;
			}
			if (b > 0 && (n < 1 || n < a || n % b !== a % b)) {
				return false;
			}
		}
		if (c.enemyValid) {
			const enemy = self.$gameTroop.members()[c.enemyIndex];
			if (!enemy || enemy.hpRate() * 100 > c.enemyHp) {
				return false;
			}
		}
		if (c.actorValid) {
			const actor = self.$gameActors.actor(c.actorId);
			if (!actor || actor.hpRate() * 100 > c.actorHp) {
				return false;
			}
		}
		if (c.switchValid) {
			if (!self.$gameSwitches.value(c.switchId)) {
				return false;
			}
		}
		return true;
	}

	setupBattleEvent() {
		if (!this._interpreter.isRunning()) {
			if (this._interpreter.setupReservedCommonEvent()) {
				return;
			}
			const pages = this.troop().pages;
			for (let i = 0; i < pages.length; i++) {
				const page = pages[i];
				if (this.meetsConditions(page) && !this._eventFlags[i]) {
					this._interpreter.setup(page.list);
					this._interpreter.setEventInfo({
						eventType: 'battle_event',
						troopId: this._troopId,
						page: i + 1,
					});
					if (page.span <= 1) {
						this._eventFlags[i] = true;
					}
					break;
				}
			}
		}
	}

	increaseTurn() {
		const pages = this.troop().pages;

		pages.forEach(({ span }, i) => {
			if (span === 1) {
				this._eventFlags[i] = false;
			}
		});

		this._turnCount++;
	}

	expTotal() {
		return this.deadMembers().reduce((r, enemy) => r + enemy.exp(), 0);
	}

	goldTotal() {
		return (
			this.deadMembers().reduce((r, enemy) => r + enemy.gold(), 0) *
			this.goldRate()
		);
	}

	goldRate() {
		return self.$gameParty.hasGoldDouble() ? 2 : 1;
	}

	makeDropItems() {
		return this.deadMembers().reduce(
			(r, enemy) => r.concat(enemy.makeDropItems()),
			[]
		);
	}
}

Game_Troop.LETTER_TABLE_HALF = [
	' A',
	' B',
	' C',
	' D',
	' E',
	' F',
	' G',
	' H',
	' I',
	' J',
	' K',
	' L',
	' M',
	' N',
	' O',
	' P',
	' Q',
	' R',
	' S',
	' T',
	' U',
	' V',
	' W',
	' X',
	' Y',
	' Z',
];
Game_Troop.LETTER_TABLE_FULL = [
	'Ａ',
	'Ｂ',
	'Ｃ',
	'Ｄ',
	'Ｅ',
	'Ｆ',
	'Ｇ',
	'Ｈ',
	'Ｉ',
	'Ｊ',
	'Ｋ',
	'Ｌ',
	'Ｍ',
	'Ｎ',
	'Ｏ',
	'Ｐ',
	'Ｑ',
	'Ｒ',
	'Ｓ',
	'Ｔ',
	'Ｕ',
	'Ｖ',
	'Ｗ',
	'Ｘ',
	'Ｙ',
	'Ｚ',
];

export default Game_Troop;
