import Store from 'electron-store'

const STORE_KEYS = {
  meetings: 'meetings',
  currentUser: 'currentUser',
  auditLogs: 'auditLogs',
  meetingIdempotency: 'meetingIdempotency'
}

const HOUR = 60 * 60 * 1000
const toIsoByOffset = (offsetHours) => new Date(Date.now() + offsetHours * HOUR).toISOString()

const createSeedMeetings = () => {
  return [
    {
      id: 'mtg-1001',
      title: '项目周会',
      topic: '迭代进度同步与风险评估',
      roomCode: 'EASY-1024',
      startTime: toIsoByOffset(-0.5),
      durationMinutes: 45,
      host: '王珊',
      participants: ['王珊', '赵明', '李卓', '陈音'],
      agenda: ['迭代目标回顾', '阻塞问题讨论', '下周分工确认'],
      notes: '已完成核心登录流程联调，会议模块进入前端联调阶段。',
      roomPassword: '',
      allowParticipantEarlyJoin: true,
      waitingRoomWhitelist: ['赵明']
    },
    {
      id: 'mtg-1002',
      title: '产品评审会',
      topic: '会议详情页交互评审',
      roomCode: 'EASY-2048',
      startTime: toIsoByOffset(3),
      durationMinutes: 60,
      host: '孙杰',
      participants: ['孙杰', '周宁', '刘月', '郑凯'],
      agenda: ['视觉稿走查', '交互动效确认', '验收标准对齐'],
      notes: '需要补充移动端最小宽度下的布局规则。',
      roomPassword: '2468',
      allowParticipantEarlyJoin: false,
      waitingRoomWhitelist: ['周宁', '刘月']
    },
    {
      id: 'mtg-1003',
      title: '技术方案会',
      topic: '纯前端本地数据层设计',
      roomCode: 'EASY-4096',
      startTime: toIsoByOffset(-26),
      durationMinutes: 30,
      host: '陈楠',
      participants: ['陈楠', '宋林', '吴航'],
      agenda: ['数据结构设计', '路由组织方案', '演示流程定义'],
      notes: '确认不依赖后端接口，以本地 mock 作为演示数据来源。',
      roomPassword: '',
      allowParticipantEarlyJoin: true,
      waitingRoomWhitelist: []
    }
  ]
}

const appStore = new Store({
  name: 'easymeeting'
})

const buildMeetingId = () => {
  if (globalThis.crypto?.randomUUID) {
    return `mtg-${globalThis.crypto.randomUUID()}`
  }
  return `mtg-${Date.now()}-${Math.floor(Math.random() * 10000)}`
}

const buildRoomCode = () => {
  return `EASY-${Math.floor(1000 + Math.random() * 9000)}`
}

const generateUniqueMeetingId = (meetings) => {
  const existingIds = new Set(meetings.map((meeting) => meeting.id))
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const id = buildMeetingId()
    if (!existingIds.has(id)) return id
  }
  return `${buildMeetingId()}-${Date.now()}`
}

const generateUniqueRoomCode = (meetings) => {
  const existingCodes = new Set(meetings.map((meeting) => meeting.roomCode))
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const code = buildRoomCode()
    if (!existingCodes.has(code)) return code
  }
  return `${buildRoomCode()}-${Math.floor(Math.random() * 1000)}`
}

const ensureMeetingSeed = () => {
  if (!appStore.has(STORE_KEYS.meetings)) {
    appStore.set(STORE_KEYS.meetings, createSeedMeetings())
  }
}

const getMeetings = () => {
  ensureMeetingSeed()
  const meetings = appStore.get(STORE_KEYS.meetings, [])
  return Array.isArray(meetings) ? meetings : []
}

const getMeetingById = (id) => {
  return getMeetings().find((meeting) => meeting.id === id) || null
}

