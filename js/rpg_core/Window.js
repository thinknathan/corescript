//-----------------------------------------------------------------------------
/**
 * The window in the game.
 *
 * @class Window
 * @constructor
 */
class Window extends PIXI.Container {
	constructor(...args) {
		super(...args);
		this.initialize(...args);
	}

	initialize() {
		PIXI.Container.call(this);

		this._isWindow = true;
		this._windowskin = null;
		this._width = 0;
		this._height = 0;
		this._cursorRect = new Rectangle();
		this._openness = 255;
		this._animationCount = 0;

		this._padding = 18;
		this._margin = 4;
		this._colorTone = [0, 0, 0];

		this._windowSpriteContainer = null;
		this._windowBackSprite = null;
		this._windowCursorSprite = null;
		this._windowFrameSprite = null;
		this._windowContentsSprite = null;
		this._windowArrowSprites = [];
		this._windowPauseSignSprite = null;

		this._createAllParts();

		/**
		 * The origin point of the window for scrolling.
		 *
		 * @property origin
		 * @type Point
		 */
		this.origin = new Point();

		/**
		 * The active state for the window.
		 *
		 * @property active
		 * @type Boolean
		 */
		this.active = true;

		/**
		 * The visibility of the down scroll arrow.
		 *
		 * @property downArrowVisible
		 * @type Boolean
		 */
		this.downArrowVisible = false;

		/**
		 * The visibility of the up scroll arrow.
		 *
		 * @property upArrowVisible
		 * @type Boolean
		 */
		this.upArrowVisible = false;

		/**
		 * The visibility of the pause sign.
		 *
		 * @property pause
		 * @type Boolean
		 */
		this.pause = false;
	}

	/**
	 * The image used as a window skin.
	 *
	 * @property windowskin
	 * @type Bitmap
	 */
	get windowskin() {
		return this._windowskin;
	}

	set windowskin(value) {
		if (this._windowskin !== value) {
			this._windowskin = value;
			this._windowskin.addLoadListener(this._onWindowskinLoad.bind(this));
		}
	}

	/**
	 * The bitmap used for the window contents.
	 *
	 * @property contents
	 * @type Bitmap
	 */
	get contents() {
		return this._windowContentsSprite.children[0];
	}

	set contents(value) {
		const oldContents = this._windowContentsSprite.children[0];
		if (oldContents) {
			this._windowContentsSprite.removeChild(oldContents);
		}
		this._windowContentsSprite.addChild(value);
	}

	/**
	 * The width of the window in pixels.
	 *
	 * @property width
	 * @type Number
	 */
	get width() {
		return this._width;
	}

	set width(value) {
		this._width = value;
		this._refreshAllParts();
	}

	/**
	 * The height of the window in pixels.
	 *
	 * @property height
	 * @type Number
	 */
	get height() {
		return this._height;
	}

	set height(value) {
		this._height = value;
		this._refreshAllParts();
	}

	/**
	 * The size of the padding between the frame and contents.
	 *
	 * @property padding
	 * @type Number
	 */
	get padding() {
		return this._padding;
	}

	set padding(value) {
		this._padding = value;
		this._refreshAllParts();
	}

	/**
	 * The size of the margin for the window background.
	 *
	 * @property margin
	 * @type Number
	 */
	get margin() {
		return this._margin;
	}

	set margin(value) {
		this._margin = value;
		this._refreshAllParts();
	}

	/**
	 * The opacity of the window without contents (0 to 255).
	 *
	 * @property opacity
	 * @type Number
	 */
	get opacity() {
		return this._windowSpriteContainer.alpha * 255;
	}

	set opacity(value) {
		this._windowSpriteContainer.alpha = value.clamp(0, 255) / 255;
	}

	/**
	 * The opacity of the window background (0 to 255).
	 *
	 * @property backOpacity
	 * @type Number
	 */
	get backOpacity() {
		return this._windowBackSprite.alpha * 255;
	}

	set backOpacity(value) {
		this._windowBackSprite.alpha = value.clamp(0, 255) / 255;
	}

	/**
	 * The opacity of the window contents (0 to 255).
	 *
	 * @property contentsOpacity
	 * @type Number
	 */
	get contentsOpacity() {
		return this._windowContentsSprite.alpha * 255;
	}

	set contentsOpacity(value) {
		this._windowContentsSprite.alpha = value.clamp(0, 255) / 255;
	}

