const MEETINGS_STORAGE_KEY = 'easymeeting-meetings'
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

const normalizeMeetingPayload = ({
  title,
  topic,
  startTime,
  durationMinutes,
  host,
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
    participants: participants.map((name) => name.trim()).filter(Boolean),
    agenda: agenda.map((line) => line.trim()).filter(Boolean),
    notes: notes?.trim() || '',
    roomPassword: roomPassword?.trim() || '',
    allowParticipantEarlyJoin: Boolean(allowParticipantEarlyJoin),
    waitingRoomWhitelist: waitingRoomWhitelist.map((name) => name.trim()).filter(Boolean)
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

const createMeeting = async ({
  title,
  topic,
  startTime,
  durationMinutes,
  host,
  participants = [],
  agenda = [],
  notes = ''
}) => {
  const payload = normalizeMeetingPayload({
    title,
    topic,
    startTime,
    durationMinutes,
    host,
    participants,
    agenda,
    notes
  })

  if (canUseElectronStore()) {
    try {
      return await window.electron.ipcRenderer.invoke('meetings:create', payload)
    } catch {
      // Fallback to localStorage when running in plain web mode.
    }
  }

  ensureLocalMeetingSeed()
  const meetings = getLocalMeetings()
  const meeting = {
    id: generateUniqueMeetingId(meetings),
    ...payload,
    roomCode: generateUniqueRoomCode(meetings)
  }
  saveLocalMeetings([meeting, ...meetings])
  return meeting
}

const updateMeeting = async (id, payload) => {
  const normalizedPayload = normalizeMeetingPayload(payload)

  if (canUseElectronStore()) {
    try {
      return await window.electron.ipcRenderer.invoke('meetings:update', id, normalizedPayload)
    } catch {
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
    roomCode: current.roomCode
  }
  saveLocalMeetings(meetings.map((meeting) => (meeting.id === id ? updated : meeting)))
  return updated
}

const deleteMeeting = async (id) => {
  if (canUseElectronStore()) {
    try {
      return await window.electron.ipcRenderer.invoke('meetings:delete', id)
    } catch {
      // Fallback to localStorage when running in plain web mode.
    }
  }

  ensureLocalMeetingSeed()
  const meetings = getLocalMeetings()
  const nextMeetings = meetings.filter((meeting) => meeting.id !== id)
  if (nextMeetings.length === meetings.length) return false
  saveLocalMeetings(nextMeetings)
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
