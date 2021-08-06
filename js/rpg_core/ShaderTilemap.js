//-----------------------------------------------------------------------------
/**
 * The tilemap which displays 2D tile-based game map using shaders
 *
 * @class Tilemap
 * @constructor
 */
function ShaderTilemap() {
	Tilemap.apply(this, arguments);
	this.roundPixels = true;
}

ShaderTilemap.prototype = Object.create(Tilemap.prototype);
ShaderTilemap.prototype.constructor = ShaderTilemap;

PIXI.tilemap.Constant.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;
PIXI.tilemap.Constant.DO_CLEAR = true;
PIXI.tilemap.Constant.boundCountPerBuffer = 4;
PIXI.tilemap.Constant.maxTextures = 4;

/**
 * Uploads animation state in renderer
 *
 * @method _hackRenderer
 * @private
 */
ShaderTilemap.prototype._hackRenderer = function (renderer) {
	let af = this.animationFrame % 4;
	if (af == 3) af = 1;
	renderer.plugins.tilemap.tileAnim[0] = af * this._tileWidth;
	renderer.plugins.tilemap.tileAnim[1] = (this.animationFrame % 3) * this._tileHeight;
	return renderer;
};

/**
 * PIXI render method
 *
 * @method renderCanvas
 * @param {Object} pixi renderer
 */
ShaderTilemap.prototype.renderCanvas = function (renderer) {
	this._hackRenderer(renderer);
	PIXI.Container.prototype.renderCanvas.call(this, renderer);
};


/**
 * PIXI render method
 *
 * @method render
 * @param {Object} pixi renderer
 */
ShaderTilemap.prototype.render = function (renderer) {
	this._hackRenderer(renderer);
	PIXI.Container.prototype.render.call(this, renderer);
};

/**
 * Forces to repaint the entire tilemap AND update bitmaps list if needed
 *
 * @method refresh
 */
ShaderTilemap.prototype.refresh = function () {
	if (this._lastBitmapLength !== this.bitmaps.length) {
		this._lastBitmapLength = this.bitmaps.length;
		this.refreshTileset();
	}
	this._needsRepaint = true;
};

/**
 * Call after you update tileset
 *
 * @method updateBitmaps
 */
ShaderTilemap.prototype.refreshTileset = function () {
	let bitmaps = this.bitmaps.map(function (x) {
		return x._baseTexture ? new PIXI.Texture(x._baseTexture) : x;
	});
	this.lowerLayer.setBitmaps(bitmaps);
	this.upperLayer.setBitmaps(bitmaps);
};

/**
 * @method updateTransform
 * @private
 */
ShaderTilemap.prototype.updateTransform = function () {
	let ox = Math.floor(this.origin.x);
	let oy = Math.floor(this.origin.y);
	let startX = Math.floor((ox - this._margin) / this._tileWidth);
	let startY = Math.floor((oy - this._margin) / this._tileHeight);
	this._updateLayerPositions(startX, startY);
	if (this._needsRepaint ||
		this._lastStartX !== startX || this._lastStartY !== startY) {
		this._lastStartX = startX;
		this._lastStartY = startY;
		this._paintAllTiles(startX, startY);
		this._needsRepaint = false;
	}
	this._sortChildren();
	PIXI.Container.prototype.updateTransform.call(this);
};

/**
 * @method _createLayers
 * @private
 */
ShaderTilemap.prototype._createLayers = function () {
	this._needsRepaint = true;

	if (!this.lowerZLayer) {
		//@hackerham: create layers only in initialization. Doesn't depend on width/height
		this.addChild(this.lowerZLayer = new PIXI.tilemap.ZLayer(this, 0));
		this.addChild(this.upperZLayer = new PIXI.tilemap.ZLayer(this, 4));

		this.lowerZLayer.addChild(this.lowerLayer = new PIXI.tilemap.CompositeRectTileLayer(0, []));
		this.lowerLayer.shadowColor = new Float32Array([0.0, 0.0, 0.0, 0.5]);
		this.upperZLayer.addChild(this.upperLayer = new PIXI.tilemap.CompositeRectTileLayer(4, []));
	}
};

/**
 * @method _updateLayerPositions
 * @param {Number} startX
 * @param {Number} startY
 * @private
 */
ShaderTilemap.prototype._updateLayerPositions = function (startX, startY) {
	let ox = Math.floor(this.origin.x);
	let oy = Math.floor(this.origin.y);
	this.lowerZLayer.position.x = startX * this._tileWidth - ox;
	this.lowerZLayer.position.y = startY * this._tileHeight - oy;
	this.upperZLayer.position.x = startX * this._tileWidth - ox;
	this.upperZLayer.position.y = startY * this._tileHeight - oy;
};

