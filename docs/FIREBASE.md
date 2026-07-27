# Integración con Firebase / Cloud Firestore

La API puede trabajar con tres proveedores sin cambiar la interfaz web:

- `DEMO_MODE=true`: datos ficticios en memoria.
- `DATA_PROVIDER=prisma`: PostgreSQL mediante Prisma (compatibilidad y retorno seguro).
- `DATA_PROVIDER=firebase`: Cloud Firestore mediante Firebase Admin SDK.

Firebase se usa exclusivamente desde `apps/api`. No se exponen claves privadas ni configuración administrativa mediante variables `NEXT_PUBLIC_*`.

## 1. Crear el proyecto

1. Crea o selecciona el proyecto en Firebase Console.
2. Habilita Cloud Firestore en modo nativo.
3. Define un identificador real para la organización inicial.
4. Para desarrollo con recursos reales, autentica la API con Application Default Credentials. En una máquina local también puedes definir `GOOGLE_APPLICATION_CREDENTIALS` con la ruta absoluta a una cuenta de servicio.

Nunca guardes el JSON de una cuenta de servicio dentro del repositorio. Los patrones habituales están excluidos en `.gitignore`.

## 2. Configurar variables

Copia `.env.example` a `.env` y configura:

```dotenv
DEMO_MODE=false
DATA_PROVIDER=firebase
FIREBASE_PROJECT_ID=mi-proyecto-firebase
FIREBASE_DEFAULT_ORGANIZATION_ID=uuid-real-de-la-organizacion
FIREBASE_STORAGE_BUCKET=mi-proyecto-firebase.firebasestorage.app
GOOGLE_APPLICATION_CREDENTIALS=C:\ruta\segura\cuenta-servicio.json
```

`JWT_SECRET` debe seguir siendo un secreto independiente y robusto.
El bucket se obtiene en Firebase Console → Storage. Es necesario para archivos
PDF, PPT/PPTX, videos y otros recursos de la ruta de aprendizaje.

## 3. Desarrollo seguro con el emulador

Configura temporalmente:

```dotenv
DEMO_MODE=false
DATA_PROVIDER=firebase
FIREBASE_PROJECT_ID=demo-siga-elite
GCLOUD_PROJECT=demo-siga-elite
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080
FIREBASE_DEFAULT_ORGANIZATION_ID=00000000-0000-4000-8000-000000000001
```

Inicia Firestore y su interfaz:

```bash
pnpm firebase:emulators
```

- Firestore: `127.0.0.1:8080`
- Emulator UI: `http://127.0.0.1:4001`

La UI usa el puerto 4001 para no colisionar con la API del proyecto, que utiliza el 4000.

## 4. Inicializar una instalación nueva

Para revisar todo lo que se creará sin escribir en Firestore:

```bash
pnpm firebase:seed:dry
```

Para crear o actualizar la estructura base de SIGA:

```bash
pnpm firebase:seed
pnpm firebase:validate
```

`firebase:validate` inspecciona el proyecto configurado y comprueba colecciones,
documentos de referencia, relaciones y campos obligatorios sin modificar datos.
Los archivos del LMS se guardan en Storage y su metadata se registra en
`organizations/{organizationId}/courseResources`.

La inicialización incluye organización, seguridad, usuarios, programas, cursos,
grupos, matrículas, clases, asistencias, rutas LMS, evaluaciones, notas,
encuestas NPS, seguimiento de faltas, retención, tickets, certificados,
solicitudes, notificaciones y auditoría. Los identificadores son deterministas y
las escrituras usan combinación, por lo que el comando se puede volver a ejecutar
sin duplicar registros.

## 5. Migrar PostgreSQL a Firestore

La migración conserva los UUID, contraseñas Argon2, permisos y relaciones principales. Genera el usuario en formato `nombre.apellido`; ante duplicados añade un sufijo sucesivo.

Primero revisa el resumen sin escribir:

```bash
pnpm firebase:migrate:dry
```

Después ejecuta la migración deliberadamente:

```bash
pnpm firebase:migrate
```

El script necesita tanto `DATABASE_URL` como la configuración de Firebase. Es idempotente por identificador: usa escrituras con combinación (`merge`) y puede volver a ejecutarse.

## 6. Estructura de colecciones

```text
organizations/{organizationId}
  users/{userId}
  programs/{programId}
  groups/{groupId}
  teachers/{teacherId}
  students/{studentId}
  enrollments/{groupId_studentId}
  classes/{classId}
    history/{historyId}
  audit/{auditId}

authorization/catalog
  roles/{roleId}
  permissions/{permissionId}
```

Esta separación mantiene los datos académicos aislados por organización y evita consultas globales accidentales.

## 7. Reglas e índices

Las reglas incluidas bloquean todo acceso directo de clientes. La API usa Firebase Admin y la autorización continúa resolviéndose en NestJS mediante sesión, organización y permisos.

Despliega reglas e índices con:

```bash
firebase use mi-proyecto-firebase
pnpm firebase:deploy
```

Si la sesión interactiva del CLI ha caducado, las reglas también se pueden
publicar con la cuenta de servicio configurada:

```bash
pnpm firebase:deploy:rules
```

La creación de índices compuestos requiere además permisos de administración de
índices en IAM. Si quedan pendientes, reautentica Firebase CLI y ejecuta
`pnpm firebase:deploy`.

En producción, limita también la cuenta de servicio mediante IAM al proyecto y funciones estrictamente necesarias.

## 8. Verificación y retorno

Con la API iniciada, `GET /api/health` debe responder `database: "firestore"` y el identificador de proyecto. Para volver temporalmente a PostgreSQL:

```dotenv
DATA_PROVIDER=prisma
```

No es necesario modificar el frontend ni revertir datos para cambiar de proveedor.
