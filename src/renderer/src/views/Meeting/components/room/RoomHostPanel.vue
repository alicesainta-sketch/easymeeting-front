<template>
  <section class="side-card host-card">
    <div class="card-title-row">
      <h4>主持人控制</h4>
      <el-tag size="small" type="warning" effect="plain">演示模式</el-tag>
    </div>
    <div class="host-actions">
      <el-button size="small" @click="$emit('mute-all')">全员静音</el-button>
      <el-button size="small" @click="$emit('disable-all-cameras')">关闭他人摄像头</el-button>
      <el-button size="small" @click="$emit('lower-all-hands')">清空举手</el-button>
    </div>
    <div class="host-switch-row">
      <span>允许参会者自行开麦</span>
      <el-switch
        :model-value="allowParticipantMic"
        @change="$emit('toggle-participant-mic-permission')"
      ></el-switch>
    </div>
    <div class="host-switch-row">
      <span>锁定会议（新成员需审批）</span>
      <el-switch :model-value="meetingLocked" @change="$emit('toggle-meeting-lock')"></el-switch>
    </div>
  </section>
</template>

<script setup>
defineProps({
  allowParticipantMic: {
    type: Boolean,
    default: true
  },
  meetingLocked: {
    type: Boolean,
    default: false
  }
})

defineEmits([
  'mute-all',
  'disable-all-cameras',
  'lower-all-hands',
  'toggle-participant-mic-permission',
  'toggle-meeting-lock'
])
</script>
