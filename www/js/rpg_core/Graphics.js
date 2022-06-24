import * as PIXI from "../libs/pixi.js";
import ProgressWatcher from "../rpg_core/ProgressWatcher.js";
import ResourceHandler from "../rpg_core/ResourceHandler.js";
import Utils from "../rpg_core/Utils.js";
import UpperCanvas from "./CanvasShim.js";
import SceneManager from "../rpg_managers/SceneManager.js";
import GameStats from "https://cdn.skypack.dev/-/gamestats.js@v1.0.3-FI1CU3PkCi2MgwIBR5jn/dist=es2019,mode=imports/optimized/gamestatsjs.js";

//-----------------------------------------------------------------------------
/**
 * The static class that carries out graphics processing.
 *
 * @class Graphics
 */
class Graphics {
	constructor() {
		throw new Error('This is a static class');
	}

	/**
	 * Initializes the graphics system.
	 *
	 * @static
	 * @method initialize
	 * @param {Number} width The width of the game screen
	 * @param {Number} height The height of the game screen
	 * @param {String} type The type of the renderer.
	 *                 'canvas', 'webgl', or 'auto'.
	 */
	static initialize(width, height, type) {
		this._width = width || 800;
		this._height = height || 600;
		this._rendererType = type || 'auto';
		this._boxWidth = this._width;
		this._boxHeight = this._height;

		this._scale = 1;
		this._realScale = 1;

		this._errorShowed = false;
		this._errorPrinter = null;
		this._canvas = null;
		this._video = null;
		this._videoUnlocked = false;
		this._videoLoading = false;
		this._upperCanvas = null;
		this._fpsMeter = null;
		this._modeBox = null;
		this._skipCount = 0;
		this._maxSkip = 3;
		this._rendered = false;
		this._loadingImage = null;
		this._loadingImageSprite = null;
		this._loadingCount = 0;
		this._fpsMeterToggled = false;
		this._stretchEnabled = this._defaultStretchMode();

		this._canUseDifferenceBlend = false;
		this._canUseSaturationBlend = false;
		this._hiddenCanvas = null;
		this._app = null;

		// this._testCanvasBlendModes();
		// this._modifyExistingElements();
		this._updateRealScale();
		this._createAllElements();
		this._disableTextSelection();
		this._disableContextMenu();
		this._setupEventHandlers();
		this._setupCssFontLoading();
		this._setupProgress();
	}

	static canUseCssFontLoading() {
		return !!this._cssFontLoading;
	}

	/**
	 * Renders the stage to the game screen.
	 *
	 * @static
	 * @method render
	 * @param {Stage} stage The stage object to be rendered
	 */
	static render(stage) {
		if (stage) this._app.stage = stage;
	}

	/**
	 * Checks whether the renderer type is WebGL.
	 *
	 * @static
	 * @method isWebGL
	 * @return {Boolean} True if the renderer type is WebGL
	 */
	static isWebGL() {
		return this._renderer && this._renderer.type === PIXI.RENDERER_TYPE.WEBGL;
	}

	/**
	 * Checks whether the canvas blend mode 'difference' is supported.
	 *
	 * @static
	 * @method canUseDifferenceBlend
	 * @return {Boolean} True if the canvas blend mode 'difference' is supported
	 */
	static canUseDifferenceBlend() {
		return this._canUseDifferenceBlend;
	}

	/**
	 * Checks whether the canvas blend mode 'saturation' is supported.
	 *
	 * @static
	 * @method canUseSaturationBlend
	 * @return {Boolean} True if the canvas blend mode 'saturation' is supported
	 */
	static canUseSaturationBlend() {
		return this._canUseSaturationBlend;
	}

	/**
	 * Sets the source of the "Now Loading" image.
	 *
	 * @static
	 * @method setLoadingImage
	 */
	static setLoadingImage(src) {
		this._loadingImage = {};
		this._loadingImage.src = src;
	}

	/**
	 * Sets whether the progress bar is enabled.
	 *
	 * @static
	 * @method setEnableProgress
	 */
	static setProgressEnabled(enable) {
		this._progressEnabled = enable;
	}

	/**
	 * Initializes the counter for displaying the "Now Loading" image.
	 *
	 * @static
	 * @method startLoading
	 */
	static startLoading() {
		this._loadingCount = 0;

		ProgressWatcher.truncateProgress();
		ProgressWatcher.setProgressListener(this._updateProgressCount.bind(this));
		this._progressTimeout = setTimeout(() => {
			Graphics._showProgress();
		}, 1500);
	}

