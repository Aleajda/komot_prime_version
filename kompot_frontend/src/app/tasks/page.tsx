"use client"

import { useEffect, useMemo, useState } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { projectService, taskService, teamService } from "@/services"
import { ProjectResponse, TaskResponse, TeamResponse, UserResponse } from "@/types/api"
import { Loader2, Plus } from "lucide-react"
import { userService } from "@/services"
import { toast } from "sonner"
import { extractApiErrorMessage } from "@/lib/api-error"

const STATUS_LABELS: Record<TaskResponse["status"], string> = {
  TODO: "Новая",
  IN_PROGRESS: "В работе",
  IN_REVIEW: "На ревью",
  DONE: "Готово",
  BLOCKED: "Блок",
}

const PRIORITY_LABELS: Record<TaskResponse["priority"], string> = {
  LOW: "Низкий",
  MEDIUM: "Средний",
  HIGH: "Высокий",
  URGENT: "Срочный",
}

export default function TasksPage() {
  const [teams, setTeams] = useState<TeamResponse[]>([])
  const [projects, setProjects] = useState<ProjectResponse[]>([])
  const [selectedTeamId, setSelectedTeamId] = useState<string>("")
  const [selectedProjectId, setSelectedProjectId] = useState<string>("")
  const [tasks, setTasks] = useState<TaskResponse[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [form, setForm] = useState({
    title: "",
    description: "",
    status: "TODO" as TaskResponse["status"],
    priority: "MEDIUM" as TaskResponse["priority"],
  })
  const [userCache, setUserCache] = useState<Record<string, UserResponse>>({})

  useEffect(() => {
    const loadTeams = async () => {
      try {
        const data = await teamService.getUserTeams()
        setTeams(data)
        if (data.length > 0) {
          setSelectedTeamId(data[0].id)
        }
      } catch (err) {
        toast.error(extractApiErrorMessage(err))
      }
    }
    loadTeams()
  }, [])

  useEffect(() => {
    if (!selectedTeamId) {
      setProjects([])
      setSelectedProjectId("")
      return
    }
    const loadProjects = async () => {
      try {
        const data = await projectService.getTeamProjects(selectedTeamId)
        setProjects(data)
        setSelectedProjectId(data[0]?.id || "")
      } catch (err) {
        toast.error(extractApiErrorMessage(err))
      }
    }
    loadProjects()
  }, [selectedTeamId])

  useEffect(() => {
    if (!selectedProjectId) {
      setTasks([])
      return
    }
    const loadTasks = async () => {
      setIsLoading(true)
      try {
        const data = await taskService.getProjectTasks(selectedProjectId)
        setTasks(data)
      } catch (err) {
        toast.error(extractApiErrorMessage(err))
      } finally {
        setIsLoading(false)
      }
    }
    loadTasks()
  }, [selectedProjectId])

  useEffect(() => {
    const fetchUsers = async () => {
      const ids = tasks
        .flatMap((t) => [t.assigneeId, t.creatorId])
        .filter((id): id is string => Boolean(id))
        .filter((id) => !userCache[id])

      if (ids.length === 0) return

      const unique = Array.from(new Set(ids))
      const results = await Promise.all(
        unique.map(async (id) => {
          try {
            const user = await userService.getUserById(id)
            return [id, user] as const
          } catch {
            return null
          }
        })
      )

      const entries = results.filter((r): r is [string, UserResponse] => Boolean(r))
      if (entries.length) {
        setUserCache((prev) => ({ ...prev, ...Object.fromEntries(entries) }))
      }
    }

    fetchUsers()
  }, [tasks, userCache])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProjectId || !form.title.trim()) {
      return
    }
    setIsCreating(true)
    try {
      const created = await taskService.createTask(selectedProjectId, {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        status: form.status,
        priority: form.priority,
      })
      setTasks((prev) => [created, ...prev])
      setForm({ title: "", description: "", status: "TODO", priority: "MEDIUM" })
      toast.success("Задача создана")
    } catch (err) {
      toast.error(extractApiErrorMessage(err))
    } finally {
      setIsCreating(false)
    }
  }

  const currentTeamName = useMemo(
    () => teams.find((t) => t.id === selectedTeamId)?.name || "",
    [teams, selectedTeamId]
  )
  const currentProjectName = useMemo(
    () => projects.find((p) => p.id === selectedProjectId)?.name || "",
    [projects, selectedProjectId]
  )

  const formatUser = (id?: string) => {
    if (!id) return "Не назначен"
    const user = userCache[id]
    if (!user) return id
    return user.username || user.email
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Задачи</h1>
          <p className="text-muted-foreground">Управление задачами выбранного проекта</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
          <Card className="bg-card/60 backdrop-blur">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Контекст</CardTitle>
              <CardDescription>Выберите команду и проект</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              <select
                name="team"
                value={selectedTeamId}
                onChange={(e) => setSelectedTeamId(e.target.value)}
                className="h-11 rounded-md border border-border bg-background px-3 text-sm text-foreground"
                required
              >
                <option value="" disabled>
                  Выберите команду
                </option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
              <select
                name="project"
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="h-11 rounded-md border border-border bg-background px-3 text-sm text-foreground"
                required
              >
                <option value="" disabled>
                  Выберите проект
                </option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </CardContent>
          </Card>

          <Card className="bg-card/60 backdrop-blur">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Новая задача</CardTitle>
              <CardDescription>Заполните данные и создайте карточку</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="grid gap-3 md:grid-cols-2">
                <Input
                  name="title"
                  placeholder="Заголовок задачи"
                  value={form.title}
                  onChange={handleChange}
                  required
                  className="h-11 md:col-span-2"
                />
                <Input
                  name="description"
                  placeholder="Описание (опционально)"
                  value={form.description}
                  onChange={handleChange}
                  className="h-11 md:col-span-2"
                />
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className="h-11 rounded-md border border-border bg-background px-3 text-sm text-foreground"
                >
                  <option value="TODO">Новая</option>
                  <option value="IN_PROGRESS">В работе</option>
                  <option value="IN_REVIEW">На ревью</option>
                  <option value="DONE">Готово</option>
                  <option value="BLOCKED">Блок</option>
                </select>
                <select
                  name="priority"
                  value={form.priority}
                  onChange={handleChange}
                  className="h-11 rounded-md border border-border bg-background px-3 text-sm text-foreground"
                >
                  <option value="LOW">Низкий</option>
                  <option value="MEDIUM">Средний</option>
                  <option value="HIGH">Высокий</option>
                  <option value="URGENT">Срочный</option>
                </select>
                <Button
                  type="submit"
                  disabled={isCreating || !selectedProjectId}
                  className="h-11 md:col-span-2"
                >
                  {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Plus className="mr-2 h-4 w-4" />
                  Создать задачу
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Загрузка задач...
          </div>
        ) : tasks.length === 0 ? (
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle>Задач нет</CardTitle>
              <CardDescription>
                {selectedProjectId ? "Создайте первую задачу" : "Выберите проект, чтобы увидеть задачи"}
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tasks.map((task) => (
              <Card key={task.id} className="hover:shadow-lg transition-shadow bg-card/80">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{task.title}</CardTitle>
                    <span className="rounded-full bg-primary/15 px-2 py-1 text-xs font-semibold text-primary">
                      {STATUS_LABELS[task.status]}
                    </span>
                  </div>
                  <CardDescription>{task.description || "Без описания"}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm text-muted-foreground">
                    <div className="flex items-center justify-between">
                      <span>Проект</span>
                      <span className="font-medium text-foreground">{currentProjectName || task.projectId}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Исполнитель</span>
                      <span className="font-medium text-foreground">{formatUser(task.assigneeId)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Создал</span>
                      <span className="font-medium text-foreground">{formatUser(task.creatorId)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Приоритет</span>
                      <span className="rounded-full bg-muted px-2 py-1 text-xs font-semibold text-foreground">
                        {PRIORITY_LABELS[task.priority]}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Создана</span>
                      <span className="font-medium text-foreground">
                        {new Date(task.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  )
}