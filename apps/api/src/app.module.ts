import "./env";
import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { AuthController, AuthGuard, PermissionsGuard } from "./auth";
import { PrismaService } from "./prisma.service";
import { AcademicoController, AcademicoService } from "./academico";
import { HealthController } from "./health";
import { FirebaseService } from "./firebase.service";
import { getDataProvider } from "./data-provider";

@Module({
  imports:[JwtModule.register({global:true,secret:process.env.JWT_SECRET ?? "solo-desarrollo-cambiar-32-caracteres",signOptions:{expiresIn:"15m"}})],
  controllers:[AuthController,AcademicoController,HealthController],
  providers:[
    {
      provide:PrismaService,
      useFactory:()=>getDataProvider()==="prisma"
        ? new PrismaService()
        : Object.create(PrismaService.prototype) as PrismaService
    },
    FirebaseService,AcademicoService,AuthGuard,PermissionsGuard
  ]
})
export class AppModule {}
