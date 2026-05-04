"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RoleTag } from "@/components/ui/role-tag"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { EmptyState } from "@/components/ui/empty-state"
import { Dialog } from "@/components/ui/dialog"
import { AlertDialog } from "@/components/ui/alert-dialog"
import { teamService, userService } from "@/services"
import { TeamResponse, UserResponse } from "@/types/api"
import { Plus, Loader2, Pencil, Trash2, Users } from "lucide-react"
import { toast } from "sonner"
import { extractApiErrorMessage } from "@/lib/api-error"
import { TEAM_DESCRIPTION_MAX_LENGTH, TEAM_NAME_MAX_LENGTH } from "@/lib/form-limits"
import { formatUserIdSnippet, normalizeUserId } from "@/lib/user-id"
import { useAppSelector } from "@/store/hooks"

export default function TeamsPage() {
  const [teams, setTeams] = useState<TeamResponse[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [form, setForm] = useState({ name: "", description: "" })
  const [ownerLabelsByNormId, setOwnerLabelsByNormId] = useState<Record<string, string>>({})
  const [users, setUsers] = useState<UserResponse[]>([])
  const [editingTeam, setEditingTeam] = useState<TeamResponse | null>(null)
  const [deletingTeam, setDeletingTeam] = useState<TeamResponse | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingForm, setEditingForm] = useState({
    name: "",
    description: "",
    editorIds: [] as string[],
    memberIds: [] as string[],
  })
  const { user: currentUser } = useAppSelector((state) => state.auth)

  useEffect(() => {
    const loadTeams = async () => {
      setIsLoading(true)
      try {
        const usersList = await userService.getAllUsers()
        setUsers(usersList)
        const data = await teamService.getUserTeams()
        setTeams(data)

        const uniqueOwnerRawIds = Array.from(new Set(data.map((team) => team.ownerId)))
        const labelMap: Record<string, string> = {}
        const needFetchRawIds: string[] = []

        for (const ownerId of uniqueOwnerRawIds) {
          const normalized = normalizeUserId(ownerId)
          const matched = usersList.find((candidate) => normalizeUserId(candidate.id) === normalized)
          if (matched) {
            labelMap[normalized] = matched.username || matched.email
          } else {
            needFetchRawIds.push(ownerId)
          }
        }

        await Promise.all(
          needFetchRawIds.map(async (ownerId) => {
            const normalized = normalizeUserId(ownerId)
            if (labelMap[normalized]) {
              return
            }
            try {
              const user = await userService.getUserById(ownerId)
              labelMap[normalized] = user.username || user.email
            } catch {
              labelMap[normalized] = ""
            }
          })
        )

        setOwnerLabelsByNormId(labelMap)
      } catch (err) {
        toast.error(extractApiErrorMessage(err))
      } finally {
        setIsLoading(false)
      }
    }

    loadTeams()
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    if (e.target.name === "name" && raw.length > TEAM_NAME_MAX_LENGTH) {
      return
    }
    setForm((prev) => ({ ...prev, [e.target.name]: raw }))
  }

  const handleCreateDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const raw = e.target.value
    if (raw.length > TEAM_DESCRIPTION_MAX_LENGTH) {
      return
    }
    setForm((prev) => ({ ...prev, description: raw }))
  }

  const resetCreateForm = () => setForm({ name: "", description: "" })

  const handleConfirmCreate = async () => {
    if (!form.name.trim()) {
      return
    }

    setIsCreating(true)
    try {
      const created = await teamService.createTeam({
        name: form.name.trim(),
        description: form.description.trim() || undefined,
      })
      setTeams((prev) => [created, ...prev])
      setOwnerLabelsByNormId((prev) => {
        const normalizedOwner = normalizeUserId(created.ownerId)
        if (prev[normalizedOwner]) {
          return prev
        }
        if (currentUser && normalizeUserId(currentUser.id) === normalizedOwner) {
          return {
            ...prev,
            [normalizedOwner]: currentUser.username || currentUser.email,
          }
        }
        const fromUsers = users.find((candidate) => normalizeUserId(candidate.id) === normalizedOwner)
        if (fromUsers) {
          return { ...prev, [normalizedOwner]: fromUsers.username || fromUsers.email }
        }
        return prev
      })
      resetCreateForm()
      setShowCreateModal(false)
      toast.success("Команда создана")
    } catch (err) {
      toast.error(extractApiErrorMessage(err))
    } finally {
      setIsCreating(false)
    }
  }

  const handleStartEdit = (team: TeamResponse) => {
    setEditingTeam(team)
    setEditingForm({
      name: team.name,
      description: team.description || "",
      editorIds: team.editorIds || [],
      memberIds: team.memberIds || [],
    })
  }

  const handleSaveEdit = async () => {
    if (!editingTeam) return
    try {
      const editorSet = new Set(editingForm.editorIds)
      const memberIdsClean = editingForm.memberIds.filter(
        (id) => !editorSet.has(id) && String(id) !== String(editingTeam.ownerId)
      )
      const updated = await teamService.updateTeam(editingTeam.id, {
        name: editingForm.name.trim(),
        description: editingForm.description.trim() || undefined,
        editorIds: editingForm.editorIds,
        memberIds: memberIdsClean,
      })
      setTeams((prev) => prev.map((team) => (team.id === updated.id ? updated : team)))
      setEditingTeam(null)
      toast.success("Команда обновлена")
    } catch (err) {
      toast.error(extractApiErrorMessage(err))
    }
  }

  const handleDelete = async () => {
    if (!deletingTeam) return
    try {
      await teamService.deleteTeam(deletingTeam.id)
      setTeams((prev) => prev.filter((team) => team.id !== deletingTeam.id))
      setDeletingTeam(null)
      toast.success("Команда удалена")
    } catch (err) {
      toast.error(extractApiErrorMessage(err))
    }
  }

  const resolveOwnerDisplayName = useCallback(
    (ownerId: string): string => {
      const normalized = normalizeUserId(ownerId)
      const loaded = ownerLabelsByNormId[normalized]?.trim()
      if (loaded) {
        return loaded
      }
      if (currentUser && normalizeUserId(currentUser.id) === normalized) {
        return currentUser.username || currentUser.email
      }
      const fallbackUser = users.find((candidate) => normalizeUserId(candidate.id) === normalized)
      if (fallbackUser) {
        return fallbackUser.username || fallbackUser.email
      }
      return `Пользователь ${formatUserIdSnippet(ownerId)}…`
    },
    [ownerLabelsByNormId, users, currentUser]
  )

  const canEdit = (team: TeamResponse) => {
    if (!currentUser) return false
    if (currentUser.role === "ADMIN") return true
    return (team.editorIds || []).includes(currentUser.id)
  }

  const sortedPlatformUsers = useMemo(
    () =>
      [...users].sort((a, b) =>
        (a.username || a.email).localeCompare(b.username || b.email, "ru", { sensitivity: "base" })
      ),
    [users]
  )

  const isEditingTeamOwner = (userId: string) =>
    Boolean(editingTeam && String(editingTeam.ownerId) === String(userId))

  const handleToggleTeamAdmin = (userId: string, checked: boolean) => {
    if (isEditingTeamOwner(userId)) return
    setEditingForm((prev) => {
      const nextEditors = checked
        ? Array.from(new Set([...prev.editorIds, userId]))
        : prev.editorIds.filter((id) => id !== userId)
      return { ...prev, editorIds: nextEditors }
    })
  }

  const handleToggleTeamMember = (userId: string, checked: boolean) => {
    setEditingForm((prev) => {
      if (String(editingTeam?.ownerId) === String(userId) || prev.editorIds.includes(userId)) {
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

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Команды</h1>
            <p className="text-muted-foreground">Управление командами и участниками</p>
          </div>
          <Button
            type="button"
            className="h-11 w-full shrink-0 rounded-xl sm:w-auto"
            onClick={() => {
              resetCreateForm()
              setShowCreateModal(true)
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Новая команда
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Загрузка команд...
          </div>
        ) : teams.length === 0 ? (
          <Card className="border-dashed">
            <CardContent>
              <EmptyState
                icon={Users}
                title="Пока нет команд"
                description="Создайте первую команду и назначьте администраторов"
                actionLabel="Создать команду"
                onAction={() => {
                  resetCreateForm()
                  setShowCreateModal(true)
                }}
              />
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {teams.map((team) => (
              <Card key={team.id} className="min-w-0 max-w-full overflow-hidden hover:shadow-lg transition-shadow">
                <CardHeader className="min-w-0 space-y-2">
                  <CardTitle className="break-words text-balance">{team.name}</CardTitle>
                  <CardDescription className="break-words whitespace-pre-wrap leading-relaxed">
                    {team.description?.trim() ? team.description : "Без описания"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm text-muted-foreground">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                      <span className="flex-shrink-0">Владелец</span>
                      <span
                        className="max-w-full break-words text-right font-medium text-foreground sm:max-w-[min(100%,280px)]"
                        title={resolveOwnerDisplayName(team.ownerId)}
                      >
                        {resolveOwnerDisplayName(team.ownerId)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Создана</span>
                      <span className="font-medium text-foreground">
                        {new Date(team.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {canEdit(team) && (
                      <div className="flex gap-2 pt-2">
                        <Button size="sm" variant="outline" onClick={() => handleStartEdit(team)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Редактировать
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => setDeletingTeam(team)}>
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
        open={showCreateModal}
        onOpenChange={(open) => {
          if (!open) {
            setShowCreateModal(false)
            resetCreateForm()
          }
        }}
        title="Новая команда"
        description="Название и описание — в одном окне. Описание можно оставить пустым."
        footer={
          <>
            <Button
              variant="outline"
              className="w-full rounded-xl sm:w-auto"
              onClick={() => {
                setShowCreateModal(false)
                resetCreateForm()
              }}
            >
              Отмена
            </Button>
            <Button
              className="w-full rounded-xl sm:w-auto"
              disabled={isCreating || !form.name.trim()}
              onClick={() => void handleConfirmCreate()}
            >
              {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Создать
            </Button>
          </>
        }
      >
        <div className="grid gap-5">
          <div className="grid gap-2">
            <label htmlFor="team-create-name" className="text-sm font-medium text-foreground">
              Название
            </label>
            <Input
              id="team-create-name"
              name="name"
              placeholder="Например, «Продукт» или «Лаборатория»"
              value={form.name}
              onChange={handleInputChange}
              maxLength={TEAM_NAME_MAX_LENGTH}
              className="h-11 rounded-xl"
              autoFocus
            />
            <p className="text-right text-xs text-muted-foreground">
              {form.name.length}/{TEAM_NAME_MAX_LENGTH}
            </p>
          </div>
          <div className="grid gap-2">
            <label htmlFor="team-create-description" className="text-sm font-medium text-foreground">
              Описание <span className="font-normal text-muted-foreground">(необязательно)</span>
            </label>
            <Textarea
              id="team-create-description"
              name="description"
              placeholder="Кратко опишите цель команды…"
              value={form.description}
              onChange={handleCreateDescriptionChange}
              maxLength={TEAM_DESCRIPTION_MAX_LENGTH}
              rows={6}
              className="min-h-[160px] rounded-xl"
            />
            <p className="text-right text-xs text-muted-foreground">
              {form.description.length}/{TEAM_DESCRIPTION_MAX_LENGTH}
            </p>
          </div>
        </div>
      </Dialog>

      <Dialog
        open={Boolean(editingTeam)}
        onOpenChange={(open) => (open ? null : setEditingTeam(null))}
        title="Редактирование команды"
        description={editingTeam ? editingTeam.name : undefined}
        footer={
          <>
            <Button variant="outline" onClick={() => setEditingTeam(null)}>
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
                {editingForm.name.length}/{TEAM_NAME_MAX_LENGTH}
              </span>
            </div>
            <Input
              value={editingForm.name}
              onChange={(e) => {
                const next = e.target.value
                if (next.length > TEAM_NAME_MAX_LENGTH) return
                setEditingForm((prev) => ({ ...prev, name: next }))
              }}
              maxLength={TEAM_NAME_MAX_LENGTH}
              className="h-11"
              aria-label="Название команды"
            />
          </div>
          <div className="grid gap-2">
            <div className="flex items-center justify-between gap-2 text-sm font-medium text-foreground">
              <span>Описание</span>
              <span className="text-xs font-normal text-muted-foreground">
                {editingForm.description.length}/{TEAM_DESCRIPTION_MAX_LENGTH}
              </span>
            </div>
            <Textarea
              value={editingForm.description}
              onChange={(e) => {
                const next = e.target.value
                if (next.length > TEAM_DESCRIPTION_MAX_LENGTH) return
                setEditingForm((prev) => ({ ...prev, description: next }))
              }}
              maxLength={TEAM_DESCRIPTION_MAX_LENGTH}
              aria-label="Описание команды"
              rows={4}
              className="min-h-[120px]"
            />
          </div>
          <div className="grid gap-2">
            <div className="text-sm font-medium text-foreground">Администраторы команды</div>
            <p className="text-xs text-muted-foreground">
              Настройки команды, участники, создание проектов. Владелец всегда администратор.
            </p>
            <div className="rounded-xl border border-border bg-muted/20 p-3 dark:border-white/10 dark:bg-[#232730]/60">
              <div className="max-h-56 overflow-auto rounded-lg border border-border bg-background p-2 dark:border-white/10 dark:bg-[#1a1e26]">
                <div className="grid gap-1">
                  {sortedPlatformUsers.map((u) => {
                    const isOwner = isEditingTeamOwner(u.id)
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
                    return (
                      <label
                        key={`admin-${u.id}`}
                        className={`flex items-center justify-between gap-3 rounded-lg px-2 py-2 text-sm ${
                          isOwner ? "cursor-default opacity-80" : "cursor-pointer hover:bg-muted/50 dark:hover:bg-[#232730]"
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5 break-words font-medium text-foreground">
                            <span>{u.username || u.email}</span>
                            {roleTag ? <RoleTag kind={roleTag} /> : null}
                          </div>
                          <div className="break-all text-xs text-muted-foreground">{u.email}</div>
                        </div>
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={isOwner}
                          onChange={(e) => handleToggleTeamAdmin(u.id, e.target.checked)}
                          className="h-4 w-4 accent-primary"
                          aria-label={`Администратор команды: ${u.username || u.email}`}
                        />
                      </label>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-2">
            <div className="text-sm font-medium text-foreground">Участники команды</div>
            <p className="text-xs text-muted-foreground">
              Доступ к команде и проектам команды без прав администратора (как в YouTrack: Developer).
            </p>
            <div className="rounded-xl border border-border bg-muted/20 p-3 dark:border-white/10 dark:bg-[#232730]/60">
              <div className="max-h-56 overflow-auto rounded-lg border border-border bg-background p-2 dark:border-white/10 dark:bg-[#1a1e26]">
                <div className="grid gap-1">
                  {sortedPlatformUsers.map((u) => {
                      const isOwner = isEditingTeamOwner(u.id)
                      const isAlsoAdmin = editingForm.editorIds.includes(u.id)
                      const isMem = editingForm.memberIds.includes(u.id)
                      const checked = isMem
                      const rowDisabled = isOwner || isAlsoAdmin
                      const roleTag: "owner" | "admin" | "member" | null = isOwner
                        ? "owner"
                        : isAlsoAdmin
                          ? "admin"
                          : isMem
                            ? "member"
                            : null
                      return (
                        <label
                          key={`member-${u.id}`}
                          className={`flex items-center justify-between gap-3 rounded-lg px-2 py-2 text-sm ${
                            rowDisabled ? "cursor-default opacity-80" : "cursor-pointer hover:bg-muted/50 dark:hover:bg-[#232730]"
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5 break-words font-medium text-foreground">
                              <span>{u.username || u.email}</span>
                              {roleTag ? <RoleTag kind={roleTag} /> : null}
                            </div>
                            <div className="break-all text-xs text-muted-foreground">{u.email}</div>
                          </div>
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={rowDisabled}
                            onChange={(e) => handleToggleTeamMember(u.id, e.target.checked)}
                            className="h-4 w-4 accent-primary"
                            aria-label={`Участник команды: ${u.username || u.email}`}
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
        open={Boolean(deletingTeam)}
        onOpenChange={(open) => (open ? null : setDeletingTeam(null))}
        title="Удалить команду?"
        description={deletingTeam ? `Команда “${deletingTeam.name}” будет удалена без возможности восстановления.` : undefined}
        confirmText="Удалить"
        cancelText="Отмена"
        onConfirm={handleDelete}
        isDanger
      />
    </MainLayout>
  )
}