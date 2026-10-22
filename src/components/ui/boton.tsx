import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type BotonProps = {
  titulo: string;
  onPress: () => void;
  variante?: 'primario' | 'secundario';
  deshabilitado?: boolean;
  cargando?: boolean;
};

export function Boton({ titulo, onPress, variante = 'primario', deshabilitado, cargando }: BotonProps) {
  const theme = useTheme();
  const primario = variante === 'primario';
  const inactivo = deshabilitado || cargando;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inactivo }}
      disabled={inactivo}
      onPress={onPress}
      style={({ pressed }) => [
        styles.boton,
        { backgroundColor: primario ? theme.primary : theme.backgroundElement },
        pressed && styles.presionado,
        inactivo && styles.inactivo,
      ]}>
      {cargando ? (
        <ActivityIndicator color={primario ? theme.onPrimary : theme.text} />
      ) : (
        <ThemedText style={[styles.texto, { color: primario ? theme.onPrimary : theme.primary }]}>
          {titulo}
        </ThemedText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  boton: {
    minHeight: 48,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texto: {
    fontWeight: 600,
    textAlign: 'center',
  },
  presionado: {
    opacity: 0.75,
  },
  inactivo: {
    opacity: 0.45,
  },
});
