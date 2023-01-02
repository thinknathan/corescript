'use strict';
import { strToU8, inflateSync, deflateSync, strFromU8 } from 'fflate';
import { set, get, del, keys } from 'idb-keyval';
import { expose, transfer } from 'comlink';

const DEBUG_LOGGING = true;

class WebStorageManager {
	static successCallback() {
		return true;
	}

	static failureCallback(e) {
		console.error(e);
		return false;
	}

	static compress(data) {
		if (data === null) return null;
		try {
			const u8array = strToU8(data);
			return deflateSync(u8array, {
				level: 1,
			});
		} catch (e) {
			console.error(e);
			return null;
		}
	}

	static decompress(data) {
		if (data === null) return null;
		try {
			const inflated = inflateSync(data);
			return strFromU8(inflated);
		} catch (e) {
			console.error(e);
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
		const data = this.compress(incoming);
		return await set(key, data)
			.then(this.successCallback)
			.catch(this.failureCallback);
	}

	static async load(savefileId, gameTitle) {
		const key = this.storageKey(savefileId, gameTitle);
		const data = await get(key).catch(this.failureCallback);
		const result = this.decompress(data);
		if (result) {
			return result;
		} else {
			if (savefileId > 0) {
				if (DEBUG_LOGGING)
					console.warn(
						'[WebStorageManager.load] Loading failed. Restoring backup.'
					);
				const backup = await this.loadBackup(savefileId, gameTitle);
				await this.restoreBackup(savefileId, gameTitle);
				return backup;
			}
			if (DEBUG_LOGGING)
				console.warn(
					'[WebStorageManager.load] Loading failed. File broken or missing.'
				);
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
		return await keys().then(function (keys) {
			return keys.includes(key);
		});
	}

	static async restoreBackup(savefileId, gameTitle) {
		const key = this.storageKey(savefileId, gameTitle);
		const backupKey = key + 'bak';
		const data = await this.loadBackup(savefileId, gameTitle);
		await this.save(savefileId, data, gameTitle);
		return await del(backupKey)
			.then(this.successCallback)
			.catch(this.failureCallback);
	}

	static async backupSave(savefileId, gameTitle) {
		const key = this.storageKey(savefileId, gameTitle);
		const backupKey = key + 'bak';
		const data = await get(key).catch(this.failureCallback);
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
		const backupKey = key + 'bak';
		const compressed = await get(backupKey);
		return this.decompress(compressed);
	}
}

class SaveStorageWorker {
	static compress({ data }) {
		const compressed = WebStorageManager.compress(data);
		if (DEBUG_LOGGING)
			console.log('[SaveStorageWorker.compress]', {
				data,
				compressed,
			});
		return transfer(
			{
				result: compressed,
			},
			[compressed.buffer]
		);
	}

	static decompress({ data }) {
		const decompressed = WebStorageManager.decompress(data);
		if (DEBUG_LOGGING)
			console.log('[SaveStorageWorker.decompress]', { data, decompressed });
		return {
			result: decompressed,
		};
	}

	static async makeSave({ id, data, webKey }) {
		const success = await WebStorageManager.save(id, data, webKey);
		if (DEBUG_LOGGING)
			console.log(
				'[SaveStorageWorker.makeSave]',
				{ id, data, webKey },
				success
			);
		return {
			success: success,
		};
	}

	static async loadSave({ id, webKey }) {
		const data = await WebStorageManager.load(id, webKey);
		if (DEBUG_LOGGING)
			console.log('[SaveStorageWorker.loadSave]', { id, webKey }, data);
		return {
			result: data,
		};
	}

	static async backupSave({ id, webKey }) {
		const success = await WebStorageManager.backupSave(id, webKey);
		if (DEBUG_LOGGING)
			console.log('[SaveStorageWorker.backupSave]', { id, webKey }, success);
		return {
			success: success,
		};
	}

	static async checkSaveExists({ id, webKey }) {
		const result = await WebStorageManager.saveExists(id, webKey);
		if (DEBUG_LOGGING)
			console.log(
				'[SaveStorageWorker.checkSaveExists]',
				{ id, webKey },
				result
			);
		return {
			result: result,
		};
	}
}

expose(SaveStorageWorker);
