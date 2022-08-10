/*!
 * Main_Thread.js - corescript v1.6.1 (community-1.4)
 * (c) 2015 KADOKAWA CORPORATION./YOJI OJIMA
 * Contributions by the RPG Maker MV CoreScript team
 * https://github.com/thinknathan/corescript/blob/master/CONTRIBUTORS.md
 *
 * Licensed under the MIT License.
 * https://github.com/thinknathan/corescript/blob/master/LICENSE
 */
!(function () {
	'use strict';
	const e = Symbol('Comlink.proxy'),
		t = Symbol('Comlink.endpoint'),
		n = Symbol('Comlink.releaseProxy'),
		a = Symbol('Comlink.thrown'),
		r = (e) => ('object' == typeof e && null !== e) || 'function' == typeof e,
		i = new Map([
			[
				'proxy',
				{
					canHandle: (t) => r(t) && t[e],
					serialize(e) {
						const { port1: t, port2: n } = new MessageChannel();
						return s(e, t), [n, [n]];
					},
					deserialize: (e) => (e.start(), c(e)),
				},
			],
			[
				'throw',
				{
					canHandle: (e) => r(e) && a in e,
					serialize({ value: e }) {
						let t;
						return (
							(t =
								e instanceof Error
									? {
											isError: !0,
											value: {
												message: e.message,
												name: e.name,
												stack: e.stack,
											},
									  }
									: { isError: !1, value: e }),
							[t, []]
						);
					},
					deserialize(e) {
						if (e.isError)
							throw Object.assign(new Error(e.value.message), e.value);
						throw e.value;
					},
				},
			],
		]);
	function s(t, n = self) {
		n.addEventListener('message', function r(i) {
			if (!i || !i.data) return;
			const { id: c, type: u, path: d } = Object.assign({ path: [] }, i.data),
				l = (i.data.argumentList || []).map(h);
			let f;
			try {
				const n = d.slice(0, -1).reduce((e, t) => e[t], t),
					a = d.reduce((e, t) => e[t], t);
				switch (u) {
					case 'GET':
						f = a;
						break;
					case 'SET':
						(n[d.slice(-1)[0]] = h(i.data.value)), (f = !0);
						break;
					case 'APPLY':
						f = a.apply(n, l);
						break;
					case 'CONSTRUCT':
						f = (function (t) {
							return Object.assign(t, { [e]: !0 });
						})(new a(...l));
						break;
					case 'ENDPOINT':
						{
							const { port1: e, port2: n } = new MessageChannel();
							s(t, n),
								(f = (function (e, t) {
									return p.set(e, t), e;
								})(e, [e]));
						}
						break;
					case 'RELEASE':
						f = void 0;
						break;
					default:
						return;
				}
			} catch (e) {
				f = { value: e, [a]: 0 };
			}
			Promise.resolve(f)
				.catch((e) => ({ value: e, [a]: 0 }))
				.then((e) => {
					const [t, a] = m(e);
					n.postMessage(Object.assign(Object.assign({}, t), { id: c }), a),
						'RELEASE' === u && (n.removeEventListener('message', r), o(n));
				});
		}),
			n.start && n.start();
	}
	function o(e) {
		(function (e) {
			return 'MessagePort' === e.constructor.name;
		})(e) && e.close();
	}
	function c(e, t) {
		return d(e, [], t);
	}
	function u(e) {
		if (e) throw new Error('Proxy has been released and is not useable');
	}
	function d(e, a = [], r = function () {}) {
		let i = !1;
		const s = new Proxy(r, {
			get(t, r) {
				if ((u(i), r === n))
					return () =>
						f(e, { type: 'RELEASE', path: a.map((e) => e.toString()) }).then(
							() => {
								o(e), (i = !0);
							}
						);
				if ('then' === r) {
					if (0 === a.length) return { then: () => s };
					const t = f(e, {
						type: 'GET',
						path: a.map((e) => e.toString()),
					}).then(h);
					return t.then.bind(t);
				}
				return d(e, [...a, r]);
			},
			set(t, n, r) {
				u(i);
				const [s, o] = m(r);
				return f(
					e,
					{ type: 'SET', path: [...a, n].map((e) => e.toString()), value: s },
					o
				).then(h);
			},
			apply(n, r, s) {
				u(i);
				const o = a[a.length - 1];
				if (o === t) return f(e, { type: 'ENDPOINT' }).then(h);
				if ('bind' === o) return d(e, a.slice(0, -1));
				const [c, p] = l(s);
				return f(
					e,
					{ type: 'APPLY', path: a.map((e) => e.toString()), argumentList: c },
					p
				).then(h);
			},
			construct(t, n) {
				u(i);
				const [r, s] = l(n);
				return f(
					e,
					{
						type: 'CONSTRUCT',
						path: a.map((e) => e.toString()),
						argumentList: r,
					},
					s
				).then(h);
			},
		});
		return s;
	}
	function l(e) {
		const t = e.map(m);
		return [
			t.map((e) => e[0]),
			((n = t.map((e) => e[1])), Array.prototype.concat.apply([], n)),
		];
		var n;
	}
	const p = new WeakMap();
	function m(e) {
		for (const [t, n] of i)
			if (n.canHandle(e)) {
				const [a, r] = n.serialize(e);
				return [{ type: 'HANDLER', name: t, value: a }, r];
			}
		return [{ type: 'RAW', value: e }, p.get(e) || []];
	}
	function h(e) {
		switch (e.type) {
			case 'HANDLER':
				return i.get(e.name).deserialize(e.value);
			case 'RAW':
				return e.value;
		}
	}
	function f(e, t, n) {
		return new Promise((a) => {
			const r = new Array(4)
				.fill(0)
				.map(() =>
					Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(16)
				)
				.join('-');
			e.addEventListener('message', function t(n) {
				n.data &&
					n.data.id &&
					n.data.id === r &&
					(e.removeEventListener('message', t), a(n.data));
			}),
				e.start && e.start(),
				e.postMessage(Object.assign({ id: r }, t), n);
		});
	}
	class y {
		constructor() {
			throw new Error('This is a static class');
		}
		static isOptionValid(e) {
			return (
				!!location.search.slice(1).split('&').contains(e) ||
				!!(
					'undefined' != typeof nw &&
					nw.App.argv.length > 0 &&
					nw.App.argv[0].split('&').contains(e)
				)
			);
		}
		static isNwjs() {
			if ('boolean' == typeof y._nwjs) return y._nwjs;
			const e = 'function' == typeof require && 'object' == typeof process;
			return (y._nwjs = e), e;
		}
		static isTauri() {
			return !!window.__TAURI__;
		}
		static isHighFps() {
			return y._fpsChecked ? y._highFps : y.getFps() >= 66;
		}
		/**
		 * Returns estimated monitor refresh rate.
		 *
		 * @static
		 * @method getFps
		 * @return {Number} Refresh rate
		 * @credit Adapted from Adam Sassano on Stack Overflow
		 * @license CC BY-SA 4.0
		 */ static getFps() {
			if (y._fpsChecked || y._fpsIsBusyCounting) return y._fps;
			{
				let e = 0,
					t = 0,
					n = 0;
				const a = (r) => {
					t <= 180
						? (t++, (n += 1e3 / (r - e)), (e = r), requestAnimationFrame(a))
						: (y._fps !== 1 / 0 &&
								((y._fps = n / t), y._fps >= 66 && (y._highFps = !0)),
						  (y._fpsChecked = !0),
						  (y._fpsIsBusyCounting = !1));
				};
				return (
					requestAnimationFrame((t) => {
						(e = t), requestAnimationFrame(a);
					}),
					(y._fpsIsBusyCounting = !0),
					y._fps
				);
			}
		}
		static isMobileDevice() {
			if ('boolean' == typeof y._mobileDevice) return y._mobileDevice;
			const e = !!navigator.userAgent.match(
				/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i
			);
			return (y._mobileDevice = e), e;
		}
		static isMobileSafari() {
			if ('boolean' == typeof y._mobileSafari) return y._mobileSafari;
			const e = navigator.userAgent,
				t = !(
					!e.match(/iPhone|iPad|iPod/) ||
					!e.match(/AppleWebKit/) ||
					e.match('CriOS')
				);
			return (y._mobileSafari = t), t;
		}
		static isAndroidChrome() {
			if ('boolean' == typeof y._androidChrome) return y._androidChrome;
			const e = navigator.userAgent,
				t = !(!e.match(/Android/) || !e.match(/Chrome/));
			return (y._androidChrome = t), t;
		}
		static canReadGameFiles() {
			const e = document.getElementsByTagName('script'),
				t = e[e.length - 1],
				n = new XMLHttpRequest();
			try {
				return (
					n.open('GET', t.src),
					n.overrideMimeType('text/javascript'),
					n.send(),
					!0
				);
			} catch (e) {
				return !1;
			}
		}
		static rgbToCssColor(e, t, n) {
			return `rgb(${(e = Math.round(e))},${(t = Math.round(t))},${(n =
				Math.round(n))})`;
		}
		static generateRuntimeId() {
			return y._id++;
		}
		static isSupportPassiveEvent() {
			if ('boolean' == typeof y._supportPassiveEvent)
				return y._supportPassiveEvent;
			let e = !1;
			const t = Object.defineProperty({}, 'passive', {
				get() {
					e = !0;
				},
			});
			return (
				window.addEventListener('test', null, t),
				(y._supportPassiveEvent = e),
				e
			);
		}
		static isWorker() {
			return 'function' == typeof importScripts;
		}
		static loadScript(e, t) {
			if (this.isWorker()) return importScripts(e), null;
			{
				const n = document.createElement('script');
				return (
					(n.type = t ? 'module' : 'text/javascript'),
					(n.src = e),
					(n.async = !1),
					document.body.appendChild(n),
					n
				);
			}
		}
		static getThrottledFunction(e, t, n) {
			let a, r;
			return function () {
				const i = n || this,
					s = +new Date(),
					o = arguments;
				a && s < a + t
					? (clearTimeout(r),
					  (r = setTimeout(() => {
							(a = s), e.apply(i, o);
					  }, t + a - s)))
					: ((a = s), e.apply(i, o));
			};
		}
	}
	(y.RPGMAKER_NAME = 'MV'),
		(y.RPGMAKER_VERSION = '1.6.1'),
		(y.RPGMAKER_ENGINE = 'community-1.4'),
		(y._nwjs = null),
		(y._highFps = !1),
		(y._fps = 60),
		(y._fpsIsBusyCounting = !1),
		(y._fpsChecked = !1),
		(y._mobileDevice = null),
		(y._mobileSafari = null),
		(y._androidChrome = null),
		(y._id = 1),
		(y._supportPassiveEvent = null),
		class {
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
			static async attachListeners(e) {
				const t = y.isSupportPassiveEvent(),
					n = 33.34;
				document.addEventListener('keydown', (t) =>
					e.receiveEvent('keydown', {
						key: t.key,
						code: t.code,
						altKey: t.altKey,
						charCode: t.charCode,
						ctrlKey: t.ctrlKey,
						keyCode: t.keyCode,
						shiftKey: t.shiftKey,
					})
				),
					document.addEventListener('keyup', (t) =>
						e.receiveEvent('keyup', {
							key: t.key,
							code: t.code,
							altKey: t.altKey,
							charCode: t.charCode,
							ctrlKey: t.ctrlKey,
							keyCode: t.keyCode,
							shiftKey: t.shiftKey,
						})
					),
					document.addEventListener('mousedown', (t) =>
						e.receiveEvent('mousedown', {
							clientX: t.clientX,
							clientY: t.clientY,
							button: t.button,
							layerX: t.layerX,
							layerY: t.layerY,
							offsetX: t.offsetX,
							offsetY: t.offsetY,
							pageX: t.pageX,
							pageY: t.pageY,
							screenX: t.screenX,
							screenY: t.screenY,
							timeStamp: t.timeStamp,
							x: t.x,
							y: t.y,
						})
					),
					document.addEventListener('mouseup', (t) =>
						e.receiveEvent('mouseup', {
							clientX: t.clientX,
							clientY: t.clientY,
							button: t.button,
							layerX: t.layerX,
							layerY: t.layerY,
							offsetX: t.offsetX,
							offsetY: t.offsetY,
							pageX: t.pageX,
							pageY: t.pageY,
							screenX: t.screenX,
							screenY: t.screenY,
							timeStamp: t.timeStamp,
							x: t.x,
							y: t.y,
						})
					);
				const a = y.getThrottledFunction(
					(t) =>
						e.receiveEvent('mousemove', {
							clientX: t.clientX,
							clientY: t.clientY,
							button: t.button,
							layerX: t.layerX,
							layerY: t.layerY,
							offsetX: t.offsetX,
							offsetY: t.offsetY,
							pageX: t.pageX,
							pageY: t.pageY,
							screenX: t.screenX,
							screenY: t.screenY,
							timeStamp: t.timeStamp,
							x: t.x,
							y: t.y,
						}),
					n
				);
				document.addEventListener('mousemove', (e) => a(e));
				const r = y.getThrottledFunction(
					(t) =>
						e.receiveEvent('wheel', {
							deltaX: t.deltaX,
							deltaY: t.deltaY,
							deltaZ: t.deltaZ,
						}),
					n
				);
				document.addEventListener('wheel', (e) => r(e), !!t && { passive: !1 }),
					document.addEventListener('touchend', (t) =>
						e.receiveEvent('touchend', {
							changedTouches: JSON.stringify(t.changedTouches),
							timeStamp: t.timeStamp,
							touches: JSON.stringify(t.touches),
						})
					),
					document.addEventListener(
						'touchstart',
						(t) =>
							e.receiveEvent('touchstart', {
								changedTouches: JSON.stringify(t.changedTouches),
								timeStamp: t.timeStamp,
								touches: JSON.stringify(t.touches),
							}),
						!!t && { passive: !1 }
					);
				const i = y.getThrottledFunction(
					(t) =>
						e.receiveEvent('touchmove', {
							changedTouches: JSON.stringify(t.changedTouches),
							timeStamp: t.timeStamp,
							touches: JSON.stringify(t.touches),
						}),
					n
				);
				document.addEventListener(
					'touchmove',
					(e) => i(e),
					!!t && { passive: !1 }
				),
					document.addEventListener('touchcancel', (t) =>
						e.receiveEvent('touchcancel', {})
					),
					document.addEventListener('pointerdown', (t) =>
						e.receiveEvent('pointerdown', {
							clientX: t.clientX,
							clientY: t.clientY,
							button: t.button,
							layerX: t.layerX,
							layerY: t.layerY,
							offsetX: t.offsetX,
							offsetY: t.offsetY,
							pageX: t.pageX,
							pageY: t.pageY,
							screenX: t.screenX,
							screenY: t.screenY,
							timeStamp: t.timeStamp,
							x: t.x,
							y: t.y,
						})
					),
					document.addEventListener('visibilitychange', (t) =>
						e.receiveEvent('visibilitychange', { timeStamp: t.timeStamp })
					);
				const s = y.getThrottledFunction(
					(t) =>
						e.receiveEvent('resize', {
							innerWidth: window.innerWidth,
							innerHeight: window.innerHeight,
							timeStamp: t.timeStamp,
						}),
					n
				);
				window.addEventListener('resize', (e) => s(e)),
					window.addEventListener('blur', (t) =>
						e.receiveEvent('blur', { timeStamp: t.timeStamp })
					),
					window.addEventListener('error', (t) =>
						e.receiveEvent('error', {
							timeStamp: t.timeStamp,
							message: t.message,
							filename: t.filename,
						})
					);
			}
			static async transferWindowData(e) {
				const t = this.getWindowData();
				await e.updateData('window', { data: t });
			}
			static async transferPluginData(e) {
				await e.updateData('plugins', { data: $plugins });
			}
			static async setupDataThread() {
				const e = new Worker('js/Data_Thread.js', { type: 'module' }),
					t = await c(e);
				await t.start(), (window.Data_Thread = t);
			}
			static async setupRenderThread() {
				y.loadScript('js/Render_Thread.js', !0);
			}
			static async start() {
				return await this.setupDataThread(), await this.setupRenderThread(), !0;
			}
		}.start();
})();
