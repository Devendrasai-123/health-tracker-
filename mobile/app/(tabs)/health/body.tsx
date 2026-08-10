import { useCallback, useEffect, useMemo, useState } from 'react';
import { Image, ScrollView, StyleSheet, View } from 'react-native';
import {
  Button,
  Chip,
  HelperText,
  Modal,
  Portal,
  Searchbar,
  Text,
  TextInput,
  useTheme,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

import { GlassCard } from '@/components/GlassCard';
import { AlertBanner } from '@/components/AlertBanner';
import { TrendChart } from '@/components/TrendChart';
import { EmptyState } from '@/components/EmptyState';
import { DateField } from '@/components/DateField';
import { NumberField } from '@/components/NumberField';
import { computeAlerts, formatDate, getTestTypeDef, shortDate, TEST_TYPES, todayStr } from '@/constants/metrics';
import { matchesSearch } from '@/utils/helpers';
import { useDataStore } from '@/stores/data';
import { addBloodTest, deleteBloodTest, listBloodTestsByType, updateBloodTest } from '@/services/blood-test-service';
import { palette, radii } from '@/constants/theme';
import type { BloodTest, BloodTestInput } from '@/types';

export default function BodyReportsScreen() {
  const theme = useTheme();
  const bloodTests = useDataStore((s) => s.bloodTests);
  const reloadBloodTests = useDataStore((s) => s.reloadBloodTests);

  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<BloodTest | null>(null);
  const [query, setQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>(TEST_TYPES[0].label);
  const [typeData, setTypeData] = useState<BloodTest[]>([]);

  useFocusEffect(
    useCallback(() => {
      reloadBloodTests();
    }, [reloadBloodTests]),
  );

  useEffect(() => {
    listBloodTestsByType(selectedType).then(setTypeData).catch(() => setTypeData([]));
  }, [selectedType]);

  const filtered = useMemo(
    () =>
      bloodTests.filter(
        (t) =>
          matchesSearch(t.testType, query) ||
          matchesSearch(t.date, query) ||
          matchesSearch(String(t.value), query),
      ),
    [bloodTests, query],
  );

  const alerts = computeAlerts(
    bloodTests.map((t) => ({ testType: t.testType, value: t.value, unit: t.unit })),
  );

  const remove = async (id: number) => {
    await deleteBloodTest(id);
    await reloadBloodTests();
    setTypeData((prev) => prev.filter((t) => t.id !== id));
  };

  const ink = theme.dark ? palette.orchidWhite : palette.warmBlack;
  const muted = theme.dark ? palette.chromeWhite : palette.masala;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled">
      <GlassCard contentStyle={styles.hero3d}>
        <View style={[styles.bodySilhouette, { borderColor: palette.chromeWhite }]}>
          <MaterialCommunityIcons name="human" size={72} color={palette.vermillion} />
        </View>
        <View style={styles.heroText}>
          <Text style={[styles.heroTitle, { color: ink }]}>3D Body</Text>
          <Text style={[styles.heroSub, { color: muted }]}>
            Interactive 3D body map comes next. Labs & encrypted reports are live now.
          </Text>
        </View>
      </GlassCard>

      <View style={styles.headerRow}>
        <Text style={[styles.sectionTitle, { color: ink }]}>Blood tests</Text>
        <Button
          mode="contained"
          compact
          buttonColor={palette.vermillion}
          textColor="#fff"
          style={{ borderRadius: radii.pill }}
          onPress={() => {
            setEditing(null);
            setShowAdd(true);
          }}>
          Add test
        </Button>
      </View>

      <Searchbar
        placeholder="Search labs"
        value={query}
        onChangeText={setQuery}
        style={styles.search}
      />

      <AlertBanner alerts={alerts} />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {TEST_TYPES.slice(0, 10).map((t) => (
          <Chip
            key={t.label}
            selected={t.label === selectedType}
            onPress={() => setSelectedType(t.label)}
            showSelectedCheck={false}
            style={styles.chip}>
            {t.label}
          </Chip>
        ))}
      </ScrollView>

      <TrendChart
        data={typeData.map((t) => ({ value: t.value, label: shortDate(t.date) }))}
        color={palette.vermillion}
        yLabelSuffix={typeData[0] ? ` ${typeData[0].unit}` : ''}
        area
      />

      {filtered.length === 0 ? (
        <EmptyState icon="flask-outline" title="No labs yet" message="Add your first encrypted blood test." />
      ) : (
        <View style={styles.list}>
          {filtered.map((t) => (
            <GlassCard
              key={t.id}
              contentStyle={styles.item}
              style={{ marginBottom: 8 }}>
              <PressableRow
                onPress={() => {
                  setEditing(t);
                  setShowAdd(true);
                }}
                onDelete={() => remove(t.id)}
                title={t.testType}
                subtitle={`${formatDate(t.date)}`}
                value={`${t.value} ${t.unit}`}
              />
            </GlassCard>
          ))}
        </View>
      )}

      <Portal>
        <AddBloodTestModal
          visible={showAdd}
          initial={editing}
          onDismiss={() => {
            setShowAdd(false);
            setEditing(null);
          }}
          onSaved={() => {
            setShowAdd(false);
            setEditing(null);
            reloadBloodTests();
            listBloodTestsByType(selectedType).then(setTypeData);
          }}
        />
      </Portal>
    </ScrollView>
  );
}

function PressableRow({
  title,
  subtitle,
  value,
  onPress,
  onDelete,
}: {
  title: string;
  subtitle: string;
  value: string;
  onPress: () => void;
  onDelete: () => void;
}) {
  const theme = useTheme();
  return (
    <View style={styles.itemRow}>
      <View style={{ flex: 1 }} onTouchEnd={onPress}>
        <Text style={{ color: theme.colors.onSurface, fontWeight: '700' }}>{title}</Text>
        <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 12 }}>{subtitle}</Text>
      </View>
      <Text style={{ color: theme.colors.onSurface, fontWeight: '800', marginRight: 10 }}>{value}</Text>
      <MaterialCommunityIcons
        name="delete-outline"
        size={20}
        color={theme.colors.onSurfaceVariant}
        onPress={onDelete}
      />
    </View>
  );
}

