import "dotenv/config";
import { PrismaClient, Role, AssignmentCategory, LifecycleStatus, AcademicStatus, AssignmentStatus, GradingStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as argon2 from 'argon2';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Aurora ERP — Simplified Institutional Rebuild...');
  const passwordHash = await argon2.hash('Aurora@123');

  // ─── Foundation ─────────────────────────────────────────────────────────────
  const deptCSE = await prisma.department.upsert({
    where: { code: 'CSE' },
    update: {},
    create: { name: 'Computer Science & Engineering', code: 'CSE' },
  });

  const courseCSE = await prisma.course.upsert({
    where: { code: 'BT-CSE-FSD' },
    update: {},
    create: { 
      name: 'B.Tech Computer Science - Full Stack Development', 
      code: 'BT-CSE-FSD', 
      departmentId: deptCSE.id 
    },
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
  const sec1A = await prisma.section.upsert({
    where: { termId_name: { termId: sem1.id, name: 'CSE(FSD)-1A' } },
    update: {},
    create: { name: 'CSE(FSD)-1A', termId: sem1.id },
  });

  const sec1B = await prisma.section.upsert({
    where: { termId_name: { termId: sem1.id, name: 'CSE(FSD)-1B' } },
    update: {},
    create: { name: 'CSE(FSD)-1B', termId: sem1.id },
  });

  // ─── Faculty & Subjects ─────────────────────────────────────────────────────
  const facultyData = [
    { name: 'Joel Prasanth', email: 'joel.prasanth@aurora.ac.in', subject: 'Advanced Frontend Development', code: 'CS-AFD' },
    { name: 'Jakka Prasanth', email: 'jakka.prasanth@aurora.ac.in', subject: 'Database Management System-DBMS', code: 'CS-DBMS' },
    { name: 'Dubbaka Raju', email: 'dubbaka.raju@aurora.ac.in', subject: 'Physics', code: 'BSC-PHY' },
    { name: 'Helal Ahmed Farhan', email: 'helal.farhan@aurora.ac.in', subject: 'Engineering Practice', code: 'ESC-EP' },
  ];

  for (const f of facultyData) {
    const subject = await prisma.subject.upsert({
      where: { termId_code: { termId: sem1.id, code: f.code } },
      update: { termId: sem1.id },
      create: { name: f.subject, code: f.code, termId: sem1.id },
    });

    const nameParts = f.name.split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || 'Faculty';

    const user = await prisma.user.upsert({
      where: { email: f.email },
      update: { passwordHash, role: Role.FACULTY },
      create: {
        email: f.email,
        passwordHash,
        role: Role.FACULTY,
        facultyProfile: {
          create: {
            firstName,
            lastName,
            staffId: `FAC-${f.code}`,
            designation: 'Professor',
          },
        },
      },
    });

    const facultyProfile = await prisma.facultyProfile.findUnique({ where: { userId: user.id } });

    if (facultyProfile) {
      for (const section of [sec1A, sec1B]) {
        await prisma.sectionSubject.upsert({
          where: { sectionId_subjectId: { sectionId: section.id, subjectId: subject.id } },
          update: { termId: sem1.id },
          create: { sectionId: section.id, subjectId: subject.id, termId: sem1.id },
        });

        await prisma.facultyAssignment.upsert({
          where: { facultyId_sectionId_subjectId_termId: { facultyId: facultyProfile.id, sectionId: section.id, subjectId: subject.id, termId: sem1.id } },
          update: { status: LifecycleStatus.ACTIVE },
          create: {
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

  // ─── Students ───────────────────────────────────────────────────────────────
  const studentRecords = [
    { name: 'DEVANANDI ABHIRAM', email: 'abhiramdevanandi45@gmail.com', sec: '1A' },
    { name: 'DUDEKULA FAREEDVALI', email: 'fareedvali0708@gmail.com', sec: '1A' },
    { name: 'DUVVAKA DEEKSHITH', email: 'deekshithduvvaka@gmail.com', sec: '1A' },
    { name: 'EDHARA NAGA SAI MANOHAR', email: 'edharanagasaimanohar@gmail.com', sec: '1A' },
    { name: 'GANDAM ARCHANA', email: 'gandamarchana01@gmail.com', sec: '1A' },
    { name: 'GANGURI YOGENDRA SAI', email: 'radharadha4153@gmail.com', sec: '1A' },
    { name: 'GAVIT PRAJWAL MURLIDHAR', email: 'gavitprajwal9@gmail.com', sec: '1A' },
    { name: 'GAVVALA SANDEEP', email: 'sandeepgavala699@gmail.com', sec: '1A' },
    { name: 'GOLLACHENNU SRI NAKSHATHRA', email: 'plsapien7@gmail.com', sec: '1A' },
    { name: 'GOLLAPALLI VISHNU VARDHAN', email: 'iamviva07@gmail.com', sec: '1A' },
    { name: 'GOPURAMONI SPANDHANA', email: 'gopuramonispandana@gmail.com', sec: '1A' },
    { name: 'GOTTIMUKKALA ABHINAV CHARY', email: 'charyabhinav23@gmail.com', sec: '1A' },
    { name: 'GUNDRA SAI VENKATA AISHWWARYA', email: 'gsvaishwwarya07@gmail.com', sec: '1A' },
    { name: 'HATAWATE HARIOM NAVNATH', email: 'hariomhatvate@gmail.com', sec: '1A' },
    { name: 'JILLA SAI MITHUN', email: 'mithun.jilla08@gmail.com', sec: '1A' },
    { name: 'K NITHIN', email: 'kethavathn34@gmail.com', sec: '1A' },
    { name: 'K PAVAN KUMAR', email: 'pavank01437@gmail.com', sec: '1A' },
    { name: 'KALISETTY DHANUNJAY', email: 'dhanukalisetty@gmail.com', sec: '1A' },
    { name: 'KALWOJU VAMSHI KRISHNA', email: 'kpcmvamshlucky2713@gmail.com', sec: '1A' },
    { name: 'KANAPURAM NIVEDH', email: 'nivexddhhh.spam@gmail.com', sec: '1A' },
    { name: 'KARANGI HELVESTON JOHN HENRY', email: 'helvisjohn13@gmail.com', sec: '1A' },
    { name: 'KASOJU SAINATH CHARY', email: 'sainathchary075@gmail.com', sec: '1A' },
    { name: 'KATTA CHARAN RAJ', email: 'kattacharanraj123@gmail.com', sec: '1A' },
    { name: 'KOTA AAROH', email: 'aarohrajput33@gmail.com', sec: '1A' },
    { name: 'KOTHA ABHINAV', email: 'kothaabhinav444@gmail.com', sec: '1A' },
    { name: 'KOVELAKUNTLA SAMEERA', email: 'ksameera79097@gmail.com', sec: '1A' },
    { name: 'KURUVA MOHITH KUMAR', email: 'kuruvamohith@gmail.com', sec: '1A' },
    { name: 'MADURU SAMPATH KUMAR REDDY', email: 'madurusampathkumarreddy@gmail.com', sec: '1B' },
    { name: 'MALLA DHARMIK SATYA', email: 'malladharmiksatya@gmail.com', sec: '1B' },
    { name: 'MANIVISETTI JAHNAVI', email: 'jahnavimanivisetti@gmail.com', sec: '1B' },
    { name: 'MARTHALA VENKATA TEJASRI', email: 'marthalatejasri123@gmail.com', sec: '1B' },
    { name: 'MATHAMSETTY HITHESH', email: 'rambabu94913@gmail.com', sec: '1B' },
    { name: 'MUTTHULURU PUNITH SAI', email: 'mutthuluru.punith@gmail.com', sec: '1B' },
    { name: 'NALLAMEKALA YAGNESH', email: 'nallamekalayagnesh31@gmail.com', sec: '1B' },
    { name: 'NARAHARI SHASHIVADANA', email: 'shashivadhana53@gmail.com', sec: '1B' },
    { name: 'NAREDDY ANANTHA KRISHNA PRIYA', email: 'nareddykrishnapriya@gmail.com', sec: '1B' },
    { name: 'NEELAPU SAI KRISHNA REDDY', email: 'neelapusaikrishna2277@gmail.com', sec: '1B' },
    { name: 'OMSHREE VREGLUM', email: 'omshrivreglum@gmail.com', sec: '1B' },
    { name: 'ORRELA SWAMY', email: 'swamyorrelaorrelaswamy@gmail.com', sec: '1B' },
    { name: 'P MANISH', email: 'man2323sh@gmail.com', sec: '1B' },
    { name: 'P SHESHA SAI', email: 'sheshasaimudiraj@gmail.com', sec: '1B' },
    { name: 'PADALA ANEESH', email: 'chinnalasahadevsahadev@gmail.com', sec: '1B' },
    { name: 'pakala ashwanth', email: 'ashwanthtreddypakala@gmail.com', sec: '1B' },
    { name: 'PALLAPATI SUVIDHA', email: 'vivekpallapati83@gmail.com', sec: '1B' },
    { name: 'PALUSA SAI MOKSHITH GOUD', email: 'chinnug295@gmail.com', sec: '1B' },
    { name: 'PANTANAMONI VIGHNESH', email: 'vighnesh.chintu25@gmail.com', sec: '1B' },
    { name: 'PARASA SANDEEP SAMUEL', email: 'sanjaysamuel.333@gmail.com', sec: '1B' },
    { name: 'PATAN HARSHAD BHASHA', email: 'patanharshad786@gmail.com', sec: '1B' },
    { name: 'PATHIPATI VENKATA SAI THEJESH', email: 'pvstejeshtejesh@gmail.com', sec: '1B' },
    { name: 'PEDDI AKSHARA', email: 'peddiakshara20@gmail.com', sec: '1B' },
    { name: 'PILLI NITHIN SAIBABA', email: 'nithinsaipilli@gmail.com', sec: '1B' },
    { name: 'POLICE DEEKSHITH KUMAR REDDY', email: 'policedeekshith2006@gmail.com', sec: '1B' },
    { name: 'PULAMALA NANDHA KISHOR', email: 'nandhakishorpulamala@gmail.com', sec: '1B' },
    { name: 'PULLAGURA PRADEEP YADAV', email: 'pradeepyadavpullagura@gmail.com', sec: '1B' },
    { name: 'RAGIMAN SAI JASHWANTH REDDY', email: 'saijashureddys@gmail.com', sec: '1B' },
    { name: 'RESHAM KARTHIK', email: 'reshamkrishna9@gmail.com', sec: '1B' },
    { name: 'SABBITI UJWAL NAVDEEP', email: 'svenkataramanayya@gmail.com', sec: '1B' },
    { name: 'SEELAM SRI BHARGAV', email: 'seelam.bhargav@gmail.com', sec: '1B' },
    { name: 'SHAIK SOHAIL TANVEER', email: 'tanveer9912317174@gmail.com', sec: '1B' },
    { name: 'SIRIPURAM NIVAS', email: 'siripuramnivas53@gmail.com', sec: '1B' },
    { name: 'THAMMALA SAKETH', email: 'sakeththammala992@gmail.com', sec: '1B' },
    { name: 'THIRUSULA APURUP SIDDARDHA', email: 'tirusulasiddu@gmail.com', sec: '1B' },
    { name: 'TIDUTLA SREEKAR', email: 'sreekarsree681@gmail.com', sec: '1B' },
    { name: 'UNDAVALLI LOKA NAGA SRIVIJAY', email: 'anilkondragunta1989@gmail.com', sec: '1B' },
    { name: 'UPPARI VARUN KUMAR', email: 'uvarunsagar@gmail.com', sec: '1B' },
    { name: 'VAITLA BILWANATH', email: 'vaitlabinnu@gmail.com', sec: '1B' },
    { name: 'VEERA DHARAN SRI DATTA', email: 'dharansridatta@gmail.com', sec: '1B' },
    { name: 'VEERLA SIVA DURGA PRASAD', email: 'veerlasivadurgaprasad@gmail.com', sec: '1B' },
    { name: 'YADAGIRI NIKSHITH', email: 'nikshithyadhagiri@gmail.com', sec: '1B' },
    { name: 'YALLAVULA NAGA VENKAT PAVAN SAI', email: 'pavanrss30@gmail.com', sec: '1B' },
    { name: 'YELLURI NAVADEEP KUMAR', email: 'yellurinavadeepkumar@gmail.com', sec: '1B' },
    { name: 'ASHABOINA BHANU PRAKASH', email: 'bhanyav1137@gmail.com', sec: '1B' },
    { name: 'CHAVALAM KEERTHI SRI', email: 'chavalamkeerthisri7@gmail.com', sec: '1B' },
  ];

  for (let i = 0; i < studentRecords.length; i++) {
    const s = studentRecords[i];
    const section = s.sec === '1A' ? sec1A : sec1B;
    const nameParts = s.name.split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || 'Student';
    const regNo = `252U1R${(i + 1).toString().padStart(4, '0')}`;

    const user = await prisma.user.upsert({
      where: { email: s.email },
      update: { passwordHash, role: Role.STUDENT },
      create: {
        email: s.email,
        passwordHash,
        role: Role.STUDENT,
        studentProfile: {
          create: {
            firstName,
            lastName,
            registrationNumber: regNo,
            sectionId: section.id,
          },
        },
      },
    });

    const studentProfile = await prisma.studentProfile.findUnique({ where: { userId: user.id } });

    if (studentProfile) {
      await prisma.studentEnrollment.upsert({
        where: { studentId_termId: { studentId: studentProfile.id, termId: sem1.id } },
        update: { status: AcademicStatus.ACTIVE },
        create: {
          studentId: studentProfile.id,
          sectionId: section.id,
          termId: sem1.id,
          status: AcademicStatus.ACTIVE,
        },
      });
    }
  }

  // ─── Admin ──────────────────────────────────────────────────────────────────
  await prisma.user.upsert({
    where: { email: 'admin@aurora.ac.in' },
    update: { passwordHash, isActive: true },
    create: {
      email: 'admin@aurora.ac.in',
      passwordHash,
      role: Role.ADMIN,
      adminProfile: { create: { firstName: 'Aurora', lastName: 'Admin' } },
    },
  });

  // ─── Templates & Assignments ────────────────────────────────────────────────
  console.log('Aurora ERP — Seeding Assignment Templates...');
  
  // Clean existing assignments and templates first
  await prisma.assignment.deleteMany();
  await prisma.assignmentTemplate.deleteMany();

  const templates = [
    // SUBMISSION-BASED (Require PDF upload + faculty review + grading)
    { name: 'Reflective Journal', category: AssignmentCategory.UPLOAD_BASED, maxMarks: 20, isMarkOnly: false },
    { name: 'Lab Journal', category: AssignmentCategory.UPLOAD_BASED, maxMarks: 20, isMarkOnly: false },
    { name: 'Assignment', category: AssignmentCategory.UPLOAD_BASED, maxMarks: 100, isMarkOnly: false },
    { name: 'Group Assignment', category: AssignmentCategory.UPLOAD_BASED, maxMarks: 100, isMarkOnly: false },
    { name: 'Project Report', category: AssignmentCategory.UPLOAD_BASED, maxMarks: 200, isMarkOnly: false },
    { name: 'Case Study / Journal Review', category: AssignmentCategory.UPLOAD_BASED, maxMarks: 100, isMarkOnly: false },

    // MARKS-ONLY (No file upload — faculty directly enters marks)
    { name: 'Student Lecture', category: AssignmentCategory.MARKS_ONLY, maxMarks: 50, isMarkOnly: true },
    { name: 'Presentation', category: AssignmentCategory.MARKS_ONLY, maxMarks: 100, isMarkOnly: true },
    { name: 'Lab Participation', category: AssignmentCategory.MARKS_ONLY, maxMarks: 10, isMarkOnly: true },
    { name: 'Quiz', category: AssignmentCategory.MARKS_ONLY, maxMarks: 20, isMarkOnly: true },
    { name: 'Lab Quiz', category: AssignmentCategory.MARKS_ONLY, maxMarks: 25, isMarkOnly: true },
  ];

  // Fetch faculty assignments to link assignments to
  const facultyAssignments = await prisma.facultyAssignment.findMany({
    where: { termId: sem1.id },
    include: { subject: true }
  });

  for (const t of templates) {
    const template = await prisma.assignmentTemplate.create({
      data: {
        name: t.name,
        category: t.category,
        maxMarks: t.maxMarks,
        isMarkOnly: t.isMarkOnly,
        isGlobal: true,
      },
    });

    // Create one assignment for each section-subject for the first template only 
    // (to avoid cluttering the demo, but you can change this)
    if (t.name === 'Assignment' || t.name === 'Quiz') {
      for (const fa of facultyAssignments) {
        await prisma.assignment.create({
          data: {
            title: `${fa.subject.name} - ${template.name}`,
            templateId: template.id,
            sectionId: fa.sectionId,
            subjectId: fa.subjectId,
            facultyAssignmentId: fa.id,
            academicYearId: year1.id,
            termId: sem1.id,
            maxMarks: template.maxMarks,
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
            status: AssignmentStatus.PUBLISHED,
            publishedAt: new Date(),
          }
        });
      }
    }
  }

  console.log('Aurora ERP Seeded successfully with REAL DATA.');
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
