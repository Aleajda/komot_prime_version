import { apiClient } from "@/lib/api-client"
import { tokenStorage } from "@/lib/storage"
import { AuthResponse, LoginRequest, RegisterRequest } from "@/types/api"

export const authService = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>("/auth/login", data)
    await tokenStorage.setTokens(response.data.accessToken, response.data.refreshToken)
    return response.data
  },

  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>("/auth/register", data)
    await tokenStorage.setTokens(response.data.accessToken, response.data.refreshToken)
    return response.data
  },

  logout: async () => {
    await tokenStorage.clearTokens()
  },

  getToken: (): string | null => tokenStorage.getTokenSync(),
}
