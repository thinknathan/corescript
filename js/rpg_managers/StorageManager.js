//-----------------------------------------------------------------------------
// StorageManager
//
// The static class that manages storage for saving game data.

function StorageManager() {
	throw new Error('This is a static class');
}

StorageManager.save = function (savefileId, json) {
	if (this.isLocalMode()) {
		this.saveToLocalFile(savefileId, json);
	} else {
		this.saveToWebStorage(savefileId, json);
	}
};

StorageManager.load = function (savefileId) {
	if (this.isLocalMode()) {
		return this.loadFromLocalFile(savefileId);
	} else {
		return this.loadFromWebStorage(savefileId);
	}
};

StorageManager.exists = function (savefileId) {
	if (this.isLocalMode()) {
		return this.localFileExists(savefileId);
	} else {
		return this.webStorageExists(savefileId);
	}
};

StorageManager.remove = function (savefileId) {
	if (this.isLocalMode()) {
		this.removeLocalFile(savefileId);
	} else {
		this.removeWebStorage(savefileId);
	}
};

StorageManager.backup = function (savefileId) {
	if (this.exists(savefileId)) {
		if (this.isLocalMode()) {
			const data = this.loadFromLocalFile(savefileId);
			const compressed = LZString.compressToBase64(data);
			const fs = require('fs');
			const dirPath = this.localFileDirectoryPath();
			const filePath = this.localFilePath(savefileId) + ".bak";
			if (!fs.existsSync(dirPath)) {
				fs.mkdirSync(dirPath);
			}
			fs.writeFileSync(filePath, compressed);
		} else {
			const data = this.loadFromWebStorage(savefileId);
			const compressed = LZString.compressToBase64(data);
			const key = this.webStorageKey(savefileId) + "bak";
			localStorage.setItem(key, compressed);
		}
	}
};

StorageManager.backupExists = function (savefileId) {
	if (this.isLocalMode()) {
		return this.localFileBackupExists(savefileId);
	} else {
		return this.webStorageBackupExists(savefileId);
	}
};

StorageManager.cleanBackup = function (savefileId) {
	if (this.backupExists(savefileId)) {
		if (this.isLocalMode()) {
			const fs = require('fs');
			const filePath = this.localFilePath(savefileId);
			fs.unlinkSync(filePath + ".bak");
		} else {
			const key = this.webStorageKey(savefileId);
			localStorage.removeItem(key + "bak");
		}
	}
};

StorageManager.restoreBackup = function (savefileId) {
	if (this.backupExists(savefileId)) {
		if (this.isLocalMode()) {
			const data = this.loadFromLocalBackupFile(savefileId);
			const compressed = LZString.compressToBase64(data);
			const fs = require('fs');
			const dirPath = this.localFileDirectoryPath();
			const filePath = this.localFilePath(savefileId);
			if (!fs.existsSync(dirPath)) {
				fs.mkdirSync(dirPath);
			}
			fs.writeFileSync(filePath, compressed);
			fs.unlinkSync(filePath + ".bak");
		} else {
			const data = this.loadFromWebStorageBackup(savefileId);
			const compressed = LZString.compressToBase64(data);
			const key = this.webStorageKey(savefileId);
			localStorage.setItem(key, compressed);
			localStorage.removeItem(key + "bak");
		}
	}
};

StorageManager.isLocalMode = function () {
	return Utils.isNwjs();
};

StorageManager.saveToLocalFile = function (savefileId, json) {
	const data = LZString.compressToBase64(json);
	const fs = require('fs');
	const dirPath = this.localFileDirectoryPath();
	const filePath = this.localFilePath(savefileId);
	if (!fs.existsSync(dirPath)) {
		fs.mkdirSync(dirPath);
	}
	fs.writeFileSync(filePath, data);
};

StorageManager.loadFromLocalFile = function (savefileId) {
	let data = null;
	const fs = require('fs');
	const filePath = this.localFilePath(savefileId);
	if (fs.existsSync(filePath)) {
		data = fs.readFileSync(filePath, {
			encoding: 'utf8'
		});
	}
	return LZString.decompressFromBase64(data);
};

StorageManager.loadFromLocalBackupFile = function (savefileId) {
	let data = null;
	const fs = require('fs');
	const filePath = this.localFilePath(savefileId) + ".bak";
	if (fs.existsSync(filePath)) {
		data = fs.readFileSync(filePath, {
			encoding: 'utf8'
		});
	}
	return LZString.decompressFromBase64(data);
};

StorageManager.localFileBackupExists = function (savefileId) {
	const fs = require('fs');
	return fs.existsSync(this.localFilePath(savefileId) + ".bak");
};

StorageManager.localFileExists = function (savefileId) {
	const fs = require('fs');
	return fs.existsSync(this.localFilePath(savefileId));
};

StorageManager.removeLocalFile = function (savefileId) {
	const fs = require('fs');
	const filePath = this.localFilePath(savefileId);
	if (fs.existsSync(filePath)) {
		fs.unlinkSync(filePath);
	}
};

StorageManager.saveToWebStorage = function (savefileId, json) {
	const key = this.webStorageKey(savefileId);
	const data = LZString.compressToBase64(json);
	localStorage.setItem(key, data);
};

StorageManager.loadFromWebStorage = function (savefileId) {
	const key = this.webStorageKey(savefileId);
	const data = localStorage.getItem(key);
	return LZString.decompressFromBase64(data);
};

StorageManager.loadFromWebStorageBackup = function (savefileId) {
	const key = this.webStorageKey(savefileId) + "bak";
	const data = localStorage.getItem(key);
	return LZString.decompressFromBase64(data);
};

StorageManager.webStorageBackupExists = function (savefileId) {
	const key = this.webStorageKey(savefileId) + "bak";
	return !!localStorage.getItem(key);
};

StorageManager.webStorageExists = function (savefileId) {
	const key = this.webStorageKey(savefileId);
	return !!localStorage.getItem(key);
};

StorageManager.removeWebStorage = function (savefileId) {
	const key = this.webStorageKey(savefileId);
	localStorage.removeItem(key);
};

StorageManager.localFileDirectoryPath = function () {
	const path = require('path');

	const base = path.dirname(process.mainModule.filename);
	if (this.canMakeWwwSaveDirectory()) {
		return path.join(base, 'save/');
	} else {
		return path.join(path.dirname(base), 'save/');
	}
};

StorageManager.localFilePath = function (savefileId) {
	let name = '';
	if (savefileId < 0) {
		name = 'config.rpgsave';
	} else if (savefileId === 0) {
		name = 'global.rpgsave';
	} else {
		name = 'file%1.rpgsave'.format(savefileId);
	}
	return this.localFileDirectoryPath() + name;
};

StorageManager.webStorageKey = function (savefileId) {
	if (savefileId < 0) {
		return 'RPG Config';
	} else if (savefileId === 0) {
		return 'RPG Global';
	} else {
		return 'RPG File%1'.format(savefileId);
	}
};

// Enigma Virtual Box cannot make www/save directory
StorageManager.canMakeWwwSaveDirectory = function () {
	if (this._canMakeWwwSaveDirectory === undefined) {
		const fs = require('fs');
		const path = require('path');
		const base = path.dirname(process.mainModule.filename);
		const testPath = path.join(base, 'testDirectory/');
		try {
			fs.mkdirSync(testPath);
			fs.rmdirSync(testPath);
			this._canMakeWwwSaveDirectory = true;
		} catch (e) {
			this._canMakeWwwSaveDirectory = false;
		}
	}
	return this._canMakeWwwSaveDirectory;
};
