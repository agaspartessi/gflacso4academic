# Académico para Moodle 5.3 — cajones nativos de Boost

Actualizado: 15 de octubre de 2026. Release: `2.0.0-beta2`.

Se actualiza la misma rama `moodle-5.1-5.3`, conservando su nombre para mantener
los enlaces y el PR #5. Desde esta revisión requiere **Moodle 5.3**; 5.1 deja
de ser un objetivo de compatibilidad. `main` no se modifica ni se fusiona.

## Qué se corrige

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
| `scss/post.scss` | Los controles mantienen el tamaño y posición de Boost, con colores de Académico. Se excluye el padding general de `.btn` para que no comprima sus iconos, y se retira el margen vertical del cierre. Se conservan los indicadores de foco de Boost. |
| `scss/post.scss` | Elimina el ancho forzado de `.main-inner`, el padding lateral cero, los márgenes superiores antiguos y el ancho `93vw` de informes de calificaciones. Boost calcula el espacio disponible y los anclajes de ambos cajones de forma consistente. |
| `scss/post.scss` | Retira las alturas fijas de navbar y enlaces; usa la variable compartida de Boost. Devuelve al footer fijo su posición y espaciado nativos para respetar la altura disponible de los cajones. |
| `scss/pre.scss` | Añade `$navbar-height: 62px !default` y `$course-content-maxwidth: 1000px !default`. Todos los cálculos nativos usan esas mismas medidas. La paleta y las tipografías propias se conservan. |
| `version.php` | Versión `2026101500`, mínimo Moodle/Boost `2026100500` (5.3), release `2.0.0-beta2`, madurez BETA. |
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
   **Site administration > Notifications** para registrar `2026101500`.
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
