const FALLBACK_API_URL = "http://localhost:8080/api"

type RuntimeWindow = Window & { __KOMPOT_API_URL__?: string }

export function getApiUrl(): string {
  if (typeof window !== "undefined") {
    const runtime = (window as RuntimeWindow).__KOMPOT_API_URL__
    if (runtime) {
      return runtime
    }
  }
  return process.env.NEXT_PUBLIC_API_URL || FALLBACK_API_URL
}

export function apiRuntimeScript(): string {
  const url = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || FALLBACK_API_URL
  return `window.__KOMPOT_API_URL__=${JSON.stringify(url)}`
}
