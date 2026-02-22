<template>
  <AppHeader title="会议房间" :show-bottom-border="true"></AppHeader>
  <div class="room-page">
    <el-empty v-if="!meeting" description="会议不存在或已被删除">
      <el-button type="primary" @click="goBackToList">回到会议列表</el-button>
    </el-empty>

    <template v-else>
      <section v-if="!joined" class="prejoin-layout">
        <article class="preview-panel">
          <video ref="previewVideoRef" class="preview-video" autoplay playsinline muted></video>
          <div v-if="showVideoPlaceholder" class="video-placeholder">摄像头预览不可用</div>
          <div class="meeting-badge">
            <strong>{{ meeting.title }}</strong>
            <span>房间号：{{ meeting.roomCode }}</span>
          </div>
        </article>

        <article class="setting-panel">
          <h3>会前检查</h3>
          <el-input v-model.trim="displayName" placeholder="请输入会议昵称"></el-input>

          <div class="switch-row">
            <span>摄像头</span>
            <el-switch :model-value="cameraEnabled" @change="toggleCamera"></el-switch>
          </div>
          <el-select
            v-model="selectedVideoDeviceId"
            placeholder="选择摄像头"
            :disabled="!videoDevices.length || !cameraEnabled"
          >
            <el-option
              v-for="device in videoDevices"
              :key="device.deviceId"
              :label="device.label || '摄像头设备'"
              :value="device.deviceId"
            ></el-option>
          </el-select>

          <div class="switch-row">
            <span>麦克风</span>
            <el-switch :model-value="micEnabled" @change="toggleMicrophone"></el-switch>
          </div>
          <el-select
            v-model="selectedAudioDeviceId"
            placeholder="选择麦克风"
            :disabled="!audioDevices.length || !micEnabled"
          >
            <el-option
              v-for="device in audioDevices"
              :key="device.deviceId"
              :label="device.label || '麦克风设备'"
              :value="device.deviceId"
            ></el-option>
          </el-select>

          <p class="tip">{{ mediaTip }}</p>
          <div class="actions">
            <el-button @click="goBackToDetail">返回详情</el-button>
            <el-button type="primary" :disabled="!canJoinMeeting" @click="joinMeeting">
              {{ joinActionLabel }}
            </el-button>
          </div>
        </article>
      </section>

      <section v-else class="in-room">
        <header class="in-room-header">
          <div>
            <h3>{{ meeting.title }}</h3>
            <p>房间号：{{ meeting.roomCode }}</p>
          </div>
          <div class="header-actions">
            <span>已加入 {{ roomElapsedText }}</span>
            <el-button size="small" @click="copyRoomCode">复制房间号</el-button>
          </div>
        </header>

        <div class="room-main">
          <div class="stage-grid">
            <article class="stage-tile local">
              <video ref="roomVideoRef" class="room-video" autoplay playsinline muted></video>
              <div v-if="showVideoPlaceholder" class="video-placeholder">你的视频已关闭</div>
              <span class="name-tag">{{ displayName || '我' }}</span>
              <span v-if="screenSharing" class="share-badge">共享中</span>
            </article>
            <article v-for="name in stageParticipants" :key="name" class="stage-tile remote">
              <div class="avatar">{{ name.slice(0, 1) }}</div>
              <div class="remote-status">
                <i
                  v-if="!getParticipantState(name).mic"
                  class="iconfont icon-mic-close"
                  title="麦克风关闭"
                ></i>
                <i
                  v-if="!getParticipantState(name).camera"
                  class="iconfont icon-video2-close"
                  title="摄像头关闭"
                ></i>
                <span v-if="getParticipantState(name).handRaised" class="raise-tag">举手</span>
              </div>
              <span class="name-tag">{{ name }}</span>
            </article>
            <p v-if="hiddenStageCount > 0" class="stage-hint">
              另有 {{ hiddenStageCount }} 位参会者在右侧列表中显示
            </p>
          </div>

          <aside class="room-side">
            <section class="side-card">
              <h4>参会者（{{ participantItems.length }}）</h4>
              <ul class="participant-list">
                <li v-for="item in participantItems" :key="item.name" class="participant-item">
                  <span class="participant-name">
                    {{ item.name }}
                    <em v-if="item.isSelf">（我）</em>
                  </span>
                  <span class="participant-state">
                    <el-tag size="small" :type="item.mic ? 'success' : 'info'" effect="plain">
                      {{ item.mic ? '麦克风开' : '麦克风关' }}
                    </el-tag>
                    <el-tag size="small" :type="item.camera ? 'success' : 'info'" effect="plain">
                      {{ item.camera ? '摄像头开' : '摄像头关' }}
                    </el-tag>
                    <el-tag v-if="item.handRaised" size="small" type="warning" effect="plain">
                      举手中
                    </el-tag>
                    <el-tag
                      v-if="item.isSelf && item.sharing"
                      size="small"
                      type="danger"
                      effect="plain"
                    >
                      共享中
                    </el-tag>
                  </span>
                </li>
              </ul>
            </section>

            <section class="side-card chat-card">
              <div class="card-title-row">
                <h4>聊天（本地）</h4>
                <el-button
                  link
                  type="primary"
                  :disabled="!chatMessages.length"
                  @click="clearChatMessages"
                >
                  清空
                </el-button>
              </div>
              <div ref="chatListRef" class="chat-list">
                <p v-if="!chatMessages.length" class="chat-empty">暂无消息</p>
                <div
                  v-for="message in chatMessages"
                  :key="message.id"
                  :class="['chat-item', message.type]"
                >
                  <strong>{{ message.sender }}</strong>
                  <span>{{ message.content }}</span>
                  <time>{{ message.time }}</time>
                </div>
              </div>
              <div class="chat-input-row">
                <el-input
                  v-model.trim="chatInput"
                  placeholder="发送消息（仅本地展示）"
                  @keyup.enter="sendChatMessage"
                ></el-input>
                <el-button type="primary" @click="sendChatMessage">发送</el-button>
              </div>
            </section>
          </aside>
        </div>

        <footer class="control-bar">
          <el-button
            class="control-icon-btn"
            :type="micEnabled ? 'primary' : 'info'"
            :title="micEnabled ? '关闭麦克风' : '开启麦克风'"
            :aria-label="micEnabled ? '关闭麦克风' : '开启麦克风'"
            plain
            @click="toggleMicrophone"
          >
            <i :class="['iconfont', micEnabled ? 'icon-mic' : 'icon-mic-close']"></i>
          </el-button>
          <el-button
            class="control-icon-btn"
            :type="cameraEnabled ? 'primary' : 'info'"
            :title="cameraEnabled ? '关闭摄像头' : '开启摄像头'"
            :aria-label="cameraEnabled ? '关闭摄像头' : '开启摄像头'"
            plain
            @click="toggleCamera"
          >
            <i :class="['iconfont', cameraEnabled ? 'icon-video2' : 'icon-video2-close']"></i>
          </el-button>
          <el-button
            class="control-icon-btn"
            :type="handRaised ? 'warning' : 'info'"
            :title="handRaised ? '取消举手' : '举手'"
            :aria-label="handRaised ? '取消举手' : '举手'"
            plain
            @click="toggleHandRaise"
          >
            <i class="iconfont icon-contact"></i>
          </el-button>
          <el-button
            class="control-icon-btn"
            :type="screenSharing ? 'danger' : 'info'"
            :title="screenSharing ? '停止共享屏幕' : '共享屏幕'"
            :aria-label="screenSharing ? '停止共享屏幕' : '共享屏幕'"
            plain
            @click="toggleScreenShare"
          >
            <i
              :class="[
                'iconfont',
                screenSharing ? 'icon-share-screen2-close' : 'icon-share-screen2'
              ]"
            ></i>
          </el-button>
          <el-button @click="goBackToDetail">返回详情</el-button>
          <el-button type="danger" @click="leaveMeeting">离开会议</el-button>
          <span class="shortcut-tip">快捷键：M 麦克风 / V 摄像头 / R 举手</span>
        </footer>
      </section>
    </template>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'
