import { api } from "./axios.instance";
import { AuthUser, LoginResponseData } from "@shared/types/auth.types";
import { ApiSuccessResponse } from "@shared/contracts/api.contracts";

export const authApi = {
  login: async (credentials: any) => {
    const response = await api.post<ApiSuccessResponse<LoginResponseData>>("/auth/login", credentials);
    return response.data;
  },
  logout: async () => {
    const response = await api.post("/auth/logout");
    return response.data;
  },
  getMe: async () => {
    const response = await api.get<ApiSuccessResponse<AuthUser>>("/auth/me");
    return response.data;
  },
  changePassword: async (dto: { currentPassword: string; newPassword: string; confirmPassword: string }) => {
    const response = await api.patch<ApiSuccessResponse<{ message: string }>>("/auth/change-password", dto);
    return response.data;
  },
};
