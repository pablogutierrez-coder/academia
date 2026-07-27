# Flujos prioritarios

1. Programar clase: datos → validaciones → borrador → aprobación → notificación → auditoría.
2. Asistencia: cargar roster → registrar → validar faltantes → cerrar → indicadores → reglas de riesgo.
3. Riesgo: ejecutar reglas → puntuar → crear caso → asignar → contactar → recuperar o abandonar.
4. Incidencia: registrar → SLA → asignar → resolver → validar → cerrar.
5. Documento: versionar → revisar → aprobar → publicar → obsoletar anterior.

Los comandos son idempotentes cuando corresponde y los eventos posteriores a la transacción se envían mediante cola.
