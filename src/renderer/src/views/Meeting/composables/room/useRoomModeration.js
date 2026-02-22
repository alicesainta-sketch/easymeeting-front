const useRoomModeration = ({
  joined,
  appendChatMessage,
  updateRemoteStates,
  handRaised,
  screenSharing,
  meetingLocked,
  allowParticipantMic
}) => {
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

  const enforceParticipantMicPolicy = () => {
    if (allowParticipantMic.value) return
    updateRemoteStates((state) => ({
      ...state,
      mic: false
    }))
  }

  const muteAllParticipants = () => {
    updateRemoteStates((state) => ({
      ...state,
      mic: false,
      handRaised: false
    }))
    if (!joined.value) return
    appendChatMessage('系统', '主持人已执行全员静音', 'system')
  }

  const disableAllParticipantCameras = () => {
    updateRemoteStates((state) => ({
      ...state,
      camera: false
    }))
    if (!joined.value) return
    appendChatMessage('系统', '主持人已关闭所有参会者摄像头', 'system')
  }

  const lowerAllParticipantHands = () => {
    updateRemoteStates((state) => ({
      ...state,
      handRaised: false
    }))
    if (!joined.value) return
    appendChatMessage('系统', '主持人已清空举手队列', 'system')
  }

  const toggleParticipantMicPermission = () => {
    allowParticipantMic.value = !allowParticipantMic.value
    if (!allowParticipantMic.value) {
      enforceParticipantMicPolicy()
    }
    if (!joined.value) return
    appendChatMessage(
      '系统',
      allowParticipantMic.value ? '主持人已允许参会者自行开麦' : '主持人已禁止参会者自行开麦',
      'system'
    )
  }

  const toggleMeetingLock = () => {
    meetingLocked.value = !meetingLocked.value
    if (!joined.value) return
    appendChatMessage(
      '系统',
      meetingLocked.value ? '主持人已锁定会议（演示）' : '主持人已解除会议锁定（演示）',
      'system'
    )
  }

  const resetModerationState = () => {
    handRaised.value = false
    screenSharing.value = false
    meetingLocked.value = false
    allowParticipantMic.value = true
  }

  return {
    toggleHandRaise,
    toggleScreenShare,
    enforceParticipantMicPolicy,
    muteAllParticipants,
    disableAllParticipantCameras,
    lowerAllParticipantHands,
    toggleParticipantMicPermission,
    toggleMeetingLock,
    resetModerationState
  }
}

export { useRoomModeration }
