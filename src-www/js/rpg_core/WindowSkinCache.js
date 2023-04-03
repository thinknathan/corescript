//-----------------------------------------------------------------------------
/**
 * WindowSkinCache
 *
 * Cached window skin textures.
 */

class WindowSkinCache {
	constructor() {
		throw new Error('This is a static class');
	}

	static setItem(name, resource, type) {
		if (!WindowSkinCache._cache[name]) {
			WindowSkinCache._cache[name] = {};
		}
		WindowSkinCache._cache[name][type] = resource;
	}

	static getItem(name, type) {
		if (!WindowSkinCache._cache[name]) return false;
		if (!WindowSkinCache._cache[name][type]) return false;
		return WindowSkinCache._cache[name][type];
	}
}

WindowSkinCache._cache = {};

export default WindowSkinCache;
