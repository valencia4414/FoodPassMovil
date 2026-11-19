// src/screens/RegisterScreen.tsx
//
// Pantalla de registro de nuevos usuarios con cumplimiento legal y documento (T04).

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
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, BorderRadius } from '../theme/colors';
import apiClient from '../services/apiClient';
import { useAuth } from '../context/AuthContext';

export default function RegisterScreen({ navigation }: any) {
  const { login } = useAuth();
  const [name, setName] = useState('');
  const [documento, setDocumento] = useState(''); // <--- Nuevo estado para la cédula
  const [ficha, setFicha] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [acceptPolicy, setAcceptPolicy] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [nameFocused, setNameFocused] = useState(false);
  const [documentoFocused, setDocumentoFocused] = useState(false); // <--- Focus para el documento
  const [fichaFocused, setFichaFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  // Función de registro con validaciones completas (RFM02)
  const handleRegister = async () => {
    const cleanName = name.trim();
    const cleanDoc = documento.trim();
    const cleanEmail = email.trim();
    const cleanPassword = password;

    // 1. Validación de campos obligatorios
    if (!cleanName || !cleanDoc || !cleanEmail || !cleanPassword) {
      Alert.alert('Campos incompletos', 'Por favor completa todos los campos del formulario.');
      return;
    }

    // 2. Validación de nombre real del usuario (mínimo 3 caracteres, solo letras y espacios)
    const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]{3,60}$/;
    if (!nameRegex.test(cleanName)) {
      Alert.alert(
        'Nombre inválido',
        'Por favor ingresa un nombre real válido (mínimo 3 caracteres, solo letras y espacios).'
      );
      return;
    }


    // 2.5. Validación de ficha (obligatoria, solo números, máximo 10 dígitos)
    const cleanFicha = ficha.trim();
    if (!cleanFicha) {
      Alert.alert('Ficha requerida', 'El número de ficha es obligatorio.');
      return;
    }
    const fichaRegex = /^\d{1,10}$/;
    if (!fichaRegex.test(cleanFicha)) {
      Alert.alert(
        'Ficha inválida',
        'La ficha debe contener solo números y tener máximo 10 dígitos.'
      );
      return;
    }

    // 3. Validación de cédula de ciudadanía (mínimo 10 caracteres numéricos)
    const docRegex = /^\d{10,}$/;
    if (!docRegex.test(cleanDoc)) {
      Alert.alert(
        'Cédula inválida',
        'La cédula de ciudadanía debe contener únicamente números y tener un mínimo de 10 dígitos.'
      );
      return;
    }

    // 4. Validación de correo electrónico (formato válido con @ y .com, .net, etc.)
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(cleanEmail)) {
      Alert.alert(
        'Correo inválido',
        'Por favor ingresa un correo electrónico con formato válido (ejemplo: usuario@correo.com).'
      );
      return;
    }

    // 5. Validación de contraseña (mínimo 8 caracteres alfanuméricos con al menos una mayúscula)
    const hasMinLength = cleanPassword.length >= 8;
    const hasUpperCase = /[A-Z]/.test(cleanPassword);
    const hasNumber = /\d/.test(cleanPassword);
    const hasLetter = /[a-zA-Z]/.test(cleanPassword);

    if (!hasMinLength || !hasUpperCase || !hasNumber || !hasLetter) {
      Alert.alert(
        'Contraseña no cumple requisitos',
        'La contraseña debe tener mínimo 8 caracteres, incluir números y letras, y al menos una letra mayúscula (ej: Foodpass1).'
      );
      return;
    }

    // 6. Validación de aceptación de términos y políticas
    if (!acceptPolicy) {
      Alert.alert(
        'Cumplimiento legal',
        'Debes aceptar la Ley de Protección de Datos y Términos para poder registrarte.'
      );
      return;
    }

    setIsLoading(true);
    try {
      // Petición POST al endpoint de registro del backend enviando los datos validados
      const response = await apiClient.post('/api/auth/register', {
        name: cleanName,
        documento: cleanDoc,
        ficha: cleanFicha,
        email: cleanEmail.toLowerCase(),
        password: cleanPassword,
      });

      const resData = response.data?.data || response.data;
      const token = resData?.token;
      const user = resData?.user || { id: '1', name: cleanName, email: cleanEmail, role: 'cliente' };

      if (token && login) {
        await login(token, user);
      } else {
        Alert.alert('¡Registro exitoso!', 'Tu cuenta ha sido creada correctamente.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (error: any) {
      console.error('[RegisterScreen] Error durante el registro:', error);
      
      const serverMessage = error.response?.data?.message;
      let finalMessage = serverMessage;

      if (!finalMessage) {
        const calledUrl = error.config
          ? `${error.config.baseURL || ''}${error.config.url || ''}`
          : '';

        if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
          finalMessage = `Tiempo de espera agotado al conectar con el servidor:\n${calledUrl}\n\nVerifica que la API esté encendida en el puerto 3000.`;
        } else if (error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
          finalMessage = `No se pudo conectar con el servidor:\n${calledUrl}\n\nVerifica que la API esté corriendo en el puerto 3000 y tu celular esté conectado a la misma red Wi-Fi.`;
        } else {
          finalMessage = error.message || 'Ocurrió un error al registrar el usuario.';
        }
      }
      
      Alert.alert('Error de registro', finalMessage);
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

            {/* Campo de Documento / Cédula */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>CÉDULA DE CIUDADANÍA</Text>
              <View style={[styles.inputWrapper, documentoFocused && styles.inputWrapperFocused]}>
                <MaterialIcons
                  name="badge"
                  size={20}
                  color={documentoFocused ? Colors.tertiary : Colors.onSurfaceVariant}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Número de documento"
                  placeholderTextColor={Colors.onSurfaceVariant + '80'}
                  value={documento}
                  onChangeText={setDocumento}
                  onFocus={() => setDocumentoFocused(true)}
                  onBlur={() => setDocumentoFocused(false)}
                  keyboardType="numeric"
                />
              </View>
            </View>


            {/* Campo de Ficha */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>NÚMERO DE FICHA</Text>
              <View style={[styles.inputWrapper, fichaFocused && styles.inputWrapperFocused]}>
                <MaterialIcons
                  name="confirmation-number"
                  size={20}
                  color={fichaFocused ? Colors.tertiary : Colors.onSurfaceVariant}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Ficha SENA (máx. 10 dígitos)"
                  placeholderTextColor={Colors.onSurfaceVariant + '80'}
                  value={ficha}
                  onChangeText={(t) => setFicha(t.replace(/[^0-9]/g, '').slice(0, 10))}
                  onFocus={() => setFichaFocused(true)}
                  onBlur={() => setFichaFocused(false)}
                  keyboardType="numeric"
                  maxLength={10}
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

            {/* Cumplimiento Legal */}
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