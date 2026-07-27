"use client";

import { CheckCircle2, Pencil, Plus, Search, X } from "lucide-react";
import { useMemo, useState } from "react";

type CatalogKind = "programas" | "grupos" | "estudiantes";
type AcademicRecord = {
  id: string;
  name: string;
  detail: string;
  assignment: string;
  metric: string;
  document?: string;
  email?: string;
  courses?: string[];
  status: "ACTIVO" | "BORRADOR" | "EN RIESGO";
};

const initialData: Record<CatalogKind, AcademicRecord[]> = {
  programas: [
    { id: "PRG-AD-2026", name: "Analítica de Datos", detail: "Versión 3 · 4 módulos", assignment: "Responsable: Elena Campos", metric: "3 cursos activos", status: "ACTIVO" },
    { id: "PRG-MD-2026", name: "Marketing Digital", detail: "Versión 2 · 5 módulos", assignment: "Responsable: Javier Ponce", metric: "2 cursos activos", status: "ACTIVO" },
    { id: "PRG-GE-2026", name: "Gestión Empresarial", detail: "Versión 4 · 6 módulos", assignment: "Responsable: María Costa", metric: "1 curso activo", status: "ACTIVO" },
    { id: "PRG-LI-2026", name: "Liderazgo", detail: "Versión 1 · 4 módulos", assignment: "Responsable: Víctor Lara", metric: "Próxima publicación", status: "BORRADOR" },
  ],
  grupos: [
    { id: "GRP-03", name: "Analítica de datos aplicada", detail: "Lun. y mié. · 18:00 · Virtual", assignment: "Oscar Vildoso García", metric: "24/30 estudiantes", status: "ACTIVO" },
    { id: "GRP-05", name: "Estrategias de marketing digital", detail: "Mar. y jue. · 19:00 · Virtual", assignment: "Claudia Rivas Soto", metric: "28/30 estudiantes", status: "ACTIVO" },
    { id: "GRP-07", name: "Fundamentos de gestión empresarial", detail: "Sábados · 09:00 · Híbrida", assignment: "Víctor Lara Reynoso", metric: "21/25 estudiantes", status: "ACTIVO" },
    { id: "GRP-09", name: "Liderazgo para equipos", detail: "Horario por definir · Virtual", assignment: "Docente pendiente", metric: "0/25 estudiantes", status: "BORRADOR" },
  ],
  estudiantes: [
    { id: "EST-00124", name: "Mariana Torres López", document: "70399200", email: "mariana.torres@elite.test", courses: ["Analítica de datos aplicada", "Fundamentos de gestión empresarial"], detail: "DNI 70399200 · mariana.torres@elite.test", assignment: "Analítica de datos aplicada · Fundamentos de gestión empresarial", metric: "Matrícula vigente", status: "ACTIVO" },
    { id: "EST-00156", name: "Luis Mendoza Ruiz", document: "71402854", email: "luis.mendoza@elite.test", courses: ["Analítica de datos aplicada", "Liderazgo para equipos de alto rendimiento"], detail: "DNI 71402854 · luis.mendoza@elite.test", assignment: "Analítica de datos aplicada · Liderazgo para equipos", metric: "Requiere seguimiento", status: "EN RIESGO" },
    { id: "EST-00179", name: "Andrea Salas Vega", document: "72851643", email: "andrea.salas@elite.test", courses: ["Analítica de datos aplicada"], detail: "DNI 72851643 · andrea.salas@elite.test", assignment: "Analítica de datos aplicada", metric: "Matrícula vigente", status: "ACTIVO" },
    { id: "EST-00188", name: "Carlos Paredes Núñez", document: "74120369", email: "carlos.paredes@elite.test", courses: ["Estrategias de marketing digital"], detail: "DNI 74120369 · carlos.paredes@elite.test", assignment: "Estrategias de marketing digital", metric: "Requiere seguimiento", status: "EN RIESGO" },
  ],
};

