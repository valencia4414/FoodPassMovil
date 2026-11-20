// src/screens/SoporteChatScreen.tsx
//
// Chat de soporte — se abre como Modal desde PerfilScreen.
// Sin imports de ChatBubble/ChatInput para evitar problemas de rutas en Windows/Web.

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Animated,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, BorderRadius } from '../theme/colors';

// ─────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────
type Mensaje = {
  id: string;
  texto: string;
  hora: string;
  esPropio: boolean;
};

type OpcionRapida = {
  id: string;
  label: string;
  respuesta: string;
};

// ─────────────────────────────────────────────
// Respuestas del bot
// ─────────────────────────────────────────────
const RESPUESTAS_BOT: Record<string, string> = {
  default:
    'Gracias por tu mensaje. Un agente de soporte revisará tu caso en breve. ¿Hay algo más en lo que pueda ayudarte?',
  reembolso:
    'Para procesar un reembolso necesitamos: número de pedido, fecha de compra y motivo. Los reembolsos se procesan en 3 a 5 días hábiles a tu método de pago original.',
  plan:
    'Tu plan te da acceso al menú diario y beneficios exclusivos en sedes participantes.',
  contrasena:
    'Para restablecer tu contraseña ve a Inicio de sesión → "¿Olvidaste tu contraseña?" e ingresa tu correo. Recibirás un enlace en menos de 5 minutos.',
  pedido:
    'Puedo ayudarte con el estado de tu pedido. Por favor indícame el número de pedido (lo encuentras en tu historial) y lo verifico de inmediato.',
};

const OPCIONES_RAPIDAS: OpcionRapida[] = [
  { id: 'reembolso',  label: '💳 Solicitar reembolso',          respuesta: 'reembolso' },
  { id: 'plan',       label: '⭐ Dudas sobre mi plan',           respuesta: 'plan' },
  { id: 'contrasena', label: '🔑 Problema con contraseña',       respuesta: 'contrasena' },
  { id: 'pedido',     label: '📦 Estado de mi pedido',           respuesta: 'pedido' },
];

const horaActual = () => {
  const now = new Date();
  return now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
};

const SALUDO_INICIAL: Mensaje = {
  id: 'bot-0',
  texto:
    '¡Hola! Soy el asistente virtual de FoodPass 🍽️\n\nEstoy aquí para ayudarte con cualquier duda sobre tu cuenta, pedidos o beneficios. Selecciona una opción rápida o escríbeme directamente.',
  hora: horaActual(),
  esPropio: false,
};

// ─────────────────────────────────────────────
// Burbuja de mensaje (inline, sin import externo)
// ─────────────────────────────────────────────
function Burbuja({ mensaje }: { mensaje: Mensaje }) {
  return (
    <View style={[bubbleStyles.fila, mensaje.esPropio && bubbleStyles.filaPropia]}>
      {!mensaje.esPropio && (
        <View style={bubbleStyles.avatar}>
          <MaterialIcons name="support-agent" size={14} color="#fff" />
        </View>
      )}
      <View style={bubbleStyles.grupo}>
        <View style={[bubbleStyles.burbuja, mensaje.esPropio ? bubbleStyles.burbujaPropia : bubbleStyles.burbujaBot]}>
          <Text style={[bubbleStyles.texto, mensaje.esPropio && bubbleStyles.textoPropio]}>
            {mensaje.texto}
          </Text>
        </View>
        <Text style={[bubbleStyles.hora, mensaje.esPropio && bubbleStyles.horaPropia]}>
          {mensaje.hora}
        </Text>
      </View>
    </View>
  );
}

const bubbleStyles = StyleSheet.create({
  fila: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  filaPropia: { flexDirection: 'row-reverse' },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  grupo: { maxWidth: '75%', gap: 4 },
  burbuja: { padding: 14, borderRadius: BorderRadius.xxl },
  burbujaBot: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderBottomLeftRadius: 4,
  },
  burbujaPropia: {
    backgroundColor: Colors.primaryContainer,
    borderBottomRightRadius: 4,
  },
  texto: { fontSize: 14, color: Colors.onSurface, lineHeight: 20 },
  textoPropio: { color: Colors.onPrimaryContainer },
  hora: { fontSize: 10, color: Colors.onSurfaceVariant, marginLeft: 4 },
  horaPropia: { textAlign: 'right', marginRight: 4 },
});

