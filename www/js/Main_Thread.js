"use strict";
(() => {
  var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
    get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
  }) : x)(function(x) {
    if (typeof require !== "undefined")
      return require.apply(this, arguments);
    throw new Error('Dynamic require of "' + x + '" is not supported');
  });

  // node_modules/post-me/dist/index.esnext.mjs
  var MARKER = "@post-me";
  function createUniqueIdFn() {
    let __id = 0;
    return function() {
      const id = __id;
      __id += 1;
      return id;
    };
  }
  var ConcreteEmitter = class {
    constructor() {
      this._listeners = {};
    }
    /** {@inheritDoc Emitter.addEventListener} */
    addEventListener(eventName, listener) {
      let listeners = this._listeners[eventName];
      if (!listeners) {
        listeners = /* @__PURE__ */ new Set();
        this._listeners[eventName] = listeners;
      }
      listeners.add(listener);
    }
    /** {@inheritDoc Emitter.removeEventListener} */
    removeEventListener(eventName, listener) {
      let listeners = this._listeners[eventName];
      if (!listeners) {
        return;
      }
      listeners.delete(listener);
    }
    /** {@inheritDoc Emitter.once} */
    once(eventName) {
      return new Promise((resolve) => {
        const listener = (data) => {
          this.removeEventListener(eventName, listener);
          resolve(data);
        };
        this.addEventListener(eventName, listener);
      });
    }
    /** @internal */
    emit(eventName, data) {
      let listeners = this._listeners[eventName];
      if (!listeners) {
        return;
      }
      listeners.forEach((listener) => {
        listener(data);
      });
    }
    /** @internal */
    removeAllListeners() {
      Object.values(this._listeners).forEach((listeners) => {
        if (listeners) {
          listeners.clear();
        }
      });
    }
  };
  var MessageType;
  (function(MessageType2) {
    MessageType2["HandshakeRequest"] = "handshake-request";
    MessageType2["HandshakeResponse"] = "handshake-response";
    MessageType2["Call"] = "call";
    MessageType2["Response"] = "response";
    MessageType2["Error"] = "error";
    MessageType2["Event"] = "event";
    MessageType2["Callback"] = "callback";
  })(MessageType || (MessageType = {}));
  function createHandshakeRequestMessage(sessionId) {
    return {
      type: MARKER,
      action: MessageType.HandshakeRequest,
      sessionId
    };
  }
  function createCallMessage(sessionId, requestId, methodName, args) {
    return {
      type: MARKER,
      action: MessageType.Call,
      sessionId,
      requestId,
      methodName,
      args
    };
  }
  function createResponsMessage(sessionId, requestId, result, error) {
    const message = {
      type: MARKER,
      action: MessageType.Response,
      sessionId,
      requestId
    };
    if (result !== void 0) {
      message.result = result;
    }
    if (error !== void 0) {
      message.error = error;
    }
    return message;
  }
  function createCallbackMessage(sessionId, requestId, callbackId, args) {
    return {
      type: MARKER,
      action: MessageType.Callback,
      sessionId,
      requestId,
      callbackId,
      args
    };
  }
  function createEventMessage(sessionId, eventName, payload) {
    return {
      type: MARKER,
      action: MessageType.Event,
      sessionId,
      eventName,
      payload
    };
  }
  function isMessage(m) {
    return m && m.type === MARKER;
  }
  function isHandshakeResponseMessage(m) {
    return isMessage(m) && m.action === MessageType.HandshakeResponse;
  }
  function isCallMessage(m) {
    return isMessage(m) && m.action === MessageType.Call;
  }
  function isResponseMessage(m) {
    return isMessage(m) && m.action === MessageType.Response;
  }
  function isCallbackMessage(m) {
    return isMessage(m) && m.action === MessageType.Callback;
  }
  function isEventMessage(m) {
    return isMessage(m) && m.action === MessageType.Event;
  }
  function makeCallbackEvent(requestId) {
    return `callback_${requestId}`;
  }
  function makeResponseEvent(requestId) {
    return `response_${requestId}`;
  }
  var Dispatcher = class extends ConcreteEmitter {
    constructor(messenger, sessionId) {
      super();
      this.uniqueId = createUniqueIdFn();
      this.messenger = messenger;
      this.sessionId = sessionId;
      this.removeMessengerListener = this.messenger.addMessageListener(this.messengerListener.bind(this));
    }
    messengerListener(event) {
      const { data } = event;
      if (!isMessage(data)) {
        return;
      }
      if (this.sessionId !== data.sessionId) {
        return;
      }
      if (isCallMessage(data)) {
        this.emit(MessageType.Call, data);
      } else if (isResponseMessage(data)) {
        this.emit(makeResponseEvent(data.requestId), data);
      } else if (isEventMessage(data)) {
        this.emit(MessageType.Event, data);
      } else if (isCallbackMessage(data)) {
        this.emit(makeCallbackEvent(data.requestId), data);
      }
    }
    callOnRemote(methodName, args, transfer) {
      const requestId = this.uniqueId();
      const callbackEvent = makeCallbackEvent(requestId);
      const responseEvent = makeResponseEvent(requestId);
      const message = createCallMessage(this.sessionId, requestId, methodName, args);
      this.messenger.postMessage(message, transfer);
      return { callbackEvent, responseEvent };
    }
    respondToRemote(requestId, value, error, transfer) {
      if (error instanceof Error) {
        error = {
          name: error.name,
          message: error.message
        };
      }
      const message = createResponsMessage(this.sessionId, requestId, value, error);
      this.messenger.postMessage(message, transfer);
    }
    callbackToRemote(requestId, callbackId, args) {
      const message = createCallbackMessage(this.sessionId, requestId, callbackId, args);
      this.messenger.postMessage(message);
    }
    emitToRemote(eventName, payload, transfer) {
      const message = createEventMessage(this.sessionId, eventName, payload);
      this.messenger.postMessage(message, transfer);
    }
    close() {
      this.removeMessengerListener();
      this.removeAllListeners();
    }
  };
  var ParentHandshakeDispatcher = class extends ConcreteEmitter {
    constructor(messenger, sessionId) {
      super();
      this.messenger = messenger;
      this.sessionId = sessionId;
      this.removeMessengerListener = this.messenger.addMessageListener(this.messengerListener.bind(this));
    }
    messengerListener(event) {
      const { data } = event;
      if (!isMessage(data)) {
        return;
      }
      if (this.sessionId !== data.sessionId) {
        return;
      }
      if (isHandshakeResponseMessage(data)) {
        this.emit(data.sessionId, data);
      }
    }
    initiateHandshake() {
      const message = createHandshakeRequestMessage(this.sessionId);
      this.messenger.postMessage(message);
      return this.sessionId;
    }
    close() {
      this.removeMessengerListener();
      this.removeAllListeners();
    }
  };
  var ProxyType;
  (function(ProxyType2) {
    ProxyType2["Callback"] = "callback";
  })(ProxyType || (ProxyType = {}));
  function createCallbackProxy(callbackId) {
    return {
      type: MARKER,
      proxy: ProxyType.Callback,
      callbackId
    };
  }
  function isCallbackProxy(p) {
    return p && p.type === MARKER && p.proxy === ProxyType.Callback;
  }
  var ConcreteRemoteHandle = class extends ConcreteEmitter {
    constructor(dispatcher) {
      super();
      this._dispatcher = dispatcher;
      this._callTransfer = {};
      this._dispatcher.addEventListener(MessageType.Event, this._handleEvent.bind(this));
    }
    close() {
      this.removeAllListeners();
    }
    setCallTransfer(methodName, transfer) {
      this._callTransfer[methodName] = transfer;
    }
    call(methodName, ...args) {
      return this.customCall(methodName, args);
    }
    customCall(methodName, args, options = {}) {
      return new Promise((resolve, reject) => {
        const sanitizedArgs = [];
        const callbacks = [];
        let callbackId = 0;
        args.forEach((arg) => {
          if (typeof arg === "function") {
            callbacks.push(arg);
            sanitizedArgs.push(createCallbackProxy(callbackId));
            callbackId += 1;
          } else {
            sanitizedArgs.push(arg);
          }
        });
        const hasCallbacks = callbacks.length > 0;
        let callbackListener = void 0;
        if (hasCallbacks) {
          callbackListener = (data) => {
            const { callbackId: callbackId2, args: args2 } = data;
            callbacks[callbackId2](...args2);
          };
        }
        let transfer = options.transfer;
        if (transfer === void 0 && this._callTransfer[methodName]) {
          transfer = this._callTransfer[methodName](...sanitizedArgs);
        }
        const { callbackEvent, responseEvent } = this._dispatcher.callOnRemote(methodName, sanitizedArgs, transfer);
        if (hasCallbacks) {
          this._dispatcher.addEventListener(callbackEvent, callbackListener);
        }
        this._dispatcher.once(responseEvent).then((response) => {
          if (callbackListener) {
            this._dispatcher.removeEventListener(callbackEvent, callbackListener);
          }
          const { result, error } = response;
          if (error !== void 0) {
            reject(error);
          } else {
            resolve(result);
          }
        });
      });
    }
    _handleEvent(data) {
      const { eventName, payload } = data;
      this.emit(eventName, payload);
    }
  };
  var ConcreteLocalHandle = class {
    constructor(dispatcher, localMethods) {
      this._dispatcher = dispatcher;
      this._methods = localMethods;
      this._returnTransfer = {};
      this._emitTransfer = {};
      this._dispatcher.addEventListener(MessageType.Call, this._handleCall.bind(this));
    }
    emit(eventName, payload, options = {}) {
      let transfer = options.transfer;
      if (transfer === void 0 && this._emitTransfer[eventName]) {
        transfer = this._emitTransfer[eventName](payload);
      }
      this._dispatcher.emitToRemote(eventName, payload, transfer);
    }
    setMethods(methods) {
      this._methods = methods;
    }
    setMethod(methodName, method) {
      this._methods[methodName] = method;
    }
    setReturnTransfer(methodName, transfer) {
      this._returnTransfer[methodName] = transfer;
    }
    setEmitTransfer(eventName, transfer) {
      this._emitTransfer[eventName] = transfer;
    }
    _handleCall(data) {
      const { requestId, methodName, args } = data;
      const callMethod = new Promise((resolve, reject) => {
        const method = this._methods[methodName];
        if (typeof method !== "function") {
          reject(new Error(`The method "${methodName}" has not been implemented.`));
          return;
        }
        const desanitizedArgs = args.map((arg) => {
          if (isCallbackProxy(arg)) {
            const { callbackId } = arg;
            return (...args2) => {
              this._dispatcher.callbackToRemote(requestId, callbackId, args2);
            };
          } else {
            return arg;
          }
        });
        Promise.resolve(this._methods[methodName](...desanitizedArgs)).then(resolve).catch(reject);
      });
      callMethod.then((result) => {
        let transfer;
        if (this._returnTransfer[methodName]) {
          transfer = this._returnTransfer[methodName](result);
        }
        this._dispatcher.respondToRemote(requestId, result, void 0, transfer);
      }).catch((error) => {
        this._dispatcher.respondToRemote(requestId, void 0, error);
      });
    }
  };
  var ConcreteConnection = class {
    constructor(dispatcher, localMethods) {
      this._dispatcher = dispatcher;
      this._localHandle = new ConcreteLocalHandle(dispatcher, localMethods);
      this._remoteHandle = new ConcreteRemoteHandle(dispatcher);
    }
    close() {
      this._dispatcher.close();
      this.remoteHandle().close();
    }
    localHandle() {
      return this._localHandle;
    }
    remoteHandle() {
      return this._remoteHandle;
    }
  };
  var uniqueSessionId = createUniqueIdFn();
  var runUntil = (worker, condition, unfulfilled, maxAttempts, attemptInterval) => {
    let attempt = 0;
    const fn = () => {
      if (!condition() && (attempt < maxAttempts || maxAttempts < 1)) {
        worker();
        attempt += 1;
        setTimeout(fn, attemptInterval);
      } else if (!condition() && attempt >= maxAttempts && maxAttempts >= 1) {
        unfulfilled();
      }
    };
    fn();
  };
  function ParentHandshake(messenger, localMethods = {}, maxAttempts = 5, attemptsInterval = 100) {
    const thisSessionId = uniqueSessionId();
    let connected = false;
    return new Promise((resolve, reject) => {
      const handshakeDispatcher = new ParentHandshakeDispatcher(messenger, thisSessionId);
      handshakeDispatcher.once(thisSessionId).then((response) => {
        connected = true;
        handshakeDispatcher.close();
        const { sessionId } = response;
        const dispatcher = new Dispatcher(messenger, sessionId);
        const connection = new ConcreteConnection(dispatcher, localMethods);
        resolve(connection);
      });
      runUntil(() => handshakeDispatcher.initiateHandshake(), () => connected, () => reject(new Error(`Handshake failed, reached maximum number of attempts`)), maxAttempts, attemptsInterval);
    });
  }
  var BareMessenger = class {
    constructor(postable) {
      this.postMessage = (message, transfer = []) => {
        postable.postMessage(message, transfer);
      };
      this.addMessageListener = (listener) => {
        const outerListener = (event) => {
          listener(event);
        };
        postable.addEventListener("message", outerListener);
        const removeListener = () => {
          postable.removeEventListener("message", outerListener);
        };
        return removeListener;
      };
    }
  };
  var WorkerMessenger = class extends BareMessenger {
    constructor({ worker }) {
      super(worker);
    }
  };

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
      const result = typeof __require === "function" && typeof process === "object";
      Utils._nwjs = result;
      return result;
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
      const result = !!navigator.userAgent.match(r);
      Utils._mobileDevice = result;
      return result;
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
      const result = !!(agent.match(/iPhone|iPad|iPod/) && agent.match(/AppleWebKit/) && !agent.match("CriOS"));
      Utils._mobileSafari = result;
      return result;
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
      const result = !!(agent.match(/Android/) && agent.match(/Chrome/));
      Utils._androidChrome = result;
      return result;
    }
    /**
     * Checks whether the browser can read files in the game folder.
     *
     * @static
     * @method canReadGameFiles
     * @return {Boolean} True if the browser can read files in the game folder
     */
    static canReadGameFiles() {
      if (Utils.isWorker()) {
        console.log("Utils.canReadGameFiles is not supported on worker.");
        return true;
      }
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
    static rgbToCssColor(r, g, b) {
      r = Math.round(r);
      g = Math.round(g);
      b = Math.round(b);
      return `rgb(${r},${g},${b})`;
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
    static isWorker() {
      return typeof importScripts === "function";
    }
    /**
     * Load a script regardless of environment
     *
     * @static
     * @method loadScript
     * @return {null || <script> DOMNode}
     */
    static loadScript(path, module) {
      if (this.isWorker()) {
        importScripts(path);
        return null;
      } else {
        const script = document.createElement("script");
        script.type = module ? "module" : "text/javascript";
        script.src = path;
        script.async = false;
        document.body.appendChild(script);
        return script;
      }
    }
    /**
     * Returns a function that fires at the specified threshold
     *
     * @static
     * @method getThrottledFunction
     * @return {Function}
     */
    static getThrottledFunction(fn, threshold, scope) {
      let last;
      let deferTimer;
      return function() {
        const context = scope || this;
        const now = +/* @__PURE__ */ new Date();
        const args = arguments;
        if (last && now < last + threshold) {
          clearTimeout(deferTimer);
          deferTimer = setTimeout(() => {
            last = now;
            fn.apply(context, args);
          }, threshold + last - now);
        } else {
          last = now;
          fn.apply(context, args);
        }
      };
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

  // src-www/js/Main_Thread.js
  var Main_Thread = class {
    constructor() {
      throw new Error("This is a static class");
    }
    static getWindowData() {
      return {
        devicePixelRatio: window.devicePixelRatio,
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
        cordova: !!window.cordova,
        navigatorStandalone: !!window.navigator.standalone,
        __TAURI__: !!window.__TAURI__
      };
    }
    static async attachListeners(Render_Thread) {
      const isSupportPassive = Utils_default.isSupportPassiveEvent();
      const throttleThreshold = 33.34;
      Render_Thread.addEventListener("close", (payload) => {
        console.log("Close window request");
        window.close();
      });
      Render_Thread.addEventListener("audio", (payload) => {
        console.log("Web audio request");
      });
      document.addEventListener("keydown", (e) => {
        switch (e.keyCode) {
          case 8:
          case 33:
          case 34:
          case 37:
          case 38:
          case 39:
          case 40:
          case 113:
          case 114:
          case 115:
            e.preventDefault();
        }
        Render_Thread.call("receiveEvent", {
          type: "keydown",
          shimType: "document",
          key: e.key,
          code: e.code,
          altKey: e.altKey,
          charCode: e.charCode,
          ctrlKey: e.ctrlKey,
          keyCode: e.keyCode,
          shiftKey: e.shiftKey
        });
      });
      document.addEventListener(
        "keyup",
        (e) => Render_Thread.call("receiveEvent", {
          type: "keyup",
          shimType: "document",
          key: e.key,
          code: e.code,
          altKey: e.altKey,
          charCode: e.charCode,
          ctrlKey: e.ctrlKey,
          keyCode: e.keyCode,
          shiftKey: e.shiftKey
        })
      );
      document.addEventListener(
        "mousedown",
        (e) => Render_Thread.call("receiveEvent", {
          type: "mousedown",
          shimType: "document",
          clientX: e.clientX,
          clientY: e.clientY,
          button: e.button,
          layerX: e.layerX,
          layerY: e.layerY,
          offsetX: e.offsetX,
          offsetY: e.offsetY,
          pageX: e.pageX,
          pageY: e.pageY,
          screenX: e.screenX,
          screenY: e.screenY,
          timeStamp: e.timeStamp,
          x: e.x,
          y: e.y
        })
      );
      document.addEventListener(
        "mouseup",
        (e) => Render_Thread.call("receiveEvent", {
          type: "mouseup",
          shimType: "document",
          clientX: e.clientX,
          clientY: e.clientY,
          button: e.button,
          layerX: e.layerX,
          layerY: e.layerY,
          offsetX: e.offsetX,
          offsetY: e.offsetY,
          pageX: e.pageX,
          pageY: e.pageY,
          screenX: e.screenX,
          screenY: e.screenY,
          timeStamp: e.timeStamp,
          x: e.x,
          y: e.y
        })
      );
      const mousemoveFunc = (e) => Render_Thread.call("receiveEvent", {
        type: "mousemove",
        shimType: "document",
        clientX: e.clientX,
        clientY: e.clientY,
        button: e.button,
        layerX: e.layerX,
        layerY: e.layerY,
        offsetX: e.offsetX,
        offsetY: e.offsetY,
        pageX: e.pageX,
        pageY: e.pageY,
        screenX: e.screenX,
        screenY: e.screenY,
        timeStamp: e.timeStamp,
        x: e.x,
        y: e.y
      });
      const mousemoveThrottled = Utils_default.getThrottledFunction(
        mousemoveFunc,
        throttleThreshold
      );
      document.addEventListener("mousemove", (e) => mousemoveThrottled(e));
      const wheelFunc = (e) => {
        e.preventDefault();
        Render_Thread.call("receiveEvent", {
          type: "wheel",
          shimType: "document",
          deltaX: e.deltaX,
          deltaY: e.deltaY,
          deltaZ: e.deltaZ
        });
      };
      const wheelThrottled = Utils_default.getThrottledFunction(
        wheelFunc,
        throttleThreshold
      );
      document.addEventListener(
        "wheel",
        (e) => wheelThrottled(e),
        isSupportPassive ? {
          passive: false
        } : false
      );
      document.addEventListener(
        "touchend",
        (e) => Render_Thread.call("receiveEvent", {
          type: "touchend",
          shimType: "document",
          changedTouches: JSON.stringify(e.changedTouches),
          timeStamp: e.timeStamp,
          touches: JSON.stringify(e.touches)
        })
      );
      document.addEventListener(
        "touchstart",
        (e) => {
          const changedTouches = {
            0: {},
            length: 0
          };
          const touches = {
            0: {},
            length: 0
          };
          let i = 0;
          for (const touch of e.changedTouches) {
            changedTouches[i] = {
              pageX: touch.pageX,
              pageY: touch.pageY
            };
            i++;
          }
          changedTouches.length = i;
          let j = 0;
          for (const touch of e.touches) {
            touches[j] = {
              pageX: touch.pageX,
              pageY: touch.pageY
            };
            j++;
          }
          touches.length = j;
          Render_Thread.call("receiveEvent", {
            type: "touchstart",
            shimType: "document",
            changedTouches,
            timeStamp: e.timeStamp,
            touches
          });
        },
        isSupportPassive ? {
          passive: false
        } : false
      );
      const touchmoveFunc = (e) => Render_Thread.call("receiveEvent", {
        type: "touchmove",
        shimType: "document",
        changedTouches: JSON.stringify(e.changedTouches),
        timeStamp: e.timeStamp,
        touches: JSON.stringify(e.touches)
      });
      const touchmoveThrottled = Utils_default.getThrottledFunction(
        touchmoveFunc,
        throttleThreshold
      );
      document.addEventListener(
        "touchmove",
        (e) => touchmoveThrottled(e),
        isSupportPassive ? {
          passive: false
        } : false
      );
      document.addEventListener(
        "touchcancel",
        (e) => Render_Thread.call("receiveEvent", {
          type: "touchcancel",
          shimType: "document"
        })
      );
      document.addEventListener(
        "pointerdown",
        (e) => Render_Thread.call("receiveEvent", {
          type: "pointerdown",
          shimType: "document",
          clientX: e.clientX,
          clientY: e.clientY,
          button: e.button,
          layerX: e.layerX,
          layerY: e.layerY,
          offsetX: e.offsetX,
          offsetY: e.offsetY,
          pageX: e.pageX,
          pageY: e.pageY,
          screenX: e.screenX,
          screenY: e.screenY,
          timeStamp: e.timeStamp,
          x: e.x,
          y: e.y
        })
      );
      document.addEventListener(
        "visibilitychange",
        (e) => Render_Thread.call("receiveEvent", {
          type: "visibilitychange",
          shimType: "document",
          timeStamp: e.timeStamp,
          visibilityState: document.visibilityState
        })
      );
      const resizeFunc = (e) => Render_Thread.call("receiveEvent", {
        type: "resize",
        shimType: "window",
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
        timeStamp: e.timeStamp
      });
      const resizeThrottled = Utils_default.getThrottledFunction(
        resizeFunc,
        throttleThreshold
      );
      window.addEventListener("resize", (e) => resizeThrottled(e));
      window.addEventListener(
        "blur",
        (e) => Render_Thread.call("receiveEvent", {
          type: "blur",
          shimType: "window",
          timeStamp: e.timeStamp
        })
      );
      window.addEventListener(
        "error",
        (e) => Render_Thread.call("receiveEvent", {
          type: "error",
          shimType: "window",
          timeStamp: e.timeStamp,
          message: e.message,
          filename: e.filename
        })
      );
    }
    static async setupDataThread() {
      const dataWorker = new Worker("js/Data_Thread.js", { type: "module" });
      const Data_Thread = await Comlink.wrap(dataWorker);
      await Data_Thread.start();
      window.Data_Thread = Data_Thread;
    }
    static async setupRenderThread() {
      if (HTMLCanvasElement.prototype.transferControlToOffscreen) {
        const worker = new Worker("js/Render_Thread.js", {
          type: "module"
        });
        window.Render_Thread = worker;
        const messenger = new WorkerMessenger({ worker });
        const context = this;
        ParentHandshake(messenger).then((connection) => {
          const remoteHandle = connection.remoteHandle();
          const windowData = context.getWindowData();
          remoteHandle.call("updateWindowData", windowData);
          remoteHandle.call("updatePluginData", $plugins);
          context.attachListeners(remoteHandle);
          const htmlCanvas = document.createElement("canvas");
          htmlCanvas.id = "GameCanvas";
          document.body.appendChild(htmlCanvas);
          const offscreen = htmlCanvas.transferControlToOffscreen();
          remoteHandle.customCall("receiveCanvas", [offscreen, 2], {
            transfer: [offscreen]
          });
          remoteHandle.call("start");
        });
      } else {
        Utils_default.loadScript("js/Render_Thread.js", true);
      }
    }
    static async start() {
      await this.setupRenderThread();
    }
  };
  Main_Thread.start();
})();
//# sourceMappingURL=Main_Thread.js.map
