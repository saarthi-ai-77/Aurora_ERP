import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AcademicContextService } from './academic-context.service';
import { AcademicEngineService } from './services/academic-engine.service';
import { EnrollmentService } from './services/enrollment.service';
import { FacultyAssignmentService } from './services/faculty-assignment.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { AcademicAccessGuard } from '../common/guards/academic-access.guard';
import {
  CreateSectionDto,
  AddStudentsDto,
  CreateSubjectDto,
  UpdateSubjectDto,
  CreateFacultyAssignmentDto,
  AssignSubjectToSectionDto,
} from './dto/academic-admin.dto';

@Controller('academic')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AcademicController {
  constructor(
    private academicContext: AcademicContextService,
    private academicEngine: AcademicEngineService,
    private enrollmentService: EnrollmentService,
    private facultyAssignmentService: FacultyAssignmentService,
  ) {}

  // ─── Academic Context ────────────────────────────────────────────────────────

  @Get('session')
  async getActiveSession() {
    return this.academicContext.getActiveAcademicSession();
  }

  @Get('tree')
  @Roles(Role.ADMIN)
  async getAcademicTree() {
    return this.academicEngine.getAcademicTree();
  }

  @Get('structure')
  @Roles(Role.ADMIN, Role.FACULTY)
  async getStructure() {
    return this.academicEngine.getStructure();
  }

  @Get('departments')
  @Roles(Role.ADMIN, Role.FACULTY)
  async getDepartments() {
    return this.academicEngine.getDepartments();
  }

  @Get('departments/:id/courses')
  @Roles(Role.ADMIN, Role.FACULTY)
  async getCourses(@Param('id', ParseUUIDPipe) id: string) {
    return this.academicEngine.getCourses(id);
  }

  @Get('courses/:id/years')
  @Roles(Role.ADMIN, Role.FACULTY)
  async getYears(@Param('id', ParseUUIDPipe) id: string) {
    return this.academicEngine.getYears(id);
  }

  @Get('years/:id/terms')
  @Roles(Role.ADMIN, Role.FACULTY)
  async getTerms(@Param('id', ParseUUIDPipe) id: string) {
    return this.academicEngine.getTerms(id);
  }

  @Get('terms/:id/sections')
  @Roles(Role.ADMIN, Role.FACULTY)
  async getSections(@Param('id', ParseUUIDPipe) id: string) {
    return this.academicEngine.getSections(id);
  }

  @Get('context/me')
  async getMyContext(@Req() req: any) {
    if (req.user.role === Role.STUDENT) {
      return this.academicContext.resolveStudentContext(req.user.userId);
    }
    if (req.user.role === Role.FACULTY) {
      return this.academicContext.resolveFacultyContext(req.user.userId);
    }
    return { role: req.user.role, message: 'Admin has no specific academic context' };
  }

  // ─── E1: Section Management (Admin only) ─────────────────────────────────────

  @Post('sections')
  @Roles(Role.ADMIN)
  async createSection(@Body() dto: CreateSectionDto) {
    return this.academicEngine.createSection(dto);
  }

  @Get('sections/:id')
  @Roles(Role.ADMIN)
  async getSectionDetail(@Param('id', ParseUUIDPipe) id: string) {
    return this.academicEngine.getSectionDetail(id);
  }

  @Post('sections/:id/students')
  @Roles(Role.ADMIN)
  async addStudentsToSection(
    @Param('id', ParseUUIDPipe) sectionId: string,
    @Body() dto: AddStudentsDto,
  ) {
    // Resolve the section's termId before delegating to enrollment service
    const section = await this.academicEngine.getSectionDetail(sectionId);
    return this.enrollmentService.addStudentsToSection(sectionId, dto.studentIds, section.term.id);
  }

  @Get('sections/:sectionId/students')
  @Roles(Role.ADMIN, Role.FACULTY)
  async getSectionStudents(
    @Param('sectionId', ParseUUIDPipe) sectionId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.academicEngine.getSectionStudents(sectionId, query);
  }

  @Delete('sections/:id/students/:studentId')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  async removeStudentFromSection(
    @Param('id', ParseUUIDPipe) sectionId: string,
    @Param('studentId', ParseUUIDPipe) studentId: string,
  ) {
    return this.enrollmentService.removeStudentFromSection(sectionId, studentId);
  }

  @Post('sections/:id/subjects')
  @Roles(Role.ADMIN)
  async assignSubjectToSection(
    @Param('id', ParseUUIDPipe) sectionId: string,
    @Body() dto: AssignSubjectToSectionDto,
  ) {
    return this.academicEngine.assignSubjectToSection(sectionId, dto.subjectId);
  }

  @Delete('sections/:id/subjects/:subjectId')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  async removeSubjectFromSection(
    @Param('id', ParseUUIDPipe) sectionId: string,
    @Param('subjectId', ParseUUIDPipe) subjectId: string,
  ) {
    return this.academicEngine.removeSubjectFromSection(sectionId, subjectId);
  }

  // ─── E2: Subject Management (Admin only) ─────────────────────────────────────

  @Post('subjects')
  @Roles(Role.ADMIN)
  async createSubject(@Body() dto: CreateSubjectDto) {
    return this.academicEngine.createSubject(dto);
  }

  @Patch('subjects/:id')
  @Roles(Role.ADMIN)
  async updateSubject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSubjectDto,
  ) {
    return this.academicEngine.updateSubject(id, dto);
  }

  @Post('subjects/:id/archive')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  async archiveSubject(@Param('id', ParseUUIDPipe) id: string) {
    return this.academicEngine.archiveSubject(id);
  }

  @Get('terms/:id/subjects')
  @Roles(Role.ADMIN, Role.FACULTY)
  async getTermSubjects(@Param('id', ParseUUIDPipe) id: string) {
    return this.academicEngine.getTermSubjects(id);
  }

  // ─── E3: Faculty Assignment Management ───────────────────────────────────────

  @Post('faculty-assignments')
  @Roles(Role.ADMIN)
  async createFacultyAssignment(@Body() dto: CreateFacultyAssignmentDto) {
    return this.facultyAssignmentService.assignFaculty(dto);
  }

  @Delete('faculty-assignments/:id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  async revokeFacultyAssignment(@Param('id', ParseUUIDPipe) id: string) {
    return this.facultyAssignmentService.revokeAssignment(id);
  }

  @Get('faculty-assignments')
  @Roles(Role.ADMIN)
  async getAllFacultyAssignments() {
    return this.facultyAssignmentService.getAllActiveAssignments();
  }

  @Get('faculty/:id/assignments')
  @Roles(Role.ADMIN)
  async getFacultyAssignments(@Param('id', ParseUUIDPipe) id: string) {
    return this.facultyAssignmentService.getFacultyAssignments(id);
  }
}
