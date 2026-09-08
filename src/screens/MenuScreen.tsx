// src/screens/MenuScreen.tsx
import React, { useState } from 'react';
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList } from 'react-native';
import { PlatilloCard } from '../components/PlatilloCard';  // Componente Tarea 58
import { LoadingSpinner } from '../components/LoadingSpinner'; // Componente Tarea 56
import { fetchApi } from '../services/api';              // Servicio Tareas 54, 55, 61
import strings from '../lang/es.json';                   // Idioma Tarea 59
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  ScrollView,
  Dimensions,
  TextInput, // <-- Importado para la búsqueda
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import Header from '../components/shared/Header';
import { Colors, BorderRadius } from '../theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 40 - 12) / 2;

const categories = ['Todos', 'Entradas', 'Plato Fuerte', 'Postres'];

export const MenuScreen = () => {
  // Tarea 60: Estado local (useState) para controlar la pantalla
  const [loading, setLoading] = useState(true);
  const [platillos, setPlatillos] = useState([]);

  useEffect(() => {
    obtenerMenu();
  }, []);

  const obtenerMenu = async () => {
    setLoading(true);
    const data = await fetchApi('https://tu-backend-api.com/menu');
    if (data) setPlatillos(data);
    setLoading(false);
  };

  // Tarea 56: Si 'loading' es true, muestra el spinner en vez de la lista
  if (loading) {
    return <LoadingSpinner />;
  }

  // RENDER: Aquí va lo que se dibuja en pantalla
  return (
    <View style={{ flex: 1, padding: 15 }}>
      {/* Tarea 59: Texto desde el JSON de idioma */}
      <Text style={{ fontSize: 20, fontWeight: 'bold' }}>{strings.menu_titulo}</Text>

      {/* FlatList dibuja la lista usando PlatilloCard */}
      <FlatList
        data={platillos}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          /* Tarea 58: Renderizar el componente reutilizable */
          <PlatilloCard 
            nombre={item.nombre} 
            descripcion={item.descripcion} 
            precio={item.precio} 
          />
        )}
      />
    </View>
  );
};

const menuItems = [
  {
    id: '1',
    name: 'Artisan Salad Bowl',
    description: 'Mezcla orgánica de hojas verdes con salmón ahumado.',
    price: '$18.25',
    badge: 'Fresh',
    badgeType: 'green',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400',
    category: 'Entradas',
  },
  {
    id: '2',
    name: 'FoodPass Signature',
    description: 'Hamburguesa de res premium con queso artesanal.',
    price: '$14.50',
    badge: null,
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400',
    category: 'Plato Fuerte',
  },
  {
    id: '3',
    name: 'Pasta del Huerto',
    description: 'Pasta hecha a mano con tomates cherry orgánicos.',
    price: '$16.00',
    badge: null,
    image: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400',
    category: 'Plato Fuerte',
  },
  {
    id: '4',
    name: 'Morning Delight',
    description: 'Tostada de masa madre con aguacate y huevo pochado.',
    price: '$12.75',
    badge: 'Top Rated',
    badgeType: 'orange',
    image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400',
    category: 'Entradas',
  },
  {
    id: '5',
    name: 'Kyoto Ramen Bowl',
    description: 'Caldo tonkotsu cocido por 12 horas.',
    price: '$21.50',
    badge: null,
    image: 'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=400',
    category: 'Plato Fuerte',
  },
  {
    id: '6',
    name: 'Tiramisú Artesanal',
    description: 'Postre italiano tradicional con café espresso.',
    price: '$9.50',
    badge: 'Nuevo',
    badgeType: 'green',
    image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400',
    category: 'Postres',
  },
];

type MenuItem = typeof menuItems[0];

