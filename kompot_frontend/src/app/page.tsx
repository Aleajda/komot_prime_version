"use client"

import Link from "next/link"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem("accessToken")
    if (token) {
      router.replace("/dashboard")
    }
  }, [router])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 dark:bg-[#0f131a]">
      <div className="w-full max-w-2xl space-y-10 text-center">
        <div className="space-y-4">
          <h1 className="text-5xl font-medium leading-tight tracking-wide text-primary dark:text-[#5bcffd] dark:drop-shadow-[0px_0px_24px_#5bcffd] md:text-6xl">
            Добро пожаловать в Kompot
          </h1>
          <p className="text-lg text-muted-foreground dark:text-[#8e929b]">
            Система управления проектами и командами
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="hover:shadow-xl dark:hover:shadow-[0px_0px_20px_0px_rgba(91,207,253,0.2)] transition-shadow">
            <CardHeader>
              <CardTitle>Вход</CardTitle>
              <CardDescription>
                Войдите в существующий аккаунт
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/auth/login">
                <Button variant="outline" className="w-full border-primary/50 dark:border-[#5bcffd]/50">
                  Войти
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-xl dark:hover:shadow-[0px_0px_20px_0px_rgba(91,207,253,0.2)] transition-shadow">
            <CardHeader>
              <CardTitle>Регистрация</CardTitle>
              <CardDescription>
                Создайте новый аккаунт
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/auth/register">
                <Button variant="outline" className="w-full border-primary/50 dark:border-[#5bcffd]/50">
                  Зарегистрироваться
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
