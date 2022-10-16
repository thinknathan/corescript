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
		document.addEventListener('message', (payload) => {
			if (payload.type === 'close') {
				console.log('Close window request');
				window.close();
			} else if (payload.type === 'audio') {
				console.log('Web audio request');
			}
		});

		/* Keyboard Events */
		document.addEventListener('keydown', (e) =>
			Render_Thread.receiveEvent({
				type: 'keydown',
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
		document.addEventListener('keyup', (e) =>
			Render_Thread.receiveEvent({
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
			Render_Thread.receiveEvent({
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
			Render_Thread.receiveEvent({
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
			Render_Thread.receiveEvent({
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

		const wheelFunc = (e) =>
			Render_Thread.receiveEvent({
				type: 'wheel',
				shimType: 'document',
				deltaX: e.deltaX,
				deltaY: e.deltaY,
				deltaZ: e.deltaZ,
			});
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
			Render_Thread.receiveEvent({
				type: 'touchend',
				shimType: 'document',
				changedTouches: JSON.stringify(e.changedTouches),
				timeStamp: e.timeStamp,
				touches: JSON.stringify(e.touches),
			})
		);
		document.addEventListener(
			'touchstart',
			(e) =>
				Render_Thread.receiveEvent({
					type: 'touchstart',
					shimType: 'document',
					changedTouches: JSON.stringify(e.changedTouches),
					timeStamp: e.timeStamp,
					touches: JSON.stringify(e.touches),
				}),
			isSupportPassive
				? {
						passive: false,
				  }
				: false
		);
		const touchmoveFunc = (e) =>
			Render_Thread.receiveEvent({
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
			Render_Thread.receiveEvent({
				type: 'touchcancel',
				shimType: 'document',
			})
		);

		/* Other Events */
		document.addEventListener('pointerdown', (e) =>
			Render_Thread.receiveEvent({
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
			Render_Thread.receiveEvent({
				type: 'visibilitychange',
				shimType: 'document',
				timeStamp: e.timeStamp,
			})
		);

		const resizeFunc = (e) =>
			Render_Thread.receiveEvent({
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
			Render_Thread.receiveEvent({
				type: 'blur',
				shimType: 'window',
				timeStamp: e.timeStamp,
			})
		);

		window.addEventListener('error', (e) =>
			Render_Thread.receiveEvent({
				type: 'error',
				shimType: 'window',
				timeStamp: e.timeStamp,
				message: e.message,
				filename: e.filename,
			})
		);
	}
	static async transferWindowData(Render_Thread) {
		const windowData = this.getWindowData();
		await Render_Thread.updateData({
			type: 'window',
			data: windowData,
		});
		console.log('the above line of code will absolutely never run');
	}
	static async transferPluginData(Render_Thread) {
		await Render_Thread.updateData({
			type: 'plugins',
			data: $plugins,
		});
		console.log('the above line of code will absolutely never run');
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
			const messenger = new WorkerMessenger({ worker });

			ParentHandshake(messenger).then((connection) => {
				const remoteHandle = connection.remoteHandle();

				// Call methods on the worker and get the result as a promise
				remoteHandle.call('sum', 3, 4).then((result) => {
					console.log(result); // 7
				});

				// Listen for a specific custom event from the worker
				remoteHandle.addEventListener('ping', (payload) => {
					console.log(payload); // 'Oh, hi!'
				});
			});

			return;

			// Pass initialize info about window and document to render thread
			await this.transferWindowData(Render_Thread);

			await this.transferPluginData(Render_Thread);

			// Prepare to pass messages to render thread
			await this.attachListeners(Render_Thread);

			// Pass canvas to Render_Thread
			const htmlCanvas = document.createElement('canvas');
			htmlCanvas.id = 'GameCanvas';
			document.body.appendChild(htmlCanvas);
			console.log(htmlCanvas);

			const offscreen = htmlCanvas.transferControlToOffscreen();
			renderWorker.postMessage({ canvas: offscreen }, [offscreen]);

			// Start render thread
			await Render_Thread.start();
			console.log('this absolutely will never run');
			window.Render_Thread = Render_Thread;
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
