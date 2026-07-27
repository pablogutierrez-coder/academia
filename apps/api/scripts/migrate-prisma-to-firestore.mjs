import { resolve } from "node:path";
import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { applicationDefault, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

config({path:[resolve(process.cwd(),".env"),resolve(process.cwd(),"../../.env")],quiet:true});

const execute = process.argv.includes("--execute");
const projectId = process.env.FIREBASE_PROJECT_ID ?? process.env.GCLOUD_PROJECT;
if (!projectId) {
  throw new Error("Define FIREBASE_PROJECT_ID (o GCLOUD_PROJECT) antes de migrar.");
}

const emulator = Boolean(process.env.FIRESTORE_EMULATOR_HOST);
const app = getApps()[0] ?? initializeApp(emulator ? { projectId } : { projectId, credential: applicationDefault() });
const firestore = getFirestore(app);
firestore.settings({ ignoreUndefinedProperties: true });
const prisma = new PrismaClient();

function usernameBase(fullName) {
  const parts = fullName
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return [parts[0] ?? "usuario", parts.at(-1) ?? "siga"].join(".");
}

function serializable(value) {
  if (value === null || value === undefined) return value;
  if (value instanceof Date) return value;
  if (Array.isArray(value)) return value.map(serializable);
  if (typeof value === "object") {
    return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined).map(([key, item]) => [key, serializable(item)]));
  }
  return value;
}

function withoutRelations(record, relationKeys = []) {
  return serializable(Object.fromEntries(Object.entries(record).filter(([key]) => !relationKeys.includes(key))));
}

async function main() {
  const [organizations, users, programs, groups, teachers, students, enrollments, classes, histories, audits, roles, permissions] = await Promise.all([
    prisma.organizacion.findMany(),
    prisma.usuario.findMany({ include: { roles: { include: { rol: { include: { permisos: { include: { permiso: true } } } } } } } }),
    prisma.programa.findMany(),
    prisma.grupo.findMany(),
    prisma.docente.findMany(),
    prisma.estudiante.findMany(),
    prisma.estudianteGrupo.findMany(),
    prisma.clase.findMany({ include: { grupo: { select: { organizacionId: true } } } }),
    prisma.historialClase.findMany({ include: { clase: { include: { grupo: { select: { organizacionId: true } } } } } }),
    prisma.auditoria.findMany({ include: { usuario: { select: { organizacionId: true } } } }),
    prisma.rol.findMany({ include: { permisos: { include: { permiso: true } } } }),
    prisma.permiso.findMany(),
  ]);

  const writes = [];
  const add = (reference, data) => writes.push({ reference, data: serializable(data) });
  const orgReference = (orgId) => firestore.collection("organizations").doc(orgId);

  for (const organization of organizations) add(orgReference(organization.id), organization);

  const usedUsernames = new Map();
  for (const user of users) {
    const current = usedUsernames.get(user.organizacionId) ?? new Set();
    const base = usernameBase(user.nombre);
    let username = base;
    for (let suffix = 2; current.has(username); suffix += 1) username = `${base}${suffix}`;
    current.add(username);
    usedUsernames.set(user.organizacionId, current);
    const permissionCodes = [...new Set(user.roles.flatMap(({ rol }) => rol.permisos.map(({ permiso }) => permiso.codigo)))];
    const profile = user.roles.map(({ rol }) => rol.nombre).join(", ");
    add(orgReference(user.organizacionId).collection("users").doc(user.id), {
      ...withoutRelations(user, ["roles"]),
      usuario: username,
      usuarioNormalizado: username,
      correoNormalizado: user.correo.toLowerCase(),
      permisos: permissionCodes,
      perfil: profile,
    });
  }

  for (const program of programs) add(orgReference(program.organizacionId).collection("programs").doc(program.id), program);
  for (const group of groups) add(orgReference(group.organizacionId).collection("groups").doc(group.id), group);
  for (const teacher of teachers) add(orgReference(teacher.organizacionId).collection("teachers").doc(teacher.id), teacher);
  for (const student of students) add(orgReference(student.organizacionId).collection("students").doc(student.id), student);

  const groupOrganization = new Map(groups.map((group) => [group.id, group.organizacionId]));
  for (const enrollment of enrollments) {
    const organizationId = groupOrganization.get(enrollment.grupoId);
    if (organizationId) add(orgReference(organizationId).collection("enrollments").doc(`${enrollment.grupoId}_${enrollment.estudianteId}`), enrollment);
  }
  for (const item of classes) {
    add(orgReference(item.grupo.organizacionId).collection("classes").doc(item.id), withoutRelations(item, ["grupo"]));
  }
  for (const history of histories) {
    add(
      orgReference(history.clase.grupo.organizacionId).collection("classes").doc(history.claseId).collection("history").doc(history.id),
      withoutRelations(history, ["clase"]),
    );
  }
  for (const audit of audits) {
    const organizationId = audit.usuario?.organizacionId;
    if (organizationId) add(orgReference(organizationId).collection("audit").doc(audit.id), withoutRelations(audit, ["usuario"]));
  }
  for (const role of roles) {
    add(firestore.collection("authorization").doc("catalog").collection("roles").doc(role.id), {
      ...withoutRelations(role, ["permisos"]),
      permisos: role.permisos.map(({ permiso }) => permiso.codigo),
    });
  }
  for (const permission of permissions) add(firestore.collection("authorization").doc("catalog").collection("permissions").doc(permission.id), permission);

  const summary = {
    mode: execute ? "execute" : "dry-run",
    projectId,
    emulator,
    documents: writes.length,
    organizations: organizations.length,
    users: users.length,
    programs: programs.length,
    groups: groups.length,
    teachers: teachers.length,
    students: students.length,
    enrollments: enrollments.length,
    classes: classes.length,
  };
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  if (!execute) {
    process.stdout.write("No se escribió ningún documento. Ejecuta pnpm firebase:migrate para confirmar.\n");
    return;
  }

  for (let offset = 0; offset < writes.length; offset += 400) {
    const batch = firestore.batch();
    for (const write of writes.slice(offset, offset + 400)) batch.set(write.reference, write.data, { merge: true });
    await batch.commit();
  }
  process.stdout.write(`Migración completada: ${writes.length} documentos escritos.\n`);
}

try {
  await main();
} finally {
  await prisma.$disconnect();
}
