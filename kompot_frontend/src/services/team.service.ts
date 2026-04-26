import { apiClient } from "@/lib/api-client"
import { TeamResponse } from "@/types/api"

export const teamService = {
  getUserTeams: async (): Promise<TeamResponse[]> => {
    const response = await apiClient.get<TeamResponse[]>("/teams")
    return response.data
  },

  getTeamById: async (id: string): Promise<TeamResponse> => {
    const response = await apiClient.get<TeamResponse>(`/teams/${id}`)
    return response.data
  },

  createTeam: async (data: Partial<TeamResponse>): Promise<TeamResponse> => {
    const response = await apiClient.post<TeamResponse>("/teams", data)
    return response.data
  },

  updateTeam: async (id: string, data: Partial<TeamResponse>): Promise<TeamResponse> => {
    const response = await apiClient.put<TeamResponse>(`/teams/${id}`, data)
    return response.data
  },

  deleteTeam: async (id: string): Promise<void> => {
    await apiClient.delete(`/teams/${id}`)
  },
}






