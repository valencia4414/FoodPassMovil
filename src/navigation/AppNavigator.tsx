// src/navigation/AppNavigator.tsx
// Este archivo configura TODA la navegación de la app.

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Importamos el hook de autenticación
import { useAuth } from '../context/AuthContext';

// Importamos todas las pantallas
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import DashboardScreen from '../screens/DashboardScreen';
import MenuScreen from '../screens/MenuScreen';
import HistorialScreen from '../screens/HistorialScreen';
import CanjeScreen from '../screens/CanjeScreen';
import PagosScreen from '../screens/PagosScreen';
import PerfilScreen from '../screens/PerfilScreen';
import SecurityScreen from '../screens/SecurityScreen';
import HelpCenterScreen from '../screens/HelpCenterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import { Colors } from '../theme/colors';

// Creamos los navegadores
const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MainTabs() {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          const iconMap: Record<string, keyof typeof MaterialIcons.glyphMap> = {
            Inicio: 'home',
            Menú: 'restaurant-menu',
            Historial: 'history',
            Canje: 'qr-code-scanner',
            Pagos: 'payments',
            Perfil: 'person',
          };
          const iconName = iconMap[route.name] || 'circle';
          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: Colors.primaryContainer,
        tabBarInactiveTintColor: 'rgba(255,255,255,0.5)',
        tabBarStyle: {
          backgroundColor: Colors.inverseSurface,
          borderTopWidth: 0,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          letterSpacing: 0.5,
        },
        tabBarItemStyle: {
          borderRadius: 12,
          marginHorizontal: 2,
        },
      })}
    >
      <Tab.Screen name="Inicio" component={DashboardScreen} />
      <Tab.Screen name="Menú" component={MenuScreen} />
      <Tab.Screen name="Historial" component={HistorialScreen} />
      <Tab.Screen name="Canje" component={CanjeScreen} />
      <Tab.Screen name="Pagos" component={PagosScreen} />
      <Tab.Screen name="Perfil" component={PerfilScreen} />
    </Tab.Navigator>
  );
}

function LoadingScreen() {
  return (
    <View style={loadingStyles.container}>
      <ActivityIndicator size="large" color={Colors.primaryContainer} />
    </View>
  );
}

const loadingStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.surface,
  },
});

export default function AppNavigator() {
  const { isAuth, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuth ? (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="Security" component={SecurityScreen} />
            <Stack.Screen name="HelpCenter" component={HelpCenterScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login">
              {({ navigation, route }: any) => (
                <LoginScreen
                  initialEmail={route.params?.email}
                  onForgotPassword={() => navigation.navigate('ForgotPassword')}
                  onNavigateRegister={() => navigation.navigate('Register')}
                />
              )}
            </Stack.Screen>

            <Stack.Screen name="Register" component={RegisterScreen} />

            <Stack.Screen name="ForgotPassword">
              {({ navigation }: any) => (
                <ForgotPasswordScreen
                  onBackToLogin={(resetEmail?: string) => {
                    navigation.navigate('Login', { email: resetEmail });
                  }}
                />
              )}
            </Stack.Screen>
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}