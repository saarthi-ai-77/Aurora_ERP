import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AcademicContextService } from '../academic/academic-context.service';
import { StorageService } from '../common/storage/storage.service';
import { AssignmentStatus, GradingStatus, Role, LifecycleStatus, Prisma } from '@prisma/client';
import * as path from 'path';

@Injectable()
export class AssignmentsService {
  constructor(
    private prisma: PrismaService,
    private academicContext: AcademicContextService,
    private storage: StorageService,
  ) {}

  /**
   * Creates a new assignment in DRAFT state.
   */
  async createAssignment(
    facultyId: string,
    data: {
      title: string;
      instructions?: string;
      templateId: string;
      sectionId: string;
      subjectId: string;
      maxMarks: number;
      dueDate: Date;
      allowResubmissions?: boolean;
    }
  ) {
    const activeSession = await this.academicContext.getActiveAcademicSession();
    if (!activeSession) {
      throw new BadRequestException('No active academic session found');
    }

    // Validate Faculty Assignment Ownership
    const assignmentMapping = await this.prisma.facultyAssignment.findFirst({
      where: {
        facultyId,
        sectionId: data.sectionId,
        subjectId: data.subjectId,
        termId: activeSession.term.id,
        status: LifecycleStatus.ACTIVE,
      },
    });

    if (!assignmentMapping) {
      throw new ForbiddenException('You do not have an active teaching assignment for this section/subject');
    }

    return this.prisma.assignment.create({
      data: {
        ...data,
        facultyAssignmentId: assignmentMapping.id,
        academicYearId: activeSession.year.id,
        termId: activeSession.term.id,
        status: AssignmentStatus.DRAFT,
      },
    });
  }

  /**
   * Publishes an assignment to students.
   */
  async publishAssignment(id: string) {
    return this.prisma.assignment.update({
      where: { id },
      data: { 
        status: AssignmentStatus.PUBLISHED,
        publishedAt: new Date()
      },
    });
  }

