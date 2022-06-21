import Utils from "../rpg_core/Utils.js";

//-----------------------------------------------------------------------------
// PluginManager
//
// The static class that manages the plugins.

class PluginManager {
	constructor() {
		throw new Error('This is a static class');
	}

	static setup(plugins) {
		plugins.forEach(function ({
			status,
			name,
			parameters
		}) {
			if (status && !this._scripts.contains(name)) {
				this.setParameters(name, parameters);
				this.loadScript(`${name}.js`);
				this._scripts.push(name);
			}
		}, this);
	}

	static checkErrors() {
		const url = this._errorUrls.shift();
		if (url) {
			throw new Error(`Failed to load: ${url}`);
		}
	}

	static parameters(name) {
		return this._parameters[name.toLowerCase()] || {};
	}

	static setParameters(name, parameters) {
		this._parameters[name.toLowerCase()] = parameters;
	}

	static loadScript(name) {
		const url = this._path + name;
		const script = Utils.loadScript(url);
		if (script) {
			script.onerror = this.onError.bind(this);
			script._url = url;
		}
	}

	static onError({
		target
	}) {
		this._errorUrls.push(target._url);
	}
}

PluginManager._path = 'js/plugins/';
PluginManager._scripts = [];
PluginManager._errorUrls = [];
PluginManager._parameters = {};

export default PluginManager;
