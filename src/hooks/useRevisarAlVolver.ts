import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

/**
 * Ejecuta `revisar` cada vez que la app vuelve al primer plano (por ejemplo, al volver de Ajustes).
 * Los hooks de permisos de Expo no se enteran solos de los cambios hechos fuera de la app.
 */
export function useRevisarAlVolver(revisar: () => unknown) {
  const anterior = useRef(AppState.currentState);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (nuevo) => {
      const estabaAfuera = /inactive|background/.test(anterior.current);
      if (estabaAfuera && nuevo === 'active') revisar();
      anterior.current = nuevo;
    });
    return () => sub.remove();
  }, [revisar]);
}
