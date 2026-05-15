import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AcademicContextService } from '../academic/academic-context.service';
import { StorageService } from '../common/storage/storage.service';
import { AssignmentStatus, GradingStatus, Role, LifecycleStatus } from '@prisma/client';
import * as path from 'path';

type RequestUser = {
  userId: string;
  role: Role;
  facultyProfileId?: string | null;
};

@Injectable()
export class AssignmentsService {
  constructor(
    private prisma: PrismaService,
    private academicContext: AcademicContextService,
    private storage: StorageService,
  ) {}

  private async ensureAssignmentAccess(
    requester: RequestUser,
    resource: { assignmentId?: string; submissionId?: string },
  ) {
    if (requester.role === Role.ADMIN) return;

    const hasAccess = await this.academicContext.validateOwnership(
      requester.userId,
      requester.role,
      resource,
    );

    if (!hasAccess) {
      throw new ForbiddenException('You do not have permission to access this assignment resource');
    }
  }

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
      variant?: number;
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
        isArchived: false,
      },
    });

    if (!assignmentMapping) {
      throw new ForbiddenException('You do not have an active teaching assignment for this section/subject');
    }

    const sectionSubject = await this.prisma.sectionSubject.findFirst({
      where: {
        sectionId: data.sectionId,
        subjectId: data.subjectId,
        termId: activeSession.term.id,
        isActive: true,
      },
      select: { id: true },
    });

    if (!sectionSubject) {
      throw new BadRequestException('Subject is not assigned to the selected section');
    }

    return this.prisma.assignment.create({
      data: {
        title: data.title,
        instructions: data.instructions,
        templateId: data.templateId,
        sectionId: data.sectionId,
        subjectId: data.subjectId,
        maxMarks: data.maxMarks,
        dueDate: data.dueDate,
        variant: data.variant,
        allowResubmissions: data.allowResubmissions ?? true,
        facultyAssignmentId: assignmentMapping.id,
        academicYearId: activeSession.year.id,
        termId: activeSession.term.id,
        status: (data as any).status || AssignmentStatus.DRAFT,
      },
    });
  }

  /**
   * Archives an assignment.
   */
  async archiveAssignment(id: string, requester: RequestUser) {
    await this.ensureAssignmentAccess(requester, { assignmentId: id });

    return this.prisma.assignment.update({
      where: { id },
      data: {
        status: AssignmentStatus.ARCHIVED,
        archivedAt: new Date(),
      },
    });
  }

  /**
   * Deletes an assignment.
   */
  async deleteAssignment(id: string, requester: RequestUser) {
    try {
      await this.ensureAssignmentAccess(requester, { assignmentId: id });

      console.log(`[AssignmentsService] Deleting assignment ${id} requested by ${requester.userId}`);

      return await this.prisma.assignment.delete({
        where: { id },
      });
    } catch (error) {
      console.error(`[AssignmentsService] Failed to delete assignment ${id}:`, error);
      throw error;
    }
  }

  /**
   * Fetches all available assignment templates.
   */
  async getTemplates() {
    return this.prisma.assignmentTemplate.findMany({
      where: { isGlobal: true },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Publishes an assignment to students with a specific deadline.
   */
  async publishAssignment(id: string, requester: RequestUser, data?: { dueDate: Date }) {
    await this.ensureAssignmentAccess(requester, { assignmentId: id });

    return this.prisma.assignment.update({
      where: { id },
      data: { 
        status: AssignmentStatus.PUBLISHED,
        publishedAt: new Date(),
        ...(data?.dueDate && { dueDate: data.dueDate })
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
    if (!context.enrollment) {
      throw new ForbiddenException('No active enrollment found for this student');
    }
    if (
      assignment.sectionId !== context.enrollment.sectionId ||
      assignment.termId !== context.enrollment.termId
    ) {
      throw new ForbiddenException('You are not authorized to submit to this assignment');
    }

    const activeSectionSubject = await this.prisma.sectionSubject.findFirst({
      where: {
        sectionId: context.enrollment.sectionId,
        subjectId: assignment.subjectId,
        termId: context.enrollment.termId,
        isActive: true,
      },
      select: { id: true },
    });

    if (!activeSectionSubject) {
      throw new ForbiddenException('This assignment is not assigned to your section');
    }

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
    requester: RequestUser,
    data: { marks: number; feedback?: string }
  ) {
    await this.ensureAssignmentAccess(requester, { submissionId });

    const submission = await this.prisma.assignmentSubmission.findUnique({
      where: { id: submissionId },
      include: { assignment: true },
    });

    if (!submission) throw new NotFoundException('Submission not found');

    // ─── Operational Workflow Hardening ──────────────────────────────────────
    if (submission.assignment.status !== AssignmentStatus.PUBLISHED) {
      throw new BadRequestException(
        `Operational Constraint: Cannot grade a submission when the assignment is in ${submission.assignment.status} status. It must be PUBLISHED.`,
      );
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
          editedById: requester.userId,
        },
      });

      return tx.assignmentSubmission.update({
        where: { id: submissionId },
        data: {
          finalMarks: data.marks,
          feedback: data.feedback,
          gradingStatus: GradingStatus.GRADED,
          gradedAt: new Date(),
          gradedById: requester.role === Role.FACULTY ? requester.facultyProfileId ?? null : null,
        },
      });
    });
  }

  /**
   * Reopens an assignment for a specific student.
   */
  async reopenSubmission(submissionId: string, requester: RequestUser, reason?: string) {
    await this.ensureAssignmentAccess(requester, { submissionId });

    const submission = await this.prisma.assignmentSubmission.findUnique({
      where: { id: submissionId },
      include: { assignment: true },
    });

    if (!submission) throw new NotFoundException('Submission not found');
    if (submission.assignment.status !== AssignmentStatus.PUBLISHED) {
      throw new BadRequestException('Only published assignments can be reopened');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.assignmentAudit.create({
        data: {
          assignmentId: submission.assignmentId,
          assignmentSubmissionId: submission.id,
          action: 'SUBMISSION_REOPENED',
          reason,
          editedById: requester.userId,
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
  /**
   * Automatically ensures all global assignment templates exist as DRAFTS 
   * for a specific section and subject.
   */
  async syncDraftsForSection(facultyId: string, sectionId: string, subjectId: string) {
    console.log(`[AssignmentsService] Syncing drafts for Faculty:${facultyId}, Section:${sectionId}, Subject:${subjectId}`);
    
    const activeSession = await this.academicContext.getActiveAcademicSession();
    if (!activeSession) {
      console.warn('[AssignmentsService] Sync failed: No active academic session');
      return;
    }

    const templates = await this.getTemplates();
    console.log(`[AssignmentsService] Found ${templates.length} global templates to sync`);
    
    const facultyAssignment = await this.prisma.facultyAssignment.findFirst({
      where: { 
        facultyId, 
        sectionId, 
        subjectId, 
        status: LifecycleStatus.ACTIVE 
      }
    });

    if (!facultyAssignment) {
      console.warn('[AssignmentsService] Sync failed: Faculty does not own this mapping');
      return;
    }

    let createdCount = 0;
    for (const template of templates) {
      // Check if this template already exists for this section/subject
      const exists = await this.prisma.assignment.findFirst({
        where: {
          sectionId,
          subjectId,
          templateId: template.id,
          status: { not: AssignmentStatus.ARCHIVED }
        }
      });

      if (!exists) {
        // Create permanent draft
        await this.prisma.assignment.create({
          data: {
            title: template.name,
            instructions: `Standard ${template.name} submission guidelines apply.`,
            templateId: template.id,
            sectionId,
            subjectId,
            facultyAssignmentId: facultyAssignment.id,
            academicYearId: activeSession.year.id,
            termId: activeSession.term.id,
            maxMarks: template.maxMarks,
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default 1 week out
            status: AssignmentStatus.DRAFT
          }
        });
        createdCount++;
      }
    }
    console.log(`[AssignmentsService] Sync complete. Created ${createdCount} new drafts.`);
  }
}
