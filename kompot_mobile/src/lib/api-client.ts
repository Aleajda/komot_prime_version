import axios, { AxiosError, InternalAxiosRequestConfig } from "axios"
import { API_URL } from "@/config"
import { tokenStorage } from "@/lib/storage"
import { extractApiErrorMessage } from "@/lib/api-error"

type UnauthorizedHandler = () => void

let onUnauthorized: UnauthorizedHandler | null = null

export const setUnauthorizedHandler = (handler: UnauthorizedHandler) => {
  onUnauthorized = handler
}

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
})

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenStorage.getTokenSync()
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const message = extractApiErrorMessage(error)
    if (error.response?.status === 401) {
      await tokenStorage.clearTokens()
      onUnauthorized?.()
    }
    return Promise.reject(new Error(message))
  }
)
