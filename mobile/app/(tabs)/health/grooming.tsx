import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import {
  Button,
  Chip,
  FAB,
  HelperText,
  Modal,
  Portal,
  SegmentedButtons,
  Text,
  TextInput,
  useTheme,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

import { GlassCard } from '@/components/GlassCard';
import { EmptyState } from '@/components/EmptyState';
import {
  addWardrobeItem,
  deleteWardrobeItem,
  listWardrobe,
} from '@/services/wardrobe-service';
import { addRoutine, deleteRoutine, listRoutines } from '@/services/grooming-service';
import { palette, radii } from '@/constants/theme';
import type { GroomingRoutine, WardrobeCategory, WardrobeItem } from '@/types';

const CATEGORIES: { key: WardrobeCategory; label: string }[] = [
  { key: 'tops', label: 'Tops' },
  { key: 'pants', label: 'Pants' },
  { key: 'shoes', label: 'Shoes' },
  { key: 'outerwear', label: 'Outerwear' },
  { key: 'accessories', label: 'Accessories' },
];

type TabKey = 'wardrobe' | 'skincare' | 'schedule';

export default function GroomingScreen() {
  const theme = useTheme();
  const [tab, setTab] = useState<TabKey>('wardrobe');
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [routines, setRoutines] = useState<GroomingRoutine[]>([]);
  const [selected, setSelected] = useState<Partial<Record<WardrobeCategory, number>>>({});
  const [showAddCloth, setShowAddCloth] = useState(false);
  const [showAddRoutine, setShowAddRoutine] = useState(false);
  const [addCategory, setAddCategory] = useState<WardrobeCategory>('tops');

  const reload = useCallback(async () => {
    const [wardrobe, routinesList] = await Promise.all([listWardrobe(), listRoutines()]);
    setItems(wardrobe);
    setRoutines(routinesList);
  }, []);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  const byCategory = useMemo(() => {
    const map: Record<WardrobeCategory, WardrobeItem[]> = {
      tops: [],
      pants: [],
      shoes: [],
      outerwear: [],
      accessories: [],
    };
    for (const item of items) map[item.category].push(item);
    return map;
  }, [items]);

  const ink = theme.dark ? palette.orchidWhite : palette.warmBlack;
  const muted = theme.dark ? palette.chromeWhite : palette.masala;

  const openCameraUpload = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      const gallery = await ImagePicker.launchImageLibraryAsync({
        quality: 0.7,
        mediaTypes: ['images'],
      });
      if (!gallery.canceled && gallery.assets[0]) {
        setAddCategory('tops');
        setPendingPhoto(gallery.assets[0].uri);
        setShowAddCloth(true);
      }
      return;
    }
    const shot = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!shot.canceled && shot.assets[0]) {
      setAddCategory('tops');
      setPendingPhoto(shot.assets[0].uri);
      setShowAddCloth(true);
    }
  };

  const [pendingPhoto, setPendingPhoto] = useState<string | null>(null);

  const pickFromGallery = async (category: WardrobeCategory) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.7,
      mediaTypes: ['images'],
    });
    if (!result.canceled && result.assets[0]) {
      setAddCategory(category);
      setPendingPhoto(result.assets[0].uri);
      setShowAddCloth(true);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.pad} keyboardShouldPersistTaps="handled">
        <SegmentedButtons
          value={tab}
          onValueChange={(v) => setTab(v as TabKey)}
          buttons={[
            { value: 'wardrobe', label: 'Wear' },
            { value: 'skincare', label: 'Skincare' },
            { value: 'schedule', label: 'Schedule' },
          ]}
          style={styles.segments}
        />

        {tab === 'wardrobe' ? (
          <>
            <Text style={[styles.hero, { color: ink }]}>Dressup</Text>
            <Text style={[styles.sub, { color: muted }]}>
              Build your collection — photograph pieces and mix outfits.
            </Text>

            {CATEGORIES.map((cat) => {
              const list = byCategory[cat.key];
              const selectedId = selected[cat.key];
              return (
                <View key={cat.key} style={styles.categoryBlock}>
                  <View style={styles.catHeader}>
                    <Text style={[styles.catLabel, { color: muted }]}>{cat.label.toUpperCase()}</Text>
                    <Pressable onPress={() => pickFromGallery(cat.key)} hitSlop={8}>
                      <MaterialCommunityIcons name="plus" size={22} color={palette.vermillion} />
                    </Pressable>
                  </View>
                  {list.length === 0 ? (
                    <Pressable
                      onPress={() => pickFromGallery(cat.key)}
                      style={[styles.emptySlot, { borderColor: palette.chromeWhite }]}>
                      <MaterialCommunityIcons name="camera-plus-outline" size={28} color={muted} />
                      <Text style={{ color: muted, marginTop: 6, fontSize: 12 }}>Add photo</Text>
                    </Pressable>
                  ) : (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rail}>
                      {list.map((item) => {
                        const active = selectedId === item.id;
                        return (
                          <Pressable
                            key={item.id}
                            onPress={() =>
                              setSelected((s) => ({ ...s, [cat.key]: item.id }))
                            }
                            onLongPress={() => deleteWardrobeItem(item.id).then(reload)}
                            style={[
                              styles.clothCard,
                              active && { borderColor: palette.vermillion, borderWidth: 2 },
                            ]}>
                            {item.photoUri ? (
                              <Image source={{ uri: item.photoUri }} style={styles.clothImg} />
                            ) : (
                              <View style={[styles.clothImg, styles.clothFallback]}>
                                <MaterialCommunityIcons name="hanger" size={28} color={muted} />
                              </View>
                            )}
                            {active ? (
                              <View style={styles.selectedRing}>
                                <MaterialCommunityIcons name="check" size={16} color="#fff" />
                              </View>
                            ) : null}
                            <Text numberOfLines={1} style={[styles.clothName, { color: ink }]}>
                              {item.name}
                            </Text>
                          </Pressable>
                        );
                      })}
                      <Pressable
                        onPress={() => pickFromGallery(cat.key)}
                        style={[styles.clothCard, styles.addCard, { borderColor: palette.chromeWhite }]}>
                        <MaterialCommunityIcons name="image-plus" size={28} color={palette.vermillion} />
                        <Text style={{ color: muted, fontSize: 11, marginTop: 6 }}>Upload</Text>
                      </Pressable>
                    </ScrollView>
                  )}
                </View>
              );
            })}
          </>
        ) : null}

        {tab === 'skincare' ? (
          <RoutineList
            title="Skincare routines"
            kind="skincare"
            items={routines.filter((r) => r.kind === 'skincare' || r.kind === 'grooming')}
            onAdd={() => setShowAddRoutine(true)}
            onDelete={(id) => deleteRoutine(id).then(reload)}
          />
        ) : null}

        {tab === 'schedule' ? (
          <RoutineList
            title="Grooming timetable"
            kind="schedule"
            items={routines.filter((r) => r.kind === 'schedule')}
            onAdd={() => setShowAddRoutine(true)}
            onDelete={(id) => deleteRoutine(id).then(reload)}
          />
        ) : null}
      </ScrollView>

      {tab === 'wardrobe' ? (
        <>
          <FAB
            icon="plus"
            style={[styles.fabLeft, { backgroundColor: theme.colors.surface }]}
            color={ink}
            onPress={() => {
              setPendingPhoto(null);
              setShowAddCloth(true);
            }}
          />
          <FAB
            icon="camera"
            style={[styles.fabRight, { backgroundColor: palette.vermillion }]}
            color="#fff"
            onPress={openCameraUpload}
          />
        </>
      ) : (
        <FAB
          icon="plus"
          style={[styles.fabRight, { backgroundColor: palette.vermillion }]}
          color="#fff"
          onPress={() => setShowAddRoutine(true)}
        />
      )}

      <Portal>
        <AddClothModal
          visible={showAddCloth}
          category={addCategory}
          photoUri={pendingPhoto}
          onDismiss={() => {
            setShowAddCloth(false);
            setPendingPhoto(null);
          }}
          onSaved={async () => {
            setShowAddCloth(false);
            setPendingPhoto(null);
            await reload();
          }}
        />
        <AddRoutineModal
          visible={showAddRoutine}
          defaultKind={tab === 'schedule' ? 'schedule' : 'skincare'}
          onDismiss={() => setShowAddRoutine(false)}
          onSaved={async () => {
            setShowAddRoutine(false);
            await reload();
          }}
        />
      </Portal>
    </View>
  );
}

