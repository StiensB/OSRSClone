import { TILE_SIZE } from './utils.js';

const tileColors = {
  grass: '#3f7f3a', dirt: '#8a6a3f', water: '#2f588c', rock: '#55585a', wood: '#6b4f31', wall: '#7b7a70', sand: '#9f8e5c'
};

export function renderGame(ctx, state) {
  const { world, camera, player, npcs, nodes, groundItems, destination, debug } = state;
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.imageSmoothingEnabled = false;

  const sx = Math.floor(camera.x / TILE_SIZE);
  const sy = Math.floor(camera.y / TILE_SIZE);
  const ex = sx + Math.ceil(ctx.canvas.width / TILE_SIZE) + 1;
  const ey = sy + Math.ceil(ctx.canvas.height / TILE_SIZE) + 1;

  for (let y = sy; y < ey; y++) for (let x = sx; x < ex; x++) {
    const t = world.tiles[y]?.[x];
    if (!t) continue;
    const px = x * TILE_SIZE - camera.x; const py = y * TILE_SIZE - camera.y;
    drawTile(ctx, t, x, y, px, py);
  }

  drawObjects(ctx, nodes, camera);
  drawGroundItems(ctx, groundItems, camera);
  drawNpcs(ctx, npcs, camera);
  drawPlayer(ctx, player, camera);
  if (destination) drawDestination(ctx, destination, camera);
  applyVignette(ctx);
  if (debug) drawGrid(ctx, camera, world.width, world.height);
}

function drawTile(ctx, t, x, y, px, py) {
  const base = tileColors[t] || '#f0f';
  ctx.fillStyle = base;
  ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

  const v = ((x * 17 + y * 31) % 7) / 7;
  ctx.fillStyle = `rgba(255,255,255,${0.03 + v * 0.03})`;
  ctx.fillRect(px + 1, py + 1, TILE_SIZE - 2, 2);

  if (t === 'grass') {
    ctx.fillStyle = 'rgba(20,60,18,.22)';
    for (let i = 0; i < 4; i++) {
      const ox = (i * 7 + x * 3 + y * 5) % (TILE_SIZE - 2);
      const oy = (i * 5 + x * 2 + y * 7) % (TILE_SIZE - 2);
      ctx.fillRect(px + ox, py + oy, 2, 2);
    }
  } else if (t === 'water') {
    ctx.fillStyle = 'rgba(255,255,255,.12)';
    ctx.fillRect(px + 2, py + (x + y) % 8, TILE_SIZE - 4, 2);
    ctx.fillStyle = 'rgba(11,35,66,.2)';
    ctx.fillRect(px, py + TILE_SIZE - 3, TILE_SIZE, 3);
  } else if (t === 'dirt') {
    ctx.fillStyle = 'rgba(61,39,17,.20)';
    ctx.fillRect(px + ((x + y) % 4), py + 5, TILE_SIZE - 8, 2);
  } else if (t === 'wood') {
    ctx.fillStyle = 'rgba(33,20,9,.28)';
    for (let r = 4; r < TILE_SIZE; r += 6) ctx.fillRect(px + 1, py + r, TILE_SIZE - 2, 1);
  } else if (t === 'rock') {
    ctx.fillStyle = 'rgba(28,30,31,.25)';
    ctx.fillRect(px + 3, py + 3, TILE_SIZE - 6, TILE_SIZE - 6);
  }
}

