// src/screens/PagosScreen.tsx
//
// Pantalla de métodos de pago.

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import Header from '../components/shared/Header';
import { Colors, BorderRadius } from '../theme/colors';

const paymentMethods = [
  { id: '1', type: 'visa', last4: '4242', expiry: '12/26', isDefault: true, label: 'Visa' },
  { id: '2', type: 'mastercard', last4: '8821', expiry: '08/25', isDefault: false, label: 'Mastercard' },
  { id: '3', type: 'nequi', last4: '3110', expiry: null, isDefault: false, label: 'Nequi' },
];

const cardIconMap: Record<string, keyof typeof MaterialIcons.glyphMap> = {
  visa: 'credit-card',
  mastercard: 'credit-card',
  nequi: 'phone-android',
};

// Opciones para agregar nuevo método
const newPaymentOptions = [
  { id: 'add-card', label: 'Tarjeta de crédito o débito', icon: 'credit-card' },
  { id: 'add-nequi', label: 'Nequi', icon: 'phone-android' },
  { id: 'add-daviplata', label: 'Daviplata', icon: 'account-balance-wallet' },
  { id: 'add-efecty', label: 'Efecty', icon: 'attach-money' },
];

export default function PagosScreen() {
  const [selectedMethod, setSelectedMethod] = useState('1');
  const [modalVisible, setModalVisible] = useState(false);

  // Función para simular agregar un método
  const handleAddPaymentMethod = (optionId: string) => {
    setModalVisible(false);
    Alert.alert(
      'Agregar método',
      `Has seleccionado: ${newPaymentOptions.find(o => o.id === optionId)?.label}`
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Header title="Métodos de Pago" showSearch />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* === RESUMEN DEL PLAN === */}
        <View style={styles.planSummary}>
          <View style={styles.planSummaryLeft}>
            <View style={styles.planBadge}>
              {/* <Text style={styles.planBadgeText}>PLAN PREMIUM</Text> */}
            </View>
            <Text style={styles.planName}>FoodPass Premium</Text>
            <Text style={styles.planSubtitle}>22 almuerzos / mes</Text>
          </View>
          <View style={styles.planPrice}>
            <Text style={styles.planPriceAmount}>$189</Text>
            <Text style={styles.planPricePer}>/mes</Text>
          </View>
        </View>

        {/* Próximo cobro */}
        <View style={styles.nextBilling}>
          <MaterialIcons name="event" size={16} color={Colors.tertiary} />
          <Text style={styles.nextBillingText}>Próximo cobro: 1 de junio, 2024</Text>
        </View>

        {/* === MÉTODOS DE PAGO === */}
        <Text style={styles.sectionTitle}>Tus tarjetas</Text>

        {paymentMethods.map((method) => (
          <TouchableOpacity
            key={method.id}
            style={[
              styles.paymentCard,
              selectedMethod === method.id && styles.paymentCardSelected,
            ]}
            onPress={() => setSelectedMethod(method.id)}
            activeOpacity={0.8}
          >
            {/* Ícono */}
            <View style={[
              styles.cardIcon,
              method.type === 'nequi' && styles.cardIconNequi
            ]}>
              <MaterialIcons
                name={cardIconMap[method.type]}
                size={22}
                color={method.type === 'nequi' ? '#7B2FBE' : Colors.primary}
              />
            </View>

            {/* Info */}
            <View style={styles.cardInfo}>
              <Text style={styles.cardLabel}>{method.label}</Text>
              <Text style={styles.cardNumber}>•••• •••• •••• {method.last4}</Text>
              {method.expiry && (
                <Text style={styles.cardExpiry}>Vence {method.expiry}</Text>
              )}
            </View>

            {/* Estado */}
            <View style={styles.cardStatus}>
              {method.isDefault && (
                <View style={styles.defaultBadge}>
                  <Text style={styles.defaultBadgeText}>PRINCIPAL</Text>
                </View>
              )}
              {/* Radio button visual */}
              <View style={[
                styles.radio,
                selectedMethod === method.id && styles.radioSelected
              ]}>
                {selectedMethod === method.id && <View style={styles.radioDot} />}
              </View>
            </View>
          </TouchableOpacity>
        ))}

        {/* Botón agregar tarjeta - AHORA ABRE MODAL */}
        <TouchableOpacity
          style={styles.addCardButton}
          activeOpacity={0.8}
          onPress={() => setModalVisible(true)}
        >
          <View style={styles.addCardIcon}>
            <MaterialIcons name="add" size={22} color={Colors.primary} />
          </View>
          <Text style={styles.addCardText}>Agregar nuevo método de pago</Text>
          <MaterialIcons name="arrow-forward-ios" size={14} color={Colors.onSurfaceVariant} />
        </TouchableOpacity>

        {/* === HISTORIAL DE PAGOS === */}
        <Text style={styles.sectionTitle}>Historial de pagos</Text>

        {[
          { date: '1 mayo, 2024', amount: '$189.00', status: 'Pagado' },
          { date: '1 abril, 2024', amount: '$189.00', status: 'Pagado' },
          { date: '1 marzo, 2024', amount: '$189.00', status: 'Pagado' },
        ].map((payment, i) => (
          <View key={i} style={styles.paymentHistory}>
            <View>
              <Text style={styles.paymentHistoryDate}>{payment.date}</Text>
              <Text style={styles.paymentHistoryDesc}>Suscripción mensual</Text>
            </View>
            <View style={styles.paymentHistoryRight}>
              <Text style={styles.paymentHistoryAmount}>{payment.amount}</Text>
              <View style={styles.paidBadge}>
                <Text style={styles.paidBadgeText}>{payment.status.toUpperCase()}</Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* ===== MODAL PARA AGREGAR MÉTODO DE PAGO ===== */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Agregar método de pago</Text>

            {newPaymentOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={styles.modalOption}
                onPress={() => handleAddPaymentMethod(option.id)}
                activeOpacity={0.7}
              >
                <View style={styles.modalOptionIcon}>
                  <MaterialIcons name={option.icon as any} size={24} color={Colors.primary} />
                </View>
                <Text style={styles.modalOptionText}>{option.label}</Text>
                <MaterialIcons name="chevron-right" size={20} color={Colors.onSurfaceVariant} />
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalCloseButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  // RESUMEN DEL PLAN
  planSummary: {
    backgroundColor: Colors.inverseSurface,
    borderRadius: BorderRadius.xxl,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  planSummaryLeft: { flex: 1 },
  planBadge: {
    backgroundColor: Colors.primaryContainer,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  planBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.onPrimaryContainer,
    letterSpacing: 1,
  },
  planName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
  },
  planSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  planPrice: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  planPriceAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.primaryContainer,
    letterSpacing: -1,
  },
  planPricePer: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
  },
  nextBilling: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.tertiaryContainer + '20',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: BorderRadius.lg,
    marginBottom: 24,
  },
  nextBillingText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.tertiary,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.onBackground,
    marginBottom: 12,
  },
  // TARJETAS DE PAGO
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xxl,
    padding: 16,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  paymentCardSelected: {
    borderColor: Colors.primaryContainer,
    backgroundColor: Colors.surfaceContainerLowest,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.surfaceContainerLow,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  cardIconNequi: {
    backgroundColor: '#F3E6FF',
  },
  cardInfo: { flex: 1 },
  cardLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.onSurface,
    marginBottom: 2,
  },
  cardNumber: {
    fontSize: 13,
    color: Colors.onSurfaceVariant,
    letterSpacing: 1,
    marginBottom: 2,
  },
  cardExpiry: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  cardStatus: {
    alignItems: 'flex-end',
    gap: 8,
  },
  defaultBadge: {
    backgroundColor: Colors.tertiaryContainer,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  defaultBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: Colors.onTertiaryContainer,
    letterSpacing: 1,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.outlineVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    borderColor: Colors.primaryContainer,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primaryContainer,
  },
  // AGREGAR TARJETA
  addCardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.xxl,
    padding: 16,
    marginBottom: 24,
  },
  addCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.outlineVariant,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addCardText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  // HISTORIAL DE PAGOS
  paymentHistory: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  paymentHistoryDate: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.onSurface,
    marginBottom: 2,
  },
  paymentHistoryDesc: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
  },
  paymentHistoryRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  paymentHistoryAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  paidBadge: {
    backgroundColor: Colors.tertiaryContainer,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  paidBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.onTertiaryContainer,
    letterSpacing: 1,
  },
  // ===== ESTILOS DEL MODAL =====
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.onSurface,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceContainerLow,
  },
  modalOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.surfaceContainerLow,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  modalOptionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: Colors.onSurface,
  },
  modalCloseButton: {
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surfaceContainerLow,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.onSurfaceVariant,
  },
});