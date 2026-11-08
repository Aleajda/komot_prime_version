# Kompot

Веб-приложение: Next.js (`kompot_frontend`) + Spring Boot (`kompot`) + PostgreSQL.

## Локально в Docker

Нужны Docker Desktop и WSL2.

```bash
docker compose up --build
```

- Сайт: http://localhost:3000
- API: http://localhost:8080/api/health
- Postgres с хоста: `localhost:5433`, база `kompot`, пользователь и пароль `kompot`

Адрес API для браузера задаётся переменной `API_URL` у сервиса `frontend` и подставляется при открытии страницы, пересобирать фронт не нужно.

## Бесплатный хостинг

Постоянная бесплатная связка без банковской карты: **Neon** (PostgreSQL) + **Render Free** (API и сайт). Сервисы Render засыпают через ~15 минут без запросов, база Neon — через ~5 минут простоя. Данные при этом не удаляются.

1. Создайте проект на https://neon.tech и скопируйте строку подключения. Для Spring она должна начинаться с `jdbc:postgresql://`, в конце добавьте `?sslmode=require`.
2. Залейте репозиторий на GitHub.
3. На https://render.com создайте Blueprint из `render.yaml` либо два Web Service с Docker:
   - API: контекст `kompot`, Dockerfile `kompot/Dockerfile`, health check `/api/health`
   - Сайт: контекст `kompot_frontend`, Dockerfile `kompot_frontend/Dockerfile`
4. Переменные API: `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD`, `JWT_SECRET` (не короче 32 символов), `APP_CORS_ORIGINS` = публичный URL сайта.
5. Переменная сайта: `API_URL` = публичный URL API с суффиксом `/api`, например `https://kompot-api.onrender.com/api`.

Образец переменных — в `.env.example`.
