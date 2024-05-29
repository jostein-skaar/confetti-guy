import { MainScene } from './main-scene';

export function createGameConfig(
	width: number,
	height: number,
	scaleModePhaser: Phaser.Scale.ScaleModes,
	centerModePhaser: Phaser.Scale.Center,
	pixelRatio: number,
	isDebug: boolean
): Phaser.Types.Core.GameConfig {
	const gameConfig: Phaser.Types.Core.GameConfig = {
		type: Phaser.AUTO,
		// type: Phaser.CANVAS,
		scene: [MainScene],
		width: width * pixelRatio,
		height: height * pixelRatio,
		backgroundColor: 0xf7f7f7,
		autoFocus: true,
		parent: 'game',

		render: {
			antialias: true // Using this to prevent flickering presents when moving (at least on iPhone with pixelRatio 3).
			// antialias: false, er default, giving a crisper appearance.
			// antialias: true, // giving a smooth appearance.
			// roundPixels: true, round pixel values to whole integers? Prevent sub-pixel aliasing. (false er default)
			// pixelArt: true, gir antialias=false og roundPixels=true
		},

		physics: {
			default: 'arcade',
			arcade: {
				gravity: { x: 0, y: 300 * pixelRatio },
				debug: isDebug
			}
		},

		scale: {
			// Vi har denne som FIT først, for da vil canvas.style.width og .height settes automatisk.
			// Må fjernes etterpå, ellers vil rare ting skje i forbindelse med resize.
			mode: scaleModePhaser,
			autoCenter: centerModePhaser,
			// mode: Phaser.Scale.ScaleModes.NONE,
			// mode: Phaser.Scale.ScaleModes.FIT,
			// autoCenter: Phaser.Scale.Center.CENTER_BOTH,
			// autoCenter: Phaser.Scale.Center.CENTER_HORIZONTALLY,
			// autoCenter: Phaser.Scale.Center.CENTER_VERTICALLY,
			// expandParent: true

			zoom: 1 / pixelRatio
			// autoRound: true,
		}
	};

	return gameConfig;
}
