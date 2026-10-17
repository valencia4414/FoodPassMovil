// src/services/orderService.ts
//
// Servicio de consulta de pedidos (T13 - RFM14).
// Provee la función para consultar intermitentemente (Polling) el estado del pedido
// activo a través del endpoint GET /api/pedidos/:id/status.

import { apiClient } from './apiClient';

export type OrderStatusType = 'pendiente' | 'en_preparacion' | 'listo' | 'entregado' | 'cancelado';

export interface OrderStatusResponse {
  success?: boolean;
  id: number | string;
  estado: OrderStatusType;
  estado_label?: string;
  total?: number;
  metodo_pago?: string;
  restaurante?: string;
  updated_at?: string;
  created_at?: string;
  isSimulated?: boolean;
}

// Mapeo amigable de etiquetas legibles por el usuario según T13:
// "Mostrar 'En preparación', 'Listo', etc."
export const ORDER_STATUS_LABELS: Record<OrderStatusType, string> = {
  pendiente: 'Recibido / Pendiente',
  en_preparacion: 'En preparación',
  listo: 'Listo para entrega',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
};

// Almacén en memoria de pedidos para pruebas locales o fallback en caso de red sin backend
const localSimulatedOrders: Record<string, OrderStatusResponse> = {
  '14': {
    id: 14,
    estado: 'en_preparacion',
    estado_label: 'En preparación',
    total: 32.75,
    metodo_pago: 'nequi',
    restaurante: 'FoodPass — Sede Centro',
    created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    updated_at: new Date().toISOString(),
    isSimulated: true,
  },
  '1': {
    id: 1,
    estado: 'pendiente',
    estado_label: 'Recibido / Pendiente',
    total: 18.25,
    metodo_pago: 'tarjeta',
    restaurante: 'FoodPass — Sede Centro',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    isSimulated: true,
  },
};

/**
 * Consulta el estado de un pedido (RFM14 / T13).
 * Intenta consultar el endpoint real GET /api/pedidos/:id/status.
 * Si el backend está disponible (Laravel + MySQL), refleja el cambio en la BD al instante.
 * Si no hay conexión al backend, responde con el estado local simulado.
 */
export async function getOrderStatus(orderId: number | string): Promise<OrderStatusResponse> {
  const idStr = String(orderId);

  try {
    // Intentar consultar el endpoint en el backend
    // Probamos tanto /api/pedidos/:id/status como /pedidos/:id/status
    const response = await apiClient.get<OrderStatusResponse>(`/api/pedidos/${idStr}/status`, {
      timeout: 3500,
    });

    if (response?.data && response.data.estado) {
      const data = response.data;
      return {
        ...data,
        estado_label: data.estado_label || ORDER_STATUS_LABELS[data.estado] || data.estado,
        isSimulated: false,
      };
    }
  } catch (err: any) {
    // Si el endpoint con prefijo /api falla por configuración de proxy o baseUrl, probar sin /api
    try {
      const fallbackResponse = await apiClient.get<OrderStatusResponse>(`/pedidos/${idStr}/status`, {
        timeout: 3500,
      });
      if (fallbackResponse?.data && fallbackResponse.data.estado) {
        const data = fallbackResponse.data;
        return {
          ...data,
          estado_label: data.estado_label || ORDER_STATUS_LABELS[data.estado] || data.estado,
          isSimulated: false,
        };
      }
    } catch {
      // Backend no disponible en esta URL, usar fallback simulado para no romper la app
    }
  }

  // Fallback simulado: permite probar el polling y los cambios de estado incluso sin MySQL corriendo
  if (!localSimulatedOrders[idStr]) {
    localSimulatedOrders[idStr] = {
      id: orderId,
      estado: 'en_preparacion',
      estado_label: ORDER_STATUS_LABELS.en_preparacion,
      total: 25.0,
      metodo_pago: 'tarjeta',
      restaurante: 'FoodPass — Sede Centro',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      isSimulated: true,
    };
  }

  return localSimulatedOrders[idStr];
}

/**
 * Actualiza el estado simulado en memoria para facilitar pruebas locales
 * y verificar que el polling reacciona en tiempo real a los cambios de estado.
 */
export function setSimulatedOrderStatus(orderId: number | string, nuevoEstado: OrderStatusType): OrderStatusResponse {
  const idStr = String(orderId);
  const existing = localSimulatedOrders[idStr] || {
    id: orderId,
    total: 25.0,
    restaurante: 'FoodPass — Sede Centro',
    created_at: new Date().toISOString(),
  };

  const updated: OrderStatusResponse = {
    ...existing,
    estado: nuevoEstado,
    estado_label: ORDER_STATUS_LABELS[nuevoEstado],
    updated_at: new Date().toISOString(),
    isSimulated: true,
  };

  localSimulatedOrders[idStr] = updated;
  return updated;
}
