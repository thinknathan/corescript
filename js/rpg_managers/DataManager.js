//-----------------------------------------------------------------------------
// DataManager
//
// The static class that manages the database and game objects.

function DataManager() {
	throw new Error('This is a static class');
}

/* jshint ignore:start */
var $dataActors       = null;
var $dataClasses      = null;
var $dataSkills       = null;
var $dataItems        = null;
var $dataWeapons      = null;
var $dataArmors       = null;
var $dataEnemies      = null;
var $dataTroops       = null;
var $dataStates       = null;
var $dataAnimations   = null;
var $dataTilesets     = null;
var $dataCommonEvents = null;
var $dataSystem       = null;
var $dataMapInfos     = null;
var $dataMap          = null;
var $gameTemp         = null;
var $gameSystem       = null;
var $gameScreen       = null;
var $gameTimer        = null;
var $gameMessage      = null;
var $gameSwitches     = null;
var $gameVariables    = null;
var $gameSelfSwitches = null;
var $gameActors       = null;
var $gameParty        = null;
var $gameTroop        = null;
var $gameMap          = null;
var $gamePlayer       = null;
var $testEvent        = null;
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

DataManager.loadDatabase = function () {
	let test = this.isBattleTest() || this.isEventTest();
	let prefix = test ? 'Test_' : '';
	for (let i = 0; i < this._databaseFiles.length; i++) {
		let name = this._databaseFiles[i].name;
		let src = this._databaseFiles[i].src;
		this.loadDataFile(name, prefix + src);
	}
	if (this.isEventTest()) {
		this.loadDataFile('$testEvent', prefix + 'Event.json');
	}
};

DataManager.loadDataFile = function (name, src) {
	let xhr = new XMLHttpRequest();
	let url = 'data/' + src;
	xhr.open('GET', url);
	xhr.overrideMimeType('application/json');
	xhr.onload = function () {
		if (xhr.status < 400) {
			window[name] = JSON.parse(xhr.responseText);
			DataManager.onLoad(window[name]);
		}
	};
	xhr.onerror = this._mapLoader || function () {
		DataManager._errorUrl = DataManager._errorUrl || url;
	};
	window[name] = null;
	xhr.send();
};

DataManager.isDatabaseLoaded = function () {
	this.checkError();
	for (let i = 0; i < this._databaseFiles.length; i++) {
		if (!window[this._databaseFiles[i].name]) {
			return false;
		}
	}
	return true;
};

DataManager.loadMapData = function (mapId) {
	if (mapId > 0) {
		let filename = 'Map%1.json'.format(mapId.padZero(3));
		this._mapLoader = ResourceHandler.createLoader('data/' + filename, this.loadDataFile.bind(this, '$dataMap', filename));
		this.loadDataFile('$dataMap', filename);
	} else {
		this.makeEmptyMap();
	}
};

DataManager.makeEmptyMap = function () {
	$dataMap = {};
	$dataMap.data = [];
	$dataMap.events = [];
	$dataMap.width = 100;
	$dataMap.height = 100;
	$dataMap.scrollType = 3;
};

DataManager.isMapLoaded = function () {
	this.checkError();
	return !!$dataMap;
};

