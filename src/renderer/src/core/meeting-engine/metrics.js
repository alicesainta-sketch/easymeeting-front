// Aggregate event metrics for analytics panels and debug views.
// Edge cases: empty list returns zeroed metrics; invalid events are ignored.
const buildEventMetrics = (events = []) => {
  const byType = {}
  const byRole = {}
  let lastEventAt = 0

  for (const event of events) {
    if (!event) continue
    if (event.type) {
      byType[event.type] = (byType[event.type] || 0) + 1
    }
    const role = event.actor?.role
    if (role) {
      byRole[role] = (byRole[role] || 0) + 1
    }
    if (typeof event.timestamp === 'number' && event.timestamp > lastEventAt) {
      lastEventAt = event.timestamp
    }
  }

  return {
    total: events.length,
    byType,
    byRole,
    lastEventAt
  }
}

export { buildEventMetrics }
