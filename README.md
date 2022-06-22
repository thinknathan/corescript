
# RPG Maker MV CoreScript

## This Fork

This fork introduces opinionated changes and is not necessarily a drop-in replacement for the default RPG Maker MV scripts.

- Attempts to run the engine in its own worker thread
    - Plugins that rely on the existance of window or document may fail
- Passes save data to its own worker thread to compress and store/retrieve and decompress
    - Plugins that modify the SaveManager may fail
- Updated to use PIXI v6.x and PIXI-Tilemap v3.x
- Uses PIXI equivalents whenever possible instead of the Bitmap object
- Uses PIXI.BitmapText for fast, memory-efficient text
- Allows windows to overlap each other
- Added FPS check to switch on/off fluid timestep
- Switched to the PIXI.App model
- Gamestats (performance monitoring plugin) integration
- REMOVED: Picture blend modes
- REMOVED: Picture smooth scaling
- REMOVED: HTML5Audio
- REMOVED: Gradients in gauges
- REMOVED: Autoshadow feature of maps
- NOTE: "Window Color" in the System menu of the editor is now applied differently than the default scripts. The default value of (0, 0, 0) is black. Using pure white (255, 255, 255) will disable it.

## Added hooks

- Added Game_Battler.onApplyDamage(action, target, value)
- Added Game_Battler.onReceiveDamage(action, source, value)
- Added Game_Battler.onHitAction(action, target)
- Added Game_Battler.onEvadeAction(action, source)
- Added Game_Battler.onApplyStateSuccess(stateId, target)
- Added Game_Battler.onApplyStateFailure(stateId, target)
- Added Game_Battler.onApplyCritical(action, target, value)
- Added Game_Battler.onReceiveCritical(action, source, value)

## Split functions into smaller parts

- Added Game_Action.processItemHitFormula(result, target)
- Added Game_Action.processItemEvaFormula(result, target)
- Added Game_Action.processItemCriFormula(result, target)
- Added Game_Action.processElementalDamage(item, value, target, critical)
- Added Game_Action.processPhysicalDamage(item, value, target, critical)
- Added Game_Action.processMagicalDamage(item, value, target, critical)
- Added Game_Action.processRecoveryDamage(item, value, target, critical)
- Added Game_Action.processCriticalDamage(item, value, target, critical)
- Added Game_Action.processVarianceDamage(item, value, target, critical)
- Added Game_Action.processGuardDamage(item, value, target, critical)
- Added Game_Action.processDamageEnd(item, value, target, critical)
- Added BattleManager.processEscapeFormula (Function)

## Upgrading your project to this fork
Download main.js from */dist/main.js*

Replace *js/main.js* in your project with the one you downloaded.

Replace your *js/libs* folder with the *js/libs* folder from this repo.

Open your *index.html* and delete script tags that load rpg_core.js rpg_managers.js rpg_objects.js rpg_scenes.js rpg_sprites.js rpg_windows.js. They are no longer necessary.

## Introduction

"RPG Maker MV CoreScript" is a game engine for 2D games that runs on the browser. "RPG Maker MV CoreScript" is designed as a game engine dedicated to "RPG Maker MV", the latest work of "RPG Maker" series of 2DRPG world number one software with more than 20 years history, and more than 1000 games are running. (February 2017)

## What is this project?

This project is a project aimed at improving "RPG Maker MV CoreScript" better by the community and supporting many game creators.

The core script developed by this project is widely distributed to RPG Maker users through KADOKAWA.
The RPGMaker MV community is centered around plugins. Therefore, Ver1 series is developed while minimizing destructive change.

## Constitution
The core script is split into 6 sections.
<dl>
    <dt>rpg_core</dt>
    <dd>Wrapper classes of Pixi.js and base classes such as audio and input processing.</dd>
    <dt>rpg_managers</dt>
    <dd>Static classes named XxxManager that manage the game overall.</dd>
    <dt>rpg_objects</dt>
    <dd>Classes named Game_Xxx dealing with game data (many are saved).</dd>
    <dt>rpg_scenes</dt>
    <dd>Classes named Scene_Xxx in which the scene is defined.</dd>
    <dt>rpg_sprites</dt>
    <dd>Classes named Sprite_Xxx related to image display and processing.</dd>
    <dt>rpg_windows</dt>
    <dd>Classes named Window_Xxx handling window display and input.</dd>
</dl>

In addition, a plugin list is defined in *plugins.js*, and *main.js* launches the game.

Each part of the engine can loaded as a JS module, or you can use the compiled *dist/main.js* that includes the full engine.

## Global variables
Variables named `$dataXxx` are read from JSON in the *data* folder.
These files are changed by the editor, but they are immutable during play.
Variables named `$gameXxx` are instances of the class defined in *rpg_objects.js*.
When saving the game, these objects (except `$gameTemp, $gameMessage, $gameTroop`) are serialized to JSON and saved.
When loading, since the prototype chain is reconnected simultaneously with deserialization, you can continue using instance methods.

## Scene graph
The scene graph is a drawing tree like FLASH provided by Pixi.js.
Children are influenced by parent's coordinates and visibility.
Register a child in the form `(scene or sprite or window).addChild(child)`.

### Scene
In RMMV the scene is the root element of the scene graph and has children with Sprite and Window.
The life cycle is managed by `SceneManager`, and it operates up to one at the same time.

Life cycle: `new Scene_Xxx() -> create() -> start() -> update()* -> stop() -> terminate()`

## Flow

### Initialization
1. When the page is loaded, call `SceneManager.run()`. *(main.js)*
1. Initialize classes such as `Graphics, WebAudio, Input, TouchInput`.
1. Set `Scene_Boot` to `SceneManager`.
1. Register `SceneManager.update` in `requestAnimationFrame`.

`requestAnimationFrame` is called by the browser at regular time intervals (every time drawing is required).

### Update
1. `requestAnimationFrame` calls `SceneManager.update()`.
1. Process the current scene every 1/60 second according to the scene lifecycle rule
1. If `Scene_Xxx.update()` is called, then
    1. Call all children `update()`.
    1. Children recursively call their children `update()`.
1. Render the scene (including its children) onto the screen.
1. Register `SceneManager.update` in `requestAnimationFrame`.


## License
This content is released under the (http://opensource.org/licenses/MIT) MIT License.
