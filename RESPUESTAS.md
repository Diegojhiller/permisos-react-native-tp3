# TP3 - Permisos móviles: respuestas de las Partes A a F

Taller Complementario - React Native II - Instituto Politécnico Formosa


## PARTE A - ¿Qué es un permiso y por qué existe?

### A1. Conceptos

a) Un permiso es la autorización que la persona le da a una app para usar algo protegido del celular, como la cámara, la ubicación o los contactos.
- La app avisa qué necesita y lo pide cuando lo va a usar.
- El sistema operativo es el que controla: muestra el cartel para preguntar, guarda la respuesta y no deja usar el recurso si no hay permiso.
- La persona usuaria es la que decide si acepta o no, y después puede cambiarlo desde Ajustes.

b) La caja de arena (sandbox) es el encierro en el que vive cada app. Cada app tiene su propio espacio y no puede tocar los datos de otras apps ni el hardware sensible. Los permisos son la forma controlada de salir de esa caja. Sin ningún permiso, una app igual puede mostrar sus pantallas, guardar archivos en su propio espacio, usar internet (en Android se da solo al instalar) y usar el selector de fotos del sistema, porque ahí la que elige es la persona.

c) Las cuatro razones por las que existen los permisos:
1. Privacidad: una app de linterna no tiene por qué ver mis contactos.
2. Seguridad: que una app maliciosa no pueda grabarme con el micrófono a escondidas.
3. Control de la persona: puedo ver qué usa cada app y sacarle el permiso cuando quiera, por ejemplo la ubicación a una app de compras.
4. Cuidar los recursos del celular: la ubicación en segundo plano gasta mucha batería, por eso se pide aparte.

d) En la analogía del portero:
- La visita es la app, que quiere entrar a un recurso.
- El portero es el sistema operativo, que pregunta y controla.
- El dueño del departamento es la persona usuaria, que decide.

Que "el portero se acuerda de la respuesta" quiere decir que el sistema guarda lo que dijo la persona. Si dijo que sí, no se vuelve a preguntar. Si dijo que no (en iOS a la primera vez, en Android a la segunda), el portero ya ni toca el timbre: la app recibe el "no" directamente, sin cartel. Solo el dueño puede cambiarlo, desde Ajustes.


### A2. Declarar y solicitar

Todo permiso pasa por dos momentos: declararlo cuando se compila la app y solicitarlo cuando la app está funcionando.

¿Qué se hace?
- Declarar: se anota en los archivos nativos qué permisos puede llegar a usar la app. Queda guardado dentro de la app compilada.
- Solicitar: se le pregunta a la persona en el momento de usar la función, y el sistema muestra el cartel.

¿Dónde o cómo en Android?
- Declarar: en el archivo AndroidManifest.xml, con una línea uses-permission (por ejemplo, android.permission.CAMERA).
- Solicitar: con una función que pide el permiso y muestra el cartel del sistema. El texto de ese cartel es fijo.

¿Dónde o cómo en iOS?
- Declarar: en el archivo Info.plist, con una clave que lleva el texto de para qué se usa (por ejemplo, NSCameraUsageDescription).
- Solicitar: con la función de cada recurso. El cartel muestra el texto que escribí en el Info.plist.

¿Dónde o cómo en Expo?
- Declarar: en app.json, en las opciones del plugin de cada módulo (por ejemplo, el texto de la cámara en el plugin de expo-camera), o en android.permissions y android.blockedPermissions. Con npx expo prebuild se generan el manifiesto y el Info.plist.
- Solicitar: con las funciones de cada módulo. getPermissionsAsync consulta, requestPermissionsAsync pide, y también hay hooks como useCameraPermissions.

¿Qué pasa si se omite?
- Si no se declara: en Android el pedido se rechaza solo, sin mostrar cartel. En iOS la app se cierra de golpe al querer usar el recurso, y Apple rechaza la app cuando la subís.
- Si no se solicita: el recurso no se puede usar, porque nunca se dio el permiso.


### A3. Verdadero o falso

a) Falso. El cartel del permiso lo dibuja el sistema operativo, no la app. Así ninguna app puede falsificarlo. La app solo puede mostrar su propia pantalla antes, para explicar.

b) Verdadero. En Expo las carpetas android e ios se generan a partir de app.json. Si edito el AndroidManifest.xml a mano, se pierde la próxima vez que se genera.

