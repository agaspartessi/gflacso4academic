# Adaptación de Académico a Moodle 5.1 y 5.3

Fecha: 7 de octubre de 2026. Rama: `moodle-5.1-5.3`. Release: `2.0.0-beta1`.

La rama parte de `main` de Académico en `b91fac1f31c2411f845007a750d40881f67d22a5`.
Se usa como referencia la estructura de Cooperación en
`0843e340c96e09b654fc8e2663115d8ff176f4c4` y su historial de ajustes de junio de 2026.
No se fusiona ni modifica `main`. No se modifica Cooperación ni Uruguay.

## Archivos y motivos

| Archivo | Cambio |
| --- | --- |
| `config.php` | Carga explícita de `lib.php`, `editor_sheets = []` y callback nativo para `pre.scss`. Conserva Boost como padre, posición de bloques, interruptor de edición y exclusión de Home. |
| `lib.php` | Separa las variables iniciales del preset y conserva los presets `default.scss`, `plain.scss`, subidos y fallback. Lee los ajustes del objeto del theme Académico. Mantiene `post.scss` después del preset y deja el Raw SCSS final al callback heredado de Boost. |
| `lib.php` | Para `plain.scss`, importa `design-system` si ese archivo existe en Boost. En el código 5.3 revisado, el preset plain omite los tokens MDS requeridos por el SCSS de Moodle. En 5.1 no se añade esa importación. |
| `version.php` | Versión `2026100700`; mínimo Moodle y Boost `2025100600` (5.1). Madurez `MATURITY_BETA`, release `2.0.0-beta1`. No impide instalar en 5.3 ni fija un máximo no verificado. |
| `scss/post.scss` | Extiende las reglas de la navbar a `.bg-body` y a enlaces que ya no dependen de `.navbar-light`. Conserva colores y gradientes originales de Académico. Corrige el blanco del SVG del menú, que antes contenía el texto literal `$white`. |
| `scss/post.scss` | Asigna colores y tipografía propios a los nuevos menús `.mds-nav-pill` de 5.3, con variables limitadas a cada enlace para no volver ilegibles los dropdowns. Mantiene el foco de teclado. |
| `scss/post.scss` | Define explícitamente el contenedor flex del login, que Boost 5.3 ya no proporciona. |
| `templates/core/login_layout.mustache` | Override del nuevo parcial de 5.3: conserva el fondo de página y formulario a la derecha de Académico. Mantiene `output.main_content` dinámico para autenticación, OAuth y MFA. 5.1 no utiliza este parcial. |
| `tools/check_compatibility.php` | Verificación CLI reproducible con los callbacks, clase `theme_config`, compilador `core_scss` y SCSS reales de la instalación indicada; usa dobles para almacenamiento y servicios que requieren base de datos. No carga `config.php` del campus ni accede a su base. |
| `README.md` y este documento | Estado de la rama, detalle de cambios, límites y pasos de testing. |

## Diferencia deliberada con Cooperación

Moodle ejecuta también los callbacks de los themes padres, con los ajustes del
theme hijo. Boost ya añade `brandcolor`, `scsspre` y `scss`. Copiarlos nuevamente
en callbacks propios puede repetir importaciones o reglas y calcular derivados
antes de aplicar el color final.

En esta rama, el orden es:

1. Callback inicial de Boost: color de marca y Raw initial SCSS de Académico.
2. Callback de Académico: `scss/pre.scss`, con sus valores `!default`.
3. Preset seleccionado y `scss/post.scss` de Académico.
4. Callback final de Boost: Raw SCSS y reglas de fondos.

El Raw SCSS se incluye una sola vez. Para conservar esa prioridad, `post.scss`
queda en el contenido principal: no se registra un segundo callback final.
`$CFG->dirroot` ya apunta a `public` en 5.1/5.3; no se agrega otro `/public`.
Los archivos propios se localizan mediante `__DIR__`.

