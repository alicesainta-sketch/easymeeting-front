<template>
  <section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div class="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
      <div class="space-y-3">
        <div class="flex flex-wrap items-center gap-2">
          <span class="text-xs uppercase tracking-[0.2em] text-slate-400">Meeting brief</span>
          <el-tag :type="statusMap[status].type" effect="plain" size="small">
            {{ statusMap[status].label }}
          </el-tag>
        </div>
        <h2 class="text-2xl font-semibold text-slate-900">{{ meeting.title }}</h2>
        <p class="text-sm text-slate-500">{{ meeting.topic || '暂无主题' }}</p>
        <div class="flex flex-wrap gap-2 text-xs text-slate-500">
          <span class="rounded-full bg-slate-100 px-2 py-1">开始 {{ startLabel }}</span>
          <span class="rounded-full bg-slate-100 px-2 py-1">结束 {{ endLabel }}</span>
          <span class="rounded-full bg-slate-100 px-2 py-1">时长 {{ durationLabel }}</span>
        </div>
      </div>
      <div class="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 xl:w-[300px]">
        <p class="text-xs uppercase tracking-wide text-slate-400">倒计时</p>
        <p :class="['mt-2 text-2xl font-semibold', countdownClass]">{{ countdownLabel }}</p>
        <div class="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-500">
          <div class="rounded-xl border border-slate-200 bg-white px-3 py-2">
            <p class="text-[11px] text-slate-400">主持人</p>
            <p class="mt-1 font-semibold text-slate-700">{{ meeting.host }}</p>
          </div>
          <div class="rounded-xl border border-slate-200 bg-white px-3 py-2">
            <p class="text-[11px] text-slate-400">会议室</p>
            <p class="mt-1 font-semibold text-slate-700">{{ meeting.roomCode }}</p>
          </div>
          <div class="rounded-xl border border-slate-200 bg-white px-3 py-2">
            <p class="text-[11px] text-slate-400">参会人</p>
            <p class="mt-1 font-semibold text-slate-700">{{ participantCount }} 人</p>
          </div>
          <div class="rounded-xl border border-slate-200 bg-white px-3 py-2">
            <p class="text-[11px] text-slate-400">安全策略</p>
            <p class="mt-1 font-semibold text-slate-700">{{ securityLabel }}</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  meeting: {
    type: Object,
    required: true
  },
  status: {
    type: String,
    required: true
  },
  statusMap: {
    type: Object,
    required: true
  },
  countdownLabel: {
    type: String,
    required: true
  },
  countdownClass: {
    type: String,
    required: true
  },
  formatDateTime: {
    type: Function,
    required: true
  }
})

const startLabel = computed(() => props.formatDateTime(props.meeting.startTime))
const endLabel = computed(() => {
  const start = new Date(props.meeting.startTime).getTime()
  const end = start + Number(props.meeting.durationMinutes || 0) * 60 * 1000
  return props.formatDateTime(end)
})
const durationLabel = computed(() => `${props.meeting.durationMinutes} 分钟`)
const participantCount = computed(() => props.meeting.participants?.length || 0)
const securityLabel = computed(() => {
  if (props.meeting.roomPassword) return '需要密码'
  return '免密入会'
})
</script>
