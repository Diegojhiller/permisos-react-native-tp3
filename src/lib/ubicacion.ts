import * as Location from 'expo-location';

export type Coordenadas = {
  latitud: number;
  longitud: number;
  /** true si la persona concedió solo ubicación aproximada. */
  aproximada: boolean;
};

/**
 * Devuelve la posición actual o null si no hay permiso o falla. Nunca lanza errores.
 * No pide el permiso: eso se hace antes, en contexto, con la pantalla previa.
 */
export async function obtenerUbicacion(): Promise<Coordenadas | null> {
  try {
    const permiso = await Location.getForegroundPermissionsAsync();
    if (!permiso.granted) return null;

    const aproximada = permiso.android?.accuracy === 'coarse' || permiso.ios?.accuracy === 'reduced';
    const posicion = await Location.getCurrentPositionAsync({
      accuracy: aproximada ? Location.Accuracy.Low : Location.Accuracy.Balanced,
    });

    return {
      latitud: posicion.coords.latitude,
      longitud: posicion.coords.longitude,
      aproximada,
    };
  } catch {
    return null;
  }
}

export const SECTORES = [
  'Aula',
  'Pasillo',
  'Patio',
  'Estacionamiento',
  'Baños',
  'Biblioteca',
  'Laboratorio',
  'Otro',
] as const;
