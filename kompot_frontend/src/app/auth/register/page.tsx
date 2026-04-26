"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { register } from "@/store/slices/authSlice"

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
  })
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { isLoading, isAuthenticated } = useAppSelector((state) => state.auth)

  useEffect(() => {
    const token = localStorage.getItem("accessToken")
    if (token || isAuthenticated) {
      router.replace("/dashboard")
    }
  }, [isAuthenticated, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      return
    }

    try {
      await dispatch(
        register({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName || undefined,
          lastName: formData.lastName || undefined,
        })
      ).unwrap()
      router.push("/dashboard")
    } catch (err) {
      console.error("Ошибка регистрации:", err)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-xl border-border/60 bg-card shadow-xl">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-3xl font-bold">Регистрация</CardTitle>
          <CardDescription>Создайте аккаунт и начните работу в Kompot</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="username" className="text-sm font-medium mb-1.5 block">
                  Имя пользователя
                </label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="h-11 rounded-xl border border-border"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium mb-1.5 block">
                  Почта
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="h-11 rounded-xl border border-border"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="firstName" className="text-sm font-medium mb-1.5 block">
                  Имя (опционально)
                </label>
                <Input
                  id="firstName"
                  name="firstName"
                  type="text"
                  placeholder="Имя"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="h-11 rounded-xl border border-border"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="lastName" className="text-sm font-medium mb-1.5 block">
                  Фамилия (опционально)
                </label>
                <Input
                  id="lastName"
                  name="lastName"
                  type="text"
                  placeholder="Фамилия"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="h-11 rounded-xl border border-border"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium mb-1.5 block">
                  Пароль
                </label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  className="h-11 rounded-xl border border-border"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium mb-1.5 block">
                  Подтвердите пароль
                </label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="h-11 rounded-xl border border-border"
                  required
                  disabled={isLoading}
                />
                {formData.password !== formData.confirmPassword && formData.confirmPassword && (
                  <p className="text-xs text-muted-foreground">Пароли не совпадают</p>
                )}
              </div>
            </div>

            <Button
              type="submit" 
              disabled={isLoading || formData.password !== formData.confirmPassword}
              className="h-12 w-full text-base font-semibold"
            >
              {isLoading ? "Регистрация..." : "Зарегистрироваться"}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              Уже есть аккаунт?{" "}
              <Link href="/auth/login" className="font-medium text-primary hover:underline">
                Войти
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