DataManager.onLoad = function (object) {
	let array;
	if (object === $dataMap) {
		this.extractMetadata(object);
		array = object.events;
	} else {
		array = object;
	}
	if (Array.isArray(array)) {
		for (let i = 0; i < array.length; i++) {
			let data = array[i];
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
};

DataManager.extractMetadata = function (data) {
	let re = /<([^<>:]+)(:?)([^>]*)>/g;
	data.meta = {};
	for (;;) {
		let match = re.exec(data.note);
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

DataManager.checkError = function () {
	if (DataManager._errorUrl) {
		throw new Error('Failed to load: ' + DataManager._errorUrl);
	}
};

DataManager.isBattleTest = function () {
	return Utils.isOptionValid('btest');
};

DataManager.isEventTest = function () {
	return Utils.isOptionValid('etest');
};

DataManager.isSkill = function (item) {
	return item && $dataSkills.contains(item);
};

DataManager.isItem = function (item) {
	return item && $dataItems.contains(item);
};

DataManager.isWeapon = function (item) {
	return item && $dataWeapons.contains(item);
};

DataManager.isArmor = function (item) {
	return item && $dataArmors.contains(item);
};

DataManager.createGameObjects = function () {
	$gameTemp = new Game_Temp();
	$gameSystem = new Game_System();
	$gameScreen = new Game_Screen();
	$gameTimer = new Game_Timer();
	$gameMessage = new Game_Message();
	$gameSwitches = new Game_Switches();
	$gameVariables = new Game_Variables();
	$gameSelfSwitches = new Game_SelfSwitches();
	$gameActors = new Game_Actors();
	$gameParty = new Game_Party();
	$gameTroop = new Game_Troop();
	$gameMap = new Game_Map();
	$gamePlayer = new Game_Player();
};

DataManager.setupNewGame = function () {
	this.createGameObjects();
	this.selectSavefileForNewGame();
	$gameParty.setupStartingMembers();
	$gamePlayer.reserveTransfer($dataSystem.startMapId,
		$dataSystem.startX, $dataSystem.startY);
	Graphics.frameCount = 0;
	SceneManager.resetFrameCount();
};

DataManager.setupBattleTest = function () {
	this.createGameObjects();
	$gameParty.setupBattleTest();
	BattleManager.setup($dataSystem.testTroopId, true, false);
	BattleManager.setBattleTest(true);
	BattleManager.playBattleBgm();
};

DataManager.setupEventTest = function () {
	this.createGameObjects();
	this.selectSavefileForNewGame();
	$gameParty.setupStartingMembers();
	$gamePlayer.reserveTransfer(-1, 8, 6);
	$gamePlayer.setTransparent(false);
};

DataManager.loadGlobalInfo = function () {
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
};

DataManager.saveGlobalInfo = function (info) {
	this._globalInfo = null;
	StorageManager.save(0, JSON.stringify(info));
};

DataManager.isThisGameFile = function (savefileId) {
	let globalInfo = this.loadGlobalInfo();
	if (globalInfo && globalInfo[savefileId]) {
		if (StorageManager.isLocalMode()) {
			return true;
		} else {
			let savefile = globalInfo[savefileId];
			return (savefile.globalId === this._globalId &&
				savefile.title === $dataSystem.gameTitle);
		}
	} else {
		return false;
	}
};

DataManager.isAnySavefileExists = function () {
	let globalInfo = this.loadGlobalInfo();
	if (globalInfo) {
		for (let i = 1; i < globalInfo.length; i++) {
			if (this.isThisGameFile(i)) {
				return true;
			}
		}
	}
	return false;
};

DataManager.latestSavefileId = function () {
	let globalInfo = this.loadGlobalInfo();
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
};

DataManager.loadAllSavefileImages = function () {
	let globalInfo = this.loadGlobalInfo();
	if (globalInfo) {
		for (let i = 1; i < globalInfo.length; i++) {
			if (this.isThisGameFile(i)) {
				let info = globalInfo[i];
				this.loadSavefileImages(info);
			}
		}
	}
};

DataManager.loadSavefileImages = function (info) {
	if (info.characters) {
		for (let i = 0; i < info.characters.length; i++) {
			ImageManager.reserveCharacter(info.characters[i][0]);
		}
	}
	if (info.faces) {
		for (let j = 0; j < info.faces.length; j++) {
			ImageManager.reserveFace(info.faces[j][0]);
		}
	}
};

DataManager.maxSavefiles = function () {
	return 20;
};

DataManager.saveGame = function (savefileId) {
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
};

DataManager.loadGame = function (savefileId) {
	try {
		return this.loadGameWithoutRescue(savefileId);
	} catch (e) {
		console.error(e);
		return false;
	}
};

DataManager.loadSavefileInfo = function (savefileId) {
	let globalInfo = this.loadGlobalInfo();
	return (globalInfo && globalInfo[savefileId]) ? globalInfo[savefileId] : null;
};

DataManager.lastAccessedSavefileId = function () {
	return this._lastAccessedId;
};

DataManager.saveGameWithoutRescue = function (savefileId) {
	let json = JsonEx.stringify(this.makeSaveContents());
	if (json.length >= 200000) {
		console.warn('Save data too big!');
	}
	StorageManager.save(savefileId, json);
	this._lastAccessedId = savefileId;
	let globalInfo = this.loadGlobalInfo() || [];
	globalInfo[savefileId] = this.makeSavefileInfo();
	this.saveGlobalInfo(globalInfo);
	return true;
};

DataManager.loadGameWithoutRescue = function (savefileId) {
	if (this.isThisGameFile(savefileId)) {
		let json = StorageManager.load(savefileId);
		this.createGameObjects();
		this.extractSaveContents(JsonEx.parse(json));
		this._lastAccessedId = savefileId;
		return true;
	} else {
		return false;
	}
};

DataManager.selectSavefileForNewGame = function () {
	let globalInfo = this.loadGlobalInfo();
	this._lastAccessedId = 1;
	if (globalInfo) {
		let numSavefiles = Math.max(0, globalInfo.length - 1);
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
};

DataManager.makeSavefileInfo = function () {
	let info = {};
	info.globalId = this._globalId;
	info.title = $dataSystem.gameTitle;
	info.characters = $gameParty.charactersForSavefile();
	info.faces = $gameParty.facesForSavefile();
	info.playtime = $gameSystem.playtimeText();
	info.timestamp = Date.now();
	return info;
};

DataManager.makeSaveContents = function () {
	// A save data does not contain $gameTemp, $gameMessage, and $gameTroop.
	let contents = {};
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

DataManager.extractSaveContents = function (contents) {
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

DataManager.setAutoSaveFileId = function (autoSaveFileId) {
	this._autoSaveFileId = autoSaveFileId;
};

DataManager.isAutoSaveFileId = function (saveFileId) {
	return this._autoSaveFileId !== 0 && this._autoSaveFileId === saveFileId;
};

DataManager.autoSaveGame = function () {
	if (this._autoSaveFileId !== 0 && !this.isEventTest() && $gameSystem.isSaveEnabled()) {
		$gameSystem.onBeforeSave();
		if (this.saveGame(this._autoSaveFileId)) {
			StorageManager.cleanBackup(this._autoSaveFileId);
		}
	}
};
