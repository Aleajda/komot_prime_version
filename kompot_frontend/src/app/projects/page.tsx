"use client"

import { useEffect, useMemo, useState } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RoleTag } from "@/components/ui/role-tag"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { EmptyState } from "@/components/ui/empty-state"
import { Dialog } from "@/components/ui/dialog"
import { AlertDialog } from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { projectService, teamService } from "@/services"
import { ProjectResponse, TeamResponse, UserResponse } from "@/types/api"
import Link from "next/link"
import { FolderKanban, Loader2, Pencil, Plus, Trash2, Users } from "lucide-react"
import { toast } from "sonner"
import { extractApiErrorMessage } from "@/lib/api-error"
import { isUserInTeamRoster } from "@/lib/team-roster"
import { PROJECT_DESCRIPTION_MAX_LENGTH, PROJECT_NAME_MAX_LENGTH } from "@/lib/form-limits"
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
  const [createProjectOpen, setCreateProjectOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<ProjectResponse | null>(null)
  const [deletingProject, setDeletingProject] = useState<ProjectResponse | null>(null)
  const [form, setForm] = useState({
    name: "",
    description: "",
    status: "ACTIVE" as ProjectResponse["status"],
    memberIds: [] as string[],
  })
  const [editingForm, setEditingForm] = useState({
    name: "",
    description: "",
    status: "ACTIVE" as ProjectResponse["status"],
    editorIds: [] as string[],
    memberIds: [] as string[],
  })

  useEffect(() => {
    const loadTeams = async () => {
      try {
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

  const resetCreateProjectForm = () =>
    setForm({ name: "", description: "", status: "ACTIVE", memberIds: [] })

  const handleConfirmCreateProject = async () => {
    if (!selectedTeamId || !form.name.trim()) {
      return
    }
    const team = teams.find((t) => t.id === selectedTeamId)
    if (!team) {
      toast.error("Команда не найдена")
      return
    }
    const memberIdsPayload = form.memberIds.filter((id) => isUserInTeamRoster(team, id))
    if (memberIdsPayload.length < form.memberIds.length) {
      toast.warning("В проект попадут только пользователи из состава команды")
    }
    setIsCreating(true)
    try {
      const created = await projectService.createProject(selectedTeamId, {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        status: form.status,
        memberIds: memberIdsPayload,
      })
      setProjects((prev) => [created, ...prev])
      resetCreateProjectForm()
      setCreateProjectOpen(false)
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
      memberIds: project.memberIds || [],
    })
  }

  const handleSaveEdit = async () => {
    if (!editingProject) return
    const team = teams.find((t) => t.id === editingProject.teamId)
    if (!team) {
      toast.error("Команда не найдена")
      return
    }
    try {
      const editorIdsClean = editingForm.editorIds.filter((id) => isUserInTeamRoster(team, id))
      const editorSet = new Set(editorIdsClean)
      const memberIdsClean = editingForm.memberIds.filter(
        (id) =>
          isUserInTeamRoster(team, id) &&
          !editorSet.has(id) &&
          String(id) !== String(team.ownerId)
      )
      const hadOffTeam =
        editingForm.editorIds.some((id) => !isUserInTeamRoster(team, id)) ||
        editingForm.memberIds.some((id) => !isUserInTeamRoster(team, id))
      if (hadOffTeam) {
        toast.warning("В проекте остались только пользователи из состава команды")
      }
      const updated = await projectService.updateProject(editingProject.id, {
        name: editingForm.name.trim(),
        description: editingForm.description.trim() || undefined,
        status: editingForm.status,
        editorIds: editorIdsClean,
        memberIds: memberIdsClean,
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

  const canEditProject = (project: ProjectResponse) => {
    if (!currentUser) return false
    if (currentUser.role === "ADMIN") return true
    if ((project.editorIds || []).includes(currentUser.id)) return true
    const team = teams.find((t) => t.id === project.teamId)
    if (!team) return false
    if (team.ownerId === currentUser.id) return true
    return (team.editorIds || []).includes(currentUser.id)
  }

  const editingTeamForProject = useMemo(() => {
    if (!editingProject) return null
    return teams.find((t) => t.id === editingProject.teamId) ?? null
  }, [editingProject, teams])

  const isProjectTeamOwner = (userId: string) =>
    Boolean(editingTeamForProject && String(editingTeamForProject.ownerId) === String(userId))

  const handleToggleProjectAdmin = (userId: string, checked: boolean) => {
    if (!editingProject || isProjectTeamOwner(userId)) return
    const team = teams.find((t) => t.id === editingProject.teamId)
    if (!team) return
    if (checked && !isUserInTeamRoster(team, userId)) return
    setEditingForm((prev) => {
      const nextEditors = checked
        ? Array.from(new Set([...prev.editorIds, userId]))
        : prev.editorIds.filter((id) => id !== userId)
      return { ...prev, editorIds: nextEditors }
    })
  }

  const handleToggleProjectMember = (userId: string, checked: boolean) => {
    setEditingForm((prev) => {
      const team = editingProject ? (teams.find((t) => t.id === editingProject.teamId) ?? null) : null
      if (!team) return prev
      if (checked && !isUserInTeamRoster(team, userId)) return prev
      if (String(team.ownerId) === String(userId) || prev.editorIds.includes(userId)) {
        return prev
      }
      return {
        ...prev,
        memberIds: checked
          ? Array.from(new Set([...prev.memberIds, userId]))
          : prev.memberIds.filter((id) => id !== userId),
      }
    })
  }

  const currentTeamName = useMemo(
    () => teams.find((t) => t.id === selectedTeamId)?.name || "",
    [teams, selectedTeamId]
  )
  const selectedTeam = useMemo(
    () => teams.find((team) => team.id === selectedTeamId),
    [teams, selectedTeamId]
  )
  const canManageSelectedTeam = useMemo(() => {
    if (!currentUser || !selectedTeam) {
      return false
    }
    if (currentUser.role === "ADMIN") {
      return true
    }
    return selectedTeam.ownerId === currentUser.id || (selectedTeam.editorIds || []).includes(currentUser.id)
  }, [currentUser, selectedTeam])

  const sortedPlatformUsers = useMemo(
    () =>
      [...users].sort((a, b) =>
        (a.username || a.email).localeCompare(b.username || b.email, "ru", { sensitivity: "base" })
      ),
    [users]
  )

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Проекты</h1>
          <p className="text-muted-foreground">Управление проектами выбранной команды</p>
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
              <div className="flex min-h-11 min-w-0 items-center rounded-xl border border-dashed border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                <span className="line-clamp-3 break-words">
                  {teams.length === 0
                    ? "Создайте команду, чтобы выбрать её здесь"
                    : currentTeamName
                      ? `Выбрана: ${currentTeamName}`
                      : "Команда не выбрана"}
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <Button
                type="button"
                className="h-11 w-full rounded-xl sm:w-auto"
                disabled={!selectedTeamId || !canManageSelectedTeam || teams.length === 0}
                onClick={() => {
                  resetCreateProjectForm()
                  setCreateProjectOpen(true)
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Новый проект
              </Button>
              {selectedTeamId && !canManageSelectedTeam && teams.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Создавать проекты могут только владелец и администраторы команды.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Загрузка проектов...
          </div>
        ) : projects.length === 0 ? (
          <Card className="border-dashed">
            <CardContent>
              <EmptyState
                icon={FolderKanban}
                title="Проектов пока нет"
                description={selectedTeamId ? "Создайте первый проект для команды" : "Выберите команду, чтобы увидеть проекты"}
                actionLabel={
                  selectedTeamId && canManageSelectedTeam ? "Создать проект" : undefined
                }
                onAction={
                  selectedTeamId && canManageSelectedTeam
                    ? () => {
                        resetCreateProjectForm()
                        setCreateProjectOpen(true)
                      }
                    : undefined
                }
              />
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Card key={project.id} className="min-w-0 max-w-full overflow-hidden hover:shadow-lg transition-shadow">
                <CardHeader className="min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <CardTitle className="break-words text-balance">{project.name}</CardTitle>
                      <CardDescription className="mt-1 break-words whitespace-pre-wrap leading-relaxed">
                        {project.description?.trim() ? project.description : "Без описания"}
                      </CardDescription>
                      <p className="mt-2 break-words text-xs text-muted-foreground">
                        Команда: {currentTeamName || project.teamId}
                      </p>
                    </div>
                    <span className="flex-shrink-0 rounded-full bg-muted px-2 py-1 text-xs font-medium text-foreground">
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
                    {canEditProject(project) && (
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
        open={createProjectOpen}
        onOpenChange={(open) => {
          if (!open) {
            setCreateProjectOpen(false)
            resetCreateProjectForm()
          }
        }}
        title="Новый проект"
        description={
          currentTeamName
            ? `Команда: ${currentTeamName}. Заполните данные ниже.`
            : "Заполните данные проекта."
        }
        footer={
          <>
            <Button
              variant="outline"
              className="w-full rounded-xl sm:w-auto"
              onClick={() => {
                setCreateProjectOpen(false)
                resetCreateProjectForm()
              }}
            >
              Отмена
            </Button>
            <Button
              className="w-full rounded-xl sm:w-auto"
              disabled={isCreating || !selectedTeamId || !form.name.trim() || !canManageSelectedTeam}
              onClick={() => void handleConfirmCreateProject()}
            >
              {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Создать
            </Button>
          </>
        }
      >
        <div className="grid gap-5">
          <div className="grid gap-2">
            <label htmlFor="project-create-name" className="text-sm font-medium text-foreground">
              Название
            </label>
            <Input
              id="project-create-name"
              placeholder="Название проекта"
              value={form.name}
              onChange={(e) => {
                const next = e.target.value
                if (next.length > PROJECT_NAME_MAX_LENGTH) return
                setForm((prev) => ({ ...prev, name: next }))
              }}
              maxLength={PROJECT_NAME_MAX_LENGTH}
              className="h-11 rounded-xl"
              autoFocus
            />
            <p className="text-right text-xs text-muted-foreground">
              {form.name.length}/{PROJECT_NAME_MAX_LENGTH}
            </p>
          </div>
          <div className="grid gap-2">
            <label htmlFor="project-create-description" className="text-sm font-medium text-foreground">
              Описание <span className="font-normal text-muted-foreground">(необязательно)</span>
            </label>
            <Textarea
              id="project-create-description"
              placeholder="Цели, сроки, заметки для команды…"
              value={form.description}
              onChange={(e) => {
                const next = e.target.value
                if (next.length > PROJECT_DESCRIPTION_MAX_LENGTH) return
                setForm((prev) => ({ ...prev, description: next }))
              }}
              maxLength={PROJECT_DESCRIPTION_MAX_LENGTH}
              rows={6}
              className="min-h-[160px] rounded-xl"
            />
            <p className="text-right text-xs text-muted-foreground">
              {form.description.length}/{PROJECT_DESCRIPTION_MAX_LENGTH}
            </p>
          </div>
          <div className="grid gap-2">
            <span className="text-sm font-medium text-foreground">Статус</span>
            <Select
              value={form.status}
              onValueChange={(value) =>
                setForm((prev) => ({ ...prev, status: value as ProjectResponse["status"] }))
              }
            >
              <SelectTrigger aria-label="Статус проекта" className="rounded-xl">
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
            <span className="text-sm font-medium text-foreground">Участники проекта</span>
            <p className="text-xs text-muted-foreground">
              Вы — администратор проекта. В списке все пользователи; отметить участника можно только из состава команды.
            </p>
            <div className="max-h-48 overflow-auto rounded-xl border border-border bg-muted/20 p-2 dark:border-white/10">
              {!selectedTeam || sortedPlatformUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 px-2 py-8 text-center">
                  <Users className="h-10 w-10 shrink-0 text-muted-foreground/60" aria-hidden />
                  <p className="text-sm font-medium text-foreground">Нет пользователей для выбора</p>
                  <p className="max-w-xs text-xs text-muted-foreground">
                    {sortedPlatformUsers.length === 0
                      ? "Список пользователей не загрузился."
                      : "Выберите команду."}
                  </p>
                  <Link
                    href="/teams"
                    className="text-xs font-medium text-primary underline-offset-4 hover:underline"
                    onClick={() => setCreateProjectOpen(false)}
                  >
                    Перейти к командам
                  </Link>
                </div>
              ) : (
                <div className="grid gap-1">
                  {sortedPlatformUsers.map((u) => {
                    const inTeam = isUserInTeamRoster(selectedTeam, u.id)
                    const isTeamOwner = String(selectedTeam.ownerId) === String(u.id)
                    const isSelf = currentUser && String(currentUser.id) === String(u.id)
                    const checked = form.memberIds.includes(u.id)
                    const rowDisabled = Boolean(isSelf) || !inTeam
                    return (
                      <label
                        key={`create-member-${u.id}`}
                        title={!inTeam ? "Сначала добавьте пользователя в команду" : undefined}
                        className={`flex items-center justify-between gap-3 rounded-lg px-2 py-2 text-sm ${
                          rowDisabled ? "cursor-default opacity-70" : "cursor-pointer hover:bg-muted/50"
                        }`}
                      >
                        <span className="flex min-w-0 flex-wrap items-center gap-1.5 break-words font-medium">
                          <span>{u.username || u.email}</span>
                          {isTeamOwner ? <RoleTag kind="owner" /> : null}
                          {isSelf ? <RoleTag kind="admin" /> : null}
                          {!inTeam && !isSelf ? (
                            <span className="text-[10px] text-muted-foreground/70">не в команде</span>
                          ) : null}
                        </span>
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={rowDisabled}
                          onChange={(e) => {
                            const on = e.target.checked
                            if (!selectedTeam || (on && !isUserInTeamRoster(selectedTeam, u.id))) return
                            setForm((prev) => ({
                              ...prev,
                              memberIds: on
                                ? Array.from(new Set([...prev.memberIds, u.id]))
                                : prev.memberIds.filter((id) => id !== u.id),
                            }))
                          }}
                          className="h-4 w-4 accent-primary"
                          aria-label={`Участник: ${u.username || u.email}`}
                        />
                      </label>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </Dialog>

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
            <div className="flex items-center justify-between gap-2 text-sm font-medium text-foreground">
              <span>Название</span>
              <span className="text-xs font-normal text-muted-foreground">
                {editingForm.name.length}/{PROJECT_NAME_MAX_LENGTH}
              </span>
            </div>
            <Input
              value={editingForm.name}
              onChange={(e) => {
                const next = e.target.value
                if (next.length > PROJECT_NAME_MAX_LENGTH) return
                setEditingForm((prev) => ({ ...prev, name: next }))
              }}
              maxLength={PROJECT_NAME_MAX_LENGTH}
              className="h-11"
              aria-label="Название проекта"
            />
          </div>
          <div className="grid gap-2">
            <div className="flex items-center justify-between gap-2 text-sm font-medium text-foreground">
              <span>Описание</span>
              <span className="text-xs font-normal text-muted-foreground">
                {editingForm.description.length}/{PROJECT_DESCRIPTION_MAX_LENGTH}
              </span>
            </div>
            <Textarea
              value={editingForm.description}
              onChange={(e) => {
                const next = e.target.value
                if (next.length > PROJECT_DESCRIPTION_MAX_LENGTH) return
                setEditingForm((prev) => ({ ...prev, description: next }))
              }}
              maxLength={PROJECT_DESCRIPTION_MAX_LENGTH}
              aria-label="Описание проекта"
              rows={4}
              className="min-h-[120px]"
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
            <div className="text-sm font-medium text-foreground">Администраторы проекта</div>
            <p className="text-xs text-muted-foreground">
              Все пользователи; админом проекта может быть только участник команды. Владелец команды всегда админ.
            </p>
            <div className="rounded-xl border border-border bg-muted/20 p-3 dark:border-white/10 dark:bg-[#232730]/60">
              <div className="max-h-56 overflow-auto rounded-lg border border-border bg-background p-2 dark:border-white/10 dark:bg-[#1a1e26]">
                <div className="grid gap-1">
                  {sortedPlatformUsers.map((u) => {
                    const team = editingTeamForProject
                    const inTeam = team ? isUserInTeamRoster(team, u.id) : false
                    const isOwner = isProjectTeamOwner(u.id)
                    const isAd = isOwner || editingForm.editorIds.includes(u.id)
                    const isMem = editingForm.memberIds.includes(u.id)
                    const checked = isAd
                    const roleTag: "owner" | "admin" | "member" | null = isOwner
                      ? "owner"
                      : isAd
                        ? "admin"
                        : isMem
                          ? "member"
                          : null
                    const adminDisabled = isOwner || (!inTeam && !checked)
                    return (
                      <label
                        key={`pa-${u.id}`}
                        title={!inTeam && !checked ? "Сначала добавьте в команду" : undefined}
                        className={`flex items-center justify-between gap-3 rounded-lg px-2 py-2 text-sm ${
                          adminDisabled && !isOwner
                            ? "cursor-default opacity-70"
                            : isOwner
                              ? "cursor-default opacity-80"
                              : "cursor-pointer hover:bg-muted/50 dark:hover:bg-[#232730]"
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5 break-words font-medium text-foreground">
                            <span>{u.username || u.email}</span>
                            {roleTag ? <RoleTag kind={roleTag} /> : null}
                            {!inTeam && !isOwner ? (
                              <span className="text-[10px] text-muted-foreground/70">не в команде</span>
                            ) : null}
                          </div>
                          <div className="break-all text-xs text-muted-foreground">{u.email}</div>
                        </div>
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={adminDisabled}
                          onChange={(e) => handleToggleProjectAdmin(u.id, e.target.checked)}
                          className="h-4 w-4 accent-primary"
                          aria-label={`Администратор проекта: ${u.username || u.email}`}
                        />
                      </label>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-2">
            <div className="text-sm font-medium text-foreground">Участники проекта</div>
            <p className="text-xs text-muted-foreground">
              Участником проекта может быть только пользователь из команды. Список — все пользователи для удобства.
            </p>
            <div className="rounded-xl border border-border bg-muted/20 p-3 dark:border-white/10 dark:bg-[#232730]/60">
              <div className="max-h-56 overflow-auto rounded-lg border border-border bg-background p-2 dark:border-white/10 dark:bg-[#1a1e26]">
                <div className="grid gap-1">
                  {sortedPlatformUsers.map((u) => {
                    const team = editingTeamForProject
                    const inTeam = team ? isUserInTeamRoster(team, u.id) : false
                    const isOwner = isProjectTeamOwner(u.id)
                    const isAlsoAdmin = editingForm.editorIds.includes(u.id)
                    const checked = editingForm.memberIds.includes(u.id)
                    const memberDisabled =
                      isOwner || isAlsoAdmin || (!inTeam && !checked)
                    const roleTag: "owner" | "admin" | "member" | null = isOwner
                      ? "owner"
                      : isAlsoAdmin
                        ? "admin"
                        : checked
                          ? "member"
                          : null
                    return (
                      <label
                        key={`pm-${u.id}`}
                        title={!inTeam && !checked ? "Сначала добавьте в команду" : undefined}
                        className={`flex items-center justify-between gap-3 rounded-lg px-2 py-2 text-sm ${
                          memberDisabled ? "cursor-default opacity-70" : "cursor-pointer hover:bg-muted/50 dark:hover:bg-[#232730]"
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5 break-words font-medium text-foreground">
                            <span>{u.username || u.email}</span>
                            {roleTag ? <RoleTag kind={roleTag} /> : null}
                            {!inTeam && !isOwner ? (
                              <span className="text-[10px] text-muted-foreground/70">не в команде</span>
                            ) : null}
                          </div>
                          <div className="break-all text-xs text-muted-foreground">{u.email}</div>
                        </div>
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={memberDisabled}
                          onChange={(e) => handleToggleProjectMember(u.id, e.target.checked)}
                          className="h-4 w-4 accent-primary"
                          aria-label={`Участник проекта: ${u.username || u.email}`}
                        />
                      </label>
                    )
                  })}
                </div>
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