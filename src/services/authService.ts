// src/services/authService.ts
//
// Servicio para autenticación y recuperación de contraseña (RFM10 - T14).
// Conecta la aplicación móvil con los endpoints de la API de FoodPass.

import { apiClient } from './apiClient';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

export const authService = {
  /**
   * Solicita el envío de un código OTP al correo electrónico registrado.
   * Endpoint: POST /api/auth/forgot-password
   */
  async forgotPassword(email: string): Promise<ApiResponse<{ email: string; expiresInMinutes: number }>> {
    try {
      const response = await apiClient.post<ApiResponse<{ email: string; expiresInMinutes: number }>>(
        '/auth/forgot-password',
        { email: email.trim() }
      );
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Error al solicitar el código de recuperación';
      throw new Error(message);
    }
  },

  /**
   * Valida que el código OTP ingresado por el usuario sea correcto y vigente.
   * Endpoint: POST /api/auth/verify-otp
   */
  async verifyOtp(email: string, code: string): Promise<ApiResponse<{ email: string; verified: boolean }>> {
    try {
      const response = await apiClient.post<ApiResponse<{ email: string; verified: boolean }>>(
        '/auth/verify-otp',
        {
          email: email.trim(),
          code: code.trim(),
        }
      );
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'El código es inválido o ha expirado';
      throw new Error(message);
    }
  },

  /**
   * Actualiza la contraseña del usuario en el backend tras validar el código.
   * Endpoint: POST /api/auth/reset-password
   */
  async resetPassword(
    email: string,
    code: string,
    newPassword: string
  ): Promise<ApiResponse> {
    try {
      const response = await apiClient.post<ApiResponse>(
        '/auth/reset-password',
        {
          email: email.trim(),
          code: code.trim(),
          newPassword,
        }
      );
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Error al actualizar la contraseña';
      throw new Error(message);
    }
  },
};
