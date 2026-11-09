"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { getApiUrl } from "@/lib/api-url"

type FeaturesState = {
  workspaceEnabled: boolean
  ready: boolean
}

const FeaturesContext = createContext<FeaturesState>({ workspaceEnabled: false, ready: false })

export const FeaturesProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<FeaturesState>({ workspaceEnabled: false, ready: false })

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const response = await fetch(`${getApiUrl()}/features`)
        if (!response.ok) {
          throw new Error("features")
        }
        const data = (await response.json()) as { workspaceEnabled?: boolean }
        if (!cancelled) {
          setState({ workspaceEnabled: Boolean(data.workspaceEnabled), ready: true })
        }
      } catch {
        if (!cancelled) {
          setState({ workspaceEnabled: false, ready: true })
        }
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  return <FeaturesContext.Provider value={state}>{children}</FeaturesContext.Provider>
}

export const useFeatures = () => useContext(FeaturesContext)
