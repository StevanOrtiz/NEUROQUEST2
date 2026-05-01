# 🧾 Notas de Actualización - Trabajo con Codex

Este documento resume los cambios, mejoras y arreglos realizados durante la sesión de trabajo con Codex sobre QuestMind.

---

## 1. Migración a npm

- Se migró el proyecto para usar **npm** como package manager.
- Se dejó `package-lock.json` como lockfile principal.
- Se eliminó el lockfile anterior del proyecto.
- Se reemplazaron comandos del gestor anterior por comandos `npm` en documentación/configuración donde aplicaba.
- Se dejó `packageManager` como `npm@11.8.0` en `package.json`.

---

## 2. Reducción Masiva de Costos de Claude/PDF

Se optimizó el flujo de generación de preguntas para evitar mandar PDFs completos a Claude por defecto.

### Cambios principales

- Extracción local de texto con `pdf-parse`.
- Limpieza de texto:
  - espacios repetidos,
  - saltos excesivos,
  - números de página aislados,
  - palabras cortadas por guion y salto de línea.
- Detección de PDFs escaneados o sin texto seleccionable.
- Rechazo claro de PDFs sin texto, salvo fallback caro explícito.
- Límite fuerte con `ANTHROPIC_MAX_INPUT_CHARS=35000`.
- Selección de extractos distribuidos para PDFs largos.
- Estimación simple de tokens con `chars / 4`.
- Modelo por defecto más barato: `claude-haiku-4-5`.
- Reducción de `max_tokens` con `ANTHROPIC_MAX_OUTPUT_TOKENS=2800`.
- Prompt más corto, estricto y con salida JSON obligatoria.
- Validación robusta del JSON devuelto por Claude.
- Prompt caching con `cache_control` aplicado sobre el bloque estable del PDF.
- Variables de control:
  - `ANTHROPIC_PROMPT_CACHE`
  - `ANTHROPIC_CACHE_TTL`
  - `AI_REUSE_GENERATED_QUESTIONS`
  - `ANTHROPIC_ALLOW_DIRECT_PDF_FALLBACK`

### Ahorro adicional

- Se calcula SHA-256 del PDF original.
- Si el mismo usuario sube el mismo PDF con la misma dificultad/cantidad suficiente de preguntas, se reutilizan preguntas previas sin llamar a Claude.
- Se añadieron métricas de uso/cache/modelo en sesiones.

Script relacionado:

```text
scripts/011_ai_cost_optimization_prompt_cache.sql
```

---

## 3. Dashboard Principal Mejorado

- Se reorganizó el dashboard para ocupar mejor la pantalla completa.
- Se corrigieron espacios vacíos y columnas descuadradas.
- Se agregó un fondo animado, gamificado e interactivo al pasar el mouse.
- Se mantuvo liviano para no sobrecargar la experiencia.
- Se movió el chequeo TDAH a la zona izquierda del dashboard.
- Se convirtió el chequeo TDAH en desplegable.
- Se convirtió el historial de partidas en desplegable.
- Se reorganizaron materias, nueva partida, SUS y acciones laterales para una composición más ordenada.

---

## 4. About Us Público y Problema de Sesión

- Se corrigió el problema donde entrar a **About Us** podía cerrar o romper la sesión.
- About Us quedó visible para usuarios con sesión y sin sesión.
- Se agregó acceso a About desde login/register y navegación protegida.
- Se convirtió `/about` en una ruta estática/liviana.
- Se evitó cargar capas pesadas de usuario registrado en rutas públicas.

Resultado:

- `/about` aparece como ruta estática en build.
- Se redujo el riesgo de “Compiling” infinito en desarrollo.

---

## 5. Chequeo Breve de TDAH

- Se añadió un cuestionario breve basado en **ASRS-v1.1**.
- Se agregó fuente profesional visible.
- El resultado:
  - no diagnostica,
  - orienta si conviene consultar con un profesional de salud mental.
- Se guarda en Supabase.
- Se limitó a **un solo resultado por usuario**.
- Al completarse:
  - el bloque queda gris,
  - muestra `(COMPLETADO)`,
  - no permite volver a desplegar preguntas.
- Se añadió logro asociado:
  - **Brújula Interior**.

Script relacionado:

```text
scripts/012_adhd_screening_results.sql
```

---

## 6. Reportes Día 0 vs Día 3

- Se añadió lógica para recolectar datos de uso y comparar progreso.
- Se creó un reporte visual para comparar:
  - resultados iniciales,
  - últimos resultados al cumplir 3 días de racha.
- Se añadió botón:
  - **Reporte Día 0 vs Día 3**.
- Se optimizó para que la generación/actualización de reportes no bloquee la navegación.

Script relacionado:

```text
scripts/013_user_usage_reports.sql
```

---

## 7. Mapa de Progreso Tipo Aventura

- Se reemplazó la lista plana de materias por un mapa gamificado.
- Se añadieron nodos animados, estilo aventura/RPG y detalles neon.
- Se mantuvo coherente con la identidad visual de QuestMind.

---

## 8. Mascota: Gato Calicó Pixel Art

Se creó un sistema de mascota visible para usuarios registrados.

### Comportamientos

