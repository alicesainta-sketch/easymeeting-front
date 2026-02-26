import { describe, expect, it } from 'vitest'
import {
  MeetingEventType,
  createMeetingMachine,
  getMeetingActionAvailability,
  buildMeetingSnapshot,
  mapEventToMachineEvent,
  buildEventTimeline,
  getMeetingStateFromEvents,
  buildEventMetrics,
  formatActorLabel,
  createMeetingEventStore,
  MAX_EVENT_COUNT
} from '../index'

// 说明：测试会议引擎的状态机、规则与事件回放，确保工程核心逻辑可验证

describe('meeting-engine machine', () => {
  it('transitions through start/pause/resume/end', () => {
    const machine = createMeetingMachine()
    const idleState = machine.initialState
    const liveState = machine.transition(idleState, { type: 'START' })
    const pausedState = machine.transition(liveState, { type: 'PAUSE' })
    const resumedState = machine.transition(pausedState, { type: 'RESUME' })
    const endedState = machine.transition(resumedState, { type: 'END' })

    expect(idleState.value).toBe('idle')
    expect(liveState.value).toBe('live')
    expect(pausedState.value).toBe('paused')
    expect(resumedState.value).toBe('live')
    expect(endedState.value).toBe('ended')
  })

  it('ignores unknown events', () => {
    const machine = createMeetingMachine()
    const idleState = machine.initialState
    const nextState = machine.transition(idleState, { type: 'UNKNOWN' })

    expect(nextState.value).toBe('idle')
  })

  it('maps meeting events to machine events', () => {
    expect(mapEventToMachineEvent({ type: MeetingEventType.MEETING_STARTED })?.type).toBe('START')
    expect(mapEventToMachineEvent({ type: MeetingEventType.MEETING_PAUSED })?.type).toBe('PAUSE')
    expect(mapEventToMachineEvent({ type: MeetingEventType.MEETING_RESUMED })?.type).toBe('RESUME')
    expect(mapEventToMachineEvent({ type: MeetingEventType.MEETING_ENDED })?.type).toBe('END')
    expect(mapEventToMachineEvent({ type: MeetingEventType.USER_JOINED })).toBeNull()
  })
})

describe('meeting-engine policies', () => {
  it('disables actions for non-moderator', () => {
    const actions = getMeetingActionAvailability({ state: 'idle', canModerate: false })
    expect(actions.every((item) => item.enabled === false)).toBe(true)
  })

  it('enables actions based on state', () => {
    const idleActions = getMeetingActionAvailability({ state: 'idle', canModerate: true })
    const liveActions = getMeetingActionAvailability({ state: 'live', canModerate: true })
    const pausedActions = getMeetingActionAvailability({ state: 'paused', canModerate: true })

    expect(idleActions.find((item) => item.key === 'start')?.enabled).toBe(true)
    expect(liveActions.find((item) => item.key === 'pause')?.enabled).toBe(true)
    expect(pausedActions.find((item) => item.key === 'resume')?.enabled).toBe(true)
  })

  it('disables all actions after meeting ended', () => {
    const endedActions = getMeetingActionAvailability({ state: 'ended', canModerate: true })
    expect(endedActions.every((item) => item.enabled === false)).toBe(true)
    expect(endedActions.find((item) => item.key === 'end')?.reason).toBe('会议已结束')
  })
})

describe('meeting-engine snapshot', () => {
  it('builds snapshot from events', () => {
    const machine = createMeetingMachine()
    const events = [
      {
        type: MeetingEventType.MEETING_STARTED,
        actor: { name: '主持人', role: 'host' },
        payload: {},
        timestamp: Date.now()
      },
      {
        type: MeetingEventType.USER_JOINED,
        actor: { name: '张三', role: 'participant' },
        payload: { name: '张三' },
        timestamp: Date.now()
      },
      {
        type: MeetingEventType.MIC_POLICY_CHANGED,
        actor: { name: '主持人', role: 'host' },
        payload: { allowParticipantMic: false },
        timestamp: Date.now()
      },
      {
        type: MeetingEventType.MEETING_LOCKED,
        actor: { name: '主持人', role: 'host' },
        payload: {},
        timestamp: Date.now()
      }
    ]

    const snapshot = buildMeetingSnapshot(events, machine)

    expect(snapshot.state).toBe('live')
    expect(snapshot.participantCount).toBe(1)
    expect(snapshot.allowParticipantMic).toBe(false)
    expect(snapshot.meetingLocked).toBe(true)
  })

  it('handles empty event list', () => {
    const machine = createMeetingMachine()
    const snapshot = buildMeetingSnapshot([], machine)

    expect(snapshot.state).toBe('idle')
    expect(snapshot.participantCount).toBe(0)
  })

  it('resolves latest policy switches', () => {
    const machine = createMeetingMachine()
    const events = [
      {
        type: MeetingEventType.MEETING_LOCKED,
        actor: { name: '主持人', role: 'host' },
        payload: {},
        timestamp: Date.now()
      },
      {
        type: MeetingEventType.MIC_POLICY_CHANGED,
        actor: { name: '主持人', role: 'host' },
        payload: { allowParticipantMic: false },
        timestamp: Date.now()
      },
      {
        type: MeetingEventType.MEETING_UNLOCKED,
        actor: { name: '主持人', role: 'host' },
        payload: {},
        timestamp: Date.now()
      },
      {
        type: MeetingEventType.MIC_POLICY_CHANGED,
        actor: { name: '主持人', role: 'host' },
        payload: { allowParticipantMic: true },
        timestamp: Date.now()
      }
    ]

    const snapshot = buildMeetingSnapshot(events, machine)

    expect(snapshot.meetingLocked).toBe(false)
    expect(snapshot.allowParticipantMic).toBe(true)
  })
})

