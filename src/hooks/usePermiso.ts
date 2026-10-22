import { useCallback, useEffect, useState } from 'react';

import { useRevisarAlVolver } from '@/hooks/useRevisarAlVolver';
import {
  abrirAjustes,
  aEstado,
  consultarPermiso,
  describirMatiz,
  solicitarPermiso,
  type Recurso,
  type RespuestaPermiso,
} from '@/lib/permisos';

/**
 * Hook unificado de permisos.
 *
 * - estado: 'cargando' | 'concedido' | 'preguntable' | 'bloqueado'
 * - parcial: true con fotos limitadas, ubicación aproximada o notificaciones provisionales
 * - matiz: descripción del permiso parcial (o null)
 * - pedir(): muestra el diálogo del sistema (si el SO todavía lo permite)
 * - abrirAjustes(): abre los ajustes de la app
 * - consultar(): vuelve a leer el estado sin mostrar diálogos
 *
 * Se actualiza solo al volver de Ajustes (AppState).
 */
export function usePermiso(recurso: Recurso) {
  const [respuesta, setRespuesta] = useState<RespuestaPermiso | null>(null);

  const consultar = useCallback(async () => {
    const nueva = await consultarPermiso(recurso);
    setRespuesta(nueva);
    return nueva;
  }, [recurso]);

  const pedir = useCallback(async () => {
    const nueva = await solicitarPermiso(recurso);
    setRespuesta(nueva);
    return nueva;
  }, [recurso]);

  // Primera lectura al montar (sin diálogo). Mientras tanto el estado es 'cargando'.
  useEffect(() => {
    let montado = true;
    consultarPermiso(recurso).then((nueva) => {
      if (montado) setRespuesta(nueva);
    });
    return () => {
      montado = false;
    };
  }, [recurso]);

  useRevisarAlVolver(consultar);

  const matiz = describirMatiz(respuesta);

  return {
    estado: aEstado(respuesta),
    parcial: matiz !== null,
    matiz,
    respuesta,
    pedir,
    abrirAjustes,
    consultar,
  };
}
