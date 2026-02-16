const DIRS = [
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: -1 }
];

export function aStar(start, goal, passable, w, h, maxIterations = 30000) {
  const key = (x, y) => `${x},${y}`;

  if (start.x === goal.x && start.y === goal.y) return [start];

  const open = [start];
  const openSet = new Set([key(start.x, start.y)]);
  const closed = new Set();
  const came = new Map();
  const g = new Map([[key(start.x, start.y), 0]]);
  const f = new Map([[key(start.x, start.y), manhattan(start, goal)]]);

  let best = start;
  let bestH = manhattan(start, goal);
  let iterations = 0;

  while (open.length && iterations < maxIterations) {
    iterations += 1;

    let bestIndex = 0;
    let bestScore = f.get(key(open[0].x, open[0].y)) ?? Infinity;
    for (let i = 1; i < open.length; i += 1) {
      const s = f.get(key(open[i].x, open[i].y)) ?? Infinity;
      if (s < bestScore) { bestScore = s; bestIndex = i; }
    }

    const current = open.splice(bestIndex, 1)[0];
    const currentKey = key(current.x, current.y);
    openSet.delete(currentKey);
    closed.add(currentKey);

    const hVal = manhattan(current, goal);
    if (hVal < bestH) { best = current; bestH = hVal; }
    if (current.x === goal.x && current.y === goal.y) return reconstruct(came, current);

    const currentG = g.get(currentKey) ?? Infinity;

    for (const dir of DIRS) {
      const nx = current.x + dir.x;
      const ny = current.y + dir.y;
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
      if (!passable(nx, ny)) continue;

      const neighborKey = key(nx, ny);
      if (closed.has(neighborKey)) continue;

      const tentative = currentG + 1;
      if (tentative < (g.get(neighborKey) ?? Infinity)) {
        came.set(neighborKey, current);
        g.set(neighborKey, tentative);
        f.set(neighborKey, tentative + manhattan({ x: nx, y: ny }, goal));

        if (!openSet.has(neighborKey)) {
          open.push({ x: nx, y: ny });
          openSet.add(neighborKey);
        }
      }
    }
  }

  // If we could not reach the exact goal, return best partial route so movement still feels responsive.
  if (best.x !== start.x || best.y !== start.y) return reconstruct(came, best);
  return [];
}

export function findNearestWalkable(goal, passable, w, h, maxRadius = 20) {
  if (goal.x >= 0 && goal.y >= 0 && goal.x < w && goal.y < h && passable(goal.x, goal.y)) return goal;

  for (let radius = 1; radius <= maxRadius; radius += 1) {
    for (let x = goal.x - radius; x <= goal.x + radius; x += 1) {
      const top = goal.y - radius;
      const bottom = goal.y + radius;
      if (inside(x, top, w, h) && passable(x, top)) return { x, y: top };
      if (inside(x, bottom, w, h) && passable(x, bottom)) return { x, y: bottom };
    }
    for (let y = goal.y - radius + 1; y <= goal.y + radius - 1; y += 1) {
      const left = goal.x - radius;
      const right = goal.x + radius;
      if (inside(left, y, w, h) && passable(left, y)) return { x: left, y };
      if (inside(right, y, w, h) && passable(right, y)) return { x: right, y };
    }
  }

  return null;
}

function inside(x, y, w, h) {
  return x >= 0 && y >= 0 && x < w && y < h;
}

function manhattan(a, b) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function reconstruct(came, current) {
  const out = [current];
  while (came.has(`${current.x},${current.y}`)) {
    current = came.get(`${current.x},${current.y}`);
    out.push(current);
  }
  return out.reverse();
}
