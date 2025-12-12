"use client"

import { useEffect, useState } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { friendshipService, userService, chatService } from "@/services"
import { UserResponse, FriendshipResponse } from "@/types/api"
import { UserPlus, Check, X, Users, Search, MessageSquare, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { extractApiErrorMessage } from "@/lib/api-error"
import { useAppDispatch } from "@/store/hooks"
import { setActiveChat, addChat, fetchChats } from "@/store/slices/chatSlice"
import { useRouter } from "next/navigation"

type TabType = "friends" | "requests" | "search"

export default function FriendsPage() {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>("friends")
  const [searchQuery, setSearchQuery] = useState("")
  const [users, setUsers] = useState<UserResponse[]>([])
  const [friends, setFriends] = useState<UserResponse[]>([])
  const [followers, setFollowers] = useState<UserResponse[]>([])
  const [pendingRequests, setPendingRequests] = useState<FriendshipResponse[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [isLoadingFriends, setIsLoadingFriends] = useState(false)
  const [isLoadingRequests, setIsLoadingRequests] = useState(false)

  useEffect(() => {
    loadFriendsData()
  }, [])

  const loadFriendsData = async () => {
    setIsLoadingFriends(true)
    setIsLoadingRequests(true)
    try {
      const [friendsData, followersData, requestsData] = await Promise.all([
        friendshipService.getFriends(),
        friendshipService.getFollowers(),
        friendshipService.getPendingRequests(),
      ])
      setFriends(friendsData)
      setFollowers(followersData)
      setPendingRequests(requestsData)
    } catch (err) {
      toast.error(extractApiErrorMessage(err))
    } finally {
      setIsLoadingFriends(false)
      setIsLoadingRequests(false)
    }
  }

  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setUsers([])
      return
    }

    const timeoutId = setTimeout(async () => {
      setIsLoadingUsers(true)
      try {
        const usersData = await userService.searchUsers(searchQuery.trim())
        setUsers(usersData)
      } catch (err) {
        toast.error(extractApiErrorMessage(err))
        setUsers([])
      } finally {
        setIsLoadingUsers(false)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  const handleStartChat = async (userId: string) => {
    try {
      const chat = await chatService.getOrCreateDirectChat(userId)
      dispatch(addChat(chat))
      dispatch(setActiveChat(chat.id))
      dispatch(fetchChats())
      router.push("/chat")
      toast.success("Чат открыт")
    } catch (err) {
      toast.error(extractApiErrorMessage(err))
    }
  }

  const handleSendFriendRequest = async (userId: string) => {
    try {
      await friendshipService.sendFriendRequest(userId)
      toast.success("Заявка отправлена")
      await loadFriendsData()
      setSearchQuery("")
    } catch (err) {
      toast.error(extractApiErrorMessage(err))
    }
  }

  const handleAcceptRequest = async (friendshipId: string) => {
    try {
      await friendshipService.acceptFriendRequest(friendshipId)
      toast.success("Заявка принята")
      await loadFriendsData()
    } catch (err) {
      toast.error(extractApiErrorMessage(err))
    }
  }

  const handleRejectRequest = async (friendshipId: string) => {
    try {
      await friendshipService.rejectFriendRequest(friendshipId)
      toast.success("Заявка отклонена")
      await loadFriendsData()
    } catch (err) {
      toast.error(extractApiErrorMessage(err))
    }
  }

  const handleRemoveFriend = async (friendId: string) => {
    try {
      await friendshipService.removeFriend(friendId)
      toast.success("Пользователь удален из друзей")
      await loadFriendsData()
    } catch (err) {
      toast.error(extractApiErrorMessage(err))
    }
  }

  const isUserFriend = (userId: string) => {
    return friends.some((f) => f.id === userId)
  }

  return (
    <MainLayout>
      <div className="mx-auto max-w-4xl h-full flex flex-col space-y-6 overflow-hidden">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Друзья</h1>
            <p className="text-muted-foreground mt-1">Управляйте своими друзьями и заявками</p>
          </div>
        </div>

        <div className="flex gap-2 flex-shrink-0">
          <Button
            variant={activeTab === "friends" ? "default" : "ghost"}
            onClick={() => setActiveTab("friends")}
            className="rounded-2xl border-b-2 border-transparent data-[state=active]:border-primary"
          >
            <Users className="mr-2 h-4 w-4" />
            Друзья
            {friends.length > 0 && (
              <span className="ml-2 rounded-full bg-primary/20 px-2 py-0.5 text-xs">
                {friends.length}
              </span>
            )}
          </Button>
          <Button
            variant={activeTab === "requests" ? "default" : "ghost"}
            onClick={() => setActiveTab("requests")}
            className="rounded-2xl border-b-2 border-transparent data-[state=active]:border-primary"
          >
            Заявки
            {pendingRequests.length > 0 && (
              <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                {pendingRequests.length}
              </span>
            )}
          </Button>
          <Button
            variant={activeTab === "search" ? "default" : "ghost"}
            onClick={() => setActiveTab("search")}
            className="rounded-2xl border-b-2 border-transparent data-[state=active]:border-primary"
          >
            <Search className="mr-2 h-4 w-4" />
            Поиск
          </Button>
        </div>

        <Card className="rounded-3xl flex-1 flex flex-col overflow-hidden">
          <CardContent className="p-6 flex-1 overflow-y-auto min-h-0">
            {activeTab === "friends" && (
              <div className="space-y-6">
                {isLoadingFriends ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : friends.length === 0 && followers.length === 0 ? (
                  <div className="py-12 text-center">
                    <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-lg font-medium mb-2">Друзей пока нет</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Найдите пользователей и добавьте их в друзья
                    </p>
                    <Button onClick={() => setActiveTab("search")} variant="outline">
                      <Search className="mr-2 h-4 w-4" />
                      Найти пользователей
                    </Button>
                  </div>
                ) : (
                  <>
                    {friends.length > 0 && (
                      <div className="space-y-4">
                        <h2 className="text-lg font-semibold">Мои друзья</h2>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                          {friends.map((friend) => (
                            <div
                              key={friend.id}
                              className="group relative rounded-3xl border bg-card p-4 transition-all hover:shadow-md"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-medium truncate">{friend.username || friend.email}</h3>
                                  <p className="text-sm text-muted-foreground truncate">{friend.email}</p>
                                  {friend.firstName && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {friend.firstName} {friend.lastName}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="mt-4 flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleStartChat(friend.id)}
                                  className="flex-1"
                                >
                                  <MessageSquare className="mr-2 h-4 w-4" />
                                  Чат
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleRemoveFriend(friend.id)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {followers.length > 0 && (
                      <div className="space-y-4 mt-8 pt-8 border-t">
                        <h2 className="text-lg font-semibold">Подписчики</h2>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                          {followers.map((follower) => (
                            <div
                              key={follower.id}
                              className="group relative rounded-3xl border bg-card p-4 transition-all hover:shadow-md"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-medium truncate">{follower.username || follower.email}</h3>
                                  <p className="text-sm text-muted-foreground truncate">{follower.email}</p>
                                  {follower.firstName && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {follower.firstName} {follower.lastName}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="mt-4">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleStartChat(follower.id)}
                                  className="w-full"
                                >
                                  <MessageSquare className="mr-2 h-4 w-4" />
                                  Написать
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {activeTab === "requests" && (
              <div className="space-y-4">
                {isLoadingRequests ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : pendingRequests.length === 0 ? (
                  <div className="py-12 text-center">
                    <UserPlus className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-lg font-medium mb-2">Заявок нет</p>
                    <p className="text-sm text-muted-foreground">
                      Когда вам отправят заявку в друзья, она появится здесь
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingRequests.map((request) => (
                      <div
                        key={request.id}
                        className="flex items-center justify-between rounded-3xl border bg-card p-4 transition-all hover:shadow-sm"
                      >
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium truncate">{request.requester.username || request.requester.email}</h3>
                            <p className="text-sm text-muted-foreground truncate">{request.requester.email}</p>
                            {request.requester.firstName && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {request.requester.firstName} {request.requester.lastName}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button
                            size="sm"
                            onClick={() => handleAcceptRequest(request.id)}
                            className="min-w-[100px]"
                          >
                            <Check className="mr-2 h-4 w-4" />
                            Принять
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRejectRequest(request.id)}
                            className="min-w-[100px]"
                          >
                            <X className="mr-2 h-4 w-4" />
                            Отклонить
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "search" && (
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Поиск по имени или email..."
                    className="pl-10 h-11"
                  />
                </div>

                {isLoadingUsers ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : searchQuery.trim().length < 2 ? (
                  <div className="py-12 text-center">
                    <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-lg font-medium mb-2">Поиск пользователей</p>
                    <p className="text-sm text-muted-foreground">
                      Введите имя или email для поиска пользователей
                    </p>
                  </div>
                ) : users.length === 0 ? (
                  <div className="py-12 text-center">
                    <p className="text-lg font-medium mb-2">Пользователи не найдены</p>
                    <p className="text-sm text-muted-foreground">
                      Попробуйте изменить запрос поиска
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {users.map((user) => {
                      const isFriend = isUserFriend(user.id)
                      return (
                        <div
                          key={user.id}
                          className="group relative rounded-3xl border bg-card p-4 transition-all hover:shadow-md"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium truncate">{user.username || user.email}</h3>
                              <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                              {user.firstName && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {user.firstName} {user.lastName}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="mt-4 flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStartChat(user.id)}
                              className="flex-1"
                            >
                              <MessageSquare className="mr-2 h-4 w-4" />
                              Чат
                            </Button>
                            {!isFriend && (
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => handleSendFriendRequest(user.id)}
                                className="flex-1"
                              >
                                <UserPlus className="mr-2 h-4 w-4" />
                                Добавить
                              </Button>
                            )}
                            {isFriend && (
                              <Button
                                size="sm"
                                variant="ghost"
                                disabled
                                className="flex-1"
                              >
                                <Check className="mr-2 h-4 w-4" />
                                В друзьях
                              </Button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}

