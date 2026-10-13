import { useState } from "react"
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { register, clearError } from "@/store/slices/authSlice"
import { colors } from "@/theme/colors"
import { AuthStackParamList } from "@/navigation/types"

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, "Register">
}

export const RegisterScreen = ({ navigation }: Props) => {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
  })
  const dispatch = useAppDispatch()
  const { isLoading, error } = useAppSelector((state) => state.auth)
  const passwordsMismatch = !!form.confirmPassword && form.password !== form.confirmPassword

  const handleChange = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async () => {
    if (passwordsMismatch) {
      return
    }
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
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.brand}>Kompot</Text>
        <Text style={styles.title}>Регистрация</Text>
        <Text style={styles.subtitle}>Создайте аккаунт</Text>

        {(
          [
            ["username", "Имя пользователя", false],
            ["email", "Почта", false],
            ["firstName", "Имя (опционально)", false],
            ["lastName", "Фамилия (опционально)", false],
            ["password", "Пароль", true],
            ["confirmPassword", "Подтвердите пароль", true],
          ] as const
        ).map(([key, label, secure]) => (
          <View key={key}>
            <Text style={styles.label}>{label}</Text>
            <TextInput
              style={styles.input}
              value={form[key]}
              onChangeText={(v) => handleChange(key, v)}
              placeholderTextColor={colors.muted}
              secureTextEntry={secure}
              autoCapitalize={key === "email" || key === "username" ? "none" : "sentences"}
              keyboardType={key === "email" ? "email-address" : "default"}
              editable={!isLoading}
              accessibilityLabel={label}
            />
          </View>
        ))}

        {passwordsMismatch ? <Text style={styles.error}>Пароли не совпадают</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          style={[styles.button, (isLoading || passwordsMismatch) && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={isLoading || passwordsMismatch || !form.username || !form.email || !form.password}
          accessibilityRole="button"
          accessibilityLabel="Зарегистрироваться"
        >
          {isLoading ? (
            <ActivityIndicator color={colors.primaryText} />
          ) : (
            <Text style={styles.buttonText}>Зарегистрироваться</Text>
          )}
        </Pressable>

        <Pressable onPress={() => navigation.navigate("Login")} accessibilityRole="link">
          <Text style={styles.link}>
            Уже есть аккаунт? <Text style={styles.linkAccent}>Войти</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  container: { flexGrow: 1, justifyContent: "center", padding: 24 },
  brand: { fontSize: 28, fontWeight: "800", color: colors.primary, marginBottom: 8 },
  title: { fontSize: 26, fontWeight: "700", color: colors.text },
  subtitle: { color: colors.muted, marginBottom: 24, marginTop: 4 },
  label: { color: colors.text, marginBottom: 6, fontWeight: "600" },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    marginBottom: 14,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: colors.primaryText, fontWeight: "700", fontSize: 16 },
  error: { color: colors.danger, marginBottom: 8 },
  link: { color: colors.muted, textAlign: "center", marginTop: 20 },
  linkAccent: { color: colors.primary, fontWeight: "600" },
})
