import { Link } from 'expo-router';
import { Pressable } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Pantalla } from '@/components/ui/pantalla';
import { Tarjeta } from '@/components/ui/tarjeta';
import { useAvisos } from '@/lib/reportes';

/** Bandeja de avisos dentro de la app: la alternativa cuando no hay permiso de notificaciones. */
export default function Avisos() {
  const avisos = useAvisos();

  return (
    <Pantalla enTab>
      <ThemedText type="subtitle">Avisos</ThemedText>

      {avisos.length === 0 ? (
        <Tarjeta>
          <ThemedText type="smallBold">No hay avisos</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Cuando se resuelva uno de tus reportes, el aviso aparece acá, tengas o no las
            notificaciones activadas.
          </ThemedText>
        </Tarjeta>
      ) : (
        avisos.map((aviso) => (
          <Link key={aviso.id} href={`/reporte/${aviso.reporteId}`} asChild>
            <Pressable accessibilityRole="button">
              <Tarjeta>
                <ThemedText type="smallBold">{aviso.titulo}</ThemedText>
                <ThemedText type="small">{aviso.cuerpo}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {new Date(aviso.fecha).toLocaleString()}
                  {aviso.notificado ? ' · también llegó como notificación' : ' · solo en la bandeja'}
                </ThemedText>
              </Tarjeta>
            </Pressable>
          </Link>
        ))
      )}
    </Pantalla>
  );
}
