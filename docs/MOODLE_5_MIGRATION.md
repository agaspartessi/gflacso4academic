# Académico para Moodle 5.3 — cajones nativos de Boost

Actualizado: 15 de octubre de 2026. Release: `2.0.0-beta3`.

Se actualiza la misma rama `moodle-5.1-5.3`, conservando su nombre para mantener
los enlaces y el PR #5. Desde esta revisión requiere **Moodle 5.3**; 5.1 deja
de ser un objetivo de compatibilidad. `main` no se modifica ni se fusiona.

## Qué se corrige

La revisión beta3 incorpora los ajustes solicitados al probar beta2:

- El pie institucional ocupa todo el ancho disponible de la página, compensando
  sólo en el footer el gutter de Boost. Se quita la franja blanca de 3rem encima.
  El ancho del contenido y los anclajes de los cajones no se modifican.
- Los botones de apertura se presentan como pestañas azules en los bordes del
  viewport, con iconos blancos. En escritorio quedan bajo la navbar y no sobre
  el título ni las tarjetas; en móvil conservan la altura prevista por Boost.
- El nombre de usuario, la etiqueta de edición, los controles de notificaciones
  y los iconos de imagen son blancos sobre el azul. Se conserva el texto oscuro
  de las iniciales del avatar y de los menús desplegables sobre fondos claros.
- Se limita el ancho de la dirección del pie al espacio disponible en móvil.
- Versión de plugin `2026101900` para que Moodle detecte esta actualización.

Las capturas del campus muestran el cierre del cajón derecho fuera de la
cabecera y el contenido lateral desalineado respecto de la columna central.
El SCSS anterior forzaba la cabecera con `position: absolute`, `bottom: 15dvh`
y desplazamientos negativos; ubicaba también los botones de apertura abajo,
fijaba la altura al viewport y elevaba el z-index a 1050. Además fijaba el ancho
y los márgenes de la columna central sin compartirlos con los cálculos de Boost.

Boost 5.3 añade cajones de altura dinámica, anclajes junto al contenido y una
cabecera con `drawerheadertop`, `drawerheading`, `draweractions` y `drawercontrols`.
Esta revisión hereda esos templates y el controlador AMD del padre: no copia ni
reescribe su apertura/cierre, preferencias, scroll, foco o comportamiento móvil.

## Cambios por archivo

| Archivo | Resultado |
| --- | --- |
| `scss/post.scss` | Retira las posiciones y alturas antiguas de cajones, cabeceras, contenidos y botones, el z-index forzado y sus transiciones propias. Conserva fondos, colores, tipografía y apariencia de los bloques. |
| `scss/post.scss` | Los controles mantienen el tamaño, eventos y foco de Boost. Las aperturas se alinean a los bordes como pestañas azules y los cierres siguen dentro de la cabecera. Se excluye el padding general de `.btn` para que no comprima sus iconos. |
| `scss/post.scss` | Elimina el ancho forzado de `.main-inner`, el padding lateral cero, los márgenes superiores antiguos y el ancho `93vw` de informes de calificaciones. Boost calcula el espacio disponible y los anclajes de ambos cajones de forma consistente. |
| `scss/post.scss` | Retira las alturas fijas de navbar y enlaces; usa la variable compartida de Boost. Devuelve al footer fijo su posición y espaciado nativos para respetar la altura disponible de los cajones. |
| `scss/pre.scss` | Añade `$navbar-height: 62px !default` y `$course-content-maxwidth: 1000px !default`. Todos los cálculos nativos usan esas mismas medidas. La paleta y las tipografías propias se conservan. |
| `version.php` | Versión `2026101900`, mínimo Moodle/Boost `2026100500` (5.3), release `2.0.0-beta3`, madurez BETA. |
| `lib.php` | Mantiene preset default/plain/subido/fallback y la prioridad de Raw SCSS. La importación MDS de plain se aplica directamente porque esta rama ya requiere 5.3. |
| `templates/core/login_layout.mustache` | Conserva el login propio ya preparado para 5.3 y elimina la referencia obsoleta a soporte 5.1. |
| `tools/check_compatibility.php` | Verifica el mínimo 5.3 y compila con `core_scss`, `theme_config` y callbacks reales. |
| `tools/check_drawers.cjs` | Prueba de navegador reproducible con los templates y controlador AMD reales de Boost, contenido de ejemplo y servicios externos simulados. |
| `README.md` y este documento | Alcance actualizado, cambios, pruebas y pasos de instalación. |

## Identidad y estructura conservadas

