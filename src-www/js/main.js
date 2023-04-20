'use strict';
import './rpg_core/JsExtensions.js';
import ProgressWatcher from './rpg_core/ProgressWatcher.js';
import Utils from './rpg_core/Utils.js';
import CacheEntry from './rpg_core/CacheEntry.js';
import CacheMap from './rpg_core/CacheMap.js';
import ImageCache from './rpg_core/ImageCache.js';
import RequestQueue from './rpg_core/RequestQueue.js';
import Point from './rpg_core/Point.js';
import Rectangle from './rpg_core/Rectangle.js';
import Bitmap from './rpg_core/Bitmap.js';
import BitmapPIXI from './rpg_core/BitmapPIXI.js';
import Graphics from './rpg_core/Graphics.js';
import Input from './rpg_core/Input.js';
import TouchInput from './rpg_core/TouchInput.js';
import Sprite from './rpg_core/Sprite.js';
import Tilemap from './rpg_core/Tilemap.js';
import ShaderTilemap from './rpg_core/ShaderTilemap.js';
import TilingSprite from './rpg_core/TilingSprite.js';
import ScreenSprite from './rpg_core/ScreenSprite.js';
import WindowSkinCache from './rpg_core/WindowSkinCache.js';
import Window from './rpg_core/Window.js';
import WindowLayer from './rpg_core/WindowLayer.js';
import Weather from './rpg_core/Weather.js';
import ToneFilter from './rpg_core/ToneFilter.js';
import ToneSprite from './rpg_core/ToneSprite.js';
import Stage from './rpg_core/Stage.js';
import WebAudio from './rpg_core/WebAudio.js';
import JsonEx from './rpg_core/JsonEx.js';
import Decrypter from './rpg_core/Decrypter.js';
import ResourceHandler from './rpg_core/ResourceHandler.js';

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
	DataManager,
} from './rpg_managers/DataManager.js';
import ConfigManager from './rpg_managers/ConfigManager.js';
import GameStorageManager from './rpg_managers/GameStorageManager.js';
import ImageManager from './rpg_managers/ImageManager.js';
import AudioManager from './rpg_managers/AudioManager.js';
import SoundManager from './rpg_managers/SoundManager.js';
import TextManager from './rpg_managers/TextManager.js';
import SceneManager from './rpg_managers/SceneManager.js';
import BattleManager from './rpg_managers/BattleManager.js';
import PluginManager from './rpg_managers/PluginManager.js';

import Game_Temp from './rpg_objects/Game_Temp.js';
import Game_System from './rpg_objects/Game_System.js';
import Game_Timer from './rpg_objects/Game_Timer.js';
import Game_Message from './rpg_objects/Game_Message.js';
import Game_Switches from './rpg_objects/Game_Switches.js';
import Game_Variables from './rpg_objects/Game_Variables.js';
import Game_SelfSwitches from './rpg_objects/Game_SelfSwitches.js';
import Game_Screen from './rpg_objects/Game_Screen.js';
import Game_Picture from './rpg_objects/Game_Picture.js';
import Game_Item from './rpg_objects/Game_Item.js';
import Game_Action from './rpg_objects/Game_Action.js';
import Game_ActionResult from './rpg_objects/Game_ActionResult.js';
import Game_BattlerBase from './rpg_objects/Game_BattlerBase.js';
import Game_Battler from './rpg_objects/Game_Battler.js';
import Game_Actor from './rpg_objects/Game_Actor.js';
import Game_Enemy from './rpg_objects/Game_Enemy.js';
import Game_Actors from './rpg_objects/Game_Actors.js';
import Game_Unit from './rpg_objects/Game_Unit.js';
import Game_Party from './rpg_objects/Game_Party.js';
import Game_Troop from './rpg_objects/Game_Troop.js';
import Game_Map from './rpg_objects/Game_Map.js';
import Game_CommonEvent from './rpg_objects/Game_CommonEvent.js';
import Game_CharacterBase from './rpg_objects/Game_CharacterBase.js';
import Game_Character from './rpg_objects/Game_Character.js';
import Game_Player from './rpg_objects/Game_Player.js';
import Game_Follower from './rpg_objects/Game_Follower.js';
import Game_Followers from './rpg_objects/Game_Followers.js';
import Game_Vehicle from './rpg_objects/Game_Vehicle.js';
import Game_Event from './rpg_objects/Game_Event.js';
import { Game_Interpreter } from './rpg_objects/Game_Interpreter.js';

