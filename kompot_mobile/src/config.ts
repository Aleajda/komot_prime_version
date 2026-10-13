/** Для Android-эмулятора: 10.0.2.2 = localhost хоста. Для устройства — IP ПК в локальной сети. */
export const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://10.0.2.2:8080/api"

export const getWsUrl = (): string => {
  const base = API_URL.replace(/\/api\/?$/, "")
  return base.replace(/^http/, "ws") + "/ws"
}
