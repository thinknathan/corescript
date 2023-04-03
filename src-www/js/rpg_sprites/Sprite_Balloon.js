import Sprite_Base from './Sprite_Base.js';
import ImageManager from '../rpg_managers/ImageManager.js';

//-----------------------------------------------------------------------------
// Sprite_Balloon
//
// The sprite for displaying a balloon icon.

class Sprite_Balloon extends Sprite_Base {
	constructor(...args) {
		super(...args);
		this.initialize(...args);
	}

	initialize() {
		super.initialize();
		this.initMembers();
		this.loadBitmap();
	}

	initMembers() {
		this._balloonId = 0;
		this._duration = 0;
		this.anchor.x = 0.5;
		this.anchor.y = 1;
		this.z = 7;
	}

	loadBitmap() {
		this.bitmap = ImageManager.loadSystem('Balloon');
		this.setFrame(0, 0, 0, 0);
	}

	setup(balloonId) {
		this._balloonId = balloonId;
		this._duration = 8 * this.speed() + this.waitTime();
	}

	update() {
		super.update();
		if (this._duration > 0) {
			this._duration--;
			if (this._duration > 0) {
				this.updateFrame();
			}
		}
	}

	updateFrame() {
		const w = 48;
		const h = 48;
		const sx = this.frameIndex() * w;
		const sy = (this._balloonId - 1) * h;
		this.setFrame(sx, sy, w, h);
	}

	speed() {
		return 8;
	}

	waitTime() {
		return 12;
	}

	frameIndex() {
		const index = (this._duration - this.waitTime()) / this.speed();
		return 7 - Math.max(Math.floor(index), 0);
	}

	isPlaying() {
		return this._duration > 0;
	}
}

export default Sprite_Balloon;
