// src/components/PedidoStatusTracker.tsx
//
// Componente de seguimiento de pedidos en tiempo real (T13 - RFM14).
// Consulta intermitentemente (Polling) el estado del pedido activo a través del hook
// useOrderStatusPolling contra el endpoint GET /api/pedidos/:id/status.
// Cumple el criterio de finalización: al cambiar el estado en MySQL, la interfaz se
// actualiza automáticamente sin necesidad de reiniciar la aplicación.

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, BorderRadius, Shadows, Typography } from '../theme/colors';
import { useOrderStatusPolling } from '../hooks/useOrderStatusPolling';
import { OrderStatusType, ORDER_STATUS_LABELS } from '../services/orderService';

interface PedidoStatusTrackerProps {
  initialOrderId?: number | string;
  compact?: boolean;
  onViewDetails?: (orderId: number | string) => void;
  showTestingControls?: boolean;
}

interface StepInfo {
  key: OrderStatusType;
  title: string;
  icon: keyof typeof MaterialIcons.glyphMap;
}

const STEPS: StepInfo[] = [
  { key: 'pendiente', title: 'Recibido', icon: 'receipt-long' },
  { key: 'en_preparacion', title: 'En preparación', icon: 'outdoor-grill' },
  { key: 'listo', title: 'Listo', icon: 'notifications-active' },
  { key: 'entregado', title: 'Entregado', icon: 'task-alt' },
];

