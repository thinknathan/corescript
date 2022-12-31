import CacheMap from "../rpg_core/CacheMap.js";
import ImageCache from "../rpg_core/ImageCache.js";
import RequestQueue from "../rpg_core/RequestQueue.js";
import Utils from "../rpg_core/Utils.js";
import Bitmap from "../rpg_core/Bitmap.js";

//-----------------------------------------------------------------------------
// ImageManager
//
// The static class that loads images, creates bitmap objects and retains them.

class ImageManager {
  constructor() {
    throw new Error("This is a static class");
  }

  static loadAnimation(filename, hue) {
    return this.loadBitmap("img/animations/", filename, hue, true);
  }

  static loadBattleback1(filename, hue) {
    return this.loadBitmap("img/battlebacks1/", filename, hue, true);
  }

  static loadBattleback2(filename, hue) {
    return this.loadBitmap("img/battlebacks2/", filename, hue, true);
  }

  static loadEnemy(filename, hue) {
    return this.loadBitmap("img/enemies/", filename, hue, true);
  }

  static loadCharacter(filename, hue) {
    return this.loadBitmap("img/characters/", filename, hue, false);
  }

  static loadFace(filename, hue) {
    return this.loadBitmap("img/faces/", filename, hue, true);
  }

  static loadParallax(filename, hue) {
    return this.loadBitmap("img/parallaxes/", filename, hue, true);
  }

  static loadPicture(filename, hue) {
    return this.loadBitmap("img/pictures/", filename, hue, true);
  }

  static loadSvActor(filename, hue) {
    return this.loadBitmap("img/sv_actors/", filename, hue, false);
  }

  static loadSvEnemy(filename, hue) {
    return this.loadBitmap("img/sv_enemies/", filename, hue, true);
  }

  static loadSystem(filename, hue) {
    return this.loadBitmap("img/system/", filename, hue, false);
  }

  static loadTileset(filename, hue) {
    return this.loadBitmap("img/tilesets/", filename, hue, false);
  }

  static loadTitle1(filename, hue) {
    return this.loadBitmap("img/titles1/", filename, hue, true);
  }

  static loadTitle2(filename, hue) {
    return this.loadBitmap("img/titles2/", filename, hue, true);
  }

  static loadBitmap(folder, filename, hue, smooth) {
    if (filename) {
      const path = `${folder + encodeURIComponent(filename)}.png`;
      const bitmap = this.loadNormalBitmap(path, hue || 0);
      bitmap.smooth = false;
      return bitmap;
    } else {
      return this.loadEmptyBitmap();
    }
  }

  static loadEmptyBitmap() {
    let empty = this._imageCache.get("empty");
    if (!empty) {
      empty = new Bitmap();
      this._imageCache.add("empty", empty);
      this._imageCache.reserve("empty", empty, this._systemReservationId);
    }

    return empty;
  }

  static loadNormalBitmap(path, hue) {
    const key = this._generateCacheKey(path, hue);
    let bitmap = this._imageCache.get(key);
    if (!bitmap) {
      bitmap = Bitmap.load(path);
      this._callCreationHook(bitmap);

      bitmap.addLoadListener(() => {
        bitmap.rotateHue(hue);
      });
      this._imageCache.add(key, bitmap);
    } else if (!bitmap.isReady()) {
      bitmap.decode();
    }

    return bitmap;
  }

  static clear() {
    this._imageCache = new ImageCache();
  }

  static isReady() {
    return this._imageCache.isReady();
  }

  static reserveAnimation(filename, hue, reservationId) {
    return this.reserveBitmap(
      "img/animations/",
      filename,
      hue,
      true,
      reservationId
    );
  }

  static reserveBattleback1(filename, hue, reservationId) {
    return this.reserveBitmap(
      "img/battlebacks1/",
      filename,
      hue,
      true,
      reservationId
    );
  }

  static reserveBattleback2(filename, hue, reservationId) {
    return this.reserveBitmap(
      "img/battlebacks2/",
      filename,
      hue,
      true,
      reservationId
    );
  }

  static reserveEnemy(filename, hue, reservationId) {
    return this.reserveBitmap(
      "img/enemies/",
      filename,
      hue,
      true,
      reservationId
    );
  }

  static reserveCharacter(filename, hue, reservationId) {
    return this.reserveBitmap(
      "img/characters/",
      filename,
      hue,
      false,
      reservationId
    );
  }

  static reserveFace(filename, hue, reservationId) {
    return this.reserveBitmap("img/faces/", filename, hue, true, reservationId);
  }

  static reserveParallax(filename, hue, reservationId) {
    return this.reserveBitmap(
      "img/parallaxes/",
      filename,
      hue,
      true,
      reservationId
    );
  }

  static reservePicture(filename, hue, reservationId) {
    return this.reserveBitmap(
      "img/pictures/",
      filename,
      hue,
      true,
      reservationId
    );
  }

  static reserveSvActor(filename, hue, reservationId) {
    return this.reserveBitmap(
      "img/sv_actors/",
      filename,
      hue,
      false,
      reservationId
    );
  }

  static reserveSvEnemy(filename, hue, reservationId) {
    return this.reserveBitmap(
      "img/sv_enemies/",
      filename,
      hue,
      true,
      reservationId
    );
  }

