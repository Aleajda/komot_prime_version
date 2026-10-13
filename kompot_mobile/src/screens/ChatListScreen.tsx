import { useEffect, useState } from "react"
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Alert,
} from "react-native"
import { CompositeNavigationProp } from "@react-navigation/native"
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import {
  fetchChats,
  fetchFriends,
  searchUsers,
  clearUsers,
  addChat,
  setActiveChat,
} from "@/store/slices/chatSlice"
import { chatService, webSocketService } from "@/services"
import { ChatResponse, UserResponse } from "@/types/api"
import { colors } from "@/theme/colors"
import { MainStackParamList, TabParamList } from "@/navigation/types"

type Props = {
  navigation: CompositeNavigationProp<
    BottomTabNavigationProp<TabParamList, "ChatsTab">,
    NativeStackNavigationProp<MainStackParamList>
  >
}

export const ChatListScreen = ({ navigation }: Props) => {
  const dispatch = useAppDispatch()
  const { chats, users, friends, isLoadingChats, isLoadingUsers } = useAppSelector((s) => s.chat)
  const { user: currentUser } = useAppSelector((s) => s.auth)
  const [searchQuery, setSearchQuery] = useState("")
  const [showSearch, setShowSearch] = useState(false)
  const [membersByChat, setMembersByChat] = useState<Record<string, UserResponse[]>>({})
  const [wsConnected, setWsConnected] = useState(false)

  useEffect(() => {
    dispatch(fetchChats())
    dispatch(fetchFriends())
    const unsub = webSocketService.onConnectionChange(setWsConnected)
    webSocketService.connect()
    return () => {
      unsub()
      webSocketService.disconnect()
    }
  }, [dispatch])

  useEffect(() => {
    if (!searchQuery.trim()) {
      dispatch(clearUsers())
      return
    }
    const t = setTimeout(() => dispatch(searchUsers(searchQuery.trim())), 400)
    return () => clearTimeout(t)
  }, [searchQuery, dispatch])

  useEffect(() => {
    const load = async () => {
      const toLoad = chats.filter((c) => !membersByChat[c.id])
      if (toLoad.length === 0) return
      const results = await Promise.all(
        toLoad.map(async (chat) => {
          try {
            const members = await chatService.getChatMembers(chat.id)
            return { chatId: chat.id, users: members.map((m) => m.user) }
          } catch {
            return null
          }
        })
      )
      setMembersByChat((prev) => {
        const next = { ...prev }
        results.forEach((r) => {
          if (r) next[r.chatId] = r.users
        })
        return next
      })
    }
    load()
  }, [chats])

  const getChatName = (chat: ChatResponse): string => {
    if (chat.name) return chat.name
    if (chat.type === "DIRECT") {
      const other = (membersByChat[chat.id] || []).find(
        (m) => String(m.id) !== String(currentUser?.id)
      )
      return other?.username || other?.email || "Личный чат"
    }
    return "Чат"
  }

  const handleOpenChat = (chatId: string) => {
    dispatch(setActiveChat(chatId))
    navigation.navigate("ChatRoom", { chatId })
  }

  const handleStartChat = async (userId: string) => {
    try {
      const chat = await chatService.getOrCreateDirectChat(userId)
      dispatch(addChat(chat))
      dispatch(setActiveChat(chat.id))
      setShowSearch(false)
      setSearchQuery("")
      dispatch(clearUsers())
      navigation.navigate("ChatRoom", { chatId: chat.id })
    } catch (e) {
      Alert.alert("Ошибка", e instanceof Error ? e.message : "Не удалось открыть чат")
    }
  }

  const handleCreateGroup = () => {
    if (friends.length === 0) {
      Alert.alert("Нет друзей", "Сначала добавьте друзей")
      return
    }
    navigation.navigate("CreateGroup")
  }

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Чаты</Text>
          <Text style={styles.subtitle}>{wsConnected ? "Онлайн" : "Подключение..."}</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable style={styles.iconBtn} onPress={handleCreateGroup} accessibilityLabel="Группа">
            <Text style={styles.iconBtnText}>+</Text>
          </Pressable>
          <Pressable
            style={styles.iconBtn}
            onPress={() => setShowSearch((v) => !v)}
            accessibilityLabel="Поиск"
          >
            <Text style={styles.iconBtnText}>⌕</Text>
          </Pressable>
        </View>
      </View>

      {showSearch && (
        <View style={styles.searchBox}>
          <TextInput
            style={styles.input}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Поиск пользователей..."
            placeholderTextColor={colors.muted}
            autoCapitalize="none"
          />
          {isLoadingUsers ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: 8 }} />
          ) : (
            users.map((u) => (
              <Pressable key={u.id} style={styles.userRow} onPress={() => handleStartChat(u.id)}>
                <Text style={styles.userName}>{u.username || u.email}</Text>
                <Text style={styles.userEmail}>{u.email}</Text>
              </Pressable>
            ))
          )}
        </View>
      )}

      {isLoadingChats ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={chats}
          keyExtractor={(item) => item.id}
          contentContainerStyle={chats.length === 0 ? styles.emptyWrap : styles.list}
          ListEmptyComponent={
            <Text style={styles.empty}>Чатов пока нет. Найдите пользователя и начните переписку.</Text>
          }
          renderItem={({ item }) => (
            <Pressable
              style={styles.chatRow}
              onPress={() => handleOpenChat(item.id)}
              accessibilityRole="button"
              accessibilityLabel={getChatName(item)}
            >
              <Text style={styles.chatName}>{getChatName(item)}</Text>
              <Text style={styles.chatType}>
                {item.type === "DIRECT" ? "Личный чат" : item.type === "GROUP" ? "Группа" : "Канал"}
              </Text>
            </Pressable>
          )}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { fontSize: 24, fontWeight: "700", color: colors.text },
  subtitle: { color: colors.muted, marginTop: 2, fontSize: 12 },
  headerActions: { flexDirection: "row", gap: 8 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBtnText: { color: colors.primary, fontSize: 20, fontWeight: "700" },
  searchBox: { padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  userRow: {
    marginTop: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  userName: { color: colors.text, fontWeight: "600" },
  userEmail: { color: colors.muted, fontSize: 12, marginTop: 2 },
  list: { padding: 16 },
  emptyWrap: { flexGrow: 1, justifyContent: "center", padding: 24 },
  empty: { color: colors.muted, textAlign: "center" },
  chatRow: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chatName: { color: colors.text, fontWeight: "600", fontSize: 16 },
  chatType: { color: colors.muted, fontSize: 12, marginTop: 4 },
})
