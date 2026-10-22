import { Link, router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { InsigniaReporte } from '@/components/insignias-estado';
import { ThemedText } from '@/components/themed-text';
import { Boton } from '@/components/ui/boton';
import { Pantalla } from '@/components/ui/pantalla';
import { Tarjeta } from '@/components/ui/tarjeta';
import { Spacing } from '@/constants/theme';
import { useReportes } from '@/lib/reportes';

export default function Inicio() {
  const reportes = useReportes();

  return (
    <Pantalla enTab>
      <View style={styles.encabezado}>
        <ThemedText type="subtitle">Mis reportes</ThemedText>
        <Link href="/ajustes-app" asChild>
          <Pressable accessibilityRole="link" hitSlop={Spacing.two}>
            <ThemedText type="linkPrimary">Ajustes</ThemedText>
          </Pressable>
        </Link>
      </View>

      <Boton titulo="Nuevo reporte" onPress={() => router.push('/reporte/nuevo')} />

      {reportes.length === 0 ? (
        <Tarjeta>
          <ThemedText type="smallBold">Todavía no reportaste nada</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            ¿Viste una luz quemada, una canilla que pierde o un proyector roto? Tocá “Nuevo reporte”.
          </ThemedText>
        </Tarjeta>
      ) : (
        reportes.map((reporte) => (
          <Link key={reporte.id} href={`/reporte/${reporte.id}`} asChild>
            <Pressable accessibilityRole="button">
              <Tarjeta>
                <View style={styles.fila}>
                  <ThemedText type="smallBold" style={styles.titulo} numberOfLines={1}>
                    {reporte.titulo}
                  </ThemedText>
                  <InsigniaReporte estado={reporte.estado} />
                </View>
                <ThemedText type="small" themeColor="textSecondary">
                  {[reporte.categoria, reporte.aula || reporte.ubicacion?.sector].filter(Boolean).join(' · ')}
                </ThemedText>
              </Tarjeta>
            </Pressable>
          </Link>
        ))
      )}
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  encabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  titulo: {
    flex: 1,
  },
});
