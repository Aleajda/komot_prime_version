import { useEffect } from "react"
import { ActivityIndicator, View } from "react-native"
import { NavigationContainer, DarkTheme } from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { hydrateAuth, fetchCurrentUser, logout } from "@/store/slices/authSlice"
import { setUnauthorizedHandler } from "@/lib/api-client"
import { LoginScreen } from "@/screens/LoginScreen"
import { RegisterScreen } from "@/screens/RegisterScreen"
import { ChatListScreen } from "@/screens/ChatListScreen"
import { ChatRoomScreen } from "@/screens/ChatRoomScreen"
import { CreateGroupScreen } from "@/screens/CreateGroupScreen"
import { FriendsScreen } from "@/screens/FriendsScreen"
import { ProfileScreen } from "@/screens/ProfileScreen"
import { colors } from "@/theme/colors"
import { AuthStackParamList, MainStackParamList, TabParamList } from "./types"

const AuthStack = createNativeStackNavigator<AuthStackParamList>()
const MainStack = createNativeStackNavigator<MainStackParamList>()
const Tab = createBottomTabNavigator<TabParamList>()

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
    primary: colors.primary,
  },
}

const AuthNavigator = () => (
  <AuthStack.Navigator screenOptions={{ headerShown: false }}>
    <AuthStack.Screen name="Login" component={LoginScreen} />
    <AuthStack.Screen name="Register" component={RegisterScreen} />
  </AuthStack.Navigator>
)

const TabsNavigator = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.muted,
    }}
  >
    <Tab.Screen
      name="ChatsTab"
      component={ChatListScreen}
      options={{ title: "Чаты", tabBarLabel: "Чаты" }}
    />
    <Tab.Screen
      name="FriendsTab"
      component={FriendsScreen}
      options={{ title: "Друзья", tabBarLabel: "Друзья" }}
    />
    <Tab.Screen
      name="ProfileTab"
      component={ProfileScreen}
      options={{ title: "Профиль", tabBarLabel: "Профиль" }}
    />
  </Tab.Navigator>
)

const MainNavigator = () => (
  <MainStack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: colors.surface },
      headerTintColor: colors.text,
      contentStyle: { backgroundColor: colors.background },
    }}
  >
    <MainStack.Screen name="Tabs" component={TabsNavigator} options={{ headerShown: false }} />
    <MainStack.Screen name="ChatRoom" component={ChatRoomScreen} options={{ title: "Чат" }} />
    <MainStack.Screen name="CreateGroup" component={CreateGroupScreen} options={{ title: "Новая группа" }} />
  </MainStack.Navigator>
)

export const RootNavigator = () => {
  const dispatch = useAppDispatch()
  const { isAuthenticated, isHydrated, user, token } = useAppSelector((s) => s.auth)

  useEffect(() => {
    dispatch(hydrateAuth())
    setUnauthorizedHandler(() => {
      dispatch(logout())
    })
  }, [dispatch])

  useEffect(() => {
    if (isHydrated && token && !user) {
      dispatch(fetchCurrentUser())
    }
  }, [isHydrated, token, user, dispatch])

  if (!isHydrated) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: "center" }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    )
  }

  return (
    <NavigationContainer theme={navTheme}>
      {isAuthenticated ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  )
}
