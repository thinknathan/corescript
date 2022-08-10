/*!
 * Data_Thread.js - corescript v1.6.1 (community-1.4)
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
		r = Symbol('Comlink.endpoint'),
		t = Symbol('Comlink.releaseProxy'),
		n = Symbol('Comlink.thrown'),
		a = (e) => ('object' == typeof e && null !== e) || 'function' == typeof e,
		s = new Map([
			[
				'proxy',
				{
					canHandle: (r) => a(r) && r[e],
					serialize(e) {
						const { port1: r, port2: t } = new MessageChannel();
						return i(e, r), [t, [t]];
					},
					deserialize: (e) => (e.start(), u(e, [], undefined)),
				},
			],
			[
				'throw',
				{
					canHandle: (e) => a(e) && n in e,
					serialize({ value: e }) {
						let r;
						return (
							(r =
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
							[r, []]
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
	function i(r, t = self) {
		t.addEventListener('message', function a(s) {
			if (!s || !s.data) return;
			const { id: c, type: u, path: l } = Object.assign({ path: [] }, s.data),
				d = (s.data.argumentList || []).map(v);
			let w;
			try {
				const t = l.slice(0, -1).reduce((e, r) => e[r], r),
					n = l.reduce((e, r) => e[r], r);
				switch (u) {
					case 'GET':
						w = n;
						break;
					case 'SET':
						(t[l.slice(-1)[0]] = v(s.data.value)), (w = !0);
						break;
					case 'APPLY':
						w = n.apply(t, d);
						break;
					case 'CONSTRUCT':
						w = (function (r) {
							return Object.assign(r, { [e]: !0 });
						})(new n(...d));
						break;
					case 'ENDPOINT':
						{
							const { port1: e, port2: t } = new MessageChannel();
							i(r, t),
								(w = (function (e, r) {
									return f.set(e, r), e;
								})(e, [e]));
						}
						break;
					case 'RELEASE':
						w = void 0;
						break;
					default:
						return;
				}
			} catch (e) {
				w = { value: e, [n]: 0 };
			}
			Promise.resolve(w)
				.catch((e) => ({ value: e, [n]: 0 }))
				.then((e) => {
					const [r, n] = h(e);
					t.postMessage(Object.assign(Object.assign({}, r), { id: c }), n),
						'RELEASE' === u && (t.removeEventListener('message', a), o(t));
				});
		}),
			t.start && t.start();
	}
	function o(e) {
		(function (e) {
			return 'MessagePort' === e.constructor.name;
		})(e) && e.close();
	}
	function c(e) {
		if (e) throw new Error('Proxy has been released and is not useable');
	}
	function u(e, n = [], a = function () {}) {
		let s = !1;
		const i = new Proxy(a, {
			get(r, a) {
				if ((c(s), a === t))
					return () =>
						d(e, { type: 'RELEASE', path: n.map((e) => e.toString()) }).then(
							() => {
								o(e), (s = !0);
							}
						);
				if ('then' === a) {
					if (0 === n.length) return { then: () => i };
					const r = d(e, {
						type: 'GET',
						path: n.map((e) => e.toString()),
					}).then(v);
					return r.then.bind(r);
				}
				return u(e, [...n, a]);
			},
			set(r, t, a) {
				c(s);
				const [i, o] = h(a);
				return d(
					e,
					{ type: 'SET', path: [...n, t].map((e) => e.toString()), value: i },
					o
				).then(v);
			},
			apply(t, a, i) {
				c(s);
				const o = n[n.length - 1];
				if (o === r) return d(e, { type: 'ENDPOINT' }).then(v);
				if ('bind' === o) return u(e, n.slice(0, -1));
				const [f, h] = l(i);
				return d(
					e,
					{ type: 'APPLY', path: n.map((e) => e.toString()), argumentList: f },
					h
				).then(v);
			},
			construct(r, t) {
				c(s);
				const [a, i] = l(t);
				return d(
					e,
					{
						type: 'CONSTRUCT',
						path: n.map((e) => e.toString()),
						argumentList: a,
					},
					i
				).then(v);
			},
		});
		return i;
	}
	function l(e) {
		const r = e.map(h);
		return [
			r.map((e) => e[0]),
			((t = r.map((e) => e[1])), Array.prototype.concat.apply([], t)),
		];
		var t;
	}
	const f = new WeakMap();
	function h(e) {
		for (const [r, t] of s)
			if (t.canHandle(e)) {
				const [n, a] = t.serialize(e);
				return [{ type: 'HANDLER', name: r, value: n }, a];
			}
		return [{ type: 'RAW', value: e }, f.get(e) || []];
	}
	function v(e) {
		switch (e.type) {
			case 'HANDLER':
				return s.get(e.name).deserialize(e.value);
			case 'RAW':
				return e.value;
		}
	}
	function d(e, r, t) {
		return new Promise((n) => {
			const a = new Array(4)
				.fill(0)
				.map(() =>
					Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(16)
				)
				.join('-');
			e.addEventListener('message', function r(t) {
				t.data &&
					t.data.id &&
					t.data.id === a &&
					(e.removeEventListener('message', r), n(t.data));
			}),
				e.start && e.start(),
				e.postMessage(Object.assign({ id: a }, r), t);
		});
	}
	var w = Uint8Array,
		g = Uint16Array,
		p = Uint32Array,
		y = new w([
			0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5,
			5, 5, 5, 0, 0, 0, 0,
		]),
		m = new w([
			0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10,
			11, 11, 12, 12, 13, 13, 0, 0,
		]),
		b = new w([
			16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15,
		]),
		k = function (e, r) {
			for (var t = new g(31), n = 0; n < 31; ++n) t[n] = r += 1 << e[n - 1];
			var a = new p(t[30]);
			for (n = 1; n < 30; ++n)
				for (var s = t[n]; s < t[n + 1]; ++s) a[s] = ((s - t[n]) << 5) | n;
			return [t, a];
		},
		E = k(y, 2),
		C = E[0],
		S = E[1];
	(C[28] = 258), (S[258] = 28);
	for (
		var M = k(m, 0), T = M[0], A = M[1], x = new g(32768), L = 0;
		L < 32768;
		++L
	) {
		var P = ((43690 & L) >>> 1) | ((21845 & L) << 1);
		(P =
			((61680 & (P = ((52428 & P) >>> 2) | ((13107 & P) << 2))) >>> 4) |
			((3855 & P) << 4)),
			(x[L] = (((65280 & P) >>> 8) | ((255 & P) << 8)) >>> 1);
	}
	var K = function (e, r, t) {
			for (var n = e.length, a = 0, s = new g(r); a < n; ++a)
				e[a] && ++s[e[a] - 1];
			var i,
				o = new g(r);
			for (a = 0; a < r; ++a) o[a] = (o[a - 1] + s[a - 1]) << 1;
			if (t) {
				i = new g(1 << r);
				var c = 15 - r;
				for (a = 0; a < n; ++a)
					if (e[a])
						for (
							var u = (a << 4) | e[a],
								l = r - e[a],
								f = o[e[a] - 1]++ << l,
								h = f | ((1 << l) - 1);
							f <= h;
							++f
						)
							i[x[f] >>> c] = u;
			} else
				for (i = new g(n), a = 0; a < n; ++a)
					e[a] && (i[a] = x[o[e[a] - 1]++] >>> (15 - e[a]));
			return i;
		},
		N = new w(288);
	for (L = 0; L < 144; ++L) N[L] = 8;
	for (L = 144; L < 256; ++L) N[L] = 9;
	for (L = 256; L < 280; ++L) N[L] = 7;
	for (L = 280; L < 288; ++L) N[L] = 8;
	var O = new w(32);
	for (L = 0; L < 32; ++L) O[L] = 5;
	var R = K(N, 9, 0),
		j = K(N, 9, 1),
		B = K(O, 5, 0),
		z = K(O, 5, 1),
		D = function (e) {
			for (var r = e[0], t = 1; t < e.length; ++t) e[t] > r && (r = e[t]);
			return r;
		},
		U = function (e, r, t) {
			var n = (r / 8) | 0;
			return ((e[n] | (e[n + 1] << 8)) >> (7 & r)) & t;
		},
		_ = function (e, r) {
			var t = (r / 8) | 0;
			return (e[t] | (e[t + 1] << 8) | (e[t + 2] << 16)) >> (7 & r);
		},
		H = function (e) {
			return ((e + 7) / 8) | 0;
		},
		F = function (e, r, t) {
			(null == r || r < 0) && (r = 0),
				(null == t || t > e.length) && (t = e.length);
			var n = new (
				2 == e.BYTES_PER_ELEMENT ? g : 4 == e.BYTES_PER_ELEMENT ? p : w
			)(t - r);
			return n.set(e.subarray(r, t)), n;
		},
		G = [
			'unexpected EOF',
			'invalid block type',
			'invalid length/literal',
			'invalid distance',
			'stream finished',
			'no stream handler',
			,
			'no callback',
			'invalid UTF-8 data',
			'extra field too long',
			'date not in range 1980-2099',
			'filename too long',
			'stream finishing',
			'invalid zip data',
		],
		Y = function (e, r, t) {
			var n = new Error(r || G[e]);
			if (
				((n.code = e),
				Error.captureStackTrace && Error.captureStackTrace(n, Y),
				!t)
			)
				throw n;
			return n;
		},
		I = function (e, r, t) {
			t <<= 7 & r;
			var n = (r / 8) | 0;
			(e[n] |= t), (e[n + 1] |= t >>> 8);
		},
		W = function (e, r, t) {
			t <<= 7 & r;
			var n = (r / 8) | 0;
			(e[n] |= t), (e[n + 1] |= t >>> 8), (e[n + 2] |= t >>> 16);
		},
		X = function (e, r) {
			for (var t = [], n = 0; n < e.length; ++n)
				e[n] && t.push({ s: n, f: e[n] });
			var a = t.length,
				s = t.slice();
			if (!a) return [ee, 0];
			if (1 == a) {
				var i = new w(t[0].s + 1);
				return (i[t[0].s] = 1), [i, 1];
			}
			t.sort(function (e, r) {
				return e.f - r.f;
			}),
				t.push({ s: -1, f: 25001 });
			var o = t[0],
				c = t[1],
				u = 0,
				l = 1,
				f = 2;
			for (t[0] = { s: -1, f: o.f + c.f, l: o, r: c }; l != a - 1; )
				(o = t[t[u].f < t[f].f ? u++ : f++]),
					(c = t[u != l && t[u].f < t[f].f ? u++ : f++]),
					(t[l++] = { s: -1, f: o.f + c.f, l: o, r: c });
			var h = s[0].s;
			for (n = 1; n < a; ++n) s[n].s > h && (h = s[n].s);
			var v = new g(h + 1),
				d = q(t[l - 1], v, 0);
			if (d > r) {
				n = 0;
				var p = 0,
					y = d - r,
					m = 1 << y;
				for (
					s.sort(function (e, r) {
						return v[r.s] - v[e.s] || e.f - r.f;
					});
					n < a;
					++n
				) {
					var b = s[n].s;
					if (!(v[b] > r)) break;
					(p += m - (1 << (d - v[b]))), (v[b] = r);
				}
				for (p >>>= y; p > 0; ) {
					var k = s[n].s;
					v[k] < r ? (p -= 1 << (r - v[k]++ - 1)) : ++n;
				}
				for (; n >= 0 && p; --n) {
					var E = s[n].s;
					v[E] == r && (--v[E], ++p);
				}
				d = r;
			}
			return [new w(v), d];
		},
		q = function (e, r, t) {
			return -1 == e.s
				? Math.max(q(e.l, r, t + 1), q(e.r, r, t + 1))
				: (r[e.s] = t);
		},
		J = function (e) {
			for (var r = e.length; r && !e[--r]; );
			for (
				var t = new g(++r),
					n = 0,
					a = e[0],
					s = 1,
					i = function (e) {
						t[n++] = e;
					},
					o = 1;
				o <= r;
				++o
			)
				if (e[o] == a && o != r) ++s;
				else {
					if (!a && s > 2) {
						for (; s > 138; s -= 138) i(32754);
						s > 2 &&
							(i(s > 10 ? ((s - 11) << 5) | 28690 : ((s - 3) << 5) | 12305),
							(s = 0));
					} else if (s > 3) {
						for (i(a), --s; s > 6; s -= 6) i(8304);
						s > 2 && (i(((s - 3) << 5) | 8208), (s = 0));
					}
					for (; s--; ) i(a);
					(s = 1), (a = e[o]);
				}
			return [t.subarray(0, n), r];
		},
		Q = function (e, r) {
			for (var t = 0, n = 0; n < r.length; ++n) t += e[n] * r[n];
			return t;
		},
		V = function (e, r, t) {
			var n = t.length,
				a = H(r + 2);
			(e[a] = 255 & n),
				(e[a + 1] = n >>> 8),
				(e[a + 2] = 255 ^ e[a]),
				(e[a + 3] = 255 ^ e[a + 1]);
			for (var s = 0; s < n; ++s) e[a + s + 4] = t[s];
			return 8 * (a + 4 + n);
		},
		Z = function (e, r, t, n, a, s, i, o, c, u, l) {
			I(r, l++, t), ++a[256];
			for (
				var f = X(a, 15),
					h = f[0],
					v = f[1],
					d = X(s, 15),
					w = d[0],
					p = d[1],
					k = J(h),
					E = k[0],
					C = k[1],
					S = J(w),
					M = S[0],
					T = S[1],
					A = new g(19),
					x = 0;
				x < E.length;
				++x
			)
				A[31 & E[x]]++;
			for (x = 0; x < M.length; ++x) A[31 & M[x]]++;
			for (
				var L = X(A, 7), P = L[0], j = L[1], z = 19;
				z > 4 && !P[b[z - 1]];
				--z
			);
			var D,
				U,
				_,
				H,
				F = (u + 5) << 3,
				G = Q(a, N) + Q(s, O) + i,
				Y =
					Q(a, h) +
					Q(s, w) +
					i +
					14 +
					3 * z +
					Q(A, P) +
					(2 * A[16] + 3 * A[17] + 7 * A[18]);
			if (F <= G && F <= Y) return V(r, l, e.subarray(c, c + u));
			if ((I(r, l, 1 + (Y < G)), (l += 2), Y < G)) {
				(D = K(h, v, 0)), (U = h), (_ = K(w, p, 0)), (H = w);
				var q = K(P, j, 0);
				for (
					I(r, l, C - 257),
						I(r, l + 5, T - 1),
						I(r, l + 10, z - 4),
						l += 14,
						x = 0;
					x < z;
					++x
				)
					I(r, l + 3 * x, P[b[x]]);
				l += 3 * z;
				for (var Z = [E, M], $ = 0; $ < 2; ++$) {
					var ee = Z[$];
					for (x = 0; x < ee.length; ++x) {
						var re = 31 & ee[x];
						I(r, l, q[re]),
							(l += P[re]),
							re > 15 && (I(r, l, (ee[x] >>> 5) & 127), (l += ee[x] >>> 12));
					}
				}
			} else (D = R), (U = N), (_ = B), (H = O);
			for (x = 0; x < o; ++x)
				if (n[x] > 255) {
					(re = (n[x] >>> 18) & 31),
						W(r, l, D[re + 257]),
						(l += U[re + 257]),
						re > 7 && (I(r, l, (n[x] >>> 23) & 31), (l += y[re]));
					var te = 31 & n[x];
					W(r, l, _[te]),
						(l += H[te]),
						te > 3 && (W(r, l, (n[x] >>> 5) & 8191), (l += m[te]));
				} else W(r, l, D[n[x]]), (l += U[n[x]]);
			return W(r, l, D[256]), l + U[256];
		},
		$ = new p([
			65540, 131080, 131088, 131104, 262176, 1048704, 1048832, 2114560, 2117632,
		]),
		ee = new w(0);
	var re = 'undefined' != typeof TextEncoder && new TextEncoder(),
		te = 'undefined' != typeof TextDecoder && new TextDecoder();
	try {
		te.decode(ee, { stream: !0 });
	} catch (e) {}
	function ne(e) {
		return new Promise((r, t) => {
			(e.oncomplete = e.onsuccess = () => r(e.result)),
				(e.onabort = e.onerror = () => t(e.error));
		});
	}
	let ae;
	function se() {
		return (
			ae ||
				(ae = (function (e, r) {
					const t = indexedDB.open('keyval-store');
					t.onupgradeneeded = () => t.result.createObjectStore(r);
					const n = ne(t);
					return (e, t) => n.then((n) => t(n.transaction(r, e).objectStore(r)));
				})(0, 'keyval')),
			ae
		);
	}
	function ie(e, r = se()) {
		return r('readonly', (r) => ne(r.get(e)));
	}
	function oe(e, r, t = se()) {
		return t('readwrite', (t) => (t.put(r, e), ne(t.transaction)));
	}
	function ce(e, r = se()) {
		return r('readwrite', (r) => (r.delete(e), ne(r.transaction)));
	}
	function ue(e = se()) {
		return e('readonly', (e) => {
			if (e.getAllKeys) return ne(e.getAllKeys());
			const r = [];
			return (function (e, t) {
				return (
					(e.openCursor().onsuccess = function () {
						var e;
						this.result &&
							((e = this.result), r.push(e.key), this.result.continue());
					}),
					ne(e.transaction)
				);
			})(e).then(() => r);
		});
	}
	class le {
		constructor() {
			throw new Error('This is a static class');
		}
		static successCallback() {
			return !0;
		}
		static failureCallback(e) {
			return !1;
		}
		static async compress(e) {
			if (!e) return null;
			try {
				const r = (function (e, r) {
					var t;
					if (re) return re.encode(e);
					var n = e.length,
						a = new w(e.length + (e.length >> 1)),
						s = 0,
						i = function (e) {
							a[s++] = e;
						};
					for (t = 0; t < n; ++t) {
						if (s + 5 > a.length) {
							var o = new w(s + 8 + ((n - t) << 1));
							o.set(a), (a = o);
						}
						var c = e.charCodeAt(t);
						c < 128
							? i(c)
							: c < 2048
							? (i(192 | (c >> 6)), i(128 | (63 & c)))
							: c > 55295 && c < 57344
							? (i(
									240 |
										((c =
											(65536 + (1047552 & c)) | (1023 & e.charCodeAt(++t))) >>
											18)
							  ),
							  i(128 | ((c >> 12) & 63)),
							  i(128 | ((c >> 6) & 63)),
							  i(128 | (63 & c)))
							: (i(224 | (c >> 12)),
							  i(128 | ((c >> 6) & 63)),
							  i(128 | (63 & c)));
					}
					return F(a, 0, s);
				})(e);
				return (function (e, r) {
					return (
						(a = 0),
						(s = 0),
						(function (e, r, t, n, a, s) {
							var i = e.length,
								o = new w(n + i + 5 * (1 + Math.ceil(i / 7e3)) + a),
								c = o.subarray(n, o.length - a),
								u = 0;
							if (!r || i < 8)
								for (var l = 0; l <= i; l += 65535) {
									var f = l + 65535;
									f >= i && (c[u >> 3] = s),
										(u = V(c, u + 1, e.subarray(l, f)));
								}
							else {
								for (
									var h = $[r - 1],
										v = h >>> 13,
										d = 8191 & h,
										b = (1 << t) - 1,
										k = new g(32768),
										E = new g(b + 1),
										C = Math.ceil(t / 3),
										M = 2 * C,
										T = function (r) {
											return (e[r] ^ (e[r + 1] << C) ^ (e[r + 2] << M)) & b;
										},
										x = new p(25e3),
										L = new g(288),
										P = new g(32),
										K = 0,
										N = 0,
										O = ((l = 0), 0),
										R = 0,
										j = 0;
									l < i;
									++l
								) {
									var B = T(l),
										z = 32767 & l,
										D = E[B];
									if (((k[z] = D), (E[B] = z), R <= l)) {
										var U = i - l;
										if ((K > 7e3 || O > 24576) && U > 423) {
											(u = Z(e, c, 0, x, L, P, N, O, j, l - j, u)),
												(O = K = N = 0),
												(j = l);
											for (var _ = 0; _ < 286; ++_) L[_] = 0;
											for (_ = 0; _ < 30; ++_) P[_] = 0;
										}
										var G = 2,
											Y = 0,
											I = d,
											W = (z - D) & 32767;
										if (U > 2 && B == T(l - W))
											for (
												var X = Math.min(v, U) - 1,
													q = Math.min(32767, l),
													J = Math.min(258, U);
												W <= q && --I && z != D;

											) {
												if (e[l + G] == e[l + G - W]) {
													for (
														var Q = 0;
														Q < J && e[l + Q] == e[l + Q - W];
														++Q
													);
													if (Q > G) {
														if (((G = Q), (Y = W), Q > X)) break;
														var re = Math.min(W, Q - 2),
															te = 0;
														for (_ = 0; _ < re; ++_) {
															var ne = (l - W + _ + 32768) & 32767,
																ae = (ne - k[ne] + 32768) & 32767;
															ae > te && ((te = ae), (D = ne));
														}
													}
												}
												W += ((z = D) - (D = k[z]) + 32768) & 32767;
											}
										if (Y) {
											x[O++] = 268435456 | (S[G] << 18) | A[Y];
											var se = 31 & S[G],
												ie = 31 & A[Y];
											(N += y[se] + m[ie]),
												++L[257 + se],
												++P[ie],
												(R = l + G),
												++K;
										} else (x[O++] = e[l]), ++L[e[l]];
									}
								}
								(u = Z(e, c, s, x, L, P, N, O, j, l - j, u)),
									!s && 7 & u && (u = V(c, u + 1, ee));
							}
							return F(o, 0, n + H(u) + a);
						})(
							(t = e),
							null == (n = { level: 1 } || {}).level ? 6 : n.level,
							null == n.mem
								? Math.ceil(1.5 * Math.max(8, Math.min(13, Math.log(t.length))))
								: 12 + n.mem,
							a,
							s,
							!i
						)
					);
					var t, n, a, s, i;
				})(r);
			} catch (e) {
				return null;
			}
		}
		static async decompress(e) {
			if (!e) return null;
			try {
				return (function (e, r) {
					if (r) {
						for (var t = '', n = 0; n < e.length; n += 16384)
							t += String.fromCharCode.apply(null, e.subarray(n, n + 16384));
						return t;
					}
					if (te) return te.decode(e);
					var a = (function (e) {
							for (var r = '', t = 0; ; ) {
								var n = e[t++],
									a = (n > 127) + (n > 223) + (n > 239);
								if (t + a > e.length) return [r, F(e, t - 1)];
								a
									? 3 == a
										? ((n =
												(((15 & n) << 18) |
													((63 & e[t++]) << 12) |
													((63 & e[t++]) << 6) |
													(63 & e[t++])) -
												65536),
										  (r += String.fromCharCode(
												55296 | (n >> 10),
												56320 | (1023 & n)
										  )))
										: (r +=
												1 & a
													? String.fromCharCode(((31 & n) << 6) | (63 & e[t++]))
													: String.fromCharCode(
															((15 & n) << 12) |
																((63 & e[t++]) << 6) |
																(63 & e[t++])
													  ))
									: (r += String.fromCharCode(n));
							}
						})(e),
						s = a[0];
					return a[1].length && Y(8), s;
				})(
					(function (e, r) {
						return (function (e, r, t) {
							var n = e.length;
							if (!n || (t && t.f && !t.l)) return r || new w(0);
							var a = !r || t,
								s = !t || t.i;
							t || (t = {}), r || (r = new w(3 * n));
							var i = function (e) {
									var t = r.length;
									if (e > t) {
										var n = new w(Math.max(2 * t, e));
										n.set(r), (r = n);
									}
								},
								o = t.f || 0,
								c = t.p || 0,
								u = t.b || 0,
								l = t.l,
								f = t.d,
								h = t.m,
								v = t.n,
								d = 8 * n;
							do {
								if (!l) {
									o = U(e, c, 1);
									var g = U(e, c + 1, 3);
									if (((c += 3), !g)) {
										var p = e[(R = H(c) + 4) - 4] | (e[R - 3] << 8),
											k = R + p;
										if (k > n) {
											s && Y(0);
											break;
										}
										a && i(u + p),
											r.set(e.subarray(R, k), u),
											(t.b = u += p),
											(t.p = c = 8 * k),
											(t.f = o);
										continue;
									}
									if (1 == g) (l = j), (f = z), (h = 9), (v = 5);
									else if (2 == g) {
										var E = U(e, c, 31) + 257,
											S = U(e, c + 10, 15) + 4,
											M = E + U(e, c + 5, 31) + 1;
										c += 14;
										for (var A = new w(M), x = new w(19), L = 0; L < S; ++L)
											x[b[L]] = U(e, c + 3 * L, 7);
										c += 3 * S;
										var P = D(x),
											N = (1 << P) - 1,
											O = K(x, P, 1);
										for (L = 0; L < M; ) {
											var R,
												B = O[U(e, c, N)];
											if (((c += 15 & B), (R = B >>> 4) < 16)) A[L++] = R;
											else {
												var G = 0,
													I = 0;
												for (
													16 == R
														? ((I = 3 + U(e, c, 3)), (c += 2), (G = A[L - 1]))
														: 17 == R
														? ((I = 3 + U(e, c, 7)), (c += 3))
														: 18 == R && ((I = 11 + U(e, c, 127)), (c += 7));
													I--;

												)
													A[L++] = G;
											}
										}
										var W = A.subarray(0, E),
											X = A.subarray(E);
										(h = D(W)), (v = D(X)), (l = K(W, h, 1)), (f = K(X, v, 1));
									} else Y(1);
									if (c > d) {
										s && Y(0);
										break;
									}
								}
								a && i(u + 131072);
								for (var q = (1 << h) - 1, J = (1 << v) - 1, Q = c; ; Q = c) {
									var V = (G = l[_(e, c) & q]) >>> 4;
									if ((c += 15 & G) > d) {
										s && Y(0);
										break;
									}
									if ((G || Y(2), V < 256)) r[u++] = V;
									else {
										if (256 == V) {
											(Q = c), (l = null);
											break;
										}
										var Z = V - 254;
										if (V > 264) {
											var $ = y[(L = V - 257)];
											(Z = U(e, c, (1 << $) - 1) + C[L]), (c += $);
										}
										var ee = f[_(e, c) & J],
											re = ee >>> 4;
										if (
											(ee || Y(3),
											(c += 15 & ee),
											(X = T[re]),
											re > 3 &&
												(($ = m[re]),
												(X += _(e, c) & ((1 << $) - 1)),
												(c += $)),
											c > d)
										) {
											s && Y(0);
											break;
										}
										a && i(u + 131072);
										for (var te = u + Z; u < te; u += 4)
											(r[u] = r[u - X]),
												(r[u + 1] = r[u + 1 - X]),
												(r[u + 2] = r[u + 2 - X]),
												(r[u + 3] = r[u + 3 - X]);
										u = te;
									}
								}
								(t.l = l),
									(t.p = Q),
									(t.b = u),
									(t.f = o),
									l && ((o = 1), (t.m = h), (t.d = f), (t.n = v));
							} while (!o);
							return u == r.length ? r : F(r, 0, u);
						})(e, r);
					})(e)
				);
			} catch (e) {
				return null;
			}
		}
		static storageKey(e, r) {
			return e < 0 ? r + ' Config' : 0 === e ? r + ' Global' : r + ' File' + e;
		}
		static async save(e, r, t) {
			const n = this.storageKey(e, t),
				a = await this.compress(r);
			return await oe(n, a)
				.then(this.successCallback)
				.catch(this.failureCallback);
		}
		static async load(e, r) {
			const t = this.storageKey(e, r),
				n = await ie(t).catch(this.failureCallback),
				a = await this.decompress(n);
			if (a) return a;
			if (e > 0) {
				const t = await this.loadBackup(e, r);
				return await this.restoreBackup(e, r), t;
			}
			return !1;
		}
		static async deleteSave(e, r) {
			const t = this.storageKey(e, r);
			return await ce(t).then(this.successCallback).catch(this.failureCallback);
		}
		static async saveExists(e, r) {
			const t = this.storageKey(e, r);
			return await ue().then(function (e) {
				return e.includes(t);
			});
		}
		static async restoreBackup(e, r) {
			const t = this.storageKey(e, r) + 'bak',
				n = await this.loadBackup(e, r);
			return (
				await this.save(e, n, r),
				await ce(t).then(this.successCallback).catch(this.failureCallback)
			);
		}
		static async backupSave(e, r) {
			const t = this.storageKey(e, r),
				n = t + 'bak',
				a = await ie(t).catch(this.failureCallback);
			return (
				!!a &&
				(await oe(n, a).then(this.successCallback).catch(this.failureCallback))
			);
		}
		static async loadBackup(e, r) {
			const t = this.storageKey(e, r) + 'bak',
				n = await ie(t);
			return await this.decompress(n);
		}
	}
	i(
		class {
			constructor() {
				throw new Error('This is a static class');
			}
			static async start() {}
			static async makeSave(e, r) {
				return { result: await le.save(r.id, r.data, r.webKey) };
			}
			static async loadSave(e, r) {
				return { result: await le.load(r.id, r.webKey) };
			}
			static async backupSave(e, r) {
				return { result: await le.backupSave(r.id, r.webKey) };
			}
			static async checkSaveExists(e, r) {
				return { result: await le.saveExists(r.id, r.webKey) };
			}
		}
	);
})();