	static _setupProgress() {
		this._progressElement = document.createElement('div');
		this._progressElement.id = 'loading-progress';
		this._progressElement.width = 600;
		this._progressElement.height = 300;
		this._progressElement.style.visibility = 'hidden';

		this._barElement = document.createElement('div');
		this._barElement.id = 'loading-bar';
		this._barElement.style.width = '100%';
		this._barElement.style.height = '10%';
		this._barElement.style.background = 'linear-gradient(to top, gray, lightgray)';
		this._barElement.style.border = '5px solid white';
		this._barElement.style.borderRadius = '15px';
		this._barElement.style.marginTop = '40%';

		this._filledBarElement = document.createElement('div');
		this._filledBarElement.id = 'loading-filled-bar';
		this._filledBarElement.style.width = '0%';
		this._filledBarElement.style.height = '100%';
		this._filledBarElement.style.background = 'linear-gradient(to top, lime, honeydew)';
		this._filledBarElement.style.borderRadius = '10px';

		this._progressElement.appendChild(this._barElement);
		this._barElement.appendChild(this._filledBarElement);
		this._updateProgress();

		document.body.appendChild(this._progressElement);
	}

	static _showProgress() {
		if (this._progressEnabled) {
			this._progressElement.value = 0;
			this._progressElement.style.visibility = 'visible';
			this._progressElement.style.zIndex = 98;
		}
	}

	static _hideProgress() {
		if (this._progressElement) {
			this._progressElement.style.visibility = 'hidden';
		}
		clearTimeout(this._progressTimeout);
	}

	static _updateProgressCount(countLoaded, countLoading) {
		let progressValue;
		if (countLoading !== 0) {
			progressValue = (countLoaded / countLoading) * 100;
		} else {
			progressValue = 100;
		}

		this._filledBarElement.style.width = `${progressValue}%`;
	}

	static _updateProgress() {
		this._centerElement(this._progressElement);
	}

	/**
	 * Increments the loading counter and displays the "Now Loading" image if necessary.
	 *
	 * @static
	 * @method updateLoading
	 */
	static updateLoading() {
		this._loadingCount++;
		this._paintUpperCanvas();
		this._upperCanvas.style.opacity = 1;
		this._updateProgress();
	}

	/**
	 * Erases the "Now Loading" image.
	 *
	 * @static
	 * @method endLoading
	 */
	static endLoading() {
		this._clearUpperCanvas();
		this._upperCanvas.style.opacity = 0;
		this._hideProgress();
	}

	/**
	 * Displays the loading error text to the screen.
	 *
	 * @static
	 * @method printLoadingError
	 * @param {String} url The url of the resource failed to load
	 */
	static printLoadingError(url) {
		if (this._errorPrinter && !this._errorShowed) {
			this._updateErrorPrinter();
			this._errorPrinter.innerHTML = this._makeErrorHtml('Loading Error', `Failed to load: ${url}`);
			this._errorPrinter.style.userSelect = 'text';
			this._errorPrinter.style.webkitUserSelect = 'text';
			this._errorPrinter.style.msUserSelect = 'text';
			this._errorPrinter.style.mozUserSelect = 'text';
			this._errorPrinter.oncontextmenu = null; // enable context menu
			const button = document.createElement('button');
			button.innerHTML = 'Retry';
			button.style.fontSize = '24px';
			button.style.color = '#ffffff';
			button.style.backgroundColor = '#000000';
			button.addEventListener('touchstart', event => {
				event.stopPropagation();
			});
			button.addEventListener('click', event => {
				ResourceHandler.retry();
			});
			this._errorPrinter.appendChild(button);
			this._loadingCount = -Infinity;
		}
	}

	/**
	 * Erases the loading error text.
	 *
	 * @static
	 * @method eraseLoadingError
	 */
	static eraseLoadingError() {
		if (this._errorPrinter && !this._errorShowed) {
			this._errorPrinter.innerHTML = '';
			this._errorPrinter.style.userSelect = 'none';
			this._errorPrinter.style.webkitUserSelect = 'none';
			this._errorPrinter.style.msUserSelect = 'none';
			this._errorPrinter.style.mozUserSelect = 'none';
			this._errorPrinter.oncontextmenu = () => false;
			this._loadingCount = 0;
		}
	}

	// The following code is partly borrowed from triacontane.
	/**
	 * Displays the error text to the screen.
	 *
	 * @static
	 * @method printError
	 * @param {String} name The name of the error
	 * @param {String} message The message of the error
	 */
	static printError(name, message) {
		this._errorShowed = true;
		this._hideProgress();
		this.hideFps();
		if (this._errorPrinter) {
			this._updateErrorPrinter();
			this._errorPrinter.innerHTML = this._makeErrorHtml(name, message);
			this._errorPrinter.style.userSelect = 'text';
			this._errorPrinter.style.webkitUserSelect = 'text';
			this._errorPrinter.style.msUserSelect = 'text';
			this._errorPrinter.style.mozUserSelect = 'text';
			this._errorPrinter.oncontextmenu = null; // enable context menu
			if (this._errorMessage) {
				this._makeErrorMessage();
			}
		}
		this._applyCanvasFilter();
		this._clearUpperCanvas();
	}

	/**
	 * Shows the detail of error.
	 *
	 * @static
	 * @method printErrorDetail
	 */
	static printErrorDetail(error) {
		if (this._errorPrinter && this._showErrorDetail) {
			const eventInfo = this._formatEventInfo(error);
			const eventCommandInfo = this._formatEventCommandInfo(error);
			const info = eventCommandInfo ? `${eventInfo}, ${eventCommandInfo}` : eventInfo;
			const stack = this._formatStackTrace(error);
			this._makeErrorDetail(info, stack);
		}
	}

