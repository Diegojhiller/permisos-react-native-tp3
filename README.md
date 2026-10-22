# Mantenimiento IPF

App para que alumnos y docentes del Instituto Politécnico Formosa **reporten desperfectos del edificio** (una luz quemada, una canilla que pierde, un proyector roto) y reciban un aviso cuando se resuelven.

Trabajo Práctico N° 3 — Permisos móviles: Android, iOS y Expo (Taller Complementario – React Native II). Las respuestas de las Partes A a F están en [RESPUESTAS.md](RESPUESTAS.md).

- Expo SDK 57 · React Native 0.86 · TypeScript · Expo Router
- Usa **cámara**, **ubicación (solo primer plano)** y **notificaciones**. Las fotos se eligen con el **selector del sistema, sin permiso de galería**.
- Cada permiso se pide **en contexto** (al tocar la función), con una **pantalla previa** antes del diálogo del sistema. Si se deniega, siempre hay un **camino alternativo**.

## Cómo ejecutarla

```bash
npm install
npx expo start            # Expo Go o development build
npx expo lint             # lint
npx tsc --noEmit          # typecheck
```

Development build en Android (necesaria para ver los textos de propósito propios y el manifiesto real):

```bash
npx expo prebuild --clean          # genera android/ e ios/ para inspeccionarlos (no se versionan)
npx expo run:android               # build local
# o en la nube:
npx eas-cli@latest build --profile development --platform android
```

Para volver un permiso a "sin decidir" sin reinstalar:

```bash
# Android (repetir por cada permiso)
adb shell pm revoke ar.edu.ipf.mantenimiento android.permission.CAMERA
adb shell pm clear-permission-flags ar.edu.ipf.mantenimiento android.permission.CAMERA user-set user-fixed
# Simulador de iOS
xcrun simctl privacy booted reset all ar.edu.ipf.mantenimiento
```

## Árbol de rutas (`src/app`)

```
src/app
├── _layout.tsx                 Stack raíz: (tabs) + pantallas de reporte + modal de permisos
├── (tabs)/                     Grupo: no aparece en la URL
│   ├── _layout.tsx             NativeTabs (Reportes · Avisos · Permisos)
│   ├── index.tsx               /                     Tab "Reportes": mis reportes + "Nuevo reporte"
│   ├── avisos.tsx              /avisos              Tab "Avisos": bandeja dentro de la app
│   └── permisos.tsx            /permisos            Tab "Permisos": panel de estado de cada permiso
├── reporte/
│   ├── nuevo.tsx               /reporte/nuevo       Formulario (no pide permisos al abrir)
│   ├── escanear.tsx            /reporte/escanear    QR del aula: useCameraPermissions, 4 estados
│   ├── foto.tsx                /reporte/foto        "Sacar foto" (cámara) / "Elegir de la galería" (sin permiso)
│   ├── ubicacion.tsx           /reporte/ubicacion   Ubicación en primer plano o sector a mano
│   └── [id].tsx                /reporte/[id]        Detalle + "Simular resolución"; valida el id
├── permisos/
│   └── [recurso].tsx           /permisos/[recurso]  Pantalla previa (presentation: "modal")
└── ajustes-app.tsx             /ajustes-app         Interruptor "Avisarme cuando se resuelva mi reporte"
```

`/permisos` (tab) y `/permisos/[recurso]` (modal) son rutas distintas. La primera vive en el grupo `(tabs)`. La segunda está en el Stack raíz para poder abrirse como modal por encima de las tabs.

### Organización del resto del código

```
src/components   UI: pantalla-previa, insignias de estado, ui/ (botón, campo, tarjeta, chips…)
src/hooks        usePermiso (hook unificado), useRevisarAlVolver (AppState)
src/lib          permisos.ts (adaptadores get/request, 4 estados, matices, textos)
                 previa.ts (flujo pantalla previa → diálogo), notificaciones.ts (canal "reportes")
                 ubicacion.ts (obtenerUbicacion), reportes.ts (estado de la app), formato.ts
```

## Cómo funcionan los permisos

### Hook unificado: `usePermiso(recurso)`

[src/hooks/usePermiso.ts](src/hooks/usePermiso.ts) devuelve:

| Campo | Qué es |
|---|---|
| `estado` | `'cargando' \| 'concedido' \| 'preguntable' \| 'bloqueado'` |
| `parcial` / `matiz` | `true` con ubicación aproximada (`android.accuracy: 'coarse'`, `ios.accuracy: 'reduced'`), fotos limitadas (`accessPrivileges: 'limited'`) o notificaciones provisionales de iOS |
| `pedir()` | Muestra el diálogo del sistema (`request…PermissionsAsync`) |
| `abrirAjustes()` | `Linking.openSettings()` |
| `consultar()` | Relee el estado sin diálogo (`get…PermissionsAsync`) |

