// src/screens/RegisterScreen.tsx
//
// Pantalla de registro de nuevos usuarios con cumplimiento legal (T04).

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
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, BorderRadius } from '../theme/colors';
import { Image } from 'react-native';
import apiClient from '../services/apiClient';

export default function RegisterScreen({ navigation }: any) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [acceptPolicy, setAcceptPolicy] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [nameFocused, setNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  // Función de registro (T04: Conexión con POST /api/auth/register y validación legal)
  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Campos incompletos', 'Por favor completa todos los campos.');
      return;
    }

    if (!acceptPolicy) {
      Alert.alert(
        'Cumplimiento legal',
        'Debes aceptar la Ley de Protección de Datos y Términos para poder registrarte.'
      );
      return;
    }

    setIsLoading(true);
    try {
      // Petición POST al endpoint de registro del backend
      await apiClient.post('/api/auth/register', {
        name: name.trim(),
        email: email.trim(),
        password: password,
      });

      Alert.alert(
        '¡Registro exitoso!',
        'Tu cuenta ha sido creada correctamente. Ahora puedes iniciar sesión.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error: any) {
      console.error('[RegisterScreen] Error durante el registro:', error);
      
      // Manejo de errores (ej. correos duplicados devueltos por el backend)
      const errorMessage =
        error.response?.data?.message ||
        'Ocurrió un error al registrar el usuario (correo duplicado o fallo en el servidor).';
      
      Alert.alert('Error de registro', errorMessage);
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
              <Text style={styles.subtitle}>Crear cuenta nueva</Text>
            </View>

            {/* Campo de Nombre */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>NOMBRE COMPLETO</Text>
              <View style={[styles.inputWrapper, nameFocused && styles.inputWrapperFocused]}>
                <MaterialIcons
                  name="person"
                  size={20}
                  color={nameFocused ? Colors.tertiary : Colors.onSurfaceVariant}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Tu nombre"
                  placeholderTextColor={Colors.onSurfaceVariant + '80'}
                  value={name}
                  onChangeText={setName}
                  onFocus={() => setNameFocused(true)}
                  onBlur={() => setNameFocused(false)}
                />
              </View>
            </View>

            {/* Campo de Email */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>CORREO ELECTRÓNICO</Text>
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
                />
              </View>
            </View>

            {/* Campo de Contraseña */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>CONTRASEÑA</Text>
              <View style={[styles.inputWrapper, passwordFocused && styles.inputWrapperFocused]}>
                <MaterialIcons
                  name="lock"
                  size={20}
                  color={passwordFocused ? Colors.tertiary : Colors.onSurfaceVariant}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={Colors.onSurfaceVariant + '80'}
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Cumplimiento Legal: Checkbox / Switch Ley de Protección de Datos */}
            <View style={styles.legalContainer}>
              <Switch
                value={acceptPolicy}
                onValueChange={setAcceptPolicy}
                trackColor={{ false: Colors.outlineVariant, true: Colors.tertiary }}
              />
              <Text style={styles.legalText}>
                Acepto la <Text style={styles.legalLink}>Ley de Protección de Datos</Text> y los términos del servicio.
              </Text>
            </View>

            {/* Botón de Registro */}
            <TouchableOpacity
              onPress={handleRegister}
              activeOpacity={0.9}
              disabled={isLoading}
              style={styles.registerButtonWrapper}
            >
              <LinearGradient
                colors={[Colors.primaryContainer, Colors.primary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.registerButton}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.registerButtonText}>Registrarse</Text>
                    <MaterialIcons name="check" size={20} color={Colors.onPrimaryContainer} />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Footer para volver al Login */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>¿Ya tienes una cuenta? </Text>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Text style={styles.footerLink}>Inicia sesión</Text>
              </TouchableOpacity>
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
    marginBottom: 24,
  },
  logoImage: {
    width: 180,
    height: 70,
    alignSelf: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.onSurfaceVariant,
    fontWeight: '600',
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
  legalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    gap: 12,
  },
  legalText: {
    flex: 1,
    fontSize: 13,
    color: Colors.onSurfaceVariant,
    lineHeight: 18,
  },
  legalLink: {
    color: Colors.primary,
    fontWeight: '700',
  },
  registerButtonWrapper: {
    marginTop: 8,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  registerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  registerButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.onPrimaryContainer,
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
});