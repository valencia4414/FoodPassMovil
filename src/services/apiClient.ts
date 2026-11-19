// src/services/apiClient.ts
//
// Cliente HTTP centralizado con interceptores de autenticación y almacenamiento seguro.

import axios, { InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

export const TOKEN_KEY = 'foodpass_jwt_token';
export const USER_DATA_KEY = 'foodpass_user_data';

/**
 * Resuelve dinámicamente la IP y puerto del backend para que cualquier integrante
 * del equipo pueda probar la app desde su equipo sin modificar código ni IP fija.
 */
export function resolveApiBaseUrl(): string {
  // 1. Si existe variable de entorno con IP explícita válida, usarla
  if (process.env.EXPO_PUBLIC_API_URL && !process.env.EXPO_PUBLIC_API_URL.includes('192.168.101.11')) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // 2. Si se ejecuta en navegador Web, usar el mismo hostname del navegador
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location) {
    const host = window.location.hostname || 'localhost';
    return `http://${host}:3000/api`;
  }

  // 3. Extraer automáticamente la IP de la máquina de desarrollo de quien corre Metro / Expo Go
  const candidates = [
    Constants.expoConfig?.hostUri,
    (Constants as any)?.expoGoConfig?.debuggerHost,
    (Constants as any)?.manifest2?.extra?.expoGo?.debuggerHost,
    (Constants as any)?.manifest2?.extra?.expoClient?.hostUri,
    (Constants as any)?.manifest?.debuggerHost,
    Constants.linkingUri,
    (Constants as any)?.experienceUrl,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate) {
      const match = candidate.match(/(?:exp:\/\/|http:\/\/|https:\/\/)?([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3})/);
      if (match && match[1] && match[1] !== '127.0.0.1' && match[1] !== '10.0.2.2') {
        return `http://${match[1]}:3000/api`;
      }
    }
  }

  // 4. Fallback para red local (IP del servidor de desarrollo)
  return 'http://192.168.1.2:3000/api';
}

export const API_BASE_URL = resolveApiBaseUrl();

// ──────────────────────────────────────────────
// Capa de Almacenamiento Seguro Multiplataforma
// ──────────────────────────────────────────────
const safeStorage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      try {
        return typeof window !== 'undefined' && window.localStorage ? window.localStorage.getItem(key) : null;
      } catch (error) {
        console.warn(`[safeStorage] Error al leer ${key}:`, error);
        return null;
      }
    }
    return await SecureStore.getItemAsync(key);
  },

  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
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
        if (typeof window !== 'undefined' && window.localStorage) {
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

// ──────────────────────────────────────────────
// Interceptor de REQUEST
// ──────────────────────────────────────────────
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Asegurar que baseURL esté actualizada dinámicamente
    const currentBase = resolveApiBaseUrl();
    if (!config.baseURL || config.baseURL.includes('10.0.2.2') || config.baseURL.includes('192.168.101.11')) {
      config.baseURL = currentBase;
    }

    try {
      // Evita duplicar /api cuando una ruta ya incluye ese prefijo.
      if (config.url?.startsWith('/api/')) {
        config.url = config.url.replace(/^\/api/, '');
      }

      const token = await safeStorage.getItem(TOKEN_KEY);
      if (token) {
        config.headers.Authorization = 'Bearer ' + token;
      }
    } catch (error) {
      console.warn('[apiClient] No se pudo leer el token de almacenamiento:', error);
    }

    console.log(
      '[apiClient] 🚀 ' + (config.method || 'GET').toUpperCase() + ' ' + (config.baseURL || '') + (config.url || ''),
      config.headers.Authorization ? '(con Bearer)' : '(sin token)'
    );

    return config;
  },
  (error: any) => Promise.reject(error)
);

// ──────────────────────────────────────────────
// Interceptor de RESPONSE
// ──────────────────────────────────────────────
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: any) => {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;

      if (status === 401) {
        console.warn('[apiClient] Token inválido o expirado (401). Limpiando sesión...');
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

// ──────────────────────────────────────────────
// Helpers de Almacenamiento Seguro
// ──────────────────────────────────────────────
export async function saveToken(token: string): Promise<void> {
  await safeStorage.setItem(TOKEN_KEY, token);
}

export async function getToken(): Promise<string | null> {
  return await safeStorage.getItem(TOKEN_KEY);
}

export async function removeToken(): Promise<void> {
  await safeStorage.deleteItem(TOKEN_KEY);
}

export async function saveUserData<T = unknown>(userData: T): Promise<void> {
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
