//-----------------------------------------------------------------------------
/**
 * Compatibility layer that intercepts old Bitmap requests
 * and uses their PIXI equivalents
 *
 * @class BitmapPIXI
 * @constructor
 */
function BitmapPIXI() {
	this.initialize.apply(this, arguments);
}
BitmapPIXI.prototype = Object.create(PIXI.Container.prototype);
BitmapPIXI.prototype.constructor = BitmapPIXI;

BitmapPIXI.prototype.initialize = function (width, height) {
	PIXI.Container.call(this);
	width = Math.max(width || 0, 1);
	height = Math.max(height || 0, 1);
	this._width = width;
	this._height = height;
	this._paintOpacity = 255;

	this.textPadding = 2; // Adjust this if text is cut-off
	this.wordWrap = false;
	this.wordWrapWidth = 0;
	this.fontFace = 'GameFont';
	this.fontSize = 28;
	this.fontItalic = false;
	this.textColor = '#ffffff';
	this.outlineColor = 'rgba(0, 0, 0, 0.5)';
	this.outlineWidth = 4;
	this.textCache = [];

	this.on('removed', this.onRemoveAsAChild);
};

/**
 * Make sure the text cache is emptied and all children are destroyed
 *
 * @method _onRemoveAsAChild
 * @private
 */
BitmapPIXI.prototype.onRemoveAsAChild = function () {
	this.textCache = [];
	for (let i = this.children.length - 1; i >= 0; i--) {
		this.children[i].destroy({
			children: true,
			texture: true,
		});
		this.removeChild(this.children[i]);
	}
};

Object.defineProperty(BitmapPIXI.prototype, 'paintOpacity', {
	get: function () {
		return this._paintOpacity;
	},
	set: function (value) {
		if (this._paintOpacity !== value) {
			this._paintOpacity = value;
		}
	},
	configurable: true
});

Object.defineProperty(BitmapPIXI.prototype, 'width', {
	get: function () {
		return this._width;
	},
	configurable: true
});

Object.defineProperty(BitmapPIXI.prototype, 'height', {
	get: function () {
		return this._height;
	},
	configurable: true
});

/**
 * Resizes the bitmap.
 *
 * @method resize
 * @param {Number} width The new width of the bitmap
 * @param {Number} height The new height of the bitmap
 */
BitmapPIXI.prototype.resize = function (width, height) {
	width = Math.max(width || 0, 1);
	height = Math.max(height || 0, 1);
	this._width = width;
	this._height = height;
};

/**
 * Clear text and destroy children.
 *
 * @method clear
 */
BitmapPIXI.prototype.clear = function () {
	for (let i = this.children.length - 1; i >= 0; i--) {

		if (this.children[i].isBitmapText) {
			this.children[i].text = '';
			continue;
		}

		this.children[i].destroy({
			children: true,
			texture: true,
		});
		this.removeChild(this.children[i]);
	}
};

/**
 * Clear text and destroy children in a given area.
 *
 * @method clearRect
 * @param {Number} x Horizontal coordinate of area to clear
 * @param {Number} y Vertical coordinate of area to clear
 * @param {Number} width The width of area to clear
 * @param {Number} height The height of area to clear
 */
BitmapPIXI.prototype.clearRect = function (x, y, width, height) {
	const self = this;
	const toRemove = [];

	this.children.forEach(function (child) {
		if (child &&
			(child.x >= x && child.x < x + width) &&
			(child.y >= y && child.y < y + height)
		) {
			if (child.isBitmapText) {
				child.text = '';
			} else {
				toRemove.push(child);
			}
		}
	});

	toRemove.forEach(function (child) {
		child.destroy({
			children: true,
			texture: true,
		});
		self.removeChild(child);
	});
};

/**
 * Draws PIXI BitmapText.
 *
 * @method drawText
 * @param {String} text The text that will be drawn
 * @param {Number} x The x coordinate for the left of the text
 * @param {Number} y The y coordinate for the top of the text
 * @param {Number} maxWidth The maximum allowed width of the text
 * @param {Number} lineHeight The height of the text line
 * @param {String} align The alignment of the text
 */
