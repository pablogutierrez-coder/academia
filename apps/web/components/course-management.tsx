"use client";

import Link from "next/link";
import * as XLSX from "xlsx";
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  FileSpreadsheet,
  GraduationCap,
  LockKeyhole,
  Plus,
  Search,
  ShieldCheck,
  Upload,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { api } from "../lib/api";

type EstadoCurso = "ACTIVO" | "EN CURSO" | "BORRADOR";
type Curso = {
  id: string;
  programa: string;
  nombre: string;
  grupo: string;
  periodo: string;
  horario: string;
  docente: string;
  estudiantes: number;
  estudiantesAsignados: string[];
  modalidad: string;
  estado: EstadoCurso;
  progreso: number;
};

const cursosIniciales: Curso[] = [
  { id: "CUR-AD-2026-03", programa: "Analítica de Datos", nombre: "Analítica de datos aplicada", grupo: "GRP-03", periodo: "06 jul – 28 ago 2026", horario: "Lun. y mié. · 18:00", docente: "Oscar Vildoso García", estudiantes: 4, estudiantesAsignados: ["Mariana Torres López", "Luis Mendoza Ruiz", "Andrea Salas Vega", "Carlos Paredes Núñez"], modalidad: "Virtual", estado: "EN CURSO", progreso: 64 },
  { id: "CUR-MD-2026-02", programa: "Marketing Digital", nombre: "Estrategias de marketing digital", grupo: "GRP-05", periodo: "13 jul – 04 sep 2026", horario: "Mar. y jue. · 19:00", docente: "Claudia Rivas Soto", estudiantes: 3, estudiantesAsignados: ["Rosa Medina Castro", "Diego Flores Silva", "Valeria Campos León"], modalidad: "Virtual", estado: "ACTIVO", progreso: 42 },
  { id: "CUR-GE-2026-04", programa: "Gestión Empresarial", nombre: "Fundamentos de gestión empresarial", grupo: "GRP-07", periodo: "20 jul – 18 sep 2026", horario: "Sábados · 09:00", docente: "Víctor Lara Reynoso", estudiantes: 2, estudiantesAsignados: ["Mariana Torres López", "Rosa Medina Castro"], modalidad: "Híbrida", estado: "ACTIVO", progreso: 28 },
  { id: "CUR-LI-2026-01", programa: "Liderazgo", nombre: "Liderazgo para equipos de alto rendimiento", grupo: "GRP-01", periodo: "03 ago – 25 sep 2026", horario: "Lun. y vie. · 17:00", docente: "Mariana Costa Ruiz", estudiantes: 2, estudiantesAsignados: ["Luis Mendoza Ruiz", "Valeria Campos León"], modalidad: "Virtual", estado: "BORRADOR", progreso: 0 },
];

const prefijosPrograma: Record<string, string> = {
  "Analítica de Datos": "AD",
  "Marketing Digital": "MD",
  "Gestión Empresarial": "GE",
  Liderazgo: "LI",
};
const docentesDisponibles = ["Oscar Vildoso García", "Claudia Rivas Soto", "Víctor Lara Reynoso", "Mariana Costa Ruiz"];
const estudiantesDisponibles = ["Mariana Torres López", "Luis Mendoza Ruiz", "Andrea Salas Vega", "Carlos Paredes Núñez", "Rosa Medina Castro", "Diego Flores Silva", "Valeria Campos León"];

type BulkStudent = {
  dni: string;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  correo: string;
  celular: string;
  nombreCompleto: string;
  usuario: string;
  errors: string[];
};

function normalizarUsuario(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "").trim();
}

function siguienteCodigo(cursos: Curso[], programa: string) {
  const prefijo = prefijosPrograma[programa] ?? "GE";
  const expresion = new RegExp(`^CUR-${prefijo}-2026-(\\d+)$`);
  const ultimo = cursos.reduce((maximo, curso) => {
    const coincidencia = curso.id.match(expresion);
    return coincidencia ? Math.max(maximo, Number(coincidencia[1])) : maximo;
  }, 0);
  return `CUR-${prefijo}-2026-${String(ultimo + 1).padStart(2, "0")}`;
}

