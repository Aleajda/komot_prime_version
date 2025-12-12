import axios, { AxiosError, InternalAxiosRequestConfig } from "axios"
import { toast } from "sonner"
import { authService } from "@/services"
import { extractApiErrorMessage } from "@/lib/api-error"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api"

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
})

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = authService.getToken()
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const message = extractApiErrorMessage(error)

    if (error.response?.status === 401 && typeof window !== "undefined") {
      authService.logout()
      if (window.location.pathname !== "/auth/login" && window.location.pathname !== "/auth/register") {
        toast.error("Сессия истекла, выполните вход заново")
        window.location.href = "/auth/login"
      }
      return Promise.reject(new Error(message))
    }

    toast.error(message)
    return Promise.reject(new Error(message))
  }
)

