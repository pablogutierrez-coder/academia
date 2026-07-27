# Seguridad

- Argon2id para contraseñas; nunca se registran credenciales.
- Token de acceso breve en cookie `httpOnly`, `secure` en producción y `sameSite=lax`.
- RBAC granular y alcance por organización en cada consulta.
- DTO con lista permitida, límite de tamaño, rate limiting y manejo centralizado de errores.
- Archivos por tipo, tamaño, hash y análisis antes de publicar.
- Secretos sólo en entorno; política de mínimo privilegio para DB, Redis y S3.
- Auditoría de accesos y acciones críticas con IP y correlación.
- Recuperación de contraseña con token de un solo uso, expiración y revocación de sesiones.

Amenazas prioritarias: escalamiento horizontal, IDOR, inyección, sesiones robadas, archivos maliciosos y exposición entre organizaciones.