	/**
	 * Sets the error message.
	 *
	 * @static
	 * @method setErrorMessage
	 */
	static setErrorMessage(message) {
		this._errorMessage = message;
	}

	/**
	 * Sets whether shows the detail of error.
	 *
	 * @static
	 * @method setShowErrorDetail
	 */
	static setShowErrorDetail(showErrorDetail) {
		this._showErrorDetail = showErrorDetail;
	}

	/**
	 * Shows the FPSMeter element.
	 *
	 * @static
	 * @method showFps
	 */
	static showFps() {
		if (Utils.isWorker()) return;
		if (this._fpsMeter) {
			// if (!this._fpsMeter.extensions.pixi) {
			// 	this._fpsMeter.enableExtension('pixi', [PIXI, this._app]);
			// }
			document.body.appendChild(this._fpsMeter.dom);
			this._fpsMeter.show(true);
		}
	}

	/**
	 * Hides the FPSMeter element.
	 *
	 * @static
	 * @method hideFps
	 */
	static hideFps() {
		if (Utils.isWorker()) return;
		if (this._fpsMeter) {
			if (document.body.contains(this._fpsMeter.dom)) {
				document.body.removeChild(this._fpsMeter.dom);
			}
			this._fpsMeter.show(false);
		}
	}

	/**
	 * Loads a font file.
	 *
	 * @static
	 * @method loadFont
	 * @param {String} name The face name of the font
	 * @param {String} url The url of the font file
	 */
	static loadFont(name, url) {
		const style = document.createElement('style');
		const head = document.getElementsByTagName('head');
		const rule = `@font-face { font-family: "${name}"; src: url("${url}"); }`;
		style.type = 'text/css';
		head.item(0)
			.appendChild(style);
		style.sheet.insertRule(rule, 0);
		this._createFontLoader(name);
	}

	/**
	 * Checks whether the font file is loaded.
	 *
	 * @static
	 * @method isFontLoaded
	 * @param {String} name The face name of the font
	 * @return {Boolean} True if the font file is loaded
	 */
	static isFontLoaded(name) {
		if (Graphics._cssFontLoading) {
			if (Graphics._fontLoaded) {
				return Graphics._fontLoaded.check(`10px "${name}"`);
			}

			return false;
		} else {
			if (!this._hiddenCanvas) {
				this._hiddenCanvas = document.createElement('canvas');
			}
			const context = this._hiddenCanvas.getContext('2d');
			const text = 'abcdefghijklmnopqrstuvwxyz';
			let width1;
			let width2;
			context.font = `40px ${name}, sans-serif`;
			width1 = context.measureText(text)
				.width;
			context.font = '40px sans-serif';
			width2 = context.measureText(text)
				.width;
			return width1 !== width2;
		}
	}

	/**
	 * Starts playback of a video.
	 *
	 * @static
	 * @method playVideo
	 * @param {String} src
	 */
	static playVideo(src) {
		// this._videoLoader = ResourceHandler.createLoader(null, this._playVideo.bind(this, src), this._onVideoError.bind(this));
		// this._playVideo(src);
	}

	/**
	 * @static
	 * @method _playVideo
	 * @param {String} src
	 * @private
	 */
	static _playVideo(src) {
		// this._video.src = src;
		// this._video.onloadeddata = this._onVideoLoad.bind(this);
		// this._video.onerror = this._videoLoader;
		// this._video.onended = this._onVideoEnd.bind(this);
		// this._video.load();
		// this._videoLoading = true;
	}

	/**
	 * Checks whether the video is playing.
	 *
	 * @static
	 * @method isVideoPlaying
	 * @return {Boolean} True if the video is playing
	 */
	static isVideoPlaying() {
		return false;
		// return this._videoLoading || this._isVideoVisible();
	}

	/**
	 * Checks whether the browser can play the specified video type.
	 *
	 * @static
	 * @method canPlayVideoType
	 * @param {String} type The video type to test support for
	 * @return {Boolean} True if the browser can play the specified video type
	 */
	static canPlayVideoType(type) {
		return false;
		// return this._video && this._video.canPlayType(type);
	}

	/**
	 * Sets volume of a video.
	 *
	 * @static
	 * @method setVideoVolume
	 * @param {Number} value
	 */
	static setVideoVolume(value) {
		// this._videoVolume = value;
		// if (this._video) {
		// 	this._video.volume = this._videoVolume;
		// }
	}

	/**
	 * Converts an x coordinate on the page to the corresponding
	 * x coordinate on the canvas area.
	 *
	 * @static
	 * @method pageToCanvasX
	 * @param {Number} x The x coordinate on the page to be converted
	 * @return {Number} The x coordinate on the canvas area
	 */
	static pageToCanvasX(x) {
		if (this._canvas) {
			const left = this._canvas.offsetLeft;
			return Math.round((x - left) / this._realScale);
		} else {
			return 0;
		}
	}

