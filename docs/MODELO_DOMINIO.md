# Modelo de dominio

Contextos: Identidad, Catálogo académico, Personas, Programación, Asistencia, Retención, Incidencias, Documentos, Evaluación, Comunicaciones, Auditoría y Analítica.

Agregados iniciales:

- Organización gobierna usuarios, roles y configuración.
- Programa contiene versiones, módulos y temas.
- Grupo instancia un programa y matricula estudiantes.
- Clase agenda un tema para un grupo y asigna docente.
- HistorialClase registra toda transición o modificación.
- Auditoría registra el antes, después, motivo, actor y correlación.

Invariantes: aislamiento por organización; registros académicos no se eliminan físicamente; cambios concurrentes se protegen con `version`; estados cambian sólo por transiciones admitidas.