function drawPlayer(ctx, p, camera) {
  const x = p.x * TILE_SIZE - camera.x + 3;
  const y = p.y * TILE_SIZE - camera.y + 2;
  const bob = Math.sin(performance.now() / 240) * 0.8;

  drawShadow(ctx, x + 3, y + 22, 18, 5);

  // OSRS-inspired chunky silhouette: outline first
  pxRect(ctx, x + 6, y + 2 + bob, 10, 9, '#241812'); // head outline
  pxRect(ctx, x + 4, y + 11 + bob, 14, 9, '#241812'); // torso outline
  pxRect(ctx, x + 4, y + 20 + bob, 6, 6, '#241812');
  pxRect(ctx, x + 12, y + 20 + bob, 6, 6, '#241812');

  pxRect(ctx, x + 7, y + 3 + bob, 8, 7, '#edcc9b');
  pxRect(ctx, x + 5, y + 12 + bob, 12, 7, '#496f9f');
  pxRect(ctx, x + 5, y + 20 + bob, 5, 5, '#384f78');
  pxRect(ctx, x + 12, y + 20 + bob, 5, 5, '#384f78');

  // face details + cape hint
  pxRect(ctx, x + 8, y + 5 + bob, 1, 1, '#2a2a2a');
  pxRect(ctx, x + 13, y + 5 + bob, 1, 1, '#2a2a2a');
  pxRect(ctx, x + 3, y + 11 + bob, 2, 9, '#553254');
}

function drawNpcs(ctx, list, camera) {
  const t = performance.now();
  for (const n of list) if (!n.dead) {
    const x = n.x * TILE_SIZE - camera.x + 4;
    const y = n.y * TILE_SIZE - camera.y + 4 + Math.sin((t + n.x * 17) / 300) * 0.7;

    if (n.kind === 'bog_raider') drawRaider(ctx, x, y);
    else drawPecker(ctx, x, y);
  }
}

function drawRaider(ctx, x, y) {
  drawShadow(ctx, x + 3, y + 21, 17, 5);
  pxRect(ctx, x + 6, y + 2, 9, 8, '#241812');
  pxRect(ctx, x + 5, y + 10, 12, 10, '#241812');
  pxRect(ctx, x + 4, y + 20, 5, 6, '#241812');
  pxRect(ctx, x + 13, y + 20, 5, 6, '#241812');
  pxRect(ctx, x + 7, y + 3, 7, 6, '#b89579');
  pxRect(ctx, x + 6, y + 11, 10, 8, '#7c4747');
  pxRect(ctx, x + 4, y + 12, 2, 6, '#5f3434');
  pxRect(ctx, x + 16, y + 12, 2, 6, '#5f3434');
  pxRect(ctx, x + 4, y + 21, 4, 4, '#513030');
  pxRect(ctx, x + 14, y + 21, 4, 4, '#513030');
}

function drawPecker(ctx, x, y) {
  drawShadow(ctx, x + 5, y + 19, 14, 4);
  pxRect(ctx, x + 6, y + 8, 12, 8, '#8e8459');
  pxRect(ctx, x + 8, y + 5, 8, 5, '#dad29e');
  pxRect(ctx, x + 17, y + 8, 3, 3, '#c88e39'); // beak
  pxRect(ctx, x + 8, y + 16, 2, 7, '#6f5a34');
  pxRect(ctx, x + 14, y + 16, 2, 7, '#6f5a34');
  pxRect(ctx, x + 9, y + 6, 1, 1, '#2b2b2b');
}

function drawObjects(ctx, nodes, camera) {
  for (const n of nodes) if (!n.depleted) {
    const x = n.x * TILE_SIZE - camera.x;
    const y = n.y * TILE_SIZE - camera.y;
    if (n.type === 'tree') {
      drawShadow(ctx, x + 6, y + 23, 16, 4);
      pxRect(ctx, x + 11, y + 13, 6, 13, '#4a2f18');
      pxRect(ctx, x + 7, y + 8, 14, 10, '#2f7f39');
      pxRect(ctx, x + 5, y + 10, 4, 5, '#2a6f32');
      pxRect(ctx, x + 19, y + 10, 4, 5, '#2a6f32');
      pxRect(ctx, x + 10, y + 7, 5, 3, '#5da562');
    }
    if (n.type === 'rock') {
      drawShadow(ctx, x + 6, y + 23, 16, 4);
      pxRect(ctx, x + 7, y + 10, 14, 12, '#777');
      pxRect(ctx, x + 9, y + 12, 4, 3, '#9da2a6');
      pxRect(ctx, x + 14, y + 15, 5, 2, '#616468');
    }
    if (n.type === 'fish') {
      pxRect(ctx, x + 5, y + 18, 17, 2, 'rgba(0,0,0,.14)');
      pxRect(ctx, x + 6, y + 14, 16, 4, '#b9d8ff');
      pxRect(ctx, x + 8, y + 15, 5, 1, '#edf8ff');
      pxRect(ctx, x + 16, y + 15, 3, 1, '#7caad7');
    }
    if (n.type === 'bank') {
      pxRect(ctx, x + 3, y + 3, 22, 22, '#5d4928');
      pxRect(ctx, x + 5, y + 6, 18, 16, '#c5ae79');
      pxRect(ctx, x + 6, y + 7, 16, 4, '#8f753f');
      pxRect(ctx, x + 12, y + 13, 4, 8, '#6d5430');
    }
  }
}