const config = {
  programas: {
    title: "Programas",
    description: "Administra la oferta académica, sus versiones, estructura y responsables.",
    action: "Nuevo programa",
    metrics: [["Programas activos", "3", "Oferta vigente"], ["En borrador", "1", "Pendiente de publicación"], ["Cursos asociados", "6", "Periodo actual"]],
    columns: ["Programa", "Versión y estructura", "Responsable", "Cursos"],
  },
  grupos: {
    title: "Grupos",
    description: "Gestiona capacidad, calendario, docente y matrícula de cada grupo.",
    action: "Nuevo grupo",
    metrics: [["Grupos activos", "3", "Periodo actual"], ["Estudiantes", "73", "Matriculados"], ["Capacidad utilizada", "86%", "Promedio"]],
    columns: ["Grupo y curso", "Horario y modalidad", "Docente", "Capacidad"],
  },
  estudiantes: {
    title: "Estudiantes",
    description: "Registra estudiantes, actualiza su ficha y asigna los cursos de su matrícula.",
    action: "Registrar estudiante",
    metrics: [["Estudiantes activos", "4", "Registros visibles"], ["En riesgo", "2", "Requieren seguimiento"], ["Matrículas activas", "6", "Asignaciones de curso"]],
    columns: ["Estudiante", "Identificación y contacto", "Cursos asignados", "Situación académica"],
  },
} satisfies Record<CatalogKind, { title: string; description: string; action: string; metrics: string[][]; columns: string[] }>;

const programStructures = ["Versión 1 · 4 módulos", "Versión 2 · 5 módulos", "Versión 3 · 4 módulos", "Versión 4 · 6 módulos"];
const programManagers = ["Responsable: Elena Campos", "Responsable: Javier Ponce", "Responsable: María Costa", "Responsable: Víctor Lara"];
const associatedCourses = ["Próxima publicación", "0 cursos activos", "1 curso activo", "2 cursos activos", "3 cursos activos", "4 cursos activos"];
const groupCourses = ["Analítica de datos aplicada", "Estrategias de marketing digital", "Fundamentos de gestión empresarial", "Liderazgo para equipos de alto rendimiento"];
const groupSchedules = ["Lun. y mié. · 18:00 · Virtual", "Mar. y jue. · 19:00 · Virtual", "Sábados · 09:00 · Híbrida", "Lun. y vie. · 17:00 · Presencial", "Horario por definir · Virtual"];
const groupTeachers = ["Docente pendiente", "Oscar Vildoso García", "Claudia Rivas Soto", "Víctor Lara Reynoso", "Mariana Costa Ruiz"];
const groupCapacity = ["0/20 estudiantes", "0/25 estudiantes", "0/30 estudiantes", "20/25 estudiantes", "21/25 estudiantes", "24/30 estudiantes", "28/30 estudiantes"];

function nextCode(kind: CatalogKind, records: AcademicRecord[]) {
  if (kind === "programas") return `PRG-NV-2026-${String(records.length + 1).padStart(2, "0")}`;
  if (kind === "grupos") return `GRP-${String(Math.max(...records.map((item) => Number(item.id.replace(/\D/g, ""))), 0) + 1).padStart(2, "0")}`;
  return `EST-${String(Math.max(...records.map((item) => Number(item.id.replace(/\D/g, ""))), 0) + 1).padStart(5, "0")}`;
}

