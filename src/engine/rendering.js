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

  // subtle texture variation
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
  const x = p.x * TILE_SIZE - camera.x + 4;
  const y = p.y * TILE_SIZE - camera.y + 4;
  ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(x + 3, y + 20, 14, 5);
  ctx.fillStyle = '#f3d9b1'; ctx.fillRect(x + 4, y, 12, 10);
  ctx.fillStyle = '#1f2d3e'; ctx.fillRect(x + 5, y + 2, 3, 2); ctx.fillRect(x + 12, y + 2, 3, 2);
  ctx.fillStyle = '#385e8c'; ctx.fillRect(x + 2, y + 10, 16, 11);
  ctx.fillStyle = '#2d486b'; ctx.fillRect(x + 2, y + 20, 6, 4); ctx.fillRect(x + 12, y + 20, 6, 4);
}

function drawNpcs(ctx, list, camera) {
  for (const n of list) if (!n.dead) {
    const x = n.x * TILE_SIZE - camera.x + 5; const y = n.y * TILE_SIZE - camera.y + 6;
    ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.fillRect(x + 2, y + 12, 11, 4);
    if (n.kind === 'bog_raider') {
      ctx.fillStyle = '#7c4747'; ctx.fillRect(x, y, 16, 14);
      ctx.fillStyle = '#513030'; ctx.fillRect(x + 3, y + 14, 10, 4);
    } else {
      ctx.fillStyle = '#d9d39a'; ctx.fillRect(x, y + 5, 16, 9);
      ctx.fillStyle = '#a79f6f'; ctx.fillRect(x + 3, y + 14, 10, 3);
    }
  }
}

function drawObjects(ctx, nodes, camera) {
  for (const n of nodes) if (!n.depleted) {
    const x = n.x * TILE_SIZE - camera.x; const y = n.y * TILE_SIZE - camera.y;
    if (n.type === 'tree') {
      ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.beginPath(); ctx.ellipse(x + 14, y + 23, 8, 3, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#4a2f18'; ctx.fillRect(x + 11, y + 14, 6, 12);
      ctx.fillStyle = '#2f7f39'; ctx.beginPath(); ctx.arc(x + 14, y + 12, 10, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.10)'; ctx.beginPath(); ctx.arc(x + 11, y + 9, 4, 0, Math.PI * 2); ctx.fill();
    }
    if (n.type === 'rock') {
      ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.beginPath(); ctx.ellipse(x + 14, y + 22, 8, 3, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#777'; ctx.beginPath(); ctx.arc(x + 14, y + 16, 10, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#9b9fa3'; ctx.fillRect(x + 10, y + 10, 5, 3);
    }
    if (n.type === 'fish') {
      ctx.fillStyle = 'rgba(0,0,0,.15)'; ctx.fillRect(x + 6, y + 18, 16, 2);
      ctx.fillStyle = '#b9d8ff'; ctx.fillRect(x + 6, y + 14, 16, 5);
      ctx.fillStyle = '#e8f4ff'; ctx.fillRect(x + 9, y + 15, 4, 1);
    }
    if (n.type === 'bank') {
      ctx.fillStyle = '#c5ae79'; ctx.fillRect(x + 4, y + 4, 20, 20);
      ctx.fillStyle = '#8f753f'; ctx.fillRect(x + 6, y + 6, 16, 4);
      ctx.fillStyle = '#5d4928'; ctx.fillRect(x + 11, y + 12, 6, 9);
    }
  }
}

function drawGroundItems(ctx, items, camera) {
  for (const g of items) {
    const x = g.x * TILE_SIZE - camera.x + 10; const y = g.y * TILE_SIZE - camera.y + 10;
    ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.fillRect(x, y + 6, 8, 2);
    ctx.fillStyle = '#ffd85f'; ctx.fillRect(x, y, 7, 7);
  }
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
