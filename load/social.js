// Нагрузка на социальную часть API: вход, профиль, друзья, чаты, поиск людей.
// Запуск: k6 run load/social.js
// Против другого сервера: k6 run -e BASE_URL=https://kompot-api.onrender.com -e VUS=5 -e DURATION=20s load/social.js
import http from "k6/http"
import { check, sleep } from "k6"
import { Trend } from "k6/metrics"

const socialDuration = new Trend("social_read_duration")
const baseUrl = __ENV.BASE_URL || "http://localhost:8080"
const vus = Number(__ENV.VUS || 10)
const duration = __ENV.DURATION || "30s"

export const options = {
  scenarios: {
    social: {
      executor: "constant-vus",
      vus,
      duration,
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.05"],
    http_req_duration: ["p(95)<800"],
    checks: ["rate>0.95"],
  },
}

function register(index) {
  const body = JSON.stringify({
    email: `load-${index}-${Date.now()}@kompot.test`,
    username: `load${index}${Date.now()}`,
    password: "loadtest1",
    firstName: "Load",
    lastName: String(index),
  })
  const response = http.post(`${baseUrl}/api/auth/register`, body, {
    headers: { "Content-Type": "application/json" },
  })
  check(response, { "register status 200": (r) => r.status === 200 })
  return response.json("accessToken")
}

export function setup() {
  const health = http.get(`${baseUrl}/api/health`)
  check(health, { "health status 200": (r) => r.status === 200 })
  const tokens = []
  for (let index = 0; index < 8; index += 1) {
    const token = register(index)
    if (token) tokens.push(token)
  }
  if (tokens.length === 0) {
    throw new Error("Не удалось зарегистрировать пользователей для нагрузки")
  }
  return { tokens }
}

export default function (data) {
  const token = data.tokens[(__VU - 1) % data.tokens.length]
  const headers = { Authorization: `Bearer ${token}` }
  const requests = [
    `${baseUrl}/api/users/me`,
    `${baseUrl}/api/friends`,
    `${baseUrl}/api/friends/requests`,
    `${baseUrl}/api/chats`,
    `${baseUrl}/api/users/search?query=load`,
  ]
  const responses = http.batch(requests.map((url) => ["GET", url, null, { headers }]))
  responses.forEach((response) => socialDuration.add(response.timings.duration))
  check(responses[0], { "profile status 200": (r) => r.status === 200 })
  check(responses[1], { "friends status 200": (r) => r.status === 200 })
  check(responses[2], { "requests status 200": (r) => r.status === 200 })
  check(responses[3], { "chats status 200": (r) => r.status === 200 })
  check(responses[4], { "people search status 200": (r) => r.status === 200 })
  sleep(1)
}
