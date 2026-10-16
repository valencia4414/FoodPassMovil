// src/screens/ForgotPasswordScreen.tsx
//
// Flujo completo de recuperación de contraseña (RFM10 - T14):
// 1. Ingresar Email -> Solicitar código OTP
// 2. Validar Código -> Verificar código de 6 dígitos
// 3. Nueva Clave -> Crear y confirmar nueva contraseña
// 4. Éxito -> Redirigir a Login para iniciar sesión con la nueva clave

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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, BorderRadius, Typography } from '../theme/colors';
import { authService } from '../services/authService';

interface ForgotPasswordScreenProps {
  onBackToLogin: (email?: string) => void;
}

type Step = 'EMAIL' | 'OTP' | 'NEW_PASSWORD' | 'SUCCESS';

export default function ForgotPasswordScreen({ onBackToLogin }: ForgotPasswordScreenProps) {
  const [step, setStep] = useState<Step>('EMAIL');

  // Form states
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Focus states
  const [emailFocused, setEmailFocused] = useState(false);
  const [otpFocused, setOtpFocused] = useState(false);
  const [newPassFocused, setNewPassFocused] = useState(false);
  const [confirmPassFocused, setConfirmPassFocused] = useState(false);

  // Timer para reenvío de OTP (60s)
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (step === 'OTP' && countdown > 0) {
      timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
    } else if (countdown === 0) {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [step, countdown]);

  // Validaciones
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const isPasswordLongEnough = newPassword.length >= 6;
  const doPasswordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  // ──────────────────────────────────────────────
  // Paso 1: Solicitar código OTP por correo
  // ──────────────────────────────────────────────
  const handleRequestOtp = async () => {
    setErrorMessage(null);
    setSuccessNotice(null);

    if (!email.trim()) {
      setErrorMessage('Por favor ingresa tu correo electrónico.');
      return;
    }
    if (!isEmailValid) {
      setErrorMessage('Por favor ingresa un correo electrónico válido.');
      return;
    }

    setIsLoading(true);
    try {
      await authService.forgotPassword(email.trim());
      setSuccessNotice('Código enviado. Revisa tu bandeja de entrada o spam.');
      setCountdown(60);
      setCanResend(false);
      setStep('OTP');
    } catch (err: any) {
      setErrorMessage(err.message || 'No se pudo enviar el código. Inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  // Reenviar código
  const handleResendOtp = async () => {
    if (!canResend || isLoading) return;
    setErrorMessage(null);
    setIsLoading(true);
    try {
      await authService.forgotPassword(email.trim());
      setSuccessNotice('Nuevo código enviado con éxito.');
      setCountdown(60);
      setCanResend(false);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al reenviar el código.');
    } finally {
      setIsLoading(false);
    }
  };

  // ──────────────────────────────────────────────
  // Paso 2: Validar código OTP de 6 dígitos
  // ──────────────────────────────────────────────
  const handleVerifyOtp = async () => {
    setErrorMessage(null);
    setSuccessNotice(null);

    const cleanCode = otpCode.replace(/\D/g, '');
    if (cleanCode.length !== 6) {
      setErrorMessage('Ingresa el código numérico completo de 6 dígitos.');
      return;
    }

    setIsLoading(true);
    try {
      await authService.verifyOtp(email.trim(), cleanCode);
      setSuccessNotice('Código verificado correctamente.');
      setStep('NEW_PASSWORD');
    } catch (err: any) {
      setErrorMessage(err.message || 'El código es incorrecto o ha expirado.');
    } finally {
      setIsLoading(false);
    }
  };

  // ──────────────────────────────────────────────
  // Paso 3: Guardar nueva contraseña
  // ──────────────────────────────────────────────
  const handleResetPassword = async () => {
    setErrorMessage(null);
    setSuccessNotice(null);

    if (!isPasswordLongEnough) {
      setErrorMessage('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (!doPasswordsMatch) {
      setErrorMessage('Las contraseñas no coinciden.');
      return;
    }

    setIsLoading(true);
    try {
      await authService.resetPassword(email.trim(), otpCode.trim(), newPassword);
      setStep('SUCCESS');
    } catch (err: any) {
      setErrorMessage(err.message || 'No se pudo actualizar la contraseña.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* Círculos decorativos de fondo */}
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
          {/* Header con botón atrás */}
          <View style={styles.headerRow}>
            {step !== 'SUCCESS' ? (
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => {
                  if (step === 'OTP') setStep('EMAIL');
                  else if (step === 'NEW_PASSWORD') setStep('OTP');
                  else onBackToLogin();
                }}
              >
                <MaterialIcons name="arrow-back" size={24} color={Colors.onBackground} />
              </TouchableOpacity>
            ) : (
              <View style={styles.backButtonPlaceholder} />
            )}

            {/* Stepper visual 1 - 2 - 3 */}
            {step !== 'SUCCESS' && (
              <View style={styles.stepperContainer}>
                <View style={[styles.stepDot, step === 'EMAIL' && styles.stepDotActive, (step === 'OTP' || step === 'NEW_PASSWORD') && styles.stepDotDone]}>
                  <Text style={[styles.stepDotText, (step === 'EMAIL' || step === 'OTP' || step === 'NEW_PASSWORD') && styles.stepDotTextActive]}>1</Text>
                </View>
                <View style={[styles.stepLine, (step === 'OTP' || step === 'NEW_PASSWORD') && styles.stepLineActive]} />
                <View style={[styles.stepDot, step === 'OTP' && styles.stepDotActive, step === 'NEW_PASSWORD' && styles.stepDotDone]}>
                  <Text style={[styles.stepDotText, (step === 'OTP' || step === 'NEW_PASSWORD') && styles.stepDotTextActive]}>2</Text>
                </View>
                <View style={[styles.stepLine, step === 'NEW_PASSWORD' && styles.stepLineActive]} />
                <View style={[styles.stepDot, step === 'NEW_PASSWORD' && styles.stepDotActive]}>
                  <Text style={[styles.stepDotText, step === 'NEW_PASSWORD' && styles.stepDotTextActive]}>3</Text>
                </View>
              </View>
            )}
            <View style={{ width: 40 }} />
          </View>

          {/* Tarjeta Principal */}
          <View style={styles.card}>
            {/* Mensajes de feedback */}
            {errorMessage && (
              <View style={styles.errorAlert}>
                <MaterialIcons name="error-outline" size={20} color={Colors.error} />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            )}

            {successNotice && (
              <View style={styles.successAlert}>
                <MaterialIcons name="check-circle-outline" size={20} color={Colors.tertiary} />
                <Text style={styles.successAlertText}>{successNotice}</Text>
              </View>
            )}

            {/* ========================================================= */}
            {/* PASO 1: INGRESAR EMAIL */}
            {/* ========================================================= */}
            {step === 'EMAIL' && (
              <View>
                <View style={styles.iconCircle}>
                  <MaterialIcons name="lock-reset" size={36} color={Colors.primaryContainer} />
                </View>

                <Text style={styles.title}>¿Olvidaste tu contraseña?</Text>
                <Text style={styles.subtitle}>
                  Ingresa tu correo electrónico registrado y te enviaremos un código de seguridad de 6 dígitos para restablecerla.
                </Text>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>CORREO ELECTRÓNICO</Text>
                  <View style={[styles.inputWrapper, emailFocused && styles.inputWrapperFocused]}>
                    <MaterialIcons
                      name="mail-outline"
                      size={20}
                      color={emailFocused ? Colors.primaryContainer : Colors.onSurfaceVariant}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="ejemplo@correo.com"
                      placeholderTextColor={Colors.onSurfaceVariant + '70'}
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

                <TouchableOpacity
                  style={[styles.primaryButton, (!isEmailValid || isLoading) && styles.buttonDisabled]}
                  onPress={handleRequestOtp}
                  disabled={!isEmailValid || isLoading}
                  activeOpacity={0.85}
                >
                  {isLoading ? (
                    <ActivityIndicator color={Colors.onPrimary} size="small" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Enviar código de seguridad</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity style={styles.cancelButton} onPress={() => onBackToLogin()}>
                  <Text style={styles.cancelButtonText}>Volver a Iniciar Sesión</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ========================================================= */}
            {/* PASO 2: VALIDAR CÓDIGO OTP */}
            {/* ========================================================= */}
            {step === 'OTP' && (
              <View>
                <View style={styles.iconCircle}>
                  <MaterialIcons name="mark-email-read" size={36} color={Colors.primaryContainer} />
                </View>

                <Text style={styles.title}>Verifica tu código</Text>
                <Text style={styles.subtitle}>
                  Hemos enviado un código OTP de 6 dígitos a:
                </Text>
                <Text style={styles.emailBadge}>{email.trim()}</Text>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>CÓDIGO DE SEGURIDAD (6 DÍGITOS)</Text>
                  <View style={[styles.inputWrapper, styles.otpWrapper, otpFocused && styles.inputWrapperFocused]}>
                    <MaterialIcons
                      name="pin"
                      size={20}
                      color={otpFocused ? Colors.primaryContainer : Colors.onSurfaceVariant}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={[styles.input, styles.otpInput]}
                      placeholder="123456"
                      placeholderTextColor={Colors.onSurfaceVariant + '60'}
                      value={otpCode}
                      onChangeText={(val) => setOtpCode(val.replace(/\D/g, '').slice(0, 6))}
                      onFocus={() => setOtpFocused(true)}
                      onBlur={() => setOtpFocused(false)}
                      keyboardType="number-pad"
                      maxLength={6}
                      editable={!isLoading}
                      autoFocus
                    />
                  </View>
                </View>

                {/* Contador de reenvío */}
                <View style={styles.resendRow}>
                  {canResend ? (
                    <TouchableOpacity onPress={handleResendOtp} disabled={isLoading}>
                      <Text style={styles.resendLink}>Reenviar código ahora</Text>
                    </TouchableOpacity>
                  ) : (
                    <Text style={styles.resendCountdown}>
                      Reenviar código en <Text style={styles.countdownBold}>{countdown}s</Text>
                    </Text>
                  )}
                </View>

                <TouchableOpacity
                  style={[styles.primaryButton, (otpCode.length < 6 || isLoading) && styles.buttonDisabled]}
                  onPress={handleVerifyOtp}
                  disabled={otpCode.length < 6 || isLoading}
                  activeOpacity={0.85}
                >
                  {isLoading ? (
                    <ActivityIndicator color={Colors.onPrimary} size="small" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Verificar Código</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity style={styles.cancelButton} onPress={() => setStep('EMAIL')}>
                  <Text style={styles.cancelButtonText}>Cambiar correo electrónico</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ========================================================= */}
            {/* PASO 3: NUEVA CLAVE */}
            {/* ========================================================= */}
            {step === 'NEW_PASSWORD' && (
              <View>
                <View style={styles.iconCircle}>
                  <MaterialIcons name="vpn-key" size={36} color={Colors.primaryContainer} />
                </View>

                <Text style={styles.title}>Crea una nueva clave</Text>
                <Text style={styles.subtitle}>
                  Ingresa tu nueva contraseña para acceder a FoodPass.
                </Text>

                {/* Campo Nueva Contraseña */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>NUEVA CONTRASEÑA</Text>
                  <View style={[styles.inputWrapper, newPassFocused && styles.inputWrapperFocused]}>
                    <MaterialIcons
                      name="lock-outline"
                      size={20}
                      color={newPassFocused ? Colors.primaryContainer : Colors.onSurfaceVariant}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      placeholder="Al menos 6 caracteres"
                      placeholderTextColor={Colors.onSurfaceVariant + '70'}
                      value={newPassword}
                      onChangeText={setNewPassword}
                      onFocus={() => setNewPassFocused(true)}
                      onBlur={() => setNewPassFocused(false)}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      editable={!isLoading}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.eyeButton}
                    >
                      <MaterialIcons
                        name={showPassword ? 'visibility-off' : 'visibility'}
                        size={20}
                        color={Colors.onSurfaceVariant}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Campo Confirmar Contraseña */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>CONFIRMAR CONTRASEÑA</Text>
                  <View style={[styles.inputWrapper, confirmPassFocused && styles.inputWrapperFocused]}>
                    <MaterialIcons
                      name="lock-clock"
                      size={20}
                      color={confirmPassFocused ? Colors.primaryContainer : Colors.onSurfaceVariant}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      placeholder="Repite tu nueva contraseña"
                      placeholderTextColor={Colors.onSurfaceVariant + '70'}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      onFocus={() => setConfirmPassFocused(true)}
                      onBlur={() => setConfirmPassFocused(false)}
                      secureTextEntry={!showConfirmPassword}
                      autoCapitalize="none"
                      editable={!isLoading}
                    />
                    <TouchableOpacity
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={styles.eyeButton}
                    >
                      <MaterialIcons
                        name={showConfirmPassword ? 'visibility-off' : 'visibility'}
                        size={20}
                        color={Colors.onSurfaceVariant}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Indicadores de Requisitos */}
                <View style={styles.requirementsContainer}>
                  <View style={styles.reqRow}>
                    <MaterialIcons
                      name={isPasswordLongEnough ? 'check-circle' : 'radio-button-unchecked'}
                      size={16}
                      color={isPasswordLongEnough ? Colors.tertiary : Colors.onSurfaceVariant + '70'}
                    />
                    <Text style={[styles.reqText, isPasswordLongEnough && styles.reqTextValid]}>
                      Mínimo 6 caracteres
                    </Text>
                  </View>

                  <View style={styles.reqRow}>
                    <MaterialIcons
                      name={doPasswordsMatch ? 'check-circle' : 'radio-button-unchecked'}
                      size={16}
                      color={doPasswordsMatch ? Colors.tertiary : Colors.onSurfaceVariant + '70'}
                    />
                    <Text style={[styles.reqText, doPasswordsMatch && styles.reqTextValid]}>
                      Las contraseñas coinciden
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    (!isPasswordLongEnough || !doPasswordsMatch || isLoading) && styles.buttonDisabled,
                  ]}
                  onPress={handleResetPassword}
                  disabled={!isPasswordLongEnough || !doPasswordsMatch || isLoading}
                  activeOpacity={0.85}
                >
                  {isLoading ? (
                    <ActivityIndicator color={Colors.onPrimary} size="small" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Guardar Nueva Contraseña</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* ========================================================= */}
            {/* PASO 4: ÉXITO */}
            {/* ========================================================= */}
            {step === 'SUCCESS' && (
              <View style={styles.successView}>
                <View style={styles.successIconCircle}>
                  <MaterialIcons name="check-circle" size={54} color={Colors.tertiary} />
                </View>

                <Text style={styles.title}>¡Contraseña Restablecida!</Text>
                <Text style={styles.subtitle}>
                  Tu clave ha sido actualizada exitosamente. Ya puedes iniciar sesión con tu nueva contraseña.
                </Text>

                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => onBackToLogin(email.trim())}
                  activeOpacity={0.85}
                >
                  <Text style={styles.primaryButtonText}>Iniciar Sesión Ahora</Text>
                </TouchableOpacity>
              </View>
            )}
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  blobTopLeft: {
    position: 'absolute',
    top: -60,
    left: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: Colors.surfaceContainerLow,
    opacity: 0.7,
  },
  blobBottomRight: {
    position: 'absolute',
    bottom: -80,
    right: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: Colors.surfaceContainer,
    opacity: 0.5,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceContainerLowest,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: Colors.onBackground,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  backButtonPlaceholder: {
    width: 40,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.surfaceContainerHighest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: {
    backgroundColor: Colors.primaryContainer,
  },
  stepDotDone: {
    backgroundColor: Colors.tertiary,
  },
  stepDotText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
  },
  stepDotTextActive: {
    color: Colors.onPrimary,
  },
  stepLine: {
    width: 20,
    height: 2,
    backgroundColor: Colors.surfaceContainerHighest,
    marginHorizontal: 4,
  },
  stepLineActive: {
    backgroundColor: Colors.tertiary,
  },
  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xxxl,
    padding: 24,
    marginTop: 10,
    elevation: 4,
    shadowColor: Colors.onBackground,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    ...Typography.headlineSm,
    color: Colors.onBackground,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    ...Typography.bodyMd,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  emailBadge: {
    ...Typography.titleSm,
    color: Colors.primary,
    textAlign: 'center',
    backgroundColor: Colors.surfaceContainerLow,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.full,
    alignSelf: 'center',
    marginBottom: 24,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    ...Typography.labelSm,
    color: Colors.onSurfaceVariant,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainer,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: 16,
    height: 54,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  inputWrapperFocused: {
    borderColor: Colors.primaryContainer,
    backgroundColor: Colors.surfaceContainerLowest,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    ...Typography.bodyMd,
    color: Colors.onBackground,
  },
  otpWrapper: {
    justifyContent: 'center',
  },
  otpInput: {
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 8,
  },
  eyeButton: {
    padding: 8,
  },
  resendRow: {
    alignItems: 'center',
    marginBottom: 20,
  },
  resendLink: {
    ...Typography.labelLg,
    color: Colors.primaryContainer,
    fontWeight: '700',
  },
  resendCountdown: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
  },
  countdownBold: {
    fontWeight: '700',
    color: Colors.onBackground,
  },
  requirementsContainer: {
    backgroundColor: Colors.surfaceContainerLow,
    padding: 14,
    borderRadius: BorderRadius.md,
    marginBottom: 20,
    gap: 8,
  },
  reqRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reqText: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
  },
  reqTextValid: {
    color: Colors.tertiary,
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: Colors.primaryContainer,
    borderRadius: BorderRadius.xl,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: Colors.primaryContainer,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    ...Typography.labelLg,
    color: Colors.onPrimary,
    fontWeight: '700',
  },
  cancelButton: {
    marginTop: 16,
    alignItems: 'center',
    paddingVertical: 8,
  },
  cancelButtonText: {
    ...Typography.labelMd,
    color: Colors.onSurfaceVariant,
    fontWeight: '600',
  },
  errorAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.errorContainer,
    borderRadius: BorderRadius.md,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    flex: 1,
    ...Typography.bodySm,
    color: Colors.onErrorContainer,
  },
  successAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.md,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  successAlertText: {
    flex: 1,
    ...Typography.bodySm,
    color: Colors.tertiary,
    fontWeight: '600',
  },
  successView: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  successIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
});
