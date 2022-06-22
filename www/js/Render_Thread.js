"use strict";

import * as Comlink from "https://cdn.skypack.dev/pin/comlink@v4.3.1-ebLSsXPUzhGrZgtPT5jX/mode=imports/optimized/comlink.js";
import * as PIXI from "./libs/pixi.js";
// import "https://cdn.skypack.dev/pin/iphone-inline-video@v2.2.2-UGQTdOARhJvH2uY0Ic3l/mode=imports/optimized/iphone-inline-video.js";

import "./rpg_core/JsExtensions.js";
import ProgressWatcher from "./rpg_core/ProgressWatcher.js";
import Utils from "./rpg_core/Utils.js";
import CacheEntry from "./rpg_core/CacheEntry.js";
import CacheMap from "./rpg_core/CacheMap.js";
import ImageCache from "./rpg_core/ImageCache.js";
import RequestQueue from "./rpg_core/RequestQueue.js";
import Point from "./rpg_core/Point.js";
import Rectangle from "./rpg_core/Rectangle.js";
import Bitmap from "./rpg_core/Bitmap.js";
import BitmapPIXI from "./rpg_core/BitmapPIXI.js";
import Graphics from "./rpg_core/Graphics.js";
import Input from "./rpg_core/Input.js";
import TouchInput from "./rpg_core/TouchInput.js";
import Sprite from "./rpg_core/Sprite.js";
import Tilemap from "./rpg_core/Tilemap.js";
import ShaderTilemap from "./rpg_core/ShaderTilemap.js";
import TilingSprite from "./rpg_core/TilingSprite.js";
import ScreenSprite from "./rpg_core/ScreenSprite.js";
import WindowSkinCache from "./rpg_core/WindowSkinCache.js";
import Window from "./rpg_core/Window.js";
import WindowLayer from "./rpg_core/WindowLayer.js";
import Weather from "./rpg_core/Weather.js";
import ToneFilter from "./rpg_core/ToneFilter.js";
import ToneSprite from "./rpg_core/ToneSprite.js";
import Stage from "./rpg_core/Stage.js";
import WebAudio from "./rpg_core/WebAudio.js";
import JsonEx from "./rpg_core/JsonEx.js";
import Decrypter from "./rpg_core/Decrypter.js";
import ResourceHandler from "./rpg_core/ResourceHandler.js";
import WindowShim from "./rpg_core/WindowShim.js";
import DocumentShim from "./rpg_core/DocumentShim.js";

import {
    $dataActors,
    $dataClasses,
    $dataSkills,
    $dataItems,
    $dataWeapons,
    $dataArmors,
    $dataEnemies,
    $dataTroops,
    $dataStates,
    $dataAnimations,
    $dataTilesets,
    $dataCommonEvents,
    $dataSystem,
    $dataMapInfos,
    $dataMap,
    $gameTemp,
    $gameSystem,
    $gameScreen,
    $gameTimer,
    $gameMessage,
    $gameSwitches,
    $gameVariables,
    $gameSelfSwitches,
    $gameActors,
    $gameParty,
    $gameTroop,
    $gameMap,
    $gamePlayer,
    $testEvent,
    DataManager
} from "./rpg_managers/DataManager.js";
import ConfigManager from "./rpg_managers/ConfigManager.js";
import StorageManager from "./rpg_managers/StorageManagerShim.js";
import ImageManager from "./rpg_managers/ImageManager.js";
import AudioManager from "./rpg_managers/AudioManager.js";
import SoundManager from "./rpg_managers/SoundManager.js";
import TextManager from "./rpg_managers/TextManager.js";
import SceneManager from "./rpg_managers/SceneManager.js";
import BattleManager from "./rpg_managers/BattleManager.js";
import PluginManager from "./rpg_managers/PluginManager.js";

