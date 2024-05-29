import { adjustForPixelRatio } from '@jostein-skaar/common-game';
import Phaser, { type GameObjects } from 'phaser';

export class MainScene extends Phaser.Scene {
	width!: number;
	height!: number;
	cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
	hero!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
	rewardGroup!: Phaser.Physics.Arcade.StaticGroup;
	platformGroup!: Phaser.Physics.Arcade.StaticGroup;
	scoreText!: GameObjects.Text;

	settings = {
		groundHeight: adjustForPixelRatio(24),
		heroGravity: adjustForPixelRatio(600),
		jumpVelocity: adjustForPixelRatio(500),
		walkVelocity: adjustForPixelRatio(200),
		platformColor: 0xfecc00,
		confettiCount: 1000
	};

	control = {
		up: false,
		left: false,
		right: false
	};

	startStopTimer = false;
	hasStopped = false;
	timeSinceStopped = 0;
	score = 0;
	timeStill = 0;
	hasLost = false;
	cursorButtonAlpha = 0.6;

	constructor() {
		super('main-scene');
	}

	init(): void {
		this.width = this.game.scale.gameSize.width;
		this.height = this.game.scale.gameSize.height;

		console.log('MainScene init', this.width, this.height);
	}

	preload(): void {
		this.load.multiatlas(
			'sprites',
			`/assets/sprites@${adjustForPixelRatio(1)}.json?v={VERSJON}`,
			'/assets'
		);
	}

	create(): void {
		this.scoreText = this.add
			.text(adjustForPixelRatio(10), adjustForPixelRatio(10), '', {
				fontSize: adjustForPixelRatio(20) + 'px',
				color: '#222'
			})
			.setDepth(1);

		this.cursors = this.input.keyboard!.createCursorKeys();

		const upPositionX = this.width - adjustForPixelRatio(110);
		const upPositionY = this.height - adjustForPixelRatio(120);
		const leftRightPositionY = upPositionY + adjustForPixelRatio(54);
		const leftPositionX = upPositionX - adjustForPixelRatio(27);
		const rightPositionX = upPositionX + adjustForPixelRatio(27);
		const buttonUp = this.add
			.text(upPositionX, upPositionY, '⬆️', {
				padding: { x: adjustForPixelRatio(5), y: adjustForPixelRatio(5) },
				fontSize: adjustForPixelRatio(48) + 'px',
				color: '#222'
			})
			.setDepth(1)
			.setAlpha(this.cursorButtonAlpha)
			.setInteractive()
			.on('pointerdown', () => {
				this.control.up = true;
			})
			.on('pointerout', () => {
				this.control.up = false;
			})
			.on('pointerup', () => {
				this.control.up = false;
				this.performJump();
			});
		const buttonLeft = this.add
			.text(leftPositionX, leftRightPositionY, '⬅️', {
				padding: { x: adjustForPixelRatio(5), y: adjustForPixelRatio(5) },
				fontSize: adjustForPixelRatio(48) + 'px',
				color: '#222'
			})
			.setDepth(1)
			.setAlpha(this.cursorButtonAlpha)
			.setInteractive()
			.on('pointerdown', () => {
				this.control.left = true;
			})
			.on('pointerout', () => {
				this.control.left = false;
			})
			.on('pointerup', () => {
				this.control.left = false;
			});
		const buttonRight = this.add
			.text(rightPositionX, leftRightPositionY, '➡️', {
				padding: { x: adjustForPixelRatio(5), y: adjustForPixelRatio(5) },
				fontSize: adjustForPixelRatio(48) + 'px',
				color: '#222'
			})
			.setDepth(1)
			.setAlpha(this.cursorButtonAlpha)
			.setInteractive()
			.on('pointerdown', () => {
				this.control.right = true;
			})
			.on('pointerout', () => {
				this.control.right = false;
			})
			.on('pointerup', () => {
				this.control.right = false;
			});

		const hideCursorButtons = () => {
			if (this.cursorButtonAlpha > 0) {
				this.cursorButtonAlpha = 0;
				buttonUp.setAlpha(this.cursorButtonAlpha);
				buttonLeft.setAlpha(this.cursorButtonAlpha);
				buttonRight.setAlpha(this.cursorButtonAlpha);
			}
		};

		this.cursors.up.onDown = () => {
			this.performJump();
			hideCursorButtons();
		};
		this.cursors.left.onDown = () => {
			this.control.left = true;
			hideCursorButtons();
		};
		this.cursors.left.onUp = () => {
			this.control.left = false;
		};
		this.cursors.right.onDown = () => {
			this.control.right = true;
			hideCursorButtons();
		};
		this.cursors.right.onUp = () => {
			this.control.right = false;
		};

		this.rewardGroup = this.physics.add.staticGroup();
		this.platformGroup = this.physics.add.staticGroup();

		this.addPlatforms();
		this.addConfetti();

		this.hero = this.physics.add.sprite(0, 0, 'sprites', 'hero-001.png');
		this.resetHeroPosition();
		this.hero.setGravityY(this.settings.heroGravity);
		this.hero.setCollideWorldBounds(true);
		console.log('hero', this.hero.height, this.hero.width);

		this.hero.anims.create({
			key: 'stand',
			frames: [{ key: 'sprites', frame: 'hero-001.png' }],
			frameRate: 6,
			repeat: -1
		});
		this.hero.anims.create({
			key: 'jump',
			frames: [
				{ key: 'sprites', frame: 'hero-005.png' },
				{ key: 'sprites', frame: 'hero-004.png' }
			],
			frameRate: 6,
			repeat: -1
		});
		this.hero.anims.create({
			key: 'walk',
			frames: [
				{ key: 'sprites', frame: 'hero-003.png' },
				{ key: 'sprites', frame: 'hero-004.png' }
			],
			frameRate: 6,
			repeat: -1
		});

		this.physics.add.collider(this.hero, this.platformGroup);

		this.physics.add.overlap(
			this.hero,
			this.rewardGroup,
			// @ts-expect-error(TODO: Need to find out how to fix this)
			(_hero, reward: Phaser.Types.Physics.Arcade.ImageWithStaticBody) => {
				this.collectReward(reward);
			}
		);
	}

