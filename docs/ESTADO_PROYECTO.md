# Estado del proyecto

## Terminado

Documentación funcional y técnica base; monorepo; infraestructura local; migración inicial y seed; autenticación; RBAC; consultas de programas, grupos, docentes y estudiantes; programación con doble asignación, repetición y auditoría; dashboard; navegación inicial para todos los módulos; modo de demostración sin persistencia; interfaces de proveedores externos con WhatsApp simulado.

## En progreso

Ampliación de formularios CRUD, procesos completos de asistencia, retención, tickets, documentos, evaluaciones y certificados, y pruebas de integración con infraestructura en ejecución.

## Pendiente

Fases 2 a 5 descritas en el roadmap.

## Decisiones

Monolito modular, aislamiento por organización, borrado lógico, adaptadores externos.

## Riesgos

Calidad de migración desde Sheets, reglas todavía no validadas con usuarios, capacidad operativa reducida y dependencia futura de canales externos.

## Errores conocidos

La cobertura automatizada actual se concentra en la regla de solape; faltan pruebas de integración contra PostgreSQL y E2E automatizadas. El equipo local no dispone de Docker/PostgreSQL, por lo que la sesión activa usa datos simulados no persistentes.

## Próximo paso recomendado

Validar procesos, matriz RBAC y datos maestros con coordinación académica antes del piloto.