Se mantiene `theme_gflacso4academic` como componente, con Boost como padre.
Se conserva la paleta azul/rosa, logos, imágenes, iconos, footer institucional,
ajustes administrativos y diseños de cursos/contenidos. Siguen vigentes los
ajustes de navbar y navegación MDS de la primera adaptación.

El orden SCSS sigue siendo:

1. Callback de Boost: color de marca y Raw initial SCSS de Académico.
2. Callback de Académico: variables `!default` de `pre.scss`.
3. Preset seleccionado y estilos de `post.scss`.
4. Callback de Boost: Raw SCSS y fondos.

Raw SCSS se incluye una sola vez y conserva su prioridad final. Los archivos
propios se localizan con `__DIR__` y `$CFG->dirroot` ya apunta a `public`.

## Validación realizada

Referencia de Moodle: `MOODLE_503_STABLE`, release 5.3,
`42622298fe06f9626d988d60b2bf589bd8f850e8`. También se compara con la rama estable
actual consultada el 15/10, `344c92d5bb70f37306829d7739e2710305a39c3e`:
los archivos de producción de Boost y el compilador utilizados no cambian.

- Sintaxis PHP y JavaScript, y `git diff --check`.
- Cinco compilaciones con PHP 8.3 y el compilador SCSS real de Moodle 5.3:
  default, plain, preset subido, fallback y marca/Raw SCSS.
- Prueba en Chromium: 96 combinaciones entre nueve anchos de pantalla
  (390, 767, 768, 991, 992, 1024, 1200, 1440 y 1920 px), tres layouts
  (dashboard de ancho limitado, standard e informe ancho) y cajones cerrados,
  izquierdo/derecho abiertos y ambos abiertos cuando corresponde.
- Comprueba ausencia de desbordamiento horizontal, visibilidad, cabecera y
  cierre dentro del cajón, scroll interno y separación respecto del contenido
  en escritorio.
- Comprueba clics reales de apertura/cierre, retorno del foco al botón de
  apertura, espacio para el footer fijo, cierre al reducir pantalla y controles
  operables en móvil. El icono de cierre mantiene su ancho.
- Con los templates reales de navbar y menú de usuario de Boost, y el footer
  real de Académico: comprueba texto de cabecera blanco, filtro blanco para
  iconos de imagen, iniciales y menú desplegable oscuros, pie a todo el ancho,
  ausencia de franja sobre el pie y apertura alineada al borde al hacer scroll.
- El fixture con CSS anterior reproduce el cierre fuera del cajón, detectado
  por los mismos límites geométricos que pasa esta revisión.

**Límite:** son pruebas de integración aisladas, no una sesión en el campus.
Se simulan persistencia de preferencias, servicios de templates, tooltip y
backdrop. El DOM y el controlador de cajones provienen de Boost. Queda pendiente
validar con bloques, cursos, plugins, ajustes Raw y autenticación reales.

Para reproducir la compilación (PHP con ctype y mbstring o iconv):

```bash
php tools/check_compatibility.php /ruta/al/moodle /tmp/academic-css
```

Para reproducir el navegador en un checkout de trabajo con Node:

```bash
npm install --no-save playwright mustache
npx playwright install chromium
node tools/check_drawers.cjs /ruta/al/moodle /tmp/academic-css/moodle-default.css /tmp/academic-drawers
```

El nombre del CSS generado incluye el nombre de la carpeta de Moodle: sustituir
`moodle-default.css` por el nombre que genere el primer comando. Se puede usar
`CHROMIUM_EXECUTABLE_PATH` para seleccionar un Chromium ya instalado. El script
no se conecta al campus ni requiere credenciales.

## Instalar y comprobar en testing

1. Descargar la misma rama `moodle-5.1-5.3`. El directorio del theme debe llamarse
   `gflacso4academic`, sin sufijos, dentro de `<moodle>/public/theme/`.
2. Actualizar los archivos del theme por el procedimiento habitual. Entrar en
   **Site administration > Notifications** para registrar `2026101903`.
3. Ejecutar **Site administration > Development > Purge caches**. Después hacer
   una recarga completa del navegador (`Ctrl+F5`).
4. En **Site administration > Appearance > Themes > gflacso4academic**, revisar
   Raw initial SCSS y Raw SCSS: si contienen copias antiguas de reglas de cajones,
   cabeceras, toggles o `.main-inner`, esas reglas pueden reintroducir el problema
   porque Raw SCSS tiene prioridad final. Conservar los ajustes propios que no
   interfieran y retirar sólo las reglas antiguas identificadas.
5. Probar en Tablero y en un curso con índice y bloques: ambos cajones cerrados,
   cada uno abierto y ambos abiertos; cerrar desde su cabecera, desplazar una
   lista larga y volver a abrir. Comprobar también teclado, móvil y cambio de
   tamaño de la ventana.
