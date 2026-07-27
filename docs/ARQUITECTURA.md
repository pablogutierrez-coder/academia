# Arquitectura

Monolito modular en monorepo. Los límites de módulo separan aplicación, dominio e infraestructura y permiten extraer módulos cuando exista una razón operativa.

```mermaid
flowchart TB
  W[Next.js App Router] -->|REST + cookie httpOnly| A[NestJS API]
  A --> I[Identidad y RBAC]
  A --> G[Gestión académica]
  A --> P[Programación]
  A --> U[Auditoría]
  I & G & P & U --> R[Prisma]
  R --> DB[(PostgreSQL)]
  A --> Q[BullMQ]
  Q --> RD[(Redis)]
  A --> S[StorageProvider]
  S --> M[(MinIO / S3)]
  A --> N[Email/WhatsApp/AI Providers]
```

REST usa DTO validados, errores uniformes, correlación, paginación y Swagger. Operaciones críticas usan transacciones. Fechas se almacenan como `timestamptz`. UUID es el identificador público.
