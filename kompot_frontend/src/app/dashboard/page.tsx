"use client"

import { useEffect, useMemo, useState } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FolderKanban, CheckSquare, Users, TrendingUp, Loader2, Clock } from "lucide-react"
import { teamService, projectService, taskService } from "@/services"
import { TeamResponse, ProjectResponse, TaskResponse } from "@/types/api"
import { toast } from "sonner"
import { extractApiErrorMessage } from "@/lib/api-error"
import { useAppSelector } from "@/store/hooks"
import Link from "next/link"

const formatTimeAgo = (date: string) => {
  const now = new Date()
  const then = new Date(date)
  const diffMs = now.getTime() - then.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return "только что"
  if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? "минуту" : diffMins < 5 ? "минуты" : "минут"} назад`
  if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? "час" : diffHours < 5 ? "часа" : "часов"} назад`
  return `${diffDays} ${diffDays === 1 ? "день" : diffDays < 5 ? "дня" : "дней"} назад`
}

const calculateProgress = (tasks: TaskResponse[]) => {
  if (tasks.length === 0) return 0
  const done = tasks.filter((t) => t.status === "DONE").length
  return Math.round((done / tasks.length) * 100)
}

export default function DashboardPage() {
  const currentUser = useAppSelector((state) => state.auth.user)
  const [teams, setTeams] = useState<TeamResponse[]>([])
  const [projects, setProjects] = useState<ProjectResponse[]>([])
  const [allTasks, setAllTasks] = useState<TaskResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        const teamsData = await teamService.getUserTeams()
        setTeams(teamsData)

        const projectsPromises = teamsData.map((team) => projectService.getTeamProjects(team.id))
        const projectsArrays = await Promise.all(projectsPromises)
        const allProjects = projectsArrays.flat()
        setProjects(allProjects)

        const tasksPromises = allProjects.map((project) => taskService.getProjectTasks(project.id))
        const tasksArrays = await Promise.all(tasksPromises)
        const allTasksData = tasksArrays.flat()
        setAllTasks(allTasksData)
      } catch (err) {
        toast.error(extractApiErrorMessage(err))
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  const stats = useMemo(() => {
    const activeProjects = projects.filter((p) => p.status === "ACTIVE").length
    const tasksInProgress = allTasks.filter((t) => t.status === "IN_PROGRESS" || t.status === "IN_REVIEW").length
    const completedToday = allTasks.filter((t) => {
      if (t.status !== "DONE") return false
      const completedDate = new Date(t.updatedAt)
      const today = new Date()
      return completedDate.toDateString() === today.toDateString()
    }).length
    const totalTeamMembers = teams.length
    const progress = calculateProgress(allTasks)

    return [
      {
        title: "Активные проекты",
        value: activeProjects.toString(),
        description: `${projects.length} всего`,
        icon: FolderKanban,
      },
      {
        title: "Задачи в работе",
        value: tasksInProgress.toString(),
        description: completedToday > 0 ? `${completedToday} завершено сегодня` : "Всего задач",
        icon: CheckSquare,
      },
      {
        title: "Команд",
        value: totalTeamMembers.toString(),
        description: `${allTasks.length} задач во всех проектах`,
        icon: Users,
      },
      {
        title: "Прогресс",
        value: `${progress}%`,
        description: `${allTasks.filter((t) => t.status === "DONE").length} из ${allTasks.length} завершено`,
        icon: TrendingUp,
      },
    ]
  }, [projects, allTasks, teams])

  const recentProjects = useMemo(() => {
    return projects
      .filter((p) => p.status === "ACTIVE")
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5)
      .map((project) => {
        const projectTasks = allTasks.filter((t) => t.projectId === project.id)
        const progress = calculateProgress(projectTasks)
        return { ...project, progress }
      })
  }, [projects, allTasks])

  const recentActivity = useMemo(() => {
    const activities: Array<{ type: string; message: string; time: string; projectName?: string }> = []

    allTasks
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5)
      .forEach((task) => {
        const project = projects.find((p) => p.id === task.projectId)
        const projectName = project?.name || "Неизвестный проект"
        activities.push({
          type: "task",
          message: `Задача "${task.title}" обновлена`,
          time: task.updatedAt,
          projectName,
        })
      })

    projects
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3)
      .forEach((project) => {
        activities.push({
          type: "project",
          message: `Проект "${project.name}" создан`,
          time: project.createdAt,
          projectName: project.name,
        })
      })

    return activities
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 6)
  }, [allTasks, projects])

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Загрузка данных...
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Дашборд</h1>
          <p className="text-muted-foreground">
            Обзор вашей активности и проектов
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Недавние проекты</CardTitle>
              <CardDescription>
                Проекты, над которыми вы работаете
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentProjects.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FolderKanban className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Нет активных проектов</p>
                  <Link href="/projects" className="text-xs text-primary hover:underline mt-2 inline-block">
                    Создать проект
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentProjects.map((project) => (
                    <Link
                      key={project.id}
                      href={`/projects`}
                      className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-sm">{project.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {project.description || "Без описания"}
                        </p>
                      </div>
                      <div className="ml-4 text-right">
                        <span className="text-sm font-semibold text-foreground">{project.progress}%</span>
                        <div className="w-16 h-2 bg-muted rounded-full mt-1 overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all"
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Активность</CardTitle>
              <CardDescription>Последние обновления</CardDescription>
            </CardHeader>
            <CardContent>
              {recentActivity.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Нет активности</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentActivity.map((activity, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground">{activity.message}</p>
                        {activity.projectName && (
                          <p className="text-xs text-muted-foreground mt-0.5">в проекте {activity.projectName}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">{formatTimeAgo(activity.time)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  )
}