export default function PedidoStatusTracker({
  initialOrderId = 14,
  compact = false,
  onViewDetails,
  showTestingControls = true,
}: PedidoStatusTrackerProps) {
  const [currentOrderId, setCurrentOrderId] = useState<number | string>(initialOrderId);
  const [showTester, setShowTester] = useState<boolean>(false);

  const {
    order,
    status,
    statusLabel,
    loading,
    error,
    lastPolledAt,
    pollCount,
    isPolling,
    refetch,
    simulateStatusChange,
  } = useOrderStatusPolling({
    orderId: currentOrderId,
    intervalMs: 4000, // Consulta cada 4 segundos
    enabled: true,
  });

  // Determinar índice del paso actual para la barra de progreso
  const getStepIndex = (st: OrderStatusType): number => {
    switch (st) {
      case 'pendiente':
        return 0;
      case 'en_preparacion':
        return 1;
      case 'listo':
        return 2;
      case 'entregado':
        return 3;
      case 'cancelado':
        return -1;
      default:
        return 0;
    }
  };

  const activeIndex = getStepIndex(status);

  // Colores dinámicos según el estado
  const getStatusColor = (st: OrderStatusType) => {
    switch (st) {
      case 'pendiente':
        return Colors.primary;
      case 'en_preparacion':
        return '#d97706'; // Naranja ámbar cálido
      case 'listo':
        return Colors.tertiary; // Verde de éxito
      case 'entregado':
        return '#047857'; // Verde oscuro esmeralda
      case 'cancelado':
        return Colors.error;
      default:
        return Colors.primary;
    }
  };

  const statusColor = getStatusColor(status);

  const formatTime = (date: Date | null) => {
    if (!date) return '--:--';
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <View style={[styles.container, compact && styles.compactContainer]}>
      {/* CABECERA DE LA TARJETA */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.badgeLive}>
            <View style={[styles.liveDot, { backgroundColor: isPolling ? '#22c55e' : '#9ca3af' }]} />
            <Text style={styles.liveText}>
              {isPolling ? 'EN VIVO (POLLING 4s)' : 'PAUSADO'}
            </Text>
          </View>
          <Text style={styles.orderTitle}>Pedido #{currentOrderId}</Text>
          <Text style={styles.orderSubtitle}>
            {order?.restaurante || 'FoodPass Sede Centro'}
          </Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={refetch}
            disabled={loading}
            activeOpacity={0.7}
          >
            {loading ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <MaterialIcons name="refresh" size={20} color={Colors.primary} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* BANNER PRINCIPAL DEL ESTADO (RFM14: Mostrar "En preparación", "Listo", etc.) */}
      <View style={[styles.statusHighlight, { borderColor: `${statusColor}40`, backgroundColor: `${statusColor}12` }]}>
        <View style={[styles.statusIconWrap, { backgroundColor: statusColor }]}>
          <MaterialIcons
            name={
              status === 'cancelado'
                ? 'close'
                : status === 'listo'
                ? 'check-circle'
                : status === 'entregado'
                ? 'task-alt'
                : status === 'en_preparacion'
                ? 'outdoor-grill'
                : 'schedule'
            }
            size={24}
            color="#ffffff"
          />
        </View>
        <View style={styles.statusTextContainer}>
          <Text style={styles.statusCaption}>Estado actual del pedido</Text>
          <Text style={[styles.statusTitle, { color: statusColor }]}>
            {statusLabel}
          </Text>
        </View>
        {status === 'listo' && (
          <View style={styles.readyBadge}>
            <Text style={styles.readyBadgeText}>¡Pasa a retirar!</Text>
          </View>
        )}
      </View>

      {/* BARRA DE PROGRESO DE ESTADOS */}
      {status !== 'cancelado' ? (
        <View style={styles.stepsContainer}>
          {STEPS.map((step, idx) => {
            const isCompleted = idx < activeIndex;
            const isCurrent = idx === activeIndex;

            return (
              <React.Fragment key={step.key}>
                {/* Paso / Círculo */}
                <View style={styles.stepItem}>
                  <View
                    style={[
                      styles.stepCircle,
                      isCompleted && styles.stepCircleCompleted,
                      isCurrent && [styles.stepCircleCurrent, { borderColor: statusColor }],
                    ]}
                  >
                    {isCompleted ? (
                      <MaterialIcons name="check" size={16} color="#ffffff" />
                    ) : (
                      <MaterialIcons
                        name={step.icon}
                        size={16}
                        color={isCurrent ? statusColor : Colors.outline}
                      />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.stepLabel,
                      (isCompleted || isCurrent) && styles.stepLabelActive,
                      isCurrent && { color: statusColor, fontWeight: '700' },
                    ]}
                    numberOfLines={1}
                  >
                    {step.title}
                  </Text>
                </View>

                {/* Línea conectora entre pasos */}
                {idx < STEPS.length - 1 && (
                  <View
                    style={[
                      styles.stepConnector,
                      idx < activeIndex && styles.stepConnectorCompleted,
                    ]}
                  />
                )}
              </React.Fragment>
            );
          })}
        </View>
      ) : (
        <View style={styles.cancelledBanner}>
          <MaterialIcons name="error-outline" size={20} color={Colors.error} />
          <Text style={styles.cancelledText}>
            Este pedido ha sido cancelado. Si tienes preguntas, contacta a soporte.
          </Text>
        </View>
      )}

      {/* PIE DE TARJETA: INFO DE POLLING Y ÚLTIMA CONSULTA */}
      <View style={styles.footer}>
        <View style={styles.footerInfo}>
          <MaterialIcons name="sync" size={14} color={Colors.onSurfaceVariant} />
          <Text style={styles.footerText}>
            Última sincronización: {formatTime(lastPolledAt)} ({pollCount} consultas)
          </Text>
        </View>

        {showTestingControls && (
          <TouchableOpacity
            style={styles.toggleTesterBtn}
            onPress={() => setShowTester(!showTester)}
          >
            <Text style={styles.toggleTesterText}>
              {showTester ? 'Ocultar prueba' : 'Probar cambio BD'}
            </Text>
            <MaterialIcons
              name={showTester ? 'expand-less' : 'expand-more'}
              size={16}
              color={Colors.primary}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* PANEL DE PRUEBAS / SIMULADOR DE CAMBIO EN MYSQL (Criterio de aceptación T13) */}
      {showTester && (
        <View style={styles.testerPanel}>
          <View style={styles.testerHeader}>
            <MaterialIcons name="build" size={16} color={Colors.primary} />
            <Text style={styles.testerTitle}>
              Simular cambio en MySQL (UPDATE pedidos SET estado=...)
            </Text>
          </View>
          <Text style={styles.testerDescription}>
            Toca cualquiera de los estados para verificar que la interfaz se actualiza de forma reactiva sin reiniciar la app:
          </Text>

          <View style={styles.testerButtonsRow}>
            {(['pendiente', 'en_preparacion', 'listo', 'entregado', 'cancelado'] as OrderStatusType[]).map(
              (st) => {
                const isActive = status === st;
                return (
                  <TouchableOpacity
                    key={st}
                    style={[
                      styles.testerBtn,
                      isActive && { backgroundColor: getStatusColor(st) },
                    ]}
                    onPress={() => simulateStatusChange(st)}
                  >
                    <Text
                      style={[
                        styles.testerBtnText,
                        isActive && styles.testerBtnTextActive,
                      ]}
                    >
                      {st === 'en_preparacion'
                        ? 'En prep.'
                        : st === 'pendiente'
                        ? 'Pend.'
                        : st === 'listo'
                        ? 'Listo'
                        : st === 'entregado'
                        ? 'Entreg.'
                        : 'Canc.'}
                    </Text>
                  </TouchableOpacity>
                );
              }
            )}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xxl,
    padding: 18,
    marginHorizontal: 16,
    marginVertical: 10,
    ...Shadows.card,
    borderWidth: 1,
    borderColor: 'rgba(155, 69, 0, 0.08)',
  },
  compactContainer: {
    padding: 14,
    marginHorizontal: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  headerLeft: {
    flex: 1,
  },
  badgeLive: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    marginBottom: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803d',
    letterSpacing: 0.5,
  },
  orderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.onBackground,
    letterSpacing: -0.3,
  },
  orderSubtitle: {
    fontSize: 13,
    color: Colors.onSurfaceVariant,
    marginTop: 1,
  },
  headerRight: {
    marginLeft: 12,
  },
  refreshButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusHighlight: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: 16,
  },
  statusIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusCaption: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  statusTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginTop: 2,
  },
  readyBadge: {
    backgroundColor: Colors.tertiary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  readyBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  stepsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  stepItem: {
    alignItems: 'center',
    width: 62,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  stepCircleCompleted: {
    backgroundColor: Colors.tertiary,
  },
  stepCircleCurrent: {
    backgroundColor: '#ffffff',
    borderWidth: 2.5,
  },
  stepLabel: {
    fontSize: 10,
    color: Colors.outline,
    textAlign: 'center',
    fontWeight: '500',
  },
  stepLabelActive: {
    color: Colors.onBackground,
  },
  stepConnector: {
    flex: 1,
    height: 3,
    backgroundColor: Colors.surfaceContainerHigh,
    marginBottom: 20,
    marginHorizontal: 2,
  },
  stepConnectorCompleted: {
    backgroundColor: Colors.tertiary,
  },
  cancelledBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.errorContainer,
    padding: 12,
    borderRadius: BorderRadius.md,
    marginVertical: 6,
  },
  cancelledText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 12,
    color: Colors.onErrorContainer,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceContainerHigh,
    paddingTop: 10,
    marginTop: 8,
  },
  footerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  footerText: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    marginLeft: 5,
  },
  toggleTesterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  toggleTesterText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  testerPanel: {
    marginTop: 12,
    padding: 12,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  testerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  testerTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
    marginLeft: 6,
  },
  testerDescription: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    marginBottom: 8,
    lineHeight: 15,
  },
  testerButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  testerBtn: {
    flex: 1,
    paddingVertical: 6,
    marginHorizontal: 2,
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  testerBtnText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  testerBtnTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
});
