
import axios from 'axios';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export const TOKEN_KEY = 'foodpass_jwt_token';
export const USER_DATA_KEY = 'foodpass_user_data';

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  Platform.select({
    android: 'http://10.0.2.2:3000/api',
    default: 'http://localhost:3000/api',
  });

const safeStorage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      try {
        return typeof window !== 'undefined'
          ? window.localStorage.getItem(key)
          : null;
      } catch (error) {
        console.warn(`[safeStorage] Error al leer ${key}:`, error);
        return null;
      }
    }

    return SecureStore.getItemAsync(key);
  },

  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      try {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, value);
        }
      } catch (error) {
        console.warn(`[safeStorage] Error al guardar ${key}:`, error);
      }
      return;
    }

    await SecureStore.setItemAsync(key, value);
  },

  async deleteItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      try {
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem(key);
        }
      } catch (error) {
        console.warn(`[safeStorage] Error al eliminar ${key}:`, error);
      }
      return;
    }

    await SecureStore.deleteItemAsync(key);
  },
};

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

apiClient.interceptors.request.use(
  async (config) => {
    try {
      // Evita duplicar /api cuando una ruta ya incluye ese prefijo.
      if (config.url?.startsWith('/api/')) {
        config.url = config.url.replace(/^\/api/, '');
      }

      const token = await safeStorage.getItem(TOKEN_KEY);

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.warn('[apiClient] No se pudo leer el token:', error);
    }

    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.log(
        `[apiClient] ${config.method?.toUpperCase()} ${config.baseURL || ''}${config.url || ''}`,
        config.headers.Authorization ? '(con token Bearer)' : '(sin token)'
      );
    }

    return config;
  },
  (error: unknown) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;

      if (status === 401) {
        console.warn('[apiClient] Token inválido o expirado. Limpiando sesión.');

        try {
          await Promise.all([
            safeStorage.deleteItem(TOKEN_KEY),
            safeStorage.deleteItem(USER_DATA_KEY),
          ]);
        } catch (cleanupError) {
          console.warn('[apiClient] Error al limpiar la sesión:', cleanupError);
        }
      }

      if (status === 403) {
        console.warn('[apiClient] Acceso denegado (403).');
      }

      if (status === 500) {
        console.error('[apiClient] Error interno del servidor (500).');
      }
    }

    return Promise.reject(error);
  }
);

export async function saveToken(token: string): Promise<void> {
  await safeStorage.setItem(TOKEN_KEY, token);
}

export async function getToken(): Promise<string | null> {
  return safeStorage.getItem(TOKEN_KEY);
}

export async function removeToken(): Promise<void> {
  await safeStorage.deleteItem(TOKEN_KEY);
}

export async function saveUserData<T = unknown>(
  userData: T
): Promise<void> {
  await safeStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
}

export async function getUserData<T = unknown>(): Promise<T | null> {
  const data = await safeStorage.getItem(USER_DATA_KEY);

  if (data) {
    try {
      return JSON.parse(data) as T;
    } catch {
      return null;
    }
  }

  return null;
}

export async function clearSession(): Promise<void> {
  await Promise.all([
    safeStorage.deleteItem(TOKEN_KEY),
    safeStorage.deleteItem(USER_DATA_KEY),
  ]);
}

export default apiClient;
