"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Filter, MoreHorizontal, Search, SlidersHorizontal } from "lucide-react";
import { SaasShell } from "../../components/saas-shell";
import { CourseDetail, CourseManagement } from "../../components/course-management";
import { AdminUsers, LmsBuilder, TeacherAssessments, TeacherAttendance } from "../../components/module-functions";
import { ModuleDashboard } from "../../components/module-dashboard";
import { TeacherAgenda } from "../../components/teacher-agenda";
import { StudentAttendance, StudentCalendar, StudentCertificates, StudentGrades, StudentLearningPath, StudentRequests } from "../../components/student-functions";
import { AcademicCatalogManagement } from "../../components/academic-catalogs";
import { AbsenceCRM } from "../../components/absence-crm";
import { AttendanceControl, RetentionResults } from "../../components/attendance-retention";
import { AcademicCalendar } from "../../components/academic-calendar";
import { ManagementReports, TicketCenter } from "../../components/operations-center";
import { NpsSurveys } from "../../components/nps-surveys";
import { api } from "../../lib/api";

const catalogos: Record<string, { titulo: string; descripcion: string; endpoint: string; accion: string }> = {
  programas: { titulo: "Programas", descripcion: "Administra la oferta académica, sus versiones y responsables.", endpoint: "programas", accion: "Nuevo programa" },
  grupos: { titulo: "Grupos", descripcion: "Consulta capacidad, calendario, responsables y progreso por grupo.", endpoint: "grupos", accion: "Nuevo grupo" },
  docentes: { titulo: "Docentes", descripcion: "Gestiona perfiles, disponibilidad, especialidades y carga docente.", endpoint: "docentes", accion: "Registrar docente" },
  estudiantes: { titulo: "Estudiantes", descripcion: "Consulta la ficha única, historial académico y nivel de riesgo.", endpoint: "estudiantes", accion: "Registrar estudiante" },
};

