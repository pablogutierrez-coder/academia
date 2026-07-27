"use client";

import { CalendarClock, CheckCircle2, Filter, Paperclip, PhoneCall, Search, Upload, UserRound, X } from "lucide-react";
import { useMemo, useState } from "react";

type CrmMode = "control" | "seguimiento" | "retencion";
type CaseStatus = "PENDIENTE" | "CONTACTADO" | "COMPROMISO" | "RECUPERADO";
type AbsenceCase = {
  id: string;
  student: string;
  document: string;
  phone: string;
  course: string;
  absences: number;
  consecutive: number;
  lastAbsence: string;
  status: CaseStatus;
  responsible: string;
  channel: string;
  nextAction: string;
  nextDate: string;
  notes: string;
  attachment?: string;
};

const initialCases: AbsenceCase[] = [
  { id: "CAS-001", student: "Carlos Paredes Núñez", document: "EST-00188", phone: "987 541 203", course: "Analítica de datos aplicada", absences: 5, consecutive: 3, lastAbsence: "2026-07-25", status: "PENDIENTE", responsible: "Elena Campos", channel: "Llamada", nextAction: "Primer contacto prioritario", nextDate: "2026-07-26", notes: "Sin contacto previo." },
  { id: "CAS-002", student: "Luis Mendoza Ruiz", document: "EST-00156", phone: "965 203 118", course: "Estrategias de marketing digital", absences: 4, consecutive: 2, lastAbsence: "2026-07-24", status: "CONTACTADO", responsible: "Javier Ponce", channel: "Correo", nextAction: "Confirmar retorno a clases", nextDate: "2026-07-27", notes: "Indica dificultades de horario." },
  { id: "CAS-003", student: "Rosa Medina Castro", document: "EST-00201", phone: "944 810 627", course: "Fundamentos de gestión empresarial", absences: 4, consecutive: 1, lastAbsence: "2026-07-22", status: "COMPROMISO", responsible: "María Costa", channel: "Llamada", nextAction: "Verificar compromiso de asistencia", nextDate: "2026-07-28", notes: "Se comprometió a retornar esta semana.", attachment: "compromiso-retorno.pdf" },
  { id: "CAS-004", student: "Andrea Salas Vega", document: "EST-00179", phone: "978 632 405", course: "Analítica de datos aplicada", absences: 3, consecutive: 2, lastAbsence: "2026-07-25", status: "PENDIENTE", responsible: "Elena Campos", channel: "WhatsApp manual", nextAction: "Validar motivo de inasistencia", nextDate: "2026-07-26", notes: "WhatsApp permanece sin API." },
  { id: "CAS-005", student: "Diego Flores Silva", document: "EST-00215", phone: "951 347 820", course: "Estrategias de marketing digital", absences: 2, consecutive: 2, lastAbsence: "2026-07-23", status: "CONTACTADO", responsible: "Javier Ponce", channel: "Llamada", nextAction: "Solicitar sustento", nextDate: "2026-07-29", notes: "Pendiente de documento justificatorio." },
  { id: "CAS-006", student: "Valeria Campos León", document: "EST-00230", phone: "932 104 769", course: "Liderazgo para equipos de alto rendimiento", absences: 2, consecutive: 1, lastAbsence: "2026-07-20", status: "RECUPERADO", responsible: "Víctor Lara", channel: "Correo", nextAction: "Monitorear siguiente sesión", nextDate: "2026-07-31", notes: "Retornó a clases." },
  { id: "CAS-007", student: "Mariana Torres López", document: "EST-00124", phone: "912 580 443", course: "Fundamentos de gestión empresarial", absences: 1, consecutive: 1, lastAbsence: "2026-07-25", status: "PENDIENTE", responsible: "María Costa", channel: "Llamada", nextAction: "Contacto preventivo", nextDate: "2026-07-27", notes: "Primera falta del periodo." },
];

const modeConfig = {
  control: { kicker: "CRM de asistencia", title: "Control de asistencia", description: "Gestiona las ausencias detectadas y deriva cada caso según su prioridad operativa." },
  seguimiento: { kicker: "CRM de seguimiento", title: "Seguimiento de faltas", description: "Organiza contactos, responsables y próximas acciones para estudiantes ausentes." },
  retencion: { kicker: "CRM de retención", title: "Retención académica", description: "Gestiona compromisos y recuperación de estudiantes con riesgo de abandono." },
} satisfies Record<CrmMode, { kicker: string; title: string; description: string }>;

const statusLabels: Record<CaseStatus, string> = { PENDIENTE: "Pendiente", CONTACTADO: "Contactado", COMPROMISO: "Con compromiso", RECUPERADO: "Recuperado" };
const statusClasses: Record<CaseStatus, string> = { PENDIENTE: "danger", CONTACTADO: "info", COMPROMISO: "warning", RECUPERADO: "success" };

