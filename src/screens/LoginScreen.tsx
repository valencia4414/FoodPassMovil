// src/screens/LoginScreen.tsx
//
// Pantalla de inicio de sesión.
//
// Conceptos nuevos en este archivo:
// - useState: Hook para manejar estado local (variables que cambian)
// - KeyboardAvoidingView: Mueve el contenido cuando aparece el teclado
// - TextInput: Campo de texto para el usuario
// - Platform: Detecta si estamos en iOS o Android

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, BorderRadius, Typography } from '../theme/colors';
import { Image } from 'react-native';

// Props que recibe esta pantalla desde el Navigator
interface LoginScreenProps {
  onLogin: (email?: string, password?: string) => void | Promise<void>; // Función que se llama cuando el login es exitoso
  onForgotPassword?: () => void; // Función para navegar al flujo de recuperación de contraseña
  initialEmail?: string;         // Correo precargado tras restablecer contraseña
}

export default function LoginScreen({ onLogin, onForgotPassword, initialEmail }: LoginScreenProps) {
  // useState es un "Hook" — una función especial de React que crea una variable
  // que cuando cambia, hace que el componente se vuelva a renderizar.
  //
  // Sintaxis: const [valor, setValor] = useState(valorInicial)
  const [email, setEmail] = useState(initialEmail || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  React.useEffect(() => {
    if (initialEmail) {
      setEmail(initialEmail);
    }
  }, [initialEmail]);

  // Función que simula el proceso de login
  const handleLogin = async () => {
    setIsLoading(true);
    try {
      // Simula pequeña latencia de red para la animación de carga
      await new Promise((resolve) => setTimeout(resolve, 500));
      await onLogin(email, password);
    } catch (error) {
      console.error('[LoginScreen] Error durante login:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // SafeAreaView respeta el notch y la barra inferior del teléfono
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>

      {/* Círculos decorativos del fondo (equivalente a los blobs del diseño web) */}
      <View style={styles.blobTopLeft} />
      <View style={styles.blobBottomRight} />

      {/* KeyboardAvoidingView sube el contenido cuando aparece el teclado.
          El comportamiento varía entre iOS ('padding') y Android ('height') */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* ScrollView permite scroll si el contenido no cabe en pantalla
            (cuando el teclado está abierto en teléfonos pequeños) */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled" // Permite tocar botones con el teclado abierto
          showsVerticalScrollIndicator={false}
        >
          {/* === TARJETA PRINCIPAL === */}
          <View style={styles.card}>
           {/* === SECCIÓN DEL LOGO === */}
             <View style={styles.logoSection}>
               <Image
                  source={require('../../assets/foodpass_logo.png')}
                    style={styles.logoImage}
                     resizeMode="contain"
                  />
               </View>

            {/* === FORMULARIO === */}
            {/* Campo de Email */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>EMAIL ADDRESS</Text>
              <View style={[
                styles.inputWrapper,
                emailFocused && styles.inputWrapperFocused, // Aplica estilo adicional si está enfocado
              ]}>
                <MaterialIcons
                  name="mail"
                  size={20}
                  color={emailFocused ? Colors.tertiary : Colors.onSurfaceVariant}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="name@example.com"
                  placeholderTextColor={Colors.onSurfaceVariant + '80'} // 50% de opacidad
                  value={email}
                  onChangeText={setEmail}         // Se llama cada vez que el usuario escribe
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  keyboardType="email-address"    // Teclado optimizado para emails
                  autoCapitalize="none"           // No capitaliza automáticamente
                  autoCorrect={false}             // Sin autocorrección
                />
              </View>
            </View>

            {/* Campo de Contraseña */}
            <View style={styles.fieldGroup}>
              <View style={styles.fieldLabelRow}>
                <Text style={styles.fieldLabel}>PASSWORD</Text>
                <TouchableOpacity onPress={onForgotPassword} activeOpacity={0.7}>
                  <Text style={styles.forgotText}>¿OLVIDASTE?</Text>
                </TouchableOpacity>
              </View>
              <View style={[
                styles.inputWrapper,
                passwordFocused && styles.inputWrapperFocused,
              ]}>
                <MaterialIcons
                  name="lock"
                  size={20}
                  color={passwordFocused ? Colors.tertiary : Colors.onSurfaceVariant}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, styles.inputPassword]}
                  placeholder="••••••••"
                  placeholderTextColor={Colors.onSurfaceVariant + '80'}
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  secureTextEntry={!showPassword}  // Oculta el texto cuando es true
                  autoCapitalize="none"
                />
                {/* Botón para mostrar/ocultar contraseña */}
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                  activeOpacity={0.7}
                >
                  <MaterialIcons
                    name={showPassword ? 'visibility-off' : 'visibility'}
                    size={20}
                    color={Colors.onSurfaceVariant}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Botón de Login con degradado */}
            {/* LinearGradient requiere la librería expo-linear-gradient */}
            <TouchableOpacity
              onPress={handleLogin}
              activeOpacity={0.9}
              disabled={isLoading}
              style={styles.loginButtonWrapper}
            >
              <LinearGradient
                colors={[Colors.primaryContainer, Colors.primary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.loginButton}
              >
                {isLoading ? (
                  // ActivityIndicator es el "spinner" de carga nativo
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.loginButtonText}>Entrar</Text>
                    <MaterialIcons name="arrow-forward" size={20} color={Colors.onPrimaryContainer} />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Divisor */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>O CONTINÚA CON</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Botón de Google */}
            <TouchableOpacity style={styles.googleButton} activeOpacity={0.8}>
              {/* SVG de Google en RN se haría con react-native-svg, 
                  por simplicidad usamos el texto "G" estilizado */}
              <View style={styles.googleIcon}>
                <Text style={styles.googleIconText}>G</Text>
              </View>
              <Text style={styles.googleButtonText}>Google</Text>
            </TouchableOpacity>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>¿No tienes una cuenta? </Text>
              <TouchableOpacity>
                <Text style={styles.footerLink}>Crear Ledger</Text>
              </TouchableOpacity>
            </View>

          </View>

          {/* Indicadores de estado del sistema (detalle artesanal del diseño web) */}
          <View style={styles.statusBar}>
            <View style={styles.statusOnline}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>SYSTEM ONLINE</Text>
            </View>
            <View style={styles.statusEncrypted}>
              <MaterialIcons name="verified-user" size={12} color={Colors.onSurfaceVariant} />
              <Text style={styles.statusText}>END-TO-END ENCRYPTED</Text>
            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  flex: {
    flex: 1,
  },
  // Decoraciones de fondo
  blobTopLeft: {
    position: 'absolute',
    top: -60,
    left: -60,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: Colors.surfaceContainerHigh,
    opacity: 0.5,
  },
  blobBottomRight: {
    position: 'absolute',
    bottom: -60,
    right: -60,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: Colors.primaryContainer,
    opacity: 0.08,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xxxl,
    padding: 28,
    // Sombra del sistema de diseño
    shadowColor: '#121f05',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.06,
    shadowRadius: 40,
    elevation: 8,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoIcon: {
    width: 64,
    height: 64,
    backgroundColor: Colors.inverseSurface,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.onSurface,
    letterSpacing: 1.5,
    marginBottom: 6,
    marginLeft: 4,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  forgotText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainer,
    borderRadius: BorderRadius.xl,
    // Borde invisible (2px transparente) que se vuelve visible al enfocar
    borderWidth: 2,
    borderColor: 'transparent',
  },
  inputWrapperFocused: {
    // Estado focus: borde verde (tertiary) — el "positive/active state" del diseño
    borderColor: Colors.tertiary,
  },
  inputIcon: {
    marginLeft: 14,
    marginRight: 4,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    paddingRight: 14,
    fontSize: 15,
    color: Colors.onSurface,
  },
  inputPassword: {
    paddingRight: 0, // El botón del ojo ocupa ese espacio
  },
  eyeButton: {
    padding: 14,
  },
  loginButtonWrapper: {
    marginTop: 8,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden', // Necesario para que el degradado respete el borderRadius
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.onPrimaryContainer,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.outlineVariant,
    opacity: 0.3,
  },
  dividerText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
    letterSpacing: 1.5,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 14,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.xl,
  },
  googleIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  googleIconText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4285F4',
  },
  googleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
    color: Colors.onSurfaceVariant,
    fontWeight: '500',
  },
  footerLink: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '700',
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    paddingHorizontal: 8,
  },
  statusOnline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.tertiary,
  },
  statusEncrypted: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    opacity: 0.5,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
    letterSpacing: 1.2,
  },

logoImage: {
  width: 220,
  height: 90,
  alignSelf: 'center',
},
});