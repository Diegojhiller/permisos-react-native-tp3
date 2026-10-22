import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { PantallaPrevia } from '@/components/pantalla-previa';
import { ThemedText } from '@/components/themed-text';
import { Boton } from '@/components/ui/boton';
import { CampoTexto } from '@/components/ui/campo-texto';
import { Pantalla } from '@/components/ui/pantalla';
import { Tarjeta } from '@/components/ui/tarjeta';
import { Spacing } from '@/constants/theme';
import { useRevisarAlVolver } from '@/hooks/useRevisarAlVolver';
import { abrirAjustes, aEstado } from '@/lib/permisos';
import { actualizarBorrador, useBorrador } from '@/lib/reportes';

/**
 * Escáner del QR del aula con los cuatro estados:
 * cargando → concedido (cámara) → preguntable ("Continuar") → bloqueado ("Abrir Ajustes").
 * En todos los casos se puede escribir el código a mano.
 */
export default function Escanear() {
  const [permiso, pedirPermiso, consultarPermiso] = useCameraPermissions();
  const estado = aEstado(permiso);
  useRevisarAlVolver(consultarPermiso);

  const borrador = useBorrador();
  const [codigo, setCodigo] = useState(borrador.aula ?? '');
  const leido = useRef(false);

  function usarCodigo(valor: string) {
    const aula = valor.trim().slice(0, 40);
    if (!aula) return;
    actualizarBorrador({ aula });
    router.back();
  }

  return (
    <Pantalla>
      {estado === 'cargando' && (
        <View style={styles.cargando}>
          <ActivityIndicator size="large" />
          <ThemedText type="small" themeColor="textSecondary">
            Consultando permiso de cámara…
          </ThemedText>
        </View>
      )}

      {estado === 'concedido' && (
        <View style={styles.camaraContenedor}>
          <CameraView
            style={styles.camara}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={({ data }) => {
              if (leido.current) return;
              leido.current = true;
              usarCodigo(data);
            }}
          />
          <ThemedText type="small" themeColor="textSecondary" style={styles.ayuda}>
            Apuntá al código QR pegado en la puerta del aula.
          </ThemedText>
        </View>
      )}

      {(estado === 'preguntable' || estado === 'bloqueado') && (
        <PantallaPrevia
          recurso="camara"
          bloqueado={estado === 'bloqueado'}
          onContinuar={pedirPermiso}
          onAbrirAjustes={abrirAjustes}
        />
      )}

      <Tarjeta>
        <CampoTexto
          etiqueta="¿Preferís escribirlo?"
          placeholder="Código del aula (ej.: A-12)"
          value={codigo}
          onChangeText={setCodigo}
          autoCapitalize="characters"
          maxLength={40}
          returnKeyType="done"
          onSubmitEditing={() => usarCodigo(codigo)}
        />
        <Boton
          titulo="Usar este código"
          variante="secundario"
          deshabilitado={!codigo.trim()}
          onPress={() => usarCodigo(codigo)}
        />
      </Tarjeta>
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  cargando: {
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.five,
  },
  camaraContenedor: {
    gap: Spacing.two,
  },
  camara: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: Spacing.three,
    overflow: 'hidden',
  },
  ayuda: {
    textAlign: 'center',
  },
});
