<template>
  <article
    class="group relative rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-lg"
    @click="$emit('open', meeting.id)"
  >
    <div class="flex items-start justify-between gap-3">
      <div>
        <p class="text-xs text-slate-500">房间 {{ meeting.roomCode }}</p>
        <h3 class="mt-1 text-base font-semibold text-slate-900">{{ meeting.title }}</h3>
      </div>
      <el-tag :type="statusMap[status].type" effect="plain">{{ statusMap[status].label }}</el-tag>
    </div>
    <p class="mt-2 text-sm text-slate-600">{{ meeting.topic || '暂无主题' }}</p>
    <div class="mt-3 grid gap-1 text-xs text-slate-500">
      <span>主持人：{{ meeting.host }}</span>
      <span>时间：{{ formatTimeRange(meeting.startTime, meeting.durationMinutes) }}</span>
      <span>参会人：{{ meeting.participants.length }} 人</span>
      <span :class="['font-semibold', getCountdownClass(meeting)]">
        倒计时：{{ getCountdownLabel(meeting) }}
      </span>
    </div>
    <div v-if="conflictMeta" class="mt-3 flex flex-wrap gap-2 text-[11px]">
      <span v-if="conflictMeta.room" class="rounded-full bg-rose-100 px-2 py-0.5 text-rose-600">
        会议室冲突
      </span>
      <span
        v-if="conflictMeta.participant"
        class="rounded-full bg-amber-100 px-2 py-0.5 text-amber-700"
      >
        参会人冲突
      </span>
    </div>
    <div class="mt-4 grid grid-cols-4 gap-2">
      <el-button
        v-if="status === 'upcoming'"
        class="w-full"
        text
        type="primary"
        @click.stop="$emit('remind', meeting)"
        >提醒我</el-button
      >
      <span v-else class="h-6"></span>
      <el-button class="w-full" text @click.stop="$emit('duplicate', meeting)">复制</el-button>
      <el-button class="w-full" text @click.stop="$emit('edit', meeting)">编辑</el-button>
      <el-button class="w-full" text type="danger" @click.stop="$emit('remove', meeting.id)">
        删除
      </el-button>
    </div>
  </article>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  meeting: {
    type: Object,
    required: true
  },
  statusMap: {
    type: Object,
    required: true
  },
  getStatus: {
    type: Function,
    required: true
  },
  getCountdownLabel: {
    type: Function,
    required: true
  },
  getCountdownClass: {
    type: Function,
    required: true
  },
  formatTimeRange: {
    type: Function,
    required: true
  },
  conflictMap: {
    type: Object,
    default: () => ({})
  }
})

defineEmits(['open', 'remind', 'duplicate', 'edit', 'remove'])

const status = computed(() => props.getStatus(props.meeting))
const conflictMeta = computed(() => props.conflictMap?.[props.meeting.id])
</script>
