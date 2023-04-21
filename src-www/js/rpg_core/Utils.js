//-----------------------------------------------------------------------------
/**
 * The static class that defines utility methods.
 *
 * @class Utils
 */
class Utils {
	constructor() {
		throw new Error('This is a static class');
	}

	/**
	 * Checks whether the option is in the query string.
	 *
	 * @static
	 * @method isOptionValid
	 * @param {String} name The option name
	 * @return {Boolean} True if the option is in the query string
	 */
	static isOptionValid(name) {
		if (location.search.slice(1).split('&').contains(name)) {
			return true;
		}
		if (
			typeof nw !== 'undefined' &&
			nw.App.argv.length > 0 &&
			nw.App.argv[0].split('&').contains(name)
		) {
			return true;
		}
		return false;
	}

	/**
	 * Checks whether the platform is NW.js.
	 *
	 * @static
	 * @method isNwjs
	 * @return {Boolean} True if the platform is NW.js
	 */
	static isNwjs() {
		return typeof require === 'function' && typeof process === 'object';
	}

	/**
	 * Checks whether the platform is Tauri.
	 *
	 * @static
	 * @method isTauri
	 * @return {Boolean} True if the platform is Tauri
	 */
	static isTauri() {
		return !!window.__TAURI__;
	}

	/**
	 * Checks whether refresh rate > 60hz.
	 *
	 * @static
	 * @method isHighFps
	 * @return {Boolean} True if refresh rate >= 66hz
	 */
	static isHighFps() {
		if (Utils._fpsChecked) {
			return Utils._highFps;
		} else {
			return Utils.getFps() >= 66;
		}
	}

	/**
	 * Returns estimated monitor refresh rate.
	 *
	 * @static
	 * @method getFps
	 * @return {Number} Refresh rate
	 * @credit Adapted from Adam Sassano on Stack Overflow
	 * @license CC BY-SA 4.0
	 */
	static getFps() {
		if (Utils._fpsChecked || Utils._fpsIsBusyCounting) {
			return Utils._fps;
		} else {
			let previousTimestamp = 0;
			let count = 0;
			let rate = 0;

			// Count refresh rate for 180 frames
			const rafLoop = (timestamp) => {
				if (count <= 180) {
					count++;
					let interval = timestamp - previousTimestamp;
					rate += 1000 / interval;
					previousTimestamp = timestamp;
					requestAnimationFrame(rafLoop);
				} else {
					if (Utils._fps !== Infinity) {
						Utils._fps = rate / count;
						if (Utils._fps >= 66) {
							Utils._highFps = true;
						}
					}
					Utils._fpsChecked = true;
					Utils._fpsIsBusyCounting = false;
				}
			};

			requestAnimationFrame((timestamp) => {
				previousTimestamp = timestamp;
				requestAnimationFrame(rafLoop);
			});
			Utils._fpsIsBusyCounting = true;
			return Utils._fps;
		}
	}

	/**
	 * Checks whether the platform is a mobile device.
	 *
	 * @static
	 * @method isMobileDevice
	 * @return {Boolean} True if the platform is a mobile device
	 */
	static isMobileDevice() {
		return PIXI.isMobile.any;
	}

	/**
	 * Checks whether the browser is Mobile Safari.
	 *
	 * @static
	 * @method isMobileSafari
	 * @return {Boolean} True if the browser is Mobile Safari
	 */
	static isMobileSafari() {
		return PIXI.isMobile.apple.device;
	}

	/**
	 * Checks whether the browser is Android Chrome.
	 *
	 * @static
	 * @method isAndroidChrome
	 * @return {Boolean} True if the browser is Android Chrome
	 */
	static isAndroidChrome() {
		return PIXI.isMobile.android.device;
	}

	/**
	 * Checks whether the browser can read files in the game folder.
	 *
	 * @static
	 * @method canReadGameFiles
	 * @return {Boolean} True if the browser can read files in the game folder
	 */
	static canReadGameFiles() {
		const scripts = document.getElementsByTagName('script');
		const lastScript = scripts[scripts.length - 1];
		const xhr = new XMLHttpRequest();
		try {
			xhr.open('GET', lastScript.src);
			xhr.overrideMimeType('text/javascript');
			xhr.send();
			return true;
		} catch (e) {
			console.error(e);
			return false;
		}
	}

	/**
	 * Makes a CSS color string from RGB values.
	 *
	 * @static
	 * @method rgbToCssColor
	 * @param {Number} r The red value in the range (0, 255)
	 * @param {Number} g The green value in the range (0, 255)
	 * @param {Number} b The blue value in the range (0, 255)
	 * @return {String} CSS color string
	 */
	static rgbToCssColor(r, g, b) {
		r = Math.round(r);
		g = Math.round(g);
		b = Math.round(b);
		return `rgb(${r},${g},${b})`;
	}

	static generateRuntimeId() {
		return Utils._id++;
	}

	/**
	 * Test this browser support passive event feature
	 *
	 * @static
	 * @method isSupportPassiveEvent
	 * @return {Boolean} this browser support passive event or not
	 */
	static isSupportPassiveEvent() {
		if (typeof Utils._supportPassiveEvent === 'boolean') {
			return Utils._supportPassiveEvent;
		}
		// test support passive event
		// https://github.com/WICG/EventListenerOptions/blob/gh-pages/explainer.md#feature-detection
		let passive = false;
		const options = Object.defineProperty({}, 'passive', {
			// eslint-disable-next-line getter-return
			get() {
				passive = true;
			},
		});
		window.addEventListener('test', null, options);
		Utils._supportPassiveEvent = passive;
		return passive;
	}
}

/**
 * The name of the RPG Maker. 'MV' in the current version.
 *
 * @static
 * @property RPGMAKER_NAME
 * @type String
 * @final
 */
Utils.RPGMAKER_NAME = 'MV';

/**
 * The version of the RPG Maker.
 *
 * @static
 * @property RPGMAKER_VERSION
 * @type String
 * @final
 */
Utils.RPGMAKER_VERSION = '1.6.1';

Utils.RPGMAKER_ENGINE = 'community-1.4';
Utils._highFps = false;
Utils._fps = 60;
Utils._fpsIsBusyCounting = false;
Utils._fpsChecked = false;
Utils._id = 1;
Utils._supportPassiveEvent = null;

export default Utils;
