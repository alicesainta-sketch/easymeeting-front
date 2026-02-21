import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'
import {
  createMeeting,
  deleteMeeting,
  getMeetingById,
  getMeetingStatus,
  updateMeeting
} from '@/mock/meetings'
import {
  MINUTE,
  formatCountdown,
  formatRemainingText,
  getMeetingRemainingMs
} from '@/utils/meetingTime'
import { validateMeetingForm } from './validateMeetingForm'

const useMeetingDetail = () => {
  const route = useRoute()
  const router = useRouter()

  const meeting = ref(null)
  const nowTime = ref(Date.now())
  const remindMarks = new Set()
  const REMIND_TEN_MINUTES = 10 * MINUTE
  const REMIND_ONE_MINUTE = 1 * MINUTE
  let clockTimer = null
  const editDialogVisible = ref(false)
  const editForm = ref({
    title: '',
    topic: '',
    startTime: '',
    durationMinutes: 45,
    participants: '',
    agenda: '',
    notes: ''
  })

  const status = computed(() => {
    if (!meeting.value) return 'finished'
    return getMeetingStatus(meeting.value, nowTime.value)
  })

  const remainingMs = computed(() => {
    if (!meeting.value) return 0
    return getMeetingRemainingMs(meeting.value.startTime, nowTime.value)
  })

  const countdownLabel = computed(() => {
    if (!meeting.value) return '--'
    if (status.value === 'live') return '进行中'
    if (status.value === 'finished') return '已结束'
    return formatCountdown(remainingMs.value)
  })

  const countdownClass = computed(() => {
    if (status.value === 'live') return 'countdown-live'
    if (status.value === 'finished') return 'countdown-finished'
    if (remainingMs.value <= REMIND_ONE_MINUTE) return 'countdown-urgent'
    if (remainingMs.value <= REMIND_TEN_MINUTES) return 'countdown-soon'
    return 'countdown-normal'
  })

  const statusMap = {
    live: { label: '进行中', type: 'success' },
    upcoming: { label: '待开始', type: 'primary' },
    finished: { label: '已结束', type: 'info' }
  }

  const formatDateTime = (dateTime) => {
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateTime))
  }

  const goBack = () => {
    router.push('/meetings')
  }

  const setWorkspaceMode = async (mode) => {
    try {
      await window.electron?.ipcRenderer?.invoke('setWorkspaceMode', mode)
    } catch {
      // Keep functional in web mode.
    }
  }

  const loadMeeting = async () => {
    meeting.value = await getMeetingById(route.params.id)
  }

  const notifyReminder = (stageKey) => {
    if (!meeting.value) return
    const key = `${meeting.value.id}:${stageKey}`
    if (remindMarks.has(key)) return

    remindMarks.add(key)
    ElNotification({
      title: '会议提醒',
      type: 'warning',
      duration: 5000,
      message: `${meeting.value.title} 将在 ${formatRemainingText(remainingMs.value)} 后开始`
    })
  }

  const runAutoReminder = () => {
    if (!meeting.value || status.value !== 'upcoming') return
    if (remainingMs.value <= 0) return

    if (remainingMs.value <= REMIND_ONE_MINUTE) {
      notifyReminder('1m')
    } else if (remainingMs.value <= REMIND_TEN_MINUTES) {
      notifyReminder('10m')
    }
  }

  const manualRemind = () => {
    if (!meeting.value || status.value !== 'upcoming') {
      ElMessage.info('当前会议不在待开始状态')
      return
    }

    ElNotification({
      title: '提醒已设置',
      type: 'success',
      duration: 3500,
      message: `${meeting.value.title} 距离开始约 ${formatRemainingText(remainingMs.value)}`
    })
  }

  const openEditDialog = () => {
    if (!meeting.value) return
    editForm.value = {
      title: meeting.value.title,
      topic: meeting.value.topic,
      startTime: String(new Date(meeting.value.startTime).getTime()),
      durationMinutes: Number(meeting.value.durationMinutes),
      participants: meeting.value.participants.join(','),
      agenda: meeting.value.agenda.join('\n'),
      notes: meeting.value.notes || ''
    }
    editDialogVisible.value = true
  }

  const getDuplicateStartTime = (startTime) => {
    const sourceTime = new Date(startTime).getTime()
    const minUpcomingTime = Date.now() + 10 * MINUTE
    return new Date(Math.max(sourceTime, minUpcomingTime)).toISOString()
  }

  const duplicateCurrentMeeting = async () => {
    if (!meeting.value) return

    const duplicated = await createMeeting({
      title: `${meeting.value.title}（副本）`,
      topic: meeting.value.topic,
      startTime: getDuplicateStartTime(meeting.value.startTime),
      durationMinutes: meeting.value.durationMinutes,
      host: meeting.value.host,
      participants: meeting.value.participants,
      agenda: meeting.value.agenda,
      notes: meeting.value.notes
    })

    ElMessage.success('会议已复制')
    router.replace(`/meetings/${duplicated.id}`)
  }

  const copyText = async (text) => {
    if (!text) return false
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text)
        return true
      } catch {
        // Fall through to legacy copy command.
      }
    }

    try {
      const input = document.createElement('textarea')
      input.value = text
      input.setAttribute('readonly', 'readonly')
      input.style.position = 'fixed'
      input.style.left = '-9999px'
      document.body.appendChild(input)
      input.select()
      const copied = document.execCommand('copy')
      document.body.removeChild(input)
      return copied
    } catch {
      return false
    }
  }

  const copyRoomCode = async () => {
    if (!meeting.value?.roomCode) return
    const copied = await copyText(meeting.value.roomCode)
    if (!copied) {
      ElMessage.error('复制失败，请手动复制')
      return
    }
    ElMessage.success(`房间号已复制：${meeting.value.roomCode}`)
  }

  const submitEditMeeting = async (formData = editForm.value) => {
    if (!meeting.value) {
      ElMessage.warning('会议不存在')
      return
    }

    const validation = validateMeetingForm(formData)
    if (!validation.ok) {
      ElMessage.warning(validation.message)
      return
    }

    const updated = await updateMeeting(meeting.value.id, {
      title: formData.title,
      topic: formData.topic,
      startTime: new Date(validation.startTimestamp).toISOString(),
      durationMinutes: validation.durationMinutes,
      host: meeting.value.host,
      participants: formData.participants.split(','),
      agenda: formData.agenda.split('\n'),
      notes: formData.notes
    })

    if (!updated) {
      ElMessage.error('会议更新失败')
      return
    }

    remindMarks.delete(`${meeting.value.id}:10m`)
    remindMarks.delete(`${meeting.value.id}:1m`)
    editDialogVisible.value = false
    await loadMeeting()
    ElMessage.success('会议已更新')
  }

  const removeCurrentMeeting = async () => {
    if (!meeting.value) return
    try {
      await ElMessageBox.confirm('删除后不可恢复，确认继续吗？', '删除会议', {
        type: 'warning',
        confirmButtonText: '删除',
        cancelButtonText: '取消'
      })
    } catch {
      return
    }

    const removed = await deleteMeeting(meeting.value.id)
    if (!removed) {
      ElMessage.error('会议删除失败')
      return
    }

    remindMarks.delete(`${meeting.value.id}:10m`)
    remindMarks.delete(`${meeting.value.id}:1m`)
    ElMessage.success('会议已删除')
    router.replace('/meetings')
  }

  const enterMeeting = () => {
    if (!meeting.value) return
    router.push(`/meetings/${meeting.value.id}/room`)
  }

  watch(
    () => route.params.id,
    () => {
      void loadMeeting()
    },
    {
      immediate: true
    }
  )

  onMounted(() => {
    void setWorkspaceMode('meeting')
    clockTimer = window.setInterval(() => {
      nowTime.value = Date.now()
      runAutoReminder()
    }, 1000)
  })

  onUnmounted(() => {
    if (!clockTimer) return
    window.clearInterval(clockTimer)
    clockTimer = null
  })

  return {
    meeting,
    status,
    countdownLabel,
    countdownClass,
    statusMap,
    formatDateTime,
    goBack,
    manualRemind,
    copyRoomCode,
    duplicateCurrentMeeting,
    openEditDialog,
    editDialogVisible,
    editForm,
    submitEditMeeting,
    removeCurrentMeeting,
    enterMeeting
  }
}

export { useMeetingDetail }
