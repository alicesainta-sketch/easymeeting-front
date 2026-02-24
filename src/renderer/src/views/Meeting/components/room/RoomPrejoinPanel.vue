<template>
  <section class="prejoin-layout">
    <article class="preview-panel">
      <video :ref="previewVideoRef" class="preview-video" autoplay playsinline muted></video>
      <div v-if="showVideoPlaceholder" class="video-placeholder">摄像头预览不可用</div>
      <div class="meeting-badge">
        <strong>{{ meetingTitle }}</strong>
        <span>房间号：{{ roomCode }}</span>
      </div>
    </article>

    <article class="setting-panel">
      <h3>会前检查</h3>
      <el-input
        :model-value="displayName"
        placeholder="请输入会议昵称"
        @update:model-value="$emit('update:display-name', $event?.trim?.() ?? $event)"
      ></el-input>
      <p v-if="nicknameTip" class="field-tip">{{ nicknameTip }}</p>
      <el-input
        v-if="passwordRequired"
        :model-value="joinPassword"
        type="password"
        show-password
        maxlength="12"
        placeholder="请输入入会密码"
        @update:model-value="$emit('update:join-password', $event?.trim?.() ?? $event)"
      ></el-input>

      <div class="switch-row">
        <span>摄像头</span>
        <el-switch :model-value="cameraEnabled" @change="$emit('toggle-camera')"></el-switch>
      </div>
      <el-select
        :model-value="selectedVideoDeviceId"
        placeholder="选择摄像头"
        :disabled="!videoDevices.length || !cameraEnabled"
        @update:model-value="$emit('update:selected-video-device-id', $event)"
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
        <el-switch :model-value="micEnabled" @change="$emit('toggle-microphone')"></el-switch>
      </div>
      <el-select
        :model-value="selectedAudioDeviceId"
        placeholder="选择麦克风"
        :disabled="!audioDevices.length || !micEnabled"
        @update:model-value="$emit('update:selected-audio-device-id', $event)"
      >
        <el-option
          v-for="device in audioDevices"
          :key="device.deviceId"
          :label="device.label || '麦克风设备'"
          :value="device.deviceId"
        ></el-option>
      </el-select>

      <p v-if="policyTip" class="policy-tip">{{ policyTip }}</p>
      <p class="tip">{{ mediaTip }}</p>
      <div class="actions">
        <el-button @click="$emit('back-detail')">返回详情</el-button>
        <el-button type="primary" :disabled="!canJoinMeeting" @click="$emit('join-meeting')">
          {{ joinActionLabel }}
        </el-button>
      </div>
    </article>
  </section>
</template>

<script setup>
defineProps({
  meetingTitle: {
    type: String,
    default: ''
  },
  roomCode: {
    type: String,
    default: ''
  },
  previewVideoRef: {
    type: [Object, Function],
    required: true
  },
  showVideoPlaceholder: {
    type: Boolean,
    default: false
  },
  displayName: {
    type: String,
    default: ''
  },
  cameraEnabled: {
    type: Boolean,
    default: true
  },
  micEnabled: {
    type: Boolean,
    default: true
  },
  videoDevices: {
    type: Array,
    default: () => []
  },
  audioDevices: {
    type: Array,
    default: () => []
  },
  selectedVideoDeviceId: {
    type: String,
    default: ''
  },
  selectedAudioDeviceId: {
    type: String,
    default: ''
  },
  mediaTip: {
    type: String,
    default: ''
  },
  canJoinMeeting: {
    type: Boolean,
    default: true
  },
  joinActionLabel: {
    type: String,
    default: '加入会议'
  },
  nicknameTip: {
    type: String,
    default: ''
  },
  passwordRequired: {
    type: Boolean,
    default: false
  },
  joinPassword: {
    type: String,
    default: ''
  },
  policyTip: {
    type: String,
    default: ''
  }
})

defineEmits([
  'update:display-name',
  'update:join-password',
  'update:selected-video-device-id',
  'update:selected-audio-device-id',
  'toggle-camera',
  'toggle-microphone',
  'back-detail',
  'join-meeting'
])
</script>
