import { type ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ScreenProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  scroll?: boolean;
}

export function Screen({ title, subtitle, action, children, scroll = true }: ScreenProps) {
  const theme = useTheme();
  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.colors.outlineVariant }]}>
        <View style={styles.headerText}>
          <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.onSurface }]}>
            {title}
          </Text>
          {subtitle ? (
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {action}
      </View>
      {scroll ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      ) : (
        <View style={styles.flex}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerText: { flex: 1 },
  title: { fontWeight: '700' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 140 },
});
