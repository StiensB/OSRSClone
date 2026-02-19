import { TILE_SIZE } from './utils.js';

const tileColors = {
  grass: '#3f7f3a', dirt: '#8a6a3f', water: '#2f588c', rock: '#55585a', wood: '#6b4f31', wall: '#7b7a70', sand: '#9f8e5c'
};

const ISO_W = TILE_SIZE * 0.72;
const ISO_H = TILE_SIZE * 0.38;

export function renderGame(ctx, state) {
  if (state.viewMode === 'iso') {
    renderIsoGame(ctx, state);
    return;
  }

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

  drawObjectsTopDown(ctx, nodes, camera);
  drawGroundItemsTopDown(ctx, groundItems, camera);
  drawNpcsTopDown(ctx, npcs, camera);
  drawPlayerTopDown(ctx, player, camera);
  if (destination) drawDestinationTopDown(ctx, destination, camera);
  applyVignette(ctx);
  if (debug) drawGrid(ctx, camera, world.width, world.height);
}

function renderIsoGame(ctx, state) {
  const { world, player, npcs, nodes, groundItems, destination, debug } = state;
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.imageSmoothingEnabled = false;

  const centerX = ctx.canvas.width * 0.5;
  const centerY = ctx.canvas.height * 0.24;
  const cx = Math.round(player.x);
  const cy = Math.round(player.y);
  const radius = 22;

  const minX = Math.max(0, cx - radius);
  const maxX = Math.min(world.width - 1, cx + radius);
  const minY = Math.max(0, cy - radius);
  const maxY = Math.min(world.height - 1, cy + radius);

  for (let s = minX + minY; s <= maxX + maxY; s++) {
    for (let y = minY; y <= maxY; y++) {
      const x = s - y;
      if (x < minX || x > maxX) continue;
      const t = world.tiles[y]?.[x];
      if (!t) continue;
      const p = isoProject(x, y, player.x, player.y, centerX, centerY);
      drawIsoTile(ctx, t, p.x, p.y);
    }
  }

  // Build depth-sorted draw list for entities/objects
  const drawList = [];
  for (const n of nodes) if (!n.depleted && Math.abs(n.x - cx) <= radius && Math.abs(n.y - cy) <= radius) {
    drawList.push({ depth: n.x + n.y + 0.35, fn: () => drawIsoNode(ctx, n, player, centerX, centerY) });
  }
  for (const g of groundItems) if (Math.abs(g.x - cx) <= radius && Math.abs(g.y - cy) <= radius) {
    drawList.push({ depth: g.x + g.y + 0.45, fn: () => drawIsoGroundItem(ctx, g, player, centerX, centerY) });
  }
  for (const n of npcs) if (!n.dead && Math.abs(n.x - cx) <= radius && Math.abs(n.y - cy) <= radius) {
    drawList.push({ depth: n.x + n.y + 0.6, fn: () => drawIsoNpc(ctx, n, player, centerX, centerY) });
  }
  drawList.push({ depth: player.x + player.y + 0.62, fn: () => drawIsoPlayer(ctx, player, centerX, centerY) });
  drawList.sort((a, b) => a.depth - b.depth).forEach((d) => d.fn());

  if (destination) drawIsoDestination(ctx, destination, player, centerX, centerY);
  if (debug) drawIsoDebug(ctx, player, centerX, centerY);
  applyVignette(ctx);
}

function isoProject(x, y, px, py, cx, cy) {
  const dx = x - px;
  const dy = y - py;
  return { x: cx + (dx - dy) * ISO_W, y: cy + (dx + dy) * ISO_H };
}

function drawIsoTile(ctx, kind, sx, sy) {
  const c = tileColors[kind] || '#f0f';
  ctx.fillStyle = c;
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.lineTo(sx + ISO_W, sy + ISO_H);
  ctx.lineTo(sx, sy + ISO_H * 2);
  ctx.lineTo(sx - ISO_W, sy + ISO_H);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = 'rgba(0,0,0,.15)';
  ctx.stroke();

  if (kind === 'water') {
    ctx.fillStyle = 'rgba(255,255,255,.10)';
    ctx.fillRect(sx - 5, sy + ISO_H, 10, 2);
  }
}

function drawIsoPlayer(ctx, p, cx, cy) {
  const pos = isoProject(p.x, p.y, p.x, p.y, cx, cy);
  const bob = Math.sin(performance.now() / 220) * 1;
  drawShadow(ctx, pos.x - 10, pos.y + ISO_H * 1.6, 20, 5);
  pxRect(ctx, pos.x - 8, pos.y - 20 + bob, 16, 8, '#241812');
  pxRect(ctx, pos.x - 10, pos.y - 12 + bob, 20, 10, '#241812');
  pxRect(ctx, pos.x - 7, pos.y - 19 + bob, 14, 7, '#edcc9b');
  pxRect(ctx, pos.x - 8, pos.y - 11 + bob, 16, 8, '#496f9f');
  pxRect(ctx, pos.x - 8, pos.y - 2 + bob, 6, 5, '#384f78');
  pxRect(ctx, pos.x + 2, pos.y - 2 + bob, 6, 5, '#384f78');
  if (p.equipment?.weapon === 'bronze_axe') {
    pxRect(ctx, pos.x + 10, pos.y - 10 + bob, 1, 10, '#5e3b1f');
    pxRect(ctx, pos.x + 9, pos.y - 10 + bob, 3, 2, '#8e8f93');
  }
}

