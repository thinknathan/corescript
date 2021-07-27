$rpg_core = @(
'.\js\rpg_core\_header.js',
'.\js\rpg_core\ProgressWatcher.js',
'.\js\rpg_core\JsExtensions.js',
'.\js\rpg_core\Utils.js',
'.\js\rpg_core\CacheEntry.js',
'.\js\rpg_core\CacheMap.js',
'.\js\rpg_core\ImageCache.js',
'.\js\rpg_core\RequestQueue.js',
'.\js\rpg_core\Point.js',
'.\js\rpg_core\Rectangle.js',
'.\js\rpg_core\Bitmap.js',
'.\js\rpg_core\BitmapPIXI.js',
'.\js\rpg_core\Graphics.js',
'.\js\rpg_core\Input.js',
'.\js\rpg_core\TouchInput.js',
'.\js\rpg_core\Sprite.js',
'.\js\rpg_core\Tilemap.js',
'.\js\rpg_core\ShaderTilemap.js',
'.\js\rpg_core\TilingSprite.js',
'.\js\rpg_core\ScreenSprite.js',
'.\js\rpg_core\Window.js',
'.\js\rpg_core\WindowLayer.js',
'.\js\rpg_core\Weather.js',
'.\js\rpg_core\ToneFilter.js',
'.\js\rpg_core\ToneSprite.js',
'.\js\rpg_core\Stage.js',
'.\js\rpg_core\WebAudio.js',
'.\js\rpg_core\JsonEx.js',
'.\js\rpg_core\Decrypter.js',
'.\js\rpg_core\ResourceHandler.js'
)
$rpg_managers = @(
'.\js\rpg_managers\_header.js',
'.\js\rpg_managers\DataManager.js',
'.\js\rpg_managers\ConfigManager.js',
'.\js\rpg_managers\StorageManager.js',
'.\js\rpg_managers\ImageManager.js',
'.\js\rpg_managers\AudioManager.js',
'.\js\rpg_managers\SoundManager.js',
'.\js\rpg_managers\TextManager.js',
'.\js\rpg_managers\SceneManager.js',
'.\js\rpg_managers\BattleManager.js',
'.\js\rpg_managers\PluginManager.js'
)
$rpg_objects = @(
'.\js\rpg_objects\_header.js',
'.\js\rpg_objects\Game_Temp.js',
'.\js\rpg_objects\Game_System.js',
'.\js\rpg_objects\Game_Timer.js',
'.\js\rpg_objects\Game_Message.js',
'.\js\rpg_objects\Game_Switches.js',
'.\js\rpg_objects\Game_Variables.js',
'.\js\rpg_objects\Game_SelfSwitches.js',
'.\js\rpg_objects\Game_Screen.js',
'.\js\rpg_objects\Game_Picture.js',
'.\js\rpg_objects\Game_Item.js',
'.\js\rpg_objects\Game_Action.js',
'.\js\rpg_objects\Game_ActionResult.js',
'.\js\rpg_objects\Game_BattlerBase.js',
'.\js\rpg_objects\Game_Battler.js',
'.\js\rpg_objects\Game_Actor.js',
'.\js\rpg_objects\Game_Enemy.js',
'.\js\rpg_objects\Game_Actors.js',
'.\js\rpg_objects\Game_Unit.js',
'.\js\rpg_objects\Game_Party.js',
'.\js\rpg_objects\Game_Troop.js',
'.\js\rpg_objects\Game_Map.js',
'.\js\rpg_objects\Game_CommonEvent.js',
'.\js\rpg_objects\Game_CharacterBase.js',
'.\js\rpg_objects\Game_Character.js',
'.\js\rpg_objects\Game_Player.js',
'.\js\rpg_objects\Game_Follower.js',
'.\js\rpg_objects\Game_Followers.js',
'.\js\rpg_objects\Game_Vehicle.js',
'.\js\rpg_objects\Game_Event.js',
'.\js\rpg_objects\Game_Interpreter.js'
)
$rpg_scenes = @(
'.\js\rpg_scenes\_header.js',
'.\js\rpg_scenes\Scene_Base.js',
'.\js\rpg_scenes\Scene_Boot.js',
'.\js\rpg_scenes\Scene_Title.js',
'.\js\rpg_scenes\Scene_Map.js',
'.\js\rpg_scenes\Scene_MenuBase.js',
'.\js\rpg_scenes\Scene_Menu.js',
'.\js\rpg_scenes\Scene_ItemBase.js',
'.\js\rpg_scenes\Scene_Item.js',
'.\js\rpg_scenes\Scene_Skill.js',
'.\js\rpg_scenes\Scene_Equip.js',
'.\js\rpg_scenes\Scene_Status.js',
'.\js\rpg_scenes\Scene_Options.js',
'.\js\rpg_scenes\Scene_File.js',
'.\js\rpg_scenes\Scene_Save.js',
'.\js\rpg_scenes\Scene_Load.js',
'.\js\rpg_scenes\Scene_GameEnd.js',
'.\js\rpg_scenes\Scene_Shop.js',
'.\js\rpg_scenes\Scene_Name.js',
'.\js\rpg_scenes\Scene_Debug.js',
'.\js\rpg_scenes\Scene_Battle.js',
'.\js\rpg_scenes\Scene_Gameover.js'
)
$rpg_sprites = @(
'.\js\rpg_sprites\_header.js',
'.\js\rpg_sprites\Sprite_Base.js',
'.\js\rpg_sprites\Sprite_Button.js',
'.\js\rpg_sprites\Sprite_Character.js',
'.\js\rpg_sprites\Sprite_Battler.js',
'.\js\rpg_sprites\Sprite_Actor.js',
'.\js\rpg_sprites\Sprite_Enemy.js',
'.\js\rpg_sprites\Sprite_Animation.js',
'.\js\rpg_sprites\Sprite_Damage.js',
'.\js\rpg_sprites\Sprite_StateIcon.js',
'.\js\rpg_sprites\Sprite_StateOverlay.js',
'.\js\rpg_sprites\Sprite_Weapon.js',
'.\js\rpg_sprites\Sprite_Balloon.js',
'.\js\rpg_sprites\Sprite_Picture.js',
'.\js\rpg_sprites\Sprite_Timer.js',
'.\js\rpg_sprites\Sprite_Destination.js',
'.\js\rpg_sprites\Spriteset_Base.js',
'.\js\rpg_sprites\Spriteset_Map.js',
'.\js\rpg_sprites\Spriteset_Battle.js'
)
$rpg_windows = @(
'.\js\rpg_windows\_header.js',
'.\js\rpg_windows\Window_Base.js',
'.\js\rpg_windows\Window_Selectable.js',
'.\js\rpg_windows\Window_Command.js',
'.\js\rpg_windows\Window_HorzCommand.js',
'.\js\rpg_windows\Window_Help.js',
'.\js\rpg_windows\Window_Gold.js',
'.\js\rpg_windows\Window_MenuCommand.js',
'.\js\rpg_windows\Window_MenuStatus.js',
'.\js\rpg_windows\Window_MenuActor.js',
'.\js\rpg_windows\Window_ItemCategory.js',
'.\js\rpg_windows\Window_ItemList.js',
'.\js\rpg_windows\Window_SkillType.js',
'.\js\rpg_windows\Window_SkillStatus.js',
'.\js\rpg_windows\Window_SkillList.js',
'.\js\rpg_windows\Window_EquipStatus.js',
'.\js\rpg_windows\Window_EquipCommand.js',
'.\js\rpg_windows\Window_EquipSlot.js',
'.\js\rpg_windows\Window_EquipItem.js',
'.\js\rpg_windows\Window_Status.js',
'.\js\rpg_windows\Window_Options.js',
'.\js\rpg_windows\Window_SavefileList.js',
'.\js\rpg_windows\Window_ShopCommand.js',
'.\js\rpg_windows\Window_ShopBuy.js',
'.\js\rpg_windows\Window_ShopSell.js',
'.\js\rpg_windows\Window_ShopNumber.js',
'.\js\rpg_windows\Window_ShopStatus.js',
'.\js\rpg_windows\Window_NameEdit.js',
'.\js\rpg_windows\Window_NameInput.js',
'.\js\rpg_windows\Window_ChoiceList.js',
'.\js\rpg_windows\Window_NumberInput.js',
'.\js\rpg_windows\Window_EventItem.js',
'.\js\rpg_windows\Window_Message.js',
'.\js\rpg_windows\Window_ScrollText.js',
'.\js\rpg_windows\Window_MapName.js',
'.\js\rpg_windows\Window_BattleLog.js',
'.\js\rpg_windows\Window_PartyCommand.js',
'.\js\rpg_windows\Window_ActorCommand.js',
'.\js\rpg_windows\Window_BattleStatus.js',
'.\js\rpg_windows\Window_BattleActor.js',
'.\js\rpg_windows\Window_BattleEnemy.js',
'.\js\rpg_windows\Window_BattleSkill.js',
'.\js\rpg_windows\Window_BattleItem.js',
'.\js\rpg_windows\Window_TitleCommand.js',
'.\js\rpg_windows\Window_GameEnd.js',
'.\js\rpg_windows\Window_DebugRange.js',
'.\js\rpg_windows\Window_DebugEdit.js'
)
Write-Host "Creating rpg_core.js from files in /js/rpg_core/"
Remove-Item .\rpg_core.js
$rpg_core | ForEach-Object { Get-Content -Path $_ | Add-Content -Path .\rpg_core.js }

