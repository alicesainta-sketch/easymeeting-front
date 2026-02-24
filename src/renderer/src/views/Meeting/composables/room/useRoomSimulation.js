import { onUnmounted, ref } from 'vue'

const useRoomSimulation = ({
  joined,
  remoteParticipants,
  appendChatMessage,
  mockMessages = [],
  beforeCommitState = (_, state) => state
}) => {
  const remoteParticipantStates = ref({})
  let remoteMessageTimer = null
  let remoteStateTimer = null

  const createInitialState = () => {
    const handRaised = Math.random() > 0.84
    return {
      mic: Math.random() > 0.22,
      camera: Math.random() > 0.26,
      handRaised,
      handRaisedAt: handRaised ? Date.now() - Math.floor(Math.random() * 90_000) : 0
    }
  }

  const resolveHandRaisedAt = (nextState, prevState) => {
    if (!nextState?.handRaised) return 0
    if (nextState.handRaisedAt) return nextState.handRaisedAt
    if (prevState?.handRaised && prevState.handRaisedAt) return prevState.handRaisedAt
    return Date.now()
  }

  const randomFrom = (items = []) => {
    if (!items.length) return ''
    return items[Math.floor(Math.random() * items.length)]
  }

  const getParticipantState = (name) => {
    return (
      remoteParticipantStates.value[name] || {
        mic: true,
        camera: true,
        handRaised: false,
        handRaisedAt: 0
      }
    )
  }

  const syncRemoteParticipantStates = () => {
    const nextStates = {}
    for (const name of remoteParticipants.value) {
      const existing = remoteParticipantStates.value[name]
      if (existing) {
        nextStates[name] = {
          ...existing,
          handRaisedAt: existing.handRaised ? existing.handRaisedAt || Date.now() : 0
        }
      } else {
        nextStates[name] = createInitialState()
      }
    }
    remoteParticipantStates.value = nextStates
  }

  const updateRemoteStates = (updater) => {
    if (typeof updater !== 'function') return
    const nextStates = {}
    for (const name of remoteParticipants.value) {
      const current = getParticipantState(name)
      const candidate = updater({ ...current }, name)
      const nextState = candidate || current
      nextStates[name] = {
        ...nextState,
        handRaised: Boolean(nextState.handRaised),
        handRaisedAt: resolveHandRaisedAt(nextState, current)
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
      const committedState = beforeCommitState(name, nextState, field) || nextState
      if (field === 'handRaised') {
        committedState.handRaisedAt = committedState.handRaised
          ? resolveHandRaisedAt(committedState, prevState)
          : 0
      }

      if (committedState[field] === prevState[field]) {
        startRemoteStateLoop()
        return
      }

      remoteParticipantStates.value = {
        ...remoteParticipantStates.value,
        [name]: committedState
      }

      if (field === 'mic') {
        appendChatMessage(
          '系统',
          `${name}${committedState.mic ? '开启' : '关闭'}了麦克风`,
          'system'
        )
      } else if (field === 'camera') {
        appendChatMessage(
          '系统',
          `${name}${committedState.camera ? '开启' : '关闭'}了摄像头`,
          'system'
        )
      } else {
        appendChatMessage(
          '系统',
          `${name}${committedState.handRaised ? '举手' : '放下了手'}`,
          'system'
        )
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
    updateRemoteStates,
    startRemoteMessageLoop,
    startRemoteStateLoop,
    stopRemoteMessageLoop,
    stopRemoteStateLoop,
    stopAllSimulation
  }
}

export { useRoomSimulation }