Se actualiza solo al volver de Ajustes gracias a `useRevisarAlVolver`, que escucha `AppState` (`background|inactive → active`).

La decisión entre los cuatro estados está en `aEstado()` ([src/lib/permisos.ts](src/lib/permisos.ts)):

```ts
if (!respuesta) return 'cargando';           // todavía no se consultó
if (respuesta.granted) return 'concedido';
if (respuesta.canAskAgain) return 'preguntable';  // → "Continuar"
return 'bloqueado';                               // → "Abrir Ajustes"
```

**`canAskAgain` es el campo que decide entre "Continuar" y "Abrir Ajustes".**

### Pantalla previa y "no insistir"

`pedirConPrevia(recurso)` ([src/lib/previa.ts](src/lib/previa.ts)) se llama **solo cuando la persona toca una función**:

1. Si el permiso ya está concedido, devuelve `true` sin mostrar nada.
2. Si no, abre el modal `/permisos/[recurso]`. Muestra el beneficio en una frase, un **único botón "Continuar"** y la aclaración de que se puede cambiar en Ajustes. No hay "Ahora no" ni "Cerrar" (pauta 5.1.1(iv)).
3. Si el permiso está bloqueado, la misma pantalla explica la ruta exacta en Ajustes **según la plataforma** y el botón pasa a ser **"Abrir Ajustes"**.
4. Cuando el modal se cierra, la promesa se resuelve con `true` o `false` y la pantalla que llamó sigue con la función o con su alternativa.

Ninguna pantalla pide permisos al montarse. Si la persona ya dijo que no, la pantalla previa vuelve a aparecer solo si toca otra vez la función.

El escáner muestra la misma pantalla previa (componente `PantallaPrevia`) dentro de la propia pantalla, usando `useCameraPermissions` con sus cuatro estados.

### Tabla de permisos

| Recurso | Módulo | Cuándo se pide | Alternativa si se deniega |
|---|---|---|---|
| Cámara (escanear QR) | `expo-camera` · `useCameraPermissions` | Al abrir "Escanear QR del aula" y tocar "Continuar" | Escribir el código del aula a mano |
| Cámara (sacar foto) | `expo-camera` + `expo-image-picker` (`launchCameraAsync`) | Al tocar "Sacar foto" | Elegir la foto con el selector del sistema |
| Fotos (galería) | `expo-image-picker` · `launchImageLibraryAsync` | **Nunca**: el selector del sistema no necesita permiso | — |
| Ubicación (primer plano) | `expo-location` · `requestForegroundPermissionsAsync` | Al tocar "Usar mi ubicación actual" | Elegir el sector a mano (patio, pasillo, estacionamiento…) |
| Notificaciones | `expo-notifications` · `requestPermissionsAsync` | Solo al activar el interruptor de `/ajustes-app` (antes se crea el canal `reportes` en Android) | Bandeja de avisos en `/avisos` |

Con **ubicación aproximada** la app no muestra coordenadas, solo el texto "Ubicación aproximada". Si la ubicación se deniega, el reporte se guarda con el sector elegido a mano.

**"Simular resolución"** pasa el reporte a "en curso" y a los 10 segundos a "resuelto". Si el interruptor está activo y hay permiso, programa una notificación local a los 10 segundos. El aviso queda siempre en `/avisos`, haya permiso o no.

## `app.json`: plugins comentados

```jsonc
"plugins": [
  "expo-router",
  ["expo-splash-screen", { /* … */ }],
  [
    "expo-camera",
    {
      // NSCameraUsageDescription (iOS). Molde: "Usamos tu [dato] para [beneficio concreto]".
      "cameraPermission": "Usamos tu cámara para leer el QR del aula y sacar la foto del desperfecto que reportás.",
      // Mínimo privilegio: no grabamos video, así que no hay micrófono.
      "microphonePermission": false,   // no agrega NSMicrophoneUsageDescription
      "recordAudioAndroid": false,     // no agrega RECORD_AUDIO al manifiesto
      "barcodeScannerEnabled": true    // necesario para leer el QR
    }
  ],
  [
    "expo-image-picker",
    {
      // Elegimos fotos con el selector del sistema (PHPicker / Photo Picker): no hace falta galería.
      "photosPermission": false,       // no agrega NSPhotoLibraryUsageDescription
      // Mismo texto que expo-camera, porque "Sacar foto" usa launchCameraAsync.
      "cameraPermission": "Usamos tu cámara para leer el QR del aula y sacar la foto del desperfecto que reportás.",
      "microphonePermission": false    // bloquea RECORD_AUDIO
    }
  ],
  [
    "expo-location",
    {
      // Solo "mientras se usa la app".
      "locationWhenInUsePermission": "Usamos tu ubicación para marcar en qué sector del instituto está el desperfecto que reportás.",
      // Sin "siempre", sin movimiento y sin segundo plano: no se agregan esas claves ni permisos.
      "locationAlwaysAndWhenInUsePermission": false,
      "locationAlwaysPermission": false,
      "motionUsagePermission": false,
      "isIosBackgroundLocationEnabled": false,
      "isAndroidBackgroundLocationEnabled": false,
      "isAndroidForegroundServiceEnabled": false
    }
  ],
  // Notificaciones locales. En iOS no llevan texto de propósito en el Info.plist.
  ["expo-notifications", { "color": "#208AEF" }]
]
```

