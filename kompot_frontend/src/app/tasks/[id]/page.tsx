"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertDialog } from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { projectService, taskService, teamService, userService } from "@/services"
import { ProjectResponse, TaskResponse, TeamResponse, UserResponse } from "@/types/api"
import { Loader2, ArrowLeft, Pencil, Save, Trash2, X } from "lucide-react"
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

export default function TaskDetailsPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [task, setTask] = useState<TaskResponse | null>(null)
  const [project, setProject] = useState<ProjectResponse | null>(null)
  const [team, setTeam] = useState<TeamResponse | null>(null)
  const [assignee, setAssignee] = useState<UserResponse | null>(null)
  const [creator, setCreator] = useState<UserResponse | null>(null)
  const [users, setUsers] = useState<UserResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    status: "TODO" as TaskResponse["status"],
    priority: "MEDIUM" as TaskResponse["priority"],
    assigneeId: "__none__",
  })

  useEffect(() => {
    const taskId = params?.id
    if (!taskId) return
    const load = async () => {
      setIsLoading(true)
      try {
        const t = await taskService.getTaskById(taskId)
        setTask(t)
        setEditForm({
          title: t.title,
          description: t.description || "",
          status: t.status,
          priority: t.priority,
          assigneeId: t.assigneeId || "__none__",
        })
        const p = await projectService.getProjectById(t.projectId)
        setProject(p)
        const teamData = await teamService.getTeamById(p.teamId)
        setTeam(teamData)
        const [creatorData, assigneeData] = await Promise.all([
          userService.getUserById(t.creatorId),
          t.assigneeId ? userService.getUserById(t.assigneeId) : Promise.resolve(null),
        ])
        setCreator(creatorData)
        setAssignee(assigneeData)
        setUsers(await userService.getAllUsers())
      } catch (err) {
        toast.error(extractApiErrorMessage(err))
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [params?.id])

  const handleDelete = async () => {
    if (!task) return
    try {
      await taskService.deleteTask(task.id)
      toast.success("Задача удалена")
      if (team && project) {
        router.push(`/tasks?teamId=${team.id}&projectId=${project.id}`)
        return
      }
      router.push("/tasks")
    } catch (err) {
      toast.error(extractApiErrorMessage(err))
    }
  }

  const handleStartEdit = () => {
    if (!task) return
    setEditForm({
      title: task.title,
      description: task.description || "",
      status: task.status,
      priority: task.priority,
      assigneeId: task.assigneeId || "__none__",
    })
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    if (!task) return
    setEditForm({
      title: task.title,
      description: task.description || "",
      status: task.status,
      priority: task.priority,
      assigneeId: task.assigneeId || "__none__",
    })
    setIsEditing(false)
  }

  const handleSave = async () => {
    if (!task || !editForm.title.trim()) return
    setIsSaving(true)
    try {
      const updated = await taskService.updateTask(task.id, {
        title: editForm.title.trim(),
        description: editForm.description.trim() || undefined,
        status: editForm.status,
        priority: editForm.priority,
        assigneeId: editForm.assigneeId === "__none__" ? undefined : editForm.assigneeId,
      })
      setTask(updated)
      const nextAssignee = updated.assigneeId ? await userService.getUserById(updated.assigneeId) : null
      setAssignee(nextAssignee)
      setIsEditing(false)
      toast.success("Задача обновлена")
    } catch (err) {
      toast.error(extractApiErrorMessage(err))
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Загрузка задачи...
        </div>
      </MainLayout>
    )
  }

  if (!task) {
    return (
      <MainLayout>
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>Задача не найдена</CardTitle>
            <CardDescription>Возможно, она была удалена или у вас нет доступа.</CardDescription>
          </CardHeader>
        </Card>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <Button
            variant="outline"
            onClick={() =>
              router.push(project && team ? `/tasks?teamId=${team.id}&projectId=${project.id}` : "/tasks")
            }
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            К списку задач
          </Button>
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <Button variant="outline" onClick={handleStartEdit}>
                <Pencil className="mr-2 h-4 w-4" />
                Редактировать
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={handleCancelEdit} disabled={isSaving}>
                  <X className="mr-2 h-4 w-4" />
                  Отмена
                </Button>
                <Button onClick={handleSave} disabled={isSaving || !editForm.title.trim()}>
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Сохранить
                </Button>
              </>
            )}
            <Button variant="destructive" onClick={() => setIsDeleteOpen(true)} disabled={isSaving}>
              <Trash2 className="mr-2 h-4 w-4" />
              Удалить задачу
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                {isEditing ? (
                  <div className="grid gap-3">
                    <Input
                      value={editForm.title}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, title: e.target.value }))}
                      className="h-11"
                      aria-label="Заголовок задачи"
                    />
                    <Textarea
                      value={editForm.description}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
                      aria-label="Описание задачи"
                    />
                  </div>
                ) : (
                  <>
                    <CardTitle className="text-2xl">{task.title}</CardTitle>
                    <CardDescription className="mt-2">{task.description || "Без описания"}</CardDescription>
                  </>
                )}
              </div>
              {isEditing ? (
                <div className="grid w-48 gap-2">
                  <Select
                    value={editForm.status}
                    onValueChange={(value) =>
                      setEditForm((prev) => ({ ...prev, status: value as TaskResponse["status"] }))
                    }
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
                    value={editForm.priority}
                    onValueChange={(value) =>
                      setEditForm((prev) => ({ ...prev, priority: value as TaskResponse["priority"] }))
                    }
                  >
                    <SelectTrigger aria-label="Приоритет задачи">
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
              ) : (
                <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">
                  {STATUS_LABELS[task.status]}
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 text-sm text-muted-foreground md:grid-cols-2">
              <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                <span>Приоритет</span>
                <span className="font-medium text-foreground">
                  {isEditing ? (
                    <Select
                      value={editForm.priority}
                      onValueChange={(value) =>
                        setEditForm((prev) => ({ ...prev, priority: value as TaskResponse["priority"] }))
                      }
                    >
                      <SelectTrigger className="h-8 w-36" aria-label="Изменить приоритет">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LOW">Низкий</SelectItem>
                        <SelectItem value="MEDIUM">Средний</SelectItem>
                        <SelectItem value="HIGH">Высокий</SelectItem>
                        <SelectItem value="URGENT">Срочный</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    PRIORITY_LABELS[task.priority]
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                <span>Команда</span>
                <span className="font-medium text-foreground">{team?.name || "—"}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                <span>Проект</span>
                <span className="font-medium text-foreground">{project?.name || "—"}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                <span>Исполнитель</span>
                <span className="font-medium text-foreground">
                  {isEditing ? (
                    <Select
                      value={editForm.assigneeId}
                      onValueChange={(value) => setEditForm((prev) => ({ ...prev, assigneeId: value }))}
                    >
                      <SelectTrigger className="h-8 w-44" aria-label="Изменить исполнителя">
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
                  ) : (
                    assignee?.username || assignee?.email || "Не назначен"
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                <span>Создал</span>
                <span className="font-medium text-foreground">{creator?.username || creator?.email || task.creatorId}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                <span>Создана</span>
                <span className="font-medium text-foreground">{new Date(task.createdAt).toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <AlertDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Удалить задачу?"
        description={`Задача “${task.title}” будет удалена без возможности восстановления.`}
        confirmText="Удалить"
        cancelText="Отмена"
        onConfirm={handleDelete}
        isDanger
      />
    </MainLayout>
  )
}

