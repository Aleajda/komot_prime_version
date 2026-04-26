"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { adminService } from "@/services"
import { AdminStatsResponse, AdminTeamSummary, AdminUserSummary } from "@/types/api"
import { Users, FolderKanban, Shield, Activity, AlertTriangle, Clock3 } from "lucide-react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { extractApiErrorMessage } from "@/lib/api-error"
import { useAppSelector } from "@/store/hooks"

const formatDate = (value: string) => new Date(value).toLocaleDateString()

export default function AdminPage() {
  const router = useRouter()
  const { user, isLoading: isAuthLoading } = useAppSelector((state) => state.auth)
  const [stats, setStats] = useState<AdminStatsResponse | null>(null)
  const [users, setUsers] = useState<AdminUserSummary[]>([])
  const [teams, setTeams] = useState<AdminTeamSummary[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const cards = useMemo(
    () =>
      stats
        ? [
            { title: "Всего пользователей", value: stats.totalUsers, icon: Users, change: `Активных: ${stats.activeUsers}` },
            { title: "Активных проектов", value: stats.activeProjects, icon: FolderKanban, change: `Задач сегодня: ${stats.tasksToday}` },
            { title: "Администраторов", value: stats.adminsCount, icon: Shield, change: `Активность: ${stats.activityPercent}%` },
            { title: "Аптайм", value: `${stats.uptimeHours} ч`, icon: Clock3, change: `Ошибки 24ч: ${stats.errors24h}` },
          ]
        : [],
    [stats]
  )

  useEffect(() => {
    if (!user) {
      return
    }
    if (user.role !== "ADMIN") {
      router.replace("/dashboard")
      return
    }
    const load = async () => {
      setIsLoading(true)
      try {
        const [statsResp, usersResp, teamsResp] = await Promise.all([
          adminService.getStats(),
          adminService.getUsers(),
          adminService.getTeams(),
        ])
        setStats(statsResp)
        setUsers(usersResp.slice(0, 6))
        setTeams(teamsResp.slice(0, 6))
      } catch (err) {
        toast.error(extractApiErrorMessage(err))
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [router, user])

  if (isAuthLoading || !user) {
    return (
      <MainLayout>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Загрузка...
        </div>
      </MainLayout>
    )
  }

  if (user.role !== "ADMIN") {
    return (
      <MainLayout>
        <div className="text-sm text-muted-foreground">Доступ запрещен</div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Панель администратора</h1>
          <p className="text-muted-foreground">Статистика и управление системой</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {isLoading && cards.length === 0 ? (
            <Card className="md:col-span-2 lg:col-span-4">
              <CardContent className="flex items-center gap-2 py-6 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Загрузка метрик...
              </CardContent>
            </Card>
          ) : (
            cards.map((stat) => {
              const Icon = stat.icon
              return (
                <Card key={stat.title}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <p className="text-xs text-muted-foreground">{stat.change}</p>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Пользователи</CardTitle>
                <CardDescription>Последние добавленные и их роли</CardDescription>
              </div>
              <Button variant="outline" size="sm">Обновить</Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading && users.length === 0 ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Загрузка пользователей...
                </div>
              ) : users.length === 0 ? (
                <p className="text-sm text-muted-foreground">Нет данных</p>
              ) : (
                <div className="overflow-hidden rounded-lg border border-border">
                  <div className="grid grid-cols-5 gap-2 bg-muted/40 px-3 py-2 text-xs font-medium text-muted-foreground">
                    <span className="col-span-2">Пользователь</span>
                    <span>Роль</span>
                    <span>Статус</span>
                    <span>Создан</span>
                  </div>
                  {users.map((user) => (
                    <div key={user.id} className="grid grid-cols-5 gap-2 border-t border-border px-3 py-2 text-sm">
                      <div className="col-span-2 flex flex-col">
                        <span className="font-medium text-foreground">{user.username || user.email}</span>
                        <span className="text-xs text-muted-foreground">{user.email}</span>
                      </div>
                      <div className="flex items-center">
                        <Badge variant="secondary" className="text-[11px]">
                          {user.role === "ADMIN" ? "Админ" : "Пользователь"}
                        </Badge>
                      </div>
                      <div className="flex items-center">
                        <Badge variant={user.isActive ? "default" : "outline"} className="text-[11px]">
                          {user.isActive ? "Активен" : "Заблокирован"}
                        </Badge>
                      </div>
                      <div className="flex items-center text-xs text-muted-foreground">{formatDate(user.createdAt)}</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Команды</CardTitle>
              <CardDescription>Самые активные команды</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading && teams.length === 0 ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Загрузка команд...
                </div>
              ) : teams.length === 0 ? (
                <p className="text-sm text-muted-foreground">Нет данных</p>
              ) : (
                <div className="space-y-2">
                  {teams.map((team) => (
                    <div key={team.id} className="rounded-lg border border-border px-3 py-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{team.name}</p>
                          <p className="text-xs text-muted-foreground">Создана: {formatDate(team.createdAt)}</p>
                        </div>
                        <Badge variant="secondary" className="text-[11px]">
                          {team.projects} проектов
                        </Badge>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">Участников: {team.members}</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Состояние системы</CardTitle>
              <CardDescription>Активность, ошибки и аптайм</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {stats ? (
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg border border-border bg-muted/30 px-3 py-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Activity className="h-4 w-4 text-primary" /> Активность
                  </div>
                  <p className="text-2xl font-bold mt-2">{stats.activityPercent}%</p>
                  <p className="text-xs text-muted-foreground">Пользовательская активность</p>
                </div>
                <div className="rounded-lg border border-border bg-muted/30 px-3 py-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <AlertTriangle className="h-4 w-4 text-destructive" /> Ошибки за 24ч
                  </div>
                  <p className="text-2xl font-bold mt-2">{stats.errors24h}</p>
                  <p className="text-xs text-muted-foreground">Логи с ошибками приложений</p>
                </div>
                <div className="rounded-lg border border-border bg-muted/30 px-3 py-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Clock3 className="h-4 w-4 text-muted-foreground" /> Аптайм
                  </div>
                  <p className="text-2xl font-bold mt-2">{stats.uptimeHours} ч</p>
                  <p className="text-xs text-muted-foreground">С момента последнего сбоя</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Загрузка состояния...
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}




