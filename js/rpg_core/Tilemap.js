//-----------------------------------------------------------------------------
/**
 * The tilemap which displays 2D tile-based game map.
 *
 * @class Tilemap
 * @constructor
 */
function Tilemap() {
	this.initialize.apply(this, arguments);
}

Tilemap.prototype = Object.create(PIXI.Container.prototype);
Tilemap.prototype.constructor = Tilemap;

Tilemap.prototype.initialize = function () {
	PIXI.Container.call(this);

	this._margin = 20;
	this._width = Graphics.width + this._margin * 2;
	this._height = Graphics.height + this._margin * 2;
	this._tileWidth = 48;
	this._tileHeight = 48;
	this._mapWidth = 0;
	this._mapHeight = 0;
	this._mapData = null;
	this._layerWidth = 0;
	this._layerHeight = 0;
	this._lastTiles = [];

	/**
	 * The bitmaps used as a tileset.
	 *
	 * @property bitmaps
	 * @type Array
	 */
	this.bitmaps = [];

	/**
	 * The origin point of the tilemap for scrolling.
	 *
	 * @property origin
	 * @type Point
	 */
	this.origin = new Point();

	/**
	 * The tileset flags.
	 *
	 * @property flags
	 * @type Array
	 */
	this.flags = [];

	/**
	 * The animation count for autotiles.
	 *
	 * @property animationCount
	 * @type Number
	 */
	this.animationCount = 0;

	/**
	 * Whether the tilemap loops horizontal.
	 *
	 * @property horizontalWrap
	 * @type Boolean
	 */
	this.horizontalWrap = false;

	/**
	 * Whether the tilemap loops vertical.
	 *
	 * @property verticalWrap
	 * @type Boolean
	 */
	this.verticalWrap = false;

	this._createLayers();
	this.refresh();
};

/**
 * The width of the screen in pixels.
 *
 * @property width
 * @type Number
 */
Object.defineProperty(Tilemap.prototype, 'width', {
	get: function () {
		return this._width;
	},
	set: function (value) {
		if (this._width !== value) {
			this._width = value;
			this._createLayers();
		}
	}
});

/**
 * The height of the screen in pixels.
 *
 * @property height
 * @type Number
 */
Object.defineProperty(Tilemap.prototype, 'height', {
	get: function () {
		return this._height;
	},
	set: function (value) {
		if (this._height !== value) {
			this._height = value;
			this._createLayers();
		}
	}
});

/**
 * The width of a tile in pixels.
 *
 * @property tileWidth
 * @type Number
 */
Object.defineProperty(Tilemap.prototype, 'tileWidth', {
	get: function () {
		return this._tileWidth;
	},
	set: function (value) {
		if (this._tileWidth !== value) {
			this._tileWidth = value;
			this._createLayers();
		}
	}
});

/**
 * The height of a tile in pixels.
 *
 * @property tileHeight
 * @type Number
 */
Object.defineProperty(Tilemap.prototype, 'tileHeight', {
	get: function () {
		return this._tileHeight;
	},
	set: function (value) {
		if (this._tileHeight !== value) {
			this._tileHeight = value;
			this._createLayers();
		}
	}
});

/**
 * Sets the tilemap data.
 *
 * @method setData
 * @param {Number} width The width of the map in number of tiles
 * @param {Number} height The height of the map in number of tiles
 * @param {Array} data The one dimensional array for the map data
 */
Tilemap.prototype.setData = function (width, height, data) {
	this._mapWidth = width;
	this._mapHeight = height;
	this._mapData = data;
};

/**
 * Checks whether the tileset is ready to render.
 *
 * @method isReady
 * @type Boolean
 * @return {Boolean} True if the tilemap is ready
 */
Tilemap.prototype.isReady = function () {
	for (let i = 0; i < this.bitmaps.length; i++) {
		if (this.bitmaps[i] && !this.bitmaps[i].isReady()) {
			return false;
		}
	}
	return true;
};

/**
 * Updates the tilemap for each frame.
 *
 * @method update
 */
