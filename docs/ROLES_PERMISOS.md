# Roles y permisos

Permisos con formato `recurso.acción`: `usuarios.gestionar`, `roles.gestionar`, `programas.leer`, `programas.gestionar`, `grupos.gestionar`, `docentes.gestionar`, `estudiantes.gestionar`, `clases.programar`, `clases.aprobar`, `asistencia.registrar`, `retencion.gestionar`, `tickets.gestionar`, `auditoria.leer`, `reportes.leer`.

| Rol | Cobertura inicial |
|---|---|
| Superadministrador | Todos los permisos |
| Coordinador académico | Gestión académica, aprobación, auditoría y reportes |
| Líder docente | Revisión de contenidos, clases, docentes e incidencias |
| Soporte académico | Consulta oficial, tickets y retención |
| Asistente académico | Registros, programación preliminar y documentos |
| Docente | Agenda propia, asistencia, materiales e incidencias |
| Estudiante | Información, materiales, progreso y tickets propios |

El backend valida el permiso y el alcance organizacional. El frontend oculta acciones sin permiso, pero nunca sustituye la autorización del servidor.