// 会议字段归一化：保证会议核心字段一致且可持久化
const normalizeMeetingPayload = ({
  title,
  topic,
  startTime,
  durationMinutes,
  host,
  roomCode,
  participants = [],
  agenda = [],
  notes = '',
  roomPassword = '',
  allowParticipantEarlyJoin = true,
  waitingRoomWhitelist = []
}) => {
  return {
    title: title?.trim() || '未命名会议',
    topic: topic?.trim() || '',
    startTime,
    durationMinutes: Number(durationMinutes),
    host: host?.trim() || '未知',
    roomCode: roomCode?.trim?.() || '',
    participants: participants.map((name) => name.trim()).filter(Boolean),
    agenda: agenda.map((line) => line.trim()).filter(Boolean),
    notes: notes?.trim() || '',
    roomPassword: roomPassword?.trim() || '',
    allowParticipantEarlyJoin: Boolean(allowParticipantEarlyJoin),
    waitingRoomWhitelist: waitingRoomWhitelist.map((name) => name.trim()).filter(Boolean)
  }
}

// 会议时间窗：用于会议室冲突检测与统计
const buildMeetingWindow = (meeting) => {
  const start = new Date(meeting.startTime).getTime()
  const duration = Number(meeting.durationMinutes || 0)
  if (!Number.isFinite(start) || !Number.isFinite(duration) || duration <= 0) {
    return null
  }
  return {
    start,
    end: start + duration * 60 * 1000
  }
}

// 核心逻辑：判断两个时间段是否重叠（边界相等视为不冲突）
const isTimeOverlap = (windowA, windowB) => {
  return windowA.start < windowB.end && windowB.start < windowA.end
}

const findRoomConflict = (meetings, candidate, { excludeId } = {}) => {
  if (!candidate?.roomCode) return null
  const candidateWindow = buildMeetingWindow(candidate)
  if (!candidateWindow) return null
  return (
    meetings.find((meeting) => {
      if (excludeId && meeting.id === excludeId) return false
      if (meeting.roomCode !== candidate.roomCode) return false
      const meetingWindow = buildMeetingWindow(meeting)
      if (!meetingWindow) return false
      return isTimeOverlap(candidateWindow, meetingWindow)
    }) || null
  )
}

const getAuditLogs = () => {
  const logs = appStore.get(STORE_KEYS.auditLogs, [])
  return Array.isArray(logs) ? logs : []
}

const appendAuditLog = (log) => {
  const logs = getAuditLogs()
  appStore.set(STORE_KEYS.auditLogs, [log, ...logs].slice(0, 200))
}

