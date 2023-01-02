import Utils from '../rpg_core/Utils.js';

//-----------------------------------------------------------------------------
// GameStorageManager
//
// The static class that manages storage for saving game data.

class GameStorageManager {
	constructor() {
		throw new Error('This is a static class');
	}

	static setupWorker() {
		const worker = new Worker('js/game_storage_worker.min.js');
		this._worker = new Comlink.wrap(worker);
	}

	static worker() {
		return this._worker;
	}

	static _createWorkerData(savefileId, data) {
		const requestObject = {
			webKey: !this.isLocalMode() ? this.webStorageKey() : null,
			id: savefileId,
			data: data,
		};
		return requestObject;
	}

	static async compress(data) {
		const compressed = await this.worker().compress(
			this._createWorkerData(null, data)
		);
		return compressed.result;
	}

	static async decompress(data) {
		const decompressed = await this.worker().decompress(
			Comlink.transfer(this._createWorkerData(null, data), [data.buffer])
		);
		return decompressed.result;
	}

	static save(savefileId, json) {
		if (this.isLocalMode()) {
			this.saveToLocalFile(savefileId, json);
		} else {
			this.saveToWebStorage(savefileId, json);
		}
	}

	static async load(savefileId) {
		if (this.isLocalMode()) {
			return await this.loadFromLocalFile(savefileId);
		} else {
			return await this.loadFromWebStorage(savefileId);
		}
	}

	static async exists(savefileId) {
		if (this.isLocalMode()) {
			return this.localFileExists(savefileId);
		} else {
			return await this.webStorageExists(savefileId);
		}
	}

	static remove(savefileId) {
		if (this.isLocalMode()) {
			this.removeLocalFile(savefileId);
		}
	}

	static async backup(savefileId) {
		if (this.isLocalMode()) {
			if (await this.exists(savefileId)) {
				const data = await this.loadFromLocalFile(savefileId);
				const compressed = await this.compress(data);
				const fs = require('fs');
				const dirPath = this.localFileDirectoryPath();
				const filePath = `${this.localFilePath(savefileId)}.bak`;
				if (!fs.existsSync(dirPath)) {
					fs.mkdirSync(dirPath);
				}
				fs.writeFileSync(filePath, compressed);
			}
		} else {
			this.worker().backupSave(this._createWorkerData(savefileId));
		}
	}

	static backupExists(savefileId) {
		if (this.isLocalMode()) {
			return this.localFileBackupExists(savefileId);
		}
	}

	static cleanBackup(savefileId) {
		if (this.isLocalMode()) {
			if (this.backupExists(savefileId)) {
				const fs = require('fs');
				const filePath = this.localFilePath(savefileId);
				fs.unlinkSync(`${filePath}.bak`);
			}
		}
	}

	static async restoreBackup(savefileId) {
		if (this.isLocalMode()) {
			if (this.backupExists(savefileId)) {
				const data = await this.loadFromLocalBackupFile(savefileId);
				const compressed = await this.compress(data);
				const fs = require('fs');
				const dirPath = this.localFileDirectoryPath();
				const filePath = this.localFilePath(savefileId);
				if (!fs.existsSync(dirPath)) {
					fs.mkdirSync(dirPath);
				}
				fs.writeFileSync(filePath, compressed);
				fs.unlinkSync(`${filePath}.bak`);
			}
		}
	}

	static async saveToLocalFile(savefileId, json) {
		const data = await this.compress(json);
		const fs = require('fs');
		const dirPath = this.localFileDirectoryPath();
		const filePath = this.localFilePath(savefileId);
		if (!fs.existsSync(dirPath)) {
			fs.mkdirSync(dirPath);
		}
		fs.writeFileSync(filePath, data);
	}

	static async loadFromLocalFile(savefileId) {
		const fs = require('fs');
		const filePath = this.localFilePath(savefileId);
		if (!fs.existsSync(filePath)) return null;
		const data = await fs.promises.readFile(filePath, { encoding: null });
		return await this.decompress(data);
	}

	static async loadFromLocalBackupFile(savefileId) {
		const fs = require('fs');
		const filePath = `${this.localFilePath(savefileId)}.bak`;
		if (!fs.existsSync(filePath)) return null;
		return await this.decompress(fs.readFileSync(filePath));
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
		this.worker().makeSave(this._createWorkerData(savefileId, json));
	}

	static async loadFromWebStorage(savefileId) {
		return await this.worker().loadSave(this._createWorkerData(savefileId));
	}

	static async webStorageExists(savefileId) {
		return await this.worker().checkSaveExists(
			this._createWorkerData(savefileId)
		);
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

GameStorageManager.setupWorker();

export default GameStorageManager;
