"use client"

import Link from "next/link"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useFeatures } from "@/config/features"
import { CherryMark } from "@/components/brand/cherry-mark"

export default function Home() {
  const router = useRouter()
  const { workspaceEnabled } = useFeatures()

  useEffect(() => {
    const token = localStorage.getItem("accessToken")
    if (token) {
      router.replace("/dashboard")
    }
  }, [router])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-2xl space-y-10 text-center">
        <div className="space-y-4">
          <CherryMark className="mx-auto h-20 w-20" />
          <h1 className="text-5xl font-medium leading-tight tracking-wide text-primary md:text-6xl">
            Добро пожаловать в Компот
          </h1>
          <p className="text-lg text-muted-foreground">
            {workspaceEnabled ? "Система управления проектами и командами" : "Социальная сеть"}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="transition-shadow hover:shadow-xl">
            <CardHeader>
              <CardTitle>Вход</CardTitle>
              <CardDescription>
                Войдите в существующий аккаунт
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/auth/login">
                <Button variant="outline" className="w-full">
                  Войти
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="transition-shadow hover:shadow-xl">
            <CardHeader>
              <CardTitle>Регистрация</CardTitle>
              <CardDescription>
                Создайте новый аккаунт
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/auth/register">
                <Button variant="outline" className="w-full">
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
