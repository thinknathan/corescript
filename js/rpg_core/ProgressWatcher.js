import ImageManager from "../rpg_managers/ImageManager.js";
import AudioManager from "../rpg_managers/AudioManager.js";

class ProgressWatcher {
  constructor() {
    throw new Error("This is a static class");
  }

  static initialize() {
    this.clearProgress();
    ImageManager.setCreationHook(this._bitmapListener.bind(this));
    AudioManager.setCreationHook(this._audioListener.bind(this));
  }

  static _bitmapListener(bitmap) {
    this._countLoading++;
    bitmap.addLoadListener(() => {
      this._countLoaded++;
      if (this._progressListener)
        this._progressListener(this._countLoaded, this._countLoading);
    });
  }

  static _audioListener(audio) {
    this._countLoading++;
    audio.addLoadListener(() => {
      this._countLoaded++;
      if (this._progressListener)
        this._progressListener(this._countLoaded, this._countLoading);
    });
  }

  static setProgressListener(progressListener) {
    this._progressListener = progressListener;
  }

  static clearProgress() {
    this._countLoading = 0;
    this._countLoaded = 0;
  }

  static truncateProgress() {
    if (this._countLoaded) {
      this._countLoading -= this._countLoaded;
      this._countLoaded = 0;
    }
  }
}

export default ProgressWatcher;
