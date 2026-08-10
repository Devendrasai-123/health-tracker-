import { useMemo } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Polygon, Stop, Text as SvgText } from 'react-native-svg';
import type { TravelStop } from '@/types';

const W = Dimensions.get('window').width - 32;
const H = 280;

interface MetroRouteMapProps {
  stops: TravelStop[];
  /** 0..1 progress along the route, or null */
  progress?: number | null;
  /** heading degrees for the moving arrow */
  heading?: number | null;
  compact?: boolean;
}

/**
 * Classic premium metro schematic — colored line segments, stations, distances,
 * and a moving arrow for live progress.
 */
export function MetroRouteMap({
  stops,
  progress = null,
  heading = 0,
  compact = false,
}: MetroRouteMapProps) {
  const height = compact ? 160 : H;
  const layout = useMemo(() => {
    if (stops.length === 0) return [];
    const padX = 28;
    const usable = W - padX * 2;
    return stops.map((s, i) => {
      const t = stops.length === 1 ? 0.5 : i / (stops.length - 1);
      // slight zig-zag for metro aesthetic
      const zig = i % 2 === 0 ? -18 : 18;
      return {
        stop: s,
        x: padX + usable * t,
        y: height / 2 + (stops.length > 2 ? zig * (compact ? 0.4 : 1) : 0),
      };
    });
  }, [stops, height, compact]);

  const arrow = useMemo(() => {
    if (progress == null || layout.length < 2) return null;
    const clamped = Math.max(0, Math.min(0.999, progress));
    const seg = clamped * (layout.length - 1);
    const i = Math.floor(seg);
    const f = seg - i;
    const a = layout[i];
    const b = layout[Math.min(i + 1, layout.length - 1)];
    const x = a.x + (b.x - a.x) * f;
    const y = a.y + (b.y - a.y) * f;
    const angle = Math.atan2(b.y - a.y, b.x - a.x) + ((heading ?? 0) * Math.PI) / 1800;
    return { x, y, angle };
  }, [progress, layout, heading]);

  if (stops.length === 0) {
    return <View style={[styles.empty, { height }]} />;
  }

  return (
    <View style={[styles.wrap, { height }]}>
      <Svg width={W} height={height}>
        <Defs>
          <LinearGradient id="glow" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#4EA8DE" stopOpacity="0.9" />
            <Stop offset="1" stopColor="#EB5E28" stopOpacity="0.9" />
          </LinearGradient>
        </Defs>

        {/* faint grid */}
        {[0, 1, 2, 3, 4].map((g) => (
          <Line
            key={`g-${g}`}
            x1={0}
            y1={(height / 4) * g}
            x2={W}
            y2={(height / 4) * g}
            stroke="rgba(255,252,242,0.06)"
            strokeWidth={1}
          />
        ))}

        {layout.slice(0, -1).map((a, i) => {
          const b = layout[i + 1];
          const color = b.stop.lineColor || a.stop.lineColor || '#EB5E28';
          return (
            <Line
              key={`seg-${i}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={color}
              strokeWidth={compact ? 5 : 8}
              strokeLinecap="round"
              opacity={0.95}
            />
          );
        })}

        {layout.map((p, i) => {
          const dist = p.stop.distanceFromPrevKm;
          return (
            <SvgText
              key={`d-${i}`}
              x={(layout[Math.max(0, i - 1)].x + p.x) / 2}
              y={Math.min(p.y, layout[Math.max(0, i - 1)].y) - 16}
              fill="#CCC5B9"
              fontSize={9}
              textAnchor="middle">
              {i === 0 ? '' : dist != null ? `${dist.toFixed(1)} km` : ''}
            </SvgText>
          );
        })}

        {layout.map((p, i) => (
          <Circle
            key={`s-${i}`}
            cx={p.x}
            cy={p.y}
            r={i === 0 || i === layout.length - 1 ? 9 : 7}
            fill="#FFFCF2"
            stroke={p.stop.lineColor || '#EB5E28'}
            strokeWidth={3}
          />
        ))}

        {layout.map((p, i) => (
          <SvgText
            key={`n-${i}`}
            x={p.x}
            y={p.y + 24}
            fill="#FFFCF2"
            fontSize={compact ? 9 : 11}
            fontWeight="700"
            textAnchor="middle">
            {p.stop.name.length > 12 ? `${p.stop.name.slice(0, 11)}…` : p.stop.name}
          </SvgText>
        ))}

        {!compact
          ? layout.map((p, i) =>
              p.stop.area ? (
                <SvgText
                  key={`a-${i}`}
                  x={p.x}
                  y={p.y + 38}
                  fill="#CCC5B9"
                  fontSize={9}
                  textAnchor="middle">
                  {p.stop.area}
                </SvgText>
              ) : null,
            )
          : null}

        {arrow ? (
          <Polygon
            points={`${arrow.x + 12},${arrow.y} ${arrow.x - 8},${arrow.y - 8} ${arrow.x - 8},${arrow.y + 8}`}
            fill="#FFFCF2"
            stroke="#EB5E28"
            strokeWidth={2}
            opacity={0.95}
            // rough rotate via transform
            transform={`rotate(${(arrow.angle * 180) / Math.PI}, ${arrow.x}, ${arrow.y})`}
          />
        ) : null}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: W,
    alignSelf: 'center',
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#1A1D29',
  },
  empty: {
    width: W,
    alignSelf: 'center',
    borderRadius: 20,
    backgroundColor: '#1A1D29',
  },
});
