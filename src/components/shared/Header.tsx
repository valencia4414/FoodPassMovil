// src/components/shared/Header.tsx

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Typography, BorderRadius } from '../../theme/colors';
import NotificationModal from './feedback/NotificationModal';
import CartModal from './CartModal';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

interface HeaderProps {
  title: string;
  showSearch?: boolean;
  showCart?: boolean;
  onSearchPress?: () => void;
  onSearchTextChange?: (text: string) => void;
}

export default function Header({
  title,
  showSearch = false,
  showCart = false,
  onSearchPress,
  onSearchTextChange,
}: HeaderProps) {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const { userData } = useAuth();
  const { totalItems } = useCart();

  const [modalVisible, setModalVisible] = useState(false);
  const [cartVisible, setCartVisible] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchText, setSearchText] = useState('');
  const debounceTimer = useRef<any>(null);

  // Conserva aquí el resto de tu código original.


  const avatarInitials = userData?.name
    ? userData.name
        .split(' ')
        .filter(Boolean)
        .map((w) => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'CM';

  const handleSearchToggle = () => {
    if (onSearchPress) {
      // Si la pantalla tiene su propio handler (como MenuScreen), usarlo
      onSearchPress();
    } else {
      // Activar búsqueda interna del Header
      setIsSearching(true);
    }
  };

  const handleCloseSearch = () => {
    setIsSearching(false);
    setSearchText('');
    onSearchTextChange?.('');
  };

  const handleTextChange = (text: string) => {
    setSearchText(text);
    // Debounce: notify parent only after 300 ms of inactivity
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      onSearchTextChange?.(text);
    }, 300);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      {/* MODO BÚSQUEDA: Barra de búsqueda que reemplaza el header */}
      {isSearching ? (
        <View style={styles.searchBar}>
          <TouchableOpacity onPress={handleCloseSearch} style={styles.searchBackBtn}>
            <MaterialIcons name="arrow-back" size={22} color={Colors.primary} />
          </TouchableOpacity>
          <View style={styles.searchInputWrap}>
            <MaterialIcons name="search" size={20} color={Colors.onSurfaceVariant} />
            <TextInput
              style={styles.searchInput}
              placeholder="¿Qué estás buscando?"
              placeholderTextColor={Colors.onSurfaceVariant + '80'}
              autoFocus
              value={searchText}
              onChangeText={handleTextChange}
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => handleTextChange('')}>
                <MaterialIcons name="close" size={20} color={Colors.onSurfaceVariant} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      ) : (
        <>
          {/* MODO NORMAL: Logo + acciones */}
          <View style={styles.titleContainer}>
            <View style={styles.brandRow}>
              <Image 
                source={require('../../../assets/foodpass_logo.png')} 
                style={styles.logo} 
                resizeMode="contain" 
              />
              <Text style={styles.appName}>FoodPass</Text>
            </View>
            <Text style={styles.subtitle}>{title}</Text>
          </View>

          <View style={styles.actions}>
            {showSearch && (
              <TouchableOpacity
                style={styles.iconButton}
                onPress={handleSearchToggle}
                activeOpacity={0.7}
              >
                <MaterialIcons name="search" size={24} color={Colors.onBackground} />
              </TouchableOpacity>
            )}

            {/* Botón del Carrito con Badge Dinámico (T07) */}
            {showCart && (
              <TouchableOpacity 
                style={styles.iconButton} 
                activeOpacity={0.7}
                onPress={() => setCartVisible(true)}
              >
                <View style={styles.cartWrapper}>
                  <MaterialIcons name="shopping-cart" size={22} color={Colors.onBackground} />
                  {totalItems > 0 && (
                    <View style={styles.cartBadge}>
                      <Text style={styles.cartBadgeText}>
                        {totalItems > 99 ? '99+' : totalItems}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            )}

            {/* Botón de notificaciones */}
            <TouchableOpacity 
              style={styles.iconButton} 
              activeOpacity={0.7}
              onPress={() => setModalVisible(true)}
            >
              <View style={styles.notifWrapper}>
                <MaterialIcons name="notifications" size={24} color={Colors.onBackground} />
                <View style={styles.notifDot} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.avatar}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('Perfil')}>
              <Text style={styles.avatarText}>{avatarInitials}</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* El Modal de Notificaciones */}
      <NotificationModal 
        visible={modalVisible} 
        onClose={() => setModalVisible(false)} 
      />

      {/* El Modal del Carrito de Compras */}
      {showCart && (
        <CartModal
          visible={cartVisible}
          onClose={() => setCartVisible(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    shadowColor: '#121f05',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 4,
  },
  titleContainer: {
    flex: 1,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logo: {
    width: 32,
    height: 32,
  },
  appName: {
    ...Typography.titleLg,
    color: Colors.inverseSurface,
  },
  subtitle: {
    ...Typography.labelSm,
    color: Colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceContainerLow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartWrapper: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadge: {
    position: 'absolute',
    top: -5,
    right: -7,
    backgroundColor: Colors.primaryContainer,
    minWidth: 17,
    height: 17,
    borderRadius: 8.5,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  cartBadgeText: {
    color: Colors.onPrimaryContainer,
    fontSize: 9,
    fontWeight: '800',
  },
  notifWrapper: {
    position: 'relative',
  },
  notifDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primaryContainer,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.inverseSurface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  // === ESTILOS DE BÚSQUEDA ===
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceContainerLow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: 14,
    height: 44,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: Colors.onSurface,
  },
});