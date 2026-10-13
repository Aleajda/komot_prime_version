import { apiClient } from "@/lib/api-client"
import { ChatResponse, MessageResponse, ChatMemberResponse } from "@/types/api"

export interface ChatCreateRequest {
  type: "DIRECT" | "GROUP" | "CHANNEL"
  name?: string
  userIds?: string[]
}

export const chatService = {
  getChats: async (): Promise<ChatResponse[]> => {
    const response = await apiClient.get<ChatResponse[]>("/chats")
    return response.data
  },

  createChat: async (data: ChatCreateRequest): Promise<ChatResponse> => {
    const response = await apiClient.post<ChatResponse>("/chats", data)
    return response.data
  },

  getChatMessages: async (chatId: string): Promise<MessageResponse[]> => {
    const response = await apiClient.get<MessageResponse[]>(`/chats/${chatId}/messages`)
    return response.data
  },

  getChatMembers: async (chatId: string): Promise<ChatMemberResponse[]> => {
    const response = await apiClient.get<ChatMemberResponse[]>(`/chats/${chatId}/members`)
    return response.data
  },

  getOrCreateDirectChat: async (userId: string): Promise<ChatResponse> => {
    const response = await apiClient.post<ChatResponse>(`/chats/direct/${userId}`)
    return response.data
  },
}
