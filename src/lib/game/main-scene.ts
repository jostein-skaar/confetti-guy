import { adjustForPixelRatio } from '@jostein-skaar/common-game';
import Phaser, { GameObjects } from 'phaser';

export class MainScene extends Phaser.Scene {
	width!: number;
	height!: number;
	cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
	hero!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
	hurtTimeline!: Phaser.Time.Timeline;
	healthBar!: GameObjects.Rectangle;
	healthBarText!: GameObjects.Text;
	rewardGroup!: Phaser.Physics.Arcade.Group;
	obstaclesGroup!: Phaser.Physics.Arcade.Group;
	emitter!: GameObjects.Particles.ParticleEmitter;
	currentHitObstacle?: Phaser.Types.Physics.Arcade.SpriteWithStaticBody;
	scoreText!: GameObjects.Text;

	settings = {
		healthMax: 3000,
		healthForReward: 500,
		healthForObstacle: -1000,
		healthPerUpdate: 4,
		groundHeight: adjustForPixelRatio(50),
		heroGravity: adjustForPixelRatio(550),
		jumpVelocity: adjustForPixelRatio(600),
		velocity: adjustForPixelRatio(200),
		distanceBetweenObstacles: [adjustForPixelRatio(500), adjustForPixelRatio(700)],
		distanceBetweenRewards: [adjustForPixelRatio(300), adjustForPixelRatio(500)]
	};

	health = this.settings.healthMax;
	velocity = this.settings.velocity;
	timeSinceStart = 0;
	score = 0;
	hasLost = false;

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
		const healthBarContainer = this.add
			.rectangle(
				this.scale.width / 2,
				adjustForPixelRatio(26),
				adjustForPixelRatio(250),
				adjustForPixelRatio(30),
				0xffffff
			)
			.setStrokeStyle(adjustForPixelRatio(2), 0x000000)
			.setDepth(1);
		this.healthBar = this.add
			.rectangle(
				healthBarContainer.x - (healthBarContainer.width - healthBarContainer.lineWidth) / 2,
				healthBarContainer.y,
				healthBarContainer.width - healthBarContainer.lineWidth,
				healthBarContainer.height - healthBarContainer.lineWidth,
				0xff00ff
			)
			.setDepth(1)
			.setOrigin(0, 0.5);
		this.healthBarText = this.add
			.text(healthBarContainer.x, adjustForPixelRatio(16), 'exuberance', {
				fontSize: `${adjustForPixelRatio(24)}px`,
				color: '#000'
			})
			.setDepth(1)
			.setOrigin(0.5, 0);

		this.scoreText = this.add
			.text(
				this.scale.width / 2 - (healthBarContainer.width - healthBarContainer.lineWidth) / 2,
				adjustForPixelRatio(50),
				'score: 0',
				{
					fontSize: adjustForPixelRatio(24) + 'px',
					color: '#fff'
				}
			)
			.setDepth(1);

		this.cursors = this.input.keyboard!.createCursorKeys();
		this.cursors.space.onDown = () => {
			this.performJump();
		};
		this.input.on('pointerdown', () => {
			this.performJump();
		});

		const ground = this.add.rectangle(
			this.scale.width / 2,
			this.scale.height - this.settings.groundHeight / 2,
			this.scale.width,
			this.settings.groundHeight,
			0x828282
		);
		this.physics.add.existing(ground, true);

		this.rewardGroup = this.physics.add.group();
		let previousRewardX = 0;
		for (let i = 0; i < 5; i++) {
			const reward = this.rewardGroup.create(0, 0, 'sprites', 'rewards-001.png');
			previousRewardX = this.positionReward(reward, previousRewardX);
		}

		this.obstaclesGroup = this.physics.add.group();

		let previousX = 0;
		for (let i = 0; i < 2; i++) {
			const obstacle = this.obstaclesGroup.create(
				0,
				0,
				'sprites',
				obstacles[Phaser.Math.Between(0, obstacles.length - 1)]
			);
			obstacle.setImmovable(true);
			previousX = this.positionObstacle(obstacle, previousX);
		}

		this.hero = this.physics.add.sprite(0, 0, 'sprites', 'hero-001.png');
		this.resetHeroPosition();
		this.hero.setGravityY(this.settings.heroGravity);
		this.hero.setCollideWorldBounds(true);
		this.hero.anims.create({
			key: 'run',
			frames: [
				{ key: 'sprites', frame: 'hero-001.png' },
				{ key: 'sprites', frame: 'hero-002.png' }
			],
			frameRate: 10,
			repeat: -1
		});
		this.hero.anims.play('run', true);
		this.hero.anims.create({
			key: 'jump',
			frames: [
				{ key: 'sprites', frame: 'hero-003.png' },
				{ key: 'sprites', frame: 'hero-004.png' }
			],
			frameRate: 2,
			repeat: -1
		});

		this.hurtTimeline = this.add.timeline({
			at: 0,
			tween: {
				targets: this.hero,
				scale: 0.8,
				ease: 'Power0',
				duration: 40,
				yoyo: true,
				repeat: 10,
				onActive: () => {
					this.hero.setTint(0xff0000);
					// this.velocity = 0;
				},
				onComplete: () => {
					this.hero.setTint(undefined);
					this.currentHitObstacle = undefined;
					// this.velocity = this.settings.velocity;
				}
			}
		});

		this.physics.add.collider(this.hero, ground);

		this.physics.add.overlap(
			this.hero,
			this.rewardGroup,
			// @ts-expect-error(TODO: Need to find out how to fix this)
			(_hero, reward: Phaser.Types.Physics.Arcade.SpriteWithStaticBody) => {
				this.collectReward(reward);
				this.positionReward(reward, this.findFurthestReward());
			}
		);