import Scene_Base from './rpg_scenes/Scene_Base.js';
import Scene_Boot from './rpg_scenes/Scene_Boot.js';
import Scene_Title from './rpg_scenes/Scene_Title.js';
import Scene_Map from './rpg_scenes/Scene_Map.js';
import Scene_MenuBase from './rpg_scenes/Scene_MenuBase.js';
import Scene_Menu from './rpg_scenes/Scene_Menu.js';
import Scene_ItemBase from './rpg_scenes/Scene_ItemBase.js';
import Scene_Item from './rpg_scenes/Scene_Item.js';
import Scene_Skill from './rpg_scenes/Scene_Skill.js';
import Scene_Equip from './rpg_scenes/Scene_Equip.js';
import Scene_Status from './rpg_scenes/Scene_Status.js';
import Scene_Options from './rpg_scenes/Scene_Options.js';
import Scene_File from './rpg_scenes/Scene_File.js';
import Scene_Save from './rpg_scenes/Scene_Save.js';
import Scene_Load from './rpg_scenes/Scene_Load.js';
import Scene_GameEnd from './rpg_scenes/Scene_GameEnd.js';
import Scene_Shop from './rpg_scenes/Scene_Shop.js';
import Scene_Name from './rpg_scenes/Scene_Name.js';
import Scene_Debug from './rpg_scenes/Scene_Debug.js';
import Scene_Battle from './rpg_scenes/Scene_Battle.js';
import Scene_Gameover from './rpg_scenes/Scene_Gameover.js';

import Sprite_Base from './rpg_sprites/Sprite_Base.js';
import Sprite_Button from './rpg_sprites/Sprite_Button.js';
import Sprite_Character from './rpg_sprites/Sprite_Character.js';
import Sprite_Battler from './rpg_sprites/Sprite_Battler.js';
import Sprite_Actor from './rpg_sprites/Sprite_Actor.js';
import Sprite_Enemy from './rpg_sprites/Sprite_Enemy.js';
import Sprite_Animation from './rpg_sprites/Sprite_Animation.js';
import Sprite_Damage from './rpg_sprites/Sprite_Damage.js';
import Sprite_StateIcon from './rpg_sprites/Sprite_StateIcon.js';
import Sprite_StateOverlay from './rpg_sprites/Sprite_StateOverlay.js';
import Sprite_Weapon from './rpg_sprites/Sprite_Weapon.js';
import Sprite_Balloon from './rpg_sprites/Sprite_Balloon.js';
import Sprite_Picture from './rpg_sprites/Sprite_Picture.js';
import Sprite_Timer from './rpg_sprites/Sprite_Timer.js';
import Sprite_Destination from './rpg_sprites/Sprite_Destination.js';
import Spriteset_Base from './rpg_sprites/Spriteset_Base.js';
import Spriteset_Map from './rpg_sprites/Spriteset_Map.js';
import Spriteset_Battle from './rpg_sprites/Spriteset_Battle.js';

