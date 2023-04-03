/*:
 * @plugindesc Fail to load images, audio, movies and map data.
 * @author RM CoreScript team
 *
 * @param failImage
 * @desc Probability of image loading failure (0-1)
 * @default 0.5
 *
 * @param failAudio
 * @desc Probability of audio loading failure (0-1)
 * @default 0.5
 *
 * @param failMovie
 * @desc Probability of movie loading failure (0-1)
 * @default 0.5
 *
 * @param failMapData
 * @desc Probability of map data loading failure (0-1)
 * @default 0.5
 */

/*:ja
 * @plugindesc 画像や音声、動画やマップデータの読み込みに失敗します。
 * @author RM CoreScript team
 *
 * @param failImage
 * @desc 画像の読み込みに失敗する確率 (0-1)
 * @default 0.5
 *
 * @param failAudio
 * @desc 音声の読み込みに失敗する確率 (0-1)
 * @default 0.5
 *
 * @param failMovie
 * @desc 動画の読み込みに失敗する確率 (0-1)
 * @default 0.5
 *
 * @param failMapData
 * @desc マップデータ読み込みに失敗する確率 (0-1)
 * @default 0.5
 */

(() => {
	function toNumber(str, def) {
		return isNaN(str) ? def : +(str || def);
	}

	const parameters = PluginManager.parameters('Debug_FailLoading');
	const failImage = toNumber(parameters['failImage'], 0.5);
	const failAudio = toNumber(parameters['failAudio'], 0.5);
	const failMovie = toNumber(parameters['failMovie'], 0.5);
	const failMapData = toNumber(parameters['failMapData'], 0.5);

	const _Bitmap_onLoad = Bitmap.prototype._onLoad;
	Bitmap.prototype._onLoad = function (...args) {
		if (Math.random() < failImage) {
			this._errorListener();
		} else {
			_Bitmap_onLoad.apply(this, args);
		}
	};

	WebAudio.prototype._load = function (url) {
		if (WebAudio._context) {
			const xhr = new XMLHttpRequest();
			if (Decrypter.hasEncryptedAudio) url = Decrypter.extToEncryptExt(url);
			xhr.open('GET', url);
			xhr.responseType = 'arraybuffer';
			xhr.onload = () => {
				if (Math.random() < failAudio) {
					xhr.onerror();
				} else if (xhr.status < 400) {
					this._onXhrLoad(xhr);
				}
			};
			xhr.onerror = this._loader;
			xhr.send();
		}
	};

	const _Graphics_onVideoLoad = Graphics._onVideoLoad;
	Graphics._onVideoLoad = function (...args) {
		if (Math.random() < failMovie) {
			this._video.onerror();
		} else {
			_Graphics_onVideoLoad.apply(this, args);
		}
	};

	DataManager.loadDataFile = function (name, src) {
		const xhr = new XMLHttpRequest();
		const url = `data/${src}`;
		xhr.open('GET', url);
		xhr.overrideMimeType('application/json');
		xhr.onload = () => {
			if (name === '$dataMap' && Math.random() < failMapData) {
				xhr.onerror();
			} else if (xhr.status < 400) {
				window[name] = JSON.parse(xhr.responseText);
				DataManager.onLoad(window[name]);
			}
		};
		xhr.onerror =
			this._mapLoader ||
			(() => {
				DataManager._errorUrl = DataManager._errorUrl || url;
			});
		window[name] = null;
		xhr.send();
	};
})();
