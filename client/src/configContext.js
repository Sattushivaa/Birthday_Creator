import { createContext, useContext } from 'react';

export const ConfigContext = createContext(null);

export function useConfig() {
  return useContext(ConfigContext);
}

export function useConfigValue(path) {
  const { config } = useConfig();
  const parts = path.split('.');
  let cur = config;
  for (const p of parts) cur = cur?.[p];
  return cur;
}