### `android.blockedPermissions` (y por qué)

| Permiso bloqueado | Por qué la app no lo usa |
|---|---|
| `RECORD_AUDIO` | No grabamos video ni audio. `expo-camera` lo agrega por defecto por si se graba video con sonido. |
| `READ_MEDIA_IMAGES` | Las fotos se eligen con el selector del sistema, que no necesita permiso. Google Play restringe este permiso a apps cuya función principal es la galería. |
| `READ_MEDIA_VIDEO` | No usamos videos. |
| `READ_MEDIA_VISUAL_USER_SELECTED` | Acceso parcial a la galería (Android 14). No hace falta con el selector. |
| `READ_EXTERNAL_STORAGE` / `WRITE_EXTERNAL_STORAGE` | Permisos de almacenamiento heredados (Android ≤ 12). No leemos ni escribimos archivos compartidos. |
| `ACCESS_BACKGROUND_LOCATION` | Solo ubicación en primer plano. Pedir segundo plano exige una declaración extra en Google Play. |
| `SYSTEM_ALERT_WINDOW` | No dibujamos encima de otras apps. Algunas librerías lo agregan para el modo desarrollo. |

### Auditoría de permisos (resultado de la config)

Salida de `npx expo config --type introspect`, con los permisos finales que generan los plugins:

| Permiso Android | Quién lo agrega | Estado |
|---|---|---|
| `INTERNET` | Expo / React Native | queda (instalación) |
| `VIBRATE` | `expo-notifications` | queda (instalación) |
| `CAMERA` | `expo-camera` / `expo-image-picker` | queda (tiempo de ejecución) |
| `ACCESS_COARSE_LOCATION` / `ACCESS_FINE_LOCATION` | `expo-location` | queda (tiempo de ejecución) |
| `POST_NOTIFICATIONS` | `expo-notifications` (manifiesto de la librería, se fusiona al compilar) | queda (tiempo de ejecución, Android 13+) |
| `RECORD_AUDIO`, `READ_MEDIA_*`, `READ/WRITE_EXTERNAL_STORAGE`, `ACCESS_BACKGROUND_LOCATION`, `SYSTEM_ALERT_WINDOW` | varias librerías | **quitados** con `tools:node="remove"` |

Claves de iOS generadas: `NSCameraUsageDescription` y `NSLocationWhenInUseUsageDescription`. No hay micrófono, galería ni ubicación "siempre".

> TODO: completar con el `AndroidManifest.xml` real después de `npx expo prebuild --clean`.

## Capturas

> TODO: agregar en `docs/capturas/` y enlazarlas acá.

- [ ] Escáner: cargando · concedido · preguntable · bloqueado
- [ ] Ubicación concedida (precisa y aproximada) y denegada (sector a mano)
- [ ] Foto elegida desde el selector del sistema
- [ ] Notificación recibida
- [ ] Panel de permisos antes y después de volver de Ajustes
- [ ] Diálogo del sistema en una development build con nuestro texto de propósito

## Expo Go vs development build

- **Expo Go** sirve para probar el flujo de pantallas, la cámara, la ubicación y las notificaciones locales. Pero los diálogos muestran los textos de propósito **de Expo Go**, no los nuestros, porque Expo Go es otra app con su propio `Info.plist` y manifiesto. `blockedPermissions` tampoco tiene efecto ahí.
- La **development build** usa nuestro `app.json`: muestra nuestros textos y aplica los permisos bloqueados.

## Limitaciones conocidas

- Los reportes y avisos se guardan **en memoria**: se pierden al cerrar la app. Alcanza para la demostración del TP.
- La resolución es simulada con un temporizador. No hay backend ni notificaciones push.
