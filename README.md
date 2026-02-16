# Emberfall Basin Prototype

A local-only browser RPG prototype inspired by classic click-to-move fantasy MMOs, built with **HTML/CSS/vanilla JS** and original content.

## Run (recommended)
From the project root (`/workspace/OSRSClone`), start a local web server:

```bash
python3 -m http.server 8000
```

Then open:

- `http://localhost:8000/`  
  or
- `http://localhost:8000/index.html`

### If you see "Not Found"
That usually means the server is running from the wrong folder. Make sure you started it **inside** the repo root where `index.html` exists.

Quick check:

```bash
pwd
ls
```

You should see `index.html` in the output.

## Alternative run method
You can try opening `index.html` directly, but some browsers restrict module/file loading with `file://` URLs. If anything fails, use the local server method above.

## Controls
- **Left click tile**: Walk there.
- **Left click node/NPC/item**: Context action (gather, attack, pickup, bank).
- **Click gear in Inventory**: Equip/unequip tools and weapons (equip hatchet to chop trees).
- **I / S / E**: Switch tabs (Inventory / Skills / Equipment).
- **Debug button**: Toggle debug panel (FPS + entity counters).
- **Chat input**: Enter sends local chat line.

## Gameplay Loop
1. Equip your Bronze Hatchet from Inventory, then gather resources from trees, ore veins, and fishing shoals.
2. Deposit resources into the Town Vault bank.
3. Fight wilderness creatures for loot and XP.
4. Repeat to level combat + gathering skills.

## Features Included
- Expanded tile world (180x180) with broader town, roads, lake, ridge passes, and deeper wilderness regions.
- A* click-to-move pathfinding, collision, destination marker.
- Minimap with fog-of-war-style discovery scaled for larger maps.
- Inventory (28 slots), equipment, skills, combat tab.
- Bank UI with deposit/withdraw.
- Skilling tick loop (600ms), tool requirements, depletion/respawn.
- Basic combat formulas, NPC aggro/roaming, drops, respawn.
- Local save/load using `localStorage`.
- Debug mode + lightweight sound beeps.
- Improved tile/object shading and sprite detail for a clearer retro look.

## Data Files
- `data/items.json`
- `data/npcs.json`
- `data/world.json`

These are reference content definitions and can be extended; runtime data currently mirrors them in JS modules for file:// compatibility.

## Extend the Project
- Add crafting systems (smelting/cooking) as additional node actions.
- Add shops + economy sinks with buy/sell pricing and taxes.
- Add quests by introducing a `quests` array in save state and condition checks.

## Next Steps: Multiplayer
1. Add a small WebSocket server (Node or Deno) that owns authoritative entity state.
2. Send player input commands (`walk`, `attack`, `interact`) to server instead of applying locally.
3. Broadcast periodic snapshots (or delta updates) to clients.
4. Keep client-side interpolation for smooth movement while respecting server truth.
5. Add account/session auth and anti-cheat validation on server actions.
