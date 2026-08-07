import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Button, HelperText, Text, TextInput, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore, MIN_PASSWORD_LENGTH } from '@/stores/auth';

export default function WelcomeScreen() {
  const theme = useTheme();
  const setup = useAuthStore((s) => s.setup);
  const error = useAuthStore((s) => s.error);
  const clearError = useAuthStore((s) => s.clearError);

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);

  const mismatch = confirm.length > 0 && confirm !== password;

  const onSubmit = async () => {
    clearError();
    if (password !== confirm) return;
    setBusy(true);
    await setup(password);
    setBusy(false);
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.logoWrap}>
            <View style={[styles.logo, { backgroundColor: theme.colors.primary }]}>
              <MaterialCommunityIcons name="heart-pulse" size={40} color={theme.colors.onPrimary} />
            </View>
            <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.onSurface }]}>
              lif.os
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              Your private health tracker. Data stays on this device.
            </Text>
          </View>

          <View style={styles.form}>
            <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
              Create a passcode
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Your passcode encrypts all medical data with AES-256. It is never stored or sent
              anywhere. If you forget it, the encrypted data cannot be recovered.
            </Text>

            <TextInput
              label="Passcode"
              mode="outlined"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              right={
                <TextInput.Icon
                  icon={showPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowPassword((v) => !v)}
                />
              }
              style={styles.input}
            />
            <TextInput
              label="Confirm passcode"
              mode="outlined"
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              style={styles.input}
            />
            <HelperText type="error" visible={!!mismatch}>
              Passcodes do not match.
            </HelperText>
            <HelperText type="error" visible={!!error && !mismatch}>
              {error}
            </HelperText>
            <HelperText type="info" visible={!error && !mismatch}>
              Minimum {MIN_PASSWORD_LENGTH} characters.
            </HelperText>

            <Button
              mode="contained"
              onPress={onSubmit}
              loading={busy}
              disabled={busy || password.length < MIN_PASSWORD_LENGTH || mismatch}
              style={styles.button}>
              Get started
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  content: { padding: 24, flexGrow: 1, justifyContent: 'center' },
  logoWrap: { alignItems: 'center', marginBottom: 32 },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: { fontWeight: '800', letterSpacing: 1 },
  subtitle: { textAlign: 'center', marginTop: 6, opacity: 0.8 },
  form: { gap: 4 },
  input: { marginTop: 12 },
  button: { marginTop: 16, borderRadius: 12, paddingVertical: 4 },
});
