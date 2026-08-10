import { Pressable, StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import { Screen } from '@/components/Screen';
import { GlassCard } from '@/components/GlassCard';
import { palette, radii } from '@/constants/theme';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

const SECTIONS: {
  href: string;
  title: string;
  subtitle: string;
  icon: IconName;
}[] = [
  {
    href: '/(tabs)/brain/graph',
    title: 'Knowledge Graph',
    subtitle: 'Visual niches & subtopics you learn',
    icon: 'graphql',
  },
  {
    href: '/(tabs)/brain/media',
    title: 'Books · Videos · Podcasts',
    subtitle: 'Reading & watch list',
    icon: 'bookshelf',
  },
  {
    href: '/(tabs)/brain/skills',
    title: 'Skills & Marks',
    subtitle: 'Coding, education levels & exam scores',
    icon: 'school-outline',
  },
  {
    href: '/(tabs)/brain/college',
    title: 'College',
    subtitle: 'Attendance, hackathons & class schedule',
    icon: 'office-building-outline',
  },
  {
    href: '/(tabs)/brain/finance',
    title: 'Finance',
    subtitle: 'Earnings, spending & subscriptions',
    icon: 'wallet-outline',
  },
  {
    href: '/(tabs)/brain/investments',
    title: 'Stocks & Crypto',
    subtitle: 'Portfolio tracker',
    icon: 'chart-line',
  },
  {
    href: '/(tabs)/brain/insights',
    title: 'AI Insights',
    subtitle: 'Health advice & local Gemma',
    icon: 'robot-outline',
  },
];

export default function BrainHubScreen() {
  const theme = useTheme();
  const router = useRouter();
  const ink = theme.dark ? palette.orchidWhite : palette.warmBlack;
  const muted = theme.dark ? palette.chromeWhite : palette.masala;

  return (
    <Screen
      title="Brain"
      subtitle="Learn · build · money"
      action={
        <Pressable onPress={() => router.push('/(tabs)/settings' as Href)}>
          <MaterialCommunityIcons name="cog-outline" size={22} color={muted} />
        </Pressable>
      }>
      <View style={styles.list}>
        {SECTIONS.map((section) => (
          <Pressable
            key={section.href}
            onPress={() => router.push(section.href as Href)}
            style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}>
            <GlassCard contentStyle={styles.card}>
              <View style={[styles.iconWrap, { backgroundColor: palette.vermillion + '18' }]}>
                <MaterialCommunityIcons name={section.icon} size={24} color={palette.vermillion} />
              </View>
              <View style={styles.text}>
                <Text style={[styles.title, { color: ink }]}>{section.title}</Text>
                <Text style={[styles.subtitle, { color: muted }]}>{section.subtitle}</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={22} color={muted} />
            </GlassCard>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: 10 },
  card: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16 },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  text: { flex: 1 },
  title: { fontSize: 16, fontWeight: '800' },
  subtitle: { fontSize: 12, marginTop: 2, lineHeight: 16 },
});
