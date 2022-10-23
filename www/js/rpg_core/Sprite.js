import * as PIXI from '../libs/pixi-webworker.mjs';
import Rectangle from '../rpg_core/Rectangle.js';
import Graphics from '../rpg_core/Graphics.js';
import Utils from '../rpg_core/Utils.js';

//-----------------------------------------------------------------------------
/**
 * The basic object that is rendered to the game screen.
 *
 * @class Sprite
 * @constructor
 * @param {Bitmap} bitmap The image for the sprite
 */
class Sprite extends PIXI.Sprite {
	constructor(...args) {
		super(...args);
		this.initialize(...args);
	}

	initialize(bitmap) {
		this.filters = null;
		this._bitmap = null;
		this._frame = new Rectangle();
		this._realFrame = new Rectangle();
		this._blendColor = [0, 0, 0, 0];
		this._colorTone = [0, 0, 0, 0];
		this._canvas = null;
		this._context = null;
		this._tintTexture = null;
		this._colorMatrixFilter = null;

		this.spriteId = Sprite._counter++;
		this.opaque = false;

		this.bitmap = bitmap;
		this.on('removed', this.onRemoveAsAChild);
	}

	/**
	 * Nullify filters when the sprite is removed.
	 *
	 * @method _onRemoveAsAChild
	 * @private
	 */
	onRemoveAsAChild() {
		this.filters = null;
	}

	/**
	 * The image for the sprite.
	 *
	 * @property bitmap
	 * @type Bitmap
	 */
	get bitmap() {
		console.log('DEPRECATED: Sprite.bitmap (getter)');
	}

	set bitmap(value) {
		console.log('DEPRECATED: Sprite.bitmap (setter)');
	}

	/**
	 * The width of the sprite without the scale.
	 *
	 * @property width
	 * @type Number
	 */
	get width() {
		return this._frame.width;
	}

	set width(value) {
		this._frame.width = value;
		this._refresh();
	}

	/**
	 * The height of the sprite without the scale.
	 *
	 * @property height
	 * @type Number
	 */
	get height() {
		return this._frame.height;
	}

	set height(value) {
		this._frame.height = value;
		this._refresh();
	}

	/**
	 * The opacity of the sprite (0 to 255).
	 *
	 * @property opacity
	 * @type Number
	 */
	get opacity() {
		return this.alpha * 255;
	}

	set opacity(value) {
		this.alpha = value.clamp(0, 255) / 255;
	}

	/**
	 * Updates the sprite for each frame.
	 *
	 * @method update
	 */
	update() {
		this.children.forEach((child) => {
			if (child.update) {
				child.update();
			}
		});
	}

	/**
	 * Sets the x and y at once.
	 *
	 * @method move
	 * @param {Number} x The x coordinate of the sprite
	 * @param {Number} y The y coordinate of the sprite
	 */
	move(x, y) {
		this.x = x;
		this.y = y;
	}

	/**
	 * Sets the rectagle of the bitmap that the sprite displays.
	 *
	 * @method setFrame
	 * @param {Number} x The x coordinate of the frame
	 * @param {Number} y The y coordinate of the frame
	 * @param {Number} width The width of the frame
	 * @param {Number} height The height of the frame
	 */
	setFrame(x, y, width, height) {
		this._refreshFrame = false;
		const frame = this._frame;
		if (
			x !== frame.x ||
			y !== frame.y ||
			width !== frame.width ||
			height !== frame.height
		) {
			frame.x = x;
			frame.y = y;
			frame.width = width;
			frame.height = height;
			this._refresh();
		}
	}

	/**
	 * Gets the blend color for the sprite.
	 *
	 * @method getBlendColor
	 * @return {Array} The blend color [r, g, b, a]
	 */
	getBlendColor() {
		return this._blendColor.clone();
	}

	/**
	 * Sets the blend color for the sprite.
	 *
	 * @method setBlendColor
	 * @param {Array} color The blend color [r, g, b, a]
	 */
	setBlendColor(color) {
		if (!(color instanceof Array)) {
			throw new Error('Argument must be an array');
		}
		if (!this._blendColor.equals(color)) {
			this._blendColor = color.clone();
			this._refresh();
		}
	}

