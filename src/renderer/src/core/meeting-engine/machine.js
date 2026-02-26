import { createMachine } from 'xstate'
import { MeetingEventType } from './protocol'

const MEETING_MACHINE_EVENTS = {
  START: 'START',
  PAUSE: 'PAUSE',
  RESUME: 'RESUME',
  END: 'END'
}

const MEETING_STATE_LABELS = {
  idle: '待开始',
  live: '进行中',
  paused: '已暂停',
  ended: '已结束'
}

// 会议状态机：只负责生命周期状态转换，不耦合 UI
const createMeetingMachine = () => {
  return createMachine({
    id: 'meeting-engine',
    initial: 'idle',
    states: {
      idle: {
        on: {
          [MEETING_MACHINE_EVENTS.START]: 'live',
          [MEETING_MACHINE_EVENTS.END]: 'ended'
        }
      },
      live: {
        on: {
          [MEETING_MACHINE_EVENTS.PAUSE]: 'paused',
          [MEETING_MACHINE_EVENTS.END]: 'ended'
        }
      },
      paused: {
        on: {
          [MEETING_MACHINE_EVENTS.RESUME]: 'live',
          [MEETING_MACHINE_EVENTS.END]: 'ended'
        }
      },
      ended: {
        type: 'final'
      }
    }
  })
}

const mapEventToMachineEvent = (event) => {
  if (!event?.type) return null
  if (event.type === MeetingEventType.MEETING_STARTED) {
    return { type: MEETING_MACHINE_EVENTS.START }
  }
  if (event.type === MeetingEventType.MEETING_PAUSED) {
    return { type: MEETING_MACHINE_EVENTS.PAUSE }
  }
  if (event.type === MeetingEventType.MEETING_RESUMED) {
    return { type: MEETING_MACHINE_EVENTS.RESUME }
  }
  if (event.type === MeetingEventType.MEETING_ENDED) {
    return { type: MEETING_MACHINE_EVENTS.END }
  }
  return null
}

const getMeetingStateLabel = (state) => {
  return MEETING_STATE_LABELS[state] || state || '未知'
}

export {
  createMeetingMachine,
  mapEventToMachineEvent,
  MEETING_MACHINE_EVENTS,
  MEETING_STATE_LABELS,
  getMeetingStateLabel
}
