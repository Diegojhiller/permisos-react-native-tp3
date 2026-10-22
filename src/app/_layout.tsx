import * as Notifications from 'expo-notifications';
import { DarkTheme, DefaultTheme, Href, router, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { configurarNotificaciones } from '@/lib/notificaciones';

SplashScreen.preventAutoHideAsync();
configurarNotificaciones();

/** Al tocar una notificación de "reporte resuelto", abre el detalle del reporte. */
function useAbrirDesdeNotificacion() {
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((respuesta) => {
      const url = respuesta.notification.request.content.data?.url;
      if (typeof url === 'string') router.push(url as Href);
    });
    return () => sub.remove();
  }, []);
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  useAbrirDesdeNotificacion();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <Stack screenOptions={{ headerBackButtonDisplayMode: 'minimal' }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="reporte/nuevo" options={{ title: 'Nuevo reporte' }} />
        <Stack.Screen name="reporte/escanear" options={{ title: 'Escanear QR del aula' }} />
        <Stack.Screen name="reporte/foto" options={{ title: 'Foto del desperfecto' }} />
        <Stack.Screen name="reporte/ubicacion" options={{ title: 'Ubicación' }} />
        <Stack.Screen name="reporte/[id]" options={{ title: 'Reporte' }} />
        <Stack.Screen name="ajustes-app" options={{ title: 'Ajustes' }} />
        <Stack.Screen
          name="permisos/[recurso]"
          options={{ presentation: 'modal', title: 'Antes de continuar' }}
        />
      </Stack>
    </ThemeProvider>
  );
}
