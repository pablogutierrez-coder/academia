import { resolve } from "node:path";
import argon2 from "argon2";
import { config } from "dotenv";
import { applicationDefault, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

config({path:[resolve(process.cwd(),".env"),resolve(process.cwd(),"../../.env")],quiet:true});
const execute=process.argv.includes("--execute");
const projectId=process.env.FIREBASE_PROJECT_ID;
const organizationId=process.env.FIREBASE_DEFAULT_ORGANIZATION_ID;
if(!projectId) throw new Error("Falta FIREBASE_PROJECT_ID.");
if(!organizationId) throw new Error("Falta FIREBASE_DEFAULT_ORGANIZATION_ID.");

const app=getApps()[0]??initializeApp({projectId,credential:applicationDefault()});
const db=getFirestore(app);
db.settings({ignoreUndefinedProperties:true});
const organization=db.collection("organizations").doc(organizationId);
const writes=[];
const add=(reference,data)=>writes.push({reference,data});
const orgDoc=(collection,id)=>organization.collection(collection).doc(id);

const ids={
  admin:"00000000-0000-4000-8000-000000000001",
  manager:"00000000-0000-4000-8000-000000000002",
  teacherOscar:"10000000-0000-4000-8000-000000000001",
  teacherClaudia:"10000000-0000-4000-8000-000000000002",
  teacherVictor:"10000000-0000-4000-8000-000000000003",
  teacherMariana:"10000000-0000-4000-8000-000000000004",
  studentMariana:"20000000-0000-4000-8000-000000000001",
  studentLuis:"20000000-0000-4000-8000-000000000002",
  studentAndrea:"20000000-0000-4000-8000-000000000003",
  studentCarlos:"20000000-0000-4000-8000-000000000004",
  studentRosa:"20000000-0000-4000-8000-000000000005",
  studentDiego:"20000000-0000-4000-8000-000000000006",
  studentValeria:"20000000-0000-4000-8000-000000000007",
  groupAnalytics:"30000000-0000-4000-8000-000000000003",
  groupMarketing:"30000000-0000-4000-8000-000000000005",
  groupManagement:"30000000-0000-4000-8000-000000000007",
  groupLeadership:"30000000-0000-4000-8000-000000000001",
};

const permissions=[
  "usuarios.gestionar","roles.gestionar","programas.leer","programas.gestionar",
  "grupos.gestionar","docentes.gestionar","estudiantes.gestionar","clases.programar",
  "clases.aprobar","auditoria.leer","reportes.leer","cursos.leer","asistencia.registrar",
  "asistencia.propia","notas.gestionar","notas.propias","lms.gestionar","encuestas.gestionar",
  "tickets.gestionar","solicitudes.crear","certificados.leer"
];

const roles=[
  {id:"ROLE-ADMIN",nombre:"Administrador",permisos:permissions},
  {id:"ROLE-GESTION",nombre:"Gestión al estudiante",permisos:["programas.leer","programas.gestionar","grupos.gestionar","estudiantes.gestionar","clases.programar","reportes.leer","encuestas.gestionar","tickets.gestionar"]},
  {id:"ROLE-DOCENTE",nombre:"Docente",permisos:["cursos.leer","asistencia.registrar","notas.gestionar","lms.gestionar","reportes.leer"]},
  {id:"ROLE-ESTUDIANTE",nombre:"Estudiante",permisos:["cursos.leer","asistencia.propia","notas.propias","solicitudes.crear","certificados.leer"]},
];

add(organization,{
  codigo:"ELITE",
  nombre:"Elite Expert Academy",
  estado:"ACTIVO",
  zonaHoraria:"America/Lima",
  createdAt:new Date(),
  updatedAt:new Date(),
});
add(db.collection("_system").doc("siga"),{projectId,organizationId,schemaVersion:1,initializedAt:new Date()});
for(const permission of permissions) add(db.collection("authorization").doc("catalog").collection("permissions").doc(permission),{codigo:permission,descripcion:permission,estado:"ACTIVO"});
for(const role of roles) add(db.collection("authorization").doc("catalog").collection("roles").doc(role.id),role);

const passwordHashes={
  admin:await argon2.hash("SigaElite.Dev.2026!"),
  manager:await argon2.hash("GestionElite.2026!"),
  teacher:await argon2.hash("DocenteElite.2026!"),
};

const users=[
  {id:ids.admin,nombre:"Administración SIGA",usuario:"administracion.siga",correo:"admin@elite.test",passwordHash:passwordHashes.admin,perfil:"Administrador",permisos:permissions},
  {id:ids.manager,nombre:"Lucía Ramos",usuario:"lucia.ramos",correo:"lucia.ramos@elite.test",passwordHash:passwordHashes.manager,perfil:"Gestión al estudiante",permisos:roles[1].permisos},
  {id:ids.teacherOscar,nombre:"Oscar Vildoso García",usuario:"oscar.vildoso",correo:"oscar.vildoso@elite.test",passwordHash:passwordHashes.teacher,perfil:"Docente",permisos:roles[2].permisos},
];

const students=[
  {id:ids.studentMariana,documento:"70399200",nombres:"Mariana",apellidos:"Torres López",correo:"mariana.torres@elite.test",telefono:"944810627"},
  {id:ids.studentLuis,documento:"71402854",nombres:"Luis",apellidos:"Mendoza Ruiz",correo:"luis.mendoza@elite.test",telefono:"945221804"},
  {id:ids.studentAndrea,documento:"72851643",nombres:"Andrea",apellidos:"Salas Vega",correo:"andrea.salas@elite.test",telefono:"978632405"},
  {id:ids.studentCarlos,documento:"74189632",nombres:"Carlos",apellidos:"Paredes Núñez",correo:"carlos.paredes@elite.test",telefono:"987541203"},
  {id:ids.studentRosa,documento:"75204168",nombres:"Rosa",apellidos:"Medina Castro",correo:"rosa.medina@elite.test",telefono:"944810627"},
  {id:ids.studentDiego,documento:"76321845",nombres:"Diego",apellidos:"Flores Silva",correo:"diego.flores@elite.test",telefono:"965102348"},
  {id:ids.studentValeria,documento:"77452031",nombres:"Valeria",apellidos:"Campos León",correo:"valeria.campos@elite.test",telefono:"976214530"},
];

for(const student of students){
  add(orgDoc("students",student.id),{...student,organizacionId:organizationId,estado:"ACTIVO",deletedAt:null,createdAt:new Date(),updatedAt:new Date()});
  const fullName=`${student.nombres} ${student.apellidos}`;
  const username=`${student.nombres}.${student.apellidos.split(" ")[0]}`.normalize("NFD").replace(/\p{Diacritic}/gu,"").toLowerCase();
  users.push({id:student.id,nombre:fullName,usuario:username,correo:student.correo,passwordHash:await argon2.hash(student.documento),perfil:"Estudiante",permisos:roles[3].permisos});
}
for(const user of users) add(orgDoc("users",user.id),{
  ...user,
  organizacionId:organizationId,
  usuarioNormalizado:user.usuario.toLowerCase(),
  correoNormalizado:user.correo.toLowerCase(),
  estado:"ACTIVO",
  intentosFallidos:0,
  createdAt:new Date(),
  updatedAt:new Date(),
  deletedAt:null,
});

const programs=[
  {id:"PRG-AD-2026",codigo:"PRG-AD-2026",nombre:"Analítica de Datos",descripcion:"Análisis, visualización y toma de decisiones."},
  {id:"PRG-MK-2026",codigo:"PRG-MK-2026",nombre:"Marketing Digital",descripcion:"Estrategia, audiencias, canales y métricas."},
  {id:"PRG-GE-2026",codigo:"PRG-GE-2026",nombre:"Gestión Empresarial",descripcion:"Fundamentos para la gestión de organizaciones."},
  {id:"PRG-LI-2026",codigo:"PRG-LI-2026",nombre:"Liderazgo",descripcion:"Liderazgo y gestión de equipos."},
];
for(const program of programs) add(orgDoc("programs",program.id),{...program,organizacionId:organizationId,estado:"ACTIVO",deletedAt:null,version:1,createdAt:new Date(),updatedAt:new Date()});

const teachers=[
  {id:ids.teacherOscar,documento:"DOC1001",nombres:"Oscar",apellidos:"Vildoso García",correo:"oscar.vildoso@elite.test"},
  {id:ids.teacherClaudia,documento:"DOC1002",nombres:"Claudia",apellidos:"Rivas Soto",correo:"claudia.rivas@elite.test"},
  {id:ids.teacherVictor,documento:"DOC1003",nombres:"Víctor",apellidos:"Lara Reynoso",correo:"victor.lara@elite.test"},
  {id:ids.teacherMariana,documento:"DOC1004",nombres:"Mariana",apellidos:"Costa Ruiz",correo:"mariana.costa@elite.test"},
];
for(const teacher of teachers) add(orgDoc("teachers",teacher.id),{...teacher,organizacionId:organizationId,horasMaximasSemana:20,estado:"ACTIVO",createdAt:new Date(),updatedAt:new Date()});

const courses=[
  {id:"CUR-AD-2026-03",programaId:"PRG-AD-2026",codigo:"CUR-AD-2026-03",nombre:"Analítica de datos aplicada",modalidad:"VIRTUAL",estado:"EN_CURSO",progreso:64},
  {id:"CUR-MK-2026-02",programaId:"PRG-MK-2026",codigo:"CUR-MK-2026-02",nombre:"Estrategias de marketing digital",modalidad:"VIRTUAL",estado:"ACTIVO",progreso:42},
  {id:"CUR-GE-2026-04",programaId:"PRG-GE-2026",codigo:"CUR-GE-2026-04",nombre:"Fundamentos de gestión empresarial",modalidad:"HIBRIDA",estado:"ACTIVO",progreso:28},
  {id:"CUR-LI-2026-01",programaId:"PRG-LI-2026",codigo:"CUR-LI-2026-01",nombre:"Liderazgo para equipos de alto rendimiento",modalidad:"PRESENCIAL",estado:"ACTIVO",progreso:51},
];
for(const course of courses) add(orgDoc("courses",course.id),{...course,organizacionId:organizationId,createdAt:new Date(),updatedAt:new Date(),deletedAt:null});

const groups=[
  {id:ids.groupAnalytics,codigo:"GRP-03",programaId:"PRG-AD-2026",cursoId:"CUR-AD-2026-03",docenteId:ids.teacherOscar,capacidad:30,fechaInicio:new Date("2026-07-06"),fechaFin:new Date("2026-08-28"),horario:"Lun. y mié. · 18:00",modalidad:"VIRTUAL"},
  {id:ids.groupMarketing,codigo:"GRP-05",programaId:"PRG-MK-2026",cursoId:"CUR-MK-2026-02",docenteId:ids.teacherClaudia,capacidad:30,fechaInicio:new Date("2026-07-13"),fechaFin:new Date("2026-09-04"),horario:"Mar. y jue. · 19:00",modalidad:"VIRTUAL"},
  {id:ids.groupManagement,codigo:"GRP-07",programaId:"PRG-GE-2026",cursoId:"CUR-GE-2026-04",docenteId:ids.teacherVictor,capacidad:30,fechaInicio:new Date("2026-07-20"),fechaFin:new Date("2026-09-18"),horario:"Sábados · 09:00",modalidad:"HIBRIDA"},
  {id:ids.groupLeadership,codigo:"GRP-01",programaId:"PRG-LI-2026",cursoId:"CUR-LI-2026-01",docenteId:ids.teacherMariana,capacidad:25,fechaInicio:new Date("2026-07-01"),fechaFin:new Date("2026-08-31"),horario:"Viernes · 18:00",modalidad:"PRESENCIAL"},
];
for(const group of groups) add(orgDoc("groups",group.id),{...group,organizacionId:organizationId,estado:"ACTIVO",createdAt:new Date(),updatedAt:new Date()});

const enrollments=[
  [ids.studentMariana,ids.groupAnalytics],[ids.studentMariana,ids.groupManagement],
  [ids.studentLuis,ids.groupAnalytics],[ids.studentLuis,ids.groupLeadership],
  [ids.studentAndrea,ids.groupAnalytics],[ids.studentCarlos,ids.groupAnalytics],
  [ids.studentRosa,ids.groupManagement],[ids.studentDiego,ids.groupMarketing],
  [ids.studentValeria,ids.groupMarketing],
];
for(const [studentId,groupId] of enrollments){
  const group=groups.find(item=>item.id===groupId);
  add(orgDoc("enrollments",`${groupId}_${studentId}`),{estudianteId:studentId,grupoId:groupId,cursoId:group.cursoId,estado:"ACTIVO",fechaIngreso:new Date()});
}

const classSeeds=[
  ["CL-201",ids.groupAnalytics,ids.teacherOscar,"2026-07-06T23:00:00Z","2026-07-07T00:30:00Z","Fundamentos y objetivos"],
  ["CL-202",ids.groupAnalytics,ids.teacherOscar,"2026-07-08T23:00:00Z","2026-07-09T00:30:00Z","Fuentes de información"],
  ["CL-204",ids.groupAnalytics,ids.teacherOscar,"2026-07-15T23:00:00Z","2026-07-16T00:30:00Z","Preparación de datos"],
  ["CL-206",ids.groupAnalytics,ids.teacherOscar,"2026-07-20T23:00:00Z","2026-07-21T00:30:00Z","Visualización de datos"],
  ["CL-209",ids.groupAnalytics,ids.teacherOscar,"2026-07-27T23:00:00Z","2026-07-28T00:30:00Z","Taller de dashboard"],
  ["CL-301",ids.groupMarketing,ids.teacherClaudia,"2026-07-28T00:00:00Z","2026-07-28T01:30:00Z","Estrategia de canales"],
  ["CL-401",ids.groupManagement,ids.teacherVictor,"2026-08-01T14:00:00Z","2026-08-01T16:00:00Z","Gestión y organización"],
];
for(const [id,grupoId,docenteId,inicio,fin,titulo] of classSeeds) add(orgDoc("classes",id),{organizacionId:organizationId,grupoId,docenteId,moduloCodigo:"MOD-01",temaCodigo:id,titulo,inicio:new Date(inicio),fin:new Date(fin),estado:new Date(inicio)<new Date()?"EJECUTADA":"PROGRAMADA",createdAt:new Date(),updatedAt:new Date()});

const attendance=[
  {id:"SES-0726-01",cursoId:"CUR-AD-2026-03",grupoId:ids.groupAnalytics,claseId:"CL-206",fecha:new Date("2026-07-26"),programados:24,presentes:20,tardanzas:1,faltas:3,estado:"CERRADA"},
  {id:"SES-0725-02",cursoId:"CUR-MK-2026-02",grupoId:ids.groupMarketing,claseId:"CL-301",fecha:new Date("2026-07-25"),programados:28,presentes:23,tardanzas:2,faltas:3,estado:"CERRADA"},
  {id:"SES-0724-01",cursoId:"CUR-AD-2026-03",grupoId:ids.groupAnalytics,claseId:"CL-204",fecha:new Date("2026-07-24"),programados:24,presentes:19,tardanzas:2,faltas:3,estado:"CERRADA"},
];
for(const session of attendance) add(orgDoc("attendanceSessions",session.id),session);
const marks=[
  [ids.studentMariana,"PRESENTE",0],[ids.studentLuis,"FALTA",0],[ids.studentAndrea,"TARDANZA",18],[ids.studentCarlos,"FALTA",0],
];
for(const [studentId,status,minutes] of marks) add(orgDoc("attendanceSessions","SES-0726-01").collection("marks").doc(studentId),{estudianteId:studentId,estado:status,minutosTardanza:minutes,registradoAt:new Date(),registradoPor:ids.teacherOscar});

for(const course of courses.slice(0,2)){
  const route=orgDoc("learningPaths",course.id);
  add(route,{cursoId:course.id,titulo:course.nombre,descripcion:"Ruta de aprendizaje progresiva del curso.",estado:"PUBLICADA_PARCIALMENTE",version:1,updatedAt:new Date()});
  add(route.collection("modules").doc("MOD-01"),{codigo:"MOD-01",titulo:"Módulo 1 · Fundamentos",descripcion:"Conceptos esenciales y contexto.",orden:1,estado:"PUBLICADO"});
  add(route.collection("modules").doc("MOD-02"),{codigo:"MOD-02",titulo:"Módulo 2 · Aplicación",descripcion:"Práctica guiada y evaluación.",orden:2,estado:"PUBLICADO"});
  add(route.collection("modules").doc("MOD-01").collection("elements").doc("STEP-01"),{tipo:"PASO",titulo:"1.1 Bienvenida y objetivos",contenidoTipo:"VIDEO",contenido:"Presentación del curso y resultados esperados.",tiempoMinutos:8,orden:1,estado:"PUBLICADO"});
  add(route.collection("modules").doc("MOD-01").collection("elements").doc("STEP-02"),{tipo:"PASO",titulo:"1.2 Lectura: conceptos base",contenidoTipo:"HTML",contenido:"Guía de conceptos esenciales del curso.",tiempoMinutos:15,orden:2,estado:"PUBLICADO"});
  add(route.collection("modules").doc("MOD-01").collection("elements").doc("FORUM-01"),{tipo:"FORO",titulo:"Foro de presentación",contenidoTipo:"TEXTO",tiempoMinutos:10,orden:3,estado:"ABIERTO"});
  const evaluation=route.collection("modules").doc("MOD-01").collection("evaluations").doc("EVAL-01");
  add(evaluation,{titulo:"Evaluación diagnóstica",instrucciones:"Responde todas las preguntas.",intentosPermitidos:2,puntajeMinimo:70,tiempoLimiteMinutos:20,obligatoria:true,bloqueaSiguiente:false,mostrarResultado:true,permitirRetroalimentacion:true,estado:"PUBLICADA"});
  add(evaluation.collection("questions").doc("Q-01"),{enunciado:"¿Cuál es el objetivo principal del curso?",tipo:"OPCION_UNICA",puntaje:5,alternativas:[{id:"A",texto:"Aplicar conceptos en situaciones reales",correcta:true},{id:"B",texto:"Memorizar definiciones",correcta:false}],explicacion:"La ruta prioriza la aplicación práctica.",orden:1});
}

const grades=[
  {id:"GRADE-001",estudianteId:ids.studentMariana,cursoId:"CUR-AD-2026-03",evaluacionId:"EVAL-01",nota:18,estado:"APROBADO",retroalimentacion:"Buen dominio de los fundamentos."},
  {id:"GRADE-002",estudianteId:ids.studentLuis,cursoId:"CUR-AD-2026-03",evaluacionId:"EVAL-01",nota:14,estado:"APROBADO",retroalimentacion:"Reforzar interpretación de resultados."},
  {id:"GRADE-003",estudianteId:ids.studentAndrea,cursoId:"CUR-AD-2026-03",evaluacionId:"EVAL-01",nota:17,estado:"APROBADO",retroalimentacion:"Buen análisis y argumentación."},
];
for(const grade of grades) add(orgDoc("grades",grade.id),{...grade,publicada:true,updatedAt:new Date()});

add(orgDoc("surveys","NPS-2026-004"),{nombre:"Experiencia de cierre · Analítica",tipo:"NPS",cursoId:"CUR-AD-2026-03",grupoId:ids.groupAnalytics,docenteId:ids.teacherOscar,enviadaAt:new Date("2026-07-24"),fechaLimite:new Date("2026-07-31"),destinatarios:24,respuestas:19,nps:58,estado:"ACTIVA",recordatorios:1,puntuaciones:{curso:9.1,materiales:8.6,docente:9.4}});
add(orgDoc("surveys","NPS-2026-001"),{nombre:"Encuesta de bienvenida · Analítica",tipo:"NPS",cursoId:"CUR-AD-2026-03",grupoId:ids.groupAnalytics,docenteId:ids.teacherOscar,enviadaAt:new Date("2026-07-05"),fechaLimite:new Date("2026-07-12"),destinatarios:18,respuestas:14,nps:43,estado:"CERRADA",recordatorios:1,puntuaciones:{curso:8.5,materiales:8.1,docente:8.9}});

const absenceCases=[
  {id:"CAS-001",estudianteId:ids.studentCarlos,cursoId:"CUR-AD-2026-03",grupoId:ids.groupAnalytics,faltas:5,consecutivas:3,ultimaFalta:new Date("2026-07-25"),prioridad:"CRITICA",etapa:"PENDIENTE",responsable:"Elena Campos",proximaAccion:"Primer contacto prioritario"},
  {id:"CAS-002",estudianteId:ids.studentLuis,cursoId:"CUR-AD-2026-03",grupoId:ids.groupAnalytics,faltas:4,consecutivas:2,ultimaFalta:new Date("2026-07-24"),prioridad:"ALTA",etapa:"CON_COMPROMISO",responsable:"María Costa",proximaAccion:"Verificar compromiso de asistencia"},
  {id:"CAS-003",estudianteId:ids.studentRosa,cursoId:"CUR-GE-2026-04",grupoId:ids.groupManagement,faltas:4,consecutivas:2,ultimaFalta:new Date("2026-07-22"),prioridad:"ALTA",etapa:"CON_COMPROMISO",responsable:"María Costa",proximaAccion:"Seguimiento telefónico"},
];
for(const item of absenceCases) add(orgDoc("absenceCases",item.id),{...item,canal:"LLAMADA",notas:"Caso inicializado para seguimiento.",adjuntos:[],updatedAt:new Date()});
add(orgDoc("retentionCases","RET-021"),{estudianteId:ids.studentRosa,cursoId:"CUR-GE-2026-04",grupoId:ids.groupManagement,riesgo:"3 faltas acumuladas",intervencion:"Tutoría y reprogramación",responsable:"Elena Campos",fechaReingreso:new Date("2026-07-15"),asistenciaPosterior:80,sesionesPosteriores:5,resultado:"RETENIDO",evidencia:"Acta de tutoría"});

const tickets=[
  {id:"INC-2026-0142",asunto:"No puedo registrar asistencia de la sesión 4",descripcion:"La sesión aparece bloqueada dentro del horario permitido.",origen:"DOCENTE",reportanteId:ids.teacherOscar,cursoId:"CUR-AD-2026-03",categoria:"ASISTENCIA",prioridad:"ALTA",estado:"NUEVO",responsable:"Mesa académica",slaMinutos:120},
  {id:"INC-2026-0141",asunto:"Nota de evaluación no actualizada",descripcion:"La evaluación aún figura como pendiente.",origen:"ESTUDIANTE",reportanteId:ids.studentMariana,cursoId:"CUR-AD-2026-03",categoria:"NOTAS",prioridad:"MEDIA",estado:"EN_PROCESO",responsable:"Elena Campos",slaMinutos:480},
];
for(const ticket of tickets) add(orgDoc("tickets",ticket.id),{...ticket,createdAt:new Date(),updatedAt:new Date()});

add(orgDoc("certificates","CERT-001"),{estudianteId:ids.studentMariana,cursoId:"CUR-AD-2026-03",estado:"EN_PROGRESO",progreso:72,fechaEmision:null,codigoVerificacion:null});
add(orgDoc("requests","SOL-001"),{estudianteId:ids.studentMariana,tipo:"JUSTIFICACION_FALTA",asunto:"Justificación de inasistencia",estado:"PENDIENTE",createdAt:new Date(),updatedAt:new Date()});
add(orgDoc("notifications","NOT-001"),{usuarioId:ids.admin,titulo:"Firebase inicializado",detalle:"La persistencia de SIGA está lista.",tipo:"INFORMATIVA",leida:false,href:"/admin-dashboard",createdAt:new Date()});
add(orgDoc("audit","AUD-SEED-001"),{usuarioId:ids.admin,accion:"INICIALIZAR",entidad:"Firebase",entidadId:organizationId,modulo:"administracion",correlacion:"seed-firestore-v1",nuevo:{schemaVersion:1},createdAt:new Date()});

const summary={
  mode:execute?"execute":"dry-run",
  projectId,
  organizationId,
  documents:writes.length,
  users:users.length,
  programs:programs.length,
  courses:courses.length,
  groups:groups.length,
  teachers:teachers.length,
  students:students.length,
  enrollments:enrollments.length,
  classes:classSeeds.length,
};
process.stdout.write(`${JSON.stringify(summary,null,2)}\n`);
if(!execute){
  process.stdout.write("No se escribió ningún documento. Ejecuta pnpm firebase:seed para confirmar.\n");
  process.exit(0);
}
for(let offset=0;offset<writes.length;offset+=400){
  const batch=db.batch();
  for(const write of writes.slice(offset,offset+400)) batch.set(write.reference,write.data,{merge:true});
  await batch.commit();
}
process.stdout.write(`Inicialización completada: ${writes.length} documentos escritos o actualizados.\n`);
