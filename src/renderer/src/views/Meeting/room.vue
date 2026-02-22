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
                  ref="chatInputRef"
                  v-model.trim="chatInput"
                  placeholder="发送消息（仅本地展示）"
                  @keyup.enter="sendChatMessage"
                ></el-input>
                <el-popover
                  v-model:visible="emojiPopoverVisible"
                  placement="top"
                  trigger="click"
                  :width="260"
                >
                  <template #reference>
                    <el-button class="emoji-btn" :aria-label="'选择表情'" title="选择表情">
                      <i class="iconfont icon-emoji"></i>
                    </el-button>
                  </template>
                  <div class="emoji-picker">
                    <button
                      v-for="emoji in emojiList"
                      :key="emoji"
                      type="button"
                      class="emoji-item"
                      @click="appendEmoji(emoji)"
                    >
                      {{ emoji }}
                    </button>
                  </div>
                </el-popover>
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
import { useMeetingRoom } from './composables/useMeetingRoom'

const {
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
} = useMeetingRoom()
</script>

<style scoped lang="scss">
@use './styles/room.scss' as *;
</style>
