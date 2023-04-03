"use strict";
(() => {
  var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
    get: (a2, b2) => (typeof require !== "undefined" ? require : a2)[b2]
  }) : x)(function(x) {
    if (typeof require !== "undefined")
      return require.apply(this, arguments);
    throw new Error('Dynamic require of "' + x + '" is not supported');
  });

  // src-www/js/rpg_core/JsExtensions.js
  Number.prototype.clamp = function(min, max) {
    return Math.min(Math.max(this, min), max);
  };
  Number.prototype.mod = function(n) {
    return (this % n + n) % n;
  };
  String.prototype.format = function() {
    const args = arguments;
    return this.replace(/%([0-9]+)/g, (s, n) => args[Number(n) - 1]);
  };
  String.prototype.padZero = function(length) {
    let s = this;
    while (s.length < length) {
      s = `0${s}`;
    }
    return s;
  };
  Number.prototype.padZero = function(length) {
    return String(this).padZero(length);
  };
  Object.defineProperties(Array.prototype, {
    /**
     * Checks whether the two arrays are same.
     *
     * @method Array.prototype.equals
     * @param {Array} array The array to compare to
     * @return {Boolean} True if the two arrays are same
     */
    equals: {
      enumerable: false,
      value(array) {
        if (!array || this.length !== array.length) {
          return false;
        }
        for (let i = 0; i < this.length; i++) {
          if (this[i] instanceof Array && array[i] instanceof Array) {
            if (!this[i].equals(array[i])) {
              return false;
            }
          } else if (this[i] !== array[i]) {
            return false;
          }
        }
        return true;
      }
    },
    /**
     * Makes a shallow copy of the array.
     *
     * @method Array.prototype.clone
     * @return {Array} A shallow copy of the array
     */
    clone: {
      enumerable: false,
      value() {
        return this.slice(0);
      }
    },
    /**
     * Checks whether the array contains a given element.
     *
     * @method Array.prototype.contains
     * @param {Any} element The element to search for
     * @return {Boolean} True if the array contains a given element
     */
    contains: {
      enumerable: false,
      value(element) {
        return this.includes(element);
      }
    }
  });
  String.prototype.contains = function(string) {
    return this.includes(string);
  };
  Math.randomInt = (max) => Math.floor(max * Math.random());

  // src-www/js/rpg_core/CacheEntry.js
  var CacheEntry = class {
    constructor(cache, key, item2) {
      this.cache = cache;
      this.key = key;
      this.item = item2;
      this.cached = false;
      this.touchTicks = 0;
      this.touchSeconds = 0;
      this.ttlTicks = 0;
      this.ttlSeconds = 0;
      this.freedByTTL = false;
    }
    /**
     * frees the resource
     */
    free(byTTL) {
      this.freedByTTL = byTTL || false;
      if (this.cached) {
        this.cached = false;
        delete this.cache._inner[this.key];
      }
    }
    /**
     * Allocates the resource
     * @returns {CacheEntry}
     */
    allocate() {
      if (!this.cached) {
        this.cache._inner[this.key] = this;
        this.cached = true;
      }
      this.touch();
      return this;
    }
    /**
     * Sets the time to live
     * @param {number} ticks TTL in ticks, 0 if not set
     * @param {number} time TTL in seconds, 0 if not set
     * @returns {CacheEntry}
     */
    setTimeToLive(ticks, seconds) {
      this.ttlTicks = ticks || 0;
      this.ttlSeconds = seconds || 0;
      return this;
    }
    isStillAlive() {
      const cache = this.cache;
      return (this.ttlTicks == 0 || this.touchTicks + this.ttlTicks < cache.updateTicks) && (this.ttlSeconds == 0 || this.touchSeconds + this.ttlSeconds < cache.updateSeconds);
    }
    /**
     * makes sure that resource wont freed by Time To Live
     * if resource was already freed by TTL, put it in cache again
     */
    touch() {
      const cache = this.cache;
      if (this.cached) {
        this.touchTicks = cache.updateTicks;
        this.touchSeconds = cache.updateSeconds;
      } else if (this.freedByTTL) {
        this.freedByTTL = false;
        if (!cache._inner[this.key]) {
          cache._inner[this.key] = this;
        }
      }
    }
  };
  var CacheEntry_default = CacheEntry;

  // src-www/js/rpg_core/CacheMap.js
  var CacheMap = class {
    constructor(manager) {
      this.manager = manager;
      this._inner = {};
      this._lastRemovedEntries = {};
      this.updateTicks = 0;
      this.lastCheckTTL = 0;
      this.delayCheckTTL = 100;
      this.updateSeconds = Date.now();
    }
    /**
     * checks ttl of all elements and removes dead ones
     */
    checkTTL() {
      const cache = this._inner;
      let temp = this._lastRemovedEntries;
      if (!temp) {
        temp = [];
        this._lastRemovedEntries = temp;
      }
      for (let key in cache) {
        const entry = cache[key];
        if (!entry.isStillAlive()) {
          temp.push(entry);
        }
      }
      for (let i = 0; i < temp.length; i++) {
        temp[i].free(true);
      }
      temp.length = 0;
    }
    /**
     * cache item
     * @param key url of cache element
     * @returns {*|null}
     */
    getItem(key) {
      const entry = this._inner[key];
      if (entry) {
        return entry.item;
      }
      return null;
    }
    clear() {
      const keys = Object.keys(this._inner);
      for (let i = 0; i < keys.length; i++) {
        this._inner[keys[i]].free();
      }
    }
    setItem(key, item2) {
      return new CacheEntry_default(this, key, item2).allocate();
    }
    update(ticks, delta) {
      this.updateTicks += ticks;
      this.updateSeconds += delta;
      if (this.updateSeconds >= this.delayCheckTTL + this.lastCheckTTL) {
        this.lastCheckTTL = this.updateSeconds;
        this.checkTTL();
      }
    }
  };
  var CacheMap_default = CacheMap;

  // src-www/js/rpg_core/ImageCache.js
  var ImageCache = class {
    constructor(...args) {
      this.initialize(...args);
    }
    initialize() {
      this._items = {};
    }
    add(key, value3) {
      this._items[key] = {
        bitmap: value3,
        touch: Date.now(),
        key
      };
      this._truncateCache();
    }
    get(key) {
      if (this._items[key]) {
        const item2 = this._items[key];
        item2.touch = Date.now();
        return item2.bitmap;
      }
      return null;
    }
    reserve(key, value3, reservationId) {
      if (!this._items[key]) {
        this._items[key] = {
          bitmap: value3,
          touch: Date.now(),
          key
        };
      }
      this._items[key].reservationId = reservationId;
    }
    releaseReservation(reservationId) {
      const items = this._items;
      Object.keys(items).map((key) => items[key]).forEach((item2) => {
        if (item2.reservationId === reservationId) {
          delete item2.reservationId;
        }
      });
    }
    _truncateCache() {
      const items = this._items;
      let sizeLeft = ImageCache.limit;
      Object.keys(items).map((key) => items[key]).sort((a2, b2) => a2.touch - b2.touch).forEach((item2) => {
        if (sizeLeft > 0 || this._mustBeHeld(item2)) {
          const bitmap = item2.bitmap;
          sizeLeft -= bitmap.width * bitmap.height;
        } else {
          delete items[item2.key];
        }
      });
    }
    _mustBeHeld({ bitmap, reservationId }) {
      if (bitmap.isRequestOnly())
        return false;
      if (reservationId)
        return true;
      if (!bitmap.isReady())
        return true;
      return false;
    }
    isReady() {
      const items = this._items;
      return !Object.keys(items).some(
        (key) => !items[key].bitmap.isRequestOnly() && !items[key].bitmap.isReady()
      );
    }
    getErrorBitmap() {
      const items = this._items;
      let bitmap = null;
      if (Object.keys(items).some((key) => {
        if (items[key].bitmap.isError()) {
          bitmap = items[key].bitmap;
          return true;
        }
        return false;
      })) {
        return bitmap;
      }
      return null;
    }
  };
  ImageCache.limit = 10 * 1e3 * 1e3;
  var ImageCache_default = ImageCache;

  // src-www/js/rpg_core/RequestQueue.js
  var RequestQueue = class {
    constructor(...args) {
      this.initialize(...args);
    }
    initialize() {
      this._queue = [];
    }
    enqueue(key, value3) {
      this._queue.push({
        key,
        value: value3
      });
    }
    update() {
      if (this._queue.length === 0)
        return;
      const top = this._queue[0];
      if (top.value.isRequestReady()) {
        this._queue.shift();
        if (this._queue.length !== 0) {
          this._queue[0].value.startRequest();
        }
      } else {
        top.value.startRequest();
      }
    }
    raisePriority(key) {
      for (let n = 0; n < this._queue.length; n++) {
        const item2 = this._queue[n];
        if (item2.key === key) {
          this._queue.splice(n, 1);
          this._queue.unshift(item2);
          break;
        }
      }
    }
    clear() {
      this._queue.splice(0);
    }
  };
  var RequestQueue_default = RequestQueue;

  // src-www/js/rpg_core/Utils.js
  var Utils = class {
    constructor() {
      throw new Error("This is a static class");
    }
    /**
     * Checks whether the option is in the query string.
     *
     * @static
     * @method isOptionValid
     * @param {String} name The option name
     * @return {Boolean} True if the option is in the query string
     */
    static isOptionValid(name) {
      if (location.search.slice(1).split("&").contains(name)) {
        return true;
      }
      if (typeof nw !== "undefined" && nw.App.argv.length > 0 && nw.App.argv[0].split("&").contains(name)) {
        return true;
      }
      return false;
    }
    /**
     * Checks whether the platform is NW.js.
     *
     * @static
     * @method isNwjs
     * @return {Boolean} True if the platform is NW.js
     */
    static isNwjs() {
      if (typeof Utils._nwjs === "boolean") {
        return Utils._nwjs;
      }
      const result2 = typeof __require === "function" && typeof process === "object";
      Utils._nwjs = result2;
      return result2;
    }
    /**
     * Checks whether the platform is Tauri.
     *
     * @static
     * @method isTauri
     * @return {Boolean} True if the platform is Tauri
     */
    static isTauri() {
      return !!window.__TAURI__;
    }
    /**
     * Checks whether refresh rate > 60hz.
     *
     * @static
     * @method isHighFps
     * @return {Boolean} True if refresh rate >= 66hz
     */
    static isHighFps() {
      if (Utils._fpsChecked) {
        return Utils._highFps;
      } else {
        return Utils.getFps() >= 66;
      }
    }
    /**
     * Returns estimated monitor refresh rate.
     *
     * @static
     * @method getFps
     * @return {Number} Refresh rate
     * @credit Adapted from Adam Sassano on Stack Overflow
     * @license CC BY-SA 4.0
     */
    static getFps() {
      if (Utils._fpsChecked || Utils._fpsIsBusyCounting) {
        return Utils._fps;
      } else {
        let previousTimestamp = 0;
        let count = 0;
        let rate = 0;
        const rafLoop = (timestamp) => {
          if (count <= 180) {
            count++;
            let interval = timestamp - previousTimestamp;
            rate += 1e3 / interval;
            previousTimestamp = timestamp;
            requestAnimationFrame(rafLoop);
          } else {
            if (Utils._fps !== Infinity) {
              Utils._fps = rate / count;
              if (Utils._fps >= 66) {
                Utils._highFps = true;
              }
            }
            Utils._fpsChecked = true;
            Utils._fpsIsBusyCounting = false;
          }
        };
        requestAnimationFrame((timestamp) => {
          previousTimestamp = timestamp;
          requestAnimationFrame(rafLoop);
        });
        Utils._fpsIsBusyCounting = true;
        return Utils._fps;
      }
    }
    /**
     * Checks whether the platform is a mobile device.
     *
     * @static
     * @method isMobileDevice
     * @return {Boolean} True if the platform is a mobile device
     */
    static isMobileDevice() {
      if (typeof Utils._mobileDevice === "boolean") {
        return Utils._mobileDevice;
      }
      const r = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
      const result2 = !!navigator.userAgent.match(r);
      Utils._mobileDevice = result2;
      return result2;
    }
    /**
     * Checks whether the browser is Mobile Safari.
     *
     * @static
     * @method isMobileSafari
     * @return {Boolean} True if the browser is Mobile Safari
     */
    static isMobileSafari() {
      if (typeof Utils._mobileSafari === "boolean") {
        return Utils._mobileSafari;
      }
      const agent = navigator.userAgent;
      const result2 = !!(agent.match(/iPhone|iPad|iPod/) && agent.match(/AppleWebKit/) && !agent.match("CriOS"));
      Utils._mobileSafari = result2;
      return result2;
    }
    /**
     * Checks whether the browser is Android Chrome.
     *
     * @static
     * @method isAndroidChrome
     * @return {Boolean} True if the browser is Android Chrome
     */
    static isAndroidChrome() {
      if (typeof Utils._androidChrome === "boolean") {
        return Utils._androidChrome;
      }
      const agent = navigator.userAgent;
      const result2 = !!(agent.match(/Android/) && agent.match(/Chrome/));
      Utils._androidChrome = result2;
      return result2;
    }
    /**
     * Checks whether the browser can read files in the game folder.
     *
     * @static
     * @method canReadGameFiles
     * @return {Boolean} True if the browser can read files in the game folder
     */
    static canReadGameFiles() {
      const scripts = document.getElementsByTagName("script");
      const lastScript = scripts[scripts.length - 1];
      const xhr = new XMLHttpRequest();
      try {
        xhr.open("GET", lastScript.src);
        xhr.overrideMimeType("text/javascript");
        xhr.send();
        return true;
      } catch (e) {
        return false;
      }
    }
    /**
     * Makes a CSS color string from RGB values.
     *
     * @static
     * @method rgbToCssColor
     * @param {Number} r The red value in the range (0, 255)
     * @param {Number} g The green value in the range (0, 255)
     * @param {Number} b The blue value in the range (0, 255)
     * @return {String} CSS color string
     */
    static rgbToCssColor(r, g, b2) {
      r = Math.round(r);
      g = Math.round(g);
      b2 = Math.round(b2);
      return `rgb(${r},${g},${b2})`;
    }
    static generateRuntimeId() {
      return Utils._id++;
    }
    /**
     * Test this browser support passive event feature
     *
     * @static
     * @method isSupportPassiveEvent
     * @return {Boolean} this browser support passive event or not
     */
    static isSupportPassiveEvent() {
      if (typeof Utils._supportPassiveEvent === "boolean") {
        return Utils._supportPassiveEvent;
      }
      let passive = false;
      const options = Object.defineProperty({}, "passive", {
        get() {
          passive = true;
        }
      });
      window.addEventListener("test", null, options);
      Utils._supportPassiveEvent = passive;
      return passive;
    }
  };
  Utils.RPGMAKER_NAME = "MV";
  Utils.RPGMAKER_VERSION = "1.6.1";
  Utils.RPGMAKER_ENGINE = "community-1.4";
  Utils._nwjs = null;
  Utils._highFps = false;
  Utils._fps = 60;
  Utils._fpsIsBusyCounting = false;
  Utils._fpsChecked = false;
  Utils._mobileDevice = null;
  Utils._mobileSafari = null;
  Utils._androidChrome = null;
  Utils._id = 1;
  Utils._supportPassiveEvent = null;
  var Utils_default = Utils;

  // src-www/js/rpg_core/Decrypter.js
  var Decrypter = class {
    constructor() {
      throw new Error("This is a static class");
    }
    static checkImgIgnore(url) {
      for (let cnt = 0; cnt < this._ignoreList.length; cnt++) {
        if (url === this._ignoreList[cnt])
          return true;
      }
      return false;
    }
    static decryptImg(url, bitmap) {
      url = this.extToEncryptExt(url);
      const requestFile = new XMLHttpRequest();
      requestFile.open("GET", url);
      requestFile.responseType = "arraybuffer";
      requestFile.send();
      requestFile.onload = function() {
        if (this.status < Decrypter._xhrOk) {
          const arrayBuffer = Decrypter.decryptArrayBuffer(requestFile.response);
          bitmap._image.src = Decrypter.createBlobUrl(arrayBuffer);
          bitmap._image.addEventListener(
            "load",
            bitmap._loadListener = Bitmap_default.prototype._onLoad.bind(bitmap)
          );
          bitmap._image.addEventListener(
            "error",
            bitmap._errorListener = bitmap._loader || Bitmap_default.prototype._onError.bind(bitmap)
          );
        }
      };
      requestFile.onerror = () => {
        if (bitmap._loader) {
          bitmap._loader();
        } else {
          bitmap._onError();
        }
      };
    }
    static decryptArrayBuffer(arrayBuffer) {
      if (!arrayBuffer)
        return null;
      const header = new Uint8Array(arrayBuffer, 0, this._headerlength);
      let i;
      const ref = this.SIGNATURE + this.VER + this.REMAIN;
      const refBytes = new Uint8Array(16);
      for (i = 0; i < this._headerlength; i++) {
        refBytes[i] = parseInt(`0x${ref.substr(i * 2, 2)}`, 16);
      }
      for (i = 0; i < this._headerlength; i++) {
        if (header[i] !== refBytes[i]) {
          throw new Error("Header is wrong");
        }
      }
      arrayBuffer = this.cutArrayHeader(arrayBuffer, Decrypter._headerlength);
      const view = new DataView(arrayBuffer);
      this.readEncryptionkey();
      if (arrayBuffer) {
        const byteArray = new Uint8Array(arrayBuffer);
        for (i = 0; i < this._headerlength; i++) {
          byteArray[i] = byteArray[i] ^ parseInt(Decrypter._encryptionKey[i], 16);
          view.setUint8(i, byteArray[i]);
        }
      }
      return arrayBuffer;
    }
    static readEncryptionkey() {
      this._encryptionKey = self.$dataSystem.encryptionKey.split(/(.{2})/).filter(Boolean);
    }
    static cutArrayHeader(arrayBuffer, length) {
      arrayBuffer.slice(length);
    }
    static createBlobUrl(arrayBuffer) {
      const blob = new Blob([arrayBuffer]);
      return window.URL.createObjectURL(blob);
    }
    static extToEncryptExt(url) {
      const ext = url.split(".").pop();
      let encryptedExt = ext;
      if (ext === "ogg")
        encryptedExt = ".rpgmvo";
      else if (ext === "m4a")
        encryptedExt = ".rpgmvm";
      else if (ext === "png")
        encryptedExt = ".rpgmvp";
      else
        encryptedExt = ext;
      return url.slice(0, url.lastIndexOf(ext) - 1) + encryptedExt;
    }
  };
  Decrypter.hasEncryptedImages = false;
  Decrypter.hasEncryptedAudio = false;
  Decrypter._requestImgFile = [];
  Decrypter._headerlength = 16;
  Decrypter._xhrOk = 400;
  Decrypter._encryptionKey = "";
  Decrypter._ignoreList = ["img/system/Window.png"];
  Decrypter.SIGNATURE = "5250474d56000000";
  Decrypter.VER = "000301";
  Decrypter.REMAIN = "0000000000";
  var Decrypter_default = Decrypter;

  // src-www/js/rpg_core/WebAudio.js
  var WebAudio = class {
    constructor(...args) {
      this.initialize(...args);
    }
    initialize(url) {
      if (!WebAudio._initialized) {
        WebAudio.initialize();
      }
      this.clear();
      if (!WebAudio._standAlone) {
        this._loader = ResourceHandler_default.createLoader(
          url,
          this._load.bind(this, url),
          () => {
            this._hasError = true;
          }
        );
      }
      this._load(url);
      this._url = url;
    }
    /**
     * Initializes the audio system.
     *
     * @static
     * @method initialize
     * @param {Boolean} noAudio Flag for the no-audio mode
     * @return {Boolean} True if the audio system is available
     */
    static initialize(noAudio) {
      if (!this._initialized) {
        if (!noAudio) {
          this._createContext();
          this._detectCodecs();
          this._createMasterGainNode();
          this._setupEventHandlers();
        }
        this._initialized = true;
      }
      return !!this._context;
    }
    /**
     * Checks whether the browser can play ogg files.
     *
     * @static
     * @method canPlayOgg
     * @return {Boolean} True if the browser can play ogg files
     */
    static canPlayOgg() {
      if (!this._initialized) {
        this.initialize();
      }
      return !!this._canPlayOgg;
    }
    /**
     * Checks whether the browser can play m4a files.
     *
     * @static
     * @method canPlayM4a
     * @return {Boolean} True if the browser can play m4a files
     */
    static canPlayM4a() {
      if (!this._initialized) {
        this.initialize();
      }
      return !!this._canPlayM4a;
    }
    /**
     * Sets the master volume of the all audio.
     *
     * @static
     * @method setMasterVolume
     * @param {Number} value Master volume (min: 0, max: 1)
     */
    static setMasterVolume(value3) {
      this._masterVolume = value3;
      if (this._masterGainNode) {
        this._masterGainNode.gain.setValueAtTime(
          this._masterVolume,
          this._context.currentTime
        );
      }
    }
    /**
     * @static
     * @method _createContext
     * @private
     */
    static _createContext() {
      try {
        if (typeof AudioContext !== "undefined") {
          this._context = new AudioContext();
        } else if (typeof webkitAudioContext !== "undefined") {
          this._context = new webkitAudioContext();
        }
      } catch (e) {
        this._context = null;
      }
    }
    /**
     * @static
     * @method _detectCodecs
     * @private
     */
    static _detectCodecs() {
      const audio = document.createElement("audio");
      if (audio.canPlayType) {
        this._canPlayOgg = audio.canPlayType('audio/ogg; codecs="vorbis"');
        this._canPlayM4a = audio.canPlayType("audio/mp4");
      }
    }
    /**
     * @static
     * @method _createMasterGainNode
     * @private
     */
    static _createMasterGainNode() {
      const context = WebAudio._context;
      if (context) {
        this._masterGainNode = context.createGain();
        this._masterGainNode.gain.setValueAtTime(
          this._masterVolume,
          context.currentTime
        );
        this._masterGainNode.connect(context.destination);
      }
    }
    /**
     * @static
     * @method _setupEventHandlers
     * @private
     */
    static _setupEventHandlers() {
      const resumeHandler = () => {
        const context = WebAudio._context;
        if (context && context.state === "suspended" && typeof context.resume === "function") {
          context.resume().then(() => {
            WebAudio._onTouchStart();
          });
        } else {
          WebAudio._onTouchStart();
        }
      };
      document.addEventListener("keydown", resumeHandler);
      document.addEventListener("mousedown", resumeHandler);
      document.addEventListener("touchend", resumeHandler);
      document.addEventListener("touchstart", this._onTouchStart.bind(this));
      document.addEventListener(
        "visibilitychange",
        this._onVisibilityChange.bind(this)
      );
    }
    /**
     * @static
     * @method _onTouchStart
     * @private
     */
    static _onTouchStart() {
      const context = WebAudio._context;
      if (context && !this._unlocked) {
        const node = context.createBufferSource();
        node.start(0);
        this._unlocked = true;
      }
    }
    /**
     * @static
     * @method _onVisibilityChange
     * @private
     */
    static _onVisibilityChange() {
      if (document.visibilityState === "hidden") {
        this._onHide();
      } else {
        this._onShow();
      }
    }
    /**
     * @static
     * @method _onHide
     * @private
     */
    static _onHide() {
      if (this._shouldMuteOnHide()) {
        this._fadeOut(1);
      }
    }
    /**
     * @static
     * @method _onShow
     * @private
     */
    static _onShow() {
      if (this._shouldMuteOnHide()) {
        this._fadeIn(1);
      }
    }
    /**
     * @static
     * @method _fadeIn
     * @param {Number} duration
     * @private
     */
    static _fadeIn(duration) {
      if (this._masterGainNode) {
        const gain = this._masterGainNode.gain;
        const currentTime = WebAudio._context.currentTime;
        gain.setValueAtTime(0, currentTime);
        gain.linearRampToValueAtTime(this._masterVolume, currentTime + duration);
      }
    }
    /**
     * @static
     * @method _fadeOut
     * @param {Number} duration
     * @private
     */
    static _fadeOut(duration) {
      if (this._masterGainNode) {
        const gain = this._masterGainNode.gain;
        const currentTime = WebAudio._context.currentTime;
        gain.setValueAtTime(this._masterVolume, currentTime);
        gain.linearRampToValueAtTime(0, currentTime + duration);
      }
    }
    /**
     * Clears the audio data.
     *
     * @method clear
     */
    clear() {
      this.stop();
      this._buffer = null;
      this._sourceNode = null;
      this._gainNode = null;
      this._pannerNode = null;
      this._totalTime = 0;
      this._sampleRate = 0;
      this._loopStart = 0;
      this._loopLength = 0;
      this._startTime = 0;
      this._volume = 1;
      this._pitch = 1;
      this._pan = 0;
      this._endTimer = null;
      this._loadListeners = [];
      this._stopListeners = [];
      this._hasError = false;
      this._autoPlay = false;
    }
    /**
     * [read-only] The url of the audio file.
     *
     * @property url
     * @type String
     */
    get url() {
      return this._url;
    }
    /**
     * The volume of the audio.
     *
     * @property volume
     * @type Number
     */
    get volume() {
      return this._volume;
    }
    set volume(value3) {
      this._volume = value3;
      if (this._gainNode) {
        this._gainNode.gain.setValueAtTime(
          this._volume,
          WebAudio._context.currentTime
        );
      }
    }
    /**
     * The pitch of the audio.
     *
     * @property pitch
     * @type Number
     */
    get pitch() {
      return this._pitch;
    }
    set pitch(value3) {
      if (this._pitch !== value3) {
        this._pitch = value3;
        if (this.isPlaying()) {
          this.play(this._sourceNode.loop, 0);
        }
      }
    }
    /**
     * The pan of the audio.
     *
     * @property pan
     * @type Number
     */
    get pan() {
      return this._pan;
    }
    set pan(value3) {
      this._pan = value3;
      this._updatePanner();
    }
    /**
     * Checks whether the audio data is ready to play.
     *
     * @method isReady
     * @return {Boolean} True if the audio data is ready to play
     */
    isReady() {
      return !!this._buffer;
    }
    /**
     * Checks whether a loading error has occurred.
     *
     * @method isError
     * @return {Boolean} True if a loading error has occurred
     */
    isError() {
      return this._hasError;
    }
    /**
     * Checks whether the audio is playing.
     *
     * @method isPlaying
     * @return {Boolean} True if the audio is playing
     */
    isPlaying() {
      return !!this._sourceNode;
    }
    /**
     * Plays the audio.
     *
     * @method play
     * @param {Boolean} loop Whether the audio data play in a loop
     * @param {Number} offset The start position to play in seconds
     */
    play(loop, offset) {
      if (this.isReady()) {
        offset = offset || 0;
        this._startPlaying(loop, offset);
      } else if (WebAudio._context) {
        this._autoPlay = true;
        this.addLoadListener(() => {
          if (this._autoPlay) {
            this.play(loop, offset);
          }
        });
      }
    }
    /**
     * Stops the audio.
     *
     * @method stop
     */
    stop() {
      this._autoPlay = false;
      this._removeEndTimer();
      this._removeNodes();
      if (this._stopListeners) {
        while (this._stopListeners.length > 0) {
          const listner = this._stopListeners.shift();
          listner();
        }
      }
    }
    /**
     * Performs the audio fade-in.
     *
     * @method fadeIn
     * @param {Number} duration Fade-in time in seconds
     */
    fadeIn(duration) {
      if (this.isReady()) {
        if (this._gainNode) {
          const gain = this._gainNode.gain;
          const currentTime = WebAudio._context.currentTime;
          gain.setValueAtTime(0, currentTime);
          gain.linearRampToValueAtTime(this._volume, currentTime + duration);
        }
      } else if (this._autoPlay) {
        this.addLoadListener(() => {
          this.fadeIn(duration);
        });
      }
    }
    /**
     * Performs the audio fade-out.
     *
     * @method fadeOut
     * @param {Number} duration Fade-out time in seconds
     */
    fadeOut(duration) {
      if (this._gainNode) {
        const gain = this._gainNode.gain;
        const currentTime = WebAudio._context.currentTime;
        gain.setValueAtTime(this._volume, currentTime);
        gain.linearRampToValueAtTime(0, currentTime + duration);
      }
      this._autoPlay = false;
    }
    /**
     * Gets the seek position of the audio.
     *
     * @method seek
     */
    seek() {
      if (WebAudio._context) {
        let pos = (WebAudio._context.currentTime - this._startTime) * this._pitch;
        if (this._loopLength > 0) {
          while (pos >= this._loopStart + this._loopLength) {
            pos -= this._loopLength;
          }
        }
        return pos;
      } else {
        return 0;
      }
    }
    /**
     * Add a callback function that will be called when the audio data is loaded.
     *
     * @method addLoadListener
     * @param {Function} listner The callback function
     */
    addLoadListener(listner) {
      this._loadListeners.push(listner);
    }
    /**
     * Add a callback function that will be called when the playback is stopped.
     *
     * @method addStopListener
     * @param {Function} listner The callback function
     */
    addStopListener(listner) {
      this._stopListeners.push(listner);
    }
    /**
     * @method _load
     * @param {String} url
     * @private
     */
    _load(url) {
      if (WebAudio._context) {
        const xhr = new XMLHttpRequest();
        if (Decrypter_default.hasEncryptedAudio)
          url = Decrypter_default.extToEncryptExt(url);
        xhr.open("GET", url);
        xhr.responseType = "arraybuffer";
        xhr.onload = () => {
          if (xhr.status < 400) {
            this._onXhrLoad(xhr);
          }
        };
        xhr.onerror = this._loader || (() => {
          this._hasError = true;
        });
        xhr.send();
      }
    }
    /**
     * @method _onXhrLoad
     * @param {XMLHttpRequest} xhr
     * @private
     */
    _onXhrLoad({ response }) {
      let array = response;
      if (Decrypter_default.hasEncryptedAudio)
        array = Decrypter_default.decryptArrayBuffer(array);
      this._readLoopComments(new Uint8Array(array));
      WebAudio._context.decodeAudioData(array, (buffer) => {
        this._buffer = buffer;
        this._totalTime = buffer.duration;
        if (this._loopLength > 0 && this._sampleRate > 0) {
          this._loopStart /= this._sampleRate;
          this._loopLength /= this._sampleRate;
        } else {
          this._loopStart = 0;
          this._loopLength = this._totalTime;
        }
        this._onLoad();
      });
    }
    /**
     * @method _startPlaying
     * @param {Boolean} loop
     * @param {Number} offset
     * @private
     */
    _startPlaying(loop, offset) {
      if (this._loopLength > 0) {
        while (offset >= this._loopStart + this._loopLength) {
          offset -= this._loopLength;
        }
      }
      this._removeEndTimer();
      this._removeNodes();
      this._createNodes();
      this._connectNodes();
      this._sourceNode.loop = loop;
      this._sourceNode.start(0, offset);
      this._startTime = WebAudio._context.currentTime - offset / this._pitch;
      this._createEndTimer();
    }
    /**
     * @method _createNodes
     * @private
     */
    _createNodes() {
      const context = WebAudio._context;
      this._sourceNode = context.createBufferSource();
      this._sourceNode.buffer = this._buffer;
      this._sourceNode.loopStart = this._loopStart;
      this._sourceNode.loopEnd = this._loopStart + this._loopLength;
      this._sourceNode.playbackRate.setValueAtTime(
        this._pitch,
        context.currentTime
      );
      this._gainNode = context.createGain();
      this._gainNode.gain.setValueAtTime(this._volume, context.currentTime);
      this._pannerNode = context.createPanner();
      this._pannerNode.panningModel = "equalpower";
      this._updatePanner();
    }
    /**
     * @method _connectNodes
     * @private
     */
    _connectNodes() {
      this._sourceNode.connect(this._gainNode);
      this._gainNode.connect(this._pannerNode);
      this._pannerNode.connect(WebAudio._masterGainNode);
    }
    /**
     * @method _removeNodes
     * @private
     */
    _removeNodes() {
      if (this._sourceNode) {
        this._sourceNode.stop(0);
        this._sourceNode = null;
        this._gainNode = null;
        this._pannerNode = null;
      }
    }
    /**
     * @method _createEndTimer
     * @private
     */
    _createEndTimer() {
      if (this._sourceNode && !this._sourceNode.loop) {
        const endTime = this._startTime + this._totalTime / this._pitch;
        const delay = endTime - WebAudio._context.currentTime;
        this._endTimer = setTimeout(() => {
          this.stop();
        }, delay * 1e3);
      }
    }
    /**
     * @method _removeEndTimer
     * @private
     */
    _removeEndTimer() {
      if (this._endTimer) {
        clearTimeout(this._endTimer);
        this._endTimer = null;
      }
    }
    /**
     * @method _updatePanner
     * @private
     */
    _updatePanner() {
      if (this._pannerNode) {
        const x = this._pan;
        const z = 1 - Math.abs(x);
        this._pannerNode.setPosition(x, 0, z);
      }
    }
    /**
     * @method _onLoad
     * @private
     */
    _onLoad() {
      while (this._loadListeners.length > 0) {
        const listner = this._loadListeners.shift();
        listner();
      }
    }
    /**
     * @method _readLoopComments
     * @param {Uint8Array} array
     * @private
     */
    _readLoopComments(array) {
      this._readOgg(array);
      this._readMp4(array);
    }
    /**
     * @method _readOgg
     * @param {Uint8Array} array
     * @private
     */
    _readOgg(array) {
      let index = 0;
      while (index < array.length) {
        if (this._readFourCharacters(array, index) === "OggS") {
          index += 26;
          let vorbisHeaderFound = false;
          const numSegments = array[index++];
          const segments = [];
          for (let i = 0; i < numSegments; i++) {
            segments.push(array[index++]);
          }
          for (let i = 0; i < numSegments; i++) {
            if (this._readFourCharacters(array, index + 1) === "vorb") {
              const headerType = array[index];
              if (headerType === 1) {
                this._sampleRate = this._readLittleEndian(array, index + 12);
              } else if (headerType === 3) {
                let size = 0;
                for (; i < numSegments; i++) {
                  size += segments[i];
                  if (segments[i] < 255) {
                    break;
                  }
                }
                this._readMetaData(array, index, size);
              }
              vorbisHeaderFound = true;
            }
            index += segments[i];
          }
          if (!vorbisHeaderFound) {
            break;
          }
        } else {
          break;
        }
      }
    }
    /**
     * @method _readMp4
     * @param {Uint8Array} array
     * @private
     */
    _readMp4(array) {
      if (this._readFourCharacters(array, 4) === "ftyp") {
        let index = 0;
        while (index < array.length) {
          const size = this._readBigEndian(array, index);
          const name = this._readFourCharacters(array, index + 4);
          if (name === "moov") {
            index += 8;
          } else {
            if (name === "mvhd") {
              this._sampleRate = this._readBigEndian(array, index + 20);
            }
            if (name === "udta" || name === "meta") {
              this._readMetaData(array, index, size);
            }
            index += size;
            if (size <= 1) {
              break;
            }
          }
        }
      }
    }
    /**
     * @method _readMetaData
     * @param {Uint8Array} array
     * @param {Number} index
     * @param {Number} size
     * @private
     */
    _readMetaData(array, index, size) {
      for (let i = index; i < index + size - 10; i++) {
        if (this._readFourCharacters(array, i) === "LOOP") {
          let text = "";
          while (array[i] > 0) {
            text += String.fromCharCode(array[i++]);
          }
          if (text.match(/LOOPSTART=([0-9]+)/)) {
            this._loopStart = parseInt(RegExp.$1);
          }
          if (text.match(/LOOPLENGTH=([0-9]+)/)) {
            this._loopLength = parseInt(RegExp.$1);
          }
          if (text == "LOOPSTART" || text == "LOOPLENGTH") {
            let text2 = "";
            i += 16;
            while (array[i] > 0) {
              text2 += String.fromCharCode(array[i++]);
            }
            if (text == "LOOPSTART") {
              this._loopStart = parseInt(text2);
            } else {
              this._loopLength = parseInt(text2);
            }
          }
        }
      }
    }
    /**
     * @method _readLittleEndian
     * @param {Uint8Array} array
     * @param {Number} index
     * @private
     */
    _readLittleEndian(array, index) {
      return array[index + 3] * 16777216 + array[index + 2] * 65536 + array[index + 1] * 256 + array[index + 0];
    }
    /**
     * @method _readBigEndian
     * @param {Uint8Array} array
     * @param {Number} index
     * @private
     */
    _readBigEndian(array, index) {
      return array[index + 0] * 16777216 + array[index + 1] * 65536 + array[index + 2] * 256 + array[index + 3];
    }
    /**
     * @method _readFourCharacters
     * @param {Uint8Array} array
     * @param {Number} index
     * @private
     */
    _readFourCharacters(array, index) {
      let string = "";
      for (let i = 0; i < 4; i++) {
        string += String.fromCharCode(array[index + i]);
      }
      return string;
    }
    static _shouldMuteOnHide() {
      return Utils_default.isMobileDevice();
    }
  };
  WebAudio._standAlone = ((top) => !top.ResourceHandler)(self);
  WebAudio._masterVolume = 1;
  WebAudio._context = null;
  WebAudio._masterGainNode = null;
  WebAudio._initialized = false;
  WebAudio._unlocked = false;
  var WebAudio_default = WebAudio;

  // src-www/js/rpg_managers/AudioManager.js
  var AudioManager = class {
    constructor() {
      throw new Error("This is a static class");
    }
    static playBgm(bgm, pos) {
      if (this.isCurrentBgm(bgm)) {
        this.updateBgmParameters(bgm);
      } else {
        this.stopBgm();
        if (bgm.name) {
          this._bgmBuffer = this.createBuffer("bgm", bgm.name);
          this.updateBgmParameters(bgm);
          if (!this._meBuffer) {
            this._bgmBuffer.play(true, pos || 0);
          }
        }
      }
      this.updateCurrentBgm(bgm, pos);
    }
    static playEncryptedBgm({ name }, pos) {
      const ext = this.audioFileExt();
      let url = `${this._path}bgm/${encodeURIComponent(name)}${ext}`;
      url = Decrypter_default.extToEncryptExt(url);
    }
    static createDecryptBuffer(url, bgm, pos) {
      this._blobUrl = url;
      this._bgmBuffer = this.createBuffer("bgm", bgm.name);
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
    static isCurrentBgm({ name }) {
      return this._currentBgm && this._bgmBuffer && this._currentBgm.name === name;
    }
    static updateBgmParameters(bgm) {
      this.updateBufferParameters(this._bgmBuffer, this._bgmVolume, bgm);
    }
    static updateCurrentBgm({ name, volume, pitch, pan }, pos) {
      this._currentBgm = {
        name,
        volume,
        pitch,
        pan,
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
          this._bgsBuffer = this.createBuffer("bgs", bgs.name);
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
    static isCurrentBgs({ name }) {
      return this._currentBgs && this._bgsBuffer && this._currentBgs.name === name;
    }
    static updateBgsParameters(bgs) {
      this.updateBufferParameters(this._bgsBuffer, this._bgsVolume, bgs);
    }
    static updateCurrentBgs({ name, volume, pitch, pan }, pos) {
      this._currentBgs = {
        name,
        volume,
        pitch,
        pan,
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
        this._meBuffer = this.createBuffer("me", me.name);
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
        this._seBuffers = this._seBuffers.filter((audio) => audio.isPlaying());
        const buffer = this.createBuffer("se", se.name);
        this.updateSeParameters(buffer, se);
        buffer.play(false);
        this._seBuffers.push(buffer);
      }
    }
    static updateSeParameters(buffer, se) {
      this.updateBufferParameters(buffer, this._seVolume, se);
    }
    static stopSe() {
      this._seBuffers.forEach((buffer) => {
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
        const buffer = this.createBuffer("se", se.name);
        buffer._reservedSeName = se.name;
        this._staticBuffers.push(buffer);
      }
    }
    static isStaticSe({ name }) {
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
      const audio = new WebAudio_default(url);
      this._callCreationHook(audio);
      return audio;
    }
    static checkErrors() {
      this.checkWebAudioError(this._bgmBuffer);
      this.checkWebAudioError(this._bgsBuffer);
      this.checkWebAudioError(this._meBuffer);
      this._seBuffers.forEach((buffer) => {
        this.checkWebAudioError(buffer);
      });
      this._staticBuffers.forEach((buffer) => {
        this.checkWebAudioError(buffer);
      });
    }
    static setCreationHook(hook) {
      this._creationHook = hook;
    }
    static _callCreationHook(audio) {
      if (this._creationHook)
        this._creationHook(audio);
    }
    static audioFileExt() {
      if (WebAudio_default.canPlayOgg() && !Utils_default.isMobileDevice()) {
        return ".ogg";
      } else {
        return ".m4a";
      }
    }
    static shouldUseHtml5Audio() {
      return false;
    }
    static checkWebAudioError(webAudio) {
      if (webAudio && webAudio.isError()) {
        throw new Error(`Failed to load: ${webAudio.url}`);
      }
    }
    static makeEmptyAudioObject() {
      return {
        name: "",
        volume: 0,
        pitch: 0
      };
    }
    static updateBufferParameters(buffer, configVolume, audio) {
      if (buffer && audio) {
        buffer.volume = configVolume * (audio.volume || 0) / 1e4;
        buffer.pitch = (audio.pitch || 0) / 100;
        buffer.pan = (audio.pan || 0) / 100;
      }
    }
  };
  AudioManager._masterVolume = 1;
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
  AudioManager._path = "audio/";
  AudioManager._blobUrl = null;
  Object.defineProperty(AudioManager, "masterVolume", {
    get() {
      return this._masterVolume;
    },
    set(value3) {
      this._masterVolume = value3;
      WebAudio_default.setMasterVolume(this._masterVolume);
      Graphics_default.setVideoVolume(this._masterVolume);
    },
    configurable: true
  });
  Object.defineProperty(AudioManager, "bgmVolume", {
    get() {
      return this._bgmVolume;
    },
    set(value3) {
      this._bgmVolume = value3;
      this.updateBgmParameters(this._currentBgm);
    },
    configurable: true
  });
  Object.defineProperty(AudioManager, "bgsVolume", {
    get() {
      return this._bgsVolume;
    },
    set(value3) {
      this._bgsVolume = value3;
      this.updateBgsParameters(this._currentBgs);
    },
    configurable: true
  });
  Object.defineProperty(AudioManager, "meVolume", {
    get() {
      return this._meVolume;
    },
    set(value3) {
      this._meVolume = value3;
      this.updateMeParameters(this._currentMe);
    },
    configurable: true
  });
  Object.defineProperty(AudioManager, "seVolume", {
    get() {
      return this._seVolume;
    },
    set(value3) {
      this._seVolume = value3;
    },
    configurable: true
  });
  var AudioManager_default = AudioManager;

  // src-www/js/rpg_core/Input.js
  var Input = class {
    constructor() {
      throw new Error("This is a static class");
    }
    /**
     * Initializes the input system.
     *
     * @static
     * @method initialize
     */
    static initialize() {
      this.clear();
      this._wrapNwjsAlert();
      this._setupEventHandlers();
    }
    /**
     * Clears all the input data.
     *
     * @static
     * @method clear
     */
    static clear() {
      this._currentState = {};
      this._previousState = {};
      this._gamepadStates = [];
      this._latestButton = null;
      this._pressedTime = 0;
      this._dir4 = 0;
      this._dir8 = 0;
      this._preferredAxis = "";
      this._date = 0;
    }
    /**
     * Updates the input data.
     *
     * @static
     * @method update
     */
    static update() {
      this._pollGamepads();
      if (this._currentState[this._latestButton]) {
        this._pressedTime++;
      } else {
        this._latestButton = null;
      }
      for (let name in this._currentState) {
        if (this._currentState[name] && !this._previousState[name]) {
          this._latestButton = name;
          this._pressedTime = 0;
          this._date = Date.now();
        }
        this._previousState[name] = this._currentState[name];
      }
      this._updateDirection();
    }
    /**
     * Checks whether a key is currently pressed down.
     *
     * @static
     * @method isPressed
     * @param {String} keyName The mapped name of the key
     * @return {Boolean} True if the key is pressed
     */
    static isPressed(keyName) {
      if (this._isEscapeCompatible(keyName) && this.isPressed("escape")) {
        return true;
      } else {
        return !!this._currentState[keyName];
      }
    }
    /**
     * Checks whether a key is just pressed.
     *
     * @static
     * @method isTriggered
     * @param {String} keyName The mapped name of the key
     * @return {Boolean} True if the key is triggered
     */
    static isTriggered(keyName) {
      if (this._isEscapeCompatible(keyName) && this.isTriggered("escape")) {
        return true;
      } else {
        return this._latestButton === keyName && this._pressedTime === 0;
      }
    }
    /**
     * Checks whether a key is just pressed or a key repeat occurred.
     *
     * @static
     * @method isRepeated
     * @param {String} keyName The mapped name of the key
     * @return {Boolean} True if the key is repeated
     */
    static isRepeated(keyName) {
      if (this._isEscapeCompatible(keyName) && this.isRepeated("escape")) {
        return true;
      } else {
        return this._latestButton === keyName && (this._pressedTime === 0 || this._pressedTime >= this.keyRepeatWait && this._pressedTime % this.keyRepeatInterval === 0);
      }
    }
    /**
     * Checks whether a key is kept depressed.
     *
     * @static
     * @method isLongPressed
     * @param {String} keyName The mapped name of the key
     * @return {Boolean} True if the key is long-pressed
     */
    static isLongPressed(keyName) {
      if (this._isEscapeCompatible(keyName) && this.isLongPressed("escape")) {
        return true;
      } else {
        return this._latestButton === keyName && this._pressedTime >= this.keyRepeatWait;
      }
    }
    /**
     * @static
     * @method _setupEventHandlers
     * @private
     */
    static _setupEventHandlers() {
      document.addEventListener("keydown", this._onKeyDown.bind(this));
      document.addEventListener("keyup", this._onKeyUp.bind(this));
      window.addEventListener("blur", this._onLostFocus.bind(this));
    }
    /**
     * @static
     * @method _onKeyDown
     * @param {KeyboardEvent} event
     * @private
     */
    static _onKeyDown(event) {
      if (this._shouldPreventDefault(event.keyCode)) {
        event.preventDefault();
      }
      if (event.keyCode === 144) {
        this.clear();
      }
      const buttonName = this.keyMapper[event.keyCode];
      if (ResourceHandler_default.exists() && buttonName === "ok") {
        ResourceHandler_default.retry();
      } else if (buttonName) {
        this._currentState[buttonName] = true;
      }
    }
    /**
     * @static
     * @method _onKeyUp
     * @param {KeyboardEvent} event
     * @private
     */
    static _onKeyUp({ keyCode }) {
      const buttonName = this.keyMapper[keyCode];
      if (buttonName) {
        this._currentState[buttonName] = false;
      }
      if (keyCode === 0) {
        this.clear();
      }
    }
    /**
     * @static
     * @method _onLostFocus
     * @private
     */
    static _onLostFocus() {
      this.clear();
    }
    /**
     * @static
     * @method _pollGamepads
     * @private
     */
    static _pollGamepads() {
      if (navigator.getGamepads) {
        const gamepads = navigator.getGamepads();
        if (gamepads) {
          for (const gamepad of gamepads) {
            if (gamepad && gamepad.connected) {
              this._updateGamepadState(gamepad);
            }
          }
        }
      }
    }
    /**
     * @static
     * @method _updateGamepadState
     * @param {Gamepad} gamepad
     * @param {Number} index
     * @private
     */
    static _updateGamepadState(gamepad) {
      const lastState = this._gamepadStates[gamepad.index] || [];
      const newState = [];
      const buttons = gamepad.buttons;
      const axes = gamepad.axes;
      const threshold = 0.5;
      newState[12] = false;
      newState[13] = false;
      newState[14] = false;
      newState[15] = false;
      for (let i = 0; i < buttons.length; i++) {
        newState[i] = buttons[i].pressed;
      }
      if (axes[1] < -threshold) {
        newState[12] = true;
      } else if (axes[1] > threshold) {
        newState[13] = true;
      }
      if (axes[0] < -threshold) {
        newState[14] = true;
      } else if (axes[0] > threshold) {
        newState[15] = true;
      }
      for (let j = 0; j < newState.length; j++) {
        if (newState[j] !== lastState[j]) {
          const buttonName = this.gamepadMapper[j];
          if (buttonName) {
            this._currentState[buttonName] = newState[j];
          }
        }
      }
      this._gamepadStates[gamepad.index] = newState;
    }
    /**
     * @static
     * @method _updateDirection
     * @private
     */
    static _updateDirection() {
      let x = this._signX();
      let y = this._signY();
      this._dir8 = this._makeNumpadDirection(x, y);
      if (x !== 0 && y !== 0) {
        if (this._preferredAxis === "x") {
          y = 0;
        } else {
          x = 0;
        }
      } else if (x !== 0) {
        this._preferredAxis = "y";
      } else if (y !== 0) {
        this._preferredAxis = "x";
      }
      this._dir4 = this._makeNumpadDirection(x, y);
    }
    /**
     * @static
     * @method _signX
     * @private
     */
    static _signX() {
      let x = 0;
      if (this.isPressed("left")) {
        x--;
      }
      if (this.isPressed("right")) {
        x++;
      }
      return x;
    }
    /**
     * @static
     * @method _signY
     * @private
     */
    static _signY() {
      let y = 0;
      if (this.isPressed("up")) {
        y--;
      }
      if (this.isPressed("down")) {
        y++;
      }
      return y;
    }
    /**
     * @static
     * @method _wrapNwjsAlert
     * @private
     */
    static _wrapNwjsAlert() {
      if (Utils_default.isNwjs()) {
        const _alert = window.alert;
        window.alert = function(...args) {
          const gui = __require("nw.gui");
          const win = gui.Window.get();
          _alert.apply(this, args);
          win.focus();
          Input.clear();
        };
      }
    }
    /**
     * @static
     * @method _shouldPreventDefault
     * @param {Number} keyCode
     * @private
     */
    static _shouldPreventDefault(keyCode) {
      switch (keyCode) {
        case 8:
        case 33:
        case 34:
        case 37:
        case 38:
        case 39:
        case 40:
          return true;
      }
      return false;
    }
    /**
     * @static
     * @method _makeNumpadDirection
     * @param {Number} x
     * @param {Number} y
     * @return {Number}
     * @private
     */
    static _makeNumpadDirection(x, y) {
      if (x !== 0 || y !== 0) {
        return 5 - y * 3 + x;
      }
      return 0;
    }
    /**
     * @static
     * @method _isEscapeCompatible
     * @param {String} keyName
     * @return {Boolean}
     * @private
     */
    static _isEscapeCompatible(keyName) {
      return keyName === "cancel" || keyName === "menu";
    }
  };
  Input.keyRepeatWait = 24;
  Input.keyRepeatInterval = 6;
  Input.keyMapper = {
    9: "tab",
    // tab
    13: "ok",
    // enter
    16: "shift",
    // shift
    17: "control",
    // control
    18: "control",
    // alt
    27: "escape",
    // escape
    32: "ok",
    // space
    33: "pageup",
    // pageup
    34: "pagedown",
    // pagedown
    37: "left",
    // left arrow
    38: "up",
    // up arrow
    39: "right",
    // right arrow
    40: "down",
    // down arrow
    45: "escape",
    // insert
    81: "pageup",
    // Q
    87: "pagedown",
    // W
    88: "escape",
    // X
    90: "ok",
    // Z
    96: "escape",
    // numpad 0
    98: "down",
    // numpad 2
    100: "left",
    // numpad 4
    102: "right",
    // numpad 6
    104: "up",
    // numpad 8
    120: "debug"
    // F9
  };
  Input.gamepadMapper = {
    0: "ok",
    // A
    1: "cancel",
    // B
    2: "shift",
    // X
    3: "menu",
    // Y
    4: "pageup",
    // LB
    5: "pagedown",
    // RB
    12: "up",
    // D-pad up
    13: "down",
    // D-pad down
    14: "left",
    // D-pad left
    15: "right"
    // D-pad right
  };
  Object.defineProperty(Input, "dir4", {
    get() {
      return this._dir4;
    },
    configurable: true
  });
  Object.defineProperty(Input, "dir8", {
    get() {
      return this._dir8;
    },
    configurable: true
  });
  Object.defineProperty(Input, "date", {
    get() {
      return this._date;
    },
    configurable: true
  });
  var Input_default = Input;

  // src-www/js/rpg_managers/PluginManager.js
  var PluginManager = class {
    constructor() {
      throw new Error("This is a static class");
    }
    static setup(plugins) {
      plugins.forEach(function({ status, name, parameters }) {
        if (status && !this._scripts.contains(name)) {
          this.setParameters(name, parameters);
          this.loadScript(`${name}.js`);
          this._scripts.push(name);
        }
      }, this);
    }
    static checkErrors() {
      const url = this._errorUrls.shift();
      if (url) {
        throw new Error(`Failed to load: ${url}`);
      }
    }
    static parameters(name) {
      return this._parameters[name.toLowerCase()] || {};
    }
    static setParameters(name, parameters) {
      this._parameters[name.toLowerCase()] = parameters;
    }
    static loadScript(name) {
      const url = this._path + name;
      const script2 = document.createElement("script");
      script2.type = "text/javascript";
      script2.src = url;
      script2.async = false;
      script2.onerror = this.onError.bind(this);
      script2._url = url;
      document.body.appendChild(script2);
    }
    static onError({ target: target2 }) {
      this._errorUrls.push(target2._url);
    }
  };
  PluginManager._path = "js/plugins/";
  PluginManager._scripts = [];
  PluginManager._errorUrls = [];
  PluginManager._parameters = {};
  var PluginManager_default = PluginManager;

  // src-www/js/rpg_core/TouchInput.js
  var TouchInput = class {
    constructor() {
      throw new Error("This is a static class");
    }
    /**
     * Initializes the touch system.
     *
     * @static
     * @method initialize
     */
    static initialize() {
      this.clear();
      this._setupEventHandlers();
    }
    /**
     * Clears all the touch data.
     *
     * @static
     * @method clear
     */
    static clear() {
      this._mousePressed = false;
      this._screenPressed = false;
      this._pressedTime = 0;
      this._events = {};
      this._events.triggered = false;
      this._events.cancelled = false;
      this._events.moved = false;
      this._events.released = false;
      this._events.wheelX = 0;
      this._events.wheelY = 0;
      this._triggered = false;
      this._cancelled = false;
      this._moved = false;
      this._released = false;
      this._wheelX = 0;
      this._wheelY = 0;
      this._x = 0;
      this._y = 0;
      this._date = 0;
    }
    /**
     * Updates the touch data.
     *
     * @static
     * @method update
     */
    static update() {
      this._triggered = this._events.triggered;
      this._cancelled = this._events.cancelled;
      this._moved = this._events.moved;
      this._released = this._events.released;
      this._wheelX = this._events.wheelX;
      this._wheelY = this._events.wheelY;
      this._events.triggered = false;
      this._events.cancelled = false;
      this._events.moved = false;
      this._events.released = false;
      this._events.wheelX = 0;
      this._events.wheelY = 0;
      if (this.isPressed()) {
        this._pressedTime++;
      }
    }
    /**
     * Checks whether the mouse button or touchscreen is currently pressed down.
     *
     * @static
     * @method isPressed
     * @return {Boolean} True if the mouse button or touchscreen is pressed
     */
    static isPressed() {
      return this._mousePressed || this._screenPressed;
    }
    /**
     * Checks whether the left mouse button or touchscreen is just pressed.
     *
     * @static
     * @method isTriggered
     * @return {Boolean} True if the mouse button or touchscreen is triggered
     */
    static isTriggered() {
      return this._triggered;
    }
    /**
     * Checks whether the left mouse button or touchscreen is just pressed
     * or a pseudo key repeat occurred.
     *
     * @static
     * @method isRepeated
     * @return {Boolean} True if the mouse button or touchscreen is repeated
     */
    static isRepeated() {
      return this.isPressed() && (this._triggered || this._pressedTime >= this.keyRepeatWait && this._pressedTime % this.keyRepeatInterval === 0);
    }
    /**
     * Checks whether the left mouse button or touchscreen is kept depressed.
     *
     * @static
     * @method isLongPressed
     * @return {Boolean} True if the left mouse button or touchscreen is long-pressed
     */
    static isLongPressed() {
      return this.isPressed() && this._pressedTime >= this.keyRepeatWait;
    }
    /**
     * Checks whether the right mouse button is just pressed.
     *
     * @static
     * @method isCancelled
     * @return {Boolean} True if the right mouse button is just pressed
     */
    static isCancelled() {
      return this._cancelled;
    }
    /**
     * Checks whether the mouse or a finger on the touchscreen is moved.
     *
     * @static
     * @method isMoved
     * @return {Boolean} True if the mouse or a finger on the touchscreen is moved
     */
    static isMoved() {
      return this._moved;
    }
    /**
     * Checks whether the left mouse button or touchscreen is released.
     *
     * @static
     * @method isReleased
     * @return {Boolean} True if the mouse button or touchscreen is released
     */
    static isReleased() {
      return this._released;
    }
    /**
     * @static
     * @method _setupEventHandlers
     * @private
     */
    static _setupEventHandlers() {
      const isSupportPassive = Utils_default.isSupportPassiveEvent();
      document.addEventListener("mousedown", this._onMouseDown.bind(this));
      document.addEventListener("mousemove", this._onMouseMove.bind(this));
      document.addEventListener("mouseup", this._onMouseUp.bind(this));
      document.addEventListener(
        "wheel",
        this._onWheel.bind(this),
        isSupportPassive ? {
          passive: false
        } : false
      );
      document.addEventListener(
        "touchstart",
        this._onTouchStart.bind(this),
        isSupportPassive ? {
          passive: false
        } : false
      );
      document.addEventListener(
        "touchmove",
        this._onTouchMove.bind(this),
        isSupportPassive ? {
          passive: false
        } : false
      );
      document.addEventListener("touchend", this._onTouchEnd.bind(this));
      document.addEventListener("touchcancel", this._onTouchCancel.bind(this));
      document.addEventListener("pointerdown", this._onPointerDown.bind(this));
      window.addEventListener("blur", this._onLostFocus.bind(this));
    }
    /**
     * @static
     * @method _onMouseDown
     * @param {MouseEvent} event
     * @private
     */
    static _onMouseDown(event) {
      if (event.button === 0) {
        this._onLeftButtonDown(event);
      } else if (event.button === 1) {
        this._onMiddleButtonDown(event);
      } else if (event.button === 2) {
        this._onRightButtonDown(event);
      }
    }
    /**
     * @static
     * @method _onLeftButtonDown
     * @param {MouseEvent} event
     * @private
     */
    static _onLeftButtonDown({ pageX, pageY }) {
      const x = Graphics_default.pageToCanvasX(pageX);
      const y = Graphics_default.pageToCanvasY(pageY);
      if (Graphics_default.isInsideCanvas(x, y)) {
        this._mousePressed = true;
        this._pressedTime = 0;
        this._onTrigger(x, y);
      }
    }
    /**
     * @static
     * @method _onRightButtonDown
     * @param {MouseEvent} event
     * @private
     */
    static _onRightButtonDown({ pageX, pageY }) {
      const x = Graphics_default.pageToCanvasX(pageX);
      const y = Graphics_default.pageToCanvasY(pageY);
      if (Graphics_default.isInsideCanvas(x, y)) {
        this._onCancel(x, y);
      }
    }
    /**
     * @static
     * @method _onMouseMove
     * @param {MouseEvent} event
     * @private
     */
    static _onMouseMove({ pageX, pageY }) {
      if (this._mousePressed) {
        const x = Graphics_default.pageToCanvasX(pageX);
        const y = Graphics_default.pageToCanvasY(pageY);
        this._onMove(x, y);
      }
    }
    /**
     * @static
     * @method _onMouseUp
     * @param {MouseEvent} event
     * @private
     */
    static _onMouseUp({ button, pageX, pageY }) {
      if (button === 0) {
        const x = Graphics_default.pageToCanvasX(pageX);
        const y = Graphics_default.pageToCanvasY(pageY);
        this._mousePressed = false;
        this._onRelease(x, y);
      }
    }
    /**
     * @static
     * @method _onWheel
     * @param {WheelEvent} event
     * @private
     */
    static _onWheel(event) {
      this._events.wheelX += event.deltaX;
      this._events.wheelY += event.deltaY;
      event.preventDefault();
    }
    /**
     * @static
     * @method _onTouchStart
     * @param {TouchEvent} event
     * @private
     */
    static _onTouchStart(event) {
      for (const touch of event.changedTouches) {
        const x = Graphics_default.pageToCanvasX(touch.pageX);
        const y = Graphics_default.pageToCanvasY(touch.pageY);
        if (Graphics_default.isInsideCanvas(x, y)) {
          this._screenPressed = true;
          this._pressedTime = 0;
          if (event.touches.length >= 2) {
            this._onCancel(x, y);
          } else {
            this._onTrigger(x, y);
          }
          event.preventDefault();
        }
      }
      if (window.cordova || window.navigator.standalone) {
        event.preventDefault();
      }
    }
    /**
     * @static
     * @method _onTouchMove
     * @param {TouchEvent} event
     * @private
     */
    static _onTouchMove({ changedTouches }) {
      for (const touch of changedTouches) {
        const x = Graphics_default.pageToCanvasX(touch.pageX);
        const y = Graphics_default.pageToCanvasY(touch.pageY);
        this._onMove(x, y);
      }
    }
    /**
     * @static
     * @method _onTouchEnd
     * @param {TouchEvent} event
     * @private
     */
    static _onTouchEnd({ changedTouches }) {
      for (const touch of changedTouches) {
        const x = Graphics_default.pageToCanvasX(touch.pageX);
        const y = Graphics_default.pageToCanvasY(touch.pageY);
        this._screenPressed = false;
        this._onRelease(x, y);
      }
    }
    /**
     * @static
     * @method _onTouchCancel
     * @param {TouchEvent} event
     * @private
     */
    static _onTouchCancel(event) {
      this._screenPressed = false;
    }
    /**
     * @static
     * @method _onPointerDown
     * @param {PointerEvent} event
     * @private
     */
    static _onPointerDown(event) {
      if (event.pointerType === "touch" && !event.isPrimary) {
        const x = Graphics_default.pageToCanvasX(event.pageX);
        const y = Graphics_default.pageToCanvasY(event.pageY);
        if (Graphics_default.isInsideCanvas(x, y)) {
          this._onCancel(x, y);
          event.preventDefault();
        }
      }
    }
    /**
     * @static
     * @method _onLostFocus
     * @private
     */
    static _onLostFocus() {
      this.clear();
    }
    /**
     * @static
     * @method _onTrigger
     * @param {Number} x
     * @param {Number} y
     * @private
     */
    static _onTrigger(x, y) {
      this._events.triggered = true;
      this._x = x;
      this._y = y;
      this._date = Date.now();
    }
    /**
     * @static
     * @method _onCancel
     * @param {Number} x
     * @param {Number} y
     * @private
     */
    static _onCancel(x, y) {
      this._events.cancelled = true;
      this._x = x;
      this._y = y;
    }
    /**
     * @static
     * @method _onMove
     * @param {Number} x
     * @param {Number} y
     * @private
     */
    static _onMove(x, y) {
      this._events.moved = true;
      this._x = x;
      this._y = y;
    }
    /**
     * @static
     * @method _onRelease
     * @param {Number} x
     * @param {Number} y
     * @private
     */
    static _onRelease(x, y) {
      this._events.released = true;
      this._x = x;
      this._y = y;
    }
  };
  TouchInput.keyRepeatWait = 24;
  TouchInput.keyRepeatInterval = 6;
  Object.defineProperty(TouchInput, "wheelX", {
    get() {
      return this._wheelX;
    },
    configurable: true
  });
  Object.defineProperty(TouchInput, "wheelY", {
    get() {
      return this._wheelY;
    },
    configurable: true
  });
  Object.defineProperty(TouchInput, "x", {
    get() {
      return this._x;
    },
    configurable: true
  });
  Object.defineProperty(TouchInput, "y", {
    get() {
      return this._y;
    },
    configurable: true
  });
  Object.defineProperty(TouchInput, "date", {
    get() {
      return this._date;
    },
    configurable: true
  });
  TouchInput._onMiddleButtonDown = (event) => {
  };
  var TouchInput_default = TouchInput;

  // src-www/js/rpg_managers/SceneManager.js
  var SceneManager = class {
    constructor() {
      throw new Error("This is a static class");
    }
    static run(sceneClass) {
      try {
        this.initialize();
        this.goto(sceneClass);
        this.requestUpdate();
      } catch (e) {
        this.catchException(e);
      }
    }
    static initialize() {
      this.initProgressWatcher();
      this.initGraphics();
      this.checkFileAccess();
      this.initAudio();
      this.initInput();
      this.initNwjs();
      this.checkPluginErrors();
      this.setupErrorHandlers();
    }
    static initGraphics() {
      const type = this.preferableRendererType();
      Graphics_default.initialize(this._screenWidth, this._screenHeight, type);
      Graphics_default.boxWidth = this._boxWidth;
      Graphics_default.boxHeight = this._boxHeight;
      Graphics_default.setLoadingImage("img/system/Loading.png");
      if (Utils_default.isOptionValid("showfps")) {
        Graphics_default.showFps();
      }
      if (type === "webgl") {
        this.checkWebGL();
      }
    }
    static setupErrorHandlers() {
      window.addEventListener("error", this.onError.bind(this));
      document.addEventListener("keydown", this.onKeyDown.bind(this));
    }
    static frameCount() {
      return this._frameCount;
    }
    static setFrameCount(frameCount) {
      this._frameCount = frameCount;
    }
    static resetFrameCount() {
      this._frameCount = 0;
    }
    static requestUpdate() {
      if (!this._stopped) {
        requestAnimationFrame(this.update.bind(this));
      }
    }
    static update() {
      try {
        this.tickStart();
        if (Utils_default.isMobileSafari()) {
          this.updateInputData();
        }
        this.updateManagers();
        this.updateMain();
        this.tickEnd();
      } catch (e) {
        this.catchException(e);
      }
    }
    static onError({ message, filename, lineno }) {
      console.error(message);
      if (filename || lineno) {
        console.error(filename, lineno);
        try {
          this.stop();
          Graphics_default.printError("Error", message);
          AudioManager_default.stopAll();
        } catch (e2) {
        }
      }
    }
    static catchException(e) {
      if (e instanceof Error) {
        Graphics_default.printError(e.name, e.message);
        Graphics_default.printErrorDetail(e);
        console.error(e.stack);
      } else {
        Graphics_default.printError("UnknownError", e);
      }
      AudioManager_default.stopAll();
      this.stop();
    }
    static updateMain() {
      if (Utils_default.isHighFps()) {
        if (Utils_default.isMobileSafari()) {
          this.changeScene();
          this.updateScene();
        } else {
          const newTime = this._getTimeInMsWithoutMobileSafari();
          if (this._currentTime === void 0) {
            this._currentTime = newTime;
          }
          let fTime = (newTime - this._currentTime) / 1e3;
          if (fTime > 0.25) {
            fTime = 0.25;
          }
          this._currentTime = newTime;
          this._accumulator += fTime;
          while (this._accumulator >= this._deltaTime) {
            this.updateInputData();
            this.changeScene();
            this.updateScene();
            this._accumulator -= this._deltaTime;
          }
        }
        this.renderScene();
        this.requestUpdate();
      } else {
        this.updateInputData();
        this.changeScene();
        this.updateScene();
        this.renderScene();
        this.requestUpdate();
      }
    }
    static changeScene() {
      if (this.isSceneChanging() && !this.isCurrentSceneBusy()) {
        if (this._scene) {
          this._scene.terminate();
          this._scene.detachReservation();
          this._previousClass = this._scene.constructor;
        }
        this._scene = this._nextScene;
        if (this._scene) {
          this._scene.attachReservation();
          this._scene.create();
          this._nextScene = null;
          this._sceneStarted = false;
          this.onSceneCreate();
        }
        if (this._exiting) {
          this.terminate();
        }
      }
    }
    static updateScene() {
      if (this._scene) {
        if (!this._sceneStarted && this._scene.isReady()) {
          this._scene.start();
          this._sceneStarted = true;
          this.onSceneStart();
        }
        if (this.isCurrentSceneStarted()) {
          this.updateFrameCount();
          this._scene.update();
        }
      }
    }
    static renderScene() {
      if (this.isCurrentSceneStarted()) {
        Graphics_default.render(this._scene);
      } else if (this._scene) {
        this.onSceneLoading();
      }
    }
    static updateFrameCount() {
      this._frameCount++;
    }
    static isSceneChanging() {
      return this._exiting || !!this._nextScene;
    }
    static isCurrentSceneBusy() {
      return this._scene && this._scene.isBusy();
    }
    static isCurrentSceneStarted() {
      return this._scene && this._sceneStarted;
    }
    static isNextScene(sceneClass) {
      return this._nextScene && this._nextScene.constructor === sceneClass;
    }
    static isPreviousScene(sceneClass) {
      return this._previousClass === sceneClass;
    }
    static goto(sceneClass) {
      if (sceneClass) {
        this._nextScene = new sceneClass();
      }
      if (this._scene) {
        this._scene.stop();
      }
    }
    static push(sceneClass) {
      this._stack.push(this._scene.constructor);
      this.goto(sceneClass);
    }
    static pop() {
      if (this._stack.length > 0) {
        this.goto(this._stack.pop());
      } else {
        this.exit();
      }
    }
    static exit() {
      this.goto(null);
      this._exiting = true;
    }
    static clearStack() {
      this._stack = [];
    }
    static stop() {
      this._stopped = true;
    }
    static prepareNextScene(...args) {
      this._nextScene.prepare(...args);
    }
    static snap() {
      return Bitmap_default.snap(this._scene);
    }
    static snapForBackground() {
      this._backgroundBitmap = this.snap();
      this._backgroundBitmap.blur();
    }
    static backgroundBitmap() {
      return this._backgroundBitmap;
    }
    static resume() {
      this._stopped = false;
      this.requestUpdate();
      if (!Utils_default.isMobileSafari()) {
        this._currentTime = this._getTimeInMsWithoutMobileSafari();
        this._accumulator = 0;
      }
    }
    /*
     * Gets the current time in ms without on iOS Safari.
     * @private
     */
    static _getTimeInMsWithoutMobileSafari() {
      return performance.now();
    }
    static initProgressWatcher() {
      ProgressWatcher_default.initialize();
    }
    static preferableRendererType() {
      if (Utils_default.isOptionValid("canvas")) {
        return "canvas";
      } else if (Utils_default.isOptionValid("webgl")) {
        return "webgl";
      } else {
        return "auto";
      }
    }
    static shouldUseCanvasRenderer() {
      return Utils_default.isMobileDevice();
    }
    static checkWebGL() {
      if (!Graphics_default.hasWebGL()) {
        throw new Error("Your browser does not support WebGL.");
      }
    }
    static checkFileAccess() {
      if (!Utils_default.canReadGameFiles()) {
        throw new Error("Your browser does not allow to read local files.");
      }
    }
    static initAudio() {
      const noAudio = Utils_default.isOptionValid("noaudio");
      if (!WebAudio_default.initialize(noAudio) && !noAudio) {
        throw new Error("Your browser does not support Web Audio API.");
      }
    }
    static initInput() {
      Input_default.initialize();
      TouchInput_default.initialize();
    }
    static initNwjs() {
      if (Utils_default.isNwjs()) {
        const gui = __require("nw.gui");
        const win = gui.Window.get();
        if (process.platform === "darwin" && !win.menu) {
          const menubar = new gui.Menu({
            type: "menubar"
          });
          const option = {
            hideEdit: true,
            hideWindow: true
          };
          menubar.createMacBuiltin("Game", option);
          win.menu = menubar;
        }
      }
    }
    static checkPluginErrors() {
      PluginManager_default.checkErrors();
    }
    static terminate() {
      window.close();
    }
    static onKeyDown({ ctrlKey, altKey, keyCode }) {
      if (!ctrlKey && !altKey) {
        switch (keyCode) {
          case 116:
            if (Utils_default.isNwjs()) {
              location.reload();
            }
            break;
          case 119:
            if (Utils_default.isNwjs() && Utils_default.isOptionValid("test")) {
              __require("nw.gui").Window.get().showDevTools();
            }
            break;
        }
      }
    }
    static tickStart() {
      Graphics_default.tickStart();
    }
    static tickEnd() {
      Graphics_default.tickEnd();
    }
    static updateInputData() {
      Input_default.update();
      TouchInput_default.update();
    }
    static updateManagers() {
      ImageManager_default.update();
    }
    static onSceneCreate() {
      Graphics_default.startLoading();
    }
    static onSceneStart() {
      Graphics_default.callGC();
      Graphics_default.endLoading();
    }
    static onSceneLoading() {
      Graphics_default.updateLoading();
    }
  };
  SceneManager._scene = null;
  SceneManager._nextScene = null;
  SceneManager._stack = [];
  SceneManager._stopped = false;
  SceneManager._sceneStarted = false;
  SceneManager._exiting = false;
  SceneManager._previousClass = null;
  SceneManager._backgroundBitmap = null;
  SceneManager._screenWidth = 816;
  SceneManager._screenHeight = 624;
  SceneManager._boxWidth = 816;
  SceneManager._boxHeight = 624;
  SceneManager._deltaTime = 1 / 60;
  if (!Utils_default.isMobileSafari())
    SceneManager._currentTime = SceneManager._getTimeInMsWithoutMobileSafari();
  SceneManager._accumulator = 0;
  SceneManager._frameCount = 0;
  var SceneManager_default = SceneManager;

  // src-www/js/rpg_core/ResourceHandler.js
  var ResourceHandler = class {
    constructor() {
      throw new Error("This is a static class");
    }
    static createLoader(url, retryMethod, resignMethod, retryInterval = this._defaultRetryInterval) {
      const reloaders = this._reloaders;
      let retryCount = 0;
      return () => {
        if (retryCount < retryInterval.length) {
          setTimeout(retryMethod, retryInterval[retryCount]);
          retryCount++;
        } else {
          if (resignMethod) {
            resignMethod();
          }
          if (url) {
            if (reloaders.length === 0) {
              Graphics_default.printLoadingError(url);
              SceneManager_default.stop();
            }
            reloaders.push(() => {
              retryCount = 0;
              retryMethod();
            });
          }
        }
      };
    }
    static exists() {
      return this._reloaders.length > 0;
    }
    static retry() {
      if (this._reloaders.length > 0) {
        Graphics_default.eraseLoadingError();
        SceneManager_default.resume();
        this._reloaders.forEach((reloader) => {
          reloader();
        });
        this._reloaders.length = 0;
      }
    }
  };
  ResourceHandler._reloaders = [];
  ResourceHandler._defaultRetryInterval = [500, 1e3, 3e3];
  var ResourceHandler_default = ResourceHandler;

  // src-www/js/rpg_core/Graphics.js
  var Graphics = class {
    constructor() {
      throw new Error("This is a static class");
    }
    /**
     * Initializes the graphics system.
     *
     * @static
     * @method initialize
     * @param {Number} width The width of the game screen
     * @param {Number} height The height of the game screen
     * @param {String} type The type of the renderer.
     *                 'canvas', 'webgl', or 'auto'.
     */
    static initialize(width, height, type) {
      this._width = width || 800;
      this._height = height || 600;
      this._rendererType = type || "auto";
      this._boxWidth = this._width;
      this._boxHeight = this._height;
      this._scale = 1;
      this._realScale = 1;
      this._errorShowed = false;
      this._errorPrinter = null;
      this._canvas = null;
      this._video = null;
      this._videoUnlocked = false;
      this._videoLoading = false;
      this._upperCanvas = null;
      this._fpsMeter = null;
      this._modeBox = null;
      this._skipCount = 0;
      this._maxSkip = 3;
      this._rendered = false;
      this._loadingImage = null;
      this._loadingCount = 0;
      this._fpsMeterToggled = false;
      this._stretchEnabled = this._defaultStretchMode();
      this._canUseDifferenceBlend = false;
      this._canUseSaturationBlend = false;
      this._hiddenCanvas = null;
      this._app = null;
      this._testCanvasBlendModes();
      this._modifyExistingElements();
      this._updateRealScale();
      this._createAllElements();
      this._disableTextSelection();
      this._disableContextMenu();
      this._setupEventHandlers();
      this._setupCssFontLoading();
      this._setupProgress();
    }
    static canUseCssFontLoading() {
      return !!this._cssFontLoading;
    }
    /**
     * Renders the stage to the game screen.
     *
     * @static
     * @method render
     * @param {Stage} stage The stage object to be rendered
     */
    static render(stage) {
      if (stage)
        this._app.stage = stage;
    }
    /**
     * Checks whether the renderer type is WebGL.
     *
     * @static
     * @method isWebGL
     * @return {Boolean} True if the renderer type is WebGL
     */
    static isWebGL() {
      return this._renderer && this._renderer.type === PIXI.RENDERER_TYPE.WEBGL;
    }
    /**
     * Checks whether the canvas blend mode 'difference' is supported.
     *
     * @static
     * @method canUseDifferenceBlend
     * @return {Boolean} True if the canvas blend mode 'difference' is supported
     */
    static canUseDifferenceBlend() {
      return this._canUseDifferenceBlend;
    }
    /**
     * Checks whether the canvas blend mode 'saturation' is supported.
     *
     * @static
     * @method canUseSaturationBlend
     * @return {Boolean} True if the canvas blend mode 'saturation' is supported
     */
    static canUseSaturationBlend() {
      return this._canUseSaturationBlend;
    }
    /**
     * Sets the source of the "Now Loading" image.
     *
     * @static
     * @method setLoadingImage
     */
    static setLoadingImage(src) {
      this._loadingImage = new Image();
      this._loadingImage.src = src;
    }
    /**
     * Sets whether the progress bar is enabled.
     *
     * @static
     * @method setEnableProgress
     */
    static setProgressEnabled(enable) {
      this._progressEnabled = enable;
    }
    /**
     * Initializes the counter for displaying the "Now Loading" image.
     *
     * @static
     * @method startLoading
     */
    static startLoading() {
      this._loadingCount = 0;
      ProgressWatcher_default.truncateProgress();
      ProgressWatcher_default.setProgressListener(this._updateProgressCount.bind(this));
      this._progressTimeout = setTimeout(() => {
        Graphics._showProgress();
      }, 1500);
    }
    static _setupProgress() {
      this._progressElement = document.createElement("div");
      this._progressElement.id = "loading-progress";
      this._progressElement.width = 600;
      this._progressElement.height = 300;
      this._progressElement.style.visibility = "hidden";
      this._barElement = document.createElement("div");
      this._barElement.id = "loading-bar";
      this._barElement.style.width = "100%";
      this._barElement.style.height = "10%";
      this._barElement.style.background = "linear-gradient(to top, gray, lightgray)";
      this._barElement.style.border = "5px solid white";
      this._barElement.style.borderRadius = "15px";
      this._barElement.style.marginTop = "40%";
      this._filledBarElement = document.createElement("div");
      this._filledBarElement.id = "loading-filled-bar";
      this._filledBarElement.style.width = "0%";
      this._filledBarElement.style.height = "100%";
      this._filledBarElement.style.background = "linear-gradient(to top, lime, honeydew)";
      this._filledBarElement.style.borderRadius = "10px";
      this._progressElement.appendChild(this._barElement);
      this._barElement.appendChild(this._filledBarElement);
      this._updateProgress();
      document.body.appendChild(this._progressElement);
    }
    static _showProgress() {
      if (this._progressEnabled) {
        this._progressElement.value = 0;
        this._progressElement.style.visibility = "visible";
        this._progressElement.style.zIndex = 98;
      }
    }
    static _hideProgress() {
      if (this._progressElement) {
        this._progressElement.style.visibility = "hidden";
      }
      clearTimeout(this._progressTimeout);
    }
    static _updateProgressCount(countLoaded, countLoading) {
      let progressValue;
      if (countLoading !== 0) {
        progressValue = countLoaded / countLoading * 100;
      } else {
        progressValue = 100;
      }
      this._filledBarElement.style.width = `${progressValue}%`;
    }
    static _updateProgress() {
      this._centerElement(this._progressElement);
    }
    /**
     * Increments the loading counter and displays the "Now Loading" image if necessary.
     *
     * @static
     * @method updateLoading
     */
    static updateLoading() {
      this._loadingCount++;
      this._paintUpperCanvas();
      this._upperCanvas.style.opacity = 1;
      this._updateProgress();
    }
    /**
     * Erases the "Now Loading" image.
     *
     * @static
     * @method endLoading
     */
    static endLoading() {
      this._clearUpperCanvas();
      this._upperCanvas.style.opacity = 0;
      this._hideProgress();
    }
    /**
     * Displays the loading error text to the screen.
     *
     * @static
     * @method printLoadingError
     * @param {String} url The url of the resource failed to load
     */
    static printLoadingError(url) {
      if (this._errorPrinter && !this._errorShowed) {
        this._updateErrorPrinter();
        this._errorPrinter.innerHTML = this._makeErrorHtml(
          "Loading Error",
          `Failed to load: ${url}`
        );
        this._errorPrinter.style.userSelect = "text";
        this._errorPrinter.style.webkitUserSelect = "text";
        this._errorPrinter.style.msUserSelect = "text";
        this._errorPrinter.style.mozUserSelect = "text";
        this._errorPrinter.oncontextmenu = null;
        const button = document.createElement("button");
        button.innerHTML = "Retry";
        button.style.fontSize = "24px";
        button.style.color = "#ffffff";
        button.style.backgroundColor = "#000000";
        button.addEventListener("touchstart", (event) => {
          event.stopPropagation();
        });
        button.addEventListener("click", (event) => {
          ResourceHandler_default.retry();
        });
        this._errorPrinter.appendChild(button);
        this._loadingCount = -Infinity;
      }
    }
    /**
     * Erases the loading error text.
     *
     * @static
     * @method eraseLoadingError
     */
    static eraseLoadingError() {
      if (this._errorPrinter && !this._errorShowed) {
        this._errorPrinter.innerHTML = "";
        this._errorPrinter.style.userSelect = "none";
        this._errorPrinter.style.webkitUserSelect = "none";
        this._errorPrinter.style.msUserSelect = "none";
        this._errorPrinter.style.mozUserSelect = "none";
        this._errorPrinter.oncontextmenu = () => false;
        this._loadingCount = 0;
      }
    }
    // The following code is partly borrowed from triacontane.
    /**
     * Displays the error text to the screen.
     *
     * @static
     * @method printError
     * @param {String} name The name of the error
     * @param {String} message The message of the error
     */
    static printError(name, message) {
      this._errorShowed = true;
      this._hideProgress();
      this.hideFps();
      if (this._errorPrinter) {
        this._updateErrorPrinter();
        this._errorPrinter.innerHTML = this._makeErrorHtml(name, message);
        this._errorPrinter.style.userSelect = "text";
        this._errorPrinter.style.webkitUserSelect = "text";
        this._errorPrinter.style.msUserSelect = "text";
        this._errorPrinter.style.mozUserSelect = "text";
        this._errorPrinter.oncontextmenu = null;
        if (this._errorMessage) {
          this._makeErrorMessage();
        }
      }
      this._applyCanvasFilter();
      this._clearUpperCanvas();
    }
    /**
     * Shows the detail of error.
     *
     * @static
     * @method printErrorDetail
     */
    static printErrorDetail(error) {
      if (this._errorPrinter && this._showErrorDetail) {
        const eventInfo = this._formatEventInfo(error);
        const eventCommandInfo = this._formatEventCommandInfo(error);
        const info = eventCommandInfo ? `${eventInfo}, ${eventCommandInfo}` : eventInfo;
        const stack = this._formatStackTrace(error);
        this._makeErrorDetail(info, stack);
      }
    }
    /**
     * Sets the error message.
     *
     * @static
     * @method setErrorMessage
     */
    static setErrorMessage(message) {
      this._errorMessage = message;
    }
    /**
     * Sets whether shows the detail of error.
     *
     * @static
     * @method setShowErrorDetail
     */
    static setShowErrorDetail(showErrorDetail) {
      this._showErrorDetail = showErrorDetail;
    }
    /**
     * Shows the FPSMeter element.
     *
     * @static
     * @method showFps
     */
    static showFps() {
      if (this._fpsMeter) {
        if (!this._fpsMeter.extensions.pixi) {
          this._fpsMeter.enableExtension("pixi", [PIXI, this._app]);
        }
        document.body.appendChild(this._fpsMeter.dom);
        this._fpsMeter.show(true);
      }
    }
    /**
     * Hides the FPSMeter element.
     *
     * @static
     * @method hideFps
     */
    static hideFps() {
      if (this._fpsMeter) {
        if (document.body.contains(this._fpsMeter.dom)) {
          document.body.removeChild(this._fpsMeter.dom);
        }
        this._fpsMeter.show(false);
      }
    }
    /**
     * Loads a font file.
     *
     * @static
     * @method loadFont
     * @param {String} name The face name of the font
     * @param {String} url The url of the font file
     */
    static loadFont(name, url) {
      const style = document.createElement("style");
      const head = document.getElementsByTagName("head");
      const rule = `@font-face { font-family: "${name}"; src: url("${url}"); }`;
      style.type = "text/css";
      head.item(0).appendChild(style);
      style.sheet.insertRule(rule, 0);
      this._createFontLoader(name);
    }
    /**
     * Checks whether the font file is loaded.
     *
     * @static
     * @method isFontLoaded
     * @param {String} name The face name of the font
     * @return {Boolean} True if the font file is loaded
     */
    static isFontLoaded(name) {
      if (Graphics._cssFontLoading) {
        if (Graphics._fontLoaded) {
          return Graphics._fontLoaded.check(`10px "${name}"`);
        }
        return false;
      } else {
        if (!this._hiddenCanvas) {
          this._hiddenCanvas = document.createElement("canvas");
        }
        const context = this._hiddenCanvas.getContext("2d");
        const text = "abcdefghijklmnopqrstuvwxyz";
        let width1;
        let width2;
        context.font = `40px ${name}, sans-serif`;
        width1 = context.measureText(text).width;
        context.font = "40px sans-serif";
        width2 = context.measureText(text).width;
        return width1 !== width2;
      }
    }
    /**
     * Starts playback of a video.
     *
     * @static
     * @method playVideo
     * @param {String} src
     */
    static playVideo(src) {
      this._videoLoader = ResourceHandler_default.createLoader(
        null,
        this._playVideo.bind(this, src),
        this._onVideoError.bind(this)
      );
      this._playVideo(src);
    }
    /**
     * @static
     * @method _playVideo
     * @param {String} src
     * @private
     */
    static _playVideo(src) {
      this._video.src = src;
      this._video.onloadeddata = this._onVideoLoad.bind(this);
      this._video.onerror = this._videoLoader;
      this._video.onended = this._onVideoEnd.bind(this);
      this._video.load();
      this._videoLoading = true;
    }
    /**
     * Checks whether the video is playing.
     *
     * @static
     * @method isVideoPlaying
     * @return {Boolean} True if the video is playing
     */
    static isVideoPlaying() {
      return this._videoLoading || this._isVideoVisible();
    }
    /**
     * Checks whether the browser can play the specified video type.
     *
     * @static
     * @method canPlayVideoType
     * @param {String} type The video type to test support for
     * @return {Boolean} True if the browser can play the specified video type
     */
    static canPlayVideoType(type) {
      return this._video && this._video.canPlayType(type);
    }
    /**
     * Sets volume of a video.
     *
     * @static
     * @method setVideoVolume
     * @param {Number} value
     */
    static setVideoVolume(value3) {
      this._videoVolume = value3;
      if (this._video) {
        this._video.volume = this._videoVolume;
      }
    }
    /**
     * Converts an x coordinate on the page to the corresponding
     * x coordinate on the canvas area.
     *
     * @static
     * @method pageToCanvasX
     * @param {Number} x The x coordinate on the page to be converted
     * @return {Number} The x coordinate on the canvas area
     */
    static pageToCanvasX(x) {
      if (this._canvas) {
        const left = this._canvas.offsetLeft;
        return Math.round((x - left) / this._realScale);
      } else {
        return 0;
      }
    }
    /**
     * Converts a y coordinate on the page to the corresponding
     * y coordinate on the canvas area.
     *
     * @static
     * @method pageToCanvasY
     * @param {Number} y The y coordinate on the page to be converted
     * @return {Number} The y coordinate on the canvas area
     */
    static pageToCanvasY(y) {
      if (this._canvas) {
        const top = this._canvas.offsetTop;
        return Math.round((y - top) / this._realScale);
      } else {
        return 0;
      }
    }
    /**
     * Checks whether the specified point is inside the game canvas area.
     *
     * @static
     * @method isInsideCanvas
     * @param {Number} x The x coordinate on the canvas area
     * @param {Number} y The y coordinate on the canvas area
     * @return {Boolean} True if the specified point is inside the game canvas area
     */
    static isInsideCanvas(x, y) {
      return x >= 0 && x < this._width && y >= 0 && y < this._height;
    }
    /**
     * @static
     * @method _createAllElements
     * @private
     */
    static _createAllElements() {
      this._createErrorPrinter();
      this._createCanvas();
      this._createVideo();
      this._createUpperCanvas();
      this._createRenderer();
      this._createPixiApp();
      this._createFPSMeter();
      this._createModeBox();
      this._createGameFontLoader();
    }
    /**
     * @static
     * @method _updateAllElements
     * @private
     */
    static _updateAllElements() {
      this._updateRealScale();
      this._updateErrorPrinter();
      this._updateCanvas();
      this._updateVideo();
      this._updateUpperCanvas();
      this._updateRenderer();
      this._paintUpperCanvas();
      this._updateProgress();
    }
    /**
     * @static
     * @method _updateRealScale
     * @private
     */
    static _updateRealScale() {
      if (this._stretchEnabled) {
        let h = window.innerWidth / this._width;
        let v2 = window.innerHeight / this._height;
        if (h >= 1 && h - 0.01 <= 1)
          h = 1;
        if (v2 >= 1 && v2 - 0.01 <= 1)
          v2 = 1;
        this._realScale = Math.min(h, v2);
      } else {
        this._realScale = this._scale;
      }
    }
    /**
     * @static
     * @method _testCanvasBlendModes
     * @private
     */
    static _testCanvasBlendModes() {
      let canvas;
      let context;
      let imageData1;
      let imageData2;
      canvas = document.createElement("canvas");
      canvas.width = 1;
      canvas.height = 1;
      context = canvas.getContext("2d");
      context.globalCompositeOperation = "source-over";
      context.fillStyle = "white";
      context.fillRect(0, 0, 1, 1);
      context.globalCompositeOperation = "difference";
      context.fillStyle = "white";
      context.fillRect(0, 0, 1, 1);
      imageData1 = context.getImageData(0, 0, 1, 1);
      context.globalCompositeOperation = "source-over";
      context.fillStyle = "black";
      context.fillRect(0, 0, 1, 1);
      context.globalCompositeOperation = "saturation";
      context.fillStyle = "white";
      context.fillRect(0, 0, 1, 1);
      imageData2 = context.getImageData(0, 0, 1, 1);
      this._canUseDifferenceBlend = imageData1.data[0] === 0;
      this._canUseSaturationBlend = imageData2.data[0] === 0;
    }
    /**
     * @static
     * @method _createErrorPrinter
     * @private
     */
    static _createErrorPrinter() {
      this._errorPrinter = document.createElement("p");
      this._errorPrinter.id = "ErrorPrinter";
      this._updateErrorPrinter();
      document.body.appendChild(this._errorPrinter);
    }
    /**
     * @static
     * @method _updateErrorPrinter
     * @private
     */
    static _updateErrorPrinter() {
      this._errorPrinter.width = this._width * 0.9;
      if (this._errorShowed && this._showErrorDetail) {
        this._errorPrinter.height = this._height * 0.9;
      } else if (this._errorShowed && this._errorMessage) {
        this._errorPrinter.height = 100;
      } else {
        this._errorPrinter.height = 40;
      }
      this._errorPrinter.style.textAlign = "center";
      this._errorPrinter.style.textShadow = "1px 1px 3px #000";
      this._errorPrinter.style.fontSize = "20px";
      this._errorPrinter.style.zIndex = 99;
      this._centerElement(this._errorPrinter);
    }
    /**
     * @static
     * @method _makeErrorMessage
     * @private
     */
    static _makeErrorMessage() {
      const mainMessage = document.createElement("div");
      const style = mainMessage.style;
      style.color = "white";
      style.textAlign = "left";
      style.fontSize = "18px";
      mainMessage.innerHTML = `<hr>${this._errorMessage}`;
      this._errorPrinter.appendChild(mainMessage);
    }
    /**
     * @static
     * @method _makeErrorDetail
     * @private
     */
    static _makeErrorDetail(info, stack) {
      const detail = document.createElement("div");
      const style = detail.style;
      style.color = "white";
      style.textAlign = "left";
      style.fontSize = "18px";
      detail.innerHTML = `<br><hr>${info}<br><br>${stack}`;
      this._errorPrinter.appendChild(detail);
    }
    /**
     * @static
     * @method _createCanvas
     * @private
     */
    static _createCanvas() {
      this._canvas = document.createElement("canvas");
      this._canvas.id = "GameCanvas";
      this._updateCanvas();
      document.body.appendChild(this._canvas);
    }
    /**
     * @static
     * @method _updateCanvas
     * @private
     */
    static _updateCanvas() {
      this._canvas.width = this._width;
      this._canvas.height = this._height;
      this._canvas.style.zIndex = 1;
      this._centerElement(this._canvas);
    }
    /**
     * @static
     * @method _createVideo
     * @private
     */
    static _createVideo() {
      this._video = document.createElement("video");
      this._video.id = "GameVideo";
      this._video.style.opacity = 0;
      this._video.setAttribute("playsinline", "");
      this._video.volume = this._videoVolume;
      this._updateVideo();
      document.body.appendChild(this._video);
    }
    /**
     * @static
     * @method _updateVideo
     * @private
     */
    static _updateVideo() {
      this._video.width = this._width;
      this._video.height = this._height;
      this._video.style.zIndex = 2;
      this._centerElement(this._video);
    }
    /**
     * @static
     * @method _createUpperCanvas
     * @private
     */
    static _createUpperCanvas() {
      this._upperCanvas = document.createElement("canvas");
      this._upperCanvas.id = "UpperCanvas";
      this._updateUpperCanvas();
      document.body.appendChild(this._upperCanvas);
    }
    /**
     * @static
     * @method _updateUpperCanvas
     * @private
     */
    static _updateUpperCanvas() {
      this._upperCanvas.width = this._width;
      this._upperCanvas.height = this._height;
      this._upperCanvas.style.zIndex = 3;
      this._centerElement(this._upperCanvas);
    }
    /**
     * @static
     * @method _clearUpperCanvas
     * @private
     */
    static _clearUpperCanvas() {
      const context = this._upperCanvas.getContext("2d");
      context.clearRect(0, 0, this._width, this._height);
    }
    /**
     * @static
     * @method _paintUpperCanvas
     * @private
     */
    static _paintUpperCanvas() {
      this._clearUpperCanvas();
      if (this._loadingImage && this._loadingCount >= 20) {
        const context = this._upperCanvas.getContext("2d");
        const dx = (this._width - this._loadingImage.width) / 2;
        const dy = (this._height - this._loadingImage.height) / 2;
        const alpha = ((this._loadingCount - 20) / 30).clamp(0, 1);
        context.save();
        context.globalAlpha = alpha;
        context.drawImage(this._loadingImage, dx, dy);
        context.restore();
      }
    }
    /**
     * @static
     * @method _updateRenderer
     * @private
     */
    static _updateRenderer() {
      if (this._app) {
        this._app.renderer.resize(this._width, this._height);
      }
    }
    /**
     * @static
     * @method _createFPSMeter
     * @private
     */
    static _createFPSMeter() {
      if (typeof GameStats == "function") {
        this._fpsMeter = new GameStats({
          autoPlace: false
        });
        this._fpsMeter.show(false);
        this._fpsMeter.dom.style.zIndex = 1;
      } else {
        console.warn("GameStats is not a function. Is gamestats.js installed?");
      }
    }
    /**
     * @static
     * @method _createModeBox
     * @private
     */
    static _createModeBox() {
      const box = document.createElement("div");
      box.id = "modeTextBack";
      box.style.position = "absolute";
      box.style.left = "5px";
      box.style.top = "5px";
      box.style.width = "119px";
      box.style.height = "58px";
      box.style.background = "rgba(0,0,0,0.2)";
      box.style.zIndex = 9;
      box.style.opacity = 0;
      const text = document.createElement("div");
      text.id = "modeText";
      text.style.position = "absolute";
      text.style.left = "0px";
      text.style.top = "41px";
      text.style.width = "119px";
      text.style.fontSize = "12px";
      text.style.fontFamily = "monospace";
      text.style.color = "white";
      text.style.textAlign = "center";
      text.style.textShadow = "1px 1px 0 rgba(0,0,0,0.5)";
      text.innerHTML = this.isWebGL() ? "WebGL mode" : "Canvas mode";
      document.body.appendChild(box);
      box.appendChild(text);
      this._modeBox = box;
    }
    /**
     * @static
     * @method _createGameFontLoader
     * @private
     */
    static _createGameFontLoader() {
      this._createFontLoader("GameFont");
    }
    /**
     * @static
     * @method _centerElement
     * @param {HTMLElement} element
     * @private
     */
    static _centerElement(element) {
      const width = element.width * this._realScale;
      const height = element.height * this._realScale;
      element.style.position = "absolute";
      element.style.margin = "auto";
      element.style.top = 0;
      element.style.left = 0;
      element.style.right = 0;
      element.style.bottom = 0;
      element.style.width = `${width}px`;
      element.style.height = `${height}px`;
    }
    /**
     * @static
     * @method _applyCanvasFilter
     * @private
     */
    static _applyCanvasFilter() {
      if (this._canvas) {
        this._canvas.style.opacity = 0.5;
        this._canvas.style.filter = "blur(8px)";
        this._canvas.style.webkitFilter = "blur(8px)";
      }
    }
    /**
     * @static
     * @method _onVideoLoad
     * @private
     */
    static _onVideoLoad() {
      this._video.play();
      this._updateVisibility(true);
      this._videoLoading = false;
    }
    /**
     * @static
     * @method _onVideoError
     * @private
     */
    static _onVideoError() {
      this._updateVisibility(false);
      this._videoLoading = false;
    }
    /**
     * @static
     * @method _onVideoEnd
     * @private
     */
    static _onVideoEnd() {
      this._updateVisibility(false);
    }
    /**
     * @static
     * @method _updateVisibility
     * @param {Boolean} videoVisible
     * @private
     */
    static _updateVisibility(videoVisible) {
      this._video.style.opacity = videoVisible ? 1 : 0;
      this._canvas.style.opacity = videoVisible ? 0 : 1;
    }
    /**
     * @static
     * @method _isVideoVisible
     * @return {Boolean}
     * @private
     */
    static _isVideoVisible() {
      return this._video.style.opacity > 0;
    }
    /**
     * @static
     * @method _setupEventHandlers
     * @private
     */
    static _setupEventHandlers() {
      window.addEventListener("resize", this._onWindowResize.bind(this));
      document.addEventListener("keydown", this._onKeyDown.bind(this));
      document.addEventListener("keydown", this._onTouchEnd.bind(this));
      document.addEventListener("mousedown", this._onTouchEnd.bind(this));
      document.addEventListener("touchend", this._onTouchEnd.bind(this));
    }
    /**
     * @static
     * @method _onWindowResize
     * @private
     */
    static _onWindowResize() {
      this._updateAllElements();
    }
    /**
     * @static
     * @method _onKeyDown
     * @param {KeyboardEvent} event
     * @private
     */
    static _onKeyDown(event) {
      if (!event.ctrlKey && !event.altKey) {
        switch (event.keyCode) {
          case 113:
            event.preventDefault();
            this._switchFPSMeter();
            break;
          case 114:
            event.preventDefault();
            this._switchStretchMode();
            break;
          case 115:
            event.preventDefault();
            this._switchFullScreen();
            break;
        }
      }
    }
    /**
     * @static
     * @method _onTouchEnd
     * @param {TouchEvent} event
     * @private
     */
    static _onTouchEnd(event) {
      if (!this._videoUnlocked) {
        this._video.play();
        this._videoUnlocked = true;
      }
      if (this._isVideoVisible() && this._video.paused) {
        this._video.play();
      }
    }
    /**
     * @static
     * @method _switchFPSMeter
     * @private
     */
    static _switchFPSMeter() {
      if (this._fpsMeter && this._fpsMeterToggled) {
        this.hideFps();
        this._fpsMeterToggled = false;
      } else if (this._fpsMeter && !this._fpsMeterToggled) {
        this.showFps();
        this._fpsMeterToggled = true;
      }
    }
    /**
     * @static
     * @method _switchStretchMode
     * @return {Boolean}
     * @private
     */
    static _switchStretchMode() {
      this._stretchEnabled = !this._stretchEnabled;
      this._updateAllElements();
    }
    /**
     * @static
     * @method _switchFullScreen
     * @private
     */
    static _switchFullScreen() {
      if (this._isFullScreen()) {
        this._cancelFullScreen();
      } else {
        this._requestFullScreen();
      }
    }
    /**
     * @static
     * @method _onTick
     * @param {Number} delta
     * @private
     */
    static _onTick(delta) {
      if (this._fpsMeter && this._fpsMeter.shown)
        this._fpsMeter.begin();
      if (this._app.stage) {
        this._app.render();
      }
      if (this._fpsMeter && this._fpsMeter.shown)
        this._fpsMeter.end();
    }
    /**
     * @static
     * @method _createPixiApp
     * @private
     */
    static _createPixiApp() {
      const options = {
        view: this._canvas,
        width: this._width,
        height: this._height,
        resolution: window.devicePixelRatio,
        powerPreference: "high-performance",
        autoStart: true
      };
      try {
        this._app = new PIXI.Application(options);
        this._app.ticker.remove(this._app.render, this._app);
        this._app.ticker.add(this._onTick, this);
      } catch (e) {
        this._app = null;
        console.error(e);
      }
    }
    static _setupCssFontLoading() {
      if (Graphics._cssFontLoading) {
        document.fonts.ready.then((fonts) => {
          Graphics._fontLoaded = fonts;
        }).catch((error) => {
          SceneManager_default.onError(error);
        });
      }
    }
    /**
     * Marks the beginning of each frame for FPSMeter.
     *
     * @static
     * @method tickStart
     */
    static tickStart() {
    }
    /**
     * Marks the end of each frame for FPSMeter.
     *
     * @static
     * @method tickEnd
     */
    static tickEnd() {
    }
    /**
     * Checks whether the current browser supports WebGL.
     *
     * @static
     * @method hasWebGL
     * @return {Boolean} True if the current browser supports WebGL.
     */
    static hasWebGL() {
      if (typeof Graphics._canWebGL === "boolean") {
        return Graphics._canWebGL;
      }
      try {
        const canvas = document.createElement("canvas");
        const result2 = !!(canvas.getContext("webgl") || canvas.getContext("experimental-webgl"));
        Graphics._canWebGL = result2;
        return result2;
      } catch (e) {
        Graphics._canWebGL = false;
        return false;
      }
    }
    /**
     * Calls pixi.js garbage collector
     */
    static callGC() {
      if (Graphics.isWebGL()) {
        Graphics._renderer.textureGC.run();
      }
    }
    /**
     * @static
     * @method _makeErrorHtml
     * @param {String} name
     * @param {String} message
     * @return {String}
     * @private
     */
    static _makeErrorHtml(name, message) {
      return `<font color="yellow"><b>${name}</b></font><br><font color="white">${decodeURIComponent(
        message
      )}</font><br>`;
    }
    /**
     * @static
     * @method _defaultStretchMode
     * @private
     */
    static _defaultStretchMode() {
      return Utils_default.isNwjs() || Utils_default.isMobileDevice() || Utils_default.isTauri();
    }
    /**
     * @static
     * @method _modifyExistingElements
     * @private
     */
    static _modifyExistingElements() {
      const elements = document.getElementsByTagName("*");
      for (let i = 0; i < elements.length; i++) {
        if (elements[i].style.zIndex > 0) {
          elements[i].style.zIndex = 0;
        }
      }
    }
    /**
     * @static
     * @method _formatEventInfo
     * @private
     */
    static _formatEventInfo(error) {
      switch (String(error.eventType)) {
        case "map_event":
          return "MapID: %1, MapEventID: %2, page: %3, line: %4".format(
            error.mapId,
            error.mapEventId,
            error.page,
            error.line
          );
        case "common_event":
          return "CommonEventID: %1, line: %2".format(
            error.commonEventId,
            error.line
          );
        case "battle_event":
          return "TroopID: %1, page: %2, line: %3".format(
            error.troopId,
            error.page,
            error.line
          );
        case "test_event":
          return "TestEvent, line: %1".format(error.line);
        default:
          return "No information";
      }
    }
    /**
     * @static
     * @method _formatEventCommandInfo
     * @private
     */
    static _formatEventCommandInfo({ eventCommand, content }) {
      switch (String(eventCommand)) {
        case "plugin_command":
          return `\u25C6Plugin Command: ${content}`;
        case "script":
          return `\u25C6Script: ${content}`;
        case "control_variables":
          return `\u25C6Control Variables: Script: ${content}`;
        case "conditional_branch_script":
          return `\u25C6If: Script: ${content}`;
        case "set_route_script":
          return `\u25C6Set Movement Route: \u25C7Script: ${content}`;
        case "auto_route_script":
          return `Autonomous Movement Custom Route: \u25C7Script: ${content}`;
        case "other":
        default:
          return "";
      }
    }
    /**
     * @static
     * @method _formatStackTrace
     * @private
     */
    static _formatStackTrace({ stack }) {
      return decodeURIComponent(
        (stack || "").replace(/file:.*js\//g, "").replace(/http:.*js\//g, "").replace(/https:.*js\//g, "").replace(/chrome-extension:.*js\//g, "").replace(/\n/g, "<br>")
      );
    }
    /**
     * @static
     * @method _createRenderer
     * @private
     */
    static _createRenderer() {
    }
    /**
     * @static
     * @method _createFontLoader
     * @param {String} name
     * @private
     */
    static _createFontLoader(name) {
      const div = document.createElement("div");
      const text = document.createTextNode(".");
      div.style.fontFamily = name;
      div.style.fontSize = "0px";
      div.style.color = "transparent";
      div.style.position = "absolute";
      div.style.margin = "auto";
      div.style.top = "0px";
      div.style.left = "0px";
      div.style.width = "1px";
      div.style.height = "1px";
      div.appendChild(text);
      document.body.appendChild(div);
    }
    /**
     * @static
     * @method _disableTextSelection
     * @private
     */
    static _disableTextSelection() {
      const body = document.body;
      body.style.userSelect = "none";
      body.style.webkitUserSelect = "none";
      body.style.msUserSelect = "none";
      body.style.mozUserSelect = "none";
    }
    /**
     * @static
     * @method _disableContextMenu
     * @private
     */
    static _disableContextMenu() {
      const elements = document.body.getElementsByTagName("*");
      const oncontextmenu = () => false;
      for (let i = 0; i < elements.length; i++) {
        elements[i].oncontextmenu = oncontextmenu;
      }
    }
    /**
     * @static
     * @method _isFullScreen
     * @return {Boolean}
     * @private
     */
    static _isFullScreen() {
      return document.fullscreenElement || document.mozFullScreen || document.webkitFullscreenElement || document.msFullscreenElement;
    }
    /**
     * @static
     * @method _requestFullScreen
     * @private
     */
    static _requestFullScreen() {
      const element = document.body;
      if (element.requestFullscreen) {
        element.requestFullscreen();
      } else if (element.mozRequestFullScreen) {
        element.mozRequestFullScreen();
      } else if (element.webkitRequestFullScreen) {
        element.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
      } else if (element.msRequestFullscreen) {
        element.msRequestFullscreen();
      }
    }
    /**
     * @static
     * @method _cancelFullScreen
     * @private
     */
    static _cancelFullScreen() {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.webkitCancelFullScreen) {
        document.webkitCancelFullScreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
  };
  Graphics._cssFontLoading = document.fonts && document.fonts.ready && document.fonts.ready.then;
  Graphics._fontLoaded = null;
  Graphics._videoVolume = 1;
  Object.defineProperty(Graphics, "app", {
    get() {
      return this._app;
    },
    configurable: true
  });
  Object.defineProperty(Graphics, "_renderer", {
    get() {
      return this._app.renderer;
    },
    configurable: true
  });
  Graphics.frameCount = 0;
  Graphics.BLEND_NORMAL = 0;
  Graphics.BLEND_ADD = 1;
  Graphics.BLEND_MULTIPLY = 2;
  Graphics.BLEND_SCREEN = 3;
  Graphics._canWebGL = null;
  Object.defineProperty(Graphics, "width", {
    get() {
      return this._width;
    },
    set(value3) {
      if (this._width !== value3) {
        this._width = value3;
        this._updateAllElements();
      }
    },
    configurable: true
  });
  Object.defineProperty(Graphics, "height", {
    get() {
      return this._height;
    },
    set(value3) {
      if (this._height !== value3) {
        this._height = value3;
        this._updateAllElements();
      }
    },
    configurable: true
  });
  Object.defineProperty(Graphics, "boxWidth", {
    get() {
      return this._boxWidth;
    },
    set(value3) {
      this._boxWidth = value3;
    },
    configurable: true
  });
  Object.defineProperty(Graphics, "boxHeight", {
    get() {
      return this._boxHeight;
    },
    set(value3) {
      this._boxHeight = value3;
    },
    configurable: true
  });
  Object.defineProperty(Graphics, "scale", {
    get() {
      return this._scale;
    },
    set(value3) {
      if (this._scale !== value3) {
        this._scale = value3;
        this._updateAllElements();
      }
    },
    configurable: true
  });
  var Graphics_default = Graphics;

  // src-www/js/rpg_core/Rectangle.js
  var Rectangle = class extends PIXI.Rectangle {
    constructor(...args) {
      super(...args);
      this.initialize(...args);
    }
    initialize(x, y, width, height) {
      PIXI.Rectangle.call(this, x, y, width, height);
    }
  };
  Rectangle.emptyRectangle = new Rectangle(0, 0, 0, 0);
  var Rectangle_default = Rectangle;

  // src-www/js/rpg_core/Bitmap.js
  var Bitmap = class {
    constructor(...args) {
      this.initialize(...args);
    }
    /**
     * Bitmap states(Bitmap._loadingState):
     *
     * none:
     * Empty Bitmap
     *
     * pending:
     * Url requested, but pending to load until startRequest called
     *
     * purged:
     * Url request completed and purged.
     *
     * requesting:
     * Requesting supplied URI now.
     *
     * requestCompleted:
     * Request completed
     *
     * decrypting:
     * requesting encrypted data from supplied URI or decrypting it.
     *
     * decryptCompleted:
     * Decrypt completed
     *
     * loaded:
     * loaded. isReady() === true, so It's usable.
     *
     * error:
     * error occurred
     *
     */
    _createCanvas(width, height) {
      this.__canvas = this.__canvas || document.createElement("canvas");
      this.__context = this.__canvas.getContext("2d");
      this.__canvas.width = Math.max(width || 0, 1);
      this.__canvas.height = Math.max(height || 0, 1);
      if (this._image) {
        const w = Math.max(this._image.width || 0, 1);
        const h = Math.max(this._image.height || 0, 1);
        this.__canvas.width = w;
        this.__canvas.height = h;
        this._createBaseTexture(this._canvas);
        console.info(
          "[Bitmap._createCanvas] Drawing %o to canvas is slow.",
          this._image
        );
        this.__context.drawImage(this._image, 0, 0);
      }
      this._setDirty();
    }
    _createBaseTexture(source) {
      this.__baseTexture = new PIXI.BaseTexture(source);
      this.__baseTexture.mipmap = false;
      this.__baseTexture.width = source.width;
      this.__baseTexture.height = source.height;
      this._baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
    }
    _clearImgInstance() {
      this._image.src = "";
      this._image.onload = null;
      this._image.onerror = null;
      this._errorListener = null;
      this._loadListener = null;
      Bitmap._reuseImages.push(this._image);
      this._image = null;
    }
    _renewCanvas() {
      const newImage = this._image;
      if (newImage && this.__canvas && (this.__canvas.width < newImage.width || this.__canvas.height < newImage.height)) {
        this._createCanvas();
      }
    }
    initialize(width, height) {
      if (!this._defer) {
        this._createCanvas(width, height);
      }
      this._image = null;
      this._url = "";
      this._paintOpacity = 255;
      this._smooth = false;
      this._loadListeners = [];
      this._loadingState = "none";
      this._decodeAfterRequest = false;
      this.cacheEntry = null;
      this.fontFace = "GameFont";
      this.fontSize = 28;
      this.fontItalic = false;
      this.textColor = "#ffffff";
      this.outlineColor = "rgba(0, 0, 0, 0.5)";
      this.outlineWidth = 4;
    }
    /**
     * Checks whether the bitmap is ready to render.
     *
     * @method isReady
     * @return {Boolean} True if the bitmap is ready to render
     */
    isReady() {
      return this._loadingState === "loaded" || this._loadingState === "none";
    }
    /**
     * Checks whether a loading error has occurred.
     *
     * @method isError
     * @return {Boolean} True if a loading error has occurred
     */
    isError() {
      return this._loadingState === "error";
    }
    /**
     * touch the resource
     * @method touch
     */
    touch() {
      if (this.cacheEntry) {
        this.cacheEntry.touch();
      }
    }
    /**
     * [read-only] The url of the image file.
     *
     * @property url
     * @type String
     */
    get url() {
      return this._url;
    }
    /**
     * [read-only] The base texture that holds the image.
     *
     * @property baseTexture
     * @type PIXI.BaseTexture
     */
    get baseTexture() {
      return this._baseTexture;
    }
    /**
     * [read-only] The bitmap canvas.
     *
     * @property canvas
     * @type HTMLCanvasElement
     */
    get canvas() {
      return this._canvas;
    }
    /**
     * [read-only] The 2d context of the bitmap canvas.
     *
     * @property context
     * @type CanvasRenderingContext2D
     */
    get context() {
      return this._context;
    }
    /**
     * [read-only] The width of the bitmap.
     *
     * @property width
     * @type Number
     */
    get width() {
      if (this.isReady()) {
        return this._image ? this._image.width : this._canvas.width;
      }
      return 0;
    }
    /**
     * [read-only] The height of the bitmap.
     *
     * @property height
     * @type Number
     */
    get height() {
      if (this.isReady()) {
        return this._image ? this._image.height : this._canvas.height;
      }
      return 0;
    }
    /**
     * [read-only] The rectangle of the bitmap.
     *
     * @property rect
     * @type Rectangle
     */
    get rect() {
      return new Rectangle_default(0, 0, this.width, this.height);
    }
    /**
     * Whether the smooth scaling is applied.
     *
     * @property smooth
     * @type Boolean
     */
    get smooth() {
      return this._smooth;
    }
    set smooth(value3) {
      if (this._smooth !== false) {
        this._smooth = false;
      }
    }
    /**
     * The opacity of the drawing object in the range (0, 255).
     *
     * @property paintOpacity
     * @type Number
     */
    get paintOpacity() {
      return this._paintOpacity;
    }
    set paintOpacity(value3) {
      if (this._paintOpacity !== value3) {
        this._paintOpacity = value3;
        this._context.globalAlpha = this._paintOpacity / 255;
      }
    }
    /**
     * Resizes the bitmap.
     *
     * @method resize
     * @param {Number} width The new width of the bitmap
     * @param {Number} height The new height of the bitmap
     */
    resize(width, height) {
      width = Math.max(width || 0, 1);
      height = Math.max(height || 0, 1);
      this._canvas.width = width;
      this._canvas.height = height;
      this._baseTexture.width = width;
      this._baseTexture.height = height;
    }
    /**
     * Performs a block transfer.
     *
     * @method blt
     * @param {Bitmap} source The bitmap to draw
     * @param {Number} sx The x coordinate in the source
     * @param {Number} sy The y coordinate in the source
     * @param {Number} sw The width of the source image
     * @param {Number} sh The height of the source image
     * @param {Number} dx The x coordinate in the destination
     * @param {Number} dy The y coordinate in the destination
     * @param {Number} [dw=sw] The width to draw the image in the destination
     * @param {Number} [dh=sh] The height to draw the image in the destination
     */
    blt({ width, height, _canvas }, sx, sy, sw, sh, dx, dy, dw, dh) {
      console.info("[Bitmap.blt] Canvas block transfer is slow.");
      dw = dw || sw;
      dh = dh || sh;
      sx = Math.floor(sx);
      sy = Math.floor(sy);
      sw = Math.floor(sw);
      sh = Math.floor(sh);
      dx = Math.floor(dx);
      dy = Math.floor(dy);
      dw = Math.floor(dw);
      dh = Math.floor(dh);
      if (sx >= 0 && sy >= 0 && sw > 0 && sh > 0 && dw > 0 && dh > 0 && sx + sw <= width && sy + sh <= height) {
        this._context.globalCompositeOperation = "source-over";
        this._context.drawImage(_canvas, sx, sy, sw, sh, dx, dy, dw, dh);
        this._setDirty();
      }
    }
    /**
     * Performs a block transfer, using assumption that original image was not modified (no hue)
     *
     * @method blt
     * @param {Bitmap} source The bitmap to draw
     * @param {Number} sx The x coordinate in the source
     * @param {Number} sy The y coordinate in the source
     * @param {Number} sw The width of the source image
     * @param {Number} sh The height of the source image
     * @param {Number} dx The x coordinate in the destination
     * @param {Number} dy The y coordinate in the destination
     * @param {Number} [dw=sw] The width to draw the image in the destination
     * @param {Number} [dh=sh] The height to draw the image in the destination
     */
    bltImage({ width, height, _image }, sx, sy, sw, sh, dx, dy, dw, dh) {
      dw = dw || sw;
      dh = dh || sh;
      if (sx >= 0 && sy >= 0 && sw > 0 && sh > 0 && dw > 0 && dh > 0 && sx + sw <= width && sy + sh <= height) {
        this._context.globalCompositeOperation = "source-over";
        this._context.drawImage(_image, sx, sy, sw, sh, dx, dy, dw, dh);
        this._setDirty();
      }
    }
    /**
     * Returns pixel color at the specified point.
     *
     * @method getPixel
     * @param {Number} x The x coordinate of the pixel in the bitmap
     * @param {Number} y The y coordinate of the pixel in the bitmap
     * @return {String} The pixel color (hex format)
     */
    getPixel(x, y) {
      const data = this._context.getImageData(x, y, 1, 1).data;
      let result2 = "#";
      for (let i = 0; i < 3; i++) {
        result2 += data[i].toString(16).padZero(2);
      }
      return result2;
    }
    /**
     * Returns alpha pixel value at the specified point.
     *
     * @method getAlphaPixel
     * @param {Number} x The x coordinate of the pixel in the bitmap
     * @param {Number} y The y coordinate of the pixel in the bitmap
     * @return {String} The alpha value
     */
    getAlphaPixel(x, y) {
      const data = this._context.getImageData(x, y, 1, 1).data;
      return data[3];
    }
    /**
     * Clears the specified rectangle.
     *
     * @method clearRect
     * @param {Number} x The x coordinate for the upper-left corner
     * @param {Number} y The y coordinate for the upper-left corner
     * @param {Number} width The width of the rectangle to clear
     * @param {Number} height The height of the rectangle to clear
     */
    clearRect(x, y, width, height) {
      this._context.clearRect(x, y, width, height);
      this._setDirty();
    }
    /**
     * Clears the entire bitmap.
     *
     * @method clear
     */
    clear() {
      this.clearRect(0, 0, this.width, this.height);
    }
    /**
     * Fills the specified rectangle.
     *
     * @method fillRect
     * @param {Number} x The x coordinate for the upper-left corner
     * @param {Number} y The y coordinate for the upper-left corner
     * @param {Number} width The width of the rectangle to fill
     * @param {Number} height The height of the rectangle to fill
     * @param {String} color The color of the rectangle in CSS format
     */
    fillRect(x, y, width, height, color) {
      x = Math.floor(x);
      y = Math.floor(y);
      width = Math.floor(width);
      height = Math.floor(height);
      const context = this._context;
      context.save();
      context.fillStyle = color;
      context.fillRect(x, y, width, height);
      context.restore();
      this._setDirty();
    }
    /**
     * Fills the entire bitmap.
     *
     * @method fillAll
     * @param {String} color The color of the rectangle in CSS format
     */
    fillAll(color) {
      this.fillRect(0, 0, this.width, this.height, color);
    }
    /**
     * Draws the rectangle with a gradation.
     *
     * @method gradientFillRect
     * @param {Number} x The x coordinate for the upper-left corner
     * @param {Number} y The y coordinate for the upper-left corner
     * @param {Number} width The width of the rectangle to fill
     * @param {Number} height The height of the rectangle to fill
     * @param {String} color1 The gradient starting color
     * @param {String} color2 The gradient ending color
     * @param {Boolean} vertical Wether the gradient should be draw as vertical or not
     */
    gradientFillRect(x, y, width, height, color1, color2, vertical) {
      const context = this._context;
      let grad;
      if (vertical) {
        grad = context.createLinearGradient(x, y, x, y + height);
      } else {
        grad = context.createLinearGradient(x, y, x + width, y);
      }
      grad.addColorStop(0, color1);
      grad.addColorStop(1, color2);
      context.save();
      context.fillStyle = grad;
      context.fillRect(x, y, width, height);
      context.restore();
      this._setDirty();
    }
    /**
     * Draw a bitmap in the shape of a circle
     *
     * @method drawCircle
     * @param {Number} x The x coordinate based on the circle center
     * @param {Number} y The y coordinate based on the circle center
     * @param {Number} radius The radius of the circle
     * @param {String} color The color of the circle in CSS format
     */
    drawCircle(x, y, radius, color) {
      x = Math.floor(x);
      y = Math.floor(y);
      const context = this._context;
      context.save();
      context.fillStyle = color;
      context.beginPath();
      context.arc(x, y, radius, 0, Math.PI * 2, false);
      context.fill();
      context.restore();
      this._setDirty();
    }
    /**
     * Draws the outline text to the bitmap.
     *
     * @method drawText
     * @param {String} text The text that will be drawn
     * @param {Number} x The x coordinate for the left of the text
     * @param {Number} y The y coordinate for the top of the text
     * @param {Number} maxWidth The maximum allowed width of the text
     * @param {Number} lineHeight The height of the text line
     * @param {String} align The alignment of the text
     */
    drawText(text, x, y, maxWidth, lineHeight, align) {
      if (text !== void 0) {
        x = Math.floor(x);
        y = Math.floor(y);
        maxWidth = Math.floor(maxWidth) || 4294967295;
        lineHeight = Math.floor(lineHeight);
        let tx = x;
        const ty = y + lineHeight - Math.round((lineHeight - this.fontSize * 0.7) / 2);
        const context = this._context;
        const alpha = context.globalAlpha;
        if (align === "center") {
          tx += maxWidth / 2;
        }
        if (align === "right") {
          tx += maxWidth;
        }
        context.save();
        context.font = this._makeFontNameText();
        context.textAlign = align;
        context.textBaseline = "alphabetic";
        context.globalAlpha = 1;
        this._drawTextOutline(text, tx, ty, maxWidth);
        context.globalAlpha = alpha;
        this._drawTextBody(text, tx, ty, maxWidth);
        context.restore();
        this._setDirty();
      }
    }
    /**
     * Deprecated function.
     *
     * @method drawSmallText
     */
    drawSmallText(text, x, y, maxWidth, lineHeight, align) {
    }
    /**
     * Returns the width of the specified text.
     *
     * @method measureTextWidth
     * @param {String} text The text to be measured
     * @return {Number} The width of the text in pixels
     */
    measureTextWidth(text) {
      const context = this._context;
      context.save();
      context.font = this._makeFontNameText();
      const width = context.measureText(text).width;
      context.restore();
      return width;
    }
    /**
     * Changes the color tone of the entire bitmap.
     *
     * @method adjustTone
     * @param {Number} r The red strength in the range (-255, 255)
     * @param {Number} g The green strength in the range (-255, 255)
     * @param {Number} b The blue strength in the range (-255, 255)
     */
    adjustTone(r, g, b2) {
      if ((r || g || b2) && this.width > 0 && this.height > 0) {
        const context = this._context;
        const imageData = context.getImageData(0, 0, this.width, this.height);
        const pixels = imageData.data;
        for (let i = 0; i < pixels.length; i += 4) {
          pixels[i + 0] += r;
          pixels[i + 1] += g;
          pixels[i + 2] += b2;
        }
        context.putImageData(imageData, 0, 0);
        this._setDirty();
      }
    }
    /**
     * Rotates the hue of the entire bitmap.
     *
     * @method rotateHue
     * @param {Number} offset The hue offset in 360 degrees
     */
    rotateHue(offset) {
      if (!offset)
        return;
      function rgbToHsl(r, g, b2) {
        const cmin = Math.min(r, g, b2);
        const cmax = Math.max(r, g, b2);
        let h = 0;
        let s = 0;
        const l = (cmin + cmax) / 2;
        const delta = cmax - cmin;
        if (delta > 0) {
          if (r === cmax) {
            h = 60 * (((g - b2) / delta + 6) % 6);
          } else if (g === cmax) {
            h = 60 * ((b2 - r) / delta + 2);
          } else {
            h = 60 * ((r - g) / delta + 4);
          }
          s = delta / (255 - Math.abs(2 * l - 255));
        }
        return [h, s, l];
      }
      function hslToRgb(h, s, l) {
        const c = (255 - Math.abs(2 * l - 255)) * s;
        const x = c * (1 - Math.abs(h / 60 % 2 - 1));
        const m = l - c / 2;
        const cm = c + m;
        const xm = x + m;
        if (h < 60) {
          return [cm, xm, m];
        } else if (h < 120) {
          return [xm, cm, m];
        } else if (h < 180) {
          return [m, cm, xm];
        } else if (h < 240) {
          return [m, xm, cm];
        } else if (h < 300) {
          return [xm, m, cm];
        } else {
          return [cm, m, xm];
        }
      }
      if (offset && this.width > 0 && this.height > 0) {
        offset = (offset % 360 + 360) % 360;
        const context = this._context;
        const imageData = context.getImageData(0, 0, this.width, this.height);
        const pixels = imageData.data;
        for (let i = 0; i < pixels.length; i += 4) {
          const hsl = rgbToHsl(pixels[i + 0], pixels[i + 1], pixels[i + 2]);
          const h = (hsl[0] + offset) % 360;
          const s = hsl[1];
          const l = hsl[2];
          const rgb = hslToRgb(h, s, l);
          pixels[i + 0] = rgb[0];
          pixels[i + 1] = rgb[1];
          pixels[i + 2] = rgb[2];
        }
        console.info("[Bitmap.rotateHue] Rotate hue on canvas is slow.");
        context.putImageData(imageData, 0, 0);
        this._setDirty();
      }
    }
    /**
     * Applies a blur effect to the bitmap.
     *
     * @method blur
     */
    blur() {
      for (let i = 0; i < 2; i++) {
        const w = this.width;
        const h = this.height;
        const canvas = this._canvas;
        const context = this._context;
        const tempCanvas = document.createElement("canvas");
        const tempContext = tempCanvas.getContext("2d");
        console.info("[Bitmap.blur] Blur on canvas is slow.");
        tempCanvas.width = w + 2;
        tempCanvas.height = h + 2;
        tempContext.drawImage(canvas, 0, 0, w, h, 1, 1, w, h);
        tempContext.drawImage(canvas, 0, 0, w, 1, 1, 0, w, 1);
        tempContext.drawImage(canvas, 0, 0, 1, h, 0, 1, 1, h);
        tempContext.drawImage(canvas, 0, h - 1, w, 1, 1, h + 1, w, 1);
        tempContext.drawImage(canvas, w - 1, 0, 1, h, w + 1, 1, 1, h);
        context.save();
        context.fillStyle = "black";
        context.fillRect(0, 0, w, h);
        context.globalCompositeOperation = "lighter";
        context.globalAlpha = 1 / 9;
        for (let y = 0; y < 3; y++) {
          for (let x = 0; x < 3; x++) {
            context.drawImage(tempCanvas, x, y, w, h, 0, 0, w, h);
          }
        }
        context.restore();
      }
      this._setDirty();
    }
    /**
     * Add a callback function that will be called when the bitmap is loaded.
     *
     * @method addLoadListener
     * @param {Function} listner The callback function
     */
    addLoadListener(listner) {
      if (!this.isReady()) {
        this._loadListeners.push(listner);
      } else {
        listner(this);
      }
    }
    /**
     * @method _makeFontNameText
     * @private
     */
    _makeFontNameText() {
      return `${(this.fontItalic ? "Italic " : "") + this.fontSize}px ${this.fontFace}`;
    }
    /**
     * @method _drawTextOutline
     * @param {String} text
     * @param {Number} tx
     * @param {Number} ty
     * @param {Number} maxWidth
     * @private
     */
    _drawTextOutline(text, tx, ty, maxWidth) {
      const context = this._context;
      context.strokeStyle = this.outlineColor;
      context.lineWidth = this.outlineWidth;
      context.lineJoin = "round";
      context.strokeText(text, tx, ty, maxWidth);
    }
    /**
     * @method _drawTextBody
     * @param {String} text
     * @param {Number} tx
     * @param {Number} ty
     * @param {Number} maxWidth
     * @private
     */
    _drawTextBody(text, tx, ty, maxWidth) {
      const context = this._context;
      context.fillStyle = this.textColor;
      context.fillText(text, tx, ty, maxWidth);
    }
    /**
     * @method _onLoad
     * @private
     */
    _onLoad() {
      this._image.removeEventListener("load", this._loadListener);
      this._image.removeEventListener("error", this._errorListener);
      this._renewCanvas();
      switch (this._loadingState) {
        case "requesting":
          this._loadingState = "requestCompleted";
          if (this._decodeAfterRequest) {
            this.decode();
          } else {
            this._loadingState = "purged";
            this._clearImgInstance();
          }
          break;
        case "decrypting":
          window.URL.revokeObjectURL(this._image.src);
          this._loadingState = "decryptCompleted";
          if (this._decodeAfterRequest) {
            this.decode();
          } else {
            this._loadingState = "purged";
            this._clearImgInstance();
          }
          break;
      }
    }
    decode() {
      switch (this._loadingState) {
        case "requestCompleted":
        case "decryptCompleted":
          this._loadingState = "loaded";
          if (!this.__canvas)
            this._createBaseTexture(this._image);
          this._setDirty();
          this._callLoadListeners();
          break;
        case "requesting":
        case "decrypting":
          this._decodeAfterRequest = true;
          if (!this._loader) {
            this._loader = ResourceHandler_default.createLoader(
              this._url,
              this._requestImage.bind(this, this._url),
              this._onError.bind(this)
            );
            this._image.removeEventListener("error", this._errorListener);
            this._image.addEventListener(
              "error",
              this._errorListener = this._loader
            );
          }
          break;
        case "pending":
        case "purged":
        case "error":
          this._decodeAfterRequest = true;
          this._requestImage(this._url);
          break;
      }
    }
    /**
     * @method _callLoadListeners
     * @private
     */
    _callLoadListeners() {
      while (this._loadListeners.length > 0) {
        const listener = this._loadListeners.shift();
        listener(this);
      }
    }
    /**
     * @method _onError
     * @private
     */
    _onError() {
      this._image.removeEventListener("load", this._loadListener);
      this._image.removeEventListener("error", this._errorListener);
      this._loadingState = "error";
    }
    /**
     * @method _setDirty
     * @private
     */
    _setDirty() {
      this._dirty = true;
    }
    /**
     * updates texture is bitmap was dirty
     * @method checkDirty
     */
    checkDirty() {
      if (this._dirty) {
        this._baseTexture.update();
        const baseTexture = this._baseTexture;
        setTimeout(() => {
          baseTexture.update();
        }, 0);
        this._dirty = false;
      }
    }
    _requestImage(url) {
      if (Bitmap._reuseImages.length !== 0) {
        this._image = Bitmap._reuseImages.pop();
      } else {
        this._image = new Image();
      }
      if (this._decodeAfterRequest && !this._loader) {
        this._loader = ResourceHandler_default.createLoader(
          url,
          this._requestImage.bind(this, url),
          this._onError.bind(this)
        );
      }
      this._url = url;
      this._loadingState = "requesting";
      if (!Decrypter_default.checkImgIgnore(url) && Decrypter_default.hasEncryptedImages) {
        this._loadingState = "decrypting";
        Decrypter_default.decryptImg(url, this);
      } else {
        this._image.src = url;
        this._image.addEventListener(
          "load",
          this._loadListener = Bitmap.prototype._onLoad.bind(this)
        );
        this._image.addEventListener(
          "error",
          this._errorListener = this._loader || Bitmap.prototype._onError.bind(this)
        );
      }
    }
    isRequestOnly() {
      return !(this._decodeAfterRequest || this.isReady());
    }
    isRequestReady() {
      return this._loadingState !== "pending" && this._loadingState !== "requesting" && this._loadingState !== "decrypting";
    }
    startRequest() {
      if (this._loadingState === "pending") {
        this._decodeAfterRequest = false;
        this._requestImage(this._url);
      }
    }
    /**
     * Loads a image file and returns a new bitmap object.
     *
     * @static
     * @method load
     * @param {String} url The image url of the texture
     * @return Bitmap
     */
    static load(url) {
      const bitmap = Object.create(Bitmap.prototype);
      bitmap._defer = true;
      bitmap.initialize();
      bitmap._decodeAfterRequest = true;
      bitmap._requestImage(url);
      return bitmap;
    }
    /**
     * Takes a snapshot of the game screen and returns a new bitmap object.
     *
     * @static
     * @method snap
     * @param {Stage} stage The stage object
     * @return Bitmap
     */
    static snap(stage) {
      const width = Graphics_default.width;
      const height = Graphics_default.height;
      const bitmap = new Bitmap(width, height);
      const context = bitmap._context;
      const renderTexture = PIXI.RenderTexture.create({
        width,
        height
      });
      if (stage) {
        Graphics_default._renderer.render(stage, {
          renderTexture
        });
        stage.worldTransform.identity();
        let canvas = null;
        if (Graphics_default.isWebGL()) {
          canvas = Graphics_default._renderer.plugins.extract.canvas(renderTexture);
        } else {
          canvas = renderTexture.baseTexture._canvasRenderTarget.canvas;
        }
        context.drawImage(canvas, 0, 0);
      } else {
      }
      renderTexture.destroy({
        destroyBase: true
      });
      bitmap._setDirty();
      return bitmap;
    }
    static request(url) {
      const bitmap = Object.create(Bitmap.prototype);
      bitmap._defer = true;
      bitmap.initialize();
      bitmap._url = url;
      bitmap._loadingState = "pending";
      return bitmap;
    }
  };
  Bitmap._reuseImages = [];
  Object.defineProperties(Bitmap.prototype, {
    _canvas: {
      get() {
        if (!this.__canvas)
          this._createCanvas();
        return this.__canvas;
      }
    },
    _context: {
      get() {
        if (!this.__context)
          this._createCanvas();
        return this.__context;
      }
    },
    _baseTexture: {
      get() {
        if (!this.__baseTexture)
          this._createBaseTexture(this._image || this.__canvas);
        return this.__baseTexture;
      }
    }
  });
  var Bitmap_default = Bitmap;

  // src-www/js/rpg_managers/ImageManager.js
  var ImageManager = class {
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
        empty = new Bitmap_default();
        this._imageCache.add("empty", empty);
        this._imageCache.reserve("empty", empty, this._systemReservationId);
      }
      return empty;
    }
    static loadNormalBitmap(path, hue) {
      const key = this._generateCacheKey(path, hue);
      let bitmap = this._imageCache.get(key);
      if (!bitmap) {
        bitmap = Bitmap_default.load(path);
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
      this._imageCache = new ImageCache_default();
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
        bitmap = Bitmap_default.request(path);
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
      if (this._creationHook)
        this._creationHook(bitmap);
    }
    static isObjectCharacter(filename) {
      const sign2 = filename.match(/^[\!\$]+/);
      return sign2 && sign2[0].contains("!");
    }
    static isBigCharacter(filename) {
      const sign2 = filename.match(/^[\!\$]+/);
      return sign2 && sign2[0].contains("$");
    }
    static isZeroParallax(filename) {
      return filename.charAt(0) === "!";
    }
    static _generateCacheKey(path, hue) {
      return `${path}:${hue}`;
    }
  };
  ImageManager.cache = new CacheMap_default(ImageManager);
  ImageManager._imageCache = new ImageCache_default();
  ImageManager._requestQueue = new RequestQueue_default();
  ImageManager._systemReservationId = Utils_default.generateRuntimeId();
  var ImageManager_default = ImageManager;

  // src-www/js/rpg_core/ProgressWatcher.js
  var ProgressWatcher = class {
    constructor() {
      throw new Error("This is a static class");
    }
    static initialize() {
      this.clearProgress();
      ImageManager_default.setCreationHook(this._bitmapListener.bind(this));
      AudioManager_default.setCreationHook(this._audioListener.bind(this));
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
  };
  var ProgressWatcher_default = ProgressWatcher;

  // src-www/js/rpg_core/Point.js
  var Point = class extends PIXI.Point {
    constructor(...args) {
      super(...args);
      this.initialize(...args);
    }
    initialize(x, y) {
      PIXI.Point.call(this, x, y);
    }
    /**
     * The x coordinate.
     *
     * @property x
     * @type Number
     */
    /**
     * The y coordinate.
     *
     * @property y
     * @type Number
     */
  };
  var Point_default = Point;

  // src-www/js/rpg_core/BitmapPIXI.js
  var BitmapPIXI = class extends PIXI.Container {
    constructor(...args) {
      super(...args);
      this.initialize(...args);
    }
    initialize(width, height) {
      PIXI.Container.call(this);
      width = Math.max(width || 0, 1);
      height = Math.max(height || 0, 1);
      this._width = width;
      this._height = height;
      this._paintOpacity = 255;
      this.textPadding = 2;
      this.wordWrap = false;
      this.wordWrapWidth = 0;
      this.fontFace = "GameFont";
      this.fontSize = 28;
      this.fontItalic = false;
      this.textColor = "#ffffff";
      this.outlineColor = "rgba(0, 0, 0, 0.5)";
      this.outlineWidth = 4;
      this.textCache = [];
      this.on("removed", this.onRemoveAsAChild);
    }
    /**
     * Make sure the text cache is emptied and all children are destroyed
     *
     * @method _onRemoveAsAChild
     * @private
     */
    onRemoveAsAChild() {
      this.textCache = [];
      for (let i = this.children.length - 1; i >= 0; i--) {
        this.children[i].destroy({
          children: true,
          texture: true
        });
        this.removeChild(this.children[i]);
      }
    }
    get paintOpacity() {
      return this._paintOpacity;
    }
    set paintOpacity(value3) {
      if (this._paintOpacity !== value3) {
        this._paintOpacity = value3;
      }
    }
    get width() {
      return this._width;
    }
    set width(value3) {
      if (this._width !== value3) {
        this._width = value3;
      }
    }
    get height() {
      return this._height;
    }
    set height(value3) {
      if (this._height !== value3) {
        this._height = value3;
      }
    }
    /**
     * Resizes the bitmap.
     *
     * @method resize
     * @param {Number} width The new width of the bitmap
     * @param {Number} height The new height of the bitmap
     */
    resize(width, height) {
      width = Math.max(width || 0, 1);
      height = Math.max(height || 0, 1);
      this._width = width;
      this._height = height;
    }
    /**
     * Clear text and destroy children.
     *
     * @method clear
     */
    clear() {
      for (let i = this.children.length - 1; i >= 0; i--) {
        if (this.children[i].isBitmapText) {
          this.children[i].text = "";
          continue;
        }
        this.children[i].destroy({
          children: true,
          texture: true
        });
        this.removeChild(this.children[i]);
      }
    }
    /**
     * Clear text and destroy children in a given area.
     *
     * @method clearRect
     * @param {Number} x Horizontal coordinate of area to clear
     * @param {Number} y Vertical coordinate of area to clear
     * @param {Number} width The width of area to clear
     * @param {Number} height The height of area to clear
     */
    clearRect(x, y, width, height) {
      const self2 = this;
      const toRemove = [];
      this.children.forEach((child) => {
        if (child && child.x >= x && child.x < x + width && child.y >= y && child.y < y + height) {
          if (child.isBitmapText) {
            child.text = "";
          } else {
            toRemove.push(child);
          }
        }
      });
      toRemove.forEach((child) => {
        child.destroy({
          children: true,
          texture: true
        });
        self2.removeChild(child);
      });
    }
    /**
     * Draws PIXI BitmapText.
     *
     * @method drawText
     * @param {String} text The text that will be drawn
     * @param {Number} x The x coordinate for the left of the text
     * @param {Number} y The y coordinate for the top of the text
     * @param {Number} maxWidth The maximum allowed width of the text
     * @param {Number} lineHeight The height of the text line
     * @param {String} align The alignment of the text
     */
    drawText(text, x, y, maxWidth, lineHeight, align) {
      if (text === void 0)
        return;
      const alpha = this._paintOpacity / 255;
      maxWidth = Math.floor(maxWidth) || 4294967295;
      lineHeight = Math.floor(lineHeight);
      text = String(text);
      if (align === "center") {
        x = x + maxWidth / 2;
      } else if (align === "right") {
        x = x + maxWidth;
      }
      y = y + lineHeight - this.fontSize * 1.25;
      x = Math.floor(x);
      y = Math.floor(y);
      const updateExisting = this._updateExistingText(text, x, y, alpha);
      if (!updateExisting) {
        this._drawNewText(text, x, y, alpha, maxWidth, lineHeight, align);
      }
    }
    /**
     * Updates instance of PIXI BitmapText.
     *
     * @method _updateExistingText
     * @return {Boolean} Returns true if update was successful
     * @private
     */
    _updateExistingText(text, x, y, alpha) {
      for (const bitmapTextInstance of this.textCache) {
        if (bitmapTextInstance.x === x && bitmapTextInstance.y === y) {
          const newTint = PIXI.utils.string2hex(this.textColor);
          if (bitmapTextInstance._tint !== newTint)
            bitmapTextInstance.tint = newTint;
          if (bitmapTextInstance.text !== text)
            bitmapTextInstance.text = text;
          if (bitmapTextInstance.alpha !== alpha)
            bitmapTextInstance.alpha = alpha;
          this.addChild(bitmapTextInstance);
          return true;
        }
      }
      return false;
    }
    /**
     * Creates instances of PIXI BitmapText.
     *
     * @method _drawNewText
     * @private
     */
    _drawNewText(text, x, y, alpha, maxWidth, lineHeight, align) {
      const style = {
        fontFamily: this.fontFace,
        fontSize: this.fontSize,
        fill: 16777215,
        lineHeight,
        wordWrap: this.wordWrap,
        wordWrapWidth: this.wordWrapWidth,
        padding: this.textPadding,
        fontStyle: this.fontItalic ? "italic" : "normal",
        stroke: this.outlineColor,
        strokeThickness: this.outlineWidth
      };
      if (!PIXI.BitmapFont.available[style.fontFamily]) {
        this._makeBitmapFont(style);
      }
      const pixiText = new PIXI.BitmapText(text, {
        fontName: style.fontFamily,
        fontSize: style.fontSize
      });
      if (!style.wordWrap && pixiText.width > maxWidth) {
        pixiText.scale.x = maxWidth / pixiText.width;
      }
      if (align === "center") {
        pixiText.anchor.set(0.5, 0);
      } else if (align === "right") {
        pixiText.anchor.set(1, 0);
      }
      if (pixiText) {
        pixiText.x = x;
        pixiText.y = y;
        pixiText.tint = PIXI.utils.string2hex(this.textColor);
        pixiText.alpha = alpha;
        pixiText.isBitmapText = true;
        this.textCache.push(pixiText);
        this.addChild(pixiText);
      }
    }
    /**
     * Creates a bitmap font.
     *
     * @method _makeBitmapFont
     * @private
     */
    _makeBitmapFont(style) {
      const bitmapOptions = {
        chars: [[" ", "~"], "\u2192", "\u2019"]
      };
      PIXI.BitmapFont.from(style.fontFamily, style, bitmapOptions);
    }
    /**
     * Returns the width of the specified text.
     *
     * @method measureTextWidth
     * @param {String} text The text to be measured
     * @return {Number} The width of the text in pixels
     */
    measureTextWidth(text) {
      text = String(text);
      const style = new PIXI.TextStyle({
        fontFamily: this.fontFace,
        fontSize: this.fontSize,
        padding: this.textPadding
      });
      const textMetrics = PIXI.TextMetrics.measureText(text, style);
      return textMetrics.width;
    }
    /**
     * Creates a nine slice plane.
     *
     * @method create9Slice
     */
    create9Slice(source, x, y, w, h, tl, tr, br, bl) {
      return new PIXI.NineSlicePlane(
        new PIXI.Texture(source, new PIXI.Rectangle(x, y, w, h)),
        tl,
        tr,
        br,
        bl
      );
    }
    /**
     * Creates a tiling sprite.
     *
     * @method createTilingSprite
     */
    createTilingSprite(source, x, y, w, h, tileWidth, tileHeight) {
      return new PIXI.TilingSprite(
        new PIXI.Texture(source, new PIXI.Rectangle(x, y, w, h)),
        tileWidth,
        tileHeight
      );
    }
    /**
     * Creates a sprite by cropping a texture.
     *
     * @method createCroppedSprite
     */
    createCroppedSprite(source, x, y, w, h) {
      return new PIXI.Sprite(
        new PIXI.Texture(source, new PIXI.Rectangle(x, y, w, h))
      );
    }
    /**
     * Equivalent to a block transfer.
     * Create a sprite and adds it as a child.
     *
     * @method blt
     * @param {Bitmap} source The bitmap to draw
     * @param {Number} sx The x coordinate in the source
     * @param {Number} sy The y coordinate in the source
     * @param {Number} sw The width of the source image
     * @param {Number} sh The height of the source image
     * @param {Number} dx The x coordinate in the destination
     * @param {Number} dy The y coordinate in the destination
     * @param {Number} [dw=sw] The width to draw the image in the destination
     * @param {Number} [dh=sh] The height to draw the image in the destination
     */
    blt({ width, height, baseTexture }, sx, sy, sw, sh, dx, dy, dw, dh) {
      dw = dw || sw;
      dh = dh || sh;
      sx = Math.floor(sx);
      sy = Math.floor(sy);
      sw = Math.floor(sw);
      sh = Math.floor(sh);
      dx = Math.floor(dx);
      dy = Math.floor(dy);
      dw = Math.floor(dw);
      dh = Math.floor(dh);
      if (sx >= 0 && sy >= 0 && sw > 0 && sh > 0 && dw > 0 && dh > 0 && sx + sw <= width && sy + sh <= height) {
        const sprite = this.createCroppedSprite(baseTexture, sx, sy, sw, sh);
        if (sprite) {
          sprite.x = dx;
          sprite.y = dy;
          sprite.width = dw;
          sprite.height = dh;
          sprite.alpha = this._paintOpacity / 255;
          this.addChild(sprite);
          return sprite;
        }
      }
    }
    /**
     * Fills the specified rectangle.
     *
     * @method fillRect
     * @param {Number} x The x coordinate for the upper-left corner
     * @param {Number} y The y coordinate for the upper-left corner
     * @param {Number} width The width of the rectangle to fill
     * @param {Number} height The height of the rectangle to fill
     * @param {String} color The color of the rectangle in CSS format
     */
    fillRect(x, y, width, height, color) {
      x = Math.floor(x);
      y = Math.floor(y);
      width = Math.floor(width);
      height = Math.floor(height);
      const rectangle = new PIXI.Graphics();
      color = PIXI.utils.string2hex(color);
      rectangle.beginFill(color);
      rectangle.drawRect(0, 0, width, height);
      rectangle.endFill();
      if (rectangle) {
        rectangle.x = x;
        rectangle.y = y;
        rectangle.alpha = this._paintOpacity / 255;
        this.addChild(rectangle);
      }
      return rectangle;
    }
    /**
     * Ignores the 2nd colour and returns a solid-colour rectangle.
     *
     * @method gradientFillRect
     * @param {Number} x The x coordinate for the upper-left corner
     * @param {Number} y The y coordinate for the upper-left corner
     * @param {Number} width The width of the rectangle to fill
     * @param {Number} height The height of the rectangle to fill
     * @param {String} color1 The gradient starting color
     * @param {String} color2 The gradient ending color
     * @param {Boolean} vertical Wether the gradient should be draw as vertical or not
     */
    gradientFillRect(x, y, width, height, color1, color2, vertical) {
      return this.fillRect(x, y, width, height, color1);
    }
    /**
     * Draw a shape in the shape of a circle
     *
     * @method drawCircle
     * @param {Number} x The x coordinate based on the circle center
     * @param {Number} y The y coordinate based on the circle center
     * @param {Number} radius The radius of the circle
     * @param {String} color The color of the circle in CSS format
     */
    drawCircle(x, y, radius, color) {
      x = Math.floor(x);
      y = Math.floor(y);
      const circle = new PIXI.Graphics();
      color = PIXI.utils.string2hex(color);
      circle.beginFill(color);
      circle.drawCircle(0, 0, radius);
      circle.endFill();
      if (circle) {
        circle.x = x;
        circle.y = y;
        circle.alpha = this._paintOpacity / 255;
        this.addChild(circle);
      }
      return circle;
    }
  };
  var BitmapPIXI_default = BitmapPIXI;

  // src-www/js/rpg_core/Sprite.js
  var Sprite = class extends PIXI.Sprite {
    constructor(...args) {
      super();
      this.initialize(...args);
    }
    initialize(bitmap) {
      const texture = new PIXI.Texture(new PIXI.BaseTexture());
      PIXI.Sprite.call(this, texture);
      this.filters = null;
      this._bitmap = null;
      this._frame = new Rectangle_default();
      this._realFrame = new Rectangle_default();
      this._blendColor = [0, 0, 0, 0];
      this._colorTone = [0, 0, 0, 0];
      this._canvas = null;
      this._context = null;
      this._tintTexture = null;
      this._colorMatrixFilter = null;
      this.spriteId = Sprite._counter++;
      this.opaque = false;
      this.bitmap = bitmap;
    }
    /**
     * The image for the sprite.
     *
     * @property bitmap
     * @type Bitmap
     */
    get bitmap() {
      return this._bitmap;
    }
    set bitmap(value3) {
      if (this._bitmap !== value3) {
        this._bitmap = value3;
        if (value3) {
          this._refreshFrame = true;
          value3.addLoadListener(this._onBitmapLoad.bind(this));
        } else {
          this._refreshFrame = false;
          this.texture.frame = Rectangle_default.emptyRectangle;
        }
      }
    }
    /**
     * The width of the sprite without the scale.
     *
     * @property width
     * @type Number
     */
    get width() {
      return this._frame.width;
    }
    set width(value3) {
      this._frame.width = value3;
      this._refresh();
    }
    /**
     * The height of the sprite without the scale.
     *
     * @property height
     * @type Number
     */
    get height() {
      return this._frame.height;
    }
    set height(value3) {
      this._frame.height = value3;
      this._refresh();
    }
    /**
     * The opacity of the sprite (0 to 255).
     *
     * @property opacity
     * @type Number
     */
    get opacity() {
      return this.alpha * 255;
    }
    set opacity(value3) {
      this.alpha = value3.clamp(0, 255) / 255;
    }
    /**
     * Updates the sprite for each frame.
     *
     * @method update
     */
    update() {
      this.children.forEach((child) => {
        if (child.update) {
          child.update();
        }
      });
    }
    /**
     * Sets the x and y at once.
     *
     * @method move
     * @param {Number} x The x coordinate of the sprite
     * @param {Number} y The y coordinate of the sprite
     */
    move(x, y) {
      this.x = x;
      this.y = y;
    }
    /**
     * Sets the rectagle of the bitmap that the sprite displays.
     *
     * @method setFrame
     * @param {Number} x The x coordinate of the frame
     * @param {Number} y The y coordinate of the frame
     * @param {Number} width The width of the frame
     * @param {Number} height The height of the frame
     */
    setFrame(x, y, width, height) {
      this._refreshFrame = false;
      const frame = this._frame;
      if (x !== frame.x || y !== frame.y || width !== frame.width || height !== frame.height) {
        frame.x = x;
        frame.y = y;
        frame.width = width;
        frame.height = height;
        this._refresh();
      }
    }
    /**
     * Gets the blend color for the sprite.
     *
     * @method getBlendColor
     * @return {Array} The blend color [r, g, b, a]
     */
    getBlendColor() {
      return this._blendColor.clone();
    }
    /**
     * Sets the blend color for the sprite.
     *
     * @method setBlendColor
     * @param {Array} color The blend color [r, g, b, a]
     */
    setBlendColor(color) {
      if (!(color instanceof Array)) {
        throw new Error("Argument must be an array");
      }
      if (!this._blendColor.equals(color)) {
        this._blendColor = color.clone();
        this._refresh();
      }
    }
    /**
     * Gets the color tone for the sprite.
     *
     * @method getColorTone
     * @return {Array} The color tone [r, g, b, gray]
     */
    getColorTone() {
      return this._colorTone.clone();
    }
    /**
     * Sets the color tone for the sprite.
     *
     * @method setColorTone
     * @param {Array} tone The color tone [r, g, b, gray]
     */
    setColorTone(tone) {
      if (!(tone instanceof Array)) {
        throw new Error("Argument must be an array");
      }
      if (!this._colorTone.equals(tone)) {
        this._colorTone = tone.clone();
        this._refresh();
      }
    }
    /**
     * @method _onBitmapLoad
     * @private
     */
    _onBitmapLoad(bitmapLoaded) {
      if (bitmapLoaded === this._bitmap) {
        if (this._refreshFrame && this._bitmap) {
          this._refreshFrame = false;
          this._frame.width = this._bitmap.width;
          this._frame.height = this._bitmap.height;
        }
      }
      this._refresh();
    }
    /**
     * @method _refresh
     * @private
     */
    _refresh() {
      const frameX = Math.floor(this._frame.x);
      const frameY = Math.floor(this._frame.y);
      const frameW = Math.floor(this._frame.width);
      const frameH = Math.floor(this._frame.height);
      const bitmapW = this._bitmap ? this._bitmap.width : 0;
      const bitmapH = this._bitmap ? this._bitmap.height : 0;
      const realX = frameX.clamp(0, bitmapW);
      const realY = frameY.clamp(0, bitmapH);
      const realW = (frameW - realX + frameX).clamp(0, bitmapW - realX);
      const realH = (frameH - realY + frameY).clamp(0, bitmapH - realY);
      this._realFrame.x = realX;
      this._realFrame.y = realY;
      this._realFrame.width = realW;
      this._realFrame.height = realH;
      this.pivot.x = frameX - realX;
      this.pivot.y = frameY - realY;
      if (realW > 0 && realH > 0) {
        if (this._needsTint()) {
          if (Graphics_default.isWebGL()) {
            this._createTinterWebGL();
            this._executeTintWebGL();
          } else {
            this._createTinter(realW, realH);
            this._executeTint(realX, realY, realW, realH);
            this._tintTexture.update();
            this.texture.baseTexture = this._tintTexture;
            this.texture.frame = new Rectangle_default(0, 0, realW, realH);
          }
        } else {
          if (this._bitmap) {
            this.texture.baseTexture = this._bitmap.baseTexture;
          }
          this.texture.frame = this._realFrame;
          this._clearTintWebGL();
        }
      } else if (this._bitmap) {
        this.texture.frame = Rectangle_default.emptyRectangle;
      } else {
        this.texture.baseTexture.width = Math.max(
          this.texture.baseTexture.width,
          this._frame.x + this._frame.width
        );
        this.texture.baseTexture.height = Math.max(
          this.texture.baseTexture.height,
          this._frame.y + this._frame.height
        );
        this.texture.frame = this._frame;
      }
      this.texture._updateID++;
    }
    /**
     * @method _isInBitmapRect
     * @param {Number} x
     * @param {Number} y
     * @param {Number} w
     * @param {Number} h
     * @return {Boolean}
     * @private
     */
    _isInBitmapRect(x, y, w, h) {
      return this._bitmap && x + w > 0 && y + h > 0 && x < this._bitmap.width && y < this._bitmap.height;
    }
    /**
     * @method _needsTint
     * @return {Boolean}
     * @private
     */
    _needsTint() {
      const tone = this._colorTone;
      return tone[0] || tone[1] || tone[2] || tone[3] || this._blendColor[3] > 0;
    }
    /**
     * @method _createTinter
     * @param {Number} w
     * @param {Number} h
     * @private
     */
    _createTinter(w, h) {
      if (!this._canvas) {
        this._canvas = document.createElement("canvas");
        this._context = this._canvas.getContext("2d");
      }
      this._canvas.width = w;
      this._canvas.height = h;
      if (!this._tintTexture) {
        this._tintTexture = new PIXI.BaseTexture(this._canvas);
      }
      this._tintTexture.width = w;
      this._tintTexture.height = h;
      this._tintTexture.scaleMode = this._bitmap.baseTexture.scaleMode;
    }
    /**
     * @method _executeTint
     * @param {Number} x
     * @param {Number} y
     * @param {Number} w
     * @param {Number} h
     * @private
     */
    _executeTint(x, y, w, h) {
      const context = this._context;
      const tone = this._colorTone;
      const color = this._blendColor;
      console.info("[Sprite._executeTint] Tinting on canvas is slow.");
      context.globalCompositeOperation = "copy";
      context.drawImage(this._bitmap.canvas, x, y, w, h, 0, 0, w, h);
      if (tone[0] || tone[1] || tone[2] || tone[3]) {
        if (Graphics_default.canUseSaturationBlend()) {
          const gray = Math.max(0, tone[3]);
          context.globalCompositeOperation = "saturation";
          context.fillStyle = `rgba(255,255,255,${gray / 255})`;
          context.fillRect(0, 0, w, h);
        }
        const r1 = Math.max(0, tone[0]);
        const g1 = Math.max(0, tone[1]);
        const b1 = Math.max(0, tone[2]);
        context.globalCompositeOperation = "lighter";
        context.fillStyle = Utils_default.rgbToCssColor(r1, g1, b1);
        context.fillRect(0, 0, w, h);
        if (Graphics_default.canUseDifferenceBlend()) {
          context.globalCompositeOperation = "difference";
          context.fillStyle = "white";
          context.fillRect(0, 0, w, h);
          const r2 = Math.max(0, -tone[0]);
          const g2 = Math.max(0, -tone[1]);
          const b2 = Math.max(0, -tone[2]);
          context.globalCompositeOperation = "lighter";
          context.fillStyle = Utils_default.rgbToCssColor(r2, g2, b2);
          context.fillRect(0, 0, w, h);
          context.globalCompositeOperation = "difference";
          context.fillStyle = "white";
          context.fillRect(0, 0, w, h);
        }
      }
      const r3 = Math.max(0, color[0]);
      const g3 = Math.max(0, color[1]);
      const b3 = Math.max(0, color[2]);
      const a3 = Math.max(0, color[3]);
      context.globalCompositeOperation = "source-atop";
      context.fillStyle = Utils_default.rgbToCssColor(r3, g3, b3);
      context.globalAlpha = a3 / 255;
      context.fillRect(0, 0, w, h);
      context.globalCompositeOperation = "destination-in";
      context.globalAlpha = 1;
      context.drawImage(this._bitmap.canvas, x, y, w, h, 0, 0, w, h);
    }
    /**
     * @method _createTinterWebGL
     * @private
     */
    _createTinterWebGL() {
      if (!this.filters) {
        this.filters = [];
      }
      if (!this._colorMatrixFilter) {
        this._colorMatrixFilter = new PIXI.filters.ColorMatrixFilter();
        this.filters.push(this._colorMatrixFilter);
      }
      this._colorMatrixFilter.enabled = true;
    }
    /**
     * @method _executeTintWebGL
     * @private
     */
    _executeTintWebGL() {
      const color = this._blendColor;
      const red = color[0] / 255;
      const green = color[1] / 255;
      const blue = color[2] / 255;
      const opacity = color[3] / 255;
      this._colorMatrixFilter.matrix = [
        red / 64,
        0,
        0,
        0,
        red,
        0,
        green / 64,
        0,
        0,
        green,
        0,
        0,
        blue / 64,
        0,
        blue,
        0,
        0,
        0,
        1,
        0
      ];
      this._colorMatrixFilter.alpha = opacity;
    }
    /**
     * @method _clearTintWebGL
     * @private
     */
    _clearTintWebGL() {
      if (this._colorMatrixFilter) {
        this._colorMatrixFilter.enabled = false;
      }
    }
    /**
     * @method _renderCanvas
     * @param {Object} renderer
     * @private
     */
    _renderCanvas(renderer) {
      if (this.bitmap) {
        this.bitmap.touch();
      }
      if (this.bitmap && !this.bitmap.isReady()) {
        return;
      }
      if (this.texture.frame.width > 0 && this.texture.frame.height > 0) {
        this._renderCanvas_PIXI(renderer);
      }
    }
    /**
     * @method _render
     * @param {Object} renderer
     * @private
     */
    _render(renderer) {
      if (this.bitmap) {
        this.bitmap.touch();
      }
      if (this.bitmap && !this.bitmap.isReady()) {
        return;
      }
      if (this.texture.frame.width > 0 && this.texture.frame.height > 0) {
        if (this._bitmap) {
          this._bitmap.checkDirty();
        }
        this._render_PIXI(renderer);
      }
    }
    // The important members from Pixi.js
    /**
     * The visibility of the sprite.
     *
     * @property visible
     * @type Boolean
     */
    /**
     * The x coordinate of the sprite.
     *
     * @property x
     * @type Number
     */
    /**
     * The y coordinate of the sprite.
     *
     * @property y
     * @type Number
     */
    /**
     * The origin point of the sprite. (0,0) to (1,1).
     *
     * @property anchor
     * @type Point
     */
    /**
     * The scale factor of the sprite.
     *
     * @property scale
     * @type Point
     */
    /**
     * The rotation of the sprite in radians.
     *
     * @property rotation
     * @type Number
     */
    /**
     * The blend mode to be applied to the sprite.
     *
     * @property blendMode
     * @type Number
     */
    /**
     * Sets the filters for the sprite.
     *
     * @property filters
     * @type Array
     */
    /**
     * [read-only] The array of children of the sprite.
     *
     * @property children
     * @type Array
     */
    /**
     * [read-only] The object that contains the sprite.
     *
     * @property parent
     * @type Object
     */
    /**
     * Adds a child to the container.
     *
     * @method addChild
     * @param {Object} child The child to add
     * @return {Object} The child that was added
     */
    /**
     * Adds a child to the container at a specified index.
     *
     * @method addChildAt
     * @param {Object} child The child to add
     * @param {Number} index The index to place the child in
     * @return {Object} The child that was added
     */
    /**
     * Removes a child from the container.
     *
     * @method removeChild
     * @param {Object} child The child to remove
     * @return {Object} The child that was removed
     */
    /**
     * Removes a child from the specified index position.
     *
     * @method removeChildAt
     * @param {Number} index The index to get the child from
     * @return {Object} The child that was removed
     */
  };
  Sprite.voidFilter = new PIXI.filters.AlphaFilter();
  Sprite._counter = 0;
  Sprite.prototype._renderCanvas_PIXI = PIXI.Sprite.prototype._renderCanvas;
  Sprite.prototype._render_PIXI = PIXI.Sprite.prototype._render;
  var Sprite_default = Sprite;

  // src-www/js/rpg_core/Tilemap.js
  var Tilemap = class extends PIXI.Container {
    constructor(...args) {
      super(...args);
      this.initialize(...args);
    }
    initialize() {
      PIXI.Container.call(this);
      this._margin = 20;
      this._width = Graphics_default.width + this._margin * 2;
      this._height = Graphics_default.height + this._margin * 2;
      this._tileWidth = 48;
      this._tileHeight = 48;
      this._mapWidth = 0;
      this._mapHeight = 0;
      this._mapData = null;
      this._layerWidth = 0;
      this._layerHeight = 0;
      this._lastTiles = [];
      this.bitmaps = [];
      this.origin = new Point_default();
      this.flags = [];
      this.animationCount = 0;
      this.horizontalWrap = false;
      this.verticalWrap = false;
      this._createLayers();
      this.refresh();
    }
    /**
     * The width of the screen in pixels.
     *
     * @property width
     * @type Number
     */
    get width() {
      return this._width;
    }
    set width(value3) {
      if (this._width !== value3) {
        this._width = value3;
        this._createLayers();
      }
    }
    /**
     * The height of the screen in pixels.
     *
     * @property height
     * @type Number
     */
    get height() {
      return this._height;
    }
    set height(value3) {
      if (this._height !== value3) {
        this._height = value3;
        this._createLayers();
      }
    }
    /**
     * The width of a tile in pixels.
     *
     * @property tileWidth
     * @type Number
     */
    get tileWidth() {
      return this._tileWidth;
    }
    set tileWidth(value3) {
      if (this._tileWidth !== value3) {
        this._tileWidth = value3;
        this._createLayers();
      }
    }
    /**
     * The height of a tile in pixels.
     *
     * @property tileHeight
     * @type Number
     */
    get tileHeight() {
      return this._tileHeight;
    }
    set tileHeight(value3) {
      if (this._tileHeight !== value3) {
        this._tileHeight = value3;
        this._createLayers();
      }
    }
    /**
     * Sets the tilemap data.
     *
     * @method setData
     * @param {Number} width The width of the map in number of tiles
     * @param {Number} height The height of the map in number of tiles
     * @param {Array} data The one dimensional array for the map data
     */
    setData(width, height, data) {
      this._mapWidth = width;
      this._mapHeight = height;
      this._mapData = data;
    }
    /**
     * Checks whether the tileset is ready to render.
     *
     * @method isReady
     * @type Boolean
     * @return {Boolean} True if the tilemap is ready
     */
    isReady() {
      for (let i = 0; i < this.bitmaps.length; i++) {
        if (this.bitmaps[i] && !this.bitmaps[i].isReady()) {
          return false;
        }
      }
      return true;
    }
    /**
     * Updates the tilemap for each frame.
     *
     * @method update
     */
    update() {
      this.animationCount++;
      this.animationFrame = Math.floor(this.animationCount / 30);
      this.children.forEach((child) => {
        if (child.update) {
          child.update();
        }
      });
      for (let i = 0; i < this.bitmaps.length; i++) {
        if (this.bitmaps[i]) {
          this.bitmaps[i].touch();
        }
      }
    }
    /**
     * Forces to repaint the entire tilemap.
     *
     * @method refresh
     */
    refresh() {
      this._lastTiles.length = 0;
    }
    /**
     * Forces to refresh the tileset
     *
     * @method refresh
     */
    refreshTileset() {
    }
    /**
     * @method updateTransform
     * @private
     */
    updateTransform() {
      const ox = Math.floor(this.origin.x);
      const oy = Math.floor(this.origin.y);
      const startX = Math.floor((ox - this._margin) / this._tileWidth);
      const startY = Math.floor((oy - this._margin) / this._tileHeight);
      this._updateLayerPositions(startX, startY);
      if (this._needsRepaint || this._lastAnimationFrame !== this.animationFrame || this._lastStartX !== startX || this._lastStartY !== startY) {
        this._frameUpdated = this._lastAnimationFrame !== this.animationFrame;
        this._lastAnimationFrame = this.animationFrame;
        this._lastStartX = startX;
        this._lastStartY = startY;
        this._paintAllTiles(startX, startY);
        this._needsRepaint = false;
      }
      this._sortChildren();
      super.updateTransform();
    }
    /**
     * @method _createLayers
     * @private
     */
    _createLayers() {
      const width = this._width;
      const height = this._height;
      const margin = this._margin;
      const tileCols = Math.ceil(width / this._tileWidth) + 1;
      const tileRows = Math.ceil(height / this._tileHeight) + 1;
      const layerWidth = tileCols * this._tileWidth;
      const layerHeight = tileRows * this._tileHeight;
      this._lowerBitmap = new Bitmap_default(layerWidth, layerHeight);
      this._upperBitmap = new Bitmap_default(layerWidth, layerHeight);
      this._layerWidth = layerWidth;
      this._layerHeight = layerHeight;
      this._lowerLayer = new Sprite_default();
      this._lowerLayer.move(-margin, -margin, width, height);
      this._lowerLayer.z = 0;
      this._upperLayer = new Sprite_default();
      this._upperLayer.move(-margin, -margin, width, height);
      this._upperLayer.z = 4;
      for (let i = 0; i < 4; i++) {
        this._lowerLayer.addChild(new Sprite_default(this._lowerBitmap));
        this._upperLayer.addChild(new Sprite_default(this._upperBitmap));
      }
      this.addChild(this._lowerLayer);
      this.addChild(this._upperLayer);
    }
    /**
     * @method _updateLayerPositions
     * @param {Number} startX
     * @param {Number} startY
     * @private
     */
    _updateLayerPositions(startX, startY) {
      const m = this._margin;
      const ox = Math.floor(this.origin.x);
      const oy = Math.floor(this.origin.y);
      const x2 = (ox - m).mod(this._layerWidth);
      const y2 = (oy - m).mod(this._layerHeight);
      const w1 = this._layerWidth - x2;
      const h1 = this._layerHeight - y2;
      const w2 = this._width - w1;
      const h2 = this._height - h1;
      for (let i = 0; i < 2; i++) {
        let children;
        if (i === 0) {
          children = this._lowerLayer.children;
        } else {
          children = this._upperLayer.children;
        }
        children[0].move(0, 0, w1, h1);
        children[0].setFrame(x2, y2, w1, h1);
        children[1].move(w1, 0, w2, h1);
        children[1].setFrame(0, y2, w2, h1);
        children[2].move(0, h1, w1, h2);
        children[2].setFrame(x2, 0, w1, h2);
        children[3].move(w1, h1, w2, h2);
        children[3].setFrame(0, 0, w2, h2);
      }
    }
    /**
     * @method _paintAllTiles
     * @param {Number} startX
     * @param {Number} startY
     * @private
     */
    _paintAllTiles(startX, startY) {
      const tileCols = Math.ceil(this._width / this._tileWidth) + 1;
      const tileRows = Math.ceil(this._height / this._tileHeight) + 1;
      for (let y = 0; y < tileRows; y++) {
        for (let x = 0; x < tileCols; x++) {
          this._paintTiles(startX, startY, x, y);
        }
      }
    }
    /**
     * @method _paintTiles
     * @param {Number} startX
     * @param {Number} startY
     * @param {Number} x
     * @param {Number} y
     * @private
     */
    _paintTiles(startX, startY, x, y) {
      const tableEdgeVirtualId = 1e4;
      const mx = startX + x;
      const my = startY + y;
      const dx = (mx * this._tileWidth).mod(this._layerWidth);
      const dy = (my * this._tileHeight).mod(this._layerHeight);
      const lx = dx / this._tileWidth;
      const ly = dy / this._tileHeight;
      const tileId0 = this._readMapData(mx, my, 0);
      const tileId1 = this._readMapData(mx, my, 1);
      const tileId2 = this._readMapData(mx, my, 2);
      const tileId3 = this._readMapData(mx, my, 3);
      const shadowBits = this._readMapData(mx, my, 4);
      const upperTileId1 = this._readMapData(mx, my - 1, 1);
      const lowerTiles = [];
      const upperTiles = [];
      if (this._isHigherTile(tileId0)) {
        upperTiles.push(tileId0);
      } else {
        lowerTiles.push(tileId0);
      }
      if (this._isHigherTile(tileId1)) {
        upperTiles.push(tileId1);
      } else {
        lowerTiles.push(tileId1);
      }
      lowerTiles.push(-shadowBits);
      if (this._isTableTile(upperTileId1) && !this._isTableTile(tileId1)) {
        if (!Tilemap.isShadowingTile(tileId0)) {
          lowerTiles.push(tableEdgeVirtualId + upperTileId1);
        }
      }
      if (this._isOverpassPosition(mx, my)) {
        upperTiles.push(tileId2);
        upperTiles.push(tileId3);
      } else {
        if (this._isHigherTile(tileId2)) {
          upperTiles.push(tileId2);
        } else {
          lowerTiles.push(tileId2);
        }
        if (this._isHigherTile(tileId3)) {
          upperTiles.push(tileId3);
        } else {
          lowerTiles.push(tileId3);
        }
      }
      const lastLowerTiles = this._readLastTiles(0, lx, ly);
      if (!lowerTiles.equals(lastLowerTiles) || Tilemap.isTileA1(tileId0) && this._frameUpdated) {
        this._lowerBitmap.clearRect(dx, dy, this._tileWidth, this._tileHeight);
        for (const lowerTileId of lowerTiles) {
          if (lowerTileId < 0) {
            this._drawShadow(this._lowerBitmap, shadowBits, dx, dy);
          } else if (lowerTileId >= tableEdgeVirtualId) {
            this._drawTableEdge(this._lowerBitmap, upperTileId1, dx, dy);
          } else {
            this._drawTile(this._lowerBitmap, lowerTileId, dx, dy);
          }
        }
        this._writeLastTiles(0, lx, ly, lowerTiles);
      }
      const lastUpperTiles = this._readLastTiles(1, lx, ly);
      if (!upperTiles.equals(lastUpperTiles)) {
        this._upperBitmap.clearRect(dx, dy, this._tileWidth, this._tileHeight);
        for (let j = 0; j < upperTiles.length; j++) {
          this._drawTile(this._upperBitmap, upperTiles[j], dx, dy);
        }
        this._writeLastTiles(1, lx, ly, upperTiles);
      }
    }
    /**
     * @method _readLastTiles
     * @param {Number} i
     * @param {Number} x
     * @param {Number} y
     * @private
     */
    _readLastTiles(i, x, y) {
      const array1 = this._lastTiles[i];
      if (array1) {
        const array2 = array1[y];
        if (array2) {
          const tiles = array2[x];
          if (tiles) {
            return tiles;
          }
        }
      }
      return [];
    }
    /**
     * @method _writeLastTiles
     * @param {Number} i
     * @param {Number} x
     * @param {Number} y
     * @param {Array} tiles
     * @private
     */
    _writeLastTiles(i, x, y, tiles) {
      let array1 = this._lastTiles[i];
      if (!array1) {
        array1 = this._lastTiles[i] = [];
      }
      let array2 = array1[y];
      if (!array2) {
        array2 = array1[y] = [];
      }
      array2[x] = tiles;
    }
    /**
     * @method _drawTile
     * @param {Bitmap} bitmap
     * @param {Number} tileId
     * @param {Number} dx
     * @param {Number} dy
     * @private
     */
    _drawTile(bitmap, tileId, dx, dy) {
      if (Tilemap.isVisibleTile(tileId)) {
        if (Tilemap.isAutotile(tileId)) {
          this._drawAutotile(bitmap, tileId, dx, dy);
        } else {
          this._drawNormalTile(bitmap, tileId, dx, dy);
        }
      }
    }
    /**
     * @method _drawNormalTile
     * @param {Bitmap} bitmap
     * @param {Number} tileId
     * @param {Number} dx
     * @param {Number} dy
     * @private
     */
    _drawNormalTile(bitmap, tileId, dx, dy) {
      let setNumber = 0;
      if (Tilemap.isTileA5(tileId)) {
        setNumber = 4;
      } else {
        setNumber = 5 + Math.floor(tileId / 256);
      }
      const w = this._tileWidth;
      const h = this._tileHeight;
      const sx = (Math.floor(tileId / 128) % 2 * 8 + tileId % 8) * w;
      const sy = Math.floor(tileId % 256 / 8) % 16 * h;
      const source = this.bitmaps[setNumber];
      if (source) {
        bitmap.bltImage(source, sx, sy, w, h, dx, dy, w, h);
      }
    }
    /**
     * @method _drawAutotile
     * @param {Bitmap} bitmap
     * @param {Number} tileId
     * @param {Number} dx
     * @param {Number} dy
     * @private
     */
    _drawAutotile(bitmap, tileId, dx, dy) {
      let autotileTable = Tilemap.FLOOR_AUTOTILE_TABLE;
      const kind = Tilemap.getAutotileKind(tileId);
      const shape = Tilemap.getAutotileShape(tileId);
      const tx = kind % 8;
      const ty = Math.floor(kind / 8);
      let bx = 0;
      let by = 0;
      let setNumber = 0;
      let isTable = false;
      if (Tilemap.isTileA1(tileId)) {
        const waterSurfaceIndex = [0, 1, 2, 1][this.animationFrame % 4];
        setNumber = 0;
        if (kind === 0) {
          bx = waterSurfaceIndex * 2;
          by = 0;
        } else if (kind === 1) {
          bx = waterSurfaceIndex * 2;
          by = 3;
        } else if (kind === 2) {
          bx = 6;
          by = 0;
        } else if (kind === 3) {
          bx = 6;
          by = 3;
        } else {
          bx = Math.floor(tx / 4) * 8;
          by = ty * 6 + Math.floor(tx / 2) % 2 * 3;
          if (kind % 2 === 0) {
            bx += waterSurfaceIndex * 2;
          } else {
            bx += 6;
            autotileTable = Tilemap.WATERFALL_AUTOTILE_TABLE;
            by += this.animationFrame % 3;
          }
        }
      } else if (Tilemap.isTileA2(tileId)) {
        setNumber = 1;
        bx = tx * 2;
        by = (ty - 2) * 3;
        isTable = this._isTableTile(tileId);
      } else if (Tilemap.isTileA3(tileId)) {
        setNumber = 2;
        bx = tx * 2;
        by = (ty - 6) * 2;
        autotileTable = Tilemap.WALL_AUTOTILE_TABLE;
      } else if (Tilemap.isTileA4(tileId)) {
        setNumber = 3;
        bx = tx * 2;
        by = Math.floor((ty - 10) * 2.5 + (ty % 2 === 1 ? 0.5 : 0));
        if (ty % 2 === 1) {
          autotileTable = Tilemap.WALL_AUTOTILE_TABLE;
        }
      }
      const table = autotileTable[shape];
      const source = this.bitmaps[setNumber];
      if (table && source) {
        const w1 = this._tileWidth / 2;
        const h1 = this._tileHeight / 2;
        for (let i = 0; i < 4; i++) {
          const qsx = table[i][0];
          const qsy = table[i][1];
          const sx1 = (bx * 2 + qsx) * w1;
          const sy1 = (by * 2 + qsy) * h1;
          const dx1 = dx + i % 2 * w1;
          let dy1 = dy + Math.floor(i / 2) * h1;
          if (isTable && (qsy === 1 || qsy === 5)) {
            let qsx2 = qsx;
            let qsy2 = 3;
            if (qsy === 1) {
              qsx2 = [0, 3, 2, 1][qsx];
            }
            const sx2 = (bx * 2 + qsx2) * w1;
            const sy2 = (by * 2 + qsy2) * h1;
            bitmap.bltImage(source, sx2, sy2, w1, h1, dx1, dy1, w1, h1);
            dy1 += h1 / 2;
            bitmap.bltImage(source, sx1, sy1, w1, h1 / 2, dx1, dy1, w1, h1 / 2);
          } else {
            bitmap.bltImage(source, sx1, sy1, w1, h1, dx1, dy1, w1, h1);
          }
        }
      }
    }
    /**
     * @method _drawTableEdge
     * @param {Bitmap} bitmap
     * @param {Number} tileId
     * @param {Number} dx
     * @param {Number} dy
     * @private
     */
    _drawTableEdge(bitmap, tileId, dx, dy) {
      if (Tilemap.isTileA2(tileId)) {
        const autotileTable = Tilemap.FLOOR_AUTOTILE_TABLE;
        const kind = Tilemap.getAutotileKind(tileId);
        const shape = Tilemap.getAutotileShape(tileId);
        const tx = kind % 8;
        const ty = Math.floor(kind / 8);
        const setNumber = 1;
        const bx = tx * 2;
        const by = (ty - 2) * 3;
        const table = autotileTable[shape];
        if (table) {
          const source = this.bitmaps[setNumber];
          const w1 = this._tileWidth / 2;
          const h1 = this._tileHeight / 2;
          for (let i = 0; i < 2; i++) {
            const qsx = table[2 + i][0];
            const qsy = table[2 + i][1];
            const sx1 = (bx * 2 + qsx) * w1;
            const sy1 = (by * 2 + qsy) * h1 + h1 / 2;
            const dx1 = dx + i % 2 * w1;
            const dy1 = dy + Math.floor(i / 2) * h1;
            bitmap.bltImage(source, sx1, sy1, w1, h1 / 2, dx1, dy1, w1, h1 / 2);
          }
        }
      }
    }
    /**
     * @method _drawShadow
     * @param {Bitmap} bitmap
     * @param {Number} shadowBits
     * @param {Number} dx
     * @param {Number} dy
     * @private
     */
    _drawShadow(bitmap, shadowBits, dx, dy) {
      if (shadowBits & 15) {
        const w1 = this._tileWidth / 2;
        const h1 = this._tileHeight / 2;
        const color = "rgba(0,0,0,0.5)";
        for (let i = 0; i < 4; i++) {
          if (shadowBits & 1 << i) {
            const dx1 = dx + i % 2 * w1;
            const dy1 = dy + Math.floor(i / 2) * h1;
            bitmap.fillRect(dx1, dy1, w1, h1, color);
          }
        }
      }
    }
    /**
     * @method _readMapData
     * @param {Number} x
     * @param {Number} y
     * @param {Number} z
     * @return {Number}
     * @private
     */
    _readMapData(x, y, z) {
      if (this._mapData) {
        const width = this._mapWidth;
        const height = this._mapHeight;
        if (this.horizontalWrap) {
          x = x.mod(width);
        }
        if (this.verticalWrap) {
          y = y.mod(height);
        }
        if (x >= 0 && x < width && y >= 0 && y < height) {
          return this._mapData[(z * height + y) * width + x] || 0;
        } else {
          return 0;
        }
      } else {
        return 0;
      }
    }
    /**
     * @method _isHigherTile
     * @param {Number} tileId
     * @return {Boolean}
     * @private
     */
    _isHigherTile(tileId) {
      return this.flags[tileId] & 16;
    }
    /**
     * @method _isTableTile
     * @param {Number} tileId
     * @return {Boolean}
     * @private
     */
    _isTableTile(tileId) {
      return Tilemap.isTileA2(tileId) && this.flags[tileId] & 128;
    }
    /**
     * @method _isOverpassPosition
     * @param {Number} mx
     * @param {Number} my
     * @return {Boolean}
     * @private
     */
    _isOverpassPosition(mx, my) {
      return false;
    }
    /**
     * @method _sortChildren
     * @private
     */
    _sortChildren() {
      this.children.sort(this._compareChildOrder.bind(this));
    }
    /**
     * @method _compareChildOrder
     * @param {Object} a
     * @param {Object} b
     * @private
     */
    _compareChildOrder(a2, b2) {
      if (a2.z === b2.z) {
        if (a2.y === b2.y) {
          return a2.spriteId - b2.spriteId;
        }
        return a2.y - b2.y;
      }
      return a2.z - b2.z;
    }
    static isVisibleTile(tileId) {
      return tileId > 0 && tileId < this.TILE_ID_MAX;
    }
    static isAutotile(tileId) {
      return tileId >= this.TILE_ID_A1;
    }
    static getAutotileKind(tileId) {
      return Math.floor((tileId - this.TILE_ID_A1) / 48);
    }
    static getAutotileShape(tileId) {
      return (tileId - this.TILE_ID_A1) % 48;
    }
    static makeAutotileId(kind, shape) {
      return this.TILE_ID_A1 + kind * 48 + shape;
    }
    static isSameKindTile(tileID1, tileID2) {
      if (this.isAutotile(tileID1) && this.isAutotile(tileID2)) {
        return this.getAutotileKind(tileID1) === this.getAutotileKind(tileID2);
      } else {
        return tileID1 === tileID2;
      }
    }
    static isTileA1(tileId) {
      return tileId >= this.TILE_ID_A1 && tileId < this.TILE_ID_A2;
    }
    static isTileA2(tileId) {
      return tileId >= this.TILE_ID_A2 && tileId < this.TILE_ID_A3;
    }
    static isTileA3(tileId) {
      return tileId >= this.TILE_ID_A3 && tileId < this.TILE_ID_A4;
    }
    static isTileA4(tileId) {
      return tileId >= this.TILE_ID_A4 && tileId < this.TILE_ID_MAX;
    }
    static isTileA5(tileId) {
      return tileId >= this.TILE_ID_A5 && tileId < this.TILE_ID_A1;
    }
    static isWaterTile(tileId) {
      if (this.isTileA1(tileId)) {
        return !(tileId >= this.TILE_ID_A1 + 96 && tileId < this.TILE_ID_A1 + 192);
      } else {
        return false;
      }
    }
    static isWaterfallTile(tileId) {
      if (tileId >= this.TILE_ID_A1 + 192 && tileId < this.TILE_ID_A2) {
        return this.getAutotileKind(tileId) % 2 === 1;
      } else {
        return false;
      }
    }
    static isGroundTile(tileId) {
      return this.isTileA1(tileId) || this.isTileA2(tileId) || this.isTileA5(tileId);
    }
    static isShadowingTile(tileId) {
      return this.isTileA3(tileId) || this.isTileA4(tileId);
    }
    static isRoofTile(tileId) {
      return this.isTileA3(tileId) && this.getAutotileKind(tileId) % 16 < 8;
    }
    static isWallTopTile(tileId) {
      return this.isTileA4(tileId) && this.getAutotileKind(tileId) % 16 < 8;
    }
    static isWallSideTile(tileId) {
      return (this.isTileA3(tileId) || this.isTileA4(tileId)) && this.getAutotileKind(tileId) % 16 >= 8;
    }
    static isWallTile(tileId) {
      return this.isWallTopTile(tileId) || this.isWallSideTile(tileId);
    }
    static isFloorTypeAutotile(tileId) {
      return this.isTileA1(tileId) && !this.isWaterfallTile(tileId) || this.isTileA2(tileId) || this.isWallTopTile(tileId);
    }
    static isWallTypeAutotile(tileId) {
      return this.isRoofTile(tileId) || this.isWallSideTile(tileId);
    }
    static isWaterfallTypeAutotile(tileId) {
      return this.isWaterfallTile(tileId);
    }
  };
  Tilemap.TILE_ID_B = 0;
  Tilemap.TILE_ID_C = 256;
  Tilemap.TILE_ID_D = 512;
  Tilemap.TILE_ID_E = 768;
  Tilemap.TILE_ID_A5 = 1536;
  Tilemap.TILE_ID_A1 = 2048;
  Tilemap.TILE_ID_A2 = 2816;
  Tilemap.TILE_ID_A3 = 4352;
  Tilemap.TILE_ID_A4 = 5888;
  Tilemap.TILE_ID_MAX = 8192;
  Tilemap.FLOOR_AUTOTILE_TABLE = [
    [
      [2, 4],
      [1, 4],
      [2, 3],
      [1, 3]
    ],
    [
      [2, 0],
      [1, 4],
      [2, 3],
      [1, 3]
    ],
    [
      [2, 4],
      [3, 0],
      [2, 3],
      [1, 3]
    ],
    [
      [2, 0],
      [3, 0],
      [2, 3],
      [1, 3]
    ],
    [
      [2, 4],
      [1, 4],
      [2, 3],
      [3, 1]
    ],
    [
      [2, 0],
      [1, 4],
      [2, 3],
      [3, 1]
    ],
    [
      [2, 4],
      [3, 0],
      [2, 3],
      [3, 1]
    ],
    [
      [2, 0],
      [3, 0],
      [2, 3],
      [3, 1]
    ],
    [
      [2, 4],
      [1, 4],
      [2, 1],
      [1, 3]
    ],
    [
      [2, 0],
      [1, 4],
      [2, 1],
      [1, 3]
    ],
    [
      [2, 4],
      [3, 0],
      [2, 1],
      [1, 3]
    ],
    [
      [2, 0],
      [3, 0],
      [2, 1],
      [1, 3]
    ],
    [
      [2, 4],
      [1, 4],
      [2, 1],
      [3, 1]
    ],
    [
      [2, 0],
      [1, 4],
      [2, 1],
      [3, 1]
    ],
    [
      [2, 4],
      [3, 0],
      [2, 1],
      [3, 1]
    ],
    [
      [2, 0],
      [3, 0],
      [2, 1],
      [3, 1]
    ],
    [
      [0, 4],
      [1, 4],
      [0, 3],
      [1, 3]
    ],
    [
      [0, 4],
      [3, 0],
      [0, 3],
      [1, 3]
    ],
    [
      [0, 4],
      [1, 4],
      [0, 3],
      [3, 1]
    ],
    [
      [0, 4],
      [3, 0],
      [0, 3],
      [3, 1]
    ],
    [
      [2, 2],
      [1, 2],
      [2, 3],
      [1, 3]
    ],
    [
      [2, 2],
      [1, 2],
      [2, 3],
      [3, 1]
    ],
    [
      [2, 2],
      [1, 2],
      [2, 1],
      [1, 3]
    ],
    [
      [2, 2],
      [1, 2],
      [2, 1],
      [3, 1]
    ],
    [
      [2, 4],
      [3, 4],
      [2, 3],
      [3, 3]
    ],
    [
      [2, 4],
      [3, 4],
      [2, 1],
      [3, 3]
    ],
    [
      [2, 0],
      [3, 4],
      [2, 3],
      [3, 3]
    ],
    [
      [2, 0],
      [3, 4],
      [2, 1],
      [3, 3]
    ],
    [
      [2, 4],
      [1, 4],
      [2, 5],
      [1, 5]
    ],
    [
      [2, 0],
      [1, 4],
      [2, 5],
      [1, 5]
    ],
    [
      [2, 4],
      [3, 0],
      [2, 5],
      [1, 5]
    ],
    [
      [2, 0],
      [3, 0],
      [2, 5],
      [1, 5]
    ],
    [
      [0, 4],
      [3, 4],
      [0, 3],
      [3, 3]
    ],
    [
      [2, 2],
      [1, 2],
      [2, 5],
      [1, 5]
    ],
    [
      [0, 2],
      [1, 2],
      [0, 3],
      [1, 3]
    ],
    [
      [0, 2],
      [1, 2],
      [0, 3],
      [3, 1]
    ],
    [
      [2, 2],
      [3, 2],
      [2, 3],
      [3, 3]
    ],
    [
      [2, 2],
      [3, 2],
      [2, 1],
      [3, 3]
    ],
    [
      [2, 4],
      [3, 4],
      [2, 5],
      [3, 5]
    ],
    [
      [2, 0],
      [3, 4],
      [2, 5],
      [3, 5]
    ],
    [
      [0, 4],
      [1, 4],
      [0, 5],
      [1, 5]
    ],
    [
      [0, 4],
      [3, 0],
      [0, 5],
      [1, 5]
    ],
    [
      [0, 2],
      [3, 2],
      [0, 3],
      [3, 3]
    ],
    [
      [0, 2],
      [1, 2],
      [0, 5],
      [1, 5]
    ],
    [
      [0, 4],
      [3, 4],
      [0, 5],
      [3, 5]
    ],
    [
      [2, 2],
      [3, 2],
      [2, 5],
      [3, 5]
    ],
    [
      [0, 2],
      [3, 2],
      [0, 5],
      [3, 5]
    ],
    [
      [0, 0],
      [1, 0],
      [0, 1],
      [1, 1]
    ]
  ];
  Tilemap.WALL_AUTOTILE_TABLE = [
    [
      [2, 2],
      [1, 2],
      [2, 1],
      [1, 1]
    ],
    [
      [0, 2],
      [1, 2],
      [0, 1],
      [1, 1]
    ],
    [
      [2, 0],
      [1, 0],
      [2, 1],
      [1, 1]
    ],
    [
      [0, 0],
      [1, 0],
      [0, 1],
      [1, 1]
    ],
    [
      [2, 2],
      [3, 2],
      [2, 1],
      [3, 1]
    ],
    [
      [0, 2],
      [3, 2],
      [0, 1],
      [3, 1]
    ],
    [
      [2, 0],
      [3, 0],
      [2, 1],
      [3, 1]
    ],
    [
      [0, 0],
      [3, 0],
      [0, 1],
      [3, 1]
    ],
    [
      [2, 2],
      [1, 2],
      [2, 3],
      [1, 3]
    ],
    [
      [0, 2],
      [1, 2],
      [0, 3],
      [1, 3]
    ],
    [
      [2, 0],
      [1, 0],
      [2, 3],
      [1, 3]
    ],
    [
      [0, 0],
      [1, 0],
      [0, 3],
      [1, 3]
    ],
    [
      [2, 2],
      [3, 2],
      [2, 3],
      [3, 3]
    ],
    [
      [0, 2],
      [3, 2],
      [0, 3],
      [3, 3]
    ],
    [
      [2, 0],
      [3, 0],
      [2, 3],
      [3, 3]
    ],
    [
      [0, 0],
      [3, 0],
      [0, 3],
      [3, 3]
    ]
  ];
  Tilemap.WATERFALL_AUTOTILE_TABLE = [
    [
      [2, 0],
      [1, 0],
      [2, 1],
      [1, 1]
    ],
    [
      [0, 0],
      [1, 0],
      [0, 1],
      [1, 1]
    ],
    [
      [2, 0],
      [3, 0],
      [2, 1],
      [3, 1]
    ],
    [
      [0, 0],
      [3, 0],
      [0, 1],
      [3, 1]
    ]
  ];
  var Tilemap_default = Tilemap;

  // src-www/js/rpg_core/ShaderTilemap.js
  var ShaderTilemap = class extends Tilemap_default {
    constructor(...args) {
      super(...args);
      this.roundPixels = true;
    }
    /**
     * Uploads animation state in renderer
     *
     * @method _hackRenderer
     * @private
     */
    _hackRenderer(renderer) {
      let af = this.animationFrame % 4;
      if (af == 3)
        af = 1;
      renderer.plugins.tilemap.tileAnim[0] = af * this._tileWidth;
      renderer.plugins.tilemap.tileAnim[1] = this.animationFrame % 3 * this._tileHeight;
      return renderer;
    }
    /**
     * PIXI render method
     *
     * @method renderCanvas
     * @param {Object} pixi renderer
     */
    renderCanvas(renderer) {
      this._hackRenderer(renderer);
      PIXI.Container.prototype.renderCanvas.call(this, renderer);
    }
    /**
     * PIXI render method
     *
     * @method render
     * @param {Object} pixi renderer
     */
    render(renderer) {
      this._hackRenderer(renderer);
      PIXI.Container.prototype.render.call(this, renderer);
    }
    /**
     * Forces to repaint the entire tilemap AND update bitmaps list if needed
     *
     * @method refresh
     */
    refresh() {
      if (this._lastBitmapLength !== this.bitmaps.length) {
        this._lastBitmapLength = this.bitmaps.length;
        this.refreshTileset();
      }
      this._needsRepaint = true;
    }
    /**
     * Call after you update tileset
     *
     * @method updateBitmaps
     */
    refreshTileset() {
      const bitmaps = this.bitmaps.map(
        (x) => x._baseTexture ? new PIXI.Texture(x._baseTexture) : x
      );
      this.lowerLayer.setBitmaps(bitmaps);
      this.upperLayer.setBitmaps(bitmaps);
    }
    /**
     * @method updateTransform
     * @private
     */
    updateTransform() {
      const ox = Math.floor(this.origin.x);
      const oy = Math.floor(this.origin.y);
      const startX = Math.floor((ox - this._margin) / this._tileWidth);
      const startY = Math.floor((oy - this._margin) / this._tileHeight);
      this._updateLayerPositions(startX, startY);
      if (this._needsRepaint || this._lastStartX !== startX || this._lastStartY !== startY) {
        this._lastStartX = startX;
        this._lastStartY = startY;
        this._paintAllTiles(startX, startY);
        this._needsRepaint = false;
      }
      this._sortChildren();
      PIXI.Container.prototype.updateTransform.call(this);
    }
    /**
     * @method _createLayers
     * @private
     */
    _createLayers() {
      this._needsRepaint = true;
      if (!this.lowerZLayer) {
        this.addChild(this.lowerZLayer = new PIXI.tilemap.ZLayer(this, 0));
        this.addChild(this.upperZLayer = new PIXI.tilemap.ZLayer(this, 4));
        this.lowerZLayer.addChild(
          this.lowerLayer = new PIXI.tilemap.CompositeRectTileLayer(0, [])
        );
        this.lowerLayer.shadowColor = new Float32Array([0, 0, 0, 0.5]);
        this.upperZLayer.addChild(
          this.upperLayer = new PIXI.tilemap.CompositeRectTileLayer(4, [])
        );
      }
    }
    /**
     * @method _updateLayerPositions
     * @param {Number} startX
     * @param {Number} startY
     * @private
     */
    _updateLayerPositions(startX, startY) {
      const ox = Math.floor(this.origin.x);
      const oy = Math.floor(this.origin.y);
      this.lowerZLayer.position.x = startX * this._tileWidth - ox;
      this.lowerZLayer.position.y = startY * this._tileHeight - oy;
      this.upperZLayer.position.x = startX * this._tileWidth - ox;
      this.upperZLayer.position.y = startY * this._tileHeight - oy;
    }
    /**
     * @method _paintAllTiles
     * @param {Number} startX
     * @param {Number} startY
     * @private
     */
    _paintAllTiles(startX, startY) {
      this.lowerZLayer.clear();
      this.upperZLayer.clear();
      const tileCols = Math.ceil(this._width / this._tileWidth) + 1;
      const tileRows = Math.ceil(this._height / this._tileHeight) + 1;
      for (let y = 0; y < tileRows; y++) {
        for (let x = 0; x < tileCols; x++) {
          this._paintTiles(startX, startY, x, y);
        }
      }
    }
    /**
     * @method _paintTiles
     * @param {Number} startX
     * @param {Number} startY
     * @param {Number} x
     * @param {Number} y
     * @private
     */
    _paintTiles(startX, startY, x, y) {
      const mx = startX + x;
      const my = startY + y;
      const dx = x * this._tileWidth;
      const dy = y * this._tileHeight;
      const tileId0 = this._readMapData(mx, my, 0);
      const tileId1 = this._readMapData(mx, my, 1);
      const tileId2 = this._readMapData(mx, my, 2);
      const tileId3 = this._readMapData(mx, my, 3);
      const shadowBits = this._readMapData(mx, my, 4);
      const upperTileId1 = this._readMapData(mx, my - 1, 1);
      const lowerLayer = this.lowerLayer.children[0];
      const upperLayer = this.upperLayer.children[0];
      if (this._isHigherTile(tileId0)) {
        this._drawTile(upperLayer, tileId0, dx, dy);
      } else {
        this._drawTile(lowerLayer, tileId0, dx, dy);
      }
      if (this._isHigherTile(tileId1)) {
        this._drawTile(upperLayer, tileId1, dx, dy);
      } else {
        this._drawTile(lowerLayer, tileId1, dx, dy);
      }
      this._drawShadow(lowerLayer, shadowBits, dx, dy);
      if (this._isTableTile(upperTileId1) && !this._isTableTile(tileId1)) {
        if (!Tilemap_default.isShadowingTile(tileId0)) {
          this._drawTableEdge(lowerLayer, upperTileId1, dx, dy);
        }
      }
      if (this._isOverpassPosition(mx, my)) {
        this._drawTile(upperLayer, tileId2, dx, dy);
        this._drawTile(upperLayer, tileId3, dx, dy);
      } else {
        if (this._isHigherTile(tileId2)) {
          this._drawTile(upperLayer, tileId2, dx, dy);
        } else {
          this._drawTile(lowerLayer, tileId2, dx, dy);
        }
        if (this._isHigherTile(tileId3)) {
          this._drawTile(upperLayer, tileId3, dx, dy);
        } else {
          this._drawTile(lowerLayer, tileId3, dx, dy);
        }
      }
    }
    /**
     * @method _drawTile
     * @param {Array} layers
     * @param {Number} tileId
     * @param {Number} dx
     * @param {Number} dy
     * @private
     */
    _drawTile(layer, tileId, dx, dy) {
      if (Tilemap_default.isVisibleTile(tileId)) {
        if (Tilemap_default.isAutotile(tileId)) {
          this._drawAutotile(layer, tileId, dx, dy);
        } else {
          this._drawNormalTile(layer, tileId, dx, dy);
        }
      }
    }
    /**
     * @method _drawNormalTile
     * @param {Array} layers
     * @param {Number} tileId
     * @param {Number} dx
     * @param {Number} dy
     * @private
     */
    _drawNormalTile(layer, tileId, dx, dy) {
      let setNumber = 0;
      if (Tilemap_default.isTileA5(tileId)) {
        setNumber = 4;
      } else {
        setNumber = 5 + Math.floor(tileId / 256);
      }
      const w = this._tileWidth;
      const h = this._tileHeight;
      const sx = (Math.floor(tileId / 128) % 2 * 8 + tileId % 8) * w;
      const sy = Math.floor(tileId % 256 / 8) % 16 * h;
      layer.addRect(setNumber, sx, sy, dx, dy, w, h);
    }
    /**
     * @method _drawAutotile
     * @param {Array} layers
     * @param {Number} tileId
     * @param {Number} dx
     * @param {Number} dy
     * @private
     */
    _drawAutotile(layer, tileId, dx, dy) {
      let autotileTable = Tilemap_default.FLOOR_AUTOTILE_TABLE;
      const kind = Tilemap_default.getAutotileKind(tileId);
      const shape = Tilemap_default.getAutotileShape(tileId);
      const tx = kind % 8;
      const ty = Math.floor(kind / 8);
      let bx = 0;
      let by = 0;
      let setNumber = 0;
      let isTable = false;
      let animX = 0;
      let animY = 0;
      if (Tilemap_default.isTileA1(tileId)) {
        setNumber = 0;
        if (kind === 0) {
          animX = 2;
          by = 0;
        } else if (kind === 1) {
          animX = 2;
          by = 3;
        } else if (kind === 2) {
          bx = 6;
          by = 0;
        } else if (kind === 3) {
          bx = 6;
          by = 3;
        } else {
          bx = Math.floor(tx / 4) * 8;
          by = ty * 6 + Math.floor(tx / 2) % 2 * 3;
          if (kind % 2 === 0) {
            animX = 2;
          } else {
            bx += 6;
            autotileTable = Tilemap_default.WATERFALL_AUTOTILE_TABLE;
            animY = 1;
          }
        }
      } else if (Tilemap_default.isTileA2(tileId)) {
        setNumber = 1;
        bx = tx * 2;
        by = (ty - 2) * 3;
        isTable = this._isTableTile(tileId);
      } else if (Tilemap_default.isTileA3(tileId)) {
        setNumber = 2;
        bx = tx * 2;
        by = (ty - 6) * 2;
        autotileTable = Tilemap_default.WALL_AUTOTILE_TABLE;
      } else if (Tilemap_default.isTileA4(tileId)) {
        setNumber = 3;
        bx = tx * 2;
        by = Math.floor((ty - 10) * 2.5 + (ty % 2 === 1 ? 0.5 : 0));
        if (ty % 2 === 1) {
          autotileTable = Tilemap_default.WALL_AUTOTILE_TABLE;
        }
      }
      const table = autotileTable[shape];
      const w1 = this._tileWidth / 2;
      const h1 = this._tileHeight / 2;
      for (let i = 0; i < 4; i++) {
        const qsx = table[i][0];
        const qsy = table[i][1];
        const sx1 = (bx * 2 + qsx) * w1;
        const sy1 = (by * 2 + qsy) * h1;
        const dx1 = dx + i % 2 * w1;
        const dy1 = dy + Math.floor(i / 2) * h1;
        if (isTable && (qsy === 1 || qsy === 5)) {
          let qsx2 = qsx;
          const qsy2 = 3;
          if (qsy === 1) {
            qsx2 = (4 - qsx) % 4;
          }
          const sx2 = (bx * 2 + qsx2) * w1;
          const sy2 = (by * 2 + qsy2) * h1;
          layer.addRect(setNumber, sx2, sy2, dx1, dy1, w1, h1, animX, animY);
          layer.addRect(
            setNumber,
            sx1,
            sy1,
            dx1,
            dy1 + h1 / 2,
            w1,
            h1 / 2,
            animX,
            animY
          );
        } else {
          layer.addRect(setNumber, sx1, sy1, dx1, dy1, w1, h1, animX, animY);
        }
      }
    }
    /**
     * @method _drawTableEdge
     * @param {Array} layers
     * @param {Number} tileId
     * @param {Number} dx
     * @param {Number} dy
     * @private
     */
    _drawTableEdge(layer, tileId, dx, dy) {
      if (Tilemap_default.isTileA2(tileId)) {
        const autotileTable = Tilemap_default.FLOOR_AUTOTILE_TABLE;
        const kind = Tilemap_default.getAutotileKind(tileId);
        const shape = Tilemap_default.getAutotileShape(tileId);
        const tx = kind % 8;
        const ty = Math.floor(kind / 8);
        const setNumber = 1;
        const bx = tx * 2;
        const by = (ty - 2) * 3;
        const table = autotileTable[shape];
        const w1 = this._tileWidth / 2;
        const h1 = this._tileHeight / 2;
        for (let i = 0; i < 2; i++) {
          const qsx = table[2 + i][0];
          const qsy = table[2 + i][1];
          const sx1 = (bx * 2 + qsx) * w1;
          const sy1 = (by * 2 + qsy) * h1 + h1 / 2;
          const dx1 = dx + i % 2 * w1;
          const dy1 = dy + Math.floor(i / 2) * h1;
          layer.addRect(setNumber, sx1, sy1, dx1, dy1, w1, h1 / 2);
        }
      }
    }
    /**
     * @method _drawShadow
     * @param {Number} shadowBits
     * @param {Number} dx
     * @param {Number} dy
     * @private
     */
    _drawShadow(layer, shadowBits, dx, dy) {
      if (shadowBits & 15) {
        const w1 = this._tileWidth / 2;
        const h1 = this._tileHeight / 2;
        for (let i = 0; i < 4; i++) {
          if (shadowBits & 1 << i) {
            const dx1 = dx + i % 2 * w1;
            const dy1 = dy + Math.floor(i / 2) * h1;
            layer.addRect(-1, 0, 0, dx1, dy1, w1, h1);
          }
        }
      }
    }
  };
  PIXI.tilemap.Constant.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;
  PIXI.tilemap.Constant.DO_CLEAR = true;
  PIXI.tilemap.Constant.boundCountPerBuffer = 4;
  PIXI.tilemap.Constant.maxTextures = 4;
  var ShaderTilemap_default = ShaderTilemap;

  // src-www/js/rpg_core/TilingSprite.js
  var TilingSprite = class extends PIXI.TilingSprite {
    constructor(...args) {
      super(...args);
      this.initialize(...args);
    }
    initialize(bitmap) {
      const texture = new PIXI.Texture(new PIXI.BaseTexture());
      PIXI.TilingSprite.call(this, texture);
      this._bitmap = null;
      this._width = 0;
      this._height = 0;
      this._frame = new Rectangle_default();
      this.spriteId = Sprite_default._counter++;
      this.origin = new Point_default();
      this.bitmap = bitmap;
    }
    /**
     * @method _renderCanvas
     * @param {Object} renderer
     * @private
     */
    _renderCanvas(renderer) {
      if (this._bitmap) {
        this._bitmap.touch();
      }
      if (this.texture.frame.width > 0 && this.texture.frame.height > 0) {
        this._renderCanvas_PIXI(renderer);
      }
    }
    /**
     * The image for the tiling sprite.
     *
     * @property bitmap
     * @type Bitmap
     */
    get bitmap() {
      return this._bitmap;
    }
    set bitmap(value3) {
      if (this._bitmap !== value3) {
        this._bitmap = value3;
        if (this._bitmap) {
          this._bitmap.addLoadListener(this._onBitmapLoad.bind(this));
        } else {
          this.texture.frame = Rectangle_default.emptyRectangle;
        }
      }
    }
    /**
     * The opacity of the tiling sprite (0 to 255).
     *
     * @property opacity
     * @type Number
     */
    get opacity() {
      return this.alpha * 255;
    }
    set opacity(value3) {
      this.alpha = value3.clamp(0, 255) / 255;
    }
    /**
     * Updates the tiling sprite for each frame.
     *
     * @method update
     */
    update() {
      this.children.forEach((child) => {
        if (child.update) {
          child.update();
        }
      });
    }
    /**
     * Sets the x, y, width, and height all at once.
     *
     * @method move
     * @param {Number} x The x coordinate of the tiling sprite
     * @param {Number} y The y coordinate of the tiling sprite
     * @param {Number} width The width of the tiling sprite
     * @param {Number} height The height of the tiling sprite
     */
    move(x, y, width, height) {
      this.x = x || 0;
      this.y = y || 0;
      this._width = width || 0;
      this._height = height || 0;
    }
    /**
     * Specifies the region of the image that the tiling sprite will use.
     *
     * @method setFrame
     * @param {Number} x The x coordinate of the frame
     * @param {Number} y The y coordinate of the frame
     * @param {Number} width The width of the frame
     * @param {Number} height The height of the frame
     */
    setFrame(x, y, width, height) {
      this._frame.x = x;
      this._frame.y = y;
      this._frame.width = width;
      this._frame.height = height;
      this._refresh();
    }
    /**
     * @method updateTransform
     * @private
     */
    updateTransform() {
      this.tilePosition.x = Math.round(-this.origin.x);
      this.tilePosition.y = Math.round(-this.origin.y);
      this.updateTransformTS();
    }
    /**
     * @method _onBitmapLoad
     * @private
     */
    _onBitmapLoad() {
      this.texture.baseTexture = this._bitmap.baseTexture;
      this._refresh();
    }
    /**
     * @method _refresh
     * @private
     */
    _refresh() {
      const frame = this._frame.clone();
      if (frame.width === 0 && frame.height === 0 && this._bitmap) {
        frame.width = this._bitmap.width;
        frame.height = this._bitmap.height;
      }
      this.texture.frame = frame;
      this.texture._updateID++;
      this.tilingTexture = null;
    }
    /**
     * @method _render
     * @param {Object} renderer
     * @private
     */
    _render(renderer) {
      if (this._bitmap) {
        this._bitmap.touch();
        this._bitmap.checkDirty();
      }
      this._render_PIXI(renderer);
    }
    // The important members from Pixi.js
    /**
     * The visibility of the tiling sprite.
     *
     * @property visible
     * @type Boolean
     */
    /**
     * The x coordinate of the tiling sprite.
     *
     * @property x
     * @type Number
     */
    /**
     * The y coordinate of the tiling sprite.
     *
     * @property y
     * @type Number
     */
  };
  TilingSprite.prototype._renderCanvas_PIXI = PIXI.TilingSprite.prototype._renderCanvas;
  TilingSprite.prototype._render_PIXI = PIXI.TilingSprite.prototype._render;
  TilingSprite.prototype.updateTransformTS = PIXI.TilingSprite.prototype.updateTransform;
  var TilingSprite_default = TilingSprite;

  // src-www/js/rpg_core/ScreenSprite.js
  var ScreenSprite = class extends PIXI.Container {
    constructor(...args) {
      super(...args);
      this.initialize(...args);
    }
    initialize() {
      PIXI.Container.call(this);
      this._graphics = new PIXI.Graphics();
      this.addChild(this._graphics);
      this.opacity = 0;
      this._red = -1;
      this._green = -1;
      this._blue = -1;
      this._colorText = "";
      this.setBlack();
    }
    /**
     * The opacity of the sprite (0 to 255).
     *
     * @property opacity
     * @type Number
     */
    get opacity() {
      return this.alpha * 255;
    }
    set opacity(value3) {
      this.alpha = value3.clamp(0, 255) / 255;
    }
    get anchor() {
      ScreenSprite.warnYep();
      this.scale.x = 1;
      this.scale.y = 1;
      return {
        x: 0,
        y: 0
      };
    }
    set anchor(value3) {
      this.alpha = value3.clamp(0, 255) / 255;
    }
    get blendMode() {
      return this._graphics.blendMode;
    }
    set blendMode(value3) {
      this._graphics.blendMode = value3;
    }
    /**
     * Sets black to the color of the screen sprite.
     *
     * @method setBlack
     */
    setBlack() {
      this.setColor(0, 0, 0);
    }
    /**
     * Sets white to the color of the screen sprite.
     *
     * @method setWhite
     */
    setWhite() {
      this.setColor(255, 255, 255);
    }
    /**
     * Sets the color of the screen sprite by values.
     *
     * @method setColor
     * @param {Number} r The red value in the range (0, 255)
     * @param {Number} g The green value in the range (0, 255)
     * @param {Number} b The blue value in the range (0, 255)
     */
    setColor(r, g, b2) {
      if (this._red !== r || this._green !== g || this._blue !== b2) {
        r = Math.round(r || 0).clamp(0, 255);
        g = Math.round(g || 0).clamp(0, 255);
        b2 = Math.round(b2 || 0).clamp(0, 255);
        this._red = r;
        this._green = g;
        this._blue = b2;
        this._colorText = Utils_default.rgbToCssColor(r, g, b2);
        const graphics = this._graphics;
        graphics.clear();
        const intColor = r << 16 | g << 8 | b2;
        graphics.beginFill(intColor, 1);
        graphics.drawRect(
          -Graphics_default.width * 5,
          -Graphics_default.height * 5,
          Graphics_default.width * 10,
          Graphics_default.height * 10
        );
      }
    }
  };
  var ScreenSprite_default = ScreenSprite;

  // src-www/js/rpg_core/WindowSkinCache.js
  var WindowSkinCache = class {
    constructor() {
      throw new Error("This is a static class");
    }
    static setItem(name, resource, type) {
      if (!WindowSkinCache._cache[name]) {
        WindowSkinCache._cache[name] = {};
      }
      WindowSkinCache._cache[name][type] = resource;
    }
    static getItem(name, type) {
      if (!WindowSkinCache._cache[name])
        return false;
      if (!WindowSkinCache._cache[name][type])
        return false;
      return WindowSkinCache._cache[name][type];
    }
  };
  WindowSkinCache._cache = {};
  var WindowSkinCache_default = WindowSkinCache;

  // src-www/js/rpg_core/Window.js
  var Window = class extends PIXI.Container {
    constructor(...args) {
      super(...args);
      this.initialize(...args);
    }
    initialize() {
      PIXI.Container.call(this);
      this._isWindow = true;
      this._windowskin = null;
      this._width = 0;
      this._height = 0;
      this._cursorRect = new Rectangle_default();
      this._openness = 255;
      this._animationCount = 0;
      this._padding = 18;
      this._margin = 4;
      this._colorTone = [0, 0, 0];
      this._windowSpriteContainer = null;
      this._windowBackSprite = null;
      this._windowCursorSprite = null;
      this._windowFrameSprite = null;
      this._windowContentsSprite = null;
      this._windowArrowSprites = [];
      this._windowPauseSignSprite = null;
      this._createAllParts();
      this.origin = new Point_default();
      this.active = true;
      this.downArrowVisible = false;
      this.upArrowVisible = false;
      this.pause = false;
    }
    /**
     * The image used as a window skin.
     *
     * @property windowskin
     * @type Bitmap
     */
    get windowskin() {
      return this._windowskin;
    }
    set windowskin(value3) {
      if (this._windowskin !== value3) {
        this._windowskin = value3;
        this._windowskin.addLoadListener(this._onWindowskinLoad.bind(this));
      }
    }
    /**
     * The bitmap used for the window contents.
     *
     * @property contents
     * @type Bitmap
     */
    get contents() {
      return this._windowContentsSprite.children[0];
    }
    set contents(value3) {
      const oldContents = this._windowContentsSprite.children[0];
      if (oldContents) {
        this._windowContentsSprite.removeChild(oldContents);
      }
      this._windowContentsSprite.addChild(value3);
    }
    /**
     * The width of the window in pixels.
     *
     * @property width
     * @type Number
     */
    get width() {
      return this._width;
    }
    set width(value3) {
      this._width = value3;
      this._refreshAllParts();
    }
    /**
     * The height of the window in pixels.
     *
     * @property height
     * @type Number
     */
    get height() {
      return this._height;
    }
    set height(value3) {
      this._height = value3;
      this._refreshAllParts();
    }
    /**
     * The size of the padding between the frame and contents.
     *
     * @property padding
     * @type Number
     */
    get padding() {
      return this._padding;
    }
    set padding(value3) {
      this._padding = value3;
      this._refreshAllParts();
    }
    /**
     * The size of the margin for the window background.
     *
     * @property margin
     * @type Number
     */
    get margin() {
      return this._margin;
    }
    set margin(value3) {
      this._margin = value3;
      this._refreshAllParts();
    }
    /**
     * The opacity of the window without contents (0 to 255).
     *
     * @property opacity
     * @type Number
     */
    get opacity() {
      return this._windowSpriteContainer.alpha * 255;
    }
    set opacity(value3) {
      this._windowSpriteContainer.alpha = value3.clamp(0, 255) / 255;
    }
    /**
     * The opacity of the window background (0 to 255).
     *
     * @property backOpacity
     * @type Number
     */
    get backOpacity() {
      return this._windowBackSprite.alpha * 255;
    }
    set backOpacity(value3) {
      this._windowBackSprite.alpha = value3.clamp(0, 255) / 255;
    }
    /**
     * The opacity of the window contents (0 to 255).
     *
     * @property contentsOpacity
     * @type Number
     */
    get contentsOpacity() {
      return this._windowContentsSprite.alpha * 255;
    }
    set contentsOpacity(value3) {
      this._windowContentsSprite.alpha = value3.clamp(0, 255) / 255;
    }
    /**
     * The openness of the window (0 to 255).
     *
     * @property openness
     * @type Number
     */
    get openness() {
      return this._openness;
    }
    set openness(value3) {
      if (this._openness !== value3) {
        this._openness = value3.clamp(0, 255);
        this._windowSpriteContainer.scale.y = this._openness / 255;
        this._windowSpriteContainer.y = this.height / 2 * (1 - this._openness / 255);
      }
    }
    /**
     * Updates the window for each frame.
     *
     * @method update
     */
    update() {
      if (this.active) {
        this._animationCount++;
      }
      this.children.forEach((child) => {
        if (child.update) {
          child.update();
        }
      });
    }
    /**
     * Sets the x, y, width, and height all at once.
     *
     * @method move
     * @param {Number} x The x coordinate of the window
     * @param {Number} y The y coordinate of the window
     * @param {Number} width The width of the window
     * @param {Number} height The height of the window
     */
    move(x, y, width, height) {
      this.x = Math.floor(x || 0);
      this.y = Math.floor(y || 0);
      if (this._width !== width || this._height !== height) {
        this._width = Math.floor(width || 0);
        this._height = Math.floor(height || 0);
        this._refreshAllParts();
      }
    }
    /**
     * Returns true if the window is completely open (openness == 255).
     *
     * @method isOpen
     */
    isOpen() {
      return this._openness >= 255;
    }
    /**
     * Returns true if the window is completely closed (openness == 0).
     *
     * @method isClosed
     */
    isClosed() {
      return this._openness <= 0;
    }
    /**
     * Sets the position of the command cursor.
     *
     * @method setCursorRect
     * @param {Number} x The x coordinate of the cursor
     * @param {Number} y The y coordinate of the cursor
     * @param {Number} width The width of the cursor
     * @param {Number} height The height of the cursor
     */
    setCursorRect(x, y, width, height) {
      const cx = Math.floor(x || 0);
      const cy = Math.floor(y || 0);
      const cw = Math.floor(width || 0);
      const ch = Math.floor(height || 0);
      const rect = this._cursorRect;
      if (rect.x !== cx || rect.y !== cy || rect.width !== cw || rect.height !== ch) {
        this._cursorRect.x = cx;
        this._cursorRect.y = cy;
        this._cursorRect.width = cw;
        this._cursorRect.height = ch;
        this._refreshCursor();
      }
    }
    /**
     * Changes the color of the background.
     *
     * @method setTone
     * @param {Number} r The red value in the range (-255, 255)
     * @param {Number} g The green value in the range (-255, 255)
     * @param {Number} b The blue value in the range (-255, 255)
     */
    setTone(r, g, b2) {
      const tone = this._colorTone;
      r = r / 255;
      g = g / 255;
      b2 = b2 / 255;
      if (r < 0)
        r = 0;
      if (g < 0)
        g = 0;
      if (b2 < 0)
        b2 = 0;
      if (r !== tone[0] || g !== tone[1] || b2 !== tone[2]) {
        this._colorTone = [r, g, b2];
        this._refreshBack();
      }
    }
    /**
     * Adds a child between the background and contents.
     *
     * @method addChildToBack
     * @param {Object} child The child to add
     * @return {Object} The child that was added
     */
    addChildToBack(child) {
      const containerIndex = this.children.indexOf(this._windowSpriteContainer);
      return this.addChildAt(child, containerIndex + 1);
    }
    /**
     * @method updateTransform
     * @private
     */
    updateTransform() {
      this._updateCursor();
      this._updateArrows();
      this._updatePauseSign();
      this._updateContents();
      super.updateTransform();
    }
    /**
     * @method _createAllParts
     * @private
     */
    _createAllParts() {
      this._windowSpriteContainer = new PIXI.Container();
      this._windowBackSprite = new BitmapPIXI_default();
      this._windowCursorSprite = new BitmapPIXI_default();
      this._windowFrameSprite = new PIXI.Container();
      this._windowContentsSprite = new Sprite_default();
      this._downArrowSprite = new Sprite_default();
      this._upArrowSprite = new Sprite_default();
      this._windowPauseSignSprite = new Sprite_default();
      this._windowBackSprite.alpha = 192 / 255;
      this.addChild(this._windowSpriteContainer);
      this._windowSpriteContainer.addChild(this._windowBackSprite);
      this._windowSpriteContainer.addChild(this._windowFrameSprite);
      this.addChild(this._windowCursorSprite);
      this.addChild(this._windowContentsSprite);
      this.addChild(this._downArrowSprite);
      this.addChild(this._upArrowSprite);
      this.addChild(this._windowPauseSignSprite);
    }
    /**
     * @method _onWindowskinLoad
     * @private
     */
    _onWindowskinLoad() {
      this._refreshAllParts();
    }
    /**
     * @method _refreshAllParts
     * @private
     */
    _refreshAllParts() {
      this._refreshBack();
      this._refreshFrame();
      this._refreshCursor();
      this._refreshContents();
      this._refreshArrows();
      this._refreshPauseSign();
    }
    /**
     * @method _refreshBack
     * @private
     */
    _refreshBack() {
      const m = this._margin;
      const w = this._width - m * 2;
      const h = this._height - m * 2;
      const tone = PIXI.utils.rgb2hex(this._colorTone);
      if (w > 0 && h > 0 && this._windowskin && !this._windowBackSprite._setupComplete) {
        const p = 96;
        this._windowBackSprite.blt(this._windowskin, 0, 0, p, p, 0, 0, w, h);
        this._windowBackSprite.addChild(
          this._windowBackSprite.createTilingSprite(
            this._windowskin.baseTexture,
            0,
            p,
            p,
            p,
            w,
            h
          )
        );
        this._windowBackSprite._setupComplete = true;
      }
      this._windowBackSprite.width = w;
      this._windowBackSprite.height = h;
      this._windowBackSprite.x = m;
      this._windowBackSprite.y = m;
      this._windowBackSprite.children.forEach((child) => {
        if (child) {
          child.width = w;
          child.height = h;
          child.tint = tone;
        }
      });
    }
    /**
     * @method _refreshFrame
     * @private
     */
    _refreshFrame() {
      const w = this._width;
      const h = this._height;
      const m = 24;
      if (w > 0 && h > 0 && this._windowskin && !this._windowFrameSprite._setupComplete) {
        let texture;
        const cachedFrame = WindowSkinCache_default.getItem(
          this._windowskin._url,
          "frame"
        );
        if (cachedFrame) {
          texture = cachedFrame;
        } else {
          const container = new BitmapPIXI_default();
          const skin = this._windowskin;
          const p = 96;
          const q = 96;
          container.blt(skin, p + m, 0 + 0, p - m * 2, m, m, 0, w - m * 2, m);
          container.blt(
            skin,
            p + m,
            0 + q - m,
            p - m * 2,
            m,
            m,
            h - m,
            w - m * 2,
            m
          );
          container.blt(skin, p + 0, 0 + m, m, p - m * 2, 0, m, m, h - m * 2);
          container.blt(
            skin,
            p + q - m,
            0 + m,
            m,
            p - m * 2,
            w - m,
            m,
            m,
            h - m * 2
          );
          container.blt(skin, p + 0, 0 + 0, m, m, 0, 0, m, m);
          container.blt(skin, p + q - m, 0 + 0, m, m, w - m, 0, m, m);
          container.blt(skin, p + 0, 0 + q - m, m, m, 0, h - m, m, m);
          container.blt(skin, p + q - m, 0 + q - m, m, m, w - m, h - m, m, m);
          texture = Graphics_default._renderer.generateTexture(container);
          container.destroy({
            children: true,
            texture: true
          });
          WindowSkinCache_default.setItem(this._windowskin._url, texture, "frame");
        }
        this._windowFramePlane = new PIXI.NineSlicePlane(texture, 12, 12, 12, 12);
        this._windowFrameSprite.addChild(this._windowFramePlane);
        this._windowFrameSprite._setupComplete = true;
      }
      if (this._windowFrameSprite._setupComplete) {
        this._windowFramePlane.width = w;
        this._windowFramePlane.height = h;
      }
    }
    /**
     * @method _refreshCursor
     * @private
     */
    _refreshCursor() {
      const pad = this._padding;
      const x = this._cursorRect.x + pad - this.origin.x;
      const y = this._cursorRect.y + pad - this.origin.y;
      const w = this._cursorRect.width;
      const h = this._cursorRect.height;
      if (w > 0 && h > 0 && this._windowskin && !this._windowCursorSprite._setupComplete) {
        const p = 96;
        const q = 48;
        this._windowCursorPlane = this._windowCursorSprite.create9Slice(
          this._windowskin.baseTexture,
          p,
          p,
          q,
          q,
          12,
          12,
          12,
          12
        );
        this._windowCursorSprite.addChild(this._windowCursorPlane);
        this._windowCursorSprite._setupComplete = true;
      }
      if (this._windowCursorPlane) {
        this._windowCursorPlane.x = x;
        this._windowCursorPlane.y = y;
        this._windowCursorPlane.width = w;
        this._windowCursorPlane.height = h;
      }
    }
    /**
     * @method _refreshContents
     * @private
     */
    _refreshContents() {
      this._windowContentsSprite.move(this.padding, this.padding);
      if (this._windowContentsSprite.children.length)
        this._windowContentsSprite.children[0].clear();
    }
    /**
     * @method _refreshArrows
     * @private
     */
    _refreshArrows() {
      const w = this._width;
      const h = this._height;
      const p = 24;
      const q = p / 2;
      const sx = 96 + p;
      const sy = 0 + p;
      this._downArrowSprite.bitmap = this._windowskin;
      this._downArrowSprite.anchor.x = 0.5;
      this._downArrowSprite.anchor.y = 0.5;
      this._downArrowSprite.setFrame(sx + q, sy + q + p, p, q);
      this._downArrowSprite.move(w / 2, h - q);
      this._upArrowSprite.bitmap = this._windowskin;
      this._upArrowSprite.anchor.x = 0.5;
      this._upArrowSprite.anchor.y = 0.5;
      this._upArrowSprite.setFrame(sx + q, sy, p, q);
      this._upArrowSprite.move(w / 2, q);
    }
    /**
     * @method _refreshPauseSign
     * @private
     */
    _refreshPauseSign() {
      const sx = 144;
      const sy = 96;
      const p = 24;
      this._windowPauseSignSprite.bitmap = this._windowskin;
      this._windowPauseSignSprite.anchor.x = 0.5;
      this._windowPauseSignSprite.anchor.y = 1;
      this._windowPauseSignSprite.move(this._width / 2, this._height);
      this._windowPauseSignSprite.setFrame(sx, sy, p, p);
      this._windowPauseSignSprite.alpha = 0;
    }
    /**
     * @method _updateCursor
     * @private
     */
    _updateCursor() {
      const blinkCount = this._animationCount % 40;
      let cursorOpacity = this.contentsOpacity;
      if (this.active) {
        if (blinkCount < 20) {
          cursorOpacity -= blinkCount * 8;
        } else {
          cursorOpacity -= (40 - blinkCount) * 8;
        }
      }
      this._windowCursorSprite.alpha = cursorOpacity / 255;
      this._windowCursorSprite.visible = this.isOpen();
    }
    /**
     * @method _updateContents
     * @private
     */
    _updateContents() {
      const w = this._width - this._padding * 2;
      const h = this._height - this._padding * 2;
      if (w > 0 && h > 0) {
        this._windowContentsSprite.setFrame(this.origin.x, this.origin.y, w, h);
        this._windowContentsSprite.visible = this.isOpen();
      } else {
        this._windowContentsSprite.visible = false;
      }
    }
    /**
     * @method _updateArrows
     * @private
     */
    _updateArrows() {
      this._downArrowSprite.visible = this.isOpen() && this.downArrowVisible;
      this._upArrowSprite.visible = this.isOpen() && this.upArrowVisible;
    }
    /**
     * @method _updatePauseSign
     * @private
     */
    _updatePauseSign() {
      const sprite = this._windowPauseSignSprite;
      const x = Math.floor(this._animationCount / 16) % 2;
      const y = Math.floor(this._animationCount / 16 / 2) % 2;
      const sx = 144;
      const sy = 96;
      const p = 24;
      if (!this.pause) {
        sprite.alpha = 0;
      } else if (sprite.alpha < 1) {
        sprite.alpha = Math.min(sprite.alpha + 0.1, 1);
      }
      sprite.setFrame(sx + x * p, sy + y * p, p, p);
      sprite.visible = this.isOpen();
    }
    // The important members from Pixi.js
    /**
     * The visibility of the window.
     *
     * @property visible
     * @type Boolean
     */
    /**
     * The x coordinate of the window.
     *
     * @property x
     * @type Number
     */
    /**
     * The y coordinate of the window.
     *
     * @property y
     * @type Number
     */
    /**
     * [read-only] The array of children of the window.
     *
     * @property children
     * @type Array
     */
    /**
     * [read-only] The object that contains the window.
     *
     * @property parent
     * @type Object
     */
    /**
     * Adds a child to the container.
     *
     * @method addChild
     * @param {Object} child The child to add
     * @return {Object} The child that was added
     */
    /**
     * Adds a child to the container at a specified index.
     *
     * @method addChildAt
     * @param {Object} child The child to add
     * @param {Number} index The index to place the child in
     * @return {Object} The child that was added
     */
    /**
     * Removes a child from the container.
     *
     * @method removeChild
     * @param {Object} child The child to remove
     * @return {Object} The child that was removed
     */
    /**
     * Removes a child from the specified index position.
     *
     * @method removeChildAt
     * @param {Number} index The index to get the child from
     * @return {Object} The child that was removed
     */
  };
  var Window_default = Window;

  // src-www/js/rpg_core/WindowLayer.js
  var WindowLayer = class extends PIXI.Container {
    constructor(...args) {
      super(...args);
      this.initialize(...args);
    }
    initialize() {
      PIXI.Container.call(this);
      this._width = 0;
      this._height = 0;
      this.on("removed", this.onRemoveAsAChild);
    }
    onRemoveAsAChild() {
      this.removeChildren();
    }
    /**
     * The width of the window layer in pixels.
     *
     * @property width
     * @type Number
     */
    get width() {
      return this._width;
    }
    set width(value3) {
      this._width = value3;
    }
    /**
     * The height of the window layer in pixels.
     *
     * @property height
     * @type Number
     */
    get height() {
      return this._height;
    }
    set height(value3) {
      this._height = value3;
    }
    /**
     * Sets the x, y, width, and height all at once.
     *
     * @method move
     * @param {Number} x The x coordinate of the window layer
     * @param {Number} y The y coordinate of the window layer
     * @param {Number} width The width of the window layer
     * @param {Number} height The height of the window layer
     */
    move(x, y, width, height) {
      this.x = x;
      this.y = y;
      this.width = width;
      this.height = height;
    }
    /**
     * Updates the window layer for each frame.
     *
     * @method update
     */
    update() {
      this.children.forEach((child) => {
        if (child.update) {
          child.update();
        }
      });
    }
  };
  WindowLayer.voidFilter = new PIXI.filters.AlphaFilter();
  WindowLayer.prototype.render = PIXI.Container.prototype.render;
  WindowLayer.prototype.renderCanvas = PIXI.Container.prototype.renderCanvas;
  var WindowLayer_default = WindowLayer;

  // src-www/js/rpg_core/Weather.js
  var Weather = class extends PIXI.Container {
    constructor(...args) {
      super(...args);
      this.initialize(...args);
    }
    initialize() {
      PIXI.Container.call(this);
      this._width = Graphics_default.width;
      this._height = Graphics_default.height;
      this._sprites = [];
      this._createBitmaps();
      this._createDimmer();
      this.type = "none";
      this.power = 0;
      this.origin = new Point_default();
    }
    /**
     * Updates the weather for each frame.
     *
     * @method update
     */
    update() {
      this._updateDimmer();
      this._updateAllSprites();
    }
    /**
     * @method _createBitmaps
     * @private
     */
    _createBitmaps() {
      this._rainBitmap = new Bitmap_default(1, 60);
      this._rainBitmap.fillAll("white");
      this._stormBitmap = new Bitmap_default(2, 100);
      this._stormBitmap.fillAll("white");
      this._snowBitmap = new Bitmap_default(9, 9);
      this._snowBitmap.drawCircle(4, 4, 4, "white");
    }
    /**
     * @method _createDimmer
     * @private
     */
    _createDimmer() {
      this._dimmerSprite = new ScreenSprite_default();
      this._dimmerSprite.setColor(80, 80, 80);
      this.addChild(this._dimmerSprite);
    }
    /**
     * @method _updateDimmer
     * @private
     */
    _updateDimmer() {
      this._dimmerSprite.opacity = Math.floor(this.power * 6);
    }
    /**
     * @method _updateAllSprites
     * @private
     */
    _updateAllSprites() {
      const maxSprites = Math.floor(this.power * 10);
      while (this._sprites.length < maxSprites) {
        this._addSprite();
      }
      while (this._sprites.length > maxSprites) {
        this._removeSprite();
      }
      this._sprites.forEach(function(sprite) {
        this._updateSprite(sprite);
        sprite.x = sprite.ax - this.origin.x;
        sprite.y = sprite.ay - this.origin.y;
      }, this);
    }
    /**
     * @method _addSprite
     * @private
     */
    _addSprite() {
      const sprite = new Sprite_default(this.viewport);
      sprite.opacity = 0;
      this._sprites.push(sprite);
      this.addChild(sprite);
    }
    /**
     * @method _removeSprite
     * @private
     */
    _removeSprite() {
      this.removeChild(this._sprites.pop());
    }
    /**
     * @method _updateSprite
     * @param {Sprite} sprite
     * @private
     */
    _updateSprite(sprite) {
      switch (this.type) {
        case "rain":
          this._updateRainSprite(sprite);
          break;
        case "storm":
          this._updateStormSprite(sprite);
          break;
        case "snow":
          this._updateSnowSprite(sprite);
          break;
      }
      if (sprite.opacity < 40) {
        this._rebornSprite(sprite);
      }
    }
    /**
     * @method _updateRainSprite
     * @param {Sprite} sprite
     * @private
     */
    _updateRainSprite(sprite) {
      sprite.bitmap = this._rainBitmap;
      sprite.rotation = Math.PI / 16;
      sprite.ax -= 6 * Math.sin(sprite.rotation);
      sprite.ay += 6 * Math.cos(sprite.rotation);
      sprite.opacity -= 6;
    }
    /**
     * @method _updateStormSprite
     * @param {Sprite} sprite
     * @private
     */
    _updateStormSprite(sprite) {
      sprite.bitmap = this._stormBitmap;
      sprite.rotation = Math.PI / 8;
      sprite.ax -= 8 * Math.sin(sprite.rotation);
      sprite.ay += 8 * Math.cos(sprite.rotation);
      sprite.opacity -= 8;
    }
    /**
     * @method _updateSnowSprite
     * @param {Sprite} sprite
     * @private
     */
    _updateSnowSprite(sprite) {
      sprite.bitmap = this._snowBitmap;
      sprite.rotation = Math.PI / 16;
      sprite.ax -= 3 * Math.sin(sprite.rotation);
      sprite.ay += 3 * Math.cos(sprite.rotation);
      sprite.opacity -= 3;
    }
    /**
     * @method _rebornSprite
     * @param {Sprite} sprite
     * @private
     */
    _rebornSprite(sprite) {
      sprite.ax = Math.randomInt(Graphics_default.width + 100) - 100 + this.origin.x;
      sprite.ay = Math.randomInt(Graphics_default.height + 200) - 200 + this.origin.y;
      sprite.opacity = 160 + Math.randomInt(60);
    }
  };
  var Weather_default = Weather;

  // src-www/js/rpg_core/ToneFilter.js
  var ToneFilter = class extends PIXI.filters.ColorMatrixFilter {
    constructor() {
      super();
    }
    /**
     * Changes the hue.
     *
     * @method adjustHue
     * @param {Number} value The hue value in the range (-360, 360)
     */
    adjustHue(value3) {
      this.hue(value3, true);
    }
    /**
     * Changes the saturation.
     *
     * @method adjustSaturation
     * @param {Number} value The saturation value in the range (-255, 255)
     */
    adjustSaturation(value3) {
      value3 = (value3 || 0).clamp(-255, 255) / 255;
      this.saturate(value3, true);
    }
    /**
     * Changes the tone.
     *
     * @method adjustTone
     * @param {Number} r The red strength in the range (-255, 255)
     * @param {Number} g The green strength in the range (-255, 255)
     * @param {Number} b The blue strength in the range (-255, 255)
     */
    adjustTone(r, g, b2) {
      r = (r || 0).clamp(-255, 255) / 255;
      g = (g || 0).clamp(-255, 255) / 255;
      b2 = (b2 || 0).clamp(-255, 255) / 255;
      if (r !== 0 || g !== 0 || b2 !== 0) {
        const matrix = [
          1,
          0,
          0,
          r,
          0,
          0,
          1,
          0,
          g,
          0,
          0,
          0,
          1,
          b2,
          0,
          0,
          0,
          0,
          1,
          0
        ];
        this._loadMatrix(matrix, true);
      }
    }
  };
  var ToneFilter_default = ToneFilter;

  // src-www/js/rpg_core/ToneSprite.js
  var ToneSprite = class extends PIXI.Container {
    constructor(...args) {
      super(...args);
      this.initialize(...args);
    }
    initialize() {
      PIXI.Container.call(this);
      this.clear();
    }
    /**
     * Clears the tone.
     *
     * @method reset
     */
    clear() {
      this._red = 0;
      this._green = 0;
      this._blue = 0;
      this._gray = 0;
    }
    /**
     * Sets the tone.
     *
     * @method setTone
     * @param {Number} r The red strength in the range (-255, 255)
     * @param {Number} g The green strength in the range (-255, 255)
     * @param {Number} b The blue strength in the range (-255, 255)
     * @param {Number} gray The grayscale level in the range (0, 255)
     */
    setTone(r, g, b2, gray) {
      this._red = Math.round(r || 0).clamp(-255, 255);
      this._green = Math.round(g || 0).clamp(-255, 255);
      this._blue = Math.round(b2 || 0).clamp(-255, 255);
      this._gray = Math.round(gray || 0).clamp(0, 255);
    }
    /**
     * @method _renderCanvas
     * @param {Object} renderSession
     * @private
     */
    _renderCanvas(renderer) {
      if (this.visible) {
        const context = renderer.context;
        const t = this.worldTransform;
        const r = renderer.resolution;
        const width = Graphics_default.width;
        const height = Graphics_default.height;
        context.save();
        context.setTransform(t.a, t.b, t.c, t.d, t.tx * r, t.ty * r);
        if (Graphics_default.canUseSaturationBlend() && this._gray > 0) {
          context.globalCompositeOperation = "saturation";
          context.globalAlpha = this._gray / 255;
          context.fillStyle = "#ffffff";
          context.fillRect(0, 0, width, height);
        }
        context.globalAlpha = 1;
        const r1 = Math.max(0, this._red);
        const g1 = Math.max(0, this._green);
        const b1 = Math.max(0, this._blue);
        if (r1 || g1 || b1) {
          context.globalCompositeOperation = "lighter";
          context.fillStyle = Utils_default.rgbToCssColor(r1, g1, b1);
          context.fillRect(0, 0, width, height);
        }
        if (Graphics_default.canUseDifferenceBlend()) {
          const r2 = Math.max(0, -this._red);
          const g2 = Math.max(0, -this._green);
          const b2 = Math.max(0, -this._blue);
          if (r2 || g2 || b2) {
            context.globalCompositeOperation = "difference";
            context.fillStyle = "#ffffff";
            context.fillRect(0, 0, width, height);
            context.globalCompositeOperation = "lighter";
            context.fillStyle = Utils_default.rgbToCssColor(r2, g2, b2);
            context.fillRect(0, 0, width, height);
            context.globalCompositeOperation = "difference";
            context.fillStyle = "#ffffff";
            context.fillRect(0, 0, width, height);
          }
        }
        context.restore();
      }
    }
    /**
     * @method _render
     * @param {Object} renderSession
     * @private
     */
    _render(renderer) {
    }
  };
  var ToneSprite_default = ToneSprite;

  // src-www/js/rpg_core/Stage.js
  var Stage = class extends PIXI.Container {
    constructor(...args) {
      super(...args);
      this.initialize(...args);
    }
    initialize() {
      PIXI.Container.call(this);
      this.interactive = false;
    }
    /**
     * [read-only] The array of children of the stage.
     *
     * @property children
     * @type Array
     */
    /**
     * Adds a child to the container.
     *
     * @method addChild
     * @param {Object} child The child to add
     * @return {Object} The child that was added
     */
    /**
     * Adds a child to the container at a specified index.
     *
     * @method addChildAt
     * @param {Object} child The child to add
     * @param {Number} index The index to place the child in
     * @return {Object} The child that was added
     */
    /**
     * Removes a child from the container.
     *
     * @method removeChild
     * @param {Object} child The child to remove
     * @return {Object} The child that was removed
     */
    /**
     * Removes a child from the specified index position.
     *
     * @method removeChildAt
     * @param {Number} index The index to get the child from
     * @return {Object} The child that was removed
     */
  };
  var Stage_default = Stage;

  // src-www/js/rpg_core/JsonEx.js
  var JsonEx = class {
    constructor() {
      throw new Error("This is a static class");
    }
    /**
     * Converts an object to a JSON string with object information.
     *
     * @static
     * @method stringify
     * @param {Object} object The object to be converted
     * @return {String} The JSON string
     */
    static stringify(object) {
      const circular = [];
      JsonEx._id = 1;
      const json = JSON.stringify(this._encode(object, circular, 0));
      this._cleanMetadata(object);
      this._restoreCircularReference(circular);
      return json;
    }
    /**
     * Parses a JSON string and reconstructs the corresponding object.
     *
     * @static
     * @method parse
     * @param {String} json The JSON string
     * @return {Object} The reconstructed object
     */
    static parse(json) {
      const circular = [];
      const registry = {};
      const contents = this._decode(JSON.parse(json), circular, registry);
      this._cleanMetadata(contents);
      this._linkCircularReference(contents, circular, registry);
      return contents;
    }
    /**
     * Makes a deep copy of the specified object.
     *
     * @static
     * @method makeDeepCopy
     * @param {Object} object The object to be copied
     * @return {Object} The copied object
     */
    static makeDeepCopy(object) {
      return this.parse(this.stringify(object));
    }
    /**
     * @static
     * @method _encode
     * @param {Object} value
     * @param {Array} circular
     * @param {Number} depth
     * @return {Object}
     * @private
     */
    static _encode(value3, circular, depth = 0) {
      if (++depth >= this.maxDepth) {
        throw new Error("Object too deep");
      }
      const type = Object.prototype.toString.call(value3);
      if (type === "[object Object]" || type === "[object Array]") {
        value3["@c"] = JsonEx._generateId();
        const constructorName = this._getConstructorName(value3);
        if (constructorName !== "Object" && constructorName !== "Array") {
          value3["@"] = constructorName;
        }
        for (let key in value3) {
          if ((!value3.hasOwnProperty || value3.hasOwnProperty(key)) && !key.match(/^@./)) {
            if (value3[key] && typeof value3[key] === "object") {
              if (value3[key]["@c"]) {
                circular.push([key, value3, value3[key]]);
                value3[key] = {
                  "@r": value3[key]["@c"]
                };
              } else {
                value3[key] = this._encode(value3[key], circular, depth + 1);
                if (value3[key] instanceof Array) {
                  circular.push([key, value3, value3[key]]);
                  value3[key] = {
                    "@c": value3[key]["@c"],
                    "@a": value3[key]
                  };
                }
              }
            } else {
              value3[key] = this._encode(value3[key], circular, depth + 1);
            }
          }
        }
      }
      depth--;
      return value3;
    }
    /**
     * @static
     * @method _decode
     * @param {Object} value
     * @param {Array} circular
     * @param {Object} registry
     * @return {Object}
     * @private
     */
    static _decode(value3, circular, registry) {
      const type = Object.prototype.toString.call(value3);
      if (type === "[object Object]" || type === "[object Array]") {
        registry[value3["@c"]] = value3;
        if (value3["@"] === null) {
          value3 = this._resetPrototype(value3, null);
        } else if (value3["@"]) {
          const constructor = window[value3["@"]];
          if (constructor) {
            value3 = this._resetPrototype(value3, constructor.prototype);
          }
        }
        for (let key in value3) {
          if (!value3.hasOwnProperty || value3.hasOwnProperty(key)) {
            if (value3[key] && value3[key]["@a"]) {
              const body = value3[key]["@a"];
              body["@c"] = value3[key]["@c"];
              value3[key] = body;
            }
            if (value3[key] && value3[key]["@r"]) {
              circular.push([key, value3, value3[key]["@r"]]);
            }
            value3[key] = this._decode(value3[key], circular, registry);
          }
        }
      }
      return value3;
    }
    static _generateId() {
      return JsonEx._id++;
    }
    static _restoreCircularReference(circulars) {
      circulars.forEach((circular) => {
        const key = circular[0];
        const value3 = circular[1];
        const content = circular[2];
        value3[key] = content;
      });
    }
    static _linkCircularReference(contents, circulars, registry) {
      circulars.forEach((circular) => {
        const key = circular[0];
        const value3 = circular[1];
        const id = circular[2];
        value3[key] = registry[id];
      });
    }
    static _cleanMetadata(object) {
      if (!object)
        return;
      delete object["@"];
      delete object["@c"];
      if (typeof object === "object") {
        Object.keys(object).forEach((key) => {
          const value3 = object[key];
          if (typeof value3 === "object") {
            JsonEx._cleanMetadata(value3);
          }
        });
      }
    }
    /**
     * @static
     * @method _getConstructorName
     * @param {Object} value
     * @return {String}
     * @private
     */
    static _getConstructorName({ constructor }) {
      if (!constructor) {
        return null;
      }
      let name = constructor.name;
      if (name === void 0) {
        const func = /^\s*function\s*([A-Za-z0-9_$]*)/;
        name = func.exec(constructor)[1];
      }
      return name;
    }
    /**
     * @static
     * @method _resetPrototype
     * @param {Object} value
     * @param {Object} prototype
     * @return {Object}
     * @private
     */
    static _resetPrototype(value3, prototype) {
      if (Object.setPrototypeOf !== void 0 && typeof prototype == "object") {
        Object.setPrototypeOf(value3, prototype);
      } else if ("__proto__" in value3) {
        value3.__proto__ = prototype;
      } else {
        const newValue = Object.create(prototype);
        for (let key in value3) {
          if (value3.hasOwnProperty(key)) {
            newValue[key] = value3[key];
          }
        }
        value3 = newValue;
      }
      return value3;
    }
  };
  JsonEx.maxDepth = 100;
  JsonEx._id = 1;
  var JsonEx_default = JsonEx;

  // src-www/js/rpg_managers/GameStorageManager.js
  var GameStorageManager = class {
    constructor() {
      throw new Error("This is a static class");
    }
    static setupWorker() {
      const worker = new Worker("js/game_storage_worker.js");
      this._worker = new Comlink.wrap(worker);
    }
    static worker() {
      return this._worker;
    }
    static _createWorkerData(savefileId, data) {
      const requestObject = {
        webKey: !this.isLocalMode() ? this.webStorageKey(savefileId) : null,
        id: savefileId,
        data
      };
      return requestObject;
    }
    static async compress(data) {
      const compressed = await this.worker().compress(
        this._createWorkerData(null, data)
      );
      return compressed.result;
    }
    static async decompress(data) {
      const decompressed = await this.worker().decompress(
        Comlink.transfer(this._createWorkerData(null, data), [data.buffer])
      );
      return decompressed.result;
    }
    static save(savefileId, json) {
      if (this.isLocalMode()) {
        this.saveToLocalFile(savefileId, json);
      } else {
        this.saveToWebStorage(savefileId, json);
      }
    }
    static async load(savefileId) {
      if (this.isLocalMode()) {
        return await this.loadFromLocalFile(savefileId);
      } else {
        return await this.loadFromWebStorage(savefileId);
      }
    }
    static async exists(savefileId) {
      if (this.isLocalMode()) {
        return this.localFileExists(savefileId);
      } else {
        return await this.webStorageExists(savefileId);
      }
    }
    static remove(savefileId) {
      if (this.isLocalMode()) {
        this.removeLocalFile(savefileId);
      }
    }
    static async backup(savefileId) {
      if (this.isLocalMode()) {
        if (await this.exists(savefileId)) {
          const data = await this.loadFromLocalFile(savefileId);
          const compressed = await this.compress(data);
          const fs = __require("fs");
          const dirPath = this.localFileDirectoryPath();
          const filePath = `${this.localFilePath(savefileId)}.bak`;
          if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath);
          }
          fs.writeFileSync(filePath, compressed);
        }
      } else {
        this.worker().backupSave(this._createWorkerData(savefileId));
      }
    }
    static backupExists(savefileId) {
      if (this.isLocalMode()) {
        return this.localFileBackupExists(savefileId);
      }
    }
    static cleanBackup(savefileId) {
      if (this.isLocalMode()) {
        if (this.backupExists(savefileId)) {
          const fs = __require("fs");
          const filePath = this.localFilePath(savefileId);
          fs.unlinkSync(`${filePath}.bak`);
        }
      }
    }
    static async restoreBackup(savefileId) {
      if (this.isLocalMode()) {
        if (this.backupExists(savefileId)) {
          const data = await this.loadFromLocalBackupFile(savefileId);
          const compressed = await this.compress(data);
          const fs = __require("fs");
          const dirPath = this.localFileDirectoryPath();
          const filePath = this.localFilePath(savefileId);
          if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath);
          }
          fs.writeFileSync(filePath, compressed);
          fs.unlinkSync(`${filePath}.bak`);
        }
      }
    }
    static async saveToLocalFile(savefileId, json) {
      const data = await this.compress(json);
      const fs = __require("fs");
      const dirPath = this.localFileDirectoryPath();
      const filePath = this.localFilePath(savefileId);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath);
      }
      fs.writeFileSync(filePath, data);
    }
    static async loadFromLocalFile(savefileId) {
      const fs = __require("fs");
      const filePath = this.localFilePath(savefileId);
      if (!fs.existsSync(filePath))
        return null;
      const data = await fs.promises.readFile(filePath);
      return await this.decompress(data);
    }
    static async loadFromLocalBackupFile(savefileId) {
      const fs = __require("fs");
      const filePath = `${this.localFilePath(savefileId)}.bak`;
      if (!fs.existsSync(filePath))
        return null;
      const data = await fs.promises.readFile(filePath);
      return await this.decompress(data);
    }
    static localFileBackupExists(savefileId) {
      const fs = __require("fs");
      return fs.existsSync(`${this.localFilePath(savefileId)}.bak`);
    }
    static localFileExists(savefileId) {
      const fs = __require("fs");
      return fs.existsSync(this.localFilePath(savefileId));
    }
    static removeLocalFile(savefileId) {
      const fs = __require("fs");
      const filePath = this.localFilePath(savefileId);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    static saveToWebStorage(savefileId, json) {
      this.worker().makeSave(this._createWorkerData(savefileId, json));
    }
    static async loadFromWebStorage(savefileId) {
      const request = await this.worker().loadSave(
        this._createWorkerData(savefileId)
      );
      return request.result;
    }
    static async webStorageExists(savefileId) {
      const request = await this.worker().checkSaveExists(
        this._createWorkerData(savefileId)
      );
      return request.result;
    }
    static localFileDirectoryPath() {
      const path = __require("path");
      const base = path.dirname(process.mainModule.filename);
      if (this.canMakeWwwSaveDirectory()) {
        return path.join(base, "save/");
      } else {
        return path.join(path.dirname(base), "save/");
      }
    }
    static localFilePath(savefileId) {
      let name = "";
      if (savefileId < 0) {
        name = "config.rpgsave";
      } else if (savefileId === 0) {
        name = "global.rpgsave";
      } else {
        name = "file%1.rpgsave".format(savefileId);
      }
      return this.localFileDirectoryPath() + name;
    }
    // Enigma Virtual Box cannot make www/save directory
    static canMakeWwwSaveDirectory() {
      if (this._canMakeWwwSaveDirectory === void 0) {
        const fs = __require("fs");
        const path = __require("path");
        const base = path.dirname(process.mainModule.filename);
        const testPath = path.join(base, "testDirectory/");
        try {
          fs.mkdirSync(testPath);
          fs.rmdirSync(testPath);
          this._canMakeWwwSaveDirectory = true;
        } catch (e) {
          this._canMakeWwwSaveDirectory = false;
        }
      }
      return this._canMakeWwwSaveDirectory;
    }
    static isLocalMode() {
      return Utils_default.isNwjs();
    }
    // Can be customized by plugins to create a unique web key
    static uniqueKey() {
      return "RPGMV";
    }
    static webStorageKey(savefileId) {
      if (savefileId < 0) {
        return this.uniqueKey() + " Config";
      } else if (savefileId === 0) {
        return this.uniqueKey() + " Global";
      } else {
        return this.uniqueKey() + " File%1".format(savefileId);
      }
    }
  };
  GameStorageManager.setupWorker();
  var GameStorageManager_default = GameStorageManager;

  // src-www/js/rpg_managers/TextManager.js
  var TextManager = class {
    constructor() {
      throw new Error("This is a static class");
    }
    static basic(basicId) {
      return self.$dataSystem.terms.basic[basicId] || "";
    }
    static param(paramId) {
      return self.$dataSystem.terms.params[paramId] || "";
    }
    static command(commandId) {
      return self.$dataSystem.terms.commands[commandId] || "";
    }
    static message(messageId) {
      return self.$dataSystem.terms.messages[messageId] || "";
    }
    static getter(method, param) {
      return {
        get() {
          return this[method](param);
        },
        configurable: true
      };
    }
  };
  Object.defineProperty(TextManager, "currencyUnit", {
    get() {
      return self.$dataSystem.currencyUnit;
    },
    configurable: true
  });
  Object.defineProperties(TextManager, {
    level: TextManager.getter("basic", 0),
    levelA: TextManager.getter("basic", 1),
    hp: TextManager.getter("basic", 2),
    hpA: TextManager.getter("basic", 3),
    mp: TextManager.getter("basic", 4),
    mpA: TextManager.getter("basic", 5),
    tp: TextManager.getter("basic", 6),
    tpA: TextManager.getter("basic", 7),
    exp: TextManager.getter("basic", 8),
    expA: TextManager.getter("basic", 9),
    fight: TextManager.getter("command", 0),
    escape: TextManager.getter("command", 1),
    attack: TextManager.getter("command", 2),
    guard: TextManager.getter("command", 3),
    item: TextManager.getter("command", 4),
    skill: TextManager.getter("command", 5),
    equip: TextManager.getter("command", 6),
    status: TextManager.getter("command", 7),
    formation: TextManager.getter("command", 8),
    save: TextManager.getter("command", 9),
    gameEnd: TextManager.getter("command", 10),
    options: TextManager.getter("command", 11),
    weapon: TextManager.getter("command", 12),
    armor: TextManager.getter("command", 13),
    keyItem: TextManager.getter("command", 14),
    equip2: TextManager.getter("command", 15),
    optimize: TextManager.getter("command", 16),
    clear: TextManager.getter("command", 17),
    newGame: TextManager.getter("command", 18),
    continue_: TextManager.getter("command", 19),
    toTitle: TextManager.getter("command", 21),
    cancel: TextManager.getter("command", 22),
    buy: TextManager.getter("command", 24),
    sell: TextManager.getter("command", 25),
    alwaysDash: TextManager.getter("message", "alwaysDash"),
    commandRemember: TextManager.getter("message", "commandRemember"),
    bgmVolume: TextManager.getter("message", "bgmVolume"),
    bgsVolume: TextManager.getter("message", "bgsVolume"),
    meVolume: TextManager.getter("message", "meVolume"),
    seVolume: TextManager.getter("message", "seVolume"),
    possession: TextManager.getter("message", "possession"),
    expTotal: TextManager.getter("message", "expTotal"),
    expNext: TextManager.getter("message", "expNext"),
    saveMessage: TextManager.getter("message", "saveMessage"),
    loadMessage: TextManager.getter("message", "loadMessage"),
    file: TextManager.getter("message", "file"),
    partyName: TextManager.getter("message", "partyName"),
    emerge: TextManager.getter("message", "emerge"),
    preemptive: TextManager.getter("message", "preemptive"),
    surprise: TextManager.getter("message", "surprise"),
    escapeStart: TextManager.getter("message", "escapeStart"),
    escapeFailure: TextManager.getter("message", "escapeFailure"),
    victory: TextManager.getter("message", "victory"),
    defeat: TextManager.getter("message", "defeat"),
    obtainExp: TextManager.getter("message", "obtainExp"),
    obtainGold: TextManager.getter("message", "obtainGold"),
    obtainItem: TextManager.getter("message", "obtainItem"),
    levelUp: TextManager.getter("message", "levelUp"),
    obtainSkill: TextManager.getter("message", "obtainSkill"),
    useItem: TextManager.getter("message", "useItem"),
    criticalToEnemy: TextManager.getter("message", "criticalToEnemy"),
    criticalToActor: TextManager.getter("message", "criticalToActor"),
    actorDamage: TextManager.getter("message", "actorDamage"),
    actorRecovery: TextManager.getter("message", "actorRecovery"),
    actorGain: TextManager.getter("message", "actorGain"),
    actorLoss: TextManager.getter("message", "actorLoss"),
    actorDrain: TextManager.getter("message", "actorDrain"),
    actorNoDamage: TextManager.getter("message", "actorNoDamage"),
    actorNoHit: TextManager.getter("message", "actorNoHit"),
    enemyDamage: TextManager.getter("message", "enemyDamage"),
    enemyRecovery: TextManager.getter("message", "enemyRecovery"),
    enemyGain: TextManager.getter("message", "enemyGain"),
    enemyLoss: TextManager.getter("message", "enemyLoss"),
    enemyDrain: TextManager.getter("message", "enemyDrain"),
    enemyNoDamage: TextManager.getter("message", "enemyNoDamage"),
    enemyNoHit: TextManager.getter("message", "enemyNoHit"),
    evasion: TextManager.getter("message", "evasion"),
    magicEvasion: TextManager.getter("message", "magicEvasion"),
    magicReflection: TextManager.getter("message", "magicReflection"),
    counterAttack: TextManager.getter("message", "counterAttack"),
    substitute: TextManager.getter("message", "substitute"),
    buffAdd: TextManager.getter("message", "buffAdd"),
    debuffAdd: TextManager.getter("message", "debuffAdd"),
    buffRemove: TextManager.getter("message", "buffRemove"),
    actionFailure: TextManager.getter("message", "actionFailure")
  });
  var TextManager_default = TextManager;

  // src-www/js/rpg_managers/SoundManager.js
  var SoundManager = class {
    constructor() {
      throw new Error("This is a static class");
    }
    static preloadImportantSounds() {
      this.loadSystemSound(0);
      this.loadSystemSound(1);
      this.loadSystemSound(2);
      this.loadSystemSound(3);
    }
    static playCursor() {
      this.playSystemSound(0);
    }
    static playOk() {
      this.playSystemSound(1);
    }
    static playCancel() {
      this.playSystemSound(2);
    }
    static playBuzzer() {
      this.playSystemSound(3);
    }
    static playEquip() {
      this.playSystemSound(4);
    }
    static playSave() {
      this.playSystemSound(5);
    }
    static playLoad() {
      this.playSystemSound(6);
    }
    static playBattleStart() {
      this.playSystemSound(7);
    }
    static playEscape() {
      this.playSystemSound(8);
    }
    static playEnemyAttack() {
      this.playSystemSound(9);
    }
    static playEnemyDamage() {
      this.playSystemSound(10);
    }
    static playEnemyCollapse() {
      this.playSystemSound(11);
    }
    static playBossCollapse1() {
      this.playSystemSound(12);
    }
    static playBossCollapse2() {
      this.playSystemSound(13);
    }
    static playActorDamage() {
      this.playSystemSound(14);
    }
    static playActorCollapse() {
      this.playSystemSound(15);
    }
    static playRecovery() {
      this.playSystemSound(16);
    }
    static playMiss() {
      this.playSystemSound(17);
    }
    static playEvasion() {
      this.playSystemSound(18);
    }
    static playMagicEvasion() {
      this.playSystemSound(19);
    }
    static playReflection() {
      this.playSystemSound(20);
    }
    static playShop() {
      this.playSystemSound(21);
    }
    static playUseItem() {
      this.playSystemSound(22);
    }
    static playUseSkill() {
      this.playSystemSound(23);
    }
    static loadSystemSound(n) {
      if (self.$dataSystem) {
        AudioManager_default.loadStaticSe(self.$dataSystem.sounds[n]);
      }
    }
    static playSystemSound(n) {
      if (self.$dataSystem) {
        AudioManager_default.playStaticSe(self.$dataSystem.sounds[n]);
      }
    }
  };
  var SoundManager_default = SoundManager;

  // src-www/js/rpg_objects/Game_Item.js
  var Game_Item = class {
    constructor(...args) {
      this.initialize(...args);
    }
    initialize(item2) {
      this._dataClass = "";
      this._itemId = 0;
      if (item2) {
        this.setObject(item2);
      }
    }
    isSkill() {
      return this._dataClass === "skill";
    }
    isItem() {
      return this._dataClass === "item";
    }
    isUsableItem() {
      return this.isSkill() || this.isItem();
    }
    isWeapon() {
      return this._dataClass === "weapon";
    }
    isArmor() {
      return this._dataClass === "armor";
    }
    isEquipItem() {
      return this.isWeapon() || this.isArmor();
    }
    isNull() {
      return this._dataClass === "";
    }
    itemId() {
      return this._itemId;
    }
    object() {
      if (this.isSkill()) {
        return self.$dataSkills[this._itemId];
      } else if (this.isItem()) {
        return self.$dataItems[this._itemId];
      } else if (this.isWeapon()) {
        return self.$dataWeapons[this._itemId];
      } else if (this.isArmor()) {
        return self.$dataArmors[this._itemId];
      } else {
        return null;
      }
    }
    setObject(item2) {
      if (DataManager.isSkill(item2)) {
        this._dataClass = "skill";
      } else if (DataManager.isItem(item2)) {
        this._dataClass = "item";
      } else if (DataManager.isWeapon(item2)) {
        this._dataClass = "weapon";
      } else if (DataManager.isArmor(item2)) {
        this._dataClass = "armor";
      } else {
        this._dataClass = "";
      }
      this._itemId = item2 ? item2.id : 0;
    }
    setEquip(isWeapon, itemId) {
      this._dataClass = isWeapon ? "weapon" : "armor";
      this._itemId = itemId;
    }
  };
  var Game_Item_default = Game_Item;

  // src-www/js/rpg_objects/Game_Action.js
  var _Game_Action = class {
    constructor(...args) {
      this.initialize(...args);
    }
    initialize(subject, forcing) {
      this._subjectActorId = 0;
      this._subjectEnemyIndex = -1;
      this._forcing = forcing || false;
      this.setSubject(subject);
      this.clear();
    }
    clear() {
      this._item = new Game_Item_default();
      this._targetIndex = -1;
    }
    setSubject(subject) {
      if (subject.isActor()) {
        this._subjectActorId = subject.actorId();
        this._subjectEnemyIndex = -1;
      } else {
        this._subjectEnemyIndex = subject.index();
        this._subjectActorId = 0;
      }
    }
    subject() {
      if (this._subjectActorId > 0) {
        return self.$gameActors.actor(this._subjectActorId);
      } else {
        return self.$gameTroop.members()[this._subjectEnemyIndex];
      }
    }
    friendsUnit() {
      return this.subject().friendsUnit();
    }
    opponentsUnit() {
      return this.subject().opponentsUnit();
    }
    setEnemyAction(action) {
      if (action) {
        this.setSkill(action.skillId);
      } else {
        this.clear();
      }
    }
    setAttack() {
      this.setSkill(this.subject().attackSkillId());
    }
    setGuard() {
      this.setSkill(this.subject().guardSkillId());
    }
    setSkill(skillId) {
      this._item.setObject(self.$dataSkills[skillId]);
    }
    setItem(itemId) {
      this._item.setObject(self.$dataItems[itemId]);
    }
    setItemObject(object) {
      this._item.setObject(object);
    }
    setTarget(targetIndex) {
      this._targetIndex = targetIndex;
    }
    item() {
      return this._item.object();
    }
    isSkill() {
      return this._item.isSkill();
    }
    isItem() {
      return this._item.isItem();
    }
    numRepeats() {
      let repeats = this.item().repeats;
      if (this.isAttack()) {
        repeats += this.subject().attackTimesAdd();
      }
      return Math.floor(repeats);
    }
    checkItemScope(list) {
      return list.contains(this.item().scope);
    }
    isForOpponent() {
      return this.checkItemScope([1, 2, 3, 4, 5, 6]);
    }
    isForFriend() {
      return this.checkItemScope([7, 8, 9, 10, 11]);
    }
    isForDeadFriend() {
      return this.checkItemScope([9, 10]);
    }
    isForUser() {
      return this.checkItemScope([11]);
    }
    isForOne() {
      return this.checkItemScope([1, 3, 7, 9, 11]);
    }
    isForRandom() {
      return this.checkItemScope([3, 4, 5, 6]);
    }
    isForAll() {
      return this.checkItemScope([2, 8, 10]);
    }
    needsSelection() {
      return this.checkItemScope([1, 7, 9]);
    }
    numTargets() {
      return this.isForRandom() ? this.item().scope - 2 : 0;
    }
    checkDamageType(list) {
      return list.contains(this.item().damage.type);
    }
    isHpEffect() {
      return this.checkDamageType([1, 3, 5]);
    }
    isMpEffect() {
      return this.checkDamageType([2, 4, 6]);
    }
    isDamage() {
      return this.checkDamageType([1, 2]);
    }
    isRecover() {
      return this.checkDamageType([3, 4]);
    }
    isDrain() {
      return this.checkDamageType([5, 6]);
    }
    isHpRecover() {
      return this.checkDamageType([3]);
    }
    isMpRecover() {
      return this.checkDamageType([4]);
    }
    isCertainHit() {
      return this.item().hitType === _Game_Action.HITTYPE_CERTAIN;
    }
    isPhysical() {
      return this.item().hitType === _Game_Action.HITTYPE_PHYSICAL;
    }
    isMagical() {
      return this.item().hitType === _Game_Action.HITTYPE_MAGICAL;
    }
    isAttack() {
      return this.item() === self.$dataSkills[this.subject().attackSkillId()];
    }
    isGuard() {
      return this.item() === self.$dataSkills[this.subject().guardSkillId()];
    }
    isMagicSkill() {
      if (this.isSkill()) {
        return self.$dataSystem.magicSkills.contains(this.item().stypeId);
      } else {
        return false;
      }
    }
    decideRandomTarget() {
      let target2;
      if (this.isForDeadFriend()) {
        target2 = this.friendsUnit().randomDeadTarget();
      } else if (this.isForFriend()) {
        target2 = this.friendsUnit().randomTarget();
      } else {
        target2 = this.opponentsUnit().randomTarget();
      }
      if (target2) {
        this._targetIndex = target2.index();
      } else {
        this.clear();
      }
    }
    setConfusion() {
      this.setAttack();
    }
    prepare() {
      if (this.subject().isConfused() && !this._forcing) {
        this.setConfusion();
      }
    }
    isValid() {
      return this._forcing && this.item() || this.subject().canUse(this.item());
    }
    speed() {
      const agi = this.subject().agi;
      let speed = agi + Math.randomInt(Math.floor(5 + agi / 4));
      if (this.item()) {
        speed += this.item().speed;
      }
      if (this.isAttack()) {
        speed += this.subject().attackSpeed();
      }
      return speed;
    }
    makeTargets() {
      let targets = [];
      if (!this._forcing && this.subject().isConfused()) {
        targets = [this.confusionTarget()];
      } else if (this.isForOpponent()) {
        targets = this.targetsForOpponents();
      } else if (this.isForFriend()) {
        targets = this.targetsForFriends();
      }
      return this.repeatTargets(targets);
    }
    repeatTargets(targets) {
      const repeatedTargets = [];
      const repeats = this.numRepeats();
      for (const target2 of targets) {
        if (target2) {
          for (let j = 0; j < repeats; j++) {
            repeatedTargets.push(target2);
          }
        }
      }
      return repeatedTargets;
    }
    confusionTarget() {
      switch (this.subject().confusionLevel()) {
        case 1:
          return this.opponentsUnit().randomTarget();
        case 2:
          if (Math.randomInt(2) === 0) {
            return this.opponentsUnit().randomTarget();
          }
          return this.friendsUnit().randomTarget();
        default:
          return this.friendsUnit().randomTarget();
      }
    }
    targetsForOpponents() {
      let targets = [];
      const unit = this.opponentsUnit();
      if (this.isForRandom()) {
        for (let i = 0; i < this.numTargets(); i++) {
          targets.push(unit.randomTarget());
        }
      } else if (this.isForOne()) {
        if (this._targetIndex < 0) {
          targets.push(unit.randomTarget());
        } else {
          targets.push(unit.smoothTarget(this._targetIndex));
        }
      } else {
        targets = unit.aliveMembers();
      }
      return targets;
    }
    targetsForFriends() {
      let targets = [];
      const unit = this.friendsUnit();
      if (this.isForUser()) {
        return [this.subject()];
      } else if (this.isForDeadFriend()) {
        if (this.isForOne()) {
          targets.push(unit.smoothDeadTarget(this._targetIndex));
        } else {
          targets = unit.deadMembers();
        }
      } else if (this.isForOne()) {
        if (this._targetIndex < 0) {
          targets.push(unit.randomTarget());
        } else {
          targets.push(unit.smoothTarget(this._targetIndex));
        }
      } else {
        targets = unit.aliveMembers();
      }
      return targets;
    }
    evaluate() {
      let value3 = 0;
      this.itemTargetCandidates().forEach(function(target2) {
        const targetValue = this.evaluateWithTarget(target2);
        if (this.isForAll()) {
          value3 += targetValue;
        } else if (targetValue > value3) {
          value3 = targetValue;
          this._targetIndex = target2.index();
        }
      }, this);
      value3 *= this.numRepeats();
      if (value3 > 0) {
        value3 += Math.random();
      }
      return value3;
    }
    itemTargetCandidates() {
      if (!this.isValid()) {
        return [];
      } else if (this.isForOpponent()) {
        return this.opponentsUnit().aliveMembers();
      } else if (this.isForUser()) {
        return [this.subject()];
      } else if (this.isForDeadFriend()) {
        return this.friendsUnit().deadMembers();
      } else {
        return this.friendsUnit().aliveMembers();
      }
    }
    evaluateWithTarget(target2) {
      if (this.isHpEffect()) {
        const value3 = this.makeDamageValue(target2, false);
        if (this.isForOpponent()) {
          return value3 / Math.max(target2.hp, 1);
        } else {
          const recovery = Math.min(-value3, target2.mhp - target2.hp);
          return recovery / target2.mhp;
        }
      }
    }
    testApply(target2) {
      return this.isForDeadFriend() === target2.isDead() && (self.$gameParty.inBattle() || this.isForOpponent() || this.isHpRecover() && target2.hp < target2.mhp || this.isMpRecover() && target2.mp < target2.mmp || this.hasItemAnyValidEffects(target2));
    }
    hasItemAnyValidEffects(target2) {
      return this.item().effects.some(function(effect) {
        return this.testItemEffect(target2, effect);
      }, this);
    }
    testItemEffect(target2, { code, value1: value12, value2: value22, dataId }) {
      switch (code) {
        case _Game_Action.EFFECT_RECOVER_HP:
          return target2.hp < target2.mhp || value12 < 0 || value22 < 0;
        case _Game_Action.EFFECT_RECOVER_MP:
          return target2.mp < target2.mmp || value12 < 0 || value22 < 0;
        case _Game_Action.EFFECT_ADD_STATE:
          return !target2.isStateAffected(dataId);
        case _Game_Action.EFFECT_REMOVE_STATE:
          return target2.isStateAffected(dataId);
        case _Game_Action.EFFECT_ADD_BUFF:
          return !target2.isMaxBuffAffected(dataId);
        case _Game_Action.EFFECT_ADD_DEBUFF:
          return !target2.isMaxDebuffAffected(dataId);
        case _Game_Action.EFFECT_REMOVE_BUFF:
          return target2.isBuffAffected(dataId);
        case _Game_Action.EFFECT_REMOVE_DEBUFF:
          return target2.isDebuffAffected(dataId);
        case _Game_Action.EFFECT_LEARN_SKILL:
          return target2.isActor() && !target2.isLearnedSkill(dataId);
        default:
          return true;
      }
    }
    itemCnt(target2) {
      if (this.isPhysical() && target2.canMove()) {
        return target2.cnt;
      } else {
        return 0;
      }
    }
    itemMrf({ mrf }) {
      if (this.isMagical()) {
        return mrf;
      } else {
        return 0;
      }
    }
    itemHit(target2) {
      if (this.isPhysical()) {
        return this.item().successRate * 0.01 * this.subject().hit;
      } else {
        return this.item().successRate * 0.01;
      }
    }
    itemEva({ eva, mev }) {
      if (this.isPhysical()) {
        return eva;
      } else if (this.isMagical()) {
        return mev;
      } else {
        return 0;
      }
    }
    itemCri({ cev }) {
      return this.item().damage.critical ? this.subject().cri * (1 - cev) : 0;
    }
    apply(target2) {
      const result2 = target2.result();
      this.subject().clearResult();
      result2.clear();
      result2.used = this.testApply(target2);
      result2.missed = this.processItemHitFormula(result2, target2);
      result2.evaded = this.processItemEvaFormula(result2, target2);
      result2.physical = this.isPhysical();
      result2.drain = this.isDrain();
      if (result2.isHit()) {
        if (this.item().damage.type > 0) {
          result2.critical = this.processItemCriFormula(result2, target2);
          const value3 = this.makeDamageValue(target2, result2.critical);
          this.executeDamage(target2, value3);
          this.subject().onApplyDamage(this, target2, value3);
          target2.onReceiveDamage(this, this.subject(), value3);
          if (result2.critical) {
            this.subject().onApplyCritical(this, target2, value3);
            target2.onReceiveCritical(this, this.subject(), value3);
          }
        }
        this.item().effects.forEach(function(effect) {
          this.applyItemEffect(target2, effect);
        }, this);
        this.applyItemUserEffect(target2);
      } else {
        this.subject().onHitAction(this, target2);
        target2.onEvadeAction(this, this.subject());
      }
    }
    processItemHitFormula(result2, target2) {
      return result2.used && Math.random() >= this.itemHit(target2);
    }
    processItemEvaFormula(result2, target2) {
      return !result2.missed && Math.random() < this.itemEva(target2);
    }
    processItemCriFormula(result2, target2) {
      return Math.random() < this.itemCri(target2);
    }
    makeDamageValue(target2, critical) {
      const item2 = this.item();
      const baseValue = this.evalDamageFormula(target2);
      let value3 = this.processElementalDamage(item2, baseValue, target2, critical);
      if (this.isPhysical()) {
        value3 = this.processPhysicalDamage(item2, value3, target2, critical);
      }
      if (this.isMagical()) {
        value3 = this.processMagicalDamage(item2, value3, target2, critical);
      }
      if (baseValue < 0) {
        value3 = this.processRecoveryDamage(item2, value3, target2, critical);
      }
      if (critical) {
        value3 = this.processCriticalDamage(item2, value3, target2, critical);
      }
      value3 = this.processVarianceDamage(item2, value3, target2, critical);
      value3 = this.processGuardDamage(item2, value3, target2, critical);
      value3 = this.processDamageEnd(item2, value3, target2, critical);
      return value3;
    }
    processElementalDamage(item2, value3, target2, critical) {
      return value3 * this.calcElementRate(target2);
    }
    processPhysicalDamage(item2, value3, target2, critical) {
      return value3 *= target2.pdr;
    }
    processMagicalDamage(item2, value3, target2, critical) {
      return value3 *= target2.mdr;
    }
    processRecoveryDamage(item2, value3, target2, critical) {
      return value3 *= target2.rec;
    }
    processCriticalDamage(item2, value3, target2, critical) {
      return this.applyCritical(value3);
    }
    processVarianceDamage(item2, value3, target2, critical) {
      return this.applyVariance(value3, item2.damage.variance);
    }
    processGuardDamage(item2, value3, target2, critical) {
      return this.applyGuard(value3, target2);
    }
    processDamageEnd(item2, value3, target2, critical) {
      return Math.round(value3);
    }
    evalDamageFormula(target) {
      try {
        const item = this.item();
        const a = this.subject();
        const b = target;
        const v = self.$gameVariables._data;
        const sign = [3, 4].contains(item.damage.type) ? -1 : 1;
        let value = Math.max(eval(item.damage.formula), 0) * sign;
        if (isNaN(value))
          value = 0;
        return value;
      } catch (e) {
        return 0;
      }
    }
    calcElementRate(target2) {
      if (this.item().damage.elementId < 0) {
        return this.elementsMaxRate(target2, this.subject().attackElements());
      } else {
        return target2.elementRate(this.item().damage.elementId);
      }
    }
    elementsMaxRate(target2, elements) {
      if (elements.length > 0) {
        return Math.max.apply(
          null,
          elements.map((elementId) => target2.elementRate(elementId), this)
        );
      } else {
        return 1;
      }
    }
    applyCritical(damage) {
      return damage * 3;
    }
    applyVariance(damage, variance) {
      const amp = Math.floor(Math.max(Math.abs(damage) * variance / 100, 0));
      const v2 = Math.randomInt(amp + 1) + Math.randomInt(amp + 1) - amp;
      return damage >= 0 ? damage + v2 : damage - v2;
    }
    applyGuard(damage, target2) {
      return damage / (damage > 0 && target2.isGuard() ? 2 * target2.grd : 1);
    }
    executeDamage(target2, value3) {
      const result2 = target2.result();
      if (value3 === 0) {
        result2.critical = false;
      }
      if (this.isHpEffect()) {
        this.executeHpDamage(target2, value3);
      }
      if (this.isMpEffect()) {
        this.executeMpDamage(target2, value3);
      }
    }
    executeHpDamage(target2, value3) {
      if (this.isDrain()) {
        value3 = Math.min(target2.hp, value3);
      }
      this.makeSuccess(target2);
      target2.gainHp(-value3);
      if (value3 > 0) {
        target2.onDamage(value3);
      }
      this.gainDrainedHp(value3);
    }
    executeMpDamage(target2, value3) {
      if (!this.isMpRecover()) {
        value3 = Math.min(target2.mp, value3);
      }
      if (value3 !== 0) {
        this.makeSuccess(target2);
      }
      target2.gainMp(-value3);
      this.gainDrainedMp(value3);
    }
    gainDrainedHp(value3) {
      if (this.isDrain()) {
        let gainTarget = this.subject();
        if (this._reflectionTarget !== void 0) {
          gainTarget = this._reflectionTarget;
        }
        gainTarget.gainHp(value3);
      }
    }
    gainDrainedMp(value3) {
      if (this.isDrain()) {
        let gainTarget = this.subject();
        if (this._reflectionTarget !== void 0) {
          gainTarget = this._reflectionTarget;
        }
        gainTarget.gainMp(value3);
      }
    }
    applyItemEffect(target2, effect) {
      switch (effect.code) {
        case _Game_Action.EFFECT_RECOVER_HP:
          this.itemEffectRecoverHp(target2, effect);
          break;
        case _Game_Action.EFFECT_RECOVER_MP:
          this.itemEffectRecoverMp(target2, effect);
          break;
        case _Game_Action.EFFECT_GAIN_TP:
          this.itemEffectGainTp(target2, effect);
          break;
        case _Game_Action.EFFECT_ADD_STATE:
          this.itemEffectAddState(target2, effect);
          break;
        case _Game_Action.EFFECT_REMOVE_STATE:
          this.itemEffectRemoveState(target2, effect);
          break;
        case _Game_Action.EFFECT_ADD_BUFF:
          this.itemEffectAddBuff(target2, effect);
          break;
        case _Game_Action.EFFECT_ADD_DEBUFF:
          this.itemEffectAddDebuff(target2, effect);
          break;
        case _Game_Action.EFFECT_REMOVE_BUFF:
          this.itemEffectRemoveBuff(target2, effect);
          break;
        case _Game_Action.EFFECT_REMOVE_DEBUFF:
          this.itemEffectRemoveDebuff(target2, effect);
          break;
        case _Game_Action.EFFECT_SPECIAL:
          this.itemEffectSpecial(target2, effect);
          break;
        case _Game_Action.EFFECT_GROW:
          this.itemEffectGrow(target2, effect);
          break;
        case _Game_Action.EFFECT_LEARN_SKILL:
          this.itemEffectLearnSkill(target2, effect);
          break;
        case _Game_Action.EFFECT_COMMON_EVENT:
          this.itemEffectCommonEvent(target2, effect);
          break;
      }
    }
    itemEffectRecoverHp(target2, { value1: value12, value2: value22 }) {
      let value3 = (target2.mhp * value12 + value22) * target2.rec;
      if (this.isItem()) {
        value3 *= this.subject().pha;
      }
      value3 = Math.floor(value3);
      if (value3 !== 0) {
        target2.gainHp(value3);
        this.makeSuccess(target2);
      }
    }
    itemEffectRecoverMp(target2, { value1: value12, value2: value22 }) {
      let value3 = (target2.mmp * value12 + value22) * target2.rec;
      if (this.isItem()) {
        value3 *= this.subject().pha;
      }
      value3 = Math.floor(value3);
      if (value3 !== 0) {
        target2.gainMp(value3);
        this.makeSuccess(target2);
      }
    }
    itemEffectGainTp(target2, { value1: value12 }) {
      const value3 = Math.floor(value12);
      if (value3 !== 0) {
        target2.gainTp(value3);
        this.makeSuccess(target2);
      }
    }
    itemEffectAddState(target2, effect) {
      if (effect.dataId === 0) {
        this.itemEffectAddAttackState(target2, effect);
      } else {
        this.itemEffectAddNormalState(target2, effect);
      }
    }
    itemEffectAddAttackState(target2, { value1: value12 }) {
      this.subject().attackStates().forEach((stateId) => {
        let chance = value12;
        chance *= target2.stateRate(stateId);
        chance *= this.subject().attackStatesRate(stateId);
        chance *= this.lukEffectRate(target2);
        if (Math.random() < chance) {
          target2.addState(stateId, this.subject());
          this.makeSuccess(target2);
        }
      }, target2);
    }
    itemEffectAddNormalState(target2, { value1: value12, dataId }) {
      let chance = value12;
      if (!this.isCertainHit()) {
        chance *= target2.stateRate(dataId);
        chance *= this.lukEffectRate(target2);
      }
      if (Math.random() < chance) {
        target2.addState(dataId, this.subject());
        this.makeSuccess(target2);
      }
    }
    itemEffectRemoveState(target2, { value1: value12, dataId }) {
      const chance = value12;
      if (Math.random() < chance) {
        target2.removeState(dataId);
        this.makeSuccess(target2);
      }
    }
    itemEffectAddBuff(target2, { dataId, value1: value12 }) {
      target2.addBuff(dataId, value12);
      this.makeSuccess(target2);
    }
    itemEffectAddDebuff(target2, { dataId, value1: value12 }) {
      const chance = target2.debuffRate(dataId) * this.lukEffectRate(target2);
      if (Math.random() < chance) {
        target2.addDebuff(dataId, value12);
        this.makeSuccess(target2);
      }
    }
    itemEffectRemoveBuff(target2, { dataId }) {
      if (target2.isBuffAffected(dataId)) {
        target2.removeBuff(dataId);
        this.makeSuccess(target2);
      }
    }
    itemEffectRemoveDebuff(target2, { dataId }) {
      if (target2.isDebuffAffected(dataId)) {
        target2.removeBuff(dataId);
        this.makeSuccess(target2);
      }
    }
    itemEffectSpecial(target2, { dataId }) {
      if (dataId === _Game_Action.SPECIAL_EFFECT_ESCAPE) {
        target2.escape();
        this.makeSuccess(target2);
      }
    }
    itemEffectGrow(target2, { dataId, value1: value12 }) {
      target2.addParam(dataId, Math.floor(value12));
      this.makeSuccess(target2);
    }
    itemEffectLearnSkill(target2, { dataId }) {
      if (target2.isActor()) {
        target2.learnSkill(dataId);
        this.makeSuccess(target2);
      }
    }
    itemEffectCommonEvent(target2, effect) {
    }
    makeSuccess(target2) {
      target2.result().success = true;
    }
    applyItemUserEffect(target2) {
      const value3 = Math.floor(this.item().tpGain * this.subject().tcr);
      this.subject().gainSilentTp(value3);
    }
    lukEffectRate({ luk }) {
      return Math.max(1 + (this.subject().luk - luk) * 1e-3, 0);
    }
    applyGlobal() {
      this.item().effects.forEach(({ code, dataId }) => {
        if (code === _Game_Action.EFFECT_COMMON_EVENT) {
          self.$gameTemp.reserveCommonEvent(dataId);
        }
      }, this);
    }
  };
  _Game_Action.EFFECT_RECOVER_HP = 11;
  _Game_Action.EFFECT_RECOVER_MP = 12;
  _Game_Action.EFFECT_GAIN_TP = 13;
  _Game_Action.EFFECT_ADD_STATE = 21;
  _Game_Action.EFFECT_REMOVE_STATE = 22;
  _Game_Action.EFFECT_ADD_BUFF = 31;
  _Game_Action.EFFECT_ADD_DEBUFF = 32;
  _Game_Action.EFFECT_REMOVE_BUFF = 33;
  _Game_Action.EFFECT_REMOVE_DEBUFF = 34;
  _Game_Action.EFFECT_SPECIAL = 41;
  _Game_Action.EFFECT_GROW = 42;
  _Game_Action.EFFECT_LEARN_SKILL = 43;
  _Game_Action.EFFECT_COMMON_EVENT = 44;
  _Game_Action.SPECIAL_EFFECT_ESCAPE = 0;
  _Game_Action.HITTYPE_CERTAIN = 0;
  _Game_Action.HITTYPE_PHYSICAL = 1;
  _Game_Action.HITTYPE_MAGICAL = 2;
  var Game_Action_default = _Game_Action;

  // src-www/js/rpg_scenes/Scene_Base.js
  var Scene_Base = class extends Stage_default {
    constructor(...args) {
      super(...args);
      this.initialize(...args);
    }
    /**
     * Create a instance of Scene_Base.
     *
     * @instance
     * @memberof Scene_Base
     */
    initialize() {
      super.initialize();
      this._active = false;
      this._fadeSign = 0;
      this._fadeDuration = 0;
      this._fadeSprite = null;
      this._imageReservationId = Utils_default.generateRuntimeId();
    }
    /**
     * Attach a reservation to the reserve queue.
     *
     * @method attachReservation
     * @instance
     * @memberof Scene_Base
     */
    attachReservation() {
      ImageManager_default.setDefaultReservationId(this._imageReservationId);
    }
    /**
     * Remove the reservation from the Reserve queue.
     *
     * @method detachReservation
     * @instance
     * @memberof Scene_Base
     */
    detachReservation() {
      ImageManager_default.releaseReservation(this._imageReservationId);
    }
    /**
     * Create the components and add them to the rendering process.
     *
     * @method create
     * @instance
     * @memberof Scene_Base
     */
    create() {
    }
    /**
     * Returns whether the scene is active or not.
     *
     * @method isActive
     * @instance
     * @memberof Scene_Base
     * @return {Boolean} return true if the scene is active
     */
    isActive() {
      return this._active;
    }
    /**
     * Return whether the scene is ready to start or not.
     *
     * @method isReady
     * @instance
     * @memberof Scene_Base
     * @return {Boolean} Return true if the scene is ready to start
     */
    isReady() {
      return ImageManager_default.isReady();
    }
    /**
     * Start the scene processing.
     *
     * @method start
     * @instance
     * @memberof Scene_Base
     */
    start() {
      this._active = true;
    }
    /**
     * Update the scene processing each new frame.
     *
     * @method update
     * @instance
     * @memberof Scene_Base
     */
    update() {
      this.updateFade();
      this.updateChildren();
    }
    /**
     * Stop the scene processing.
     *
     * @method stop
     * @instance
     * @memberof Scene_Base
     */
    stop() {
      this._active = false;
    }
    /**
     * Return whether the scene is busy or not.
     *
     * @method isBusy
     * @instance
     * @memberof Scene_Base
     * @return {Boolean} Return true if the scene is currently busy
     */
    isBusy() {
      return this._fadeDuration > 0;
    }
    /**
     * Terminate the scene before switching to a another scene.
     *
     * @method terminate
     * @instance
     * @memberof Scene_Base
     */
    terminate() {
    }
    /**
     * Create the layer for the windows children
     * and add it to the rendering process.
     *
     * @method createWindowLayer
     * @instance
     * @memberof Scene_Base
     */
    createWindowLayer() {
      const width = Graphics_default.boxWidth;
      const height = Graphics_default.boxHeight;
      const x = (Graphics_default.width - width) / 2;
      const y = (Graphics_default.height - height) / 2;
      this._windowLayer = new WindowLayer_default();
      this._windowLayer.move(x, y, width, height);
      this.addChild(this._windowLayer);
    }
    /**
     * Add the children window to the windowLayer processing.
     *
     * @method addWindow
     * @instance
     * @memberof Scene_Base
     */
    addWindow(window2) {
      this._windowLayer.addChild(window2);
    }
    /**
     * Request a fadeIn screen process.
     *
     * @method startFadeIn
     * @param {Number} [duration=30] The time the process will take for fadeIn the screen
     * @param {Boolean} [white=false] If true the fadein will be process with a white color else it's will be black
     *
     * @instance
     * @memberof Scene_Base
     */
    startFadeIn(duration, white) {
      this.createFadeSprite(white);
      this._fadeSign = 1;
      this._fadeDuration = duration || 30;
      this._fadeSprite.opacity = 255;
    }
    /**
     * Request a fadeOut screen process.
     *
     * @method startFadeOut
     * @param {Number} [duration=30] The time the process will take for fadeOut the screen
     * @param {Boolean} [white=false] If true the fadeOut will be process with a white color else it's will be black
     *
     * @instance
     * @memberof Scene_Base
     */
    startFadeOut(duration, white) {
      this.createFadeSprite(white);
      this._fadeSign = -1;
      this._fadeDuration = duration || 30;
      this._fadeSprite.opacity = 0;
    }
    /**
     * Create a Screen sprite for the fadein and fadeOut purpose and
     * add it to the rendering process.
     *
     * @method createFadeSprite
     * @instance
     * @memberof Scene_Base
     */
    createFadeSprite(white) {
      if (!this._fadeSprite) {
        this._fadeSprite = new ScreenSprite_default();
        this.addChild(this._fadeSprite);
      }
      if (white) {
        this._fadeSprite.setWhite();
      } else {
        this._fadeSprite.setBlack();
      }
    }
    /**
     * Update the screen fade processing.
     *
     * @method updateFade
     * @instance
     * @memberof Scene_Base
     */
    updateFade() {
      if (this._fadeDuration > 0) {
        const d = this._fadeDuration;
        if (this._fadeSign > 0) {
          this._fadeSprite.opacity -= this._fadeSprite.opacity / d;
        } else {
          this._fadeSprite.opacity += (255 - this._fadeSprite.opacity) / d;
        }
        this._fadeDuration--;
      }
    }
    /**
     * Update the children of the scene EACH frame.
     *
     * @method updateChildren
     * @instance
     * @memberof Scene_Base
     */
    updateChildren() {
      this.children.forEach((child) => {
        if (child.update) {
          child.update();
        }
      });
    }
    /**
     * Pop the scene from the stack array and switch to the
     * previous scene.
     *
     * @method popScene
     * @instance
     * @memberof Scene_Base
     */
    popScene() {
      SceneManager_default.pop();
    }
    /**
     * Check whether the game should be triggering a gameover.
     *
     * @method checkGameover
     * @instance
     * @memberof Scene_Base
     */
    checkGameover() {
      if (self.$gameParty.isAllDead()) {
        SceneManager_default.goto(Scene_Gameover_default);
      }
    }
    /**
     * Slowly fade out all the visual and audio of the scene.
     *
     * @method fadeOutAll
     * @instance
     * @memberof Scene_Base
     */
    fadeOutAll() {
      const time = this.slowFadeSpeed() / 60;
      AudioManager_default.fadeOutBgm(time);
      AudioManager_default.fadeOutBgs(time);
      AudioManager_default.fadeOutMe(time);
      this.startFadeOut(this.slowFadeSpeed());
    }
    /**
     * Return the screen fade speed value.
     *
     * @method fadeSpeed
     * @instance
     * @memberof Scene_Base
     * @return {Number} Return the fade speed
     */
    fadeSpeed() {
      return 24;
    }
    /**
     * Return a slow screen fade speed value.
     *
     * @method slowFadeSpeed
     * @instance
     * @memberof Scene_Base
     * @return {Number} Return the fade speed
     */
    slowFadeSpeed() {
      return this.fadeSpeed() * 2;
    }
  };
  var Scene_Base_default = Scene_Base;

  // src-www/js/rpg_sprites/Sprite_Picture.js
  var Sprite_Picture = class extends Sprite_default {
    constructor(...args) {
      super(...args);
      this.initialize(...args);
    }
    initialize(pictureId) {
      super.initialize();
      this._pictureId = pictureId;
      this._pictureName = "";
      this.update();
    }
    picture() {
      return self.$gameScreen.picture(this._pictureId);
    }
    update() {
      super.update();
      this.updateBitmap();
      if (this.visible) {
        this.updateOrigin();
        this.updatePosition();
        this.updateScale();
        this.updateTone();
        this.updateOther();
      }
    }
    updateBitmap() {
      const picture = this.picture();
      if (picture) {
        const pictureName = picture.name();
        if (this._pictureName !== pictureName) {
          this._pictureName = pictureName;
          this.loadBitmap();
        }
        this.visible = true;
      } else {
        this._pictureName = "";
        this.bitmap = null;
        this.visible = false;
      }
    }
    updateOrigin() {
      const picture = this.picture();
      if (picture.origin() === 0) {
        this.anchor.x = 0;
        this.anchor.y = 0;
      } else {
        this.anchor.x = 0.5;
        this.anchor.y = 0.5;
      }
    }
    updatePosition() {
      const picture = this.picture();
      this.x = Math.floor(picture.x());
      this.y = Math.floor(picture.y());
    }
    updateScale() {
      const picture = this.picture();
      this.scale.x = picture.scaleX() / 100;
      this.scale.y = picture.scaleY() / 100;
    }
    updateTone() {
      const picture = this.picture();
      if (picture.tone()) {
        this.setColorTone(picture.tone());
      } else {
        this.setColorTone([0, 0, 0, 0]);
      }
    }
    updateOther() {
      const picture = this.picture();
      this.opacity = picture.opacity();
      this.blendMode = picture.blendMode();
      this.rotation = picture.angle() * Math.PI / 180;
    }
    loadBitmap() {
      this.bitmap = ImageManager_default.loadPicture(this._pictureName);
    }
  };
  var Sprite_Picture_default = Sprite_Picture;

  // src-www/js/rpg_sprites/Sprite_Timer.js
  var Sprite_Timer = class extends Sprite_default {
    constructor(...args) {
      super(...args);
      this.initialize(...args);
    }
    initialize() {
      super.initialize();
      this._seconds = 0;
      this.createBitmap();
      this.update();
    }
    createBitmap() {
      this.bitmap = new Bitmap_default(96, 48);
      this.bitmap.fontSize = 32;
    }
    update() {
      super.update();
      this.updateBitmap();
      this.updatePosition();
      this.updateVisibility();
    }
    updateBitmap() {
      if (this._seconds !== self.$gameTimer.seconds()) {
        this._seconds = self.$gameTimer.seconds();
        this.redraw();
      }
    }
    redraw() {
      const text = this.timerText();
      const width = this.bitmap.width;
      const height = this.bitmap.height;
      this.bitmap.clear();
      this.bitmap.drawText(text, 0, 0, width, height, "center");
    }
    timerText() {
      const min = Math.floor(this._seconds / 60) % 60;
      const sec = this._seconds % 60;
      return `${min.padZero(2)}:${sec.padZero(2)}`;
    }
    updatePosition() {
      this.x = Graphics_default.width - this.bitmap.width;
      this.y = 0;
    }
    updateVisibility() {
      this.visible = self.$gameTimer.isWorking();
    }
  };
  var Sprite_Timer_default = Sprite_Timer;

  // src-www/js/rpg_sprites/Spriteset_Base.js
  var Spriteset_Base = class extends Sprite_default {
    constructor(...args) {
      super(...args);
      this.initialize(...args);
    }
    initialize() {
      super.initialize();
      this.setFrame(0, 0, Graphics_default.width, Graphics_default.height);
      this._tone = [0, 0, 0, 0];
      this.opaque = true;
      this.createLowerLayer();
      this.createToneChanger();
      this.createUpperLayer();
      this.update();
    }
    createLowerLayer() {
      this.createBaseSprite();
    }
    createUpperLayer() {
      this.createPictures();
      this.createTimer();
      this.createScreenSprites();
    }
    update() {
      super.update();
      this.updateScreenSprites();
      this.updateToneChanger();
      this.updatePosition();
    }
    createBaseSprite() {
      this._baseSprite = new Sprite_default();
      this._baseSprite.setFrame(0, 0, this.width, this.height);
      this._blackScreen = new ScreenSprite_default();
      this._blackScreen.opacity = 255;
      this.addChild(this._baseSprite);
      this._baseSprite.addChild(this._blackScreen);
    }
    createToneChanger() {
      if (Graphics_default.isWebGL()) {
        this.createWebGLToneChanger();
      } else {
        this.createCanvasToneChanger();
      }
    }
    createWebGLToneChanger() {
      const margin = 48;
      const width = Graphics_default.width + margin * 2;
      const height = Graphics_default.height + margin * 2;
      this._toneFilter = new ToneFilter_default();
      this._toneFilter.enabled = false;
      this._baseSprite.filters = [this._toneFilter];
      this._baseSprite.filterArea = new Rectangle_default(
        -margin,
        -margin,
        width,
        height
      );
    }
    createCanvasToneChanger() {
      this._toneSprite = new ToneSprite_default();
      this.addChild(this._toneSprite);
    }
    createPictures() {
      const width = Graphics_default.boxWidth;
      const height = Graphics_default.boxHeight;
      const x = (Graphics_default.width - width) / 2;
      const y = (Graphics_default.height - height) / 2;
      this._pictureContainer = new Sprite_default();
      this._pictureContainer.setFrame(x, y, width, height);
      for (let i = 1; i <= self.$gameScreen.maxPictures(); i++) {
        this._pictureContainer.addChild(new Sprite_Picture_default(i));
      }
      this.addChild(this._pictureContainer);
    }
    createTimer() {
      this._timerSprite = new Sprite_Timer_default();
      this.addChild(this._timerSprite);
    }
    createScreenSprites() {
      this._flashSprite = new ScreenSprite_default();
      this._fadeSprite = new ScreenSprite_default();
      this.addChild(this._flashSprite);
      this.addChild(this._fadeSprite);
    }
    updateScreenSprites() {
      const color = self.$gameScreen.flashColor();
      this._flashSprite.setColor(color[0], color[1], color[2]);
      this._flashSprite.opacity = color[3];
      this._fadeSprite.opacity = 255 - self.$gameScreen.brightness();
    }
    updateToneChanger() {
      const tone = self.$gameScreen.tone();
      if (!this._tone.equals(tone)) {
        this._tone = tone.clone();
        if (Graphics_default.isWebGL()) {
          this.updateWebGLToneChanger();
        } else {
          this.updateCanvasToneChanger();
        }
      }
    }
    updateWebGLToneChanger() {
      const tone = this._tone;
      this._toneFilter.reset();
      if (tone[0] || tone[1] || tone[2] || tone[3]) {
        this._toneFilter.enabled = true;
        this._toneFilter.adjustTone(tone[0], tone[1], tone[2]);
        this._toneFilter.adjustSaturation(-tone[3]);
      } else {
        this._toneFilter.enabled = false;
      }
    }
    updateCanvasToneChanger() {
      const tone = this._tone;
      this._toneSprite.setTone(tone[0], tone[1], tone[2], tone[3]);
    }
    updatePosition() {
      const screen = self.$gameScreen;
      const scale = screen.zoomScale();
      this.scale.x = scale;
      this.scale.y = scale;
      this.x = Math.round(-screen.zoomX() * (scale - 1));
      this.y = Math.round(-screen.zoomY() * (scale - 1));
      this.x += Math.round(screen.shake());
    }
  };
  var Spriteset_Base_default = Spriteset_Base;

  // src-www/js/rpg_sprites/Sprite_Animation.js
  var Sprite_Animation = class extends Sprite_default {
    constructor(...args) {
      super(...args);
      this.initialize(...args);
    }
    initialize() {
      super.initialize();
      this._reduceArtifacts = true;
      this.initMembers();
    }
    initMembers() {
      this._target = null;
      this._animation = null;
      this._mirror = false;
      this._delay = 0;
      this._rate = 4;
      this._duration = 0;
      this._flashColor = [0, 0, 0, 0];
      this._flashDuration = 0;
      this._screenFlashDuration = 0;
      this._hidingDuration = 0;
      this._bitmap1 = null;
      this._bitmap2 = null;
      this._cellSprites = [];
      this._screenFlashSprite = null;
      this._duplicated = false;
      this.z = 8;
    }
    setup(target2, animation, mirror, delay) {
      this._target = target2;
      this._animation = animation;
      this._mirror = mirror;
      this._delay = delay;
      if (this._animation) {
        this.remove();
        this.setupRate();
        this.setupDuration();
        this.loadBitmaps();
        this.createSprites();
      }
    }
    remove() {
      if (this.parent && this.parent.removeChild(this)) {
        this._target.setBlendColor([0, 0, 0, 0]);
        this._target.show();
      }
    }
    setupRate() {
      this._rate = 4;
    }
    setupDuration() {
      this._duration = this._animation.frames.length * this._rate + 1;
    }
    update() {
      super.update();
      this.updateMain();
      this.updateFlash();
      this.updateScreenFlash();
      this.updateHiding();
      Sprite_Animation._checker1 = {};
      Sprite_Animation._checker2 = {};
    }
    updateFlash() {
      if (this._flashDuration > 0) {
        const d = this._flashDuration--;
        this._flashColor[3] *= (d - 1) / d;
        this._target.setBlendColor(this._flashColor);
      }
    }
    updateScreenFlash() {
      if (this._screenFlashDuration > 0) {
        const d = this._screenFlashDuration--;
        if (this._screenFlashSprite) {
          this._screenFlashSprite.x = -this.absoluteX();
          this._screenFlashSprite.y = -this.absoluteY();
          this._screenFlashSprite.opacity *= (d - 1) / d;
          this._screenFlashSprite.visible = this._screenFlashDuration > 0;
        }
      }
    }
    absoluteX() {
      let x = 0;
      let object = this;
      while (object) {
        x += object.x;
        object = object.parent;
      }
      return x;
    }
    absoluteY() {
      let y = 0;
      let object = this;
      while (object) {
        y += object.y;
        object = object.parent;
      }
      return y;
    }
    updateHiding() {
      if (this._hidingDuration > 0) {
        this._hidingDuration--;
        if (this._hidingDuration === 0) {
          this._target.show();
        }
      }
    }
    isPlaying() {
      return this._duration > 0;
    }
    loadBitmaps() {
      const name1 = this._animation.animation1Name;
      const name2 = this._animation.animation2Name;
      const hue1 = this._animation.animation1Hue;
      const hue2 = this._animation.animation2Hue;
      this._bitmap1 = ImageManager_default.loadAnimation(name1, hue1);
      this._bitmap2 = ImageManager_default.loadAnimation(name2, hue2);
    }
    isReady() {
      return this._bitmap1 && this._bitmap1.isReady() && this._bitmap2 && this._bitmap2.isReady();
    }
    createSprites() {
      if (!Sprite_Animation._checker2[this._animation]) {
        this.createCellSprites();
        if (this._animation.position === 3) {
          Sprite_Animation._checker2[this._animation] = true;
        }
        this.createScreenFlashSprite();
      }
      if (Sprite_Animation._checker1[this._animation]) {
        this._duplicated = true;
      } else {
        this._duplicated = false;
        if (this._animation.position === 3) {
          Sprite_Animation._checker1[this._animation] = true;
        }
      }
    }
    createCellSprites() {
      this._cellSprites = [];
      for (let i = 0; i < 16; i++) {
        const sprite = new Sprite_default();
        sprite.anchor.x = 0.5;
        sprite.anchor.y = 0.5;
        this._cellSprites.push(sprite);
        this.addChild(sprite);
      }
    }
    createScreenFlashSprite() {
      this._screenFlashSprite = new ScreenSprite_default();
      this.addChild(this._screenFlashSprite);
    }
    updateMain() {
      if (this.isPlaying() && this.isReady()) {
        if (this._delay > 0) {
          this._delay--;
        } else {
          this._duration--;
          this.updatePosition();
          if (this._duration % this._rate === 0) {
            this.updateFrame();
          }
        }
      }
    }
    updatePosition() {
      if (this._animation.position === 3) {
        this.x = this.parent.width / 2;
        this.y = this.parent.height / 2;
      } else {
        const parent = this._target.parent;
        const grandparent = parent ? parent.parent : null;
        this.x = this._target.x;
        this.y = this._target.y;
        if (this.parent === grandparent) {
          this.x += parent.x;
          this.y += parent.y;
        }
        if (this._animation.position === 0) {
          this.y -= this._target.height;
        } else if (this._animation.position === 1) {
          this.y -= this._target.height / 2;
        }
      }
    }
    updateFrame() {
      if (this._duration > 0) {
        const frameIndex = this.currentFrameIndex();
        this.updateAllCellSprites(this._animation.frames[frameIndex]);
        this._animation.timings.forEach(function(timing) {
          if (timing.frame === frameIndex) {
            this.processTimingData(timing);
          }
        }, this);
      }
    }
    currentFrameIndex() {
      return this._animation.frames.length - Math.floor((this._duration + this._rate - 1) / this._rate);
    }
    updateAllCellSprites(frame) {
      this._cellSprites.forEach((sprite, i) => {
        if (i < frame.length) {
          this.updateCellSprite(sprite, frame[i]);
        } else {
          sprite.visible = false;
        }
      });
    }
    updateCellSprite(sprite, cell) {
      const pattern = cell[0];
      if (pattern >= 0) {
        const sx = pattern % 5 * 192;
        const sy = Math.floor(pattern % 100 / 5) * 192;
        const mirror = this._mirror;
        sprite.bitmap = pattern < 100 ? this._bitmap1 : this._bitmap2;
        sprite.setFrame(sx, sy, 192, 192);
        sprite.x = cell[1];
        sprite.y = cell[2];
        sprite.rotation = cell[4] * Math.PI / 180;
        sprite.scale.x = cell[3] / 100;
        if (cell[5]) {
          sprite.scale.x *= -1;
        }
        if (mirror) {
          sprite.x *= -1;
          sprite.rotation *= -1;
          sprite.scale.x *= -1;
        }
        sprite.scale.y = cell[3] / 100;
        sprite.opacity = cell[6];
        sprite.blendMode = cell[7];
        sprite.visible = true;
      } else {
        sprite.visible = false;
      }
    }
    processTimingData({ flashDuration, flashScope, flashColor, se }) {
      const duration = flashDuration * this._rate;
      switch (flashScope) {
        case 1:
          this.startFlash(flashColor, duration);
          break;
        case 2:
          this.startScreenFlash(flashColor, duration);
          break;
        case 3:
          this.startHiding(duration);
          break;
      }
      if (!this._duplicated && se) {
        AudioManager_default.playSe(se);
      }
    }
    startFlash(color, duration) {
      this._flashColor = color.clone();
      this._flashDuration = duration;
    }
    startScreenFlash(color, duration) {
      this._screenFlashDuration = duration;
      if (this._screenFlashSprite) {
        this._screenFlashSprite.setColor(color[0], color[1], color[2]);
        this._screenFlashSprite.opacity = color[3];
      }
    }
    startHiding(duration) {
      this._hidingDuration = duration;
      this._target.hide();
    }
  };
  Sprite_Animation._checker1 = {};
  Sprite_Animation._checker2 = {};
  var Sprite_Animation_default = Sprite_Animation;

  // src-www/js/rpg_sprites/Sprite_Base.js
  var Sprite_Base = class extends Sprite_default {
    constructor(...args) {
      super(...args);
      this.initialize(...args);
    }
    initialize() {
      super.initialize();
      this._animationSprites = [];
      this._effectTarget = this;
      this._hiding = false;
    }
    update() {
      super.update();
      this.updateVisibility();
      this.updateAnimationSprites();
    }
    hide() {
      this._hiding = true;
      this.updateVisibility();
    }
    show() {
      this._hiding = false;
      this.updateVisibility();
    }
    updateVisibility() {
      this.visible = !this._hiding;
    }
    updateAnimationSprites() {
      if (this._animationSprites.length > 0) {
        const sprites = this._animationSprites.clone();
        this._animationSprites = [];
        for (const sprite of sprites) {
          if (sprite.isPlaying()) {
            this._animationSprites.push(sprite);
          } else {
            sprite.remove();
          }
        }
      }
    }
    startAnimation(animation, mirror, delay) {
      const sprite = new Sprite_Animation_default();
      sprite.setup(this._effectTarget, animation, mirror, delay);
      this.parent.addChild(sprite);
      this._animationSprites.push(sprite);
    }
    isAnimationPlaying() {
      return this._animationSprites.length > 0;
    }
  };
  var Sprite_Base_default = Sprite_Base;

  // src-www/js/rpg_sprites/Sprite_Damage.js
  var Sprite_Damage = class extends Sprite_default {
    constructor(...args) {
      super(...args);
      this.initialize(...args);
    }
    initialize() {
      super.initialize();
      this._duration = 90;
      this._flashColor = [0, 0, 0, 0];
      this._flashDuration = 0;
      this._damageBitmap = ImageManager_default.loadSystem("Damage");
    }
    setup(target2) {
      const result2 = target2.result();
      if (result2.missed || result2.evaded) {
        this.createMiss();
      } else if (result2.hpAffected) {
        this.createDigits(0, result2.hpDamage);
      } else if (target2.isAlive() && result2.mpDamage !== 0) {
        this.createDigits(2, result2.mpDamage);
      }
      if (result2.critical) {
        this.setupCriticalEffect();
      }
    }
    setupCriticalEffect() {
      this._flashColor = [255, 0, 0, 160];
      this._flashDuration = 60;
    }
    digitWidth() {
      return this._damageBitmap ? this._damageBitmap.width / 10 : 0;
    }
    digitHeight() {
      return this._damageBitmap ? this._damageBitmap.height / 5 : 0;
    }
    createMiss() {
      const w = this.digitWidth();
      const h = this.digitHeight();
      const sprite = this.createChildSprite();
      sprite.setFrame(0, 4 * h, 4 * w, h);
      sprite.dy = 0;
    }
    createDigits(baseRow, value3) {
      const string = Math.abs(value3).toString();
      const row = baseRow + (value3 < 0 ? 1 : 0);
      const w = this.digitWidth();
      const h = this.digitHeight();
      for (let i = 0; i < string.length; i++) {
        const sprite = this.createChildSprite();
        const n = Number(string[i]);
        sprite.setFrame(n * w, row * h, w, h);
        sprite.x = (i - (string.length - 1) / 2) * w;
        sprite.dy = -i;
      }
    }
    createChildSprite() {
      const sprite = new Sprite_default();
      sprite.bitmap = this._damageBitmap;
      sprite.anchor.x = 0.5;
      sprite.anchor.y = 1;
      sprite.y = -40;
      sprite.ry = sprite.y;
      this.addChild(sprite);
      return sprite;
    }
    update() {
      super.update();
      if (this._duration > 0) {
        this._duration--;
        for (let i = 0; i < this.children.length; i++) {
          this.updateChild(this.children[i]);
        }
      }
      this.updateFlash();
      this.updateOpacity();
    }
    updateChild(sprite) {
      sprite.dy += 0.5;
      sprite.ry += sprite.dy;
      if (sprite.ry >= 0) {
        sprite.ry = 0;
        sprite.dy *= -0.6;
      }
      sprite.y = Math.round(sprite.ry);
      sprite.setBlendColor(this._flashColor);
    }
    updateFlash() {
      if (this._flashDuration > 0) {
        const d = this._flashDuration--;
        this._flashColor[3] *= (d - 1) / d;
      }
    }
    updateOpacity() {
      if (this._duration < 10) {
        this.opacity = 255 * this._duration / 10;
      }
    }
    isPlaying() {
      return this._duration > 0;
    }
  };
  var Sprite_Damage_default = Sprite_Damage;

  // src-www/js/rpg_sprites/Sprite_Battler.js
  var Sprite_Battler = class extends Sprite_Base_default {
    constructor(...args) {
      super(...args);
      this.initialize(...args);
    }
    initialize(battler) {
      super.initialize();
      this.initMembers();
      this.setBattler(battler);
    }
    initMembers() {
      this.anchor.x = 0.5;
      this.anchor.y = 1;
      this._battler = null;
      this._damages = [];
      this._homeX = 0;
      this._homeY = 0;
      this._offsetX = 0;
      this._offsetY = 0;
      this._targetOffsetX = NaN;
      this._targetOffsetY = NaN;
      this._movementDuration = 0;
      this._selectionEffectCount = 0;
    }
    setBattler(battler) {
      this._battler = battler;
    }
    setHome(x, y) {
      this._homeX = x;
      this._homeY = y;
      this.updatePosition();
    }
    update() {
      super.update();
      if (this._battler) {
        this.updateMain();
        this.updateAnimation();
        this.updateDamagePopup();
        this.updateSelectionEffect();
      } else {
        this.bitmap = null;
      }
    }
    updateVisibility() {
      super.updateVisibility();
      if (!this._battler || !this._battler.isSpriteVisible()) {
        this.visible = false;
      }
    }
    updateMain() {
      if (this._battler.isSpriteVisible()) {
        this.updateBitmap();
        this.updateFrame();
      }
      this.updateMove();
      this.updatePosition();
    }
    updateBitmap() {
    }
    updateFrame() {
    }
    updateMove() {
      if (this._movementDuration > 0) {
        const d = this._movementDuration;
        this._offsetX = (this._offsetX * (d - 1) + this._targetOffsetX) / d;
        this._offsetY = (this._offsetY * (d - 1) + this._targetOffsetY) / d;
        this._movementDuration--;
        if (this._movementDuration === 0) {
          this.onMoveEnd();
        }
      }
    }
    updatePosition() {
      this.x = this._homeX + this._offsetX;
      this.y = this._homeY + this._offsetY;
    }
    updateAnimation() {
      this.setupAnimation();
    }
    updateDamagePopup() {
      this.setupDamagePopup();
      if (this._damages.length > 0) {
        for (let i = 0; i < this._damages.length; i++) {
          this._damages[i].update();
        }
        if (!this._damages[0].isPlaying()) {
          this.parent.removeChild(this._damages[0]);
          this._damages.shift();
        }
      }
    }
    updateSelectionEffect() {
      const target2 = this._effectTarget;
      if (this._battler.isSelected()) {
        this._selectionEffectCount++;
        if (this._selectionEffectCount % 30 < 15) {
          target2.setBlendColor([255, 255, 255, 64]);
        } else {
          target2.setBlendColor([0, 0, 0, 0]);
        }
      } else if (this._selectionEffectCount > 0) {
        this._selectionEffectCount = 0;
        target2.setBlendColor([0, 0, 0, 0]);
      }
    }
    setupAnimation() {
      while (this._battler.isAnimationRequested()) {
        const data = this._battler.shiftAnimation();
        const animation = self.$dataAnimations[data.animationId];
        const mirror = data.mirror;
        const delay = animation.position === 3 ? 0 : data.delay;
        this.startAnimation(animation, mirror, delay);
        for (const sprite of this._animationSprites) {
          sprite.visible = this._battler.isSpriteVisible();
        }
      }
    }
    setupDamagePopup() {
      if (this._battler.isDamagePopupRequested()) {
        if (this._battler.isSpriteVisible()) {
          const sprite = new Sprite_Damage_default();
          sprite.x = this.x + this.damageOffsetX();
          sprite.y = this.y + this.damageOffsetY();
          sprite.setup(this._battler);
          this._damages.push(sprite);
          this.parent.addChild(sprite);
        }
        this._battler.clearDamagePopup();
        this._battler.clearResult();
      }
    }
    damageOffsetX() {
      return 0;
    }
    damageOffsetY() {
      return 0;
    }
    startMove(x, y, duration) {
      if (this._targetOffsetX !== x || this._targetOffsetY !== y) {
        this._targetOffsetX = x;
        this._targetOffsetY = y;
        this._movementDuration = duration;
        if (duration === 0) {
          this._offsetX = x;
          this._offsetY = y;
        }
      }
    }
    onMoveEnd() {
    }
    isEffecting() {
      return false;
    }
    isMoving() {
      return this._movementDuration > 0;
    }
    inHomePosition() {
      return this._offsetX === 0 && this._offsetY === 0;
    }
  };
  var Sprite_Battler_default = Sprite_Battler;

  // src-www/js/rpg_sprites/Sprite_StateIcon.js
  var Sprite_StateIcon = class extends Sprite_default {
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
      this._battler = null;
      this._iconIndex = 0;
      this._animationCount = 0;
      this._animationIndex = 0;
      this.anchor.x = 0.5;
      this.anchor.y = 0.5;
    }
    loadBitmap() {
      this.bitmap = ImageManager_default.loadSystem("IconSet");
      this.setFrame(0, 0, 0, 0);
    }
    setup(battler) {
      this._battler = battler;
    }
    update() {
      super.update();
      this._animationCount++;
      if (this._animationCount >= this.animationWait()) {
        this.updateIcon();
        this.updateFrame();
        this._animationCount = 0;
      }
    }
    animationWait() {
      return 40;
    }
    updateIcon() {
      let icons = [];
      if (this._battler && this._battler.isAlive()) {
        icons = this._battler.allIcons();
      }
      if (icons.length > 0) {
        this._animationIndex++;
        if (this._animationIndex >= icons.length) {
          this._animationIndex = 0;
        }
        this._iconIndex = icons[this._animationIndex];
      } else {
        this._animationIndex = 0;
        this._iconIndex = 0;
      }
    }
    updateFrame() {
      const pw = Sprite_StateIcon._iconWidth;
      const ph = Sprite_StateIcon._iconHeight;
      const sx = this._iconIndex % 16 * pw;
      const sy = Math.floor(this._iconIndex / 16) * ph;
      this.setFrame(sx, sy, pw, ph);
    }
  };
  Sprite_StateIcon._iconWidth = 32;
  Sprite_StateIcon._iconHeight = 32;
  var Sprite_StateIcon_default = Sprite_StateIcon;

  // src-www/js/rpg_sprites/Sprite_Enemy.js
  var Sprite_Enemy = class extends Sprite_Battler_default {
    constructor(...args) {
      super(...args);
      this.initialize(...args);
    }
    initialize(battler) {
      super.initialize(battler);
    }
    initMembers() {
      super.initMembers();
      this._enemy = null;
      this._appeared = false;
      this._battlerName = "";
      this._battlerHue = 0;
      this._effectType = null;
      this._effectDuration = 0;
      this._shake = 0;
      this.createStateIconSprite();
    }
    createStateIconSprite() {
      this._stateIconSprite = new Sprite_StateIcon_default();
      this.addChild(this._stateIconSprite);
    }
    setBattler(battler) {
      super.setBattler(battler);
      this._enemy = battler;
      this.setHome(battler.screenX(), battler.screenY());
      this._stateIconSprite.setup(battler);
    }
    update() {
      super.update();
      if (this._enemy) {
        this.updateEffect();
        this.updateStateSprite();
      }
    }
    updateBitmap() {
      super.updateBitmap();
      const name = this._enemy.battlerName();
      const hue = this._enemy.battlerHue();
      if (this._battlerName !== name || this._battlerHue !== hue) {
        this._battlerName = name;
        this._battlerHue = hue;
        this.loadBitmap(name, hue);
        this.initVisibility();
      }
    }
    loadBitmap(name, hue) {
      if (self.$gameSystem.isSideView()) {
        this.bitmap = ImageManager_default.loadSvEnemy(name, hue);
      } else {
        this.bitmap = ImageManager_default.loadEnemy(name, hue);
      }
    }
    updateFrame() {
      super.updateFrame();
      let frameHeight = this.bitmap.height;
      if (this._effectType === "bossCollapse") {
        frameHeight = this._effectDuration;
      }
      this.setFrame(0, 0, this.bitmap.width, frameHeight);
    }
    updatePosition() {
      super.updatePosition();
      this.x += this._shake;
    }
    updateStateSprite() {
      this._stateIconSprite.y = -Math.round((this.bitmap.height + 40) * 0.9);
      if (this._stateIconSprite.y < 20 - this.y) {
        this._stateIconSprite.y = 20 - this.y;
      }
    }
    initVisibility() {
      this._appeared = this._enemy.isAlive();
      if (!this._appeared) {
        this.opacity = 0;
      }
    }
    setupEffect() {
      if (this._appeared && this._enemy.isEffectRequested()) {
        this.startEffect(this._enemy.effectType());
        this._enemy.clearEffect();
      }
      if (!this._appeared && this._enemy.isAlive()) {
        this.startEffect("appear");
      } else if (this._appeared && this._enemy.isHidden()) {
        this.startEffect("disappear");
      }
    }
    startEffect(effectType) {
      this._effectType = effectType;
      switch (this._effectType) {
        case "appear":
          this.startAppear();
          break;
        case "disappear":
          this.startDisappear();
          break;
        case "whiten":
          this.startWhiten();
          break;
        case "blink":
          this.startBlink();
          break;
        case "collapse":
          this.startCollapse();
          break;
        case "bossCollapse":
          this.startBossCollapse();
          break;
        case "instantCollapse":
          this.startInstantCollapse();
          break;
      }
      this.revertToNormal();
    }
    startAppear() {
      this._effectDuration = 16;
      this._appeared = true;
    }
    startDisappear() {
      this._effectDuration = 32;
      this._appeared = false;
    }
    startWhiten() {
      this._effectDuration = 16;
    }
    startBlink() {
      this._effectDuration = 20;
    }
    startCollapse() {
      this._effectDuration = 32;
      this._appeared = false;
    }
    startBossCollapse() {
      this._effectDuration = this.bitmap.height;
      this._appeared = false;
    }
    startInstantCollapse() {
      this._effectDuration = 16;
      this._appeared = false;
    }
    updateEffect() {
      this.setupEffect();
      if (this._effectDuration > 0) {
        this._effectDuration--;
        switch (this._effectType) {
          case "whiten":
            this.updateWhiten();
            break;
          case "blink":
            this.updateBlink();
            break;
          case "appear":
            this.updateAppear();
            break;
          case "disappear":
            this.updateDisappear();
            break;
          case "collapse":
            this.updateCollapse();
            break;
          case "bossCollapse":
            this.updateBossCollapse();
            break;
          case "instantCollapse":
            this.updateInstantCollapse();
            break;
        }
        if (this._effectDuration === 0) {
          this._effectType = null;
        }
      }
    }
    isEffecting() {
      return this._effectType !== null;
    }
    revertToNormal() {
      this._shake = 0;
      this.blendMode = 0;
      this.opacity = 255;
      this.setBlendColor([0, 0, 0, 0]);
    }
    updateWhiten() {
      const alpha = 128 - (16 - this._effectDuration) * 10;
      this.setBlendColor([255, 255, 255, alpha]);
    }
    updateBlink() {
      this.opacity = this._effectDuration % 10 < 5 ? 255 : 0;
    }
    updateAppear() {
      this.opacity = (16 - this._effectDuration) * 16;
    }
    updateDisappear() {
      this.opacity = 256 - (32 - this._effectDuration) * 10;
    }
    updateCollapse() {
      this.blendMode = Graphics_default.BLEND_ADD;
      this.setBlendColor([255, 128, 128, 128]);
      this.opacity *= this._effectDuration / (this._effectDuration + 1);
    }
    updateBossCollapse() {
      this._shake = this._effectDuration % 2 * 4 - 2;
      this.blendMode = Graphics_default.BLEND_ADD;
      this.opacity *= this._effectDuration / (this._effectDuration + 1);
      this.setBlendColor([255, 255, 255, 255 - this.opacity]);
      if (this._effectDuration % 20 === 19) {
        SoundManager_default.playBossCollapse2();
      }
    }
    updateInstantCollapse() {
      this.opacity = 0;
    }
    damageOffsetX() {
      return 0;
    }
    damageOffsetY() {
      return -8;
    }
  };
  var Sprite_Enemy_default = Sprite_Enemy;

  // src-www/js/rpg_sprites/Sprite_Weapon.js
  var Sprite_Weapon = class extends Sprite_Base_default {
    constructor(...args) {
      super(...args);
      this.initialize(...args);
    }
    initialize() {
      super.initialize();
      this.initMembers();
    }
    initMembers() {
      this._weaponImageId = 0;
      this._animationCount = 0;
      this._pattern = 0;
      this.anchor.x = 0.5;
      this.anchor.y = 1;
      this.x = -16;
    }
    setup(weaponImageId) {
      this._weaponImageId = weaponImageId;
      this._animationCount = 0;
      this._pattern = 0;
      this.loadBitmap();
      this.updateFrame();
    }
    update() {
      super.update();
      this._animationCount++;
      if (this._animationCount >= this.animationWait()) {
        this.updatePattern();
        this.updateFrame();
        this._animationCount = 0;
      }
    }
    animationWait() {
      return 12;
    }
    updatePattern() {
      this._pattern++;
      if (this._pattern >= 3) {
        this._weaponImageId = 0;
      }
    }
    loadBitmap() {
      const pageId = Math.floor((this._weaponImageId - 1) / 12) + 1;
      if (pageId >= 1) {
        this.bitmap = ImageManager_default.loadSystem(`Weapons${pageId}`);
      } else {
        this.bitmap = ImageManager_default.loadSystem("");
      }
    }
    updateFrame() {
      if (this._weaponImageId > 0) {
        const index = (this._weaponImageId - 1) % 12;
        const w = 96;
        const h = 64;
        const sx = (Math.floor(index / 6) * 3 + this._pattern) * w;
        const sy = Math.floor(index % 6) * h;
        this.setFrame(sx, sy, w, h);
      } else {
        this.setFrame(0, 0, 0, 0);
      }
    }
    isPlaying() {
      return this._weaponImageId > 0;
    }
  };
  var Sprite_Weapon_default = Sprite_Weapon;

  // src-www/js/rpg_sprites/Sprite_StateOverlay.js
  var Sprite_StateOverlay = class extends Sprite_Base_default {
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
      this._battler = null;
      this._overlayIndex = 0;
      this._animationCount = 0;
      this._pattern = 0;
      this.anchor.x = 0.5;
      this.anchor.y = 1;
    }
    loadBitmap() {
      this.bitmap = ImageManager_default.loadSystem("States");
      this.setFrame(0, 0, 0, 0);
    }
    setup(battler) {
      this._battler = battler;
    }
    update() {
      super.update();
      this._animationCount++;
      if (this._animationCount >= this.animationWait()) {
        this.updatePattern();
        this.updateFrame();
        this._animationCount = 0;
      }
    }
    animationWait() {
      return 8;
    }
    updatePattern() {
      this._pattern++;
      this._pattern %= 8;
      if (this._battler) {
        this._overlayIndex = this._battler.stateOverlayIndex();
      }
    }
    updateFrame() {
      if (this._overlayIndex > 0) {
        const w = 96;
        const h = 96;
        const sx = this._pattern * w;
        const sy = (this._overlayIndex - 1) * h;
        this.setFrame(sx, sy, w, h);
      } else {
        this.setFrame(0, 0, 0, 0);
      }
    }
  };
  var Sprite_StateOverlay_default = Sprite_StateOverlay;

  // src-www/js/rpg_sprites/Sprite_Actor.js
  var Sprite_Actor = class extends Sprite_Battler_default {
    constructor(...args) {
      super(...args);
      this.initialize(...args);
    }
    initialize(battler) {
      super.initialize(battler);
      this.moveToStartPosition();
    }
    initMembers() {
      super.initMembers();
      this._battlerName = "";
      this._motion = null;
      this._motionCount = 0;
      this._pattern = 0;
      this.createShadowSprite();
      this.createWeaponSprite();
      this.createMainSprite();
      this.createStateSprite();
    }
    createMainSprite() {
      this._mainSprite = new Sprite_Base_default();
      this._mainSprite.anchor.x = 0.5;
      this._mainSprite.anchor.y = 1;
      this.addChild(this._mainSprite);
      this._effectTarget = this._mainSprite;
    }
    createShadowSprite() {
      this._shadowSprite = new Sprite_default();
      this._shadowSprite.bitmap = ImageManager_default.loadSystem("Shadow2");
      this._shadowSprite.anchor.x = 0.5;
      this._shadowSprite.anchor.y = 0.5;
      this._shadowSprite.y = -2;
      this.addChild(this._shadowSprite);
    }
    createWeaponSprite() {
      this._weaponSprite = new Sprite_Weapon_default();
      this.addChild(this._weaponSprite);
    }
    createStateSprite() {
      this._stateSprite = new Sprite_StateOverlay_default();
      this.addChild(this._stateSprite);
    }
    setBattler(battler) {
      super.setBattler(battler);
      const changed = battler !== this._actor;
      if (changed) {
        this._actor = battler;
        if (battler) {
          this.setActorHome(battler.index());
        }
        this.startEntryMotion();
        this._stateSprite.setup(battler);
      }
    }
    moveToStartPosition() {
      this.startMove(300, 0, 0);
    }
    setActorHome(index) {
      this.setHome(600 + index * 32, 280 + index * 48);
    }
    update() {
      super.update();
      this.updateShadow();
      if (this._actor) {
        this.updateMotion();
      }
    }
    updateShadow() {
      this._shadowSprite.visible = !!this._actor;
    }
    updateMain() {
      super.updateMain();
      if (this._actor.isSpriteVisible() && !this.isMoving()) {
        this.updateTargetPosition();
      }
    }
    setupMotion() {
      if (this._actor.isMotionRequested()) {
        this.startMotion(this._actor.motionType());
        this._actor.clearMotion();
      }
    }
    setupWeaponAnimation() {
      if (this._actor.isWeaponAnimationRequested()) {
        this._weaponSprite.setup(this._actor.weaponImageId());
        this._actor.clearWeaponAnimation();
      }
    }
    startMotion(motionType) {
      const newMotion = Sprite_Actor.MOTIONS[motionType];
      if (this._motion !== newMotion) {
        this._motion = newMotion;
        this._motionCount = 0;
        this._pattern = 0;
      }
    }
    updateTargetPosition() {
      if (this._actor.isInputting() || this._actor.isActing()) {
        this.stepForward();
      } else if (this._actor.canMove() && BattleManager_default.isEscaped()) {
        this.retreat();
      } else if (!this.inHomePosition()) {
        this.stepBack();
      }
    }
    updateBitmap() {
      super.updateBitmap();
      const name = this._actor.battlerName();
      if (this._battlerName !== name) {
        this._battlerName = name;
        this._mainSprite.bitmap = ImageManager_default.loadSvActor(name);
      }
    }
    updateFrame() {
      super.updateFrame();
      const bitmap = this._mainSprite.bitmap;
      if (bitmap) {
        const motionIndex = this._motion ? this._motion.index : 0;
        const pattern = this._pattern < 3 ? this._pattern : 1;
        const cw = bitmap.width / 9;
        const ch = bitmap.height / 6;
        const cx = Math.floor(motionIndex / 6) * 3 + pattern;
        const cy = motionIndex % 6;
        this._mainSprite.setFrame(cx * cw, cy * ch, cw, ch);
      }
    }
    updateMove() {
      const bitmap = this._mainSprite.bitmap;
      if (!bitmap || bitmap.isReady()) {
        super.updateMove();
      }
    }
    updateMotion() {
      this.setupMotion();
      this.setupWeaponAnimation();
      if (this._actor.isMotionRefreshRequested()) {
        this.refreshMotion();
        this._actor.clearMotion();
      }
      this.updateMotionCount();
    }
    updateMotionCount() {
      if (this._motion && ++this._motionCount >= this.motionSpeed()) {
        if (this._motion.loop) {
          this._pattern = (this._pattern + 1) % 4;
        } else if (this._pattern < 2) {
          this._pattern++;
        } else {
          this.refreshMotion();
        }
        this._motionCount = 0;
      }
    }
    motionSpeed() {
      return 12;
    }
    refreshMotion() {
      const actor2 = this._actor;
      const motionGuard = Sprite_Actor.MOTIONS.guard;
      if (actor2) {
        if (this._motion === motionGuard && !BattleManager_default.isInputting()) {
          return;
        }
        const stateMotion = actor2.stateMotionIndex();
        if (actor2.isInputting() || actor2.isActing()) {
          this.startMotion("walk");
        } else if (stateMotion === 3) {
          this.startMotion("dead");
        } else if (stateMotion === 2) {
          this.startMotion("sleep");
        } else if (actor2.isChanting()) {
          this.startMotion("chant");
        } else if (actor2.isGuard() || actor2.isGuardWaiting()) {
          this.startMotion("guard");
        } else if (stateMotion === 1) {
          this.startMotion("abnormal");
        } else if (actor2.isDying()) {
          this.startMotion("dying");
        } else if (actor2.isUndecided()) {
          this.startMotion("walk");
        } else {
          this.startMotion("wait");
        }
      }
    }
    startEntryMotion() {
      if (this._actor && this._actor.canMove()) {
        this.startMotion("walk");
        this.startMove(0, 0, 30);
      } else if (!this.isMoving()) {
        this.refreshMotion();
        this.startMove(0, 0, 0);
      }
    }
    stepForward() {
      this.startMove(-48, 0, 12);
    }
    stepBack() {
      this.startMove(0, 0, 12);
    }
    retreat() {
      this.startMove(300, 0, 30);
    }
    onMoveEnd() {
      super.onMoveEnd();
      if (!BattleManager_default.isBattleEnd()) {
        this.refreshMotion();
      }
    }
    damageOffsetX() {
      return -32;
    }
    damageOffsetY() {
      return 0;
    }
  };
  Sprite_Actor.MOTIONS = {
    walk: {
      index: 0,
      loop: true
    },
    wait: {
      index: 1,
      loop: true
    },
    chant: {
      index: 2,
      loop: true
    },
    guard: {
      index: 3,
      loop: true
    },
    damage: {
      index: 4,
      loop: false
    },
    evade: {
      index: 5,
      loop: false
    },
    thrust: {
      index: 6,
      loop: false
    },
    swing: {
      index: 7,
      loop: false
    },
    missile: {
      index: 8,
      loop: false
    },
    skill: {
      index: 9,
      loop: false
    },
    spell: {
      index: 10,
      loop: false
    },
    item: {
      index: 11,
      loop: false
    },
    escape: {
      index: 12,
      loop: true
    },
    victory: {
      index: 13,
      loop: true
    },
    dying: {
      index: 14,
      loop: true
    },
    abnormal: {
      index: 15,
      loop: true
    },
    sleep: {
      index: 16,
      loop: true
    },
    dead: {
      index: 17,
      loop: true
    }
  };
  var Sprite_Actor_default = Sprite_Actor;

  // src-www/js/rpg_sprites/Spriteset_Battle.js
  var Spriteset_Battle = class extends Spriteset_Base_default {
    constructor(...args) {
      super(...args);
      this.initialize(...args);
    }
    initialize() {
      super.initialize();
      this._battlebackLocated = false;
    }
    createLowerLayer() {
      super.createLowerLayer();
      this.createBackground();
      this.createBattleField();
      this.createBattleback();
      this.createEnemies();
      this.createActors();
    }
    createBackground() {
      this._backgroundSprite = new Sprite_default();
      this._backgroundSprite.bitmap = SceneManager_default.backgroundBitmap();
      this._baseSprite.addChild(this._backgroundSprite);
    }
    update() {
      super.update();
      this.updateActors();
      this.updateBattleback();
    }
    createBattleField() {
      const width = Graphics_default.boxWidth;
      const height = Graphics_default.boxHeight;
      const x = (Graphics_default.width - width) / 2;
      const y = (Graphics_default.height - height) / 2;
      this._battleField = new Sprite_default();
      this._battleField.setFrame(x, y, width, height);
      this._battleField.x = x;
      this._battleField.y = y;
      this._baseSprite.addChild(this._battleField);
    }
    createBattleback() {
      const margin = 32;
      const x = -this._battleField.x - margin;
      const y = -this._battleField.y - margin;
      const width = Graphics_default.width + margin * 2;
      const height = Graphics_default.height + margin * 2;
      this._back1Sprite = new TilingSprite_default();
      this._back2Sprite = new TilingSprite_default();
      this._back1Sprite.bitmap = this.battleback1Bitmap();
      this._back2Sprite.bitmap = this.battleback2Bitmap();
      this._back1Sprite.move(x, y, width, height);
      this._back2Sprite.move(x, y, width, height);
      this._battleField.addChild(this._back1Sprite);
      this._battleField.addChild(this._back2Sprite);
    }
    updateBattleback() {
      if (!this._battlebackLocated) {
        this.locateBattleback();
        this._battlebackLocated = true;
      }
    }
    locateBattleback() {
      const width = this._battleField.width;
      const height = this._battleField.height;
      const sprite1 = this._back1Sprite;
      const sprite2 = this._back2Sprite;
      sprite1.origin.x = sprite1.x + (sprite1.bitmap.width - width) / 2;
      sprite2.origin.x = sprite1.y + (sprite2.bitmap.width - width) / 2;
      if (self.$gameSystem.isSideView()) {
        sprite1.origin.y = sprite1.x + sprite1.bitmap.height - height;
        sprite2.origin.y = sprite1.y + sprite2.bitmap.height - height;
      }
    }
    battleback1Bitmap() {
      return ImageManager_default.loadBattleback1(this.battleback1Name());
    }
    battleback2Bitmap() {
      return ImageManager_default.loadBattleback2(this.battleback2Name());
    }
    battleback1Name() {
      if (BattleManager_default.isBattleTest()) {
        return self.$dataSystem.battleback1Name;
      } else if (self.$gameMap.battleback1Name()) {
        return self.$gameMap.battleback1Name();
      } else if (self.$gameMap.isOverworld()) {
        return this.overworldBattleback1Name();
      } else {
        return "";
      }
    }
    battleback2Name() {
      if (BattleManager_default.isBattleTest()) {
        return self.$dataSystem.battleback2Name;
      } else if (self.$gameMap.battleback2Name()) {
        return self.$gameMap.battleback2Name();
      } else if (self.$gameMap.isOverworld()) {
        return this.overworldBattleback2Name();
      } else {
        return "";
      }
    }
    overworldBattleback1Name() {
      if (self.$gameMap.battleback1Name() === "")
        return "";
      if (self.$gamePlayer.isInVehicle()) {
        return this.shipBattleback1Name();
      } else {
        return this.normalBattleback1Name();
      }
    }
    overworldBattleback2Name() {
      if (self.$gameMap.battleback2Name() === "")
        return "";
      if (self.$gamePlayer.isInVehicle()) {
        return this.shipBattleback2Name();
      } else {
        return this.normalBattleback2Name();
      }
    }
    normalBattleback1Name() {
      return this.terrainBattleback1Name(this.autotileType(1)) || this.terrainBattleback1Name(this.autotileType(0)) || this.defaultBattleback1Name();
    }
    normalBattleback2Name() {
      return this.terrainBattleback2Name(this.autotileType(1)) || this.terrainBattleback2Name(this.autotileType(0)) || this.defaultBattleback2Name();
    }
    terrainBattleback1Name(type) {
      switch (type) {
        case 24:
        case 25:
          return "Wasteland";
        case 26:
        case 27:
          return "DirtField";
        case 32:
        case 33:
          return "Desert";
        case 34:
          return "Lava1";
        case 35:
          return "Lava2";
        case 40:
        case 41:
          return "Snowfield";
        case 42:
          return "Clouds";
        case 4:
        case 5:
          return "PoisonSwamp";
        default:
          return null;
      }
    }
    terrainBattleback2Name(type) {
      switch (type) {
        case 20:
        case 21:
          return "Forest";
        case 22:
        case 30:
        case 38:
          return "Cliff";
        case 24:
        case 25:
        case 26:
        case 27:
          return "Wasteland";
        case 32:
        case 33:
          return "Desert";
        case 34:
        case 35:
          return "Lava";
        case 40:
        case 41:
          return "Snowfield";
        case 42:
          return "Clouds";
        case 4:
        case 5:
          return "PoisonSwamp";
      }
    }
    defaultBattleback1Name() {
      return "Grassland";
    }
    defaultBattleback2Name() {
      return "Grassland";
    }
    shipBattleback1Name() {
      return "Ship";
    }
    shipBattleback2Name() {
      return "Ship";
    }
    autotileType(z) {
      return self.$gameMap.autotileType(
        self.$gamePlayer.x,
        self.$gamePlayer.y,
        z
      );
    }
    createEnemies() {
      const enemies = self.$gameTroop.members();
      const sprites = [];
      for (let i = 0; i < enemies.length; i++) {
        sprites[i] = new Sprite_Enemy_default(enemies[i]);
      }
      sprites.sort(this.compareEnemySprite.bind(this));
      for (let j = 0; j < sprites.length; j++) {
        this._battleField.addChild(sprites[j]);
      }
      this._enemySprites = sprites;
    }
    compareEnemySprite(a2, b2) {
      if (a2.y !== b2.y) {
        return a2.y - b2.y;
      } else {
        return a2.spriteId - b2.spriteId;
      }
    }
    createActors() {
      this._actorSprites = [];
      for (let i = 0; i < self.$gameParty.maxBattleMembers(); i++) {
        this._actorSprites[i] = new Sprite_Actor_default();
        this._battleField.addChild(this._actorSprites[i]);
      }
    }
    updateActors() {
      const members = self.$gameParty.battleMembers();
      for (let i = 0; i < this._actorSprites.length; i++) {
        this._actorSprites[i].setBattler(members[i]);
      }
    }
    battlerSprites() {
      return this._enemySprites.concat(this._actorSprites);
    }
    isAnimationPlaying() {
      return this.battlerSprites().some((sprite) => sprite.isAnimationPlaying());
    }
    isEffecting() {
      return this.battlerSprites().some((sprite) => sprite.isEffecting());
    }
    isAnyoneMoving() {
      return this.battlerSprites().some((sprite) => sprite.isMoving());
    }
    isBusy() {
      return this.isAnimationPlaying() || this.isAnyoneMoving();
    }
  };
  var Spriteset_Battle_default = Spriteset_Battle;

  // src-www/js/rpg_windows/Window_Base.js
  var Window_Base = class extends Window_default {
    constructor(...args) {
      super(...args);
      this.initialize(...args);
    }
    initialize(x, y, width, height) {
      super.initialize();
      this.loadWindowskin();
      this.move(x, y, width, height);
      this.updatePadding();
      this.updateBackOpacity();
      this.updateTone();
      this.createContents();
      this._opening = false;
      this._closing = false;
      this._dimmerSprite = null;
    }
    lineHeight() {
      return 36;
    }
    standardFontFace() {
      if (self.$gameSystem.isChinese()) {
        return "SimHei, Heiti TC, sans-serif";
      } else if (self.$gameSystem.isKorean()) {
        return "Dotum, AppleGothic, sans-serif";
      } else {
        return "GameFont";
      }
    }
    standardFontSize() {
      return 28;
    }
    standardPadding() {
      return 18;
    }
    textPadding() {
      return 6;
    }
    standardBackOpacity() {
      return 192;
    }
    loadWindowskin() {
      this.windowskin = ImageManager_default.loadSystem("Window");
    }
    updatePadding() {
      this.padding = this.standardPadding();
    }
    updateBackOpacity() {
      this.backOpacity = this.standardBackOpacity();
    }
    contentsWidth() {
      return this.width - this.standardPadding() * 2;
    }
    contentsHeight() {
      return this.height - this.standardPadding() * 2;
    }
    fittingHeight(numLines) {
      return numLines * this.lineHeight() + this.standardPadding() * 2;
    }
    updateTone() {
      const tone = self.$gameSystem.windowTone();
      this.setTone(tone[0], tone[1], tone[2]);
    }
    createContents() {
      if (!this.contents) {
        this.contents = new BitmapPIXI_default(
          this.contentsWidth(),
          this.contentsHeight()
        );
        this._windowContentsSprite.addChild(this.contents);
      } else {
        this.contents.clear();
      }
      this.resetFontSettings();
    }
    resetFontSettings() {
      this.contents.fontFace = this.standardFontFace();
      this.contents.fontSize = this.standardFontSize();
      this.resetTextColor();
    }
    resetTextColor() {
      this.changeTextColor(this.normalColor());
    }
    update() {
      super.update();
      this.updateTone();
      this.updateOpen();
      this.updateClose();
      this.updateBackgroundDimmer();
    }
    updateOpen() {
      if (this._opening) {
        this.openness += 32;
        if (this.isOpen()) {
          this._opening = false;
        }
      }
    }
    updateClose() {
      if (this._closing) {
        this.openness -= 32;
        if (this.isClosed()) {
          this._closing = false;
        }
      }
    }
    open() {
      if (!this.isOpen()) {
        this._opening = true;
      }
      this._closing = false;
    }
    close() {
      if (!this.isClosed()) {
        this._closing = true;
      }
      this._opening = false;
    }
    isOpening() {
      return this._opening;
    }
    isClosing() {
      return this._closing;
    }
    show() {
      this.visible = true;
    }
    hide() {
      this.visible = false;
    }
    activate() {
      this.active = true;
    }
    deactivate() {
      this.active = false;
    }
    textColor(n) {
      const px = 96 + n % 8 * 12 + 6;
      const py = 144 + Math.floor(n / 8) * 12 + 6;
      if (this.windowskin) {
        return this.windowskin.getPixel(px, py);
      }
      return "0x000000";
    }
    normalColor() {
      return this.textColor(0);
    }
    systemColor() {
      return this.textColor(16);
    }
    crisisColor() {
      return this.textColor(17);
    }
    deathColor() {
      return this.textColor(18);
    }
    gaugeBackColor() {
      return this.textColor(19);
    }
    hpGaugeColor1() {
      return this.textColor(20);
    }
    hpGaugeColor2() {
      return this.textColor(21);
    }
    mpGaugeColor1() {
      return this.textColor(22);
    }
    mpGaugeColor2() {
      return this.textColor(23);
    }
    mpCostColor() {
      return this.textColor(23);
    }
    powerUpColor() {
      return this.textColor(24);
    }
    powerDownColor() {
      return this.textColor(25);
    }
    tpGaugeColor1() {
      return this.textColor(28);
    }
    tpGaugeColor2() {
      return this.textColor(29);
    }
    tpCostColor() {
      return this.textColor(29);
    }
    pendingColor() {
      return this.windowskin.getPixel(120, 120);
    }
    translucentOpacity() {
      return 160;
    }
    changeTextColor(color) {
      this.contents.textColor = color;
    }
    changePaintOpacity(enabled) {
      this.contents.paintOpacity = enabled ? 255 : this.translucentOpacity();
    }
    drawText(text, x, y, maxWidth, align) {
      this.contents.drawText(text, x, y, maxWidth, this.lineHeight(), align);
    }
    textWidth(text) {
      return this.contents.measureTextWidth(text);
    }
    drawTextEx(text, x, y) {
      if (text) {
        const textState = {
          index: 0,
          x,
          y,
          left: x
        };
        textState.text = this.convertEscapeCharacters(text);
        textState.height = this.calcTextHeight(textState, false);
        this.resetFontSettings();
        while (textState.index < textState.text.length) {
          this.processCharacter(textState);
        }
        return textState.x - x;
      } else {
        return 0;
      }
    }
    convertEscapeCharacters(text) {
      text = text.replace(/\\/g, "\x1B");
      text = text.replace(/\x1b\x1b/g, "\\");
      text = text.replace(
        /\x1bV\[(\d+)\]/gi,
        function(...args) {
          return self.$gameVariables.value(parseInt(args[1]));
        }.bind(this)
      );
      text = text.replace(
        /\x1bV\[(\d+)\]/gi,
        function(...args) {
          return self.$gameVariables.value(parseInt(args[1]));
        }.bind(this)
      );
      text = text.replace(
        /\x1bN\[(\d+)\]/gi,
        function(...args) {
          return this.actorName(parseInt(args[1]));
        }.bind(this)
      );
      text = text.replace(
        /\x1bP\[(\d+)\]/gi,
        function(...args) {
          return this.partyMemberName(parseInt(args[1]));
        }.bind(this)
      );
      text = text.replace(/\x1bG/gi, TextManager_default.currencyUnit);
      return text;
    }
    actorName(n) {
      const actor2 = n >= 1 ? self.$gameActors.actor(n) : null;
      return actor2 ? actor2.name() : "";
    }
    partyMemberName(n) {
      const actor2 = n >= 1 ? self.$gameParty.members()[n - 1] : null;
      return actor2 ? actor2.name() : "";
    }
    processCharacter(textState) {
      switch (textState.text[textState.index]) {
        case "\n":
          this.processNewLine(textState);
          break;
        case "\f":
          this.processNewPage(textState);
          break;
        case "\x1B":
          this.processEscapeCharacter(
            this.obtainEscapeCode(textState),
            textState
          );
          break;
        default:
          this.processNormalCharacter(textState);
          break;
      }
    }
    processNormalCharacter(textState) {
      const c = textState.text[textState.index++];
      const w = this.textWidth(c);
      this.contents.drawText(
        c,
        textState.x,
        textState.y,
        w * 2,
        textState.height
      );
      textState.x += w;
    }
    processNewLine(textState) {
      textState.x = textState.left;
      textState.y += textState.height;
      textState.height = this.calcTextHeight(textState, false);
      textState.index++;
    }
    processNewPage(textState) {
      textState.index++;
    }
    obtainEscapeCode(textState) {
      textState.index++;
      const regExp = /^[\$\.\|\^!><\{\}\\]|^[A-Z]+/i;
      const arr = regExp.exec(textState.text.slice(textState.index));
      if (arr) {
        textState.index += arr[0].length;
        return arr[0].toUpperCase();
      } else {
        return "";
      }
    }
    obtainEscapeParam(textState) {
      const arr = /^\[\d+\]/.exec(textState.text.slice(textState.index));
      if (arr) {
        textState.index += arr[0].length;
        return parseInt(arr[0].slice(1));
      } else {
        return "";
      }
    }
    processEscapeCharacter(code, textState) {
      switch (code) {
        case "C":
          this.changeTextColor(this.textColor(this.obtainEscapeParam(textState)));
          break;
        case "I":
          this.processDrawIcon(this.obtainEscapeParam(textState), textState);
          break;
        case "{":
          this.makeFontBigger();
          break;
        case "}":
          this.makeFontSmaller();
          break;
      }
    }
    processDrawIcon(iconIndex, textState) {
      this.drawIcon(iconIndex, textState.x + 2, textState.y + 2);
      textState.x += Window_Base._iconWidth + 4;
    }
    makeFontBigger() {
      if (this.contents.fontSize <= 96) {
        this.contents.fontSize += 12;
      }
    }
    makeFontSmaller() {
      if (this.contents.fontSize >= 24) {
        this.contents.fontSize -= 12;
      }
    }
    calcTextHeight({ text, index }, all) {
      const lastFontSize = this.contents.fontSize;
      let textHeight = 0;
      const lines = text.slice(index).split("\n");
      const maxLines = all ? lines.length : 1;
      for (let i = 0; i < maxLines; i++) {
        let maxFontSize = this.contents.fontSize;
        const regExp = /\x1b[\{\}]/g;
        for (; ; ) {
          const array = regExp.exec(lines[i]);
          if (array) {
            if (array[0] === "\x1B{") {
              this.makeFontBigger();
            }
            if (array[0] === "\x1B}") {
              this.makeFontSmaller();
            }
            if (maxFontSize < this.contents.fontSize) {
              maxFontSize = this.contents.fontSize;
            }
          } else {
            break;
          }
        }
        textHeight += maxFontSize + 8;
      }
      this.contents.fontSize = lastFontSize;
      return textHeight;
    }
    drawIcon(iconIndex, x, y) {
      const bitmap = ImageManager_default.loadSystem("IconSet");
      const pw = Window_Base._iconWidth;
      const ph = Window_Base._iconHeight;
      const sx = iconIndex % 16 * pw;
      const sy = Math.floor(iconIndex / 16) * ph;
      this.contents.blt(bitmap, sx, sy, pw, ph, x, y);
    }
    drawFace(faceName, faceIndex, x, y, width = Window_Base._faceWidth, height = Window_Base._faceHeight) {
      const bitmap = ImageManager_default.loadFace(faceName);
      const pw = Window_Base._faceWidth;
      const ph = Window_Base._faceHeight;
      const sw = Math.min(width, pw);
      const sh = Math.min(height, ph);
      const dx = Math.floor(x + Math.max(width - pw, 0) / 2);
      const dy = Math.floor(y + Math.max(height - ph, 0) / 2);
      const sx = faceIndex % 4 * pw + (pw - sw) / 2;
      const sy = Math.floor(faceIndex / 4) * ph + (ph - sh) / 2;
      this.contents.blt(bitmap, sx, sy, sw, sh, dx, dy);
    }
    drawCharacter(characterName, characterIndex, x, y) {
      const bitmap = ImageManager_default.loadCharacter(characterName);
      const big = ImageManager_default.isBigCharacter(characterName);
      const pw = bitmap.width / (big ? 3 : 12);
      const ph = bitmap.height / (big ? 4 : 8);
      const n = big ? 0 : characterIndex;
      const sx = (n % 4 * 3 + 1) * pw;
      const sy = Math.floor(n / 4) * 4 * ph;
      this.contents.blt(bitmap, sx, sy, pw, ph, x - pw / 2, y - ph);
    }
    drawGauge(x, y, width, rate, color1, color2) {
      const fillW = Math.floor(width * rate);
      const gaugeY = y + this.lineHeight() - 8;
      this.contents.fillRect(x, gaugeY, width, 6, this.gaugeBackColor());
      this.contents.gradientFillRect(x, gaugeY, fillW, 6, color1, color2);
    }
    hpColor(actor2) {
      if (actor2.isDead()) {
        return this.deathColor();
      } else if (actor2.isDying()) {
        return this.crisisColor();
      } else {
        return this.normalColor();
      }
    }
    mpColor(actor2) {
      return this.normalColor();
    }
    tpColor(actor2) {
      return this.normalColor();
    }
    drawActorCharacter(actor2, x, y) {
      this.drawCharacter(actor2.characterName(), actor2.characterIndex(), x, y);
    }
    drawActorFace(actor2, x, y, width, height) {
      this.drawFace(actor2.faceName(), actor2.faceIndex(), x, y, width, height);
    }
    drawActorName(actor2, x, y, width = 168) {
      this.changeTextColor(this.hpColor(actor2));
      this.drawText(actor2.name(), x, y, width);
    }
    drawActorClass(actor2, x, y, width = 168) {
      this.resetTextColor();
      this.drawText(actor2.currentClass().name, x, y, width);
    }
    drawActorNickname(actor2, x, y, width = 270) {
      this.resetTextColor();
      this.drawText(actor2.nickname(), x, y, width);
    }
    drawActorLevel({ level }, x, y) {
      this.changeTextColor(this.systemColor());
      this.drawText(TextManager_default.levelA, x, y, 48);
      this.resetTextColor();
      this.drawText(level, x + 84, y, 36, "right");
    }
    drawActorIcons(actor2, x, y, width = 144) {
      const icons = actor2.allIcons().slice(0, Math.floor(width / Window_Base._iconWidth));
      for (let i = 0; i < icons.length; i++) {
        this.drawIcon(icons[i], x + Window_Base._iconWidth * i, y + 2);
      }
    }
    drawCurrentAndMax(current, max, x, y, width, color1, color2) {
      const labelWidth = this.textWidth("HP");
      const valueWidth = this.textWidth("0000");
      const slashWidth = this.textWidth("/");
      const x1 = x + width - valueWidth;
      const x2 = x1 - slashWidth;
      const x3 = x2 - valueWidth;
      if (x3 >= x + labelWidth) {
        this.changeTextColor(color1);
        this.drawText(current, x3, y, valueWidth, "right");
        this.changeTextColor(color2);
        this.drawText("/", x2, y, slashWidth, "right");
        this.drawText(max, x1, y, valueWidth, "right");
      } else {
        this.changeTextColor(color1);
        this.drawText(current, x1, y, valueWidth, "right");
      }
    }
    drawActorHp(actor2, x, y, width = 186) {
      const color1 = this.hpGaugeColor1();
      const color2 = this.hpGaugeColor2();
      this.drawGauge(x, y, width, actor2.hpRate(), color1, color2);
      this.changeTextColor(this.systemColor());
      this.drawText(TextManager_default.hpA, x, y, 44);
      this.drawCurrentAndMax(
        actor2.hp,
        actor2.mhp,
        x,
        y,
        width,
        this.hpColor(actor2),
        this.normalColor()
      );
    }
    drawActorMp(actor2, x, y, width = 186) {
      const color1 = this.mpGaugeColor1();
      const color2 = this.mpGaugeColor2();
      this.drawGauge(x, y, width, actor2.mpRate(), color1, color2);
      this.changeTextColor(this.systemColor());
      this.drawText(TextManager_default.mpA, x, y, 44);
      this.drawCurrentAndMax(
        actor2.mp,
        actor2.mmp,
        x,
        y,
        width,
        this.mpColor(actor2),
        this.normalColor()
      );
    }
    drawActorTp(actor2, x, y, width = 96) {
      const color1 = this.tpGaugeColor1();
      const color2 = this.tpGaugeColor2();
      this.drawGauge(x, y, width, actor2.tpRate(), color1, color2);
      this.changeTextColor(this.systemColor());
      this.drawText(TextManager_default.tpA, x, y, 44);
      this.changeTextColor(this.tpColor(actor2));
      this.drawText(actor2.tp, x + width - 64, y, 64, "right");
    }
    drawActorSimpleStatus(actor2, x, y, width) {
      const lineHeight = this.lineHeight();
      const x2 = x + 180;
      const width2 = Math.min(200, width - 180 - this.textPadding());
      this.drawActorName(actor2, x, y);
      this.drawActorLevel(actor2, x, y + lineHeight * 1);
      this.drawActorIcons(actor2, x, y + lineHeight * 2);
      this.drawActorClass(actor2, x2, y);
      this.drawActorHp(actor2, x2, y + lineHeight * 1, width2);
      this.drawActorMp(actor2, x2, y + lineHeight * 2, width2);
    }
    drawItemName(item2, x, y, width = 312) {
      if (item2) {
        const iconBoxWidth = Window_Base._iconWidth + 4;
        this.resetTextColor();
        this.drawIcon(item2.iconIndex, x + 2, y + 2);
        this.drawText(item2.name, x + iconBoxWidth, y, width - iconBoxWidth);
      }
    }
    drawCurrencyValue(value3, unit, x, y, width) {
      const unitWidth = Math.min(80, this.textWidth(unit));
      this.resetTextColor();
      this.drawText(value3, x, y, width - unitWidth - 6, "right");
      this.changeTextColor(this.systemColor());
      this.drawText(unit, x + width - unitWidth, y, unitWidth, "right");
    }
    paramchangeTextColor(change) {
      if (change > 0) {
        return this.powerUpColor();
      } else if (change < 0) {
        return this.powerDownColor();
      } else {
        return this.normalColor();
      }
    }
    setBackgroundType(type) {
      if (type === 0) {
        this.opacity = 255;
      } else {
        this.opacity = 0;
      }
      if (type === 1) {
        this.showBackgroundDimmer();
      } else {
        this.hideBackgroundDimmer();
      }
    }
    showBackgroundDimmer() {
      if (!this._dimmerSprite) {
        this._dimmerSprite = new Sprite_default();
        this._dimmerSprite.bitmap = new Bitmap_default(0, 0);
        this.addChildToBack(this._dimmerSprite);
      }
      const bitmap = this._dimmerSprite.bitmap;
      if (bitmap.width !== this.width || bitmap.height !== this.height) {
        this.refreshDimmerBitmap();
      }
      this._dimmerSprite.visible = true;
      this.updateBackgroundDimmer();
    }
    hideBackgroundDimmer() {
      if (this._dimmerSprite) {
        this._dimmerSprite.visible = false;
      }
    }
    updateBackgroundDimmer() {
      if (this._dimmerSprite) {
        this._dimmerSprite.opacity = this.openness;
      }
    }
    refreshDimmerBitmap() {
      if (this._dimmerSprite) {
        const bitmap = this._dimmerSprite.bitmap;
        const w = this.width;
        const h = this.height;
        const m = this.padding;
        const c1 = this.dimColor1();
        const c2 = this.dimColor2();
        bitmap.resize(w, h);
        bitmap.gradientFillRect(0, 0, w, m, c2, c1, true);
        bitmap.fillRect(0, m, w, h - m * 2, c1);
        bitmap.gradientFillRect(0, h - m, w, m, c1, c2, true);
        this._dimmerSprite.setFrame(0, 0, w, h);
      }
    }
    dimColor1() {
      return "rgba(0, 0, 0, 0.6)";
    }
    dimColor2() {
      return "rgba(0, 0, 0, 0)";
    }
    canvasToLocalX(x) {
      let node = this;
      while (node) {
        x -= node.x;
        node = node.parent;
      }
      return x;
    }
    canvasToLocalY(y) {
      let node = this;
      while (node) {
        y -= node.y;
        node = node.parent;
      }
      return y;
    }
    reserveFaceImages() {
      self.$gameParty.members().forEach((actor2) => {
        ImageManager_default.reserveFace(actor2.faceName());
      }, this);
    }
  };
  Window_Base._iconWidth = 32;
  Window_Base._iconHeight = 32;
  Window_Base._faceWidth = 144;
  Window_Base._faceHeight = 144;
  var Window_Base_default = Window_Base;

  // src-www/js/rpg_windows/Window_Help.js
  var Window_Help = class extends Window_Base_default {
    constructor(...args) {
      super(...args);
      this.initialize(...args);
    }
    initialize(numLines) {
      const width = Graphics_default.boxWidth;
      const height = this.fittingHeight(numLines || 2);
      super.initialize(0, 0, width, height);
      this._text = "";
    }
    setText(text) {
      if (this._text !== text) {
        this._text = text;
        this.refresh();
      }
    }
    clear() {
      this.setText("");
    }
    setItem(item2) {
      this.setText(item2 ? item2.description : "");
    }
    refresh() {
      this.contents.clear();
      this.drawTextEx(this._text, this.textPadding(), 0);
    }
  };
  var Window_Help_default = Window_Help;

  // src-www/js/rpg_windows/Window_Gold.js
  var Window_Gold = class extends Window_Base_default {
    constructor(...args) {
      super(...args);
      this.initialize(...args);
    }
    initialize(x, y) {
      const width = this.windowWidth();
      const height = this.windowHeight();
      super.initialize(x, y, width, height);
      this.refresh();
    }
    windowWidth() {
      return 240;
    }
    windowHeight() {
      return this.fittingHeight(1);
    }
    refresh() {
      const x = this.textPadding();
      const width = this.contents.width - this.textPadding() * 2;
      this.contents.clear();
      this.drawCurrencyValue(this.value(), this.currencyUnit(), x, 0, width);
    }
    value() {
      return self.$gameParty.gold();
    }
    currencyUnit() {
      return TextManager_default.currencyUnit;
    }
    open() {
      this.refresh();
      super.open();
    }
  };
  var Window_Gold_default = Window_Gold;

  // src-www/js/rpg_windows/Window_Selectable.js
  var Window_Selectable = class extends Window_Base_default {
    constructor(...args) {
      super(...args);
      this.initialize(...args);
    }
    initialize(x, y, width, height) {
      super.initialize(x, y, width, height);
      this._index = -1;
      this._cursorFixed = false;
      this._cursorAll = false;
      this._stayCount = 0;
      this._helpWindow = null;
      this._handlers = {};
      this._touching = false;
      this._scrollX = 0;
      this._scrollY = 0;
      this.deactivate();
    }
    index() {
      return this._index;
    }
    cursorFixed() {
      return this._cursorFixed;
    }
    setCursorFixed(cursorFixed) {
      this._cursorFixed = cursorFixed;
    }
    cursorAll() {
      return this._cursorAll;
    }
    setCursorAll(cursorAll) {
      this._cursorAll = cursorAll;
    }
    maxCols() {
      return 1;
    }
    maxItems() {
      return 0;
    }
    spacing() {
      return 12;
    }
    itemWidth() {
      return Math.floor(
        (this.width - this.padding * 2 + this.spacing()) / this.maxCols() - this.spacing()
      );
    }
    itemHeight() {
      return this.lineHeight();
    }
    maxRows() {
      return Math.max(Math.ceil(this.maxItems() / this.maxCols()), 1);
    }
    activate() {
      super.activate();
      this.reselect();
    }
    deactivate() {
      super.deactivate();
      this.reselect();
    }
    select(index) {
      this._index = index;
      this._stayCount = 0;
      this.ensureCursorVisible();
      this.updateCursor();
      this.callUpdateHelp();
    }
    deselect() {
      this.select(-1);
    }
    reselect() {
      this.select(this._index);
    }
    row() {
      return Math.floor(this.index() / this.maxCols());
    }
    topRow() {
      return Math.floor(this._scrollY / this.itemHeight());
    }
    maxTopRow() {
      return Math.max(0, this.maxRows() - this.maxPageRows());
    }
    setTopRow(row) {
      const scrollY = row.clamp(0, this.maxTopRow()) * this.itemHeight();
      if (this._scrollY !== scrollY) {
        this._scrollY = scrollY;
        this.refresh();
        this.updateCursor();
      }
    }
    resetScroll() {
      this.setTopRow(0);
    }
    maxPageRows() {
      const pageHeight = this.height - this.padding * 2;
      return Math.floor(pageHeight / this.itemHeight());
    }
    maxPageItems() {
      return this.maxPageRows() * this.maxCols();
    }
    isHorizontal() {
      return this.maxPageRows() === 1;
    }
    bottomRow() {
      return Math.max(0, this.topRow() + this.maxPageRows() - 1);
    }
    setBottomRow(row) {
      this.setTopRow(row - (this.maxPageRows() - 1));
    }
    topIndex() {
      return this.topRow() * this.maxCols();
    }
    itemRect(index) {
      const rect = new Rectangle_default();
      const maxCols = this.maxCols();
      rect.width = this.itemWidth();
      rect.height = this.itemHeight();
      rect.x = index % maxCols * (rect.width + this.spacing()) - this._scrollX;
      rect.y = Math.floor(index / maxCols) * rect.height - this._scrollY;
      return rect;
    }
    itemRectForText(index) {
      const rect = this.itemRect(index);
      rect.x += this.textPadding();
      rect.width -= this.textPadding() * 2;
      return rect;
    }
    setHelpWindow(helpWindow) {
      this._helpWindow = helpWindow;
      this.callUpdateHelp();
    }
    showHelpWindow() {
      if (this._helpWindow) {
        this._helpWindow.show();
      }
    }
    hideHelpWindow() {
      if (this._helpWindow) {
        this._helpWindow.hide();
      }
    }
    setHandler(symbol, method) {
      this._handlers[symbol] = method;
    }
    isHandled(symbol) {
      return !!this._handlers[symbol];
    }
    callHandler(symbol) {
      if (this.isHandled(symbol)) {
        this._handlers[symbol]();
      }
    }
    isOpenAndActive() {
      return this.isOpen() && this.active;
    }
    isCursorMovable() {
      return this.isOpenAndActive() && !this._cursorFixed && !this._cursorAll && this.maxItems() > 0;
    }
    cursorDown(wrap) {
      const index = this.index();
      const maxItems = this.maxItems();
      const maxCols = this.maxCols();
      if (index < maxItems - maxCols || wrap && maxCols === 1) {
        this.select((index + maxCols) % maxItems);
      }
    }
    cursorUp(wrap) {
      const index = this.index();
      const maxItems = this.maxItems();
      const maxCols = this.maxCols();
      if (index >= maxCols || wrap && maxCols === 1) {
        this.select((index - maxCols + maxItems) % maxItems);
      }
    }
    cursorRight(wrap) {
      const index = this.index();
      const maxItems = this.maxItems();
      const maxCols = this.maxCols();
      if (maxCols >= 2 && (index < maxItems - 1 || wrap && this.isHorizontal())) {
        this.select((index + 1) % maxItems);
      }
    }
    cursorLeft(wrap) {
      const index = this.index();
      const maxItems = this.maxItems();
      const maxCols = this.maxCols();
      if (maxCols >= 2 && (index > 0 || wrap && this.isHorizontal())) {
        this.select((index - 1 + maxItems) % maxItems);
      }
    }
    cursorPagedown() {
      const index = this.index();
      const maxItems = this.maxItems();
      if (this.topRow() + this.maxPageRows() < this.maxRows()) {
        this.setTopRow(this.topRow() + this.maxPageRows());
        this.select(Math.min(index + this.maxPageItems(), maxItems - 1));
      }
    }
    cursorPageup() {
      const index = this.index();
      if (this.topRow() > 0) {
        this.setTopRow(this.topRow() - this.maxPageRows());
        this.select(Math.max(index - this.maxPageItems(), 0));
      }
    }
    scrollDown() {
      if (this.topRow() + 1 < this.maxRows()) {
        this.setTopRow(this.topRow() + 1);
      }
    }
    scrollUp() {
      if (this.topRow() > 0) {
        this.setTopRow(this.topRow() - 1);
      }
    }
    update() {
      super.update();
      this.updateArrows();
      this.processCursorMove();
      this.processHandling();
      this.processWheel();
      this.processTouch();
      this._stayCount++;
    }
    updateArrows() {
      const topRow = this.topRow();
      const maxTopRow = this.maxTopRow();
      this.downArrowVisible = maxTopRow > 0 && topRow < maxTopRow;
      this.upArrowVisible = topRow > 0;
    }
    processCursorMove() {
      if (this.isCursorMovable()) {
        const lastIndex = this.index();
        if (Input_default.isRepeated("down")) {
          this.cursorDown(Input_default.isTriggered("down"));
        }
        if (Input_default.isRepeated("up")) {
          this.cursorUp(Input_default.isTriggered("up"));
        }
        if (Input_default.isRepeated("right")) {
          this.cursorRight(Input_default.isTriggered("right"));
        }
        if (Input_default.isRepeated("left")) {
          this.cursorLeft(Input_default.isTriggered("left"));
        }
        if (!this.isHandled("pagedown") && Input_default.isTriggered("pagedown")) {
          this.cursorPagedown();
        }
        if (!this.isHandled("pageup") && Input_default.isTriggered("pageup")) {
          this.cursorPageup();
        }
        if (this.index() !== lastIndex) {
          SoundManager_default.playCursor();
        }
      }
    }
    processHandling() {
      if (this.isOpenAndActive()) {
        if (this.isOkEnabled() && this.isOkTriggered()) {
          this.processOk();
        } else if (this.isCancelEnabled() && this.isCancelTriggered()) {
          this.processCancel();
        } else if (this.isHandled("pagedown") && Input_default.isTriggered("pagedown")) {
          this.processPagedown();
        } else if (this.isHandled("pageup") && Input_default.isTriggered("pageup")) {
          this.processPageup();
        }
      }
    }
    processWheel() {
      if (this.isOpenAndActive()) {
        const threshold = 20;
        if (TouchInput_default.wheelY >= threshold) {
          this.scrollDown();
        }
        if (TouchInput_default.wheelY <= -threshold) {
          this.scrollUp();
        }
      }
    }
    processTouch() {
      if (this.isOpenAndActive()) {
        if (TouchInput_default.isTriggered() && this.isTouchedInsideFrame()) {
          this._touching = true;
          this.onTouch(true);
        } else if (TouchInput_default.isCancelled()) {
          if (this.isCancelEnabled()) {
            this.processCancel();
          }
        }
        if (this._touching) {
          if (TouchInput_default.isPressed()) {
            this.onTouch(false);
          } else {
            this._touching = false;
          }
        }
      } else {
        this._touching = false;
      }
    }
    isTouchedInsideFrame() {
      const x = this.canvasToLocalX(TouchInput_default.x);
      const y = this.canvasToLocalY(TouchInput_default.y);
      return x >= 0 && y >= 0 && x < this.width && y < this.height;
    }
    onTouch(triggered) {
      const lastIndex = this.index();
      const x = this.canvasToLocalX(TouchInput_default.x);
      const y = this.canvasToLocalY(TouchInput_default.y);
      const hitIndex = this.hitTest(x, y);
      if (hitIndex >= 0) {
        if (hitIndex === this.index()) {
          if (triggered && this.isTouchOkEnabled()) {
            this.processOk();
          }
        } else if (this.isCursorMovable()) {
          this.select(hitIndex);
        }
      } else if (this._stayCount >= 10) {
        if (y < this.padding) {
          this.cursorUp();
        } else if (y >= this.height - this.padding) {
          this.cursorDown();
        }
      }
      if (this.index() !== lastIndex) {
        SoundManager_default.playCursor();
      }
    }
    hitTest(x, y) {
      if (this.isContentsArea(x, y)) {
        const cx = x - this.padding;
        const cy = y - this.padding;
        const topIndex = this.topIndex();
        for (let i = 0; i < this.maxPageItems(); i++) {
          const index = topIndex + i;
          if (index < this.maxItems()) {
            const rect = this.itemRect(index);
            const right = rect.x + rect.width;
            const bottom = rect.y + rect.height;
            if (cx >= rect.x && cy >= rect.y && cx < right && cy < bottom) {
              return index;
            }
          }
        }
      }
      return -1;
    }
    isContentsArea(x, y) {
      const left = this.padding;
      const top = this.padding;
      const right = this.width - this.padding;
      const bottom = this.height - this.padding;
      return x >= left && y >= top && x < right && y < bottom;
    }
    isTouchOkEnabled() {
      return this.isOkEnabled();
    }
    isOkEnabled() {
      return this.isHandled("ok");
    }
    isCancelEnabled() {
      return this.isHandled("cancel");
    }
    isOkTriggered() {
      return Input_default.isRepeated("ok");
    }
    isCancelTriggered() {
      return Input_default.isRepeated("cancel");
    }
    processOk() {
      if (this.isCurrentItemEnabled()) {
        this.playOkSound();
        this.updateInputData();
        this.deactivate();
        this.callOkHandler();
      } else {
        this.playBuzzerSound();
      }
    }
    playOkSound() {
      SoundManager_default.playOk();
    }
    playBuzzerSound() {
      SoundManager_default.playBuzzer();
    }
    callOkHandler() {
      this.callHandler("ok");
    }
    processCancel() {
      SoundManager_default.playCancel();
      this.updateInputData();
      this.deactivate();
      this.callCancelHandler();
    }
    callCancelHandler() {
      this.callHandler("cancel");
    }
    processPageup() {
      SoundManager_default.playCursor();
      this.updateInputData();
      this.deactivate();
      this.callHandler("pageup");
    }
    processPagedown() {
      SoundManager_default.playCursor();
      this.updateInputData();
      this.deactivate();
      this.callHandler("pagedown");
    }
    updateInputData() {
      Input_default.update();
      TouchInput_default.update();
    }
    updateCursor() {
      if (this._cursorAll) {
        const allRowsHeight = this.maxRows() * this.itemHeight();
        this.setCursorRect(0, 0, this.contents.width, allRowsHeight);
        this.setTopRow(0);
      } else if (this.isCursorVisible()) {
        const rect = this.itemRect(this.index());
        this.setCursorRect(rect.x, rect.y, rect.width, rect.height);
      } else {
        this.setCursorRect(0, 0, 0, 0);
      }
    }
    isCursorVisible() {
      const row = this.row();
      return row >= this.topRow() && row <= this.bottomRow();
    }
    ensureCursorVisible() {
      const row = this.row();
      if (row < this.topRow()) {
        this.setTopRow(row);
      } else if (row > this.bottomRow()) {
        this.setBottomRow(row);
      }
    }
    callUpdateHelp() {
      if (this.active && this._helpWindow) {
        this.updateHelp();
      }
    }
    updateHelp() {
      this._helpWindow.clear();
    }
    setHelpWindowItem(item2) {
      if (this._helpWindow) {
        this._helpWindow.setItem(item2);
      }
    }
    isCurrentItemEnabled() {
      return true;
    }
    drawAllItems() {
      const topIndex = this.topIndex();
      for (let i = 0; i < this.maxPageItems(); i++) {
        const index = topIndex + i;
        if (index < this.maxItems()) {
          this.drawItem(index);
        }
      }
    }
    drawItem(index) {
    }
    clearItem(index) {
      const rect = this.itemRect(index);
      this.contents.clearRect(rect.x, rect.y, rect.width, rect.height);
    }
    redrawItem(index) {
      if (index >= 0) {
        this.clearItem(index);
        this.drawItem(index);
      }
    }
    redrawCurrentItem() {
      this.redrawItem(this.index());
    }
    refresh() {
      if (this.contents) {
        this.contents.clear();
        this.drawAllItems();
      }
    }
  };
  var Window_Selectable_default = Window_Selectable;

  // src-www/js/rpg_windows/Window_Command.js
  var Window_Command = class extends Window_Selectable_default {
    constructor(...args) {
      super(...args);
      this.initialize(...args);
    }
    initialize(x, y) {
      this.clearCommandList();
      this.makeCommandList();
      const width = this.windowWidth();
      const height = this.windowHeight();
      super.initialize(x, y, width, height);
      this.refresh();
      this.select(0);
      this.activate();
    }
    windowWidth() {
      return 240;
    }
    windowHeight() {
      return this.fittingHeight(this.numVisibleRows());
    }
    numVisibleRows() {
      return Math.ceil(this.maxItems() / this.maxCols());
    }
    maxItems() {
      return this._list.length;
    }
    clearCommandList() {
      this._list = [];
    }
    makeCommandList() {
    }
    addCommand(name, symbol, enabled, ext) {
      if (enabled === void 0) {
        enabled = true;
      }
      if (ext === void 0) {
        ext = null;
      }
      this._list.push({
        name,
        symbol,
        enabled,
        ext
      });
    }
    commandName(index) {
      return this._list[index].name;
    }
    commandSymbol(index) {
      return this._list[index].symbol;
    }
    isCommandEnabled(index) {
      return this._list[index].enabled;
    }
    currentData() {
      return this.index() >= 0 ? this._list[this.index()] : null;
    }
    isCurrentItemEnabled() {
      return this.currentData() ? this.currentData().enabled : false;
    }
    currentSymbol() {
      return this.currentData() ? this.currentData().symbol : null;
    }
    currentExt() {
      return this.currentData() ? this.currentData().ext : null;
    }
    findSymbol(symbol) {
      for (let i = 0; i < this._list.length; i++) {
        if (this._list[i].symbol === symbol) {
          return i;
        }
      }
      return -1;
    }
    selectSymbol(symbol) {
      const index = this.findSymbol(symbol);
      if (index >= 0) {
        this.select(index);
      } else {
        this.select(0);
      }
    }
    findExt(ext) {
      for (let i = 0; i < this._list.length; i++) {
        if (this._list[i].ext === ext) {
          return i;
        }
      }
      return -1;
    }
    selectExt(ext) {
      const index = this.findExt(ext);
      if (index >= 0) {
        this.select(index);
      } else {
        this.select(0);
      }
    }
    drawItem(index) {
      const rect = this.itemRectForText(index);
      const align = this.itemTextAlign();
      this.resetTextColor();
      this.changePaintOpacity(this.isCommandEnabled(index));
      this.drawText(this.commandName(index), rect.x, rect.y, rect.width, align);
    }
    itemTextAlign() {
      return "left";
    }
    isOkEnabled() {
      return true;
    }
    callOkHandler() {
      const symbol = this.currentSymbol();
      if (this.isHandled(symbol)) {
        this.callHandler(symbol);
      } else if (this.isHandled("ok")) {
        super.callOkHandler();
      } else {
        this.activate();
      }
    }
    refresh() {
      this.clearCommandList();
      this.makeCommandList();
      this.createContents();
      super.refresh();
    }
  };
  var Window_Command_default = Window_Command;

  // src-www/js/rpg_windows/Window_ChoiceList.js
  var Window_ChoiceList = class extends Window_Command_default {
    constructor(...args) {
      super(...args);
      this.initialize(...args);
    }
    initialize(messageWindow) {
      this._messageWindow = messageWindow;
      super.initialize(0, 0);
      this.openness = 0;
      this.deactivate();
      this._background = 0;
    }
    start() {
      this.updatePlacement();
      this.updateBackground();
      this.refresh();
      this.selectDefault();
      this.open();
      this.activate();
    }
    selectDefault() {
      this.select(self.$gameMessage.choiceDefaultType());
    }
    updatePlacement() {
      const positionType = self.$gameMessage.choicePositionType();
      const messageY = this._messageWindow.y;
      this.width = this.windowWidth();
      this.height = this.windowHeight();
      switch (positionType) {
        case 0:
          this.x = 0;
          break;
        case 1:
          this.x = (Graphics_default.boxWidth - this.width) / 2;
          break;
        case 2:
          this.x = Graphics_default.boxWidth - this.width;
          break;
      }
      if (messageY >= Graphics_default.boxHeight / 2) {
        this.y = messageY - this.height;
      } else {
        this.y = messageY + this._messageWindow.height;
      }
    }
    updateBackground() {
      this._background = self.$gameMessage.choiceBackground();
      this.setBackgroundType(this._background);
    }
    windowWidth() {
      const width = this.maxChoiceWidth() + this.padding * 2;
      return Math.min(width, Graphics_default.boxWidth);
    }
    numVisibleRows() {
      const messageY = this._messageWindow.y;
      const messageHeight = this._messageWindow.height;
      const centerY = Graphics_default.boxHeight / 2;
      const choices = self.$gameMessage.choices();
      let numLines = choices.length;
      let maxLines = 8;
      if (messageY < centerY && messageY + messageHeight > centerY) {
        maxLines = 4;
      }
      if (numLines > maxLines) {
        numLines = maxLines;
      }
      return numLines;
    }
    maxChoiceWidth() {
      let maxWidth = 96;
      const choices = self.$gameMessage.choices();
      for (let i = 0; i < choices.length; i++) {
        const choiceWidth = this.textWidthEx(choices[i]) + this.textPadding() * 2;
        if (maxWidth < choiceWidth) {
          maxWidth = choiceWidth;
        }
      }
      return maxWidth;
    }
    textWidthEx(text) {
      return this.drawTextEx(text, 0, this.contents.height);
    }
    contentsHeight() {
      return this.maxItems() * this.itemHeight();
    }
    makeCommandList() {
      const choices = self.$gameMessage.choices();
      for (let i = 0; i < choices.length; i++) {
        this.addCommand(choices[i], "choice");
      }
    }
    drawItem(index) {
      const rect = this.itemRectForText(index);
      this.drawTextEx(this.commandName(index), rect.x, rect.y);
    }
    isCancelEnabled() {
      return self.$gameMessage.choiceCancelType() !== -1;
    }
    isOkTriggered() {
      return Input_default.isTriggered("ok");
    }
    callOkHandler() {
      self.$gameMessage.onChoice(this.index());
      this._messageWindow.terminateMessage();
      this.close();
    }
    callCancelHandler() {
      self.$gameMessage.onChoice(self.$gameMessage.choiceCancelType());
      this._messageWindow.terminateMessage();
      this.close();
    }
  };
  var Window_ChoiceList_default = Window_ChoiceList;

  // src-www/js/rpg_sprites/Sprite_Button.js
  var Sprite_Button = class extends Sprite_default {
    constructor(...args) {
      super(...args);
      this.initialize(...args);
    }
    initialize() {
      super.initialize();
      this._touching = false;
      this._coldFrame = null;
      this._hotFrame = null;
      this._clickHandler = null;
    }
    update() {
      super.update();
      this.updateFrame();
      this.processTouch();
    }
    updateFrame() {
      let frame;
      if (this._touching) {
        frame = this._hotFrame;
      } else {
        frame = this._coldFrame;
      }
      if (frame) {
        this.setFrame(frame.x, frame.y, frame.width, frame.height);
      }
    }
    setColdFrame(x, y, width, height) {
      this._coldFrame = new Rectangle_default(x, y, width, height);
    }
    setHotFrame(x, y, width, height) {
      this._hotFrame = new Rectangle_default(x, y, width, height);
    }
    setClickHandler(method) {
      this._clickHandler = method;
    }
    callClickHandler() {
      if (this._clickHandler) {
        this._clickHandler();
      }
    }
    processTouch() {
      if (this.isActive()) {
        if (TouchInput_default.isTriggered() && this.isButtonTouched()) {
          this._touching = true;
        }
        if (this._touching) {
          if (TouchInput_default.isReleased() || !this.isButtonTouched()) {
            this._touching = false;
            if (TouchInput_default.isReleased()) {
              this.callClickHandler();
            }
          }
        }
      } else {
        this._touching = false;
      }
    }
    isActive() {
      let node = this;
      while (node) {
        if (!node.visible) {
          return false;
        }
        node = node.parent;
      }
      return true;
    }
    isButtonTouched() {
      const x = this.canvasToLocalX(TouchInput_default.x);
      const y = this.canvasToLocalY(TouchInput_default.y);
      return x >= 0 && y >= 0 && x < this.width && y < this.height;
    }
    canvasToLocalX(x) {
      let node = this;
      while (node) {
        x -= node.x;
        node = node.parent;
      }
      return x;
    }
    canvasToLocalY(y) {
      let node = this;
      while (node) {
        y -= node.y;
        node = node.parent;
      }
      return y;
    }
  };
  var Sprite_Button_default = Sprite_Button;

  // src-www/js/rpg_windows/Window_NumberInput.js
  var Window_NumberInput = class extends Window_Selectable_default {
    constructor(...args) {
      super(...args);
      this.initialize(...args);
    }
    initialize(messageWindow) {
      this._messageWindow = messageWindow;
      super.initialize(0, 0, 0, 0);
      this._number = 0;
      this._maxDigits = 1;
      this.openness = 0;
      this.createButtons();
      this.deactivate();
    }
    start() {
      this._maxDigits = self.$gameMessage.numInputMaxDigits();
      this._number = self.$gameVariables.value(
        self.$gameMessage.numInputVariableId()
      );
      this._number = this._number.clamp(0, Math.pow(10, this._maxDigits) - 1);
      this.updatePlacement();
      this.placeButtons();
      this.updateButtonsVisiblity();
      this.createContents();
      this.refresh();
      this.open();
      this.activate();
      this.select(0);
    }
    updatePlacement() {
      const messageY = this._messageWindow.y;
      const spacing = 8;
      this.width = this.windowWidth();
      this.height = this.windowHeight();
      this.x = (Graphics_default.boxWidth - this.width) / 2;
      if (messageY >= Graphics_default.boxHeight / 2) {
        this.y = messageY - this.height - spacing;
      } else {
        this.y = messageY + this._messageWindow.height + spacing;
      }
    }
    windowWidth() {
      return this.maxCols() * this.itemWidth() + this.padding * 2;
    }
    windowHeight() {
      return this.fittingHeight(1);
    }
    maxCols() {
      return this._maxDigits;
    }
    maxItems() {
      return this._maxDigits;
    }
    spacing() {
      return 0;
    }
    itemWidth() {
      return 32;
    }
    createButtons() {
      const bitmap = ImageManager_default.loadSystem("ButtonSet");
      const buttonWidth = 48;
      const buttonHeight = 48;
      this._buttons = [];
      for (let i = 0; i < 3; i++) {
        const button = new Sprite_Button_default();
        const x = buttonWidth * [1, 2, 4][i];
        const w = buttonWidth * (i === 2 ? 2 : 1);
        button.bitmap = bitmap;
        button.setColdFrame(x, 0, w, buttonHeight);
        button.setHotFrame(x, buttonHeight, w, buttonHeight);
        button.visible = false;
        this._buttons.push(button);
        this.addChild(button);
      }
      this._buttons[0].setClickHandler(this.onButtonDown.bind(this));
      this._buttons[1].setClickHandler(this.onButtonUp.bind(this));
      this._buttons[2].setClickHandler(this.onButtonOk.bind(this));
    }
    placeButtons() {
      const numButtons = this._buttons.length;
      const spacing = 16;
      let totalWidth = -spacing;
      for (let i = 0; i < numButtons; i++) {
        totalWidth += this._buttons[i].width + spacing;
      }
      let x = (this.width - totalWidth) / 2;
      for (let j = 0; j < numButtons; j++) {
        const button = this._buttons[j];
        button.x = x;
        button.y = this.buttonY();
        x += button.width + spacing;
      }
    }
    updateButtonsVisiblity() {
      if (TouchInput_default.date > Input_default.date) {
        this.showButtons();
      } else {
        this.hideButtons();
      }
    }
    showButtons() {
      for (let i = 0; i < this._buttons.length; i++) {
        this._buttons[i].visible = true;
      }
    }
    hideButtons() {
      for (let i = 0; i < this._buttons.length; i++) {
        this._buttons[i].visible = false;
      }
    }
    buttonY() {
      const spacing = 8;
      if (this._messageWindow.y >= Graphics_default.boxHeight / 2) {
        return 0 - this._buttons[0].height - spacing;
      } else {
        return this.height + spacing;
      }
    }
    update() {
      super.update();
      this.processDigitChange();
    }
    processDigitChange() {
      if (this.isOpenAndActive()) {
        if (Input_default.isRepeated("up")) {
          this.changeDigit(true);
        } else if (Input_default.isRepeated("down")) {
          this.changeDigit(false);
        }
      }
    }
    changeDigit(up) {
      const index = this.index();
      const place = Math.pow(10, this._maxDigits - 1 - index);
      let n = Math.floor(this._number / place) % 10;
      this._number -= n * place;
      if (up) {
        n = (n + 1) % 10;
      } else {
        n = (n + 9) % 10;
      }
      this._number += n * place;
      this.refresh();
      SoundManager_default.playCursor();
    }
    isTouchOkEnabled() {
      return false;
    }
    isOkEnabled() {
      return true;
    }
    isCancelEnabled() {
      return false;
    }
    isOkTriggered() {
      return Input_default.isTriggered("ok");
    }
    processOk() {
      SoundManager_default.playOk();
      self.$gameVariables.setValue(
        self.$gameMessage.numInputVariableId(),
        this._number
      );
      this._messageWindow.terminateMessage();
      this.updateInputData();
      this.deactivate();
      this.close();
    }
    drawItem(index) {
      const rect = this.itemRect(index);
      const align = "center";
      const s = this._number.padZero(this._maxDigits);
      const c = s.slice(index, index + 1);
      this.resetTextColor();
      this.drawText(c, rect.x, rect.y, rect.width, align);
    }
    onButtonUp() {
      this.changeDigit(true);
    }
    onButtonDown() {
      this.changeDigit(false);
    }
    onButtonOk() {
      this.processOk();
      this.hideButtons();
    }
  };
  var Window_NumberInput_default = Window_NumberInput;

  // src-www/js/rpg_windows/Window_ItemList.js
  var Window_ItemList = class extends Window_Selectable_default {
    constructor(...args) {
      super(...args);
      this.initialize(...args);
    }
    initialize(x, y, width, height) {
      super.initialize(x, y, width, height);
      this._category = "none";
      this._data = [];
    }
    setCategory(category) {
      if (this._category !== category) {
        this._category = category;
        this.refresh();
        this.resetScroll();
      }
    }
    maxCols() {
      return 2;
    }
    spacing() {
      return 48;
    }
    maxItems() {
      return this._data ? this._data.length : 1;
    }
    item() {
      const index = this.index();
      return this._data && index >= 0 ? this._data[index] : null;
    }
    isCurrentItemEnabled() {
      return this.isEnabled(this.item());
    }
    includes(item2) {
      switch (this._category) {
        case "item":
          return DataManager.isItem(item2) && item2.itypeId === 1;
        case "weapon":
          return DataManager.isWeapon(item2);
        case "armor":
          return DataManager.isArmor(item2);
        case "keyItem":
          return DataManager.isItem(item2) && item2.itypeId === 2;
        default:
          return false;
      }
    }
    needsNumber() {
      return true;
    }
    isEnabled(item2) {
      return self.$gameParty.canUse(item2);
    }
    makeItemList() {
      this._data = self.$gameParty.allItems().filter(function(item2) {
        return this.includes(item2);
      }, this);
      if (this.includes(null)) {
        this._data.push(null);
      }
    }
    selectLast() {
      const index = this._data.indexOf(self.$gameParty.lastItem());
      this.select(index >= 0 ? index : 0);
    }
    drawItem(index) {
      const item2 = this._data[index];
      if (item2) {
        const numberWidth = this.numberWidth();
        const rect = this.itemRect(index);
        rect.width -= this.textPadding();
        this.changePaintOpacity(this.isEnabled(item2));
        this.drawItemName(item2, rect.x, rect.y, rect.width - numberWidth);
        this.drawItemNumber(item2, rect.x, rect.y, rect.width);
        this.changePaintOpacity(1);
      }
    }
    numberWidth() {
      return this.textWidth("000");
    }
    drawItemNumber(item2, x, y, width) {
      if (this.needsNumber()) {
        this.drawText(":", x, y, width - this.textWidth("00"), "right");
        this.drawText(self.$gameParty.numItems(item2), x, y, width, "right");
      }
    }
    updateHelp() {
      this.setHelpWindowItem(this.item());
    }
    refresh() {
      this.makeItemList();
      this.createContents();
      this.drawAllItems();
    }
  };
  var Window_ItemList_default = Window_ItemList;

  // src-www/js/rpg_windows/Window_EventItem.js
  var Window_EventItem = class extends Window_ItemList_default {
    constructor(...args) {
      super(...args);
      this.initialize(...args);
    }
    initialize(messageWindow) {
      this._messageWindow = messageWindow;
      const width = Graphics_default.boxWidth;
      const height = this.windowHeight();
      super.initialize(0, 0, width, height);
      this.openness = 0;
      this.deactivate();
      this.setHandler("ok", this.onOk.bind(this));
      this.setHandler("cancel", this.onCancel.bind(this));
    }
    windowHeight() {
      return this.fittingHeight(this.numVisibleRows());
    }
    numVisibleRows() {
      return 4;
    }
    start() {
      this.refresh();
      this.updatePlacement();
      this.select(0);
      this.open();
      this.activate();
    }
    updatePlacement() {
      if (this._messageWindow.y >= Graphics_default.boxHeight / 2) {
        this.y = 0;
      } else {
        this.y = Graphics_default.boxHeight - this.height;
      }
    }
    includes(item2) {
      const itypeId = self.$gameMessage.itemChoiceItypeId();
      return DataManager.isItem(item2) && item2.itypeId === itypeId;
    }
    isEnabled(item2) {
      return true;
    }
    onOk() {
      const item2 = this.item();
      const itemId = item2 ? item2.id : 0;
      self.$gameVariables.setValue(
        self.$gameMessage.itemChoiceVariableId(),
        itemId
      );
      this._messageWindow.terminateMessage();
      this.close();
    }
    onCancel() {
      self.$gameVariables.setValue(self.$gameMessage.itemChoiceVariableId(), 0);
      this._messageWindow.terminateMessage();
      this.close();
    }
  };
  var Window_EventItem_default = Window_EventItem;

  // src-www/js/rpg_windows/Window_Message.js
  var Window_Message = class extends Window_Base_default {
    constructor(...args) {
      super(...args);
      this.initialize(...args);
    }
    initialize() {
      const width = this.windowWidth();
      const height = this.windowHeight();
      const x = (Graphics_default.boxWidth - width) / 2;
      super.initialize(x, 0, width, height);
      this.openness = 0;
      this.initMembers();
      this.createSubWindows();
      this.updatePlacement();
    }
    initMembers() {
      this._imageReservationId = Utils_default.generateRuntimeId();
      this._background = 0;
      this._positionType = 2;
      this._waitCount = 0;
      this._faceBitmap = null;
      this._textState = null;
      this.clearFlags();
    }
    subWindows() {
      return [
        this._goldWindow,
        this._choiceWindow,
        this._numberWindow,
        this._itemWindow
      ];
    }
    createSubWindows() {
      this._goldWindow = new Window_Gold_default(0, 0);
      this._goldWindow.x = Graphics_default.boxWidth - this._goldWindow.width;
      this._goldWindow.openness = 0;
      this._choiceWindow = new Window_ChoiceList_default(this);
      this._numberWindow = new Window_NumberInput_default(this);
      this._itemWindow = new Window_EventItem_default(this);
    }
    windowWidth() {
      return Graphics_default.boxWidth;
    }
    windowHeight() {
      return this.fittingHeight(this.numVisibleRows());
    }
    clearFlags() {
      this._showFast = false;
      this._lineShowFast = false;
      this._pauseSkip = false;
      this._textSpeed = 0;
      this._textSpeedCount = 0;
    }
    numVisibleRows() {
      return 4;
    }
    update() {
      this.checkToNotClose();
      super.update();
      while (!this.isOpening() && !this.isClosing()) {
        if (this.updateWait()) {
          return;
        } else if (this.updateLoading()) {
          return;
        } else if (this.updateInput()) {
          return;
        } else if (this.updateMessage()) {
          return;
        } else if (this.canStart()) {
          this.startMessage();
        } else {
          this.startInput();
          return;
        }
      }
    }
    checkToNotClose() {
      if (this.isClosing() && this.isOpen()) {
        if (this.doesContinue()) {
          this.open();
        }
      }
    }
    canStart() {
      return self.$gameMessage.hasText() && !self.$gameMessage.scrollMode();
    }
    startMessage() {
      this._textState = {};
      this._textState.index = 0;
      this._textState.text = this.convertEscapeCharacters(
        self.$gameMessage.allText()
      );
      this.newPage(this._textState);
      this.updatePlacement();
      this.updateBackground();
      this.open();
    }
    updatePlacement() {
      this._positionType = self.$gameMessage.positionType();
      this.y = this._positionType * (Graphics_default.boxHeight - this.height) / 2;
      this._goldWindow.y = this.y > 0 ? 0 : Graphics_default.boxHeight - this._goldWindow.height;
    }
    updateBackground() {
      this._background = self.$gameMessage.background();
      this.setBackgroundType(this._background);
    }
    terminateMessage() {
      this.close();
      this._goldWindow.close();
      self.$gameMessage.clear();
    }
    updateWait() {
      if (this._waitCount > 0) {
        this._waitCount--;
        return true;
      } else {
        return false;
      }
    }
    updateLoading() {
      if (this._faceBitmap) {
        if (this._faceBitmap.isReady()) {
          this.drawMessageFace();
          this._faceBitmap = null;
          return false;
        } else {
          return true;
        }
      } else {
        return false;
      }
    }
    updateInput() {
      if (this.isAnySubWindowActive()) {
        return true;
      }
      if (this.pause) {
        if (this.isTriggered()) {
          Input_default.update();
          this.pause = false;
          if (!this._textState) {
            this.terminateMessage();
          }
        }
        return true;
      }
      return false;
    }
    isAnySubWindowActive() {
      return this._choiceWindow.active || this._numberWindow.active || this._itemWindow.active;
    }
    updateMessage() {
      if (this._textState) {
        while (!this.isEndOfText(this._textState)) {
          if (this.needsNewPage(this._textState)) {
            this.newPage(this._textState);
          }
          this.updateShowFast();
          if (!this._showFast && !this._lineShowFast && this._textSpeedCount < this._textSpeed) {
            this._textSpeedCount++;
            break;
          }
          this._textSpeedCount = 0;
          this.processCharacter(this._textState);
          if (!this._showFast && !this._lineShowFast && this._textSpeed !== -1) {
            break;
          }
          if (this.pause || this._waitCount > 0) {
            break;
          }
        }
        if (this.isEndOfText(this._textState)) {
          this.onEndOfText();
        }
        return true;
      } else {
        return false;
      }
    }
    onEndOfText() {
      if (!this.startInput()) {
        if (!this._pauseSkip) {
          this.startPause();
        } else {
          this.terminateMessage();
        }
      }
      this._textState = null;
    }
    startInput() {
      if (self.$gameMessage.isChoice()) {
        this._choiceWindow.start();
        return true;
      } else if (self.$gameMessage.isNumberInput()) {
        this._numberWindow.start();
        return true;
      } else if (self.$gameMessage.isItemChoice()) {
        this._itemWindow.start();
        return true;
      } else {
        return false;
      }
    }
    isTriggered() {
      return Input_default.isRepeated("ok") || Input_default.isRepeated("cancel") || TouchInput_default.isRepeated();
    }
    doesContinue() {
      return self.$gameMessage.hasText() && !self.$gameMessage.scrollMode() && !this.areSettingsChanged();
    }
    areSettingsChanged() {
      return this._background !== self.$gameMessage.background() || this._positionType !== self.$gameMessage.positionType();
    }
    updateShowFast() {
      if (this.isTriggered()) {
        this._showFast = true;
      }
    }
    newPage(textState) {
      this.contents.clear();
      this.resetFontSettings();
      this.clearFlags();
      this.loadMessageFace();
      textState.x = this.newLineX();
      textState.y = 0;
      textState.left = this.newLineX();
      textState.height = this.calcTextHeight(textState, false);
    }
    loadMessageFace() {
      this._faceBitmap = ImageManager_default.reserveFace(
        self.$gameMessage.faceName(),
        0,
        this._imageReservationId
      );
    }
    drawMessageFace() {
      this.drawFace(
        self.$gameMessage.faceName(),
        self.$gameMessage.faceIndex(),
        0,
        0
      );
      ImageManager_default.releaseReservation(this._imageReservationId);
    }
    newLineX() {
      return self.$gameMessage.faceName() === "" ? 0 : 168;
    }
    processNewLine(textState) {
      this._lineShowFast = false;
      super.processNewLine(textState);
      if (this.needsNewPage(textState)) {
        this.startPause();
      }
    }
    processNewPage(textState) {
      super.processNewPage(textState);
      if (textState.text[textState.index] === "\n") {
        textState.index++;
      }
      textState.y = this.contents.height;
      this.startPause();
    }
    isEndOfText({ index, text }) {
      return index >= text.length;
    }
    needsNewPage(textState) {
      return !this.isEndOfText(textState) && textState.y + textState.height > this.contents.height;
    }
    processEscapeCharacter(code, textState) {
      switch (code) {
        case "$":
          this._goldWindow.open();
          break;
        case ".":
          this.startWait(15);
          break;
        case "|":
          this.startWait(60);
          break;
        case "!":
          this.startPause();
          break;
        case ">":
          this._lineShowFast = true;
          break;
        case "<":
          this._lineShowFast = false;
          break;
        case "^":
          this._pauseSkip = true;
          break;
        case "S":
          this._textSpeed = this.obtainEscapeParam(textState) - 1;
          break;
        default:
          super.processEscapeCharacter(code, textState);
          break;
      }
    }
    startWait(count) {
      this._waitCount = count;
    }
    startPause() {
      this.startWait(10);
      this.pause = true;
    }
  };
  var Window_Message_default = Window_Message;

  // src-www/js/rpg_windows/Window_ScrollText.js
  var Window_ScrollText = class extends Window_Base_default {
    constructor(...args) {
      super(...args);
      this.initialize(...args);
    }
    initialize() {
      const width = Graphics_default.boxWidth;
      const height = Graphics_default.boxHeight;
      super.initialize(0, 0, width, height);
      this.opacity = 0;
      this.hide();
      this._text = "";
      this._allTextHeight = 0;
    }
    update() {
      super.update();
      if (self.$gameMessage.scrollMode()) {
        if (this._text) {
          this.updateMessage();
        }
        if (!this._text && self.$gameMessage.hasText()) {
          this.startMessage();
        }
      }
    }
    startMessage() {
      this._text = self.$gameMessage.allText();
      this.refresh();
      this.show();
    }
    refresh() {
      const textState = {
        index: 0
      };
      textState.text = this.convertEscapeCharacters(this._text);
      this.resetFontSettings();
      this._allTextHeight = this.calcTextHeight(textState, true);
      this.createContents();
      this.origin.y = -this.height;
      this.drawTextEx(this._text, this.textPadding(), 1);
    }
    contentsHeight() {
      return Math.max(this._allTextHeight, 1);
    }
    updateMessage() {
      this.origin.y += this.scrollSpeed();
      if (this.origin.y >= this.contents.height) {
        this.terminateMessage();
      }
    }
    scrollSpeed() {
      let speed = self.$gameMessage.scrollSpeed() / 2;
      if (this.isFastForward()) {
        speed *= this.fastForwardRate();
      }
      return speed;
    }
    isFastForward() {
      if (self.$gameMessage.scrollNoFast()) {
        return false;
      } else {
        return Input_default.isPressed("ok") || Input_default.isPressed("shift") || TouchInput_default.isPressed();
      }
    }
    fastForwardRate() {
      return 3;
    }
    terminateMessage() {
      this._text = null;
      self.$gameMessage.clear();
      this.hide();
    }
  };
  var Window_ScrollText_default = Window_ScrollText;

  // src-www/js/rpg_windows/Window_BattleLog.js
  var Window_BattleLog = class extends Window_Selectable_default {
    constructor(...args) {
      super(...args);
      this.initialize(...args);
    }
    initialize() {
      const width = this.windowWidth();
      const height = this.windowHeight();
      super.initialize(0, 0, width, height);
      this.opacity = 0;
      this._lines = [];
      this._methods = [];
      this._waitCount = 0;
      this._waitMode = "";
      this._baseLineStack = [];
      this._spriteset = null;
      this.createBackBitmap();
      this.createBackSprite();
      this.refresh();
    }
    setSpriteset(spriteset) {
      this._spriteset = spriteset;
    }
    windowWidth() {
      return Graphics_default.boxWidth;
    }
    windowHeight() {
      return this.fittingHeight(this.maxLines());
    }
    maxLines() {
      return 10;
    }
    createBackBitmap() {
      this._backBitmap = new Bitmap_default(this.width, this.height);
    }
    createBackSprite() {
      this._backSprite = new Sprite_default();
      this._backSprite.bitmap = this._backBitmap;
      this._backSprite.y = this.y;
      this.addChildToBack(this._backSprite);
    }
    numLines() {
      return this._lines.length;
    }
    messageSpeed() {
      return 16;
    }
    isBusy() {
      return this._waitCount > 0 || this._waitMode || this._methods.length > 0;
    }
    update() {
      if (!this.updateWait()) {
        this.callNextMethod();
      }
    }
    updateWait() {
      return this.updateWaitCount() || this.updateWaitMode();
    }
    updateWaitCount() {
      if (this._waitCount > 0) {
        this._waitCount -= this.isFastForward() ? 3 : 1;
        if (this._waitCount < 0) {
          this._waitCount = 0;
        }
        return true;
      }
      return false;
    }
    updateWaitMode() {
      let waiting = false;
      switch (this._waitMode) {
        case "effect":
          waiting = this._spriteset.isEffecting();
          break;
        case "movement":
          waiting = this._spriteset.isAnyoneMoving();
          break;
      }
      if (!waiting) {
        this._waitMode = "";
      }
      return waiting;
    }
    setWaitMode(waitMode) {
      this._waitMode = waitMode;
    }
    callNextMethod() {
      if (this._methods.length > 0) {
        const method = this._methods.shift();
        if (method.name && this[method.name]) {
          this[method.name](...method.params);
        } else {
          throw new Error(`Method not found: ${method.name}`);
        }
      }
    }
    isFastForward() {
      return Input_default.isLongPressed("ok") || Input_default.isPressed("shift") || TouchInput_default.isLongPressed();
    }
    push(methodName) {
      const methodArgs = Array.prototype.slice.call(arguments, 1);
      this._methods.push({
        name: methodName,
        params: methodArgs
      });
    }
    clear() {
      this._lines = [];
      this._baseLineStack = [];
      this.refresh();
    }
    wait() {
      this._waitCount = this.messageSpeed();
    }
    waitForEffect() {
      this.setWaitMode("effect");
    }
    waitForMovement() {
      this.setWaitMode("movement");
    }
    addText(text) {
      this._lines.push(text);
      this.refresh();
      this.wait();
    }
    pushBaseLine() {
      this._baseLineStack.push(this._lines.length);
    }
    popBaseLine() {
      const baseLine = this._baseLineStack.pop();
      while (this._lines.length > baseLine) {
        this._lines.pop();
      }
    }
    waitForNewLine() {
      let baseLine = 0;
      if (this._baseLineStack.length > 0) {
        baseLine = this._baseLineStack[this._baseLineStack.length - 1];
      }
      if (this._lines.length > baseLine) {
        this.wait();
      }
    }
    popupDamage(target2) {
      target2.startDamagePopup();
    }
    performActionStart(subject, action) {
      subject.performActionStart(action);
    }
    performAction(subject, action) {
      subject.performAction(action);
    }
    performActionEnd(subject) {
      subject.performActionEnd();
    }
    performDamage(target2) {
      target2.performDamage();
    }
    performMiss(target2) {
      target2.performMiss();
    }
    performRecovery(target2) {
      target2.performRecovery();
    }
    performEvasion(target2) {
      target2.performEvasion();
    }
    performMagicEvasion(target2) {
      target2.performMagicEvasion();
    }
    performCounter(target2) {
      target2.performCounter();
    }
    performReflection(target2) {
      target2.performReflection();
    }
    performSubstitute(substitute, target2) {
      substitute.performSubstitute(target2);
    }
    performCollapse(target2) {
      target2.performCollapse();
    }
    showAnimation(subject, targets, animationId) {
      if (animationId < 0) {
        this.showAttackAnimation(subject, targets);
      } else {
        this.showNormalAnimation(targets, animationId);
      }
    }
    showAttackAnimation(subject, targets) {
      if (subject.isActor()) {
        this.showActorAttackAnimation(subject, targets);
      } else {
        this.showEnemyAttackAnimation(subject, targets);
      }
    }
    showActorAttackAnimation(subject, targets) {
      this.showNormalAnimation(targets, subject.attackAnimationId1(), false);
      this.showNormalAnimation(targets, subject.attackAnimationId2(), true);
    }
    showEnemyAttackAnimation(subject, targets) {
      SoundManager_default.playEnemyAttack();
    }
    showNormalAnimation(targets, animationId, mirror) {
      const animation = self.$dataAnimations[animationId];
      if (animation) {
        let delay = this.animationBaseDelay();
        const nextDelay = this.animationNextDelay();
        targets.forEach((target2) => {
          target2.startAnimation(animationId, mirror, delay);
          delay += nextDelay;
        });
      }
    }
    animationBaseDelay() {
      return 8;
    }
    animationNextDelay() {
      return 12;
    }
    refresh() {
      this.drawBackground();
      this.contents.clear();
      for (let i = 0; i < this._lines.length; i++) {
        this.drawLineText(i);
      }
    }
    drawBackground() {
      const rect = this.backRect();
      const color = this.backColor();
      this._backBitmap.clear();
      this._backBitmap.paintOpacity = this.backPaintOpacity();
      this._backBitmap.fillRect(rect.x, rect.y, rect.width, rect.height, color);
      this._backBitmap.paintOpacity = 255;
    }
    backRect() {
      return {
        x: 0,
        y: this.padding,
        width: this.width,
        height: this.numLines() * this.lineHeight()
      };
    }
    backColor() {
      return "#000000";
    }
    backPaintOpacity() {
      return 64;
    }
    drawLineText(index) {
      const rect = this.itemRectForText(index);
      this.contents.clearRect(rect.x, rect.y, rect.width, rect.height);
      this.drawTextEx(this._lines[index], rect.x, rect.y, rect.width);
    }
    startTurn() {
      this.push("wait");
    }
    startAction(subject, action, targets) {
      const item2 = action.item();
      this.push("performActionStart", subject, action);
      this.push("waitForMovement");
      this.push("performAction", subject, action);
      this.push("showAnimation", subject, targets.clone(), item2.animationId);
      this.displayAction(subject, item2);
    }
    endAction(subject) {
      this.push("waitForNewLine");
      this.push("clear");
      this.push("performActionEnd", subject);
    }
    displayCurrentState(subject) {
      const stateText = subject.mostImportantStateText();
      if (stateText) {
        this.push("addText", subject.name() + stateText);
        this.push("wait");
        this.push("clear");
      }
    }
    displayRegeneration(subject) {
      this.push("popupDamage", subject);
    }
    displayAction(subject, item2) {
      const numMethods = this._methods.length;
      if (DataManager.isSkill(item2)) {
        if (item2.message1) {
          this.push("addText", subject.name() + item2.message1.format(item2.name));
        }
        if (item2.message2) {
          this.push("addText", item2.message2.format(item2.name));
        }
      } else {
        this.push(
          "addText",
          TextManager_default.useItem.format(subject.name(), item2.name)
        );
      }
      if (this._methods.length === numMethods) {
        this.push("wait");
      }
    }
    displayCounter(target2) {
      this.push("performCounter", target2);
      this.push("addText", TextManager_default.counterAttack.format(target2.name()));
    }
    displayReflection(target2) {
      this.push("performReflection", target2);
      this.push("addText", TextManager_default.magicReflection.format(target2.name()));
    }
    displaySubstitute(substitute, target2) {
      const substName = substitute.name();
      this.push("performSubstitute", substitute, target2);
      this.push(
        "addText",
        TextManager_default.substitute.format(substName, target2.name())
      );
    }
    displayActionResults(subject, target2) {
      if (target2.result().used) {
        this.push("pushBaseLine");
        this.displayCritical(target2);
        this.push("popupDamage", target2);
        this.push("popupDamage", subject);
        this.displayDamage(target2);
        this.displayAffectedStatus(target2);
        this.displayFailure(target2);
        this.push("waitForNewLine");
        this.push("popBaseLine");
      }
    }
    displayFailure(target2) {
      if (target2.result().isHit() && !target2.result().success) {
        this.push("addText", TextManager_default.actionFailure.format(target2.name()));
      }
    }
    displayCritical(target2) {
      if (target2.result().critical) {
        if (target2.isActor()) {
          this.push("addText", TextManager_default.criticalToActor);
        } else {
          this.push("addText", TextManager_default.criticalToEnemy);
        }
      }
    }
    displayDamage(target2) {
      if (target2.result().missed) {
        this.displayMiss(target2);
      } else if (target2.result().evaded) {
        this.displayEvasion(target2);
      } else {
        this.displayHpDamage(target2);
        this.displayMpDamage(target2);
        this.displayTpDamage(target2);
      }
    }
    displayMiss(target2) {
      let fmt;
      if (target2.result().physical) {
        fmt = target2.isActor() ? TextManager_default.actorNoHit : TextManager_default.enemyNoHit;
        this.push("performMiss", target2);
      } else {
        fmt = TextManager_default.actionFailure;
      }
      this.push("addText", fmt.format(target2.name()));
    }
    displayEvasion(target2) {
      let fmt;
      if (target2.result().physical) {
        fmt = TextManager_default.evasion;
        this.push("performEvasion", target2);
      } else {
        fmt = TextManager_default.magicEvasion;
        this.push("performMagicEvasion", target2);
      }
      this.push("addText", fmt.format(target2.name()));
    }
    displayHpDamage(target2) {
      if (target2.result().hpAffected) {
        if (target2.result().hpDamage > 0 && !target2.result().drain) {
          this.push("performDamage", target2);
        }
        if (target2.result().hpDamage < 0) {
          this.push("performRecovery", target2);
        }
        this.push("addText", this.makeHpDamageText(target2));
      }
    }
    displayMpDamage(target2) {
      if (target2.isAlive() && target2.result().mpDamage !== 0) {
        if (target2.result().mpDamage < 0) {
          this.push("performRecovery", target2);
        }
        this.push("addText", this.makeMpDamageText(target2));
      }
    }
    displayTpDamage(target2) {
      if (target2.isAlive() && target2.result().tpDamage !== 0) {
        if (target2.result().tpDamage < 0) {
          this.push("performRecovery", target2);
        }
        this.push("addText", this.makeTpDamageText(target2));
      }
    }
    displayAffectedStatus(target2) {
      if (target2.result().isStatusAffected()) {
        this.push("pushBaseLine");
        this.displayChangedStates(target2);
        this.displayChangedBuffs(target2);
        this.push("waitForNewLine");
        this.push("popBaseLine");
      }
    }
    displayAutoAffectedStatus(target2) {
      if (target2.result().isStatusAffected()) {
        this.displayAffectedStatus(target2, null);
        this.push("clear");
      }
    }
    displayChangedStates(target2) {
      this.displayAddedStates(target2);
      this.displayRemovedStates(target2);
    }
    displayAddedStates(target2) {
      target2.result().addedStateObjects().forEach(function({ message1, message2, id }) {
        const stateMsg = target2.isActor() ? message1 : message2;
        if (id === target2.deathStateId()) {
          this.push("performCollapse", target2);
        }
        if (stateMsg) {
          this.push("popBaseLine");
          this.push("pushBaseLine");
          this.push("addText", target2.name() + stateMsg);
          this.push("waitForEffect");
        }
      }, this);
    }
    displayRemovedStates(target2) {
      target2.result().removedStateObjects().forEach(function({ message4 }) {
        if (message4) {
          this.push("popBaseLine");
          this.push("pushBaseLine");
          this.push("addText", target2.name() + message4);
        }
      }, this);
    }
    displayChangedBuffs(target2) {
      const result2 = target2.result();
      this.displayBuffs(target2, result2.addedBuffs, TextManager_default.buffAdd);
      this.displayBuffs(target2, result2.addedDebuffs, TextManager_default.debuffAdd);
      this.displayBuffs(target2, result2.removedBuffs, TextManager_default.buffRemove);
    }
    displayBuffs(target2, buffs, fmt) {
      buffs.forEach(function(paramId) {
        this.push("popBaseLine");
        this.push("pushBaseLine");
        this.push(
          "addText",
          fmt.format(target2.name(), TextManager_default.param(paramId))
        );
      }, this);
    }
    makeHpDamageText(target2) {
      const result2 = target2.result();
      const damage = result2.hpDamage;
      const isActor = target2.isActor();
      let fmt;
      if (damage > 0 && result2.drain) {
        fmt = isActor ? TextManager_default.actorDrain : TextManager_default.enemyDrain;
        return fmt.format(target2.name(), TextManager_default.hp, damage);
      } else if (damage > 0) {
        fmt = isActor ? TextManager_default.actorDamage : TextManager_default.enemyDamage;
        return fmt.format(target2.name(), damage);
      } else if (damage < 0) {
        fmt = isActor ? TextManager_default.actorRecovery : TextManager_default.enemyRecovery;
        return fmt.format(target2.name(), TextManager_default.hp, -damage);
      } else {
        fmt = isActor ? TextManager_default.actorNoDamage : TextManager_default.enemyNoDamage;
        return fmt.format(target2.name());
      }
    }
    makeMpDamageText(target2) {
      const result2 = target2.result();
      const damage = result2.mpDamage;
      const isActor = target2.isActor();
      let fmt;
      if (damage > 0 && result2.drain) {
        fmt = isActor ? TextManager_default.actorDrain : TextManager_default.enemyDrain;
        return fmt.format(target2.name(), TextManager_default.mp, damage);
      } else if (damage > 0) {
        fmt = isActor ? TextManager_default.actorLoss : TextManager_default.enemyLoss;
        return fmt.format(target2.name(), TextManager_default.mp, damage);
      } else if (damage < 0) {
        fmt = isActor ? TextManager_default.actorRecovery : TextManager_default.enemyRecovery;
        return fmt.format(target2.name(), TextManager_default.mp, -damage);
      } else {
        return "";
      }
    }
    makeTpDamageText(target2) {
      const result2 = target2.result();
      const damage = result2.tpDamage;
      const isActor = target2.isActor();
      let fmt;
      if (damage > 0) {
        fmt = isActor ? TextManager_default.actorLoss : TextManager_default.enemyLoss;
        return fmt.format(target2.name(), TextManager_default.tp, damage);
      } else if (damage < 0) {
        fmt = isActor ? TextManager_default.actorGain : TextManager_default.enemyGain;
        return fmt.format(target2.name(), TextManager_default.tp, -damage);
      } else {
        return "";
      }
    }
  };
  var Window_BattleLog_default = Window_BattleLog;

  // src-www/js/rpg_windows/Window_PartyCommand.js
  var Window_PartyCommand = class extends Window_Command_default {
    constructor(...args) {
      super(...args);
      this.initialize(...args);
    }
    initialize() {
      const y = Graphics_default.boxHeight - this.windowHeight();
      super.initialize(0, y);
      this.openness = 0;
      this.deactivate();
    }
    windowWidth() {
      return 192;
    }
    numVisibleRows() {
      return 4;
    }
    makeCommandList() {
      this.addCommand(TextManager_default.fight, "fight");
      this.addCommand(TextManager_default.escape, "escape", BattleManager_default.canEscape());
    }
    setup() {
      this.clearCommandList();
      this.makeCommandList();
      this.refresh();
      this.select(0);
      this.activate();
      this.open();
    }
  };
  var Window_PartyCommand_default = Window_PartyCommand;

  // src-www/js/rpg_managers/ConfigManager.js
  var ConfigManager = class {
    constructor() {
      throw new Error("This is a static class");
    }
    static async load() {
      let json;
      let config = {};
      try {
        json = await GameStorageManager_default.load(-1);
      } catch (e) {
        console.error(e);
      }
      if (json) {
        config = JSON.parse(json);
      }
      this.applyData(config);
      this._isConfigLoaded = true;
    }
    static isConfigLoaded() {
      return this._isConfigLoaded;
    }
    static async save() {
      await GameStorageManager_default.save(-1, JSON.stringify(this.makeData()));
    }
    static makeData() {
      const config = {};
      config.alwaysDash = this.alwaysDash;
      config.commandRemember = this.commandRemember;
      config.bgmVolume = this.bgmVolume;
      config.bgsVolume = this.bgsVolume;
      config.meVolume = this.meVolume;
      config.seVolume = this.seVolume;
      return config;
    }
    static applyData(config) {
      this.alwaysDash = this.readFlag(config, "alwaysDash");
      this.commandRemember = this.readFlag(config, "commandRemember");
      this.bgmVolume = this.readVolume(config, "bgmVolume");
      this.bgsVolume = this.readVolume(config, "bgsVolume");
      this.meVolume = this.readVolume(config, "meVolume");
      this.seVolume = this.readVolume(config, "seVolume");
    }
    static readFlag(config, name) {
      return !!config[name];
    }
    static readVolume(config, name) {
      const value3 = config[name];
      if (value3 !== void 0) {
        return Number(value3).clamp(0, 100);
      } else {
        return 100;
      }
    }
  };
  ConfigManager._isConfigLoaded = false;
  ConfigManager.alwaysDash = false;
  ConfigManager.commandRemember = false;
  Object.defineProperty(ConfigManager, "bgmVolume", {
    get() {
      return AudioManager_default._bgmVolume;
    },
    set(value3) {
      AudioManager_default.bgmVolume = value3;
    },
    configurable: true
  });
  Object.defineProperty(ConfigManager, "bgsVolume", {
    get() {
      return AudioManager_default.bgsVolume;
    },
    set(value3) {
      AudioManager_default.bgsVolume = value3;
    },
    configurable: true
  });
  Object.defineProperty(ConfigManager, "meVolume", {
    get() {
      return AudioManager_default.meVolume;
    },
    set(value3) {
      AudioManager_default.meVolume = value3;
    },
    configurable: true
  });
  Object.defineProperty(ConfigManager, "seVolume", {
    get() {
      return AudioManager_default.seVolume;
    },
    set(value3) {
      AudioManager_default.seVolume = value3;
    },
    configurable: true
  });
  var ConfigManager_default = ConfigManager;

  // src-www/js/rpg_windows/Window_ActorCommand.js
  var Window_ActorCommand = class extends Window_Command_default {
    constructor(...args) {
      super(...args);
      this.initialize(...args);
    }
    initialize() {
      const y = Graphics_default.boxHeight - this.windowHeight();
      super.initialize(0, y);
      this.openness = 0;
      this.deactivate();
      this._actor = null;
    }
    windowWidth() {
      return 192;
    }
    numVisibleRows() {
      return 4;
    }
    makeCommandList() {
      if (this._actor) {
        this.addAttackCommand();
        this.addSkillCommands();
        this.addGuardCommand();
        this.addItemCommand();
      }
    }
    addAttackCommand() {
      this.addCommand(TextManager_default.attack, "attack", this._actor.canAttack());
    }
    addSkillCommands() {
      const skillTypes = this._actor.addedSkillTypes();
      skillTypes.sort((a2, b2) => a2 - b2);
      skillTypes.forEach(function(stypeId) {
        const name = self.$dataSystem.skillTypes[stypeId];
        this.addCommand(name, "skill", true, stypeId);
      }, this);
    }
    addGuardCommand() {
      this.addCommand(TextManager_default.guard, "guard", this._actor.canGuard());
    }
    addItemCommand() {
      this.addCommand(TextManager_default.item, "item");
    }
    setup(actor2) {
      this._actor = actor2;
      this.clearCommandList();
      this.makeCommandList();
      this.refresh();
      this.selectLast();
      this.activate();
      this.open();
    }
    processOk() {
      if (this._actor) {
        if (ConfigManager_default.commandRemember) {
          this._actor.setLastCommandSymbol(this.currentSymbol());
        } else {
          this._actor.setLastCommandSymbol("");
        }
      }
      super.processOk();
    }
    selectLast() {
      this.select(0);
      if (this._actor && ConfigManager_default.commandRemember) {
        const symbol = this._actor.lastCommandSymbol();
        this.selectSymbol(symbol);
        if (symbol === "skill") {
          const skill = this._actor.lastBattleSkill();
          if (skill) {
            this.selectExt(skill.stypeId);
          }
        }
      }
    }
  };
  var Window_ActorCommand_default = Window_ActorCommand;

  // src-www/js/rpg_windows/Window_BattleStatus.js
  var Window_BattleStatus = class extends Window_Selectable_default {
    constructor(...args) {
      super(...args);
      this.initialize(...args);
    }
    initialize() {
      const width = this.windowWidth();
      const height = this.windowHeight();
      const x = Graphics_default.boxWidth - width;
      const y = Graphics_default.boxHeight - height;
      super.initialize(x, y, width, height);
      this.refresh();
      this.openness = 0;
    }
    windowWidth() {
      return Graphics_default.boxWidth - 192;
    }
    windowHeight() {
      return this.fittingHeight(this.numVisibleRows());
    }
    numVisibleRows() {
      return 4;
    }
    maxItems() {
      return self.$gameParty.battleMembers().length;
    }
    refresh() {
      this.contents.clear();
      this.drawAllItems();
    }
    drawItem(index) {
      const actor2 = self.$gameParty.battleMembers()[index];
      this.drawBasicArea(this.basicAreaRect(index), actor2);
      this.drawGaugeArea(this.gaugeAreaRect(index), actor2);
    }
    basicAreaRect(index) {
      const rect = this.itemRectForText(index);
      rect.width -= this.gaugeAreaWidth() + 15;
      return rect;
    }
    gaugeAreaRect(index) {
      const rect = this.itemRectForText(index);
      rect.x += rect.width - this.gaugeAreaWidth();
      rect.width = this.gaugeAreaWidth();
      return rect;
    }
    gaugeAreaWidth() {
      return 330;
    }
    drawBasicArea({ x, y, width }, actor2) {
      this.drawActorName(actor2, x + 0, y, 150);
      this.drawActorIcons(actor2, x + 156, y, width - 156);
    }
    drawGaugeArea(rect, actor2) {
      if (self.$dataSystem.optDisplayTp) {
        this.drawGaugeAreaWithTp(rect, actor2);
      } else {
        this.drawGaugeAreaWithoutTp(rect, actor2);
      }
    }
    drawGaugeAreaWithTp({ x, y }, actor2) {
      this.drawActorHp(actor2, x + 0, y, 108);
      this.drawActorMp(actor2, x + 123, y, 96);
      this.drawActorTp(actor2, x + 234, y, 96);
    }
    drawGaugeAreaWithoutTp({ x, y }, actor2) {
      this.drawActorHp(actor2, x + 0, y, 201);
      this.drawActorMp(actor2, x + 216, y, 114);
    }
  };
  var Window_BattleStatus_default = Window_BattleStatus;

  // src-www/js/rpg_windows/Window_BattleActor.js
  var Window_BattleActor = class extends Window_BattleStatus_default {
    constructor(...args) {
      super(...args);
      this.initialize(...args);
    }
    initialize(x, y) {
      super.initialize();
      this.x = x;
      this.y = y;
      this.openness = 255;
      this.hide();
    }
    show() {
      this.select(0);
      super.show();
    }
    hide() {
      super.hide();
      self.$gameParty.select(null);
    }
    select(index) {
      super.select(index);
      self.$gameParty.select(this.actor());
    }
    actor() {
      return self.$gameParty.members()[this.index()];
    }
  };
  var Window_BattleActor_default = Window_BattleActor;

  // src-www/js/rpg_windows/Window_BattleEnemy.js
  var Window_BattleEnemy = class extends Window_Selectable_default {
    constructor(...args) {
      super(...args);
      this.initialize(...args);
    }
    initialize(x, y) {
      this._enemies = [];
      const width = this.windowWidth();
      const height = this.windowHeight();
      super.initialize(x, y, width, height);
      this.refresh();
      this.hide();
    }
    windowWidth() {
      return Graphics_default.boxWidth - 192;
    }
    windowHeight() {
      return this.fittingHeight(this.numVisibleRows());
    }
    numVisibleRows() {
      return 4;
    }
    maxCols() {
      return 2;
    }
    maxItems() {
      return this._enemies.length;
    }
    enemy() {
      return this._enemies[this.index()];
    }
    enemyIndex() {
      const enemy2 = this.enemy();
      return enemy2 ? enemy2.index() : -1;
    }
    drawItem(index) {
      this.resetTextColor();
      const name = this._enemies[index].name();
      const rect = this.itemRectForText(index);
      this.drawText(name, rect.x, rect.y, rect.width);
    }
    show() {
      this.refresh();
      this.select(0);
      super.show();
    }
    hide() {
      super.hide();
      self.$gameTroop.select(null);
    }
    refresh() {
      this._enemies = self.$gameTroop.aliveMembers();
      super.refresh();
    }
    select(index) {
      super.select(index);
      self.$gameTroop.select(this.enemy());
    }
  };
  var Window_BattleEnemy_default = Window_BattleEnemy;

  // src-www/js/rpg_windows/Window_SkillList.js
  var Window_SkillList = class extends Window_Selectable_default {
    constructor(...args) {
      super(...args);
      this.initialize(...args);
    }
    initialize(x, y, width, height) {
      super.initialize(x, y, width, height);
      this._actor = null;
      this._stypeId = 0;
      this._data = [];
    }
    setActor(actor2) {
      if (this._actor !== actor2) {
        this._actor = actor2;
        this.refresh();
        this.resetScroll();
      }
    }
    setStypeId(stypeId) {
      if (this._stypeId !== stypeId) {
        this._stypeId = stypeId;
        this.refresh();
        this.resetScroll();
      }
    }
    maxCols() {
      return 2;
    }
    spacing() {
      return 48;
    }
    maxItems() {
      return this._data ? this._data.length : 1;
    }
    item() {
      return this._data && this.index() >= 0 ? this._data[this.index()] : null;
    }
    isCurrentItemEnabled() {
      return this.isEnabled(this._data[this.index()]);
    }
    includes(item2) {
      return item2 && item2.stypeId === this._stypeId;
    }
    isEnabled(item2) {
      return this._actor && this._actor.canUse(item2);
    }
    makeItemList() {
      if (this._actor) {
        this._data = this._actor.skills().filter(function(item2) {
          return this.includes(item2);
        }, this);
      } else {
        this._data = [];
      }
    }
    selectLast() {
      let skill;
      if (self.$gameParty.inBattle()) {
        skill = this._actor.lastBattleSkill();
      } else {
        skill = this._actor.lastMenuSkill();
      }
      const index = this._data.indexOf(skill);
      this.select(index >= 0 ? index : 0);
    }
    drawItem(index) {
      const skill = this._data[index];
      if (skill) {
        const costWidth = this.costWidth();
        const rect = this.itemRect(index);
        rect.width -= this.textPadding();
        this.changePaintOpacity(this.isEnabled(skill));
        this.drawItemName(skill, rect.x, rect.y, rect.width - costWidth);
        this.drawSkillCost(skill, rect.x, rect.y, rect.width);
        this.changePaintOpacity(1);
      }
    }
    costWidth() {
      return this.textWidth("000");
    }
    drawSkillCost(skill, x, y, width) {
      if (this._actor.skillTpCost(skill) > 0) {
        this.changeTextColor(this.tpCostColor());
        this.drawText(this._actor.skillTpCost(skill), x, y, width, "right");
      } else if (this._actor.skillMpCost(skill) > 0) {
        this.changeTextColor(this.mpCostColor());
        this.drawText(this._actor.skillMpCost(skill), x, y, width, "right");
      }
    }
    updateHelp() {
      this.setHelpWindowItem(this.item());
    }
    refresh() {
      this.makeItemList();
      this.createContents();
      this.drawAllItems();
    }
  };
  var Window_SkillList_default = Window_SkillList;

  // src-www/js/rpg_windows/Window_BattleSkill.js
  var Window_BattleSkill = class extends Window_SkillList_default {
    constructor(...args) {
      super(...args);
      this.initialize(...args);
    }
    initialize(x, y, width, height) {
      super.initialize(x, y, width, height);
      this.hide();
    }
    show() {
      this.selectLast();
      this.showHelpWindow();
      super.show();
    }
    hide() {
      this.hideHelpWindow();
      super.hide();
    }
  };
  var Window_BattleSkill_default = Window_BattleSkill;

  // src-www/js/rpg_windows/Window_BattleItem.js
  var Window_BattleItem = class extends Window_ItemList_default {
    constructor(...args) {
      super(...args);
      this.initialize(...args);
    }
    initialize(x, y, width, height) {
      super.initialize(x, y, width, height);
      this.hide();
    }
    includes(item2) {
      return self.$gameParty.canUse(item2);
    }
    show() {
      this.selectLast();
      this.showHelpWindow();
      super.show();
    }
    hide() {
      this.hideHelpWindow();
      super.hide();
    }
  };
  var Window_BattleItem_default = Window_BattleItem;

  // src-www/js/rpg_scenes/Scene_Battle.js
  var Scene_Battle = class extends Scene_Base_default {
    constructor(...args) {
      super(...args);
      this.initialize(...args);
    }
    initialize() {
      super.initialize();
    }
    create() {
      super.create();
      this.createDisplayObjects();
    }
    start() {
      super.start();
      this.startFadeIn(this.fadeSpeed(), false);
      BattleManager_default.playBattleBgm();
      BattleManager_default.startBattle();
    }
    update() {
      const active = this.isActive();
      self.$gameTimer.update(active);
      self.$gameScreen.update();
      this.updateStatusWindow();
      this.updateWindowPositions();
      if (active && !this.isBusy()) {
        this.updateBattleProcess();
      }
      super.update();
    }
    updateBattleProcess() {
      if (!this.isAnyInputWindowActive() || BattleManager_default.isAborting() || BattleManager_default.isBattleEnd()) {
        BattleManager_default.update();
        this.changeInputWindow();
      }
    }
    isAnyInputWindowActive() {
      return this._partyCommandWindow.active || this._actorCommandWindow.active || this._skillWindow.active || this._itemWindow.active || this._actorWindow.active || this._enemyWindow.active;
    }
    changeInputWindow() {
      if (BattleManager_default.isInputting()) {
        if (BattleManager_default.actor()) {
          this.startActorCommandSelection();
        } else {
          this.startPartyCommandSelection();
        }
      } else {
        this.endCommandSelection();
      }
    }
    stop() {
      super.stop();
      if (this.needsSlowFadeOut()) {
        this.startFadeOut(this.slowFadeSpeed(), false);
      } else {
        this.startFadeOut(this.fadeSpeed(), false);
      }
      this._statusWindow.close();
      this._partyCommandWindow.close();
      this._actorCommandWindow.close();
    }
    terminate() {
      super.terminate();
      self.$gameParty.onBattleEnd();
      self.$gameTroop.onBattleEnd();
      AudioManager_default.stopMe();
      ImageManager_default.clearRequest();
    }
    needsSlowFadeOut() {
      return SceneManager_default.isNextScene(Scene_Title_default) || SceneManager_default.isNextScene(Scene_Gameover_default);
    }
    updateStatusWindow() {
      if (self.$gameMessage.isBusy()) {
        this._statusWindow.close();
        this._partyCommandWindow.close();
        this._actorCommandWindow.close();
      } else if (this.isActive() && !this._messageWindow.isClosing()) {
        this._statusWindow.open();
      }
    }
    updateWindowPositions() {
      let statusX = 0;
      if (BattleManager_default.isInputting()) {
        statusX = this._partyCommandWindow.width;
      } else {
        statusX = this._partyCommandWindow.width / 2;
      }
      if (this._statusWindow.x < statusX) {
        this._statusWindow.x += 16;
        if (this._statusWindow.x > statusX) {
          this._statusWindow.x = statusX;
        }
      }
      if (this._statusWindow.x > statusX) {
        this._statusWindow.x -= 16;
        if (this._statusWindow.x < statusX) {
          this._statusWindow.x = statusX;
        }
      }
    }
    createDisplayObjects() {
      this.createSpriteset();
      this.createWindowLayer();
      this.createAllWindows();
      BattleManager_default.setLogWindow(this._logWindow);
      BattleManager_default.setStatusWindow(this._statusWindow);
      BattleManager_default.setSpriteset(this._spriteset);
      this._logWindow.setSpriteset(this._spriteset);
    }
    createSpriteset() {
      this._spriteset = new Spriteset_Battle_default();
      this.addChild(this._spriteset);
    }
    createAllWindows() {
      this.createLogWindow();
      this.createStatusWindow();
      this.createPartyCommandWindow();
      this.createActorCommandWindow();
      this.createHelpWindow();
      this.createSkillWindow();
      this.createItemWindow();
      this.createActorWindow();
      this.createEnemyWindow();
      this.createMessageWindow();
      this.createScrollTextWindow();
    }
    createLogWindow() {
      this._logWindow = new Window_BattleLog_default();
      this.addWindow(this._logWindow);
    }
    createStatusWindow() {
      this._statusWindow = new Window_BattleStatus_default();
      this.addWindow(this._statusWindow);
    }
    createPartyCommandWindow() {
      this._partyCommandWindow = new Window_PartyCommand_default();
      this._partyCommandWindow.setHandler("fight", this.commandFight.bind(this));
      this._partyCommandWindow.setHandler(
        "escape",
        this.commandEscape.bind(this)
      );
      this._partyCommandWindow.deselect();
      this.addWindow(this._partyCommandWindow);
    }
    createActorCommandWindow() {
      this._actorCommandWindow = new Window_ActorCommand_default();
      this._actorCommandWindow.setHandler(
        "attack",
        this.commandAttack.bind(this)
      );
      this._actorCommandWindow.setHandler("skill", this.commandSkill.bind(this));
      this._actorCommandWindow.setHandler("guard", this.commandGuard.bind(this));
      this._actorCommandWindow.setHandler("item", this.commandItem.bind(this));
      this._actorCommandWindow.setHandler(
        "cancel",
        this.selectPreviousCommand.bind(this)
      );
      this.addWindow(this._actorCommandWindow);
    }
    createHelpWindow() {
      this._helpWindow = new Window_Help_default();
      this._helpWindow.visible = false;
      this.addWindow(this._helpWindow);
    }
    createSkillWindow() {
      const wy = this._helpWindow.y + this._helpWindow.height;
      const wh = this._statusWindow.y - wy;
      this._skillWindow = new Window_BattleSkill_default(0, wy, Graphics_default.boxWidth, wh);
      this._skillWindow.setHelpWindow(this._helpWindow);
      this._skillWindow.setHandler("ok", this.onSkillOk.bind(this));
      this._skillWindow.setHandler("cancel", this.onSkillCancel.bind(this));
      this.addWindow(this._skillWindow);
    }
    createItemWindow() {
      const wy = this._helpWindow.y + this._helpWindow.height;
      const wh = this._statusWindow.y - wy;
      this._itemWindow = new Window_BattleItem_default(0, wy, Graphics_default.boxWidth, wh);
      this._itemWindow.setHelpWindow(this._helpWindow);
      this._itemWindow.setHandler("ok", this.onItemOk.bind(this));
      this._itemWindow.setHandler("cancel", this.onItemCancel.bind(this));
      this.addWindow(this._itemWindow);
    }
    createActorWindow() {
      this._actorWindow = new Window_BattleActor_default(0, this._statusWindow.y);
      this._actorWindow.setHandler("ok", this.onActorOk.bind(this));
      this._actorWindow.setHandler("cancel", this.onActorCancel.bind(this));
      this.addWindow(this._actorWindow);
    }
    createEnemyWindow() {
      this._enemyWindow = new Window_BattleEnemy_default(0, this._statusWindow.y);
      this._enemyWindow.x = Graphics_default.boxWidth - this._enemyWindow.width;
      this._enemyWindow.setHandler("ok", this.onEnemyOk.bind(this));
      this._enemyWindow.setHandler("cancel", this.onEnemyCancel.bind(this));
      this.addWindow(this._enemyWindow);
    }
    createMessageWindow() {
      this._messageWindow = new Window_Message_default();
      this.addWindow(this._messageWindow);
      this._messageWindow.subWindows().forEach(function(window2) {
        this.addWindow(window2);
      }, this);
    }
    createScrollTextWindow() {
      this._scrollTextWindow = new Window_ScrollText_default();
      this.addWindow(this._scrollTextWindow);
    }
    refreshStatus() {
      this._statusWindow.refresh();
    }
    startPartyCommandSelection() {
      this.refreshStatus();
      this._statusWindow.deselect();
      this._statusWindow.open();
      this._actorCommandWindow.close();
      this._partyCommandWindow.setup();
    }
    commandFight() {
      this.selectNextCommand();
    }
    commandEscape() {
      BattleManager_default.processEscape();
      this.changeInputWindow();
    }
    startActorCommandSelection() {
      this._statusWindow.select(BattleManager_default.actor().index());
      this._partyCommandWindow.close();
      this._actorCommandWindow.setup(BattleManager_default.actor());
    }
    commandAttack() {
      BattleManager_default.inputtingAction().setAttack();
      this.selectEnemySelection();
    }
    commandSkill() {
      this._skillWindow.setActor(BattleManager_default.actor());
      this._skillWindow.setStypeId(this._actorCommandWindow.currentExt());
      this._skillWindow.refresh();
      this._skillWindow.show();
      this._skillWindow.activate();
    }
    commandGuard() {
      BattleManager_default.inputtingAction().setGuard();
      this.selectNextCommand();
    }
    commandItem() {
      this._itemWindow.refresh();
      this._itemWindow.show();
      this._itemWindow.activate();
    }
    selectNextCommand() {
      BattleManager_default.selectNextCommand();
      this.changeInputWindow();
    }
    selectPreviousCommand() {
      BattleManager_default.selectPreviousCommand();
      this.changeInputWindow();
    }
    selectActorSelection() {
      this._actorWindow.refresh();
      this._actorWindow.show();
      this._actorWindow.activate();
    }
    onActorOk() {
      const action = BattleManager_default.inputtingAction();
      action.setTarget(this._actorWindow.index());
      this._actorWindow.hide();
      this._skillWindow.hide();
      this._itemWindow.hide();
      this.selectNextCommand();
    }
    onActorCancel() {
      this._actorWindow.hide();
      switch (this._actorCommandWindow.currentSymbol()) {
        case "skill":
          this._skillWindow.show();
          this._skillWindow.activate();
          break;
        case "item":
          this._itemWindow.show();
          this._itemWindow.activate();
          break;
      }
    }
    selectEnemySelection() {
      this._enemyWindow.refresh();
      this._enemyWindow.show();
      this._enemyWindow.select(0);
      this._enemyWindow.activate();
    }
    onEnemyOk() {
      const action = BattleManager_default.inputtingAction();
      action.setTarget(this._enemyWindow.enemyIndex());
      this._enemyWindow.hide();
      this._skillWindow.hide();
      this._itemWindow.hide();
      this.selectNextCommand();
    }
    onEnemyCancel() {
      this._enemyWindow.hide();
      switch (this._actorCommandWindow.currentSymbol()) {
        case "attack":
          this._actorCommandWindow.activate();
          break;
        case "skill":
          this._skillWindow.show();
          this._skillWindow.activate();
          break;
        case "item":
          this._itemWindow.show();
          this._itemWindow.activate();
          break;
      }
    }
    onSkillOk() {
      const skill = this._skillWindow.item();
      const action = BattleManager_default.inputtingAction();
      action.setSkill(skill.id);
      BattleManager_default.actor().setLastBattleSkill(skill);
      this.onSelectAction();
    }
    onSkillCancel() {
      this._skillWindow.hide();
      this._actorCommandWindow.activate();
    }
    onItemOk() {
      const item2 = this._itemWindow.item();
      const action = BattleManager_default.inputtingAction();
      action.setItem(item2.id);
      self.$gameParty.setLastItem(item2);
      this.onSelectAction();
    }
    onItemCancel() {
      this._itemWindow.hide();
      this._actorCommandWindow.activate();
    }
    onSelectAction() {
      const action = BattleManager_default.inputtingAction();
      this._skillWindow.hide();
      this._itemWindow.hide();
      if (!action.needsSelection()) {
        this.selectNextCommand();
      } else if (action.isForOpponent()) {
        this.selectEnemySelection();
      } else {
        this.selectActorSelection();
      }
    }
    endCommandSelection() {
      this._partyCommandWindow.close();
      this._actorCommandWindow.close();
      this._statusWindow.deselect();
    }
  };
  var Scene_Battle_default = Scene_Battle;

  // src-www/js/rpg_scenes/Scene_MenuBase.js
  var Scene_MenuBase = class extends Scene_Base_default {
    constructor(...args) {
      super(...args);
      this.initialize(...args);
    }
    initialize() {
      super.initialize();
    }
    create() {
      super.create();
      this.createBackground();
      this.updateActor();
      this.createWindowLayer();
    }
    actor() {
      return this._actor;
    }
    updateActor() {
      this._actor = self.$gameParty.menuActor();
    }
    createBackground() {
      this._backgroundSprite = new Sprite_default();
      this._backgroundSprite.bitmap = SceneManager_default.backgroundBitmap();
      this.addChild(this._backgroundSprite);
    }
    setBackgroundOpacity(opacity) {
      this._backgroundSprite.opacity = opacity;
    }
    createHelpWindow() {
      this._helpWindow = new Window_Help_default();
      this.addWindow(this._helpWindow);
    }
    nextActor() {
      self.$gameParty.makeMenuActorNext();
      this.updateActor();
      this.onActorChange();
    }
    previousActor() {
      self.$gameParty.makeMenuActorPrevious();
      this.updateActor();
      this.onActorChange();
    }
    onActorChange() {
    }
  };
  var Scene_MenuBase_default = Scene_MenuBase;

  // src-www/js/rpg_windows/Window_MenuCommand.js
  var Window_MenuCommand = class extends Window_Command_default {
    constructor(...args) {
      super(...args);
      this.initialize(...args);
    }
    initialize(x, y) {
      super.initialize(x, y);
      this.selectLast();
    }
    static initCommandPosition() {
      this._lastCommandSymbol = null;
    }
    windowWidth() {
      return 240;
    }
    numVisibleRows() {
      return this.maxItems();
    }
    makeCommandList() {
      this.addMainCommands();
      this.addFormationCommand();
      this.addOriginalCommands();
      this.addOptionsCommand();
      this.addSaveCommand();
      this.addGameEndCommand();
    }
    addMainCommands() {
      const enabled = this.areMainCommandsEnabled();
      if (this.needsCommand("item")) {
        this.addCommand(TextManager_default.item, "item", enabled);
      }
      if (this.needsCommand("skill")) {
        this.addCommand(TextManager_default.skill, "skill", enabled);
      }
      if (this.needsCommand("equip")) {
        this.addCommand(TextManager_default.equip, "equip", enabled);
      }
      if (this.needsCommand("status")) {
        this.addCommand(TextManager_default.status, "status", enabled);
      }
    }
    addFormationCommand() {
      if (this.needsCommand("formation")) {
        const enabled = this.isFormationEnabled();
        this.addCommand(TextManager_default.formation, "formation", enabled);
      }
    }
    addOriginalCommands() {
    }
    addOptionsCommand() {
      if (this.needsCommand("options")) {
        const enabled = this.isOptionsEnabled();
        this.addCommand(TextManager_default.options, "options", enabled);
      }
    }
    addSaveCommand() {
      if (this.needsCommand("save")) {
        const enabled = this.isSaveEnabled();
        this.addCommand(TextManager_default.save, "save", enabled);
      }
    }
    addGameEndCommand() {
      const enabled = this.isGameEndEnabled();
      this.addCommand(TextManager_default.gameEnd, "gameEnd", enabled);
    }
    needsCommand(name) {
      const flags = self.$dataSystem.menuCommands;
      if (flags) {
        switch (name) {
          case "item":
            return flags[0];
          case "skill":
            return flags[1];
          case "equip":
            return flags[2];
          case "status":
            return flags[3];
          case "formation":
            return flags[4];
          case "save":
            return flags[5];
        }
      }
      return true;
    }
    areMainCommandsEnabled() {
      return self.$gameParty.exists();
    }
    isFormationEnabled() {
      return self.$gameParty.size() >= 2 && self.$gameSystem.isFormationEnabled();
    }
    isOptionsEnabled() {
      return true;
    }
    isSaveEnabled() {
      return !DataManager.isEventTest() && self.$gameSystem.isSaveEnabled();
    }
    isGameEndEnabled() {
      return true;
    }
    processOk() {
      Window_MenuCommand._lastCommandSymbol = this.currentSymbol();
      super.processOk();
    }
    selectLast() {
      this.selectSymbol(Window_MenuCommand._lastCommandSymbol);
    }
  };
  Window_MenuCommand._lastCommandSymbol = null;
  var Window_MenuCommand_default = Window_MenuCommand;

  // src-www/js/rpg_windows/Window_MenuStatus.js
  var Window_MenuStatus = class extends Window_Selectable_default {
    constructor(...args) {
      super(...args);
      this.initialize(...args);
    }
    initialize(x, y) {
      const width = this.windowWidth();
      const height = this.windowHeight();
      super.initialize(x, y, width, height);
      this._formationMode = false;
      this._pendingIndex = -1;
      this.refresh();
    }
    windowWidth() {
      return Graphics_default.boxWidth - 240;
    }
    windowHeight() {
      return Graphics_default.boxHeight;
    }
    maxItems() {
      return self.$gameParty.size();
    }
    itemHeight() {
      const clientHeight = this.height - this.padding * 2;
      return Math.floor(clientHeight / this.numVisibleRows());
    }
    numVisibleRows() {
      return 4;
    }
    loadImages() {
      self.$gameParty.members().forEach((actor2) => {
        ImageManager_default.reserveFace(actor2.faceName());
      }, this);
    }
    drawItem(index) {
      this.drawItemBackground(index);
      this.drawItemImage(index);
      this.drawItemStatus(index);
    }
    drawItemBackground(index) {
      if (index === this._pendingIndex) {
        const rect = this.itemRect(index);
        const color = this.pendingColor();
        this.changePaintOpacity(false);
        this.contents.fillRect(rect.x, rect.y, rect.width, rect.height, color);
        this.changePaintOpacity(true);
      }
    }
    drawItemImage(index) {
      const actor2 = self.$gameParty.members()[index];
      const rect = this.itemRect(index);
      this.changePaintOpacity(actor2.isBattleMember());
      this.drawActorFace(
        actor2,
        rect.x + 1,
        rect.y + 1,
        Window_Base_default._faceWidth,
        Window_Base_default._faceHeight
      );
      this.changePaintOpacity(true);
    }
    drawItemStatus(index) {
      const actor2 = self.$gameParty.members()[index];
      const rect = this.itemRect(index);
      const x = rect.x + 162;
      const y = rect.y + rect.height / 2 - this.lineHeight() * 1.5;
      const width = rect.width - x - this.textPadding();
      this.drawActorSimpleStatus(actor2, x, y, width);
    }
    processOk() {
      super.processOk();
      self.$gameParty.setMenuActor(self.$gameParty.members()[this.index()]);
    }
    isCurrentItemEnabled() {
      if (this._formationMode) {
        const actor2 = self.$gameParty.members()[this.index()];
        return actor2 && actor2.isFormationChangeOk();
      } else {
        return true;
      }
    }
    selectLast() {
      this.select(self.$gameParty.menuActor().index() || 0);
    }
    formationMode() {
      return this._formationMode;
    }
    setFormationMode(formationMode) {
      this._formationMode = formationMode;
    }
    pendingIndex() {
      return this._pendingIndex;
    }
    setPendingIndex(index) {
      const lastPendingIndex = this._pendingIndex;
      this._pendingIndex = index;
      this.redrawItem(this._pendingIndex);
      this.redrawItem(lastPendingIndex);
    }
  };
  var Window_MenuStatus_default = Window_MenuStatus;

  // src-www/js/rpg_windows/Window_MenuActor.js
  var Window_MenuActor = class extends Window_MenuStatus_default {
    constructor(...args) {
      super(...args);
      this.initialize(...args);
    }
    initialize() {
      super.initialize(0, 0);
      this.hide();
    }
    processOk() {
      if (!this.cursorAll()) {
        self.$gameParty.setTargetActor(self.$gameParty.members()[this.index()]);
      }
      this.callOkHandler();
    }
    selectLast() {
      this.select(self.$gameParty.targetActor().index() || 0);
    }
    selectForItem(item2) {
      const actor2 = self.$gameParty.menuActor();
      const action = new Game_Action_default(actor2);
      action.setItemObject(item2);
      this.setCursorFixed(false);
      this.setCursorAll(false);
      if (action.isForUser()) {
        if (DataManager.isSkill(item2)) {
          this.setCursorFixed(true);
          this.select(actor2.index());
        } else {
          this.selectLast();
        }
      } else if (action.isForAll()) {
        this.setCursorAll(true);
        this.select(0);
      } else {
        this.selectLast();
      }
    }
  };
  var Window_MenuActor_default = Window_MenuActor;

  // src-www/js/rpg_scenes/Scene_ItemBase.js
  var Scene_ItemBase = class extends Scene_MenuBase_default {
    constructor(...args) {
      super(...args);
      this.initialize(...args);
    }
    initialize() {
      super.initialize();
    }
    create() {
      super.create();
    }
    createActorWindow() {
      this._actorWindow = new Window_MenuActor_default();
      this._actorWindow.setHandler("ok", this.onActorOk.bind(this));
      this._actorWindow.setHandler("cancel", this.onActorCancel.bind(this));
      this.addWindow(this._actorWindow);
    }
    item() {
      return this._itemWindow.item();
    }
    user() {
      return null;
    }
    isCursorLeft() {
      return this._itemWindow.index() % 2 === 0;
    }
    showSubWindow(window2) {
      window2.x = this.isCursorLeft() ? Graphics_default.boxWidth - window2.width : 0;
      window2.show();
      window2.activate();
    }
    hideSubWindow(window2) {
      window2.hide();
      window2.deactivate();
      this.activateItemWindow();
    }
    onActorOk() {
      if (this.canUse()) {
        this.useItem();
      } else {
        SoundManager_default.playBuzzer();
      }
    }
    onActorCancel() {
      this.hideSubWindow(this._actorWindow);
    }
    action() {
      const action = new Game_Action_default(this.user());
      action.setItemObject(this.item());
      return action;
    }
    determineItem() {
      const action = this.action();
      if (action.isForFriend()) {
        this.showSubWindow(this._actorWindow);
        this._actorWindow.selectForItem(this.item());
      } else {
        this.useItem();
        this.activateItemWindow();
      }
    }
    useItem() {
      this.playSeForItem();
      this.user().useItem(this.item());
      this.applyItem();
      this.checkCommonEvent();
      this.checkGameover();
      this._actorWindow.refresh();
    }
    activateItemWindow() {
      this._itemWindow.refresh();
      this._itemWindow.activate();
    }
    itemTargetActors() {
      const action = this.action();
      if (!action.isForFriend()) {
        return [];
      } else if (action.isForAll()) {
        return self.$gameParty.members();
      } else {
        return [self.$gameParty.members()[this._actorWindow.index()]];
      }
    }
    canUse() {
      const user = this.user();
      if (user) {
        return user.canUse(this.item()) && this.isItemEffectsValid();
      }
      return false;
    }
    isItemEffectsValid() {
      const action = this.action();
      return this.itemTargetActors().some(
        (target2) => action.testApply(target2),
        this
      );
    }
    applyItem() {
      const action = this.action();
      const targets = this.itemTargetActors();
      targets.forEach((battler) => {
        const repeats = action.numRepeats();
        for (let i = 0; i < repeats; i++) {
          action.apply(battler);
        }
      });
      action.applyGlobal();
    }
    checkCommonEvent() {
      if (self.$gameTemp.isCommonEventReserved()) {
        SceneManager_default.goto(Scene_Map_default);
      }
    }
  };
  var Scene_ItemBase_default = Scene_ItemBase;

  // src-www/js/rpg_windows/Window_HorzCommand.js
  var Window_HorzCommand = class extends Window_Command_default {
    constructor(...args) {
      super(...args);
      this.initialize(...args);
    }
    initialize(x, y) {
      super.initialize(x, y);
    }
    numVisibleRows() {
      return 1;
    }
    maxCols() {
      return 4;
    }
    itemTextAlign() {
      return "center";
    }
  };
  var Window_HorzCommand_default = Window_HorzCommand;

  // src-www/js/rpg_windows/Window_ItemCategory.js
  var Window_ItemCategory = class extends Window_HorzCommand_default {
    constructor(...args) {
      super(...args);
      this.initialize(...args);
    }
    initialize() {
      super.initialize(0, 0);
    }
    windowWidth() {
      return Graphics_default.boxWidth;
    }
    maxCols() {
      return 4;
    }
    update() {
      super.update();
      if (this._itemWindow) {
        this._itemWindow.setCategory(this.currentSymbol());
      }
    }
    makeCommandList() {
      this.addCommand(TextManager_default.item, "item");
      this.addCommand(TextManager_default.weapon, "weapon");
      this.addCommand(TextManager_default.armor, "armor");
      this.addCommand(TextManager_default.keyItem, "keyItem");
    }
    setItemWindow(itemWindow) {
      this._itemWindow = itemWindow;
    }
  };
  var Window_ItemCategory_default = Window_ItemCategory;

  // src-www/js/rpg_scenes/Scene_Item.js
  var Scene_Item = class extends Scene_ItemBase_default {
    constructor(...args) {
      super(...args);
      this.initialize(...args);
    }
    initialize() {
      super.initialize();
    }
    create() {
      super.create();
      this.createHelpWindow();
      this.createCategoryWindow();
      this.createItemWindow();
      this.createActorWindow();
    }
    createCategoryWindow() {
      this._categoryWindow = new Window_ItemCategory_default();
      this._categoryWindow.setHelpWindow(this._helpWindow);
      this._categoryWindow.y = this._helpWindow.height;
      this._categoryWindow.setHandler("ok", this.onCategoryOk.bind(this));
      this._categoryWindow.setHandler("cancel", this.popScene.bind(this));
      this.addWindow(this._categoryWindow);
    }
    createItemWindow() {
      const wy = this._categoryWindow.y + this._categoryWindow.height;
      const wh = Graphics_default.boxHeight - wy;
      this._itemWindow = new Window_ItemList_default(0, wy, Graphics_default.boxWidth, wh);
      this._itemWindow.setHelpWindow(this._helpWindow);
      this._itemWindow.setHandler("ok", this.onItemOk.bind(this));
      this._itemWindow.setHandler("cancel", this.onItemCancel.bind(this));
      this.addWindow(this._itemWindow);
      this._categoryWindow.setItemWindow(this._itemWindow);
    }
    user() {
      const members = self.$gameParty.movableMembers();
      let bestActor = members[0];
      let bestPha = 0;
      for (let i = 0; i < members.length; i++) {
        if (members[i].pha > bestPha) {
          bestPha = members[i].pha;
          bestActor = members[i];
        }
      }
      return bestActor;
    }
    onCategoryOk() {
      this._itemWindow.activate();
      this._itemWindow.selectLast();
    }
    onItemOk() {
      self.$gameParty.setLastItem(this.item());
      this.determineItem();
    }
    onItemCancel() {
      this._itemWindow.deselect();
      this._categoryWindow.activate();
    }
    playSeForItem() {
      SoundManager_default.playUseItem();
    }
    useItem() {
      super.useItem();
      this._itemWindow.redrawCurrentItem();
    }
  };
  var Scene_Item_default = Scene_Item;

  // src-www/js/rpg_windows/Window_SkillType.js
  var Window_SkillType = class extends Window_Command_default {
    constructor(...args) {
      super(...args);
      this.initialize(...args);
    }
    initialize(x, y) {
      super.initialize(x, y);
      this._actor = null;
    }
    windowWidth() {
      return 240;
    }
    setActor(actor2) {
      if (this._actor !== actor2) {
        this._actor = actor2;
        this.refresh();
        this.selectLast();
      }
    }
    numVisibleRows() {
      return 4;
    }
    makeCommandList() {
      if (this._actor) {
        const skillTypes = this._actor.addedSkillTypes();
        skillTypes.sort((a2, b2) => a2 - b2);
        skillTypes.forEach(function(stypeId) {
          const name = self.$dataSystem.skillTypes[stypeId];
          this.addCommand(name, "skill", true, stypeId);
        }, this);
      }
    }
    update() {
      super.update();
      if (this._skillWindow) {
        this._skillWindow.setStypeId(this.currentExt());
      }
    }
    setSkillWindow(skillWindow) {
      this._skillWindow = skillWindow;
    }
    selectLast() {
      const skill = this._actor.lastMenuSkill();
      if (skill) {
        this.selectExt(skill.stypeId);
      } else {
        this.select(0);
      }
    }
  };
  var Window_SkillType_default = Window_SkillType;

  // src-www/js/rpg_windows/Window_SkillStatus.js
  var Window_SkillStatus = class extends Window_Base_default {
    constructor(...args) {
      super(...args);
      this.initialize(...args);
    }
    initialize(x, y, width, height) {
      super.initialize(x, y, width, height);
      this._actor = null;
    }
    setActor(actor2) {
      if (this._actor !== actor2) {
        this._actor = actor2;
        this.refresh();
      }
    }
    refresh() {
      this.contents.clear();
      if (this._actor) {
        const w = this.width - this.padding * 2;
        const h = this.height - this.padding * 2;
        const y = h / 2 - this.lineHeight() * 1.5;
        const width = w - 162 - this.textPadding();
        this.drawActorFace(this._actor, 0, 0, 144, h);
        this.drawActorSimpleStatus(this._actor, 162, y, width);
      }
    }
  };
  var Window_SkillStatus_default = Window_SkillStatus;

  // src-www/js/rpg_scenes/Scene_Skill.js
  var Scene_Skill = class extends Scene_ItemBase_default {
    constructor(...args) {
      super(...args);
      this.initialize(...args);
    }
    initialize() {
      super.initialize();
    }
    create() {
      super.create();
      this.createHelpWindow();
      this.createSkillTypeWindow();
      this.createStatusWindow();
      this.createItemWindow();
      this.createActorWindow();
    }
    start() {
      super.start();
      this.refreshActor();
    }
    createSkillTypeWindow() {
      const wy = this._helpWindow.height;
      this._skillTypeWindow = new Window_SkillType_default(0, wy);
      this._skillTypeWindow.setHelpWindow(this._helpWindow);
      this._skillTypeWindow.setHandler("skill", this.commandSkill.bind(this));
      this._skillTypeWindow.setHandler("cancel", this.popScene.bind(this));
      this._skillTypeWindow.setHandler("pagedown", this.nextActor.bind(this));
      this._skillTypeWindow.setHandler("pageup", this.previousActor.bind(this));
      this.addWindow(this._skillTypeWindow);
    }
    createStatusWindow() {
      const wx = this._skillTypeWindow.width;
      const wy = this._helpWindow.height;
      const ww = Graphics_default.boxWidth - wx;
      const wh = this._skillTypeWindow.height;
      this._statusWindow = new Window_SkillStatus_default(wx, wy, ww, wh);
      this._statusWindow.reserveFaceImages();
      this.addWindow(this._statusWindow);
    }
    createItemWindow() {
      const wx = 0;
      const wy = this._statusWindow.y + this._statusWindow.height;
      const ww = Graphics_default.boxWidth;
      const wh = Graphics_default.boxHeight - wy;
      this._itemWindow = new Window_SkillList_default(wx, wy, ww, wh);
      this._itemWindow.setHelpWindow(this._helpWindow);
      this._itemWindow.setHandler("ok", this.onItemOk.bind(this));
      this._itemWindow.setHandler("cancel", this.onItemCancel.bind(this));
      this._skillTypeWindow.setSkillWindow(this._itemWindow);
      this.addWindow(this._itemWindow);
    }
    refreshActor() {
      const actor2 = this.actor();
      this._skillTypeWindow.setActor(actor2);
      this._statusWindow.setActor(actor2);
      this._itemWindow.setActor(actor2);
    }
    user() {
      return this.actor();
    }
    commandSkill() {
      this._itemWindow.activate();
      this._itemWindow.selectLast();
    }
    onItemOk() {
      this.actor().setLastMenuSkill(this.item());
      this.determineItem();
    }
    onItemCancel() {
      this._itemWindow.deselect();
      this._skillTypeWindow.activate();
    }
    playSeForItem() {
      SoundManager_default.playUseSkill();
    }
    useItem() {
      super.useItem();
      this._statusWindow.refresh();
      this._itemWindow.refresh();
    }
    onActorChange() {
      this.refreshActor();
      this._skillTypeWindow.activate();
    }
  };
  var Scene_Skill_default = Scene_Skill;

  // src-www/js/rpg_windows/Window_EquipStatus.js
  var Window_EquipStatus = class extends Window_Base_default {
    constructor(...args) {
      super(...args);
      this.initialize(...args);
    }
    initialize(x, y) {
      const width = this.windowWidth();
      const height = this.windowHeight();
      super.initialize(x, y, width, height);
      this._actor = null;
      this._tempActor = null;
      this.refresh();
    }
    windowWidth() {
      return 312;
    }
    windowHeight() {
      return this.fittingHeight(this.numVisibleRows());
    }
    numVisibleRows() {
      return 7;
    }
    setActor(actor2) {
      if (this._actor !== actor2) {
        this._actor = actor2;
        this.refresh();
      }
    }
    refresh() {
      this.contents.clear();
      if (this._actor) {
        this.drawActorName(this._actor, this.textPadding(), 0);
        for (let i = 0; i < 6; i++) {
          this.drawItem(0, this.lineHeight() * (1 + i), 2 + i);
        }
      }
    }
    setTempActor(tempActor) {
      if (this._tempActor !== tempActor) {
        this._tempActor = tempActor;
        this.refresh();
      }
    }
    drawItem(x, y, paramId) {
      this.drawParamName(x + this.textPadding(), y, paramId);
      if (this._actor) {
        this.drawCurrentParam(x + 140, y, paramId);
      }
      this.drawRightArrow(x + 188, y);
      if (this._tempActor) {
        this.drawNewParam(x + 222, y, paramId);
      }
    }
    drawParamName(x, y, paramId) {
      this.changeTextColor(this.systemColor());
      this.drawText(TextManager_default.param(paramId), x, y, 120);
    }
    drawCurrentParam(x, y, paramId) {
      this.resetTextColor();
      this.drawText(this._actor.param(paramId), x, y, 48, "right");
    }
    drawRightArrow(x, y) {
      this.changeTextColor(this.systemColor());
      this.drawText("\u2192", x, y, 32, "center");
    }
    drawNewParam(x, y, paramId) {
      const newValue = this._tempActor.param(paramId);
      const diffvalue = newValue - this._actor.param(paramId);
      this.changeTextColor(this.paramchangeTextColor(diffvalue));
      this.drawText(newValue, x, y, 48, "right");
    }
  };
  var Window_EquipStatus_default = Window_EquipStatus;

  // src-www/js/rpg_windows/Window_EquipCommand.js
  var Window_EquipCommand = class extends Window_HorzCommand_default {
    constructor(...args) {
      super(...args);
      this.initialize(...args);
    }
    initialize(x, y, width) {
      this._windowWidth = width;
      super.initialize(x, y);
    }
    windowWidth() {
      return this._windowWidth;
    }
    maxCols() {
      return 3;
    }
    makeCommandList() {
      this.addCommand(TextManager_default.equip2, "equip");
      this.addCommand(TextManager_default.optimize, "optimize");
      this.addCommand(TextManager_default.clear, "clear");
    }
  };
  var Window_EquipCommand_default = Window_EquipCommand;

  // src-www/js/rpg_windows/Window_EquipSlot.js
  var Window_EquipSlot = class extends Window_Selectable_default {
    constructor(...args) {
      super(...args);
      this.initialize(...args);
    }
    initialize(x, y, width, height) {
      super.initialize(x, y, width, height);
      this._actor = null;
      this.refresh();
    }
    setActor(actor2) {
      if (this._actor !== actor2) {
        this._actor = actor2;
        this.refresh();
      }
    }
    update() {
      super.update();
      if (this._itemWindow) {
        this._itemWindow.setSlotId(this.index());
      }
    }
    maxItems() {
      return this._actor ? this._actor.equipSlots().length : 0;
    }
    item() {
      return this._actor ? this._actor.equips()[this.index()] : null;
    }
    drawItem(index) {
      if (this._actor) {
        const rect = this.itemRectForText(index);
        this.changeTextColor(this.systemColor());
        this.changePaintOpacity(this.isEnabled(index));
        this.drawText(
          this.slotName(index),
          rect.x,
          rect.y,
          138,
          this.lineHeight()
        );
        this.drawItemName(this._actor.equips()[index], rect.x + 138, rect.y);
        this.changePaintOpacity(true);
      }
    }
    slotName(index) {
      const slots = this._actor.equipSlots();
      return this._actor ? self.$dataSystem.equipTypes[slots[index]] : "";
    }
    isEnabled(index) {
      return this._actor ? this._actor.isEquipChangeOk(index) : false;
    }
    isCurrentItemEnabled() {
      return this.isEnabled(this.index());
    }
    setStatusWindow(statusWindow) {
      this._statusWindow = statusWindow;
      this.callUpdateHelp();
    }
    setItemWindow(itemWindow) {
      this._itemWindow = itemWindow;
    }
    updateHelp() {
      super.updateHelp();
      this.setHelpWindowItem(this.item());
      if (this._statusWindow) {
        this._statusWindow.setTempActor(null);
      }
    }
  };
  var Window_EquipSlot_default = Window_EquipSlot;

  // src-www/js/rpg_windows/Window_EquipItem.js
  var Window_EquipItem = class extends Window_ItemList_default {
    constructor(...args) {
      super(...args);
      this.initialize(...args);
    }
    initialize(x, y, width, height) {
      super.initialize(x, y, width, height);
      this._actor = null;
      this._slotId = 0;
    }
    setActor(actor2) {
      if (this._actor !== actor2) {
        this._actor = actor2;
        this.refresh();
        this.resetScroll();
      }
    }
    setSlotId(slotId) {
      if (this._slotId !== slotId) {
        this._slotId = slotId;
        this.refresh();
        this.resetScroll();
      }
    }
    includes(item2) {
      if (item2 === null) {
        return true;
      }
      if (this._slotId < 0 || item2.etypeId !== this._actor.equipSlots()[this._slotId]) {
        return false;
      }
      return this._actor.canEquip(item2);
    }
    isEnabled(item2) {
      return true;
    }
    selectLast() {
    }
    setStatusWindow(statusWindow) {
      this._statusWindow = statusWindow;
      this.callUpdateHelp();
    }
    updateHelp() {
      super.updateHelp();
      if (this._actor && this._statusWindow) {
        const actor2 = JsonEx_default.makeDeepCopy(this._actor);
        actor2.forceChangeEquip(this._slotId, this.item());
        this._statusWindow.setTempActor(actor2);
      }
    }
    playOkSound() {
    }
  };
  var Window_EquipItem_default = Window_EquipItem;

  // src-www/js/rpg_scenes/Scene_Equip.js
  var Scene_Equip = class extends Scene_MenuBase_default {
    constructor(...args) {
      super(...args);
      this.initialize(...args);
    }
    initialize() {
      super.initialize();
    }
    create() {
      super.create();
      this.createHelpWindow();
      this.createStatusWindow();
      this.createCommandWindow();
      this.createSlotWindow();
      this.createItemWindow();
      this.refreshActor();
    }
    createStatusWindow() {
      this._statusWindow = new Window_EquipStatus_default(0, this._helpWindow.height);
      this.addWindow(this._statusWindow);
    }
    createCommandWindow() {
      const wx = this._statusWindow.width;
      const wy = this._helpWindow.height;
      const ww = Graphics_default.boxWidth - this._statusWindow.width;
      this._commandWindow = new Window_EquipCommand_default(wx, wy, ww);
      this._commandWindow.setHelpWindow(this._helpWindow);
      this._commandWindow.setHandler("equip", this.commandEquip.bind(this));
      this._commandWindow.setHandler("optimize", this.commandOptimize.bind(this));
      this._commandWindow.setHandler("clear", this.commandClear.bind(this));
      this._commandWindow.setHandler("cancel", this.popScene.bind(this));
      this._commandWindow.setHandler("pagedown", this.nextActor.bind(this));
      this._commandWindow.setHandler("pageup", this.previousActor.bind(this));
      this.addWindow(this._commandWindow);
    }
    createSlotWindow() {
      const wx = this._statusWindow.width;
      const wy = this._commandWindow.y + this._commandWindow.height;
      const ww = Graphics_default.boxWidth - this._statusWindow.width;
      const wh = this._statusWindow.height - this._commandWindow.height;
      this._slotWindow = new Window_EquipSlot_default(wx, wy, ww, wh);
      this._slotWindow.setHelpWindow(this._helpWindow);
      this._slotWindow.setStatusWindow(this._statusWindow);
      this._slotWindow.setHandler("ok", this.onSlotOk.bind(this));
      this._slotWindow.setHandler("cancel", this.onSlotCancel.bind(this));
      this.addWindow(this._slotWindow);
    }
    createItemWindow() {
      const wx = 0;
      const wy = this._statusWindow.y + this._statusWindow.height;
      const ww = Graphics_default.boxWidth;
      const wh = Graphics_default.boxHeight - wy;
      this._itemWindow = new Window_EquipItem_default(wx, wy, ww, wh);
      this._itemWindow.setHelpWindow(this._helpWindow);
      this._itemWindow.setStatusWindow(this._statusWindow);
      this._itemWindow.setHandler("ok", this.onItemOk.bind(this));
      this._itemWindow.setHandler("cancel", this.onItemCancel.bind(this));
      this._slotWindow.setItemWindow(this._itemWindow);
      this.addWindow(this._itemWindow);
    }
    refreshActor() {
      const actor2 = this.actor();
      this._statusWindow.setActor(actor2);
      this._slotWindow.setActor(actor2);
      this._itemWindow.setActor(actor2);
    }
    commandEquip() {
      this._slotWindow.activate();
      this._slotWindow.select(0);
    }
    commandOptimize() {
      SoundManager_default.playEquip();
      this.actor().optimizeEquipments();
      this._statusWindow.refresh();
      this._slotWindow.refresh();
      this._commandWindow.activate();
    }
    commandClear() {
      SoundManager_default.playEquip();
      this.actor().clearEquipments();
      this._statusWindow.refresh();
      this._slotWindow.refresh();
      this._commandWindow.activate();
    }
    onSlotOk() {
      this._itemWindow.activate();
      this._itemWindow.select(0);
    }
    onSlotCancel() {
      this._slotWindow.deselect();
      this._commandWindow.activate();
    }
    onItemOk() {
      SoundManager_default.playEquip();
      this.actor().changeEquip(this._slotWindow.index(), this._itemWindow.item());
      this._slotWindow.activate();
      this._slotWindow.refresh();
      this._itemWindow.deselect();
      this._itemWindow.refresh();
      this._statusWindow.refresh();
    }
    onItemCancel() {
      this._slotWindow.activate();
      this._itemWindow.deselect();
    }
    onActorChange() {
      this.refreshActor();
      this._commandWindow.activate();
    }
  };
  var Scene_Equip_default = Scene_Equip;

  // src-www/js/rpg_windows/Window_Status.js
  var Window_Status = class extends Window_Selectable_default {
    constructor(...args) {
      super(...args);
      this.initialize(...args);
    }
    initialize() {
      const width = Graphics_default.boxWidth;
      const height = Graphics_default.boxHeight;
      super.initialize(0, 0, width, height);
      this._actor = null;
      this.refresh();
      this.activate();
    }
    setActor(actor2) {
      if (this._actor !== actor2) {
        this._actor = actor2;
        this.refresh();
      }
    }
    refresh() {
      this.contents.clear();
      if (this._actor) {
        const lineHeight = this.lineHeight();
        this.drawBlock1(lineHeight * 0);
        this.drawHorzLine(lineHeight * 1);
        this.drawBlock2(lineHeight * 2);
        this.drawHorzLine(lineHeight * 6);
        this.drawBlock3(lineHeight * 7);
        this.drawHorzLine(lineHeight * 13);
        this.drawBlock4(lineHeight * 14);
      }
    }
    drawBlock1(y) {
      this.drawActorName(this._actor, 6, y);
      this.drawActorClass(this._actor, 192, y);
      this.drawActorNickname(this._actor, 432, y);
    }
    drawBlock2(y) {
      this.drawActorFace(this._actor, 12, y);
      this.drawBasicInfo(204, y);
      this.drawExpInfo(456, y);
    }
    drawBlock3(y) {
      this.drawParameters(48, y);
      this.drawEquipments(432, y);
    }
    drawBlock4(y) {
      this.drawProfile(6, y);
    }
    drawHorzLine(y) {
      const lineY = y + this.lineHeight() / 2 - 1;
      this.contents.paintOpacity = 48;
      this.contents.fillRect(0, lineY, this.contentsWidth(), 2, this.lineColor());
      this.contents.paintOpacity = 255;
    }
    lineColor() {
      return this.normalColor();
    }
    drawBasicInfo(x, y) {
      const lineHeight = this.lineHeight();
      this.drawActorLevel(this._actor, x, y + lineHeight * 0);
      this.drawActorIcons(this._actor, x, y + lineHeight * 1);
      this.drawActorHp(this._actor, x, y + lineHeight * 2);
      this.drawActorMp(this._actor, x, y + lineHeight * 3);
    }
    drawParameters(x, y) {
      const lineHeight = this.lineHeight();
      for (let i = 0; i < 6; i++) {
        const paramId = i + 2;
        const y2 = y + lineHeight * i;
        this.changeTextColor(this.systemColor());
        this.drawText(TextManager_default.param(paramId), x, y2, 160);
        this.resetTextColor();
        this.drawText(this._actor.param(paramId), x + 160, y2, 60, "right");
      }
    }
    drawExpInfo(x, y) {
      const lineHeight = this.lineHeight();
      const expTotal = TextManager_default.expTotal.format(TextManager_default.exp);
      const expNext = TextManager_default.expNext.format(TextManager_default.level);
      let value12 = this._actor.currentExp();
      let value22 = this._actor.nextRequiredExp();
      if (this._actor.isMaxLevel()) {
        value12 = "-------";
        value22 = "-------";
      }
      this.changeTextColor(this.systemColor());
      this.drawText(expTotal, x, y + lineHeight * 0, 270);
      this.drawText(expNext, x, y + lineHeight * 2, 270);
      this.resetTextColor();
      this.drawText(value12, x, y + lineHeight * 1, 270, "right");
      this.drawText(value22, x, y + lineHeight * 3, 270, "right");
    }
    drawEquipments(x, y) {
      const equips = this._actor.equips();
      const count = Math.min(equips.length, this.maxEquipmentLines());
      for (let i = 0; i < count; i++) {
        this.drawItemName(equips[i], x, y + this.lineHeight() * i);
      }
    }
    drawProfile(x, y) {
      this.drawTextEx(this._actor.profile(), x, y);
    }
    maxEquipmentLines() {
      return 6;
    }
  };
  var Window_Status_default = Window_Status;

  // src-www/js/rpg_scenes/Scene_Status.js
  var Scene_Status = class extends Scene_MenuBase_default {
    constructor(...args) {
      super(...args);
      this.initialize(...args);
    }
    initialize() {
      super.initialize();
    }
    create() {
      super.create();
      this._statusWindow = new Window_Status_default();
      this._statusWindow.setHandler("cancel", this.popScene.bind(this));
      this._statusWindow.setHandler("pagedown", this.nextActor.bind(this));
      this._statusWindow.setHandler("pageup", this.previousActor.bind(this));
      this._statusWindow.reserveFaceImages();
      this.addWindow(this._statusWindow);
    }
    start() {
      super.start();
      this.refreshActor();
    }
    refreshActor() {
      const actor2 = this.actor();
      this._statusWindow.setActor(actor2);
    }
    onActorChange() {
      this.refreshActor();
      this._statusWindow.activate();
    }
  };
  var Scene_Status_default = Scene_Status;

  // src-www/js/rpg_windows/Window_Options.js
  var Window_Options = class extends Window_Command_default {
    constructor(...args) {
      super(...args);
      this.initialize(...args);
    }
    initialize() {
      super.initialize(0, 0);
      this.updatePlacement();
    }
    windowWidth() {
      return 400;
    }
    windowHeight() {
      return this.fittingHeight(Math.min(this.numVisibleRows(), 12));
    }
    updatePlacement() {
      this.x = (Graphics_default.boxWidth - this.width) / 2;
      this.y = (Graphics_default.boxHeight - this.height) / 2;
    }
    makeCommandList() {
      this.addGeneralOptions();
      this.addVolumeOptions();
    }
    addGeneralOptions() {
      this.addCommand(TextManager_default.alwaysDash, "alwaysDash");
      this.addCommand(TextManager_default.commandRemember, "commandRemember");
    }
    addVolumeOptions() {
      this.addCommand(TextManager_default.bgmVolume, "bgmVolume");
      this.addCommand(TextManager_default.bgsVolume, "bgsVolume");
      this.addCommand(TextManager_default.meVolume, "meVolume");
      this.addCommand(TextManager_default.seVolume, "seVolume");
    }
    drawItem(index) {
      const rect = this.itemRectForText(index);
      const statusWidth = this.statusWidth();
      const titleWidth = rect.width - statusWidth;
      this.resetTextColor();
      this.changePaintOpacity(this.isCommandEnabled(index));
      this.drawText(this.commandName(index), rect.x, rect.y, titleWidth, "left");
      this.drawText(
        this.statusText(index),
        rect.x + titleWidth,
        rect.y,
        statusWidth,
        "right"
      );
    }
    statusWidth() {
      return 120;
    }
    statusText(index) {
      const symbol = this.commandSymbol(index);
      const value3 = this.getConfigValue(symbol);
      if (this.isVolumeSymbol(symbol)) {
        return this.volumeStatusText(value3);
      } else {
        return this.booleanStatusText(value3);
      }
    }
    isVolumeSymbol(symbol) {
      return symbol.contains("Volume");
    }
    booleanStatusText(value3) {
      return value3 ? "ON" : "OFF";
    }
    volumeStatusText(value3) {
      return `${value3}%`;
    }
    processOk() {
      const index = this.index();
      const symbol = this.commandSymbol(index);
      let value3 = this.getConfigValue(symbol);
      if (this.isVolumeSymbol(symbol)) {
        value3 += this.volumeOffset();
        if (value3 > 100) {
          value3 = 0;
        }
        value3 = value3.clamp(0, 100);
        this.changeValue(symbol, value3);
      } else {
        this.changeValue(symbol, !value3);
      }
    }
    cursorRight(wrap) {
      const index = this.index();
      const symbol = this.commandSymbol(index);
      let value3 = this.getConfigValue(symbol);
      if (this.isVolumeSymbol(symbol)) {
        value3 += this.volumeOffset();
        value3 = value3.clamp(0, 100);
        this.changeValue(symbol, value3);
      } else {
        this.changeValue(symbol, true);
      }
    }
    cursorLeft(wrap) {
      const index = this.index();
      const symbol = this.commandSymbol(index);
      let value3 = this.getConfigValue(symbol);
      if (this.isVolumeSymbol(symbol)) {
        value3 -= this.volumeOffset();
        value3 = value3.clamp(0, 100);
        this.changeValue(symbol, value3);
      } else {
        this.changeValue(symbol, false);
      }
    }
    volumeOffset() {
      return 20;
    }
    changeValue(symbol, value3) {
      const lastValue = this.getConfigValue(symbol);
      if (lastValue !== value3) {
        this.setConfigValue(symbol, value3);
        this.redrawItem(this.findSymbol(symbol));
        SoundManager_default.playCursor();
      }
    }
    getConfigValue(symbol) {
      return ConfigManager_default[symbol];
    }
    setConfigValue(symbol, volume) {
      ConfigManager_default[symbol] = volume;
    }
  };
  var Window_Options_default = Window_Options;

  // src-www/js/rpg_scenes/Scene_Options.js
  var Scene_Options = class extends Scene_MenuBase_default {
    constructor(...args) {
      super(...args);
      this.initialize(...args);
    }
    initialize() {
      super.initialize();
    }
    create() {
      super.create();
      this.createOptionsWindow();
    }
    terminate() {
      super.terminate();
      ConfigManager_default.save();
    }
    createOptionsWindow() {
      this._optionsWindow = new Window_Options_default();
      this._optionsWindow.setHandler("cancel", this.popScene.bind(this));
      this.addWindow(this._optionsWindow);
    }
  };
  var Scene_Options_default = Scene_Options;

  // src-www/js/rpg_windows/Window_SavefileList.js
  var Window_SavefileList = class extends Window_Selectable_default {
    constructor(...args) {
      super(...args);
      this.initialize(...args);
    }
    initialize(x, y, width, height) {
      super.initialize(x, y, width, height);
      this._validItems = [];
      for (let i = 0; i < this.maxItems() + 1; i++) {
        DataManager.isThisGameFile(i).then((result2) => {
          this._validItems[i] = result2;
        });
      }
      this.activate();
      this._mode = null;
    }
    setMode(mode) {
      this._mode = mode;
    }
    isReady() {
      return this._validItems.length >= this.maxItems();
    }
    maxItems() {
      return DataManager.maxSavefiles();
    }
    maxVisibleItems() {
      return 5;
    }
    itemHeight() {
      const innerHeight = this.height - this.padding * 2;
      return Math.floor(innerHeight / this.maxVisibleItems());
    }
    drawItem(index) {
      const id = index + 1;
      const valid = this._validItems[id];
      DataManager.loadSavefileInfo(id).then((info) => {
        const rect = this.itemRectForText(index);
        this.resetTextColor();
        if (this._mode === "load") {
          this.changePaintOpacity(valid);
        }
        this.drawFileId(id, rect.x, rect.y);
        if (info) {
          this.changePaintOpacity(valid);
          this.drawContents(info, rect, valid);
          this.changePaintOpacity(true);
        }
      });
    }
    drawFileId(id, x, y) {
      if (DataManager.isAutoSaveFileId(id)) {
        if (this._mode === "save") {
          this.changePaintOpacity(false);
        }
        this.drawText(`${TextManager_default.file} ${id}(Auto)`, x, y, 180);
      } else {
        this.drawText(`${TextManager_default.file} ${id}`, x, y, 180);
      }
    }
    drawContents(info, { y, height, width, x }, valid) {
      const bottom = y + height;
      if (width >= 420) {
        this.drawGameTitle(info, x + 192, y, width - 192);
        if (valid) {
          this.drawPartyCharacters(info, x + 220, bottom - 4);
        }
      }
      const lineHeight = this.lineHeight();
      const y2 = bottom - lineHeight;
      if (y2 >= lineHeight) {
        this.drawPlaytime(info, x, y2, width);
      }
    }
    drawGameTitle({ title }, x, y, width) {
      if (title) {
        this.drawText(title, x, y, width);
      }
    }
    drawPartyCharacters({ characters }, x, y) {
      if (characters) {
        characters.forEach((data, i) => {
          this.drawCharacter(data[0], data[1], x + i * 48, y);
        });
      }
    }
    drawPlaytime({ playtime }, x, y, width) {
      if (playtime) {
        this.drawText(playtime, x, y, width, "right");
      }
    }
    playOkSound() {
    }
  };
  var Window_SavefileList_default = Window_SavefileList;

  // src-www/js/rpg_scenes/Scene_File.js
  var Scene_File = class extends Scene_MenuBase_default {
    constructor(...args) {
      super(...args);
      this.initialize(...args);
    }
    initialize() {
      super.initialize();
      this._hasfirstSavefileIndex = false;
    }
    create() {
      super.create();
      DataManager.loadAllSavefileImages().then(() => {
        this.createHelpWindow();
        this.createListWindow();
      });
    }
    start() {
      super.start();
      this._listWindow.refresh();
    }
    savefileId() {
      return this._listWindow.index() + 1;
    }
    createHelpWindow() {
      this._helpWindow = new Window_Help_default(1);
      this._helpWindow.setText(this.helpWindowText());
      this.addWindow(this._helpWindow);
    }
    createListWindow() {
      const x = 0;
      const y = this._helpWindow.height;
      const width = Graphics_default.boxWidth;
      const height = Graphics_default.boxHeight - y;
      this._listWindow = new Window_SavefileList_default(x, y, width, height);
      this._listWindow.setHandler("ok", this.onSavefileOk.bind(this));
      this._listWindow.setHandler("cancel", this.popScene.bind(this));
      this._listWindow.setMode(this.mode());
      this._listWindow.refresh();
      this.addWindow(this._listWindow);
      this.firstSavefileIndex().then((firstSavefileIndex) => {
        this._listWindow.select(firstSavefileIndex);
        this._listWindow.setTopRow(firstSavefileIndex - 2);
        this._hasfirstSavefileIndex = true;
      });
    }
    mode() {
      return null;
    }
    activateListWindow() {
      this._listWindow.activate();
    }
    helpWindowText() {
      return "";
    }
    async firstSavefileIndex() {
      return 0;
    }
    isReady() {
      return super.isReady() && this._hasfirstSavefileIndex && this._listWindow && this._listWindow.isReady();
    }
    onSavefileOk() {
    }
  };
  var Scene_File_default = Scene_File;

  // src-www/js/rpg_scenes/Scene_Save.js
  var Scene_Save = class extends Scene_File_default {
    constructor(...args) {
      super(...args);
      this.initialize(...args);
    }
    initialize() {
      super.initialize();
    }
    mode() {
      return "save";
    }
    helpWindowText() {
      return TextManager_default.saveMessage;
    }
    async firstSavefileIndex() {
      return await DataManager.lastAccessedSavefileId() - 1;
    }
    onSavefileOk() {
      if (DataManager.isAutoSaveFileId(this.savefileId())) {
        this.onSaveFailure();
        return;
      }
      super.onSavefileOk();
      self.$gameSystem.onBeforeSave();
      DataManager.saveGame(this.savefileId()).then((success) => {
        if (success) {
          this.onSaveSuccess();
        } else {
          this.onSaveFailure();
        }
      });
    }
    onSaveSuccess() {
      SoundManager_default.playSave();
      GameStorageManager_default.cleanBackup(this.savefileId());
      this.popScene();
    }
    onSaveFailure() {
      SoundManager_default.playBuzzer();
      this.activateListWindow();
    }
  };
  var Scene_Save_default = Scene_Save;

  // src-www/js/rpg_windows/Window_GameEnd.js
  var Window_GameEnd = class extends Window_Command_default {
    constructor(...args) {
      super(...args);
      this.initialize(...args);
    }
    initialize() {
      super.initialize(0, 0);
      this.updatePlacement();
      this.openness = 0;
      this.open();
    }
    windowWidth() {
      return 240;
    }
    updatePlacement() {
      this.x = (Graphics_default.boxWidth - this.width) / 2;
      this.y = (Graphics_default.boxHeight - this.height) / 2;
    }
    makeCommandList() {
      this.addCommand(TextManager_default.toTitle, "toTitle");
      this.addCommand(TextManager_default.cancel, "cancel");
    }
  };
  var Window_GameEnd_default = Window_GameEnd;

  // src-www/js/rpg_scenes/Scene_GameEnd.js
  var Scene_GameEnd = class extends Scene_MenuBase_default {
    constructor(...args) {
      super(...args);
      this.initialize(...args);
    }
    initialize() {
      super.initialize();
    }
    create() {
      super.create();
      this.createCommandWindow();
    }
    stop() {
      super.stop();
      this._commandWindow.close();
    }
    createBackground() {
      super.createBackground();
      this.setBackgroundOpacity(128);
    }
    createCommandWindow() {
      this._commandWindow = new Window_GameEnd_default();
      this._commandWindow.setHandler("toTitle", this.commandToTitle.bind(this));
      this._commandWindow.setHandler("cancel", this.popScene.bind(this));
      this.addWindow(this._commandWindow);
    }
    commandToTitle() {
      this.fadeOutAll();
      SceneManager_default.goto(Scene_Title_default);
    }
  };
  var Scene_GameEnd_default = Scene_GameEnd;

  // src-www/js/rpg_scenes/Scene_Menu.js
  var Scene_Menu = class extends Scene_MenuBase_default {
    constructor(...args) {
      super(...args);
      this.initialize(...args);
    }
    initialize() {
      super.initialize();
    }
    create() {
      super.create();
      this.createCommandWindow();
      this.createGoldWindow();
      this.createStatusWindow();
    }
    start() {
      super.start();
      this._statusWindow.refresh();
    }
    createCommandWindow() {
      this._commandWindow = new Window_MenuCommand_default(0, 0);
      this._commandWindow.setHandler("item", this.commandItem.bind(this));
      this._commandWindow.setHandler("skill", this.commandPersonal.bind(this));
      this._commandWindow.setHandler("equip", this.commandPersonal.bind(this));
      this._commandWindow.setHandler("status", this.commandPersonal.bind(this));
      this._commandWindow.setHandler(
        "formation",
        this.commandFormation.bind(this)
      );
      this._commandWindow.setHandler("options", this.commandOptions.bind(this));
      this._commandWindow.setHandler("save", this.commandSave.bind(this));
      this._commandWindow.setHandler("gameEnd", this.commandGameEnd.bind(this));
      this._commandWindow.setHandler("cancel", this.popScene.bind(this));
      this.addWindow(this._commandWindow);
    }
    createGoldWindow() {
      this._goldWindow = new Window_Gold_default(0, 0);
      this._goldWindow.y = Graphics_default.boxHeight - this._goldWindow.height;
      this.addWindow(this._goldWindow);
    }
    createStatusWindow() {
      this._statusWindow = new Window_MenuStatus_default(this._commandWindow.width, 0);
      this._statusWindow.reserveFaceImages();
      this.addWindow(this._statusWindow);
    }
    commandItem() {
      SceneManager_default.push(Scene_Item_default);
    }
    commandPersonal() {
      this._statusWindow.setFormationMode(false);
      this._statusWindow.selectLast();
      this._statusWindow.activate();
      this._statusWindow.setHandler("ok", this.onPersonalOk.bind(this));
      this._statusWindow.setHandler("cancel", this.onPersonalCancel.bind(this));
    }
    commandFormation() {
      this._statusWindow.setFormationMode(true);
      this._statusWindow.selectLast();
      this._statusWindow.activate();
      this._statusWindow.setHandler("ok", this.onFormationOk.bind(this));
      this._statusWindow.setHandler("cancel", this.onFormationCancel.bind(this));
    }
    commandOptions() {
      SceneManager_default.push(Scene_Options_default);
    }
    commandSave() {
      SceneManager_default.push(Scene_Save_default);
    }
    commandGameEnd() {
      SceneManager_default.push(Scene_GameEnd_default);
    }
    onPersonalOk() {
      switch (this._commandWindow.currentSymbol()) {
        case "skill":
          SceneManager_default.push(Scene_Skill_default);
          break;
        case "equip":
          SceneManager_default.push(Scene_Equip_default);
          break;
        case "status":
          SceneManager_default.push(Scene_Status_default);
          break;
      }
    }
    onPersonalCancel() {
      this._statusWindow.deselect();
      this._commandWindow.activate();
    }
    onFormationOk() {
      const index = this._statusWindow.index();
      const pendingIndex = this._statusWindow.pendingIndex();
      if (pendingIndex >= 0) {
        self.$gameParty.swapOrder(index, pendingIndex);
        this._statusWindow.setPendingIndex(-1);
        this._statusWindow.redrawItem(index);
      } else {
        this._statusWindow.setPendingIndex(index);
      }
      this._statusWindow.activate();
    }
    onFormationCancel() {
      if (this._statusWindow.pendingIndex() >= 0) {
        this._statusWindow.setPendingIndex(-1);
        this._statusWindow.activate();
      } else {
        this._statusWindow.deselect();
        this._commandWindow.activate();
      }
    }
  };
  var Scene_Menu_default = Scene_Menu;

  // src-www/js/rpg_scenes/Scene_Load.js
  var Scene_Load = class extends Scene_File_default {
    constructor(...args) {
      super(...args);
      this.initialize(...args);
    }
    initialize() {
      super.initialize();
      this._loadSuccess = false;
    }
    terminate() {
      super.terminate();
      if (this._loadSuccess) {
        self.$gameSystem.onAfterLoad();
      }
    }
    mode() {
      return "load";
    }
    helpWindowText() {
      return TextManager_default.loadMessage;
    }
    async firstSavefileIndex() {
      return await DataManager.latestSavefileId() - 1;
    }
    onSavefileOk() {
      super.onSavefileOk();
      DataManager.loadGame(this.savefileId()).then((success) => {
        if (success) {
          this.onLoadSuccess();
        } else {
          this.onLoadFailure();
        }
      });
    }
    onLoadSuccess() {
      SoundManager_default.playLoad();
      this.fadeOutAll();
      this.reloadMapIfUpdated();
      SceneManager_default.goto(Scene_Map_default);
      this._loadSuccess = true;
    }
    onLoadFailure() {
      SoundManager_default.playBuzzer();
      this.activateListWindow();
    }
    reloadMapIfUpdated() {
      if (self.$gameSystem.versionId() !== self.$dataSystem.versionId) {
        self.$gamePlayer.reserveTransfer(
          self.$gameMap.mapId(),
          self.$gamePlayer.x,
          self.$gamePlayer.y
        );
        self.$gamePlayer.requestMapReload();
      }
    }
  };
  var Scene_Load_default = Scene_Load;

  // src-www/js/rpg_windows/Window_DebugRange.js
  var Window_DebugRange = class extends Window_Selectable_default {
    constructor(...args) {
      super(...args);
      this.initialize(...args);
    }
    initialize(x, y) {
      this._maxSwitches = Math.ceil((self.$dataSystem.switches.length - 1) / 10);
      this._maxVariables = Math.ceil(
        (self.$dataSystem.variables.length - 1) / 10
      );
      const width = this.windowWidth();
      const height = this.windowHeight();
      super.initialize(x, y, width, height);
      this.refresh();
      this.setTopRow(Window_DebugRange.lastTopRow);
      this.select(Window_DebugRange.lastIndex);
      this.activate();
    }
    windowWidth() {
      return 246;
    }
    windowHeight() {
      return Graphics_default.boxHeight;
    }
    maxItems() {
      return this._maxSwitches + this._maxVariables;
    }
    update() {
      super.update();
      if (this._editWindow) {
        this._editWindow.setMode(this.mode());
        this._editWindow.setTopId(this.topId());
      }
    }
    mode() {
      return this.index() < this._maxSwitches ? "switch" : "variable";
    }
    topId() {
      const index = this.index();
      if (index < this._maxSwitches) {
        return index * 10 + 1;
      } else {
        return (index - this._maxSwitches) * 10 + 1;
      }
    }
    refresh() {
      this.createContents();
      this.drawAllItems();
    }
    drawItem(index) {
      const rect = this.itemRectForText(index);
      let start;
      let text;
      if (index < this._maxSwitches) {
        start = index * 10 + 1;
        text = "S";
      } else {
        start = (index - this._maxSwitches) * 10 + 1;
        text = "V";
      }
      const end = start + 9;
      text += ` [${start.padZero(4)}-${end.padZero(4)}]`;
      this.drawText(text, rect.x, rect.y, rect.width);
    }
    isCancelTriggered() {
      return Window_Selectable_default.prototype.isCancelTriggered() || Input_default.isTriggered("debug");
    }
    processCancel() {
      super.processCancel();
      Window_DebugRange.lastTopRow = this.topRow();
      Window_DebugRange.lastIndex = this.index();
    }
    setEditWindow(editWindow) {
      this._editWindow = editWindow;
    }
  };
  Window_DebugRange.lastTopRow = 0;
  Window_DebugRange.lastIndex = 0;
  var Window_DebugRange_default = Window_DebugRange;

  // src-www/js/rpg_windows/Window_DebugEdit.js
  var Window_DebugEdit = class extends Window_Selectable_default {
    constructor(...args) {
      super(...args);
      this.initialize(...args);
    }
    initialize(x, y, width) {
      const height = this.fittingHeight(10);
      super.initialize(x, y, width, height);
      this._mode = "switch";
      this._topId = 1;
      this.refresh();
    }
    maxItems() {
      return 10;
    }
    refresh() {
      this.contents.clear();
      this.drawAllItems();
    }
    drawItem(index) {
      const dataId = this._topId + index;
      const idText = `${dataId.padZero(4)}:`;
      const idWidth = this.textWidth(idText);
      const statusWidth = this.textWidth("-00000000");
      const name = this.itemName(dataId);
      const status = this.itemStatus(dataId);
      const rect = this.itemRectForText(index);
      this.resetTextColor();
      this.drawText(idText, rect.x, rect.y, rect.width);
      rect.x += idWidth;
      rect.width -= idWidth + statusWidth;
      this.drawText(name, rect.x, rect.y, rect.width);
      this.drawText(status, rect.x + rect.width, rect.y, statusWidth, "right");
    }
    itemName(dataId) {
      if (this._mode === "switch") {
        return self.$dataSystem.switches[dataId];
      } else {
        return self.$dataSystem.variables[dataId];
      }
    }
    itemStatus(dataId) {
      if (this._mode === "switch") {
        return self.$gameSwitches.value(dataId) ? "[ON]" : "[OFF]";
      } else {
        return String(self.$gameVariables.value(dataId));
      }
    }
    setMode(mode) {
      if (this._mode !== mode) {
        this._mode = mode;
        this.refresh();
      }
    }
    setTopId(id) {
      if (this._topId !== id) {
        this._topId = id;
        this.refresh();
      }
    }
    currentId() {
      return this._topId + this.index();
    }
    update() {
      super.update();
      if (this.active) {
        if (this._mode === "switch") {
          this.updateSwitch();
        } else {
          this.updateVariable();
        }
      }
    }
    updateSwitch() {
      if (Input_default.isRepeated("ok")) {
        const switchId = this.currentId();
        SoundManager_default.playCursor();
        self.$gameSwitches.setValue(
          switchId,
          !self.$gameSwitches.value(switchId)
        );
        this.redrawCurrentItem();
      }
    }
    updateVariable() {
      const variableId = this.currentId();
      let value3 = self.$gameVariables.value(variableId);
      if (typeof value3 === "number") {
        if (Input_default.isRepeated("right")) {
          value3++;
        }
        if (Input_default.isRepeated("left")) {
          value3--;
        }
        if (Input_default.isRepeated("pagedown")) {
          value3 += 10;
        }
        if (Input_default.isRepeated("pageup")) {
          value3 -= 10;
        }
        if (self.$gameVariables.value(variableId) !== value3) {
          self.$gameVariables.setValue(variableId, value3);
          SoundManager_default.playCursor();
          this.redrawCurrentItem();
        }
      }
    }
  };
  var Window_DebugEdit_default = Window_DebugEdit;

  // src-www/js/rpg_scenes/Scene_Debug.js
  var Scene_Debug = class extends Scene_MenuBase_default {
    constructor(...args) {
      super(...args);
      this.initialize(...args);
    }
    initialize() {
      super.initialize();
    }
    create() {
      super.create();
      this.createRangeWindow();
      this.createEditWindow();
      this.createDebugHelpWindow();
    }
    createRangeWindow() {
      this._rangeWindow = new Window_DebugRange_default(0, 0);
      this._rangeWindow.setHandler("ok", this.onRangeOk.bind(this));
      this._rangeWindow.setHandler("cancel", this.popScene.bind(this));
      this.addWindow(this._rangeWindow);
    }
    createEditWindow() {
      const wx = this._rangeWindow.width;
      const ww = Graphics_default.boxWidth - wx;
      this._editWindow = new Window_DebugEdit_default(wx, 0, ww);
      this._editWindow.setHandler("cancel", this.onEditCancel.bind(this));
      this._rangeWindow.setEditWindow(this._editWindow);
      this.addWindow(this._editWindow);
    }
    createDebugHelpWindow() {
      const wx = this._editWindow.x;
      const wy = this._editWindow.height;
      const ww = this._editWindow.width;
      const wh = Graphics_default.boxHeight - wy;
      this._debugHelpWindow = new Window_Base_default(wx, wy, ww, wh);
      this.addWindow(this._debugHelpWindow);
    }
    onRangeOk() {
      this._editWindow.activate();
      this._editWindow.select(0);
      this.refreshHelpWindow();
    }
    onEditCancel() {
      this._rangeWindow.activate();
      this._editWindow.deselect();
      this.refreshHelpWindow();
    }
    refreshHelpWindow() {
      this._debugHelpWindow.contents.clear();
      if (this._editWindow.active) {
        this._debugHelpWindow.drawTextEx(this.helpText(), 4, 0);
      }
    }
    helpText() {
      if (this._rangeWindow.mode() === "switch") {
        return "Enter : ON / OFF";
      } else {
        return "Left     :  -1\nRight    :  +1\nPageup   : -10\nPagedown : +10";
      }
    }
  };
  var Scene_Debug_default = Scene_Debug;

  // src-www/js/rpg_windows/Window_MapName.js
  var Window_MapName = class extends Window_Base_default {
    constructor(...args) {
      super(...args);
      this.initialize(...args);
    }
    initialize() {
      const wight = this.windowWidth();
      const height = this.windowHeight();
      super.initialize(0, 0, wight, height);
      this.opacity = 0;
      this.contentsOpacity = 0;
      this._showCount = 0;
      this.refresh();
    }
    windowWidth() {
      return 360;
    }
    windowHeight() {
      return this.fittingHeight(1);
    }
    update() {
      super.update();
      if (this._showCount > 0 && self.$gameMap.isNameDisplayEnabled()) {
        this.updateFadeIn();
        this._showCount--;
      } else {
        this.updateFadeOut();
      }
    }
    updateFadeIn() {
      this.contentsOpacity += 16;
    }
    updateFadeOut() {
      this.contentsOpacity -= 16;
    }
    open() {
      this.refresh();
      this._showCount = 150;
    }
    close() {
      this._showCount = 0;
    }
    refresh() {
      this.contents.clear();
      if (self.$gameMap.displayName()) {
        const width = this.contentsWidth();
        this.drawBackground(0, 0, width, this.lineHeight());
        this.drawText(self.$gameMap.displayName(), 0, 0, width, "center");
      }
    }
    drawBackground(x, y, width, height) {
      const color1 = this.dimColor1();
      const color2 = this.dimColor2();
      this.contents.gradientFillRect(x, y, width / 2, height, color2, color1);
      this.contents.gradientFillRect(
        x + width / 2,
        y,
        width / 2,
        height,
        color1,
        color2
      );
    }
  };
  var Window_MapName_default = Window_MapName;

  // src-www/js/rpg_sprites/Sprite_Balloon.js
  var Sprite_Balloon = class extends Sprite_Base_default {
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
      this.bitmap = ImageManager_default.loadSystem("Balloon");
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
  };
  var Sprite_Balloon_default = Sprite_Balloon;

  // src-www/js/rpg_sprites/Sprite_Character.js
  var Sprite_Character = class extends Sprite_Base_default {
    constructor(...args) {
      super(...args);
      this.initialize(...args);
    }
    initialize(character2) {
      super.initialize();
      this.initMembers();
      this.setCharacter(character2);
    }
    initMembers() {
      this.anchor.x = 0.5;
      this.anchor.y = 1;
      this._character = null;
      this._balloonDuration = 0;
      this._tilesetId = 0;
      this._upperBody = null;
      this._lowerBody = null;
    }
    setCharacter(character2) {
      this._character = character2;
    }
    update() {
      super.update();
      this.updateBitmap();
      this.updateFrame();
      this.updatePosition();
      this.updateAnimation();
      this.updateBalloon();
      this.updateOther();
    }
    updateVisibility() {
      super.updateVisibility();
      if (this._character.isTransparent()) {
        this.visible = false;
      }
    }
    isTile() {
      return this._character.tileId > 0;
    }
    tilesetBitmap(tileId) {
      const tileset = self.$gameMap.tileset();
      const setNumber = 5 + Math.floor(tileId / 256);
      return ImageManager_default.loadTileset(tileset.tilesetNames[setNumber]);
    }
    updateBitmap() {
      if (this.isImageChanged()) {
        this._tilesetId = self.$gameMap.tilesetId();
        this._tileId = this._character.tileId();
        this._characterName = this._character.characterName();
        this._characterIndex = this._character.characterIndex();
        if (this._tileId > 0) {
          this.setTileBitmap();
        } else {
          this.setCharacterBitmap();
        }
      }
    }
    isImageChanged() {
      return this._tilesetId !== self.$gameMap.tilesetId() || this._tileId !== this._character.tileId() || this._characterName !== this._character.characterName() || this._characterIndex !== this._character.characterIndex();
    }
    setTileBitmap() {
      this.bitmap = this.tilesetBitmap(this._tileId);
    }
    setCharacterBitmap() {
      this.bitmap = ImageManager_default.loadCharacter(this._characterName);
      this._isBigCharacter = ImageManager_default.isBigCharacter(this._characterName);
    }
    updateFrame() {
      if (this._tileId > 0) {
        this.updateTileFrame();
      } else {
        this.updateCharacterFrame();
      }
    }
    updateTileFrame() {
      const pw = this.patternWidth();
      const ph = this.patternHeight();
      const sx = (Math.floor(this._tileId / 128) % 2 * 8 + this._tileId % 8) * pw;
      const sy = Math.floor(this._tileId % 256 / 8) % 16 * ph;
      this.setFrame(sx, sy, pw, ph);
    }
    updateCharacterFrame() {
      const pw = this.patternWidth();
      const ph = this.patternHeight();
      const sx = (this.characterBlockX() + this.characterPatternX()) * pw;
      const sy = (this.characterBlockY() + this.characterPatternY()) * ph;
      this.updateHalfBodySprites();
      if (this._bushDepth > 0) {
        const d = this._bushDepth;
        this._upperBody.setFrame(sx, sy, pw, ph - d);
        this._lowerBody.setFrame(sx, sy + ph - d, pw, d);
        this.setFrame(sx, sy, 0, ph);
      } else {
        this.setFrame(sx, sy, pw, ph);
      }
    }
    characterBlockX() {
      if (this._isBigCharacter) {
        return 0;
      } else {
        const index = this._character.characterIndex();
        return index % 4 * 3;
      }
    }
    characterBlockY() {
      if (this._isBigCharacter) {
        return 0;
      } else {
        const index = this._character.characterIndex();
        return Math.floor(index / 4) * 4;
      }
    }
    characterPatternX() {
      return this._character.pattern();
    }
    characterPatternY() {
      return (this._character.direction() - 2) / 2;
    }
    patternWidth() {
      if (this._tileId > 0) {
        return self.$gameMap.tileWidth();
      } else if (this._isBigCharacter) {
        return this.bitmap.width / 3;
      } else {
        return this.bitmap.width / 12;
      }
    }
    patternHeight() {
      if (this._tileId > 0) {
        return self.$gameMap.tileHeight();
      } else if (this._isBigCharacter) {
        return this.bitmap.height / 4;
      } else {
        return this.bitmap.height / 8;
      }
    }
    updateHalfBodySprites() {
      if (this._bushDepth > 0) {
        this.createHalfBodySprites();
        this._upperBody.bitmap = this.bitmap;
        this._upperBody.visible = true;
        this._upperBody.y = -this._bushDepth;
        this._lowerBody.bitmap = this.bitmap;
        this._lowerBody.visible = true;
        this._upperBody.setBlendColor(this.getBlendColor());
        this._lowerBody.setBlendColor(this.getBlendColor());
        this._upperBody.setColorTone(this.getColorTone());
        this._lowerBody.setColorTone(this.getColorTone());
      } else if (this._upperBody) {
        this._upperBody.visible = false;
        this._lowerBody.visible = false;
      }
    }
    createHalfBodySprites() {
      if (!this._upperBody) {
        this._upperBody = new Sprite_default();
        this._upperBody.anchor.x = 0.5;
        this._upperBody.anchor.y = 1;
        this.addChild(this._upperBody);
      }
      if (!this._lowerBody) {
        this._lowerBody = new Sprite_default();
        this._lowerBody.anchor.x = 0.5;
        this._lowerBody.anchor.y = 1;
        this._lowerBody.opacity = 128;
        this.addChild(this._lowerBody);
      }
    }
    updatePosition() {
      this.x = this._character.screenX();
      this.y = this._character.screenY();
      this.z = this._character.screenZ();
    }
    updateAnimation() {
      this.setupAnimation();
      if (!this.isAnimationPlaying()) {
        this._character.endAnimation();
      }
      if (!this.isBalloonPlaying()) {
        this._character.endBalloon();
      }
    }
    updateOther() {
      this.opacity = this._character.opacity();
      this.blendMode = this._character.blendMode();
      this._bushDepth = this._character.bushDepth();
    }
    setupAnimation() {
      if (this._character.animationId() > 0) {
        const animation = self.$dataAnimations[this._character.animationId()];
        this.startAnimation(animation, false, 0);
        this._character.startAnimation();
      }
    }
    setupBalloon() {
      if (this._character.balloonId() > 0) {
        this.startBalloon();
        this._character.startBalloon();
      }
    }
    startBalloon() {
      if (!this._balloonSprite) {
        this._balloonSprite = new Sprite_Balloon_default();
      }
      this._balloonSprite.setup(this._character.balloonId());
      this.parent.addChild(this._balloonSprite);
    }
    updateBalloon() {
      this.setupBalloon();
      if (this._balloonSprite) {
        this._balloonSprite.x = this.x;
        this._balloonSprite.y = this.y - this.height;
        if (!this._balloonSprite.isPlaying()) {
          this.endBalloon();
        }
      }
    }
    endBalloon() {
      if (this._balloonSprite) {
        this.parent.removeChild(this._balloonSprite);
        this._balloonSprite = null;
      }
    }
    isBalloonPlaying() {
      return !!this._balloonSprite;
    }
  };
  var Sprite_Character_default = Sprite_Character;

  // src-www/js/rpg_sprites/Sprite_Destination.js
  var Sprite_Destination = class extends Sprite_default {
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
      this.bitmap = new Bitmap_default(tileWidth, tileHeight);
      this.bitmap.fillAll("white");
      this.anchor.x = 0.5;
      this.anchor.y = 0.5;
      this.blendMode = Graphics_default.BLEND_ADD;
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
  };
  var Sprite_Destination_default = Sprite_Destination;

  // src-www/js/rpg_sprites/Spriteset_Map.js
  var Spriteset_Map = class extends Spriteset_Base_default {
    constructor(...args) {
      super(...args);
      this.initialize(...args);
    }
    initialize() {
      super.initialize();
    }
    createLowerLayer() {
      super.createLowerLayer();
      this.createParallax();
      this.createTilemap();
      this.createCharacters();
      this.createShadow();
      this.createDestination();
      this.createWeather();
    }
    update() {
      super.update();
      this.updateTileset();
      this.updateParallax();
      this.updateTilemap();
      this.updateShadow();
      this.updateWeather();
    }
    hideCharacters() {
      for (const sprite of this._characterSprites) {
        if (!sprite.isTile()) {
          sprite.hide();
        }
      }
    }
    createParallax() {
      this._parallax = new TilingSprite_default();
      this._parallax.move(0, 0, Graphics_default.width, Graphics_default.height);
      this._baseSprite.addChild(this._parallax);
    }
    createTilemap() {
      if (Graphics_default.isWebGL()) {
        this._tilemap = new ShaderTilemap_default();
      } else {
        this._tilemap = new Tilemap_default();
      }
      this._tilemap.tileWidth = self.$gameMap.tileWidth();
      this._tilemap.tileHeight = self.$gameMap.tileHeight();
      this._tilemap.setData(
        self.$gameMap.width(),
        self.$gameMap.height(),
        self.$gameMap.data()
      );
      this._tilemap.horizontalWrap = self.$gameMap.isLoopHorizontal();
      this._tilemap.verticalWrap = self.$gameMap.isLoopVertical();
      this.loadTileset();
      this._baseSprite.addChild(this._tilemap);
    }
    loadTileset() {
      this._tileset = self.$gameMap.tileset();
      if (this._tileset) {
        const tilesetNames = this._tileset.tilesetNames;
        for (let i = 0; i < tilesetNames.length; i++) {
          this._tilemap.bitmaps[i] = ImageManager_default.loadTileset(tilesetNames[i]);
        }
        const newTilesetFlags = self.$gameMap.tilesetFlags();
        this._tilemap.refreshTileset();
        if (!this._tilemap.flags.equals(newTilesetFlags)) {
          this._tilemap.refresh();
        }
        this._tilemap.flags = newTilesetFlags;
      }
    }
    createCharacters() {
      this._characterSprites = [];
      self.$gameMap.events().forEach(function(event) {
        this._characterSprites.push(new Sprite_Character_default(event));
      }, this);
      self.$gameMap.vehicles().forEach(function(vehicle) {
        this._characterSprites.push(new Sprite_Character_default(vehicle));
      }, this);
      self.$gamePlayer.followers().reverseEach(function(follower) {
        this._characterSprites.push(new Sprite_Character_default(follower));
      }, this);
      this._characterSprites.push(new Sprite_Character_default(self.$gamePlayer));
      for (let i = 0; i < this._characterSprites.length; i++) {
        this._tilemap.addChild(this._characterSprites[i]);
      }
    }
    createShadow() {
      this._shadowSprite = new Sprite_default();
      this._shadowSprite.bitmap = ImageManager_default.loadSystem("Shadow1");
      this._shadowSprite.anchor.x = 0.5;
      this._shadowSprite.anchor.y = 1;
      this._shadowSprite.z = 6;
      this._tilemap.addChild(this._shadowSprite);
    }
    createDestination() {
      this._destinationSprite = new Sprite_Destination_default();
      this._destinationSprite.z = 9;
      this._tilemap.addChild(this._destinationSprite);
    }
    createWeather() {
      this._weather = new Weather_default();
      this.addChild(this._weather);
    }
    updateTileset() {
      if (this._tileset !== self.$gameMap.tileset()) {
        this.loadTileset();
      }
    }
    /*
     * Simple fix for canvas parallax issue, destroy old parallax and readd to  the tree.
     */
    _canvasReAddParallax() {
      const index = this._baseSprite.children.indexOf(this._parallax);
      this._baseSprite.removeChild(this._parallax);
      this._parallax = new TilingSprite_default();
      this._parallax.move(0, 0, Graphics_default.width, Graphics_default.height);
      this._parallax.bitmap = ImageManager_default.loadParallax(this._parallaxName);
      this._baseSprite.addChildAt(this._parallax, index);
    }
    updateParallax() {
      if (this._parallaxName !== self.$gameMap.parallaxName()) {
        this._parallaxName = self.$gameMap.parallaxName();
        if (this._parallax.bitmap && Graphics_default.isWebGL() != true) {
          this._canvasReAddParallax();
        } else {
          this._parallax.bitmap = ImageManager_default.loadParallax(this._parallaxName);
        }
      }
      if (this._parallax.bitmap) {
        this._parallax.origin.x = self.$gameMap.parallaxOx();
        this._parallax.origin.y = self.$gameMap.parallaxOy();
      }
    }
    updateTilemap() {
      this._tilemap.origin.x = self.$gameMap.displayX() * self.$gameMap.tileWidth();
      this._tilemap.origin.y = self.$gameMap.displayY() * self.$gameMap.tileHeight();
      if (this._tilemap.bitmaps) {
        if (!this.isTilesetReady && this._tilemap.bitmaps.every((bitmap) => bitmap.isRequestReady())) {
          this._tilemap.refresh();
          this._tilemap.refreshTileset();
          this.isTilesetReady = true;
        }
      }
    }
    updateShadow() {
      const airship = self.$gameMap.airship();
      this._shadowSprite.x = airship.shadowX();
      this._shadowSprite.y = airship.shadowY();
      this._shadowSprite.opacity = airship.shadowOpacity();
    }
    updateWeather() {
      this._weather.type = self.$gameScreen.weatherType();
      this._weather.power = self.$gameScreen.weatherPower();
      this._weather.origin.x = self.$gameMap.displayX() * self.$gameMap.tileWidth();
      this._weather.origin.y = self.$gameMap.displayY() * self.$gameMap.tileHeight();
    }
  };
  var Spriteset_Map_default = Spriteset_Map;

  // src-www/js/rpg_scenes/Scene_Map.js
  var Scene_Map = class extends Scene_Base_default {
    constructor(...args) {
      super(...args);
      this.initialize(...args);
    }
    initialize() {
      super.initialize();
      this._waitCount = 0;
      this._encounterEffectDuration = 0;
      this._mapLoaded = false;
      this._touchCount = 0;
    }
    create() {
      super.create();
      this._transfer = self.$gamePlayer.isTransferring();
      const mapId = this._transfer ? self.$gamePlayer.newMapId() : self.$gameMap.mapId();
      DataManager.loadMapData(mapId);
    }
    isReady() {
      if (!this._mapLoaded && DataManager.isMapLoaded()) {
        this.onMapLoaded();
        this._mapLoaded = true;
      }
      return this._mapLoaded && Scene_Base_default.prototype.isReady.call(this);
    }
    onMapLoaded() {
      if (this._transfer) {
        self.$gamePlayer.performTransfer();
      }
      this.createDisplayObjects();
    }
    start() {
      super.start();
      SceneManager_default.clearStack();
      if (this._transfer) {
        this.fadeInForTransfer();
        this._mapNameWindow.open();
        self.$gameMap.autoplay();
      } else if (this.needsFadeIn()) {
        this.startFadeIn(this.fadeSpeed(), false);
      }
      this.menuCalling = false;
    }
    update() {
      this.updateDestination();
      this.updateMainMultiply();
      if (this.isSceneChangeOk()) {
        this.updateScene();
      } else if (SceneManager_default.isNextScene(Scene_Battle_default)) {
        this.updateEncounterEffect();
      }
      this.updateWaitCount();
      super.update();
    }
    updateMainMultiply() {
      this.updateMain();
      if (this.isFastForward()) {
        if (!this.isMapTouchOk()) {
          this.updateDestination();
        }
        this.updateMain();
      }
    }
    updateMain() {
      const active = this.isActive();
      self.$gameMap.update(active);
      self.$gamePlayer.update(active);
      self.$gameTimer.update(active);
      self.$gameScreen.update();
    }
    isFastForward() {
      return self.$gameMap.isEventRunning() && !SceneManager_default.isSceneChanging() && (Input_default.isLongPressed("ok") || TouchInput_default.isLongPressed());
    }
    stop() {
      super.stop();
      self.$gamePlayer.straighten();
      this._mapNameWindow.close();
      if (this.needsSlowFadeOut()) {
        this.startFadeOut(this.slowFadeSpeed(), false);
      } else if (SceneManager_default.isNextScene(Scene_Map)) {
        this.fadeOutForTransfer();
      } else if (SceneManager_default.isNextScene(Scene_Battle_default)) {
        this.launchBattle();
      }
    }
    isBusy() {
      return this._messageWindow && this._messageWindow.isClosing() || this._waitCount > 0 || this._encounterEffectDuration > 0 || Scene_Base_default.prototype.isBusy.call(this);
    }
    terminate() {
      super.terminate();
      if (!SceneManager_default.isNextScene(Scene_Battle_default)) {
        this._spriteset.update();
        this._mapNameWindow.hide();
        SceneManager_default.snapForBackground();
      } else {
        ImageManager_default.clearRequest();
      }
      if (SceneManager_default.isNextScene(Scene_Map)) {
        ImageManager_default.clearRequest();
      }
      self.$gameScreen.clearZoom();
      this.removeChild(this._fadeSprite);
      this.removeChild(this._mapNameWindow);
      this.removeChild(this._windowLayer);
      this.removeChild(this._spriteset);
    }
    needsFadeIn() {
      return SceneManager_default.isPreviousScene(Scene_Battle_default) || SceneManager_default.isPreviousScene(Scene_Load_default);
    }
    needsSlowFadeOut() {
      return SceneManager_default.isNextScene(Scene_Title_default) || SceneManager_default.isNextScene(Scene_Gameover_default);
    }
    updateWaitCount() {
      if (this._waitCount > 0) {
        this._waitCount--;
        return true;
      }
      return false;
    }
    updateDestination() {
      if (this.isMapTouchOk()) {
        this.processMapTouch();
      } else {
        self.$gameTemp.clearDestination();
        this._touchCount = 0;
      }
    }
    isMapTouchOk() {
      return this.isActive() && self.$gamePlayer.canMove();
    }
    processMapTouch() {
      if (TouchInput_default.isTriggered() || this._touchCount > 0) {
        if (TouchInput_default.isPressed()) {
          if (this._touchCount === 0 || this._touchCount >= 15) {
            const x = self.$gameMap.canvasToMapX(TouchInput_default.x);
            const y = self.$gameMap.canvasToMapY(TouchInput_default.y);
            self.$gameTemp.setDestination(x, y);
          }
          this._touchCount++;
        } else {
          this._touchCount = 0;
        }
      }
    }
    isSceneChangeOk() {
      return this.isActive() && !self.$gameMessage.isBusy();
    }
    updateScene() {
      this.checkGameover();
      if (!SceneManager_default.isSceneChanging()) {
        this.updateTransferPlayer();
      }
      if (!SceneManager_default.isSceneChanging()) {
        this.updateEncounter();
      }
      if (!SceneManager_default.isSceneChanging()) {
        this.updateCallMenu();
      }
      if (!SceneManager_default.isSceneChanging()) {
        this.updateCallDebug();
      }
    }
    createDisplayObjects() {
      this.createSpriteset();
      this.createMapNameWindow();
      this.createWindowLayer();
      this.createAllWindows();
    }
    createSpriteset() {
      this._spriteset = new Spriteset_Map_default();
      this.addChild(this._spriteset);
    }
    createAllWindows() {
      this.createMessageWindow();
      this.createScrollTextWindow();
    }
    createMapNameWindow() {
      this._mapNameWindow = new Window_MapName_default();
      this.addChild(this._mapNameWindow);
    }
    createMessageWindow() {
      this._messageWindow = new Window_Message_default();
      this.addWindow(this._messageWindow);
      this._messageWindow.subWindows().forEach(function(window2) {
        this.addWindow(window2);
      }, this);
    }
    createScrollTextWindow() {
      this._scrollTextWindow = new Window_ScrollText_default();
      this.addWindow(this._scrollTextWindow);
    }
    updateTransferPlayer() {
      if (self.$gamePlayer.isTransferring()) {
        SceneManager_default.goto(Scene_Map);
      }
    }
    updateEncounter() {
      if (self.$gamePlayer.executeEncounter()) {
        SceneManager_default.push(Scene_Battle_default);
      }
    }
    updateCallMenu() {
      if (this.isMenuEnabled()) {
        if (this.isMenuCalled()) {
          this.menuCalling = true;
        }
        if (this.menuCalling && !self.$gamePlayer.isMoving()) {
          this.callMenu();
        }
      } else {
        this.menuCalling = false;
      }
    }
    isMenuEnabled() {
      return self.$gameSystem.isMenuEnabled() && !self.$gameMap.isEventRunning();
    }
    isMenuCalled() {
      return Input_default.isTriggered("menu") || TouchInput_default.isCancelled();
    }
    callMenu() {
      SoundManager_default.playOk();
      SceneManager_default.push(Scene_Menu_default);
      Window_MenuCommand_default.initCommandPosition();
      self.$gameTemp.clearDestination();
      this._mapNameWindow.hide();
      this._waitCount = 2;
    }
    updateCallDebug() {
      if (this.isDebugCalled()) {
        SceneManager_default.push(Scene_Debug_default);
      }
    }
    isDebugCalled() {
      return Input_default.isTriggered("debug") && self.$gameTemp.isPlaytest();
    }
    fadeInForTransfer() {
      const fadeType = self.$gamePlayer.fadeType();
      switch (fadeType) {
        case 0:
        case 1:
          this.startFadeIn(this.fadeSpeed(), fadeType === 1);
          break;
      }
    }
    fadeOutForTransfer() {
      const fadeType = self.$gamePlayer.fadeType();
      switch (fadeType) {
        case 0:
        case 1:
          this.startFadeOut(this.fadeSpeed(), fadeType === 1);
          break;
      }
    }
    launchBattle() {
      BattleManager_default.saveBgmAndBgs();
      this.stopAudioOnBattleStart();
      SoundManager_default.playBattleStart();
      this.startEncounterEffect();
      this._mapNameWindow.hide();
    }
    stopAudioOnBattleStart() {
      if (!AudioManager_default.isCurrentBgm(self.$gameSystem.battleBgm())) {
        AudioManager_default.stopBgm();
      }
      AudioManager_default.stopBgs();
      AudioManager_default.stopMe();
      AudioManager_default.stopSe();
    }
    startEncounterEffect() {
      this._spriteset.hideCharacters();
      this._encounterEffectDuration = this.encounterEffectSpeed();
    }
    updateEncounterEffect() {
      if (this._encounterEffectDuration > 0) {
        this._encounterEffectDuration--;
        const speed = this.encounterEffectSpeed();
        const n = speed - this._encounterEffectDuration;
        const p = n / speed;
        const q = ((p - 1) * 20 * p + 5) * p + 1;
        const zoomX = self.$gamePlayer.screenX();
        const zoomY = self.$gamePlayer.screenY() - 24;
        if (n === 2) {
          self.$gameScreen.setZoom(zoomX, zoomY, 1);
          this.snapForBattleBackground();
          this.startFlashForEncounter(speed / 2);
        }
        self.$gameScreen.setZoom(zoomX, zoomY, q);
        if (n === Math.floor(speed / 6)) {
          this.startFlashForEncounter(speed / 2);
        }
        if (n === Math.floor(speed / 2)) {
          BattleManager_default.playBattleBgm();
          this.startFadeOut(this.fadeSpeed());
        }
      }
    }
    snapForBattleBackground() {
      this._windowLayer.visible = false;
      SceneManager_default.snapForBackground();
      this._windowLayer.visible = true;
    }
    startFlashForEncounter(duration) {
      const color = [255, 255, 255, 255];
      self.$gameScreen.startFlash(color, duration);
    }
    encounterEffectSpeed() {
      return 60;
    }
  };
  var Scene_Map_default = Scene_Map;

  // src-www/js/rpg_windows/Window_TitleCommand.js
  var Window_TitleCommand = class extends Window_Command_default {
    constructor(...args) {
      super(...args);
      this.initialize(...args);
    }
    initialize() {
      super.initialize(0, 0);
      this.updatePlacement();
      this.openness = 0;
      this.selectLast();
    }
    static initCommandPosition() {
      this._lastCommandSymbol = null;
    }
    windowWidth() {
      return 240;
    }
    updatePlacement() {
      this.x = (Graphics_default.boxWidth - this.width) / 2;
      this.y = Graphics_default.boxHeight - this.height - 96;
    }
    makeCommandList() {
      this.addCommand(TextManager_default.newGame, "newGame");
      this.addCommand(
        TextManager_default.continue_,
        "continue",
        this.isContinueEnabled()
      );
      this.addCommand(TextManager_default.options, "options");
    }
    isContinueEnabled() {
      return DataManager.isAnySavefileExists();
    }
    processOk() {
      Window_TitleCommand._lastCommandSymbol = this.currentSymbol();
      super.processOk();
    }
    selectLast() {
      if (Window_TitleCommand._lastCommandSymbol) {
        this.selectSymbol(Window_TitleCommand._lastCommandSymbol);
      } else if (this.isContinueEnabled()) {
        this.selectSymbol("continue");
      }
    }
  };
  Window_TitleCommand._lastCommandSymbol = null;
  var Window_TitleCommand_default = Window_TitleCommand;

  // src-www/js/rpg_scenes/Scene_Title.js
  var Scene_Title = class extends Scene_Base_default {
    constructor(...args) {
      super(...args);
      this.initialize(...args);
    }
    initialize() {
      super.initialize();
    }
    create() {
      super.create();
      this.createBackground();
      this.createForeground();
      this.createWindowLayer();
      this.createCommandWindow();
    }
    start() {
      super.start();
      SceneManager_default.clearStack();
      this.centerSprite(this._backSprite1);
      this.centerSprite(this._backSprite2);
      this.playTitleMusic();
      this.startFadeIn(this.fadeSpeed(), false);
    }
    update() {
      if (!this.isBusy()) {
        this._commandWindow.open();
      }
      super.update();
    }
    isBusy() {
      return this._commandWindow.isClosing() || Scene_Base_default.prototype.isBusy.call(this);
    }
    terminate() {
      super.terminate();
      SceneManager_default.snapForBackground();
    }
    createBackground() {
      this._backSprite1 = new Sprite_default(
        ImageManager_default.loadTitle1(self.$dataSystem.title1Name)
      );
      this._backSprite2 = new Sprite_default(
        ImageManager_default.loadTitle2(self.$dataSystem.title2Name)
      );
      this.addChild(this._backSprite1);
      this.addChild(this._backSprite2);
    }
    createForeground() {
      this._gameTitleSprite = new Sprite_default(
        new Bitmap_default(Graphics_default.width, Graphics_default.height)
      );
      this.addChild(this._gameTitleSprite);
      if (self.$dataSystem.optDrawTitle) {
        this.drawGameTitle();
      }
    }
    drawGameTitle() {
      const x = 20;
      const y = Graphics_default.height / 4;
      const maxWidth = Graphics_default.width - x * 2;
      const text = self.$dataSystem.gameTitle;
      this._gameTitleSprite.bitmap.outlineColor = "black";
      this._gameTitleSprite.bitmap.outlineWidth = 8;
      this._gameTitleSprite.bitmap.fontSize = 72;
      this._gameTitleSprite.bitmap.drawText(text, x, y, maxWidth, 48, "center");
    }
    centerSprite(sprite) {
      sprite.x = Graphics_default.width / 2;
      sprite.y = Graphics_default.height / 2;
      sprite.anchor.x = 0.5;
      sprite.anchor.y = 0.5;
    }
    createCommandWindow() {
      this._commandWindow = new Window_TitleCommand_default();
      this._commandWindow.setHandler("newGame", this.commandNewGame.bind(this));
      this._commandWindow.setHandler("continue", this.commandContinue.bind(this));
      this._commandWindow.setHandler("options", this.commandOptions.bind(this));
      this.addWindow(this._commandWindow);
    }
    commandNewGame() {
      DataManager.setupNewGame();
      this._commandWindow.close();
      this.fadeOutAll();
      SceneManager_default.goto(Scene_Map_default);
    }
    commandContinue() {
      this._commandWindow.close();
      SceneManager_default.push(Scene_Load_default);
    }
    commandOptions() {
      this._commandWindow.close();
      SceneManager_default.push(Scene_Options_default);
    }
    playTitleMusic() {
      AudioManager_default.playBgm(self.$dataSystem.titleBgm);
      AudioManager_default.stopBgs();
      AudioManager_default.stopMe();
    }
  };
  var Scene_Title_default = Scene_Title;

  // src-www/js/rpg_scenes/Scene_Gameover.js
  var Scene_Gameover = class extends Scene_Base_default {
    constructor(...args) {
      super(...args);
      this.initialize(...args);
    }
    initialize() {
      super.initialize();
    }
    create() {
      super.create();
      this.playGameoverMusic();
      this.createBackground();
    }
    start() {
      super.start();
      this.startFadeIn(this.slowFadeSpeed(), false);
    }
    update() {
      if (this.isActive() && !this.isBusy() && this.isTriggered()) {
        this.gotoTitle();
      }
      super.update();
    }
    stop() {
      super.stop();
      this.fadeOutAll();
    }
    terminate() {
      super.terminate();
      AudioManager_default.stopAll();
    }
    playGameoverMusic() {
      AudioManager_default.stopBgm();
      AudioManager_default.stopBgs();
      AudioManager_default.playMe(self.$dataSystem.gameoverMe);
    }
    createBackground() {
      this._backSprite = new Sprite_default();
      this._backSprite.bitmap = ImageManager_default.loadSystem("GameOver");
      this.addChild(this._backSprite);
    }
    isTriggered() {
      return Input_default.isTriggered("ok") || TouchInput_default.isTriggered();
    }
    gotoTitle() {
      SceneManager_default.goto(Scene_Title_default);
    }
  };
  var Scene_Gameover_default = Scene_Gameover;

  // src-www/js/rpg_managers/BattleManager.js
  var BattleManager = class {
    constructor() {
      throw new Error("This is a static class");
    }
    static setup(troopId, canEscape, canLose) {
      this.initMembers();
      this._canEscape = canEscape;
      this._canLose = canLose;
      self.$gameTroop.setup(troopId);
      self.$gameScreen.onBattleStart();
      this.makeEscapeRatio();
    }
    static initMembers() {
      this._phase = "init";
      this._canEscape = false;
      this._canLose = false;
      this._battleTest = false;
      this._eventCallback = null;
      this._preemptive = false;
      this._surprise = false;
      this._actorIndex = -1;
      this._actionForcedBattler = null;
      this._mapBgm = null;
      this._mapBgs = null;
      this._actionBattlers = [];
      this._subject = null;
      this._action = null;
      this._targets = [];
      this._logWindow = null;
      this._statusWindow = null;
      this._spriteset = null;
      this._escapeRatio = 0;
      this._escaped = false;
      this._rewards = {};
      this._turnForced = false;
    }
    static isBattleTest() {
      return this._battleTest;
    }
    static setBattleTest(battleTest) {
      this._battleTest = battleTest;
    }
    static setEventCallback(callback) {
      this._eventCallback = callback;
    }
    static setLogWindow(logWindow) {
      this._logWindow = logWindow;
    }
    static setStatusWindow(statusWindow) {
      this._statusWindow = statusWindow;
    }
    static setSpriteset(spriteset) {
      this._spriteset = spriteset;
    }
    static onEncounter() {
      this._preemptive = Math.random() < this.ratePreemptive();
      this._surprise = Math.random() < this.rateSurprise() && !this._preemptive;
    }
    static saveBgmAndBgs() {
      this._mapBgm = AudioManager_default.saveBgm();
      this._mapBgs = AudioManager_default.saveBgs();
    }
    static replayBgmAndBgs() {
      if (this._mapBgm) {
        AudioManager_default.replayBgm(this._mapBgm);
      } else {
        AudioManager_default.stopBgm();
      }
      if (this._mapBgs) {
        AudioManager_default.replayBgs(this._mapBgs);
      }
    }
    static makeEscapeRatio() {
      this._escapeRatio = 0.5 * self.$gameParty.agility() / self.$gameTroop.agility();
    }
    static update() {
      if (!this.isBusy() && !this.updateEvent()) {
        switch (this._phase) {
          case "start":
            this.startInput();
            break;
          case "turn":
            this.updateTurn();
            break;
          case "action":
            this.updateAction();
            break;
          case "turnEnd":
            this.updateTurnEnd();
            break;
          case "battleEnd":
            this.updateBattleEnd();
            break;
        }
      }
    }
    static updateEvent() {
      switch (this._phase) {
        case "start":
        case "turn":
        case "turnEnd":
          if (this.isActionForced()) {
            this.processForcedAction();
            return true;
          } else {
            return this.updateEventMain();
          }
      }
      return this.checkAbort();
    }
    static updateEventMain() {
      self.$gameTroop.updateInterpreter();
      self.$gameParty.requestMotionRefresh();
      if (self.$gameTroop.isEventRunning() || this.checkBattleEnd()) {
        return true;
      }
      self.$gameTroop.setupBattleEvent();
      if (self.$gameTroop.isEventRunning() || SceneManager_default.isSceneChanging()) {
        return true;
      }
      return false;
    }
    static isBusy() {
      return self.$gameMessage.isBusy() || this._spriteset.isBusy() || this._logWindow.isBusy();
    }
    static isInputting() {
      return this._phase === "input";
    }
    static isInTurn() {
      return this._phase === "turn";
    }
    static isTurnEnd() {
      return this._phase === "turnEnd";
    }
    static isAborting() {
      return this._phase === "aborting";
    }
    static isBattleEnd() {
      return this._phase === "battleEnd";
    }
    static canEscape() {
      return this._canEscape;
    }
    static canLose() {
      return this._canLose;
    }
    static isEscaped() {
      return this._escaped;
    }
    static actor() {
      return this._actorIndex >= 0 ? self.$gameParty.members()[this._actorIndex] : null;
    }
    static clearActor() {
      this.changeActor(-1, "");
    }
    static changeActor(newActorIndex, lastActorActionState) {
      const lastActor = this.actor();
      this._actorIndex = newActorIndex;
      const newActor = this.actor();
      if (lastActor) {
        lastActor.setActionState(lastActorActionState);
      }
      if (newActor) {
        newActor.setActionState("inputting");
      }
    }
    static startBattle() {
      this._phase = "start";
      self.$gameSystem.onBattleStart();
      self.$gameParty.onBattleStart();
      self.$gameTroop.onBattleStart();
      this.displayStartMessages();
    }
    static displayStartMessages() {
      self.$gameTroop.enemyNames().forEach((name) => {
        self.$gameMessage.add(TextManager_default.emerge.format(name));
      });
      if (this._preemptive) {
        self.$gameMessage.add(
          TextManager_default.preemptive.format(self.$gameParty.name())
        );
      } else if (this._surprise) {
        self.$gameMessage.add(
          TextManager_default.surprise.format(self.$gameParty.name())
        );
      }
    }
    static startInput() {
      this._phase = "input";
      self.$gameParty.makeActions();
      self.$gameTroop.makeActions();
      this.clearActor();
      if (this._surprise || !self.$gameParty.canInput()) {
        this.startTurn();
      }
    }
    static inputtingAction() {
      const actor2 = this.actor();
      return actor2 ? actor2.inputtingAction() : null;
    }
    static selectNextCommand() {
      do {
        const actor2 = this.actor();
        if (!actor2 || !actor2.selectNextCommand()) {
          this.changeActor(this._actorIndex + 1, "waiting");
          if (this._actorIndex >= self.$gameParty.size()) {
            this.startTurn();
            break;
          }
        }
      } while (!this.actor().canInput());
    }
    static selectPreviousCommand() {
      do {
        const actor2 = this.actor();
        if (!actor2 || !actor2.selectPreviousCommand()) {
          this.changeActor(this._actorIndex - 1, "undecided");
          if (this._actorIndex < 0) {
            return;
          }
        }
      } while (!this.actor().canInput());
    }
    static refreshStatus() {
      this._statusWindow.refresh();
    }
    static startTurn() {
      this._phase = "turn";
      this.clearActor();
      self.$gameTroop.increaseTurn();
      this.makeActionOrders();
      self.$gameParty.requestMotionRefresh();
      this._logWindow.startTurn();
    }
    static updateTurn() {
      self.$gameParty.requestMotionRefresh();
      if (!this._subject) {
        this._subject = this.getNextSubject();
      }
      if (this._subject) {
        this.processTurn();
      } else {
        this.endTurn();
      }
    }
    static processTurn() {
      const subject = this._subject;
      const action = subject.currentAction();
      if (action) {
        action.prepare();
        if (action.isValid()) {
          this.startAction();
        }
        subject.removeCurrentAction();
      } else {
        subject.onAllActionsEnd();
        this.refreshStatus();
        this._logWindow.displayAutoAffectedStatus(subject);
        this._logWindow.displayCurrentState(subject);
        this._logWindow.displayRegeneration(subject);
        this._subject = this.getNextSubject();
      }
    }
    static endTurn() {
      this._phase = "turnEnd";
      this._preemptive = false;
      this._surprise = false;
      this.allBattleMembers().forEach(function(battler) {
        battler.onTurnEnd();
        this.refreshStatus();
        this._logWindow.displayAutoAffectedStatus(battler);
        this._logWindow.displayRegeneration(battler);
      }, this);
      if (this.isForcedTurn()) {
        this._turnForced = false;
      }
    }
    static isForcedTurn() {
      return this._turnForced;
    }
    static updateTurnEnd() {
      this.startInput();
    }
    static getNextSubject() {
      for (; ; ) {
        const battler = this._actionBattlers.shift();
        if (!battler) {
          return null;
        }
        if (battler.isBattleMember() && battler.isAlive()) {
          return battler;
        }
      }
    }
    static makeActionOrders() {
      let battlers = [];
      if (!this._surprise) {
        battlers = battlers.concat(self.$gameParty.members());
      }
      if (!this._preemptive) {
        battlers = battlers.concat(self.$gameTroop.members());
      }
      battlers.forEach((battler) => {
        battler.makeSpeed();
      });
      battlers.sort((a2, b2) => b2.speed() - a2.speed());
      this._actionBattlers = battlers;
    }
    static startAction() {
      const subject = this._subject;
      const action = subject.currentAction();
      const targets = action.makeTargets();
      this._phase = "action";
      this._action = action;
      this._targets = targets;
      subject.useItem(action.item());
      this._action.applyGlobal();
      this.refreshStatus();
      this._logWindow.startAction(subject, action, targets);
    }
    static updateAction() {
      const target2 = this._targets.shift();
      if (target2) {
        this.invokeAction(this._subject, target2);
      } else {
        this.endAction();
      }
    }
    static endAction() {
      this._logWindow.endAction(this._subject);
      this._phase = "turn";
    }
    static invokeAction(subject, target2) {
      this._logWindow.push("pushBaseLine");
      if (Math.random() < this._action.itemCnt(target2)) {
        this.invokeCounterAttack(subject, target2);
      } else if (Math.random() < this._action.itemMrf(target2)) {
        this.invokeMagicReflection(subject, target2);
      } else {
        this.invokeNormalAction(subject, target2);
      }
      subject.setLastTarget(target2);
      this._logWindow.push("popBaseLine");
      this.refreshStatus();
    }
    static invokeNormalAction(subject, target2) {
      const realTarget = this.applySubstitute(target2);
      this._action.apply(realTarget);
      this._logWindow.displayActionResults(subject, realTarget);
    }
    static invokeCounterAttack(subject, target2) {
      const action = new Game_Action_default(target2);
      action.setAttack();
      action.apply(subject);
      this._logWindow.displayCounter(target2);
      this._logWindow.displayActionResults(target2, subject);
    }
    static invokeMagicReflection(subject, target2) {
      this._action._reflectionTarget = target2;
      this._logWindow.displayReflection(target2);
      this._action.apply(subject);
      this._logWindow.displayActionResults(target2, subject);
    }
    static applySubstitute(target2) {
      if (this.checkSubstitute(target2)) {
        const substitute = target2.friendsUnit().substituteBattler();
        if (substitute && target2 !== substitute) {
          this._logWindow.displaySubstitute(substitute, target2);
          return substitute;
        }
      }
      return target2;
    }
    static checkSubstitute(target2) {
      return target2.isDying() && !this._action.isCertainHit();
    }
    static isActionForced() {
      return !!this._actionForcedBattler;
    }
    static forceAction(battler) {
      this._actionForcedBattler = battler;
      const index = this._actionBattlers.indexOf(battler);
      if (index >= 0) {
        this._actionBattlers.splice(index, 1);
      }
    }
    static processForcedAction() {
      if (this._actionForcedBattler) {
        this._turnForced = true;
        this._subject = this._actionForcedBattler;
        this._actionForcedBattler = null;
        this.startAction();
        this._subject.removeCurrentAction();
      }
    }
    static abort() {
      this._phase = "aborting";
    }
    static checkBattleEnd() {
      if (this._phase) {
        if (this.checkAbort()) {
          return true;
        } else if (self.$gameParty.isAllDead()) {
          this.processDefeat();
          return true;
        } else if (self.$gameTroop.isAllDead()) {
          this.processVictory();
          return true;
        }
      }
      return false;
    }
    static checkAbort() {
      if (self.$gameParty.isEmpty() || this.isAborting()) {
        SoundManager_default.playEscape();
        this._escaped = true;
        this.processAbort();
      }
      return false;
    }
    static processVictory() {
      self.$gameParty.removeBattleStates();
      self.$gameParty.performVictory();
      this.playVictoryMe();
      this.replayBgmAndBgs();
      this.makeRewards();
      this.displayVictoryMessage();
      this.displayRewards();
      this.gainRewards();
      this.endBattle(0);
    }
    static processEscape() {
      self.$gameParty.performEscape();
      SoundManager_default.playEscape();
      const success = this.processEscapeFormula();
      if (success) {
        this.displayEscapeSuccessMessage();
        this._escaped = true;
        this.processAbort();
      } else {
        this.displayEscapeFailureMessage();
        this._escapeRatio += 0.1;
        self.$gameParty.clearActions();
        this.startTurn();
      }
      return success;
    }
    static processEscapeFormula() {
      return this._preemptive ? true : Math.random() < this._escapeRatio;
    }
    static processAbort() {
      self.$gameParty.removeBattleStates();
      this.replayBgmAndBgs();
      this.endBattle(1);
    }
    static processDefeat() {
      this.displayDefeatMessage();
      this.playDefeatMe();
      if (this._canLose) {
        this.replayBgmAndBgs();
      } else {
        AudioManager_default.stopBgm();
      }
      this.endBattle(2);
    }
    static endBattle(result2) {
      this._phase = "battleEnd";
      if (this._eventCallback) {
        this._eventCallback(result2);
      }
      if (result2 === 0) {
        self.$gameSystem.onBattleWin();
      } else if (this._escaped) {
        self.$gameSystem.onBattleEscape();
      }
    }
    static updateBattleEnd() {
      if (this.isBattleTest()) {
        AudioManager_default.stopBgm();
        SceneManager_default.exit();
      } else if (!this._escaped && self.$gameParty.isAllDead()) {
        if (this._canLose) {
          self.$gameParty.reviveBattleMembers();
          SceneManager_default.pop();
        } else {
          SceneManager_default.goto(Scene_Gameover_default);
        }
      } else {
        SceneManager_default.pop();
      }
      this._phase = null;
    }
    static makeRewards() {
      this._rewards = {};
      this._rewards.gold = self.$gameTroop.goldTotal();
      this._rewards.exp = self.$gameTroop.expTotal();
      this._rewards.items = self.$gameTroop.makeDropItems();
    }
    static displayRewards() {
      this.displayExp();
      this.displayGold();
      this.displayDropItems();
    }
    static displayExp() {
      const exp = this._rewards.exp;
      if (exp > 0) {
        const text = TextManager_default.obtainExp.format(exp, TextManager_default.exp);
        self.$gameMessage.add(`\\.${text}`);
      }
    }
    static displayGold() {
      const gold = this._rewards.gold;
      if (gold > 0) {
        self.$gameMessage.add(`\\.${TextManager_default.obtainGold.format(gold)}`);
      }
    }
    static displayDropItems() {
      const items = this._rewards.items;
      if (items.length > 0) {
        self.$gameMessage.newPage();
        items.forEach(({ name }) => {
          self.$gameMessage.add(TextManager_default.obtainItem.format(name));
        });
      }
    }
    static gainRewards() {
      this.gainExp();
      this.gainGold();
      this.gainDropItems();
    }
    static gainExp() {
      const exp = this._rewards.exp;
      self.$gameParty.allMembers().forEach((actor2) => {
        actor2.gainExp(exp);
      });
    }
    static gainGold() {
      self.$gameParty.gainGold(this._rewards.gold);
    }
    static gainDropItems() {
      const items = this._rewards.items;
      items.forEach((item2) => {
        self.$gameParty.gainItem(item2, 1);
      });
    }
    static ratePreemptive() {
      return self.$gameParty.ratePreemptive(self.$gameTroop.agility());
    }
    static rateSurprise() {
      return self.$gameParty.rateSurprise(self.$gameTroop.agility());
    }
    static playBattleBgm() {
      AudioManager_default.playBgm(self.$gameSystem.battleBgm());
      AudioManager_default.stopBgs();
    }
    static playVictoryMe() {
      AudioManager_default.playMe(self.$gameSystem.victoryMe());
    }
    static playDefeatMe() {
      AudioManager_default.playMe(self.$gameSystem.defeatMe());
    }
    static allBattleMembers() {
      return self.$gameParty.members().concat(self.$gameTroop.members());
    }
    static displayVictoryMessage() {
      self.$gameMessage.add(TextManager_default.victory.format(self.$gameParty.name()));
    }
    static displayDefeatMessage() {
      self.$gameMessage.add(TextManager_default.defeat.format(self.$gameParty.name()));
    }
    static displayEscapeSuccessMessage() {
      self.$gameMessage.add(
        TextManager_default.escapeStart.format(self.$gameParty.name())
      );
    }
    static displayEscapeFailureMessage() {
      self.$gameMessage.add(
        TextManager_default.escapeStart.format(self.$gameParty.name())
      );
      self.$gameMessage.add(`\\.${TextManager_default.escapeFailure}`);
    }
  };
  var BattleManager_default = BattleManager;

  // src-www/js/rpg_scenes/Scene_Boot.js
  var Scene_Boot = class extends Scene_Base_default {
    constructor(...args) {
      super(...args);
      this.initialize(...args);
    }
    initialize() {
      super.initialize();
      this._startDate = Date.now();
    }
    create() {
      super.create();
      DataManager.loadDatabase();
      DataManager.loadGlobalInfo();
      ConfigManager_default.load();
      this.loadSystemWindowImage();
    }
    loadSystemWindowImage() {
      ImageManager_default.reserveSystem("Window");
    }
    isReady() {
      if (Scene_Base_default.prototype.isReady.call(this)) {
        return ConfigManager_default.isConfigLoaded() && DataManager.isGlobalInfoLoaded() && DataManager.isDatabaseLoaded() && this.isGameFontLoaded();
      } else {
        return false;
      }
    }
    isGameFontLoaded() {
      if (Graphics_default.isFontLoaded("GameFont")) {
        return true;
      } else if (!Graphics_default.canUseCssFontLoading()) {
        const elapsed = Date.now() - this._startDate;
        if (elapsed >= 6e4) {
          throw new Error("Failed to load GameFont");
        }
      }
    }
    start() {
      super.start();
      SoundManager_default.preloadImportantSounds();
      if (DataManager.isBattleTest()) {
        DataManager.setupBattleTest();
        SceneManager_default.goto(Scene_Battle_default);
      } else if (DataManager.isEventTest()) {
        DataManager.setupEventTest();
        SceneManager_default.goto(Scene_Map_default);
      } else {
        this.checkPlayerLocation();
        DataManager.setupNewGame();
        SceneManager_default.goto(Scene_Title_default);
        Window_TitleCommand_default.initCommandPosition();
      }
      this.updateDocumentTitle();
    }
    updateDocumentTitle() {
      document.title = self.$dataSystem.gameTitle;
    }
    checkPlayerLocation() {
      if (self.$dataSystem.startMapId === 0) {
        throw new Error("Player's starting position is not set");
      }
    }
    static loadSystemImages() {
      ImageManager_default.reserveSystem("IconSet");
      ImageManager_default.reserveSystem("Balloon");
      ImageManager_default.reserveSystem("Shadow1");
      ImageManager_default.reserveSystem("Shadow2");
      ImageManager_default.reserveSystem("Damage");
      ImageManager_default.reserveSystem("States");
      ImageManager_default.reserveSystem("Weapons1");
      ImageManager_default.reserveSystem("Weapons2");
      ImageManager_default.reserveSystem("Weapons3");
      ImageManager_default.reserveSystem("ButtonSet");
    }
  };
  var Scene_Boot_default = Scene_Boot;

  // src-www/js/rpg_objects/Game_Temp.js
  var Game_Temp = class {
    constructor(...args) {
      this.initialize(...args);
    }
    initialize() {
      this._isPlaytest = Utils_default.isOptionValid("test");
      this._commonEventId = 0;
      this._destinationX = null;
      this._destinationY = null;
    }
    isPlaytest() {
      return this._isPlaytest;
    }
    reserveCommonEvent(commonEventId) {
      this._commonEventId = commonEventId;
    }
    clearCommonEvent() {
      this._commonEventId = 0;
    }
    isCommonEventReserved() {
      return this._commonEventId > 0;
    }
    reservedCommonEvent() {
      return self.$dataCommonEvents[this._commonEventId];
    }
    reservedCommonEventId() {
      return this._commonEventId;
    }
    setDestination(x, y) {
      this._destinationX = x;
      this._destinationY = y;
    }
    clearDestination() {
      this._destinationX = null;
      this._destinationY = null;
    }
    isDestinationValid() {
      return this._destinationX !== null;
    }
    destinationX() {
      return this._destinationX;
    }
    destinationY() {
      return this._destinationY;
    }
  };
  var Game_Temp_default = Game_Temp;

  // src-www/js/rpg_objects/Game_System.js
  var Game_System = class {
    constructor(...args) {
      this.initialize(...args);
    }
    initialize() {
      this._saveEnabled = true;
      this._menuEnabled = true;
      this._encounterEnabled = true;
      this._formationEnabled = true;
      this._battleCount = 0;
      this._winCount = 0;
      this._escapeCount = 0;
      this._saveCount = 0;
      this._versionId = 0;
      this._framesOnSave = 0;
      this._sceneFramesOnSave = 0;
      this._bgmOnSave = null;
      this._bgsOnSave = null;
      this._windowTone = null;
      this._battleBgm = null;
      this._victoryMe = null;
      this._defeatMe = null;
      this._savedBgm = null;
      this._walkingBgm = null;
    }
    isJapanese() {
      return self.$dataSystem.locale.match(/^ja/);
    }
    isChinese() {
      return self.$dataSystem.locale.match(/^zh/);
    }
    isKorean() {
      return self.$dataSystem.locale.match(/^ko/);
    }
    isCJK() {
      return self.$dataSystem.locale.match(/^(ja|zh|ko)/);
    }
    isRussian() {
      return self.$dataSystem.locale.match(/^ru/);
    }
    isSideView() {
      return self.$dataSystem.optSideView;
    }
    isSaveEnabled() {
      return this._saveEnabled;
    }
    disableSave() {
      this._saveEnabled = false;
    }
    enableSave() {
      this._saveEnabled = true;
    }
    isMenuEnabled() {
      return this._menuEnabled;
    }
    disableMenu() {
      this._menuEnabled = false;
    }
    enableMenu() {
      this._menuEnabled = true;
    }
    isEncounterEnabled() {
      return this._encounterEnabled;
    }
    disableEncounter() {
      this._encounterEnabled = false;
    }
    enableEncounter() {
      this._encounterEnabled = true;
    }
    isFormationEnabled() {
      return this._formationEnabled;
    }
    disableFormation() {
      this._formationEnabled = false;
    }
    enableFormation() {
      this._formationEnabled = true;
    }
    battleCount() {
      return this._battleCount;
    }
    winCount() {
      return this._winCount;
    }
    escapeCount() {
      return this._escapeCount;
    }
    saveCount() {
      return this._saveCount;
    }
    versionId() {
      return this._versionId;
    }
    windowTone() {
      return this._windowTone || self.$dataSystem.windowTone;
    }
    setWindowTone(value3) {
      this._windowTone = value3;
    }
    battleBgm() {
      return this._battleBgm || self.$dataSystem.battleBgm;
    }
    setBattleBgm(value3) {
      this._battleBgm = value3;
    }
    victoryMe() {
      return this._victoryMe || self.$dataSystem.victoryMe;
    }
    setVictoryMe(value3) {
      this._victoryMe = value3;
    }
    defeatMe() {
      return this._defeatMe || self.$dataSystem.defeatMe;
    }
    setDefeatMe(value3) {
      this._defeatMe = value3;
    }
    onBattleStart() {
      this._battleCount++;
    }
    onBattleWin() {
      this._winCount++;
    }
    onBattleEscape() {
      this._escapeCount++;
    }
    onBeforeSave() {
      this._saveCount++;
      this._versionId = self.$dataSystem.versionId;
      this._framesOnSave = Graphics_default.frameCount;
      this._sceneFramesOnSave = SceneManager_default.frameCount();
      this._bgmOnSave = AudioManager_default.saveBgm();
      this._bgsOnSave = AudioManager_default.saveBgs();
    }
    onAfterLoad() {
      Graphics_default.frameCount = this._framesOnSave;
      SceneManager_default.setFrameCount(this._sceneFramesOnSave || this._framesOnSave);
      AudioManager_default.playBgm(this._bgmOnSave);
      AudioManager_default.playBgs(this._bgsOnSave);
    }
    playtime() {
      return Math.floor(SceneManager_default.frameCount() / 60);
    }
    playtimeText() {
      const hour = Math.floor(this.playtime() / 60 / 60);
      const min = Math.floor(this.playtime() / 60) % 60;
      const sec = this.playtime() % 60;
      return `${hour.padZero(2)}:${min.padZero(2)}:${sec.padZero(2)}`;
    }
    saveBgm() {
      this._savedBgm = AudioManager_default.saveBgm();
    }
    replayBgm() {
      if (this._savedBgm) {
        AudioManager_default.replayBgm(this._savedBgm);
      }
    }
    saveWalkingBgm() {
      this._walkingBgm = AudioManager_default.saveBgm();
    }
    replayWalkingBgm() {
      if (this._walkingBgm) {
        AudioManager_default.playBgm(this._walkingBgm);
      }
    }
    saveWalkingBgm2() {
      this._walkingBgm = self.$dataMap.bgm;
    }
  };
  var Game_System_default = Game_System;

  // src-www/js/rpg_objects/Game_Picture.js
  var Game_Picture = class {
    constructor(...args) {
      this.initialize(...args);
    }
    initialize() {
      this.initBasic();
      this.initTarget();
      this.initTone();
      this.initRotation();
    }
    name() {
      return this._name;
    }
    origin() {
      return this._origin;
    }
    x() {
      return this._x;
    }
    y() {
      return this._y;
    }
    scaleX() {
      return this._scaleX;
    }
    scaleY() {
      return this._scaleY;
    }
    opacity() {
      return this._opacity;
    }
    blendMode() {
      return this._blendMode;
    }
    tone() {
      return this._tone;
    }
    angle() {
      return this._angle;
    }
    initBasic() {
      this._name = "";
      this._origin = 0;
      this._x = 0;
      this._y = 0;
      this._scaleX = 100;
      this._scaleY = 100;
      this._opacity = 255;
      this._blendMode = 0;
    }
    initTarget() {
      this._targetX = this._x;
      this._targetY = this._y;
      this._targetScaleX = this._scaleX;
      this._targetScaleY = this._scaleY;
      this._targetOpacity = this._opacity;
      this._duration = 0;
    }
    initTone() {
      this._tone = null;
      this._toneTarget = null;
      this._toneDuration = 0;
    }
    initRotation() {
      this._angle = 0;
      this._rotationSpeed = 0;
    }
    show(name, origin, x, y, scaleX, scaleY, opacity, blendMode) {
      this._name = name;
      this._origin = origin;
      this._x = x;
      this._y = y;
      this._scaleX = scaleX;
      this._scaleY = scaleY;
      this._opacity = opacity;
      this._blendMode = blendMode;
      this.initTarget();
      this.initTone();
      this.initRotation();
    }
    move(origin, x, y, scaleX, scaleY, opacity, blendMode, duration) {
      this._origin = origin;
      this._targetX = x;
      this._targetY = y;
      this._targetScaleX = scaleX;
      this._targetScaleY = scaleY;
      this._targetOpacity = opacity;
      this._blendMode = blendMode;
      this._duration = duration;
    }
    rotate(speed) {
      this._rotationSpeed = speed;
    }
    tint(tone, duration) {
      if (!this._tone) {
        this._tone = [0, 0, 0, 0];
      }
      this._toneTarget = tone.clone();
      this._toneDuration = duration;
      if (this._toneDuration === 0) {
        this._tone = this._toneTarget.clone();
      }
    }
    erase() {
      this._name = "";
      this._origin = 0;
      this.initTarget();
      this.initTone();
      this.initRotation();
    }
    update() {
      this.updateMove();
      this.updateTone();
      this.updateRotation();
    }
    updateMove() {
      if (this._duration > 0) {
        const d = this._duration;
        this._x = (this._x * (d - 1) + this._targetX) / d;
        this._y = (this._y * (d - 1) + this._targetY) / d;
        this._scaleX = (this._scaleX * (d - 1) + this._targetScaleX) / d;
        this._scaleY = (this._scaleY * (d - 1) + this._targetScaleY) / d;
        this._opacity = (this._opacity * (d - 1) + this._targetOpacity) / d;
        this._duration--;
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
    updateRotation() {
      if (this._rotationSpeed !== 0) {
        this._angle += this._rotationSpeed / 2;
      }
    }
  };
  var Game_Picture_default = Game_Picture;

  // src-www/js/rpg_objects/Game_Screen.js
  var Game_Screen = class {
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
      this._weatherType = "none";
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
      if (type !== "none" || duration === 0) {
        this._weatherType = type;
      }
      this._weatherPowerTarget = type === "none" ? 0 : power;
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
        this._brightness = this._brightness * (d - 1) / d;
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
        const delta = this._shakePower * this._shakeSpeed * this._shakeDirection / 10;
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
          this._weatherType = "none";
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
    showPicture(pictureId, name, origin, x, y, scaleX, scaleY, opacity, blendMode) {
      const realPictureId = this.realPictureId(pictureId);
      const picture = new Game_Picture_default();
      picture.show(name, origin, x, y, scaleX, scaleY, opacity, blendMode);
      this._pictures[realPictureId] = picture;
    }
    movePicture(pictureId, origin, x, y, scaleX, scaleY, opacity, blendMode, duration) {
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
  };
  var Game_Screen_default = Game_Screen;

  // src-www/js/rpg_objects/Game_Timer.js
  var Game_Timer = class {
    constructor(...args) {
      this.initialize(...args);
    }
    initialize() {
      this._frames = 0;
      this._working = false;
    }
    update(sceneActive) {
      if (sceneActive && this._working && this._frames > 0) {
        this._frames--;
        if (this._frames === 0) {
          this.onExpire();
        }
      }
    }
    start(count) {
      this._frames = count;
      this._working = true;
    }
    stop() {
      this._working = false;
    }
    isWorking() {
      return this._working;
    }
    seconds() {
      return Math.floor(this._frames / 60);
    }
    onExpire() {
      BattleManager_default.abort();
    }
  };
  var Game_Timer_default = Game_Timer;

  // src-www/js/rpg_objects/Game_Message.js
  var Game_Message = class {
    constructor(...args) {
      this.initialize(...args);
    }
    initialize() {
      this.clear();
    }
    clear() {
      this._texts = [];
      this._choices = [];
      this._faceName = "";
      this._faceIndex = 0;
      this._background = 0;
      this._positionType = 2;
      this._choiceDefaultType = 0;
      this._choiceCancelType = 0;
      this._choiceBackground = 0;
      this._choicePositionType = 2;
      this._numInputVariableId = 0;
      this._numInputMaxDigits = 0;
      this._itemChoiceVariableId = 0;
      this._itemChoiceItypeId = 0;
      this._scrollMode = false;
      this._scrollSpeed = 2;
      this._scrollNoFast = false;
      this._choiceCallback = null;
    }
    choices() {
      return this._choices;
    }
    faceName() {
      return this._faceName;
    }
    faceIndex() {
      return this._faceIndex;
    }
    background() {
      return this._background;
    }
    positionType() {
      return this._positionType;
    }
    choiceDefaultType() {
      return this._choiceDefaultType;
    }
    choiceCancelType() {
      return this._choiceCancelType;
    }
    choiceBackground() {
      return this._choiceBackground;
    }
    choicePositionType() {
      return this._choicePositionType;
    }
    numInputVariableId() {
      return this._numInputVariableId;
    }
    numInputMaxDigits() {
      return this._numInputMaxDigits;
    }
    itemChoiceVariableId() {
      return this._itemChoiceVariableId;
    }
    itemChoiceItypeId() {
      return this._itemChoiceItypeId;
    }
    scrollMode() {
      return this._scrollMode;
    }
    scrollSpeed() {
      return this._scrollSpeed;
    }
    scrollNoFast() {
      return this._scrollNoFast;
    }
    add(text) {
      this._texts.push(text);
    }
    setFaceImage(faceName, faceIndex) {
      this._faceName = faceName;
      this._faceIndex = faceIndex;
    }
    setBackground(background) {
      this._background = background;
    }
    setPositionType(positionType) {
      this._positionType = positionType;
    }
    setChoices(choices, defaultType, cancelType) {
      this._choices = choices;
      this._choiceDefaultType = defaultType;
      this._choiceCancelType = cancelType;
    }
    setChoiceBackground(background) {
      this._choiceBackground = background;
    }
    setChoicePositionType(positionType) {
      this._choicePositionType = positionType;
    }
    setNumberInput(variableId, maxDigits) {
      this._numInputVariableId = variableId;
      this._numInputMaxDigits = maxDigits;
    }
    setItemChoice(variableId, itemType) {
      this._itemChoiceVariableId = variableId;
      this._itemChoiceItypeId = itemType;
    }
    setScroll(speed, noFast) {
      this._scrollMode = true;
      this._scrollSpeed = speed;
      this._scrollNoFast = noFast;
    }
    setChoiceCallback(callback) {
      this._choiceCallback = callback;
    }
    onChoice(n) {
      if (this._choiceCallback) {
        this._choiceCallback(n);
        this._choiceCallback = null;
      }
    }
    hasText() {
      return this._texts.length > 0;
    }
    isChoice() {
      return this._choices.length > 0;
    }
    isNumberInput() {
      return this._numInputVariableId > 0;
    }
    isItemChoice() {
      return this._itemChoiceVariableId > 0;
    }
    isBusy() {
      return this.hasText() || this.isChoice() || this.isNumberInput() || this.isItemChoice();
    }
    newPage() {
      if (this._texts.length > 0) {
        this._texts[this._texts.length - 1] += "\f";
      }
    }
    allText() {
      return this._texts.join("\n");
    }
  };
  var Game_Message_default = Game_Message;

  // src-www/js/rpg_objects/Game_Switches.js
  var Game_Switches = class {
    constructor(...args) {
      this.initialize(...args);
    }
    initialize() {
      this.clear();
    }
    clear() {
      this._data = [];
    }
    value(switchId) {
      return !!this._data[switchId];
    }
    setValue(switchId, value3) {
      if (switchId > 0 && switchId < self.$dataSystem.switches.length) {
        this._data[switchId] = value3;
        this.onChange();
      }
    }
    onChange() {
      self.$gameMap.requestRefresh();
    }
  };
  var Game_Switches_default = Game_Switches;

  // src-www/js/rpg_objects/Game_Variables.js
  var Game_Variables = class {
    constructor(...args) {
      this.initialize(...args);
    }
    initialize() {
      this.clear();
    }
    clear() {
      this._data = [];
    }
    value(variableId) {
      return this._data[variableId] || 0;
    }
    setValue(variableId, value3) {
      if (variableId > 0 && variableId < self.$dataSystem.variables.length) {
        if (typeof value3 === "number") {
          value3 = Math.floor(value3);
        }
        this._data[variableId] = value3;
        this.onChange();
      }
    }
    onChange() {
      self.$gameMap.requestRefresh();
    }
  };
  var Game_Variables_default = Game_Variables;

  // src-www/js/rpg_objects/Game_SelfSwitches.js
  var Game_SelfSwitches = class {
    constructor(...args) {
      this.initialize(...args);
    }
    initialize() {
      this.clear();
    }
    clear() {
      this._data = {};
    }
    value(key) {
      return !!this._data[key];
    }
    setValue(key, value3) {
      if (value3) {
        this._data[key] = true;
      } else {
        delete this._data[key];
      }
      this.onChange();
    }
    onChange() {
      self.$gameMap.requestRefresh();
    }
  };
  var Game_SelfSwitches_default = Game_SelfSwitches;

  // src-www/js/rpg_objects/Game_BattlerBase.js
  var Game_BattlerBase = class {
    constructor(...args) {
      this.initialize(...args);
    }
    initialize() {
      this.initMembers();
    }
    initMembers() {
      this._hp = 1;
      this._mp = 0;
      this._tp = 0;
      this._hidden = false;
      this.clearParamPlus();
      this.clearStates();
      this.clearBuffs();
    }
    clearParamPlus() {
      this._paramPlus = [0, 0, 0, 0, 0, 0, 0, 0];
    }
    clearStates() {
      this._states = [];
      this._stateTurns = {};
    }
    eraseState(stateId) {
      const index = this._states.indexOf(stateId);
      if (index >= 0) {
        this._states.splice(index, 1);
      }
      delete this._stateTurns[stateId];
    }
    isStateAffected(stateId) {
      return this._states.contains(stateId);
    }
    isDeathStateAffected() {
      return this.isStateAffected(this.deathStateId());
    }
    deathStateId() {
      return 1;
    }
    resetStateCounts(stateId) {
      const state = self.$dataStates[stateId];
      const variance = 1 + Math.max(state.maxTurns - state.minTurns, 0);
      this._stateTurns[stateId] = state.minTurns + Math.randomInt(variance);
    }
    isStateExpired(stateId) {
      return this._stateTurns[stateId] === 0;
    }
    updateStateTurns() {
      this._states.forEach(function(stateId) {
        if (this._stateTurns[stateId] > 0) {
          this._stateTurns[stateId]--;
        }
      }, this);
    }
    clearBuffs() {
      this._buffs = [0, 0, 0, 0, 0, 0, 0, 0];
      this._buffTurns = [0, 0, 0, 0, 0, 0, 0, 0];
    }
    eraseBuff(paramId) {
      this._buffs[paramId] = 0;
      this._buffTurns[paramId] = 0;
    }
    buffLength() {
      return this._buffs.length;
    }
    buff(paramId) {
      return this._buffs[paramId];
    }
    isBuffAffected(paramId) {
      return this._buffs[paramId] > 0;
    }
    isDebuffAffected(paramId) {
      return this._buffs[paramId] < 0;
    }
    isBuffOrDebuffAffected(paramId) {
      return this._buffs[paramId] !== 0;
    }
    isMaxBuffAffected(paramId) {
      return this._buffs[paramId] === 2;
    }
    isMaxDebuffAffected(paramId) {
      return this._buffs[paramId] === -2;
    }
    increaseBuff(paramId) {
      if (!this.isMaxBuffAffected(paramId)) {
        this._buffs[paramId]++;
      }
    }
    decreaseBuff(paramId) {
      if (!this.isMaxDebuffAffected(paramId)) {
        this._buffs[paramId]--;
      }
    }
    overwriteBuffTurns(paramId, turns) {
      if (this._buffTurns[paramId] < turns) {
        this._buffTurns[paramId] = turns;
      }
    }
    isBuffExpired(paramId) {
      return this._buffTurns[paramId] === 0;
    }
    updateBuffTurns() {
      for (let i = 0; i < this._buffTurns.length; i++) {
        if (this._buffTurns[i] > 0) {
          this._buffTurns[i]--;
        }
      }
    }
    die() {
      this._hp = 0;
      this.clearStates();
      this.clearBuffs();
    }
    revive() {
      if (this._hp === 0) {
        this._hp = 1;
      }
    }
    states() {
      return this._states.map((id) => self.$dataStates[id]);
    }
    stateIcons() {
      return this.states().map(({ iconIndex }) => iconIndex).filter((iconIndex) => iconIndex > 0);
    }
    buffIcons() {
      const icons = [];
      for (let i = 0; i < this._buffs.length; i++) {
        if (this._buffs[i] !== 0) {
          icons.push(this.buffIconIndex(this._buffs[i], i));
        }
      }
      return icons;
    }
    buffIconIndex(buffLevel, paramId) {
      if (buffLevel > 0) {
        return Game_BattlerBase.ICON_BUFF_START + (buffLevel - 1) * 8 + paramId;
      } else if (buffLevel < 0) {
        return Game_BattlerBase.ICON_DEBUFF_START + (-buffLevel - 1) * 8 + paramId;
      } else {
        return 0;
      }
    }
    allIcons() {
      return this.stateIcons().concat(this.buffIcons());
    }
    traitObjects() {
      return this.states();
    }
    allTraits() {
      return this.traitObjects().reduce((r, { traits }) => r.concat(traits), []);
    }
    traits(code) {
      return this.allTraits().filter((trait) => trait.code === code);
    }
    traitsWithId(code, id) {
      return this.allTraits().filter(
        (trait) => trait.code === code && trait.dataId === id
      );
    }
    traitsPi(code, id) {
      return this.traitsWithId(code, id).reduce((r, { value: value3 }) => r * value3, 1);
    }
    traitsSum(code, id) {
      return this.traitsWithId(code, id).reduce((r, { value: value3 }) => r + value3, 0);
    }
    traitsSumAll(code) {
      return this.traits(code).reduce((r, { value: value3 }) => r + value3, 0);
    }
    traitsSet(code) {
      return this.traits(code).reduce((r, { dataId }) => r.concat(dataId), []);
    }
    paramBase(paramId) {
      return 0;
    }
    paramPlus(paramId) {
      return this._paramPlus[paramId];
    }
    paramMin(paramId) {
      if (paramId === 1) {
        return 0;
      } else {
        return 1;
      }
    }
    paramMax(paramId) {
      if (paramId === 0) {
        return 999999;
      } else if (paramId === 1) {
        return 9999;
      } else {
        return 999;
      }
    }
    paramRate(paramId) {
      return this.traitsPi(Game_BattlerBase.TRAIT_PARAM, paramId);
    }
    paramBuffRate(paramId) {
      return this._buffs[paramId] * 0.25 + 1;
    }
    param(paramId) {
      let value3 = this.paramBase(paramId) + this.paramPlus(paramId);
      value3 *= this.paramRate(paramId) * this.paramBuffRate(paramId);
      const maxValue = this.paramMax(paramId);
      const minValue = this.paramMin(paramId);
      return Math.round(value3.clamp(minValue, maxValue));
    }
    xparam(xparamId) {
      return this.traitsSum(Game_BattlerBase.TRAIT_XPARAM, xparamId);
    }
    sparam(sparamId) {
      return this.traitsPi(Game_BattlerBase.TRAIT_SPARAM, sparamId);
    }
    elementRate(elementId) {
      return this.traitsPi(Game_BattlerBase.TRAIT_ELEMENT_RATE, elementId);
    }
    debuffRate(paramId) {
      return this.traitsPi(Game_BattlerBase.TRAIT_DEBUFF_RATE, paramId);
    }
    stateRate(stateId) {
      return this.traitsPi(Game_BattlerBase.TRAIT_STATE_RATE, stateId);
    }
    stateResistSet() {
      return this.traitsSet(Game_BattlerBase.TRAIT_STATE_RESIST);
    }
    isStateResist(stateId) {
      return this.stateResistSet().contains(stateId);
    }
    attackElements() {
      return this.traitsSet(Game_BattlerBase.TRAIT_ATTACK_ELEMENT);
    }
    attackStates() {
      return this.traitsSet(Game_BattlerBase.TRAIT_ATTACK_STATE);
    }
    attackStatesRate(stateId) {
      return this.traitsSum(Game_BattlerBase.TRAIT_ATTACK_STATE, stateId);
    }
    attackSpeed() {
      return this.traitsSumAll(Game_BattlerBase.TRAIT_ATTACK_SPEED);
    }
    attackTimesAdd() {
      return Math.max(this.traitsSumAll(Game_BattlerBase.TRAIT_ATTACK_TIMES), 0);
    }
    addedSkillTypes() {
      return this.traitsSet(Game_BattlerBase.TRAIT_STYPE_ADD);
    }
    isSkillTypeSealed(stypeId) {
      return this.traitsSet(Game_BattlerBase.TRAIT_STYPE_SEAL).contains(stypeId);
    }
    addedSkills() {
      return this.traitsSet(Game_BattlerBase.TRAIT_SKILL_ADD);
    }
    isSkillSealed(skillId) {
      return this.traitsSet(Game_BattlerBase.TRAIT_SKILL_SEAL).contains(skillId);
    }
    isEquipWtypeOk(wtypeId) {
      return this.traitsSet(Game_BattlerBase.TRAIT_EQUIP_WTYPE).contains(wtypeId);
    }
    isEquipAtypeOk(atypeId) {
      return this.traitsSet(Game_BattlerBase.TRAIT_EQUIP_ATYPE).contains(atypeId);
    }
    isEquipTypeLocked(etypeId) {
      return this.traitsSet(Game_BattlerBase.TRAIT_EQUIP_LOCK).contains(etypeId);
    }
    isEquipTypeSealed(etypeId) {
      return this.traitsSet(Game_BattlerBase.TRAIT_EQUIP_SEAL).contains(etypeId);
    }
    slotType() {
      const set = this.traitsSet(Game_BattlerBase.TRAIT_SLOT_TYPE);
      return set.length > 0 ? Math.max.apply(null, set) : 0;
    }
    isDualWield() {
      return this.slotType() === 1;
    }
    actionPlusSet() {
      return this.traits(Game_BattlerBase.TRAIT_ACTION_PLUS).map(
        ({ value: value3 }) => value3
      );
    }
    specialFlag(flagId) {
      return this.traits(Game_BattlerBase.TRAIT_SPECIAL_FLAG).some(
        ({ dataId }) => dataId === flagId
      );
    }
    collapseType() {
      const set = this.traitsSet(Game_BattlerBase.TRAIT_COLLAPSE_TYPE);
      return set.length > 0 ? Math.max.apply(null, set) : 0;
    }
    partyAbility(abilityId) {
      return this.traits(Game_BattlerBase.TRAIT_PARTY_ABILITY).some(
        ({ dataId }) => dataId === abilityId
      );
    }
    isAutoBattle() {
      return this.specialFlag(Game_BattlerBase.FLAG_ID_AUTO_BATTLE);
    }
    isGuard() {
      return this.specialFlag(Game_BattlerBase.FLAG_ID_GUARD) && this.canMove();
    }
    isSubstitute() {
      return this.specialFlag(Game_BattlerBase.FLAG_ID_SUBSTITUTE) && this.canMove();
    }
    isPreserveTp() {
      return this.specialFlag(Game_BattlerBase.FLAG_ID_PRESERVE_TP);
    }
    addParam(paramId, value3) {
      this._paramPlus[paramId] += value3;
      this.refresh();
    }
    setHp(hp) {
      this._hp = hp;
      this.refresh();
    }
    setMp(mp) {
      this._mp = mp;
      this.refresh();
    }
    setTp(tp) {
      this._tp = tp;
      this.refresh();
    }
    maxTp() {
      return 100;
    }
    refresh() {
      this.stateResistSet().forEach(function(stateId) {
        this.eraseState(stateId);
      }, this);
      this._hp = this._hp.clamp(0, this.mhp);
      this._mp = this._mp.clamp(0, this.mmp);
      this._tp = this._tp.clamp(0, this.maxTp());
    }
    recoverAll() {
      this.clearStates();
      this._hp = this.mhp;
      this._mp = this.mmp;
    }
    hpRate() {
      return this.hp / this.mhp;
    }
    mpRate() {
      return this.mmp > 0 ? this.mp / this.mmp : 0;
    }
    tpRate() {
      return this.tp / this.maxTp();
    }
    hide() {
      this._hidden = true;
    }
    appear() {
      this._hidden = false;
    }
    isHidden() {
      return this._hidden;
    }
    isAppeared() {
      return !this.isHidden();
    }
    isDead() {
      return this.isAppeared() && this.isDeathStateAffected();
    }
    isAlive() {
      return this.isAppeared() && !this.isDeathStateAffected();
    }
    isDying() {
      return this.isAlive() && this._hp < this.mhp / 4;
    }
    isRestricted() {
      return this.isAppeared() && this.restriction() > 0;
    }
    canInput() {
      return this.isAppeared() && !this.isRestricted() && !this.isAutoBattle();
    }
    canMove() {
      return this.isAppeared() && this.restriction() < 4;
    }
    isConfused() {
      return this.isAppeared() && this.restriction() >= 1 && this.restriction() <= 3;
    }
    confusionLevel() {
      return this.isConfused() ? this.restriction() : 0;
    }
    isActor() {
      return false;
    }
    isEnemy() {
      return false;
    }
    sortStates() {
      this._states.sort((a2, b2) => {
        const p1 = self.$dataStates[a2].priority;
        const p2 = self.$dataStates[b2].priority;
        if (p1 !== p2) {
          return p2 - p1;
        }
        return a2 - b2;
      });
    }
    restriction() {
      return Math.max.apply(
        null,
        this.states().map(({ restriction }) => restriction).concat(0)
      );
    }
    addNewState(stateId, source) {
      if (stateId === this.deathStateId()) {
        this.die();
      }
      const restricted = this.isRestricted();
      this._states.push(stateId);
      this.sortStates();
      if (!restricted && this.isRestricted()) {
        this.onRestrict();
      }
    }
    onRestrict() {
    }
    mostImportantStateText() {
      const states = this.states();
      for (let i = 0; i < states.length; i++) {
        if (states[i].message3) {
          return states[i].message3;
        }
      }
      return "";
    }
    stateMotionIndex() {
      const states = this.states();
      if (states.length > 0) {
        return states[0].motion;
      } else {
        return 0;
      }
    }
    stateOverlayIndex() {
      const states = this.states();
      if (states.length > 0) {
        return states[0].overlay;
      } else {
        return 0;
      }
    }
    isSkillWtypeOk(skill) {
      return true;
    }
    skillMpCost({ mpCost }) {
      return Math.floor(mpCost * this.mcr);
    }
    skillTpCost({ tpCost }) {
      return tpCost;
    }
    canPaySkillCost(skill) {
      return this._tp >= this.skillTpCost(skill) && this._mp >= this.skillMpCost(skill);
    }
    paySkillCost(skill) {
      this._mp -= this.skillMpCost(skill);
      this._tp -= this.skillTpCost(skill);
    }
    isOccasionOk({ occasion }) {
      if (self.$gameParty.inBattle()) {
        return occasion === 0 || occasion === 1;
      } else {
        return occasion === 0 || occasion === 2;
      }
    }
    meetsUsableItemConditions(item2) {
      return this.canMove() && this.isOccasionOk(item2);
    }
    meetsSkillConditions(skill) {
      return this.meetsUsableItemConditions(skill) && this.isSkillWtypeOk(skill) && this.canPaySkillCost(skill) && !this.isSkillSealed(skill.id) && !this.isSkillTypeSealed(skill.stypeId);
    }
    meetsItemConditions(item2) {
      return this.meetsUsableItemConditions(item2) && self.$gameParty.hasItem(item2);
    }
    canUse(item2) {
      if (!item2) {
        return false;
      } else if (DataManager.isSkill(item2)) {
        return this.meetsSkillConditions(item2);
      } else if (DataManager.isItem(item2)) {
        return this.meetsItemConditions(item2);
      } else {
        return false;
      }
    }
    canEquip(item2) {
      if (!item2) {
        return false;
      } else if (DataManager.isWeapon(item2)) {
        return this.canEquipWeapon(item2);
      } else if (DataManager.isArmor(item2)) {
        return this.canEquipArmor(item2);
      } else {
        return false;
      }
    }
    canEquipWeapon({ wtypeId, etypeId }) {
      return this.isEquipWtypeOk(wtypeId) && !this.isEquipTypeSealed(etypeId);
    }
    canEquipArmor({ atypeId, etypeId }) {
      return this.isEquipAtypeOk(atypeId) && !this.isEquipTypeSealed(etypeId);
    }
    attackSkillId() {
      return 1;
    }
    guardSkillId() {
      return 2;
    }
    canAttack() {
      return this.canUse(self.$dataSkills[this.attackSkillId()]);
    }
    canGuard() {
      return this.canUse(self.$dataSkills[this.guardSkillId()]);
    }
  };
  Game_BattlerBase.TRAIT_ELEMENT_RATE = 11;
  Game_BattlerBase.TRAIT_DEBUFF_RATE = 12;
  Game_BattlerBase.TRAIT_STATE_RATE = 13;
  Game_BattlerBase.TRAIT_STATE_RESIST = 14;
  Game_BattlerBase.TRAIT_PARAM = 21;
  Game_BattlerBase.TRAIT_XPARAM = 22;
  Game_BattlerBase.TRAIT_SPARAM = 23;
  Game_BattlerBase.TRAIT_ATTACK_ELEMENT = 31;
  Game_BattlerBase.TRAIT_ATTACK_STATE = 32;
  Game_BattlerBase.TRAIT_ATTACK_SPEED = 33;
  Game_BattlerBase.TRAIT_ATTACK_TIMES = 34;
  Game_BattlerBase.TRAIT_STYPE_ADD = 41;
  Game_BattlerBase.TRAIT_STYPE_SEAL = 42;
  Game_BattlerBase.TRAIT_SKILL_ADD = 43;
  Game_BattlerBase.TRAIT_SKILL_SEAL = 44;
  Game_BattlerBase.TRAIT_EQUIP_WTYPE = 51;
  Game_BattlerBase.TRAIT_EQUIP_ATYPE = 52;
  Game_BattlerBase.TRAIT_EQUIP_LOCK = 53;
  Game_BattlerBase.TRAIT_EQUIP_SEAL = 54;
  Game_BattlerBase.TRAIT_SLOT_TYPE = 55;
  Game_BattlerBase.TRAIT_ACTION_PLUS = 61;
  Game_BattlerBase.TRAIT_SPECIAL_FLAG = 62;
  Game_BattlerBase.TRAIT_COLLAPSE_TYPE = 63;
  Game_BattlerBase.TRAIT_PARTY_ABILITY = 64;
  Game_BattlerBase.FLAG_ID_AUTO_BATTLE = 0;
  Game_BattlerBase.FLAG_ID_GUARD = 1;
  Game_BattlerBase.FLAG_ID_SUBSTITUTE = 2;
  Game_BattlerBase.FLAG_ID_PRESERVE_TP = 3;
  Game_BattlerBase.ICON_BUFF_START = 32;
  Game_BattlerBase.ICON_DEBUFF_START = 48;
  Object.defineProperties(Game_BattlerBase.prototype, {
    // Hit Points
    hp: {
      get() {
        return this._hp;
      },
      configurable: true
    },
    // Magic Points
    mp: {
      get() {
        return this._mp;
      },
      configurable: true
    },
    // Tactical Points
    tp: {
      get() {
        return this._tp;
      },
      configurable: true
    },
    // Maximum Hit Points
    mhp: {
      get() {
        return this.param(0);
      },
      configurable: true
    },
    // Maximum Magic Points
    mmp: {
      get() {
        return this.param(1);
      },
      configurable: true
    },
    // ATtacK power
    atk: {
      get() {
        return this.param(2);
      },
      configurable: true
    },
    // DEFense power
    def: {
      get() {
        return this.param(3);
      },
      configurable: true
    },
    // Magic ATtack power
    mat: {
      get() {
        return this.param(4);
      },
      configurable: true
    },
    // Magic DeFense power
    mdf: {
      get() {
        return this.param(5);
      },
      configurable: true
    },
    // AGIlity
    agi: {
      get() {
        return this.param(6);
      },
      configurable: true
    },
    // LUcK
    luk: {
      get() {
        return this.param(7);
      },
      configurable: true
    },
    // HIT rate
    hit: {
      get() {
        return this.xparam(0);
      },
      configurable: true
    },
    // EVAsion rate
    eva: {
      get() {
        return this.xparam(1);
      },
      configurable: true
    },
    // CRItical rate
    cri: {
      get() {
        return this.xparam(2);
      },
      configurable: true
    },
    // Critical EVasion rate
    cev: {
      get() {
        return this.xparam(3);
      },
      configurable: true
    },
    // Magic EVasion rate
    mev: {
      get() {
        return this.xparam(4);
      },
      configurable: true
    },
    // Magic ReFlection rate
    mrf: {
      get() {
        return this.xparam(5);
      },
      configurable: true
    },
    // CouNTer attack rate
    cnt: {
      get() {
        return this.xparam(6);
      },
      configurable: true
    },
    // Hp ReGeneration rate
    hrg: {
      get() {
        return this.xparam(7);
      },
      configurable: true
    },
    // Mp ReGeneration rate
    mrg: {
      get() {
        return this.xparam(8);
      },
      configurable: true
    },
    // Tp ReGeneration rate
    trg: {
      get() {
        return this.xparam(9);
      },
      configurable: true
    },
    // TarGet Rate
    tgr: {
      get() {
        return this.sparam(0);
      },
      configurable: true
    },
    // GuaRD effect rate
    grd: {
      get() {
        return this.sparam(1);
      },
      configurable: true
    },
    // RECovery effect rate
    rec: {
      get() {
        return this.sparam(2);
      },
      configurable: true
    },
    // PHArmacology
    pha: {
      get() {
        return this.sparam(3);
      },
      configurable: true
    },
    // Mp Cost Rate
    mcr: {
      get() {
        return this.sparam(4);
      },
      configurable: true
    },
    // Tp Charge Rate
    tcr: {
      get() {
        return this.sparam(5);
      },
      configurable: true
    },
    // Physical Damage Rate
    pdr: {
      get() {
        return this.sparam(6);
      },
      configurable: true
    },
    // Magical Damage Rate
    mdr: {
      get() {
        return this.sparam(7);
      },
      configurable: true
    },
    // Floor Damage Rate
    fdr: {
      get() {
        return this.sparam(8);
      },
      configurable: true
    },
    // EXperience Rate
    exr: {
      get() {
        return this.sparam(9);
      },
      configurable: true
    }
  });
  var Game_BattlerBase_default = Game_BattlerBase;

  // src-www/js/rpg_objects/Game_ActionResult.js
  var Game_ActionResult = class {
    constructor(...args) {
      this.initialize(...args);
    }
    initialize() {
      this.clear();
    }
    clear() {
      this.used = false;
      this.missed = false;
      this.evaded = false;
      this.physical = false;
      this.drain = false;
      this.critical = false;
      this.success = false;
      this.hpAffected = false;
      this.hpDamage = 0;
      this.mpDamage = 0;
      this.tpDamage = 0;
      this.addedStates = [];
      this.removedStates = [];
      this.addedBuffs = [];
      this.addedDebuffs = [];
      this.removedBuffs = [];
    }
    addedStateObjects() {
      return this.addedStates.map((id) => self.$dataStates[id]);
    }
    removedStateObjects() {
      return this.removedStates.map((id) => self.$dataStates[id]);
    }
    isStatusAffected() {
      return this.addedStates.length > 0 || this.removedStates.length > 0 || this.addedBuffs.length > 0 || this.addedDebuffs.length > 0 || this.removedBuffs.length > 0;
    }
    isHit() {
      return this.used && !this.missed && !this.evaded;
    }
    isStateAdded(stateId) {
      return this.addedStates.contains(stateId);
    }
    pushAddedState(stateId) {
      if (!this.isStateAdded(stateId)) {
        this.addedStates.push(stateId);
      }
    }
    isStateRemoved(stateId) {
      return this.removedStates.contains(stateId);
    }
    pushRemovedState(stateId) {
      if (!this.isStateRemoved(stateId)) {
        this.removedStates.push(stateId);
      }
    }
    isBuffAdded(paramId) {
      return this.addedBuffs.contains(paramId);
    }
    pushAddedBuff(paramId) {
      if (!this.isBuffAdded(paramId)) {
        this.addedBuffs.push(paramId);
      }
    }
    isDebuffAdded(paramId) {
      return this.addedDebuffs.contains(paramId);
    }
    pushAddedDebuff(paramId) {
      if (!this.isDebuffAdded(paramId)) {
        this.addedDebuffs.push(paramId);
      }
    }
    isBuffRemoved(paramId) {
      return this.removedBuffs.contains(paramId);
    }
    pushRemovedBuff(paramId) {
      if (!this.isBuffRemoved(paramId)) {
        this.removedBuffs.push(paramId);
      }
    }
  };
  var Game_ActionResult_default = Game_ActionResult;

  // src-www/js/rpg_objects/Game_Battler.js
  var Game_Battler = class extends Game_BattlerBase_default {
    constructor(...args) {
      super(...args);
      this.initialize(...args);
    }
    initialize() {
      super.initialize();
    }
    initMembers() {
      super.initMembers();
      this._actions = [];
      this._speed = 0;
      this._result = new Game_ActionResult_default();
      this._actionState = "";
      this._lastTargetIndex = 0;
      this._animations = [];
      this._damagePopup = false;
      this._effectType = null;
      this._motionType = null;
      this._weaponImageId = 0;
      this._motionRefresh = false;
      this._selected = false;
    }
    clearAnimations() {
      this._animations = [];
    }
    clearDamagePopup() {
      this._damagePopup = false;
    }
    clearWeaponAnimation() {
      this._weaponImageId = 0;
    }
    clearEffect() {
      this._effectType = null;
    }
    clearMotion() {
      this._motionType = null;
      this._motionRefresh = false;
    }
    requestEffect(effectType) {
      this._effectType = effectType;
    }
    requestMotion(motionType) {
      this._motionType = motionType;
    }
    requestMotionRefresh() {
      this._motionRefresh = true;
    }
    select() {
      this._selected = true;
    }
    deselect() {
      this._selected = false;
    }
    isAnimationRequested() {
      return this._animations.length > 0;
    }
    isDamagePopupRequested() {
      return this._damagePopup;
    }
    isEffectRequested() {
      return !!this._effectType;
    }
    isMotionRequested() {
      return !!this._motionType;
    }
    isWeaponAnimationRequested() {
      return this._weaponImageId > 0;
    }
    isMotionRefreshRequested() {
      return this._motionRefresh;
    }
    isSelected() {
      return this._selected;
    }
    effectType() {
      return this._effectType;
    }
    motionType() {
      return this._motionType;
    }
    weaponImageId() {
      return this._weaponImageId;
    }
    shiftAnimation() {
      return this._animations.shift();
    }
    startAnimation(animationId, mirror, delay) {
      const data = {
        animationId,
        mirror,
        delay
      };
      this._animations.push(data);
    }
    startDamagePopup() {
      this._damagePopup = true;
    }
    startWeaponAnimation(weaponImageId) {
      this._weaponImageId = weaponImageId;
    }
    action(index) {
      return this._actions[index];
    }
    setAction(index, action) {
      this._actions[index] = action;
    }
    numActions() {
      return this._actions.length;
    }
    clearActions() {
      this._actions = [];
    }
    result() {
      return this._result;
    }
    clearResult() {
      this._result.clear();
    }
    refresh() {
      super.refresh();
      if (this.hp === 0) {
        this.addState(this.deathStateId());
      } else {
        this.removeState(this.deathStateId());
      }
    }
    onApplyDamage(action, target2, value3) {
    }
    onReceiveDamage(action, source, value3) {
    }
    onHitAction(action, target2) {
    }
    onEvadeAction(action, source) {
    }
    onApplyCritical(action, target2, value3) {
    }
    onReceiveCritical(action, source, value3) {
    }
    addState(stateId, source) {
      if (this.isStateAddable(stateId)) {
        if (!this.isStateAffected(stateId)) {
          this.addNewState(stateId, source);
          this.refresh();
        }
        if (source)
          source.onApplyStateSuccess(stateId, this);
        this.resetStateCounts(stateId);
        this._result.pushAddedState(stateId);
      } else {
        if (source)
          source.onApplyStateFailure(stateId, this);
      }
    }
    onApplyStateSuccess(stateId, target2) {
    }
    onApplyStateFailure(stateId, target2) {
    }
    isStateAddable(stateId) {
      return this.isAlive() && self.$dataStates[stateId] && !this.isStateResist(stateId) && !this._result.isStateRemoved(stateId) && !this.isStateRestrict(stateId);
    }
    isStateRestrict(stateId) {
      return self.$dataStates[stateId].removeByRestriction && this.isRestricted();
    }
    onRestrict() {
      super.onRestrict();
      this.clearActions();
      this.states().forEach(function({ removeByRestriction, id }) {
        if (removeByRestriction) {
          this.removeState(id);
        }
      }, this);
    }
    removeState(stateId) {
      if (this.isStateAffected(stateId)) {
        if (stateId === this.deathStateId()) {
          this.revive();
        }
        this.eraseState(stateId);
        this.refresh();
        this._result.pushRemovedState(stateId);
      }
    }
    escape() {
      if (self.$gameParty.inBattle()) {
        this.hide();
      }
      this.clearActions();
      this.clearStates();
      SoundManager_default.playEscape();
    }
    addBuff(paramId, turns) {
      if (this.isAlive()) {
        this.increaseBuff(paramId);
        if (this.isBuffAffected(paramId)) {
          this.overwriteBuffTurns(paramId, turns);
        }
        this._result.pushAddedBuff(paramId);
        this.refresh();
      }
    }
    addDebuff(paramId, turns) {
      if (this.isAlive()) {
        this.decreaseBuff(paramId);
        if (this.isDebuffAffected(paramId)) {
          this.overwriteBuffTurns(paramId, turns);
        }
        this._result.pushAddedDebuff(paramId);
        this.refresh();
      }
    }
    removeBuff(paramId) {
      if (this.isAlive() && this.isBuffOrDebuffAffected(paramId)) {
        this.eraseBuff(paramId);
        this._result.pushRemovedBuff(paramId);
        this.refresh();
      }
    }
    removeBattleStates() {
      this.states().forEach(function({ removeAtBattleEnd, id }) {
        if (removeAtBattleEnd) {
          this.removeState(id);
        }
      }, this);
    }
    removeAllBuffs() {
      for (let i = 0; i < this.buffLength(); i++) {
        this.removeBuff(i);
      }
    }
    removeStatesAuto(timing) {
      this.states().forEach(function({ id, autoRemovalTiming }) {
        if (this.isStateExpired(id) && autoRemovalTiming === timing) {
          this.removeState(id);
        }
      }, this);
    }
    removeBuffsAuto() {
      for (let i = 0; i < this.buffLength(); i++) {
        if (this.isBuffExpired(i)) {
          this.removeBuff(i);
        }
      }
    }
    removeStatesByDamage() {
      this.states().forEach(function({ removeByDamage, chanceByDamage, id }) {
        if (removeByDamage && Math.randomInt(100) < chanceByDamage) {
          this.removeState(id);
        }
      }, this);
    }
    makeActionTimes() {
      return this.actionPlusSet().reduce(
        (r, p) => Math.random() < p ? r + 1 : r,
        1
      );
    }
    makeActions() {
      this.clearActions();
      if (this.canMove()) {
        const actionTimes = this.makeActionTimes();
        this._actions = [];
        for (let i = 0; i < actionTimes; i++) {
          this._actions.push(new Game_Action_default(this));
        }
      }
    }
    speed() {
      return this._speed;
    }
    makeSpeed() {
      this._speed = Math.min.apply(
        null,
        this._actions.map((action) => action.speed())
      ) || 0;
    }
    currentAction() {
      return this._actions[0];
    }
    removeCurrentAction() {
      this._actions.shift();
    }
    setLastTarget(target2) {
      if (target2) {
        this._lastTargetIndex = target2.index();
      } else {
        this._lastTargetIndex = 0;
      }
    }
    forceAction(skillId, targetIndex) {
      this.clearActions();
      const action = new Game_Action_default(this, true);
      action.setSkill(skillId);
      if (targetIndex === -2) {
        action.setTarget(this._lastTargetIndex);
      } else if (targetIndex === -1) {
        action.decideRandomTarget();
      } else {
        action.setTarget(targetIndex);
      }
      this._actions.push(action);
    }
    useItem(item2) {
      if (DataManager.isSkill(item2)) {
        this.paySkillCost(item2);
      } else if (DataManager.isItem(item2)) {
        this.consumeItem(item2);
      }
    }
    consumeItem(item2) {
      self.$gameParty.consumeItem(item2);
    }
    gainHp(value3) {
      this._result.hpDamage = -value3;
      this._result.hpAffected = true;
      this.setHp(this.hp + value3);
    }
    gainMp(value3) {
      this._result.mpDamage = -value3;
      this.setMp(this.mp + value3);
    }
    gainTp(value3) {
      this._result.tpDamage = -value3;
      this.setTp(this.tp + value3);
    }
    gainSilentTp(value3) {
      this.setTp(this.tp + value3);
    }
    initTp() {
      this.setTp(Math.randomInt(25));
    }
    clearTp() {
      this.setTp(0);
    }
    chargeTpByDamage(damageRate) {
      const value3 = Math.floor(50 * damageRate * this.tcr);
      this.gainSilentTp(value3);
    }
    regenerateHp() {
      let value3 = Math.floor(this.mhp * this.hrg);
      value3 = Math.max(value3, -this.maxSlipDamage());
      if (value3 !== 0) {
        this.gainHp(value3);
      }
    }
    maxSlipDamage() {
      return self.$dataSystem.optSlipDeath ? this.hp : Math.max(this.hp - 1, 0);
    }
    regenerateMp() {
      const value3 = Math.floor(this.mmp * this.mrg);
      if (value3 !== 0) {
        this.gainMp(value3);
      }
    }
    regenerateTp() {
      const value3 = Math.floor(100 * this.trg);
      this.gainSilentTp(value3);
    }
    regenerateAll() {
      if (this.isAlive()) {
        this.regenerateHp();
        this.regenerateMp();
        this.regenerateTp();
      }
    }
    onBattleStart() {
      this.setActionState("undecided");
      this.clearMotion();
      if (!this.isPreserveTp()) {
        this.initTp();
      }
    }
    onAllActionsEnd() {
      this.clearResult();
      this.removeStatesAuto(1);
      this.removeBuffsAuto();
    }
    onTurnEnd() {
      this.clearResult();
      this.regenerateAll();
      if (!BattleManager_default.isForcedTurn()) {
        this.updateStateTurns();
        this.updateBuffTurns();
      }
      this.removeStatesAuto(2);
    }
    onBattleEnd() {
      this.clearResult();
      this.removeBattleStates();
      this.removeAllBuffs();
      this.clearActions();
      if (!this.isPreserveTp()) {
        this.clearTp();
      }
      this.appear();
    }
    onDamage(value3) {
      this.removeStatesByDamage();
      this.chargeTpByDamage(value3 / this.mhp);
    }
    setActionState(actionState) {
      this._actionState = actionState;
      this.requestMotionRefresh();
    }
    isUndecided() {
      return this._actionState === "undecided";
    }
    isInputting() {
      return this._actionState === "inputting";
    }
    isWaiting() {
      return this._actionState === "waiting";
    }
    isActing() {
      return this._actionState === "acting";
    }
    isChanting() {
      if (this.isWaiting()) {
        return this._actions.some((action) => action.isMagicSkill());
      }
      return false;
    }
    isGuardWaiting() {
      if (this.isWaiting()) {
        return this._actions.some((action) => action.isGuard());
      }
      return false;
    }
    performActionStart(action) {
      if (!action.isGuard()) {
        this.setActionState("acting");
      }
    }
    performAction(action) {
    }
    performActionEnd() {
      this.setActionState("done");
    }
    performDamage() {
    }
    performMiss() {
      SoundManager_default.playMiss();
    }
    performRecovery() {
      SoundManager_default.playRecovery();
    }
    performEvasion() {
      SoundManager_default.playEvasion();
    }
    performMagicEvasion() {
      SoundManager_default.playMagicEvasion();
    }
    performCounter() {
      SoundManager_default.playEvasion();
    }
    performReflection() {
      SoundManager_default.playReflection();
    }
    performSubstitute(target2) {
    }
    performCollapse() {
    }
  };
  var Game_Battler_default = Game_Battler;

  // src-www/js/rpg_objects/Game_Actor.js
  var Game_Actor = class extends Game_Battler_default {
    constructor(...args) {
      super(...args);
      this.initialize(...args);
    }
    get level() {
      return this._level;
    }
    initialize(actorId) {
      super.initialize();
      this.setup(actorId);
    }
    initMembers() {
      super.initMembers();
      this._actorId = 0;
      this._name = "";
      this._nickname = "";
      this._classId = 0;
      this._level = 0;
      this._characterName = "";
      this._characterIndex = 0;
      this._faceName = "";
      this._faceIndex = 0;
      this._battlerName = "";
      this._exp = {};
      this._skills = [];
      this._equips = [];
      this._actionInputIndex = 0;
      this._lastMenuSkill = new Game_Item_default();
      this._lastBattleSkill = new Game_Item_default();
      this._lastCommandSymbol = "";
    }
    setup(actorId) {
      const actor2 = self.$dataActors[actorId];
      this._actorId = actorId;
      this._name = actor2.name;
      this._nickname = actor2.nickname;
      this._profile = actor2.profile;
      this._classId = actor2.classId;
      this._level = actor2.initialLevel;
      this.initImages();
      this.initExp();
      this.initSkills();
      this.initEquips(actor2.equips);
      this.clearParamPlus();
      this.recoverAll();
    }
    actorId() {
      return this._actorId;
    }
    actor() {
      return self.$dataActors[this._actorId];
    }
    name() {
      return this._name;
    }
    setName(name) {
      this._name = name;
    }
    nickname() {
      return this._nickname;
    }
    setNickname(nickname) {
      this._nickname = nickname;
    }
    profile() {
      return this._profile;
    }
    setProfile(profile) {
      this._profile = profile;
    }
    characterName() {
      return this._characterName;
    }
    characterIndex() {
      return this._characterIndex;
    }
    faceName() {
      return this._faceName;
    }
    faceIndex() {
      return this._faceIndex;
    }
    battlerName() {
      return this._battlerName;
    }
    clearStates() {
      super.clearStates();
      this._stateSteps = {};
    }
    eraseState(stateId) {
      super.eraseState(stateId);
      delete this._stateSteps[stateId];
    }
    resetStateCounts(stateId) {
      super.resetStateCounts(stateId);
      this._stateSteps[stateId] = self.$dataStates[stateId].stepsToRemove;
    }
    initImages() {
      const actor2 = this.actor();
      this._characterName = actor2.characterName;
      this._characterIndex = actor2.characterIndex;
      this._faceName = actor2.faceName;
      this._faceIndex = actor2.faceIndex;
      this._battlerName = actor2.battlerName;
    }
    expForLevel(level) {
      const c = this.currentClass();
      const basis = c.expParams[0];
      const extra = c.expParams[1];
      const acc_a = c.expParams[2];
      const acc_b = c.expParams[3];
      return Math.round(
        basis * Math.pow(level - 1, 0.9 + acc_a / 250) * level * (level + 1) / (6 + Math.pow(level, 2) / 50 / acc_b) + (level - 1) * extra
      );
    }
    initExp() {
      this._exp[this._classId] = this.currentLevelExp();
    }
    currentExp() {
      return this._exp[this._classId];
    }
    currentLevelExp() {
      return this.expForLevel(this._level);
    }
    nextLevelExp() {
      return this.expForLevel(this._level + 1);
    }
    nextRequiredExp() {
      return this.nextLevelExp() - this.currentExp();
    }
    maxLevel() {
      return this.actor().maxLevel;
    }
    isMaxLevel() {
      return this._level >= this.maxLevel();
    }
    initSkills() {
      this._skills = [];
      this.currentClass().learnings.forEach(function({ level, skillId }) {
        if (level <= this._level) {
          this.learnSkill(skillId);
        }
      }, this);
    }
    initEquips(equips) {
      const slots = this.equipSlots();
      const maxSlots = slots.length;
      this._equips = [];
      for (let i = 0; i < maxSlots; i++) {
        this._equips[i] = new Game_Item_default();
      }
      for (let j = 0; j < equips.length; j++) {
        if (j < maxSlots) {
          this._equips[j].setEquip(slots[j] === 1, equips[j]);
        }
      }
      this.releaseUnequippableItems(true);
      this.refresh();
    }
    equipSlots() {
      const slots = [];
      for (let i = 1; i < self.$dataSystem.equipTypes.length; i++) {
        slots.push(i);
      }
      if (slots.length >= 2 && this.isDualWield()) {
        slots[1] = 1;
      }
      return slots;
    }
    equips() {
      return this._equips.map((item2) => item2.object());
    }
    weapons() {
      return this.equips().filter((item2) => item2 && DataManager.isWeapon(item2));
    }
    armors() {
      return this.equips().filter((item2) => item2 && DataManager.isArmor(item2));
    }
    hasWeapon(weapon) {
      return this.weapons().contains(weapon);
    }
    hasArmor(armor) {
      return this.armors().contains(armor);
    }
    isEquipChangeOk(slotId) {
      return !this.isEquipTypeLocked(this.equipSlots()[slotId]) && !this.isEquipTypeSealed(this.equipSlots()[slotId]);
    }
    changeEquip(slotId, item2) {
      if (this.tradeItemWithParty(item2, this.equips()[slotId]) && (!item2 || this.equipSlots()[slotId] === item2.etypeId)) {
        this._equips[slotId].setObject(item2);
        this.refresh();
      }
    }
    forceChangeEquip(slotId, item2) {
      this._equips[slotId].setObject(item2);
      this.releaseUnequippableItems(true);
      this.refresh();
    }
    tradeItemWithParty(newItem, oldItem) {
      if (newItem && !self.$gameParty.hasItem(newItem)) {
        return false;
      } else {
        self.$gameParty.gainItem(oldItem, 1);
        self.$gameParty.loseItem(newItem, 1);
        return true;
      }
    }
    changeEquipById(etypeId, itemId) {
      const slotId = etypeId - 1;
      if (this.equipSlots()[slotId] === 1) {
        this.changeEquip(slotId, self.$dataWeapons[itemId]);
      } else {
        this.changeEquip(slotId, self.$dataArmors[itemId]);
      }
    }
    isEquipped(item2) {
      return this.equips().contains(item2);
    }
    discardEquip(item2) {
      const slotId = this.equips().indexOf(item2);
      if (slotId >= 0) {
        this._equips[slotId].setObject(null);
      }
    }
    releaseUnequippableItems(forcing) {
      for (; ; ) {
        const slots = this.equipSlots();
        const equips = this.equips();
        let changed = false;
        equips.forEach((item2, i) => {
          if (item2 && (!this.canEquip(item2) || item2.etypeId !== slots[i])) {
            if (!forcing) {
              this.tradeItemWithParty(null, item2);
            }
            this._equips[i].setObject(null);
            changed = true;
          }
        });
        if (!changed) {
          break;
        }
      }
    }
    clearEquipments() {
      const maxSlots = this.equipSlots().length;
      for (let i = 0; i < maxSlots; i++) {
        if (this.isEquipChangeOk(i)) {
          this.changeEquip(i, null);
        }
      }
    }
    optimizeEquipments() {
      const maxSlots = this.equipSlots().length;
      this.clearEquipments();
      for (let i = 0; i < maxSlots; i++) {
        if (this.isEquipChangeOk(i)) {
          this.changeEquip(i, this.bestEquipItem(i));
        }
      }
    }
    bestEquipItem(slotId) {
      const etypeId = this.equipSlots()[slotId];
      const items = self.$gameParty.equipItems().filter(function(item2) {
        return item2.etypeId === etypeId && this.canEquip(item2);
      }, this);
      let bestItem = null;
      let bestPerformance = -1e3;
      for (let i = 0; i < items.length; i++) {
        const performance2 = this.calcEquipItemPerformance(items[i]);
        if (performance2 > bestPerformance) {
          bestPerformance = performance2;
          bestItem = items[i];
        }
      }
      return bestItem;
    }
    calcEquipItemPerformance({ params: params2 }) {
      return params2.reduce((a2, b2) => a2 + b2);
    }
    isSkillWtypeOk({ requiredWtypeId1, requiredWtypeId2 }) {
      const wtypeId1 = requiredWtypeId1;
      const wtypeId2 = requiredWtypeId2;
      if (wtypeId1 === 0 && wtypeId2 === 0 || wtypeId1 > 0 && this.isWtypeEquipped(wtypeId1) || wtypeId2 > 0 && this.isWtypeEquipped(wtypeId2)) {
        return true;
      } else {
        return false;
      }
    }
    isWtypeEquipped(wtypeId) {
      return this.weapons().some((weapon) => weapon.wtypeId === wtypeId);
    }
    refresh() {
      this.releaseUnequippableItems(false);
      super.refresh();
    }
    isActor() {
      return true;
    }
    friendsUnit() {
      return self.$gameParty;
    }
    opponentsUnit() {
      return self.$gameTroop;
    }
    index() {
      return self.$gameParty.members().indexOf(this);
    }
    isBattleMember() {
      return self.$gameParty.battleMembers().contains(this);
    }
    isFormationChangeOk() {
      return true;
    }
    currentClass() {
      return self.$dataClasses[this._classId];
    }
    isClass(gameClass) {
      return gameClass && this._classId === gameClass.id;
    }
    skills() {
      const list = [];
      this._skills.concat(this.addedSkills()).forEach((id) => {
        if (!list.contains(self.$dataSkills[id])) {
          list.push(self.$dataSkills[id]);
        }
      });
      return list;
    }
    usableSkills() {
      return this.skills().filter(function(skill) {
        return this.canUse(skill);
      }, this);
    }
    traitObjects() {
      let objects = Game_Battler_default.prototype.traitObjects.call(this);
      objects = objects.concat([this.actor(), this.currentClass()]);
      const equips = this.equips();
      for (const item2 of equips) {
        if (item2) {
          objects.push(item2);
        }
      }
      return objects;
    }
    attackElements() {
      const set = Game_Battler_default.prototype.attackElements.call(this);
      if (this.hasNoWeapons() && !set.contains(this.bareHandsElementId())) {
        set.push(this.bareHandsElementId());
      }
      return set;
    }
    hasNoWeapons() {
      return this.weapons().length === 0;
    }
    bareHandsElementId() {
      return 1;
    }
    paramMax(paramId) {
      if (paramId === 0) {
        return 9999;
      }
      return Game_Battler_default.prototype.paramMax.call(this, paramId);
    }
    paramBase(paramId) {
      return this.currentClass().params[paramId][this._level];
    }
    paramPlus(paramId) {
      let value3 = Game_Battler_default.prototype.paramPlus.call(this, paramId);
      const equips = this.equips();
      for (const item2 of equips) {
        if (item2) {
          value3 += item2.params[paramId];
        }
      }
      return value3;
    }
    attackAnimationId1() {
      if (this.hasNoWeapons()) {
        return this.bareHandsAnimationId();
      } else {
        const weapons = this.weapons();
        return weapons[0] ? weapons[0].animationId : 0;
      }
    }
    attackAnimationId2() {
      const weapons = this.weapons();
      return weapons[1] ? weapons[1].animationId : 0;
    }
    bareHandsAnimationId() {
      return 1;
    }
    changeExp(exp, show) {
      this._exp[this._classId] = Math.max(exp, 0);
      const lastLevel = this._level;
      const lastSkills = this.skills();
      while (!this.isMaxLevel() && this.currentExp() >= this.nextLevelExp()) {
        this.levelUp();
      }
      while (this.currentExp() < this.currentLevelExp()) {
        this.levelDown();
      }
      if (show && this._level > lastLevel) {
        this.displayLevelUp(this.findNewSkills(lastSkills));
      }
      this.refresh();
    }
    levelUp() {
      this._level++;
      this.currentClass().learnings.forEach(function({ level, skillId }) {
        if (level === this._level) {
          this.learnSkill(skillId);
        }
      }, this);
    }
    levelDown() {
      this._level--;
    }
    findNewSkills(lastSkills) {
      const newSkills = this.skills();
      for (let i = 0; i < lastSkills.length; i++) {
        const index = newSkills.indexOf(lastSkills[i]);
        if (index >= 0) {
          newSkills.splice(index, 1);
        }
      }
      return newSkills;
    }
    displayLevelUp(newSkills) {
      const text = TextManager_default.levelUp.format(
        this._name,
        TextManager_default.level,
        this._level
      );
      self.$gameMessage.newPage();
      self.$gameMessage.add(text);
      newSkills.forEach(({ name }) => {
        self.$gameMessage.add(TextManager_default.obtainSkill.format(name));
      });
    }
    gainExp(exp) {
      const newExp = this.currentExp() + Math.round(exp * this.finalExpRate());
      this.changeExp(newExp, this.shouldDisplayLevelUp());
    }
    finalExpRate() {
      return this.exr * (this.isBattleMember() ? 1 : this.benchMembersExpRate());
    }
    benchMembersExpRate() {
      return self.$dataSystem.optExtraExp ? 1 : 0;
    }
    shouldDisplayLevelUp() {
      return true;
    }
    changeLevel(level, show) {
      level = level.clamp(1, this.maxLevel());
      this.changeExp(this.expForLevel(level), show);
    }
    learnSkill(skillId) {
      if (!this.isLearnedSkill(skillId)) {
        this._skills.push(skillId);
        this._skills.sort((a2, b2) => a2 - b2);
      }
    }
    forgetSkill(skillId) {
      const index = this._skills.indexOf(skillId);
      if (index >= 0) {
        this._skills.splice(index, 1);
      }
    }
    isLearnedSkill(skillId) {
      return this._skills.contains(skillId);
    }
    hasSkill(skillId) {
      return this.skills().contains(self.$dataSkills[skillId]);
    }
    changeClass(classId, keepExp) {
      if (keepExp) {
        this._exp[classId] = this.currentExp();
      }
      this._classId = classId;
      this.changeExp(this._exp[this._classId] || 0, false);
      this.refresh();
    }
    setCharacterImage(characterName, characterIndex) {
      this._characterName = characterName;
      this._characterIndex = characterIndex;
    }
    setFaceImage(faceName, faceIndex) {
      this._faceName = faceName;
      this._faceIndex = faceIndex;
    }
    setBattlerImage(battlerName) {
      this._battlerName = battlerName;
    }
    isSpriteVisible() {
      return self.$gameSystem.isSideView();
    }
    startAnimation(animationId, mirror, delay) {
      mirror = !mirror;
      super.startAnimation(animationId, mirror, delay);
    }
    performActionStart(action) {
      super.performActionStart(action);
    }
    performAction(action) {
      super.performAction(action);
      if (action.isAttack()) {
        this.performAttack();
      } else if (action.isGuard()) {
        this.requestMotion("guard");
      } else if (action.isMagicSkill()) {
        this.requestMotion("spell");
      } else if (action.isSkill()) {
        this.requestMotion("skill");
      } else if (action.isItem()) {
        this.requestMotion("item");
      }
    }
    performActionEnd() {
      super.performActionEnd();
    }
    performAttack() {
      const weapons = this.weapons();
      const wtypeId = weapons[0] ? weapons[0].wtypeId : 0;
      const attackMotion = self.$dataSystem.attackMotions[wtypeId];
      if (attackMotion) {
        if (attackMotion.type === 0) {
          this.requestMotion("thrust");
        } else if (attackMotion.type === 1) {
          this.requestMotion("swing");
        } else if (attackMotion.type === 2) {
          this.requestMotion("missile");
        }
        this.startWeaponAnimation(attackMotion.weaponImageId);
      }
    }
    performDamage() {
      super.performDamage();
      if (this.isSpriteVisible()) {
        this.requestMotion("damage");
      } else {
        self.$gameScreen.startShake(5, 5, 10);
      }
      SoundManager_default.playActorDamage();
    }
    performEvasion() {
      super.performEvasion();
      this.requestMotion("evade");
    }
    performMagicEvasion() {
      super.performMagicEvasion();
      this.requestMotion("evade");
    }
    performCounter() {
      super.performCounter();
      this.performAttack();
    }
    performCollapse() {
      super.performCollapse();
      if (self.$gameParty.inBattle()) {
        SoundManager_default.playActorCollapse();
      }
    }
    performVictory() {
      if (this.canMove()) {
        this.requestMotion("victory");
      }
    }
    performEscape() {
      if (this.canMove()) {
        this.requestMotion("escape");
      }
    }
    makeActionList() {
      const list = [];
      let action = new Game_Action_default(this);
      action.setAttack();
      list.push(action);
      this.usableSkills().forEach(function({ id }) {
        action = new Game_Action_default(this);
        action.setSkill(id);
        list.push(action);
      }, this);
      return list;
    }
    makeAutoBattleActions() {
      for (let i = 0; i < this.numActions(); i++) {
        const list = this.makeActionList();
        let maxValue = Number.MIN_VALUE;
        for (let j = 0; j < list.length; j++) {
          const value3 = list[j].evaluate();
          if (value3 > maxValue) {
            maxValue = value3;
            this.setAction(i, list[j]);
          }
        }
      }
      this.setActionState("waiting");
    }
    makeConfusionActions() {
      for (let i = 0; i < this.numActions(); i++) {
        this.action(i).setConfusion();
      }
      this.setActionState("waiting");
    }
    makeActions() {
      super.makeActions();
      if (this.numActions() > 0) {
        this.setActionState("undecided");
      } else {
        this.setActionState("waiting");
      }
      if (this.isAutoBattle()) {
        this.makeAutoBattleActions();
      } else if (this.isConfused()) {
        this.makeConfusionActions();
      }
    }
    onPlayerWalk() {
      this.clearResult();
      this.checkFloorEffect();
      if (self.$gamePlayer.isNormal()) {
        this.turnEndOnMap();
        this.states().forEach(function(state) {
          this.updateStateSteps(state);
        }, this);
        this.showAddedStates();
        this.showRemovedStates();
      }
    }
    updateStateSteps({ removeByWalking, id }) {
      if (removeByWalking) {
        if (this._stateSteps[id] > 0) {
          if (--this._stateSteps[id] === 0) {
            this.removeState(id);
          }
        }
      }
    }
    showAddedStates() {
      this.result().addedStateObjects().forEach(function({ message1 }) {
        if (message1) {
          self.$gameMessage.add(this._name + message1);
        }
      }, this);
    }
    showRemovedStates() {
      this.result().removedStateObjects().forEach(function({ message4 }) {
        if (message4) {
          self.$gameMessage.add(this._name + message4);
        }
      }, this);
    }
    stepsForTurn() {
      return 20;
    }
    turnEndOnMap() {
      if (self.$gameParty.steps() % this.stepsForTurn() === 0) {
        this.onTurnEnd();
        if (this.result().hpDamage > 0) {
          this.performMapDamage();
        }
      }
    }
    checkFloorEffect() {
      if (self.$gamePlayer.isOnDamageFloor()) {
        this.executeFloorDamage();
      }
    }
    executeFloorDamage() {
      let damage = Math.floor(this.basicFloorDamage() * this.fdr);
      damage = Math.min(damage, this.maxFloorDamage());
      this.gainHp(-damage);
      if (damage > 0) {
        this.performMapDamage();
      }
    }
    basicFloorDamage() {
      return 10;
    }
    maxFloorDamage() {
      return self.$dataSystem.optFloorDeath ? this.hp : Math.max(this.hp - 1, 0);
    }
    performMapDamage() {
      if (!self.$gameParty.inBattle()) {
        self.$gameScreen.startFlashForDamage();
      }
    }
    clearActions() {
      super.clearActions();
      this._actionInputIndex = 0;
    }
    inputtingAction() {
      return this.action(this._actionInputIndex);
    }
    selectNextCommand() {
      if (this._actionInputIndex < this.numActions() - 1) {
        this._actionInputIndex++;
        return true;
      } else {
        return false;
      }
    }
    selectPreviousCommand() {
      if (this._actionInputIndex > 0) {
        this._actionInputIndex--;
        return true;
      } else {
        return false;
      }
    }
    lastMenuSkill() {
      return this._lastMenuSkill.object();
    }
    setLastMenuSkill(skill) {
      this._lastMenuSkill.setObject(skill);
    }
    lastBattleSkill() {
      return this._lastBattleSkill.object();
    }
    setLastBattleSkill(skill) {
      this._lastBattleSkill.setObject(skill);
    }
    lastCommandSymbol() {
      return this._lastCommandSymbol;
    }
    setLastCommandSymbol(symbol) {
      this._lastCommandSymbol = symbol;
    }
    testEscape({ effects }) {
      return effects.some(
        (effect, index, ar) => effect && effect.code === Game_Action_default.EFFECT_SPECIAL
      );
    }
    meetsUsableItemConditions(item2) {
      if (self.$gameParty.inBattle() && !BattleManager_default.canEscape() && this.testEscape(item2)) {
        return false;
      }
      return Game_BattlerBase_default.prototype.meetsUsableItemConditions.call(
        this,
        item2
      );
    }
  };
  var Game_Actor_default = Game_Actor;

  // src-www/js/rpg_objects/Game_Actors.js
  var Game_Actors = class {
    constructor(...args) {
      this.initialize(...args);
    }
    initialize() {
      this._data = [];
    }
    actor(actorId) {
      if (self.$dataActors[actorId]) {
        if (!this._data[actorId]) {
          this._data[actorId] = new Game_Actor_default(actorId);
        }
        return this._data[actorId];
      }
      return null;
    }
  };
  var Game_Actors_default = Game_Actors;

  // src-www/js/rpg_objects/Game_Unit.js
  var Game_Unit = class {
    constructor(...args) {
      this.initialize(...args);
    }
    initialize() {
      this._inBattle = false;
    }
    inBattle() {
      return this._inBattle;
    }
    members() {
      return [];
    }
    aliveMembers() {
      return this.members().filter((member) => member.isAlive());
    }
    deadMembers() {
      return this.members().filter((member) => member.isDead());
    }
    movableMembers() {
      return this.members().filter((member) => member.canMove());
    }
    clearActions() {
      return this.members().forEach((member) => member.clearActions());
    }
    agility() {
      const members = this.members();
      if (members.length === 0) {
        return 1;
      }
      const sum = members.reduce((r, { agi }) => r + agi, 0);
      return sum / members.length;
    }
    tgrSum() {
      return this.aliveMembers().reduce((r, { tgr }) => r + tgr, 0);
    }
    randomTarget() {
      let tgrRand = Math.random() * this.tgrSum();
      let target2 = null;
      this.aliveMembers().forEach((member) => {
        tgrRand -= member.tgr;
        if (tgrRand <= 0 && !target2) {
          target2 = member;
        }
      });
      return target2;
    }
    randomDeadTarget() {
      const members = this.deadMembers();
      if (members.length === 0) {
        return null;
      }
      return members[Math.floor(Math.random() * members.length)];
    }
    smoothTarget(index) {
      if (index < 0) {
        index = 0;
      }
      const member = this.members()[index];
      return member && member.isAlive() ? member : this.aliveMembers()[0];
    }
    smoothDeadTarget(index) {
      if (index < 0) {
        index = 0;
      }
      const member = this.members()[index];
      return member && member.isDead() ? member : this.deadMembers()[0];
    }
    clearResults() {
      this.members().forEach((member) => {
        member.clearResult();
      });
    }
    onBattleStart() {
      this.members().forEach((member) => {
        member.onBattleStart();
      });
      this._inBattle = true;
    }
    onBattleEnd() {
      this._inBattle = false;
      this.members().forEach((member) => {
        member.onBattleEnd();
      });
    }
    makeActions() {
      this.members().forEach((member) => {
        member.makeActions();
      });
    }
    select(activeMember) {
      this.members().forEach((member) => {
        if (member === activeMember) {
          member.select();
        } else {
          member.deselect();
        }
      });
    }
    isAllDead() {
      return this.aliveMembers().length === 0;
    }
    substituteBattler() {
      const members = this.members();
      for (let i = 0; i < members.length; i++) {
        if (members[i].isSubstitute()) {
          return members[i];
        }
      }
    }
  };
  var Game_Unit_default = Game_Unit;

  // src-www/js/rpg_objects/Game_Party.js
  var Game_Party = class extends Game_Unit_default {
    constructor(...args) {
      super(...args);
      this.initialize(...args);
    }
    initialize() {
      super.initialize();
      this._gold = 0;
      this._steps = 0;
      this._lastItem = new Game_Item_default();
      this._menuActorId = 0;
      this._targetActorId = 0;
      this._actors = [];
      this.initAllItems();
    }
    initAllItems() {
      this._items = {};
      this._weapons = {};
      this._armors = {};
    }
    exists() {
      return this._actors.length > 0;
    }
    size() {
      return this.members().length;
    }
    isEmpty() {
      return this.size() === 0;
    }
    members() {
      return this.inBattle() ? this.battleMembers() : this.allMembers();
    }
    allMembers() {
      return this._actors.map((id) => self.$gameActors.actor(id));
    }
    battleMembers() {
      return this.allMembers().slice(0, this.maxBattleMembers()).filter((actor2) => actor2.isAppeared());
    }
    maxBattleMembers() {
      return 4;
    }
    leader() {
      return this.battleMembers()[0];
    }
    reviveBattleMembers() {
      this.battleMembers().forEach((actor2) => {
        if (actor2.isDead()) {
          actor2.setHp(1);
        }
      });
    }
    items() {
      const list = [];
      for (let id in this._items) {
        list.push(self.$dataItems[id]);
      }
      return list;
    }
    weapons() {
      const list = [];
      for (let id in this._weapons) {
        list.push(self.$dataWeapons[id]);
      }
      return list;
    }
    armors() {
      const list = [];
      for (let id in this._armors) {
        list.push(self.$dataArmors[id]);
      }
      return list;
    }
    equipItems() {
      return this.weapons().concat(this.armors());
    }
    allItems() {
      return this.items().concat(this.equipItems());
    }
    itemContainer(item2) {
      if (!item2) {
        return null;
      } else if (DataManager.isItem(item2)) {
        return this._items;
      } else if (DataManager.isWeapon(item2)) {
        return this._weapons;
      } else if (DataManager.isArmor(item2)) {
        return this._armors;
      } else {
        return null;
      }
    }
    setupStartingMembers() {
      this._actors = [];
      self.$dataSystem.partyMembers.forEach(function(actorId) {
        if (self.$gameActors.actor(actorId)) {
          this._actors.push(actorId);
        }
      }, this);
    }
    name() {
      const numBattleMembers = this.battleMembers().length;
      if (numBattleMembers === 0) {
        return "";
      } else if (numBattleMembers === 1) {
        return this.leader().name();
      } else {
        return TextManager_default.partyName.format(this.leader().name());
      }
    }
    setupBattleTest() {
      this.setupBattleTestMembers();
      this.setupBattleTestItems();
    }
    setupBattleTestMembers() {
      self.$dataSystem.testBattlers.forEach(
        function({
          actorId,
          level,
          equips
        }) {
          const actor2 = self.$gameActors.actor(actorId);
          if (actor2) {
            actor2.changeLevel(level, false);
            actor2.initEquips(equips);
            actor2.recoverAll();
            this.addActor(actorId);
          }
        },
        this
      );
    }
    setupBattleTestItems() {
      self.$dataItems.forEach(function(item2) {
        if (item2 && item2.name.length > 0) {
          this.gainItem(item2, this.maxItems(item2));
        }
      }, this);
    }
    highestLevel() {
      return Math.max.apply(
        null,
        this.members().map(({ level }) => level)
      );
    }
    addActor(actorId) {
      if (!this._actors.contains(actorId)) {
        this._actors.push(actorId);
        self.$gamePlayer.refresh();
        self.$gameMap.requestRefresh();
      }
    }
    removeActor(actorId) {
      if (this._actors.contains(actorId)) {
        this._actors.splice(this._actors.indexOf(actorId), 1);
        self.$gamePlayer.refresh();
        self.$gameMap.requestRefresh();
      }
    }
    gold() {
      return this._gold;
    }
    gainGold(amount) {
      this._gold = (this._gold + amount).clamp(0, this.maxGold());
    }
    loseGold(amount) {
      this.gainGold(-amount);
    }
    maxGold() {
      return 99999999;
    }
    steps() {
      return this._steps;
    }
    increaseSteps() {
      this._steps++;
    }
    numItems(item2) {
      const container = this.itemContainer(item2);
      return container ? container[item2.id] || 0 : 0;
    }
    maxItems(item2) {
      return 99;
    }
    hasMaxItems(item2) {
      return this.numItems(item2) >= this.maxItems(item2);
    }
    hasItem(item2, includeEquip) {
      if (includeEquip === void 0) {
        includeEquip = false;
      }
      if (this.numItems(item2) > 0) {
        return true;
      } else if (includeEquip && this.isAnyMemberEquipped(item2)) {
        return true;
      } else {
        return false;
      }
    }
    isAnyMemberEquipped(item2) {
      return this.members().some((actor2) => actor2.equips().contains(item2));
    }
    gainItem(item2, amount, includeEquip) {
      const container = this.itemContainer(item2);
      if (container) {
        const lastNumber = this.numItems(item2);
        const newNumber = lastNumber + amount;
        container[item2.id] = newNumber.clamp(0, this.maxItems(item2));
        if (container[item2.id] === 0) {
          delete container[item2.id];
        }
        if (includeEquip && newNumber < 0) {
          this.discardMembersEquip(item2, -newNumber);
        }
        self.$gameMap.requestRefresh();
      }
    }
    discardMembersEquip(item2, amount) {
      let n = amount;
      this.members().forEach((actor2) => {
        while (n > 0 && actor2.isEquipped(item2)) {
          actor2.discardEquip(item2);
          n--;
        }
      });
    }
    loseItem(item2, amount, includeEquip) {
      this.gainItem(item2, -amount, includeEquip);
    }
    consumeItem(item2) {
      if (DataManager.isItem(item2) && item2.consumable) {
        this.loseItem(item2, 1);
      }
    }
    canUse(item2) {
      return this.members().some((actor2) => actor2.canUse(item2));
    }
    canInput() {
      return this.members().some((actor2) => actor2.canInput());
    }
    isAllDead() {
      if (Game_Unit_default.prototype.isAllDead.call(this)) {
        return this.inBattle() || !this.isEmpty();
      } else {
        return false;
      }
    }
    onPlayerWalk() {
      this.members().forEach((actor2) => actor2.onPlayerWalk());
    }
    menuActor() {
      let actor2 = self.$gameActors.actor(this._menuActorId);
      if (!this.members().contains(actor2)) {
        actor2 = this.members()[0];
      }
      return actor2;
    }
    setMenuActor(actor2) {
      this._menuActorId = actor2.actorId();
    }
    makeMenuActorNext() {
      let index = this.members().indexOf(this.menuActor());
      if (index >= 0) {
        index = (index + 1) % this.members().length;
        this.setMenuActor(this.members()[index]);
      } else {
        this.setMenuActor(this.members()[0]);
      }
    }
    makeMenuActorPrevious() {
      let index = this.members().indexOf(this.menuActor());
      if (index >= 0) {
        index = (index + this.members().length - 1) % this.members().length;
        this.setMenuActor(this.members()[index]);
      } else {
        this.setMenuActor(this.members()[0]);
      }
    }
    targetActor() {
      let actor2 = self.$gameActors.actor(this._targetActorId);
      if (!this.members().contains(actor2)) {
        actor2 = this.members()[0];
      }
      return actor2;
    }
    setTargetActor(actor2) {
      this._targetActorId = actor2.actorId();
    }
    lastItem() {
      return this._lastItem.object();
    }
    setLastItem(item2) {
      this._lastItem.setObject(item2);
    }
    swapOrder(index1, index2) {
      const temp = this._actors[index1];
      this._actors[index1] = this._actors[index2];
      this._actors[index2] = temp;
      self.$gamePlayer.refresh();
    }
    charactersForSavefile() {
      return this.battleMembers().map((actor2) => [
        actor2.characterName(),
        actor2.characterIndex()
      ]);
    }
    facesForSavefile() {
      return this.battleMembers().map((actor2) => [
        actor2.faceName(),
        actor2.faceIndex()
      ]);
    }
    partyAbility(abilityId) {
      return this.battleMembers().some((actor2) => actor2.partyAbility(abilityId));
    }
    hasEncounterHalf() {
      return this.partyAbility(Game_Party.ABILITY_ENCOUNTER_HALF);
    }
    hasEncounterNone() {
      return this.partyAbility(Game_Party.ABILITY_ENCOUNTER_NONE);
    }
    hasCancelSurprise() {
      return this.partyAbility(Game_Party.ABILITY_CANCEL_SURPRISE);
    }
    hasRaisePreemptive() {
      return this.partyAbility(Game_Party.ABILITY_RAISE_PREEMPTIVE);
    }
    hasGoldDouble() {
      return this.partyAbility(Game_Party.ABILITY_GOLD_DOUBLE);
    }
    hasDropItemDouble() {
      return this.partyAbility(Game_Party.ABILITY_DROP_ITEM_DOUBLE);
    }
    ratePreemptive(troopAgi) {
      let rate = this.agility() >= troopAgi ? 0.05 : 0.03;
      if (this.hasRaisePreemptive()) {
        rate *= 4;
      }
      return rate;
    }
    rateSurprise(troopAgi) {
      let rate = this.agility() >= troopAgi ? 0.03 : 0.05;
      if (this.hasCancelSurprise()) {
        rate = 0;
      }
      return rate;
    }
    performVictory() {
      this.members().forEach((actor2) => {
        actor2.performVictory();
      });
    }
    performEscape() {
      this.members().forEach((actor2) => {
        actor2.performEscape();
      });
    }
    removeBattleStates() {
      this.members().forEach((actor2) => {
        actor2.removeBattleStates();
      });
    }
    requestMotionRefresh() {
      this.members().forEach((actor2) => {
        actor2.requestMotionRefresh();
      });
    }
  };
  Game_Party.ABILITY_ENCOUNTER_HALF = 0;
  Game_Party.ABILITY_ENCOUNTER_NONE = 1;
  Game_Party.ABILITY_CANCEL_SURPRISE = 2;
  Game_Party.ABILITY_RAISE_PREEMPTIVE = 3;
  Game_Party.ABILITY_GOLD_DOUBLE = 4;
  Game_Party.ABILITY_DROP_ITEM_DOUBLE = 5;
  var Game_Party_default = Game_Party;

  // src-www/js/rpg_objects/Game_Enemy.js
  var Game_Enemy = class extends Game_Battler_default {
    constructor(...args) {
      super(...args);
      this.initialize(...args);
    }
    initialize(enemyId, x, y) {
      super.initialize();
      this.setup(enemyId, x, y);
    }
    initMembers() {
      super.initMembers();
      this._enemyId = 0;
      this._letter = "";
      this._plural = false;
      this._screenX = 0;
      this._screenY = 0;
    }
    setup(enemyId, x, y) {
      this._enemyId = enemyId;
      this._screenX = x;
      this._screenY = y;
      this.recoverAll();
    }
    isEnemy() {
      return true;
    }
    friendsUnit() {
      return self.$gameTroop;
    }
    opponentsUnit() {
      return self.$gameParty;
    }
    index() {
      return self.$gameTroop.members().indexOf(this);
    }
    isBattleMember() {
      return this.index() >= 0;
    }
    enemyId() {
      return this._enemyId;
    }
    enemy() {
      return self.$dataEnemies[this._enemyId];
    }
    traitObjects() {
      return Game_Battler_default.prototype.traitObjects.call(this).concat(this.enemy());
    }
    paramBase(paramId) {
      return this.enemy().params[paramId];
    }
    exp() {
      return this.enemy().exp;
    }
    gold() {
      return this.enemy().gold;
    }
    makeDropItems() {
      return this.enemy().dropItems.reduce((r, { kind, denominator, dataId }) => {
        if (kind > 0 && Math.random() * denominator < this.dropItemRate()) {
          return r.concat(this.itemObject(kind, dataId));
        } else {
          return r;
        }
      }, []);
    }
    dropItemRate() {
      return self.$gameParty.hasDropItemDouble() ? 2 : 1;
    }
    itemObject(kind, dataId) {
      if (kind === 1) {
        return self.$dataItems[dataId];
      } else if (kind === 2) {
        return self.$dataWeapons[dataId];
      } else if (kind === 3) {
        return self.$dataArmors[dataId];
      } else {
        return null;
      }
    }
    isSpriteVisible() {
      return true;
    }
    screenX() {
      return this._screenX;
    }
    screenY() {
      return this._screenY;
    }
    battlerName() {
      return this.enemy().battlerName;
    }
    battlerHue() {
      return this.enemy().battlerHue;
    }
    originalName() {
      return this.enemy().name;
    }
    name() {
      return this.originalName() + (this._plural ? this._letter : "");
    }
    isLetterEmpty() {
      return this._letter === "";
    }
    setLetter(letter) {
      this._letter = letter;
    }
    setPlural(plural) {
      this._plural = plural;
    }
    performActionStart(action) {
      super.performActionStart(action);
      this.requestEffect("whiten");
    }
    performAction(action) {
      super.performAction(action);
    }
    performActionEnd() {
      super.performActionEnd();
    }
    performDamage() {
      super.performDamage();
      SoundManager_default.playEnemyDamage();
      this.requestEffect("blink");
    }
    performCollapse() {
      super.performCollapse();
      switch (this.collapseType()) {
        case 0:
          this.requestEffect("collapse");
          SoundManager_default.playEnemyCollapse();
          break;
        case 1:
          this.requestEffect("bossCollapse");
          SoundManager_default.playBossCollapse1();
          break;
        case 2:
          this.requestEffect("instantCollapse");
          break;
      }
    }
    transform(enemyId) {
      const name = this.originalName();
      this._enemyId = enemyId;
      if (this.originalName() !== name) {
        this._letter = "";
        this._plural = false;
      }
      this.refresh();
      if (this.numActions() > 0) {
        this.makeActions();
      }
    }
    meetsCondition({ conditionParam1, conditionParam2, conditionType }) {
      const param1 = conditionParam1;
      const param2 = conditionParam2;
      switch (conditionType) {
        case 1:
          return this.meetsTurnCondition(param1, param2);
        case 2:
          return this.meetsHpCondition(param1, param2);
        case 3:
          return this.meetsMpCondition(param1, param2);
        case 4:
          return this.meetsStateCondition(param1);
        case 5:
          return this.meetsPartyLevelCondition(param1);
        case 6:
          return this.meetsSwitchCondition(param1);
        default:
          return true;
      }
    }
    meetsTurnCondition(param1, param2) {
      const n = self.$gameTroop.turnCount();
      if (param2 === 0) {
        return n === param1;
      } else {
        return n > 0 && n >= param1 && n % param2 === param1 % param2;
      }
    }
    meetsHpCondition(param1, param2) {
      return this.hpRate() >= param1 && this.hpRate() <= param2;
    }
    meetsMpCondition(param1, param2) {
      return this.mpRate() >= param1 && this.mpRate() <= param2;
    }
    meetsStateCondition(param) {
      return this.isStateAffected(param);
    }
    meetsPartyLevelCondition(param) {
      return self.$gameParty.highestLevel() >= param;
    }
    meetsSwitchCondition(param) {
      return self.$gameSwitches.value(param);
    }
    isActionValid(action) {
      return this.meetsCondition(action) && this.canUse(self.$dataSkills[action.skillId]);
    }
    selectAction(actionList, ratingZero) {
      const sum = actionList.reduce(
        (r, { rating }) => r + rating - ratingZero,
        0
      );
      if (sum > 0) {
        let value3 = Math.randomInt(sum);
        for (const action of actionList) {
          value3 -= action.rating - ratingZero;
          if (value3 < 0) {
            return action;
          }
        }
      } else {
        return null;
      }
    }
    selectAllActions(actionList) {
      const ratingMax = Math.max.apply(
        null,
        actionList.map(({ rating }) => rating)
      );
      const ratingZero = ratingMax - 3;
      actionList = actionList.filter(({ rating }) => rating > ratingZero);
      for (let i = 0; i < this.numActions(); i++) {
        this.action(i).setEnemyAction(this.selectAction(actionList, ratingZero));
      }
    }
    makeActions() {
      super.makeActions();
      if (this.numActions() > 0) {
        const actionList = this.enemy().actions.filter(function(a2) {
          return this.isActionValid(a2);
        }, this);
        if (actionList.length > 0) {
          this.selectAllActions(actionList);
        }
      }
      this.setActionState("waiting");
    }
  };
  var Game_Enemy_default = Game_Enemy;

  // src-www/js/rpg_objects/Game_CharacterBase.js
  var Game_CharacterBase = class {
    constructor(...args) {
      this.initialize(...args);
    }
    initialize() {
      this.initMembers();
    }
    initMembers() {
      this._x = 0;
      this._y = 0;
      this._realX = 0;
      this._realY = 0;
      this._moveSpeed = 4;
      this._moveFrequency = 6;
      this._opacity = 255;
      this._blendMode = 0;
      this._direction = 2;
      this._pattern = 1;
      this._priorityType = 1;
      this._tileId = 0;
      this._characterName = "";
      this._characterIndex = 0;
      this._isObjectCharacter = false;
      this._walkAnime = true;
      this._stepAnime = false;
      this._directionFix = false;
      this._through = false;
      this._transparent = false;
      this._bushDepth = 0;
      this._animationId = 0;
      this._balloonId = 0;
      this._animationPlaying = false;
      this._balloonPlaying = false;
      this._animationCount = 0;
      this._stopCount = 0;
      this._jumpCount = 0;
      this._jumpPeak = 0;
      this._movementSuccess = true;
    }
    pos(x, y) {
      return this._x === x && this._y === y;
    }
    posNt(x, y) {
      return this.pos(x, y) && !this.isThrough();
    }
    moveSpeed() {
      return this._moveSpeed;
    }
    setMoveSpeed(moveSpeed) {
      this._moveSpeed = moveSpeed;
    }
    moveFrequency() {
      return this._moveFrequency;
    }
    setMoveFrequency(moveFrequency) {
      this._moveFrequency = moveFrequency;
    }
    opacity() {
      return this._opacity;
    }
    setOpacity(opacity) {
      this._opacity = opacity;
    }
    blendMode() {
      return this._blendMode;
    }
    setBlendMode(blendMode) {
      this._blendMode = blendMode;
    }
    isNormalPriority() {
      return this._priorityType === 1;
    }
    setPriorityType(priorityType) {
      this._priorityType = priorityType;
    }
    isMoving() {
      return this._realX !== this._x || this._realY !== this._y;
    }
    isJumping() {
      return this._jumpCount > 0;
    }
    jumpHeight() {
      return (this._jumpPeak * this._jumpPeak - Math.pow(Math.abs(this._jumpCount - this._jumpPeak), 2)) / 2;
    }
    isStopping() {
      return !this.isMoving() && !this.isJumping();
    }
    checkStop(threshold) {
      return this._stopCount > threshold;
    }
    resetStopCount() {
      this._stopCount = 0;
    }
    realMoveSpeed() {
      return this._moveSpeed + (this.isDashing() ? 1 : 0);
    }
    distancePerFrame() {
      return Math.pow(2, this.realMoveSpeed()) / 256;
    }
    isDashing() {
      return false;
    }
    isDebugThrough() {
      return false;
    }
    straighten() {
      if (this.hasWalkAnime() || this.hasStepAnime()) {
        this._pattern = 1;
      }
      this._animationCount = 0;
    }
    reverseDir(d) {
      return 10 - d;
    }
    canPass(x, y, d) {
      const x2 = self.$gameMap.roundXWithDirection(x, d);
      const y2 = self.$gameMap.roundYWithDirection(y, d);
      if (!self.$gameMap.isValid(x2, y2)) {
        return false;
      }
      if (this.isThrough() || this.isDebugThrough()) {
        return true;
      }
      if (!this.isMapPassable(x, y, d)) {
        return false;
      }
      if (this.isCollidedWithCharacters(x2, y2)) {
        return false;
      }
      return true;
    }
    canPassDiagonally(x, y, horz, vert) {
      const x2 = self.$gameMap.roundXWithDirection(x, horz);
      const y2 = self.$gameMap.roundYWithDirection(y, vert);
      if (this.canPass(x, y, vert) && this.canPass(x, y2, horz)) {
        return true;
      }
      if (this.canPass(x, y, horz) && this.canPass(x2, y, vert)) {
        return true;
      }
      return false;
    }
    isMapPassable(x, y, d) {
      const x2 = self.$gameMap.roundXWithDirection(x, d);
      const y2 = self.$gameMap.roundYWithDirection(y, d);
      const d2 = this.reverseDir(d);
      return self.$gameMap.isPassable(x, y, d) && self.$gameMap.isPassable(x2, y2, d2);
    }
    isCollidedWithCharacters(x, y) {
      return this.isCollidedWithEvents(x, y) || this.isCollidedWithVehicles(x, y);
    }
    isCollidedWithEvents(x, y) {
      const events = self.$gameMap.eventsXyNt(x, y);
      return events.some((event) => event.isNormalPriority());
    }
    isCollidedWithVehicles(x, y) {
      return self.$gameMap.boat().posNt(x, y) || self.$gameMap.ship().posNt(x, y);
    }
    setPosition(x, y) {
      this._x = Math.round(x);
      this._y = Math.round(y);
      this._realX = x;
      this._realY = y;
    }
    copyPosition(character2) {
      this._x = character2._x;
      this._y = character2._y;
      this._realX = character2._realX;
      this._realY = character2._realY;
      this._direction = character2._direction;
    }
    locate(x, y) {
      this.setPosition(x, y);
      this.straighten();
      this.refreshBushDepth();
    }
    direction() {
      return this._direction;
    }
    setDirection(d) {
      if (!this.isDirectionFixed() && d) {
        this._direction = d;
      }
      this.resetStopCount();
    }
    isTile() {
      return this._tileId > 0 && this._priorityType === 0;
    }
    isObjectCharacter() {
      return this._isObjectCharacter;
    }
    shiftY() {
      return this.isObjectCharacter() ? 0 : 6;
    }
    scrolledX() {
      return self.$gameMap.adjustX(this._realX);
    }
    scrolledY() {
      return self.$gameMap.adjustY(this._realY);
    }
    screenX() {
      const tw = self.$gameMap.tileWidth();
      return Math.round(this.scrolledX() * tw + tw / 2);
    }
    screenY() {
      const th = self.$gameMap.tileHeight();
      return Math.round(
        this.scrolledY() * th + th - this.shiftY() - this.jumpHeight()
      );
    }
    screenZ() {
      return this._priorityType * 2 + 1;
    }
    isNearTheScreen() {
      const gw = Graphics_default.width;
      const gh = Graphics_default.height;
      const tw = self.$gameMap.tileWidth();
      const th = self.$gameMap.tileHeight();
      const px = this.scrolledX() * tw + tw / 2 - gw / 2;
      const py = this.scrolledY() * th + th / 2 - gh / 2;
      return px >= -gw && px <= gw && py >= -gh && py <= gh;
    }
    update() {
      if (this.isStopping()) {
        this.updateStop();
      }
      if (this.isJumping()) {
        this.updateJump();
      } else if (this.isMoving()) {
        this.updateMove();
      }
      this.updateAnimation();
    }
    updateStop() {
      this._stopCount++;
    }
    updateJump() {
      this._jumpCount--;
      this._realX = (this._realX * this._jumpCount + this._x) / (this._jumpCount + 1);
      this._realY = (this._realY * this._jumpCount + this._y) / (this._jumpCount + 1);
      this.refreshBushDepth();
      if (this._jumpCount === 0) {
        this._realX = this._x = self.$gameMap.roundX(this._x);
        this._realY = this._y = self.$gameMap.roundY(this._y);
      }
    }
    updateMove() {
      if (this._x < this._realX) {
        this._realX = Math.max(this._realX - this.distancePerFrame(), this._x);
      }
      if (this._x > this._realX) {
        this._realX = Math.min(this._realX + this.distancePerFrame(), this._x);
      }
      if (this._y < this._realY) {
        this._realY = Math.max(this._realY - this.distancePerFrame(), this._y);
      }
      if (this._y > this._realY) {
        this._realY = Math.min(this._realY + this.distancePerFrame(), this._y);
      }
      if (!this.isMoving()) {
        this.refreshBushDepth();
      }
    }
    updateAnimation() {
      this.updateAnimationCount();
      if (this._animationCount >= this.animationWait()) {
        this.updatePattern();
        this._animationCount = 0;
      }
    }
    animationWait() {
      return (9 - this.realMoveSpeed()) * 3;
    }
    updateAnimationCount() {
      if (this.isMoving() && this.hasWalkAnime()) {
        this._animationCount += 1.5;
      } else if (this.hasStepAnime() || !this.isOriginalPattern()) {
        this._animationCount++;
      }
    }
    updatePattern() {
      if (!this.hasStepAnime() && this._stopCount > 0) {
        this.resetPattern();
      } else {
        this._pattern = (this._pattern + 1) % this.maxPattern();
      }
    }
    maxPattern() {
      return 4;
    }
    pattern() {
      return this._pattern < 3 ? this._pattern : 1;
    }
    setPattern(pattern) {
      this._pattern = pattern;
    }
    isOriginalPattern() {
      return this.pattern() === 1;
    }
    resetPattern() {
      this.setPattern(1);
    }
    refreshBushDepth() {
      if (this.isNormalPriority() && !this.isObjectCharacter() && this.isOnBush() && !this.isJumping()) {
        if (!this.isMoving()) {
          this._bushDepth = 12;
        }
      } else {
        this._bushDepth = 0;
      }
    }
    isOnLadder() {
      return self.$gameMap.isLadder(this._x, this._y);
    }
    isOnBush() {
      return self.$gameMap.isBush(this._x, this._y);
    }
    terrainTag() {
      return self.$gameMap.terrainTag(this._x, this._y);
    }
    regionId() {
      return self.$gameMap.regionId(this._x, this._y);
    }
    increaseSteps() {
      if (this.isOnLadder()) {
        this.setDirection(8);
      }
      this.resetStopCount();
      this.refreshBushDepth();
    }
    tileId() {
      return this._tileId;
    }
    characterName() {
      return this._characterName;
    }
    characterIndex() {
      return this._characterIndex;
    }
    setImage(characterName, characterIndex) {
      this._tileId = 0;
      this._characterName = characterName;
      this._characterIndex = characterIndex;
      this._isObjectCharacter = ImageManager_default.isObjectCharacter(characterName);
    }
    setTileImage(tileId) {
      this._tileId = tileId;
      this._characterName = "";
      this._characterIndex = 0;
      this._isObjectCharacter = true;
    }
    checkEventTriggerTouchFront(d) {
      const x2 = self.$gameMap.roundXWithDirection(this._x, d);
      const y2 = self.$gameMap.roundYWithDirection(this._y, d);
      this.checkEventTriggerTouch(x2, y2);
    }
    checkEventTriggerTouch(x, y) {
      return false;
    }
    isMovementSucceeded(x, y) {
      return this._movementSuccess;
    }
    setMovementSuccess(success) {
      this._movementSuccess = success;
    }
    moveStraight(d) {
      this.setMovementSuccess(this.canPass(this._x, this._y, d));
      if (this.isMovementSucceeded()) {
        this.setDirection(d);
        this._x = self.$gameMap.roundXWithDirection(this._x, d);
        this._y = self.$gameMap.roundYWithDirection(this._y, d);
        this._realX = self.$gameMap.xWithDirection(this._x, this.reverseDir(d));
        this._realY = self.$gameMap.yWithDirection(this._y, this.reverseDir(d));
        this.increaseSteps();
      } else {
        this.setDirection(d);
        this.checkEventTriggerTouchFront(d);
      }
    }
    moveDiagonally(horz, vert) {
      this.setMovementSuccess(
        this.canPassDiagonally(this._x, this._y, horz, vert)
      );
      if (this.isMovementSucceeded()) {
        this._x = self.$gameMap.roundXWithDirection(this._x, horz);
        this._y = self.$gameMap.roundYWithDirection(this._y, vert);
        this._realX = self.$gameMap.xWithDirection(
          this._x,
          this.reverseDir(horz)
        );
        this._realY = self.$gameMap.yWithDirection(
          this._y,
          this.reverseDir(vert)
        );
        this.increaseSteps();
      }
      if (this._direction === this.reverseDir(horz)) {
        this.setDirection(horz);
      }
      if (this._direction === this.reverseDir(vert)) {
        this.setDirection(vert);
      }
    }
    jump(xPlus, yPlus) {
      if (Math.abs(xPlus) > Math.abs(yPlus)) {
        if (xPlus !== 0) {
          this.setDirection(xPlus < 0 ? 4 : 6);
        }
      } else {
        if (yPlus !== 0) {
          this.setDirection(yPlus < 0 ? 8 : 2);
        }
      }
      this._x += xPlus;
      this._y += yPlus;
      const distance = Math.round(Math.sqrt(xPlus * xPlus + yPlus * yPlus));
      this._jumpPeak = 10 + distance - this._moveSpeed;
      this._jumpCount = this._jumpPeak * 2;
      this.resetStopCount();
      this.straighten();
    }
    hasWalkAnime() {
      return this._walkAnime;
    }
    setWalkAnime(walkAnime) {
      this._walkAnime = walkAnime;
    }
    hasStepAnime() {
      return this._stepAnime;
    }
    setStepAnime(stepAnime) {
      this._stepAnime = stepAnime;
    }
    isDirectionFixed() {
      return this._directionFix;
    }
    setDirectionFix(directionFix) {
      this._directionFix = directionFix;
    }
    isThrough() {
      return this._through;
    }
    setThrough(through) {
      this._through = through;
    }
    isTransparent() {
      return this._transparent;
    }
    bushDepth() {
      return this._bushDepth;
    }
    setTransparent(transparent) {
      this._transparent = transparent;
    }
    requestAnimation(animationId) {
      this._animationId = animationId;
    }
    requestBalloon(balloonId) {
      this._balloonId = balloonId;
    }
    animationId() {
      return this._animationId;
    }
    balloonId() {
      return this._balloonId;
    }
    startAnimation() {
      this._animationId = 0;
      this._animationPlaying = true;
    }
    startBalloon() {
      this._balloonId = 0;
      this._balloonPlaying = true;
    }
    isAnimationPlaying() {
      return this._animationId > 0 || this._animationPlaying;
    }
    isBalloonPlaying() {
      return this._balloonId > 0 || this._balloonPlaying;
    }
    endAnimation() {
      this._animationPlaying = false;
    }
    endBalloon() {
      this._balloonPlaying = false;
    }
  };
  Object.defineProperties(Game_CharacterBase.prototype, {
    x: {
      get() {
        return this._x;
      },
      configurable: true
    },
    y: {
      get() {
        return this._y;
      },
      configurable: true
    }
  });
  var Game_CharacterBase_default = Game_CharacterBase;

  // src-www/js/rpg_objects/Game_Character.js
  var _Game_Character = class extends Game_CharacterBase_default {
    constructor(...args) {
      super(...args);
      this.initialize(...args);
    }
    initialize() {
      super.initialize();
    }
    initMembers() {
      super.initMembers();
      this._moveRouteForcing = false;
      this._moveRoute = null;
      this._moveRouteIndex = 0;
      this._originalMoveRoute = null;
      this._originalMoveRouteIndex = 0;
      this._waitCount = 0;
      this._callerEventInfo = null;
    }
    memorizeMoveRoute() {
      this._originalMoveRoute = this._moveRoute;
      this._originalMoveRouteIndex = this._moveRouteIndex;
    }
    restoreMoveRoute() {
      this._moveRoute = this._originalMoveRoute;
      this._moveRouteIndex = this._originalMoveRouteIndex - 1;
      this._originalMoveRoute = null;
      this._callerEventInfo = null;
    }
    isMoveRouteForcing() {
      return this._moveRouteForcing;
    }
    setMoveRoute(moveRoute) {
      this._moveRoute = moveRoute;
      this._moveRouteIndex = 0;
      this._moveRouteForcing = false;
    }
    forceMoveRoute(moveRoute) {
      if (!this._originalMoveRoute) {
        this.memorizeMoveRoute();
      }
      this._moveRoute = moveRoute;
      this._moveRouteIndex = 0;
      this._moveRouteForcing = true;
      this._waitCount = 0;
    }
    setCallerEventInfo(callerEventInfo) {
      this._callerEventInfo = callerEventInfo;
    }
    updateStop() {
      super.updateStop();
      if (this._moveRouteForcing) {
        this.updateRoutineMove();
      }
    }
    updateRoutineMove() {
      if (this._waitCount > 0) {
        this._waitCount--;
      } else {
        this.setMovementSuccess(true);
        const command2 = this._moveRoute.list[this._moveRouteIndex];
        if (command2) {
          this.processMoveCommand(command2);
          this.advanceMoveRouteIndex();
        }
      }
    }
    processMoveCommand(command) {
      const gc = _Game_Character;
      const params = command.parameters;
      switch (command.code) {
        case gc.ROUTE_END:
          this.processRouteEnd();
          break;
        case gc.ROUTE_MOVE_DOWN:
          this.moveStraight(2);
          break;
        case gc.ROUTE_MOVE_LEFT:
          this.moveStraight(4);
          break;
        case gc.ROUTE_MOVE_RIGHT:
          this.moveStraight(6);
          break;
        case gc.ROUTE_MOVE_UP:
          this.moveStraight(8);
          break;
        case gc.ROUTE_MOVE_LOWER_L:
          this.moveDiagonally(4, 2);
          break;
        case gc.ROUTE_MOVE_LOWER_R:
          this.moveDiagonally(6, 2);
          break;
        case gc.ROUTE_MOVE_UPPER_L:
          this.moveDiagonally(4, 8);
          break;
        case gc.ROUTE_MOVE_UPPER_R:
          this.moveDiagonally(6, 8);
          break;
        case gc.ROUTE_MOVE_RANDOM:
          this.moveRandom();
          break;
        case gc.ROUTE_MOVE_TOWARD:
          this.moveTowardPlayer();
          break;
        case gc.ROUTE_MOVE_AWAY:
          this.moveAwayFromPlayer();
          break;
        case gc.ROUTE_MOVE_FORWARD:
          this.moveForward();
          break;
        case gc.ROUTE_MOVE_BACKWARD:
          this.moveBackward();
          break;
        case gc.ROUTE_JUMP:
          this.jump(params[0], params[1]);
          break;
        case gc.ROUTE_WAIT:
          this._waitCount = params[0] - 1;
          break;
        case gc.ROUTE_TURN_DOWN:
          this.setDirection(2);
          break;
        case gc.ROUTE_TURN_LEFT:
          this.setDirection(4);
          break;
        case gc.ROUTE_TURN_RIGHT:
          this.setDirection(6);
          break;
        case gc.ROUTE_TURN_UP:
          this.setDirection(8);
          break;
        case gc.ROUTE_TURN_90D_R:
          this.turnRight90();
          break;
        case gc.ROUTE_TURN_90D_L:
          this.turnLeft90();
          break;
        case gc.ROUTE_TURN_180D:
          this.turn180();
          break;
        case gc.ROUTE_TURN_90D_R_L:
          this.turnRightOrLeft90();
          break;
        case gc.ROUTE_TURN_RANDOM:
          this.turnRandom();
          break;
        case gc.ROUTE_TURN_TOWARD:
          this.turnTowardPlayer();
          break;
        case gc.ROUTE_TURN_AWAY:
          this.turnAwayFromPlayer();
          break;
        case gc.ROUTE_SWITCH_ON:
          self.$gameSwitches.setValue(params[0], true);
          break;
        case gc.ROUTE_SWITCH_OFF:
          self.$gameSwitches.setValue(params[0], false);
          break;
        case gc.ROUTE_CHANGE_SPEED:
          this.setMoveSpeed(params[0]);
          break;
        case gc.ROUTE_CHANGE_FREQ:
          this.setMoveFrequency(params[0]);
          break;
        case gc.ROUTE_WALK_ANIME_ON:
          this.setWalkAnime(true);
          break;
        case gc.ROUTE_WALK_ANIME_OFF:
          this.setWalkAnime(false);
          break;
        case gc.ROUTE_STEP_ANIME_ON:
          this.setStepAnime(true);
          break;
        case gc.ROUTE_STEP_ANIME_OFF:
          this.setStepAnime(false);
          break;
        case gc.ROUTE_DIR_FIX_ON:
          this.setDirectionFix(true);
          break;
        case gc.ROUTE_DIR_FIX_OFF:
          this.setDirectionFix(false);
          break;
        case gc.ROUTE_THROUGH_ON:
          this.setThrough(true);
          break;
        case gc.ROUTE_THROUGH_OFF:
          this.setThrough(false);
          break;
        case gc.ROUTE_TRANSPARENT_ON:
          this.setTransparent(true);
          break;
        case gc.ROUTE_TRANSPARENT_OFF:
          this.setTransparent(false);
          break;
        case gc.ROUTE_CHANGE_IMAGE:
          this.setImage(params[0], params[1]);
          break;
        case gc.ROUTE_CHANGE_OPACITY:
          this.setOpacity(params[0]);
          break;
        case gc.ROUTE_CHANGE_BLEND_MODE:
          this.setBlendMode(params[0]);
          break;
        case gc.ROUTE_PLAY_SE:
          AudioManager_default.playSe(params[0]);
          break;
        case gc.ROUTE_SCRIPT:
          try {
            eval(params[0]);
          } catch (error) {
            if (this._callerEventInfo) {
              for (let key in this._callerEventInfo) {
                error[key] = this._callerEventInfo[key];
              }
              error.line += this._moveRouteIndex + 1;
              error.eventCommand = "set_route_script";
              error.content = command.parameters[0];
            } else {
              error.eventType = "map_event";
              error.mapId = this._mapId;
              error.mapEventId = this._eventId;
              error.page = this._pageIndex + 1;
              error.line = this._moveRouteIndex + 1;
              error.eventCommand = "auto_route_script";
              error.content = command.parameters[0];
            }
            throw error;
          }
          break;
      }
    }
    deltaXFrom(x) {
      return self.$gameMap.deltaX(this.x, x);
    }
    deltaYFrom(y) {
      return self.$gameMap.deltaY(this.y, y);
    }
    moveRandom() {
      const d = 2 + Math.randomInt(4) * 2;
      if (this.canPass(this.x, this.y, d)) {
        this.moveStraight(d);
      }
    }
    moveTowardCharacter({ x, y }) {
      const sx = this.deltaXFrom(x);
      const sy = this.deltaYFrom(y);
      if (Math.abs(sx) > Math.abs(sy)) {
        this.moveStraight(sx > 0 ? 4 : 6);
        if (!this.isMovementSucceeded() && sy !== 0) {
          this.moveStraight(sy > 0 ? 8 : 2);
        }
      } else if (sy !== 0) {
        this.moveStraight(sy > 0 ? 8 : 2);
        if (!this.isMovementSucceeded() && sx !== 0) {
          this.moveStraight(sx > 0 ? 4 : 6);
        }
      }
    }
    moveAwayFromCharacter({ x, y }) {
      const sx = this.deltaXFrom(x);
      const sy = this.deltaYFrom(y);
      if (Math.abs(sx) > Math.abs(sy)) {
        this.moveStraight(sx > 0 ? 6 : 4);
        if (!this.isMovementSucceeded() && sy !== 0) {
          this.moveStraight(sy > 0 ? 2 : 8);
        }
      } else if (sy !== 0) {
        this.moveStraight(sy > 0 ? 2 : 8);
        if (!this.isMovementSucceeded() && sx !== 0) {
          this.moveStraight(sx > 0 ? 6 : 4);
        }
      }
    }
    turnTowardCharacter({ x, y }) {
      const sx = this.deltaXFrom(x);
      const sy = this.deltaYFrom(y);
      if (Math.abs(sx) > Math.abs(sy)) {
        this.setDirection(sx > 0 ? 4 : 6);
      } else if (sy !== 0) {
        this.setDirection(sy > 0 ? 8 : 2);
      }
    }
    turnAwayFromCharacter({ x, y }) {
      const sx = this.deltaXFrom(x);
      const sy = this.deltaYFrom(y);
      if (Math.abs(sx) > Math.abs(sy)) {
        this.setDirection(sx > 0 ? 6 : 4);
      } else if (sy !== 0) {
        this.setDirection(sy > 0 ? 2 : 8);
      }
    }
    turnTowardPlayer() {
      this.turnTowardCharacter(self.$gamePlayer);
    }
    turnAwayFromPlayer() {
      this.turnAwayFromCharacter(self.$gamePlayer);
    }
    moveTowardPlayer() {
      this.moveTowardCharacter(self.$gamePlayer);
    }
    moveAwayFromPlayer() {
      this.moveAwayFromCharacter(self.$gamePlayer);
    }
    moveForward() {
      this.moveStraight(this.direction());
    }
    moveBackward() {
      const lastDirectionFix = this.isDirectionFixed();
      this.setDirectionFix(true);
      this.moveStraight(this.reverseDir(this.direction()));
      this.setDirectionFix(lastDirectionFix);
    }
    processRouteEnd() {
      if (this._moveRoute.repeat) {
        this._moveRouteIndex = -1;
      } else if (this._moveRouteForcing) {
        this._moveRouteForcing = false;
        this.restoreMoveRoute();
      }
    }
    advanceMoveRouteIndex() {
      const moveRoute = this._moveRoute;
      if (moveRoute && (this.isMovementSucceeded() || moveRoute.skippable)) {
        const numCommands = moveRoute.list.length - 1;
        this._moveRouteIndex++;
        if (moveRoute.repeat && this._moveRouteIndex >= numCommands) {
          this._moveRouteIndex = 0;
        }
      }
    }
    turnRight90() {
      switch (this.direction()) {
        case 2:
          this.setDirection(4);
          break;
        case 4:
          this.setDirection(8);
          break;
        case 6:
          this.setDirection(2);
          break;
        case 8:
          this.setDirection(6);
          break;
      }
    }
    turnLeft90() {
      switch (this.direction()) {
        case 2:
          this.setDirection(6);
          break;
        case 4:
          this.setDirection(2);
          break;
        case 6:
          this.setDirection(8);
          break;
        case 8:
          this.setDirection(4);
          break;
      }
    }
    turn180() {
      this.setDirection(this.reverseDir(this.direction()));
    }
    turnRightOrLeft90() {
      switch (Math.randomInt(2)) {
        case 0:
          this.turnRight90();
          break;
        case 1:
          this.turnLeft90();
          break;
      }
    }
    turnRandom() {
      this.setDirection(2 + Math.randomInt(4) * 2);
    }
    swap(character2) {
      const newX = character2.x;
      const newY = character2.y;
      character2.locate(this.x, this.y);
      this.locate(newX, newY);
    }
    findDirectionTo(goalX, goalY) {
      const searchLimit = this.searchLimit();
      const mapWidth = self.$gameMap.width();
      const nodeList = [];
      const openList = [];
      const closedList = [];
      const start = {};
      let best = start;
      if (this.x === goalX && this.y === goalY) {
        return 0;
      }
      start.parent = null;
      start.x = this.x;
      start.y = this.y;
      start.g = 0;
      start.f = self.$gameMap.distance(start.x, start.y, goalX, goalY);
      nodeList.push(start);
      openList.push(start.y * mapWidth + start.x);
      while (nodeList.length > 0) {
        let bestIndex = 0;
        for (let i = 0; i < nodeList.length; i++) {
          if (nodeList[i].f < nodeList[bestIndex].f) {
            bestIndex = i;
          }
        }
        const current = nodeList[bestIndex];
        const x1 = current.x;
        const y1 = current.y;
        const pos1 = y1 * mapWidth + x1;
        const g1 = current.g;
        nodeList.splice(bestIndex, 1);
        openList.splice(openList.indexOf(pos1), 1);
        closedList.push(pos1);
        if (current.x === goalX && current.y === goalY) {
          best = current;
          break;
        }
        if (g1 >= searchLimit) {
          continue;
        }
        for (let j = 0; j < 4; j++) {
          const direction = 2 + j * 2;
          const x2 = self.$gameMap.roundXWithDirection(x1, direction);
          const y2 = self.$gameMap.roundYWithDirection(y1, direction);
          const pos2 = y2 * mapWidth + x2;
          if (closedList.contains(pos2)) {
            continue;
          }
          if (!this.canPass(x1, y1, direction)) {
            continue;
          }
          const g2 = g1 + 1;
          const index2 = openList.indexOf(pos2);
          if (index2 < 0 || g2 < nodeList[index2].g) {
            let neighbor;
            if (index2 >= 0) {
              neighbor = nodeList[index2];
            } else {
              neighbor = {};
              nodeList.push(neighbor);
              openList.push(pos2);
            }
            neighbor.parent = current;
            neighbor.x = x2;
            neighbor.y = y2;
            neighbor.g = g2;
            neighbor.f = g2 + self.$gameMap.distance(x2, y2, goalX, goalY);
            if (!best || neighbor.f - neighbor.g < best.f - best.g) {
              best = neighbor;
            }
          }
        }
      }
      let node = best;
      while (node.parent && node.parent !== start) {
        node = node.parent;
      }
      const deltaX1 = self.$gameMap.deltaX(node.x, start.x);
      const deltaY1 = self.$gameMap.deltaY(node.y, start.y);
      if (deltaY1 > 0) {
        return 2;
      } else if (deltaX1 < 0) {
        return 4;
      } else if (deltaX1 > 0) {
        return 6;
      } else if (deltaY1 < 0) {
        return 8;
      }
      const deltaX2 = this.deltaXFrom(goalX);
      const deltaY2 = this.deltaYFrom(goalY);
      if (Math.abs(deltaX2) > Math.abs(deltaY2)) {
        return deltaX2 > 0 ? 4 : 6;
      } else if (deltaY2 !== 0) {
        return deltaY2 > 0 ? 8 : 2;
      }
      return 0;
    }
    searchLimit() {
      return 12;
    }
  };
  _Game_Character.ROUTE_END = 0;
  _Game_Character.ROUTE_MOVE_DOWN = 1;
  _Game_Character.ROUTE_MOVE_LEFT = 2;
  _Game_Character.ROUTE_MOVE_RIGHT = 3;
  _Game_Character.ROUTE_MOVE_UP = 4;
  _Game_Character.ROUTE_MOVE_LOWER_L = 5;
  _Game_Character.ROUTE_MOVE_LOWER_R = 6;
  _Game_Character.ROUTE_MOVE_UPPER_L = 7;
  _Game_Character.ROUTE_MOVE_UPPER_R = 8;
  _Game_Character.ROUTE_MOVE_RANDOM = 9;
  _Game_Character.ROUTE_MOVE_TOWARD = 10;
  _Game_Character.ROUTE_MOVE_AWAY = 11;
  _Game_Character.ROUTE_MOVE_FORWARD = 12;
  _Game_Character.ROUTE_MOVE_BACKWARD = 13;
  _Game_Character.ROUTE_JUMP = 14;
  _Game_Character.ROUTE_WAIT = 15;
  _Game_Character.ROUTE_TURN_DOWN = 16;
  _Game_Character.ROUTE_TURN_LEFT = 17;
  _Game_Character.ROUTE_TURN_RIGHT = 18;
  _Game_Character.ROUTE_TURN_UP = 19;
  _Game_Character.ROUTE_TURN_90D_R = 20;
  _Game_Character.ROUTE_TURN_90D_L = 21;
  _Game_Character.ROUTE_TURN_180D = 22;
  _Game_Character.ROUTE_TURN_90D_R_L = 23;
  _Game_Character.ROUTE_TURN_RANDOM = 24;
  _Game_Character.ROUTE_TURN_TOWARD = 25;
  _Game_Character.ROUTE_TURN_AWAY = 26;
  _Game_Character.ROUTE_SWITCH_ON = 27;
  _Game_Character.ROUTE_SWITCH_OFF = 28;
  _Game_Character.ROUTE_CHANGE_SPEED = 29;
  _Game_Character.ROUTE_CHANGE_FREQ = 30;
  _Game_Character.ROUTE_WALK_ANIME_ON = 31;
  _Game_Character.ROUTE_WALK_ANIME_OFF = 32;
  _Game_Character.ROUTE_STEP_ANIME_ON = 33;
  _Game_Character.ROUTE_STEP_ANIME_OFF = 34;
  _Game_Character.ROUTE_DIR_FIX_ON = 35;
  _Game_Character.ROUTE_DIR_FIX_OFF = 36;
  _Game_Character.ROUTE_THROUGH_ON = 37;
  _Game_Character.ROUTE_THROUGH_OFF = 38;
  _Game_Character.ROUTE_TRANSPARENT_ON = 39;
  _Game_Character.ROUTE_TRANSPARENT_OFF = 40;
  _Game_Character.ROUTE_CHANGE_IMAGE = 41;
  _Game_Character.ROUTE_CHANGE_OPACITY = 42;
  _Game_Character.ROUTE_CHANGE_BLEND_MODE = 43;
  _Game_Character.ROUTE_PLAY_SE = 44;
  _Game_Character.ROUTE_SCRIPT = 45;
  var Game_Character_default = _Game_Character;

  // src-www/js/rpg_windows/Window_ShopCommand.js
  var Window_ShopCommand = class extends Window_HorzCommand_default {
    constructor(...args) {
      super(...args);
      this.initialize(...args);
    }
    initialize(width, purchaseOnly) {
      this._windowWidth = width;
      this._purchaseOnly = purchaseOnly;
      super.initialize(0, 0);
    }
    windowWidth() {
      return this._windowWidth;
    }
    maxCols() {
      return 3;
    }
    makeCommandList() {
      this.addCommand(TextManager_default.buy, "buy");
      this.addCommand(TextManager_default.sell, "sell", !this._purchaseOnly);
      this.addCommand(TextManager_default.cancel, "cancel");
    }
  };
  var Window_ShopCommand_default = Window_ShopCommand;

  // src-www/js/rpg_windows/Window_ShopBuy.js
  var Window_ShopBuy = class extends Window_Selectable_default {
    constructor(...args) {
      super(...args);
      this.initialize(...args);
    }
    initialize(x, y, height, shopGoods) {
      const width = this.windowWidth();
      super.initialize(x, y, width, height);
      this._shopGoods = shopGoods;
      this._money = 0;
      this.refresh();
      this.select(0);
    }
    windowWidth() {
      return 456;
    }
    maxItems() {
      return this._data ? this._data.length : 1;
    }
    item() {
      return this._data[this.index()];
    }
    setMoney(money) {
      this._money = money;
      this.refresh();
    }
    isCurrentItemEnabled() {
      return this.isEnabled(this._data[this.index()]);
    }
    price(item2) {
      return this._price[this._data.indexOf(item2)] || 0;
    }
    isEnabled(item2) {
      return item2 && this.price(item2) <= this._money && !self.$gameParty.hasMaxItems(item2);
    }
    refresh() {
      this.makeItemList();
      this.createContents();
      this.drawAllItems();
    }
    makeItemList() {
      this._data = [];
      this._price = [];
      this._shopGoods.forEach(function(goods) {
        let item2 = null;
        switch (goods[0]) {
          case 0:
            item2 = self.$dataItems[goods[1]];
            break;
          case 1:
            item2 = self.$dataWeapons[goods[1]];
            break;
          case 2:
            item2 = self.$dataArmors[goods[1]];
            break;
        }
        if (item2) {
          this._data.push(item2);
          this._price.push(goods[2] === 0 ? item2.price : goods[3]);
        }
      }, this);
    }
    drawItem(index) {
      const item2 = this._data[index];
      const rect = this.itemRect(index);
      const priceWidth = 96;
      rect.width -= this.textPadding();
      this.changePaintOpacity(this.isEnabled(item2));
      this.drawItemName(item2, rect.x, rect.y, rect.width - priceWidth);
      this.drawText(
        this.price(item2),
        rect.x + rect.width - priceWidth,
        rect.y,
        priceWidth,
        "right"
      );
      this.changePaintOpacity(true);
    }
    setStatusWindow(statusWindow) {
      this._statusWindow = statusWindow;
      this.callUpdateHelp();
    }
    updateHelp() {
      this.setHelpWindowItem(this.item());
      if (this._statusWindow) {
        this._statusWindow.setItem(this.item());
      }
    }
  };
  var Window_ShopBuy_default = Window_ShopBuy;

  // src-www/js/rpg_windows/Window_ShopSell.js
  var Window_ShopSell = class extends Window_ItemList_default {
    constructor(...args) {
      super(...args);
      this.initialize(...args);
    }
    initialize(x, y, width, height) {
      super.initialize(x, y, width, height);
    }
    isEnabled(item2) {
      return item2 && item2.price > 0;
    }
  };
  var Window_ShopSell_default = Window_ShopSell;

  // src-www/js/rpg_windows/Window_ShopNumber.js
  var Window_ShopNumber = class extends Window_Selectable_default {
    constructor(...args) {
      super(...args);
      this.initialize(...args);
    }
    initialize(x, y, height) {
      const width = this.windowWidth();
      super.initialize(x, y, width, height);
      this._item = null;
      this._max = 1;
      this._price = 0;
      this._number = 1;
      this._currencyUnit = TextManager_default.currencyUnit;
      this.createButtons();
    }
    windowWidth() {
      return 456;
    }
    number() {
      return this._number;
    }
    setup(item2, max, price) {
      this._item = item2;
      this._max = Math.floor(max);
      this._price = price;
      this._number = 1;
      this.placeButtons();
      this.updateButtonsVisiblity();
      this.refresh();
    }
    setCurrencyUnit(currencyUnit) {
      this._currencyUnit = currencyUnit;
      this.refresh();
    }
    createButtons() {
      const bitmap = ImageManager_default.loadSystem("ButtonSet");
      const buttonWidth = 48;
      const buttonHeight = 48;
      this._buttons = [];
      for (let i = 0; i < 5; i++) {
        const button = new Sprite_Button_default();
        const x = buttonWidth * i;
        const w = buttonWidth * (i === 4 ? 2 : 1);
        button.bitmap = bitmap;
        button.setColdFrame(x, 0, w, buttonHeight);
        button.setHotFrame(x, buttonHeight, w, buttonHeight);
        button.visible = false;
        this._buttons.push(button);
        this.addChild(button);
      }
      this._buttons[0].setClickHandler(this.onButtonDown2.bind(this));
      this._buttons[1].setClickHandler(this.onButtonDown.bind(this));
      this._buttons[2].setClickHandler(this.onButtonUp.bind(this));
      this._buttons[3].setClickHandler(this.onButtonUp2.bind(this));
      this._buttons[4].setClickHandler(this.onButtonOk.bind(this));
    }
    placeButtons() {
      const numButtons = this._buttons.length;
      const spacing = 16;
      let totalWidth = -spacing;
      for (let i = 0; i < numButtons; i++) {
        totalWidth += this._buttons[i].width + spacing;
      }
      let x = (this.width - totalWidth) / 2;
      for (let j = 0; j < numButtons; j++) {
        const button = this._buttons[j];
        button.x = x;
        button.y = this.buttonY();
        x += button.width + spacing;
      }
    }
    updateButtonsVisiblity() {
      if (TouchInput_default.date > Input_default.date) {
        this.showButtons();
      } else {
        this.hideButtons();
      }
    }
    showButtons() {
      for (let i = 0; i < this._buttons.length; i++) {
        this._buttons[i].visible = true;
      }
    }
    hideButtons() {
      for (let i = 0; i < this._buttons.length; i++) {
        this._buttons[i].visible = false;
      }
    }
    refresh() {
      this.contents.clear();
      this.drawItemName(this._item, 0, this.itemY());
      this.drawMultiplicationSign();
      this.drawNumber();
      this.drawTotalPrice();
    }
    drawMultiplicationSign() {
      const sign2 = "\xD7";
      const width = this.textWidth(sign2);
      const x = this.cursorX() - width * 2;
      const y = this.itemY();
      this.resetTextColor();
      this.drawText(sign2, x, y, width);
    }
    drawNumber() {
      const x = this.cursorX();
      const y = this.itemY();
      const width = this.cursorWidth() - this.textPadding();
      this.resetTextColor();
      this.drawText(this._number, x, y, width, "right");
    }
    drawTotalPrice() {
      const total = this._price * this._number;
      const width = this.contentsWidth() - this.textPadding();
      this.drawCurrencyValue(total, this._currencyUnit, 0, this.priceY(), width);
    }
    itemY() {
      return Math.round(this.contentsHeight() / 2 - this.lineHeight() * 1.5);
    }
    priceY() {
      return Math.round(this.contentsHeight() / 2 + this.lineHeight() / 2);
    }
    buttonY() {
      return Math.round(this.priceY() + this.lineHeight() * 2.5);
    }
    cursorWidth() {
      const digitWidth = this.textWidth("0");
      return this.maxDigits() * digitWidth + this.textPadding() * 2;
    }
    cursorX() {
      return this.contentsWidth() - this.cursorWidth() - this.textPadding();
    }
    maxDigits() {
      return 2;
    }
    update() {
      super.update();
      this.processNumberChange();
    }
    isOkTriggered() {
      return Input_default.isTriggered("ok");
    }
    playOkSound() {
    }
    processNumberChange() {
      if (this.isOpenAndActive()) {
        if (Input_default.isRepeated("right")) {
          this.changeNumber(1);
        }
        if (Input_default.isRepeated("left")) {
          this.changeNumber(-1);
        }
        if (Input_default.isRepeated("up")) {
          this.changeNumber(10);
        }
        if (Input_default.isRepeated("down")) {
          this.changeNumber(-10);
        }
      }
    }
    changeNumber(amount) {
      const lastNumber = this._number;
      this._number = (this._number + amount).clamp(1, this._max);
      if (this._number !== lastNumber) {
        SoundManager_default.playCursor();
        this.refresh();
      }
    }
    updateCursor() {
      this.setCursorRect(
        this.cursorX(),
        this.itemY(),
        this.cursorWidth(),
        this.lineHeight()
      );
    }
    onButtonUp() {
      this.changeNumber(1);
    }
    onButtonUp2() {
      this.changeNumber(10);
    }
    onButtonDown() {
      this.changeNumber(-1);
    }
    onButtonDown2() {
      this.changeNumber(-10);
    }
    onButtonOk() {
      this.processOk();
    }
  };
  var Window_ShopNumber_default = Window_ShopNumber;

  // src-www/js/rpg_windows/Window_ShopStatus.js
  var Window_ShopStatus = class extends Window_Base_default {
    constructor(...args) {
      super(...args);
      this.initialize(...args);
    }
    initialize(x, y, width, height) {
      super.initialize(x, y, width, height);
      this._item = null;
      this._pageIndex = 0;
      this.refresh();
    }
    refresh() {
      this.contents.clear();
      if (this._item) {
        const x = this.textPadding();
        this.drawPossession(x, 0);
        if (this.isEquipItem()) {
          this.drawEquipInfo(x, this.lineHeight() * 2);
        }
      }
    }
    setItem(item2) {
      this._item = item2;
      this.refresh();
    }
    isEquipItem() {
      return DataManager.isWeapon(this._item) || DataManager.isArmor(this._item);
    }
    drawPossession(x, y) {
      const width = this.contents.width - this.textPadding() - x;
      const possessionWidth = this.textWidth("0000");
      this.changeTextColor(this.systemColor());
      this.drawText(TextManager_default.possession, x, y, width - possessionWidth);
      this.resetTextColor();
      this.drawText(self.$gameParty.numItems(this._item), x, y, width, "right");
    }
    drawEquipInfo(x, y) {
      const members = this.statusMembers();
      for (let i = 0; i < members.length; i++) {
        this.drawActorEquipInfo(x, y + this.lineHeight() * (i * 2.4), members[i]);
      }
    }
    statusMembers() {
      const start = this._pageIndex * this.pageSize();
      const end = start + this.pageSize();
      return self.$gameParty.members().slice(start, end);
    }
    pageSize() {
      return 4;
    }
    maxPages() {
      return Math.floor(
        (self.$gameParty.size() + this.pageSize() - 1) / this.pageSize()
      );
    }
    drawActorEquipInfo(x, y, actor2) {
      const enabled = actor2.canEquip(this._item);
      this.changePaintOpacity(enabled);
      this.resetTextColor();
      this.drawText(actor2.name(), x, y, 168);
      const item1 = this.currentEquippedItem(actor2, this._item.etypeId);
      if (enabled) {
        this.drawActorParamChange(x, y, actor2, item1);
      }
      this.drawItemName(item1, x, y + this.lineHeight());
      this.changePaintOpacity(true);
    }
    drawActorParamChange(x, y, actor2, item1) {
      const width = this.contents.width - this.textPadding() - x;
      const paramId = this.paramId();
      const change = this._item.params[paramId] - (item1 ? item1.params[paramId] : 0);
      this.changeTextColor(this.paramchangeTextColor(change));
      this.drawText((change > 0 ? "+" : "") + change, x, y, width, "right");
    }
    paramId() {
      return DataManager.isWeapon(this._item) ? 2 : 3;
    }
    currentEquippedItem(actor2, etypeId) {
      const list = [];
      const equips = actor2.equips();
      const slots = actor2.equipSlots();
      for (let i = 0; i < slots.length; i++) {
        if (slots[i] === etypeId) {
          list.push(equips[i]);
        }
      }
      const paramId = this.paramId();
      let worstParam = Number.MAX_VALUE;
      let worstItem = null;
      for (let j = 0; j < list.length; j++) {
        if (list[j] && list[j].params[paramId] < worstParam) {
          worstParam = list[j].params[paramId];
          worstItem = list[j];
        }
      }
      return worstItem;
    }
    update() {
      super.update();
      this.updatePage();
    }
    updatePage() {
      if (this.isPageChangeEnabled() && this.isPageChangeRequested()) {
        this.changePage();
      }
    }
    isPageChangeEnabled() {
      return this.visible && this.maxPages() >= 2;
    }
    isPageChangeRequested() {
      if (Input_default.isTriggered("shift")) {
        return true;
      }
      if (TouchInput_default.isTriggered() && this.isTouchedInsideFrame()) {
        return true;
      }
      return false;
    }
    isTouchedInsideFrame() {
      const x = this.canvasToLocalX(TouchInput_default.x);
      const y = this.canvasToLocalY(TouchInput_default.y);
      return x >= 0 && y >= 0 && x < this.width && y < this.height;
    }
    changePage() {
      this._pageIndex = (this._pageIndex + 1) % this.maxPages();
      this.refresh();
      SoundManager_default.playCursor();
    }
  };
  var Window_ShopStatus_default = Window_ShopStatus;

  // src-www/js/rpg_scenes/Scene_Shop.js
  var Scene_Shop = class extends Scene_MenuBase_default {
    constructor(...args) {
      super(...args);
      this.initialize(...args);
    }
    initialize() {
      super.initialize();
    }
    prepare(goods, purchaseOnly) {
      this._goods = goods;
      this._purchaseOnly = purchaseOnly;
      this._item = null;
    }
    create() {
      super.create();
      this.createHelpWindow();
      this.createGoldWindow();
      this.createCommandWindow();
      this.createDummyWindow();
      this.createNumberWindow();
      this.createStatusWindow();
      this.createBuyWindow();
      this.createCategoryWindow();
      this.createSellWindow();
    }
    createGoldWindow() {
      this._goldWindow = new Window_Gold_default(0, this._helpWindow.height);
      this._goldWindow.x = Graphics_default.boxWidth - this._goldWindow.width;
      this.addWindow(this._goldWindow);
    }
    createCommandWindow() {
      this._commandWindow = new Window_ShopCommand_default(
        this._goldWindow.x,
        this._purchaseOnly
      );
      this._commandWindow.y = this._helpWindow.height;
      this._commandWindow.setHandler("buy", this.commandBuy.bind(this));
      this._commandWindow.setHandler("sell", this.commandSell.bind(this));
      this._commandWindow.setHandler("cancel", this.popScene.bind(this));
      this.addWindow(this._commandWindow);
    }
    createDummyWindow() {
      const wy = this._commandWindow.y + this._commandWindow.height;
      const wh = Graphics_default.boxHeight - wy;
      this._dummyWindow = new Window_Base_default(0, wy, Graphics_default.boxWidth, wh);
      this.addWindow(this._dummyWindow);
    }
    createNumberWindow() {
      const wy = this._dummyWindow.y;
      const wh = this._dummyWindow.height;
      this._numberWindow = new Window_ShopNumber_default(0, wy, wh);
      this._numberWindow.hide();
      this._numberWindow.setHandler("ok", this.onNumberOk.bind(this));
      this._numberWindow.setHandler("cancel", this.onNumberCancel.bind(this));
      this.addWindow(this._numberWindow);
    }
    createStatusWindow() {
      const wx = this._numberWindow.width;
      const wy = this._dummyWindow.y;
      const ww = Graphics_default.boxWidth - wx;
      const wh = this._dummyWindow.height;
      this._statusWindow = new Window_ShopStatus_default(wx, wy, ww, wh);
      this._statusWindow.hide();
      this.addWindow(this._statusWindow);
    }
    createBuyWindow() {
      const wy = this._dummyWindow.y;
      const wh = this._dummyWindow.height;
      this._buyWindow = new Window_ShopBuy_default(0, wy, wh, this._goods);
      this._buyWindow.setHelpWindow(this._helpWindow);
      this._buyWindow.setStatusWindow(this._statusWindow);
      this._buyWindow.hide();
      this._buyWindow.setHandler("ok", this.onBuyOk.bind(this));
      this._buyWindow.setHandler("cancel", this.onBuyCancel.bind(this));
      this.addWindow(this._buyWindow);
    }
    createCategoryWindow() {
      this._categoryWindow = new Window_ItemCategory_default();
      this._categoryWindow.setHelpWindow(this._helpWindow);
      this._categoryWindow.y = this._dummyWindow.y;
      this._categoryWindow.hide();
      this._categoryWindow.deactivate();
      this._categoryWindow.setHandler("ok", this.onCategoryOk.bind(this));
      this._categoryWindow.setHandler("cancel", this.onCategoryCancel.bind(this));
      this.addWindow(this._categoryWindow);
    }
    createSellWindow() {
      const wy = this._categoryWindow.y + this._categoryWindow.height;
      const wh = Graphics_default.boxHeight - wy;
      this._sellWindow = new Window_ShopSell_default(0, wy, Graphics_default.boxWidth, wh);
      this._sellWindow.setHelpWindow(this._helpWindow);
      this._sellWindow.hide();
      this._sellWindow.setHandler("ok", this.onSellOk.bind(this));
      this._sellWindow.setHandler("cancel", this.onSellCancel.bind(this));
      this._categoryWindow.setItemWindow(this._sellWindow);
      this.addWindow(this._sellWindow);
    }
    activateBuyWindow() {
      this._buyWindow.setMoney(this.money());
      this._buyWindow.show();
      this._buyWindow.activate();
      this._statusWindow.show();
    }
    activateSellWindow() {
      this._categoryWindow.show();
      this._sellWindow.refresh();
      this._sellWindow.show();
      this._sellWindow.activate();
      this._statusWindow.hide();
    }
    commandBuy() {
      this._dummyWindow.hide();
      this.activateBuyWindow();
    }
    commandSell() {
      this._dummyWindow.hide();
      this._categoryWindow.show();
      this._categoryWindow.activate();
      this._sellWindow.show();
      this._sellWindow.deselect();
      this._sellWindow.refresh();
    }
    onBuyOk() {
      this._item = this._buyWindow.item();
      this._buyWindow.hide();
      this._numberWindow.setup(this._item, this.maxBuy(), this.buyingPrice());
      this._numberWindow.setCurrencyUnit(this.currencyUnit());
      this._numberWindow.show();
      this._numberWindow.activate();
    }
    onBuyCancel() {
      this._commandWindow.activate();
      this._dummyWindow.show();
      this._buyWindow.hide();
      this._statusWindow.hide();
      this._statusWindow.setItem(null);
      this._helpWindow.clear();
    }
    onCategoryOk() {
      this.activateSellWindow();
      this._sellWindow.select(0);
    }
    onCategoryCancel() {
      this._commandWindow.activate();
      this._dummyWindow.show();
      this._categoryWindow.hide();
      this._sellWindow.hide();
    }
    onSellOk() {
      this._item = this._sellWindow.item();
      this._categoryWindow.hide();
      this._sellWindow.hide();
      this._numberWindow.setup(this._item, this.maxSell(), this.sellingPrice());
      this._numberWindow.setCurrencyUnit(this.currencyUnit());
      this._numberWindow.show();
      this._numberWindow.activate();
      this._statusWindow.setItem(this._item);
      this._statusWindow.show();
    }
    onSellCancel() {
      this._sellWindow.deselect();
      this._categoryWindow.activate();
      this._statusWindow.setItem(null);
      this._helpWindow.clear();
    }
    onNumberOk() {
      SoundManager_default.playShop();
      switch (this._commandWindow.currentSymbol()) {
        case "buy":
          this.doBuy(this._numberWindow.number());
          break;
        case "sell":
          this.doSell(this._numberWindow.number());
          break;
      }
      this.endNumberInput();
      this._goldWindow.refresh();
      this._statusWindow.refresh();
    }
    onNumberCancel() {
      SoundManager_default.playCancel();
      this.endNumberInput();
    }
    doBuy(number) {
      self.$gameParty.loseGold(number * this.buyingPrice());
      self.$gameParty.gainItem(this._item, number);
    }
    doSell(number) {
      self.$gameParty.gainGold(number * this.sellingPrice());
      self.$gameParty.loseItem(this._item, number);
    }
    endNumberInput() {
      this._numberWindow.hide();
      switch (this._commandWindow.currentSymbol()) {
        case "buy":
          this.activateBuyWindow();
          break;
        case "sell":
          this.activateSellWindow();
          break;
      }
    }
    maxBuy() {
      const max = self.$gameParty.maxItems(this._item) - self.$gameParty.numItems(this._item);
      const price = this.buyingPrice();
      if (price > 0) {
        return Math.min(max, Math.floor(this.money() / price));
      } else {
        return max;
      }
    }
    maxSell() {
      return self.$gameParty.numItems(this._item);
    }
    money() {
      return this._goldWindow.value();
    }
    currencyUnit() {
      return this._goldWindow.currencyUnit();
    }
    buyingPrice() {
      return this._buyWindow.price(this._item);
    }
    sellingPrice() {
      return Math.floor(this._item.price / 2);
    }
  };
  var Scene_Shop_default = Scene_Shop;

  // src-www/js/rpg_windows/Window_NameEdit.js
  var Window_NameEdit = class extends Window_Base_default {
    constructor(...args) {
      super(...args);
      this.initialize(...args);
    }
    initialize(actor2, maxLength) {
      const width = this.windowWidth();
      const height = this.windowHeight();
      const x = (Graphics_default.boxWidth - width) / 2;
      const y = (Graphics_default.boxHeight - (height + this.fittingHeight(9) + 8)) / 2;
      super.initialize(x, y, width, height);
      this._actor = actor2;
      this._name = actor2.name().slice(0, this._maxLength);
      this._index = this._name.length;
      this._maxLength = maxLength;
      this._defaultName = this._name;
      this.deactivate();
      this.refresh();
      ImageManager_default.reserveFace(actor2.faceName());
    }
    windowWidth() {
      return 480;
    }
    windowHeight() {
      return this.fittingHeight(4);
    }
    name() {
      return this._name;
    }
    restoreDefault() {
      this._name = this._defaultName;
      this._index = this._name.length;
      this.refresh();
      return this._name.length > 0;
    }
    add(ch) {
      if (this._index < this._maxLength) {
        this._name += ch;
        this._index++;
        this.refresh();
        return true;
      } else {
        return false;
      }
    }
    back() {
      if (this._index > 0) {
        this._index--;
        this._name = this._name.slice(0, this._index);
        this.refresh();
        return true;
      } else {
        return false;
      }
    }
    faceWidth() {
      return 144;
    }
    charWidth() {
      const text = self.$gameSystem.isJapanese() ? "\uFF21" : "A";
      return this.textWidth(text);
    }
    left() {
      const nameCenter = (this.contentsWidth() + this.faceWidth()) / 2;
      const nameWidth = (this._maxLength + 1) * this.charWidth();
      return Math.min(
        nameCenter - nameWidth / 2,
        this.contentsWidth() - nameWidth
      );
    }
    itemRect(index) {
      return {
        x: this.left() + index * this.charWidth(),
        y: 54,
        width: this.charWidth(),
        height: this.lineHeight()
      };
    }
    underlineRect(index) {
      const rect = this.itemRect(index);
      rect.x++;
      rect.y += rect.height - 4;
      rect.width -= 2;
      rect.height = 2;
      return rect;
    }
    underlineColor() {
      return this.normalColor();
    }
    drawUnderline(index) {
      const rect = this.underlineRect(index);
      const color = this.underlineColor();
      this.contents.paintOpacity = 48;
      this.contents.fillRect(rect.x, rect.y, rect.width, rect.height, color);
      this.contents.paintOpacity = 255;
    }
    drawChar(index) {
      const rect = this.itemRect(index);
      this.resetTextColor();
      this.drawText(this._name[index] || "", rect.x, rect.y);
    }
    refresh() {
      this.contents.clear();
      this.drawActorFace(this._actor, 0, 0);
      for (let i = 0; i < this._maxLength; i++) {
        this.drawUnderline(i);
      }
      for (let j = 0; j < this._name.length; j++) {
        this.drawChar(j);
      }
      const rect = this.itemRect(this._index);
      this.setCursorRect(rect.x, rect.y, rect.width, rect.height);
    }
  };
  var Window_NameEdit_default = Window_NameEdit;

  // src-www/js/rpg_windows/Window_NameInput.js
  var Window_NameInput = class extends Window_Selectable_default {
    constructor(...args) {
      super(...args);
      this.initialize(...args);
    }
    initialize(editWindow) {
      const x = editWindow.x;
      const y = editWindow.y + editWindow.height + 8;
      const width = editWindow.width;
      const height = this.windowHeight();
      super.initialize(x, y, width, height);
      this._editWindow = editWindow;
      this._page = 0;
      this._index = 0;
      this.refresh();
      this.updateCursor();
      this.activate();
    }
    windowHeight() {
      return this.fittingHeight(9);
    }
    table() {
      if (self.$gameSystem.isJapanese()) {
        return [
          Window_NameInput.JAPAN1,
          Window_NameInput.JAPAN2,
          Window_NameInput.JAPAN3
        ];
      } else if (self.$gameSystem.isRussian()) {
        return [Window_NameInput.RUSSIA];
      } else {
        return [Window_NameInput.LATIN1, Window_NameInput.LATIN2];
      }
    }
    maxCols() {
      return 10;
    }
    maxItems() {
      return 90;
    }
    character() {
      return this._index < 88 ? this.table()[this._page][this._index] : "";
    }
    isPageChange() {
      return this._index === 88;
    }
    isOk() {
      return this._index === 89;
    }
    itemRect(index) {
      return {
        x: index % 10 * 42 + Math.floor(index % 10 / 5) * 24,
        y: Math.floor(index / 10) * this.lineHeight(),
        width: 42,
        height: this.lineHeight()
      };
    }
    refresh() {
      const table = this.table();
      this.contents.clear();
      this.resetTextColor();
      for (let i = 0; i < 90; i++) {
        const rect = this.itemRect(i);
        rect.x += 3;
        rect.width -= 6;
        this.drawText(table[this._page][i], rect.x, rect.y, rect.width, "center");
      }
    }
    updateCursor() {
      const rect = this.itemRect(this._index);
      this.setCursorRect(rect.x, rect.y, rect.width, rect.height);
    }
    isCursorMovable() {
      return this.active;
    }
    cursorDown(wrap) {
      if (this._index < 80 || wrap) {
        this._index = (this._index + 10) % 90;
      }
    }
    cursorUp(wrap) {
      if (this._index >= 10 || wrap) {
        this._index = (this._index + 80) % 90;
      }
    }
    cursorRight(wrap) {
      if (this._index % 10 < 9) {
        this._index++;
      } else if (wrap) {
        this._index -= 9;
      }
    }
    cursorLeft(wrap) {
      if (this._index % 10 > 0) {
        this._index--;
      } else if (wrap) {
        this._index += 9;
      }
    }
    cursorPagedown() {
      this._page = (this._page + 1) % this.table().length;
      this.refresh();
    }
    cursorPageup() {
      this._page = (this._page + this.table().length - 1) % this.table().length;
      this.refresh();
    }
    processCursorMove() {
      const lastPage = this._page;
      super.processCursorMove();
      this.updateCursor();
      if (this._page !== lastPage) {
        SoundManager_default.playCursor();
      }
    }
    processHandling() {
      if (this.isOpen() && this.active) {
        if (Input_default.isTriggered("shift")) {
          this.processJump();
        }
        if (Input_default.isRepeated("cancel")) {
          this.processBack();
        }
        if (Input_default.isRepeated("ok")) {
          this.processOk();
        }
      }
    }
    isCancelEnabled() {
      return true;
    }
    processCancel() {
      this.processBack();
    }
    processJump() {
      if (this._index !== 89) {
        this._index = 89;
        SoundManager_default.playCursor();
      }
    }
    processBack() {
      if (this._editWindow.back()) {
        SoundManager_default.playCancel();
      }
    }
    processOk() {
      if (this.character()) {
        this.onNameAdd();
      } else if (this.isPageChange()) {
        SoundManager_default.playOk();
        this.cursorPagedown();
      } else if (this.isOk()) {
        this.onNameOk();
      }
    }
    onNameAdd() {
      if (this._editWindow.add(this.character())) {
        SoundManager_default.playOk();
      } else {
        SoundManager_default.playBuzzer();
      }
    }
    onNameOk() {
      if (this._editWindow.name() === "") {
        if (this._editWindow.restoreDefault()) {
          SoundManager_default.playOk();
        } else {
          SoundManager_default.playBuzzer();
        }
      } else {
        SoundManager_default.playOk();
        this.callOkHandler();
      }
    }
  };
  Window_NameInput.LATIN1 = [
    "A",
    "B",
    "C",
    "D",
    "E",
    "a",
    "b",
    "c",
    "d",
    "e",
    "F",
    "G",
    "H",
    "I",
    "J",
    "f",
    "g",
    "h",
    "i",
    "j",
    "K",
    "L",
    "M",
    "N",
    "O",
    "k",
    "l",
    "m",
    "n",
    "o",
    "P",
    "Q",
    "R",
    "S",
    "T",
    "p",
    "q",
    "r",
    "s",
    "t",
    "U",
    "V",
    "W",
    "X",
    "Y",
    "u",
    "v",
    "w",
    "x",
    "y",
    "Z",
    "[",
    "]",
    "^",
    "_",
    "z",
    "{",
    "}",
    "|",
    "~",
    "0",
    "1",
    "2",
    "3",
    "4",
    "!",
    "#",
    "$",
    "%",
    "&",
    "5",
    "6",
    "7",
    "8",
    "9",
    "(",
    ")",
    "*",
    "+",
    "-",
    "/",
    "=",
    "@",
    "<",
    ">",
    ":",
    ";",
    " ",
    "Page",
    "OK"
  ];
  Window_NameInput.LATIN2 = [
    "\xC1",
    "\xC9",
    "\xCD",
    "\xD3",
    "\xDA",
    "\xE1",
    "\xE9",
    "\xED",
    "\xF3",
    "\xFA",
    "\xC0",
    "\xC8",
    "\xCC",
    "\xD2",
    "\xD9",
    "\xE0",
    "\xE8",
    "\xEC",
    "\xF2",
    "\xF9",
    "\xC2",
    "\xCA",
    "\xCE",
    "\xD4",
    "\xDB",
    "\xE2",
    "\xEA",
    "\xEE",
    "\xF4",
    "\xFB",
    "\xC4",
    "\xCB",
    "\xCF",
    "\xD6",
    "\xDC",
    "\xE4",
    "\xEB",
    "\xEF",
    "\xF6",
    "\xFC",
    "\u0100",
    "\u0112",
    "\u012A",
    "\u014C",
    "\u016A",
    "\u0101",
    "\u0113",
    "\u012B",
    "\u014D",
    "\u016B",
    "\xC3",
    "\xC5",
    "\xC6",
    "\xC7",
    "\xD0",
    "\xE3",
    "\xE5",
    "\xE6",
    "\xE7",
    "\xF0",
    "\xD1",
    "\xD5",
    "\xD8",
    "\u0160",
    "\u0174",
    "\xF1",
    "\xF5",
    "\xF8",
    "\u0161",
    "\u0175",
    "\xDD",
    "\u0176",
    "\u0178",
    "\u017D",
    "\xDE",
    "\xFD",
    "\xFF",
    "\u0177",
    "\u017E",
    "\xFE",
    "\u0132",
    "\u0152",
    "\u0133",
    "\u0153",
    "\xDF",
    "\xAB",
    "\xBB",
    " ",
    "Page",
    "OK"
  ];
  Window_NameInput.RUSSIA = [
    "\u0410",
    "\u0411",
    "\u0412",
    "\u0413",
    "\u0414",
    "\u0430",
    "\u0431",
    "\u0432",
    "\u0433",
    "\u0434",
    "\u0415",
    "\u0401",
    "\u0416",
    "\u0417",
    "\u0418",
    "\u0435",
    "\u0451",
    "\u0436",
    "\u0437",
    "\u0438",
    "\u0419",
    "\u041A",
    "\u041B",
    "\u041C",
    "\u041D",
    "\u0439",
    "\u043A",
    "\u043B",
    "\u043C",
    "\u043D",
    "\u041E",
    "\u041F",
    "\u0420",
    "\u0421",
    "\u0422",
    "\u043E",
    "\u043F",
    "\u0440",
    "\u0441",
    "\u0442",
    "\u0423",
    "\u0424",
    "\u0425",
    "\u0426",
    "\u0427",
    "\u0443",
    "\u0444",
    "\u0445",
    "\u0446",
    "\u0447",
    "\u0428",
    "\u0429",
    "\u042A",
    "\u042B",
    "\u042C",
    "\u0448",
    "\u0449",
    "\u044A",
    "\u044B",
    "\u044C",
    "\u042D",
    "\u042E",
    "\u042F",
    "^",
    "_",
    "\u044D",
    "\u044E",
    "\u044F",
    "%",
    "&",
    "0",
    "1",
    "2",
    "3",
    "4",
    "(",
    ")",
    "*",
    "+",
    "-",
    "5",
    "6",
    "7",
    "8",
    "9",
    ":",
    ";",
    " ",
    "",
    "OK"
  ];
  Window_NameInput.JAPAN1 = [
    "\u3042",
    "\u3044",
    "\u3046",
    "\u3048",
    "\u304A",
    "\u304C",
    "\u304E",
    "\u3050",
    "\u3052",
    "\u3054",
    "\u304B",
    "\u304D",
    "\u304F",
    "\u3051",
    "\u3053",
    "\u3056",
    "\u3058",
    "\u305A",
    "\u305C",
    "\u305E",
    "\u3055",
    "\u3057",
    "\u3059",
    "\u305B",
    "\u305D",
    "\u3060",
    "\u3062",
    "\u3065",
    "\u3067",
    "\u3069",
    "\u305F",
    "\u3061",
    "\u3064",
    "\u3066",
    "\u3068",
    "\u3070",
    "\u3073",
    "\u3076",
    "\u3079",
    "\u307C",
    "\u306A",
    "\u306B",
    "\u306C",
    "\u306D",
    "\u306E",
    "\u3071",
    "\u3074",
    "\u3077",
    "\u307A",
    "\u307D",
    "\u306F",
    "\u3072",
    "\u3075",
    "\u3078",
    "\u307B",
    "\u3041",
    "\u3043",
    "\u3045",
    "\u3047",
    "\u3049",
    "\u307E",
    "\u307F",
    "\u3080",
    "\u3081",
    "\u3082",
    "\u3063",
    "\u3083",
    "\u3085",
    "\u3087",
    "\u308E",
    "\u3084",
    "\u3086",
    "\u3088",
    "\u308F",
    "\u3093",
    "\u30FC",
    "\uFF5E",
    "\u30FB",
    "\uFF1D",
    "\u2606",
    "\u3089",
    "\u308A",
    "\u308B",
    "\u308C",
    "\u308D",
    "\u3094",
    "\u3092",
    "\u3000",
    "\u30AB\u30CA",
    "\u6C7A\u5B9A"
  ];
  Window_NameInput.JAPAN2 = [
    "\u30A2",
    "\u30A4",
    "\u30A6",
    "\u30A8",
    "\u30AA",
    "\u30AC",
    "\u30AE",
    "\u30B0",
    "\u30B2",
    "\u30B4",
    "\u30AB",
    "\u30AD",
    "\u30AF",
    "\u30B1",
    "\u30B3",
    "\u30B6",
    "\u30B8",
    "\u30BA",
    "\u30BC",
    "\u30BE",
    "\u30B5",
    "\u30B7",
    "\u30B9",
    "\u30BB",
    "\u30BD",
    "\u30C0",
    "\u30C2",
    "\u30C5",
    "\u30C7",
    "\u30C9",
    "\u30BF",
    "\u30C1",
    "\u30C4",
    "\u30C6",
    "\u30C8",
    "\u30D0",
    "\u30D3",
    "\u30D6",
    "\u30D9",
    "\u30DC",
    "\u30CA",
    "\u30CB",
    "\u30CC",
    "\u30CD",
    "\u30CE",
    "\u30D1",
    "\u30D4",
    "\u30D7",
    "\u30DA",
    "\u30DD",
    "\u30CF",
    "\u30D2",
    "\u30D5",
    "\u30D8",
    "\u30DB",
    "\u30A1",
    "\u30A3",
    "\u30A5",
    "\u30A7",
    "\u30A9",
    "\u30DE",
    "\u30DF",
    "\u30E0",
    "\u30E1",
    "\u30E2",
    "\u30C3",
    "\u30E3",
    "\u30E5",
    "\u30E7",
    "\u30EE",
    "\u30E4",
    "\u30E6",
    "\u30E8",
    "\u30EF",
    "\u30F3",
    "\u30FC",
    "\uFF5E",
    "\u30FB",
    "\uFF1D",
    "\u2606",
    "\u30E9",
    "\u30EA",
    "\u30EB",
    "\u30EC",
    "\u30ED",
    "\u30F4",
    "\u30F2",
    "\u3000",
    "\u82F1\u6570",
    "\u6C7A\u5B9A"
  ];
  Window_NameInput.JAPAN3 = [
    "\uFF21",
    "\uFF22",
    "\uFF23",
    "\uFF24",
    "\uFF25",
    "\uFF41",
    "\uFF42",
    "\uFF43",
    "\uFF44",
    "\uFF45",
    "\uFF26",
    "\uFF27",
    "\uFF28",
    "\uFF29",
    "\uFF2A",
    "\uFF46",
    "\uFF47",
    "\uFF48",
    "\uFF49",
    "\uFF4A",
    "\uFF2B",
    "\uFF2C",
    "\uFF2D",
    "\uFF2E",
    "\uFF2F",
    "\uFF4B",
    "\uFF4C",
    "\uFF4D",
    "\uFF4E",
    "\uFF4F",
    "\uFF30",
    "\uFF31",
    "\uFF32",
    "\uFF33",
    "\uFF34",
    "\uFF50",
    "\uFF51",
    "\uFF52",
    "\uFF53",
    "\uFF54",
    "\uFF35",
    "\uFF36",
    "\uFF37",
    "\uFF38",
    "\uFF39",
    "\uFF55",
    "\uFF56",
    "\uFF57",
    "\uFF58",
    "\uFF59",
    "\uFF3A",
    "\uFF3B",
    "\uFF3D",
    "\uFF3E",
    "\uFF3F",
    "\uFF5A",
    "\uFF5B",
    "\uFF5D",
    "\uFF5C",
    "\uFF5E",
    "\uFF10",
    "\uFF11",
    "\uFF12",
    "\uFF13",
    "\uFF14",
    "\uFF01",
    "\uFF03",
    "\uFF04",
    "\uFF05",
    "\uFF06",
    "\uFF15",
    "\uFF16",
    "\uFF17",
    "\uFF18",
    "\uFF19",
    "\uFF08",
    "\uFF09",
    "\uFF0A",
    "\uFF0B",
    "\uFF0D",
    "\uFF0F",
    "\uFF1D",
    "\uFF20",
    "\uFF1C",
    "\uFF1E",
    "\uFF1A",
    "\uFF1B",
    "\u3000",
    "\u304B\u306A",
    "\u6C7A\u5B9A"
  ];
  var Window_NameInput_default = Window_NameInput;

  // src-www/js/rpg_scenes/Scene_Name.js
  var Scene_Name = class extends Scene_MenuBase_default {
    constructor(...args) {
      super(...args);
      this.initialize(...args);
    }
    initialize() {
      super.initialize();
    }
    prepare(actorId, maxLength) {
      this._actorId = actorId;
      this._maxLength = maxLength;
    }
    create() {
      super.create();
      this._actor = self.$gameActors.actor(this._actorId);
      this.createEditWindow();
      this.createInputWindow();
    }
    start() {
      super.start();
      this._editWindow.refresh();
    }
    createEditWindow() {
      this._editWindow = new Window_NameEdit_default(this._actor, this._maxLength);
      this.addWindow(this._editWindow);
    }
    createInputWindow() {
      this._inputWindow = new Window_NameInput_default(this._editWindow);
      this._inputWindow.setHandler("ok", this.onInputOk.bind(this));
      this.addWindow(this._inputWindow);
    }
    onInputOk() {
      this._actor.setName(this._editWindow.name());
      this.popScene();
    }
  };
  var Scene_Name_default = Scene_Name;

  // src-www/js/rpg_objects/Game_Interpreter.js
  var _Game_Interpreter = class {
    constructor(...args) {
      this.initialize(...args);
    }
    initialize(depth) {
      this._depth = depth || 0;
      this.checkOverflow();
      this.clear();
      this._branch = {};
      this._params = [];
      this._indent = 0;
      this._frameCount = 0;
      this._freezeChecker = 0;
    }
    checkOverflow() {
      if (this._depth >= 100) {
        throw new Error("Common event calls exceeded the limit");
      }
    }
    clear() {
      this._mapId = 0;
      this._eventId = 0;
      this._list = null;
      this._index = 0;
      this._waitCount = 0;
      this._waitMode = "";
      this._comments = "";
      this._eventInfo = null;
      this._character = null;
      this._childInterpreter = null;
    }
    setup(list, eventId) {
      this.clear();
      this._mapId = self.$gameMap.mapId();
      this._eventId = eventId || 0;
      this._list = list;
      _Game_Interpreter.requestImages(list);
    }
    eventId() {
      return this._eventId;
    }
    isOnCurrentMap() {
      return this._mapId === self.$gameMap.mapId();
    }
    setEventInfo(eventInfo) {
      this._eventInfo = eventInfo;
    }
    setupReservedCommonEvent() {
      if (self.$gameTemp.isCommonEventReserved()) {
        this.setup(self.$gameTemp.reservedCommonEvent().list);
        this.setEventInfo({
          eventType: "common_event",
          commonEventId: self.$gameTemp.reservedCommonEventId()
        });
        self.$gameTemp.clearCommonEvent();
        return true;
      } else {
        return false;
      }
    }
    isRunning() {
      return !!this._list;
    }
    update() {
      while (this.isRunning()) {
        if (this.updateChild() || this.updateWait()) {
          break;
        }
        if (SceneManager_default.isSceneChanging()) {
          break;
        }
        if (!this.executeCommand()) {
          break;
        }
        if (this.checkFreeze()) {
          break;
        }
      }
    }
    updateChild() {
      if (this._childInterpreter) {
        this._childInterpreter.update();
        if (this._childInterpreter.isRunning()) {
          return true;
        } else {
          this._childInterpreter = null;
        }
      }
      return false;
    }
    updateWait() {
      return this.updateWaitCount() || this.updateWaitMode();
    }
    updateWaitCount() {
      if (this._waitCount > 0) {
        this._waitCount--;
        return true;
      }
      return false;
    }
    updateWaitMode() {
      let waiting = false;
      switch (this._waitMode) {
        case "message":
          waiting = self.$gameMessage.isBusy();
          break;
        case "transfer":
          waiting = self.$gamePlayer.isTransferring();
          break;
        case "scroll":
          waiting = self.$gameMap.isScrolling();
          break;
        case "route":
          waiting = this._character.isMoveRouteForcing();
          break;
        case "animation":
          waiting = this._character.isAnimationPlaying();
          break;
        case "balloon":
          waiting = this._character.isBalloonPlaying();
          break;
        case "gather":
          waiting = self.$gamePlayer.areFollowersGathering();
          break;
        case "action":
          waiting = BattleManager_default.isActionForced();
          break;
        case "video":
          waiting = Graphics_default.isVideoPlaying();
          break;
        case "image":
          waiting = !ImageManager_default.isReady();
          break;
      }
      if (!waiting) {
        this._waitMode = "";
      }
      return waiting;
    }
    setWaitMode(waitMode) {
      this._waitMode = waitMode;
    }
    wait(duration) {
      this._waitCount = duration;
    }
    fadeSpeed() {
      return 24;
    }
    executeCommand() {
      const command2 = this.currentCommand();
      if (command2) {
        this._params = command2.parameters;
        this._indent = command2.indent;
        const methodName = `command${command2.code}`;
        if (typeof this[methodName] === "function") {
          try {
            if (!this[methodName]()) {
              return false;
            }
          } catch (error) {
            for (let key in this._eventInfo) {
              error[key] = this._eventInfo[key];
            }
            error.eventCommand = error.eventCommand || "other";
            error.line = error.line || this._index + 1;
            throw error;
          }
        }
        this._index++;
      } else {
        this.terminate();
      }
      return true;
    }
    checkFreeze() {
      if (this._frameCount !== Graphics_default.frameCount) {
        this._frameCount = Graphics_default.frameCount;
        this._freezeChecker = 0;
      }
      if (this._freezeChecker++ >= 1e5) {
        return true;
      } else {
        return false;
      }
    }
    terminate() {
      this._list = null;
      this._comments = "";
    }
    skipBranch() {
      while (this._list[this._index + 1].indent > this._indent) {
        this._index++;
      }
    }
    currentCommand() {
      return this._list[this._index];
    }
    nextEventCode() {
      const command2 = this._list[this._index + 1];
      if (command2) {
        return command2.code;
      } else {
        return 0;
      }
    }
    iterateActorId(param, callback) {
      if (param === 0) {
        self.$gameParty.members().forEach(callback);
      } else {
        const actor2 = self.$gameActors.actor(param);
        if (actor2) {
          callback(actor2);
        }
      }
    }
    iterateActorEx(param1, param2, callback) {
      if (param1 === 0) {
        this.iterateActorId(param2, callback);
      } else {
        this.iterateActorId(self.$gameVariables.value(param2), callback);
      }
    }
    iterateActorIndex(param, callback) {
      if (param < 0) {
        self.$gameParty.members().forEach(callback);
      } else {
        const actor2 = self.$gameParty.members()[param];
        if (actor2) {
          callback(actor2);
        }
      }
    }
    iterateEnemyIndex(param, callback) {
      if (param < 0) {
        self.$gameTroop.members().forEach(callback);
      } else {
        const enemy2 = self.$gameTroop.members()[param];
        if (enemy2) {
          callback(enemy2);
        }
      }
    }
    iterateBattler(param1, param2, callback) {
      if (self.$gameParty.inBattle()) {
        if (param1 === 0) {
          this.iterateEnemyIndex(param2, callback);
        } else {
          this.iterateActorId(param2, callback);
        }
      }
    }
    character(param) {
      if (self.$gameParty.inBattle()) {
        return null;
      } else if (param < 0) {
        return self.$gamePlayer;
      } else if (this.isOnCurrentMap()) {
        return self.$gameMap.event(param > 0 ? param : this._eventId);
      } else {
        return null;
      }
    }
    operateValue(operation, operandType, operand) {
      const value3 = operandType === 0 ? operand : self.$gameVariables.value(operand);
      return operation === 0 ? value3 : -value3;
    }
    changeHp(target2, value3, allowDeath) {
      if (target2.isAlive()) {
        if (!allowDeath && target2.hp <= -value3) {
          value3 = 1 - target2.hp;
        }
        target2.gainHp(value3);
        if (target2.isDead()) {
          target2.performCollapse();
        }
      }
    }
    // Show Text
    command101() {
      if (!self.$gameMessage.isBusy()) {
        self.$gameMessage.setFaceImage(this._params[0], this._params[1]);
        self.$gameMessage.setBackground(this._params[2]);
        self.$gameMessage.setPositionType(this._params[3]);
        while (this.nextEventCode() === 401) {
          this._index++;
          self.$gameMessage.add(this.currentCommand().parameters[0]);
        }
        switch (this.nextEventCode()) {
          case 102:
            this._index++;
            this.setupChoices(this.currentCommand().parameters);
            break;
          case 103:
            this._index++;
            this.setupNumInput(this.currentCommand().parameters);
            break;
          case 104:
            this._index++;
            this.setupItemChoice(this.currentCommand().parameters);
            break;
        }
        this._index++;
        this.setWaitMode("message");
      }
      return false;
    }
    // Show Choices
    command102() {
      if (!self.$gameMessage.isBusy()) {
        this.setupChoices(this._params);
        this._index++;
        this.setWaitMode("message");
      }
      return false;
    }
    setupChoices(params2) {
      const choices = params2[0].clone();
      let cancelType = params2[1];
      const defaultType = params2.length > 2 ? params2[2] : 0;
      const positionType = params2.length > 3 ? params2[3] : 2;
      const background = params2.length > 4 ? params2[4] : 0;
      if (cancelType >= choices.length) {
        cancelType = -2;
      }
      self.$gameMessage.setChoices(choices, defaultType, cancelType);
      self.$gameMessage.setChoiceBackground(background);
      self.$gameMessage.setChoicePositionType(positionType);
      self.$gameMessage.setChoiceCallback((n) => {
        this._branch[this._indent] = n;
      });
    }
    // When [**]
    command402() {
      if (this._branch[this._indent] !== this._params[0]) {
        this.skipBranch();
      }
      return true;
    }
    // When Cancel
    command403() {
      if (this._branch[this._indent] >= 0) {
        this.skipBranch();
      }
      return true;
    }
    // Input Number
    command103() {
      if (!self.$gameMessage.isBusy()) {
        this.setupNumInput(this._params);
        this._index++;
        this.setWaitMode("message");
      }
      return false;
    }
    setupNumInput(params2) {
      self.$gameMessage.setNumberInput(params2[0], params2[1]);
    }
    // Select Item
    command104() {
      if (!self.$gameMessage.isBusy()) {
        this.setupItemChoice(this._params);
        this._index++;
        this.setWaitMode("message");
      }
      return false;
    }
    setupItemChoice(params2) {
      self.$gameMessage.setItemChoice(params2[0], params2[1] || 2);
    }
    // Show Scrolling Text
    command105() {
      if (!self.$gameMessage.isBusy()) {
        self.$gameMessage.setScroll(this._params[0], this._params[1]);
        while (this.nextEventCode() === 405) {
          this._index++;
          self.$gameMessage.add(this.currentCommand().parameters[0]);
        }
        this._index++;
        this.setWaitMode("message");
      }
      return false;
    }
    // Comment
    command108() {
      this._comments = [this._params[0]];
      while (this.nextEventCode() === 408) {
        this._index++;
        this._comments.push(this.currentCommand().parameters[0]);
      }
      return true;
    }
    // Conditional Branch
    command111() {
      let result = false;
      switch (this._params[0]) {
        case 0:
          result = self.$gameSwitches.value(this._params[1]) === (this._params[2] === 0);
          break;
        case 1:
          const value1 = self.$gameVariables.value(this._params[1]);
          let value2;
          if (this._params[2] === 0) {
            value2 = this._params[3];
          } else {
            value2 = self.$gameVariables.value(this._params[3]);
          }
          switch (this._params[4]) {
            case 0:
              result = value1 === value2;
              break;
            case 1:
              result = value1 >= value2;
              break;
            case 2:
              result = value1 <= value2;
              break;
            case 3:
              result = value1 > value2;
              break;
            case 4:
              result = value1 < value2;
              break;
            case 5:
              result = value1 !== value2;
              break;
          }
          break;
        case 2:
          if (this._eventId > 0) {
            const key = [this._mapId, this._eventId, this._params[1]];
            result = self.$gameSelfSwitches.value(key) === (this._params[2] === 0);
          }
          break;
        case 3:
          if (self.$gameTimer.isWorking()) {
            if (this._params[2] === 0) {
              result = self.$gameTimer.seconds() >= this._params[1];
            } else {
              result = self.$gameTimer.seconds() <= this._params[1];
            }
          }
          break;
        case 4:
          const actor = self.$gameActors.actor(this._params[1]);
          if (actor) {
            const n = this._params[3];
            switch (this._params[2]) {
              case 0:
                result = self.$gameParty.members().contains(actor);
                break;
              case 1:
                result = actor.name() === n;
                break;
              case 2:
                result = actor.isClass(self.$dataClasses[n]);
                break;
              case 3:
                result = actor.hasSkill(n);
                break;
              case 4:
                result = actor.hasWeapon(self.$dataWeapons[n]);
                break;
              case 5:
                result = actor.hasArmor(self.$dataArmors[n]);
                break;
              case 6:
                result = actor.isStateAffected(n);
                break;
            }
          }
          break;
        case 5:
          const enemy = self.$gameTroop.members()[this._params[1]];
          if (enemy) {
            switch (this._params[2]) {
              case 0:
                result = enemy.isAlive();
                break;
              case 1:
                result = enemy.isStateAffected(this._params[3]);
                break;
            }
          }
          break;
        case 6:
          const character = this.character(this._params[1]);
          if (character) {
            result = character.direction() === this._params[2];
          }
          break;
        case 7:
          switch (this._params[2]) {
            case 0:
              result = self.$gameParty.gold() >= this._params[1];
              break;
            case 1:
              result = self.$gameParty.gold() <= this._params[1];
              break;
            case 2:
              result = self.$gameParty.gold() < this._params[1];
              break;
          }
          break;
        case 8:
          result = self.$gameParty.hasItem(self.$dataItems[this._params[1]]);
          break;
        case 9:
          result = self.$gameParty.hasItem(
            self.$dataWeapons[this._params[1]],
            this._params[2]
          );
          break;
        case 10:
          result = self.$gameParty.hasItem(
            self.$dataArmors[this._params[1]],
            this._params[2]
          );
          break;
        case 11:
          result = Input_default.isPressed(this._params[1]);
          break;
        case 12:
          try {
            result = !!eval(this._params[1]);
          } catch (error) {
            error.eventCommand = "conditional_branch_script";
            error.content = this._params[1];
            throw error;
          }
          break;
        case 13:
          result = self.$gamePlayer.vehicle() === self.$gameMap.vehicle(this._params[1]);
          break;
      }
      this._branch[this._indent] = result;
      if (this._branch[this._indent] === false) {
        this.skipBranch();
      }
      return true;
    }
    // Else
    command411() {
      if (this._branch[this._indent] !== false) {
        this.skipBranch();
      }
      return true;
    }
    // Loop
    command112() {
      return true;
    }
    // Repeat Above
    command413() {
      do {
        this._index--;
      } while (this.currentCommand().indent !== this._indent);
      return true;
    }
    // Break Loop
    command113() {
      let depth = 0;
      while (this._index < this._list.length - 1) {
        this._index++;
        const command2 = this.currentCommand();
        if (command2.code === 112)
          depth++;
        if (command2.code === 413) {
          if (depth > 0)
            depth--;
          else
            break;
        }
      }
      return true;
    }
    // Exit Event Processing
    command115() {
      this._index = this._list.length;
      return true;
    }
    // Common Event
    command117() {
      const commonEvent = self.$dataCommonEvents[this._params[0]];
      if (commonEvent) {
        const eventId = this.isOnCurrentMap() ? this._eventId : 0;
        this.setupChild(commonEvent.list, eventId);
      }
      return true;
    }
    setupChild(list, eventId) {
      this._childInterpreter = new _Game_Interpreter(this._depth + 1);
      this._childInterpreter.setup(list, eventId);
      this._childInterpreter.setEventInfo({
        eventType: "common_event",
        commonEventId: this._params[0]
      });
    }
    // Label
    command118() {
      return true;
    }
    // Jump to Label
    command119() {
      const labelName = this._params[0];
      for (let i = 0; i < this._list.length; i++) {
        const command2 = this._list[i];
        if (command2.code === 118 && command2.parameters[0] === labelName) {
          this.jumpTo(i);
          return;
        }
      }
      return true;
    }
    jumpTo(index) {
      const lastIndex = this._index;
      const startIndex = Math.min(index, lastIndex);
      const endIndex = Math.max(index, lastIndex);
      let indent = this._indent;
      for (let i = startIndex; i <= endIndex; i++) {
        const newIndent = this._list[i].indent;
        if (newIndent !== indent) {
          this._branch[indent] = null;
          indent = newIndent;
        }
      }
      this._index = index;
    }
    // Control Switches
    command121() {
      for (let i = this._params[0]; i <= this._params[1]; i++) {
        self.$gameSwitches.setValue(i, this._params[2] === 0);
      }
      return true;
    }
    // Control Variables
    command122() {
      let value = 0;
      switch (this._params[3]) {
        case 0:
          value = this._params[4];
          break;
        case 1:
          value = self.$gameVariables.value(this._params[4]);
          break;
        case 2:
          value = this._params[5] - this._params[4] + 1;
          for (let i = this._params[0]; i <= this._params[1]; i++) {
            this.operateVariable(
              i,
              this._params[2],
              this._params[4] + Math.randomInt(value)
            );
          }
          return true;
          break;
        case 3:
          value = this.gameDataOperand(
            this._params[4],
            this._params[5],
            this._params[6]
          );
          break;
        case 4:
          try {
            value = eval(this._params[4]);
          } catch (error) {
            error.eventCommand = "control_variables";
            error.content = this._params[4];
            throw error;
          }
          break;
      }
      for (let i = this._params[0]; i <= this._params[1]; i++) {
        this.operateVariable(i, this._params[2], value);
      }
      return true;
    }
    gameDataOperand(type, param1, param2) {
      switch (type) {
        case 0:
          return self.$gameParty.numItems(self.$dataItems[param1]);
        case 1:
          return self.$gameParty.numItems(self.$dataWeapons[param1]);
        case 2:
          return self.$gameParty.numItems(self.$dataArmors[param1]);
        case 3:
          const actor2 = self.$gameActors.actor(param1);
          if (actor2) {
            switch (param2) {
              case 0:
                return actor2.level;
              case 1:
                return actor2.currentExp();
              case 2:
                return actor2.hp;
              case 3:
                return actor2.mp;
              default:
                if (param2 >= 4 && param2 <= 11) {
                  return actor2.param(param2 - 4);
                }
            }
          }
          break;
        case 4:
          const enemy2 = self.$gameTroop.members()[param1];
          if (enemy2) {
            switch (param2) {
              case 0:
                return enemy2.hp;
              case 1:
                return enemy2.mp;
              default:
                if (param2 >= 2 && param2 <= 9) {
                  return enemy2.param(param2 - 2);
                }
            }
          }
          break;
        case 5:
          const character2 = this.character(param1);
          if (character2) {
            switch (param2) {
              case 0:
                return character2.x;
              case 1:
                return character2.y;
              case 2:
                return character2.direction();
              case 3:
                return character2.screenX();
              case 4:
                return character2.screenY();
            }
          }
          break;
        case 6:
          const actor_party = self.$gameParty.members()[param1];
          return actor_party ? actor_party.actorId() : 0;
        case 7:
          switch (param1) {
            case 0:
              return self.$gameMap.mapId();
            case 1:
              return self.$gameParty.size();
            case 2:
              return self.$gameParty.gold();
            case 3:
              return self.$gameParty.steps();
            case 4:
              return self.$gameSystem.playtime();
            case 5:
              return self.$gameTimer.seconds();
            case 6:
              return self.$gameSystem.saveCount();
            case 7:
              return self.$gameSystem.battleCount();
            case 8:
              return self.$gameSystem.winCount();
            case 9:
              return self.$gameSystem.escapeCount();
          }
          break;
      }
      return 0;
    }
    operateVariable(variableId, operationType, value3) {
      try {
        let oldValue = self.$gameVariables.value(variableId);
        switch (operationType) {
          case 0:
            self.$gameVariables.setValue(variableId, oldValue = value3);
            break;
          case 1:
            self.$gameVariables.setValue(variableId, oldValue + value3);
            break;
          case 2:
            self.$gameVariables.setValue(variableId, oldValue - value3);
            break;
          case 3:
            self.$gameVariables.setValue(variableId, oldValue * value3);
            break;
          case 4:
            self.$gameVariables.setValue(variableId, oldValue / value3);
            break;
          case 5:
            self.$gameVariables.setValue(variableId, oldValue % value3);
            break;
        }
      } catch (e) {
        self.$gameVariables.setValue(variableId, 0);
      }
    }
    // Control Self Switch
    command123() {
      if (this._eventId > 0) {
        const key = [this._mapId, this._eventId, this._params[0]];
        self.$gameSelfSwitches.setValue(key, this._params[1] === 0);
      }
      return true;
    }
    // Control Timer
    command124() {
      if (this._params[0] === 0) {
        self.$gameTimer.start(this._params[1] * 60);
      } else {
        self.$gameTimer.stop();
      }
      return true;
    }
    // Change Gold
    command125() {
      const value3 = this.operateValue(
        this._params[0],
        this._params[1],
        this._params[2]
      );
      self.$gameParty.gainGold(value3);
      return true;
    }
    // Change Items
    command126() {
      const value3 = this.operateValue(
        this._params[1],
        this._params[2],
        this._params[3]
      );
      self.$gameParty.gainItem(self.$dataItems[this._params[0]], value3);
      return true;
    }
    // Change Weapons
    command127() {
      const value3 = this.operateValue(
        this._params[1],
        this._params[2],
        this._params[3]
      );
      self.$gameParty.gainItem(
        self.$dataWeapons[this._params[0]],
        value3,
        this._params[4]
      );
      return true;
    }
    // Change Armors
    command128() {
      const value3 = this.operateValue(
        this._params[1],
        this._params[2],
        this._params[3]
      );
      self.$gameParty.gainItem(
        self.$dataArmors[this._params[0]],
        value3,
        this._params[4]
      );
      return true;
    }
    // Change Party Member
    command129() {
      const actor2 = self.$gameActors.actor(this._params[0]);
      if (actor2) {
        if (this._params[1] === 0) {
          if (this._params[2]) {
            self.$gameActors.actor(this._params[0]).setup(this._params[0]);
          }
          self.$gameParty.addActor(this._params[0]);
        } else {
          self.$gameParty.removeActor(this._params[0]);
        }
      }
      return true;
    }
    // Change Battle BGM
    command132() {
      self.$gameSystem.setBattleBgm(this._params[0]);
      return true;
    }
    // Change Victory ME
    command133() {
      self.$gameSystem.setVictoryMe(this._params[0]);
      return true;
    }
    // Change Save Access
    command134() {
      if (this._params[0] === 0) {
        self.$gameSystem.disableSave();
      } else {
        self.$gameSystem.enableSave();
      }
      return true;
    }
    // Change Menu Access
    command135() {
      if (this._params[0] === 0) {
        self.$gameSystem.disableMenu();
      } else {
        self.$gameSystem.enableMenu();
      }
      return true;
    }
    // Change Encounter Disable
    command136() {
      if (this._params[0] === 0) {
        self.$gameSystem.disableEncounter();
      } else {
        self.$gameSystem.enableEncounter();
      }
      self.$gamePlayer.makeEncounterCount();
      return true;
    }
    // Change Formation Access
    command137() {
      if (this._params[0] === 0) {
        self.$gameSystem.disableFormation();
      } else {
        self.$gameSystem.enableFormation();
      }
      return true;
    }
    // Change Window Color
    command138() {
      self.$gameSystem.setWindowTone(this._params[0]);
      return true;
    }
    // Change Defeat ME
    command139() {
      self.$gameSystem.setDefeatMe(this._params[0]);
      return true;
    }
    // Change Vehicle BGM
    command140() {
      const vehicle = self.$gameMap.vehicle(this._params[0]);
      if (vehicle) {
        vehicle.setBgm(this._params[1]);
      }
      return true;
    }
    // Transfer Player
    command201() {
      if (!self.$gameParty.inBattle() && !self.$gameMessage.isBusy()) {
        let mapId;
        let x;
        let y;
        if (this._params[0] === 0) {
          mapId = this._params[1];
          x = this._params[2];
          y = this._params[3];
        } else {
          mapId = self.$gameVariables.value(this._params[1]);
          x = self.$gameVariables.value(this._params[2]);
          y = self.$gameVariables.value(this._params[3]);
        }
        self.$gamePlayer.reserveTransfer(
          mapId,
          x,
          y,
          this._params[4],
          this._params[5]
        );
        this.setWaitMode("transfer");
        this._index++;
      }
      return false;
    }
    // Set Vehicle Location
    command202() {
      let mapId;
      let x;
      let y;
      if (this._params[1] === 0) {
        mapId = this._params[2];
        x = this._params[3];
        y = this._params[4];
      } else {
        mapId = self.$gameVariables.value(this._params[2]);
        x = self.$gameVariables.value(this._params[3]);
        y = self.$gameVariables.value(this._params[4]);
      }
      const vehicle = self.$gameMap.vehicle(this._params[0]);
      if (vehicle) {
        vehicle.setLocation(mapId, x, y);
      }
      return true;
    }
    // Set Event Location
    command203() {
      const character2 = this.character(this._params[0]);
      if (character2) {
        if (this._params[1] === 0) {
          character2.locate(this._params[2], this._params[3]);
        } else if (this._params[1] === 1) {
          const x = self.$gameVariables.value(this._params[2]);
          const y = self.$gameVariables.value(this._params[3]);
          character2.locate(x, y);
        } else {
          const character22 = this.character(this._params[2]);
          if (character22) {
            character2.swap(character22);
          }
        }
        if (this._params[4] > 0) {
          character2.setDirection(this._params[4]);
        }
      }
      return true;
    }
    // Scroll Map
    command204() {
      if (!self.$gameParty.inBattle()) {
        if (self.$gameMap.isScrolling()) {
          this.setWaitMode("scroll");
          return false;
        }
        self.$gameMap.startScroll(
          this._params[0],
          this._params[1],
          this._params[2]
        );
      }
      return true;
    }
    // Set Movement Route
    command205() {
      self.$gameMap.refreshIfNeeded();
      this._character = this.character(this._params[0]);
      if (this._character) {
        this._character.forceMoveRoute(this._params[1]);
        const eventInfo = JsonEx_default.makeDeepCopy(this._eventInfo);
        eventInfo.line = this._index + 1;
        this._character.setCallerEventInfo(eventInfo);
        if (this._params[1].wait) {
          this.setWaitMode("route");
        }
      }
      return true;
    }
    // Getting On and Off Vehicles
    command206() {
      self.$gamePlayer.getOnOffVehicle();
      return true;
    }
    // Change Transparency
    command211() {
      self.$gamePlayer.setTransparent(this._params[0] === 0);
      return true;
    }
    // Show Animation
    command212() {
      this._character = this.character(this._params[0]);
      if (this._character) {
        this._character.requestAnimation(this._params[1]);
        if (this._params[2]) {
          this.setWaitMode("animation");
        }
      }
      return true;
    }
    // Show Balloon Icon
    command213() {
      this._character = this.character(this._params[0]);
      if (this._character) {
        this._character.requestBalloon(this._params[1]);
        if (this._params[2]) {
          this.setWaitMode("balloon");
        }
      }
      return true;
    }
    // Erase Event
    command214() {
      if (this.isOnCurrentMap() && this._eventId > 0) {
        self.$gameMap.eraseEvent(this._eventId);
      }
      return true;
    }
    // Change Player Followers
    command216() {
      if (this._params[0] === 0) {
        self.$gamePlayer.showFollowers();
      } else {
        self.$gamePlayer.hideFollowers();
      }
      self.$gamePlayer.refresh();
      return true;
    }
    // Gather Followers
    command217() {
      if (!self.$gameParty.inBattle()) {
        self.$gamePlayer.gatherFollowers();
        this.setWaitMode("gather");
      }
      return true;
    }
    // Fadeout Screen
    command221() {
      if (!self.$gameMessage.isBusy()) {
        self.$gameScreen.startFadeOut(this.fadeSpeed());
        this.wait(this.fadeSpeed());
        this._index++;
      }
      return false;
    }
    // Fadein Screen
    command222() {
      if (!self.$gameMessage.isBusy()) {
        self.$gameScreen.startFadeIn(this.fadeSpeed());
        this.wait(this.fadeSpeed());
        this._index++;
      }
      return false;
    }
    // Tint Screen
    command223() {
      self.$gameScreen.startTint(this._params[0], this._params[1]);
      if (this._params[2]) {
        this.wait(this._params[1]);
      }
      return true;
    }
    // Flash Screen
    command224() {
      self.$gameScreen.startFlash(this._params[0], this._params[1]);
      if (this._params[2]) {
        this.wait(this._params[1]);
      }
      return true;
    }
    // Shake Screen
    command225() {
      self.$gameScreen.startShake(
        this._params[0],
        this._params[1],
        this._params[2]
      );
      if (this._params[3]) {
        this.wait(this._params[2]);
      }
      return true;
    }
    // Wait
    command230() {
      this.wait(this._params[0]);
      return true;
    }
    // Show Picture
    command231() {
      let x;
      let y;
      if (this._params[3] === 0) {
        x = this._params[4];
        y = this._params[5];
      } else {
        x = self.$gameVariables.value(this._params[4]);
        y = self.$gameVariables.value(this._params[5]);
      }
      self.$gameScreen.showPicture(
        this._params[0],
        this._params[1],
        this._params[2],
        x,
        y,
        this._params[6],
        this._params[7],
        this._params[8],
        this._params[9]
      );
      return true;
    }
    // Move Picture
    command232() {
      let x;
      let y;
      if (this._params[3] === 0) {
        x = this._params[4];
        y = this._params[5];
      } else {
        x = self.$gameVariables.value(this._params[4]);
        y = self.$gameVariables.value(this._params[5]);
      }
      self.$gameScreen.movePicture(
        this._params[0],
        this._params[2],
        x,
        y,
        this._params[6],
        this._params[7],
        this._params[8],
        this._params[9],
        this._params[10]
      );
      if (this._params[11]) {
        this.wait(this._params[10]);
      }
      return true;
    }
    // Rotate Picture
    command233() {
      self.$gameScreen.rotatePicture(this._params[0], this._params[1]);
      return true;
    }
    // Tint Picture
    command234() {
      self.$gameScreen.tintPicture(
        this._params[0],
        this._params[1],
        this._params[2]
      );
      if (this._params[3]) {
        this.wait(this._params[2]);
      }
      return true;
    }
    // Erase Picture
    command235() {
      self.$gameScreen.erasePicture(this._params[0]);
      return true;
    }
    // Set Weather Effect
    command236() {
      if (!self.$gameParty.inBattle()) {
        self.$gameScreen.changeWeather(
          this._params[0],
          this._params[1],
          this._params[2]
        );
        if (this._params[3]) {
          this.wait(this._params[2]);
        }
      }
      return true;
    }
    // Play BGM
    command241() {
      AudioManager_default.playBgm(this._params[0]);
      return true;
    }
    // Fadeout BGM
    command242() {
      AudioManager_default.fadeOutBgm(this._params[0]);
      return true;
    }
    // Save BGM
    command243() {
      self.$gameSystem.saveBgm();
      return true;
    }
    // Resume BGM
    command244() {
      self.$gameSystem.replayBgm();
      return true;
    }
    // Play BGS
    command245() {
      AudioManager_default.playBgs(this._params[0]);
      return true;
    }
    // Fadeout BGS
    command246() {
      AudioManager_default.fadeOutBgs(this._params[0]);
      return true;
    }
    // Play ME
    command249() {
      AudioManager_default.playMe(this._params[0]);
      return true;
    }
    // Play SE
    command250() {
      AudioManager_default.playSe(this._params[0]);
      return true;
    }
    // Stop SE
    command251() {
      AudioManager_default.stopSe();
      return true;
    }
    // Play Movie
    command261() {
      if (!self.$gameMessage.isBusy()) {
        const name = this._params[0];
        if (name.length > 0) {
          const ext = this.videoFileExt();
          Graphics_default.playVideo(`movies/${name}${ext}`);
          this.setWaitMode("video");
        }
        this._index++;
      }
      return false;
    }
    videoFileExt() {
      if (Graphics_default.canPlayVideoType("video/webm") && !Utils_default.isMobileDevice()) {
        return ".webm";
      } else {
        return ".mp4";
      }
    }
    // Change Map Name Display
    command281() {
      if (this._params[0] === 0) {
        self.$gameMap.enableNameDisplay();
      } else {
        self.$gameMap.disableNameDisplay();
      }
      return true;
    }
    // Change Tileset
    command282() {
      const tileset = self.$dataTilesets[this._params[0]];
      if (!this._imageReservationId) {
        this._imageReservationId = Utils_default.generateRuntimeId();
      }
      const allReady = tileset.tilesetNames.map(function(tilesetName) {
        return ImageManager_default.reserveTileset(
          tilesetName,
          0,
          this._imageReservationId
        );
      }, this).every((bitmap) => bitmap.isReady());
      if (allReady) {
        self.$gameMap.changeTileset(this._params[0]);
        ImageManager_default.releaseReservation(this._imageReservationId);
        this._imageReservationId = null;
        return true;
      } else {
        return false;
      }
    }
    // Change Battle Back
    command283() {
      self.$gameMap.changeBattleback(this._params[0], this._params[1]);
      return true;
    }
    // Change Parallax
    command284() {
      self.$gameMap.changeParallax(
        this._params[0],
        this._params[1],
        this._params[2],
        this._params[3],
        this._params[4]
      );
      return true;
    }
    // Get Location Info
    command285() {
      let x;
      let y;
      let value3;
      if (this._params[2] === 0) {
        x = this._params[3];
        y = this._params[4];
      } else {
        x = self.$gameVariables.value(this._params[3]);
        y = self.$gameVariables.value(this._params[4]);
      }
      switch (this._params[1]) {
        case 0:
          value3 = self.$gameMap.terrainTag(x, y);
          break;
        case 1:
          value3 = self.$gameMap.eventIdXy(x, y);
          break;
        case 2:
        case 3:
        case 4:
        case 5:
          value3 = self.$gameMap.tileId(x, y, this._params[1] - 2);
          break;
        default:
          value3 = self.$gameMap.regionId(x, y);
          break;
      }
      self.$gameVariables.setValue(this._params[0], value3);
      return true;
    }
    // Battle Processing
    command301() {
      if (!self.$gameParty.inBattle()) {
        let troopId;
        if (this._params[0] === 0) {
          troopId = this._params[1];
        } else if (this._params[0] === 1) {
          troopId = self.$gameVariables.value(this._params[1]);
        } else {
          troopId = self.$gamePlayer.makeEncounterTroopId();
        }
        if (self.$dataTroops[troopId]) {
          BattleManager_default.setup(troopId, this._params[2], this._params[3]);
          BattleManager_default.setEventCallback((n) => {
            this._branch[this._indent] = n;
          });
          self.$gamePlayer.makeEncounterCount();
          SceneManager_default.push(Scene_Battle_default);
        }
      }
      return true;
    }
    // If Win
    command601() {
      if (this._branch[this._indent] !== 0) {
        this.skipBranch();
      }
      return true;
    }
    // If Escape
    command602() {
      if (this._branch[this._indent] !== 1) {
        this.skipBranch();
      }
      return true;
    }
    // If Lose
    command603() {
      if (this._branch[this._indent] !== 2) {
        this.skipBranch();
      }
      return true;
    }
    // Shop Processing
    command302() {
      if (!self.$gameParty.inBattle()) {
        const goods = [this._params];
        while (this.nextEventCode() === 605) {
          this._index++;
          goods.push(this.currentCommand().parameters);
        }
        SceneManager_default.push(Scene_Shop_default);
        SceneManager_default.prepareNextScene(goods, this._params[4]);
      }
      return true;
    }
    // Name Input Processing
    command303() {
      if (!self.$gameParty.inBattle()) {
        if (self.$dataActors[this._params[0]]) {
          SceneManager_default.push(Scene_Name_default);
          SceneManager_default.prepareNextScene(this._params[0], this._params[1]);
        }
      }
      return true;
    }
    // Change HP
    command311() {
      const value3 = this.operateValue(
        this._params[2],
        this._params[3],
        this._params[4]
      );
      this.iterateActorEx(this._params[0], this._params[1], (actor2) => {
        this.changeHp(actor2, value3, this._params[5]);
      });
      return true;
    }
    // Change MP
    command312() {
      const value3 = this.operateValue(
        this._params[2],
        this._params[3],
        this._params[4]
      );
      this.iterateActorEx(this._params[0], this._params[1], (actor2) => {
        actor2.gainMp(value3);
      });
      return true;
    }
    // Change TP
    command326() {
      const value3 = this.operateValue(
        this._params[2],
        this._params[3],
        this._params[4]
      );
      this.iterateActorEx(this._params[0], this._params[1], (actor2) => {
        actor2.gainTp(value3);
      });
      return true;
    }
    // Change State
    command313() {
      this.iterateActorEx(this._params[0], this._params[1], (actor2) => {
        const alreadyDead = actor2.isDead();
        if (this._params[2] === 0) {
          actor2.addState(this._params[3]);
        } else {
          actor2.removeState(this._params[3]);
        }
        if (actor2.isDead() && !alreadyDead) {
          actor2.performCollapse();
        }
        actor2.clearResult();
      });
      return true;
    }
    // Recover All
    command314() {
      this.iterateActorEx(this._params[0], this._params[1], (actor2) => {
        actor2.recoverAll();
      });
      return true;
    }
    // Change EXP
    command315() {
      const value3 = this.operateValue(
        this._params[2],
        this._params[3],
        this._params[4]
      );
      this.iterateActorEx(this._params[0], this._params[1], (actor2) => {
        actor2.changeExp(actor2.currentExp() + value3, this._params[5]);
      });
      return true;
    }
    // Change Level
    command316() {
      const value3 = this.operateValue(
        this._params[2],
        this._params[3],
        this._params[4]
      );
      this.iterateActorEx(this._params[0], this._params[1], (actor2) => {
        actor2.changeLevel(actor2.level + value3, this._params[5]);
      });
      return true;
    }
    // Change Parameter
    command317() {
      const value3 = this.operateValue(
        this._params[3],
        this._params[4],
        this._params[5]
      );
      this.iterateActorEx(this._params[0], this._params[1], (actor2) => {
        actor2.addParam(this._params[2], value3);
      });
      return true;
    }
    // Change Skill
    command318() {
      this.iterateActorEx(this._params[0], this._params[1], (actor2) => {
        if (this._params[2] === 0) {
          actor2.learnSkill(this._params[3]);
        } else {
          actor2.forgetSkill(this._params[3]);
        }
      });
      return true;
    }
    // Change Equipment
    command319() {
      const actor2 = self.$gameActors.actor(this._params[0]);
      if (actor2) {
        actor2.changeEquipById(this._params[1], this._params[2]);
      }
      return true;
    }
    // Change Name
    command320() {
      const actor2 = self.$gameActors.actor(this._params[0]);
      if (actor2) {
        actor2.setName(this._params[1]);
      }
      return true;
    }
    // Change Class
    command321() {
      const actor2 = self.$gameActors.actor(this._params[0]);
      if (actor2 && self.$dataClasses[this._params[1]]) {
        actor2.changeClass(this._params[1], this._params[2]);
      }
      return true;
    }
    // Change Actor Images
    command322() {
      const actor2 = self.$gameActors.actor(this._params[0]);
      if (actor2) {
        actor2.setCharacterImage(this._params[1], this._params[2]);
        actor2.setFaceImage(this._params[3], this._params[4]);
        actor2.setBattlerImage(this._params[5]);
      }
      self.$gamePlayer.refresh();
      return true;
    }
    // Change Vehicle Image
    command323() {
      const vehicle = self.$gameMap.vehicle(this._params[0]);
      if (vehicle) {
        vehicle.setImage(this._params[1], this._params[2]);
      }
      return true;
    }
    // Change Nickname
    command324() {
      const actor2 = self.$gameActors.actor(this._params[0]);
      if (actor2) {
        actor2.setNickname(this._params[1]);
      }
      return true;
    }
    // Change Profile
    command325() {
      const actor2 = self.$gameActors.actor(this._params[0]);
      if (actor2) {
        actor2.setProfile(this._params[1]);
      }
      return true;
    }
    // Change Enemy HP
    command331() {
      const value3 = this.operateValue(
        this._params[1],
        this._params[2],
        this._params[3]
      );
      this.iterateEnemyIndex(this._params[0], (enemy2) => {
        this.changeHp(enemy2, value3, this._params[4]);
      });
      return true;
    }
    // Change Enemy MP
    command332() {
      const value3 = this.operateValue(
        this._params[1],
        this._params[2],
        this._params[3]
      );
      this.iterateEnemyIndex(this._params[0], (enemy2) => {
        enemy2.gainMp(value3);
      });
      return true;
    }
    // Change Enemy TP
    command342() {
      const value3 = this.operateValue(
        this._params[1],
        this._params[2],
        this._params[3]
      );
      this.iterateEnemyIndex(this._params[0], (enemy2) => {
        enemy2.gainTp(value3);
      });
      return true;
    }
    // Change Enemy State
    command333() {
      this.iterateEnemyIndex(this._params[0], (enemy2) => {
        const alreadyDead = enemy2.isDead();
        if (this._params[1] === 0) {
          enemy2.addState(this._params[2]);
        } else {
          enemy2.removeState(this._params[2]);
        }
        if (enemy2.isDead() && !alreadyDead) {
          enemy2.performCollapse();
        }
        enemy2.clearResult();
      });
      return true;
    }
    // Enemy Recover All
    command334() {
      this.iterateEnemyIndex(this._params[0], (enemy2) => {
        enemy2.recoverAll();
      });
      return true;
    }
    // Enemy Appear
    command335() {
      this.iterateEnemyIndex(this._params[0], (enemy2) => {
        enemy2.appear();
        self.$gameTroop.makeUniqueNames();
      });
      return true;
    }
    // Enemy Transform
    command336() {
      this.iterateEnemyIndex(this._params[0], (enemy2) => {
        enemy2.transform(this._params[1]);
        self.$gameTroop.makeUniqueNames();
      });
      return true;
    }
    // Show Battle Animation
    command337() {
      if (this._params[2] == true) {
        this.iterateEnemyIndex(-1, (enemy2) => {
          if (enemy2.isAlive()) {
            enemy2.startAnimation(this._params[1], false, 0);
          }
        });
      } else {
        this.iterateEnemyIndex(this._params[0], (enemy2) => {
          if (enemy2.isAlive()) {
            enemy2.startAnimation(this._params[1], false, 0);
          }
        });
      }
      return true;
    }
    // Force Action
    command339() {
      this.iterateBattler(this._params[0], this._params[1], (battler) => {
        if (!battler.isDeathStateAffected()) {
          battler.forceAction(this._params[2], this._params[3]);
          BattleManager_default.forceAction(battler);
          this.setWaitMode("action");
        }
      });
      return true;
    }
    // Abort Battle
    command340() {
      BattleManager_default.abort();
      return true;
    }
    // Open Menu Screen
    command351() {
      if (!self.$gameParty.inBattle()) {
        SceneManager_default.push(Scene_Menu_default);
        Window_MenuCommand_default.initCommandPosition();
      }
      return true;
    }
    // Open Save Screen
    command352() {
      if (!self.$gameParty.inBattle()) {
        SceneManager_default.push(Scene_Save_default);
      }
      return true;
    }
    // Game Over
    command353() {
      SceneManager_default.goto(Scene_Gameover_default);
      return true;
    }
    // Return to Title Screen
    command354() {
      SceneManager_default.goto(Scene_Title_default);
      return true;
    }
    // Script
    command355() {
      const startLine = this._index + 1;
      let script = `${this.currentCommand().parameters[0]}
`;
      while (this.nextEventCode() === 655) {
        this._index++;
        script += `${this.currentCommand().parameters[0]}
`;
      }
      const endLine = this._index + 1;
      try {
        eval(script);
      } catch (error) {
        error.line = `${startLine}-${endLine}`;
        error.eventCommand = "script";
        error.content = script;
        throw error;
      }
      return true;
    }
    // Plugin Command
    command356() {
      const args = this._params[0].split(" ");
      const command2 = args.shift();
      try {
        this.pluginCommand(command2, args);
      } catch (error) {
        error.eventCommand = "plugin_command";
        error.content = this._params[0];
        throw error;
      }
      return true;
    }
    pluginCommand(command2, args) {
    }
    static requestImagesByPluginCommand(command2, args) {
    }
    static requestImagesForCommand({ parameters, code }) {
      const params2 = parameters;
      switch (code) {
        case 101:
          ImageManager_default.requestFace(params2[0]);
          break;
        case 129:
          const actor2 = self.$gameActors.actor(params2[0]);
          if (actor2 && params2[1] === 0) {
            const name2 = actor2.characterName();
            ImageManager_default.requestCharacter(name2);
          }
          break;
        case 205:
          if (params2[1]) {
            params2[1].list.forEach(({ parameters: parameters2, code: code2 }) => {
              const params3 = parameters2;
              if (code2 === Game_Character_default.ROUTE_CHANGE_IMAGE) {
                ImageManager_default.requestCharacter(params3[0]);
              }
            });
          }
          break;
        case 212:
        case 337:
          if (params2[1]) {
            const animation = self.$dataAnimations[params2[1]];
            const name1 = animation.animation1Name;
            const name2 = animation.animation2Name;
            const hue1 = animation.animation1Hue;
            const hue2 = animation.animation2Hue;
            ImageManager_default.requestAnimation(name1, hue1);
            ImageManager_default.requestAnimation(name2, hue2);
          }
          break;
        case 216:
          if (params2[0] === 0) {
            self.$gamePlayer.followers().forEach((follower) => {
              const name2 = follower.characterName();
              ImageManager_default.requestCharacter(name2);
            });
          }
          break;
        case 231:
          ImageManager_default.requestPicture(params2[1]);
          break;
        case 282:
          const tileset = self.$dataTilesets[params2[0]];
          tileset.tilesetNames.forEach((tilesetName) => {
            ImageManager_default.requestTileset(tilesetName);
          });
          break;
        case 283:
          if (self.$gameParty.inBattle()) {
            ImageManager_default.requestBattleback1(params2[0]);
            ImageManager_default.requestBattleback2(params2[1]);
          }
          break;
        case 284:
          if (!self.$gameParty.inBattle()) {
            ImageManager_default.requestParallax(params2[0]);
          }
          break;
        case 322:
          ImageManager_default.requestCharacter(params2[1]);
          ImageManager_default.requestFace(params2[3]);
          ImageManager_default.requestSvActor(params2[5]);
          break;
        case 323:
          const vehicle = self.$gameMap.vehicle(params2[0]);
          if (vehicle) {
            ImageManager_default.requestCharacter(params2[1]);
          }
          break;
        case 336:
          const enemy2 = self.$dataEnemies[params2[1]];
          const name = enemy2.battlerName;
          const hue = enemy2.battlerHue;
          if (self.$gameSystem.isSideView()) {
            ImageManager_default.requestSvEnemy(name, hue);
          } else {
            ImageManager_default.requestEnemy(name, hue);
          }
          break;
        case 356:
          const args = params2[0].split(" ");
          const commandName = args.shift();
          _Game_Interpreter.requestImagesByPluginCommand(commandName, args);
          break;
      }
    }
    static requestImagesByChildEvent({ parameters }, commonList) {
      const params2 = parameters;
      const commonEvent = self.$dataCommonEvents[params2[0]];
      if (commonEvent) {
        if (!commonList) {
          commonList = [];
        }
        if (!commonList.contains(params2[0])) {
          commonList.push(params2[0]);
          _Game_Interpreter.requestImages(commonEvent.list, commonList);
        }
      }
    }
    static requestImages(list, commonList) {
      if (!list) {
        return;
      }
      const len = list.length;
      for (let i = 0; i < len; i += 1) {
        const command2 = list[i];
        if (command2.code === 117) {
          _Game_Interpreter.requestImagesByChildEvent(command2, commonList);
        } else {
          _Game_Interpreter.requestImagesForCommand(command2);
        }
      }
    }
  };
  var Game_Interpreter_default = _Game_Interpreter;

  // src-www/js/rpg_objects/Game_Troop.js
  var Game_Troop = class extends Game_Unit_default {
    constructor(...args) {
      super(...args);
      this.initialize(...args);
    }
    initialize() {
      super.initialize();
      this._interpreter = new Game_Interpreter_default();
      this.clear();
    }
    isEventRunning() {
      return this._interpreter.isRunning();
    }
    updateInterpreter() {
      this._interpreter.update();
    }
    turnCount() {
      return this._turnCount;
    }
    members() {
      return this._enemies;
    }
    clear() {
      this._interpreter.clear();
      this._troopId = 0;
      this._eventFlags = {};
      this._enemies = [];
      this._turnCount = 0;
      this._namesCount = {};
    }
    troop() {
      return self.$dataTroops[this._troopId];
    }
    setup(troopId) {
      this.clear();
      this._troopId = troopId;
      this._enemies = [];
      this.troop().members.forEach(function(member) {
        if (self.$dataEnemies[member.enemyId]) {
          const enemyId = member.enemyId;
          const x = member.x;
          const y = member.y;
          const enemy2 = new Game_Enemy_default(enemyId, x, y);
          if (member.hidden) {
            enemy2.hide();
          }
          this._enemies.push(enemy2);
        }
      }, this);
      this.makeUniqueNames();
    }
    makeUniqueNames() {
      const table = this.letterTable();
      this.members().forEach(function(enemy2) {
        if (enemy2.isAlive() && enemy2.isLetterEmpty()) {
          const name = enemy2.originalName();
          const n = this._namesCount[name] || 0;
          enemy2.setLetter(table[n % table.length]);
          this._namesCount[name] = n + 1;
        }
      }, this);
      this.members().forEach(function(enemy2) {
        const name = enemy2.originalName();
        if (this._namesCount[name] >= 2) {
          enemy2.setPlural(true);
        }
      }, this);
    }
    letterTable() {
      return self.$gameSystem.isCJK() ? Game_Troop.LETTER_TABLE_FULL : Game_Troop.LETTER_TABLE_HALF;
    }
    enemyNames() {
      const names = [];
      this.members().forEach((enemy2) => {
        const name = enemy2.originalName();
        if (enemy2.isAlive() && !names.contains(name)) {
          names.push(name);
        }
      });
      return names;
    }
    meetsConditions({ conditions }) {
      const c = conditions;
      if (!c.turnEnding && !c.turnValid && !c.enemyValid && !c.actorValid && !c.switchValid) {
        return false;
      }
      if (c.turnEnding) {
        if (!BattleManager_default.isTurnEnd()) {
          return false;
        }
      }
      if (c.turnValid) {
        const n = this._turnCount;
        const a2 = c.turnA;
        const b2 = c.turnB;
        if (b2 === 0 && n !== a2) {
          return false;
        }
        if (b2 > 0 && (n < 1 || n < a2 || n % b2 !== a2 % b2)) {
          return false;
        }
      }
      if (c.enemyValid) {
        const enemy2 = self.$gameTroop.members()[c.enemyIndex];
        if (!enemy2 || enemy2.hpRate() * 100 > c.enemyHp) {
          return false;
        }
      }
      if (c.actorValid) {
        const actor2 = self.$gameActors.actor(c.actorId);
        if (!actor2 || actor2.hpRate() * 100 > c.actorHp) {
          return false;
        }
      }
      if (c.switchValid) {
        if (!self.$gameSwitches.value(c.switchId)) {
          return false;
        }
      }
      return true;
    }
    setupBattleEvent() {
      if (!this._interpreter.isRunning()) {
        if (this._interpreter.setupReservedCommonEvent()) {
          return;
        }
        const pages = this.troop().pages;
        for (let i = 0; i < pages.length; i++) {
          const page = pages[i];
          if (this.meetsConditions(page) && !this._eventFlags[i]) {
            this._interpreter.setup(page.list);
            this._interpreter.setEventInfo({
              eventType: "battle_event",
              troopId: this._troopId,
              page: i + 1
            });
            if (page.span <= 1) {
              this._eventFlags[i] = true;
            }
            break;
          }
        }
      }
    }
    increaseTurn() {
      const pages = this.troop().pages;
      pages.forEach(({ span }, i) => {
        if (span === 1) {
          this._eventFlags[i] = false;
        }
      });
      this._turnCount++;
    }
    expTotal() {
      return this.deadMembers().reduce((r, enemy2) => r + enemy2.exp(), 0);
    }
    goldTotal() {
      return this.deadMembers().reduce((r, enemy2) => r + enemy2.gold(), 0) * this.goldRate();
    }
    goldRate() {
      return self.$gameParty.hasGoldDouble() ? 2 : 1;
    }
    makeDropItems() {
      return this.deadMembers().reduce(
        (r, enemy2) => r.concat(enemy2.makeDropItems()),
        []
      );
    }
  };
  Game_Troop.LETTER_TABLE_HALF = [
    " A",
    " B",
    " C",
    " D",
    " E",
    " F",
    " G",
    " H",
    " I",
    " J",
    " K",
    " L",
    " M",
    " N",
    " O",
    " P",
    " Q",
    " R",
    " S",
    " T",
    " U",
    " V",
    " W",
    " X",
    " Y",
    " Z"
  ];
  Game_Troop.LETTER_TABLE_FULL = [
    "\uFF21",
    "\uFF22",
    "\uFF23",
    "\uFF24",
    "\uFF25",
    "\uFF26",
    "\uFF27",
    "\uFF28",
    "\uFF29",
    "\uFF2A",
    "\uFF2B",
    "\uFF2C",
    "\uFF2D",
    "\uFF2E",
    "\uFF2F",
    "\uFF30",
    "\uFF31",
    "\uFF32",
    "\uFF33",
    "\uFF34",
    "\uFF35",
    "\uFF36",
    "\uFF37",
    "\uFF38",
    "\uFF39",
    "\uFF3A"
  ];
  var Game_Troop_default = Game_Troop;

  // src-www/js/rpg_objects/Game_CommonEvent.js
  var Game_CommonEvent = class {
    constructor(...args) {
      this.initialize(...args);
    }
    initialize(commonEventId) {
      this._commonEventId = commonEventId;
      this.refresh();
    }
    event() {
      return self.$dataCommonEvents[this._commonEventId];
    }
    list() {
      return this.event().list;
    }
    refresh() {
      if (this.isActive()) {
        if (!this._interpreter) {
          this._interpreter = new Game_Interpreter_default();
        }
      } else {
        this._interpreter = null;
      }
    }
    isActive() {
      const event = this.event();
      return event.trigger === 2 && self.$gameSwitches.value(event.switchId);
    }
    update() {
      if (this._interpreter) {
        if (!this._interpreter.isRunning()) {
          this._interpreter.setup(this.list());
          this._interpreter.setEventInfo({
            eventType: "common_event",
            commonEventId: this._commonEventId
          });
        }
        this._interpreter.update();
      }
    }
  };
  var Game_CommonEvent_default = Game_CommonEvent;

  // src-www/js/rpg_objects/Game_Vehicle.js
  var Game_Vehicle = class extends Game_Character_default {
    constructor(...args) {
      super(...args);
      this.initialize(...args);
    }
    initialize(type) {
      super.initialize();
      this._type = type;
      this.resetDirection();
      this.initMoveSpeed();
      this.loadSystemSettings();
    }
    initMembers() {
      super.initMembers();
      this._type = "";
      this._mapId = 0;
      this._altitude = 0;
      this._driving = false;
      this._bgm = null;
    }
    isBoat() {
      return this._type === "boat";
    }
    isShip() {
      return this._type === "ship";
    }
    isAirship() {
      return this._type === "airship";
    }
    resetDirection() {
      this.setDirection(4);
    }
    initMoveSpeed() {
      if (this.isBoat()) {
        this.setMoveSpeed(4);
      } else if (this.isShip()) {
        this.setMoveSpeed(5);
      } else if (this.isAirship()) {
        this.setMoveSpeed(6);
      }
    }
    vehicle() {
      if (this.isBoat()) {
        return self.$dataSystem.boat;
      } else if (this.isShip()) {
        return self.$dataSystem.ship;
      } else if (this.isAirship()) {
        return self.$dataSystem.airship;
      } else {
        return null;
      }
    }
    loadSystemSettings() {
      const vehicle = this.vehicle();
      this._mapId = vehicle.startMapId;
      this.setPosition(vehicle.startX, vehicle.startY);
      this.setImage(vehicle.characterName, vehicle.characterIndex);
    }
    refresh() {
      if (this._driving) {
        this._mapId = self.$gameMap.mapId();
        this.syncWithPlayer();
      } else if (this._mapId === self.$gameMap.mapId()) {
        this.locate(this.x, this.y);
      }
      if (this.isAirship()) {
        this.setPriorityType(this._driving ? 2 : 0);
      } else {
        this.setPriorityType(1);
      }
      this.setWalkAnime(this._driving);
      this.setStepAnime(this._driving);
      this.setTransparent(this._mapId !== self.$gameMap.mapId());
    }
    setLocation(mapId, x, y) {
      this._mapId = mapId;
      this.setPosition(x, y);
      this.refresh();
    }
    pos(x, y) {
      if (this._mapId === self.$gameMap.mapId()) {
        return Game_Character_default.prototype.pos.call(this, x, y);
      } else {
        return false;
      }
    }
    isMapPassable(x, y, d) {
      const x2 = self.$gameMap.roundXWithDirection(x, d);
      const y2 = self.$gameMap.roundYWithDirection(y, d);
      if (this.isBoat()) {
        return self.$gameMap.isBoatPassable(x2, y2);
      } else if (this.isShip()) {
        return self.$gameMap.isShipPassable(x2, y2);
      } else if (this.isAirship()) {
        return true;
      } else {
        return false;
      }
    }
    getOn() {
      this._driving = true;
      this.setWalkAnime(true);
      this.setStepAnime(true);
      self.$gameSystem.saveWalkingBgm();
      this.playBgm();
    }
    getOff() {
      this._driving = false;
      this.setWalkAnime(false);
      this.setStepAnime(false);
      this.resetDirection();
      self.$gameSystem.replayWalkingBgm();
    }
    setBgm(bgm) {
      this._bgm = bgm;
    }
    playBgm() {
      AudioManager_default.playBgm(this._bgm || this.vehicle().bgm);
    }
    syncWithPlayer() {
      this.copyPosition(self.$gamePlayer);
      this.refreshBushDepth();
    }
    screenY() {
      return Game_Character_default.prototype.screenY.call(this) - this._altitude;
    }
    shadowX() {
      return this.screenX();
    }
    shadowY() {
      return this.screenY() + this._altitude;
    }
    shadowOpacity() {
      return 255 * this._altitude / this.maxAltitude();
    }
    canMove() {
      if (this.isAirship()) {
        return this.isHighest();
      } else {
        return true;
      }
    }
    update() {
      super.update();
      if (this.isAirship()) {
        this.updateAirship();
      }
    }
    updateAirship() {
      this.updateAirshipAltitude();
      this.setStepAnime(this.isHighest());
      this.setPriorityType(this.isLowest() ? 0 : 2);
    }
    updateAirshipAltitude() {
      if (this._driving && !this.isHighest()) {
        this._altitude++;
      }
      if (!this._driving && !this.isLowest()) {
        this._altitude--;
      }
    }
    maxAltitude() {
      return 48;
    }
    isLowest() {
      return this._altitude <= 0;
    }
    isHighest() {
      return this._altitude >= this.maxAltitude();
    }
    isTakeoffOk() {
      return self.$gamePlayer.areFollowersGathered();
    }
    isLandOk(x, y, d) {
      if (this.isAirship()) {
        if (!self.$gameMap.isAirshipLandOk(x, y)) {
          return false;
        }
        if (self.$gameMap.eventsXy(x, y).length > 0) {
          return false;
        }
      } else {
        const x2 = self.$gameMap.roundXWithDirection(x, d);
        const y2 = self.$gameMap.roundYWithDirection(y, d);
        if (!self.$gameMap.isValid(x2, y2)) {
          return false;
        }
        if (!self.$gameMap.isPassable(x2, y2, this.reverseDir(d))) {
          return false;
        }
        if (this.isCollidedWithCharacters(x2, y2)) {
          return false;
        }
      }
      return true;
    }
  };
  var Game_Vehicle_default = Game_Vehicle;

  // src-www/js/rpg_objects/Game_Event.js
  var Game_Event = class extends Game_Character_default {
    constructor(...args) {
      super(...args);
      this.initialize(...args);
    }
    initialize(mapId, eventId) {
      super.initialize();
      this._mapId = mapId;
      this._eventId = eventId;
      this.locate(this.event().x, this.event().y);
      this.refresh();
    }
    initMembers() {
      super.initMembers();
      this._moveType = 0;
      this._trigger = 0;
      this._starting = false;
      this._erased = false;
      this._pageIndex = -2;
      this._originalPattern = 1;
      this._originalDirection = 2;
      this._prelockDirection = 0;
      this._locked = false;
    }
    eventId() {
      return this._eventId;
    }
    event() {
      return self.$dataMap.events[this._eventId];
    }
    page() {
      return this.event().pages[this._pageIndex];
    }
    list() {
      return this.page().list;
    }
    isCollidedWithCharacters(x, y) {
      return Game_Character_default.prototype.isCollidedWithCharacters.call(this, x, y) || this.isCollidedWithPlayerCharacters(x, y);
    }
    isCollidedWithEvents(x, y) {
      const events = self.$gameMap.eventsXyNt(x, y);
      return events.length > 0;
    }
    isCollidedWithPlayerCharacters(x, y) {
      return this.isNormalPriority() && self.$gamePlayer.isCollided(x, y);
    }
    lock() {
      if (!this._locked) {
        this._prelockDirection = this.direction();
        this.turnTowardPlayer();
        this._locked = true;
      }
    }
    unlock() {
      if (this._locked) {
        this._locked = false;
        this.setDirection(this._prelockDirection);
      }
    }
    updateStop() {
      if (this._locked) {
        this.resetStopCount();
      }
      super.updateStop();
      if (!this.isMoveRouteForcing()) {
        this.updateSelfMovement();
      }
    }
    updateSelfMovement() {
      if (!this._locked && this.isNearTheScreen() && this.checkStop(this.stopCountThreshold())) {
        switch (this._moveType) {
          case 1:
            this.moveTypeRandom();
            break;
          case 2:
            this.moveTypeTowardPlayer();
            break;
          case 3:
            this.moveTypeCustom();
            break;
        }
      }
    }
    stopCountThreshold() {
      return 30 * (5 - this.moveFrequency());
    }
    moveTypeRandom() {
      switch (Math.randomInt(6)) {
        case 0:
        case 1:
          this.moveRandom();
          break;
        case 2:
        case 3:
        case 4:
          this.moveForward();
          break;
        case 5:
          this.resetStopCount();
          break;
      }
    }
    moveTypeTowardPlayer() {
      if (this.isNearThePlayer()) {
        switch (Math.randomInt(6)) {
          case 0:
          case 1:
          case 2:
          case 3:
            this.moveTowardPlayer();
            break;
          case 4:
            this.moveRandom();
            break;
          case 5:
            this.moveForward();
            break;
        }
      } else {
        this.moveRandom();
      }
    }
    isNearThePlayer() {
      const sx = Math.abs(this.deltaXFrom(self.$gamePlayer.x));
      const sy = Math.abs(this.deltaYFrom(self.$gamePlayer.y));
      return sx + sy < 20;
    }
    moveTypeCustom() {
      this.updateRoutineMove();
    }
    isStarting() {
      return this._starting;
    }
    clearStartingFlag() {
      this._starting = false;
    }
    isTriggerIn(triggers) {
      return triggers.contains(this._trigger);
    }
    start() {
      const list = this.list();
      if (list && list.length > 1) {
        this._starting = true;
        if (this.isTriggerIn([0, 1, 2])) {
          this.lock();
        }
      }
    }
    erase() {
      this._erased = true;
      this.refresh();
    }
    refresh() {
      const newPageIndex = this._erased ? -1 : this.findProperPageIndex();
      if (this._pageIndex !== newPageIndex) {
        this._pageIndex = newPageIndex;
        this.setupPage();
      }
    }
    findProperPageIndex() {
      const pages = this.event().pages;
      for (let i = pages.length - 1; i >= 0; i--) {
        const page = pages[i];
        if (this.meetsConditions(page)) {
          return i;
        }
      }
      return -1;
    }
    meetsConditions({ conditions }) {
      const c = conditions;
      if (c.switch1Valid) {
        if (!self.$gameSwitches.value(c.switch1Id)) {
          return false;
        }
      }
      if (c.switch2Valid) {
        if (!self.$gameSwitches.value(c.switch2Id)) {
          return false;
        }
      }
      if (c.variableValid) {
        if (self.$gameVariables.value(c.variableId) < c.variableValue) {
          return false;
        }
      }
      if (c.selfSwitchValid) {
        const key = [this._mapId, this._eventId, c.selfSwitchCh];
        if (self.$gameSelfSwitches.value(key) !== true) {
          return false;
        }
      }
      if (c.itemValid) {
        const item2 = self.$dataItems[c.itemId];
        if (!self.$gameParty.hasItem(item2)) {
          return false;
        }
      }
      if (c.actorValid) {
        const actor2 = self.$gameActors.actor(c.actorId);
        if (!self.$gameParty.members().contains(actor2)) {
          return false;
        }
      }
      return true;
    }
    setupPage() {
      if (this._pageIndex >= 0) {
        this.setupPageSettings();
      } else {
        this.clearPageSettings();
      }
      this.refreshBushDepth();
      this.clearStartingFlag();
      this.checkEventTriggerAuto();
    }
    clearPageSettings() {
      this.setImage("", 0);
      this._moveType = 0;
      this._trigger = null;
      this._interpreter = null;
      this.setThrough(true);
    }
    setupPageSettings() {
      const page = this.page();
      const image = page.image;
      if (image.tileId > 0) {
        this.setTileImage(image.tileId);
      } else {
        this.setImage(image.characterName, image.characterIndex);
      }
      if (this._originalDirection !== image.direction) {
        this._originalDirection = image.direction;
        this._prelockDirection = 0;
        this.setDirectionFix(false);
        this.setDirection(image.direction);
      }
      if (this._originalPattern !== image.pattern) {
        this._originalPattern = image.pattern;
        this.setPattern(image.pattern);
      }
      this.setMoveSpeed(page.moveSpeed);
      this.setMoveFrequency(page.moveFrequency);
      this.setPriorityType(page.priorityType);
      this.setWalkAnime(page.walkAnime);
      this.setStepAnime(page.stepAnime);
      this.setDirectionFix(page.directionFix);
      this.setThrough(page.through);
      this.setMoveRoute(page.moveRoute);
      this._moveType = page.moveType;
      this._trigger = page.trigger;
      if (this._trigger === 4) {
        this._interpreter = new Game_Interpreter_default();
      } else {
        this._interpreter = null;
      }
    }
    isOriginalPattern() {
      return this.pattern() === this._originalPattern;
    }
    resetPattern() {
      this.setPattern(this._originalPattern);
    }
    checkEventTriggerTouch(x, y) {
      if (!self.$gameMap.isEventRunning()) {
        if (this._trigger === 2 && self.$gamePlayer.pos(x, y)) {
          if (!this.isJumping() && this.isNormalPriority()) {
            this.start();
          }
        }
      }
    }
    checkEventTriggerAuto() {
      if (this._trigger === 3) {
        this.start();
      }
    }
    update() {
      super.update();
      this.checkEventTriggerAuto();
      this.updateParallel();
    }
    updateParallel() {
      if (this._interpreter) {
        if (!this._interpreter.isRunning()) {
          this._interpreter.setup(this.list(), this._eventId);
          this._interpreter.setEventInfo(this.getEventInfo());
        }
        this._interpreter.update();
      }
    }
    locate(x, y) {
      super.locate(x, y);
      this._prelockDirection = 0;
    }
    forceMoveRoute(moveRoute) {
      super.forceMoveRoute(moveRoute);
      this._prelockDirection = 0;
    }
    getEventInfo() {
      return {
        eventType: "map_event",
        mapId: this._mapId,
        mapEventId: this._eventId,
        page: this._pageIndex + 1
      };
    }
  };
  var Game_Event_default = Game_Event;

  // src-www/js/rpg_objects/Game_Map.js
  var Game_Map = class {
    constructor(...args) {
      this.initialize(...args);
    }
    initialize() {
      this._interpreter = new Game_Interpreter_default();
      this._mapId = 0;
      this._tilesetId = 0;
      this._events = [];
      this._commonEvents = [];
      this._vehicles = [];
      this._displayX = 0;
      this._displayY = 0;
      this._nameDisplay = true;
      this._scrollDirection = 2;
      this._scrollRest = 0;
      this._scrollSpeed = 4;
      this._parallaxName = "";
      this._parallaxZero = false;
      this._parallaxLoopX = false;
      this._parallaxLoopY = false;
      this._parallaxSx = 0;
      this._parallaxSy = 0;
      this._parallaxX = 0;
      this._parallaxY = 0;
      this._battleback1Name = null;
      this._battleback2Name = null;
      this.createVehicles();
    }
    setup(mapId) {
      if (!self.$dataMap) {
        throw new Error("The map data is not available");
      }
      this._mapId = mapId;
      this._tilesetId = self.$dataMap.tilesetId;
      this._displayX = 0;
      this._displayY = 0;
      this.refereshVehicles();
      this.setupEvents();
      this.setupScroll();
      this.setupParallax();
      this.setupBattleback();
      this._needsRefresh = false;
    }
    isEventRunning() {
      return this._interpreter.isRunning() || this.isAnyEventStarting();
    }
    tileWidth() {
      return 48;
    }
    tileHeight() {
      return 48;
    }
    mapId() {
      return this._mapId;
    }
    tilesetId() {
      return this._tilesetId;
    }
    displayX() {
      return this._displayX;
    }
    displayY() {
      return this._displayY;
    }
    parallaxName() {
      return this._parallaxName;
    }
    battleback1Name() {
      return this._battleback1Name;
    }
    battleback2Name() {
      return this._battleback2Name;
    }
    requestRefresh(mapId) {
      this._needsRefresh = true;
    }
    isNameDisplayEnabled() {
      return this._nameDisplay;
    }
    disableNameDisplay() {
      this._nameDisplay = false;
    }
    enableNameDisplay() {
      this._nameDisplay = true;
    }
    createVehicles() {
      this._vehicles = [];
      this._vehicles[0] = new Game_Vehicle_default("boat");
      this._vehicles[1] = new Game_Vehicle_default("ship");
      this._vehicles[2] = new Game_Vehicle_default("airship");
    }
    refereshVehicles() {
      this._vehicles.forEach((vehicle) => {
        vehicle.refresh();
      });
    }
    vehicles() {
      return this._vehicles;
    }
    vehicle(type) {
      if (type === 0 || type === "boat") {
        return this.boat();
      } else if (type === 1 || type === "ship") {
        return this.ship();
      } else if (type === 2 || type === "airship") {
        return this.airship();
      } else {
        return null;
      }
    }
    boat() {
      return this._vehicles[0];
    }
    ship() {
      return this._vehicles[1];
    }
    airship() {
      return this._vehicles[2];
    }
    setupEvents() {
      this._events = [];
      for (let i = 0; i < self.$dataMap.events.length; i++) {
        if (self.$dataMap.events[i]) {
          this._events[i] = new Game_Event_default(this._mapId, i);
        }
      }
      this._commonEvents = this.parallelCommonEvents().map(
        ({ id }) => new Game_CommonEvent_default(id)
      );
      this.refreshTileEvents();
    }
    events() {
      return this._events.filter((event) => !!event);
    }
    event(eventId) {
      return this._events[eventId];
    }
    eraseEvent(eventId) {
      this._events[eventId].erase();
    }
    parallelCommonEvents() {
      return self.$dataCommonEvents.filter(
        (commonEvent) => commonEvent && commonEvent.trigger === 2
      );
    }
    setupScroll() {
      this._scrollDirection = 2;
      this._scrollRest = 0;
      this._scrollSpeed = 4;
    }
    setupParallax() {
      this._parallaxName = self.$dataMap.parallaxName || "";
      this._parallaxZero = ImageManager_default.isZeroParallax(this._parallaxName);
      this._parallaxLoopX = self.$dataMap.parallaxLoopX;
      this._parallaxLoopY = self.$dataMap.parallaxLoopY;
      this._parallaxSx = self.$dataMap.parallaxSx;
      this._parallaxSy = self.$dataMap.parallaxSy;
      this._parallaxX = 0;
      this._parallaxY = 0;
    }
    setupBattleback() {
      if (self.$dataMap.specifyBattleback) {
        this._battleback1Name = self.$dataMap.battleback1Name;
        this._battleback2Name = self.$dataMap.battleback2Name;
      } else {
        this._battleback1Name = null;
        this._battleback2Name = null;
      }
    }
    setDisplayPos(x, y) {
      if (this.isLoopHorizontal()) {
        this._displayX = x.mod(this.width());
        this._parallaxX = x;
      } else {
        const endX = this.width() - this.screenTileX();
        this._displayX = endX < 0 ? endX / 2 : x.clamp(0, endX);
        this._parallaxX = this._displayX;
      }
      if (this.isLoopVertical()) {
        this._displayY = y.mod(this.height());
        this._parallaxY = y;
      } else {
        const endY = this.height() - this.screenTileY();
        this._displayY = endY < 0 ? endY / 2 : y.clamp(0, endY);
        this._parallaxY = this._displayY;
      }
    }
    parallaxOx() {
      if (this._parallaxZero) {
        return this._parallaxX * this.tileWidth();
      } else if (this._parallaxLoopX) {
        return this._parallaxX * this.tileWidth() / 2;
      } else {
        return 0;
      }
    }
    parallaxOy() {
      if (this._parallaxZero) {
        return this._parallaxY * this.tileHeight();
      } else if (this._parallaxLoopY) {
        return this._parallaxY * this.tileHeight() / 2;
      } else {
        return 0;
      }
    }
    tileset() {
      return self.$dataTilesets[this._tilesetId];
    }
    tilesetFlags() {
      const tileset = this.tileset();
      if (tileset) {
        return tileset.flags;
      } else {
        return [];
      }
    }
    displayName() {
      return self.$dataMap.displayName;
    }
    width() {
      return self.$dataMap.width;
    }
    height() {
      return self.$dataMap.height;
    }
    data() {
      return self.$dataMap.data;
    }
    isLoopHorizontal() {
      return self.$dataMap.scrollType === 2 || self.$dataMap.scrollType === 3;
    }
    isLoopVertical() {
      return self.$dataMap.scrollType === 1 || self.$dataMap.scrollType === 3;
    }
    isDashDisabled() {
      return self.$dataMap.disableDashing;
    }
    encounterList() {
      return self.$dataMap.encounterList;
    }
    encounterStep() {
      return self.$dataMap.encounterStep;
    }
    isOverworld() {
      return this.tileset() && this.tileset().mode === 0;
    }
    screenTileX() {
      return Graphics_default.width / this.tileWidth();
    }
    screenTileY() {
      return Graphics_default.height / this.tileHeight();
    }
    adjustX(x) {
      if (this.isLoopHorizontal() && x < this._displayX - (this.width() - this.screenTileX()) / 2) {
        return x - this._displayX + self.$dataMap.width;
      } else {
        return x - this._displayX;
      }
    }
    adjustY(y) {
      if (this.isLoopVertical() && y < this._displayY - (this.height() - this.screenTileY()) / 2) {
        return y - this._displayY + self.$dataMap.height;
      } else {
        return y - this._displayY;
      }
    }
    roundX(x) {
      return this.isLoopHorizontal() ? x.mod(this.width()) : x;
    }
    roundY(y) {
      return this.isLoopVertical() ? y.mod(this.height()) : y;
    }
    xWithDirection(x, d) {
      return x + (d === 6 ? 1 : d === 4 ? -1 : 0);
    }
    yWithDirection(y, d) {
      return y + (d === 2 ? 1 : d === 8 ? -1 : 0);
    }
    roundXWithDirection(x, d) {
      return this.roundX(x + (d === 6 ? 1 : d === 4 ? -1 : 0));
    }
    roundYWithDirection(y, d) {
      return this.roundY(y + (d === 2 ? 1 : d === 8 ? -1 : 0));
    }
    deltaX(x1, x2) {
      let result2 = x1 - x2;
      if (this.isLoopHorizontal() && Math.abs(result2) > this.width() / 2) {
        if (result2 < 0) {
          result2 += this.width();
        } else {
          result2 -= this.width();
        }
      }
      return result2;
    }
    deltaY(y1, y2) {
      let result2 = y1 - y2;
      if (this.isLoopVertical() && Math.abs(result2) > this.height() / 2) {
        if (result2 < 0) {
          result2 += this.height();
        } else {
          result2 -= this.height();
        }
      }
      return result2;
    }
    distance(x1, y1, x2, y2) {
      return Math.abs(this.deltaX(x1, x2)) + Math.abs(this.deltaY(y1, y2));
    }
    canvasToMapX(x) {
      const tileWidth = this.tileWidth();
      const originX = this._displayX * tileWidth;
      const mapX = Math.floor((originX + x) / tileWidth);
      return this.roundX(mapX);
    }
    canvasToMapY(y) {
      const tileHeight = this.tileHeight();
      const originY = this._displayY * tileHeight;
      const mapY = Math.floor((originY + y) / tileHeight);
      return this.roundY(mapY);
    }
    autoplay() {
      if (self.$dataMap.autoplayBgm) {
        if (self.$gamePlayer.isInVehicle()) {
          self.$gameSystem.saveWalkingBgm2();
        } else {
          AudioManager_default.playBgm(self.$dataMap.bgm);
        }
      }
      if (self.$dataMap.autoplayBgs) {
        AudioManager_default.playBgs(self.$dataMap.bgs);
      }
    }
    refreshIfNeeded() {
      if (this._needsRefresh) {
        this.refresh();
      }
    }
    refresh() {
      this.events().forEach((event) => {
        event.refresh();
      });
      this._commonEvents.forEach((event) => {
        event.refresh();
      });
      this.refreshTileEvents();
      this._needsRefresh = false;
    }
    refreshTileEvents() {
      this.tileEvents = this.events().filter((event) => event.isTile());
    }
    eventsXy(x, y) {
      return this.events().filter((event) => event.pos(x, y));
    }
    eventsXyNt(x, y) {
      return this.events().filter((event) => event.posNt(x, y));
    }
    tileEventsXy(x, y) {
      return this.tileEvents.filter((event) => event.posNt(x, y));
    }
    eventIdXy(x, y) {
      const list = this.eventsXy(x, y);
      return list.length === 0 ? 0 : list[0].eventId();
    }
    scrollDown(distance) {
      if (this.isLoopVertical()) {
        this._displayY += distance;
        this._displayY %= self.$dataMap.height;
        if (this._parallaxLoopY) {
          this._parallaxY += distance;
        }
      } else if (this.height() >= this.screenTileY()) {
        const lastY = this._displayY;
        this._displayY = Math.min(
          this._displayY + distance,
          this.height() - this.screenTileY()
        );
        this._parallaxY += this._displayY - lastY;
      }
    }
    scrollLeft(distance) {
      if (this.isLoopHorizontal()) {
        this._displayX += self.$dataMap.width - distance;
        this._displayX %= self.$dataMap.width;
        if (this._parallaxLoopX) {
          this._parallaxX -= distance;
        }
      } else if (this.width() >= this.screenTileX()) {
        const lastX = this._displayX;
        this._displayX = Math.max(this._displayX - distance, 0);
        this._parallaxX += this._displayX - lastX;
      }
    }
    scrollRight(distance) {
      if (this.isLoopHorizontal()) {
        this._displayX += distance;
        this._displayX %= self.$dataMap.width;
        if (this._parallaxLoopX) {
          this._parallaxX += distance;
        }
      } else if (this.width() >= this.screenTileX()) {
        const lastX = this._displayX;
        this._displayX = Math.min(
          this._displayX + distance,
          this.width() - this.screenTileX()
        );
        this._parallaxX += this._displayX - lastX;
      }
    }
    scrollUp(distance) {
      if (this.isLoopVertical()) {
        this._displayY += self.$dataMap.height - distance;
        this._displayY %= self.$dataMap.height;
        if (this._parallaxLoopY) {
          this._parallaxY -= distance;
        }
      } else if (this.height() >= this.screenTileY()) {
        const lastY = this._displayY;
        this._displayY = Math.max(this._displayY - distance, 0);
        this._parallaxY += this._displayY - lastY;
      }
    }
    isValid(x, y) {
      return x >= 0 && x < this.width() && y >= 0 && y < this.height();
    }
    checkPassage(x, y, bit) {
      const flags = this.tilesetFlags();
      const tiles = this.allTiles(x, y);
      for (let i = 0; i < tiles.length; i++) {
        const flag = flags[tiles[i]];
        if ((flag & 16) !== 0)
          continue;
        if ((flag & bit) === 0)
          return true;
        if ((flag & bit) === bit)
          return false;
      }
      return false;
    }
    tileId(x, y, z) {
      const width = self.$dataMap.width;
      const height = self.$dataMap.height;
      return self.$dataMap.data[(z * height + y) * width + x] || 0;
    }
    layeredTiles(x, y) {
      const tiles = [];
      for (let i = 0; i < 4; i++) {
        tiles.push(this.tileId(x, y, 3 - i));
      }
      return tiles;
    }
    allTiles(x, y) {
      const tiles = this.tileEventsXy(x, y).map((event) => event.tileId());
      return tiles.concat(this.layeredTiles(x, y));
    }
    autotileType(x, y, z) {
      const tileId = this.tileId(x, y, z);
      return tileId >= 2048 ? Math.floor((tileId - 2048) / 48) : -1;
    }
    isPassable(x, y, d) {
      return this.checkPassage(x, y, 1 << d / 2 - 1 & 15);
    }
    isBoatPassable(x, y) {
      return this.checkPassage(x, y, 512);
    }
    isShipPassable(x, y) {
      return this.checkPassage(x, y, 1024);
    }
    isAirshipLandOk(x, y) {
      return this.checkPassage(x, y, 2048) && this.checkPassage(x, y, 15);
    }
    checkLayeredTilesFlags(x, y, bit) {
      const flags = this.tilesetFlags();
      return this.layeredTiles(x, y).some(
        (tileId) => (flags[tileId] & bit) !== 0
      );
    }
    isLadder(x, y) {
      return this.isValid(x, y) && this.checkLayeredTilesFlags(x, y, 32);
    }
    isBush(x, y) {
      return this.isValid(x, y) && this.checkLayeredTilesFlags(x, y, 64);
    }
    isCounter(x, y) {
      return this.isValid(x, y) && this.checkLayeredTilesFlags(x, y, 128);
    }
    isDamageFloor(x, y) {
      return this.isValid(x, y) && this.checkLayeredTilesFlags(x, y, 256);
    }
    terrainTag(x, y) {
      if (this.isValid(x, y)) {
        const flags = this.tilesetFlags();
        const tiles = this.layeredTiles(x, y);
        for (let i = 0; i < tiles.length; i++) {
          const tag = flags[tiles[i]] >> 12;
          if (tag > 0) {
            return tag;
          }
        }
      }
      return 0;
    }
    regionId(x, y) {
      return this.isValid(x, y) ? this.tileId(x, y, 5) : 0;
    }
    startScroll(direction, distance, speed) {
      this._scrollDirection = direction;
      this._scrollRest = distance;
      this._scrollSpeed = speed;
    }
    isScrolling() {
      return this._scrollRest > 0;
    }
    update(sceneActive) {
      this.refreshIfNeeded();
      if (sceneActive) {
        this.updateInterpreter();
      }
      this.updateScroll();
      this.updateEvents();
      this.updateVehicles();
      this.updateParallax();
    }
    updateScroll() {
      if (this.isScrolling()) {
        const lastX = this._displayX;
        const lastY = this._displayY;
        this.doScroll(this._scrollDirection, this.scrollDistance());
        if (this._displayX === lastX && this._displayY === lastY) {
          this._scrollRest = 0;
        } else {
          this._scrollRest -= this.scrollDistance();
        }
      }
    }
    scrollDistance() {
      return Math.pow(2, this._scrollSpeed) / 256;
    }
    doScroll(direction, distance) {
      switch (direction) {
        case 2:
          this.scrollDown(distance);
          break;
        case 4:
          this.scrollLeft(distance);
          break;
        case 6:
          this.scrollRight(distance);
          break;
        case 8:
          this.scrollUp(distance);
          break;
      }
    }
    updateEvents() {
      this.events().forEach((event) => {
        event.update();
      });
      this._commonEvents.forEach((event) => {
        event.update();
      });
    }
    updateVehicles() {
      this._vehicles.forEach((vehicle) => {
        vehicle.update();
      });
    }
    updateParallax() {
      if (this._parallaxLoopX) {
        this._parallaxX += this._parallaxSx / this.tileWidth() / 2;
      }
      if (this._parallaxLoopY) {
        this._parallaxY += this._parallaxSy / this.tileHeight() / 2;
      }
    }
    changeTileset(tilesetId) {
      this._tilesetId = tilesetId;
      this.refresh();
    }
    changeBattleback(battleback1Name, battleback2Name) {
      this._battleback1Name = battleback1Name;
      this._battleback2Name = battleback2Name;
    }
    changeParallax(name, loopX, loopY, sx, sy) {
      this._parallaxName = name;
      this._parallaxZero = ImageManager_default.isZeroParallax(this._parallaxName);
      if (this._parallaxLoopX && !loopX) {
        this._parallaxX = 0;
      }
      if (this._parallaxLoopY && !loopY) {
        this._parallaxY = 0;
      }
      this._parallaxLoopX = loopX;
      this._parallaxLoopY = loopY;
      this._parallaxSx = sx;
      this._parallaxSy = sy;
    }
    updateInterpreter() {
      for (; ; ) {
        this._interpreter.update();
        if (this._interpreter.isRunning()) {
          return;
        }
        if (this._interpreter.eventId() > 0) {
          this.unlockEvent(this._interpreter.eventId());
          this._interpreter.clear();
        }
        if (!this.setupStartingEvent()) {
          return;
        }
      }
    }
    unlockEvent(eventId) {
      if (this._events[eventId]) {
        this._events[eventId].unlock();
      }
    }
    setupStartingEvent() {
      this.refreshIfNeeded();
      if (this._interpreter.setupReservedCommonEvent()) {
        return true;
      }
      if (this.setupTestEvent()) {
        return true;
      }
      if (this.setupStartingMapEvent()) {
        return true;
      }
      if (this.setupAutorunCommonEvent()) {
        return true;
      }
      return false;
    }
    setupTestEvent() {
      if (self.$testEvent) {
        this._interpreter.setup(self.$testEvent, 0);
        this._interpreter.setEventInfo({
          eventType: "test_event"
        });
        self.$testEvent = null;
        return true;
      }
      return false;
    }
    setupStartingMapEvent() {
      const events = this.events();
      for (const event of events) {
        if (event.isStarting()) {
          event.clearStartingFlag();
          this._interpreter.setup(event.list(), event.eventId());
          this._interpreter.setEventInfo(event.getEventInfo());
          return true;
        }
      }
      return false;
    }
    setupAutorunCommonEvent() {
      for (let i = 0; i < self.$dataCommonEvents.length; i++) {
        const event = self.$dataCommonEvents[i];
        if (event && event.trigger === 1 && self.$gameSwitches.value(event.switchId)) {
          this._interpreter.setup(event.list);
          this._interpreter.setEventInfo({
            eventType: "common_event",
            commonEventId: i
          });
          return true;
        }
      }
      return false;
    }
    isAnyEventStarting() {
      return this.events().some((event) => event.isStarting());
    }
  };
  var Game_Map_default = Game_Map;

  // src-www/js/rpg_objects/Game_Follower.js
  var Game_Follower = class extends Game_Character_default {
    constructor(...args) {
      super(...args);
      this.initialize(...args);
    }
    initialize(memberIndex) {
      super.initialize();
      this._memberIndex = memberIndex;
      this.setTransparent(self.$dataSystem.optTransparent);
      this.setThrough(true);
    }
    refresh() {
      const characterName = this.isVisible() ? this.actor().characterName() : "";
      const characterIndex = this.isVisible() ? this.actor().characterIndex() : 0;
      this.setImage(characterName, characterIndex);
    }
    actor() {
      return self.$gameParty.battleMembers()[this._memberIndex];
    }
    isVisible() {
      return this.actor() && self.$gamePlayer.followers().isVisible();
    }
    update() {
      super.update();
      this.setMoveSpeed(self.$gamePlayer.realMoveSpeed());
      this.setOpacity(self.$gamePlayer.opacity());
      this.setBlendMode(self.$gamePlayer.blendMode());
      this.setWalkAnime(self.$gamePlayer.hasWalkAnime());
      this.setStepAnime(self.$gamePlayer.hasStepAnime());
      this.setDirectionFix(self.$gamePlayer.isDirectionFixed());
      this.setTransparent(self.$gamePlayer.isTransparent());
    }
    chaseCharacter({ x, y }) {
      const sx = this.deltaXFrom(x);
      const sy = this.deltaYFrom(y);
      if (sx !== 0 && sy !== 0) {
        this.moveDiagonally(sx > 0 ? 4 : 6, sy > 0 ? 8 : 2);
      } else if (sx !== 0) {
        this.moveStraight(sx > 0 ? 4 : 6);
      } else if (sy !== 0) {
        this.moveStraight(sy > 0 ? 8 : 2);
      }
      this.setMoveSpeed(self.$gamePlayer.realMoveSpeed());
    }
  };
  var Game_Follower_default = Game_Follower;

  // src-www/js/rpg_objects/Game_Followers.js
  var Game_Followers = class {
    constructor(...args) {
      this.initialize(...args);
    }
    initialize() {
      this._visible = self.$dataSystem.optFollowers;
      this._gathering = false;
      this._data = [];
      for (let i = 1; i < self.$gameParty.maxBattleMembers(); i++) {
        this._data.push(new Game_Follower_default(i));
      }
    }
    isVisible() {
      return this._visible;
    }
    show() {
      this._visible = true;
    }
    hide() {
      this._visible = false;
    }
    follower(index) {
      return this._data[index];
    }
    forEach(callback, thisObject) {
      this._data.forEach(callback, thisObject);
    }
    reverseEach(callback, thisObject) {
      this._data.reverse();
      this._data.forEach(callback, thisObject);
      this._data.reverse();
    }
    refresh() {
      this.forEach((follower) => follower.refresh(), this);
    }
    update() {
      if (this.areGathering()) {
        if (!this.areMoving()) {
          this.updateMove();
        }
        if (this.areGathered()) {
          this._gathering = false;
        }
      }
      this.forEach((follower) => {
        follower.update();
      }, this);
    }
    updateMove() {
      for (let i = this._data.length - 1; i >= 0; i--) {
        const precedingCharacter = i > 0 ? this._data[i - 1] : self.$gamePlayer;
        this._data[i].chaseCharacter(precedingCharacter);
      }
    }
    jumpAll() {
      if (self.$gamePlayer.isJumping()) {
        for (const follower of this._data) {
          const sx = self.$gamePlayer.deltaXFrom(follower.x);
          const sy = self.$gamePlayer.deltaYFrom(follower.y);
          follower.jump(sx, sy);
        }
      }
    }
    synchronize(x, y, d) {
      this.forEach((follower) => {
        follower.locate(x, y);
        follower.setDirection(d);
      }, this);
    }
    gather() {
      this._gathering = true;
    }
    areGathering() {
      return this._gathering;
    }
    visibleFollowers() {
      return this._data.filter((follower) => follower.isVisible(), this);
    }
    areMoving() {
      return this.visibleFollowers().some(
        (follower) => follower.isMoving(),
        this
      );
    }
    areGathered() {
      return this.visibleFollowers().every(
        (follower) => !follower.isMoving() && follower.pos(self.$gamePlayer.x, self.$gamePlayer.y),
        this
      );
    }
    isSomeoneCollided(x, y) {
      return this.visibleFollowers().some((follower) => follower.pos(x, y), this);
    }
  };
  var Game_Followers_default = Game_Followers;

  // src-www/js/rpg_objects/Game_Player.js
  var Game_Player = class extends Game_Character_default {
    constructor(...args) {
      super(...args);
      this.initialize(...args);
    }
    initialize() {
      super.initialize();
      this.setTransparent(self.$dataSystem.optTransparent);
    }
    initMembers() {
      super.initMembers();
      this._vehicleType = "walk";
      this._vehicleGettingOn = false;
      this._vehicleGettingOff = false;
      this._dashing = false;
      this._needsMapReload = false;
      this._transferring = false;
      this._newMapId = 0;
      this._newX = 0;
      this._newY = 0;
      this._newDirection = 0;
      this._fadeType = 0;
      this._followers = new Game_Followers_default();
      this._encounterCount = 0;
    }
    clearTransferInfo() {
      this._transferring = false;
      this._newMapId = 0;
      this._newX = 0;
      this._newY = 0;
      this._newDirection = 0;
    }
    followers() {
      return this._followers;
    }
    refresh() {
      const actor2 = self.$gameParty.leader();
      const characterName = actor2 ? actor2.characterName() : "";
      const characterIndex = actor2 ? actor2.characterIndex() : 0;
      this.setImage(characterName, characterIndex);
      this._followers.refresh();
    }
    isStopping() {
      if (this._vehicleGettingOn || this._vehicleGettingOff) {
        return false;
      }
      return Game_Character_default.prototype.isStopping.call(this);
    }
    reserveTransfer(mapId, x, y, d, fadeType) {
      this._transferring = true;
      this._newMapId = mapId;
      this._newX = x;
      this._newY = y;
      this._newDirection = d;
      this._fadeType = fadeType;
    }
    requestMapReload() {
      this._needsMapReload = true;
    }
    isTransferring() {
      return this._transferring;
    }
    newMapId() {
      return this._newMapId;
    }
    fadeType() {
      return this._fadeType;
    }
    performTransfer() {
      if (this.isTransferring()) {
        this.setDirection(this._newDirection);
        if (this._newMapId !== self.$gameMap.mapId() || this._needsMapReload) {
          self.$gameMap.setup(this._newMapId);
          this._needsMapReload = false;
        }
        this.locate(this._newX, this._newY);
        this.refresh();
        DataManager.autoSaveGame();
        this.clearTransferInfo();
      }
    }
    isMapPassable(x, y, d) {
      const vehicle = this.vehicle();
      if (vehicle) {
        return vehicle.isMapPassable(x, y, d);
      } else {
        return Game_Character_default.prototype.isMapPassable.call(this, x, y, d);
      }
    }
    vehicle() {
      return self.$gameMap.vehicle(this._vehicleType);
    }
    isInBoat() {
      return this._vehicleType === "boat";
    }
    isInShip() {
      return this._vehicleType === "ship";
    }
    isInAirship() {
      return this._vehicleType === "airship";
    }
    isInVehicle() {
      return this.isInBoat() || this.isInShip() || this.isInAirship();
    }
    isNormal() {
      return this._vehicleType === "walk" && !this.isMoveRouteForcing();
    }
    isDashing() {
      return this._dashing;
    }
    isDebugThrough() {
      return Input_default.isPressed("control") && self.$gameTemp.isPlaytest();
    }
    isCollided(x, y) {
      if (this.isThrough()) {
        return false;
      } else {
        return this.pos(x, y) || this._followers.isSomeoneCollided(x, y);
      }
    }
    centerX() {
      return (Graphics_default.width / self.$gameMap.tileWidth() - 1) / 2;
    }
    centerY() {
      return (Graphics_default.height / self.$gameMap.tileHeight() - 1) / 2;
    }
    center(x, y) {
      return self.$gameMap.setDisplayPos(x - this.centerX(), y - this.centerY());
    }
    locate(x, y) {
      super.locate(x, y);
      this.center(x, y);
      this.makeEncounterCount();
      if (this.isInVehicle()) {
        this.vehicle().refresh();
      }
      this._followers.synchronize(x, y, this.direction());
    }
    increaseSteps() {
      super.increaseSteps();
      if (this.isNormal()) {
        self.$gameParty.increaseSteps();
      }
    }
    makeEncounterCount() {
      const n = self.$gameMap.encounterStep();
      this._encounterCount = Math.randomInt(n) + Math.randomInt(n) + 1;
    }
    makeEncounterTroopId() {
      const encounterList = [];
      let weightSum = 0;
      self.$gameMap.encounterList().forEach(function(encounter) {
        if (this.meetsEncounterConditions(encounter)) {
          encounterList.push(encounter);
          weightSum += encounter.weight;
        }
      }, this);
      if (weightSum > 0) {
        let value3 = Math.randomInt(weightSum);
        for (let i = 0; i < encounterList.length; i++) {
          value3 -= encounterList[i].weight;
          if (value3 < 0) {
            return encounterList[i].troopId;
          }
        }
      }
      return 0;
    }
    meetsEncounterConditions({ regionSet }) {
      return regionSet.length === 0 || regionSet.contains(this.regionId());
    }
    executeEncounter() {
      if (!self.$gameMap.isEventRunning() && this._encounterCount <= 0) {
        this.makeEncounterCount();
        const troopId = this.makeEncounterTroopId();
        if (self.$dataTroops[troopId]) {
          BattleManager_default.setup(troopId, true, false);
          BattleManager_default.onEncounter();
          return true;
        } else {
          return false;
        }
      } else {
        return false;
      }
    }
    startMapEvent(x, y, triggers, normal) {
      if (!self.$gameMap.isEventRunning()) {
        self.$gameMap.eventsXy(x, y).forEach((event) => {
          if (event.isTriggerIn(triggers) && event.isNormalPriority() === normal) {
            event.start();
          }
        });
      }
    }
    moveByInput() {
      if (!this.isMoving() && this.canMove()) {
        let direction = this.getInputDirection();
        if (direction > 0) {
          self.$gameTemp.clearDestination();
        } else if (self.$gameTemp.isDestinationValid()) {
          const x = self.$gameTemp.destinationX();
          const y = self.$gameTemp.destinationY();
          direction = this.findDirectionTo(x, y);
        }
        if (direction > 0) {
          this.executeMove(direction);
        }
      }
    }
    canMove() {
      if (self.$gameMap.isEventRunning() || self.$gameMessage.isBusy()) {
        return false;
      }
      if (this.isMoveRouteForcing() || this.areFollowersGathering()) {
        return false;
      }
      if (this._vehicleGettingOn || this._vehicleGettingOff) {
        return false;
      }
      if (this.isInVehicle() && !this.vehicle().canMove()) {
        return false;
      }
      return true;
    }
    getInputDirection() {
      return Input_default.dir4;
    }
    executeMove(direction) {
      this.moveStraight(direction);
    }
    update(sceneActive) {
      const lastScrolledX = this.scrolledX();
      const lastScrolledY = this.scrolledY();
      const wasMoving = this.isMoving();
      this.updateDashing();
      if (sceneActive) {
        this.moveByInput();
      }
      super.update();
      this.updateScroll(lastScrolledX, lastScrolledY);
      this.updateVehicle();
      if (!this.isMoving()) {
        this.updateNonmoving(wasMoving);
      }
      this._followers.update();
    }
    updateDashing() {
      if (this.isMoving()) {
        return;
      }
      if (this.canMove() && !this.isInVehicle() && !self.$gameMap.isDashDisabled()) {
        this._dashing = this.isDashButtonPressed() || self.$gameTemp.isDestinationValid();
      } else {
        this._dashing = false;
      }
    }
    isDashButtonPressed() {
      const shift = Input_default.isPressed("shift");
      if (ConfigManager_default.alwaysDash) {
        return !shift;
      } else {
        return shift;
      }
    }
    updateScroll(lastScrolledX, lastScrolledY) {
      const x1 = lastScrolledX;
      const y1 = lastScrolledY;
      const x2 = this.scrolledX();
      const y2 = this.scrolledY();
      if (y2 > y1 && y2 > this.centerY()) {
        self.$gameMap.scrollDown(y2 - y1);
      }
      if (x2 < x1 && x2 < this.centerX()) {
        self.$gameMap.scrollLeft(x1 - x2);
      }
      if (x2 > x1 && x2 > this.centerX()) {
        self.$gameMap.scrollRight(x2 - x1);
      }
      if (y2 < y1 && y2 < this.centerY()) {
        self.$gameMap.scrollUp(y1 - y2);
      }
    }
    updateVehicle() {
      if (this.isInVehicle() && !this.areFollowersGathering()) {
        if (this._vehicleGettingOn) {
          this.updateVehicleGetOn();
        } else if (this._vehicleGettingOff) {
          this.updateVehicleGetOff();
        } else {
          this.vehicle().syncWithPlayer();
        }
      }
    }
    updateVehicleGetOn() {
      if (!this.areFollowersGathering() && !this.isMoving()) {
        this.setDirection(this.vehicle().direction());
        this.setMoveSpeed(this.vehicle().moveSpeed());
        this._vehicleGettingOn = false;
        this.setTransparent(true);
        if (this.isInAirship()) {
          this.setThrough(true);
        }
        this.vehicle().getOn();
      }
    }
    updateVehicleGetOff() {
      if (!this.areFollowersGathering() && this.vehicle().isLowest()) {
        this._vehicleGettingOff = false;
        this._vehicleType = "walk";
        this.setTransparent(false);
      }
    }
    updateNonmoving(wasMoving) {
      if (!self.$gameMap.isEventRunning()) {
        if (wasMoving) {
          self.$gameParty.onPlayerWalk();
          this.checkEventTriggerHere([1, 2]);
          if (self.$gameMap.setupStartingEvent()) {
            return;
          }
        }
        if (this.triggerAction()) {
          return;
        }
        if (wasMoving) {
          this.updateEncounterCount();
        } else {
          self.$gameTemp.clearDestination();
        }
      }
    }
    triggerAction() {
      if (this.canMove()) {
        if (this.triggerButtonAction()) {
          return true;
        }
        if (this.triggerTouchAction()) {
          return true;
        }
      }
      return false;
    }
    triggerButtonAction() {
      if (Input_default.isTriggered("ok")) {
        if (this.getOnOffVehicle()) {
          return true;
        }
        this.checkEventTriggerHere([0]);
        if (self.$gameMap.setupStartingEvent()) {
          return true;
        }
        this.checkEventTriggerThere([0, 1, 2]);
        if (self.$gameMap.setupStartingEvent()) {
          return true;
        }
      }
      return false;
    }
    triggerTouchAction() {
      if (self.$gameTemp.isDestinationValid()) {
        const direction = this.direction();
        const x1 = this.x;
        const y1 = this.y;
        const x2 = self.$gameMap.roundXWithDirection(x1, direction);
        const y2 = self.$gameMap.roundYWithDirection(y1, direction);
        const x3 = self.$gameMap.roundXWithDirection(x2, direction);
        const y3 = self.$gameMap.roundYWithDirection(y2, direction);
        const destX = self.$gameTemp.destinationX();
        const destY = self.$gameTemp.destinationY();
        if (destX === x1 && destY === y1) {
          return this.triggerTouchActionD1(x1, y1);
        } else if (destX === x2 && destY === y2) {
          return this.triggerTouchActionD2(x2, y2);
        } else if (destX === x3 && destY === y3) {
          return this.triggerTouchActionD3(x2, y2);
        }
      }
      return false;
    }
    triggerTouchActionD1(x1, y1) {
      if (self.$gameMap.airship().pos(x1, y1)) {
        if (TouchInput_default.isTriggered() && this.getOnOffVehicle()) {
          return true;
        }
      }
      this.checkEventTriggerHere([0]);
      return self.$gameMap.setupStartingEvent();
    }
    triggerTouchActionD2(x2, y2) {
      if (self.$gameMap.boat().pos(x2, y2) || self.$gameMap.ship().pos(x2, y2)) {
        if (TouchInput_default.isTriggered() && this.getOnVehicle()) {
          return true;
        }
      }
      if (this.isInBoat() || this.isInShip()) {
        if (TouchInput_default.isTriggered() && this.getOffVehicle()) {
          return true;
        }
      }
      this.checkEventTriggerThere([0, 1, 2]);
      return self.$gameMap.setupStartingEvent();
    }
    triggerTouchActionD3(x2, y2) {
      if (self.$gameMap.isCounter(x2, y2)) {
        this.checkEventTriggerThere([0, 1, 2]);
      }
      return self.$gameMap.setupStartingEvent();
    }
    updateEncounterCount() {
      if (this.canEncounter()) {
        this._encounterCount -= this.encounterProgressValue();
      }
    }
    canEncounter() {
      return !self.$gameParty.hasEncounterNone() && self.$gameSystem.isEncounterEnabled() && !this.isInAirship() && !this.isMoveRouteForcing() && !this.isDebugThrough();
    }
    encounterProgressValue() {
      let value3 = self.$gameMap.isBush(this.x, this.y) ? 2 : 1;
      if (self.$gameParty.hasEncounterHalf()) {
        value3 *= 0.5;
      }
      if (this.isInShip()) {
        value3 *= 0.5;
      }
      return value3;
    }
    checkEventTriggerHere(triggers) {
      if (this.canStartLocalEvents()) {
        this.startMapEvent(this.x, this.y, triggers, false);
      }
    }
    checkEventTriggerThere(triggers) {
      if (this.canStartLocalEvents()) {
        const direction = this.direction();
        const x1 = this.x;
        const y1 = this.y;
        const x2 = self.$gameMap.roundXWithDirection(x1, direction);
        const y2 = self.$gameMap.roundYWithDirection(y1, direction);
        this.startMapEvent(x2, y2, triggers, true);
        if (!self.$gameMap.isAnyEventStarting() && self.$gameMap.isCounter(x2, y2)) {
          const x3 = self.$gameMap.roundXWithDirection(x2, direction);
          const y3 = self.$gameMap.roundYWithDirection(y2, direction);
          this.startMapEvent(x3, y3, triggers, true);
        }
      }
    }
    checkEventTriggerTouch(x, y) {
      if (this.canStartLocalEvents()) {
        this.startMapEvent(x, y, [1, 2], true);
      }
    }
    canStartLocalEvents() {
      return !this.isInAirship();
    }
    getOnOffVehicle() {
      if (this.isInVehicle()) {
        return this.getOffVehicle();
      } else {
        return this.getOnVehicle();
      }
    }
    getOnVehicle() {
      const direction = this.direction();
      const x1 = this.x;
      const y1 = this.y;
      const x2 = self.$gameMap.roundXWithDirection(x1, direction);
      const y2 = self.$gameMap.roundYWithDirection(y1, direction);
      if (self.$gameMap.airship().pos(x1, y1)) {
        this._vehicleType = "airship";
      } else if (self.$gameMap.ship().pos(x2, y2)) {
        this._vehicleType = "ship";
      } else if (self.$gameMap.boat().pos(x2, y2)) {
        this._vehicleType = "boat";
      }
      if (this.isInVehicle()) {
        this._vehicleGettingOn = true;
        if (!this.isInAirship()) {
          this.forceMoveForward();
        }
        this.gatherFollowers();
      }
      return this._vehicleGettingOn;
    }
    getOffVehicle() {
      if (this.vehicle().isLandOk(this.x, this.y, this.direction())) {
        if (this.isInAirship()) {
          this.setDirection(2);
        }
        this._followers.synchronize(this.x, this.y, this.direction());
        this.vehicle().getOff();
        if (!this.isInAirship()) {
          this.forceMoveForward();
          this.setTransparent(false);
        }
        this._vehicleGettingOff = true;
        this.setMoveSpeed(4);
        this.setThrough(false);
        this.makeEncounterCount();
        this.gatherFollowers();
      }
      return this._vehicleGettingOff;
    }
    forceMoveForward() {
      this.setThrough(true);
      this.moveForward();
      this.setThrough(false);
    }
    isOnDamageFloor() {
      return self.$gameMap.isDamageFloor(this.x, this.y) && !this.isInAirship();
    }
    moveStraight(d) {
      if (this.canPass(this.x, this.y, d)) {
        this._followers.updateMove();
      }
      super.moveStraight(d);
    }
    moveDiagonally(horz, vert) {
      if (this.canPassDiagonally(this.x, this.y, horz, vert)) {
        this._followers.updateMove();
      }
      super.moveDiagonally(horz, vert);
    }
    jump(xPlus, yPlus) {
      super.jump(xPlus, yPlus);
      this._followers.jumpAll();
    }
    showFollowers() {
      this._followers.show();
    }
    hideFollowers() {
      this._followers.hide();
    }
    gatherFollowers() {
      this._followers.gather();
    }
    areFollowersGathering() {
      return this._followers.areGathering();
    }
    areFollowersGathered() {
      return this._followers.areGathered();
    }
  };
  var Game_Player_default = Game_Player;

  // src-www/js/rpg_managers/DataManager.js
  var DataManager = class {
    constructor() {
      throw new Error("This is a static class");
    }
    static loadDatabase() {
      const test = this.isBattleTest() || this.isEventTest();
      const prefix = test ? "Test_" : "";
      for (let i = 0; i < this._databaseFiles.length; i++) {
        const name = this._databaseFiles[i].name;
        const src = this._databaseFiles[i].src;
        this.loadDataFile(name, prefix + src);
      }
      if (this.isEventTest()) {
        this.loadDataFile("$testEvent", `${prefix}Event.json`);
      }
    }
    static loadDataFile(name, src) {
      const xhr = new XMLHttpRequest();
      const url = `data/${src}`;
      xhr.open("GET", url);
      xhr.overrideMimeType("application/json");
      xhr.onload = () => {
        if (xhr.status < 400) {
          window[name] = JSON.parse(xhr.responseText);
          DataManager.onLoad(window[name]);
        }
      };
      xhr.onerror = this._mapLoader || (() => {
        DataManager._errorUrl = DataManager._errorUrl || url;
      });
      window[name] = null;
      xhr.send();
    }
    static isDatabaseLoaded() {
      this.checkError();
      for (let i = 0; i < this._databaseFiles.length; i++) {
        if (!window[this._databaseFiles[i].name]) {
          return false;
        }
      }
      return true;
    }
    static isGlobalInfoLoaded() {
      return this._isGlobalInfoLoaded;
    }
    static loadMapData(mapId) {
      if (mapId > 0) {
        const filename = "Map%1.json".format(mapId.padZero(3));
        this._mapLoader = ResourceHandler_default.createLoader(
          `data/${filename}`,
          this.loadDataFile.bind(this, "$dataMap", filename)
        );
        this.loadDataFile("$dataMap", filename);
      } else {
        this.makeEmptyMap();
      }
    }
    static isMapLoaded() {
      this.checkError();
      return !!self.$dataMap;
    }
    static onLoad(object) {
      let array;
      if (object === self.$dataMap) {
        this.extractMetadata(object);
        array = object.events;
      } else {
        array = object;
      }
      if (Array.isArray(array)) {
        for (const data of array) {
          if (data && data.note !== void 0) {
            this.extractMetadata(data);
          }
        }
      }
      if (object === self.$dataSystem) {
        Decrypter_default.hasEncryptedImages = !!object.hasEncryptedImages;
        Decrypter_default.hasEncryptedAudio = !!object.hasEncryptedAudio;
        Scene_Boot_default.loadSystemImages();
      }
    }
    static setupNewGame() {
      this.createGameObjects();
      this.selectSavefileForNewGame().then(() => {
        self.$gameParty.setupStartingMembers();
        self.$gamePlayer.reserveTransfer(
          self.$dataSystem.startMapId,
          self.$dataSystem.startX,
          self.$dataSystem.startY
        );
        Graphics_default.frameCount = 0;
        SceneManager_default.resetFrameCount();
      });
    }
    static setupBattleTest() {
      this.createGameObjects();
      self.$gameParty.setupBattleTest();
      BattleManager_default.setup(self.$dataSystem.testTroopId, true, false);
      BattleManager_default.setBattleTest(true);
      BattleManager_default.playBattleBgm();
    }
    static setupEventTest() {
      this.createGameObjects();
      this.selectSavefileForNewGame().then(() => {
        self.$gameParty.setupStartingMembers();
        self.$gamePlayer.reserveTransfer(-1, 8, 6);
        self.$gamePlayer.setTransparent(false);
      });
    }
    static async loadGlobalInfo() {
      if (this._globalInfo) {
        return this._globalInfo;
      }
      let json;
      try {
        json = await GameStorageManager_default.load(0);
      } catch (e) {
        console.error(e);
        this._isGlobalInfoLoaded = true;
        return [];
      }
      if (json) {
        this._globalInfo = JSON.parse(json);
        for (let i = 1; i <= this.maxSavefiles(); i++) {
          if (!await GameStorageManager_default.exists(i)) {
            delete this._globalInfo[i];
          } else {
            this._saveFileExists = true;
          }
        }
        this._isGlobalInfoLoaded = true;
        return this._globalInfo;
      } else {
        this._globalInfo = [];
        this._isGlobalInfoLoaded = true;
        return this._globalInfo;
      }
    }
    static saveGlobalInfo(info) {
      this._globalInfo = null;
      GameStorageManager_default.save(0, JSON.stringify(info));
    }
    static async isThisGameFile(savefileId) {
      const globalInfo = await this.loadGlobalInfo();
      if (globalInfo && globalInfo[savefileId]) {
        if (GameStorageManager_default.isLocalMode()) {
          return true;
        } else {
          const savefile = globalInfo[savefileId];
          return savefile.globalId === this._globalId && savefile.title === self.$dataSystem.gameTitle;
        }
      } else {
        return false;
      }
    }
    static isAnySavefileExists() {
      return this._saveFileExists;
    }
    static async latestSavefileId() {
      const globalInfo = await this.loadGlobalInfo();
      let savefileId = 1;
      let timestamp = 0;
      if (globalInfo) {
        for (let i = 1; i < globalInfo.length; i++) {
          if (await this.isThisGameFile(i) && globalInfo[i].timestamp > timestamp) {
            timestamp = globalInfo[i].timestamp;
            savefileId = i;
          }
        }
      }
      return savefileId;
    }
    static async loadAllSavefileImages() {
      const globalInfo = await this.loadGlobalInfo();
      if (globalInfo) {
        for (let i = 1; i < globalInfo.length; i++) {
          if (await this.isThisGameFile(i)) {
            const info = globalInfo[i];
            this.loadSavefileImages(info);
          }
        }
      }
    }
    static onBeforeSave() {
    }
    static onAfterSave() {
    }
    static async saveGame(savefileId) {
      try {
        this.onBeforeSave();
        await GameStorageManager_default.backup(savefileId);
        const result2 = await this.saveGameWithoutRescue(savefileId);
        this.onAfterSave();
        return result2;
      } catch (e) {
        console.error(e);
        try {
          await GameStorageManager_default.remove(savefileId);
          await GameStorageManager_default.restoreBackup(savefileId);
        } catch (e2) {
          console.error(e2);
        }
        return false;
      }
    }
    static onBeforeLoad() {
    }
    static onAfterLoad() {
    }
    static async loadGame(savefileId) {
      try {
        this.onBeforeLoad();
        const success = await this.loadGameWithoutRescue(savefileId);
        this.onAfterLoad();
        return success;
      } catch (e) {
        console.error(e);
        return false;
      }
    }
    static async loadSavefileInfo(savefileId) {
      const globalInfo = await this.loadGlobalInfo();
      return globalInfo && globalInfo[savefileId] ? globalInfo[savefileId] : null;
    }
    static lastAccessedSavefileId() {
      return this._lastAccessedId;
    }
    static async saveGameWithoutRescue(savefileId) {
      const json = JsonEx_default.stringify(this.makeSaveContents());
      if (json.length >= 2e5) {
        console.warn(
          "[DataManager.saveGameWithoutRescue] Save data length %i is larger than suggested 200000.",
          json.length
        );
      }
      await GameStorageManager_default.save(savefileId, json);
      this._lastAccessedId = savefileId;
      const globalInfo = await this.loadGlobalInfo() || [];
      globalInfo[savefileId] = this.makeSavefileInfo();
      await this.saveGlobalInfo(globalInfo);
      return true;
    }
    static async loadGameWithoutRescue(savefileId) {
      if (await this.isThisGameFile(savefileId)) {
        const json = await GameStorageManager_default.load(savefileId);
        this.createGameObjects();
        this.extractSaveContents(JsonEx_default.parse(json));
        this._lastAccessedId = savefileId;
        return true;
      } else {
        return false;
      }
    }
    static async selectSavefileForNewGame() {
      const globalInfo = await this.loadGlobalInfo();
      this._lastAccessedId = 1;
      if (globalInfo) {
        const numSavefiles = Math.max(0, globalInfo.length - 1);
        if (numSavefiles < this.maxSavefiles()) {
          this._lastAccessedId = numSavefiles + 1;
        } else {
          let timestamp = Number.MAX_VALUE;
          for (let i = 1; i < globalInfo.length; i++) {
            if (!globalInfo[i]) {
              this._lastAccessedId = i;
              break;
            }
            if (globalInfo[i].timestamp < timestamp) {
              timestamp = globalInfo[i].timestamp;
              this._lastAccessedId = i;
            }
          }
        }
      }
    }
    static makeSavefileInfo() {
      const info = {};
      info.globalId = this._globalId;
      info.title = self.$dataSystem.gameTitle;
      info.characters = self.$gameParty.charactersForSavefile();
      info.faces = self.$gameParty.facesForSavefile();
      info.playtime = self.$gameSystem.playtimeText();
      info.timestamp = Date.now();
      return info;
    }
    static setAutoSaveFileId(autoSaveFileId) {
      this._autoSaveFileId = autoSaveFileId;
    }
    static isAutoSaveFileId(saveFileId) {
      return this._autoSaveFileId !== 0 && this._autoSaveFileId === saveFileId;
    }
    static autoSaveGame() {
      if (this._autoSaveFileId !== 0 && !this.isEventTest() && self.$gameSystem.isSaveEnabled()) {
        self.$gameSystem.onBeforeSave();
        this.saveGame(this._autoSaveFileId).then((success) => {
          if (success) {
            GameStorageManager_default.cleanBackup(this._autoSaveFileId);
          }
        });
      }
    }
    static makeEmptyMap() {
      self.$dataMap = {};
      self.$dataMap.data = [];
      self.$dataMap.events = [];
      self.$dataMap.width = 100;
      self.$dataMap.height = 100;
      self.$dataMap.scrollType = 3;
    }
    static extractMetadata(data) {
      const re = /<([^<>:]+)(:?)([^>]*)>/g;
      data.meta = {};
      for (; ; ) {
        const match = re.exec(data.note);
        if (match) {
          if (match[2] === ":") {
            data.meta[match[1]] = match[3];
          } else {
            data.meta[match[1]] = true;
          }
        } else {
          break;
        }
      }
    }
    static checkError() {
      if (DataManager._errorUrl) {
        throw new Error(`Failed to load: ${DataManager._errorUrl}`);
      }
    }
    static isBattleTest() {
      return Utils_default.isOptionValid("btest");
    }
    static isEventTest() {
      return Utils_default.isOptionValid("etest");
    }
    static isSkill(item2) {
      return item2 && self.$dataSkills.contains(item2);
    }
    static isItem(item2) {
      return item2 && self.$dataItems.contains(item2);
    }
    static isWeapon(item2) {
      return item2 && self.$dataWeapons.contains(item2);
    }
    static isArmor(item2) {
      return item2 && self.$dataArmors.contains(item2);
    }
    static createGameObjects() {
      self.$gameTemp = new Game_Temp_default();
      self.$gameSystem = new Game_System_default();
      self.$gameScreen = new Game_Screen_default();
      self.$gameTimer = new Game_Timer_default();
      self.$gameMessage = new Game_Message_default();
      self.$gameSwitches = new Game_Switches_default();
      self.$gameVariables = new Game_Variables_default();
      self.$gameSelfSwitches = new Game_SelfSwitches_default();
      self.$gameActors = new Game_Actors_default();
      self.$gameParty = new Game_Party_default();
      self.$gameTroop = new Game_Troop_default();
      self.$gameMap = new Game_Map_default();
      self.$gamePlayer = new Game_Player_default();
    }
    static loadSavefileImages({ characters, faces }) {
      if (characters) {
        for (let i = 0; i < characters.length; i++) {
          ImageManager_default.reserveCharacter(characters[i][0]);
        }
      }
      if (faces) {
        for (let j = 0; j < faces.length; j++) {
          ImageManager_default.reserveFace(faces[j][0]);
        }
      }
    }
    static maxSavefiles() {
      return 20;
    }
    static makeSaveContents() {
      const contents = {};
      contents.system = self.$gameSystem;
      contents.screen = self.$gameScreen;
      contents.timer = self.$gameTimer;
      contents.switches = self.$gameSwitches;
      contents.variables = self.$gameVariables;
      contents.selfSwitches = self.$gameSelfSwitches;
      contents.actors = self.$gameActors;
      contents.party = self.$gameParty;
      contents.map = self.$gameMap;
      contents.player = self.$gamePlayer;
      return contents;
    }
    static extractSaveContents(contents) {
      self.$gameSystem = contents.system;
      self.$gameScreen = contents.screen;
      self.$gameTimer = contents.timer;
      self.$gameSwitches = contents.switches;
      self.$gameVariables = contents.variables;
      self.$gameSelfSwitches = contents.selfSwitches;
      self.$gameActors = contents.actors;
      self.$gameParty = contents.party;
      self.$gameMap = contents.map;
      self.$gamePlayer = contents.player;
    }
  };
  DataManager._globalId = "RPGMV";
  DataManager._lastAccessedId = 1;
  DataManager._errorUrl = null;
  DataManager._autoSaveFileId = 0;
  DataManager._isGlobalInfoLoaded = false;
  DataManager._saveFileExists = false;
  DataManager._databaseFiles = [
    {
      name: "$dataActors",
      src: "Actors.json"
    },
    {
      name: "$dataClasses",
      src: "Classes.json"
    },
    {
      name: "$dataSkills",
      src: "Skills.json"
    },
    {
      name: "$dataItems",
      src: "Items.json"
    },
    {
      name: "$dataWeapons",
      src: "Weapons.json"
    },
    {
      name: "$dataArmors",
      src: "Armors.json"
    },
    {
      name: "$dataEnemies",
      src: "Enemies.json"
    },
    {
      name: "$dataTroops",
      src: "Troops.json"
    },
    {
      name: "$dataStates",
      src: "States.json"
    },
    {
      name: "$dataAnimations",
      src: "Animations.json"
    },
    {
      name: "$dataTilesets",
      src: "Tilesets.json"
    },
    {
      name: "$dataCommonEvents",
      src: "CommonEvents.json"
    },
    {
      name: "$dataSystem",
      src: "System.json"
    },
    {
      name: "$dataMapInfos",
      src: "MapInfos.json"
    }
  ];
  var $dataActors = null;
  var $dataClasses = null;
  var $dataSkills = null;
  var $dataItems = null;
  var $dataWeapons = null;
  var $dataArmors = null;
  var $dataEnemies = null;
  var $dataTroops = null;
  var $dataStates = null;
  var $dataAnimations = null;
  var $dataTilesets = null;
  var $dataCommonEvents = null;
  var $dataSystem = null;
  var $dataMapInfos = null;
  var $dataMap = null;
  var $gameTemp = null;
  var $gameSystem = null;
  var $gameScreen = null;
  var $gameTimer = null;
  var $gameMessage = null;
  var $gameSwitches = null;
  var $gameVariables = null;
  var $gameSelfSwitches = null;
  var $gameActors = null;
  var $gameParty = null;
  var $gameTroop = null;
  var $gameMap = null;
  var $gamePlayer = null;
  var $testEvent = null;

  // src-www/js/main.js
  ((top, document2, PIXI2) => {
    top.$dataActors = $dataActors;
    top.$dataClasses = $dataClasses;
    top.$dataSkills = $dataSkills;
    top.$dataItems = $dataItems;
    top.$dataWeapons = $dataWeapons;
    top.$dataArmors = $dataArmors;
    top.$dataEnemies = $dataEnemies;
    top.$dataTroops = $dataTroops;
    top.$dataStates = $dataStates;
    top.$dataAnimations = $dataAnimations;
    top.$dataTilesets = $dataTilesets;
    top.$dataCommonEvents = $dataCommonEvents;
    top.$dataSystem = $dataSystem;
    top.$dataMapInfos = $dataMapInfos;
    top.$dataMap = $dataMap;
    top.$gameTemp = $gameTemp;
    top.$gameSystem = $gameSystem;
    top.$gameScreen = $gameScreen;
    top.$gameTimer = $gameTimer;
    top.$gameMessage = $gameMessage;
    top.$gameSwitches = $gameSwitches;
    top.$gameVariables = $gameVariables;
    top.$gameSelfSwitches = $gameSelfSwitches;
    top.$gameActors = $gameActors;
    top.$gameParty = $gameParty;
    top.$gameTroop = $gameTroop;
    top.$gameMap = $gameMap;
    top.$gamePlayer = $gamePlayer;
    top.$testEvent = $testEvent;
    top.Game_Temp = Game_Temp_default;
    top.Game_System = Game_System_default;
    top.Game_Timer = Game_Timer_default;
    top.Game_Message = Game_Message_default;
    top.Game_Switches = Game_Switches_default;
    top.Game_Variables = Game_Variables_default;
    top.Game_SelfSwitches = Game_SelfSwitches_default;
    top.Game_Screen = Game_Screen_default;
    top.Game_Picture = Game_Picture_default;
    top.Game_Item = Game_Item_default;
    top.Game_Action = Game_Action_default;
    top.Game_ActionResult = Game_ActionResult_default;
    top.Game_BattlerBase = Game_BattlerBase_default;
    top.Game_Battler = Game_Battler_default;
    top.Game_Actor = Game_Actor_default;
    top.Game_Enemy = Game_Enemy_default;
    top.Game_Actors = Game_Actors_default;
    top.Game_Unit = Game_Unit_default;
    top.Game_Party = Game_Party_default;
    top.Game_Troop = Game_Troop_default;
    top.Game_Map = Game_Map_default;
    top.Game_CommonEvent = Game_CommonEvent_default;
    top.Game_CharacterBase = Game_CharacterBase_default;
    top.Game_Character = Game_Character_default;
    top.Game_Player = Game_Player_default;
    top.Game_Follower = Game_Follower_default;
    top.Game_Followers = Game_Followers_default;
    top.Game_Vehicle = Game_Vehicle_default;
    top.Game_Event = Game_Event_default;
    top.Game_Interpreter = Game_Interpreter_default;
    top.Scene_Base = Scene_Base_default;
    top.Scene_Boot = Scene_Boot_default;
    top.Scene_Title = Scene_Title_default;
    top.Scene_Map = Scene_Map_default;
    top.Scene_MenuBase = Scene_MenuBase_default;
    top.Scene_Menu = Scene_Menu_default;
    top.Scene_ItemBase = Scene_ItemBase_default;
    top.Scene_Item = Scene_Item_default;
    top.Scene_Skill = Scene_Skill_default;
    top.Scene_Equip = Scene_Equip_default;
    top.Scene_Status = Scene_Status_default;
    top.Scene_Options = Scene_Options_default;
    top.Scene_File = Scene_File_default;
    top.Scene_Save = Scene_Save_default;
    top.Scene_Load = Scene_Load_default;
    top.Scene_GameEnd = Scene_GameEnd_default;
    top.Scene_Shop = Scene_Shop_default;
    top.Scene_Name = Scene_Name_default;
    top.Scene_Debug = Scene_Debug_default;
    top.Scene_Battle = Scene_Battle_default;
    top.Scene_Gameover = Scene_Gameover_default;
    top.Sprite_Base = Sprite_Base_default;
    top.Sprite_Button = Sprite_Button_default;
    top.Sprite_Character = Sprite_Character_default;
    top.Sprite_Battler = Sprite_Battler_default;
    top.Sprite_Actor = Sprite_Actor_default;
    top.Sprite_Enemy = Sprite_Enemy_default;
    top.Sprite_Animation = Sprite_Animation_default;
    top.Sprite_Damage = Sprite_Damage_default;
    top.Sprite_StateIcon = Sprite_StateIcon_default;
    top.Sprite_StateOverlay = Sprite_StateOverlay_default;
    top.Sprite_Weapon = Sprite_Weapon_default;
    top.Sprite_Balloon = Sprite_Balloon_default;
    top.Sprite_Picture = Sprite_Picture_default;
    top.Sprite_Timer = Sprite_Timer_default;
    top.Sprite_Destination = Sprite_Destination_default;
    top.Spriteset_Base = Spriteset_Base_default;
    top.Spriteset_Map = Spriteset_Map_default;
    top.Spriteset_Battle = Spriteset_Battle_default;
    top.Window_Base = Window_Base_default;
    top.Window_Selectable = Window_Selectable_default;
    top.Window_Command = Window_Command_default;
    top.Window_HorzCommand = Window_HorzCommand_default;
    top.Window_Help = Window_Help_default;
    top.Window_Gold = Window_Gold_default;
    top.Window_MenuCommand = Window_MenuCommand_default;
    top.Window_MenuStatus = Window_MenuStatus_default;
    top.Window_MenuActor = Window_MenuActor_default;
    top.Window_ItemCategory = Window_ItemCategory_default;
    top.Window_ItemList = Window_ItemList_default;
    top.Window_SkillType = Window_SkillType_default;
    top.Window_SkillStatus = Window_SkillStatus_default;
    top.Window_SkillList = Window_SkillList_default;
    top.Window_EquipStatus = Window_EquipStatus_default;
    top.Window_EquipCommand = Window_EquipCommand_default;
    top.Window_EquipSlot = Window_EquipSlot_default;
    top.Window_EquipItem = Window_EquipItem_default;
    top.Window_Status = Window_Status_default;
    top.Window_Options = Window_Options_default;
    top.Window_SavefileList = Window_SavefileList_default;
    top.Window_ShopCommand = Window_ShopCommand_default;
    top.Window_ShopBuy = Window_ShopBuy_default;
    top.Window_ShopSell = Window_ShopSell_default;
    top.Window_ShopNumber = Window_ShopNumber_default;
    top.Window_ShopStatus = Window_ShopStatus_default;
    top.Window_NameEdit = Window_NameEdit_default;
    top.Window_NameInput = Window_NameInput_default;
    top.Window_ChoiceList = Window_ChoiceList_default;
    top.Window_NumberInput = Window_NumberInput_default;
    top.Window_EventItem = Window_EventItem_default;
    top.Window_Message = Window_Message_default;
    top.Window_ScrollText = Window_ScrollText_default;
    top.Window_MapName = Window_MapName_default;
    top.Window_BattleLog = Window_BattleLog_default;
    top.Window_PartyCommand = Window_PartyCommand_default;
    top.Window_ActorCommand = Window_ActorCommand_default;
    top.Window_BattleStatus = Window_BattleStatus_default;
    top.Window_BattleActor = Window_BattleActor_default;
    top.Window_BattleEnemy = Window_BattleEnemy_default;
    top.Window_BattleSkill = Window_BattleSkill_default;
    top.Window_BattleItem = Window_BattleItem_default;
    top.Window_TitleCommand = Window_TitleCommand_default;
    top.Window_GameEnd = Window_GameEnd_default;
    top.Window_DebugRange = Window_DebugRange_default;
    top.Window_DebugEdit = Window_DebugEdit_default;
    top.ProgressWatcher = ProgressWatcher_default;
    top.Utils = Utils_default;
    top.CacheEntry = CacheEntry_default;
    top.CacheMap = CacheMap_default;
    top.ImageCache = ImageCache_default;
    top.RequestQueue = RequestQueue_default;
    top.Point = Point_default;
    top.Rectangle = Rectangle_default;
    top.Bitmap = Bitmap_default;
    top.BitmapPIXI = BitmapPIXI_default;
    top.Graphics = Graphics_default;
    top.Input = Input_default;
    top.TouchInput = TouchInput_default;
    top.Sprite = Sprite_default;
    top.Tilemap = Tilemap_default;
    top.ShaderTilemap = ShaderTilemap_default;
    top.TilingSprite = TilingSprite_default;
    top.ScreenSprite = ScreenSprite_default;
    top.WindowSkinCache = WindowSkinCache_default;
    top.Window = Window_default;
    top.WindowLayer = WindowLayer_default;
    top.Weather = Weather_default;
    top.ToneFilter = ToneFilter_default;
    top.ToneSprite = ToneSprite_default;
    top.Stage = Stage_default;
    top.WebAudio = WebAudio_default;
    top.JsonEx = JsonEx_default;
    top.Decrypter = Decrypter_default;
    top.ResourceHandler = ResourceHandler_default;
    top.DataManager = DataManager;
    top.ConfigManager = ConfigManager_default;
    top.GameStorageManager = GameStorageManager_default;
    top.ImageManager = ImageManager_default;
    top.AudioManager = AudioManager_default;
    top.SoundManager = SoundManager_default;
    top.TextManager = TextManager_default;
    top.SceneManager = SceneManager_default;
    top.BattleManager = BattleManager_default;
    top.PluginManager = PluginManager_default;
    PluginManager_default.setup($plugins);
    const init = () => {
      document2.body.classList.remove("is-loading");
      PIXI2.settings.SCALE_MODE = PIXI2.SCALE_MODES.NEAREST;
      PIXI2.settings.ROUND_PIXELS = true;
      PIXI2.settings.GC_MAX_IDLE = 600;
      PIXI2.settings.MIPMAP_TEXTURES = PIXI2.MIPMAP_MODES.OFF;
      PIXI2.settings.RESOLUTION = window.devicePixelRatio;
      if (Utils_default.isMobileSafari()) {
        PIXI2.settings.PRECISION_FRAGMENT = PIXI2.PRECISION.HIGH;
      }
      SceneManager_default.run(Scene_Boot_default);
    };
    document2.readyState === "complete" ? init() : window.addEventListener("load", init);
    if (true) {
      new EventSource("/esbuild").addEventListener(
        "change",
        () => location.reload()
      );
    }
  })(self, document, PIXI);
})();
//# sourceMappingURL=main.js.map
