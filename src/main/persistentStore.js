import Store from 'electron-store'

const STORE_KEYS = {
  meetings: 'meetings',
  currentUser: 'currentUser'
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
      notes: '已完成核心登录流程联调，会议模块进入前端联调阶段。'
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
      notes: '需要补充移动端最小宽度下的布局规则。'
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
      notes: '确认不依赖后端接口，以本地 mock 作为演示数据来源。'
    }
  ]
}

const appStore = new Store({
  name: 'easymeeting'
})

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

const createMeeting = ({
  title,
  topic,
  startTime,
  durationMinutes,
  host,
  participants = [],
  agenda = [],
  notes = ''
}) => {
  const meeting = {
    id: `mtg-${Date.now()}`,
    title: title?.trim() || '未命名会议',
    topic: topic?.trim() || '',
    roomCode: `EASY-${Math.floor(1000 + Math.random() * 9000)}`,
    startTime,
    durationMinutes: Number(durationMinutes),
    host: host?.trim() || '未知',
    participants: participants.map((name) => name.trim()).filter(Boolean),
    agenda: agenda.map((line) => line.trim()).filter(Boolean),
    notes: notes?.trim() || ''
  }

  const meetings = getMeetings()
  appStore.set(STORE_KEYS.meetings, [meeting, ...meetings])
  return meeting
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
  getCurrentUser,
  setCurrentUser,
  clearCurrentUser
}
