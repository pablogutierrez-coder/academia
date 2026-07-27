"use client";

import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Mail,
  MessageSquareText,
  Plus,
  RefreshCw,
  Send,
  Star,
  UsersRound,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

type SurveyStatus = "ACTIVA" | "PROGRAMADA" | "CERRADA";
type SurveyCampaign = {
  id: string;
  name: string;
  course: string;
  group: string;
  teacher: string;
  sentAt: string;
  deadline: string;
  recipients: number;
  responses: number;
  nps: number | null;
  status: SurveyStatus;
  reminders: number;
  scores: { course: number; materials: number; teacher: number };
};

const courseCatalog = [
  {
    name: "Analítica de datos aplicada",
    teacher: "Oscar Vildoso García",
    groups: [{ name: "GRP-03", students: 24 }, { name: "GRP-04", students: 18 }],
  },
  {
    name: "Estrategias de marketing digital",
    teacher: "Claudia Rivas Soto",
    groups: [{ name: "GRP-05", students: 28 }, { name: "GRP-06", students: 21 }],
  },
  {
    name: "Fundamentos de gestión empresarial",
    teacher: "Víctor Lara Reynoso",
    groups: [{ name: "GRP-07", students: 22 }],
  },
];

const initialCampaigns: SurveyCampaign[] = [
  { id: "NPS-2026-004", name: "Experiencia de cierre · Analítica", course: "Analítica de datos aplicada", group: "GRP-03", teacher: "Oscar Vildoso García", sentAt: "24/07/2026", deadline: "31/07/2026", recipients: 24, responses: 19, nps: 58, status: "ACTIVA", reminders: 1, scores: { course: 9.1, materials: 8.6, teacher: 9.4 } },
  { id: "NPS-2026-003", name: "Pulso de mitad de curso · Marketing", course: "Estrategias de marketing digital", group: "GRP-05", teacher: "Claudia Rivas Soto", sentAt: "18/07/2026", deadline: "25/07/2026", recipients: 28, responses: 23, nps: 47, status: "CERRADA", reminders: 2, scores: { course: 8.7, materials: 8.2, teacher: 9.0 } },
  { id: "NPS-2026-002", name: "Valoración final · Gestión empresarial", course: "Fundamentos de gestión empresarial", group: "GRP-07", teacher: "Víctor Lara Reynoso", sentAt: "10/07/2026", deadline: "17/07/2026", recipients: 22, responses: 20, nps: 65, status: "CERRADA", reminders: 1, scores: { course: 9.2, materials: 8.8, teacher: 9.5 } },
  { id: "NPS-2026-001", name: "Encuesta de bienvenida · Analítica", course: "Analítica de datos aplicada", group: "GRP-04", teacher: "Oscar Vildoso García", sentAt: "05/07/2026", deadline: "12/07/2026", recipients: 18, responses: 14, nps: 43, status: "CERRADA", reminders: 1, scores: { course: 8.5, materials: 8.1, teacher: 8.9 } },
];

const statusLabel: Record<SurveyStatus, string> = { ACTIVA: "Activa", PROGRAMADA: "Programada", CERRADA: "Cerrada" };
const statusClass: Record<SurveyStatus, string> = { ACTIVA: "success", PROGRAMADA: "warning", CERRADA: "neutral" };