function drawIsoNpc(ctx, n, p, cx, cy) {
  const pos = isoProject(n.x, n.y, p.x, p.y, cx, cy);
  drawShadow(ctx, pos.x - 9, pos.y + ISO_H * 1.6, 18, 5);
  if (n.kind === 'bog_raider') {
    pxRect(ctx, pos.x - 7, pos.y - 16, 14, 8, '#b89579');
    pxRect(ctx, pos.x - 9, pos.y - 8, 18, 10, '#7c4747');
  } else {
    pxRect(ctx, pos.x - 8, pos.y - 7, 16, 8, '#8e8459');
    pxRect(ctx, pos.x - 5, pos.y - 11, 10, 4, '#dad29e');
  }
}

function drawIsoNode(ctx, n, p, cx, cy) {
  const pos = isoProject(n.x, n.y, p.x, p.y, cx, cy);
  if (n.type === 'tree') {
    drawShadow(ctx, pos.x - 9, pos.y + ISO_H * 1.6, 18, 5);
    pxRect(ctx, pos.x - 3, pos.y - 18, 6, 20, '#4a2f18');
    pxRect(ctx, pos.x - 11, pos.y - 26, 22, 13, '#2f7f39');
  }
  if (n.type === 'rock') {
    drawShadow(ctx, pos.x - 8, pos.y + ISO_H * 1.6, 16, 5);
    pxRect(ctx, pos.x - 9, pos.y - 14, 18, 12, '#777');
  }
  if (n.type === 'fish') {
    pxRect(ctx, pos.x - 8, pos.y - 2, 16, 3, '#b9d8ff');
  }
  if (n.type === 'bank') {
    pxRect(ctx, pos.x - 10, pos.y - 20, 20, 20, '#c5ae79');
    pxRect(ctx, pos.x - 8, pos.y - 16, 16, 4, '#8f753f');
  }
}

function drawIsoGroundItem(ctx, g, p, cx, cy) {
  const pos = isoProject(g.x, g.y, p.x, p.y, cx, cy);
  drawShadow(ctx, pos.x - 4, pos.y + ISO_H * 1.6, 8, 3);
  pxRect(ctx, pos.x - 3, pos.y - 3, 6, 6, '#ffd85f');
}

function drawIsoDestination(ctx, d, p, cx, cy) {
  const pos = isoProject(d.x, d.y, p.x, p.y, cx, cy);
  ctx.strokeStyle = '#fffd86'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(pos.x - 8, pos.y - 8); ctx.lineTo(pos.x + 8, pos.y + 8); ctx.moveTo(pos.x + 8, pos.y - 8); ctx.lineTo(pos.x - 8, pos.y + 8); ctx.stroke();
  ctx.lineWidth = 1;
}

function drawIsoDebug(ctx, p, cx, cy) {
  const pos = isoProject(Math.round(p.x), Math.round(p.y), p.x, p.y, cx, cy);
  ctx.strokeStyle = 'rgba(255,255,255,.4)';
  ctx.strokeRect(pos.x - 6, pos.y - 4, 12, 8);
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

function drawPlayerTopDown(ctx, p, camera) {
  const x = p.x * TILE_SIZE - camera.x + 3;
  const y = p.y * TILE_SIZE - camera.y + 2;
  const bob = Math.sin(performance.now() / 240) * 0.8;

  drawShadow(ctx, x + 3, y + 22, 18, 5);
  pxRect(ctx, x + 6, y + 2 + bob, 10, 9, '#241812');
  pxRect(ctx, x + 4, y + 11 + bob, 14, 9, '#241812');
  pxRect(ctx, x + 4, y + 20 + bob, 6, 6, '#241812');
  pxRect(ctx, x + 12, y + 20 + bob, 6, 6, '#241812');
  pxRect(ctx, x + 7, y + 3 + bob, 8, 7, '#edcc9b');
  pxRect(ctx, x + 5, y + 12 + bob, 12, 7, '#496f9f');
  pxRect(ctx, x + 5, y + 20 + bob, 5, 5, '#384f78');
  pxRect(ctx, x + 12, y + 20 + bob, 5, 5, '#384f78');
  pxRect(ctx, x + 8, y + 5 + bob, 1, 1, '#2a2a2a');
  pxRect(ctx, x + 13, y + 5 + bob, 1, 1, '#2a2a2a');
  pxRect(ctx, x + 3, y + 11 + bob, 2, 9, '#553254');

  if (p.equipment?.weapon === 'bronze_axe') {
    pxRect(ctx, x + 17, y + 12 + bob, 1, 10, '#5e3b1f');
    pxRect(ctx, x + 16, y + 12 + bob, 3, 2, '#8e8f93');
    pxRect(ctx, x + 15, y + 13 + bob, 2, 2, '#8e8f93');
  }
}

function drawNpcsTopDown(ctx, list, camera) {
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
  pxRect(ctx, x + 17, y + 8, 3, 3, '#c88e39');
  pxRect(ctx, x + 8, y + 16, 2, 7, '#6f5a34');
  pxRect(ctx, x + 14, y + 16, 2, 7, '#6f5a34');
  pxRect(ctx, x + 9, y + 6, 1, 1, '#2b2b2b');
}

function drawObjectsTopDown(ctx, nodes, camera) {
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

function drawGroundItemsTopDown(ctx, items, camera) {
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

function drawDestinationTopDown(ctx, d, camera) {
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
