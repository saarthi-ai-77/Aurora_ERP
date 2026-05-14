import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role, AcademicStatus } from '@prisma/client';
import * as argon2 from 'argon2';
import * as XLSX from 'xlsx';
import { CreateStudentDto } from './dto/create-student.dto';
import { PaginationQueryDto, createPaginatedResponse } from '../common/dto/pagination.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getMyProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        studentProfile: {
          include: {
            section: {
              include: {
                term: {
                  include: {
                    year: {
                      include: { course: { include: { department: true } } },
                    },
                  },
                },
              },
            },
          },
        },
        facultyProfile: {
          include: {
            assignments: {
              include: {
                subject: true,
                section: true,
              },
            },
          },
        },
        adminProfile: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async getAuditLogs(query: PaginationQueryDto) {
    const { page, limit, skip } = query;

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        take: limit,
        skip,
        orderBy: { createdAt: 'desc' }, // Deterministic Ordering
        include: {
          actor: {
            select: {
              email: true,
              role: true,
              facultyProfile: { select: { firstName: true, lastName: true } },
              adminProfile: { select: { firstName: true, lastName: true } },
              studentProfile: { select: { firstName: true, lastName: true } },
            },
          },
        },
      }),
      this.prisma.auditLog.count(),
    ]);

    return createPaginatedResponse(logs, total, page || 1, limit || 20);
  }

  async findAll(role?: Role, query: PaginationQueryDto = new PaginationQueryDto()) {
    const { page, limit, skip } = query;
    const where = role ? { role } : {};

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: {
          studentProfile: true,
          facultyProfile: true,
          adminProfile: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
      }),
      this.prisma.user.count({ where }),
    ]);

    return createPaginatedResponse(users, total, page, limit);
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        studentProfile: true,
        facultyProfile: true,
        adminProfile: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async createStudent(dto: CreateStudentDto) {
    const section = await this.prisma.section.findUnique({
      where: { id: dto.sectionId },
    });
    if (!section) throw new BadRequestException('Section not found');
    if (section.isArchived) throw new BadRequestException('Cannot assign student to an archived section');

    const existing = await this.prisma.studentProfile.findFirst({
      where: { registrationNumber: dto.registrationNumber },
    });
    if (existing) throw new BadRequestException(`Registration number "${dto.registrationNumber}" is already in use`);

    const existingUser = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existingUser) throw new BadRequestException(`Email "${dto.email}" is already in use`);

    const passwordHash = await argon2.hash('Aurora@123');

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: dto.email,
          passwordHash,
          role: Role.STUDENT,
          isActive: true,
          studentProfile: {
            create: {
              firstName: dto.firstName,
              lastName: dto.lastName,
              registrationNumber: dto.registrationNumber,
              sectionId: dto.sectionId,
            },
          },
        },
        include: { studentProfile: true },
      });

      await tx.studentEnrollment.create({
        data: {
          studentId: user.studentProfile!.id,
          sectionId: dto.sectionId,
          termId: section.termId,
          status: AcademicStatus.ACTIVE,
          isCurrent: true,
        },
      });

      return user;
    });
  }

  async toggleStatus(id: string) {
    const user = await this.findOne(id);
    return this.prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
    });
  }

  async bulkUpload(file: Express.Multer.File, role: Role) {
    if (!file) throw new BadRequestException('No file uploaded');

    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);

    const passwordHash = await argon2.hash('Aurora@123'); // Default password for new uploads
    const results: { success: number; failed: number; errors: any[] } = { success: 0, failed: 0, errors: [] };

    for (const row of data as any[]) {
      try {
        const { email, firstName, lastName, identifier, designation, sectionId } = row;

        if (!email || !firstName || !lastName) {
          throw new Error(`Missing required fields for ${email || 'unknown user'}`);
        }

        await this.prisma.$transaction(async (tx) => {
          // Check if user exists
          const existingUser = await tx.user.findUnique({ where: { email } });
          if (existingUser) throw new Error(`User with email ${email} already exists`);

          const user = await tx.user.create({
            data: {
              email,
              passwordHash,
              role,
              isActive: true,
            },
          });

          if (role === Role.STUDENT) {
            if (!sectionId) {
              throw new Error('Student rows must include a valid sectionId');
            }

            const section = await tx.section.findUnique({
              where: { id: sectionId },
            });
            if (!section || section.isArchived) {
              throw new Error(`Section ${sectionId} not found or archived`);
            }

            const studentProfile = await tx.studentProfile.create({
              data: {
                userId: user.id,
                firstName,
                lastName,
                registrationNumber: identifier || `REG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                sectionId: section.id,
              },
            });

            await tx.studentEnrollment.create({
              data: {
                studentId: studentProfile.id,
                sectionId: section.id,
                termId: section.termId,
                status: AcademicStatus.ACTIVE,
                isCurrent: true,
              },
            });
          } else if (role === Role.FACULTY) {
            await tx.facultyProfile.create({
              data: {
                userId: user.id,
                firstName,
                lastName,
                staffId: identifier || `FAC-${Date.now()}`,
                designation: designation || 'Assistant Professor',
              },
            });
          } else if (role === Role.ADMIN) {
            await tx.adminProfile.create({
              data: {
                userId: user.id,
                firstName,
                lastName,
              },
            });
          }
        });

        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({ email: row.email, error: error.message });
      }
    }

    return results;
  }
}
