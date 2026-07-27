# Decisiones técnicas

- Monolito modular antes que microservicios.
- API REST documentada con OpenAPI.
- PostgreSQL + Prisma para integridad, migraciones y transacciones.
- Redis + BullMQ para trabajo diferido.
- Adaptadores para almacenamiento, correo, WhatsApp e IA.
- Next.js App Router con componentes de servidor por defecto y estado cliente sólo donde aporta interacción.

Versiones se fijan en manifests y se revisan mediante dependabot/Renovate, pruebas y ADR antes de actualizar.
