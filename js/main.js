(function () {
	PluginManager.setup($plugins);

	const init = () => {
		document.body.classList.remove('is-loading');
		PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;
		PIXI.settings.ROUND_PIXELS = true;
		PIXI.settings.GC_MAX_IDLE = 600;
		PIXI.settings.MIPMAP_TEXTURES = PIXI.MIPMAP_MODES.OFF;
		if (window.devicePixelRatio > 1) {
			PIXI.settings.RENDER_OPTIONS.autoDensity = true;
			PIXI.settings.RESOLUTION = window.devicePixelRatio;
		}
		if (Utils.isMobileSafari()) {
			PIXI.settings.PRECISION_FRAGMENT = PIXI.PRECISION.HIGH;
			PIXI.settings.PRECISION_VERTEX = PIXI.PRECISION.HIGH;
		} else {
			PIXI.settings.PRECISION_FRAGMENT = PIXI.PRECISION.MEDIUM;
			PIXI.settings.PRECISION_VERTEX = PIXI.PRECISION.MEDIUM;
		}
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