c) Falso. El Info.plist es parte de la app nativa. Una actualización OTA solo cambia el JavaScript. Para un permiso nuevo hace falta una build nueva y subirla a la tienda.

d) Falso. Si el permiso no está en el manifiesto, Android lo rechaza sin mostrar el cartel.

e) Falso. expo-permissions es un paquete viejo que ya fue eliminado. En SDK 57 cada módulo trae sus propias funciones para pedir permisos.

f) Verdadero. Las notificaciones en iOS no llevan texto de propósito. El cartel tiene un texto fijo del sistema.

g) Verdadero. Con acceso limitado a fotos, status dice 'granted' y lo de "limitado" aparece en accessPrivileges.

h) Falso. No es confiable: tarda, borra los datos de la app, y en iOS a veces el sistema se acuerda de la respuesta de notificaciones. Lo correcto es resetear el permiso con comandos: adb en Android y xcrun simctl en el simulador de iOS.


### A4. Los estados de un permiso

a) Cómo se mueve un permiso entre estados:

En Android (11 o más nuevo):
- Empieza "sin decidir".
- Si la persona acepta, pasa a "concedido".
- Si rechaza una vez, queda "denegado", pero se puede volver a preguntar.
- Si rechaza por segunda vez, queda "bloqueado" y ya no aparece el cartel.
- Desde bloqueado solo se puede pasar a concedido entrando a Ajustes.

En iOS:
- Empieza "sin decidir".
- Si acepta, pasa a "concedido".
- Si rechaza, pasa directo a "bloqueado". No hay segunda oportunidad.
- Solo se puede cambiar desde Ajustes.

La diferencia central es que iOS pregunta una sola vez y Android da dos oportunidades.

b) Lo que devuelve Expo en cada estado:
- Sin decidir: status 'undetermined', canAskAgain true. Sí puede aparecer el cartel.
- Concedido: status 'granted', canAskAgain true. No aparece el cartel porque no hace falta.
- Denegado (se puede volver a pedir): status 'denied', canAskAgain true. Sí puede aparecer el cartel (esto pasa en Android).
- Bloqueado: status 'denied', canAskAgain false. No aparece el cartel: hay que ir a Ajustes.


## PARTE B - Android: tipos de permisos y manifiesto

### B1. Clasificá los permisos

- INTERNET: de instalación. Se da solo al instalar la app.
- CAMERA: de tiempo de ejecución. Se pide con el cartel del sistema.
- VIBRATE: de instalación. Se da solo al instalar.
- SYSTEM_ALERT_WINDOW: especial. La persona lo activa en Ajustes, en "Mostrar sobre otras apps".
- POST_NOTIFICATIONS: de tiempo de ejecución, desde Android 13. Se pide con el cartel.
- ACCESS_NETWORK_STATE: de instalación. Se da solo al instalar.
- READ_CONTACTS: de tiempo de ejecución. Se pide con el cartel.
- SCHEDULE_EXACT_ALARM: especial. La persona lo activa en Ajustes, en "Alarmas y recordatorios".
- RECORD_AUDIO: de tiempo de ejecución. Se pide con el cartel.
- MANAGE_EXTERNAL_STORAGE: especial. La persona lo activa en Ajustes, en "Acceso a todos los archivos". Google Play casi no lo permite.


### B2. Grupos y nombres

a) Un grupo de permisos junta permisos que tienen que ver con lo mismo, por ejemplo todos los de ubicación. El sistema pregunta una sola vez por grupo. Si la app pide ACCESS_FINE_LOCATION y ACCESS_COARSE_LOCATION juntos, la persona ve un solo cartel, donde además puede elegir entre ubicación precisa o aproximada.

b) El prefijo es "android.permission.". El permiso de cámara completo es android.permission.CAMERA.

c) Los permisos de firma (signature) solo se le dan a una app firmada con el mismo certificado que la app que creó el permiso, por ejemplo el sistema o el fabricante del celular. Una app común no tiene ese certificado, así que no los puede usar.


### B3. Leé el manifiesto

a) El único que se da solo al instalar es INTERNET. Hay que pedir en tiempo de ejecución:
- CAMERA;
- la ubicación (COARSE y FINE);
- POST_NOTIFICATIONS, en Android 13 o más;
- READ_EXTERNAL_STORAGE, solo hasta Android 12.

