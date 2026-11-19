import React, { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';
import {
  getPushNotificationsEnabled,
  registerPushToken,
} from '../services/pushNotificationService';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function PushNotificationRegistration() {
  const { isAuth, userData } = useAuth();

  useEffect(() => {
    if (!isAuth || (Platform.OS !== 'ios' && Platform.OS !== 'android')) {
      return;
    }

    let isActive = true;

    const register = async () => {
      try {
        if (await getPushNotificationsEnabled()) {
          if (isActive) {
            await registerPushToken();
          }
        }
      } catch (error) {
        console.error('[PushNotifications] No se pudo registrar el dispositivo:', error);
      }
    };

    void register();

    return () => {
      isActive = false;
    };
  }, [isAuth, userData?.id]);

  return null;
}
