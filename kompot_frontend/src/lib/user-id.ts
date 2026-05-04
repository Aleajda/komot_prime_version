export const normalizeUserId = (userId: string | undefined): string =>
  String(userId ?? "").trim().toLowerCase()

export const formatUserIdSnippet = (userId: string): string =>
  normalizeUserId(userId).slice(0, 8) || "?"
