import { Alert } from 'react-native';

export const fetchApi = async (url: string) => {
  try { // Tarea 55: Uso de try/catch
    const response = await fetch(url);

    // Tarea 61: Si la sesión expiró (401 o 419)
    if (response.status === 401 || response.status === 419) {
      Alert.alert("Sesión expirada", "Tu sesión expiró. Inicia sesión nuevamente.");
      return null;
    }

    if (!response.ok) {
      throw new Error("Error en el servidor");
    }

    return await response.json();

  } catch (error) {
    // Tarea 54: Mensaje amigable cuando falla o no responde el backend
    Alert.alert("Error de conexión", "No pudimos cargar la información. Intenta nuevamente más tarde.");
    return null;
  }
};