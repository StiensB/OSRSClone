// Reliable grid pathfinding (BFS). Kept under the aStar name for compatibility.
export function aStar(start, goal, passable, w, h, maxIterations = 50000) {
  const dirs = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 }
  ];
  const key = (x, y) => `${x},${y}`;

  const q = [{ x: start.x, y: start.y }];
  const visited = new Set([key(start.x, start.y)]);
  const came = new Map();

  let iterations = 0;
  let best = { x: start.x, y: start.y };
  let bestH = manhattan(start, goal);

  while (q.length && iterations < maxIterations) {
    iterations += 1;
    const cur = q.shift();

    const heuristicVal = manhattan(cur, goal);
    if (heuristicVal < bestH) { best = cur; bestH = heuristicVal; }
    if (cur.x === goal.x && cur.y === goal.y) return reconstruct(came, cur);

    for (const dir of dirs) {
      const nx = cur.x + dir.x;
      const ny = cur.y + dir.y;
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
      if (!passable(nx, ny)) continue;
      const nk = key(nx, ny);
      if (visited.has(nk)) continue;

      visited.add(nk);
      came.set(nk, cur);
      q.push({ x: nx, y: ny });
    }
  }

  if (best.x !== start.x || best.y !== start.y) return reconstruct(came, best);
  return [];
}

export function findNearestWalkable(goal, passable, w, h, maxRadius = 20) {
  if (goal.x >= 0 && goal.y >= 0 && goal.x < w && goal.y < h && passable(goal.x, goal.y)) return goal;

  for (let r = 1; r <= maxRadius; r += 1) {
    for (let x = goal.x - r; x <= goal.x + r; x += 1) {
      const yt = goal.y - r;
      const yb = goal.y + r;
      if (x >= 0 && x < w && yt >= 0 && yt < h && passable(x, yt)) return { x, y: yt };
      if (x >= 0 && x < w && yb >= 0 && yb < h && passable(x, yb)) return { x, y: yb };
    }
    for (let y = goal.y - r + 1; y <= goal.y + r - 1; y += 1) {
      const xl = goal.x - r;
      const xr = goal.x + r;
      if (xl >= 0 && xl < w && y >= 0 && y < h && passable(xl, y)) return { x: xl, y };
      if (xr >= 0 && xr < w && y >= 0 && y < h && passable(xr, y)) return { x: xr, y };
    }
  }

  return null;
}

function manhattan(a, b) { return Math.abs(a.x - b.x) + Math.abs(a.y - b.y); }

function reconstruct(came, current) {
  const out = [current];
  while (came.has(`${current.x},${current.y}`)) {
    current = came.get(`${current.x},${current.y}`);
    out.push(current);
  }
  return out.reverse();
}
