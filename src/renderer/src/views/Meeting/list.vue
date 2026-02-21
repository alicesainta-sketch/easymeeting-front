<template>
  <AppHeader title="EasyMeeting · 会议中心" :show-bottom-border="true"></AppHeader>
  <div class="workspace">
    <section class="hero">
      <div class="hero-main">
        <h2>欢迎回来，{{ displayName }}</h2>
        <p>当前为纯前端演示环境，会议数据来自本地 mock。</p>
      </div>
      <div class="hero-actions">
        <el-button type="primary" @click="createDialogVisible = true">新建会议</el-button>
        <el-button @click="logout">退出登录</el-button>
      </div>
    </section>

    <section class="toolbar">
      <el-input
        v-model.trim="keyword"
        class="search"
        clearable
        placeholder="搜索会议标题 / 主题 / 房间号"
      />
      <el-select v-model="statusFilter" class="status" placeholder="状态筛选">
        <el-option label="全部" value="all"></el-option>
        <el-option label="进行中" value="live"></el-option>
        <el-option label="待开始" value="upcoming"></el-option>
        <el-option label="已结束" value="finished"></el-option>
      </el-select>
      <el-button @click="refreshMeetings">刷新</el-button>
    </section>

    <section v-if="meetingItems.length" class="meeting-list">
      <MeetingCard
        v-for="meeting in meetingItems"
        :key="meeting.id"
        :meeting="meeting"
        :status-map="statusMap"
        :get-status="getStatus"
        :get-countdown-label="getCountdownLabel"
        :get-countdown-class="getCountdownClass"
        :format-time-range="formatTimeRange"
        @open="goDetail"
        @remind="manualRemind"
        @edit="openEditDialog"
        @remove="removeMeeting"
      ></MeetingCard>
    </section>
    <el-empty v-else description="没有符合条件的会议"></el-empty>

    <MeetingEditorDialog
      v-model="createDialogVisible"
      title="新建会议"
      submit-text="创建"
      :form="createForm"
      @submit="submitCreateMeeting"
    ></MeetingEditorDialog>

    <MeetingEditorDialog
      v-model="editDialogVisible"
      title="编辑会议"
      :form="editForm"
      @submit="submitEditMeeting"
    ></MeetingEditorDialog>
  </div>
</template>

<script setup>
import MeetingCard from './components/MeetingCard.vue'
import MeetingEditorDialog from './components/MeetingEditorDialog.vue'
import { useMeetingList } from './composables/useMeetingList'

const {
  displayName,
  keyword,
  statusFilter,
  meetingItems,
  statusMap,
  getStatus,
  getCountdownLabel,
  getCountdownClass,
  formatTimeRange,
  manualRemind,
  goDetail,
  createDialogVisible,
  createForm,
  submitCreateMeeting,
  editDialogVisible,
  editForm,
  openEditDialog,
  submitEditMeeting,
  removeMeeting,
  refreshMeetings,
  logout
} = useMeetingList()
</script>

<style lang="scss" scoped>
.workspace {
  height: calc(100vh - 35px);
  padding: 14px;
  overflow: auto;
  background: linear-gradient(180deg, #f4f8ff 0%, #ffffff 45%, #f8fafc 100%);
}

.hero {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  padding: 14px;
  border-radius: 12px;
  background: #fff;
  border: 1px solid #e6edf7;
  margin-bottom: 12px;

  h2 {
    font-size: 18px;
    color: #1f2937;
    margin-bottom: 4px;
  }

  p {
    font-size: 13px;
    color: #64748b;
  }
}

.hero-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.toolbar {
  display: grid;
  grid-template-columns: 1fr 150px auto;
  gap: 10px;
  margin-bottom: 12px;
}

.meeting-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 10px;
}

@media (max-width: 760px) {
  .workspace {
    padding: 10px;
  }

  .hero {
    flex-direction: column;
    align-items: flex-start;
  }

  .toolbar {
    grid-template-columns: 1fr;
  }
}
</style>
