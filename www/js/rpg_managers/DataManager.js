import Graphics from '../rpg_core/Graphics.js';
import Decrypter from '../rpg_core/Decrypter.js';
import ResourceHandler from '../rpg_core/ResourceHandler.js';
import StorageManager from '../rpg_managers/StorageManager.js';
import SceneManager from '../rpg_managers/SceneManager.js';
import BattleManager from '../rpg_managers/BattleManager.js';
import ImageManager from '../rpg_managers/ImageManager.js';
import JsonEx from '../rpg_core/JsonEx.js';
import Scene_Boot from '../rpg_scenes/Scene_Boot.js';
import Utils from '../rpg_core/Utils.js';
import Game_Temp from '../rpg_objects/Game_Temp.js';
import Game_System from '../rpg_objects/Game_System.js';
import Game_Screen from '../rpg_objects/Game_Screen.js';
import Game_Timer from '../rpg_objects/Game_Timer.js';
import Game_Message from '../rpg_objects/Game_Message.js';
import Game_Switches from '../rpg_objects/Game_Switches.js';
import Game_Variables from '../rpg_objects/Game_Variables.js';
import Game_SelfSwitches from '../rpg_objects/Game_SelfSwitches.js';
import Game_Actors from '../rpg_objects/Game_Actors.js';
import Game_Party from '../rpg_objects/Game_Party.js';
import Game_Troop from '../rpg_objects/Game_Troop.js';
import Game_Map from '../rpg_objects/Game_Map.js';
import Game_Player from '../rpg_objects/Game_Player.js';

//-----------------------------------------------------------------------------
// DataManager
//
// The static class that manages the database and game objects.

class DataManager {
	constructor() {
		throw new Error('This is a static class');
	}

	static loadDatabase() {
		const test = this.isBattleTest() || this.isEventTest();
		const prefix = test ? 'Test_' : '';
		for (let i = 0; i < this._databaseFiles.length; i++) {
			const name = this._databaseFiles[i].name;
			const src = this._databaseFiles[i].src;
			this.loadDataFile(name, prefix + src);
		}
		if (this.isEventTest()) {
			this.loadDataFile('$testEvent', `${prefix}Event.json`);
		}
	}

	static loadDataFile(name, src) {
		const xhr = new XMLHttpRequest();
		const url = `data/${src}`;
		xhr.open('GET', url);
		xhr.overrideMimeType('application/json');
		xhr.onload = () => {
			if (xhr.status < 400) {
				window[name] = JSON.parse(xhr.responseText);
				DataManager.onLoad(window[name]);
			}
		};
		xhr.onerror =
			this._mapLoader ||
			(() => {
				DataManager._errorUrl = DataManager._errorUrl || url;
			});
		window[name] = null;
		xhr.send();
	}

	static isDatabaseLoaded() {
		this.checkError();
		for (let i = 0; i < this._databaseFiles.length; i++) {
			if (!window[this._databaseFiles[i].name]) {
				return false;
			}
		}
		return true;
	}

	static loadMapData(mapId) {
		if (mapId > 0) {
			const filename = 'Map%1.json'.format(mapId.padZero(3));
			this._mapLoader = ResourceHandler.createLoader(
				`data/${filename}`,
				this.loadDataFile.bind(this, '$dataMap', filename)
			);
			this.loadDataFile('$dataMap', filename);
		} else {
			this.makeEmptyMap();
		}
	}

	static isMapLoaded() {
		this.checkError();
		return !!self.$dataMap;
	}

	static onLoad(object) {
		let array;
		if (object === self.$dataMap) {
			this.extractMetadata(object);
			array = object.events;
		} else {
			array = object;
		}
		if (Array.isArray(array)) {
			for (const data of array) {
				if (data && data.note !== undefined) {
					this.extractMetadata(data);
				}
			}
		}
		if (object === self.$dataSystem) {
			Decrypter.hasEncryptedImages = !!object.hasEncryptedImages;
			Decrypter.hasEncryptedAudio = !!object.hasEncryptedAudio;
			Scene_Boot.loadSystemImages();
		}
	}