const buildAuditLog = ({ action, meeting, operator = '系统', summary = '' }) => {
  const actionLabelMap = {
    create: '创建会议',
    update: '更新会议',
    delete: '删除会议'
  }
  return {
    id: `audit-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    action,
    actionLabel: actionLabelMap[action] || '会议变更',
    meetingId: meeting?.id || '',
    title: meeting?.title || '未命名会议',
    roomCode: meeting?.roomCode || '未分配',
    operator,
    summary,
    createdAt: new Date().toISOString()
  }
}

const getIdempotencyMap = () => {
  const map = appStore.get(STORE_KEYS.meetingIdempotency, {})
  return map && typeof map === 'object' ? map : {}
}

const saveIdempotencyMap = (map) => {
  appStore.set(STORE_KEYS.meetingIdempotency, map)
}

// 幂等处理：若幂等键已存在且会议仍可用，则直接返回该会议
const getIdempotentMeeting = (meetings, idempotencyKey) => {
  if (!idempotencyKey) return null
  const map = getIdempotencyMap()
  const meetingId = map[idempotencyKey]
  if (!meetingId) return null
  const meeting = meetings.find((item) => item.id === meetingId)
  if (meeting) return meeting
  delete map[idempotencyKey]
  saveIdempotencyMap(map)
  return null
}

const recordIdempotencyKey = (idempotencyKey, meetingId) => {
  if (!idempotencyKey || !meetingId) return
  const map = getIdempotencyMap()
  map[idempotencyKey] = meetingId
  saveIdempotencyMap(map)
}

const createMeeting = (payload) => {
  const meetings = getMeetings()
  const normalizedPayload = normalizeMeetingPayload(payload || {})
  const idempotencyKey = payload?.idempotencyKey?.trim?.() || ''
  const operator =
    payload?.auditMeta?.operator ||
    getCurrentUser()?.nickname ||
    getCurrentUser()?.email ||
    '系统'

  const idempotentMeeting = getIdempotentMeeting(meetings, idempotencyKey)
  if (idempotentMeeting) return idempotentMeeting

  const roomCode = normalizedPayload.roomCode || generateUniqueRoomCode(meetings)
  const candidate = {
    ...normalizedPayload,
    roomCode
  }
  const conflict = findRoomConflict(meetings, candidate)
  if (conflict) {
    return {
      error: {
        code: 'ROOM_CONFLICT',
        message: `会议室 ${roomCode} 在该时间段已被占用`
      }
    }
  }

  const meeting = {
    id: generateUniqueMeetingId(meetings),
    ...candidate
  }

  appStore.set(STORE_KEYS.meetings, [meeting, ...meetings])
  recordIdempotencyKey(idempotencyKey, meeting.id)
  appendAuditLog(
    buildAuditLog({
      action: 'create',
      meeting,
      operator,
      summary: '创建会议并生成会议室排期'
    })
  )
  return meeting
}

const updateMeeting = (id, payload) => {
  const meetings = getMeetings()
  const current = meetings.find((meeting) => meeting.id === id)
  if (!current) return null

  const normalizedPayload = normalizeMeetingPayload({
    ...current,
    ...payload
  })
  const operator =
    payload?.auditMeta?.operator ||
    getCurrentUser()?.nickname ||
    getCurrentUser()?.email ||
    '系统'

  const updated = {
    ...current,
    ...normalizedPayload,
    id: current.id,
    roomCode: normalizedPayload.roomCode || current.roomCode
  }
  const conflict = findRoomConflict(meetings, updated, { excludeId: current.id })
  if (conflict) {
    return {
      error: {
        code: 'ROOM_CONFLICT',
        message: `会议室 ${updated.roomCode} 在该时间段已被占用`
      }
    }
  }

  appStore.set(
    STORE_KEYS.meetings,
    meetings.map((meeting) => (meeting.id === id ? updated : meeting))
  )
  appendAuditLog(
    buildAuditLog({
      action: 'update',
      meeting: updated,
      operator,
      summary: '更新会议核心信息'
    })
  )
  return updated
}

const deleteMeeting = (id, options = {}) => {
  const meetings = getMeetings()
  const nextMeetings = meetings.filter((meeting) => meeting.id !== id)
  if (nextMeetings.length === meetings.length) {
    return false
  }
  const removed = meetings.find((meeting) => meeting.id === id)
  const operator =
    options?.auditMeta?.operator ||
    getCurrentUser()?.nickname ||
    getCurrentUser()?.email ||
    '系统'
  appStore.set(STORE_KEYS.meetings, nextMeetings)
  if (removed) {
    appendAuditLog(
      buildAuditLog({
        action: 'delete',
        meeting: removed,
        operator,
        summary: '删除会议并释放会议室'
      })
    )
  }
  return true
}

const getCurrentUser = () => {
  return appStore.get(STORE_KEYS.currentUser, null)
}

const setCurrentUser = (user) => {
  appStore.set(STORE_KEYS.currentUser, user)
}

const clearCurrentUser = () => {
  appStore.delete(STORE_KEYS.currentUser)
}

export {
  getMeetings,
  getMeetingById,
  createMeeting,
  updateMeeting,
  deleteMeeting,
  getAuditLogs,
  getCurrentUser,
  setCurrentUser,
  clearCurrentUser
}