import { getMeetingById, getMeetingStatus } from '@/mock/meetings'
import { getCurrentUser } from '@/utils/auth'

const route = useRoute()
const router = useRouter()
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

const meeting = ref(null)
const joined = ref(false)
const joinedAt = ref(0)
const nowTick = ref(Date.now())
let clockTimer = null
let remoteMessageTimer = null
let remoteStateTimer = null

const previewVideoRef = ref(null)
const roomVideoRef = ref(null)
const chatListRef = ref(null)
const currentStream = ref(null)
const mediaError = ref('')

const user = getCurrentUser()
const displayName = ref(user?.nickname || user?.email?.split('@')[0] || '')
const cameraEnabled = ref(true)
const micEnabled = ref(true)
const videoDevices = ref([])
const audioDevices = ref([])
const selectedVideoDeviceId = ref('')
const selectedAudioDeviceId = ref('')
const chatInput = ref('')
const chatMessages = ref([])
const handRaised = ref(false)
const screenSharing = ref(false)
const remoteParticipantStates = ref({})

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

const getParticipantState = (name) => {
  return remoteParticipantStates.value[name] || { mic: true, camera: true, handRaised: false }
}

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

const showVideoPlaceholder = computed(() => {
  return (
    !cameraEnabled.value || !currentStream.value || !currentStream.value.getVideoTracks().length
  )
})

