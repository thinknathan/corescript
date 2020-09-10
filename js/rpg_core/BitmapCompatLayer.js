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
    this._bitmap = new Bitmap(width, height);
};

BitmapCompatLayer.prototype.bitmap = function (url) {
    return this._bitmap;
};

BitmapCompatLayer.prototype.load = function (url) {
    return this._bitmap.load(url);
};

BitmapCompatLayer.prototype.blt = function (source, sx, sy, sw, sh, dx, dy, dw, dh) {
    var sprite = this._bitmap.blt(source, sx, sy, sw, sh, dx, dy, dw, dh);
    if (sprite) this.addChild(sprite);
};

BitmapCompatLayer.prototype.addLoadListener = function (listener) {
    return this._bitmap.addLoadListener(listener);
};

BitmapCompatLayer.prototype.clear = function () {
    var self = this;
    this.children.forEach(function (child) {
        if (child) self.removeChild(child);
    })
};

BitmapCompatLayer.prototype.drawText = function (text, x, y, maxWidth, lineHeight, align) {

    var style = {
        fontFamily: this._bitmap.fontFace,
        fontSize: this._bitmap.fontSize,
        fill: PIXI.utils.string2hex(this._bitmap.textColor),
        align: align,
        lineHeight: lineHeight,
        wordWrap: false,
    };

    var pixiText = new PIXI.Text(text, style);
    pixiText.x = x;
    pixiText.y = y;

    if (pixiText) this.addChild(pixiText);
};

BitmapCompatLayer.prototype.fillRect = function (x, y, width, height, color) {
    var rect = this._bitmap.fillRect(x, y, width, height, color);
    if (rect) this.addChild(rect);
};

BitmapCompatLayer.prototype.gradientFillRect = function (x, y, width, height, color1, color2, vertical) {
    var rect = this._bitmap.fillRect(x, y, width, height, color1);
    if (rect) this.addChild(rect);
};

BitmapCompatLayer.prototype.touch = function () {
    return this._bitmap.touch();
};

BitmapCompatLayer.prototype.isReady = function () {
    return this._bitmap.isReady();
};

BitmapCompatLayer.prototype.measureTextWidth = function (text) {
    return this._bitmap.measureTextWidth(text);
};

BitmapCompatLayer.prototype.measureTextWidth = function (text) {
    return this._bitmap.measureTextWidth(text);
};

BitmapCompatLayer.setFrame = function (x, y, width, height) {
    return this._bitmap.setFrame(x, y, width, height);
};
