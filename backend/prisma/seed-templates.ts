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
  console.log('Aurora ERP — Seeding Assignment Templates...');

  // ─── Clean Templates Only ──────────────────────────────────────────────────
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

  for (const t of templates) {
    await prisma.assignmentTemplate.create({
      data: {
        name: t.name,
        category: t.category,
        maxMarks: t.maxMarks,
        isMarkOnly: t.isMarkOnly,
        isGlobal: true,
      },
    });
  }

  console.log(`Seeded ${templates.length} assignment templates.`);
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
