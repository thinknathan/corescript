import Game_Picture from './Game_Picture.js';

//-----------------------------------------------------------------------------
// Game_Screen
//
// The game object class for screen effect data, such as changes in color tone
// and flashes.

class Game_Screen {
	constructor(...args) {
		this.initialize(...args);
	}

	initialize() {
		this.clear();
	}

	clear() {
		this.clearFade();
		this.clearTone();
		this.clearFlash();
		this.clearShake();
		this.clearZoom();
		this.clearWeather();
		this.clearPictures();
	}

	onBattleStart() {
		this.clearFade();
		this.clearFlash();
		this.clearShake();
		this.clearZoom();
		this.eraseBattlePictures();
	}

	brightness() {
		return this._brightness;
	}

	tone() {
		return this._tone;
	}

	flashColor() {
		return this._flashColor;
	}

	shake() {
		return this._shake;
	}

	zoomX() {
		return this._zoomX;
	}

	zoomY() {
		return this._zoomY;
	}

	zoomScale() {
		return this._zoomScale;
	}

	weatherType() {
		return this._weatherType;
	}

	weatherPower() {
		return this._weatherPower;
	}

	picture(pictureId) {
		const realPictureId = this.realPictureId(pictureId);
		return this._pictures[realPictureId];
	}

	realPictureId(pictureId) {
		if (self.$gameParty.inBattle()) {
			return pictureId + this.maxPictures();
		} else {
			return pictureId;
		}
	}

	clearFade() {
		this._brightness = 255;
		this._fadeOutDuration = 0;
		this._fadeInDuration = 0;
	}

	clearTone() {
		this._tone = [0, 0, 0, 0];
		this._toneTarget = [0, 0, 0, 0];
		this._toneDuration = 0;
	}

	clearFlash() {
		this._flashColor = [0, 0, 0, 0];
		this._flashDuration = 0;
	}

	clearShake() {
		this._shakePower = 0;
		this._shakeSpeed = 0;
		this._shakeDuration = 0;
		this._shakeDirection = 1;
		this._shake = 0;
	}

	clearZoom() {
		this._zoomX = 0;
		this._zoomY = 0;
		this._zoomScale = 1;
		this._zoomScaleTarget = 1;
		this._zoomDuration = 0;
	}

	clearWeather() {
		this._weatherType = 'none';
		this._weatherPower = 0;
		this._weatherPowerTarget = 0;
		this._weatherDuration = 0;
	}

	clearPictures() {
		this._pictures = [];
	}

	eraseBattlePictures() {
		this._pictures = this._pictures.slice(0, this.maxPictures() + 1);
	}

	maxPictures() {
		return 100;
	}

	startFadeOut(duration) {
		this._fadeOutDuration = duration;
		this._fadeInDuration = 0;
	}

	startFadeIn(duration) {
		this._fadeInDuration = duration;
		this._fadeOutDuration = 0;
	}

	startTint(tone, duration) {
		this._toneTarget = tone.clone();
		this._toneDuration = duration;
		if (this._toneDuration === 0) {
			this._tone = this._toneTarget.clone();
		}
	}

	startFlash(color, duration) {
		this._flashColor = color.clone();
		this._flashDuration = duration;
	}

	startShake(power, speed, duration) {
		this._shakePower = power;
		this._shakeSpeed = speed;
		this._shakeDuration = duration;
	}

	startZoom(x, y, scale, duration) {
		this._zoomX = x;
		this._zoomY = y;
		this._zoomScaleTarget = scale;
		this._zoomDuration = duration;
	}

	setZoom(x, y, scale) {
		this._zoomX = x;
		this._zoomY = y;
		this._zoomScale = scale;
	}

	changeWeather(type, power, duration) {
		if (type !== 'none' || duration === 0) {
			this._weatherType = type;
		}
		this._weatherPowerTarget = type === 'none' ? 0 : power;
		this._weatherDuration = duration;
		if (duration === 0) {
			this._weatherPower = this._weatherPowerTarget;
		}
	}

