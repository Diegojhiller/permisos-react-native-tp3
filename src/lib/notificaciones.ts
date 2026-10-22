import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export const CANAL_REPORTES = 'reportes';

/** Muestra las notificaciones aunque la app esté abierta. */
export function configurarNotificaciones() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

/** Android exige un canal antes de pedir el permiso (Android 13+) y antes de notificar. */
export async function crearCanalReportes() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CANAL_REPORTES, {
    name: 'Reportes',
    description: 'Avisos cuando se resuelve un reporte',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

/** Programa una notificación local. Devuelve false si no se pudo (sin permiso, web, etc.). */
export async function programarNotificacion(titulo: string, cuerpo: string, url: string, segundos: number) {
  try {
    const permiso = await Notifications.getPermissionsAsync();
    if (!permiso.granted) return false;
    await crearCanalReportes();
    await Notifications.scheduleNotificationAsync({
      content: { title: titulo, body: cuerpo, data: { url } },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: segundos,
        channelId: CANAL_REPORTES,
      },
    });
    return true;
  } catch {
    return false;
  }
}
