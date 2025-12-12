"use client"

import { useEffect, useMemo, useState } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { User, Mail } from "lucide-react"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { fetchCurrentUser } from "@/store/slices/authSlice"
import { userService } from "@/services"

type ProfileForm = {
  username: string
  email: string
  firstName: string
  lastName: string
}

export default function ProfilePage() {
  const dispatch = useAppDispatch()
  const { user, isLoading } = useAppSelector((state) => state.auth)

  const initialForm = useMemo<ProfileForm>(
    () => ({
      username: user?.username || "",
      email: user?.email || "",
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
    }),
    [user]
  )

  const [formData, setFormData] = useState<ProfileForm>(initialForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user && !isLoading) {
      dispatch(fetchCurrentUser())
    }
  }, [dispatch, user, isLoading])

  useEffect(() => {
    setFormData(initialForm)
  }, [initialForm])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id) return

    setSaving(true)
    try {
      await userService.updateUser(user.id, {
        username: formData.username,
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
      })
      await dispatch(fetchCurrentUser())
    } catch (error) {
      console.error("Не удалось сохранить профиль", error)
    } finally {
      setSaving(false)
    }
  }

  const isSubmitDisabled = saving || isLoading || !formData.username || !formData.email

  return (
    <MainLayout>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Профиль</h1>
          <p className="text-muted-foreground">Управление личными данными</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Личная информация</CardTitle>
              <CardDescription>Обновите ваши данные</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-10 w-10 text-primary" />
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {user?.role && <p>Роль: {user.role}</p>}
                    {user?.createdAt && <p>Создан: {new Date(user.createdAt).toLocaleDateString()}</p>}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-3">
                    <label htmlFor="username" className="block text-sm font-medium text-muted-foreground">
                      Имя пользователя
                    </label>
                    <Input
                      id="username"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      placeholder="username"
                      required
                      disabled={saving || isLoading}
                    />
                  </div>

                  <div className="space-y-3">
                    <label htmlFor="email" className="block text-sm font-medium text-muted-foreground">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="pl-9"
                        required
                        disabled={saving || isLoading}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label htmlFor="firstName" className="block text-sm font-medium text-muted-foreground">
                      Имя
                    </label>
                    <Input
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      placeholder="Имя"
                      disabled={saving || isLoading}
                    />
                  </div>

                  <div className="space-y-3">
                    <label htmlFor="lastName" className="block text-sm font-medium text-muted-foreground">
                      Фамилия
                    </label>
                    <Input
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      placeholder="Фамилия"
                      disabled={saving || isLoading}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={isSubmitDisabled}>
                    {saving ? "Сохранение..." : "Сохранить изменения"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  )
}