	update() {
		this.updateFadeOut();
		this.updateFadeIn();
		this.updateTone();
		this.updateFlash();
		this.updateShake();
		this.updateZoom();
		this.updateWeather();
		this.updatePictures();
	}

	updateFadeOut() {
		if (this._fadeOutDuration > 0) {
			const d = this._fadeOutDuration;
			this._brightness = (this._brightness * (d - 1)) / d;
			this._fadeOutDuration--;
		}
	}

	updateFadeIn() {
		if (this._fadeInDuration > 0) {
			const d = this._fadeInDuration;
			this._brightness = (this._brightness * (d - 1) + 255) / d;
			this._fadeInDuration--;
		}
	}

	updateTone() {
		if (this._toneDuration > 0) {
			const d = this._toneDuration;
			for (let i = 0; i < 4; i++) {
				this._tone[i] = (this._tone[i] * (d - 1) + this._toneTarget[i]) / d;
			}
			this._toneDuration--;
		}
	}

	updateFlash() {
		if (this._flashDuration > 0) {
			const d = this._flashDuration;
			this._flashColor[3] *= (d - 1) / d;
			this._flashDuration--;
		}
	}

	updateShake() {
		if (this._shakeDuration > 0 || this._shake !== 0) {
			const delta =
				(this._shakePower * this._shakeSpeed * this._shakeDirection) / 10;
			if (this._shakeDuration <= 1 && this._shake * (this._shake + delta) < 0) {
				this._shake = 0;
			} else {
				this._shake += delta;
			}
			if (this._shake > this._shakePower * 2) {
				this._shakeDirection = -1;
			}
			if (this._shake < -this._shakePower * 2) {
				this._shakeDirection = 1;
			}
			this._shakeDuration--;
		}
	}

	updateZoom() {
		if (this._zoomDuration > 0) {
			const d = this._zoomDuration;
			const t = this._zoomScaleTarget;
			this._zoomScale = (this._zoomScale * (d - 1) + t) / d;
			this._zoomDuration--;
		}
	}

	updateWeather() {
		if (this._weatherDuration > 0) {
			const d = this._weatherDuration;
			const t = this._weatherPowerTarget;
			this._weatherPower = (this._weatherPower * (d - 1) + t) / d;
			this._weatherDuration--;
			if (this._weatherDuration === 0 && this._weatherPowerTarget === 0) {
				this._weatherType = 'none';
			}
		}
	}

	updatePictures() {
		this._pictures.forEach((picture) => {
			if (picture) {
				picture.update();
			}
		});
	}

	startFlashForDamage() {
		this.startFlash([255, 0, 0, 128], 8);
	}

	showPicture(
		pictureId,
		name,
		origin,
		x,
		y,
		scaleX,
		scaleY,
		opacity,
		blendMode
	) {
		const realPictureId = this.realPictureId(pictureId);
		const picture = new Game_Picture();
		picture.show(name, origin, x, y, scaleX, scaleY, opacity, blendMode);
		this._pictures[realPictureId] = picture;
	}

	movePicture(
		pictureId,
		origin,
		x,
		y,
		scaleX,
		scaleY,
		opacity,
		blendMode,
		duration
	) {
		const picture = this.picture(pictureId);
		if (picture) {
			picture.move(origin, x, y, scaleX, scaleY, opacity, blendMode, duration);
		}
	}

	rotatePicture(pictureId, speed) {
		const picture = this.picture(pictureId);
		if (picture) {
			picture.rotate(speed);
		}
	}

	tintPicture(pictureId, tone, duration) {
		const picture = this.picture(pictureId);
		if (picture) {
			picture.tint(tone, duration);
		}
	}

	erasePicture(pictureId) {
		const realPictureId = this.realPictureId(pictureId);
		this._pictures[realPictureId] = null;
	}
}

export default Game_Screen;
