// src/screens/CanjeScreen.tsx
// Pantalla de canje con generación manual de QR (vigencia diaria hasta medianoche)

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import Header from '../components/shared/Header';
import { Colors, BorderRadius } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../services/apiClient';

// Tipo de estado del QR
type QRState = 'idle' | 'loading' | 'generated' | 'expired' | 'error' | 'ineligible' | 'used';

interface QRData {
  token: string;
  expiresAt: string; // ISO string
  code: string;      // código corto para mostrar
}

export default function CanjeScreen() {
  const [activeTab, setActiveTab] = useState<'qr' | 'codigo'>('qr');
  const [qrState, setQrState] = useState<QRState>('idle');
  const [qrData, setQrData] = useState<QRData | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const { userData } = useAuth();

  // ── Generar QR manualmente ──────────────────────────────────────────────────
  const handleGenerateQR = useCallback(async () => {
    setQrState('loading');
    setErrorMsg('');
    try {
      const response = await apiClient.post('/api/canje/generar-qr');
      const data = response.data?.data || response.data;

      if (data?.token) {
        setQrData({
          token: data.token,
          expiresAt: data.expiresAt || data.expires_at || '',
          code: data.code || data.codigoManual || `FP-${Math.floor(Math.random() * 9000) + 1000}`,
        });
        setQrState('generated');
      } else {
        setQrState('error');
        setErrorMsg(response.data?.message || 'No se pudo generar el QR.');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Error de conexión';
      if (err.response?.status === 403) {
        setQrState('ineligible');
        setErrorMsg(msg);
      } else if (err.response?.status === 409) {
        setQrState('used');
        setErrorMsg(msg);
      } else {
        setQrState('error');
        setErrorMsg(msg);
      }
    }
  }, []);

  // ── Expiración formateada ───────────────────────────────────────────────────
  const getExpiresLabel = () => {
    if (!qrData?.expiresAt) {
      // Si no hay fecha del backend, mostrar medianoche de hoy
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(23, 59, 59, 0);
      return `Válido hasta las 11:59 p. m. de hoy`;
    }
    try {
      const d = new Date(qrData.expiresAt);
      const h = d.getHours().toString().padStart(2, '0');
      const m = d.getMinutes().toString().padStart(2, '0');
      return `Válido hasta las ${h}:${m}`;
    } catch {
      return 'Válido hasta medianoche';
    }
  };

  // ── Render QR Section ───────────────────────────────────────────────────────
  const renderQRSection = () => {
    switch (qrState) {
      case 'idle':
        return (
          <View style={styles.qrSection}>
            <View style={styles.qrIdleBox}>
              <MaterialIcons name="qr-code-2" size={100} color={Colors.outlineVariant} />
              <Text style={styles.qrIdleTitle}>Sin código generado</Text>
              <Text style={styles.qrIdleSubtitle}>
                Presiona el botón para generar tu código QR de hoy
              </Text>
            </View>
            <TouchableOpacity style={styles.generateBtn} onPress={handleGenerateQR} activeOpacity={0.85}>
              <MaterialIcons name="qr-code" size={22} color="#fff" />
              <Text style={styles.generateBtnText}>GENERAR CÓDIGO QR</Text>
            </TouchableOpacity>
          </View>
        );

      case 'loading':
        return (
          <View style={styles.qrSection}>
            <View style={styles.qrIdleBox}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.qrIdleTitle}>Generando tu QR...</Text>
            </View>
          </View>
        );

      case 'generated':
        return (
          <View style={styles.qrSection}>
            <View style={styles.qrPlaceholder}>
              <View style={[styles.qrCorner, styles.qrCornerTL]} />
              <View style={[styles.qrCorner, styles.qrCornerTR]} />
              <View style={[styles.qrCorner, styles.qrCornerBL]} />
              <View style={[styles.qrCorner, styles.qrCornerBR]} />
              <MaterialIcons name="qr-code-2" size={160} color={Colors.onSurface} />
              <View style={styles.qrCenterDot}>
                <MaterialIcons name="restaurant-menu" size={24} color={Colors.primaryContainer} />
              </View>
            </View>

            <Text style={styles.qrLabel}>{qrData?.code ?? 'FP-QR'}</Text>
            <Text style={styles.qrSubtitle}>
              Muestra este código al cajero para canjear tu almuerzo
            </Text>

            <View style={styles.timer}>
              <MaterialIcons name="timer" size={14} color={Colors.tertiary} />
              <Text style={styles.timerText}>{getExpiresLabel()}</Text>
            </View>

            <TouchableOpacity style={[styles.generateBtn, { marginTop: 16 }]} onPress={handleGenerateQR} activeOpacity={0.85}>
              <MaterialIcons name="refresh" size={20} color="#fff" />
              <Text style={styles.generateBtnText}>REGENERAR QR</Text>
            </TouchableOpacity>
          </View>
        );

      case 'error':
        return (
          <View style={styles.qrSection}>
            <View style={styles.qrIdleBox}>
              <MaterialIcons name="wifi-off" size={80} color={Colors.error || '#B00020'} />
              <Text style={styles.qrIdleTitle}>Error de conexión</Text>
              <Text style={styles.qrIdleSubtitle}>{errorMsg}</Text>
            </View>
            <TouchableOpacity style={styles.generateBtn} onPress={handleGenerateQR} activeOpacity={0.85}>
              <MaterialIcons name="refresh" size={22} color="#fff" />
              <Text style={styles.generateBtnText}>REINTENTAR</Text>
            </TouchableOpacity>
          </View>
        );

      case 'ineligible':
        return (
          <View style={styles.qrSection}>
            <View style={styles.qrIdleBox}>
              <MaterialIcons name="block" size={80} color={Colors.error || '#B00020'} />
              <Text style={styles.qrIdleTitle}>No elegible</Text>
              <Text style={styles.qrIdleSubtitle}>{errorMsg}</Text>
            </View>
          </View>
        );

      case 'used':
        return (
          <View style={styles.qrSection}>
            <View style={styles.qrIdleBox}>
              <MaterialIcons name="check-circle" size={80} color={Colors.tertiary} />
              <Text style={styles.qrIdleTitle}>Canje ya realizado</Text>
              <Text style={styles.qrIdleSubtitle}>Ya canjeaste tu almuerzo hoy. Vuelve mañana.</Text>
            </View>
          </View>
        );

      case 'expired':
        return (
          <View style={styles.qrSection}>
            <View style={styles.qrIdleBox}>
              <MaterialIcons name="schedule" size={80} color={Colors.onSurfaceVariant} />
              <Text style={styles.qrIdleTitle}>QR vencido</Text>
              <Text style={styles.qrIdleSubtitle}>El código expiró. Genera uno nuevo.</Text>
            </View>
            <TouchableOpacity style={styles.generateBtn} onPress={handleGenerateQR} activeOpacity={0.85}>
              <MaterialIcons name="qr-code" size={22} color="#fff" />
              <Text style={styles.generateBtnText}>GENERAR NUEVO QR</Text>
            </TouchableOpacity>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Header title="Canje de Almuerzo" showSearch />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* === TARJETA PRINCIPAL DE CANJE === */}
        <View style={styles.qrCard}>
          {/* Tabs QR / Código manual */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'qr' && styles.tabActive]}
              onPress={() => setActiveTab('qr')}
            >
              <MaterialIcons
                name="qr-code"
                size={16}
                color={activeTab === 'qr' ? Colors.onSurface : Colors.onSurfaceVariant}
              />
              <Text style={[styles.tabText, activeTab === 'qr' && styles.tabTextActive]}>
                Código QR
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'codigo' && styles.tabActive]}
              onPress={() => setActiveTab('codigo')}
            >
              <MaterialIcons
                name="pin"
                size={16}
                color={activeTab === 'codigo' ? Colors.onSurface : Colors.onSurfaceVariant}
              />
              <Text style={[styles.tabText, activeTab === 'codigo' && styles.tabTextActive]}>
                Código Manual
              </Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'qr' ? (
            renderQRSection()
          ) : (
            /* === VISTA CÓDIGO MANUAL === */
            <View style={styles.codeSection}>
              <Text style={styles.codeTitle}>Tu código de hoy</Text>
              <View style={styles.codeDisplay}>
                {(qrData?.code || 'FP-7834').split('').map((char, i) => (
                  <View key={i} style={styles.codeChar}>
                    <Text style={styles.codeCharText}>{char}</Text>
                  </View>
                ))}
              </View>
              <Text style={styles.codeSubtitle}>
                {qrData?.code
                  ? 'Dicta este código en caja si el lector QR no funciona'
                  : 'Presiona el botón para generar tu código manual de hoy'}
              </Text>

              <TouchableOpacity
                style={[styles.generateBtn, { marginTop: 20 }]}
                onPress={handleGenerateQR}
                activeOpacity={0.85}
                disabled={qrState === 'loading'}
              >
                {qrState === 'loading' ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <MaterialIcons name="pin" size={20} color="#fff" />
                    <Text style={styles.generateBtnText}>
                      {qrData?.code ? 'REGENERAR CÓDIGO' : 'GENERAR CÓDIGO'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* === INFO DEL PLAN === */}
        <View style={styles.planInfo}>
          <View style={styles.planInfoRow}>
            <View style={styles.planInfoIcon}>
              <MaterialIcons name="calendar-today" size={18} color={Colors.primary} />
            </View>
            <View style={styles.planInfoText}>
              <Text style={styles.planInfoLabel}>CICLO ACTUAL</Text>
              <Text style={styles.planInfoValue}>Noviembre 2026 — días hábiles</Text>
            </View>
          </View>

          <View style={styles.planInfoDivider} />

          <View style={styles.planInfoRow}>
            <View style={styles.planInfoIcon}>
              <MaterialIcons name="schedule" size={18} color={Colors.primary} />
            </View>
            <View style={styles.planInfoText}>
              <Text style={styles.planInfoLabel}>HORARIO DE CANJE</Text>
              <Text style={styles.planInfoValue}>11:30 AM – 2:30 PM (días hábiles)</Text>
            </View>
          </View>

          <View style={styles.planInfoDivider} />

          <View style={styles.planInfoRow}>
            <View style={styles.planInfoIcon}>
              <MaterialIcons name="info-outline" size={18} color={Colors.primary} />
            </View>
            <View style={styles.planInfoText}>
              <Text style={styles.planInfoLabel}>VIGENCIA DEL QR</Text>
              <Text style={styles.planInfoValue}>El QR vence a medianoche (hora Colombia)</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  // TARJETA QR
  qrCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xxxl,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#121f05',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 6,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceContainer,
    borderRadius: BorderRadius.xl,
    padding: 4,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: BorderRadius.lg,
  },
  tabActive: {
    backgroundColor: Colors.surfaceContainerLowest,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.onSurfaceVariant,
  },
  tabTextActive: {
    color: Colors.onSurface,
    fontWeight: '700',
  },
  // QR VIEW
  qrSection: {
    alignItems: 'center',
  },
  qrIdleBox: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  qrIdleTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.onSurface,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  qrIdleSubtitle: {
    fontSize: 13,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 18,
  },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.xl,
    paddingVertical: 16,
    paddingHorizontal: 28,
    marginTop: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  generateBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 1,
  },
  qrPlaceholder: {
    width: 220,
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xxl,
    marginBottom: 20,
  },
  qrCorner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: Colors.primaryContainer,
    borderWidth: 3,
  },
  qrCornerTL: { top: 12, left: 12, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 6 },
  qrCornerTR: { top: 12, right: 12, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 6 },
  qrCornerBL: { bottom: 12, left: 12, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 6 },
  qrCornerBR: { bottom: 12, right: 12, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 6 },
  qrCenterDot: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceContainerLowest,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.surfaceContainerLow,
  },
  qrLabel: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.onSurface,
    letterSpacing: 2,
    marginBottom: 8,
  },
  qrSubtitle: {
    fontSize: 13,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  timer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.tertiaryContainer + '30',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
  },
  timerText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.tertiary,
  },
  // CÓDIGO MANUAL (sin modificar)
  codeSection: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  codeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.onSurface,
    marginBottom: 20,
  },
  codeDisplay: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  codeChar: {
    width: 38,
    height: 48,
    backgroundColor: Colors.surfaceContainer,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  codeCharText: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.onSurface,
    letterSpacing: 0,
  },
  codeSubtitle: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
  },
  // INFO DEL PLAN
  planInfo: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xxl,
    padding: 20,
    marginBottom: 20,
  },
  planInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 4,
  },
  planInfoIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.surfaceContainerLow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  planInfoText: { flex: 1 },
  planInfoLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
    letterSpacing: 1,
    marginBottom: 2,
  },
  planInfoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  planInfoDivider: {
    height: 16,
  },
  // Colores de error (fallback si no existe en Colors)
  error: {
    color: '#B00020',
  },
});
