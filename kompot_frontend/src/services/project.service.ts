import { apiClient } from "@/lib/api-client"
import { ProjectResponse } from "@/types/api"

export const projectService = {
  getTeamProjects: async (teamId: string): Promise<ProjectResponse[]> => {
    const response = await apiClient.get<ProjectResponse[]>(`/teams/${teamId}/projects`)
    return response.data
  },

  getProjectById: async (id: string): Promise<ProjectResponse> => {
    const response = await apiClient.get<ProjectResponse>(`/projects/${id}`)
    return response.data
  },

  createProject: async (teamId: string, data: Partial<ProjectResponse>): Promise<ProjectResponse> => {
    const response = await apiClient.post<ProjectResponse>(`/teams/${teamId}/projects`, data)
    return response.data
  },

  updateProject: async (id: string, data: Partial<ProjectResponse>): Promise<ProjectResponse> => {
    const response = await apiClient.put<ProjectResponse>(`/projects/${id}`, data)
    return response.data
  },

  deleteProject: async (id: string): Promise<void> => {
    await apiClient.delete(`/projects/${id}`)
  },
}





