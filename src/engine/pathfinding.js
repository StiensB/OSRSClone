export function aStar(start, goal, passable, w, h) {
  const key = (x, y) => `${x},${y}`;
  const open = [start];
  const came = new Map();
  const g = new Map([[key(start.x, start.y), 0]]);
  const f = new Map([[key(start.x, start.y), heuristic(start, goal)]]);

  while (open.length) {
    open.sort((a, b) => f.get(key(a.x, a.y)) - f.get(key(b.x, b.y)));
    const cur = open.shift();
    if (cur.x === goal.x && cur.y === goal.y) return reconstruct(came, cur);

    for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
      const nx = cur.x + dx; const ny = cur.y + dy;
      if (nx < 0 || ny < 0 || nx >= w || ny >= h || !passable(nx, ny)) continue;
      const nk = key(nx, ny);
      const tent = g.get(key(cur.x, cur.y)) + 1;
      if (tent < (g.get(nk) ?? Infinity)) {
        came.set(nk, cur);
        g.set(nk, tent);
        f.set(nk, tent + heuristic({ x: nx, y: ny }, goal));
        if (!open.find((n) => n.x === nx && n.y === ny)) open.push({ x: nx, y: ny });
      }
    }
  }
  return [];
}

function heuristic(a, b) { return Math.abs(a.x - b.x) + Math.abs(a.y - b.y); }
function reconstruct(came, current) {
  const out = [current];
  while (came.has(`${current.x},${current.y}`)) {
    current = came.get(`${current.x},${current.y}`);
    out.push(current);
  }
  return out.reverse();
}