Write-Host "Creating rpg_managers.js from files in /js/rpg_managers/"
Remove-Item .\rpg_managers.js
$rpg_managers | ForEach-Object { Get-Content -Path $_ | Add-Content -Path .\rpg_managers.js }

Write-Host "Creating rpg_objects.js from files in /js/rpg_objects/"
Remove-Item .\rpg_objects.js
$rpg_objects | ForEach-Object { Get-Content -Path $_ | Add-Content -Path .\rpg_objects.js }

Write-Host "Creating rpg_scenes.js from files in /js/rpg_scenes/"
Remove-Item .\rpg_scenes.js
$rpg_scenes | ForEach-Object { Get-Content -Path $_ | Add-Content -Path .\rpg_scenes.js }

Write-Host "Creating rpg_sprites.js from files in /js/rpg_sprites/"
Remove-Item .\rpg_sprites.js
$rpg_sprites | ForEach-Object { Get-Content -Path $_ | Add-Content -Path .\rpg_sprites.js }

Write-Host "Creating rpg_scenes.js from files in /js/rpg_scenes/"
Remove-Item .\rpg_scenes.js
$rpg_scenes | ForEach-Object { Get-Content -Path $_ | Add-Content -Path .\rpg_scenes.js }

Write-Host "Creating rpg_windows.js from files in /js/rpg_windows/"
Remove-Item .\rpg_windows.js
$rpg_windows | ForEach-Object { Get-Content -Path $_ | Add-Content -Path .\rpg_windows.js }

Read-Host -Prompt "Press Enter to exit"