import Game_Temp from "./rpg_objects/Game_Temp.js";
import Game_System from "./rpg_objects/Game_System.js";
import Game_Timer from "./rpg_objects/Game_Timer.js";
import Game_Message from "./rpg_objects/Game_Message.js";
import Game_Switches from "./rpg_objects/Game_Switches.js";
import Game_Variables from "./rpg_objects/Game_Variables.js";
import Game_SelfSwitches from "./rpg_objects/Game_SelfSwitches.js";
import Game_Screen from "./rpg_objects/Game_Screen.js";
import Game_Picture from "./rpg_objects/Game_Picture.js";
import Game_Item from "./rpg_objects/Game_Item.js";
import Game_Action from "./rpg_objects/Game_Action.js";
import Game_ActionResult from "./rpg_objects/Game_ActionResult.js";
import Game_BattlerBase from "./rpg_objects/Game_BattlerBase.js";
import Game_Battler from "./rpg_objects/Game_Battler.js";
import Game_Actor from "./rpg_objects/Game_Actor.js";
import Game_Enemy from "./rpg_objects/Game_Enemy.js";
import Game_Actors from "./rpg_objects/Game_Actors.js";
import Game_Unit from "./rpg_objects/Game_Unit.js";
import Game_Party from "./rpg_objects/Game_Party.js";
import Game_Troop from "./rpg_objects/Game_Troop.js";
import Game_Map from "./rpg_objects/Game_Map.js";
import Game_CommonEvent from "./rpg_objects/Game_CommonEvent.js";
import Game_CharacterBase from "./rpg_objects/Game_CharacterBase.js";
import Game_Character from "./rpg_objects/Game_Character.js";
import Game_Player from "./rpg_objects/Game_Player.js";
import Game_Follower from "./rpg_objects/Game_Follower.js";
import Game_Followers from "./rpg_objects/Game_Followers.js";
import Game_Vehicle from "./rpg_objects/Game_Vehicle.js";
import Game_Event from "./rpg_objects/Game_Event.js";
import Game_Interpreter from "./rpg_objects/Game_Interpreter.js";

import Scene_Base from "./rpg_scenes/Scene_Base.js";
import Scene_Boot from "./rpg_scenes/Scene_Boot.js";
import Scene_Title from "./rpg_scenes/Scene_Title.js";
import Scene_Map from "./rpg_scenes/Scene_Map.js";
import Scene_MenuBase from "./rpg_scenes/Scene_MenuBase.js";
import Scene_Menu from "./rpg_scenes/Scene_Menu.js";
import Scene_ItemBase from "./rpg_scenes/Scene_ItemBase.js";
import Scene_Item from "./rpg_scenes/Scene_Item.js";
import Scene_Skill from "./rpg_scenes/Scene_Skill.js";
import Scene_Equip from "./rpg_scenes/Scene_Equip.js";
import Scene_Status from "./rpg_scenes/Scene_Status.js";
import Scene_Options from "./rpg_scenes/Scene_Options.js";
import Scene_File from "./rpg_scenes/Scene_File.js";
import Scene_Save from "./rpg_scenes/Scene_Save.js";
import Scene_Load from "./rpg_scenes/Scene_Load.js";
import Scene_GameEnd from "./rpg_scenes/Scene_GameEnd.js";
import Scene_Shop from "./rpg_scenes/Scene_Shop.js";
import Scene_Name from "./rpg_scenes/Scene_Name.js";
import Scene_Debug from "./rpg_scenes/Scene_Debug.js";
import Scene_Battle from "./rpg_scenes/Scene_Battle.js";
import Scene_Gameover from "./rpg_scenes/Scene_Gameover.js";

import Sprite_Base from "./rpg_sprites/Sprite_Base.js";
import Sprite_Button from "./rpg_sprites/Sprite_Button.js";
import Sprite_Character from "./rpg_sprites/Sprite_Character.js";
import Sprite_Battler from "./rpg_sprites/Sprite_Battler.js";
import Sprite_Actor from "./rpg_sprites/Sprite_Actor.js";
import Sprite_Enemy from "./rpg_sprites/Sprite_Enemy.js";
import Sprite_Animation from "./rpg_sprites/Sprite_Animation.js";
import Sprite_Damage from "./rpg_sprites/Sprite_Damage.js";
import Sprite_StateIcon from "./rpg_sprites/Sprite_StateIcon.js";
import Sprite_StateOverlay from "./rpg_sprites/Sprite_StateOverlay.js";
import Sprite_Weapon from "./rpg_sprites/Sprite_Weapon.js";
import Sprite_Balloon from "./rpg_sprites/Sprite_Balloon.js";
import Sprite_Picture from "./rpg_sprites/Sprite_Picture.js";
import Sprite_Timer from "./rpg_sprites/Sprite_Timer.js";
import Sprite_Destination from "./rpg_sprites/Sprite_Destination.js";
import Spriteset_Base from "./rpg_sprites/Spriteset_Base.js";
import Spriteset_Map from "./rpg_sprites/Spriteset_Map.js";
import Spriteset_Battle from "./rpg_sprites/Spriteset_Battle.js";

