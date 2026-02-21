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
            <el-button type="primary" @click="joinMeeting">加入会议</el-button>
          </div>
        </article>
      </section>

      <section v-else class="in-room">
        <header class="in-room-header">
          <div>
            <h3>{{ meeting.title }}</h3>
            <p>房间号：{{ meeting.roomCode }}</p>
          </div>
          <span>已加入 {{ roomElapsedText }}</span>
        </header>

        <div class="room-main">
          <div class="stage-grid">
            <article class="stage-tile local">
              <video ref="roomVideoRef" class="room-video" autoplay playsinline muted></video>
              <div v-if="showVideoPlaceholder" class="video-placeholder">你的视频已关闭</div>
              <span class="name-tag">{{ displayName || '我' }}</span>
            </article>
            <article v-for="name in remoteParticipants" :key="name" class="stage-tile remote">
              <div class="avatar">{{ name.slice(0, 1) }}</div>
              <span class="name-tag">{{ name }}</span>
            </article>
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
                  </span>
                </li>
              </ul>
            </section>

            <section class="side-card chat-card">
              <h4>聊天（本地）</h4>
              <div class="chat-list">
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
          <el-button :type="micEnabled ? 'primary' : 'info'" plain @click="toggleMicrophone">
            {{ micEnabled ? '麦克风开启' : '麦克风关闭' }}
          </el-button>
          <el-button :type="cameraEnabled ? 'primary' : 'info'" plain @click="toggleCamera">
            {{ cameraEnabled ? '摄像头开启' : '摄像头关闭' }}
          </el-button>
          <el-button @click="goBackToDetail">返回详情</el-button>
          <el-button type="danger" @click="leaveMeeting">离开会议</el-button>
        </footer>
      </section>
    </template>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'
import { getMeetingById } from '@/mock/meetings'
import { getCurrentUser } from '@/utils/auth'

const route = useRoute()
const router = useRouter()

const meeting = ref(null)
const joined = ref(false)
const joinedAt = ref(0)
const nowTick = ref(Date.now())
let clockTimer = null

const previewVideoRef = ref(null)
const roomVideoRef = ref(null)
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

const roomElapsedText = computed(() => {
  if (!joinedAt.value) return '00:00'
  const elapsedSeconds = Math.floor((nowTick.value - joinedAt.value) / 1000)
  const minutes = String(Math.floor(elapsedSeconds / 60)).padStart(2, '0')
  const seconds = String(elapsedSeconds % 60).padStart(2, '0')
  return `${minutes}:${seconds}`
})

const remoteParticipants = computed(() => {
  if (!meeting.value) return []
  return meeting.value.participants.filter((name) => name !== displayName.value).slice(0, 3)
})