- Se mueve aleatoriamente por la pantalla.
- Puede dormir, saltar y reaccionar.
- Está por encima de la interfaz.
- Da mensajes motivadores.
- Recuerda tomar descansos y beber agua.
- Reacciona a eventos como logros, cofres, tareas y progreso.

### Interacciones

- Click/toque abre menú.
- Opciones:
  - Acariciar,
  - Darle un pescado,
  - Ponerle nombre.
- Al acariciarlo reproduce sonido tipo ronroneo.
- Se puede arrastrar manteniendo click.
- Tiene sensación tipo ragdoll al moverlo.
- Si se sacude demasiado, se queja.
- Después de cada interacción vuelve a su estado normal.

---

## 9. Sistema de Logros y Medallas

- Se añadió tabla `user_achievements`.
- Se añadieron medallas visibles en el perfil.
- Se añadieron logros por:
  - primera racha de 3 días,
  - primer PDF completado,
  - 80% o más de precisión,
  - primera materia completada,
  - primer módulo completado,
  - primer Pomodoro,
  - primer cofre,
  - primera victoria,
  - nivel 3,
  - chequeo TDAH,
  - primera tarea,
  - primera tarea completada,
  - primer documento en cofre,
  - 5 tareas completadas.

Script relacionado:

```text
scripts/014_user_achievements.sql
```

---

## 10. Animación Grande de Logro Desbloqueado

- Se añadió overlay global para medallas desbloqueadas.
- Aparece justo cuando la API confirma un logro.
- Incluye:
  - fondo con blur,
  - partículas,
  - glow según rareza,
  - icono,
  - título,
  - descripción,
  - rareza.
- Soporta cola de logros si se desbloquean varios seguidos.
- Respeta `prefers-reduced-motion`.

Archivos principales:

```text
components/achievements/achievement-unlock-overlay.tsx
lib/achievements/client-events.ts
components/shell/protected-experience-layer.tsx
```

---

## 11. Tu Cofre Personal

Se añadió una nueva sección:

```text
/dashboard/personal-chest
```

### Funcionalidad

- Crear tareas/misiones.
- Campos:
  - nombre,
  - materia,
  - fecha de entrega,
  - tipo,
  - descripción,
  - documentos relevantes.
- Ver tareas en columna izquierda.
- Ver detalles en panel derecho.
- Completar tareas.
- Eliminar tareas.
- Eliminar también documentos asociados para liberar espacio.
- Notificación al entrar si hay tareas pendientes o vencidas.

### Documentos

- Los documentos subidos usan flujo optimizado:
  - no guardar PDF original por defecto,
  - extraer texto/tablas,
  - crear `content.json`,
  - guardar en Supabase Storage,
  - renderizar desde el lector interno.
- Documentos desplegables:
  - leer,
  - renombrar,
  - eliminar.

Script relacionado:

```text
scripts/015_personal_chest_tasks.sql
```

---

## 12. Optimización de Rendimiento y QA

Se hizo una revisión de tiempos de respuesta, rutas y requests.

### Cambios relevantes

- `proxy.ts` ahora solo hace chequeo Supabase en rutas protegidas.
- Rutas públicas como `/about`, login y register evitan trabajo de auth innecesario.
- Se movieron procesos pesados del dashboard a llamadas no bloqueantes.
- Se cachearon resultados client-side de:
  - chequeo TDAH,
  - SUS,
  - resumen de tareas.
- Se evitó que reportes de uso bloqueen `streak/update`.
- Se optimizó la carga del lector del cofre.
- Se corrigieron botones de eliminar/renombrar/cargar documentos en el cofre.
- Se desactivó Vercel Analytics en desarrollo para no ensuciar logs ni cargar scripts innecesarios.
- Se aisló la mascota y el Pomodoro para que solo carguen en rutas protegidas.

---

## 13. Supabase y Storage

Se añadieron/ajustaron estructuras para:

- Métricas de IA y cache.
- Resultados TDAH.
- Reportes de progreso.
- Logros del usuario.
- Tareas del cofre personal.
- Documentos procesados por tarea.
- Limpieza de Storage al eliminar documentos/tareas.

Bucket previsto:

```text
study-documents
```

Ruta de documentos:

```text
users/{userId}/tasks/{taskId}/documents/{documentId}/content.json
users/{userId}/tasks/{taskId}/documents/{documentId}/images/page-1-img-1.webp
```

---

## 14. Validaciones Ejecutadas

Durante el trabajo se ejecutaron validaciones varias veces:

```bash
npx tsc --noEmit
npm run build
```

Estado más reciente:

- TypeScript: OK.
- Build: OK.
- `/about`: prerenderizado como ruta estática.

Nota:

- `npm run lint` falla actualmente porque el comando `eslint .` existe, pero `eslint` no está instalado/configurado correctamente en el proyecto.

---

## 15. Resultado Actual

QuestMind ahora tiene:

- IA más barata y controlada.
- Mejor dashboard.
- Más gamificación.
- Mascota interactiva.
- Logros con celebración visual.
- Cofre personal para tareas/documentos.
- Reportes de progreso.
- About público sin romper sesión.
- npm como package manager.
- Scripts SQL nuevos para la base de datos.

En resumen: la app pasó de ser un generador de quizzes con PDFs a sentirse más como una plataforma RPG de estudio, enfoque y seguimiento de progreso. ⚔️📚
