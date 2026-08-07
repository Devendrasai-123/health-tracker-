import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Button, HelperText, Text, TextInput, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/stores/auth';

export default function UnlockScreen() {
  const theme = useTheme();
  const unlock = useAuthStore((s) => s.unlock);
  const error = useAuthStore((s) => s.error);
  const clearError = useAuthStore((s) => s.clearError);

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);

  const onSubmit = async () => {
    if (!password) return;
    setBusy(true);
    await unlock(password);
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
              <MaterialCommunityIcons name="lock-outline" size={40} color={theme.colors.onPrimary} />
            </View>
            <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.onSurface }]}>
              lif.os
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              Unlock to access your health data
            </Text>
          </View>

          <View style={styles.form}>
            <TextInput
              label="Passcode"
              mode="outlined"
              value={password}
              onChangeText={(v) => {
                setPassword(v);
                clearError();
              }}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoFocus
              right={
                <TextInput.Icon
                  icon={showPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowPassword((v) => !v)}
                />
              }
              style={styles.input}
              onSubmitEditing={onSubmit}
            />
            <HelperText type="error" visible={!!error}>
              {error}
            </HelperText>
            <Button
              mode="contained"
              onPress={onSubmit}
              loading={busy}
              disabled={busy || !password}
              style={styles.button}>
              Unlock
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
  form: {},
  input: { marginTop: 12 },
  button: { marginTop: 16, borderRadius: 12, paddingVertical: 4 },
});
