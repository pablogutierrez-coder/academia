# Procesos

## Programar una clase

Responsable: coordinador. Actores: asistente, docente, líder docente. Estados: borrador → pendiente de aprobación → programada → confirmada → en ejecución → ejecutada; excepciones: reprogramada, cancelada, observada.

```mermaid
flowchart LR
  A[Seleccionar programa y grupo] --> B[Elegir módulo, tema y horario]
  B --> C[Validar docente, grupo, secuencia y material]
  C -->|Sin conflicto| D[Guardar borrador]
  C -->|Conflicto| X[Corregir o justificar]
  D --> E[Enviar a aprobación]
  E --> F[Aprobar y programar]
  F --> G[Notificar y auditar]
```

## Incidencias

```mermaid
flowchart LR
  A[Registrar] --> B[Clasificar y calcular SLA] --> C[Asignar] --> D[Investigar]
  D --> E[Resolver] --> F[Validar] --> G[Cerrar y aprender]
```

## Retención

```mermaid
flowchart LR
  A[Detectar evento] --> B[Calcular riesgo] --> C[Asignar caso]
  C --> D[Contactar y comprometer] --> E{Resultado}
  E -->|Recuperado| F[Seguimiento]
  E -->|Abandono| G[Motivo, evidencia y autorización]
```

## Control documental

```mermaid
flowchart LR
  A[Cargar nueva versión] --> B[Revisión] --> C{Decisión}
  C -->|Aprobar| D[Vigente]
  C -->|Rechazar| E[Rechazada]
  D --> F[Obsoletar versión anterior]
  F --> G[Auditar]
```