	static setupNewGame() {
		this.createGameObjects();
		this.selectSavefileForNewGame();
		self.$gameParty.setupStartingMembers();
		self.$gamePlayer.reserveTransfer(
			self.$dataSystem.startMapId,
			self.$dataSystem.startX,
			self.$dataSystem.startY
		);
		Graphics.frameCount = 0;
		SceneManager.resetFrameCount();
	}

	static setupBattleTest() {
		this.createGameObjects();
		self.$gameParty.setupBattleTest();
		BattleManager.setup(self.$dataSystem.testTroopId, true, false);
		BattleManager.setBattleTest(true);
		BattleManager.playBattleBgm();
	}

	static setupEventTest() {
		this.createGameObjects();
		this.selectSavefileForNewGame();
		self.$gameParty.setupStartingMembers();
		self.$gamePlayer.reserveTransfer(-1, 8, 6);
		self.$gamePlayer.setTransparent(false);
	}

	static loadGlobalInfo() {
		if (this._globalInfo) {
			return this._globalInfo;
		}
		let json;
		try {
			json = StorageManager.load(0);
		} catch (e) {
			console.error(e);
			return [];
		}
		if (json) {
			this._globalInfo = JSON.parse(json);
			for (let i = 1; i <= this.maxSavefiles(); i++) {
				if (!StorageManager.exists(i)) {
					delete this._globalInfo[i];
				}
			}
			return this._globalInfo;
		} else {
			this._globalInfo = [];
			return this._globalInfo;
		}
	}

	static saveGlobalInfo(info) {
		this._globalInfo = null;
		StorageManager.save(0, JSON.stringify(info));
	}

	static isThisGameFile(savefileId) {
		const globalInfo = this.loadGlobalInfo();
		if (globalInfo && globalInfo[savefileId]) {
			if (StorageManager.isLocalMode()) {
				return true;
			} else {
				const savefile = globalInfo[savefileId];
				return (
					savefile.globalId === this._globalId &&
					savefile.title === self.$dataSystem.gameTitle
				);
			}
		} else {
			return false;
		}
	}

	static isAnySavefileExists() {
		const globalInfo = this.loadGlobalInfo();
		if (globalInfo) {
			for (let i = 1; i < globalInfo.length; i++) {
				if (this.isThisGameFile(i)) {
					return true;
				}
			}
		}
		return false;
	}

	static latestSavefileId() {
		const globalInfo = this.loadGlobalInfo();
		let savefileId = 1;
		let timestamp = 0;
		if (globalInfo) {
			for (let i = 1; i < globalInfo.length; i++) {
				if (this.isThisGameFile(i) && globalInfo[i].timestamp > timestamp) {
					timestamp = globalInfo[i].timestamp;
					savefileId = i;
				}
			}
		}
		return savefileId;
	}

	static loadAllSavefileImages() {
		const globalInfo = this.loadGlobalInfo();
		if (globalInfo) {
			for (let i = 1; i < globalInfo.length; i++) {
				if (this.isThisGameFile(i)) {
					const info = globalInfo[i];
					this.loadSavefileImages(info);
				}
			}
		}
	}

	static saveGame(savefileId) {
		try {
			StorageManager.backup(savefileId);
			return this.saveGameWithoutRescue(savefileId);
		} catch (e) {
			console.error(e);
			try {
				StorageManager.remove(savefileId);
				StorageManager.restoreBackup(savefileId);
			} catch (e2) {}
			return false;
		}
	}

	static loadGame(savefileId) {
		try {
			return this.loadGameWithoutRescue(savefileId);
		} catch (e) {
			console.error(e);
			return false;
		}
	}

	static loadSavefileInfo(savefileId) {
		const globalInfo = this.loadGlobalInfo();
		return globalInfo && globalInfo[savefileId] ? globalInfo[savefileId] : null;
	}

	static lastAccessedSavefileId() {
		return this._lastAccessedId;
	}

	static saveGameWithoutRescue(savefileId) {
		const json = JsonEx.stringify(this.makeSaveContents());
		if (json.length >= 200000) {
			console.warn(
				'[DataManager.saveGameWithoutRescue] Save data length %i is larger than suggested 200000.',
				json.length
			);
		}
		StorageManager.save(savefileId, json);
		this._lastAccessedId = savefileId;
		const globalInfo = this.loadGlobalInfo() || [];
		globalInfo[savefileId] = this.makeSavefileInfo();
		this.saveGlobalInfo(globalInfo);
		return true;
	}