// ─────────────────────────────────────────────
// Input de chat (inline, sin import externo)
// ─────────────────────────────────────────────
function InputChat({ onSend }: { onSend: (text: string) => void }) {
  const [texto, setTexto] = useState('');

  const enviar = () => {
    if (texto.trim().length === 0) return;
    onSend(texto.trim());
    setTexto('');
  };

  return (
    <View style={inputStyles.contenedor}>
      <View style={inputStyles.wrap}>
        <TextInput
          style={inputStyles.input}
          value={texto}
          onChangeText={setTexto}
          placeholder="Escribe tu consulta..."
          placeholderTextColor={Colors.onSurfaceVariant + '80'}
          multiline
          maxLength={500}
        />
      </View>
      <TouchableOpacity
        style={[inputStyles.boton, texto.trim().length === 0 && inputStyles.botonDeshabilitado]}
        onPress={enviar}
        disabled={texto.trim().length === 0}
        activeOpacity={0.8}
      >
        <MaterialIcons name="send" size={20} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const inputStyles = StyleSheet.create({
  contenedor: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    padding: 12,
    backgroundColor: Colors.surfaceContainerLowest,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceContainerLow,
  },
  wrap: {
    flex: 1,
    backgroundColor: Colors.surfaceContainer,
    borderRadius: BorderRadius.xxl,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 120,
  },
  input: { fontSize: 14, color: Colors.onSurface, lineHeight: 20 },
  boton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  botonDeshabilitado: { backgroundColor: Colors.surfaceContainerHigh },
});

// ─────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────
interface Props {
  onClose: () => void;
}

export default function SoporteChatScreen({ onClose }: Props) {
  const [mensajes, setMensajes] = useState<Mensaje[]>([SALUDO_INICIAL]);
  const [mostrarOpciones, setMostrarOpciones] = useState(true);
  const [botEscribiendo, setBotEscribiendo] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const dotAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (botEscribiendo) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(dotAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
          Animated.timing(dotAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
        ])
      ).start();
    } else {
      dotAnim.setValue(0);
    }
  }, [botEscribiendo]);

  const agregarMensaje = (texto: string, esPropio: boolean) => {
    const nuevo: Mensaje = {
      id: Date.now().toString(),
      texto,
      hora: horaActual(),
      esPropio,
    };
    setMensajes((prev) => [...prev, nuevo]);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const responderBot = (clave: string) => {
    setBotEscribiendo(true);
    const delay = 1200 + Math.random() * 800;
    setTimeout(() => {
      setBotEscribiendo(false);
      agregarMensaje(RESPUESTAS_BOT[clave] || RESPUESTAS_BOT['default'], false);
    }, delay);
  };

  const manejarEnvio = (texto: string) => {
    agregarMensaje(texto, true);
    setMostrarOpciones(false);
    responderBot('default');
  };

  const manejarOpcion = (op: OpcionRapida) => {
    agregarMensaje(op.label, true);
    setMostrarOpciones(false);
    responderBot(op.respuesta);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onClose} activeOpacity={0.7}>
          <MaterialIcons name="arrow-back-ios" size={18} color={Colors.primary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.botAvatar}>
            <MaterialIcons name="support-agent" size={20} color="#fff" />
            <View style={styles.onlineDot} />
          </View>
          <View>
            <Text style={styles.headerTitle}>Soporte FoodPass</Text>
            <Text style={styles.headerSub}>
              {botEscribiendo ? 'Escribiendo...' : 'En línea · Respuesta inmediata'}
            </Text>
          </View>
        </View>
        <View style={styles.ticketBadge}>
          <Text style={styles.ticketText}>#4821</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FlatList
          ref={flatListRef}
          data={mensajes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.lista}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => <Burbuja mensaje={item} />}
          ListFooterComponent={
            <>
              {/* Indicador escribiendo */}
              {botEscribiendo && (
                <View style={styles.typingRow}>
                  <View style={styles.botAvatarSmall}>
                    <MaterialIcons name="support-agent" size={14} color="#fff" />
                  </View>
                  <View style={styles.typingBubble}>
                    <View style={styles.dots}>
                      {[0, 1, 2].map((i) => (
                        <Animated.View
                          key={i}
                          style={[
                            styles.dot,
                            {
                              opacity: dotAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: i === 1 ? [1, 0.3] : [0.3, 1],
                              }),
                            },
                          ]}
                        />
                      ))}
                    </View>
                  </View>
                </View>
              )}

              {/* Opciones rápidas */}
              {mostrarOpciones && !botEscribiendo && (
                <View style={styles.opcionesWrap}>
                  <Text style={styles.opcionesTitulo}>Temas frecuentes</Text>
                  {OPCIONES_RAPIDAS.map((op) => (
                    <TouchableOpacity
                      key={op.id}
                      style={styles.opcionBtn}
                      onPress={() => manejarOpcion(op)}
                      activeOpacity={0.75}
                    >
                      <Text style={styles.opcionTexto}>{op.label}</Text>
                      <MaterialIcons name="arrow-forward-ios" size={12} color={Colors.primary} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </>
          }
        />

        <InputChat onSend={manejarEnvio} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.surface },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.9)',
    shadowColor: '#121f05',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    gap: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceContainerLow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  botAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.tertiaryContainer,
    borderWidth: 2,
    borderColor: '#fff',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.onBackground,
    letterSpacing: -0.2,
  },
  headerSub: { fontSize: 11, color: Colors.onSurfaceVariant, marginTop: 1 },
  ticketBadge: {
    backgroundColor: Colors.surfaceContainerLow,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  ticketText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  lista: { paddingTop: 16, paddingBottom: 8 },
  typingRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  botAvatarSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typingBubble: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xxl,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dots: { flexDirection: 'row', gap: 5, alignItems: 'center' },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.onSurfaceVariant,
  },
  opcionesWrap: { marginHorizontal: 16, marginTop: 4, marginBottom: 8 },
  opcionesTitulo: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
    letterSpacing: 1.5,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  opcionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: 16,
    paddingVertical: 13,
    marginBottom: 8,
    shadowColor: '#121f05',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  opcionTexto: { fontSize: 13, fontWeight: '600', color: Colors.onSurface },
});
