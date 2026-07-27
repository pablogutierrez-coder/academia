# SIGA Elite

Sistema integral de gestión académica de Elite Expert Academy. Esta entrega contiene el monorepo, la infraestructura local, documentación funcional y el primer corte vertical.

## Requisitos

- Node.js 22 LTS o superior
- pnpm 10
- Docker con Compose

## Inicio

```bash
cp .env.example .env
docker compose up -d
pnpm install
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Web: `http://localhost:3000`. API: `http://localhost:4000/api`. Swagger: `http://localhost:4000/docs`.

Credenciales ficticias: `admin@elite.test` / `SigaElite.Dev.2026!`. Nunca reutilizar en producción.

### Demostración sin Docker

Cuando PostgreSQL no esté disponible puede levantarse una demostración navegable. Este modo no persiste cambios y nunca debe habilitarse en producción:

```powershell
$env:DEMO_MODE="true"
$env:JWT_SECRET="desarrollo-local-secreto-32-caracteres-minimo"
pnpm --filter @siga/api dev
pnpm --filter @siga/web dev
```

WhatsApp permanece definido únicamente como interfaz y proveedor simulado; no existe integración ni envío real.

### Firebase / Cloud Firestore

La persistencia puede cambiarse entre Prisma/PostgreSQL y Firebase Admin/Firestore mediante `DATA_PROVIDER`, sin exponer credenciales al navegador. Incluye emulador local, reglas cerradas, índices, comprobación de salud y migración con vista previa.

Consulta la guía completa en [`docs/FIREBASE.md`](docs/FIREBASE.md).

```bash
pnpm firebase:emulators
pnpm firebase:migrate:dry
pnpm firebase:migrate
```

## Validación

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Estructura

- `apps/web`: interfaz Next.js.
- `apps/api`: API REST NestJS.
- `packages/database`: esquema, migraciones y seed Prisma.
- `packages/contracts`: contratos compartidos.
- `docs`: definición funcional, técnica y decisiones.
