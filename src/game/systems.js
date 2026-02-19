import { aStar, findNearestWalkable } from '../engine/pathfinding.js';
import { clamp, dist, levelForXp, randInt, xpForLevel } from '../engine/utils.js';
import { ITEMS } from './data.js';
import { isWalkable } from './world.js';
import { beep } from '../engine/audio.js';

export function handleClick(state, tileX, tileY, target) {
  const { player, world } = state;
  if (target?.kind === 'node') {
    if (target.node.action === 'bank') return state.ui.openBank();
    queueSkilling(state, target.node);
    return;
  }
  if (target?.kind === 'npc') {
    player.action = null;
    player.targetNpc = target.npc;
    setPath(state, tileX, tileY);
    return;
  }
  if (target?.kind === 'ground') {
    setPath(state, tileX, tileY);
    player.action = { type: 'pickup', item: target.item };
    return;
  }
  player.action = null;
  player.targetNpc = null;
  if (isWalkable(world, tileX, tileY)) setPath(state, tileX, tileY);
}

function setPath(state, tx, ty) {
  const { player, world } = state;
  const start = { x: clamp(Math.round(player.x), 0, world.width - 1), y: clamp(Math.round(player.y), 0, world.height - 1) };
  const wanted = { x: clamp(Math.round(tx), 0, world.width - 1), y: clamp(Math.round(ty), 0, world.height - 1) };
  const goal = findNearestWalkable(wanted, (x, y) => isWalkable(world, x, y), world.width, world.height);

  if (!goal) {
    player.path = [];
    state.destination = null;
    return;
  }

  const path = aStar(start, goal, (x, y) => isWalkable(world, x, y), world.width, world.height);
  player.path = path.slice(1);
  state.destination = goal;
}

export function updateMovement(state, dt) {
  const p = state.player;
  if (!p.path.length) return;
  if (p.action?.type === 'skilling') p.action = null;
  const next = p.path[0];
  const dx = next.x - p.x, dy = next.y - p.y;
  const d = Math.hypot(dx, dy);
  if (d < 0.02) { p.x = next.x; p.y = next.y; p.path.shift(); return; }
  p.x += (dx / d) * p.speed * dt;
  p.y += (dy / d) * p.speed * dt;
}

function queueSkilling(state, node) {
  const p = state.player;
  p.targetNpc = null;
  p.action = { type: 'skilling', nodeId: node.id, nextTick: 0, progress: 0 };
  setPath(state, node.x, node.y + 1);
  state.chat(`You move toward the ${node.label}.`);
}

export function updateSkilling(state, now) {
  const p = state.player;
  if (p.path.length || p.action?.type !== 'skilling') return;
  const node = state.nodes.find((n) => n.id === p.action.nodeId);
  if (!node || node.depleted || dist(p.x, p.y, node.x, node.y) > 1.9) return;
  if (now < p.action.nextTick) return;

  const table = {
    woodcut: { skill: 'Woodcutting', tool: 'bronze_axe', item: 'logs', req: 1, xp: 18, base: 0.55, ticks: 2 },
    mine: { skill: 'Mining', tool: 'bronze_pick', item: 'ore', req: 1, xp: 22, base: 0.45, ticks: 3 },
    fish: { skill: 'Fishing', tool: 'bronze_rod', item: 'fish', req: 1, xp: 20, base: 0.5, ticks: 2 }
  }[node.action];
  if (!table) return;

  if (node.action === 'woodcut' && p.equipment.weapon !== table.tool) {
    state.chat(`You must equip a ${ITEMS[table.tool].name} to chop this tree.`);
    p.action = null;
    return;
  }
  if (node.action !== 'woodcut' && !hasUsableTool(p, table.tool)) {
    state.chat(`You need a ${ITEMS[table.tool].name}.`);
    p.action = null;
    return;
  }

  p.action.nextTick = now + 600;
  p.action.progress += 1;
  state.chat(`You ${node.action === 'woodcut' ? 'swing your hatchet' : node.action === 'mine' ? 'strike the vein' : 'cast your line'}...`, true);

  if (p.action.progress < table.ticks) return;
  p.action.progress = 0;
  const lvl = p.skills[table.skill].level;
  const chance = clamp(table.base + (lvl - table.req) * 0.02, 0.2, 0.9);
  if (Math.random() < chance && addItem(p.inventory, table.item, 1)) {
    grantXp(state, table.skill, table.xp);
    state.chat(`You gather ${ITEMS[table.item].name}.`);
    if (node.action === 'woodcut') updateQuestProgress(state, 'timber_trial', 1);
    if (Math.random() < 0.18) {
      node.depleted = true;
      node.respawn = now + 6000;
      state.chat(`${node.label} is depleted.`);
    }
  } else state.chat('Nothing useful this cycle.', true);
}

