const MAZE_WIDTH = 21;
const MAZE_HEIGHT = 21;
const TILE_SIZE = 200;
const WIN_SIZE = 50;
const PLAYER_SIZE = 100;

const WORLD_WIDTH = MAZE_WIDTH * TILE_SIZE;
const WORLD_HEIGHT = MAZE_HEIGHT * TILE_SIZE;

const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    parent: 'game-container',
    backgroundColor: '#050505',
    physics: {
        default: 'arcade',
        arcade: {debug: false}
    },
    scene: {preload, create, update}
};

let player, keys, walls, goal, darkLayer, visionMask, orangeGlow;

function preload() {
    this.load.image('wall', 'storage/layout/wall.png');
    this.load.image('floor', 'storage/layout/floor.png');
    this.load.image('win_statue', 'storage/layout/win_statue.png');

    this.load.spritesheet('p_up', 'storage/player/up.png', {
        frameWidth: 256,
        frameHeight: 256
    });
    this.load.spritesheet('p_right', 'storage/player/right.png', {
        frameWidth: 256,
        frameHeight: 256
    });
    this.load.spritesheet('p_down', 'storage/player/down.png', {
        frameWidth: 256,
        frameHeight: 256
    });
    this.load.image('p_idle', 'storage/player/idle.png');
}

function create() {
    const maze = Array.from({length: MAZE_HEIGHT}, () => Array(MAZE_WIDTH).fill(1));

    function walk(x, y) {
        maze[y][x] = 0;
        let dirs = [[0, 2], [0, -2], [2, 0], [-2, 0]].sort(() => Math.random() - 0.5);
        for (let [dx, dy] of dirs) {
            let nx = x + dx, ny = y + dy;
            if (nx > 0 && nx < MAZE_WIDTH - 1 && ny > 0 && ny < MAZE_HEIGHT - 1 && maze[ny][nx] === 1) {
                maze[y + dy / 2][x + dx / 2] = 0;
                walk(nx, ny);
            }
        }
    }

    walk(1, 1);

    this.anims.create({
        key: 'walk_up',
        frames: this.anims.generateFrameNumbers('p_up', {start: 0, end: 3}),
        frameRate: 10,
        repeat: -1
    });
    this.anims.create({
        key: 'walk_side',
        frames: this.anims.generateFrameNumbers('p_right', {start: 0, end: 3}),
        frameRate: 10,
        repeat: -1
    });
    this.anims.create({
        key: 'walk_down',
        frames: this.anims.generateFrameNumbers('p_down', {start: 0, end: 3}),
        frameRate: 10,
        repeat: -1
    });


    for (let y = 0; y < MAZE_HEIGHT; y++) {
        for (let x = 0; x < MAZE_WIDTH; x++) {
            if (maze[y][x] === 0) {
                let f = this.add.image(x * TILE_SIZE, y * TILE_SIZE, 'floor').setOrigin(0);
                f.setDisplaySize(TILE_SIZE, TILE_SIZE);
                f.setTint(0x666666);
                f.setDepth(0);
            }
        }
    }

    walls = this.physics.add.staticGroup();
    for (let y = 0; y < MAZE_HEIGHT; y++) {
        for (let x = 0; x < MAZE_WIDTH; x++) {
            if (maze[y][x] === 1) {
                let w = walls.create(x * TILE_SIZE, y * TILE_SIZE, 'wall').setOrigin(0);
                w.setDisplaySize(TILE_SIZE, TILE_SIZE);
                w.setDepth(10);
                w.setTint(0x666666);
                w.refreshBody();
            }
        }
    }

    goal = this.physics.add.sprite((MAZE_WIDTH - 2) * TILE_SIZE + 75, (MAZE_HEIGHT - 2) * TILE_SIZE + 75, 'win_statue').setOrigin(0);
    goal.setTint(0x666666);
    goal.setDisplaySize(100, 100);
    goal.setDepth(5);

    player = this.physics.add.sprite(TILE_SIZE + 100, TILE_SIZE + 100, 'p_idle').setOrigin(0.5);
    player.setDepth(20);
    player.setDisplaySize(PLAYER_SIZE, PLAYER_SIZE);

    const boxWidth = player.body.width * 0.6;
    const boxHeight = player.body.height * 0.8;

    player.body.setSize(boxWidth, boxHeight);

    player.body.setOffset(
        (player.width - boxWidth) / 2,
        (player.height - boxHeight) / 2
    );

    this.physics.add.collider(player, walls);
    this.physics.add.overlap(player, goal, () => {
        showWinScreen(this);
    }, null, this);

    orangeGlow = this.add.graphics();
    const glowRadius = 350;
    const glowSteps = 40;
    for (let i = 0; i < glowSteps; i++) {
        const radius = glowRadius * (1 - i / glowSteps);
        const alpha = (i / glowSteps) * 0.05;
        orangeGlow.fillStyle(0xffaa00, alpha);
        orangeGlow.fillCircle(0, 0, radius);
    }
    orangeGlow.setDepth(30);

    darkLayer = this.add.graphics();
    darkLayer.fillStyle(0x000000, 1);
    darkLayer.fillRect(0, 0, window.innerWidth, window.innerHeight);
    darkLayer.setDepth(100);
    darkLayer.setScrollFactor(0);
    darkLayer.setAlpha(0.85);

    visionMask = this.make.graphics({x: 0, y: 0, add: false});
    const maskRadius = 250;
    const maskSteps = 60;
    for (let i = 0; i < maskSteps; i++) {
        const radius = maskRadius * (1 - i / maskSteps);
        const alpha = (i / maskSteps);
        visionMask.fillStyle(0xffffff, alpha);
        visionMask.fillCircle(0, 0, radius);
    }

    const mask = visionMask.createGeometryMask();
    mask.setInvertAlpha();
    darkLayer.setMask(mask);

    this.cameras.main.startFollow(player, true, 0.1, 0.1);
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    keys = this.input.keyboard.addKeys({up: 'W', down: 'S', left: 'A', right: 'D'});
}

