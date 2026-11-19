import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { apiClient } from './apiClient';

const PUSH_TOKEN_KEY = 'foodpass_expo_push_token';
const PUSH_ENABLED_KEY = 'foodpass_push_notifications_enabled';

export async function getPushNotificationsEnabled(): Promise<boolean> {
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
    return false;
  }

  const preference = await SecureStore.getItemAsync(PUSH_ENABLED_KEY);
  return preference !== 'false';
}

export async function registerPushToken(): Promise<string | null> {
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#2563EB',
    });
  }

  const currentPermission = await Notifications.getPermissionsAsync();
  let permissionStatus = currentPermission.status;

  if (permissionStatus !== 'granted') {
    const requestedPermission = await Notifications.requestPermissionsAsync();
    permissionStatus = requestedPermission.status;
  }

  if (permissionStatus !== 'granted') {
    return null;
  }

  const projectId =
    process.env.EXPO_PUBLIC_EAS_PROJECT_ID ||
    Constants.easConfig?.projectId ||
    Constants.expoConfig?.extra?.eas?.projectId;

  if (!projectId) {
    throw new Error(
      'Falta el EAS Project ID. Configura EXPO_PUBLIC_EAS_PROJECT_ID para habilitar notificaciones push.'
    );
  }

  const token = (
    await Notifications.getExpoPushTokenAsync({ projectId })
  ).data;

  await apiClient.post('/push-tokens', {
    token,
    platform: Platform.OS,
  });
  await SecureStore.setItemAsync(PUSH_TOKEN_KEY, token);

  return token;
}

export async function unregisterPushToken(): Promise<void> {
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
    return;
  }

  const token = await SecureStore.getItemAsync(PUSH_TOKEN_KEY);
  if (!token) {
    return;
  }

  await apiClient.delete('/push-tokens', { data: { token } });
  await SecureStore.deleteItemAsync(PUSH_TOKEN_KEY);
}

export async function setPushNotificationsEnabled(
  enabled: boolean
): Promise<boolean> {
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
    return false;
  }

  if (!enabled) {
    await unregisterPushToken();
    await SecureStore.setItemAsync(PUSH_ENABLED_KEY, 'false');
    return true;
  }

  const token = await registerPushToken();
  if (!token) {
    await SecureStore.setItemAsync(PUSH_ENABLED_KEY, 'false');
    return false;
  }

  await SecureStore.setItemAsync(PUSH_ENABLED_KEY, 'true');
  return true;
}
