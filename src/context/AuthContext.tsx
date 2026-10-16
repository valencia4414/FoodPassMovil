// src/context/AuthContext.tsx
//
// Contexto de React para manejar el estado de autenticación de forma global.
//
// Este contexto:
// 1. Almacena el estado de sesión (isAuth, token, userData).
// 2. Persiste el token JWT en SecureStore (almacenamiento seguro del dispositivo).
// 3. Al iniciar la app, intenta restaurar la sesión desde SecureStore.
// 4. Expone funciones login() y logout() que cualquier pantalla puede usar.
// 5. El estado "isLoading" evita flashes de login mientras se restaura la sesión.
//
// Uso:
//   import { useAuth } from '../context/AuthContext';
//   const { isAuth, userData, login, logout } = useAuth();

import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import {
  saveToken,
  getToken,
  removeToken,
  saveUserData as saveUserDataToStore,
  getUserData as getUserDataFromStore,
  clearSession,
} from '../services/apiClient';

// ──────────────────────────────────────────────
// Tipos
// ──────────────────────────────────────────────

// Datos del usuario que se almacenan en la sesión.
export interface UserData {
  id: string | number;
  name: string;
  email: string;
  role: string;
  telefono?: string | null;
  direccion?: string | null;
  avatar?: string;
  plan?: string;
  membresia?: string;
  puntos_fp?: number;
}

// Forma del contexto de autenticación.
interface AuthContextType {
  /** Indica si el usuario tiene una sesión activa */
  isAuth: boolean;

  /** Token JWT de la sesión actual (null si no hay sesión) */
  token: string | null;

  /** Datos del usuario logueado (null si no hay sesión) */
  userData: UserData | null;

  /** True mientras se restaura la sesión al arrancar la app */
  isLoading: boolean;

  /**
   * Inicia sesión guardando el token y datos del usuario.
   * En una app real, recibirías estos datos de la respuesta del API.
   */
  login: (token: string, user: UserData) => Promise<void>;

  /** Cierra sesión eliminando todos los datos de SecureStore */
  logout: () => Promise<void>;

  /** Actualiza parcialmente los datos del usuario en sesión y almacenamiento */
  updateUser: (updated: Partial<UserData>) => Promise<void>;
}

// ──────────────────────────────────────────────
// Contexto
// ──────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ──────────────────────────────────────────────
// Provider
// ──────────────────────────────────────────────

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuth, setIsAuth] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ── Restaurar sesión al arrancar la app ──
  // useEffect se ejecuta una sola vez cuando el componente se monta.
  // Revisa si hay un token guardado en SecureStore y restaura la sesión.
  useEffect(() => {
    async function restoreSession() {
      try {
        const storedToken = await getToken();
        const storedUserData = await getUserDataFromStore<UserData>();

        if (storedToken && storedUserData) {
          // Si encontramos token y datos, restauramos la sesión.
          setToken(storedToken);
          setUserData(storedUserData);
          setIsAuth(true);

          if (typeof __DEV__ !== 'undefined' && __DEV__) {
            console.log('[AuthContext] Sesión restaurada desde SecureStore');
          }
        } else {
          if (typeof __DEV__ !== 'undefined' && __DEV__) {
            console.log('[AuthContext] No se encontró sesión previa');
          }
        }
      } catch (error) {
        // Si falla la lectura de SecureStore, no hay sesión.
        console.warn('[AuthContext] Error al restaurar sesión:', error);
      } finally {
        // Terminamos de cargar sin importar el resultado.
        setIsLoading(false);
      }
    }

    restoreSession();
  }, []);

  // ── Login ──
  // Guarda el token y datos del usuario tanto en el estado de React
  // como en SecureStore para persistencia.
  const login = useCallback(async (newToken: string, user: UserData) => {
    try {
      // Guardar en SecureStore (persistencia entre reinicios de app)
      await saveToken(newToken);
      await saveUserDataToStore(user);

      // Actualizar estado de React (re-render inmediato)
      setToken(newToken);
      setUserData(user);
      setIsAuth(true);

      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.log('[AuthContext] Login exitoso para:', user.email);
      }
    } catch (error) {
      console.error('[AuthContext] Error durante el login:', error);
      throw error;
    }
  }, []);

  // ── Logout ──
  // Limpia todo: SecureStore + estado de React.
  const logout = useCallback(async () => {
    try {
      // Limpiar SecureStore
      await clearSession();
    } catch (error) {
      console.warn('[AuthContext] Error al limpiar SecureStore durante logout:', error);
    } finally {
      // Siempre limpiar el estado, incluso si SecureStore falla.
      setToken(null);
      setUserData(null);
      setIsAuth(false);

      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.log('[AuthContext] Sesión cerrada');
      }
    }
  }, []);

  // ── Actualizar perfil del usuario (T11 - RFM12) ──
  const updateUser = useCallback(async (updated: Partial<UserData>) => {
    setUserData((prev) => {
      if (!prev) return null;
      const merged = { ...prev, ...updated };
      saveUserDataToStore(merged).catch((err) =>
        console.warn('[AuthContext] Error al persistir datos actualizados:', err)
      );
      return merged;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ isAuth, token, userData, isLoading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

// ──────────────────────────────────────────────
// Hook personalizado
// ──────────────────────────────────────────────

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};
