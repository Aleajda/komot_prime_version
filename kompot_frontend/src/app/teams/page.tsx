"use client"

import { useEffect, useState } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { teamService, userService } from "@/services"
import { TeamResponse } from "@/types/api"
import { Plus, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { extractApiErrorMessage } from "@/lib/api-error"

export default function TeamsPage() {
  const [teams, setTeams] = useState<TeamResponse[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [form, setForm] = useState({ name: "", description: "" })
  const [ownerNames, setOwnerNames] = useState<Record<string, string>>({})

  useEffect(() => {
    const loadTeams = async () => {
      setIsLoading(true)
      try {
        const data = await teamService.getUserTeams()
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