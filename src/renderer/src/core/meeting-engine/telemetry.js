// Telemetry store for engine validation and event processing.
const createMeetingTelemetry = () => {
  let accepted = 0
  let rejected = 0
  let lastError = null
  const errors = {}

  const recordSuccess = () => {
    accepted += 1
  }

  const recordError = (error) => {
    rejected += 1
    if (error?.code) {
      errors[error.code] = (errors[error.code] || 0) + 1
    }
    lastError = error || null
  }

  const getSnapshot = () => {
    return {
      accepted,
      rejected,
      errors: { ...errors },
      lastError
    }
  }

  const reset = () => {
    accepted = 0
    rejected = 0
    lastError = null
    for (const key of Object.keys(errors)) {
      delete errors[key]
    }
  }

  return {
    recordSuccess,
    recordError,
    getSnapshot,
    reset
  }
}

export { createMeetingTelemetry }