RECORD_AUDIO está marcado para sacarse, así que no queda.

b) android:maxSdkVersion="32" quiere decir que ese permiso solo se usa hasta Android 12L (API 32). Desde Android 13 lo reemplazan READ_MEDIA_IMAGES, READ_MEDIA_VIDEO y READ_MEDIA_AUDIO.

c) tools:node="remove" saca ese permiso del manifiesto final, aunque lo haya agregado una librería. En app.json se genera así:

    "android": {
      "blockedPermissions": ["android.permission.RECORD_AUDIO"]
    }

d) Va en la propiedad android.permissions de app.json:

    "android": {
      "permissions": ["android.permission.SCHEDULE_EXACT_ALARM"]
    }

e) No conviene editarlo a mano porque en Expo la carpeta android se genera sola desde app.json, y lo que cambie a mano se pierde. Y no, blockedPermissions no funciona en Expo Go, porque Expo Go es otra app que ya viene compilada con su propio manifiesto. Solo funciona en una development build.


### B4. Así pregunta Android

a) No, en Android el cartel tiene un texto fijo. Para explicar para qué uso el permiso tengo que mostrar mi propia pantalla antes de pedirlo. En mi app es la "pantalla previa".

b) "Mientras la app está en uso" deja el permiso dado para siempre, pero solo mientras uso la app. "Solo esta vez" lo da por un rato: cuando cierro la app se pierde y hay que volver a preguntar. "Solo esta vez" existe para la ubicación, la cámara y el micrófono.

c) Si la persona toca "No permitir" dos veces, Android lo toma como "no preguntar más". canAskAgain pasa a ser false y el cartel ya no aparece.

d) La ubicación aproximada alcanza para mostrar el clima de la ciudad. No alcanza para marcar en qué parte del instituto está un desperfecto, o para que un delivery llegue a la puerta.

e) Android cierra la app (mata el proceso). Cuando la persona vuelve, la app arranca de nuevo.


### B5. Android, versión por versión

- Nacen los permisos en tiempo de ejecución: Android 6 (API 23). Desde ahí hay que pedir los permisos cuando se usan, no alcanza con el manifiesto.
- La ubicación en segundo plano pasa a ser un permiso aparte: Android 10 (API 29). Hay que pedir primero la ubicación normal y después la de segundo plano, que la persona da desde Ajustes.
- Dos rechazos equivalen a "no volver a preguntar": Android 11 (API 30). Después del segundo "no" hay que mandar a Ajustes y ofrecer otra opción.
- Ubicación precisa o aproximada: Android 12 (API 31). La app tiene que funcionar aunque la persona elija la aproximada.
- Las notificaciones pasan a ser un permiso: Android 13 (API 33). Hay que pedirlo y crear un canal de notificaciones antes.
- Acceso parcial a fotos y videos: Android 14 (API 34). La persona puede elegir solo algunas fotos. Conviene usar el selector del sistema.
- Permiso de red local (ACCESS_LOCAL_NETWORK): Android 17. Las apps que se conectan a otros aparatos de la misma red Wi-Fi tienen que pedirlo.

El targetSdkVersion es la versión de Android para la que está hecha la app. Según ese número, el sistema le aplica las reglas nuevas. Expo SDK 57 apunta a la API 36 (Android 16). Google Play exige que desde el 31 de agosto de 2026 las apps nuevas y las actualizaciones apunten a la API 36 o más.


## PARTE C - iOS: textos de propósito y acceso parcial

### C1. Claves del Info.plist

- Cámara: NSCameraUsageDescription
- Micrófono: NSMicrophoneUsageDescription
- Ubicación en uso: NSLocationWhenInUseUsageDescription
- Ubicación siempre: NSLocationAlwaysAndWhenInUseUsageDescription (además de la de "en uso")
- Fotos (leer): NSPhotoLibraryUsageDescription
- Fotos (solo guardar): NSPhotoLibraryAddUsageDescription
- Contactos: NSContactsUsageDescription
- Face ID: NSFaceIDUsageDescription
- Rastreo entre apps (ATT): NSUserTrackingUsageDescription
- Notificaciones: no lleva clave.


### C2. Sin texto, no hay permiso

