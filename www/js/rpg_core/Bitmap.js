import * as PIXI from '../libs/pixi-webworker.mjs';
import Graphics from '../rpg_core/Graphics.js';
import Rectangle from '../rpg_core/Rectangle.js';
import CanvasShim from './CanvasShim.js';

//-----------------------------------------------------------------------------
/**
 * The basic object that represents an image.
 *
 * @class Bitmap
 * @constructor
 * @param {Number} width The width of the bitmap
 * @param {Number} height The height of the bitmap
 */
class Bitmap extends PIXI.Container {
	constructor(...args) {
		super(...args);
		this.initialize(...args);
	}

	initialize(width, height) {
		// PIXI.Container.call(this);
		width = Math.max(width || 0, 1);
		height = Math.max(height || 0, 1);

		if (!this._defer) {
			this._createCanvas(width, height);
		}

		// this._loader = new PIXI.Loader();
		this._width = width;
		this._height = height;
		this._image = null;
		this._url = '';
		this._paintOpacity = 255;
		this._smooth = false;
		this._loadListeners = [];
		this._loadingState = 'none';
		this._decodeAfterRequest = false;
		this._tint = '0xffffff';
		this.textPadding = 2; // Adjust this if text is cut-off
		this.wordWrap = false;
		this.wordWrapWidth = 0;
		this.textCache = [];

		/**
		 * Cache entry, for images. In all cases _url is the same as cacheEntry.key
		 * @type CacheEntry
		 */
		this.cacheEntry = null;

		/**
		 * The face name of the font.
		 *
		 * @property fontFace
		 * @type String
		 */
		this.fontFace = 'GameFont';

		/**
		 * The size of the font in pixels.
		 *
		 * @property fontSize
		 * @type Number
		 */
		this.fontSize = 28;

		/**
		 * Whether the font is italic.
		 *
		 * @property fontItalic
		 * @type Boolean
		 */
		this.fontItalic = false;

		/**
		 * The color of the text in CSS format.
		 *
		 * @property textColor
		 * @type String
		 */
		this.textColor = '#ffffff';

		/**
		 * The color of the outline of the text in CSS format.
		 *
		 * @property outlineColor
		 * @type String
		 */
		this.outlineColor = 'rgba(0, 0, 0, 0.5)';

		/**
		 * The width of the outline of the text.
		 *
		 * @property outlineWidth
		 * @type Number
		 */
		this.outlineWidth = 4;

		// TEST: Is this still necessary?
		// this.on('removed', this.onRemoveAsAChild);
	}

	//-----------------------------------------------------------------------------
	/**
	 * Methods relating to Bitmap's nature as a container.
	 */

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

	/**
	 * The opacity of the drawing object in the range (0, 255).
	 *
	 * @property paintOpacity
	 * @type Number
	 */
	get paintOpacity() {
		return this._paintOpacity;
	}

	set paintOpacity(value) {
		if (this._paintOpacity !== value) {
			this._paintOpacity = value;
		}
	}

	/**
	 * [read-only] The width of the bitmap.
	 *
	 * @property width
	 * @type Number
	 */
	get width() {
		return this._width;
	}

	set width(value) {
		if (this._width !== value) {
			this._width = value;
		}
	}

