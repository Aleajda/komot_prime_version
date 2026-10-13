# Kompot Desktop (Electron + React)

Авторизация, чат (STOMP + SockJS), друзья.

## Запуск

```bash
cd kompot_desktop
npm install --legacy-peer-deps --ignore-scripts
npm run postinstall:electron   # бинарник Electron (нужен доступ к GitHub/CDN)
npm run dev
```

`npm run dev` сам поднимет Vite; если Electron ещё не скачан — открой http://localhost:5173.

Только браузер:

```bash
npm run dev:web
```

API: `http://localhost:8080/api` (или `VITE_API_URL=...`).
