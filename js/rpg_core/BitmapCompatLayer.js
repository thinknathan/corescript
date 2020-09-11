//-----------------------------------------------------------------------------
/**
 * Compatibility layer that intercepts old Bitmap requests
 * and uses their PIXI equivalents
 *
 * @class BitmapCompatLayer
 * @constructor
 */
function BitmapCompatLayer() {
    this.initialize.apply(this, arguments);
}
BitmapCompatLayer.prototype = Object.create(PIXI.Container.prototype);
BitmapCompatLayer.prototype.constructor = BitmapCompatLayer;

BitmapCompatLayer.prototype.initialize = function (width, height) {
    PIXI.Container.call(this);
    this.width = width;
    this.height = height;
    this._bitmap = new Bitmap(width, height);
    //this._textLayer = new PIXI.Container();
    this.fontFace = 'GameFont';
    this.fontSize = 28;
    this.fontItalic = false;
    this.textColor = '#ffffff';
    //this.addChild(this._textLayer);
};

BitmapCompatLayer.prototype._renderCanvas_PIXI = PIXI.Container.prototype._renderCanvas;
BitmapCompatLayer.prototype._render_PIXI = PIXI.Container.prototype._render;

BitmapCompatLayer.prototype._renderCanvas = function (renderer) {
    if (this._bitmap) {
        this._bitmap.checkDirty();
    }
    this._renderCanvas_PIXI(renderer);
};

BitmapCompatLayer.prototype._render = function (renderer) {
    if (this._bitmap) {
        this._bitmap.checkDirty();
    }
    this._render_PIXI(renderer);
};

BitmapCompatLayer.prototype.load = function (url) {
    return this._bitmap.load(url);
};

/*
BitmapCompatLayer.prototype.setFrame = function (x, y, w, h) {
    return this._bitmap.setFrame(x, y, w, h);
};
*/

BitmapCompatLayer.prototype.addLoadListener = function (listener) {
    return this._bitmap.addLoadListener(listener);
};

BitmapCompatLayer.prototype.clear = function () {
    var self = this;
    this.children.forEach(function (child) {
        if (child) self.removeChild(child);
    });
};

BitmapCompatLayer.prototype.drawText = function (text, x, y, maxWidth, lineHeight, align) {
    //this._bitmap.drawText(text, x, y, maxWidth, lineHeight, align);

    var style = {
        fontFamily: this.fontFace,
        fontSize: this.fontSize,
        fill: PIXI.utils.string2hex(this.textColor),
        //align: align,
        lineHeight: lineHeight,
        wordWrap: false,
    };

    var pixiText = new PIXI.Text(text, style);
    pixiText.x = x;
    pixiText.y = y + lineHeight - Math.round(this.fontSize);
    if (align == 'center') {
        pixiText.anchor.set(0.5, 0);
        pixiText.x = x + (pixiText.width / 2);
    } else if (align == 'right') {
        pixiText.anchor.set(1, 0);
        pixiText.x = x + pixiText.width;
    }

    if (pixiText) this.addChild(pixiText);
};

BitmapCompatLayer.prototype.touch = function () {
    return this._bitmap.touch();
};

BitmapCompatLayer.prototype.isReady = function () {
    return this._bitmap.isReady();
};

BitmapCompatLayer.prototype.clearRect = function () {
    this.clear();
    return this._bitmap.clearRect();
};

BitmapCompatLayer.prototype.measureTextWidth = function (text) {
    return this._bitmap.measureTextWidth(text);
};

BitmapCompatLayer.setFrame = function (x, y, width, height) {
    return this._bitmap.setFrame(x, y, width, height);
};

BitmapCompatLayer.prototype.createCroppedSprite = function (source, x, y, w, h) {
    return new PIXI.Sprite(
        new PIXI.Texture(
            source,
            new PIXI.Rectangle(x, y, w, h)
        )
    );
};

BitmapCompatLayer.prototype.blt = function (source, sx, sy, sw, sh, dx, dy, dw, dh) {
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

BitmapCompatLayer.prototype.fillRect = function (x, y, width, height, color) {
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

BitmapCompatLayer.prototype.gradientFillRect = function (x, y, width, height, color1, color2, vertical) {
    const rectangle = this.fillRect(x, y, width, height, color1);
    if (rectangle) this.addChild(rectangle);
};

BitmapCompatLayer.prototype.drawCircle = function (x, y, radius, color) {
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