function RoutineList({
  title,
  items,
  onAdd,
  onDelete,
}: {
  title: string;
  kind: string;
  items: GroomingRoutine[];
  onAdd: () => void;
  onDelete: (id: number) => void;
}) {
  const theme = useTheme();
  const ink = theme.dark ? palette.orchidWhite : palette.warmBlack;
  const muted = theme.dark ? palette.chromeWhite : palette.masala;

  return (
    <View>
      <View style={styles.headerRow}>
        <Text style={[styles.hero, { color: ink, fontSize: 28 }]}>{title}</Text>
        <Button mode="contained" compact buttonColor={palette.vermillion} textColor="#fff" onPress={onAdd}>
          Add
        </Button>
      </View>
      {items.length === 0 ? (
        <EmptyState icon="calendar-clock" title="Nothing scheduled" message="Add skincare steps or time blocks." />
      ) : (
        <View style={{ gap: 8, marginTop: 12 }}>
          {items.map((r) => (
            <GlassCard key={r.id} contentStyle={styles.routineRow}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: ink, fontWeight: '700' }}>{r.title}</Text>
                <Text style={{ color: muted, fontSize: 12, marginTop: 2 }}>
                  {[r.timeOfDay, r.scheduleDays].filter(Boolean).join(' · ') || r.kind}
                </Text>
                {r.notes ? (
                  <Text style={{ color: muted, fontSize: 12, marginTop: 4 }}>{r.notes}</Text>
                ) : null}
              </View>
              <MaterialCommunityIcons name="delete-outline" size={20} color={muted} onPress={() => onDelete(r.id)} />
            </GlassCard>
          ))}
        </View>
      )}
    </View>
  );
}

