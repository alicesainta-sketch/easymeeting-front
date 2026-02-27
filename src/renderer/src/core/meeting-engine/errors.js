// Meeting engine error codes for validation and runtime checks.
const ERROR_CODES = {
  INVALID_EVENT: 'INVALID_EVENT',
  UNKNOWN_TYPE: 'UNKNOWN_TYPE',
  MISSING_FIELD: 'MISSING_FIELD',
  INVALID_VERSION: 'INVALID_VERSION',
  INVALID_PAYLOAD: 'INVALID_PAYLOAD'
}

// Create a normalized engine error object.
const createMeetingEngineError = (code, message, detail = {}) => {
  return {
    code,
    message,
    detail,
    timestamp: Date.now()
  }
}

export { ERROR_CODES, createMeetingEngineError }
