const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const path = require('path');

app.use(express.static(path.join(__dirname, '../public')));

// Game constants
const TICK_RATE = 1000 / 30; // 30 FPS
const MAP_WIDTH = 50; // In tiles
const MAP_HEIGHT = 50;
const TILE_SIZE = 64;

// Game State
const state = {
    players: {}, // id -> player object
    entities: {}, // id -> AI object
    resources: {}, // id -> resource object
    map: [] // 2D array of tile types (0=grass, 1=water)
};

// Generate Map
function generateMap() {
    for (let y = 0; y < MAP_HEIGHT; y++) {
        let row = [];
        for (let x = 0; x < MAP_WIDTH; x++) {
            // Simple map: water edges, grass center
            if (x === 0 || y === 0 || x === MAP_WIDTH - 1 || y === MAP_HEIGHT - 1) {
                row.push(1); // Water
            } else {
                row.push(0); // Grass
            }
        }
        state.map.push(row);
    }
}
generateMap();

// Generate AI Entities
function spawnEntities() {
    let entityId = 0;

    // Spawn Scientists (Hostile)
    for (let i = 0; i < 5; i++) {
        state.entities[`scientist_${entityId++}`] = {
            type: 'scientist',
            x: Math.random() * (MAP_WIDTH - 2) * TILE_SIZE + TILE_SIZE,
            y: Math.random() * (MAP_HEIGHT - 2) * TILE_SIZE + TILE_SIZE,
            health: 100,
            speed: 2,
            behavior: 'hostile',
            damage: 10,
            targetId: null
        };
    }

    // Spawn Animals
    const animals = ['wolf', 'pig', 'chicken'];
    for (let i = 0; i < 15; i++) {
        let animalType = animals[Math.floor(Math.random() * animals.length)];
        let isHostile = animalType === 'wolf';
        state.entities[`${animalType}_${entityId++}`] = {
            type: animalType,
            x: Math.random() * (MAP_WIDTH - 2) * TILE_SIZE + TILE_SIZE,
            y: Math.random() * (MAP_HEIGHT - 2) * TILE_SIZE + TILE_SIZE,
            health: isHostile ? 50 : 20,
            speed: isHostile ? 3 : 1,
            behavior: isHostile ? 'hostile' : 'passive',
            damage: isHostile ? 15 : 0,
            targetId: null,
            wanderTarget: null
        };
    }
}
spawnEntities();

// Generate initial resources
function spawnResources() {
    let resourceId = 0;
    // Spawn 50 trees
    for (let i = 0; i < 50; i++) {
        state.resources[`tree_${resourceId++}`] = {
            type: 'tree',
            x: Math.random() * (MAP_WIDTH - 2) * TILE_SIZE + TILE_SIZE,
            y: Math.random() * (MAP_HEIGHT - 2) * TILE_SIZE + TILE_SIZE,
            health: 100
        };
    }
    // Spawn 30 rocks
    for (let i = 0; i < 30; i++) {
        state.resources[`rock_${resourceId++}`] = {
            type: 'rock',
            x: Math.random() * (MAP_WIDTH - 2) * TILE_SIZE + TILE_SIZE,
            y: Math.random() * (MAP_HEIGHT - 2) * TILE_SIZE + TILE_SIZE,
            health: 100
        };
    }
}
spawnResources();

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Spawn player
    state.players[socket.id] = {
        id: socket.id,
        x: (MAP_WIDTH / 2) * TILE_SIZE,
        y: (MAP_HEIGHT / 2) * TILE_SIZE,
        health: 100,
        hunger: 100,
        inventory: { wood: 0, stone: 0, spear: 0, campfire: 0 },
        speed: 5
    };

    // Initial state to new player
    socket.emit('init', {
        id: socket.id,
        map: state.map,
        mapWidth: MAP_WIDTH,
        mapHeight: MAP_HEIGHT,
        tileSize: TILE_SIZE
    });

    // Handle movement input
    socket.on('move', (input) => {
        const player = state.players[socket.id];
        if (!player || player.health <= 0) return;

        let dx = 0;
        let dy = 0;

        if (input.up) dy -= player.speed;
        if (input.down) dy += player.speed;
        if (input.left) dx -= player.speed;
        if (input.right) dx += player.speed;

        // Normalize diagonal movement
        if (dx !== 0 && dy !== 0) {
            dx *= 0.7071;
            dy *= 0.7071;
        }

        player.x += dx;
        player.y += dy;

        // Basic map boundary collision (keep inside water edges)
        player.x = Math.max(TILE_SIZE, Math.min(player.x, (MAP_WIDTH - 1) * TILE_SIZE - 32));
        player.y = Math.max(TILE_SIZE, Math.min(player.y, (MAP_HEIGHT - 1) * TILE_SIZE - 32));
    });

    // Handle interaction (gathering/attacking)
    socket.on('interact', (data) => {
        const player = state.players[socket.id];
        if (!player || player.health <= 0) return;

        const interactDistance = 80;

        let interacted = false;

        // Check for enemies to attack first
        for (let entId in state.entities) {
            let ent = state.entities[entId];
            let dist = Math.hypot(ent.x - player.x, ent.y - player.y);

            if (dist < interactDistance) {
                // Base damage 10, Spear does 25
                let damage = player.inventory.spear > 0 ? 25 : 10;
                ent.health -= damage;

                if (ent.health <= 0) {
                    // Give loot based on entity
                    if (ent.type === 'pig' || ent.type === 'chicken' || ent.type === 'wolf') {
                         // could give meat/cloth, for simplicity we skip or give some basic res
                         player.inventory.wood += 1; // placeholder for meat
                    } else if (ent.type === 'scientist') {
                         player.inventory.stone += 5; // placeholder for scrap
                    }
                    delete state.entities[entId];
                }
                interacted = true;
                break;
            }
        }

        if (interacted) return;

        // Check for resources to gather
        for (let resId in state.resources) {
            let res = state.resources[resId];
            let dist = Math.hypot(res.x - player.x, res.y - player.y);

            if (dist < interactDistance) {
                // Base gather 10 damage to node, spear maybe faster? (Just simple 10 for now)
                res.health -= 10;

                // Give resources
                if (res.type === 'tree') player.inventory.wood += 2;
                if (res.type === 'rock') player.inventory.stone += 2;

                if (res.health <= 0) {
                    delete state.resources[resId];
                }
                break; // Only interact with one thing per click
            }
        }
    });

    // Handle crafting
    socket.on('craft', (itemType) => {
        const player = state.players[socket.id];
        if (!player || player.health <= 0) return;

        if (itemType === 'spear' && player.inventory.wood >= 10 && player.inventory.stone >= 5) {
            player.inventory.wood -= 10;
            player.inventory.stone -= 5;
            player.inventory.spear += 1;
        } else if (itemType === 'campfire' && player.inventory.wood >= 20) {
            player.inventory.wood -= 20;
            player.inventory.campfire += 1;
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        delete state.players[socket.id];
    });
});

