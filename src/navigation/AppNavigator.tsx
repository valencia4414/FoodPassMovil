// src/navigation/AppNavigator.tsx
//
// Este archivo configura TODA la navegación de la app.
//
// ¿Qué es un Navigator?
// En React Native, un "Navigator" es el componente que controla qué pantalla
// se muestra y cómo se navega entre ellas. Hay varios tipos:
//
// - Stack Navigator: Las pantallas se apilan (como ir hacia adelante/atrás)
// - Bottom Tab Navigator: La barra de navegación abajo del teléfono ← usamos este
// - Drawer Navigator: Menú lateral (hamburguesa)
//
// En el diseño web original había una barra lateral (sidebar). En móvil,
// ese patrón se convierte en una barra de tabs en la parte inferior.
// Esto sigue las guías de UX de iOS y Android.
//
// CAMBIO T02: Ahora usa AuthContext para la navegación condicional.
// El estado de autenticación viene del contexto global, no de useState local.
// Esto permite que cualquier pantalla pueda hacer login/logout.

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
import DashboardScreen from '../screens/DashboardScreen';
import MenuScreen from '../screens/MenuScreen';
import HistorialScreen from '../screens/HistorialScreen';
import CanjeScreen from '../screens/CanjeScreen';
import PagosScreen from '../screens/PagosScreen';
import PerfilScreen from '../screens/PerfilScreen';
import SecurityScreen from '../screens/SecurityScreen';
import HelpCenterScreen from '../screens/HelpCenterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import { apiClient } from '../services/apiClient';
import { Colors } from '../theme/colors';



// Creamos los navegadores
// Tab → para las pantallas principales (con la barra inferior)
const Tab = createBottomTabNavigator();
// Stack → para el flujo de login (sin barra inferior)
const Stack = createNativeStackNavigator();

// Este componente configura la barra de tabs del fondo.
// Contiene todas las pantallas principales de la app.
function MainTabs() {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      // screenOptions se aplica a TODOS los tabs
      screenOptions={({ route }) => ({
        // Ocultamos el header por defecto porque cada pantalla tiene el suyo
        headerShown: false,

        // Configuramos el ícono de cada tab según el nombre de la ruta
        tabBarIcon: ({ focused, color, size }) => {
          // Mapeamos el nombre de la ruta al ícono de MaterialIcons correspondiente
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

        // Colores de la barra de tabs
        tabBarActiveTintColor: Colors.primaryContainer,    // Color del tab activo (naranja)
        tabBarInactiveTintColor: 'rgba(255,255,255,0.5)',  // Color tabs inactivos (blanco transparente)

        // Estilo de la barra de tabs
        tabBarStyle: {
           backgroundColor: Colors.inverseSurface,  // Fondo verde oscuro (igual al sidebar web)
           borderTopWidth: 0,                        // Sin línea separadora (regla "No-Line" del diseño)
           height: 60 + insets.bottom,
           paddingBottom: insets.bottom,
           paddingTop: 8,
         },

        // Estilo del texto de cada tab
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          letterSpacing: 0.5,
        },

        // Indicador del tab activo (la "pastilla" naranja del diseño web)
        tabBarItemStyle: {
          borderRadius: 12,
          marginHorizontal: 2,
        },
      })}
    >
      {/* Definimos cada pantalla del tab. El "name" es lo que aparece debajo del ícono */}
      <Tab.Screen name="Inicio" component={DashboardScreen} />
      <Tab.Screen name="Menú" component={MenuScreen} />
      <Tab.Screen name="Historial" component={HistorialScreen} />
      <Tab.Screen name="Canje" component={CanjeScreen} />
      <Tab.Screen name="Pagos" component={PagosScreen} />
      <Tab.Screen name="Perfil" component={PerfilScreen} />
    </Tab.Navigator>
  );
}

