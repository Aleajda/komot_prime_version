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
import { projectService, teamService } from "@/services"
import { ProjectResponse, TeamResponse } from "@/types/api"
import { Loader2, ArrowLeft, Pencil, Save, Trash2, X } from "lucide-react"
import { toast } from "sonner"
import { extractApiErrorMessage } from "@/lib/api-error"

const STATUS_LABELS: Record<ProjectResponse["status"], string> = {
  ACTIVE: "Активен",
  ARCHIVED: "Архив",
  COMPLETED: "Завершен",
}

export default function ProjectDetailsPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [project, setProject] = useState<ProjectResponse | null>(null)
  const [team, setTeam] = useState<TeamResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    status: "ACTIVE" as ProjectResponse["status"],
  })

  useEffect(() => {
    const projectId = params?.id
    if (!projectId) return
    const load = async () => {
      setIsLoading(true)
      try {
        const p = await projectService.getProjectById(projectId)
        setProject(p)
        setEditForm({
          name: p.name,
          description: p.description || "",
          status: p.status,
        })
        const t = await teamService.getTeamById(p.teamId)
        setTeam(t)
      } catch (err) {
        toast.error(extractApiErrorMessage(err))
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [params?.id])

  const handleDelete = async () => {
    if (!project) return
    try {
      await projectService.deleteProject(project.id)
      toast.success("Проект удален")
      router.push(`/projects?teamId=${project.teamId}`)
    } catch (err) {
      toast.error(extractApiErrorMessage(err))
    }
  }

  const handleStartEdit = () => {
    if (!project) return
    setEditForm({
      name: project.name,
      description: project.description || "",
      status: project.status,
    })
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    if (!project) return
    setEditForm({
      name: project.name,
      description: project.description || "",
      status: project.status,
    })
    setIsEditing(false)
  }

  const handleSave = async () => {
    if (!project || !editForm.name.trim()) return
    setIsSaving(true)
    try {
      const updated = await projectService.updateProject(project.id, {
        name: editForm.name.trim(),
        description: editForm.description.trim() || undefined,
        status: editForm.status,
      })
      setProject(updated)
      setIsEditing(false)
      toast.success("Проект обновлен")
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
          Загрузка проекта...
        </div>
      </MainLayout>
    )
  }

  if (!project) {
    return (
      <MainLayout>
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>Проект не найден</CardTitle>
            <CardDescription>Возможно, он был удален или у вас нет доступа.</CardDescription>
          </CardHeader>
        </Card>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <Button variant="outline" onClick={() => router.push(`/projects?teamId=${project.teamId}`)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            К списку проектов
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
                <Button onClick={handleSave} disabled={isSaving || !editForm.name.trim()}>
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Сохранить
                </Button>
              </>
            )}
            <Button variant="destructive" onClick={() => setIsDeleteOpen(true)} disabled={isSaving}>
              <Trash2 className="mr-2 h-4 w-4" />
              Удалить проект
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
                      value={editForm.name}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                      className="h-11"
                      aria-label="Название проекта"
                    />
                    <Textarea
                      value={editForm.description}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
                      aria-label="Описание проекта"
                    />
                  </div>
                ) : (
                  <>
                    <CardTitle className="text-2xl">{project.name}</CardTitle>
                    <CardDescription className="mt-2">{project.description || "Без описания"}</CardDescription>
                  </>
                )}
              </div>
              {isEditing ? (
                <div className="w-44">
                  <Select
                    value={editForm.status}
                    onValueChange={(value) =>
                      setEditForm((prev) => ({ ...prev, status: value as ProjectResponse["status"] }))
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
              ) : (
                <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground">
                  {STATUS_LABELS[project.status]}
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 text-sm text-muted-foreground md:grid-cols-2">
              <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                <span>Команда</span>
                <span className="font-medium text-foreground">{team?.name || project.teamId}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                <span>Создан</span>
                <span className="font-medium text-foreground">{new Date(project.createdAt).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2 md:col-span-2">
                <span>Обновлен</span>
                <span className="font-medium text-foreground">{new Date(project.updatedAt).toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <AlertDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Удалить проект?"
        description={`Проект “${project.name}” будет удален без возможности восстановления.`}
        confirmText="Удалить"
        cancelText="Отмена"
        onConfirm={handleDelete}
        isDanger
      />
    </MainLayout>
  )
}

