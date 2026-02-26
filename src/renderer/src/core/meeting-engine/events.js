import { EVENT_VERSION } from './protocol'

// 统一事件构造函数，保证事件结构一致且可回放
const createMeetingEvent = ({ type, actor, payload = {}, timestamp = Date.now() }) => {
  const safeActor = actor || { name: '系统', role: 'system' }
  return {
    id: `${type}-${timestamp}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    actor: {
      name: safeActor.name || '系统',
      role: safeActor.role || 'system'
    },
    payload,
    timestamp,
    version: EVENT_VERSION
  }
}

export { createMeetingEvent }
