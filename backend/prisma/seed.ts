import "dotenv/config";
import { PrismaClient, Role, LifecycleStatus, AssignmentCategory } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { faker } from '@faker-js/faker';
import * as argon2 from 'argon2';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Aurora ERP — Seeding foundational structure...');
  faker.seed(456);

  const passwordHash = await argon2.hash('Aurora@123');

  // ─── Deep Clean ─────────────────────────────────────────────────────────────
  console.log('Cleaning database...');
  await prisma.auditLog.deleteMany();
  await prisma.notice.deleteMany();
  await prisma.assignmentSubmission.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.assignmentTemplate.deleteMany();
  await prisma.attendanceRecord.deleteMany();
  await prisma.attendanceSession.deleteMany();
  await prisma.studentEnrollment.deleteMany();
  await prisma.facultyAssignment.deleteMany();
  await prisma.sectionSubject.deleteMany();
  await prisma.studentProfile.deleteMany();
  await prisma.facultyProfile.deleteMany();
  await prisma.adminProfile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.section.deleteMany();
  await prisma.term.deleteMany();
  await prisma.year.deleteMany();
  await prisma.course.deleteMany();
  await prisma.department.deleteMany();

  // ─── Academic Hierarchy (foundational, not operational) ──────────────────────
  console.log('Creating academic hierarchy...');

  const deptCS = await prisma.department.create({
    data: { name: 'Computer Science & Engineering', code: 'CSE' },
  });

  const deptEC = await prisma.department.create({
    data: { name: 'Electronics & Communication', code: 'ECE' },
  });

  const courseCSE = await prisma.course.create({
    data: { name: 'B.Tech Computer Science', code: 'BT-CSE', departmentId: deptCS.id },
  });

  const courseECE = await prisma.course.create({
    data: { name: 'B.Tech Electronics', code: 'BT-ECE', departmentId: deptEC.id },
  });

  // 4 Years × 2 Terms each for CSE
  for (let y = 1; y <= 4; y++) {
    const year = await prisma.year.create({
      data: {
        number: y,
        courseId: courseCSE.id,
        academicYear: `202${2 + y}-2${3 + y}`,
        isCurrent: y === 2,
      },
    });

    for (let t = 1; t <= 2; t++) {
      await prisma.term.create({
        data: {
          number: t,
          name: `Semester ${t}`,
          yearId: year.id,
          isCurrent: y === 2 && t === 1,
        },
      });
    }
  }

  // 4 Years × 2 Terms each for ECE
  for (let y = 1; y <= 4; y++) {
    const year = await prisma.year.create({
      data: {
        number: y,
        courseId: courseECE.id,
        academicYear: `202${2 + y}-2${3 + y}`,
        isCurrent: y === 2,
      },
    });

    for (let t = 1; t <= 2; t++) {
      await prisma.term.create({
        data: {
          number: t,
          name: `Semester ${t}`,
          yearId: year.id,
          isCurrent: y === 2 && t === 1,
        },
      });
    }
  }

  // ─── Assignment Templates (global, category-based) ───────────────────────────
  console.log('Creating assignment templates...');

  const uploadBased = [
    'Reflective Journal',
    'Lab Journal',
    'Assignment',
    'Group Assignment',
    'Project Report',
    'Case Study',
  ];

  const marksOnly = [
    'Student Lecture',
    'Presentation',
    'Quiz',
    'Lab Quiz',
  ];

  for (const name of uploadBased) {
    await prisma.assignmentTemplate.create({
      data: {
        name,
        category: AssignmentCategory.UPLOAD_BASED,
        maxMarks: 100,
        isGlobal: true,
        isMarkOnly: false,
      },
    });
  }

  for (const name of marksOnly) {
    await prisma.assignmentTemplate.create({
      data: {
        name,
        category: AssignmentCategory.MARKS_ONLY,
        maxMarks: 100,
        isGlobal: true,
        isMarkOnly: true,
      },
    });
  }

  // ─── Admin Account ───────────────────────────────────────────────────────────
  console.log('Creating admin account...');
  await prisma.user.create({
    data: {
      email: 'admin@aurora.ac.in',
      passwordHash,
      role: Role.ADMIN,
      adminProfile: { create: { firstName: 'Aurora', lastName: 'Admin' } },
    },
  });

  // ─── Faculty Accounts (no assignments — admin assigns via UI) ─────────────────
  console.log('Creating faculty accounts...');
  const facultyNames = [
    ['Arjun', 'Sharma'],
    ['Priya', 'Menon'],
    ['Rohit', 'Verma'],
    ['Divya', 'Nair'],
    ['Kiran', 'Reddy'],
    ['Anjali', 'Pillai'],
    ['Suresh', 'Kumar'],
    ['Lakshmi', 'Iyer'],
    ['Venkat', 'Rao'],
    ['Meena', 'Krishnan'],
  ];

  for (let i = 0; i < facultyNames.length; i++) {
    const [firstName, lastName] = facultyNames[i];
    await prisma.user.create({
      data: {
        email: i === 0 ? 'faculty@aurora.ac.in' : `faculty${i}@aurora.ac.in`,
        passwordHash,
        role: Role.FACULTY,
        facultyProfile: {
          create: {
            firstName,
            lastName,
            staffId: `FAC-${1000 + i}`,
            designation: 'Assistant Professor',
          },
        },
      },
    });
  }

  console.log(`
Aurora ERP seeded successfully.
─────────────────────────────────
  Admin:   admin@aurora.ac.in / Aurora@123
  Faculty: faculty@aurora.ac.in / Aurora@123 (+ 9 more)

  Sections, subjects, students, and faculty assignments
  must be created through the Admin portal.
─────────────────────────────────`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
