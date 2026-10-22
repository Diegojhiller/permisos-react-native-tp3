/**
 * Estado de la app en memoria: reportes, borrador del formulario, bandeja de avisos y preferencias.
 * Los componentes se suscriben con useSyncExternalStore a través de los hooks de abajo.
 */
import { useSyncExternalStore } from 'react';

import { programarNotificacion } from '@/lib/notificaciones';
import type { Coordenadas } from '@/lib/ubicacion';

export const CATEGORIAS = ['electricidad', 'agua', 'mobiliario', 'equipos'] as const;
export type Categoria = (typeof CATEGORIAS)[number];

export type EstadoReporte = 'pendiente' | 'en curso' | 'resuelto';

export type UbicacionReporte = {
  sector?: string;
  gps?: Coordenadas;
};

export type Reporte = {
  id: string;
  titulo: string;
  descripcion: string;
  aula: string;
  categoria: Categoria;
  fotoUri?: string;
  ubicacion?: UbicacionReporte;
  estado: EstadoReporte;
  creado: number;
};

export type Borrador = Partial<Omit<Reporte, 'id' | 'estado' | 'creado'>>;

export type Aviso = {
  id: string;
  reporteId: string;
  titulo: string;
  cuerpo: string;
  fecha: number;
  /** true si además se envió como notificación del sistema. */
  notificado: boolean;
};

type Estado = {
  reportes: Reporte[];
  borrador: Borrador;
  avisos: Aviso[];
  avisarAlResolver: boolean;
};

let estado: Estado = {
  reportes: [],
  borrador: {},
  avisos: [],
  avisarAlResolver: false,
};

const suscriptores = new Set<() => void>();

function actualizar(cambio: (anterior: Estado) => Partial<Estado>) {
  estado = { ...estado, ...cambio(estado) };
  suscriptores.forEach((avisar) => avisar());
}

function suscribir(avisar: () => void) {
  suscriptores.add(avisar);
  return () => {
    suscriptores.delete(avisar);
  };
}

function useSeleccion<T>(seleccionar: (estado: Estado) => T) {
  return useSyncExternalStore(suscribir, () => seleccionar(estado));
}

function nuevoId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// --- Hooks de lectura ---

export const useReportes = () => useSeleccion((e) => e.reportes);
export const useReporte = (id: string | undefined) =>
  useSeleccion((e) => e.reportes.find((r) => r.id === id));
export const useBorrador = () => useSeleccion((e) => e.borrador);
export const useAvisos = () => useSeleccion((e) => e.avisos);
export const useAvisarAlResolver = () => useSeleccion((e) => e.avisarAlResolver);

// --- Acciones ---

export function actualizarBorrador(cambio: Borrador) {
  actualizar((e) => ({ borrador: { ...e.borrador, ...cambio } }));
}

export function descartarBorrador() {
  actualizar(() => ({ borrador: {} }));
}

/** Valida el borrador y lo guarda como reporte. Devuelve el error o el id creado. */
export function guardarBorrador(): { error: string } | { id: string } {
  const { titulo, descripcion, aula, categoria, fotoUri, ubicacion } = estado.borrador;
  if (!titulo?.trim()) return { error: 'Escribí un título.' };
  if (!categoria) return { error: 'Elegí una categoría.' };
  if (!aula?.trim() && !ubicacion?.sector && !ubicacion?.gps) {
    return { error: 'Indicá el aula o marcá la ubicación del problema.' };
  }

  const reporte: Reporte = {
    id: nuevoId(),
    titulo: titulo.trim(),
    descripcion: descripcion?.trim() ?? '',
    aula: aula?.trim() ?? '',
    categoria,
    fotoUri,
    ubicacion,
    estado: 'pendiente',
    creado: Date.now(),
  };
  actualizar((e) => ({ reportes: [reporte, ...e.reportes], borrador: {} }));
  return { id: reporte.id };
}

function cambiarEstado(id: string, nuevo: EstadoReporte) {
  actualizar((e) => ({
    reportes: e.reportes.map((r) => (r.id === id ? { ...r, estado: nuevo } : r)),
  }));
}

export function cambiarAvisarAlResolver(valor: boolean) {
  actualizar(() => ({ avisarAlResolver: valor }));
}

export const SEGUNDOS_SIMULACION = 10;

/**
 * Simula que mantenimiento resuelve el reporte: pasa a "en curso" y a los 10 s a "resuelto".
 * Si la persona activó el aviso y hay permiso, programa una notificación local.
 * El aviso SIEMPRE queda en la bandeja /avisos (alternativa a las notificaciones).
 * Devuelve si se programó la notificación.
 */
export async function simularResolucion(id: string) {
  const reporte = estado.reportes.find((r) => r.id === id);
  if (!reporte || reporte.estado !== 'pendiente') return false;

  cambiarEstado(id, 'en curso');
  const titulo = 'Reporte resuelto';
  const cuerpo = `“${reporte.titulo}” ya fue resuelto por mantenimiento.`;

  const notificado =
    estado.avisarAlResolver &&
    (await programarNotificacion(titulo, cuerpo, `/reporte/${id}`, SEGUNDOS_SIMULACION));

  setTimeout(() => {
    cambiarEstado(id, 'resuelto');
    const aviso: Aviso = { id: nuevoId(), reporteId: id, titulo, cuerpo, fecha: Date.now(), notificado };
    actualizar((e) => ({ avisos: [aviso, ...e.avisos] }));
  }, SEGUNDOS_SIMULACION * 1000);

  return notificado;
}
