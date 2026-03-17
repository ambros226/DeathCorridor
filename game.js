// 1. Nastavení plátna a kontextu
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 800;
canvas.height = 600;

// 2. Definice hráče
const player = {
    x: 50,
    y: 50,
    size: 30,
    color: "#00ff00",
    speed: 5
};

// Sledování stisknutých kláves
const keys = {};

window.addEventListener("keydown", (e) => keys[e.code] = true);
window.addEventListener("keyup", (e) => keys[e.code] = false);

// 3. Hlavní herní smyčka
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop); // Zajišťuje plynulých 60 FPS
}

// 4. Logika pohybu
function update() {
    if (keys["ArrowUp"] || keys["KeyW"])    player.y -= player.speed;
    if (keys["ArrowDown"] || keys["KeyS"] )  player.y += player.speed;
    if (keys["ArrowLeft"] || keys["KeyA"])  player.x -= player.speed;
    if (keys["ArrowRight"] || keys["KeyD"]) player.x += player.speed;

    // Omezení, aby hráč nevyjel z plátna
    if (player.x < 0) player.x = 0;
    if (player.y < 0) player.y = 0;
    if (player.x + player.size > canvas.width) player.x = canvas.width - player.size;
    if (player.y + player.size > canvas.height) player.y = canvas.height - player.size;
}

// 5. Vykreslování
function draw() {
    // Vymazání předchozího snímku
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Vykreslení hráče
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.size, player.size);
}

// Spuštění hry
gameLoop();