describe('meeting-engine selectors', () => {
  it('builds timeline items with labels', () => {
    const events = [
      {
        id: 'evt-1',
        type: MeetingEventType.USER_JOINED,
        actor: { name: '张三', role: 'participant' },
        payload: { name: '张三' },
        timestamp: new Date('2024-01-01T10:00:00Z').getTime()
      }
    ]

    const timeline = buildEventTimeline(events)

    expect(timeline).toHaveLength(1)
    expect(timeline[0].title).toBe('成员加入')
    expect(timeline[0].actorLabel).toContain('参会者')
    expect(timeline[0].detail).toBe('—')
  })

  it('replays state from event stream', () => {
    const machine = createMeetingMachine()
    const events = [
      { type: MeetingEventType.MEETING_STARTED, timestamp: Date.now() },
      { type: MeetingEventType.MEETING_PAUSED, timestamp: Date.now() },
      { type: MeetingEventType.MEETING_RESUMED, timestamp: Date.now() },
      { type: MeetingEventType.MEETING_ENDED, timestamp: Date.now() }
    ]

    const state = getMeetingStateFromEvents(events, machine)

    expect(state.value).toBe('ended')
  })
})

describe('meeting-engine formatters & metrics', () => {
  it('formats actor labels with role suffix', () => {
    const label = formatActorLabel('Alex', 'host')
    expect(label).toBe('Alex（主持人）')
  })

  it('aggregates event metrics', () => {
    const events = [
      { type: MeetingEventType.USER_JOINED, actor: { role: 'participant' }, timestamp: 1 },
      { type: MeetingEventType.USER_LEFT, actor: { role: 'participant' }, timestamp: 2 },
      { type: MeetingEventType.MEETING_STARTED, actor: { role: 'host' }, timestamp: 3 }
    ]

    const metrics = buildEventMetrics(events)

    expect(metrics.total).toBe(3)
    expect(metrics.byType[MeetingEventType.USER_JOINED]).toBe(1)
    expect(metrics.byRole.participant).toBe(2)
    expect(metrics.lastEventAt).toBe(3)
  })
})

describe('meeting-engine eventStore', () => {
  const createLocalStorageMock = () => {
    const store = new Map()
    return {
      getItem: (key) => (store.has(key) ? store.get(key) : null),
      setItem: (key, value) => {
        store.set(key, String(value))
      },
      removeItem: (key) => {
        store.delete(key)
      },
      clear: () => {
        store.clear()
      }
    }
  }

  it('persists and clears events', () => {
    globalThis.localStorage = createLocalStorageMock()
    const store = createMeetingEventStore({ meetingId: 'mtg-01' })
    const event = { id: 'evt-1', type: MeetingEventType.USER_JOINED, timestamp: 1 }

    expect(store.loadEvents()).toHaveLength(0)

    store.appendEvent(event)
    expect(store.getEvents()).toHaveLength(1)

    store.clearEvents()
    expect(store.getEvents()).toHaveLength(0)
  })

  it('limits stored events by MAX_EVENT_COUNT', () => {
    globalThis.localStorage = createLocalStorageMock()
    const store = createMeetingEventStore({ meetingId: 'mtg-02' })

    for (let i = 0; i < MAX_EVENT_COUNT + 5; i += 1) {
      store.appendEvent({ id: `evt-${i}`, type: MeetingEventType.USER_JOINED, timestamp: i })
    }

    expect(store.getEvents()).toHaveLength(MAX_EVENT_COUNT)
    expect(store.getEvents()[0].id).toBe(`evt-${5}`)
  })

  it('notifies subscribers on append', () => {
    globalThis.localStorage = createLocalStorageMock()
    const store = createMeetingEventStore({ meetingId: 'mtg-03' })
    let capturedEvent = null
    let capturedList = null

    const offEvent = store.subscribe((event) => {
      capturedEvent = event
    })
    const offEvents = store.subscribeEvents((events) => {
      capturedList = events
    })

    const event = { id: 'evt-2', type: MeetingEventType.USER_JOINED, timestamp: 2 }
    store.appendEvent(event)

    expect(capturedEvent).toEqual(event)
    expect(capturedList).toHaveLength(1)

    offEvent()
    offEvents()
  })
})
