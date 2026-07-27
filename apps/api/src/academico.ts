import { BadRequestException, Body, ConflictException, Controller, Get, Injectable, Post, Req, UseGuards } from "@nestjs/common";
import { IsDateString, IsNotEmpty, IsString, IsUUID } from "class-validator";
import type { Prisma } from "@prisma/client";
import { AuthGuard, Permisos, PermissionsGuard } from "./auth";
import { FirebaseService } from "./firebase.service";
import { getDataProvider } from "./data-provider";
import { PrismaService } from "./prisma.service";

type RequestUser={user:{sub:string;organizacionId:string;permisos:string[]}};
class ProgramaDto { @IsString() @IsNotEmpty() codigo!:string; @IsString() @IsNotEmpty() nombre!:string; }
class ClaseDto {
  @IsUUID() grupoId!:string;
  @IsUUID() docenteId!:string;
  @IsString() moduloCodigo!:string;
  @IsString() temaCodigo!:string;
  @IsString() titulo!:string;
  @IsDateString() inicio!:string;
  @IsDateString() fin!:string;
}

@Injectable()
export class AcademicoService {
  constructor(private db:PrismaService,private firebase:FirebaseService){}

  dashboard(org:string){
    if(getDataProvider()==="mock") return Promise.resolve({programasActivos:4,gruposActivos:8,estudiantesActivos:200,docentesActivos:10,clasesProgramadas:18,clasesEjecutadas:42});
    if(getDataProvider()==="firebase") return this.firebase.dashboard(org);
    return this.db.$transaction(async (tx:Prisma.TransactionClient)=>({
      programasActivos:await tx.programa.count({where:{organizacionId:org,estado:"ACTIVO"}}),
      gruposActivos:await tx.grupo.count({where:{organizacionId:org,estado:"ACTIVO"}}),
      estudiantesActivos:await tx.estudiante.count({where:{organizacionId:org,estado:"ACTIVO"}}),
      docentesActivos:await tx.docente.count({where:{organizacionId:org,estado:"ACTIVO"}}),
      clasesProgramadas:await tx.clase.count({where:{grupo:{organizacionId:org},estado:{in:["PROGRAMADA","CONFIRMADA"]}}}),
      clasesEjecutadas:await tx.clase.count({where:{grupo:{organizacionId:org},estado:"EJECUTADA"}})
    }));
  }

  async crearClase(org:string,actor:string,dto:ClaseDto){
    const inicio=new Date(dto.inicio),fin=new Date(dto.fin);
    if(inicio>=fin) throw new BadRequestException("La hora de fin debe ser posterior al inicio");
    if(getDataProvider()==="firebase") return this.firebase.createClass(org,actor,dto);
    const grupo=await this.db.grupo.findFirst({where:{id:dto.grupoId,organizacionId:org}});
    const docente=await this.db.docente.findFirst({where:{id:dto.docenteId,organizacionId:org}});
    if(!grupo||!docente) throw new BadRequestException("Grupo o docente inválido");
    const solape=await this.db.clase.findFirst({where:{estado:{notIn:["CANCELADA","REPROGRAMADA"]},inicio:{lt:fin},fin:{gt:inicio},OR:[{docenteId:dto.docenteId},{grupoId:dto.grupoId}]}});
    if(solape) throw new ConflictException("Existe doble asignación del docente o del grupo");
    const repetida=await this.db.clase.findFirst({where:{grupoId:dto.grupoId,moduloCodigo:dto.moduloCodigo,temaCodigo:dto.temaCodigo,estado:{in:["PROGRAMADA","CONFIRMADA","EJECUTADA"]}}});
    return this.db.$transaction(async (tx:Prisma.TransactionClient)=>{
      const clase=await tx.clase.create({data:{...dto,inicio,fin,estado:"BORRADOR"}});
      await tx.historialClase.create({data:{claseId:clase.id,accion:"CREADA",nuevo:clase,actorId:actor}});
      await tx.auditoria.create({data:{usuarioId:actor,accion:"CREAR",entidad:"Clase",entidadId:clase.id,nuevo:clase,modulo:"programacion",correlacion:crypto.randomUUID()}});
      return {clase,advertencias:repetida?["Posible clase repetida: mismo grupo, módulo y tema"]:[]};
    });
  }
}

@Controller("academico")
@UseGuards(AuthGuard,PermissionsGuard)
export class AcademicoController {
  constructor(private service:AcademicoService,private db:PrismaService,private firebase:FirebaseService){}

  @Get("dashboard")
  @Permisos("reportes.leer")
  dashboard(@Req() req:RequestUser){return this.service.dashboard(req.user.organizacionId);}

  @Get("programas")
  @Permisos("programas.leer")
  programas(@Req() req:RequestUser){
    if(getDataProvider()==="mock") return [{id:"1",codigo:"PROG-1",nombre:"Gestión Empresarial"},{id:"2",codigo:"PROG-2",nombre:"Marketing Digital"},{id:"3",codigo:"PROG-3",nombre:"Analítica de Datos"},{id:"4",codigo:"PROG-4",nombre:"Liderazgo"}];
    if(getDataProvider()==="firebase") return this.firebase.listPrograms(req.user.organizacionId);
    return this.db.programa.findMany({where:{organizacionId:req.user.organizacionId,deletedAt:null},orderBy:{nombre:"asc"}});
  }

  @Post("programas")
  @Permisos("programas.gestionar")
  crearPrograma(@Req() req:RequestUser,@Body() dto:ProgramaDto){
    if(getDataProvider()==="firebase") return this.firebase.createProgram(req.user.organizacionId,dto);
    return this.db.programa.create({data:{...dto,organizacionId:req.user.organizacionId}});
  }

  @Get("grupos")
  @Permisos("programas.leer")
  grupos(@Req() req:RequestUser){
    if(getDataProvider()==="mock") return Array.from({length:8},(_,i)=>({id:String(i+1),codigo:`GRP-${String(i+1).padStart(2,"0")}`,estado:"ACTIVO"}));
    if(getDataProvider()==="firebase") return this.firebase.listGroups(req.user.organizacionId);
    return this.db.grupo.findMany({where:{organizacionId:req.user.organizacionId},include:{programa:true}});
  }

  @Get("docentes")
  @Permisos("programas.leer")
  docentes(@Req() req:RequestUser){
    if(getDataProvider()==="mock") return Array.from({length:10},(_,i)=>({id:String(i+1),nombres:`Docente ${i+1}`,apellidos:"Demostración",estado:"ACTIVO"}));
    if(getDataProvider()==="firebase") return this.firebase.listTeachers(req.user.organizacionId);
    return this.db.docente.findMany({where:{organizacionId:req.user.organizacionId}});
  }

  @Get("estudiantes")
  @Permisos("programas.leer")
  estudiantes(@Req() req:RequestUser){
    if(getDataProvider()==="mock") return Array.from({length:20},(_,i)=>({id:String(i+1),nombres:`Estudiante ${i+1}`,apellidos:"Ficticio",estado:"ACTIVO"}));
    if(getDataProvider()==="firebase") return this.firebase.listStudents(req.user.organizacionId);
    return this.db.estudiante.findMany({where:{organizacionId:req.user.organizacionId,deletedAt:null},take:100});
  }

  @Post("clases")
  @Permisos("clases.programar")
  clase(@Req() req:RequestUser,@Body() dto:ClaseDto){return this.service.crearClase(req.user.organizacionId,req.user.sub,dto);}
}
