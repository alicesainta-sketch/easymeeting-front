const HOUR = 60 * 60 * 1000

const toIsoByOffset = (offsetHours) => new Date(Date.now() + offsetHours * HOUR).toISOString()

const meetings = [
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

const listMeetings = ({ keyword = '', status = 'all' } = {}) => {
  const search = keyword.trim().toLowerCase()
  return meetings
    .filter((meeting) => {
      const currentStatus = getMeetingStatus(meeting)
      if (status !== 'all' && currentStatus !== status) return false
      if (!search) return true
      return (
        meeting.title.toLowerCase().includes(search) ||
        meeting.topic.toLowerCase().includes(search) ||
        meeting.roomCode.toLowerCase().includes(search)
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

const getMeetingById = (id) => {
  return meetings.find((meeting) => meeting.id === id) || null
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
  const id = `mtg-${Date.now()}`
  const roomCode = `EASY-${Math.floor(1000 + Math.random() * 9000)}`
  const normalizedParticipants = participants.map((name) => name.trim()).filter(Boolean)
  const normalizedAgenda = agenda.map((line) => line.trim()).filter(Boolean)

  meetings.unshift({
    id,
    title,
    topic,
    roomCode,
    startTime,
    durationMinutes: Number(durationMinutes),
    host,
    participants: normalizedParticipants,
    agenda: normalizedAgenda,
    notes
  })
}

export { listMeetings, getMeetingStatus, getMeetingById, createMeeting }
