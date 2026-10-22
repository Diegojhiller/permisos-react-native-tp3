import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef } from 'react';
import { ActivityIndicator } from 'react-native';

import { PantallaPrevia } from '@/components/pantalla-previa';
import { ThemedText } from '@/components/themed-text';
import { Boton } from '@/components/ui/boton';
import { Pantalla } from '@/components/ui/pantalla';
import { Tarjeta } from '@/components/ui/tarjeta';
import { usePermiso } from '@/hooks/usePermiso';
import { esRecurso, INFO_RECURSOS, type Recurso } from '@/lib/permisos';
import { resolverPrevia } from '@/lib/previa';

/** Pantalla previa al diálogo del sistema (presentation: "modal"). */
export default function PermisoPrevio() {
  const { recurso } = useLocalSearchParams<{ recurso: string }>();

  if (!esRecurso(recurso)) {
    return (
      <Pantalla>
        <Tarjeta>
          <ThemedText type="smallBold">No existe el permiso “{recurso}”.</ThemedText>
          <Boton titulo="Volver" onPress={() => router.back()} />
        </Tarjeta>
      </Pantalla>
    );
  }

  return <Contenido recurso={recurso} />;
}

function Contenido({ recurso }: { recurso: Recurso }) {
  const { estado, pedir, abrirAjustes } = usePermiso(recurso);

  // Se responde a quien abrió el modal recién cuando el modal se cierra, para que la acción
  // siguiente (abrir la cámara, buscar la ubicación) no compita con la animación de cierre.
  // Si la persona lo cierra con el gesto o el botón atrás, cuenta como "no concedido".
  const resultado = useRef(false);
  useEffect(() => () => resolverPrevia(resultado.current), []);

  function terminar(concedido: boolean) {
    resultado.current = concedido;
    router.back();
  }

  async function continuar() {
    const respuesta = await pedir();
    terminar(respuesta.granted);
  }

  return (
    <Pantalla>
      {estado === 'cargando' && <ActivityIndicator size="large" />}

      {estado === 'concedido' && (
        <Tarjeta>
          <ThemedText type="smallBold">
            {INFO_RECURSOS[recurso].icono} {INFO_RECURSOS[recurso].nombre}: activado
          </ThemedText>
          <Boton titulo="Continuar" onPress={() => terminar(true)} />
        </Tarjeta>
      )}

      {(estado === 'preguntable' || estado === 'bloqueado') && (
        <PantallaPrevia
          recurso={recurso}
          bloqueado={estado === 'bloqueado'}
          onContinuar={continuar}
          onAbrirAjustes={abrirAjustes}
        />
      )}
    </Pantalla>
  );
}