function AddClothModal({
  visible,
  category,
  photoUri,
  onDismiss,
  onSaved,
}: {
  visible: boolean;
  category: WardrobeCategory;
  photoUri: string | null;
  onDismiss: () => void;
  onSaved: () => void;
}) {
  const theme = useTheme();
  const [cat, setCat] = useState<WardrobeCategory>(category);
  const [name, setName] = useState('');
  const [color, setColor] = useState('');
  const [brand, setBrand] = useState('');
  const [photo, setPhoto] = useState<string | null>(photoUri);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setCat(category);
    setPhoto(photoUri);
    setName('');
    setColor('');
    setBrand('');
    setError('');
  }, [visible, category, photoUri]);

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.7, mediaTypes: ['images'] });
    if (!result.canceled && result.assets[0]) setPhoto(result.assets[0].uri);
  };

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      setError('Camera permission needed');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!result.canceled && result.assets[0]) setPhoto(result.assets[0].uri);
  };

  const save = async () => {
    if (!name.trim()) {
      setError('Name this piece');
      return;
    }
    if (!photo) {
      setError('Add a photo of the clothing');
      return;
    }
    setBusy(true);
    await addWardrobeItem({
      category: cat,
      name: name.trim(),
      photoUri: photo,
      color: color || null,
      brand: brand || null,
    });
    setBusy(false);
    onSaved();
  };

  return (
    <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}>
      <Text style={{ fontWeight: '800', fontSize: 18 }}>Add to wardrobe</Text>
      <View style={styles.chips}>
        {CATEGORIES.map((c) => (
          <Chip key={c.key} selected={cat === c.key} onPress={() => setCat(c.key)} showSelectedCheck={false}>
            {c.label}
          </Chip>
        ))}
      </View>
      <Pressable onPress={pickPhoto} style={[styles.photoPreview, { borderColor: palette.chromeWhite }]}>
        {photo ? (
          <Image source={{ uri: photo }} style={styles.previewImg} />
        ) : (
          <View style={styles.previewEmpty}>
            <MaterialCommunityIcons name="camera-outline" size={36} color={palette.masala} />
            <Text style={{ color: palette.masala, marginTop: 8 }}>Tap to upload dress photo</Text>
          </View>
        )}
      </Pressable>
      <View style={styles.photoActions}>
        <Button mode="outlined" icon="image" onPress={pickPhoto}>
          Gallery
        </Button>
        <Button mode="outlined" icon="camera" onPress={takePhoto}>
          Camera
        </Button>
      </View>
      <TextInput mode="outlined" label="Name (e.g. White tee)" value={name} onChangeText={setName} style={{ marginTop: 10 }} />
      <TextInput mode="outlined" label="Color" value={color} onChangeText={setColor} style={{ marginTop: 8 }} />
      <TextInput mode="outlined" label="Brand" value={brand} onChangeText={setBrand} style={{ marginTop: 8 }} />
      <HelperText type="error" visible={!!error}>
        {error}
      </HelperText>
      <View style={styles.modalActions}>
        <Button onPress={onDismiss}>Cancel</Button>
        <Button mode="contained" buttonColor={palette.vermillion} textColor="#fff" loading={busy} onPress={save}>
          Save piece
        </Button>
      </View>
    </Modal>
  );
}