function AddBloodTestModal({
  visible,
  initial,
  onDismiss,
  onSaved,
}: {
  visible: boolean;
  initial: BloodTest | null;
  onDismiss: () => void;
  onSaved: () => void;
}) {
  const theme = useTheme();
  const [date, setDate] = useState(todayStr());
  const [testType, setTestType] = useState(TEST_TYPES[0].label);
  const [value, setValue] = useState('');
  const [unit, setUnit] = useState('');
  const [notes, setNotes] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!visible) return;
    if (initial) {
      setDate(initial.date);
      setTestType(initial.testType);
      setValue(String(initial.value));
      setUnit(initial.unit);
      setNotes(initial.notes ?? '');
      setPhotoUri(initial.photoUri);
    } else {
      setDate(todayStr());
      setTestType(TEST_TYPES[0].label);
      setValue('');
      setUnit(TEST_TYPES[0].unit);
      setNotes('');
      setPhotoUri(null);
    }
    setError('');
  }, [visible, initial]);

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.6 });
    if (!result.canceled && result.assets[0]) setPhotoUri(result.assets[0].uri);
  };

  const save = async () => {
    if (!value) {
      setError('Enter a value');
      return;
    }
    setBusy(true);
    const input: BloodTestInput = {
      date,
      testType,
      value: Number(value),
      unit: unit || getTestTypeDef(testType).unit,
      notes: notes || null,
      photoUri,
      source: photoUri ? 'photo' : 'manual',
    };
    if (initial) await updateBloodTest(initial.id, input);
    else await addBloodTest(input);
    setBusy(false);
    onSaved();
  };

  return (
    <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}>
      <Text style={{ fontWeight: '800', fontSize: 18, color: theme.colors.onSurface }}>
        {initial ? 'Edit lab' : 'Add lab'}
      </Text>
      <DateField value={date} onChange={setDate} maximumDate={new Date()} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {TEST_TYPES.map((t) => (
          <Chip
            key={t.label}
            selected={t.label === testType}
            onPress={() => {
              setTestType(t.label);
              setUnit(t.unit);
            }}
            showSelectedCheck={false}>
            {t.label}
          </Chip>
        ))}
      </ScrollView>
      <NumberField label="Value" value={value} onChange={setValue} decimal />
      <TextInput mode="outlined" label="Unit" value={unit} onChangeText={setUnit} style={{ marginTop: 8 }} />
      <TextInput mode="outlined" label="Notes" value={notes} onChangeText={setNotes} style={{ marginTop: 8 }} />
      <View style={styles.photoRow}>
        {photoUri ? <Image source={{ uri: photoUri }} style={styles.thumb} /> : null}
        <Button mode="outlined" onPress={pickPhoto}>
          Photo
        </Button>
      </View>
      <HelperText type="error" visible={!!error}>
        {error}
      </HelperText>
      <View style={styles.modalActions}>
        <Button onPress={onDismiss}>Cancel</Button>
        <Button mode="contained" buttonColor={palette.vermillion} textColor="#fff" loading={busy} onPress={save}>
          Save
        </Button>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 120 },
  hero3d: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  bodySilhouette: {
    width: 88,
    height: 88,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    backgroundColor: 'rgba(235,94,40,0.08)',
  },
  heroText: { flex: 1 },
  heroTitle: { fontSize: 20, fontWeight: '800' },
  heroSub: { fontSize: 13, marginTop: 4, lineHeight: 18 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  sectionTitle: { fontSize: 18, fontWeight: '800' },
  search: { marginBottom: 10, borderRadius: 14, elevation: 0 },
  chips: { gap: 8, paddingVertical: 8 },
  chip: { alignSelf: 'flex-start' },
  list: { marginTop: 8 },
  item: { paddingVertical: 10 },
  itemRow: { flexDirection: 'row', alignItems: 'center' },
  modal: { margin: 20, borderRadius: radii.xl, padding: 18, maxHeight: '88%' },
  photoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  thumb: { width: 56, height: 56, borderRadius: 10 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 12 },
});
