<template>
  <section class="side-card host-card">
    <div class="card-title-row">
      <h4>主持人控制</h4>
      <div class="title-tags">
        <el-tag size="small" :type="roleTagType" effect="plain">{{ roleLabel }}</el-tag>
        <el-tag size="small" type="warning" effect="plain">演示模式</el-tag>
      </div>
    </div>
    <div class="host-actions">
      <el-button
        size="small"
        :disabled="!canModerate || meetingControlDisabled"
        @click="$emit('mute-all')"
        >全员静音</el-button
      >
      <el-button
        size="small"
        :disabled="!canModerate || meetingControlDisabled"
        @click="$emit('disable-all-cameras')"
        >关闭他人摄像头</el-button
      >
      <el-button
        size="small"
        :disabled="!canModerate || meetingControlDisabled"
        @click="$emit('lower-all-hands')"
        >清空举手</el-button
      >
    </div>
    <div class="host-switch-row">
      <span>允许参会者自行开麦</span>
      <el-switch
        :model-value="allowParticipantMic"
        :disabled="!canModerate || meetingControlDisabled"
        @change="$emit('toggle-participant-mic-permission')"
      ></el-switch>
    </div>
    <div class="host-switch-row">
      <span>锁定会议（新成员需审批）</span>
      <el-switch
        :model-value="meetingLocked"
        :disabled="!canModerate || meetingControlDisabled"
        @change="$emit('toggle-meeting-lock')"
      ></el-switch>
    </div>
    <p
      v-if="meetingControlDisabled"
      class="rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-700"
    >
      {{ meetingControlDisabledReason || '会议已结束，主持人控制已停用' }}
    </p>
    <section class="hand-queue">
      <div class="queue-head">
        <span>举手队列</span>
        <el-tag size="small" :type="handRaiseQueue.length ? 'warning' : 'info'" effect="plain">
          {{ handRaiseQueue.length }} 人
        </el-tag>
      </div>
      <ul v-if="handRaiseQueue.length" class="queue-list">
        <li v-for="item in handRaiseQueue" :key="item.id" class="queue-item">
          <div class="queue-meta">
            <strong>{{ item.name }}</strong>
            <span>{{ item.raisedAtLabel }} 举手</span>
          </div>
          <div class="queue-actions">
            <el-tag v-if="item.isHost" size="small" type="danger" effect="plain">主持人</el-tag>
            <el-tag v-else-if="item.isCohost" size="small" type="warning" effect="plain"
              >联席主持</el-tag
            >
            <el-button
              size="small"
              type="primary"
              text
              :disabled="!canModerate || meetingControlDisabled"
              @click="$emit('allow-speaker', item.name)"
            >
              允许发言
            </el-button>
          </div>
        </li>
      </ul>
      <p v-else class="queue-empty">暂无举手成员</p>
    </section>
    <section class="member-manage">
      <div class="member-head">
        <span>参会者管理</span>
        <el-tag size="small" effect="plain">{{ roleCandidates.length }} 人</el-tag>
      </div>
      <ul v-if="roleCandidates.length" class="member-list">
        <li v-for="item in roleCandidates" :key="item.name" class="member-item">
          <div class="member-meta">
            <strong>{{ item.name }}</strong>
            <div class="member-tags">
              <el-tag v-if="item.isHost" size="small" type="danger" effect="plain">主持人</el-tag>
              <el-tag v-else-if="item.isCohost" size="small" type="warning" effect="plain"
                >联席主持</el-tag
              >
            </div>
          </div>
          <div class="member-actions">
            <el-button
              size="small"
              text
              :disabled="!canManageRoles || meetingControlDisabled || item.isHost"
              @click="$emit('toggle-cohost', item.name)"
            >
              {{ item.isCohost ? '取消联席' : '设为联席' }}
            </el-button>
            <el-button
              size="small"
              type="danger"
              text
              :disabled="!canModerate || meetingControlDisabled || item.isHost"
              @click="$emit('remove-participant', item.name)"
            >
              移出
            </el-button>
          </div>
        </li>
      </ul>
      <p v-else class="member-empty">暂无参会者</p>
    </section>
    <section class="waiting-room">
      <div class="waiting-room-head">
        <span>等候室申请</span>
        <el-tag size="small" :type="meetingLocked ? 'warning' : 'info'" effect="plain">
          {{ meetingLocked ? `${waitingCount} 待审批` : '未启用' }}
        </el-tag>
      </div>
      <div class="waiting-room-whitelist">
        <span>白名单自动通过</span>
        <el-tag size="small" effect="plain">{{ waitingWhitelistCount }} 人</el-tag>
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
                :disabled="!canModerate || meetingControlDisabled"
                @click="$emit('admit-waiting-participant', participant.id)"
              >
                通过
              </el-button>
              <el-button
                size="small"
                type="danger"
                text
                :disabled="!canModerate || meetingControlDisabled"
                @click="$emit('reject-waiting-participant', participant.id)"
              >
                拒绝
              </el-button>
            </div>
          </li>
        </ul>
        <p v-else class="waiting-empty">暂无入会申请</p>
        <div class="waiting-batch-actions">
          <el-button
            size="small"
            type="success"
            text
            :disabled="!canModerate || meetingControlDisabled || !waitingCount"
            @click="$emit('admit-all-waiting')"
          >
            全部通过
          </el-button>
          <el-button
            class="clear-waiting-btn"
            size="small"
            text
            type="danger"
            :disabled="!canModerate || meetingControlDisabled || !waitingCount"
            @click="$emit('clear-waiting-room')"
          >
            全部拒绝
          </el-button>
        </div>
      </template>
      <p v-else class="waiting-empty">开启锁定后，新成员将进入等候室等待审批</p>
    </section>
  </section>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  userRole: {
    type: String,
    default: 'participant'
  },
  canModerate: {
    type: Boolean,
    default: false
  },
  canManageRoles: {
    type: Boolean,
    default: false
  },
  allowParticipantMic: {
    type: Boolean,
    default: true
  },
  meetingLocked: {
    type: Boolean,
    default: false
  },
  handRaiseQueue: {
    type: Array,
    default: () => []
  },
  roleCandidates: {
    type: Array,
    default: () => []
  },
  waitingParticipants: {
    type: Array,
    default: () => []
  },
  waitingCount: {
    type: Number,
    default: 0
  },
  waitingWhitelistCount: {
    type: Number,
    default: 0
  },
  meetingControlDisabled: {
    type: Boolean,
    default: false
  },
  meetingControlDisabledReason: {
    type: String,
    default: ''
  }
})

const roleLabel = computed(() => {
  if (props.userRole === 'host') return '主持人'
  if (props.userRole === 'cohost') return '联席主持人'
  return '参会者'
})
const roleTagType = computed(() => {
  if (props.userRole === 'host') return 'danger'
  if (props.userRole === 'cohost') return 'warning'
  return 'info'
})

defineEmits([
  'mute-all',
  'disable-all-cameras',
  'lower-all-hands',
  'toggle-participant-mic-permission',
  'toggle-meeting-lock',
  'allow-speaker',
  'toggle-cohost',
  'remove-participant',
  'admit-all-waiting',
  'admit-waiting-participant',
  'reject-waiting-participant',
  'clear-waiting-room'
])
</script>
