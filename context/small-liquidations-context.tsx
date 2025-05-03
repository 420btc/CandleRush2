import React, { createContext, useContext, useState, useEffect } from 'react';

interface SmallLiquidationsContextType {
  showSmall: boolean;
  setShowSmall: (value: boolean) => void;
}

const SmallLiquidationsContext = createContext<SmallLiquidationsContextType | undefined>(undefined);

export function SmallLiquidationsProvider({ children }: { children: React.ReactNode }) {
  const [showSmall, setShowSmall] = useState(false);

  useEffect(() => {
    // Intentar obtener el estado del localStorage
    const savedState = localStorage.getItem('showSmallLiquidations');
    if (savedState !== null) {
      setShowSmall(JSON.parse(savedState));
    }
  }, []);

  useEffect(() => {
    // Guardar el estado en localStorage cuando cambie
    localStorage.setItem('showSmallLiquidations', JSON.stringify(showSmall));
  }, [showSmall]);

  return (
    <SmallLiquidationsContext.Provider value={{ showSmall, setShowSmall }}>
      {children}
    </SmallLiquidationsContext.Provider>
  );
}

export function useSmallLiquidations() {
  const context = useContext(SmallLiquidationsContext);
  if (context === undefined) {
    throw new Error('useSmallLiquidations must be used within a SmallLiquidationsProvider');
  }
  return context;
}
