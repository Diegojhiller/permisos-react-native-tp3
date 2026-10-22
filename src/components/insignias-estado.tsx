import { Insignia } from '@/components/ui/insignia';
import type { EstadoPermiso } from '@/lib/permisos';
import type { EstadoReporte } from '@/lib/reportes';

const COLOR_REPORTE = {
  pendiente: 'warning',
  'en curso': 'primary',
  resuelto: 'success',
} as const;

export function InsigniaReporte({ estado }: { estado: EstadoReporte }) {
  return <Insignia texto={estado} color={COLOR_REPORTE[estado]} />;
}

const COLOR_PERMISO = {
  cargando: 'textSecondary',
  concedido: 'success',
  preguntable: 'primary',
  bloqueado: 'danger',
} as const;

export function InsigniaPermiso({ estado, parcial }: { estado: EstadoPermiso; parcial?: boolean }) {
  if (estado === 'concedido' && parcial) return <Insignia texto="parcial" color="warning" />;
  return <Insignia texto={estado} color={COLOR_PERMISO[estado]} />;
}
