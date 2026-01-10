type AuthListener = () => void;

const unauthorizedListeners = new Set<AuthListener>();

export const authEvents = {
  onUnauthorized: (listener: AuthListener) => {
    unauthorizedListeners.add(listener);
    return () => {
      unauthorizedListeners.delete(listener);
    };
  },
  emitUnauthorized: () => {
    unauthorizedListeners.forEach((listener) => listener());
  },
};