export default function MenuScreen() {
  const [activeCategory, setActiveCategory] = useState('Todos');
  
  // --- NUEVOS ESTADOS PARA BÚSQUEDA ---
  const [searchText, setSearchText] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [cartItems, setCartItems] = useState<MenuItem[]>([]);

  // Lógica de filtrado combinada (Categoría + Texto)
  const filteredItems = menuItems.filter(item => {
    const matchesCategory = activeCategory === 'Todos' || item.category === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchText.toLowerCase()) || 
                          item.description.toLowerCase().includes(searchText.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const renderMenuCard = ({ item }: { item: MenuItem }) => (
    <View style={styles.card}>
      <View style={styles.cardImageContainer}>
        <Image source={{ uri: item.image }} style={styles.cardImage} resizeMode="cover" />
        {item.badge && (
          <View style={[styles.badge, item.badgeType === 'green' ? styles.badgeGreen : styles.badgeOrange]}>
            <Text style={[styles.badgeText, item.badgeType === 'green' ? styles.badgeTextGreen : styles.badgeTextOrange]}>
              {item.badge.toUpperCase()}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardName} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.cardDescription} numberOfLines={2}>{item.description}</Text>
        <View style={styles.cardFooter}>
          <Text style={styles.cardPrice}>{item.price}</Text>
          <TouchableOpacity style={styles.selectButton} activeOpacity={0.8} onPress={() => setSelectedItem(item)}>
            <Text style={styles.selectButtonText}>Seleccionar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      
      {/* --- CABECERA CON BUSCADOR DINÁMICO --- */}
      <View style={styles.headerWrapper}>
        <Header title="Menú Digital" showSearch />
        
        {/* LUPA INVISIBLE: Cae justo encima del icono de la lupa del Header */}
        {!isSearching && (
          <TouchableOpacity 
            style={styles.searchActivator} 
            onPress={() => setIsSearching(true)} 
          />
        )}

        {/* BARRA DE BÚSQUEDA ACTIVA: Tapa el header cuando se activa */}
        {isSearching && (
          <View style={styles.fullSearchBar}>
            <TouchableOpacity onPress={() => { setIsSearching(false); setSearchText(''); }}>
              <MaterialIcons name="arrow-back" size={24} color={Colors.primary} />
            </TouchableOpacity>
            <TextInput
              style={styles.inputField}
              placeholder="¿Qué te apetece hoy?"
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

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Banner destacado */}
        <View style={styles.featuredBanner}>
          <View style={styles.featuredOverlay}>
            <View style={styles.chefBadge}><Text style={styles.chefBadgeText}>RECOMENDACIÓN DEL CHEF</Text></View>
            <Text style={styles.featuredTitle}>Corte Artisan{'\n'}con Finas Hierbas</Text>
            <View style={styles.featuredFooter}>
              <TouchableOpacity style={styles.featuredButton} activeOpacity={0.8}>
                <MaterialIcons name="shopping-cart" size={20} color={Colors.onPrimaryContainer} />
              </TouchableOpacity>
              <Text style={styles.featuredPrice}>$45.50</Text>
            </View>
          </View>
        </View>

        {/* Filtros de categoría */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersContainer} style={styles.filtersScroll}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.filterChip, activeCategory === cat && styles.filterChipActive]}
              onPress={() => setActiveCategory(cat)}
            >
              <Text style={[styles.filterChipText, activeCategory === cat && styles.filterChipTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <FlatList
          data={filteredItems}
          renderItem={renderMenuCard}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
          scrollEnabled={false}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No se encontraron platos.</Text>
          }
        />
      </ScrollView>
      {/* POPUP DE DETALLE DEL PLATO */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={selectedItem !== null}
        onRequestClose={() => setSelectedItem(null)}
      >
        <Pressable style={popupStyles.overlay} onPress={() => setSelectedItem(null)}>
          <Pressable style={popupStyles.popup} onPress={(e) => e.stopPropagation()}>
            {/* Botón cerrar */}
            <TouchableOpacity style={popupStyles.closeBtn} onPress={() => setSelectedItem(null)}>
              <MaterialIcons name="close" size={24} color={Colors.onSurfaceVariant} />
            </TouchableOpacity>

            {selectedItem && (
              <>
                <Image source={{ uri: selectedItem.image }} style={popupStyles.image} resizeMode="cover" />
                <Text style={popupStyles.name}>{selectedItem.name}</Text>
                <Text style={popupStyles.description}>{selectedItem.description}</Text>
                <View style={popupStyles.priceRow}>
                  <Text style={popupStyles.price}>{selectedItem.price}</Text>
                </View>
                <TouchableOpacity
                  style={popupStyles.addButton}
                  activeOpacity={0.8}
                  onPress={() => {
                    setCartItems(prev => [...prev, selectedItem]);
                    setSelectedItem(null);
                  }}
                >
                  <MaterialIcons name="add-shopping-cart" size={20} color={Colors.onPrimaryContainer} />
                  <Text style={popupStyles.addButtonText}>Agregar al carrito</Text>
                </TouchableOpacity>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  
  // === ESTILOS DEL BUSCADOR INTERACTIVO ===
  headerWrapper: {
    position: 'relative',
    zIndex: 100,
  },
  searchActivator: {
    position: 'absolute',
    right: 85, // Ajusta esto para que caiga sobre la lupa del Header
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
    height: 70, // Ajuste al alto de tu header
    zIndex: 102,
    elevation: 4,
  },
  inputField: {
    flex: 1,
    marginLeft: 15,
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
  },

  // === RESTO DE ESTILOS ===
  featuredBanner: { marginHorizontal: 20, marginTop: 16, height: 160, borderRadius: BorderRadius.xxxl, backgroundColor: Colors.inverseSurface, overflow: 'hidden', marginBottom: 16 },
  featuredOverlay: { flex: 1, backgroundColor: 'rgba(39, 53, 23, 0.75)', padding: 20, justifyContent: 'space-between' },
  chefBadge: { backgroundColor: Colors.tertiaryContainer, paddingHorizontal: 10, paddingVertical: 3, borderRadius: BorderRadius.full, alignSelf: 'flex-start' },
  chefBadgeText: { fontSize: 9, fontWeight: '700', color: Colors.onTertiaryContainer, letterSpacing: 1 },
  featuredTitle: { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: -0.5, lineHeight: 28 },
  featuredFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  featuredButton: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.primaryContainer, paddingHorizontal: 16, paddingVertical: 10, borderRadius: BorderRadius.xl },
  featuredButtonText: { fontSize: 13, fontWeight: '700', color: Colors.onPrimaryContainer },
  featuredPrice: { fontSize: 24, fontWeight: '800', color: '#fff' },
  filtersScroll: { maxHeight: 50, marginBottom: 8 },
  filtersContainer: { paddingHorizontal: 20, gap: 8, alignItems: 'center' },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: BorderRadius.full, backgroundColor: Colors.surfaceContainer },
  filterChipActive: { backgroundColor: Colors.surfaceContainerLowest, elevation: 3 },
  filterChipText: { fontSize: 13, fontWeight: '600', color: Colors.onSurfaceVariant },
  filterChipTextActive: { color: Colors.onSurface, fontWeight: '700' },
  listContent: { paddingHorizontal: 20, paddingBottom: 20 },
  row: { gap: 12, marginBottom: 12 },
  card: { width: CARD_WIDTH, backgroundColor: Colors.surfaceContainerLowest, borderRadius: BorderRadius.xxl, overflow: 'hidden', elevation: 3 },
  cardImageContainer: { height: 130 },
  cardImage: { width: '100%', height: '100%' },
  badge: { position: 'absolute', top: 10, left: 10, paddingHorizontal: 8, paddingVertical: 3, borderRadius: BorderRadius.full },
  badgeGreen: { backgroundColor: Colors.tertiaryContainer },
  badgeOrange: { backgroundColor: Colors.primaryContainer },
  badgeText: { fontSize: 8, fontWeight: '700', letterSpacing: 1 },
  badgeTextGreen: { color: Colors.onTertiaryContainer },
  badgeTextOrange: { color: Colors.onPrimaryContainer },
  cardContent: { padding: 14 },
  cardName: { fontSize: 14, fontWeight: '700', color: Colors.onSurface, marginBottom: 4 },
  cardDescription: { fontSize: 11, color: Colors.onSurfaceVariant, lineHeight: 15, marginBottom: 12 },
  cardFooter: { gap: 8 },
  cardPrice: { fontSize: 20, fontWeight: '800', color: Colors.primaryContainer },
  selectButton: { backgroundColor: Colors.primaryContainer, paddingVertical: 10, borderRadius: BorderRadius.lg, alignItems: 'center' },
  selectButtonText: { fontSize: 12, fontWeight: '700', color: Colors.onPrimaryContainer },
  emptyText: { textAlign: 'center', marginTop: 20, color: Colors.onSurfaceVariant },
});

const popupStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  popup: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xxl,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceContainerLow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: 180,
    borderRadius: BorderRadius.xl,
    marginBottom: 16,
  },
  name: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.onSurface,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: Colors.onSurfaceVariant,
    lineHeight: 20,
    marginBottom: 16,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  price: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.primaryContainer,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primaryContainer,
    paddingVertical: 14,
    borderRadius: BorderRadius.xl,
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.onPrimaryContainer,
  },
});