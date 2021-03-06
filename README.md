
# RPG Maker MV CoreScript

## This Fork

This fork introduces opinionated changes and is not necessarily a drop-in replacement for the default RPG Maker MV scripts.

- Updated to use PIXI v5 and PIXI-Tilemap v2.1.3
- Uses PIXI equivalents whenever possible instead of the Bitmap object
- Uses PIXI.BitmapText for fast, memory-efficient text
- Allows windows to overlap each other
- REMOVED: Picture blend modes
- REMOVED: Picture smooth scaling
- REMOVED: HTML5Audio
- REMOVED: Gradients in gauges
- NOTE: "Window Color" in the System menu of the editor is now applied differently than the default scripts. The default value of (0, 0, 0) is black. Using pure white (255, 255, 255) will disable it.
- NOTE: Core scripts are now loaded via the plugin manager, allowing us to show the total number of scripts loading, not just plugins.

# Performance Benchmarks

## Running the drawText command inside Window_Base.drawActorName x1000 times (smaller is better)

### Vanilla RPG Maker (PixiJS 4.5.4)
- totalMilliseconds: 12.415000004693866

### This branch (PixiJS 5.3.8)
- totalMilliseconds: 3.109999932348728


## Running the Window._refreshAllParts function on the title screen x1000 times (smaller is better)

### Vanilla RPG Maker (PixiJS 4.5.4)
- 1: totalMilliseconds: 68.654999951832
- 2: totalMilliseconds: 142.04500010237098
- 3: totalMilliseconds: 104.53000001143664

### This branch (PixiJS 5.3.8)
- 1: totalMilliseconds: 5.775000085122883
- 2: totalMilliseconds: 19.564999965950847
- 3: totalMilliseconds: 7.569999899715185





## Introduction

"RPG Maker MV CoreScript" is a game engine for 2D games that runs on the browser. "RPG Maker MV CoreScript" is designed as a game engine dedicated to "RPG Maker MV", the latest work of "RPG Maker" series of 2DRPG world number one software with more than 20 years history, and more than 1000 games are running. (February 2017)

## What is this project?

This project is a project aimed at improving "RPG Maker MV CoreScript" better by the community and supporting many game creators.

The core script developed by this project is widely distributed to RPG Maker users through KADOKAWA.
The RPGMaker MV community is centered around plugins. Therefore, Ver1 series is developed while minimizing destructive change.

## How to join

- This project uses English as the main language.
- The workflow is Github Flow. When sending PR, prepare a new feature branch and send it to the master branch of this repository.http://scottchacon.com/2011/08/31/github-flow.html
- This project uses ES5. It is for compatibility with plugins.
- Please apply for development slack from this form. It will usually be invited within 48 hours.https://docs.google.com/forms/d/1T5wrKeOAfFBNytHrby4HMDzShtOMl2s7ayvjGwBrbNY/edit
- This project is just started. The rules of development are decided through discussion.

## Roadmap

Development will be done according to the roadmap. Currently we are developing ver 1.2

### ver 1.0

Goal: Publish community development version
- Split core script file
- Put on github
- Publish roadmap

### ver 1.1

Goal: Fix a fatal bug
- Fix memory related problems
- Preceding reading of image material
- Responding to sound problems of google Chrome
- Fixed bugs already known


### ver 1.2

Goal: Responding to problems where games can not continue
- Retry at load error
- Development of a standard plugin for options
- Volume Change API

### ver 1.3

Goal: Assist in game development
- AutoSave
- Simple conflict check for plugins
- Guidelines and sample writing for plugins
- Refined bug report

## Constitution
The core script is finally output to mainly 6 files.
<dl>
    <dt>rpg_core.js</dt>
    <dd>Wrapper classes of Pixi.js and base classes such as audio and input processing.</dd>
    <dt>rpg_managers.js</dt>
    <dd>Static classes named XxxManager that manage the game overall.</dd>
    <dt>rpg_objects.js</dt>
    <dd>Classes named Game_Xxx dealing with game data (many are saved).</dd>
    <dt>rpg_scenes.js</dt>
    <dd>Classes named Scene_Xxx in which the scene is defined.</dd>
    <dt>rpg_sprites.js</dt>
    <dd>Classes named Sprite_Xxx related to image display and processing.</dd>
    <dt>rpg_windows.js</dt>
    <dd>Classes named Window_Xxx handling window display and input.</dd>
</dl>

In addition, a plugin list is defined in *plugins.js*, and *main.js* launches the game.

## Inheritance style

```js
// In JavaScript this function is constructor
function Derived() {
    this.initialize.apply(this, arguments); // Delegate to initialize()
}

Derived.prototype = Object.create(Base.prototype); // Derived inherits from Base
Derived.prototype.constructor = Derived;

Derived.prototype.initialize = function () {
    Base.prototype.initialize.call(this); // This makes super.initialize() sense
};
```

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
