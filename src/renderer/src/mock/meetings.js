import { appendLocalAuditLog } from './auditLogs'

const MEETINGS_STORAGE_KEY = 'easymeeting-meetings'
const IDEMPOTENCY_STORAGE_KEY = 'easymeeting-meeting-idempotency'
const HOUR = 60 * 60 * 1000
const toIsoByOffset = (offsetHours) => new Date(Date.now() + offsetHours * HOUR).toISOString()

const createSeedMeetings = () => [
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
    topic: '本地数据层设计',
    roomCode: 'EASY-4096',
    startTime: toIsoByOffset(-26),
    durationMinutes: 30,
    host: '陈楠',
    participants: ['陈楠', '宋林', '吴航'],
    agenda: ['数据结构设计', '路由组织方案', '流程定义'],
    notes: '会议资料已同步，支持离线查看。',
    roomPassword: '',
    allowParticipantEarlyJoin: true,
    waitingRoomWhitelist: []
  }
]

const canUseElectronStore = () => {
  return Boolean(window?.electron?.ipcRenderer?.invoke)
}

const getLocalMeetings = () => {
  const raw = localStorage.getItem(MEETINGS_STORAGE_KEY)
  if (!raw) return []
  try {
    const meetings = JSON.parse(raw)
    return Array.isArray(meetings) ? meetings : []
  } catch {
    return []
  }
}

const saveLocalMeetings = (meetings) => {
  localStorage.setItem(MEETINGS_STORAGE_KEY, JSON.stringify(meetings))
}

const ensureLocalMeetingSeed = () => {
  if (!localStorage.getItem(MEETINGS_STORAGE_KEY)) {
    saveLocalMeetings(createSeedMeetings())
  }
}

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

const buildBusinessError = (message, code) => {
  const error = new Error(message)
  error.code = code
  return error
}

const getIdempotencyMap = () => {
  const raw = localStorage.getItem(IDEMPOTENCY_STORAGE_KEY)
  if (!raw) return {}
  try {
    const map = JSON.parse(raw)
    return map && typeof map === 'object' ? map : {}
  } catch {
    return {}
  }
}

