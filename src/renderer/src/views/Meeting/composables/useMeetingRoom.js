import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'
import { getMeetingById, getMeetingStatus } from '@/mock/meetings'
import { getCurrentUser } from '@/utils/auth'
import { useRoomChat } from './room/useRoomChat'
import { useRoomMedia } from './room/useRoomMedia'
import { useRoomModeration } from './room/useRoomModeration'
import { useRoomPreferences } from './room/useRoomPreferences'
import { useRoomSimulation } from './room/useRoomSimulation'
import { useRoomWaitingRoom } from './room/useRoomWaitingRoom'

const MAX_STAGE_PARTICIPANTS = 3
const MOCK_REMOTE_MESSAGES = [
  '我这边可以开始了',
  '这条结论我记录一下',
  '请看下最新的迭代计划',
  '刚刚那个点我补充一下',
  '议程第二项可以继续',
  '这部分风险需要再确认'
]

const useMeetingRoom = () => {
  const route = useRoute()
  const router = useRouter()

  const meeting = ref(null)
  const joined = ref(false)
  const joinedAt = ref(0)
  const nowTick = ref(Date.now())
  let clockTimer = null

  const user = getCurrentUser()
  const displayName = ref(user?.nickname || user?.email?.split('@')[0] || '')

  const handRaised = ref(false)
  const selfHandRaisedAt = ref(0)
  const screenSharing = ref(false)
  const meetingLocked = ref(false)
  const allowParticipantMic = ref(true)
  const cohostList = ref([])
  const allowedSpeakerSet = ref(new Set())

  const normalizeName = (value) => (value ? value.trim() : '')
  const normalizedDisplayName = computed(() => normalizeName(displayName.value))
  const hostName = computed(() => normalizeName(meeting.value?.host))
  const isHostName = (name) => Boolean(hostName.value) && normalizeName(name) === hostName.value
  const isCohostName = (name) => cohostList.value.includes(normalizeName(name))
  const getRole = (name) => {
    if (isHostName(name)) return 'host'
    if (isCohostName(name)) return 'cohost'
    return 'participant'
  }
  const userRole = computed(() => getRole(normalizedDisplayName.value))
  const canModerate = computed(() => ['host', 'cohost'].includes(userRole.value))
  const canManageRoles = computed(() => userRole.value === 'host')
  const isParticipantAllowedToSpeak = (name) => {
    if (allowParticipantMic.value) return true
    return allowedSpeakerSet.value.has(normalizeName(name))
  }
  const setParticipantSpeakAllowed = (name, allowed) => {
    const normalizedName = normalizeName(name)
    if (!normalizedName) return
    const next = new Set(allowedSpeakerSet.value)
    if (allowed) {
      next.add(normalizedName)
    } else {
      next.delete(normalizedName)
    }
    allowedSpeakerSet.value = next
  }
  const clearAllowedSpeakers = () => {
    if (!allowedSpeakerSet.value.size) return
    allowedSpeakerSet.value = new Set()
  }
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
    const participants = Array.isArray(meeting.value.participants) ? meeting.value.participants : []
    return participants.filter((name) => normalizeName(name) !== normalizedDisplayName.value)
  })

  const stageParticipants = computed(() => {
    return remoteParticipants.value.slice(0, MAX_STAGE_PARTICIPANTS)
  })

  const hiddenStageCount = computed(() => {
    return Math.max(remoteParticipants.value.length - stageParticipants.value.length, 0)
  })

  const {
    chatListRef,
    chatInputRef,
    chatInput,
    chatMessages,
    emojiPopoverVisible,
    emojiList,
    appendChatMessage,
    clearChatMessages,
    appendEmoji,
    sendChatMessage,
    scrollChatToBottom,
    resetChatState
  } = useRoomChat({
    joined,
    displayName
  })

  const {
    getParticipantState,
    syncRemoteParticipantStates,
    updateRemoteStates,
    startRemoteMessageLoop,
    startRemoteStateLoop,
    stopAllSimulation
  } = useRoomSimulation({
    joined,
    remoteParticipants,
    appendChatMessage,
    mockMessages: MOCK_REMOTE_MESSAGES,
    beforeCommitState: (name, nextState, field) => {
      if (field !== 'mic') return nextState
      if (allowParticipantMic.value) return nextState
      if (isParticipantAllowedToSpeak(name)) return nextState
      return {
        ...nextState,
        mic: false
      }
    }
  })

  const {
    toggleHandRaise,
    toggleScreenShare,
    enforceParticipantMicPolicy,
    muteAllParticipants,
    disableAllParticipantCameras,
    lowerAllParticipantHands,
    toggleParticipantMicPermission,
    toggleMeetingLock: toggleMeetingLockRaw,
    resetModerationState
  } = useRoomModeration({
    joined,
    appendChatMessage,
    updateRemoteStates,
    handRaised,
    screenSharing,
    meetingLocked,
    allowParticipantMic,
    isParticipantAllowedToSpeak
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

  const { loadRoomPreferences, saveRoomPreferences } = useRoomPreferences({
    displayName,
    cameraEnabled,
    micEnabled,
    selectedVideoDeviceId,
    selectedAudioDeviceId
  })

  const isParticipantInRoom = (name) => {
    const normalizedName = normalizeName(name)
    if (!normalizedName) return false
    if (normalizedName === normalizedDisplayName.value) return true
    return remoteParticipants.value.some((participant) => normalizeName(participant) === normalizedName)
  }

  const appendParticipantToMeeting = (name) => {
    const normalizedName = normalizeName(name)
    if (!normalizedName || !meeting.value) return false
    const participants = Array.isArray(meeting.value.participants) ? meeting.value.participants : []
    if (participants.some((participant) => normalizeName(participant) === normalizedName)) return false
    meeting.value = {
      ...meeting.value,
      participants: [...participants, normalizedName]
    }
    return true
  }

  const formatTime = (time) => {
    return new Intl.DateTimeFormat('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(time))
  }

  const getRoleLabel = (role) => {
    if (role === 'host') return '主持人'
    if (role === 'cohost') return '联席主持人'
    return '参会者'
  }

  const pruneRoleState = () => {
    if (!meeting.value) return
    const participants = Array.isArray(meeting.value.participants) ? meeting.value.participants : []
    const normalizedParticipants = new Set(participants.map((name) => normalizeName(name)))
    const nextCohosts = cohostList.value.filter(
      (name) => normalizedParticipants.has(name) && !isHostName(name)
    )
    if (nextCohosts.length !== cohostList.value.length) {
      cohostList.value = nextCohosts
    }
    const nextAllowed = new Set()
    for (const name of allowedSpeakerSet.value) {
      if (normalizedParticipants.has(name)) {
        nextAllowed.add(name)
      }
    }
    allowedSpeakerSet.value = nextAllowed
  }

  const assertModerationPermission = () => {
    if (canModerate.value) return true
    ElMessage.warning('仅主持人或联席主持人可操作')
    return false
  }

  const assertRolePermission = () => {
    if (canManageRoles.value) return true
    ElMessage.warning('仅主持人可管理角色')
    return false
  }

  const toggleCohostRole = (name) => {
    if (!assertRolePermission()) return
    const normalizedName = normalizeName(name)
    if (!normalizedName || !meeting.value) return
    const participants = Array.isArray(meeting.value.participants) ? meeting.value.participants : []
    if (!participants.some((participant) => normalizeName(participant) === normalizedName)) {
      ElMessage.warning('该成员不在会议中')
      return
    }
    if (isHostName(normalizedName)) {
      ElMessage.info('主持人无需设置为联席主持人')
      return
    }
    const next = new Set(cohostList.value)
    let message = ''
    if (next.has(normalizedName)) {
      next.delete(normalizedName)
      message = `已取消 ${normalizedName} 的联席主持人权限`
    } else {
      next.add(normalizedName)
      message = `已将 ${normalizedName} 设置为联席主持人`
    }
    cohostList.value = Array.from(next)
    if (joined.value) {
      appendChatMessage('系统', message, 'system')
    }
    ElMessage.success(message)
  }

  const removeParticipant = (name) => {
    if (!assertModerationPermission()) return
    const normalizedName = normalizeName(name)
    if (!normalizedName || !meeting.value) return
    if (normalizedName === normalizedDisplayName.value) {
      ElMessage.warning('不能移出自己')
      return
    }
    if (isHostName(normalizedName)) {
      ElMessage.warning('不能移出主持人')
      return
    }
    const participants = Array.isArray(meeting.value.participants) ? meeting.value.participants : []
    if (!participants.some((participant) => normalizeName(participant) === normalizedName)) return
    meeting.value = {
      ...meeting.value,
      participants: participants.filter((participant) => normalizeName(participant) !== normalizedName)
    }
    setParticipantSpeakAllowed(normalizedName, false)
    cohostList.value = cohostList.value.filter((cohost) => cohost !== normalizedName)
    if (joined.value) {
      appendChatMessage('系统', `${normalizedName} 已被移出会议（演示）`, 'system')
    }
    ElMessage.success(`已移出 ${normalizedName}`)
  }

  const allowParticipantToSpeak = (name) => {
    if (!assertModerationPermission()) return
    const normalizedName = normalizeName(name)
    if (!normalizedName) return
    setParticipantSpeakAllowed(normalizedName, true)
    updateRemoteStates((state, participantName) => {
      if (normalizeName(participantName) !== normalizedName) return state
      return {
        ...state,
        mic: true,
        handRaised: false
      }
    })
    if (joined.value) {
      appendChatMessage('系统', `主持人已允许 ${normalizedName} 发言`, 'system')
    }
  }

  const {
    waitingParticipants,
    waitingCount,
    admitWaitingParticipant,
    rejectWaitingParticipant,
    clearWaitingRoom,
    admitAllWaitingParticipants,
    startWaitingRequestLoop,
    stopWaitingRequestLoop,
    resetWaitingRoom
  } = useRoomWaitingRoom({
    joined,
    meetingLocked,
    appendChatMessage,
    isParticipantInRoom,
    onAdmitParticipant: (name) => {
      const joinedInRoom = appendParticipantToMeeting(name)
      if (!joinedInRoom) return
      syncRemoteParticipantStates()
      enforceParticipantMicPolicy()
      if (!joined.value) return
      startRemoteMessageLoop()
      startRemoteStateLoop()
    }
  })

  const participantItems = computed(() => {
    const selfName = displayName.value || '我'
    const selfRole = userRole.value
    const others = remoteParticipants.value.map((name) => {
      const state = getParticipantState(name)
      const role = getRole(name)
      const allowedToSpeak = isParticipantAllowedToSpeak(name)
      return {
        name,
        isSelf: false,
        role,
        roleLabel: getRoleLabel(role),
        isHost: role === 'host',
        isCohost: role === 'cohost',
        mic: state.mic,
        camera: state.camera,
        handRaised: state.handRaised,
        sharing: false,
        allowSpeak: !allowParticipantMic.value && allowedToSpeak,
        micRestricted: !allowParticipantMic.value && !allowedToSpeak
      }
    })

    return [
      {
        name: selfName,
        isSelf: true,
        role: selfRole,
        roleLabel: getRoleLabel(selfRole),
        isHost: selfRole === 'host',
        isCohost: selfRole === 'cohost',
        mic: micEnabled.value,
        camera: cameraEnabled.value,
        handRaised: handRaised.value,
        sharing: screenSharing.value,
        allowSpeak: false,
        micRestricted: false
      },
      ...others
    ]
  })

  const handRaiseQueue = computed(() => {
    const queue = remoteParticipants.value
      .map((name) => {
        const state = getParticipantState(name)
        if (!state.handRaised) return null
        const raisedAt = state.handRaisedAt || Date.now()
        const role = getRole(name)
        return {
          id: name,
          name,
          raisedAt,
          raisedAtLabel: formatTime(raisedAt),
          role,
          roleLabel: getRoleLabel(role),
          isHost: role === 'host',
          isCohost: role === 'cohost'
        }
      })
      .filter(Boolean)
      .sort((a, b) => a.raisedAt - b.raisedAt)
    return queue
  })

  const roleCandidates = computed(() => {
    return remoteParticipants.value.map((name) => {
      const role = getRole(name)
      return {
        name,
        role,
        roleLabel: getRoleLabel(role),
        isHost: role === 'host',
        isCohost: role === 'cohost'
      }
    })
  })

  const handleToggleHandRaise = () => {
    const nextRaised = !handRaised.value
    toggleHandRaise()
    selfHandRaisedAt.value = nextRaised ? Date.now() : 0
  }

  const handleMuteAllParticipants = () => {
    if (!assertModerationPermission()) return
    clearAllowedSpeakers()
    muteAllParticipants()
  }

  const handleDisableAllParticipantCameras = () => {
    if (!assertModerationPermission()) return
    disableAllParticipantCameras()
  }

  const handleLowerAllParticipantHands = () => {
    if (!assertModerationPermission()) return
    lowerAllParticipantHands()
  }

  const handleToggleParticipantMicPermission = () => {
    if (!assertModerationPermission()) return
    toggleParticipantMicPermission()
  }

  const mediaTip = computed(() => {
    if (mediaError.value) return mediaError.value
    if (meetingStatus.value === 'finished') return '该会议已结束，仅可查看会前检查。'
    if (!videoDevices.value.length && !audioDevices.value.length) return '未检测到可用设备'
    return '当前为纯前端演示：仅本地预览，不进行多人实时通话。'
  })

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
      handleToggleHandRaise()
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
    pruneRoleState()
  }

  const resetJoinState = () => {
    stopAllSimulation()
    resetWaitingRoom()
    joined.value = false
    joinedAt.value = 0
    selfHandRaisedAt.value = 0
    clearAllowedSpeakers()
    cohostList.value = []
    resetChatState()
    resetModerationState()
  }

  const admitParticipantFromWaitingRoom = (participantId) => {
    if (!assertModerationPermission()) return
    admitWaitingParticipant(participantId)
  }

  const rejectParticipantFromWaitingRoom = (participantId) => {
    if (!assertModerationPermission()) return
    rejectWaitingParticipant(participantId)
  }

  const clearWaitingRoomRequests = () => {
    if (!assertModerationPermission()) return
    clearWaitingRoom()
  }

  const toggleMeetingLock = () => {
    if (!assertModerationPermission()) return
    const isLocked = toggleMeetingLockRaw()
    if (isLocked) {
      startWaitingRequestLoop()
      return
    }
    stopWaitingRequestLoop()
    admitAllWaitingParticipants()
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
    resetChatState()
    resetModerationState()
    selfHandRaisedAt.value = 0
    syncRemoteParticipantStates()
    enforceParticipantMicPolicy()

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
    pruneRoleState()
    syncRemoteParticipantStates()
    enforceParticipantMicPolicy()
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
    [joined, meetingLocked],
    ([isJoined, isLocked]) => {
      if (isJoined && isLocked) {
        startWaitingRequestLoop()
        return
      }
      stopWaitingRequestLoop()
    },
    { immediate: true }
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
    meetingLocked,
    allowParticipantMic,
    userRole,
    canModerate,
    canManageRoles,
    waitingParticipants,
    waitingCount,
    emojiList,
    showVideoPlaceholder,
    mediaTip,
    canJoinMeeting,
    joinActionLabel,
    roomElapsedText,
    stageParticipants,
    hiddenStageCount,
    participantItems,
    handRaiseQueue,
    roleCandidates,
    getParticipantState,
    toggleCamera,
    toggleMicrophone,
    toggleHandRaise: handleToggleHandRaise,
    toggleScreenShare,
    muteAllParticipants: handleMuteAllParticipants,
    disableAllParticipantCameras: handleDisableAllParticipantCameras,
    lowerAllParticipantHands: handleLowerAllParticipantHands,
    toggleParticipantMicPermission: handleToggleParticipantMicPermission,
    toggleMeetingLock,
    toggleCohostRole,
    removeParticipant,
    allowParticipantToSpeak,
    admitParticipantFromWaitingRoom,
    rejectParticipantFromWaitingRoom,
    clearWaitingRoomRequests,
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