BitmapPIXI.prototype.drawText = function (text, x, y, maxWidth, lineHeight, align) {
	if (text === undefined) return;
	const alpha = this._paintOpacity / 255;

	maxWidth = maxWidth || 0xffffffff;
	// [note] Non-String values crash BitmapText updates in PIXI 5.3.3
	// since they use {text}.replace
	text = String(text);
	if (align === 'center') {
		x = x + (maxWidth / 2);
	} else if (align === 'right') {
		x = x + maxWidth;
	}
	y = y + lineHeight - Math.round(this.fontSize * 1.25);

	// Try to updating existing text object at the same X and Y position
	const updateExisting = this._updateExistingText(text, x, y, alpha);
	// If no text object exists, create a new one
	if (!updateExisting) {
		this._drawNewText(text, x, y, alpha, maxWidth, lineHeight, align);
	}
};

/**
 * Updates instance of PIXI BitmapText.
 *
 * @method _updateExistingText
 * @return {Boolean} Returns true if update was successful
 * @private
 */
BitmapPIXI.prototype._updateExistingText = function (text, x, y, alpha) {
	const context = this;
	let exitEarly = false;
	this.textCache.forEach(function (BitmapTextInstance) {
		if (BitmapTextInstance && BitmapTextInstance.x === x && BitmapTextInstance.y === y) {
			exitEarly = true;
			if (BitmapTextInstance.text !== text) BitmapTextInstance.text = text;
			if (BitmapTextInstance.alpha !== alpha) BitmapTextInstance.alpha = alpha;
			context.addChild(BitmapTextInstance);
		}
	});
	return exitEarly;
};

/**
 * Creates instances of PIXI BitmapText.
 *
 * @method _drawNewText
 * @private
 */
BitmapPIXI.prototype._drawNewText = function (text, x, y, alpha, maxWidth, lineHeight, align) {
	const style = {
		fontFamily: this.fontFace,
		fontSize: this.fontSize,
		fill: 0xffffff,
		lineHeight: lineHeight,
		wordWrap: this.wordWrap,
		wordWrapWidth: this.wordWrapWidth,
		padding: this.textPadding,
		fontStyle: this.fontItalic ? 'italic' : 'normal',
		stroke: this.outlineColor,
		strokeThickness: this.outlineWidth,
	};

	if (!PIXI.BitmapFont.available[style.fontFamily]) {
		const bitmapOptions = {
			chars: [
                [" ", "~"],
                '\u2192',
                '’',
            ]
		};
		PIXI.BitmapFont.from(style.fontFamily, style, bitmapOptions);
	}

	const pixiText = new PIXI.BitmapText(text, {
		fontName: style.fontFamily,
		fontSize: style.fontSize,
		tint: PIXI.utils.string2hex(this.textColor),
	});

	if (!style.wordWrap && pixiText.width > maxWidth) {
		const scaling = maxWidth / pixiText.width;
		pixiText.scale.x = scaling;
	}

	if (align === 'center') {
		pixiText.anchor.set(0.5, 0);
	} else if (align === 'right') {
		pixiText.anchor.set(1, 0);
	}

	if (pixiText) {
		pixiText.x = x;
		pixiText.y = y;
		pixiText.alpha = alpha;
		pixiText.isBitmapText = true;
		this.textCache.push(pixiText);
		this.addChild(pixiText);
	}
};

/**
 * Returns the width of the specified text.
 *
 * @method measureTextWidth
 * @param {String} text The text to be measured
 * @return {Number} The width of the text in pixels
 */
BitmapPIXI.prototype.measureTextWidth = function (text) {
	text = String(text);
	const style = new PIXI.TextStyle({
		fontFamily: this.fontFace,
		fontSize: this.fontSize,
		padding: this.textPadding,
	});
	const textMetrics = PIXI.TextMetrics.measureText(text, style);
	return textMetrics.width;
};

/**
 * Creates a nine slice plane.
 *
 * @method create9Slice
 */
BitmapPIXI.prototype.create9Slice = function (source, x, y, w, h, tl, tr, br, bl) {
	return new PIXI.NineSlicePlane(
		new PIXI.Texture(
			source,
			new PIXI.Rectangle(x, y, w, h)
		), tl, tr, br, bl
	);
};

/**
 * Creates a tiling sprite.
 *
 * @method createTilingSprite
 */
