"use client";

import { Activity, BookOpenCheck, MessageSquareText, ShieldCheck, Star, TrendingDown, TrendingUp, UsersRound } from "lucide-react";
import { useMemo, useState } from "react";

type DashboardKey = "docente" | "estudiante" | "gestion-estudiante" | "administracion";
type Periodo = "7" | "30" | "90";

const dashboardData = {
  docente: {
    kicker: "Gestión operativa",
    title: "Dashboard docente",
    description: "Consulta el rendimiento de tus grupos, la asistencia y tu actividad académica.",
    metrics: [["Grupos asignados", "4", "Periodo actual"], ["Próximas clases", "6", "Próximos 7 días"], ["Asistencia promedio", "91%", "+3% frente al periodo anterior"], ["Materiales publicados", "18", "En tus cursos"]],
    chartTitle: "Asistencia promedio por día",
    chartDescription: "Promedio diario de asistencia considerando todos tus grupos asignados.",
    labels: ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"],
    series: { "7": [78, 88, 84, 93, 89, 96, 91], "30": [72, 78, 82, 80, 86, 89, 91], "90": [68, 73, 76, 79, 83, 87, 91] },
    sideTitle: "Avance por curso",
    progress: [["Analítica de datos", 72], ["Marketing digital", 61], ["Gestión empresarial", 84]],
  },
  estudiante: {
    kicker: "Experiencia académica",
    title: "Mi dashboard",
    description: "Revisa tus calificaciones, asistencia y progreso en los cursos activos.",
    metrics: [["Cursos activos", "2", "Periodo actual"], ["Asistencia", "94%", "+2% este mes"], ["Promedio", "17.2", "Sobre 20"], ["Progreso", "68%", "Programa actual"]],
    chartTitle: "Asistencia diaria",
    chartDescription: "Porcentaje de asistencia registrado por día para el curso seleccionado.",
    labels: ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"],
    series: { "7": [65, 75, 80, 72, 90, 86, 88], "30": [58, 64, 70, 74, 78, 82, 86], "90": [52, 58, 62, 69, 75, 81, 86] },
    sideTitle: "Progreso por curso",
    progress: [["Analítica de datos", 72], ["Marketing digital", 61], ["Actividades completadas", 81]],
  },
  "gestion-estudiante": {
    kicker: "Seguimiento académico",
    title: "Dashboard de gestión al estudiante",
    description: "Prioriza ausencias, estudiantes en riesgo y acciones de contacto pendientes.",
    metrics: [["Faltaron hoy", "7", "Prioridad de contacto"], ["Faltas consecutivas", "3", "Riesgo alto"], ["Contactados", "82%", "+9% esta semana"], ["Grupos activos", "8", "200 estudiantes"]],
    chartTitle: "Ausencias y recuperación",
    chartDescription: "Estudiantes ausentes identificados por fecha de seguimiento.",
    labels: ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Hoy"],
    series: { "7": [35, 58, 42, 70, 52, 28, 45], "30": [64, 55, 70, 48, 62, 44, 36], "90": [78, 73, 68, 61, 55, 49, 42] },
    sideTitle: "Estado del seguimiento",
    progress: [["Contactados", 82], ["Con compromiso", 64], ["Recuperados", 48]],
  },
  administracion: {
    kicker: "Control de plataforma",
    title: "Dashboard administrador",
    description: "Supervisa usuarios, accesos, permisos y actividad de los módulos.",
    metrics: [["Usuarios activos", "27", "Acceso vigente"], ["Roles", "7", "Configurados"], ["Sesiones activas", "14", "En este momento"], ["Eventos auditados", "184", "Últimas 24 horas"]],
    chartTitle: "Actividad de acceso",
    chartDescription: "Sesiones iniciadas correctamente por día.",
    labels: ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Hoy"],
    series: { "7": [62, 74, 68, 83, 91, 46, 72], "30": [55, 61, 66, 72, 78, 69, 82], "90": [48, 55, 59, 64, 71, 76, 82] },
    sideTitle: "Acceso por módulo",
    progress: [["Docente", 72], ["Estudiante", 94], ["Gestión al estudiante", 58], ["Administrador", 24]],
  },
} satisfies Record<DashboardKey, {
  kicker: string; title: string; description: string; metrics: string[][];
  chartTitle: string; chartDescription: string; labels: string[];
  series: Record<Periodo, number[]>; sideTitle: string; progress: Array<[string, number]>;
}>;