a) Si falta el texto y la app quiere usar la cámara, la app se cierra de golpe. Si subo la build a App Store Connect, la rechazan con el error ITMS-90683, que dice que falta el texto de propósito.

b) iOS muestra el cartel una sola vez. Si la persona dice que no, a la app solo le queda:
- explicar para qué sirve el permiso;
- mostrar un botón que abra Ajustes;
- ofrecer otra forma de hacer lo mismo.

c) El sistema arma el título (por ejemplo, "Mantenimiento IPF quiere acceder a la cámara") y los botones. Yo escribo el texto que explica para qué lo uso. En Expo ese texto se pone en app.json, en las opciones del plugin del módulo.

d) Apple revisa todo el código que trae la app, incluso el de las librerías. Si una librería usa algo protegido, como el micrófono, Apple pide el texto aunque mi app nunca lo use. Se resuelve configurando la librería para que no incluya esa parte, o agregando el texto.


### C3. Probador de textos de propósito

- "Necesitamos tu ubicación." No lo apruebo, porque no dice para qué. Mejor: "Usamos tu ubicación para mostrarte las farmacias de turno más cercanas."
- "Para mejorar tu experiencia." No lo apruebo, es muy vago. Mejor: "Usamos tu ubicación para ordenar los comercios según lo cerca que estén de vos."
- "Usamos tu ubicación para mostrarte las farmacias de turno más cercanas." Sí lo apruebo: dice qué dato usa y para qué.
- "La app no funciona sin ubicación." No lo apruebo: suena a amenaza y no explica nada. Mejor: "Usamos tu ubicación para encontrar el punto de retiro más cercano. También podés buscarlo por barrio."
- "Ubicación requerida por el sistema." No lo apruebo: es falso, el sistema no la pide, la pide la app. Mejor: "Usamos tu ubicación para avisarte cuándo llega el colectivo a tu parada."


### C4. Acceso parcial y gradual

- Fotos limitadas ("Seleccionar fotos"): desde iOS 14. En Expo se ve porque accessPrivileges vale 'limited'.
- Ubicación aproximada (interruptor "Precisa"): desde iOS 14. En Expo se ve porque ios.accuracy vale 'reduced'.
- "Permitir una vez" en la ubicación: desde iOS 13. Mientras la app está abierta figura como 'granted'. Al cerrarla vuelve a 'undetermined'.
- Ubicación escalonada, de "al usar la app" a "siempre": desde iOS 13. Primero se pide con requestForegroundPermissionsAsync y después con requestBackgroundPermissionsAsync.
- Notificaciones provisionales: desde iOS 12. Se piden con allowProvisional: true, y se detectan porque ios.status es PROVISIONAL.
- Rastreo entre apps (ATT): desde iOS 14 (obligatorio desde la 14.5). En Expo se usa el módulo expo-tracking-transparency.

Expo SDK 57 necesita como mínimo iOS 16.4. En la práctica, todos los casos de la tabla existen siempre en los iPhone donde corre la app, así que la app tiene que estar preparada para todos.


### C5. Android vs iOS, lado a lado

- ¿Dónde se declara? En Android, en el AndroidManifest.xml. En iOS, en el Info.plist. En Expo los dos se configuran desde app.json.
- Texto en el cartel: en Android es fijo y no se puede cambiar. En iOS va mi texto de propósito, y es obligatorio.
- Oportunidades para preguntar: Android da dos. iOS da una sola.
- "Solo esta vez" o "Permitir una vez": en Android existe para la ubicación, la cámara y el micrófono. En iOS, solo para la ubicación.
- Notificaciones: en Android son un permiso desde la versión 13 y necesitan un canal. En iOS siempre hay que pedirlas y no llevan texto de propósito.
- Ubicación en segundo plano: en Android es un permiso aparte que se da desde Ajustes. En iOS se pide de a pasos: primero "al usar la app" y después "siempre".
- Si falta la declaración: en Android se rechaza sin cartel. En iOS la app se cierra de golpe.


## PARTE D - Expo: una API, dos plataformas

### D1. Módulos y funciones