function update() {
    if (!player || !player.body) return;
    player.setVelocity(0);
    const speed = 500;
    let moving = false;

    if (keys.left.isDown) {
        player.setVelocityX(-speed);
        player.play('walk_side', true);
        player.flipX = true;
        moving = true;
    } else if (keys.right.isDown) {
        player.setVelocityX(speed);
        player.play('walk_side', true);
        player.flipX = false;
        moving = true;
    }

    if (keys.up.isDown) {
        player.setVelocityY(-speed);
        if (!moving) player.play('walk_up', true);
        moving = true;
    } else if (keys.down.isDown) {
        player.setVelocityY(speed);
        if (!moving) player.play('walk_down', true);
        moving = true;
    }

    if (!moving) {
        player.stop();
        player.setTexture('p_idle');
    }

    player.setDisplaySize(PLAYER_SIZE, PLAYER_SIZE);

    if (visionMask) {
        visionMask.x = player.x;
        visionMask.y = player.y;
    }

    if (orangeGlow) {
        orangeGlow.x = player.x;
        orangeGlow.y = player.y;
    }
}

document.getElementById('start-btn').addEventListener('click', function (e) {
    e.preventDefault();
    document.getElementById('menu').style.display = 'none';
    new Phaser.Game(config);
});

function showWinScreen(scene) {
    scene.physics.pause();
    player.setTint(0x00ff00); // Hráč vítězně zezelená

    let bg = scene.add.graphics();
    bg.fillStyle(0x000000, 0.8);
    bg.fillRect(0, 0, window.innerWidth, window.innerHeight);
    bg.setScrollFactor(0);
    bg.setDepth(200);

    let winText = scene.add.text(window.innerWidth / 2, window.innerHeight / 2 - 50, 'You WON', {
        fontFamily: '"Jacquard 12"',
        fontSize: '80px',
        fill: '#8B0000'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(201);

    let restartBtn = scene.add.text(window.innerWidth / 2, window.innerHeight / 2 + 60, 'HRÁT ZNOVU', {
        fontFamily: '"Jacquard 12"',
        fontSize: '40px',
        fill: '#ffffff',
        backgroundColor: '#4a0000',
        padding: {x: 20, y: 10}
    }).setOrigin(0.5).setScrollFactor(0).setDepth(201).setInteractive({useHandCursor: true});

    restartBtn.on('pointerover', () => restartBtn.setStyle({fill: '#ff0000'}));
    restartBtn.on('pointerout', () => restartBtn.setStyle({fill: '#ffffff'}));

    restartBtn.on('pointerdown', () => {
        location.reload();
    });
}