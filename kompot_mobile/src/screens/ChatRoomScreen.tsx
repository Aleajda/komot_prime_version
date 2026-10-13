import { useEffect, useMemo, useRef, useState } from "react"
import {
  View,
  Text,
  FlatList,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native"
import { NativeStackScreenProps } from "@react-navigation/native-stack"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { fetchChatMessages, addMessage } from "@/store/slices/chatSlice"
import { chatService, webSocketService } from "@/services"
import { MessageResponse, UserResponse } from "@/types/api"
import { colors } from "@/theme/colors"
import { MainStackParamList } from "@/navigation/types"

type Props = NativeStackScreenProps<MainStackParamList, "ChatRoom">

export const ChatRoomScreen = ({ route, navigation }: Props) => {
  const { chatId } = route.params
  const dispatch = useAppDispatch()
  const { chats, messages, isLoadingMessages } = useAppSelector((s) => s.chat)
  const { user: currentUser } = useAppSelector((s) => s.auth)
  const [text, setText] = useState("")
  const [sending, setSending] = useState(false)
  const [connected, setConnected] = useState(webSocketService.getConnected())
  const [members, setMembers] = useState<UserResponse[]>([])
  const listRef = useRef<FlatList>(null)
  const unsubRef = useRef<(() => void) | null>(null)

  const chat = chats.find((c) => c.id === chatId)
  const chatMessages = useMemo(() => messages[chatId] || [], [messages, chatId])
  const loading = isLoadingMessages[chatId]

  useEffect(() => {
    dispatch(fetchChatMessages(chatId))
    chatService.getChatMembers(chatId).then((m) => setMembers(m.map((x) => x.user))).catch(() => {})

    const unsubConn = webSocketService.onConnectionChange(setConnected)
    if (!webSocketService.getConnected()) {
      webSocketService.connect()
    }

    unsubRef.current = webSocketService.subscribeToChat(chatId, (msg: MessageResponse) => {
      dispatch(addMessage(msg))
    })

    return () => {
      unsubConn()
      unsubRef.current?.()
    }
  }, [chatId, dispatch])

  useEffect(() => {
    const title =
      chat?.name ||
      members.find((m) => String(m.id) !== String(currentUser?.id))?.username ||
      "Чат"
    navigation.setOptions({ title })
  }, [chat, members, currentUser, navigation])

  const getSenderLabel = (senderId: string) => {
    if (String(senderId) === String(currentUser?.id)) return "Вы"
    return members.find((m) => String(m.id) === String(senderId))?.username || "Неизвестный"
  }

  const handleSend = () => {
    if (!text.trim() || !connected || sending) return
    setSending(true)
    try {
      webSocketService.sendMessage(chatId, {
        content: text.trim(),
        type: "TEXT",
        chatId,
      })
      setText("")
    } finally {
      setSending(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      {!connected && (
        <View style={styles.banner}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.bannerText}>Подключение к чату...</Text>
        </View>
      )}

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          ref={listRef}
          data={chatMessages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={<Text style={styles.empty}>Сообщений нет. Начните переписку.</Text>}
          renderItem={({ item }) => {
            const own = String(item.senderId) === String(currentUser?.id)
            return (
              <View style={[styles.bubbleWrap, own ? styles.ownWrap : styles.otherWrap]}>
                <View style={[styles.bubble, own ? styles.ownBubble : styles.otherBubble]}>
                  {!own && <Text style={styles.sender}>{getSenderLabel(item.senderId)}</Text>}
                  <Text style={styles.content}>{item.content}</Text>
                  <Text style={styles.time}>
                    {item.createdAt
                      ? new Date(item.createdAt).toLocaleTimeString("ru-RU", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : ""}
                  </Text>
                </View>
              </View>
            )
          }}
        />
      )}

      <View style={styles.composer}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Введите сообщение..."
          placeholderTextColor={colors.muted}
          editable={connected && !sending}
        />
        <Pressable
          style={[styles.sendBtn, (!text.trim() || !connected) && styles.sendDisabled]}
          onPress={handleSend}
          disabled={!text.trim() || !connected || sending}
          accessibilityRole="button"
          accessibilityLabel="Отправить"
        >
          <Text style={styles.sendText}>→</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  banner: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
    backgroundColor: colors.surface,
  },
  bannerText: { color: colors.muted, fontSize: 12 },
  list: { padding: 16, flexGrow: 1 },
  empty: { color: colors.muted, textAlign: "center", marginTop: 40 },
  bubbleWrap: { marginBottom: 10 },
  ownWrap: { alignItems: "flex-end" },
  otherWrap: { alignItems: "flex-start" },
  bubble: { maxWidth: "80%", borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  ownBubble: { backgroundColor: colors.ownBubble },
  otherBubble: { backgroundColor: colors.otherBubble },
  sender: { color: colors.primary, fontSize: 11, marginBottom: 4, fontWeight: "600" },
  content: { color: colors.text, fontSize: 15, lineHeight: 20 },
  time: { color: colors.muted, fontSize: 10, marginTop: 6, alignSelf: "flex-end" },
  composer: {
    flexDirection: "row",
    gap: 8,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 14,
    color: colors.text,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sendDisabled: { opacity: 0.5 },
  sendText: { color: colors.primaryText, fontSize: 20, fontWeight: "700" },
})
