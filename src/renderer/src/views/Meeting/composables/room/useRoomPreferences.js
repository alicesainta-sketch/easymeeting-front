const ROOM_PREFS_KEY = 'easymeeting-room-preferences'

const useRoomPreferences = ({
  displayName,
  cameraEnabled,
  micEnabled,
  selectedVideoDeviceId,
  selectedAudioDeviceId
}) => {
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
      displayName: displayName.value.trim(),
      cameraEnabled: cameraEnabled.value,
      micEnabled: micEnabled.value,
      selectedVideoDeviceId: selectedVideoDeviceId.value,
      selectedAudioDeviceId: selectedAudioDeviceId.value
    }
    localStorage.setItem(ROOM_PREFS_KEY, JSON.stringify(payload))
  }

  return {
    loadRoomPreferences,
    saveRoomPreferences
  }
}

export { useRoomPreferences }
