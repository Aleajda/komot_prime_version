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

  const router = useRouter()
  const dispatch = useAppDispatch()
  const { token, isAuthenticated, isLoading, user } = useAppSelector((state) => state.auth)
  const storedToken = typeof window !== "undefined" ? token || localStorage.getItem("accessToken") : token

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    if (!storedToken && !isLoading) {
      router.replace("/auth/login")
      return
    }

    if (storedToken && !user && !isLoading) {
      dispatch(fetchCurrentUser())
    }
  }, [dispatch, router, storedToken, user, isLoading])

  if (isLoading || (storedToken && !isAuthenticated && !user)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Загрузка...</p>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col">
      <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex min-h-0 flex-1">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex min-h-0 flex-1 flex-col md:ml-64">
          <div className="container min-h-0 flex-1 overflow-y-auto p-4 md:p-6">{children}</div>
        </main>
      </div>
    </div>
  )
}
