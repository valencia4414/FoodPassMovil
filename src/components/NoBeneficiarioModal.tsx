import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, BorderRadius } from '../theme/colors';

type Props = {
    visible: boolean;
    onBack: () => void;
};

export default function NoBeneficiarioModal({ visible, onBack }: Props) {
    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onBack}>
            <View style={styles.overlay}>
                <View style={styles.card}>
                    <MaterialIcons name="block" size={48} color={Colors.primary} />
                    <Text style={styles.title}>No haces parte del beneficio</Text>
                    <Text style={styles.text}>
                        Tu cédula no está registrada como beneficiario, por lo que no puedes acceder a la aplicación.
                    </Text>
                    <TouchableOpacity onPress={onBack} activeOpacity={0.9} style={styles.buttonWrapper}>
                        <LinearGradient
                            colors={[Colors.primaryContainer, Colors.primary]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.button}
                        >
                            <Text style={styles.buttonText}>Atrás</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.55)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    card: {
        width: '100%',
        backgroundColor: Colors.surfaceContainerLowest,
        borderRadius: BorderRadius.xxxl,
        padding: 28,
        alignItems: 'center',
    },
    title: {
        fontSize: 20,
        fontWeight: '800',
        color: Colors.onSurface,
        textAlign: 'center',
        marginTop: 12,
    },
    text: {
        fontSize: 14,
        color: Colors.onSurfaceVariant,
        textAlign: 'center',
        marginTop: 8,
        lineHeight: 20,
    },
    buttonWrapper: {
        alignSelf: 'stretch',
        marginTop: 24,
        borderRadius: BorderRadius.xl,
        overflow: 'hidden',
    },
    button: {
        paddingVertical: 14,
        alignItems: 'center',
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.onPrimaryContainer,
    },
});