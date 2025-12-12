"use client"

import { useEffect, useState, useRef } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { webSocketService } from "@/services"
import { MessageResponse, ChatResponse, UserResponse } from "@/types/api"
import { Loader2, Search, Users, X, Plus, Send, MessageSquare } from "lucide-react"
import { toast } from "sonner"

export default function ChatPage() {
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
  } = useAppSelector((state) => state.chat)
  const { user: currentUser } = useAppSelector((state) => state.auth)

  const [message, setMessage] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [showUserSearch, setShowUserSearch] = useState(false)
  const [groupName, setGroupName] = useState("")
  const [selectedUsers, setSelectedUsers] = useState<UserResponse[]>([])
  const [isCreatingGroup, setIsCreatingGroup] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isWebSocketConnected, setIsWebSocketConnected] = useState(false)
  const unsubscribeRef = useRef<(() => void) | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    dispatch(fetchChats())
    dispatch(fetchFriends())

    const unsubscribe = webSocketService.onConnectionChange((connected) => {
      setIsWebSocketConnected(connected)
    })

    webSocketService.connect()

    return () => {
      unsubscribe()
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
      }
      webSocketService.disconnect()
    }
  }, [dispatch])

  useEffect(() => {
    if (activeChatId) {
      const chatMessages = messages[activeChatId]
      if (!chatMessages || chatMessages.length === 0) {
        dispatch(fetchChatMessages(activeChatId))
      }

      if (unsubscribeRef.current) {
        unsubscribeRef.current()
      }

      unsubscribeRef.current = webSocketService.subscribeToChat(activeChatId, (message: MessageResponse) => {
        console.log("[CHAT PAGE] Message received via WebSocket:", message)
        console.log("[CHAT PAGE] Current messages before add:", messages[activeChatId]?.length || 0)
        dispatch(addMessage(message))
        console.log("[CHAT PAGE] Message dispatched to Redux")
        setTimeout(() => {
          scrollToBottom()
        }, 100)
      })
      
      setTimeout(() => {
        webSocketService.logStatus()
      }, 1000)
    }

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
        unsubscribeRef.current = null
      }
    }
  }, [activeChatId, dispatch])

  useEffect(() => {
    scrollToBottom()
  }, [messages, activeChatId])

  useEffect(() => {
    if (searchQuery.trim()) {
      const timeoutId = setTimeout(() => {
        dispatch(searchUsers(searchQuery))
      }, 500)
      return () => clearTimeout(timeoutId)
    } else {
      dispatch(clearUsers())
    }
  }, [searchQuery, dispatch])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeChatId || !message.trim() || isSending || !isWebSocketConnected) {
      return
    }

    setIsSending(true)
    try {
      const messageData = {
        content: message.trim(),
        chatId: activeChatId,
        type: "TEXT" as const,
      }

      webSocketService.sendMessage(activeChatId, messageData)
      setMessage("")
    } catch (error) {
      toast.error("Ошибка отправки сообщения")
    } finally {
      setIsSending(false)
    }
  }

  const handleStartChat = async (userId: string) => {
    try {
      const { chatService } = await import("@/services")
      const chat = await chatService.getOrCreateDirectChat(userId)
      
      dispatch(addChat(chat))
      dispatch(setActiveChat(chat.id))
      await dispatch(fetchChats())
      setShowUserSearch(false)
      setSearchQuery("")
      dispatch(clearUsers())
    } catch (error) {
      toast.error("Ошибка создания чата")
    }
  }

  const toggleUserSelection = (user: UserResponse) => {
    setSelectedUsers((prev) => {
      const isSelected = prev.some((u) => u.id === user.id)
      if (isSelected) {
        return prev.filter((u) => u.id !== user.id)
      } else {
        return [...prev, user]
      }
    })
  }

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedUsers.length === 0) {
      return
    }

    setIsCreatingGroup(true)
    try {
      const newChat = await dispatch(
        createChat({
          type: "GROUP",
          name: groupName.trim(),
          userIds: selectedUsers.map((u) => u.id),
        })
      ).unwrap()

      dispatch(addChat(newChat))
      dispatch(setActiveChat(newChat.id))
      await dispatch(fetchChats())
      setShowCreateGroup(false)
      setGroupName("")
      setSelectedUsers([])
      toast.success("Группа создана")
    } catch (error) {
      toast.error("Ошибка создания группы")
    } finally {
      setIsCreatingGroup(false)
    }
  }

  const getChatName = (chat: ChatResponse): string => {
    if (chat.name) {
      return chat.name
    }
    if (chat.type === "DIRECT") {
      return "Личный чат"
    }
    return "Чат"
  }

  const getSenderLabel = (senderId: string): string => {
    if (String(senderId) === String(currentUser?.id)) {
      return "Вы"
    }
    const chat = chats.find((c) => c.id === activeChatId)
    if (chat) {
      return "Пользователь"
    }
    return "Неизвестный"
  }

  const currentChat = chats.find((chat) => chat.id === activeChatId)
  const currentMessages = activeChatId ? messages[activeChatId] || [] : []
  const isLoadingCurrentMessages = activeChatId ? isLoadingMessages[activeChatId] || false : false

  return (
    <MainLayout>
      <div className="grid h-full gap-4 lg:grid-cols-[320px_1fr] overflow-hidden">
        <Card className="flex flex-col rounded-3xl h-full overflow-hidden">
          <CardHeader className="space-y-3 border-b pb-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">Чаты</CardTitle>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowCreateGroup(true)}
                  className="h-8"
                  title="Создать группу"
                >
                  <Users className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowUserSearch(!showUserSearch)}
                  className="h-8"
                  title="Найти пользователя"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {showCreateGroup && (
              <div className="space-y-3 rounded-2xl border bg-muted/50 p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm">Создать группу</h3>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setShowCreateGroup(false)
                      setGroupName("")
                      setSelectedUsers([])
                    }}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <Input
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Название группы..."
                  className="h-9 rounded-2xl"
                />
                <div className="max-h-48 space-y-2 overflow-y-auto">
                  <p className="text-xs font-medium text-muted-foreground">Выберите участников:</p>
                  {friends.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Друзей нет</p>
                  ) : (
                    friends.map((friend) => {
                      const isSelected = selectedUsers.some((u) => u.id === friend.id)
                      return (
                        <button
                          key={friend.id}
                          onClick={() => toggleUserSelection(friend)}
                          className={`w-full rounded-2xl border p-2 text-left text-sm transition-all ${
                            isSelected
                              ? "border-primary bg-primary/10"
                              : "border-border hover:bg-muted/50"
                          }`}
                        >
                          <p className="font-medium">{friend.username || friend.email}</p>
                          <p className="text-xs text-muted-foreground">{friend.email}</p>
                        </button>
                      )
                    })
                  )}
                </div>
                <Button
                  onClick={handleCreateGroup}
                  disabled={isCreatingGroup || !groupName.trim() || selectedUsers.length === 0}
                  className="w-full rounded-2xl"
                  size="sm"
                >
                  {isCreatingGroup ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  Создать группу
                </Button>
              </div>
            )}

            {showUserSearch && !showCreateGroup && (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Поиск пользователей..."
                    className="pl-10 h-9 rounded-2xl"
                  />
                </div>
                {isLoadingUsers ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                ) : users.length > 0 && (
                  <div className="max-h-64 space-y-1 overflow-y-auto rounded-2xl border bg-background p-2">
                    {users.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => handleStartChat(user.id)}
                        className="flex w-full items-center justify-between rounded-2xl px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="truncate font-medium">{user.username || user.email}</p>
                          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                        </div>
                        <MessageSquare className="ml-2 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardHeader>
          <CardContent className="flex-1 space-y-2 overflow-y-auto p-4 min-h-0">
            {isLoadingChats ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : chats.length === 0 ? (
              <div className="py-8 text-center">
                <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-sm font-medium mb-1">Чатов пока нет</p>
                <p className="text-xs text-muted-foreground mb-4">
                  Найдите пользователя и начните переписку
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowUserSearch(true)}
                  className="rounded-2xl"
                >
                  <Search className="mr-2 h-4 w-4" />
                  Найти пользователя
                </Button>
              </div>
            ) : (
              chats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => dispatch(setActiveChat(chat.id))}
                  className={`w-full rounded-2xl border px-3 py-2.5 text-left text-sm transition-all ${
                    chat.id === activeChatId
                      ? "border-primary bg-primary/10 shadow-sm"
                      : "border-border hover:bg-muted/50 hover:shadow-sm"
                  }`}
                >
                  <p className="font-medium text-foreground truncate">{getChatName(chat)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {chat.type === "DIRECT" ? "Личный чат" : chat.type === "GROUP" ? "Группа" : "Канал"}
                  </p>
                </button>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="flex flex-1 flex-col rounded-3xl h-full overflow-hidden">
          <CardHeader className="border-b pb-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold">
                  {currentChat ? getChatName(currentChat) : "Выберите чат"}
                </CardTitle>
                {currentChat && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {currentChat.type === "DIRECT" ? "Личный чат" : currentChat.type === "GROUP" ? "Групповой чат" : "Канал"}
                  </p>
                )}
              </div>
              {!isWebSocketConnected && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Подключение...
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col p-0 min-h-0">
            <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-6 min-h-0">
              {isLoadingCurrentMessages ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : currentMessages.length === 0 ? (
                <div className="flex flex-1 items-center justify-center">
                  <div className="text-center">
                    <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                    <p className="text-sm font-medium mb-1">
                      {activeChatId ? "Сообщений нет" : "Выберите чат"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {activeChatId ? "Начните переписку" : "Выберите чат из списка или начните новый"}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {currentMessages.map((msg) => {
                    const isOwnMessage = String(msg.senderId) === String(currentUser?.id)
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[75%] rounded-3xl px-4 py-2.5 ${
                            isOwnMessage
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          {!isOwnMessage && (
                            <p className="text-xs font-medium mb-1 opacity-80">
                              {getSenderLabel(msg.senderId)}
                            </p>
                          )}
                          <p className="text-sm leading-relaxed break-words">{msg.content}</p>
                          <p className={`text-[10px] mt-1.5 ${
                            isOwnMessage ? "opacity-70" : "text-muted-foreground"
                          }`}>
                            {msg.createdAt 
                              ? new Date(msg.createdAt).toLocaleTimeString("ru-RU", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : new Date().toLocaleTimeString("ru-RU", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                            }
                          </p>
                        </div>
                      </div>
                    )
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
            <form onSubmit={handleSend} className="border-t p-4 bg-muted/30 flex-shrink-0">
              <div className="flex gap-2">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Введите сообщение..."
                  className="flex-1 h-10 rounded-2xl"
                  disabled={!activeChatId || isSending || !isWebSocketConnected}
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!activeChatId || isSending || !isWebSocketConnected || !message.trim()}
                  className="h-10 w-10 rounded-2xl"
                >
                  {isSending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