const studentAttendanceSeries: Record<string, Record<Periodo, number[]>> = {
  "Analítica de datos aplicada": {
    "7": [100, 92, 100, 88, 100, 90, 94],
    "30": [86, 91, 94, 89, 96, 92, 94],
    "90": [82, 87, 90, 91, 93, 94, 94],
  },
  "Estrategias de marketing digital": {
    "7": [100, 75, 80, 100, 83, 78, 83],
    "30": [78, 82, 75, 86, 80, 84, 83],
    "90": [72, 76, 78, 80, 81, 82, 83],
  },
};

const teacherDropoutSeries: Record<Periodo, Array<{ group: string; course: string; value: number; students: number }>> = {
  "7": [
    { group: "GRP-03", course: "Analítica de datos", value: 4.2, students: 1 },
    { group: "GRP-05", course: "Marketing digital", value: 7.8, students: 2 },
    { group: "GRP-07", course: "Gestión empresarial", value: 2.9, students: 1 },
    { group: "GRP-01", course: "Liderazgo", value: 5.4, students: 1 },
  ],
  "30": [
    { group: "GRP-03", course: "Analítica de datos", value: 5.1, students: 2 },
    { group: "GRP-05", course: "Marketing digital", value: 8.6, students: 3 },
    { group: "GRP-07", course: "Gestión empresarial", value: 3.4, students: 1 },
    { group: "GRP-01", course: "Liderazgo", value: 6.2, students: 2 },
  ],
  "90": [
    { group: "GRP-03", course: "Analítica de datos", value: 6.3, students: 3 },
    { group: "GRP-05", course: "Marketing digital", value: 9.2, students: 4 },
    { group: "GRP-07", course: "Gestión empresarial", value: 4.1, students: 2 },
    { group: "GRP-01", course: "Liderazgo", value: 7.0, students: 3 },
  ],
};

const teacherNpsDistribution: Record<Periodo, { detractors: number; passives: number; promoters: number }> = {
  "7": { detractors: 16, passives: 28, promoters: 56 },
  "30": { detractors: 18, passives: 30, promoters: 52 },
  "90": { detractors: 20, passives: 30, promoters: 50 },
};

const teacherSurveySeries: Record<Periodo, Array<{ group: string; course: string; nps: number; teacherScore: number; responses: string }>> = {
  "7": [
    { group: "GRP-03", course: "Analítica de datos", nps: 58, teacherScore: 9.4, responses: "19/24" },
    { group: "GRP-05", course: "Marketing digital", nps: 47, teacherScore: 9.0, responses: "23/28" },
    { group: "GRP-07", course: "Gestión empresarial", nps: 65, teacherScore: 9.5, responses: "20/22" },
    { group: "GRP-01", course: "Liderazgo", nps: 52, teacherScore: 9.2, responses: "17/21" },
  ],
  "30": [
    { group: "GRP-03", course: "Analítica de datos", nps: 55, teacherScore: 9.2, responses: "21/24" },
    { group: "GRP-05", course: "Marketing digital", nps: 44, teacherScore: 8.8, responses: "25/28" },
    { group: "GRP-07", course: "Gestión empresarial", nps: 61, teacherScore: 9.4, responses: "21/22" },
    { group: "GRP-01", course: "Liderazgo", nps: 49, teacherScore: 9.0, responses: "19/21" },
  ],
  "90": [
    { group: "GRP-03", course: "Analítica de datos", nps: 51, teacherScore: 9.1, responses: "22/24" },
    { group: "GRP-05", course: "Marketing digital", nps: 42, teacherScore: 8.7, responses: "26/28" },
    { group: "GRP-07", course: "Gestión empresarial", nps: 59, teacherScore: 9.3, responses: "22/22" },
    { group: "GRP-01", course: "Liderazgo", nps: 47, teacherScore: 8.9, responses: "20/21" },
  ],
};

