import Sprite from "../rpg_core/Sprite.js";

//-----------------------------------------------------------------------------
// Sprite_Destination
//
// The sprite for displaying the destination place of the touch input.

class Sprite_Destination extends Sprite {
	constructor(...args) {
		super(...args);
		this.initialize(...args);
	}

	initialize() {
		super.initialize();
		this.createBitmap();
		this._frameCount = 0;
	}

	update() {
		super.update();
		if (self.$gameTemp.isDestinationValid()) {
			this.updatePosition();
			this.updateAnimation();
			this.visible = true;
		} else {
			this._frameCount = 0;
			this.visible = false;
		}
	}

	createBitmap() {
		const tileWidth = self.$gameMap.tileWidth();
		const tileHeight = self.$gameMap.tileHeight();
		this.bitmap = new Bitmap(tileWidth, tileHeight);
		this.bitmap.fillAll('white');
		this.anchor.x = 0.5;
		this.anchor.y = 0.5;
		this.blendMode = Graphics.BLEND_ADD;
	}

	updatePosition() {
		const tileWidth = self.$gameMap.tileWidth();
		const tileHeight = self.$gameMap.tileHeight();
		const x = self.$gameTemp.destinationX();
		const y = self.$gameTemp.destinationY();
		this.x = (self.$gameMap.adjustX(x) + 0.5) * tileWidth;
		this.y = (self.$gameMap.adjustY(y) + 0.5) * tileHeight;
	}

	updateAnimation() {
		this._frameCount++;
		this._frameCount %= 20;
		this.opacity = (20 - this._frameCount) * 6;
		this.scale.x = 1 + this._frameCount / 20;
		this.scale.y = this.scale.x;
	}
}

export default Sprite_Destination;
