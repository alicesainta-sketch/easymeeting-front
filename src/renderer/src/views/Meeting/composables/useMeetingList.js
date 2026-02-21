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
  getMeetingRemainingMs
} from '@/utils/meetingTime'

const useMeetingList = () => {
  const router = useRouter()
  const currentUser = getCurrentUser()
  const displayName = computed(() => currentUser?.nickname || currentUser?.email || '用户')

  const keyword = ref('')
  const statusFilter = ref('all')
  const meetingItems = ref([])
  const nowTime = ref(Date.now())
  const remindMarks = new Set()
  const REMIND_TEN_MINUTES = 10 * MINUTE
  const REMIND_ONE_MINUTE = 1 * MINUTE
  let clockTimer = null
  let clockTicks = 0

  const statusMap = {
    live: { label: '进行中', type: 'success' },
    upcoming: { label: '待开始', type: 'primary' },
    finished: { label: '已结束', type: 'info' }
  }

  const getStatus = (meeting) => {
    return getMeetingStatus(meeting, nowTime.value)
  }

  const getCountdownMs = (meeting) => {
    return getMeetingRemainingMs(meeting.startTime, nowTime.value)
  }

  const getCountdownLabel = (meeting) => {
    const status = getStatus(meeting)
    if (status === 'live') return '进行中'
    if (status === 'finished') return '已结束'
    return formatCountdown(getCountdownMs(meeting))
  }

  const getCountdownClass = (meeting) => {
    const status = getStatus(meeting)
    if (status === 'live') return 'countdown-live'
    if (status === 'finished') return 'countdown-finished'
    const remaining = getCountdownMs(meeting)
    if (remaining <= REMIND_ONE_MINUTE) return 'countdown-urgent'
    if (remaining <= REMIND_TEN_MINUTES) return 'countdown-soon'
    return 'countdown-normal'
  }

  const loadMeetings = async () => {
    meetingItems.value = await listMeetings({
      keyword: keyword.value,
      status: statusFilter.value
    })
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

  const clearMeetingReminderMarks = (meetingId) => {
    for (const key of Array.from(remindMarks)) {
      if (key.startsWith(`${meetingId}:`)) {
        remindMarks.delete(key)
      }
    }
  }

  const notifyReminder = (meeting, stageKey) => {
    const key = `${meeting.id}:${stageKey}`
    if (remindMarks.has(key)) return

    remindMarks.add(key)
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
  const createForm = reactive({
    title: '',
    topic: '',
    startTime: '',
    durationMinutes: 45,
    participants: '',
    agenda: '',
    notes: ''
  })

  const editDialogVisible = ref(false)
  const editingMeetingId = ref('')
  const editForm = reactive({
    title: '',
    topic: '',
    startTime: '',
    durationMinutes: 45,
    host: '',
    participants: '',
    agenda: '',
    notes: ''
  })

  const resetCreateForm = () => {
    createForm.title = ''
    createForm.topic = ''
    createForm.startTime = ''
    createForm.durationMinutes = 45
    createForm.participants = ''
    createForm.agenda = ''
    createForm.notes = ''
  }

  const resetEditForm = () => {
    editingMeetingId.value = ''
    editForm.title = ''
    editForm.topic = ''
    editForm.startTime = ''
    editForm.durationMinutes = 45
    editForm.host = ''
    editForm.participants = ''
    editForm.agenda = ''
    editForm.notes = ''
  }

  const submitCreateMeeting = async (formData = createForm) => {
    if (!formData.title || !formData.topic || !formData.startTime || !formData.durationMinutes) {
      ElMessage.warning('请先填写完整必填项')
      return
    }

    const startTimestamp = Number(formData.startTime)
    await createMeeting({
      title: formData.title,
      topic: formData.topic,
      startTime: new Date(startTimestamp).toISOString(),
      durationMinutes: formData.durationMinutes,
      host: displayName.value,
      participants: formData.participants.split(','),
      agenda: formData.agenda.split('\n'),
      notes: formData.notes
    })

    createDialogVisible.value = false
    resetCreateForm()
    await refreshMeetings()
    ElMessage.success('会议已创建（本地模拟）')
  }

  const openEditDialog = (meeting) => {
    editingMeetingId.value = meeting.id
    editForm.title = meeting.title
    editForm.topic = meeting.topic
    editForm.startTime = String(new Date(meeting.startTime).getTime())
    editForm.durationMinutes = Number(meeting.durationMinutes)
    editForm.host = meeting.host
    editForm.participants = meeting.participants.join(',')
    editForm.agenda = meeting.agenda.join('\n')
    editForm.notes = meeting.notes || ''
    editDialogVisible.value = true
  }

  const submitEditMeeting = async (formData = editForm) => {
    if (
      !editingMeetingId.value ||
      !formData.title ||
      !formData.topic ||
      !formData.startTime ||
      !formData.durationMinutes
    ) {
      ElMessage.warning('请先填写完整必填项')
      return
    }

    const startTimestamp = Number(formData.startTime)
    const updated = await updateMeeting(editingMeetingId.value, {
      title: formData.title,
      topic: formData.topic,
      startTime: new Date(startTimestamp).toISOString(),
      durationMinutes: formData.durationMinutes,
      host: editForm.host,
      participants: formData.participants.split(','),
      agenda: formData.agenda.split('\n'),
      notes: formData.notes
    })

    if (!updated) {
      ElMessage.error('会议更新失败')
      return
    }

    clearMeetingReminderMarks(editingMeetingId.value)
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

    clearMeetingReminderMarks(id)
    await refreshMeetings()
    ElMessage.success('会议已删除')
  }

  const setWorkspaceMode = async (mode) => {
    try {
      await window.electron?.ipcRenderer?.invoke('setWorkspaceMode', mode)
    } catch {
      // Keep functional in web mode.
    }
  }

  const logout = async () => {
    clearCurrentUser()
    await setWorkspaceMode('auth')
    router.replace('/')
  }

  watch(
    [keyword, statusFilter],
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
    meetingItems,
    statusMap,
    getStatus,
    getCountdownLabel,
    getCountdownClass,
    formatTimeRange,
    manualRemind,
    goDetail,
    createDialogVisible,
    createForm,
    submitCreateMeeting,
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