		this.physics.add.overlap(
			this.hero,
			this.obstaclesGroup,
			// @ts-expect-error(TODO: Need to find out how to fix this)
			(_hero, obstacle: Phaser.Types.Physics.Arcade.SpriteWithStaticBody) => {
				if (this.currentHitObstacle === obstacle) {
					return;
				}
				this.currentHitObstacle = obstacle;
				this.punish();
			}
		);

		this.emitter = this.add.particles(0, 0, 'sprites', {
			frame: 'particle-heart-001.png',
			scale: { start: 1.5, end: 0.5 },
			speed: { min: 10, max: 100 },
			lifespan: 800,
			quantity: 11,
			active: false
		});
	}

	update(_time: number, delta: number): void {
		this.timeSinceStart += delta;
		this.repositionObstacles();
		this.repositionRewards();

		this.health -= this.settings.healthPerUpdate;
		this.drawHealthBar();

		if (this.health <= 0) {
			this.lose();
		}

		if (this.isHeroBelowGround()) {
			this.resetHeroPosition();
		}
		if (this.hero.body.onFloor()) {
			this.hero.anims.play('run', true);
		} else {
			this.hero.anims.play('jump', true);
		}

		this.score = this.timeSinceStart / 1000;
		this.scoreText.setText(`score: ${this.score.toFixed(2)}`);
	}

	private drawHealthBar() {
		const percent = Math.max(Math.min(this.health / this.settings.healthMax, 1), 0);
		this.healthBar.setScale(percent, 1);

		if (percent < 0.2) {
			this.healthBar.setFillStyle(0xf21405);
		} else if (percent < 0.5) {
			this.healthBar.setFillStyle(0xf2de05);
		} else {
			this.healthBar.setFillStyle(0x00fa00);
		}
	}

	private positionReward(
		reward: Phaser.Types.Physics.Arcade.SpriteWithStaticBody,
		previousX: number
	): number {
		const extraDistance = this.timeSinceStart / 100;

		const x =
			previousX +
			Phaser.Math.Between(
				this.settings.distanceBetweenRewards[0] + extraDistance,
				this.settings.distanceBetweenRewards[1] + extraDistance
			);
		const y = Phaser.Math.Between(
			adjustForPixelRatio(100),
			this.scale.height - reward.height / 2 - this.settings.groundHeight - adjustForPixelRatio(100)
		);
		reward.setPosition(x, y);
		reward.setVelocityX(-this.velocity);

		return x;
	}

	private positionObstacle(
		obstacle: Phaser.Types.Physics.Arcade.SpriteWithStaticBody,
		previousX: number
	): number {
		const x =
			previousX +
			Phaser.Math.Between(
				this.settings.distanceBetweenObstacles[0],
				this.settings.distanceBetweenObstacles[1]
			);
		const y = this.scale.height - obstacle.height / 2 - this.settings.groundHeight;
		obstacle.setPosition(x, y);
		obstacle.setVelocityX(-this.velocity);

		return x;
	}

	private repositionObstacles() {
		this.obstaclesGroup.children.iterate(
			// @ts-expect-error(TODO: Need to find out how to fix this)
			(obstacle: Phaser.Types.Physics.Arcade.SpriteWithStaticBody) => {
				if (obstacle.x < 0 - obstacle.width / 2) {
					this.positionObstacle(obstacle, this.findFurthestObstacle());
					let newFrame = obstacles[Phaser.Math.Between(0, obstacles.length - 1)];
					while (newFrame === obstacle.frame.name) {
						newFrame = obstacles[Phaser.Math.Between(0, obstacles.length - 1)];
					}
					obstacle.setFrame(newFrame);
				}
			}
		);
	}

	private repositionRewards() {
		this.rewardGroup.children.iterate(
			// @ts-expect-error(TODO: Need to find out how to fix this)
			(reward: Phaser.Types.Physics.Arcade.SpriteWithStaticBody) => {
				if (reward.x < 0 - reward.width / 2) {
					this.positionReward(reward, this.findFurthestReward());
				}
			}
		);
	}

	private findFurthestReward(): number {
		let furthestX = 0;
		this.rewardGroup.children.iterate(
			// @ts-expect-error(TODO: Need to find out how to fix this)
			(reward: Phaser.Types.Physics.Arcade.SpriteWithStaticBody) => {
				if (reward.x > furthestX) {
					furthestX = reward.x;
				}
			}
		);
		return furthestX;
	}

	private findFurthestObstacle(): number {
		let furthestX = 0;
		this.obstaclesGroup.children.iterate(
			// @ts-expect-error(TODO: Need to find out how to fix this)
			(obstacle: Phaser.Types.Physics.Arcade.SpriteWithStaticBody) => {
				if (obstacle.x > furthestX) {
					furthestX = obstacle.x;
				}
			}
		);
		return furthestX;
	}

	private collectReward(reward: Phaser.Types.Physics.Arcade.SpriteWithStaticBody) {
		const bounds = reward.getBounds();
		this.emitter.setPosition(bounds.left, bounds.top);
		this.emitter.active = true;
		this.emitter.explode();
		this.health += this.settings.healthForReward;
		if (this.health > this.settings.healthMax) {
			this.health = this.settings.healthMax;
		}
	}

	private punish() {
		this.health += this.settings.healthForObstacle;
		this.hurtTimeline.play();
		if (this.health < 0) {
			this.health = 0;
			this.lose();
		}
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
