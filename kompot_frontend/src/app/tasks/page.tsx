"use client"

import { useEffect, useMemo, useState } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { EmptyState } from "@/components/ui/empty-state"
import { Dialog } from "@/components/ui/dialog"
import { AlertDialog } from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { projectService, taskService, teamService } from "@/services"
import { ProjectResponse, TaskResponse, TeamResponse, UserResponse } from "@/types/api"
import { CheckSquare, Loader2, Pencil, Plus, Trash2 } from "lucide-react"
import { userService } from "@/services"
import { toast } from "sonner"
import { extractApiErrorMessage } from "@/lib/api-error"
import { TASK_DESCRIPTION_MAX_LENGTH, TASK_TITLE_MAX_LENGTH } from "@/lib/form-limits"
import { formatUserIdSnippet, normalizeUserId } from "@/lib/user-id"
import { canParticipateInProject, isUserOnProjectRoster } from "@/lib/project-roster"
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
  const [createTaskOpen, setCreateTaskOpen] = useState(false)
  const [form, setForm] = useState({
    title: "",
    description: "",
    status: "TODO" as TaskResponse["status"],
    priority: "MEDIUM" as TaskResponse["priority"],
    assigneeId: "__none__" as string,
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
  })

  useEffect(() => {
    const loadTeams = async () => {
      try {
        const usersList = await userService.getAllUsers()
        setUsers(usersList)
        const data = await teamService.getUserTeams()
        setTeams(data)
        setSelectedTeamId((previous) => {
          if (data.length === 0) {
            return ""
          }
          if (previous && data.some((team) => team.id === previous)) {
            return previous
          }
          return data[0].id
        })
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
        setSelectedProjectId((previous) => {
          if (data.length === 0) {
            return ""
          }
          if (previous && data.some((project) => project.id === previous)) {
            return previous
          }
          return data[0].id
        })
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
        .filter((id) => !Object.keys(userCache).some((key) => normalizeUserId(key) === normalizeUserId(id)))

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

  const resetCreateTaskForm = () =>
    setForm({ title: "", description: "", status: "TODO", priority: "MEDIUM", assigneeId: "__none__" })

  const handleConfirmCreateTask = async () => {
    if (!selectedProjectId || !form.title.trim()) {
      return
    }
    setIsCreating(true)
    try {
      const createPayload: Partial<TaskResponse> = {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        status: form.status,
        priority: form.priority,
      }
      if (form.assigneeId !== "__none__") {
        createPayload.assigneeId = form.assigneeId
      }
      const created = await taskService.createTask(selectedProjectId, createPayload)
      setTasks((prev) => [created, ...prev])
      resetCreateTaskForm()
      setCreateTaskOpen(false)
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
  const selectedProject = useMemo(
    () => projects.find((p) => p.id === selectedProjectId) ?? null,
    [projects, selectedProjectId]
  )
  const selectedTeam = useMemo(
    () => teams.find((team) => team.id === selectedTeamId),
    [teams, selectedTeamId]
  )

  const assignableUsersForSelectedProject = useMemo(
    () =>
      selectedProject
        ? [...users]
            .filter((u) => isUserOnProjectRoster(selectedProject, u.id))
            .sort((a, b) =>
              (a.username || a.email).localeCompare(b.username || b.email, "ru", { sensitivity: "base" })
            )
        : [],
    [users, selectedProject]
  )

  const editingProjectForModal = useMemo(
    () => (editingTask ? projects.find((p) => p.id === editingTask.projectId) ?? null : null),
    [editingTask, projects]
  )

  const assignableUsersForEditModal = useMemo(() => {
    if (!editingProjectForModal) return []
    const roster = users.filter((u) => isUserOnProjectRoster(editingProjectForModal, u.id))
    const base = [...roster]
    const aid = editingTask?.assigneeId
    if (aid) {
      const inRoster = base.some((u) => normalizeUserId(u.id) === normalizeUserId(aid))
      if (!inRoster) {
        const extra = users.find((u) => normalizeUserId(u.id) === normalizeUserId(aid))
        if (extra) base.push(extra)
      }
    }
    return base.sort((a, b) =>
      (a.username || a.email).localeCompare(b.username || b.email, "ru", { sensitivity: "base" })
    )
  }, [users, editingProjectForModal, editingTask?.assigneeId])

  const canCreateTaskInProject = useMemo(() => {
    if (!currentUser) return false
    if (currentUser.role === "ADMIN") return true
    if (!selectedProject || !selectedTeam) return false
    if ((selectedProject.editorIds || []).includes(currentUser.id)) return true
    if ((selectedProject.memberIds || []).includes(currentUser.id)) return true
    if (selectedTeam.ownerId === currentUser.id) return true
    if ((selectedTeam.editorIds || []).includes(currentUser.id)) return true
    return false
  }, [currentUser, selectedProject, selectedTeam])

  const formatUser = (id?: string) => {
    if (!id) return "Не назначен"
    const normalized = normalizeUserId(id)
    const cacheKey = Object.keys(userCache).find((key) => normalizeUserId(key) === normalized)
    const user = cacheKey ? userCache[cacheKey] : undefined
    if (!user) return `Пользователь ${formatUserIdSnippet(id)}…`
    return user.username || user.email
  }

  const canEditTask = (task: TaskResponse) => {
    if (!currentUser) return false
    if (currentUser.role === "ADMIN") return true
    const proj = projects.find((p) => p.id === task.projectId) ?? null
    const team = proj ? teams.find((t) => t.id === proj.teamId) ?? null : null
    return canParticipateInProject(proj, team, currentUser.id)
  }

  const handleStartEdit = (task: TaskResponse) => {
    setEditingTask(task)
    setEditingForm({
      title: task.title,
      description: task.description || "",
      status: task.status,
      priority: task.priority,
      assigneeId: task.assigneeId || "__none__",
    })
  }

  const handleSaveEdit = async () => {
    if (!editingTask) return
    try {
      const payload: Partial<TaskResponse> = {
        title: editingForm.title.trim(),
        description: editingForm.description.trim() || undefined,
        status: editingForm.status,
        priority: editingForm.priority,
        editorIds: editingTask.editorIds,
      }
      if (editingForm.assigneeId === "__none__") {
        payload.assigneeCleared = true
      } else {
        payload.assigneeId = editingForm.assigneeId
      }
      const updated = await taskService.updateTask(editingTask.id, payload)
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

        <Card className="bg-card/60 backdrop-blur">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Команда и проект</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid gap-3 md:grid-cols-2">
              <Select disabled={teams.length === 0} value={selectedTeamId} onValueChange={setSelectedTeamId}>
                <SelectTrigger aria-label="Команда" className="rounded-xl">
                  <SelectValue placeholder={teams.length === 0 ? "Нет команд" : "Выберите команду"} />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                disabled={teams.length === 0 || projects.length === 0}
                value={selectedProjectId}
                onValueChange={setSelectedProjectId}
              >
                <SelectTrigger aria-label="Проект" className="rounded-xl">
                  <SelectValue
                    placeholder={
                      teams.length === 0
                        ? "Нет команд"
                        : projects.length === 0
                          ? "Нет проектов"
                          : "Выберите проект"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <Button
                type="button"
                className="h-11 w-full rounded-xl sm:w-auto"
                disabled={!selectedProjectId || !canCreateTaskInProject || teams.length === 0 || projects.length === 0}
                onClick={() => {
                  resetCreateTaskForm()
                  setCreateTaskOpen(true)
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Новая задача
              </Button>
              {selectedProjectId && !canCreateTaskInProject && teams.length > 0 && projects.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Нужна роль участника или администратора проекта, либо администратор команды.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Загрузка задач...
          </div>
        ) : tasks.length === 0 ? (
          <Card className="border-dashed">
            <CardContent>
              <EmptyState
                icon={CheckSquare}
                title="Задач пока нет"
                description={selectedProjectId ? "Создайте первую задачу в проекте" : "Выберите проект, чтобы увидеть задачи"}
                actionLabel={
                  selectedProjectId && canCreateTaskInProject ? "Создать задачу" : undefined
                }
                onAction={
                  selectedProjectId && canCreateTaskInProject
                    ? () => {
                        resetCreateTaskForm()
                        setCreateTaskOpen(true)
                      }
                    : undefined
                }
              />
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tasks.map((task) => (
              <Card key={task.id} className="min-w-0 max-w-full overflow-hidden hover:shadow-lg transition-shadow bg-card/80">
                <CardHeader className="min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle className="min-w-0 flex-1 break-words text-balance text-lg">{task.title}</CardTitle>
                    <span className="flex-shrink-0 rounded-full bg-primary/15 px-2 py-1 text-xs font-semibold text-primary">
                      {STATUS_LABELS[task.status]}
                    </span>
                  </div>
                  <CardDescription className="break-words whitespace-pre-wrap leading-relaxed">
                    {task.description?.trim() ? task.description : "Без описания"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm text-muted-foreground">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                      <span className="flex-shrink-0">Проект</span>
                      <span className="max-w-full break-words text-left font-medium text-foreground sm:max-w-[min(100%,280px)] sm:text-right">
                        {currentProjectName || task.projectId}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                      <span className="flex-shrink-0">Исполнитель</span>
                      <span className="max-w-full break-words text-left font-medium text-foreground sm:max-w-[min(100%,280px)] sm:text-right">
                        {formatUser(task.assigneeId)}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                      <span className="flex-shrink-0">Создал</span>
                      <span className="max-w-full break-words text-left font-medium text-foreground sm:max-w-[min(100%,280px)] sm:text-right">
                        {formatUser(task.creatorId)}
                      </span>
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
                    {canEditTask(task) && (
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
        open={createTaskOpen}
        onOpenChange={(open) => {
          if (!open) {
            setCreateTaskOpen(false)
            resetCreateTaskForm()
          }
        }}
        title="Новая задача"
        description={
          currentProjectName
            ? `Проект: ${currentProjectName}. Заполните карточку задачи.`
            : "Заполните данные задачи."
        }
        footer={
          <>
            <Button
              variant="outline"
              className="w-full rounded-xl sm:w-auto"
              onClick={() => {
                setCreateTaskOpen(false)
                resetCreateTaskForm()
              }}
            >
              Отмена
            </Button>
            <Button
              className="w-full rounded-xl sm:w-auto"
              disabled={isCreating || !selectedProjectId || !form.title.trim() || !canCreateTaskInProject}
              onClick={() => void handleConfirmCreateTask()}
            >
              {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Создать
            </Button>
          </>
        }
      >
        <div className="grid gap-5">
          <div className="grid gap-2">
            <label htmlFor="task-create-title" className="text-sm font-medium text-foreground">
              Заголовок
            </label>
            <Input
              id="task-create-title"
              placeholder="Кратко, что нужно сделать"
              value={form.title}
              onChange={(e) => {
                const next = e.target.value
                if (next.length > TASK_TITLE_MAX_LENGTH) return
                setForm((prev) => ({ ...prev, title: next }))
              }}
              maxLength={TASK_TITLE_MAX_LENGTH}
              className="h-11 rounded-xl"
              autoFocus
            />
            <p className="text-right text-xs text-muted-foreground">
              {form.title.length}/{TASK_TITLE_MAX_LENGTH}
            </p>
          </div>
          <div className="grid gap-2">
            <label htmlFor="task-create-description" className="text-sm font-medium text-foreground">
              Описание <span className="font-normal text-muted-foreground">(необязательно)</span>
            </label>
            <Textarea
              id="task-create-description"
              placeholder="Детали, критерии приёмки, ссылки…"
              value={form.description}
              onChange={(e) => {
                const next = e.target.value
                if (next.length > TASK_DESCRIPTION_MAX_LENGTH) return
                setForm((prev) => ({ ...prev, description: next }))
              }}
              maxLength={TASK_DESCRIPTION_MAX_LENGTH}
              rows={6}
              className="min-h-[160px] rounded-xl"
            />
            <p className="text-right text-xs text-muted-foreground">
              {form.description.length}/{TASK_DESCRIPTION_MAX_LENGTH}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-2">
              <span className="text-sm font-medium text-foreground">Статус</span>
              <Select
                value={form.status}
                onValueChange={(value) =>
                  setForm((prev) => ({ ...prev, status: value as TaskResponse["status"] }))
                }
              >
                <SelectTrigger aria-label="Статус задачи" className="rounded-xl">
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
              <span className="text-sm font-medium text-foreground">Приоритет</span>
              <Select
                value={form.priority}
                onValueChange={(value) =>
                  setForm((prev) => ({ ...prev, priority: value as TaskResponse["priority"] }))
                }
              >
                <SelectTrigger aria-label="Приоритет" className="rounded-xl">
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
            <span className="text-sm font-medium text-foreground">Исполнитель</span>
            <p className="text-xs text-muted-foreground">Только из состава проекта (админы и участники).</p>
            <Select
              disabled={!selectedProject || assignableUsersForSelectedProject.length === 0}
              value={form.assigneeId}
              onValueChange={(value) => setForm((prev) => ({ ...prev, assigneeId: value }))}
            >
              <SelectTrigger aria-label="Исполнитель" className="rounded-xl">
                <SelectValue placeholder="Не назначен" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Не назначен</SelectItem>
                {assignableUsersForSelectedProject.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.username || u.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Dialog>

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
            <div className="flex items-center justify-between gap-2 text-sm font-medium text-foreground">
              <span>Заголовок</span>
              <span className="text-xs font-normal text-muted-foreground">
                {editingForm.title.length}/{TASK_TITLE_MAX_LENGTH}
              </span>
            </div>
            <Input
              value={editingForm.title}
              onChange={(e) => {
                const next = e.target.value
                if (next.length > TASK_TITLE_MAX_LENGTH) return
                setEditingForm((prev) => ({ ...prev, title: next }))
              }}
              maxLength={TASK_TITLE_MAX_LENGTH}
              className="h-11"
              aria-label="Заголовок задачи"
            />
          </div>
          <div className="grid gap-2">
            <div className="flex items-center justify-between gap-2 text-sm font-medium text-foreground">
              <span>Описание</span>
              <span className="text-xs font-normal text-muted-foreground">
                {editingForm.description.length}/{TASK_DESCRIPTION_MAX_LENGTH}
              </span>
            </div>
            <Textarea
              value={editingForm.description}
              onChange={(e) => {
                const next = e.target.value
                if (next.length > TASK_DESCRIPTION_MAX_LENGTH) return
                setEditingForm((prev) => ({ ...prev, description: next }))
              }}
              maxLength={TASK_DESCRIPTION_MAX_LENGTH}
              aria-label="Описание задачи"
              rows={4}
              className="min-h-[120px]"
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
            <p className="text-xs text-muted-foreground">Только из состава проекта.</p>
            <Select
              disabled={assignableUsersForEditModal.length === 0}
              value={editingForm.assigneeId}
              onValueChange={(value) => setEditingForm((prev) => ({ ...prev, assigneeId: value }))}
            >
              <SelectTrigger aria-label="Исполнитель">
                <SelectValue
                  placeholder={assignableUsersForEditModal.length === 0 ? "Нет участников проекта" : "Не назначен"}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Не назначен</SelectItem>
                {assignableUsersForEditModal.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.username || u.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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