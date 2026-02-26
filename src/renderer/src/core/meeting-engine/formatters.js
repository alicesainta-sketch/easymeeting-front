import { MeetingEventType } from './protocol'

const EVENT_TYPE_LABELS = {
  [MeetingEventType.MEETING_STARTED]: '会议开始',
  [MeetingEventType.MEETING_PAUSED]: '会议暂停',
  [MeetingEventType.MEETING_RESUMED]: '会议继续',
  [MeetingEventType.MEETING_ENDED]: '会议结束',
  [MeetingEventType.USER_JOINED]: '成员加入',
  [MeetingEventType.USER_LEFT]: '成员离开',
  [MeetingEventType.ROLE_CHANGED]: '角色调整',
  [MeetingEventType.MIC_TOGGLED]: '麦克风切换',
  [MeetingEventType.CAMERA_TOGGLED]: '摄像头切换',
  [MeetingEventType.HAND_RAISED]: '举手',
  [MeetingEventType.HAND_LOWERED]: '放下举手',
  [MeetingEventType.SCREEN_SHARE_STARTED]: '开始共享',
  [MeetingEventType.SCREEN_SHARE_STOPPED]: '停止共享',
  [MeetingEventType.MEETING_LOCKED]: '会议锁定',
  [MeetingEventType.MEETING_UNLOCKED]: '会议解锁',
  [MeetingEventType.MIC_POLICY_CHANGED]: '发言策略更新',
  [MeetingEventType.SPEAKER_ALLOWED]: '允许发言',
  [MeetingEventType.WAIT_APPROVED]: '等候室通过',
  [MeetingEventType.WAIT_REJECTED]: '等候室拒绝'
}

const ROLE_LABELS = {
  host: '主持人',
  cohost: '联席主持人',
  participant: '参会者',
  system: '系统'
}

// Format event time for timeline display.
const formatEventTime = (timestamp) => {
  return new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(new Date(timestamp))
}

// Resolve event label for UI display, fallback to raw type.
const getEventLabel = (event) => {
  return EVENT_TYPE_LABELS[event.type] || event.type
}

// Resolve role label for UI display, fallback to raw role.
const getRoleLabel = (role) => {
  return ROLE_LABELS[role] || role || '未知'
}

// Format actor label with role suffix to keep consistent UI display.
const formatActorLabel = (name, role) => {
  const safeName = name || '系统'
  return `${safeName}（${getRoleLabel(role)}）`
}

export {
  EVENT_TYPE_LABELS,
  ROLE_LABELS,
  formatEventTime,
  getEventLabel,
  getRoleLabel,
  formatActorLabel
}
