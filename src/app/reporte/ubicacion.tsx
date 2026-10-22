import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { InsigniaPermiso } from '@/components/insignias-estado';
import { ThemedText } from '@/components/themed-text';
import { Boton } from '@/components/ui/boton';
import { Pantalla } from '@/components/ui/pantalla';
import { SelectorChips } from '@/components/ui/selector-chips';
import { Tarjeta } from '@/components/ui/tarjeta';
import { Spacing } from '@/constants/theme';
import { usePermiso } from '@/hooks/usePermiso';
import { describirUbicacion } from '@/lib/formato';
import { INFO_RECURSOS } from '@/lib/permisos';
import { pedirConPrevia } from '@/lib/previa';
import { actualizarBorrador, useBorrador } from '@/lib/reportes';
import { obtenerUbicacion, SECTORES } from '@/lib/ubicacion';

/**
 * Marca dónde está el problema. Ubicación SOLO en primer plano y solo al tocar el botón.
 * El sector elegido a mano funciona siempre, con o sin permiso.
 */
export default function Ubicacion() {
  const { ubicacion } = useBorrador();
  const { estado, parcial, consultar } = usePermiso('ubicacion');
  const [buscando, setBuscando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);

  async function usarMiUbicacion() {
    setMensaje(null);
    const concedido = await pedirConPrevia('ubicacion');
    consultar();
    if (!concedido) {
      setMensaje(`Sin permiso de ubicación. ${INFO_RECURSOS.ubicacion.alternativa}`);
      return;
    }

    setBuscando(true);
    const gps = await obtenerUbicacion();
    setBuscando(false);
    if (!gps) {
      setMensaje('No pudimos obtener tu ubicación. Elegí el sector a mano.');
      return;
    }
    actualizarBorrador({ ubicacion: { ...ubicacion, gps } });
  }

  return (
    <Pantalla>
      <Tarjeta>
        <View style={styles.fila}>
          <ThemedText type="smallBold" style={styles.flex}>
            📍 Mi ubicación actual
          </ThemedText>
          <InsigniaPermiso estado={estado} parcial={parcial} />
        </View>
        <ThemedText type="small" themeColor="textSecondary">
          {describirUbicacion(ubicacion?.gps ? { gps: ubicacion.gps } : undefined) ?? 'Sin marcar'}
        </ThemedText>
        <Boton titulo="Usar mi ubicación actual" onPress={usarMiUbicacion} cargando={buscando} />
        {mensaje && (
          <ThemedText type="small" themeColor="warning">
            {mensaje}
          </ThemedText>
        )}
      </Tarjeta>

      <Tarjeta>
        <ThemedText type="smallBold">Sector</ThemedText>
        <SelectorChips
          opciones={SECTORES}
          valor={ubicacion?.sector as (typeof SECTORES)[number] | undefined}
          onCambiar={(sector) => actualizarBorrador({ ubicacion: { ...ubicacion, sector } })}
        />
      </Tarjeta>

      <Boton
        titulo="Listo"
        deshabilitado={!ubicacion?.sector && !ubicacion?.gps}
        onPress={() => router.back()}
      />
    </Pantalla>
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
});
