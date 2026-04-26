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

export interface ProjectResponse {
  id: string
  name: string
  description?: string
  status: "ACTIVE" | "ARCHIVED" | "COMPLETED"
  teamId: string
  editorIds: string[]
  createdAt: string
  updatedAt: string
}

export interface TaskResponse {
  id: string
  title: string
  description?: string
  status: "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE" | "BLOCKED"
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT"
  projectId: string
  assigneeId?: string
  creatorId: string
  dueDate?: string
  editorIds: string[]
  createdAt: string
  updatedAt: string
}

export interface TeamResponse {
  id: string
  name: string
  description?: string
  avatar?: string
  ownerId: string
  editorIds: string[]
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

export interface ApiError {
  message: string
  status?: number
}

export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
}

export interface AdminStatsResponse {
  totalUsers: number
  activeProjects: number
  adminsCount: number
  activeUsers: number
  tasksToday: number
  uptimeHours: number
  errors24h: number
  activityPercent: number
}

export interface AdminUserSummary {
  id: string
  email: string
  username: string
  role: "USER" | "ADMIN"
  isActive: boolean
  createdAt: string
}

export interface AdminTeamSummary {
  id: string
  name: string
  members: number
  projects: number
  createdAt: string
}

export interface SearchProjectHint {
  id: string
  name: string
  teamId: string
  teamName: string
}

export interface SearchTaskHint {
  id: string
  title: string
  projectId: string
  projectName: string
  teamId: string
  teamName: string
}

export interface SearchResponse {
  projects: SearchProjectHint[]
  tasks: SearchTaskHint[]
}

export interface FriendshipResponse {
  id: string
  requester: UserResponse
  addressee: UserResponse
  status: "PENDING" | "ACCEPTED" | "BLOCKED"
  createdAt: string
  updatedAt: string
}

