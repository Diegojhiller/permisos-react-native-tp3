# TP3 — Permisos móviles: respuestas de las Partes A a F

Taller Complementario – React Native II · Instituto Politécnico Formosa

> Proyecto de referencia: la app **Mantenimiento IPF** de este repositorio (Parte G). Cuando una respuesta tiene ejemplo en el código, se indica el archivo.

---

## Parte A · ¿Qué es un permiso y por qué existe?

### A1. Conceptos

**a)** Un permiso es una autorización que la persona usuaria le da a una app para usar un recurso protegido del dispositivo (cámara, ubicación, contactos, notificaciones…).

- **La app** declara qué recursos va a necesitar y los pide en el momento en que los usa.
- **El sistema operativo** es el intermediario: verifica que el permiso esté declarado, muestra el diálogo (la app no puede dibujarlo), guarda la respuesta y bloquea el acceso si no hay autorización.
- **La persona usuaria** decide: concede, deniega o revoca después desde Ajustes.

**b)** La **caja de arena** (sandbox) es el aislamiento que el sistema le impone a cada app: corre con su propia identidad, su propio espacio de archivos y sin acceso a los datos de otras apps ni al hardware sensible. Los permisos son las "puertas" controladas para salir de esa caja. Sin ningún permiso de tiempo de ejecución una app igual puede mostrar su interfaz, guardar archivos en su propio almacenamiento, usar internet (en Android es un permiso de instalación que se concede solo), vibrar y usar el selector de fotos o de documentos del sistema, porque ahí elige la persona.

**c)** Las cuatro razones:

| Razón | Ejemplo |
|---|---|
| **Privacidad** | Una linterna no tiene por qué leer los contactos ni saber dónde vivís. |
| **Seguridad** | Evitar que una app maliciosa grabe audio a escondidas o lea los SMS con códigos de verificación. |
| **Control y transparencia** | La persona sabe qué usa cada app y puede revocarlo: le saco la ubicación a una app de compras desde Ajustes. |
| **Recursos del dispositivo** | La ubicación en segundo plano gasta batería; el sistema obliga a pedirla aparte y a justificarla. |

**d)** En la analogía del portero:

- **La visita** es la app, que quiere entrar a un recurso.
- **El portero** es el sistema operativo, que controla quién entra y pregunta.
- **El dueño del departamento** es la persona usuaria, que decide.

"El portero se acuerda de la respuesta" significa que el sistema **guarda la decisión**. Si la persona dijo que sí, la app no vuelve a preguntar. Si dijo que no (en iOS a la primera, en Android 11+ a la segunda), el portero ni siquiera vuelve a tocar el timbre: la app recibe el "no" sin que aparezca el diálogo, y solo el dueño puede cambiarlo desde Ajustes.

### A2. Declarar y solicitar

| | Declarar (al compilar) | Solicitar (al ejecutar) |
|---|---|---|
| **¿Qué se hace?** | Se avisa en los archivos nativos qué permisos podría usar la app. Queda dentro del binario. | Se le pregunta a la persona en el momento de usar la función. El sistema muestra el diálogo y devuelve la respuesta. |
| **¿Dónde / cómo en Android?** | `<uses-permission android:name="android.permission.CAMERA" />` en `AndroidManifest.xml`. | `ActivityCompat.requestPermissions(...)`: diálogo del sistema con texto fijo. |
| **¿Dónde / cómo en iOS?** | Clave de propósito en `Info.plist` (`NSCameraUsageDescription` con el texto que ve la persona). | El framework correspondiente (`AVCaptureDevice.requestAccess`, `CLLocationManager.requestWhenInUseAuthorization`…). |
| **¿Dónde / cómo en Expo?** | En `app.json`: opciones del **config plugin** de cada módulo (textos de propósito, `microphonePermission: false`…), `android.permissions` y `android.blockedPermissions`, o `ios.infoPlist`. `npx expo prebuild` genera el manifiesto y el Info.plist. | Funciones del módulo: `get…PermissionsAsync()` (consulta), `request…PermissionsAsync()` (pide) o el hook (`useCameraPermissions()`, `Location.useForegroundPermissions()`…). |
| **¿Qué pasa si se omite?** | Android: el pedido se deniega solo, **sin diálogo**. iOS: la app **se cierra** al intentar usar el recurso, y App Store Connect rechaza la build (ITMS-90683). | El recurso no se puede usar: la llamada falla o devuelve error. Si nunca se pide un permiso de tiempo de ejecución, nunca se concede. |

### A3. Verdadero o falso

- **a) F.** El diálogo lo dibuja **el sistema operativo**, no la app. Así una app no puede falsificarlo ni manipular los botones. La app solo puede mostrar su propia pantalla *previa*.
- **b) V.** Con Continuous Native Generation, `android/` e `ios/` se regeneran desde `app.json` y los config plugins. Lo que edites a mano en el `AndroidManifest.xml` se pierde con `prebuild --clean`.
- **c) F.** El `Info.plist` es parte del **binario nativo**. Una actualización OTA (`eas update`) solo cambia JavaScript y assets. Un permiso nuevo exige una **build nueva** y pasar por la tienda.
- **d) F.** Si el permiso no está en el manifiesto, Android **deniega el pedido sin mostrar el diálogo**.
- **e) F.** `expo-permissions` está **deprecado y eliminado** hace varios SDK. En SDK 57 cada módulo trae sus propias funciones y hooks (`useCameraPermissions`, `Location.requestForegroundPermissionsAsync`, etc.).
- **f) V.** Las notificaciones en iOS no llevan clave `NS…UsageDescription`. El diálogo tiene un texto fijo del sistema.
- **g) V.** Con fotos limitadas, `status` es `'granted'` y el matiz está en `accessPrivileges: 'limited'`.
- **h) F.** No es confiable: es lento, borra los datos de la app, y en iOS el sistema puede recordar la decisión de notificaciones si se reinstala enseguida. Lo confiable es resetear el permiso con `adb` en Android y con `xcrun simctl privacy` en el simulador de iOS (ver D6 d).

