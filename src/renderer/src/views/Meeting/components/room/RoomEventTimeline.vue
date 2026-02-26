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

    <div class="mt-3 grid grid-cols-2 gap-2 text-xs">
      <div class="rounded-lg bg-slate-50 p-2">
        <div class="text-slate-400">事件总数</div>
        <div class="text-sm font-semibold text-slate-700">{{ eventStats.total }}</div>
      </div>
      <div class="rounded-lg bg-slate-50 p-2">
        <div class="text-slate-400">最近事件</div>
        <div class="text-sm font-semibold text-slate-700">
          {{ eventStats.lastTimeLabel || '暂无' }}
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
        <ol v-if="eventTimeline.length" class="flex flex-col gap-2">
          <li
            v-for="(item, index) in eventTimeline"
            :key="item.id"
            class="rounded-lg border p-2 text-xs"
            :class="index === safeReplayIndex ? 'border-sky-400 bg-white' : 'border-transparent'"
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
import { computed } from 'vue'

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
    default: () => ({ stateLabel: '', participantCount: 0 })
  }
})

const emit = defineEmits(['run-action', 'clear-events', 'update:replay-index'])

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
</script>