	static loadGameWithoutRescue(savefileId) {
		if (this.isThisGameFile(savefileId)) {
			const json = StorageManager.load(savefileId);
			this.createGameObjects();
			this.extractSaveContents(JsonEx.parse(json));
			this._lastAccessedId = savefileId;
			return true;
		} else {
			return false;
		}
	}

	static selectSavefileForNewGame() {
		const globalInfo = this.loadGlobalInfo();
		this._lastAccessedId = 1;
		if (globalInfo) {
			const numSavefiles = Math.max(0, globalInfo.length - 1);
			if (numSavefiles < this.maxSavefiles()) {
				this._lastAccessedId = numSavefiles + 1;
			} else {
				let timestamp = Number.MAX_VALUE;
				for (let i = 1; i < globalInfo.length; i++) {
					if (!globalInfo[i]) {
						this._lastAccessedId = i;
						break;
					}
					if (globalInfo[i].timestamp < timestamp) {
						timestamp = globalInfo[i].timestamp;
						this._lastAccessedId = i;
					}
				}
			}
		}
	}

	static makeSavefileInfo() {
		const info = {};
		info.globalId = this._globalId;
		info.title = self.$dataSystem.gameTitle;
		info.characters = self.$gameParty.charactersForSavefile();
		info.faces = self.$gameParty.facesForSavefile();
		info.playtime = self.$gameSystem.playtimeText();
		info.timestamp = Date.now();
		return info;
	}

	static setAutoSaveFileId(autoSaveFileId) {
		this._autoSaveFileId = autoSaveFileId;
	}

	static isAutoSaveFileId(saveFileId) {
		return this._autoSaveFileId !== 0 && this._autoSaveFileId === saveFileId;
	}

	static autoSaveGame() {
		if (
			this._autoSaveFileId !== 0 &&
			!this.isEventTest() &&
			self.$gameSystem.isSaveEnabled()
		) {
			self.$gameSystem.onBeforeSave();
			if (this.saveGame(this._autoSaveFileId)) {
				StorageManager.cleanBackup(this._autoSaveFileId);
			}
		}
	}

	static makeEmptyMap() {
		self.$dataMap = {};
		self.$dataMap.data = [];
		self.$dataMap.events = [];
		self.$dataMap.width = 100;
		self.$dataMap.height = 100;
		self.$dataMap.scrollType = 3;
	}

	static extractMetadata(data) {
		const re = /<([^<>:]+)(:?)([^>]*)>/g;
		data.meta = {};
		for (;;) {
			const match = re.exec(data.note);
			if (match) {
				if (match[2] === ':') {
					data.meta[match[1]] = match[3];
				} else {
					data.meta[match[1]] = true;
				}
			} else {
				break;
			}
		}
	}

	static checkError() {
		if (DataManager._errorUrl) {
			throw new Error(`Failed to load: ${DataManager._errorUrl}`);
		}
	}

	static isBattleTest() {
		return Utils.isOptionValid('btest');
	}

	static isEventTest() {
		return Utils.isOptionValid('etest');
	}

	static isSkill(item) {
		return item && self.$dataSkills.contains(item);
	}

	static isItem(item) {
		return item && self.$dataItems.contains(item);
	}

	static isWeapon(item) {
		return item && self.$dataWeapons.contains(item);
	}

	static isArmor(item) {
		return item && self.$dataArmors.contains(item);
	}

	static createGameObjects() {
		self.$gameTemp = new Game_Temp();
		self.$gameSystem = new Game_System();
		self.$gameScreen = new Game_Screen();
		self.$gameTimer = new Game_Timer();
		self.$gameMessage = new Game_Message();
		self.$gameSwitches = new Game_Switches();
		self.$gameVariables = new Game_Variables();
		self.$gameSelfSwitches = new Game_SelfSwitches();
		self.$gameActors = new Game_Actors();
		self.$gameParty = new Game_Party();
		self.$gameTroop = new Game_Troop();
		self.$gameMap = new Game_Map();
		self.$gamePlayer = new Game_Player();
	}

