/**
 * gamestats-pixi v1.0.2
 * @copyright (c) 2019 Erik Sombroek
 * @license MIT
 */
function t(t, a) {
	for (var e = 0; e < a.length; e++) {
		var i = a[e];
		(i.enumerable = i.enumerable || !1),
			(i.configurable = !0),
			'value' in i && (i.writable = !0),
			Object.defineProperty(t, i.key, i);
	}
}
function a(t, a, e) {
	return (
		a in t
			? Object.defineProperty(t, a, {
					value: e,
					enumerable: !0,
					configurable: !0,
					writable: !0,
			  })
			: (t[a] = e),
		t
	);
}
var e = (function () {
	function e(t, a, i, s) {
		!(function (t, a) {
			if (!(t instanceof a))
				throw new TypeError('Cannot call a class as a function');
		})(this, e),
			(this.pixi = a),
			(this.main = t),
			(this.app = i),
			(this.hijackedGL = !1);
		(this.config = Object.assign(
			{
				maxMemorySize: 350,
				COLOR_MEM_TEXTURE: '#8ddcff',
				COLOR_MEM_BUFFER: '#ffd34d',
			},
			s
		)),
			(this.config.baseCanvasWidth = 100 * this.main.config.scale),
			(this.config.baseCanvasHeight = 80 * this.main.config.scale),
			(this.memGraph = {
				width: this.config.baseCanvasWidth,
				height: 0.38 * this.config.baseCanvasHeight,
				drawY: 0.5 * this.config.baseCanvasHeight,
				barWidth: this.config.baseCanvasWidth / this.main.config.maximumHistory,
			}),
			this.dom,
			this.canvas,
			this.ctx,
			(this.graphYOffset = 0),
			(this.tempDrawCalls = 0),
			(this.drawCalls = 0),
			(this.realGLDrawElements = null),
			this.init();
	}
	var i, s, h;
	return (
		(i = e),
		(s = [
			{
				key: 'init',
				value: function () {
					(this.canvas = document.createElement('canvas')),
						(this.ctx = this.canvas.getContext('2d')),
						(this.canvas.width = this.config.baseCanvasWidth),
						(this.canvas.height = this.config.baseCanvasHeight),
						(this.canvas.style.cssText = 'width:'
							.concat(
								this.config.baseCanvasWidth * this.main.config.scale,
								'px;height:'
							)
							.concat(
								this.config.baseCanvasHeight * this.main.config.scale,
								'px;background-color:'
							)
							.concat(this.main.config.COLOR_BG)),
						this.main.dom.appendChild(this.canvas),
						(this.update = this.update.bind(this)),
						this.update();
				},
			},
			{
				key: 'collectStats',
				value: function () {
					var t,
						e =
							(a((t = {}), this.pixi.FORMATS.RGB, 3),
							a(t, this.pixi.FORMATS.RGBA, 4),
							a(t, this.pixi.FORMATS.DEPTH_COMPONENT, 3),
							a(t, this.pixi.FORMATS.DEPTH_STENCIL, 4),
							a(t, this.pixi.FORMATS.ALPHA, 1),
							a(t, this.pixi.FORMATS.LUMINANCE, 1),
							a(t, this.pixi.FORMATS.LUMINANCE_ALPHA, 2),
							t),
						i = this.app.renderer.texture.managedTextures,
						s = this.app.renderer.geometry.managedGeometries,
						h = this.app.renderer.framebuffer.managedFramebuffers,
						n = 0;
					for (var r in i) {
						var l = i[r];
						n += l.width * l.height * e[l.format];
					}
					var c = 0;
					for (var f in s) {
						var o = s[f];
						o &&
							o.buffers.forEach((t) => {
								c += t.data.byteLength;
							});
					}
					return {
						count: {
							textures: i.length,
							buffers: Object.keys(s).length,
							renderTextures: h.length,
						},
						mem: { textures: n / 1048576, buffers: c / 1232896 },
					};
				},
			},
			{
				key: 'draw',
				value: function () {
					var t = this.collectStats();
					this.drawCounts(t.count), this.drawMem(t.mem);
				},
			},
			{
				key: 'formatNum',
				value: function (t) {
					return t < 1e3
						? t
						: t >= 1e3 && t < 1e6
						? +(t / 1e3).toFixed(1) + 'K'
						: t >= 1e6 && t < 1e9
						? +(t / 1e6).toFixed(1) + 'M'
						: +(t / 1e9).toFixed(1) + '?';
				},
			},
			{
				key: 'drawCounts',
				value: function (t) {
					var a = t.textures,
						e = t.buffers,
						i = t.renderTextures,
						s = this.ctx,
						h = this.config,
						n = this.main.config,
						r = 0.02 * h.baseCanvasHeight;
					s.clearRect(0, 0, s.canvas.width, 0.46 * s.canvas.height),
						(s.textAlign = 'left');
					var l = 0.09 * h.baseCanvasWidth;
					(s.font = ''.concat(l, 'px ').concat(n.FONT_FAMILY)),
						(s.textBaseline = 'top'),
						(s.fillStyle = n.COLOR_TEXT_LABEL),
						s.fillText('textures buffers render-t', 2 * r, r),
						(l = 0.09 * h.baseCanvasWidth),
						(s.font = ''.concat(l, 'px ').concat(n.FONT_FAMILY));
					var c = 0.2 * h.baseCanvasWidth,
						f = 0.1 * h.baseCanvasWidth;
					s.textAlign = 'right';
					var o = r + 0.33 * h.baseCanvasWidth;
					(s.fillStyle = n.COLOR_FPS_BAR),
						s.fillText(''.concat(this.formatNum(a)), o, f + r),
						(s.fillStyle = n.COLOR_FPS_BAR),
						s.fillText(''.concat(this.formatNum(e)), o + 1.51 * c, f + r),
						(s.fillStyle = n.COLOR_FPS_BAR),
						s.fillText(''.concat(this.formatNum(i)), o + 3.2 * c, f + r),
						(s.textAlign = 'left'),
						(s.fillStyle = n.COLOR_TEXT_LABEL),
						s.fillText('drawcalls', 2 * r, 0.21 * h.baseCanvasWidth),
						(s.textAlign = 'right'),
						(s.fillStyle = n.COLOR_FPS_BAR),
						s.fillText(
							''.concat(this.formatNum(this.drawCalls)),
							o + 4 * r,
							0.3 * h.baseCanvasWidth
						);
				},
			},
			{
				key: 'drawMem',
				value: function (t) {
					var a = t.textures,
						e = t.buffers,
						i = this.config,
						s = this.main.config,
						h = this.ctx,
						n = h.getImageData(
							1,
							0,
							h.canvas.width - this.memGraph.barWidth,
							h.canvas.height
						);
					h.putImageData(n, 0, 0),
						h.clearRect(
							h.canvas.width - this.memGraph.barWidth,
							0,
							this.memGraph.barWidth,
							h.canvas.height
						),
						this.drawMemGraph(a, i.COLOR_MEM_TEXTURE),
						this.drawMemGraph(e, i.COLOR_MEM_BUFFER, a),
						h.clearRect(
							0,
							0.87 * h.canvas.height,
							h.canvas.width,
							0.2 * h.canvas.height
						);
					var r = 0.01 * i.baseCanvasHeight;
					h.textAlign = 'left';
					var l = 0.09 * i.baseCanvasWidth;
					(h.textBaseline = 'top'),
						(h.font = ''.concat(l, 'px ').concat(s.FONT_FAMILY));
					var c = 0.2 * i.baseCanvasWidth,
						f = 0.88 * i.baseCanvasHeight;
					(h.fillStyle = i.COLOR_MEM_TEXTURE),
						h.fillText('mem-tex', r, f + r),
						(h.fillStyle = i.COLOR_MEM_BUFFER),
						h.fillText('mem-buf', 2.2 * c - 2 * r, f + r),
						(this.graphYOffset = 0);
				},
			},
			{
				key: 'drawMemGraph',
				value: function (t, a, e) {
					var i = this.config,
						s = this.main.config,
						h = this.ctx;
					e &&
						t + e > i.maxMemorySize &&
						(t = Math.max(0, i.maxMemorySize - e));
					var n = 0;
					this.graphYOffset && (n += this.graphYOffset);
					var r =
							s.maximumHistory * this.memGraph.barWidth -
							this.memGraph.barWidth,
						l = this.memGraph.drawY,
						c = this.memGraph.barWidth,
						f = Math.min(1, t / i.maxMemorySize) * this.memGraph.height;
					(l += this.memGraph.height - f - n),
						(h.globalAlpha = 0.5),
						(h.fillStyle = a),
						h.fillRect(r, l, c, f),
						(h.globalAlpha = 1),
						h.fillRect(r, l, c, c),
						(this.graphYOffset = (this.graphYOffset || 0) + f);
				},
			},
			{
				key: 'hijackGL',
				value: function () {
					(this.realGLDrawElements = this.app.renderer.gl.drawElements),
						(this.app.renderer.gl.drawElements =
							this.fakeGLdrawElements.bind(this)),
						(this.hijackedGL = !0);
				},
			},
			{
				key: 'fakeGLdrawElements',
				value: function (t, a, e, i) {
					this.tempDrawCalls++,
						this.realGLDrawElements.call(this.app.renderer.gl, t, a, e, i);
				},
			},
			{
				key: 'restoreGL',
				value: function () {
					(this.app.renderer.gl.drawElements = this.realGLDrawElements),
						(this.hijackedGL = !1);
				},
			},
			{
				key: 'update',
				value: function () {
					this.main.shown && this.pixi && this.app
						? (this.hijackedGL || this.hijackGL(), this.draw())
						: this.hijackedGL && this.restoreGL();
				},
			},
			{
				key: 'endFrame',
				value: function () {
					(this.drawCalls = this.tempDrawCalls), (this.tempDrawCalls = 0);
				},
			},
		]) && t(i.prototype, s),
		h && t(i, h),
		e
	);
})();
export default e;