export function updateNodes(state, now) {
  for (const n of state.nodes) if (n.depleted && now >= n.respawn) n.depleted = false;
}

export function updateCombat(state, now) {
  const p = state.player;
  if (p.hp <= 0) return;

  for (const n of state.npcs) {
    if (n.dead) {
      if (now >= n.respawnAt) { n.dead = false; n.hp = n.maxHp; n.x = n.spawnX; n.y = n.spawnY; }
      continue;
    }
    if (n.aggro > 0 && dist(p.x, p.y, n.x, n.y) <= n.aggro && p.hp > 0) p.targetNpc ??= n;
    if (now > n.roamAt && !p.targetNpc) { n.roamAt = now + 1200; n.x += randInt(-1, 1); n.y += randInt(-1, 1); }
  }

  if (!p.targetNpc || p.targetNpc.dead) return;
  const t = p.targetNpc;
  if (dist(p.x, p.y, t.x, t.y) > 1.45) { setPath(state, t.x, t.y); return; }
  p.path = [];
  if (now >= p.attackTimer) {
    p.attackTimer = now + 1800;
    swing(state, p, t, true);
  }
  if (now >= t.attackTimer) {
    t.attackTimer = now + t.attackSpeed;
    swing(state, t, p, false);
  }
}

function swing(state, attacker, defender, fromPlayer) {
  const styleBonus = fromPlayer ? combatStyleBonuses(state.player.combatStyle) : { atk: 0, str: 0, def: 0 };
  const atk = fromPlayer ? state.player.skills.Attack.level + 2 + styleBonus.atk : attacker.attack;
  const str = fromPlayer ? state.player.skills.Strength.level + 2 + styleBonus.str : attacker.strength;
  const def = fromPlayer ? defender.defence : state.player.skills.Defence.level + styleBonus.def;
  const hitChance = clamp(0.42 + (atk - def) * 0.03, 0.1, 0.92);
  const hit = Math.random() < hitChance ? randInt(0, Math.max(1, Math.floor(str / 2))) : 0;
  defender.hp -= hit;
  beep(hit > 0 ? 620 : 320, 0.05);
  state.chat(`${fromPlayer ? 'You' : attacker.name} hit ${fromPlayer ? defender.name : 'you'} for ${hit}.`, true);
  if (defender.hp <= 0) {
    if (fromPlayer) {
      applyCombatXp(state);
      killNpc(state, defender);
      state.player.targetNpc = null;
    } else {
      respawnPlayer(state);
    }
  }
}

function applyCombatXp(state) {
  const style = state.player.combatStyle || 'balanced';
  if (style === 'accurate') {
    grantXp(state, 'Attack', 24); grantXp(state, 'Hitpoints', 7);
  } else if (style === 'aggressive') {
    grantXp(state, 'Strength', 24); grantXp(state, 'Hitpoints', 7);
  } else if (style === 'defensive') {
    grantXp(state, 'Defence', 24); grantXp(state, 'Hitpoints', 7);
  } else {
    grantXp(state, 'Attack', 10); grantXp(state, 'Strength', 10); grantXp(state, 'Defence', 10); grantXp(state, 'Hitpoints', 7);
  }
}

function combatStyleBonuses(style) {
  if (style === 'accurate') return { atk: 2, str: 0, def: 0 };
  if (style === 'aggressive') return { atk: 0, str: 2, def: 0 };
  if (style === 'defensive') return { atk: 0, str: 0, def: 2 };
  return { atk: 1, str: 1, def: 0 };
}

export function setCombatStyle(state, style) {
  state.player.combatStyle = style;
  state.chat(`Combat style set to ${style}.`);
}

function killNpc(state, npc) {
  npc.dead = true; npc.respawnAt = performance.now() + 8000;
  state.chat(`${npc.name} collapses.`);
  for (const drop of npc.loot) if (Math.random() < drop.chance) state.groundItems.push({ x: npc.x, y: npc.y, itemId: drop.itemId, qty: randInt(drop.min, drop.max) });
}

function respawnPlayer(state) {
  const p = state.player;
  p.hp = p.maxHp;
  p.x = state.world.spawn.x; p.y = state.world.spawn.y;
  p.path = []; p.action = null; p.targetNpc = null;
  state.chat('You were defeated and wake up in town.');
}

