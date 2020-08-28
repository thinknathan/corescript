const $priorityScripts = [
    {"name":"pixi","path":"js/libs/"},
    {"name":"pixi-tilemap","path":"js/libs/"},
    {"name":"pixi-fps","path":"js/libs/"},
    {"name":"lz-string","path":"js/libs/"},
    {"name":"iphone-inline-video.browser","path":"js/libs/"},
    
    {"path":"js/rpg_core/","name":"ProgressWatcher"},
    {"path":"js/rpg_core/","name":"JsExtensions"},
    {"path":"js/rpg_core/","name":"Utils"},
    {"path":"js/rpg_core/","name":"CacheEntry"},
    {"path":"js/rpg_core/","name":"CacheMap"},
    {"path":"js/rpg_core/","name":"ImageCache"},
    {"path":"js/rpg_core/","name":"RequestQueue"},
    {"path":"js/rpg_core/","name":"Point"},
    {"path":"js/rpg_core/","name":"Rectangle"},
    {"path":"js/rpg_core/","name":"Bitmap"},
    {"path":"js/rpg_core/","name":"Graphics"},
    {"path":"js/rpg_core/","name":"Input"},
    {"path":"js/rpg_core/","name":"TouchInput"},
    {"path":"js/rpg_core/","name":"Sprite"},
    {"path":"js/rpg_core/","name":"Tilemap"},
    {"path":"js/rpg_core/","name":"ShaderTilemap"},
    {"path":"js/rpg_core/","name":"TilingSprite"},
    {"path":"js/rpg_core/","name":"ScreenSprite"},
    {"path":"js/rpg_core/","name":"Window"},
    {"path":"js/rpg_core/","name":"WindowLayer"},
    {"path":"js/rpg_core/","name":"Weather"},
    {"path":"js/rpg_core/","name":"ToneFilter"},
    {"path":"js/rpg_core/","name":"ToneSprite"},
    {"path":"js/rpg_core/","name":"Stage"},
    {"path":"js/rpg_core/","name":"WebAudio"},
    {"path":"js/rpg_core/","name":"JsonEx"},
    {"path":"js/rpg_core/","name":"Decrypter"},
    {"path":"js/rpg_core/","name":"ResourceHandler"},
    
    {"path":"js/rpg_managers/","name":"DataManager"},
    {"path":"js/rpg_managers/","name":"ConfigManager"},
    {"path":"js/rpg_managers/","name":"StorageManager"},
    {"path":"js/rpg_managers/","name":"ImageManager"},
    {"path":"js/rpg_managers/","name":"AudioManager"},
    {"path":"js/rpg_managers/","name":"SoundManager"},
    {"path":"js/rpg_managers/","name":"TextManager"},
    {"path":"js/rpg_managers/","name":"SceneManager"},
    {"path":"js/rpg_managers/","name":"BattleManager"},

    {"path":"js/rpg_objects/","name":"Game_Temp"},
    {"path":"js/rpg_objects/","name":"Game_System"},
    {"path":"js/rpg_objects/","name":"Game_Timer"},
    {"path":"js/rpg_objects/","name":"Game_Message"},
    {"path":"js/rpg_objects/","name":"Game_Switches"},
    {"path":"js/rpg_objects/","name":"Game_Variables"},
    {"path":"js/rpg_objects/","name":"Game_SelfSwitches"},
    {"path":"js/rpg_objects/","name":"Game_Screen"},
    {"path":"js/rpg_objects/","name":"Game_Picture"},
    {"path":"js/rpg_objects/","name":"Game_Item"},
    {"path":"js/rpg_objects/","name":"Game_Action"},
    {"path":"js/rpg_objects/","name":"Game_ActionResult"},
    {"path":"js/rpg_objects/","name":"Game_BattlerBase"},
    {"path":"js/rpg_objects/","name":"Game_Battler"},
    {"path":"js/rpg_objects/","name":"Game_Actor"},
    {"path":"js/rpg_objects/","name":"Game_Enemy"},
    {"path":"js/rpg_objects/","name":"Game_Actors"},
    {"path":"js/rpg_objects/","name":"Game_Unit"},
    {"path":"js/rpg_objects/","name":"Game_Party"},
    {"path":"js/rpg_objects/","name":"Game_Troop"},
    {"path":"js/rpg_objects/","name":"Game_Map"},
    {"path":"js/rpg_objects/","name":"Game_CommonEvent"},
    {"path":"js/rpg_objects/","name":"Game_CharacterBase"},
    {"path":"js/rpg_objects/","name":"Game_Character"},
    {"path":"js/rpg_objects/","name":"Game_Player"},
    {"path":"js/rpg_objects/","name":"Game_Follower"},
    {"path":"js/rpg_objects/","name":"Game_Followers"},
    {"path":"js/rpg_objects/","name":"Game_Vehicle"},
    {"path":"js/rpg_objects/","name":"Game_Event"},
    {"path":"js/rpg_objects/","name":"Game_Interpreter"},

    {"path":"js/rpg_scenes/","name":"Scene_Base"},
    {"path":"js/rpg_scenes/","name":"Scene_Boot"},
    {"path":"js/rpg_scenes/","name":"Scene_Title"},
    {"path":"js/rpg_scenes/","name":"Scene_Map"},
    {"path":"js/rpg_scenes/","name":"Scene_MenuBase"},
    {"path":"js/rpg_scenes/","name":"Scene_Menu"},
    {"path":"js/rpg_scenes/","name":"Scene_ItemBase"},
    {"path":"js/rpg_scenes/","name":"Scene_Item"},
    {"path":"js/rpg_scenes/","name":"Scene_Skill"},
    {"path":"js/rpg_scenes/","name":"Scene_Equip"},
    {"path":"js/rpg_scenes/","name":"Scene_Status"},
    {"path":"js/rpg_scenes/","name":"Scene_Options"},
    {"path":"js/rpg_scenes/","name":"Scene_File"},
    {"path":"js/rpg_scenes/","name":"Scene_Save"},
    {"path":"js/rpg_scenes/","name":"Scene_Load"},
    {"path":"js/rpg_scenes/","name":"Scene_GameEnd"},
    {"path":"js/rpg_scenes/","name":"Scene_Shop"},
    {"path":"js/rpg_scenes/","name":"Scene_Name"},
    {"path":"js/rpg_scenes/","name":"Scene_Debug"},
    {"path":"js/rpg_scenes/","name":"Scene_Battle"},
    {"path":"js/rpg_scenes/","name":"Scene_Gameover"},

    {"path":"js/rpg_sprites/","name":"Sprite_Base"},
    {"path":"js/rpg_sprites/","name":"Sprite_Button"},
    {"path":"js/rpg_sprites/","name":"Sprite_Character"},
    {"path":"js/rpg_sprites/","name":"Sprite_Battler"},
    {"path":"js/rpg_sprites/","name":"Sprite_Actor"},
    {"path":"js/rpg_sprites/","name":"Sprite_Enemy"},
    {"path":"js/rpg_sprites/","name":"Sprite_Animation"},
    {"path":"js/rpg_sprites/","name":"Sprite_Damage"},
    {"path":"js/rpg_sprites/","name":"Sprite_StateIcon"},
    {"path":"js/rpg_sprites/","name":"Sprite_StateOverlay"},
    {"path":"js/rpg_sprites/","name":"Sprite_Weapon"},
    {"path":"js/rpg_sprites/","name":"Sprite_Balloon"},
    {"path":"js/rpg_sprites/","name":"Sprite_Picture"},
    {"path":"js/rpg_sprites/","name":"Sprite_Timer"},
    {"path":"js/rpg_sprites/","name":"Sprite_Destination"},
    {"path":"js/rpg_sprites/","name":"Spriteset_Base"},
    {"path":"js/rpg_sprites/","name":"Spriteset_Map"},
    {"path":"js/rpg_sprites/","name":"Spriteset_Battle"},

    {"path":"js/rpg_windows/","name":"Window_Base"},
    {"path":"js/rpg_windows/","name":"Window_Selectable"},
    {"path":"js/rpg_windows/","name":"Window_Command"},
    {"path":"js/rpg_windows/","name":"Window_HorzCommand"},
    {"path":"js/rpg_windows/","name":"Window_Help"},
    {"path":"js/rpg_windows/","name":"Window_Gold"},
    {"path":"js/rpg_windows/","name":"Window_MenuCommand"},
    {"path":"js/rpg_windows/","name":"Window_MenuStatus"},
    {"path":"js/rpg_windows/","name":"Window_MenuActor"},
    {"path":"js/rpg_windows/","name":"Window_ItemCategory"},
    {"path":"js/rpg_windows/","name":"Window_ItemList"},
    {"path":"js/rpg_windows/","name":"Window_SkillType"},
    {"path":"js/rpg_windows/","name":"Window_SkillStatus"},
    {"path":"js/rpg_windows/","name":"Window_SkillList"},
    {"path":"js/rpg_windows/","name":"Window_EquipStatus"},
    {"path":"js/rpg_windows/","name":"Window_EquipCommand"},
    {"path":"js/rpg_windows/","name":"Window_EquipSlot"},
    {"path":"js/rpg_windows/","name":"Window_EquipItem"},
    {"path":"js/rpg_windows/","name":"Window_Status"},
    {"path":"js/rpg_windows/","name":"Window_Options"},
    {"path":"js/rpg_windows/","name":"Window_SavefileList"},
    {"path":"js/rpg_windows/","name":"Window_ShopCommand"},
    {"path":"js/rpg_windows/","name":"Window_ShopBuy"},
    {"path":"js/rpg_windows/","name":"Window_ShopSell"},
    {"path":"js/rpg_windows/","name":"Window_ShopNumber"},
    {"path":"js/rpg_windows/","name":"Window_ShopStatus"},
    {"path":"js/rpg_windows/","name":"Window_NameEdit"},
    {"path":"js/rpg_windows/","name":"Window_NameInput"},
    {"path":"js/rpg_windows/","name":"Window_ChoiceList"},
    {"path":"js/rpg_windows/","name":"Window_NumberInput"},
    {"path":"js/rpg_windows/","name":"Window_EventItem"},
    {"path":"js/rpg_windows/","name":"Window_Message"},
    {"path":"js/rpg_windows/","name":"Window_ScrollText"},
    {"path":"js/rpg_windows/","name":"Window_MapName"},
    {"path":"js/rpg_windows/","name":"Window_BattleLog"},
    {"path":"js/rpg_windows/","name":"Window_PartyCommand"},
    {"path":"js/rpg_windows/","name":"Window_ActorCommand"},
    {"path":"js/rpg_windows/","name":"Window_BattleStatus"},
    {"path":"js/rpg_windows/","name":"Window_BattleActor"},
    {"path":"js/rpg_windows/","name":"Window_BattleEnemy"},
    {"path":"js/rpg_windows/","name":"Window_BattleSkill"},
    {"path":"js/rpg_windows/","name":"Window_BattleItem"},
    {"path":"js/rpg_windows/","name":"Window_TitleCommand"},
    {"path":"js/rpg_windows/","name":"Window_GameEnd"},
    {"path":"js/rpg_windows/","name":"Window_DebugRange"},
    {"path":"js/rpg_windows/","name":"Window_DebugEdit"}

];

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

PluginManager.init = function(priorities, plugins) {
    PluginManager.setupCounter();
    PluginManager.setupPriorities(priorities);
    window.setTimeout( () => PluginManager.setup(plugins), 10);
};

PluginManager.setupCounter = function() {
    var counter = document.createElement('div');
    var counterInner = document.createElement('div');
    var counterSpan = document.createElement('span');
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
    var counter = document.getElementById('counter--count');
    if (counter) counter.innerHTML = Math.floor((this._scriptsLoadedLength / this._scriptsToLoadLength) * 100) + '%';
};

PluginManager.removeCounter = function() {
    var counter = document.getElementById('counter');
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
    var url = this._errorUrls.shift();
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
    var url;
    var script = document.createElement('script');
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
        PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;
        PIXI.settings.ROUND_PIXELS = true;
        PIXI.settings.CREATE_IMAGE_BITMAP = true;
        PIXI.settings.GC_MODE = PIXI.GC_MODES.AUTO;
        PIXI.settings.GC_MAX_IDLE = 120;
        SceneManager.run(Scene_Boot);
    }
};

PluginManager.init($priorityScripts, $plugins);
