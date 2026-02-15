import { NPC_TEMPLATES, SKILL_NAMES } from './data.js';

export function createPlayer(spawn) {
  const skills = Object.fromEntries(SKILL_NAMES.map((s) => [s, { xp: s === 'Hitpoints' ? 1200 : 0, level: s === 'Hitpoints' ? 10 : 1, flash: 0 }]));
  return {
    x: spawn.x, y: spawn.y, hp: 10, maxHp: 10, path: [], speed: 5,
    inventory: [
      { itemId: 'bronze_axe', qty: 1 }, { itemId: 'bronze_pick', qty: 1 }, { itemId: 'bronze_rod', qty: 1 }, { itemId: 'bronze_blade', qty: 1 }, { itemId: 'coins', qty: 25 }
    ],
    bank: [], equipment: { weapon: null, shield: null, helm: null, body: null, legs: null, boots: null, amulet: null, cape: null, ring: null },
    skills, action: null, targetNpc: null, attackTimer: 0
  };
}

export function spawnNpcs() {
  const list = [];
  for (const p of [[34,40],[38,44],[45,41],[50,48]]) list.push(makeNpc('meadow_pecker', p[0], p[1]));
  for (const p of [[72,68],[76,72],[85,78]]) list.push(makeNpc('bog_raider', p[0], p[1]));
  return list;
}

function makeNpc(kind, x, y) {
  const t = NPC_TEMPLATES[kind];
  return { ...t, kind, x, y, spawnX: x, spawnY: y, hp: t.maxHp, dead: false, respawnAt: 0, roamAt: 0, attackTimer: 0 };
}
