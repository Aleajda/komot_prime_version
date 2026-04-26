import { apiClient } from "@/lib/api-client"
import { SearchResponse } from "@/types/api"

export const searchService = {
  search: async (query: string): Promise<SearchResponse> => {
    const response = await apiClient.get<SearchResponse>("/search", {
      params: { query },
    })
    return response.data
  },
}

