# Sesión 1 — Configuración con SQLite

Utiliza esta vía cuando Podman, Docker o un servidor PostgreSQL no estén disponibles. Bun 1.4.0 incluye el driver de SQLite; no hace falta instalar otra base de datos. Cada miembro utiliza sus propios archivos locales.

## 1. Preparar

Importa el ZIP de la sesión en el repositorio del equipo según `QUICKSTART.md`. Instala Git, Bun 1.4.0 y Copilot CLI, e inicia sesión con `copilot login`. Omite los pasos de PostgreSQL y contenedores para esta vía de la sesión 1.

## 2. Configurar

Desde la raíz de la aplicación:

```bash
cp .env.example .env.local
```

Sustituye la línea activa de `DATABASE_URL` por:

```dotenv
DATABASE_URL=sqlite:./.loom/session-01.sqlite
```

Deja `DATABASE_URL_TEST` sin definir para obtener `.loom/session-01_test.sqlite`. Si lo defines explícitamente, utiliza otro archivo SQLite. Nunca utilices el archivo de la aplicación para las pruebas. Las rutas se resuelven desde la raíz de la aplicación. En macOS, sigue la indicación de preflight sobre la ruta del CLI cuando sea necesario.

## 3. Instalar y arrancar

```bash
bun install --frozen-lockfile
bun run db:migrate
bun run db:seed
bun run preflight
bun run typecheck
bun run lint
bun run test
bun run dev
```

El punto de partida tiene exactamente 13 fallos de pruebas previstos, enumerados en `docs/course/session-01/workshop-tests.json`. Completa los tres TODO del taller para que pasen. La consola de desarrollo se abre normalmente en `http://localhost:5173`.

## 4. Conservar los datos

Las ejecuciones y los análisis guardados persisten en `.loom/session-01.sqlite` al reiniciar la API. SQLite también puede crear archivos `-wal` y `-shm`. Git ignora estos archivos y `.env.local`, y los archivos de entrega los excluyen. No borres los datos de la aplicación para corregir un fallo de pruebas.

## 5. Alcance y recuperación

SQLite es una alternativa para la sesión 1. Las sesiones posteriores conservan sus requisitos de PostgreSQL y proporcionan una nueva base. Seleccionar una URL de PostgreSQL mantiene esa vía; los fallos de conexión se notifican sin cambiar automáticamente de almacenamiento. Si SQLite indica un error de permisos, utiliza un directorio en el que puedas escribir y vuelve a ejecutar la migración y preflight.