function drawGroundItems(ctx, items, camera) {
  for (const g of items) {
    const x = g.x * TILE_SIZE - camera.x + 10;
    const y = g.y * TILE_SIZE - camera.y + 10;
    drawShadow(ctx, x, y + 6, 8, 2);
    pxRect(ctx, x, y, 7, 7, '#ffd85f');
    pxRect(ctx, x + 2, y + 2, 2, 2, '#fff2a2');
  }
}

function drawShadow(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(0,0,0,.22)';
  ctx.fillRect(x, y, w, h);
}

function pxRect(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function drawDestination(ctx, d, camera) {
  const x = d.x * TILE_SIZE - camera.x + TILE_SIZE / 2;
  const y = d.y * TILE_SIZE - camera.y + TILE_SIZE / 2;
  ctx.strokeStyle = '#fffd86'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x - 8, y - 8); ctx.lineTo(x + 8, y + 8); ctx.moveTo(x + 8, y - 8); ctx.lineTo(x - 8, y + 8); ctx.stroke();
  ctx.lineWidth = 1;
}

function applyVignette(ctx) {
  const g = ctx.createRadialGradient(ctx.canvas.width / 2, ctx.canvas.height / 2, 150, ctx.canvas.width / 2, ctx.canvas.height / 2, ctx.canvas.width * 0.65);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,0.18)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

function drawGrid(ctx, camera, w, h) {
  ctx.strokeStyle = 'rgba(0,0,0,.15)';
  for (let x = 0; x <= w; x++) { const px = x * TILE_SIZE - camera.x; ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, ctx.canvas.height); ctx.stroke(); }
  for (let y = 0; y <= h; y++) { const py = y * TILE_SIZE - camera.y; ctx.beginPath(); ctx.moveTo(0, py); ctx.lineTo(ctx.canvas.width, py); ctx.stroke(); }
}

export function renderMinimap(canvas, world, player, npcs, camera, discovered) {
  const c = canvas.getContext('2d');
  c.clearRect(0, 0, canvas.width, canvas.height);
  const scale = Math.min(canvas.width / world.width, canvas.height / world.height);
  for (let y = 0; y < world.height; y++) for (let x = 0; x < world.width; x++) {
    if (!discovered.has(`${x},${y}`)) { c.fillStyle = '#0b0b0b'; c.fillRect(x * scale, y * scale, scale + 0.3, scale + 0.3); continue; }
    const t = world.tiles[y][x]; c.fillStyle = tileColors[t] || '#111'; c.fillRect(x * scale, y * scale, scale + 0.3, scale + 0.3);
  }
  c.fillStyle = '#fff'; c.fillRect(player.x * scale, player.y * scale, 2, 2);
  c.fillStyle = '#e26d6d';
  for (const n of npcs) if (!n.dead) c.fillRect(n.x * scale, n.y * scale, 2, 2);
  c.strokeStyle = '#fff';
  c.strokeRect((camera.x / TILE_SIZE) * scale, (camera.y / TILE_SIZE) * scale, (960 / TILE_SIZE) * scale, (640 / TILE_SIZE) * scale);
}
