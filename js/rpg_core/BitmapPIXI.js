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

BitmapPIXI.prototype.initialize = function (width, height, x, y, createCanvas) {
    PIXI.Container.call(this);
    if (createCanvas) {
        this._createCanvas(width, height);
    }

    this.width = 0;
    this.height = 0;
    this._x = 0;
    this._y = 0;
    if (width) this.width = width;
    if (height) this.height = height;
    if (x) this._x = x;
    if (y) this._y = y;

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

    this._spriteContainer = new PIXI.Container();
    this._spriteContainer.width = width;
    this._spriteContainer.height = height;
    this.addChild(this._spriteContainer);

    this._canvasContainer = new PIXI.Container();
    this._canvasContainer._sprite = null;
    this._canvasContainer.width = width;
    this._canvasContainer.height = height;
    this.addChild(this._canvasContainer);
};

BitmapPIXI.prototype._renderCanvas_PIXI = PIXI.Container.prototype._renderCanvas;
BitmapPIXI.prototype._render_PIXI = PIXI.Container.prototype._render;

BitmapPIXI.prototype._renderCanvas = function (renderer) {
    this.checkDirty();
    this._renderCanvas_PIXI(renderer);
};

BitmapPIXI.prototype._render = function (renderer) {
    this.checkDirty();
    this._render_PIXI(renderer);
};

BitmapPIXI.prototype.checkDirty = function () {
    if (this._dirty) {
        this._baseTexture.update();
        let self = this;
        let container = this._canvasContainer;
        let baseTexture = this._baseTexture;
        setTimeout(function () {
            baseTexture.update();
            let texture = new PIXI.Texture(baseTexture, new PIXI.Rectangle(self._x, self._y, self.width, self.height));
            texture.CREATED_BY = this;
            texture.CREATED_AT = Date.now();
            if (container._sprite) {
                container._sprite.texture.destroy();
                container._sprite.texture = texture;
            } else {
                container._sprite = new PIXI.Sprite(texture);
                container.addChild(container._sprite);
            }

        }, 0);
        this._dirty = false;
    }
};

BitmapPIXI.prototype._setDirty = function () {
    this._dirty = true;
};

BitmapPIXI.prototype._createCanvas = function (width, height) {
    Graphics._bitmapCanvas = Graphics._bitmapCanvas || document.createElement('canvas');
    this.__canvas = Graphics._bitmapCanvas;
    this.__context = Graphics._bitmapCanvas.getContext('2d');
    this.__canvas.width = Math.max(Graphics.boxWidth || 0, 1);
    this.__canvas.height = Math.max(Graphics.boxHeight || 0, 1);
    this._setDirty();
};

BitmapPIXI.prototype._createBaseTexture = function (source) {
    Bitmap.prototype._createBaseTexture.call(this, source);
    this.__baseTexture.CREATED_BY = this;
    this.__baseTexture.CREATED_AT = Date.now();
};

BitmapPIXI.prototype.resize = function (width, height) {
    //Bitmap.prototype.resize.call(this, width, height);
    this.width = width;
    this.height = height;
};

BitmapPIXI.prototype.move = function (x, y) {
    this._x = x;
    this._y = y;
};

Object.defineProperty(BitmapPIXI.prototype, 'paintOpacity', {
    get: function () {
        return this._paintOpacity;
    },
    set: function (value) {
        if (this._paintOpacity !== value) {
            this._paintOpacity = value;
            this.alpha = this._paintOpacity / 255;
            this._context.globalAlpha = this._paintOpacity / 255;
        }
    },
    configurable: true
});

Object.defineProperties(BitmapPIXI.prototype, {
    _canvas: {
        get: function () {
            if (!this.__canvas) this._createCanvas();
            return this.__canvas;
        }
    },
    _context: {
        get: function () {
            if (!this.__context) this._createCanvas();
            return this.__context;
        }
    },
    _baseTexture: {
        get: function () {
            if (!this.__baseTexture) this._createBaseTexture(this._image || this.__canvas);
            return this.__baseTexture;
        }
    }
});

Object.defineProperty(BitmapPIXI.prototype, 'baseTexture', {
    get: function () {
        return this._baseTexture;
    },
    configurable: true
});

