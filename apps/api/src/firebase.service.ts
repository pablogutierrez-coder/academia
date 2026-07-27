import { ConflictException, Injectable } from "@nestjs/common";
import { applicationDefault, cert, getApp, getApps, initializeApp, type App, type ServiceAccount } from "firebase-admin/app";
import { FieldValue, getFirestore, type DocumentData, type Firestore, type QueryDocumentSnapshot } from "firebase-admin/firestore";
import { getDataProvider } from "./data-provider";

type ProgramInput = { codigo: string; nombre: string };
type ClassInput = {
  grupoId: string;
  docenteId: string;
  moduloCodigo: string;
  temaCodigo: string;
  titulo: string;
  inicio: string;
  fin: string;
};
type BulkStudent = {
  correo: string;
  usuario: string;
  password: string;
  nombre: string;
  dni: string;
  cursoId: string;
};
export type FirebaseUser = {
  id: string;
  organizacionId: string;
  nombre: string;
  usuario: string;
  correo: string;
  passwordHash: string;
  estado: string;
  permisos: string[];
  perfil?: string;
};

const activeClassStates = new Set(["BORRADOR", "PENDIENTE_APROBACION", "PROGRAMADA", "CONFIRMADA", "EN_EJECUCION", "EJECUTADA"]);

function normalizeSnapshot(snapshot: QueryDocumentSnapshot<DocumentData>): DocumentData & { id: string } {
  return { id: snapshot.id, ...snapshot.data() };
}

function firebaseCredential() {
  const encoded = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON ??
    (encoded ? Buffer.from(encoded, "base64").toString("utf8") : undefined);
  if (!raw) return applicationDefault();

  try {
    return cert(JSON.parse(raw) as ServiceAccount);
  } catch {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_JSON o FIREBASE_SERVICE_ACCOUNT_BASE64 no contiene una credencial válida",
    );
  }
}

@Injectable()
export class FirebaseService {
  private app?: App;
  private store?: Firestore;

  get enabled() {
    return getDataProvider() === "firebase";
  }

  private db() {
    if (!this.enabled) throw new Error("Firebase no está configurado como proveedor activo");
    if (this.store) return this.store;

    const projectId = process.env.FIREBASE_PROJECT_ID ?? process.env.GCLOUD_PROJECT;
    if (!projectId) throw new Error("Falta FIREBASE_PROJECT_ID para inicializar Firebase");
    const emulator = Boolean(process.env.FIRESTORE_EMULATOR_HOST);
    this.app = getApps().length
      ? getApp()
      : initializeApp(emulator ? { projectId } : { projectId, credential: firebaseCredential() });
    this.store = getFirestore(this.app);
    this.store.settings({ ignoreUndefinedProperties: true });
    return this.store;
  }

  private organization(orgId: string) {
    return this.db().collection("organizations").doc(orgId);
  }

  async health() {
    await this.db().collection("_system").limit(1).get();
    return {
      provider: "firebase",
      projectId: process.env.FIREBASE_PROJECT_ID ?? process.env.GCLOUD_PROJECT,
      emulator: Boolean(process.env.FIRESTORE_EMULATOR_HOST),
    };
  }

  async dashboard(orgId: string) {
    const org = this.organization(orgId);
    const [programs, groups, students, teachers, classes] = await Promise.all([
      org.collection("programs").where("estado", "==", "ACTIVO").get(),
      org.collection("groups").where("estado", "==", "ACTIVO").get(),
      org.collection("students").where("estado", "==", "ACTIVO").get(),
      org.collection("teachers").where("estado", "==", "ACTIVO").get(),
      org.collection("classes").get(),
    ]);
    return {
      programasActivos: programs.size,
      gruposActivos: groups.size,
      estudiantesActivos: students.size,
      docentesActivos: teachers.size,
      clasesProgramadas: classes.docs.filter((doc) => ["PROGRAMADA", "CONFIRMADA"].includes(String(doc.data().estado))).length,
      clasesEjecutadas: classes.docs.filter((doc) => doc.data().estado === "EJECUTADA").length,
    };
  }

  async listPrograms(orgId: string) {
    const result = await this.organization(orgId).collection("programs").where("deletedAt", "==", null).get();
    return result.docs.map(normalizeSnapshot).sort((a, b) => String(a.nombre).localeCompare(String(b.nombre), "es"));
  }

  async createProgram(orgId: string, input: ProgramInput) {
    const id = input.codigo.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-");
    const reference = this.organization(orgId).collection("programs").doc(id);
    return this.db().runTransaction(async (transaction) => {
      const current = await transaction.get(reference);
      if (current.exists) throw new ConflictException(`Ya existe el programa ${input.codigo}`);
      const now = FieldValue.serverTimestamp();
      const program = { ...input, organizacionId: orgId, estado: "ACTIVO", deletedAt: null, version: 1, createdAt: now, updatedAt: now };
      transaction.create(reference, program);
      return { id, ...input, organizacionId: orgId, estado: "ACTIVO", deletedAt: null, version: 1 };
    });
  }

  async listGroups(orgId: string) {
    const result = await this.organization(orgId).collection("groups").get();
    return result.docs.map(normalizeSnapshot);
  }