	update(_time: number, delta: number): void {
		if (this.control.left) {
			this.hero.setVelocityX(-this.settings.walkVelocity);
			this.hero.anims.play('walk', true);
			this.hero.setFlipX(true);
			this.hasStopped = false;
		} else if (this.control.right) {
			this.hero.setVelocityX(this.settings.walkVelocity);
			this.hero.anims.play('walk', true);
			this.hero.setFlipX(false);
			this.hasStopped = false;
		} else {
			this.hero.setVelocityX(0);
			this.hero.anims.play('stand', true);
			this.hero.setFlipX(false);
			this.timeSinceStopped += delta;
			this.hasStopped = true;
		}

		// if (this.input.activePointer.isDown) {
		// const { x } = this.input.activePointer;
		// if (Math.abs(x - this.hero.x) < 10) {
		// 	this.hero.setVelocityX(0);
		// 	this.hero.anims.play('stand', true);
		// 	this.hero.setFlipX(false);
		// 	this.hasStopped = true;
		// } else if (x < this.hero.x) {
		// 	this.hero.setVelocityX(-this.settings.walkVelocity);
		// 	this.hero.anims.play('walk', true);
		// 	this.hero.setFlipX(true);
		// 	this.hasStopped = false;
		// } else if (x > this.hero.x) {
		// 	this.hero.setVelocityX(this.settings.walkVelocity);
		// 	this.hero.anims.play('walk', true);
		// 	this.hero.setFlipX(false);
		// 	this.hasStopped = false;
		// }
		// } else {
		// 	if (this.cursors.left.isDown) {
		// 		this.hero.setVelocityX(-this.settings.walkVelocity);
		// 		this.hero.anims.play('walk', true);
		// 		this.hero.setFlipX(true);
		// 		this.hasStopped = false;
		// 	} else if (this.cursors.right.isDown) {
		// 		this.hero.setVelocityX(this.settings.walkVelocity);
		// 		this.hero.anims.play('walk', true);
		// 		this.hero.setFlipX(false);
		// 		this.hasStopped = false;
		// 	} else {
		// 		this.hero.setVelocityX(0);
		// 		this.hero.anims.play('stand', true);
		// 		this.hero.setFlipX(false);
		// 		this.timeSinceStopped += delta;
		// 		this.hasStopped = true;
		// 	}
		// }

		if (this.hasStopped === false) {
			this.startStopTimer = true;
		}

		if (this.startStopTimer && this.hasStopped) {
			this.timeSinceStopped += delta;
		} else {
			this.timeSinceStopped = 0;
		}

		if (this.timeSinceStopped > 5000) {
			this.addPlatforms();
			this.addConfetti();
			this.timeSinceStopped = 0;
			this.startStopTimer = false;
		}

		if (this.isHeroBelowGround()) {
			this.resetHeroPosition();
		}
		if (!this.hero.body.onFloor()) {
			this.hero.anims.play('jump', true);
		}

		this.timeStill = 5 - this.timeSinceStopped / 1000;
		const confettiLeft = this.rewardGroup.getChildren().length;

		let text = `confetti to clean: ${confettiLeft}`;
		if (this.startStopTimer) {
			text += `\n(restarts in: ${this.timeStill.toFixed(2)})`;
		}
		this.scoreText.setText(text);
	}

	private performJump() {
		if (this.hero.body.onFloor()) {
			this.hero.setVelocityY(-this.settings.jumpVelocity);
		}
	}

	private resetHeroPosition() {
		this.hero.setPosition(
			this.scale.width / 4,
			this.scale.height - this.hero.height / 2 - this.settings.groundHeight
		);
	}

