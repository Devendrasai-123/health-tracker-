import { useEffect } from 'react';
import { StyleSheet, useColorScheme, View } from 'react-native';
import { ActivityIndicator, PaperProvider } from 'react-native-paper';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { getTheme } from '@/constants/theme';
import { useAuthStore } from '@/stores/auth';
import { useSettingsStore } from '@/stores/settings';
import { getDb } from '@/services/database';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const systemScheme = useColorScheme();
  const bootstrapped = useAuthStore((s) => s.bootstrapped);
  const authInit = useAuthStore((s) => s.init);
  const themePref = useSettingsStore((s) => s.theme);
  const settingsLoaded = useSettingsStore((s) => s.loaded);
  const loadSettings = useSettingsStore((s) => s.load);

  useEffect(() => {
    authInit();
    loadSettings();
    getDb().catch((e) => console.error('DB init failed:', e));
  }, [authInit, loadSettings]);

  const effectiveMode =
    themePref === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : themePref;
  const paperTheme = getTheme(effectiveMode);
  const navTheme = effectiveMode === 'dark' ? DarkTheme : DefaultTheme;

  if (!bootstrapped || !settingsLoaded) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color="#EB5E28" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <PaperProvider theme={paperTheme}>
        <ThemeProvider value={navTheme}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
          </Stack>
          <StatusBar style={effectiveMode === 'dark' ? 'light' : 'dark'} />
        </ThemeProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFCF2',
  },
});
