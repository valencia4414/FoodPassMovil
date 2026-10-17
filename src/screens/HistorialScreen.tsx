// src/screens/HistorialScreen.tsx
//
// Pantalla de historial de pedidos (T10 - RFM07).
// Conectada dinámicamente con el endpoint GET /api/pedidos/me y MySQL.

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import Header from '../components/shared/Header';
import { Colors, BorderRadius } from '../theme/colors';
import PedidoStatusTracker from '../components/PedidoStatusTracker';
import { apiClient } from '../services/apiClient';

const filters = ['Todos', 'Últimos 30 días', 'Este mes', 'Pasados'];

export interface OrderItem {
  id: number;
  producto_id: number;
  nombre: string;
  descripcion?: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  imagen_url?: string | null;
}

export interface Pedido {
  id: number;
  usuario_id: number;
  fecha_pedido: string;
  total: number;
  estado: string;
  items: OrderItem[];
}

const formatTxDate = (date: Date) => {
  if (!date || isNaN(date.getTime())) return '';
  const now = new Date();
  const diffTime = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const timeStr = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase();
  if (diffDays === 0 && date.getDate() === now.getDate()) return `Hoy, ${timeStr}`;
  if (diffDays === 1 || (diffDays === 0 && date.getDate() !== now.getDate())) return `Ayer, ${timeStr}`;
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()} ${timeStr}`;
};

const formatCurrency = (val: number) =>
  val.toLocaleString('es-CO', { maximumFractionDigits: 0 });

export default function HistorialScreen() {
  const [activeFilter, setActiveFilter] = useState('Todos');
  const [searchText, setSearchText] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // Estados para datos dinámicos desde la API (T10 - RFM07)
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Carga de pedidos reales desde el backend
  const fetchPedidos = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setErrorMessage(null);

    try {
      const response = await apiClient.get('/pedidos/me');
      if (response.data && response.data.success) {
        setPedidos(response.data.data || []);
      } else if (Array.isArray(response.data)) {
        setPedidos(response.data);
      } else {
        setPedidos([]);
      }
    } catch (err: any) {
      console.error('[HistorialScreen] Error al obtener pedidos:', err?.message || err);
      const msg = err?.response?.data?.message || 'No se pudo conectar con el servidor para cargar el historial.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Cargar pedidos al montar el componente
  useEffect(() => {
    fetchPedidos();
  }, [fetchPedidos]);

  // Recargar pedidos al volver a enfocar la pantalla
  useFocusEffect(
    useCallback(() => {
      fetchPedidos();
    }, [fetchPedidos])
  );

  // Filtrado Combinado (Tiempo + Búsqueda de texto)
  const filteredPedidos = useMemo(() => {
    return pedidos.filter((item) => {
      const orderDate = new Date(item.fecha_pedido);
      const timeDiff = Date.now() - orderDate.getTime();
      const daysDiff = timeDiff / (1000 * 60 * 60 * 24);

      let matchesTime = true;
      if (activeFilter === 'Últimos 30 días') {
        matchesTime = daysDiff <= 30;
      } else if (activeFilter === 'Este mes') {
        const now = new Date();
        matchesTime =
          orderDate.getMonth() === now.getMonth() &&
          orderDate.getFullYear() === now.getFullYear();
      } else if (activeFilter === 'Pasados') {
        matchesTime = daysDiff > 30;
      }

      const q = searchText.toLowerCase();
      const matchesId = `pedido #${item.id}`.toLowerCase().includes(q) || `#${item.id}`.includes(q);
      const matchesEstado = item.estado ? item.estado.toLowerCase().includes(q) : false;
      const matchesProduct = item.items && item.items.some((prod) =>
        prod.nombre.toLowerCase().includes(q) || (prod.descripcion && prod.descripcion.toLowerCase().includes(q))
      );

      const matchesSearch = matchesId || matchesEstado || matchesProduct || q.trim() === '';

      return matchesTime && matchesSearch;
    });
  }, [pedidos, activeFilter, searchText]);

  // Estadísticas calculadas dinámicamente
  const stats = useMemo(() => {
    const totalPedidos = pedidos.length;
    const totalGastado = pedidos.reduce((acc, p) => acc + (Number(p.total) || 0), 0);
    const totalAhorro = Math.round(totalGastado * 0.1);
    const ordersLeft = Math.max(1, 5 - (totalPedidos % 5));
    return { totalPedidos, totalAhorro, ordersLeft };
  }, [pedidos]);

  // Renderizado individual de una orden
  const renderPedidoItem = (item: Pedido) => {
    const orderDate = new Date(item.fecha_pedido);
    const hasItems = item.items && item.items.length > 0;

    const mainTitle = hasItems
      ? item.items.length === 1
        ? item.items[0].nombre
        : `${item.items[0].nombre} +${item.items.length - 1}`
      : `Pedido #${item.id}`;

    const subtitle = hasItems
      ? item.items.map((i) => `${i.cantidad}x ${i.nombre}`).join(', ')
      : 'FoodPass — Sede Principal';

    const estadoLower = (item.estado || '').toLowerCase();
    const isOk = estadoLower === 'entregado' || estadoLower === 'listo';
    const isCanceled = estadoLower === 'cancelado';

    let badgeStyle = styles.statusBadgePending;
    let textStyle = styles.statusTextPending;
    let badgeLabel = item.estado ? item.estado.toUpperCase() : 'PENDIENTE';

    if (isOk) {
      badgeStyle = styles.statusBadgeOk;
      textStyle = styles.statusTextOk;
    } else if (isCanceled) {
      badgeStyle = styles.statusBadgeCanceled;
      textStyle = styles.statusTextCanceled;
    }

    return (
      <TouchableOpacity
        key={item.id}
        style={styles.transactionCard}
        activeOpacity={0.8}
        onPress={() => setSelectedOrderId(String(item.id))}
      >
        <View style={styles.transactionIconWrap}>
          <MaterialIcons name="restaurant" size={22} color={Colors.primary} />
        </View>
        <View style={styles.transactionInfo}>
          <Text style={styles.transactionName} numberOfLines={1}>{mainTitle}</Text>
          <Text style={styles.transactionRestaurant} numberOfLines={1}>{subtitle}</Text>
          <Text style={styles.transactionDate}>{formatTxDate(orderDate)}</Text>
        </View>
        <View style={styles.transactionRight}>
          <Text style={styles.transactionAmount}>{`$${formatCurrency(Number(item.total))}`}</Text>
          <View style={[styles.statusBadge, badgeStyle]}>
            <Text style={[styles.statusBadgeText, textStyle]}>
              {badgeLabel}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.headerWrapper}>
        <Header title="Historial" showSearch />
        {!isSearching && (
          <TouchableOpacity style={styles.searchActivator} onPress={() => setIsSearching(true)} />
        )}
        {isSearching && (
          <View style={styles.fullSearchBar}>
            <TouchableOpacity onPress={() => { setIsSearching(false); setSearchText(''); }}>
              <MaterialIcons name="arrow-back" size={24} color={Colors.primary} />
            </TouchableOpacity>
            <TextInput
              style={styles.inputField}
              placeholder="Buscar por plato, pedido o estado..."
              placeholderTextColor="#888"
              autoFocus
              value={searchText}
              onChangeText={setSearchText}
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => setSearchText('')}>
                <MaterialIcons name="close" size={22} color="#888" />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => fetchPedidos(true)}
            colors={[Colors.primaryContainer]}
            tintColor={Colors.primaryContainer}
          />
        }
      >
        <View style={styles.statsContainer}>
          <View style={styles.heroStatCard}>
            <Text style={styles.heroStatTitle}>Trayectoria Gastronómica</Text>
            <View style={styles.heroStats}>
              <View style={styles.heroStatCol}>
                <Text style={styles.heroStatLabel}>TOTAL PEDIDOS</Text>
                <Text style={[styles.heroStatNumber, { color: Colors.primary }]}>
                  {stats.totalPedidos}
                </Text>
              </View>
              <View style={styles.heroStatDivider} />
              <View style={styles.heroStatCol}>
                <Text style={styles.heroStatLabel}>AHORRO TOTAL</Text>
                <Text style={[styles.heroStatNumber, { color: Colors.tertiary }]}>
                  ${formatCurrency(stats.totalAhorro)}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.eliteCard}>
            <View style={styles.eliteIcon}>
              <MaterialIcons name="workspace-premium" size={28} color={Colors.onPrimaryContainer} />
            </View>
            <Text style={styles.eliteTitle}>Elite</Text>
            <Text style={styles.eliteSubtitle}>{stats.ordersLeft} para premio</Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContainer}
          style={styles.filtersScroll}
        >
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[styles.filterChip, activeFilter === filter && styles.filterChipActive]}
              onPress={() => setActiveFilter(filter)}
            >
              <Text style={[styles.filterChipText, activeFilter === filter && styles.filterChipTextActive]}>
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.listSection}>
          <View style={styles.listHeaderRow}>
            <Text style={styles.listTitle}>Historial Detallado</Text>
            <TouchableOpacity onPress={() => fetchPedidos(true)} style={styles.refreshButton}>
              <MaterialIcons name="refresh" size={18} color={Colors.primary} />
            </TouchableOpacity>
          </View>

          {isLoading && !isRefreshing && (
            <View style={styles.stateContainer}>
              <ActivityIndicator size="large" color={Colors.primaryContainer} />
              <Text style={styles.stateText}>Cargando pedidos desde el servidor...</Text>
            </View>
          )}

          {!isLoading && errorMessage && (
            <View style={styles.stateContainer}>
              <MaterialIcons name="error-outline" size={44} color={Colors.error} />
              <Text style={styles.errorTitle}>Error de conexión</Text>
              <Text style={styles.stateText}>{errorMessage}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={() => fetchPedidos()}>
                <MaterialIcons name="replay" size={18} color="#fff" />
                <Text style={styles.retryButtonText}>Reintentar</Text>
              </TouchableOpacity>
            </View>
          )}

          {!isLoading && !errorMessage && filteredPedidos.length === 0 && (
            <View style={styles.stateContainer}>
              <MaterialIcons name="receipt-long" size={44} color={Colors.outline} />
              <Text style={styles.emptyTitle}>
                {pedidos.length === 0 ? 'Sin pedidos registrados' : 'No se encontraron resultados'}
              </Text>
              <Text style={styles.stateText}>
                {pedidos.length === 0
                  ? 'Tus compras y órdenes confirmadas aparecerán aquí.'
                  : 'Prueba con otro filtro o término de búsqueda.'}
              </Text>
            </View>
          )}

          {!isLoading && !errorMessage && filteredPedidos.length > 0 && (
            filteredPedidos.map((pedido) => renderPedidoItem(pedido))
          )}
        </View>

        <View style={{ height: 28 }} />
      </ScrollView>

      {selectedOrderId && (
        <Modal
          visible={Boolean(selectedOrderId)}
          animationType="slide"
          transparent
          onRequestClose={() => setSelectedOrderId(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeaderRow}>
                <View style={styles.modalHeaderTitleWrap}>
                  <MaterialIcons name="track-changes" size={22} color={Colors.primary} />
                  <Text style={styles.modalHeaderTitle}>Seguimiento en Vivo</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setSelectedOrderId(null)}
                  style={styles.modalCloseBtn}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <MaterialIcons name="close" size={24} color={Colors.onSurfaceVariant} />
                </TouchableOpacity>
              </View>
              <PedidoStatusTracker initialOrderId={selectedOrderId} compact={true} />
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  headerWrapper: { position: 'relative', zIndex: 100 },
  searchActivator: { position: 'absolute', right: 85, top: 10, width: 45, height: 45, borderRadius: 22, zIndex: 101 },
  fullSearchBar: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#FFF', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, height: 70, zIndex: 102, elevation: 4 },
  inputField: { flex: 1, marginLeft: 15, fontSize: 15, color: '#000', fontWeight: '500' },
  scroll: { flex: 1 },
  statsContainer: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingTop: 20, marginBottom: 16 },
  heroStatCard: { flex: 2, backgroundColor: '#FFF', borderRadius: BorderRadius.xxl, padding: 16, elevation: 3 },
  heroStatTitle: { fontSize: 14, fontWeight: '700', marginBottom: 10 },
  heroStats: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroStatCol: { flex: 1 },
  heroStatLabel: { fontSize: 8, fontWeight: '700', color: '#888' },
  heroStatNumber: { fontSize: 24, fontWeight: '800' },
  heroStatDivider: { width: 1, height: 30, backgroundColor: '#EEE', marginHorizontal: 10 },
  eliteCard: { flex: 0.8, backgroundColor: Colors.inverseSurface, borderRadius: BorderRadius.xxl, padding: 10, alignItems: 'center', justifyContent: 'center' },
  eliteIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primaryContainer, justifyContent: 'center', alignItems: 'center', marginBottom: 5 },
  eliteTitle: { fontSize: 12, fontWeight: '700', color: '#fff' },
  eliteSubtitle: { fontSize: 9, color: 'rgba(255,255,255,0.6)', textAlign: 'center' },
  filtersScroll: { maxHeight: 48, marginBottom: 8 },
  filtersContainer: { paddingHorizontal: 20, gap: 8, alignItems: 'center' },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: BorderRadius.xl, backgroundColor: '#F5F5F5' },
  filterChipActive: { backgroundColor: '#FFF', elevation: 3 },
  filterChipText: { fontSize: 12, fontWeight: '600', color: '#888' },
  filterChipTextActive: { color: Colors.primary, fontWeight: '700' },
  listSection: { paddingHorizontal: 20, paddingTop: 8 },
  listHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  listTitle: { fontSize: 16, fontWeight: '700' },
  refreshButton: { padding: 4 },
  transactionCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  transactionIconWrap: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  transactionInfo: { flex: 1, paddingRight: 8 },
  transactionName: { fontSize: 14, fontWeight: '600', color: Colors.onBackground },
  transactionRestaurant: { fontSize: 11, color: '#888', marginTop: 2 },
  transactionDate: { fontSize: 11, color: '#888', marginTop: 2 },
  transactionRight: { alignItems: 'flex-end', gap: 4 },
  transactionAmount: { fontSize: 14, fontWeight: '700', color: Colors.onBackground },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  statusBadgeOk: { backgroundColor: Colors.tertiaryContainer },
  statusBadgePending: { backgroundColor: Colors.primaryContainer },
  statusBadgeCanceled: { backgroundColor: Colors.errorContainer },
  statusBadgeText: { fontSize: 9, fontWeight: '700' },
  statusTextOk: { color: Colors.onTertiaryContainer },
  statusTextPending: { color: Colors.onPrimaryContainer },
  statusTextCanceled: { color: Colors.error },
  stateContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 36, gap: 8 },
  stateText: { fontSize: 13, color: '#888', textAlign: 'center', maxWidth: 280 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: Colors.onBackground, marginTop: 4 },
  errorTitle: { fontSize: 15, fontWeight: '700', color: Colors.error, marginTop: 4 },
  retryButton: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: BorderRadius.lg, marginTop: 8 },
  retryButtonText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(18, 31, 5, 0.65)', justifyContent: 'center', padding: 16 },
  modalContent: { backgroundColor: Colors.surfaceContainerLowest, borderRadius: BorderRadius.xxl, padding: 16, maxHeight: '85%' },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: Colors.surfaceContainerHigh, marginBottom: 8 },
  modalHeaderTitleWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  modalHeaderTitle: { fontSize: 16, fontWeight: '800', color: Colors.onBackground },
  modalCloseBtn: { padding: 4 },
});