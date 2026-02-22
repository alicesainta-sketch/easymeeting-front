import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'
import { getMeetingById, getMeetingStatus } from '@/mock/meetings'
import { getCurrentUser } from '@/utils/auth'
import { useRoomMedia } from './room/useRoomMedia'
import { useRoomSimulation } from './room/useRoomSimulation'

const ROOM_PREFS_KEY = 'easymeeting-room-preferences'
const MAX_STAGE_PARTICIPANTS = 3
const MAX_CHAT_MESSAGES = 150
const MOCK_REMOTE_MESSAGES = [
  '我这边可以开始了',
  '这条结论我记录一下',
  '请看下最新的迭代计划',
  '刚刚那个点我补充一下',
  '议程第二项可以继续',
  '这部分风险需要再确认'
]
const emojiList = [
  '😀',
  '😄',
  '😂',
  '🙂',
  '😉',
  '😍',
  '🤔',
  '👍',
  '👏',
  '🎉',
  '🚀',
  '✅',
  '❗',
  '❤️',
  '🙏',
  '😅'
]

const useMeetingRoom = () => {
  const route = useRoute()
  const router = useRouter()

  const meeting = ref(null)
  const joined = ref(false)
  const joinedAt = ref(0)
  const nowTick = ref(Date.now())
  let clockTimer = null

  const chatListRef = ref(null)
  const chatInputRef = ref(null)

  const user = getCurrentUser()
  const displayName = ref(user?.nickname || user?.email?.split('@')[0] || '')
  const chatInput = ref('')
  const chatMessages = ref([])
  const emojiPopoverVisible = ref(false)
  const handRaised = ref(false)
  const screenSharing = ref(false)

  const normalizedDisplayName = computed(() => displayName.value.trim())
  const meetingStatus = computed(() => {
    if (!meeting.value) return 'finished'
    return getMeetingStatus(meeting.value)
  })
  const canJoinMeeting = computed(() => meetingStatus.value !== 'finished')
  const joinActionLabel = computed(() => {
    if (meetingStatus.value === 'finished') return '会议已结束'
    if (meetingStatus.value === 'upcoming') return '提前加入'
    return '加入会议'
  })

  const roomElapsedText = computed(() => {
    if (!joinedAt.value) return '00:00'
    const elapsedSeconds = Math.floor((nowTick.value - joinedAt.value) / 1000)
    const minutes = String(Math.floor(elapsedSeconds / 60)).padStart(2, '0')
    const seconds = String(elapsedSeconds % 60).padStart(2, '0')
    return `${minutes}:${seconds}`
  })

  const remoteParticipants = computed(() => {
    if (!meeting.value) return []
    return meeting.value.participants.filter((name) => name !== normalizedDisplayName.value)
  })

  const stageParticipants = computed(() => {
    return remoteParticipants.value.slice(0, MAX_STAGE_PARTICIPANTS)
  })

  const hiddenStageCount = computed(() => {
    return Math.max(remoteParticipants.value.length - stageParticipants.value.length, 0)
  })

  const formatClock = (time) => {
    return new Intl.DateTimeFormat('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(time))
  }

  const appendChatMessage = (sender, content, type = 'normal') => {
    if (!content) return
    chatMessages.value.push({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      sender,
      content,
      type,
      time: formatClock(Date.now())
    })
    if (chatMessages.value.length > MAX_CHAT_MESSAGES) {
      chatMessages.value.splice(0, chatMessages.value.length - MAX_CHAT_MESSAGES)
    }
  }

  const {
    getParticipantState,
    syncRemoteParticipantStates,
    startRemoteMessageLoop,
    startRemoteStateLoop,
    stopAllSimulation
  } = useRoomSimulation({
    joined,
    remoteParticipants,
    appendChatMessage,
    mockMessages: MOCK_REMOTE_MESSAGES
  })

  const {
    previewVideoRef,
    roomVideoRef,
    mediaError,
    cameraEnabled,
    micEnabled,
    videoDevices,
    audioDevices,
    selectedVideoDeviceId,
    selectedAudioDeviceId,
    showVideoPlaceholder,
    loadDevices,
    restartPreview,
    toggleMicrophone,
    toggleCamera,
    bindCurrentStream,
    releaseMedia
  } = useRoomMedia({ joined, appendChatMessage })

  const participantItems = computed(() => {
    const selfName = displayName.value || '我'
    const others = remoteParticipants.value.map((name) => {
      const state = getParticipantState(name)
      return {
        name,
        isSelf: false,
        mic: state.mic,
        camera: state.camera,
        handRaised: state.handRaised,
        sharing: false
      }
    })

    return [
      {
        name: selfName,
        isSelf: true,
        mic: micEnabled.value,
        camera: cameraEnabled.value,
        handRaised: handRaised.value,
        sharing: screenSharing.value
      },
      ...others
    ]
  })

  const mediaTip = computed(() => {
    if (mediaError.value) return mediaError.value
    if (meetingStatus.value === 'finished') return '该会议已结束，仅可查看会前检查。'
    if (!videoDevices.value.length && !audioDevices.value.length) return '未检测到可用设备'
    return '当前为纯前端演示：仅本地预览，不进行多人实时通话。'
  })

  const scrollChatToBottom = async () => {
    await nextTick()
    if (!chatListRef.value) return
    chatListRef.value.scrollTop = chatListRef.value.scrollHeight
  }

  const readRoomPreferences = () => {
    const raw = localStorage.getItem(ROOM_PREFS_KEY)
    if (!raw) return null
    try {
      return JSON.parse(raw)
    } catch {
      return null
    }
  }

  const loadRoomPreferences = () => {
    const prefs = readRoomPreferences()
    if (!prefs) return

    if (typeof prefs.displayName === 'string' && prefs.displayName.trim()) {
      displayName.value = prefs.displayName.trim()
    }
    if (typeof prefs.cameraEnabled === 'boolean') {
      cameraEnabled.value = prefs.cameraEnabled
    }
    if (typeof prefs.micEnabled === 'boolean') {
      micEnabled.value = prefs.micEnabled
    }
    if (typeof prefs.selectedVideoDeviceId === 'string') {
      selectedVideoDeviceId.value = prefs.selectedVideoDeviceId
    }
    if (typeof prefs.selectedAudioDeviceId === 'string') {
      selectedAudioDeviceId.value = prefs.selectedAudioDeviceId
    }
  }

  const saveRoomPreferences = () => {
    const payload = {
      displayName: normalizedDisplayName.value,
      cameraEnabled: cameraEnabled.value,
      micEnabled: micEnabled.value,
      selectedVideoDeviceId: selectedVideoDeviceId.value,
      selectedAudioDeviceId: selectedAudioDeviceId.value
    }
    localStorage.setItem(ROOM_PREFS_KEY, JSON.stringify(payload))
  }

  const clearChatMessages = () => {
    chatMessages.value = []
  }

  const appendEmoji = (emoji) => {
    if (!emoji) return
    chatInput.value = `${chatInput.value || ''}${emoji}`
    emojiPopoverVisible.value = false
    nextTick(() => {
      chatInputRef.value?.focus?.()
    })
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

  const toggleHandRaise = () => {
    handRaised.value = !handRaised.value
    if (!joined.value) return
    appendChatMessage('系统', handRaised.value ? '你已举手' : '你已放下手', 'system')
  }

  const toggleScreenShare = () => {
    screenSharing.value = !screenSharing.value
    if (!joined.value) return
    appendChatMessage(
      '系统',
      screenSharing.value ? '你开始共享屏幕（本地模拟）' : '你停止共享屏幕',
      'system'
    )
  }

  const shouldIgnoreHotkeyEvent = (event) => {
    const target = event.target
    if (!target) return false
    if (target.isContentEditable) return true
    const tagName = target.tagName?.toLowerCase()
    return ['input', 'textarea', 'select'].includes(tagName)
  }

  const handleRoomHotkeys = (event) => {
    if (!joined.value) return
    if (shouldIgnoreHotkeyEvent(event)) return
    const key = event.key?.toLowerCase()
    if (key === 'm') {
      event.preventDefault()
      void toggleMicrophone()
      return
    }
    if (key === 'v') {
      event.preventDefault()
      void toggleCamera()
      return
    }
    if (key === 'r') {
      event.preventDefault()
      toggleHandRaise()
    }
  }

  const goBackToList = () => {
    router.push('/meetings')
  }

  const goBackToDetail = () => {
    if (!meeting.value) {
      goBackToList()
      return
    }
    router.push(`/meetings/${meeting.value.id}`)
  }

  const loadMeeting = async () => {
    meeting.value = await getMeetingById(route.params.id)
  }

  const resetJoinState = () => {
    stopAllSimulation()
    joined.value = false
    joinedAt.value = 0
    chatInput.value = ''
    emojiPopoverVisible.value = false
    chatMessages.value = []
    handRaised.value = false
    screenSharing.value = false
  }

  const joinMeeting = async () => {
    if (!canJoinMeeting.value) {
      ElMessage.info('会议已结束，无法加入')
      return
    }
    if (!normalizedDisplayName.value) {
      ElMessage.warning('请输入会议昵称')
      return
    }

    joined.value = true
    joinedAt.value = Date.now()
    chatMessages.value = []
    handRaised.value = false
    screenSharing.value = false
    syncRemoteParticipantStates()

    appendChatMessage('系统', '你已加入会议（纯前端演示）', 'system')
    for (const name of stageParticipants.value) {
      appendChatMessage('系统', `${name} 在房间中`, 'system')
    }

    startRemoteMessageLoop()
    startRemoteStateLoop()
    await bindCurrentStream()
    await scrollChatToBottom()
    ElMessage.success('已加入会议（纯前端演示）')
  }

  const sendChatMessage = () => {
    if (!joined.value) return
    if (!chatInput.value) return
    appendChatMessage(displayName.value || '我', chatInput.value, 'self')
    chatInput.value = ''
  }

  const leaveMeeting = () => {
    stopAllSimulation()
    releaseMedia()
    resetJoinState()
    goBackToDetail()
  }

  onMounted(async () => {
    window.addEventListener('keydown', handleRoomHotkeys)
    loadRoomPreferences()
    await loadMeeting()
    syncRemoteParticipantStates()
    await loadDevices()
    await restartPreview()
    clockTimer = window.setInterval(() => {
      nowTick.value = Date.now()
    }, 1000)
  })

  watch(
    () => route.params.id,
    async (nextId, prevId) => {
      if (nextId === prevId) return
      resetJoinState()
      await loadMeeting()
      syncRemoteParticipantStates()
      await restartPreview()
    }
  )

  watch(remoteParticipants, () => {
    syncRemoteParticipantStates()
    if (!joined.value) return
    startRemoteMessageLoop()
    startRemoteStateLoop()
  })

  watch(
    [displayName, cameraEnabled, micEnabled, selectedVideoDeviceId, selectedAudioDeviceId],
    () => {
      saveRoomPreferences()
    }
  )

  watch(
    () => chatMessages.value.length,
    async () => {
      await scrollChatToBottom()
    }
  )

  onUnmounted(() => {
    window.removeEventListener('keydown', handleRoomHotkeys)
    if (!clockTimer) return
    window.clearInterval(clockTimer)
    clockTimer = null
  })

  return {
    meeting,
    joined,
    previewVideoRef,
    roomVideoRef,
    chatListRef,
    chatInputRef,
    displayName,
    cameraEnabled,
    micEnabled,
    videoDevices,
    audioDevices,
    selectedVideoDeviceId,
    selectedAudioDeviceId,
    chatInput,
    chatMessages,
    emojiPopoverVisible,
    handRaised,
    screenSharing,
    emojiList,
    showVideoPlaceholder,
    mediaTip,
    canJoinMeeting,
    joinActionLabel,
    roomElapsedText,
    stageParticipants,
    hiddenStageCount,
    participantItems,
    getParticipantState,
    toggleCamera,
    toggleMicrophone,
    toggleHandRaise,
    toggleScreenShare,
    goBackToList,
    goBackToDetail,
    joinMeeting,
    sendChatMessage,
    leaveMeeting,
    copyRoomCode,
    clearChatMessages,
    appendEmoji
  }
}

export { useMeetingRoom }