export function tryPickup(state) {
  const p = state.player;
  if (p.action?.type !== 'pickup' || p.path.length) return;
  const i = state.groundItems.findIndex((g) => g === p.action.item || (Math.round(p.x) === g.x && Math.round(p.y) === g.y));
  if (i >= 0) {
    const g = state.groundItems[i];
    if (addItem(p.inventory, g.itemId, g.qty)) { state.groundItems.splice(i, 1); state.chat(`Picked up ${ITEMS[g.itemId].name} x${g.qty}.`); }
  }
  p.action = null;
}

export function addItem(inv, itemId, qty) {
  const meta = ITEMS[itemId];
  if (!meta) return false;
  if (meta.stackable) {
    const slot = inv.find((s) => s.itemId === itemId);
    if (slot) slot.qty += qty; else if (inv.length < 28) inv.push({ itemId, qty }); else return false;
    return true;
  }
  for (let i = 0; i < qty; i++) {
    if (inv.length >= 28) return false;
    inv.push({ itemId, qty: 1 });
  }
  return true;
}

export function toggleEquip(state, inventoryIndex) {
  const p = state.player;
  const entry = p.inventory[inventoryIndex];
  if (!entry) return false;
  const meta = ITEMS[entry.itemId];
  if (!meta?.slot || meta.stackable) return false;
  const slot = meta.slot;

  const currentlyEquipped = p.equipment[slot];
  if (currentlyEquipped === entry.itemId) return false;
  if (currentlyEquipped && !addItem(p.inventory, currentlyEquipped, 1)) {
    state.chat('No room to swap equipment.');
    return false;
  }

  p.equipment[slot] = entry.itemId;
  p.inventory.splice(inventoryIndex, 1);
  state.chat(`You equip ${meta.name}.`);
  return true;
}

export function unequipSlot(state, slot) {
  const p = state.player;
  const itemId = p.equipment[slot];
  if (!itemId) return false;
  if (!addItem(p.inventory, itemId, 1)) {
    state.chat('No inventory space to unequip this item.');
    return false;
  }
  p.equipment[slot] = null;
  state.chat(`You unequip ${ITEMS[itemId].name}.`);
  return true;
}

function updateQuestProgress(state, questId, amount) {
  const q = state.player.quests?.[questId];
  if (!q || q.completed) return;
  q.progress = clamp(q.progress + amount, 0, q.goal);
  if (q.progress >= q.goal) {
    q.completed = true;
    state.chat(`Quest complete: ${q.title}. Claim reward in the Quest tab.`);
    beep(960, 0.13, 'triangle', 0.06);
  }
}

export function claimQuestReward(state, questId) {
  const q = state.player.quests?.[questId];
  if (!q || !q.completed || q.rewarded) return false;
  if (!addItem(state.player.inventory, 'coins', q.rewardCoins)) {
    state.chat('Need free inventory space to claim quest reward.');
    return false;
  }
  q.rewarded = true;
  grantXp(state, 'Woodcutting', 45);
  state.chat(`Quest reward claimed: ${q.rewardCoins} Sun Coins + 45 Woodcutting XP.`);
  return true;
}

function hasItem(inv, itemId) { return inv.some((s) => s.itemId === itemId); }
function hasUsableTool(player, itemId) {
  return player.equipment.weapon === itemId || hasItem(player.inventory, itemId);
}

export function grantXp(state, skill, amount) {
  const s = state.player.skills[skill];
  s.xp += amount;
  const newLevel = levelForXp(s.xp);
  if (newLevel > s.level) {
    s.level = newLevel; s.flash = 900;
    state.chat(`${skill} advanced to ${newLevel}!`);
    beep(880, 0.11, 'triangle', 0.06);
    if (skill === 'Hitpoints') { state.player.maxHp = newLevel; state.player.hp = clamp(state.player.hp + 1, 1, state.player.maxHp); }
  }
}

export function tickUiEffects(player, dt) {
  Object.values(player.skills).forEach((s) => { if (s.flash > 0) s.flash -= dt * 1000; });
}

export function serialize(state) {
  const p = state.player;
  return {
    x:p.x,y:p.y,hp:p.hp,maxHp:p.maxHp,
    inventory:p.inventory,bank:p.bank,equipment:p.equipment,skills:p.skills,
    combatStyle:p.combatStyle,quests:p.quests
  };
}

export function deserialize(state, save) {
  if (!save) return;
  Object.assign(state.player, save);
  if (!state.player.combatStyle) state.player.combatStyle = 'balanced';
  if (!state.player.quests?.timber_trial) {
    state.player.quests = state.player.quests || {};
    state.player.quests.timber_trial = { id: 'timber_trial', title: 'Timber Trial', objective: 'Chop 5 logs', progress: 0, goal: 5, rewardCoins: 80, completed: false, rewarded: false };
  }
}

export { xpForLevel };
