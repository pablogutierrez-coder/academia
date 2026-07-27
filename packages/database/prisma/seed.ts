import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";

const prisma = new PrismaClient();
const permisos = [
  "usuarios.gestionar","roles.gestionar","programas.leer","programas.gestionar",
  "grupos.gestionar","docentes.gestionar","estudiantes.gestionar","clases.programar",
  "clases.aprobar","auditoria.leer","reportes.leer"
];

async function main() {
  const org = await prisma.organizacion.upsert({
    where:{codigo:"ELITE"}, update:{}, create:{codigo:"ELITE",nombre:"Elite Expert Academy"}
  });
  const permisoRows = await Promise.all(permisos.map(codigo => prisma.permiso.upsert({
    where:{codigo},update:{},create:{codigo,descripcion:codigo}
  })));
  const rol = await prisma.rol.upsert({where:{nombre:"Superadministrador"},update:{},create:{nombre:"Superadministrador"}});
  await prisma.rolPermiso.createMany({data:permisoRows.map(p=>({rolId:rol.id,permisoId:p.id})),skipDuplicates:true});
  const admin = await prisma.usuario.upsert({
    where:{organizacionId_correo:{organizacionId:org.id,correo:"admin@elite.test"}},
    update:{},create:{organizacionId:org.id,nombre:"Administración SIGA",correo:"admin@elite.test",passwordHash:await argon2.hash("SigaElite.Dev.2026!")}
  });
  await prisma.usuarioRol.upsert({where:{usuarioId_rolId:{usuarioId:admin.id,rolId:rol.id}},update:{},create:{usuarioId:admin.id,rolId:rol.id}});
  for (let i=1;i<=4;i++) await prisma.programa.upsert({
    where:{organizacionId_codigo:{organizacionId:org.id,codigo:`PROG-${i}`}},update:{},
    create:{organizacionId:org.id,codigo:`PROG-${i}`,nombre:["Gestión Empresarial","Marketing Digital","Analítica de Datos","Liderazgo"][i-1] ?? `Programa ${i}`}
  });
  const programas=await prisma.programa.findMany({where:{organizacionId:org.id}});
  for(let i=1;i<=8;i++) await prisma.grupo.upsert({
    where:{organizacionId_codigo:{organizacionId:org.id,codigo:`GRP-${String(i).padStart(2,"0")}`}},update:{},
    create:{organizacionId:org.id,programaId:programas[(i-1)%programas.length]!.id,codigo:`GRP-${String(i).padStart(2,"0")}`,fechaInicio:new Date("2026-07-01"),fechaFin:new Date("2026-12-20"),capacidad:30}
  });
  for(let i=1;i<=10;i++) await prisma.docente.upsert({
    where:{organizacionId_documento:{organizacionId:org.id,documento:`DOC${1000+i}`}},update:{},
    create:{organizacionId:org.id,documento:`DOC${1000+i}`,nombres:`Docente ${i}`,apellidos:"Demostración",correo:`docente${i}@elite.test`}
  });
  for(let i=1;i<=200;i++) await prisma.estudiante.upsert({
    where:{organizacionId_documento:{organizacionId:org.id,documento:`EST${String(i).padStart(5,"0")}`}},update:{},
    create:{organizacionId:org.id,documento:`EST${String(i).padStart(5,"0")}`,nombres:`Estudiante ${i}`,apellidos:"Ficticio",correo:`estudiante${i}@elite.test`}
  });
}
main().finally(()=>prisma.$disconnect());
