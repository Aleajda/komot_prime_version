import { FormEvent, useEffect, useMemo, useRef, useState } from "react"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import {
  fetchChats,
  fetchChatMessages,
  createChat,
  searchUsers,
  fetchFriends,
  setActiveChat,
  addMessage,
  addChat,
  clearUsers,
} from "@/store/slices/chatSlice"
import { chatService, webSocketService } from "@/services"
import { ChatResponse, MessageResponse, UserResponse } from "@/types/api"

export const ChatPage = () => {
  const dispatch = useAppDispatch()
  const {
    chats,
    activeChatId,
    messages,
    users,
    friends,
    isLoadingChats,
    isLoadingMessages,
    isLoadingUsers,
  } = useAppSelector((s) => s.chat)
  const { user: currentUser } = useAppSelector((s) => s.auth)

  const [text, setText] = useState("")
  const [sending, setSending] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [groupName, setGroupName] = useState("")
  const [selectedUsers, setSelectedUsers] = useState<UserResponse[]>([])
  const [creatingGroup, setCreatingGroup] = useState(false)
  const [wsConnected, setWsConnected] = useState(false)
  const [membersByChat, setMembersByChat] = useState<Record<string, UserResponse[]>>({})
  const unsubRef = useRef<(() => void) | null>(null)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    dispatch(fetchChats())
    dispatch(fetchFriends())
    const unsub = webSocketService.onConnectionChange(setWsConnected)
    webSocketService.connect()
    return () => {
      unsub()
      unsubRef.current?.()
      webSocketService.disconnect()
    }
  }, [dispatch])

  useEffect(() => {
    if (!activeChatId) return
    if (!messages[activeChatId]?.length) {
      dispatch(fetchChatMessages(activeChatId))
    }
    unsubRef.current?.()
    unsubRef.current = webSocketService.subscribeToChat(activeChatId, (msg: MessageResponse) => {
      dispatch(addMessage(msg))
    })
    return () => {
      unsubRef.current?.()
      unsubRef.current = null
    }
  }, [activeChatId, dispatch])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, activeChatId])

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
      if (!toLoad.length) return
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

  const getChatName = (chat: ChatResponse) => {
    if (chat.name) return chat.name
    if (chat.type === "DIRECT") {
      const other = (membersByChat[chat.id] || []).find(
        (m) => String(m.id) !== String(currentUser?.id)
      )
      return other?.username || other?.email || "Личный чат"
    }
    return "Чат"
  }

  const getSenderLabel = (senderId: string) => {
    if (String(senderId) === String(currentUser?.id)) return "Вы"
    if (!activeChatId) return "Неизвестный"
    return (
      (membersByChat[activeChatId] || []).find((m) => String(m.id) === String(senderId))
        ?.username || "Неизвестный"
    )
  }

  const currentChat = chats.find((c) => c.id === activeChatId)
  const currentMessages = useMemo(
    () => (activeChatId ? messages[activeChatId] || [] : []),
    [activeChatId, messages]
  )
  const loadingMessages = activeChatId ? isLoadingMessages[activeChatId] : false

  const handleSend = (e: FormEvent) => {
    e.preventDefault()
    if (!activeChatId || !text.trim() || !wsConnected || sending) return
    setSending(true)
    try {
      webSocketService.sendMessage(activeChatId, {
        content: text.trim(),
        type: "TEXT",
        chatId: activeChatId,
      })
      setText("")
    } finally {
      setSending(false)
    }
  }

  const handleStartChat = async (userId: string) => {
    const chat = await chatService.getOrCreateDirectChat(userId)
    dispatch(addChat(chat))
    dispatch(setActiveChat(chat.id))
    setShowSearch(false)
    setSearchQuery("")
    dispatch(clearUsers())
  }

  const toggleUser = (user: UserResponse) => {
    setSelectedUsers((prev) =>
      prev.some((u) => u.id === user.id) ? prev.filter((u) => u.id !== user.id) : [...prev, user]
    )
  }

  const handleCreateGroup = async () => {
    if (!groupName.trim() || !selectedUsers.length) return
    setCreatingGroup(true)
    try {
      const chat = await dispatch(
        createChat({
          type: "GROUP",
          name: groupName.trim(),
          userIds: selectedUsers.map((u) => u.id),
        })
      ).unwrap()
      dispatch(addChat(chat))
      dispatch(setActiveChat(chat.id))
      setShowCreateGroup(false)
      setGroupName("")
      setSelectedUsers([])
    } finally {
      setCreatingGroup(false)
    }
  }

  return (
    <div className="chat-layout">
      <div className="panel">
        <div className="panel-header">
          <div>
            <strong>Чаты</strong>
            <div className="muted">{wsConnected ? "Онлайн" : "Подключение..."}</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn ghost" type="button" onClick={() => setShowCreateGroup((v) => !v)}>
              Группа
            </button>
            <button className="btn ghost" type="button" onClick={() => setShowSearch((v) => !v)}>
              Поиск
            </button>
          </div>
        </div>

        {showCreateGroup && (
          <div style={{ padding: 12, borderBottom: "1px solid var(--border)" }}>
            <input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Название группы"
              style={{ width: "100%", marginBottom: 8, padding: 10, borderRadius: 10, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)" }}
            />
            <div style={{ maxHeight: 160, overflow: "auto", marginBottom: 8 }}>
              {friends.map((friend) => {
                const selected = selectedUsers.some((u) => u.id === friend.id)
                return (
                  <button
                    key={friend.id}
                    type="button"
                    className={`list-item ${selected ? "active" : ""}`}
                    onClick={() => toggleUser(friend)}
                  >
                    <div>{friend.username || friend.email}</div>
                    <small>{friend.email}</small>
                  </button>
                )
              })}
            </div>
            <button
              className="btn"
              type="button"
              disabled={creatingGroup || !groupName.trim() || !selectedUsers.length}
              onClick={handleCreateGroup}
              style={{ width: "100%" }}
            >
              {creatingGroup ? "Создание..." : "Создать группу"}
            </button>
          </div>
        )}

        {showSearch && !showCreateGroup && (
          <div style={{ padding: 12, borderBottom: "1px solid var(--border)" }}>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск пользователей..."
              style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)" }}
            />
            {isLoadingUsers ? (
              <div className="empty">Поиск...</div>
            ) : (
              users.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  className="list-item"
                  onClick={() => handleStartChat(user.id)}
                >
                  <div>{user.username || user.email}</div>
                  <small>{user.email}</small>
                </button>
              ))
            )}
          </div>
        )}

        <div className="panel-body">
          {isLoadingChats ? (
            <div className="empty">Загрузка...</div>
          ) : chats.length === 0 ? (
            <div className="empty">Чатов пока нет</div>
          ) : (
            chats.map((chat) => (
              <button
                key={chat.id}
                type="button"
                className={`list-item ${chat.id === activeChatId ? "active" : ""}`}
                onClick={() => dispatch(setActiveChat(chat.id))}
              >
                <div>{getChatName(chat)}</div>
                <small>
                  {chat.type === "DIRECT" ? "Личный чат" : chat.type === "GROUP" ? "Группа" : "Канал"}
                </small>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <div>
            <strong>{currentChat ? getChatName(currentChat) : "Выберите чат"}</strong>
            {currentChat && (
              <div className="muted">
                {currentChat.type === "DIRECT"
                  ? "Личный чат"
                  : currentChat.type === "GROUP"
                    ? "Групповой чат"
                    : "Канал"}
              </div>
            )}
          </div>
        </div>
        <div className="panel-body">
          {loadingMessages ? (
            <div className="empty">Загрузка сообщений...</div>
          ) : !activeChatId ? (
            <div className="empty">Выберите чат из списка</div>
          ) : currentMessages.length === 0 ? (
            <div className="empty">Сообщений нет</div>
          ) : (
            <div className="messages">
              {currentMessages.map((msg) => {
                const own = String(msg.senderId) === String(currentUser?.id)
                return (
                  <div key={msg.id} className={`bubble-row ${own ? "own" : ""}`}>
                    <div className={`bubble ${own ? "own" : ""}`}>
                      {!own && <div className="muted">{getSenderLabel(msg.senderId)}</div>}
                      <div>{msg.content}</div>
                      <div className="meta">
                        {msg.createdAt
                          ? new Date(msg.createdAt).toLocaleTimeString("ru-RU", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : ""}
                      </div>
                    </div>
                  </div>
                )
              })}
              <div ref={endRef} />
            </div>
          )}
        </div>
        <form className="composer" onSubmit={handleSend}>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Введите сообщение..."
            disabled={!activeChatId || !wsConnected || sending}
          />
          <button
            className="btn"
            type="submit"
            disabled={!activeChatId || !wsConnected || sending || !text.trim()}
          >
            Отправить
          </button>
        </form>
      </div>
    </div>
  )
}
