import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Boton } from '@/components/ui/boton';
import { CampoTexto } from '@/components/ui/campo-texto';
import { Pantalla } from '@/components/ui/pantalla';
import { SelectorChips } from '@/components/ui/selector-chips';
import { Tarjeta } from '@/components/ui/tarjeta';
import { Spacing } from '@/constants/theme';
import { describirUbicacion } from '@/lib/formato';
import { actualizarBorrador, CATEGORIAS, guardarBorrador, useBorrador } from '@/lib/reportes';

/**
 * Formulario de nuevo reporte. Al abrirlo NO se pide ningún permiso:
 * cada uno se pide recién al tocar su función (escanear, foto, ubicación).
 */
export default function NuevoReporte() {
  const borrador = useBorrador();
  const [error, setError] = useState<string | null>(null);

  function guardar() {
    const resultado = guardarBorrador();
    if ('error' in resultado) {
      setError(resultado.error);
      return;
    }
    router.replace(`/reporte/${resultado.id}`);
  }

  return (
    <Pantalla>
      <CampoTexto
        etiqueta="Título"
        placeholder="Ej.: Luz quemada"
        value={borrador.titulo ?? ''}
        onChangeText={(titulo) => actualizarBorrador({ titulo })}
        maxLength={80}
      />
      <CampoTexto
        etiqueta="Descripción"
        placeholder="¿Qué pasa y desde cuándo?"
        value={borrador.descripcion ?? ''}
        onChangeText={(descripcion) => actualizarBorrador({ descripcion })}
        multiline
        maxLength={500}
      />

      <View style={styles.grupo}>
        <ThemedText type="smallBold">Categoría</ThemedText>
        <SelectorChips
          opciones={CATEGORIAS}
          valor={borrador.categoria}
          onCambiar={(categoria) => actualizarBorrador({ categoria })}
        />
      </View>

      <View style={styles.grupo}>
        <CampoTexto
          etiqueta="Aula"
          placeholder="Escribila o escaneá el QR de la puerta"
          value={borrador.aula ?? ''}
          onChangeText={(aula) => actualizarBorrador({ aula })}
          autoCapitalize="characters"
          maxLength={40}
        />
        <Boton titulo="Escanear QR del aula" variante="secundario" onPress={() => router.push('/reporte/escanear')} />
      </View>

      <Tarjeta>
        <ThemedText type="smallBold">Foto</ThemedText>
        {borrador.fotoUri ? (
          <Image source={{ uri: borrador.fotoUri }} style={styles.foto} contentFit="cover" />
        ) : (
          <ThemedText type="small" themeColor="textSecondary">
            Sin foto
          </ThemedText>
        )}
        <Boton
          titulo={borrador.fotoUri ? 'Cambiar foto' : 'Adjuntar foto'}
          variante="secundario"
          onPress={() => router.push('/reporte/foto')}
        />
      </Tarjeta>

      <Tarjeta>
        <ThemedText type="smallBold">Ubicación</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {describirUbicacion(borrador.ubicacion) ?? 'Sin marcar'}
        </ThemedText>
        <Boton titulo="Marcar ubicación" variante="secundario" onPress={() => router.push('/reporte/ubicacion')} />
      </Tarjeta>

      {error && (
        <ThemedText type="smallBold" themeColor="danger" accessibilityLiveRegion="polite">
          {error}
        </ThemedText>
      )}
      <Boton titulo="Enviar reporte" onPress={guardar} />
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  grupo: {
    gap: Spacing.two,
  },
  foto: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: Spacing.two,
  },
});
