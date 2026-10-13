import { NavLink, Outlet, Navigate } from "react-router-dom"
import { useEffect } from "react"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { fetchCurrentUser, logout } from "@/store/slices/authSlice"
import { webSocketService } from "@/services"
import { setUnauthorizedHandler } from "@/lib/api-client"

export const AppLayout = () => {
  const dispatch = useAppDispatch()
  const { isAuthenticated, user, token } = useAppSelector((s) => s.auth)

  useEffect(() => {
    setUnauthorizedHandler(() => {
      webSocketService.disconnect()
      dispatch(logout())
    })
  }, [dispatch])

  useEffect(() => {
    if (token && !user) {
      dispatch(fetchCurrentUser())
    }
  }, [token, user, dispatch])

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />
  }

  const handleLogout = async () => {
    webSocketService.disconnect()
    await dispatch(logout())
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">Kompot</div>
        <NavLink to="/chat" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
          Чаты
        </NavLink>
        <NavLink to="/friends" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
          Друзья
        </NavLink>
        <div style={{ marginTop: "auto" }}>
          <div className="muted" style={{ marginBottom: 8 }}>
            {user?.username || user?.email || "Пользователь"}
          </div>
          <button className="btn danger" type="button" onClick={handleLogout} style={{ width: "100%" }}>
            Выйти
          </button>
        </div>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  )
}
