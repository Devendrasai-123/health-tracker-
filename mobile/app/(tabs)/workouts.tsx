import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Button,
  Card,
  Chip,
  HelperText,
  Modal,
  Portal,
  Text,
  TextInput,
  useTheme,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';

import { Screen } from '@/components/Screen';
import { EmptyState } from '@/components/EmptyState';
import { DateField } from '@/components/DateField';
import { NumberField } from '@/components/NumberField';
import { formatDate, INTENSITY_LABELS, todayStr } from '@/constants/metrics';
import { useDataStore } from '@/stores/data';
import { addWorkout, deleteWorkout } from '@/services/workout-service';
import type { WorkoutInput } from '@/types';

export default function WorkoutsScreen() {
  const theme = useTheme();
  const workouts = useDataStore((s) => s.workouts);
  const reloadWorkouts = useDataStore((s) => s.reloadWorkouts);

  const [showAdd, setShowAdd] = useState(false);

  useFocusEffect(
    useCallback(() => {
      reloadWorkouts();
    }, [reloadWorkouts]),
  );

  const remove = async (id: number) => {
    await deleteWorkout(id);
    await reloadWorkouts();
  };

  return (
    <Screen
      title="Workouts"
      subtitle="Training log"
      action={
        <Button mode="contained" compact onPress={() => setShowAdd(true)}>
          Log workout
        </Button>
      }>
      {workouts.length === 0 ? (
        <EmptyState
          icon="dumbbell"
          title="No workouts yet"
          message="Log a session and track your training progression over time."
        />
      ) : (
        <View style={styles.list}>
          {workouts.map((w) => (
            <Card key={w.id} style={[styles.item, { backgroundColor: theme.colors.surface }]}>
              <Card.Content style={styles.itemContent}>
                <View style={[styles.itemIcon, { backgroundColor: theme.colors.primary + '22' }]}>
                  <MaterialCommunityIcons name="dumbbell" size={20} color={theme.colors.primary} />
                </View>
                <View style={styles.itemText}>
                  <Text variant="labelLarge" style={{ color: theme.colors.onSurface }}>
                    {w.name}
                  </Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    {formatDate(w.date)}
                    {w.durationMin != null ? ` · ${w.durationMin} min` : ''}
                    {w.intensity != null ? ` · ${INTENSITY_LABELS[w.intensity] ?? w.intensity}` : ''}
                    {w.calories != null ? ` · ${w.calories} kcal` : ''}
                  </Text>
                </View>
                <MaterialCommunityIcons
                  name="delete-outline"
                  size={20}
                  color={theme.colors.onSurfaceVariant}
                  onPress={() => remove(w.id)}
                />
              </Card.Content>
            </Card>
          ))}
        </View>
      )}

      <Portal>
        <AddWorkoutModal
          visible={showAdd}
          onDismiss={() => setShowAdd(false)}
          onSaved={() => {
            setShowAdd(false);
            reloadWorkouts();
          }}
        />
      </Portal>
    </Screen>
  );
}

interface AddWorkoutModalProps {
  visible: boolean;
  onDismiss: () => void;
  onSaved: () => void;
}

const INTENSITIES = [1, 2, 3, 4, 5];

function AddWorkoutModal({ visible, onDismiss, onSaved }: AddWorkoutModalProps) {
  const theme = useTheme();
  const [date, setDate] = useState(todayStr());
  const [name, setName] = useState('');
  const [duration, setDuration] = useState('');
  const [intensity, setIntensity] = useState<number | null>(null);
  const [calories, setCalories] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (visible) {
      setDate(todayStr());
      setName('');
      setDuration('');
      setIntensity(null);
      setCalories('');
      setNotes('');
      setError('');
    }
  }, [visible]);

  const save = async () => {
    if (!name.trim()) {
      setError('Enter an activity name.');
      return;
    }
    setBusy(true);
    const input: WorkoutInput = {
      date,
      name: name.trim(),
      durationMin: duration ? Number(duration) : null,
      intensity,
      calories: calories ? Number(calories) : null,
      notes: notes || null,
    };
    await addWorkout(input);
    setBusy(false);
    onSaved();
  };

  return (
    <Modal
      visible={visible}
      onDismiss={onDismiss}
      contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}>
      <Text variant="titleLarge" style={{ color: theme.colors.onSurface, fontWeight: '700' }}>
        Log workout
      </Text>
      <DateField value={date} onChange={setDate} maximumDate={new Date()} />
      <TextInput
        mode="outlined"
        label="Activity (e.g. Running, Weights)"
        value={name}
        onChangeText={setName}
        style={styles.field}
      />

      <View style={styles.macroGrid}>
        <NumberField label="Duration (min)" value={duration} onChange={setDuration} />
        <NumberField label="Calories" value={calories} onChange={setCalories} />
      </View>

      <Text variant="labelMedium" style={styles.fieldLabel}>
        Intensity
      </Text>
      <View style={styles.chips}>
        {INTENSITIES.map((i) => {
          const active = intensity === i;
          return (
            <Chip key={i} selected={active} onPress={() => setIntensity(i)} showSelectedCheck={false}>
              {INTENSITY_LABELS[i]}
            </Chip>
          );
        })}
      </View>

      <TextInput
        mode="outlined"
        label="Notes (optional)"
        value={notes}
        onChangeText={setNotes}
        multiline
        style={styles.field}
      />

      <HelperText type="error" visible={!!error}>
        {error}
      </HelperText>

      <View style={styles.modalActions}>
        <Button mode="text" onPress={onDismiss}>
          Cancel
        </Button>
        <Button mode="contained" onPress={save} loading={busy} disabled={busy || !name.trim()}>
          Save
        </Button>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  list: { gap: 8, marginTop: 8 },
  item: { borderRadius: 14, elevation: 1 },
  itemContent: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  itemIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  itemText: { flex: 1 },
  modal: { margin: 24, borderRadius: 18, padding: 20, maxHeight: '88%' },
  field: { marginTop: 10 },
  fieldLabel: { marginTop: 12, marginBottom: 4, opacity: 0.8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  macroGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16, gap: 8 },
});
