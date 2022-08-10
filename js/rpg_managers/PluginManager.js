//-----------------------------------------------------------------------------
// PluginManager
//
// The static class that manages the plugins.

class PluginManager {
  constructor() {
    throw new Error("This is a static class");
  }

  static setup(plugins) {
    plugins.forEach(function ({ status, name, parameters }) {
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
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = url;
    script.async = false;
    script.onerror = this.onError.bind(this);
    script._url = url;
    document.body.appendChild(script);
  }

  static onError({ target }) {
    this._errorUrls.push(target._url);
  }
}

PluginManager._path = "js/plugins/";
PluginManager._scripts = [];
PluginManager._errorUrls = [];
PluginManager._parameters = {};

export default PluginManager;
