/**
 * Flujo "pantalla previa → diálogo del sistema".
 *
 * pedirConPrevia() se llama SOLO cuando la persona toca una función (cámara, ubicación,
 * notificaciones). Si el permiso ya está concedido devuelve true sin mostrar nada; si no,
 * abre el modal /permisos/[recurso] y espera a que la persona decida.
 */
import { router } from 'expo-router';

import { consultarPermiso, type Recurso } from '@/lib/permisos';

let pendiente: ((concedido: boolean) => void) | null = null;

export async function pedirConPrevia(recurso: Recurso): Promise<boolean> {
  const actual = await consultarPermiso(recurso);
  if (actual.granted) return true;

  return new Promise((resolve) => {
    resolverPrevia(false);
    pendiente = resolve;
    router.push({ pathname: '/permisos/[recurso]', params: { recurso } });
  });
}

/** La llama el modal al terminar. Si nadie estaba esperando, no hace nada. */
export function resolverPrevia(concedido: boolean) {
  pendiente?.(concedido);
  pendiente = null;
}