export function AcademicCatalogManagement({ kind }: { kind: CatalogKind }) {
  const view = config[kind];
  const [records, setRecords] = useState(initialData[kind]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("TODOS");
  const [editor, setEditor] = useState<AcademicRecord | "NEW" | null>(null);
  const [message, setMessage] = useState("");
  const visible = useMemo(() => records.filter((item) => {
    const matchesSearch = `${item.id} ${item.name} ${item.detail} ${item.assignment}`.toLowerCase().includes(search.toLowerCase());
    return matchesSearch && (status === "TODOS" || item.status === status);
  }), [records, search, status]);

  function saveRecord(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const id = editor === "NEW" ? nextCode(kind, records) : editor!.id;
    const selectedCourses = form.getAll("courses").map(String);
    const document = String(form.get("document"));
    const email = String(form.get("email"));
    const record: AcademicRecord = kind === "estudiantes" ? {
      id,
      name: String(form.get("name")),
      document,
      email,
      courses: selectedCourses,
      detail: `DNI ${document} · ${email}`,
      assignment: selectedCourses.length ? selectedCourses.join(" · ") : "Sin cursos asignados",
      metric: String(form.get("status")) === "EN RIESGO" ? "Requiere seguimiento" : "Matrícula vigente",
      status: String(form.get("status")) as AcademicRecord["status"],
    } : {
      id,
      name: String(form.get("name")),
      detail: String(form.get("detail")),
      assignment: String(form.get("assignment")),
      metric: String(form.get("metric")),
      status: String(form.get("status")) as AcademicRecord["status"],
    };
    setRecords((current) => editor === "NEW" ? [record, ...current] : current.map((item) => item.id === id ? record : item));
    setEditor(null);
    setMessage(`${id} guardado correctamente.`);
  }

  const editing = editor === "NEW" ? null : editor;
  return <>
    <header className="page-header"><div><span className="page-kicker">Gestión operativa</span><h1>{view.title}</h1><p>{view.description}</p></div><button className="btn btn-primary" onClick={() => setEditor("NEW")}><Plus size={17}/>{view.action}</button></header>
    <div className="feedback feedback-info">Entorno de demostración activo. Los registros se mantienen durante esta sesión.</div>
    {message && <div className="feedback feedback-success" role="status"><CheckCircle2 size={16}/>{message}</div>}
    <section className="metric-grid compact">{view.metrics.map(([label, value, note]) => <article className="metric-card" key={label}><div className="metric-head"><span>{label}</span></div><strong>{value}</strong><small>{note}</small></article>)}</section>
    <section className="panel table-panel academic-catalog-table">
      <div className="table-toolbar"><label className="search-control"><Search size={17}/><input aria-label={`Buscar en ${view.title}`} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nombre o código"/></label><div className="table-actions"><select aria-label={`Filtrar ${view.title} por estado`} value={status} onChange={(event) => setStatus(event.target.value)}><option value="TODOS">Todos los estados</option><option value="ACTIVO">Activos</option><option value="BORRADOR">Borradores</option>{kind === "estudiantes" && <option value="EN RIESGO">En riesgo</option>}</select><span>{visible.length} registros</span></div></div>
      <div className="table-scroll"><table className="data-table"><thead><tr>{view.columns.map((column) => <th key={column}>{column}</th>)}<th>Estado</th><th className="align-right">Acción</th></tr></thead><tbody>{visible.map((item) => <tr key={item.id}><td><strong>{item.name}</strong><small className="table-subtitle">{item.id}</small></td><td>{item.detail}</td><td>{item.assignment}</td><td><strong>{item.metric}</strong></td><td><span className={`status-badge ${item.status === "ACTIVO" ? "success" : item.status === "EN RIESGO" ? "danger" : "warning"}`}>{item.status}</span></td><td className="align-right"><button data-testid={`edit-${kind}-${item.id}`} className="row-action" onClick={() => setEditor(item)}><Pencil size={14}/>Editar</button></td></tr>)}</tbody></table>{visible.length === 0 && <div className="empty-state"><strong>No hay registros con estos filtros</strong><p>Prueba otra búsqueda o selecciona un estado diferente.</p></div>}</div>
    </section>
    {editor && <div className="modal-backdrop"><section className="modal" role="dialog" aria-modal="true" aria-labelledby="catalog-editor-title"><header><div><span className="page-kicker">{editor === "NEW" ? "Nuevo registro" : editing!.id}</span><h2 id="catalog-editor-title">{editor === "NEW" ? view.action : `Editar ${view.title.toLowerCase().slice(0, -1)}`}</h2><p>{kind === "estudiantes" ? "Actualiza la ficha y guarda los cambios." : "Solo el nombre admite escritura manual. Los demás datos se seleccionan o asignan."}</p></div><button className="icon-button" onClick={() => setEditor(null)} aria-label="Cerrar editor"><X size={18}/></button></header><form onSubmit={saveRecord}>
      {kind === "programas" ? <>
        <label className="form-field"><span>Nombre del programa</span><input name="name" required defaultValue={editing?.name}/></label>
        <label className="form-field"><span>Versión y estructura</span><select name="detail" required defaultValue={editing?.detail ?? programStructures[0]}>{programStructures.map((option) => <option key={option}>{option}</option>)}</select></label>
        <label className="form-field"><span>Responsable asignado</span><select name="assignment" required defaultValue={editing?.assignment ?? programManagers[0]}>{programManagers.map((option) => <option key={option}>{option}</option>)}</select></label>
        <div className="form-row"><label className="form-field"><span>Cursos asociados</span><select name="metric" required defaultValue={editing?.metric ?? associatedCourses[0]}>{associatedCourses.map((option) => <option key={option}>{option}</option>)}</select></label><label className="form-field"><span>Estado</span><select name="status" defaultValue={editing?.status ?? "BORRADOR"}><option value="ACTIVO">Activo</option><option value="BORRADOR">Borrador</option></select></label></div>
      </> : kind === "grupos" ? <>
        <label className="form-field"><span>Curso asignado</span><select name="name" required defaultValue={editing?.name ?? groupCourses[0]}>{groupCourses.map((option) => <option key={option}>{option}</option>)}</select></label>
        <label className="form-field"><span>Horario y modalidad</span><select name="detail" required defaultValue={editing?.detail ?? groupSchedules[0]}>{groupSchedules.map((option) => <option key={option}>{option}</option>)}</select></label>
        <label className="form-field"><span>Docente asignado</span><select name="assignment" required defaultValue={editing?.assignment ?? groupTeachers[0]}>{groupTeachers.map((option) => <option key={option}>{option}</option>)}</select></label>
        <div className="form-row"><label className="form-field"><span>Capacidad y matrícula</span><select name="metric" required defaultValue={editing?.metric ?? groupCapacity[0]}>{groupCapacity.map((option) => <option key={option}>{option}</option>)}</select></label><label className="form-field"><span>Estado</span><select name="status" defaultValue={editing?.status ?? "BORRADOR"}><option value="ACTIVO">Activo</option><option value="BORRADOR">Borrador</option></select></label></div>
      </> : <>
        <label className="form-field"><span>Nombre completo</span><input name="name" required defaultValue={editing?.name}/></label>
        <div className="form-row"><label className="form-field"><span>Documento de identidad</span><input name="document" required inputMode="numeric" defaultValue={editing?.document} placeholder="00000000"/></label><label className="form-field"><span>Correo electrónico</span><input name="email" type="email" required defaultValue={editing?.email} placeholder="correo@dominio.com"/></label></div>
        <fieldset className="student-assignment-fieldset"><legend>Cursos asignados</legend><p>Selecciona uno o más cursos para crear la matrícula del estudiante.</p><div>{groupCourses.map((course) => <label key={course}><input type="checkbox" name="courses" value={course} defaultChecked={editing?.courses?.includes(course)}/><span>{course}</span></label>)}</div></fieldset>
        <label className="form-field"><span>Estado del estudiante</span><select name="status" defaultValue={editing?.status ?? "ACTIVO"}><option value="ACTIVO">Activo</option><option value="BORRADOR">Borrador</option><option value="EN RIESGO">En riesgo</option></select></label>
      </>}
      <footer><button type="button" className="btn btn-secondary" onClick={() => setEditor(null)}>Cancelar</button><button type="submit" className="btn btn-primary">Guardar cambios</button></footer>
    </form></section></div>}
  </>;
}
