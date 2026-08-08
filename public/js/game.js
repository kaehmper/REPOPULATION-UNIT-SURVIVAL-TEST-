let socket = null;

let mapData = null;
let myId = null;

const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    parent: 'game-container',
    pixelArt: true,
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);

let cursors;
let playerSprites = {};
let entitySprites = {};
let resourceSprites = {};

// To handle camera follow
let cameraTarget = null;
let gameScene = null;

function preload() {
    // Entities
    this.load.spritesheet('player', 'assets/player.png', { frameWidth: 64, frameHeight: 64 });
    this.load.image('scientist', 'assets/scientist.png');
    this.load.image('wolf', 'assets/wolf.png');
    this.load.image('pig', 'assets/pig.png');
    this.load.image('chicken', 'assets/chicken.png');

    // Resources
    this.load.image('tree', 'assets/tree.png');
    this.load.image('rock', 'assets/rock.png');

    // Tiles
    this.load.image('grass', 'assets/grass.png');
    this.load.image('water', 'assets/water.png');
}

function create() {
    gameScene = this;
    cursors = this.input.keyboard.createCursorKeys();

    this.keys = {
        W: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        A: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        S: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        D: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
    };

    socket = io();

    // Animations
    this.anims.create({
        key: 'player-idle',
        frames: this.anims.generateFrameNumbers('player', { start: 0, end: 0 }),
        frameRate: 1,
        repeat: -1
    });
    this.anims.create({
        key: 'player-walk',
        frames: this.anims.generateFrameNumbers('player', { start: 1, end: 4 }),
        frameRate: 8,
        repeat: -1
    });

    // Handle clicks for interaction
    this.input.on('pointerdown', function (pointer) {
        socket.emit('interact', { x: pointer.worldX, y: pointer.worldY });
    });

    socket.on('init', (data) => {
        myId = data.id;
        mapData = data;

        // Render Map
        for (let y = 0; y < data.mapHeight; y++) {
            for (let x = 0; x < data.mapWidth; x++) {
                let tileType = data.map[y][x];
                let key = tileType === 1 ? 'water' : 'grass';
                this.add.image(x * data.tileSize + data.tileSize/2, y * data.tileSize + data.tileSize/2, key);
            }
        }

        // Set world bounds
        this.cameras.main.setBounds(0, 0, data.mapWidth * data.tileSize, data.mapHeight * data.tileSize);
    });

    socket.on('state', (state) => {
        if (!mapData) return; // Wait for init

        // --- UPDATE PLAYERS ---
        const serverPlayerIds = Object.keys(state.players);

        // Remove disconnected players
        for (let id in playerSprites) {
            if (!serverPlayerIds.includes(id)) {
                playerSprites[id].destroy();
                delete playerSprites[id];
            }
        }

        // Update or add players
        for (let id of serverPlayerIds) {
            let pData = state.players[id];

            if (!playerSprites[id]) {
                playerSprites[id] = gameScene.add.sprite(pData.x, pData.y, 'player');
                playerSprites[id].play('player-idle');

                if (id === myId) {
                    cameraTarget = playerSprites[id];
                    gameScene.cameras.main.startFollow(cameraTarget);
                }
            } else {
                // Determine movement for animation
                let dx = pData.x - playerSprites[id].x;
                let dy = pData.y - playerSprites[id].y;
                let isMoving = Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5;

                // Interpolation could go here, for now just set position
                playerSprites[id].setPosition(pData.x, pData.y);

                if (isMoving) {
                    if (playerSprites[id].anims.currentAnim?.key !== 'player-walk') {
                        playerSprites[id].play('player-walk');
                    }
                    if (dx > 0) {
                        playerSprites[id].setFlipX(false);
                    } else if (dx < 0) {
                        playerSprites[id].setFlipX(true);
                    }
                } else {
                    if (playerSprites[id].anims.currentAnim?.key !== 'player-idle') {
                        playerSprites[id].play('player-idle');
                    }
                }
            }

            // Hide dead players
            playerSprites[id].setVisible(pData.health > 0);

            // Update UI for local player
            if (id === myId) {
                // Update stats
                document.getElementById('health-val').innerText = pData.health;
                document.getElementById('health-bar').style.width = pData.health + '%';

                document.getElementById('hunger-val').innerText = pData.hunger;
                document.getElementById('hunger-bar').style.width = pData.hunger + '%';

                // Update inventory
                document.getElementById('inv-wood-count').innerText = pData.inventory.wood;
                document.getElementById('inv-stone-count').innerText = pData.inventory.stone;
                document.getElementById('inv-spear-count').innerText = pData.inventory.spear;
                document.getElementById('inv-campfire-count').innerText = pData.inventory.campfire;
            }
        }

        // --- UPDATE ENTITIES ---
        const serverEntityIds = Object.keys(state.entities);
        for (let id in entitySprites) {
            if (!serverEntityIds.includes(id)) {
                entitySprites[id].destroy();
                delete entitySprites[id];
            }
        }
        for (let id of serverEntityIds) {
            let eData = state.entities[id];
            if (!entitySprites[id]) {
                entitySprites[id] = gameScene.add.sprite(eData.x, eData.y, eData.type);
            } else {
                entitySprites[id].setPosition(eData.x, eData.y);
            }
        }

        // --- UPDATE RESOURCES ---
        const serverResourceIds = Object.keys(state.resources);
        for (let id in resourceSprites) {
            if (!serverResourceIds.includes(id)) {
                resourceSprites[id].destroy();
                delete resourceSprites[id];
            }
        }
        for (let id of serverResourceIds) {
            let rData = state.resources[id];
            if (!resourceSprites[id]) {
                resourceSprites[id] = gameScene.add.sprite(rData.x, rData.y, rData.type);
            }
        }
    });
}

function update() {
    if (!myId) return;

    // Send input to server
    let input = {
        up: cursors.up.isDown || this.keys.W.isDown,
        down: cursors.down.isDown || this.keys.S.isDown,
        left: cursors.left.isDown || this.keys.A.isDown,
        right: cursors.right.isDown || this.keys.D.isDown
    };

    if (input.up || input.down || input.left || input.right) {
        socket.emit('move', input);
    }
}

// Global craft function for HTML buttons
window.craft = function(item) {
    socket.emit('craft', item);
};

window.addEventListener('resize', () => {
    game.scale.resize(window.innerWidth, window.innerHeight);
});

// UI Toggle Logic
document.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
        e.preventDefault(); // Prevent default tab navigation
        const invScreen = document.getElementById('inventory-screen');
        if (invScreen.style.display === 'none') {
            invScreen.style.display = 'flex';
        } else {
            invScreen.style.display = 'none';
        }
    }
});
