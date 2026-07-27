"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  ArrowRight,
  Bell,
  CheckCheck,
  ChevronRight,
  Clock3,
  GraduationCap,
  HeartHandshake,
  LifeBuoy,
  Menu,
  MessageCircleQuestion,
  Presentation,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";

type Perfil = "ADMINISTRADOR" | "DOCENTE" | "ESTUDIANTE" | "GESTION_ESTUDIANTE";
type Opcion = { label: string; href: string };
type Area = {
  id: "docente" | "estudiante" | "gestion" | "administracion";
  label: string;
  shortLabel: string;
  description: string;
  icon: LucideIcon;
  perfiles: Perfil[];
  opciones: Opcion[];
};

const areas: Area[] = [
  {
    id: "docente",
    label: "Docente",
    shortLabel: "Docente",
    description: "Grupos, cursos y actividad docente",
    icon: Presentation,
    perfiles: ["ADMINISTRADOR", "DOCENTE"],
    opciones: [
      { label: "Dashboard docente", href: "/docente" },
      { label: "Mis cursos", href: "/docente-cursos" },
      { label: "Ruta de aprendizaje", href: "/docente-materiales" },
      { label: "Asistencia", href: "/docente-asistencia" },
      { label: "Evaluaciones y notas", href: "/docente-evaluaciones" },
      { label: "Mi agenda", href: "/docente-agenda" },
    ],
  },
  {
    id: "estudiante",
    label: "Estudiante",
    shortLabel: "Estudiante",
    description: "Aprendizaje, progreso y resultados",
    icon: GraduationCap,
    perfiles: ["ADMINISTRADOR", "ESTUDIANTE"],
    opciones: [
      { label: "Mi dashboard", href: "/estudiante" },
      { label: "Mis cursos", href: "/mis-cursos" },
      { label: "Mi calendario", href: "/mi-calendario" },
      { label: "Mis asistencias", href: "/mi-asistencia" },
      { label: "Mis notas", href: "/mis-notas" },
      { label: "Certificados", href: "/mis-certificados" },
      { label: "Mis solicitudes", href: "/mis-solicitudes" },
    ],
  },
  {
    id: "gestion",
    label: "Gestión al estudiante",
    shortLabel: "Gestión",
    description: "Operación académica y seguimiento prioritario",
    icon: HeartHandshake,
    perfiles: ["ADMINISTRADOR", "GESTION_ESTUDIANTE"],
    opciones: [
      { label: "Dashboard de gestión", href: "/gestion-estudiante" },
      { label: "Cursos", href: "/cursos" },
      { label: "Programas", href: "/programas" },
      { label: "Grupos", href: "/grupos" },
      { label: "Estudiantes", href: "/estudiantes" },
      { label: "Control de asistencia", href: "/asistencia" },
      { label: "Seguimiento de faltas", href: "/seguimiento-ausencias" },
      { label: "Retención", href: "/retencion" },
      { label: "Calendario académico", href: "/calendario" },
      { label: "Encuestas NPS", href: "/encuestas-nps" },
      { label: "Incidencias", href: "/incidencias" },
      { label: "Reportes de gestión", href: "/reportes" },
    ],
  },
  {
    id: "administracion",
    label: "Administración",
    shortLabel: "Admin.",
    description: "Usuarios, permisos y gobierno del sistema",
    icon: ShieldCheck,
    perfiles: ["ADMINISTRADOR"],
    opciones: [
      { label: "Dashboard administrador", href: "/administracion" },
      { label: "Usuarios", href: "/usuarios" },
      { label: "Roles y permisos", href: "/roles" },
      { label: "Auditoría", href: "/auditoria" },
      { label: "Reportes generales", href: "/reportes-generales" },
      { label: "Configuración", href: "/configuracion" },
    ],
  },
];

const rutasDocente = new Set(["docente", "docente-curso", "docente-cursos", "docente-materiales", "docente-asistencia", "docente-evaluaciones", "docente-agenda"]);
const rutasEstudiante = new Set(["estudiante", "mis-cursos", "mi-calendario", "mi-asistencia", "mis-notas", "mis-certificados", "mis-solicitudes"]);
const rutasAdministracion = new Set(["administracion", "usuarios", "roles", "auditoria", "reportes-generales", "configuracion"]);

