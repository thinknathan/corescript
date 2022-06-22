import * as PIXI from "../libs/pixi.js";
import Point from "../rpg_core/Point.js";
import Rectangle from "../rpg_core/Rectangle.js";
import Sprite from "../rpg_core/Sprite.js";

//-----------------------------------------------------------------------------
/**
 * The sprite object for a tiling image.
 *
 * @class TilingSprite
 * @constructor
 * @param {Bitmap} bitmap The image for the tiling sprite
 */
class TilingSprite extends PIXI.TilingSprite {
	constructor(...args) {
		super(...args);
		this.initialize(...args);
	}

	initialize(bitmap) {
		const texture = new PIXI.Texture(new PIXI.BaseTexture());

		PIXI.TilingSprite.call(this, texture);

		this._bitmap = null;
		this._width = 0;
		this._height = 0;
		this._frame = new Rectangle();
		this.spriteId = Sprite._counter++;
		/**
		 * The origin point of the tiling sprite for scrolling.
		 *
		 * @property origin
		 * @type Point
		 */
		this.origin = new Point();

		this.bitmap = bitmap;
	}

	/**
	 * @method _renderCanvas
	 * @param {Object} renderer
	 * @private
	 */
	_renderCanvas(renderer) {
		if (this._bitmap) {
			this._bitmap.touch();
		}
		if (this.texture.frame.width > 0 && this.texture.frame.height > 0) {
			this._renderCanvas_PIXI(renderer);
		}
	}

	/**
	 * The image for the tiling sprite.
	 *
	 * @property bitmap
	 * @type Bitmap
	 */
	get bitmap() {
		return this._bitmap;
	}

	set bitmap(value) {
		if (this._bitmap !== value) {
			this._bitmap = value;
			if (this._bitmap) {
				this._bitmap.addLoadListener(this._onBitmapLoad.bind(this));
			} else {
				this.texture.frame = Rectangle.emptyRectangle;
			}
		}
	}

	/**
	 * The opacity of the tiling sprite (0 to 255).
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
	 * Updates the tiling sprite for each frame.
	 *
	 * @method update
	 */
	update() {
		this.children.forEach(child => {
			if (child.update) {
				child.update();
			}
		});
	}

	/**
	 * Sets the x, y, width, and height all at once.
	 *
	 * @method move
	 * @param {Number} x The x coordinate of the tiling sprite
	 * @param {Number} y The y coordinate of the tiling sprite
	 * @param {Number} width The width of the tiling sprite
	 * @param {Number} height The height of the tiling sprite
	 */
	move(x, y, width, height) {
		this.x = x || 0;
		this.y = y || 0;
		this._width = width || 0;
		this._height = height || 0;
	}

	/**
	 * Specifies the region of the image that the tiling sprite will use.
	 *
	 * @method setFrame
	 * @param {Number} x The x coordinate of the frame
	 * @param {Number} y The y coordinate of the frame
	 * @param {Number} width The width of the frame
	 * @param {Number} height The height of the frame
	 */
	setFrame(x, y, width, height) {
		this._frame.x = x;
		this._frame.y = y;
		this._frame.width = width;
		this._frame.height = height;
		this._refresh();
	}

	/**
	 * @method updateTransform
	 * @private
	 */
	updateTransform() {
		this.tilePosition.x = Math.round(-this.origin.x);
		this.tilePosition.y = Math.round(-this.origin.y);
		this.updateTransformTS();
	}

	/**
	 * @method _onBitmapLoad
	 * @private
	 */
	_onBitmapLoad() {
		this.texture.baseTexture = this._bitmap.baseTexture;
		this._refresh();
	}

	/**
	 * @method _refresh
	 * @private
	 */
	_refresh() {
		const frame = this._frame.clone();
		if (frame.width === 0 && frame.height === 0 && this._bitmap) {
			frame.width = this._bitmap.width;
			frame.height = this._bitmap.height;
		}
		this.texture.frame = frame;
		this.texture._updateID++;
		this.tilingTexture = null;
	}

	/**
	 * @method _render
	 * @param {Object} renderer
	 * @private
	 */
	_render(renderer) {
		if (this._bitmap) {
			this._bitmap.touch();
			this._bitmap.checkDirty();
		}

		this._render_PIXI(renderer);
	}

	// The important members from Pixi.js

	/**
	 * The visibility of the tiling sprite.
	 *
	 * @property visible
	 * @type Boolean
	 */

	/**
	 * The x coordinate of the tiling sprite.
	 *
	 * @property x
	 * @type Number
	 */

	/**
	 * The y coordinate of the tiling sprite.
	 *
	 * @property y
	 * @type Number
	 */
}

TilingSprite.prototype._renderCanvas_PIXI = PIXI.TilingSprite.prototype._renderCanvas;
TilingSprite.prototype._render_PIXI = PIXI.TilingSprite.prototype._render;

TilingSprite.prototype.updateTransformTS = PIXI.TilingSprite.prototype.updateTransform;

export default TilingSprite;
