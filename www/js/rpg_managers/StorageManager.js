import { strToU8, inflateSync, deflateSync, strFromU8 } from 'https://cdn.skypack.dev/pin/fflate@v0.7.3-x0OS7MYd1pAJyCyfqyxe/mode=imports/optimized/fflate.js';
import { set, get, del, keys } from 'https://cdn.skypack.dev/pin/idb-keyval@v6.2.0-JnrT8KDKaQ7ZsLcm1DXx/mode=imports/optimized/idb-keyval.js'

//-----------------------------------------------------------------------------
// StorageManager
//
// The static class that manages storage for saving game data.

class StorageManager {
	constructor() {
		throw new Error('This is a static class');
	}

	static successCallback() {
		return true;
	}

	static failureCallback(e) {
		console.error(e);
		return false;
	}

	static async compress(data) {
		if (data) {
			try {
				const u8array = strToU8(data);
				return deflateSync(u8array, {
					level: 1
				});
			} catch (e) {
				console.error(e);
				return null;
			}
		} else {
			return null;
		}
	}

	static async decompress(data) {
		if (data) {
			try {
				const inflated = inflateSync(data);
				return strFromU8(inflated);
			} catch (e) {
				console.error(e);
				return null;
			}
		} else {
			return null;
		}
	}

	static storageKey(savefileId, gameTitle) {
		if (savefileId < 0) {
			return gameTitle + ' Config';
		} else if (savefileId === 0) {
			return gameTitle + ' Global';
		} else {
			return gameTitle + ' File' + savefileId;
		}
	}

	static async save(savefileId, incoming, gameTitle) {
		const key = this.storageKey(savefileId, gameTitle);
		const data = await this.compress(incoming);
		return await set(key, data)
			.then(this.successCallback)
			.catch(this.failureCallback);
	}

	static async load(savefileId, gameTitle) {
		const key = this.storageKey(savefileId, gameTitle);
		const data = await get(key)
			.catch(this.failureCallback);
		const result = await this.decompress(data);
		if (result) {
			return result;
		} else {
			if (savefileId > 0) {
				console.warn('[StorageManager.load] Loading failed. Restoring backup.');
				const backup = await this.loadBackup(savefileId, gameTitle);
				await this.restoreBackup(savefileId, gameTitle);
				return backup;
			}
			console.warn('[StorageManager.load] Loading failed. File broken or missing.');
			return false;
		}
	}

	static async deleteSave(savefileId, gameTitle) {
		const key = this.storageKey(savefileId, gameTitle);
		return await del(key)
			.then(this.successCallback)
			.catch(this.failureCallback);
	}

	static async saveExists(savefileId, gameTitle) {
		const key = this.storageKey(savefileId, gameTitle);
		return await keys()
			.then(function (keys) {
				return keys.includes(key);
			});
	}

	static async restoreBackup(savefileId, gameTitle) {
		const key = this.storageKey(savefileId, gameTitle);
		const backupKey = key + "bak";
		const data = await this.loadBackup(savefileId, gameTitle);
		await this.save(savefileId, data, gameTitle);
		return await del(backupKey)
			.then(this.successCallback)
			.catch(this.failureCallback);
	}

	static async backupSave(savefileId, gameTitle) {
		const key = this.storageKey(savefileId, gameTitle);
		const backupKey = key + "bak";
		const data = await get(key)
			.catch(this.failureCallback);
		if (data) {
			return await set(backupKey, data)
				.then(this.successCallback)
				.catch(this.failureCallback);
		} else {
			return false;
		}
	}

	static async loadBackup(savefileId, gameTitle) {
		const key = this.storageKey(savefileId, gameTitle);
		const backupKey = key + "bak";
		const compressed = await get(backupKey);
		return await this.decompress(compressed);
	}
}

export default StorageManager;