	/**
	 * Converts a y coordinate on the page to the corresponding
	 * y coordinate on the canvas area.
	 *
	 * @static
	 * @method pageToCanvasY
	 * @param {Number} y The y coordinate on the page to be converted
	 * @return {Number} The y coordinate on the canvas area
	 */
	static pageToCanvasY(y) {
		if (this._canvas) {
			const top = this._canvas.offsetTop;
			return Math.round((y - top) / this._realScale);
		} else {
			return 0;
		}
	}

	/**
	 * Checks whether the specified point is inside the game canvas area.
	 *
	 * @static
	 * @method isInsideCanvas
	 * @param {Number} x The x coordinate on the canvas area
	 * @param {Number} y The y coordinate on the canvas area
	 * @return {Boolean} True if the specified point is inside the game canvas area
	 */
	static isInsideCanvas(x, y) {
		return (x >= 0 && x < this._width && y >= 0 && y < this._height);
	}

	/**
	 * @static
	 * @method _createAllElements
	 * @private
	 */
	static _createAllElements() {
		this._createErrorPrinter();
		this._createCanvas();
		this._createVideo();
		this._createRenderer();
		this._createPixiApp();
		this._createUpperCanvas();
		this._createFPSMeter();
		this._createModeBox();
		this._createGameFontLoader();
	}

	/**
	 * @static
	 * @method _updateAllElements
	 * @private
	 */
	static _updateAllElements() {
		this._updateRealScale();
		this._updateErrorPrinter();
		this._updateCanvas();
		this._updateVideo();
		this._updateUpperCanvas();
		this._updateRenderer();
		this._paintUpperCanvas();
		this._updateProgress();
	}

	/**
	 * @static
	 * @method _updateRealScale
	 * @private
	 */
	static _updateRealScale() {
		if (this._stretchEnabled) {
			let h = window.innerWidth / this._width;
			let v = window.innerHeight / this._height;
			if (h >= 1 && h - 0.01 <= 1) h = 1;
			if (v >= 1 && v - 0.01 <= 1) v = 1;
			this._realScale = Math.min(h, v);
		} else {
			this._realScale = this._scale;
		}
	}

	/**
	 * @static
	 * @method _testCanvasBlendModes
	 * @private
	 */
	static _testCanvasBlendModes() {
		// let canvas;
		// let context;
		// let imageData1;
		// let imageData2;
		// canvas = document.createElement('canvas');
		// canvas.width = 1;
		// canvas.height = 1;
		// context = canvas.getContext('2d');
		// context.globalCompositeOperation = 'source-over';
		// context.fillStyle = 'white';
		// context.fillRect(0, 0, 1, 1);
		// context.globalCompositeOperation = 'difference';
		// context.fillStyle = 'white';
		// context.fillRect(0, 0, 1, 1);
		// imageData1 = context.getImageData(0, 0, 1, 1);
		// context.globalCompositeOperation = 'source-over';
		// context.fillStyle = 'black';
		// context.fillRect(0, 0, 1, 1);
		// context.globalCompositeOperation = 'saturation';
		// context.fillStyle = 'white';
		// context.fillRect(0, 0, 1, 1);
		// imageData2 = context.getImageData(0, 0, 1, 1);
		// this._canUseDifferenceBlend = imageData1.data[0] === 0;
		// this._canUseSaturationBlend = imageData2.data[0] === 0;
	}

	/**
	 * @static
	 * @method _createErrorPrinter
	 * @private
	 */
	static _createErrorPrinter() {
		this._errorPrinter = document.createElement('p');
		this._errorPrinter.id = 'ErrorPrinter';
		this._updateErrorPrinter();
		document.body.appendChild(this._errorPrinter);
	}

	/**
	 * @static
	 * @method _updateErrorPrinter
	 * @private
	 */
	static _updateErrorPrinter() {
		this._errorPrinter.width = this._width * 0.9;
		if (this._errorShowed && this._showErrorDetail) {
			this._errorPrinter.height = this._height * 0.9;
		} else if (this._errorShowed && this._errorMessage) {
			this._errorPrinter.height = 100;
		} else {
			this._errorPrinter.height = 40;
		}
		this._errorPrinter.style.textAlign = 'center';
		this._errorPrinter.style.textShadow = '1px 1px 3px #000';
		this._errorPrinter.style.fontSize = '20px';
		this._errorPrinter.style.zIndex = 99;
		this._centerElement(this._errorPrinter);
	}

	/**
	 * @static
	 * @method _makeErrorMessage
	 * @private
	 */
	static _makeErrorMessage() {
		const mainMessage = document.createElement('div');
		const style = mainMessage.style;
		style.color = 'white';
		style.textAlign = 'left';
		style.fontSize = '18px';
		mainMessage.innerHTML = `<hr>${this._errorMessage}`;
		this._errorPrinter.appendChild(mainMessage);
	}

