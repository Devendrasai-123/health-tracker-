import { Pressable, StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import { Screen } from '@/components/Screen';
import { GlassCard } from '@/components/GlassCard';
import { palette, radii } from '@/constants/theme';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

const SECTIONS: {
  href:
    | '/(tabs)/dashboard'
    | '/(tabs)/health/body'
    | '/(tabs)/health/fuel'
    | '/(tabs)/health/gym'
    | '/(tabs)/health/grooming'
    | '/(tabs)/health/calendar'
    | '/(tabs)/health/brain'
    | '/(tabs)/health/finance'
    | '/(tabs)/health/education';
  title: string;
  subtitle: string;
  icon: IconName;
  color: string;
}[] = [
  {
    href: '/(tabs)/dashboard',
    title: 'Today',
    subtitle: 'Log weight, recovery & daily trends',
    icon: 'chart-line',
    color: palette.lime,
  },
  {
    href: '/(tabs)/health/body',
    title: 'Body Reports',
    subtitle: 'Interactive body map & encrypted blood tests',
    icon: 'human',
    color: palette.lavender,
  },
  {
    href: '/(tabs)/health/fuel',
    title: 'Hydration & Food',
    subtitle: 'Water, meals, macros — everything you consume',
    icon: 'cup-water',
    color: '#BFE5D2',
  },
  {
    href: '/(tabs)/health/gym',
    title: 'Gym & Activity',
    subtitle: 'Workouts, steps, sleep, sitting & standing',
    icon: 'dumbbell',
    color: palette.vermillion,
  },
  {
    href: '/(tabs)/health/grooming',
    title: 'Grooming',
    subtitle: 'Wardrobe, skincare, schedules & lookbook',
    icon: 'hanger',
    color: '#F2D39B',
  },
  {
    href: '/(tabs)/health/calendar',
    title: 'Health Calendar',
    subtitle: 'Review daily metrics, meals and workouts by date',
    icon: 'calendar-month',
    color: palette.lavender,
  },
  {
    href: '/(tabs)/health/brain',
    title: 'Mind & Brain',
    subtitle: 'Track stress, sleep and recovery habits',
    icon: 'head-outline',
    color: '#C8E7D0',
  },
  {
    href: '/(tabs)/health/finance',
    title: 'Health Finance',
    subtitle: 'Plan health spending and recurring care costs',
    icon: 'cash-multiple',
    color: '#D8D4C8',
  },
  {
    href: '/(tabs)/health/education',
    title: 'Health Education',
    subtitle: 'Learn how to interpret your health trends',
    icon: 'school-outline',
    color: palette.lime,
  },
];

export default function HealthHubScreen() {
  const theme = useTheme();
  const router = useRouter();
  const ink = theme.dark ? palette.orchidWhite : palette.warmBlack;
  const muted = theme.dark ? palette.chromeWhite : palette.masala;

  return (
    <Screen title="Health" subtitle="Your body systems — pick a section">
      <View style={styles.grid}>
        {SECTIONS.map((section) => (
          <Pressable
            key={section.href}
            onPress={() => router.push(section.href as Href)}
            style={({ pressed }) => [styles.tile, { opacity: pressed ? 0.85 : 1 }]}>
            <GlassCard contentStyle={styles.card}>
              <View style={[styles.iconWrap, { backgroundColor: section.color }]}>
                <MaterialCommunityIcons name={section.icon} size={24} color={palette.warmBlack} />
              </View>
              <View style={styles.text}>
                <Text style={[styles.title, { color: ink }]}>{section.title}</Text>
                <Text style={[styles.subtitle, { color: muted }]}>{section.subtitle}</Text>
              </View>
              <MaterialCommunityIcons name="arrow-up-right" size={20} color={muted} />
            </GlassCard>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 4 },
  tile: { width: '48.2%' },
  card: {
    minHeight: 174,
    paddingVertical: 16,
    justifyContent: 'space-between',
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  text: { flex: 1 },
  title: { fontSize: 17, fontWeight: '900', letterSpacing: -0.3 },
  subtitle: { fontSize: 12, marginTop: 5, lineHeight: 17 },
});
