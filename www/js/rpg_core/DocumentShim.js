class DocumentShim {
	constructor() {
		throw new Error('This is a static class');
	}

	static addEventListener(type, func) {
		console.log('Attempted document.addEventListener on worker thread.');
		this._eventStack.push({
			type: type,
			func: func,
		});
	}

	static triggerEvent(payload) {
		this._eventStack.forEach((event) => {
			if (event.type === payload.type) {
				event.func(payload);
			}
		});
	}

	static createElement(element, options) {
		console.log('Attempted document.createElement on worker thread.');
	}

	static getElementsByTagName(elements) {
		console.log('Attempted document.getElementsByTagName on worker thread.');
		return [];
	}
}

DocumentShim._eventStack = [];

DocumentShim.body = {
	appendChild: () => {
		console.log('Attempted document.body.appendChild on worker thread.');
	},
};

export default DocumentShim;
