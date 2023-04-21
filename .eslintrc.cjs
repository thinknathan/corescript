module.exports = {
	root: true,
	extends: ['eslint:recommended', 'plugin:import/warnings', 'prettier'],
	globals: {
		PIXI: true,
		NODE_ENV: true,
		$plugins: true,
		GameStats: true,
		nw: true,
	},
	env: {
		node: true,
		es6: true,
		amd: true,
		browser: true,
	},
	parserOptions: {
		ecmaVersion: 2018,
		sourceType: 'module',
	},
	plugins: ['import', 'prettier'],
	settings: {
		'import/core-modules': [],
		'import/ignore': [
			'node_modules',
			'\\.(coffee|scss|css|less|hbs|svg|json)$',
		],
	},
	rules: {
		'prettier/prettier': 'error',
		'no-console': 0,
		'no-empty': 0,
		'comma-dangle': [
			'error',
			{
				arrays: 'always-multiline',
				objects: 'always-multiline',
				imports: 'always-multiline',
				exports: 'always-multiline',
				functions: 'ignore',
			},
		],
	},
};
