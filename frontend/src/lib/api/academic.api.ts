import { api } from "./axios.instance";
import { ApiSuccessResponse } from "@shared/contracts/api.contracts";

export const academicApi = {
  /**
   * Fetches the globally active academic session.
   */
  getActiveSession: async () => {
    const response = await api.get<ApiSuccessResponse<any>>("/academic/session");
    return response.data;
  },

  /**
   * Fetches the academic tree (Admin only).
   */
  getAcademicTree: async () => {
    const response = await api.get<ApiSuccessResponse<any[]>>("/academic/tree");
    return response.data;
  },

  /**
   * Fetches the current user's personalized academic context.
   */
  getMyContext: async () => {
    const response = await api.get<ApiSuccessResponse<any>>("/academic/context/me");
    return response.data;
  },
};
