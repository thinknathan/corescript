import Graphics from '../rpg_core/Graphics.js';
import Decrypter from '../rpg_core/Decrypter.js';
import Rectangle from '../rpg_core/Rectangle.js';
import ResourceHandler from '../rpg_core/ResourceHandler.js';

//-----------------------------------------------------------------------------
/**
 * The basic object that represents an image.
 *
 * @class Bitmap
 * @constructor
 * @param {Number} width The width of the bitmap
 * @param {Number} height The height of the bitmap
 */
class Bitmap {
	constructor(...args) {
		this.initialize(...args);
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
	 * decrypting:
	 * requesting encrypted data from supplied URI or decrypting it.
	 *
	 * decryptCompleted:
	 * Decrypt completed
	 *
	 * loaded:
	 * loaded. isReady() === true, so It's usable.
	 *
	 * error:
	 * error occurred
	 *
	 */

	_createCanvas(width, height) {
		this.__canvas = this.__canvas || document.createElement('canvas');
		this.__context = this.__canvas.getContext('2d');

		this.__canvas.width = Math.max(width || 0, 1);
		this.__canvas.height = Math.max(height || 0, 1);

		if (this._image) {
			const w = Math.max(this._image.width || 0, 1);
			const h = Math.max(this._image.height || 0, 1);
			this.__canvas.width = w;
			this.__canvas.height = h;
			this._createBaseTexture(this._canvas);

			console.info(
				'[Bitmap._createCanvas] Drawing %o to canvas is slow.',
				this._image
			);
			this.__context.drawImage(this._image, 0, 0);
		}

		this._setDirty();
	}

	_createBaseTexture(source) {
		this.__baseTexture = new PIXI.BaseTexture(source);
		this.__baseTexture.mipmap = false;
		this.__baseTexture.width = source.width;
		this.__baseTexture.height = source.height;
		this._baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
	}

	_clearImgInstance() {
		this._image.src = '';
		this._image.onload = null;
		this._image.onerror = null;
		this._errorListener = null;
		this._loadListener = null;

		Bitmap._reuseImages.push(this._image);
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

	initialize(width, height) {
		if (!this._defer) {
			this._createCanvas(width, height);
		}

		this._image = null;
		this._url = '';
		this._paintOpacity = 255;
		this._loadListeners = [];
		this._loadingState = 'none';
		this._decodeAfterRequest = false;

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
	 * [read-only] The url of the image file.
	 *
	 * @property url
	 * @type String
	 */
	get url() {
		return this._url;
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
		return this._context;
	}

	/**
	 * [read-only] The width of the bitmap.
	 *
	 * @property width
	 * @type Number
	 */
	get width() {
		if (this.isReady()) {
			return this._image ? this._image.width : this._canvas.width;
		}

		return 0;
	}

	/**
	 * [read-only] The height of the bitmap.
	 *
	 * @property height
	 * @type Number
	 */
	get height() {
		if (this.isReady()) {
			return this._image ? this._image.height : this._canvas.height;
		}

		return 0;
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
	 * Whether the smooth scaling is applied.
	 *
	 * @property smooth
	 * @type Boolean
	 */
	get smooth() {
		return false;
	}

	set smooth(value) {}

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
			this._context.globalAlpha = this._paintOpacity / 255;
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
		this._canvas.width = width;
		this._canvas.height = height;
		this._baseTexture.width = width;
		this._baseTexture.height = height;
	}

	/**
	 * Performs a block transfer.
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
	blt({ width, height, _canvas }, sx, sy, sw, sh, dx, dy, dw, dh) {
		console.info('[Bitmap.blt] Canvas block transfer is slow.');
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
			this._context.globalCompositeOperation = 'source-over';
			this._context.drawImage(_canvas, sx, sy, sw, sh, dx, dy, dw, dh);
			this._setDirty();
		}
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
		dw = dw || sw;
		dh = dh || sh;
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
			this._context.globalCompositeOperation = 'source-over';
			this._context.drawImage(_image, sx, sy, sw, sh, dx, dy, dw, dh);
			this._setDirty();
		}
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
		const data = this._context.getImageData(x, y, 1, 1).data;
		let result = '#';
		for (let i = 0; i < 3; i++) {
			result += data[i].toString(16).padZero(2);
		}
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
		const data = this._context.getImageData(x, y, 1, 1).data;
		return data[3];
	}

	/**
	 * Clears the specified rectangle.
	 *
	 * @method clearRect
	 * @param {Number} x The x coordinate for the upper-left corner
	 * @param {Number} y The y coordinate for the upper-left corner
	 * @param {Number} width The width of the rectangle to clear
	 * @param {Number} height The height of the rectangle to clear
	 */
	clearRect(x, y, width, height) {
		this._context.clearRect(x, y, width, height);
		this._setDirty();
	}

	/**
	 * Clears the entire bitmap.
	 *
	 * @method clear
	 */
	clear() {
		this.clearRect(0, 0, this.width, this.height);
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
		const context = this._context;
		context.save();
		context.fillStyle = color;
		context.fillRect(x, y, width, height);
		context.restore();
		this._setDirty();
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
	 * Draws the rectangle with a gradation.
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
		const context = this._context;
		let grad;
		if (vertical) {
			grad = context.createLinearGradient(x, y, x, y + height);
		} else {
			grad = context.createLinearGradient(x, y, x + width, y);
		}
		grad.addColorStop(0, color1);
		grad.addColorStop(1, color2);
		context.save();
		context.fillStyle = grad;
		context.fillRect(x, y, width, height);
		context.restore();
		this._setDirty();
	}

	/**
	 * Draw a bitmap in the shape of a circle
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
		const context = this._context;
		context.save();
		context.fillStyle = color;
		context.beginPath();
		context.arc(x, y, radius, 0, Math.PI * 2, false);
		context.fill();
		context.restore();
		this._setDirty();
	}

	/**
	 * Draws the outline text to the bitmap.
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
		// Note: Firefox has a bug with textBaseline: Bug 737852
		//       So we use 'alphabetic' here.
		if (text !== undefined) {
			x = Math.floor(x);
			y = Math.floor(y);
			maxWidth = Math.floor(maxWidth) || 0xffffffff;
			lineHeight = Math.floor(lineHeight);
			let tx = x;
			const ty =
				y + lineHeight - Math.round((lineHeight - this.fontSize * 0.7) / 2);
			const context = this._context;
			const alpha = context.globalAlpha;
			if (align === 'center') {
				tx += maxWidth / 2;
			}
			if (align === 'right') {
				tx += maxWidth;
			}
			context.save();
			context.font = this._makeFontNameText();
			context.textAlign = align;
			context.textBaseline = 'alphabetic';
			context.globalAlpha = 1;
			this._drawTextOutline(text, tx, ty, maxWidth);
			context.globalAlpha = alpha;
			this._drawTextBody(text, tx, ty, maxWidth);
			context.restore();
			this._setDirty();
		}
	}

	/**
	 * Deprecated function.
	 *
	 * @method drawSmallText
	 */
	drawSmallText(text, x, y, maxWidth, lineHeight, align) {}

	/**
	 * Returns the width of the specified text.
	 *
	 * @method measureTextWidth
	 * @param {String} text The text to be measured
	 * @return {Number} The width of the text in pixels
	 */
	measureTextWidth(text) {
		const context = this._context;
		context.save();
		context.font = this._makeFontNameText();
		const width = context.measureText(text).width;
		context.restore();
		return width;
	}

	/**
	 * Changes the color tone of the entire bitmap.
	 *
	 * @method adjustTone
	 * @param {Number} r The red strength in the range (-255, 255)
	 * @param {Number} g The green strength in the range (-255, 255)
	 * @param {Number} b The blue strength in the range (-255, 255)
	 */
	adjustTone(r, g, b) {
		if ((r || g || b) && this.width > 0 && this.height > 0) {
			const context = this._context;
			const imageData = context.getImageData(0, 0, this.width, this.height);
			const pixels = imageData.data;
			for (let i = 0; i < pixels.length; i += 4) {
				pixels[i + 0] += r;
				pixels[i + 1] += g;
				pixels[i + 2] += b;
			}
			context.putImageData(imageData, 0, 0);
			this._setDirty();
		}
	}

	/**
	 * Rotates the hue of the entire bitmap.
	 *
	 * @method rotateHue
	 * @param {Number} offset The hue offset in 360 degrees
	 */
	rotateHue(offset) {
		if (!offset) return;

		function rgbToHsl(r, g, b) {
			const cmin = Math.min(r, g, b);
			const cmax = Math.max(r, g, b);
			let h = 0;
			let s = 0;
			const l = (cmin + cmax) / 2;
			const delta = cmax - cmin;

			if (delta > 0) {
				if (r === cmax) {
					h = 60 * (((g - b) / delta + 6) % 6);
				} else if (g === cmax) {
					h = 60 * ((b - r) / delta + 2);
				} else {
					h = 60 * ((r - g) / delta + 4);
				}
				s = delta / (255 - Math.abs(2 * l - 255));
			}
			return [h, s, l];
		}

		function hslToRgb(h, s, l) {
			const c = (255 - Math.abs(2 * l - 255)) * s;
			const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
			const m = l - c / 2;
			const cm = c + m;
			const xm = x + m;

			if (h < 60) {
				return [cm, xm, m];
			} else if (h < 120) {
				return [xm, cm, m];
			} else if (h < 180) {
				return [m, cm, xm];
			} else if (h < 240) {
				return [m, xm, cm];
			} else if (h < 300) {
				return [xm, m, cm];
			} else {
				return [cm, m, xm];
			}
		}

		if (offset && this.width > 0 && this.height > 0) {
			offset = ((offset % 360) + 360) % 360;
			const context = this._context;
			const imageData = context.getImageData(0, 0, this.width, this.height);
			const pixels = imageData.data;
			for (let i = 0; i < pixels.length; i += 4) {
				const hsl = rgbToHsl(pixels[i + 0], pixels[i + 1], pixels[i + 2]);
				const h = (hsl[0] + offset) % 360;
				const s = hsl[1];
				const l = hsl[2];
				const rgb = hslToRgb(h, s, l);
				pixels[i + 0] = rgb[0];
				pixels[i + 1] = rgb[1];
				pixels[i + 2] = rgb[2];
			}
			console.info('[Bitmap.rotateHue] Rotate hue on canvas is slow.');
			context.putImageData(imageData, 0, 0);
			this._setDirty();
		}
	}

	/**
	 * Applies a blur effect to the bitmap.
	 *
	 * @method blur
	 */
	blur() {
		for (let i = 0; i < 2; i++) {
			const w = this.width;
			const h = this.height;
			const canvas = this._canvas;
			const context = this._context;
			const tempCanvas = document.createElement('canvas');
			const tempContext = tempCanvas.getContext('2d');
			console.info('[Bitmap.blur] Blur on canvas is slow.');
			tempCanvas.width = w + 2;
			tempCanvas.height = h + 2;
			tempContext.drawImage(canvas, 0, 0, w, h, 1, 1, w, h);
			tempContext.drawImage(canvas, 0, 0, w, 1, 1, 0, w, 1);
			tempContext.drawImage(canvas, 0, 0, 1, h, 0, 1, 1, h);
			tempContext.drawImage(canvas, 0, h - 1, w, 1, 1, h + 1, w, 1);
			tempContext.drawImage(canvas, w - 1, 0, 1, h, w + 1, 1, 1, h);
			context.save();
			context.fillStyle = 'black';
			context.fillRect(0, 0, w, h);
			context.globalCompositeOperation = 'lighter';
			context.globalAlpha = 1 / 9;
			for (let y = 0; y < 3; y++) {
				for (let x = 0; x < 3; x++) {
					context.drawImage(tempCanvas, x, y, w, h, 0, 0, w, h);
				}
			}
			context.restore();
		}
		this._setDirty();
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
			listner(this);
		}
	}

	/**
	 * @method _makeFontNameText
	 * @private
	 */
	_makeFontNameText() {
		return `${(this.fontItalic ? 'Italic ' : '') + this.fontSize}px ${
			this.fontFace
		}`;
	}

	/**
	 * @method _drawTextOutline
	 * @param {String} text
	 * @param {Number} tx
	 * @param {Number} ty
	 * @param {Number} maxWidth
	 * @private
	 */
	_drawTextOutline(text, tx, ty, maxWidth) {
		const context = this._context;
		context.strokeStyle = this.outlineColor;
		context.lineWidth = this.outlineWidth;
		context.lineJoin = 'round';
		context.strokeText(text, tx, ty, maxWidth);
	}

	/**
	 * @method _drawTextBody
	 * @param {String} text
	 * @param {Number} tx
	 * @param {Number} ty
	 * @param {Number} maxWidth
	 * @private
	 */
	_drawTextBody(text, tx, ty, maxWidth) {
		const context = this._context;
		context.fillStyle = this.textColor;
		context.fillText(text, tx, ty, maxWidth);
	}

	/**
	 * @method _onLoad
	 * @private
	 */
	_onLoad() {
		this._image.removeEventListener('load', this._loadListener);
		this._image.removeEventListener('error', this._errorListener);

		this._renewCanvas();

		switch (this._loadingState) {
			case 'requesting':
				this._loadingState = 'requestCompleted';
				if (this._decodeAfterRequest) {
					this.decode();
				} else {
					this._loadingState = 'purged';
					this._clearImgInstance();
				}
				break;

			case 'decrypting':
				window.URL.revokeObjectURL(this._image.src);
				this._loadingState = 'decryptCompleted';
				if (this._decodeAfterRequest) {
					this.decode();
				} else {
					this._loadingState = 'purged';
					this._clearImgInstance();
				}
				break;
		}
	}

	decode() {
		switch (this._loadingState) {
			case 'requestCompleted':
			case 'decryptCompleted':
				this._loadingState = 'loaded';

				if (!this.__canvas) this._createBaseTexture(this._image);
				this._setDirty();
				this._callLoadListeners();
				break;

			case 'requesting':
			case 'decrypting':
				this._decodeAfterRequest = true;
				if (!this._loader) {
					this._loader = ResourceHandler.createLoader(
						this._url,
						this._requestImage.bind(this, this._url),
						this._onError.bind(this)
					);
					this._image.removeEventListener('error', this._errorListener);
					this._image.addEventListener(
						'error',
						(this._errorListener = this._loader)
					);
				}
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
		this._image.removeEventListener('load', this._loadListener);
		this._image.removeEventListener('error', this._errorListener);
		this._loadingState = 'error';
	}

	/**
	 * @method _setDirty
	 * @private
	 */
	_setDirty() {
		this._dirty = true;
	}

	/**
	 * updates texture is bitmap was dirty
	 * @method checkDirty
	 */
	checkDirty() {
		if (this._dirty) {
			this._baseTexture.update();
			const baseTexture = this._baseTexture;
			setTimeout(() => {
				baseTexture.update();
			}, 0);
			this._dirty = false;
		}
	}

	_requestImage(url) {
		if (Bitmap._reuseImages.length !== 0) {
			this._image = Bitmap._reuseImages.pop();
		} else {
			this._image = new Image();
		}

		if (this._decodeAfterRequest && !this._loader) {
			this._loader = ResourceHandler.createLoader(
				url,
				this._requestImage.bind(this, url),
				this._onError.bind(this)
			);
		}

		this._url = url;
		this._loadingState = 'requesting';

		if (!Decrypter.checkImgIgnore(url) && Decrypter.hasEncryptedImages) {
			this._loadingState = 'decrypting';
			Decrypter.decryptImg(url, this);
		} else {
			this._image.src = url;

			this._image.addEventListener(
				'load',
				(this._loadListener = Bitmap.prototype._onLoad.bind(this))
			);
			this._image.addEventListener(
				'error',
				(this._errorListener =
					this._loader || Bitmap.prototype._onError.bind(this))
			);
		}
	}

	isRequestOnly() {
		return !(this._decodeAfterRequest || this.isReady());
	}

	isRequestReady() {
		return (
			this._loadingState !== 'pending' &&
			this._loadingState !== 'requesting' &&
			this._loadingState !== 'decrypting'
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
		const context = bitmap._context;
		const renderTexture = PIXI.RenderTexture.create({
			width,
			height,
		});
		if (stage) {
			Graphics._renderer.render(stage, {
				renderTexture,
			});
			stage.worldTransform.identity();
			let canvas = null;
			if (Graphics.isWebGL()) {
				canvas = Graphics._renderer.plugins.extract.canvas(renderTexture);
			} else {
				canvas = renderTexture.baseTexture._canvasRenderTarget.canvas;
			}
			context.drawImage(canvas, 0, 0);
		} else {
		}
		renderTexture.destroy({
			destroyBase: true,
		});
		bitmap._setDirty();
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
			if (!this.__baseTexture)
				this._createBaseTexture(this._image || this.__canvas);
			return this.__baseTexture;
		},
	},
});

export default Bitmap;
