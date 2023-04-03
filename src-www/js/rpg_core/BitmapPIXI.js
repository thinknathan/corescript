//-----------------------------------------------------------------------------
/**
 * Compatibility layer that intercepts old Bitmap requests
 * and uses their PIXI equivalents
 *
 * @class BitmapPIXI
 * @constructor
 */
class BitmapPIXI extends PIXI.Container {
	constructor(...args) {
		super(...args);
		this.initialize(...args);
	}

	initialize(width, height) {
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
	}

	/**
	 * Make sure the text cache is emptied and all children are destroyed
	 *
	 * @method _onRemoveAsAChild
	 * @private
	 */
	onRemoveAsAChild() {
		this.textCache = [];
		for (let i = this.children.length - 1; i >= 0; i--) {
			this.children[i].destroy({
				children: true,
				texture: true,
			});
			this.removeChild(this.children[i]);
		}
	}

	get paintOpacity() {
		return this._paintOpacity;
	}

	set paintOpacity(value) {
		if (this._paintOpacity !== value) {
			this._paintOpacity = value;
		}
	}

	get width() {
		return this._width;
	}

	set width(value) {
		if (this._width !== value) {
			this._width = value;
		}
	}

	get height() {
		return this._height;
	}

	set height(value) {
		if (this._height !== value) {
			this._height = value;
		}
	}

	/**
	 * Resizes the bitmap.
	 *
	 * @method resize
	 * @param {Number} width The new width of the bitmap
	 * @param {Number} height The new height of the bitmap
	 */
	resize(width, height) {
		width = Math.max(width || 0, 1);
		height = Math.max(height || 0, 1);
		this._width = width;
		this._height = height;
	}

	/**
	 * Clear text and destroy children.
	 *
	 * @method clear
	 */
	clear() {
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
	}

	/**
	 * Clear text and destroy children in a given area.
	 *
	 * @method clearRect
	 * @param {Number} x Horizontal coordinate of area to clear
	 * @param {Number} y Vertical coordinate of area to clear
	 * @param {Number} width The width of area to clear
	 * @param {Number} height The height of area to clear
	 */
	clearRect(x, y, width, height) {
		const self = this;
		const toRemove = [];

		this.children.forEach((child) => {
			if (
				child &&
				child.x >= x &&
				child.x < x + width &&
				child.y >= y &&
				child.y < y + height
			) {
				if (child.isBitmapText) {
					child.text = '';
				} else {
					toRemove.push(child);
				}
			}
		});

		toRemove.forEach((child) => {
			child.destroy({
				children: true,
				texture: true,
			});
			self.removeChild(child);
		});
	}

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
	drawText(text, x, y, maxWidth, lineHeight, align) {
		if (text === undefined) return;
		const alpha = this._paintOpacity / 255;
		maxWidth = Math.floor(maxWidth) || 0xffffffff;
		lineHeight = Math.floor(lineHeight);
		// [note] Non-String values crash BitmapText updates in PIXI 5.3.3
		// since they use {text}.replace
		text = String(text);

		if (align === 'center') {
			x = x + maxWidth / 2;
		} else if (align === 'right') {
			x = x + maxWidth;
		}
		y = y + lineHeight - this.fontSize * 1.25;

		x = Math.floor(x);
		y = Math.floor(y);

		// Try to updating existing text object at the same X and Y position
		const updateExisting = this._updateExistingText(text, x, y, alpha);
		// If no text object exists, create a new one
		if (!updateExisting) {
			this._drawNewText(text, x, y, alpha, maxWidth, lineHeight, align);
		}
	}

	/**
	 * Updates instance of PIXI BitmapText.
	 *
	 * @method _updateExistingText
	 * @return {Boolean} Returns true if update was successful
	 * @private
	 */
	_updateExistingText(text, x, y, alpha) {
		for (const bitmapTextInstance of this.textCache) {
			if (bitmapTextInstance.x === x && bitmapTextInstance.y === y) {
				const newTint = PIXI.utils.string2hex(this.textColor);
				if (bitmapTextInstance._tint !== newTint)
					bitmapTextInstance.tint = newTint;
				if (bitmapTextInstance.text !== text) bitmapTextInstance.text = text;
				if (bitmapTextInstance.alpha !== alpha)
					bitmapTextInstance.alpha = alpha;
				this.addChild(bitmapTextInstance);
				return true;
			}
		}

		return false;
	}

	/**
	 * Creates instances of PIXI BitmapText.
	 *
	 * @method _drawNewText
	 * @private
	 */
	_drawNewText(text, x, y, alpha, maxWidth, lineHeight, align) {
		const style = {
			fontFamily: this.fontFace,
			fontSize: this.fontSize,
			fill: 0xffffff,
			lineHeight,
			wordWrap: this.wordWrap,
			wordWrapWidth: this.wordWrapWidth,
			padding: this.textPadding,
			fontStyle: this.fontItalic ? 'italic' : 'normal',
			stroke: this.outlineColor,
			strokeThickness: this.outlineWidth,
		};

		if (!PIXI.BitmapFont.available[style.fontFamily]) {
			this._makeBitmapFont(style);
		}

		const pixiText = new PIXI.BitmapText(text, {
			fontName: style.fontFamily,
			fontSize: style.fontSize,
		});

		if (!style.wordWrap && pixiText.width > maxWidth) {
			pixiText.scale.x = maxWidth / pixiText.width;
		}

		if (align === 'center') {
			pixiText.anchor.set(0.5, 0);
		} else if (align === 'right') {
			pixiText.anchor.set(1, 0);
		}

		if (pixiText) {
			pixiText.x = x;
			pixiText.y = y;
			pixiText.tint = PIXI.utils.string2hex(this.textColor);
			pixiText.alpha = alpha;
			pixiText.isBitmapText = true;
			this.textCache.push(pixiText);
			this.addChild(pixiText);
		}
	}

