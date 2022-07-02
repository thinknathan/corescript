import Utils from "./Utils.js";

class WindowShim {
    constructor() {
		throw new Error('This is a static class');
	}

    static addEventListener(type, func) {
		this._eventStack.push({
			type: type,
			func: func
		});
	}

	static triggerEvent(payload) {
		this._eventStack.forEach(event => {
			if (event.type === payload.type) {
				event.func(payload);
			}
		});
	}

	static close() {
		self.postMessage({
			type: 'close',
			data: {}
		 });
	}
}

WindowShim._eventStack = [];
WindowShim.devicePixelRatio = 1;
WindowShim.innerWidth = 0;
WindowShim.innerHeight = 0;
WindowShim.cordova = false;
WindowShim.navigatorStandalone = false;
WindowShim.__TAURI__ = false;

export default WindowShim;
