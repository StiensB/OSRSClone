export function createWorld() {
  const width = 120; const height = 120;
  const tiles = Array.from({ length: height }, () => Array.from({ length: width }, () => 'grass'));
  const blocked = new Set();
  const nodes = [];

  for (let x = 9; x < 28; x++) for (let y = 9; y < 27; y++) tiles[y][x] = 'dirt';
  for (let x = 11; x < 24; x++) for (let y = 11; y < 22; y++) tiles[y][x] = 'wood';
  for (let x = 36; x < 54; x++) for (let y = 20; y < 36; y++) tiles[y][x] = 'water';
  for (let y = 0; y < height; y++) { tiles[y][60] = 'rock'; blocked.add(`60,${y}`); }
  for (let y = 60; y < height; y++) for (let x = 61; x < width; x++) if ((x + y) % 8 === 0) tiles[y][x] = 'dirt';

  for (let x = 10; x < 28; x++) { blocked.add(`${x},8`); blocked.add(`${x},27`); tiles[8][x] = 'wall'; tiles[27][x] = 'wall'; }
  for (let y = 8; y < 28; y++) { blocked.add(`8,${y}`); blocked.add(`28,${y}`); tiles[y][8] = 'wall'; tiles[y][28] = 'wall'; }
  blocked.delete('18,8'); tiles[8][18] = 'dirt';

  nodes.push({ id:'bank_1', type:'bank', x:17, y:15, label:'Town Vault', action:'bank' });
  for (const p of [[14,31],[18,34],[21,33],[25,31],[29,32],[33,31]]) nodes.push({ id:`tree_${p[0]}_${p[1]}`, type:'tree', x:p[0], y:p[1], label:'Ash Tree', action:'woodcut', depleted:false, respawn:0 });
  for (const p of [[66,68],[70,66],[74,70],[78,67],[82,72]]) nodes.push({ id:`rock_${p[0]}_${p[1]}`, type:'rock', x:p[0], y:p[1], label:'Copper Vein', action:'mine', depleted:false, respawn:0 });
  for (const p of [[40,24],[43,27],[48,29]]) nodes.push({ id:`fish_${p[0]}_${p[1]}`, type:'fish', x:p[0], y:p[1], label:'River Shoal', action:'fish', depleted:false, respawn:0 });

  for (let y = 20; y < 36; y++) for (let x = 36; x < 54; x++) blocked.add(`${x},${y}`);
  for (const n of nodes) if (n.type === 'bank') blocked.add(`${n.x},${n.y}`);

  return { width, height, tiles, blocked, nodes, spawn: { x: 15, y: 16 } };
}

export function isWalkable(world, x, y) {
  return x >= 0 && y >= 0 && x < world.width && y < world.height && !world.blocked.has(`${x},${y}`);
}
