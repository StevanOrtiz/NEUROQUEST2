# 🧠⚔️ QuestMind

> **Convierte tus PDFs, materias y tareas en una aventura RPG de aprendizaje.**

QuestMind es una plataforma educativa gamificada construida con **Next.js**, **TypeScript**, **Supabase** y **Claude API**. Está pensada para estudiantes que quieren estudiar de forma más dinámica, con quizzes generados desde PDFs, progreso tipo aventura, cofres, medallas, pomodoro, reportes visuales y una mascota pixel art que acompaña la sesión.

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=nextdotjs)
![TypeScript](https://img.shields.io/badge/TypeScript-Quest_Mode-3178c6?style=for-the-badge&logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Storage_+_Auth_+_DB-3ecf8e?style=for-the-badge&logo=supabase&logoColor=white)
![Claude](https://img.shields.io/badge/Claude-Haiku_Optimizado-d97757?style=for-the-badge)
![npm](https://img.shields.io/badge/Package_Manager-npm-cb3837?style=for-the-badge&logo=npm)

---

## ✨ ¿Qué Hace QuestMind?

QuestMind transforma el estudio en una experiencia tipo RPG:

- 📄 **Sube PDFs** y genera preguntas educativas automáticamente.
- 🧠 **Claude genera quizzes**, pero con extracción local de texto para reducir costos.
- 🗺️ **Mapa de progreso por materias** con nodos estilo aventura.
- 🏆 **Logros y medallas** visibles en el perfil.
- 🐱 **Mascota gato calicó pixel art** que se mueve por la pantalla, reacciona y motiva.
- ⏱️ **Pomodoro integrado** para sesiones de enfoque.
- 📊 **Reporte Día 0 vs Día 3** para comparar progreso de uso.
- 🧩 **Chequeo breve de TDAH** basado en ASRS-v1.1, guardado una sola vez por usuario.
- 🧰 **Tu Cofre Personal**, un gestor gamificado de tareas y documentos optimizado para Supabase Storage.

---

## 🧙‍♂️ Stack Principal

| Área | Tecnología |
| --- | --- |
| Framework | Next.js App Router |
| Lenguaje | TypeScript |
| UI | React, Tailwind, shadcn/ui-style components, Framer Motion |
| Auth/DB/Storage | Supabase |
| IA | Anthropic Claude API |
| PDF | `pdf-parse` + flujo optimizado a texto/content.json |
| Package manager | npm |

---

## 🪄 Funciones Destacadas

### 📄 Quizzes Desde PDFs con IA Optimizada

QuestMind ya no manda el PDF completo a Claude por defecto. En su lugar:

- Extrae texto localmente.
- Limpia saltos, espacios, páginas aisladas y guiones cortados.
- Limita el contexto con `ANTHROPIC_MAX_INPUT_CHARS`.
- Usa extractos distribuidos si el documento es largo.
- Calcula hash SHA-256 del PDF.
- Reutiliza preguntas si el mismo usuario sube el mismo PDF con la misma configuración.
- Usa prompt caching de Claude sobre el bloque estable del contenido.
- Rechaza PDFs escaneados sin texto seleccionable, salvo fallback caro explícito.

### 🏆 Sistema de Logros

Los usuarios pueden desbloquear medallas como:

- 🔥 Llama de Tres Días
- 📜 Pergamino Domado
- 🎯 Ojo de Halcón
- 🧭 Brújula Interior
- ⏱️ Reloj de Enfoque
- 🧰 Cofre Ordenado

Cuando se desbloquea una medalla, aparece una **animación grande en pantalla** con partículas, glow, rareza e icono.

### 🐱 Mascota Pixel Art

El gato calicó:

- Se mueve libremente por la pantalla en páginas protegidas.
- Puede dormir, saltar y reaccionar.
- Se puede tocar/clicar para abrir menú.
- Permite acariciar, dar pescado y poner nombre.
- Se puede arrastrar manteniendo click.
- Reacciona si lo sacuden demasiado.
- Da mensajes motivadores y recordatorios de descanso.

### 🧰 Tu Cofre Personal

Una zona tipo inventario/Notion ligero:

- Crear tareas/misiones.
- Asociarlas a materias.
- Poner fecha de entrega, tipo y descripción.
- Subir documentos relevantes.
- Convertir PDFs a `content.json` + imágenes optimizadas.
- Leer documentos sin conservar el PDF original por defecto.
- Renombrar y eliminar documentos.
- Eliminar tarea y limpiar DB + Storage para liberar espacio.

---

## 🚀 Instalación Local

### 1. Clonar e instalar

```bash
git clone https://github.com/StevanOrtiz/NEUROQUEST2.git
cd NEUROQUEST2
npm install
```

### 2. Variables de entorno

Crea `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=

ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=claude-haiku-4-5
ANTHROPIC_MAX_INPUT_CHARS=35000
ANTHROPIC_MAX_OUTPUT_TOKENS=2800
ANTHROPIC_PROMPT_CACHE=true
ANTHROPIC_CACHE_TTL=5m
AI_REUSE_GENERATED_QUESTIONS=true
ANTHROPIC_ALLOW_DIRECT_PDF_FALLBACK=false
```

> ⚠️ Nunca subas `.env.local` ni claves reales al repositorio.

### 3. Ejecutar migraciones SQL

En Supabase SQL Editor, ejecuta los scripts de `scripts/` en orden:

```text
001_profiles.sql
002_game_sessions.sql
003_questions.sql
004_inventory.sql
005_chests.sql
006_subjects.sql
007_streak.sql
008_records_leaderboards.sql
009_sus_form.sql
010_tutorial.sql
011_ai_cost_optimization_prompt_cache.sql
012_adhd_screening_results.sql
013_user_usage_reports.sql
014_user_achievements.sql
015_personal_chest_tasks.sql
```

### 4. Levantar servidor

```bash
npm run dev
```

Abre:

```text
http://localhost:3000
```

---

## 🧪 Comandos Útiles

```bash
npm install
npm run dev
npm run build
npx tsc --noEmit
```

> Nota: el script `npm run lint` existe, pero requiere tener `eslint` configurado/instalado correctamente en el proyecto.

---

## ☁️ Deploy en Vercel

Configura el proyecto con npm:

```text
Install Command: npm install
Build Command: npm run build
Development Command: npm run dev
```

Agrega las variables de entorno en:

```text
Vercel Project Settings → Environment Variables
```

---

## 📦 Package Manager

Este proyecto usa **npm**.

- ✅ Debe existir `package-lock.json`.
- ✅ Se usa `npm install`.
- ✅ Se usa `npm run dev`.
- ✅ Se usa `npm run build`.
- ❌ No se debe conservar un lockfile alternativo.

---

## 🛡️ Seguridad

- No hardcodear secrets.
- No imprimir API keys en logs.
- No guardar PDFs completos en logs.
- No guardar contenido pesado en DB si puede vivir en Storage.
- Para PDFs repetidos, usar hash/reutilización.
- Para documentos del cofre, preferir `content.json` + WebP antes que PDF original.

---

## 🗺️ Estructura Rápida

```text
app/
  api/                    Endpoints de juego, IA, tareas, logros y reportes
  dashboard/              Panel protegido del usuario
  game/[sessionId]/       Experiencia de quiz
  about/                  Página pública del proyecto

components/
  achievements/           Overlay de medallas
  dashboard/              UI principal del dashboard
  game/                   UI de partidas
  mascot/                 Gato calicó pixel art
  tasks/                  Cofre personal

lib/
  achievements/           Configuración y helpers de logros
  ai/                     PDF, Claude, prompt caching y validación JSON
  tasks/                  Procesamiento ligero de documentos
  supabase/               Clientes Supabase

scripts/
  001_*.sql ... 015_*.sql Migraciones SQL
```

---

## 🧭 Filosofía del Proyecto

QuestMind no busca ser solo otra app de quizzes. Busca que estudiar se sienta como avanzar en una aventura: con señales visuales claras, progreso visible, pequeñas recompensas, herramientas de enfoque y una experiencia más amable para estudiantes neurodivergentes.

**Aprender también puede sentirse como subir de nivel.** ⚔️
