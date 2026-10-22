import * as Device from 'expo-device';
import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { InsigniaPermiso } from '@/components/insignias-estado';
import { ThemedText } from '@/components/themed-text';
import { Boton } from '@/components/ui/boton';
import { Insignia } from '@/components/ui/insignia';
import { Pantalla } from '@/components/ui/pantalla';
import { Tarjeta } from '@/components/ui/tarjeta';
import { Spacing } from '@/constants/theme';
import { usePermiso } from '@/hooks/usePermiso';
import { INFO_RECURSOS, RECURSOS, type Recurso } from '@/lib/permisos';

/** Panel de permisos. Se actualiza al volver de Ajustes (AppState) y al volver a esta pestaña. */
export default function Permisos() {
  return (
    <Pantalla enTab>
      <ThemedText type="subtitle">Permisos</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        Plataforma: {Platform.OS} {Platform.Version}
        {Device.isDevice ? '' : ' (emulador)'}
      </ThemedText>

      {RECURSOS.map((recurso) => (
        <FilaPermiso key={recurso} recurso={recurso} />
      ))}

      <Tarjeta>
        <View style={styles.fila}>
          <ThemedText type="smallBold" style={styles.nombre}>
            🖼️ Fotos (galería)
          </ThemedText>
          <Insignia texto="no se pide" color="textSecondary" />
        </View>
        <ThemedText type="small" themeColor="textSecondary">
          Para elegir fotos usamos el selector del sistema, que no necesita permiso de galería.
        </ThemedText>
      </Tarjeta>
    </Pantalla>
  );
}

function FilaPermiso({ recurso }: { recurso: Recurso }) {
  const { estado, parcial, matiz, abrirAjustes, consultar } = usePermiso(recurso);
  const info = INFO_RECURSOS[recurso];

  // Al volver del modal de pantalla previa, la pestaña recupera el foco: releemos el estado.
  useFocusEffect(
    useCallback(() => {
      consultar();
    }, [consultar]),
  );

  return (
    <Tarjeta>
      <View style={styles.fila}>
        <ThemedText type="smallBold" style={styles.nombre}>
          {info.icono} {info.nombre}
        </ThemedText>
        <InsigniaPermiso estado={estado} parcial={parcial} />
      </View>

      {matiz && (
        <ThemedText type="small" themeColor="warning">
          {matiz}
        </ThemedText>
      )}

      {estado === 'preguntable' && (
        <Boton
          titulo="Pedir permiso"
          variante="secundario"
          onPress={() => router.push({ pathname: '/permisos/[recurso]', params: { recurso } })}
        />
      )}
      {estado === 'bloqueado' && (
        <Boton titulo="Abrir Ajustes" variante="secundario" onPress={abrirAjustes} />
      )}
    </Tarjeta>
  );
}

const styles = StyleSheet.create({
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  nombre: {
    flex: 1,
  },
});
