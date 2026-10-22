import { useState } from 'react';
import { StyleSheet, Switch, View } from 'react-native';

import { InsigniaPermiso } from '@/components/insignias-estado';
import { ThemedText } from '@/components/themed-text';
import { Boton } from '@/components/ui/boton';
import { Pantalla } from '@/components/ui/pantalla';
import { Tarjeta } from '@/components/ui/tarjeta';
import { Spacing } from '@/constants/theme';
import { usePermiso } from '@/hooks/usePermiso';
import { INFO_RECURSOS } from '@/lib/permisos';
import { pedirConPrevia } from '@/lib/previa';
import { cambiarAvisarAlResolver, useAvisarAlResolver } from '@/lib/reportes';

/** El permiso de notificaciones se pide ÚNICAMENTE al activar este interruptor. */
export default function AjustesApp() {
  const avisar = useAvisarAlResolver();
  const { estado, parcial, matiz, abrirAjustes, consultar } = usePermiso('notificaciones');
  const [pidiendo, setPidiendo] = useState(false);

  async function cambiar(valor: boolean) {
    if (!valor) {
      cambiarAvisarAlResolver(false);
      return;
    }
    setPidiendo(true);
    const concedido = await pedirConPrevia('notificaciones');
    setPidiendo(false);
    consultar();
    cambiarAvisarAlResolver(concedido);
  }

  const activo = avisar && estado === 'concedido';

  return (
    <Pantalla>
      <Tarjeta>
        <View style={styles.fila}>
          <ThemedText style={styles.flex}>Avisarme cuando se resuelva mi reporte</ThemedText>
          <Switch
            accessibilityLabel="Avisarme cuando se resuelva mi reporte"
            value={activo}
            disabled={pidiendo}
            onValueChange={cambiar}
          />
        </View>
        <View style={styles.fila}>
          <ThemedText type="small" themeColor="textSecondary" style={styles.flex}>
            Permiso de notificaciones
          </ThemedText>
          <InsigniaPermiso estado={estado} parcial={parcial} />
        </View>
        {matiz && (
          <ThemedText type="small" themeColor="warning">
            {matiz}
          </ThemedText>
        )}
      </Tarjeta>

      {avisar && estado !== 'concedido' && estado !== 'cargando' && (
        <Tarjeta>
          <ThemedText type="small">
            Las notificaciones están desactivadas en el sistema. {INFO_RECURSOS.notificaciones.alternativa}
          </ThemedText>
          {estado === 'bloqueado' && <Boton titulo="Abrir Ajustes" variante="secundario" onPress={abrirAjustes} />}
        </Tarjeta>
      )}

      {!avisar && (
        <ThemedText type="small" themeColor="textSecondary">
          Aunque no actives las notificaciones, los avisos te quedan en la pestaña Avisos.
        </ThemedText>
      )}
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
