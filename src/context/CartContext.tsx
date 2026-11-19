// src/context/CartContext.tsx
//
// Estado global del carrito de compras para FoodPass Móvil (T07, T09).
// Mantiene los productos y se comunica con el backend para procesar el pedido.

import React, { createContext, useContext, useState, useMemo } from 'react';
import { createOrder } from '../services/orderService'; // <--- Importamos el servicio de pedidos (T09)

export interface CartProduct {
  id: string | number;
  name: string;
  description?: string;
  price: string | number;
  image?: string;
  category?: string;
  badge?: string | null;
  badgeType?: string;
}

export interface CartItem extends CartProduct {
  quantity: number;
}

export interface CartContextType {
  items: CartItem[];
  addItem: (product: CartProduct, quantity?: number) => void;
  removeItem: (id: string | number, forceRemove?: boolean) => void;
  deleteItem: (id: string | number) => void;
  updateQuantity: (id: string | number, quantity: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getTotalCount: () => number;
  checkoutOrder: (metodoPago?: string) => Promise<any>; // <--- Nueva función T09
  totalItems: number;
  totalPrice: number;
  formattedTotalPrice: string;
  isCheckingOut: boolean; // <--- Estado de carga para el pago
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const parsePrice = (price: string | number): number => {
  if (typeof price === 'number') return price;
  if (typeof price === 'string') {
    const cleaned = price.replace(/[^0-9.-]+/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCheckingOut, setIsCheckingOut] = useState(false); // Estado para prevenir doble clic y mostrar spinner

  const addItem = (product: CartProduct, quantity: number = 1) => {
    if (!product || product.id === undefined) return;
    setItems((prevItems) => {
      const existingIndex = prevItems.findIndex((item) => String(item.id) === String(product.id));
      if (existingIndex > -1) {
        const next = [...prevItems];
        next[existingIndex] = {
          ...next[existingIndex],
          quantity: next[existingIndex].quantity + quantity,
        };
        return next;
      }
      return [...prevItems, { ...product, quantity }];
    });
  };

  const removeItem = (id: string | number, forceRemove: boolean = false) => {
    const idStr = String(id);
    setItems((prevItems) => {
      const existing = prevItems.find((item) => String(item.id) === idStr);
      if (!existing) return prevItems;
      if (forceRemove || existing.quantity <= 1) {
        return prevItems.filter((item) => String(item.id) !== idStr);
      }
      return prevItems.map((item) =>
        String(item.id) === idStr ? { ...item, quantity: item.quantity - 1 } : item
      );
    });
  };

  const deleteItem = (id: string | number) => {
    removeItem(id, true);
  };

  const updateQuantity = (id: string | number, quantity: number) => {
    if (quantity <= 0) {
      deleteItem(id);
      return;
    }
    const idStr = String(id);
    setItems((prevItems) =>
      prevItems.map((item) => (String(item.id) === idStr ? { ...item, quantity } : item))
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const getTotalPrice = (): number => {
    const sum = items.reduce((total, item) => {
      return total + parsePrice(item.price) * item.quantity;
    }, 0);
    return Math.round(sum * 100) / 100;
  };

  const getTotalCount = (): number => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  // ── FUNCIÓN DE CHECKOUT (TAREA T09) ──
  // Envía los datos del carrito al backend protegido por JWT
  const checkoutOrder = async (metodoPago: string = 'efectivo') => {
    if (items.length === 0) {
      throw new Error('El carrito está vacío, no se puede procesar el pedido.');
    }

    setIsCheckingOut(true);
    try {
      const payload = {
        restaurante_id: 1, // Sede principal por defecto
        metodo_pago: metodoPago,
        total: getTotalPrice(),
        items: items.map((i) => ({
          platillo_id: Number(i.id),
          cantidad: i.quantity,
          precio: parsePrice(i.price),
        })),
      };

      const response = await createOrder(payload);
      
      // Si el pedido se guarda con éxito en MySQL, vaciamos el carrito local
      clearCart();
      return response;
    } catch (error: any) {
      console.error('[CartContext] Error en checkoutOrder:', error.message);
      throw error;
    } finally {
      setIsCheckingOut(false);
    }
  };

  const totalItems = useMemo(() => getTotalCount(), [items]);
  const totalPrice = useMemo(() => getTotalPrice(), [items]);
  const formattedTotalPrice = useMemo(() => `$${totalPrice.toFixed(2)}`, [totalPrice]);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        deleteItem,
        updateQuantity,
        clearCart,
        getTotalPrice,
        getTotalCount,
        checkoutOrder, // <--- Exportamos la función al contexto
        totalItems,
        totalPrice,
        formattedTotalPrice,
        isCheckingOut, // <--- Exportamos el estado de carga
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart debe ser usado dentro de un CartProvider');
  }
  return context;
};