	/**
	 * @static
	 * @method _makeErrorDetail
	 * @private
	 */
	static _makeErrorDetail(info, stack) {
		const detail = document.createElement('div');
		const style = detail.style;
		style.color = 'white';
		style.textAlign = 'left';
		style.fontSize = '18px';
		detail.innerHTML = `<br><hr>${info}<br><br>${stack}`;
		this._errorPrinter.appendChild(detail);
	}

	/**
	 * @static
	 * @method _createCanvas
	 * @private
	 */
	static _createCanvas() {
		if (Utils.isWorker()) {
			// Get this._canvas via message passing
		} else {
			this._canvas = document.createElement('canvas');
			this._canvas.id = 'GameCanvas';
			this._updateCanvas();
			document.body.appendChild(this._canvas);
		}
	}

	/**
	 * @static
	 * @method _updateCanvas
	 * @private
	 */
	static _updateCanvas() {
		this._canvas.width = this._width;
		this._canvas.height = this._height;
		this._canvas.style.zIndex = 1;
		this._centerElement(this._canvas);
	}

	/**
	 * @static
	 * @method _createVideo
	 * @private
	 */
	static _createVideo() {
		// this._video = document.createElement('video');
		// this._video.id = 'GameVideo';
		// this._video.style.opacity = 0;
		// this._video.setAttribute('playsinline', '');
		// this._video.volume = this._videoVolume;
		// this._updateVideo();
		// makeVideoPlayableInline(this._video);
		// document.body.appendChild(this._video);
	}

	/**
	 * @static
	 * @method _updateVideo
	 * @private
	 */
	static _updateVideo() {
		// this._video.width = this._width;
		// this._video.height = this._height;
		// this._video.style.zIndex = 2;
		// this._centerElement(this._video);
	}

	/**
	 * @static
	 * @method _createUpperCanvas
	 * @private
	 */
	static _createUpperCanvas() {
		this._upperCanvas = new UpperCanvas();
		this._updateUpperCanvas();
		if (this._app.stage) {
			this._app.stage.addChild(this._upperCanvas);
		}
	}

	/**
	 * @static
	 * @method _updateUpperCanvas
	 * @private
	 */
	static _updateUpperCanvas() {
		// this._centerElement(this._upperCanvas);
	}

	/**
	 * @static
	 * @method _clearUpperCanvas
	 * @private
	 */
	static _clearUpperCanvas() {
		if (this._upperCanvas) {
			this._upperCanvas.removeChildren();
		}
	}

	/**
	 * @static
	 * @method _paintUpperCanvas
	 * @private
	 */
	static _paintUpperCanvas() {
		this._clearUpperCanvas();
		if (this._loadingImage && this._loadingCount >= 20) {
			if (!this._loadingImageSprite) {
				this._loadingImageSprite = new PIXI.Sprite.from(this._loadingImage.src);
			}
			this._upperCanvas.addChild(this._loadingImageSprite);
		}
	}

	/**
	 * @static
	 * @method _updateRenderer
	 * @private
	 */
	static _updateRenderer() {
		if (this._app) {
			this._app.renderer.resize(this._width, this._height);
		}
	}

	/**
	 * @static
	 * @method _createFPSMeter
	 * @private
	 */
	static _createFPSMeter() {
		if (Utils.isWorker()) return;
		if (typeof GameStats == 'function') {
			this._fpsMeter = new GameStats({
				autoPlace: false,
			});
			this._fpsMeter.show(false);
			this._fpsMeter.dom.style.zIndex = 1;
		}
	}

	/**
	 * @static
	 * @method _createModeBox
	 * @private
	 */
	static _createModeBox() {
		const box = document.createElement('div');
		box.id = 'modeTextBack';
		box.style.position = 'absolute';
		box.style.left = '5px';
		box.style.top = '5px';
		box.style.width = '119px';
		box.style.height = '58px';
		box.style.background = 'rgba(0,0,0,0.2)';
		box.style.zIndex = 9;
		box.style.opacity = 0;

		const text = document.createElement('div');
		text.id = 'modeText';
		text.style.position = 'absolute';
		text.style.left = '0px';
		text.style.top = '41px';
		text.style.width = '119px';
		text.style.fontSize = '12px';
		text.style.fontFamily = 'monospace';
		text.style.color = 'white';
		text.style.textAlign = 'center';
		text.style.textShadow = '1px 1px 0 rgba(0,0,0,0.5)';
		text.innerHTML = this.isWebGL() ? 'WebGL mode' : 'Canvas mode';

		document.body.appendChild(box);
		box.appendChild(text);

		this._modeBox = box;
	}

	/**
	 * @static
	 * @method _createGameFontLoader
	 * @private
	 */
	static _createGameFontLoader() {
		this._createFontLoader('GameFont');
	}