function priority(caseItem: AbsenceCase) {
  const reference = Date.UTC(2026, 6, 26);
  const absenceDate = Date.parse(`${caseItem.lastAbsence}T00:00:00Z`);
  const days = Math.max(0, Math.floor((reference - absenceDate) / 86400000));
  const recency = Math.max(0, 30 - days);
  const score = caseItem.absences * 15 + caseItem.consecutive * 8 + recency;
  const level = score >= 100 ? "CRÍTICA" : score >= 75 ? "ALTA" : score >= 50 ? "MEDIA" : "BAJA";
  return { score, level, days };
}

export function AbsenceCRM({ mode }: { mode: CrmMode }) {
  const config = modeConfig[mode];
  const [cases, setCases] = useState(initialCases);
  const [search, setSearch] = useState("");
  const [course, setCourse] = useState("TODOS");
  const [stage, setStage] = useState<"TODOS" | CaseStatus>("TODOS");
  const [selected, setSelected] = useState<AbsenceCase | null>(null);
  const [message, setMessage] = useState("");
  const sortedCases = useMemo(() => cases
    .filter((item) => `${item.student} ${item.document} ${item.course}`.toLowerCase().includes(search.toLowerCase()))
    .filter((item) => course === "TODOS" || item.course === course)
    .filter((item) => stage === "TODOS" || item.status === stage)
    .sort((a, b) => priority(b).score - priority(a).score || b.lastAbsence.localeCompare(a.lastAbsence)), [cases, course, search, stage]);
  const critical = cases.filter((item) => priority(item).level === "CRÍTICA" || priority(item).level === "ALTA").length;
  const pending = cases.filter((item) => item.status === "PENDIENTE").length;
  const commitments = cases.filter((item) => item.status === "COMPROMISO").length;
  const recovered = cases.filter((item) => item.status === "RECUPERADO").length;

  function saveCase(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    const form = new FormData(event.currentTarget);
    const evidence = form.get("evidence");
    const attachment = evidence instanceof File && evidence.name ? evidence.name : selected.attachment;
    const updated: AbsenceCase = {
      ...selected,
      status: String(form.get("status")) as CaseStatus,
      responsible: String(form.get("responsible")),
      channel: String(form.get("channel")),
      nextAction: String(form.get("nextAction")),
      nextDate: String(form.get("nextDate")),
      notes: String(form.get("notes")),
      ...(attachment ? { attachment } : {}),
    };
    setCases((current) => current.map((item) => item.id === updated.id ? updated : item));
    setSelected(null);
    setMessage(`Caso ${updated.id} actualizado${attachment ? ` con evidencia “${attachment}”` : ""}. La cola fue recalculada por prioridad.`);
  }

  return <>
    <header className="page-header"><div><span className="page-kicker">{config.kicker}</span><h1>{config.title}</h1><p>{config.description}</p></div></header>
    <div className="feedback feedback-info crm-priority-rule"><Filter size={16}/><span><strong>Orden automático:</strong> cantidad total de faltas, faltas consecutivas y fecha de la última falta. Las ausencias más recientes reciben mayor prioridad.</span></div>
    {message && <div className="feedback feedback-success" role="status"><CheckCircle2 size={16}/>{message}</div>}
    <section className="metric-grid compact crm-metrics">
      <article className="metric-card"><div className="metric-head"><span>Casos priorizados</span></div><strong>{cases.length}</strong><small>Cola operativa actual</small></article>
      <article className="metric-card"><div className="metric-head"><span>Prioridad crítica o alta</span></div><strong>{critical}</strong><small>Atención inmediata</small></article>
      <article className="metric-card"><div className="metric-head"><span>Pendientes de contacto</span></div><strong>{pending}</strong><small>Sin gestión registrada</small></article>
      <article className="metric-card"><div className="metric-head"><span>{mode === "retencion" ? "Recuperados" : "Con compromiso"}</span></div><strong>{mode === "retencion" ? recovered : commitments}</strong><small>{mode === "retencion" ? "Retornaron a clases" : "Próxima acción programada"}</small></article>
    </section>
    <section className="panel crm-workspace">
      <div className="crm-pipeline" aria-label="Etapas del CRM"><button className={stage === "TODOS" ? "is-active" : ""} onClick={() => setStage("TODOS")}><span>Todos</span><strong>{cases.length}</strong></button>{(Object.keys(statusLabels) as CaseStatus[]).map((status) => <button className={stage === status ? "is-active" : ""} onClick={() => setStage(status)} key={status}><span>{statusLabels[status]}</span><strong>{cases.filter((item) => item.status === status).length}</strong></button>)}</div>
      <div className="crm-toolbar"><label className="search-control"><Search size={17}/><input aria-label="Buscar estudiante o curso" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar estudiante, documento o curso"/></label><select aria-label="Filtrar casos por curso" value={course} onChange={(event) => setCourse(event.target.value)}><option value="TODOS">Todos los cursos</option>{Array.from(new Set(cases.map((item) => item.course))).map((item) => <option key={item}>{item}</option>)}</select><span>{sortedCases.length} casos ordenados</span></div>
      <div className="table-scroll"><table className="data-table crm-table"><thead><tr><th>Prioridad</th><th>Estudiante y curso</th><th>Faltas</th><th>Última falta</th><th>Etapa y responsable</th><th>Próxima acción</th><th className="align-right">Gestión</th></tr></thead><tbody>{sortedCases.map((item) => { const itemPriority = priority(item); return <tr key={item.id}><td><span className={`priority-rank ${itemPriority.level.toLowerCase()}`}>{itemPriority.level}</span><small className="priority-score">{itemPriority.score} puntos</small></td><td><strong>{item.student}</strong><small className="table-subtitle">{item.document} · {item.course}</small></td><td><strong>{item.absences} totales</strong><small className="table-subtitle">{item.consecutive} consecutivas</small></td><td><strong>{new Intl.DateTimeFormat("es-PE", { day: "2-digit", month: "short" }).format(new Date(`${item.lastAbsence}T12:00:00`))}</strong><small className="table-subtitle">Hace {itemPriority.days} día(s)</small></td><td><span className={`status-badge ${statusClasses[item.status]}`}>{statusLabels[item.status]}</span><small className="table-subtitle">{item.responsible}</small></td><td><strong>{item.nextAction}</strong><small className="table-subtitle">{item.nextDate} · {item.channel}</small></td><td className="align-right"><button data-testid={`manage-absence-${item.id}`} className="row-action" onClick={() => setSelected(item)}>Gestionar caso</button></td></tr>; })}</tbody></table></div>
    </section>
    {selected && <div className="modal-backdrop"><section className="modal crm-case-modal" role="dialog" aria-modal="true" aria-labelledby="crm-case-title"><header><div><span className="page-kicker">{selected.id} · Prioridad {priority(selected).level}</span><h2 id="crm-case-title">{selected.student}</h2><p>{selected.course} · {selected.absences} faltas · última falta {selected.lastAbsence}</p></div><button className="icon-button" onClick={() => setSelected(null)} aria-label="Cerrar caso"><X size={18}/></button></header><form onSubmit={saveCase}>
      <div className="crm-contact-card"><UserRound size={18}/><div><strong>{selected.document}</strong><span>{selected.phone}</span></div><PhoneCall size={18}/><span>WhatsApp manual sin API</span></div>
      <div className="form-row"><label className="form-field"><span>Etapa del caso</span><select name="status" defaultValue={selected.status}>{(Object.keys(statusLabels) as CaseStatus[]).map((status) => <option value={status} key={status}>{statusLabels[status]}</option>)}</select></label><label className="form-field"><span>Responsable</span><select name="responsible" defaultValue={selected.responsible}><option>Elena Campos</option><option>Javier Ponce</option><option>María Costa</option><option>Víctor Lara</option></select></label></div>
      <div className="form-row"><label className="form-field"><span>Canal de contacto</span><select name="channel" defaultValue={selected.channel}><option>Llamada</option><option>Correo</option><option>WhatsApp manual</option><option>Reunión</option></select></label><label className="form-field"><span>Fecha de próxima acción</span><input name="nextDate" type="date" required defaultValue={selected.nextDate}/></label></div>
      <label className="form-field"><span>Próxima acción</span><input name="nextAction" required defaultValue={selected.nextAction}/></label>
      <label className="form-field"><span>Notas de gestión</span><textarea name="notes" rows={4} defaultValue={selected.notes} placeholder="Registra el resultado del contacto, acuerdos y evidencias"/></label>
      <label className="crm-file-upload"><span className="crm-file-icon"><Upload size={19}/></span><span><strong>Adjuntar evidencia</strong><small>PDF, Word, JPG o PNG · máximo recomendado 10 MB</small></span><input name="evidence" type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"/></label>
      {selected.attachment && <div className="crm-current-file"><Paperclip size={15}/><span><strong>Archivo asociado</strong>{selected.attachment}</span></div>}
      <footer><button type="button" className="btn btn-secondary" onClick={() => setSelected(null)}>Cancelar</button><button type="submit" className="btn btn-primary"><CalendarClock size={16}/>Guardar gestión</button></footer>
    </form></section></div>}
  </>;
}
