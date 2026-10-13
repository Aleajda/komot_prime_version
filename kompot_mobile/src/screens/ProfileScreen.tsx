import { View, Text, Pressable, StyleSheet } from "react-native"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { logout } from "@/store/slices/authSlice"
import { webSocketService } from "@/services"
import { colors } from "@/theme/colors"

export const ProfileScreen = () => {
  const dispatch = useAppDispatch()
  const { user } = useAppSelector((s) => s.auth)

  const handleLogout = async () => {
    webSocketService.disconnect()
    await dispatch(logout())
  }

  return (
    <View style={styles.root}>
      <Text style={styles.title}>Профиль</Text>
      <View style={styles.card}>
        <Text style={styles.name}>{user?.username || "—"}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        {(user?.firstName || user?.lastName) && (
          <Text style={styles.meta}>
            {[user?.firstName, user?.lastName].filter(Boolean).join(" ")}
          </Text>
        )}
      </View>
      <Pressable style={styles.button} onPress={handleLogout} accessibilityRole="button">
        <Text style={styles.buttonText}>Выйти</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background, padding: 20 },
  title: { fontSize: 24, fontWeight: "700", color: colors.text, marginBottom: 16 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  name: { color: colors.text, fontSize: 18, fontWeight: "700" },
  email: { color: colors.muted, marginTop: 4 },
  meta: { color: colors.muted, marginTop: 8 },
  button: {
    marginTop: 24,
    backgroundColor: colors.danger,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "700" },
})
