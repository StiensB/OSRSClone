export function createWorld() {
  const width = 180; const height = 180;
  const tiles = Array.from({ length: height }, () => Array.from({ length: width }, () => 'grass'));
  const blocked = new Set();
  const nodes = [];

  // Town basin (safe zone)
  carveRect(tiles, 9, 9, 30, 30, 'dirt');
  carveRect(tiles, 12, 12, 24, 18, 'wood');

  // Main road stretching deeper into map
  for (let x = 18; x < 150; x++) tiles[20 + Math.floor(Math.sin(x / 8) * 2)][x] = 'dirt';
  for (let y = 20; y < 165; y++) tiles[y][90 + Math.floor(Math.sin(y / 10) * 2)] = 'dirt';

  // Large western lake and eastern marsh
  carveRect(tiles, 42, 28, 26, 22, 'water');
  carveEllipse(tiles, 142, 136, 18, 13, 'water');

  // Cliffs / ridge divider with passes
  for (let y = 0; y < height; y++) {
    const x = 72 + Math.floor(Math.sin(y / 11) * 3);
    tiles[y][x] = 'rock';
    blocked.add(`${x},${y}`);
  }
  unblockPass(blocked, tiles, 72, 40);
  unblockPass(blocked, tiles, 73, 94);
  unblockPass(blocked, tiles, 71, 140);

  // Town wall
  for (let x = 10; x < 38; x++) { blocked.add(`${x},9`); blocked.add(`${x},38`); tiles[9][x] = 'wall'; tiles[38][x] = 'wall'; }
  for (let y = 9; y < 39; y++) { blocked.add(`9,${y}`); blocked.add(`38,${y}`); tiles[y][9] = 'wall'; tiles[y][38] = 'wall'; }
  unblockPass(blocked, tiles, 22, 9);

  // Biome texturing in deep wilds
  for (let y = 84; y < height; y++) {
    for (let x = 76; x < width; x++) {
      if ((x * 13 + y * 7) % 9 === 0) tiles[y][x] = 'dirt';
      if ((x * 5 + y * 11) % 17 === 0) tiles[y][x] = 'rock';
    }
  }

  // Collision for water bodies
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) if (tiles[y][x] === 'water') blocked.add(`${x},${y}`);

  // Nodes: denser and spread wider
  nodes.push({ id:'bank_1', type:'bank', x:21, y:18, label:'Town Vault', action:'bank' });
  for (const p of [[16,44],[20,47],[25,45],[30,43],[35,46],[40,48],[46,53],[52,50],[58,55]]) {
    nodes.push(node('tree', p[0], p[1], 'Ash Tree', 'woodcut'));
  }
  for (const p of [[84,92],[90,96],[95,100],[102,94],[110,108],[118,114],[130,126],[138,132],[146,138]]) {
    nodes.push(node('rock', p[0], p[1], 'Copper Vein', 'mine'));
  }
  for (const p of [[46,32],[50,36],[56,40],[60,44],[142,130],[148,136]]) {
    nodes.push(node('fish', p[0], p[1], 'River Shoal', 'fish'));
  }

  for (const n of nodes) if (n.type === 'bank') blocked.add(`${n.x},${n.y}`);

  return { width, height, tiles, blocked, nodes, spawn: { x: 19, y: 18 } };
}

function node(type, x, y, label, action) {
  return { id:`${type}_${x}_${y}`, type, x, y, label, action, depleted:false, respawn:0 };
}

function carveRect(tiles, x, y, w, h, kind) {
  for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) tiles[yy][xx] = kind;
}

function carveEllipse(tiles, cx, cy, rx, ry, kind) {
  for (let y = cy - ry; y <= cy + ry; y++) for (let x = cx - rx; x <= cx + rx; x++) {
    const dx = (x - cx) / rx; const dy = (y - cy) / ry;
    if (dx * dx + dy * dy <= 1) tiles[y][x] = kind;
  }
}

function unblockPass(blocked, tiles, x, y) {
  blocked.delete(`${x},${y}`);
  tiles[y][x] = 'dirt';
}

export function isWalkable(world, x, y) {
  return x >= 0 && y >= 0 && x < world.width && y < world.height && !world.blocked.has(`${x},${y}`);
}