### A4. Los estados de un permiso

**a) Diagrama de estados**

```
ANDROID (11+)
                      ┌──────────── concede ───────────┐
                      │                                ▼
 Sin decidir ── request ──► diálogo ── deniega ──► Denegado ── request ──► diálogo ── deniega ──► Bloqueado
   (undetermined)             │                (denied, canAskAgain=true)       │                (denied, canAskAgain=false)
                              └── concede ──► Concedido ◄── concede ────────────┘                      │
                                              (granted)  ◄──────────── Ajustes ────────────────────────┘

iOS
 Sin decidir ── request ──► diálogo ── concede ──► Concedido
                              └────── deniega ──► Bloqueado (denied, canAskAgain=false)
                                                     └── solo se cambia desde Ajustes ──► Concedido
```

**Diferencia central:** iOS **pregunta una sola vez**. Después de un "No", el permiso queda bloqueado y solo se cambia desde Ajustes. Android tiene un estado intermedio "denegado pero se puede volver a pedir". Desde Android 11, **dos rechazos** equivalen a "no volver a preguntar".

**b) Qué devuelve Expo**

| Estado | `status` | `canAskAgain` | ¿Puede aparecer el diálogo? |
|---|---|---|---|
| Sin decidir | `'undetermined'` | `true` | Sí |
| Concedido | `'granted'` | `true` | No (no hace falta) |
| Denegado (se puede volver a pedir) | `'denied'` | `true` | Sí (solo Android) |
| Bloqueado | `'denied'` | `false` | No: hay que ir a Ajustes |

---

## Parte B · Android: tipos de permisos y manifiesto

### B1. Clasificá los permisos

| Permiso | Tipo | ¿Cómo se obtiene? |
|---|---|---|
| `INTERNET` | De instalación (normal) | Se concede solo al instalar si está en el manifiesto. |
| `CAMERA` | De tiempo de ejecución (peligroso) | Diálogo del sistema al pedirlo. |
| `VIBRATE` | De instalación | Automático al instalar. |
| `SYSTEM_ALERT_WINDOW` | Especial | La persona lo activa en Ajustes › "Mostrar sobre otras apps". La app abre esa pantalla con un intent. |
| `POST_NOTIFICATIONS` | De tiempo de ejecución (Android 13+) | Diálogo del sistema. En Android ≤ 12 no existe y las notificaciones están activas por defecto. |
| `ACCESS_NETWORK_STATE` | De instalación | Automático al instalar. |
| `READ_CONTACTS` | De tiempo de ejecución | Diálogo del sistema. |
| `SCHEDULE_EXACT_ALARM` | Especial (Android 12+) | La persona lo activa en Ajustes › "Alarmas y recordatorios". Desde Android 14 viene desactivado por defecto. |
| `RECORD_AUDIO` | De tiempo de ejecución | Diálogo del sistema. |
| `MANAGE_EXTERNAL_STORAGE` | Especial | Ajustes › "Acceso a todos los archivos". Google Play solo lo permite a apps cuya función principal lo necesita (exploradores de archivos, antivirus). |

### B2. Grupos y nombres

**a)** Un **grupo de permisos** junta permisos relacionados con el mismo recurso: ubicación, cámara, micrófono, contactos… El sistema muestra **un solo diálogo** por grupo. Si la app pide `ACCESS_FINE_LOCATION` y `ACCESS_COARSE_LOCATION` juntos, la persona ve **un único diálogo**. Desde Android 12 ese diálogo incluye la opción "Precisa" / "Aproximada".

**b)** El prefijo es `android.permission.`. El permiso de cámara es `android.permission.CAMERA`.

**c)** Los **permisos de firma** (signature) se conceden solo si la app está firmada con **el mismo certificado** que la app que define el permiso, por ejemplo el sistema o el fabricante. Las apps comunes no pueden obtenerlos porque no tienen ese certificado. Están pensados para apps del sistema o para comunicar apps del mismo desarrollador.

### B3. Leé el manifiesto

**a)**
- **Se conceden solos al instalar:** `INTERNET`.
- **Hay que pedir en tiempo de ejecución:** `CAMERA`, `ACCESS_COARSE_LOCATION` / `ACCESS_FINE_LOCATION`, `POST_NOTIFICATIONS` (Android 13+) y `READ_EXTERNAL_STORAGE` (solo hasta Android 12L).
- **No llega al manifiesto final:** `RECORD_AUDIO`, porque tiene `tools:node="remove"`.

**b)** `android:maxSdkVersion="32"` declara el permiso **solo hasta API 32** (Android 12L). En Android 13 (API 33) o superior no aparece. Desde Android 13 lo reemplazan `READ_MEDIA_IMAGES`, `READ_MEDIA_VIDEO` y `READ_MEDIA_AUDIO`. Desde Android 14 se suma `READ_MEDIA_VISUAL_USER_SELECTED` para el acceso parcial.

**c)** `tools:node="remove"` le indica a la fusión de manifiestos que **elimine** ese permiso aunque lo declare una librería. Se genera así:

```json
{
  "expo": {
    "android": {
      "blockedPermissions": ["android.permission.RECORD_AUDIO"]
    }
  }
}
```

**d)** Va en `expo.android.permissions`:

```json
{ "expo": { "android": { "permissions": ["android.permission.SCHEDULE_EXACT_ALARM"] } } }
```

**e)** Porque en Expo la carpeta `android/` es **generada** (Continuous Native Generation). Cada `npx expo prebuild --clean` la regenera desde `app.json`, y los cambios hechos a mano se pierden. La fuente de verdad es `app.json` con los config plugins. `blockedPermissions` **no funciona en Expo Go**: Expo Go es una app ya compilada, con su propio manifiesto. Solo tiene efecto en una development build o una build de producción.

### B4. Así pregunta Android

