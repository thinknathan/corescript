import Utils from "../rpg_core/Utils.js";

//-----------------------------------------------------------------------------
// StorageManagerShim
//
// The static class that transfers save game data from a thread.

class StorageManagerShim {
        constructor() {
                throw new Error('This is a static class');
        }

        static _makeRequestData(savefileId, data) {
                return {
                        id: savefileId,
                        webKey: DataManager._globalId,
                        data: data || null
                };
        };

        static async save(savefileId, json) {
                if (Utils.isWorker()) {

                } else {
                        const transfer = await Data_Thread.makeSave('save', this._makeRequestData(savefileId, json));
                        return transfer.result;
                }
        }

        static async load(savefileId) {
                if (Utils.isWorker()) {

                } else {
                        const transfer = await Data_Thread.loadSave('load', this._makeRequestData(savefileId));
                        return transfer.result;
                }
        }

        static async exists(savefileId) {
                if (Utils.isWorker()) {

                } else {
                        const transfer = await Data_Thread.checkSaveExists('exists', this._makeRequestData(savefileId));
                        return transfer.result;
                }
        }

        static async remove(savefileId) {
                if (Utils.isWorker()) {

                } else {

                }
        }

        static async backup(savefileId) {
                if (Utils.isWorker()) {

                } else {
                        const transfer = await Data_Thread.backupSave('backup', this._makeRequestData(savefileId));
                        return transfer.result;
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

        static isLocalMode() {
                return false;
        }

        static backupExists(savefileId) { }

        static saveToLocalFile(savefileId, json) { }

        static loadFromLocalFile(savefileId) { }

        static loadFromLocalBackupFile(savefileId) { }

        static localFileBackupExists(savefileId) { }

        static localFileExists(savefileId) { }

        static removeLocalFile(savefileId) { }

        static saveToWebStorage(savefileId, json) { }

        static loadFromWebStorage(savefileId) { }

        static loadFromWebStorageBackup(savefileId) { }

        static webStorageBackupExists(savefileId) { }

        static webStorageExists(savefileId) { }

        static removeWebStorage(savefileId) { }

        static localFileDirectoryPath() { }

        static localFilePath(savefileId) { }

        static canMakeWwwSaveDirectory() { }

        static webStorageKey(savefileId) { }
}

export default StorageManagerShim;
