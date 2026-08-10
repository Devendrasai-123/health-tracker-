import { useCallback, useState } from 'react';
import { Linking, ScrollView, StyleSheet, View } from 'react-native';
import {
  Button,
  Chip,
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

import { GlassCard } from '@/components/GlassCard';
import { EmptyState } from '@/components/EmptyState';
import { addMedia, deleteMedia, listMedia, setMediaStatus } from '@/services/media-service';
import { palette, radii } from '@/constants/theme';
import type { LearningMedia } from '@/types';

type Kind = LearningMedia['kind'];

export default function MediaScreen() {
  const theme = useTheme();
  const [kind, setKind] = useState<Kind | 'all'>('all');
  const [items, setItems] = useState<LearningMedia[]>([]);
  const [showAdd, setShowAdd] = useState(false);

  const reload = useCallback(async () => {
    setItems(await listMedia(kind === 'all' ? undefined : kind));
  }, [kind]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  const ink = theme.dark ? palette.orchidWhite : palette.warmBlack;
  const muted = theme.dark ? palette.chromeWhite : palette.masala;

  const iconFor = (k: Kind) =>
    k === 'book' ? 'book-open-page-variant' : k === 'video' ? 'youtube' : 'podcast';

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.pad}>
        <SegmentedButtons
          value={kind}
          onValueChange={(v) => setKind(v as Kind | 'all')}
          buttons={[
            { value: 'all', label: 'All' },
            { value: 'book', label: 'Books' },
            { value: 'video', label: 'Videos' },
            { value: 'podcast', label: 'Podcasts' },
          ]}
        />
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: ink }]}>Watch & read list</Text>
          <Button
            mode="contained"
            compact
            buttonColor={palette.vermillion}
            textColor="#fff"
            style={{ borderRadius: radii.pill }}
            onPress={() => setShowAdd(true)}>
            Add
          </Button>
        </View>

        {items.length === 0 ? (
          <EmptyState icon="bookshelf" title="Empty list" message="Add books, videos, or podcasts to learn from." />
        ) : (
          <View style={styles.list}>
            {items.map((item) => (
              <GlassCard key={item.id} contentStyle={styles.item}>
                <View style={[styles.icon, { backgroundColor: palette.vermillion + '18' }]}>
                  <MaterialCommunityIcons name={iconFor(item.kind)} size={20} color={palette.vermillion} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: ink, fontWeight: '700' }}>{item.title}</Text>
                  <Text style={{ color: muted, fontSize: 12 }}>
                    {item.kind}
                    {item.creator ? ` · ${item.creator}` : ''} · {item.status}
                  </Text>
                  {item.url ? (
                    <Text
                      style={{ color: palette.vermillion, fontSize: 12, marginTop: 4 }}
                      onPress={() => Linking.openURL(item.url!)}>
                      Open link
                    </Text>
                  ) : null}
                </View>
                <View style={{ gap: 4 }}>
                  <Chip
                    compact
                    onPress={() =>
                      setMediaStatus(
                        item.id,
                        item.status === 'done' ? 'todo' : item.status === 'todo' ? 'in_progress' : 'done',
                      ).then(reload)
                    }>
                    {item.status === 'done' ? '✓' : '→'}
                  </Chip>
                  <MaterialCommunityIcons
                    name="delete-outline"
                    size={18}
                    color={muted}
                    onPress={() => deleteMedia(item.id).then(reload)}
                  />
                </View>
              </GlassCard>
            ))}
          </View>
        )}
      </ScrollView>

      <Portal>
        <AddMediaModal visible={showAdd} onDismiss={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); reload(); }} />
      </Portal>
    </View>
  );
}

function AddMediaModal({
  visible,
  onDismiss,
  onSaved,
}: {
  visible: boolean;
  onDismiss: () => void;
  onSaved: () => void;
}) {
  const theme = useTheme();
  const [kind, setKind] = useState<Kind>('book');
  const [title, setTitle] = useState('');
  const [creator, setCreator] = useState('');
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!title.trim()) {
      setError('Enter a title');
      return;
    }
    setBusy(true);
    await addMedia({ kind, title, creator: creator || null, url: url || null });
    setBusy(false);
    setTitle('');
    setCreator('');
    setUrl('');
    onSaved();
  };

  return (
    <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}>
      <Text style={{ fontWeight: '800', fontSize: 18 }}>Add media</Text>
      <View style={styles.chips}>
        {(['book', 'video', 'podcast'] as const).map((k) => (
          <Chip key={k} selected={kind === k} onPress={() => setKind(k)} showSelectedCheck={false}>
            {k}
          </Chip>
        ))}
      </View>
      <TextInput mode="outlined" label="Title" value={title} onChangeText={setTitle} style={{ marginTop: 8 }} />
      <TextInput mode="outlined" label="Author / channel" value={creator} onChangeText={setCreator} style={{ marginTop: 8 }} />
      <TextInput mode="outlined" label="URL (optional)" value={url} onChangeText={setUrl} style={{ marginTop: 8 }} />
      <HelperText type="error" visible={!!error}>
        {error}
      </HelperText>
      <View style={styles.actions}>
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
  pad: { padding: 16, paddingBottom: 120 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, marginBottom: 10 },
  title: { fontSize: 18, fontWeight: '800' },
  list: { gap: 8 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  icon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  modal: { margin: 20, borderRadius: radii.xl, padding: 18 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 8 },
});
