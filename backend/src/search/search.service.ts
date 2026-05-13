import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NoticeStatus, AssignmentStatus } from '@prisma/client';

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  async globalSearch(query: string) {
    if (!query || query.length < 2) return { results: [], total: 0 };

    const searchTerm = query.trim();

    const [notices, assignments, students, faculty, subjects] = await Promise.all([
      // 1. Search Notices
      this.prisma.notice.findMany({
        where: {
          OR: [
            { title: { contains: searchTerm, mode: 'insensitive' } },
            { content: { contains: searchTerm, mode: 'insensitive' } },
          ],
          status: NoticeStatus.PUBLISHED,
        },
        take: 5,
        select: { id: true, title: true, category: true, createdAt: true },
      }),

      // 2. Search Assignments
      this.prisma.assignment.findMany({
        where: {
          title: { contains: searchTerm, mode: 'insensitive' },
          status: AssignmentStatus.PUBLISHED,
        },
        take: 5,
        select: { id: true, title: true, dueDate: true, subject: { select: { name: true } } },
      }),

      // 3. Search Students
      this.prisma.studentProfile.findMany({
        where: {
          OR: [
            { firstName: { contains: searchTerm, mode: 'insensitive' } },
            { lastName: { contains: searchTerm, mode: 'insensitive' } },
            { registrationNumber: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
        take: 5,
        select: { id: true, firstName: true, lastName: true, registrationNumber: true, section: { select: { name: true } } },
      }),

      // 4. Search Faculty
      this.prisma.facultyProfile.findMany({
        where: {
          OR: [
            { firstName: { contains: searchTerm, mode: 'insensitive' } },
            { lastName: { contains: searchTerm, mode: 'insensitive' } },
            { staffId: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
        take: 5,
        select: { id: true, firstName: true, lastName: true, staffId: true, designation: true },
      }),

      // 5. Search Subjects
      this.prisma.subject.findMany({
        where: {
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { code: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
        take: 5,
        select: { id: true, name: true, code: true },
      }),
    ]);

    const formattedResults = [
      ...notices.map(n => ({ id: n.id, title: n.title, type: 'NOTICE', subtext: n.category })),
      ...assignments.map(a => ({ id: a.id, title: a.title, type: 'ASSIGNMENT', subtext: a.subject.name })),
      ...students.map(s => ({ id: s.id, title: `${s.firstName} ${s.lastName}`, type: 'STUDENT', subtext: s.registrationNumber })),
      ...faculty.map(f => ({ id: f.id, title: `${f.firstName} ${f.lastName}`, type: 'FACULTY', subtext: f.designation })),
      ...subjects.map(sub => ({ id: sub.id, title: sub.name, type: 'SUBJECT', subtext: sub.code })),
    ];

    return {
      results: formattedResults,
      total: formattedResults.length,
    };
  }
}
