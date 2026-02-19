export const TILE_SIZE = 28;

export const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
export const randInt = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
export const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);

export function xpForLevel(level) {
  let points = 0;
  for (let l = 1; l < level; l += 1) points += Math.floor(l + 300 * 2 ** (l / 7));
  return Math.floor(points / 4);
}

export function levelForXp(xp) {
  for (let level = 99; level >= 1; level -= 1) if (xp >= xpForLevel(level)) return level;
  return 1;
}

export function combatLevel(skills) {
  const base = 0.25 * (skills.Defence.level + skills.Hitpoints.level);
  const melee = 0.325 * (skills.Attack.level + skills.Strength.level);
  return Math.max(3, Math.floor(base + melee));
}