**a)** **No.** El diálogo de Android tiene un texto fijo del sistema. El "para qué" se explica **en la propia app**: una pantalla previa con el beneficio, mostrada justo cuando la persona toca la función. En la app es [src/components/pantalla-previa.tsx](src/components/pantalla-previa.tsx).

**b)**
- **"Mientras la app está en uso"** concede el permiso de forma permanente, pero solo mientras la app está en primer plano.
- **"Solo esta vez"** es temporal: vale mientras la app está abierta, y al cerrarla (o poco después de que pase a segundo plano) vuelve a "sin decidir".
- "Solo esta vez" existe desde Android 11 para **ubicación, cámara y micrófono**.

**c)** El segundo "No permitir" equivale a **"no volver a preguntar"**. `canAskAgain` pasa a `false`, y los siguientes `request…()` devuelven `denied` al instante, sin diálogo.

**d)**
- **Anda bien con ubicación aproximada:** el clima, noticias de tu ciudad, ordenar sucursales por zona.
- **No anda:** navegación paso a paso, un delivery hasta la puerta, o marcar en qué sector del edificio está un desperfecto. En la app, con ubicación aproximada no mostramos coordenadas: mostramos "Ubicación aproximada" y pedimos el sector a mano.

**e)** Android **mata el proceso** de la app. Al volver, la app se reinicia y se pierde el estado en memoria que no se haya guardado.

### B5. Android, versión por versión

| Cambio | Versión (API) | Qué implica para el código |
|---|---|---|
| Nacen los permisos en tiempo de ejecución | Android 6.0 (API 23) | Hay que pedir los permisos peligrosos al usarlos y manejar la denegación. Ya no alcanza con el manifiesto. |
| La ubicación en segundo plano pasa a ser un permiso aparte | Android 10 (API 29) | Hace falta `ACCESS_BACKGROUND_LOCATION`. Desde Android 11 se pide **después** de la de primer plano y la persona la concede en Ajustes ("Permitir todo el tiempo"). |
| Dos rechazos equivalen a "no volver a preguntar" | Android 11 (API 30) | Después de dos "No", `canAskAgain = false`. Hay que ofrecer "Abrir Ajustes" y una alternativa. También llegan los permisos de "Solo esta vez". |
| Ubicación precisa o aproximada | Android 12 (API 31) | Pedir FINE y COARSE juntos y revisar `android.accuracy` (`'fine'` o `'coarse'`). La app tiene que funcionar con la aproximada. |
| Las notificaciones pasan a ser un permiso (`POST_NOTIFICATIONS`) | Android 13 (API 33) | Pedirlo en tiempo de ejecución y **crear un canal antes** de pedir. |
| Acceso parcial a fotos y videos ("Seleccionar fotos") | Android 14 (API 34) | `READ_MEDIA_VISUAL_USER_SELECTED`. Contemplar el acceso limitado o, mejor, usar el selector del sistema. |
| Permiso de red local (`ACCESS_LOCAL_NETWORK`) | Android 17 (API 37) | Las apps que hablan con dispositivos de la red local (IoT, Chromecast, impresoras) tienen que declararlo y pedirlo. Si no, las conexiones a la LAN fallan. |

**`targetSdkVersion`** es el nivel de API para el que la app está diseñada y probada. El sistema activa los cambios de comportamiento de cada versión según ese número: por ejemplo, el permiso de notificaciones se aplica a las apps con target 33 o más. **Expo SDK 57 apunta a API 36 (Android 16)**: lo verifiqué en `react-native/gradle/libs.versions.toml`, que tiene `targetSdk = "36"` y `minSdk = "24"`. **Google Play exige desde el 31 de agosto de 2026** que las apps nuevas y las actualizaciones apunten a **API 36** o superior.

---

## Parte C · iOS: textos de propósito y acceso parcial

### C1. Claves del Info.plist

| Recurso | Clave en Info.plist |
|---|---|
| Cámara | `NSCameraUsageDescription` |
| Micrófono | `NSMicrophoneUsageDescription` |
| Ubicación en uso | `NSLocationWhenInUseUsageDescription` |
| Ubicación siempre | `NSLocationAlwaysAndWhenInUseUsageDescription`, además de la de "en uso" |
| Fotos (leer) | `NSPhotoLibraryUsageDescription` |
| Fotos (solo guardar) | `NSPhotoLibraryAddUsageDescription` |
| Contactos | `NSContactsUsageDescription` |
| Face ID | `NSFaceIDUsageDescription` |
| Rastreo entre apps (ATT) | `NSUserTrackingUsageDescription` |
| Notificaciones | **No lleva clave** |

### C2. Sin texto, no hay permiso

**a)**
- **Al usar la cámara:** si falta el texto, la app **se cierra al instante** con el mensaje *"This app has crashed because it attempted to access privacy-sensitive data without a usage description"*.
- **Al subir la build:** App Store Connect la rechaza con **ITMS-90683: Missing purpose string in Info.plist**.

**b)** iOS muestra el diálogo **una sola vez** por permiso. Si la persona dice que no, a la app solo le queda:
- explicar para qué sirve el permiso;
- ofrecer **"Abrir Ajustes"** (`Linking.openSettings()`);
- dar un **camino alternativo** para que la función siga siendo usable.

**c)**
- **Lo arma el sistema:** el título ("“Mantenimiento IPF” quiere acceder a la cámara") y los botones.
- **Lo escribís vos:** el texto de propósito, que aparece debajo del título.
- **En Expo:** se configura en `app.json`, en las opciones del config plugin del módulo (`"cameraPermission": "Usamos tu cámara para…"`) o en `ios.infoPlist`.

**d)** Apple analiza el **binario**. Si una librería enlaza código que usa una API protegida, la build necesita la clave aunque tu app nunca la llame. Se resuelve de dos maneras:
- configurando la librería para que no incluya esa parte, cuando su plugin lo permite;
- agregando la clave con un texto honesto.

