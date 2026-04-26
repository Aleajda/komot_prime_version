import { apiClient } from "@/lib/api-client"
import { AdminStatsResponse, AdminTeamSummary, AdminUserSummary, PageResponse } from "@/types/api"

export const adminService = {
  getStats: async (): Promise<AdminStatsResponse> => {
    const response = await apiClient.get<AdminStatsResponse>("/admin/statistics")
    return response.data
  },

  getUsers: async (): Promise<AdminUserSummary[]> => {
    const response = await apiClient.get<PageResponse<AdminUserSummary>>("/admin/users")
    return response.data.content
  },

  getTeams: async (): Promise<AdminTeamSummary[]> => {
    const response = await apiClient.get<AdminTeamSummary[]>("/admin/teams")
    return response.data
  },
}






