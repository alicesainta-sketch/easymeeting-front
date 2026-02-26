<template>
  <section class="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
    <div class="flex items-start justify-between gap-3">
      <div>
        <p class="text-xs text-slate-500">会议引擎</p>
        <div class="mt-1 flex items-center gap-2">
          <span class="rounded-full px-2.5 py-1 text-xs font-semibold" :class="stateBadgeClass">
            {{ engineStateLabel }}
          </span>
          <span class="text-xs text-slate-500">计划：{{ scheduleStatusLabel }}</span>
        </div>
      </div>
      <button
        class="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-500 transition hover:border-slate-300 hover:text-slate-700 disabled:cursor-not-allowed disabled:border-slate-100 disabled:text-slate-300"
        :disabled="!eventTimeline.length"
        @click="$emit('clear-events')"
      >
        清空事件
      </button>
    </div>

    <p v-if="actionHint" class="mt-2 text-xs text-amber-600">{{ actionHint }}</p>

    <div class="mt-3 flex flex-wrap gap-2">
      <button
        v-for="action in actionList"
        :key="action.key"
        class="rounded-full px-3 py-1 text-xs font-semibold transition"
        :class="resolveActionClass(action)"
        :disabled="!action.enabled"
        @click="$emit('run-action', action.key)"
      >
        {{ action.label }}
      </button>
    </div>

    <div class="mt-3 grid grid-cols-3 gap-2 text-xs">
      <div class="rounded-lg bg-slate-50 p-2">
        <div class="text-slate-400">事件总数</div>
        <div class="text-sm font-semibold text-slate-700">{{ eventStats.total }}</div>
      </div>
      <div class="rounded-lg bg-slate-50 p-2">
        <div class="text-slate-400">当前筛选</div>
        <div class="text-sm font-semibold text-slate-700">{{ filteredTimeline.length }}</div>
      </div>
      <div class="rounded-lg bg-slate-50 p-2">
        <div class="text-slate-400">最近事件</div>
        <div class="text-sm font-semibold text-slate-700">
          {{ eventStats.lastTimeLabel || '暂无' }}
        </div>
      </div>
    </div>

    <div class="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
      <div class="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 py-1">
        <span>类型</span>
        <select
          v-model="selectedType"
          class="rounded border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-600"
        >
          <option value="all">全部</option>
          <option v-for="option in typeOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </div>
      <div class="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 py-1">
        <span>角色</span>
        <select
          v-model="selectedRole"
          class="rounded border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-600"
        >
          <option value="all">全部</option>
          <option v-for="option in roleOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </div>
      <button
        class="ml-auto rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-500 transition hover:border-slate-300 hover:text-slate-700 disabled:cursor-not-allowed disabled:border-slate-100 disabled:text-slate-300"
        :disabled="!filteredTimeline.length"
        @click="exportFilteredEvents"
      >
        导出事件 JSON
      </button>
    </div>

    <div class="mt-3 grid grid-cols-3 gap-2 text-xs">
      <div class="rounded-lg border border-slate-200 bg-white p-2">
        <div class="text-slate-400">回放状态</div>
        <div class="text-sm font-semibold text-slate-700">{{ replaySnapshot.stateLabel }}</div>
      </div>
      <div class="rounded-lg border border-slate-200 bg-white p-2">
        <div class="text-slate-400">参会人数</div>
        <div class="text-sm font-semibold text-slate-700">
          {{ replaySnapshot.participantCount }}
        </div>
      </div>
      <div class="rounded-lg border border-slate-200 bg-white p-2">
        <div class="text-slate-400">会议策略</div>
        <div class="text-sm font-semibold text-slate-700">
          {{ replaySnapshot.meetingLocked ? '已锁定' : '未锁定' }} /
          {{ replaySnapshot.allowParticipantMic ? '可自开麦' : '需审批' }}
        </div>
      </div>
    </div>

    <div class="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div class="flex items-center justify-between text-xs text-slate-500">
        <span>事件时间线</span>
        <span v-if="eventTimeline.length">
          回放：{{ replaySnapshot.stateLabel }} · {{ replaySnapshot.participantCount }}人
        </span>
        <span v-else>暂无事件</span>
      </div>
      <input
        type="range"
        class="mt-2 w-full accent-slate-700"
        :max="maxIndex"
        :value="safeReplayIndex"
        :disabled="!eventTimeline.length"
        @input="handleReplayInput"
      />
      <div class="mt-3 max-h-56 overflow-y-auto">
        <ol v-if="filteredTimeline.length" class="flex flex-col gap-2">
          <li
            v-for="item in filteredTimeline"
            :key="item.id"
            class="rounded-lg border p-2 text-xs"
            :class="item.id === activeEventId ? 'border-sky-400 bg-white' : 'border-transparent'"
          >
            <div class="flex items-center justify-between">
              <span class="font-medium text-slate-700">{{ item.title }}</span>
              <span class="text-slate-400">{{ item.timeLabel }}</span>
            </div>
            <p class="mt-1 text-slate-500">{{ item.actorLabel }} · {{ item.detail }}</p>
          </li>
        </ol>
        <p v-else class="text-xs text-slate-400">暂无事件，请在会议中进行操作。</p>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  engineState: {
    type: String,
    default: 'idle'
  },
  engineStateLabel: {
    type: String,
    default: ''
  },
  scheduleStatusLabel: {
    type: String,
    default: ''
  },
  actionList: {
    type: Array,
    default: () => []
  },
  actionHint: {
    type: String,
    default: ''
  },
  eventTimeline: {
    type: Array,
    default: () => []
  },
  eventStats: {
    type: Object,
    default: () => ({ total: 0, lastTimeLabel: '' })
  },
  replayIndex: {
    type: Number,
    default: -1
  },
  replaySnapshot: {
    type: Object,
    default: () => ({
      stateLabel: '',
      participantCount: 0,
      allowParticipantMic: true,
      meetingLocked: false
    })
  }
})