6. Probar añadir/mover bloques en edición, contraer/expandir índice, menú de
   acciones de bloques, contenidos H5P, foros, tareas, cuestionarios y páginas con
   navegación inferior. Revisar formatos externos como Tiles/Onetopic y cursos
   representativos antes de fusionar.

Los presets subidos deben ser compatibles con 5.3. Un preset basado en el plain
antiguo puede necesitar `@import "design-system";` antes de Bootstrap/Moodle.
URLs absolutas, IDs de cursos y reglas de plugins externos existentes se conservan.
El modo oscuro experimental de Boost no está validado para esta identidad.

## Referencias

- [Moodle 5.3](https://moodledev.io/general/releases/5.3)
- [Notas de actualización de Boost 5.3](https://github.com/moodle/moodle/blob/MOODLE_503_STABLE/public/theme/boost/UPGRADING.md)
- [SCSS nativo de cajones](https://github.com/moodle/moodle/blob/MOODLE_503_STABLE/public/theme/boost/scss/moodle/drawer.scss)
- [Layout nativo](https://github.com/moodle/moodle/blob/MOODLE_503_STABLE/public/theme/boost/scss/moodle/layout.scss)
- [Templates de Boost](https://github.com/moodle/moodle/tree/MOODLE_503_STABLE/public/theme/boost/templates)

## Actualización del 19 de octubre de 2026

- Se mantiene la identidad de Académico: paleta azul/magenta, Roboto, mapa,
  logos, footer y colores particulares por categoría/curso.
- Menús MDS con texto de 18 px, pestañas rectangulares, contraste de hover y
  flecha de selección debajo del texto. Las listas desplegables mantienen su color.
- Tiles utiliza el mismo ancho que los anclajes de Boost para evitar solapamientos
  al expandir un mosaico. En móviles los cajones comienzan debajo del encabezado.
- Formulario de ingreso clásico con campos, logo e inscripción; conserva token,
  CAPTCHA, proveedores externos, invitado, mensajes y controles de Moodle 5.3.
  La recuperación de contraseña y MFA continúan usando output.main_content.
- Se corrige un cierre accidental de comentario Mustache en login_layout y una
  ruta antigua mal escrita del icono ondemand_video_white.svg.

Validación reproducible adicional (después de compilar CSS):

```bash
node tools/check_navigation.cjs /tmp/academic-drawers
node tools/check_login.cjs /ruta/al/moodle /tmp/academic-css/moodle-default.css /tmp/academic-login
node tools/check_tiles_drawers.cjs /tmp/academic-drawers /ruta/a/format_tiles/styles.css
```

Estas pruebas usan fixtures locales y el controlador real de cajones de Boost.
No reemplazan una prueba funcional de autenticación, MFA y plugins en el campus.

## Corrección visual de Board, Página y Onetopic (2026101901)

Se adapta el título de curso a la cabecera actual de Boost, conservando el texto
azul institucional y la línea con el color del área. Board y Página muestran una
sola cabecera de actividad, con fondo suave y borde fino del área; la descripción
de Board conserva tipografía sin serif. Los contenedores vacíos de información
no dejan recuadros en Página, pero los controles de finalización se conservan.
Las pestañas verticales de Onetopic recuperan la forma redondeada y los estados
activo/hover por área, incluidos los diseños vertical y vertical-all.

Validación local con plantillas reales de Boost y CSS de Onetopic:

```bash
node tools/check_content.cjs /ruta/a/moodle /ruta/a/compiled.css /ruta/a/onetopic /tmp/academic-content
```

Las capturas locales no incluyen datos del campus. Comprobar después en testing
el Board 2999545, Página 2999543 y curso 29836, incluyendo móvil y finalización.

## Beta6 / 2026101902: diagnóstico confirmado en Virtual Test

### Causa de que beta5 no se reflejara

El 19/10 se inspeccionaron todas las reglas CSSOM accesibles de la hoja
`gflacso4academic` servida por Virtual Test. Sus últimas reglas interpretadas eran
`.my-3[data-for="sectioninfo"]` y su `.no-overflow`: no se llegaba a interpretar
Onetopic ni el bloque de correcciones al final del archivo.

Reproducción local con `core_scss` y scssphp incluidos en Moodle 5.3
(MOODLE_503_STABLE, commit 344c92d5): Bootstrap extiende `h1`...`h6` mediante
`.h1`...`.h6`. En selectores antiguos anidados como
`:not(:has(p, span, h1, h2, h3, h4, h5, h6, img, div))`, scssphp genera extensiones
con paréntesis sin cerrar. El CSS sigue conteniendo texto después de ese punto,
pero Chromium deja de interpretar el resto de la hoja. No era una caché ni un
problema de que el selector del Board no coincidiera.

Se usan selectores estándar con namespace universal `*|h1`...`*|h6` dentro de las
relaciones. Siguen coincidiendo con los mismos encabezados HTML sin disparar
esas extensiones defectuosas. También se elimina el selector de atributo anidado
`[role="button"]` de la condición de contenedor vacío, que provocaba avisos
`Array to string conversion` en scssphp. Se preservan descripción, finalización,
botones, campos, enlaces y alertas en esa condición.

La validación anterior con Dart Sass no reproducía el compilador de Moodle.
Beta6 valida compilación PHP, `theme_config::post_process`, `core_minify::css` y
CSSOM de Chromium. Las advertencias PHP hacen fallar el chequeo; la mera presencia
de las reglas en el texto compilado ya no se considera suficiente.

### Board y Página

Se confirmó en el DOM autenticado que `#region-main > h2` precede a
`.activity-header`. El selector de beta5 sí coincidía, pero estaba en el tramo
que el navegador descartaba. Se mantiene el encabezado liviano, fondo del área
(crema en este curso), borde de 1px y descripción integrada. Se oculta sólo la
cabecera duplicada, conservando breadcrumb y acciones. Página contiene wrappers
`.activity-information > .activity-details` vacíos: se evita su recuadro sin
ocultar información de finalización. Se contempla `.generalbox` dentro de
`[role="main"]`, como en el HTML real.

### Encabezado del curso

Moodle emite `h1.h2.mb-0`. Las reglas globales `h2`, extendidas por Bootstrap a
`.h2`, le aplicaban fondo gris y borde lateral. Las reglas específicas del curso
restablecen tipografía institucional azul, fondo transparente y línea del área.

### Onetopic: diseño y funcionamiento

El DOM del curso 29836 contiene:

```html
<div class="course-content-header">
  <div class="verticaltabs hastopictabs" id="tabs-tree-start">
    <div class="tabs-wrapper">
      <!-- checkbox/label nativos del menú móvil -->
      <ul class="nav nav-tabs format_onetopic-tabs">
        <li class="nav-item"><a class="nav-link active" href="...">...</a></li>
      </ul>
    </div>
    <!-- contenido de la sección -->
  </div>
</div>
```

Las reglas de beta5 exigían un ancestro `.course-content` que no existe sobre las
pestañas: coincidían con cero enlaces. La nueva regla
`body.format-onetopic.path-course-view #page .verticaltabs > .tabs-wrapper .nav-item > .nav-link`
coincidió con los ocho enlaces reales. No depende de IDs de cursos ni secciones.

Se conservan forma píldora, columna de 200px, borde según el área y fondo del
área oscuro para la activa (naranja/dorado en el curso de referencia). Hover de
fondo suave con texto negro, activa con texto blanco y foco de teclado con
contorno visible. Se neutraliza el antiguo ancho de 33% de los ítems verticales.
En móvil se respeta el breakpoint nativo de 600px y el checkbox del menú; la lista
abierta fluye dentro de la página para evitar superposiciones. No se cambia el
JavaScript de Onetopic ni sus enlaces.

Prueba autenticada con el plugin instalado en Virtual Test: seleccionar
“Derecho Internacional” navegó a `section=1`, actualizó `.nav-link.active`, y
entrar en Página 2999543 y volver por el breadcrumb “Derecho Internacional”
conservó esa sección y su enlace activo. No se reprodujo una incompatibilidad
funcional en ese recorrido; no se afirma por ello compatibilidad completa de
todas las funciones/versiones de Onetopic con 5.3.

### Verificación tras instalar

1. Instalar esta misma rama, registrar `2026101903`, purgar cachés y recargar.
2. En consola, comprobar:

```js
getComputedStyle(document.documentElement)
  .getPropertyValue('--gflacso-academic-build').trim()
// "2026101902"
```

El marcador está al final del SCSS: confirma que el navegador interpreta ese
tramo, no sólo que la versión PHP se instaló. Si no aparece, inspeccionar todas
las hojas del theme y los errores de compilación antes de cambiar especificidad.
3. Revisar Board 2999545 y Página 2999543: una cabecera, borde fino y sin recuadro
vacío; comprobar descripción y finalización cuando estén configuradas.
4. Curso 29836: título sin fondo/borde lateral, línea del área y ocho píldoras;
seleccionar sección 1, abrir una actividad y volver a la misma sección.
5. A 390px, abrir “Tópicos”, seleccionar una sección y probar ambos cajones;
repetir en escritorio con cajones cerrados, abiertos y ambos abiertos.

Las pruebas visuales de la corrección se ejecutan localmente con la estructura
observada en el campus y el CSS procesado por Moodle. La nueva versión de la rama
no se instala automáticamente en Virtual Test.

Resultado de la validación de beta6: cinco combinaciones de preset/configuración
compilaron y pasaron posprocesado/minificación sin advertencias PHP; Chromium
interpretó el marcador final y pasó las pruebas de contenido en las cinco
combinaciones (12 vistas responsive por combinación). Pasaron además 96 estados
de cajones, navegación en cuatro anchos de escritorio y login en cinco tamaños.
Se repitió la prueba del preset default tras el último ajuste de fondo del
contenedor. Estas pruebas no requieren base de datos ni credenciales del campus.

## Beta7 / 2026101903: footer y títulos de Tablero/Mis cursos

La inspección autenticada de Virtual Test con beta6 confirmó que el footer no
estaba mal dimensionado: estaba desplazado. El SCSS adicional del campus conserva
la técnica anterior de ancho completo (`width:100vw; left:50%; right:50%;
margin-left:-50vw; margin-right:-50vw`). La regla nueva de cajones ya sustituía
ancho y márgenes, pero dejaba esos offsets activos. A 1348px, el footer comenzaba
en x=626px y terminaba en x=1974px: dirección/redes quedaban fuera de pantalla.

Se restablecen `left:auto; right:auto` con el selector específico
`#page.drawers > #page-footer.nova-foot`. Se conservan el mapa, colores,
información institucional, redes y el ancho calculado por Boost. No se cambian
las opciones guardadas ni la geometría de los cajones.

Tablero y Mis cursos pertenecen a `body.path-my` y usan `h1.h2.mb-0`; el saludo
es `span.h2`. Bootstrap extendía el recuadro genérico de h2 a ambos. Las reglas
acotadas a ese encabezado eliminan fondo, bordes y sombra y mantienen Roboto
Condensed azul institucional, con escala moderada. Los encabezados de cursos,
Board, Página y títulos de contenidos conservan sus reglas anteriores.

Prueba reproducible que carga además las reglas adicionales observadas en el
campus, después del CSS compilado:

```bash
node tools/check_dashboard.cjs /tmp/academic-drawers /ruta/al/compiled.served.css /tmp/academic-dashboard
```

Verifica el ancho y posición del footer, dirección visible, ausencia de scroll
horizontal y títulos/saludo sin recuadros en Tablero/Mis cursos a 390, 768, 1024,
1440 y 1920px. Pasaron las diez vistas y la regresión de Board/Página/Onetopic.
Tras instalar, el marcador CSS del final de la hoja debe devolver `2026101903`.


## Beta8 / 2026101904: superficies nuevas de Boost en cursos

La comparación de capturas y del DOM autenticado del curso 29782 confirmó dos
superficies nativas de Boost 5.3: `.navigation.secondarynav-tabbar` heredaba
`--bs-body-bg` (rgb 248,249,250), y las etiquetas `modtype_label` conservaban
la tarjeta `.activity-item.activityinline` con fondo `--mds-bg-surface-subtle`,
borde de 1px y radio de 1rem. La regla histórica que eliminaba bordes excluía
explícitamente `.activityinline`, por lo que esas tarjetas quedaban visibles.

Se vuelve transparente la barra de navegación del curso y se elimina únicamente
el fondo, borde y radio de la tarjeta exterior de las etiquetas de texto y
multimedia. Se conservan el espaciado, foco, controles de edición/finalización,
los recuadros y separadores escritos en el contenido, las pestañas Onetopic,
el encabezado institucional y las correcciones del footer y cajones.

Para comprobarlo: instalar beta8, purgar cachés y abrir el curso 29782, sección 0.
El menú Curso/Configuración/Participantes debe quedar sobre fondo blanco y
Documentación de la Maestría debe perder la tarjeta gris exterior, conservando
su título gris y botones violetas. Comprobar también móvil y modo edición.

Validación: compilador scssphp y minificador reales de Moodle 5.3; pruebas de
Board/Página/Onetopic y superficies del curso a 390, 768, 1440 y 1920px (12
vistas), más títulos de Tablero/Mis cursos y footer con SCSS adicional del campus
en 10 vistas. Se verifican transparencia, ausencia del borde exterior,
conservación del borde escrito dentro del contenido y controles de finalización.
Estas son pruebas locales con la estructura observada en Virtual Test; la
confirmación visual en el campus requiere instalar esta versión.
