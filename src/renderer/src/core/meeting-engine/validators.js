import { z } from 'zod'
import { ERROR_CODES, createMeetingEngineError } from './errors'
import { EVENT_PAYLOAD_SCHEMA, EVENT_VERSION, MeetingEventType } from './protocol'

const allowedEventTypes = new Set(Object.values(MeetingEventType))

const actorSchema = z.object({
  name: z.string().min(1),
  role: z.string().min(1)
})

const baseEventSchema = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
  actor: actorSchema,
  payload: z.record(z.any()).default({}),
  timestamp: z.number(),
  version: z.number()
})

// Validate event structure and payload fields based on protocol definitions.
const validateMeetingEvent = (event) => {
  const baseResult = baseEventSchema.safeParse(event)
  if (!baseResult.success) {
    return {
      ok: false,
      error: createMeetingEngineError(ERROR_CODES.INVALID_EVENT, '事件结构不合法', {
        issues: baseResult.error.issues
      })
    }
  }

  const normalizedEvent = baseResult.data

  if (!allowedEventTypes.has(normalizedEvent.type)) {
    return {
      ok: false,
      error: createMeetingEngineError(ERROR_CODES.UNKNOWN_TYPE, '未知事件类型', {
        type: normalizedEvent.type
      })
    }
  }

  if (normalizedEvent.version !== EVENT_VERSION) {
    return {
      ok: false,
      error: createMeetingEngineError(ERROR_CODES.INVALID_VERSION, '事件版本不匹配', {
        version: normalizedEvent.version,
        expected: EVENT_VERSION
      })
    }
  }

  if (typeof normalizedEvent.payload !== 'object' || normalizedEvent.payload === null) {
    return {
      ok: false,
      error: createMeetingEngineError(ERROR_CODES.INVALID_PAYLOAD, '事件载荷不合法')
    }
  }

  const payloadSchema = EVENT_PAYLOAD_SCHEMA[normalizedEvent.type]
  if (!payloadSchema) {
    return {
      ok: false,
      error: createMeetingEngineError(ERROR_CODES.UNKNOWN_TYPE, '未配置事件载荷协议', {
        type: normalizedEvent.type
      })
    }
  }

  for (const field of payloadSchema.required || []) {
    if (normalizedEvent.payload[field] === undefined || normalizedEvent.payload[field] === null) {
      return {
        ok: false,
        error: createMeetingEngineError(ERROR_CODES.MISSING_FIELD, '事件载荷缺少必填字段', {
          field
        })
      }
    }
  }

  return { ok: true, event: normalizedEvent }
}

export { validateMeetingEvent }
