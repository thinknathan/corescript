"use strict";

import * as Comlink from "./libs/comlink.mjs";
import Utils from "./rpg_core/Utils.js";
import WindowShim from "./rpg_core/WindowShim.js";
import DocumentShim from "./rpg_core/DocumentShim.js";

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

			document.addEventListener('keydown', (e) => Render_Thread.documentEventFired('keydown', {
				key: e.key,
				code: e.code,
				altKey: e.altKey,
				charCode: e.charCode,
				ctrlKey: e.ctrlKey,
				keyCode: e.keyCode,
				shiftKey: e.shiftKey,
			}));
			document.addEventListener('keyup', (e) => Render_Thread.documentEventFired('keyup', {
				key: e.key,
				code: e.code,
				altKey: e.altKey,
				charCode: e.charCode,
				ctrlKey: e.ctrlKey,
				keyCode: e.keyCode,
				shiftKey: e.shiftKey,
			}));
			document.addEventListener('mousedown', (e) => Render_Thread.documentEventFired('mousedown', {
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
			document.addEventListener('touchend', (e) => Render_Thread.documentEventFired('touchend', {
				changedTouches: JSON.stringify(e.changedTouches),
				timeStamp: e.timeStamp,
				touches: JSON.stringify(e.touches),
			}));
			document.addEventListener('touchstart', (e) => Render_Thread.documentEventFired('touchstart', {
				changedTouches: JSON.stringify(e.changedTouches),
				timeStamp: e.timeStamp,
				touches: JSON.stringify(e.touches),
			}), isSupportPassive ? {
						passive: false
					} : false);

			// May need 16ms throttle
			document.addEventListener('touchmove', (e) => Render_Thread.documentEventFired('touchmove', {
				changedTouches: JSON.stringify(e.changedTouches),
				timeStamp: e.timeStamp,
				touches: JSON.stringify(e.touches),
			}), isSupportPassive ? {
						passive: false
					} : false);
			document.addEventListener('touchcancel', (e) => Render_Thread.documentEventFired('touchcancel', {}));

			// May need 16.67ms throttle
			// document.addEventListener('mousemove', (e) => console.log(e));
			// document.addEventListener('mouseup', (e) => console.log(e));

			// May need 16.67ms throttle
			// document.addEventListener('wheel', (e) => console.log(e), isSupportPassive ? {
			// 			passive: false
			// 		} : false);

			// document.addEventListener('pointerdown', (e) => console.log(e));
			// document.addEventListener('visibilitychange', (e) => console.log(e));

			// May need 16.67ms throttle
			// window.addEventListener('resize', (e) => console.log(e));
			// window.addEventListener('blur', (e) => console.log(e));
			// window.addEventListener('error', (e) => console.log(e));
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