import Window_Base from "./rpg_windows/Window_Base.js";
import Window_Selectable from "./rpg_windows/Window_Selectable.js";
import Window_Command from "./rpg_windows/Window_Command.js";
import Window_HorzCommand from "./rpg_windows/Window_HorzCommand.js";
import Window_Help from "./rpg_windows/Window_Help.js";
import Window_Gold from "./rpg_windows/Window_Gold.js";
import Window_MenuCommand from "./rpg_windows/Window_MenuCommand.js";
import Window_MenuStatus from "./rpg_windows/Window_MenuStatus.js";
import Window_MenuActor from "./rpg_windows/Window_MenuActor.js";
import Window_ItemCategory from "./rpg_windows/Window_ItemCategory.js";
import Window_ItemList from "./rpg_windows/Window_ItemList.js";
import Window_SkillType from "./rpg_windows/Window_SkillType.js";
import Window_SkillStatus from "./rpg_windows/Window_SkillStatus.js";
import Window_SkillList from "./rpg_windows/Window_SkillList.js";
import Window_EquipStatus from "./rpg_windows/Window_EquipStatus.js";
import Window_EquipCommand from "./rpg_windows/Window_EquipCommand.js";
import Window_EquipSlot from "./rpg_windows/Window_EquipSlot.js";
import Window_EquipItem from "./rpg_windows/Window_EquipItem.js";
import Window_Status from "./rpg_windows/Window_Status.js";
import Window_Options from "./rpg_windows/Window_Options.js";
import Window_SavefileList from "./rpg_windows/Window_SavefileList.js";
import Window_ShopCommand from "./rpg_windows/Window_ShopCommand.js";
import Window_ShopBuy from "./rpg_windows/Window_ShopBuy.js";
import Window_ShopSell from "./rpg_windows/Window_ShopSell.js";
import Window_ShopNumber from "./rpg_windows/Window_ShopNumber.js";
import Window_ShopStatus from "./rpg_windows/Window_ShopStatus.js";
import Window_NameEdit from "./rpg_windows/Window_NameEdit.js";
import Window_NameInput from "./rpg_windows/Window_NameInput.js";
import Window_ChoiceList from "./rpg_windows/Window_ChoiceList.js";
import Window_NumberInput from "./rpg_windows/Window_NumberInput.js";
import Window_EventItem from "./rpg_windows/Window_EventItem.js";
import Window_Message from "./rpg_windows/Window_Message.js";
import Window_ScrollText from "./rpg_windows/Window_ScrollText.js";
import Window_MapName from "./rpg_windows/Window_MapName.js";
import Window_BattleLog from "./rpg_windows/Window_BattleLog.js";
import Window_PartyCommand from "./rpg_windows/Window_PartyCommand.js";
import Window_ActorCommand from "./rpg_windows/Window_ActorCommand.js";
import Window_BattleStatus from "./rpg_windows/Window_BattleStatus.js";
import Window_BattleActor from "./rpg_windows/Window_BattleActor.js";
import Window_BattleEnemy from "./rpg_windows/Window_BattleEnemy.js";
import Window_BattleSkill from "./rpg_windows/Window_BattleSkill.js";
import Window_BattleItem from "./rpg_windows/Window_BattleItem.js";
import Window_TitleCommand from "./rpg_windows/Window_TitleCommand.js";
import Window_GameEnd from "./rpg_windows/Window_GameEnd.js";
import Window_DebugRange from "./rpg_windows/Window_DebugRange.js";
import Window_DebugEdit from "./rpg_windows/Window_DebugEdit.js";

