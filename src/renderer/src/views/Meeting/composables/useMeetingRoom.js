import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'
import { MeetingEventType } from '@/core/meeting-engine'
import { getMeetingById, getMeetingStatus } from '@/mock/meetings'
import { getCurrentUser } from '@/utils/auth'
import { copyText } from '@/utils/clipboard'
import { useRoomChat } from './room/useRoomChat'
import { useMeetingEngine } from './room/useMeetingEngine'
import { useRoomMedia } from './room/useRoomMedia'
import { useRoomModeration } from './room/useRoomModeration'
import { useRoomPreferences } from './room/useRoomPreferences'
import { useRoomRoles } from './room/useRoomRoles'
import { useRoomSimulation } from './room/useRoomSimulation'
import { useRoomWaitingRoom } from './room/useRoomWaitingRoom'

const MAX_STAGE_PARTICIPANTS = 3
const NICKNAME_MIN = 2
const NICKNAME_MAX = 12
const NICKNAME_RULE = /^[A-Za-z0-9_\u4e00-\u9fa5]+$/
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
  const joinPassword = ref('')

  const handRaised = ref(false)
  const selfHandRaisedAt = ref(0)
  const screenSharing = ref(false)
  const meetingLocked = ref(false)
  const allowParticipantMic = ref(true)
  const meetingStatus = computed(() => {
    if (!meeting.value) return 'finished'
    return getMeetingStatus(meeting.value)
  })
  const scheduleStatusLabel = computed(() => {
    if (meetingStatus.value === 'live') return '已进入会议时间'
    if (meetingStatus.value === 'upcoming') return '会议尚未开始'
    return '会议已结束'
  })

  const roomElapsedText = computed(() => {
    if (!joinedAt.value) return '00:00'
    const elapsedSeconds = Math.floor((nowTick.value - joinedAt.value) / 1000)
    const minutes = String(Math.floor(elapsedSeconds / 60)).padStart(2, '0')
    const seconds = String(elapsedSeconds % 60).padStart(2, '0')
    return `${minutes}:${seconds}`
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
    normalizeName,
    normalizedDisplayName,
    isHostName,
    getRole,
    getRoleLabel,
    userRole,
    canModerate,
    canManageRoles,
    waitingWhitelistCount,
    isInWaitingWhitelist,
    isParticipantAllowedToSpeak,
    setParticipantSpeakAllowed,
    clearAllowedSpeakers,
    resetRoleState,
    pruneRoleState,
    assertModerationPermission,
    toggleCohostRole,
    removeParticipant
  } = useRoomRoles({
    meeting,
    displayName,
    allowParticipantMic,
    joined,
    appendChatMessage
  })

  const meetingId = computed(() => meeting.value?.id || route.params.id)
  const actorName = computed(() => normalizedDisplayName.value || displayName.value || '我')
  const actorRole = computed(() => userRole.value || 'participant')

  // 会议引擎：统一事件溯源、状态机与回放能力
  const {
    engineState,
    engineStateLabel,
    actionList: meetingEngineActions,
    actionHint: meetingEngineHint,
    eventTimeline,
    eventStats,
    replayIndex,
    replaySnapshot,
    appendMeetingEvent,
    requestMeetingAction,
    clearMeetingEvents,
    setReplayIndex
  } = useMeetingEngine({
    meetingId,
    actorName,
    actorRole,
    canModerate
  })

  const isMeetingPaused = computed(() => engineState.value === 'paused')
  const isMeetingEnded = computed(() => engineState.value === 'ended')
  const interactionDisabledReason = computed(() => {
    if (!joined.value) return ''
    if (isMeetingEnded.value) return '会议已结束'
    if (isMeetingPaused.value) return '会议已暂停'
    return ''
  })
  const interactionDisabled = computed(() => Boolean(interactionDisabledReason.value))
  const meetingControlDisabledReason = computed(() => {
    if (isMeetingEnded.value) return '会议已结束，主持人控制已停用'
    return ''
  })
  const meetingControlDisabled = computed(() => isMeetingEnded.value)

  const canJoinMeeting = computed(() => meetingStatus.value !== 'finished')
  const passwordRequired = computed(() => Boolean(meeting.value?.roomPassword?.trim?.()))
  const nicknameTip = computed(
    () => `昵称规则：${NICKNAME_MIN}-${NICKNAME_MAX} 位，支持中文/字母/数字/下划线`
  )
  const policyTip = computed(() => {
    if (meetingStatus.value !== 'upcoming') return ''
    if (meeting.value?.allowParticipantEarlyJoin ?? true) return ''
    if (canModerate.value) return '会议尚未开始，主持人/联席主持人可提前入会'
    return '会议尚未开始，普通参会者暂不可入会'
  })
  const joinActionLabel = computed(() => {
    if (meetingStatus.value === 'finished') return '会议已结束'
    if (meetingStatus.value === 'upcoming') return '提前加入'
    return '加入会议'
  })

  const validateDisplayName = () => {
    const name = normalizedDisplayName.value
    if (!name) {
      ElMessage.warning('请输入会议昵称')
      return false
    }
    if (name.length < NICKNAME_MIN || name.length > NICKNAME_MAX) {
      ElMessage.warning(`昵称需为 ${NICKNAME_MIN}-${NICKNAME_MAX} 位`)
      return false
    }
    if (!NICKNAME_RULE.test(name)) {
      ElMessage.warning('昵称仅支持中文、字母、数字与下划线')
      return false
    }
    return true
  }

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
    return remoteParticipants.value.some(
      (participant) => normalizeName(participant) === normalizedName
    )
  }

  const appendParticipantToMeeting = (name) => {
    const normalizedName = normalizeName(name)
    if (!normalizedName || !meeting.value) return false
    const participants = Array.isArray(meeting.value.participants) ? meeting.value.participants : []
    if (participants.some((participant) => normalizeName(participant) === normalizedName))
      return false
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

  // 互动权限校验：会议暂停/结束时禁止参会者操作
  const assertInteractionAllowed = () => {
    if (!joined.value) return true
    if (isMeetingEnded.value) {
      ElMessage.warning('会议已结束，互动已关闭')
      return false
    }
    if (isMeetingPaused.value) {
      ElMessage.info('会议已暂停，互动暂不可用')
      return false
    }
    return true
  }

  // 主持人控制校验：会议结束后禁止主持人控制动作
  const assertMeetingControlAllowed = () => {
    if (!meetingControlDisabled.value) return true
    ElMessage.warning(meetingControlDisabledReason.value || '会议已结束，主持人控制已停用')
    return false
  }

  // 统一封装事件写入，避免在未入会时污染事件流
  const recordMeetingEvent = (type, payload) => {
    if (!joined.value) return
    appendMeetingEvent(type, payload)
  }

  const allowParticipantToSpeak = (name) => {
    if (!assertMeetingControlAllowed()) return
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
    recordMeetingEvent(MeetingEventType.SPEAKER_ALLOWED, { name: normalizedName })
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
    shouldAutoAdmit: isInWaitingWhitelist,
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
    if (!assertInteractionAllowed()) return
    const nextRaised = !handRaised.value
    toggleHandRaise()
    selfHandRaisedAt.value = nextRaised ? Date.now() : 0
    recordMeetingEvent(
      nextRaised ? MeetingEventType.HAND_RAISED : MeetingEventType.HAND_LOWERED,
      nextRaised ? { raisedAt: selfHandRaisedAt.value } : {}
    )
  }

  // 切换屏幕共享状态并同步事件流
  const handleToggleScreenShare = () => {
    if (!assertInteractionAllowed()) return
    const nextSharing = !screenSharing.value
    toggleScreenShare()
    recordMeetingEvent(
      nextSharing ? MeetingEventType.SCREEN_SHARE_STARTED : MeetingEventType.SCREEN_SHARE_STOPPED
    )
  }

  // 切换本地麦克风状态并同步事件流
  const handleToggleMicrophone = async () => {
    if (!assertInteractionAllowed()) return
    await toggleMicrophone()
    recordMeetingEvent(MeetingEventType.MIC_TOGGLED, { enabled: micEnabled.value })
  }

  // 切换本地摄像头状态并同步事件流
  const handleToggleCamera = async () => {
    if (!assertInteractionAllowed()) return
    await toggleCamera()
    recordMeetingEvent(MeetingEventType.CAMERA_TOGGLED, { enabled: cameraEnabled.value })
  }

  const handleMuteAllParticipants = () => {
    if (!assertMeetingControlAllowed()) return
    if (!assertModerationPermission()) return
    clearAllowedSpeakers()
    muteAllParticipants()
  }

  const handleDisableAllParticipantCameras = () => {
    if (!assertMeetingControlAllowed()) return
    if (!assertModerationPermission()) return
    disableAllParticipantCameras()
  }

  const handleLowerAllParticipantHands = () => {
    if (!assertMeetingControlAllowed()) return
    if (!assertModerationPermission()) return
    lowerAllParticipantHands()
  }

  const handleToggleParticipantMicPermission = () => {
    if (!assertMeetingControlAllowed()) return
    if (!assertModerationPermission()) return
    toggleParticipantMicPermission()
    recordMeetingEvent(MeetingEventType.MIC_POLICY_CHANGED, {
      allowParticipantMic: allowParticipantMic.value
    })
  }

  // 主持人角色调整：记录角色变更事件用于回放
  const handleToggleCohostRole = (name) => {
    if (!assertMeetingControlAllowed()) return
    const beforeRole = getRole(name)
    toggleCohostRole(name)
    const afterRole = getRole(name)
    if (beforeRole !== afterRole) {
      recordMeetingEvent(MeetingEventType.ROLE_CHANGED, {
        name,
        from: beforeRole,
        to: afterRole
      })
    }
  }

  // 移出成员时记录离会事件，避免权限失败时误记
  const handleRemoveParticipant = (name) => {
    if (!assertMeetingControlAllowed()) return
    const wasInRoom = isParticipantInRoom(name)
    removeParticipant(name)
    if (wasInRoom && !isParticipantInRoom(name)) {
      recordMeetingEvent(MeetingEventType.USER_LEFT, { name })
    }
  }

  const mediaTip = computed(() => {
    if (mediaError.value) return mediaError.value
    if (meetingStatus.value === 'finished') return '该会议已结束，仅可查看会前检查。'
    if (!videoDevices.value.length && !audioDevices.value.length) return '未检测到可用设备'
    return '当前为设备预览模式，未接入实时通话。'
  })

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
      void handleToggleMicrophone()
      return
    }
    if (key === 'v') {
      event.preventDefault()
      void handleToggleCamera()
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
    joinPassword.value = ''
    resetRoleState()
    resetChatState()
    resetModerationState()
  }

  const admitParticipantFromWaitingRoom = (participantId) => {
    if (!assertMeetingControlAllowed()) return
    if (!assertModerationPermission()) return
    const target = admitWaitingParticipant(participantId)
    if (target) {
      recordMeetingEvent(MeetingEventType.WAIT_APPROVED, { name: target.name })
    }
  }

  const rejectParticipantFromWaitingRoom = (participantId) => {
    if (!assertMeetingControlAllowed()) return
    if (!assertModerationPermission()) return
    const target = rejectWaitingParticipant(participantId)
    if (target) {
      recordMeetingEvent(MeetingEventType.WAIT_REJECTED, { name: target.name })
    }
  }

  const clearWaitingRoomRequests = () => {
    if (!assertMeetingControlAllowed()) return
    if (!assertModerationPermission()) return
    clearWaitingRoom()
  }

  const admitAllWaitingRoom = () => {
    if (!assertMeetingControlAllowed()) return
    if (!assertModerationPermission()) return
    const count = admitAllWaitingParticipants()
    if (!count) {
      ElMessage.info('暂无待审批成员')
    }
  }

  const toggleMeetingLock = () => {
    if (!assertMeetingControlAllowed()) return
    if (!assertModerationPermission()) return
    const isLocked = toggleMeetingLockRaw()
    recordMeetingEvent(
      isLocked ? MeetingEventType.MEETING_LOCKED : MeetingEventType.MEETING_UNLOCKED
    )
    if (isLocked) {
      startWaitingRequestLoop()
      return
    }
    stopWaitingRequestLoop()
    admitAllWaitingParticipants()
  }

  // 会议状态机动作入口：统一校验 + 事件写入 + 反馈提示
  const handleMeetingEngineAction = (actionKey) => {
    const action = meetingEngineActions.value.find((item) => item.key === actionKey)
    const result = requestMeetingAction(actionKey)
    if (!result.ok) {
      if (result.reason) {
        ElMessage.warning(result.reason)
      }
      return
    }
    ElMessage.success(`${action?.label || '操作'}已记录`)
  }

  const joinMeeting = async () => {
    if (!canJoinMeeting.value) {
      ElMessage.info('会议已结束，无法加入')
      return
    }
    if (!validateDisplayName()) return
    if (meetingStatus.value === 'upcoming' && !(meeting.value?.allowParticipantEarlyJoin ?? true)) {
      if (!canModerate.value) {
        ElMessage.warning('会议尚未开始，普通参会者暂不可入会')
        return
      }
    }
    const password = meeting.value?.roomPassword?.trim?.() || ''
    if (password && joinPassword.value?.trim?.() !== password) {
      ElMessage.error('入会密码错误')
      return
    }
    const participants = Array.isArray(meeting.value?.participants)
      ? meeting.value.participants
      : []
    const hasDuplicateName = participants.some(
      (name) => normalizeName(name) === normalizedDisplayName.value
    )
    if (hasDuplicateName && !isHostName(normalizedDisplayName.value)) {
      ElMessage.warning('昵称已存在，请更换后重试')
      return
    }

    joined.value = true
    joinedAt.value = Date.now()
    resetChatState()
    resetModerationState()
    selfHandRaisedAt.value = 0
    syncRemoteParticipantStates()
    enforceParticipantMicPolicy()
    recordMeetingEvent(MeetingEventType.USER_JOINED, { name: normalizedDisplayName.value })

    appendChatMessage('系统', '你已加入会议', 'system')
    for (const name of stageParticipants.value) {
      appendChatMessage('系统', `${name} 在房间中`, 'system')
    }

    startRemoteMessageLoop()
    startRemoteStateLoop()
    await bindCurrentStream()
    await scrollChatToBottom()
    ElMessage.success('已加入会议')
  }

  const leaveMeeting = () => {
    recordMeetingEvent(MeetingEventType.USER_LEFT, { name: normalizedDisplayName.value })
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
    joinPassword,
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
    waitingWhitelistCount,
    waitingParticipants,
    waitingCount,
    emojiList,
    showVideoPlaceholder,
    mediaTip,
    canJoinMeeting,
    passwordRequired,
    joinActionLabel,
    nicknameTip,
    policyTip,
    scheduleStatusLabel,
    engineState,
    engineStateLabel,
    meetingEngineActions,
    meetingEngineHint,
    eventTimeline,
    eventStats,
    replayIndex,
    replaySnapshot,
    interactionDisabled,
    interactionDisabledReason,
    meetingControlDisabled,
    meetingControlDisabledReason,
    roomElapsedText,
    stageParticipants,
    hiddenStageCount,
    participantItems,
    handRaiseQueue,
    roleCandidates,
    getParticipantState,
    toggleCamera: handleToggleCamera,
    toggleMicrophone: handleToggleMicrophone,
    toggleHandRaise: handleToggleHandRaise,
    toggleScreenShare: handleToggleScreenShare,
    muteAllParticipants: handleMuteAllParticipants,
    disableAllParticipantCameras: handleDisableAllParticipantCameras,
    lowerAllParticipantHands: handleLowerAllParticipantHands,
    toggleParticipantMicPermission: handleToggleParticipantMicPermission,
    toggleMeetingLock,
    toggleCohostRole: handleToggleCohostRole,
    removeParticipant: handleRemoveParticipant,
    allowParticipantToSpeak,
    admitAllWaitingRoom,
    admitParticipantFromWaitingRoom,
    rejectParticipantFromWaitingRoom,
    clearWaitingRoomRequests,
    clearMeetingEvents,
    setReplayIndex,
    handleMeetingEngineAction,
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
