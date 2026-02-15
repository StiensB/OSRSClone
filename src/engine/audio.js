let ctx;
function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  return ctx;
}

export function beep(freq = 440, length = 0.07, type = 'square', gain = 0.04) {
  try {
    const c = getCtx();
    const o = c.createOscillator();
    const g = c.createGain();
    o.frequency.value = freq;
    o.type = type;
    g.gain.value = gain;
    o.connect(g).connect(c.destination);
    o.start();
    o.stop(c.currentTime + length);
  } catch (_) {}
}
