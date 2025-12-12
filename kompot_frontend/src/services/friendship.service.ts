import { apiClient } from "@/lib/api-client"
import { FriendshipResponse, UserResponse } from "@/types/api"

export const friendshipService = {
  sendFriendRequest: async (userId: string): Promise<FriendshipResponse> => {
    const response = await apiClient.post<FriendshipResponse>(`/friends/request/${userId}`)
    return response.data
  },

  acceptFriendRequest: async (friendshipId: string): Promise<FriendshipResponse> => {
    const response = await apiClient.post<FriendshipResponse>(`/friends/accept/${friendshipId}`)
    return response.data
  },

  rejectFriendRequest: async (friendshipId: string): Promise<void> => {
    await apiClient.post(`/friends/reject/${friendshipId}`)
  },

  removeFriend: async (friendId: string): Promise<void> => {
    await apiClient.delete(`/friends/${friendId}`)
  },

  getFriends: async (): Promise<UserResponse[]> => {
    const response = await apiClient.get<UserResponse[]>("/friends")
    return response.data
  },

  getPendingRequests: async (): Promise<FriendshipResponse[]> => {
    const response = await apiClient.get<FriendshipResponse[]>("/friends/requests")
    return response.data
  },

  getFollowers: async (): Promise<UserResponse[]> => {
    const response = await apiClient.get<UserResponse[]>("/friends/followers")
    return response.data
  },

  areFriends: async (userId: string): Promise<boolean> => {
    const response = await apiClient.get<boolean>(`/friends/check/${userId}`)
    return response.data
  },
}


