// Patched tunnel-rat — zustand 제거, useSyncExternalStore 사용 (ESM)
import React from "react";

function createStore(initial) {
  let state = initial;
  const listeners = new Set();

  return {
    getState() { return state; },
    setState(updater) {
      const next = typeof updater === "function" ? updater(state) : updater;
      if (Object.is(next, state)) return;
      state = next;
      listeners.forEach((l) => l());
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

function tunnel() {
  const store = createStore({ current: [], version: 0 });

  return {
    In({ children }) {
      const getSnapshot = React.useCallback(() => store.getState(), []);
      const ts = React.useSyncExternalStore(store.subscribe, getSnapshot);

      React.useLayoutEffect(() => {
        store.setState((s) => ({ ...s, version: s.version + 1 }));
      }, []);

      const version = ts.version;
      React.useLayoutEffect(() => {
        store.setState((s) => ({ ...s, current: [...s.current, children] }));
        return () => {
          store.setState((s) => ({
            ...s,
            current: s.current.filter((c) => c !== children),
          }));
        };
      }, [children, version]);

      return null;
    },

    Out() {
      const getSnapshot = React.useCallback(() => store.getState().current, []);
      const current = React.useSyncExternalStore(store.subscribe, getSnapshot);
      return React.createElement(React.Fragment, null, ...current);
    },
  };
}

export { tunnel };
export default tunnel;