let tickCount = 0;
// Game Loop
setInterval(() => {
    tickCount++;

    // Hunger depletion (every ~10 seconds assuming 30tps)
    if (tickCount % 300 === 0) {
        for (let id in state.players) {
            let p = state.players[id];
            if (p.health > 0) {
                p.hunger = Math.max(0, p.hunger - 1);
                if (p.hunger === 0) {
                    p.health = Math.max(0, p.health - 2); // Starvation damage
                }
            }
        }
    }

    // AI Logic (run every other tick to save some perf)
    if (tickCount % 2 === 0) {
        for (let entId in state.entities) {
            let ent = state.entities[entId];

            if (ent.behavior === 'hostile') {
                // Find nearest player
                let nearestDist = 300; // Agro range
                let nearestPlayer = null;

                for (let pId in state.players) {
                    let p = state.players[pId];
                    if (p.health > 0) {
                        let dist = Math.hypot(p.x - ent.x, p.y - ent.y);
                        if (dist < nearestDist) {
                            nearestDist = dist;
                            nearestPlayer = p;
                        }
                    }
                }

                if (nearestPlayer) {
                    // Move towards player
                    let dx = nearestPlayer.x - ent.x;
                    let dy = nearestPlayer.y - ent.y;
                    let len = Math.hypot(dx, dy);

                    if (len > 32) {
                        ent.x += (dx / len) * ent.speed;
                        ent.y += (dy / len) * ent.speed;
                    } else if (tickCount % 30 === 0) { // Attack once per second
                        nearestPlayer.health -= ent.damage;
                    }
                } else {
                    // Wander randomly if no target
                    if (Math.random() < 0.05) {
                        ent.wanderTarget = {
                            x: ent.x + (Math.random() - 0.5) * 100,
                            y: ent.y + (Math.random() - 0.5) * 100
                        };
                    }
                }
            }

            // Passive wandering behavior
            if (ent.behavior === 'passive' || (ent.behavior === 'hostile' && ent.wanderTarget)) {
                if (Math.random() < 0.02 && !ent.wanderTarget) {
                    ent.wanderTarget = {
                        x: ent.x + (Math.random() - 0.5) * 200,
                        y: ent.y + (Math.random() - 0.5) * 200
                    };
                }

                if (ent.wanderTarget) {
                    let dx = ent.wanderTarget.x - ent.x;
                    let dy = ent.wanderTarget.y - ent.y;
                    let len = Math.hypot(dx, dy);

                    if (len > 5) {
                        ent.x += (dx / len) * ent.speed;
                        ent.y += (dy / len) * ent.speed;
                    } else {
                        ent.wanderTarget = null;
                    }
                }
            }

            // Clamp to map
            ent.x = Math.max(TILE_SIZE, Math.min(ent.x, (MAP_WIDTH - 1) * TILE_SIZE - 32));
            ent.y = Math.max(TILE_SIZE, Math.min(ent.y, (MAP_HEIGHT - 1) * TILE_SIZE - 32));
        }
    }

    // Broadcast state to all clients
    io.emit('state', {
        players: state.players,
        entities: state.entities,
        resources: state.resources
    });
}, TICK_RATE);

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
