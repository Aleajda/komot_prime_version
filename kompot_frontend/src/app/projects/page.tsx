"use client"

import { useEffect, useMemo, useState } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { projectService, teamService } from "@/services"
import { ProjectResponse, TeamResponse } from "@/types/api"
import { Loader2, Plus } from "lucide-react"
import { toast } from "sonner"
import { extractApiErrorMessage } from "@/lib/api-error"

const STATUS_LABELS: Record<ProjectResponse["status"], string> = {
  ACTIVE: "Активен",
  ARCHIVED: "Архив",
  COMPLETED: "Завершен",
}

export default function ProjectsPage() {
  const [teams, setTeams] = useState<TeamResponse[]>([])
  const [selectedTeamId, setSelectedTeamId] = useState<string>("")
  const [projects, setProjects] = useState<ProjectResponse[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [form, setForm] = useState({ name: "", description: "", status: "ACTIVE" as ProjectResponse["status"] })

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
                  <option value="ACTIVE">Активен</option>
                  <option value="COMPLETED">Завершен</option>
                  <option value="ARCHIVED">Архив</option>
                </select>
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
                    <div>
                      <CardTitle>{project.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {project.description || "Без описания"}
                      </CardDescription>
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