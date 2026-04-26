"use client"

import { useEffect, useMemo, useState } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog } from "@/components/ui/dialog"
import { AlertDialog } from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { projectService, taskService, teamService } from "@/services"
import { ProjectResponse, TaskResponse, TeamResponse, UserResponse } from "@/types/api"
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react"
import { userService } from "@/services"
import { toast } from "sonner"
import { extractApiErrorMessage } from "@/lib/api-error"
import { useAppSelector } from "@/store/hooks"

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
  const [users, setUsers] = useState<UserResponse[]>([])
  const [editingTask, setEditingTask] = useState<TaskResponse | null>(null)
  const [deletingTask, setDeletingTask] = useState<TaskResponse | null>(null)
  const { user: currentUser } = useAppSelector((state) => state.auth)
  const [editingForm, setEditingForm] = useState({
    title: "",
    description: "",
    status: "TODO" as TaskResponse["status"],
    priority: "MEDIUM" as TaskResponse["priority"],
    assigneeId: "__none__",
    editorIds: [] as string[],
  })

  useEffect(() => {
    const loadTeams = async () => {
      try {
        const data = await teamService.getUserTeams()
        setTeams(data)
        setUsers(await userService.getAllUsers())
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

  const canEdit = (task: TaskResponse) => {
    if (!currentUser) return false
    if (currentUser.role === "ADMIN") return true
    return (task.editorIds || []).includes(currentUser.id)
  }

  const handleStartEdit = (task: TaskResponse) => {
    setEditingTask(task)
    setEditingForm({
      title: task.title,
      description: task.description || "",
      status: task.status,
      priority: task.priority,
      assigneeId: task.assigneeId || "__none__",
      editorIds: task.editorIds || [],
    })
  }

  const handleSaveEdit = async () => {
    if (!editingTask) return
    try {
      const updated = await taskService.updateTask(editingTask.id, {
        title: editingForm.title.trim(),
        description: editingForm.description.trim() || undefined,
        status: editingForm.status,
        priority: editingForm.priority,
        assigneeId: editingForm.assigneeId === "__none__" ? undefined : editingForm.assigneeId,
        editorIds: editingForm.editorIds,
      })
      setTasks((prev) => prev.map((task) => (task.id === updated.id ? updated : task)))
      setEditingTask(null)
      toast.success("Задача обновлена")
    } catch (err) {
      toast.error(extractApiErrorMessage(err))
    }
  }

  const handleDelete = async () => {
    if (!deletingTask) return
    try {
      await taskService.deleteTask(deletingTask.id)
      setTasks((prev) => prev.filter((task) => task.id !== deletingTask.id))
      setDeletingTask(null)
      toast.success("Задача удалена")
    } catch (err) {
      toast.error(extractApiErrorMessage(err))
    }
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
              <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
                <SelectTrigger aria-label="Команда">
                  <SelectValue placeholder="Выберите команду" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                <SelectTrigger aria-label="Проект">
                  <SelectValue placeholder="Выберите проект" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                <Textarea
                  name="description"
                  placeholder="Описание (опционально)"
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  className="md:col-span-2"
                />
                <Select
                  value={form.status}
                  onValueChange={(value) => setForm((prev) => ({ ...prev, status: value as TaskResponse["status"] }))}
                >
                  <SelectTrigger aria-label="Статус задачи">
                    <SelectValue placeholder="Статус" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODO">Новая</SelectItem>
                    <SelectItem value="IN_PROGRESS">В работе</SelectItem>
                    <SelectItem value="IN_REVIEW">На ревью</SelectItem>
                    <SelectItem value="DONE">Готово</SelectItem>
                    <SelectItem value="BLOCKED">Блок</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={form.priority}
                  onValueChange={(value) =>
                    setForm((prev) => ({ ...prev, priority: value as TaskResponse["priority"] }))
                  }
                >
                  <SelectTrigger aria-label="Приоритет">
                    <SelectValue placeholder="Приоритет" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Низкий</SelectItem>
                    <SelectItem value="MEDIUM">Средний</SelectItem>
                    <SelectItem value="HIGH">Высокий</SelectItem>
                    <SelectItem value="URGENT">Срочный</SelectItem>
                  </SelectContent>
                </Select>
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
                    {canEdit(task) && (
                      <div className="flex gap-2 pt-2">
                        <Button size="sm" variant="outline" onClick={() => handleStartEdit(task)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Редактировать
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => setDeletingTask(task)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Удалить
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog
        open={Boolean(editingTask)}
        onOpenChange={(open) => (open ? null : setEditingTask(null))}
        title="Редактирование задачи"
        description={editingTask ? `Задача: ${editingTask.title}` : undefined}
        footer={
          <>
            <Button variant="outline" onClick={() => setEditingTask(null)}>
              Отмена
            </Button>
            <Button onClick={handleSaveEdit}>Сохранить</Button>
          </>
        }
      >
        <div className="grid gap-4">
          <div className="grid gap-2">
            <div className="text-sm font-medium text-foreground">Заголовок</div>
            <Input
              value={editingForm.title}
              onChange={(e) => setEditingForm((prev) => ({ ...prev, title: e.target.value }))}
              className="h-11"
              aria-label="Заголовок задачи"
            />
          </div>
          <div className="grid gap-2">
            <div className="text-sm font-medium text-foreground">Описание</div>
            <Textarea
              value={editingForm.description}
              onChange={(e) => setEditingForm((prev) => ({ ...prev, description: e.target.value }))}
              aria-label="Описание задачи"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-2">
              <div className="text-sm font-medium text-foreground">Статус</div>
                <Select
                  value={editingForm.status}
                  onValueChange={(value) =>
                    setEditingForm((prev) => ({ ...prev, status: value as TaskResponse["status"] }))
                  }
                >
                  <SelectTrigger aria-label="Статус">
                    <SelectValue placeholder="Статус" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODO">Новая</SelectItem>
                    <SelectItem value="IN_PROGRESS">В работе</SelectItem>
                    <SelectItem value="IN_REVIEW">На ревью</SelectItem>
                    <SelectItem value="DONE">Готово</SelectItem>
                    <SelectItem value="BLOCKED">Блок</SelectItem>
                  </SelectContent>
                </Select>
            </div>
            <div className="grid gap-2">
              <div className="text-sm font-medium text-foreground">Приоритет</div>
                <Select
                  value={editingForm.priority}
                  onValueChange={(value) =>
                    setEditingForm((prev) => ({ ...prev, priority: value as TaskResponse["priority"] }))
                  }
                >
                  <SelectTrigger aria-label="Приоритет">
                    <SelectValue placeholder="Приоритет" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Низкий</SelectItem>
                    <SelectItem value="MEDIUM">Средний</SelectItem>
                    <SelectItem value="HIGH">Высокий</SelectItem>
                    <SelectItem value="URGENT">Срочный</SelectItem>
                  </SelectContent>
                </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <div className="text-sm font-medium text-foreground">Исполнитель</div>
            <Select
              value={editingForm.assigneeId}
              onValueChange={(value) => setEditingForm((prev) => ({ ...prev, assigneeId: value }))}
            >
              <SelectTrigger aria-label="Исполнитель">
                <SelectValue placeholder="Не назначен" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Не назначен</SelectItem>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.username || u.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <div className="text-sm font-medium text-foreground">Кто может редактировать</div>
            <div className="rounded-xl border border-border bg-muted/20 p-3 dark:border-white/10 dark:bg-[#232730]/60">
              <div className="mt-1 max-h-72 overflow-auto rounded-lg border border-border bg-background p-2 dark:border-white/10 dark:bg-[#1a1e26]">
                <div className="grid gap-1">
                  {users.map((u) => {
                    const checked = editingForm.editorIds.includes(u.id)
                    return (
                      <label
                        key={u.id}
                        className="flex cursor-pointer items-center justify-between gap-3 rounded-lg px-2 py-2 text-sm hover:bg-muted/50 dark:hover:bg-[#232730]"
                      >
                        <div className="min-w-0">
                          <div className="truncate font-medium text-foreground">{u.username || u.email}</div>
                          <div className="truncate text-xs text-muted-foreground">{u.email}</div>
                        </div>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            const next = e.target.checked
                              ? Array.from(new Set([...editingForm.editorIds, u.id]))
                              : editingForm.editorIds.filter((id) => id !== u.id)
                            setEditingForm((prev) => ({ ...prev, editorIds: next }))
                          }}
                          className="h-4 w-4 accent-primary"
                          aria-label={`Редактор: ${u.username || u.email}`}
                        />
                      </label>
                    )
                  })}
                </div>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                Создатель останется редактором автоматически.
              </div>
            </div>
          </div>
        </div>
      </Dialog>

      <AlertDialog
        open={Boolean(deletingTask)}
        onOpenChange={(open) => (open ? null : setDeletingTask(null))}
        title="Удалить задачу?"
        description={deletingTask ? `Задача “${deletingTask.title}” будет удалена без возможности восстановления.` : undefined}
        confirmText="Удалить"
        cancelText="Отмена"
        onConfirm={handleDelete}
        isDanger
      />
    </MainLayout>
  )
}