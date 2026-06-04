// Runs once when the Next.js server boots (Node runtime).
//
// Node 25+ exposes an experimental global `localStorage` that throws unless the
// process was started with `--localstorage-file=<path>`. Server-side rendering
// libraries feature-detect `typeof localStorage !== "undefined"` and then call
// `localStorage.getItem(...)`, which throws on Node 25 and 500s the page.
//
// On Vercel / Node 20–22 `localStorage` simply isn't a global, so SSR skips it.
// Here we reproduce that safe state by removing the broken global when present.
export function register() {
  try {
    const ls = (globalThis as { localStorage?: unknown }).localStorage;
    if (!ls) return;
    let ok = false;
    try {
      ok = typeof (ls as Storage).getItem === "function";
    } catch {
      ok = false;
    }
    if (!ok) {
      Object.defineProperty(globalThis, "localStorage", {
        value: undefined,
        configurable: true,
        writable: true,
      });
    }
  } catch {
    /* never block server startup */
  }
}
