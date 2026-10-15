// src/screens/PerfilScreen.tsx
//
// Pantalla de perfil del usuario.

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Image,
  Pressable,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, BorderRadius } from '../theme/colors';
import SwitchField from '../components/shared/selection/SwitchField';
import { useNavigation } from '@react-navigation/native';
import FavoriteLocationsModal from '../components/shared/selection/FavoriteLocationsModal';
import SoporteChatScreen from './SoporteChatScreen';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

// Tipo para los items del menú de configuración
type SettingItem = {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  description?: string;
  type: 'arrow' | 'toggle' | 'badge';
  badge?: string;
  badgeColor?: string;
  value?: boolean;
};

const settingsSections: { title: string; items: SettingItem[] }[] = [
  {
    title: 'Mi Cuenta',
    items: [
      { icon: 'person-outline', label: 'Información personal', type: 'arrow' },
      { icon: 'workspace-premium', label: 'Mi plan', description: 'Premium · Activo', type: 'badge', badge: 'Premium', badgeColor: Colors.primaryContainer },
      { icon: 'notifications-none', label: 'Notificaciones', type: 'toggle', value: true },
      { icon: 'lock-outline', label: 'Seguridad', type: 'arrow' },
    ],
  },
  {
    title: 'FoodPass',
    items: [
      { icon: 'restaurant-menu', label: 'Preferencias de menú', type: 'arrow' },
      { icon: 'place', label: 'Mis sedes favoritas', type: 'arrow' },
      { icon: 'card-giftcard', label: 'Programa de puntos', type: 'badge', badge: '1,240 pts', badgeColor: Colors.tertiaryContainer },
    ],
  },
  {
    title: 'Soporte',
    items: [
      { icon: 'help-outline', label: 'Centro de ayuda', type: 'arrow' },
      { icon: 'chat-bubble-outline', label: 'Contactar soporte', type: 'arrow' },
      { icon: 'info-outline', label: 'Versión 2.4.1', type: 'badge', badge: 'Actualizado', badgeColor: Colors.tertiaryContainer },
    ],
  },
];