  /**
   * Submits or resubmits an assignment for a student.
   * Transactional versioning.
   */
  async submitAssignment(
    assignmentId: string,
    userId: string,
    file: Express.Multer.File
  ) {
    // 1. Resolve Student Context
    const context = await this.academicContext.resolveStudentContext(userId);
    const assignment = await this.prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: { template: { select: { isMarkOnly: true, category: true } } },
    });

    if (!assignment) throw new NotFoundException('Assignment not found');
    if (assignment.status !== AssignmentStatus.PUBLISHED) {
      throw new BadRequestException('This assignment is not open for submissions');
    }

    // Reject file uploads for MARKS_ONLY assignments
    if (assignment.template.isMarkOnly && file) {
      throw new BadRequestException('This assignment type does not accept file uploads');
    }

    // Require file for UPLOAD_BASED assignments
    if (!assignment.template.isMarkOnly && !file) {
      throw new BadRequestException('A PDF file is required for this assignment type');
    }

    // 2. Validate Deadline (unless reopened)
    const existingSubmission = await this.prisma.assignmentSubmission.findUnique({
      where: {
        assignmentId_studentEnrollmentId: {
          assignmentId,
          studentEnrollmentId: context.enrollment.id,
        },
      },
    });

    const isAfterDeadline = new Date() > assignment.dueDate;
    const isReopened = existingSubmission?.gradingStatus === GradingStatus.REOPENED;

    if (isAfterDeadline && !isReopened) {
      throw new BadRequestException('Submission deadline has passed');
    }

    // 3. File validation (PDF only, 3MB max) — only for upload-based
    if (file) {
      if (file.mimetype !== 'application/pdf') {
        throw new BadRequestException('Only PDF files are accepted');
      }
      if (file.size > 3 * 1024 * 1024) {
        throw new BadRequestException('File size cannot exceed 3MB');
      }
    }

    // 4. Upload File (only for UPLOAD_BASED)
    const storageKey = file
      ? await this.storage.uploadFile(file, `assignments/${assignmentId}/${userId}`)
      : null;

    // 5. Transactional versioning
    return this.prisma.$transaction(async (tx) => {
      // Find or create submission container
      let submission = existingSubmission;
      if (!submission) {
        submission = await tx.assignmentSubmission.create({
          data: {
            assignmentId,
            studentEnrollmentId: context.enrollment.id,
            gradingStatus: GradingStatus.SUBMITTED,
          },
        });
      }

      // Create new version
      const versionCount = await tx.submissionVersion.count({
        where: { assignmentSubmissionId: submission.id }
      });

      // For MARKS_ONLY: create a version record with empty file metadata
      const version = await tx.submissionVersion.create({
        data: {
          assignmentSubmissionId: submission.id,
          storageKey: storageKey ?? 'marks-only',
          originalFilename: file?.originalname ?? 'marks-only',
          mimeType: file?.mimetype ?? 'application/octet-stream',
          extension: file ? path.extname(file.originalname) : '',
          fileSize: file?.size ?? 0,
          versionNumber: versionCount + 1,
          uploadedById: userId,
        },
      });

      // Update submission container with latest version
      return tx.assignmentSubmission.update({
        where: { id: submission.id },
        data: {
          latestVersionId: version.id,
          gradingStatus: GradingStatus.SUBMITTED,
          submittedAt: new Date(),
          isLateSubmission: isAfterDeadline,
        },
      });
    });
  }

  /**
   * Grades a submission.
   */
  async gradeSubmission(
    submissionId: string,
    facultyId: string,
    data: { marks: number; feedback?: string }
  ) {
    const submission = await this.prisma.assignmentSubmission.findUnique({
      where: { id: submissionId },
      include: { assignment: true },
    });

    if (!submission) throw new NotFoundException('Submission not found');

    // Validate faculty assignment match
    const mapping = await this.prisma.facultyAssignment.findFirst({
      where: {
        facultyId,
        sectionId: submission.assignment.sectionId,
        subjectId: submission.assignment.subjectId,
      },
    });

    if (!mapping) {
      throw new ForbiddenException('You are not authorized to grade this section');
    }

    return this.prisma.$transaction(async (tx) => {
      // Log Audit
      await tx.assignmentAudit.create({
        data: {
          assignmentId: submission.assignmentId,
          assignmentSubmissionId: submission.id,
          action: 'GRADE_UPDATED',
          previousValue: { marks: submission.finalMarks?.toString(), feedback: submission.feedback },
          newValue: { marks: data.marks.toString(), feedback: data.feedback },
          editedById: (await tx.facultyProfile.findUnique({ where: { id: facultyId } }))!.userId,
        },
      });

      return tx.assignmentSubmission.update({
        where: { id: submissionId },
        data: {
          finalMarks: data.marks,
          feedback: data.feedback,
          gradingStatus: GradingStatus.GRADED,
          gradedAt: new Date(),
          gradedById: facultyId,
        },
      });
    });
  }

  /**
   * Reopens an assignment for a specific student.
   */
  async reopenSubmission(submissionId: string, facultyId: string, reason?: string) {
    const submission = await this.prisma.assignmentSubmission.findUnique({
      where: { id: submissionId },
    });

    if (!submission) throw new NotFoundException('Submission not found');

    return this.prisma.$transaction(async (tx) => {
      await tx.assignmentAudit.create({
        data: {
          assignmentId: submission.assignmentId,
          assignmentSubmissionId: submission.id,
          action: 'SUBMISSION_REOPENED',
          reason,
          editedById: (await tx.facultyProfile.findUnique({ where: { id: facultyId } }))!.userId,
        },
      });

      return tx.assignmentSubmission.update({
        where: { id: submissionId },
        data: {
          gradingStatus: GradingStatus.REOPENED,
          reopenedAt: new Date(),
        },
      });
    });
  }
}
