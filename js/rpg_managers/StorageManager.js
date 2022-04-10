import Utils from "../rpg_core/Utils.js";

//-----------------------------------------------------------------------------
// StorageManager
//
// The static class that manages storage for saving game data.

class StorageManager {
	constructor() {
		throw new Error('This is a static class');
	}

	static save(savefileId, json) {
		if (this.isLocalMode()) {
			this.saveToLocalFile(savefileId, json);
		} else {
			this.saveToWebStorage(savefileId, json);
		}
	}

	static load(savefileId) {
		if (this.isLocalMode()) {
			return this.loadFromLocalFile(savefileId);
		} else {
			return this.loadFromWebStorage(savefileId);
		}
	}

	static exists(savefileId) {
		if (this.isLocalMode()) {
			return this.localFileExists(savefileId);
		} else {
			return this.webStorageExists(savefileId);
		}
	}

	static remove(savefileId) {
		if (this.isLocalMode()) {
			this.removeLocalFile(savefileId);
		} else {
			this.removeWebStorage(savefileId);
		}
	}

	static backup(savefileId) {
		if (this.exists(savefileId)) {
			if (this.isLocalMode()) {
				const data = this.loadFromLocalFile(savefileId);
				const compressed = LZString.compressToBase64(data);
				const fs = require('fs');
				const dirPath = this.localFileDirectoryPath();
				const filePath = `${this.localFilePath(savefileId)}.bak`;
				if (!fs.existsSync(dirPath)) {
					fs.mkdirSync(dirPath);
				}
				fs.writeFileSync(filePath, compressed);
			} else {
				const data = this.loadFromWebStorage(savefileId);
				const compressed = LZString.compressToBase64(data);
				const key = `${this.webStorageKey(savefileId)}bak`;
				localStorage.setItem(key, compressed);
			}
		}
	}

	static backupExists(savefileId) {
		if (this.isLocalMode()) {
			return this.localFileBackupExists(savefileId);
		} else {
			return this.webStorageBackupExists(savefileId);
		}
	}

	static cleanBackup(savefileId) {
		if (this.backupExists(savefileId)) {
			if (this.isLocalMode()) {
				const fs = require('fs');
				const filePath = this.localFilePath(savefileId);
				fs.unlinkSync(`${filePath}.bak`);
			} else {
				const key = this.webStorageKey(savefileId);
				localStorage.removeItem(`${key}bak`);
			}
		}
	}

	static restoreBackup(savefileId) {
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
				fs.unlinkSync(`${filePath}.bak`);
			} else {
				const data = this.loadFromWebStorageBackup(savefileId);
				const compressed = LZString.compressToBase64(data);
				const key = this.webStorageKey(savefileId);
				localStorage.setItem(key, compressed);
				localStorage.removeItem(`${key}bak`);
			}
		}
	}

	static saveToLocalFile(savefileId, json) {
		const data = LZString.compressToBase64(json);
		const fs = require('fs');
		const dirPath = this.localFileDirectoryPath();
		const filePath = this.localFilePath(savefileId);
		if (!fs.existsSync(dirPath)) {
			fs.mkdirSync(dirPath);
		}
		fs.writeFileSync(filePath, data);
	}

	static loadFromLocalFile(savefileId) {
		let data = null;
		const fs = require('fs');
		const filePath = this.localFilePath(savefileId);
		if (fs.existsSync(filePath)) {
			data = fs.readFileSync(filePath, {
				encoding: 'utf8'
			});
		}
		return LZString.decompressFromBase64(data);
	}

	static loadFromLocalBackupFile(savefileId) {
		let data = null;
		const fs = require('fs');
		const filePath = `${this.localFilePath(savefileId)}.bak`;
		if (fs.existsSync(filePath)) {
			data = fs.readFileSync(filePath, {
				encoding: 'utf8'
			});
		}
		return LZString.decompressFromBase64(data);
	}

	static localFileBackupExists(savefileId) {
		const fs = require('fs');
		return fs.existsSync(`${this.localFilePath(savefileId)}.bak`);
	}

	static localFileExists(savefileId) {
		const fs = require('fs');
		return fs.existsSync(this.localFilePath(savefileId));
	}

	static removeLocalFile(savefileId) {
		const fs = require('fs');
		const filePath = this.localFilePath(savefileId);
		if (fs.existsSync(filePath)) {
			fs.unlinkSync(filePath);
		}
	}

	static saveToWebStorage(savefileId, json) {
		const key = this.webStorageKey(savefileId);
		const data = LZString.compressToBase64(json);
		localStorage.setItem(key, data);
	}

	static loadFromWebStorage(savefileId) {
		const key = this.webStorageKey(savefileId);
		const data = localStorage.getItem(key);
		return LZString.decompressFromBase64(data);
	}

	static loadFromWebStorageBackup(savefileId) {
		const key = `${this.webStorageKey(savefileId)}bak`;
		const data = localStorage.getItem(key);
		return LZString.decompressFromBase64(data);
	}

	static webStorageBackupExists(savefileId) {
		const key = `${this.webStorageKey(savefileId)}bak`;
		return !!localStorage.getItem(key);
	}

	static webStorageExists(savefileId) {
		const key = this.webStorageKey(savefileId);
		return !!localStorage.getItem(key);
	}

	static removeWebStorage(savefileId) {
		const key = this.webStorageKey(savefileId);
		localStorage.removeItem(key);
	}

	static localFileDirectoryPath() {
		const path = require('path');

		const base = path.dirname(process.mainModule.filename);
		if (this.canMakeWwwSaveDirectory()) {
			return path.join(base, 'save/');
		} else {
			return path.join(path.dirname(base), 'save/');
		}
	}

	static localFilePath(savefileId) {
		let name = '';
		if (savefileId < 0) {
			name = 'config.rpgsave';
		} else if (savefileId === 0) {
			name = 'global.rpgsave';
		} else {
			name = 'file%1.rpgsave'.format(savefileId);
		}
		return this.localFileDirectoryPath() + name;
	}

	// Enigma Virtual Box cannot make www/save directory
	static canMakeWwwSaveDirectory() {
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
	}

	static isLocalMode() {
		return Utils.isNwjs();
	}

	static webStorageKey(savefileId) {
		if (savefileId < 0) {
			return 'RPG Config';
		} else if (savefileId === 0) {
			return 'RPG Global';
		} else {
			return 'RPG File%1'.format(savefileId);
		}
	}
}

export default StorageManager;