import Window_Base from './rpg_windows/Window_Base.js';
import Window_Selectable from './rpg_windows/Window_Selectable.js';
import Window_Command from './rpg_windows/Window_Command.js';
import Window_HorzCommand from './rpg_windows/Window_HorzCommand.js';
import Window_Help from './rpg_windows/Window_Help.js';
import Window_Gold from './rpg_windows/Window_Gold.js';
import Window_MenuCommand from './rpg_windows/Window_MenuCommand.js';
import Window_MenuStatus from './rpg_windows/Window_MenuStatus.js';
import Window_MenuActor from './rpg_windows/Window_MenuActor.js';
import Window_ItemCategory from './rpg_windows/Window_ItemCategory.js';
import Window_ItemList from './rpg_windows/Window_ItemList.js';
import Window_SkillType from './rpg_windows/Window_SkillType.js';
import Window_SkillStatus from './rpg_windows/Window_SkillStatus.js';
import Window_SkillList from './rpg_windows/Window_SkillList.js';
import Window_EquipStatus from './rpg_windows/Window_EquipStatus.js';
import Window_EquipCommand from './rpg_windows/Window_EquipCommand.js';
import Window_EquipSlot from './rpg_windows/Window_EquipSlot.js';
import Window_EquipItem from './rpg_windows/Window_EquipItem.js';
import Window_Status from './rpg_windows/Window_Status.js';
import Window_Options from './rpg_windows/Window_Options.js';
import Window_SavefileList from './rpg_windows/Window_SavefileList.js';
import Window_ShopCommand from './rpg_windows/Window_ShopCommand.js';
import Window_ShopBuy from './rpg_windows/Window_ShopBuy.js';
import Window_ShopSell from './rpg_windows/Window_ShopSell.js';
import Window_ShopNumber from './rpg_windows/Window_ShopNumber.js';
import Window_ShopStatus from './rpg_windows/Window_ShopStatus.js';
import Window_NameEdit from './rpg_windows/Window_NameEdit.js';
import Window_NameInput from './rpg_windows/Window_NameInput.js';
import Window_ChoiceList from './rpg_windows/Window_ChoiceList.js';
import Window_NumberInput from './rpg_windows/Window_NumberInput.js';
import Window_EventItem from './rpg_windows/Window_EventItem.js';
import Window_Message from './rpg_windows/Window_Message.js';
import Window_ScrollText from './rpg_windows/Window_ScrollText.js';
import Window_MapName from './rpg_windows/Window_MapName.js';
import Window_BattleLog from './rpg_windows/Window_BattleLog.js';
import Window_PartyCommand from './rpg_windows/Window_PartyCommand.js';
import Window_ActorCommand from './rpg_windows/Window_ActorCommand.js';
import Window_BattleStatus from './rpg_windows/Window_BattleStatus.js';
import Window_BattleActor from './rpg_windows/Window_BattleActor.js';
import Window_BattleEnemy from './rpg_windows/Window_BattleEnemy.js';
import Window_BattleSkill from './rpg_windows/Window_BattleSkill.js';
import Window_BattleItem from './rpg_windows/Window_BattleItem.js';
import Window_TitleCommand from './rpg_windows/Window_TitleCommand.js';
import Window_GameEnd from './rpg_windows/Window_GameEnd.js';
import Window_DebugRange from './rpg_windows/Window_DebugRange.js';
import Window_DebugEdit from './rpg_windows/Window_DebugEdit.js';