	/**
	 * Creates a bitmap font.
	 *
	 * @method _makeBitmapFont
	 * @private
	 */
	_makeBitmapFont(style) {
		const bitmapOptions = {
			chars: [[' ', '~'], '\u2192', '’'],
		};
		PIXI.BitmapFont.from(style.fontFamily, style, bitmapOptions);
	}

	/**
	 * Returns the width of the specified text.
	 *
	 * @method measureTextWidth
	 * @param {String} text The text to be measured
	 * @return {Number} The width of the text in pixels
	 */
	measureTextWidth(text) {
		text = String(text);
		const style = new PIXI.TextStyle({
			fontFamily: this.fontFace,
			fontSize: this.fontSize,
			padding: this.textPadding,
		});
		const textMetrics = PIXI.TextMetrics.measureText(text, style);
		return textMetrics.width;
	}

	/**
	 * Creates a nine slice plane.
	 *
	 * @method create9Slice
	 */
	create9Slice(source, x, y, w, h, tl, tr, br, bl) {
		return new PIXI.NineSlicePlane(
			new PIXI.Texture(source, new PIXI.Rectangle(x, y, w, h)),
			tl,
			tr,
			br,
			bl
		);
	}

	/**
	 * Creates a tiling sprite.
	 *
	 * @method createTilingSprite
	 */
	createTilingSprite(source, x, y, w, h, tileWidth, tileHeight) {
		return new PIXI.TilingSprite(
			new PIXI.Texture(source, new PIXI.Rectangle(x, y, w, h)),
			tileWidth,
			tileHeight
		);
	}

	/**
	 * Creates a sprite by cropping a texture.
	 *
	 * @method createCroppedSprite
	 */
	createCroppedSprite(source, x, y, w, h) {
		return new PIXI.Sprite(
			new PIXI.Texture(source, new PIXI.Rectangle(x, y, w, h))
		);
	}

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
	blt({ width, height, baseTexture }, sx, sy, sw, sh, dx, dy, dw, dh) {
		dw = dw || sw;
		dh = dh || sh;
		sx = Math.floor(sx);
		sy = Math.floor(sy);
		sw = Math.floor(sw);
		sh = Math.floor(sh);
		dx = Math.floor(dx);
		dy = Math.floor(dy);
		dw = Math.floor(dw);
		dh = Math.floor(dh);
		if (
			sx >= 0 &&
			sy >= 0 &&
			sw > 0 &&
			sh > 0 &&
			dw > 0 &&
			dh > 0 &&
			sx + sw <= width &&
			sy + sh <= height
		) {
			const sprite = this.createCroppedSprite(baseTexture, sx, sy, sw, sh);
			if (sprite) {
				sprite.x = dx;
				sprite.y = dy;
				sprite.width = dw;
				sprite.height = dh;
				sprite.alpha = this._paintOpacity / 255;
				this.addChild(sprite);
				return sprite;
			}
		}
	}

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
	fillRect(x, y, width, height, color) {
		x = Math.floor(x);
		y = Math.floor(y);
		width = Math.floor(width);
		height = Math.floor(height);
		const rectangle = new PIXI.Graphics();
		color = PIXI.utils.string2hex(color);
		rectangle.beginFill(color);
		rectangle.drawRect(0, 0, width, height);
		rectangle.endFill();
		if (rectangle) {
			rectangle.x = x;
			rectangle.y = y;
			rectangle.alpha = this._paintOpacity / 255;
			this.addChild(rectangle);
		}
		return rectangle;
	}

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
	gradientFillRect(x, y, width, height, color1, color2, vertical) {
		return this.fillRect(x, y, width, height, color1);
	}

	/**
	 * Draw a shape in the shape of a circle
	 *
	 * @method drawCircle
	 * @param {Number} x The x coordinate based on the circle center
	 * @param {Number} y The y coordinate based on the circle center
	 * @param {Number} radius The radius of the circle
	 * @param {String} color The color of the circle in CSS format
	 */
	drawCircle(x, y, radius, color) {
		x = Math.floor(x);
		y = Math.floor(y);
		const circle = new PIXI.Graphics();
		color = PIXI.utils.string2hex(color);
		circle.beginFill(color);
		circle.drawCircle(0, 0, radius);
		circle.endFill();
		if (circle) {
			circle.x = x;
			circle.y = y;
			circle.alpha = this._paintOpacity / 255;
			this.addChild(circle);
		}
		return circle;
	}
}

export default BitmapPIXI;