const saveIdempotencyMap = (map) => {
  localStorage.setItem(IDEMPOTENCY_STORAGE_KEY, JSON.stringify(map))
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

const getAllMeetings = async () => {
  if (canUseElectronStore()) {
    try {
      const meetings = await window.electron.ipcRenderer.invoke('meetings:list')
      return Array.isArray(meetings) ? meetings : []
    } catch {
      // Fallback to localStorage when running in plain web mode.
    }
  }

  ensureLocalMeetingSeed()
  return getLocalMeetings()
}

const statusRank = {
  live: 0,
  upcoming: 1,
  finished: 2
}

const getMeetingStatus = (meeting, nowTime = Date.now()) => {
  const start = new Date(meeting.startTime).getTime()
  const end = start + meeting.durationMinutes * 60 * 1000
  if (nowTime >= start && nowTime <= end) return 'live'
  if (nowTime < start) return 'upcoming'
  return 'finished'
}

const listMeetings = async ({ keyword = '', status = 'all' } = {}) => {
  const meetings = await getAllMeetings()
  const search = keyword.trim().toLowerCase()
  const normalizeText = (value) => String(value ?? '').toLowerCase()
  return meetings
    .filter((meeting) => {
      const currentStatus = getMeetingStatus(meeting)
      if (status !== 'all' && currentStatus !== status) return false
      if (!search) return true
      return (
        normalizeText(meeting.title).includes(search) ||
        normalizeText(meeting.topic).includes(search) ||
        normalizeText(meeting.roomCode).includes(search)
      )
    })
    .sort((a, b) => {
      const statusA = getMeetingStatus(a)
      const statusB = getMeetingStatus(b)
      if (statusRank[statusA] !== statusRank[statusB]) {
        return statusRank[statusA] - statusRank[statusB]
      }

      const timeA = new Date(a.startTime).getTime()
      const timeB = new Date(b.startTime).getTime()
      if (statusA === 'finished') {
        return timeB - timeA
      }
      return timeA - timeB
    })
}

const getMeetingById = async (id) => {
  if (canUseElectronStore()) {
    try {
      return await window.electron.ipcRenderer.invoke('meetings:getById', id)
    } catch {
      // Fallback to localStorage when running in plain web mode.
    }
  }

  ensureLocalMeetingSeed()
  return getLocalMeetings().find((meeting) => meeting.id === id) || null
}

const createMeeting = async (payload) => {
  const normalizedPayload = normalizeMeetingPayload(payload || {})
  const idempotencyKey = payload?.idempotencyKey?.trim?.() || ''
  const operator = payload?.auditMeta?.operator || '系统'

  if (canUseElectronStore()) {
    try {
      const result = await window.electron.ipcRenderer.invoke('meetings:create', {
        ...normalizedPayload,
        idempotencyKey,
        auditMeta: { operator }
      })
      if (result?.error) {
        throw buildBusinessError(result.error.message, result.error.code)
      }
      return result
    } catch (error) {
      if (error?.code) throw error
      // Fallback to localStorage when running in plain web mode.
    }
  }

  ensureLocalMeetingSeed()
  const meetings = getLocalMeetings()
  const idempotentMeeting = getIdempotentMeeting(meetings, idempotencyKey)
  if (idempotentMeeting) return idempotentMeeting

  const roomCode = normalizedPayload.roomCode || generateUniqueRoomCode(meetings)
  const candidate = {
    ...normalizedPayload,
    roomCode
  }
  const conflict = findRoomConflict(meetings, candidate)
  if (conflict) {
    throw buildBusinessError(`会议室 ${roomCode} 在该时间段已被占用`, 'ROOM_CONFLICT')
  }

  const meeting = {
    id: generateUniqueMeetingId(meetings),
    ...candidate
  }
  saveLocalMeetings([meeting, ...meetings])
  recordIdempotencyKey(idempotencyKey, meeting.id)
  appendLocalAuditLog(
    buildAuditLog({
      action: 'create',
      meeting,
      operator,
      summary: '创建会议并生成会议室排期'
    })
  )
  return meeting
}

const updateMeeting = async (id, payload) => {
  const normalizedPayload = normalizeMeetingPayload(payload || {})
  const operator = payload?.auditMeta?.operator || '系统'

  if (canUseElectronStore()) {
    try {
      const result = await window.electron.ipcRenderer.invoke('meetings:update', id, {
        ...normalizedPayload,
        auditMeta: { operator }
      })
      if (result?.error) {
        throw buildBusinessError(result.error.message, result.error.code)
      }
      return result
    } catch (error) {
      if (error?.code) throw error
      // Fallback to localStorage when running in plain web mode.
    }
  }

  ensureLocalMeetingSeed()
  const meetings = getLocalMeetings()
  const current = meetings.find((meeting) => meeting.id === id)
  if (!current) return null

  const updated = {
    ...current,
    ...normalizedPayload,
    id: current.id,
    roomCode: normalizedPayload.roomCode || current.roomCode
  }
  const conflict = findRoomConflict(meetings, updated, { excludeId: current.id })
  if (conflict) {
    throw buildBusinessError(`会议室 ${updated.roomCode} 在该时间段已被占用`, 'ROOM_CONFLICT')
  }

  saveLocalMeetings(meetings.map((meeting) => (meeting.id === id ? updated : meeting)))
  appendLocalAuditLog(
    buildAuditLog({
      action: 'update',
      meeting: updated,
      operator,
      summary: '更新会议核心信息'
    })
  )
  return updated
}

const deleteMeeting = async (id, options = {}) => {
  const operator = options?.auditMeta?.operator || '系统'
  if (canUseElectronStore()) {
    try {
      const result = await window.electron.ipcRenderer.invoke('meetings:delete', id, {
        auditMeta: { operator }
      })
      if (result?.error) {
        throw buildBusinessError(result.error.message, result.error.code)
      }
      return result
    } catch (error) {
      if (error?.code) throw error
      // Fallback to localStorage when running in plain web mode.
    }
  }

  ensureLocalMeetingSeed()
  const meetings = getLocalMeetings()
  const nextMeetings = meetings.filter((meeting) => meeting.id !== id)
  if (nextMeetings.length === meetings.length) return false
  const removed = meetings.find((meeting) => meeting.id === id)
  saveLocalMeetings(nextMeetings)
  if (removed) {
    appendLocalAuditLog(
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

export {
  listMeetings,
  getMeetingStatus,
  getMeetingById,
  createMeeting,
  updateMeeting,
  deleteMeeting
}