export function NpsSurveys() {
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [courseFilter, setCourseFilter] = useState("TODOS");
  const [groupFilter, setGroupFilter] = useState("TODOS");
  const [statusFilter, setStatusFilter] = useState("TODOS");
  const [composerOpen, setComposerOpen] = useState(false);
  const [selected, setSelected] = useState<SurveyCampaign | null>(null);
  const [message, setMessage] = useState("");
  const [draftCourse, setDraftCourse] = useState(courseCatalog[0]!.name);
  const [draftGroup, setDraftGroup] = useState(courseCatalog[0]!.groups[0]!.name);
  const [dimensions, setDimensions] = useState({ course: true, materials: true, teacher: true });

  const draftCourseData = courseCatalog.find((item) => item.name === draftCourse) ?? courseCatalog[0]!;
  const draftGroupData = draftCourseData.groups.find((item) => item.name === draftGroup) ?? draftCourseData.groups[0]!;
  const visible = campaigns.filter((item) =>
    (courseFilter === "TODOS" || item.course === courseFilter) &&
    (groupFilter === "TODOS" || item.group === groupFilter) &&
    (statusFilter === "TODOS" || item.status === statusFilter)
  );
  const totalRecipients = campaigns.reduce((sum, item) => sum + item.recipients, 0);
  const totalResponses = campaigns.reduce((sum, item) => sum + item.responses, 0);
  const responseRate = Math.round((totalResponses / totalRecipients) * 100);
  const scored = campaigns.filter((item) => item.nps !== null);
  const globalNps = Math.round(scored.reduce((sum, item) => sum + (item.nps ?? 0), 0) / scored.length);
  const pendingResponses = campaigns.filter((item) => item.status === "ACTIVA").reduce((sum, item) => sum + item.recipients - item.responses, 0);
  const groupOptions = useMemo(
    () => Array.from(new Set(campaigns.filter((item) => courseFilter === "TODOS" || item.course === courseFilter).map((item) => item.group))),
    [campaigns, courseFilter],
  );

  function changeDraftCourse(value: string) {
    const course = courseCatalog.find((item) => item.name === value) ?? courseCatalog[0]!;
    setDraftCourse(value);
    setDraftGroup(course.groups[0]!.name);
  }

  function sendSurvey(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (!Object.values(dimensions).some(Boolean)) {
      setMessage("Selecciona al menos una dimensión para incluir en la encuesta.");
      return;
    }
    const campaign: SurveyCampaign = {
      id: `NPS-2026-${String(campaigns.length + 1).padStart(3, "0")}`,
      name: String(form.get("name")),
      course: draftCourse,
      group: draftGroup,
      teacher: draftCourseData.teacher,
      sentAt: "26/07/2026",
      deadline: new Intl.DateTimeFormat("es-PE").format(new Date(`${String(form.get("deadline"))}T12:00:00`)),
      recipients: draftGroupData.students,
      responses: 0,
      nps: null,
      status: String(form.get("delivery")) === "PROGRAMADA" ? "PROGRAMADA" : "ACTIVA",
      reminders: 0,
      scores: { course: 0, materials: 0, teacher: 0 },
    };
    setCampaigns((current) => [campaign, ...current]);
    setComposerOpen(false);
    setMessage(campaign.status === "PROGRAMADA"
      ? `${campaign.id} quedó programada para ${campaign.recipients} estudiantes de ${campaign.group}.`
      : `${campaign.id} fue registrada para envío por correo a ${campaign.recipients} estudiantes de ${campaign.group}.`);
  }

  function sendReminder(item: SurveyCampaign) {
    const pending = item.recipients - item.responses;
    setCampaigns((current) => current.map((campaign) => campaign.id === item.id ? { ...campaign, reminders: campaign.reminders + 1 } : campaign));
    setSelected((current) => current?.id === item.id ? { ...current, reminders: current.reminders + 1 } : current);
    setMessage(`Recordatorio registrado para los ${pending} estudiantes pendientes de ${item.group}.`);
  }

  function closeSurvey(item: SurveyCampaign) {
    const updated = { ...item, status: "CERRADA" as const };
    setCampaigns((current) => current.map((campaign) => campaign.id === item.id ? updated : campaign));
    setSelected(updated);
    setMessage(`${item.id} fue cerrada. Sus resultados permanecen disponibles para consulta.`);
  }

  return <>
    <header className="page-header">
      <div><span className="page-kicker">Experiencia del estudiante</span><h1>Encuestas NPS</h1><p>Envía encuestas por curso y grupo para valorar la experiencia, los materiales y el desempeño docente.</p></div>
      <button className="btn btn-primary" onClick={() => { setMessage(""); setComposerOpen(true); }}><Plus size={17}/>Crear encuesta</button>
    </header>

    <div className="feedback feedback-info"><Mail size={16}/>El flujo de correo está habilitado como demostración. La integración con un proveedor de correo se conectará en una siguiente etapa.</div>
    {message && <div className={`feedback ${message.startsWith("Selecciona") ? "feedback-error" : "feedback-success"}`} role="status"><CheckCircle2 size={16}/>{message}</div>}

    <section className="metric-grid compact nps-metrics">
      <article className="metric-card"><div className="metric-head"><span>NPS global</span><BarChart3 size={17}/></div><strong>+{globalNps}</strong><small>Resultado consolidado</small></article>
      <article className="metric-card"><div className="metric-head"><span>Tasa de respuesta</span><ClipboardCheck size={17}/></div><strong>{responseRate}%</strong><small>{totalResponses} de {totalRecipients} respuestas</small></article>
      <article className="metric-card"><div className="metric-head"><span>Encuestas activas</span><Mail size={17}/></div><strong>{campaigns.filter((item) => item.status === "ACTIVA").length}</strong><small>Actualmente recibiendo respuestas</small></article>
      <article className="metric-card"><div className="metric-head"><span>Respuestas pendientes</span><UsersRound size={17}/></div><strong>{pendingResponses}</strong><small>Requieren recordatorio</small></article>
    </section>

    <section className="panel nps-overview">
      <div><span className="nps-score-ring">+{globalNps}<small>NPS</small></span><div><h2>Percepción general positiva</h2><p>Los estudiantes destacan la calidad docente. Los materiales concentran la mayor oportunidad de mejora.</p></div></div>
      <div className="nps-segments" aria-label="Distribución NPS"><span className="detractors" style={{ width: "18%" }}>18%</span><span className="passives" style={{ width: "25%" }}>25%</span><span className="promoters" style={{ width: "57%" }}>57%</span></div>
      <footer><span><i className="detractors"/>Detractores</span><span><i className="passives"/>Pasivos</span><span><i className="promoters"/>Promotores</span></footer>
    </section>

    <section className="panel nps-campaigns">
      <header className="panel-header"><div><h2>Campañas y resultados</h2><p>Consulta el avance de cada envío y gestiona recordatorios.</p></div><span>{visible.length} campañas</span></header>
      <div className="nps-filters">
        <label className="form-field"><span>Curso</span><select value={courseFilter} onChange={(event) => { setCourseFilter(event.target.value); setGroupFilter("TODOS"); }}><option value="TODOS">Todos los cursos</option>{courseCatalog.map((item) => <option key={item.name}>{item.name}</option>)}</select></label>
        <label className="form-field"><span>Grupo</span><select value={groupFilter} onChange={(event) => setGroupFilter(event.target.value)}><option value="TODOS">Todos los grupos</option>{groupOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label className="form-field"><span>Estado</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="TODOS">Todos los estados</option><option value="ACTIVA">Activa</option><option value="PROGRAMADA">Programada</option><option value="CERRADA">Cerrada</option></select></label>
      </div>
      <div className="table-scroll"><table className="data-table nps-table">
        <thead><tr><th>Encuesta</th><th>Curso y grupo</th><th>Envío</th><th>Respuestas</th><th>NPS</th><th>Estado</th><th className="align-right">Acción</th></tr></thead>
        <tbody>{visible.map((item) => {
          const percentage = Math.round((item.responses / item.recipients) * 100);
          return <tr key={item.id}>
            <td><strong>{item.name}</strong><small>{item.id}</small></td>
            <td><strong>{item.course}</strong><small>{item.group} · {item.teacher}</small></td>
            <td>{item.sentAt}<small>Vence {item.deadline}</small></td>
            <td><strong>{item.responses}/{item.recipients}</strong><span className="nps-response-progress"><i style={{ width: `${percentage}%` }}/></span><small>{percentage}% completado</small></td>
            <td><strong className={item.nps === null ? "nps-pending" : "nps-positive"}>{item.nps === null ? "—" : `+${item.nps}`}</strong></td>
            <td><span className={`status-badge ${statusClass[item.status]}`}>{statusLabel[item.status]}</span></td>
            <td className="align-right"><button className="row-action" onClick={() => setSelected(item)}>Ver detalle <ChevronRight size={14}/></button></td>
          </tr>;
        })}</tbody>
      </table></div>
    </section>

    {composerOpen && <div className="modal-backdrop"><section className="modal nps-composer-modal" role="dialog" aria-modal="true" aria-labelledby="nps-composer-title">
      <header><div><span className="page-kicker">Nueva campaña</span><h2 id="nps-composer-title">Enviar encuesta NPS</h2><p>Configura la audiencia, las dimensiones y el contenido del correo.</p></div><button className="icon-button" onClick={() => setComposerOpen(false)} aria-label="Cerrar formulario"><X size={18}/></button></header>
      <form onSubmit={sendSurvey}><div className="nps-composer-grid">
        <div className="nps-form-column">
          <section className="nps-form-section"><h3>1. Curso y destinatarios</h3><div className="form-row"><label className="form-field"><span>Curso</span><select value={draftCourse} onChange={(event) => changeDraftCourse(event.target.value)}>{courseCatalog.map((item) => <option key={item.name}>{item.name}</option>)}</select></label><label className="form-field"><span>Grupo</span><select value={draftGroup} onChange={(event) => setDraftGroup(event.target.value)}>{draftCourseData.groups.map((item) => <option key={item.name}>{item.name}</option>)}</select></label></div><div className="nps-recipient-summary"><UsersRound size={19}/><div><strong>{draftGroupData.students} estudiantes con correo</strong><span>{draftGroup} · Docente: {draftCourseData.teacher}</span></div><span className="status-badge success">Listos</span></div></section>
          <section className="nps-form-section"><h3>2. Configuración</h3><label className="form-field"><span>Nombre de la encuesta</span><input name="name" required defaultValue={`Valoración de experiencia · ${draftGroup}`} /></label><div className="form-row"><label className="form-field"><span>Fecha límite</span><input name="deadline" type="date" min="2026-07-27" defaultValue="2026-08-02" required/></label><label className="form-field"><span>Tipo de envío</span><select name="delivery"><option value="AHORA">Enviar ahora</option><option value="PROGRAMADA">Programar envío</option></select></label></div></section>
          <section className="nps-form-section"><h3>3. Dimensiones de valoración</h3><div className="nps-dimension-grid"><label><input type="checkbox" checked={dimensions.course} onChange={(event) => setDimensions((current) => ({ ...current, course: event.target.checked }))}/><span><Star size={17}/><strong>Curso</strong><small>Contenido y experiencia general</small></span></label><label><input type="checkbox" checked={dimensions.materials} onChange={(event) => setDimensions((current) => ({ ...current, materials: event.target.checked }))}/><span><ClipboardCheck size={17}/><strong>Materiales</strong><small>Claridad, utilidad y vigencia</small></span></label><label><input type="checkbox" checked={dimensions.teacher} onChange={(event) => setDimensions((current) => ({ ...current, teacher: event.target.checked }))}/><span><UsersRound size={17}/><strong>Docente</strong><small>Dominio, claridad y acompañamiento</small></span></label></div></section>
          <section className="nps-form-section"><h3>4. Correo</h3><label className="form-field"><span>Asunto</span><input name="subject" required defaultValue={`Queremos conocer tu experiencia en ${draftCourse}`} /></label><label className="form-field"><span>Mensaje</span><textarea name="message" rows={4} required defaultValue={`Hola, ayúdanos a mejorar respondiendo esta breve encuesta sobre tu experiencia en ${draftCourse}. Te tomará menos de 3 minutos.`}/></label></section>
        </div>
        <aside className="nps-email-preview"><span className="page-kicker">Vista previa del correo</span><div className="nps-email-card"><span className="nps-email-icon"><Mail size={22}/></span><small>ELITE EXPERT ACADEMY</small><h3>Tu experiencia nos ayuda a mejorar</h3><p>Valora del 0 al 10 tu experiencia con el curso, sus materiales y el docente.</p><div className="nps-scale">{Array.from({ length: 11 }, (_, index) => <span key={index}>{index}</span>)}</div><button type="button">Responder encuesta</button><small>Enlace personal · Una respuesta por estudiante</small></div><div className="nps-delivery-note"><CheckCircle2 size={18}/><div><strong>Audiencia validada</strong><span>Se excluirán estudiantes sin correo y se conservará trazabilidad por campaña.</span></div></div></aside>
      </div><footer><button type="button" className="btn btn-secondary" onClick={() => setComposerOpen(false)}>Cancelar</button><button className="btn btn-primary" type="submit"><Send size={16}/>Enviar encuesta por correo</button></footer></form>
    </section></div>}

    {selected && <div className="modal-backdrop"><section className="modal nps-results-modal" role="dialog" aria-modal="true" aria-labelledby="nps-results-title">
      <header><div><span className="page-kicker">{selected.id} · {selected.group}</span><h2 id="nps-results-title">{selected.name}</h2><p>{selected.course} · {selected.teacher}</p></div><button className="icon-button" onClick={() => setSelected(null)} aria-label="Cerrar resultados"><X size={18}/></button></header>
      <div className="nps-results-body"><section className="nps-results-summary"><span className="nps-score-ring">{selected.nps === null ? "—" : `+${selected.nps}`}<small>NPS</small></span><div><strong>{selected.responses} de {selected.recipients}</strong><span>estudiantes respondieron</span><small>{selected.reminders} recordatorios enviados</small></div><span className={`status-badge ${statusClass[selected.status]}`}>{statusLabel[selected.status]}</span></section>
        {selected.nps !== null ? <><section className="nps-dimension-results"><h3>Valoración por dimensión</h3>{[["Curso", selected.scores.course], ["Materiales", selected.scores.materials], ["Docente", selected.scores.teacher]].map(([label, score]) => <div key={String(label)}><span>{label}</span><span className="nps-dimension-bar"><i style={{ width: `${Number(score) * 10}%` }}/></span><strong>{Number(score).toFixed(1)}</strong></div>)}</section><section className="nps-comments"><h3>Comentarios destacados</h3><article><MessageSquareText size={17}/><p>“El docente explica con ejemplos claros y responde todas las consultas.”</p></article><article><MessageSquareText size={17}/><p>“Sería útil incluir más ejercicios descargables en los materiales.”</p></article></section></> : <div className="empty-state"><BarChart3 size={28}/><strong>Aún no hay respuestas</strong><p>Los resultados aparecerán cuando los estudiantes completen la encuesta.</p></div>}
      </div>
      <footer className="modal-actions"><button className="btn btn-secondary" onClick={() => sendReminder(selected)} disabled={selected.status !== "ACTIVA"}><RefreshCw size={16}/>Enviar recordatorio</button>{selected.status === "ACTIVA" && <button className="btn btn-primary" onClick={() => closeSurvey(selected)}><CalendarDays size={16}/>Cerrar encuesta</button>}</footer>
    </section></div>}
  </>;
}
