class DocumentShim {
	constructor() {
		throw new Error('This is a static class');
	}

	static addEventListener(type, func) {
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
}

DocumentShim._eventStack = [];

export default DocumentShim;
