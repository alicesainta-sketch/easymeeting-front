import { describe, expect, it } from 'vitest'
import {
  MeetingEventType,
  createMeetingMachine,
  getMeetingActionAvailability,
  buildMeetingSnapshot,
  mapEventToMachineEvent,
  buildEventTimeline,
  getMeetingStateFromEvents
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
