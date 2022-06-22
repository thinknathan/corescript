import StorageManager from "../rpg_managers/StorageManagerShim.js";
import AudioManager from "../rpg_managers/AudioManager.js";

//-----------------------------------------------------------------------------
// ConfigManager
//
// The static class that manages the configuration data.

class ConfigManager {
	constructor() {
		throw new Error('This is a static class');
	}

	static async load() {
		let json;
		let config = {};
		try {
			json = await StorageManager.load(-1);
		} catch (e) {
			console.error(e);
		}
		if (json) {
			config = JSON.parse(json);
		}
		this.applyData(config);
	}

	static save() {
		StorageManager.save(-1, JSON.stringify(this.makeData()));
	}

	static makeData() {
		const config = {};
		config.alwaysDash = this.alwaysDash;
		config.commandRemember = this.commandRemember;
		config.bgmVolume = this.bgmVolume;
		config.bgsVolume = this.bgsVolume;
		config.meVolume = this.meVolume;
		config.seVolume = this.seVolume;
		return config;
	}

	static applyData(config) {
		this.alwaysDash = this.readFlag(config, 'alwaysDash');
		this.commandRemember = this.readFlag(config, 'commandRemember');
		this.bgmVolume = this.readVolume(config, 'bgmVolume');
		this.bgsVolume = this.readVolume(config, 'bgsVolume');
		this.meVolume = this.readVolume(config, 'meVolume');
		this.seVolume = this.readVolume(config, 'seVolume');
	}

	static readFlag(config, name) {
		return !!config[name];
	}

	static readVolume(config, name) {
		const value = config[name];
		if (value !== undefined) {
			return Number(value)
				.clamp(0, 100);
		} else {
			return 100;
		}
	}
}

ConfigManager.alwaysDash = false;
ConfigManager.commandRemember = false;

Object.defineProperty(ConfigManager, 'bgmVolume', {
	get() {
		return AudioManager._bgmVolume;
	},
	set(value) {
		AudioManager.bgmVolume = value;
	},
	configurable: true
});

Object.defineProperty(ConfigManager, 'bgsVolume', {
	get() {
		return AudioManager.bgsVolume;
	},
	set(value) {
		AudioManager.bgsVolume = value;
	},
	configurable: true
});

Object.defineProperty(ConfigManager, 'meVolume', {
	get() {
		return AudioManager.meVolume;
	},
	set(value) {
		AudioManager.meVolume = value;
	},
	configurable: true
});

Object.defineProperty(ConfigManager, 'seVolume', {
	get() {
		return AudioManager.seVolume;
	},
	set(value) {
		AudioManager.seVolume = value;
	},
	configurable: true
});

export default ConfigManager;
