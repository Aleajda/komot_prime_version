import { useEffect } from "react"
import { HashRouter, Navigate, Route, Routes } from "react-router-dom"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { initializeAuth } from "@/store/slices/authSlice"
import { AppLayout } from "@/components/AppLayout"
import { LoginPage } from "@/pages/LoginPage"
import { RegisterPage } from "@/pages/RegisterPage"
import { ChatPage } from "@/pages/ChatPage"
import { FriendsPage } from "@/pages/FriendsPage"

export const App = () => {
  const dispatch = useAppDispatch()
  const { isAuthenticated } = useAppSelector((s) => s.auth)

  useEffect(() => {
    dispatch(initializeAuth())
  }, [dispatch])

  return (
    <HashRouter>
      <Routes>
        <Route
          path="/auth/login"
          element={isAuthenticated ? <Navigate to="/chat" replace /> : <LoginPage />}
        />
        <Route
          path="/auth/register"
          element={isAuthenticated ? <Navigate to="/chat" replace /> : <RegisterPage />}
        />
        <Route element={<AppLayout />}>
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/friends" element={<FriendsPage />} />
        </Route>
        <Route path="*" element={<Navigate to={isAuthenticated ? "/chat" : "/auth/login"} replace />} />
      </Routes>
    </HashRouter>
  )
}
