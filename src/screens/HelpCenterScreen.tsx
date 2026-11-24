import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import Header from '../components/shared/Header';
import HelpCenter from '../components/HelpCenter';

import { Colors } from '../theme/colors';

export default function HelpCenterScreen() {
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['top']}
    >
      <Header
        title="Centro de Ayuda"
        showBack
        onBack={() => {
          if (navigation.canGoBack()) {
            navigation.goBack();
          } else {
            navigation.navigate('Perfil');
          }
        }}
      />

      <HelpCenter />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
});