import { createInput } from './engine/input.js';
import { renderGame, renderMinimap } from './engine/rendering.js';
import { TILE_SIZE, clamp } from './engine/utils.js';
import { createWorld, isWalkable } from './game/world.js';
import { createPlayer, spawnNpcs } from './game/entities.js';
import { createUi } from './game/ui.js';
import { deserialize, handleClick, serialize, tickUiEffects, tryPickup, updateCombat, updateMovement, updateNodes, updateSkilling } from './game/systems.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const mini = document.getElementById('miniMap');
const world = createWorld();
const player = createPlayer(world.spawn);
const state = {
  world, player,
  npcs: spawnNpcs(), nodes: world.nodes, groundItems: [],
  destination: null, discovered: new Set(), debug: false,
  viewMode: 'topdown',
  camera: { x: 0, y: 0 }, fps: 0, ui: null,
  chat: () => {}
};
state.ui = createUi(state);
state.chat = state.ui.chat;

const save = localStorage.getItem('emberfall-save-v1');
if (save) {
  try {
    deserialize(state, JSON.parse(save));
    if (!Number.isFinite(state.player.x) || !Number.isFinite(state.player.y)) throw new Error('Invalid player position in save');
  } catch (err) {
    console.warn('Save load failed, resetting save:', err);
    localStorage.removeItem('emberfall-save-v1');
    state.chat('Previous save was invalid and has been reset.');
  }
} else {
  state.chat('Welcome to Emberfall Basin. Left click to walk or interact.');
  state.chat('Starter tools are in your inventory. Equip your hatchet, gather, bank, and battle.');
  state.chat('New: choose combat style in Combat tab and claim your starter quest in Quests.');
}

const input = createInput(canvas);
let prev = performance.now(), fpsTimer = 0, frames = 0;

canvas.addEventListener('mousemove', () => {
  const { tx, ty, target } = screenToTile(input.mouseX, input.mouseY);
  canvas.style.cursor = target ? 'pointer' : isWalkable(world, tx, ty) ? 'crosshair' : 'not-allowed';
});
canvas.addEventListener('click', () => {
  if (!input.click) return;
  const { tx, ty, target } = screenToTile(input.click.x, input.click.y);
  handleClick(state, tx, ty, target);
  input.click = null;
});

document.getElementById('debugToggle').onclick = () => {
  state.debug = !state.debug;
  document.getElementById('debugPanel').classList.toggle('hidden', !state.debug);
};

document.getElementById('viewToggle').onclick = () => {
  state.viewMode = state.viewMode === 'topdown' ? 'iso' : 'topdown';
  state.chat(`View mode switched to ${state.viewMode === 'iso' ? '2.5D isometric' : 'top-down'}.`);
};

setInterval(() => localStorage.setItem('emberfall-save-v1', JSON.stringify(serialize(state))), 4000);

function loop(now) {
  const dt = clamp((now - prev) / 1000, 0, 0.05); prev = now;
  updateMovement(state, dt);
  updateSkilling(state, now);
  updateNodes(state, now);
  updateCombat(state, now);
  tryPickup(state);
  tickUiEffects(player, dt);

  updateCamera();
  discoverTiles();
  renderGame(ctx, state);
  renderMinimap(mini, world, player, state.npcs, state.camera, state.discovered);
  state.ui.render();

  frames++; fpsTimer += dt;
  if (fpsTimer > 0.5) {
    state.fps = Math.round(frames / fpsTimer); frames = 0; fpsTimer = 0;
    document.getElementById('debugPanel').textContent = `FPS ${state.fps} | NPCs ${state.npcs.filter(n=>!n.dead).length} | Ground ${state.groundItems.length} | View ${state.viewMode}`;
  }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

function updateCamera() {
  state.camera.x = clamp(player.x * TILE_SIZE - canvas.width / 2, 0, world.width * TILE_SIZE - canvas.width);
  state.camera.y = clamp(player.y * TILE_SIZE - canvas.height / 2, 0, world.height * TILE_SIZE - canvas.height);
}

function screenToTile(sx, sy) {
  if (state.viewMode === 'iso') return screenToTileIso(sx, sy);
  return screenToTileTopDown(sx, sy);
}

function screenToTileTopDown(sx, sy) {
  const tx = Math.floor((sx + state.camera.x) / TILE_SIZE);
  const ty = Math.floor((sy + state.camera.y) / TILE_SIZE);
  return withTarget(tx, ty);
}

function screenToTileIso(sx, sy) {
  const isoW = TILE_SIZE * 0.72;
  const isoH = TILE_SIZE * 0.38;
  const centerX = canvas.width * 0.5;
  const centerY = canvas.height * 0.24;
  const rx = sx - centerX;
  const ry = sy - centerY;
  const dx = (ry / isoH + rx / isoW) * 0.5;
  const dy = (ry / isoH - rx / isoW) * 0.5;
  const tx = Math.floor(player.x + dx);
  const ty = Math.floor(player.y + dy);
  return withTarget(tx, ty);
}

function withTarget(tx, ty) {
  const node = state.nodes.find((n) => !n.depleted && n.x === tx && n.y === ty);
  const npc = state.npcs.find((n) => !n.dead && Math.round(n.x) === tx && Math.round(n.y) === ty);
  const ground = state.groundItems.find((g) => g.x === tx && g.y === ty);
  return { tx, ty, target: node ? { kind: 'node', node } : npc ? { kind: 'npc', npc } : ground ? { kind: 'ground', item: ground } : null };
}

function discoverTiles() {
  const px = Math.round(player.x), py = Math.round(player.y);
  for (let y = py - 10; y <= py + 10; y++) for (let x = px - 10; x <= px + 10; x++) if (x >= 0 && y >= 0 && x < world.width && y < world.height) state.discovered.add(`${x},${y}`);
}
