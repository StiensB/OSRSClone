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
    ctx.fillStyle = tileColors[t] || '#f0f';
    const px = x * TILE_SIZE - camera.x; const py = y * TILE_SIZE - camera.y;
    ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
    if (t === 'water') { ctx.fillStyle = 'rgba(255,255,255,.08)'; ctx.fillRect(px, py, TILE_SIZE, 3); }
  }

  drawObjects(ctx, nodes, camera);
  drawGroundItems(ctx, groundItems, camera);
  drawNpcs(ctx, npcs, camera);
  drawPlayer(ctx, player, camera);
  if (destination) drawDestination(ctx, destination, camera);
  if (debug) drawGrid(ctx, camera, world.width, world.height);
}

function drawPlayer(ctx, p, camera) {
  const x = p.x * TILE_SIZE - camera.x + 4;
  const y = p.y * TILE_SIZE - camera.y + 4;
  ctx.fillStyle = '#f3d9b1'; ctx.fillRect(x + 4, y, 12, 10);
  ctx.fillStyle = '#385e8c'; ctx.fillRect(x + 2, y + 10, 16, 14);
}
function drawNpcs(ctx, list, camera) {
  for (const n of list) if (!n.dead) {
    const x = n.x * TILE_SIZE - camera.x + 5; const y = n.y * TILE_SIZE - camera.y + 6;
    ctx.fillStyle = n.kind === 'bog_raider' ? '#7c4747' : '#d9d39a';
    ctx.fillRect(x, y, 16, 16);
  }
}
function drawObjects(ctx, nodes, camera) {
  for (const n of nodes) if (!n.depleted) {
    const x = n.x * TILE_SIZE - camera.x; const y = n.y * TILE_SIZE - camera.y;
    if (n.type === 'tree') { ctx.fillStyle = '#4a2f18'; ctx.fillRect(x + 11, y + 13, 6, 14); ctx.fillStyle = '#2f7f39'; ctx.beginPath(); ctx.arc(x + 14, y + 12, 10, 0, Math.PI * 2); ctx.fill(); }
    if (n.type === 'rock') { ctx.fillStyle = '#777'; ctx.beginPath(); ctx.arc(x + 14, y + 16, 10, 0, Math.PI * 2); ctx.fill(); }
    if (n.type === 'fish') { ctx.fillStyle = '#b9d8ff'; ctx.fillRect(x + 6, y + 14, 16, 5); }
    if (n.type === 'bank') { ctx.fillStyle = '#c5ae79'; ctx.fillRect(x + 4, y + 4, 20, 20); }
  }
}
function drawGroundItems(ctx, items, camera) {
  for (const g of items) {
    const x = g.x * TILE_SIZE - camera.x + 10; const y = g.y * TILE_SIZE - camera.y + 10;
    ctx.fillStyle = '#ffd85f'; ctx.fillRect(x, y, 7, 7);
  }
}
function drawDestination(ctx, d, camera) {
  const x = d.x * TILE_SIZE - camera.x + TILE_SIZE / 2;
  const y = d.y * TILE_SIZE - camera.y + TILE_SIZE / 2;
  ctx.strokeStyle = '#fffd86'; ctx.beginPath(); ctx.moveTo(x - 8, y - 8); ctx.lineTo(x + 8, y + 8); ctx.moveTo(x + 8, y - 8); ctx.lineTo(x - 8, y + 8); ctx.stroke();
}
function drawGrid(ctx, camera, w, h) {
  ctx.strokeStyle = 'rgba(0,0,0,.15)';
  for (let x = 0; x <= w; x++) { const px = x * TILE_SIZE - camera.x; ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, ctx.canvas.height); ctx.stroke(); }
  for (let y = 0; y <= h; y++) { const py = y * TILE_SIZE - camera.y; ctx.beginPath(); ctx.moveTo(0, py); ctx.lineTo(ctx.canvas.width, py); ctx.stroke(); }
}

export function renderMinimap(canvas, world, player, npcs, camera, discovered) {
  const c = canvas.getContext('2d');
  c.clearRect(0, 0, canvas.width, canvas.height);
  const scale = canvas.width / world.width;
  for (let y = 0; y < world.height; y++) for (let x = 0; x < world.width; x++) {
    if (!discovered.has(`${x},${y}`)) { c.fillStyle = '#0b0b0b'; c.fillRect(x * scale, y * scale, scale + 0.2, scale + 0.2); continue; }
    const t = world.tiles[y][x]; c.fillStyle = tileColors[t] || '#111'; c.fillRect(x * scale, y * scale, scale + 0.2, scale + 0.2);
  }
  c.fillStyle = '#fff'; c.fillRect(player.x * scale, player.y * scale, 2, 2);
  c.fillStyle = '#e26d6d';
  for (const n of npcs) if (!n.dead) c.fillRect(n.x * scale, n.y * scale, 2, 2);
  c.strokeStyle = '#fff';
  c.strokeRect((camera.x / TILE_SIZE) * scale, (camera.y / TILE_SIZE) * scale, (960 / TILE_SIZE) * scale, (640 / TILE_SIZE) * scale);
}