	/**
	 * @static
	 * @method _centerElement
	 * @param {HTMLElement} element
	 * @private
	 */
	static _centerElement(element) {
		const width = element.width * this._realScale;
		const height = element.height * this._realScale;
		element.style.position = 'absolute';
		element.style.margin = 'auto';
		element.style.top = 0;
		element.style.left = 0;
		element.style.right = 0;
		element.style.bottom = 0;
		element.style.width = `${width}px`;
		element.style.height = `${height}px`;
	}

	/**
	 * @static
	 * @method _applyCanvasFilter
	 * @private
	 */
	static _applyCanvasFilter() {
		if (this._canvas) {
			this._canvas.style.opacity = 0.5;
			this._canvas.style.webkitFilter = 'blur(8px)';
			this._canvas.style.filter = 'blur(8px)';
		}
	}

	/**
	 * @static
	 * @method _onVideoLoad
	 * @private
	 */
	static _onVideoLoad() {
		// this._video.play();
		// this._updateVisibility(true);
		// this._videoLoading = false;
	}

	/**
	 * @static
	 * @method _onVideoError
	 * @private
	 */
	static _onVideoError() {
		// this._updateVisibility(false);
		// this._videoLoading = false;
	}

	/**
	 * @static
	 * @method _onVideoEnd
	 * @private
	 */
	static _onVideoEnd() {
		// this._updateVisibility(false);
	}

	/**
	 * @static
	 * @method _updateVisibility
	 * @param {Boolean} videoVisible
	 * @private
	 */
	static _updateVisibility(videoVisible) {
		// this._video.style.opacity = videoVisible ? 1 : 0;
		// this._canvas.style.opacity = videoVisible ? 0 : 1;
	}

	/**
	 * @static
	 * @method _isVideoVisible
	 * @return {Boolean}
	 * @private
	 */
	static _isVideoVisible() {
		return false;
		// return this._video.style.opacity > 0;
	}

	/**
	 * @static
	 * @method _setupEventHandlers
	 * @private
	 */
	static _setupEventHandlers() {
		window.addEventListener('resize', this._onWindowResize.bind(this));
		document.addEventListener('keydown', this._onKeyDown.bind(this));
		document.addEventListener('keydown', this._onTouchEnd.bind(this));
		document.addEventListener('mousedown', this._onTouchEnd.bind(this));
		document.addEventListener('touchend', this._onTouchEnd.bind(this));
	}

	/**
	 * @static
	 * @method _onWindowResize
	 * @private
	 */
	static _onWindowResize() {
		this._updateAllElements();
	}

	/**
	 * @static
	 * @method _onKeyDown
	 * @param {KeyboardEvent} event
	 * @private
	 */
	static _onKeyDown(event) {
		if (!event.ctrlKey && !event.altKey) {
			switch (event.keyCode) {
			case 113: // F2
				event.preventDefault();
				this._switchFPSMeter();
				break;
			case 114: // F3
				event.preventDefault();
				this._switchStretchMode();
				break;
			case 115: // F4
				event.preventDefault();
				this._switchFullScreen();
				break;
			}
		}
	}

	/**
	 * @static
	 * @method _onTouchEnd
	 * @param {TouchEvent} event
	 * @private
	 */
	static _onTouchEnd(event) {
		// if (!this._videoUnlocked) {
		// 	this._video.play();
		// 	this._videoUnlocked = true;
		// }
		// if (this._isVideoVisible() && this._video.paused) {
		// 	this._video.play();
		// }
	}

	/**
	 * @static
	 * @method _switchFPSMeter
	 * @private
	 */
	static _switchFPSMeter() {
		if (Utils.isWorker()) return;
		if (this._fpsMeter && this._fpsMeterToggled) {
			this.hideFps();
			this._fpsMeterToggled = false;
		} else if (this._fpsMeter && !this._fpsMeterToggled) {
			this.showFps();
			this._fpsMeterToggled = true;
		}
	}

	/**
	 * @static
	 * @method _switchStretchMode
	 * @return {Boolean}
	 * @private
	 */
	static _switchStretchMode() {
		this._stretchEnabled = !this._stretchEnabled;
		this._updateAllElements();
	}

	/**
	 * @static
	 * @method _switchFullScreen
	 * @private
	 */
	static _switchFullScreen() {
		if (this._isFullScreen()) {
			this._cancelFullScreen();
		} else {
			this._requestFullScreen();
		}
	}

	/**
	 * @static
	 * @method _onTick
	 * @param {Number} delta
	 * @private
	 */
	static _onTick(delta) {
		if (this._fpsMeter && this._fpsMeter.shown) this._fpsMeter.begin();
		if (this._app.stage) {
			this._app.render();
		}
		if (this._fpsMeter && this._fpsMeter.shown) this._fpsMeter.end();
	}

	/**
	 * @static
	 * @method _createPixiApp
	 * @private
	 */
	static _createPixiApp() {
		const options = {
			view: this._canvas,
			width: this._width,
			height: this._height,
			resolution: window.devicePixelRatio,
			powerPreference: "high-performance",
			autoStart: true,
		};
		try {
			this._app = new PIXI.Application(options);
			this._app.ticker.remove(this._app.render, this._app);
			this._app.ticker.add(this._onTick, this);
		} catch (e) {
			this._app = null;
			console.error(e);
		}
	}

