import { Body, CanActivate, Controller, ExecutionContext, ForbiddenException, Get, Injectable, Post, Req, Res, SetMetadata, UnauthorizedException, UseGuards } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Type } from "class-transformer";
import { IsArray, IsEmail, IsIn, IsOptional, IsString, Matches, MinLength, ValidateNested } from "class-validator";
import argon2 from "argon2";
import type { Response } from "express";
import { FirebaseService } from "./firebase.service";
import { getDataProvider } from "./data-provider";
import { PrismaService } from "./prisma.service";

class LoginDto {
  @IsString() @MinLength(3,{message:"El usuario no es válido"}) usuario!: string;
  @IsString() @MinLength(8,{message:"La contraseña debe tener al menos 8 caracteres"}) password!: string;
}

class BulkStudentItemDto {
  @IsEmail() correo!: string;
  @IsString() @MinLength(3) usuario!: string;
  @IsString() @MinLength(8) password!: string;
  @IsString() @MinLength(3) nombre!: string;
  @IsString() @MinLength(8) dni!: string;
  @IsString() cursoId!: string;
}

class BulkStudentsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkStudentItemDto)
  students!: BulkStudentItemDto[];
}

const modulesByProfile: Record<string, string[]> = {
  Docente: ["Docente"],
  Estudiante: ["Estudiante"],
  "Gestión al estudiante": ["Gestión al estudiante"],
  Administrador: ["Docente", "Estudiante", "Gestión al estudiante", "Administrador"],
};

const permissionsByProfile: Record<string, string[]> = {
  Docente: ["cursos.leer", "asistencia.registrar", "notas.gestionar", "lms.gestionar", "reportes.leer"],
  Estudiante: ["cursos.leer", "asistencia.propia", "notas.propias", "solicitudes.crear", "certificados.leer"],
  "Gestión al estudiante": ["programas.leer", "programas.gestionar", "grupos.gestionar", "estudiantes.gestionar", "clases.programar", "reportes.leer", "encuestas.gestionar", "tickets.gestionar"],
  Administrador: ["usuarios.gestionar", "roles.gestionar", "programas.leer", "programas.gestionar", "grupos.gestionar", "docentes.gestionar", "estudiantes.gestionar", "clases.programar", "clases.aprobar", "auditoria.leer", "reportes.leer", "cursos.leer", "asistencia.registrar", "asistencia.propia", "notas.gestionar", "notas.propias", "lms.gestionar", "encuestas.gestionar", "tickets.gestionar", "solicitudes.crear", "certificados.leer"],
};

class CreateUserDto {
  @IsString() @MinLength(3) nombre!: string;
  @Matches(/^\d{8}$/,{message:"El DNI debe tener exactamente 8 dígitos"}) dni!: string;
  @Matches(/^9\d{8}$/,{message:"El celular debe tener 9 dígitos y comenzar con 9"}) celular!: string;
  @Matches(/^9\d{8}$/,{message:"El WhatsApp debe tener 9 dígitos y comenzar con 9"}) whatsapp!: string;
  @IsEmail({}, {message:"Ingresa un correo válido"}) correo!: string;
  @IsIn(["Docente","Estudiante","Gestión al estudiante","Administrador"]) perfil!: string;
  @IsOptional() @IsArray() @IsString({each:true}) modulos?: string[];
}

class ChangePasswordDto {
  @IsString() passwordActual!: string;
  @IsString() @MinLength(8) nuevaPassword!: string;
}

const demoStudentUsers = new Map<string, BulkStudentItemDto>();

function sessionCookie() {
  const crossSite = process.env.COOKIE_SAME_SITE === "none";
  return {
    httpOnly: true,
    sameSite: crossSite ? "none" as const : "lax" as const,
    secure: crossSite || process.env.NODE_ENV === "production",
    maxAge: 900000,
    path: "/",
  };
}

