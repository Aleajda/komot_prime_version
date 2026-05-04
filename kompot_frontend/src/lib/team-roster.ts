import { TeamResponse } from "@/types/api"
import { normalizeUserId } from "@/lib/user-id"

/** Пользователь в составе команды (владелец, админ или участник по полям API). */
export function isUserInTeamRoster(team: TeamResponse, userId: string): boolean {
  const n = normalizeUserId(userId)
  if (normalizeUserId(team.ownerId) === n) return true
  if ((team.editorIds || []).some((id) => normalizeUserId(id) === n)) return true
  if ((team.memberIds || []).some((id) => normalizeUserId(id) === n)) return true
  return false
}