- Escanear un QR con la cámara: expo-camera, con useCameraPermissions.
- Grabar video con sonido: expo-camera, con useCameraPermissions y useMicrophonePermissions.
- Mostrar farmacias cercanas: expo-location, con requestForegroundPermissionsAsync.
- Seguir un envío con la app en segundo plano: expo-location, primero con requestForegroundPermissionsAsync y después con requestBackgroundPermissionsAsync.
- Mostrar un recordatorio: expo-notifications, con requestPermissionsAsync.
- Grabar una nota de voz: expo-audio, con requestRecordingPermissionsAsync.
- Galería propia dentro de la app: expo-media-library, con requestPermissionsAsync.
- Publicidad personalizada entre apps (iOS): expo-tracking-transparency, con requestTrackingPermissionsAsync.

Si un tutorial usa expo-permissions, quiere decir que es viejo. Ese paquete ya no existe, así que el tutorial está desactualizado.


### D2. Consultar, pedir y el hook

a) get...PermissionsAsync() solo consulta cómo está el permiso y nunca muestra el cartel. request...PermissionsAsync() pide el permiso, y es la única que puede mostrar el cartel.

b) El hook devuelve tres cosas:
1. permiso, que es la respuesta con el estado;
2. pedirPermiso, que es la función para pedir;
3. consultarPermiso, que es la función para consultar.

En el primer render, permiso vale null, porque todavía no llegó la respuesta. Mientras tanto la pantalla tiene que mostrar que está cargando.

c) Si canAskAgain es false, request...() devuelve "denegado" al instante, sin mostrar nada. Si se lo llama en un bucle, la app se queda pidiendo y pidiendo, y la pantalla se traba en "Pidiendo permiso...".


### D3. Leé la respuesta

- null: todavía no sé nada, muestro un cargando.
- granted true: uso la función directamente.
- undetermined con canAskAgain true: cuando la persona toca la función, muestro la pantalla previa con el botón "Continuar" y después pido.
- denied con canAskAgain true: no insisto solo. Ofrezco la alternativa, y si la persona vuelve a tocar la función, le muestro otra vez la pantalla previa.
- denied con canAskAgain false: está bloqueado. Explico cómo activarlo, muestro el botón "Abrir Ajustes" y ofrezco la alternativa.
- granted con accessPrivileges 'limited': funciona, pero solo con las fotos que eligió la persona.
- granted con accuracy 'coarse': uso la ubicación aproximada y no muestro coordenadas exactas.

Los dos campos que deciden casi todo son:
- granted, que responde "¿puedo usar el recurso ahora?";
- canAskAgain, que responde "¿puedo mostrar el cartel o tengo que mandar a Ajustes?".


### D4. Simulación del ciclo completo

Android 14, app recién instalada:
1. getForegroundPermissionsAsync(): status undetermined, canAskAgain true. No aparece cartel.
2. request y la persona toca "No permitir": denied, canAskAgain true. Sí apareció el cartel.
3. request y otra vez "No permitir": denied, canAskAgain false. Sí apareció el cartel.
4. request de nuevo: denied, canAskAgain false. Ya no aparece el cartel.
5. Va a Ajustes, activa "Mientras la app está en uso", vuelve y la app consulta: granted, canAskAgain true. No aparece cartel.
6. Igual que el 5, pero la app no vuelve a consultar: sigue mostrando denied y false. La pantalla dice "bloqueado" aunque ya está concedido.

En iOS cambia en el paso 2. Con el primer "No permitir" ya queda denied con canAskAgain false, porque iOS pregunta una sola vez. En los pasos 3 y 4 no aparece más el cartel.

Si en iOS la persona elige "Permitir una vez" y después cierra y abre la app, el permiso vuelve a "sin decidir" y se puede preguntar de nuevo.


### D5. Configurar app.json

    {
      "expo": {
        "plugins": [
          ["expo-camera", {
            "cameraPermission": "Usamos tu cámara para leer el QR del contenedor y decirte qué se puede reciclar ahí.",
            "microphonePermission": false,
            "recordAudioAndroid": false
          }],
          ["expo-location", {
            "locationWhenInUsePermission": "Usamos tu ubicación para mostrarte los puntos de reciclaje más cercanos.",
            "isAndroidBackgroundLocationEnabled": false,
            "isIosBackgroundLocationEnabled": false
          }]
        ],
        "android": {
          "blockedPermissions": [
            "android.permission.SYSTEM_ALERT_WINDOW",
            "android.permission.RECORD_AUDIO"
          ]
        }
      }
    }