	/**
	 * The openness of the window (0 to 255).
	 *
	 * @property openness
	 * @type Number
	 */
	get openness() {
		return this._openness;
	}

	set openness(value) {
		if (this._openness !== value) {
			this._openness = value.clamp(0, 255);
			this._windowSpriteContainer.scale.y = this._openness / 255;
			this._windowSpriteContainer.y = this.height / 2 * (1 - this._openness / 255);
		}
	}

	/**
	 * Updates the window for each frame.
	 *
	 * @method update
	 */
	update() {
		if (this.active) {
			this._animationCount++;
		}
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
	 * @param {Number} x The x coordinate of the window
	 * @param {Number} y The y coordinate of the window
	 * @param {Number} width The width of the window
	 * @param {Number} height The height of the window
	 */
	move(x, y, width, height) {
		this.x = Math.floor(x || 0);
		this.y = Math.floor(y || 0);
		if (this._width !== width || this._height !== height) {
			this._width = Math.floor(width || 0);
			this._height = Math.floor(height || 0);
			this._refreshAllParts();
		}
	}

	/**
	 * Returns true if the window is completely open (openness == 255).
	 *
	 * @method isOpen
	 */
	isOpen() {
		return this._openness >= 255;
	}

	/**
	 * Returns true if the window is completely closed (openness == 0).
	 *
	 * @method isClosed
	 */
	isClosed() {
		return this._openness <= 0;
	}

	/**
	 * Sets the position of the command cursor.
	 *
	 * @method setCursorRect
	 * @param {Number} x The x coordinate of the cursor
	 * @param {Number} y The y coordinate of the cursor
	 * @param {Number} width The width of the cursor
	 * @param {Number} height The height of the cursor
	 */
	setCursorRect(x, y, width, height) {
		const cx = Math.floor(x || 0);
		const cy = Math.floor(y || 0);
		const cw = Math.floor(width || 0);
		const ch = Math.floor(height || 0);
		const rect = this._cursorRect;
		if (rect.x !== cx || rect.y !== cy || rect.width !== cw || rect.height !== ch) {
			this._cursorRect.x = cx;
			this._cursorRect.y = cy;
			this._cursorRect.width = cw;
			this._cursorRect.height = ch;
			this._refreshCursor();
		}
	}

	/**
	 * Changes the color of the background.
	 *
	 * @method setTone
	 * @param {Number} r The red value in the range (-255, 255)
	 * @param {Number} g The green value in the range (-255, 255)
	 * @param {Number} b The blue value in the range (-255, 255)
	 */
	setTone(r, g, b) {
		const tone = this._colorTone;
		r = r / 255;
		g = g / 255;
		b = b / 255;
		if (r < 0) r = 0;
		if (g < 0) g = 0;
		if (b < 0) b = 0;
		if (r !== tone[0] || g !== tone[1] || b !== tone[2]) {
			this._colorTone = [r, g, b];
			this._refreshBack();
		}
	}

	/**
	 * Adds a child between the background and contents.
	 *
	 * @method addChildToBack
	 * @param {Object} child The child to add
	 * @return {Object} The child that was added
	 */
	addChildToBack(child) {
		const containerIndex = this.children.indexOf(this._windowSpriteContainer);
		return this.addChildAt(child, containerIndex + 1);
	}

	/**
	 * @method updateTransform
	 * @private
	 */
	updateTransform() {
		this._updateCursor();
		this._updateArrows();
		this._updatePauseSign();
		this._updateContents();
		super.updateTransform();
	}

	/**
	 * @method _createAllParts
	 * @private
	 */
	_createAllParts() {
		this._windowSpriteContainer = new PIXI.Container();
		this._windowBackSprite = new BitmapPIXI();
		this._windowCursorSprite = new BitmapPIXI();
		this._windowFrameSprite = new PIXI.Container();
		this._windowContentsSprite = new Sprite();
		this._downArrowSprite = new Sprite();
		this._upArrowSprite = new Sprite();
		this._windowPauseSignSprite = new Sprite();
		this._windowBackSprite.alpha = 192 / 255;
		this.addChild(this._windowSpriteContainer);
		this._windowSpriteContainer.addChild(this._windowBackSprite);
		this._windowSpriteContainer.addChild(this._windowFrameSprite);
		this.addChild(this._windowCursorSprite);
		this.addChild(this._windowContentsSprite);
		this.addChild(this._downArrowSprite);
		this.addChild(this._upArrowSprite);
		this.addChild(this._windowPauseSignSprite);
	}

	/**
	 * @method _onWindowskinLoad
	 * @private
	 */
	_onWindowskinLoad() {
		this._refreshAllParts();
	}

	/**
	 * @method _refreshAllParts
	 * @private
	 */
	_refreshAllParts() {
		this._refreshBack();
		this._refreshFrame();
		this._refreshCursor();
		this._refreshContents();
		this._refreshArrows();
		this._refreshPauseSign();
	}

	/**
	 * @method _refreshBack
	 * @private
	 */
	_refreshBack() {
		const m = this._margin;
		const w = this._width - m * 2;
		const h = this._height - m * 2;
		const tone = PIXI.utils.rgb2hex(this._colorTone);

		if (w > 0 && h > 0 && this._windowskin && !this._windowBackSprite._setupComplete) {
			const p = 96;
			this._windowBackSprite.blt(this._windowskin, 0, 0, p, p, 0, 0, w, h);
			this._windowBackSprite.addChild(
				this._windowBackSprite.createTilingSprite(this._windowskin.baseTexture, 0, p, p, p, w, h)
			);

			this._windowBackSprite._setupComplete = true;
		}

		this._windowBackSprite.width = w;
		this._windowBackSprite.height = h;
		this._windowBackSprite.x = m;
		this._windowBackSprite.y = m;
		this._windowBackSprite.children.forEach(child => {
			if (child) {
				child.width = w;
				child.height = h;
				child.tint = tone;
			}
		});
	}

	/**
	 * @method _refreshFrame
	 * @private
	 */
	_refreshFrame() {
		const w = this._width;
		const h = this._height;
		const m = 24;

		if (w > 0 && h > 0 && this._windowskin && !this._windowFrameSprite._setupComplete) {
			let texture;
			const cachedFrame = WindowSkinCache.getItem(this._windowskin._url, 'frame');
			if (cachedFrame) {
				texture = cachedFrame;
			} else {
				const container = new BitmapPIXI();
				const skin = this._windowskin;
				const p = 96;
				const q = 96;
				container.blt(skin, p + m, 0 + 0, p - m * 2, m, m, 0, w - m * 2, m);
				container.blt(skin, p + m, 0 + q - m, p - m * 2, m, m, h - m, w - m * 2, m);
				container.blt(skin, p + 0, 0 + m, m, p - m * 2, 0, m, m, h - m * 2);
				container.blt(skin, p + q - m, 0 + m, m, p - m * 2, w - m, m, m, h - m * 2);
				container.blt(skin, p + 0, 0 + 0, m, m, 0, 0, m, m);
				container.blt(skin, p + q - m, 0 + 0, m, m, w - m, 0, m, m);
				container.blt(skin, p + 0, 0 + q - m, m, m, 0, h - m, m, m);
				container.blt(skin, p + q - m, 0 + q - m, m, m, w - m, h - m, m, m);
				texture = Graphics._renderer.generateTexture(container);
				container.destroy({
					children: true,
					texture: true,
				});
				WindowSkinCache.setItem(this._windowskin._url, texture, 'frame');
			}

			this._windowFramePlane = new PIXI.NineSlicePlane(texture, 12, 12, 12, 12);
			this._windowFrameSprite.addChild(this._windowFramePlane);
			this._windowFrameSprite._setupComplete = true;
		}

		if (this._windowFrameSprite._setupComplete) {
			this._windowFramePlane.width = w;
			this._windowFramePlane.height = h;
		}
	}

	/**
	 * @method _refreshCursor
	 * @private
	 */
	_refreshCursor() {
		const pad = this._padding;
		const x = this._cursorRect.x + pad - this.origin.x;
		const y = this._cursorRect.y + pad - this.origin.y;
		const w = this._cursorRect.width;
		const h = this._cursorRect.height;

		if (w > 0 && h > 0 && this._windowskin && !this._windowCursorSprite._setupComplete) {
			const p = 96;
			const q = 48;
			this._windowCursorPlane = this._windowCursorSprite.create9Slice(this._windowskin.baseTexture, p, p, q, q, 12, 12, 12, 12);
			this._windowCursorSprite.addChild(
				this._windowCursorPlane
			);
			this._windowCursorSprite._setupComplete = true;
		}

		if (this._windowCursorPlane) {
			this._windowCursorPlane.x = x;
			this._windowCursorPlane.y = y;
			this._windowCursorPlane.width = w;
			this._windowCursorPlane.height = h;
		}
	}

	/**
	 * @method _refreshContents
	 * @private
	 */
	_refreshContents() {
		this._windowContentsSprite.move(this.padding, this.padding);
		if (this._windowContentsSprite.children.length) this._windowContentsSprite.children[0].clear();
	}

	/**
	 * @method _refreshArrows
	 * @private
	 */
	_refreshArrows() {
		const w = this._width;
		const h = this._height;
		const p = 24;
		const q = p / 2;
		const sx = 96 + p;
		const sy = 0 + p;
		this._downArrowSprite.bitmap = this._windowskin;
		this._downArrowSprite.anchor.x = 0.5;
		this._downArrowSprite.anchor.y = 0.5;
		this._downArrowSprite.setFrame(sx + q, sy + q + p, p, q);
		this._downArrowSprite.move(w / 2, h - q);
		this._upArrowSprite.bitmap = this._windowskin;
		this._upArrowSprite.anchor.x = 0.5;
		this._upArrowSprite.anchor.y = 0.5;
		this._upArrowSprite.setFrame(sx + q, sy, p, q);
		this._upArrowSprite.move(w / 2, q);
	}

	/**
	 * @method _refreshPauseSign
	 * @private
	 */
	_refreshPauseSign() {
		const sx = 144;
		const sy = 96;
		const p = 24;
		this._windowPauseSignSprite.bitmap = this._windowskin;
		this._windowPauseSignSprite.anchor.x = 0.5;
		this._windowPauseSignSprite.anchor.y = 1;
		this._windowPauseSignSprite.move(this._width / 2, this._height);
		this._windowPauseSignSprite.setFrame(sx, sy, p, p);
		this._windowPauseSignSprite.alpha = 0;
	}

	/**
	 * @method _updateCursor
	 * @private
	 */
	_updateCursor() {
		const blinkCount = this._animationCount % 40;
		let cursorOpacity = this.contentsOpacity;
		if (this.active) {
			if (blinkCount < 20) {
				cursorOpacity -= blinkCount * 8;
			} else {
				cursorOpacity -= (40 - blinkCount) * 8;
			}
		}
		this._windowCursorSprite.alpha = cursorOpacity / 255;
		this._windowCursorSprite.visible = this.isOpen();
	}

	/**
	 * @method _updateContents
	 * @private
	 */
	_updateContents() {
		const w = this._width - this._padding * 2;
		const h = this._height - this._padding * 2;
		if (w > 0 && h > 0) {
			this._windowContentsSprite.setFrame(this.origin.x, this.origin.y, w, h);
			this._windowContentsSprite.visible = this.isOpen();
		} else {
			this._windowContentsSprite.visible = false;
		}
	}

	/**
	 * @method _updateArrows
	 * @private
	 */
	_updateArrows() {
		this._downArrowSprite.visible = this.isOpen() && this.downArrowVisible;
		this._upArrowSprite.visible = this.isOpen() && this.upArrowVisible;
	}

	/**
	 * @method _updatePauseSign
	 * @private
	 */
	_updatePauseSign() {
		const sprite = this._windowPauseSignSprite;
		const x = Math.floor(this._animationCount / 16) % 2;
		const y = Math.floor(this._animationCount / 16 / 2) % 2;
		const sx = 144;
		const sy = 96;
		const p = 24;
		if (!this.pause) {
			sprite.alpha = 0;
		} else if (sprite.alpha < 1) {
			sprite.alpha = Math.min(sprite.alpha + 0.1, 1);
		}
		sprite.setFrame(sx + x * p, sy + y * p, p, p);
		sprite.visible = this.isOpen();
	}

	// The important members from Pixi.js

	/**
	 * The visibility of the window.
	 *
	 * @property visible
	 * @type Boolean
	 */

	/**
	 * The x coordinate of the window.
	 *
	 * @property x
	 * @type Number
	 */

	/**
	 * The y coordinate of the window.
	 *
	 * @property y
	 * @type Number
	 */

	/**
	 * [read-only] The array of children of the window.
	 *
	 * @property children
	 * @type Array
	 */

	/**
	 * [read-only] The object that contains the window.
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

export default Window;
