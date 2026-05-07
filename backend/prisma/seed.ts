import { PrismaClient, Role } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with mock users...');

  const passwordHash = await argon2.hash('password123');

  // Admin User
  const admin = await prisma.user.upsert({
    where: { email: 'admin@aurora.ac.in' },
    update: {},
    create: {
      email: 'admin@aurora.ac.in',
      passwordHash,
      role: Role.ADMIN,
      adminProfile: {
        create: {
          firstName: 'System',
          lastName: 'Administrator',
        },
      },
    },
  });
  console.log(`Created Admin: ${admin.email} (password: password123)`);

  // Faculty User
  const faculty = await prisma.user.upsert({
    where: { email: 'faculty@aurora.ac.in' },
    update: {},
    create: {
      email: 'faculty@aurora.ac.in',
      passwordHash,
      role: Role.FACULTY,
      facultyProfile: {
        create: {
          firstName: 'Sai Rahul',
          lastName: 'Mallidi',
          staffId: 'FAC001',
          designation: 'Assistant Professor',
        },
      },
    },
  });
  console.log(`Created Faculty: ${faculty.email} (password: password123)`);

  // Student User
  // Create a basic hierarchy first to attach the student
  const department = await prisma.department.upsert({
    where: { code: 'CSE' },
    update: {},
    create: { name: 'Computer Science', code: 'CSE' },
  });

  const course = await prisma.course.upsert({
    where: { code: 'BTECH-CSE' },
    update: {},
    create: { name: 'B.Tech CSE', code: 'BTECH-CSE', departmentId: department.id },
  });

  // Check if year already exists
  let year = await prisma.year.findFirst({
    where: { courseId: course.id, number: 1 },
  });
  if (!year) {
    year = await prisma.year.create({
      data: { number: 1, courseId: course.id },
    });
  }

  // Check if term already exists
  let term = await prisma.term.findFirst({
    where: { yearId: year.id, number: 1 },
  });
  if (!term) {
    term = await prisma.term.create({
      data: { number: 1, name: 'Semester 1', yearId: year.id },
    });
  }

  // Check if section already exists
  let section = await prisma.section.findFirst({
    where: { termId: term.id, name: 'A' },
  });
  if (!section) {
    section = await prisma.section.create({
      data: { name: 'A', termId: term.id },
    });
  }

  const student = await prisma.user.upsert({
    where: { email: 'student@aurora.ac.in' },
    update: {},
    create: {
      email: 'student@aurora.ac.in',
      passwordHash,
      role: Role.STUDENT,
      studentProfile: {
        create: {
          firstName: 'Nikshith',
          lastName: 'Yadagiri',
          registrationNumber: '22XYZ0001',
          sectionId: section.id,
        },
      },
    },
  });
  console.log(`Created Student: ${student.email} (password: password123)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