const vistas: Record<string, { titulo: string; descripcion: string; metricas: Array<[string, string, string]>; bloques: Array<[string, string[]]> }> = {
  docente: { titulo: "Dashboard docente", descripcion: "Consulta tus grupos, próximas clases, asistencia pendiente y actividad académica.", metricas: [["Grupos asignados", "4", "Periodo actual"], ["Próximas clases", "6", "Próximos 7 días"], ["Asistencias pendientes", "2", "Requieren cierre"], ["Materiales publicados", "18", "En tus cursos"]], bloques: [["Mi operación", ["Próxima clase: Analítica I · hoy 18:00", "2 asistencias pendientes de cierre", "1 evaluación por publicar"]], ["Gestión docente", ["Confirmar disponibilidad", "Revisar carga asignada", "Consultar evaluación docente"]]] },
  "docente-grupos": { titulo: "Mis grupos", descripcion: "Consulta los grupos asignados, sus estudiantes, horarios y avance.", metricas: [["Asignados", "4", "Grupos activos"], ["Estudiantes", "96", "Total a cargo"], ["Avance promedio", "64%", "Según malla"]], bloques: [["Grupos activos", ["GRP-01 · Analítica de Datos", "GRP-04 · Gestión Empresarial", "GRP-07 · Liderazgo"]], ["Acciones", ["Consultar estudiantes", "Abrir calendario", "Ver historial de clases"]]] },
  "docente-cursos": { titulo: "Mis cursos", descripcion: "Gestiona contenidos, sesiones y recursos desde el entorno LMS docente.", metricas: [["Cursos activos", "3", "Con grupos asignados"], ["Sesiones", "24", "Publicadas"], ["Pendientes", "2", "Por preparar"]], bloques: [["Contenido LMS", ["Módulos y temas", "Objetivos de aprendizaje", "Orden de sesiones"]], ["Publicación", ["Vista previa", "Programar publicación", "Control de vigencia"]]] },
  "docente-materiales": { titulo: "Materiales del curso", descripcion: "Carga y organiza materiales con versión, vigencia y aprobación.", metricas: [["Vigentes", "18", "Material oficial"], ["En revisión", "3", "Pendientes"], ["Obsoletos", "2", "Versiones anteriores"]], bloques: [["Carga", ["Archivo y descripción", "Relación con módulo", "Nueva versión"]], ["Control", ["Estado de aprobación", "Hash y responsable", "Historial de versiones"]]] },
  "docente-asistencia": { titulo: "Registrar asistencia", descripcion: "Registra y cierra la asistencia de los estudiantes en tus clases.", metricas: [["Por registrar", "2", "Clases pendientes"], ["Asistencia media", "92%", "Tus grupos"], ["Sin registro", "5", "Estudiantes"]], bloques: [["Registro de clase", ["Presente o tardanza", "Falta justificada", "Minutos de conexión"]], ["Cierre", ["Validar faltantes", "Agregar observaciones", "Confirmar y auditar"]]] },
  "docente-evaluaciones": { titulo: "Evaluaciones y notas", descripcion: "Crea evaluaciones, califica intentos y publica retroalimentación.", metricas: [["Activas", "5", "En tus cursos"], ["Por calificar", "16", "Intentos"], ["Promedio", "16.8", "Sobre 20"]], bloques: [["Evaluaciones", ["Instrumentos y rúbricas", "Intentos", "Criterios de aprobación"]], ["Calificación", ["Notas pendientes", "Retroalimentación", "Publicación de resultados"]]] },
  "docente-agenda": { titulo: "Mi agenda", descripcion: "Consulta tus clases, confirmaciones y actividades académicas.", metricas: [["Hoy", "2", "Clases programadas"], ["Esta semana", "6", "Clases"], ["Por confirmar", "1", "Asignación"]], bloques: [["Agenda", ["Calendario semanal", "Enlaces de conexión", "Recordatorios"]], ["Disponibilidad", ["Horarios disponibles", "Bloqueos personales", "Confirmaciones"]]] },
  estudiante: { titulo: "Mi dashboard", descripcion: "Revisa tus cursos, asistencia, notas y próximos compromisos académicos.", metricas: [["Cursos activos", "2", "Periodo actual"], ["Asistencia", "94%", "Acumulada"], ["Promedio", "17.2", "Sobre 20"], ["Progreso", "68%", "Programa actual"]], bloques: [["Próximas actividades", ["Clase de Analítica · hoy 18:00", "Evaluación de Marketing · vence viernes", "Nuevo material disponible"]], ["Mi avance", ["12 sesiones completadas", "3 evaluaciones aprobadas", "Sin tareas vencidas"]]] },
  "mis-cursos": { titulo: "Mis cursos", descripcion: "Accede a tus cursos, módulos, sesiones y materiales.", metricas: [["Activos", "2", "Periodo actual"], ["Módulos completos", "7", "De 11"], ["Materiales nuevos", "3", "Sin revisar"]], bloques: [["Analítica de Datos", ["Módulo 3 · Visualización", "Próxima sesión: hoy", "Progreso 72%"]], ["Marketing Digital", ["Módulo 2 · Canales", "Próxima sesión: jueves", "Progreso 61%"]]] },
  "mi-calendario": { titulo: "Mi calendario", descripcion: "Consulta tus clases, evaluaciones y fechas importantes.", metricas: [["Clases esta semana", "4", "Próximos 7 días"], ["Evaluaciones", "1", "Pendiente"], ["Eventos", "2", "Académicos"]], bloques: [["Hoy", ["18:00 · Analítica de Datos", "Material previo disponible"]], ["Próximamente", ["Jueves · Marketing Digital", "Viernes · Evaluación de canales"]]] },
  "mi-asistencia": { titulo: "Mis asistencias", descripcion: "Consulta tu asistencia por curso, faltas y justificaciones.", metricas: [["Asistencia total", "94%", "Acumulada"], ["Faltas", "1", "Periodo actual"], ["Tardanzas", "2", "Periodo actual"]], bloques: [["Por curso", ["Analítica de Datos · 96%", "Marketing Digital · 92%"]], ["Historial", ["Presencias y tardanzas", "Faltas justificadas", "Observaciones"]]] },
  "mis-notas": { titulo: "Mis notas", descripcion: "Consulta calificaciones, intentos y retroalimentación docente.", metricas: [["Promedio", "17.2", "Sobre 20"], ["Aprobadas", "3", "Evaluaciones"], ["Pendientes", "1", "Sin calificar"]], bloques: [["Resultados", ["Fundamentos · 18", "Caso práctico · 16.5", "Proyecto parcial · pendiente"]], ["Retroalimentación", ["Fortalezas", "Aspectos por mejorar", "Rúbrica aplicada"]]] },
  "mi-progreso": { titulo: "Mi progreso", descripcion: "Visualiza el avance académico y los requisitos de aprobación.", metricas: [["Progreso", "68%", "Programa actual"], ["Sesiones", "12/18", "Completadas"], ["Aprobación", "En curso", "Cumple requisitos"]], bloques: [["Malla académica", ["Módulos completados", "Módulo actual", "Siguientes contenidos"]], ["Elegibilidad", ["Asistencia mínima", "Nota mínima", "Actividades completas"]]] },
  "mis-materiales": { titulo: "Materiales", descripcion: "Consulta los materiales oficiales y vigentes de tus cursos.", metricas: [["Disponibles", "18", "Materiales"], ["Nuevos", "3", "Esta semana"], ["Descargados", "12", "En total"]], bloques: [["Recientes", ["Guía de visualización", "Caso de estudio", "Plantilla de proyecto"]], ["Organización", ["Por curso", "Por módulo", "Por tipo"]]] },
  "mis-certificados": { titulo: "Certificados", descripcion: "Consulta, descarga y valida tus certificados académicos.", metricas: [["Disponibles", "2", "Emitidos"], ["En progreso", "1", "Programa actual"], ["Revocados", "0", "Sin incidencias"]], bloques: [["Certificados", ["Fundamentos de Gestión", "Introducción a Marketing"]], ["Validación", ["Código único", "Código QR", "Historial de emisión"]]] },
  "mis-solicitudes": { titulo: "Mis solicitudes", descripcion: "Registra solicitudes académicas y consulta su estado.", metricas: [["Abiertas", "1", "En atención"], ["Resueltas", "4", "Histórico"], ["Tiempo medio", "8 h", "Primera respuesta"]], bloques: [["Nueva solicitud", ["Consulta académica", "Justificación de falta", "Problema con material"]], ["Seguimiento", ["Estado", "Respuesta del equipo", "Historial"]]] },
  "gestion-estudiante": { titulo: "Dashboard de gestión al estudiante", descripcion: "Prioriza estudiantes con faltas, organiza el contacto y supervisa la operación académica.", metricas: [["Faltaron hoy", "7", "Prioridad de contacto"], ["Faltas consecutivas", "3", "Riesgo alto"], ["Sin contactar", "5", "Acción pendiente"], ["Grupos activos", "8", "200 estudiantes"]], bloques: [["Prioridad de hoy", ["7 estudiantes faltaron a su última clase", "3 acumulan dos faltas consecutivas", "2 compromisos vencen hoy"]], ["Operación académica", ["Crear y administrar grupos", "Revisar asistencia por clase", "Asignar responsable de seguimiento"]]] },
  "seguimiento-ausencias": { titulo: "Seguimiento de faltas", descripcion: "Vista priorizada de estudiantes ausentes para organizar el contacto y la recuperación.", metricas: [["Ausentes hoy", "7", "Contactar primero"], ["Sin respuesta", "2", "Seguimiento pendiente"], ["Compromisos", "5", "Próxima acción"], ["Recuperados", "4", "Esta semana"]], bloques: [["Cola priorizada", ["Riesgo alto y faltas consecutivas", "Último contacto", "Responsable y próxima acción"]], ["Contacto", ["Llamada", "Correo", "Registro manual de WhatsApp sin API"]]] },
  administracion: { titulo: "Dashboard administrador", descripcion: "Supervisa usuarios, permisos, accesos y configuración general.", metricas: [["Usuarios activos", "27", "Acceso vigente"], ["Roles", "7", "Configurados"], ["Sesiones activas", "14", "En este momento"], ["Eventos críticos", "12", "Hoy"]], bloques: [["Seguridad", ["Usuarios bloqueados", "Intentos fallidos", "Sesiones activas"]], ["Gobierno", ["Revisión de permisos", "Auditoría de cambios", "Configuraciones pendientes"]]] },
  seleccion: { titulo: "Resumen de selección", descripcion: "Control integral de convocatorias, postulantes y avance del proceso.", metricas: [["Convocatorias activas", "6", "2 cierran esta semana"], ["Postulantes", "148", "23 nuevos"], ["Entrevistas pendientes", "18", "Próximos 7 días"], ["Aptos", "32", "Periodo actual"]], bloques: [["Pipeline de selección", ["Postulación recibida", "Evaluación curricular", "Entrevista", "Apto"]], ["Atención requerida", ["8 postulantes sin seguimiento", "3 entrevistas por confirmar", "2 expedientes incompletos"]]] },
  convocatorias: { titulo: "Convocatorias", descripcion: "Publica y controla las oportunidades vigentes de selección.", metricas: [["Activas", "6", "Con postulaciones abiertas"], ["En borrador", "2", "Pendientes de publicación"], ["Finalizadas", "14", "Periodo actual"]], bloques: [["Estados", ["Borrador", "Publicada", "En evaluación", "Finalizada"]], ["Control", ["Vacantes y fechas", "Perfil requerido", "Responsable de selección"]]] },
  postulantes: { titulo: "Postulantes", descripcion: "Centraliza expedientes, evaluaciones y estado de cada persona.", metricas: [["Total activos", "148", "En procesos vigentes"], ["Nuevos", "23", "Últimos 7 días"], ["Por revisar", "17", "Sin evaluación curricular"]], bloques: [["Expediente", ["Datos personales", "Documentos", "Experiencia y formación"]], ["Seguimiento", ["Estado actual", "Responsable", "Próxima acción"]]] },
  seguimientos: { titulo: "Seguimientos", descripcion: "Organiza contactos, compromisos y próximas acciones del equipo.", metricas: [["Pendientes hoy", "12", "Requieren contacto"], ["Vencidos", "3", "Atención inmediata"], ["Completados", "41", "Esta semana"]], bloques: [["Canales", ["Llamada", "Correo", "Reunión"]], ["Trazabilidad", ["Responsable", "Resultado", "Próximo contacto"]]] },
  entrevistas: { titulo: "Entrevistas", descripcion: "Programa entrevistas y registra evaluaciones estructuradas.", metricas: [["Programadas", "18", "Próximos 7 días"], ["Sin confirmar", "3", "Requieren seguimiento"], ["Completadas", "26", "Periodo actual"]], bloques: [["Agenda", ["Fecha y entrevistador", "Modalidad y enlace", "Confirmación"]], ["Evaluación", ["Criterios", "Observaciones", "Recomendación"]]] },
  aptos: { titulo: "Postulantes aptos", descripcion: "Consulta candidatos aprobados y su transferencia a formación.", metricas: [["Aptos", "32", "Periodo actual"], ["Pendientes de alta", "7", "Listos para formación"], ["Transferidos", "25", "Con trazabilidad"]], bloques: [["Validación", ["Resultado final", "Documentos completos", "Aprobador"]], ["Transferencia", ["Programa asignado", "Grupo sugerido", "Fecha de alta"]]] },
  "reportes-seleccion": { titulo: "Reportes de selección", descripcion: "Analiza conversión, tiempos, fuentes y resultados del proceso.", metricas: [["Conversión a apto", "21.6%", "+2.4% vs. periodo anterior"], ["Tiempo promedio", "12 días", "Desde postulación"], ["Cobertura", "86%", "Vacantes cubiertas"]], bloques: [["Indicadores", ["Conversión por etapa", "Tiempo por responsable", "Motivos de descarte"]], ["Exportación", ["CSV", "Excel", "Resumen ejecutivo"]]] },
  calendario: { titulo: "Calendario académico", descripcion: "Programación centralizada de clases, docentes, grupos y recursos.", metricas: [["Esta semana", "18", "Clases programadas"], ["Por confirmar", "2", "Docentes pendientes"], ["Conflictos", "1", "Requiere revisión"]], bloques: [["Validaciones", ["Disponibilidad docente", "Solapamiento de grupo", "Secuencia y material vigente"]], ["Vistas", ["Día", "Semana", "Mes"]]] },
  clases: { titulo: "Programación de clases", descripcion: "Gestiona el ciclo completo desde borrador hasta ejecución.", metricas: [["Programadas", "18", "Próximos 7 días"], ["Ejecutadas", "42", "Periodo actual"], ["Reprogramadas", "3", "Con motivo registrado"]], bloques: [["Estados", ["Borrador y aprobación", "Programada y confirmada", "Ejecutada o cancelada"]], ["Control", ["Doble asignación bloqueante", "Repetición determinística", "Auditoría de cambios"]]] },
  asistencia: { titulo: "Control de asistencia", descripcion: "Registra asistencia por clase con cierre, evidencia e historial.", metricas: [["Asistencia media", "91.4%", "Periodo actual"], ["Sin cerrar", "3", "Clases pendientes"], ["Sin registro", "7", "Estudiantes"]], bloques: [["Registro", ["Estado y minutos", "Observación y evidencia", "Historial de cambios"]], ["Indicadores", ["Faltas consecutivas", "Tardanzas", "Alertas de riesgo"]]] },
  retencion: { titulo: "CRM de retención académica", descripcion: "Gestiona estudiantes en riesgo, contactos y compromisos.", metricas: [["Riesgo alto", "3", "Atención inmediata"], ["En recuperación", "11", "Con responsable"], ["Recuperados", "18", "Periodo actual"]], bloques: [["Pipeline", ["Riesgo bajo", "Riesgo medio", "Riesgo alto", "En recuperación"]], ["Acciones", ["Próximo contacto", "Compromisos", "Recuperación o abandono"]]] },
  incidencias: { titulo: "Incidencias y tickets", descripcion: "Atención trazable con prioridad, asignación y SLA.", metricas: [["Abiertos", "12", "Todos los equipos"], ["Próximos a vencer", "3", "SLA menor a 4 h"], ["SLA vencido", "1", "Atención inmediata"]], bloques: [["Flujo", ["Clasificar y asignar", "Investigar y resolver", "Validar y cerrar"]], ["Calidad", ["Causa raíz", "Lección aprendida", "Satisfacción"]]] },
  documentos: { titulo: "Gestión documental", descripcion: "Controla versiones inmutables y materiales oficiales vigentes.", metricas: [["En revisión", "4", "Pendientes del responsable"], ["Por aprobar", "2", "Requieren decisión"], ["Obsoletos", "1", "Material reemplazado"]], bloques: [["Control", ["Nueva carga = nueva versión", "Aprobación y vigencia", "Hash e historial"]], ["Relaciones", ["Programa y módulo", "Clase", "Docente"]]] },
  evaluaciones: { titulo: "Evaluaciones", descripcion: "Administra instrumentos, rúbricas, intentos y calificaciones.", metricas: [["Activas", "8", "Periodo actual"], ["Por calificar", "27", "Intentos pendientes"], ["Aprobación", "87%", "Promedio general"]], bloques: [["Diseño", ["Tipos e instrumentos", "Preguntas y rúbricas", "Criterios de aprobación"]], ["Resultados", ["Intentos", "Calificaciones", "Retroalimentación"]]] },
  certificados: { titulo: "Certificados", descripcion: "Controla elegibilidad, emisión, validación pública y revocación.", metricas: [["Elegibles", "38", "Listos para emisión"], ["Emitidos", "122", "Periodo actual"], ["Revocados", "1", "Con motivo registrado"]], bloques: [["Elegibilidad", ["Asistencia mínima", "Nota mínima", "Programa finalizado"]], ["Trazabilidad", ["Código único y QR", "Historial", "Revocación"]]] },
  reportes: { titulo: "Reportes de formación", descripcion: "Indicadores académicos, operativos, docentes y de retención.", metricas: [["Asistencia", "91.4%", "Promedio general"], ["Cumplimiento", "94.2%", "Clases ejecutadas"], ["Abandono", "4.1%", "Periodo actual"]], bloques: [["Académico", ["Asistencia y progreso", "Aprobación y rendimiento", "Cumplimiento de malla"]], ["Operación", ["Clases y conflictos", "Carga docente", "Tickets y SLA"]]] },
  usuarios: { titulo: "Usuarios", descripcion: "Gestiona accesos, estado, roles y sesiones activas.", metricas: [["Activos", "27", "Con acceso vigente"], ["Bloqueados", "1", "Por intentos fallidos"], ["Sesiones", "14", "Activas ahora"]], bloques: [["Acceso", ["Alta y desactivación", "Recuperación de contraseña", "Sesiones activas"]], ["Control", ["Último acceso", "Intentos fallidos", "Auditoría"]]] },
  roles: { titulo: "Roles y permisos", descripcion: "Configura autorización granular sin depender del nombre del rol.", metricas: [["Roles", "7", "Configurados"], ["Permisos", "38", "Granulares"], ["Usuarios", "27", "Con asignación"]], bloques: [["Matriz RBAC", ["Recursos", "Acciones", "Alcance organizacional"]], ["Gobierno", ["Mínimo privilegio", "Revisión periódica", "Historial"]]] },
  auditoria: { titulo: "Auditoría", descripcion: "Consulta el registro inmutable de accesos y cambios críticos.", metricas: [["Eventos hoy", "184", "Todos los módulos"], ["Cambios críticos", "12", "Con motivo"], ["Accesos", "36", "Usuarios únicos"]], bloques: [["Trazabilidad", ["Actor y momento", "Valor anterior y nuevo", "Motivo y correlación"]], ["Cobertura", ["Programación", "Asistencia y riesgo", "Documentos y certificados"]]] },
  "reportes-generales": { titulo: "Reportes generales", descripcion: "Visión ejecutiva consolidada de selección, formación y administración.", metricas: [["Selección", "6", "Convocatorias activas"], ["Formación", "8", "Grupos activos"], ["Operación", "96.1%", "SLA cumplido"]], bloques: [["Consolidado", ["Personas", "Procesos", "Cumplimiento"]], ["Exportación", ["CSV y Excel", "Filtros ejecutivos", "Resumen directivo"]]] },
  configuracion: { titulo: "Configuración", descripcion: "Administra parámetros, reglas y proveedores de la plataforma.", metricas: [["Reglas activas", "24", "Configurables"], ["Plantillas", "16", "Notificaciones"], ["Proveedores", "4", "WhatsApp simulado"]], bloques: [["Seguridad", ["Política de sesiones", "Rate limiting", "Variables sensibles"]], ["Reglas", ["SLA y riesgo", "Carga docente", "Notificaciones"]]] },
};

