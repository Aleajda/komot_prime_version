import { apiClient } from "@/lib/api-client"
import { AuthResponse, LoginRequest, RegisterRequest } from "@/types/api"

export const authService = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>("/auth/login", data)
    localStorage.setItem("accessToken", response.data.accessToken)
    localStorage.setItem("refreshToken", response.data.refreshToken)
    return response.data
  },

  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>("/auth/register", data)
    localStorage.setItem("accessToken", response.data.accessToken)
    localStorage.setItem("refreshToken", response.data.refreshToken)
    return response.data
  },

  logout: () => {
    localStorage.removeItem("accessToken")
    localStorage.removeItem("refreshToken")
  },

  getToken: (): string | null => localStorage.getItem("accessToken"),
}
