import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { applicationDefault, cert, getApp, getApps, initializeApp, type App, type ServiceAccount } from "firebase-admin/app";
import { FieldValue, getFirestore, type DocumentData, type Firestore, type QueryDocumentSnapshot } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
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
export type LearningElementInput = {
  id: string;
  tipo: "PASO" | "EVALUACION" | "FORO";
  titulo: string;
  descripcion: string;
  contenidoTipo: string;
  contenido: string;
  nombreArchivo?: string;
  storagePath?: string;
  tipoMime?: string;
  tamanoBytes?: number;
  tiempo: number;
  requisito: string;
  estado: string;
};
export type LearningModuleInput = {
  id: string;
  titulo: string;
  descripcion: string;
  estado: string;
  elementos: LearningElementInput[];
};
export type LearningPathInput = {
  titulo: string;
  descripcion: string;
  estado: string;
  modulos: LearningModuleInput[];
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
  dni?: string;
  celular?: string;
  whatsapp?: string;
  modulos?: string[];
  cambioPasswordRequerido?: boolean;
};

export type CreateFirebaseUser = {
  nombre: string;
  dni: string;
  celular: string;
  whatsapp: string;
  correo: string;
  perfil: string;
  permisos: string[];
  modulos: string[];
  passwordHash: string;
};

export type AttendanceValidationInput = {
  studentId: string;
  status: "PRESENTE" | "TARDANZA" | "FALTA" | "JUSTIFICADA";
  observation?: string;
};

const activeClassStates = new Set(["BORRADOR", "PENDIENTE_APROBACION", "PROGRAMADA", "CONFIRMADA", "EN_EJECUCION", "EJECUTADA"]);

function normalizeSnapshot(snapshot: QueryDocumentSnapshot<DocumentData>): DocumentData & { id: string } {
  return { id: snapshot.id, ...snapshot.data() };
}

