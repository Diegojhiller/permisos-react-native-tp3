import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type SelectorChipsProps<T extends string> = {
  opciones: readonly T[];
  valor: T | undefined;
  onCambiar: (valor: T) => void;
};

/** Grupo de opciones de selección única. */
export function SelectorChips<T extends string>({ opciones, valor, onCambiar }: SelectorChipsProps<T>) {
  const theme = useTheme();
  return (
    <View style={styles.fila} accessibilityRole="radiogroup">
      {opciones.map((opcion) => {
        const elegido = opcion === valor;
        return (
          <Pressable
            key={opcion}
            accessibilityRole="radio"
            accessibilityState={{ selected: elegido }}
            onPress={() => onCambiar(opcion)}
            style={[
              styles.chip,
              { backgroundColor: elegido ? theme.primary : theme.backgroundElement },
            ]}>
            <ThemedText type="small" style={{ color: elegido ? theme.onPrimary : theme.text }}>
              {opcion.charAt(0).toUpperCase() + opcion.slice(1)}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  fila: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chip: {
    minHeight: 40,
    justifyContent: 'center',
    borderRadius: Spacing.four,
    paddingHorizontal: Spacing.three,
  },
});