	static loadSavefileImages({ characters, faces }) {
		if (characters) {
			for (let i = 0; i < characters.length; i++) {
				ImageManager.reserveCharacter(characters[i][0]);
			}
		}
		if (faces) {
			for (let j = 0; j < faces.length; j++) {
				ImageManager.reserveFace(faces[j][0]);
			}
		}
	}

	static maxSavefiles() {
		return 20;
	}

	static makeSaveContents() {
		// A save data does not contain $gameTemp, $gameMessage, and $gameTroop.
		const contents = {};
		contents.system = self.$gameSystem;
		contents.screen = self.$gameScreen;
		contents.timer = self.$gameTimer;
		contents.switches = self.$gameSwitches;
		contents.variables = self.$gameVariables;
		contents.selfSwitches = self.$gameSelfSwitches;
		contents.actors = self.$gameActors;
		contents.party = self.$gameParty;
		contents.map = self.$gameMap;
		contents.player = self.$gamePlayer;
		return contents;
	}

	static extractSaveContents(contents) {
		self.$gameSystem = contents.system;
		self.$gameScreen = contents.screen;
		self.$gameTimer = contents.timer;
		self.$gameSwitches = contents.switches;
		self.$gameVariables = contents.variables;
		self.$gameSelfSwitches = contents.selfSwitches;
		self.$gameActors = contents.actors;
		self.$gameParty = contents.party;
		self.$gameMap = contents.map;
		self.$gamePlayer = contents.player;
	}
}

DataManager._globalId = 'RPGMV';
DataManager._lastAccessedId = 1;
DataManager._errorUrl = null;
DataManager._autoSaveFileId = 0;

DataManager._databaseFiles = [
	{
		name: '$dataActors',
		src: 'Actors.json',
	},
	{
		name: '$dataClasses',
		src: 'Classes.json',
	},
	{
		name: '$dataSkills',
		src: 'Skills.json',
	},
	{
		name: '$dataItems',
		src: 'Items.json',
	},
	{
		name: '$dataWeapons',
		src: 'Weapons.json',
	},
	{
		name: '$dataArmors',
		src: 'Armors.json',
	},
	{
		name: '$dataEnemies',
		src: 'Enemies.json',
	},
	{
		name: '$dataTroops',
		src: 'Troops.json',
	},
	{
		name: '$dataStates',
		src: 'States.json',
	},
	{
		name: '$dataAnimations',
		src: 'Animations.json',
	},
	{
		name: '$dataTilesets',
		src: 'Tilesets.json',
	},
	{
		name: '$dataCommonEvents',
		src: 'CommonEvents.json',
	},
	{
		name: '$dataSystem',
		src: 'System.json',
	},
	{
		name: '$dataMapInfos',
		src: 'MapInfos.json',
	},
];

let $dataActors = null;
let $dataClasses = null;
let $dataSkills = null;
let $dataItems = null;
let $dataWeapons = null;
let $dataArmors = null;
let $dataEnemies = null;
let $dataTroops = null;
let $dataStates = null;
let $dataAnimations = null;
let $dataTilesets = null;
let $dataCommonEvents = null;
let $dataSystem = null;
let $dataMapInfos = null;
let $dataMap = null;
let $gameTemp = null;
let $gameSystem = null;
let $gameScreen = null;
let $gameTimer = null;
let $gameMessage = null;
let $gameSwitches = null;
let $gameVariables = null;
let $gameSelfSwitches = null;
let $gameActors = null;
let $gameParty = null;
let $gameTroop = null;
let $gameMap = null;
let $gamePlayer = null;
let $testEvent = null;

export {
	$dataActors,
	$dataClasses,
	$dataSkills,
	$dataItems,
	$dataWeapons,
	$dataArmors,
	$dataEnemies,
	$dataTroops,
	$dataStates,
	$dataAnimations,
	$dataTilesets,
	$dataCommonEvents,
	$dataSystem,
	$dataMapInfos,
	$dataMap,
	$gameTemp,
	$gameSystem,
	$gameScreen,
	$gameTimer,
	$gameMessage,
	$gameSwitches,
	$gameVariables,
	$gameSelfSwitches,
	$gameActors,
	$gameParty,
	$gameTroop,
	$gameMap,
	$gamePlayer,
	$testEvent,
	DataManager,
};
