import type { UbicacionReporte } from '@/lib/reportes';

/**
 * Texto de la ubicación de un reporte.
 * Con ubicación aproximada NO se muestran coordenadas: solo "Ubicación aproximada".
 */
export function describirUbicacion(ubicacion: UbicacionReporte | undefined): string | null {
  if (!ubicacion) return null;
  const partes: string[] = [];
  if (ubicacion.sector) partes.push(`Sector: ${ubicacion.sector}`);
  if (ubicacion.gps) {
    partes.push(
      ubicacion.gps.aproximada
        ? 'Ubicación aproximada'
        : `${ubicacion.gps.latitud.toFixed(5)}, ${ubicacion.gps.longitud.toFixed(5)}`,
    );
  }
  return partes.length ? partes.join(' · ') : null;
}
