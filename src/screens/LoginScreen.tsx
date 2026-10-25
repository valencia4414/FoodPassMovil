// src/screens/LoginScreen.tsx
// Pantalla de inicio de sesión integrada con el Backend y AuthContext (T03).

import React, { useState, useEffect } from 'react';
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
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, BorderRadius } from '../theme/colors';
import apiClient from '../services/apiClient';
import { useAuth } from '../context/AuthContext';

interface LoginScreenProps {
  onLogin?: (email?: string, password?: string) => void | Promise<void>; 
  onForgotPassword?: () => void; 
  onNavigateRegister?: () => void;
  initialEmail?: string;         
}

export default function LoginScreen({ onLogin, onForgotPassword, onNavigateRegister, initialEmail }: LoginScreenProps) {
  const [email, setEmail] = useState(initialEmail || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  // Extraemos la función login del contexto global (T03)
  const { login } = useAuth();

  useEffect(() => {
    if (initialEmail) {
      setEmail(initialEmail);
    }
  }, [initialEmail]);

  // Validación de formato de correo estándar
  const isValidEmail = (emailStr: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr);
  };

  // Función de inicio de sesión real con el Backend (T03)
  const handleLogin = async () => {
    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    // 1. Validaciones de datos de entrada
    if (!cleanEmail || !cleanPassword) {
      Alert.alert('Campos incompletos', 'Por favor ingresa tu correo y contraseña.');
      return;
    }

    if (!isValidEmail(cleanEmail)) {
      Alert.alert('Correo inválido', 'Por favor ingresa un correo electrónico válido (ejemplo: usuario@correo.com).');
      return;
    }

    setIsLoading(true);
    try {
      // Ajuste automático por si apiClient ya tiene "/api" en su baseURL
      const endpoint = apiClient.defaults.baseURL?.endsWith('/api') 
        ? '/auth/login' 
        : '/api/auth/login';

      const response = await apiClient.post(endpoint, {
        email: cleanEmail.toLowerCase(),
        password: password,
      });

      // Extraemos el token y usuario ya sea que vengan dentro de response.data.data o directos
      const resData = response.data?.data || response.data;
      const token = resData?.token;
      const user = resData?.user;

      if (!token) {
        throw new Error('No se recibió un token válido del servidor.');
      }

      // Guardamos la sesión mediante el AuthContext
      await login(token, user || { id: '1', name: cleanEmail.split('@')[0], email: cleanEmail, role: 'client' });

      // Solo si fue exitoso llamamos a onLogin
      if (onLogin) {
        await onLogin(cleanEmail, password);
      }

    } catch (error: any) {
      console.error('[LoginScreen] Error durante login:', error);
      
      let errorMessage = 'Usuario o contraseña incorrectos.';

      if (error.response) {
        if (error.response.status === 401 || error.response.status === 404) {
          errorMessage = 'Credenciales inválidas. El usuario o la contraseña no coinciden.';
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.request) {
        errorMessage = 'No se pudo conectar con el servidor. Revisa tu conexión a internet o la IP del backend.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Alerta de error (diseño nativo sin alterar tu pantalla)
      Alert.alert('Error de inicio de sesión', errorMessage);

    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.blobTopLeft} />
      <View style={styles.blobBottomRight} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <View style={styles.logoSection}>
              <Image
                source={require('../../assets/foodpass_logo.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>

            {/* Campo de Email */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>EMAIL ADDRESS</Text>
              <View style={[styles.inputWrapper, emailFocused && styles.inputWrapperFocused]}>
                <MaterialIcons
                  name="mail"
                  size={20}
                  color={emailFocused ? Colors.tertiary : Colors.onSurfaceVariant}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="name@example.com"
                  placeholderTextColor={Colors.onSurfaceVariant + '80'}
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
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
              <View style={[styles.inputWrapper, passwordFocused && styles.inputWrapperFocused]}>
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
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  editable={!isLoading}
                />
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

            {/* Botón de Login */}
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
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.loginButtonText}>Entrar</Text>
                    <MaterialIcons name="arrow-forward" size={20} color={Colors.onPrimaryContainer} />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>O CONTINÚA CON</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity style={styles.googleButton} activeOpacity={0.8}>
              <View style={styles.googleIcon}>
                <Text style={styles.googleIconText}>G</Text>
              </View>
              <Text style={styles.googleButtonText}>Google</Text>
            </TouchableOpacity>

            {/* Footer con el botón de Crear Cuenta conectado */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>¿No tienes una cuenta? </Text>
              <TouchableOpacity onPress={onNavigateRegister} activeOpacity={0.7}>
                <Text style={styles.footerLink}>Crear Cuenta</Text>
              </TouchableOpacity>
            </View>
          </View>

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

// Estilos 100% idénticos a tu código original
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  flex: {
    flex: 1,
  },
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
  logoImage: {
    width: 220,
    height: 90,
    alignSelf: 'center',
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
    borderWidth: 2,
    borderColor: 'transparent',
  },
  inputWrapperFocused: {
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
    paddingRight: 0,
  },
  eyeButton: {
    padding: 14,
  },
  loginButtonWrapper: {
    marginTop: 8,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
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
});