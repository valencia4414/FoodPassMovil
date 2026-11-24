import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';
import PushNotificationRegistration from './src/components/PushNotificationRegistration';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <PushNotificationRegistration />
        <StatusBar style="dark" />
        <AppNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}