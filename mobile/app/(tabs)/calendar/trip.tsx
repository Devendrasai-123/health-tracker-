import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Linking, ScrollView, Share, StyleSheet, View } from 'react-native';
import { Button, Switch, Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Location from 'expo-location';

import { GlassCard } from '@/components/GlassCard';
import { MetroRouteMap } from '@/components/MetroRouteMap';
import { EmptyState } from '@/components/EmptyState';
import {
  deleteTrip,
  getTrip,
  googleMapsDirectionsUrl,
  googleMapsPinUrl,
  listStops,
  setTripShare,
  setTripStatus,
  upsertLiveLocation,
} from '@/services/travel-service';
import { palette, radii } from '@/constants/theme';
import type { TravelStop, TravelTrip } from '@/types';

export default function TripDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const tripId = Number(id);
  const [trip, setTrip] = useState<TravelTrip | null>(null);
  const [stops, setStops] = useState<TravelStop[]>([]);
  const [tracking, setTracking] = useState(false);
  const [progress, setProgress] = useState(0);
  const [heading, setHeading] = useState(0);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const watchRef = useRef<Location.LocationSubscription | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const reload = useCallback(async () => {
    if (!tripId) return;
    const [t, s] = await Promise.all([getTrip(tripId), listStops(tripId)]);
    setTrip(t);
    setStops(s);
  }, [tripId]);

  useEffect(() => {
    reload();
    return () => {
      watchRef.current?.remove();
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [reload]);

  // ink/muted unused on dark screen — keep theme for EmptyState only
  void theme;

  const chosenLines = useMemo(() => {
    const lines: { name: string; color: string }[] = [];
    for (const s of stops) {
      if (s.lineName && !lines.some((l) => l.name === s.lineName)) {
        lines.push({ name: s.lineName, color: s.lineColor || palette.vermillion });
      }
    }
    return lines;
  }, [stops]);

  const startTracking = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return;
    }
    setTracking(true);
    await setTripStatus(tripId, 'active');
    await reload();

    // Animate schematic arrow while also listening to GPS
    let p = 0;
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = setInterval(() => {
      p = Math.min(1, p + 0.01);
      setProgress(p);
      if (p >= 1 && tickRef.current) clearInterval(tickRef.current);
    }, 800);

    watchRef.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 3000,
        distanceInterval: 8,
      },
      async (loc) => {
        const lat = loc.coords.latitude;
        const lng = loc.coords.longitude;
        const h = loc.coords.heading ?? 0;
        setCoords({ lat, lng });
        setHeading(h || 0);
        await upsertLiveLocation({
          tripId,
          lat,
          lng,
          heading: h,
          shareWithParents: trip?.shareWithParents ?? true,
        });
      },
    );
  };

  const stopTracking = async () => {
    watchRef.current?.remove();
    watchRef.current = null;
    if (tickRef.current) clearInterval(tickRef.current);
    setTracking(false);
    await setTripStatus(tripId, 'done');
    await reload();
  };

  const shareWithParents = async () => {
    if (!trip) return;
    const maps =
      coords != null
        ? googleMapsPinUrl(coords.lat, coords.lng)
        : googleMapsDirectionsUrl(trip.fromName, trip.toName);
    await Share.share({
      message: `I'm traveling: ${trip.fromName} → ${trip.toName}\nStatus: ${trip.status}\nLive map: ${maps}`,
    });
  };

  const openGoogleMaps = () => {
    if (!trip) return;
    Linking.openURL(googleMapsDirectionsUrl(trip.fromName, trip.toName));
  };

  if (!trip) {
    return <EmptyState icon="subway" title="Trip not found" />;
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#12141C' }}
      contentContainerStyle={styles.pad}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.tripTitle}>Your Trip</Text>
          <Text style={styles.tripSub}>
            From: {trip.fromName} | To: {trip.toName}
          </Text>
        </View>
        <MaterialCommunityIcons name="subway" size={28} color="#FFFCF2" />
      </View>

      <MetroRouteMap
        stops={stops}
        progress={tracking ? progress : trip.status === 'done' ? 1 : null}
        heading={heading}
      />

      <GlassCard style={styles.card} contentStyle={styles.chosen}>
        <Text style={styles.cardLabel}>CHOSEN</Text>
        <View style={styles.chosenRow}>
          <Text style={styles.duration}>{trip.durationMin ?? '—'} min</Text>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <View style={styles.lineRow}>
              {chosenLines.map((l) => (
                <View key={l.name} style={styles.lineChip}>
                  <View style={[styles.lineBar, { backgroundColor: l.color }]} />
                  <Text style={styles.lineName}>{l.name}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.stopsText}>
              {stops.map((s) => s.name).join(' · ')}
            </Text>
          </View>
        </View>
        <Text style={styles.meta}>
          {trip.totalDistanceKm != null ? `${trip.totalDistanceKm.toFixed(1)} km` : '—'} ·{' '}
          {trip.totalPrice != null ? `₹${trip.totalPrice}` : '—'} · {trip.mode}
        </Text>
      </GlassCard>

      <GlassCard style={styles.card} contentStyle={styles.block}>
        <Text style={styles.cardLabel}>STOPS · DISTANCE · PRICE · ACTION</Text>
        {stops.map((s, i) => (
          <View key={s.id} style={styles.stopRow}>
            <View style={[styles.dot, { backgroundColor: s.lineColor || palette.vermillion }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.stopName}>{s.name}</Text>
              <Text style={styles.stopMeta}>
                {s.area || 'Area'}
                {s.action ? ` · ${s.action}` : ''}
                {i > 0 && s.distanceFromPrevKm != null ? ` · ${s.distanceFromPrevKm.toFixed(1)} km` : ''}
                {i > 0 && s.priceFromPrev != null ? ` · ₹${s.priceFromPrev.toFixed(0)}` : ''}
              </Text>
            </View>
          </View>
        ))}
      </GlassCard>

      <GlassCard style={styles.card} contentStyle={styles.shareRow}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#FFFCF2', fontWeight: '700' }}>Share with parents</Text>
          <Text style={{ color: '#CCC5B9', fontSize: 12 }}>
            Live GPS updates + shareable Maps link
          </Text>
        </View>
        <Switch
          value={trip.shareWithParents}
          color={palette.vermillion}
          onValueChange={async (v) => {
            await setTripShare(trip.id, v);
            await reload();
          }}
        />
      </GlassCard>

      {coords ? (
        <Text style={styles.liveCoords}>
          Live: {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)} · heading {Math.round(heading)}°
        </Text>
      ) : null}

      <View style={styles.actions}>
        {!tracking ? (
          <Button
            mode="contained"
            buttonColor={palette.vermillion}
            textColor="#fff"
            icon="navigation-variant"
            onPress={startTracking}
            style={styles.btn}>
            Start trip · moving arrow
          </Button>
        ) : (
          <Button mode="contained" buttonColor="#403D39" textColor="#fff" onPress={stopTracking} style={styles.btn}>
            End trip
          </Button>
        )}
        <Button mode="outlined" textColor="#FFFCF2" icon="google-maps" onPress={openGoogleMaps} style={styles.btnOutline}>
          Open in Google Maps
        </Button>
        <Button mode="outlined" textColor="#FFFCF2" icon="share-variant" onPress={shareWithParents} style={styles.btnOutline}>
          Share location to parents
        </Button>
        <Button
          mode="text"
          textColor="#FF8A80"
          onPress={async () => {
            await deleteTrip(trip.id);
            router.back();
          }}>
          Delete trip
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pad: { padding: 16, paddingBottom: 80 },
  header: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  tripTitle: { color: '#FFFCF2', fontSize: 28, fontWeight: '800' },
  tripSub: { color: '#CCC5B9', marginTop: 4, fontSize: 13 },
  card: { marginTop: 12, backgroundColor: 'rgba(255,252,242,0.08)' },
  chosen: { paddingVertical: 14 },
  cardLabel: {
    color: '#CCC5B9',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 8,
  },
  chosenRow: { flexDirection: 'row', alignItems: 'center' },
  duration: { color: '#FFFCF2', fontSize: 34, fontWeight: '800' },
  lineRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  lineChip: { marginBottom: 4 },
  lineBar: { height: 6, borderRadius: 3, width: 72 },
  lineName: { color: '#FFFCF2', fontSize: 10, fontWeight: '700', marginTop: 2 },
  stopsText: { color: '#CCC5B9', fontSize: 11, marginTop: 6 },
  meta: { color: '#CCC5B9', marginTop: 10, fontSize: 12 },
  block: { paddingVertical: 12 },
  stopRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  stopName: { color: '#FFFCF2', fontWeight: '700' },
  stopMeta: { color: '#CCC5B9', fontSize: 11, marginTop: 2 },
  shareRow: { flexDirection: 'row', alignItems: 'center' },
  liveCoords: { color: '#CCC5B9', fontSize: 11, marginTop: 10 },
  actions: { marginTop: 14, gap: 8 },
  btn: { borderRadius: radii.md },
  btnOutline: { borderRadius: radii.md, borderColor: 'rgba(204,197,185,0.4)' },
});
