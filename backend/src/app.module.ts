import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import * as Joi from 'joi';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AcademicModule } from './academic/academic.module';
import { AttendanceModule } from './attendance/attendance.module';
import { AssignmentsModule } from './assignments/assignments.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { NoticeboardModule } from './noticeboard/noticeboard.module';
import { AutomationModule } from './automation/automation.module';
import { SearchModule } from './search/search.module';
import { HealthModule } from './health/health.module';
import { AuditLogModule } from './common/audit-log/audit-log.module';
import { BullModule } from '@nestjs/bullmq';
import { LoggerMiddleware } from './common/middleware/logger.middleware';

const redisEnabled = process.env.REDIS_ENABLED !== 'false';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        DATABASE_URL: Joi.string().required(),
        DIRECT_URL: Joi.string().optional(),
        PORT: Joi.number().default(3001),
        JWT_SECRET: Joi.string().required(),
        JWT_EXPIRY: Joi.string().default('15m'),
        JWT_REFRESH_SECRET: Joi.string().required(),
        JWT_REFRESH_EXPIRY: Joi.string().default('7d'),
        FRONTEND_URL: Joi.string().default('http://localhost:3000'),
        REDIS_ENABLED: Joi.boolean().default(true),
        REDIS_HOST: Joi.string().default('localhost'),
        REDIS_PORT: Joi.number().default(6379),
        STORAGE_PROVIDER: Joi.string().valid('local', 'supabase').default('local'),
      }),
    }),
    ...(redisEnabled
      ? [
          BullModule.forRoot({
            connection: {
              host: process.env.REDIS_HOST || 'localhost',
              port: parseInt(process.env.REDIS_PORT || '6379'),
            },
          }),
          AutomationModule,
        ]
      : []),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PrismaModule,
    AuthModule,
    UsersModule,
    AcademicModule,
    AttendanceModule,
    AssignmentsModule,
    AnalyticsModule,
    NoticeboardModule,
    SearchModule,
    HealthModule,
    AuditLogModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
