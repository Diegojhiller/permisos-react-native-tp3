import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Boton } from '@/components/ui/boton';
import { Pantalla } from '@/components/ui/pantalla';
import { Tarjeta } from '@/components/ui/tarjeta';
import { Spacing } from '@/constants/theme';
import { INFO_RECURSOS } from '@/lib/permisos';
import { pedirConPrevia } from '@/lib/previa';
import { actualizarBorrador, useBorrador } from '@/lib/reportes';

const OPCIONES: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  quality: 0.6,
  allowsEditing: true,
};

/**
 * "Sacar foto" necesita permiso de cámara (con pantalla previa).
 * "Elegir de la galería" usa el selector del sistema: NO pide permiso de galería.
 */
export default function Foto() {
  const { fotoUri } = useBorrador();
  const [sinCamara, setSinCamara] = useState(false);

  async function sacarFoto() {
    const concedido = await pedirConPrevia('camara');
    setSinCamara(!concedido);
    if (!concedido) return;

    const resultado = await ImagePicker.launchCameraAsync(OPCIONES);
    if (!resultado.canceled) actualizarBorrador({ fotoUri: resultado.assets[0].uri });
  }

  async function elegirDeGaleria() {
    const resultado = await ImagePicker.launchImageLibraryAsync(OPCIONES);
    if (!resultado.canceled) actualizarBorrador({ fotoUri: resultado.assets[0].uri });
  }

  return (
    <Pantalla>
      {fotoUri ? (
        <Image source={{ uri: fotoUri }} style={styles.foto} contentFit="cover" />
      ) : (
        <Tarjeta>
          <ThemedText type="small" themeColor="textSecondary">
            Una foto ayuda a mantenimiento a saber qué herramientas llevar.
          </ThemedText>
        </Tarjeta>
      )}

      <Boton titulo="Sacar foto" onPress={sacarFoto} />
      <Boton titulo="Elegir de la galería" variante="secundario" onPress={elegirDeGaleria} />

      {sinCamara && (
        <ThemedText type="small" themeColor="warning">
          Sin permiso de cámara. {INFO_RECURSOS.camara.alternativa}
        </ThemedText>
      )}

      {fotoUri && (
        <>
          <Boton titulo="Listo" onPress={() => router.back()} />
          <Boton
            titulo="Quitar foto"
            variante="secundario"
            onPress={() => actualizarBorrador({ fotoUri: undefined })}
          />
        </>
      )}
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  foto: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: Spacing.three,
  },
});
