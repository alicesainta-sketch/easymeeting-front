import { MeetingEventType } from './protocol'
import { formatActorLabel, formatEventTime, getEventLabel } from './formatters'
import { getMeetingStateLabel, mapEventToMachineEvent } from './machine'

const resolveActorName = (event) => {
  return event?.payload?.name || event?.actor?.name || '未知'
}

const buildEventDetail = (event) => {
  const payload = event?.payload || {}
  switch (event?.type) {
    case MeetingEventType.MIC_TOGGLED:
      return payload.enabled ? '麦克风已开启' : '麦克风已关闭'
    case MeetingEventType.CAMERA_TOGGLED:
      return payload.enabled ? '摄像头已开启' : '摄像头已关闭'
    case MeetingEventType.HAND_RAISED:
      return '举手请求已提交'
    case MeetingEventType.HAND_LOWERED:
      return '举手已放下'
    case MeetingEventType.SCREEN_SHARE_STARTED:
      return '开始共享屏幕'
    case MeetingEventType.SCREEN_SHARE_STOPPED:
      return '停止共享屏幕'
    case MeetingEventType.MIC_POLICY_CHANGED:
      return payload.allowParticipantMic ? '允许参会者自主持麦' : '参会者发言需审批'
    case MeetingEventType.SPEAKER_ALLOWED:
      return `允许 ${payload.name || '成员'} 发言`
    case MeetingEventType.MEETING_LOCKED:
      return '新成员需审批'
    case MeetingEventType.MEETING_UNLOCKED:
      return '允许直接入会'
    case MeetingEventType.WAIT_APPROVED:
      return `${payload.name || '成员'} 已通过等候室`
    case MeetingEventType.WAIT_REJECTED:
      return `${payload.name || '成员'} 已被拒绝`
    default:
      return payload.reason || '—'
  }
}

// 生成时间线展示数据，提供给 UI
const buildEventTimeline = (events = []) => {
  return events.map((event) => {
    const actorRole = event?.actor?.role || 'system'
    const actorName = event?.actor?.name || '系统'
    return {
      id: event.id,
      timeLabel: formatEventTime(event.timestamp),
      title: getEventLabel(event),
      actorLabel: formatActorLabel(actorName, actorRole),
      detail: buildEventDetail(event),
      raw: event
    }
  })
}

// 基于事件流回放会议状态机
const getMeetingStateFromEvents = (events, machine) => {
  let currentState = machine.initialState
  for (const event of events) {
    const machineEvent = mapEventToMachineEvent(event)
    if (!machineEvent) continue
    currentState = machine.transition(currentState, machineEvent)
  }
  return currentState
}

// 根据事件回放生成快照，用于时间线回放展示
// 边界说明：当事件为空时，回放为初始状态与 0 参会者
const buildMeetingSnapshot = (events, machine) => {
  const participants = new Set()
  let allowParticipantMic = true
  let meetingLocked = false

  for (const event of events) {
    if (event.type === MeetingEventType.USER_JOINED) {
      participants.add(resolveActorName(event))
    }
    if (event.type === MeetingEventType.USER_LEFT) {
      participants.delete(resolveActorName(event))
    }
    if (event.type === MeetingEventType.MIC_POLICY_CHANGED) {
      allowParticipantMic = Boolean(event.payload?.allowParticipantMic)
    }
    if (event.type === MeetingEventType.MEETING_LOCKED) {
      meetingLocked = true
    }
    if (event.type === MeetingEventType.MEETING_UNLOCKED) {
      meetingLocked = false
    }
  }

  const meetingState = getMeetingStateFromEvents(events, machine)
  return {
    state: meetingState.value,
    stateLabel: getMeetingStateLabel(meetingState.value),
    participantCount: participants.size,
    allowParticipantMic,
    meetingLocked
  }
}

export { buildEventTimeline, buildMeetingSnapshot, getMeetingStateFromEvents }
