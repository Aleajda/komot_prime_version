"use client"

import { useEffect, useState } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog } from "@/components/ui/dialog"
import { AlertDialog } from "@/components/ui/alert-dialog"
import { teamService, userService } from "@/services"
import { TeamResponse, UserResponse } from "@/types/api"
import { Plus, Loader2, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { extractApiErrorMessage } from "@/lib/api-error"
import { useAppSelector } from "@/store/hooks"

export default function TeamsPage() {
  const [teams, setTeams] = useState<TeamResponse[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [form, setForm] = useState({ name: "", description: "" })
  const [ownerNames, setOwnerNames] = useState<Record<string, string>>({})
  const [users, setUsers] = useState<UserResponse[]>([])
  const [editingTeam, setEditingTeam] = useState<TeamResponse | null>(null)
  const [deletingTeam, setDeletingTeam] = useState<TeamResponse | null>(null)
  const [editingForm, setEditingForm] = useState({ name: "", description: "", editorIds: [] as string[] })
  const { user: currentUser } = useAppSelector((state) => state.auth)

  useEffect(() => {
    const loadTeams = async () => {
      setIsLoading(true)
      try {
        const data = await teamService.getUserTeams()
        setUsers(await userService.getAllUsers())
        setTeams(data)
        const uniqueOwners = Array.from(new Set(data.map((t) => t.ownerId)))
        const fetched = await Promise.all(
          uniqueOwners.map(async (id) => {
            try {
              const user = await userService.getUserById(id)
              return [id, user.username || user.email] as const
            } catch {
              return [id, id] as const
            }
          })
        )
        setOwnerNames(Object.fromEntries(fetched))
      } catch (err) {
        toast.error(extractApiErrorMessage(err))
      } finally {
        setIsLoading(false)
      }
    }

    loadTeams()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
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
      setForm({ name: "", description: "" })
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
    })
  }

  const handleSaveEdit = async () => {
    if (!editingTeam) return
    try {
      const updated = await teamService.updateTeam(editingTeam.id, {
        name: editingForm.name.trim(),
        description: editingForm.description.trim() || undefined,
        editorIds: editingForm.editorIds,
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

  const canEdit = (team: TeamResponse) => {
    if (!currentUser) return false
    if (currentUser.role === "ADMIN") return true
    return (team.editorIds || []).includes(currentUser.id)
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Команды</h1>
            <p className="text-muted-foreground">Управление командами и участниками</p>
          </div>
          <form onSubmit={handleCreate} className="flex w-full flex-col gap-2 md:w-auto md:flex-row">
            <Input
              name="name"
              placeholder="Название команды"
              value={form.name}
              onChange={handleChange}
              required
              className="h-11 md:w-60"
            />
            <Input
              name="description"
              placeholder="Описание (опционально)"
              value={form.description}
              onChange={handleChange}
              className="h-11 md:w-72"
            />
            <Button type="submit" disabled={isCreating} className="h-11">
              {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Plus className="mr-2 h-4 w-4" />
              Создать команду
            </Button>
          </form>
        </div>

        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Загрузка команд...
          </div>
        ) : teams.length === 0 ? (
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle>Пока нет команд</CardTitle>
              <CardDescription>Создайте первую команду, чтобы начать</CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {teams.map((team) => (
              <Card key={team.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle>{team.name}</CardTitle>
                  <CardDescription>{team.description || "Без описания"}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm text-muted-foreground">
                    <div className="flex items-center justify-between">
                      <span>Владелец</span>
                        <span className="font-medium text-foreground">
                          {ownerNames[team.ownerId] || team.ownerId}
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
        open={Boolean(editingTeam)}
        onOpenChange={(open) => (open ? null : setEditingTeam(null))}
        title="Редактирование команды"
        description={editingTeam ? `Команда: ${editingTeam.name}` : undefined}
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
            <div className="text-sm font-medium text-foreground">Название</div>
            <Input
              value={editingForm.name}
              onChange={(e) => setEditingForm((prev) => ({ ...prev, name: e.target.value }))}
              className="h-11"
              aria-label="Название команды"
            />
          </div>
          <div className="grid gap-2">
            <div className="text-sm font-medium text-foreground">Описание</div>
            <Textarea
              value={editingForm.description}
              onChange={(e) => setEditingForm((prev) => ({ ...prev, description: e.target.value }))}
              aria-label="Описание команды"
            />
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
                Владелец останется редактором автоматически.
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