export function CourseManagement({ soloDocente = false }: { soloDocente?: boolean }) {
  const [cursos, setCursos] = useState(cursosIniciales);
  const [busqueda, setBusqueda] = useState("");
  const [estado, setEstado] = useState("TODOS");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [programaNuevo, setProgramaNuevo] = useState("Analítica de Datos");
  const [cursoEnEdicion, setCursoEnEdicion] = useState<Curso | null>(null);
  const [estudiantesCatalogo, setEstudiantesCatalogo] = useState(estudiantesDisponibles);
  const [bulkStudents, setBulkStudents] = useState<BulkStudent[]>([]);
  const [bulkFileName, setBulkFileName] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResult, setBulkResult] = useState<{ total: number; created: number; updated: number } | null>(null);
  const [bulkError, setBulkError] = useState("");
  const codigoPropuesto = siguienteCodigo(cursos, programaNuevo);

  const cursosFiltrados = useMemo(() => cursos.filter((curso) => {
    const coincideTexto = `${curso.id} ${curso.nombre} ${curso.programa} ${curso.grupo}`.toLowerCase().includes(busqueda.toLowerCase());
    return coincideTexto && (estado === "TODOS" || curso.estado === estado);
  }), [busqueda, cursos, estado]);

  function crearCurso(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const nuevo: Curso = {
      id: siguienteCodigo(cursos, String(form.get("programa"))),
      programa: String(form.get("programa")),
      nombre: String(form.get("nombre")),
      grupo: String(form.get("grupo")),
      periodo: "Por definir",
      horario: "Por definir",
      docente: "Pendiente de asignación",
      estudiantes: 0,
      estudiantesAsignados: [],
      modalidad: String(form.get("modalidad")),
      estado: "BORRADOR",
      progreso: 0,
    };
    setCursos((actuales) => [nuevo, ...actuales]);
    setModalAbierto(false);
    setMensaje(`Curso ${nuevo.id} creado como borrador.`);
  }

  function guardarAsignaciones(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!cursoEnEdicion) return;
    const form = new FormData(event.currentTarget);
    const asignados = form.getAll("estudiantes").map(String);
    const actualizado: Curso = {
      ...cursoEnEdicion,
      grupo: String(form.get("grupo")),
      periodo: String(form.get("periodo")),
      horario: String(form.get("horario")),
      modalidad: String(form.get("modalidad")),
      docente: String(form.get("docente")) || "Pendiente de asignación",
      estudiantes: asignados.length,
      estudiantesAsignados: asignados,
      estado: String(form.get("estado")) as EstadoCurso,
    };
    setCursos((actuales) => actuales.map((curso) => curso.id === actualizado.id ? actualizado : curso));
    setCursoEnEdicion(null);
    setMensaje(`Asignaciones y configuración de ${actualizado.id} actualizadas correctamente.`);
  }

  function abrirGestion(curso: Curso) {
    setCursoEnEdicion(curso);
    setBulkStudents([]);
    setBulkFileName("");
    setBulkResult(null);
    setBulkError("");
  }

  function descargarPlantilla() {
    const datos = [
      ["DNI", "Nombres", "Apellido paterno", "Apellido materno", "Correo", "Celular"],
      ["74859621", "Ana Lucía", "Ramírez", "Quispe", "ana.ramirez@correo.com", "987654321"],
    ];
    const hoja = XLSX.utils.aoa_to_sheet(datos);
    hoja["!cols"] = [{ wch: 14 }, { wch: 22 }, { wch: 20 }, { wch: 20 }, { wch: 34 }, { wch: 16 }];
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, "Matrícula");
    XLSX.writeFile(libro, "plantilla-matricula-estudiantes.xlsx");
  }

  async function leerPlantilla(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setBulkFileName(file.name);
    setBulkResult(null);
    setBulkError("");
    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const firstSheet = workbook.SheetNames[0];
      if (!firstSheet) throw new Error("El archivo no contiene una hoja de matrícula.");
      const worksheet = workbook.Sheets[firstSheet];
      if (!worksheet) throw new Error("No fue posible leer la hoja del archivo.");
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: "", raw: false });
      const seenDni = new Set<string>();
      const seenEmail = new Set<string>();
      const seenUsers = new Map<string, number>();
      const parsed = rows.filter((row) => Object.values(row).some((value) => String(value).trim())).map((row) => {
        const dni = String(row.DNI ?? "").trim();
        const nombres = String(row.Nombres ?? "").trim();
        const apellidoPaterno = String(row["Apellido paterno"] ?? "").trim();
        const apellidoMaterno = String(row["Apellido materno"] ?? "").trim();
        const correo = String(row.Correo ?? "").trim().toLowerCase();
        const celular = String(row.Celular ?? "").trim();
        const baseUser = `${normalizarUsuario(nombres.split(/\s+/)[0] ?? "")}.${normalizarUsuario(apellidoPaterno)}`;
        const repeated = seenUsers.get(baseUser) ?? 0;
        const usuario = repeated === 0 ? baseUser : `${baseUser}${repeated + 1}`;
        seenUsers.set(baseUser, repeated + 1);
        const errors: string[] = [];
        if (!/^\d{8}$/.test(dni)) errors.push("DNI debe tener 8 dígitos");
        if (!nombres || !apellidoPaterno || !apellidoMaterno) errors.push("Nombre y apellidos son obligatorios");
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) errors.push("Correo inválido");
        if (seenDni.has(dni)) errors.push("DNI duplicado en el archivo");
        if (seenEmail.has(correo)) errors.push("Correo duplicado en el archivo");
        if (celular && !/^\d{9}$/.test(celular)) errors.push("Celular debe tener 9 dígitos");
        seenDni.add(dni);
        seenEmail.add(correo);
        if (!baseUser || baseUser === ".") errors.push("No se pudo generar el usuario");
        return { dni, nombres, apellidoPaterno, apellidoMaterno, correo, celular, nombreCompleto: `${nombres} ${apellidoPaterno} ${apellidoMaterno}`.replace(/\s+/g, " ").trim(), usuario, errors };
      });
      if (!parsed.length) throw new Error("La plantilla no contiene estudiantes.");
      setBulkStudents(parsed);
    } catch (error) {
      setBulkStudents([]);
      setBulkError(error instanceof Error ? error.message : "No fue posible procesar el archivo.");
    } finally {
      event.target.value = "";
    }
  }

  async function confirmarCargaMasiva() {
    if (!cursoEnEdicion) return;
    const valid = bulkStudents.filter((student) => student.errors.length === 0);
    if (!valid.length || valid.length !== bulkStudents.length) {
      setBulkError("Corrige las filas observadas antes de crear usuarios y matricular estudiantes.");
      return;
    }
    setBulkLoading(true);
    setBulkError("");
    try {
      const result = await api<{ created: string[]; updated: string[]; total: number }>("/auth/bulk-students", {
        method: "POST",
        body: JSON.stringify({
          students: valid.map((student) => ({
            correo: student.correo,
            usuario: student.usuario,
            password: student.dni,
            nombre: student.nombreCompleto,
            dni: student.dni,
            cursoId: cursoEnEdicion.id,
          })),
        }),
      });
      const importedNames = valid.map((student) => student.nombreCompleto);
      setEstudiantesCatalogo((current) => Array.from(new Set([...current, ...importedNames])));
      setCursoEnEdicion((current) => current ? {
        ...current,
        estudiantesAsignados: Array.from(new Set([...current.estudiantesAsignados, ...importedNames])),
        estudiantes: new Set([...current.estudiantesAsignados, ...importedNames]).size,
      } : current);
      setCursos((current) => current.map((course) => course.id === cursoEnEdicion.id ? {
        ...course,
        estudiantesAsignados: Array.from(new Set([...course.estudiantesAsignados, ...importedNames])),
        estudiantes: new Set([...course.estudiantesAsignados, ...importedNames]).size,
      } : course));
      setBulkResult({ total: result.total, created: result.created.length, updated: result.updated.length });
      setMensaje(`${result.total} estudiante(s) asociados a ${cursoEnEdicion.id}; sus usuarios nombre.apellido ya pueden iniciar sesión con el DNI como contraseña inicial.`);
    } catch (error) {
      setBulkError(error instanceof Error ? error.message : "No fue posible completar la matrícula masiva.");
    } finally {
      setBulkLoading(false);
    }
  }

  return (
    <>
      <header className="page-header">
        <div>
          <span className="page-kicker">{soloDocente ? "Entorno LMS docente" : "Gestión académica"}</span>
          <h1>{soloDocente ? "Mis cursos" : "Cursos y grupos"}</h1>
          <p>{soloDocente ? "Administra contenido, sesiones, asistencia y evaluaciones de tus cursos asignados." : "Crea cursos, asigna grupos y docentes, y consulta el detalle operativo de cada ejecución."}</p>
        </div>
        {!soloDocente && <button className="btn btn-primary" onClick={() => setModalAbierto(true)}><Plus size={17} /> Crear curso</button>}
      </header>

      {mensaje && <div className="feedback feedback-success" role="status"><CheckCircle2 size={16} />{mensaje}</div>}

      <section className="course-filters" aria-label="Filtros de cursos">
        <label className="search-control course-search"><Search size={18} /><input value={busqueda} onChange={(event) => setBusqueda(event.target.value)} placeholder="Buscar curso, grupo o programa" /></label>
        <select aria-label="Filtrar por estado" value={estado} onChange={(event) => setEstado(event.target.value)}>
          <option value="TODOS">Todos los estados</option><option value="ACTIVO">Activos</option><option value="EN CURSO">En curso</option><option value="BORRADOR">Borradores</option>
        </select>
        <span>Mostrando <strong>{cursosFiltrados.length}</strong> cursos</span>
      </section>

      <section className="course-grid" aria-label="Cursos">
        {cursosFiltrados.map((curso) => (
          <article className="course-card" key={curso.id}>
            <div className="course-card-head">
              <span className="course-program">{curso.programa}</span>
              <span className={`status-badge ${curso.estado === "BORRADOR" ? "warning" : "success"}`}>{curso.estado}</span>
              <h2>{curso.nombre}</h2>
              <p>{curso.id} · {curso.grupo}</p>
            </div>
            <div className="course-card-body">
              <div><CalendarDays size={16} /><span><strong>Periodo</strong>{curso.periodo}</span></div>
              <div><Clock3 size={16} /><span><strong>Horario</strong>{curso.horario}</span></div>
              <div><UserRound size={16} /><span><strong>Docente</strong>{curso.docente}</span></div>
              <div><UsersRound size={16} /><span><strong>Estudiantes</strong>{curso.estudiantes} matriculados</span></div>
              <div><GraduationCap size={16} /><span><strong>Modalidad</strong>{curso.modalidad}</span></div>
            </div>
            <div className="course-progress"><span><small>Progreso</small><strong>{curso.progreso}%</strong></span><div><i style={{ width: `${curso.progreso}%` }} /></div></div>
            <div className="course-card-actions">
              {!soloDocente && <button className="btn btn-secondary manage-course-button" data-testid={`manage-course-${curso.id}`} onClick={() => abrirGestion(curso)}>Gestionar curso</button>}
              <Link className="btn btn-secondary" href={`/${soloDocente ? "docente-curso" : "curso"}/${curso.id}`}>Ver detalle</Link>
              <Link className="btn btn-primary" href={soloDocente ? "/docente-asistencia" : `/curso/${curso.id}?vista=asistencia`}>Ver asistencia</Link>
            </div>
          </article>
        ))}
      </section>

      {cursosFiltrados.length === 0 && <div className="panel empty-state"><BookOpen size={28} /><strong>No se encontraron cursos</strong><p>Prueba con otros términos o cambia el estado seleccionado.</p></div>}

      {modalAbierto && (
        <div className="modal-backdrop" role="presentation">
          <section className="modal" role="dialog" aria-modal="true" aria-labelledby="crear-curso-title">
            <header><div><span className="page-kicker">Nuevo registro</span><h2 id="crear-curso-title">Crear curso</h2><p>Registra la información base. La programación y asignaciones se completan dentro del detalle.</p></div><button className="icon-button" onClick={() => setModalAbierto(false)} aria-label="Cerrar"><X size={18} /></button></header>
            <form onSubmit={crearCurso}>
              <div className="generated-code"><span>Código automático</span><strong>{codigoPropuesto}</strong><small>Se asignará al guardar y no podrá editarse manualmente.</small></div>
              <label className="form-field"><span>Nombre del curso</span><input name="nombre" required placeholder="Ej. Analítica de datos aplicada" /></label>
              <label className="form-field"><span>Programa</span><select name="programa" required value={programaNuevo} onChange={(event) => setProgramaNuevo(event.target.value)}><option>Analítica de Datos</option><option>Marketing Digital</option><option>Gestión Empresarial</option><option>Liderazgo</option></select></label>
              <div className="form-row"><label className="form-field"><span>Grupo</span><input name="grupo" required placeholder="GRP-09" /></label><label className="form-field"><span>Modalidad</span><select name="modalidad"><option>Virtual</option><option>Híbrida</option><option>Presencial</option></select></label></div>
              <footer><button className="btn btn-secondary" type="button" onClick={() => setModalAbierto(false)}>Cancelar</button><button className="btn btn-primary" type="submit">Guardar borrador</button></footer>
            </form>
          </section>
        </div>
      )}

      {cursoEnEdicion && (
        <div className="modal-backdrop" role="presentation">
          <section className="modal course-management-modal" role="dialog" aria-modal="true" aria-labelledby="gestionar-curso-title">
            <header><div><span className="page-kicker">Gestión al estudiante</span><h2 id="gestionar-curso-title">Gestionar curso</h2><p>{cursoEnEdicion.id} · Solo administradores y perfiles con acceso a este módulo.</p></div><button className="icon-button" onClick={() => setCursoEnEdicion(null)} aria-label="Cerrar gestión"><X size={18}/></button></header>
            <form onSubmit={guardarAsignaciones}>
              <div className="form-row"><label className="form-field"><span>Grupo</span><input name="grupo" required defaultValue={cursoEnEdicion.grupo}/></label><label className="form-field"><span>Estado</span><select name="estado" defaultValue={cursoEnEdicion.estado}><option value="BORRADOR">Borrador</option><option value="ACTIVO">Activo</option><option value="EN CURSO">En curso</option></select></label></div>
              <div className="form-row"><label className="form-field"><span>Periodo</span><input name="periodo" required defaultValue={cursoEnEdicion.periodo} placeholder="Ej. 03 ago – 25 sep 2026"/></label><label className="form-field"><span>Horario</span><input name="horario" required defaultValue={cursoEnEdicion.horario} placeholder="Ej. Lun. y mié. · 18:00"/></label></div>
              <div className="form-row"><label className="form-field"><span>Docente asignado</span><select name="docente" defaultValue={cursoEnEdicion.docente === "Pendiente de asignación" ? "" : cursoEnEdicion.docente}><option value="">Pendiente de asignación</option>{docentesDisponibles.map((docente) => <option key={docente}>{docente}</option>)}</select></label><label className="form-field"><span>Modalidad</span><select name="modalidad" defaultValue={cursoEnEdicion.modalidad}><option>Virtual</option><option>Híbrida</option><option>Presencial</option></select></label></div>
              <fieldset className="student-assignment-fieldset"><legend>Estudiantes asignados</legend><p>Selecciona estudiantes existentes o utiliza la matrícula masiva para crear cuentas y asociarlas al curso.</p>
                <section className="bulk-enrollment">
                  <div className="bulk-enrollment-head"><span className="bulk-icon"><FileSpreadsheet size={22}/></span><div><h3>Matrícula masiva con Excel</h3><p>Descarga el formato, completa una fila por estudiante y vuelve a cargarlo aquí.</p></div><button type="button" className="btn btn-secondary" onClick={descargarPlantilla}><Download size={16}/>Descargar formato Excel</button></div>
                  <div className="bulk-enrollment-steps"><span><strong>1</strong>Descarga la plantilla</span><span><strong>2</strong>Completa y carga el Excel</span><span><strong>3</strong>Valida y confirma la matrícula</span></div>
                  <label className="bulk-file-drop"><Upload size={22}/><span><strong>{bulkFileName || "Seleccionar archivo de matrícula"}</strong><small>Formato .xlsx o .xls · una hoja · máximo 500 estudiantes</small></span><input type="file" accept=".xlsx,.xls" onChange={leerPlantilla}/></label>
                  <div className="bulk-credential-note"><ShieldCheck size={17}/><span>Al confirmar, cada estudiante se asociará a <strong>{cursoEnEdicion.id}</strong>. Su usuario será <strong>nombre.apellido</strong> y la contraseña inicial será su DNI.</span></div>
                  {bulkError && <div className="feedback feedback-error" role="alert">{bulkError}</div>}
                  {bulkStudents.length > 0 && <div className="bulk-preview"><div className="bulk-preview-title"><div><strong>Vista previa de la carga</strong><span>{bulkStudents.length} fila(s) · {bulkStudents.filter((item) => item.errors.length === 0).length} válida(s)</span></div><button type="button" className="btn btn-primary" disabled={bulkLoading || bulkStudents.some((item) => item.errors.length > 0)} onClick={confirmarCargaMasiva}>{bulkLoading ? "Procesando..." : "Crear usuarios y matricular"}</button></div><div className="table-scroll"><table className="data-table"><thead><tr><th>Fila</th><th>Usuario</th><th>DNI / contraseña inicial</th><th>Estudiante</th><th>Correo de contacto</th><th>Validación</th></tr></thead><tbody>{bulkStudents.map((student, index) => <tr key={`${student.dni}-${index}`}><td>{index + 2}</td><td><strong>{student.usuario || "Sin usuario"}</strong></td><td><strong>{student.dni || "Sin DNI"}</strong></td><td>{student.nombreCompleto || "Sin nombre"}</td><td>{student.correo || "Sin correo"}</td><td>{student.errors.length ? <span className="bulk-row-errors">{student.errors.join(" · ")}</span> : <span className="status-badge success">Lista para importar</span>}</td></tr>)}</tbody></table></div></div>}
                  {bulkResult && <div className="feedback feedback-success bulk-success"><CheckCircle2 size={17}/><span><strong>Matrícula completada:</strong> {bulkResult.total} estudiantes asociados, {bulkResult.created} usuarios nuevos y {bulkResult.updated} cuentas actualizadas.</span></div>}
                </section>
                <div>{estudiantesCatalogo.map((estudiante) => <label key={estudiante}><input type="checkbox" name="estudiantes" value={estudiante} defaultChecked={cursoEnEdicion.estudiantesAsignados.includes(estudiante)}/><span>{estudiante}</span></label>)}</div>
              </fieldset>
              <footer><button className="btn btn-secondary" type="button" onClick={() => setCursoEnEdicion(null)}>Cancelar</button><button className="btn btn-primary" type="submit">Guardar cambios</button></footer>
            </form>
          </section>
        </div>
      )}
    </>
  );
}

