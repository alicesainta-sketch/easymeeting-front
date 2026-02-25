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
  getMeetingRemainingMs,
  getDuplicateStartTime
} from '@/utils/meetingTime'
import { clearMeetingReminders, shouldNotifyReminder } from '@/utils/meetingReminder'
import { copyText } from '@/utils/clipboard'
import { setWorkspaceMode } from '@/utils/workspaceMode'
import {
  buildMeetingFormFromMeeting,
  buildMeetingPayload,
  createMeetingForm
} from '@/views/Meeting/composables/meetingForm'
import { STATUS_MAP } from '@/views/Meeting/composables/meetingStatus'
import { validateMeetingForm } from './validateMeetingForm'

const useMeetingDetail = () => {
  const route = useRoute()
  const router = useRouter()

  const meeting = ref(null)
  const nowTime = ref(Date.now())
  const REMIND_TEN_MINUTES = 10 * MINUTE
  const REMIND_ONE_MINUTE = 1 * MINUTE
  let clockTimer = null
  const editDialogVisible = ref(false)
  const editForm = ref(createMeetingForm())

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
    if (status.value === 'live') return 'text-emerald-600'
    if (status.value === 'finished') return 'text-slate-400'
    if (remainingMs.value <= REMIND_ONE_MINUTE) return 'text-rose-600'
    if (remainingMs.value <= REMIND_TEN_MINUTES) return 'text-amber-600'
    return 'text-slate-500'
  })

  const statusMap = STATUS_MAP

  const statusStep = computed(() => {
    if (status.value === 'upcoming') return 0
    if (status.value === 'live') return 1
    return 2
  })

  const riskTips = computed(() => {
    if (!meeting.value) return []
    const tips = []
    if (!meeting.value.roomPassword) {
      tips.push('未设置入会密码')
    }
    if (!meeting.value.waitingRoomWhitelist?.length) {
      tips.push('等候室白名单为空')
    }
    if ((meeting.value.participants?.length || 0) >= 8) {
      tips.push('参会人数较多，建议开启全员静音')
    }
    return tips
  })

  const checklistItems = computed(() => {
    if (!meeting.value) return []
    const participantCount = meeting.value.participants?.length || 0
    const agendaCount = meeting.value.agenda?.length || 0
    const whitelistCount = meeting.value.waitingRoomWhitelist?.length || 0
    const passwordSet = Boolean(meeting.value.roomPassword)
    const hasCoreInfo = Boolean(meeting.value.title && meeting.value.topic)

    let securityDescription = '建议设置入会密码或白名单'
    if (passwordSet) {
      securityDescription = '已设置入会密码'
    } else if (whitelistCount) {
      securityDescription = `白名单 ${whitelistCount} 人`
    }

    return [
      {
        id: 'core',
        title: '完善会议基本信息',
        status: hasCoreInfo ? 'done' : 'pending',
        description: hasCoreInfo ? '标题与主题已确认' : '补全标题与主题'
      },
      {
        id: 'participants',
        title: '确认参会人',
        status: participantCount ? 'done' : 'pending',
        description: participantCount ? `${participantCount} 位参会人已添加` : '尚未添加参会人'
      },
      {
        id: 'agenda',
        title: '完成会议议程',
        status: agendaCount ? 'done' : 'pending',
        description: agendaCount ? `${agendaCount} 项议程已整理` : '暂未设置议程'
      },
      {
        id: 'security',
        title: '配置会议安全',
        status: passwordSet || whitelistCount ? 'done' : 'pending',
        description: securityDescription
      }
    ]
  })

  const checklistProgress = computed(() => {
    if (!checklistItems.value.length) return 0
    const doneCount = checklistItems.value.filter((item) => item.status === 'done').length
    return Math.round((doneCount / checklistItems.value.length) * 100)
  })

  const activityTimeline = computed(() => {
    if (!meeting.value) return []
    const start = new Date(meeting.value.startTime).getTime()
    const durationMs = Number(meeting.value.durationMinutes || 0) * MINUTE
    const end = start + durationMs
    const createTime = start - 48 * 60 * MINUTE
    const inviteTime = start - 6 * 60 * MINUTE
    const remindTime = start - 10 * MINUTE

    return [
      {
        id: 'create',
        title: '创建会议',
        timestamp: formatDateTime(createTime),
        type: 'info'
      },
      {
        id: 'invite',
        title: '发送参会邀请',
        timestamp: formatDateTime(inviteTime),
        type: 'primary'
      },
      {
        id: 'remind',
        title: '会前提醒触发',
        timestamp: formatDateTime(remindTime),
        type: 'warning'
      },
      {
        id: 'start',
        title: '会议开始',
        timestamp: formatDateTime(start),
        type: status.value === 'upcoming' ? 'info' : 'success'
      },
      {
        id: 'end',
        title: '会议结束',
        timestamp: formatDateTime(end),
        type: status.value === 'finished' ? 'success' : 'info'
      }
    ]
  })

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

  const loadMeeting = async () => {
    meeting.value = await getMeetingById(route.params.id)
  }

  const notifyReminder = (stageKey) => {
    if (!meeting.value) return
    if (!shouldNotifyReminder(meeting.value.id, stageKey)) return
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
    if (!shouldNotifyReminder(meeting.value.id, 'manual')) return

    ElNotification({
      title: '提醒已设置',
      type: 'success',
      duration: 3500,
      message: `${meeting.value.title} 距离开始约 ${formatRemainingText(remainingMs.value)}`
    })
  }

  const openEditDialog = () => {
    if (!meeting.value) return
    editForm.value = buildMeetingFormFromMeeting(meeting.value)
    editDialogVisible.value = true
  }

  const duplicateCurrentMeeting = async () => {
    if (!meeting.value) return

    const duplicated = await createMeeting({
      title: `${meeting.value.title}（副本）`,
      topic: meeting.value.topic,
      startTime: getDuplicateStartTime(meeting.value.startTime),
      durationMinutes: meeting.value.durationMinutes,
      host: meeting.value.host,
      roomPassword: meeting.value.roomPassword,
      allowParticipantEarlyJoin: meeting.value.allowParticipantEarlyJoin,
      waitingRoomWhitelist: meeting.value.waitingRoomWhitelist,
      participants: meeting.value.participants,
      agenda: meeting.value.agenda,
      notes: meeting.value.notes
    })

    ElMessage.success('会议已复制')
    router.replace(`/meetings/${duplicated.id}`)
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

    const updated = await updateMeeting(
      meeting.value.id,
      buildMeetingPayload(formData, validation, { host: meeting.value.host })
    )

    if (!updated) {
      ElMessage.error('会议更新失败')
      return
    }

    clearMeetingReminders(meeting.value.id)
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

    clearMeetingReminders(meeting.value.id)
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
    statusStep,
    riskTips,
    checklistItems,
    checklistProgress,
    activityTimeline,
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
