import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'
import { useRouter } from 'vue-router'
import {
  createMeeting,
  deleteMeeting,
  getMeetingStatus,
  listMeetings,
  updateMeeting
} from '@/mock/meetings'
import { clearCurrentUser, getCurrentUser } from '@/utils/auth'
import {
  MINUTE,
  formatCountdown,
  formatRemainingText,
  getMeetingRemainingMs,
  getDuplicateStartTime
} from '@/utils/meetingTime'
import { clearMeetingReminders, shouldNotifyReminder } from '@/utils/meetingReminder'
import { setWorkspaceMode } from '@/utils/workspaceMode'
import {
  buildMeetingFormFromMeeting,
  buildMeetingPayload,
  createMeetingForm,
  resetMeetingForm
} from '@/views/Meeting/composables/meetingForm'
import { STATUS_MAP } from '@/views/Meeting/composables/meetingStatus'
import { validateMeetingForm } from './validateMeetingForm'

const useMeetingList = () => {
  const router = useRouter()
  const currentUser = getCurrentUser()
  const displayName = computed(() => currentUser?.nickname || currentUser?.email || '用户')

  const keyword = ref('')
  const statusFilter = ref('all')
  const sortMode = ref('smart')
  const viewMode = ref('cards')
  const meetingItems = ref([])
  const nowTime = ref(Date.now())
  const REMIND_TEN_MINUTES = 10 * MINUTE
  const REMIND_ONE_MINUTE = 1 * MINUTE
  let clockTimer = null
  let clockTicks = 0

  const statusMap = STATUS_MAP

  const getStatus = (meeting) => {
    return getMeetingStatus(meeting, nowTime.value)
  }

  const getCountdownMs = (meeting) => {
    return getMeetingRemainingMs(meeting.startTime, nowTime.value)
  }

  const getMeetingWindow = (meeting) => {
    const start = new Date(meeting.startTime).getTime()
    return {
      start,
      end: start + meeting.durationMinutes * MINUTE
    }
  }

  const getCountdownLabel = (meeting) => {
    const status = getStatus(meeting)
    if (status === 'live') return '进行中'
    if (status === 'finished') return '已结束'
    return formatCountdown(getCountdownMs(meeting))
  }

  const getCountdownClass = (meeting) => {
    const status = getStatus(meeting)
    if (status === 'live') return 'text-emerald-600'
    if (status === 'finished') return 'text-slate-400'
    const remaining = getCountdownMs(meeting)
    if (remaining <= REMIND_ONE_MINUTE) return 'text-rose-600'
    if (remaining <= REMIND_TEN_MINUTES) return 'text-amber-600'
    return 'text-slate-500'
  }

  const sortMeetings = (items) => {
    if (sortMode.value === 'start-asc') {
      return [...items].sort(
        (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      )
    }
    if (sortMode.value === 'start-desc') {
      return [...items].sort(
        (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
      )
    }
    return items
  }

  const loadMeetings = async () => {
    const meetings = await listMeetings({
      keyword: keyword.value,
      status: statusFilter.value
    })
    meetingItems.value = sortMeetings(meetings)
  }

  const refreshMeetings = async () => {
    await loadMeetings()
  }

  const formatTimeRange = (startTime, durationMinutes) => {
    const start = new Date(startTime)
    const end = new Date(start.getTime() + durationMinutes * 60 * 1000)
    const formatter = new Intl.DateTimeFormat('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
    return `${formatter.format(start)} - ${formatter.format(end)}`
  }

  const formatShortTime = (dateTime) => {
    return new Intl.DateTimeFormat('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateTime))
  }

  const getDayRange = (time) => {
    const base = new Date(time)
    const start = new Date(base)
    start.setHours(0, 0, 0, 0)
    const end = new Date(base)
    end.setHours(23, 59, 59, 999)
    return { start, end }
  }

  const isSameDay = (time, anchor) => {
    const target = new Date(time)
    const anchorDate = new Date(anchor)
    return (
      target.getFullYear() === anchorDate.getFullYear() &&
      target.getMonth() === anchorDate.getMonth() &&
      target.getDate() === anchorDate.getDate()
    )
  }

  const formatDateLabel = (time) => {
    const base = new Date(time)
    const formatter = new Intl.DateTimeFormat('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      weekday: 'short'
    })
    return formatter.format(base)
  }

  const buildParticipantSet = (meeting) => {
    const names = [meeting.host, ...(meeting.participants || [])]
    return new Set(names.map((name) => String(name || '').trim()).filter(Boolean))
  }

  const getOverlapNames = (setA, setB) => {
    const names = []
    for (const name of setA) {
      if (setB.has(name)) {
        names.push(name)
      }
    }
    return names
  }

  const buildConflictInsights = (items) => {
    const conflicts = []
    const conflictMap = {}
    const activeMeetings = items.filter((meeting) => getStatus(meeting) !== 'finished')
    const windows = activeMeetings.map((meeting) => ({
      meeting,
      window: getMeetingWindow(meeting),
      participants: buildParticipantSet(meeting)
    }))

    for (let i = 0; i < windows.length; i += 1) {
      for (let j = i + 1; j < windows.length; j += 1) {
        const current = windows[i]
        const target = windows[j]
        const overlap =
          current.window.start < target.window.end && target.window.start < current.window.end
        if (!overlap) continue

        const meetingA = current.meeting
        const meetingB = target.meeting
        const roomConflict = meetingA.roomCode && meetingA.roomCode === meetingB.roomCode
        const overlapNames = getOverlapNames(current.participants, target.participants)
        const participantConflict = overlapNames.length > 0

        if (!roomConflict && !participantConflict) continue

        if (roomConflict) {
          const meetingTitles = [meetingA.title, meetingB.title].filter(Boolean).join(' / ')
          conflicts.push({
            id: `room-${meetingA.id}-${meetingB.id}`,
            type: 'room',
            title: '会议室冲突',
            description: `会议室 ${meetingA.roomCode} 在同一时间段被重复占用`,
            timeRange: formatTimeRange(meetingA.startTime, meetingA.durationMinutes),
            meetingTitles,
            meetings: [meetingA, meetingB]
          })
        }

        if (participantConflict) {
          const highlightNames = overlapNames.slice(0, 3)
          const meetingTitles = [meetingA.title, meetingB.title].filter(Boolean).join(' / ')
          conflicts.push({
            id: `participant-${meetingA.id}-${meetingB.id}`,
            type: 'participant',
            title: '参会人冲突',
            description: `参会人重叠：${highlightNames.join('、')}`,
            timeRange: formatTimeRange(meetingA.startTime, meetingA.durationMinutes),
            meetingTitles,
            meetings: [meetingA, meetingB]
          })
        }

        const ensureMap = (id) => {
          if (!conflictMap[id]) {
            conflictMap[id] = { room: false, participant: false }
          }
        }

        ensureMap(meetingA.id)
        ensureMap(meetingB.id)
        if (roomConflict) {
          conflictMap[meetingA.id].room = true
          conflictMap[meetingB.id].room = true
        }
        if (participantConflict) {
          conflictMap[meetingA.id].participant = true
          conflictMap[meetingB.id].participant = true
        }
      }
    }

    return { conflictMap, conflictList: conflicts }
  }

  const meetingStats = computed(() => {
    const { start, end } = getDayRange(nowTime.value)
    const todayMeetings = meetingItems.value.filter((meeting) => {
      const startTime = new Date(meeting.startTime).getTime()
      return startTime >= start.getTime() && startTime <= end.getTime()
    })
    const liveCount = meetingItems.value.filter((meeting) => getStatus(meeting) === 'live').length
    const upcomingCount = meetingItems.value.filter(
      (meeting) => getStatus(meeting) === 'upcoming'
    ).length
    const finishedCount = meetingItems.value.filter(
      (meeting) => getStatus(meeting) === 'finished'
    ).length
    const totalMinutes = todayMeetings.reduce(
      (acc, meeting) => acc + Number(meeting.durationMinutes || 0),
      0
    )
    const roomCount = new Set(todayMeetings.map((meeting) => meeting.roomCode)).size
    return {
      todayCount: todayMeetings.length,
      liveCount,
      upcomingCount,
      finishedCount,
      totalMinutes,
      roomCount
    }
  })

  const todayMeetings = computed(() => {
    const { start, end } = getDayRange(nowTime.value)
    return [...meetingItems.value]
      .filter((meeting) => {
        const startTime = new Date(meeting.startTime).getTime()
        return startTime >= start.getTime() && startTime <= end.getTime()
      })
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
  })

  const upcomingMeetings = computed(() => {
    return [...meetingItems.value]
      .filter((meeting) => getStatus(meeting) === 'upcoming')
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
  })

  const nextMeeting = computed(() => {
    return upcomingMeetings.value[0] || null
  })

  const conflictInsights = computed(() => {
    return buildConflictInsights(meetingItems.value)
  })

  const conflictList = computed(() => conflictInsights.value.conflictList)
  const conflictMap = computed(() => conflictInsights.value.conflictMap)

  const roomSchedules = computed(() => {
    if (!todayMeetings.value.length) return []
    const roomMap = new Map()

    for (const meeting of todayMeetings.value) {
      const roomCode = meeting.roomCode || '未分配'
      const start = new Date(meeting.startTime).getTime()
      const end = start + Number(meeting.durationMinutes || 0) * MINUTE
      if (!roomMap.has(roomCode)) {
        roomMap.set(roomCode, {
          roomCode,
          bookedMinutes: 0,
          blocks: []
        })
      }
      const room = roomMap.get(roomCode)
      room.bookedMinutes += Number(meeting.durationMinutes || 0)
      room.blocks.push({
        id: meeting.id,
        title: meeting.title,
        status: getStatus(meeting),
        start,
        end,
        rangeLabel: `${formatShortTime(start)}-${formatShortTime(end)}`,
        conflict: conflictMap.value[meeting.id]
      })
    }

    return Array.from(roomMap.values())
      .map((room) => {
        room.blocks.sort((a, b) => a.start - b.start)
        const ratio = room.bookedMinutes / (24 * 60)
        const hasRoomConflict = room.blocks.some((block) => block.conflict?.room)
        const hasParticipantConflict = room.blocks.some((block) => block.conflict?.participant)
        let busyLabel = '低负载'
        let busyClass = 'bg-emerald-100 text-emerald-700'
        if (ratio >= 0.5) {
          busyLabel = '高负载'
          busyClass = 'bg-rose-100 text-rose-700'
        } else if (ratio >= 0.25) {
          busyLabel = '中等负载'
          busyClass = 'bg-amber-100 text-amber-700'
        }
        return {
          roomCode: room.roomCode,
          bookedMinutes: room.bookedMinutes,
          meetingCount: room.blocks.length,
          blocks: room.blocks,
          busyLabel,
          busyClass,
          hasRoomConflict,
          hasParticipantConflict
        }
      })
      .sort((a, b) => a.roomCode.localeCompare(b.roomCode))
  })

  const timelineGroups = computed(() => {
    const groups = []
    const sorted = [...meetingItems.value].sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    )
    const conflictMap = conflictInsights.value.conflictMap

    for (const meeting of sorted) {
      const dateKey = new Date(meeting.startTime).toDateString()
      const lastGroup = groups[groups.length - 1]
      if (!lastGroup || lastGroup.key !== dateKey) {
        const label = isSameDay(meeting.startTime, nowTime.value)
          ? `今天 · ${formatDateLabel(meeting.startTime)}`
          : formatDateLabel(meeting.startTime)
        groups.push({
          key: dateKey,
          label,
          items: []
        })
      }

      const status = getStatus(meeting)
      groups[groups.length - 1].items.push({
        ...meeting,
        status,
        statusLabel: statusMap[status]?.label || '未知',
        timeLabel: formatShortTime(meeting.startTime),
        rangeLabel: formatTimeRange(meeting.startTime, meeting.durationMinutes),
        conflict: conflictMap[meeting.id]
      })
    }

    return groups
  })

  const notifyReminder = (meeting, stageKey) => {
    if (!shouldNotifyReminder(meeting.id, stageKey)) return
    const remaining = getCountdownMs(meeting)
    ElNotification({
      title: '会议提醒',
      type: 'warning',
      duration: 5000,
      message: `${meeting.title} 将在 ${formatRemainingText(remaining)} 后开始`
    })
  }

  const runAutoReminder = () => {
    for (const meeting of meetingItems.value) {
      if (getStatus(meeting) !== 'upcoming') continue
      const remaining = getCountdownMs(meeting)
      if (remaining <= 0) continue

      if (remaining <= REMIND_ONE_MINUTE) {
        notifyReminder(meeting, '1m')
      } else if (remaining <= REMIND_TEN_MINUTES) {
        notifyReminder(meeting, '10m')
      }
    }
  }

  const manualRemind = (meeting) => {
    if (getStatus(meeting) !== 'upcoming') {
      ElMessage.info('当前会议不在待开始状态')
      return
    }
    if (!shouldNotifyReminder(meeting.id, 'manual')) return

    const remaining = getCountdownMs(meeting)
    ElNotification({
      title: '提醒已设置',
      type: 'success',
      duration: 3500,
      message: `${meeting.title} 距离开始约 ${formatRemainingText(remaining)}`
    })
  }

  const goDetail = (id) => {
    router.push(`/meetings/${id}`)
  }

  const createDialogVisible = ref(false)
  const createForm = reactive(createMeetingForm())

  const editDialogVisible = ref(false)
  const editingMeetingId = ref('')
  const editForm = reactive(createMeetingForm({ includeHost: true }))

  const resetCreateForm = () => {
    resetMeetingForm(createForm)
  }

  const resetEditForm = () => {
    editingMeetingId.value = ''
    resetMeetingForm(editForm, { includeHost: true })
  }

  const submitCreateMeeting = async (formData = createForm) => {
    const validation = validateMeetingForm(formData)
    if (!validation.ok) {
      ElMessage.warning(validation.message)
      return
    }

    await createMeeting(buildMeetingPayload(formData, validation, { host: displayName.value }))

    createDialogVisible.value = false
    resetCreateForm()
    await refreshMeetings()
    ElMessage.success('会议已创建（本地模拟）')
  }

  const duplicateMeeting = async (meeting) => {
    const duplicated = await createMeeting({
      title: `${meeting.title}（副本）`,
      topic: meeting.topic,
      startTime: getDuplicateStartTime(meeting.startTime),
      durationMinutes: meeting.durationMinutes,
      host: displayName.value,
      participants: meeting.participants,
      agenda: meeting.agenda,
      notes: meeting.notes
    })

    await refreshMeetings()
    openEditDialog(duplicated)
    ElMessage.success('会议已复制，可继续编辑')
  }

  const openEditDialog = (meeting) => {
    editingMeetingId.value = meeting.id
    Object.assign(editForm, buildMeetingFormFromMeeting(meeting, { includeHost: true }))
    editDialogVisible.value = true
  }

  const submitEditMeeting = async (formData = editForm) => {
    if (!editingMeetingId.value) {
      ElMessage.warning('当前没有可编辑的会议')
      return
    }

    const validation = validateMeetingForm(formData)
    if (!validation.ok) {
      ElMessage.warning(validation.message)
      return
    }

    const updated = await updateMeeting(
      editingMeetingId.value,
      buildMeetingPayload(formData, validation, { host: editForm.host })
    )

    if (!updated) {
      ElMessage.error('会议更新失败')
      return
    }

    clearMeetingReminders(editingMeetingId.value)
    editDialogVisible.value = false
    resetEditForm()
    await refreshMeetings()
    ElMessage.success('会议已更新')
  }

  const removeMeeting = async (id) => {
    try {
      await ElMessageBox.confirm('删除后不可恢复，确认继续吗？', '删除会议', {
        type: 'warning',
        confirmButtonText: '删除',
        cancelButtonText: '取消'
      })
    } catch {
      return
    }

    const removed = await deleteMeeting(id)
    if (!removed) {
      ElMessage.error('会议删除失败')
      return
    }

    clearMeetingReminders(id)
    await refreshMeetings()
    ElMessage.success('会议已删除')
  }

  const logout = async () => {
    clearCurrentUser()
    await setWorkspaceMode('auth')
    router.replace('/')
  }

  watch(
    [keyword, statusFilter, sortMode],
    () => {
      void loadMeetings()
    },
    {
      immediate: true
    }
  )

  onMounted(() => {
    void setWorkspaceMode('meeting')
    clockTimer = window.setInterval(() => {
      nowTime.value = Date.now()
      clockTicks += 1
      runAutoReminder()
      if (clockTicks % 30 === 0) {
        void loadMeetings()
      }
    }, 1000)
  })

  onUnmounted(() => {
    if (!clockTimer) return
    window.clearInterval(clockTimer)
    clockTimer = null
  })

  return {
    displayName,
    keyword,
    statusFilter,
    sortMode,
    viewMode,
    meetingItems,
    meetingStats,
    todayMeetings,
    nextMeeting,
    conflictList,
    conflictMap,
    roomSchedules,
    timelineGroups,
    statusMap,
    getStatus,
    getCountdownLabel,
    getCountdownClass,
    formatTimeRange,
    formatShortTime,
    manualRemind,
    goDetail,
    createDialogVisible,
    createForm,
    submitCreateMeeting,
    duplicateMeeting,
    editDialogVisible,
    editForm,
    openEditDialog,
    submitEditMeeting,
    removeMeeting,
    refreshMeetings,
    logout
  }
}

export { useMeetingList }
