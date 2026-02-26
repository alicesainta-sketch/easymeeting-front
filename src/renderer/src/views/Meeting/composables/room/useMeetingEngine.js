import { computed, onUnmounted, ref, watch } from 'vue'
import { interpret } from 'xstate'
import {
  MeetingEventType,
  createMeetingEvent,
  createMeetingEventStore,
  buildEventTimeline,
  buildEventMetrics,
  buildMeetingSnapshot,
  getMeetingActionAvailability,
  getMeetingStateFromEvents,
  getMeetingStateLabel,
  formatEventTime,
  mapEventToMachineEvent,
  createMeetingMachine
} from '@/core/meeting-engine'

const ACTION_EVENT_MAP = {
  start: MeetingEventType.MEETING_STARTED,
  pause: MeetingEventType.MEETING_PAUSED,
  resume: MeetingEventType.MEETING_RESUMED,
  end: MeetingEventType.MEETING_ENDED
}

// 会议引擎 composable：对接事件存储 + 状态机 + 时间线
const useMeetingEngine = ({ meetingId, actorName, actorRole, canModerate }) => {
  const machine = createMeetingMachine()
  const engineState = ref(machine.initialState.value)
  const eventItems = ref([])
  const replayIndex = ref(-1)
  const storeRef = ref(null)
  const serviceRef = ref(null)
  let unsubscribeEvent = null
  let unsubscribeEvents = null

  const engineStateLabel = computed(() => getMeetingStateLabel(engineState.value))

  const actionList = computed(() => {
    return getMeetingActionAvailability({
      state: engineState.value,
      canModerate: Boolean(canModerate.value)
    })
  })

  const actionHint = computed(() => {
    if (canModerate.value) return ''
    return '当前为参会者，仅可查看会议引擎状态'
  })

  const eventTimeline = computed(() => buildEventTimeline(eventItems.value))

  const eventStats = computed(() => {
    const metrics = buildEventMetrics(eventItems.value)
    const lastTimestamp = metrics.lastEventAt
    return {
      total: metrics.total,
      lastTimeLabel: lastTimestamp ? formatEventTime(lastTimestamp) : '',
      byType: metrics.byType,
      byRole: metrics.byRole
    }
  })

  const replaySnapshot = computed(() => {
    if (replayIndex.value < 0) return buildMeetingSnapshot([], machine)
    return buildMeetingSnapshot(eventItems.value.slice(0, replayIndex.value + 1), machine)
  })

  const stopService = () => {
    if (!serviceRef.value) return
    serviceRef.value.stop()
    serviceRef.value = null
  }

  const startService = (initialState) => {
    stopService()
    const service = interpret(machine)
    service.onTransition((state) => {
      if (!state.changed) return
      engineState.value = state.value
    })
    service.start(initialState)
    engineState.value = service.state.value
    serviceRef.value = service
  }

  const stopStoreSubscriptions = () => {
    if (unsubscribeEvent) unsubscribeEvent()
    if (unsubscribeEvents) unsubscribeEvents()
    unsubscribeEvent = null
    unsubscribeEvents = null
  }

  const initStore = (id) => {
    if (!id) return
    stopStoreSubscriptions()
    const store = createMeetingEventStore({ meetingId: id })
    storeRef.value = store
    eventItems.value = store.loadEvents()
    replayIndex.value = eventItems.value.length ? eventItems.value.length - 1 : -1

    const replayedState = getMeetingStateFromEvents(eventItems.value, machine)
    startService(replayedState)

    unsubscribeEvent = store.subscribe((event) => {
      const machineEvent = mapEventToMachineEvent(event)
      if (machineEvent && serviceRef.value) {
        serviceRef.value.send(machineEvent)
      }
    })

    unsubscribeEvents = store.subscribeEvents((events) => {
      eventItems.value = events
      if (!events.length) {
        replayIndex.value = -1
        return
      }
      if (replayIndex.value < 0 || replayIndex.value >= events.length) {
        replayIndex.value = events.length - 1
      }
    })
  }

  // 追加事件并触发事件总线
  const appendMeetingEvent = (type, payload = {}, actorOverride) => {
    if (!storeRef.value || !type) return null
    const event = createMeetingEvent({
      type,
      actor: actorOverride || {
        name: actorName.value || '我',
        role: actorRole.value || 'participant'
      },
      payload
    })
    storeRef.value.appendEvent(event)
    return event
  }

  // 会议控制动作入口：带权限校验与禁用原因
  const requestMeetingAction = (
    actionKey,
    { reason = '', actorOverride, bypassPermission } = {}
  ) => {
    const action = actionList.value.find((item) => item.key === actionKey)
    if (!action) return { ok: false, reason: '未知动作' }
    if (!bypassPermission && !action.enabled) {
      return { ok: false, reason: action.reason || '当前不可操作' }
    }
    const eventType = ACTION_EVENT_MAP[actionKey]
    const event = appendMeetingEvent(eventType, { reason }, actorOverride)
    return { ok: Boolean(event), reason: action.reason, event }
  }

  const clearMeetingEvents = () => {
    if (!storeRef.value) return
    storeRef.value.clearEvents()
    startService(machine.initialState)
  }

  // 回放索引统一夹紧，避免拖动越界导致快照异常
  const setReplayIndex = (nextIndex) => {
    const safeIndex = Number.isFinite(nextIndex) ? Math.floor(nextIndex) : -1
    replayIndex.value = Math.min(Math.max(safeIndex, -1), eventItems.value.length - 1)
  }

  watch(
    meetingId,
    (id) => {
      if (!id) return
      initStore(id)
    },
    { immediate: true }
  )

  onUnmounted(() => {
    stopStoreSubscriptions()
    stopService()
  })

  return {
    engineState,
    engineStateLabel,
    actionList,
    actionHint,
    eventTimeline,
    eventStats,
    replayIndex,
    replaySnapshot,
    appendMeetingEvent,
    requestMeetingAction,
    clearMeetingEvents,
    setReplayIndex
  }
}

export { useMeetingEngine }
