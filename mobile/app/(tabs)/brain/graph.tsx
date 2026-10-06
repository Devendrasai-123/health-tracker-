import { useCallback, useMemo, useState } from 'react';
import { Dimensions, Pressable, StyleSheet, View } from 'react-native';
import { Button, HelperText, Modal, Portal, Text, TextInput, useTheme } from 'react-native-paper';
import { useFocusEffect } from 'expo-router';
import Svg, { Circle, Line, Text as SvgText } from 'react-native-svg';

import { GlassCard } from '@/components/GlassCard';
import {
  addKnowledgeNode,
  deleteKnowledgeNode,
  listKnowledgeNodes,
  setNodeLearned,
} from '@/services/knowledge-service';
import { palette, radii } from '@/constants/theme';
import type { KnowledgeNode } from '@/types';

const COLORS = ['#EB5E28', '#4EA8DE', '#E85D75', '#F4A261', '#2A9D8F', '#9B5DE5'];
const { width: SCREEN_W } = Dimensions.get('window');
const GRAPH_H = 420;

function layoutNodes(nodes: KnowledgeNode[], selectedId: number | null) {
  const roots = nodes.filter((n) => n.parentId == null);
  const cx = SCREEN_W / 2 - 16;
  const cy = GRAPH_H / 2;
  const positions = new Map<number, { x: number; y: number; r: number }>();

  roots.forEach((root, i) => {
    const angle = (i / Math.max(roots.length, 1)) * Math.PI * 2 - Math.PI / 2;
    const radius = roots.length === 1 ? 0 : 90;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    positions.set(root.id, { x, y, r: root.learned ? 28 : 34 });

    const children = nodes.filter((n) => n.parentId === root.id);
    const showChildren = selectedId === root.id || selectedId == null;
    if (!showChildren && selectedId !== root.id) return;

    children.forEach((child, ci) => {
      const cAngle = angle - 0.6 + (ci / Math.max(children.length - 1, 1)) * 1.2;
      const cRadius = 130;
      positions.set(child.id, {
        x: x + Math.cos(cAngle) * (children.length === 1 ? 110 : cRadius * 0.55 + 40),
        y: y + Math.sin(cAngle) * (children.length === 1 ? 110 : cRadius * 0.55 + 40),
        r: child.learned ? 16 : 20,
      });
    });
  });

  // If a niche is selected, only show that cluster centered
  if (selectedId != null) {
    const selected = nodes.find((n) => n.id === selectedId);
    if (selected && selected.parentId == null) {
      positions.clear();
      positions.set(selected.id, { x: cx, y: cy, r: 36 });
      const children = nodes.filter((n) => n.parentId === selected.id);
      children.forEach((child, ci) => {
        const a = (ci / Math.max(children.length, 1)) * Math.PI * 2 - Math.PI / 2;
        positions.set(child.id, {
          x: cx + Math.cos(a) * 120,
          y: cy + Math.sin(a) * 120,
          r: child.learned ? 18 : 22,
        });
      });
    }
  }

  return positions;
}

