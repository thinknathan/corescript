//-----------------------------------------------------------------------------
/**
 * The static class that handles resource loading.
 *
 * @class ResourceHandler
 */
class ResourceHandler {
	constructor() {
		throw new Error('This is a static class');
	}

	static createLoader(url, retryMethod, resignMethod, retryInterval = this._defaultRetryInterval) {
		const reloaders = this._reloaders;
		let retryCount = 0;
		return () => {
			if (retryCount < retryInterval.length) {
				setTimeout(retryMethod, retryInterval[retryCount]);
				retryCount++;
			} else {
				if (resignMethod) {
					resignMethod();
				}
				if (url) {
					if (reloaders.length === 0) {
						Graphics.printLoadingError(url);
						SceneManager.stop();
					}
					reloaders.push(() => {
						retryCount = 0;
						retryMethod();
					});
				}
			}
		};
	}

	static exists() {
		return this._reloaders.length > 0;
	}

	static retry() {
		if (this._reloaders.length > 0) {
			Graphics.eraseLoadingError();
			SceneManager.resume();
			this._reloaders.forEach(reloader => {
				reloader();
			});
			this._reloaders.length = 0;
		}
	}
}

ResourceHandler._reloaders = [];
ResourceHandler._defaultRetryInterval = [500, 1000, 3000];
