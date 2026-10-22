/**
 * Lógica de permisos de la app, independiente de la UI.
 *
 * Cada recurso tiene un "adaptador" con dos funciones:
 * - consultar(): lee el estado actual SIN mostrar ningún diálogo (get…PermissionsAsync).
 * - pedir(): puede mostrar el diálogo del sistema (request…PermissionsAsync).
 */
import { Camera } from 'expo-camera';
import * as Location from 'expo-location';
import type { PermissionResponse } from 'expo-location';
import * as Notifications from 'expo-notifications';
import { Linking, Platform } from 'react-native';

import { crearCanalReportes } from '@/lib/notificaciones';

export type Recurso = 'camara' | 'ubicacion' | 'notificaciones';

export const RECURSOS: Recurso[] = ['camara', 'ubicacion', 'notificaciones'];

export type EstadoPermiso = 'cargando' | 'concedido' | 'preguntable' | 'bloqueado';

/** Respuesta común: incluye los matices que agregan algunos módulos. */
export type RespuestaPermiso = PermissionResponse & {
  accessPrivileges?: 'all' | 'limited' | 'none';
  android?: { accuracy?: 'fine' | 'coarse' | 'none'; importance?: number; interruptionFilter?: number };
  ios?: { accuracy?: 'full' | 'reduced'; status?: Notifications.IosAuthorizationStatus };
};

type Adaptador = {
  consultar: () => Promise<RespuestaPermiso>;
  pedir: () => Promise<RespuestaPermiso>;
};

const adaptadores: Record<Recurso, Adaptador> = {
  camara: {
    consultar: () => Camera.getCameraPermissionsAsync(),
    pedir: () => Camera.requestCameraPermissionsAsync(),
  },
  ubicacion: {
    // Solo primer plano: la app nunca pide ubicación en segundo plano.
    consultar: () => Location.getForegroundPermissionsAsync(),
    pedir: () => Location.requestForegroundPermissionsAsync(),
  },
  notificaciones: {
    consultar: () => Notifications.getPermissionsAsync(),
    pedir: async () => {
      // En Android 13+ el diálogo no aparece si no existe al menos un canal.
      await crearCanalReportes();
      return Notifications.requestPermissionsAsync({
        ios: { allowAlert: true, allowBadge: true, allowSound: true },
      });
    },
  },
};

export function consultarPermiso(recurso: Recurso) {
  return adaptadores[recurso].consultar();
}

export function solicitarPermiso(recurso: Recurso) {
  return adaptadores[recurso].pedir();
}

/**
 * Traduce la respuesta de Expo a los cuatro estados de la app.
 * `granted` decide si se puede usar; `canAskAgain` decide entre "Continuar" y "Abrir Ajustes".
 */
export function aEstado(respuesta: PermissionResponse | null | undefined): EstadoPermiso {
  if (!respuesta) return 'cargando';
  if (respuesta.granted) return 'concedido';
  if (respuesta.canAskAgain) return 'preguntable';
  return 'bloqueado';
}

/** Matiz de un permiso concedido "a medias", o null si no hay matiz. */
export function describirMatiz(respuesta: RespuestaPermiso | null | undefined): string | null {
  if (!respuesta?.granted) return null;
  if (respuesta.accessPrivileges === 'limited') return 'Fotos limitadas (accessPrivileges: limited)';
  if (respuesta.android?.accuracy === 'coarse') return 'Ubicación aproximada (accuracy: coarse)';
  if (respuesta.ios?.accuracy === 'reduced') return 'Ubicación aproximada (accuracy: reduced)';
  if (respuesta.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
    return 'Provisional: llegan en silencio al centro de notificaciones';
  }
  return null;
}

export function esParcial(respuesta: RespuestaPermiso | null | undefined) {
  return describirMatiz(respuesta) !== null;
}

export function abrirAjustes() {
  return Linking.openSettings();
}

type InfoRecurso = {
  nombre: string;
  icono: string;
  /** Beneficio en una frase, para la pantalla previa. */
  beneficio: string;
  /** Qué hace la app si la persona no lo concede. */
  alternativa: string;
  rutaAjustes: { android: string; ios: string };
};

export const INFO_RECURSOS: Record<Recurso, InfoRecurso> = {
  camara: {
    nombre: 'Cámara',
    icono: '📷',
    beneficio: 'Leé el QR de la puerta del aula y sacá la foto del desperfecto sin escribir nada.',
    alternativa: 'Podés escribir el código del aula a mano y elegir la foto desde la galería.',
    rutaAjustes: {
      android: 'Ajustes › Apps › Mantenimiento IPF › Permisos › Cámara › Permitir solo mientras se usa la app',
      ios: 'Ajustes › Mantenimiento IPF › Cámara (activar)',
    },
  },
  ubicacion: {
    nombre: 'Ubicación',
    icono: '📍',
    beneficio: 'Marcá en qué parte del instituto está el problema con un toque.',
    alternativa: 'Podés elegir el sector (patio, pasillo, estacionamiento…) a mano.',
    rutaAjustes: {
      android: 'Ajustes › Apps › Mantenimiento IPF › Permisos › Ubicación › Permitir solo mientras se usa la app',
      ios: 'Ajustes › Mantenimiento IPF › Ubicación › Mientras se usa la app',
    },
  },
  notificaciones: {
    nombre: 'Notificaciones',
    icono: '🔔',
    beneficio: 'Enterate en el momento en que se resuelve el desperfecto que reportaste.',
    alternativa: 'Los avisos te quedan igual en la pestaña Avisos.',
    rutaAjustes: {
      android: 'Ajustes › Apps › Mantenimiento IPF › Notificaciones › Todas las notificaciones (activar)',
      ios: 'Ajustes › Notificaciones › Mantenimiento IPF › Permitir notificaciones',
    },
  },
};

export function rutaAjustes(recurso: Recurso) {
  const { android, ios } = INFO_RECURSOS[recurso].rutaAjustes;
  return Platform.OS === 'ios' ? ios : android;
}

export function esRecurso(valor: unknown): valor is Recurso {
  return typeof valor === 'string' && (RECURSOS as string[]).includes(valor);
}
