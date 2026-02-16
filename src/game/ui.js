import { combatLevel } from '../engine/utils.js';
import { ITEMS, SKILL_NAMES } from './data.js';
import { addItem, toggleEquip, unequipSlot } from './systems.js';

export function createUi(state) {
  const tabContent = document.getElementById('tabContent');
  const chatLog = document.getElementById('chatLog');
  const tooltip = document.getElementById('tooltip');
  const bankModal = document.getElementById('bankModal');

  const ui = {
    activeTab: 'inventory',
    openBank: () => { bankModal.classList.remove('hidden'); renderBank(); },
    chat: (msg, muted=false) => {
      if (muted && Math.random() > 0.18) return;
      const line = document.createElement('div');
      line.textContent = msg;
      chatLog.appendChild(line); chatLog.scrollTop = chatLog.scrollHeight;
    },
    render: () => {
      renderTop(state);
      renderTab();
      if (!bankModal.classList.contains('hidden')) renderBank();
    },
    tooltip,
  };

  document.querySelectorAll('#tabButtons button[data-tab]').forEach((b) => b.addEventListener('click', () => {
    document.querySelectorAll('#tabButtons button[data-tab]').forEach((x) => x.classList.remove('active'));
    b.classList.add('active'); ui.activeTab = b.dataset.tab; renderTab();
  }));
  document.getElementById('closeBank').onclick = () => bankModal.classList.add('hidden');
  document.getElementById('chatInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) { ui.chat(`Astra: ${e.target.value.trim()}`); e.target.value = ''; }
  });

  window.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'i') switchTab('inventory');
    if (e.key.toLowerCase() === 's') switchTab('skills');
    if (e.key.toLowerCase() === 'e') switchTab('equipment');
  });

  function switchTab(tab) {
    ui.activeTab = tab;
    document.querySelectorAll('#tabButtons button[data-tab]').forEach((x) => x.classList.toggle('active', x.dataset.tab === tab));
    renderTab();
  }

  function renderTop(s) {
    const hpPct = (s.player.hp / s.player.maxHp) * 100;
    document.getElementById('hpBar').style.width = `${hpPct}%`;
    document.getElementById('hpText').textContent = `${Math.max(0, Math.floor(s.player.hp))}/${s.player.maxHp}`;
    document.getElementById('combatLevel').textContent = `CB ${combatLevel(s.player.skills)}`;
  }

  function renderTab() {
    if (ui.activeTab === 'inventory') {
      tabContent.innerHTML = '<p>Click gear to equip it. Equip the Bronze Hatchet, then click a tree to chop logs.</p><div class="grid28"></div>';
      const g = tabContent.querySelector('.grid28');
      for (let i = 0; i < 28; i++) {
        const s = state.player.inventory[i];
        const d = document.createElement('div'); d.className = 'slot';
        if (s) {
          const item = ITEMS[s.itemId];
          const isEquipped = item.slot && state.player.equipment[item.slot] === s.itemId;
          d.textContent = item.name;
          if (item.slot) d.textContent += ' (equip)';
          if (s.qty > 1) d.innerHTML += `<span class="qty">${s.qty}</span>`;
          if (isEquipped) d.style.outline = '2px solid #d4a045';
          addTip(d, `${item.name}: ${item.description}${item.slot ? ` | Slot: ${item.slot}. Click to equip.` : ''}`);
          if (item.slot) d.onclick = () => { if (toggleEquip(state, i)) ui.render(); };
        }
        g.appendChild(d);
      }
    }
    if (ui.activeTab === 'equipment') {
      tabContent.innerHTML = '<p>Click an equipped slot to unequip.</p><div id="eq"></div>';
      const slots = ['weapon','shield','helm','body','legs','boots','amulet','cape','ring'];
      const eq = document.getElementById('eq');
      slots.forEach((slot) => {
        const row = document.createElement('div'); row.className = 'skillRow';
        const equipped = state.player.equipment[slot];
        row.innerHTML = `<span>${slot.toUpperCase()}</span><span>${equipped ? ITEMS[equipped].name : '-'}</span>`;
        if (equipped) {
          row.style.cursor = 'pointer';
          row.onclick = () => { if (unequipSlot(state, slot)) ui.render(); };
          addTip(row, `Click to unequip ${ITEMS[equipped].name}.`);
        }
        eq.appendChild(row);
      });
    }
    if (ui.activeTab === 'skills') {
      tabContent.innerHTML = '<div id="skills"></div>';
      const box = document.getElementById('skills');
      let total = 0;
      SKILL_NAMES.forEach((k) => {
        total += state.player.skills[k].level;
        const row = document.createElement('div'); row.className = 'skillRow';
        row.style.background = state.player.skills[k].flash > 0 ? 'rgba(236,196,84,.25)' : '';
        row.innerHTML = `<span>${k}</span><span>Lv ${state.player.skills[k].level}</span>`;
        addTip(row, `${k} XP: ${state.player.skills[k].xp}`);
        box.appendChild(row);
      });
      const t = document.createElement('div'); t.className = 'skillRow'; t.innerHTML = `<strong>Total</strong><strong>${total}</strong>`; box.appendChild(t);
    }
    if (ui.activeTab === 'combat') {
      tabContent.innerHTML = `<p>Style: Balanced Training</p><p>Weapon speed: 1.8s</p><p>Tip: Click any creature to engage.</p><p>Woodcutting tip: equip a hatchet before clicking trees.</p>`;
    }
  }

  function renderBank() {
    const inv = document.getElementById('bankInventory');
    const bank = document.getElementById('bankStorage');
    inv.className = bank.className = 'listGrid';
    inv.innerHTML = ''; bank.innerHTML = '';
    state.player.inventory.forEach((s, idx) => {
      const b = document.createElement('div'); b.className = 'slot'; b.textContent = `${ITEMS[s.itemId].name} x${s.qty}`;
      b.onclick = () => { const moved = state.player.inventory.splice(idx, 1)[0]; mergeToBank(moved); renderBank(); ui.render(); };
      inv.appendChild(b);
    });
    state.player.bank.forEach((s, idx) => {
      const b = document.createElement('div'); b.className = 'slot'; b.textContent = `${ITEMS[s.itemId].name} x${s.qty}`;
      b.onclick = () => {
        if (addItem(state.player.inventory, s.itemId, s.qty)) state.player.bank.splice(idx, 1);
        renderBank(); ui.render();
      };
      bank.appendChild(b);
    });
  }

  function mergeToBank(item) {
    const ex = state.player.bank.find((s) => s.itemId === item.itemId);
    if (ex) ex.qty += item.qty; else state.player.bank.push(item);
  }

  function addTip(el, text) {
    el.onmouseenter = (e) => { tooltip.textContent = text; tooltip.style.left = `${e.pageX + 10}px`; tooltip.style.top = `${e.pageY + 10}px`; tooltip.classList.remove('hidden'); };
    el.onmouseleave = () => tooltip.classList.add('hidden');
  }

  return ui;
}
