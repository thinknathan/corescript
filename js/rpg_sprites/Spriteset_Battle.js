import Spriteset_Base from "./Spriteset_Base.js";
import Graphics from "../rpg_core/Graphics.js";
import Sprite from "../rpg_core/Sprite.js";
import TilingSprite from "../rpg_core/TilingSprite.js";
import Sprite_Enemy from "../rpg_sprites/Sprite_Enemy.js";
import Sprite_Actor from "../rpg_sprites/Sprite_Actor.js";
import ImageManager from "../rpg_managers/ImageManager.js";
import SceneManager from "../rpg_managers/SceneManager.js";
import BattleManager from "../rpg_managers/BattleManager.js";

//-----------------------------------------------------------------------------
// Spriteset_Battle
//
// The set of sprites on the battle screen.

class Spriteset_Battle extends Spriteset_Base {
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
    this._backgroundSprite = new Sprite();
    this._backgroundSprite.bitmap = SceneManager.backgroundBitmap();
    this._baseSprite.addChild(this._backgroundSprite);
  }

  update() {
    super.update();
    this.updateActors();
    this.updateBattleback();
  }

  createBattleField() {
    const width = Graphics.boxWidth;
    const height = Graphics.boxHeight;
    const x = (Graphics.width - width) / 2;
    const y = (Graphics.height - height) / 2;
    this._battleField = new Sprite();
    this._battleField.setFrame(x, y, width, height);
    this._battleField.x = x;
    this._battleField.y = y;
    this._baseSprite.addChild(this._battleField);
  }

  createBattleback() {
    const margin = 32;
    const x = -this._battleField.x - margin;
    const y = -this._battleField.y - margin;
    const width = Graphics.width + margin * 2;
    const height = Graphics.height + margin * 2;
    this._back1Sprite = new TilingSprite();
    this._back2Sprite = new TilingSprite();
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
    return ImageManager.loadBattleback1(this.battleback1Name());
  }

  battleback2Bitmap() {
    return ImageManager.loadBattleback2(this.battleback2Name());
  }

  battleback1Name() {
    if (BattleManager.isBattleTest()) {
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
    if (BattleManager.isBattleTest()) {
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
    if (self.$gameMap.battleback1Name() === "") return "";
    if (self.$gamePlayer.isInVehicle()) {
      return this.shipBattleback1Name();
    } else {
      return this.normalBattleback1Name();
    }
  }

  overworldBattleback2Name() {
    if (self.$gameMap.battleback2Name() === "") return "";
    if (self.$gamePlayer.isInVehicle()) {
      return this.shipBattleback2Name();
    } else {
      return this.normalBattleback2Name();
    }
  }

  normalBattleback1Name() {
    return (
      this.terrainBattleback1Name(this.autotileType(1)) ||
      this.terrainBattleback1Name(this.autotileType(0)) ||
      this.defaultBattleback1Name()
    );
  }

  normalBattleback2Name() {
    return (
      this.terrainBattleback2Name(this.autotileType(1)) ||
      this.terrainBattleback2Name(this.autotileType(0)) ||
      this.defaultBattleback2Name()
    );
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
      sprites[i] = new Sprite_Enemy(enemies[i]);
    }
    sprites.sort(this.compareEnemySprite.bind(this));
    for (let j = 0; j < sprites.length; j++) {
      this._battleField.addChild(sprites[j]);
    }
    this._enemySprites = sprites;
  }

  compareEnemySprite(a, b) {
    if (a.y !== b.y) {
      return a.y - b.y;
    } else {
      return a.spriteId - b.spriteId;
    }
  }

  createActors() {
    this._actorSprites = [];
    for (let i = 0; i < self.$gameParty.maxBattleMembers(); i++) {
      this._actorSprites[i] = new Sprite_Actor();
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
}

export default Spriteset_Battle;
