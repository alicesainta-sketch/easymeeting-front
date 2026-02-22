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
    <section class="waiting-room">
      <div class="waiting-room-head">
        <span>等候室申请</span>
        <el-tag size="small" :type="meetingLocked ? 'warning' : 'info'" effect="plain">
          {{ meetingLocked ? `${waitingCount} 待审批` : '未启用' }}
        </el-tag>
      </div>
      <template v-if="meetingLocked">
        <ul v-if="waitingParticipants.length" class="waiting-list">
          <li v-for="participant in waitingParticipants" :key="participant.id" class="waiting-item">
            <div class="waiting-meta">
              <strong>{{ participant.name }}</strong>
              <span>{{ participant.requestedAtLabel }} 申请</span>
            </div>
            <div class="waiting-actions">
              <el-button
                size="small"
                type="success"
                text
                @click="$emit('admit-waiting-participant', participant.id)"
              >
                通过
              </el-button>
              <el-button
                size="small"
                type="danger"
                text
                @click="$emit('reject-waiting-participant', participant.id)"
              >
                拒绝
              </el-button>
            </div>
          </li>
        </ul>
        <p v-else class="waiting-empty">暂无入会申请</p>
        <el-button
          class="clear-waiting-btn"
          size="small"
          text
          type="danger"
          :disabled="!waitingCount"
          @click="$emit('clear-waiting-room')"
        >
          清空申请
        </el-button>
      </template>
      <p v-else class="waiting-empty">开启锁定后，新成员将进入等候室等待审批</p>
    </section>
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
  },
  waitingParticipants: {
    type: Array,
    default: () => []
  },
  waitingCount: {
    type: Number,
    default: 0
  }
})

defineEmits([
  'mute-all',
  'disable-all-cameras',
  'lower-all-hands',
  'toggle-participant-mic-permission',
  'toggle-meeting-lock',
  'admit-waiting-participant',
  'reject-waiting-participant',
  'clear-waiting-room'
])
</script>
