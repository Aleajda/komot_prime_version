import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit"
import { authService, userService } from "@/services"
import { AuthResponse, UserResponse, LoginRequest, RegisterRequest } from "@/types/api"
import { extractApiErrorMessage } from "@/lib/api-error"

interface AuthState {
  user: UserResponse | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  error: string | null
}

const initialState: AuthState = {
  user: null,
  token: null,
  isLoading: false,
  isAuthenticated: false,
  error: null,
}

export const login = createAsyncThunk<AuthResponse, LoginRequest, { rejectValue: string }>(
  "auth/login",
  async (data, { rejectWithValue }) => {
    try {
      const response = await authService.login(data)
      return response
    } catch (error) {
      return rejectWithValue(extractApiErrorMessage(error))
    }
  }
)

export const register = createAsyncThunk<AuthResponse, RegisterRequest, { rejectValue: string }>(
  "auth/register",
  async (data, { rejectWithValue }) => {
    try {
      const response = await authService.register(data)
      return response
    } catch (error) {
      return rejectWithValue(extractApiErrorMessage(error))
    }
  }
)

export const fetchCurrentUser = createAsyncThunk<UserResponse, void, { rejectValue: string }>(
  "auth/fetchCurrentUser",
  async (_, { rejectWithValue }) => {
    try {
      const user = await userService.getCurrentUser()
      return user
    } catch (error) {
      return rejectWithValue(extractApiErrorMessage(error))
    }
  }
)

export const logout = createAsyncThunk("auth/logout", async () => {
  authService.logout()
})

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    initializeAuth: (state) => {
      const token = authService.getToken()
      if (token) {
        state.token = token
        state.isAuthenticated = true
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(login.fulfilled, (state, action: PayloadAction<AuthResponse>) => {
        state.isLoading = false
        state.isAuthenticated = true
        state.token = action.payload.accessToken
        state.user = action.payload.user
        state.error = null
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false
        state.isAuthenticated = false
        state.error = (action.payload as string) || action.error.message || "Ошибка входа"
      })
      .addCase(register.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(register.fulfilled, (state, action: PayloadAction<AuthResponse>) => {
        state.isLoading = false
        state.isAuthenticated = true
        state.token = action.payload.accessToken
        state.user = action.payload.user
        state.error = null
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false
        state.isAuthenticated = false
        state.error = (action.payload as string) || action.error.message || "Ошибка регистрации"
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action: PayloadAction<UserResponse>) => {
        state.user = action.payload
        state.isAuthenticated = true
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        state.user = null
        state.isAuthenticated = false
        state.token = null
        authService.logout()
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null
        state.token = null
        state.isAuthenticated = false
        state.error = null
      })
  },
})

export const { clearError, initializeAuth } = authSlice.actions
export default authSlice.reducer


