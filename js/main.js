(function () {
	PluginManager.setup($plugins);

	const init = function () {
		document.body.classList.remove('is-loading');
		PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;
		PIXI.settings.ROUND_PIXELS = true;
		PIXI.settings.MIPMAP_TEXTURES = PIXI.MIPMAP_MODES.OFF;
		PIXI.settings.GC_MODE = PIXI.GC_MODES.MANUAL;
		SceneManager.run(Scene_Boot);
	};

	if (document.readyState === 'complete') {
		init();
	} else {
		window.addEventListener('load', () => {
			init();
		});
	}
})();
