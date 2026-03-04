import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface SystemConfig {
  prontoPagoEnabled: boolean;
  prontoPagoFeeRate: number;
  isLoading: boolean;
}

const defaultConfig: SystemConfig = {
  prontoPagoEnabled: true,
  prontoPagoFeeRate: 0.08,
  isLoading: true,
};

const SystemConfigContext = createContext<SystemConfig>(defaultConfig);

/**
 * System Configuration Provider
 * TODO: Replace mock with real API call to GET /api/config
 */
export const SystemConfigProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<SystemConfig>(defaultConfig);

  useEffect(() => {
    // TODO: Fetch from real API
    // Mock: use defaults after simulated load
    const timer = setTimeout(() => {
      setConfig({
        prontoPagoEnabled: true,
        prontoPagoFeeRate: 0.08,
        isLoading: false,
      });
    }, 200);

    return () => clearTimeout(timer);
  }, []);

  return (
    <SystemConfigContext.Provider value={config}>
      {children}
    </SystemConfigContext.Provider>
  );
};

export const useSystemConfig = () => {
  const context = useContext(SystemConfigContext);
  if (!context) {
    throw new Error('useSystemConfig must be used within a SystemConfigProvider');
  }
  return context;
};

export default SystemConfigContext;
