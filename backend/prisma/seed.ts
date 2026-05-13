import "dotenv/config";
import { PrismaClient, Role, LifecycleStatus, AcademicStatus, AssignmentCategory } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { faker } from '@faker-js/faker';
import * as argon2 from 'argon2';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Starting Relational Academic Seeding (Phase 4B)...');
  faker.seed(456); 

  const passwordHash = await argon2.hash('Aurora@123');

  // 1. Deep Clean
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

  // 2. Core Hierarchy
  const deptCS = await prisma.department.create({ 
    data: { name: 'Computer Science & Engineering', code: 'CSE' } 
  });

  const course = await prisma.course.create({ 
    data: { name: 'B.Tech Computer Science', code: 'BT-CSE', departmentId: deptCS.id } 
  });

  const sections = [];
  const subjects = [];
  const terms = [];
  const years = [];

  // Create 4 Years
  for (let y = 1; y <= 4; y++) {
    const year = await prisma.year.create({ 
      data: { 
        number: y, 
        courseId: course.id,
        academicYear: `202${2+y}-2${3+y}`,
        isCurrent: y === 2 // Let's make Year 2 current
      } 
    });
    years.push(year);

    // 4 Terms per Year
    for (let t = 1; t <= 4; t++) {
      const term = await prisma.term.create({ 
        data: { 
          number: t, 
          name: `Term ${t}`, 
          yearId: year.id,
          isCurrent: y === 2 && t === 1 // Term 1 of Year 2 is active
        } 
      });
      terms.push(term);
      
      // 2 Sections per Term
      for (const sName of ['A', 'B']) {
        const section = await prisma.section.create({ 
          data: { 
            name: sName, 
            termId: term.id,
            status: LifecycleStatus.ACTIVE
          } 
        });
        sections.push(section);
      }

      // 4 Subjects per Term
      for (let sub = 1; sub <= 4; sub++) {
        const subject = await prisma.subject.create({
          data: {
            name: faker.helpers.arrayElement([
              'Data Structures', 'Algorithms', 'Network Security', 'Database Systems', 
              'Cloud Computing', 'Full Stack Dev', 'ML Models', 'Software Engineering'
            ]) + ` (Y${y}T${t}.${sub})`,
            code: `CS-${y}${t}${sub}`,
            termId: term.id,
            credits: 3
          }
        });
        subjects.push(subject);
      }
    }
  }

  const activeTerm = terms.find(t => t.isCurrent)!;
  const activeYear = years.find(y => y.isCurrent)!;
  const activeSections = sections.filter(s => s.termId === activeTerm.id);

  // 3. Faculty
  console.log('Creating Faculty...');
  const facultyProfiles = [];
  for (let i = 0; i < 10; i++) {
    const fName = faker.person.firstName();
    const lName = faker.person.lastName();
    const user = await prisma.user.create({
      data: {
        email: i === 0 ? 'faculty@aurora.ac.in' : `faculty${i}@aurora.ac.in`,
        passwordHash,
        role: Role.FACULTY,
        facultyProfile: {
          create: {
            firstName: fName,
            lastName: lName,
            staffId: `FAC-${1000 + i}`,
            designation: 'Professor'
          }
        }
      },
      include: { facultyProfile: true }
    });
    facultyProfiles.push(user.facultyProfile!);
  }

  // 4. Students & Enrollments
  console.log('Creating Students & Enrollments...');
  for (let i = 0; i < 40; i++) {
    const fName = faker.person.firstName();
    const lName = faker.person.lastName();
    const targetSection = faker.helpers.arrayElement(activeSections);

    const user = await prisma.user.create({
      data: {
        email: i === 0 ? 'student@aurora.ac.in' : `student${i}@aurora.ac.in`,
        passwordHash,
        role: Role.STUDENT,
        studentProfile: {
          create: {
            firstName: fName,
            lastName: lName,
            registrationNumber: `REG-${24000 + i}`,
            sectionId: targetSection.id,
          }
        }
      },
      include: { studentProfile: true }
    });

    // Create current enrollment record
    await prisma.studentEnrollment.create({
      data: {
        studentId: user.studentProfile!.id,
        sectionId: targetSection.id,
        termId: activeTerm.id,
        isCurrent: true,
        status: AcademicStatus.ACTIVE
      }
    });
  }

  // 5. Relational Faculty Assignments
  console.log('Mapping Faculty to Sections & Subjects...');
  for (const section of activeSections) {
    const subjectsInTerm = subjects.filter(s => s.termId === section.termId);
    for (const sub of subjectsInTerm) {
      await prisma.facultyAssignment.create({
        data: {
          facultyId: faker.helpers.arrayElement(facultyProfiles).id,
          sectionId: section.id,
          subjectId: sub.id,
          termId: activeTerm.id,
          yearId: activeYear.id,
          status: LifecycleStatus.ACTIVE
        }
      });
    }
  }

  // 6. Assignment Templates (E4 — seeded globally, isGlobal = true)
  console.log('Creating Assignment Templates...');
  const uploadBasedTemplates = [
    'Reflective Journal',
    'Lab Journal',
    'Assignment',
    'Group Assignment',
    'Project Report',
    'Case Study',
  ];
  const marksOnlyTemplates = [
    'Student Lecture',
    'Presentation',
    'Quiz',
    'Lab Quiz',
  ];

  for (const name of uploadBasedTemplates) {
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

  for (const name of marksOnlyTemplates) {
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

  // 7. Admin
  await prisma.user.create({
    data: {
      email: 'admin@aurora.ac.in',
      passwordHash,
      role: Role.ADMIN,
      adminProfile: { create: { firstName: 'Aurora', lastName: 'Admin' } }
    }
  });

  console.log('Seeding complete. Relational graph established.');
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
