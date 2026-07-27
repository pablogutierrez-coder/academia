import { Controller, Get } from "@nestjs/common";
import { PrismaService } from "./prisma.service";
import { FirebaseService } from "./firebase.service";
import { getDataProvider } from "./data-provider";
@Controller("health")
export class HealthController {
  constructor(private db:PrismaService,private firebase:FirebaseService){}
  @Get() async health(){
    const provider=getDataProvider();
    if(provider==="mock") return {status:"ok",database:"mock",modo:"demostracion",timestamp:new Date().toISOString()};
    if(provider==="firebase") return {status:"ok",database:"firestore",...(await this.firebase.health()),timestamp:new Date().toISOString()};
    await this.db.$queryRaw`SELECT 1`;
    return {status:"ok",database:"postgresql",provider:"prisma",timestamp:new Date().toISOString()};
  }
}
