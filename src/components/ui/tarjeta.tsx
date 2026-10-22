import type { ReactNode } from 'react';
import { StyleSheet, type ViewStyle } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export function Tarjeta({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return (
    <ThemedView type="backgroundElement" style={[styles.tarjeta, style]}>
      {children}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  tarjeta: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.two,
  },
});
