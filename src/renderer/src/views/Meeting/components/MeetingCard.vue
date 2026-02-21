<template>
  <article class="meeting-card" @click="$emit('open', meeting.id)">
    <div class="card-header">
      <h3>{{ meeting.title }}</h3>
      <el-tag :type="statusMap[status].type" effect="light">
        {{ statusMap[status].label }}
      </el-tag>
    </div>
    <p class="topic">{{ meeting.topic }}</p>
    <div class="meta">
      <span>房间号：{{ meeting.roomCode }}</span>
      <span>主持人：{{ meeting.host }}</span>
      <span>{{ formatTimeRange(meeting.startTime, meeting.durationMinutes) }}</span>
      <span :class="['countdown', getCountdownClass(meeting)]"
        >倒计时：{{ getCountdownLabel(meeting) }}</span
      >
    </div>
    <div class="card-actions">
      <el-button
        v-if="status === 'upcoming'"
        text
        type="primary"
        @click.stop="$emit('remind', meeting)"
        >提醒我</el-button
      >
      <el-button text @click.stop="$emit('edit', meeting)">编辑</el-button>
      <el-button text type="danger" @click.stop="$emit('remove', meeting.id)">删除</el-button>
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
  }
})

defineEmits(['open', 'remind', 'edit', 'remove'])

const status = computed(() => props.getStatus(props.meeting))
</script>

<style lang="scss" scoped>
.meeting-card {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #fff;
  padding: 12px;
  cursor: pointer;
  transition:
    0.2s border-color ease,
    0.2s transform ease,
    0.2s box-shadow ease;

  &:hover {
    border-color: #93c5fd;
    transform: translateY(-1px);
    box-shadow: 0 8px 20px rgba(30, 64, 175, 0.08);
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 8px;
    margin-bottom: 6px;

    h3 {
      font-size: 16px;
      color: #0f172a;
    }
  }

  .topic {
    color: #334155;
    font-size: 14px;
    margin-bottom: 8px;
    line-height: 1.5;
  }

  .meta {
    display: grid;
    gap: 4px;
    color: #64748b;
    font-size: 12px;

    .countdown {
      font-weight: 600;
    }

    .countdown-normal {
      color: #475569;
    }

    .countdown-soon {
      color: #d97706;
    }

    .countdown-urgent {
      color: #dc2626;
    }

    .countdown-live {
      color: #16a34a;
    }

    .countdown-finished {
      color: #64748b;
    }
  }

  .card-actions {
    margin-top: 6px;
    display: flex;
    justify-content: flex-end;
    gap: 4px;
  }
}
</style>
