import { useState } from "react"
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
} from "react-native"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { createChat, addChat, setActiveChat } from "@/store/slices/chatSlice"
import { UserResponse } from "@/types/api"
import { colors } from "@/theme/colors"
import { MainStackParamList } from "@/navigation/types"

type Props = {
  navigation: NativeStackNavigationProp<MainStackParamList, "CreateGroup">
}

export const CreateGroupScreen = ({ navigation }: Props) => {
  const dispatch = useAppDispatch()
  const { friends } = useAppSelector((s) => s.chat)
  const [groupName, setGroupName] = useState("")
  const [selected, setSelected] = useState<UserResponse[]>([])
  const [loading, setLoading] = useState(false)

  const toggle = (user: UserResponse) => {
    setSelected((prev) =>
      prev.some((u) => u.id === user.id) ? prev.filter((u) => u.id !== user.id) : [...prev, user]
    )
  }

  const handleCreate = async () => {
    if (!groupName.trim() || selected.length === 0) return
    setLoading(true)
    try {
      const chat = await dispatch(
        createChat({
          type: "GROUP",
          name: groupName.trim(),
          userIds: selected.map((u) => u.id),
        })
      ).unwrap()
      dispatch(addChat(chat))
      dispatch(setActiveChat(chat.id))
      navigation.replace("ChatRoom", { chatId: chat.id })
    } catch (e) {
      Alert.alert("Ошибка", e instanceof Error ? e.message : "Не удалось создать группу")
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.root}>
      <Text style={styles.label}>Название группы</Text>
      <TextInput
        style={styles.input}
        value={groupName}
        onChangeText={setGroupName}
        placeholder="Название..."
        placeholderTextColor={colors.muted}
      />
      <Text style={styles.label}>Участники</Text>
      <FlatList
        data={friends}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.empty}>Друзей нет</Text>}
        renderItem={({ item }) => {
          const isSelected = selected.some((u) => u.id === item.id)
          return (
            <Pressable
              style={[styles.row, isSelected && styles.rowSelected]}
              onPress={() => toggle(item)}
            >
              <Text style={styles.rowTitle}>{item.username || item.email}</Text>
              <Text style={styles.rowSub}>{item.email}</Text>
            </Pressable>
          )
        }}
      />
      <Pressable
        style={[styles.button, (!groupName.trim() || selected.length === 0 || loading) && styles.disabled]}
        onPress={handleCreate}
        disabled={!groupName.trim() || selected.length === 0 || loading}
      >
        {loading ? (
          <ActivityIndicator color={colors.primaryText} />
        ) : (
          <Text style={styles.buttonText}>Создать группу</Text>
        )}
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background, padding: 16 },
  label: { color: colors.text, fontWeight: "600", marginBottom: 8, marginTop: 8 },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  empty: { color: colors.muted, textAlign: "center", marginTop: 20 },
  row: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowSelected: { borderColor: colors.primary, backgroundColor: "#0c4a6e" },
  rowTitle: { color: colors.text, fontWeight: "600" },
  rowSub: { color: colors.muted, fontSize: 12, marginTop: 2 },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 12,
  },
  disabled: { opacity: 0.5 },
  buttonText: { color: colors.primaryText, fontWeight: "700" },
})
