import { api } from "./axios.instance";
import { ApiSuccessResponse } from "@shared/contracts/api.contracts";

export const attendanceApi = {
  // ─── Faculty APIs ──────────────────────────────────────────────────────

  createSession: async (data: {
    sectionId: string;
    subjectId: string;
    date: string;
    startTime: string;
    endTime: string;
    sessionTitle?: string;
    notes?: string;
  }) => {
    const response = await api.post<ApiSuccessResponse<any>>("/attendance/sessions", data);
    return response.data;
  },

  markAttendance: async (sessionId: string, records: any[]) => {
    const response = await api.post<ApiSuccessResponse<any>>(`/attendance/sessions/${sessionId}/records`, {
      records,
    });
    return response.data;
  },

  updateRecord: async (recordId: string, data: any) => {
    const response = await api.patch<ApiSuccessResponse<any>>(`/attendance/records/${recordId}`, data);
    return response.data;
  },

  getSession: async (id: string) => {
    const response = await api.get<ApiSuccessResponse<any>>(`/attendance/sessions/${id}`);
    return response.data;
  },

  getMySessions: async (params?: { limit?: number; offset?: number }) => {
    const response = await api.get<ApiSuccessResponse<any[]>>("/attendance/faculty/me", { params });
    return response.data;
  },

  lockSession: async (id: string) => {
    const response = await api.post<ApiSuccessResponse<any>>(`/attendance/sessions/${id}/lock`);
    return response.data;
  },

  // ─── Student APIs ──────────────────────────────────────────────────────

  getMySummary: async () => {
    const response = await api.get<ApiSuccessResponse<any[]>>("/attendance/student/me/summary");
    return response.data;
  },

  getMyHistory: async (params?: { limit?: number; offset?: number }) => {
    const response = await api.get<ApiSuccessResponse<any[]>>("/attendance/student/me/history", { params });
    return response.data;
  },
};
