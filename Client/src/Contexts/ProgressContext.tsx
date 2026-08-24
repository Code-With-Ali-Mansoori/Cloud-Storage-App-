import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useRef,
} from "react";

export interface ProgressContextValue {
  active: boolean;
  total: number;
  completed: number;
  percent: number;
  start: (t: number) => void;
  step: (count?: number) => void;
  finish: () => void;
  reset: () => void;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [active, setActive] = useState<boolean>(false);
  const [total, setTotal] = useState<number>(0);
  const [completed, setCompleted] = useState<number>(0);
  const totalRef = useRef<number>(0);

  const percent = total ? Math.round((completed / total) * 100) : 0;

  const start = useCallback((t: number) => {
    totalRef.current = t;
    setTotal(t);
    setCompleted(0);
    setActive(t > 0);
  }, []);

  const step = useCallback((count: number = 1) => {
    setCompleted((c) => {
      const next = c + count;
      const cap = totalRef.current > 0 ? totalRef.current : next;
      return next > cap ? cap : next;
    });
  }, []);

  const finish = useCallback(() => {
    setCompleted(() => totalRef.current);
    setActive(false);
  }, []);

  const reset = useCallback(() => {
    setActive(false);
    setTotal(0);
    setCompleted(0);
    totalRef.current = 0;
  }, []);

  const value = useMemo(
    () => ({ active, total, completed, percent, start, step, finish, reset }),
    [active, total, completed, percent, start, step, finish, reset]
  );

  return (
    <ProgressContext.Provider value={value}>
      {children}
    </ProgressContext.Provider>
  );
}

export function useGlobalProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext);
  if (!ctx)
    throw new Error("useGlobalProgress must be used within ProgressProvider");
  return ctx;
}
