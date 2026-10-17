// src/screens/PerfilScreen.tsx
//
// Pantalla de perfil del usuario (T11 - RFM12).
// Conectada dinámicamente con GET /api/users/me y PUT /api/users/me.

import React, { useState, useCallback, useRef } from 'react';
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
  TextInput,
  ActivityIndicator,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Colors, BorderRadius } from '../theme/colors';
import SwitchField from '../components/shared/selection/SwitchField';
import FavoriteLocationsModal from '../components/shared/selection/FavoriteLocationsModal';
import SoporteChatScreen from './SoporteChatScreen';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { apiClient } from '../services/apiClient';

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

// Datos del menú digital para modal de preferencias
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
  const [menuPrefsVisible, setMenuPrefsVisible] = useState(false);
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuPrefItem | null>(null);

  // Navegación y contextos
  const navigation = useNavigation<any>();

  const { logout, userData, updateUser } = useAuth();
  const { addItem } = useCart();

  // Refs para usar siempre el valor más reciente sin recrear fetchProfile
  const updateUserRef = useRef<any>(updateUser);
  const userDataRef = useRef<any>(userData);
  updateUserRef.current = updateUser;
  userDataRef.current = userData;

  // Estados de datos reales del perfil
  const [profileData, setProfileData] = useState<any>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Estados para el Modal de Edición de Información Personal (T11)
  const [personalInfoModalVisible, setPersonalInfoModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editTelefono, setEditTelefono] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState<string | null>(null);

  // Variables calculadas de visualización
  const userName: string = profileData?.name || userData?.name || 'Carlos Mendoza';
  const userEmail: string = profileData?.email || userData?.email || 'carlos@foodpass.com';
  const userPhone: string = profileData?.telefono || (userData as any)?.telefono || 'No registrado';
  const userPoints: number = Number(profileData?.puntos_fp ?? 1240) || 0;
  const userMembership: string =
    profileData?.membresia || (userData as any)?.membresia || (userData as any)?.plan || 'Premium';

  const userInitials =
    userName
      .split(' ')
      .filter(Boolean)
      .map((w: string) => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'CM';

  const userPlanText = `${userMembership} Member`;

  // Consultar datos reales del usuario desde el backend (GET /api/users/me)
  const fetchProfile = useCallback(async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoadingProfile(true);

    try {
      const response = await apiClient.get('/users/me');
      if (response.data && response.data.success) {
        const u = response.data.data;
        setProfileData(u);
        if (u.name && updateUserRef.current) {
          await updateUserRef.current({
            name: u.name,
            email: u.email,
            role: u.role,
            telefono: u.telefono,
            membresia: u.membresia,
            puntos_fp: u.puntos_fp,
          } as any);
        }
      }
    } catch (err: any) {
      console.warn('[PerfilScreen] No se pudo cargar perfil desde API:', err?.message || err);
      setProfileData((prev: any) => prev ?? userDataRef.current ?? null);
    } finally {
      setIsLoadingProfile(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [fetchProfile])
  );

  const handleOpenEditModal = () => {
    const currentName = profileData?.name || userData?.name || '';
    const currentTel = profileData?.telefono || (userData as any)?.telefono || '';
    setEditName(currentName);
    setEditTelefono(currentTel);
    setEditError(null);
    setEditSuccess(null);
    setPersonalInfoModalVisible(true);
  };

  const handleSaveProfile = async () => {
    setEditError(null);
    setEditSuccess(null);

    const trimmedName = editName.trim();
    const trimmedTel = editTelefono.trim();

    if (!trimmedName || trimmedName.length < 2) {
      setEditError('El nombre completo es obligatorio (mínimo 2 caracteres).');
      return;
    }
    if (trimmedName.length > 100) {
      setEditError('El nombre no puede exceder 100 caracteres.');
      return;
    }

    if (trimmedTel) {
      const digitsOnly = trimmedTel.replace(/\D/g, '');
      const validCharsRegex = /^[+]?[\d\s-]+$/;
      if (!validCharsRegex.test(trimmedTel) || digitsOnly.length < 7 || digitsOnly.length > 15) {
        setEditError('El número de teléfono debe tener entre 7 y 15 dígitos.');
        return;
      }
    }

    setIsSaving(true);
    try {
      const response = await apiClient.put('/users/me', {
        name: trimmedName,
        telefono: trimmedTel || null,
      });

      if (response.data && response.data.success) {
        const updated = response.data.data;
        setProfileData(updated);

        if (updateUserRef.current) {
          await updateUserRef.current({
            name: updated.name,
            telefono: updated.telefono,
          } as any);
        }

        setEditSuccess('¡Perfil actualizado correctamente!');

        setTimeout(() => {
          setPersonalInfoModalVisible(false);
          setEditSuccess(null);
        }, 1200);
      } else {
        setEditError(response.data?.message || 'Error al guardar los cambios.');
      }
    } catch (err: any) {
      console.error('[PerfilScreen] Error al actualizar perfil:', err?.message || err);
      const msg = err?.response?.data?.message || 'No se pudo guardar la información en el servidor.';
      setEditError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const dynamicSections: { title: string; items: SettingItem[] }[] = [
    {
      title: 'Mi Cuenta',
      items: [
        { icon: 'person-outline', label: 'Información personal', description: `Tel: ${userPhone}`, type: 'arrow' },
        { icon: 'workspace-premium', label: 'Mi plan', description: `${userMembership} · Activo`, type: 'badge', badge: userMembership, badgeColor: Colors.primaryContainer },
        { icon: 'notifications-none', label: 'Notificaciones', type: 'toggle', value: notificationsEnabled },
        { icon: 'lock-outline', label: 'Seguridad', type: 'arrow' },
      ],
    },
    {
      title: 'FoodPass',
      items: [
        { icon: 'restaurant-menu', label: 'Preferencias de menú', type: 'arrow' },
        { icon: 'place', label: 'Mis sedes favoritas', type: 'arrow' },
        { icon: 'card-giftcard', label: 'Programa de puntos', type: 'badge', badge: `${userPoints} pts`, badgeColor: Colors.tertiaryContainer },
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

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>Mi Perfil</Text>
        <TouchableOpacity
          onPress={() => fetchProfile(true)}
          style={styles.refreshIconBtn}
          activeOpacity={0.7}
        >
          {isLoadingProfile ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <MaterialIcons name="refresh" size={22} color={Colors.primary} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => fetchProfile(true)}
            colors={[Colors.primaryContainer]}
            tintColor={Colors.primaryContainer}
          />
        }
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
            <Text style={styles.membershipText}>{userPlanText}</Text>
          </View>

          <View style={styles.profileStats}>
            <View style={styles.profileStat}>
              <Text style={styles.profileStatNumber}>
                {profileData?.pedidos_count !== undefined ? profileData.pedidos_count : 12}
              </Text>
              <Text style={styles.profileStatLabel}>PEDIDOS</Text>
            </View>
            <View style={styles.profileStatDivider} />
            <View style={styles.profileStat}>
              <Text style={styles.profileStatNumber}>{userPoints.toLocaleString()}</Text>
              <Text style={styles.profileStatLabel}>PUNTOS</Text>
            </View>
            <View style={styles.profileStatDivider} />
            <View style={styles.profileStat}>
              <Text style={[styles.profileStatNumber, { color: Colors.tertiary }]}>$1,450</Text>
              <Text style={styles.profileStatLabel}>AHORRADO</Text>
            </View>
          </View>
        </View>

        {dynamicSections.map((section) => (
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
                          onToggle={(val: boolean) => setNotificationsEnabled(val)}
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
                        handleOpenEditModal();
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
                      {item.description ? (
                        <Text style={styles.settingDescription}>{item.description}</Text>
                      ) : null}
                    </View>

                    {item.type === 'arrow' && (
                      <MaterialIcons name="arrow-forward-ios" size={14} color={Colors.onSurfaceVariant} />
                    )}
                    {item.type === 'badge' && item.badge ? (
                      <View style={[styles.settingBadge, { backgroundColor: item.badgeColor }]}>
                        <Text style={styles.settingBadgeText}>{item.badge}</Text>
                      </View>
                    ) : null}
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

        <View style={{ height: 28 }} />
      </ScrollView>

      {/* MODAL DE INFORMACIÓN PERSONAL (T11) */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={personalInfoModalVisible}
        onRequestClose={() => {
          if (!isSaving) setPersonalInfoModalVisible(false);
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.editModalContent}>
            <View style={styles.editModalHeader}>
              <View style={styles.editModalHeaderLeft}>
                <View style={styles.editIconWrap}>
                  <MaterialIcons name="person" size={22} color={Colors.primary} />
                </View>
                <Text style={styles.modalTitle}>Información Personal</Text>
              </View>
              <TouchableOpacity
                onPress={() => setPersonalInfoModalVisible(false)}
                disabled={isSaving}
                style={styles.modalCloseIcon}
              >
                <MaterialIcons name="close" size={22} color={Colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>

            <Text style={styles.editModalSubtitle}>
              Actualiza tus datos de contacto registrados en FoodPass.
            </Text>

            {editError ? (
              <View style={styles.alertBoxError}>
                <MaterialIcons name="error-outline" size={18} color={Colors.error} />
                <Text style={styles.alertTextError}>{editError}</Text>
              </View>
            ) : null}

            {editSuccess ? (
              <View style={styles.alertBoxSuccess}>
                <MaterialIcons name="check-circle" size={18} color={Colors.tertiary} />
                <Text style={styles.alertTextSuccess}>{editSuccess}</Text>
              </View>
            ) : null}

            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>NOMBRE COMPLETO *</Text>
              <View style={styles.inputWrap}>
                <MaterialIcons name="badge" size={20} color={Colors.onSurfaceVariant} style={styles.inputIcon} />
                <TextInput
                  style={styles.formInput}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Tu nombre y apellido"
                  placeholderTextColor="#999"
                  editable={!isSaving}
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>TELÉFONO DE CONTACTO</Text>
              <View style={styles.inputWrap}>
                <MaterialIcons name="phone" size={20} color={Colors.onSurfaceVariant} style={styles.inputIcon} />
                <TextInput
                  style={styles.formInput}
                  value={editTelefono}
                  onChangeText={setEditTelefono}
                  placeholder="Ej: +57 300 1234567"
                  placeholderTextColor="#999"
                  keyboardType="phone-pad"
                  editable={!isSaving}
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <View style={styles.fieldLabelRow}>
                <Text style={styles.inputLabel}>CORREO ELECTRÓNICO (PROTEGIDO)</Text>
                <MaterialIcons name="lock" size={12} color="#888" />
              </View>
              <View style={[styles.inputWrap, styles.inputDisabled]}>
                <MaterialIcons name="email" size={20} color="#888" style={styles.inputIcon} />
                <TextInput
                  style={[styles.formInput, { color: '#888' }]}
                  value={userEmail}
                  editable={false}
                />
              </View>
            </View>

            <View style={styles.editButtonsRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setPersonalInfoModalVisible(false)}
                disabled={isSaving}
              >
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSaveProfile}
                disabled={isSaving}
                activeOpacity={0.85}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <MaterialIcons name="save" size={18} color="#fff" />
                    <Text style={styles.saveBtnText}>Guardar</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal del chat de soporte */}
      <Modal visible={chatVisible} animationType="slide" onRequestClose={() => setChatVisible(false)}>
        <SoporteChatScreen onClose={() => setChatVisible(false)} />
      </Modal>

      {/* MODAL DE SEDES FAVORITAS */}
      <FavoriteLocationsModal visible={favModalVisible} onClose={() => setFavModalVisible(false)} />

      {/* MODAL PROGRAMA DE PUNTOS */}
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

            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setPointsModalVisible(false)}>
              <Text style={styles.modalCloseButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL PREFERENCIAS DE MENÚ */}
      <Modal
        animationType="slide"
        visible={menuPrefsVisible}
        onRequestClose={() => setMenuPrefsVisible(false)}
      >
        <View style={menuStyles.container}>
          <View style={menuStyles.header}>
            <TouchableOpacity onPress={() => setMenuPrefsVisible(false)} style={menuStyles.backBtn}>
              <MaterialIcons name="arrow-back-ios" size={20} color={Colors.primary} />
            </TouchableOpacity>
            <Text style={menuStyles.headerTitle}>Preferencias de Menú</Text>
            <View style={{ width: 44 }} />
          </View>

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
                      addItem(selectedMenuItem as any);
                      setSelectedMenuItem(null);
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
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(255,255,255,0.85)',
    elevation: 3,
  },
  topBarTitle: { fontSize: 20, fontWeight: '800', color: Colors.onBackground, letterSpacing: -0.3 },
  refreshIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.surfaceContainerLow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: { flex: 1 },
  profileCard: {
    margin: 20,
    backgroundColor: Colors.inverseSurface,
    borderRadius: BorderRadius.xxxl,
    padding: 28,
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    position: 'relative',
  },
  avatarText: { fontSize: 28, fontWeight: '800', color: Colors.onPrimaryContainer },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: 12,
    padding: 2,
  },
  profileName: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 4 },
  profileEmail: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 14 },
  membershipChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primaryContainer,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    marginBottom: 24,
  },
  membershipText: { fontSize: 12, fontWeight: '700', color: Colors.onPrimaryContainer },
  profileStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: BorderRadius.xl,
    padding: 16,
    width: '100%',
    justifyContent: 'space-around',
  },
  profileStat: { alignItems: 'center' },
  profileStatNumber: { fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  profileStatLabel: { fontSize: 8, fontWeight: '700', color: 'rgba(255,255,255,0.5)', letterSpacing: 1, marginTop: 2 },
  profileStatDivider: { width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.15)' },
  settingsSection: { marginBottom: 8, paddingHorizontal: 20 },
  settingsSectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
    letterSpacing: 1.5,
    marginBottom: 8,
    paddingLeft: 4,
  },
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
  editModalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    padding: 24,
    paddingBottom: 40,
  },
  editModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  editModalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  editIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseIcon: {
    padding: 4,
  },
  editModalSubtitle: {
    fontSize: 13,
    color: Colors.onSurfaceVariant,
    marginBottom: 20,
  },
  alertBoxError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: BorderRadius.lg,
    marginBottom: 16,
  },
  alertTextError: {
    color: Colors.error,
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  alertBoxSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#e8f5e9',
    padding: 12,
    borderRadius: BorderRadius.lg,
    marginBottom: 16,
  },
  alertTextSuccess: {
    color: '#2e7d32',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  formGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.onSurface,
    marginBottom: 6,
    letterSpacing: 1,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainer,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    paddingHorizontal: 12,
  },
  inputDisabled: {
    backgroundColor: Colors.surfaceContainerLow,
    opacity: 0.7,
  },
  inputIcon: {
    marginRight: 8,
  },
  formInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: Colors.onSurface,
  },
  editButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.surfaceContainerLow,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.onSurfaceVariant,
  },
  saveBtn: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 14,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.onSurface,
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