class Render_Thread {
    constructor() {
		throw new Error('This is a static class');
	}
    static _setupPixiSettings() {
        PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;
        PIXI.settings.ROUND_PIXELS = true;
        PIXI.settings.GC_MAX_IDLE = 600;
        PIXI.settings.MIPMAP_TEXTURES = PIXI.MIPMAP_MODES.OFF;
        PIXI.settings.RESOLUTION = window.devicePixelRatio;
        if (Utils.isMobileSafari()) {
            PIXI.settings.PRECISION_FRAGMENT = PIXI.PRECISION.HIGH;
        }
    }
    static _setupGlobals() {
        self.$dataActors = $dataActors;
        self.$dataClasses = $dataClasses;
        self.$dataSkills = $dataSkills;
        self.$dataItems = $dataItems;
        self.$dataWeapons = $dataWeapons;
        self.$dataArmors = $dataArmors;
        self.$dataEnemies = $dataEnemies;
        self.$dataTroops = $dataTroops;
        self.$dataStates = $dataStates;
        self.$dataAnimations = $dataAnimations;
        self.$dataTilesets = $dataTilesets;
        self.$dataCommonEvents = $dataCommonEvents;
        self.$dataSystem = $dataSystem;
        self.$dataMapInfos = $dataMapInfos;
        self.$dataMap = $dataMap;
        self.$gameTemp = $gameTemp;
        self.$gameSystem = $gameSystem;
        self.$gameScreen = $gameScreen;
        self.$gameTimer = $gameTimer;
        self.$gameMessage = $gameMessage;
        self.$gameSwitches = $gameSwitches;
        self.$gameVariables = $gameVariables;
        self.$gameSelfSwitches = $gameSelfSwitches;
        self.$gameActors = $gameActors;
        self.$gameParty = $gameParty;
        self.$gameTroop = $gameTroop;
        self.$gameMap = $gameMap;
        self.$gamePlayer = $gamePlayer;
        self.$testEvent = $testEvent;

        self.Game_Temp = Game_Temp;
        self.Game_System = Game_System;
        self.Game_Timer = Game_Timer;
        self.Game_Message = Game_Message;
        self.Game_Switches = Game_Switches;
        self.Game_Variables = Game_Variables;
        self.Game_SelfSwitches = Game_SelfSwitches;
        self.Game_Screen = Game_Screen;
        self.Game_Picture = Game_Picture;
        self.Game_Item = Game_Item;
        self.Game_Action = Game_Action;
        self.Game_ActionResult = Game_ActionResult;
        self.Game_BattlerBase = Game_BattlerBase;
        self.Game_Battler = Game_Battler;
        self.Game_Actor = Game_Actor;
        self.Game_Enemy = Game_Enemy;
        self.Game_Actors = Game_Actors;
        self.Game_Unit = Game_Unit;
        self.Game_Party = Game_Party;
        self.Game_Troop = Game_Troop;
        self.Game_Map = Game_Map;
        self.Game_CommonEvent = Game_CommonEvent;
        self.Game_CharacterBase = Game_CharacterBase;
        self.Game_Character = Game_Character;
        self.Game_Player = Game_Player;
        self.Game_Follower = Game_Follower;
        self.Game_Followers = Game_Followers;
        self.Game_Vehicle = Game_Vehicle;
        self.Game_Event = Game_Event;
        self.Game_Interpreter = Game_Interpreter;

        self.Scene_Base = Scene_Base;
        self.Scene_Boot = Scene_Boot;
        self.Scene_Title = Scene_Title;
        self.Scene_Map = Scene_Map;
        self.Scene_MenuBase = Scene_MenuBase;
        self.Scene_Menu = Scene_Menu;
        self.Scene_ItemBase = Scene_ItemBase;
        self.Scene_Item = Scene_Item;
        self.Scene_Skill = Scene_Skill;
        self.Scene_Equip = Scene_Equip;
        self.Scene_Status = Scene_Status;
        self.Scene_Options = Scene_Options;
        self.Scene_File = Scene_File;
        self.Scene_Save = Scene_Save;
        self.Scene_Load = Scene_Load;
        self.Scene_GameEnd = Scene_GameEnd;
        self.Scene_Shop = Scene_Shop;
        self.Scene_Name = Scene_Name;
        self.Scene_Debug = Scene_Debug;
        self.Scene_Battle = Scene_Battle;
        self.Scene_Gameover = Scene_Gameover;

        self.Sprite_Base = Sprite_Base;
        self.Sprite_Button = Sprite_Button;
        self.Sprite_Character = Sprite_Character;
        self.Sprite_Battler = Sprite_Battler;
        self.Sprite_Actor = Sprite_Actor;
        self.Sprite_Enemy = Sprite_Enemy;
        self.Sprite_Animation = Sprite_Animation;
        self.Sprite_Damage = Sprite_Damage;
        self.Sprite_StateIcon = Sprite_StateIcon;
        self.Sprite_StateOverlay = Sprite_StateOverlay;
        self.Sprite_Weapon = Sprite_Weapon;
        self.Sprite_Balloon = Sprite_Balloon;
        self.Sprite_Picture = Sprite_Picture;
        self.Sprite_Timer = Sprite_Timer;
        self.Sprite_Destination = Sprite_Destination;
        self.Spriteset_Base = Spriteset_Base;
        self.Spriteset_Map = Spriteset_Map;
        self.Spriteset_Battle = Spriteset_Battle;

        self.Window_Base = Window_Base;
        self.Window_Selectable = Window_Selectable;
        self.Window_Command = Window_Command;
        self.Window_HorzCommand = Window_HorzCommand;
        self.Window_Help = Window_Help;
        self.Window_Gold = Window_Gold;
        self.Window_MenuCommand = Window_MenuCommand;
        self.Window_MenuStatus = Window_MenuStatus;
        self.Window_MenuActor = Window_MenuActor;
        self.Window_ItemCategory = Window_ItemCategory;
        self.Window_ItemList = Window_ItemList;
        self.Window_SkillType = Window_SkillType;
        self.Window_SkillStatus = Window_SkillStatus;
        self.Window_SkillList = Window_SkillList;
        self.Window_EquipStatus = Window_EquipStatus;
        self.Window_EquipCommand = Window_EquipCommand;
        self.Window_EquipSlot = Window_EquipSlot;
        self.Window_EquipItem = Window_EquipItem;
        self.Window_Status = Window_Status;
        self.Window_Options = Window_Options;
        self.Window_SavefileList = Window_SavefileList;
        self.Window_ShopCommand = Window_ShopCommand;
        self.Window_ShopBuy = Window_ShopBuy;
        self.Window_ShopSell = Window_ShopSell;
        self.Window_ShopNumber = Window_ShopNumber;
        self.Window_ShopStatus = Window_ShopStatus;
        self.Window_NameEdit = Window_NameEdit;
        self.Window_NameInput = Window_NameInput;
        self.Window_ChoiceList = Window_ChoiceList;
        self.Window_NumberInput = Window_NumberInput;
        self.Window_EventItem = Window_EventItem;
        self.Window_Message = Window_Message;
        self.Window_ScrollText = Window_ScrollText;
        self.Window_MapName = Window_MapName;
        self.Window_BattleLog = Window_BattleLog;
        self.Window_PartyCommand = Window_PartyCommand;
        self.Window_ActorCommand = Window_ActorCommand;
        self.Window_BattleStatus = Window_BattleStatus;
        self.Window_BattleActor = Window_BattleActor;
        self.Window_BattleEnemy = Window_BattleEnemy;
        self.Window_BattleSkill = Window_BattleSkill;
        self.Window_BattleItem = Window_BattleItem;
        self.Window_TitleCommand = Window_TitleCommand;
        self.Window_GameEnd = Window_GameEnd;
        self.Window_DebugRange = Window_DebugRange;
        self.Window_DebugEdit = Window_DebugEdit;

        self.ProgressWatcher = ProgressWatcher;
        self.Utils = Utils;
        self.CacheEntry = CacheEntry;
        self.CacheMap = CacheMap;
        self.ImageCache = ImageCache;
        self.RequestQueue = RequestQueue;
        self.Point = Point;
        self.Rectangle = Rectangle;
        self.Bitmap = Bitmap;
        self.BitmapPIXI = BitmapPIXI;
        self.Graphics = Graphics;
        self.Input = Input;
        self.TouchInput = TouchInput;
        self.Sprite = Sprite;
        self.Tilemap = Tilemap;
        self.ShaderTilemap = ShaderTilemap;
        self.TilingSprite = TilingSprite;
        self.ScreenSprite = ScreenSprite;
        self.WindowSkinCache = WindowSkinCache;
        self.Window = Window;
        self.WindowLayer = WindowLayer;
        self.Weather = Weather;
        self.ToneFilter = ToneFilter;
        self.ToneSprite = ToneSprite;
        self.Stage = Stage;
        self.WebAudio = WebAudio;
        self.JsonEx = JsonEx;
        self.Decrypter = Decrypter;
        self.ResourceHandler = ResourceHandler;

        self.DataManager = DataManager;
        self.ConfigManager = ConfigManager;
        self.StorageManager = StorageManager;
        self.ImageManager = ImageManager;
        self.AudioManager = AudioManager;
        self.SoundManager = SoundManager;
        self.TextManager = TextManager;
        self.SceneManager = SceneManager;
        self.BattleManager = BattleManager;
        self.PluginManager = PluginManager;
    }

    static async updateData(type, payload) {
        console.log(type, payload);
        if (type === 'plugins') {
            self.$plugins = payload.data;
        } else if (type === 'window') {
            Object.entries(payload.data).forEach(([key, value]) => self.window[key] = value);
        }
    }

    static async receiveEvent(type, payload) {
        console.log(type, payload);
    }

    static async start() {
        console.log('[Render_Thread.start]');
        this._setupGlobals();
        this._setupPixiSettings();
        PluginManager.setup($plugins);
        if (Utils.isWorker()) {
            SceneManager.run(Scene_Boot);
        } else {
            (document.readyState === 'complete') ? SceneManager.run(Scene_Boot) : window.addEventListener('load', () => SceneManager.run(Scene_Boot));
        }
    }
};

if (Utils.isWorker()) {
    Comlink.expose(Render_Thread);
} else {
    Render_Thread.start();
}
