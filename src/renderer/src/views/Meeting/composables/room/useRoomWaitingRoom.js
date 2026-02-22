import { computed, onUnmounted, ref } from 'vue'

const DEFAULT_WAITING_NAME_POOL = ['林安', '周悦', '何清', '高远', '唐悦', '徐舟', '沈夏', '梁凡']

const useRoomWaitingRoom = ({
  joined,
  meetingLocked,
  appendChatMessage,
  isParticipantInRoom,
  onAdmitParticipant,
  requestNamePool = DEFAULT_WAITING_NAME_POOL
}) => {
  const waitingParticipants = ref([])
  let waitingRequestTimer = null

  const waitingCount = computed(() => waitingParticipants.value.length)

  const getWaitingById = (id) => {
    return waitingParticipants.value.find((participant) => participant.id === id) || null
  }

  const hasWaitingName = (name) => {
    return waitingParticipants.value.some((participant) => participant.name === name)
  }

  const formatTime = (time) => {
    return new Intl.DateTimeFormat('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(time))
  }

  const enqueueWaitingParticipant = (name, { notify = true } = {}) => {
    const normalizedName = name?.trim()
    if (!normalizedName) return false
    if (isParticipantInRoom(normalizedName)) return false
    if (hasWaitingName(normalizedName)) return false

    const requestedAt = Date.now()
    waitingParticipants.value.push({
      id: `wait-${requestedAt}-${Math.random().toString(36).slice(2, 8)}`,
      name: normalizedName,
      requestedAt,
      requestedAtLabel: formatTime(requestedAt)
    })

    if (notify && joined.value) {
      appendChatMessage('系统', `${normalizedName} 请求加入会议，等待主持人审批`, 'system')
    }
    return true
  }

  const removeWaitingParticipant = (id) => {
    if (!id) return null
    const target = getWaitingById(id)
    if (!target) return null
    waitingParticipants.value = waitingParticipants.value.filter(
      (participant) => participant.id !== id
    )
    return target
  }

  const admitWaitingParticipant = (id, { notify = true } = {}) => {
    const target = removeWaitingParticipant(id)
    if (!target) return null
    onAdmitParticipant(target.name)
    if (notify && joined.value) {
      appendChatMessage('系统', `${target.name} 已通过审批并加入会议`, 'system')
    }
    return target
  }

  const rejectWaitingParticipant = (id, { notify = true } = {}) => {
    const target = removeWaitingParticipant(id)
    if (!target) return null
    if (notify && joined.value) {
      appendChatMessage('系统', `${target.name} 的入会申请已被拒绝`, 'system')
    }
    return target
  }

  const clearWaitingRoom = ({ notify = true } = {}) => {
    const count = waitingParticipants.value.length
    if (!count) return 0
    waitingParticipants.value = []
    if (notify && joined.value) {
      appendChatMessage('系统', `主持人已清空等候室申请（${count} 人）`, 'system')
    }
    return count
  }

  const admitAllWaitingParticipants = ({ notify = true } = {}) => {
    const pending = [...waitingParticipants.value]
    if (!pending.length) return 0
    waitingParticipants.value = []
    for (const participant of pending) {
      onAdmitParticipant(participant.name)
    }
    if (notify && joined.value) {
      appendChatMessage('系统', `已自动通过 ${pending.length} 位等候成员`, 'system')
    }
    return pending.length
  }

  const pickWaitingCandidate = () => {
    const candidates = requestNamePool.filter((name) => {
      const normalizedName = name?.trim()
      if (!normalizedName) return false
      return !isParticipantInRoom(normalizedName) && !hasWaitingName(normalizedName)
    })
    if (!candidates.length) return ''
    return candidates[Math.floor(Math.random() * candidates.length)]
  }

  const stopWaitingRequestLoop = () => {
    if (!waitingRequestTimer) return
    window.clearTimeout(waitingRequestTimer)
    waitingRequestTimer = null
  }

  const startWaitingRequestLoop = () => {
    stopWaitingRequestLoop()
    if (!joined.value || !meetingLocked.value) return

    const delay = 12000 + Math.floor(Math.random() * 9000)
    waitingRequestTimer = window.setTimeout(() => {
      if (!joined.value || !meetingLocked.value) return
      const candidate = pickWaitingCandidate()
      if (candidate) {
        enqueueWaitingParticipant(candidate)
      }
      startWaitingRequestLoop()
    }, delay)
  }

  const resetWaitingRoom = () => {
    stopWaitingRequestLoop()
    waitingParticipants.value = []
  }

  onUnmounted(() => {
    stopWaitingRequestLoop()
  })

  return {
    waitingParticipants,
    waitingCount,
    enqueueWaitingParticipant,
    admitWaitingParticipant,
    rejectWaitingParticipant,
    clearWaitingRoom,
    admitAllWaitingParticipants,
    startWaitingRequestLoop,
    stopWaitingRequestLoop,
    resetWaitingRoom
  }
}

export { useRoomWaitingRoom }
