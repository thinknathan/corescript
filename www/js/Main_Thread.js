"use strict";

import * as Comlink from "./libs/comlink.mjs";
import Utils from "./rpg_core/Utils.js";

class Main_Thread {
	constructor() {
		throw new Error('This is a static class');
	}
	static getWindowData() {
		return {
            devicePixelRatio: window.devicePixelRatio,
            innerWidth: window.innerWidth,
            innerHeight: window.innerHeight,
            cordova: !!window.cordova,
            navigatorStandalone: !!window.navigator.standalone,
            __TAURI__: !!window.__TAURI__,
        }
	}
	static async attachListeners(Render_Thread) {
		const isSupportPassive = Utils.isSupportPassiveEvent();
		const throttleThreshold = 33.34;

		/* Keyboard Events */
		document.addEventListener('keydown', (e) => Render_Thread.receiveDocumentEvent('keydown', {
			key: e.key,
			code: e.code,
			altKey: e.altKey,
			charCode: e.charCode,
			ctrlKey: e.ctrlKey,
			keyCode: e.keyCode,
			shiftKey: e.shiftKey,
		}));
		document.addEventListener('keyup', (e) => Render_Thread.receiveDocumentEvent('keyup', {
			key: e.key,
			code: e.code,
			altKey: e.altKey,
			charCode: e.charCode,
			ctrlKey: e.ctrlKey,
			keyCode: e.keyCode,
			shiftKey: e.shiftKey,
		}));

		/* Mouse Events */
		document.addEventListener('mousedown', (e) => Render_Thread.receiveDocumentEvent('mousedown', {
			clientX: e.clientX,
			clientY: e.clientY,
			button: e.button,
			layerX: e.layerX,
			layerY: e.layerY,
			offsetX: e.offsetX,
			offsetY: e.offsetY,
			pageX: e.pageX,
			pageY: e.pageY,
			screenX: e.screenX,
			screenY: e.screenY,
			timeStamp: e.timeStamp,
			x: e.x,
			y: e.y,
		}));
		document.addEventListener('mouseup', (e) => Render_Thread.receiveDocumentEvent('mouseup', {
			clientX: e.clientX,
			clientY: e.clientY,
			button: e.button,
			layerX: e.layerX,
			layerY: e.layerY,
			offsetX: e.offsetX,
			offsetY: e.offsetY,
			pageX: e.pageX,
			pageY: e.pageY,
			screenX: e.screenX,
			screenY: e.screenY,
			timeStamp: e.timeStamp,
			x: e.x,
			y: e.y,
		}));
		const mousemoveFunc = (e) => Render_Thread.receiveDocumentEvent('mousemove', {
			clientX: e.clientX,
			clientY: e.clientY,
			button: e.button,
			layerX: e.layerX,
			layerY: e.layerY,
			offsetX: e.offsetX,
			offsetY: e.offsetY,
			pageX: e.pageX,
			pageY: e.pageY,
			screenX: e.screenX,
			screenY: e.screenY,
			timeStamp: e.timeStamp,
			x: e.x,
			y: e.y,
		});
		const mousemoveThrottled = Utils.getThrottledFunction(mousemoveFunc, throttleThreshold);
		document.addEventListener('mousemove', (e) => mousemoveThrottled(e));

		const wheelFunc = (e) => Render_Thread.receiveDocumentEvent('wheel', {
			deltaX: e.deltaX,
			deltaY: e.deltaY,
			deltaZ: e.deltaZ,
		});
		const wheelThrottled = Utils.getThrottledFunction(wheelFunc, throttleThreshold);
		document.addEventListener('wheel', (e) => wheelThrottled(e), isSupportPassive ? {
					passive: false
				} : false);

		/* Touch Events */
		document.addEventListener('touchend', (e) => Render_Thread.receiveDocumentEvent('touchend', {
			changedTouches: JSON.stringify(e.changedTouches),
			timeStamp: e.timeStamp,
			touches: JSON.stringify(e.touches),
		}));
		document.addEventListener('touchstart', (e) => Render_Thread.receiveDocumentEvent('touchstart', {
			changedTouches: JSON.stringify(e.changedTouches),
			timeStamp: e.timeStamp,
			touches: JSON.stringify(e.touches),
		}), isSupportPassive ? {
					passive: false
				} : false);
		const touchmoveFunc = (e) => Render_Thread.receiveDocumentEvent('touchmove', {
			changedTouches: JSON.stringify(e.changedTouches),
			timeStamp: e.timeStamp,
			touches: JSON.stringify(e.touches),
		});
		const touchmoveThrottled = Utils.getThrottledFunction(touchmoveFunc, throttleThreshold);
		document.addEventListener('touchmove', (e) => touchmoveThrottled(e), isSupportPassive ? {
					passive: false
				} : false);
		document.addEventListener('touchcancel', (e) => Render_Thread.receiveDocumentEvent('touchcancel', {}));

		/* Other Events */
		document.addEventListener('pointerdown', (e) => Render_Thread.receiveDocumentEvent('pointerdown', {
			clientX: e.clientX,
			clientY: e.clientY,
			button: e.button,
			layerX: e.layerX,
			layerY: e.layerY,
			offsetX: e.offsetX,
			offsetY: e.offsetY,
			pageX: e.pageX,
			pageY: e.pageY,
			screenX: e.screenX,
			screenY: e.screenY,
			timeStamp: e.timeStamp,
			x: e.x,
			y: e.y,
		}));

		document.addEventListener('visibilitychange', (e) => Render_Thread.receiveDocumentEvent('visibilitychange', {
			timeStamp: e.timeStamp,
		}));

		const resizeFunc = (e) => Render_Thread.receiveWindowEvent('resize', {
			innerWidth: window.innerWidth,
            innerHeight: window.innerHeight,
			timeStamp: e.timeStamp,
		});
		const resizeThrottled = Utils.getThrottledFunction(resizeFunc, throttleThreshold);
		window.addEventListener('resize', (e) => resizeThrottled(e));

		window.addEventListener('blur', (e) => Render_Thread.receiveWindowEvent('blur', {
			timeStamp: e.timeStamp,
		}));

		window.addEventListener('error', (e) => Render_Thread.receiveWindowEvent('error', {
			timeStamp: e.timeStamp,
			message: e.message,
			filename: e.filename,
		}));
	}
	static async transferWindowData (Render_Thread) {
		const windowData = this.getWindowData();
		await Render_Thread.receiveWindowData(windowData);
	}
	static async transferPluginData (Render_Thread) {
		await Render_Thread.receivePluginData($plugins);
	}
	static async setupDataThread () {
		const dataWorker = new Worker("js/Data_Thread.js", {type: 'module'});
		const Data_Thread = await Comlink.wrap(dataWorker);
		window.Data_Thread = Data_Thread;
	}

	static async setupRenderThread () {
		Utils.loadScript('js/Render_Thread.js', true);

		/*
		if (HTMLCanvasElement.prototype.transferControlToOffscreen) {
			// Setup render thread
			const renderWorker = new Worker("js/Render_Thread.js", {type: 'module'});
			const Render_Thread = await Comlink.wrap(renderWorker);

			// Prepare to pass messages to render thread
			await this.attachListeners(Render_Thread);

			// Pass initialize info about window and document to render thread
			await this.transferWindowData(Render_Thread);
			await this.transferPluginData(Render_Thread);

			// Start render thread
			await Render_Thread.start();

		window.Render_Thread = Render_Thread;
		} else {
			// Load rendering code in the main thread
			Utils.loadScript('js/Render_Thread.js', true);
		}
		*/
	}
	static async start () {
		await this.setupDataThread();
		await this.setupRenderThread();
	}
}
Main_Thread.start();
