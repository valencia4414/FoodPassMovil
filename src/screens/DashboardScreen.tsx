import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  TextInput, // <-- Agregado
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import Header from '../components/shared/Header';
import { Colors, BorderRadius } from '../theme/colors';
import { apiClient } from '../services/apiClient';
import PedidoStatusTracker from '../components/PedidoStatusTracker';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const recentTransactions = [
  { id: '1', name: 'Artisan Salad Bowl', date: 'Hoy, 12:34', amount: '-$18.25', type: 'lunch', status: 'ok' },
  { id: '2', name: 'FoodPass Signature', date: 'Ayer, 13:05', amount: '-$14.50', type: 'lunch', status: 'ok' },
  { id: '3', name: 'Kyoto Ramen Bowl', date: 'Mar, 12:45', amount: '-$21.50', type: 'lunch', status: 'ok' },
  { id: '4', name: 'Morning Delight', date: 'Lun, 08:15', amount: '-$12.75', type: 'breakfast', status: 'ok' },
];

export default function DashboardScreen() {
  // --- NUEVOS ESTADOS PARA BÚSQUEDA ---
  const [searchText, setSearchText] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Verificación T01 / RFM01: Petición desde la app que pasa por el interceptor de apiClient
  // e inyecta automáticamente el token JWT simulado en las cabeceras HTTP.
  useEffect(() => {
    const fetchDashboardSummary = async () => {
      try {
        await apiClient.get('/dashboard/summary');
      } catch {
        // En desarrollo/mock el interceptor procesa e inyecta el token con éxito
      }
    };
    fetchDashboardSummary();
  }, []);

  // Filtrado de las transacciones basado en la búsqueda
  const filteredTransactions = recentTransactions.filter(t => 
    t.name.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      
      {/* SECCIÓN CABECERA INTERACTIVA */}
      <View style={styles.headerWrapper}>
        <Header title="Panel Principal" showSearch />
        
        {/* BOTÓN INVISIBLE SOBRE LA LUPA */}
        {!isSearching && (
          <TouchableOpacity 
            style={styles.searchActivator} 
            onPress={() => setIsSearching(true)} 
          />
        )}

        {/* BUSCADOR REAL QUE SE DESPLIEGA AL TOCAR LA LUPA */}
        {isSearching && (
          <View style={styles.fullSearchBar}>
            <TouchableOpacity onPress={() => { setIsSearching(false); setSearchText(''); }}>
              <MaterialIcons name="arrow-back" size={24} color={Colors.primary} />
            </TouchableOpacity>
            <TextInput
              style={styles.inputField}
              placeholder="¿Qué transacción buscas?"
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

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>¡Hola, Juan!</Text>
          <Text style={styles.welcomeSubtitle}>Bienvenido a tu panel artesanal de hoy.</Text>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.planBadge}><Text style={styles.planBadgeText}>PLAN PREMIUM</Text></View>
          <Text style={styles.heroCardTitle}>Almuerzos disponibles</Text>
          <Text style={styles.heroCardSubtitle}>Consumos restantes de tu ciclo mensual</Text>
          <View style={styles.heroNumbers}>
            <Text style={styles.heroNumber}>14</Text>
            <Text style={styles.heroNumberDen}>/ 22 días</Text>
          </View>
          <MaterialIcons name="restaurant" size={80} color={Colors.primaryContainer} style={styles.heroIcon} />
        </View>

        {/* SEGUIMIENTO DE PEDIDO EN TIEMPO REAL (T13 - RFM14: Polling intermitente cada 4s) */}
        <PedidoStatusTracker initialOrderId={14} />

        <View style={styles.statsRow}>
          <View style={[styles.statCard, styles.statCardGreen]}>
            <View style={styles.statCardTop}>
              <View style={styles.statIconBox}><MaterialIcons name="shopping-bag" size={22} color={Colors.primary} /></View>
              <Text style={styles.statBadge}>+2 esta semana</Text>
            </View>
            <Text style={styles.statLabel}>PEDIDOS REALIZADOS</Text>
            <Text style={styles.statNumber}>48</Text>
          </View>

          <View style={[styles.statCard, styles.statCardDark]}>
            <View style={styles.statCardTop}>
              <View style={[styles.statIconBox, { backgroundColor: 'rgba(255,255,255,0.15)' }]}><MaterialIcons name="star" size={22} color={Colors.primaryContainer} /></View>
            </View>
            <Text style={[styles.statLabel, { color: 'rgba(255,255,255,0.6)' }]}>PUNTOS PASS</Text>
            <Text style={[styles.statNumber, { color: Colors.primaryContainer }]}>1,240</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Últimos Canjes</Text>
            <TouchableOpacity><Text style={styles.sectionLink}>Ver todo</Text></TouchableOpacity>
          </View>

          {/* LISTA FILTRADA POR EL BUSCADOR */}
          {filteredTransactions.length > 0 ? (
            filteredTransactions.map((transaction) => (
              <View key={transaction.id} style={styles.transactionItem}>
                <View style={styles.transactionIcon}><MaterialIcons name="restaurant" size={20} color={Colors.primary} /></View>
                <View style={styles.transactionInfo}>
                  <Text style={styles.transactionName}>{transaction.name}</Text>
                  <Text style={styles.transactionDate}>{transaction.date}</Text>
                </View>
                <View style={styles.transactionRight}>
                  <Text style={styles.transactionAmount}>{transaction.amount}</Text>
                  <View style={styles.freshnessBadge}><Text style={styles.freshnessBadgeText}>OK</Text></View>
                </View>
              </View>
            ))
          ) : (
            <Text style={{ textAlign: 'center', color: '#888', marginTop: 10 }}>No se encontraron coincidencias.</Text>
          )}
        </View>

        <TouchableOpacity style={styles.pointsBanner} activeOpacity={0.9}>
          <View style={styles.pointsBannerContent}>
            <MaterialIcons name="workspace-premium" size={32} color={Colors.primaryContainer} />
            <View style={styles.pointsBannerText}>
              <Text style={styles.pointsBannerTitle}>¡Tienes 1,240 puntos!</Text>
              <Text style={styles.pointsBannerSubtitle}>Canjéalos por platillos exclusivos</Text>
            </View>
          </View>
          <MaterialIcons name="arrow-forward-ios" size={16} color="rgba(255,255,255,0.6)" />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.surface },
  
  // ESTILOS DE LA CABECERA INTERACTIVA
  headerWrapper: { position: 'relative', zIndex: 100 },
  searchActivator: {
    position: 'absolute',
    right: 85, // Posicionamiento sobre la lupa de tu imagen
    top: 10,
    width: 45,
    height: 45,
    borderRadius: 22,
    zIndex: 101,
  },
  fullSearchBar: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: '#FFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    height: 70, 
    zIndex: 102,
    elevation: 4,
  },
  inputField: { flex: 1, marginLeft: 15, fontSize: 16, color: '#000', fontWeight: '500' },

  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 24 },
  welcomeSection: { marginTop: 24, marginBottom: 20 },
  welcomeTitle: { fontSize: 32, fontWeight: '800', color: Colors.onBackground, letterSpacing: -0.5 },
  welcomeSubtitle: { fontSize: 14, color: Colors.onSurfaceVariant, marginTop: 4 },
  heroCard: { backgroundColor: Colors.surfaceContainerLowest, borderRadius: BorderRadius.xxxl, padding: 24, marginBottom: 12, overflow: 'hidden', elevation: 4 },
  planBadge: { backgroundColor: Colors.tertiaryContainer, paddingHorizontal: 12, paddingVertical: 4, borderRadius: BorderRadius.full, alignSelf: 'flex-start', marginBottom: 16 },
  planBadgeText: { fontSize: 10, fontWeight: '700', color: Colors.onTertiaryContainer, letterSpacing: 1.5 },
  heroCardTitle: { fontSize: 20, fontWeight: '700', color: Colors.onBackground, marginBottom: 4 },
  heroCardSubtitle: { fontSize: 13, color: Colors.onSurfaceVariant, marginBottom: 20 },
  heroNumbers: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  heroNumber: { fontSize: 64, fontWeight: '800', color: Colors.primaryContainer, letterSpacing: -2, lineHeight: 72 },
  heroNumberDen: { fontSize: 18, fontWeight: '600', color: Colors.onSurfaceVariant, paddingBottom: 10 },
  heroIcon: { position: 'absolute', right: -10, top: 20, opacity: 0.12 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statCard: { flex: 1, borderRadius: BorderRadius.xxl, padding: 18, minHeight: 140, justifyContent: 'space-between' },
  statCardGreen: { backgroundColor: Colors.surfaceContainerLow },
  statCardDark: { backgroundColor: Colors.inverseSurface },
  statCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  statIconBox: { width: 44, height: 44, backgroundColor: Colors.surfaceContainerLowest, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  statBadge: { fontSize: 9, fontWeight: '700', color: Colors.tertiary, letterSpacing: 0.5, textAlign: 'right', flexShrink: 1, maxWidth: 70 },
  statLabel: { fontSize: 9, fontWeight: '700', color: Colors.onSurfaceVariant, letterSpacing: 1, marginBottom: 4 },
  statNumber: { fontSize: 28, fontWeight: '800', color: Colors.onBackground, letterSpacing: -0.5 },
  section: { marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.onBackground },
  sectionLink: { fontSize: 13, fontWeight: '600', color: Colors.primary },
  transactionItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  transactionIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: Colors.surfaceContainerLow, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  transactionInfo: { flex: 1 },
  transactionName: { fontSize: 14, fontWeight: '600', color: Colors.onSurface, marginBottom: 2 },
  transactionDate: { fontSize: 12, color: Colors.onSurfaceVariant },
  transactionRight: { alignItems: 'flex-end', gap: 4 },
  transactionAmount: { fontSize: 14, fontWeight: '700', color: Colors.onSurface },
  freshnessBadge: { backgroundColor: Colors.tertiaryContainer, paddingHorizontal: 8, paddingVertical: 2, borderRadius: BorderRadius.full },
  freshnessBadgeText: { fontSize: 9, fontWeight: '700', color: Colors.onTertiaryContainer, letterSpacing: 1 },
  pointsBanner: { backgroundColor: Colors.inverseSurface, borderRadius: BorderRadius.xxl, padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pointsBannerContent: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  pointsBannerText: { flex: 1 },
  pointsBannerTitle: { fontSize: 15, fontWeight: '700', color: '#fff', marginBottom: 2 },
  pointsBannerSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.6)' },
});