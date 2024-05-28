<script context="module" lang="ts">
	import { createGameConfig } from '$lib/game/config';
	import { adjustForPixelRatio, reloadWhenResize } from '@jostein-skaar/common-game';

	let isDebug = true;
	if (import.meta.env.PROD) {
		isDebug = false;
	}
	isDebug = false;

	let scaleModePhaser = Phaser.Scale.ScaleModes.NONE;

	const height = 600;
	const maxWantedWidth = 800;
	let width = maxWantedWidth;
	if (window.innerHeight < height) {
		scaleModePhaser = Phaser.Scale.ScaleModes.FIT;
		const scaleRatio = window.innerHeight / height;
		console.log('scaleRatio', scaleRatio);
		// Compensate scale ratio to be able to fill width of screen when FIT is used.
		width = Math.min(window.innerWidth / scaleRatio, maxWantedWidth);
	} else {
		width = Math.min(window.innerWidth, maxWantedWidth);
	}

	console.log('width', width, 'height', height, 'pixelRatio', window.devicePixelRatio);

	const gameConfig = createGameConfig(
		width,
		height,
		scaleModePhaser,
		Phaser.Scale.Center.NO_CENTER,
		adjustForPixelRatio(1),
		isDebug
	);

	setTimeout(() => {
		const phaserGame = new Phaser.Game(gameConfig);
	});

	reloadWhenResize(window);
</script>

<div class="game-container">
	<div id="game"></div>
</div>

<style>
	@media only screen and (max-width: 600px) {
		:global(body) {
			background-color: #e9e9e9;
		}
	}

	.game-container {
		container-type: size;
		container-name: game-container;
		display: flex;
		justify-content: center;
		align-items: center;
		height: 100vh;
		height: 100svh;
	}
	#game {
		text-align: center;
		max-width: 800px;
		max-height: 600px;
	}

	@container game-container (min-width: 820px) and (min-height: 620px) {
		#game {
			align-items: center;
			background-color: yellow;
			box-sizing: content-box;
			border: 10px dashed var(--bg-color);
		}
	}
</style>