  static reserveSystem(filename, hue, reservationId) {
    return this.reserveBitmap(
      "img/system/",
      filename,
      hue,
      false,
      reservationId || this._systemReservationId
    );
  }

  static reserveTileset(filename, hue, reservationId) {
    return this.reserveBitmap(
      "img/tilesets/",
      filename,
      hue,
      false,
      reservationId
    );
  }

  static reserveTitle1(filename, hue, reservationId) {
    return this.reserveBitmap(
      "img/titles1/",
      filename,
      hue,
      true,
      reservationId
    );
  }

  static reserveTitle2(filename, hue, reservationId) {
    return this.reserveBitmap(
      "img/titles2/",
      filename,
      hue,
      true,
      reservationId
    );
  }

  static reserveBitmap(folder, filename, hue, smooth, reservationId) {
    if (filename) {
      const path = `${folder + encodeURIComponent(filename)}.png`;
      const bitmap = this.reserveNormalBitmap(
        path,
        hue || 0,
        reservationId || this._defaultReservationId
      );
      bitmap.smooth = false;
      return bitmap;
    } else {
      return this.loadEmptyBitmap();
    }
  }

  static reserveNormalBitmap(path, hue, reservationId) {
    const bitmap = this.loadNormalBitmap(path, hue);
    this._imageCache.reserve(
      this._generateCacheKey(path, hue),
      bitmap,
      reservationId
    );

    return bitmap;
  }

  static releaseReservation(reservationId) {
    this._imageCache.releaseReservation(reservationId);
  }

  static setDefaultReservationId(reservationId) {
    this._defaultReservationId = reservationId;
  }

  static requestAnimation(filename, hue) {
    return this.requestBitmap("img/animations/", filename, hue, true);
  }

  static requestBattleback1(filename, hue) {
    return this.requestBitmap("img/battlebacks1/", filename, hue, true);
  }

  static requestBattleback2(filename, hue) {
    return this.requestBitmap("img/battlebacks2/", filename, hue, true);
  }

  static requestEnemy(filename, hue) {
    return this.requestBitmap("img/enemies/", filename, hue, true);
  }

  static requestCharacter(filename, hue) {
    return this.requestBitmap("img/characters/", filename, hue, false);
  }

  static requestFace(filename, hue) {
    return this.requestBitmap("img/faces/", filename, hue, true);
  }

  static requestParallax(filename, hue) {
    return this.requestBitmap("img/parallaxes/", filename, hue, true);
  }

  static requestPicture(filename, hue) {
    return this.requestBitmap("img/pictures/", filename, hue, true);
  }

  static requestSvActor(filename, hue) {
    return this.requestBitmap("img/sv_actors/", filename, hue, false);
  }

  static requestSvEnemy(filename, hue) {
    return this.requestBitmap("img/sv_enemies/", filename, hue, true);
  }

  static requestSystem(filename, hue) {
    return this.requestBitmap("img/system/", filename, hue, false);
  }

  static requestTileset(filename, hue) {
    return this.requestBitmap("img/tilesets/", filename, hue, false);
  }

  static requestTitle1(filename, hue) {
    return this.requestBitmap("img/titles1/", filename, hue, true);
  }

  static requestTitle2(filename, hue) {
    return this.requestBitmap("img/titles2/", filename, hue, true);
  }

  static requestBitmap(folder, filename, hue, smooth) {
    if (filename) {
      const path = `${folder + encodeURIComponent(filename)}.png`;
      const bitmap = this.requestNormalBitmap(path, hue || 0);
      bitmap.smooth = false;
      return bitmap;
    } else {
      return this.loadEmptyBitmap();
    }
  }

  static requestNormalBitmap(path, hue) {
    const key = this._generateCacheKey(path, hue);
    let bitmap = this._imageCache.get(key);
    if (!bitmap) {
      bitmap = Bitmap.request(path);
      this._callCreationHook(bitmap);

      bitmap.addLoadListener(() => {
        bitmap.rotateHue(hue);
      });
      this._imageCache.add(key, bitmap);
      this._requestQueue.enqueue(key, bitmap);
    } else {
      this._requestQueue.raisePriority(key);
    }

    return bitmap;
  }

  static update() {
    this._requestQueue.update();
  }

  static clearRequest() {
    this._requestQueue.clear();
  }

  static setCreationHook(hook) {
    this._creationHook = hook;
  }

  static _callCreationHook(bitmap) {
    if (this._creationHook) this._creationHook(bitmap);
  }

  static isObjectCharacter(filename) {
    const sign = filename.match(/^[\!\$]+/);
    return sign && sign[0].contains("!");
  }

  static isBigCharacter(filename) {
    const sign = filename.match(/^[\!\$]+/);
    return sign && sign[0].contains("$");
  }

  static isZeroParallax(filename) {
    return filename.charAt(0) === "!";
  }

  static _generateCacheKey(path, hue) {
    return `${path}:${hue}`;
  }
}

ImageManager.cache = new CacheMap(ImageManager);

ImageManager._imageCache = new ImageCache();
ImageManager._requestQueue = new RequestQueue();
ImageManager._systemReservationId = Utils.generateRuntimeId();

export default ImageManager;
