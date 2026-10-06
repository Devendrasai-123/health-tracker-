import { calculateWorkoutCalories } from '@/constants/workout-calculations';
import { calculateRecoveryScore } from '@/services/ai-engine';

describe('health calculations', () => {
  it('calculates workout calories from type, duration, intensity and weight', () => {
    expect(calculateWorkoutCalories('Running', 30, 3, 70)).toBe(540);
  });

  it('uses the base-50 recovery formula and clamps the result', () => {
    expect(calculateRecoveryScore({ sleepHours: 8, heartRate: 70, stress: 2, weight: 70 })).toBe(100);
    expect(calculateRecoveryScore({ sleepHours: 2, heartRate: 140, stress: 10, weight: 150 })).toBe(50);
    expect(calculateRecoveryScore({ sleepHours: null, heartRate: null, stress: null, weight: null })).toBeNull();
  });
});
