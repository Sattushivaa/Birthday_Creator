/** Tiny toast store — no provider ceremony, just events. */
let listeners = [];
let id = 0;

function emit(toast) {
  listeners.forEach((fn) => fn(toast));
}

export function toast(message, type = 'success') {
  const t = { id: ++id, message, type };
  emit(t);
  setTimeout(() => emit({ ...t, dismiss: true }), 3000);
}

export function subscribeToasts(fn) {
  listeners.push(fn);
  return () => {
    listeners = listeners.filter((l) => l !== fn);
  };
}

export { }; // keep module graph happy