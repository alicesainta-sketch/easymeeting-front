<template>
  <section class="grid">
    <article class="panel">
      <h3>基础信息</h3>
      <p><strong>房间号：</strong>{{ meeting.roomCode }}</p>
      <p><strong>主持人：</strong>{{ meeting.host }}</p>
      <p><strong>开始时间：</strong>{{ formatDateTime(meeting.startTime) }}</p>
      <p><strong>会议时长：</strong>{{ meeting.durationMinutes }} 分钟</p>
      <p><strong>参会人数：</strong>{{ meeting.participants.length }}</p>
      <p>
        <strong>入会密码：</strong>{{ meeting.roomPassword ? '已设置' : '未设置' }}
      </p>
      <p>
        <strong>会前入会：</strong
        >{{
          (meeting.allowParticipantEarlyJoin ?? true)
            ? '允许参会者提前入会'
            : '仅主持人/联席可入会'
        }}
      </p>
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
    <h3>等候室白名单</h3>
    <div v-if="meeting.waitingRoomWhitelist?.length" class="participants">
      <el-tag v-for="name in meeting.waitingRoomWhitelist" :key="name" type="warning" effect="plain">
        {{ name }}
      </el-tag>
    </div>
    <p v-else>未设置白名单成员</p>
  </section>

  <section class="panel">
    <h3>会议备注</h3>
    <p>{{ meeting.notes || '暂无备注' }}</p>
  </section>
</template>

<script setup>
defineProps({
  meeting: {
    type: Object,
    required: true
  },
  formatDateTime: {
    type: Function,
    required: true
  }
})
</script>

<style lang="scss" scoped>
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
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