function firestoreDate(value: unknown) {
  if (value && typeof value === "object" && "toDate" in value && typeof (value as { toDate?: unknown }).toDate === "function") {
    return (value as { toDate: () => Date }).toDate();
  }
  const parsed = value instanceof Date ? value : new Date(String(value ?? ""));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function isoDate(value: unknown) {
  return firestoreDate(value)?.toISOString() ?? null;
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
      : initializeApp(emulator ? { projectId } : {
          projectId,
          credential: firebaseCredential(),
          ...(process.env.FIREBASE_STORAGE_BUCKET ? { storageBucket: process.env.FIREBASE_STORAGE_BUCKET } : {}),
        });
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

  private attendanceState(session: DocumentData | undefined) {
    if (!session) return "NOT_OPEN";
    if (session.status === "VALIDATED") return "VALIDATED";
    const closesAt = firestoreDate(session.closesAt);
    return closesAt && closesAt.getTime() > Date.now() ? "OPEN" : "CLOSED";
  }

  private async attendanceContext(orgId: string) {
    const org = this.organization(orgId);
    const [classes, groups, courses, windows] = await Promise.all([
      org.collection("classes").get(),
      org.collection("groups").get(),
      org.collection("courses").get(),
      org.collection("attendanceWindows").get(),
    ]);
    return {
      org,
      classes: classes.docs.map(normalizeSnapshot),
      groups: new Map(groups.docs.map((document) => [document.id, normalizeSnapshot(document)])),
      courses: new Map(courses.docs.map((document) => [document.id, normalizeSnapshot(document)])),
      windows: new Map(windows.docs.map((document) => [document.id, normalizeSnapshot(document)])),
    };
  }

  private attendanceSessionView(
    classDocument: DocumentData & { id: string },
    group: (DocumentData & { id: string }) | undefined,
    course: (DocumentData & { id: string }) | undefined,
    window: (DocumentData & { id: string }) | undefined,
  ) {
    return {
      id: classDocument.id,
      title: String(classDocument.titulo ?? "Sesión académica"),
      startsAt: isoDate(classDocument.inicio),
      endsAt: isoDate(classDocument.fin),
      classStatus: String(classDocument.estado ?? "PROGRAMADA"),
      groupId: String(classDocument.grupoId ?? ""),
      groupCode: String(group?.codigo ?? classDocument.grupoId ?? ""),
      courseId: String(group?.cursoId ?? ""),
      courseName: String(course?.nombre ?? group?.cursoId ?? "Curso"),
      window: window ? {
        status: this.attendanceState(window),
        openedAt: isoDate(window.openedAt),
        closesAt: isoDate(window.closesAt),
        validatedAt: isoDate(window.validatedAt),
        durationMinutes: Number(window.durationMinutes ?? 30),
      } : {
        status: "NOT_OPEN",
        openedAt: null,
        closesAt: null,
        validatedAt: null,
        durationMinutes: 30,
      },
    };
  }

  async teacherAttendanceSessions(orgId: string, userId: string, profile?: string) {
    const context = await this.attendanceContext(orgId);
    const allowedGroups = profile === "Administrador"
      ? null
      : new Set([...context.groups.values()].filter((group) => group.docenteId === userId).map((group) => group.id));
    if (profile !== "Administrador" && profile !== "Docente") throw new ForbiddenException("El perfil no puede gestionar asistencias");
    return context.classes
      .filter((classDocument) => allowedGroups === null || allowedGroups.has(String(classDocument.grupoId)))
      .map((classDocument) => {
        const group = context.groups.get(String(classDocument.grupoId));
        const course = group ? context.courses.get(String(group.cursoId)) : undefined;
        return this.attendanceSessionView(classDocument, group, course, context.windows.get(classDocument.id));
      })
      .sort((a, b) => String(b.startsAt).localeCompare(String(a.startsAt)));
  }

  private async assertTeacherClass(orgId: string, userId: string, profile: string | undefined, classId: string) {
    if (profile !== "Administrador" && profile !== "Docente") throw new ForbiddenException("El perfil no puede gestionar asistencias");
    const org = this.organization(orgId);
    const classSnapshot = await org.collection("classes").doc(classId).get();
    if (!classSnapshot.exists) throw new NotFoundException("La sesión académica no existe");
    const classDocument: DocumentData & { id: string } = { id: classSnapshot.id, ...classSnapshot.data()! };
    const groupSnapshot = await org.collection("groups").doc(String(classDocument.grupoId)).get();
    if (!groupSnapshot.exists) throw new NotFoundException("El grupo de la sesión no existe");
    const group: DocumentData & { id: string } = { id: groupSnapshot.id, ...groupSnapshot.data()! };
    if (profile !== "Administrador" && group.docenteId !== userId) throw new ForbiddenException("La sesión no está asignada al docente");
    return { org, classDocument, group };
  }

  async openAttendanceWindow(orgId: string, userId: string, profile: string | undefined, classId: string) {
    const { org, classDocument, group } = await this.assertTeacherClass(orgId, userId, profile, classId);
    const reference = org.collection("attendanceWindows").doc(classId);
    const now = new Date();
    const closesAt = new Date(now.getTime() + 30 * 60 * 1000);
    await this.db().runTransaction(async (transaction) => {
      const current = await transaction.get(reference);
      if (current.exists) {
        const state = this.attendanceState(current.data());
        if (state === "OPEN") throw new ConflictException("La marcación ya se encuentra habilitada");
        if (state === "VALIDATED") throw new ConflictException("La asistencia ya fue validada");
        throw new ConflictException("La ventana de marcación ya finalizó y no puede volver a abrirse");
      }
      transaction.create(reference, {
        classId,
        courseId: String(group.cursoId ?? ""),
        groupId: group.id,
        teacherId: String(group.docenteId ?? classDocument.docenteId ?? userId),
        openedAt: now,
        closesAt,
        durationMinutes: 30,
        status: "OPEN",
        openedBy: userId,
        createdAt: now,
        updatedAt: now,
      });
      transaction.create(org.collection("audit").doc(), {
        usuarioId: userId,
        accion: "HABILITAR_MARCACION",
        entidad: "AttendanceWindow",
        entidadId: classId,
        modulo: "asistencia",
        correlacion: crypto.randomUUID(),
        createdAt: now,
      });
    });
    return { classId, status: "OPEN", openedAt: now.toISOString(), closesAt: closesAt.toISOString(), durationMinutes: 30 };
  }

  private async enrollmentStudents(orgId: string, groupId: string, courseId: string) {
    const org = this.organization(orgId);
    const [enrollments, students] = await Promise.all([
      org.collection("enrollments").get(),
      org.collection("students").get(),
    ]);
    const enrolledIds = new Set(enrollments.docs
      .filter((document) => {
        const data = document.data();
        return data.estado !== "INACTIVO" &&
          (String(data.grupoId ?? "") === groupId || (!data.grupoId && String(data.cursoId ?? "") === courseId));
      })
      .map((document) => String(document.data().estudianteId)));
    return students.docs
      .filter((document) => enrolledIds.has(document.id) && document.data().deletedAt == null)
      .map((document) => {
        const data = document.data();
        return {
          id: document.id,
          name: String(data.nombre ?? `${data.nombres ?? ""} ${data.apellidos ?? ""}`).trim() || document.id,
          document: String(data.documento ?? data.dni ?? document.id),
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name, "es"));
  }

  async teacherAttendanceDetail(orgId: string, userId: string, profile: string | undefined, classId: string) {
    const { org, classDocument, group } = await this.assertTeacherClass(orgId, userId, profile, classId);
    const courseId = String(group.cursoId ?? "");
    const [courseSnapshot, windowSnapshot, marks, students] = await Promise.all([
      org.collection("courses").doc(courseId).get(),
      org.collection("attendanceWindows").doc(classId).get(),
      org.collection("attendanceMarks").where("classId", "==", classId).get(),
      this.enrollmentStudents(orgId, group.id, courseId),
    ]);
    const markMap = new Map(marks.docs.map((document) => [String(document.data().studentId), normalizeSnapshot(document)]));
    const window = windowSnapshot.exists ? { id: windowSnapshot.id, ...windowSnapshot.data()! } : undefined;
    const session = this.attendanceSessionView(
      classDocument,
      group,
      courseSnapshot.exists ? { id: courseSnapshot.id, ...courseSnapshot.data()! } : undefined,
      window,
    );
    return {
      session,
      students: students.map((student) => {
        const mark = markMap.get(student.id);
        return {
          ...student,
          status: mark ? String(mark.status ?? "PRESENTE") : "PENDING",
          source: mark ? String(mark.source ?? "STUDENT") : null,
          markedAt: mark ? isoDate(mark.markedAt) : null,
          validationStatus: mark ? String(mark.validationStatus ?? "PENDING") : "PENDING",
          observation: mark ? String(mark.observation ?? "") : "",
        };
      }),
    };
  }

  async validateAttendance(
    orgId: string,
    userId: string,
    profile: string | undefined,
    classId: string,
    records: AttendanceValidationInput[],
  ) {
    const { org, group } = await this.assertTeacherClass(orgId, userId, profile, classId);
    const windowReference = org.collection("attendanceWindows").doc(classId);
    const windowSnapshot = await windowReference.get();
    if (!windowSnapshot.exists) throw new BadRequestException("Primero debes habilitar la marcación");
    if (windowSnapshot.data()?.status === "VALIDATED") throw new ConflictException("La asistencia ya fue validada");
    const closesAt = firestoreDate(windowSnapshot.data()?.closesAt);
    if (closesAt && closesAt.getTime() > Date.now()) throw new BadRequestException("La ventana de marcación aún está abierta");
    const students = await this.enrollmentStudents(orgId, group.id, String(group.cursoId ?? ""));
    const enrolledIds = new Set(students.map((student) => student.id));
    const submittedIds = new Set(records.map((record) => record.studentId));
    if (!records.length || submittedIds.size !== enrolledIds.size || records.some((record) => !enrolledIds.has(record.studentId))) {
      throw new BadRequestException("La validación debe incluir una marca final para cada estudiante asignado");
    }
    const now = new Date();
    const batch = this.db().batch();
    for (const record of records) {
      const reference = org.collection("attendanceMarks").doc(`${classId}_${record.studentId}`);
      batch.set(reference, {
        classId,
        courseId: String(group.cursoId ?? ""),
        groupId: group.id,
        studentId: record.studentId,
        status: record.status,
        source: "TEACHER_VALIDATION",
        validationStatus: "VALIDATED",
        validatedAt: now,
        validatedBy: userId,
        observation: record.observation ?? "",
        updatedAt: now,
      }, { merge: true });
    }
    batch.set(windowReference, { status: "VALIDATED", validatedAt: now, validatedBy: userId, updatedAt: now }, { merge: true });
    batch.set(org.collection("audit").doc(), {
      usuarioId: userId,
      accion: "VALIDAR_ASISTENCIA",
      entidad: "AttendanceWindow",
      entidadId: classId,
      modulo: "asistencia",
      correlacion: crypto.randomUUID(),
      createdAt: now,
    });
    await batch.commit();
    return { classId, status: "VALIDATED", validatedAt: now.toISOString(), records: records.length };
  }

  async studentAttendance(orgId: string, userId: string, profile?: string) {
    if (profile !== "Administrador" && profile !== "Estudiante") throw new ForbiddenException("El perfil no puede marcar su asistencia");
    const context = await this.attendanceContext(orgId);
    const enrollmentsSnapshot = await context.org.collection("enrollments").where("estudianteId", "==", userId).get();
    const enrollments = enrollmentsSnapshot.docs.filter((document) => document.data().estado !== "INACTIVO").map((document) => document.data());
    const isAdministrator = profile === "Administrador";
    const courseIds = isAdministrator
      ? new Set([...context.courses.values()].filter((course) => course.deletedAt == null).map((course) => course.id))
      : new Set(enrollments.map((item) => String(item.cursoId ?? "")).filter(Boolean));
    const groupIds = isAdministrator
      ? new Set(context.groups.keys())
      : new Set(enrollments.map((item) => String(item.grupoId ?? "")).filter(Boolean));
    const marksSnapshot = await context.org.collection("attendanceMarks").where("studentId", "==", userId).get();
    const marks = new Map(marksSnapshot.docs.map((document) => [String(document.data().classId), normalizeSnapshot(document)]));
    const sessions = context.classes
      .filter((classDocument) => {
        const group = context.groups.get(String(classDocument.grupoId));
        return group && (groupIds.has(group.id) || courseIds.has(String(group.cursoId ?? "")));
      })
      .map((classDocument) => {
        const group = context.groups.get(String(classDocument.grupoId))!;
        const course = context.courses.get(String(group.cursoId));
        const session = this.attendanceSessionView(classDocument, group, course, context.windows.get(classDocument.id));
        const mark = marks.get(classDocument.id);
        return {
          ...session,
          mark: mark ? {
            status: String(mark.status ?? "PRESENTE"),
            markedAt: isoDate(mark.markedAt),
            validationStatus: String(mark.validationStatus ?? "PENDING"),
            observation: String(mark.observation ?? ""),
          } : null,
        };
      })
      .sort((a, b) => String(b.startsAt).localeCompare(String(a.startsAt)));
    return {
      courses: [...courseIds].map((courseId) => {
        const course = context.courses.get(courseId);
        return { id: courseId, name: String(course?.nombre ?? courseId), progress: Number(course?.progreso ?? 0) };
      }).sort((a, b) => a.name.localeCompare(b.name, "es")),
      sessions,
    };
  }

  async studentCheckIn(orgId: string, userId: string, profile: string | undefined, classId: string) {
    if (profile !== "Administrador" && profile !== "Estudiante") throw new ForbiddenException("El perfil no puede marcar su asistencia");
    const org = this.organization(orgId);
    const [classSnapshot, windowSnapshot] = await Promise.all([
      org.collection("classes").doc(classId).get(),
      org.collection("attendanceWindows").doc(classId).get(),
    ]);
    if (!classSnapshot.exists) throw new NotFoundException("La sesión académica no existe");
    if (!windowSnapshot.exists || this.attendanceState(windowSnapshot.data()) !== "OPEN") {
      throw new BadRequestException("La ventana de marcación no está habilitada o ya finalizó");
    }
    const groupId = String(classSnapshot.data()?.grupoId ?? "");
    const groupSnapshot = await org.collection("groups").doc(groupId).get();
    if (!groupSnapshot.exists) throw new NotFoundException("El grupo de la sesión no existe");
    const courseId = String(groupSnapshot.data()?.cursoId ?? "");
    const enrollments = await org.collection("enrollments").where("estudianteId", "==", userId).get();
    const enrolled = enrollments.docs.some((document) => {
      const data = document.data();
      return data.estado !== "INACTIVO" &&
        (String(data.grupoId ?? "") === groupId || (!data.grupoId && String(data.cursoId ?? "") === courseId));
    });
    if (!enrolled) throw new ForbiddenException("No estás matriculado en esta sesión");
    const markReference = org.collection("attendanceMarks").doc(`${classId}_${userId}`);
    const now = new Date();
    await this.db().runTransaction(async (transaction) => {
      const current = await transaction.get(markReference);
      if (current.exists) throw new ConflictException("Tu asistencia ya fue registrada");
      const currentWindow = await transaction.get(windowSnapshot.ref);
      if (!currentWindow.exists || this.attendanceState(currentWindow.data()) !== "OPEN") {
        throw new BadRequestException("La ventana de marcación ya finalizó");
      }
      transaction.create(markReference, {
        classId,
        courseId,
        groupId,
        studentId: userId,
        status: "PRESENTE",
        source: "STUDENT",
        markedAt: now,
        validationStatus: "PENDING",
        createdAt: now,
        updatedAt: now,
      });
      transaction.create(org.collection("audit").doc(), {
        usuarioId: userId,
        accion: "MARCAR_ASISTENCIA",
        entidad: "AttendanceMark",
        entidadId: `${classId}_${userId}`,
        modulo: "asistencia",
        correlacion: crypto.randomUUID(),
        createdAt: now,
      });
    });
    return { classId, status: "PRESENTE", markedAt: now.toISOString(), validationStatus: "PENDING" };
  }

  private async accessibleCourseIds(orgId: string, userId: string, profile?: string) {
    const org = this.organization(orgId);
    if (profile === "Administrador" || profile === "Gestión al estudiante") return null;
    if (profile === "Docente") {
      const groups = await org.collection("groups").where("docenteId", "==", userId).get();
      return new Set(groups.docs.map((document) => String(document.data().cursoId)).filter(Boolean));
    }
    if (profile === "Estudiante") {
      const enrollments = await org.collection("enrollments").where("estudianteId", "==", userId).get();
      return new Set(enrollments.docs.filter((document) => document.data().estado !== "INACTIVO").map((document) => String(document.data().cursoId)).filter(Boolean));
    }
    return new Set<string>();
  }

  async listCourses(orgId: string, userId: string, profile?: string) {
    const [courses, allowed] = await Promise.all([
      this.organization(orgId).collection("courses").get(),
      this.accessibleCourseIds(orgId, userId, profile),
    ]);
    return courses.docs
      .filter((document) => document.data().deletedAt == null && (allowed === null || allowed.has(document.id)))
      .map((document) => {
        const data = document.data();
        return {
          id: document.id,
          codigo: String(data.codigo ?? document.id),
          nombre: String(data.nombre ?? document.id),
          estado: String(data.estado ?? "BORRADOR"),
          modalidad: String(data.modalidad ?? ""),
          progreso: Number(data.progreso ?? 0),
        };
      })
      .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  }

  private async assertCourseAccess(orgId: string, userId: string, profile: string | undefined, courseId: string, write = false) {
    const course = await this.organization(orgId).collection("courses").doc(courseId).get();
    if (!course.exists || course.data()?.deletedAt != null) throw new NotFoundException("Curso no encontrado");
    if (profile === "Administrador" || profile === "Gestión al estudiante") {
      if (write && profile === "Gestión al estudiante") throw new ForbiddenException("El perfil de gestión puede consultar la ruta, pero no editar el contenido LMS");
      return course;
    }
    const allowed = await this.accessibleCourseIds(orgId, userId, profile);
    if (!allowed?.has(courseId)) throw new ForbiddenException("El curso no está asignado al usuario");
    if (write && profile !== "Docente") throw new ForbiddenException("Solo el docente asignado o un administrador puede editar la ruta");
    return course;
  }

  async getLearningPath(orgId: string, userId: string, profile: string | undefined, courseId: string) {
    const course = await this.assertCourseAccess(orgId, userId, profile, courseId);
    const routeReference = this.organization(orgId).collection("learningPaths").doc(courseId);
    const [route, moduleSnapshot] = await Promise.all([routeReference.get(), routeReference.collection("modules").get()]);
    const modules = await Promise.all(moduleSnapshot.docs.map(async (moduleDocument) => {
      const [elementSnapshot, evaluationSnapshot] = await Promise.all([
        moduleDocument.ref.collection("elements").get(),
        moduleDocument.ref.collection("evaluations").get(),
      ]);
      const elements = elementSnapshot.docs.map((document) => {
        const data = document.data();
        return {
          id: document.id,
          tipo: String(data.tipo ?? "PASO"),
          titulo: String(data.titulo ?? ""),
          descripcion: String(data.descripcion ?? ""),
          contenidoTipo: String(data.contenidoTipo ?? "Texto").toLowerCase().replace(/^\p{L}/u, (letter) => letter.toUpperCase()),
          contenido: String(data.contenido ?? ""),
          nombreArchivo: String(data.nombreArchivo ?? ""),
          tiempo: Number(data.tiempo ?? data.tiempoMinutos ?? 0),
          requisito: String(data.requisito ?? "Libre"),
          estado: String(data.estado ?? "Borrador").toLowerCase().replace(/^\p{L}/u, (letter) => letter.toUpperCase()),
          orden: Number(data.orden ?? 0),
        };
      });
      const elementIds = new Set(elementSnapshot.docs.map((document) => document.id));
      const evaluations = evaluationSnapshot.docs.filter((document) => !elementIds.has(document.id)).map((document) => {
        const data = document.data();
        return {
          id: document.id,
          tipo: "EVALUACION",
          titulo: String(data.titulo ?? ""),
          descripcion: String(data.instrucciones ?? ""),
          contenidoTipo: "Cuestionario",
          contenido: String(data.instrucciones ?? ""),
          nombreArchivo: "",
          tiempo: Number(data.tiempoLimiteMinutos ?? 0),
          requisito: String(data.requisito ?? "Completar módulo"),
          estado: String(data.estado ?? "Borrador").toLowerCase().replace(/^\p{L}/u, (letter) => letter.toUpperCase()),
          orden: Number(data.orden ?? 999),
        };
      });
      const data = moduleDocument.data();
      return {
        id: moduleDocument.id,
        titulo: String(data.titulo ?? ""),
        descripcion: String(data.descripcion ?? ""),
        estado: String(data.estado ?? "Borrador").toLowerCase().replace(/^\p{L}/u, (letter) => letter.toUpperCase()),
        orden: Number(data.orden ?? 0),
        elementos: [...elements, ...evaluations].sort((a, b) => a.orden - b.orden).map(({ orden, ...element }) => { void orden; return element; }),
      };
    }));
    const routeData = route.data() ?? {};
    const courseData = course.data() ?? {};
    return {
      cursoId: courseId,
      titulo: String(routeData.titulo ?? courseData.nombre ?? courseId),
      descripcion: String(routeData.descripcion ?? "Ruta de aprendizaje del curso."),
      estado: String(routeData.estado ?? "BORRADOR"),
      version: Number(routeData.version ?? 0),
      modulos: modules.sort((a, b) => a.orden - b.orden).map(({ orden, ...module }) => { void orden; return module; }),
    };
  }

  async saveLearningPath(orgId: string, userId: string, profile: string | undefined, courseId: string, input: LearningPathInput) {
    await this.assertCourseAccess(orgId, userId, profile, courseId, true);
    const org = this.organization(orgId);
    const routeReference = org.collection("learningPaths").doc(courseId);
    const [currentRoute, existingModules] = await Promise.all([routeReference.get(), routeReference.collection("modules").get()]);
    const batch = this.db().batch();
    for (const moduleDocument of existingModules.docs) {
      const elements = await moduleDocument.ref.collection("elements").get();
      elements.docs.forEach((document) => batch.delete(document.ref));
      batch.delete(moduleDocument.ref);
    }
    const version = Number(currentRoute.data()?.version ?? 0) + 1;
    batch.set(routeReference, {
      cursoId: courseId,
      titulo: input.titulo,
      descripcion: input.descripcion,
      estado: input.estado,
      version,
      updatedBy: userId,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    input.modulos.forEach((module, moduleIndex) => {
      const moduleReference = routeReference.collection("modules").doc(module.id);
      batch.set(moduleReference, {
        titulo: module.titulo,
        descripcion: module.descripcion,
        estado: module.estado,
        orden: moduleIndex + 1,
        updatedAt: FieldValue.serverTimestamp(),
      });
      module.elementos.forEach((element, elementIndex) => {
        batch.set(moduleReference.collection("elements").doc(element.id), {
          ...element,
          orden: elementIndex + 1,
          updatedAt: FieldValue.serverTimestamp(),
        });
      });
    });
    const auditReference = org.collection("audit").doc();
    batch.create(auditReference, {
      usuarioId: userId,
      accion: "ACTUALIZAR",
      entidad: "RutaAprendizaje",
      entidadId: courseId,
      modulo: "lms",
      correlacion: crypto.randomUUID(),
      nuevo: { version, modulos: input.modulos.length },
      createdAt: FieldValue.serverTimestamp(),
    });
    await batch.commit();
    return this.getLearningPath(orgId, userId, profile, courseId);
  }

  async uploadCourseResource(orgId: string, userId: string, profile: string | undefined, courseId: string, file: { originalname: string; mimetype: string; buffer: Buffer }) {
    await this.assertCourseAccess(orgId, userId, profile, courseId, true);
    if (!process.env.FIREBASE_STORAGE_BUCKET) throw new BadRequestException("Falta FIREBASE_STORAGE_BUCKET en la API. Habilita Firebase Storage y configura el nombre del bucket.");
    const safeName = file.originalname.normalize("NFD").replace(/\p{Diacritic}/gu, "").replace(/[^a-zA-Z0-9._-]/g, "-");
    const objectName = `organizations/${orgId}/courses/${courseId}/resources/${crypto.randomUUID()}-${safeName}`;
    const bucket = getStorage(this.app ?? getApp()).bucket(process.env.FIREBASE_STORAGE_BUCKET);
    const object = bucket.file(objectName);
    const token = crypto.randomUUID();
    await object.save(file.buffer, {
      resumable: false,
      contentType: file.mimetype,
      metadata: {
        cacheControl: "private,max-age=3600",
        metadata: { firebaseStorageDownloadTokens: token, uploadedBy: userId, courseId },
      },
    });
    const url = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(objectName)}?alt=media&token=${token}`;
    const resourceReference = this.organization(orgId).collection("courseResources").doc();
    await resourceReference.set({
      cursoId: courseId,
      nombreArchivo: file.originalname,
      tipoMime: file.mimetype,
      tamanoBytes: file.buffer.length,
      storagePath: objectName,
      url,
      estado: "ACTIVO",
      uploadedBy: userId,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return {
      id: resourceReference.id,
      url,
      nombreArchivo: file.originalname,
      tipoMime: file.mimetype,
      tamanoBytes: file.buffer.length,
      storagePath: objectName,
    };
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
          ...(data.dni ? { dni: String(data.dni) } : {}),
          ...(data.celular ? { celular: String(data.celular) } : {}),
          ...(data.whatsapp ? { whatsapp: String(data.whatsapp) } : {}),
          ...(Array.isArray(data.modulos) ? { modulos: data.modulos.map(String) } : {}),
          cambioPasswordRequerido: Boolean(data.cambioPasswordRequerido),
        };
      }
    }
    return null;
  }

  async findUserById(orgId: string, userId: string): Promise<FirebaseUser | null> {
    const document = await this.organization(orgId).collection("users").doc(userId).get();
    if (!document.exists) return null;
    const data = document.data()!;
    return {
      id: document.id,
      organizacionId: orgId,
      nombre: String(data.nombre),
      usuario: String(data.usuario),
      correo: String(data.correo),
      passwordHash: String(data.passwordHash),
      estado: String(data.estado ?? "ACTIVO"),
      permisos: Array.isArray(data.permisos) ? data.permisos.map(String) : [],
      ...(data.perfil ? { perfil: String(data.perfil) } : {}),
      ...(data.dni ? { dni: String(data.dni) } : {}),
      cambioPasswordRequerido: Boolean(data.cambioPasswordRequerido),
    };
  }

  async listUsers(orgId: string) {
    const result = await this.organization(orgId).collection("users").where("deletedAt", "==", null).get();
    return result.docs.map((document) => {
      const data = document.data();
      return {
        id: document.id,
        nombre: String(data.nombre),
        dni: String(data.dni ?? ""),
        celular: String(data.celular ?? ""),
        whatsapp: String(data.whatsapp ?? ""),
        correo: String(data.correo),
        usuario: String(data.usuario),
        perfil: String(data.perfil ?? ""),
        modulos: Array.isArray(data.modulos) ? data.modulos.map(String) : [],
        estado: String(data.estado ?? "ACTIVO"),
        cambioPasswordRequerido: Boolean(data.cambioPasswordRequerido),
      };
    }).sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  }

  async createUser(orgId: string, input: CreateFirebaseUser) {
    const org = this.organization(orgId);
    const users = org.collection("users");
    const normalizedEmail = input.correo.trim().toLowerCase();
    const [emailMatch, dniMatch] = await Promise.all([
      users.where("correoNormalizado", "==", normalizedEmail).limit(1).get(),
      users.where("dni", "==", input.dni).limit(1).get(),
    ]);
    if (!emailMatch.empty) throw new ConflictException("Ya existe un usuario con este correo");
    if (!dniMatch.empty) throw new ConflictException("Ya existe un usuario con este DNI");

    const parts = input.nombre.trim().split(/\s+/);
    const firstName = parts[0] ?? "usuario";
    const firstLastName = parts.length > 1 ? parts[parts.length - 1]! : input.dni;
    const baseUsername = `${firstName}.${firstLastName}`
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .replace(/[^a-zA-Z0-9.]/g, "")
      .toLowerCase();
    let username = baseUsername;
    let suffix = 1;
    while (!(await users.where("usuarioNormalizado", "==", username).limit(1).get()).empty) {
      suffix += 1;
      username = `${baseUsername}${suffix}`;
    }

    const reference = users.doc();
    const now = FieldValue.serverTimestamp();
    const data = {
      ...input,
      usuario: username,
      usuarioNormalizado: username,
      correo: normalizedEmail,
      correoNormalizado: normalizedEmail,
      organizacionId: orgId,
      estado: "ACTIVO",
      cambioPasswordRequerido: true,
      intentosFallidos: 0,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };
    const batch = this.db().batch();
    batch.create(reference, data);
    if (input.perfil === "Docente") {
      batch.set(org.collection("teachers").doc(reference.id), {
        nombre: input.nombre,
        documento: input.dni,
        telefono: input.celular,
        whatsapp: input.whatsapp,
        correo: normalizedEmail,
        estado: "ACTIVO",
        createdAt: now,
        updatedAt: now,
      });
    }
    if (input.perfil === "Estudiante") {
      batch.set(org.collection("students").doc(input.dni), {
        nombres: firstName,
        apellidos: parts.slice(1).join(" "),
        documento: input.dni,
        telefono: input.celular,
        whatsapp: input.whatsapp,
        correo: normalizedEmail,
        estado: "ACTIVO",
        deletedAt: null,
        createdAt: now,
        updatedAt: now,
      }, { merge: true });
    }
    await batch.commit();
    return { id: reference.id, nombre: input.nombre, dni: input.dni, celular: input.celular, whatsapp: input.whatsapp, correo: normalizedEmail, usuario: username, perfil: input.perfil, modulos: input.modulos, estado: "ACTIVO", cambioPasswordRequerido: true };
  }

  async changePassword(orgId: string, userId: string, passwordHash: string) {
    const reference = this.organization(orgId).collection("users").doc(userId);
    const current = await reference.get();
    if (!current.exists) throw new Error("Usuario no encontrado");
    await reference.update({ passwordHash, cambioPasswordRequerido: false, updatedAt: FieldValue.serverTimestamp() });
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
        batch.set(userRef, { nombre: student.nombre, dni: student.dni, usuario: student.usuario, usuarioNormalizado: student.usuario.toLowerCase(), correo: student.correo, correoNormalizado: student.correo.toLowerCase(), passwordHash: await hashPassword(student.password), estado: "ACTIVO", perfil: "Estudiante", modulos: ["Estudiante"], permisos: ["cursos.leer", "asistencia.propia", "notas.propias", "solicitudes.crear", "certificados.leer"], cambioPasswordRequerido: true, deletedAt: null, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
        batch.set(enrollmentRef, { estudianteId: studentId, cursoId: student.cursoId, estado: "ACTIVO", fechaIngreso: FieldValue.serverTimestamp() }, { merge: true });
        (exists.exists ? updated : created).push(student.correo);
      }
      await batch.commit();
    }
    return { created, updated, total: students.length };
  }
}