	static _setupCssFontLoading() {
		if (Graphics._cssFontLoading) {
			document.fonts.ready.then(fonts => {
					Graphics._fontLoaded = fonts;
				})
				.catch(error => {
					SceneManager.onError(error);
				});
		}
	}

	/**
	 * Marks the beginning of each frame for FPSMeter.
	 *
	 * @static
	 * @method tickStart
	 */
	static tickStart() {};

	/**
	 * Marks the end of each frame for FPSMeter.
	 *
	 * @static
	 * @method tickEnd
	 */
	static tickEnd() {};

	/**
	 * Checks whether the current browser supports WebGL.
	 *
	 * @static
	 * @method hasWebGL
	 * @return {Boolean} True if the current browser supports WebGL.
	 */
	static hasWebGL() {
		if (typeof Graphics._canWebGL === "boolean") {
			return Graphics._canWebGL;
		}
		try {
			const canvas = document.createElement('canvas');
			const result = !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
			Graphics._canWebGL = result;
			return result;
		} catch (e) {
			Graphics._canWebGL = false;
			return false;
		}
	};

	/**
	 * Calls pixi.js garbage collector
	 */
	static callGC() {
		if (Graphics.isWebGL()) {
			Graphics._renderer.textureGC.run();
		}
	}

	/**
	 * @static
	 * @method _makeErrorHtml
	 * @param {String} name
	 * @param {String} message
	 * @return {String}
	 * @private
	 */
	static _makeErrorHtml(name, message) {
		return `<font color="yellow"><b>${name}</b></font><br><font color="white">${decodeURIComponent(message)}</font><br>`;
	}

	/**
	 * @static
	 * @method _defaultStretchMode
	 * @private
	 */
	static _defaultStretchMode() {
		return Utils.isNwjs() || Utils.isMobileDevice() || Utils.isTauri();
	}

	/**
	 * @static
	 * @method _modifyExistingElements
	 * @private
	 */
	static _modifyExistingElements() {
		// const elements = document.getElementsByTagName('*');
		// for (let i = 0; i < elements.length; i++) {
		// 	if (elements[i].style.zIndex > 0) {
		// 		elements[i].style.zIndex = 0;
		// 	}
		// }
	}

	/**
	 * @static
	 * @method _formatEventInfo
	 * @private
	 */
	static _formatEventInfo(error) {
		switch (String(error.eventType)) {
		case "map_event":
			return "MapID: %1, MapEventID: %2, page: %3, line: %4".format(error.mapId, error.mapEventId, error.page, error.line);
		case "common_event":
			return "CommonEventID: %1, line: %2".format(error.commonEventId, error.line);
		case "battle_event":
			return "TroopID: %1, page: %2, line: %3".format(error.troopId, error.page, error.line);
		case "test_event":
			return "TestEvent, line: %1".format(error.line);
		default:
			return "No information";
		}
	}

	/**
	 * @static
	 * @method _formatEventCommandInfo
	 * @private
	 */
	static _formatEventCommandInfo({
		eventCommand,
		content
	}) {
		switch (String(eventCommand)) {
		case "plugin_command":
			return `◆Plugin Command: ${content}`;
		case "script":
			return `◆Script: ${content}`;
		case "control_variables":
			return `◆Control Variables: Script: ${content}`;
		case "conditional_branch_script":
			return `◆If: Script: ${content}`;
		case "set_route_script":
			return `◆Set Movement Route: ◇Script: ${content}`;
		case "auto_route_script":
			return `Autonomous Movement Custom Route: ◇Script: ${content}`;
		case "other":
		default:
			return "";
		}
	}

