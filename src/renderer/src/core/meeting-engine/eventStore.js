import mitt from 'mitt'

const DEFAULT_STORAGE_PREFIX = 'easymeeting-meeting-events'
const MAX_EVENT_COUNT = 200

// 事件存储：负责持久化 + 发布订阅 + 容量控制
const createMeetingEventStore = ({ meetingId, storagePrefix = DEFAULT_STORAGE_PREFIX } = {}) => {
  const emitter = mitt()
  const storageKey = `${storagePrefix}:${meetingId || 'unknown'}`
  let cache = []

  const loadEvents = () => {
    if (!meetingId) return []
    try {
      const raw = localStorage.getItem(storageKey)
      const parsed = raw ? JSON.parse(raw) : []
      cache = Array.isArray(parsed) ? parsed : []
    } catch {
      cache = []
    }
    return cache
  }

  const persist = () => {
    if (!meetingId) return
    localStorage.setItem(storageKey, JSON.stringify(cache))
  }

  // 追加事件并保持容量上限，避免本地存储无限膨胀
  const appendEvent = (event) => {
    if (!event) return cache
    cache = [...cache, event].slice(-MAX_EVENT_COUNT)
    persist()
    emitter.emit('event', event)
    emitter.emit('events', cache)
    return cache
  }

  const clearEvents = () => {
    cache = []
    if (meetingId) {
      localStorage.removeItem(storageKey)
    }
    emitter.emit('clear')
    emitter.emit('events', cache)
  }

  const getEvents = () => cache

  const subscribe = (handler) => {
    emitter.on('event', handler)
    return () => emitter.off('event', handler)
  }

  const subscribeEvents = (handler) => {
    emitter.on('events', handler)
    return () => emitter.off('events', handler)
  }

  return {
    storageKey,
    loadEvents,
    appendEvent,
    clearEvents,
    getEvents,
    subscribe,
    subscribeEvents
  }
}

export { createMeetingEventStore, DEFAULT_STORAGE_PREFIX, MAX_EVENT_COUNT }
