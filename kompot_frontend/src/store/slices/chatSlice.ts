import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit"
import { chatService } from "@/services"
import { ChatResponse, MessageResponse, UserResponse } from "@/types/api"
import { extractApiErrorMessage } from "@/lib/api-error"

interface ChatState {
  chats: ChatResponse[]
  activeChatId: string | null
  messages: Record<string, MessageResponse[]>
  users: UserResponse[]
  friends: UserResponse[]
  isLoadingChats: boolean
  isLoadingMessages: Record<string, boolean>
  isLoadingUsers: boolean
  error: string | null
}

const initialState: ChatState = {
  chats: [],
  activeChatId: null,
  messages: {},
  users: [],
  friends: [],
  isLoadingChats: false,
  isLoadingMessages: {},
  isLoadingUsers: false,
  error: null,
}

export const fetchChats = createAsyncThunk<ChatResponse[], void, { rejectValue: string }>(
  "chat/fetchChats",
  async (_, { rejectWithValue }) => {
    try {
      return await chatService.getChats()
    } catch (error) {
      return rejectWithValue(extractApiErrorMessage(error))
    }
  }
)

export const fetchChatMessages = createAsyncThunk<
  { chatId: string; messages: MessageResponse[] },
  string,
  { rejectValue: string }
>("chat/fetchChatMessages", async (chatId, { rejectWithValue }) => {
  try {
    const messages = await chatService.getChatMessages(chatId)
    return { chatId, messages }
  } catch (error) {
    return rejectWithValue(extractApiErrorMessage(error))
  }
})

export const createChat = createAsyncThunk<
  ChatResponse,
  { type: "DIRECT" | "GROUP" | "CHANNEL"; name?: string; userIds?: string[] },
  { rejectValue: string }
>("chat/createChat", async (data, { rejectWithValue }) => {
  try {
    return await chatService.createChat(data)
  } catch (error) {
    return rejectWithValue(extractApiErrorMessage(error))
  }
})

export const searchUsers = createAsyncThunk<UserResponse[], string, { rejectValue: string }>(
  "chat/searchUsers",
  async (query, { rejectWithValue }) => {
    try {
      const { userService } = await import("@/services")
      return await userService.searchUsers(query)
    } catch (error) {
      return rejectWithValue(extractApiErrorMessage(error))
    }
  }
)

export const fetchFriends = createAsyncThunk<UserResponse[], void, { rejectValue: string }>(
  "chat/fetchFriends",
  async (_, { rejectWithValue }) => {
    try {
      const { friendshipService } = await import("@/services")
      return await friendshipService.getFriends()
    } catch (error) {
      return rejectWithValue(extractApiErrorMessage(error))
    }
  }
)

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setActiveChat: (state, action: PayloadAction<string | null>) => {
      state.activeChatId = action.payload
    },
    addMessage: (state, action: PayloadAction<MessageResponse>) => {
      const { chatId } = action.payload
      if (!state.messages[chatId]) {
        state.messages[chatId] = []
      }
      const existingIndex = state.messages[chatId].findIndex((msg) => msg.id === action.payload.id)
      if (existingIndex === -1) {
        const messageToAdd = {
          ...action.payload,
          createdAt: action.payload.createdAt || new Date().toISOString(),
        }
        state.messages[chatId].push(messageToAdd)
        state.messages[chatId].sort((a, b) => {
          const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0
          const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0
          return timeA - timeB
        })
      } else {
        state.messages[chatId][existingIndex] = action.payload
      }
    },
    addChat: (state, action: PayloadAction<ChatResponse>) => {
      const existingIndex = state.chats.findIndex((chat) => chat.id === action.payload.id)
      if (existingIndex === -1) {
        state.chats.push(action.payload)
      } else {
        state.chats[existingIndex] = action.payload
      }
    },
    clearError: (state) => {
      state.error = null
    },
    clearUsers: (state) => {
      state.users = []
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchChats.pending, (state) => {
        state.isLoadingChats = true
        state.error = null
      })
      .addCase(fetchChats.fulfilled, (state, action) => {
        state.isLoadingChats = false
        state.chats = action.payload
      })
      .addCase(fetchChats.rejected, (state, action) => {
        state.isLoadingChats = false
        state.error = action.payload || "Ошибка загрузки чатов"
      })
      .addCase(fetchChatMessages.pending, (state, action) => {
        state.isLoadingMessages[action.meta.arg] = true
        state.error = null
      })
      .addCase(fetchChatMessages.fulfilled, (state, action) => {
        state.isLoadingMessages[action.payload.chatId] = false
        state.messages[action.payload.chatId] = action.payload.messages
      })
      .addCase(fetchChatMessages.rejected, (state, action) => {
        state.isLoadingMessages[action.meta.arg] = false
        state.error = action.payload || "Ошибка загрузки сообщений"
      })
      .addCase(createChat.fulfilled, (state, action) => {
        const existingIndex = state.chats.findIndex((chat) => chat.id === action.payload.id)
        if (existingIndex === -1) {
          state.chats.push(action.payload)
        }
      })
      .addCase(searchUsers.pending, (state) => {
        state.isLoadingUsers = true
      })
      .addCase(searchUsers.fulfilled, (state, action) => {
        state.isLoadingUsers = false
        state.users = action.payload
      })
      .addCase(searchUsers.rejected, (state) => {
        state.isLoadingUsers = false
      })
      .addCase(fetchFriends.fulfilled, (state, action) => {
        state.friends = action.payload
      })
  },
})

export const { setActiveChat, addMessage, addChat, clearError, clearUsers } = chatSlice.actions
export default chatSlice.reducer
