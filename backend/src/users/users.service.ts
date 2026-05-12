import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
import * as argon2 from 'argon2';
import * as XLSX from 'xlsx';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(role?: Role) {
    return this.prisma.user.findMany({
      where: role ? { role } : {},
      include: {
        studentProfile: true,
        facultyProfile: true,
        adminProfile: true,
      },
    });
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
        const { email, firstName, lastName, identifier, designation, sectionName } = row;

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
            // Find section by name (assuming CSE only for now)
            const section = await tx.section.findFirst({
              where: { name: sectionName || 'A' },
            });
            if (!section) throw new Error(`Section ${sectionName} not found`);

            await tx.studentProfile.create({
              data: {
                userId: user.id,
                firstName,
                lastName,
                registrationNumber: identifier || `REG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                sectionId: section.id,
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
