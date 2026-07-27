import { resolve } from "node:path";
import { config } from "dotenv";
import { applicationDefault, cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

config({path:[resolve(process.cwd(),".env"),resolve(process.cwd(),"../../.env")],quiet:true});

const projectId=process.env.FIREBASE_PROJECT_ID;
const organizationId=process.env.FIREBASE_DEFAULT_ORGANIZATION_ID;
if(!projectId) throw new Error("Falta FIREBASE_PROJECT_ID.");
if(!organizationId) throw new Error("Falta FIREBASE_DEFAULT_ORGANIZATION_ID.");

function credential(){
  const encoded=process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  const raw=process.env.FIREBASE_SERVICE_ACCOUNT_JSON??(encoded?Buffer.from(encoded,"base64").toString("utf8"):undefined);
  return raw?cert(JSON.parse(raw)):applicationDefault();
}

const app=getApps()[0]??initializeApp({projectId,credential:credential()});
const db=getFirestore(app);
db.settings({ignoreUndefinedProperties:true});
const organization=db.collection("organizations").doc(organizationId);

const schema={
  users:["nombre","usuario","usuarioNormalizado","correo","correoNormalizado","passwordHash","perfil","permisos","estado"],
  programs:["codigo","nombre","estado"],
  courses:["codigo","nombre","programaId","modalidad","estado"],
  groups:["codigo","cursoId","programaId","docenteId","capacidad","fechaInicio","fechaFin","horario","modalidad","estado"],
  teachers:["documento","nombres","apellidos","correo","estado"],
  students:["documento","nombres","apellidos","correo","telefono","estado"],
  enrollments:["estudianteId","grupoId","cursoId","estado","fechaIngreso"],
  classes:["grupoId","docenteId","titulo","inicio","fin","estado"],
  attendanceSessions:["cursoId","grupoId","claseId","fecha","programados","presentes","tardanzas","faltas","estado"],
  learningPaths:["cursoId","titulo","descripcion","estado","version","updatedAt"],
  grades:["estudianteId","cursoId","evaluacionId","nota","estado","publicada"],
  surveys:["nombre","tipo","cursoId","grupoId","docenteId","destinatarios","respuestas","nps","estado"],
  absenceCases:["estudianteId","cursoId","grupoId","faltas","ultimaFalta","prioridad","etapa","responsable","adjuntos"],
  retentionCases:["estudianteId","cursoId","grupoId","intervencion","responsable","resultado"],
  tickets:["asunto","descripcion","origen","reportanteId","categoria","prioridad","estado","responsable","createdAt"],
  certificates:["estudianteId","cursoId","estado","progreso"],
  requests:["estudianteId","tipo","asunto","estado","createdAt"],
  notifications:["usuarioId","titulo","detalle","tipo","leida","href","createdAt"],
  audit:["usuarioId","accion","entidad","entidadId","modulo","correlacion","createdAt"],
};

const result={projectId,organizationId,collections:{},warnings:[],errors:[]};
const organizationSnapshot=await organization.get();
for(const field of ["codigo","nombre","estado","zonaHoraria"]){
  if(!organizationSnapshot.exists||organizationSnapshot.get(field)===undefined) result.errors.push(`organizations/${organizationId}: falta ${field}`);
}

const documents={};
for(const [collection,fields] of Object.entries(schema)){
  const snapshot=await organization.collection(collection).get();
  result.collections[collection]=snapshot.size;
  documents[collection]=snapshot.docs;
  if(snapshot.empty){
    result.errors.push(`${collection}: colección vacía o inexistente`);
    continue;
  }
  for(const document of snapshot.docs){
    const data=document.data();
    const missing=fields.filter(field=>data[field]===undefined);
    if(missing.length) result.errors.push(`${collection}/${document.id}: faltan ${missing.join(", ")}`);
  }
}

const ids=(name)=>new Set((documents[name]??[]).map(document=>document.id));
const courses=ids("courses"),groups=ids("groups"),teachers=ids("teachers"),students=ids("students"),classes=ids("classes");
for(const document of documents.groups??[]){
  const data=document.data();
  if(!courses.has(data.cursoId)) result.errors.push(`groups/${document.id}: cursoId sin referencia`);
  if(!teachers.has(data.docenteId)) result.errors.push(`groups/${document.id}: docenteId sin referencia`);
}
for(const document of documents.enrollments??[]){
  const data=document.data();
  if(!courses.has(data.cursoId)) result.errors.push(`enrollments/${document.id}: cursoId sin referencia`);
  if(!groups.has(data.grupoId)) result.errors.push(`enrollments/${document.id}: grupoId sin referencia`);
  if(!students.has(data.estudianteId)) result.errors.push(`enrollments/${document.id}: estudianteId sin referencia`);
}
for(const document of documents.attendanceSessions??[]){
  const data=document.data();
  if(!classes.has(data.claseId)) result.errors.push(`attendanceSessions/${document.id}: claseId sin referencia`);
  const marks=await document.ref.collection("marks").get();
  if(marks.empty) result.warnings.push(`attendanceSessions/${document.id}: sin marcas individuales`);
}
for(const route of documents.learningPaths??[]){
  if(!courses.has(route.id)) result.errors.push(`learningPaths/${route.id}: curso inexistente`);
  const modules=await route.ref.collection("modules").get();
  if(modules.empty) result.errors.push(`learningPaths/${route.id}: sin módulos`);
  for(const module of modules.docs){
    const data=module.data();
    for(const field of ["titulo","descripcion","estado","orden"]){
      if(data[field]===undefined) result.errors.push(`learningPaths/${route.id}/modules/${module.id}: falta ${field}`);
    }
    const [elements,evaluations]=await Promise.all([
      module.ref.collection("elements").get(),
      module.ref.collection("evaluations").get(),
    ]);
    if(elements.empty&&evaluations.empty) result.warnings.push(`learningPaths/${route.id}/modules/${module.id}: sin elementos`);
    for(const element of elements.docs){
      const data=element.data();
      for(const field of ["tipo","titulo","contenidoTipo","contenido","orden","estado"]){
        if(data[field]===undefined) result.errors.push(`learningPaths/${route.id}/modules/${module.id}/elements/${element.id}: falta ${field}`);
      }
      if(data.storagePath&&!data.tipoMime) result.errors.push(`elements/${element.id}: recurso sin tipoMime`);
    }
    for(const evaluation of evaluations.docs){
      const questions=await evaluation.ref.collection("questions").get();
      if(questions.empty) result.warnings.push(`evaluations/${evaluation.id}: sin preguntas`);
    }
  }
}

const resources=await organization.collection("courseResources").get();
result.collections.courseResources=resources.size;
if(resources.empty) result.warnings.push("courseResources: aún no hay archivos cargados; la colección se crea con la primera carga a Storage");
for(const resource of resources.docs){
  const data=resource.data();
  for(const field of ["cursoId","nombreArchivo","tipoMime","tamanoBytes","storagePath","url","estado","uploadedBy","createdAt"]){
    if(data[field]===undefined) result.errors.push(`courseResources/${resource.id}: falta ${field}`);
  }
}

const system=await db.collection("_system").doc("siga").get();
if(!system.exists) result.errors.push("_system/siga: documento de control inexistente");
const roles=await db.collection("authorization").doc("catalog").collection("roles").get();
const permissions=await db.collection("authorization").doc("catalog").collection("permissions").get();
result.collections.roles=roles.size;
result.collections.permissions=permissions.size;
if(roles.size<4) result.errors.push("authorization/roles: se requieren los cuatro perfiles base");
if(permissions.empty) result.errors.push("authorization/permissions: catálogo vacío");

result.valid=result.errors.length===0;
process.stdout.write(`${JSON.stringify(result,null,2)}\n`);
if(!result.valid) process.exitCode=1;
