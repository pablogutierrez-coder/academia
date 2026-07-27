# ADR 0002: autenticación con cookie segura

Estado: aceptada.

El navegador recibe tokens en cookie `httpOnly`; la API rota sesiones y valida permisos granulares. Esto reduce exposición ante XSS respecto de almacenamiento accesible a JavaScript. Se requiere protección CSRF en operaciones mutables y TLS en producción.
