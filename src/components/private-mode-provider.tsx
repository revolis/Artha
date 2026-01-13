"use client";

import * as React from "react";

type PrivateModeContextValue = {
  enabled: boolean;
  toggle: () => void;
  setEnabled: (value: boolean) => void;
};

const PrivateModeContext = React.createContext<PrivateModeContextValue | undefined>(
  undefined
);

export function PrivateModeProvider({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabled] = React.useState(false);

  const toggle = React.useCallback(() => {
    setEnabled((prev) => !prev);
  }, []);

  const value = React.useMemo(
    () => ({ enabled, toggle, setEnabled }),
    [enabled, toggle]
  );

  return (
    <PrivateModeContext.Provider value={value}>{children}</PrivateModeContext.Provider>
  );
}

export function usePrivateMode() {
  const context = React.useContext(PrivateModeContext);
  if (!context) {
    throw new Error("usePrivateMode must be used within PrivateModeProvider");
  }
  return context;
}
