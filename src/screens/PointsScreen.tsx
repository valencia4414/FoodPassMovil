// src/screens/PointsScreen.tsx

import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { View, Text, FlatList, StyleSheet, SafeAreaView, StatusBar, TouchableOpacity } from 'react-native';
import { COLORS } from '../styles/colors';
import PointsCard from '../components/PointsCard';
import RewardItem from '../components/RewardItem';
import { rewardsData } from '../data/rewards';

const PointsScreen = () => {
  const navigation = useNavigation<any>();
  // Simulamos los puntos del usuario. Más tarde esto vendrá de una base de datos.
  const userPoints = 1250;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.dark} />
      
      {/* Encabezado superior */}
      <View style={styles.header}>
        <TouchableOpacity style={{ marginRight: 12 }} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mis Puntos</Text>
      </View>

      {/* Tarjeta de puntos (se superpone al encabezado) */}
      <PointsCard points={userPoints} />

      {/* Sección de la lista de recompensas */}
      <View style={styles.rewardsSection}>
        <Text style={styles.sectionTitle}>Canjea tus puntos</Text>
        <FlatList
          data={rewardsData}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <RewardItem reward={item} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
  },
  header: {
    backgroundColor: COLORS.dark,
    paddingVertical: 20,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.white,
    textAlign: 'center',
  },
  rewardsSection: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 12,
  },
  listContent: {
    paddingBottom: 30,
  },
});

export default PointsScreen;