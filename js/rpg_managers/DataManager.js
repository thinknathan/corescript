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
		xhr.onerror = this._mapLoader || (() => {
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
			this._mapLoader = ResourceHandler.createLoader(`data/${filename}`, this.loadDataFile.bind(this, '$dataMap', filename));
			this.loadDataFile('$dataMap', filename);
		} else {
			this.makeEmptyMap();
		}
	}

	static isMapLoaded() {
		this.checkError();
		return !!$dataMap;
	}

	static onLoad(object) {
		let array;
		if (object === $dataMap) {
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
		if (object === $dataSystem) {
			Decrypter.hasEncryptedImages = !!object.hasEncryptedImages;
			Decrypter.hasEncryptedAudio = !!object.hasEncryptedAudio;
			Scene_Boot.loadSystemImages();
		}
	}

	static setupNewGame() {
		this.createGameObjects();
		this.selectSavefileForNewGame();
		$gameParty.setupStartingMembers();
		$gamePlayer.reserveTransfer($dataSystem.startMapId,
			$dataSystem.startX, $dataSystem.startY);
		Graphics.frameCount = 0;
		SceneManager.resetFrameCount();
	}

	static setupBattleTest() {
		this.createGameObjects();
		$gameParty.setupBattleTest();
		BattleManager.setup($dataSystem.testTroopId, true, false);
		BattleManager.setBattleTest(true);
		BattleManager.playBattleBgm();
	}

	static setupEventTest() {
		this.createGameObjects();
		this.selectSavefileForNewGame();
		$gameParty.setupStartingMembers();
		$gamePlayer.reserveTransfer(-1, 8, 6);
		$gamePlayer.setTransparent(false);
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
				return (savefile.globalId === this._globalId &&
					savefile.title === $dataSystem.gameTitle);
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
		return (globalInfo && globalInfo[savefileId]) ? globalInfo[savefileId] : null;
	}

	static lastAccessedSavefileId() {
		return this._lastAccessedId;
	}

	static saveGameWithoutRescue(savefileId) {
		const json = JsonEx.stringify(this.makeSaveContents());
		if (json.length >= 200000) {
			console.warn('[DataManager.saveGameWithoutRescue] Save data length %i is larger than suggested 200000.', json.length);
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
		info.title = $dataSystem.gameTitle;
		info.characters = $gameParty.charactersForSavefile();
		info.faces = $gameParty.facesForSavefile();
		info.playtime = $gameSystem.playtimeText();
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
		if (this._autoSaveFileId !== 0 && !this.isEventTest() && $gameSystem.isSaveEnabled()) {
			$gameSystem.onBeforeSave();
			if (this.saveGame(this._autoSaveFileId)) {
				StorageManager.cleanBackup(this._autoSaveFileId);
			}
		}
	}
}

/* jshint ignore:start */
var $dataActors = null;
var $dataClasses = null;
var $dataSkills = null;
var $dataItems = null;
var $dataWeapons = null;
var $dataArmors = null;
var $dataEnemies = null;
var $dataTroops = null;
var $dataStates = null;
var $dataAnimations = null;
var $dataTilesets = null;
var $dataCommonEvents = null;
var $dataSystem = null;
var $dataMapInfos = null;
var $dataMap = null;
var $gameTemp = null;
var $gameSystem = null;
var $gameScreen = null;
var $gameTimer = null;
var $gameMessage = null;
var $gameSwitches = null;
var $gameVariables = null;
var $gameSelfSwitches = null;
var $gameActors = null;
var $gameParty = null;
var $gameTroop = null;
var $gameMap = null;
var $gamePlayer = null;
var $testEvent = null;
/* jshint ignore:end */

DataManager._globalId = 'RPGMV';
DataManager._lastAccessedId = 1;
DataManager._errorUrl = null;
DataManager._autoSaveFileId = 0;

DataManager._databaseFiles = [
	{
		name: '$dataActors',
		src: 'Actors.json'
	},
	{
		name: '$dataClasses',
		src: 'Classes.json'
	},
	{
		name: '$dataSkills',
		src: 'Skills.json'
	},
	{
		name: '$dataItems',
		src: 'Items.json'
	},
	{
		name: '$dataWeapons',
		src: 'Weapons.json'
	},
	{
		name: '$dataArmors',
		src: 'Armors.json'
	},
	{
		name: '$dataEnemies',
		src: 'Enemies.json'
	},
	{
		name: '$dataTroops',
		src: 'Troops.json'
	},
	{
		name: '$dataStates',
		src: 'States.json'
	},
	{
		name: '$dataAnimations',
		src: 'Animations.json'
	},
	{
		name: '$dataTilesets',
		src: 'Tilesets.json'
	},
	{
		name: '$dataCommonEvents',
		src: 'CommonEvents.json'
	},
	{
		name: '$dataSystem',
		src: 'System.json'
	},
	{
		name: '$dataMapInfos',
		src: 'MapInfos.json'
	}
];

DataManager.makeEmptyMap = () => {
	$dataMap = {};
	$dataMap.data = [];
	$dataMap.events = [];
	$dataMap.width = 100;
	$dataMap.height = 100;
	$dataMap.scrollType = 3;
};

DataManager.extractMetadata = data => {
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
};

DataManager.checkError = () => {
	if (DataManager._errorUrl) {
		throw new Error(`Failed to load: ${DataManager._errorUrl}`);
	}
};

DataManager.isBattleTest = () => Utils.isOptionValid('btest');

DataManager.isEventTest = () => Utils.isOptionValid('etest');

DataManager.isSkill = item => item && $dataSkills.contains(item);

DataManager.isItem = item => item && $dataItems.contains(item);

DataManager.isWeapon = item => item && $dataWeapons.contains(item);

DataManager.isArmor = item => item && $dataArmors.contains(item);

DataManager.createGameObjects = () => {
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
};

DataManager.loadSavefileImages = ({
	characters,
	faces
}) => {
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
};

DataManager.maxSavefiles = () => 20;

DataManager.makeSaveContents = () => {
	// A save data does not contain $gameTemp, $gameMessage, and $gameTroop.
	const contents = {};
	contents.system = $gameSystem;
	contents.screen = $gameScreen;
	contents.timer = $gameTimer;
	contents.switches = $gameSwitches;
	contents.variables = $gameVariables;
	contents.selfSwitches = $gameSelfSwitches;
	contents.actors = $gameActors;
	contents.party = $gameParty;
	contents.map = $gameMap;
	contents.player = $gamePlayer;
	return contents;
};

DataManager.extractSaveContents = contents => {
	$gameSystem = contents.system;
	$gameScreen = contents.screen;
	$gameTimer = contents.timer;
	$gameSwitches = contents.switches;
	$gameVariables = contents.variables;
	$gameSelfSwitches = contents.selfSwitches;
	$gameActors = contents.actors;
	$gameParty = contents.party;
	$gameMap = contents.map;
	$gamePlayer = contents.player;
};
