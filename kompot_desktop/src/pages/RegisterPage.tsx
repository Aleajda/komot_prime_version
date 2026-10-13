import { FormEvent, useState } from "react"
import { Link, Navigate } from "react-router-dom"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { register, clearError } from "@/store/slices/authSlice"

export const RegisterPage = () => {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
  })
  const dispatch = useAppDispatch()
  const { isLoading, isAuthenticated, error } = useAppSelector((s) => s.auth)
  const mismatch = !!form.confirmPassword && form.password !== form.confirmPassword

  if (isAuthenticated) {
    return <Navigate to="/chat" replace />
  }

  const handleChange = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (mismatch) return
    dispatch(clearError())
    try {
      await dispatch(
        register({
          username: form.username.trim(),
          email: form.email.trim(),
          password: form.password,
          firstName: form.firstName.trim() || undefined,
          lastName: form.lastName.trim() || undefined,
        })
      ).unwrap()
    } catch {
      // error in store
    }
  }

  return (
    <div className="auth-page">
      <div className="card" style={{ maxWidth: 520 }}>
        <div className="brand">Kompot</div>
        <h1>Регистрация</h1>
        <p>Создайте аккаунт</p>
        <form onSubmit={handleSubmit}>
          {(
            [
              ["username", "Имя пользователя", "text"],
              ["email", "Почта", "email"],
              ["firstName", "Имя (опционально)", "text"],
              ["lastName", "Фамилия (опционально)", "text"],
              ["password", "Пароль", "password"],
              ["confirmPassword", "Подтвердите пароль", "password"],
            ] as const
          ).map(([key, label, type]) => (
            <div className="field" key={key}>
              <label htmlFor={key}>{label}</label>
              <input
                id={key}
                type={type}
                value={form[key]}
                onChange={(e) => handleChange(key, e.target.value)}
                required={key !== "firstName" && key !== "lastName"}
                disabled={isLoading}
              />
            </div>
          ))}
          {mismatch ? <div className="error">Пароли не совпадают</div> : null}
          {error ? <div className="error">{error}</div> : null}
          <button
            className="btn"
            type="submit"
            disabled={isLoading || mismatch}
            style={{ width: "100%" }}
          >
            {isLoading ? "Регистрация..." : "Зарегистрироваться"}
          </button>
        </form>
        <p style={{ marginTop: 16, marginBottom: 0 }}>
          Уже есть аккаунт? <Link to="/auth/login">Войти</Link>
        </p>
      </div>
    </div>
  )
}