type Marca = "PRESENTE" | "TARDANZA" | "FALTA" | "JUSTIFICADA" | "PENDIENTE";
const participantesBase = [
  { id: "EST-00124", nombre: "Mariana Torres López", correo: "mariana.torres@elite.test", marcas: ["PRESENTE", "PRESENTE", "PRESENTE", "PENDIENTE", "PENDIENTE"] as Marca[], nota: "18" },
  { id: "EST-00156", nombre: "Luis Mendoza Ruiz", correo: "luis.mendoza@elite.test", marcas: ["PRESENTE", "TARDANZA", "FALTA", "PENDIENTE", "PENDIENTE"] as Marca[], nota: "15" },
  { id: "EST-00179", nombre: "Andrea Salas Vega", correo: "andrea.salas@elite.test", marcas: ["PRESENTE", "PRESENTE", "JUSTIFICADA", "PENDIENTE", "PENDIENTE"] as Marca[], nota: "17" },
  { id: "EST-00188", nombre: "Carlos Paredes Núñez", correo: "carlos.paredes@elite.test", marcas: ["FALTA", "FALTA", "PRESENTE", "PENDIENTE", "PENDIENTE"] as Marca[], nota: "13" },
];

export function CourseDetail({ cursoId, contexto = "gestion" }: { cursoId: string; contexto?: "gestion" | "docente" }) {
  const curso = cursosIniciales.find((item) => item.id === cursoId) ?? cursosIniciales[0]!;
  const [sesion, setSesion] = useState(3);
  const [participantes, setParticipantes] = useState(participantesBase);
  const [busqueda, setBusqueda] = useState("");
  const [confirmado, setConfirmado] = useState(false);
  const visibles = participantes.filter((item) => `${item.nombre} ${item.id}`.toLowerCase().includes(busqueda.toLowerCase()));
  const presentes = participantes.filter((item) => item.marcas[sesion - 1] === "PRESENTE").length;
  const tardanzas = participantes.filter((item) => item.marcas[sesion - 1] === "TARDANZA").length;
  const faltas = participantes.filter((item) => item.marcas[sesion - 1] === "FALTA").length;

  function cambiarMarca(id: string, marca: Marca) {
    setConfirmado(false);
    setParticipantes((actuales) => actuales.map((item) => item.id === id ? { ...item, marcas: item.marcas.map((valor, index) => index === sesion - 1 ? marca : valor) } : item));
  }

  return (
    <>
      <div className="detail-bar"><Link href={contexto === "docente" ? "/docente-cursos" : "/cursos"}><ArrowLeft size={17} /> Volver a {contexto === "docente" ? "mis cursos" : "cursos"}</Link><div><span>{curso.programa}</span><strong>{curso.id}</strong></div></div>
      <header className="page-header course-detail-title"><div><span className="page-kicker">Detalle del curso</span><h1>{curso.nombre}</h1><p>{curso.grupo} · {curso.docente} · {curso.periodo}</p></div></header>
      <section className="attendance-open"><span><LockKeyhole size={22} /></span><div><h2>Control de asistencia habilitado</h2><p>Puedes registrar o modificar la asistencia de la sesión seleccionada.</p><small>Último cierre: sesión 2 · auditado correctamente</small></div></section>
      {confirmado && <div className="feedback feedback-success" role="status"><CheckCircle2 size={16} />Las marcas de la sesión {sesion} quedaron confirmadas.</div>}
      <section className="attendance-metrics">
        <article><span className="metric-icon blue"><UsersRound size={19} /></span><div><small>Total</small><strong>{participantes.length}</strong></div></article>
        <article><span className="metric-icon green"><CheckCircle2 size={19} /></span><div><small>Asistió</small><strong>{presentes}</strong></div></article>
        <article><span className="metric-icon amber"><Clock3 size={19} /></span><div><small>Tardanza</small><strong>{tardanzas}</strong></div></article>
        <article><span className="metric-icon red"><X size={19} /></span><div><small>Faltó</small><strong>{faltas}</strong></div></article>
        <article className="attendance-progress"><div><small>Progreso del curso</small><strong>{curso.progreso}%</strong></div><span><i style={{ width: `${curso.progreso}%` }} /></span></article>
      </section>
      <section className="panel attendance-panel">
        <div className="attendance-toolbar">
          <div className="session-tabs"><strong>Sesión:</strong>{[1,2,3,4,5].map((item) => <button className={sesion === item ? "is-active" : ""} onClick={() => { setSesion(item); setConfirmado(false); }} key={item}><span>Sesión {item}</span><small>{String(5 + item).padStart(2, "0")}/07</small></button>)}</div>
          <label className="search-control"><Search size={17} /><input value={busqueda} onChange={(event) => setBusqueda(event.target.value)} placeholder="Buscar estudiante" /></label>
          <button className="btn btn-primary" onClick={() => setConfirmado(true)}>Confirmar marcas</button>
        </div>
        <div className="table-scroll">
          <table className="data-table attendance-table">
            <thead><tr><th>Estudiante</th><th>Documento</th><th>Marca de sesión {sesion}</th><th>Asistencia acumulada</th><th>Nota actual</th><th>Riesgo</th></tr></thead>
            <tbody>{visibles.map((item) => {
              const marca = item.marcas[sesion - 1]!;
              const porcentaje = Math.round(item.marcas.filter((value) => value === "PRESENTE" || value === "TARDANZA").length / 5 * 100);
              return <tr key={item.id}><td><strong>{item.nombre}</strong><small className="student-email">{item.correo}</small></td><td><span className="record-code">{item.id}</span></td><td><select className={`attendance-select ${marca.toLowerCase()}`} value={marca} onChange={(event) => cambiarMarca(item.id, event.target.value as Marca)}><option value="PRESENTE">Presente</option><option value="TARDANZA">Tardanza</option><option value="FALTA">Falta</option><option value="JUSTIFICADA">Falta justificada</option><option value="PENDIENTE">Pendiente</option></select></td><td><strong>{porcentaje}%</strong></td><td><span className="grade-box">{item.nota}</span></td><td><span className={`status-badge ${porcentaje < 60 ? "danger" : porcentaje < 80 ? "warning" : "success"}`}>{porcentaje < 60 ? "Alto" : porcentaje < 80 ? "Medio" : "Bajo"}</span></td></tr>;
            })}</tbody>
          </table>
        </div>
      </section>
    </>
  );
}
