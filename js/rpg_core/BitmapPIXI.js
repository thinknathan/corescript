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
    this.width = width;
    this.height = height;

    this._bitmap = new Bitmap(width, height);
    this._image = null;
    this._url = '';
    this._paintOpacity = 255;
    this._smooth = false;
    this._loadListeners = [];
    this._loadingState = 'none';
    this._decodeAfterRequest = false;
    this.cacheEntry = null;

    this.textPadding = 2; // Adjust this if text is cut-off
    this.wordWrap = false;
    this.wordWrapWidth = 0;
    this.fontFace = 'GameFont';
    this.fontSize = 28;
    this.fontItalic = false;
    this.textColor = '#ffffff';
    this.outlineColor = 'rgba(0, 0, 0, 0.5)';
    this.outlineWidth = 4;
};

BitmapPIXI.prototype._renderCanvas_PIXI = PIXI.Container.prototype._renderCanvas;
BitmapPIXI.prototype._render_PIXI = PIXI.Container.prototype._render;

BitmapPIXI.prototype._renderCanvas = function (renderer) {
    if (this._bitmap) {
        this._bitmap.checkDirty();
    }
    this._renderCanvas_PIXI(renderer);
};

BitmapPIXI.prototype._render = function (renderer) {
    if (this._bitmap) {
        this._bitmap.checkDirty();
    }
    this._render_PIXI(renderer);
};

Object.defineProperty(BitmapPIXI.prototype, 'paintOpacity', {
    get: function () {
        return this._paintOpacity;
    },
    set: function (value) {
        if (this._paintOpacity !== value) {
            this._paintOpacity = value;
            this.alpha = this._paintOpacity / 255;
            if (this._bitmap) this._bitmap.paintOpacity = value;
        }
    },
    configurable: true
});





BitmapPIXI.prototype.load = function (url) {
    return this._bitmap.load(url);
};

BitmapPIXI.prototype.addLoadListener = function (listener) {
    return this._bitmap.addLoadListener(listener);
};

BitmapPIXI.prototype.touch = function () {
    return this._bitmap.touch();
};

BitmapPIXI.prototype.isReady = function (listener) {
    return this._bitmap.isReady(listener);
};





BitmapPIXI.prototype.clear = function () {
    for (let i = this.children.length - 1; i >= 0; i--) {
        this.removeChild(this.children[i]);
    };
};

BitmapPIXI.prototype.clearRect = function (x, y, width, height) {
    let self = this;
    let toRemove = [];

    this.children.forEach(function (child) {
        if (child &&
            (child.x >= x && child.x < x + width) &&
            (child.y >= y && child.y < y + height)
        ) {
            toRemove.push(child);
        }
    });

    toRemove.forEach(function (child) {
        self.removeChild(child);
    });
};





BitmapPIXI.prototype.drawText = function (text, x, y, maxWidth, lineHeight, align) {
    let style = {
        fontFamily: this.fontFace,
        fontSize: this.fontSize,
        fill: PIXI.utils.string2hex(this.textColor),
        lineHeight: lineHeight,
        wordWrap: this.wordWrap,
        wordWrapWidth: this.wordWrapWidth,
        padding: this.textPadding,
        fontStyle: this.fontItalic ? 'italic' : 'normal',
        stroke: this.outlineColor,
        strokeThickness: this.outlineWidth,
    };

    let pixiText = new PIXI.Text(text, style);
    pixiText.x = x;
    pixiText.y = y + lineHeight - Math.round(this.fontSize);
    maxWidth = maxWidth || 0xffffffff;
    if (align == 'center') {
        pixiText.anchor.set(0.5, 0);
        pixiText.x = x + (maxWidth / 2);
    } else if (align == 'right') {
        pixiText.anchor.set(1, 0);
        pixiText.x = x + maxWidth;
    }

    if (pixiText) this.addChild(pixiText);
};

BitmapPIXI.prototype.measureTextWidth = function (text) { 
    let style = {
        fontFamily: this.fontFace,
        fontSize: this.fontSize,
        padding: this.textPadding,
    };
    let pixiText = new PIXI.Text(text, style);
    let width = pixiText.width;
    pixiText.destroy(true);
    return width;
};





BitmapPIXI.prototype.createCroppedSprite = function (source, x, y, w, h) {
    return new PIXI.Sprite(
        new PIXI.Texture(
            source,
            new PIXI.Rectangle(x, y, w, h)
        )
    );
};

BitmapPIXI.prototype.blt = function (source, sx, sy, sw, sh, dx, dy, dw, dh) {
    dw = dw || sw;
    dh = dh || sh;
    if (sx >= 0 && sy >= 0 && sw > 0 && sh > 0 && dw > 0 && dh > 0 &&
        sx + sw <= source.width && sy + sh <= source.height) {
        let sprite = this.createCroppedSprite(source.__baseTexture, sx, sy, sw, sh);
        sprite.x = dx;
        sprite.y = dy;
        sprite.width = dw;
        sprite.height = dh;
        if (sprite) this.addChild(sprite);
    }
};

BitmapPIXI.prototype.fillRect = function (x, y, width, height, color) {
    const rectangle = new PIXI.Graphics();
    color = PIXI.utils.string2hex(color);
    rectangle.beginFill(color);
    rectangle.drawRect(
        x,
        y,
        width,
        height,
    );
    rectangle.endFill();
    if (rectangle) this.addChild(rectangle);
};

BitmapPIXI.prototype.gradientFillRect = function (x, y, width, height, color1, color2, vertical) {
    const rectangle = this.fillRect(x, y, width, height, color1);
    if (rectangle) this.addChild(rectangle);
};

BitmapPIXI.prototype.drawCircle = function (x, y, radius, color) {
    const circle = new PIXI.Graphics();
    color = PIXI.utils.string2hex(color);
    circle.beginFill(color);
    circle.drawCircle(
        x,
        y,
        radius,
    );
    circle.endFill();
    if (circle) this.addChild(circle);
};