export const Permisos = (...permisos:string[]) => SetMetadata("permisos",permisos);

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwt:JwtService){}
  canActivate(ctx:ExecutionContext){
    const req=ctx.switchToHttp().getRequest<{cookies?:Record<string,string>;user?:unknown}>();
    const token=req.cookies?.["siga_session"];
    if(!token) throw new UnauthorizedException("Debe iniciar sesión");
    try { req.user=this.jwt.verify(token); return true; } catch { throw new UnauthorizedException("Sesión inválida o vencida"); }
  }
}

@Injectable()
export class PermissionsGuard implements CanActivate {
  canActivate(ctx:ExecutionContext){
    const required=Reflect.getMetadata("permisos",ctx.getHandler()) as string[]|undefined;
    if(!required?.length) return true;
    const user=ctx.switchToHttp().getRequest<{user:{permisos:string[]}}>().user;
    if(!required.every(p=>user.permisos.includes(p))) throw new ForbiddenException("No cuenta con el permiso requerido");
    return true;
  }
}

@Controller("auth")
export class AuthController {
  constructor(private db:PrismaService,private jwt:JwtService,private firebase:FirebaseService){}

  @Post("login")
  async login(@Body() dto:LoginDto,@Res({passthrough:true}) res:Response){
    if(process.env.DEMO_MODE==="true"){
      if(dto.usuario==="admin@elite.test" && dto.password==="SigaElite.Dev.2026!"){
        const permisos=["usuarios.gestionar","roles.gestionar","programas.leer","programas.gestionar","grupos.gestionar","docentes.gestionar","estudiantes.gestionar","clases.programar","clases.aprobar","auditoria.leer","reportes.leer"];
        const token=await this.jwt.signAsync({sub:"00000000-0000-4000-8000-000000000001",organizacionId:"00000000-0000-4000-8000-000000000001",permisos});
        res.cookie("siga_session",token,sessionCookie());
        return {usuario:{id:"00000000-0000-4000-8000-000000000001",nombre:"Administración SIGA",usuario:dto.usuario,correo:"admin@elite.test",permisos},modo:"demostracion"};
      }
      const demoStudent=demoStudentUsers.get(dto.usuario.toLowerCase());
      if(!demoStudent || demoStudent.password!==dto.password) throw new UnauthorizedException("Credenciales inválidas");
      const permisos=["cursos.leer","asistencia.propia","notas.propias","solicitudes.crear","certificados.leer"];
      const token=await this.jwt.signAsync({sub:`demo-${demoStudent.dni}`,organizacionId:"00000000-0000-4000-8000-000000000001",permisos,perfil:"Estudiante"});
      res.cookie("siga_session",token,sessionCookie());
      return {usuario:{id:`demo-${demoStudent.dni}`,nombre:demoStudent.nombre,usuario:demoStudent.usuario,correo:demoStudent.correo,permisos,perfil:"Estudiante"},modo:"demostracion"};
    }
    if(getDataProvider()==="firebase"){
      const usuario=await this.firebase.findUser(dto.usuario);
      if(!usuario || usuario.estado!=="ACTIVO" || !(await argon2.verify(usuario.passwordHash,dto.password))) throw new UnauthorizedException("Credenciales inválidas");
      const token=await this.jwt.signAsync({sub:usuario.id,organizacionId:usuario.organizacionId,permisos:usuario.permisos,perfil:usuario.perfil,cambioPasswordRequerido:usuario.cambioPasswordRequerido});
      res.cookie("siga_session",token,sessionCookie());
      return {usuario:{id:usuario.id,nombre:usuario.nombre,usuario:usuario.usuario,correo:usuario.correo,permisos:usuario.permisos,perfil:usuario.perfil,modulos:usuario.modulos},requiereCambioPassword:usuario.cambioPasswordRequerido};
    }
    const usuario=await this.db.usuario.findFirst({where:{correo:dto.usuario,estado:"ACTIVO"},include:{roles:{include:{rol:{include:{permisos:{include:{permiso:true}}}}}}}});
    if(!usuario || !(await argon2.verify(usuario.passwordHash,dto.password))) throw new UnauthorizedException("Credenciales inválidas");
    const permisos=[...new Set(usuario.roles.flatMap((r:{rol:{permisos:Array<{permiso:{codigo:string}}>}})=>r.rol.permisos.map((p:{permiso:{codigo:string}})=>p.permiso.codigo)))];
    const token=await this.jwt.signAsync({sub:usuario.id,organizacionId:usuario.organizacionId,permisos});
    res.cookie("siga_session",token,sessionCookie());
    return {usuario:{id:usuario.id,nombre:usuario.nombre,correo:usuario.correo,permisos}};
  }

