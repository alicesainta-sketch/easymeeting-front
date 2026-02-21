<template>
  <AppHeader title="会议详情" :show-bottom-border="true"></AppHeader>
  <div class="detail-page">
    <div class="top-actions">
      <el-button @click="goBack">返回会议列表</el-button>
      <el-button type="primary" @click="enterMeeting">进入会议</el-button>
    </div>

    <el-empty v-if="!meeting" description="会议不存在或已被删除">
      <el-button type="primary" @click="goBack">回到列表</el-button>
    </el-empty>

    <template v-else>
      <section class="summary">
        <div class="summary-main">
          <h2>{{ meeting.title }}</h2>
          <p>{{ meeting.topic }}</p>
        </div>
        <el-tag :type="statusMap[status].type" effect="dark">{{ statusMap[status].label }}</el-tag>
      </section>

      <section class="grid">
        <article class="panel">
          <h3>基础信息</h3>
          <p><strong>房间号：</strong>{{ meeting.roomCode }}</p>
          <p><strong>主持人：</strong>{{ meeting.host }}</p>
          <p><strong>开始时间：</strong>{{ formatDateTime(meeting.startTime) }}</p>
          <p><strong>会议时长：</strong>{{ meeting.durationMinutes }} 分钟</p>
          <p><strong>参会人数：</strong>{{ meeting.participants.length }}</p>
        </article>

        <article class="panel">
          <h3>会议议程</h3>
          <ul v-if="meeting.agenda.length" class="agenda">
            <li v-for="item in meeting.agenda" :key="item">{{ item }}</li>
          </ul>
          <p v-else>暂无议程</p>
        </article>
      </section>

      <section class="panel">
        <h3>参会人</h3>
        <div class="participants">
          <el-tag v-for="name in meeting.participants" :key="name" type="info" effect="plain">
            {{ name }}
          </el-tag>
        </div>
      </section>

      <section class="panel">
        <h3>会议备注</h3>
        <p>{{ meeting.notes || '暂无备注' }}</p>
      </section>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'
import { getMeetingById, getMeetingStatus } from '@/mock/meetings'

const route = useRoute()
const router = useRouter()

const meeting = computed(() => getMeetingById(route.params.id))
const status = computed(() => {
  if (!meeting.value) return 'finished'
  return getMeetingStatus(meeting.value)
})

const statusMap = {
  live: { label: '进行中', type: 'success' },
  upcoming: { label: '待开始', type: 'primary' },
  finished: { label: '已结束', type: 'info' }
}

const formatDateTime = (dateTime) => {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(dateTime))
}

const goBack = () => {
  router.push('/meetings')
}

const enterMeeting = () => {
  if (!meeting.value) return
  ElMessage.success(`进入会议室 ${meeting.value.roomCode}（演示）`)
}
</script>

<style lang="scss" scoped>
.detail-page {
  height: calc(100vh - 35px);
  overflow: auto;
  padding: 14px;
  background: linear-gradient(180deg, #f8fbff 0%, #ffffff 40%, #f7f9fc 100%);
}

.top-actions {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

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
  }
}

.grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 10px;
}

.panel {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 14px;
  margin-bottom: 10px;

  h3 {
    font-size: 16px;
    margin-bottom: 10px;
    color: #1e293b;
  }

  p {
    color: #475569;
    margin-bottom: 6px;
    line-height: 1.5;
  }
}

.agenda {
  padding-left: 16px;

  li {
    color: #334155;
    margin-bottom: 6px;
  }
}

.participants {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

@media (max-width: 760px) {
  .detail-page {
    padding: 10px;
  }

  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
