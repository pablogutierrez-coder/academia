# Modelo de datos

```mermaid
erDiagram
  ORGANIZACION ||--o{ USUARIO : tiene
  USUARIO }o--o{ ROL : usuarios_roles
  ROL }o--o{ PERMISO : roles_permisos
  ORGANIZACION ||--o{ PROGRAMA : ofrece
  PROGRAMA ||--o{ VERSION_PROGRAMA : versiona
  VERSION_PROGRAMA ||--o{ MODULO_ACADEMICO : contiene
  MODULO_ACADEMICO ||--o{ TEMA : contiene
  PROGRAMA ||--o{ GRUPO : instancia
  GRUPO }o--o{ ESTUDIANTE : estudiantes_grupos
  GRUPO ||--o{ CLASE : agenda
  DOCENTE ||--o{ CLASE : imparte
  TEMA ||--o{ CLASE : desarrolla
  CLASE ||--o{ HISTORIAL_CLASE : registra
  USUARIO ||--o{ AUDITORIA : ejecuta
```

Las tablas principales incorporan UUID, organización, `created_at`, `updated_at`, actor, borrado lógico y versión. Índices cubren estado, fechas, claves foráneas y búsquedas. PostgreSQL aplica unicidad e integridad además de la validación de aplicación.
