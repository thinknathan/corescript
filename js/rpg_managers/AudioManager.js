//-----------------------------------------------------------------------------
// AudioManager
//
// The static class that handles BGM, BGS, ME and SE.

class AudioManager {
	constructor() {
		throw new Error('This is a static class');
	}

	static playBgm(bgm, pos) {
		if (this.isCurrentBgm(bgm)) {
			this.updateBgmParameters(bgm);
		} else {
			this.stopBgm();
			if (bgm.name) {
				this._bgmBuffer = this.createBuffer('bgm', bgm.name);
				this.updateBgmParameters(bgm);
				if (!this._meBuffer) {
					this._bgmBuffer.play(true, pos || 0);
				}
			}
		}
		this.updateCurrentBgm(bgm, pos);
	}

	static playEncryptedBgm({
		name
	}, pos) {
		const ext = this.audioFileExt();
		let url = `${this._path}bgm/${encodeURIComponent(name)}${ext}`;
		url = Decrypter.extToEncryptExt(url);
	}

	static createDecryptBuffer(url, bgm, pos) {
		this._blobUrl = url;
		this._bgmBuffer = this.createBuffer('bgm', bgm.name);
		this.updateBgmParameters(bgm);
		if (!this._meBuffer) {
			this._bgmBuffer.play(true, pos || 0);
		}
		this.updateCurrentBgm(bgm, pos);
	}

	static replayBgm(bgm) {
		if (this.isCurrentBgm(bgm)) {
			this.updateBgmParameters(bgm);
		} else {
			this.playBgm(bgm, bgm.pos);
			if (this._bgmBuffer) {
				this._bgmBuffer.fadeIn(this._replayFadeTime);
			}
		}
	}

	static isCurrentBgm({
		name
	}) {
		return this._currentBgm && this._bgmBuffer &&
			this._currentBgm.name === name;
	}

	static updateBgmParameters(bgm) {
		this.updateBufferParameters(this._bgmBuffer, this._bgmVolume, bgm);
	}

	static updateCurrentBgm({
		name,
		volume,
		pitch,
		pan
	}, pos) {
		this._currentBgm = {
			name: name,
			volume: volume,
			pitch: pitch,
			pan: pan,
			pos
		};
	}

	static stopBgm() {
		if (this._bgmBuffer) {
			this._bgmBuffer.stop();
			this._bgmBuffer = null;
			this._currentBgm = null;
		}
	}

	static fadeOutBgm(duration) {
		if (this._bgmBuffer && this._currentBgm) {
			this._bgmBuffer.fadeOut(duration);
			this._currentBgm = null;
		}
	}

	static fadeInBgm(duration) {
		if (this._bgmBuffer && this._currentBgm) {
			this._bgmBuffer.fadeIn(duration);
		}
	}

	static playBgs(bgs, pos) {
		if (this.isCurrentBgs(bgs)) {
			this.updateBgsParameters(bgs);
		} else {
			this.stopBgs();
			if (bgs.name) {
				this._bgsBuffer = this.createBuffer('bgs', bgs.name);
				this.updateBgsParameters(bgs);
				this._bgsBuffer.play(true, pos || 0);
			}
		}
		this.updateCurrentBgs(bgs, pos);
	}

	static replayBgs(bgs) {
		if (this.isCurrentBgs(bgs)) {
			this.updateBgsParameters(bgs);
		} else {
			this.playBgs(bgs, bgs.pos);
			if (this._bgsBuffer) {
				this._bgsBuffer.fadeIn(this._replayFadeTime);
			}
		}
	}

	static isCurrentBgs({
		name
	}) {
		return this._currentBgs && this._bgsBuffer &&
			this._currentBgs.name === name;
	}

	static updateBgsParameters(bgs) {
		this.updateBufferParameters(this._bgsBuffer, this._bgsVolume, bgs);
	}