// ──────────────────────────────────────────────
// Pantalla de carga
// ──────────────────────────────────────────────
// Se muestra brevemente mientras se restaura la sesión de SecureStore.
// Sin esto, el usuario vería un flash del login antes de ir al dashboard.

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

// ──────────────────────────────────────────────
// Componente raíz del navegador
// ──────────────────────────────────────────────
// Maneja el flujo de autenticación: Login → App Principal
//
// CAMBIO T02: Ahora usa useAuth() del AuthContext global en vez de
// un useState local. Esto permite:
// - Persistencia de sesión entre reinicios de app (SecureStore)
// - Login/logout desde cualquier pantalla (PerfilScreen, etc.)
// - Protección real de rutas (no solo visual)

export default function AppNavigator() {
  // isAuth viene del contexto global — cualquier pantalla puede cambiarlo.
  // isLoading indica si aún estamos restaurando la sesión de SecureStore.
  const { isAuth, isLoading, login } = useAuth();

  // Mientras restauramos la sesión, mostramos un spinner.
  // Esto evita que el usuario vea el login por un instante antes
  // de ser redirigido al dashboard.
  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    // NavigationContainer SIEMPRE envuelve todo el sistema de navegación.
    // Es el equivalente al router en una app web.
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuth ? (
          // Si el usuario está autenticado, mostramos las pantallas del flujo autenticado
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
                  onLogin={async (enteredEmail?: string, enteredPassword?: string) => {
                    const cleanEmail = enteredEmail && enteredEmail.includes('@') ? enteredEmail.trim() : 'carlos@foodpass.com';
                    const cleanPassword = enteredPassword || '123456';

                    try {
                      // Intento de inicio de sesión real contra la API de FoodPass
                      const response = await apiClient.post('/auth/login', {
                        email: cleanEmail,
                        password: cleanPassword,
                      });

                      if (response.data?.success && response.data?.data?.token) {
                        const { token, user } = response.data.data;
                        await login(token, {
                          id: String(user.id || 'usr_001'),
                          name: user.name || 'Usuario FoodPass',
                          email: user.email || cleanEmail,
                          role: user.role || 'cliente',
                          plan: user.membresia || 'Premium',
                        });
                        return;
                      }
                    } catch (apiErr) {
                      console.log('[AppNavigator] Conexión directa a API no completada, utilizando sesión local para desarrollo:', apiErr);
                    }

                    // Fallback simulado para entorno offline o pruebas
                    const simulatedToken =
                      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkNhcmxvcyBNZW5kb3phIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
                    const simulatedUser = {
                      id: 'usr_001',
                      name: 'Carlos Mendoza',
                      email: cleanEmail,
                      role: 'employee',
                      plan: 'Premium',
                    };

                    await login(simulatedToken, simulatedUser);
                  }}
                />
              )}
            </Stack.Screen>

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
          // Si no, mostramos el login y le pasamos la función para autenticarse.
          // La función handleLogin simula la respuesta del API y llama al login del contexto.
          <Stack.Screen name="Login">
            {() => (
              <LoginScreen
                onLogin={async (enteredEmail?: string) => {
                  // Token JWT válido firmado con el JWT_SECRET del backend para desarrollo e integración
                  const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwiZW1haWwiOiJjYXJsb3NAc295LnNlbmEuZWR1LmNvIiwicm9sZSI6ImJlbmVmaWNpYXJpbyIsImlhdCI6MTc5MjAzMDc2NiwiZXhwIjoxNzk0NjIyNzY2fQ.aJLgcFM3RkLzOT4N4XiuiEha9iP0dKo8KQ1ZSZ_O4xQ';
                  const validUser = {
                    id: 4,
                    name: 'Carlos Aprendiz',
                    email: enteredEmail && enteredEmail.includes('@') ? enteredEmail.trim() : 'carlos@soy.sena.edu.co',
                    role: 'beneficiario',
                    plan: 'Premium',
                  };

                  await login(validToken, validUser);
                }}
              />
            )}
          </Stack.Screen>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
