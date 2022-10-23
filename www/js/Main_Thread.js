'use strict';

import {
	ParentHandshake,
	WorkerMessenger,
} from 'https://cdn.skypack.dev/pin/post-me@v0.4.5-y0XpddbrtdQz6AmbiUsy/mode=imports/optimized/post-me.js';
import Utils from './rpg_core/Utils.js';

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
		};
	}
	static async attachListeners(Render_Thread) {
		const isSupportPassive = Utils.isSupportPassiveEvent();
		const throttleThreshold = 33.34;

		/* Listen for request to quit game */
		Render_Thread.addEventListener('close', (payload) => {
			console.log('Close window request');
			window.close();
		});

		Render_Thread.addEventListener('audio', (payload) => {
			console.log('Web audio request');
		});

		/* Keyboard Events */
		document.addEventListener('keydown', (e) => {
			switch (e.keyCode) {
				case 8: // backspace
				case 33: // pageup
				case 34: // pagedown
				case 37: // left arrow
				case 38: // up arrow
				case 39: // right arrow
				case 40: // down arrow
				case 113: // F2
				case 114: // F3
				case 115: // F4
					e.preventDefault();
			}
			Render_Thread.call('receiveEvent', {
				type: 'keydown',
				shimType: 'document',
				key: e.key,
				code: e.code,
				altKey: e.altKey,
				charCode: e.charCode,
				ctrlKey: e.ctrlKey,
				keyCode: e.keyCode,
				shiftKey: e.shiftKey,
			});
		});

		document.addEventListener('keyup', (e) =>
			Render_Thread.call('receiveEvent', {
				type: 'keyup',
				shimType: 'document',
				key: e.key,
				code: e.code,
				altKey: e.altKey,
				charCode: e.charCode,
				ctrlKey: e.ctrlKey,
				keyCode: e.keyCode,
				shiftKey: e.shiftKey,
			})
		);

		/* Mouse Events */
		document.addEventListener('mousedown', (e) =>
			Render_Thread.call('receiveEvent', {
				type: 'mousedown',
				shimType: 'document',
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
			})
		);
		document.addEventListener('mouseup', (e) =>
			Render_Thread.call('receiveEvent', {
				type: 'mouseup',
				shimType: 'document',
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
			})
		);
		const mousemoveFunc = (e) =>
			Render_Thread.call('receiveEvent', {
				type: 'mousemove',
				shimType: 'document',
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
		const mousemoveThrottled = Utils.getThrottledFunction(
			mousemoveFunc,
			throttleThreshold
		);
		document.addEventListener('mousemove', (e) => mousemoveThrottled(e));

		const wheelFunc = (e) => {
			e.preventDefault();
			Render_Thread.call('receiveEvent', {
				type: 'wheel',
				shimType: 'document',
				deltaX: e.deltaX,
				deltaY: e.deltaY,
				deltaZ: e.deltaZ,
			});
		};
		const wheelThrottled = Utils.getThrottledFunction(
			wheelFunc,
			throttleThreshold
		);
		document.addEventListener(
			'wheel',
			(e) => wheelThrottled(e),
			isSupportPassive
				? {
						passive: false,
				  }
				: false
		);

		/* Touch Events */
		document.addEventListener('touchend', (e) =>
			Render_Thread.call('receiveEvent', {
				type: 'touchend',
				shimType: 'document',
				changedTouches: JSON.stringify(e.changedTouches),
				timeStamp: e.timeStamp,
				touches: JSON.stringify(e.touches),
			})
		);
		document.addEventListener(
			'touchstart',
			(e) => {
				const changedTouches = {
					0: {},
					length: 0,
				};
				const touches = {
					0: {},
					length: 0,
				};
				let i = 0;
				for (const touch of e.changedTouches) {
					changedTouches[i] = {
						pageX: touch.pageX,
						pageY: touch.pageY,
					};
					i++;
				}
				changedTouches.length = i;
				let j = 0;
				for (const touch of e.touches) {
					touches[j] = {
						pageX: touch.pageX,
						pageY: touch.pageY,
					};
					j++;
				}
				touches.length = j;

				Render_Thread.call('receiveEvent', {
					type: 'touchstart',
					shimType: 'document',
					changedTouches: changedTouches,
					timeStamp: e.timeStamp,
					touches: touches,
				});
			},
			isSupportPassive
				? {
						passive: false,
				  }
				: false
		);
		const touchmoveFunc = (e) =>
			Render_Thread.call('receiveEvent', {
				type: 'touchmove',
				shimType: 'document',
				changedTouches: JSON.stringify(e.changedTouches),
				timeStamp: e.timeStamp,
				touches: JSON.stringify(e.touches),
			});
		const touchmoveThrottled = Utils.getThrottledFunction(
			touchmoveFunc,
			throttleThreshold
		);
		document.addEventListener(
			'touchmove',
			(e) => touchmoveThrottled(e),
			isSupportPassive
				? {
						passive: false,
				  }
				: false
		);
		document.addEventListener('touchcancel', (e) =>
			Render_Thread.call('receiveEvent', {
				type: 'touchcancel',
				shimType: 'document',
			})
		);

		/* Other Events */
		document.addEventListener('pointerdown', (e) =>
			Render_Thread.call('receiveEvent', {
				type: 'pointerdown',
				shimType: 'document',
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
			})
		);

		document.addEventListener('visibilitychange', (e) =>
			Render_Thread.call('receiveEvent', {
				type: 'visibilitychange',
				shimType: 'document',
				timeStamp: e.timeStamp,
				visibilityState: document.visibilityState,
			})
		);

		const resizeFunc = (e) =>
			Render_Thread.call('receiveEvent', {
				type: 'resize',
				shimType: 'window',
				innerWidth: window.innerWidth,
				innerHeight: window.innerHeight,
				timeStamp: e.timeStamp,
			});
		const resizeThrottled = Utils.getThrottledFunction(
			resizeFunc,
			throttleThreshold
		);
		window.addEventListener('resize', (e) => resizeThrottled(e));

		window.addEventListener('blur', (e) =>
			Render_Thread.call('receiveEvent', {
				type: 'blur',
				shimType: 'window',
				timeStamp: e.timeStamp,
			})
		);

		window.addEventListener('error', (e) =>
			Render_Thread.call('receiveEvent', {
				type: 'error',
				shimType: 'window',
				timeStamp: e.timeStamp,
				message: e.message,
				filename: e.filename,
			})
		);
	}

	static async setupDataThread() {
		const dataWorker = new Worker('js/Data_Thread.js', { type: 'module' });
		const Data_Thread = await Comlink.wrap(dataWorker);
		await Data_Thread.start();
		window.Data_Thread = Data_Thread;
	}

	static async setupRenderThread() {
		if (HTMLCanvasElement.prototype.transferControlToOffscreen) {
			// Setup render thread
			const worker = new Worker('js/Render_Thread.js', {
				type: 'module',
			});
			window.Render_Thread = worker;
			const messenger = new WorkerMessenger({ worker });
			const context = this;

			ParentHandshake(messenger).then((connection) => {
				const remoteHandle = connection.remoteHandle();

				// Pass initialize info about window and document to render thread
				const windowData = context.getWindowData();
				remoteHandle.call('updateWindowData', windowData);

				remoteHandle.call('updatePluginData', $plugins);

				// Prepare to pass messages to render thread
				context.attachListeners(remoteHandle);

				// Pass canvas to Render_Thread
				const htmlCanvas = document.createElement('canvas');
				htmlCanvas.id = 'GameCanvas';
				document.body.appendChild(htmlCanvas);
				const offscreen = htmlCanvas.transferControlToOffscreen();
				remoteHandle.customCall('receiveCanvas', [offscreen, 2], {
					transfer: [offscreen],
				});

				// Start render thread
				remoteHandle.call('start');
			});
		} else {
			// Load rendering code in the main thread
			Utils.loadScript('js/Render_Thread.js', true);
		}
	}
	static async start() {
		// await this.setupDataThread();
		await this.setupRenderThread();
	}
}
Main_Thread.start();
