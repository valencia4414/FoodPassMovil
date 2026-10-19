// src/components/shared/CartModal.tsx
//
// Modal interactivo del carrito de compras (T07 - RFM04, RFM05, T09).
// Muestra los productos seleccionados, permite ajustar cantidades,
// vaciar el carrito, y procesa el pago real contra la API (T09).

import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Pressable,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, BorderRadius, Typography, Shadows } from '../../theme/colors';
import { useCart, parsePrice } from '../../context/CartContext';

interface CartModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function CartModal({ visible, onClose }: CartModalProps) {
  const {
    items,
    addItem,
    removeItem,
    deleteItem,
    clearCart,
    getTotalPrice,
    totalItems,
    checkoutOrder,   // <--- Añadido para T09
    isCheckingOut,   // <--- Añadido para T09 (estado de carga)
  } = useCart();

  const [checkoutSuccess, setCheckoutSuccess] = useState(false);

  const totalPrice = getTotalPrice();

  // ── INTEGRACIÓN T09: CHECKOUT REAL CONTRA EL BACKEND Y MYSQL ──
  const handleCheckout = async () => {
    if (items.length === 0 || isCheckingOut) return;

    try {
      // Llamamos a la función del Context que hace el POST /api/pedidos con Transacción SQL
      const response = await checkoutOrder('efectivo');
      
      setCheckoutSuccess(true);
      setTimeout(() => {
        setCheckoutSuccess(false);
        onClose();
        Alert.alert(
          '¡Pedido Confirmado! 🎉',
          `Tu orden #${response?.data?.pedido_id || ''} por un total of $${totalPrice.toFixed(2)} ha sido guardada en la base de datos con éxito. Puedes ver el estado en tu Historial.`
        );
      }, 1000);
    } catch (error: any) {
      Alert.alert(
        'Error en el pago ❌',
        error.message || 'No se pudo procesar tu orden con el servidor.'
      );
    }
  };

