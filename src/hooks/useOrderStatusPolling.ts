// src/hooks/useOrderStatusPolling.ts
//
// Hook personalizado para consulta intermitente (Polling) del estado del pedido activo.
// T13 - RFM14: Seguimiento de Pedido.
// Permite consultar GET /api/pedidos/:id/status cada N segundos y actualizar
// reactivamente el componente cada vez que la base de datos MySQL cambie.

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  getOrderStatus,
  OrderStatusResponse,
  OrderStatusType,
  setSimulatedOrderStatus,
} from '../services/orderService';

interface UseOrderStatusPollingOptions {
  orderId: number | string | null;
  intervalMs?: number; // Por defecto 4000ms (4 segundos)
  enabled?: boolean;   // Si el polling está activo
  stopOnTerminalState?: boolean; // Detener el polling si pasa a 'entregado' o 'cancelado'
}

export function useOrderStatusPolling({
  orderId,
  intervalMs = 4000,
  enabled = true,
  stopOnTerminalState = false,
}: UseOrderStatusPollingOptions) {
  const [order, setOrder] = useState<OrderStatusResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastPolledAt, setLastPolledAt] = useState<Date | null>(null);
  const [pollCount, setPollCount] = useState<number>(0);

  const isMountedRef = useRef<boolean>(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchStatus = useCallback(async (isManual: boolean = false) => {
    if (!orderId) return;

    if (isManual) {
      setLoading(true);
    }

    try {
      const data = await getOrderStatus(orderId);
      if (isMountedRef.current) {
        setOrder(data);
        setError(null);
        setLastPolledAt(new Date());
        setPollCount((prev) => prev + 1);
      }
    } catch (err: any) {
      if (isMountedRef.current) {
        setError(err?.message || 'Error al consultar estado del pedido');
      }
    } finally {
      if (isMountedRef.current && isManual) {
        setLoading(false);
      }
    }
  }, [orderId]);

  // Efecto principal para el Polling intermitente
  useEffect(() => {
    isMountedRef.current = true;

    if (!orderId || !enabled) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    // Primera consulta inmediata
    fetchStatus(false);

    // Configurar intervalo de consulta
    timerRef.current = setInterval(() => {
      // Si se configuró detener en estado terminal y ya se completó o canceló
      if (stopOnTerminalState && order && (order.estado === 'entregado' || order.estado === 'cancelado')) {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        return;
      }

      fetchStatus(false);
    }, intervalMs);

    // Limpieza al desmontar o al cambiar de pedido / intervalo
    return () => {
      isMountedRef.current = false;
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [orderId, intervalMs, enabled, stopOnTerminalState, fetchStatus]);

  // Helper para simular cambios de estado en pruebas manuales
  const simulateStatusChange = useCallback(
    (nuevoEstado: OrderStatusType) => {
      if (!orderId) return;
      const updated = setSimulatedOrderStatus(orderId, nuevoEstado);
      setOrder(updated);
      setLastPolledAt(new Date());
    },
    [orderId]
  );

  return {
    order,
    status: order?.estado || 'pendiente',
    statusLabel: order?.estado_label || 'Pendiente',
    loading,
    error,
    lastPolledAt,
    pollCount,
    isPolling: enabled && Boolean(orderId),
    refetch: () => fetchStatus(true),
    simulateStatusChange,
  };
}
