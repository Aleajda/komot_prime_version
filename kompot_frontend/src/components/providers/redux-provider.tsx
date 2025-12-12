"use client"

import { Provider } from "react-redux"
import { store } from "@/store/store"
import { useEffect } from "react"
import { useDispatch } from "react-redux"
import { initializeAuth } from "@/store/slices/authSlice"

const AuthInitializer = ({ children }: { children: React.ReactNode }) => {
  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(initializeAuth())
  }, [dispatch])

  return <>{children}</>
}

export const ReduxProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <Provider store={store}>
      <AuthInitializer>{children}</AuthInitializer>
    </Provider>
  )
}

