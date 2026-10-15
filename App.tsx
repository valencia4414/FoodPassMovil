// App.tsx — Punto de entrada de la aplicación
//
// Este es el primer archivo que React Native ejecuta cuando abre la app.
// Su única responsabilidad es configurar los proveedores globales
// y renderizar el navegador principal.
//
// Conceptos clave:
// - SafeAreaProvider: Le dice a la app cómo manejar el "notch" y la barra de inicio
// - StatusBar: Controla el color y estilo de la barra de estado del teléfono
// - AuthProvider: Provee el estado de autenticación a toda la app (T02)

import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { CartProvider } from './src/context/CartContext';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <CartProvider>
          <StatusBar style="dark" backgroundColor="#f0ffd8" />

          <AppNavigator />
        </CartProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
