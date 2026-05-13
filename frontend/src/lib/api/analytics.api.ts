import { api } from "./axios.instance";
import { ApiSuccessResponse } from "@shared/contracts/api.contracts";

export const analyticsApi = {
  getStudentDashboard: async (): Promise<ApiSuccessResponse<any>> => {
    const res = await api.get('/analytics/student/me');
    return res.data;
  },

  getFacultyDashboard: async (): Promise<ApiSuccessResponse<any>> => {
    const res = await api.get('/analytics/faculty/me');
    return res.data;
  },

  getAdminSummary: async (): Promise<ApiSuccessResponse<any>> => {
    const res = await api.get('/analytics/admin/summary');
    return res.data;
  },
};
