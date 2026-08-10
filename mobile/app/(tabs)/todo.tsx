import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Checkbox, Text, TextInput, useTheme } from 'react-native-paper';
import { useFocusEffect } from 'expo-router';
import { Screen } from '@/components/Screen';
import { GlassCard } from '@/components/GlassCard';
import { EmptyState } from '@/components/EmptyState';
import { addTodo, deleteTodo, listTodos, setTodoDone } from '@/services/todo-service';
import { palette, radii } from '@/constants/theme';
import type { TodoItem } from '@/types';

export default function TodoScreen() {
  const theme = useTheme();
  const [items, setItems] = useState<TodoItem[]>([]);
  const [title, setTitle] = useState('');
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    setItems(await listTodos());
  }, []);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  const add = async () => {
    if (!title.trim()) return;
    setBusy(true);
    await addTodo(title);
    setTitle('');
    await reload();
    setBusy(false);
  };

  const toggle = async (item: TodoItem) => {
    await setTodoDone(item.id, !item.done);
    await reload();
  };

  const remove = async (id: number) => {
    await deleteTodo(id);
    await reload();
  };

  return (
    <Screen title="Todo" subtitle="Tasks & daily checklist">
      <GlassCard contentStyle={styles.addRow}>
        <TextInput
          mode="outlined"
          placeholder="Add a task…"
          value={title}
          onChangeText={setTitle}
          outlineColor={palette.chromeWhite}
          activeOutlineColor={palette.vermillion}
          style={styles.input}
          onSubmitEditing={add}
        />
        <Button
          mode="contained"
          onPress={add}
          loading={busy}
          buttonColor={palette.vermillion}
          textColor="#fff"
          style={styles.addBtn}>
          Add
        </Button>
      </GlassCard>

      {items.length === 0 ? (
        <EmptyState icon="checkbox-marked-outline" title="No todos yet" message="Add your first task above." />
      ) : (
        <View style={styles.list}>
          {items.map((item) => (
            <GlassCard key={item.id} contentStyle={styles.item}>
              <Checkbox
                status={item.done ? 'checked' : 'unchecked'}
                onPress={() => toggle(item)}
                color={palette.vermillion}
              />
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.itemTitle,
                    {
                      color: theme.colors.onSurface,
                      textDecorationLine: item.done ? 'line-through' : 'none',
                      opacity: item.done ? 0.5 : 1,
                    },
                  ]}>
                  {item.title}
                </Text>
                {item.category === 'travel' ? (
                  <Text style={{ color: palette.vermillion, fontSize: 11, marginTop: 2 }}>
                    Travel · {item.dueDate ?? 'scheduled'}
                  </Text>
                ) : null}
              </View>
              <Button mode="text" compact textColor={palette.masala} onPress={() => remove(item.id)}>
                Delete
              </Button>
            </GlassCard>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  addRow: { gap: 10 },
  input: { backgroundColor: 'transparent' },
  addBtn: { borderRadius: radii.md },
  list: { gap: 8, marginTop: 14 },
  item: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  itemTitle: { flex: 1, fontSize: 15, fontWeight: '600' },
});
