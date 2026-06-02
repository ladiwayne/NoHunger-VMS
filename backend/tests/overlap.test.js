const { activitiesOverlap } = require('../utils/overlap');

describe('activitiesOverlap', () => {
  test('detects overlapping time ranges', () => {
    const a = { startDate: '2026-06-10T09:00:00Z', endDate: '2026-06-10T12:00:00Z' };
    const b = { startDate: '2026-06-10T11:00:00Z', endDate: '2026-06-10T13:00:00Z' };
    expect(activitiesOverlap(a, b)).toBe(true);
  });

  test('detects non-overlap', () => {
    const a = { startDate: '2026-06-10T09:00:00Z', endDate: '2026-06-10T10:00:00Z' };
    const b = { startDate: '2026-06-10T10:00:00Z', endDate: '2026-06-10T11:00:00Z' };
    expect(activitiesOverlap(a, b)).toBe(false);
  });
});