Si la librería usa APIs de "motivo requerido", también hay que declararlas en el manifiesto de privacidad.

### C3. Probador de textos de propósito

| Texto propuesto | ¿Aprobado? | Versión mejorada |
|---|---|---|
| "Necesitamos tu ubicación." | No: no dice para qué. | "Usamos tu ubicación para mostrarte las farmacias de turno más cercanas." |
| "Para mejorar tu experiencia." | No: es vago y no nombra el dato ni el beneficio. | "Usamos tu ubicación para ordenar los comercios según la distancia a vos." |
| "Usamos tu ubicación para mostrarte las farmacias de turno más cercanas." | **Sí**: nombra el dato y un beneficio concreto. | — |
| "La app no funciona sin ubicación." | No: es una amenaza, no explica el uso, y la app debería funcionar igual. | "Usamos tu ubicación para encontrar el punto de retiro más cercano. También podés buscarlo por barrio." |
| "Ubicación requerida por el sistema." | No: es falso. El sistema no la requiere, la pide la app. | "Usamos tu ubicación para avisarte cuándo llega el colectivo a tu parada." |

### C4. Acceso parcial y gradual

| Caso | iOS | En Expo |
|---|---|---|
| Fotos limitadas ("Seleccionar fotos") | iOS 14 | `accessPrivileges === 'limited'` en la respuesta de `MediaLibrary` / `ImagePicker.getMediaLibraryPermissionsAsync()`. Para cambiar la selección: `MediaLibrary.presentPermissionsPickerAsync()`. |
| Ubicación aproximada (interruptor "Precisa") | iOS 14 | `permiso.ios.accuracy === 'reduced'` en `Location.getForegroundPermissionsAsync()`. |
| "Permitir una vez" (ubicación) | iOS 13 | Durante la sesión devuelve `status: 'granted'` con `ios.scope: 'whenInUse'`. Al cerrar la app vuelve a `'undetermined'`. |
| Ubicación escalonada: de "al usar la app" a "Siempre" | iOS 13 | Primero `requestForegroundPermissionsAsync()` y después `requestBackgroundPermissionsAsync()`. Se mira `ios.scope` (`'whenInUse'` o `'always'`). |
| Notificaciones provisionales | iOS 12 | `Notifications.requestPermissionsAsync({ ios: { allowProvisional: true } })`. Se detecta con `ios.status === IosAuthorizationStatus.PROVISIONAL`. |
| Rastreo entre apps (App Tracking Transparency) | iOS 14 (obligatorio desde 14.5) | `expo-tracking-transparency`: `requestTrackingPermissionsAsync()` / `useTrackingPermissions()`. |

**Versión mínima de iOS de Expo SDK 57:** **iOS 16.4**. Lo verifiqué en `Expo.podspec` y `ExpoModulesCore.podspec`, que tienen `:ios => '16.4'`. **Consecuencia práctica:** todas las funciones de la tabla (iOS 12 a 14.5) existen siempre en los dispositivos donde corre la app. No hace falta preguntar la versión de iOS: hay que contemplar **todos** esos matices siempre.

### C5. Android vs iOS, lado a lado

| | Android | iOS |
|---|---|---|
| ¿Dónde se declara? | `AndroidManifest.xml` (`<uses-permission>`). En Expo, `app.json` y los plugins. | `Info.plist` (claves `NS…UsageDescription`). En Expo, `app.json` y los plugins. |
| Texto en el diálogo | Fijo del sistema. No se puede personalizar. | Título del sistema más **tu texto de propósito** (obligatorio). |
| Oportunidades para preguntar | Dos (Android 11+). Después queda bloqueado. | Una. Después queda bloqueado. |
| "Solo esta vez" / "Permitir una vez" | Android 11+: ubicación, cámara y micrófono. | iOS 13+: solo ubicación. |
| Notificaciones | Permiso de tiempo de ejecución desde Android 13 (`POST_NOTIFICATIONS`). Antes, activas por defecto. Requieren canal. | Siempre hay que pedirlas. No llevan texto en el Info.plist. Existe el modo provisional. |
| Ubicación en segundo plano | Permiso aparte (`ACCESS_BACKGROUND_LOCATION`). Se concede en Ajustes ("Permitir todo el tiempo") y Google Play pide una declaración. | Clave "Always" más `UIBackgroundModes: location`. Es escalonada: primero "en uso", después "siempre", y el sistema le recuerda a la persona que la app la usa. |
| Si falta la declaración | El pedido se deniega **sin diálogo**. | La app **se cierra**, y la tienda rechaza la build (ITMS-90683). |

---

## Parte D · Expo: una API, dos plataformas

### D1. Módulos y funciones

| Necesidad | Módulo | Hook / función de permiso |
|---|---|---|
| Escanear un QR con la cámara | `expo-camera` | `useCameraPermissions()` |
| Grabar video con sonido | `expo-camera` | `useCameraPermissions()` + `useMicrophonePermissions()` |
| Mostrar farmacias cercanas | `expo-location` | `Location.useForegroundPermissions()` / `requestForegroundPermissionsAsync()` |
| Seguir un envío con la app en segundo plano | `expo-location` + `expo-task-manager` | `requestForegroundPermissionsAsync()` y **después** `requestBackgroundPermissionsAsync()` (o `useBackgroundPermissions()`) |
| Mostrar un recordatorio | `expo-notifications` | `getPermissionsAsync()` / `requestPermissionsAsync()` |
| Grabar una nota de voz | `expo-audio` | `requestRecordingPermissionsAsync()` |
| Galería propia dentro de la app | `expo-media-library` | `MediaLibrary.usePermissions()` / `requestPermissionsAsync()` |
| Publicidad personalizada entre apps (iOS) | `expo-tracking-transparency` | `useTrackingPermissions()` / `requestTrackingPermissionsAsync()` |

Un tutorial que usa `import * as Permissions from 'expo-permissions'` está **desactualizado**: es de un SDK viejo, porque ese paquete fue deprecado y eliminado. Probablemente el resto del código tampoco funcione en SDK 57.