	static updateCurrentBgs({
		name,
		volume,
		pitch,
		pan
	}, pos) {
		this._currentBgs = {
			name: name,
			volume: volume,
			pitch: pitch,
			pan: pan,
			pos
		};
	}

	static stopBgs() {
		if (this._bgsBuffer) {
			this._bgsBuffer.stop();
			this._bgsBuffer = null;
			this._currentBgs = null;
		}
	}

	static fadeOutBgs(duration) {
		if (this._bgsBuffer && this._currentBgs) {
			this._bgsBuffer.fadeOut(duration);
			this._currentBgs = null;
		}
	}

	static fadeInBgs(duration) {
		if (this._bgsBuffer && this._currentBgs) {
			this._bgsBuffer.fadeIn(duration);
		}
	}

	static playMe(me) {
		this.stopMe();
		if (me.name) {
			if (this._bgmBuffer && this._currentBgm) {
				this._currentBgm.pos = this._bgmBuffer.seek();
				this._bgmBuffer.stop();
			}
			this._meBuffer = this.createBuffer('me', me.name);
			this.updateMeParameters(me);
			this._meBuffer.play(false);
			this._meBuffer.addStopListener(this.stopMe.bind(this));
		}
	}

	static updateMeParameters(me) {
		this.updateBufferParameters(this._meBuffer, this._meVolume, me);
	}

	static fadeOutMe(duration) {
		if (this._meBuffer) {
			this._meBuffer.fadeOut(duration);
		}
	}

	static stopMe() {
		if (this._meBuffer) {
			this._meBuffer.stop();
			this._meBuffer = null;
			if (this._bgmBuffer && this._currentBgm && !this._bgmBuffer.isPlaying()) {
				this._bgmBuffer.play(true, this._currentBgm.pos);
				this._bgmBuffer.fadeIn(this._replayFadeTime);
			}
		}
	}

	static playSe(se) {
		if (se.name) {
			this._seBuffers = this._seBuffers.filter(audio => audio.isPlaying());
			const buffer = this.createBuffer('se', se.name);
			this.updateSeParameters(buffer, se);
			buffer.play(false);
			this._seBuffers.push(buffer);
		}
	}

	static updateSeParameters(buffer, se) {
		this.updateBufferParameters(buffer, this._seVolume, se);
	}

	static stopSe() {
		this._seBuffers.forEach(buffer => {
			buffer.stop();
		});
		this._seBuffers = [];
	}

	static playStaticSe(se) {
		if (se.name) {
			this.loadStaticSe(se);

			for (const buffer of this._staticBuffers) {
				if (buffer._reservedSeName === se.name) {
					buffer.stop();
					this.updateSeParameters(buffer, se);
					buffer.play(false);
					break;
				}
			}
		}
	}

	static loadStaticSe(se) {
		if (se.name && !this.isStaticSe(se)) {
			const buffer = this.createBuffer('se', se.name);
			buffer._reservedSeName = se.name;
			this._staticBuffers.push(buffer);
		}
	}

	static isStaticSe({
		name
	}) {
		for (const buffer of this._staticBuffers) {
			if (buffer._reservedSeName === name) {
				return true;
			}
		}

		return false;
	}

	static stopAll() {
		this.stopMe();
		this.stopBgm();
		this.stopBgs();
		this.stopSe();
	}

	static saveBgm() {
		if (this._currentBgm) {
			const bgm = this._currentBgm;
			return {
				name: bgm.name,
				volume: bgm.volume,
				pitch: bgm.pitch,
				pan: bgm.pan,
				pos: this._bgmBuffer ? this._bgmBuffer.seek() : 0
			};
		} else {
			return this.makeEmptyAudioObject();
		}
	}

	static saveBgs() {
		if (this._currentBgs) {
			const bgs = this._currentBgs;
			return {
				name: bgs.name,
				volume: bgs.volume,
				pitch: bgs.pitch,
				pan: bgs.pan,
				pos: this._bgsBuffer ? this._bgsBuffer.seek() : 0
			};
		} else {
			return this.makeEmptyAudioObject();
		}
	}

