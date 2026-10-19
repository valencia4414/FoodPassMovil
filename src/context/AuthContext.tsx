// src/context/AuthContext.tsx
//
// Contexto de React para manejar el estado de autenticación de forma global.

import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
} from 'react';

import {
  saveToken,
  getToken,
  removeToken,
  saveUserData as saveUserDataToStore,
  getUserData as getUserDataFromStore,
  clearSession,
} from '../services/apiClient';

// Datos del usuario almacenados en la sesión.
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

// Tipo del contexto de autenticación (Una sola vez)
interface AuthContextType {
  isAuth: boolean;
  token: string | null;
  userData: UserData | null;
  isLoading: boolean;
  login: (token: string, user: UserData) => Promise<void>;
  updateUser: (updatedData: Partial<UserData>) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isAuth, setIsAuth] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restaurar la sesión al iniciar la aplicación.
  useEffect(() => {
    async function restoreSession() {
      try {
        const storedToken = await getToken();
        const storedUserData = await getUserDataFromStore<UserData>();

        if (storedToken && storedUserData) {
          setToken(storedToken);
          setUserData(storedUserData);
          setIsAuth(true);

          if (__DEV__) {
            console.log('[AuthContext] Sesión restaurada desde SecureStore');
          }
        } else {
          if (__DEV__) {
            console.log('[AuthContext] No se encontró sesión previa');
          }
        }
      } catch (error) {
        console.warn(
          '[AuthContext] Error al restaurar sesión:',
          error,
        );
      } finally {
        setIsLoading(false);
      }
    }

    restoreSession();
  }, []);

  // Iniciar sesión.
  const login = useCallback(
    async (newToken: string, user: UserData) => {
      try {
        await saveToken(newToken);
        await saveUserDataToStore(user);

        setToken(newToken);
        setUserData(user);
        setIsAuth(true);

        if (__DEV__) {
          console.log('[AuthContext] Login exitoso para:', user.email);
        }
      } catch (error) {
        console.error('[AuthContext] Error durante el login:', error);
        throw error;
      }
    },
    [],
  );

  // Actualizar los datos del usuario en el estado y almacenamiento local (Una sola versión robusta).
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

  // Cerrar sesión.
  const logout = useCallback(async () => {
    try {
      await clearSession();
    } catch (error) {
      console.warn(
        '[AuthContext] Error al limpiar SecureStore durante logout:',
        error,
      );
    } finally {
      setToken(null);
      setUserData(null);
      setIsAuth(false);

      if (__DEV__) {
        console.log('[AuthContext] Sesión cerrada');
      }
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuth,
        token,
        userData,
        isLoading,
        login,
        updateUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook personalizado.
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }

  return context;
};