const mediaTip = computed(() => {
  if (mediaError.value) return mediaError.value
  if (meetingStatus.value === 'finished') return '该会议已结束，仅可查看会前检查。'
  if (!videoDevices.value.length && !audioDevices.value.length) return '未检测到可用设备'
  return '当前为纯前端演示：仅本地预览，不进行多人实时通话。'
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

const randomFrom = (items = []) => {
  if (!items.length) return ''
  return items[Math.floor(Math.random() * items.length)]
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
    const content = randomFrom(MOCK_REMOTE_MESSAGES)
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

const clearChatMessages = () => {
  chatMessages.value = []
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

const stopStream = (stream) => {
  if (!stream) return
  for (const track of stream.getTracks()) {
    track.stop()
  }
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

  stopStream(currentStream.value)
  currentStream.value = null

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
  stopRemoteMessageLoop()
  stopRemoteStateLoop()
  joined.value = false
  joinedAt.value = 0
  chatInput.value = ''
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
  stopRemoteMessageLoop()
  stopRemoteStateLoop()
  stopStream(currentStream.value)
  currentStream.value = null
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

watch([selectedVideoDeviceId, selectedAudioDeviceId], async () => {
  await restartPreview()
})

watch(joined, async () => {
  await bindCurrentStream()
})

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
  stopRemoteMessageLoop()
  stopRemoteStateLoop()
  stopStream(currentStream.value)
  currentStream.value = null
  if (!clockTimer) return
  window.clearInterval(clockTimer)
  clockTimer = null
})
</script>

<style scoped lang="scss">
.room-page {
  --room-bg-top: #edf3ff;
  --room-bg-mid: #f8fbff;
  --room-bg-bottom: #f2f6fb;
  --room-border: #d6e2f4;
  --room-border-soft: #e2eaf6;
  --room-text-primary: #0f172a;
  --room-text-secondary: #475569;
  --room-text-light: #94a3b8;
  --room-primary: #2563eb;
  --room-primary-soft: #dbeafe;
  --room-surface: rgba(255, 255, 255, 0.9);
  --room-shadow-soft: 0 10px 24px rgba(15, 23, 42, 0.06);
  --room-shadow-strong: 0 16px 36px rgba(15, 23, 42, 0.1);

  position: relative;
  isolation: isolate;
  height: calc(100vh - 35px);
  padding: 14px;
  overflow: auto;
  background: linear-gradient(
    165deg,
    var(--room-bg-top) 0%,
    var(--room-bg-mid) 43%,
    var(--room-bg-bottom) 100%
  );
}

.room-page::before,
.room-page::after {
  content: '';
  position: absolute;
  z-index: -1;
  pointer-events: none;
  filter: blur(2px);
}

.room-page::before {
  top: -160px;
  left: -120px;
  width: 360px;
  height: 360px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.2) 0%, rgba(59, 130, 246, 0) 72%);
}

.room-page::after {
  right: -150px;
  bottom: -170px;
  width: 420px;
  height: 420px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(14, 165, 233, 0.18) 0%, rgba(14, 165, 233, 0) 74%);
}

.prejoin-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 330px;
  gap: 14px;
  animation: room-fade-up 220ms ease-out;
}

.preview-panel,
.setting-panel,
.in-room {
  background: var(--room-surface);
  border: 1px solid var(--room-border);
  border-radius: 14px;
  box-shadow: var(--room-shadow-soft);
  backdrop-filter: blur(8px);
}

.preview-panel {
  position: relative;
  min-height: 420px;
  overflow: hidden;
}

.preview-panel::after {
  content: '';
  position: absolute;
  inset: 0;
  border: 1px solid rgba(219, 234, 254, 0.6);
  border-radius: 14px;
  pointer-events: none;
}

.preview-video,
.room-video {
  width: 100%;
  height: 100%;
  min-height: 420px;
  object-fit: cover;
  background: #0f172a;
}

.video-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #cbd5e1;
  letter-spacing: 0.3px;
  font-size: 14px;
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.86), rgba(15, 23, 42, 0.94));
}

.meeting-badge {
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: 12px;
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.28);
  padding: 10px 12px;
  display: flex;
  justify-content: space-between;
  color: #e2e8f0;
  background: linear-gradient(120deg, rgba(15, 23, 42, 0.76), rgba(30, 41, 59, 0.64));
  backdrop-filter: blur(3px);

  strong {
    font-size: 14px;
    font-weight: 600;
    letter-spacing: 0.3px;
  }

  span {
    opacity: 0.9;
    font-size: 12px;
  }
}

