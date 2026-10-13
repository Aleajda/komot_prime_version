import AsyncStorage from "@react-native-async-storage/async-storage"

const ACCESS_TOKEN_KEY = "accessToken"
const REFRESH_TOKEN_KEY = "refreshToken"

let memoryAccessToken: string | null = null

export const tokenStorage = {
  async setTokens(accessToken: string, refreshToken: string): Promise<void> {
    memoryAccessToken = accessToken
    await AsyncStorage.multiSet([
      [ACCESS_TOKEN_KEY, accessToken],
      [REFRESH_TOKEN_KEY, refreshToken],
    ])
  },

  async clearTokens(): Promise<void> {
    memoryAccessToken = null
    await AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY])
  },

  getTokenSync(): string | null {
    return memoryAccessToken
  },

  async getToken(): Promise<string | null> {
    if (memoryAccessToken) {
      return memoryAccessToken
    }
    const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY)
    memoryAccessToken = token
    return token
  },

  async hydrate(): Promise<string | null> {
    return this.getToken()
  },
}
