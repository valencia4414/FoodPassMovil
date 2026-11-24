// src/screens/HistorialScreen.tsx
//
// Historial de canjes del beneficiario.
// Conectada con GET /api/canjes/me (tabla canjes).

import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import Header from '../components/shared/Header';
import { Colors, BorderRadius } from '../theme/colors';
import { apiClient } from '../services/apiClient';

const filters = ['Todos', 'Últimos 30 días', 'Este mes', 'Pasados'];

export interface Canje {
  id: number;
  tipo_canje: string;
  fecha_canje: string;
  estado: string;
  sede: string;
}

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

const formatTxDate = (date: Date) => {
  if (!date || isNaN(date.getTime())) return '';
  const diffDays = Math.round((startOfDay(new Date()) - startOfDay(date)) / (1000 * 60 * 60 * 24));
  const timeStr = date
    .toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: true })
    .toUpperCase();
  if (diffDays === 0) return `Hoy, ${timeStr}`;
  if (diffDays === 1) return `Ayer, ${timeStr}`;
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()} ${timeStr}`;
};

export default function HistorialScreen() {
  const [activeFilter, setActiveFilter] = useState('Todos');
  const [searchText, setSearchText] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Datos dinámicos desde la API
  const [canjes, setCanjes] = useState<Canje[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Carga de canjes reales desde el backend
  const fetchCanjes = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setErrorMessage(null);

    try {
      const response = await apiClient.get('/canjes/me');
      setCanjes(Array.isArray(response.data?.data) ? response.data.data : []);
    } catch (err: any) {
      console.error('[HistorialScreen] Error al obtener canjes:', err?.message || err);
      const msg =
        err?.response?.data?.message ||
        'No se pudo conectar con el servidor para cargar el historial.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Carga al abrir la pestaña y cada vez que vuelve a enfocarse
  useFocusEffect(
    useCallback(() => {
      fetchCanjes();
    }, [fetchCanjes])
  );

  // Filtrado combinado (tiempo + búsqueda de texto)
  const filteredCanjes = useMemo(() => {
    return canjes.filter((item) => {
      const fecha = new Date(item.fecha_canje);
      const daysDiff = (Date.now() - fecha.getTime()) / (1000 * 60 * 60 * 24);

      let matchesTime = true;
      if (activeFilter === 'Últimos 30 días') {
        matchesTime = daysDiff <= 30;
      } else if (activeFilter === 'Este mes') {
        const now = new Date();
        matchesTime =
          fecha.getMonth() === now.getMonth() && fecha.getFullYear() === now.getFullYear();
      } else if (activeFilter === 'Pasados') {
        matchesTime = daysDiff > 30;
      }

      const q = searchText.toLowerCase().trim();
      const matchesSearch =
        q === '' ||
        (item.tipo_canje || '').toLowerCase().includes(q) ||
        (item.estado || '').toLowerCase().includes(q) ||
        (item.sede || '').toLowerCase().includes(q);

      return matchesTime && matchesSearch;
    });
  }, [canjes, activeFilter, searchText]);

  // Estadísticas
  const stats = useMemo(() => {
    const now = new Date();
    const esteMes = canjes.filter((c) => {
      const f = new Date(c.fecha_canje);
      return f.getMonth() === now.getMonth() && f.getFullYear() === now.getFullYear();
    }).length;
    return { total: canjes.length, esteMes };
  }, [canjes]);

  // Renderizado individual de un canje
  const renderCanje = (item: Canje) => (
    <View key={item.id} style={styles.transactionCard}>
      <View style={styles.transactionIconWrap}>
        <MaterialIcons name="restaurant" size={22} color={Colors.primary} />
      </View>
      <View style={styles.transactionInfo}>
        <Text style={styles.transactionName} numberOfLines={1}>
          {item.tipo_canje}
        </Text>
        <Text style={styles.transactionRestaurant} numberOfLines={1}>
          {item.sede || 'Sede Principal'}
        </Text>
        <Text style={styles.transactionDate}>{formatTxDate(new Date(item.fecha_canje))}</Text>
      </View>
      <View style={styles.transactionRight}>
        <View style={[styles.statusBadge, styles.statusBadgeOk]}>
          <Text style={[styles.statusBadgeText, styles.statusTextOk]}>
            {(item.estado || 'Canjeado').toUpperCase()}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.headerWrapper}>
        <Header title="Historial" showSearch />
        {!isSearching && (
          <TouchableOpacity style={styles.searchActivator} onPress={() => setIsSearching(true)} />
        )}
        {isSearching && (
          <View style={styles.fullSearchBar}>
            <TouchableOpacity
              onPress={() => {
                setIsSearching(false);
                setSearchText('');
              }}
            >
              <MaterialIcons name="arrow-back" size={24} color={Colors.primary} />
            </TouchableOpacity>
            <TextInput
              style={styles.inputField}
              placeholder="Buscar por tipo de canje, sede o estado..."
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
            onRefresh={() => fetchCanjes(true)}
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
                <Text style={styles.heroStatLabel}>TOTAL CANJES</Text>
                <Text style={[styles.heroStatNumber, { color: Colors.primary }]}>
                  {stats.total}
                </Text>
              </View>
              <View style={styles.heroStatCol}>
                <Text style={styles.heroStatLabel}>ESTE MES</Text>
                <Text style={[styles.heroStatNumber, { color: Colors.tertiary }]}>
                  {stats.esteMes}
                </Text>
              </View>
            </View>
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
              <Text
                style={[
                  styles.filterChipText,
                  activeFilter === filter && styles.filterChipTextActive,
                ]}
              >
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.listSection}>
          <View style={styles.listHeaderRow}>
            <Text style={styles.listTitle}>Historial Detallado</Text>
            <TouchableOpacity onPress={() => fetchCanjes(true)} style={styles.refreshButton}>
              <MaterialIcons name="refresh" size={18} color={Colors.primary} />
            </TouchableOpacity>
          </View>

          {isLoading && !isRefreshing && (
            <View style={styles.stateContainer}>
              <ActivityIndicator size="large" color={Colors.primaryContainer} />
              <Text style={styles.stateText}>Cargando tus canjes...</Text>
            </View>
          )}

          {!isLoading && errorMessage && (
            <View style={styles.stateContainer}>
              <MaterialIcons name="error-outline" size={44} color={Colors.error} />
              <Text style={styles.errorTitle}>Error de conexión</Text>
              <Text style={styles.stateText}>{errorMessage}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={() => fetchCanjes()}>
                <MaterialIcons name="replay" size={18} color="#fff" />
                <Text style={styles.retryButtonText}>Reintentar</Text>
              </TouchableOpacity>
            </View>
          )}

          {!isLoading && !errorMessage && filteredCanjes.length === 0 && (
            <View style={styles.stateContainer}>
              <MaterialIcons name="receipt-long" size={44} color={Colors.outline} />
              <Text style={styles.emptyTitle}>
                {canjes.length === 0 ? 'Aún no tienes canjes' : 'No se encontraron resultados'}
              </Text>
              <Text style={styles.stateText}>
                {canjes.length === 0
                  ? 'Cuando canjes tu comida con el código QR, aparecerá aquí.'
                  : 'Prueba con otro filtro o término de búsqueda.'}
              </Text>
            </View>
          )}

          {!isLoading &&
            !errorMessage &&
            filteredCanjes.length > 0 &&
            filteredCanjes.map((canje) => renderCanje(canje))}
        </View>

        <View style={{ height: 28 }} />
      </ScrollView>
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
  statsContainer: { flexDirection: 'row', paddingHorizontal: 20, paddingTop: 20, marginBottom: 16 },
  heroStatCard: { flex: 1, backgroundColor: '#FFF', borderRadius: BorderRadius.xxl, padding: 16, elevation: 3 },
  heroStatTitle: { fontSize: 14, fontWeight: '700', marginBottom: 10 },
  heroStats: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroStatCol: { flex: 1 },
  heroStatLabel: { fontSize: 8, fontWeight: '700', color: '#888' },
  heroStatNumber: { fontSize: 24, fontWeight: '800' },
  heroStatDivider: { width: 1, height: 30, backgroundColor: '#EEE', marginHorizontal: 10 },
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
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  statusBadgeOk: { backgroundColor: Colors.tertiaryContainer },
  statusBadgeText: { fontSize: 9, fontWeight: '700' },
  statusTextOk: { color: Colors.onTertiaryContainer },
  stateContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 36, gap: 8 },
  stateText: { fontSize: 13, color: '#888', textAlign: 'center', maxWidth: 280 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: Colors.onBackground, marginTop: 4 },
  errorTitle: { fontSize: 15, fontWeight: '700', color: Colors.error, marginTop: 4 },
  retryButton: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: BorderRadius.lg, marginTop: 8 },
  retryButtonText: { color: '#fff', fontSize: 13, fontWeight: '700' },
});