  const handleClear = () => {
    Alert.alert(
      'Vaciar Carrito',
      '¿Estás seguro de que deseas eliminar todos los productos del carrito?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Vaciar', style: 'destructive', onPress: () => clearCart() },
      ]
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.modalContainer} onPress={(e) => e.stopPropagation()}>
          {/* BARRA SUPERIOR */}
          <View style={styles.dragIndicator} />

          <View style={styles.header}>
            <View style={styles.titleWrapper}>
              <MaterialIcons name="shopping-bag" size={24} color={Colors.primary} />
              <Text style={styles.title}>Carrito de Compras</Text>
              {totalItems > 0 && (
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{totalItems}</Text>
                </View>
              )}
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialIcons name="close" size={22} color={Colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          {/* CONTENIDO */}
          {items.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <MaterialIcons name="remove-shopping-cart" size={48} color={Colors.onSurfaceVariant} />
              </View>
              <Text style={styles.emptyTitle}>Tu carrito está vacío</Text>
              <Text style={styles.emptySubtitle}>
                Añade tus platos artesanales favoritos desde el Menú para comenzar tu pedido.
              </Text>
              <TouchableOpacity style={styles.emptyButton} onPress={onClose} activeOpacity={0.8}>
                <Text style={styles.emptyButtonText}>Ver Menú</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* ACCIÓN DE VACIAR */}
              <View style={styles.actionsBar}>
                <Text style={styles.itemsLabel}>
                  {items.length} {items.length === 1 ? 'plato seleccionado' : 'platos seleccionados'}
                </Text>
                <TouchableOpacity onPress={handleClear} style={styles.clearBtn}>
                  <MaterialIcons name="delete-sweep" size={16} color={Colors.error} />
                  <Text style={styles.clearBtnText}>Vaciar</Text>
                </TouchableOpacity>
              </View>

              {/* LISTA DE ITEMS */}
              <FlatList
                data={items}
                keyExtractor={(item) => String(item.id)}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => {
                  const unitPrice = parsePrice(item.price);
                  const itemSubtotal = (unitPrice * item.quantity).toFixed(2);
                  return (
                    <View style={styles.itemCard}>
                      {item.image && (
                        <Image source={{ uri: item.image }} style={styles.itemImage} resizeMode="cover" />
                      )}
                      <View style={styles.itemInfo}>
                        <View style={styles.itemTopRow}>
                          <Text style={styles.itemName} numberOfLines={1}>
                            {item.name}
                          </Text>
                          <TouchableOpacity
                            onPress={() => deleteItem(item.id)}
                            style={styles.trashBtn}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <MaterialIcons name="close" size={18} color={Colors.onSurfaceVariant} />
                          </TouchableOpacity>
                        </View>

                        <Text style={styles.itemUnitPrice}>
                          ${unitPrice.toFixed(2)} c/u
                        </Text>

                        <View style={styles.itemBottomRow}>
                          {/* CONTROLES DE CANTIDAD */}
                          <View style={styles.quantityControls}>
                            <TouchableOpacity
                              style={styles.qtyBtn}
                              onPress={() => removeItem(item.id)}
                              activeOpacity={0.7}
                            >
                              <MaterialIcons
                                name={item.quantity === 1 ? 'delete-outline' : 'remove'}
                                size={16}
                                color={item.quantity === 1 ? Colors.error : Colors.onSurface}
                              />
                            </TouchableOpacity>
                            <Text style={styles.qtyText}>{item.quantity}</Text>
                            <TouchableOpacity
                              style={styles.qtyBtn}
                              onPress={() => addItem(item, 1)}
                              activeOpacity={0.7}
                            >
                              <MaterialIcons name="add" size={16} color={Colors.onSurface} />
                            </TouchableOpacity>
                          </View>

                          {/* SUBTOTAL DEL ITEM */}
                          <Text style={styles.itemSubtotal}>${itemSubtotal}</Text>
                        </View>
                      </View>
                    </View>
                  );
                }}
              />

              {/* RESUMEN Y CHECKOUT */}
              <View style={styles.footer}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Subtotal</Text>
                  <Text style={styles.summaryValue}>${totalPrice.toFixed(2)}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Servicio y entrega</Text>
                  <Text style={[styles.summaryValue, { color: Colors.tertiary }]}>Gratis</Text>
                </View>
                <View style={[styles.summaryRow, styles.totalRow]}>
                  <Text style={styles.totalLabel}>Total Dinámico</Text>
                  <Text style={styles.totalValue}>${totalPrice.toFixed(2)}</Text>
                </View>

                {/* BOTÓN CHECKOUT (CONECTADO A T09) */}
                <TouchableOpacity
                  style={[styles.checkoutBtn, (checkoutSuccess || isCheckingOut) && styles.checkoutBtnSuccess]}
                  onPress={handleCheckout}
                  disabled={checkoutSuccess || isCheckingOut}
                  activeOpacity={0.85}
                >
                  <MaterialIcons
                    name={checkoutSuccess ? 'check-circle' : 'shopping-cart-checkout'}
                    size={22}
                    color={Colors.onPrimaryContainer}
                  />
                  <Text style={styles.checkoutBtnText}>
                    {isCheckingOut
                      ? 'Guardando en Base de Datos...'
                      : checkoutSuccess
                      ? '¡Pedido Exitoso!'
                      : `Proceder al Checkout • $${totalPrice.toFixed(2)}`}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(18, 31, 5, 0.45)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderTopLeftRadius: BorderRadius.xxxl,
    borderTopRightRadius: BorderRadius.xxxl,
    paddingHorizontal: 20,
    paddingBottom: 28,
    paddingTop: 12,
    maxHeight: '85%',
    ...Shadows.modal,
  },
  dragIndicator: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.outlineVariant,
    alignSelf: 'center',
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  titleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    ...Typography.titleLg,
    color: Colors.onBackground,
  },
  countBadge: {
    backgroundColor: Colors.primaryContainer,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.onPrimaryContainer,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceContainerLow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  itemsLabel: {
    ...Typography.labelMd,
    color: Colors.onSurfaceVariant,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: BorderRadius.md,
  },
  clearBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.error,
  },
  listContent: {
    paddingBottom: 12,
    gap: 12,
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.xl,
    padding: 10,
    alignItems: 'center',
    gap: 12,
  },
  itemImage: {
    width: 68,
    height: 68,
    borderRadius: BorderRadius.lg,
  },
  itemInfo: {
    flex: 1,
  },
  itemTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.onSurface,
    marginRight: 6,
  },
  trashBtn: {
    padding: 2,
  },
  itemUnitPrice: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
    marginBottom: 6,
  },
  itemBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 6,
    paddingVertical: 3,
    gap: 8,
  },
  qtyBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.surfaceContainerHigh,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.onSurface,
    minWidth: 16,
    textAlign: 'center',
  },
  itemSubtotal: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.primaryContainer,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceContainerHigh,
    paddingTop: 14,
    marginTop: 8,
    gap: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    ...Typography.bodyMd,
    color: Colors.onSurfaceVariant,
  },
  summaryValue: {
    ...Typography.titleSm,
    color: Colors.onSurface,
  },
  totalRow: {
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceContainerHigh,
  },
  totalLabel: {
    ...Typography.titleLg,
    color: Colors.onBackground,
    fontWeight: '800',
  },
  totalValue: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.primary,
  },
  checkoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryContainer,
    paddingVertical: 14,
    borderRadius: BorderRadius.xl,
    marginTop: 10,
    gap: 8,
  },
  checkoutBtnSuccess: {
    backgroundColor: Colors.tertiaryContainer,
  },
  checkoutBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.onPrimaryContainer,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 36,
    paddingHorizontal: 20,
    gap: 12,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.surfaceContainerLow,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  emptyTitle: {
    ...Typography.titleLg,
    color: Colors.onBackground,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...Typography.bodyMd,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyButton: {
    marginTop: 8,
    backgroundColor: Colors.primaryContainer,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: BorderRadius.xl,
  },
  emptyButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.onPrimaryContainer,
  },
});