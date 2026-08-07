import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { LineChart } from 'react-native-gifted-charts';

export interface TrendPoint {
  value: number;
  label?: string;
}

interface TrendChartProps {
  data: TrendPoint[];
  color: string;
  height?: number;
  yLabelSuffix?: string;
  area?: boolean;
  showDataPoints?: boolean;
  emptyMessage?: string;
}

export function TrendChart({
  data,
  color,
  height = 200,
  yLabelSuffix = '',
  area = false,
  showDataPoints = false,
  emptyMessage = 'Not enough data yet',
}: TrendChartProps) {
  const theme = useTheme();

  const points = useMemo(
    () => data.map((p) => ({ value: p.value, label: p.label ?? '' })),
    [data],
  );

  if (points.length < 2) {
    return (
      <View style={[styles.empty, { borderColor: theme.colors.outlineVariant, height }]}>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          {emptyMessage}
        </Text>
      </View>
    );
  }

  return (
    <LineChart
      data={points}
      height={height}
      curved
      color={color}
      thickness={2.5}
      hideDataPoints={!showDataPoints}
      areaChart={area}
      startFillColor={color + '55'}
      endFillColor={color + '05'}
      startOpacity={1}
      endOpacity={0.1}
      noOfSections={4}
      yAxisLabelSuffix={yLabelSuffix}
      yAxisTextStyle={{ color: theme.colors.onSurfaceVariant, fontSize: 10 }}
      yAxisColor={theme.colors.outlineVariant}
      rulesColor={theme.colors.outlineVariant}
      rulesType="dashed"
      initialSpacing={8}
      endSpacing={8}
      adjustToWidth
    />
  );
}

const styles = StyleSheet.create({
  empty: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderStyle: 'dashed',
  },
});
