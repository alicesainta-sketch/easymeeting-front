import { computed, nextTick, onUnmounted, ref, watch } from 'vue'

const useRoomMedia = ({ joined, appendChatMessage }) => {
  const previewVideoRef = ref(null)
  const roomVideoRef = ref(null)
  const currentStream = ref(null)
  const mediaError = ref('')

  const cameraEnabled = ref(true)
  const micEnabled = ref(true)
  const videoDevices = ref([])
  const audioDevices = ref([])
  const selectedVideoDeviceId = ref('')
  const selectedAudioDeviceId = ref('')

  const stopStream = (stream) => {
    if (!stream) return
    for (const track of stream.getTracks()) {
      track.stop()
    }
  }

  const releaseMedia = () => {
    stopStream(currentStream.value)
    currentStream.value = null
  }

  const bindCurrentStream = async () => {
    await nextTick()
    const activeVideo = joined.value ? roomVideoRef.value : previewVideoRef.value
    const idleVideo = joined.value ? previewVideoRef.value : roomVideoRef.value
    if (idleVideo) idleVideo.srcObject = null
    if (!activeVideo) return
    activeVideo.srcObject = currentStream.value || null
  }

  const loadDevices = async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return
    const devices = await navigator.mediaDevices.enumerateDevices()
    videoDevices.value = devices.filter((device) => device.kind === 'videoinput')
    audioDevices.value = devices.filter((device) => device.kind === 'audioinput')

    const hasSelectedVideo = videoDevices.value.some(
      (device) => device.deviceId === selectedVideoDeviceId.value
    )
    const hasSelectedAudio = audioDevices.value.some(
      (device) => device.deviceId === selectedAudioDeviceId.value
    )

    if ((!selectedVideoDeviceId.value || !hasSelectedVideo) && videoDevices.value.length) {
      selectedVideoDeviceId.value = videoDevices.value[0].deviceId
    }
    if ((!selectedAudioDeviceId.value || !hasSelectedAudio) && audioDevices.value.length) {
      selectedAudioDeviceId.value = audioDevices.value[0].deviceId
    }
  }

  const createConstraints = () => {
    const videoConstraint = cameraEnabled.value
      ? selectedVideoDeviceId.value
        ? { deviceId: { exact: selectedVideoDeviceId.value } }
        : true
      : false
    const audioConstraint = micEnabled.value
      ? selectedAudioDeviceId.value
        ? { deviceId: { exact: selectedAudioDeviceId.value } }
        : true
      : false
    return {
      video: videoConstraint,
      audio: audioConstraint
    }
  }

  const restartPreview = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      mediaError.value = '当前环境不支持摄像头/麦克风访问'
      return
    }

    releaseMedia()

    if (!cameraEnabled.value && !micEnabled.value) {
      mediaError.value = ''
      await loadDevices()
      await bindCurrentStream()
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia(createConstraints())
      currentStream.value = stream
      mediaError.value = ''
      await loadDevices()
      await bindCurrentStream()
    } catch (error) {
      mediaError.value =
        error?.name === 'NotAllowedError' ? '未授权访问摄像头/麦克风' : '设备启动失败'
      await loadDevices()
      await bindCurrentStream()
    }
  }

  const toggleMicrophone = async () => {
    micEnabled.value = !micEnabled.value
    await restartPreview()
    if (joined.value) {
      appendChatMessage('系统', micEnabled.value ? '你已开启麦克风' : '你已关闭麦克风', 'system')
    }
  }

  const toggleCamera = async () => {
    cameraEnabled.value = !cameraEnabled.value
    await restartPreview()
    if (joined.value) {
      appendChatMessage('系统', cameraEnabled.value ? '你已开启摄像头' : '你已关闭摄像头', 'system')
    }
  }

  const showVideoPlaceholder = computed(() => {
    return (
      !cameraEnabled.value || !currentStream.value || !currentStream.value.getVideoTracks().length
    )
  })

  watch([selectedVideoDeviceId, selectedAudioDeviceId], async () => {
    await restartPreview()
  })

  watch(joined, async () => {
    await bindCurrentStream()
  })

  onUnmounted(() => {
    releaseMedia()
  })

  return {
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
  }
}

export { useRoomMedia }
