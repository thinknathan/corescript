import Utils from "./Utils.js";

class WindowShim {
    constructor() {
		throw new Error('This is a static class');
	}

    static addEventListener(type, func) {
		console.warn(type, func);
	}

	static close() {
		console.warn('window.close()');
	}
}

export default WindowShim;
