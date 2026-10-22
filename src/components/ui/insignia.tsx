import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type InsigniaProps = {
  texto: string;
  color: Extract<ThemeColor, 'primary' | 'success' | 'warning' | 'danger' | 'textSecondary'>;
};

/** Etiqueta chica de color para estados (reporte o permiso). */
export function Insignia({ texto, color }: InsigniaProps) {
  const theme = useTheme();
  return (
    <View style={[styles.insignia, { borderColor: theme[color] }]}>
      <ThemedText type="smallBold" style={{ color: theme[color] }}>
        {texto}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  insignia: {
    alignSelf: 'flex-start',
    borderWidth: 1.5,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
  },
});
