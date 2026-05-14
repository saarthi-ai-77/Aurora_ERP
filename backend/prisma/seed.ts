import "dotenv/config";
import { PrismaClient, Role, AssignmentCategory, LifecycleStatus, AcademicStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as argon2 from 'argon2';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Aurora ERP — Seeding Real Data (Phase 5)...');
  const passwordHash = await argon2.hash('Aurora@123');

  // ─── Foundation ─────────────────────────────────────────────────────────────
  const deptCS = await prisma.department.upsert({
    where: { code: 'CSE' },
    update: {},
    create: { name: 'Computer Science & Engineering', code: 'CSE' },
  });

  const courseCSE = await prisma.course.upsert({
    where: { code: 'BT-CSE-FSD' },
    update: {},
    create: { name: 'B.Tech Computer Science - Full Stack Development', code: 'BT-CSE-FSD', departmentId: deptCS.id },
  });

  const year1 = await prisma.year.upsert({
    where: { courseId_number: { courseId: courseCSE.id, number: 1 } },
    update: { isCurrent: true },
    create: {
      number: 1,
      courseId: courseCSE.id,
      academicYear: '2025-2026',
      isCurrent: true,
    },
  });

  const sem1 = await prisma.term.upsert({
    where: { yearId_number: { yearId: year1.id, number: 1 } },
    update: { isCurrent: true },
    create: {
      number: 1,
      name: 'Semester 1',
      yearId: year1.id,
      isCurrent: true,
    },
  });

  // ─── Sections ───────────────────────────────────────────────────────────────
  const section1A = await prisma.section.upsert({
    where: { termId_name: { termId: sem1.id, name: 'CSE(FSD)-1A' } },
    update: {},
    create: { name: 'CSE(FSD)-1A', termId: sem1.id },
  });

  const section1B = await prisma.section.upsert({
    where: { termId_name: { termId: sem1.id, name: 'CSE(FSD)-1B' } },
    update: {},
    create: { name: 'CSE(FSD)-1B', termId: sem1.id },
  });

  // ─── Subjects & Faculty ─────────────────────────────────────────────────────
  const subjectsData = [
    { name: 'Advanced Frontend Development', code: 'CS-AFD', faculty: { first: 'Joel', last: 'Prasanth', email: 'joel.prasanth@aurora.ac.in' } },
    { name: 'Database Management System', code: 'CS-DBMS', faculty: { first: 'Jakka', last: 'Prasanth', email: 'jakka.prasanth@aurora.ac.in' } },
    { name: 'Physics', code: 'BSC-PHY', faculty: { first: 'Dubbaka', last: 'Raju', email: 'dubbaka.raju@aurora.ac.in' } },
    { name: 'Engineering Practice', code: 'ESC-EP', faculty: { first: 'Helal', last: 'Ahmed Farhan', email: 'helal.farhan@aurora.ac.in' } },
  ];

  for (const item of subjectsData) {
    const subject = await prisma.subject.create({
      data: { name: item.name, code: item.code, termId: sem1.id },
    });

    const user = await prisma.user.create({
      data: {
        email: item.faculty.email,
        passwordHash,
        role: Role.FACULTY,
        facultyProfile: {
          create: {
            firstName: item.faculty.first,
            lastName: item.faculty.last,
            staffId: `FAC-${item.code}`,
            designation: 'Professor',
          },
        },
      },
    });

    const facultyProfile = await prisma.facultyProfile.findUnique({ where: { userId: user.id } });

    if (facultyProfile) {
      for (const section of [section1A, section1B]) {
        await prisma.sectionSubject.create({
          data: { 
            sectionId: section.id, 
            subjectId: subject.id,
            termId: sem1.id
          },
        });

        await prisma.facultyAssignment.create({
          data: {
            facultyId: facultyProfile.id,
            sectionId: section.id,
            subjectId: subject.id,
            termId: sem1.id,
            yearId: year1.id,
            status: LifecycleStatus.ACTIVE,
          },
        });
      }
    }
  }

  // ─── Admin ──────────────────────────────────────────────────────────────────
  await prisma.user.upsert({
    where: { email: 'admin@aurora.ac.in' },
    update: { passwordHash, isActive: true, failedLoginAttempts: 0, lockoutUntil: null },
    create: {
      email: 'admin@aurora.ac.in',
      passwordHash,
      role: Role.ADMIN,
      adminProfile: { create: { firstName: 'Aurora', lastName: 'Admin' } },
    },
  });

  // ─── Demo Account Password Resets ──────────────────────────────────────────
  // Ensure joel.prasanth and nikshithyadhagiri always authenticate with Aurora@123
  await prisma.user.updateMany({
    where: { email: { in: ['joel.prasanth@aurora.ac.in', 'nikshithyadhagiri@gmail.com'] } },
    data: { passwordHash, isActive: true, failedLoginAttempts: 0, lockoutUntil: null },
  });

  // ─── Students ───────────────────────────────────────────────────────────────
  const studentDataRaw = [
    { name: 'DEVANANDI ABHIRAM', email: 'abhiramdevanandi45@gmail.com', section: '1A' },
    { name: 'DUDEKULA FAREEDVALI', email: 'fareedvali0708@gmail.com', section: '1A' },
    { name: 'DUVVAKA DEEKSHITH', email: 'deekshithduvvaka@gmail.com', section: '1A' },
    { name: 'EDHARA NAGA SAI MANOHAR', email: 'edharanagasaimanohar@gmail.com', section: '1A' },
    { name: 'GANDAM ARCHANA', email: 'gandamarchana01@gmail.com', section: '1A' },
    { name: 'GANGURI YOGENDRA SAI', email: 'radharadha4153@gmail.com', section: '1A' },
    { name: 'GAVIT PRAJWAL MURLIDHAR', email: 'gavitprajwal9@gmail.com', section: '1A' },
    { name: 'GAVVALA SANDEEP', email: 'sandeepgavala699@gmail.com', section: '1A' },
    { name: 'GOLLACHENNU SRI NAKSHATHRA', email: 'plsapien7@gmail.com', section: '1A' },
    { name: 'GOLLAPALLI VISHNU VARDHAN', email: 'iamviva07@gmail.com', section: '1A' },
    { name: 'GOPURAMONI SPANDHANA', email: 'gopuramonispandana@gmail.com', section: '1A' },
    { name: 'GOTTIMUKKALA ABHINAV CHARY', email: 'charyabhinav23@gmail.com', section: '1A' },
    { name: 'GUNDRA SAI VENKATA AISHWWARYA', email: 'gsvaishwwarya07@gmail.com', section: '1A' },
    { name: 'HATAWATE HARIOM NAVNATH', email: 'hariomhatvate@gmail.com', section: '1A' },
    { name: 'JILLA SAI MITHUN', email: 'mithun.jilla08@gmail.com', section: '1A' },
    { name: 'K NITHIN', email: 'kethavathn34@gmail.com', section: '1A' },
    { name: 'K PAVAN KUMAR', email: 'pavank01437@gmail.com', section: '1A' },
    { name: 'KALISETTY DHANUNJAY', email: 'dhanukalisetty@gmail.com', section: '1A' },
    { name: 'KALWOJU VAMSHI KRISHNA', email: 'kpcmvamshlucky2713@gmail.com', section: '1A' },
    { name: 'KANAPURAM NIVEDH', email: 'nivexddhhh.spam@gmail.com', section: '1A' },
    { name: 'KARANGI HELVESTON JOHN HENRY', email: 'helvisjohn13@gmail.com', section: '1A' },
    { name: 'KASOJU SAINATH CHARY', email: 'sainathchary075@gmail.com', section: '1A' },
    { name: 'KATTA CHARAN RAJ', email: 'kattacharanraj123@gmail.com', section: '1A' },
    { name: 'KOTA AAROH', email: 'aarohrajput33@gmail.com', section: '1A' },
    { name: 'KOTHA ABHINAV', email: 'kothaabhinav444@gmail.com', section: '1A' },
    { name: 'KOVELAKUNTLA SAMEERA', email: 'ksameera79097@gmail.com', section: '1A' },
    { name: 'KURUVA MOHITH KUMAR', email: 'kuruvamohith@gmail.com', section: '1A' },
    { name: 'MADURU SAMPATH KUMAR REDDY', email: 'madurusampathkumarreddy@gmail.com', section: '1B' },
    { name: 'MALLA DHARMIK SATYA', email: 'malladharmiksatya@gmail.com', section: '1B' },
    { name: 'MANIVISETTI JAHNAVI', email: 'jahnavimanivisetti@gmail.com', section: '1B' },
    { name: 'MARTHALA VENKATA TEJASRI', email: 'marthalatejasri123@gmail.com', section: '1B' },
    { name: 'MATHAMSETTY HITHESH', email: 'rambabu94913@gmail.com', section: '1B' },
    { name: 'MUTTHULURU PUNITH SAI', email: 'mutthuluru.punith@gmail.com', section: '1B' },
    { name: 'NALLAMEKALA YAGNESH', email: 'nallamekalayagnesh31@gmail.com', section: '1B' },
    { name: 'NARAHARI SHASHIVADANA', email: 'shashivadhana53@gmail.com', section: '1B' },
    { name: 'NAREDDY ANANTHA KRISHNA PRIYA', email: 'nareddykrishnapriya@gmail.com', section: '1B' },
    { name: 'NEELAPU SAI KRISHNA REDDY', email: 'neelapusaikrishna2277@gmail.com', section: '1B' },
    { name: 'OMSHREE VREGLUM', email: 'omshrivreglum@gmail.com', section: '1B' },
    { name: 'ORRELA SWAMY', email: 'swamyorrelaorrelaswamy@gmail.com', section: '1B' },
    { name: 'P MANISH', email: 'man2323sh@gmail.com', section: '1B' },
    { name: 'P SHESHA SAI', email: 'sheshasaimudiraj@gmail.com', section: '1B' },
    { name: 'PADALA ANEESH', email: 'chinnalasahadevsahadev@gmail.com', section: '1B' },
    { name: 'pakala ashwanth', email: 'ashwanthtreddypakala@gmail.com', section: '1B' },
    { name: 'PALLAPATI SUVIDHA', email: 'vivekpallapati83@gmail.com', section: '1B' },
    { name: 'PALUSA SAI MOKSHITH GOUD', email: 'chinnug295@gmail.com', section: '1B' },
    { name: 'PANTANAMONI VIGHNESH', email: 'vighnesh.chintu25@gmail.com', section: '1B' },
    { name: 'PARASA SANDEEP SAMUEL', email: 'sanjaysamuel.333@gmail.com', section: '1B' },
    { name: 'PATAN HARSHAD BHASHA', email: 'patanharshad786@gmail.com', section: '1B' },
    { name: 'PATHIPATI VENKATA SAI THEJESH', email: 'pvstejeshtejesh@gmail.com', section: '1B' },
    { name: 'PEDDI AKSHARA', email: 'peddiakshara20@gmail.com', section: '1B' },
    { name: 'PILLI NITHIN SAIBABA', email: 'nithinsaipilli@gmail.com', section: '1B' },
    { name: 'POLICE DEEKSHITH KUMAR REDDY', email: 'policedeekshith2006@gmail.com', section: '1B' },
    { name: 'PULAMALA NANDHA KISHOR', email: 'nandhakishorpulamala@gmail.com', section: '1B' },
    { name: 'PULLAGURA PRADEEP YADAV', email: 'pradeepyadavpullagura@gmail.com', section: '1B' },
    { name: 'RAGIMAN SAI JASHWANTH REDDY', email: 'saijashureddys@gmail.com', section: '1B' },
    { name: 'RESHAM KARTHIK', email: 'reshamkrishna9@gmail.com', section: '1B' },
    { name: 'SABBITI UJWAL NAVDEEP', email: 'svenkataramanayya@gmail.com', section: '1B' },
    { name: 'SEELAM SRI BHARGAV', email: 'seelam.bhargav@gmail.com', section: '1B' },
    { name: 'SHAIK SOHAIL TANVEER', email: 'tanveer9912317174@gmail.com', section: '1B' },
    { name: 'SIRIPURAM NIVAS', email: 'siripuramnivas53@gmail.com', section: '1B' },
    { name: 'THAMMALA SAKETH', email: 'sakeththammala992@gmail.com', section: '1B' },
    { name: 'THIRUSULA APURUP SIDDARDHA', email: 'tirusulasiddu@gmail.com', section: '1B' },
    { name: 'TIDUTLA SREEKAR', email: 'sreekarsree681@gmail.com', section: '1B' },
    { name: 'UNDAVALLI LOKA NAGA SRIVIJAY', email: 'anilkondragunta1989@gmail.com', section: '1B' },
    { name: 'UPPARI VARUN KUMAR', email: 'uvarunsagar@gmail.com', section: '1B' },
    { name: 'VAITLA BILWANATH', email: 'vaitlabinnu@gmail.com', section: '1B' },
    { name: 'VEERA DHARAN SRI DATTA', email: 'dharansridatta@gmail.com', section: '1B' },
    { name: 'VEERLA SIVA DURGA PRASAD', email: 'veerlasivadurgaprasad@gmail.com', section: '1B' },
    { name: 'YADAGIRI NIKSHITH', email: 'nikshithyadhagiri@gmail.com', section: '1B' },
    { name: 'YALLAVULA NAGA VENKAT PAVAN SAI', email: 'pavanrss30@gmail.com', section: '1B' },
    { name: 'YELLURI NAVADEEP KUMAR', email: 'yellurinavadeepkumar@gmail.com', section: '1B' },
    { name: 'ASHABOINA BHANU PRAKASH', email: 'bhanyav1137@gmail.com', section: '1B' },
    { name: 'CHAVALAM KEERTHI SRI', email: 'chavalamkeerthisri7@gmail.com', section: '1B' },
  ];

  for (let i = 0; i < studentDataRaw.length; i++) {
    const data = studentDataRaw[i];
    const section = data.section === '1A' ? section1A : section1B;
    const nameParts = data.name.split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Student';

    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        role: Role.STUDENT,
        studentProfile: {
          create: {
            firstName,
            lastName,
            registrationNumber: `252U1R${(1000 + i).toString()}`,
            sectionId: section.id,
          },
        },
      },
    });

    const studentProfile = await prisma.studentProfile.findUnique({ where: { userId: user.id } });

    if (studentProfile) {
      await prisma.studentEnrollment.create({
        data: {
          studentId: studentProfile.id,
          sectionId: section.id,
          termId: sem1.id,
          status: AcademicStatus.ACTIVE,
        },
      });
    }
  }

  // ─── Assignment Templates ──────────────────────────────────────────────────
  await prisma.assignmentTemplate.createMany({
    data: [
      { name: 'Laboratory Experiment', category: AssignmentCategory.UPLOAD_BASED, maxMarks: 100, isGlobal: true, isMarkOnly: false },
      { name: 'Theory Assignment', category: AssignmentCategory.UPLOAD_BASED, maxMarks: 100, isGlobal: true, isMarkOnly: false },
      { name: 'Viva Voce', category: AssignmentCategory.MARKS_ONLY, maxMarks: 100, isGlobal: true, isMarkOnly: true },
    ],
  });

  console.log('Aurora ERP Seeded with REAL DATA successfully.');
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
