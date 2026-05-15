import { api } from "./axios.instance";
import { ApiSuccessResponse } from "@shared/contracts/api.contracts";

export const assignmentsApi = {
  getTemplates: async () => {
    const response = await api.get<ApiSuccessResponse<any[]>>("/assignments/templates");
    return response.data;
  },

  // ─── Faculty APIs ──────────────────────────────────────────────────────

  createAssignment: async (data: {
    title: string;
    instructions?: string;
    templateId: string;
    sectionId: string;
    subjectId: string;
    maxMarks: number;
    dueDate: string;
    allowResubmissions?: boolean;
    variant?: number;
  }) => {
    const response = await api.post<ApiSuccessResponse<any>>("/assignments", data);
    return response.data;
  },

  publishAssignment: async (id: string, dueDate?: string, setNumber?: number) => {
    const response = await api.patch<ApiSuccessResponse<any>>(`/assignments/${id}/publish`, { dueDate, setNumber });
    return response.data;
  },

  extendDeadline: async (id: string, dueDate: string) => {
    const response = await api.patch<ApiSuccessResponse<any>>(`/assignments/${id}/extend`, { dueDate });
    return response.data;
  },

  archiveAssignment: async (id: string) => {
    const response = await api.patch<ApiSuccessResponse<any>>(`/assignments/${id}/archive`);
    return response.data;
  },

  deleteAssignment: async (id: string) => {
    const response = await api.delete<ApiSuccessResponse<any>>(`/assignments/${id}`);
    return response.data;
  },

  getFacultyAssignments: async (params?: { 
    limit?: number; 
    offset?: number; 
    sectionId?: string; 
    subjectId?: string 
  }) => {
    const response = await api.get<ApiSuccessResponse<any[]>>("/assignments/faculty/me", { params });
    return response.data;
  },

  syncDrafts: async (data: { sectionId: string; subjectId: string }) => {
    const response = await api.post<ApiSuccessResponse<any>>("/assignments/faculty/sync-drafts", data);
    return response.data;
  },

  getAssignmentSubmissions: async (id: string, params?: { limit?: number; offset?: number }) => {
    const response = await api.get<ApiSuccessResponse<any[]>>(`/assignments/${id}/submissions`, { params });
    return response.data;
  },

  gradeSubmission: async (id: string, data: { marks: number; feedback?: string }) => {
    const response = await api.patch<ApiSuccessResponse<any>>(`/assignments/submissions/${id}/grade`, data);
    return response.data;
  },

  reopenSubmission: async (id: string, reason?: string) => {
    const response = await api.post<ApiSuccessResponse<any>>(`/assignments/submissions/${id}/reopen`, { reason });
    return response.data;
  },

  // ─── Student APIs ──────────────────────────────────────────────────────

  getStudentAssignments: async () => {
    const response = await api.get<ApiSuccessResponse<any[]>>("/assignments/student/me");
    return response.data;
  },

  submitAssignment: async (id: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post<ApiSuccessResponse<any>>(`/assignments/${id}/submit`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  // ─── Shared APIs ───────────────────────────────────────────────────────

  getSubmissionDetails: async (id: string) => {
    const response = await api.get<ApiSuccessResponse<any>>(`/assignments/submissions/${id}/details`);
    return response.data;
  },

  getAssignmentStats: async (id: string) => {
    const response = await api.get<ApiSuccessResponse<any>>(`/assignments/${id}/stats`);
    return response.data;
  },
};
