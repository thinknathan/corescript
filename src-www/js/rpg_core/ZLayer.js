//-----------------------------------------------------------------------------
/**
 * Re-add ZLayer functionality to @pixi/tilemap.
 *
 * @link https://github.com/pixijs/tilemap/blob/master/demo/rpgmaker.js
 * @credit https://github.com/pixijs/tilemap/graphs/contributors
 * @license https://github.com/pixijs/tilemap/blob/master/LICENSE
 */
PIXI.tilemap.ZLayer = class ZLayer extends PIXI.Container {
	constructor(tilemap, zIndex) {
		super();
		ZLayer.prototype.__init.call(this);
		this.tilemap = tilemap;
		this.z = zIndex;
	}

	__init() {
		this._lastAnimationFrame = -1;
	}

	clear() {
		let layers = this.children;
		for (let i = 0; i < layers.length; i++) layers[i].clear();
		this._previousLayers = 0;
	}

	cacheIfDirty(canvasRenderer) {
		let tilemap = this.tilemap;
		let layers = this.children;
		let modified = this._previousLayers !== layers.length;
		this._previousLayers = layers.length;
		let buf = this.canvasBuffer;
		let tempRender = this._tempRender;
		if (!buf) {
			buf = this.canvasBuffer = document.createElement('canvas');
			canvasRenderer.constructor.registerPlugin(
				'tilemap',
				PIXI.tilemap.CanvasTileRenderer
			);
			tempRender = this._tempRender = new canvasRenderer.constructor({
				width: 100,
				height: 100,
				view: buf,
			});
			tempRender.context = tempRender.rootContext;
			tempRender.plugins.tilemap.dontUseTransform = true;
		}
		if (
			buf.width !== tilemap._layerWidth ||
			buf.height !== tilemap._layerHeight
		) {
			buf.width = tilemap._layerWidth;
			buf.height = tilemap._layerHeight;
			modified = true;
		}
		let i;
		if (!modified) {
			for (i = 0; i < layers.length; i++) {
				if (
					layers[i].isModified(
						this._lastAnimationFrame !== tilemap.animationFrame
					)
				) {
					modified = true;
					break;
				}
			}
		}
		this._lastAnimationFrame = tilemap.animationFrame;
		if (modified) {
			if (tilemap._hackRenderer) {
				tilemap._hackRenderer(tempRender);
			}
			tempRender.context.clearRect(0, 0, buf.width, buf.height);
			for (i = 0; i < layers.length; i++) {
				layers[i].clearModify();
				layers[i].renderCanvas(tempRender);
			}
		}
		this.layerTransform = this.worldTransform;
		for (i = 0; i < layers.length; i++) {
			this.layerTransform = layers[i].worldTransform;
			break;
		}
	}

	renderCanvas(renderer) {
		this.cacheIfDirty(renderer);
		let wt = this.layerTransform;
		renderer.context.setTransform(
			wt.a,
			wt.b,
			wt.c,
			wt.d,
			wt.tx * renderer.resolution,
			wt.ty * renderer.resolution
		);
		renderer.context.drawImage(this.canvasBuffer, 0, 0);
	}
};