	/**
	 * [read-only] The height of the bitmap.
	 *
	 * @property height
	 * @type Number
	 */
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
		const context = this;
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
			context.removeChild(child);
		});
	}

	//-----------------------------------------------------------------------------
	/**
	 * Methods relating to drawing images.
	 */

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
				this.tint = this._tint;
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
		color = PIXI.utils.string2hex(color);
		const rectangle = new PIXI.Graphics();
		rectangle.beginFill(color);
		rectangle.drawRect(0, 0, width, height);
		rectangle.endFill();
		if (rectangle) {
			rectangle.x = x;
			rectangle.y = y;
			rectangle.alpha = this._paintOpacity / 255;
			rectangle.tint = this._tint;
			this.addChild(rectangle);
		}
		return rectangle;
	}

	/**
	 * Performs a block transfer, using assumption that original image was not modified (no hue)
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
	bltImage({ width, height, _image }, sx, sy, sw, sh, dx, dy, dw, dh) {
		return this.blt(
			{
				width,
				height,
				_image,
			},
			sx,
			sy,
			sw,
			sh,
			dx,
			dy,
			dw,
			dh
		);
	}

	/**
	 * Fills the entire bitmap.
	 *
	 * @method fillAll
	 * @param {String} color The color of the rectangle in CSS format
	 */
	fillAll(color) {
		this.fillRect(0, 0, this.width, this.height, color);
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
			circle.tint = this._tint;
			this.addChild(circle);
		}
		return circle;
	}

	/**
	 * [read-only] The base texture that holds the image.
	 *
	 * @property baseTexture
	 * @type PIXI.BaseTexture
	 */
	get baseTexture() {
		return this._baseTexture;
	}

	/**
	 * [read-only] The bitmap canvas.
	 *
	 * @property canvas
	 * @type HTMLCanvasElement
	 */
	get canvas() {
		return this._canvas;
	}

	/**
	 * [read-only] The 2d context of the bitmap canvas.
	 *
	 * @property context
	 * @type CanvasRenderingContext2D
	 */
	get context() {
		return this._canvas.context;
	}

	/**
	 * [read-only] The rectangle of the bitmap.
	 *
	 * @property rect
	 * @type Rectangle
	 */
	get rect() {
		return new Rectangle(0, 0, this.width, this.height);
	}

	/**
	 * Bitmap states(Bitmap._loadingState):
	 *
	 * none:
	 * Empty Bitmap
	 *
	 * pending:
	 * Url requested, but pending to load until startRequest called
	 *
	 * purged:
	 * Url request completed and purged.
	 *
	 * requesting:
	 * Requesting supplied URI now.
	 *
	 * requestCompleted:
	 * Request completed
	 *
	 * loaded:
	 * loaded. isReady() === true, so It's usable.
	 *
	 * error:
	 * error occurred
	 *
	 */

	_createCanvas(width, height) {
		this.__canvas = {};
		this.__canvas = new CanvasShim();
		this.__context = this.__canvas.getContext('2d');

		this.__canvas.width = Math.max(width || 0, 1);
		this.__canvas.height = Math.max(height || 0, 1);

		if (this._image) {
			const w = Math.max(this._image.width || 0, 1);
			const h = Math.max(this._image.height || 0, 1);
			this.__canvas.width = w;
			this.__canvas.height = h;
			this._createBaseTexture(this._image);
		} else {
			this._createBaseTexture(
				new PIXI.Resource(this.__canvas.width, this.__canvas.height)
			);
		}
		// this._setDirty();
	}

	_createBaseTexture(source) {
		if (source && source.baseTexture) {
			this.__baseTexture = source.baseTexture;
			this.__baseTexture.width = source.width;
			this.__baseTexture.height = source.height;
			this.__baseTexture.mipmap = false;
			this.__baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
		} else {
			this.__baseTexture = new PIXI.BaseTexture(source);
		}
	}

	_clearImgInstance() {
		this._image = null;
	}

	_renewCanvas() {
		const newImage = this._image;
		if (
			newImage &&
			this.__canvas &&
			(this.__canvas.width < newImage.width ||
				this.__canvas.height < newImage.height)
		) {
			this._createCanvas();
		}
	}

	/**
	 * Takes a snapshot of the game screen and returns a new bitmap object.
	 *
	 * @static
	 * @method snap
	 * @param {Stage} stage The stage object
	 * @return Bitmap
	 */
	static snap(stage) {
		const width = Graphics.width;
		const height = Graphics.height;
		const bitmap = new Bitmap(width, height);
		if (stage) {
			const renderTexture = PIXI.RenderTexture.create({
				width,
				height,
			});
			Graphics._renderer.render(stage, {
				renderTexture: renderTexture,
			});
			bitmap.__baseTexture = renderTexture.baseTexture;
		}
		// bitmap._setDirty();
		return bitmap;
	}

	/**
	 * Returns pixel color at the specified point.
	 *
	 * @method getPixel
	 * @param {Number} x The x coordinate of the pixel in the bitmap
	 * @param {Number} y The y coordinate of the pixel in the bitmap
	 * @return {String} The pixel color (hex format)
	 */
	getPixel(x, y) {
		if (!this.baseTexture) {
			return '#ffffff';
		}
		const sprite = PIXI.Sprite.from(this.baseTexture);
		const pixels = Graphics._renderer.extract.pixels(sprite, {
			x: x,
			y: y,
			width: 1,
			height: 1,
			resolution: this.baseTexture.resolution,
		});
		const rgb = PIXI.utils.rgb2hex([
			pixels[0] / 255,
			pixels[1] / 255,
			pixels[2] / 255,
		]);
		const result = PIXI.utils.hex2string(rgb);
		sprite.destroy({
			children: true,
			texture: true,
			baseTexture: false,
		});
		return result;
	}

	/**
	 * Returns alpha pixel value at the specified point.
	 *
	 * @method getAlphaPixel
	 * @param {Number} x The x coordinate of the pixel in the bitmap
	 * @param {Number} y The y coordinate of the pixel in the bitmap
	 * @return {String} The alpha value
	 */
	getAlphaPixel(x, y) {
		if (!this.baseTexture) {
			return '1';
		}
		const sprite = PIXI.Sprite.from(this.baseTexture);
		const pixels = Graphics._renderer.plugins.extract.pixels(sprite, {
			x: x,
			y: y,
			width: 1,
			height: 1,
			resolution: this.baseTexture.resolution,
		});
		const result = String(pixels[3]);
		sprite.destroy({
			children: true,
			texture: true,
			baseTexture: false,
		});
		return result;
	}

	/**
	 * Changes the color tone of children which support Tint.
	 *
	 * @method adjustTone
	 * @param {Number} r The red strength in the range (-255, 255)
	 * @param {Number} g The green strength in the range (-255, 255)
	 * @param {Number} b The blue strength in the range (-255, 255)
	 */
	adjustTone(r, g, b) {
		this._tint = PIXI.utils.rgb2hex(r, g, b);
	}

	//-----------------------------------------------------------------------------
	/**
	 * Methods relating to drawing text.
	 */

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
		lineHeight = Math.floor(lineHeight * 1.75);

		if (align === 'center') {
			x = x + maxWidth / 2;
		} else if (align === 'right') {
			x = x + maxWidth;
		}
		y = y + lineHeight - this.fontSize * 2.25;

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

	//-----------------------------------------------------------------------------
	/**
	 * Methods relating to loading and listeners.
	 */

	/**
	 * [read-only] The url of the image file.
	 *
	 * @property url
	 * @type String
	 */
	get url() {
		return this._url;
	}

	/**
	 * Add a callback function that will be called when the bitmap is loaded.
	 *
	 * @method addLoadListener
	 * @param {Function} listner The callback function
	 */
	addLoadListener(listner) {
		if (!this.isReady()) {
			this._loadListeners.push(listner);
		} else {
			if (this._image) listner(this); // Never returns if this._image is null - not intended
		}
	}

	/**
	 * Checks whether the bitmap is ready to render.
	 *
	 * @method isReady
	 * @return {Boolean} True if the bitmap is ready to render
	 */
	isReady() {
		return this._loadingState === 'loaded' || this._loadingState === 'none';
	}

	/**
	 * Checks whether a loading error has occurred.
	 *
	 * @method isError
	 * @return {Boolean} True if a loading error has occurred
	 */
	isError() {
		return this._loadingState === 'error';
	}

	/**
	 * touch the resource
	 * @method touch
	 */
	touch() {
		if (this.cacheEntry) {
			this.cacheEntry.touch();
		}
	}

	/**
	 * @method _onLoad
	 * @private
	 */
	_onLoad() {
		this._renewCanvas();

		switch (this._loadingState) {
			case 'requesting':
				this._loadingState = 'requestCompleted';

				// if (this._decodeAfterRequest) {
				this.decode();
				// } else {
				// this._loadingState = 'purged';
				// this._clearImgInstance();
				// }
				break;
		}
	}

	decode() {
		switch (this._loadingState) {
			case 'requestCompleted':
				this._loadingState = 'loaded';
				this._createBaseTexture(this._image);
				// this._setDirty();
				this._callLoadListeners();
				break;

			case 'requesting':
				this._decodeAfterRequest = true;
				// 		if (!this._loader) {
				// 			this._loader = ResourceHandler.createLoader(this._url, this._requestImage.bind(this, this._url), this._onError.bind(this));
				// 			this._image.removeEventListener('error', this._errorListener);
				// 			this._image.addEventListener('error', this._errorListener = this._loader);
				// 		}
				break;

			case 'pending':
			case 'purged':
			case 'error':
				this._decodeAfterRequest = true;
				this._requestImage(this._url);
				break;
		}
	}

	/**
	 * @method _callLoadListeners
	 * @private
	 */
	_callLoadListeners() {
		while (this._loadListeners.length > 0) {
			const listener = this._loadListeners.shift();
			listener(this);
		}
	}

	/**
	 * @method _onError
	 * @private
	 */
	_onError() {
		this._loadingState = 'error';
	}

	_requestImage(src) {
		// if (this._loader.resources && this._loader.resources[url]) {
		// 	this._image = this._loader.resources[url].texture;
		// 	this._width = this._image.width;
		// 	this._height = this._image.height;
		// 	this._onLoad();
		// } else {
		// this._loader.add(url, url);
		const url = `../${src}`;
		this._url = url;
		this._loadingState = 'requesting';

		PIXI.Assets.load(url)
			.then((texture) => {
				this._image = texture;
				this._width = this._image.width;
				this._height = this._image.height;
				this._onLoad();
			})
			.catch((error) => {
				console.error(error);
				this._onError();
			});

		// const context = this;

		// this._loader.load((loader, resources) => {
		// 	this._image = resources[url].texture;
		// 	this._width = this._image.width;
		// 	this._height = this._image.height;
		// 	this._onLoad();
		// });

		// this._loader.onError.add(() => {
		// 	this._onError();
		// });
		// }

		// if (this._decodeAfterRequest && !this._loader) {
		// 	this._loader = ResourceHandler.createLoader(url, this._requestImage.bind(this, url), this._onError.bind(this));
		// }
	}

	isRequestOnly() {
		return !(this._decodeAfterRequest || this.isReady());
	}

	isRequestReady() {
		return (
			this._loadingState !== 'pending' && this._loadingState !== 'requesting'
		);
	}

	startRequest() {
		if (this._loadingState === 'pending') {
			this._decodeAfterRequest = false;
			this._requestImage(this._url);
		}
	}

	/**
	 * Loads a image file and returns a new bitmap object.
	 *
	 * @static
	 * @method load
	 * @param {String} url The image url of the texture
	 * @return Bitmap
	 */
	static load(url) {
		const bitmap = Object.create(Bitmap.prototype);
		bitmap._defer = true;
		bitmap.initialize();

		bitmap._decodeAfterRequest = true;
		bitmap._requestImage(url);

		return bitmap;
	}

	static request(url) {
		const bitmap = Object.create(Bitmap.prototype);
		bitmap._defer = true;
		bitmap.initialize();

		bitmap._url = url;
		bitmap._loadingState = 'pending';

		return bitmap;
	}

	/**
	 * Deprecated function.
	 */
	rotateHue(offset) {}

	/**
	 * Deprecated function.
	 */
	blur() {}

	/**
	 * Deprecated function.
	 */
	_drawTextOutline(text, tx, ty, maxWidth) {}

	/**
	 * Deprecated function.
	 */
	_drawTextBody(text, tx, ty, maxWidth) {}

	/**
	 * Deprecated function.
	 *
	 * @method drawSmallText
	 */
	drawSmallText(text, x, y, maxWidth, lineHeight, align) {}

	/**
	 * Deprecated function.
	 */
	_setDirty() {}

	/**
	 * Deprecated function.
	 * @method checkDirty
	 */
	checkDirty() {}

	/**
	 * Deprecated property.
	 *
	 * @property smooth
	 * @type Boolean
	 */
	get smooth() {
		return this._smooth;
	}

	set smooth(value) {
		if (this._smooth !== false) {
			this._smooth = false;
		}
	}
}

//for iOS. img consumes memory. so reuse it.
Bitmap._reuseImages = [];

//
//We don't want to waste memory, so creating canvas is deferred.
//
Object.defineProperties(Bitmap.prototype, {
	_canvas: {
		get() {
			if (!this.__canvas) this._createCanvas();
			return this.__canvas;
		},
	},
	_context: {
		get() {
			if (!this.__context) this._createCanvas();
			return this.__context;
		},
	},

	_baseTexture: {
		get() {
			if (!this.__baseTexture) this._createBaseTexture(this._image);
			return this.__baseTexture;
		},
	},
});

export default Bitmap;
