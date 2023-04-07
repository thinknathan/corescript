'use strict';
import { strToU8, inflateSync, deflateSync, strFromU8 } from 'fflate';
import { set, get, del, keys } from 'idb-keyval';
import { expose, transfer } from 'comlink';

const DEBUG_LOGGING = NODE_ENV === 'production';

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

	static async save(incoming, key) {
		const data = this.compress(incoming);
		return await set(key, data)
			.then(this.successCallback)
			.catch(this.failureCallback);
	}

	static async load(savefileId, key) {
		const data = await get(key).catch(this.failureCallback);
		if (data) {
			const result = this.decompress(data);
			if (result) {
				return result;
			} else {
				if (savefileId > 0) {
					if (DEBUG_LOGGING)
						console.warn(
							'[WebStorageManager.load] Loading failed. Restoring backup.'
						);
					const backup = await this.loadBackup(key);
					await this.restoreBackup(key);
					return backup;
				}
				if (DEBUG_LOGGING)
					console.warn(
						'[WebStorageManager.load] Loading failed. File broken or missing.'
					);
				return false;
			}
		}
		return false;
	}

	static async saveExists(key) {
		return await keys().then(function (keys) {
			return keys.includes(key);
		});
	}

	static async restoreBackup(key) {
		const backupKey = key + 'bak';
		const data = await this.loadBackup(key);
		await this.save(data, key);
		return await del(backupKey)
			.then(this.successCallback)
			.catch(this.failureCallback);
	}

	static async backupSave(key) {
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

	static async loadBackup(key) {
		const backupKey = key + 'bak';
		const compressed = await get(backupKey);
		return this.decompress(compressed);
	}
}

class GameStorageWorker {
	static compress({ data }) {
		const compressed = WebStorageManager.compress(data);
		if (DEBUG_LOGGING)
			console.log('[GameStorageWorker.compress]', {
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
			console.log('[GameStorageWorker.decompress]', { data, decompressed });
		return {
			result: decompressed,
		};
	}

	static async makeSave({ data, webKey }) {
		const success = await WebStorageManager.save(data, webKey);
		if (DEBUG_LOGGING)
			console.log('[GameStorageWorker.makeSave]', { data, webKey }, success);
		return {
			success: success,
		};
	}

	static async loadSave({ id, webKey }) {
		const data = await WebStorageManager.load(id, webKey);
		if (DEBUG_LOGGING)
			console.log('[GameStorageWorker.loadSave]', { id, webKey }, data);
		return {
			result: data,
		};
	}

	static async backupSave({ webKey }) {
		const success = await WebStorageManager.backupSave(webKey);
		if (DEBUG_LOGGING)
			console.log('[GameStorageWorker.backupSave]', { webKey }, success);
		return {
			success: success,
		};
	}

	static async checkSaveExists({ webKey }) {
		const result = await WebStorageManager.saveExists(webKey);
		if (DEBUG_LOGGING)
			console.log('[GameStorageWorker.checkSaveExists]', { webKey }, result);
		return {
			result: result,
		};
	}
}

expose(GameStorageWorker);
