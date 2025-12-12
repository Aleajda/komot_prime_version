"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Header } from "./header"
import { Sidebar } from "./sidebar"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { fetchCurrentUser } from "@/store/slices/authSlice"

interface MainLayoutProps {
  children: React.ReactNode
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  const router = useRouter()
  const dispatch = useAppDispatch()
  const { token, isAuthenticated, isLoading, user } = useAppSelector((state) => state.auth)

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    const storedToken = token || localStorage.getItem("accessToken")

    if (!storedToken && !isLoading) {
      setIsCheckingAuth(false)
      router.push("/auth/login")
      return
    }

    if (storedToken && !user && !isLoading) {
      dispatch(fetchCurrentUser())
    }

    setIsCheckingAuth(false)
  }, [dispatch, router, token, user, isLoading])

  if (isCheckingAuth && !isAuthenticated && !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Загрузка...</p>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 overflow-hidden md:ml-64">
          <div className="container h-full p-4 md:p-6 overflow-hidden">{children}</div>
        </main>
      </div>
    </div>
  )
}
