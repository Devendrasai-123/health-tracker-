import { getTestTypeDef } from '@/constants/metrics';

/**
 * Interactive body map model.
 *
 * Each tappable region maps to the lab panels that describe it, so the map
 * becomes a spatial index over the user's own blood work instead of a
 * decorative illustration.
 */

export type RegionId =
  | 'brain'
  | 'thyroid'
  | 'heart'
  | 'lungs'
  | 'liver'
  | 'gut'
  | 'kidneys'
  | 'hormones'
  | 'muscles'
  | 'bones';

export interface BodyRegion {
  id: RegionId;
  name: string;
  blurb: string;
  tests: string[];
}

export const BODY_REGIONS: BodyRegion[] = [
  {
    id: 'brain',
    name: 'Brain & nerves',
    blurb: 'Cognitive energy, mood and nerve signalling.',
    tests: ['Vitamin B12', 'Cortisol', 'TSH'],
  },
  {
    id: 'thyroid',
    name: 'Thyroid',
    blurb: 'Metabolic rate and hormone feedback loops.',
    tests: ['TSH'],
  },
  {
    id: 'heart',
    name: 'Heart & circulation',
    blurb: 'Cholesterol balance, triglycerides and blood pressure.',
    tests: [
      'Total Cholesterol',
      'LDL Cholesterol',
      'HDL Cholesterol',
      'Triglycerides',
      'Blood Pressure Systolic',
      'Blood Pressure Diastolic',
    ],
  },
  {
    id: 'lungs',
    name: 'Lungs & blood',
    blurb: 'Oxygen carrying capacity of your blood.',
    tests: ['Hemoglobin', 'RBC'],
  },
  {
    id: 'liver',
    name: 'Liver & detox',
    blurb: 'Liver enzymes, lipids and uric acid clearance.',
    tests: ['AST/ALT', 'Triglycerides', 'Uric Acid'],
  },
  {
    id: 'gut',
    name: 'Gut & metabolism',
    blurb: 'Fasting glucose and long-term blood sugar control.',
    tests: ['Glucose (Fasting)', 'HbA1c'],
  },
  {
    id: 'kidneys',
    name: 'Kidneys & bladder',
    blurb: 'Filtration rate and hydration balance.',
    tests: ['Creatinine', 'BUN', 'Uric Acid'],
  },
  {
    id: 'hormones',
    name: 'Hormones',
    blurb: 'Reproductive and stress hormone levels.',
    tests: ['Testosterone', 'Cortisol'],
  },
  {
    id: 'muscles',
    name: 'Muscles & immunity',
    blurb: 'Inflammation markers and immune cell counts.',
    tests: ['WBC', 'CRP', 'Creatinine'],
  },
  {
    id: 'bones',
    name: 'Bones & joints',
    blurb: 'Vitamin D, mineral status and joint risk.',
    tests: ['Vitamin D', 'Uric Acid'],
  },
];

export function getRegion(id: RegionId): BodyRegion {
  return BODY_REGIONS.find((r) => r.id === id) ?? BODY_REGIONS[0];
}

export type RegionStatus = 'ok' | 'low' | 'high' | 'none';
export type TestStatus = Exclude<RegionStatus, 'none'>;

export const REGION_STATUS_COLORS: Record<RegionStatus, string> = {
  ok: '#3D7A5A',
  low: '#C98A22',
  high: '#C62828',
  none: '#9A948B',
};

export const REGION_STATUS_LABELS: Record<RegionStatus, string> = {
  ok: 'In range',
  low: 'Below range',
  high: 'Above range',
  none: 'No data yet',
};

export interface RegionTestPoint {
  testType: string;
  value: number;
  unit: string;
  date: string;
  status: TestStatus;
}

export interface RegionSummary {
  id: RegionId;
  status: RegionStatus;
  tests: RegionTestPoint[];
}

export interface RegionTestInput {
  testType: string;
  value: number;
  unit: string;
  date: string;
}

const RANK: Record<TestStatus, number> = { ok: 1, low: 2, high: 3 };

/** Range-check a single reading against the reference panel definition. */
export function statusForTest(testType: string, value: number): TestStatus {
  const def = getTestTypeDef(testType);
  if (def.low != null && value < def.low) return 'low';
  if (def.high != null && value > def.high) return 'high';
  return 'ok';
}

/**
 * Roll the user's blood tests up into one status per body region, using the
 * most recent reading for each panel.
 */
export function summarizeRegions(
  tests: RegionTestInput[],
): Record<RegionId, RegionSummary> {
  const latestByType = new Map<string, RegionTestInput>();
  for (const t of tests) {
    const prev = latestByType.get(t.testType);
    if (!prev || t.date > prev.date) latestByType.set(t.testType, t);
  }

  const out = {} as Record<RegionId, RegionSummary>;
  for (const region of BODY_REGIONS) {
    const points: RegionTestPoint[] = [];
    for (const type of region.tests) {
      const point = latestByType.get(type);
      if (!point) continue;
      points.push({
        testType: point.testType,
        value: point.value,
        unit: point.unit,
        date: point.date,
        status: statusForTest(point.testType, point.value),
      });
    }
    const status: RegionStatus =
      points.length === 0
        ? 'none'
        : points.reduce<TestStatus>(
            (acc, p) => (RANK[p.status] > RANK[acc] ? p.status : acc),
            'ok',
          );
    out[region.id] = { id: region.id, status, tests: points };
  }
  return out;
}