expo-camera agrega RECORD_AUDIO en Android porque la cámara también puede grabar video con sonido. La librería no sabe si lo voy a usar, así que lo agrega por las dudas. Por eso hay que ponerle recordAudioAndroid: false.


### D6. Expo Go no es tu app

a) Porque Expo Go es otra app, ya compilada y con sus propios textos. Mi app.json no cambia a Expo Go, así que el cartel muestra el texto de Expo Go y no el mío. Lo vi probando en mi iPhone: el cartel decía "Expo Go" en vez de "Mantenimiento IPF".

b) En Expo Go puedo probar las pantallas, la cámara, la ubicación con la app abierta, el selector de fotos y las notificaciones locales. Necesito una development build para:
- las notificaciones push en Android;
- la ubicación en segundo plano;
- ver mis propios textos de propósito;
- que funcione blockedPermissions.

c) Los comandos:
- npx expo prebuild --clean, para generar las carpetas android e ios y ver los archivos nativos.
- npx expo run:android, para compilar una development build en Android.
- Otra opción para compilar es hacerlo en la nube con npx eas-cli@latest build --profile development --platform android.

d) Para volver un permiso a "sin decidir" sin reinstalar:
- En Android, con adb: "adb shell pm revoke" seguido del paquete de la app y del permiso, y después "adb shell pm clear-permission-flags" con los flags user-set y user-fixed.
- En el simulador de iOS: "xcrun simctl privacy booted reset" seguido del permiso (por ejemplo camera) y del identificador de la app.


## PARTE E - Recetas: leer y corregir código

### E1. Encontrá los errores (cámara)

Errores que encontré:
1. En el primer render permiso es null. Al hacer permiso.status la app se rompe, porque no se contempla el estado "cargando".
2. No contempla el estado "bloqueado". Si el permiso está bloqueado, el botón no hace nada y la persona queda trabada. Falta el botón "Abrir Ajustes".
3. El botón dice "Permitir", y tiene que decir "Continuar", porque la decisión real se toma en el cartel del sistema.
4. No se actualiza cuando la persona vuelve de Ajustes.
5. No hay alternativa: si no hay cámara, debería poder escribirse el código del aula a mano.
6. Además, a la cámara le falta la configuración para leer el QR.

Versión corregida, con los cuatro estados:

    export default function Escanear() {
      const [permiso, pedirPermiso, consultarPermiso] = useCameraPermissions();
      useRevisarAlVolver(consultarPermiso);

      // 1. Cargando
      if (!permiso) return <ActivityIndicator />;

      // 2. Concedido
      if (permiso.granted) {
        return (
          <CameraView
            style={{ flex: 1 }}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={({ data }) => guardarAula(data)}
          />
        );
      }

      // 3. Preguntable
      if (permiso.canAskAgain) {
        return (
          <Explicacion texto="Usamos la cámara para leer el QR del aula.">
            <Button title="Continuar" onPress={() => pedirPermiso()} />
            <CodigoAMano />
          </Explicacion>
        );
      }

      // 4. Bloqueado
      return (
        <Explicacion texto="La cámara está desactivada. Podés activarla en Ajustes.">
          <Button title="Abrir Ajustes" onPress={() => Linking.openSettings()} />
          <CodigoAMano />
        </Explicacion>
      );
    }


### E2. El orden importa (ubicación)

a) El error es que pide la ubicación en segundo plano antes que la normal. Primero hay que tener la de "en uso" y recién después se puede pedir "siempre".
- En iOS, el pedido de segundo plano no funciona bien sin la de "en uso" y queda rechazado.
- En Android 11 o más, se rechaza sin mostrar cartel.

En los dos casos la función devuelve false y nunca llega a pedir la ubicación normal.

b) Función corregida:

    export async function activarSeguimiento() {
      const enUso = await Location.requestForegroundPermissionsAsync();
      if (!enUso.granted) return false;

      const siempre = await Location.requestBackgroundPermissionsAsync();
      return siempre.granted;
    }

c) Función obtenerUbicacion:

    export async function obtenerUbicacion() {
      try {
        const permiso = await Location.requestForegroundPermissionsAsync();
        if (!permiso.granted) return null;

        const aproximada =
          permiso.android?.accuracy === 'coarse' ||
          permiso.ios?.accuracy === 'reduced';

        const posicion = await Location.getCurrentPositionAsync();
        return {
          latitud: posicion.coords.latitude,
          longitud: posicion.coords.longitude,
          aproximada,
        };
      } catch {
        return null;
      }
    }