## Identidad conservada

`scss/pre.scss` queda idéntico a `main`: primario azul `hsl(213, 59%, 50%)`,
secundario `hsl(333, 59%, 50%)`, color institucional `hsl(213, 59%, 19%)`,
paleta de actividades y familias Roboto. Se conservan las imágenes, logos,
iconos, diseños de contenidos/cursos, settings y footer institucional.
No se reemplaza el SCSS completo por el de Cooperación.

El mixin `gradient-y-three-colors` sigue existiendo en el Bootstrap incluido
en ambas versiones revisadas, por lo que no se cambia innecesariamente.

## Validación

Se revisa contra estas revisiones de Moodle:

- 5.1.8, `MOODLE_501_STABLE`: `cc0bf17da8b5fbd290faf95b2b14a03d64331923`.
- 5.3, `MOODLE_503_STABLE`: `42622298fe06f9626d988d60b2bf589bd8f850e8`.

El verificador utiliza PHP 8.3 y el compilador SCSS que viene con cada Moodle.
Prueba default, plain, un preset subido basado en default, un preset faltante
con fallback y ajustes de marca/Raw SCSS. Comprueba el orden y que los marcadores
Raw aparezcan una sola vez. También se revisa la sintaxis PHP y el render del
parcial Mustache con contenido dinámico.

Estas comprobaciones no equivalen a un campus instalado ni a pruebas visuales
completas. La rama queda beta hasta verificar autenticación, navegación, cursos,
actividades y plugins con los ajustes reales de FLACSO.

Para reproducir la compilación (requiere PHP con ctype y mbstring o iconv):

```bash
php tools/check_compatibility.php /ruta/al/moodle
```

El segundo argumento opcional es una carpeta donde guardar el CSS compilado.
Ejecutar en un checkout de testing. El script sólo admite CLI.

## Instalación y prueba en testing

1. Descargar o clonar esta rama. La carpeta del plugin debe llamarse
   `gflacso4academic`, sin el sufijo de la rama.
2. Ubicarla en `<moodle>/public/theme/gflacso4academic` en Moodle 5.1/5.3.
3. Visitar **Site administration > Notifications** para registrar la versión.
4. Ejecutar **Site administration > Development > Purge caches**.
5. Seleccionar Académico en **Site administration > Appearance > Theme selector**.
6. Revisar primero con preset default. Probar luego plain y los presets propios.
7. Probar login, recuperación de contraseña, autenticación externa y MFA si se
   usan; navbar, menú More, navegación secundaria e interruptor de edición;
   dashboard, My courses, índice y cajón de bloques; foros, cuestionarios,
   tareas, H5P, formularios, modales y footer. Ver escritorio y móvil, con roles
   de estudiante, docente y administrador.
8. Probar color de marca, Raw initial SCSS y Raw SCSS con los valores del campus.
   Comparar colores y diseños con el entorno actual y revisar logs PHP/consola.

Los presets subidos deben ser compatibles con el Moodle de destino. En 5.3,
un preset propio basado en el plain antiguo puede necesitar
`@import "design-system";` antes de Bootstrap/Moodle; no se reescriben archivos
subidos por el administrador. Las URLs absolutas, IDs de cursos y reglas de
plugins externos ya presentes se conservan y requieren revisión en el campus.
El modo oscuro experimental de Boost 5.3 no está validado para esta identidad.

## Referencias oficiales

- [API de themes](https://moodledev.io/docs/5.1/apis/plugintypes/theme)
- [Migración a Bootstrap 5](https://moodledev.io/docs/5.1/guides/bs5migration)
- [Moodle 5.3](https://moodledev.io/general/releases/5.3)
- [Código de Boost 5.1](https://github.com/moodle/moodle/tree/MOODLE_501_STABLE/public/theme/boost)
- [Código de Boost 5.3](https://github.com/moodle/moodle/tree/MOODLE_503_STABLE/public/theme/boost)