((top, document, PIXI) => {
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

	top.Game_Temp = Game_Temp;
	top.Game_System = Game_System;
	top.Game_Timer = Game_Timer;
	top.Game_Message = Game_Message;
	top.Game_Switches = Game_Switches;
	top.Game_Variables = Game_Variables;
	top.Game_SelfSwitches = Game_SelfSwitches;
	top.Game_Screen = Game_Screen;
	top.Game_Picture = Game_Picture;
	top.Game_Item = Game_Item;
	top.Game_Action = Game_Action;
	top.Game_ActionResult = Game_ActionResult;
	top.Game_BattlerBase = Game_BattlerBase;
	top.Game_Battler = Game_Battler;
	top.Game_Actor = Game_Actor;
	top.Game_Enemy = Game_Enemy;
	top.Game_Actors = Game_Actors;
	top.Game_Unit = Game_Unit;
	top.Game_Party = Game_Party;
	top.Game_Troop = Game_Troop;
	top.Game_Map = Game_Map;
	top.Game_CommonEvent = Game_CommonEvent;
	top.Game_CharacterBase = Game_CharacterBase;
	top.Game_Character = Game_Character;
	top.Game_Player = Game_Player;
	top.Game_Follower = Game_Follower;
	top.Game_Followers = Game_Followers;
	top.Game_Vehicle = Game_Vehicle;
	top.Game_Event = Game_Event;
	top.Game_Interpreter = Game_Interpreter;

	top.Scene_Base = Scene_Base;
	top.Scene_Boot = Scene_Boot;
	top.Scene_Title = Scene_Title;
	top.Scene_Map = Scene_Map;
	top.Scene_MenuBase = Scene_MenuBase;
	top.Scene_Menu = Scene_Menu;
	top.Scene_ItemBase = Scene_ItemBase;
	top.Scene_Item = Scene_Item;
	top.Scene_Skill = Scene_Skill;
	top.Scene_Equip = Scene_Equip;
	top.Scene_Status = Scene_Status;
	top.Scene_Options = Scene_Options;
	top.Scene_File = Scene_File;
	top.Scene_Save = Scene_Save;
	top.Scene_Load = Scene_Load;
	top.Scene_GameEnd = Scene_GameEnd;
	top.Scene_Shop = Scene_Shop;
	top.Scene_Name = Scene_Name;
	top.Scene_Debug = Scene_Debug;
	top.Scene_Battle = Scene_Battle;
	top.Scene_Gameover = Scene_Gameover;

	top.Sprite_Base = Sprite_Base;
	top.Sprite_Button = Sprite_Button;
	top.Sprite_Character = Sprite_Character;
	top.Sprite_Battler = Sprite_Battler;
	top.Sprite_Actor = Sprite_Actor;
	top.Sprite_Enemy = Sprite_Enemy;
	top.Sprite_Animation = Sprite_Animation;
	top.Sprite_Damage = Sprite_Damage;
	top.Sprite_StateIcon = Sprite_StateIcon;
	top.Sprite_StateOverlay = Sprite_StateOverlay;
	top.Sprite_Weapon = Sprite_Weapon;
	top.Sprite_Balloon = Sprite_Balloon;
	top.Sprite_Picture = Sprite_Picture;
	top.Sprite_Timer = Sprite_Timer;
	top.Sprite_Destination = Sprite_Destination;
	top.Spriteset_Base = Spriteset_Base;
	top.Spriteset_Map = Spriteset_Map;
	top.Spriteset_Battle = Spriteset_Battle;

	top.Window_Base = Window_Base;
	top.Window_Selectable = Window_Selectable;
	top.Window_Command = Window_Command;
	top.Window_HorzCommand = Window_HorzCommand;
	top.Window_Help = Window_Help;
	top.Window_Gold = Window_Gold;
	top.Window_MenuCommand = Window_MenuCommand;
	top.Window_MenuStatus = Window_MenuStatus;
	top.Window_MenuActor = Window_MenuActor;
	top.Window_ItemCategory = Window_ItemCategory;
	top.Window_ItemList = Window_ItemList;
	top.Window_SkillType = Window_SkillType;
	top.Window_SkillStatus = Window_SkillStatus;
	top.Window_SkillList = Window_SkillList;
	top.Window_EquipStatus = Window_EquipStatus;
	top.Window_EquipCommand = Window_EquipCommand;
	top.Window_EquipSlot = Window_EquipSlot;
	top.Window_EquipItem = Window_EquipItem;
	top.Window_Status = Window_Status;
	top.Window_Options = Window_Options;
	top.Window_SavefileList = Window_SavefileList;
	top.Window_ShopCommand = Window_ShopCommand;
	top.Window_ShopBuy = Window_ShopBuy;
	top.Window_ShopSell = Window_ShopSell;
	top.Window_ShopNumber = Window_ShopNumber;
	top.Window_ShopStatus = Window_ShopStatus;
	top.Window_NameEdit = Window_NameEdit;
	top.Window_NameInput = Window_NameInput;
	top.Window_ChoiceList = Window_ChoiceList;
	top.Window_NumberInput = Window_NumberInput;
	top.Window_EventItem = Window_EventItem;
	top.Window_Message = Window_Message;
	top.Window_ScrollText = Window_ScrollText;
	top.Window_MapName = Window_MapName;
	top.Window_BattleLog = Window_BattleLog;
	top.Window_PartyCommand = Window_PartyCommand;
	top.Window_ActorCommand = Window_ActorCommand;
	top.Window_BattleStatus = Window_BattleStatus;
	top.Window_BattleActor = Window_BattleActor;
	top.Window_BattleEnemy = Window_BattleEnemy;
	top.Window_BattleSkill = Window_BattleSkill;
	top.Window_BattleItem = Window_BattleItem;
	top.Window_TitleCommand = Window_TitleCommand;
	top.Window_GameEnd = Window_GameEnd;
	top.Window_DebugRange = Window_DebugRange;
	top.Window_DebugEdit = Window_DebugEdit;

	top.ProgressWatcher = ProgressWatcher;
	top.Utils = Utils;
	top.CacheEntry = CacheEntry;
	top.CacheMap = CacheMap;
	top.ImageCache = ImageCache;
	top.RequestQueue = RequestQueue;
	top.Point = Point;
	top.Rectangle = Rectangle;
	top.Bitmap = Bitmap;
	top.BitmapPIXI = BitmapPIXI;
	top.Graphics = Graphics;
	top.Input = Input;
	top.TouchInput = TouchInput;
	top.Sprite = Sprite;
	top.Tilemap = Tilemap;
	top.ShaderTilemap = ShaderTilemap;
	top.TilingSprite = TilingSprite;
	top.ScreenSprite = ScreenSprite;
	top.WindowSkinCache = WindowSkinCache;
	top.Window = Window;
	top.WindowLayer = WindowLayer;
	top.Weather = Weather;
	top.ToneFilter = ToneFilter;
	top.ToneSprite = ToneSprite;
	top.Stage = Stage;
	top.WebAudio = WebAudio;
	top.JsonEx = JsonEx;
	top.Decrypter = Decrypter;
	top.ResourceHandler = ResourceHandler;

	top.DataManager = DataManager;
	top.ConfigManager = ConfigManager;
	top.GameStorageManager = GameStorageManager;
	top.ImageManager = ImageManager;
	top.AudioManager = AudioManager;
	top.SoundManager = SoundManager;
	top.TextManager = TextManager;
	top.SceneManager = SceneManager;
	top.BattleManager = BattleManager;
	top.PluginManager = PluginManager;

	PluginManager.setup($plugins);

	const init = () => {
		document.body.classList.remove('is-loading');
		PIXI.settings.PREFER_ENV = 2;
		PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;
		PIXI.settings.ROUND_PIXELS = true;
		PIXI.settings.GC_MAX_IDLE = 600;
		PIXI.settings.MIPMAP_TEXTURES = PIXI.MIPMAP_MODES.OFF;
		PIXI.settings.RESOLUTION = 1;
		if (Utils.isMobileSafari()) {
			PIXI.settings.PRECISION_FRAGMENT = PIXI.PRECISION.HIGH;
		}
		SceneManager.run(Scene_Boot);
	};

	document.readyState === 'complete'
		? init()
		: window.addEventListener('load', init);

	if (NODE_ENV === 'development') {
		// Live reload with esbuild.
		new EventSource('/esbuild').addEventListener('change', () =>
			location.reload()
		);

		/**
		 * Measure the time of execution in milliseconds of a synchronous task.
		 *
		 * @param {function} toMeasure
		 * @param {number} repeatTimes
		 * @param {any} context
		 * @param {any[]} args
		 * @return { totalMilliseconds: number, averageMillisecondsPerTask:number }
		 */
		const Benchmark = function (toMeasure, repeatTimes, context, args) {
			repeatTimes = typeof repeatTimes === 'number' ? repeatTimes : 1;

			if (typeof toMeasure === 'function') {
				let start = performance.now(),
					total = 0;
				for (let i = 0; i < repeatTimes; i++) {
					let startSub = performance.now();
					toMeasure.call(context, ...args);
					total += performance.now() - startSub;
				}
				return {
					totalMilliseconds: performance.now() - start,
					averageMillisecondsPerTask: total / repeatTimes,
				};
			}
		};
		window['Benchmark'] = Benchmark;
	}
})(self, document, PIXI);