	static createBuffer(folder, name) {
		const ext = this.audioFileExt();
		const url = `${this._path + folder}/${encodeURIComponent(name)}${ext}`;
		const audio = new WebAudio(url);
		this._callCreationHook(audio);
		return audio;
	}

	static checkErrors() {
		this.checkWebAudioError(this._bgmBuffer);
		this.checkWebAudioError(this._bgsBuffer);
		this.checkWebAudioError(this._meBuffer);
		this._seBuffers.forEach(buffer => {
			this.checkWebAudioError(buffer);
		});
		this._staticBuffers.forEach(buffer => {
			this.checkWebAudioError(buffer);
		});
	}

	static setCreationHook(hook) {
		this._creationHook = hook;
	}

	static _callCreationHook(audio) {
		if (this._creationHook) this._creationHook(audio);
	}
}

AudioManager._masterVolume = 1; // (min: 0, max: 1)
AudioManager._bgmVolume = 100;
AudioManager._bgsVolume = 100;
AudioManager._meVolume = 100;
AudioManager._seVolume = 100;
AudioManager._currentBgm = null;
AudioManager._currentBgs = null;
AudioManager._bgmBuffer = null;
AudioManager._bgsBuffer = null;
AudioManager._meBuffer = null;
AudioManager._seBuffers = [];
AudioManager._staticBuffers = [];
AudioManager._replayFadeTime = 0.5;
AudioManager._path = 'audio/';
AudioManager._blobUrl = null;

Object.defineProperty(AudioManager, 'masterVolume', {
	get() {
		return this._masterVolume;
	},
	set(value) {
		this._masterVolume = value;
		WebAudio.setMasterVolume(this._masterVolume);
		Graphics.setVideoVolume(this._masterVolume);
	},
	configurable: true
});

Object.defineProperty(AudioManager, 'bgmVolume', {
	get() {
		return this._bgmVolume;
	},
	set(value) {
		this._bgmVolume = value;
		this.updateBgmParameters(this._currentBgm);
	},
	configurable: true
});

Object.defineProperty(AudioManager, 'bgsVolume', {
	get() {
		return this._bgsVolume;
	},
	set(value) {
		this._bgsVolume = value;
		this.updateBgsParameters(this._currentBgs);
	},
	configurable: true
});

Object.defineProperty(AudioManager, 'meVolume', {
	get() {
		return this._meVolume;
	},
	set(value) {
		this._meVolume = value;
		this.updateMeParameters(this._currentMe);
	},
	configurable: true
});

Object.defineProperty(AudioManager, 'seVolume', {
	get() {
		return this._seVolume;
	},
	set(value) {
		this._seVolume = value;
	},
	configurable: true
});

AudioManager.makeEmptyAudioObject = () => ({
	name: '',
	volume: 0,
	pitch: 0
});

AudioManager.updateBufferParameters = (buffer, configVolume, audio) => {
	if (buffer && audio) {
		buffer.volume = configVolume * (audio.volume || 0) / 10000;
		buffer.pitch = (audio.pitch || 0) / 100;
		buffer.pan = (audio.pan || 0) / 100;
	}
};

AudioManager.audioFileExt = () => {
	if (WebAudio.canPlayOgg() && !Utils.isMobileDevice()) {
		return '.ogg';
	} else {
		return '.m4a';
	}
};

AudioManager.shouldUseHtml5Audio = () => // The only case where we wanted html5audio was android/ no encrypt
	// Atsuma-ru asked to force webaudio there too, so just return false for ALL    // return Utils.isAndroidChrome() && !Decrypter.hasEncryptedAudio;
	false;

AudioManager.checkWebAudioError = webAudio => {
	if (webAudio && webAudio.isError()) {
		throw new Error(`Failed to load: ${webAudio.url}`);
	}
};