.setting-panel {
  padding: 16px;
  display: grid;
  gap: 12px;
  align-content: start;

  h3 {
    font-size: 18px;
    color: var(--room-text-primary);
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 2px;
  }

  h3::before {
    content: '';
    width: 4px;
    height: 18px;
    border-radius: 999px;
    background: linear-gradient(180deg, #3b82f6, #0ea5e9);
  }
}

.switch-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--room-text-secondary);
  font-size: 13px;
}

.tip {
  min-height: 32px;
  color: var(--room-text-secondary);
  font-size: 12px;
  line-height: 1.45;
  padding: 6px 8px;
  border-radius: 8px;
  background: rgba(241, 245, 249, 0.85);
  border: 1px dashed #cbd5e1;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 2px;

  :deep(.el-button) {
    min-width: 92px;
  }
}

.in-room {
  padding: 14px;
  min-height: calc(100vh - 63px);
  display: grid;
  grid-template-rows: auto 1fr auto;
  gap: 12px;
  animation: room-fade-up 220ms ease-out;
}

.in-room-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  border: 1px solid var(--room-border-soft);
  border-radius: 12px;
  background: linear-gradient(90deg, rgba(239, 246, 255, 0.95), rgba(248, 250, 252, 0.85));

  h3 {
    font-size: 18px;
    color: var(--room-text-primary);
    margin-bottom: 3px;
    letter-spacing: 0.2px;
  }

  p {
    color: var(--room-text-secondary);
    font-size: 13px;
  }
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--room-text-secondary);
}

.header-actions > span {
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid #bfdbfe;
  background: rgba(219, 234, 254, 0.72);
  color: #1d4ed8;
  font-size: 12px;
  font-weight: 600;
}

.stage-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  gap: 12px;
  align-content: start;
}

.room-main {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 14px;
}

.stage-tile {
  min-height: 220px;
  border-radius: 12px;
  border: 1px solid #d2dff2;
  position: relative;
  overflow: hidden;
  background: #0f172a;
  box-shadow: 0 10px 20px rgba(15, 23, 42, 0.16);
  transition:
    transform 180ms ease,
    box-shadow 180ms ease,
    border-color 180ms ease;
}

.stage-tile::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(15, 23, 42, 0) 60%, rgba(15, 23, 42, 0.35) 100%);
  pointer-events: none;
}

.stage-tile:hover {
  transform: translateY(-2px);
  border-color: #bfdbfe;
  box-shadow: var(--room-shadow-strong);
}

.stage-tile.local .room-video {
  min-height: 220px;
}

.stage-tile.remote {
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(circle at 30% 20%, rgba(59, 130, 246, 0.25), rgba(15, 23, 42, 0) 50%),
    linear-gradient(145deg, #0f172a, #1e293b);
}

.remote-status {
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  align-items: center;
  gap: 6px;
  z-index: 1;

  .iconfont {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    color: #f8fafc;
    background: rgba(15, 23, 42, 0.72);
    border: 1px solid rgba(148, 163, 184, 0.42);
  }
}

.raise-tag,
.share-badge {
  border-radius: 999px;
  padding: 3px 8px;
  font-size: 11px;
  font-weight: 600;
  color: #1e3a8a;
  background: #fef3c7;
  border: 1px solid #fde68a;
}

.share-badge {
  position: absolute;
  top: 12px;
  left: 12px;
  color: #b91c1c;
  background: #fee2e2;
  border-color: #fecaca;
  z-index: 1;
}

.stage-hint {
  grid-column: 1 / -1;
  margin: 0;
  color: var(--room-text-secondary);
  font-size: 12px;
  padding-left: 2px;
}

.avatar {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30px;
  font-weight: 700;
  color: #1e3a8a;
  background: linear-gradient(145deg, #dbeafe, #bfdbfe);
  box-shadow:
    0 8px 18px rgba(30, 64, 175, 0.25),
    inset 0 1px 2px rgba(255, 255, 255, 0.55);
}

.name-tag {
  position: absolute;
  left: 12px;
  bottom: 12px;
  padding: 5px 9px;
  border-radius: 9px;
  font-size: 12px;
  color: #f8fafc;
  background: rgba(15, 23, 42, 0.62);
  border: 1px solid rgba(203, 213, 225, 0.24);
  letter-spacing: 0.2px;
  z-index: 1;
}

.control-bar {
  position: sticky;
  bottom: 0;
  z-index: 4;
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px;
  padding: 10px;
  border: 1px solid #dbe5f5;
  border-radius: 12px;
  background: rgba(248, 251, 255, 0.9);
  backdrop-filter: blur(8px);
  box-shadow: 0 -4px 16px rgba(15, 23, 42, 0.08);
}

.control-icon-btn {
  width: 42px;
  min-width: 42px;
  padding: 8px;
  border-radius: 999px;

  .iconfont {
    font-size: 17px;
    line-height: 1;
  }
}

.shortcut-tip {
  width: 100%;
  text-align: center;
  margin-top: 4px;
  font-size: 12px;
  color: var(--room-text-secondary);
}

.room-side {
  display: grid;
  grid-template-rows: minmax(180px, auto) minmax(0, 1fr);
  gap: 10px;
  min-height: 0;
}

.side-card {
  border: 1px solid var(--room-border-soft);
  border-radius: 12px;
  padding: 12px;
  background: rgba(248, 251, 255, 0.8);
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.05);

  h4 {
    font-size: 14px;
    color: var(--room-text-primary);
    margin-bottom: 10px;
  }
}

.participant-list {
  list-style: none;
  display: grid;
  gap: 8px;
  max-height: 220px;
  overflow: auto;
  padding-right: 2px;
}

.participant-item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.95);
  padding: 9px;
}

