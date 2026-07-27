export type EstadoClase =
  | "BORRADOR" | "PENDIENTE_APROBACION" | "PROGRAMADA" | "CONFIRMADA"
  | "EN_EJECUCION" | "EJECUTADA" | "REPROGRAMADA" | "CANCELADA" | "OBSERVADA";

export interface MetricasDashboard {
  programasActivos: number;
  gruposActivos: number;
  estudiantesActivos: number;
  docentesActivos: number;
  clasesProgramadas: number;
  clasesEjecutadas: number;
}