### D2. Consultar, pedir y el hook

**a)** `get…PermissionsAsync()` **solo consulta** el estado actual y **nunca** muestra un diálogo. `request…PermissionsAsync()` **pide**: es la única que **puede** mostrar el diálogo, y solo si el sistema todavía lo permite.

**b)** Los tres elementos del hook:
1. `permiso`: la `PermissionResponse`, o `null`.
2. `pedirPermiso`: la función de request.
3. `consultarPermiso`: la función de get.

En el **primer render** `permiso` vale **`null`**, porque la consulta es asíncrona. Mientras tanto la pantalla tiene que mostrar un **indicador de carga**: no hay que decidir nada ni leer `permiso.status`.

**c)** Si `canAskAgain` es `false`, `request…()` **devuelve `denied` enseguida, sin diálogo**. Si se lo llama en un bucle (por ejemplo, en el cuerpo del componente o en un efecto que se repite), se generan pedidos y renders infinitos. La pantalla queda trabada en "Pidiendo permiso…", y en Android además se queman los dos intentos sin que la persona lo decida.

### D3. Leé la respuesta

| Respuesta | Qué hace la app |
|---|---|
| `null` | Todavía no sabe nada: muestra un indicador de carga. |
| `{ status: 'granted', granted: true }` | Usa la función directamente (muestra la cámara, toma la ubicación…). |
| `{ status: 'undetermined', canAskAgain: true }` | Cuando la persona toca la función, muestra la **pantalla previa** con "Continuar" y después pide. |
| `{ status: 'denied', canAskAgain: true }` | No insiste sola. Ofrece la alternativa. Si la persona vuelve a tocar la función, muestra otra vez la pantalla previa con "Continuar" (en Android queda un intento). |
| `{ status: 'denied', canAskAgain: false }` | **Bloqueado.** Explica cómo habilitarlo, muestra el botón **"Abrir Ajustes"** y ofrece la alternativa. |
| `{ status: 'granted', accessPrivileges: 'limited' }` | Funciona con las fotos elegidas. Ofrece "Elegir más fotos" (`presentPermissionsPickerAsync`), sin bloquear. |
| `{ status: 'granted', android: { accuracy: 'coarse' } }` | Usa la ubicación como **aproximada**: no muestra coordenadas exactas y, si hace falta precisión, ofrece elegir a mano (en la app, el sector). |

**Los dos campos que deciden casi todo:**
- **`granted`** responde *¿puedo usar el recurso ahora?*
- **`canAskAgain`** responde *¿puedo mostrar el diálogo, o tengo que mandar a Ajustes?*

### D4. Simulación del ciclo completo

Android 14, app recién instalada, `expo-location`:

| # | Acción | status | canAskAgain | ¿Diálogo? |
|---|---|---|---|---|
| 1 | `getForegroundPermissionsAsync()` | `undetermined` | `true` | No |
| 2 | `requestForegroundPermissionsAsync()` → "No permitir" | `denied` | `true` | Sí |
| 3 | `requestForegroundPermissionsAsync()` → "No permitir" | `denied` | `false` | Sí |
| 4 | `requestForegroundPermissionsAsync()` | `denied` | `false` | **No** |
| 5 | `Linking.openSettings()` → habilita "Mientras la app está en uso" → vuelve y la app consulta | `granted` | `true` | No |
| 6 | Igual que el 5, pero la app **no** vuelve a consultar | Sigue mostrando `denied` / `false`: la pantalla dice "bloqueado" aunque el permiso ya está concedido | — | No |

**En iOS** el resultado cambia en el **paso 2**. Después del primer "No permitir" queda `denied` con `canAskAgain: false`, porque iOS pregunta **una sola vez**. En los pasos 3 y 4 ya no aparece diálogo.

Si la persona elige **"Permitir una vez"**, durante esa sesión el permiso está concedido. Al cerrar y reabrir la app vuelve a **`undetermined`** (`canAskAgain: true`), así que el diálogo puede aparecer de nuevo.

### D5. Configurar app.json

```json
{
  "expo": {
    "plugins": [
      [
        "expo-camera",
        {
          "cameraPermission": "Usamos tu cámara para leer el QR del contenedor y decirte qué se puede reciclar ahí.",
          "microphonePermission": false,
          "recordAudioAndroid": false,
          "barcodeScannerEnabled": true
        }
      ],
      [
        "expo-location",
        {
          "locationWhenInUsePermission": "Usamos tu ubicación para mostrarte los puntos de reciclaje más cercanos.",
          "locationAlwaysAndWhenInUsePermission": false,
          "locationAlwaysPermission": false,
          "isIosBackgroundLocationEnabled": false,
          "isAndroidBackgroundLocationEnabled": false
        }
      ]
    ],
    "android": {
      "blockedPermissions": [
        "android.permission.SYSTEM_ALERT_WINDOW",
        "android.permission.RECORD_AUDIO",
        "android.permission.ACCESS_BACKGROUND_LOCATION"
      ]
    }
  }
}
```

`expo-camera` agrega `RECORD_AUDIO` en Android **por defecto** porque `CameraView` también puede **grabar video con sonido** (`recordAsync`). La librería no sabe si vas a usar esa función, así que declara el permiso salvo que pongas `recordAudioAndroid: false`.

### D6. Expo Go no es tu app

**a)** Porque Expo Go es **otra app**, ya compilada, con su propio `Info.plist` y su propio manifiesto. Tu `app.json` no cambia sus archivos nativos, así que el diálogo muestra los textos de Expo Go, no los tuyos.

**b)**
- **Expo Go alcanza para probar:** el flujo de pantallas, la cámara, la ubicación en primer plano, el selector de fotos y las notificaciones locales.
- **Necesitás una development build para:**
  - **notificaciones push en Android**, que Expo Go ya no soporta;
  - **ubicación en segundo plano**, que necesita `UIBackgroundModes`, tareas y permisos propios;
  - ver **tus textos de propósito**;
  - probar `blockedPermissions` y los config plugins;
  - cualquier módulo nativo que no venga en Expo Go.