	/**
	 * Gets the color tone for the sprite.
	 *
	 * @method getColorTone
	 * @return {Array} The color tone [r, g, b, gray]
	 */
	getColorTone() {
		return this._colorTone.clone();
	}

	/**
	 * Sets the color tone for the sprite.
	 *
	 * @method setColorTone
	 * @param {Array} tone The color tone [r, g, b, gray]
	 */
	setColorTone(tone) {
		if (!(tone instanceof Array)) {
			throw new Error('Argument must be an array');
		}
		if (!this._colorTone.equals(tone)) {
			this._colorTone = tone.clone();
			this._refresh();
		}
	}

	/**
	 * @method _refresh
	 * @private
	 */
	_refresh() {
		if (this._needsTint()) {
			this._createTinter();
			this._executeTint();
		} else {
			this._clearTint();
		}
	}

	/**
	 * @method _isInBitmapRect
	 * @param {Number} x
	 * @param {Number} y
	 * @param {Number} w
	 * @param {Number} h
	 * @return {Boolean}
	 * @private
	 */
	_isInBitmapRect(x, y, w, h) {
		console.log('DEPRECATED Sprite._isInBitmapRect');
	}

	/**
	 * @method _needsTint
	 * @return {Boolean}
	 * @private
	 */
	_needsTint() {
		const tone = this._colorTone;
		return tone[0] || tone[1] || tone[2] || tone[3] || this._blendColor[3] > 0;
	}

	/**
	 * @method _createTinter
	 * @private
	 */
	_createTinter() {
		if (!this.filters) {
			this.filters = [];
			if (this._frame) {
				this.filterArea = new PIXI.Rectangle(
					this._frame.x,
					this._frame.y,
					this._frame.width,
					this._frame.height
				);
			}
		}
		if (!this._colorMatrixFilter) {
			this._colorMatrixFilter = new PIXI.filters.ColorMatrixFilter();
			this.filters.push(this._colorMatrixFilter);
		}
		this._colorMatrixFilter.enabled = true;
	}

	/**
	 * @method _executeTint
	 * @private
	 */
	_executeTint() {
		const color = this._blendColor;
		const red = color[0] / 255;
		const green = color[1] / 255;
		const blue = color[2] / 255;
		const opacity = color[3] / 255;
		this._colorMatrixFilter.matrix = [
			red / 64,
			0,
			0,
			0,
			red,
			0,
			green / 64,
			0,
			0,
			green,
			0,
			0,
			blue / 64,
			0,
			blue,
			0,
			0,
			0,
			1,
			0,
		];
		this._colorMatrixFilter.alpha = opacity;
	}

	/**
	 * @method _clearTint
	 * @private
	 */
	_clearTint() {
		if (this._colorMatrixFilter) {
			this._colorMatrixFilter.enabled = false;
		}
	}

	// The important members from Pixi.js

	/**
	 * The visibility of the sprite.
	 *
	 * @property visible
	 * @type Boolean
	 */

	/**
	 * The x coordinate of the sprite.
	 *
	 * @property x
	 * @type Number
	 */

	/**
	 * The y coordinate of the sprite.
	 *
	 * @property y
	 * @type Number
	 */

	/**
	 * The origin point of the sprite. (0,0) to (1,1).
	 *
	 * @property anchor
	 * @type Point
	 */

	/**
	 * The scale factor of the sprite.
	 *
	 * @property scale
	 * @type Point
	 */

	/**
	 * The rotation of the sprite in radians.
	 *
	 * @property rotation
	 * @type Number
	 */

	/**
	 * The blend mode to be applied to the sprite.
	 *
	 * @property blendMode
	 * @type Number
	 */

	/**
	 * Sets the filters for the sprite.
	 *
	 * @property filters
	 * @type Array
	 */

	/**
	 * [read-only] The array of children of the sprite.
	 *
	 * @property children
	 * @type Array
	 */

	/**
	 * [read-only] The object that contains the sprite.
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
}

Sprite.voidFilter = new PIXI.filters.AlphaFilter();

// Number of the created objects.
Sprite._counter = 0;

export default Sprite;
