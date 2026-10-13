import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit"
import { authService, userService } from "@/services"
import { AuthResponse, UserResponse, LoginRequest, RegisterRequest } from "@/types/api"
import { extractApiErrorMessage } from "@/lib/api-error"
import { tokenStorage } from "@/lib/storage"

interface AuthState {
  user: UserResponse | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  isHydrated: boolean
  error: string | null
}

const initialState: AuthState = {
  user: null,
  token: null,
  isLoading: false,
  isAuthenticated: false,
  isHydrated: false,
  error: null,
}

export const hydrateAuth = createAsyncThunk("auth/hydrate", async () => {
  return tokenStorage.hydrate()
})

export const login = createAsyncThunk<AuthResponse, LoginRequest, { rejectValue: string }>(
  "auth/login",
  async (data, { rejectWithValue }) => {
    try {
      return await authService.login(data)
    } catch (error) {
      return rejectWithValue(extractApiErrorMessage(error))
    }
  }
)

export const register = createAsyncThunk<AuthResponse, RegisterRequest, { rejectValue: string }>(
  "auth/register",
  async (data, { rejectWithValue }) => {
    try {
      return await authService.register(data)
    } catch (error) {
      return rejectWithValue(extractApiErrorMessage(error))
    }
  }
)

export const fetchCurrentUser = createAsyncThunk<UserResponse, void, { rejectValue: string }>(
  "auth/fetchCurrentUser",
  async (_, { rejectWithValue }) => {
    try {
      return await userService.getCurrentUser()
    } catch (error) {
      return rejectWithValue(extractApiErrorMessage(error))
    }
  }
)

export const logout = createAsyncThunk("auth/logout", async () => {
  await authService.logout()
})

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(hydrateAuth.fulfilled, (state, action) => {
        state.isHydrated = true
        if (action.payload) {
          state.token = action.payload
          state.isAuthenticated = true
        }
      })
      .addCase(hydrateAuth.rejected, (state) => {
        state.isHydrated = true
      })
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
        state.error = action.payload || "Ошибка входа"
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
        state.error = action.payload || "Ошибка регистрации"
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.user = action.payload
        state.isAuthenticated = true
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        state.user = null
        state.isAuthenticated = false
        state.token = null
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null
        state.token = null
        state.isAuthenticated = false
        state.error = null
      })
  },
})

export const { clearError } = authSlice.actions
export default authSlice.reducer
