import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { getDataProvider } from "./data-provider";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit(){ if(getDataProvider()==="prisma") await this.$connect(); }
  async onModuleDestroy(){ if(getDataProvider()==="prisma") await this.$disconnect(); }
}
