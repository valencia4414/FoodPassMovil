// src/services/apiClient.ts
//
// Cliente HTTP centralizado con interceptores de autenticación.
//
// Este archivo crea una instancia de Axios preconfigurada que:
// 1. Usa una baseURL común para todas las peticiones al backend.
// 2. Inyecta automáticamente el token JWT almacenado en SecureStore
//    en cada petición saliente (interceptor de request).
// 3. Maneja errores de autenticación (401) de forma centralizada
//    (interceptor de response).
//
// Uso desde cualquier pantalla o servicio:
//   import { apiClient } from '../services/apiClient';
//   const response = await apiClient.get('/menu');
//

import axios, { InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// ──────────────────────────────────────────────
// Constantes
// ──────────────────────────────────────────────

// Clave bajo la cual se almacena el token JWT en SecureStore.
// Se exporta para que otros módulos (AuthContext) usen la misma clave.
export const TOKEN_KEY = 'foodpass_jwt_token';

// Clave para almacenar los datos del usuario como JSON string.
export const USER_DATA_KEY = 'foodpass_user_data';


// URL base del backend.
// En desarrollo con emulador Android se usa 10.0.2.2 (alias del host local).
// En iOS, Web y pruebas se usa localhost:3000/api.
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  (Platform.OS === 'android' ? 'http://10.0.2.2:3000/api' : 'http://localhost:3000/api');


// URL base del backend FoodPass.
// - En Android emulator: http://10.0.2.2:3000/api
// - En Web, iOS y entorno local: http://localhost:3000/api
const API_BASE_URL = Platform.select({
  android: 'http://10.0.2.2:3000/api',
  default: 'http://localhost:3000/api',
});


// ──────────────────────────────────────────────
// Capa de Almacenamiento Seguro Multiplataforma
// ──────────────────────────────────────────────
// En iOS y Android utiliza expo-secure-store (cifrado con Keychain / Keystore).
// En Web utiliza localStorage como fallback porque SecureStore no es soportado en navegadores.

const safeStorage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      try {
        return typeof window !== 'undefined' && window.localStorage ? window.localStorage.getItem(key) : null;
      } catch (err) {
        console.warn(`[safeStorage] Error al leer ${key} de localStorage:`, err);
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
      } catch (err) {
        console.warn(`[safeStorage] Error al guardar ${key} en localStorage:`, err);
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
      } catch (err) {
        console.warn(`[safeStorage] Error al eliminar ${key} de localStorage:`, err);
      }
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};

// ──────────────────────────────────────────────
// Instancia de Axios
// ──────────────────────────────────────────────

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // 15 segundos de timeout
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// ──────────────────────────────────────────────
// Interceptor de REQUEST
// ──────────────────────────────────────────────
// Se ejecuta ANTES de cada petición HTTP.
// Su trabajo es leer el token JWT de SecureStore e inyectarlo
// en la cabecera Authorization como Bearer token.

apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      // Normalizar URL si comienza con /api/ para no duplicar con baseURL
      if (config.url?.startsWith('/api/')) {
        config.url = config.url.replace(/^\/api/, '');
      }

      // Leemos el token de forma asíncrona desde el almacenamiento seguro.
      const token = await safeStorage.getItem(TOKEN_KEY);

      if (token) {
        // Si hay token, lo añadimos a la cabecera Authorization.
        // El formato "Bearer <token>" es el estándar para JWT.
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      // Si el almacenamiento falla, continuamos sin token para no bloquear la petición.
      console.warn('[apiClient] No se pudo leer el token de almacenamiento:', error);
    }

    // Log para desarrollo — muestra cada petición que sale de la app.
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.log(
        `[apiClient] → ${config.method?.toUpperCase()} ${config.baseURL || ''}${config.url || ''}`,
        config.headers.Authorization ? '(con token Bearer)' : '(sin token)'
      );
    }

    return config;
  },
  (error: any) => {
    // Si hay un error al preparar la petición, lo rechazamos.
    return Promise.reject(error);
  }
);

// ──────────────────────────────────────────────
// Interceptor de RESPONSE
// ──────────────────────────────────────────────
// Se ejecuta DESPUÉS de cada respuesta HTTP.
// Maneja errores comunes de forma centralizada.

apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Si la respuesta es exitosa (2xx), la devolvemos tal cual.
    return response;
  },
  async (error: any) => {
    const status = error.response?.status;

    if (status === 401) {
      // 401 Unauthorized — El token expiró o es inválido.
      // Limpiamos el token almacenado para que el usuario sea
      // redirigido al login por el AuthContext.
      console.warn('[apiClient] Token expirado o inválido (401). Limpiando sesión...');
      try {
        await safeStorage.deleteItem(TOKEN_KEY);
        await safeStorage.deleteItem(USER_DATA_KEY);
      } catch (cleanupError) {
        console.warn('[apiClient] Error al limpiar almacenamiento tras 401:', cleanupError);
      }

      // Nota: La redirección al login se maneja desde el AuthContext,
      // no desde aquí. Este interceptor solo limpia los datos.
    }

    if (status === 403) {
      console.warn('[apiClient] Acceso denegado (403).');
    }

    if (status === 500) {
      console.error('[apiClient] Error interno del servidor (500).');
    }

    // Re-lanzamos el error para que el código que hizo la petición
    // pueda manejarlo con su propio try/catch.
    return Promise.reject(error);
  }
);

// ──────────────────────────────────────────────
// Helpers de Almacenamiento Seguro
// ──────────────────────────────────────────────
// Funciones utilitarias para guardar/leer/borrar tokens y datos de usuario.
// Centralizamos aquí para no repetir lógica en múltiples archivos.

/**
 * Guarda el token JWT en el almacenamiento seguro del dispositivo.
 */
export async function saveToken(token: string): Promise<void> {
  await safeStorage.setItem(TOKEN_KEY, token);
}

/**
 * Lee el token JWT del almacenamiento seguro.
 * Retorna null si no existe.
 */
export async function getToken(): Promise<string | null> {
  return await safeStorage.getItem(TOKEN_KEY);
}

/**
 * Elimina el token JWT del almacenamiento seguro.
 */
export async function removeToken(): Promise<void> {
  await safeStorage.deleteItem(TOKEN_KEY);
}

/**
 * Guarda datos del usuario (como JSON string) en el almacenamiento seguro.
 */
export async function saveUserData<T = unknown>(userData: T): Promise<void> {
  await safeStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
}

/**
 * Lee los datos del usuario del almacenamiento seguro.
 * Retorna null si no existen.
 */
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

/**
 * Elimina todos los datos de sesión (token + userData) del almacenamiento seguro.
 */
export async function clearSession(): Promise<void> {
  await Promise.all([
    safeStorage.deleteItem(TOKEN_KEY),
    safeStorage.deleteItem(USER_DATA_KEY),
  ]);
}

export default apiClient;

