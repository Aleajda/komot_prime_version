import { apiClient } from "@/lib/api-client"
import { TaskResponse } from "@/types/api"

export const taskService = {
  getProjectTasks: async (projectId: string): Promise<TaskResponse[]> => {
    const response = await apiClient.get<TaskResponse[]>(`/projects/${projectId}/tasks`)
    return response.data
  },

  getTaskById: async (id: string): Promise<TaskResponse> => {
    const response = await apiClient.get<TaskResponse>(`/tasks/${id}`)
    return response.data
  },

  createTask: async (projectId: string, data: Partial<TaskResponse>): Promise<TaskResponse> => {
    const response = await apiClient.post<TaskResponse>(`/projects/${projectId}/tasks`, data)
    return response.data
  },

  updateTask: async (id: string, data: Partial<TaskResponse>): Promise<TaskResponse> => {
    const response = await apiClient.put<TaskResponse>(`/tasks/${id}`, data)
    return response.data
  },

  deleteTask: async (id: string): Promise<void> => {
    await apiClient.delete(`/tasks/${id}`)
  },
}






