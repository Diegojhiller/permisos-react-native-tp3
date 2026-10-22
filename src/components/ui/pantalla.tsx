import type { ReactNode } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type PantallaProps = {
  children: ReactNode;
  /** Las pantallas de tabs no tienen header: hay que respetar la zona segura de arriba y la barra de abajo. */
  enTab?: boolean;
};

export function Pantalla({ children, enTab }: PantallaProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[
        styles.contenido,
        {
          paddingTop: enTab ? insets.top + Spacing.three : Spacing.three,
          paddingBottom: insets.bottom + Spacing.four + (enTab ? BottomTabInset : 0),
        },
      ]}>
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contenido: {
    paddingHorizontal: Spacing.three,
    gap: Spacing.three,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
});
