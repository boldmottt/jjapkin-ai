// Patched tunnel-rat — zustand 제거, useSyncExternalStore + queueMicrotask
// 모든 setState 호출을 queueMicrotask로 감싸 React commit phase 충돌 방지
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

      // MOUNT: version++ 을 microtask로 지연
      React.useLayoutEffect(() => {
        queueMicrotask(() => {
          store.setState((s) => ({ ...s, version: s.version + 1 }));
        });
      }, []);

      const version = ts.version;
      // MOUNT: 자식 추가도 microtask로 / CLEANUP: 자식 제거도 microtask로
      React.useLayoutEffect(() => {
        queueMicrotask(() => {
          store.setState((s) => ({ ...s, current: [...s.current, children] }));
        });
        return () => {
          queueMicrotask(() => {
            store.setState((s) => ({
              ...s,
              current: s.current.filter((c) => c !== children),
            }));
          });
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