.participant-name {
  color: var(--room-text-secondary);
  font-weight: 600;
  font-size: 13px;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  em {
    font-style: normal;
    color: var(--room-text-secondary);
    font-weight: 400;
    margin-left: 4px;
  }
}

.participant-state {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
  flex-wrap: wrap;
}

.chat-card {
  display: grid;
  grid-template-rows: auto 1fr auto;
  min-height: 300px;
}

.card-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;

  h4 {
    margin-bottom: 0;
  }
}

.chat-list {
  border: 1px solid #dde6f3;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.95);
  padding: 10px;
  display: grid;
  align-content: start;
  gap: 8px;
  overflow: auto;
  min-height: 0;
  max-height: min(48vh, 420px);
}

.chat-list::-webkit-scrollbar,
.participant-list::-webkit-scrollbar {
  width: 6px;
}

.chat-list::-webkit-scrollbar-thumb,
.participant-list::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: #cbd5e1;
}

.chat-empty {
  color: var(--room-text-light);
  font-size: 12px;
}

.chat-item {
  display: grid;
  gap: 2px;
  width: fit-content;
  max-width: calc(100% - 18px);
  font-size: 12px;
  color: var(--room-text-secondary);
  padding: 7px 9px;
  border-radius: 10px;
  border: 1px solid #dbeafe;
  background: #eff6ff;
  justify-self: start;

  strong {
    font-size: 12px;
    color: #1e40af;
  }

  time {
    color: var(--room-text-secondary);
    font-size: 11px;
    opacity: 0.85;
    justify-self: start;
  }

  &.self {
    background: #dcfce7;
    border-color: #86efac;
    justify-self: end;

    strong,
    time {
      justify-self: end;
    }
  }

  &.system {
    background: #f1f5f9;
    border-color: #cbd5e1;
    width: 100%;
    max-width: 100%;
  }
}

.chat-input-row {
  margin-top: 10px;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;

  :deep(.el-input__wrapper) {
    border-radius: 9px;
  }
}

:deep(.el-select__wrapper),
:deep(.el-input__wrapper) {
  border-radius: 9px;
}

:deep(.el-button) {
  border-radius: 9px;
}

@media (max-width: 1200px) {
  .room-main {
    grid-template-columns: minmax(0, 1fr) 300px;
  }
}

@media (max-width: 960px) {
  .room-page {
    padding: 10px;
  }

  .prejoin-layout {
    grid-template-columns: 1fr;
  }

  .room-main {
    grid-template-columns: 1fr;
  }

  .in-room-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .header-actions {
    width: 100%;
    justify-content: space-between;
  }

  .control-bar {
    justify-content: space-between;
  }

  .control-bar :deep(.el-button) {
    flex: 1 1 calc(50% - 4px);
    margin-left: 0;
  }

  .shortcut-tip {
    text-align: left;
  }
}

@media (max-width: 680px) {
  .preview-panel,
  .preview-video,
  .room-video {
    min-height: 300px;
  }

  .setting-panel {
    padding: 12px;
  }

  .in-room {
    padding: 10px;
  }

  .chat-list {
    max-height: 280px;
  }

  .chat-input-row {
    grid-template-columns: 1fr;
  }
}

@keyframes room-fade-up {
  from {
    opacity: 0;
    transform: translateY(8px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
