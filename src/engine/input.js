export function createInput(canvas) {
  const state = { mouseX: 0, mouseY: 0, click: null, hover: null };
  canvas.addEventListener('mousemove', (e) => {
    const r = canvas.getBoundingClientRect();
    state.mouseX = e.clientX - r.left;
    state.mouseY = e.clientY - r.top;
  });
  canvas.addEventListener('click', (e) => {
    const r = canvas.getBoundingClientRect();
    state.click = { x: e.clientX - r.left, y: e.clientY - r.top };
  });
  return state;
}
