class DocumentShim {
    constructor() {
		throw new Error('This is a static class');
	}

    static addEventListener(type, func) {
		console.warn(type, func);
	}
}

export default DocumentShim;