**c)**

```bash
npx expo prebuild --clean                 # genera android/ e ios/ para ver el manifiesto y el Info.plist
npx expo install expo-dev-client          # cliente de desarrollo
npx expo run:android                      # development build local
# o en la nube:
npx eas-cli@latest build --profile development --platform android
```

**d)**

```bash
# Android (adb): revocar y limpiar los flags de "el usuario decidió"
adb shell pm revoke ar.edu.ipf.mantenimiento android.permission.CAMERA
adb shell pm clear-permission-flags ar.edu.ipf.mantenimiento android.permission.CAMERA user-set user-fixed

# Simulador de iOS
xcrun simctl privacy booted reset camera ar.edu.ipf.mantenimiento
xcrun simctl privacy booted reset all ar.edu.ipf.mantenimiento   # todos los permisos
```

---

## Parte E · Recetas: leer y corregir código

### E1. Encontrá los errores (cámara)

Problemas:
1. **`permiso` es `null` en el primer render.** `permiso.status` tira `TypeError` y la app se cierra. Falta el estado **cargando**.
2. **No contempla el bloqueo** (`canAskAgain: false`). El botón llama a `pedirPermiso`, que no muestra nada, y la persona queda trabada. Falta **"Abrir Ajustes"**.
3. **El botón dice "Permitir".** Tiene que decir **"Continuar"**: la decisión real está en el diálogo del sistema.
4. **No se entera si el permiso cambia en Ajustes:** falta revisarlo al volver (AppState).
5. **No hay alternativa** si se deniega: debería poder escribirse el código del aula a mano.
6. Detalles: `Explicacion` no está importado, `CameraView` no tiene `barcodeScannerSettings` ni `onBarcodeScanned` (no lee el QR), y `onPress={pedirPermiso}` le pasa el evento como argumento.

Versión corregida (la de la app está en [src/app/reporte/escanear.tsx](src/app/reporte/escanear.tsx)):

```tsx
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Button, Linking, Text, TextInput, View } from 'react-native';

import { Explicacion } from '@/components/explicacion';
import { useRevisarAlVolver } from '@/hooks/useRevisarAlVolver';

export default function Escanear() {
  const [permiso, pedirPermiso, consultarPermiso] = useCameraPermissions();
  const [codigo, setCodigo] = useState('');
  useRevisarAlVolver(consultarPermiso);

  const usarCodigo = (valor: string) => {
    /* guardar el aula */
    router.back();
  };

  const alternativa = (
    <View>
      <TextInput placeholder="Código del aula" value={codigo} onChangeText={setCodigo} />
      <Button title="Usar este código" onPress={() => usarCodigo(codigo)} />
    </View>
  );

  // 1. Cargando
  if (!permiso) return <ActivityIndicator />;

  // 2. Concedido
  if (permiso.granted) {
    return (
      <CameraView
        style={{ flex: 1 }}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={({ data }) => usarCodigo(data)}
      />
    );
  }

  // 3. Preguntable
  if (permiso.canAskAgain) {
    return (
      <Explicacion texto="Usamos la cámara para leer el QR del aula.">
        <Button title="Continuar" onPress={() => pedirPermiso()} />
        {alternativa}
      </Explicacion>
    );
  }

  // 4. Bloqueado
  return (
    <Explicacion texto="La cámara está desactivada. Activala en Ajustes › Mantenimiento IPF › Cámara.">
      <Button title="Abrir Ajustes" onPress={() => Linking.openSettings()} />
      {alternativa}
    </Explicacion>
  );
}
```

### E2. El orden importa (ubicación)

**a)** Pide **segundo plano antes que primer plano**. La ubicación "siempre" se construye sobre la de "en uso", así que primero hay que tener la de primer plano.
- **En iOS**, sin la autorización "en uso" previa el pedido de background no muestra el diálogo correcto y se deniega. La escalada a "Siempre" solo existe desde "al usar la app".
- **En Android 11+**, pedir `ACCESS_BACKGROUND_LOCATION` sin tener la de primer plano se ignora o se deniega **sin diálogo**. Además, el background nunca se concede con un diálogo: la persona tiene que elegir "Permitir todo el tiempo" en Ajustes.

En los dos casos la función devuelve `false` y nunca llega a pedir la de primer plano.

**b)**

```ts
import * as Location from 'expo-location';

export async function activarSeguimiento() {
  const enUso = await Location.requestForegroundPermissionsAsync();
  if (!enUso.granted) return false;

  // Recién ahora, y solo si la función lo justifica de verdad, se escala a "siempre".
  const siempre = await Location.requestBackgroundPermissionsAsync();
  return siempre.granted;
}
```

**c)** En la app ([src/lib/ubicacion.ts](src/lib/ubicacion.ts)) la función usa `get…` en lugar de `request…`, porque el pedido se hace antes, con la pantalla previa. Esta versión es la autónoma que pide la consigna:

```ts
import * as Location from 'expo-location';

export type Coordenadas = { latitud: number; longitud: number; aproximada: boolean };

export async function obtenerUbicacion(): Promise<Coordenadas | null> {
  try {
    const permiso = await Location.requestForegroundPermissionsAsync();
    if (!permiso.granted) return null;

    const aproximada =
      permiso.android?.accuracy === 'coarse' || // Android 12+: "Aproximada"
      permiso.ios?.accuracy === 'reduced';      // iOS 14+: interruptor "Precisa" apagado

    const { coords } = await Location.getCurrentPositionAsync({
      accuracy: aproximada ? Location.Accuracy.Low : Location.Accuracy.Balanced,
    });
    return { latitud: coords.latitude, longitud: coords.longitude, aproximada };
  } catch {
    return null; // GPS apagado, timeout, etc.: nunca rompe la app
  }
}
```