  async listTeachers(orgId: string) {
    const result = await this.organization(orgId).collection("teachers").get();
    return result.docs.map(normalizeSnapshot);
  }

  async listStudents(orgId: string) {
    const result = await this.organization(orgId).collection("students").where("deletedAt", "==", null).limit(100).get();
    return result.docs.map(normalizeSnapshot);
  }

  async findUser(login: string): Promise<FirebaseUser | null> {
    const normalized = login.trim().toLowerCase();
    const organizations = await this.db().collection("organizations").get();
    for (const organization of organizations.docs) {
      const users = organization.ref.collection("users");
      let result = await users.where("usuarioNormalizado", "==", normalized).limit(1).get();
      if (result.empty) result = await users.where("correoNormalizado", "==", normalized).limit(1).get();
      if (!result.empty) {
        const document = result.docs[0]!;
        const data = document.data();
        return {
          id: document.id,
          organizacionId: organization.id,
          nombre: String(data.nombre),
          usuario: String(data.usuario),
          correo: String(data.correo),
          passwordHash: String(data.passwordHash),
          estado: String(data.estado ?? "ACTIVO"),
          permisos: Array.isArray(data.permisos) ? data.permisos.map(String) : [],
          ...(data.perfil ? { perfil: String(data.perfil) } : {}),
        };
      }
    }
    return null;
  }

  async createClass(orgId: string, actorId: string, input: ClassInput) {
    const org = this.organization(orgId);
    const inicio = new Date(input.inicio);
    const fin = new Date(input.fin);
    const [group, teacher, possibleClasses] = await Promise.all([
      org.collection("groups").doc(input.grupoId).get(),
      org.collection("teachers").doc(input.docenteId).get(),
      org.collection("classes").where("inicio", "<", fin).get(),
    ]);
    if (!group.exists || !teacher.exists) throw new Error("Grupo o docente inválido");
    const overlap = possibleClasses.docs.some((document) => {
      const item = document.data();
      const itemEnd = item.fin?.toDate?.() ?? new Date(item.fin);
      return activeClassStates.has(String(item.estado)) && itemEnd > inicio && (item.docenteId === input.docenteId || item.grupoId === input.grupoId);
    });
    if (overlap) throw new ConflictException("Existe doble asignación del docente o del grupo");
    const repeated = possibleClasses.docs.some((document) => {
      const item = document.data();
      return item.grupoId === input.grupoId && item.moduloCodigo === input.moduloCodigo && item.temaCodigo === input.temaCodigo && activeClassStates.has(String(item.estado));
    });
    const classRef = org.collection("classes").doc();
    const historyRef = classRef.collection("history").doc();
    const auditRef = org.collection("audit").doc();
    const classData = { ...input, organizacionId: orgId, inicio, fin, estado: "BORRADOR", createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() };
    const batch = this.db().batch();
    batch.create(classRef, classData);
    batch.create(historyRef, { accion: "CREADA", nuevo: classData, actorId, createdAt: FieldValue.serverTimestamp() });
    batch.create(auditRef, { usuarioId: actorId, accion: "CREAR", entidad: "Clase", entidadId: classRef.id, nuevo: classData, modulo: "programacion", correlacion: crypto.randomUUID(), createdAt: FieldValue.serverTimestamp() });
    await batch.commit();
    return { clase: { id: classRef.id, ...classData }, advertencias: repeated ? ["Posible clase repetida: mismo grupo, módulo y tema"] : [] };
  }

  async bulkStudents(orgId: string, students: BulkStudent[], hashPassword: (password: string) => Promise<string>) {
    const org = this.organization(orgId);
    const created: string[] = [];
    const updated: string[] = [];
    for (let offset = 0; offset < students.length; offset += 100) {
      const chunk = students.slice(offset, offset + 100);
      const batch = this.db().batch();
      for (const student of chunk) {
        const studentId = student.dni;
        const studentRef = org.collection("students").doc(studentId);
        const userRef = org.collection("users").doc(studentId);
        const enrollmentRef = org.collection("enrollments").doc(`${student.cursoId}_${studentId}`);
        const exists = await studentRef.get();
        const [firstName = student.nombre, ...lastNames] = student.nombre.trim().split(/\s+/);
        batch.set(studentRef, { documento: student.dni, nombres: firstName, apellidos: lastNames.join(" "), correo: student.correo, estado: "ACTIVO", deletedAt: null, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
        batch.set(userRef, { nombre: student.nombre, usuario: student.usuario, usuarioNormalizado: student.usuario.toLowerCase(), correo: student.correo, correoNormalizado: student.correo.toLowerCase(), passwordHash: await hashPassword(student.password), estado: "ACTIVO", perfil: "ESTUDIANTE", permisos: ["cursos.leer", "asistencia.propia", "notas.propias", "solicitudes.crear", "certificados.leer"], updatedAt: FieldValue.serverTimestamp() }, { merge: true });
        batch.set(enrollmentRef, { estudianteId: studentId, cursoId: student.cursoId, estado: "ACTIVO", fechaIngreso: FieldValue.serverTimestamp() }, { merge: true });
        (exists.exists ? updated : created).push(student.correo);
      }
      await batch.commit();
    }
    return { created, updated, total: students.length };
  }
}
