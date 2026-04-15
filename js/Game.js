const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Cliente 
let cliente = {
  x: 50,
  y: 200,
  service: "corte"
};

// Profissional 
let player = {
  x: 400,
  y: 200,
  width: 50,
  height: 50,
  speed: 5
};

// Movimento
document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowUp") player.y -= player.speed;
  if (e.key === "ArrowDown") player.y += player.speed;
  if (e.key === "ArrowLeft") player.x -= player.speed;
  if (e.key === "ArrowRight") player.x += player.speed;
});


// Atendimento
function checkCollision() {
  if (
    player.x < cliente.x + 50 &&
    player.x + player.width > cliente.x &&
    player.y < cliente.y + 50 &&
    player.y + player.height > cliente.y
  ) {
    score++;
    document.getElementById("score").innerText = score;

    // Novo cliente
    cliente.x = Math.random() * 700;
    cliente.y = Math.random() * 400;
  }
}


// Loop do jogo
function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Cliente
  ctx.fillStyle = "pink";
  ctx.fillRect(cliente.x, cliente.y, 50, 50);

  // Jogador
  ctx.fillStyle = "cyan";
  ctx.fillRect(player.x, player.y, player.width, player.height);

  checkCollision();

  requestAnimationFrame(gameLoop);
}

gameLoop();