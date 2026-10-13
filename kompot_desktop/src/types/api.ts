export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  username: string
  firstName?: string
  lastName?: string
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  user: UserResponse
}

export interface UserResponse {
  id: string
  email: string
  username: string
  firstName?: string
  lastName?: string
  avatar?: string
  role: "USER" | "ADMIN"
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface MessageResponse {
  id: string
  content: string
  senderId: string
  chatId: string
  type: "TEXT" | "FILE" | "IMAGE"
  fileUrl?: string
  createdAt: string
  updatedAt?: string
}

export interface ChatResponse {
  id: string
  type: "DIRECT" | "GROUP" | "CHANNEL"
  name?: string
  teamId?: string
  projectId?: string
  createdAt: string
  updatedAt: string
}

export interface ChatMemberResponse {
  id: string
  chatId: string
  user: UserResponse
  role: "OWNER" | "ADMIN" | "MEMBER"
  owner: boolean
  joinedAt: string
}

export interface FriendshipResponse {
  id: string
  requester: UserResponse
  addressee: UserResponse
  status: "PENDING" | "ACCEPTED" | "BLOCKED"
  createdAt: string
  updatedAt: string
}

export interface ApiError {
  message: string
  status?: number
}
