import { useEffect, useState } from "react"
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native"
import { CompositeNavigationProp, useNavigation } from "@react-navigation/native"
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { friendshipService, userService, chatService } from "@/services"
import { UserResponse, FriendshipResponse } from "@/types/api"
import { useAppDispatch } from "@/store/hooks"
import { addChat, setActiveChat, fetchChats } from "@/store/slices/chatSlice"
import { colors } from "@/theme/colors"
import { MainStackParamList, TabParamList } from "@/navigation/types"

type TabType = "friends" | "requests" | "search"

type FriendsNav = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, "FriendsTab">,
  NativeStackNavigationProp<MainStackParamList>
>

export const FriendsScreen = () => {
  const navigation = useNavigation<FriendsNav>()
  const dispatch = useAppDispatch()
  const [tab, setTab] = useState<TabType>("friends")
  const [friends, setFriends] = useState<UserResponse[]>([])
  const [followers, setFollowers] = useState<UserResponse[]>([])
  const [requests, setRequests] = useState<FriendshipResponse[]>([])
  const [users, setUsers] = useState<UserResponse[]>([])
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const [f, fo, r] = await Promise.all([
        friendshipService.getFriends(),
        friendshipService.getFollowers(),
        friendshipService.getPendingRequests(),
      ])
      setFriends(f)
      setFollowers(fo)
      setRequests(r)
    } catch (e) {
      Alert.alert("Ошибка", e instanceof Error ? e.message : "Не удалось загрузить")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    if (query.trim().length < 2) {
      setUsers([])
      return
    }
    const t = setTimeout(async () => {
      setSearching(true)
      try {
        setUsers(await userService.searchUsers(query.trim()))
      } catch (e) {
        Alert.alert("Ошибка", e instanceof Error ? e.message : "Ошибка поиска")
      } finally {
        setSearching(false)
      }
    }, 300)
    return () => clearTimeout(t)
  }, [query])

  const handleStartChat = async (userId: string) => {
    try {
      const chat = await chatService.getOrCreateDirectChat(userId)
      dispatch(addChat(chat))
      dispatch(setActiveChat(chat.id))
      dispatch(fetchChats())
      navigation.navigate("ChatRoom", { chatId: chat.id })
    } catch (e) {
      Alert.alert("Ошибка", e instanceof Error ? e.message : "Не удалось открыть чат")
    }
  }

  const handleAdd = async (userId: string) => {
    try {
      await friendshipService.sendFriendRequest(userId)
      Alert.alert("Готово", "Заявка отправлена")
      await load()
      setQuery("")
    } catch (e) {
      Alert.alert("Ошибка", e instanceof Error ? e.message : "Не удалось отправить заявку")
    }
  }

  const handleAccept = async (id: string) => {
    try {
      await friendshipService.acceptFriendRequest(id)
      await load()
    } catch (e) {
      Alert.alert("Ошибка", e instanceof Error ? e.message : "Ошибка")
    }
  }

  const handleReject = async (id: string) => {
    try {
      await friendshipService.rejectFriendRequest(id)
      await load()
    } catch (e) {
      Alert.alert("Ошибка", e instanceof Error ? e.message : "Ошибка")
    }
  }

  const handleRemove = async (id: string) => {
    try {
      await friendshipService.removeFriend(id)
      await load()
    } catch (e) {
      Alert.alert("Ошибка", e instanceof Error ? e.message : "Ошибка")
    }
  }

  const isFriend = (id: string) => friends.some((f) => f.id === id)

  return (
    <View style={styles.root}>
      <Text style={styles.title}>Друзья</Text>
      <View style={styles.tabs}>
        {(["friends", "requests", "search"] as TabType[]).map((t) => (
          <Pressable
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === "friends" ? `Друзья (${friends.length})` : t === "requests" ? `Заявки (${requests.length})` : "Поиск"}
            </Text>
          </Pressable>
        ))}
      </View>

      {tab === "friends" && (
        loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={[...friends.map((f) => ({ ...f, kind: "friend" as const })), ...followers.map((f) => ({ ...f, kind: "follower" as const }))]}
            keyExtractor={(item) => `${item.kind}-${item.id}`}
            contentContainerStyle={styles.list}
            ListEmptyComponent={<Text style={styles.empty}>Друзей пока нет</Text>}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <Text style={styles.name}>{item.username || item.email}</Text>
                <Text style={styles.email}>{item.email}</Text>
                <Text style={styles.badge}>{item.kind === "friend" ? "Друг" : "Подписчик"}</Text>
                <View style={styles.row}>
                  <Pressable style={styles.btn} onPress={() => handleStartChat(item.id)}>
                    <Text style={styles.btnText}>Чат</Text>
                  </Pressable>
                  {item.kind === "friend" && (
                    <Pressable style={styles.btnGhost} onPress={() => handleRemove(item.id)}>
                      <Text style={styles.btnGhostText}>Удалить</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            )}
          />
        )
      )}

      {tab === "requests" && (
        loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={requests}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            ListEmptyComponent={<Text style={styles.empty}>Заявок нет</Text>}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <Text style={styles.name}>{item.requester.username || item.requester.email}</Text>
                <Text style={styles.email}>{item.requester.email}</Text>
                <View style={styles.row}>
                  <Pressable style={styles.btn} onPress={() => handleAccept(item.id)}>
                    <Text style={styles.btnText}>Принять</Text>
                  </Pressable>
                  <Pressable style={styles.btnGhost} onPress={() => handleReject(item.id)}>
                    <Text style={styles.btnGhostText}>Отклонить</Text>
                  </Pressable>
                </View>
              </View>
            )}
          />
        )
      )}

      {tab === "search" && (
        <View style={{ flex: 1 }}>
          <TextInput
            style={styles.input}
            value={query}
            onChangeText={setQuery}
            placeholder="Поиск по имени или email..."
            placeholderTextColor={colors.muted}
            autoCapitalize="none"
          />
          {searching ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
          ) : (
            <FlatList
              data={users}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.list}
              ListEmptyComponent={
                <Text style={styles.empty}>
                  {query.trim().length < 2 ? "Введите минимум 2 символа" : "Никого не найдено"}
                </Text>
              }
              renderItem={({ item }) => (
                <View style={styles.card}>
                  <Text style={styles.name}>{item.username || item.email}</Text>
                  <Text style={styles.email}>{item.email}</Text>
                  <View style={styles.row}>
                    <Pressable style={styles.btn} onPress={() => handleStartChat(item.id)}>
                      <Text style={styles.btnText}>Чат</Text>
                    </Pressable>
                    {!isFriend(item.id) ? (
                      <Pressable style={styles.btnPrimary} onPress={() => handleAdd(item.id)}>
                        <Text style={styles.btnTextDark}>Добавить</Text>
                      </Pressable>
                    ) : (
                      <Text style={styles.badge}>В друзьях</Text>
                    )}
                  </View>
                </View>
              )}
            />
          )}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background, paddingTop: 16 },
  title: { fontSize: 24, fontWeight: "700", color: colors.text, paddingHorizontal: 20 },
  tabs: { flexDirection: "row", gap: 8, padding: 16 },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: "center",
  },
  tabActive: { backgroundColor: colors.primary },
  tabText: { color: colors.muted, fontSize: 12, fontWeight: "600" },
  tabTextActive: { color: colors.primaryText },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  empty: { color: colors.muted, textAlign: "center", marginTop: 40 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  name: { color: colors.text, fontWeight: "600", fontSize: 16 },
  email: { color: colors.muted, fontSize: 12, marginTop: 2 },
  badge: { color: colors.primary, marginTop: 6, fontSize: 12 },
  row: { flexDirection: "row", gap: 8, marginTop: 12, alignItems: "center" },
  btn: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  btnPrimary: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  btnGhost: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  btnText: { color: colors.text, fontWeight: "600" },
  btnTextDark: { color: colors.primaryText, fontWeight: "700" },
  btnGhostText: { color: colors.danger, fontWeight: "600" },
  input: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
})
