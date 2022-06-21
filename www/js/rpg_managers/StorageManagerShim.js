import Utils from "../rpg_core/Utils.js";

//-----------------------------------------------------------------------------
// StorageManagerShim
//
// The static class that transfers save game data from a thread.

class StorageManagerShim {
	constructor() {
		throw new Error('This is a static class');
	}

	static save(savefileId, json) {
        if (Utils.isWorker()) {

        } else {

        }
	}

	static load(savefileId) {
        if (Utils.isWorker()) {

        } else {

        }
	}

	static exists(savefileId) {
        if (Utils.isWorker()) {

        } else {

        }
	}

	static remove(savefileId) {
        if (Utils.isWorker()) {

        } else {

        }
	}

	static backup(savefileId) {
        if (Utils.isWorker()) {

        } else {

        }
	}

	static backupExists(savefileId) {
        if (Utils.isWorker()) {

        } else {

        }
	}

	static cleanBackup(savefileId) {
        if (Utils.isWorker()) {

        } else {

        }
	}

	static restoreBackup(savefileId) {
        if (Utils.isWorker()) {

        } else {

        }
	}

	static saveToLocalFile(savefileId, json) {
        if (Utils.isWorker()) {

        } else {

        }
	}

	static loadFromLocalFile(savefileId) {
        if (Utils.isWorker()) {

        } else {

        }
	}

	static loadFromLocalBackupFile(savefileId) {
        if (Utils.isWorker()) {

        } else {

        }
	}

	static localFileBackupExists(savefileId) {
        if (Utils.isWorker()) {

        } else {

        }
	}

	static localFileExists(savefileId) {
        if (Utils.isWorker()) {

        } else {

        }
	}

	static removeLocalFile(savefileId) {
        if (Utils.isWorker()) {

        } else {

        }
	}

	static saveToWebStorage(savefileId, json) {
        if (Utils.isWorker()) {

        } else {

        }
	}

	static loadFromWebStorage(savefileId) {
        if (Utils.isWorker()) {

        } else {

        }
	}

	static loadFromWebStorageBackup(savefileId) {
if (Utils.isWorker()) {

        } else {

        }
	}

	static webStorageBackupExists(savefileId) {
if (Utils.isWorker()) {

        } else {

        }
	}

	static webStorageExists(savefileId) {
if (Utils.isWorker()) {

        } else {

        }
	}

	static removeWebStorage(savefileId) {
if (Utils.isWorker()) {

        } else {

        }
	}

	static localFileDirectoryPath() {
if (Utils.isWorker()) {

        } else {

        }
	}

	static localFilePath(savefileId) {
if (Utils.isWorker()) {

        } else {

        }
	}

	static canMakeWwwSaveDirectory() {
if (Utils.isWorker()) {

        } else {

        }
	}

	static isLocalMode() {
		return Utils.isNwjs();
	}

	static webStorageKey(savefileId) {

	}
}

export default StorageManagerShim;
