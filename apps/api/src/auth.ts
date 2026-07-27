import { Body, CanActivate, Controller, ExecutionContext, ForbiddenException, Injectable, Post, Res, SetMetadata, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Type } from "class-transformer";
import { IsArray, IsEmail, IsString, MinLength, ValidateNested } from "class-validator";
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

const demoStudentUsers = new Map<string, BulkStudentItemDto>();

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
        res.cookie("siga_session",token,{httpOnly:true,sameSite:"lax",secure:false,maxAge:900000,path:"/"});
        return {usuario:{id:"00000000-0000-4000-8000-000000000001",nombre:"Administración SIGA",usuario:dto.usuario,correo:"admin@elite.test",permisos},modo:"demostracion"};
      }
      const demoStudent=demoStudentUsers.get(dto.usuario.toLowerCase());
      if(!demoStudent || demoStudent.password!==dto.password) throw new UnauthorizedException("Credenciales inválidas");
      const permisos=["cursos.leer","asistencia.propia","notas.propias","solicitudes.crear","certificados.leer"];
      const token=await this.jwt.signAsync({sub:`demo-${demoStudent.dni}`,organizacionId:"00000000-0000-4000-8000-000000000001",permisos,perfil:"Estudiante"});
      res.cookie("siga_session",token,{httpOnly:true,sameSite:"lax",secure:false,maxAge:900000,path:"/"});
      return {usuario:{id:`demo-${demoStudent.dni}`,nombre:demoStudent.nombre,usuario:demoStudent.usuario,correo:demoStudent.correo,permisos,perfil:"Estudiante"},modo:"demostracion"};
    }
    if(getDataProvider()==="firebase"){
      const usuario=await this.firebase.findUser(dto.usuario);
      if(!usuario || usuario.estado!=="ACTIVO" || !(await argon2.verify(usuario.passwordHash,dto.password))) throw new UnauthorizedException("Credenciales inválidas");
      const token=await this.jwt.signAsync({sub:usuario.id,organizacionId:usuario.organizacionId,permisos:usuario.permisos,perfil:usuario.perfil});
      res.cookie("siga_session",token,{httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV==="production",maxAge:900000,path:"/"});
      return {usuario:{id:usuario.id,nombre:usuario.nombre,usuario:usuario.usuario,correo:usuario.correo,permisos:usuario.permisos,perfil:usuario.perfil}};
    }
    const usuario=await this.db.usuario.findFirst({where:{correo:dto.usuario,estado:"ACTIVO"},include:{roles:{include:{rol:{include:{permisos:{include:{permiso:true}}}}}}}});
    if(!usuario || !(await argon2.verify(usuario.passwordHash,dto.password))) throw new UnauthorizedException("Credenciales inválidas");
    const permisos=[...new Set(usuario.roles.flatMap((r:{rol:{permisos:Array<{permiso:{codigo:string}}>}})=>r.rol.permisos.map((p:{permiso:{codigo:string}})=>p.permiso.codigo)))];
    const token=await this.jwt.signAsync({sub:usuario.id,organizacionId:usuario.organizacionId,permisos});
    res.cookie("siga_session",token,{httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV==="production",maxAge:900000,path:"/"});
    return {usuario:{id:usuario.id,nombre:usuario.nombre,correo:usuario.correo,permisos}};
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
