import { FormEvent, useState } from "react"
import { Link, Navigate } from "react-router-dom"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { login, clearError } from "@/store/slices/authSlice"

export const LoginPage = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const dispatch = useAppDispatch()
  const { isLoading, isAuthenticated, error } = useAppSelector((s) => s.auth)

  if (isAuthenticated) {
    return <Navigate to="/chat" replace />
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    dispatch(clearError())
    try {
      await dispatch(login({ email: email.trim(), password })).unwrap()
    } catch {
      // error in store
    }
  }

  return (
    <div className="auth-page">
      <div className="card">
        <div className="brand">Kompot</div>
        <h1>Вход</h1>
        <p>Добро пожаловать в десктоп-клиент</p>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="email">Почта</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          <div className="field">
            <label htmlFor="password">Пароль</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          {error ? <div className="error">{error}</div> : null}
          <button className="btn" type="submit" disabled={isLoading} style={{ width: "100%" }}>
            {isLoading ? "Вход..." : "Войти"}
          </button>
        </form>
        <p style={{ marginTop: 16, marginBottom: 0 }}>
          Нет аккаунта? <Link to="/auth/register">Регистрация</Link>
        </p>
      </div>
    </div>
  )
}
