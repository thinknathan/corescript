'use strict';

import * as Comlink from 'https://cdn.skypack.dev/pin/comlink@v4.3.1-ebLSsXPUzhGrZgtPT5jX/mode=imports/optimized/comlink.js';
import StorageManager from './rpg_managers/StorageManager.js';

class Data_Thread {
	constructor() {
		throw new Error('This is a static class');
	}
	static async start() {
		console.log('[Data_Thread.start]');
	}
	static async makeSave(type, payload) {
		const success = await StorageManager.save(
			payload.id,
			payload.data,
			payload.webKey
		);
		return {
			result: success,
		};
	}
	static async loadSave(type, payload) {
		const data = await StorageManager.load(payload.id, payload.webKey);
		return {
			result: data,
		};
	}
	static async backupSave(type, payload) {
		const success = await StorageManager.backupSave(payload.id, payload.webKey);
		return {
			result: success,
		};
	}
	static async checkSaveExists(type, payload) {
		const result = await StorageManager.saveExists(payload.id, payload.webKey);
		return {
			result: result,
		};
	}
}

Comlink.expose(Data_Thread);
