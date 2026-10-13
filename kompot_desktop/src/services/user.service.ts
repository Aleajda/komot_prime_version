import { apiClient } from "@/lib/api-client"
import { UserResponse } from "@/types/api"

export const userService = {
  getCurrentUser: async (): Promise<UserResponse> => {
    const response = await apiClient.get<UserResponse>("/users/me")
    return response.data
  },

  searchUsers: async (query: string): Promise<UserResponse[]> => {
    const response = await apiClient.get<UserResponse[]>("/users/search", {
      params: { query },
    })
    return response.data
  },
}
