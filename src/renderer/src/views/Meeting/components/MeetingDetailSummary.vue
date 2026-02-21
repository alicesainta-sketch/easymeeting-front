<template>
  <section class="summary">
    <div class="summary-main">
      <h2>{{ meeting.title }}</h2>
      <p>{{ meeting.topic }}</p>
      <p :class="['countdown', countdownClass]">倒计时：{{ countdownLabel }}</p>
    </div>
    <el-tag :type="statusMap[status].type" effect="dark">{{ statusMap[status].label }}</el-tag>
  </section>
</template>

<script setup>
defineProps({
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
  }
})
</script>

<style lang="scss" scoped>
.summary {
  background: #fff;
  border: 1px solid #dbeafe;
  border-radius: 12px;
  padding: 14px;
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 12px;

  .summary-main {
    h2 {
      font-size: 20px;
      color: #0f172a;
      margin-bottom: 4px;
    }

    p {
      color: #334155;
      font-size: 14px;
    }

    .countdown {
      margin-top: 6px;
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
}
</style>