const notificacionesIniciales = [
  { id: 1, titulo: "Clase por confirmar", detalle: "Analítica de datos · hoy 18:00", tiempo: "Hace 10 min", href: "/docente-agenda", tipo: "warning" },
  { id: 2, titulo: "Seguimiento prioritario", detalle: "3 estudiantes acumulan faltas recientes", tiempo: "Hace 35 min", href: "/seguimiento-ausencias", tipo: "danger" },
  { id: 3, titulo: "Evaluación pendiente", detalle: "La evaluación final está lista para publicar", tiempo: "Hace 2 h", href: "/docente-evaluaciones", tipo: "info" },
  { id: 4, titulo: "Nuevo ticket recibido", detalle: "Incidencia reportada por un estudiante", tiempo: "Ayer", href: "/incidencias", tipo: "success" },
] as const;

function resolverArea(pathname: string) {
  const segmento = pathname.split("/").filter(Boolean)[0] ?? "dashboard";
  if (rutasDocente.has(segmento)) return "docente";
  if (rutasEstudiante.has(segmento)) return "estudiante";
  if (rutasAdministracion.has(segmento)) return "administracion";
  return "gestion";
}

export function SaasShell({
  children,
  perfil = "ADMINISTRADOR",
}: {
  children: ReactNode;
  perfil?: Perfil;
}) {
  const pathname = usePathname();
  const [busquedaAbierta, setBusquedaAbierta] = useState(false);
  const [consulta, setConsulta] = useState("");
  const [notificacionesAbiertas, setNotificacionesAbiertas] = useState(false);
  const [notificacionesLeidas, setNotificacionesLeidas] = useState<number[]>([]);
  const [ayudaAbierta, setAyudaAbierta] = useState(false);
  const [temaAyuda, setTemaAyuda] = useState("Navegación y módulos");
  const [perfilActivo, setPerfilActivo] = useState<Perfil>(perfil);
  const [modulosActivos, setModulosActivos] = useState<string[]>([]);
  const areaActivaId = resolverArea(pathname);
  const areasVisibles = areas.filter((area) => area.perfiles.includes(perfilActivo) && (modulosActivos.length===0 || modulosActivos.includes(area.label)));
  const areaActiva = areasVisibles.find((area) => area.id === areaActivaId) ?? areasVisibles[0]!;
  const opcionActiva = areaActiva.opciones.find((opcion) => opcion.href === pathname);
  const fecha = new Intl.DateTimeFormat("es-PE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());
  const destinosBusqueda = useMemo(
    () => areasVisibles.flatMap((area) => area.opciones.map((opcion) => ({ ...opcion, area: area.label, description: area.description, Icon: area.icon }))),
    [areasVisibles],
  );
  const resultadosBusqueda = consulta.trim()
    ? destinosBusqueda.filter((destino) => `${destino.label} ${destino.area} ${destino.description}`.toLocaleLowerCase("es").includes(consulta.trim().toLocaleLowerCase("es")))
    : destinosBusqueda.slice(0, 8);
  const pendientes = notificacionesIniciales.filter((item) => !notificacionesLeidas.includes(item.id)).length;

  useEffect(() => {
    const storedProfile=localStorage.getItem("siga_perfil");
    const profileMap:Record<string,Perfil>={"Administrador":"ADMINISTRADOR","Docente":"DOCENTE","Estudiante":"ESTUDIANTE","Gestión al estudiante":"GESTION_ESTUDIANTE"};
    if(storedProfile&&profileMap[storedProfile])setPerfilActivo(profileMap[storedProfile]);
    try{setModulosActivos(JSON.parse(localStorage.getItem("siga_modulos")??"[]") as string[]);}catch{setModulosActivos([]);}
  },[]);

  useEffect(() => {
    setBusquedaAbierta(false);
    setNotificacionesAbiertas(false);
    setAyudaAbierta(false);
  }, [pathname]);

  useEffect(() => {
    function cerrarConEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setBusquedaAbierta(false);
        setNotificacionesAbiertas(false);
        setAyudaAbierta(false);
      }
    }
    window.addEventListener("keydown", cerrarConEscape);
    return () => window.removeEventListener("keydown", cerrarConEscape);
  }, []);

  return (
    <div className="saas-shell">
      <input className="nav-toggle" id="nav-toggle" type="checkbox" aria-label="Mostrar navegación" />
      <label className="mobile-trigger" htmlFor="nav-toggle">
        <Menu size={20} aria-hidden="true" />
        <span>Menú</span>
      </label>
      <label className="mobile-scrim" htmlFor="nav-toggle" aria-label="Cerrar navegación" />

      <aside className="module-rail" aria-label="Módulos principales">
        <nav className="module-nav">
          {areasVisibles.map((area) => {
            const Icon = area.icon;
            return (
              <Link
                className={`module-link ${area.id === areaActiva.id ? "is-active" : ""}`}
                href={area.opciones[0]!.href}
                key={area.id}
                aria-current={area.id === areaActiva.id ? "page" : undefined}
              >
                <Icon size={21} aria-hidden="true" />
                <span>{area.shortLabel}</span>
              </Link>
            );
          })}
        </nav>
        <Link className="module-link rail-settings" href="/configuracion" aria-label="Configuración">
          <Settings size={20} aria-hidden="true" />
          <span>Ajustes</span>
        </Link>
      </aside>

      <aside className="context-sidebar" aria-label={`Funciones de ${areaActiva.label}`}>
        <div className="context-mobile-head">
          <span>Elite Expert Academy</span>
          <label htmlFor="nav-toggle" aria-label="Cerrar navegación"><X size={20} /></label>
        </div>
        <Link className="institution-brand" href="/gestion-estudiante" aria-label="Ir al inicio de Elite Expert Academy">
          <span className="institution-logo">
            <Image src="/branding/logo-elite-expert-academy.png" alt="Elite Expert Academy" width={58} height={58} priority />
          </span>
          <span className="institution-copy">
            <strong>Elite Expert Academy</strong>
            <small>Sistema Integral de Gestión Académica</small>
          </span>
        </Link>
        <header className="context-head">
          <span className="context-kicker">Módulo</span>
          <h2>{areaActiva.label}</h2>
          <p>{areaActiva.description}</p>
        </header>
        <nav className="context-nav">
          {areaActiva.opciones.map((opcion) => (
            <Link
              className={pathname === opcion.href ? "is-active" : ""}
              href={opcion.href}
              key={opcion.href}
              aria-current={pathname === opcion.href ? "page" : undefined}
            >
              <span>{opcion.label}</span>
              {pathname === opcion.href && <ChevronRight size={15} aria-hidden="true" />}
            </Link>
          ))}
        </nav>
        <div className="context-footer">
          <span className="environment-dot" />
          <div><strong>Entorno de demostración</strong><small>Datos no persistentes</small></div>
          <Link className="logout-link" href="/login">Salir</Link>
        </div>
      </aside>

      <div className="workspace">
        <header className="app-header">
          <div className="breadcrumb">
            <span>{areaActiva.label}</span>
            <ChevronRight size={14} aria-hidden="true" />
            <strong>{opcionActiva?.label ?? "Vista general"}</strong>
          </div>
          <div className="header-tools">
            <span className="context-date">{fecha}</span>
            <button
              className="icon-button"
              aria-label="Buscar en la plataforma"
              aria-expanded={busquedaAbierta}
              onClick={() => {
                setBusquedaAbierta(true);
                setNotificacionesAbiertas(false);
              }}
            >
              <Search size={18} />
            </button>
            <div className="notification-control">
              <button
                className={`icon-button ${pendientes > 0 ? "has-indicator" : ""}`}
                aria-label={`Notificaciones${pendientes ? `, ${pendientes} sin leer` : ""}`}
                aria-expanded={notificacionesAbiertas}
                onClick={() => {
                  setNotificacionesAbiertas((actual) => !actual);
                  setBusquedaAbierta(false);
                }}
              >
                <Bell size={18} />
                {pendientes > 0 && <span className="notification-count">{pendientes}</span>}
              </button>
              {notificacionesAbiertas && (
                <section className="notification-popover" aria-label="Centro de notificaciones">
                  <header>
                    <div><strong>Notificaciones</strong><span>{pendientes} sin leer</span></div>
                    <button
                      type="button"
                      onClick={() => setNotificacionesLeidas(notificacionesIniciales.map((item) => item.id))}
                      disabled={pendientes === 0}
                    >
                      <CheckCheck size={15} /> Marcar leídas
                    </button>
                  </header>
                  <div className="notification-list">
                    {notificacionesIniciales.map((item) => {
                      const leida = notificacionesLeidas.includes(item.id);
                      return (
                        <Link
                          className={`notification-item ${leida ? "is-read" : ""}`}
                          href={item.href}
                          key={item.id}
                          onClick={() => setNotificacionesLeidas((actual) => actual.includes(item.id) ? actual : [...actual, item.id])}
                        >
                          <span className={`notification-symbol ${item.tipo}`}><Bell size={14} /></span>
                          <span><strong>{item.titulo}</strong><small>{item.detalle}</small><em><Clock3 size={11} />{item.tiempo}</em></span>
                          {!leida && <i aria-label="Sin leer" />}
                        </Link>
                      );
                    })}
                  </div>
                  <Link className="notification-footer" href="/incidencias">Abrir centro de incidencias <ArrowRight size={14} /></Link>
                </section>
              )}
            </div>
            <Link className="user-control" href="/login" aria-label="Salir e ir al inicio de sesión">
              <span className="avatar"><UserRound size={17} /></span>
              <span><strong>Administración SIGA</strong><small>Salir · Administrador</small></span>
            </Link>
          </div>
        </header>
        <main className="main-content">{children}</main>
      </div>

      <button
        className="help-launcher"
        type="button"
        aria-label="Abrir centro de ayuda"
        aria-expanded={ayudaAbierta}
        onClick={() => {
          setAyudaAbierta(true);
          setNotificacionesAbiertas(false);
          setBusquedaAbierta(false);
        }}
      >
        <LifeBuoy size={20} />
        <span>Ayuda</span>
      </button>

      {busquedaAbierta && (
        <div className="utility-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setBusquedaAbierta(false)}>
          <section className="global-search-dialog" role="dialog" aria-modal="true" aria-labelledby="global-search-title">
            <header>
              <div><span className="page-kicker">Navegación global</span><h2 id="global-search-title">¿Qué deseas encontrar?</h2></div>
              <button className="icon-button" onClick={() => setBusquedaAbierta(false)} aria-label="Cerrar búsqueda"><X size={18} /></button>
            </header>
            <label className="global-search-input">
              <Search size={20} />
              <input autoFocus value={consulta} onChange={(event) => setConsulta(event.target.value)} placeholder="Buscar cursos, asistencia, usuarios, reportes..." />
              <kbd>ESC</kbd>
            </label>
            <div className="global-search-results">
              <small>{consulta ? `${resultadosBusqueda.length} resultados` : "Accesos sugeridos"}</small>
              {resultadosBusqueda.map((destino) => {
                const Icon = destino.Icon;
                return (
                  <Link href={destino.href} key={`${destino.area}-${destino.href}`}>
                    <span><Icon size={18} /></span>
                    <div><strong>{destino.label}</strong><small>{destino.area}</small></div>
                    <ArrowRight size={16} />
                  </Link>
                );
              })}
              {resultadosBusqueda.length === 0 && <div className="search-empty"><Search size={25} /><strong>No encontramos esa pantalla</strong><span>Prueba con “asistencia”, “curso”, “usuarios” o “reportes”.</span></div>}
            </div>
          </section>
        </div>
      )}

      {ayudaAbierta && (
        <div className="utility-backdrop help-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setAyudaAbierta(false)}>
          <section className="help-dialog" role="dialog" aria-modal="true" aria-labelledby="help-title">
            <header>
              <span className="help-icon"><MessageCircleQuestion size={22} /></span>
              <div><span className="page-kicker">Centro de ayuda</span><h2 id="help-title">¿Cómo podemos ayudarte?</h2><p>Consulta orientaciones rápidas sobre el uso de la plataforma.</p></div>
              <button className="icon-button" onClick={() => setAyudaAbierta(false)} aria-label="Cerrar ayuda"><X size={18} /></button>
            </header>
            <div className="help-topics">
              {["Navegación y módulos", "Cursos y estudiantes", "Asistencia y seguimiento", "Usuarios y permisos"].map((tema) => (
                <button className={temaAyuda === tema ? "is-active" : ""} type="button" onClick={() => setTemaAyuda(tema)} key={tema}>{tema}</button>
              ))}
            </div>
            <article className="help-answer">
              <Sparkles size={18} />
              <div><strong>{temaAyuda}</strong><p>{temaAyuda === "Navegación y módulos" ? "Usa la barra lateral para cambiar de módulo. Las opciones internas se actualizan según tu perfil y el área seleccionada." : temaAyuda === "Cursos y estudiantes" ? "Gestiona cursos, grupos, docentes y matrículas desde Gestión al estudiante. Cada registro conserva su detalle y trazabilidad." : temaAyuda === "Asistencia y seguimiento" ? "Consulta las asistencias por fecha y curso. Los casos con faltas aparecen priorizados para facilitar el seguimiento." : "Los administradores pueden crear usuarios, asignar perfiles y definir el acceso permitido a cada módulo."}</p></div>
            </article>
            <div className="future-assistant">
              <div><span><Sparkles size={16} /> Asistente inteligente</span><small>Interfaz preparada para conectar IA posteriormente.</small></div>
              <label><input disabled placeholder="Escribe aquí tu consulta..." aria-label="Consulta para el futuro asistente de IA" /><button disabled type="button" aria-label="Enviar consulta, próximamente"><Send size={17} /></button></label>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