Si el permiso se rechaza, devuelve null. Si pasa algún error (por ejemplo, el GPS apagado), el try/catch también devuelve null, así la app no se rompe.

d) No hace falta segundo plano para "farmacias cercanas": la persona mira la lista con la app abierta. Si pido segundo plano, Google Play me exige justificarlo con un formulario y un video, y mostrar un aviso claro dentro de la app.


### E3. Notificaciones mudas

a) Lo más probable es que no haya creado un canal de notificaciones. En Android 13 o más, si la app no tiene ningún canal, el cartel no aparece. Antes de pedir el permiso hay que crear el canal con setNotificationChannelAsync. En mi app creo el canal "reportes" justo antes de pedir.

b) En Android 12 o anterior este permiso no existe: las notificaciones vienen activadas de entrada y no aparece ningún cartel.

c) En iOS existen las notificaciones provisionales: llegan en silencio al centro de notificaciones, sin preguntar antes. Se piden con allowProvisional: true, y en el código se detectan porque ios.status es PROVISIONAL.

d) Conviene pedirlo cuando la persona entiende para qué lo quiere.
- Buen momento: cuando activa "Avisarme cuando se resuelva mi reporte", o cuando saca un turno y la app pregunta "¿Te avisamos un día antes?".
- Mal momento: apenas abre la app por primera vez, sin saber para qué es.


### E4. Fotos sin pedir permiso

- Elegir una foto de perfil: selector del sistema (launchImageLibraryAsync). No necesita permiso.
- Sacar una foto en el momento: cámara (launchCameraAsync). Necesita permiso de cámara.
- Editor que muestra toda la galería: expo-media-library. Necesita permiso de toda la galería.
- Adjuntar la foto de un comprobante: selector del sistema. No necesita permiso.

Google Play restringe READ_MEDIA_IMAGES y READ_MEDIA_VIDEO porque dan acceso a todas las fotos y videos de la persona, y casi ninguna app lo necesita. Lo anunció en 2023 y lo empezó a exigir entre 2024 y 2025. Solo las apps de galería o de edición de fotos pueden pedirlos. El resto tiene que usar el selector del sistema.

"El mejor permiso" es el que no hace falta pedir. Si el sistema ya me da una herramienta que resuelve el problema sin permiso, como el selector de fotos, es la mejor opción.


### E5. Volver de Ajustes

Los espacios completos:

    const estabaAfuera = anterior.current === 'background' || anterior.current === 'inactive';
    if (estabaAfuera && nuevo === 'active') revisar();
    ...
    return () => sub.remove();

O sea: si la app estaba afuera (en segundo plano) y ahora volvió a estar activa, se revisa el permiso. Y cuando el componente se desmonta, se deja de escuchar.

a) Porque los hooks de Expo consultan el permiso una sola vez, cuando se abre la pantalla. El sistema no le avisa a la app cuando la persona cambia algo en Ajustes, así que la app tiene que volver a preguntar ella misma.

b) La tercera función del hook, la que consulta: consultarPermiso (getPermission).

c) Porque la persona puede cambiar el permiso en cualquier momento desde Ajustes. Si lo guardo para siempre, el dato queda viejo. El que siempre sabe el estado real es el sistema, así que hay que volver a consultarlo.


## PARTE F - Buenas prácticas y tiendas

### F1. Pedir en contexto

- Delivery, ubicación: pedirla cuando la persona toca "Usar mi ubicación" al poner la dirección. Si no la da, puede escribir la dirección a mano.
- Billetera virtual, cámara: pedirla cuando toca "Pagar con QR". Si no la da, puede escribir el alias o el código a mano.
- Red social, contactos: pedirlos cuando toca "Buscar amigos". Si no los da, puede buscar por nombre de usuario o mandar un link de invitación.
- Mensajería, micrófono: pedirlo la primera vez que quiere grabar un audio. Si no lo da, puede escribir el mensaje.
- Turnos médicos, notificaciones: pedirlas después de sacar un turno ("¿Te avisamos?"). Si no las da, ve sus turnos dentro de la app.
- Editor de fotos, galería completa: pedirla cuando entra a la galería del editor. Si no la da, elige las fotos de a una con el selector del sistema.

