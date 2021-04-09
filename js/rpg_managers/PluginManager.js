//-----------------------------------------------------------------------------
// PluginManager
//
// The static class that manages the plugins.

function PluginManager() {
    throw new Error('This is a static class');
}

PluginManager._path         = 'js/plugins/';
PluginManager._scripts      = [];
PluginManager._errorUrls    = [];
PluginManager._parameters   = {};
PluginManager._scriptsToLoadLength = $priorityScripts.length + $plugins.filter((plugin) => plugin.status === true).length;
PluginManager._scriptsLoadedLength = 0;
PluginManager._callback = () => null;

PluginManager.init = function(priorities, plugins, callback) {
    this.setupCounter();
    this.setupPriorities(priorities);
    this._callback = callback;
    window.setTimeout( () => this.setup(plugins), 10);
};

PluginManager.setupCounter = function() {
    let counter = document.createElement('div');
    let counterInner = document.createElement('div');
    let counterSpan = document.createElement('span');
    counter.id = "counter";
    counterInner.id = 'counter--inner';
    counterInner.innerHTML = "Loading ";
    counterSpan.id = 'counter--count';
    counterSpan.innerHTML = '1%';
    counter.appendChild(counterInner);
    counterInner.appendChild(counterSpan);
    document.body.appendChild(counter);
};

PluginManager.updateCounter = function() {
    let counter = document.getElementById('counter--count');
    if (counter) counter.innerHTML = Math.floor((this._scriptsLoadedLength / this._scriptsToLoadLength) * 100) + '%';
};

PluginManager.removeCounter = function() {
    let counter = document.getElementById('counter');
    document.body.removeChild(counter);
};

PluginManager.setupPriorities = function(scripts) {
    $priorityScripts.forEach(function(script) {
        this.loadScript(script.name + '.js', script.path);
        this._scripts.push(script.name);
    }, this);
};

PluginManager.setup = function(plugins) {
    plugins.forEach(function(plugin) {
        if (plugin.status && !this._scripts.includes(plugin.name)) {
            this.setParameters(plugin.name, plugin.parameters);
            this.loadScript(plugin.name + '.js');
            this._scripts.push(plugin.name);
        }
    }, this);
};

PluginManager.checkErrors = function() {
    let url = this._errorUrls.shift();
    if (url) {
        throw new Error('Failed to load: ' + url);
    }
};

PluginManager.parameters = function(name) {
    return this._parameters[name.toLowerCase()] || {};
};

PluginManager.setParameters = function(name, parameters) {
    this._parameters[name.toLowerCase()] = parameters;
};

PluginManager.loadScript = function(name, path) {
    let url;
    let script = document.createElement('script');
    if (path) {
        url = path + name;
    } else {
        url = this._path + name;
    }
    script.type = 'text/javascript';
    script.src = url;
    script.async = false;
    script.onerror = this.onError.bind(this);
    script.onload = this.onLoad.bind(this);
    script._url = url;
    document.body.appendChild(script);
};

PluginManager.onError = function(e) {
    this._errorUrls.push(e.target._url);
};

PluginManager.onLoad = function(e) {
    this._scriptsLoadedLength++;
    this.updateCounter();
    if (this._scriptsLoadedLength === this._scriptsToLoadLength) {
        this.removeCounter();
        this._callback();
    }
};