**d)** **No.** Para mostrar farmacias cercanas alcanza con primer plano: la persona mira la lista con la app abierta. Si se pide segundo plano, Google Play exige:
- una **declaración de permisos** en la Play Console que justifique por qué es una función central de la app, con un **video** que lo muestre;
- una **divulgación destacada** dentro de la app antes de pedirlo.

Si no se justifica, la app se rechaza.

### E3. Notificaciones mudas

**a)** La causa más probable es que **no se creó ningún canal de notificaciones** antes de pedir el permiso. En Android 13+ el diálogo de `POST_NOTIFICATIONS` no aparece si la app no tiene al menos un canal. Antes de pedir hay que llamar a `Notifications.setNotificationChannelAsync('reportes', {...})` (en la app: [src/lib/notificaciones.ts](src/lib/notificaciones.ts)). También puede ser que la persona ya lo haya rechazado dos veces (`canAskAgain: false`).

**b)** En Android 12 o anterior el permiso **no existe**: las notificaciones están permitidas por defecto. `requestPermissionsAsync()` devuelve `granted` sin diálogo, y la persona solo puede desactivarlas desde Ajustes.

**c)** Las **notificaciones provisionales** (iOS 12+): se piden con `requestPermissionsAsync({ ios: { allowProvisional: true } })`. No muestran diálogo, y las notificaciones llegan en silencio al Centro de notificaciones con la opción de mantenerlas o desactivarlas. En código se detecta con `permiso.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL`.

**d)** Conviene pedirlo **cuando la persona entiende para qué sirve**, en el momento en que lo necesita.
- **Buen momento:** al activar "Avisarme cuando se resuelva mi reporte" o al reservar un turno ("¿Te avisamos un día antes?").
- **Mal momento:** apenas se abre la app por primera vez, en la pantalla de bienvenida, sin contexto.

### E4. Fotos sin pedir permiso

| Necesidad | Herramienta | Permiso |
|---|---|---|
| Elegir una foto de perfil | `ImagePicker.launchImageLibraryAsync()` (selector del sistema) | **Ninguno** |
| Sacar una foto en el momento | `ImagePicker.launchCameraAsync()` (o `CameraView`) | **Cámara** |
| Editor que muestra toda la galería | `expo-media-library` | Galería completa: `READ_MEDIA_IMAGES` / `READ_MEDIA_VIDEO` en Android, `NSPhotoLibraryUsageDescription` en iOS |
| Adjuntar la foto de un comprobante | `ImagePicker.launchImageLibraryAsync()` o `expo-document-picker` | **Ninguno** |

Google Play restringe `READ_MEDIA_IMAGES` y `READ_MEDIA_VIDEO` porque dan acceso a **todas** las fotos y videos de la persona, y la mayoría de las apps solo necesita una foto puntual. Desde la política de Fotos y videos (anunciada en 2023 y exigida durante 2024–2025), solo las apps cuya **función principal** es la galería o la edición pueden pedirlos, con una declaración. El resto tiene que usar el **Photo Picker** del sistema.

**"El mejor permiso es el que no se pide":** si una herramienta del sistema resuelve la necesidad sin permiso, como el selector de fotos, es la mejor opción para la privacidad, para la tienda y para la experiencia.

### E5. Volver de Ajustes

(Versión de la app: [src/hooks/useRevisarAlVolver.ts](src/hooks/useRevisarAlVolver.ts).)

```ts
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

export function useRevisarAlVolver(revisar: () => void) {
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
```

**a)** Los hooks de Expo consultan el permiso **al montarse** y después solo cambian cuando la app llama a `request` o `get`. El sistema **no le avisa** a JavaScript que la persona cambió algo en Ajustes. Además, si lo concede, Android no reinicia la app, así que el estado queda viejo.

**b)** La tercera función del hook, la que **consulta**: `consultarPermiso` (el `getPermission` de `useCameraPermissions()`).

**c)** Porque la persona puede cambiar el permiso **en cualquier momento** desde Ajustes, y el sistema también puede resetearlo: "Solo esta vez", o el auto-reset de apps sin uso en Android 11+. Un valor guardado "para siempre" queda desactualizado. La fuente de verdad es siempre el sistema operativo, y hay que **volver a consultar**.

---

## Parte F · Buenas prácticas y tiendas

### F1. Pedir en contexto

| App y permiso | ¿Cuándo pedirlo? | Alternativa si lo deniegan |
|---|---|---|
| Delivery · ubicación | Al tocar "Usar mi ubicación actual" mientras se carga la dirección de entrega. | Escribir la dirección o elegir una guardada. |
| Billetera virtual · cámara | Al tocar "Pagar con QR". | Ingresar el alias, CVU o código del comercio a mano. |
| Red social · contactos | Al tocar "Buscar amigos de mi agenda". | Buscar por nombre de usuario o compartir un link de invitación. |
| Mensajería · micrófono | La primera vez que se mantiene apretado el botón de nota de voz. | Escribir el mensaje. |
| Turnos médicos · notificaciones | Después de reservar un turno: "¿Te avisamos un día antes?". | Ver los turnos en la app, agregarlos al calendario, o avisos por mail o SMS. |
| Editor de fotos · galería completa | Al abrir la sección "Galería" del editor. | Elegir fotos sueltas con el selector del sistema, o trabajar con acceso limitado. |

Pedir cuatro permisos apenas se abre la app **"entrena el No permitir automático"** porque la persona ve una seguidilla de diálogos sin contexto, sin saber para qué sirven ni haber usado la app. Aprende a tocar "No permitir" por reflejo para sacárselos de encima. Como iOS pregunta una sola vez y Android dos, esos "no" quedan como bloqueos, y después ya no se puede pedir el permiso cuando sí hacía falta.

### F2. La pantalla previa

