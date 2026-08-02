import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
} from "react";

interface TabRefreshContextType {
  refreshing: boolean;
  onRefresh: () => Promise<void>;
  registerRefreshHandler: (handler: () => Promise<void> | void) => () => void;
}

const TabRefreshContext = createContext<TabRefreshContextType>({
  refreshing: false,
  onRefresh: async () => {},
  registerRefreshHandler: () => () => {},
});

export const TabRefreshProvider: React.FC<{
  children: React.ReactNode;
  onGlobalRefresh?: () => Promise<void>;
}> = ({ children, onGlobalRefresh }) => {
  const [refreshing, setRefreshing] = useState(false);
  const handlersRef = useRef<Set<() => Promise<void> | void>>(new Set());

  const registerRefreshHandler = useCallback(
    (handler: () => Promise<void> | void) => {
      handlersRef.current.add(handler);
      return () => {
        handlersRef.current.delete(handler);
      };
    },
    [],
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (onGlobalRefresh) {
        await onGlobalRefresh();
      }
      const promises = Array.from(handlersRef.current).map(async (fn) => {
        try {
          await fn();
        } catch (e) {
          console.warn("Refresh handler error:", e);
        }
      });
      await Promise.all(promises);
    } catch (e) {
      console.warn("Global refresh error:", e);
    } finally {
      setTimeout(() => setRefreshing(false), 600);
    }
  }, [onGlobalRefresh]);

  return (
    <TabRefreshContext.Provider
      value={{ refreshing, onRefresh, registerRefreshHandler }}
    >
      {children}
    </TabRefreshContext.Provider>
  );
};

export const useTabRefresh = () => useContext(TabRefreshContext);
