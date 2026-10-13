import axios, { AxiosError, InternalAxiosRequestConfig } from "axios"
import { API_URL } from "@/config"
import { authService } from "@/services/auth.service"
import { extractApiErrorMessage } from "@/lib/api-error"

type UnauthorizedHandler = () => void
let onUnauthorized: UnauthorizedHandler | null = null

export const setUnauthorizedHandler = (handler: UnauthorizedHandler) => {
  onUnauthorized = handler
}

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
})

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = authService.getToken()
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const message = extractApiErrorMessage(error)
    if (error.response?.status === 401) {
      authService.logout()
      onUnauthorized?.()
    }
    return Promise.reject(new Error(message))
  }
)
