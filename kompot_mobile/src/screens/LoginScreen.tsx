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
import { login, clearError } from "@/store/slices/authSlice"
import { colors } from "@/theme/colors"
import { AuthStackParamList } from "@/navigation/types"

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, "Login">
}

export const LoginScreen = ({ navigation }: Props) => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const dispatch = useAppDispatch()
  const { isLoading, error } = useAppSelector((state) => state.auth)

  const handleSubmit = async () => {
    dispatch(clearError())
    try {
      await dispatch(login({ email: email.trim(), password })).unwrap()
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
        <Text style={styles.title}>Вход</Text>
        <Text style={styles.subtitle}>Добро пожаловать</Text>

        <Text style={styles.label}>Почта</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          placeholderTextColor={colors.muted}
          autoCapitalize="none"
          keyboardType="email-address"
          editable={!isLoading}
          accessibilityLabel="Почта"
        />

        <Text style={styles.label}>Пароль</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          placeholderTextColor={colors.muted}
          secureTextEntry
          editable={!isLoading}
          accessibilityLabel="Пароль"
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={isLoading || !email.trim() || !password}
          accessibilityRole="button"
          accessibilityLabel="Войти"
        >
          {isLoading ? (
            <ActivityIndicator color={colors.primaryText} />
          ) : (
            <Text style={styles.buttonText}>Войти</Text>
          )}
        </Pressable>

        <Pressable onPress={() => navigation.navigate("Register")} accessibilityRole="link">
          <Text style={styles.link}>
            Нет аккаунта? <Text style={styles.linkAccent}>Регистрация</Text>
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
  subtitle: { color: colors.muted, marginBottom: 28, marginTop: 4 },
  label: { color: colors.text, marginBottom: 6, fontWeight: "600" },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    marginBottom: 16,
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
