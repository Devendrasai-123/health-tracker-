import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
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
import { NumberField } from '@/components/NumberField';
import {
  addInvestment,
  deleteInvestment,
  listInvestments,
  summarizePortfolio,
} from '@/services/finance-service';
import { palette, radii } from '@/constants/theme';
import type { Investment } from '@/types';

export default function InvestmentsScreen() {
  const theme = useTheme();
  const [kind, setKind] = useState<'all' | 'stock' | 'crypto'>('all');
  const [items, setItems] = useState<Investment[]>([]);
  const [showAdd, setShowAdd] = useState(false);

  const reload = useCallback(async () => {
    setItems(await listInvestments(kind === 'all' ? undefined : kind));
  }, [kind]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  const summary = useMemo(() => summarizePortfolio(items), [items]);
  const ink = theme.dark ? palette.orchidWhite : palette.warmBlack;
  const muted = theme.dark ? palette.chromeWhite : palette.masala;

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.pad}>
        <GlassCard contentStyle={styles.hero}>
          <Text style={[styles.label, { color: muted }]}>Portfolio value</Text>
          <Text style={[styles.big, { color: ink }]}>₹{summary.value.toFixed(0)}</Text>
          <View style={styles.row}>
            <View>
              <Text style={{ color: muted, fontSize: 12 }}>Invested</Text>
              <Text style={{ color: ink, fontWeight: '700' }}>₹{summary.invested.toFixed(0)}</Text>
            </View>
            <View>
              <Text style={{ color: muted, fontSize: 12 }}>P/L</Text>
              <Text
                style={{
                  fontWeight: '800',
                  color: summary.pnl >= 0 ? '#2E7D32' : palette.vermillion,
                }}>
                {summary.pnl >= 0 ? '+' : ''}₹{summary.pnl.toFixed(0)}
              </Text>
            </View>
          </View>
        </GlassCard>

        <SegmentedButtons
          value={kind}
          onValueChange={(v) => setKind(v as typeof kind)}
          style={{ marginTop: 14 }}
          buttons={[
            { value: 'all', label: 'All' },
            { value: 'stock', label: 'Stocks' },
            { value: 'crypto', label: 'Crypto' },
          ]}
        />

        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: ink }]}>Holdings</Text>
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
          <EmptyState icon="chart-line" title="No holdings" message="Track stocks and crypto manually." />
        ) : (
          <View style={styles.list}>
            {items.map((i) => {
              const cost = i.quantity * i.avgCost;
              const value = i.quantity * (i.currentPrice ?? i.avgCost);
              const pnl = value - cost;
              return (
                <GlassCard key={i.id} contentStyle={styles.item}>
                  <View style={[styles.badge, { backgroundColor: palette.vermillion + '18' }]}>
                    <MaterialCommunityIcons
                      name={i.kind === 'crypto' ? 'bitcoin' : 'chart-timeline-variant'}
                      size={18}
                      color={palette.vermillion}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: ink, fontWeight: '800' }}>
                      {i.symbol}
                      {i.name ? ` · ${i.name}` : ''}
                    </Text>
                    <Text style={{ color: muted, fontSize: 12 }}>
                      {i.quantity} × ₹{(i.currentPrice ?? i.avgCost).toFixed(2)} · avg ₹{i.avgCost.toFixed(2)}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', marginRight: 8 }}>
                    <Text style={{ color: ink, fontWeight: '700' }}>₹{value.toFixed(0)}</Text>
                    <Text style={{ color: pnl >= 0 ? '#2E7D32' : palette.vermillion, fontSize: 12 }}>
                      {pnl >= 0 ? '+' : ''}₹{pnl.toFixed(0)}
                    </Text>
                  </View>
                  <MaterialCommunityIcons
                    name="delete-outline"
                    size={18}
                    color={muted}
                    onPress={() => deleteInvestment(i.id).then(reload)}
                  />
                </GlassCard>
              );
            })}
          </View>
        )}
      </ScrollView>

      <Portal>
        <AddInvestmentModal
          visible={showAdd}
          onDismiss={() => setShowAdd(false)}
          onSaved={() => {
            setShowAdd(false);
            reload();
          }}
        />
      </Portal>
    </View>
  );
}

function AddInvestmentModal({
  visible,
  onDismiss,
  onSaved,
}: {
  visible: boolean;
  onDismiss: () => void;
  onSaved: () => void;
}) {
  const theme = useTheme();
  const [kind, setKind] = useState<'stock' | 'crypto'>('stock');
  const [symbol, setSymbol] = useState('');
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [avgCost, setAvgCost] = useState('');
  const [currentPrice, setCurrentPrice] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!symbol.trim() || !quantity || !avgCost) {
      setError('Symbol, quantity and avg cost required');
      return;
    }
    setBusy(true);
    await addInvestment({
      kind,
      symbol,
      name: name || null,
      quantity: Number(quantity),
      avgCost: Number(avgCost),
      currentPrice: currentPrice ? Number(currentPrice) : Number(avgCost),
    });
    setBusy(false);
    setSymbol('');
    setName('');
    setQuantity('');
    setAvgCost('');
    setCurrentPrice('');
    onSaved();
  };

  return (
    <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}>
      <Text style={{ fontWeight: '800', fontSize: 18 }}>Add holding</Text>
      <View style={styles.chips}>
        <Chip selected={kind === 'stock'} onPress={() => setKind('stock')} showSelectedCheck={false}>
          Stock
        </Chip>
        <Chip selected={kind === 'crypto'} onPress={() => setKind('crypto')} showSelectedCheck={false}>
          Crypto
        </Chip>
      </View>
      <TextInput mode="outlined" label="Symbol (AAPL / BTC)" value={symbol} onChangeText={setSymbol} autoCapitalize="characters" style={{ marginTop: 8 }} />
      <TextInput mode="outlined" label="Name (optional)" value={name} onChangeText={setName} style={{ marginTop: 8 }} />
      <NumberField label="Quantity" value={quantity} onChange={setQuantity} decimal />
      <NumberField label="Avg cost (₹)" value={avgCost} onChange={setAvgCost} decimal />
      <NumberField label="Current price (₹)" value={currentPrice} onChange={setCurrentPrice} decimal />
      <HelperText type="error" visible={!!error}>{error}</HelperText>
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
  hero: { paddingVertical: 16 },
  label: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  big: { fontSize: 36, fontWeight: '800', letterSpacing: -1, marginTop: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, marginBottom: 10 },
  title: { fontSize: 18, fontWeight: '800' },
  list: { gap: 8 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  modal: { margin: 20, borderRadius: radii.xl, padding: 18 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 8 },
});
