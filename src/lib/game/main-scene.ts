import { adjustForPixelRatio } from '@jostein-skaar/common-game';
import Phaser, { type GameObjects } from 'phaser';

export class MainScene extends Phaser.Scene {
	width!: number;
	height!: number;
	cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
	hero!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
	rewardGroup!: Phaser.Physics.Arcade.Group;
	platformGroup!: Phaser.Physics.Arcade.StaticGroup;
	scoreText!: GameObjects.Text;
	levelClearedText!: GameObjects.Text;
	losingText!: GameObjects.Text;
	allowSlacking = false;

	settings = {
		groundHeight: adjustForPixelRatio(24),
		heroGravity: adjustForPixelRatio(600),
		jumpVelocity: adjustForPixelRatio(600),
		walkVelocity: adjustForPixelRatio(200),
		platformColor: 0xfecc00,
		confettiBurstCount: 100,
		confettiCount: 10,
		restartTime: 7000,
		warningTime: 2000
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
	confettiIsFinishedShooting = false;
	speedTimer = 0;
	speedReductionCounter = 0;
	confettiSpeedIsFinished = false;

	ranks = [
		'Confetti Trainee',
		'Confetti Sweeper',
		'Party Cleaner',
		'Confetti Collector',
		'Celebration Custodian',
		'Festivity Janitor',
		'Event Sweeper',
		'Party Polisher',
		'Confetti Commander',
		'Celebration Specialist',
		'Confetti Conqueror',
		'Confetti Guy'
	];
	level = 0;
	rank = this.ranks[0];

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
			.text(adjustForPixelRatio(10), this.height - adjustForPixelRatio(42), '', {
				fontSize: adjustForPixelRatio(20) + 'px',
				color: '#006aa7'
			})
			.setDepth(1);

		this.cursors = this.input.keyboard!.createCursorKeys();

		const upPositionX = this.width - adjustForPixelRatio(100);
		const upPositionY = this.height - adjustForPixelRatio(135);
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
			this.control.up = true;
			hideCursorButtons();
		};
		this.cursors.up.onUp = () => {
			this.control.up = false;
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

		this.rewardGroup = this.physics.add.group({
			allowGravity: false
		});
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
		this.physics.add.collider(this.rewardGroup, this.platformGroup);

		this.physics.add.overlap(
			this.hero,
			this.rewardGroup,
			// @ts-expect-error(TODO: Need to find out how to fix this)
			(_hero, reward: Phaser.Types.Physics.Arcade.ImageWithStaticBody) => {
				this.collectReward(reward);
			}
		);

		this.levelClearedText = this.add
			.text(this.width / 2, this.height / 2, 'The rank\non two lines', {
				fontSize: `${adjustForPixelRatio(40)}px`,
				color: '#006aa7',
				fontStyle: 'bold',
				align: 'center'
			})
			.setOrigin(0.5, 0.5)
			.setDepth(1)
			.setVisible(false);

		this.tweens.add({
			targets: this.levelClearedText,
			// x: this.bredde,
			scale: 0.7,
			ease: 'Power0',
			duration: 250,
			yoyo: true,
			repeat: -1
		});

		this.losingText = this.add
			.text(this.width / 2, this.height / 2, 'HEY!\nNo slacking off!', {
				fontSize: `${adjustForPixelRatio(40)}px`,
				color: '#006aa7',
				fontStyle: 'bold',
				align: 'center'
			})
			.setOrigin(0.5, 0.5)
			.setDepth(1)
			.setVisible(false);

		this.tweens.add({
			targets: this.losingText,
			// x: this.bredde,
			scale: 0.9,
			ease: 'Elastic',
			duration: 250,
			yoyo: true,
			repeat: -1
		});
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
		} else if (this.control.up) {
			this.hasStopped = false;
		} else {
			this.hero.setVelocityX(0);
			this.hero.anims.play('stand', true);
			this.hero.setFlipX(false);
			this.timeSinceStopped += delta;
			this.hasStopped = true;
		}

		if (this.hasStopped === false) {
			this.startStopTimer = true;
		}

		if (this.allowSlacking) {
			this.timeSinceStopped = 0;
		}

		if (this.startStopTimer && this.hasStopped) {
			this.timeSinceStopped += delta;
		} else {
			this.timeSinceStopped = 0;
		}

		if (this.timeSinceStopped > this.settings.warningTime) {
			this.losingText.setVisible(true);
		} else {
			this.losingText.setVisible(false);
		}

		if (this.timeSinceStopped > this.settings.restartTime) {
			this.lose();
		}

		if (this.isHeroBelowGround()) {
			this.resetHeroPosition();
		}
		if (!this.hero.body.onFloor()) {
			this.hero.anims.play('jump', true);
		}

		if (this.confettiIsFinishedShooting && !this.confettiSpeedIsFinished) {
			this.speedTimer += delta;
			if (this.speedTimer > 200) {
				this.rewardGroup.getChildren().forEach((confetti) => {
					const confettiBody = confetti.body as Phaser.Physics.Arcade.Body;
					confettiBody.setVelocityX(confettiBody.velocity.x * 0.9);
					confettiBody.setVelocityY(confettiBody.velocity.y * 0.9);
				});
				this.speedTimer = 0;
				this.speedReductionCounter++;
				if (this.speedReductionCounter > 20) {
					this.confettiSpeedIsFinished = true;
				}
			}
		}

