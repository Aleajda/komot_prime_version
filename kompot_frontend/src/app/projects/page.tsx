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
import { projectService, teamService } from "@/services"
import { ProjectResponse, TeamResponse, UserResponse } from "@/types/api"
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { extractApiErrorMessage } from "@/lib/api-error"
import { userService } from "@/services"
import { useAppSelector } from "@/store/hooks"

const STATUS_LABELS: Record<ProjectResponse["status"], string> = {
  ACTIVE: "Активен",
  ARCHIVED: "Архив",
  COMPLETED: "Завершен",
}

export default function ProjectsPage() {
  const [teams, setTeams] = useState<TeamResponse[]>([])
  const [selectedTeamId, setSelectedTeamId] = useState<string>("")
  const [projects, setProjects] = useState<ProjectResponse[]>([])
  const [users, setUsers] = useState<UserResponse[]>([])
  const { user: currentUser } = useAppSelector((state) => state.auth)
  const [isLoading, setIsLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [editingProject, setEditingProject] = useState<ProjectResponse | null>(null)
  const [deletingProject, setDeletingProject] = useState<ProjectResponse | null>(null)
  const [form, setForm] = useState({ name: "", description: "", status: "ACTIVE" as ProjectResponse["status"] })
  const [editingForm, setEditingForm] = useState({
    name: "",
    description: "",
    status: "ACTIVE" as ProjectResponse["status"],
    editorIds: [] as string[],
  })

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
    const loadUsers = async () => {
      try {
        setUsers(await userService.getAllUsers())
      } catch (err) {
        toast.error(extractApiErrorMessage(err))
      }
    }
    loadUsers()
  }, [])

  useEffect(() => {
    if (!selectedTeamId) {
      setProjects([])
      return
    }
    const loadProjects = async () => {
      setIsLoading(true)
      try {
        const data = await projectService.getTeamProjects(selectedTeamId)
        setProjects(data)
      } catch (err) {
        toast.error(extractApiErrorMessage(err))
      } finally {
        setIsLoading(false)
      }
    }
    loadProjects()
  }, [selectedTeamId])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTeamId || !form.name.trim()) {
      return
    }
    setIsCreating(true)
    try {
      const created = await projectService.createProject(selectedTeamId, {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        status: form.status,
      })
      setProjects((prev) => [created, ...prev])
      setForm({ name: "", description: "", status: "ACTIVE" })
      toast.success("Проект создан")
    } catch (err) {
      toast.error(extractApiErrorMessage(err))
    } finally {
      setIsCreating(false)
    }
  }

  const handleStartEdit = (project: ProjectResponse) => {
    setEditingProject(project)
    setEditingForm({
      name: project.name,
      description: project.description || "",
      status: project.status,
      editorIds: project.editorIds || [],
    })
  }

  const handleSaveEdit = async () => {
    if (!editingProject) return
    try {
      const updated = await projectService.updateProject(editingProject.id, {
        name: editingForm.name.trim(),
        description: editingForm.description.trim() || undefined,
        status: editingForm.status,
        editorIds: editingForm.editorIds,
      })
      setProjects((prev) => prev.map((project) => (project.id === updated.id ? updated : project)))
      setEditingProject(null)
      toast.success("Проект обновлен")
    } catch (err) {
      toast.error(extractApiErrorMessage(err))
    }
  }

  const handleDelete = async () => {
    if (!deletingProject) return
    try {
      await projectService.deleteProject(deletingProject.id)
      setProjects((prev) => prev.filter((project) => project.id !== deletingProject.id))
      setDeletingProject(null)
      toast.success("Проект удален")
    } catch (err) {
      toast.error(extractApiErrorMessage(err))
    }
  }

  const canEdit = (project: ProjectResponse) => {
    if (!currentUser) return false
    if (currentUser.role === "ADMIN") return true
    return (project.editorIds || []).includes(currentUser.id)
  }

  const currentTeamName = useMemo(
    () => teams.find((t) => t.id === selectedTeamId)?.name || "",
    [teams, selectedTeamId]
  )

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Проекты</h1>
          <p className="text-muted-foreground">Управление проектами выбранной команды</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
          <Card className="bg-card/60 backdrop-blur">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Контекст</CardTitle>
              <CardDescription>Выберите команду перед созданием проекта</CardDescription>
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
              <div className="h-11 rounded-md border border-dashed border-border bg-muted/30 px-3 text-sm text-muted-foreground flex items-center">
                {currentTeamName ? `Выбрана: ${currentTeamName}` : "Команда не выбрана"}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/60 backdrop-blur">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Новый проект</CardTitle>
              <CardDescription>Заполните поля и создайте проект</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="grid gap-3 md:grid-cols-2">
                <Input
                  name="name"
                  placeholder="Название проекта"
                  value={form.name}
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
                  onValueChange={(value) =>
                    setForm((prev) => ({ ...prev, status: value as ProjectResponse["status"] }))
                  }
                >
                  <SelectTrigger aria-label="Статус проекта">
                    <SelectValue placeholder="Статус" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Активен</SelectItem>
                    <SelectItem value="COMPLETED">Завершен</SelectItem>
                    <SelectItem value="ARCHIVED">Архив</SelectItem>
                  </SelectContent>
                </Select>
                <Button type="submit" disabled={isCreating || !selectedTeamId} className="h-11 md:col-span-2">
                  {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Plus className="mr-2 h-4 w-4" />
                  Создать проект
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Загрузка проектов...
          </div>
        ) : projects.length === 0 ? (
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle>Проектов нет</CardTitle>
              <CardDescription>
                {selectedTeamId ? "Создайте первый проект" : "Выберите команду, чтобы увидеть проекты"}
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Card key={project.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="w-full">
                      <CardTitle>{project.name}</CardTitle>
                      <CardDescription className="mt-1">{project.description || "Без описания"}</CardDescription>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Команда: {currentTeamName || project.teamId}
                      </p>
                    </div>
                    <span className="rounded-full bg-muted px-2 py-1 text-xs font-medium text-foreground">
                      {STATUS_LABELS[project.status]}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm text-muted-foreground">
                    <div className="flex items-center justify-between">
                      <span>Создан</span>
                      <span className="font-medium text-foreground">
                        {new Date(project.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Обновлен</span>
                      <span className="font-medium text-foreground">
                        {new Date(project.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                    {canEdit(project) && (
                      <div className="flex gap-2 pt-2">
                        <Button size="sm" variant="outline" onClick={() => handleStartEdit(project)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Редактировать
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => setDeletingProject(project)}>
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
        open={Boolean(editingProject)}
        onOpenChange={(open) => (open ? null : setEditingProject(null))}
        title="Редактирование проекта"
        description={editingProject ? `Проект: ${editingProject.name}` : undefined}
        footer={
          <>
            <Button variant="outline" onClick={() => setEditingProject(null)}>
              Отмена
            </Button>
            <Button onClick={handleSaveEdit}>Сохранить</Button>
          </>
        }
      >
        <div className="grid gap-4">
          <div className="grid gap-2">
            <div className="text-sm font-medium text-foreground">Название</div>
            <Input
              value={editingForm.name}
              onChange={(e) => setEditingForm((prev) => ({ ...prev, name: e.target.value }))}
              className="h-11"
              aria-label="Название проекта"
            />
          </div>
          <div className="grid gap-2">
            <div className="text-sm font-medium text-foreground">Описание</div>
            <Textarea
              value={editingForm.description}
              onChange={(e) => setEditingForm((prev) => ({ ...prev, description: e.target.value }))}
              aria-label="Описание проекта"
            />
          </div>
          <div className="grid gap-2">
            <div className="text-sm font-medium text-foreground">Статус</div>
            <Select
              value={editingForm.status}
              onValueChange={(value) =>
                setEditingForm((prev) => ({ ...prev, status: value as ProjectResponse["status"] }))
              }
            >
              <SelectTrigger aria-label="Статус проекта">
                <SelectValue placeholder="Статус" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Активен</SelectItem>
                <SelectItem value="COMPLETED">Завершен</SelectItem>
                <SelectItem value="ARCHIVED">Архив</SelectItem>
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
        open={Boolean(deletingProject)}
        onOpenChange={(open) => (open ? null : setDeletingProject(null))}
        title="Удалить проект?"
        description={deletingProject ? `Проект “${deletingProject.name}” будет удалён без возможности восстановления.` : undefined}
        confirmText="Удалить"
        cancelText="Отмена"
        onConfirm={handleDelete}
        isDanger
      />
    </MainLayout>
  )
}