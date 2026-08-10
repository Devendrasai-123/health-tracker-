import { Pressable, StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import { Screen } from '@/components/Screen';
import { GlassCard } from '@/components/GlassCard';
import { palette, radii } from '@/constants/theme';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

const SECTIONS: {
  href: '/(tabs)/health/body' | '/(tabs)/health/fuel' | '/(tabs)/health/gym' | '/(tabs)/health/grooming';
  title: string;
  subtitle: string;
  icon: IconName;
}[] = [
  {
    href: '/(tabs)/health/body',
    title: 'Body Reports',
    subtitle: 'Labs, blood tests & 3D body overview',
    icon: 'human',
  },
  {
    href: '/(tabs)/health/fuel',
    title: 'Hydration & Food',
    subtitle: 'Water, meals, macros — everything you consume',
    icon: 'cup-water',
  },
  {
    href: '/(tabs)/health/gym',
    title: 'Gym & Activity',
    subtitle: 'Workouts, steps, sleep, sitting & standing',
    icon: 'dumbbell',
  },
  {
    href: '/(tabs)/health/grooming',
    title: 'Grooming',
    subtitle: 'Wardrobe, skincare, schedules & lookbook',
    icon: 'hanger',
  },
];

export default function HealthHubScreen() {
  const theme = useTheme();
  const router = useRouter();
  const ink = theme.dark ? palette.orchidWhite : palette.warmBlack;
  const muted = theme.dark ? palette.chromeWhite : palette.masala;

  return (
    <Screen title="Health" subtitle="Your body systems — pick a section">
      <View style={styles.list}>
        {SECTIONS.map((section) => (
          <Pressable
            key={section.href}
            onPress={() => router.push(section.href as Href)}
            style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}>
            <GlassCard contentStyle={styles.card}>
              <View style={[styles.iconWrap, { backgroundColor: palette.vermillion + '18' }]}>
                <MaterialCommunityIcons name={section.icon} size={26} color={palette.vermillion} />
              </View>
              <View style={styles.text}>
                <Text style={[styles.title, { color: ink }]}>{section.title}</Text>
                <Text style={[styles.subtitle, { color: muted }]}>{section.subtitle}</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color={muted} />
            </GlassCard>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: 12, marginTop: 4 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  text: { flex: 1 },
  title: { fontSize: 18, fontWeight: '800', letterSpacing: -0.2 },
  subtitle: { fontSize: 13, marginTop: 3, lineHeight: 18 },
});
