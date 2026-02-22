import { onUnmounted, ref } from 'vue'

const useRoomSimulation = ({
  joined,
  remoteParticipants,
  appendChatMessage,
  mockMessages = []
}) => {
  const remoteParticipantStates = ref({})
  let remoteMessageTimer = null
  let remoteStateTimer = null

  const randomFrom = (items = []) => {
    if (!items.length) return ''
    return items[Math.floor(Math.random() * items.length)]
  }

  const getParticipantState = (name) => {
    return remoteParticipantStates.value[name] || { mic: true, camera: true, handRaised: false }
  }

  const syncRemoteParticipantStates = () => {
    const nextStates = {}
    for (const name of remoteParticipants.value) {
      const existing = remoteParticipantStates.value[name]
      nextStates[name] = existing || {
        mic: Math.random() > 0.22,
        camera: Math.random() > 0.26,
        handRaised: Math.random() > 0.84
      }
    }
    remoteParticipantStates.value = nextStates
  }

  const stopRemoteMessageLoop = () => {
    if (!remoteMessageTimer) return
    window.clearTimeout(remoteMessageTimer)
    remoteMessageTimer = null
  }

  const startRemoteMessageLoop = () => {
    stopRemoteMessageLoop()
    if (!joined.value || !remoteParticipants.value.length) return

    const delay = 10000 + Math.floor(Math.random() * 14000)
    remoteMessageTimer = window.setTimeout(() => {
      if (!joined.value) return
      const sender = randomFrom(remoteParticipants.value)
      const content = randomFrom(mockMessages)
      appendChatMessage(sender, content)
      startRemoteMessageLoop()
    }, delay)
  }

  const stopRemoteStateLoop = () => {
    if (!remoteStateTimer) return
    window.clearTimeout(remoteStateTimer)
    remoteStateTimer = null
  }

  const startRemoteStateLoop = () => {
    stopRemoteStateLoop()
    if (!joined.value || !remoteParticipants.value.length) return

    const delay = 12000 + Math.floor(Math.random() * 10000)
    remoteStateTimer = window.setTimeout(() => {
      if (!joined.value || !remoteParticipants.value.length) return

      const name = randomFrom(remoteParticipants.value)
      const prevState = getParticipantState(name)
      const nextState = { ...prevState }
      const field = randomFrom(['mic', 'camera', 'handRaised'])
      nextState[field] = !nextState[field]

      remoteParticipantStates.value = {
        ...remoteParticipantStates.value,
        [name]: nextState
      }

      if (field === 'mic') {
        appendChatMessage('系统', `${name}${nextState.mic ? '开启' : '关闭'}了麦克风`, 'system')
      } else if (field === 'camera') {
        appendChatMessage('系统', `${name}${nextState.camera ? '开启' : '关闭'}了摄像头`, 'system')
      } else {
        appendChatMessage('系统', `${name}${nextState.handRaised ? '举手' : '放下了手'}`, 'system')
      }

      startRemoteStateLoop()
    }, delay)
  }

  const stopAllSimulation = () => {
    stopRemoteMessageLoop()
    stopRemoteStateLoop()
  }

  onUnmounted(() => {
    stopAllSimulation()
  })

  return {
    remoteParticipantStates,
    getParticipantState,
    syncRemoteParticipantStates,
    startRemoteMessageLoop,
    startRemoteStateLoop,
    stopRemoteMessageLoop,
    stopRemoteStateLoop,
    stopAllSimulation
  }
}

export { useRoomSimulation }
