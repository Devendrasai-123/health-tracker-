import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import {
  Button,
  Card,
  HelperText,
  List,
  Modal,
  Portal,
  SegmentedButtons,
  Text,
  TextInput,
  useTheme,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Constants from 'expo-constants';

import { Screen } from '@/components/Screen';
import { useAuthStore } from '@/stores/auth';
import { useSettingsStore } from '@/stores/settings';
import { shareExport } from '@/services/export';

export default function SettingsScreen() {
  const theme = useTheme();
  const themePref = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const lock = useAuthStore((s) => s.lock);
  const resetAll = useAuthStore((s) => s.resetAll);

  const [showChangePassword, setShowChangePassword] = useState(false);
  const [exporting, setExporting] = useState(false);

  const version = Constants.expoConfig?.version ?? '0.1.0';

  const doExport = async () => {
    setExporting(true);
    try {
      await shareExport();
    } catch (e) {
      Alert.alert('Export failed', e instanceof Error ? e.message : 'Could not export data.');
    } finally {
      setExporting(false);
    }
  };

  const confirmReset = () => {
    Alert.alert(
      'Reset all data?',
      'This permanently deletes all local data and the passcode. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete everything', style: 'destructive', onPress: () => resetAll() },
      ],
    );
  };

  return (
    <Screen title="Settings">
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Title
          title="Appearance"
          titleVariant="titleMedium"
          left={(props) => <MaterialCommunityIcons {...props} name="palette-outline" size={22} color={theme.colors.primary} />}
        />
        <Card.Content>
          <SegmentedButtons
            value={themePref}
            onValueChange={(v) => setTheme(v as 'light' | 'dark' | 'system')}
            buttons={[
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
              { value: 'system', label: 'System' },
            ]}
          />
        </Card.Content>
      </Card>

      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Title
          title="Security"
          titleVariant="titleMedium"
          left={(props) => <MaterialCommunityIcons {...props} name="shield-lock-outline" size={22} color={theme.colors.primary} />}
        />
        <Card.Content>
          <List.Item
            title="Lock app now"
            description="Require passcode to view your data"
            left={() => <List.Icon icon="lock-outline" />}
            onPress={() => lock()}
          />
          <List.Item
            title="Change passcode"
            description="Re-encrypts all medical data with a new key"
            left={() => <List.Icon icon="form-textbox-password" />}
            onPress={() => setShowChangePassword(true)}
          />
        </Card.Content>
      </Card>

      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Title
          title="Data"
          titleVariant="titleMedium"
          left={(props) => <MaterialCommunityIcons {...props} name="database-outline" size={22} color={theme.colors.primary} />}
        />
        <Card.Content>
          <List.Item
            title="Export data (JSON)"
            description="All records, decrypted into a shareable file"
            left={() => <List.Icon icon="export-variant" />}
            onPress={doExport}
            disabled={exporting}
          />
          <List.Item
            title="Delete all data"
            description="Erase everything on this device"
            titleStyle={{ color: theme.colors.error }}
            left={() => <List.Icon icon="delete-forever-outline" color={theme.colors.error} />}
            onPress={confirmReset}
          />
        </Card.Content>
      </Card>

      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
            About
          </Text>
          <View style={styles.aboutRow}>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              lif.os · version {version}
            </Text>
          </View>
          <Text variant="bodySmall" style={[styles.aboutNote, { color: theme.colors.onSurfaceVariant }]}>
            All data is stored locally on this device. Blood test values and medical notes are
            encrypted with AES-256 and can only be read after you enter your passcode. Nothing is
            sent to the cloud.
          </Text>
        </Card.Content>
      </Card>

      <Portal>
        <ChangePasswordModal
          visible={showChangePassword}
          onDismiss={() => setShowChangePassword(false)}
        />
      </Portal>
    </Screen>
  );
}

function ChangePasswordModal({ visible, onDismiss }: { visible: boolean; onDismiss: () => void }) {
  const theme = useTheme();
  const changePassword = useAuthStore((s) => s.changePassword);
  const error = useAuthStore((s) => s.error);
  const clearError = useAuthStore((s) => s.clearError);

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);

  const mismatch = confirm.length > 0 && confirm !== next;

  const save = async () => {
    if (mismatch) return;
    setBusy(true);
    const ok = await changePassword(current, next);
    setBusy(false);
    if (ok) {
      onDismiss();
      setCurrent('');
      setNext('');
      setConfirm('');
      Alert.alert('Passcode changed', 'All encrypted data was re-encrypted with the new key.');
    }
  };

  return (
    <Modal
      visible={visible}
      onDismiss={onDismiss}
      contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}>
      <Text variant="titleLarge" style={{ color: theme.colors.onSurface, fontWeight: '700' }}>
        Change passcode
      </Text>
      <Text variant="bodySmall" style={[styles.modalHint, { color: theme.colors.onSurfaceVariant }]}>
        Your medical data will be re-encrypted with the new key. This happens locally.
      </Text>
      <TextInput
        mode="outlined"
        label="Current passcode"
        value={current}
        onChangeText={(v) => {
          setCurrent(v);
          clearError();
        }}
        secureTextEntry
        style={styles.field}
      />
      <TextInput
        mode="outlined"
        label="New passcode"
        value={next}
        onChangeText={setNext}
        secureTextEntry
        style={styles.field}
      />
      <TextInput
        mode="outlined"
        label="Confirm new passcode"
        value={confirm}
        onChangeText={setConfirm}
        secureTextEntry
        style={styles.field}
      />
      <HelperText type="error" visible={!!mismatch}>
        Passcodes do not match.
      </HelperText>
      <HelperText type="error" visible={!!error && !mismatch}>
        {error}
      </HelperText>
      <View style={styles.modalActions}>
        <Button mode="text" onPress={onDismiss}>
          Cancel
        </Button>
        <Button mode="contained" onPress={save} loading={busy} disabled={busy || !current || !next || mismatch}>
          Update
        </Button>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: 12, borderRadius: 16, elevation: 1 },
  aboutRow: { marginTop: 6 },
  aboutNote: { marginTop: 6, lineHeight: 18 },
  modal: { margin: 24, borderRadius: 18, padding: 20 },
  modalHint: { marginTop: 4, marginBottom: 8 },
  field: { marginTop: 10 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16, gap: 8 },
});