**a)** Los tres elementos (en la app: [src/components/pantalla-previa.tsx](src/components/pantalla-previa.tsx)):
1. El **beneficio en una frase**: qué gana la persona al conceder el permiso.
2. **Un único botón "Continuar"**, que lleva al diálogo del sistema.
3. La **aclaración de que se puede cambiar después en Ajustes**.

**b)** Porque la decisión real se toma en el **diálogo del sistema**, no en nuestra pantalla. "Permitir" confunde: la persona cree que ya aceptó, y además se puede interpretar como presión. "Continuar" es honesto: solo avanza hacia la pregunta del sistema.

**c)** La pauta 5.1.1(iv) pide **respetar la decisión de la persona y no manipularla ni presionarla** para que conceda acceso. Para las pantallas previas, eso significa que tienen que **llevar siempre al diálogo del sistema**. Un botón "Ahora no" o "Cerrar" que evita o posterga el diálogo es motivo de rechazo: la persona decide en el diálogo del sistema, no en el nuestro.

**d)** Si el permiso ya está bloqueado, el diálogo no puede aparecer. La pantalla:
- dice que el permiso está desactivado;
- muestra **cómo habilitarlo**, con la ruta exacta en Ajustes según la plataforma;
- cambia el botón a **"Abrir Ajustes"**;
- recuerda la alternativa para seguir sin el permiso.

### F3. Mínimo privilegio

**a)** **Aproximada.** Para los puntos de reciclaje del barrio alcanza una precisión de unos pocos km²; no hace falta saber en qué casa está la persona.

**b)** **"En uso"**, con el seguimiento iniciado por la persona desde la app:
- En Android, un **servicio en primer plano** (con su notificación visible) sigue recibiendo ubicación con el celular en el bolsillo y la pantalla apagada.
- En iOS, el modo de fondo de ubicación mantiene la sesión que se inició en primer plano, con el indicador visible.

"Siempre" solo haría falta para registrar la carrera sin que la persona la haya iniciado.

**c)** **Selector del sistema.** Se sube una sola foto elegida por la persona; no hace falta acceso a toda la galería.

**d)** **Sin micrófono** (`microphonePermission: false`, `recordAudioAndroid: false`). Escanear un QR no graba audio.

### F4. Tiendas

**a)**
- **Google Play:**
  1. completar la sección **Seguridad de los datos** (Data safety);
  2. presentar **declaraciones de permisos sensibles** (ubicación en segundo plano, acceso a todos los archivos, fotos y videos, SMS) con la justificación de que son una función central;
  3. cumplir el nivel de API objetivo mínimo;
  4. tener una política de privacidad.
- **App Store:**
  1. **textos de propósito** en el Info.plist para cada recurso protegido (5.1.1);
  2. las **"etiquetas de privacidad"** (App Privacy) en App Store Connect;
  3. el **manifiesto de privacidad**;
  4. pedir permiso con **ATT** antes de rastrear entre apps.

**b)** `PrivacyInfo.xcprivacy` es un archivo que declara:
- qué datos recolecta la app y para qué;
- si hace rastreo, y los dominios de rastreo;
- qué **APIs de "motivo requerido"** usa (`UserDefaults`, fechas de archivos, tiempo de arranque del sistema, espacio en disco), con el motivo de cada una.

Apple lo exige desde mayo de 2024. En Expo se configura en `app.json`, en **`expo.ios.privacyManifests`** (por ejemplo, `NSPrivacyAccessedAPITypes`), y se genera al hacer prebuild o build.

**c)** Android 17 suma un **selector de contactos del sistema**: la persona elige contactos puntuales y la app los recibe **sin** pedir `READ_CONTACTS`. Desde el **27/01/2027**, Google Play va a exigir que las apps que hoy piden `READ_CONTACTS` usen ese selector. Solo podrán seguir pidiendo el permiso las apps cuya función principal necesite toda la agenda, presentando una **declaración** en la Play Console.

### F5. Errores comunes

**a)**
- **Causa:** falta el **texto de propósito** del recurso en el Info.plist.
- **Solución:** agregarlo en el plugin del módulo en `app.json` (o en `ios.infoPlist`) con el molde "Usamos tu [dato] para [beneficio]", y **hacer una build nueva**. No alcanza con una OTA.

**b)**
- **Causa:** el permiso **no está declarado en la build**. Expo Go lo tiene declarado en su propio manifiesto, pero en la development build falta el plugin, o quedó en `blockedPermissions`. Android deniega sin diálogo lo que no está en el manifiesto. También puede haber quedado bloqueado de una prueba anterior.
- **Solución:** agregar el plugin o permiso en `app.json`, hacer `npx expo prebuild --clean` y recompilar. Revisar el `AndroidManifest.xml` generado y resetear el permiso con `adb`.

**c)**
- **Causa:** la app **no vuelve a consultar** el permiso al regresar de Ajustes. El estado que tiene en memoria quedó viejo.
- **Solución:** escuchar `AppState` (`background → active`) y llamar a `get…PermissionsAsync()` o a la función de consulta del hook (`useRevisarAlVolver`).

**d)**
- **Causa:** llamar a `request…()` en el cuerpo del render. Cada respuesta actualiza el estado, eso provoca otro render, que pide de nuevo: un bucle infinito. Si el permiso está bloqueado, `request` responde al instante y el bucle es todavía más rápido.
- **Solución:** pedir **solo en un manejador de evento** (`onPress` del botón "Continuar"). Mostrar los cuatro estados (cargando, concedido, preguntable, bloqueado) según la respuesta.

**e)**
- **Causa:** la app trata un permiso **no esencial** como obligatorio. Va contra el principio de "la app nunca se bloquea" y contra la pauta 5.1.1 de Apple, que pide que la app funcione sin los permisos que no son imprescindibles.
- **Solución:**
  - dejar entrar igual;
  - mostrar los avisos en una **bandeja dentro de la app** (como `/avisos` en Mantenimiento IPF);
  - ofrecer activar las notificaciones en contexto (por ejemplo, al reservar un turno), con un recordatorio discreto y no invasivo.
