import { getDb } from './database';
import type { TravelLive, TravelStop, TravelTrip } from '@/types';
import { addTodo } from './todo-service';

interface TripRow {
  id: number;
  date: string;
  title: string;
  from_name: string;
  to_name: string;
  mode: string;
  total_price: number | null;
  total_distance_km: number | null;
  duration_min: number | null;
  share_with_parents: number;
  notes: string | null;
  status: string;
}

interface StopRow {
  id: number;
  trip_id: number;
  name: string;
  area: string | null;
  lat: number | null;
  lng: number | null;
  order_index: number;
  distance_from_prev_km: number | null;
  price_from_prev: number | null;
  line_name: string | null;
  line_color: string | null;
  action: string | null;
}

function mapTrip(row: TripRow): TravelTrip {
  return {
    id: row.id,
    date: row.date,
    title: row.title,
    fromName: row.from_name,
    toName: row.to_name,
    mode: row.mode as TravelTrip['mode'],
    totalPrice: row.total_price,
    totalDistanceKm: row.total_distance_km,
    durationMin: row.duration_min,
    shareWithParents: !!row.share_with_parents,
    notes: row.notes,
    status: row.status as TravelTrip['status'],
  };
}

function mapStop(row: StopRow): TravelStop {
  return {
    id: row.id,
    tripId: row.trip_id,
    name: row.name,
    area: row.area,
    lat: row.lat,
    lng: row.lng,
    orderIndex: row.order_index,
    distanceFromPrevKm: row.distance_from_prev_km,
    priceFromPrev: row.price_from_prev,
    lineName: row.line_name,
    lineColor: row.line_color,
    action: row.action,
  };
}

export type StopInput = {
  name: string;
  area?: string | null;
  lat?: number | null;
  lng?: number | null;
  distanceFromPrevKm?: number | null;
  priceFromPrev?: number | null;
  lineName?: string | null;
  lineColor?: string | null;
  action?: string | null;
};

export async function listTripsByDate(date: string): Promise<TravelTrip[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<TripRow>(
    `SELECT * FROM travel_trips WHERE date = ? ORDER BY id DESC`,
    date,
  );
  return rows.map(mapTrip);
}

export async function listTripDates(): Promise<string[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ date: string }>(
    `SELECT DISTINCT date FROM travel_trips ORDER BY date ASC`,
  );
  return rows.map((r) => r.date);
}

export async function getTrip(id: number): Promise<TravelTrip | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<TripRow>(`SELECT * FROM travel_trips WHERE id = ?`, id);
  return row ? mapTrip(row) : null;
}

export async function listStops(tripId: number): Promise<TravelStop[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<StopRow>(
    `SELECT * FROM travel_stops WHERE trip_id = ? ORDER BY order_index ASC`,
    tripId,
  );
  return rows.map(mapStop);
}

export async function createTrip(input: {
  date: string;
  title: string;
  fromName: string;
  toName: string;
  mode?: TravelTrip['mode'];
  totalPrice?: number | null;
  totalDistanceKm?: number | null;
  durationMin?: number | null;
  shareWithParents?: boolean;
  notes?: string | null;
  stops: StopInput[];
  addToTodo?: boolean;
}): Promise<number> {
  const db = await getDb();
  const result = await db.runAsync(
    `INSERT INTO travel_trips
      (date, title, from_name, to_name, mode, total_price, total_distance_km, duration_min, share_with_parents, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    input.date,
    input.title.trim(),
    input.fromName.trim(),
    input.toName.trim(),
    input.mode ?? 'metro',
    input.totalPrice ?? null,
    input.totalDistanceKm ?? null,
    input.durationMin ?? null,
    input.shareWithParents ? 1 : 0,
    input.notes ?? null,
  );
  const tripId = result.lastInsertRowId;

  for (let i = 0; i < input.stops.length; i++) {
    const s = input.stops[i];
    await db.runAsync(
      `INSERT INTO travel_stops
        (trip_id, name, area, lat, lng, order_index, distance_from_prev_km, price_from_prev, line_name, line_color, action)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      tripId,
      s.name.trim(),
      s.area ?? null,
      s.lat ?? null,
      s.lng ?? null,
      i,
      s.distanceFromPrevKm ?? null,
      s.priceFromPrev ?? null,
      s.lineName ?? null,
      s.lineColor ?? '#EB5E28',
      s.action ?? null,
    );
  }

  if (input.addToTodo !== false) {
    await addTodo(
      `Travel: ${input.fromName} → ${input.toName}`,
      'travel',
      input.date,
    );
  }

  return tripId;
}

export async function deleteTrip(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync(`DELETE FROM travel_stops WHERE trip_id = ?`, id);
  await db.runAsync(`DELETE FROM travel_trips WHERE id = ?`, id);
}

export async function setTripShare(id: number, share: boolean): Promise<void> {
  const db = await getDb();
  await db.runAsync(`UPDATE travel_trips SET share_with_parents = ? WHERE id = ?`, share ? 1 : 0, id);
}

export async function setTripStatus(id: number, status: TravelTrip['status']): Promise<void> {
  const db = await getDb();
  await db.runAsync(`UPDATE travel_trips SET status = ? WHERE id = ?`, status, id);
}

export async function upsertLiveLocation(input: {
  tripId: number | null;
  lat: number;
  lng: number;
  heading?: number | null;
  shareWithParents?: boolean;
}): Promise<void> {
  const db = await getDb();
  const existing = await db.getFirstAsync<{ id: number }>(`SELECT id FROM travel_live WHERE id = 1`);
  if (existing) {
    await db.runAsync(
      `UPDATE travel_live SET
         trip_id = ?,
         lat = ?,
         lng = ?,
         heading = ?,
         updated_at = datetime('now'),
         share_with_parents = COALESCE(?, share_with_parents)
       WHERE id = 1`,
      input.tripId,
      input.lat,
      input.lng,
      input.heading ?? null,
      input.shareWithParents == null ? null : input.shareWithParents ? 1 : 0,
    );
  } else {
    await db.runAsync(
      `INSERT INTO travel_live (id, trip_id, lat, lng, heading, updated_at, share_with_parents)
       VALUES (1, ?, ?, ?, ?, datetime('now'), ?)`,
      input.tripId,
      input.lat,
      input.lng,
      input.heading ?? null,
      input.shareWithParents ? 1 : 0,
    );
  }
}

export async function getLiveLocation(): Promise<TravelLive | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{
    trip_id: number | null;
    lat: number | null;
    lng: number | null;
    heading: number | null;
    updated_at: string | null;
    share_with_parents: number;
  }>(`SELECT * FROM travel_live WHERE id = 1`);
  if (!row) return null;
  return {
    tripId: row.trip_id,
    lat: row.lat,
    lng: row.lng,
    heading: row.heading,
    updatedAt: row.updated_at,
    shareWithParents: !!row.share_with_parents,
  };
}

/** Haversine distance in km */
export function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function googleMapsDirectionsUrl(from: string, to: string): string {
  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(from)}&destination=${encodeURIComponent(to)}&travelmode=transit`;
}

export function googleMapsPinUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}