	private isHeroBelowGround() {
		return this.hero.y > this.scale.height - this.hero.height / 2 - this.settings.groundHeight;
	}

	private addPlatforms() {
		this.platformGroup.clear(true, true);
		const ground = this.add.rectangle(
			this.scale.width / 2,
			this.scale.height - this.settings.groundHeight / 2,
			this.scale.width,
			this.settings.groundHeight,
			this.settings.platformColor
		);
		this.platformGroup.add(ground);

		const platformYPositions = [
			adjustForPixelRatio(126),
			adjustForPixelRatio(284),
			adjustForPixelRatio(442)
		];
		const possibleXCount = Math.floor(this.scale.width / 100) / adjustForPixelRatio(1) - 1;
		const adjustedWidth = this.scale.width / possibleXCount;

		for (const y of platformYPositions) {
			const numberOfPlatforms = Phaser.Math.Between(3, possibleXCount - 2);
			const platformIndices: number[] = [];
			for (let i = 0; i < numberOfPlatforms; i++) {
				let randomIndex = Phaser.Math.Between(0, possibleXCount - 1);
				while (platformIndices.includes(randomIndex)) {
					randomIndex = Phaser.Math.Between(0, possibleXCount - 1);
				}
				platformIndices.push(randomIndex);
			}

			for (const index of platformIndices) {
				const x = index * adjustedWidth;
				const platform = this.add.rectangle(
					x + adjustedWidth / 2,
					y,
					adjustedWidth,
					this.settings.groundHeight,
					this.settings.platformColor
				);
				this.platformGroup.add(platform);
			}
		}
	}

	private addConfetti() {
		// const color = Phaser.Display.Color.RandomRGB().color;
		const confettiColors = [
			0xff0000, // Red
			0x00ff00, // Green
			0x0000ff, // Blue
			0xffff00, // Yellow
			0xff00ff, // Magenta
			0x00ffff, // Cyan
			0xffa500, // Orange
			0x800080, // Purple
			0xffc0cb, // Pink
			0x00ff7f, // Spring Green
			0xffd700, // Gold
			0x8a2be2, // Blue Violet
			0xa52a2a, // Brown
			0xdeb887, // Burly Wood
			0x5f9ea0, // Cadet Blue
			0x7fff00, // Chartreuse
			0xd2691e, // Chocolate
			0xff7f50, // Coral
			0x6495ed, // Cornflower Blue
			0xdc143c, // Crimson
			0x00ced1, // Dark Turquoise
			0x9400d3, // Dark Violet
			0xff1493, // Deep Pink
			0x1e90ff, // Dodger Blue
			0xb22222, // Firebrick
			0x228b22, // Forest Green
			0xdaa520, // Goldenrod
			0xadff2f, // Green Yellow
			0xff69b4, // Hot Pink
			0xcd5c5c // Indian Red
		];

		const platformBoundsList = [];
		for (const platform of this.platformGroup.getChildren()) {
			const platformBounds = (platform as GameObjects.Rectangle).getBounds();
			platformBoundsList.push(platformBounds);
		}

		this.rewardGroup.clear(true, true);
		let x = 0;
		let y = 0;
		for (let i = 0; i < this.settings.confettiCount; i++) {
			x = 0;
			y = 0;
			while (x < adjustForPixelRatio(300) && y < adjustForPixelRatio(60)) {
				x = Phaser.Math.Between(0, this.scale.width);
				y = Phaser.Math.Between(0, this.scale.height - this.settings.groundHeight);
				for (const platformBounds of platformBoundsList) {
					if (
						Phaser.Geom.Rectangle.Overlaps(
							new Phaser.Geom.Rectangle(
								x - adjustForPixelRatio(5),
								y - adjustForPixelRatio(5),
								adjustForPixelRatio(10),
								adjustForPixelRatio(10)
							),
							platformBounds
						)
					) {
						x = 0;
						y = 0;
						break;
					}
				}
			}

			const color = Phaser.Math.RND.pick(confettiColors);
			const confetti = this.add.rectangle(
				x,
				y,
				adjustForPixelRatio(Phaser.Math.Between(7, 11)),
				adjustForPixelRatio(Phaser.Math.Between(5, 7)),
				color
			);

			confetti.rotation = Phaser.Math.Between(0, 360);
			this.rewardGroup.add(confetti);
		}
	}

	private collectReward(reward: Phaser.Types.Physics.Arcade.ImageWithStaticBody) {
		reward.destroy();
	}

	private lose() {
		if (this.hasLost) {
			return;
		}
		this.hasLost = true;
		this.scene.pause();
		this.cameras.main.setBackgroundColor(0xbababa);
		this.cameras.main.setAlpha(0.5);
		setTimeout(() => {
			window.location.href = '/lose?score=' + this.score.toFixed(2);
		}, 1200);
	}
}
