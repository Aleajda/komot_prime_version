# Kompot Mobile (React Native / Expo)

Авторизация, чат (native STOMP WebSocket), друзья.

## Запуск

```bash
cd kompot_mobile
npm install
npx expo start
```

API по умолчанию: `http://10.0.2.2:8080/api` (Android-эмулятор → localhost ПК).

На реальном устройстве / iOS:

```bash
EXPO_PUBLIC_API_URL=http://<IP-ПК>:8080/api npx expo start
```

Бэкенд должен слушать raw WebSocket `/ws` (уже добавлено в `WebSocketConfig`).