type Fila = Record<string, unknown>;

export default function ModuloPage() {
  const params = useParams<{ ruta: string[] }>();
  const clave = params.ruta?.[0] ?? "programas";
  const catalogo = catalogos[clave];
  const vista = vistas[clave] ?? {
    titulo: "Módulo",
    descripcion: "Consulta y gestión de información oficial.",
    metricas: [],
    bloques: [],
  };
  const [filas, setFilas] = useState<Fila[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!catalogo || clave === "programas" || clave === "grupos" || clave === "estudiantes") return;
    api<Fila[]>(`/academico/${catalogo.endpoint}`).then(setFilas).catch((cause: unknown) => {
      setError(cause instanceof Error ? cause.message : "No fue posible cargar los registros");
    });
  }, [catalogo, clave]);

  const registros = useMemo(() => filas.map((fila) => {
    const nombre = `${fila.nombres ?? ""} ${fila.apellidos ?? ""}`.trim();
    return {
      codigo: String(fila.codigo ?? "—"),
      nombre: String(fila.nombre ?? (nombre || String(fila.codigo ?? "Registro"))),
      estado: String(fila.estado ?? "ACTIVO"),
    };
  }), [filas]);

  const titulo = catalogo?.titulo ?? vista.titulo;
  const descripcion = catalogo?.descripcion ?? vista.descripcion;
  const esDetalleCurso = (clave === "curso" || clave === "docente-curso") && Boolean(params.ruta?.[1]);

  return (
    <SaasShell>
      {clave === "cursos" || clave === "docente-cursos" ? <CourseManagement soloDocente={clave === "docente-cursos"} />
      : esDetalleCurso ? <CourseDetail cursoId={decodeURIComponent(params.ruta![1]!)} contexto={clave === "docente-curso" ? "docente" : "gestion"} />
      : clave === "docente-asistencia" ? <TeacherAttendance />
      : clave === "docente-materiales" ? <LmsBuilder />
      : clave === "docente-evaluaciones" ? <TeacherAssessments />
      : clave === "docente-agenda" ? <TeacherAgenda />
      : clave === "mis-cursos" ? <StudentLearningPath />
      : clave === "mi-calendario" ? <StudentCalendar />
      : clave === "mi-asistencia" ? <StudentAttendance />
      : clave === "mis-notas" ? <StudentGrades />
      : clave === "mis-certificados" ? <StudentCertificates />
      : clave === "mis-solicitudes" ? <StudentRequests />
      : clave === "programas" || clave === "grupos" || clave === "estudiantes" ? <AcademicCatalogManagement kind={clave} />
      : clave === "asistencia" ? <AttendanceControl />
      : clave === "seguimiento-ausencias" ? <AbsenceCRM mode="seguimiento" />
      : clave === "retencion" ? <RetentionResults />
      : clave === "calendario" ? <AcademicCalendar />
      : clave === "encuestas-nps" ? <NpsSurveys />
      : clave === "incidencias" ? <TicketCenter />
      : clave === "reportes" ? <ManagementReports />
      : clave === "usuarios" ? <AdminUsers />
      : clave === "docente" || clave === "estudiante" || clave === "gestion-estudiante" || clave === "administracion" ? <ModuleDashboard modulo={clave} />
      : <>
      <header className="page-header">
        <div><span className="page-kicker">Gestión operativa</span><h1>{titulo}</h1><p>{descripcion}</p></div>
      </header>

      <div className="feedback feedback-info">Entorno de demostración activo. WhatsApp permanece como cascarón y no realiza envíos.</div>

      {catalogo ? (
        <section className="panel table-panel">
          <div className="table-toolbar">
            <label className="search-control"><Search size={17} /><input aria-label={`Buscar en ${titulo}`} placeholder="Buscar por nombre o código" /></label>
            <div className="table-actions">
              <button className="btn btn-secondary"><Filter size={16} /> Filtros</button>
              <button className="icon-button" aria-label="Configurar columnas"><SlidersHorizontal size={17} /></button>
            </div>
          </div>
          {error ? <div className="feedback feedback-error" role="alert">{error}</div> : (
            <div className="table-scroll">
              <table className="data-table">
                <thead><tr><th>Código</th><th>Nombre</th><th>Estado</th><th className="align-right">Acciones</th></tr></thead>
                <tbody>
                  {registros.map((registro, index) => (
                    <tr key={`${registro.codigo}-${index}`}>
                      <td><span className="record-code">{registro.codigo}</span></td>
                      <td><strong>{registro.nombre}</strong></td>
                      <td><span className="status-badge success">{registro.estado}</span></td>
                      <td className="align-right"><button className="icon-button small" aria-label={`Acciones de ${registro.nombre}`}><MoreHorizontal size={17} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!error && registros.length === 0 && <div className="empty-state"><strong>No hay registros para mostrar</strong><p>Ajusta los filtros o crea el primer registro.</p></div>}
            </div>
          )}
        </section>
      ) : (
        <>
          <section className="metric-grid compact" aria-label={`Métricas de ${titulo}`}>
            {vista.metricas.map(([label, value, note]) => <article className="metric-card" key={label}><div className="metric-head"><span>{label}</span></div><strong>{value}</strong><small>{note}</small></article>)}
          </section>
          <section className="module-card-grid">
            {vista.bloques.map(([nombre, items]) => <article className="panel module-overview" key={nombre}><div className="panel-header"><div><h2>{nombre}</h2><p>Información y acciones relacionadas.</p></div></div><ul>{items.map((item) => <li key={item}><span />{item}</li>)}</ul></article>)}
          </section>
          {clave === "gestion-estudiante" && (
            <section className="panel table-panel priority-students">
              <div className="panel-header">
                <div><h2>Estudiantes que requieren contacto</h2><p>Ordenados por faltas recientes y nivel de riesgo.</p></div>
                <button className="text-action">Ver seguimiento completo</button>
              </div>
              <div className="table-scroll">
                <table className="data-table">
                  <thead><tr><th>Estudiante</th><th>Grupo</th><th>Última asistencia</th><th>Faltas</th><th>Prioridad</th><th>Contacto</th><th className="align-right">Acción</th></tr></thead>
                  <tbody>
                    <tr><td><strong>Mariana Torres</strong></td><td>GRP-04</td><td>Hace 8 días</td><td>3 consecutivas</td><td><span className="status-badge danger">Alta</span></td><td>Sin contactar</td><td className="align-right"><button className="row-action">Registrar contacto</button></td></tr>
                    <tr><td><strong>Luis Mendoza</strong></td><td>GRP-02</td><td>Hace 5 días</td><td>2 consecutivas</td><td><span className="status-badge warning">Media</span></td><td>Llamada pendiente</td><td className="align-right"><button className="row-action">Registrar contacto</button></td></tr>
                    <tr><td><strong>Andrea Salas</strong></td><td>GRP-07</td><td>Ayer</td><td>1 reciente</td><td><span className="status-badge info">Revisar</span></td><td>Correo enviado</td><td className="align-right"><button className="row-action">Actualizar</button></td></tr>
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}
      </>}
    </SaasShell>
  );
}
