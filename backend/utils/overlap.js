function activitiesOverlap(a, b) {
  const aStart = new Date(a.startDate || a.start_date).getTime();
  const aEnd = new Date(a.endDate || a.end_date).getTime();
  const bStart = new Date(b.startDate || b.start_date).getTime();
  const bEnd = new Date(b.endDate || b.end_date).getTime();
  return aStart < bEnd && bStart < aEnd;
}

module.exports = { activitiesOverlap };