BitmapPIXI.prototype.createTilingSprite = function (source, x, y, w, h, tileWidth, tileHeight) {
	return new PIXI.TilingSprite(
		new PIXI.Texture(
			source,
			new PIXI.Rectangle(x, y, w, h)
		), tileWidth, tileHeight
	);
};

/**
 * Creates a sprite by cropping a texture.
 *
 * @method createCroppedSprite
 */
BitmapPIXI.prototype.createCroppedSprite = function (source, x, y, w, h) {
	return new PIXI.Sprite(
		new PIXI.Texture(
			source,
			new PIXI.Rectangle(x, y, w, h)
		)
	);
};

/**
 * Equivalent to a block transfer.
 * Create a sprite and adds it as a child.
 *
 * @method blt
 * @param {Bitmap} source The bitmap to draw
 * @param {Number} sx The x coordinate in the source
 * @param {Number} sy The y coordinate in the source
 * @param {Number} sw The width of the source image
 * @param {Number} sh The height of the source image
 * @param {Number} dx The x coordinate in the destination
 * @param {Number} dy The y coordinate in the destination
 * @param {Number} [dw=sw] The width to draw the image in the destination
 * @param {Number} [dh=sh] The height to draw the image in the destination
 */
BitmapPIXI.prototype.blt = function (source, sx, sy, sw, sh, dx, dy, dw, dh) {
	dw = dw || sw;
	dh = dh || sh;
	if (sx >= 0 && sy >= 0 && sw > 0 && sh > 0 && dw > 0 && dh > 0 &&
		sx + sw <= source.width && sy + sh <= source.height) {
		const sprite = this.createCroppedSprite(source.baseTexture, sx, sy, sw, sh);
		if (sprite) {
			sprite.x = dx;
			sprite.y = dy;
			sprite.width = dw;
			sprite.height = dh;
			sprite.alpha = this._paintOpacity / 255;
			this.addChild(sprite);
		}
	}
};

/**
 * Fills the specified rectangle.
 *
 * @method fillRect
 * @param {Number} x The x coordinate for the upper-left corner
 * @param {Number} y The y coordinate for the upper-left corner
 * @param {Number} width The width of the rectangle to fill
 * @param {Number} height The height of the rectangle to fill
 * @param {String} color The color of the rectangle in CSS format
 */
BitmapPIXI.prototype.fillRect = function (x, y, width, height, color) {
	const rectangle = new PIXI.Graphics();
	color = PIXI.utils.string2hex(color);
	rectangle.beginFill(color);
	rectangle.drawRect(
		0,
		0,
		width,
		height
	);
	rectangle.endFill();
	if (rectangle) {
		rectangle.x = x;
		rectangle.y = y;
		rectangle.alpha = this._paintOpacity / 255;
		this.addChild(rectangle);
	}
	return rectangle;
};

/**
 * Ignores the 2nd colour and returns a solid-colour rectangle.
 *
 * @method gradientFillRect
 * @param {Number} x The x coordinate for the upper-left corner
 * @param {Number} y The y coordinate for the upper-left corner
 * @param {Number} width The width of the rectangle to fill
 * @param {Number} height The height of the rectangle to fill
 * @param {String} color1 The gradient starting color
 * @param {String} color2 The gradient ending color
 * @param {Boolean} vertical Wether the gradient should be draw as vertical or not
 */
BitmapPIXI.prototype.gradientFillRect = function (x, y, width, height, color1, color2, vertical) {
	return this.fillRect(x, y, width, height, color1);
};

/**
 * Draw a shape in the shape of a circle
 *
 * @method drawCircle
 * @param {Number} x The x coordinate based on the circle center
 * @param {Number} y The y coordinate based on the circle center
 * @param {Number} radius The radius of the circle
 * @param {String} color The color of the circle in CSS format
 */
BitmapPIXI.prototype.drawCircle = function (x, y, radius, color) {
	const circle = new PIXI.Graphics();
	color = PIXI.utils.string2hex(color);
	circle.beginFill(color);
	circle.drawCircle(
		0,
		0,
		radius
	);
	circle.endFill();
	if (circle) {
		circle.x = x;
		circle.y = y;
		circle.alpha = this._paintOpacity / 255;
		this.addChild(circle);
	}
	return circle;
};
