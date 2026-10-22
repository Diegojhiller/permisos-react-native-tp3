import { Platform, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Boton } from '@/components/ui/boton';
import { Tarjeta } from '@/components/ui/tarjeta';
import { Spacing } from '@/constants/theme';
import { INFO_RECURSOS, rutaAjustes, type Recurso } from '@/lib/permisos';

type PantallaPreviaProps = {
  recurso: Recurso;
  bloqueado: boolean;
  onContinuar: () => void;
  onAbrirAjustes: () => void;
};

/**
 * Explicación previa al diálogo del sistema.
 * Un único botón: "Continuar" si todavía se puede preguntar, "Abrir Ajustes" si está bloqueado.
 * Sin "Ahora no" ni "Cerrar" (pauta 5.1.1(iv) de Apple).
 */
export function PantallaPrevia({ recurso, bloqueado, onContinuar, onAbrirAjustes }: PantallaPreviaProps) {
  const info = INFO_RECURSOS[recurso];

  return (
    <Tarjeta style={styles.tarjeta}>
      <ThemedText style={styles.icono} accessibilityElementsHidden>
        {info.icono}
      </ThemedText>

      {bloqueado ? (
        <>
          <ThemedText type="smallBold" style={styles.centrado}>
            {info.nombre}: desactivado
          </ThemedText>
          <ThemedText style={styles.centrado}>
            Lo desactivaste antes y el sistema ya no nos deja volver a preguntarte. Si querés usarlo,
            activalo desde Ajustes:
          </ThemedText>
          <View style={styles.ruta}>
            <ThemedText type="code">{rutaAjustes(recurso)}</ThemedText>
          </View>
          <Boton titulo="Abrir Ajustes" onPress={onAbrirAjustes} />
        </>
      ) : (
        <>
          <ThemedText type="smallBold" style={styles.centrado}>
            {info.nombre}
          </ThemedText>
          <ThemedText style={styles.centrado}>{info.beneficio}</ThemedText>
          <Boton titulo="Continuar" onPress={onContinuar} />
        </>
      )}

      <ThemedText type="small" themeColor="textSecondary" style={styles.centrado}>
        {bloqueado
          ? info.alternativa
          : `Podés cambiarlo cuando quieras en Ajustes de ${Platform.OS === 'ios' ? 'iOS' : 'Android'}.`}
      </ThemedText>
    </Tarjeta>
  );
}

const styles = StyleSheet.create({
  tarjeta: {
    gap: Spacing.three,
    paddingVertical: Spacing.four,
  },
  icono: {
    fontSize: 48,
    lineHeight: 60,
    textAlign: 'center',
  },
  centrado: {
    textAlign: 'center',
  },
  ruta: {
    padding: Spacing.two,
  },
});
