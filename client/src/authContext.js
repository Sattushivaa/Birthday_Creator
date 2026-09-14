import { createContext, useContext } from 'react';

export const AuthContext = createContext({ auth: { checked: false, authenticated: false }, setAuth: () => {} });

export function useAuth() {
  return useContext(AuthContext);
}