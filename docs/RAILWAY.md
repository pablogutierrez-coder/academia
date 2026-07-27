# Publicación de SIGA en Railway

SIGA se despliega desde el mismo repositorio como dos servicios:

- `siga-api`: API NestJS y acceso administrativo a Firebase.
- `siga-web`: interfaz Next.js pública.

No se necesita PostgreSQL ni un volumen de Railway cuando
`DATA_PROVIDER=firebase`.

## 1. Preparar la credencial Firebase

No reutilices una clave que haya sido expuesta o guardada dentro del repositorio.
Genera una credencial nueva y conviértela a Base64 en PowerShell:

```powershell
[Convert]::ToBase64String(
  [IO.File]::ReadAllBytes("C:\ruta\segura\nueva-clave-firebase.json")
) | Set-Clipboard
```

El contenido copiado se guardará como variable sellada
`FIREBASE_SERVICE_ACCOUNT_BASE64`. No configures
`GOOGLE_APPLICATION_CREDENTIALS` en Railway porque esa variable representa una
ruta local que no existe dentro del contenedor.

## 2. Crear los servicios

1. En Railway crea un proyecto vacío.
2. Añade dos servicios desde el repositorio
   `pablogutierrez-coder/academia`.
3. Nómbralos exactamente `siga-api` y `siga-web`.
4. Mantén `/` como Root Directory en ambos servicios.
5. En `siga-api`, configura **Railway Config File** como
   `/railway.api.json`.
6. En `siga-web`, configura **Railway Config File** como
   `/railway.web.json`.

Cada archivo selecciona su Dockerfile, healthcheck, política de reinicio y rutas
que activan nuevos despliegues.

## 3. Variables de `siga-api`

Configura:

```dotenv
NODE_ENV=production
DEMO_MODE=false
DATA_PROVIDER=firebase
FIREBASE_PROJECT_ID=academia-7e696
FIREBASE_DEFAULT_ORGANIZATION_ID=00000000-0000-4000-8000-000000000001
FIREBASE_STORAGE_BUCKET=academia-7e696.firebasestorage.app
FIREBASE_SERVICE_ACCOUNT_BASE64=PEGAR_BASE64_DE_LA_CREDENCIAL_NUEVA
JWT_SECRET=GENERAR_UN_SECRETO_LARGO_Y_ALEATORIO
COOKIE_SAME_SITE=none
CORS_ORIGINS=https://${{siga-web.RAILWAY_PUBLIC_DOMAIN}}
```

Sella `FIREBASE_SERVICE_ACCOUNT_BASE64` y `JWT_SECRET` desde el menú de cada
variable. Railway inyecta `PORT` automáticamente; no es necesario definir
`API_PORT`.

Después del primer despliegue genera un dominio público para `siga-api`.
El healthcheck esperado es `/api/health`.

## 4. Variables de `siga-web`

Después de generar el dominio público de la API, configura:

```dotenv
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://${{siga-api.RAILWAY_PUBLIC_DOMAIN}}/api
```

`NEXT_PUBLIC_API_URL` se incorpora durante el build del frontend. Cualquier
cambio de dominio requiere volver a desplegar `siga-web`.

Genera también un dominio público para `siga-web`. Su healthcheck es `/login`.

## 5. Orden de despliegue

1. Despliega `siga-api`.
2. Genera y comprueba el dominio de la API.
3. Despliega `siga-web`.
4. Genera el dominio web.
5. Confirma que `CORS_ORIGINS` en la API coincide exactamente con el dominio
   web, sin barra final, y vuelve a desplegar la API si Railway lo solicita.

## 6. Validación

Comprueba:

```text
https://DOMINIO_API/api/health
https://DOMINIO_WEB/login
```

La respuesta de salud debe indicar `database: "firestore"`,
`provider: "firebase"`, `projectId: "academia-7e696"` y `emulator: false`.

Después inicia sesión y valida dashboard, programas, grupos y estudiantes. Si el
login responde correctamente pero la sesión no persiste, revisa que:

- ambos dominios usen HTTPS;
- `COOKIE_SAME_SITE=none`;
- `CORS_ORIGINS` sea el dominio exacto del frontend;
- el navegador no esté bloqueando cookies de terceros.

Para producción definitiva se recomienda usar dominios propios bajo el mismo
sitio, por ejemplo `app.tudominio.com` y `api.tudominio.com`.

## 7. Variables que no deben publicarse

No copies a Railway:

- `.env`;
- `GOOGLE_APPLICATION_CREDENTIALS` con una ruta de Windows;
- el archivo JSON de la cuenta de servicio;
- contraseñas temporales de desarrollo;
- `DEMO_MODE=true`.
