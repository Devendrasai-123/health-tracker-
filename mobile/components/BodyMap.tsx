import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Ellipse, Rect } from 'react-native-svg';
import { useTheme } from 'react-native-paper';

import {
  REGION_STATUS_COLORS,
  getRegion,
  type RegionId,
  type RegionStatus,
} from '@/constants/body-map';

const VIEW_W = 220;
const VIEW_H = 470;

type ShapeKind = 'rect' | 'ellipse';

interface Shape {
  kind: ShapeKind;
  x: number;
  y: number;
  w: number;
  h: number;
  rx?: number;
}

/**
 * Geometry for every tappable region, in viewBox units. The same list drives the
 * artwork and the press targets, so the two can never drift apart.
 */
const REGION_SHAPES: { id: RegionId; shapes: Shape[] }[] = [
  { id: 'brain', shapes: [{ kind: 'ellipse', x: 80, y: 11, w: 60, h: 74 }] },
  { id: 'thyroid', shapes: [{ kind: 'rect', x: 97, y: 83, w: 26, h: 16, rx: 7 }] },
  {
    id: 'lungs',
    shapes: [
      { kind: 'rect', x: 68, y: 106, w: 38, h: 64, rx: 16 },
      { kind: 'rect', x: 114, y: 106, w: 38, h: 64, rx: 16 },
    ],
  },
  // The heart is drawn after the lungs so it sits on top of them.
  { id: 'heart', shapes: [{ kind: 'rect', x: 92, y: 116, w: 36, h: 46, rx: 14 }] },
  { id: 'liver', shapes: [{ kind: 'rect', x: 68, y: 176, w: 84, h: 42, rx: 14 }] },
  { id: 'gut', shapes: [{ kind: 'rect', x: 68, y: 222, w: 84, h: 34, rx: 14 }] },
  { id: 'kidneys', shapes: [{ kind: 'rect', x: 74, y: 260, w: 72, h: 30, rx: 13 }] },
  { id: 'hormones', shapes: [{ kind: 'rect', x: 78, y: 294, w: 64, h: 30, rx: 13 }] },
  {
    id: 'muscles',
    shapes: [
      { kind: 'rect', x: 34, y: 108, w: 26, h: 108, rx: 13 },
      { kind: 'rect', x: 160, y: 108, w: 26, h: 108, rx: 13 },
    ],
  },
  {
    id: 'bones',
    shapes: [
      { kind: 'rect', x: 80, y: 330, w: 28, h: 132, rx: 14 },
      { kind: 'rect', x: 112, y: 330, w: 28, h: 132, rx: 14 },
    ],
  },
];

interface BodyMapProps {
  /** Status per region — drives the fill colour of each shape. */
  statuses: Record<RegionId, RegionStatus>;
  /** Currently selected region, highlighted with a thicker outline. */
  selected: RegionId | null;
  onSelect: (id: RegionId) => void;
  /** Rendered width in px; height follows the viewBox aspect ratio. */
  width?: number;
}

/**
 * Tap-to-select anatomical map. Ten stylised regions, each wired to the lab
 * panels that describe it — see constants/body-map.ts.
 *
 * Press handling lives on transparent Pressable overlays rather than on the SVG
 * nodes: react-native-svg leaks responder props to the DOM on web, which React
 * rejects with "Unknown event handler property" errors.
 */
export function BodyMap({ statuses, selected, onSelect, width = 180 }: BodyMapProps) {
  const theme = useTheme();
  const height = Math.round((width * VIEW_H) / VIEW_W);
  const scale = width / VIEW_W;
  const outline = theme.dark ? '#6A655E' : '#CCC5B9';

  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height} viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}>
        {REGION_SHAPES.flatMap(({ id, shapes }) => {
          const color = REGION_STATUS_COLORS[statuses[id] ?? 'none'];
          const isSelected = selected === id;
          const fill = color + (isSelected ? '4D' : '26');
          const stroke = isSelected ? color : outline;
          const strokeWidth = isSelected ? 3 : 1.5;

          return shapes.map((shape, i) =>
            shape.kind === 'ellipse' ? (
              <Ellipse
                key={`${id}-${i}`}
                cx={shape.x + shape.w / 2}
                cy={shape.y + shape.h / 2}
                rx={shape.w / 2}
                ry={shape.h / 2}
                fill={fill}
                stroke={stroke}
                strokeWidth={strokeWidth}
              />
            ) : (
              <Rect
                key={`${id}-${i}`}
                x={shape.x}
                y={shape.y}
                width={shape.w}
                height={shape.h}
                rx={shape.rx}
                fill={fill}
                stroke={stroke}
                strokeWidth={strokeWidth}
              />
            ),
          );
        })}
      </Svg>

      {REGION_SHAPES.map(({ id, shapes }) =>
        shapes.map((shape, i) => (
          <Pressable
            key={`hit-${id}-${i}`}
            accessibilityRole="button"
            accessibilityLabel={getRegion(id).name}
            onPress={() => onSelect(id)}
            style={[
              styles.hit,
              {
                left: shape.x * scale,
                top: shape.y * scale,
                width: shape.w * scale,
                height: shape.h * scale,
                borderRadius: (shape.rx ?? 0) * scale,
              },
            ]}
          />
        )),
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  hit: {
    position: 'absolute',
  },
});