// Datos del menú digital reutilizados
const menuPrefsItems = [
  { id: '1', name: 'Artisan Salad Bowl', description: 'Mezcla orgánica de hojas verdes con salmón ahumado.', price: '$18.25', image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400', category: 'Entradas' },
  { id: '2', name: 'FoodPass Signature', description: 'Hamburguesa de res premium con queso artesanal.', price: '$14.50', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400', category: 'Plato Fuerte' },
  { id: '3', name: 'Pasta del Huerto', description: 'Pasta hecha a mano con tomates cherry orgánicos.', price: '$16.00', image: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400', category: 'Plato Fuerte' },
  { id: '4', name: 'Morning Delight', description: 'Tostada de masa madre con aguacate y huevo pochado.', price: '$12.75', image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400', category: 'Entradas' },
  { id: '5', name: 'Kyoto Ramen Bowl', description: 'Caldo tonkotsu cocido por 12 horas.', price: '$21.50', image: 'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=400', category: 'Plato Fuerte' },
  { id: '6', name: 'Tiramisú Artesanal', description: 'Postre italiano tradicional con café espresso.', price: '$9.50', image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400', category: 'Postres' },
];
type MenuPrefItem = typeof menuPrefsItems[0];

const pointsRewards = [
  { id: '10_discount', title: '10% de descuento', desc: 'Ahorra en tu próxima compra. ¡Válido para cualquier producto!' },
  { id: 'free_coffee', title: 'Café gratis', desc: 'Disfruta de un delicioso café americano en nuestra tienda.' },
  { id: '30_discount', title: '30% de descuento', desc: 'Un descuento especial para que te lleves más por menos.' },
  { id: 'free_lunch', title: 'Almuerzo gratis', desc: 'Un almuerzo completo por cortesía de la casa. ¡Date un gusto!' },
];

export default function PerfilScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [chatVisible, setChatVisible] = useState(false);
  const [favModalVisible, setFavModalVisible] = useState(false);
  const [pointsModalVisible, setPointsModalVisible] = useState(false);
  const [selectedReward, setSelectedReward] = useState<string | null>(null);
  const [personalInfoModalVisible, setPersonalInfoModalVisible] = useState(false);
  const [menuPrefsVisible, setMenuPrefsVisible] = useState(false);
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuPrefItem | null>(null);
  
  const navigation = useNavigation<any>();
  const { logout, userData } = useAuth();
  const { addItem } = useCart(); // Declarado una sola vez correctamente

  const userName = userData?.name || 'Carlos Mendoza';
  const userEmail = userData?.email || 'carlos@foodpass.com';

  const userInitials = userName
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'CM';

  const userPlan = userData?.plan
    ? `${userData.plan} Member`
    : 'Premium Member';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>Mi Perfil</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{userInitials}</Text>
            <View style={styles.verifiedBadge}>
              <MaterialIcons name="verified" size={18} color={Colors.tertiary} />
            </View>
          </View>

          <Text style={styles.profileName}>{userName}</Text>
          <Text style={styles.profileEmail}>{userEmail}</Text>

          <View style={styles.membershipChip}>
            <MaterialIcons name="workspace-premium" size={14} color={Colors.onPrimaryContainer} />
            <Text style={styles.membershipText}>{userPlan}</Text>
          </View>

          <View style={styles.profileStats}>
            <View style={styles.profileStat}>
              <Text style={styles.profileStatNumber}>128</Text>
              <Text style={styles.profileStatLabel}>PEDIDOS</Text>
            </View>
            <View style={styles.profileStatDivider} />
            <View style={styles.profileStat}>
              <Text style={styles.profileStatNumber}>1,240</Text>
              <Text style={styles.profileStatLabel}>PUNTOS</Text>
            </View>
            <View style={styles.profileStatDivider} />
            <View style={styles.profileStat}>
              <Text style={[styles.profileStatNumber, { color: Colors.tertiary }]}>$1,450</Text>
              <Text style={styles.profileStatLabel}>AHORRADO</Text>
            </View>
          </View>
        </View>

        {settingsSections.map((section) => (
          <View key={section.title} style={styles.settingsSection}>
            <Text style={styles.settingsSectionTitle}>{section.title.toUpperCase()}</Text>

            <View style={styles.settingsGroup}>
              {section.items.map((item, index) => {
                const isLast = index === section.items.length - 1;

                if (item.type === 'toggle') {
                    return (
                        <View key={item.label} style={[styles.settingItem, isLast && styles.settingItemLast]}>
                            <View style={styles.settingIcon}>
                                <MaterialIcons name={item.icon} size={20} color={Colors.primary} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <SwitchField 
                                    label={item.label}
                                    value={notificationsEnabled}
                                    onToggle={(val) => setNotificationsEnabled(val)}
                                />
                            </View>
                        </View>
                    );
                }

                return (
                    <TouchableOpacity
                      key={item.label}
                      style={[styles.settingItem, isLast && styles.settingItemLast]}
                      activeOpacity={0.7}
                      onPress={() => {
                        if (item.label === 'Centro de ayuda') {
                          navigation.navigate('HelpCenter');
                        } else if (item.label === 'Mis sedes favoritas') {
                          setFavModalVisible(true);
                        } else if (item.label === 'Seguridad') {
                          navigation.navigate('Security');
                        } else if (item.label === 'Programa de puntos') {
                          setPointsModalVisible(true);
                        } else if (item.label === 'Información personal') {
                          setPersonalInfoModalVisible(true);
                        } else if (item.label === 'Contactar soporte') {
                          setChatVisible(true);
                        } else if (item.label === 'Preferencias de menú') {
                          setMenuPrefsVisible(true);
                        }
                      }}
                    >
                      <View style={styles.settingIcon}>
                        <MaterialIcons name={item.icon} size={20} color={Colors.primary} />
                      </View>
    
                      <View style={styles.settingText}>
                        <Text style={styles.settingLabel}>{item.label}</Text>
                        {item.description && (
                          <Text style={styles.settingDescription}>{item.description}</Text>
                        )}
                      </View>
    
                      {item.type === 'arrow' && (
                        <MaterialIcons name="arrow-forward-ios" size={14} color={Colors.onSurfaceVariant} />
                      )}
                      {item.type === 'badge' && item.badge && (
                        <View style={[styles.settingBadge, { backgroundColor: item.badgeColor }]}>
                          <Text style={styles.settingBadgeText}>{item.badge}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
              })}
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.logoutButton} activeOpacity={0.8} onPress={() => logout()}>
          <MaterialIcons name="logout" size={20} color={Colors.error} />
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Modal del chat de soporte */}
      <Modal
        visible={chatVisible}
        animationType="slide"
        onRequestClose={() => setChatVisible(false)}
      >
        <SoporteChatScreen onClose={() => setChatVisible(false)} />
      </Modal>

      {/* MODAL DE SEDES FAVORITAS */}
      <FavoriteLocationsModal 
        visible={favModalVisible} 
        onClose={() => setFavModalVisible(false)} 
      />

      {/* ===== MODAL PARA PROGRAMA DE PUNTOS ===== */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={pointsModalVisible}
        onRequestClose={() => setPointsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Canjea tus puntos</Text>

            {pointsRewards.map((reward) => (
              <TouchableOpacity
                key={reward.id}
                style={styles.modalOption}
                onPress={() => setSelectedReward(reward.id)}
                activeOpacity={0.7}
              >
                <View style={styles.modalOptionIcon}>
                  <MaterialIcons name="card-giftcard" size={24} color={Colors.tertiary} />
                </View>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={styles.modalOptionTitle}>{reward.title}</Text>
                  <Text style={styles.modalOptionDesc}>{reward.desc}</Text>
                </View>
                <MaterialIcons 
                  name={selectedReward === reward.id ? 'check-box' : 'check-box-outline-blank'} 
                  size={24} 
                  color={selectedReward === reward.id ? Colors.primary : Colors.outlineVariant} 
                />
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setPointsModalVisible(false)}
            >
              <Text style={styles.modalCloseButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* PERSONAL INFO MODAL */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={personalInfoModalVisible}
        onRequestClose={() => setPersonalInfoModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Información personal</Text>
            <Text style={styles.modalOptionTitle}>Juan Perez</Text>
            <Text style={styles.modalOptionDesc}>Apto para ayuda alimenticia</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setPersonalInfoModalVisible(false)}
            >
              <Text style={styles.modalCloseButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ===== MODAL PREFERENCIAS DE MENÚ ===== */}
      <Modal
        animationType="slide"
        visible={menuPrefsVisible}
        onRequestClose={() => setMenuPrefsVisible(false)}
      >
        <View style={menuStyles.container}>
          {/* Header del modal */}
          <View style={menuStyles.header}>
            <TouchableOpacity onPress={() => setMenuPrefsVisible(false)} style={menuStyles.backBtn}>
              <MaterialIcons name="arrow-back-ios" size={20} color={Colors.primary} />
            </TouchableOpacity>
            <Text style={menuStyles.headerTitle}>Preferencias de Menú</Text>
            <View style={{ width: 44 }} />
          </View>

          {/* Lista de platos */}
          <FlatList
            data={menuPrefsItems}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={menuStyles.card}
                activeOpacity={0.85}
                onPress={() => setSelectedMenuItem(item)}
              >
                <Image source={{ uri: item.image }} style={menuStyles.cardImage} resizeMode="cover" />
                <View style={menuStyles.cardContent}>
                  <Text style={menuStyles.cardName}>{item.name}</Text>
                  <Text style={menuStyles.cardDesc} numberOfLines={2}>{item.description}</Text>
                  <View style={menuStyles.cardFooter}>
                    <Text style={menuStyles.cardPrice}>{item.price}</Text>
                    <View style={menuStyles.cardBadge}>
                      <Text style={menuStyles.cardBadgeText}>{item.category}</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* Popup detalle del plato */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={selectedMenuItem !== null}
          onRequestClose={() => setSelectedMenuItem(null)}
        >
          <Pressable style={menuStyles.popupOverlay} onPress={() => setSelectedMenuItem(null)}>
            <Pressable style={menuStyles.popup} onPress={(e) => e.stopPropagation()}>
              <TouchableOpacity style={menuStyles.popupClose} onPress={() => setSelectedMenuItem(null)}>
                <MaterialIcons name="close" size={24} color={Colors.onSurfaceVariant} />
              </TouchableOpacity>
              {selectedMenuItem && (
                <>
                  <Image source={{ uri: selectedMenuItem.image }} style={menuStyles.popupImage} resizeMode="cover" />
                  <Text style={menuStyles.popupName}>{selectedMenuItem.name}</Text>
                  <Text style={menuStyles.popupDesc}>{selectedMenuItem.description}</Text>
                  <Text style={menuStyles.popupPrice}>{selectedMenuItem.price}</Text>
                  <TouchableOpacity
                    style={menuStyles.popupAddBtn}
                    activeOpacity={0.8}
                    onPress={() => {
                      if (selectedMenuItem) {
                        addItem(selectedMenuItem);
                        setSelectedMenuItem(null);
                      }
                    }}
                  >
                    <MaterialIcons name="add-shopping-cart" size={20} color={Colors.onPrimaryContainer} />
                    <Text style={menuStyles.popupAddText}>Agregar al carrito</Text>
                  </TouchableOpacity>
                </>
              )}
            </Pressable>
          </Pressable>
        </Modal>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.surface },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: 'rgba(255,255,255,0.85)', elevation: 3 },
  topBarTitle: { fontSize: 20, fontWeight: '800', color: Colors.onBackground, letterSpacing: -0.3 },
  topBarAction: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surfaceContainerLow, justifyContent: 'center', alignItems: 'center' },
  scroll: { flex: 1 },
  profileCard: { margin: 20, backgroundColor: Colors.inverseSurface, borderRadius: BorderRadius.xxxl, padding: 28, alignItems: 'center' },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.primaryContainer, justifyContent: 'center', alignItems: 'center', marginBottom: 14, position: 'relative' },
  avatarText: { fontSize: 28, fontWeight: '800', color: Colors.onPrimaryContainer },
  verifiedBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: Colors.surfaceContainerLowest, borderRadius: 12, padding: 2 },
  profileName: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 4 },
  profileEmail: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 14 },
  membershipChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.primaryContainer, paddingHorizontal: 14, paddingVertical: 6, borderRadius: BorderRadius.full, marginBottom: 24 },
  membershipText: { fontSize: 12, fontWeight: '700', color: Colors.onPrimaryContainer },
  profileStats: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: BorderRadius.xl, padding: 16, width: '100%', justifyContent: 'space-around' },
  profileStat: { alignItems: 'center' },
  profileStatNumber: { fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  profileStatLabel: { fontSize: 8, fontWeight: '700', color: 'rgba(255,255,255,0.5)', letterSpacing: 1, marginTop: 2 },
  profileStatDivider: { width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.15)' },
  settingsSection: { marginBottom: 8, paddingHorizontal: 20 },
  settingsSectionTitle: { fontSize: 10, fontWeight: '700', color: Colors.onSurfaceVariant, letterSpacing: 1.5, marginBottom: 8, paddingLeft: 4 },
  settingsGroup: { backgroundColor: Colors.surfaceContainerLowest, borderRadius: BorderRadius.xxl, overflow: 'hidden' },
  settingItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.surfaceContainerLow },
  settingItemLast: { borderBottomWidth: 0 },
  settingIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.surfaceContainerLow, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  settingText: { flex: 1 },
  settingLabel: { fontSize: 14, fontWeight: '600', color: Colors.onSurface },
  settingDescription: { fontSize: 12, color: Colors.onSurfaceVariant, marginTop: 1 },
  settingBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.full },
  settingBadgeText: { fontSize: 10, fontWeight: '700', color: Colors.onPrimaryContainer, letterSpacing: 0.5 },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginHorizontal: 20, marginTop: 8, paddingVertical: 16, backgroundColor: Colors.errorContainer, borderRadius: BorderRadius.xl },
  logoutText: { fontSize: 15, fontWeight: '700', color: Colors.error },
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
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  modalOptionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.onSurface,
    marginBottom: 2,
  },
  modalOptionDesc: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    lineHeight: 16,
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

// ===== ESTILOS PARA PREFERENCIAS DE MENÚ =====
const menuStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingTop: 50,
    backgroundColor: Colors.surface,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surfaceContainerLow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xxl,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  cardImage: {
    width: 110,
    height: 110,
  },
  cardContent: {
    flex: 1,
    padding: 14,
    justifyContent: 'space-between',
  },
  cardName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  cardDesc: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    lineHeight: 16,
    marginTop: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  cardPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primaryContainer,
  },
  cardBadge: {
    backgroundColor: Colors.surfaceContainerLow,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  cardBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.onSurfaceVariant,
  },
  // Popup detalle
  popupOverlay: {
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
  popupClose: {
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
  popupImage: {
    width: '100%',
    height: 180,
    borderRadius: BorderRadius.xl,
    marginBottom: 16,
  },
  popupName: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.onSurface,
    marginBottom: 8,
  },
  popupDesc: {
    fontSize: 14,
    color: Colors.onSurfaceVariant,
    lineHeight: 20,
    marginBottom: 16,
  },
  popupPrice: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.primaryContainer,
    marginBottom: 20,
  },
  popupAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primaryContainer,
    paddingVertical: 14,
    borderRadius: BorderRadius.xl,
  },
  popupAddText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.onPrimaryContainer,
  },
});