Object.defineProperty(BitmapPIXI.prototype, 'canvas', {
    get: function () {
        return this._canvas;
    },
    configurable: true
});

Object.defineProperty(BitmapPIXI.prototype, 'context', {
    get: function () {
        return this._context;
    },
    configurable: true
});





BitmapPIXI.prototype.clear = function () {
    console.log('clear');
    this.clearRect(this._x, this._y, this.width, this.height);
    /*
    for (let i = this._spriteContainer.children.length - 1; i >= 0; i--) {
        this._spriteContainer.children[i].destroy({
            children: true,
            texture: true,
        });
        this._spriteContainer.removeChild(this.children[i]);
    }

    Bitmap.prototype.clear.call(this);
    */
};

BitmapPIXI.prototype.clearRect = function (x, y, width, height) {
    console.log('clearRect', x, y, width, height);
    if (!width && !height) return;
    x += this._x;
    y += this._y;
    let self = this;
    let toRemove = [];
    //x += this._x;
    //y += this._y;

    this._spriteContainer.children.forEach(function (child) {
        if (child &&
            (child.x >= x && child.x < x + width) &&
            (child.y >= y && child.y < y + height)
        ) {
            toRemove.push(child);
        }
    });

    toRemove.forEach(function (child) {
        child.destroy({
            children: true,
            texture: true,
        });
        self._spriteContainer.removeChild(child);
    });

    Bitmap.prototype.clearRect.call(this, x, y, width, height);
};





BitmapPIXI.prototype.drawText = function (text, x, y, maxWidth, lineHeight, align) {
    if (text === undefined) return;
    //console.log(text, x, y);
    console.log(text, this._x, this._y, this.width, this.height, '|', x, y);
    x += this._x;
    y += this._y;
    //if (this.width === 0 || this.height === 0) return;
    let tx = x;
    let ty = y + lineHeight - Math.round((lineHeight - this.fontSize * 0.7) / 2);
    let context = this._context;
    let alpha = context.globalAlpha;
    maxWidth = maxWidth || 0xffffffff;
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

    /*
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
    */
};

BitmapPIXI.prototype.measureTextWidth = function (text) {
    return Bitmap.prototype.measureTextWidth.call(this, text);
    /*
    let style = {
        fontFamily: this.fontFace,
        fontSize: this.fontSize,
        padding: this.textPadding,
    };
    let pixiText = new PIXI.Text(text, style);
    let width = pixiText.width;
    pixiText.destroy(true);
    return width;
    */
};

BitmapPIXI.prototype._makeFontNameText = function () {
    return Bitmap.prototype._makeFontNameText.call(this);
};

BitmapPIXI.prototype._drawTextOutline = function (text, tx, ty, maxWidth) {
    Bitmap.prototype._drawTextOutline.call(this, text, tx, ty, maxWidth);
};

BitmapPIXI.prototype._drawTextBody = function (text, tx, ty, maxWidth) {
    Bitmap.prototype._drawTextBody.call(this, text, tx, ty, maxWidth);
};





BitmapPIXI.prototype.create9Slice = function (source, x, y, w, h, tl, tr, br, bl) {
    return new PIXI.NineSlicePlane(
        new PIXI.Texture(
            source,
            new PIXI.Rectangle(x, y, w, h)
        ), tl, tr, br, bl
    );
};

BitmapPIXI.prototype.createTilingSprite = function (source, x, y, w, h, tileWidth, tileHeight) {
    return new PIXI.TilingSprite(
        new PIXI.Texture(
            source,
            new PIXI.Rectangle(x, y, w, h)
        ), tileWidth, tileHeight,
    );
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
        let sprite = this.createCroppedSprite(source.baseTexture, sx, sy, sw, sh);
        if (sprite) {
            sprite.x = dx;
            sprite.y = dy;
            sprite.width = dw;
            sprite.height = dh;
            this._spriteContainer.addChild(sprite);
        }
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
    if (rectangle) this._spriteContainer.addChild(rectangle);
};

BitmapPIXI.prototype.gradientFillRect = function (x, y, width, height, color1, color2, vertical) {
    const rectangle = this.fillRect(x, y, width, height, color1);
    if (rectangle) this._spriteContainer.addChild(rectangle);
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
    if (circle) this._spriteContainer.addChild(circle);
};
