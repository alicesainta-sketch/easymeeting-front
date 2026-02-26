const EVENT_VERSION = 1

// 会议引擎事件类型，用于事件溯源与状态机转换
const MeetingEventType = {
  MEETING_STARTED: 'MEETING_STARTED',
  MEETING_PAUSED: 'MEETING_PAUSED',
  MEETING_RESUMED: 'MEETING_RESUMED',
  MEETING_ENDED: 'MEETING_ENDED',
  USER_JOINED: 'USER_JOINED',
  USER_LEFT: 'USER_LEFT',
  ROLE_CHANGED: 'ROLE_CHANGED',
  MIC_TOGGLED: 'MIC_TOGGLED',
  CAMERA_TOGGLED: 'CAMERA_TOGGLED',
  HAND_RAISED: 'HAND_RAISED',
  HAND_LOWERED: 'HAND_LOWERED',
  SCREEN_SHARE_STARTED: 'SCREEN_SHARE_STARTED',
  SCREEN_SHARE_STOPPED: 'SCREEN_SHARE_STOPPED',
  MEETING_LOCKED: 'MEETING_LOCKED',
  MEETING_UNLOCKED: 'MEETING_UNLOCKED',
  MIC_POLICY_CHANGED: 'MIC_POLICY_CHANGED',
  SPEAKER_ALLOWED: 'SPEAKER_ALLOWED',
  WAIT_APPROVED: 'WAIT_APPROVED',
  WAIT_REJECTED: 'WAIT_REJECTED'
}

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

// 事件时间统一格式化，便于时间线展示与回放定位
const formatEventTime = (timestamp) => {
  return new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(new Date(timestamp))
}

// 事件类型转中文标签，未知类型保留原值
const getEventLabel = (event) => {
  return EVENT_TYPE_LABELS[event.type] || event.type
}

// 角色展示文案，兜底避免空值导致 UI 异常
const getRoleLabel = (role) => {
  return ROLE_LABELS[role] || role || '未知'
}

export {
  MeetingEventType,
  EVENT_TYPE_LABELS,
  createMeetingEvent,
  formatEventTime,
  getEventLabel,
  getRoleLabel
}