export default function KnowledgeGraphScreen() {
  const theme = useTheme();
  const [nodes, setNodes] = useState<KnowledgeNode[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState('');
  const [asChild, setAsChild] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    setNodes(await listKnowledgeNodes());
  }, []);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  const positions = useMemo(() => layoutNodes(nodes, selectedId), [nodes, selectedId]);
  const roots = nodes.filter((n) => n.parentId == null);
  const selected = nodes.find((n) => n.id === selectedId) ?? null;
  const children = selected ? nodes.filter((n) => n.parentId === selected.id) : [];

  const edges: { x1: number; y1: number; x2: number; y2: number; color: string }[] = [];
  for (const n of nodes) {
    if (n.parentId == null) continue;
    const a = positions.get(n.parentId);
    const b = positions.get(n.id);
    if (!a || !b) continue;
    if (selectedId != null && n.parentId !== selectedId && n.id !== selectedId) continue;
    edges.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y, color: n.color });
  }

  const add = async () => {
    if (!title.trim()) {
      setError('Enter a topic name');
      return;
    }
    setBusy(true);
    await addKnowledgeNode({
      title,
      parentId: asChild && selected && selected.parentId == null ? selected.id : null,
      color: COLORS[roots.length % COLORS.length],
    });
    setTitle('');
    setShowAdd(false);
    setBusy(false);
    await reload();
  };

  return (
    <View style={[styles.root, { backgroundColor: '#141210' }]}>
      <Text style={styles.hint}>
        Tap a niche to open its subtopics, then toggle learned from the panel.
      </Text>

      <View style={styles.graphWrap}>
        <Svg width={SCREEN_W - 32} height={GRAPH_H}>
          {edges.map((e, i) => (
            <Line
              key={i}
              x1={e.x1}
              y1={e.y1}
              x2={e.x2}
              y2={e.y2}
              stroke={e.color}
              strokeOpacity={0.45}
              strokeWidth={1.5}
            />
          ))}
          {nodes.map((n) => {
            const p = positions.get(n.id);
            if (!p) return null;
            if (selectedId != null && n.parentId != null && n.parentId !== selectedId) return null;
            if (selectedId != null && n.parentId == null && n.id !== selectedId) return null;
            return (
              <Circle
                key={`c-${n.id}`}
                cx={p.x}
                cy={p.y}
                r={p.r}
                fill={n.learned ? n.color : 'transparent'}
                stroke={n.color}
                strokeWidth={2.5}
                opacity={0.95}
              />
            );
          })}
          {nodes.map((n) => {
            const p = positions.get(n.id);
            if (!p) return null;
            if (selectedId != null && n.parentId != null && n.parentId !== selectedId) return null;
            if (selectedId != null && n.parentId == null && n.id !== selectedId) return null;
            return (
              <SvgText
                key={`t-${n.id}`}
                x={p.x}
                y={p.y + p.r + 14}
                fill="#FFFCF2"
                fontSize={11}
                fontWeight="600"
                textAnchor="middle">
                {n.title.length > 14 ? `${n.title.slice(0, 14)}…` : n.title}
              </SvgText>
            );
          })}
        </Svg>

        {/* Invisible press targets over SVG circles for better touch */}
        {nodes.map((n) => {
          const p = positions.get(n.id);
          if (!p) return null;
          if (selectedId != null && n.parentId != null && n.parentId !== selectedId) return null;
          if (selectedId != null && n.parentId == null && n.id !== selectedId) return null;
          return (
            <Pressable
              key={`hit-${n.id}`}
              onPress={() => {
                if (n.parentId == null) setSelectedId((id) => (id === n.id ? null : n.id));
              }}
              onLongPress={async () => {
                await setNodeLearned(n.id, !n.learned);
                await reload();
              }}
              style={{
                position: 'absolute',
                left: p.x - p.r,
                top: p.y - p.r,
                width: p.r * 2,
                height: p.r * 2,
                borderRadius: p.r,
              }}
            />
          );
        })}
      </View>

      <GlassCard contentStyle={styles.panel}>
        {selected && selected.parentId == null ? (
          <>
            <Text style={styles.panelTitle}>{selected.title}</Text>
            <Text style={styles.panelSub}>
              {children.length} subtopic{children.length === 1 ? '' : 's'} ·{' '}
              {children.filter((c) => c.learned).length} learned
            </Text>
            <View style={styles.row}>
              <Button
                mode="contained"
                buttonColor={palette.vermillion}
                textColor="#fff"
                compact
                onPress={() => {
                  setAsChild(true);
                  setShowAdd(true);
                }}>
                Add subtopic
              </Button>
              <Button
                mode={selected.learned ? 'contained-tonal' : 'outlined'}
                icon={selected.learned ? 'check-circle' : 'circle-outline'}
                textColor={selected.learned ? undefined : palette.masala}
                compact
                onPress={async () => {
                  await setNodeLearned(selected.id, !selected.learned);
                  await reload();
                }}>
                {selected.learned ? 'Learned' : 'Mark learned'}
              </Button>
              <Button
                mode="text"
                textColor="#C62828"
                compact
                onPress={async () => {
                  await deleteKnowledgeNode(selected.id);
                  setSelectedId(null);
                  await reload();
                }}>
                Delete niche
              </Button>
            </View>
            {children.map((c) => (
              <Pressable
                key={c.id}
                style={styles.childRow}
                onPress={async () => {
                  await setNodeLearned(c.id, !c.learned);
                  await reload();
                }}
                onLongPress={async () => {
                  await setNodeLearned(c.id, !c.learned);
                  await reload();
                }}>
                <View style={[styles.dot, { backgroundColor: c.learned ? c.color : 'transparent', borderColor: c.color }]} />
                <Text style={styles.childText}>{c.title}</Text>
                <Text style={styles.childMeta}>{c.learned ? 'learned' : 'learning'}</Text>
              </Pressable>
            ))}
          </>
        ) : (
          <>
            <Text style={styles.panelTitle}>Your niches</Text>
            <Text style={styles.panelSub}>
              {roots.length === 0
                ? 'Add a main topic — subtopics will orbit around it.'
                : 'Tap a node to expand its subtopics.'}
            </Text>
            <Button
              mode="contained"
              buttonColor={palette.vermillion}
              textColor="#fff"
              onPress={() => {
                setAsChild(false);
                setShowAdd(true);
              }}
              style={{ marginTop: 8, borderRadius: radii.pill }}>
              Add niche
            </Button>
          </>
        )}
      </GlassCard>

      <Portal>
        <Modal
          visible={showAdd}
          onDismiss={() => setShowAdd(false)}
          contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}>
          <Text style={{ fontWeight: '800', fontSize: 18 }}>
            {asChild ? 'Add subtopic' : 'Add niche'}
          </Text>
          <TextInput
            mode="outlined"
            label={asChild ? 'Subtopic name' : 'Niche / topic'}
            value={title}
            onChangeText={setTitle}
            style={{ marginTop: 10 }}
          />
          <HelperText type="error" visible={!!error}>
            {error}
          </HelperText>
          <View style={styles.row}>
            <Button onPress={() => setShowAdd(false)}>Cancel</Button>
            <Button mode="contained" buttonColor={palette.vermillion} textColor="#fff" loading={busy} onPress={add}>
              Save
            </Button>
          </View>
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: 16, paddingBottom: 40 },
  hint: { color: '#CCC5B9', fontSize: 12, marginBottom: 8 },
  graphWrap: {
    height: GRAPH_H,
    borderRadius: radii.xl,
    overflow: 'hidden',
    backgroundColor: '#1C1A18',
    borderWidth: 1,
    borderColor: 'rgba(204,197,185,0.2)',
  },
  panel: { marginTop: 14, backgroundColor: 'rgba(255,252,242,0.92)' },
  panelTitle: { fontSize: 18, fontWeight: '800', color: palette.warmBlack },
  panelSub: { fontSize: 12, color: palette.masala, marginTop: 4, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  childRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  dot: { width: 12, height: 12, borderRadius: 6, borderWidth: 2, marginRight: 8 },
  childText: { flex: 1, color: palette.warmBlack, fontWeight: '600' },
  childMeta: { color: palette.masala, fontSize: 11 },
  modal: { margin: 24, borderRadius: radii.xl, padding: 18 },
});