  @Get("users")
  @UseGuards(AuthGuard,PermissionsGuard)
  @Permisos("usuarios.gestionar")
  async users(@Req() req:{user:{organizacionId:string}}){
    if(getDataProvider()!=="firebase") throw new ForbiddenException("La gestión de usuarios requiere Firebase");
    return this.firebase.listUsers(req.user.organizacionId);
  }

  @Post("users")
  @UseGuards(AuthGuard,PermissionsGuard)
  @Permisos("usuarios.gestionar")
  async createUser(@Req() req:{user:{organizacionId:string}},@Body() dto:CreateUserDto){
    if(getDataProvider()!=="firebase") throw new ForbiddenException("La gestión de usuarios requiere Firebase");
    const availableModules=modulesByProfile[dto.perfil] ?? [];
    const modules=dto.perfil==="Administrador"
      ? (dto.modulos?.filter((module)=>availableModules.includes(module)) ?? availableModules)
      : availableModules;
    return this.firebase.createUser(req.user.organizacionId,{
      nombre:dto.nombre.trim(),
      dni:dto.dni,
      celular:dto.celular,
      whatsapp:dto.whatsapp,
      correo:dto.correo.trim().toLowerCase(),
      perfil:dto.perfil,
      modulos:modules,
      permisos:permissionsByProfile[dto.perfil] ?? [],
      passwordHash:await argon2.hash(dto.dni),
    });
  }

  @Post("change-password")
  @UseGuards(AuthGuard)
  async changePassword(@Req() req:{user:{sub:string;organizacionId:string}},@Body() dto:ChangePasswordDto){
    if(getDataProvider()!=="firebase") throw new ForbiddenException("El cambio de contraseña requiere Firebase");
    const current=await this.firebase.findUserById(req.user.organizacionId,req.user.sub);
    if(!current || !(await argon2.verify(current.passwordHash,dto.passwordActual))) throw new UnauthorizedException("La contraseña actual no es correcta");
    if(!/^[A-Za-z0-9]{8,}$/.test(dto.nuevaPassword)) throw new ForbiddenException("La nueva contraseña debe tener al menos 8 caracteres y usar solo letras sin tilde y números");
    if(dto.nuevaPassword===current.dni) throw new ForbiddenException("La nueva contraseña no puede ser igual al DNI");
    await this.firebase.changePassword(req.user.organizacionId,req.user.sub,await argon2.hash(dto.nuevaPassword));
    return {ok:true};
  }

  @Post("bulk-students")
  async bulkStudents(@Body() dto:BulkStudentsDto){
    if(getDataProvider()==="firebase"){
      const organizationId=process.env.FIREBASE_DEFAULT_ORGANIZATION_ID;
      if(!organizationId) throw new ForbiddenException("Falta FIREBASE_DEFAULT_ORGANIZATION_ID para la carga masiva");
      return this.firebase.bulkStudents(organizationId,dto.students,(password)=>argon2.hash(password));
    }
    if(getDataProvider()!=="mock") throw new ForbiddenException("La carga masiva debe ejecutarse mediante el servicio persistente de usuarios");
    const created:string[]=[];
    const updated:string[]=[];
    for(const student of dto.students){
      const key=student.usuario.toLowerCase();
      if(demoStudentUsers.has(key)) updated.push(student.correo);
      else created.push(student.correo);
      demoStudentUsers.set(key,student);
    }
    return {created,updated,total:dto.students.length};
  }
}
