import { api } from "./axios.instance";
import { ApiSuccessResponse } from "@shared/contracts/api.contracts";

export const noticeboardApi = {
  getMyNotices: async (): Promise<ApiSuccessResponse<any>> => {
    const res = await api.get('/noticeboard/me');
    return res.data;
  },

  createNotice: async (data: any): Promise<ApiSuccessResponse<any>> => {
    const res = await api.post('/noticeboard', data);
    return res.data;
  },

  publishNotice: async (id: string): Promise<ApiSuccessResponse<any>> => {
    const res = await api.patch(`/noticeboard/${id}/publish`);
    return res.data;
  },

  archiveNotice: async (id: string): Promise<ApiSuccessResponse<any>> => {
    const res = await api.patch(`/noticeboard/${id}/archive`);
    return res.data;
  },

  updateNotice: async (id: string, data: any): Promise<ApiSuccessResponse<any>> => {
    const res = await api.patch(`/noticeboard/${id}`, data);
    return res.data;
  },

  getAllNotices: async (params?: { page?: number; limit?: number }): Promise<ApiSuccessResponse<any>> => {
    const res = await api.get('/noticeboard/admin/all', { params });
    return res.data;
  },
};
