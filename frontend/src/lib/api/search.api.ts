import { api } from "./axios.instance";
import { ApiSuccessResponse } from "@shared/contracts/api.contracts";

export const searchApi = {
  globalSearch: async (query: string): Promise<ApiSuccessResponse<any>> => {
    const res = await api.get(`/search/global?q=${encodeURIComponent(query)}`);
    return res.data;
  },
};