	/**
	 * @static
	 * @method _formatStackTrace
	 * @private
	 */
	static _formatStackTrace({
		stack
	}) {
		return decodeURIComponent((stack || '')
			.replace(/file:.*js\//g, '')
			.replace(/http:.*js\//g, '')
			.replace(/https:.*js\//g, '')
			.replace(/chrome-extension:.*js\//g, '')
			.replace(/\n/g, '<br>'));
	}

	/**
	 * @static
	 * @method _createRenderer
	 * @private
	 */
	static _createRenderer() {};

	/**
	 * @static
	 * @method _createFontLoader
	 * @param {String} name
	 * @private
	 */
	static _createFontLoader(name) {
		const div = document.createElement('div');
		const text = document.createTextNode('.');
		div.style.fontFamily = name;
		div.style.fontSize = '0px';
		div.style.color = 'transparent';
		div.style.position = 'absolute';
		div.style.margin = 'auto';
		div.style.top = '0px';
		div.style.left = '0px';
		div.style.width = '1px';
		div.style.height = '1px';
		div.appendChild(text);
		document.body.appendChild(div);
	};

	/**
	 * @static
	 * @method _disableTextSelection
	 * @private
	 */
	static _disableTextSelection() {
		const body = document.body;
		body.style.userSelect = 'none';
		body.style.webkitUserSelect = 'none';
		body.style.msUserSelect = 'none';
		body.style.mozUserSelect = 'none';
	};

	/**
	 * @static
	 * @method _disableContextMenu
	 * @private
	 */
	static _disableContextMenu() {
		const elements = document.body.getElementsByTagName('*');
		const oncontextmenu = () => false;
		for (let i = 0; i < elements.length; i++) {
			elements[i].oncontextmenu = oncontextmenu;
		}
	};

	/**
	 * @static
	 * @method _isFullScreen
	 * @return {Boolean}
	 * @private
	 */
	static _isFullScreen() {
		return document.fullscreenElement ||
			document.mozFullScreen ||
			document.webkitFullscreenElement ||
			document.msFullscreenElement;
	}

	/**
	 * @static
	 * @method _requestFullScreen
	 * @private
	 */
	static _requestFullScreen() {
		const element = document.body;
		if (element.requestFullscreen) {
			element.requestFullscreen();
		} else if (element.mozRequestFullScreen) {
			element.mozRequestFullScreen();
		} else if (element.webkitRequestFullScreen) {
			element.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
		} else if (element.msRequestFullscreen) {
			element.msRequestFullscreen();
		}
	}

	/**
	 * @static
	 * @method _cancelFullScreen
	 * @private
	 */
	static _cancelFullScreen() {
		if (document.exitFullscreen) {
			document.exitFullscreen();
		} else if (document.mozCancelFullScreen) {
			document.mozCancelFullScreen();
		} else if (document.webkitCancelFullScreen) {
			document.webkitCancelFullScreen();
		} else if (document.msExitFullscreen) {
			document.msExitFullscreen();
		}
	}
}

Graphics._cssFontLoading = !Utils.isWorker() && (document.fonts && document.fonts.ready && document.fonts.ready.then);
Graphics._fontLoaded = null;
Graphics._videoVolume = 1;

/**
 * Expose access to PIXI.Application object.
 *
 * @readonly
 * @type PIXI.Application
 * @name Graphics.app
 */
Object.defineProperty(Graphics, "app", {
	get() {
		return this._app;
	},
	configurable: true
});

/**
 * Shim for old plugins looking for renderer.
 *
 * @readonly
 * @type PIXI.Renderer
 * @name Graphics._renderer
 */
Object.defineProperty(Graphics, "_renderer", {
	get() {
		return this._app.renderer;
	},
	configurable: true
});

/**
 * The total frame count of the game screen.
 *
 * @static
 * @property frameCount
 * @type Number
 */
Graphics.frameCount = 0;

/**
 * The alias of PIXI.blendModes.NORMAL.
 *
 * @static
 * @property BLEND_NORMAL
 * @type Number
 * @final
 */
Graphics.BLEND_NORMAL = 0;

/**
 * The alias of PIXI.blendModes.ADD.
 *
 * @static
 * @property BLEND_ADD
 * @type Number
 * @final
 */
Graphics.BLEND_ADD = 1;

/**
 * The alias of PIXI.blendModes.MULTIPLY.
 *
 * @static
 * @property BLEND_MULTIPLY
 * @type Number
 * @final
 */
Graphics.BLEND_MULTIPLY = 2;

/**
 * The alias of PIXI.blendModes.SCREEN.
 *
 * @static
 * @property BLEND_SCREEN
 * @type Number
 * @final
 */
Graphics.BLEND_SCREEN = 3;

Graphics._canWebGL = null;

/**
 * The width of the game screen.
 *
 * @static
 * @property width
 * @type Number
 */
Object.defineProperty(Graphics, 'width', {
	get() {
		return this._width;
	},
	set(value) {
		if (this._width !== value) {
			this._width = value;
			this._updateAllElements();
		}
	},
	configurable: true
});

/**
 * The height of the game screen.
 *
 * @static
 * @property height
 * @type Number
 */
Object.defineProperty(Graphics, 'height', {
	get() {
		return this._height;
	},
	set(value) {
		if (this._height !== value) {
			this._height = value;
			this._updateAllElements();
		}
	},
	configurable: true
});

/**
 * The width of the window display area.
 *
 * @static
 * @property boxWidth
 * @type Number
 */
Object.defineProperty(Graphics, 'boxWidth', {
	get() {
		return this._boxWidth;
	},
	set(value) {
		this._boxWidth = value;
	},
	configurable: true
});

/**
 * The height of the window display area.
 *
 * @static
 * @property boxHeight
 * @type Number
 */
Object.defineProperty(Graphics, 'boxHeight', {
	get() {
		return this._boxHeight;
	},
	set(value) {
		this._boxHeight = value;
	},
	configurable: true
});

/**
 * The zoom scale of the game screen.
 *
 * @static
 * @property scale
 * @type Number
 */
Object.defineProperty(Graphics, 'scale', {
	get() {
		return this._scale;
	},
	set(value) {
		if (this._scale !== value) {
			this._scale = value;
			this._updateAllElements();
		}
	},
	configurable: true
});

export default Graphics;