const emit = defineEmits(['run-action', 'clear-events', 'update:replay-index'])

const selectedType = ref('all')
const selectedRole = ref('all')

const ROLE_LABELS = {
  host: '主持人',
  cohost: '联席主持人',
  participant: '参会者',
  system: '系统'
}

const stateBadgeClass = computed(() => {
  const state = props.engineState
  if (state === 'live') return 'bg-emerald-100 text-emerald-700'
  if (state === 'paused') return 'bg-amber-100 text-amber-700'
  if (state === 'ended') return 'bg-rose-100 text-rose-700'
  return 'bg-slate-100 text-slate-600'
})

const maxIndex = computed(() => Math.max(props.eventTimeline.length - 1, 0))
const safeReplayIndex = computed(() => {
  if (!props.eventTimeline.length) return 0
  return Math.min(Math.max(props.replayIndex, 0), props.eventTimeline.length - 1)
})
const activeEventId = computed(() => {
  if (!props.eventTimeline.length) return ''
  return props.eventTimeline[safeReplayIndex.value]?.id || ''
})

const typeOptions = computed(() => {
  const map = new Map()
  for (const item of props.eventTimeline) {
    const value = item.raw?.type
    if (!value || map.has(value)) continue
    map.set(value, item.title)
  }
  return Array.from(map, ([value, label]) => ({ value, label }))
})

const roleOptions = computed(() => {
  const roles = new Set()
  for (const item of props.eventTimeline) {
    const role = item.raw?.actor?.role
    if (!role) continue
    roles.add(role)
  }
  return Array.from(roles).map((role) => ({
    value: role,
    label: ROLE_LABELS[role] || role
  }))
})

const filteredTimeline = computed(() => {
  return props.eventTimeline.filter((item) => {
    const typeMatch = selectedType.value === 'all' || item.raw?.type === selectedType.value
    const roleMatch = selectedRole.value === 'all' || item.raw?.actor?.role === selectedRole.value
    return typeMatch && roleMatch
  })
})

// 统一按钮样式，突出可操作与不可操作的差异
const resolveActionClass = (action) => {
  if (action.enabled) {
    return 'bg-slate-900 text-white hover:bg-slate-800'
  }
  return 'cursor-not-allowed bg-slate-100 text-slate-400'
}

// 拖动回放时确保索引合法，避免出现负数或超出事件长度
const handleReplayInput = (event) => {
  const nextValue = Number(event.target.value)
  if (!Number.isFinite(nextValue)) return
  if (!props.eventTimeline.length) return
  const bounded = Math.min(Math.max(nextValue, 0), props.eventTimeline.length - 1)
  ;(event?.target || {}).value = bounded
  emit('update:replay-index', bounded)
}

// 导出筛选后的事件 JSON，便于展示事件溯源能力
const exportFilteredEvents = () => {
  if (!filteredTimeline.value.length) return
  const payload = {
    exportedAt: new Date().toISOString(),
    filters: {
      type: selectedType.value,
      role: selectedRole.value
    },
    events: filteredTimeline.value.map((item) => item.raw)
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json;charset=utf-8'
  })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `easymeeting-events-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
  anchor.click()
  URL.revokeObjectURL(url)
}
</script>