export function ModuleDashboard({ modulo }: { modulo: DashboardKey }) {
  const [periodo, setPeriodo] = useState<Periodo>("7");
  const [studentCourse, setStudentCourse] = useState("Analítica de datos aplicada");
  const data = dashboardData[modulo];
  const values = modulo === "estudiante" ? studentAttendanceSeries[studentCourse]![periodo] : data.series[periodo];
  const progress = modulo === "estudiante"
    ? studentCourse === "Analítica de datos aplicada"
      ? [["Ruta de aprendizaje", 72], ["Asistencia", 94], ["Evaluaciones completadas", 67]] as Array<[string, number]>
      : [["Ruta de aprendizaje", 61], ["Asistencia", 83], ["Evaluaciones completadas", 50]] as Array<[string, number]>
    : data.progress;
  const average = useMemo(() => Math.round(values.reduce((sum, value) => sum + value, 0) / values.length), [values]);
  const dropoutData = teacherDropoutSeries[periodo];
  const surveyData = teacherSurveySeries[periodo];
  const dropoutAverage = dropoutData.reduce((sum, item) => sum + item.value, 0) / dropoutData.length;
  const teacherAverage = surveyData.reduce((sum, item) => sum + item.teacherScore, 0) / surveyData.length;
  const teacherNps = Math.round(surveyData.reduce((sum, item) => sum + item.nps, 0) / surveyData.length);
  const npsDistribution = teacherNpsDistribution[periodo];
  const dropoutStudents = dropoutData.reduce((sum, item) => sum + item.students, 0);
  const Icon = modulo === "administracion" ? ShieldCheck : modulo === "gestion-estudiante" ? UsersRound : modulo === "estudiante" ? BookOpenCheck : Activity;

  return <>
    <header className="page-header dashboard-heading">
      <div><span className="page-kicker">{data.kicker}</span><h1>{data.title}</h1><p>{data.description}</p></div>
      <div className="dashboard-filter-group">
        {modulo === "estudiante" && <label className="dashboard-period"><span>Curso asignado</span><select aria-label="Curso del dashboard" value={studentCourse} onChange={(event) => setStudentCourse(event.target.value)}><option>Analítica de datos aplicada</option><option>Estrategias de marketing digital</option></select></label>}
        <label className="dashboard-period"><span>Periodo</span><select aria-label="Periodo del dashboard" value={periodo} onChange={(event) => setPeriodo(event.target.value as Periodo)}><option value="7">Últimos 7 días</option><option value="30">Últimos 30 días</option><option value="90">Últimos 90 días</option></select></label>
      </div>
    </header>
    <section className="metric-grid dashboard-metrics">
      {data.metrics.map(([label, value, note], index) => <article className="metric-card" key={label}><div className="metric-head"><span>{label}</span><span className={`metric-icon dashboard-icon ${index === 2 ? "green" : "blue"}`}><Icon size={16}/></span></div><strong>{value}</strong><small>{note}</small></article>)}
    </section>
    <section className="dashboard-grid">
      <article className="panel chart-card">
        <header className="panel-header"><div><h2>{data.chartTitle}</h2><p>{data.chartDescription}</p></div><span className="chart-summary"><TrendingUp size={14}/>{average}% promedio</span></header>
        <div className="bar-chart" role="img" aria-label={`${data.chartTitle}: promedio ${average}%`}>
          <div className="chart-gridlines"><i/><i/><i/><i/></div>
          {values.map((value, index) => <div className="bar-column" key={`${periodo}-${data.labels[index]}`}><span className="bar-value">{value}%</span><i style={{height: `${value}%`}}/><small>{data.labels[index]}</small></div>)}
        </div>
      </article>
      <article className="panel progress-card">
        <header className="panel-header"><div><h2>{data.sideTitle}</h2><p>Distribución actual del periodo seleccionado.</p></div></header>
        <div className="dashboard-progress-list">
          {progress.map(([label, value]) => <div key={label}><span><strong>{label}</strong><b>{value}%</b></span><div><i style={{width: `${value}%`}}/></div></div>)}
        </div>
        <div className="dashboard-insight"><Activity size={17}/><div><strong>Indicador actualizado</strong><span>{modulo === "estudiante" ? `${studentCourse} · ` : ""}Datos de los últimos {periodo} días.</span></div></div>
      </article>
    </section>
    {modulo === "docente" && <>
    <section className="teacher-overview-grid">
      <article className="panel teacher-dropout-overview">
        <header className="panel-header"><div><h2>Deserción general</h2><p>Resultado consolidado de todos los cursos y grupos activos asignados.</p></div></header>
        <div className="teacher-dropout-overview-body">
          <span className="teacher-dropout-donut" style={{ background: `conic-gradient(#e99797 0 ${dropoutAverage}%, var(--success-bg) ${dropoutAverage}% 100%)` }}><strong>{dropoutAverage.toFixed(1)}%</strong><small>deserción</small></span>
          <div className="teacher-dropout-summary">
            <h3>Deserción bajo control</h3>
            <p>El indicador general se mantiene por debajo del umbral de alerta del 7%.</p>
            <dl><div><dt>Estudiantes retirados</dt><dd>{dropoutStudents}</dd></div><div><dt>Continuidad estimada</dt><dd>{(100 - dropoutAverage).toFixed(1)}%</dd></div></dl>
          </div>
        </div>
        <footer className="teacher-overview-note"><TrendingDown size={15}/><span>Calculado con matrículas y retiros de los últimos {periodo} días.</span></footer>
      </article>

      <article className="panel nps-overview teacher-nps-overview">
        <div><span className="nps-score-ring">+{teacherNps}<small>NPS</small></span><div><h2>Percepción general de mis grupos</h2><p>La valoración docente alcanza {teacherAverage.toFixed(1)}/10. Los resultados consolidan las encuestas de todos los grupos asignados.</p></div></div>
        <div className="nps-segments" aria-label="Distribución NPS docente"><span className="detractors" style={{ width: `${npsDistribution.detractors}%` }}>{npsDistribution.detractors}%</span><span className="passives" style={{ width: `${npsDistribution.passives}%` }}>{npsDistribution.passives}%</span><span className="promoters" style={{ width: `${npsDistribution.promoters}%` }}>{npsDistribution.promoters}%</span></div>
        <footer><span><i className="detractors"/>Detractores</span><span><i className="passives"/>Pasivos</span><span><i className="promoters"/>Promotores</span></footer>
      </article>
    </section>

    <section className="teacher-analytics-grid">
      <article className="panel teacher-dropout-card">
        <header className="panel-header">
          <div><h2>Deserción por grupo</h2><p>Porcentaje de estudiantes retirados o sin continuidad en cada grupo asignado.</p></div>
          <span className="chart-summary dropout-summary"><TrendingDown size={14}/>{dropoutAverage.toFixed(1)}% promedio</span>
        </header>
        <div className="teacher-dropout-list">
          {dropoutData.map((item) => <div key={item.group}>
            <span><strong>{item.group}</strong><small>{item.course} · {item.students} {item.students === 1 ? "estudiante" : "estudiantes"}</small><b>{item.value.toFixed(1)}%</b></span>
            <div><i className={item.value >= 7 ? "high" : item.value >= 5 ? "medium" : "low"} style={{ width: `${Math.min(item.value * 10, 100)}%` }}/></div>
          </div>)}
        </div>
        <footer className="teacher-chart-legend"><span><i className="low"/>Menor a 5%</span><span><i className="medium"/>Entre 5% y 7%</span><span><i className="high"/>Mayor a 7%</span></footer>
      </article>

      <article className="panel teacher-survey-card">
        <header className="panel-header">
          <div><h2>Encuestas de mis grupos</h2><p>NPS del curso y valoración recibida por el docente en cada grupo.</p></div>
          <span className="chart-summary teacher-score-summary"><Star size={14}/>{teacherAverage.toFixed(1)}/10 docente</span>
        </header>
        <div className="teacher-survey-chart">
          {surveyData.map((item) => <div className="teacher-survey-row" key={item.group}>
            <div><strong>{item.group}</strong><small>{item.course} · {item.responses} respuestas</small></div>
            <div className="survey-series">
              <span><small>NPS del grupo</small><i className="group-nps" style={{ width: `${item.nps}%` }}/><b>+{item.nps}</b></span>
              <span><small>Valoración docente</small><i className="teacher-rating" style={{ width: `${item.teacherScore * 10}%` }}/><b>{item.teacherScore.toFixed(1)}</b></span>
            </div>
          </div>)}
        </div>
        <footer className="teacher-survey-footer"><MessageSquareText size={16}/><span>Resultados recibidos desde Encuestas NPS para los grupos asignados.</span></footer>
      </article>
    </section>
    </>}
  </>;
}
