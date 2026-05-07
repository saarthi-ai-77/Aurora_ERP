import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require('@prisma/client');

@Injectable()
export class PrismaService {
  public user: any = {
    findUnique: async () => null,
  };
  public refreshToken: any = {
    create: async () => ({}),
    deleteMany: async () => ({}),
    findMany: async () => [],
    delete: async () => ({}),
  };
  
  async onModuleInit() {
    console.log("Mock PrismaService initialized - database connection bypassed for testing.");
  }

  async onModuleDestroy() {
  }
}