/**
 * @method _paintAllTiles
 * @param {Number} startX
 * @param {Number} startY
 * @private
 */
ShaderTilemap.prototype._paintAllTiles = function (startX, startY) {
	this.lowerZLayer.clear();
	this.upperZLayer.clear();
	let tileCols = Math.ceil(this._width / this._tileWidth) + 1;
	let tileRows = Math.ceil(this._height / this._tileHeight) + 1;
	for (let y = 0; y < tileRows; y++) {
		for (let x = 0; x < tileCols; x++) {
			this._paintTiles(startX, startY, x, y);
		}
	}
};

/**
 * @method _paintTiles
 * @param {Number} startX
 * @param {Number} startY
 * @param {Number} x
 * @param {Number} y
 * @private
 */
ShaderTilemap.prototype._paintTiles = function (startX, startY, x, y) {
	let mx = startX + x;
	let my = startY + y;
	let dx = x * this._tileWidth,
		dy = y * this._tileHeight;
	let tileId0 = this._readMapData(mx, my, 0);
	let tileId1 = this._readMapData(mx, my, 1);
	let tileId2 = this._readMapData(mx, my, 2);
	let tileId3 = this._readMapData(mx, my, 3);
	let shadowBits = this._readMapData(mx, my, 4);
	let upperTileId1 = this._readMapData(mx, my - 1, 1);
	let lowerLayer = this.lowerLayer.children[0];
	let upperLayer = this.upperLayer.children[0];

	if (this._isHigherTile(tileId0)) {
		this._drawTile(upperLayer, tileId0, dx, dy);
	} else {
		this._drawTile(lowerLayer, tileId0, dx, dy);
	}
	if (this._isHigherTile(tileId1)) {
		this._drawTile(upperLayer, tileId1, dx, dy);
	} else {
		this._drawTile(lowerLayer, tileId1, dx, dy);
	}

	this._drawShadow(lowerLayer, shadowBits, dx, dy);
	if (this._isTableTile(upperTileId1) && !this._isTableTile(tileId1)) {
		if (!Tilemap.isShadowingTile(tileId0)) {
			this._drawTableEdge(lowerLayer, upperTileId1, dx, dy);
		}
	}

	if (this._isOverpassPosition(mx, my)) {
		this._drawTile(upperLayer, tileId2, dx, dy);
		this._drawTile(upperLayer, tileId3, dx, dy);
	} else {
		if (this._isHigherTile(tileId2)) {
			this._drawTile(upperLayer, tileId2, dx, dy);
		} else {
			this._drawTile(lowerLayer, tileId2, dx, dy);
		}
		if (this._isHigherTile(tileId3)) {
			this._drawTile(upperLayer, tileId3, dx, dy);
		} else {
			this._drawTile(lowerLayer, tileId3, dx, dy);
		}
	}
};

/**
 * @method _drawTile
 * @param {Array} layers
 * @param {Number} tileId
 * @param {Number} dx
 * @param {Number} dy
 * @private
 */
ShaderTilemap.prototype._drawTile = function (layer, tileId, dx, dy) {
	if (Tilemap.isVisibleTile(tileId)) {
		if (Tilemap.isAutotile(tileId)) {
			this._drawAutotile(layer, tileId, dx, dy);
		} else {
			this._drawNormalTile(layer, tileId, dx, dy);
		}
	}
};

/**
 * @method _drawNormalTile
 * @param {Array} layers
 * @param {Number} tileId
 * @param {Number} dx
 * @param {Number} dy
 * @private
 */
ShaderTilemap.prototype._drawNormalTile = function (layer, tileId, dx, dy) {
	let setNumber = 0;

	if (Tilemap.isTileA5(tileId)) {
		setNumber = 4;
	} else {
		setNumber = 5 + Math.floor(tileId / 256);
	}

	let w = this._tileWidth;
	let h = this._tileHeight;
	let sx = (Math.floor(tileId / 128) % 2 * 8 + tileId % 8) * w;
	let sy = (Math.floor(tileId % 256 / 8) % 16) * h;

	layer.addRect(setNumber, sx, sy, dx, dy, w, h);
};

/**
 * @method _drawAutotile
 * @param {Array} layers
 * @param {Number} tileId
 * @param {Number} dx
 * @param {Number} dy
 * @private
 */