		const confettiLeft = this.rewardGroup.getChildren().length;
		const text = `${this.rank}\nConfetti Counter: ${confettiLeft}`;
		// if (this.startStopTimer) {
		//  this.timeStill = (this.settings.restartTime - this.timeSinceStopped) / 1000;
		// 	text += `\n(restarts in: ${this.timeStill.toFixed(2)})`;
		// }
		this.scoreText.setText(text);

		if (this.confettiIsFinishedShooting && confettiLeft === 0) {
			this.finished();
		}
	}

	private performJump() {
		if (this.hero.body.onFloor()) {
			this.hero.setVelocityY(-this.settings.jumpVelocity);
			this.hasStopped = false;
		}
	}

	private resetHeroPosition() {
		this.hero.setPosition(
			this.scale.width / 4,
			this.scale.height - this.hero.height / 2 - this.settings.groundHeight * 2
		);
	}

	private isHeroBelowGround() {
		return this.hero.y > this.scale.height - this.hero.height / 2 - this.settings.groundHeight;
	}

	private addPlatforms() {
		this.platformGroup.clear(true, true);
		const ground = this.add.rectangle(
			this.scale.width / 2,
			this.scale.height - this.settings.groundHeight,
			this.scale.width,
			this.settings.groundHeight * 2,
			this.settings.platformColor
		);
		this.platformGroup.add(ground);

		const platformYPositions = [
			adjustForPixelRatio(132),
			adjustForPixelRatio(280),
			adjustForPixelRatio(428)
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

	private async addConfetti() {
		const confettiColors = [
			0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff, 0xffa500, 0x800080, 0xffc0cb,
			0x00ff7f, 0xffd700, 0x8a2be2, 0xa52a2a, 0xdeb887, 0x5f9ea0, 0x7fff00, 0xd2691e, 0xff7f50,
			0x6495ed, 0xdc143c, 0x00ced1, 0x9400d3, 0xff1493, 0x1e90ff, 0xb22222, 0x228b22, 0xdaa520,
			0xadff2f, 0xff69b4, 0xcd5c5c
		];

		const speeds = [-10, -9, -8, -7, -6, -5, 5, 6, 7, 8, 9, 10].map(adjustForPixelRatio);

		this.rewardGroup.clear(true, true);

		for (let j = 0; j < this.settings.confettiBurstCount; j++) {
			const x = Phaser.Math.Between(0, this.scale.width);
			const y = Phaser.Math.Between(0, this.scale.height - this.settings.groundHeight);

			for (let i = 0; i < this.settings.confettiCount; i++) {
				const color = Phaser.Math.RND.pick(confettiColors);

				this.rewardGroup
					.create(x, y, 'sprites', 'rewards-001.png')
					.setTintFill(color)
					.setDisplaySize(
						adjustForPixelRatio(Phaser.Math.Between(7, 11)),
						adjustForPixelRatio(Phaser.Math.Between(5, 7))
					)
					.setRotation(Phaser.Math.Between(0, 360))
					.setCollideWorldBounds(true)
					.setBounce(1, 1)
					.setVelocityX(Phaser.Math.RND.pick(speeds) * 20)
					.setVelocityY(Phaser.Math.RND.pick(speeds) * 20);
			}

			await this.sleep(100 / (j + 1));
		}
		this.confettiIsFinishedShooting = true;
	}

	private sleep(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	private addConfettiStaticRectangle() {
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

			this.physics.add.existing(confetti);

			confetti.rotation = Phaser.Math.Between(0, 360);
			// confetti.setVelocity(Phaser.Math.Between(-50, 50), Phaser.Math.Between(-50, 50));
			// this.rewardGroup.add(confetti);
		}
	}

	private collectReward(reward: Phaser.Types.Physics.Arcade.ImageWithStaticBody) {
		reward.destroy();
	}

	private finished() {
		this.allowSlacking = true;
		this.level++;
		this.rank = this.ranks[this.level > 11 ? 11 : this.level];
		if (this.level > 10) {
			this.rank += ' ' + this.getDanRank(this.level - 10);
		}
		this.levelClearedText.setText(
			`Level ${this.level} cleared!\n${this.replaceFirstTwoOccurrences(this.rank, ' ', '\n')}`
		);
		this.levelClearedText.setVisible(true);
		this.confettiIsFinishedShooting = false;
		this.timeSinceStopped = 0;
		this.startStopTimer = false;
		this.confettiSpeedIsFinished = false;
		this.speedReductionCounter = 0;
		setTimeout(() => {
			this.addPlatforms();
			this.addConfetti();
			setTimeout(() => {
				this.levelClearedText.setVisible(false);
				this.allowSlacking = false;
			}, 1000);
		}, 2500);
	}

	private lose() {
		if (this.hasLost) {
			return;
		}
		this.hasLost = true;
		this.scene.pause();
		this.cameras.main.setBackgroundColor(0xbababa);
		// this.cameras.main.setAlpha(0.5);
		this.losingText.setText('Too much\nSlacking!').setVisible(true);
		setTimeout(() => {
			window.location.href = '/lose?rank=' + this.rank;
		}, 1200);
	}
	private getDanRank(danLevel: number): string {
		const suffixes = ['th', 'st', 'nd', 'rd'];
		const lastDigit = danLevel % 10;
		const lastTwoDigits = danLevel % 100;

		const suffix = lastTwoDigits >= 11 && lastTwoDigits <= 13 ? 'th' : suffixes[lastDigit] || 'th';
		return `${danLevel}${suffix} Dan`;
	}

	private replaceFirstTwoOccurrences(str: string, find: string, replace: string) {
		let count = 0;
		return str.replace(new RegExp(find, 'g'), (match) => {
			count++;
			return count <= 2 ? replace : match;
		});
	}
}
