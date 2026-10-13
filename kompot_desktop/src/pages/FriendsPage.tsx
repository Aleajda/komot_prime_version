import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { friendshipService, userService, chatService } from "@/services"
import { UserResponse, FriendshipResponse } from "@/types/api"
import { useAppDispatch } from "@/store/hooks"
import { addChat, setActiveChat, fetchChats } from "@/store/slices/chatSlice"
import { extractApiErrorMessage } from "@/lib/api-error"

type TabType = "friends" | "requests" | "search"

export const FriendsPage = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const [tab, setTab] = useState<TabType>("friends")
  const [friends, setFriends] = useState<UserResponse[]>([])
  const [followers, setFollowers] = useState<UserResponse[]>([])
  const [requests, setRequests] = useState<FriendshipResponse[]>([])
  const [users, setUsers] = useState<UserResponse[]>([])
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
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
      setError(extractApiErrorMessage(e))
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
        setError(extractApiErrorMessage(e))
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
      navigate("/chat")
    } catch (e) {
      setError(extractApiErrorMessage(e))
    }
  }

  const handleAdd = async (userId: string) => {
    try {
      await friendshipService.sendFriendRequest(userId)
      await load()
      setQuery("")
    } catch (e) {
      setError(extractApiErrorMessage(e))
    }
  }

  const handleAccept = async (id: string) => {
    try {
      await friendshipService.acceptFriendRequest(id)
      await load()
    } catch (e) {
      setError(extractApiErrorMessage(e))
    }
  }

  const handleReject = async (id: string) => {
    try {
      await friendshipService.rejectFriendRequest(id)
      await load()
    } catch (e) {
      setError(extractApiErrorMessage(e))
    }
  }

  const handleRemove = async (id: string) => {
    try {
      await friendshipService.removeFriend(id)
      await load()
    } catch (e) {
      setError(extractApiErrorMessage(e))
    }
  }

  const isFriend = (id: string) => friends.some((f) => f.id === id)

  return (
    <div className="page">
      <div className="page-header">
        <h1 style={{ margin: 0 }}>Друзья</h1>
        <p className="muted">Управляйте друзьями и заявками</p>
      </div>

      <div className="tabs">
        {(
          [
            ["friends", `Друзья (${friends.length})`],
            ["requests", `Заявки (${requests.length})`],
            ["search", "Поиск"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={`tab ${tab === key ? "active" : ""}`}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {error ? <div className="error" style={{ padding: "0 20px" }}>{error}</div> : null}

      {tab === "friends" && (
        loading ? (
          <div className="empty">Загрузка...</div>
        ) : friends.length === 0 && followers.length === 0 ? (
          <div className="empty">Друзей пока нет</div>
        ) : (
          <div className="grid-cards">
            {friends.map((friend) => (
              <div key={friend.id} className="user-card">
                <h3>{friend.username || friend.email}</h3>
                <p>{friend.email}</p>
                <div className="row-actions">
                  <button className="btn ghost" type="button" onClick={() => handleStartChat(friend.id)}>
                    Чат
                  </button>
                  <button className="btn danger" type="button" onClick={() => handleRemove(friend.id)}>
                    Удалить
                  </button>
                </div>
              </div>
            ))}
            {followers.map((follower) => (
              <div key={`f-${follower.id}`} className="user-card">
                <h3>{follower.username || follower.email}</h3>
                <p>{follower.email} · подписчик</p>
                <button className="btn ghost" type="button" onClick={() => handleStartChat(follower.id)}>
                  Написать
                </button>
              </div>
            ))}
          </div>
        )
      )}

      {tab === "requests" && (
        loading ? (
          <div className="empty">Загрузка...</div>
        ) : requests.length === 0 ? (
          <div className="empty">Заявок нет</div>
        ) : (
          <div className="grid-cards">
            {requests.map((req) => (
              <div key={req.id} className="user-card">
                <h3>{req.requester.username || req.requester.email}</h3>
                <p>{req.requester.email}</p>
                <div className="row-actions">
                  <button className="btn" type="button" onClick={() => handleAccept(req.id)}>
                    Принять
                  </button>
                  <button className="btn ghost" type="button" onClick={() => handleReject(req.id)}>
                    Отклонить
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {tab === "search" && (
        <>
          <div style={{ padding: "0 20px" }}>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск по имени или email..."
              style={{
                width: "100%",
                padding: 12,
                borderRadius: 12,
                border: "1px solid var(--border)",
                background: "var(--surface)",
                color: "var(--text)",
              }}
            />
          </div>
          {searching ? (
            <div className="empty">Поиск...</div>
          ) : query.trim().length < 2 ? (
            <div className="empty">Введите минимум 2 символа</div>
          ) : users.length === 0 ? (
            <div className="empty">Пользователи не найдены</div>
          ) : (
            <div className="grid-cards">
              {users.map((user) => (
                <div key={user.id} className="user-card">
                  <h3>{user.username || user.email}</h3>
                  <p>{user.email}</p>
                  <div className="row-actions">
                    <button className="btn ghost" type="button" onClick={() => handleStartChat(user.id)}>
                      Чат
                    </button>
                    {!isFriend(user.id) ? (
                      <button className="btn" type="button" onClick={() => handleAdd(user.id)}>
                        Добавить
                      </button>
                    ) : (
                      <span className="muted">В друзьях</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
