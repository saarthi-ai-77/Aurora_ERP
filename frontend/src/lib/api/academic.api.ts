import { api } from "./axios.instance";
import { ApiSuccessResponse } from "@shared/contracts/api.contracts";

export const academicApi = {
  getActiveSession: async () => {
    const response = await api.get<ApiSuccessResponse<any>>("/academic/session");
    return response.data;
  },

  getAcademicTree: async () => {
    const response = await api.get<ApiSuccessResponse<any[]>>("/academic/tree");
    return response.data;
  },

  getMyContext: async () => {
    const response = await api.get<ApiSuccessResponse<any>>("/academic/context/me");
    return response.data;
  },

  getStructure: async () => {
    const response = await api.get<ApiSuccessResponse<any>>("/academic/structure");
    return response.data;
  },

  // ─── E1: Section Management ────────────────────────────────────────────────

  createSection: async (dto: { name: string; termId: string }) => {
    const response = await api.post<ApiSuccessResponse<any>>("/academic/sections", dto);
    return response.data;
  },

  getSectionDetail: async (id: string) => {
    const response = await api.get<ApiSuccessResponse<any>>(`/academic/sections/${id}`);
    return response.data;
  },

  addStudentsToSection: async (sectionId: string, studentIds: string[]) => {
    const response = await api.post<ApiSuccessResponse<any>>(
      `/academic/sections/${sectionId}/students`,
      { studentIds },
    );
    return response.data;
  },

  removeStudentFromSection: async (sectionId: string, studentId: string) => {
    const response = await api.delete<ApiSuccessResponse<any>>(
      `/academic/sections/${sectionId}/students/${studentId}`,
    );
    return response.data;
  },

  assignSubjectToSection: async (sectionId: string, subjectId: string) => {
    const response = await api.post<ApiSuccessResponse<any>>(
      `/academic/sections/${sectionId}/subjects`,
      { subjectId },
    );
    return response.data;
  },

  removeSubjectFromSection: async (sectionId: string, subjectId: string) => {
    const response = await api.delete<ApiSuccessResponse<any>>(
      `/academic/sections/${sectionId}/subjects/${subjectId}`,
    );
    return response.data;
  },

  // ─── E2: Subject Management ────────────────────────────────────────────────

  createSubject: async (dto: { name: string; code: string; termId: string; credits?: number }) => {
    const response = await api.post<ApiSuccessResponse<any>>("/academic/subjects", dto);
    return response.data;
  },

  updateSubject: async (id: string, dto: { name?: string; credits?: number }) => {
    const response = await api.patch<ApiSuccessResponse<any>>(`/academic/subjects/${id}`, dto);
    return response.data;
  },

  archiveSubject: async (id: string) => {
    const response = await api.post<ApiSuccessResponse<any>>(`/academic/subjects/${id}/archive`);
    return response.data;
  },

  getTermSubjects: async (termId: string) => {
    const response = await api.get<ApiSuccessResponse<any[]>>(`/academic/terms/${termId}/subjects`);
    return response.data;
  },

  // ─── E3: Faculty Assignment Management ────────────────────────────────────

  createFacultyAssignment: async (dto: {
    facultyId: string;
    sectionId: string;
    subjectId: string;
    termId: string;
    yearId: string;
  }) => {
    const response = await api.post<ApiSuccessResponse<any>>("/academic/faculty-assignments", dto);
    return response.data;
  },

  revokeFacultyAssignment: async (id: string) => {
    const response = await api.delete<ApiSuccessResponse<any>>(
      `/academic/faculty-assignments/${id}`,
    );
    return response.data;
  },

  getAllFacultyAssignments: async () => {
    const response = await api.get<ApiSuccessResponse<any[]>>("/academic/faculty-assignments");
    return response.data;
  },

  getFacultyAssignments: async (facultyId: string) => {
    const response = await api.get<ApiSuccessResponse<any[]>>(
      `/academic/faculty/${facultyId}/assignments`,
    );
    return response.data;
  },
};