Tilemap.prototype.update = function () {
	this.animationCount++;
	this.animationFrame = Math.floor(this.animationCount / 30);
	this.children.forEach(function (child) {
		if (child.update) {
			child.update();
		}
	});
	for (let i = 0; i < this.bitmaps.length; i++) {
		if (this.bitmaps[i]) {
			this.bitmaps[i].touch();
		}
	}
};

/**
 * Forces to repaint the entire tilemap.
 *
 * @method refresh
 */
Tilemap.prototype.refresh = function () {
	this._lastTiles.length = 0;
};

/**
 * Forces to refresh the tileset
 *
 * @method refresh
 */
Tilemap.prototype.refreshTileset = function () {

};

/**
 * @method updateTransform
 * @private
 */
Tilemap.prototype.updateTransform = function () {
	let ox = Math.floor(this.origin.x);
	let oy = Math.floor(this.origin.y);
	let startX = Math.floor((ox - this._margin) / this._tileWidth);
	let startY = Math.floor((oy - this._margin) / this._tileHeight);
	this._updateLayerPositions(startX, startY);
	if (this._needsRepaint || this._lastAnimationFrame !== this.animationFrame ||
		this._lastStartX !== startX || this._lastStartY !== startY) {
		this._frameUpdated = this._lastAnimationFrame !== this.animationFrame;
		this._lastAnimationFrame = this.animationFrame;
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
Tilemap.prototype._createLayers = function () {
	let width = this._width;
	let height = this._height;
	let margin = this._margin;
	let tileCols = Math.ceil(width / this._tileWidth) + 1;
	let tileRows = Math.ceil(height / this._tileHeight) + 1;
	let layerWidth = tileCols * this._tileWidth;
	let layerHeight = tileRows * this._tileHeight;
	this._lowerBitmap = new Bitmap(layerWidth, layerHeight);
	this._upperBitmap = new Bitmap(layerWidth, layerHeight);
	this._layerWidth = layerWidth;
	this._layerHeight = layerHeight;

	/*
	 * Z coordinate:
	 *
	 * 0 : Lower tiles
	 * 1 : Lower characters
	 * 3 : Normal characters
	 * 4 : Upper tiles
	 * 5 : Upper characters
	 * 6 : Airship shadow
	 * 7 : Balloon
	 * 8 : Animation
	 * 9 : Destination
	 */

	this._lowerLayer = new Sprite();
	this._lowerLayer.move(-margin, -margin, width, height);
	this._lowerLayer.z = 0;

	this._upperLayer = new Sprite();
	this._upperLayer.move(-margin, -margin, width, height);
	this._upperLayer.z = 4;

	for (let i = 0; i < 4; i++) {
		this._lowerLayer.addChild(new Sprite(this._lowerBitmap));
		this._upperLayer.addChild(new Sprite(this._upperBitmap));
	}

	this.addChild(this._lowerLayer);
	this.addChild(this._upperLayer);
};

/**
 * @method _updateLayerPositions
 * @param {Number} startX
 * @param {Number} startY
 * @private
 */
Tilemap.prototype._updateLayerPositions = function (startX, startY) {
	let m = this._margin;
	let ox = Math.floor(this.origin.x);
	let oy = Math.floor(this.origin.y);
	let x2 = (ox - m)
		.mod(this._layerWidth);
	let y2 = (oy - m)
		.mod(this._layerHeight);
	let w1 = this._layerWidth - x2;
	let h1 = this._layerHeight - y2;
	let w2 = this._width - w1;
	let h2 = this._height - h1;

	for (let i = 0; i < 2; i++) {
		let children;
		if (i === 0) {
			children = this._lowerLayer.children;
		} else {
			children = this._upperLayer.children;
		}
		children[0].move(0, 0, w1, h1);
		children[0].setFrame(x2, y2, w1, h1);
		children[1].move(w1, 0, w2, h1);
		children[1].setFrame(0, y2, w2, h1);
		children[2].move(0, h1, w1, h2);
		children[2].setFrame(x2, 0, w1, h2);
		children[3].move(w1, h1, w2, h2);
		children[3].setFrame(0, 0, w2, h2);
	}
};

/**
 * @method _paintAllTiles
 * @param {Number} startX
 * @param {Number} startY
 * @private
 */
Tilemap.prototype._paintAllTiles = function (startX, startY) {
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
Tilemap.prototype._paintTiles = function (startX, startY, x, y) {
	let tableEdgeVirtualId = 10000;
	let mx = startX + x;
	let my = startY + y;
	let dx = (mx * this._tileWidth)
		.mod(this._layerWidth);
	let dy = (my * this._tileHeight)
		.mod(this._layerHeight);
	let lx = dx / this._tileWidth;
	let ly = dy / this._tileHeight;
	let tileId0 = this._readMapData(mx, my, 0);
	let tileId1 = this._readMapData(mx, my, 1);
	let tileId2 = this._readMapData(mx, my, 2);
	let tileId3 = this._readMapData(mx, my, 3);
	let shadowBits = this._readMapData(mx, my, 4);
	let upperTileId1 = this._readMapData(mx, my - 1, 1);
	let lowerTiles = [];
	let upperTiles = [];

	if (this._isHigherTile(tileId0)) {
		upperTiles.push(tileId0);
	} else {
		lowerTiles.push(tileId0);
	}
	if (this._isHigherTile(tileId1)) {
		upperTiles.push(tileId1);
	} else {
		lowerTiles.push(tileId1);
	}

	lowerTiles.push(-shadowBits);

	if (this._isTableTile(upperTileId1) && !this._isTableTile(tileId1)) {
		if (!Tilemap.isShadowingTile(tileId0)) {
			lowerTiles.push(tableEdgeVirtualId + upperTileId1);
		}
	}

	if (this._isOverpassPosition(mx, my)) {
		upperTiles.push(tileId2);
		upperTiles.push(tileId3);
	} else {
		if (this._isHigherTile(tileId2)) {
			upperTiles.push(tileId2);
		} else {
			lowerTiles.push(tileId2);
		}
		if (this._isHigherTile(tileId3)) {
			upperTiles.push(tileId3);
		} else {
			lowerTiles.push(tileId3);
		}
	}

	let lastLowerTiles = this._readLastTiles(0, lx, ly);
	if (!lowerTiles.equals(lastLowerTiles) ||
		(Tilemap.isTileA1(tileId0) && this._frameUpdated)) {
		this._lowerBitmap.clearRect(dx, dy, this._tileWidth, this._tileHeight);
		for (let i = 0; i < lowerTiles.length; i++) {
			let lowerTileId = lowerTiles[i];
			if (lowerTileId < 0) {
				this._drawShadow(this._lowerBitmap, shadowBits, dx, dy);
			} else if (lowerTileId >= tableEdgeVirtualId) {
				this._drawTableEdge(this._lowerBitmap, upperTileId1, dx, dy);
			} else {
				this._drawTile(this._lowerBitmap, lowerTileId, dx, dy);
			}
		}
		this._writeLastTiles(0, lx, ly, lowerTiles);
	}

	let lastUpperTiles = this._readLastTiles(1, lx, ly);
	if (!upperTiles.equals(lastUpperTiles)) {
		this._upperBitmap.clearRect(dx, dy, this._tileWidth, this._tileHeight);
		for (let j = 0; j < upperTiles.length; j++) {
			this._drawTile(this._upperBitmap, upperTiles[j], dx, dy);
		}
		this._writeLastTiles(1, lx, ly, upperTiles);
	}
};

/**
 * @method _readLastTiles
 * @param {Number} i
 * @param {Number} x
 * @param {Number} y
 * @private
 */
Tilemap.prototype._readLastTiles = function (i, x, y) {
	let array1 = this._lastTiles[i];
	if (array1) {
		let array2 = array1[y];
		if (array2) {
			let tiles = array2[x];
			if (tiles) {
				return tiles;
			}
		}
	}
	return [];
};

/**
 * @method _writeLastTiles
 * @param {Number} i
 * @param {Number} x
 * @param {Number} y
 * @param {Array} tiles
 * @private
 */
Tilemap.prototype._writeLastTiles = function (i, x, y, tiles) {
	let array1 = this._lastTiles[i];
	if (!array1) {
		array1 = this._lastTiles[i] = [];
	}
	let array2 = array1[y];
	if (!array2) {
		array2 = array1[y] = [];
	}
	array2[x] = tiles;
};

/**
 * @method _drawTile
 * @param {Bitmap} bitmap
 * @param {Number} tileId
 * @param {Number} dx
 * @param {Number} dy
 * @private
 */
Tilemap.prototype._drawTile = function (bitmap, tileId, dx, dy) {
	if (Tilemap.isVisibleTile(tileId)) {
		if (Tilemap.isAutotile(tileId)) {
			this._drawAutotile(bitmap, tileId, dx, dy);
		} else {
			this._drawNormalTile(bitmap, tileId, dx, dy);
		}
	}
};

/**
 * @method _drawNormalTile
 * @param {Bitmap} bitmap
 * @param {Number} tileId
 * @param {Number} dx
 * @param {Number} dy
 * @private
 */
Tilemap.prototype._drawNormalTile = function (bitmap, tileId, dx, dy) {
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

	let source = this.bitmaps[setNumber];
	if (source) {
		bitmap.bltImage(source, sx, sy, w, h, dx, dy, w, h);
	}
};

/**
 * @method _drawAutotile
 * @param {Bitmap} bitmap
 * @param {Number} tileId
 * @param {Number} dx
 * @param {Number} dy
 * @private
 */
Tilemap.prototype._drawAutotile = function (bitmap, tileId, dx, dy) {
	let autotileTable = Tilemap.FLOOR_AUTOTILE_TABLE;
	let kind = Tilemap.getAutotileKind(tileId);
	let shape = Tilemap.getAutotileShape(tileId);
	let tx = kind % 8;
	let ty = Math.floor(kind / 8);
	let bx = 0;
	let by = 0;
	let setNumber = 0;
	let isTable = false;

	if (Tilemap.isTileA1(tileId)) {
		let waterSurfaceIndex = [0, 1, 2, 1][this.animationFrame % 4];
		setNumber = 0;
		if (kind === 0) {
			bx = waterSurfaceIndex * 2;
			by = 0;
		} else if (kind === 1) {
			bx = waterSurfaceIndex * 2;
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
				bx += waterSurfaceIndex * 2;
			} else {
				bx += 6;
				autotileTable = Tilemap.WATERFALL_AUTOTILE_TABLE;
				by += this.animationFrame % 3;
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
	let source = this.bitmaps[setNumber];

	if (table && source) {
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
					qsx2 = [0, 3, 2, 1][qsx];
				}
				let sx2 = (bx * 2 + qsx2) * w1;
				let sy2 = (by * 2 + qsy2) * h1;
				bitmap.bltImage(source, sx2, sy2, w1, h1, dx1, dy1, w1, h1);
				dy1 += h1 / 2;
				bitmap.bltImage(source, sx1, sy1, w1, h1 / 2, dx1, dy1, w1, h1 / 2);
			} else {
				bitmap.bltImage(source, sx1, sy1, w1, h1, dx1, dy1, w1, h1);
			}
		}
	}
};

/**
 * @method _drawTableEdge
 * @param {Bitmap} bitmap
 * @param {Number} tileId
 * @param {Number} dx
 * @param {Number} dy
 * @private
 */
Tilemap.prototype._drawTableEdge = function (bitmap, tileId, dx, dy) {
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

		if (table) {
			let source = this.bitmaps[setNumber];
			let w1 = this._tileWidth / 2;
			let h1 = this._tileHeight / 2;
			for (let i = 0; i < 2; i++) {
				let qsx = table[2 + i][0];
				let qsy = table[2 + i][1];
				let sx1 = (bx * 2 + qsx) * w1;
				let sy1 = (by * 2 + qsy) * h1 + h1 / 2;
				let dx1 = dx + (i % 2) * w1;
				let dy1 = dy + Math.floor(i / 2) * h1;
				bitmap.bltImage(source, sx1, sy1, w1, h1 / 2, dx1, dy1, w1, h1 / 2);
			}
		}
	}
};

/**
 * @method _drawShadow
 * @param {Bitmap} bitmap
 * @param {Number} shadowBits
 * @param {Number} dx
 * @param {Number} dy
 * @private
 */
Tilemap.prototype._drawShadow = function (bitmap, shadowBits, dx, dy) {
	if (shadowBits & 0x0f) {
		let w1 = this._tileWidth / 2;
		let h1 = this._tileHeight / 2;
		let color = 'rgba(0,0,0,0.5)';
		for (let i = 0; i < 4; i++) {
			if (shadowBits & (1 << i)) {
				let dx1 = dx + (i % 2) * w1;
				let dy1 = dy + Math.floor(i / 2) * h1;
				bitmap.fillRect(dx1, dy1, w1, h1, color);
			}
		}
	}
};

/**
 * @method _readMapData
 * @param {Number} x
 * @param {Number} y
 * @param {Number} z
 * @return {Number}
 * @private
 */
Tilemap.prototype._readMapData = function (x, y, z) {
	if (this._mapData) {
		let width = this._mapWidth;
		let height = this._mapHeight;
		if (this.horizontalWrap) {
			x = x.mod(width);
		}
		if (this.verticalWrap) {
			y = y.mod(height);
		}
		if (x >= 0 && x < width && y >= 0 && y < height) {
			return this._mapData[(z * height + y) * width + x] || 0;
		} else {
			return 0;
		}
	} else {
		return 0;
	}
};

/**
 * @method _isHigherTile
 * @param {Number} tileId
 * @return {Boolean}
 * @private
 */
Tilemap.prototype._isHigherTile = function (tileId) {
	return this.flags[tileId] & 0x10;
};

/**
 * @method _isTableTile
 * @param {Number} tileId
 * @return {Boolean}
 * @private
 */
Tilemap.prototype._isTableTile = function (tileId) {
	return Tilemap.isTileA2(tileId) && (this.flags[tileId] & 0x80);
};

/**
 * @method _isOverpassPosition
 * @param {Number} mx
 * @param {Number} my
 * @return {Boolean}
 * @private
 */
Tilemap.prototype._isOverpassPosition = function (mx, my) {
	return false;
};

/**
 * @method _sortChildren
 * @private
 */
Tilemap.prototype._sortChildren = function () {
	this.children.sort(this._compareChildOrder.bind(this));
};

/**
 * @method _compareChildOrder
 * @param {Object} a
 * @param {Object} b
 * @private
 */
Tilemap.prototype._compareChildOrder = function (a, b) {
	if (a.z === b.z) {
		if (a.y === b.y) {
			return a.spriteId - b.spriteId;
		}
		return a.y - b.y;
	}
	return a.z - b.z;
};

// Tile type checkers

Tilemap.TILE_ID_B = 0;
Tilemap.TILE_ID_C = 256;
Tilemap.TILE_ID_D = 512;
Tilemap.TILE_ID_E = 768;
Tilemap.TILE_ID_A5 = 1536;
Tilemap.TILE_ID_A1 = 2048;
Tilemap.TILE_ID_A2 = 2816;
Tilemap.TILE_ID_A3 = 4352;
Tilemap.TILE_ID_A4 = 5888;
Tilemap.TILE_ID_MAX = 8192;

Tilemap.isVisibleTile = function (tileId) {
	return tileId > 0 && tileId < this.TILE_ID_MAX;
};

Tilemap.isAutotile = function (tileId) {
	return tileId >= this.TILE_ID_A1;
};

Tilemap.getAutotileKind = function (tileId) {
	return Math.floor((tileId - this.TILE_ID_A1) / 48);
};

Tilemap.getAutotileShape = function (tileId) {
	return (tileId - this.TILE_ID_A1) % 48;
};

Tilemap.makeAutotileId = function (kind, shape) {
	return this.TILE_ID_A1 + kind * 48 + shape;
};

Tilemap.isSameKindTile = function (tileID1, tileID2) {
	if (this.isAutotile(tileID1) && this.isAutotile(tileID2)) {
		return this.getAutotileKind(tileID1) === this.getAutotileKind(tileID2);
	} else {
		return tileID1 === tileID2;
	}
};

Tilemap.isTileA1 = function (tileId) {
	return tileId >= this.TILE_ID_A1 && tileId < this.TILE_ID_A2;
};

Tilemap.isTileA2 = function (tileId) {
	return tileId >= this.TILE_ID_A2 && tileId < this.TILE_ID_A3;
};

Tilemap.isTileA3 = function (tileId) {
	return tileId >= this.TILE_ID_A3 && tileId < this.TILE_ID_A4;
};

Tilemap.isTileA4 = function (tileId) {
	return tileId >= this.TILE_ID_A4 && tileId < this.TILE_ID_MAX;
};

Tilemap.isTileA5 = function (tileId) {
	return tileId >= this.TILE_ID_A5 && tileId < this.TILE_ID_A1;
};

Tilemap.isWaterTile = function (tileId) {
	if (this.isTileA1(tileId)) {
		return !(tileId >= this.TILE_ID_A1 + 96 && tileId < this.TILE_ID_A1 + 192);
	} else {
		return false;
	}
};

Tilemap.isWaterfallTile = function (tileId) {
	if (tileId >= this.TILE_ID_A1 + 192 && tileId < this.TILE_ID_A2) {
		return this.getAutotileKind(tileId) % 2 === 1;
	} else {
		return false;
	}
};

Tilemap.isGroundTile = function (tileId) {
	return this.isTileA1(tileId) || this.isTileA2(tileId) || this.isTileA5(tileId);
};

Tilemap.isShadowingTile = function (tileId) {
	return this.isTileA3(tileId) || this.isTileA4(tileId);
};

Tilemap.isRoofTile = function (tileId) {
	return this.isTileA3(tileId) && this.getAutotileKind(tileId) % 16 < 8;
};

Tilemap.isWallTopTile = function (tileId) {
	return this.isTileA4(tileId) && this.getAutotileKind(tileId) % 16 < 8;
};

Tilemap.isWallSideTile = function (tileId) {
	return (this.isTileA3(tileId) || this.isTileA4(tileId)) &&
		this.getAutotileKind(tileId) % 16 >= 8;
};

Tilemap.isWallTile = function (tileId) {
	return this.isWallTopTile(tileId) || this.isWallSideTile(tileId);
};

Tilemap.isFloorTypeAutotile = function (tileId) {
	return (this.isTileA1(tileId) && !this.isWaterfallTile(tileId)) ||
		this.isTileA2(tileId) || this.isWallTopTile(tileId);
};

Tilemap.isWallTypeAutotile = function (tileId) {
	return this.isRoofTile(tileId) || this.isWallSideTile(tileId);
};

Tilemap.isWaterfallTypeAutotile = function (tileId) {
	return this.isWaterfallTile(tileId);
};

// Autotile shape number to coordinates of tileset images

Tilemap.FLOOR_AUTOTILE_TABLE = [
    [[2, 4], [1, 4], [2, 3], [1, 3]], [[2, 0], [1, 4], [2, 3], [1, 3]],
    [[2, 4], [3, 0], [2, 3], [1, 3]], [[2, 0], [3, 0], [2, 3], [1, 3]],
    [[2, 4], [1, 4], [2, 3], [3, 1]], [[2, 0], [1, 4], [2, 3], [3, 1]],
    [[2, 4], [3, 0], [2, 3], [3, 1]], [[2, 0], [3, 0], [2, 3], [3, 1]],
    [[2, 4], [1, 4], [2, 1], [1, 3]], [[2, 0], [1, 4], [2, 1], [1, 3]],
    [[2, 4], [3, 0], [2, 1], [1, 3]], [[2, 0], [3, 0], [2, 1], [1, 3]],
    [[2, 4], [1, 4], [2, 1], [3, 1]], [[2, 0], [1, 4], [2, 1], [3, 1]],
    [[2, 4], [3, 0], [2, 1], [3, 1]], [[2, 0], [3, 0], [2, 1], [3, 1]],
    [[0, 4], [1, 4], [0, 3], [1, 3]], [[0, 4], [3, 0], [0, 3], [1, 3]],
    [[0, 4], [1, 4], [0, 3], [3, 1]], [[0, 4], [3, 0], [0, 3], [3, 1]],
    [[2, 2], [1, 2], [2, 3], [1, 3]], [[2, 2], [1, 2], [2, 3], [3, 1]],
    [[2, 2], [1, 2], [2, 1], [1, 3]], [[2, 2], [1, 2], [2, 1], [3, 1]],
    [[2, 4], [3, 4], [2, 3], [3, 3]], [[2, 4], [3, 4], [2, 1], [3, 3]],
    [[2, 0], [3, 4], [2, 3], [3, 3]], [[2, 0], [3, 4], [2, 1], [3, 3]],
    [[2, 4], [1, 4], [2, 5], [1, 5]], [[2, 0], [1, 4], [2, 5], [1, 5]],
    [[2, 4], [3, 0], [2, 5], [1, 5]], [[2, 0], [3, 0], [2, 5], [1, 5]],
    [[0, 4], [3, 4], [0, 3], [3, 3]], [[2, 2], [1, 2], [2, 5], [1, 5]],
    [[0, 2], [1, 2], [0, 3], [1, 3]], [[0, 2], [1, 2], [0, 3], [3, 1]],
    [[2, 2], [3, 2], [2, 3], [3, 3]], [[2, 2], [3, 2], [2, 1], [3, 3]],
    [[2, 4], [3, 4], [2, 5], [3, 5]], [[2, 0], [3, 4], [2, 5], [3, 5]],
    [[0, 4], [1, 4], [0, 5], [1, 5]], [[0, 4], [3, 0], [0, 5], [1, 5]],
    [[0, 2], [3, 2], [0, 3], [3, 3]], [[0, 2], [1, 2], [0, 5], [1, 5]],
    [[0, 4], [3, 4], [0, 5], [3, 5]], [[2, 2], [3, 2], [2, 5], [3, 5]],
    [[0, 2], [3, 2], [0, 5], [3, 5]], [[0, 0], [1, 0], [0, 1], [1, 1]]
];

Tilemap.WALL_AUTOTILE_TABLE = [
    [[2, 2], [1, 2], [2, 1], [1, 1]], [[0, 2], [1, 2], [0, 1], [1, 1]],
    [[2, 0], [1, 0], [2, 1], [1, 1]], [[0, 0], [1, 0], [0, 1], [1, 1]],
    [[2, 2], [3, 2], [2, 1], [3, 1]], [[0, 2], [3, 2], [0, 1], [3, 1]],
    [[2, 0], [3, 0], [2, 1], [3, 1]], [[0, 0], [3, 0], [0, 1], [3, 1]],
    [[2, 2], [1, 2], [2, 3], [1, 3]], [[0, 2], [1, 2], [0, 3], [1, 3]],
    [[2, 0], [1, 0], [2, 3], [1, 3]], [[0, 0], [1, 0], [0, 3], [1, 3]],
    [[2, 2], [3, 2], [2, 3], [3, 3]], [[0, 2], [3, 2], [0, 3], [3, 3]],
    [[2, 0], [3, 0], [2, 3], [3, 3]], [[0, 0], [3, 0], [0, 3], [3, 3]]
];

Tilemap.WATERFALL_AUTOTILE_TABLE = [
    [[2, 0], [1, 0], [2, 1], [1, 1]], [[0, 0], [1, 0], [0, 1], [1, 1]],
    [[2, 0], [3, 0], [2, 1], [3, 1]], [[0, 0], [3, 0], [0, 1], [3, 1]]
];

// The important members from Pixi.js

/**
 * [read-only] The array of children of the tilemap.
 *
 * @property children
 * @type Array
 */

/**
 * [read-only] The object that contains the tilemap.
 *
 * @property parent
 * @type Object
 */

/**
 * Adds a child to the container.
 *
 * @method addChild
 * @param {Object} child The child to add
 * @return {Object} The child that was added
 */

/**
 * Adds a child to the container at a specified index.
 *
 * @method addChildAt
 * @param {Object} child The child to add
 * @param {Number} index The index to place the child in
 * @return {Object} The child that was added
 */

/**
 * Removes a child from the container.
 *
 * @method removeChild
 * @param {Object} child The child to remove
 * @return {Object} The child that was removed
 */

/**
 * Removes a child from the specified index position.
 *
 * @method removeChildAt
 * @param {Number} index The index to get the child from
 * @return {Object} The child that was removed
 */
