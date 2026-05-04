import { ProjectResponse, TeamResponse } from "@/types/api"
import { normalizeUserId } from "@/lib/user-id"

/** Пользователь в ростере проекта (админы и участники по полям проекта). */
export function isUserOnProjectRoster(project: ProjectResponse, userId: string): boolean {
  const n = normalizeUserId(userId)
  if ((project.editorIds || []).some((id) => normalizeUserId(id) === n)) return true
  if ((project.memberIds || []).some((id) => normalizeUserId(id) === n)) return true
  return false
}

/** Как на бэкенде validateProjectMember: проект или привилегированная роль в команде. */
export function canParticipateInProject(
  project: ProjectResponse | null,
  team: TeamResponse | null,
  userId: string
): boolean {
  if (!project) return false
  if (isUserOnProjectRoster(project, userId)) return true
  if (!team) return false
  if (String(team.ownerId) === String(userId)) return true
  return (team.editorIds || []).includes(userId)
}
