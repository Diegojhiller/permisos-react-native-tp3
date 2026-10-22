import { Image } from 'expo-image';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { InsigniaReporte } from '@/components/insignias-estado';
import { ThemedText } from '@/components/themed-text';
import { Boton } from '@/components/ui/boton';
import { Pantalla } from '@/components/ui/pantalla';
import { Tarjeta } from '@/components/ui/tarjeta';
import { Spacing } from '@/constants/theme';
import { describirUbicacion } from '@/lib/formato';
import { SEGUNDOS_SIMULACION, simularResolucion, useReporte } from '@/lib/reportes';

export default function DetalleReporte() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const reporte = useReporte(typeof id === 'string' ? id : undefined);
  const [resultado, setResultado] = useState<string | null>(null);

  if (!reporte) {
    return (
      <Pantalla>
        <Stack.Screen options={{ title: 'No encontrado' }} />
        <Tarjeta>
          <ThemedText type="smallBold">No existe el reporte “{id}”.</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Puede que el enlace esté mal o que el reporte se haya borrado al cerrar la app.
          </ThemedText>
          <Boton titulo="Ir a mis reportes" onPress={() => router.dismissTo('/')} />
        </Tarjeta>
      </Pantalla>
    );
  }

  async function simular() {
    const notificado = await simularResolucion(reporte!.id);
    setResultado(
      notificado
        ? `En ${SEGUNDOS_SIMULACION} segundos te llega una notificación (y el aviso queda en Avisos).`
        : `En ${SEGUNDOS_SIMULACION} segundos el aviso aparece en la pestaña Avisos. Para recibir además una notificación, activala en Ajustes.`,
    );
  }

  return (
    <Pantalla>
      <View style={styles.fila}>
        <ThemedText type="subtitle" style={styles.flex}>
          {reporte.titulo}
        </ThemedText>
        <InsigniaReporte estado={reporte.estado} />
      </View>

      {reporte.fotoUri && <Image source={{ uri: reporte.fotoUri }} style={styles.foto} contentFit="cover" />}

      <Tarjeta>
        <Dato etiqueta="Categoría" valor={reporte.categoria} />
        <Dato etiqueta="Aula" valor={reporte.aula || '—'} />
        <Dato etiqueta="Ubicación" valor={describirUbicacion(reporte.ubicacion) ?? '—'} />
        <Dato etiqueta="Creado" valor={new Date(reporte.creado).toLocaleString()} />
        {reporte.descripcion ? <Dato etiqueta="Descripción" valor={reporte.descripcion} /> : null}
      </Tarjeta>

      <Boton
        titulo="Simular resolución"
        variante="secundario"
        deshabilitado={reporte.estado !== 'pendiente'}
        onPress={simular}
      />
      {resultado && reporte.estado !== 'resuelto' && (
        <ThemedText type="small" themeColor="textSecondary" accessibilityLiveRegion="polite">
          {resultado}
        </ThemedText>
      )}
    </Pantalla>
  );
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <View>
      <ThemedText type="small" themeColor="textSecondary">
        {etiqueta}
      </ThemedText>
      <ThemedText>{valor}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  flex: {
    flex: 1,
  },
  foto: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: Spacing.three,
  },
});