const participantItems = computed(() => {
  const selfName = displayName.value || '我'
  const others = remoteParticipants.value.map((name) => ({
    name,
    isSelf: false,
    mic: true,
    camera: true
  }))
  return [
    {
      name: selfName,
      isSelf: true,
      mic: micEnabled.value,
      camera: cameraEnabled.value
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
  chatMessages.value.push({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    sender,
    content,
    type,
    time: formatClock(Date.now())
  })
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

  if (!selectedVideoDeviceId.value && videoDevices.value.length) {
    selectedVideoDeviceId.value = videoDevices.value[0].deviceId
  }
  if (!selectedAudioDeviceId.value && audioDevices.value.length) {
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

const joinMeeting = async () => {
  if (!displayName.value) {
    ElMessage.warning('请输入会议昵称')
    return
  }
  joined.value = true
  joinedAt.value = Date.now()
  chatMessages.value = []
  appendChatMessage('系统', '你已加入会议（纯前端演示）', 'system')
  await bindCurrentStream()
  ElMessage.success('已加入会议（纯前端演示）')
}

const sendChatMessage = () => {
  if (!joined.value) return
  if (!chatInput.value) return
  appendChatMessage(displayName.value || '我', chatInput.value, 'self')
  chatInput.value = ''
}

const leaveMeeting = () => {
  stopStream(currentStream.value)
  currentStream.value = null
  joined.value = false
  joinedAt.value = 0
  chatInput.value = ''
  goBackToDetail()
}

onMounted(async () => {
  meeting.value = await getMeetingById(route.params.id)
  await loadDevices()
  await restartPreview()
  clockTimer = window.setInterval(() => {
    nowTick.value = Date.now()
  }, 1000)
})

watch([selectedVideoDeviceId, selectedAudioDeviceId], async () => {
  await restartPreview()
})

watch(joined, async () => {
  await bindCurrentStream()
})

onUnmounted(() => {
  stopStream(currentStream.value)
  currentStream.value = null
  if (!clockTimer) return
  window.clearInterval(clockTimer)
  clockTimer = null
})
</script>

<style scoped lang="scss">
.room-page {
  height: calc(100vh - 35px);
  padding: 14px;
  overflow: auto;
  background: linear-gradient(180deg, #f3f7ff 0%, #ffffff 40%, #f8fafc 100%);
}

.prejoin-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 330px;
  gap: 12px;
}

.preview-panel,
.setting-panel,
.in-room {
  background: #fff;
  border: 1px solid #dbe5f5;
  border-radius: 12px;
}

.preview-panel {
  position: relative;
  min-height: 420px;
  overflow: hidden;
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
  font-size: 14px;
  background: rgba(15, 23, 42, 0.92);
}

.meeting-badge {
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: 12px;
  border-radius: 10px;
  padding: 10px 12px;
  display: flex;
  justify-content: space-between;
  color: #e2e8f0;
  background: rgba(15, 23, 42, 0.75);
}

.setting-panel {
  padding: 14px;
  display: grid;
  gap: 10px;
  align-content: start;

  h3 {
    font-size: 18px;
    color: #1e293b;
  }
}

.switch-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #334155;
}

.tip {
  min-height: 20px;
  color: #64748b;
  font-size: 12px;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.in-room {
  padding: 12px;
  min-height: calc(100vh - 63px);
  display: grid;
  grid-template-rows: auto 1fr auto;
  gap: 12px;
}

.in-room-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 10px;

  h3 {
    font-size: 18px;
    color: #0f172a;
    margin-bottom: 4px;
  }

  p {
    color: #64748b;
    font-size: 13px;
  }
}

.stage-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 10px;
}

.room-main {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 12px;
}

.stage-tile {
  min-height: 220px;
  border-radius: 10px;
  border: 1px solid #dbe5f5;
  position: relative;
  overflow: hidden;
  background: #0f172a;
}

.stage-tile.local .room-video {
  min-height: 220px;
}

.stage-tile.remote {
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: #0f172a;
  background: #bfdbfe;
}

.name-tag {
  position: absolute;
  left: 10px;
  bottom: 10px;
  padding: 4px 8px;
  border-radius: 8px;
  font-size: 12px;
  color: #f8fafc;
  background: rgba(15, 23, 42, 0.7);
}

.control-bar {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px;
}

.room-side {
  display: grid;
  grid-template-rows: auto 1fr;
  gap: 10px;
}

.side-card {
  border: 1px solid #dbe5f5;
  border-radius: 10px;
  padding: 10px;
  background: #f8fbff;

  h4 {
    font-size: 14px;
    color: #1e293b;
    margin-bottom: 8px;
  }
}

.participant-list {
  list-style: none;
  display: grid;
  gap: 8px;
}

.participant-item {
  display: grid;
  gap: 6px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
  padding: 8px;
}

.participant-name {
  color: #334155;
  font-weight: 600;
  font-size: 13px;

  em {
    font-style: normal;
    color: #64748b;
    font-weight: 400;
    margin-left: 4px;
  }
}

.participant-state {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.chat-card {
  display: grid;
  grid-template-rows: auto 1fr auto;
  min-height: 260px;
}

.chat-list {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
  padding: 8px;
  display: grid;
  align-content: start;
  gap: 8px;
  overflow: auto;
  max-height: 300px;
}

.chat-empty {
  color: #94a3b8;
  font-size: 12px;
}

.chat-item {
  display: grid;
  gap: 2px;
  font-size: 12px;
  color: #334155;
  padding: 6px 8px;
  border-radius: 8px;
  background: #eff6ff;

  strong {
    font-size: 12px;
    color: #1e3a8a;
  }

  time {
    color: #64748b;
    font-size: 11px;
    justify-self: end;
  }

  &.self {
    background: #dcfce7;
  }

  &.system {
    background: #f1f5f9;
  }
}

.chat-input-row {
  margin-top: 8px;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;
}

@media (max-width: 960px) {
  .prejoin-layout {
    grid-template-columns: 1fr;
  }

  .room-main {
    grid-template-columns: 1fr;
  }
}
</style>