function AddRoutineModal({
  visible,
  defaultKind,
  onDismiss,
  onSaved,
}: {
  visible: boolean;
  defaultKind: GroomingRoutine['kind'];
  onDismiss: () => void;
  onSaved: () => void;
}) {
  const theme = useTheme();
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState<GroomingRoutine['kind']>(defaultKind);
  const [timeOfDay, setTimeOfDay] = useState('');
  const [scheduleDays, setScheduleDays] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!visible) return;
    setKind(defaultKind);
    setTitle('');
    setTimeOfDay('');
    setScheduleDays('');
    setNotes('');
    setError('');
  }, [visible, defaultKind]);

  const save = async () => {
    if (!title.trim()) {
      setError('Enter a title');
      return;
    }
    setBusy(true);
    await addRoutine({
      title,
      kind,
      timeOfDay: timeOfDay || null,
      scheduleDays: scheduleDays || null,
      notes: notes || null,
    });
    setBusy(false);
    onSaved();
  };

  return (
    <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}>
      <Text style={{ fontWeight: '800', fontSize: 18 }}>Add routine</Text>
      <View style={styles.chips}>
        {(['skincare', 'grooming', 'schedule'] as const).map((k) => (
          <Chip key={k} selected={kind === k} onPress={() => setKind(k)} showSelectedCheck={false}>
            {k}
          </Chip>
        ))}
      </View>
      <TextInput mode="outlined" label="Title" value={title} onChangeText={setTitle} style={{ marginTop: 8 }} />
      <TextInput mode="outlined" label="Time (e.g. 07:30 AM)" value={timeOfDay} onChangeText={setTimeOfDay} style={{ marginTop: 8 }} />
      <TextInput mode="outlined" label="Days (e.g. Daily / Mon-Fri)" value={scheduleDays} onChangeText={setScheduleDays} style={{ marginTop: 8 }} />
      <TextInput mode="outlined" label="Notes" value={notes} onChangeText={setNotes} multiline style={{ marginTop: 8 }} />
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
  root: { flex: 1 },
  pad: { padding: 16, paddingBottom: 140 },
  segments: { marginBottom: 14 },
  hero: { fontSize: 34, fontWeight: '800', letterSpacing: -0.8 },
  sub: { fontSize: 13, marginTop: 4, marginBottom: 16, lineHeight: 18 },
  categoryBlock: { marginBottom: 18 },
  catHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  catLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  emptySlot: {
    height: 120,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rail: { gap: 12, paddingVertical: 4 },
  clothCard: {
    width: 110,
    borderRadius: radii.md,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,252,242,0.7)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  clothImg: { width: 110, height: 130, backgroundColor: '#F0EBE3' },
  clothFallback: { alignItems: 'center', justifyContent: 'center' },
  clothName: { fontSize: 12, fontWeight: '600', padding: 8 },
  selectedRing: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: palette.vermillion,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCard: {
    borderStyle: 'dashed',
    borderWidth: 1,
    height: 162,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  routineRow: { flexDirection: 'row', alignItems: 'center' },
  fabLeft: {
    position: 'absolute',
    left: 20,
    bottom: 96,
    borderRadius: 28,
  },
  fabRight: {
    position: 'absolute',
    right: 20,
    bottom: 96,
    borderRadius: 28,
  },
  modal: { margin: 20, borderRadius: radii.xl, padding: 18, maxHeight: '90%' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  photoPreview: {
    marginTop: 12,
    height: 180,
    borderRadius: radii.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  previewImg: { width: '100%', height: '100%' },
  previewEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  photoActions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 12 },
});
