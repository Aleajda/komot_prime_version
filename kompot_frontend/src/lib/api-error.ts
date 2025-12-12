import { AxiosError } from "axios"
import { ApiError } from "@/types/api"

const translateMessage = (message: string, status?: number) => {
  const text = message.toLowerCase()

  if (text.includes("bad credentials") || text.includes("unauthorized") || status === 401) {
    return "Неверная почта или пароль"
  }

  if (text.includes("not found") || status === 404) {
    return "Запрошенный ресурс не найден"
  }

  if (text.includes("conflict") || text.includes("already exists") || text.includes("duplicate") || status === 409) {
    return "Пользователь уже существует или данные конфликтуют"
  }

  if (text.includes("validation") || text.includes("invalid") || status === 400) {
    return "Проверьте корректность введённых данных"
  }

  if (status && status >= 500) {
    return "Сервер временно недоступен, попробуйте позже"
  }

  return message
}

export const extractApiErrorMessage = (error: unknown): string => {
  if (typeof error === "string") {
    return translateMessage(error)
  }

  if (error instanceof AxiosError) {
    if (!error.response) {
      return "Нет соединения с сервером"
    }

    const data = error.response.data as ApiError | undefined
    const raw = data?.message || error.response.statusText || error.message || "Произошла неизвестная ошибка"
    return translateMessage(raw, error.response.status)
  }

  if (error instanceof Error) {
    return translateMessage(error.message)
  }

  return "Произошла неизвестная ошибка"
}