ShaderTilemap.prototype._drawAutotile = function (layer, tileId, dx, dy) {
	let autotileTable = Tilemap.FLOOR_AUTOTILE_TABLE;
	let kind = Tilemap.getAutotileKind(tileId);
	let shape = Tilemap.getAutotileShape(tileId);
	let tx = kind % 8;
	let ty = Math.floor(kind / 8);
	let bx = 0;
	let by = 0;
	let setNumber = 0;
	let isTable = false;
	let animX = 0,
		animY = 0;

	if (Tilemap.isTileA1(tileId)) {
		setNumber = 0;
		if (kind === 0) {
			animX = 2;
			by = 0;
		} else if (kind === 1) {
			animX = 2;
			by = 3;
		} else if (kind === 2) {
			bx = 6;
			by = 0;
		} else if (kind === 3) {
			bx = 6;
			by = 3;
		} else {
			bx = Math.floor(tx / 4) * 8;
			by = ty * 6 + Math.floor(tx / 2) % 2 * 3;
			if (kind % 2 === 0) {
				animX = 2;
			} else {
				bx += 6;
				autotileTable = Tilemap.WATERFALL_AUTOTILE_TABLE;
				animY = 1;
			}
		}
	} else if (Tilemap.isTileA2(tileId)) {
		setNumber = 1;
		bx = tx * 2;
		by = (ty - 2) * 3;
		isTable = this._isTableTile(tileId);
	} else if (Tilemap.isTileA3(tileId)) {
		setNumber = 2;
		bx = tx * 2;
		by = (ty - 6) * 2;
		autotileTable = Tilemap.WALL_AUTOTILE_TABLE;
	} else if (Tilemap.isTileA4(tileId)) {
		setNumber = 3;
		bx = tx * 2;
		by = Math.floor((ty - 10) * 2.5 + (ty % 2 === 1 ? 0.5 : 0));
		if (ty % 2 === 1) {
			autotileTable = Tilemap.WALL_AUTOTILE_TABLE;
		}
	}

	let table = autotileTable[shape];
	let w1 = this._tileWidth / 2;
	let h1 = this._tileHeight / 2;
	for (let i = 0; i < 4; i++) {
		let qsx = table[i][0];
		let qsy = table[i][1];
		let sx1 = (bx * 2 + qsx) * w1;
		let sy1 = (by * 2 + qsy) * h1;
		let dx1 = dx + (i % 2) * w1;
		let dy1 = dy + Math.floor(i / 2) * h1;
		if (isTable && (qsy === 1 || qsy === 5)) {
			let qsx2 = qsx;
			let qsy2 = 3;
			if (qsy === 1) {
				//qsx2 = [0, 3, 2, 1][qsx];
				qsx2 = (4 - qsx) % 4;
			}
			let sx2 = (bx * 2 + qsx2) * w1;
			let sy2 = (by * 2 + qsy2) * h1;
			layer.addRect(setNumber, sx2, sy2, dx1, dy1, w1, h1, animX, animY);
			layer.addRect(setNumber, sx1, sy1, dx1, dy1 + h1 / 2, w1, h1 / 2, animX, animY);
		} else {
			layer.addRect(setNumber, sx1, sy1, dx1, dy1, w1, h1, animX, animY);
		}
	}
};

/**
 * @method _drawTableEdge
 * @param {Array} layers
 * @param {Number} tileId
 * @param {Number} dx
 * @param {Number} dy
 * @private
 */
ShaderTilemap.prototype._drawTableEdge = function (layer, tileId, dx, dy) {
	if (Tilemap.isTileA2(tileId)) {
		let autotileTable = Tilemap.FLOOR_AUTOTILE_TABLE;
		let kind = Tilemap.getAutotileKind(tileId);
		let shape = Tilemap.getAutotileShape(tileId);
		let tx = kind % 8;
		let ty = Math.floor(kind / 8);
		let setNumber = 1;
		let bx = tx * 2;
		let by = (ty - 2) * 3;
		let table = autotileTable[shape];
		let w1 = this._tileWidth / 2;
		let h1 = this._tileHeight / 2;
		for (let i = 0; i < 2; i++) {
			let qsx = table[2 + i][0];
			let qsy = table[2 + i][1];
			let sx1 = (bx * 2 + qsx) * w1;
			let sy1 = (by * 2 + qsy) * h1 + h1 / 2;
			let dx1 = dx + (i % 2) * w1;
			let dy1 = dy + Math.floor(i / 2) * h1;
			layer.addRect(setNumber, sx1, sy1, dx1, dy1, w1, h1 / 2);
		}
	}
};

/**
 * @method _drawShadow
 * @param {Number} shadowBits
 * @param {Number} dx
 * @param {Number} dy
 * @private
 */
ShaderTilemap.prototype._drawShadow = function (layer, shadowBits, dx, dy) {
	if (shadowBits & 0x0f) {
		let w1 = this._tileWidth / 2;
		let h1 = this._tileHeight / 2;
		for (let i = 0; i < 4; i++) {
			if (shadowBits & (1 << i)) {
				let dx1 = dx + (i % 2) * w1;
				let dy1 = dy + Math.floor(i / 2) * h1;
				layer.addRect(-1, 0, 0, dx1, dy1, w1, h1);
			}
		}
	}
};
