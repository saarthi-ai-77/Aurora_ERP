import { api } from "./axios.instance";
import { ApiSuccessResponse } from "@shared/contracts/api.contracts";

export const usersApi = {
  getMyProfile: async () => {
    const response = await api.get<ApiSuccessResponse<any>>("/users/me/profile");
    return response.data;
  },
  getAll: async (role?: string) => {
    const response = await api.get<ApiSuccessResponse<any[]>>("/users", { params: { role } });
    return response.data;
  },
  getOne: async (id: string) => {
    const response = await api.get<ApiSuccessResponse<any>>(`/users/${id}`);
    return response.data;
  },
  toggleStatus: async (id: string) => {
    const response = await api.patch<ApiSuccessResponse<any>>(`/users/${id}/toggle-status`);
    return response.data;
  },
  getAuditLogs: async (limit = 50, offset = 0) => {
    const response = await api.get<ApiSuccessResponse<any>>(
      `/users/admin/audit-logs?limit=${limit}&offset=${offset}`,
    );
    return response.data;
  },
  createStudent: async (dto: {
    firstName: string;
    lastName: string;
    email: string;
    registrationNumber: string;
    sectionId: string;
  }) => {
    const response = await api.post<ApiSuccessResponse<any>>("/users/students", dto);
    return response.data;
  },

  bulkUpload: async (file: File, role: string) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post<ApiSuccessResponse<any>>(`/users/bulk-upload?role=${role}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },
};