Pedir cuatro permisos apenas se abre la app "entrena el No permitir automático" porque la persona ve muchos carteles seguidos sin entender para qué son. Se acostumbra a tocar "No" para sacárselos de encima, y después, cuando la app de verdad necesita el permiso, ya está bloqueado.


### F2. La pantalla previa

a) Una buena pantalla previa tiene tres elementos:
1. el beneficio en una frase: qué gana la persona;
2. un solo botón, "Continuar";
3. la aclaración de que se puede cambiar después en Ajustes.

b) Porque la decisión de verdad se toma en el cartel del sistema, no en mi pantalla. Si el botón dice "Permitir", la persona puede creer que ya aceptó. "Continuar" es más honesto: solo lleva al cartel.

c) La pauta 5.1.1(iv) de Apple dice que hay que respetar la decisión de la persona y no presionarla. Para la pantalla previa, eso significa que siempre tiene que llevar al cartel del sistema. Si agrego un botón "Ahora no" o "Cerrar" que evita mostrar el cartel, Apple puede rechazar la app.

d) Si el permiso ya está bloqueado, el cartel del sistema no puede aparecer. Entonces la pantalla explica que el permiso está desactivado, muestra el camino en Ajustes para activarlo, y el botón pasa a decir "Abrir Ajustes".


### F3. Mínimo privilegio

a) Ubicación aproximada. Para los puntos de reciclaje del barrio no hace falta saber la casa exacta.

b) "En uso" alcanza, si la persona empieza la carrera desde la app. El sistema deja seguir usando la ubicación mientras la actividad que empezó la persona siga activa, con un aviso visible. "Siempre" haría falta solo si la app tuviera que registrar sin que la persona la abra.

c) El selector del sistema. Solo hay que subir una foto, no hace falta ver toda la galería.

d) Sin micrófono. Para escanear un QR no hace falta grabar sonido.


### F4. Tiendas

a) Requisitos de Google Play:
1. completar la sección "Seguridad de los datos", donde se explica qué datos usa la app;
2. justificar con un formulario los permisos sensibles, como la ubicación en segundo plano o el acceso a todas las fotos.

Requisitos de App Store:
1. poner un texto de propósito para cada permiso;
2. completar la información de privacidad de la app y, si rastrea a la persona entre apps, pedir permiso con ATT.

b) El manifiesto de privacidad (PrivacyInfo.xcprivacy) es un archivo donde la app declara qué datos usa y para qué, y por qué usa ciertas funciones del sistema que Apple considera sensibles. En Expo se configura en app.json, dentro de ios.privacyManifests.

c) Android 17 agrega un selector de contactos del sistema: la persona elige qué contactos compartir y la app no necesita el permiso de leer toda la agenda. Desde el 27/01/2027, Google Play va a exigir que las apps que hoy piden READ_CONTACTS usen ese selector. Solo podrán seguir pidiendo el permiso completo las apps que de verdad necesiten toda la agenda, justificándolo.


### F5. Errores comunes

a) La app se cerró porque falta el texto de propósito en el Info.plist. Se soluciona agregando el texto en app.json, en el plugin del módulo, y haciendo una build nueva.

b) En Expo Go anda porque Expo Go ya tiene todos los permisos declarados. En mi build falta declarar el permiso (falta el plugin en app.json o lo bloqueé por error). Se soluciona agregando el plugin o el permiso en app.json y volviendo a compilar.

c) La app no volvió a consultar el permiso al regresar de Ajustes, así que sigue mostrando el estado viejo. Se soluciona escuchando cuando la app vuelve a estar activa (AppState) y consultando de nuevo, como hace mi hook useRevisarAlVolver.

d) Se llama a request...() cada vez que la pantalla se dibuja. Cada respuesta hace que la pantalla se vuelva a dibujar, y eso vuelve a pedir: queda en un bucle. Se soluciona pidiendo el permiso solo cuando la persona toca un botón.

e) La app trata las notificaciones como obligatorias cuando no lo son, y eso está mal: la app nunca se tiene que bloquear por un permiso que no es esencial. Se soluciona dejando entrar igual y mostrando los avisos dentro de la app, en una bandeja como la pestaña Avisos de mi app.
